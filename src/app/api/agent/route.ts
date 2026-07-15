/**
 * T2.2 — Agent API Route
 * POST /api/agent
 * All reasoning calls go through ModelRouter — no model named directly.
 * Zod validation, injection check, refusal logging.
 */

import { NextRequest, NextResponse } from "next/server";
import { AgentRequestSchema } from "@/lib/security/schemas";
import {
  handleSchemaViolation,
  handleRefusal,
  handleInjectionAttempt,
} from "@/lib/security/guard";
import { sanitizePayload } from "@/lib/security/sanitize";
import { invoke } from "@/lib/model-router";
import { emitMetric } from "@/lib/observability";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const source_route = "/api/agent";
  const startMs = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Schema validation
  const parsed = AgentRequestSchema.safeParse(body);
  if (!parsed.success) {
    const result = await handleSchemaViolation(
      source_route,
      JSON.stringify(parsed.error.flatten())
    );
    return NextResponse.json({ error: result.error, event_id: result.event_id }, { status: result.status });
  }

  const request = parsed.data;

  // Ensure request_id is set
  if (!request.request_id) {
    (request as Record<string, unknown>).request_id = randomUUID();
  }

  // Sanitize prompt
  const sanitized = sanitizePayload(request.prompt);
  if (sanitized.outcome === "blocked") {
    const result = await handleInjectionAttempt(
      source_route,
      sanitized.injectionPatternsFound,
      sanitized.sanitizedPayloadHash
    );
    return NextResponse.json({ error: result.error, event_id: result.event_id }, { status: result.status });
  }

  // Route through ModelRouter
  try {
    const { response, fromCache, failoverHops } = await invoke({
      request: { ...request, prompt: sanitized.sanitizedText || request.prompt },
      source_route,
      cacheable: !request.security_critical,
    });

    // Emit M1 telemetry
    await emitMetric({
      request_id: request.request_id,
      model_id: response.model_id,
      tier: response.tier,
      latency_ms: Date.now() - startMs,
      status: response.status,
      failover_hops: failoverHops,
      cache_hit: fromCache,
      security_critical: request.security_critical,
      source_route,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";

    // Check if it's a refusal
    if (errMsg.toLowerCase().includes("refus")) {
      const result = await handleRefusal({
        source_route,
        reason: errMsg,
      });
      return NextResponse.json({ error: result.error, event_id: result.event_id }, { status: result.status });
    }

    console.error("[agent] ModelRouter error:", errMsg);
    return NextResponse.json({ error: "Agent invocation failed." }, { status: 500 });
  }
}
