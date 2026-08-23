import type { MetadataRoute } from "next";
import { websiteUrl } from "@/lib/brand";

/**
 * Sitemap — all marketing routes + demo hub + the public Academy course page.
 * Console sub-routes (individual demos) excluded.
 * Academy sign-in, lesson pages, and the certificate are excluded on purpose:
 * they are learner-state pages, not landing pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = websiteUrl;

  const routes = [
    "/",
    "/solutions",
    "/training",
    "/training/automation-101",
    "/demos",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${base}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));
}
