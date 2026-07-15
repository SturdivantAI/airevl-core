/**
 * T2.4 — Redis-Backed Circuit Breaker (E4 fix)
 * security_critical: true
 *
 * Breaker state MUST be shared across serverless instances.
 * Module-level state resets on every cold start — useless in production.
 * State is persisted in Upstash Redis: key = breaker:<model_id>
 * TTL = cooldown_ms so the key auto-expires when the breaker resets.
 */

import { emitAuditEvent } from "../security/guard";
import type { ModelTier } from "../security/schemas";

export type BreakerState = "closed" | "open" | "half-open";

interface BreakerConfig {
  error_threshold: number;   // fraction e.g. 0.4
  cooldown_ms: number;       // e.g. 30000
  half_open_probes: number;  // e.g. 1
}

const BREAKER_KEY = (modelId: string) => `breaker:${modelId}`;
const ERROR_COUNT_KEY = (modelId: string) => `breaker_errors:${modelId}`;
const TOTAL_COUNT_KEY = (modelId: string) => `breaker_total:${modelId}`;

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

// ─── State read/write ─────────────────────────────────────────────────────────

export async function getBreakerState(modelId: string): Promise<BreakerState> {
  try {
    const redis = await getRedis();
    const state = await redis.get<BreakerState>(BREAKER_KEY(modelId));
    return state ?? "closed";
  } catch {
    // If Redis is unavailable, default to closed (fail-open for availability)
    return "closed";
  }
}

async function setBreakerState(
  modelId: string,
  state: BreakerState,
  ttlMs: number,
  config: BreakerConfig
): Promise<void> {
  try {
    const redis = await getRedis();
    if (state === "open") {
      // TTL = cooldown_ms — auto-transitions to half-open on expiry
      await redis.set(BREAKER_KEY(modelId), "open", { px: ttlMs });
    } else if (state === "half-open") {
      await redis.set(BREAKER_KEY(modelId), "half-open", { px: config.cooldown_ms });
    } else {
      // closed — remove the key entirely
      await redis.del(BREAKER_KEY(modelId));
      await redis.del(ERROR_COUNT_KEY(modelId));
      await redis.del(TOTAL_COUNT_KEY(modelId));
    }
  } catch (err) {
    console.error("[circuit-breaker] Failed to set state in Redis:", err);
  }
}

// ─── Record call outcome ──────────────────────────────────────────────────────

export async function recordSuccess(
  modelId: string,
  tier: ModelTier,
  source_route: string,
  config: BreakerConfig
): Promise<void> {
  const state = await getBreakerState(modelId);
  if (state === "half-open") {
    // Probe succeeded — close the breaker
    await setBreakerState(modelId, "closed", 0, config);
    await emitAuditEvent({
      event_type: "circuit_close",
      source_route,
      outcome: "passed",
      model_id: modelId,
      tier,
      notes: "Half-open probe succeeded — breaker closed",
    });
  }
}

export async function recordFailure(
  modelId: string,
  tier: ModelTier,
  source_route: string,
  config: BreakerConfig
): Promise<void> {
  const state = await getBreakerState(modelId);
  if (state === "open") return; // already open

  try {
    const redis = await getRedis();
    const windowMs = 60_000; // 1-minute rolling window

    const errors = await redis.incr(ERROR_COUNT_KEY(modelId));
    await redis.pexpire(ERROR_COUNT_KEY(modelId), windowMs);
    const total = await redis.incr(TOTAL_COUNT_KEY(modelId));
    await redis.pexpire(TOTAL_COUNT_KEY(modelId), windowMs);

    const errorRate = total > 0 ? errors / total : 0;

    if (errorRate >= config.error_threshold && total >= 5) {
      await setBreakerState(modelId, "open", config.cooldown_ms, config);
      await emitAuditEvent({
        event_type: "circuit_open",
        source_route,
        outcome: "flagged",
        model_id: modelId,
        tier,
        notes: `Error rate ${(errorRate * 100).toFixed(1)}% exceeded threshold ${(config.error_threshold * 100).toFixed(0)}%`,
      });
    }
  } catch (err) {
    console.error("[circuit-breaker] Failed to record failure:", err);
  }
}

/** Returns true if a request should be allowed through */
export async function canRequest(modelId: string): Promise<boolean> {
  const state = await getBreakerState(modelId);
  // closed: allow; half-open: allow (probe); open: block
  return state !== "open";
}
