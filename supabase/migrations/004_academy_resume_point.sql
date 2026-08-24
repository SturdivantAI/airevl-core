-- AiRevl Academy — resume point
--
-- academy_progress records which modules are *finished*. It cannot answer
-- "where was I?", so a learner who stops halfway through a module — or whose
-- session lapses — comes back to the course index and has to find their place,
-- then re-scroll from the top of a long module.
--
-- One row per user per course already exists (academy_enrollments), so the
-- resume point lives there rather than in a new table.
--
-- Safe to re-run: every column is added IF NOT EXISTS.

ALTER TABLE academy_enrollments
  ADD COLUMN IF NOT EXISTS last_module_id   TEXT,
  ADD COLUMN IF NOT EXISTS last_block_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_at     TIMESTAMPTZ;

-- Guard against a negative index arriving from a client bug and breaking the
-- scroll restore. Upper bound is deliberately not enforced here: module length
-- lives in content.ts and changes without a migration.
DO $$ BEGIN
  ALTER TABLE academy_enrollments
    ADD CONSTRAINT academy_enrollments_last_block_index_nonneg
    CHECK (last_block_index >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN academy_enrollments.last_module_id IS
  'Module the learner was last reading. NULL until they open one.';
COMMENT ON COLUMN academy_enrollments.last_block_index IS
  'Furthest lesson block scrolled into view within last_module_id. Monotonic per module: it advances but never rewinds, so glancing back at an earlier block does not lose the resume point.';
COMMENT ON COLUMN academy_enrollments.last_seen_at IS
  'When the resume point was last written. Drives the "picked up N days ago" copy.';
