/**
 * T1.5 — Load-on-Demand Skill Engine
 * 
 * Caches skill function specs in Upstash/Redis to minimize token overhead.
 * Skills are OKF-valid entities (entityType: "skill") validated against
 * okf-bundle/schemas/entity.schema.json via the SkillSpecSchema.
 */

import { SkillSpecSchema, type SkillSpec } from "../security/schemas";

const SKILL_KEY = (id: string) => `skill:${id}`;
const SKILL_TTL_MS = 60_000; // default 60s, overridden by skill's cache_ttl_ms

// ─── Lazy Redis ───────────────────────────────────────────────────────────────
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

// ─── In-memory fallback (cold-start resilience) ───────────────────────────────
const memCache = new Map<string, { spec: SkillSpec; expiresAt: number }>();

// ─── Core operations ──────────────────────────────────────────────────────────

/**
 * Register a skill spec — validates against OKF SkillSpec schema,
 * then caches in Redis + memory.
 */
export async function registerSkill(raw: unknown): Promise<SkillSpec> {
  const spec = SkillSpecSchema.parse(raw);
  const ttlMs = spec.cache_ttl_ms ?? SKILL_TTL_MS;

  // Memory cache
  memCache.set(spec.id, { spec, expiresAt: Date.now() + ttlMs });

  // Redis cache
  try {
    const redis = await getRedis();
    await redis.set(SKILL_KEY(spec.id), spec, { px: ttlMs });
  } catch (err) {
    console.warn("[skill-engine] Redis cache write failed, using memory only:", err);
  }

  return spec;
}

/**
 * Load a skill spec by ID.
 * Order: memory cache → Redis → not found
 */
export async function loadSkill(id: string): Promise<SkillSpec | null> {
  // Memory cache hit
  const mem = memCache.get(id);
  if (mem && mem.expiresAt > Date.now()) return mem.spec;

  // Redis lookup
  try {
    const redis = await getRedis();
    const raw = await redis.get<SkillSpec>(SKILL_KEY(id));
    if (raw) {
      const spec = SkillSpecSchema.parse(raw);
      memCache.set(id, { spec, expiresAt: Date.now() + (spec.cache_ttl_ms ?? SKILL_TTL_MS) });
      return spec;
    }
  } catch (err) {
    console.warn("[skill-engine] Redis read failed:", err);
  }

  return null;
}

/**
 * Evict a skill from all caches.
 */
export async function evictSkill(id: string): Promise<void> {
  memCache.delete(id);
  try {
    const redis = await getRedis();
    await redis.del(SKILL_KEY(id));
  } catch {
    // Non-fatal
  }
}

/**
 * List all skill IDs currently in memory cache (for diagnostics).
 */
export function listCachedSkillIds(): string[] {
  const now = Date.now();
  return [...memCache.entries()]
    .filter(([, v]) => v.expiresAt > now)
    .map(([k]) => k);
}

// ─── Built-in skill registry ──────────────────────────────────────────────────
// Seed skills are registered at startup. Phase 6: load from Supabase.

export const BUILT_IN_SKILLS: unknown[] = [
  {
    okfVersion: "1.0.0",
    entityType: "skill",
    id: "sanitize-payload",
    name: "Sanitize Payload",
    description: "Strip PII and detect injection patterns from a financial payload.",
    input_schema: { type: "object", properties: { payload: { type: "string" }, context: { type: "string" } } },
    output_schema: { type: "object", properties: { sanitized_payload_hash: { type: "string" }, outcome: { type: "string" } } },
    cache_ttl_ms: 300_000,
  },
  {
    okfVersion: "1.0.0",
    entityType: "skill",
    id: "llm-judge",
    name: "LLM-as-a-Judge",
    description: "Evaluate a model output against a rubric. Returns a parity score 0–1.",
    input_schema: { type: "object", properties: { output: { type: "string" }, rubric: { type: "string" } } },
    output_schema: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } } },
    cache_ttl_ms: 60_000,
  },
  {
    okfVersion: "1.0.0",
    entityType: "skill",
    id: "telemetry-parse",
    name: "Telemetry Parser",
    description: "Parse IoT telemetry packet and flag anomalies.",
    input_schema: { type: "object", properties: { packet: { type: "string" } } },
    output_schema: { type: "object", properties: { anomaly: { type: "boolean" }, parsed: { type: "object" } } },
    cache_ttl_ms: 30_000,
  },
];

/** Call at app startup to seed the skill cache */
export async function seedBuiltInSkills(): Promise<void> {
  for (const skill of BUILT_IN_SKILLS) {
    try {
      await registerSkill(skill);
    } catch (err) {
      console.error("[skill-engine] Failed to seed skill:", err);
    }
  }
}
