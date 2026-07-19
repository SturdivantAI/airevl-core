/**
 * POST /api/contact
 * Validates with Zod, sanitizes for injection/PII, rate-limits, then forwards to Formspree.
 * Zero DNS changes required — Formspree handles delivery to contact@airevl.ai.
 *
 * Rate limit: 30 requests per 60s window per IP (model_policy rate_limit spec).
 * Degradation rule: if Redis env missing or errors → fall back to in-memory limiter, never 500.
 */

import { NextRequest, NextResponse } from "next/server";
import { ContactRequestSchema } from "@/lib/security/schemas";
import { handleSchemaViolation, handleInjectionAttempt } from "@/lib/security/guard";
import { sanitizePayload } from "@/lib/security/sanitize";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwvgvqaz";

// ─── Rate Limit Config ────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 30;

// ─── In-memory fallback limiter ───────────────────────────────────────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryLimiter(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(ip);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_S * 1000 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ─── Redis-backed limiter (graceful fallback) ─────────────────────────────────
async function rateLimitCheck(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Env not configured — degrade to memory limiter
    return memoryLimiter(ip);
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    const key = `ratelimit:contact:${ip}`;

    const current = await redis.incr(key);

    if (current === 1) {
      // First request in this window — set expiry
      await redis.expire(key, RATE_LIMIT_WINDOW_S);
    }

    if (current > RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX - current };
  } catch (err) {
    // Redis failure — degrade gracefully to in-memory, never 500
    console.warn("[contact] Rate limiter Redis error, falling back to memory:", err);
    return memoryLimiter(ip);
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const source_route = "/api/contact";

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateResult = await rateLimitCheck(ip);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Schema validation
  const parsed = ContactRequestSchema.safeParse(body);
  if (!parsed.success) {
    const result = await handleSchemaViolation(
      source_route,
      JSON.stringify(parsed.error.flatten())
    );
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { name, email, subject, message, website } = parsed.data;

  // Honeypot check — if filled, silently accept-and-drop
  if (website && website.length > 0) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Injection + PII check on message
  const sanitized = sanitizePayload(message);
  if (sanitized.outcome === "blocked") {
    const result = await handleInjectionAttempt(
      source_route,
      sanitized.injectionPatternsFound,
      sanitized.sanitizedPayloadHash
    );
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Forward to Formspree
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        organization: subject,
        message: sanitized.sanitizedText,
        _replyto: email,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[contact] Formspree error:", err);
      return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
