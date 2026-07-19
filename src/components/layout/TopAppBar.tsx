"use client";

/**
 * TopAppBar — console shell only.
 * Dead chrome removed per Ticket 002: Systems/Assets/Network tabs, Deploy AI button.
 * Retains mobile brand + utility actions relevant to console demos.
 */

import { companyName } from "@/lib/brand";

export function TopAppBar() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-surface-dim/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-container-padding">

      {/* Mobile brand */}
      <div className="flex items-center gap-3 md:hidden">
        <button aria-label="Open navigation menu" className="text-on-surface-variant hover:text-primary-container transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary-fixed-dim">
          {companyName}
        </span>
      </div>

      {/* Spacer on desktop (nav is in SideNavBar) */}
      <div className="hidden md:block" />

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button aria-label="Search" className="text-on-surface-variant hover:text-primary-container transition-colors">
          <span className="material-symbols-outlined">search</span>
        </button>

        {/* Notifications + shield */}
        <div className="hidden sm:flex items-center gap-3 border-r border-white/10 pr-4 mr-1">
          <button aria-label="Notifications" className="relative text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary-container rounded-full animate-pulse" />
          </button>
          <button aria-label="Security status" className="text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">shield</span>
          </button>
        </div>

        {/* Avatar placeholder */}
        <div role="button" aria-label="User profile" tabIndex={0} className="w-8 h-8 rounded-full bg-surface-container-high border border-white/20 flex items-center justify-center cursor-pointer ml-1 focus:ring-2 focus:ring-primary-container/50 focus:outline-none">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
        </div>
      </div>
    </header>
  );
}
