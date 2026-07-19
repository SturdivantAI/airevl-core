# Ticket 002: Purge dead chrome + brand lockup fix (Wave 2A-T2)

## Context & destination
The MVP carries decorative console chrome that confuses visitors and a meaningless "ENTERPRISE ELITE" descriptor. Done = every interactive element on marketing pages is real, and the brand lockup says what AiRevl is. Spine: `IA_UX_RESTRUCTURE_BLUEPRINT.md` §1 (audit), §5-D2 (resolved language).

## Requirements & seams
- Remove from marketing shell entirely: Systems / Assets / Network tabs (TopAppBar), "Deploy AI" button, "INITIALIZE PROTOCOL" button, CORE_ACTIVE/UPLINK STABLE badge, System Load pill. (They may survive inside `(console)` chrome only where they are part of a demo's fiction.)
- Home hero widgets (Neural Sync / Protocol Status / Network Latency GlassPanels): relocate markup into `(console)/demos/telemetry` as demo content; they leave `/` (full home rebuild is Ticket 003, not this one — this ticket only removes/relocates).
- Brand lockup (marketing nav + footer): logo at increased size + "AiRevl" wordmark + descriptor "Sovereign Agentic AI" (replaces "ENTERPRISE ELITE"). Tagline "Autonomy, governed." renders in the footer above the CAC line and is available as a brand.json field (`tagline`).
- Add `tagline` + `lockup_descriptor` to `config/brand.json`; consume via `lib/brand.ts` typed exports. No hardcoded strings.

## Verification criteria
- [ ] `npx tsc --noEmit` and `next build` green
- [ ] No dead/broken interactive elements remain on any marketing page
- [ ] Lockup renders "Sovereign Agentic AI"; footer renders "Autonomy, governed." + CAC line (RC 9432444)
- [ ] Telemetry demo shows the relocated widgets; home no longer does
- [ ] All new strings flow from brand.json
