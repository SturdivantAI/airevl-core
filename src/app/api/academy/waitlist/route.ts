/**
 * POST /api/academy/waitlist
 * Tier 2/3 waitlist capture. Validates with Zod, rate-limits per IP (Upstash Redis
 * with in-memory fallback), drops honeypot submissions, then writes to Supabase
 * academy_waitlist via service_role.
 * Degradation rule: if Supabase env is missing or insert fails, forward to
 * Formspree (same channel as /api/contact) so no lead is ever dropped. Never 500.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter, clientIp } from "@/lib/security/rate-limit";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwvgvqaz";

const WaitlistSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(120),
  tier_id: z.enum(["automation-fluency", "automation-pro"]),
  organisation: z.string().max(160).optional(),
  /** Honeypot — hidden from humans, filled by naive bots. Same field name as /api/contact. */
  website: z.string().max(200).optional(),
});

// ─── Rate limit: 10 requests / 60s per IP ─────────────────────────────────────
const rateLimitCheck = createRateLimiter({
  scope: "academy-waitlist",
  windowSeconds: 60,
  max: 10,
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rate = await rateLimitCheck(ip);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
  }

  const { email, name, tier_id, organisation, website } = parsed.data;

  // Honeypot — accept and drop, so the bot sees success and does not retry
  if (website && website.length > 0) {
    return NextResponse.json({ ok: true, via: "dropped" });
  }

  // Primary: Supabase (service_role bypasses RLS; table has no public policies)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (url && key) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(url, key);
      const { error } = await admin
        .from("academy_waitlist")
        .upsert(
          { email, name, tier_id, organisation: organisation ?? null },
          { onConflict: "email,tier_id", ignoreDuplicates: true }
        );
      if (!error) {
        return NextResponse.json({ ok: true, via: "db" });
      }
      console.warn("[academy/waitlist] Supabase insert failed:", error.message);
    } catch (err) {
      console.warn("[academy/waitlist] Supabase unavailable:", err);
    }
  }

  // Fallback: Formspree — the lead still reaches the inbox
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Academy waitlist: ${tier_id}`,
        email,
        name,
        tier: tier_id,
        organisation: organisation ?? "",
      }),
    });
    if (res.ok) {
      return NextResponse.json({ ok: true, via: "email" });
    }
  } catch (err) {
    console.warn("[academy/waitlist] Formspree fallback failed:", err);
  }

  return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
}
