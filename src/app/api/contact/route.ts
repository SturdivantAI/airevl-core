/**
 * POST /api/contact
 * Validates with Zod, sanitizes for injection/PII, then forwards to Formspree.
 * Zero DNS changes required — Formspree handles delivery to contact@airevl.ai.
 */

import { NextRequest, NextResponse } from "next/server";
import { ContactRequestSchema } from "@/lib/security/schemas";
import { handleSchemaViolation, handleInjectionAttempt } from "@/lib/security/guard";
import { sanitizePayload } from "@/lib/security/sanitize";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwvgvqaz";

export async function POST(req: NextRequest) {
  const source_route = "/api/contact";

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

  const { name, email, subject, message } = parsed.data;

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
        subject,
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
