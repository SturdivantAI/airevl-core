"use client";

/**
 * CertificateView — collects what a certificate actually needs, issues it
 * through the server, then renders it.
 *
 * What changed and why: this used to issue silently from a useEffect the moment
 * the last module was ticked, printing whatever name the learner happened to
 * type into the sign-in box. That produced certificates reading "tunde.a" and
 * gave the learner no say in whether their name appears on a public page.
 *
 * Issuance is now a deliberate step:
 *  - the learner confirms the name to print, at issuance, not at sign-up,
 *  - they choose whether the certificate is publicly verifiable,
 *  - the server checks module completion before minting anything,
 *  - the certificate is emailed, and a failed send is visible and retryable.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { academy, course } from "@/lib/academy/content";
import { useAcademy } from "@/lib/academy/useAcademy";

function AcademyBadge({ certCode }: { certCode: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-36 h-36 shrink-0"
      role="img"
      aria-label={`AiRevl Academy badge, certificate ${certCode}`}
    >
      <defs>
        <linearGradient id="badge-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#0066ff" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="url(#badge-ring)" strokeWidth="4" />
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="rgba(0,240,255,0.06)"
        stroke="rgba(0,240,255,0.35)"
        strokeWidth="1"
      />
      <path
        d="M100 44 l14 28 31 5 -22 22 5 31 -28 -15 -28 15 5 -31 -22 -22 31 -5 z"
        fill="url(#badge-ring)"
        opacity="0.9"
      />
      <text
        x="100"
        y="138"
        textAnchor="middle"
        fill="#e8fdff"
        fontSize="13"
        fontFamily="monospace"
        letterSpacing="1"
      >
        AUTOMATION 101
      </text>
      <text x="100" y="156" textAnchor="middle" fill="#7ee8f5" fontSize="9" fontFamily="monospace">
        AiRevl Academy
      </text>
      <text x="100" y="172" textAnchor="middle" fill="#7ee8f5" fontSize="8" fontFamily="monospace">
        {certCode}
      </text>
    </svg>
  );
}

/**
 * The address printed on the certificate. Deliberately the canonical site, not
 * `window.location.origin`: a certificate printed from a preview deployment
 * should still tell the reader where to verify it.
 */
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.airevl.ai").replace(
  /\/+$/,
  ""
);

const ISSUE_ERRORS: Record<string, string> = {
  incomplete:
    "Our records show at least one module still outstanding. Reopen the course and finish it, then come back.",
  signed_out: "Your session expired while we were issuing. Sign in again and retry.",
  not_configured:
    "Certificates are not available on this deployment yet. Nothing is lost — try again shortly.",
  unavailable: "We couldn't reach the certificate service. Your progress is safe — please retry.",
};

export function CertificateView() {
  const { loading, user, demoMode, courseComplete, certificate, awardCertificate } = useAcademy();

  // null means "untouched", so the field shows the account name until the
  // learner edits it. Derived rather than synced with an effect: the account
  // name can arrive after first render, and seeding it from an effect would be
  // a cascading render for something the UI can simply compute.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailed, setEmailed] = useState<boolean | null>(null);

  const holderName = nameDraft ?? user?.name ?? "";

  if (loading) {
    return (
      <GlassPanel className="p-8">
        <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel active className="p-8 text-center">
        <p className="font-body-md text-body-md text-on-surface mb-6">{academy.signin.title}</p>
        <Link href="/training/signin">
          <GlowButton variant="primary">{academy.course_cta}</GlowButton>
        </Link>
      </GlassPanel>
    );
  }

  if (!courseComplete) {
    return (
      <GlassPanel className="p-8 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-[36px] mb-3">
          lock
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          Complete all seven modules to unlock your certificate.
        </p>
        <Link href="/training/automation-101">
          <GlowButton variant="primary">{academy.back_to_course}</GlowButton>
        </Link>
      </GlassPanel>
    );
  }

  // ─── Not issued yet: confirm the details that go on it ──────────────────────
  if (!certificate) {
    const nameValid = holderName.trim().length >= 2;

    return (
      <GlassPanel active className="p-8">
        <span className="material-symbols-outlined text-primary-container text-[32px] mb-3">
          workspace_premium
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
          You&apos;ve earned it
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-8">
          All seven modules complete. Confirm how your name should appear — this is what we print,
          and what an employer sees when they check the certificate. It cannot be changed
          afterwards without reissuing.
        </p>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nameValid || busy) return;
            setBusy(true);
            setError(null);
            void awardCertificate({ holderName, publicVerifiable: consent })
              .then((result) => {
                if (!result.certificate) {
                  setError(
                    ISSUE_ERRORS[result.error ?? "unavailable"] ?? ISSUE_ERRORS.unavailable!
                  );
                  return;
                }
                setEmailed(result.emailed);
              })
              .finally(() => setBusy(false));
          }}
        >
          <div>
            <label
              htmlFor="cert-name"
              className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5"
            >
              Full name, as it should appear
            </label>
            <input
              id="cert-name"
              type="text"
              value={holderName}
              onChange={(e) => setNameDraft(e.target.value)}
              autoComplete="name"
              maxLength={120}
              aria-describedby="cert-name-hint"
              className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-2.5 font-body-md text-[14px] text-on-surface focus:border-primary-container/70 focus:outline-none"
            />
            <p id="cert-name-hint" className="font-body-md text-[12.5px] text-on-surface-variant mt-1.5">
              Use the name you go by professionally.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="cert-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#00f0ff]"
            />
            <label
              htmlFor="cert-consent"
              className="font-body-md text-[13px] text-on-surface-variant leading-relaxed"
            >
              Make my certificate publicly verifiable. Anyone with the certificate ID can confirm
              the name, course and issue date at{" "}
              <span className="font-mono text-on-surface">/verify</span>. Nothing else — not your
              email, not your scores — is ever shown. Leave this unticked and the certificate is
              still yours, but an employer can&apos;t independently check it.
            </label>
          </div>

          <p className="font-body-md text-[12.5px] text-on-surface-variant leading-relaxed">
            We&apos;ll email it to <span className="text-on-surface">{user.email}</span>. That is
            the only message you&apos;ll get — no list, no follow-ups.
          </p>

          {demoMode && (
            <p className="font-body-md text-[12.5px] text-yellow-400/90 leading-relaxed">
              This deployment is in demo mode, so the certificate is generated on your device only.
              It will not be emailed and cannot be verified by anyone else.
            </p>
          )}

          {error && (
            <p className="font-body-md text-[12.5px] text-red-400 leading-relaxed" role="alert">
              {error}
            </p>
          )}

          <GlowButton
            type="submit"
            variant="primary"
            disabled={!nameValid || busy}
            className={!nameValid || busy ? "opacity-40 cursor-not-allowed" : ""}
          >
            {busy ? "Issuing…" : "Issue my certificate"}
          </GlowButton>
        </form>
      </GlassPanel>
    );
  }

  // ─── Issued ────────────────────────────────────────────────────────────────
  const issued = new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const verifyUrl = `${SITE_ORIGIN}/verify/${certificate.certCode}`;

  return (
    <div>
      {emailed === true && (
        <p
          className="font-body-md text-[13px] text-green-400 mb-6 flex items-center gap-2 print:hidden"
          role="status"
        >
          <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
          Sent to {user.email}.
        </p>
      )}
      {emailed === false && !demoMode && (
        <GlassPanel className="p-4 mb-6 print:hidden">
          <p className="font-body-md text-[13px] text-yellow-400/90 leading-relaxed">
            Your certificate is issued and safe, but we couldn&apos;t email it just now. It will
            always be here, and you can print it below.
          </p>
        </GlassPanel>
      )}

      {/* Certificate card — the printable region */}
      <GlassPanel active className="p-8 md:p-12 print:border print:border-gray-300 print:bg-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <AcademyBadge certCode={certificate.certCode} />
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <Image
                src="/assets/AiRevl-logo.png"
                alt="AiRevl"
                width={36}
                height={36}
                className="rounded"
              />
              <p className="font-label-caps text-label-caps text-primary-container">
                {academy.eyebrow}
              </p>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
              {course.certificate_title}
            </p>
            <h1 className="font-display-lg text-[30px] md:text-display-lg text-on-surface mb-3">
              {certificate.holderName}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4">
              {course.certificate_body}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1 font-mono text-[12px] text-on-surface-variant">
              <span>Certificate ID: {certificate.certCode}</span>
              <span>Issued: {issued}</span>
            </div>
            {/* The printed copy has to carry its own verification address, or a
                paper certificate is unfalsifiable only in the wrong direction. */}
            {!demoMode && (
              <p className="font-mono text-[11px] text-on-surface-variant mt-2 break-all">
                Verify at {verifyUrl}
              </p>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Actions — hidden when printing */}
      <div className="mt-8 flex flex-wrap items-center gap-4 print:hidden">
        <GlowButton variant="primary" onClick={() => window.print()}>
          Print / save as PDF
        </GlowButton>
        {!demoMode && (
          <Link href={`/verify/${certificate.certCode}`}>
            <GlowButton variant="secondary">View public verification</GlowButton>
          </Link>
        )}
        <Link href="/training/automation-101">
          <GlowButton variant="secondary">{academy.back_to_course}</GlowButton>
        </Link>
        <Link href="/training">
          <GlowButton variant="secondary">Explore Tier 2 and Tier 3</GlowButton>
        </Link>
      </div>

      {!demoMode && (
        <p className="font-body-md text-[12.5px] text-on-surface-variant mt-6 leading-relaxed print:hidden">
          Adding this to LinkedIn? Under <strong>Licenses &amp; Certifications</strong>, use issuing
          organisation <strong>AiRevl Academy</strong>, credential ID{" "}
          <span className="font-mono">{certificate.certCode}</span>, and the verification link
          above.
        </p>
      )}
    </div>
  );
}
