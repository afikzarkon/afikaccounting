"use client";

import { Plus, Trash2 } from "lucide-react";
import { Stat } from "@/components/study/ui";
import { gpFire, gpRate, grossProfitMethod } from "@/lib/learn/inventory";
import { explainGpFire, m, pc } from "@/lib/learn/inventory-explain";
import { Check, NumField, primaryBtn, Segmented, smallBtn, TextField } from "./inventory-calc-fields";
import { type CalcState, claimTerms, type FireForm, optNum as n } from "./inventory-calc-state";
import type { Update } from "./inventory-calculator";
import { TraceView } from "./inventory-trace";
import { Money } from "./ui";

/**
 * The margin tools, for questions with no table of purchases and sales: the
 * retail method, and a fire claimed by the gross margin. A fire claimed by a
 * cost formula is an event of the full question instead.
 */
export function FireTab({ st, set }: { st: CalcState; set: Update }) {
  const f = st.fire;
  const setF = (patch: Partial<FireForm>) => set((s) => ({ ...s, fire: { ...s.fire, ...patch } }));
  const setRetail = (patch: Partial<FireForm["retail"]>) => setF({ retail: { ...f.retail, ...patch } });
  const setYear = (i: number, patch: Partial<FireForm["gpYears"][number]>) => setF({ gpYears: f.gpYears.map((z, j) => (j === i ? { ...z, ...patch } : z)) });

  const retail = (() => {
    const x = { netSales: n(f.retail.netSales), rate: n(f.retail.rate), opening: n(f.retail.opening), purchases: n(f.retail.purchases) };
    if (x.netSales === undefined || x.rate === undefined) return null;
    return { x, r: grossProfitMethod({ netSales: x.netSales, rate: x.rate / 100, opening: x.opening ?? 0, purchases: x.purchases ?? 0 }) };
  })();

  const rates = f.gpYears.map((y) => {
    const s = n(y.netSales);
    const c = n(y.cogs);
    return s && c !== undefined ? gpRate(s, c) : undefined;
  });
  const out = (() => {
    if (rates.some((r) => r === undefined) || !rates.length) return { error: "הזינו מכירות ועלות מכר לכל שנה שלפיה נקבע השיעור." };
    const input = {
      opening: n(f.opening) ?? 0,
      purchases: n(f.purchases) ?? 0,
      sales: n(f.sales) ?? 0,
      rates: rates as number[],
      weights: f.weighted ? f.gpYears.map((y) => n(y.netSales) ?? 0) : undefined,
      saved: n(f.saved) ?? 0,
      savedAtPrice: f.savedAtPrice,
      terms: claimTerms(f),
    };
    const r = gpFire(input);
    return { r, steps: explainGpFire(input, r) };
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/50 bg-accent-soft/40 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm text-fg">
          <strong>הפוליסה לפי FIFO או ממוצע?</strong> הלשונית הזו רק לשיפוי לפי שיעור רווח גולמי. שריפה לפי שיטת עלות מחושבת מטבלת הרכישות והמכירות של השאלה.
        </p>
        <button type="button" className={primaryBtn} onClick={() => set((s) => ({ ...s, tab: "full", step: 1, fireEvent: true }))}>
          לשריפה בשאלת מלאי
        </button>
      </div>
      <section className="space-y-3 rounded-xl border border-line p-4" aria-labelledby="retail-title">
        <h3 id="retail-title" className="font-semibold text-fg">
          מלאי סגירה משיעור גולמי (שיטה קמעונאית)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField label="מכירות נטו" suffix="₪" value={f.retail.netSales} onChange={(v) => setRetail({ netSales: v })} />
          <NumField label="שיעור רווח גולמי" suffix="%" value={f.retail.rate} onChange={(v) => setRetail({ rate: v })} />
          <NumField label="מלאי פתיחה" suffix="₪" value={f.retail.opening} onChange={(v) => setRetail({ opening: v })} />
          <NumField label="קניות" suffix="₪" value={f.retail.purchases} onChange={(v) => setRetail({ purchases: v })} />
        </div>
        {retail && (
          <div className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg" aria-live="polite">
            <p className="num">
              עלות המכר = {m(retail.x.netSales!)} × (1 − {retail.x.rate}%) = {m(retail.r.cogs)}
            </p>
            <p className="num">
              מלאי סגירה = {m(retail.x.opening ?? 0)} + {m(retail.x.purchases ?? 0)} − {m(retail.r.cogs)} = <strong>{m(retail.r.closing)}</strong>
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-line p-4" aria-labelledby="fire-title">
        <h3 id="fire-title" className="font-semibold text-fg">
          שריפה ושיפוי לפי שיעור רווח גולמי
        </h3>
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-fg">השנים שלפיהן נקבע השיעור</p>
          {f.gpYears.map((y, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
              <TextField label="שנה" value={y.label} onChange={(v) => setYear(i, { label: v })} />
              <NumField label="מכירות נטו" suffix="₪" value={y.netSales} onChange={(v) => setYear(i, { netSales: v })} />
              <NumField label="עלות המכר" suffix="₪" value={y.cogs} onChange={(v) => setYear(i, { cogs: v })} />
              <p className="num pb-2.5 text-sm text-fg">{rates[i] !== undefined ? pc(rates[i]!) : "—"}</p>
              <button type="button" className={smallBtn} aria-label="הסירו שנה" disabled={f.gpYears.length < 2} onClick={() => setF({ gpYears: f.gpYears.filter((_, j) => j !== i) })}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <button type="button" className={smallBtn} onClick={() => setF({ gpYears: [...f.gpYears, { label: `שנה ${f.gpYears.length + 1}`, netSales: "", cogs: "" }] })}>
            <Plus className="h-4 w-4" aria-hidden /> שנה
          </button>
          {f.gpYears.length > 1 && <Check label="ממוצע משוקלל לפי המכירות (ברירת המחדל: ממוצע פשוט)" checked={f.weighted} onChange={(v) => setF({ weighted: v })} />}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField label="מלאי פתיחה (בעלות)" suffix="₪" value={f.opening} onChange={(v) => setF({ opening: v })} />
          <NumField label="קניות עד השריפה" suffix="₪" value={f.purchases} onChange={(v) => setF({ purchases: v })} />
          <NumField label="מכירות עד השריפה" suffix="₪" value={f.sales} onChange={(v) => setF({ sales: v })} />
          <NumField label="מלאי שניצל" suffix="₪" value={f.saved} onChange={(v) => setF({ saved: v })} />
        </div>
        <Check label="המלאי שניצל נתון במחיר מכירה (המר לעלות לפי השיעור)" checked={f.savedAtPrice} onChange={(v) => setF({ savedAtPrice: v })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Segmented
            label="השתתפות עצמית"
            value={f.dedKind}
            onChange={(v) => setF({ dedKind: v })}
            options={[
              ["pct", "אחוז"],
              ["fixed", "סכום"],
            ]}
          />
          <NumField label={f.dedKind === "pct" ? "שיעור ההשתתפות" : "סכום ההשתתפות"} suffix={f.dedKind === "pct" ? "%" : "₪"} value={f.dedValue} onChange={(v) => setF({ dedValue: v })} />
          <NumField label="תקרת שיפוי (ריק — אין תקרה)" suffix="₪" value={f.cap} onChange={(v) => setF({ cap: v })} />
        </div>
        {(n(f.cap) ?? 0) > 0 && <Check label="התקרה חלה לפני ההשתתפות העצמית" checked={f.capBefore} onChange={(v) => setF({ capBefore: v })} hint="ברירת המחדל: התקרה על סכום השיפוי" />}
      </section>

      <section aria-live="polite" className="space-y-3">
        {"error" in out ? (
          <p className="rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-muted">{out.error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="מלאי בתאריך השריפה" value={<Money v={out.r.atFire} />} />
              <Stat label="מלאי שנשרף (סכום התביעה)" value={<Money v={out.r.burned} />} />
              <Stat label="השתתפות עצמית" value={<Money v={out.r.settlement.deductible} />} />
              <Stat label="שיפוי מהביטוח" value={<Money v={out.r.settlement.net} />} tone="success" />
            </div>
            <TraceView steps={out.steps} />
          </>
        )}
      </section>
    </div>
  );
}
