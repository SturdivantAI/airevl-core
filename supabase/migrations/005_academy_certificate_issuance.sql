-- AiRevl Academy — certificate issuance hardening + public verification
--
-- Three problems this fixes, in order of severity.
--
-- 1. Certificates were self-issued. The browser generated the code and inserted
--    the row itself under the learner's own RLS policy, which means holder_name
--    and score were whatever the client chose to send. Anyone who could open
--    devtools could mint an AiRevl certificate in someone else's name, with a
--    perfect score, without completing a single module. Issuance moves to the
--    server, which checks module completion before writing anything.
--
-- 2. There was no way to check a certificate. A PDF someone prints from their
--    own browser is worth exactly what the reader's trust in it is worth. A
--    public verify function makes the code checkable by an employer.
--
-- 3. Nothing recorded who the certificate was sent to, or whether it ever went
--    out, so a failed send was invisible.
--
-- Safe to re-run: every object is guarded.

-- ═══════════════════════════════════════════════════════════════════════════════
-- COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE academy_certificates
  ADD COLUMN IF NOT EXISTS recipient_email   TEXT,
  ADD COLUMN IF NOT EXISTS public_verifiable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_sent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at        TIMESTAMPTZ;

COMMENT ON COLUMN academy_certificates.recipient_email IS
  'Address the certificate was delivered to, captured at issuance. Never exposed by the public verify function.';
COMMENT ON COLUMN academy_certificates.public_verifiable IS
  'Learner consent for the holder name to be returned by the public verify endpoint. FALSE hides the certificate from verification without deleting it.';
COMMENT ON COLUMN academy_certificates.email_sent_at IS
  'NULL means the certificate exists but delivery has not succeeded — the issuing route retries on a later request.';
COMMENT ON COLUMN academy_certificates.revoked_at IS
  'Set to withdraw a certificate. Verification then reports it as revoked rather than returning nothing, so a revoked code is distinguishable from a fake one.';

CREATE INDEX IF NOT EXISTS idx_academy_certificates_code
  ON academy_certificates (upper(cert_code));

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS — issuance is server-only from here on
-- ═══════════════════════════════════════════════════════════════════════════════

-- The learner keeps SELECT on their own certificate (the course page reads it),
-- but loses INSERT. /api/academy/certificate issues it with service_role after
-- verifying academy_progress, so holder_name and score are no longer client input.
DROP POLICY IF EXISTS "own certificates insert" ON academy_certificates;

-- Unchanged, restated for clarity: a learner reads only their own certificate.
DROP POLICY IF EXISTS "own certificates select" ON academy_certificates;
CREATE POLICY "own certificates select" ON academy_certificates
  FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PUBLIC VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- SECURITY DEFINER so an unauthenticated visitor can check a code without any
-- read access to the table itself. Deliberately narrow: it returns the holder
-- name, the course and the issue date, and nothing else. Email, score, user_id
-- and the enrolment history stay unreachable, so a scraper walking the code
-- space learns nothing it could not learn from a certificate handed to it.
CREATE OR REPLACE FUNCTION public.verify_certificate(code TEXT)
RETURNS TABLE (
  cert_code   TEXT,
  holder_name TEXT,
  course_id   TEXT,
  issued_at   TIMESTAMPTZ,
  revoked     BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.cert_code,
    c.holder_name,
    c.course_id,
    c.issued_at,
    (c.revoked_at IS NOT NULL) AS revoked
  FROM academy_certificates c
  WHERE upper(c.cert_code) = upper(btrim(code))
    AND c.public_verifiable = TRUE
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.verify_certificate(TEXT) IS
  'Public certificate check. Returns holder name, course and issue date for a valid, consented, code. Returns no rows for an unknown code.';
