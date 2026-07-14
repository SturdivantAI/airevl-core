# AiRevl — EARS Requirements Specification
**Project:** AiRevl.ai corporate digital platform (PRD-001)
**Notation:** EARS (Easy Approach to Requirements Syntax)
**Version:** 1.0 — Phase 3
**Date:** 2026-07-13
**Constraint:** All frontend components MUST import contact, social, and legal values from `/config/brand.json` via `src/lib/brand.ts`. No hardcoded strings.

---

## EARS Notation Key

| Pattern | Template |
|---|---|
| Ubiquitous | The \<system\> shall \<action\> |
| Event-driven | WHEN \<trigger\> the \<system\> shall \<action\> |
| State-driven | WHILE \<state\> the \<system\> shall \<action\> |
| Option | WHERE \<feature\> is included the \<system\> shall \<action\> |
| Unwanted behaviour | IF \<condition\> THEN the \<system\> shall \<action\> |

---

## MS-01 — Shared Layout System

**MS-01.1** The application shall render a persistent `SideNavBar` component (width 264px, fixed left, hidden on mobile) on all four screens, reading the brand name from `brand.json`.

**MS-01.2** The application shall render a persistent `TopAppBar` component (height 64px, sticky top, z-50) on all four screens with glassmorphic backdrop.

**MS-01.3** WHEN a user navigates to a screen THEN the `SideNavBar` shall highlight the active nav item with `text-primary-container`, `border-r-2 border-primary-container`, and `bg-primary-container/10`.

**MS-01.4** The application shall apply the glassmorphic design system (`glass-panel`, `glass-panel-active`, `glow-active`) as defined in `.kiro/DESIGN.md` across all panels and cards.

**MS-01.5** The application shall load fonts (Hanken Grotesk, Inter, JetBrains Mono) via Next.js font optimization and apply the typography scale defined in `tailwind.config.ts`.

**MS-01.6** WHILE on mobile viewports (< 768px) the application shall hide `SideNavBar` and render a hamburger menu in `TopAppBar`.

**MS-01.7** The application shall render the WebGL shader background (ANIMATION_2 — digital flow + grid) at `opacity-60 mix-blend-screen` behind all screen content.

---

## MS-02 — Hero Dashboard (Screen 1)

**MS-02.1** The application shall render a full-viewport Hero Dashboard as the root route (`/`) with a Three.js icosahedron canvas (ANIMATION_3) at `mix-blend-screen opacity-90`.

**MS-02.2** The application shall display a `CORE_ACTIVE | UPLINK STABLE` status badge (glass panel, cyan pulse dot) in the top-left of the hero viewport.

**MS-02.3** The application shall render three metric cards (Neural Sync, Protocol Status, Network Latency) in a responsive 3-column grid at the bottom of the hero viewport using `glass-panel` styling.

**MS-02.4** The application shall render a full-width contact section above the metric grid displaying `contact@airevl.ai` as a `mailto:` link, reading the value from `brand.json`.

**MS-02.5** WHEN a user hovers a metric card THEN the card shall apply `glow-active` border and shadow transition.

**MS-02.6** The application shall display the hero headline from `brand.json` → `hero_headline` field.

---

## MS-03 — Corporate Training Catalog (Screen 2)

**MS-03.1** The application shall render the Training Catalog at route `/training` with a `display-lg` page header and `body-md` subtitle.

**MS-03.2** The application shall render training course cards in a responsive 3-column grid (1-col mobile, 2-col md, 3-col lg) using `glass-panel` styling with icon, difficulty badge, title, description, progress bar, and CTA button.

**MS-03.3** WHEN a course has progress > 0 THEN the progress bar shall render filled to the correct percentage with `bg-primary-container` and neon glow.

**MS-03.4** The application shall render the "CBN/NDPA Migration Engineering" track section, reading regulatory labels from `brand.json` → `regulatory_focus`.

**MS-03.5** WHERE a course card is the recommended entry point THEN the system shall render its CTA button as filled primary (`bg-primary-container text-on-primary`); all other cards shall use outlined secondary style.

**MS-03.6** The application shall render an active card for "Corporate AI Automation" and "University Certifications" with live state; pending cards ("FM-in-the-Pocket", "Deepfake Infrastructure") shall render as disabled glassmorphic placeholders.

---

## MS-04 — Telemetry Console / FM-in-the-Pocket (Screen 3)

**MS-04.1** The application shall render the Telemetry Console at route `/telemetry` with a 3-panel layout: left data panel, center facility schematic, right neural link panel.

**MS-04.2** The application shall render the center Facility Schematic panel with interactive SVG nodes (cyan pulse for nominal, error pulse for critical) and connecting lines.

**MS-04.3** WHEN a user hovers a facility node THEN the system shall display a tooltip glass panel showing node name and status.

**MS-04.4** The application shall render a Live Activity Log feed in the right panel with color-coded log entries: `[SYS]` cyan, `[NET]` violet, `[WARN]` error.

**MS-04.5** The application shall stream mock IoT telemetry packets from `mock-data/telemetry.json` into the dashboard at runtime, with no dependency on live backends (Phase 5 mock boundary).

**MS-04.6** WHILE the telemetry feed is active the system shall auto-scroll the activity log to the latest entry.

---

## MS-05 — Zero-Trust Security Log Terminal (Screen 4)

**MS-05.1** The application shall render the Zero-Trust Security Log Terminal at route `/security` using a 12-column bento grid (8-col terminal + 4-col sidebar on lg).

**MS-05.2** The application shall render a live-scrolling log terminal (`log-terminal` class) with auto-generated mock log entries at ~800ms intervals using `log-animate` entry animation.

**MS-05.3** The application shall display a Global Threat Level panel with SVG chart and cyan gradient fill.

**MS-05.4** The application shall render an Active Intercepts panel with three status badge variants: Tracking (violet), Intercepted (cyan), Breach Attempt (error).

**MS-05.5** WHEN a user submits a command string in the terminal input THEN the system shall echo the command as a `[CMD]` log entry.

**MS-05.6** The application shall render a Node Telemetry Stream table (Timestamp, Source, Destination, Protocol, Status) from `mock-data/security-log.json`.

**MS-05.7** The application shall render the contact section and footer dock on this screen (see MS-08).

---

## MS-06 — AiRevl Ecosystem Scout Demo (Screen 5 — Demo 2)

**MS-06.1** The application shall render the Ecosystem Scout at route `/demo/scout` with a search bar connected to an MCP server stub.

**MS-06.2** The application shall render search results as a multi-node relational graph via React Three Fiber (founders, assets, tech stacks).

**MS-06.3** WHEN a user submits a search query THEN the system shall query the MCP stub and render the resulting graph within 500ms on mock data.

**MS-06.4** IF the MCP server is unavailable THEN the system shall display a `glass-panel` error state with retry option, logging the failure to the audit stream.

---

## MS-07 — LLM-as-a-Judge Sandbox Demo (Screen 6 — Demo 3)

**MS-07.1** The application shall render the LLM-as-a-Judge Sandbox at route `/demo/judge` as a split-screen terminal.

**MS-07.2** The application shall accept adversarial string input and pass it through the Zod zero-trust schema (`lib/security/schemas.ts`) for validation.

**MS-07.3** WHEN an injection attempt is detected THEN the system shall display a flagged `[ALERT]` entry in the terminal with the sanitized payload hash, never the raw payload.

**MS-07.4** WHEN a clean string is submitted THEN the system shall display a `[PASS]` entry with latency in milliseconds.

**MS-07.5** The application shall use `mock-data/judge-cases.json` as the synthetic test corpus during Phase 5; live Gemma-2-2B inference is wired in Phase 6.

---

## MS-08 — Footer, Contact & Social Dock

**MS-08.1** The application shall render `contact@airevl.ai` as an active `mailto:` anchor with `animate-pulse-cyan` and `text-glow` on every screen, reading the value from `brand.json`.

**MS-08.2** The application shall render a social icon dock with SVG icons for all six platforms (LinkedIn, X, YouTube, TikTok, Instagram, Facebook), reading URLs from `brand.json` → `social_media`.

**MS-08.3** WHERE `brand.json` → `social_media.youtube` equals `"PENDING_CHANNEL"` the system shall render the YouTube icon linking to `#` without throwing an error.

**MS-08.4** The application shall render the CAC micro-text layer reading `brand.json` → `legal.cac_registration_placeholder`; WHEN the placeholder is replaced with a real CAC number THEN the footer shall display it automatically on next deploy.

**MS-08.5** The application shall render the compliance badges reading from `brand.json` → `regulatory_focus` array.

---

## MS-09 — API Routes & Zero-Trust Layer

**MS-09.1** The application shall expose `/api/contact` as a POST endpoint that relays form submissions via Resend or AWS SES bound to the `airevl.ai` domain.

**MS-09.2** All `/api/agent/*` routes shall validate every incoming payload against the Zod zero-trust schema before processing; IF validation fails THEN the route shall return HTTP 422 and log an OKF audit event.

**MS-09.3** WHEN a streaming payload contains an injection pattern THEN `lib/security/sanitize.ts` shall redact the pattern, log a `[ALERT injection_attempt]` OKF audit event, and return the sanitized payload.

**MS-09.4** The application shall route all LLM reasoning calls through `lib/model-router` using `/config/model_policy.json`; no route shall reference a model ID directly.

**MS-09.5** WHILE the primary model tier is unavailable the `ModelRouter` shall demote to the next tier per the failover chain within `timeout_ms`, persisting circuit-breaker state in Upstash Redis.

---

## MS-10 — Performance, Accessibility & Compliance

**MS-10.1** The application shall achieve Lighthouse Performance score ≥ 95 on all key routes.

**MS-10.2** The application shall pass semantic accessibility compliance (WCAG 2.1 AA): all interactive elements shall have accessible labels, focus rings, and sufficient colour contrast.

**MS-10.3** The application shall pass OWASP Top 10 injection tests against all `/api/*` routes via the zero-trust Zod layer.

**MS-10.4** The application shall implement a Framer Motion warmup/pre-fetch hook on the Hero Dashboard to pre-load the Three.js canvas before the user reaches it.

**MS-10.5** The application shall serve the Three.js canvas and WebGL shader as dynamically imported client components (`next/dynamic` with `ssr: false`) to preserve SSR performance on the root route.
