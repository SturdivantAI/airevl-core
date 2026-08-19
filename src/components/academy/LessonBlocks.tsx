/**
 * LessonBlocks — renders the typed content blocks of a module.
 * Pure presentational; safe as a server or client child.
 */

import { GlassPanel } from "@/components/ui/GlassPanel";
import type { LessonBlock } from "@/lib/academy/content";

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <p
                key={i}
                className="font-body-md text-body-md text-on-surface-variant leading-relaxed"
              >
                {block.body}
              </p>
            );
          case "analogy":
            return (
              <GlassPanel key={i} className="p-6 border-l-2 border-l-primary-container/60">
                <p className="font-label-caps text-label-caps text-primary-container mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  {block.title}
                </p>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                  {block.body}
                </p>
              </GlassPanel>
            );
          case "tip":
            return (
              <div
                key={i}
                className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-4 flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-yellow-400 text-[18px] mt-0.5 shrink-0">
                  tips_and_updates
                </span>
                <p className="font-body-md text-[13.5px] text-on-surface-variant leading-relaxed">
                  {block.body}
                </p>
              </div>
            );
          case "example":
            return (
              <GlassPanel key={i} className="p-6">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-3">
                  {block.title}
                </p>
                <pre className="font-mono text-[12.5px] text-primary-container whitespace-pre-wrap leading-relaxed bg-black/30 rounded p-3 mb-3">
                  {block.prompt}
                </pre>
                <p className="font-body-md text-[13.5px] text-on-surface-variant leading-relaxed">
                  {block.output}
                </p>
              </GlassPanel>
            );
          case "keypoints":
            return (
              <GlassPanel key={i} className="p-6">
                <p className="font-label-caps text-label-caps text-primary-container mb-3">
                  {block.title}
                </p>
                <ul className="space-y-2">
                  {block.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 font-body-md text-[14px] text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-primary-container text-[16px] mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            );
        }
      })}
    </div>
  );
}
