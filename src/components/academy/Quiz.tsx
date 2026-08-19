"use client";

/**
 * Quiz — module knowledge check.
 * Select answers → "Check answers" reveals correct/incorrect with explanations.
 * Retake freely. Score reported to onComplete once per check.
 * All labels from lib/academy/content (zero copy in JSX).
 */

import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { academy, type QuizQuestion } from "@/lib/academy/content";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    questions.map(() => null)
  );
  const [checked, setChecked] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
    0
  );

  function handleCheck() {
    setChecked(true);
    onComplete?.(score, questions.length);
  }

  function handleRetry() {
    setAnswers(questions.map(() => null));
    setChecked(false);
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <GlassPanel key={qi} className="p-6">
          <p className="font-body-md text-body-md text-on-surface mb-4">
            <span className="text-primary-container mr-2">{qi + 1}.</span>
            {q.q}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = checked && oi === q.answer;
              const isWrongPick = checked && selected && oi !== q.answer;
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={checked}
                  onClick={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qi] = oi;
                      return next;
                    })
                  }
                  aria-pressed={selected}
                  className={`w-full text-left px-4 py-2.5 rounded border font-body-md text-[14px] transition-all ${
                    isCorrect
                      ? "border-green-400/60 bg-green-400/10 text-on-surface"
                      : isWrongPick
                        ? "border-red-400/60 bg-red-400/10 text-on-surface"
                        : selected
                          ? "border-primary-container/70 bg-primary-container/10 text-on-surface"
                          : "border-white/10 text-on-surface-variant hover:border-white/25"
                  } ${checked ? "cursor-default" : "cursor-pointer"}`}
                >
                  {opt}
                  {isCorrect && (
                    <span className="material-symbols-outlined text-[16px] text-green-400 ml-2 align-middle">
                      check_circle
                    </span>
                  )}
                  {isWrongPick && (
                    <span className="material-symbols-outlined text-[16px] text-red-400 ml-2 align-middle">
                      cancel
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {checked && (
            <p className="mt-3 font-body-md text-[13px] text-on-surface-variant leading-relaxed border-l-2 border-primary-container/50 pl-3">
              {q.explain}
            </p>
          )}
        </GlassPanel>
      ))}

      <div className="flex items-center gap-4">
        {!checked ? (
          <GlowButton
            variant="primary"
            disabled={!allAnswered}
            onClick={handleCheck}
            className={!allAnswered ? "opacity-40 cursor-not-allowed" : ""}
          >
            {academy.quiz_check}
          </GlowButton>
        ) : (
          <>
            <span className="font-label-caps text-label-caps text-primary-container">
              {score}/{questions.length}
            </span>
            <GlowButton variant="secondary" onClick={handleRetry}>
              {academy.quiz_retry}
            </GlowButton>
          </>
        )}
      </div>
    </div>
  );
}
