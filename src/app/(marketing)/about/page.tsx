/**
 * About page — config-driven.
 * Route: /about
 * All copy from config/pages.json via lib/pages.ts + brand.json legal block.
 * Zero copy in JSX.
 */

import { aboutPage } from "@/lib/pages";
import { legal, companyName } from "@/lib/brand";

import type { Metadata } from "next";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/about"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function AboutPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-12">
        {aboutPage.title}
      </h1>

      <div className="space-y-12">
        {aboutPage.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              {section.heading}
            </h2>
            {section.use_brand_compliance && (
              <p className="font-data-mono text-data-mono text-primary-container mb-3 text-[12px]">
                {legal.compliance.join(" · ")}
              </p>
            )}
            {section.paragraphs.map((p, i) => (
              <p key={i} className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-3">
                {section.heading === "Who we are"
                  ? p
                    .replace("registered in Nigeria", `(RC ${legal.rc_number}), ${legal.registered_address}`)
                  : p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
