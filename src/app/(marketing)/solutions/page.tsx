/**
 * Solutions page
 * Route: /solutions
 * All strings from brand.json via lib/brand.ts.
 */

import type { Metadata } from "next";
import { stubs } from "@/lib/brand";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/solutions"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function SolutionsPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-4">
        {stubs.solutions.title}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {stubs.solutions.body}
      </p>
    </div>
  );
}
