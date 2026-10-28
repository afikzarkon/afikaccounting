"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Step = { title: ReactNode; body: ReactNode };
/** How a step went, for exercises: shown on its segment in the progress bar. */
export type StepMark = "ok" | "bad" | undefined;

/**
 * One step at a time: "הקודם" and "הבא", an "n / N" counter, a segmented
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
  const top = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;

  const go = (to: number, fromBottom = false) => {
    const next = Math.max(0, Math.min(last, to));
    if (next === i) return;
    setOwn(next);
    onStep?.(next);
    // Moving from the bottom buttons of a tall step: bring the new step's top back into view.
    if (fromBottom && top.current && top.current.getBoundingClientRect().top < 72) top.current.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, select, textarea, [contenteditable]")) return;
    if (e.key === "ArrowLeft") go(i + 1);
    else if (e.key === "ArrowRight") go(i - 1);
    else return;
    e.preventDefault();
  };

  const nav = (bottom: boolean) => (
    <div className={cn("flex items-center gap-2", bottom ? "border-t border-line bg-surface-2/40 px-3 py-2.5 sm:px-4" : "")}>
      <button
        type="button"
        onClick={() => go(i - 1, bottom)}
        disabled={i === 0}
        className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-fg ring-1 ring-line-strong transition-colors hover:bg-surface-2 disabled:opacity-35"
      >
        <ChevronRight className="h-4 w-4" aria-hidden /> הקודם
      </button>
      {bottom && <span className="mx-auto hidden text-[11px] text-subtle sm:inline">אפשר גם עם החיצים במקלדת</span>}
      {i < last ? (
        <button
          type="button"
          onClick={() => go(i + 1, bottom)}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg shadow-[0_6px_16px_-8px_var(--accent)] transition-transform active:scale-95",
            !bottom && "ms-auto",
            bottom && "max-sm:ms-auto",
          )}
        >
          הבא <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => go(0, bottom)}
          className={cn("inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-accent ring-1 ring-accent/40 hover:bg-accent-soft", !bottom && "ms-auto", bottom && "max-sm:ms-auto")}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> מההתחלה
        </button>
      )}
    </div>
  );

  return (
    <section aria-label={label} aria-roledescription="צעד אחר צעד" onKeyDown={onKey} className={cn("card overflow-hidden", className)}>
      <div ref={top} className="scroll-mt-36 space-y-2.5 border-b border-line bg-surface-2/50 px-3 py-3 sm:px-4">
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
        {nav(false)}
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
      {nav(true)}
    </section>
  );
}
