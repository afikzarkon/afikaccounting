"use client";

import { RotateCcw, Shuffle } from "lucide-react";
import { useState } from "react";
import { drill, DRILL_FAMILIES, type DrillFamily, familiesOf } from "@/lib/study/basics/drills";
import { cn } from "@/lib/utils";
import { JE } from "./ui";

const LEVELS = [
  { level: 1, label: "רמה 1", hint: "התאמה אחת ופשוטה" },
  { level: 2, label: "רמה 2", hint: "חודש חריג, תקופה, חלק משנה" },
  { level: 3, label: "רמה 3", hint: "נעלמים, תיקונים ושילובים" },
] as const;

/**
 * Practice without end for one lesson of the basics course: pick a level and a
 * kind of question (or mix them all, unnamed), solve, check within a shekel,
 * and open the whole solution — the tool, the formula, the numbers, the Excel
 * way, the journal entry and the common trap.
 */
export function BasicsDrill({ lesson }: { lesson: 5 | 6 | 7 | "all" }) {
  // The whole course: every family of lessons 5 to 7, opening mixed.
  const all = lesson === "all" ? (Object.keys(DRILL_FAMILIES) as DrillFamily[]) : familiesOf(lesson);
  const [level, setLevel] = useState<1 | 2 | 3 | "mixed">(lesson === "all" ? "mixed" : 1);
  const inLevel = level === "mixed" ? all : all.filter((f) => DRILL_FAMILIES[f].level === level);
  const [picked, setPicked] = useState<DrillFamily>(inLevel[0]);
  const [seed, setSeed] = useState(1);
  const family = level === "mixed" ? all[(seed * 7) % all.length] : inLevel.includes(picked) ? picked : inLevel[0];
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const d = drill(family, seed);
  const value = Number(typed.replaceAll(",", "").replaceAll("₪", "").trim());
  const right = checked && Number.isFinite(value) && Math.abs(value - d.answer) <= 1;
  const reset = () => {
    setTyped("");
    setChecked(false);
    setShown(false);
  };
  const chip = (on: boolean) => cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", on ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2");

  return (
    <section aria-label="מחולל תרגילים" className="card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="רמה">
        {LEVELS.map((l) => (
          <button
            key={l.level}
            type="button"
            aria-pressed={level === l.level}
            title={l.hint}
            onClick={() => {
              setLevel(l.level);
              reset();
            }}
            className={chip(level === l.level)}
          >
            {l.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={level === "mixed"}
          onClick={() => {
            setLevel("mixed");
            reset();
          }}
          className={cn(chip(level === "mixed"), "inline-flex items-center gap-1.5")}
        >
          <Shuffle className="h-4 w-4" aria-hidden /> מעורב
        </button>
      </div>
      {level !== "mixed" ? (
        <>
          <p className="text-[13px] text-muted">{LEVELS.find((l) => l.level === level)!.hint}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="סוג תרגיל">
            {inLevel.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={f === family}
                onClick={() => {
                  setPicked(f);
                  reset();
                }}
                className={chip(f === family)}
              >
                {DRILL_FAMILIES[f].title}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[13px] text-muted">כל תרגיל מנושא אחר, בלי שם. כמו בבחינה: קודם מזהים מה זה.</p>
      )}
      <p className="text-[16px] leading-relaxed font-semibold text-fg">{d.prompt}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-muted">{d.asks}, ב-₪</span>
          <input
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setChecked(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim()) setChecked(true);
            }}
            inputMode="decimal"
            dir="ltr"
            className="num min-h-11 w-44 rounded-lg border border-line-strong bg-surface px-3 text-[15px] text-fg"
          />
        </label>
        <button type="button" onClick={() => setChecked(true)} disabled={!typed.trim()} className="min-h-11 self-end rounded-lg bg-accent px-4 text-[14.5px] font-semibold text-accent-fg disabled:opacity-50">
          בדיקה
        </button>
        <button type="button" onClick={() => setShown((v) => !v)} className="min-h-11 self-end rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent">
          {shown ? "הסתרת הפתרון" : "הצגת הפתרון המלא"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="inline-flex min-h-11 items-center gap-1.5 self-end rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> תרגיל חדש
        </button>
      </div>
      {checked && (
        <p aria-live="polite" className={cn("text-[15px] font-semibold", right ? "text-success" : "text-danger")}>
          {right ? "נכון." : "לא בדיוק. נסו שוב, או פתחו את הפתרון המלא."}
        </p>
      )}
      {shown && (
        <div className="space-y-3 rounded-xl border border-line bg-surface-2/40 p-3.5 text-[14.5px]">
          {level === "mixed" && (
            <p className="text-[13px] font-bold text-accent">הנושא: {DRILL_FAMILIES[family].title}</p>
          )}
          <p>
            <strong>איזה כלי?</strong> {d.tool}
          </p>
          {d.steps.map((s) => (
            <div key={s.title}>
              <p className="font-bold text-fg">{s.title}</p>
              {s.note && <p>{s.note}</p>}
              {s.formula && <p>{s.formula}</p>}
              {s.numbers && (
                <p dir="ltr" className="num text-right break-words">
                  {s.numbers}
                </p>
              )}
            </div>
          ))}
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-bold text-fg ring-1 ring-line">באקסל</span>
            <bdi dir="ltr" className="font-mono">
              {d.excel}
            </bdi>
          </p>
          {d.entries.map((e, i) => (
            <JE key={i} entry={{ ...e, id: String(i + 1) }} note={null} />
          ))}
          <p>
            <strong>התשובה:</strong> <span className="num">{d.answer.toLocaleString("en-US")}</span> ₪
          </p>
          <p>
            <strong>מלכודת נפוצה:</strong> {d.trap}
          </p>
        </div>
      )}
    </section>
  );
}
