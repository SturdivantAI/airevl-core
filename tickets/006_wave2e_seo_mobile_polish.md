# Ticket 006: SEO, mobile nav, 404, analytics-readiness (Wave 2E)

## Context & destination
The site restructure (Waves 2A–2D) is live but carries one shared metadata block, no sitemap, no mobile marketing nav, and a default 404. Done = every route self-describes for search/social, the site works one-handed on a phone, and errors are branded. Spine: `IA_UX_RESTRUCTURE_BLUEPRINT.md` §3 (N1, N3, N5, N6).

## Requirements & seams

**Per-page metadata (N1):**
- Each marketing route exports its own `metadata` (title, description) via Next.js Metadata API: Home, Solutions, Training, Demos, About, Contact, Privacy, Terms. Console demo pages get titles like "Telemetry Console — AiRevl demo".
- Pattern: `<Page> — AiRevl` titles; descriptions drawn from existing config copy (pages.json / solutions.json) — do not write new marketing claims.
- One shared OG image (reuse the existing brand asset); per-page `og:title`/`og:description` inherit from metadata.
- Add `app/sitemap.ts` (all marketing routes + demo hub; exclude console sub-routes) and `app/robots.ts` (allow all, point to sitemap).

**Mobile nav (N3):**
- MarketingNav gets a hamburger below `md`: full-screen overlay panel with the same links + CTA from brand.json, focus-trapped, Escape/na­v-click closes, `aria-expanded` on the trigger. No new dependencies — headless implementation.
- Console shell on mobile keeps its existing behavior (sidebar hidden); ensure the demo banner and "Back to site" remain reachable.

**Branded 404 + error states (N5):**
- `app/not-found.tsx`: marketing shell, living background, "Signal lost — this route doesn't exist", link home + to demos. Copy via config.
- `app/error.tsx` (client): same styling, "Something went wrong", reset button. No stack traces rendered.

**Analytics-readiness (N6) — consent-gated, NOT enabled:**
- Do NOT add any analytics script in this ticket. Counsel advice on consent mechanics is pending (see `AiRevl_Legal_Compliance_Brief_for_Counsel.docx` §3).
- Prepare the seam only: a `config/analytics.json` with `{ "enabled": false, "provider": "vercel" }` and a no-op `AnalyticsGate` component in the root layout that renders nothing while disabled. Wiring a real provider is a one-line flip later, after counsel sign-off.

**Perf guard:** no new dependencies; metadata is static (no runtime cost); hamburger is CSS/DOM only; Lighthouse ≥95 budget intact.

## Verification criteria
- [ ] `npx tsc --noEmit` and `next build` green
- [ ] Every route shows a unique title/description in page source; `/sitemap.xml` and `/robots.txt` resolve
- [ ] Mobile (<768px): hamburger opens/closes with keyboard and touch; all links reachable; no horizontal scroll on any page
- [ ] Unknown URL renders the branded 404 inside the marketing shell
- [ ] No analytics network request occurs anywhere (verify in devtools network tab)
- [ ] All new copy from config; `lib/security`, `model_policy.json`, API routes untouched
