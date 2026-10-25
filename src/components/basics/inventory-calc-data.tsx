"use client";

import { Plus, X } from "lucide-react";
import type { PeriodResult, System } from "@/lib/learn/inventory";
import { cn } from "@/lib/utils";
import { OpeningFields } from "./inventory-calc-events";
import { Check, NumField, Segmented, Select, smallBtn, TextField } from "./inventory-calc-fields";
import { QuickEntry } from "./inventory-calc-moves";
import { type Built, type CalcState, defaultsOf, emptyYear } from "./inventory-calc-state";
import { GlobalTerms, PurchaseTerms } from "./inventory-calc-terms";
import type { Update } from "./inventory-calculator";

/** Step 1: how the question values its stock, the terms every purchase shares, and the table of purchases and sales. */
export function DataStep({ st, set, built, results }: { st: CalcState; set: Update; built: Built; results?: (PeriodResult | undefined)[] }) {
  const d = defaultsOf(st).template;
  return (
    <div className="space-y-4">
      <SetupBar st={st} set={set} built={built} />
      <GlobalTerms st={st} set={set} built={built} />
      <section aria-labelledby="inv-moves" className="space-y-2">
        <h3 id="inv-moves" className="text-sm font-semibold text-fg">
          רכישות ומכירות
        </h3>
        <QuickEntry
          st={st}
          set={set}
          built={built}
          results={results}
          shared={d.discounts.length + d.extras.length > 0 || !!d.financing.trim()}
          renderTerms={(t, i) => (
            <PurchaseTerms
              p={st.years[t].purchases[i]}
              built={built}
              keyOf={(s) => `y${t}.p${i}.${s}`}
              discLetter={built.letters.disc}
              setP={(fn) => set((s) => ({ ...s, years: s.years.map((yy, n) => (n === t ? { ...yy, purchases: yy.purchases.map((z, j) => (j === i ? fn(z) : z)) } : yy)) }))}
            />
          )}
        />
      </section>
    </div>
  );
}

function SetupBar({ st, set, built }: { st: CalcState; set: Update; built: Built }) {
  const first = st.years[0];
  const removeYear = (i: number) =>
    set((s) => ({ ...s, years: s.years.filter((_, j) => j !== i), activeYear: 0, knowns: s.knowns.filter((k) => k.year !== i).map((k) => ({ ...k, year: k.year > i ? k.year - 1 : k.year })) }));
  return (
    <section aria-label="הגדרות השאלה" className="space-y-3 rounded-xl border border-line bg-surface p-3.5">
      <Segmented
        label="שיטת ההערכה"
        value={st.method}
        onChange={(v) => set((s) => ({ ...s, method: v }))}
        options={[
          ["fifo", "FIFO", "נכנס ראשון יוצא ראשון"],
          ["wa-periodic", "ממוצע תקופתי", "ממוצע משוקלל שנתי"],
          ["moving-avg", "ממוצע נע", "מתעדכן אחרי כל קנייה"],
          ["compare", "לא ידוע", "השוואה בין השלוש"],
        ]}
      />
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Segmented
          label="בתחילת השנה הראשונה"
          value={first?.founded ? "founded" : "given"}
          onChange={(v) => set((s) => ({ ...s, years: s.years.map((z, j) => (j === 0 ? { ...z, founded: v === "founded" } : z)) }))}
          options={[
            ["founded", "אין מלאי (חברה חדשה)"],
            ["given", "יש מלאי פתיחה"],
          ]}
        />
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-fg">שנים בשאלה</p>
          <div className="flex flex-wrap items-center gap-1">
            {st.years.map((y, i) => (
              <span key={y.id} className="inline-flex h-10 items-center gap-1 rounded-lg bg-surface-2 ps-3 pe-1 text-sm font-semibold text-fg">
                {y.label}
                {i > 0 ? (
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-danger/10 hover:text-danger" aria-label={`הסירו את ${y.label}`} onClick={() => removeYear(i)}>
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : (
                  <span className="w-2" />
                )}
              </span>
            ))}
            {st.years.length < 5 && (
              <button
                type="button"
                className={cn(smallBtn, "px-2.5")}
                onClick={() => set((s) => ({ ...s, years: [...s.years, emptyYear(String((Number(s.years.at(-1)?.label) || 2024) + 1), false)] }))}
              >
                <Plus className="h-4 w-4" aria-hidden /> שנה
              </button>
            )}
          </div>
        </div>
      </div>
      {first && !first.founded && <OpeningFields st={st} set={set} built={built} t={0} />}
      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold text-accent">הגדרות נוספות: עיגול, שיטת רישום, סדר באותו תאריך</summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label="שם החברה (לכותרת הפתרון)" value={st.company} onChange={(v) => set((s) => ({ ...s, company: v }))} />
          <Select
            label="עיגול"
            value={st.rounding}
            onChange={(v) => set((s) => ({ ...s, rounding: v }))}
            options={[
              ["exact", "דיוק מלא"],
              ["unit", "עלות ליחידה לפני הכפלה"],
              ["amount", "סכומים"],
            ]}
          />
          {st.rounding !== "exact" && <NumField label="ספרות אחרי הנקודה" value={st.roundDigits} onChange={(v) => set((s) => ({ ...s, roundDigits: v }))} />}
          {(st.method === "fifo" || st.method === "compare") && (
            <Select<System>
              label="שיטת רישום (לפקודות היומן)"
              value={st.system}
              onChange={(v) => set((s) => ({ ...s, system: v }))}
              options={[
                ["periodic", "מלאי תקופתי"],
                ["perpetual", "מלאי תמידי"],
              ]}
            />
          )}
        </div>
        <div className="mt-3 space-y-1.5">
          <Check label="באותו תאריך — מכירות לפני רכישות" checked={st.salesFirst} onChange={(v) => set((s) => ({ ...s, salesFirst: v }))} />
          {st.years.length > 1 && <Check label="להעביר הורדת ערך לשנה הבאה (לבדיקת ביטול)" checked={st.carryWriteDown} onChange={(v) => set((s) => ({ ...s, carryWriteDown: v }))} />}
        </div>
      </details>
    </section>
  );
}
