/**
 * Training & Certifications page — AiRevl Academy catalog + institutional tracks.
 * Route: /training
 * Academy copy from lib/academy/content; institutional copy from config/pages.json.
 * Zero copy in JSX.
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { WaitlistForm } from "@/components/academy/WaitlistForm";
import { trainingPage } from "@/lib/pages";
import { academy, tiers } from "@/lib/academy/content";

import type { Metadata } from "next";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/training"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function TrainingPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-5xl mx-auto py-16">
      {/* Academy header */}
      <header className="mb-16">
        <p className="font-label-caps text-label-caps text-primary-container mb-3">
          {academy.eyebrow}
        </p>
        <h1 className="font-display-lg text-display-lg text-on-surface mb-3">{academy.title}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          {academy.subtitle}
        </p>
      </header>

      {/* Tier cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20 items-start">
        {tiers.map((tier) => (
          <GlassPanel
            key={tier.id}
            active={tier.status === "free"}
            hoverable={tier.status === "free"}
            className="p-6 flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Tier {tier.level}
              </span>
              <span
                className={`font-label-caps text-[10px] uppercase tracking-wider px-2.5 py-1 rounded ${
                  tier.status === "free"
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-white/10 text-on-surface-variant"
                }`}
              >
                {tier.status === "free" ? academy.free_label : academy.locked_label}
              </span>
            </div>

            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{tier.name}</h2>
            <p className="font-label-caps text-[10px] uppercase tracking-wider text-primary-container mb-3">
              {tier.price}
            </p>
            <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed mb-2">
              {tier.audience}
            </p>
            <p className="font-body-md text-[13.5px] text-on-surface-variant leading-relaxed mb-5">
              {tier.blurb}
            </p>

            <ul className="space-y-2 mb-6">
              {tier.outcomes.map((o, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 font-body-md text-[13px] text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-primary-container text-[15px] mt-0.5 shrink-0">
                    check_circle
                  </span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>

            {tier.modulesPreview.length > 0 && (
              <div className="mb-6">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                  Syllabus preview
                </p>
                <ul className="space-y-1.5">
                  {tier.modulesPreview.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 font-body-md text-[12.5px] text-on-surface-variant/80"
                    >
                      <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0 text-on-surface-variant/60">
                        lock
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto">
              {tier.status === "free" ? (
                <Link
                  href="/training/automation-101"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
                >
                  {academy.course_cta}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              ) : (
                <WaitlistForm tierId={tier.id} />
              )}
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Institutional programmes (existing tracks) */}
      <div className="pt-10 border-t border-white/5">
        <header className="mb-12">
          <h2 className="font-display-lg text-[28px] text-on-surface mb-3">{trainingPage.title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
            {trainingPage.subtitle}
          </p>
        </header>

        <div className="space-y-16">
          {trainingPage.tracks.map((track) => (
            <section key={track.title}>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
                {track.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
                {track.description}
              </p>
              <GlassPanel className="p-6">
                <ul className="space-y-3">
                  {track.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 font-body-md text-[14px] text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-primary-container text-[16px] mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </section>
          ))}
        </div>

        {/* Flagship syllabus callout */}
        <div className="mt-16 pt-10 border-t border-white/5">
          <GlassPanel className="p-8">
            <p className="font-label-caps text-label-caps text-primary-container mb-3">
              {trainingPage.title}
            </p>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
              {trainingPage.flagship_syllabus}
            </p>
          </GlassPanel>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <Link
            href={trainingPage.cta_href}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
          >
            {trainingPage.cta_label}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
