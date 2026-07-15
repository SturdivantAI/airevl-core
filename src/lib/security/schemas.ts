/**
 * T1.2 — Zero-Trust Request Schemas
 * security_critical: true — only runs on Primary or Failover-1 tier models
 *
 * These Zod schemas are the executable runtime derivation of the OKF
 * entity.schema.json and inference.schema.json. They are the single
 * enforcement point for all /api/agent/* and /api/contact/* payloads.
 *
 * Rule: Never bypass these schemas. All streaming payloads are hostile
 * until proven otherwise.
 */

import { z } from "zod";

// ─── OKF version pin ────────────────────────────────────────────────────────
export const OKF_VERSION = "1.0.0";

// ─── Primitives ─────────────────────────────────────────────────────────────

/** Safely bounded string — prevents oversized payloads */
const SafeString = (maxLen = 4096) =>
  z.string().min(1).max(maxLen).trim();

/** ISO 8601 timestamp */
const Timestamp = z.string().datetime({ offset: true });

/** SHA-256 hex hash */
const HashHex = z.string().regex(/^[0-9a-f]{64}$/i, "Invalid SHA-256 hash");

// ─── Model tier ─────────────────────────────────────────────────────────────
export const ModelTierSchema = z.enum([
  "primary",
  "failover-1",
  "failover-2",
  "diversity-1",
  "diversity-2",
]);
export type ModelTier = z.infer<typeof ModelTierSchema>;

// ─── Agent request (all /api/agent/* routes) ────────────────────────────────
export const AgentRequestSchema = z.object({
  /** Caller-supplied idempotency key */
  request_id: z.string().uuid(),
  /** Prompt or task description — bounded, will be sanitized before use */
  prompt: SafeString(8192),
  /** Optional skill ID to invoke */
  skill_id: z.string().max(128).optional(),
  /** Whether this task touches the security layer */
  security_critical: z.boolean().default(false),
  /** Caller metadata — never stored raw */
  metadata: z
    .object({
      source_route: SafeString(256),
      session_id: z.string().uuid().optional(),
    })
    .optional(),
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

// ─── Agent response ──────────────────────────────────────────────────────────
export const AgentResponseSchema = z.object({
  request_id: z.string().uuid(),
  model_id: SafeString(128),
  tier: ModelTierSchema,
  output: SafeString(32768),
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  status: z.enum(["success", "refusal", "error", "fallback"]),
  failover_hops: z.number().int().nonnegative().default(0),
  cache_hit: z.boolean().default(false),
  parity_score: z.number().min(0).max(1).optional(),
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// ─── Contact form ────────────────────────────────────────────────────────────
export const ContactRequestSchema = z.object({
  name: SafeString(128),
  email: z.string().email().max(254),
  subject: SafeString(256),
  message: SafeString(2048),
  /** Honeypot — must be empty */
  website: z.string().max(0).optional(),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

// ─── Sanitize request ────────────────────────────────────────────────────────
export const SanitizeRequestSchema = z.object({
  request_id: z.string().uuid(),
  payload: SafeString(8192),
  context: z.enum(["financial", "general", "training"]).default("general"),
});
export type SanitizeRequest = z.infer<typeof SanitizeRequestSchema>;

export const SanitizeResponseSchema = z.object({
  request_id: z.string().uuid(),
  sanitized_payload_hash: HashHex,
  pii_fields_removed: z.array(z.string()),
  injection_patterns_found: z.array(z.string()),
  outcome: z.enum(["clean", "sanitized", "blocked"]),
  latency_ms: z.number().int().nonnegative(),
});
export type SanitizeResponse = z.infer<typeof SanitizeResponseSchema>;

// ─── OKF Audit event ─────────────────────────────────────────────────────────
export const AuditEventSchema = z.object({
  okfVersion: z.literal(OKF_VERSION),
  event_id: z.string().uuid(),
  timestamp: Timestamp,
  event_type: z.enum([
    "refusal",
    "injection_attempt",
    "schema_violation",
    "parity_failure",
    "circuit_open",
    "circuit_close",
    "rate_limit",
    "auth_failure",
  ]),
  source_route: SafeString(256),
  outcome: z.enum(["blocked", "logged", "flagged", "passed"]),
  model_id: SafeString(128).optional(),
  tier: ModelTierSchema.optional(),
  /** SHA-256 of sanitized payload — NEVER the raw payload */
  sanitized_payload_hash: HashHex.optional(),
  notes: SafeString(512).optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ─── OKF Inference event ─────────────────────────────────────────────────────
export const InferenceEventSchema = z.object({
  okfVersion: z.literal(OKF_VERSION),
  request_id: z.string().uuid(),
  model_id: SafeString(128),
  tier: ModelTierSchema,
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  status: z.enum(["success", "refusal", "error", "fallback"]),
  failover_hops: z.number().int().nonnegative().default(0),
  cache_hit: z.boolean().default(false),
  parity_score: z.number().min(0).max(1).optional(),
  security_critical: z.boolean().default(false),
});
export type InferenceEvent = z.infer<typeof InferenceEventSchema>;

// ─── Skill spec ──────────────────────────────────────────────────────────────
export const SkillSpecSchema = z.object({
  okfVersion: z.literal(OKF_VERSION),
  entityType: z.literal("skill"),
  id: SafeString(128),
  name: SafeString(128),
  description: SafeString(512),
  input_schema: z.record(z.string(), z.unknown()),
  output_schema: z.record(z.string(), z.unknown()),
  cache_ttl_ms: z.number().int().nonnegative().default(60000),
});
export type SkillSpec = z.infer<typeof SkillSpecSchema>;

// ─── Validation helpers ──────────────────────────────────────────────────────

/** Parse and throw with a structured 422 payload on failure */
export function parseOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  source_route: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new SchemaValidationError(
      result.error.flatten(),
      source_route
    );
  }
  return result.data;
}

export class SchemaValidationError extends Error {
  public readonly issues: z.ZodFlattenedError<unknown>;
  public readonly source_route: string;

  constructor(
    issues: z.ZodFlattenedError<unknown>,
    source_route: string
  ) {
    super("Schema validation failed");
    this.name = "SchemaValidationError";
    this.issues = issues;
    this.source_route = source_route;
  }
}
