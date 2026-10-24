"use client";

/**
 * "Get notified" for a product that is not live yet. Collapsed to one button so
 * the card reads as a product on the way, not a form; expands in place to the
 * shared waitlist form (same rate-limited route, honeypot and storage).
 */

import { useState } from "react";
import { WaitlistForm } from "@/components/academy/WaitlistForm";

export function NotifyMe({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Get notified when ${productName} launches`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary-container/40 text-primary-container font-label-caps text-label-caps text-[10px] hover:bg-primary-container/10 transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-[14px]">notifications</span>
        Get notified
      </button>
    );
  }

  return (
    <WaitlistForm
      tierId={productId}
      stacked
      successText={`You're on the list. We'll email you when ${productName} launches.`}
    />
  );
}
