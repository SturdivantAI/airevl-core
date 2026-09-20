/**
 * Public certificate verification — /verify/AR101-XXXXXX
 *
 * A certificate a learner prints from their own browser proves nothing on its
 * own. This page is the other half: an employer types the code and gets a
 * straight answer from the database.
 *
 * Reads through the `verify_certificate` SECURITY DEFINER function (migration
 * 005), which returns the holder name, course and issue date and nothing else —
 * no email, no score, no user id. Walking the code space therefore leaks
 * nothing beyond what is already printed on a certificate someone was handed.
 *
 * Server-rendered: the answer should be in the HTML, not fetched afterwards, so
 * it is quotable and indexable.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { getSupabase } from "@/lib/supabase";
import { course } from "@/lib/academy/content";

export const dynamic = "force-dynamic";

interface VerifyRow {
  cert_code: string;
  holder_name: string;
  course_id: string;
  issued_at: string;
  revoked: boolean;
}

type Outcome =
  | { kind: "valid"; row: VerifyRow }
  | { kind: "revoked"; row: VerifyRow }
  | { kind: "unknown" }
  | { kind: "unavailable" };

async function lookup(code: string): Promise<Outcome> {
  try {
    const { data, error } = await getSupabase().rpc("verify_certificate", { code });
    if (error) {
      console.warn("[verify] rpc failed:", error.message);
      return { kind: "unavailable" };
    }
    const row = (Array.isArray(data) ? data[0] : data) as VerifyRow | undefined;
    if (!row) return { kind: "unknown" };
    return row.revoked ? { kind: "revoked", row } : { kind: "valid", row };
  } catch (err) {
    // Unconfigured deployment or network failure. "We cannot check right now"
    // is the honest answer — never imply a real certificate is a fake.
    console.warn("[verify] lookup unavailable:", err);
    return { kind: "unavailable" };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const clean = decodeURIComponent(code).toUpperCase();
  return {
    title: `Verify certificate ${clean} — AiRevl Academy`,
    description: `Check whether AiRevl Academy certificate ${clean} is genuine.`,
    robots: { index: false, follow: false },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const clean = decodeURIComponent(code).trim().toUpperCase();
  const outcome = await lookup(clean);

  return (
    <div className="p-6 md:p-container-padding max-w-xl mx-auto py-16">
      <p className="font-label-caps text-label-caps text-primary-container mb-8">
        AiRevl Academy · Certificate verification
      </p>

      {outcome.kind === "valid" && (
        <GlassPanel active className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <span
              className="material-symbols-outlined text-green-400 text-[32px] shrink-0"
              aria-hidden="true"
            >
              verified
            </span>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                This certificate is genuine
              </h1>
              <p className="font-body-md text-[13px] text-on-surface-variant">
                Issued by the AiRevl Academy and currently valid.
              </p>
            </div>
          </div>

          <dl className="space-y-4 border-t border-white/5 pt-6">
            <div>
              <dt className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Awarded to
              </dt>
              <dd className="font-body-md text-body-md text-on-surface">
                {outcome.row.holder_name}
              </dd>
            </div>
            <div>
              <dt className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Course
              </dt>
              <dd className="font-body-md text-body-md text-on-surface">{course.title}</dd>
            </div>
            <div>
              <dt className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Issued
              </dt>
              <dd className="font-body-md text-body-md text-on-surface">
                {formatDate(outcome.row.issued_at)}
              </dd>
            </div>
            <div>
              <dt className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Certificate ID
              </dt>
              <dd className="font-mono text-[13px] text-on-surface tracking-wider">
                {outcome.row.cert_code}
              </dd>
            </div>
          </dl>
        </GlassPanel>
      )}

      {outcome.kind === "revoked" && (
        <GlassPanel className="p-8">
          <div className="flex items-start gap-4 mb-4">
            <span
              className="material-symbols-outlined text-yellow-400 text-[32px] shrink-0"
              aria-hidden="true"
            >
              gpp_maybe
            </span>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                This certificate has been withdrawn
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Certificate <span className="font-mono">{outcome.row.cert_code}</span> was issued by
                the AiRevl Academy but is no longer valid. Contact us if you need the reason.
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      {outcome.kind === "unknown" && (
        <GlassPanel className="p-8">
          <div className="flex items-start gap-4 mb-4">
            <span
              className="material-symbols-outlined text-on-surface-variant text-[32px] shrink-0"
              aria-hidden="true"
            >
              search_off
            </span>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                No certificate with that ID
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                We have no record of <span className="font-mono">{clean}</span>. Check for a typo —
                the ID looks like <span className="font-mono">AR101-XXXXXX</span> and never contains
                the letters I, L or O, or the digits 0 and 1.
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      {outcome.kind === "unavailable" && (
        <GlassPanel className="p-8">
          <div className="flex items-start gap-4 mb-4">
            <span
              className="material-symbols-outlined text-on-surface-variant text-[32px] shrink-0"
              aria-hidden="true"
            >
              cloud_off
            </span>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                We can&apos;t check right now
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Our verification service is unreachable. This says nothing about whether{" "}
                <span className="font-mono">{clean}</span> is genuine — please try again shortly.
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/training">
          <GlowButton variant="secondary">About the Academy</GlowButton>
        </Link>
        <Link href="/contact">
          <GlowButton variant="secondary">Query this certificate</GlowButton>
        </Link>
      </div>
    </div>
  );
}
