/**
 * Academy sign-in page — magic link (or demo mode when Supabase is unconfigured).
 * Route: /training/signin
 */

import { SignInCard } from "@/components/academy/SignInCard";
import { academy } from "@/lib/academy/content";

import type { Metadata } from "next";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/training/signin"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function AcademySignInPage() {
  return (
    <div className="p-6 md:p-container-padding max-w-xl mx-auto py-16">
      <p className="font-label-caps text-label-caps text-primary-container mb-8">
        {academy.eyebrow}
      </p>
      <SignInCard />
    </div>
  );
}
