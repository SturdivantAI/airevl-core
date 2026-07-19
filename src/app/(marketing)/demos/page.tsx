/**
 * Demo Hub — marketing gateway to console demos.
 * Route: /demos
 * One card per console demo, linking into the console shell.
 * All strings from brand.json via lib/brand.ts.
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { demoHub } from "@/lib/brand";

export default function DemoHubPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-3">
          {demoHub.title}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          {demoHub.subtitle}
        </p>
      </header>

      {/* Demo cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {demoHub.cards.map((card) => {
          const isComingSoon = card.status === "coming-soon";

          return (
            <DemoCard
              key={card.title}
              title={card.title}
              description={card.description}
              href={card.href}
              icon={card.icon}
              isComingSoon={isComingSoon}
            />
          );
        })}
      </div>
    </div>
  );
}

function DemoCard({
  title,
  description,
  href,
  icon,
  isComingSoon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  isComingSoon: boolean;
}) {
  const Wrapper = isComingSoon ? "div" : Link;
  const wrapperProps = isComingSoon ? {} : { href };

  return (
    <GlassPanel
      hoverable={!isComingSoon}
      className={`p-8 flex flex-col h-full transition-colors ${
        isComingSoon ? "opacity-50 border-dashed" : "hover:border-primary-container/30"
      }`}
    >
      {/* @ts-expect-error -- conditional wrapper for coming-soon cards */}
      <Wrapper {...wrapperProps} className="flex flex-col h-full">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 mb-6">
          <span
            className="material-symbols-outlined text-primary-container text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
          {title}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-1">
          {description}
        </p>

        {/* Status badge */}
        {isComingSoon ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 font-label-caps text-label-caps text-on-surface-variant/50 w-fit">
            Coming Soon
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-primary-container/30 bg-primary-container/10 font-label-caps text-label-caps text-primary-container w-fit">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            Live
          </span>
        )}
      </Wrapper>
    </GlassPanel>
  );
}
