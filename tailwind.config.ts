// AiRevl Tailwind Config
// Source of truth: .kiro/DESIGN.md (locked from Google Stitch)
// Rule: Never hand-edit generated CSS. All visual changes re-enter at Stitch.

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Cyan
        "primary":                    "#dbfcff",
        "primary-container":          "#00f0ff",
        "primary-fixed":              "#7df4ff",
        "primary-fixed-dim":          "#00dbe9",
        "inverse-primary":            "#006970",
        "on-primary":                 "#00363a",
        "on-primary-container":       "#006970",
        "on-primary-fixed":           "#002022",
        "on-primary-fixed-variant":   "#004f54",
        "surface-tint":               "#00dbe9",

        // Secondary — Violet
        "secondary":                  "#d0bcff",
        "secondary-container":        "#571bc1",
        "secondary-fixed":            "#e9ddff",
        "secondary-fixed-dim":        "#d0bcff",
        "on-secondary":               "#3c0091",
        "on-secondary-container":     "#c4abff",
        "on-secondary-fixed":         "#23005c",
        "on-secondary-fixed-variant": "#5516be",

        // Tertiary
        "tertiary":                   "#f8f4fc",
        "tertiary-container":         "#dbd8e0",
        "tertiary-fixed":             "#e4e1e9",
        "tertiary-fixed-dim":         "#c8c5cd",
        "on-tertiary":                "#303036",
        "on-tertiary-container":      "#5f5e64",
        "on-tertiary-fixed":          "#1b1b20",
        "on-tertiary-fixed-variant":  "#47464c",

        // Surface scale
        "surface":                    "#051424",
        "surface-dim":                "#051424",
        "surface-bright":             "#2c3a4c",
        "surface-container-lowest":   "#010f1f",
        "surface-container-low":      "#0d1c2d",
        "surface-container":          "#122131",
        "surface-container-high":     "#1c2b3c",
        "surface-container-highest":  "#273647",
        "surface-variant":            "#273647",

        // On-surface
        "on-surface":                 "#d4e4fa",
        "on-surface-variant":         "#b9cacb",
        "on-background":              "#d4e4fa",

        // Outline
        "outline":                    "#849495",
        "outline-variant":            "#3b494b",

        // Inverse
        "inverse-surface":            "#d4e4fa",
        "inverse-on-surface":         "#233143",

        // Error
        "error":                      "#ffb4ab",
        "error-container":            "#93000a",
        "on-error":                   "#690005",
        "on-error-container":         "#ffdad6",

        // Background
        "background":                 "#051424",
      },

      borderRadius: {
        DEFAULT: "0.125rem",   // 2px — buttons, tags
        lg:      "0.25rem",    // 4px
        xl:      "0.5rem",     // 8px — cards
        full:    "0.75rem",    // 12px — pills, avatars
      },

      spacing: {
        gutter:              "24px",
        "container-padding": "32px",
        unit:                "4px",
        "section-gap":       "64px",
      },

      fontFamily: {
        "body-md":             ["Inter", "sans-serif"],
        "label-caps":          ["JetBrains Mono", "monospace"],
        "headline-lg":         ["Hanken Grotesk", "sans-serif"],
        "data-mono":           ["JetBrains Mono", "monospace"],
        "headline-lg-mobile":  ["Hanken Grotesk", "sans-serif"],
        "display-lg":          ["Hanken Grotesk", "sans-serif"],
      },

      fontSize: {
        "body-md":            ["16px", { lineHeight: "24px",  fontWeight: "400" }],
        "label-caps":         ["12px", { lineHeight: "16px",  letterSpacing: "0.1em",   fontWeight: "700" }],
        "headline-lg":        ["32px", { lineHeight: "40px",  letterSpacing: "-0.01em", fontWeight: "600" }],
        "data-mono":          ["14px", { lineHeight: "20px",  letterSpacing: "0.02em",  fontWeight: "500" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px",  fontWeight: "600" }],
        "display-lg":         ["48px", { lineHeight: "56px",  letterSpacing: "-0.02em", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};

export default config;
