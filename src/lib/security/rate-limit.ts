/**
 * Shared IP rate limiter for public API routes.
 *
 * Upstash Redis when configured, in-memory otherwise. The in-memory path is a
 * degradation, not an equivalent: serverless instances do not share memory, so
 * it bounds abuse per lambda only. Redis env is what makes the limit real.
 *
 * Degradation rule (house style): missing env or a Redis error falls back to
 * memory and logs a warning. A limiter never 500s a route.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface RateLimiterOptions {
  /** Namespace for the Redis key and the memory store, e.g. "contact". */
  scope: string;
  windowSeconds: number;
  max: number;
}

/** One memory store per scope, so limits never bleed between routes. */
const memoryStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function memoryLimiter(opts: RateLimiterOptions, ip: string): RateLimitResult {
  let store = memoryStores.get(opts.scope);
  if (!store) {
    store = new Map();
    memoryStores.set(opts.scope, store);
  }

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + opts.windowSeconds * 1000 });
    return { allowed: true, remaining: opts.max - 1 };
  }

  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: opts.max - entry.count };
}

/** Returns a checker bound to one scope/window/max. */
export function createRateLimiter(opts: RateLimiterOptions) {
  return async function check(ip: string): Promise<RateLimitResult> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return memoryLimiter(opts, ip);
    }

    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token });
      const key = `ratelimit:${opts.scope}:${ip}`;

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, opts.windowSeconds);
      }
      if (current > opts.max) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: opts.max - current };
    } catch (err) {
      console.warn(`[${opts.scope}] Rate limiter Redis error, falling back to memory:`, err);
      return memoryLimiter(opts, ip);
    }
  };
}

/** First hop in x-forwarded-for, or "unknown" when the header is absent. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
