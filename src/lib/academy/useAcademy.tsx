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
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { modules, course } from "./content";
import { getBrowserSupabase } from "./browserClient";

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

/** What the learner asks to have printed, collected at issuance rather than reused from sign-up. */
export interface CertificateIssueRequest {
  /** Full name as it should appear on the certificate and on public verification. */
  holderName: string;
  /** Consent for the name to be returned by /verify/<code>. */
  publicVerifiable: boolean;
}

export interface CertificateIssueResult {
  certificate: AcademyCertificate | null;
  /** Whether the certificate email actually went out on this request. */
  emailed: boolean;
  /** "incomplete" | "signed_out" | "demo_mode" | "not_configured" | "unavailable" | … */
  error?: string;
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
  awardCertificate: (opts: CertificateIssueRequest) => Promise<CertificateIssueResult>;
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
      // Land on our own callback, not straight on the course. The callback
      // establishes the session, strips the tokens out of the address bar, and
      // can show a real error instead of a half-signed-in course page.
      //
      // This URL must be allow-listed in Supabase → Authentication → URL
      // Configuration → Redirect URLs (`https://airevl.ai/**` covers it).
      // Supabase silently discards a redirect_to that is not on that list and
      // falls back to Site URL — which is how sign-in ended up on localhost.
      const redirect =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              "/training/automation-101"
            )}`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirect,
          data: { display_name: name },
        },
      });
      if (error) {
        // The project-wide email cap is the failure learners hit in groups, and
        // Supabase reports it as a generic 429. Say what actually happened.
        const overEmailQuota =
          error.status === 429 || /rate limit|too many requests/i.test(error.message);
        setAuthError(
          overEmailQuota
            ? "We couldn't send your sign-in link just now — our email service is at capacity. Please try again in a few minutes."
            : error.message
        );
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

  const awardCertificate = useCallback(
    async (opts: CertificateIssueRequest): Promise<CertificateIssueResult> => {
      const holderName = opts.holderName.trim() || (user?.name ?? "");
      if (!user || !courseComplete) {
        return { certificate: null, emailed: false, error: "not_eligible" };
      }

      // Demo mode: there is no server to issue from and nothing is recorded
      // anywhere, so this certificate is explicitly not verifiable. The UI says
      // so rather than implying a credential that no one can check.
      if (!supabase) {
        const cert: AcademyCertificate = {
          certCode: makeCertCode(),
          holderName,
          score: modules.length,
          total: modules.length,
          issuedAt: new Date().toISOString(),
        };
        saveLocal(LS_CERT, cert);
        setCertificate(cert);
        return { certificate: cert, emailed: false, error: "demo_mode" };
      }

      // Issuance is the server's job now. The browser used to generate the code
      // and insert the row itself, which meant the name and score on a
      // certificate were whatever the client chose to send. See
      // /api/academy/certificate and migration 005.
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) {
          return { certificate: null, emailed: false, error: "signed_out" };
        }

        const res = await fetch("/api/academy/certificate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            holder_name: holderName,
            public_verifiable: opts.publicVerifiable,
          }),
        });

        const payload = (await res.json().catch(() => null)) as {
          ok?: boolean;
          emailed?: boolean;
          error?: string;
          certificate?: AcademyCertificate;
        } | null;

        if (!res.ok || !payload?.ok || !payload.certificate) {
          return {
            certificate: null,
            emailed: false,
            error: payload?.error ?? "unavailable",
          };
        }

        setCertificate(payload.certificate);
        return { certificate: payload.certificate, emailed: Boolean(payload.emailed) };
      } catch {
        return { certificate: null, emailed: false, error: "unavailable" };
      }
    },
    [user, courseComplete, supabase]
  );

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
