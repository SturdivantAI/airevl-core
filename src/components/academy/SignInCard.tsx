"use client";

/**
 * SignInCard — magic-link sign-in (Supabase mode) or local identity (demo mode).
 * All copy from lib/academy/content.
 */

import { useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { academy } from "@/lib/academy/content";
import { useAcademy } from "@/lib/academy/useAcademy";

export function SignInCard() {
  const { user, demoMode, magicLinkSent, authError, signInMagicLink, demoSignIn, signOut, resume } =
    useAcademy();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = /.+@.+\..+/.test(email) && name.trim().length > 0;

  if (user) {
    return (
      <GlassPanel className="p-8 text-center">
        <span className="material-symbols-outlined text-primary-container text-[36px] mb-3">
          verified_user
        </span>
        <p className="font-body-md text-body-md text-on-surface mb-1">{user.name}</p>
        <p className="font-body-md text-[13px] text-on-surface-variant mb-6">{user.email}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={
              resume?.moduleId
                ? `/training/automation-101/${resume.moduleId}`
                : "/training/automation-101"
            }
          >
            {/* "Resume course" landing on the course index is the complaint, not
                the fix: go to the module they were actually reading. */}
            <GlowButton variant="primary">{academy.resume_cta}</GlowButton>
          </Link>
          <GlowButton variant="secondary" onClick={() => void signOut()}>
            Sign out
          </GlowButton>
        </div>
      </GlassPanel>
    );
  }

  if (magicLinkSent) {
    return (
      <GlassPanel className="p-8 text-center">
        <span className="material-symbols-outlined text-primary-container text-[36px] mb-3">
          mark_email_read
        </span>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
          {academy.signin.sent_title}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {academy.signin.sent_body}
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-8">
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
        {academy.signin.title}
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
        {academy.signin.body}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || busy) return;
          if (demoMode) {
            demoSignIn(email, name.trim());
          } else {
            setBusy(true);
            void signInMagicLink(email, name.trim()).finally(() => setBusy(false));
          }
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="academy-name"
            className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5"
          >
            {academy.signin.name_label}
          </label>
          <input
            id="academy-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-2.5 font-body-md text-[14px] text-on-surface focus:border-primary-container/70 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="academy-email"
            className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5"
          >
            {academy.signin.email_label}
          </label>
          <input
            id="academy-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-2.5 font-body-md text-[14px] text-on-surface focus:border-primary-container/70 focus:outline-none"
          />
        </div>

        {demoMode && (
          <p className="font-body-md text-[12.5px] text-yellow-400/90 leading-relaxed">
            {academy.signin.demo_note}
          </p>
        )}
        {authError && (
          <p className="font-body-md text-[12.5px] text-red-400 leading-relaxed">{authError}</p>
        )}

        <GlowButton
          type="submit"
          variant="primary"
          disabled={!valid || busy}
          className={!valid || busy ? "opacity-40 cursor-not-allowed" : ""}
        >
          {demoMode ? academy.signin.demo_button : academy.signin.button}
        </GlowButton>
      </form>
    </GlassPanel>
  );
}
