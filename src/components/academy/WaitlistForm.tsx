"use client";

/**
 * WaitlistForm — Tier 2/3 lead capture. POSTs to /api/academy/waitlist.
 */

import { useState } from "react";
import { GlowButton } from "@/components/ui/GlowButton";
import { academy } from "@/lib/academy/content";

export function WaitlistForm({ tierId }: { tierId: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — same field name as /api/contact
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const valid = /.+@.+\..+/.test(email) && name.trim().length > 0;

  if (state === "done") {
    return (
      <p className="font-body-md text-[13px] text-primary-container flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">check_circle</span>
        {academy.waitlist.success}
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || state === "busy") return;
        setState("busy");
        try {
          const res = await fetch("/api/academy/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name: name.trim(), tier_id: tierId, website }),
          });
          setState(res.ok ? "done" : "error");
        } catch {
          setState("error");
        }
      }}
      className="space-y-3"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor={`wl-name-${tierId}`}>
          {academy.waitlist.name_label}
        </label>
        <input
          id={`wl-name-${tierId}`}
          type="text"
          placeholder={academy.waitlist.name_label}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-black/40 border border-white/15 rounded-lg px-4 py-2 font-body-md text-[13px] text-on-surface focus:border-primary-container/70 focus:outline-none"
        />
        <label className="sr-only" htmlFor={`wl-email-${tierId}`}>
          {academy.waitlist.email_label}
        </label>
        <input
          id={`wl-email-${tierId}`}
          type="email"
          placeholder={academy.waitlist.email_label}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-black/40 border border-white/15 rounded-lg px-4 py-2 font-body-md text-[13px] text-on-surface focus:border-primary-container/70 focus:outline-none"
        />
        <GlowButton
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!valid || state === "busy"}
          className={!valid || state === "busy" ? "opacity-40 cursor-not-allowed" : ""}
        >
          {academy.waitlist.button}
        </GlowButton>
      </div>
      {/* Honeypot — hidden from real users */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor={`wl-website-${tierId}`}>Website</label>
        <input
          id={`wl-website-${tierId}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {state === "error" && (
        <p className="font-body-md text-[12.5px] text-red-400">{academy.waitlist.error}</p>
      )}
    </form>
  );
}
