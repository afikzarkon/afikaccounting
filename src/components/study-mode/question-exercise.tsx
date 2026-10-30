"use client";

import { Check, X } from "lucide-react";
import { useId, useState } from "react";
import { Money } from "@/components/basics/ui";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { type ExResult, numberRight, triesFor, XP } from "@/lib/study/score";
import type { QuestionExercise } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { BalanceGapBoard } from "./balance-gap";
import { Feedback, Gain } from "./journal-simulator";
import { typedAmount } from "@/lib/amount";

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
    <div className="space-y-4">
      <p id={`${id}-q`} className="text-[16.5px] font-semibold leading-relaxed text-fg">
        {q.prompt}
      </p>

      {q.kind === "choice" && (
        <div role="radiogroup" aria-labelledby={`${id}-q`} className="grid gap-2">
          {q.options.map((o, i) => {
            const right = done && i === q.answer;
            const wrong = missed.includes(i);
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={right || wrong}
                aria-disabled={done || wrong}
                onClick={() => pick(i)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-start text-[15px] transition-colors",
                  right ? "border-success bg-success/10 font-semibold" : wrong ? "border-danger bg-danger/10" : done ? "border-line opacity-60" : "border-line bg-surface hover:border-accent/50 hover:bg-accent-soft/40",
                  (done || wrong) && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "num grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] font-bold",
                    right ? "border-success bg-success text-white" : wrong ? "border-danger bg-danger text-white" : "border-line-strong text-muted",
                  )}
                >
                  {right ? <Check className="h-4 w-4" /> : wrong ? <X className="h-4 w-4" /> : "אבגדהו"[i]}
                </span>
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
                {q.accounts.map((a) => (
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
          <div className="rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-[14.5px] leading-relaxed text-fg">
            <ol className="list-inside list-decimal space-y-1">
              {q.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-2 font-semibold">
              התשובה:{" "}
              {q.kind === "choice" ? q.options[q.answer] : q.kind === "number" ? <Money v={q.answer} /> : `ח׳ ${q.dr} / ז׳ ${q.cr}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
