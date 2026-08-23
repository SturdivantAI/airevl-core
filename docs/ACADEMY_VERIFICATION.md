# Academy build — verification report

> **Status: all findings resolved 2026-08-19.** F1–F7 plus the smaller notes are fixed in the
> working tree and folded into `tickets/008_wave2g_academy.md`. Re-verified: `tsc` clean,
> `eslint` zero errors, `next build` green, Playwright **24/24** (up from 14/15 — nine new
> academy assertions). Section 4 records what changed. Sections 1–3 are the original findings,
> left intact as the record.

**Date:** 2026-08-19 · **Branch:** `phase5r/wave-2f` (uncommitted working tree)
**Scope:** the untracked AiRevl Academy work — `/training/*` routes, `api/academy/waitlist`,
`src/components/academy/*`, `src/lib/academy/*`, `supabase/migrations/002_academy_schema.sql`.

**How it was run:** the local device VM caps shell calls at 45s with no background-process
persistence, so a snapshot of the repo (source only, no `node_modules`/`.next`/`.git`) was
built and tested in the cloud container on a clean `npm ci`. One verification-only patch was
applied there: `next/font/google` calls in `src/app/layout.tsx` were stubbed because
`fonts.googleapis.com` is blocked in that sandbox. **No file on the device was modified.**

---

## 1. Gate results

| Gate | Result | Notes |
|---|---|---|
| `tsc --noEmit` | **PASS** | Zero type errors across the whole repo |
| `eslint .` | **1 error, 5 warnings** | The error is **pre-existing**, not academy code (see F1). Academy files lint clean |
| `next build` (prod) | **PASS** | 32 pages generated; all 5 `/training` routes compile; 7 lesson pages SSG'd via `generateStaticParams` |
| Route smoke (curl, demo mode) | **PASS** | `/training`, `/training/signin`, `/training/automation-101`, `/training/automation-101/[moduleId]`, `/certificate` → all 200 with no Supabase env |
| `POST /api/academy/waitlist` | **PASS** | valid → 503 only because Formspree is unreachable in the sandbox; invalid fields → 400 `invalid_fields`; malformed body → 400 `invalid_json`. Never 500 |
| Playwright smoke (15 tests) | **14 pass / 1 fail** | The failure is **pre-existing**, not academy code (see F2) |

**Verdict: the Academy build is sound and ships.** Nothing found blocks the wave-2g commit.
Two pre-existing defects (F1, F2) currently make CI red *independently of this work*, and should
be fixed in the same PR or a hotfix before it. Five academy-specific issues (F3–F7) are worth
fixing while the code is open; only F3 is user-visible.

---

## 2. Findings

### Pre-existing — currently red on `main`, unrelated to the Academy

**F1 — lint error in `MarketingNav.tsx:67`.** `react-hooks/set-state-in-effect`:
`setOpen(false)` called synchronously in an effect body to close the mobile nav on route
change. Fix: derive from `pathname` via a key, or move the close into the link's click
handler. Wave 2E code.

**F2 — `/terms` and `/contact` have no per-page `metadata`.** `/terms` falls back to the root
title, which fails the committed smoke assertion `toHaveTitle(/Terms/)`. Wave 2E's own exit gate
("meta present on every route") is not actually met. `/contact` is masked because its
`layout.tsx` supplies a title, but the page itself has none.

### Academy-specific

**F3 — demo-mode sign-out leaks the previous learner's state.** `signOut()` in
`useAcademy.tsx` clears `user`, `completed`, and `magicLinkSent`, but not `certificate`, and
removes only `LS_DEMO_USER` from localStorage — `airevl_academy_progress` and
`airevl_academy_certificate` survive. On a shared device, learner B signs in and inherits
learner A's progress and sees a certificate in A's name. **User-visible; fix before launch.**
Fix: remove all three keys and `setCertificate(null)` on sign-out.

**F4 — the auth subscription is never unsubscribed.** The `useEffect` calls `void init()` and
`init()` returns the `sub.subscription.unsubscribe()` cleanup — which is discarded, since the
effect's own cleanup only sets `cancelled = true`. Listener leak on unmount. Related: the
`cancelled` flag is passed to `loadRemoteProgress` **by value**, so cancellation never reaches it.

**F5 — `makeCertCode()` degrades to a constant.** `new Uint8Array(6)` is zero-filled, and
`bytes[i] ?? Math.floor(...)` never fires the fallback because `0` is not nullish. If
`window.crypto` is ever absent, every certificate code is `AR101-AAAAAA` — and the
`cert_code UNIQUE` constraint then makes the second issuance fail silently (the error path looks
for an existing cert *for that user*, finds none, returns `null`). Use `??` on the crypto
object, not the byte.

**F6 — waitlist endpoint is softer than the contact endpoint.** `/api/contact` has a honeypot
field and an Upstash-Redis limiter that degrades to in-memory. `/api/academy/waitlist` has
neither: no honeypot in `WaitlistForm`, and an in-memory-only limiter — which on Vercel is
per-lambda-instance and therefore close to no limit at all. This is the blueprint's own N4
hardening standard; the Academy form should meet it.

**F7 — migration 002 is not re-runnable.** Tables and indexes use `IF NOT EXISTS`, but the ten
`CREATE POLICY` statements do not — a second run aborts with `42710 policy already exists`.
Wrap each in `DROP POLICY IF EXISTS ... ;` first, so the file is idempotent like 001.

### Smaller notes

- **Sitemap gap.** `src/app/sitemap.ts` lists eight marketing routes; `/training/automation-101`
  (the course landing page — the most linkable Academy asset) is absent. `/training/signin` and
  `/certificate` should stay out.
- **No smoke coverage for `/training/*`.** `tests/smoke.spec.ts` covers `/training` only. Add
  the course page, a lesson page, the certificate page, and a demo-mode-banner assertion.
- **Doc/code mismatch.** The comment in `002_academy_schema.sql` says certificates are "issued
  only on passing the final certification exam"; the implementation issues on module completion
  (`awardCertificate` requires `courseComplete`, score = module count). `docs/ACADEMY.md` is
  correct; the SQL comment is stale.
- **`.env.local` sits in a `.env/` subdirectory**, so Next never loads it — local dev runs in
  demo mode regardless. Intentional or not, it means Supabase mode has not been exercised locally.
- **Zod v4 deprecation.** `z.string().email()` still works but is deprecated in favour of
  `z.email()`; the codebase is on `zod@^4.4.3`.

---

## 3. Suggested order of work

1. Hotfix F1 + F2 (lint error, two missing `metadata` exports) — turns CI green first.
2. Fix F3, then F4/F5/F6/F7 — all small, all inside the uncommitted diff.
3. Add `/training/*` smoke tests + the sitemap entry.
4. Write `tickets/008_wave2g_academy.md`, branch `phase5r/wave-2g`, commit, PR, verify on the
   Vercel preview.
5. Only then: run migration 002 in Supabase, add `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel, and add the redirect allow-list entry — that
   switches the Academy out of demo mode.

---

## 4. Resolution — 2026-08-19

| # | Fix | Files |
|---|---|---|
| F1 | Mobile nav overlay state is now `openAt: string \| null` and `open` is derived from `pathname`, so a route change closes it without a `setState` in an effect | `src/components/layout/MarketingNav.tsx` |
| F2 | `/terms` exports `metadata` from `config/seo.json`. `/contact` needed nothing — its `layout.tsx` already supplies one, so the original finding overstated it | `src/app/(marketing)/terms/page.tsx` |
| F3 | Demo sign-out clears all three localStorage keys and resets certificate state; signing in as a different demo email resets progress and certificate | `src/lib/academy/useAcademy.tsx` |
| F4 | Auth listener is unsubscribed on unmount, subscribes *before* the first `await` so a magic-link landing mid-init is not missed, and the cancellation flag is an object shared by reference | `src/lib/academy/useAcademy.tsx` |
| F5 | `makeCertCode()` branches on the crypto object rather than the byte; the no-crypto path fills the array from `Math.random()` | `src/lib/academy/useAcademy.tsx` |
| F6 | Limiter extracted to a shared module (Upstash with per-scope in-memory fallback) and used by both routes; waitlist gains a honeypot field, accepted-and-dropped so bots see success | `src/lib/security/rate-limit.ts` (new), `src/app/api/contact/route.ts`, `src/app/api/academy/waitlist/route.ts`, `src/components/academy/WaitlistForm.tsx` |
| F7 | `DROP POLICY IF EXISTS` before each of the 9 policies; stale certificate comment corrected; re-runnability noted in the header | `supabase/migrations/002_academy_schema.sql` |
| — | Academy page metadata moved out of JSX into `config/seo.json` (house rule N7) | `config/seo.json`, three `/training` pages |
| — | `/training/automation-101` added to the sitemap; learner-state pages deliberately excluded | `src/app/sitemap.ts` |
| — | Unknown lesson id returns a real 404 via `notFound()` instead of a soft 200 "Module not found" | `src/app/(marketing)/training/automation-101/[moduleId]/page.tsx` |
| — | Nine new smoke assertions: four academy routes, demo-mode label, unknown-lesson 404, sitemap inclusion/exclusion, waitlist malformed-body and honeypot contracts | `tests/smoke.spec.ts` |
| — | Unused `companyName` import dropped (lint warning) | `src/app/(marketing)/about/page.tsx` |

**Re-verified gates:** `tsc --noEmit` clean · `eslint .` 0 errors / 4 warnings (all pre-existing,
in `model-router` and the root layout's font link) · `next build` green, 32 pages ·
`playwright test` **24 passed**.

**Not done here — the two Supabase-side steps that switch demo mode off:** run migration 002 in
the Supabase SQL editor, and add `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
Vercel plus the `/training/automation-101` redirect allow-list entry in Supabase Auth. Until
then the Academy runs, correctly and visibly, in demo mode.

**Deliberately still open:** the `.env/.env.local` placement (Next reads `.env.local` at the
project root, so nothing in that subdirectory is loaded) — left alone because moving it is an
environment decision, not a code one. `z.string().email()` is deprecated in Zod 4 but works; a
sweep to `z.email()` belongs in its own hygiene pass, not this wave.
