# Threat Model — airevl-core

Attack surface, assets, risks and mitigations for `www.airevl.ai`, reviewed against the code on `main` (commit `232e244`, October 2026). Re-review whenever a route, table, provider or model tier is added.

**Architecture in one line:** browser → Vercel (Next.js pages and `/api/*` route handlers) → Supabase (Postgres + Auth), Upstash Redis, Resend, Formspree, Anthropic and xAI.

```
 Visitor / Learner (browser)
   │  HTTPS
   ▼
 Vercel edge ── static pages, /training/**, /verify/[code], /demos/**
   │
   ├── /api/contact ─────────────► Formspree ─► contact@airevl.ai
   ├── /api/academy/waitlist ────► Supabase (service role) │ Formspree fallback
   ├── /api/academy/certificate ─► Supabase Auth (verify JWT) ─► Postgres (service role) ─► Resend
   ├── /api/agent ───────────────► model-router ─► Anthropic │ xAI
   ├── /api/agent/sanitize ──────► (local only)
   └── /api/security-telemetry ──► Supabase (anon, public demo table)
   │
 Browser ── Supabase JS (anon key + learner JWT, RLS-bound) ─► academy_* tables
 All routes ── Upstash Redis (rate limits, audit:events, telemetry streams)
```

---

## 1. Entry points

| # | Entry point | Method | Auth | Validation | Rate limit |
| --- | --- | --- | --- | --- | --- |
| E1 | `/api/contact` | POST | None (public form) | `ContactRequestSchema`, honeypot, `sanitizePayload` | 30 / 60 s per IP |
| E2 | `/api/academy/waitlist` | POST | None (public form) | Zod schema | Yes (route-local) |
| E3 | `/api/academy/certificate` | POST | **Bearer JWT, verified** | `IssueSchema` | 8 / 60 s per IP |
| E4 | `/api/agent` | POST | **None** | `AgentRequestSchema` (8,192-char prompt), `sanitizePayload` | **None** |
| E5 | `/api/agent/sanitize` | POST | None | `SanitizeRequestSchema` | **None** |
| E6 | `/api/security-telemetry` | GET | None | n/a (no input) | None (read-only, 20 rows) |
| E7 | `/verify/[code]` | GET page | None | Code trimmed and upper-cased in SQL | None |
| E8 | Supabase REST + Auth, called directly from the browser | various | Anon key ± learner JWT | Postgres types + RLS | Supabase Auth limits only |
| E9 | Magic-link landing `/auth/callback` | GET | Token in URL fragment | Supabase verifies | Supabase: 30 verifications / 5 min / IP |
| E10 | AI agent prompt input (`prompt` field of E4) | — | as E4 | Injection pattern catalogue + PII redaction | as E4 |
| — | File uploads | — | — | **None exist.** Any future upload handler must add type/size checks and store files in a private Supabase Storage bucket. | — |
| — | GraphQL | — | — | **Not exposed.** Keep `pg_graphql` disabled unless needed. | — |

## 2. Protected assets

| Asset | Why it matters |
| --- | --- |
| A1 Learner accounts (`auth.users`, sessions) | Identity; certificates are issued in the account holder's name |
| A2 Learning records and certificates (`academy_*`) | A forged or duplicated certificate damages AiRevl's credibility |
| A3 Contact, waitlist and enquiry data | Personal data (PII) of prospects and clients |
| A4 Provider credentials (service role, model keys, Resend, Upstash) | Full database bypass; paid API spend; email sending reputation |
| A5 Model API budget | Every `/api/agent` call costs money |
| A6 Audit and telemetry streams | Evidence for incident response; must not leak or be tampered with |
| A7 Domain and email reputation (`airevl.ai`) | Spoofed or spammy mail gets the domain blocklisted |

## 3. Identified risks

Likelihood (L) and impact (I) are rated H/M/L.

| ID | Risk | Asset | L | I | Notes |
| --- | --- | --- | --- | --- | --- |
| R1 | **Prompt injection** via `/api/agent` causing the model to ignore its instructions or leak its system prompt | A5, A6 | M | M | Regex catalogue blocks common phrasings; novel phrasing will get through |
| R2 | **Denial of wallet / rate-limit abuse** by scripting unauthenticated `/api/agent` calls | A5 | **H** | **H** | No auth and no rate limit on E4 (finding F-1) |
| R3 | **Privilege escalation**: learner mints a certificate without finishing the course | A2 | M | M | Server checks `academy_progress`, but learners can insert their own progress rows (finding F-3) |
| R4 | **Privilege escalation**: learner writes another user's rows | A2 | L | H | RLS `auth.uid() = user_id` on every Academy table |
| R5 | **Data leak**: service-role key exposed to the browser | A4 | L | **H** | Server-only by convention; no `NEXT_PUBLIC_` alias exists |
| R6 | **Data leak**: audit events readable by anyone | A6 | M | L | `audit_events` has a `public_read` policy and no app code needs it (finding F-2) |
| R7 | **Data leak**: PII sent to a third-party model | A3 | L | M | `sanitizePayload` redacts PII before the model router |
| R8 | **Account takeover** via a magic link opened on a shared device | A1 | L | M | 1-hour expiry, single use, token stripped from the URL |
| R9 | **Spam / mail bombing** via contact or sign-in forms | A7 | M | M | Honeypot + IP rate limit on contact; Supabase email rate limit on sign-in |
| R10 | **Clickjacking / XSS amplification** due to missing security headers | A1 | L | M | No CSP, `X-Frame-Options` or `Permissions-Policy` configured (finding F-4) |
| R11 | **Rate limiter silently ineffective** when Upstash env is missing | A5, A7 | M | M | Falls back to per-instance memory, which does not bound anything across serverless instances |
| R12 | **Supply-chain compromise** through an npm dependency | All | L | H | Lockfile + `npm ci`; Dependabot added |
| R13 | **Certificate code enumeration** on `/verify` | A2 | L | L | 31⁶ ≈ 887M codes; the function returns only consented public fields |

## 4. Protections

| Control | Implementation | Covers |
| --- | --- | --- |
| Schema validation | Zod `safeParse` on every POST body (`src/lib/security/schemas.ts`) | R1, R9 |
| Input sanitisation | `sanitizePayload()`: injection catalogue + PII redaction + SHA-256 audit hash (`src/lib/security/sanitize.ts`) | R1, R7 |
| Strict rate limiting | `createRateLimiter()` backed by Upstash (`src/lib/security/rate-limit.ts`) | R2, R9, R11 |
| Authorisation guards | Verified bearer JWT in privileged routes; RLS on every table | R3, R4 |
| Server-only issuance | Certificate INSERT policy removed (migration 005); service role issues after checking progress | R3 |
| LLM output guardrails | Model router: security-critical tasks restricted to top tiers; refusals and injection attempts emitted to `audit:events` (`src/lib/security/guard.ts`); responses returned as JSON, never rendered as HTML | R1 |
| Least-privilege verify | `verify_certificate()` is `SECURITY DEFINER` with a fixed `search_path`, returning five fields only | R13 |
| Secret hygiene | `.env*` git-ignored; `.env.example` lists names only; see `SECURITY.md` | R5 |
| Dependency scanning | Dependabot weekly + `npm audit` gate | R12 |

## 5. Open findings (to fix)

| ID | Finding | Severity | Fix | Status |
| --- | --- | --- | --- | --- |
| **F-1** | `/api/agent` and `/api/agent/sanitize` are public, unauthenticated and not rate-limited, and `/api/agent` spends model API credit on every call. | **High** | Add `createRateLimiter({ scope: "agent", windowSeconds: 60, max: 10 })`; require a verified Supabase JWT or a server-side demo token; set a monthly spend cap in the Anthropic and xAI consoles. If no public page calls `/api/agent` (today only `/demos/judge` calls `/api/agent/sanitize`), consider disabling it in production until needed. | Open |
| **F-2** | `audit_events` has `CREATE POLICY "public_read" … USING (true)`, so anyone holding the public anon key can read the audit table. | Medium | Migration 006: `DROP POLICY "public_read" ON audit_events;` No application code reads this table from the browser. | Open |
| **F-3** | Learners insert their own `academy_progress` rows, so a learner using devtools can mark all seven modules complete and then request a certificate. | Medium | Move module completion to a server route that also checks that a passing quiz attempt exists for the module, then remove the learner INSERT policy on `academy_progress`. | Open (accepted until account-first enrolment ships) |
| **F-4** | No security headers: no CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy`. HSTS relies on Vercel's default. | Medium | Add `headers()` to `next.config.ts` (example below). Roll out CSP in report-only mode first because of `three`/`framer-motion` inline styles. | Open |
| **F-5** | Contact and waitlist PII is sent to Formspree (US). | Low | Store submissions in Supabase and notify via Resend; update `/privacy`. | Open (planned) |
| **F-6** | No database backups on the production Supabase project. | Medium | Enable backups (paid plan) or schedule a `pg_dump` before the first cohort. | Open |

Header block for F-4:

```ts
// next.config.ts
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy-Report-Only",
        value: "default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'" },
    ],
  }];
},
```
