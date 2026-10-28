"use client";

import { CircleCheck, CircleX, Eye, RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { PRACTICE, type Question } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { type StepMark, Stepper } from "./stepper";
import { updateProgress, useProgress } from "./store";
import { Money } from "./ui";

const LEVEL = { 1: "רמה 1 · יסודות", 2: "רמה 2 · פקודות ויתרות", 3: "רמה 3 · התאמות סוף שנה" } as const;

const parseNumber = (s: string) => Number(s.replace(/[,\s₪]/g, ""));

/** The fifteen questions one at a time, each marked on the progress bar as it is answered, then a summary. */
export function Practice() {
  const progress = useProgress();
  const [step, setStep] = useState(0);
  const correct = PRACTICE.filter((q) => progress.answers[q.id]?.correct).length;
  const marks: StepMark[] = [...PRACTICE.map((q) => (progress.answers[q.id] ? (progress.answers[q.id].correct ? "ok" : "bad") : undefined)), undefined];
  const reset = () => {
    updateProgress((p) => ({ ...p, answers: {} }));
    setStep(0);
  };

  return (
    <Stepper
      label={`תרגול · ${correct} מתוך ${PRACTICE.length} נכונות`}
      step={step}
      onStep={setStep}
      marks={marks}
      steps={[
        ...PRACTICE.map((q, i) => ({
          title: (
            <span className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                שאלה {i + 1} · {LEVEL[q.level]}
              </span>
              <span className="text-sm text-muted">{q.skill}</span>
            </span>
          ),
          body: <QuestionCard key={q.id} q={q} saved={progress.answers[q.id]} />,
        })),
        {
          title: "סיכום",
          body: (
            <>
              <p className="text-[17px] font-bold text-fg">
                <span className="num">{correct}</span> מתוך <span className="num">{PRACTICE.length}</span> נכונות
              </p>
              <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {PRACTICE.map((q, i) => {
                  const a = progress.answers[q.id];
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => setStep(i)}
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-start text-xs font-medium ring-1",
                          a ? (a.correct ? "bg-success/10 text-success ring-success/30" : "bg-danger/10 text-danger ring-danger/30") : "bg-surface text-muted ring-line",
                        )}
                      >
                        <span className="num font-bold">{i + 1}</span>
                        <span className="truncate">{a ? (a.correct ? "נכון" : "לנסות שוב") : "לא נענתה"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm text-muted">התשובות נשמרות בדפדפן הזה. לחיצה על שאלה מחזירה אליה.</p>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted ring-1 ring-line hover:text-fg">
                <RotateCcw className="h-3.5 w-3.5" /> איפוס התשובות
              </button>
            </>
          ),
        },
      ]}
    />
  );
}

function QuestionCard({ q, saved }: { q: Question; saved?: { value: string; correct: boolean } }) {
  const id = useId();
  const [value, setValue] = useState(saved && q.kind === "number" ? saved.value : "");
  const [dr, setDr] = useState(saved && q.kind === "entry" ? saved.value.split("|")[0] : "");
  const [cr, setCr] = useState(saved && q.kind === "entry" ? saved.value.split("|")[1] : "");
  const [reveal, setReveal] = useState(false);

  const submit = (answer: string, correct: boolean) => updateProgress((p) => ({ ...p, answers: { ...p.answers, [q.id]: { value: answer, correct } } }));
  const check = () => {
    if (q.kind === "number") submit(value, Math.abs(parseNumber(value) - q.answer) < 0.5);
    if (q.kind === "entry") submit(`${dr}|${cr}`, dr === q.dr && cr === q.cr);
  };
  const status = saved ? (saved.correct ? "right" : "wrong") : null;
  const open = reveal || status === "right";

  return (
    <div className="space-y-3">
      <p id={`${id}-q`} className="text-[16px] text-fg">
        {q.prompt}
      </p>

      {q.kind === "choice" && (
        <div role="radiogroup" aria-labelledby={`${id}-q`} className="grid gap-1.5">
          {q.options.map((o, i) => {
            const picked = saved?.value === String(i);
            // The right option is marked only once it was picked, or the solution is open.
            const showRight = i === q.answer && (picked || open);
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={picked}
                onClick={() => submit(String(i), i === q.answer)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-start text-[15px] transition-colors",
                  showRight ? "border-success/50 bg-success/[0.08]" : picked ? "border-danger/50 bg-danger/[0.06]" : "border-line hover:border-accent/50 hover:bg-accent-soft/40",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}
      {q.kind === "number" && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-xs text-muted">
            התשובה בשקלים
            <input
              dir="ltr"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && value && check()}
              className={cn(inputClass, "num mt-1 text-start font-mono")}
              aria-describedby={`${id}-q`}
            />
          </label>
          <button type="button" onClick={check} disabled={!value} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-40">
            בדיקה
          </button>
        </div>
      )}
      {q.kind === "entry" && (
        <div className="flex flex-wrap items-end gap-2">
          {(
            [
              ["ח׳ — חובה (מקבל)", dr, setDr],
              ["ז׳ — זכות (נותן)", cr, setCr],
            ] as const
          ).map(([label, v, set]) => (
            <label key={label} className="min-w-[9rem] flex-1 text-xs text-muted">
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
          <button type="button" onClick={check} disabled={!dr || !cr} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-40">
            בדיקה
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {status === "right" && (
          <span className="anim-step-in inline-flex items-center gap-1 text-sm font-semibold text-success">
            <CircleCheck className="h-4 w-4" /> נכון!
          </span>
        )}
        {status === "wrong" && (
          <span className="anim-step-in inline-flex items-center gap-1 text-sm font-semibold text-danger">
            <CircleX className="h-4 w-4" /> לא נכון — נסו שוב
          </span>
        )}
        {!open && (
          <button type="button" onClick={() => setReveal(true)} className="ms-auto inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
            <Eye className="h-3.5 w-3.5" /> הצג פתרון
          </button>
        )}
      </div>
      {open && (
        <div className="anim-step-in rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[14.5px] text-fg">
          <ol className="list-inside list-decimal space-y-1">
            {q.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-1.5 font-semibold">
            התשובה: {q.kind === "choice" ? q.options[q.answer] : q.kind === "number" ? <Money v={q.answer} /> : `ח׳ ${q.dr} / ז׳ ${q.cr}`}
          </p>
        </div>
      )}
    </div>
  );
}
