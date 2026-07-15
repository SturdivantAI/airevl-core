/**
 * T1.1 — ModelRouter
 * security_critical: true (for security_critical tasks)
 *
 * Provider-agnostic model router. No component or route ever names
 * a model directly — all reasoning calls go through this module.
 * Config lives in /config/model_policy.json.
 *
 * Failover chain: Fable 5 → Opus 4.8 → Sonnet 4.6 → Grok 4.3 → Grok 4.20
 * Security gate: security_critical tasks MUST NOT use Sonnet or Grok tiers.
 */

import modelPolicy from "../../../config/model_policy.json";
import {
  AgentRequestSchema,
  AgentResponseSchema,
  InferenceEventSchema,
  type AgentRequest,
  type AgentResponse,
  type ModelTier,
  OKF_VERSION,
} from "../security/schemas";
import {
  getBreakerState,
  recordSuccess,
  recordFailure,
  canRequest,
} from "./circuit-breaker";
import { checkParityRuntime, cacheLastGood, getLastGood } from "./parity-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelEntry {
  id: string;
  provider: string;
  tier: ModelTier;
  security_critical: boolean;
  timeout_ms: number;
  max_retries: number;
  base_url?: string;
}

interface RouterConfig {
  chain: ModelEntry[];
  circuit_breaker: {
    error_threshold: number;
    cooldown_ms: number;
    half_open_probes: number;
  };
  parity_guard: {
    judge_model: string;
    min_score: number;
    enforce_schema: boolean;
    runtime_mode: "async_sampled" | "sync";
    build_loop_mode: "sync";
  };
  cache: {
    provider: string;
    stale_while_revalidate_ms: number;
  };
}

const config = modelPolicy as RouterConfig;

// ─── Lazy Redis (for response cache) ─────────────────────────────────────────
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

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function getCachedResponse(cacheKey: string): Promise<AgentResponse | null> {
  try {
    const redis = await getRedis();
    return await redis.get<AgentResponse>(cacheKey);
  } catch {
    return null;
  }
}

async function setCachedResponse(
  cacheKey: string,
  response: AgentResponse
): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(cacheKey, response, {
      px: config.cache.stale_while_revalidate_ms,
    });
  } catch (err) {
    console.error("[model-router] Cache write failed:", err);
  }
}

// ─── Telemetry emitter ────────────────────────────────────────────────────────

async function emitInferenceEvent(
  event: Omit<import("../security/schemas").InferenceEvent, "okfVersion">
): Promise<void> {
  const full = { okfVersion: OKF_VERSION, ...event };
  const parsed = InferenceEventSchema.safeParse(full);
  if (!parsed.success) return;

  try {
    const redis = await getRedis();
    await redis.xadd(
      "telemetry:model-router",
      "*",
      parsed.data as Record<string, unknown>
    );
  } catch {
    // Non-fatal
  }
}

// ─── Core invoke ──────────────────────────────────────────────────────────────

export interface InvokeOptions {
  request: AgentRequest;
  source_route: string;
  /** If true, attempt Redis cache lookup first */
  cacheable?: boolean;
}

export interface InvokeResult {
  response: AgentResponse;
  fromCache: boolean;
  failoverHops: number;
}

/**
 * Invoke the model chain. Tries each tier in order, respecting:
 * - Circuit breaker state (Redis-backed, E4)
 * - Security gate (security_critical tasks skip Sonnet + Grok)
 * - Parity guard (schema sync + async LLM judge, E5)
 * - Redis response cache (stale-while-revalidate)
 */
export async function invoke(options: InvokeOptions): Promise<InvokeResult> {
  const { request, source_route, cacheable = false } = options;

  // Validate request
  AgentRequestSchema.parse(request);

  const cacheKey = cacheable
    ? `response:${request.skill_id ?? "prompt"}:${Buffer.from(request.prompt).toString("base64").slice(0, 64)}`
    : null;

  // Cache lookup
  if (cacheKey) {
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return { response: { ...cached, cache_hit: true }, fromCache: true, failoverHops: 0 };
    }
  }

  let failoverHops = 0;
  const errors: string[] = [];

  for (const model of config.chain) {
    // Security gate: block lower tiers for security_critical tasks
    if (request.security_critical && !model.security_critical) {
      continue;
    }

    // Circuit breaker check
    const allowed = await canRequest(model.id);
    if (!allowed) {
      errors.push(`${model.id}: circuit open`);
      failoverHops++;
      continue;
    }

    try {
      const startMs = Date.now();
      const rawResponse = await callModel(model, request, source_route);
      const latencyMs = Date.now() - startMs;

      // Parity check
      const parity = await checkParityRuntime({
        response: rawResponse,
        modelId: model.id,
        tier: model.tier,
        source_route,
        config: config.parity_guard,
      });

      if (!parity.pass) {
        // Serve stale if available
        if (parity.serveStale && parity.cached) {
          return {
            response: parity.cached as AgentResponse,
            fromCache: true,
            failoverHops,
          };
        }
        failoverHops++;
        continue;
      }

      const response = AgentResponseSchema.parse({
        ...rawResponse,
        latency_ms: latencyMs,
        failover_hops: failoverHops,
        cache_hit: false,
      });

      // Record success + emit telemetry
      await recordSuccess(model.id, model.tier, source_route, config.circuit_breaker);
      await emitInferenceEvent({
        request_id: request.request_id,
        model_id: model.id,
        tier: model.tier,
        prompt_tokens: response.prompt_tokens,
        completion_tokens: response.completion_tokens,
        latency_ms: latencyMs,
        status: "success",
        failover_hops: failoverHops,
        cache_hit: false,
        security_critical: request.security_critical,
      });

      // Cache result
      if (cacheKey) await setCachedResponse(cacheKey, response);
      cacheLastGood(model.id, response);

      return { response, fromCache: false, failoverHops };

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`${model.id}: ${errMsg}`);
      await recordFailure(model.id, model.tier, source_route, config.circuit_breaker);
      await emitInferenceEvent({
        request_id: request.request_id,
        model_id: model.id,
        tier: model.tier,
        prompt_tokens: 0,
        completion_tokens: 0,
        latency_ms: 0,
        status: "error",
        failover_hops: failoverHops,
        cache_hit: false,
        security_critical: request.security_critical,
      });
      failoverHops++;
    }
  }

  // All tiers exhausted — serve stale if possible
  const stale = getLastGood(config.chain[0]?.id ?? "");
  if (stale) {
    console.warn("[model-router] All tiers failed, serving stale-while-revalidate");
    return { response: stale as AgentResponse, fromCache: true, failoverHops };
  }

  throw new Error(
    `[ModelRouter] All tiers exhausted after ${failoverHops} hops. Errors: ${errors.join("; ")}`
  );
}

// ─── Model call dispatcher ────────────────────────────────────────────────────

async function callModel(
  model: ModelEntry,
  request: AgentRequest,
  source_route: string
): Promise<Partial<AgentResponse>> {
  // Route by provider — uses provider-agnostic interface
  // In Phase 4/5 this returns mock-structured output for non-live builds
  // Phase 6: swap to real provider SDK calls

  if (model.provider === "anthropic") {
    return callAnthropic(model, request);
  } else if (model.provider === "xai") {
    return callXai(model, request);
  }

  throw new Error(`Unknown provider: ${model.provider}`);
}

async function callAnthropic(
  model: ModelEntry,
  request: AgentRequest
): Promise<Partial<AgentResponse>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), model.timeout_ms);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: 4096,
        messages: [{ role: "user", content: request.prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return {
      request_id: request.request_id,
      model_id: model.id,
      tier: model.tier,
      output: data.content?.[0]?.text ?? "",
      prompt_tokens: data.usage?.input_tokens ?? 0,
      completion_tokens: data.usage?.output_tokens ?? 0,
      status: "success",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callXai(
  model: ModelEntry,
  request: AgentRequest
): Promise<Partial<AgentResponse>> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not set");

  const baseUrl = model.base_url ?? "https://api.x.ai/v1";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), model.timeout_ms);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: request.prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`xAI ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return {
      request_id: request.request_id,
      model_id: model.id,
      tier: model.tier,
      output: data.choices?.[0]?.message?.content ?? "",
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      status: "success",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export { getBreakerState } from "./circuit-breaker";
