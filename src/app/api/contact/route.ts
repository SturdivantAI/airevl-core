/**
 * T2.1 — Contact API Route
 * POST /api/contact
 * Validates with Zod, relays via Resend, reads sender from brand.ts.
 * Honeypot field guards against bot submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { ContactRequestSchema } from "@/lib/security/schemas";
import { handleSchemaViolation, handleInjectionAttempt } from "@/lib/security/guard";
import { sanitizePayload } from "@/lib/security/sanitize";
import { corporateEmail, companyName } from "@/lib/brand";

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

  // Send via Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY not configured");
    return NextResponse.json(
      { error: "Mail relay not configured." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${companyName} Contact <noreply@airevl.ai>`,
        to: [corporateEmail],
        reply_to: email,
        subject: `[AiRevl Contact] ${subject}`,
        text: `From: ${name} <${email}>\n\n${sanitized.sanitizedText}`,
        html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${sanitized.sanitizedText.replace(/\n/g, "<br>")}</p>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[contact] Resend error:", err);
      return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
