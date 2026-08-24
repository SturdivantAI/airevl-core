# Academy signup policy

Automation 101 is free but **business-email gated**. This document is the
operational reference for that gate.

## Where it is enforced

In Postgres, as a Supabase **Before User Created** auth hook
(`public.hook_restrict_academy_signup`, migration `003`).

It is not enforced in the browser, and it cannot be. The client calls
`/auth/v1/otp` on Supabase directly using the publishable key, which ships in
the JS bundle. Anyone can reproduce that call with `curl` and skip the UI
entirely, so a check in `SignInCard.tsx` would filter honest users and nobody
else. `SignInCard.tsx` still does a shape check (`/.+@.+\..+/`) purely so the
form gives instant feedback — it is UX, not security.

## What it does

| Check | Behaviour |
|---|---|
| `allow` rule matches the domain | accepted immediately, deny list never consulted |
| `deny` rule matches | rejected, HTTP 403, "Please sign up with your work email address." |
| No rule matches | accepted — the list is a blocklist, not an allowlist |
| >10 new signups from one IP in an hour | rejected, HTTP 429 |
| Payload has no email | accepted (fails open rather than bricking an unanticipated provider) |

## Common operations

Allow one company that uses a consumer domain:

```sql
INSERT INTO academy_signup_domains (domain, rule, reason)
VALUES ('theirdomain.com', 'allow', 'partner — ticket 012');
```

Stop blocking free consumer mailboxes entirely (revert to disposables-only):

```sql
DELETE FROM academy_signup_domains WHERE reason = 'consumer';
```

Accept privacy relay services (duck.com, simplelogin, firefox relay):

```sql
DELETE FROM academy_signup_domains WHERE reason = 'alias';
```

Change the per-IP hourly cap: edit `c_max_per_hour` in the hook function.

## What is deliberately not covered

The hook fires on **user creation only**. A magic-link request for an address
that already exists does not create a user, so it does not reach the hook.
That path is governed by Supabase's own auth rate limits (Auth → Rate Limits),
which is why those must not be left at their defaults on a real sending domain.

`academy_signup_attempts` records IP, email domain, and outcome — no addresses.
Rows older than a day are cleaned opportunistically by the hook.
