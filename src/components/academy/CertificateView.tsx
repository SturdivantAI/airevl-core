"use client";

/**
 * CertificateView — issues (idempotently) and renders the Automation 101
 * completion certificate + badge. Print-friendly: chrome hidden via print:.
 */

import { useEffect } from "react";
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
      <circle cx="100" cy="100" r="78" fill="rgba(0,240,255,0.06)" stroke="rgba(0,240,255,0.35)" strokeWidth="1" />
      <path
        d="M100 44 l14 28 31 5 -22 22 5 31 -28 -15 -28 15 5 -31 -22 -22 31 -5 z"
        fill="url(#badge-ring)"
        opacity="0.9"
      />
      <text x="100" y="138" textAnchor="middle" fill="#e8fdff" fontSize="13" fontFamily="monospace" letterSpacing="1">
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

export function CertificateView() {
  const { loading, user, courseComplete, certificate, awardCertificate } = useAcademy();

  // Issue once course is complete and no certificate exists yet
  useEffect(() => {
    if (!loading && user && courseComplete && !certificate) {
      void awardCertificate();
    }
  }, [loading, user, courseComplete, certificate, awardCertificate]);

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

  const issued = certificate
    ? new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div>
      {/* Certificate card — the printable region */}
      <GlassPanel active className="p-8 md:p-12 print:border print:border-gray-300 print:bg-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {certificate && <AcademyBadge certCode={certificate.certCode} />}
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
              {certificate?.holderName ?? user.name}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4">
              {course.certificate_body}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1 font-mono text-[12px] text-on-surface-variant">
              {certificate && <span>Certificate ID: {certificate.certCode}</span>}
              {issued && <span>Issued: {issued}</span>}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Actions — hidden when printing */}
      <div className="mt-8 flex flex-wrap items-center gap-4 print:hidden">
        <GlowButton variant="primary" onClick={() => window.print()}>
          Print / save as PDF
        </GlowButton>
        <Link href="/training/automation-101">
          <GlowButton variant="secondary">{academy.back_to_course}</GlowButton>
        </Link>
        <Link href="/training">
          <GlowButton variant="secondary">Explore Tier 2 and Tier 3</GlowButton>
        </Link>
      </div>
    </div>
  );
}
