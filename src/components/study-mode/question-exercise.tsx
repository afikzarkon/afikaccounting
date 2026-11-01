"use client";

import { useId, useState } from "react";
import { Money } from "@/components/basics/ui";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { type ExResult, numberRight, triesFor, XP } from "@/lib/study/score";
import type { QuestionExercise } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { BalanceGapBoard } from "./balance-gap";
import { OptionMark, optionClass, promptClass } from "./choice";
import { Feedback, Gain } from "./journal-simulator";
import { typedAmount } from "@/lib/amount";
import { stableOrder, stableShuffle } from "@/lib/shuffle";

type Question = QuestionExercise;

/**
 * Practice: a question with one right answer — a choice, a number, or the
 * debit and credit accounts of an entry. Wrong tries are marked; when the
 * question is done, the right answer and the worked solution are shown.
 */
export function QuestionExercise({ q, result, onCheck }: { q: Question; result?: ExResult; onCheck: (ok: boolean) => void }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [dr, setDr] = useState("");
  const [cr, setCr] = useState("");
  // Wrong choices picked on this visit, to mark them; the store keeps only the outcome.
  const [missed, setMissed] = useState<number[]>([]);
  const done = !!result?.done;
  const left = triesFor(q) - (result?.tries ?? 0);

  const pick = (i: number) => {
    if (q.kind !== "choice" || done || missed.includes(i)) return;
    if (i !== q.answer) setMissed([...missed, i]);
    onCheck(i === q.answer);
  };
  const check = () => {
    if (q.kind === "number") onCheck(numberRight(q.answer, value));
    if (q.kind === "entry") onCheck(dr === q.dr && cr === q.cr);
  };
  const canCheck = q.kind === "number" ? value.trim() !== "" : dr !== "" && cr !== "";

  return (
    <div className="space-y-5">
      <p id={`${id}-q`} className={promptClass}>
        {q.prompt}
      </p>

      {q.kind === "choice" && (
        <div role="radiogroup" aria-labelledby={`${id}-q`} className="grid gap-2.5">
          {stableOrder(`${q.id}:${q.prompt}`, q.options.length).map((i, k) => {
            const o = q.options[i];
            const right = done && i === q.answer;
            const wrong = missed.includes(i);
            const state = right ? "right" : wrong ? "wrong" : done ? "past" : "open";
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={right || wrong}
                aria-disabled={done || wrong}
                onClick={() => pick(i)}
                className={optionClass(state)}
              >
                <OptionMark state={state} letter={"אבגדהו"[k]} />
                <span className="min-w-0">{o}</span>
              </button>
            );
          })}
        </div>
      )}

      {q.kind === "number" && q.table && <BalanceGapBoard gap={q.table} answer={q.answer} done={done} onCheck={onCheck} />}

      {q.kind === "number" && !q.table && !done && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-[12.5px] text-muted">
            התשובה בשקלים
            <input
              dir="ltr"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(typedAmount(e))}
              onKeyDown={(e) => e.key === "Enter" && canCheck && check()}
              aria-describedby={`${id}-q`}
              className={cn(inputClass, "num mt-1 text-start")}
            />
          </label>
          <Button onClick={check} disabled={!canCheck}>
            בדיקה
          </Button>
        </div>
      )}

      {q.kind === "entry" && !done && (
        <div className="flex flex-wrap items-end gap-2">
          {(
            [
              ["ח׳ — חובה (מקבל)", dr, setDr],
              ["ז׳ — זכות (נותן)", cr, setCr],
            ] as const
          ).map(([label, v, set]) => (
            <label key={label} className="min-w-[9rem] flex-1 text-[12.5px] text-muted">
              {label}
              <select value={v} onChange={(e) => set(e.target.value)} className={cn(inputClass, "mt-1")}>
                <option value="">בחרו חשבון</option>
                {stableShuffle(`${q.id}:${q.prompt}`, q.accounts).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <Button onClick={check} disabled={!canCheck}>
            בדיקה
          </Button>
        </div>
      )}

      {result && !done && <Feedback key={result.tries} ok={false} title={`לא נכון — נסו שוב (נותר ניסיון ${left})`} />}

      {done && (
        <>
          <Feedback ok={result!.ok} title={result!.ok ? <Gain xp={result!.tries === 1 ? XP.first : XP.second} /> : "הנה הפתרון"} />
          <div className="rounded-2xl bg-surface-2/70 p-4 text-[15px] leading-relaxed text-fg ring-1 ring-line sm:p-5">
            <p className="mb-2.5 text-[12.5px] font-bold text-muted">הפתרון, שלב אחר שלב</p>
            <ol className="space-y-2">
              {q.steps.map((s, i) => (
                <li key={s} className="flex gap-2.5">
                  <span className="num mt-0.5 grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11.5px] font-bold text-accent">{i + 1}</span>
                  <span className="min-w-0">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-line pt-3 font-semibold">
              התשובה:{" "}
              {q.kind === "choice" ? q.options[q.answer] : q.kind === "number" ? <Money v={q.answer} /> : `ח׳ ${q.dr} / ז׳ ${q.cr}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
