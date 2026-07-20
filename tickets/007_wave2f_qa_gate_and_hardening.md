# Ticket 007: QA gate in CI + mock-fallback hardening (Wave 2F — restructure close-out)

## Context & destination
The restructure (2A–2E) shipped through manual preview checks. Done = those checks become permanent CI gates, and the failure class that silently broke production for four days (invalid `SUPABASE_URL` → 500s on /telemetry and /training, 2026-07-15→19) becomes structurally impossible. Spine: `IA_UX_RESTRUCTURE_BLUEPRINT.md` §3 (N8, N9) + §4 2F; blueprint Rule 3 (Mock-Data Boundaries).

## Requirements & seams

**Part 1 — Mock-fallback hardening (do this first; the tests then assert it):**
- Every page/route that reads Supabase must catch backend unavailability (missing env, connection error, query error) and render from its existing `mock-data/` fixture instead — with a small "Showing sample data" chip so degradation is honest. Candidates: telemetry demo, security demo/api, training (if still data-bound), any `/api/*` that queries the DB.
- Pattern: one helper `lib/data/withFallback.ts` — `withFallback(liveFn, mockFixture, label)` — logs a single structured warning (route, cause) and returns the fixture. No page may 500 because a backend or env var is absent. Mock fixtures must keep validating against OKF schemas (existing CI script).
- Same treatment for Upstash reads if any page depends on them (the contact limiter already degrades — leave it).

**Part 2 — Playwright smoke suite (N8):**
- Dev dependency: `@playwright/test` (permitted; dev-only). `tests/smoke.spec.ts`:
  - every marketing route + demo hub + both console demos responds 200 and renders its H1/title;
  - marketing pages contain no console chrome (no sidebar test-id); console pages show the synthetic-data banner;
  - `/telemetry` redirects to `/demos/telemetry`;
  - unknown URL shows branded 404;
  - contact form: fill + consent + submit against a mocked POST (intercept the API call — do NOT hit Formspree in CI);
  - fallback assertion: with `SUPABASE_URL` unset in the test env, telemetry demo renders the sample-data chip, not an error.
- `npm run test:smoke` script; runs against `next build && next start` locally.

**Part 3 — CI wiring (N9):**
- Extend `.github/workflows/ci.yml`: existing lint/type/OKF gates → build → smoke suite → Lighthouse CI (`@lhci/cli`, dev-only) against the built app: `/`, `/solutions`, `/demos` with budget: performance ≥ 90 in CI headless (CI scores run lower than field; the ≥95 field target stays in the blueprint), accessibility ≥ 95. Fail the PR below budget.
- Keep total CI time reasonable: smoke + LHCI on 3 URLs only.

## Verification criteria
- [ ] `npx tsc --noEmit`, `next build`, `npm run test:smoke` all green locally
- [ ] With Supabase env vars deliberately unset, no route 500s; sample-data chips appear; OKF validation still green
- [ ] CI workflow runs lint → types → OKF → build → smoke → LHCI and fails on budget breach
- [ ] No production dependency added (Playwright + LHCI are devDependencies)
- [ ] `lib/security` contracts unchanged; `model_policy.json` untouched
- [ ] `SUGGESTIONS_AND_RISK_REGISTER.md` items I5-adjacent, I7, R7 can be marked addressed after merge (note in PR description)
