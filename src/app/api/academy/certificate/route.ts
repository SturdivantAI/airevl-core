/**
 * POST /api/academy/certificate
 *
 * Issues the Automation 101 certificate and emails it. This route exists
 * because the browser used to do both.
 *
 * Previously `awardCertificate()` generated the code client-side and inserted
 * the row under the learner's own RLS policy, so `holder_name` and `score` were
 * whatever the client chose to send — a certificate in any name, with any
 * score, without completing a module. Here the server checks `academy_progress`
 * against the real module list first, and the client cannot influence anything
 * on the row except the name it asks to be printed (length-capped, and only
 * after completion is proven).
 *
 * Auth: Supabase access token in `Authorization: Bearer …`, verified against
 * Supabase Auth. Issuance itself runs as service_role.
 *
 * Degradation rule (house style): a missing Resend key or a failed send never
 * costs the learner their certificate. The row is written, `email_sent_at`
 * stays NULL, and the response says delivery did not happen so the UI can offer
 * a resend. Never 500 on a delivery problem.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { createRateLimiter, clientIp } from "@/lib/security/rate-limit";
import { modules, course } from "@/lib/academy/content";

const IssueSchema = z.object({
  /** Name to print. Collected fresh at issuance — a sign-up nickname is not a certificate name. */
  holder_name: z.string().trim().min(2).max(120),
  /** Consent for the name to be returned by the public verify endpoint. */
  public_verifiable: z.boolean().default(true),
});

// Issuance is once-per-learner in practice; this only bounds retry storms.
const rateLimitCheck = createRateLimiter({
  scope: "academy-certificate",
  windowSeconds: 60,
  max: 8,
});

/** No confusable characters — these codes get read aloud and typed by hand. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeCertCode(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return `AR101-${suffix}`;
}

function siteOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return req.nextUrl.origin;
}

function certificateEmail(opts: {
  holderName: string;
  certCode: string;
  issuedAt: string;
  origin: string;
}): { subject: string; html: string; text: string } {
  const { holderName, certCode, issuedAt, origin } = opts;
  const verifyUrl = `${origin}/verify/${encodeURIComponent(certCode)}`;
  const certUrl = `${origin}/training/automation-101/certificate`;
  const issued = new Date(issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `Your ${course.title} certificate (${certCode})`;

  const text = [
    `Congratulations, ${holderName}.`,
    ``,
    `You have completed ${course.title} at the AiRevl Academy.`,
    ``,
    `Certificate ID: ${certCode}`,
    `Issued: ${issued}`,
    ``,
    `View and download your certificate: ${certUrl}`,
    `Anyone can verify it here: ${verifyUrl}`,
    ``,
    `Add it to your LinkedIn profile under Licenses & Certifications —`,
    `issuing organisation "AiRevl Academy", credential ID ${certCode},`,
    `credential URL ${verifyUrl}.`,
    ``,
    `— The AiRevl Academy team`,
  ].join("\n");

  // Table-based, inline-styled, no external assets: the layout that survives
  // Outlook and Gmail's clipping. Deliberately plain.
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e3e8ee;">
<tr><td style="padding:32px 32px 8px;">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#0a7ea4;">AiRevl Academy</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#10151c;">Congratulations, ${escapeHtml(holderName)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3d4753;">
You have completed <strong>${escapeHtml(course.title)}</strong> — all ${modules.length} modules, the hands-on exercises and the knowledge checks.
</p>
</td></tr>
<tr><td style="padding:0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border:1px solid #e3e8ee;border-radius:8px;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 6px;font-size:12px;color:#66727f;">Certificate ID</p>
<p style="margin:0 0 14px;font-size:18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#10151c;letter-spacing:1px;">${escapeHtml(certCode)}</p>
<p style="margin:0 0 6px;font-size:12px;color:#66727f;">Issued</p>
<p style="margin:0;font-size:14px;color:#10151c;">${escapeHtml(issued)}</p>
</td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px 8px;">
<a href="${certUrl}" style="display:inline-block;background:#0a7ea4;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">View your certificate</a>
</td></tr>
<tr><td style="padding:16px 32px 0;">
<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#3d4753;">
Anyone can confirm it is genuine at <a href="${verifyUrl}" style="color:#0a7ea4;">${escapeHtml(verifyUrl)}</a>.
</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3d4753;">
To add it to LinkedIn, use <strong>Licenses &amp; Certifications</strong> → issuing organisation <strong>AiRevl Academy</strong>, credential ID <strong>${escapeHtml(certCode)}</strong>, credential URL above.
</p>
</td></tr>
<tr><td style="padding:0 32px 32px;border-top:1px solid #eef1f5;">
<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#8a95a1;">
You are receiving this because you completed a course at the AiRevl Academy. This is a one-off message about your certificate, not a subscription.
</p>
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns true when the mail actually went out. Never throws. */
async function sendCertificateEmail(
  to: string,
  content: { subject: string; html: string; text: string }
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[academy/certificate] RESEND_API_KEY not set — certificate issued without email");
    return false;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "AiRevl Academy <academy@airevl.ai>",
      replyTo: process.env.RESEND_REPLY_TO ?? "contact@airevl.ai",
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    if (error) {
      console.warn("[academy/certificate] Resend rejected the send:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[academy/certificate] Resend unavailable:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rate = await rateLimitCheck(ip);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) {
    // Demo deployments have no database; the client keeps its local certificate.
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = IssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
  }
  const { holder_name, public_verifiable } = parsed.data;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceKey);

    // 1. Who is asking? The token is the only identity input we trust.
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    // 2. Already issued? Idempotent by design — a learner refreshing the
    //    certificate page must not mint a second code.
    const { data: existing } = await admin
      .from("academy_certificates")
      .select("cert_code, holder_name, score, total, issued_at, email_sent_at, recipient_email")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (existing) {
      // Retry a delivery that previously failed, without reissuing the code.
      let emailed = Boolean(existing.email_sent_at);
      if (!emailed && user.email) {
        const content = certificateEmail({
          holderName: existing.holder_name,
          certCode: existing.cert_code,
          issuedAt: existing.issued_at,
          origin: siteOrigin(req),
        });
        emailed = await sendCertificateEmail(user.email, content);
        if (emailed) {
          await admin
            .from("academy_certificates")
            .update({ email_sent_at: new Date().toISOString(), recipient_email: user.email })
            .eq("user_id", user.id)
            .eq("course_id", course.id);
        }
      }
      return NextResponse.json({
        ok: true,
        reissued: false,
        emailed,
        certificate: {
          certCode: existing.cert_code,
          holderName: existing.holder_name,
          score: existing.score,
          total: existing.total,
          issuedAt: existing.issued_at,
        },
      });
    }

    // 3. Earn it. This is the check the old client-side path never made.
    const { data: progress, error: progressErr } = await admin
      .from("academy_progress")
      .select("module_id")
      .eq("user_id", user.id)
      .eq("course_id", course.id);
    if (progressErr) {
      console.warn("[academy/certificate] progress lookup failed:", progressErr.message);
      return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
    }

    const done = new Set((progress ?? []).map((r: { module_id: string }) => r.module_id));
    const missing = modules.filter((m) => !done.has(m.id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "incomplete",
          remaining: missing.length,
          total: modules.length,
        },
        { status: 403 }
      );
    }

    // 4. Issue.
    const certCode = makeCertCode();
    const { data: inserted, error: insertErr } = await admin
      .from("academy_certificates")
      .insert({
        user_id: user.id,
        course_id: course.id,
        cert_code: certCode,
        holder_name: holder_name,
        score: modules.length,
        total: modules.length,
        recipient_email: user.email ?? null,
        public_verifiable,
      })
      .select("cert_code, holder_name, score, total, issued_at")
      .single();

    if (insertErr || !inserted) {
      // UNIQUE (user_id, course_id) lost a race with a parallel request — the
      // other one issued it, so read that rather than reporting a failure.
      const { data: raced } = await admin
        .from("academy_certificates")
        .select("cert_code, holder_name, score, total, issued_at")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle();
      if (raced) {
        return NextResponse.json({
          ok: true,
          reissued: false,
          emailed: false,
          certificate: {
            certCode: raced.cert_code,
            holderName: raced.holder_name,
            score: raced.score,
            total: raced.total,
            issuedAt: raced.issued_at,
          },
        });
      }
      console.warn("[academy/certificate] insert failed:", insertErr?.message);
      return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
    }

    // 5. Deliver. A failure here is recorded, not fatal.
    let emailed = false;
    if (user.email) {
      const content = certificateEmail({
        holderName: inserted.holder_name,
        certCode: inserted.cert_code,
        issuedAt: inserted.issued_at,
        origin: siteOrigin(req),
      });
      emailed = await sendCertificateEmail(user.email, content);
      if (emailed) {
        await admin
          .from("academy_certificates")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("course_id", course.id);
      }
    }

    return NextResponse.json({
      ok: true,
      reissued: true,
      emailed,
      certificate: {
        certCode: inserted.cert_code,
        holderName: inserted.holder_name,
        score: inserted.score,
        total: inserted.total,
        issuedAt: inserted.issued_at,
      },
    });
  } catch (err) {
    console.warn("[academy/certificate] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
}
