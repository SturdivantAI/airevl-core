/**
 * Solutions page — full content, config-driven.
 * Route: /solutions
 * All copy from config/solutions.json via lib/solutions.ts. Zero copy in JSX.
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  solutionsSectionTitle,
  solutionsSectionSubtitle,
  solutionCtaLabel,
  solutionCtaHref,
  solutionPendingStrip,
  solutionCards,
} from "@/lib/solutions";

export default function SolutionsPage() {
  const activeCards = solutionCards.filter((c) => c.status === "active");
  const pendingCards = solutionCards.filter((c) => c.status === "pending");

  return (
    <div className="p-6 md:p-container-padding max-w-4xl mx-auto py-16">
      {/* Page header */}
      <header className="mb-16">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-3">
          {solutionsSectionTitle}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          {solutionsSectionSubtitle}
        </p>
      </header>

      {/* Active solution sections */}
      <div className="space-y-20">
        {activeCards.map((card) => {
          if (!card.detail) return null;
          return (
            <section key={card.slug} id={card.slug} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="material-symbols-outlined text-primary-container text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {card.icon}
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  {card.detail.heading}
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                {card.detail.paragraphs.map((p, i) => (
                  <p key={i} className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              <GlassPanel className="p-6 mb-6">
                <ul className="space-y-3">
                  {card.detail.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3 font-body-md text-[14px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container text-[16px] mt-0.5 shrink-0">check_circle</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>

              <Link
                href={solutionCtaHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary-container/40 text-primary-container font-label-caps text-label-caps rounded hover:bg-primary-container/10 transition-colors"
              >
                {solutionCtaLabel}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </section>
          );
        })}
      </div>

      {/* Pending cards strip */}
      {pendingCards.length > 0 && (
        <div className="mt-20 pt-10 border-t border-white/5">
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 italic">
            {solutionPendingStrip}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {pendingCards.map((card) => (
              <GlassPanel key={card.slug} className="p-6 opacity-50 border-dashed">
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-on-surface-variant text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {card.icon}
                  </span>
                  <div>
                    <h3 className="font-headline-lg-mobile text-[16px] text-on-surface">
                      {card.title}
                    </h3>
                    <p className="font-body-md text-[13px] text-on-surface-variant">
                      {card.description}
                    </p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
