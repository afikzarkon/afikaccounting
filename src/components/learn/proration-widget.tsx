"use client";

import { useState } from "react";
import { MONTHS, MonthPicker } from "@/components/study/month-picker";
import { InlineTex, texNum } from "@/components/study/ui";
import { firstYearMonths } from "@/lib/learn/depreciation";
import { monthSpan } from "./widgets";

// Its own file: it sets a live formula with KaTeX, so it loads only on the screen that shows it (see basics/lazy-widgets).

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
