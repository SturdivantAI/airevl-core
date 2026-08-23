"use client";

/**
 * Academy auth + progress provider.
 *
 * Two modes, decided at runtime:
 *  - Supabase mode: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY set.
 *    Magic-link (OTP email) auth, progress persisted to user-owned RLS tables.
 *  - Demo mode: env absent. Local identity + progress in localStorage so the
 *    course is fully usable before Supabase is configured. Clearly labelled in UI.
 *
 * Degradation rule (house style): never throw at module load, never 500 the page.
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { modules, course } from "./content";

// ─── Browser client (lazy, null when unconfigured) ────────────────────────────

let _client: SupabaseClient | null = null;
let _clientChecked = false;

function getBrowserSupabase(): SupabaseClient | null {
  if (_clientChecked) return _client;
  _clientChecked = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    _client = createClient(url, key);
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcademyUser {
  id: string;
  email: string;
  name: string;
}

export interface AcademyCertificate {
  certCode: string;
  holderName: string;
  score: number;
  total: number;
  issuedAt: string; // ISO date
}

interface AcademyState {
  loading: boolean;
  demoMode: boolean;
  user: AcademyUser | null;
  completed: string[]; // module ids
  courseComplete: boolean;
  certificate: AcademyCertificate | null;
  /** Issues the completion certificate once all modules are done. Idempotent. */
  awardCertificate: () => Promise<AcademyCertificate | null>;
  magicLinkSent: boolean;
  authError: string | null;
  signInMagicLink: (email: string, name: string) => Promise<void>;
  demoSignIn: (email: string, name: string) => void;
  signOut: () => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  recordQuiz: (moduleId: string, score: number, total: number) => Promise<void>;
  setDisplayName: (name: string) => void;
}

const AcademyContext = createContext<AcademyState | null>(null);

/** Supabase session user → the shape the Academy UI consumes. */
function toAcademyUser(u: User): AcademyUser {
  return {
    id: u.id,
    email: u.email ?? "",
    name:
      (u.user_metadata?.display_name as string | undefined) ??
      u.email?.split("@")[0] ??
      "Learner",
  };
}

const LS_DEMO_USER = "airevl_academy_demo_user";
const LS_PROGRESS = "airevl_academy_progress";
const LS_CERT = "airevl_academy_certificate";

function makeCertCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusable chars
  let suffix = "";
  const cryptoObj =
    typeof window !== "undefined" && typeof window.crypto?.getRandomValues === "function"
      ? window.crypto
      : undefined;
  // A zero-filled Uint8Array is not nullish, so the fallback has to branch on the
  // crypto object, not on the byte — otherwise every code degrades to AR101-AAAAAA.
  let bytes: Uint8Array;
  if (cryptoObj) {
    bytes = new Uint8Array(6);
    cryptoObj.getRandomValues(bytes);
  } else {
    bytes = Uint8Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  }
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[bytes[i]! % alphabet.length];
  }
  return `AR101-${suffix}`;
}

// ─── Local storage helpers (demo mode) ────────────────────────────────────────

function loadLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveLocal(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — non-fatal */
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AcademyProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const demoMode = supabase === null;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AcademyUser | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<AcademyCertificate | null>(null);

  // Initial session + progress load
  useEffect(() => {
    // Object wrapper, not a bare boolean: the flag is read asynchronously long
    // after the effect body has run, so it has to be shared by reference.
    const live = { current: true };
    let unsubscribe: (() => void) | undefined;

    async function init() {
      if (!supabase) {
        // Demo mode: rehydrate local identity + progress
        const demoUser = loadLocal<AcademyUser>(LS_DEMO_USER);
        const progress = loadLocal<string[]>(LS_PROGRESS) ?? [];
        const cert = loadLocal<AcademyCertificate>(LS_CERT);
        if (live.current) {
          setUser(demoUser);
          setCompleted(progress);
          setCertificate(cert);
          setLoading(false);
        }
        return;
      }

      // Subscribe before the first await so a magic-link landing that resolves
      // mid-init is not missed.
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
        if (!live.current) return;
        if (sess?.user) {
          setUser(toAcademyUser(sess.user));
          await loadRemoteProgress(supabase, toAcademyUser(sess.user), live, setCompleted, setCertificate);
        } else {
          setUser(null);
          setCompleted([]);
          setCertificate(null);
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user && live.current) {
        const u = toAcademyUser(session.user);
        setUser(u);
        await loadRemoteProgress(supabase, u, live, setCompleted, setCertificate);
      }
      if (live.current) setLoading(false);
    }

    void init();
    return () => {
      live.current = false;
      unsubscribe?.();
    };
  }, [supabase]);

  const signInMagicLink = useCallback(
    async (email: string, name: string) => {
      setAuthError(null);
      if (!supabase) return;
      const redirect =
        typeof window !== "undefined"
          ? `${window.location.origin}/training/automation-101`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirect,
          data: { display_name: name },
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    },
    [supabase]
  );

  const demoSignIn = useCallback((email: string, name: string) => {
    // A different learner on the same device starts clean — stale local progress
    // must not carry over between demo identities.
    const previous = loadLocal<AcademyUser>(LS_DEMO_USER);
    if (previous && previous.email !== email) {
      saveLocal(LS_PROGRESS, []);
      setCompleted([]);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(LS_CERT);
        } catch {
          /* storage blocked — non-fatal */
        }
      }
      setCertificate(null);
    }
    const u: AcademyUser = { id: "demo-local", email, name };
    saveLocal(LS_DEMO_USER, u);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else if (typeof window !== "undefined") {
      // Demo mode keeps everything on this device, so sign-out has to clear all
      // three keys. Leaving progress or the certificate behind would hand the
      // next learner on a shared machine someone else's record.
      for (const key of [LS_DEMO_USER, LS_PROGRESS, LS_CERT]) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          /* storage blocked — non-fatal */
        }
      }
    }
    setUser(null);
    setCompleted([]);
    setCertificate(null);
    setMagicLinkSent(false);
  }, [supabase]);

  const completeModule = useCallback(
    async (moduleId: string) => {
      setCompleted((prev) => {
        if (prev.includes(moduleId)) return prev;
        const next = [...prev, moduleId];
        if (!supabase) saveLocal(LS_PROGRESS, next);
        return next;
      });

      if (supabase && user) {
        await supabase.from("academy_progress").upsert(
          {
            user_id: user.id,
            course_id: course.id,
            module_id: moduleId,
          },
          { onConflict: "user_id,course_id,module_id", ignoreDuplicates: true }
        );
        // Mark course completion on the enrollment when all modules are done
        const done = new Set([...completed, moduleId]);
        if (modules.every((m) => done.has(m.id))) {
          await supabase
            .from("academy_enrollments")
            .upsert(
              {
                user_id: user.id,
                course_id: course.id,
                display_name: user.name,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "user_id,course_id" }
            );
        }
      }
    },
    [supabase, user, completed]
  );

  const recordQuiz = useCallback(
    async (moduleId: string, score: number, total: number) => {
      if (supabase && user) {
        await supabase.from("academy_quiz_attempts").insert({
          user_id: user.id,
          course_id: course.id,
          module_id: moduleId,
          score,
          total,
        });
      }
      // Demo mode: quiz attempts are not persisted (progress is)
    },
    [supabase, user]
  );

  const setDisplayName = useCallback(
    (name: string) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, name };
        if (!supabase) saveLocal(LS_DEMO_USER, next);
        return next;
      });
      if (supabase) {
        void supabase.auth.updateUser({ data: { display_name: name } });
      }
    },
    [supabase]
  );

  const courseComplete = modules.every((m) => completed.includes(m.id));

  const awardCertificate = useCallback(async (): Promise<AcademyCertificate | null> => {
    if (certificate) return certificate;
    if (!user || !courseComplete) return null;

    const cert: AcademyCertificate = {
      certCode: makeCertCode(),
      holderName: user.name,
      score: modules.length,
      total: modules.length,
      issuedAt: new Date().toISOString(),
    };

    if (supabase) {
      try {
        // Insert-once semantics: UNIQUE (user_id, course_id) protects against dupes.
        const { data, error } = await supabase
          .from("academy_certificates")
          .insert({
            user_id: user.id,
            course_id: course.id,
            cert_code: cert.certCode,
            holder_name: cert.holderName,
            score: cert.score,
            total: cert.total,
          })
          .select("cert_code, holder_name, score, total, issued_at")
          .single();
        if (error) {
          // Likely already issued — fetch the existing one
          const { data: existing } = await supabase
            .from("academy_certificates")
            .select("cert_code, holder_name, score, total, issued_at")
            .eq("user_id", user.id)
            .eq("course_id", course.id)
            .single();
          if (existing) {
            const found: AcademyCertificate = {
              certCode: existing.cert_code,
              holderName: existing.holder_name,
              score: existing.score,
              total: existing.total,
              issuedAt: existing.issued_at,
            };
            setCertificate(found);
            return found;
          }
          return null;
        }
        if (data) {
          const issued: AcademyCertificate = {
            certCode: data.cert_code,
            holderName: data.holder_name,
            score: data.score,
            total: data.total,
            issuedAt: data.issued_at,
          };
          setCertificate(issued);
          return issued;
        }
      } catch {
        return null;
      }
    }

    // Demo mode
    saveLocal(LS_CERT, cert);
    setCertificate(cert);
    return cert;
  }, [certificate, user, courseComplete, supabase]);

  const value: AcademyState = {
    loading,
    demoMode,
    user,
    completed,
    courseComplete,
    certificate,
    awardCertificate,
    magicLinkSent,
    authError,
    signInMagicLink,
    demoSignIn,
    signOut,
    completeModule,
    recordQuiz,
    setDisplayName,
  };

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

async function loadRemoteProgress(
  supabase: SupabaseClient,
  u: AcademyUser,
  live: { current: boolean },
  setCompleted: (ids: string[]) => void,
  setCertificate: (cert: AcademyCertificate | null) => void
) {
  try {
    // Ensure enrollment exists (idempotent)
    await supabase.from("academy_enrollments").upsert(
      { user_id: u.id, course_id: course.id, display_name: u.name },
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );
    const { data } = await supabase
      .from("academy_progress")
      .select("module_id")
      .eq("user_id", u.id)
      .eq("course_id", course.id);
    if (live.current && data) {
      setCompleted(data.map((r: { module_id: string }) => r.module_id));
    }
    const { data: cert } = await supabase
      .from("academy_certificates")
      .select("cert_code, holder_name, score, total, issued_at")
      .eq("user_id", u.id)
      .eq("course_id", course.id)
      .maybeSingle();
    if (live.current && cert) {
      setCertificate({
        certCode: cert.cert_code,
        holderName: cert.holder_name,
        score: cert.score,
        total: cert.total,
        issuedAt: cert.issued_at,
      });
    }
  } catch {
    /* network/RLS failure — leave progress empty rather than crash */
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAcademy(): AcademyState {
  const ctx = useContext(AcademyContext);
  if (!ctx) {
    throw new Error("useAcademy must be used inside <AcademyProvider>");
  }
  return ctx;
}
