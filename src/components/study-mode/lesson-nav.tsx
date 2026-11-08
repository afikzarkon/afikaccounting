"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { label: string; onClick: () => void };

/** "שאלה 10 · שאלות אמריקאיות" → the place ("שאלה 10") in bold, its kind on the small line, so a phone never cuts it off. */
const split = (label: string) => {
  const i = label.indexOf(" · ");
  return i < 0 ? { main: label, kind: "" } : { main: label.slice(0, i), kind: label.slice(i + 3) };
};

/**
 * "Previous" and "next" at the foot of the lesson, each naming where it goes —
 * a concept, the move into practice, a question, the summary — with the place
 * in the lesson between them. It stays in view at the bottom of the screen.
 * Right to left: previous sits on the right.
 */
export function LessonNav({ prev, next, position, className }: { prev?: Step; next?: Step; position?: string; className?: string }) {
  return (
    <nav
      aria-label="מעבר בשיעור"
      className={cn(
        className,
        "no-print sticky bottom-0 z-20 -mx-4 border-t border-line bg-canvas/90 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:bottom-4 sm:mx-auto sm:w-full sm:max-w-[44rem] sm:rounded-full sm:border sm:bg-surface/85 sm:p-1.5 sm:shadow-[0_18px_40px_-20px_rgb(0_0_0/0.45)]",
      )}
    >
      <div className="flex items-center gap-2">
        {prev ? (
          <button
            type="button"
            onClick={prev.onClick}
            className="flex max-w-[45%] min-w-0 items-center gap-1.5 rounded-xl px-3 py-2 text-start transition-colors hover:bg-surface-2 sm:rounded-full sm:ps-2 sm:pe-4"
          >
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-[11px] text-muted">הקודם{split(prev.label).kind && ` · ${split(prev.label).kind}`}</span>
              <span className="block truncate text-[13.5px] font-semibold text-fg" title={prev.label}>
                {split(prev.label).main}
              </span>
            </span>
          </button>
        ) : (
          <span className="flex-1" />
        )}
        <span className="hidden flex-1 flex-col items-center text-center lg:flex" title="מקלדת: ← הבא · → הקודם">
          {position && <span className="num text-[12px] font-semibold text-muted">{position}</span>}
        </span>
        {next && (
          <button
            type="button"
            onClick={next.onClick}
            className={cn(
              "ms-auto flex min-w-0 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-end text-accent-fg shadow-[0_10px_24px_-12px_var(--accent)] transition hover:brightness-110 active:scale-[0.98] sm:rounded-full sm:ps-5 sm:pe-3",
              prev ? "max-w-[55%] flex-1 sm:flex-none" : "flex-1 sm:flex-none",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] opacity-80">הבא{split(next.label).kind && ` · ${split(next.label).kind}`}</span>
              <span className="block truncate text-[14px] font-bold" title={next.label}>
                {split(next.label).main}
              </span>
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-fg/15">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
