# Security Policy — airevl-core

This is the security policy for the AiRevl website and Academy (`www.airevl.ai`). It covers how to report a vulnerability and the four rules every change to this repository must follow.

| Companion document | Covers |
| --- | --- |
| [`docs/security/AUTH.md`](docs/security/AUTH.md) | Sign-in, sessions, authorisation, tenant boundaries |
| [`docs/security/DATA_SECURITY.md`](docs/security/DATA_SECURITY.md) | Data classes, encryption, access limits, retention |
| [`docs/security/THREAT_MODEL.md`](docs/security/THREAT_MODEL.md) | Entry points, assets, risks, mitigations, open findings |
| [`docs/security/SECURITY_CHECKLIST.md`](docs/security/SECURITY_CHECKLIST.md) | Pre-merge and pre-deploy gates |

**Stack these rules apply to:** Next.js 16 (App Router) on Vercel · Supabase (Postgres + Auth) · Upstash Redis (rate limits, audit stream, telemetry) · Resend (certificate email) · Anthropic and xAI model APIs via `src/lib/model-router` · Formspree (contact and waitlist forms, being retired).

---

## Reporting a vulnerability

Email **contact@airevl.ai** with the subject `SECURITY:` and include:

- the affected URL or file path,
- reproduction steps or a proof of concept,
- the impact you observed.

Do not open a public GitHub issue for a vulnerability, and do not test against other people's accounts or data.

We aim to acknowledge reports within **3 business days** and to fix confirmed high-severity issues within **14 days**. Reporters are credited if they want to be.

**Supported versions:** only the current `main` branch, deployed to production, is supported.

---

## Rule 1 — Protect secrets

No credential, key or token is ever committed to this repository, in any file, in any branch.

- **Where secrets live:** the Vercel project's Environment Variables (Production and Preview scoped separately). Vercel encrypts them at rest. They reach code only through `process.env`.
- **What may be committed:** [`.env.example`](.env.example), which lists every variable name with an empty value. Keep it in sync when you add a variable.
- **What may never be committed:** `.env`, `.env.local` or any populated env file. `.gitignore` excludes `.env*` and re-includes only `.env.example`.
- **Public vs server-only:** a variable prefixed `NEXT_PUBLIC_` is compiled into the browser bundle and is public. Only these two may carry that prefix:

  | Public (browser) | Why it is safe |
  | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | Project URL, not a secret |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key; access is bounded by Row Level Security |
  | `NEXT_PUBLIC_SITE_URL` | Canonical origin |

  Everything else is server-only and must never be read from a `"use client"` file:
  `SUPABASE_SERVICE_ROLE`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`.

- **`SUPABASE_SERVICE_ROLE` bypasses Row Level Security.** It may only be used inside `src/app/api/**/route.ts` handlers that have first verified the caller (see `src/app/api/academy/certificate/route.ts`), and through `getSupabaseAdmin()` in `src/lib/supabase.ts`.
- **Vault:** this application does not use AWS. Vercel's encrypted environment store is the secrets manager of record. If the stack moves to AWS, migrate to AWS Secrets Manager and record the change here.
- **Rotation:** rotate any key immediately if it appears in a commit, log, screenshot or chat. Otherwise rotate `SUPABASE_SERVICE_ROLE`, model API keys and `RESEND_API_KEY` at least every 12 months, and when anyone with access leaves.

## Rule 2 — Validate all input

Every byte arriving from outside the server is hostile until a schema says otherwise.

- **HTTP bodies:** every `POST` route parses with Zod `safeParse` before any other work. Shared schemas live in `src/lib/security/schemas.ts`; route-local schemas (for example `IssueSchema` in the certificate route) follow the same pattern.
- **Length caps:** use the `SafeString(maxLen)` primitive. Current caps: contact `message` 2,048 chars, agent `prompt` 8,192 chars, certificate `holder_name` 120 chars.
- **Sanitisation:** free text that will be stored, emailed or sent to a model goes through `sanitizePayload()` in `src/lib/security/sanitize.ts`. It blocks known prompt-injection, SQL, script and SSRF patterns and redacts PII (BVN, NIN, phone numbers, emails, card and NUBAN numbers, IPs).
- **LLM prompt inputs:** never interpolate unsanitised user text into a model prompt. `/api/agent` passes `sanitized.sanitizedText` to the model router, never the raw prompt.
- **Webhook payloads:** none exist today. Any future webhook must verify the sender's signature (HMAC or the provider's SDK) before parsing the body.
- **Output encoding:** values interpolated into HTML email go through `escapeHtml()` (see `certificateEmail()` in the certificate route). React escapes JSX output by default; `dangerouslySetInnerHTML` is not used with user data.

```ts
// Pattern every route follows
const parsed = MySchema.safeParse(await req.json().catch(() => null));
if (!parsed.success) {
  return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
}
```

## Rule 3 — Least privilege

- **Database:** the browser uses the anon key and is confined by Row Level Security policies in `supabase/migrations/`. Every table has RLS enabled. A new table without `ENABLE ROW LEVEL SECURITY` and explicit policies fails review.
- **Privileged writes:** writes that must not be client-controlled (certificate issuance) run server-side with the service role, after verifying the user's Supabase JWT.
- **Public functions:** `SECURITY DEFINER` functions (for example `verify_certificate`) must return only the columns needed and must set `search_path`.
- **API tokens:** create model-provider and Resend keys scoped to this project only. Resend keys should be "sending access", restricted to the `airevl.ai` domain.
- **People:** Vercel, Supabase, Upstash, Resend and GitHub access is limited to named maintainers with MFA on. Remove access the day someone leaves.
- **IAM:** there is no AWS footprint today. Any cloud role added later starts with no permissions and gains only what one task needs.

## Rule 4 — Review dependencies

- **Automated:** Dependabot ([`.github/dependabot.yml`](.github/dependabot.yml)) opens weekly PRs for npm packages and GitHub Actions.
- **Manual before every release:** `npm audit --omit=dev`. A high or critical advisory in a production dependency blocks the release until it is patched or formally accepted in `docs/security/THREAT_MODEL.md`.
- **Adding a package:** prefer well-maintained packages with a recent release; check weekly downloads and maintainer history; never add a package just to save a few lines.
- **Lockfile:** `package-lock.json` is committed and CI installs with `npm ci`, so builds use exactly the reviewed versions.
