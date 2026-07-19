/**
 * Contact stub page — real copy comes in Wave 2D.
 * Route: /contact
 * All strings from brand.json via lib/brand.ts.
 */

import { stubs, corporateEmail } from "@/lib/brand";

export default function ContactPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-4">
        {stubs.contact.title}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
        {stubs.contact.body}
      </p>
      <a
        href={`mailto:${corporateEmail}`}
        className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container hover:text-primary transition-colors"
      >
        {corporateEmail}
      </a>
    </div>
  );
}
