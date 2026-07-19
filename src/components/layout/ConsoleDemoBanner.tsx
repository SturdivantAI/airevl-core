"use client";

/**
 * ConsoleDemoBanner — persistent banner across all console/demo pages.
 * Communicates "synthetic data" context + link back to marketing shell.
 * All strings from brand.json via lib/brand.ts.
 */

import Link from "next/link";
import { consoleBrand } from "@/lib/brand";

export function ConsoleDemoBanner() {
  return (
    <div className="w-full bg-secondary-container/10 border-b border-secondary-container/20 px-4 py-2 flex items-center justify-between text-sm">
      <span className="font-data-mono text-data-mono text-secondary-fixed-dim flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">science</span>
        {consoleBrand.demo_banner_text}
      </span>
      <Link
        href={consoleBrand.back_to_site_href}
        className="font-label-caps text-label-caps text-primary-container hover:text-primary transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        {consoleBrand.back_to_site_label}
      </Link>
    </div>
  );
}
