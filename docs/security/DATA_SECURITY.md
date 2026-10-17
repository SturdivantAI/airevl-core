# Data Security and Lifecycle

What data AiRevl holds, how it is protected, who can reach it, and when it is deleted.

> **Legal note.** This document records engineering controls. Obligations under the Nigeria Data Protection Act 2023 (NDPA), the GDPR for EU learners, and any client contract should be confirmed with a qualified adviser. Where this document and legal advice disagree, the advice wins and this file is updated.

---

## 1. Classification matrix

| Class | Definition | Examples in this system | Where it lives |
| --- | --- | --- | --- |
| **C1 — Application credentials** | Anything that grants access to a system | `SUPABASE_SERVICE_ROLE`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, Supabase JWT secret, learner refresh tokens | Vercel env (encrypted); Supabase Auth; learner's browser storage (own tokens only) |
| **C2 — Personal data (PII)** | Data that identifies a person, alone or combined | Learner email, full name on certificate, display name, contact-form name/email/message, waitlist name/email, IP addresses in rate-limit keys | Supabase Postgres (`auth.users`, `academy_*`); Formspree (until retired); Resend send logs; Upstash (IP keys, short-lived) |
| **C3 — Payment data** | Card, bank account or billing identifiers | **None held today.** Tier 2 and Tier 3 courses are "pricing at launch". | — |
| **C4 — Learning records** | Records about a learner's activity | Module progress, quiz scores, resume position, certificate code and issue date | Supabase Postgres |
| **C5 — Public** | Published on purpose | Marketing pages, course content, demo telemetry fixtures, a consented certificate's holder name via `/verify` | Vercel, Supabase public-read tables |

**Rules by class:**

- C1 never appears in code, logs, analytics, emails or support tickets.
- C2 is never sent to a model API. `sanitizePayload()` redacts emails, phone numbers, BVN, NIN, card and NUBAN numbers before any text reaches `/api/agent`.
- C3: when paid courses launch, use a hosted checkout (Paystack or Stripe) so card data never touches AiRevl servers, and record the provider here. Storing card numbers is prohibited.
- C4 is treated as C2 when joined to a name or email.

## 2. Protection standards

**In transit**

- All public traffic is HTTPS, terminated by Vercel's edge (TLS 1.3 preferred, TLS 1.2 minimum). Plain HTTP is redirected to HTTPS.
- HSTS: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` must be present on `www.airevl.ai` and `airevl.ai`. Verify on every release (see the checklist).
- Server-to-provider calls (Supabase, Upstash, Resend, Anthropic, xAI, Formspree) are HTTPS-only. No code path may call a provider over `http://`.

**At rest**

| Store | Encryption | Key management |
| --- | --- | --- |
| Supabase Postgres + backups | AES-256 | Managed by Supabase on AWS KMS |
| Vercel environment variables | AES-256 | Managed by Vercel |
| Upstash Redis | Encrypted at rest (enable *TLS* and *Encryption at rest* on the database) | Managed by Upstash |
| Resend email logs | Provider-managed | Resend |

AiRevl does not run its own KMS. If a client contract requires customer-managed keys, that requires a Supabase plan that supports it, and this table must be updated.

**Location.** None of the current providers hosts data in Nigeria. Record each provider's region here once confirmed in its dashboard:

| Provider | Region | Confirmed by / date |
| --- | --- | --- |
| Supabase (`airevl-core-prod`) | _to confirm: Settings → General_ | |
| Vercel functions | _to confirm: Settings → Functions → Region_ | |
| Upstash Redis | _to confirm_ | |
| Resend | _to confirm_ | |

## 3. Access limits

**Service-level allowlist.** Which component may read which data:

| Data | Browser (anon key + learner JWT) | Route handlers | Service role | Model APIs |
| --- | --- | --- | --- | --- |
| Learner's own Academy rows | ✅ via RLS | ✅ | ✅ | ❌ |
| Other learners' rows | ❌ | ❌ | ✅ (verified-user scope only) | ❌ |
| Certificate holder name | Own only | ✅ | ✅ | ❌ |
| Contact / waitlist submissions | ❌ | Write only | ✅ | ❌ |
| Sanitised prompt text | — | ✅ | — | ✅ |
| C1 secrets | ❌ | ✅ (server env) | — | ❌ |

**Internal role segregation:**

| Person / role | Access |
| --- | --- |
| Owner (Edidiong) | All dashboards, MFA required |
| Contributor | GitHub write; Vercel *Developer* (no production env read); no Supabase production access by default |
| Support | Supabase read-only on `academy_*` when needed, granted per task |

Production database access is reviewed every quarter, and the review is logged in this file's change history.

## 4. Retention and disposal

| Data | Retention | Disposal method | Automation |
| --- | --- | --- | --- |
| Learner account + Academy records | While active; deleted **3 years** after last sign-in | Delete the user in Supabase Auth; `ON DELETE CASCADE` removes `academy_*` rows | Scheduled job (planned): `pg_cron` monthly |
| Issued certificate | **Kept for the life of the credential**, so verification keeps working, unless the learner asks for erasure. ⚠ Today `academy_certificates.user_id` is `ON DELETE CASCADE`, so deleting an account also deletes its certificate. Resolve this before enabling the retention job. | On erasure: set `public_verifiable = false` and blank `holder_name` | Manual on request |
| Learner erasure request | Within **30 days** of the request | Delete the auth user (cascades); purge the matching Resend contact | Manual, logged |
| Contact form submissions | **12 months** | Delete from inbox / Formspree / future `contact_submissions` table | Manual until moved to Supabase, then `pg_cron` |
| Waitlist entries | Until launch + **6 months**, or unsubscribe | Delete row | `pg_cron` (planned) |
| Rate-limit keys (IP) | Window length (≤ 60 s) | Redis TTL expiry | Automatic |
| Audit stream `audit:events` | **90 days** | `XTRIM audit:events MINID <90 days ago>` | Scheduled job (planned) |
| Telemetry stream `telemetry:model-router` | **30 days** | `XTRIM` by MINID | Scheduled job (planned) |
| Vercel function logs | Vercel plan default (1 day on Hobby) | Provider expiry | Automatic |
| Supabase backups | Plan default; **none on the current project** | Provider expiry | Enable before the first cohort |

Planned retention job, ready for when `pg_cron` is enabled in Supabase (Database → Extensions):

```sql
-- Runs at 03:00 UTC on the 1st of each month
select cron.schedule(
  'academy-retention',
  '0 3 1 * *',
  $$
    delete from auth.users
    where last_sign_in_at < now() - interval '3 years';
    delete from academy_waitlist
    where created_at < now() - interval '18 months';
  $$
);
```

Before enabling it, confirm that every `academy_*` foreign key to `auth.users` is `ON DELETE CASCADE`, and decide how certificates should survive account deletion.
