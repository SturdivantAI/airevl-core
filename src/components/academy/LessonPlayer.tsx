"use client";

/**
 * LessonPlayer — gated module view: objectives, lesson blocks, sandbox, quiz,
 * completion + next-module navigation. Redirects unauthenticated learners to
 * the sign-in card via a gate panel (no hard redirect, keeps back button sane).
 */

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { LessonBlocks } from "./LessonBlocks";
import { PromptSandbox } from "./PromptSandbox";
import { Quiz } from "./Quiz";
import { academy, getModule, getNextModule } from "@/lib/academy/content";
import { useAcademy } from "@/lib/academy/useAcademy";

export function LessonPlayer({ moduleId }: { moduleId: string }) {
  const { loading, user, completed, completeModule, recordQuiz } = useAcademy();
  const mod = getModule(moduleId);
  const next = getNextModule(moduleId);

  if (!mod) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Module not found.{" "}
          <Link href="/training/automation-101" className="text-primary-container">
            {academy.back_to_course}
          </Link>
        </p>
      </GlassPanel>
    );
  }

  if (loading) {
    return (
      <GlassPanel className="p-8">
        <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel active className="p-8 text-center">
        <span className="material-symbols-outlined text-primary-container text-[36px] mb-3">
          lock
        </span>
        <p className="font-body-md text-body-md text-on-surface mb-6">{academy.signin.title}</p>
        <Link href="/training/signin">
          <GlowButton variant="primary">{academy.course_cta}</GlowButton>
        </Link>
      </GlassPanel>
    );
  }

  const done = completed.includes(mod.id);

  return (
    <article>
      {/* Breadcrumb */}
      <Link
        href="/training/automation-101"
        className="inline-flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        {academy.back_to_course}
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-primary-container text-[28px]">
            {mod.icon}
          </span>
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            Module {mod.order} of 7 · {mod.minutes} min
          </p>
        </div>
        <h1 className="font-display-lg text-[32px] md:text-display-lg text-on-surface mb-2">
          {mod.title}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{mod.tagline}</p>
      </header>

      {/* Objectives */}
      <GlassPanel className="p-6 mb-10">
        <p className="font-label-caps text-label-caps text-primary-container mb-3">
          In this module you will
        </p>
        <ul className="space-y-2">
          {mod.objectives.map((obj, i) => (
            <li
              key={i}
              className="flex items-start gap-3 font-body-md text-[14px] text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-primary-container text-[16px] mt-0.5 shrink-0">
                target
              </span>
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>

      {/* Lesson */}
      <LessonBlocks blocks={mod.blocks} />

      {/* Hands-on sandbox */}
      {mod.sandbox && (
        <div className="mt-12">
          <PromptSandbox exercise={mod.sandbox} />
        </div>
      )}

      {/* Quiz */}
      <section className="mt-12">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[22px]">
            quiz
          </span>
          Knowledge check
        </h2>
        <Quiz
          questions={mod.quiz}
          onComplete={(score, total) => void recordQuiz(mod.id, score, total)}
        />
      </section>

      {/* Completion */}
      <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {done ? (
          <span className="inline-flex items-center gap-2 font-label-caps text-label-caps text-green-400">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {academy.module_completed}
          </span>
        ) : (
          <GlowButton variant="primary" onClick={() => void completeModule(mod.id)}>
            {academy.module_complete}
          </GlowButton>
        )}
        {done &&
          (next ? (
            <Link href={`/training/automation-101/${next.id}`}>
              <GlowButton variant="secondary">
                {academy.next_module}: {next.title}
              </GlowButton>
            </Link>
          ) : (
            <Link href="/training/automation-101/certificate">
              <GlowButton variant="secondary">{academy.certificate_cta}</GlowButton>
            </Link>
          ))}
      </div>
    </article>
  );
}
