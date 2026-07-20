/**
 * Pages config loader
 * Source of truth: /config/pages.json
 * Provides typed copy for /training, /about, /terms.
 * Rule: zero copy in JSX — all from this module.
 */

import pagesData from "../../config/pages.json";

// ─── Training ─────────────────────────────────────────────────────────────────

export interface TrainingTrack {
  title: string;
  description: string;
  bullets: string[];
}

export interface TrainingPage {
  title: string;
  subtitle: string;
  flagship_syllabus: string;
  cta_label: string;
  cta_href: string;
  tracks: TrainingTrack[];
}

// ─── About ────────────────────────────────────────────────────────────────────

export interface AboutSection {
  heading: string;
  paragraphs: string[];
  use_brand_compliance?: boolean;
}

export interface AboutPage {
  title: string;
  sections: AboutSection[];
}

// ─── Terms ────────────────────────────────────────────────────────────────────

export interface TermsSection {
  heading: string;
  body: string;
}

export interface TermsPage {
  title: string;
  sections: TermsSection[];
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface PagesConfig {
  training: TrainingPage;
  about: AboutPage;
  terms: TermsPage;
}

const pages = pagesData as PagesConfig;

export default pages;

// Named exports
export const trainingPage = pages.training;
export const aboutPage    = pages.about;
export const termsPage    = pages.terms;
