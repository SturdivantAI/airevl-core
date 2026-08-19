/**
 * Automation 101 — course overview: progress, module list, certificate CTA.
 * Route: /training/automation-101
 */

import { CourseOverview } from "@/components/academy/CourseOverview";

import type { Metadata } from "next";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/training/automation-101"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function Automation101Page() {
  return (
    <div className="p-6 md:p-container-padding max-w-4xl mx-auto py-16">
      <CourseOverview />
    </div>
  );
}
