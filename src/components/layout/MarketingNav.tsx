"use client";

/**
 * MarketingNav — top navigation bar for the marketing shell.
 * Logo lockup left, nav links right (desktop), hamburger overlay (mobile).
 * All labels from brand.json via lib/brand.ts.
 * Focus-trapped mobile overlay, Escape/nav-click closes, aria-expanded on trigger.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { companyName, nav, lockupDescriptor } from "@/lib/brand";

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to trigger
    setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Focus trap
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !overlayRef.current) return;
      const els = overlayRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full bg-surface-dim/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 md:px-8">
        {/* Logo lockup */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/AiRevl-logo.png"
              alt={companyName}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-[20px] font-bold text-primary-container tracking-tighter leading-none">
              {companyName}
            </span>
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">
              {lockupDescriptor}
            </span>
          </div>
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
          ref={triggerRef}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-overlay"
          onClick={() => setOpen((prev) => !prev)}
          className="md:hidden text-on-surface-variant hover:text-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">
            {open ? "close" : "menu"}
          </span>
        </button>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          id="mobile-nav-overlay"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-[60] bg-[#050508]/95 backdrop-blur-xl flex flex-col pt-20 px-8 pb-8 md:hidden overflow-y-auto"
        >
          {/* Close button at top-right */}
          <button
            onClick={close}
            aria-label="Close navigation menu"
            className="absolute top-5 right-6 text-on-surface-variant hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>

          {/* Nav links */}
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2 flex-1">
            {nav.marketing_links.map(({ label, href }) => {
              const isActive =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`text-[20px] font-body-md py-3 border-b border-white/5 transition-colors ${
                    isActive
                      ? "text-primary-container"
                      : "text-on-surface hover:text-primary-container"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <Link
            href={nav.cta_href}
            onClick={close}
            className="mt-6 w-full text-center px-6 py-4 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
          >
            {nav.cta_label}
          </Link>
        </div>
      )}
    </>
  );
}
