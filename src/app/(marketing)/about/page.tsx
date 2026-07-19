/**
 * About stub page — real copy comes in Wave 2D.
 * Route: /about
 * All strings from brand.json via lib/brand.ts.
 */

import { stubs } from "@/lib/brand";

export default function AboutPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-4">
        {stubs.about.title}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {stubs.about.body}
      </p>
    </div>
  );
}
