"use client";

import { CircleCheck, CircleX, Eye, RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { PRACTICE, type Question } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { updateProgress, useProgress } from "./store";
import { Money } from "./ui";

const LEVELS = [
  [1, "רמה 1 — יסודות"],
  [2, "רמה 2 — פקודות ויתרות"],
  [3, "רמה 3 — התאמות סוף שנה"],
] as const;

const parseNumber = (s: string) => Number(s.replace(/[,\s₪]/g, ""));

export function Practice() {
  const progress = useProgress();
  const answered = PRACTICE.filter((q) => progress.answers[q.id]);
  const correct = answered.filter((q) => progress.answers[q.id].correct);
  const reset = () => updateProgress((p) => ({ ...p, answers: {} }));

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">ההתקדמות שלכם</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full bg-success transition-all" style={{ width: `${(correct.length / PRACTICE.length) * 100}%` }} />
          </div>
        </div>
        <p className="num text-sm text-muted" aria-live="polite">
          {correct.length} נכונות · {answered.length} נענו · מתוך {PRACTICE.length}
        </p>
        <div className="flex gap-3 text-xs text-muted">
          {LEVELS.map(([lvl, t]) => {
            const qs = PRACTICE.filter((q) => q.level === lvl);
            return (
              <span key={lvl}>
                {t.split(" — ")[0]}: <span className="num font-semibold text-fg">{qs.filter((q) => progress.answers[q.id]?.correct).length}/{qs.length}</span>
              </span>
            );
          })}
        </div>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg">
          <RotateCcw className="h-3.5 w-3.5" /> איפוס
        </button>
      </div>
      {LEVELS.map(([lvl, title]) => (
        <section key={lvl} aria-label={title} className="space-y-3">
          <h3 className="text-lg font-semibold text-fg">{title}</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {PRACTICE.filter((q) => q.level === lvl).map((q) => (
              <QuestionCard key={q.id} q={q} n={PRACTICE.indexOf(q) + 1} saved={progress.answers[q.id]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function QuestionCard({ q, n, saved }: { q: Question; n: number; saved?: { value: string; correct: boolean } }) {
  const id = useId();
  const [value, setValue] = useState(saved?.value ?? "");
  const [dr, setDr] = useState(saved && q.kind === "entry" ? saved.value.split("|")[0] : "");
  const [cr, setCr] = useState(saved && q.kind === "entry" ? saved.value.split("|")[1] : "");
  const [reveal, setReveal] = useState(false);

  const submit = (answer: string, correct: boolean) =>
    updateProgress((p) => ({ ...p, answers: { ...p.answers, [q.id]: { value: answer, correct } } }));
  const check = () => {
    if (q.kind === "number") submit(value, Math.abs(parseNumber(value) - q.answer) < 0.5);
    if (q.kind === "entry") submit(`${dr}|${cr}`, dr === q.dr && cr === q.cr);
  };
  const status = saved ? (saved.correct ? "right" : "wrong") : null;

  return (
    <article className={cn("card flex flex-col p-4", status === "right" && "ring-1 ring-success/40", status === "wrong" && "ring-1 ring-danger/40")}>
      <p className="flex items-center gap-2 text-xs font-semibold text-accent">
        <span className="num grid h-6 w-6 place-items-center rounded-full bg-accent-soft">{n}</span>
        {q.skill}
      </p>
      <p id={`${id}-q`} className="mt-2 text-[15px] text-fg">
        {q.prompt}
      </p>

      <div className="mt-3">
        {q.kind === "choice" && (
          <div role="radiogroup" aria-labelledby={`${id}-q`} className="grid gap-1.5">
            {q.options.map((o, i) => {
              const picked = saved?.value === String(i);
              const isAnswer = i === q.answer;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={picked}
                  onClick={() => submit(String(i), isAnswer)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                    !saved && "border-line hover:border-accent/50",
                    saved && isAnswer && "border-success/50 bg-success/[0.08]",
                    picked && !isAnswer && "border-danger/50 bg-danger/[0.06]",
                    saved && !isAnswer && !picked && "border-line opacity-70",
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
            <button type="button" onClick={check} disabled={!value} className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-40">
              בדיקה
            </button>
          </div>
        )}
        {q.kind === "entry" && (
          <div className="flex flex-wrap items-end gap-2">
            {[
              ["חובה (מקבל)", dr, setDr],
              ["זכות (נותן)", cr, setCr],
            ].map(([label, v, set]) => (
              <label key={label as string} className="min-w-0 flex-1 text-xs text-muted">
                {label as string}
                <select value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} className={cn(inputClass, "mt-1")}>
                  <option value="">בחרו חשבון</option>
                  {q.accounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="button" onClick={check} disabled={!dr || !cr} className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-40">
              בדיקה
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
        {status === "right" && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
            <CircleCheck className="h-4 w-4" /> נכון!
          </span>
        )}
        {status === "wrong" && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-danger">
            <CircleX className="h-4 w-4" /> עוד לא — נסו שוב או פתחו את הפתרון
          </span>
        )}
        <button
          type="button"
          aria-expanded={reveal || status === "right"}
          onClick={() => setReveal((r) => !r)}
          className="ms-auto inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          <Eye className="h-3.5 w-3.5" /> {reveal ? "הסתרת הפתרון" : "הפתרון שלב אחר שלב"}
        </button>
      </div>
      {(reveal || status === "right") && (
        <div className="mt-2 rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg">
          <ol className="list-inside list-decimal space-y-1">
            {q.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-1.5 font-semibold">
            התשובה:{" "}
            {q.kind === "choice" ? q.options[q.answer] : q.kind === "number" ? <Money v={q.answer} /> : `ח' ${q.dr} / ז' ${q.cr}`}
          </p>
        </div>
      )}
    </article>
  );
}
