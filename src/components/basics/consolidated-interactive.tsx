"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { groupPosition, profitSplit } from "@/lib/learn/consolidated";
import { drill, DRILL_FAMILIES, type DrillFamily } from "@/lib/study/consolidated/drills";
import { cn } from "@/lib/utils";
import { Tbl } from "./ifrs16-parts";

function Amount({ label, value, onChange, step = 10_000 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block text-[13.5px] text-muted">
      {label}
      <input type="number" inputMode="decimal" min={0} step={step} value={value} onChange={(e) => onChange(Math.max(0, +e.target.value || 0))} dir="ltr" className="num mt-1 block min-h-11 w-full rounded-lg border border-line-strong bg-surface px-2 text-[15px] text-fg" />
    </label>
  );
}

/** Change a company's figures or the holding, and watch what moves in the consolidated statements: the holding moves only the split. */
export function GroupLab() {
  const [parentAssets, setParentAssets] = useState(1_240_000);
  const [parentLiabilities, setParentLiabilities] = useState(470_000);
  const [subAssets, setSubAssets] = useState(860_000);
  const [subLiabilities, setSubLiabilities] = useState(420_000);
  const [parentProfit, setParentProfit] = useState(176_000);
  const [subProfit, setSubProfit] = useState(64_000);
  const [pct, setPct] = useState(75);
  const holding = pct / 100;
  const g = groupPosition({ parentAssets, parentLiabilities, subAssets, subLiabilities, holding });
  const p = profitSplit({ parentProfit, subProfit, holding });
  return (
    <section aria-label="מעבדה: בונים דוח מאוחד" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <Amount label="האם: נכסים, בלי ההשקעה" value={parentAssets} onChange={setParentAssets} />
        <Amount label="הבת: נכסים" value={subAssets} onChange={setSubAssets} />
        <Amount label="האם: התחייבויות" value={parentLiabilities} onChange={setParentLiabilities} />
        <Amount label="הבת: התחייבויות" value={subLiabilities} onChange={setSubLiabilities} />
        <Amount label="האם: רווח, בלי מה שמהבת" value={parentProfit} onChange={setParentProfit} />
        <Amount label="הבת: רווח" value={subProfit} onChange={setSubProfit} />
      </div>
      <label className="block text-[14px] font-semibold text-fg">
        האם מחזיקה ב־<bdi dir="ltr" className="num">{pct}%</bdi> מהבת
        <input type="range" min={51} max={100} value={pct} onChange={(e) => setPct(+e.target.value)} dir="ltr" className="mt-2 block w-full accent-[var(--color-accent)]" aria-label="שיעור ההחזקה" />
      </label>
      <Tbl
        head={["דוח מאוחד על המצב הכספי", "סכום"]}
        rows={[
          ["נכסים: 100% משתיהן", g.assets],
          ["התחייבויות: 100% משתיהן", g.liabilities],
          ["הון המיוחס לבעלים של האם", g.owners],
          ["זשמ״ש", g.nci],
        ]}
        foot={["בדיקה: סך ההון שווה לנכסים פחות התחייבויות", g.owners + g.nci]}
      />
      <Tbl head={["דוח מאוחד על הרווח", "סכום"]} rows={[["רווח נקי: 100% משתיהן", p.total], ["מתוכו לבעלים של האם", p.owners], ["מתוכו לזשמ״ש", p.nci]]} />
    </section>
  );
}

/** Endless practice with new numbers: pick a calculation, solve, check, and see the whole solution. */
export function ConsolidatedDrill({ families }: { families: DrillFamily[] }) {
  const [family, setFamily] = useState(families[0]);
  const [seed, setSeed] = useState(1);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const d = drill(family, seed);
  const value = Number(typed.replaceAll(",", ""));
  const right = checked && Number.isFinite(value) && value === d.answer;
  const reset = () => {
    setTyped("");
    setChecked(false);
    setShown(false);
  };
  return (
    <section aria-label="מחולל תרגילים" className="card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="סוג תרגיל">
        {families.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === family}
            onClick={() => {
              setFamily(f);
              reset();
            }}
            className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", f === family ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}
          >
            {DRILL_FAMILIES[f]}
          </button>
        ))}
      </div>
      <p className="text-[16px] leading-relaxed font-semibold text-fg">{d.prompt}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setChecked(false);
          }}
          inputMode="decimal"
          dir="ltr"
          aria-label="התשובה בש״ח"
          className="num min-h-11 w-40 rounded-lg border border-line-strong bg-surface px-3 text-[15px] text-fg"
        />
        <button type="button" onClick={() => setChecked(true)} disabled={!typed.trim()} className="min-h-11 rounded-lg bg-accent px-4 text-[14.5px] font-semibold text-accent-fg disabled:opacity-50">
          בדיקה
        </button>
        <button type="button" onClick={() => setShown((v) => !v)} className="min-h-11 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent">
          {shown ? "הסתרת הפתרון" : "הצגת הפתרון המלא"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline"
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
        <div className="space-y-2.5 rounded-xl border border-line bg-surface-2/40 p-3.5 text-[14.5px]">
          {d.steps.map((s) => (
            <div key={s.title}>
              <p className="font-bold text-fg">{s.title}</p>
              <p dir="ltr" className="num break-words">{s.numbers}</p>
            </div>
          ))}
          <p>
            <strong>התשובה:</strong> <span className="num">{d.answer.toLocaleString("en-US")}</span> ש״ח
          </p>
          <p>
            <strong>מלכודת נפוצה:</strong> {d.trap}
          </p>
        </div>
      )}
    </section>
  );
}
