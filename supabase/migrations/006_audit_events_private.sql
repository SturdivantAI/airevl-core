-- Close public read access to the audit table (THREAT_MODEL finding F-2).
--
-- 001_initial_schema.sql gave audit_events a `public_read` policy USING (true),
-- so anyone holding the public anon key could read every audit row. No browser
-- code reads this table: audit events are written to the Upstash stream by
-- src/lib/security/guard.ts. With RLS still enabled and no SELECT policy left,
-- anon and authenticated roles see zero rows; the service role is unaffected.
--
-- Safe to re-run.

DROP POLICY IF EXISTS "public_read" ON audit_events;
