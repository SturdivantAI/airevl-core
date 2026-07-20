/**
 * Home page (marketing shell)
 * Route: /
 * Hero + Solutions grid + Demo teasers.
 * All copy from config/brand.json and config/solutions.json via typed loaders.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { heroHeadline, tagline, nav, demoHub } from "@/lib/brand";
import { solutionsSectionTitle, solutionsSectionSubtitle, solutionCards } from "@/lib/solutions";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function HomePage() {
  return (
    <div className="relative flex flex-col gap-24 p-6 md:p-8 pb-16">
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center min-h-[60vh] gap-6 pt-12">
        <h1 className="font-display-lg text-[28px] md:text-display-lg text-white max-w-3xl leading-tight tracking-tight">
          {heroHeadline}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
          {tagline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          <Link
            href={nav.cta_href}
            className="px-6 py-3 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
          >
            {nav.cta_label}
          </Link>
          <Link
            href={nav.secondary_cta_href}
            className="px-6 py-3 border border-primary-container/40 text-primary-container font-label-caps text-label-caps rounded hover:bg-primary-container/10 transition-colors"
          >
            {nav.secondary_cta_label}
          </Link>
        </div>
      </section>

      {/* ─── Solutions Grid ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full">
        <header className="mb-10">
          <h2 className="font-display-lg text-[24px] md:text-[32px] text-on-surface mb-2">
            {solutionsSectionTitle}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            {solutionsSectionSubtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {solutionCards.map((card) => {
            const isPending = card.status === "pending";
            const href = isPending ? undefined : `/solutions#${card.slug}`;

            return (
              <SolutionCard
                key={card.slug}
                title={card.title}
                description={card.description}
                icon={card.icon}
                isPending={isPending}
                href={href}
              />
            );
          })}
        </div>
      </section>

      {/* ─── Demo Teasers ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full">
        <header className="mb-10">
          <h2 className="font-display-lg text-[24px] md:text-[32px] text-on-surface mb-2">
            {demoHub.title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            {demoHub.subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {demoHub.cards.map((card) => {
            const isComingSoon = card.status === "coming-soon";

            return (
              <DemoTeaserCard
                key={card.title}
                title={card.title}
                description={card.description}
                icon={card.icon}
                href={card.href}
                isComingSoon={isComingSoon}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ─── Solution Card ─────────────────────────────────────────────────────────── */

function SolutionCard({
  title,
  description,
  icon,
  isPending,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  isPending: boolean;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-white/5">
          <span
            className="material-symbols-outlined text-primary-container text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        {isPending && (
          <span className="px-2 py-0.5 rounded text-[10px] font-label-caps border border-white/10 text-on-surface-variant/60">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="font-headline-lg-mobile text-[16px] text-on-surface mb-2">
        {title}
      </h3>
      <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed">
        {description}
      </p>
    </>
  );

  if (isPending) {
    return (
      <GlassPanel className="p-6 opacity-50 border-dashed flex flex-col">
        {content}
      </GlassPanel>
    );
  }

  return (
    <Link href={href!}>
      <GlassPanel hoverable className="p-6 flex flex-col h-full hover:border-primary-container/30 transition-colors">
        {content}
      </GlassPanel>
    </Link>
  );
}

/* ─── Demo Teaser Card ──────────────────────────────────────────────────────── */

function DemoTeaserCard({
  title,
  description,
  icon,
  href,
  isComingSoon,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  isComingSoon: boolean;
}) {
  const content = (
    <>
      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 mb-4">
        <span
          className="material-symbols-outlined text-primary-container text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <h3 className="font-headline-lg-mobile text-[16px] text-on-surface mb-2">
        {title}
      </h3>
      <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-4 flex-1">
        {description}
      </p>
      {isComingSoon ? (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 font-label-caps text-label-caps text-on-surface-variant/50 w-fit text-[10px]">
          Coming Soon
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-primary-container/30 bg-primary-container/10 font-label-caps text-label-caps text-primary-container w-fit text-[10px]">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          Live
        </span>
      )}
    </>
  );

  if (isComingSoon) {
    return (
      <GlassPanel className="p-6 opacity-50 border-dashed flex flex-col">
        {content}
      </GlassPanel>
    );
  }

  return (
    <Link href={href}>
      <GlassPanel hoverable className="p-6 flex flex-col h-full hover:border-primary-container/30 transition-colors">
        {content}
      </GlassPanel>
    </Link>
  );
}
