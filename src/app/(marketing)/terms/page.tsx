/**
 * Terms of Use page — config-driven.
 * Route: /terms
 * All copy from config/pages.json via lib/pages.ts, with brand.json fact substitution.
 * Zero copy in JSX.
 */

import { termsPage } from "@/lib/pages";
import { legal, companyName, corporateEmail } from "@/lib/brand";

/** Replace placeholder tokens with brand.json facts */
function interpolate(text: string): string {
  return text
    .replace(/\{legal_name\}/g, legal.legal_name)
    .replace(/\{rc_number\}/g, legal.rc_number)
    .replace(/\{company_name\}/g, companyName)
    .replace(/\{corporate_email\}/g, corporateEmail);
}

export default function TermsPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      {/* DRAFT — counsel review required */}
      <div dangerouslySetInnerHTML={{ __html: "<!-- DRAFT — counsel review required -->" }} />

      <h1 className="font-display-lg text-display-lg text-on-surface mb-10">
        {termsPage.title}
      </h1>

      <div className="space-y-8 font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {termsPage.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
              {section.heading}
            </h2>
            <p>{interpolate(section.body)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
