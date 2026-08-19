/**
 * Automation 101 — lesson page (gated by AcademyProvider auth state).
 * Route: /training/automation-101/[moduleId]
 * Static params from the content module so all seven lessons prerender.
 */

import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/academy/LessonPlayer";
import { modules, getModule } from "@/lib/academy/content";

import type { Metadata } from "next";

export function generateStaticParams() {
  return modules.map((m) => ({ moduleId: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  return {
    title: mod ? `${mod.title} · Automation 101` : "Automation 101 · AiRevl Academy",
    description: mod?.tagline ?? "AiRevl Academy lesson.",
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  // Unknown lesson id → branded 404 with a real 404 status, not a soft 200 page.
  if (!getModule(moduleId)) notFound();
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      <LessonPlayer moduleId={moduleId} />
    </div>
  );
}
