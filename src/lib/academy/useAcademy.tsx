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
  useRef,
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

export interface ResumePoint {
  moduleId: string;
  blockIndex: number;
  seenAt: string | null;
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
  /** Where the learner stopped reading. Null until they open a module. */
  resume: ResumePoint | null;
  /** Report the furthest block scrolled into view. Debounced; monotonic per module. */
  recordPosition: (moduleId: string, blockIndex: number) => void;
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
const LS_RESUME = "airevl_academy_resume";

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
  const [resume, setResume] = useState<ResumePoint | null>(null);
  // Mirrors `resume` for the monotonic comparison in recordPosition: that runs
  // from a scroll observer and must not re-create itself on every state change.
  const resumeRef = useRef<ResumePoint | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keeps state and the ref in lockstep. loadRemoteProgress hands the fetched
  // point back through this so recordPosition's monotonic check starts from
  // what the server already knows, not from zero.
  const applyResume = useCallback((r: ResumePoint | null) => {
    resumeRef.current = r;
    setResume(r);
  }, []);

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
        const saved = loadLocal<ResumePoint>(LS_RESUME);
        if (live.current) {
          setUser(demoUser);
          setCompleted(progress);
          setCertificate(cert);
          setResume(saved);
          resumeRef.current = saved;
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
          await loadRemoteProgress(supabase, toAcademyUser(sess.user), live, setCompleted, setCertificate, applyResume);
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
        await loadRemoteProgress(supabase, u, live, setCompleted, setCertificate, applyResume);
      }
      if (live.current) setLoading(false);
    }

    void init();
    return () => {
      live.current = false;
      unsubscribe?.();
    };
    // applyResume is a stable useCallback([]) — listed to satisfy the linter
    // without re-running session init, which would re-subscribe the auth listener.
  }, [supabase, applyResume]);

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
      // Demo mode keeps everything on this device, so sign-out has to clear
      // every key. Leaving progress, the certificate or the resume point behind
      // would hand the next learner on a shared machine someone else's record.
      for (const key of [LS_DEMO_USER, LS_PROGRESS, LS_CERT, LS_RESUME]) {
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

  // ─── Resume point ──────────────────────────────────────────────────────────

  const recordPosition = useCallback(
    (moduleId: string, blockIndex: number) => {
      const prev = resumeRef.current;
      // Monotonic within a module: scrolling back up to re-read an earlier block
      // must not drag the resume point backwards. Switching module always wins,
      // because that is a deliberate navigation rather than a scroll.
      if (prev && prev.moduleId === moduleId && blockIndex <= prev.blockIndex) return;

      const next: ResumePoint = {
        moduleId,
        blockIndex,
        seenAt: new Date().toISOString(),
      };
      resumeRef.current = next;
      setResume(next);

      if (!supabase || !user) {
        saveLocal(LS_RESUME, next);
        return;
      }

      // Debounced: this fires from a scroll observer, and one write per block
      // boundary would be a request per second on a long module.
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => {
        void supabase
          .from("academy_enrollments")
          .update({
            last_module_id: next.moduleId,
            last_block_index: next.blockIndex,
            last_seen_at: next.seenAt,
          })
          .eq("user_id", user.id)
          .eq("course_id", course.id);
      }, 1500);
    },
    [supabase, user]
  );

  // A pending write must not be lost when the learner navigates away mid-debounce.
  useEffect(() => {
    return () => {
      if (!flushTimer.current) return;
      clearTimeout(flushTimer.current);
      const pending = resumeRef.current;
      if (!supabase || !user || !pending) return;
      void supabase
        .from("academy_enrollments")
        .update({
          last_module_id: pending.moduleId,
          last_block_index: pending.blockIndex,
          last_seen_at: pending.seenAt,
        })
        .eq("user_id", user.id)
        .eq("course_id", course.id);
    };
  }, [supabase, user]);

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
    resume,
    recordPosition,
  };

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

async function loadRemoteProgress(
  supabase: SupabaseClient,
  u: AcademyUser,
  live: { current: boolean },
  setCompleted: (ids: string[]) => void,
  setCertificate: (cert: AcademyCertificate | null) => void,
  applyResume: (r: ResumePoint | null) => void
) {
  try {
    // Ensure enrollment exists (idempotent)
    await supabase.from("academy_enrollments").upsert(
      { user_id: u.id, course_id: course.id, display_name: u.name },
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );
    const { data: enrolment } = await supabase
      .from("academy_enrollments")
      .select("last_module_id, last_block_index, last_seen_at")
      .eq("user_id", u.id)
      .eq("course_id", course.id)
      .maybeSingle();
    if (live.current) {
      applyResume(
        enrolment?.last_module_id
          ? {
              moduleId: enrolment.last_module_id,
              blockIndex: enrolment.last_block_index ?? 0,
              seenAt: enrolment.last_seen_at ?? null,
            }
          : null
      );
    }
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
