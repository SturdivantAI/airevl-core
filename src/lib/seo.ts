/**
 * SEO config loader
 * Source of truth: /config/seo.json
 * Provides per-route metadata and error-page copy.
 */

import seoData from "../../config/seo.json";

export interface RouteMeta {
  title: string;
  description: string;
}

export interface NotFoundCopy {
  heading: string;
  body: string;
  home_label: string;
  demos_label: string;
}

export interface ErrorCopy {
  heading: string;
  body: string;
  reset_label: string;
}

export interface SeoConfig {
  suffix: string;
  routes: Record<string, RouteMeta>;
  not_found: NotFoundCopy;
  error: ErrorCopy;
}

const seo = seoData as SeoConfig;

export default seo;

export const seoSuffix   = seo.suffix;
export const seoRoutes   = seo.routes;
export const notFoundCopy = seo.not_found;
export const errorCopy   = seo.error;

/** Helper: get metadata for a specific route */
export function getRouteMeta(path: string): RouteMeta | undefined {
  return seo.routes[path];
}
