"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { stableOrder } from "@/lib/shuffle";
import { XP } from "@/lib/study/score";
import type { Trap } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { OptionMark, optionClass, promptClass } from "./choice";
import { Feedback, Gain } from "./journal-simulator";

/** A multiple-choice question of the practice that explains each wrong option. The first choice counts: the right option lights green, a wrong one red with why it tempts. */
export function TrapQuiz({ trap, answered, onAnswer }: { trap: Trap; answered?: { choice: number; correct: boolean }; onAnswer: (choice: number) => void }) {
  const name = useId();
  return (
    <div className="space-y-5">
      <fieldset disabled={!!answered}>
        <legend className={promptClass}>{trap.prompt}</legend>
        <div className="mt-5 grid gap-2.5">
          {stableOrder(`${trap.id}:${trap.prompt}`, trap.options.length).map((i, k) => {
            const o = trap.options[i];
            const right = answered && i === trap.answer;
            const chosenWrong = answered && i === answered.choice && !answered.correct;
            const state = right ? "right" : chosenWrong ? "wrong" : answered ? "past" : "open";
            return (
              <motion.label
                key={o}
                animate={right && answered.correct ? { scale: [1, 1.03, 1] } : undefined}
                className={cn(optionClass(state), "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]")}
              >
                <input type="radio" name={name} value={i} checked={answered?.choice === i} onChange={() => onAnswer(i)} className="sr-only" />
                <OptionMark state={state} letter={"אבגדהו"[k]} />
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
            <Feedback ok={false} title="נפלתם במלכודת. ככה היא עובדת:" text={trap.traps[answered.choice]} />
            <p className="whitespace-pre-line rounded-2xl bg-surface-2/70 px-4 py-3.5 text-[15px] leading-relaxed text-fg/90 ring-1 ring-line">
              <span className="font-bold text-success">התשובה הנכונה: </span>
              {trap.why}
            </p>
          </div>
        ))}
    </div>
  );
}
