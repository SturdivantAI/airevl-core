-- AiRevl Academy — signup hardening: email-domain policy + per-IP signup throttle
-- Runs as a Supabase "Before User Created" auth hook, so it is enforced no matter
-- how the request arrives. The browser talks to /auth/v1/otp directly using the
-- publishable key, which ships in the JS bundle — any check in SignInCard.tsx is
-- decorative. This is the enforcement point.
--
-- Safe to re-run: every object is guarded.

-- ═══════════════════════════════════════════════════════════════════════════════
-- DOMAIN POLICY — data-driven so the list is edited with SQL, not a migration
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE academy_domain_rule AS ENUM ('allow', 'deny');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS academy_signup_domains (
  domain      TEXT PRIMARY KEY,
  rule        academy_domain_rule NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 'allow' wins over 'deny', so a partner on a consumer domain can be waved
-- through by inserting one row without unpicking the deny list.
CREATE INDEX IF NOT EXISTS idx_academy_signup_domains_rule
  ON academy_signup_domains(rule);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SIGNUP THROTTLE — per-IP, independent of Supabase's own auth rate limits
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_signup_attempts (
  id           BIGSERIAL PRIMARY KEY,
  ip_address   TEXT NOT NULL,
  email_domain TEXT,
  outcome      TEXT NOT NULL,          -- 'allowed' | 'denied_domain' | 'denied_rate'
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_signup_attempts_ip_time
  ON academy_signup_attempts(ip_address, attempted_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS — neither table is client-facing. No anon/authenticated policies at all;
-- the hook reaches them via SECURITY DEFINER, and ops uses service_role.
-- Without this, both are readable through PostgREST with the publishable key —
-- which would publish the blocklist and every signup attempt IP.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE academy_signup_domains  ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_signup_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON academy_signup_domains  FROM anon, authenticated;
REVOKE ALL ON academy_signup_attempts FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- THE HOOK
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hook_restrict_academy_signup(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER                 -- runs as owner so RLS above does not lock it out
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email     TEXT;
  v_domain    TEXT;
  v_ip        TEXT;
  v_allowed   BOOLEAN;
  v_denied    BOOLEAN;
  v_recent    INTEGER;
  -- Per-IP cap on NEW account creation per hour. Generous enough for a company
  -- onboarding a cohort from one NAT'd office egress, tight enough that burner
  -- farming is not free. Tune here.
  c_max_per_hour CONSTANT INTEGER := 10;
BEGIN
  v_email := lower(nullif(trim(event -> 'user' ->> 'email'), ''));
  v_ip    := coalesce(event -> 'metadata' ->> 'ip_address', 'unknown');

  -- No email on the payload (e.g. a phone signup) — nothing for this hook to
  -- judge. Fail open rather than bricking a provider we did not anticipate.
  IF v_email IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;

  v_domain := split_part(v_email, '@', 2);
  IF v_domain = '' THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message',   'That email address is not valid.'
    ));
  END IF;

  -- Throttle first: a denied-by-domain attempt is cheap, but we still do not
  -- want an unlimited number of them from one source.
  SELECT count(*) INTO v_recent
  FROM academy_signup_attempts
  WHERE ip_address = v_ip
    AND attempted_at > now() - INTERVAL '1 hour';

  IF v_recent >= c_max_per_hour THEN
    INSERT INTO academy_signup_attempts (ip_address, email_domain, outcome)
    VALUES (v_ip, v_domain, 'denied_rate');
    RETURN jsonb_build_object('error', jsonb_build_object(
      'http_code', 429,
      'message',   'Too many sign-up attempts from this network. Try again in an hour.'
    ));
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM academy_signup_domains
    WHERE rule = 'allow' AND domain = v_domain
  ) INTO v_allowed;

  IF v_allowed THEN
    INSERT INTO academy_signup_attempts (ip_address, email_domain, outcome)
    VALUES (v_ip, v_domain, 'allowed');
    RETURN '{}'::JSONB;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM academy_signup_domains
    WHERE rule = 'deny' AND domain = v_domain
  ) INTO v_denied;

  IF v_denied THEN
    INSERT INTO academy_signup_attempts (ip_address, email_domain, outcome)
    VALUES (v_ip, v_domain, 'denied_domain');
    RETURN jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message',   'Please sign up with your work email address. Free and temporary email providers are not accepted.'
    ));
  END IF;

  INSERT INTO academy_signup_attempts (ip_address, email_domain, outcome)
  VALUES (v_ip, v_domain, 'allowed');

  -- Opportunistic cleanup: the throttle only ever reads one hour back, so
  -- anything older than a day is dead weight. Cheap because it is rare.
  IF random() < 0.01 THEN
    DELETE FROM academy_signup_attempts WHERE attempted_at < now() - INTERVAL '1 day';
  END IF;

  RETURN '{}'::JSONB;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hook_restrict_academy_signup(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.hook_restrict_academy_signup(JSONB) FROM anon, authenticated, public;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED — free consumer providers and disposable/burner services.
-- `reason` is the category handle: DELETE FROM academy_signup_domains
-- WHERE reason = 'consumer'  turns this back into a disposables-only filter.
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO academy_signup_domains (domain, rule, reason) VALUES
  -- Free consumer mailboxes
  ('gmail.com','deny','consumer'),            ('googlemail.com','deny','consumer'),
  ('yahoo.com','deny','consumer'),            ('yahoo.co.uk','deny','consumer'),
  ('yahoo.co.in','deny','consumer'),          ('ymail.com','deny','consumer'),
  ('hotmail.com','deny','consumer'),          ('hotmail.co.uk','deny','consumer'),
  ('outlook.com','deny','consumer'),          ('live.com','deny','consumer'),
  ('live.co.uk','deny','consumer'),           ('msn.com','deny','consumer'),
  ('aol.com','deny','consumer'),              ('icloud.com','deny','consumer'),
  ('me.com','deny','consumer'),               ('mac.com','deny','consumer'),
  ('proton.me','deny','consumer'),            ('protonmail.com','deny','consumer'),
  ('pm.me','deny','consumer'),                ('gmx.com','deny','consumer'),
  ('gmx.de','deny','consumer'),               ('gmx.net','deny','consumer'),
  ('mail.com','deny','consumer'),             ('mail.ru','deny','consumer'),
  ('yandex.com','deny','consumer'),           ('yandex.ru','deny','consumer'),
  ('zoho.com','deny','consumer'),             ('tutanota.com','deny','consumer'),
  ('tuta.io','deny','consumer'),              ('fastmail.com','deny','consumer'),
  ('hey.com','deny','consumer'),              ('qq.com','deny','consumer'),
  ('163.com','deny','consumer'),              ('126.com','deny','consumer'),
  ('sina.com','deny','consumer'),             ('naver.com','deny','consumer'),
  ('daum.net','deny','consumer'),             ('rediffmail.com','deny','consumer'),
  ('web.de','deny','consumer'),               ('t-online.de','deny','consumer'),
  ('orange.fr','deny','consumer'),            ('free.fr','deny','consumer'),
  ('laposte.net','deny','consumer'),          ('libero.it','deny','consumer'),
  ('comcast.net','deny','consumer'),          ('verizon.net','deny','consumer'),
  ('att.net','deny','consumer'),              ('sbcglobal.net','deny','consumer'),
  ('bellsouth.net','deny','consumer'),        ('cox.net','deny','consumer'),
  ('btinternet.com','deny','consumer'),       ('sky.com','deny','consumer'),
  ('virginmedia.com','deny','consumer'),      ('talktalk.net','deny','consumer'),
  ('ntlworld.com','deny','consumer'),         ('blueyonder.co.uk','deny','consumer'),

  -- Disposable / burner services
  ('mailinator.com','deny','disposable'),     ('guerrillamail.com','deny','disposable'),
  ('sharklasers.com','deny','disposable'),    ('10minutemail.com','deny','disposable'),
  ('tempmail.com','deny','disposable'),       ('temp-mail.org','deny','disposable'),
  ('tempr.email','deny','disposable'),        ('throwawaymail.com','deny','disposable'),
  ('yopmail.com','deny','disposable'),        ('trashmail.com','deny','disposable'),
  ('getnada.com','deny','disposable'),        ('dispostable.com','deny','disposable'),
  ('maildrop.cc','deny','disposable'),        ('fakeinbox.com','deny','disposable'),
  ('mailnesia.com','deny','disposable'),      ('mytemp.email','deny','disposable'),
  ('discard.email','deny','disposable'),      ('spamgourmet.com','deny','disposable'),
  ('mohmal.com','deny','disposable'),         ('emailondeck.com','deny','disposable'),
  ('moakt.com','deny','disposable'),          ('inboxkitten.com','deny','disposable'),
  ('harakirimail.com','deny','disposable'),   ('luxusmail.org','deny','disposable'),
  ('mailduck.io','deny','disposable'),        ('einrot.com','deny','disposable'),
  ('grr.la','deny','disposable'),             ('spam4.me','deny','disposable'),

  -- Alias/relay services. Judgement call: these are used by privacy-conscious
  -- real buyers as well as by abusers, so they are split out under their own
  -- reason. DELETE WHERE reason = 'alias' if you would rather accept them.
  ('duck.com','deny','alias'),                ('anonaddy.me','deny','alias'),
  ('addy.io','deny','alias'),                 ('simplelogin.io','deny','alias'),
  ('relay.firefox.com','deny','alias'),       ('mozmail.com','deny','alias'),

  -- Our own domain, explicitly allowed: 'allow' short-circuits before the deny
  -- list is consulted, so staff are never caught by a future blanket rule.
  ('airevl.ai','allow','internal')
ON CONFLICT (domain) DO NOTHING;
