"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { stableOrder } from "@/lib/shuffle";
import type { Trap } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { OptionMark, optionClass, promptClass } from "./choice";
import { Feedback } from "./journal-simulator";
import { WorkedSolution } from "@/components/study/worked";

const LETTERS = "אבגדהו";

/** A multiple-choice question of the practice that explains each wrong option. The first choice counts: the right option lights green, a wrong one red; then why the answer is right, and every option with where it comes from. */
export function TrapQuiz({ trap, answered, onAnswer }: { trap: Trap; answered?: { choice: number; correct: boolean }; onAnswer: (choice: number) => void }) {
  const name = useId();
  const order = stableOrder(`${trap.id}:${trap.prompt}`, trap.options.length);
  return (
    <div className="space-y-5">
      <fieldset disabled={!!answered}>
        <legend className={promptClass}>{trap.prompt}</legend>
        <div className="mt-5 grid gap-2.5">
          {order.map((i, k) => {
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
                <OptionMark state={state} letter={LETTERS[k]} />
                <span className="min-w-0">{o}</span>
              </motion.label>
            );
          })}
        </div>
      </fieldset>
      {answered && (
        <div className="space-y-3">
          <Feedback ok={answered.correct} title={answered.correct ? "נכון, ולא נפלתם." : "נפלתם במלכודת."} />
          <WorkedSolution
            w={{
              light: true,
              steps: [
                { h: "למה התשובה הנכונה נכונה", p: [trap.why] },
                {
                  h: "כל האפשרויות",
                  opts: order.map((i, k) => ({ mark: LETTERS[k], t: trap.options[i], ok: i === trap.answer, chosen: i === answered.choice && !answered.correct, r: trap.traps[i] || undefined })),
                },
              ],
            }}
          />
        </div>
      )}
    </div>
  );
}
