# Security Checklist — Release Quality Gates

Copy the relevant gate into the pull request description or release note and tick each item. An unticked item blocks the merge or deploy unless it has a written exception (reason, owner, expiry date) in the PR.

Automation status: ✅ automated in CI · 🟡 partly automated · ⬜ manual today

---

## Pre-Merge Gate (CI / PR review)

- [ ] **No secrets committed** (scanned via git-secrets / TruffleHog) ⬜
  - Run locally before pushing: `npx --yes @trufflesecurity/trufflehog git file://. --since-commit main --only-verified` or `gitleaks detect --source .`
  - Turn on GitHub *Secret scanning* and *Push protection* (Settings → Code security). They are free for public repositories.
  - No populated `.env*` file is in the diff; only `.env.example` may change.
- [ ] **All endpoint inputs validated with schemas (Zod)** 🟡
  - Every new or changed `src/app/api/**/route.ts` calls `Schema.safeParse()` before using the body.
  - Every string field has a `max()` length.
  - Free text sent to a model, email or the database passes through `sanitizePayload()`.
  - A route that calls the model router has a rate limiter (THREAT_MODEL F-1).
- [ ] **Authorisation unit tests pass** ⬜
  - Routes acting for a user return `401` without a bearer token and with an invalid one.
  - The user id is taken from `auth.getUser(token)`, never from the request body.
  - Any new table has `ENABLE ROW LEVEL SECURITY` and explicit policies; no `USING (true)` on learner data.
  - Playwright smoke tests pass: `npm run test:smoke` ✅
- [ ] **Dependency vulnerabilities resolved** 🟡
  - `npm audit --omit=dev` reports no high or critical advisories, or each is accepted in THREAT_MODEL with an expiry date.
  - Open Dependabot security PRs reviewed.
- [ ] Lint, type check and build pass: `npm run lint`, `npx tsc --noEmit`, `npm run build` ✅
- [ ] New environment variables added to `.env.example` and documented in `SECURITY.md` ⬜
- [ ] New migrations are idempotent (`IF NOT EXISTS`, guarded `DO` blocks) and were tested on a non-production project ⬜

## Pre-Deploy Gate (staging / production release)

- [ ] **Production secrets injected via environment** ⬜
  - In Vercel → Settings → Environment Variables (Production scope), confirm these are set: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`.
  - Missing Upstash variables silently weaken rate limiting (THREAT_MODEL R11).
  - Pending migrations have been run in the Supabase SQL Editor **before** the code that depends on them is deployed.
- [ ] **Strict HTTPS / HSTS verified** ⬜

  ```bash
  curl -sI http://airevl.ai        | grep -i '^location: https'
  curl -sI https://www.airevl.ai   | grep -i strict-transport-security
  ```

  Expect a redirect to HTTPS and `max-age` of at least `31536000`.
- [ ] **Structured logging active with PII/secret redaction** ⬜
  - Route logs use prefixed `console.warn("[route] …")` messages and never print request bodies, emails, tokens or keys.
  - Audit events carry hashes only (`guard.ts` validates with `AuditEventSchema`).
  - Spot-check Vercel → Logs for the release: no email addresses or `Bearer` tokens appear.
- [ ] **Automated SAST/DAST checks pass** ⬜
  - SAST: enable GitHub CodeQL (Settings → Code security → *Code scanning* → Default setup, JavaScript/TypeScript). Free for public repositories.
  - DAST: run an OWASP ZAP baseline scan against the preview URL before a major release:
    `docker run --rm ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://<preview-url>`
- [ ] Supabase Auth settings unchanged or reviewed: Site URL `https://www.airevl.ai`, Redirect URLs allow-list, custom SMTP on, email rate limit sized for the cohort (see `docs/ACADEMY_OPERATIONS.md`) ⬜
- [ ] A database backup exists from before any destructive migration ⬜
- [ ] Post-deploy smoke: sign in from a phone, complete a module, issue a certificate, open `/verify/<code>` in a private window ⬜

---

## Turning manual items into CI (backlog)

| Item | How |
| --- | --- |
| Secret scanning | Add `gitleaks/gitleaks-action@v2` as a job in `.github/workflows/ci.yml` |
| Dependency audit | Add `npm audit --omit=dev --audit-level=high` after `npm ci` |
| SAST | Enable CodeQL default setup (no workflow file needed) |
| Auth tests | Playwright spec: POST `/api/academy/certificate` without a token returns 401 |
| HSTS check | Extend `lighthouse-deployed.yml` with a `curl -sI` header assertion |
