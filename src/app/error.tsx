"use client";

/**
 * Global error boundary — renders branded error state.
 * Copy from config/seo.json via lib/seo.ts.
 * No stack traces rendered.
 */

import { GlassPanel } from "@/components/ui/GlassPanel";
import { errorCopy } from "@/lib/seo";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative z-10 flex items-center justify-center h-full w-full p-6">
      <GlassPanel className="p-12 max-w-md w-full text-center">
        <span className="material-symbols-outlined text-error text-5xl mb-4 block">
          error_outline
        </span>
        <h1 className="font-display-lg text-[28px] text-on-surface mb-3">
          {errorCopy.heading}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          {errorCopy.body}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
        >
          {errorCopy.reset_label}
        </button>
      </GlassPanel>
    </div>
  );
}
