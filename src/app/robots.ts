import type { MetadataRoute } from "next";
import { websiteUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${websiteUrl}/sitemap.xml`,
  };
}
