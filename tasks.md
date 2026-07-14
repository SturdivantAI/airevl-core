# AiRevl — Parallel Dev Checklist (tasks.md)
**Generated:** Phase 3 — Kiro Desktop workspace init
**Source:** EARS_SPEC.md (MS-01 through MS-10)
**Rule:** One ticket = one bounded agent session (Appendix E1). Feed Kiro/Claude one task at a time.
**Wave model:** Tasks within the same wave can run in parallel. Each wave depends on the previous wave completing.

---

## Wave 0 — Foundation (COMPLETE ✅)
*Blocking dependency for all waves. Already merged to main.*

- [x] **T0.1** Repository scaffold — canonical directory structure, .gitignore
- [x] **T0.2** `config/brand.json` — all contact, social, legal, regulatory tokens
- [x] **T0.3** `config/model_policy.json` — ModelRouter failover chain + circuit breaker config
- [x] **T0.4** OKF schema spine — `okf-bundle/schemas/` (entity, inference, audit)
- [x] **T0.5** `public/assets/AiRevl-logo.png` — logo asset in place
- [x] **T0.6** `.kiro/DESIGN.md` — 4-screen design system locked from Google Stitch
- [x] **T0.7** Next.js App Router bootstrap — `package.json`, `tsconfig.json`, `next.config.ts`
- [x] **T0.8** `tailwind.config.ts` — full AiRevl color/typography/spacing token system
- [x] **T0.9** `src/app/globals.css` — design system CSS (glassmorphism, animations, scrollbar)
- [x] **T0.10** `src/lib/brand.ts` — brand.json loader (typed, named exports)
- [x] **T0.11** `EARS_SPEC.md` — full requirements spec (MS-01 – MS-10)

---

## Wave 1 — Shared Infrastructure (Phase 4 + Phase 5 start)
*Parallel. No inter-dependencies within the wave. Must complete before Wave 2.*

- [ ] **T1.1** `src/lib/model-router/` — ModelRouter class; reads `model_policy.json`; no route names a model directly *(Claude — security_critical)*
- [ ] **T1.2** `src/lib/security/schemas.ts` — Zod zero-trust request schemas derived from OKF entity + inference schemas *(Claude — security_critical)*
- [ ] **T1.3** `src/lib/security/sanitize.ts` — injection pattern detection + redaction pipeline *(Claude — security_critical)*
- [ ] **T1.4** `src/lib/security/guard.ts` — refusal state handler; emits OKF-valid audit events to Redis stream *(Claude — security_critical)*
- [ ] **T1.5** `src/lib/skill-engine/` — load-on-demand skill loader; caches specs in Upstash Redis *(Claude)*
- [ ] **T1.6** `src/lib/observability/` — minimal M1 telemetry counters (latency, refusals, failovers, cache hits → Redis stream) **Phase 4 exit gate** *(Claude)*
- [ ] **T1.7** `src/components/layout/SideNavBar.tsx` — shared sidebar; all brand strings from `brand.ts` *(Kiro)*
- [ ] **T1.8** `src/components/layout/TopAppBar.tsx` — shared topbar; glassmorphic backdrop *(Kiro)*
- [ ] **T1.9** `src/components/layout/Footer.tsx` — contact email + social dock (6 SVG icons) + CAC micro-text; all values from `brand.ts` *(Kiro)*
- [ ] **T1.10** `src/components/ui/GlassPanel.tsx` — reusable glassmorphic panel wrapper *(Kiro)*
- [ ] **T1.11** `src/components/ui/GlowButton.tsx` — primary + secondary button variants *(Kiro)*
- [ ] **T1.12** `src/components/canvas/ShaderBackground.tsx` — WebGL ANIMATION_2 (digital flow + grid); `next/dynamic ssr:false` *(Kiro)*
- [ ] **T1.13** `src/components/canvas/AICore3D.tsx` — Three.js ANIMATION_3 icosahedron; `next/dynamic ssr:false` *(Kiro)*

---

## Wave 2 — API Routes & Security Layer (Phase 4)
*Parallel within wave. Depends on T1.1 – T1.4 completing.*

- [ ] **T2.1** `src/app/api/contact/route.ts` — POST endpoint; Resend/SES relay; validates with Zod; reads sender from `brand.ts` *(Claude — security_critical)*
- [ ] **T2.2** `src/app/api/agent/route.ts` — streaming agent endpoint; Zod validation; refusal/exception logging via guard.ts *(Claude — security_critical)*
- [ ] **T2.3** `src/app/api/agent/sanitize/route.ts` — PII scrubbing endpoint; returns sanitized payload hash, never raw content *(Claude — security_critical)*
- [ ] **T2.4** `src/lib/model-router/circuit-breaker.ts` — Redis-backed breaker (`breaker:<model_id>`, TTL=cooldown_ms); NOT module memory (E4 fix) *(Claude — security_critical)*
- [ ] **T2.5** `src/lib/model-router/parity-guard.ts` — sync schema check + async sampled LLM judge (E5 fix); quarantines failing tier *(Claude)*
- [ ] **T2.6** `.kiro/hooks.json` — route agent system tasks through ModelRouter; no hardcoded model IDs *(Kiro + Claude)*

---

## Wave 3 — Mock Data Contracts (Phase 5 prerequisite)
*Parallel. Depends on OKF schemas (T0.4). Must complete before Wave 4.*

- [ ] **T3.1** `mock-data/telemetry.json` — IoT packet stream; matches planned Supabase schema field-for-field *(Kiro)*
- [ ] **T3.2** `mock-data/security-log.json` — node telemetry stream rows; OKF audit schema compliant *(Kiro)*
- [ ] **T3.3** `mock-data/training-catalog.json` — course cards with progress, status (active/pending), difficulty *(Kiro)*
- [ ] **T3.4** `mock-data/judge-cases.json` — adversarial string test corpus; mix of clean + injection attempts *(Kiro)*
- [ ] **T3.5** `mock-data/ecosystem-graph.json` — founder/asset/tech-stack nodes + edges for Ecosystem Scout *(Kiro)*
- [ ] **T3.6** `scripts/okf_validate.py` — CI gate; blocks malformed OKF schemas, version drift, mock-data fixture drift *(Claude)*

---

## Wave 4 — Screen Components (Phase 5 main build)
*Parallel within wave. Depends on Wave 1 (shared components) + Wave 3 (mock data).*

- [ ] **T4.1** `src/app/page.tsx` — Hero Dashboard (Screen 1); ShaderBackground + AICore3D + status badge + metric cards + contact section; Framer Motion warmup hook (MS-02, MS-10.4) *(Kiro)*
- [ ] **T4.2** `src/app/training/page.tsx` — Corporate Training Catalog (Screen 2); data-driven grid from mock-data; active/pending card states (MS-03) *(Kiro)*
- [ ] **T4.3** `src/app/telemetry/page.tsx` — Telemetry Console (Screen 3); 3-panel layout; facility schematic SVG nodes; live activity log (MS-04) *(Kiro)*
- [ ] **T4.4** `src/app/security/page.tsx` — Zero-Trust Log Terminal (Screen 4); 12-col bento grid; auto-scrolling terminal; threat panel; footer (MS-05) *(Kiro)*
- [ ] **T4.5** `src/app/demo/judge/page.tsx` — LLM-as-a-Judge Sandbox (Demo 3); split-screen terminal; Zod validation pipeline (MS-07) *(Kiro + Claude)*
- [ ] **T4.6** `src/app/demo/scout/page.tsx` — Ecosystem Scout (Demo 2); React Three Fiber graph; MCP stub (MS-06) *(Kiro)*
- [ ] **T4.7** `src/app/layout.tsx` — root layout; Google Fonts (Hanken Grotesk, Inter, JetBrains Mono); SideNavBar + TopAppBar; ShaderBackground *(Kiro)*

---

## Wave 5 — CI, Verification & Hardening (Phase 7)
*Sequential. Depends on all Wave 4 screens passing smoke tests.*

- [ ] **T5.1** `.github/workflows/ci.yml` — lint + type-check + build gate on every PR *(Kiro)*
- [ ] **T5.2** Lighthouse audit ≥ 95 on `/`, `/training`, `/telemetry`, `/security` (MS-10.1) *(You)*
- [ ] **T5.3** Accessibility audit — semantic compliance, focus rings, colour contrast (MS-10.2) *(You)*
- [ ] **T5.4** OWASP Top 10 injection tests against `/api/*` via Zod zero-trust layer (MS-10.3) *(Claude)*
- [ ] **T5.5** Contact form smoke test — real inquiry → `contact@airevl.ai` inbox *(You)*
- [ ] **T5.6** Legal placeholder swap test — update `brand.json` CAC field → confirm footer updates on rebuild *(You)*
- [ ] **T5.7** Vercel project link + webhook — `main` merge → auto-deploy to `airevl.ai` *(You)*

---

## Wave 6 — Live Backend Swap (Phase 6)
*Sequential. All Wave 5 gates must be green first.*

- [ ] **T6.1** Supabase PostgreSQL schema — mirrors mock-data contracts field-for-field *(You + Claude)*
- [ ] **T6.2** Hot-swap `mock-data/telemetry.json` → live Supabase query in `/telemetry` *(Claude)*
- [ ] **T6.3** Hot-swap `mock-data/security-log.json` → live Supabase query in `/security` *(Claude)*
- [ ] **T6.4** Hot-swap `mock-data/training-catalog.json` → live Supabase query in `/training` *(Claude)*
- [ ] **T6.5** Redis cache + rate limiting layer active in front of `/api/agent` *(Claude)*
- [ ] **T6.6** Secrets migration — all env vars in Vercel; confirm nothing live committed *(You)*
- [ ] **T6.7** Post-swap security re-check — re-run T5.4 OWASP tests against live endpoints *(Claude)*

---

## Post-Launch Track (Appendix C — M1/M2/M3)

- [ ] **PL.1** M1 — Full OTEL spans export to Langfuse/Datadog/CloudWatch (seed in T1.6)
- [ ] **PL.2** M2 — `lib/arbiter/` typed TypeScript state graph over ModelRouter; evaluate `adk-js` as graph engine
- [ ] **PL.3** M3 — `lib/memory/` + Supabase pgvector semantic memory (episodic/semantic/procedural)
- [ ] **PL.4** LinkedIn Company Page (currently `/in/` personal profile)
- [ ] **PL.5** YouTube channel URL → fill `brand.json` → redeploy
- [ ] **PL.6** WhatsApp Business phone → fill `brand.json` → redeploy
- [ ] **PL.7** xAI API key + prepaid credits → activate Grok diversity tier in `model_policy.json`
- [ ] **PL.8** Qwen2.5-0.5B intent filter → external endpoint (SageMaker/Cloud Run) → wire behind ModelRouter

---

## Ticket Template (Appendix E1)

Copy this for every agent session:

```markdown
# Ticket NNN: <imperative title>

## Context & destination
What exists now; what done looks like. Link the spine docs that constrain this ticket.

## Requirements & seams
Exact files/interfaces touched. Which contracts (OKF schema, Zod, ModelRouter) bound the work.

## Verification criteria
- [ ] Compiles/tests green against named interfaces
- [ ] No hardcoded model ids, secrets, or brand strings
- [ ] Security-path changes reviewed (tasks tagged security_critical)
```

---

## Next Immediate Tasks (Wave 1 — start here)

Priority order for first agent sessions:

1. **T1.2** Zod schemas (`lib/security/schemas.ts`) — security_critical, blocks T2.1–T2.5
2. **T1.1** ModelRouter (`lib/model-router/`) — security_critical, blocks T2.1–T2.5
3. **T1.7 + T1.8 + T1.9** Layout components (SideNavBar, TopAppBar, Footer) — parallel, unblock Wave 4
4. **T1.12 + T1.13** Canvas components (ShaderBackground, AICore3D) — parallel, unblock T4.1
5. **T3.1 – T3.5** Mock data contracts — parallel, unblock Wave 4
