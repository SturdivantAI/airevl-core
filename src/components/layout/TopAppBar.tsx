"use client";

/**
 * T1.8 — TopAppBar
 * Source of truth: .kiro/DESIGN.md §8 Shared Layout Components
 */

import { companyName } from "@/lib/brand";
import { GlowButton } from "@/components/ui/GlowButton";

export function TopAppBar() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-surface-dim/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-container-padding">

      {/* Mobile brand */}
      <div className="flex items-center gap-3 md:hidden">
        <button className="text-on-surface-variant hover:text-primary-container transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary-fixed-dim">
          {companyName}
        </span>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8 h-full">
        {["Systems", "Assets", "Network"].map((item) => (
          <a
            key={item}
            href="#"
            className="h-full flex items-center font-data-mono text-data-mono text-on-surface-variant hover:text-primary-container transition-colors"
          >
            {item}
          </a>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button className="text-on-surface-variant hover:text-primary-container transition-colors">
          <span className="material-symbols-outlined">search</span>
        </button>

        {/* Notifications + shield */}
        <div className="hidden sm:flex items-center gap-3 border-r border-white/10 pr-4 mr-1">
          <button className="relative text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary-container rounded-full animate-pulse" />
          </button>
          <button className="text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">shield</span>
          </button>
        </div>

        {/* CTA */}
        <GlowButton variant="primary" size="md" className="hidden md:block whitespace-nowrap">
          Deploy AI
        </GlowButton>

        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/20 flex items-center justify-center cursor-pointer ml-1">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
        </div>
      </div>
    </header>
  );
}
