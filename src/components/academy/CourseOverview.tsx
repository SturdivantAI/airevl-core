"use client";

/**
 * CourseOverview — Automation 101 landing: progress bar, sequential module
 * cards (Coursera-style unlock), certificate CTA when complete.
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { academy, course, modules } from "@/lib/academy/content";
import { useAcademy } from "@/lib/academy/useAcademy";

export function CourseOverview() {
  const { loading, user, completed, courseComplete, demoMode } = useAcademy();

  const doneCount = modules.filter((m) => completed.includes(m.id)).length;
  const pct = Math.round((doneCount / modules.length) * 100);

  return (
    <div>
      {/* Header */}
      <header className="mb-10">
        <p className="font-label-caps text-label-caps text-primary-container mb-3">
          {academy.eyebrow}
        </p>
        <h1 className="font-display-lg text-display-lg text-on-surface mb-3">{course.title}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          {course.subtitle}
        </p>
      </header>

      {/* Auth / progress strip */}
      {!loading && !user && (
        <GlassPanel active className="p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-body-md text-body-md text-on-surface">{academy.signin.title}</p>
          <Link href="/training/signin">
            <GlowButton variant="primary">{academy.course_cta}</GlowButton>
          </Link>
        </GlassPanel>
      )}

      {!loading && user && (
        <GlassPanel className="p-6 mb-10">
          <div className="flex items-center justify-between mb-2">
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              {academy.progress_label}
            </p>
            <p className="font-label-caps text-label-caps text-primary-container">
              {doneCount}/{modules.length} · {pct}%
            </p>
          </div>
          <div
            className="h-2 rounded-full bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary-container transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {demoMode && (
            <p className="mt-3 font-body-md text-[12px] text-yellow-400/80">
              {academy.signin.demo_note}
            </p>
          )}
          {courseComplete && (
            <div className="mt-4">
              <Link href="/training/automation-101/certificate">
                <GlowButton variant="primary">{academy.certificate_cta}</GlowButton>
              </Link>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Module list — sequential unlock */}
      <div className="space-y-4">
        {modules.map((m, i) => {
          const done = completed.includes(m.id);
          const unlocked =
            i === 0 || completed.includes(modules[i - 1].id) || done;
          const card = (
            <GlassPanel
              hoverable={unlocked}
              className={`p-6 flex items-start gap-4 ${unlocked ? "" : "opacity-50"}`}
            >
              <span
                className={`material-symbols-outlined text-[24px] mt-1 shrink-0 ${
                  done
                    ? "text-green-400"
                    : unlocked
                      ? "text-primary-container"
                      : "text-on-surface-variant"
                }`}
              >
                {done ? "check_circle" : unlocked ? m.icon : "lock"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-headline-lg text-[17px] text-on-surface">
                    {m.order}. {m.title}
                  </h2>
                  <span className="font-label-caps text-[10px] text-on-surface-variant shrink-0 uppercase tracking-wider">
                    {m.minutes} min
                  </span>
                </div>
                <p className="font-body-md text-[13.5px] text-on-surface-variant mt-1">
                  {m.tagline}
                </p>
              </div>
            </GlassPanel>
          );
          return unlocked && user ? (
            <Link key={m.id} href={`/training/automation-101/${m.id}`} className="block">
              {card}
            </Link>
          ) : unlocked && !user && !loading ? (
            <Link key={m.id} href="/training/signin" className="block">
              {card}
            </Link>
          ) : (
            <div key={m.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
