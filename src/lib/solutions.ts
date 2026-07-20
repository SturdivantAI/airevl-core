/**
 * Solutions config loader
 * Source of truth: /config/solutions.json
 * Rule: All solution card copy consumed via typed exports — no hardcoded strings.
 */

import solutionsData from "../../config/solutions.json";

export interface SolutionDetail {
  heading: string;
  paragraphs: string[];
  bullets: string[];
}

export interface SolutionCard {
  slug: string;
  title: string;
  description: string;
  icon: string;
  status: "active" | "pending";
  detail?: SolutionDetail;
}

export interface SolutionsConfig {
  section_title: string;
  section_subtitle: string;
  cta_label: string;
  cta_href: string;
  pending_strip: string;
  cards: SolutionCard[];
}

const solutions = solutionsData as SolutionsConfig;

export default solutions;

// Named exports
export const solutionsSectionTitle    = solutions.section_title;
export const solutionsSectionSubtitle = solutions.section_subtitle;
export const solutionCtaLabel         = solutions.cta_label;
export const solutionCtaHref          = solutions.cta_href;
export const solutionPendingStrip     = solutions.pending_strip;
export const solutionCards            = solutions.cards;
