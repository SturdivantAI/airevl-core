/**
 * Solutions config loader
 * Source of truth: /config/solutions.json
 * Rule: All solution card copy consumed via typed exports — no hardcoded strings.
 */

import solutionsData from "../../config/solutions.json";

export interface SolutionCard {
  slug: string;
  title: string;
  description: string;
  icon: string;
  status: "active" | "pending";
}

export interface SolutionsConfig {
  section_title: string;
  section_subtitle: string;
  cards: SolutionCard[];
}

const solutions = solutionsData as SolutionsConfig;

export default solutions;

// Named exports
export const solutionsSectionTitle    = solutions.section_title;
export const solutionsSectionSubtitle = solutions.section_subtitle;
export const solutionCards            = solutions.cards;
