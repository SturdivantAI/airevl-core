/**
 * Marketing Shell Layout
 * Top nav (logo + links + CTA) + footer. No console chrome.
 * All strings sourced from brand.json via lib/brand.ts.
 */

import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
      <MarketingNav />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
        <div className="px-6 md:px-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}
