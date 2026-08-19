-- AiRevl Academy — schema for gated training (Automation 101 + paid-tier waitlist)
-- Run against Supabase SQL Editor after 001_initial_schema.sql
-- Safe to re-run: every object is guarded (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- Auth: Supabase Auth (magic link). All learner tables are user-owned via RLS.

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENROLLMENTS — one row per user per course
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  display_name TEXT,                          -- appears on the certificate
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,                   -- set when all modules complete
  UNIQUE (user_id, course_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MODULE PROGRESS — one row per user per module
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, module_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUIZ ATTEMPTS — append-only, keeps history for future analytics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CERTIFICATES — issued once all modules are complete (Tier 1 does not gate on quiz score)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_certificates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  cert_code TEXT NOT NULL UNIQUE,             -- e.g. AR101-8F3K2M — printed on cert/badge
  holder_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- WAITLIST — Tier 2/3 lead capture (written by service_role from API route only)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_waitlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  tier_id TEXT NOT NULL,                      -- 'automation-fluency' | 'automation-pro'
  organisation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, tier_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_academy_progress_user ON academy_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_user ON academy_quiz_attempts(user_id, course_id, module_id);
CREATE INDEX IF NOT EXISTS idx_academy_waitlist_tier ON academy_waitlist(tier_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS — learners read/write ONLY their own rows; waitlist is service_role only
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own enrollments select" ON academy_enrollments;
CREATE POLICY "own enrollments select" ON academy_enrollments
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own enrollments insert" ON academy_enrollments;
CREATE POLICY "own enrollments insert" ON academy_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own enrollments update" ON academy_enrollments;
CREATE POLICY "own enrollments update" ON academy_enrollments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own progress select" ON academy_progress;
CREATE POLICY "own progress select" ON academy_progress
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own progress insert" ON academy_progress;
CREATE POLICY "own progress insert" ON academy_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own quiz select" ON academy_quiz_attempts;
CREATE POLICY "own quiz select" ON academy_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own quiz insert" ON academy_quiz_attempts;
CREATE POLICY "own quiz insert" ON academy_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own certificates select" ON academy_certificates;
CREATE POLICY "own certificates select" ON academy_certificates
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own certificates insert" ON academy_certificates;
CREATE POLICY "own certificates insert" ON academy_certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Waitlist: no anon/auth policies. Only service_role (API route) may read/write.
-- Future: a public verify endpoint can look up cert_code via service_role.
