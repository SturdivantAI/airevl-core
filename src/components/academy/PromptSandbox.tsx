"use client";

/**
 * PromptSandbox — DataCamp-style hands-on exercise, fully simulated.
 * The learner writes a prompt; a keyword rubric scores it; a pre-scripted
 * "AI response" (pass/partial/fail) plus a feedback checklist teach the gap.
 * No live model call: zero cost, zero injection surface on the free tier.
 */

import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import type { SandboxExercise } from "@/lib/academy/content";

interface PromptSandboxProps {
  exercise: SandboxExercise;
  onPass?: () => void;
}

interface RunResult {
  hits: string[]; // rubric item ids satisfied
  level: "pass" | "partial" | "fail";
  response: string;
}

function evaluate(exercise: SandboxExercise, prompt: string): RunResult {
  const text = prompt.toLowerCase();
  const hits = exercise.rubric
    .filter((item) => item.keywords.some((k) => text.includes(k.toLowerCase())))
    .map((item) => item.id);

  let level: RunResult["level"];
  if (hits.length >= exercise.passThreshold) level = "pass";
  else if (hits.length <= 1) level = "fail";
  else level = "partial";

  return { hits, level, response: exercise.responses[level] };
}

export function PromptSandbox({ exercise, onPass }: PromptSandboxProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  function run() {
    const r = evaluate(exercise, prompt);
    setResult(r);
    setAttempts((a) => a + 1);
    if (r.level === "pass") onPass?.();
  }

  return (
    <GlassPanel active className="p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary-container text-[20px]">
          terminal
        </span>
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          {exercise.title}
        </h3>
      </div>

      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-3">
        {exercise.scenario}
      </p>
      <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-5">
        {exercise.task}
      </p>

      <label className="sr-only" htmlFor={`sandbox-${exercise.title}`}>
        {exercise.title}
      </label>
      <textarea
        id={`sandbox-${exercise.title}`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={exercise.placeholder}
        rows={5}
        className="w-full bg-black/40 border border-white/15 rounded-lg p-4 font-mono text-[13px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container/70 focus:outline-none resize-y"
      />

      <div className="mt-4 flex items-center gap-3">
        <GlowButton
          variant="primary"
          onClick={run}
          disabled={prompt.trim().length === 0}
          className={prompt.trim().length === 0 ? "opacity-40 cursor-not-allowed" : ""}
        >
          Run prompt
        </GlowButton>
        {attempts >= 2 && !showSolution && (
          <GlowButton variant="secondary" onClick={() => setShowSolution(true)}>
            Show example solution
          </GlowButton>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Simulated AI response */}
          <div
            className={`rounded-lg border p-4 ${
              result.level === "pass"
                ? "border-green-400/40 bg-green-400/5"
                : result.level === "partial"
                  ? "border-yellow-400/40 bg-yellow-400/5"
                  : "border-red-400/40 bg-red-400/5"
            }`}
          >
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              Simulated AI response
            </p>
            <pre className="font-mono text-[12.5px] text-on-surface whitespace-pre-wrap leading-relaxed">
              {result.response}
            </pre>
          </div>

          {/* Rubric checklist */}
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
              Prompt checklist
            </p>
            <ul className="space-y-1.5">
              {exercise.rubric.map((item) => {
                const hit = result.hits.includes(item.id);
                return (
                  <li key={item.id} className="flex items-start gap-2 font-body-md text-[13px]">
                    <span
                      className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                        hit ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {hit ? "check_circle" : "cancel"}
                    </span>
                    <span className="text-on-surface-variant">
                      {item.label}
                      {!hit && <span className="block text-on-surface/80">{item.feedback}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {showSolution && (
        <div className="mt-5 rounded-lg border border-primary-container/40 bg-primary-container/5 p-4">
          <p className="font-label-caps text-label-caps text-primary-container mb-2">
            Example solution
          </p>
          <pre className="font-mono text-[12.5px] text-on-surface whitespace-pre-wrap leading-relaxed">
            {exercise.exampleSolution}
          </pre>
        </div>
      )}
    </GlassPanel>
  );
}
