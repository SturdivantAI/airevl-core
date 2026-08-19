# Ticket 008: AiRevl Academy — Tier 1 free course + Tier 2/3 waitlist (Wave 2G)

## Context & destination
`/training` (Wave 2D) describes the offering but sells nothing and captures nobody. Done = the
three-tier Academy is live on the marketing site: Tier 1 **Automation 101** is a free,
login-gated, seven-module course with hands-on exercises, quizzes, and a certificate; Tiers 2/3
(**Automation Fluency**, **Automation Pro**) are priced-later and capture a waitlist. Spine:
project mandate ("three-tier training on the airevl website"), `IA_UX_RESTRUCTURE_BLUEPRINT.md`
§1 (Training is a real offering, promoted to top nav) + §3 N4/N7/N8, `docs/ACADEMY.md`.

The course build itself landed uncommitted on `phase5r/wave-2f`. This ticket is that work plus
the fixes from `docs/ACADEMY_VERIFICATION.md`, shipped as one bounded wave.

## Requirements & seams

**Part 1 — Academy (Tier 1 + waitlist):**
- Routes under the `(marketing)` shell, wrapped in `AcademyProvider`:
  `/training` (catalog, 3 tiers + institutional tracks), `/training/signin`,
  `/training/automation-101`, `/training/automation-101/[moduleId]`,
  `/training/automation-101/certificate`.
- `POST /api/academy/waitlist` — Tier 2/3 lead capture.
- Auth: Supabase magic link (OTP). **Degradation rule:** with `NEXT_PUBLIC_SUPABASE_*` absent the
  course runs in demo mode (progress on-device, labelled in the UI). No crash, no 500.
- Persistence: `supabase/migrations/002_academy_schema.sql` — enrollments, progress, quiz
  attempts, certificates (all user-owned under RLS), waitlist (service_role only).
- All course copy in `src/lib/academy/content.ts`; zero copy in JSX (house rule). Adding a Tier 2
  course later = a second content module reusing the same components.
- Sandbox exercises are simulated (keyword rubric + scripted responses): zero API cost and zero
  prompt-injection surface on a free public tier. Live-model sandbox is a Tier 2 upgrade via the
  existing `/api/agent` model-router.
- Module unlock is sequential. Quiz attempts are recorded for analytics; nothing gates on score
  in Tier 1. Certificates carry a code (`AR101-XXXXXX`, unique per user+course).

**Part 2 — Verification fixes (`docs/ACADEMY_VERIFICATION.md` F1–F7):**
- **F1** `MarketingNav`: mobile overlay state stored as "open at this route" and derived, instead
  of `setOpen(false)` in an effect — clears the `react-hooks/set-state-in-effect` CI error.
- **F2** `/terms` gains its `metadata` export from `config/seo.json` (Wave 2E's own exit gate:
  meta present on every route). `/contact` already inherits metadata from its layout.
- **F3** Demo-mode sign-out clears all three localStorage keys and resets certificate state;
  signing in as a different demo identity resets progress. A shared device must not hand the next
  learner someone else's record or certificate name.
- **F4** The auth subscription is unsubscribed on unmount, subscribes before the first `await` so
  a magic-link landing mid-init is not missed, and the cancellation flag is shared by reference.
- **F5** `makeCertCode()` branches its fallback on the crypto object, not on the byte — a
  zero-filled `Uint8Array` is not nullish, so every code degraded to `AR101-AAAAAA`.
- **F6** Waitlist endpoint meets the `/api/contact` hardening standard (blueprint N4): honeypot
  field, and Upstash-Redis rate limit degrading to in-memory. The limiter is extracted to
  `src/lib/security/rate-limit.ts` and both routes use it — an in-memory-only limit is
  per-lambda-instance on Vercel, i.e. close to no limit at all.
- **F7** Migration 002 is re-runnable: `DROP POLICY IF EXISTS` before each `CREATE POLICY`.
  Stale comment corrected — certificates issue on module completion, not on an exam.

**Part 3 — SEO, tests, hygiene:**
- Academy page metadata moved out of JSX into `config/seo.json` (N7).
- `sitemap.xml` gains `/training/automation-101`; sign-in, lesson, and certificate pages stay out
  (learner-state, not landing pages).
- Unknown lesson id returns a real 404 via `notFound()` instead of a soft 200 "Module not found".
- `tests/smoke.spec.ts` extended: four academy routes 200 + title, demo-mode label present,
  unknown lesson 404s, sitemap includes the course page and excludes learner-state pages,
  waitlist API rejects malformed bodies and silently drops honeypot submissions.

## Out of scope (tracked, not built here)
- Tier 2/3 course content and payments.
- Public `/verify/[code]` certificate endpoint (service_role lookup).
- Co-branded cohort page at `/training/nbc`.
- Live-model sandbox.

## Verification criteria
- [x] `npx tsc --noEmit` clean
- [x] `npx eslint .` — zero errors (4 pre-existing warnings in `model-router`/`layout` remain)
- [x] `next build` green; all five `/training` routes compile, seven lessons prerender via
      `generateStaticParams`
- [x] `npm run test:smoke` — 24/24 pass, including the 9 new academy assertions
- [x] With Supabase env unset, every academy route 200s in demo mode; no route 500s
- [x] Waitlist API: valid → accepted, malformed → 400, honeypot → accepted-and-dropped,
      never 500
- [ ] Vercel preview verified by hand: magic-link copy, module unlock order, certificate render
- [ ] Migration 002 run in Supabase; `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      added in Vercel; site URL and `/training/automation-101` added to the Auth redirect
      allow-list — this is what switches demo mode off
- [ ] `lib/security` contracts unchanged except the additive `rate-limit.ts` extraction;
      `model_policy.json` untouched

## Post-merge notes
- The `NEXT_PUBLIC_` anon key is designed to be public; RLS restricts every academy table to the
  row owner. `SUPABASE_SERVICE_ROLE` must never get a `NEXT_PUBLIC_` prefix.
- Course examples are regulator-flavoured (transcript review, complaints, compliance tables) but
  name no client. Verification-first prompting is threaded through every sandbox rubric and
  Module 6 — that is the differentiator to emphasise in the NBC proposal.
