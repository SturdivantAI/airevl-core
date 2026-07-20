/**
 * Branded 404 page — renders in the marketing shell.
 * Copy from config/seo.json via lib/seo.ts.
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { notFoundCopy } from "@/lib/seo";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
      <MarketingNav />
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-6">
        <GlassPanel className="p-12 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-primary-container text-5xl mb-4 block">
            wifi_off
          </span>
          <h1 className="font-display-lg text-[28px] text-on-surface mb-3">
            {notFoundCopy.heading}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            {notFoundCopy.body}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="px-5 py-2.5 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
            >
              {notFoundCopy.home_label}
            </Link>
            <Link
              href="/demos"
              className="px-5 py-2.5 border border-primary-container/40 text-primary-container font-label-caps text-label-caps rounded hover:bg-primary-container/10 transition-colors"
            >
              {notFoundCopy.demos_label}
            </Link>
          </div>
        </GlassPanel>
        <div className="w-full max-w-md mt-8 px-6">
          <Footer />
        </div>
      </main>
    </div>
  );
}
