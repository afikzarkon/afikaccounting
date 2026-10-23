"use client";

import { CircleCheck, RotateCcw } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Num } from "@/components/study/blocks";
import { firstYearMonths } from "@/lib/learn/depreciation";
import { cn } from "@/lib/utils";
import { MONTHS, MonthPicker } from "@/components/study/month-picker";
import { InlineTex, texNum } from "@/components/study/ui";

/** "אפריל עד דצמבר = 9 חודשי פחת": the months of use in the first fiscal year, in words. */
export function monthSpan(month: number) {
  const m = firstYearMonths(month);
  if (m === 12) return "ינואר עד דצמבר = שנה מלאה, 12 חודשי פחת";
  if (m === 1) return "דצמבר בלבד = חודש פחת אחד";
  return `${MONTHS[month - 1]} עד דצמבר = ${m} חודשי פחת`;
}

/** Month → months in year one, the fraction, and the first-year straight-line charge on the lab's example. */
export function ProrationWidget({ annual }: { annual: number }) {
  const [month, setMonth] = useState(4);
  const m = firstYearMonths(month);
  return (
    <div className="my-4 grid gap-4 rounded-xl border border-line bg-surface-2/40 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <MonthPicker value={month} onChange={setMonth} />
      <div className="flex flex-col justify-center gap-2 rounded-lg bg-surface p-4 ring-1 ring-line">
        <p className="text-sm text-muted">
          כניסה לשימוש ב{MONTHS[month - 1]} → <strong className="text-fg">{monthSpan(month)}</strong>
        </p>
        <InlineTex tex={String.raw`${texNum(annual)} \times \tfrac{${m}}{12} = ${texNum((annual * m) / 12)}`} className="text-[15px]" />
        {m < 12 && (
          <p className="text-xs text-muted">
            {12 - m === 1 ? "והחודש שנותר משנת החיים הראשונה עובר" : `ו-${12 - m} החודשים שנותרו משנת החיים הראשונה עוברים`} לשנת הכספים הבאה — לכן נכס ל-5 שנים שנכנס באמצע שנה מופיע ב-6 שנות
            כספים.
          </p>
        )}
      </div>
    </div>
  );
}

/** Straight-line book value of the lab's example after a chosen number of years, as one stacked bar. */
export function BookValueSlider({ cost, salvage, life }: { cost: number; salvage: number; life: number }) {
  const [years, setYears] = useState(2);
  const acc = ((cost - salvage) * years) / life;
  const bv = cost - acc;
  const pct = (v: number) => `${(v / cost) * 100}%`;
  return (
    <div className="my-4 rounded-xl border border-line bg-surface-2/40 p-4">
      <label className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-fg">
        <span>כמה שנים עברו מאז הכניסה לשימוש?</span>
        <span className="num rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">{years} שנים</span>
      </label>
      <input
        type="range"
        min={0}
        max={life}
        step={0.5}
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--accent)]"
        aria-label="שנים שעברו"
      />
      {/* Cost is the whole bar: accumulated depreciation eats it from one end; salvage is the part never depreciated. */}
      <div className="mt-4 flex h-10 w-full gap-[2px] overflow-hidden rounded-lg" dir="ltr" aria-hidden>
        {acc > 0 && <div className="bg-[var(--series-2)] transition-all" style={{ width: pct(acc) }} />}
        {bv - salvage > 0.5 && <div className="bg-[var(--series-1)] transition-all" style={{ width: pct(bv - salvage) }} />}
        <div
          className="bg-[repeating-linear-gradient(45deg,var(--line-strong)_0_6px,transparent_6px_12px)] ring-1 ring-line-strong ring-inset"
          style={{ width: pct(salvage) }}
        />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
        <Legend swatch="bg-[var(--series-2)]" label="פחת נצבר" v={acc} />
        <Legend swatch="bg-[var(--series-1)]" label="יתרה שעוד תופחת" v={bv - salvage} />
        <Legend swatch="bg-[repeating-linear-gradient(45deg,var(--line-strong)_0_3px,transparent_3px_6px)] ring-1 ring-line-strong" label="ערך גרט (לא מופחת)" v={salvage} />
        <div className="rounded-lg bg-surface px-3 py-2 ring-1 ring-accent/40">
          <dt className="text-xs text-muted">יתרה בספרים = עלות − פחת נצבר</dt>
          <dd className="font-semibold text-fg">
            <Num v={bv} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Legend({ swatch, label, v }: { swatch: string; label: string; v: number }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2 ring-1 ring-line">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", swatch)} />
        {label}
      </dt>
      <dd className="font-semibold text-fg">
        <Num v={v} />
      </dd>
    </div>
  );
}

// The checklist is kept per browser, so a student can tick it off across exercises.
const KEY = "afik.ias16-lab.checklist";
const CHANGE = "afik-checklist-change";
// Mirrors the stored value, so ticking still works where storage is blocked.
let memory = "";
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
};
const write = (ids: string[]) => {
  memory = ids.join(",");
  try {
    localStorage.setItem(KEY, ids.join(","));
  } catch {
    // Storage blocked: the ticks just won't survive a reload.
  }
  window.dispatchEvent(new Event(CHANGE));
};

export type CheckItem = { id: string; text: string; hint: string };

export function ExamChecklist({ items }: { items: CheckItem[] }) {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const done = new Set(raw.split(",").filter(Boolean));
  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write([...next]);
  };
  const reset = () => write([]);
  const count = items.filter((i) => done.has(i.id)).length;
  const all = count === items.length;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-fg">צ׳ק-ליסט לבדיקה עצמית בסוף כל תרגיל</p>
          <p className="text-xs text-muted">הסימונים נשמרים בדפדפן הזה. אפסו לפני התרגיל הבא.</p>
        </div>
        <span className={cn("num text-sm font-semibold", all ? "text-success" : "text-muted")}>
          {count}/{items.length}
        </span>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg">
          <RotateCcw className="h-3.5 w-3.5" /> איפוס
        </button>
      </div>
      <div className="h-1.5 bg-surface-2">
        <div className={cn("h-full transition-all", all ? "bg-success" : "bg-accent")} style={{ width: `${(count / items.length) * 100}%` }} />
      </div>
      <ul className="divide-y divide-line">
        {items.map((it) => {
          const on = done.has(it.id);
          return (
            <li key={it.id}>
              <label className="flex cursor-pointer items-start gap-3 px-5 py-3.5 hover:bg-surface-2/50">
                <input type="checkbox" checked={on} onChange={() => toggle(it.id)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--success)]" />
                <span className="min-w-0">
                  <span className={cn("block text-[15px] text-fg", on && "text-muted line-through decoration-success/60")}>{it.text}</span>
                  <span className="block text-[13px] text-muted">{it.hint}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {all && (
        <p className="flex items-center gap-2 border-t border-success/30 bg-success/[0.07] px-5 py-3 text-sm font-medium text-success">
          <CircleCheck className="h-4 w-4" /> כל הבדיקות עברו — הפתרון מוכן להגשה.
        </p>
      )}
    </div>
  );
}
