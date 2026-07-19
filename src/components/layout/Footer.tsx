"use client";

/**
 * T1.9 — Footer: Contact + Social Dock + CAC Micro-text
 * ALL values from brand.ts — no hardcoded strings (blueprint §3 directive).
 * Source of truth: .kiro/DESIGN.md §10 Footer / Contact / Social Dock
 */

import Link from "next/link";
import { corporateEmail, socialMedia, cacPlaceholder, companyName, tagline, nav } from "@/lib/brand";

const SOCIAL_LINKS = [
  {
    key: "linkedin",
    label: "LinkedIn",
    href: socialMedia.linkedin,
    abbr: "LI",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    key: "x",
    label: "X",
    href: socialMedia.x,
    abbr: "X",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    href: socialMedia.youtube === "PENDING_CHANNEL" ? "#" : socialMedia.youtube,
    abbr: "YT",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    href: socialMedia.tiktok,
    abbr: "TK",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.11 7.47-1.99 1.95-4.81 2.91-7.6 2.63-2.73-.26-5.25-1.62-6.9-3.77-1.66-2.15-2.31-4.99-1.84-7.69.46-2.71 1.92-5.18 4.08-6.84 2.15-1.65 4.96-2.38 7.7-2.07v4.11c-1.39-.21-2.86-.03-4.14.56-1.29.58-2.37 1.58-3.03 2.81-.66 1.23-.9 2.7-.63 4.09.28 1.39 1.05 2.63 2.14 3.48 1.09.84 2.5 1.2 3.88 1.04 1.39-.15 2.69-.84 3.61-1.92.93-1.07 1.43-2.51 1.42-3.97-.02-5.46-.01-10.93-.02-16.39z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    href: socialMedia.instagram,
    abbr: "IG",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    href: socialMedia.facebook,
    abbr: "FB",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
      </svg>
    ),
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full mt-8">
      {/* Contact CTA */}
      <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/5 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-container/5 to-transparent pointer-events-none" />
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 relative z-10">
          Secure Comm Channel
        </p>
        <a
          href={`mailto:${corporateEmail}`}
          className="font-display-lg text-[28px] md:text-[40px] text-primary-container hover:text-primary transition-colors font-bold tracking-tight animate-pulse-cyan relative z-10 text-glow"
        >
          {corporateEmail}
        </a>
        <p className="font-data-mono text-data-mono text-on-surface-variant mt-3 max-w-md relative z-10">
          Initiate encrypted handshake for enterprise deployment or security consultation.
        </p>
      </div>

      {/* Dock + Utility layer */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-5 border-t border-white/10">
        {/* Social icon dock */}
        <div className="flex items-center gap-3 px-5 py-2.5 glass-panel rounded-full border border-white/5">
          {SOCIAL_LINKS.map(({ key, label, href, icon }, i) => (
            <span key={key} className="flex items-center gap-3">
              <a
                href={href}
                target={href !== "#" ? "_blank" : undefined}
                rel="noopener noreferrer"
                title={label}
                aria-label={label}
                className="text-on-surface-variant hover:text-primary-container transition-colors"
              >
                {icon}
              </a>
              {i < SOCIAL_LINKS.length - 1 && (
                <span className="w-px h-4 bg-white/10" />
              )}
            </span>
          ))}
        </div>

        {/* CAC micro-text utility layer */}
        <div className="flex flex-col md:items-end text-center md:text-right font-data-mono text-[10px] text-on-surface-variant/50 leading-tight">
          <div className="flex items-center gap-3 mb-1">
            {nav.footer_links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-on-surface-variant/70 hover:text-primary-container transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="text-on-surface-variant/70 text-[11px] italic mb-0.5">{tagline}</p>
          <p>{cacPlaceholder}</p>
          <p>© {year} {companyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
