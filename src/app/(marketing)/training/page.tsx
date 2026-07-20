/**
 * Training & Certifications page — config-driven.
 * Route: /training
 * All copy from config/pages.json via lib/pages.ts. Zero copy in JSX.
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { trainingPage } from "@/lib/pages";

export default function TrainingPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-4xl mx-auto py-16">
      {/* Page header */}
      <header className="mb-16">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-3">
          {trainingPage.title}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          {trainingPage.subtitle}
        </p>
      </header>

      {/* Tracks */}
      <div className="space-y-16">
        {trainingPage.tracks.map((track) => (
          <section key={track.title}>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              {track.title}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              {track.description}
            </p>
            <GlassPanel className="p-6">
              <ul className="space-y-3">
                {track.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 font-body-md text-[14px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary-container text-[16px] mt-0.5 shrink-0">check_circle</span>
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
  );
}
