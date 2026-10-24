"use client";

/**
 * SignInCard — magic-link sign-in (Supabase mode) or local identity (demo mode).
 * All copy from lib/academy/content.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { academy } from "@/lib/academy/content";
import { useAcademy } from "@/lib/academy/useAcademy";

export function SignInCard() {
  const {
    user,
    demoMode,
    magicLinkSent,
    pendingEmail,
    authError,
    signInMagicLink,
    verifyEmailCode,
    resetSignIn,
    demoSignIn,
    signOut,
    resume,
  } = useAcademy();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);
  // Supabase refuses a second email to the same address within 60 seconds.
  // Count down visibly rather than let the learner hit a silent rate limit.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
    const codeValid = /^\d{6,8}$/.test(code.replace(/\s+/g, ""));
    return (
      <GlassPanel className="p-8">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary-container text-[36px] mb-3">
            mark_email_read
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            {academy.signin.sent_title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {academy.signin.sent_body}{" "}
            <span className="text-on-surface font-semibold break-all">{pendingEmail}</span>.
          </p>
          <p className="font-body-md text-[13px] text-on-surface-variant mt-2 leading-relaxed">
            {academy.signin.sent_hint}
          </p>
        </div>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!codeValid || busy) return;
            setBusy(true);
            void verifyEmailCode(code).finally(() => setBusy(false));
          }}
        >
          <label
            htmlFor="academy-code"
            className="block font-label-caps text-label-caps text-on-surface-variant"
          >
            {academy.signin.code_label}
          </label>
          <input
            id="academy-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder="123456"
            className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-2.5 font-data-mono text-[20px] tracking-[0.4em] text-center text-on-surface focus:border-primary-container/70 focus:outline-none"
          />
          {authError && (
            <p className="font-body-md text-[12.5px] text-red-400 leading-relaxed">{authError}</p>
          )}
          <GlowButton
            type="submit"
            variant="primary"
            disabled={!codeValid || busy}
            className={`w-full ${!codeValid || busy ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {academy.signin.code_button}
          </GlowButton>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 font-body-md text-[13px]">
          <button
            type="button"
            disabled={cooldown > 0 || busy}
            onClick={() => {
              if (!pendingEmail) return;
              setResent(false);
              setBusy(true);
              void signInMagicLink(pendingEmail, name.trim())
                .then(() => {
                  setResent(true);
                  setCooldown(60);
                })
                .finally(() => setBusy(false));
            }}
            className="text-primary-container hover:underline disabled:text-on-surface-variant disabled:no-underline disabled:cursor-not-allowed"
          >
            {cooldown > 0
              ? `${academy.signin.resend_wait} ${cooldown}s`
              : academy.signin.resend_button}
          </button>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setResent(false);
              resetSignIn();
            }}
            className="text-on-surface-variant hover:text-primary-container"
          >
            {academy.signin.change_email}
          </button>
        </div>
        {resent && (
          <p className="mt-3 text-center font-body-md text-[12.5px] text-green-400">
            {academy.signin.resent_note}
          </p>
        )}
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
            void signInMagicLink(email, name.trim())
              .then(() => setCooldown(60))
              .finally(() => setBusy(false));
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
