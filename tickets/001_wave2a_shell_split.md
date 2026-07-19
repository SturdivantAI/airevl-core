# Ticket 001: Split marketing shell from console shell (Wave 2A-T1)

## Context & destination
The site currently wraps every route in console chrome (SideNavBar + TopAppBar), so visitors land in what reads as an internal ops tool. Done = two Next.js route groups sharing one repo and one deploy: a marketing shell for visitor pages and a console shell reserved for demos. Spine: `IA_UX_RESTRUCTURE_BLUEPRINT.md` §2 (sitemap), §5 (resolved decisions).

## Requirements & seams
- Create route groups under `src/app`: `(marketing)` and `(console)`.
- `(marketing)/layout.tsx`: top nav — logo lockup left (see Ticket 002), links right: Solutions, Training, Demos, About, Contact + CTA button "Explore demos" → `/demos`. Footer (existing `Footer.tsx`) at page bottom. `BackgroundCanvasWrapper` stays mounted globally in root layout.
- `(console)/layout.tsx`: existing SideNavBar + TopAppBar chrome, plus a persistent banner: "Interactive demo — synthetic data" with a "Back to site" link.
- Move routes: `/` (home, placeholder until Ticket 003), `/training` → `(marketing)`; `/telemetry` → `(console)/demos/telemetry`; `/security` → `(console)/demos/security`; existing `/demo/*` pages → `(console)/demos/*`.
- Add `(marketing)/demos/page.tsx`: demo hub — one card per console (Telemetry, Security, Workflow-coming-soon) linking into the console shell.
- Stub pages (H1 + one paragraph, real copy comes in 2D): `/solutions`, `/about`, `/contact`.
- Redirects in `next.config`: `/telemetry` → `/demos/telemetry`, `/security` → `/demos/security` (permanent) so old links survive.
- All nav labels/strings from a config source, not hardcoded (existing brand.json discipline).

## Verification criteria
- [ ] `npx tsc --noEmit` and `next build` green
- [ ] Every route renders in the correct shell; no marketing page shows SideNavBar
- [ ] Old `/telemetry`, `/security` URLs redirect correctly
- [ ] Living background visible on marketing pages; demo banner visible on console pages
- [ ] No hardcoded model ids, secrets, or contact strings
