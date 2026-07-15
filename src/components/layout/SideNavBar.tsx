"use client";

/**
 * T1.7 — SideNavBar
 * All brand strings imported from brand.ts — no hardcoded text.
 * Source of truth: .kiro/DESIGN.md §8 Shared Layout Components
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { companyName } from "@/lib/brand";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard", icon: "space_dashboard" },
  { href: "/training",  label: "Training",  icon: "model_training"  },
  { href: "/telemetry", label: "Telemetry", icon: "analytics"       },
  { href: "/security",  label: "Security",  icon: "terminal"        },
] as const;

export function SideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 py-8 px-4 bg-surface-container/60 backdrop-blur-xl border-r border-white/10">

      {/* Brand */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/AiRevl-logo.png" alt={companyName} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline-lg text-[22px] font-bold text-primary-container tracking-tighter leading-none">
            {companyName}
          </span>
          <span className="font-label-caps text-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider mt-0.5">
            Enterprise Elite
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body-md text-body-md transition-colors ${
                isActive
                  ? "text-primary-container border-r-2 border-primary-container bg-primary-container/10"
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="mt-8 mb-6 px-2">
        <button className="w-full py-3 px-4 bg-transparent border border-primary-container text-primary-container font-label-caps text-label-caps rounded uppercase tracking-wider hover:bg-primary-container/10 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          Initialize Protocol
        </button>
      </div>

      {/* Footer nav */}
      <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
        {[
          { label: "Settings", icon: "settings" },
          { label: "Support",  icon: "help"     },
        ].map(({ label, icon }) => (
          <Link
            key={label}
            href="#"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant text-sm font-body-md hover:bg-white/5 transition-colors opacity-70 hover:opacity-100"
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
