/**
 * T1.6 — M1 Telemetry Counters (Phase 4 EXIT GATE — E6 fix)
 * 
 * Minimal M1 counters MUST be emitting before Phase 4 closes.
 * model_policy.json triggers (latency_p95_breach, refusal_rate_breach)
 * are dead code without this data.
 *
 * Metrics tracked → Redis stream "telemetry:model-router":
 * - latency_ms per request
 * - refusal_count
 * - failover_hops
 * - cache_hits
 *
 * Full M1 (OTLP export, dashboards) remains post-launch (Appendix C).
 */

const TELEMETRY_STREAM = "telemetry:model-router";
const METRICS_HASH = "telemetry:counters";

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

// ─── Metric types ─────────────────────────────────────────────────────────────

export interface RequestMetric {
  request_id: string;
  model_id: string;
  tier: string;
  latency_ms: number;
  status: "success" | "refusal" | "error" | "fallback";
  failover_hops: number;
  cache_hit: boolean;
  security_critical: boolean;
  source_route: string;
  timestamp: string;
}

export interface TelemetrySummary {
  total_requests: number;
  total_refusals: number;
  total_errors: number;
  total_cache_hits: number;
  total_failover_hops: number;
  avg_latency_ms: number;
}

// ─── Emit metric ──────────────────────────────────────────────────────────────

/**
 * Emit a request metric to Redis stream + increment counters.
 * Non-blocking — failures logged, never thrown.
 */
export async function emitMetric(metric: RequestMetric): Promise<void> {
  try {
    const redis = await getRedis();

    // Stream entry — ordered, readable by dashboard
    await redis.xadd(TELEMETRY_STREAM, "*", metric as unknown as Record<string, unknown>);

    // Atomic counters
    const pipe = redis.pipeline();
    pipe.hincrbyfloat(METRICS_HASH, "total_requests", 1);
    pipe.hincrbyfloat(METRICS_HASH, "total_latency_ms", metric.latency_ms);
    pipe.hincrbyfloat(METRICS_HASH, "total_failover_hops", metric.failover_hops);

    if (metric.status === "refusal") pipe.hincrbyfloat(METRICS_HASH, "total_refusals", 1);
    if (metric.status === "error") pipe.hincrbyfloat(METRICS_HASH, "total_errors", 1);
    if (metric.cache_hit) pipe.hincrbyfloat(METRICS_HASH, "total_cache_hits", 1);

    await pipe.exec();
  } catch (err) {
    console.error("[observability] Failed to emit metric:", err);
  }
}

// ─── Read summary ─────────────────────────────────────────────────────────────

export async function getTelemetrySummary(): Promise<TelemetrySummary> {
  try {
    const redis = await getRedis();
    const raw = await redis.hgetall(METRICS_HASH);

    if (!raw) {
      return {
        total_requests: 0, total_refusals: 0, total_errors: 0,
        total_cache_hits: 0, total_failover_hops: 0, avg_latency_ms: 0,
      };
    }

    const total = Number(raw.total_requests ?? 0);
    const totalLatency = Number(raw.total_latency_ms ?? 0);

    return {
      total_requests: total,
      total_refusals: Number(raw.total_refusals ?? 0),
      total_errors: Number(raw.total_errors ?? 0),
      total_cache_hits: Number(raw.total_cache_hits ?? 0),
      total_failover_hops: Number(raw.total_failover_hops ?? 0),
      avg_latency_ms: total > 0 ? Math.round(totalLatency / total) : 0,
    };
  } catch (err) {
    console.error("[observability] Failed to read telemetry summary:", err);
    return {
      total_requests: 0, total_refusals: 0, total_errors: 0,
      total_cache_hits: 0, total_failover_hops: 0, avg_latency_ms: 0,
    };
  }
}

// ─── Recent stream entries (for dashboard) ────────────────────────────────────

export async function getRecentMetrics(count = 50): Promise<RequestMetric[]> {
  try {
    const redis = await getRedis();
    const entries = await redis.xrevrange(TELEMETRY_STREAM, "+", "-", count);
    return (entries as unknown as Array<{ id: string; fields: Record<string, unknown> }>).map(
      (entry) => entry.fields as unknown as RequestMetric
    );
  } catch {
    return [];
  }
}

// ─── Circuit breaker trigger checks ──────────────────────────────────────────
// E6: these triggers now have real data to fire on

export async function checkLatencyBreach(
  modelId: string,
  thresholdMs: number
): Promise<boolean> {
  try {
    const redis = await getRedis();
    const entries = await redis.xrevrange(TELEMETRY_STREAM, "+", "-", 10);
    const modelEntries = (entries as unknown as Array<{ id: string; fields: Record<string, unknown> }>)
      .map((entry) => entry.fields as unknown as RequestMetric)
      .filter((m: RequestMetric) => m.model_id === modelId && !m.cache_hit);

    if (modelEntries.length < 3) return false;
    const avg = modelEntries.reduce((s: number, m: RequestMetric) => s + m.latency_ms, 0) / modelEntries.length;
    return avg > thresholdMs;
  } catch {
    return false;
  }
}

export async function checkRefusalRateBreach(
  modelId: string,
  threshold: number
): Promise<boolean> {
  try {
    const redis = await getRedis();
    const entries = await redis.xrevrange(TELEMETRY_STREAM, "+", "-", 20);
    const modelEntries = (entries as unknown as Array<{ id: string; fields: Record<string, unknown> }>)
      .map((entry) => entry.fields as unknown as RequestMetric)
      .filter((m: RequestMetric) => m.model_id === modelId);

    if (modelEntries.length < 5) return false;
    const refusalRate = modelEntries.filter((m: RequestMetric) => m.status === "refusal").length / modelEntries.length;
    return refusalRate > threshold;
  } catch {
    return false;
  }
}
