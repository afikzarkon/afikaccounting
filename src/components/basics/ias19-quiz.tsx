"use client";

import { CircleCheck, CircleHelp, CircleX, PencilLine } from "lucide-react";
import { stableOrder } from "@/lib/shuffle";
import { cn } from "@/lib/utils";
import type { QuizItem } from "./inventory-interactive";
import { TaskFrame } from "./ias19-question";
import { updateProgress, useProgress } from "./store";

const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו"];

/** Opens a group of questions inside a lesson page, so the switch from reading to answering is plain to see. */
function StopAndCheck({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[14px] font-bold text-accent-fg">
        <PencilLine className="h-4 w-4" aria-hidden /> עצרו ובדקו
      </span>
      <span className="text-[13.5px] text-muted">{count === 1 ? "שאלה אחת על מה שקראתם" : `${count} שאלות על מה שקראתם`}</span>
      <span className="h-px flex-1 bg-line" aria-hidden />
    </div>
  );
}

/**
 * The course's multiple-choice questions, each in a question frame of its own:
 * a numbered band, the question large, lettered options, and the explanation in
 * a box of its own once answered. Answers are saved under the same keys as
 * before (`ias19:chapter:n`), and the options keep their stable shuffle.
 * `inline`: the questions sit inside a lesson page, after the reading, rather
 * than on a self-check page of their own.
 */
export function IasQuiz({ chapter, items, inline, prefix = "ias19" }: { chapter: string; items: QuizItem[]; inline?: boolean; prefix?: string }) {
  const progress = useProgress();
  return (
    <div className="space-y-4">
      {inline && <StopAndCheck count={items.length} />}
      {items.map((it, i) => {
        const key = `${prefix}:${chapter}:${i + 1}`;
        const saved = progress.answers[key];
        const picked = saved ? Number(saved.value) : null;
        const right = picked !== null && picked === it.answer;
        const status =
          picked === null ? (
            <span className="text-[13px] text-muted">בחרו תשובה</span>
          ) : right ? (
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-success">
              <CircleCheck className="h-4 w-4" aria-hidden /> נכון
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-danger">
              <CircleX className="h-4 w-4" aria-hidden /> אפשר לנסות שוב
            </span>
          );
        return (
          <TaskFrame key={key} label={items.length > 1 ? `שאלה ${i + 1} מתוך ${items.length}` : "שאלה"} icon={<CircleHelp className="h-[18px] w-[18px]" aria-hidden />} status={status}>
            <fieldset>
              <legend className="text-[17px] font-semibold leading-relaxed text-fg">{it.q}</legend>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {stableOrder(`${key}:${it.q}`, it.options.length).map((j, pos) => {
                  const chosen = picked === j;
                  const good = chosen && j === it.answer;
                  return (
                    <button
                      key={j}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => updateProgress((p) => ({ ...p, answers: { ...p.answers, [key]: { value: String(j), correct: j === it.answer } } }))}
                      className={cn(
                        "flex min-h-12 items-start gap-3 rounded-xl border-2 px-3.5 py-2.5 text-start text-[15px] text-fg transition-colors",
                        chosen ? (good ? "border-success bg-success/10" : "border-danger bg-danger/10") : "border-line-strong bg-surface-2/40 hover:border-accent hover:bg-accent-soft",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[13px] font-bold",
                          chosen ? (good ? "border-success bg-success text-white" : "border-danger bg-danger text-white") : "border-accent/60 text-accent",
                        )}
                      >
                        {chosen ? (good ? "✓" : "✗") : LETTERS[pos]}
                      </span>
                      <span className="pt-0.5">{it.options[j]}</span>
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {picked !== null && (
                  <div className={cn("mt-4 rounded-xl border-s-4 px-4 py-3 text-[15px]", right ? "border-success bg-success/10" : "border-danger bg-danger/10")}>
                    <p className={cn("font-bold", right ? "text-success" : "text-danger")}>{right ? "נכון!" : "לא בדיוק."}</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed text-fg/90">{it.why}</p>
                  </div>
                )}
              </div>
            </fieldset>
          </TaskFrame>
        );
      })}
    </div>
  );
}
