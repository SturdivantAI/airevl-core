import type { MetadataRoute } from "next";
import { websiteUrl } from "@/lib/brand";

/**
 * Sitemap — all marketing routes + demo hub.
 * Console sub-routes (individual demos) excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = websiteUrl;

  const routes = [
    "/",
    "/solutions",
    "/training",
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
