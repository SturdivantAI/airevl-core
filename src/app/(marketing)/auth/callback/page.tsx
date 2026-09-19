"use client";

/**
 * Auth callback — the landing point for every Academy sign-in link.
 *
 * Why this route exists: before it, `emailRedirectTo` pointed straight at
 * `/training/automation-101`, so the access token arrived in that page's URL
 * fragment. That works only when everything else is perfect. When Supabase
 * discarded the redirect (not allow-listed) it fell back to Site URL and
 * learners landed on `http://localhost:3000/#access_token=…` — a dead address
 * on their phone, with no error and no way forward.
 *
 * This page owns that moment instead:
 *  - waits for the session to be established rather than racing it,
 *  - reports expired/used links as readable text instead of a blank course page,
 *  - strips the tokens out of the address bar before moving on, so the session
 *    is not left sitting in browser history or in a shared screenshot.
 *
 * Route: /auth/callback?next=/training/automation-101
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { getBrowserSupabase } from "@/lib/academy/browserClient";

const DEFAULT_NEXT = "/training/automation-101";
/** Longest we wait for detectSessionInUrl before calling it a failure. */
const SESSION_TIMEOUT_MS = 10_000;

/**
 * Only ever redirect to a path on this site. An open redirect here would let a
 * crafted sign-in link bounce a freshly authenticated learner to someone else's
 * domain, so anything that is not a plain absolute path is discarded.
 */
function safeNext(raw: string | null): string {
  if (!raw) return DEFAULT_NEXT;
  if (!raw.startsWith("/")) return DEFAULT_NEXT;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_NEXT;
  return raw;
}

/** Supabase reports failures in the query string or the fragment, depending on flow. */
function readAuthError(params: URLSearchParams): string | null {
  const hash =
    typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const hashParams = new URLSearchParams(hash);

  const description =
    params.get("error_description") ?? hashParams.get("error_description");
  const code = params.get("error_code") ?? hashParams.get("error_code");
  const generic = params.get("error") ?? hashParams.get("error");

  if (!description && !code && !generic) return null;

  // otp_expired is by far the most common, and the raw string is unhelpful.
  if (code === "otp_expired" || /expired/i.test(description ?? "")) {
    return "That sign-in link has expired. Links are valid for one hour and can only be used once — request a fresh one below.";
  }
  if (code === "access_denied") {
    return "That sign-in link has already been used. Request a fresh one below.";
  }
  return description ? description.replace(/\+/g, " ") : (generic ?? "Sign-in failed.");
}

type Status = "working" | "error" | "unconfigured";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  // Resolved during render, not in the effect: whether Supabase is configured at
  // all is knowable immediately, and deciding it here keeps the effect free of
  // a bare setState (react-hooks/set-state-in-effect).
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [status, setStatus] = useState<Status>(supabase ? "working" : "unconfigured");
  const [message, setMessage] = useState<string>("");
  // Guards against the timeout and the auth listener both firing.
  const settled = useRef(false);

  const succeed = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    // Drop the fragment before navigating: replaceState keeps the tokens out of
    // history, so a back-button press cannot replay them.
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    router.replace(next);
  }, [router, next]);

  const fail = useCallback((text: string) => {
    if (settled.current) return;
    settled.current = true;
    setMessage(text);
    setStatus("error");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    // Bound to a local const so the narrowing survives into the async closure.
    const client = supabase;

    // An error in the link beats anything else — do not sit spinning on it.
    const linkError = readAuthError(params);
    if (linkError) {
      fail(linkError);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      // Subscribe first: detectSessionInUrl resolves asynchronously and can land
      // before an awaited getSession() returns.
      const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
        if (session) succeed();
      });
      unsubscribe = () => sub.subscription.unsubscribe();

      const { data, error } = await client.auth.getSession();
      if (error) {
        fail(error.message);
        return;
      }
      if (data.session) {
        succeed();
        return;
      }

      timer = setTimeout(() => {
        fail(
          "We couldn't complete your sign-in. The link may have expired, or it was opened in a browser that blocked it. Request a fresh link below."
        );
      }, SESSION_TIMEOUT_MS);
    }

    void run();

    return () => {
      unsubscribe?.();
      if (timer) clearTimeout(timer);
    };
  }, [supabase, params, succeed, fail]);

  if (status === "working") {
    return (
      <GlassPanel className="p-8 text-center">
        <span
          className="material-symbols-outlined text-primary-container text-[36px] mb-3 animate-pulse"
          aria-hidden="true"
        >
          progress_activity
        </span>
        <p className="font-body-md text-body-md text-on-surface" role="status" aria-live="polite">
          Signing you in…
        </p>
        <p className="font-body-md text-[13px] text-on-surface-variant mt-2">
          Taking you back to where you left off.
        </p>
      </GlassPanel>
    );
  }

  if (status === "unconfigured") {
    return (
      <GlassPanel className="p-8 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-[36px] mb-3" aria-hidden="true">
          info
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          The Academy is running in demo mode on this deployment, so there is no sign-in link to
          complete. Your progress is saved on this device.
        </p>
        <Link href={DEFAULT_NEXT}>
          <GlowButton variant="primary">Go to the course</GlowButton>
        </Link>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel active className="p-8 text-center">
      <span className="material-symbols-outlined text-primary-container text-[36px] mb-3" aria-hidden="true">
        link_off
      </span>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
        We couldn&apos;t sign you in
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/training/signin">
          <GlowButton variant="primary">Request a new link</GlowButton>
        </Link>
        <Link href="/training">
          <GlowButton variant="secondary">Back to training</GlowButton>
        </Link>
      </div>
      <p className="font-body-md text-[12.5px] text-on-surface-variant mt-6">
        Your course progress is safe — it is tied to your account, not to the link.
      </p>
    </GlassPanel>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-xl mx-auto py-16">
      <Suspense
        fallback={
          <GlassPanel className="p-8">
            <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
          </GlassPanel>
        }
      >
        <CallbackInner />
      </Suspense>
    </div>
  );
}
