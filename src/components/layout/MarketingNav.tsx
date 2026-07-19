"use client";

/**
 * MarketingNav — top navigation bar for the marketing shell.
 * Logo lockup left, nav links right, CTA button.
 * All labels from brand.json via lib/brand.ts.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { companyName, nav } from "@/lib/brand";

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-surface-dim/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 md:px-8">
      {/* Logo lockup */}
      <Link href="/" className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/AiRevl-logo.png"
            alt={companyName}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="font-headline-lg text-[20px] font-bold text-primary-container tracking-tighter leading-none">
          {companyName}
        </span>
      </Link>

      {/* Desktop nav links */}
      <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
        {nav.marketing_links.map(({ label, href }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`font-body-md text-sm transition-colors ${
                isActive
                  ? "text-primary-container"
                  : "text-on-surface-variant hover:text-primary-container"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <Link
          href={nav.cta_href}
          className="ml-2 px-4 py-2 bg-primary-container/10 border border-primary-container/40 text-primary-container font-label-caps text-label-caps rounded hover:bg-primary-container/20 transition-colors"
        >
          {nav.cta_label}
        </Link>
      </nav>

      {/* Mobile menu button */}
      <button
        aria-label="Open navigation menu"
        className="md:hidden text-on-surface-variant hover:text-primary-container transition-colors"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
    </header>
  );
}
