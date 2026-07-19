"use client";

/**
 * Contact page — working form with honeypot, consent gate, and accessible states.
 * Route: /contact
 * Submits to /api/contact (Zod + sanitize + rate limit + Formspree).
 * All labels from brand.json via lib/brand.ts.
 */

import { useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { stubs, corporateEmail } from "@/lib/brand";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "", // organization → mapped to subject for schema compat
    message: "",
    website: "", // honeypot
  });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "", website: "" });
        setConsent(false);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="p-6 md:p-container-padding max-w-2xl mx-auto py-16">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-3">
        {stubs.contact.title}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-8">
        {stubs.contact.body}
      </p>

      {status === "success" ? (
        <GlassPanel className="p-8 text-center" aria-live="polite">
          <span className="material-symbols-outlined text-primary-container text-4xl mb-4 block">check_circle</span>
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Message received
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            We reply within 2 business days.
          </p>
        </GlassPanel>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <GlassPanel className="p-8 flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-name" className="font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                Name *
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary-container/50 placeholder:text-on-surface-variant/40"
                placeholder="Your full name"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                Email *
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary-container/50 placeholder:text-on-surface-variant/40"
                placeholder="you@company.com"
              />
            </div>

            {/* Organization (optional) — sent as "subject" to match schema */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-org" className="font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                Organization
              </label>
              <input
                id="contact-org"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                className="bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary-container/50 placeholder:text-on-surface-variant/40"
                placeholder="Company or institution (optional)"
              />
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                Message *
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                className="bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 font-body-md text-on-surface resize-y focus:outline-none focus:border-primary-container/50 placeholder:text-on-surface-variant/40"
                placeholder="How can we help?"
              />
            </div>

            {/* Honeypot — hidden from real users */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={handleChange}
              />
            </div>

            {/* Consent checkbox + Privacy link */}
            <div className="flex items-start gap-3 mt-2">
              <input
                id="contact-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-surface-container-lowest text-primary-container focus:ring-primary-container/50"
              />
              <label htmlFor="contact-consent" className="font-body-md text-[13px] text-on-surface-variant leading-snug">
                By submitting, you agree to our{" "}
                <Link href="/privacy" className="text-primary-container hover:underline">
                  Privacy Notice
                </Link>.
              </label>
            </div>

            {/* Error state */}
            {status === "error" && (
              <p className="font-body-md text-[13px] text-error" role="alert" aria-live="assertive">
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!consent || status === "sending"}
              className="mt-2 w-full py-3 px-4 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </GlassPanel>
        </form>
      )}

      {/* Fallback email */}
      <p className="font-data-mono text-data-mono text-on-surface-variant mt-8 text-center text-[12px]">
        Prefer email?{" "}
        <a href={`mailto:${corporateEmail}`} className="text-primary-container hover:underline">
          {corporateEmail}
        </a>
      </p>
    </div>
  );
}
