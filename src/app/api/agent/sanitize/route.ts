/**
 * T2.3 — Sanitize API Route
 * POST /api/agent/sanitize
 * PII scrubbing endpoint — returns sanitized payload hash, never raw content.
 * NDPA 2023 / CBN Data Localization 2027 compliance.
 */

import { NextRequest, NextResponse } from "next/server";
import { SanitizeRequestSchema, type SanitizeResponse } from "@/lib/security/schemas";
import { handleSchemaViolation, handleInjectionAttempt } from "@/lib/security/guard";
import { sanitizePayload } from "@/lib/security/sanitize";

export async function POST(req: NextRequest) {
  const source_route = "/api/agent/sanitize";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Schema validation
  const parsed = SanitizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    const result = await handleSchemaViolation(
      source_route,
      JSON.stringify(parsed.error.flatten())
    );
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { request_id, payload } = parsed.data;

  // Run sanitization pipeline
  const result = sanitizePayload(payload);

  // If injection detected, emit audit event and block
  if (result.outcome === "blocked") {
    const auditResult = await handleInjectionAttempt(
      source_route,
      result.injectionPatternsFound,
      result.sanitizedPayloadHash
    );
    return NextResponse.json(
      { error: auditResult.error, event_id: auditResult.event_id },
      { status: auditResult.status }
    );
  }

  const response: SanitizeResponse = {
    request_id,
    sanitized_payload_hash: result.sanitizedPayloadHash,
    pii_fields_removed: result.piiFieldsRemoved,
    injection_patterns_found: result.injectionPatternsFound,
    outcome: result.outcome,
    latency_ms: result.latencyMs,
  };

  return NextResponse.json(response, { status: 200 });
}
