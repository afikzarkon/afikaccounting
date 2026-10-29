"use client";

import { Check, TriangleAlert, X } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";
import { XP } from "@/lib/study/score";
import type { Trap } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { Feedback, Gain } from "./journal-simulator";

/** Step 3: one exam trap. The first choice counts: the right option lights green, a wrong one red with why it tempts. */
export function TrapQuiz({ trap, answered, onAnswer }: { trap: Trap; answered?: { choice: number; correct: boolean }; onAnswer: (choice: number) => void }) {
  const name = useId();
  return (
    <div className="space-y-4">
      <fieldset disabled={!!answered}>
        <legend className="flex gap-2 text-[16.5px] font-semibold leading-relaxed text-fg">
          <TriangleAlert className="mt-1 h-5 w-5 shrink-0 text-[#eda100]" aria-hidden />
          {trap.prompt}
        </legend>
        <div className="mt-4 grid gap-2">
          {trap.options.map((o, i) => {
            const right = answered && i === trap.answer;
            const chosenWrong = answered && i === answered.choice && !answered.correct;
            return (
              <motion.label
                key={o}
                animate={right && answered.correct ? { scale: [1, 1.03, 1] } : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-[15px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]",
                  !answered && "border-line bg-surface hover:border-accent/50 hover:bg-accent-soft/40",
                  right && "border-success bg-success/10 font-semibold text-fg",
                  chosenWrong && "border-danger bg-danger/10 text-fg",
                  answered && !right && !chosenWrong && "border-line bg-surface opacity-60",
                  answered && "cursor-default",
                )}
              >
                <input type="radio" name={name} value={i} checked={answered?.choice === i} onChange={() => onAnswer(i)} className="sr-only" />
                <span
                  className={cn(
                    "num grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] font-bold",
                    right ? "border-success bg-success text-white" : chosenWrong ? "border-danger bg-danger text-white" : "border-line-strong text-muted",
                  )}
                >
                  {right ? <Check className="h-4 w-4" /> : chosenWrong ? <X className="h-4 w-4" /> : "אבגד"[i]}
                </span>
                <span className="min-w-0">{o}</span>
              </motion.label>
            );
          })}
        </div>
      </fieldset>
      {answered &&
        (answered.correct ? (
          <Feedback ok title={<Gain xp={XP.trap} />} text={trap.why} />
        ) : (
          <div className="space-y-2">
            <Feedback ok={false} title="נפלתם במלכודת" text={trap.traps[answered.choice]} />
            <p className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] leading-relaxed text-fg/90">
              <span className="font-bold text-success">התשובה הנכונה: </span>
              {trap.why}
            </p>
          </div>
        ))}
    </div>
  );
}
