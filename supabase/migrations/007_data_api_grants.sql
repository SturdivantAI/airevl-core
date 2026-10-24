-- Table privileges for the Supabase Data API.
--
-- Newer Supabase projects do not grant table access to the anon and
-- authenticated roles automatically. Without these grants every browser
-- request was refused with 42501 "permission denied", so module completions
-- were never saved, progress always loaded as empty, and no learner could
-- reach the certificate step. Row Level Security still decides WHICH rows a
-- role sees; these grants only let the request reach RLS at all.
--
-- Applied to production on 2026-10-24 via the SQL Editor. Safe to re-run.
-- Deliberately NOT granted: audit_events (private, see 006) and
-- academy_waitlist (server route only).

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Learners: own rows only, enforced by the RLS policies in 002 and 005.
GRANT SELECT, INSERT, UPDATE ON academy_enrollments TO authenticated;
GRANT SELECT, INSERT ON academy_progress, academy_quiz_attempts TO authenticated;
GRANT SELECT ON academy_certificates TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Public demo pages: read-only.
GRANT SELECT ON telemetry_packets, telemetry_nodes, network_telemetry,
  training_sections, training_courses, ecosystem_nodes, ecosystem_edges
  TO anon, authenticated;

-- Server routes (certificate issuance, waitlist) run as service_role.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
