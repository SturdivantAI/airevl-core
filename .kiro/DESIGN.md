# AiRevl Design System — DESIGN.md
**Source:** Google Stitch export (Code to Clipboard)
**Status:** LOCKED — Phase 2 exit gate passed
**Date:** 2026-07-13
**Rule:** Design flows Stitch → this file → Kiro-generated code. Never hand-edit generated CSS. All visual changes re-enter at Stitch.

---

## 1. Color Palette (Tailwind Token Map)

All colors are registered in `tailwind.config` under `theme.extend.colors`.

| Token | Hex | Usage |
|---|---|---|
| `primary-container` | `#00f0ff` | Primary cyan — active states, glows, CTAs, accent text |
| `primary-fixed-dim` | `#00dbe9` | Dimmed cyan — secondary active, nav borders |
| `primary-fixed` | `#7df4ff` | Light cyan — hover states |
| `primary` | `#dbfcff` | Near-white cyan — body primary text |
| `secondary-container` | `#571bc1` | Electric violet — secondary bars, active indicators |
| `secondary-fixed-dim` | `#d0bcff` | Soft violet — secondary data labels |
| `surface` | `#051424` | Page background (Deepest Onyx) |
| `surface-dim` | `#051424` | Topbar/header background |
| `surface-container` | `#122131` | Card/panel background |
| `surface-container-high` | `#1c2b3c` | Elevated panel background |
| `surface-container-highest` | `#273647` | Highest elevation surface |
| `surface-container-lowest` | `#010f1f` | Deepest inset background |
| `on-surface` | `#d4e4fa` | Primary text on surface |
| `on-surface-variant` | `#b9cacb` | Secondary/muted text |
| `outline-variant` | `#3b494b` | Subtle borders |
| `error` | `#ffb4ab` | Error/alert states |
| `error-container` | `#93000a` | Error background |
| `background` | `#051424` | Root background |

**Ambient background (body):**
```css
background-color: #050508;
background-image:
  radial-gradient(circle at 15% 50%, rgba(87, 27, 193, 0.08) 0%, transparent 50%),
  radial-gradient(circle at 85% 30%, rgba(0, 240, 255, 0.05) 0%, transparent 50%);
background-attachment: fixed;
```

---

## 2. Typography

All fonts loaded via Google Fonts. Registered in `tailwind.config` under `theme.extend.fontFamily` and `theme.extend.fontSize`.

| Token | Family | Size | Line Height | Weight | Letter Spacing |
|---|---|---|---|---|---|
| `display-lg` | Hanken Grotesk | 48px | 56px | 700 | -0.02em |
| `headline-lg` | Hanken Grotesk | 32px | 40px | 600 | -0.01em |
| `headline-lg-mobile` | Hanken Grotesk | 24px | 32px | 600 | — |
| `body-md` | Inter | 16px | 24px | 400 | — |
| `label-caps` | JetBrains Mono | 12px | 16px | 700 | 0.1em |
| `data-mono` | JetBrains Mono | 14px | 20px | 500 | 0.02em |

**Google Fonts import:**
```
Hanken Grotesk: 600, 700, 900
Inter: 400, 500, 600, 700
JetBrains Mono: 400, 500, 700
Material Symbols Outlined (variable: wght, FILL 100..700, 0..1)
```

---

## 3. Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `gutter` | 24px | Grid gap between cards/panels |
| `container-padding` | 32px | Page/section horizontal padding |
| `unit` | 4px | Base spacing unit |
| `section-gap` | 64px | Vertical section spacing |

**Sidebar width:** 264px (w-64)
**Topbar height:** 64px (h-16)
**Main content offset:** `md:ml-64`

---

## 4. Border Radius

| Token | Value |
|---|---|
| `DEFAULT` | 0.125rem (2px) — buttons, tags |
| `lg` | 0.25rem (4px) |
| `xl` | 0.5rem (8px) — cards |
| `full` | 0.75rem (12px) — pills, avatars |

---

## 5. Glassmorphism System

All panels use the `.glass-panel` class. This is the core visual system — never override inline.

```css
.glass-panel {
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-panel-active {
  border-color: rgba(0, 240, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
}

.glow-active {
  border-color: rgba(0, 240, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
}

.text-glow {
  text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
}
```

**Topbar glass:**
```css
background: rgba(surface-dim, 0.4);
backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255,255,255,0.05);
```

**Sidebar glass:**
```css
background: rgba(surface-container, 0.6);
backdrop-filter: blur(24px);
border-right: 1px solid rgba(255,255,255,0.1);
```

---

## 6. Animation System

```css
/* Cyan pulse glow — active indicators, email CTA */
@keyframes pulse-cyan {
  0%   { opacity: 0.4; text-shadow: 0 0 4px rgba(0,240,255,0); }
  50%  { opacity: 1;   text-shadow: 0 0 12px rgba(0,240,255,0.8); }
  100% { opacity: 0.4; text-shadow: 0 0 4px rgba(0,240,255,0); }
}
.animate-pulse-cyan { animation: pulse-cyan 2s infinite ease-in-out; }

/* Log entry scroll-in — terminal feed */
@keyframes scroll-logs {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.log-animate { animation: scroll-logs 0.5s ease-out forwards; }
```

**3D Canvas (Three.js — ANIMATION_3):**
- Outer: IcosahedronGeometry(2, 0), wireframe, color `#00f0ff`, opacity 0.8
- Inner: IcosahedronGeometry(1.2, 1), solid, color `#7000ff`, emissive `#200040`
- Outer rotation: +0.005/frame on x and y
- Inner rotation: -0.01/frame on x and y
- Camera z: 6, PerspectiveCamera FOV 75

**Shader Background (WebGL — ANIMATION_2):**
- Digital flow: `sin(uv.x*10+t) * cos(uv.y*10-t)` mixed between `#020e24` and `#0d2640`
- Grid overlay: `fract(uv*40)` step lines at 0.98, +0.05 opacity
- Applied at: `opacity-60 mix-blend-screen` over body background

---

## 7. Custom Scrollbar

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #050508; }
::-webkit-scrollbar-thumb { background: #273647; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #00f0ff; }
```

---

## 8. Shared Layout Components

### SideNavBar (all 4 screens)
- Fixed left, full height, w-64, z-40
- Hidden on mobile (`hidden md:flex`)
- Active nav item: `text-primary-container border-r-2 border-primary-container bg-primary-container/10 scale-95`
- Inactive: `text-on-surface-variant hover:bg-white/5`
- Nav icons: Material Symbols Outlined (FILL toggle: 1=active, 0=inactive)
- Nav items: Dashboard (`space_dashboard`), Training (`model_training`), Telemetry (`analytics`), Security (`terminal`)
- CTA button: "Initialize Protocol" — outlined, border `primary-container`, hover `bg-primary-container/10`, glow shadow
- Footer: Settings + Support links at opacity-70

### TopAppBar (all 4 screens)
- Sticky top, h-16, z-50, glass backdrop
- Desktop: mono nav links (Systems, Assets, Network)
- Right actions: search icon, notifications (with pulse dot), shield icon, "Deploy AI" CTA button, avatar
- Mobile: brand wordmark + hamburger menu

### CTA Buttons
- Primary (filled): `bg-primary-container text-on-primary-container` → hover `bg-primary-fixed`
- Secondary (outlined): `border border-primary-container text-primary-container` → hover `bg-primary-container/10` with glow shadow `0 0 15px rgba(0,240,255,0.1)`

---

## 9. Four Screens

### Screen 1 — Hero Dashboard (AI Core Viewport)
**File tag:** `Dashboard: AI Core Viewport`
- Full-viewport hero with Three.js icosahedron (ANIMATION_3) centered, `mix-blend-screen opacity-90`
- WebGL shader background (ANIMATION_2) at `opacity-60 mix-blend-screen`
- Top-left status badge: `CORE_ACTIVE | UPLINK STABLE` — glass panel, cyan pulse dot
- Top-right: System Load percentage — glass panel
- Bottom: 3-column metric grid (glass cards)
  - Neural Sync: 99.4% with SVG sparkline
  - Protocol Status: OPTIMAL with key-value rows
  - Network Latency: 12ms with dual progress bars (Node Alpha/Beta)
- Contact section (full-width glass panel above metrics):
  - Mail icon + "Initialize Comms Link" heading
  - `contact@airevl.ai` as large `display-lg` cyan link with text-glow

### Screen 2 — Corporate Training Catalog
**File tag:** `Training: Catalog Overview`
- Page header: `display-lg` title + body-md subtitle
- Section: "Synthetic Reasoning" with View All link
- 3-column card grid (glass cards, rounded-xl, p-8):
  - Each card: icon (Material Symbol, FILL 1) + badge (Advanced/Intermediate/Expert) + title + description + progress bar + "Initialize Learning" button
  - Last card uses filled primary button; others use outlined
- CBN/NDPA migration track to be added as new section (per blueprint)

### Screen 3 — Telemetry Console (FM-in-the-Pocket)
**File tag:** `Telemetry: Smart Facility Control`
- 3-panel layout: left data panel + center blueprint/map + right data panel
- Left panel: Power Consumption data rows (sector/MW) + Oxygen Saturation bar chart
- Center: Facility Schematic — glass panel with holographic map aesthetic
  - Interactive nodes (cyan pulse, error pulse) with hover tooltips
  - SVG connecting lines (cyan, dashed + solid)
  - Bottom overlay: coordinates + zoom controls
  - Header overlay: "Facility Schematic" + LIVE/SECURE badges
- Right panel: Neural Link Load bars + Live Activity Log feed (color-coded: [SYS] cyan, [NET] violet, [WARN] error)

### Screen 4 — Zero-Trust Security Log Terminal
**File tag:** `Security: Zero-Trust Log Terminal`
- 12-column bento grid (lg:grid-cols-12)
- Left/center (lg:col-span-8): Terminal panel (h-600px glass)
  - Header: "AiRevl // Terminal_v9.4.1" + search/filter icons
  - Output area: `.log-terminal` with scanline overlay, auto-scrolling JS log feed
  - Log colors: [SYS] cyan, [WARN] violet, [ALERT] error, [DATA] outline-variant
  - Input: blinking `>` prompt + text input
- Right sidebar (lg:col-span-4):
  - Global Threat Level: 4.2/10.0 with SVG chart + cyan gradient fill
  - Active Intercepts: 3 items with status badges (Tracking/Intercepted/Breach Attempt)
  - Recent Breaches: icon + IP + timestamp
- Bottom: Node Telemetry Stream table (Timestamp/Source/Destination/Protocol/Status)
- Contact + Footer section:
  - "Secure Comm Channel" → `contact@airevl.ai` with animate-pulse-cyan
  - Social icon dock (glass pill): LI | X | YT | TK | IG | FB — text abbreviations
  - Utility layer: CAC placeholder, sys version, copyright

---

## 10. Footer / Contact / Social Dock

**Contact email:** `contact@airevl.ai` — always rendered as `<a href="mailto:contact@airevl.ai">`, display-lg size, primary-container color, text-glow, animate-pulse-cyan

**Social icon dock** (glass pill, border border-white/5):
All six slots present with SVG icons (LinkedIn, X, TikTok, Instagram, Facebook, YouTube):
- LinkedIn: `/in/airevl-ai-311497413`
- X: `https://x.com/AirevlAi`
- TikTok: `https://www.tiktok.com/@airevl.ai`
- Instagram: `https://www.instagram.com/airevl.ai`
- Facebook: `https://www.facebook.com/share/18iBEhBzUa/`
- YouTube: `PENDING_CHANNEL` (render but link to `#` until filled)

**All social/contact/legal values must be dynamically imported from `/config/brand.json`. No hardcoded strings in components.**

**CAC micro-text layer** (font-data-mono, 8-10px, opacity-40/50):
```
CAC Reg: PENDING | Corporate Entity
© {year} AiRevl Inc.
```
Driven by `brand.json` → `legal.cac_registration_placeholder`

---

## 11. Responsive Bounds

- Mobile: sidebar hidden, topbar shows brand + hamburger + icons
- `md` breakpoint (768px): sidebar visible, full nav
- `lg` breakpoint (1024px): bento grid activates (col-span-8/4 split on Screen 4), 3-column catalog grid
- All containers: `max-w` unconstrained within 264px sidebar offset

---

## Phase 2 Exit Gate — PASSED ✅

- [x] All four screens present with explicit glassmorphic tokens, padding containers, dark palette
- [x] Footer reserves icon dock (6 socials) + contact@airevl.ai + CAC micro-text layer
- [x] Design tokens extracted and locked (colors, typography, spacing, radius, animation)
- [x] DESIGN.md committed at `.kiro/DESIGN.md`
