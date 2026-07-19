# Ticket 003: Home page rebuild — hero, solutions grid, demo teasers (Wave 2B)

## Context & destination
Home currently shows the hero headline over the living background with a contact block — the old console widgets left in Ticket 002. Done = a full marketing home: hero with real CTAs, the seven-card solutions grid, and demo teaser cards. Spine: `IA_UX_RESTRUCTURE_BLUEPRINT.md` §2 (sitemap) and §5-D3 (resolved card set). Note: the telemetry-widget relocation is already shipped (Ticket 002) — do not re-do it.

## Requirements & seams

**Hero section:**
- Headline: `heroHeadline` from brand.json (unchanged copy).
- Sub-line: `tagline` ("Autonomy, governed.") from brand.json.
- Two CTAs: primary "Explore demos" → `/demos`; secondary "Talk to us" → `/contact`.

**Solutions grid** (7 cards; data-driven from a new `config/solutions.json` consumed via a typed loader — no copy in JSX):

| Card | Status | One-liner |
|---|---|---|
| Corporate AI Automation | active | Agentic automation for enterprise workflows, engineered zero-trust |
| Training & Certifications | active | Corporate + university tracks, incl. CBN/NDPA migration syllabus |
| Sovereign Compliance Suite | active | Edge isolation · regulatory telemetry · UBO/AML · 72-hr breach response |
| AiRevl Research Desk (RaaS) | active | Evidence-grade research on demand: due diligence, literature scans, regulatory briefs |
| Agent Foundry (MAaaS) | active | Custom agents and multi-agent systems, evaluated under LLM-as-a-Judge, delivered with governance rails |
| FM-in-the-Pocket | pending | Edge foundation-model telemetry |
| Deepfake Infrastructure | pending | Synthetic-media detection infrastructure |

- Active cards link to `/solutions#<slug>`; pending cards render disabled glassmorphic placeholders (seed-doc pattern) with a "Coming soon" chip — no dead links.
- Compliance copy rule: guardrail language only ("engineered to help you meet…"), never "ensures compliance."

**Demo teasers:** 3 compact cards (Telemetry, Security, Workflow-coming-soon) reusing the demo-hub card data → `/demos/*`. One shared data source with the hub — do not duplicate card copy.

**Layout/perf:** sections stack with generous spacing over the living background; glass panels per DESIGN addendum tokens; keep WCAG AA contrast from Ticket 002; no new dependencies; images/none — pure CSS/DOM sections; Lighthouse ≥95 budget intact.

## Verification criteria
- [ ] `npx tsc --noEmit` and `next build` green
- [ ] Home renders hero + 7-card grid + 3 demo teasers; no console widgets/chrome
- [ ] All card/CTA copy flows from config (solutions.json / brand.json); zero hardcoded strings
- [ ] Pending cards disabled, no dead links; active cards navigate correctly
- [ ] Text passes AA contrast over the animated background
- [ ] `lib/security`, `model_policy.json`, API routes untouched
