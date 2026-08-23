/**
 * Automation 101 — certificate page. Issues on first visit after completion.
 * Route: /training/automation-101/certificate
 */

import { CertificateView } from "@/components/academy/CertificateView";

import type { Metadata } from "next";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/training/automation-101/certificate"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function CertificatePage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      <CertificateView />
    </div>
  );
}
