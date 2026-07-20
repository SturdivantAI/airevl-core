/**
 * Corporate Training Catalog (Screen 2)
 * Route: /training
 * Data-driven grid from Supabase
 * Active/pending card states per EARS MS-03
 */

import type { Metadata } from "next";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { supabase } from "@/lib/supabase";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/training"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export const dynamic = "force-dynamic"; // render on demand, not at build time

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  progress: number;
  status: "active" | "pending";
  section_id: string;
}

interface Section {
  id: string;
  title: string;
  courses: Course[];
}

async function getData(): Promise<Section[]> {
  const [sectionsRes, coursesRes] = await Promise.all([
    supabase.from("training_sections").select("*"),
    supabase.from("training_courses").select("*"),
  ]);
  const sections = sectionsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  return sections.map((s: { id: string; title: string }) => ({
    ...s,
    courses: courses.filter((c: Course) => c.section_id === s.id),
  }));
}

export default async function TrainingCatalog() {
  const sections = await getData();

  return (
    <div className="p-container-padding">
      {/* Page header */}
      <header className="mb-section-gap">
        <h2 className="font-display-lg text-display-lg text-on-surface mb-2">
          Corporate Training Catalog
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Access elite cognitive conditioning protocols. Ensure optimal operational synergy across all neural nodes.
        </p>
      </header>

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} className="mb-section-gap">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <h3 className="font-headline-lg text-headline-lg text-primary-container">
              {section.title}
            </h3>
            <button className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container transition-colors flex items-center">
              View All
              <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {section.courses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                isRecommended={idx === section.courses.length - 1 && course.progress === 0 && course.status === "active"}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CourseCard({ course, isRecommended }: { course: Course; isRecommended: boolean }) {
  const isPending = course.status === "pending";

  return (
    <article
      className={`glass-panel rounded-xl p-8 flex flex-col h-full group transition-colors ${
        isPending
          ? "opacity-50 pointer-events-none border-dashed"
          : "hover:border-primary-container/30"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 group-hover:border-primary-container/50 transition-colors">
          <span
            className="material-symbols-outlined text-primary-container text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {course.icon}
          </span>
        </div>
        <span className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps px-2 py-1 rounded border border-white/5">
          {isPending ? "Coming Soon" : course.difficulty}
        </span>
      </div>

      {/* Content */}
      <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
        {course.title}
      </h4>
      <p className="font-body-md text-body-md text-on-surface-variant mb-8 flex-1">
        {course.description}
      </p>

      {/* Progress */}
      {!isPending && (
        <div className="mb-6">
          <div className="flex justify-between font-data-mono text-data-mono text-on-surface-variant mb-2">
            <span>Progress</span>
            <span className="text-primary-fixed-dim">{course.progress}%</span>
          </div>
          <div className="h-1 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      {!isPending && (
        <GlowButton
          variant={isRecommended ? "primary" : "secondary"}
          className="w-full py-3"
        >
          Initialize Learning
        </GlowButton>
      )}

      {isPending && (
        <div className="mt-auto py-3 text-center font-label-caps text-label-caps text-on-surface-variant/50 border border-white/10 rounded">
          Pending Activation
        </div>
      )}
    </article>
  );
}
