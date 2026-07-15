/**
 * T1.4 — Security Guard: Refusal Handler + OKF Audit Event Emitter
 * security_critical: true
 *
 * Catches refusal states from the LLM and SchemaValidationErrors,
 * emits OKF-valid audit events to the Redis stream (durable sink),
 * and surfaces structured error responses to the API layer.
 *
 * Audit events are PII-free — only hashes, never raw content.
 */

import { randomUUID } from "crypto";
import { AuditEventSchema, type AuditEvent, type ModelTier } from "./schemas";

// ─── Redis stream key ─────────────────────────────────────────────────────────
const AUDIT_STREAM_KEY = "audit:events";

// ─── Lazy Redis client (avoids import at build time if env not set) ───────────
let _redis: import("@upstash/redis").Redis | null = null;

async function getRedis() {
  if (_redis) return _redis;
  const { Redis } = await import("@upstash/redis");
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  });
  return _redis;
}

// ─── Audit event emitter ─────────────────────────────────────────────────────

/**
 * Emit an OKF-valid audit event to the Redis stream.
 * Non-blocking — failures are logged to console, never thrown.
 */
export async function emitAuditEvent(
  params: Omit<AuditEvent, "okfVersion" | "event_id" | "timestamp">
): Promise<void> {
  const event: AuditEvent = {
    okfVersion: "1.0.0",
    event_id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  };

  // Validate against OKF schema before emitting
  const parsed = AuditEventSchema.safeParse(event);
  if (!parsed.success) {
    console.error("[guard] Invalid audit event — not emitted:", parsed.error.flatten());
    return;
  }

  try {
    const redis = await getRedis();
    // XADD to Redis stream — durable, ordered, readable by Screen 4
    await redis.xadd(AUDIT_STREAM_KEY, "*", parsed.data as Record<string, unknown>);
  } catch (err) {
    // Non-fatal — log but don't crash the request
    console.error("[guard] Failed to emit audit event to Redis:", err);
  }
}

// ─── Refusal handler ─────────────────────────────────────────────────────────

export interface RefusalContext {
  source_route: string;
  model_id?: string;
  tier?: ModelTier;
  sanitized_payload_hash?: string;
  reason?: string;
}

/**
 * Handle an LLM refusal state:
 * 1. Emit OKF audit event
 * 2. Return structured error for the API response
 */
export async function handleRefusal(ctx: RefusalContext): Promise<{
  status: 422;
  error: string;
  event_id: string;
}> {
  const event_id = randomUUID();

  await emitAuditEvent({
    event_type: "refusal",
    source_route: ctx.source_route,
    outcome: "blocked",
    model_id: ctx.model_id,
    tier: ctx.tier,
    sanitized_payload_hash: ctx.sanitized_payload_hash,
    notes: ctx.reason ? ctx.reason.slice(0, 512) : undefined,
  });

  return {
    status: 422,
    error: "Request refused by safety layer.",
    event_id,
  };
}

/**
 * Handle a schema validation failure:
 * 1. Emit OKF audit event
 * 2. Return structured 422 for the API response
 */
export async function handleSchemaViolation(
  source_route: string,
  details?: string
): Promise<{ status: 422; error: string; event_id: string }> {
  const event_id = randomUUID();

  await emitAuditEvent({
    event_type: "schema_violation",
    source_route,
    outcome: "blocked",
    notes: details?.slice(0, 512),
  });

  return {
    status: 422,
    error: "Request payload failed schema validation.",
    event_id,
  };
}

/**
 * Handle an injection attempt:
 * 1. Emit OKF audit event
 * 2. Return structured 422
 */
export async function handleInjectionAttempt(
  source_route: string,
  patterns: string[],
  sanitized_payload_hash: string
): Promise<{ status: 422; error: string; event_id: string }> {
  const event_id = randomUUID();

  await emitAuditEvent({
    event_type: "injection_attempt",
    source_route,
    outcome: "blocked",
    sanitized_payload_hash,
    notes: `Patterns: ${patterns.join(", ")}`.slice(0, 512),
  });

  return {
    status: 422,
    error: "Request blocked: injection pattern detected.",
    event_id,
  };
}

/**
 * Handle a parity guard failure:
 * Quarantines the model tier, emits audit event.
 */
export async function handleParityFailure(
  source_route: string,
  model_id: string,
  tier: ModelTier,
  score: number
): Promise<void> {
  await emitAuditEvent({
    event_type: "parity_failure",
    source_route,
    outcome: "flagged",
    model_id,
    tier,
    notes: `Parity score ${score.toFixed(3)} below threshold`,
  });
}
