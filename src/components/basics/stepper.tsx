"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Step = { title: ReactNode; body: ReactNode };
/** How a step went, for exercises: shown on its segment in the progress bar. */
export type StepMark = "ok" | "bad" | undefined;

/**
 * One step at a time: "לצעד הקודם" and "לצעד הבא" in a header that stays pinned while the step scrolls, an "n / N" counter, a segmented
 * progress bar that also jumps to a step, and the arrow keys while focus is
 * inside (right-to-left, so ← is next). Only the current step is mounted, so
 * its entrance animation plays on every move.
 */
export function Stepper({
  steps,
  label,
  marks,
  className,
  step: controlled,
  onStep,
}: {
  steps: Step[];
  label: string;
  marks?: StepMark[];
  className?: string;
  step?: number;
  onStep?: (i: number) => void;
}) {
  const [own, setOwn] = useState(0);
  const i = Math.min(controlled ?? own, steps.length - 1);
  const box = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  const go = (to: number) => {
    const next = Math.max(0, Math.min(last, to));
    if (next === i) return;
    setOwn(next);
    onStep?.(next);
    // The header stays pinned, so the buttons never move. Only when the reader has scrolled past the step's start
    // (the header is pinned below the walkthrough's own top) does the new step scroll back to its start.
    const section = box.current?.getBoundingClientRect();
    const header = head.current?.getBoundingClientRect();
    if (section && header && header.top - section.top > 1) box.current!.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, select, textarea, [contenteditable]")) return;
    // At either end the key is left alone, so it carries on to the lesson: past the last step, on to the next screen.
    if (e.key === "ArrowLeft" && i < last) go(i + 1);
    else if (e.key === "ArrowRight" && i > 0) go(i - 1);
    else return;
    e.preventDefault();
  };

  // One set of buttons, in the pinned header beside the progress bar. They move inside this walkthrough only, so
  // they are worded and coloured apart from the lesson's own solid "הבא" — an outline, and "לצעד הבא".
  const nav = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => go(i - 1)}
        disabled={i === 0}
        className="inline-flex h-9 items-center gap-1 rounded-lg bg-surface px-3 text-sm font-medium text-fg ring-1 ring-line-strong transition-colors hover:bg-surface-2 disabled:opacity-35"
      >
        <ChevronRight className="h-4 w-4" aria-hidden /> לצעד הקודם
      </button>
      <span className="mx-auto hidden text-[11px] text-subtle sm:inline">אפשר גם עם החיצים במקלדת</span>
      {i < last ? (
        <button
          type="button"
          onClick={() => go(i + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-accent-soft px-4 text-sm font-semibold text-accent ring-1 ring-accent/50 transition hover:ring-accent active:scale-95 max-sm:ms-auto"
        >
          לצעד הבא <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => go(0)}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-surface px-3 text-sm font-medium text-accent ring-1 ring-accent/40 hover:bg-accent-soft max-sm:ms-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> מההתחלה
        </button>
      )}
    </div>
  );

  return (
    // overflow-clip, not hidden: a hidden overflow would make the section a scroll box, and the header could not stay pinned.
    <section ref={box} aria-label={label} aria-roledescription="צעד אחר צעד" onKeyDown={onKey} className={cn("card overflow-clip [column-span:all]", className)}>
      <div ref={head} className="sticky top-0 z-10 space-y-2.5 border-b border-line bg-surface-2 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">{label}</p>
          <p className="num shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-fg ring-1 ring-line" aria-hidden>
            {i + 1} / {steps.length}
          </p>
        </div>
        <ol className="flex gap-1" aria-label="התקדמות">
          {steps.map((_, k) => (
            <li key={k} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => go(k)}
                aria-label={`צעד ${k + 1}`}
                aria-current={k === i ? "step" : undefined}
                className="group block w-full py-1.5"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-colors",
                    marks?.[k] === "ok" ? "bg-success" : marks?.[k] === "bad" ? "bg-danger" : k <= i ? "bg-accent" : "bg-line-strong group-hover:bg-subtle",
                    k === i && "ring-2 ring-accent/30",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
        {nav}
      </div>
      <div key={i} className="anim-step-in space-y-3 p-3 sm:p-4" aria-live="polite">
        <h4 className="text-[16px] font-semibold leading-snug text-fg">
          <span className="sr-only">
            צעד {i + 1} מתוך {steps.length}:{" "}
          </span>
          {steps[i].title}
        </h4>
        <div className="space-y-3 text-[15px] leading-relaxed text-fg/90">{steps[i].body}</div>
      </div>
    </section>
  );
}
