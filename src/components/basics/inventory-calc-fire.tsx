"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Stat } from "@/components/study/ui";
import { type ClaimTerms, gpFire, gpRate, grossProfitMethod, historyFire, type Method, METHOD_LABEL } from "@/lib/learn/inventory";
import { explainGpFire, explainHistoryFire, m, pc } from "@/lib/learn/inventory-explain";
import { Check, Choice, NumField, smallBtn, TextField } from "./inventory-calc-fields";
import { build, type CalcState, type FireForm } from "./inventory-calc-state";
import type { Update } from "./inventory-calculator";
import { TraceView } from "./inventory-trace";
import { Money } from "./ui";

const n = (x: string) => {
  const v = Number(x.replace(/,/g, "").trim());
  return x.trim() === "" || !Number.isFinite(v) ? undefined : v;
};

function terms(f: FireForm): ClaimTerms {
  const d = n(f.dedValue);
  return {
    deductible: d === undefined ? undefined : { kind: f.dedKind, value: f.dedKind === "pct" ? d / 100 : d },
    cap: n(f.cap),
    capBeforeDeductible: f.capBefore,
  };
}

/** Tab 3: the retail method, and fire claims by margin or by a cost formula over the history. */
export function FireTab({ st, set }: { st: CalcState; set: Update }) {
  const f = st.fire;
  const setF = (patch: Partial<FireForm>) => set((s) => ({ ...s, fire: { ...s.fire, ...patch } }));
  const setRetail = (patch: Partial<FireForm["retail"]>) => setF({ retail: { ...f.retail, ...patch } });

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
  const gpOut = (() => {
    if (f.basis !== "gp") return null;
    if (rates.some((r) => r === undefined) || !rates.length) return { error: "הזינו מכירות ועלות מכר לכל שנה קודמת (או שיעור אחד)." };
    const input = {
      opening: n(f.opening) ?? 0,
      purchases: n(f.purchases) ?? 0,
      sales: n(f.sales) ?? 0,
      rates: rates as number[],
      weights: f.weighted ? f.gpYears.map((y) => n(y.netSales) ?? 0) : undefined,
      saved: n(f.saved) ?? 0,
      savedAtPrice: f.savedAtPrice,
      terms: terms(f),
    };
    const r = gpFire(input);
    return { r, steps: explainGpFire(input, r) };
  })();

  const built = useMemo(() => build(st), [st]);
  const histOut = (() => {
    if (f.basis !== "history") return null;
    if (Object.keys(built.errors).length || built.unknowns.length) return { error: "השלימו את נתוני הרכישות והמכירות בלשונית ① (בלי נעלמים)." };
    if (!built.periods.length) return { error: "אין נתונים." };
    const r = historyFire({ periods: built.periods, method: f.policy, savedUnits: n(f.savedUnits) ?? 0, terms: terms(f), rounding: built.rounding });
    return { r, steps: explainHistoryFire(f.policy, r) };
  })();

  const out = f.basis === "gp" ? gpOut : histOut;
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-line p-4" aria-labelledby="retail-title">
        <h3 id="retail-title" className="font-semibold text-fg">
          א. מלאי סגירה משיעור גולמי (שיטה קמעונאית)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
            <p className="text-xs text-muted">אם כל המלאי נשרף — זה גם סכום השיפוי המקסימלי (לפני השתתפות עצמית).</p>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-line p-4" aria-labelledby="fire-title">
        <h3 id="fire-title" className="font-semibold text-fg">
          ב. שריפה ושיפוי
        </h3>
        <Choice
          label="בסיס השיפוי לפי הפוליסה"
          value={f.basis}
          onChange={(v) => setF({ basis: v })}
          options={[
            ["gp", "שיעור רווח גולמי", "״לפי ממוצע שיעור הרווח הגולמי בשנים…״"],
            ["history", "עלות לפי שיטה", "״לפי עלות FIFO / ממוצע״ — מחושב מחדש מההיסטוריה"],
          ]}
        />
        {f.basis === "gp" ? (
          <>
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-fg">השנים שלפיהן נקבע השיעור</p>
              {f.gpYears.map((y, i) => (
                <div key={i} className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                  <TextField label="שנה" value={y.label} onChange={(v) => setF({ gpYears: f.gpYears.map((z, j) => (j === i ? { ...z, label: v } : z)) })} />
                  <NumField label="מכירות נטו" suffix="₪" value={y.netSales} onChange={(v) => setF({ gpYears: f.gpYears.map((z, j) => (j === i ? { ...z, netSales: v } : z)) })} />
                  <NumField label="עלות המכר" suffix="₪" value={y.cogs} onChange={(v) => setF({ gpYears: f.gpYears.map((z, j) => (j === i ? { ...z, cogs: v } : z)) })} />
                  <p className="num pb-2.5 text-sm text-fg">{rates[i] !== undefined ? pc(rates[i]!) : "—"}</p>
                  <button type="button" className={smallBtn} aria-label="הסירו שנה" disabled={f.gpYears.length < 2} onClick={() => setF({ gpYears: f.gpYears.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
              <button type="button" className={smallBtn} onClick={() => setF({ gpYears: [...f.gpYears, { label: `שנה ${f.gpYears.length + 1}`, netSales: "", cogs: "" }] })}>
                <Plus className="h-4 w-4" aria-hidden /> הוסיפו שנה
              </button>
              {f.gpYears.length > 1 && <Check label="ממוצע משוקלל לפי המכירות (ברירת המחדל: ממוצע פשוט)" checked={f.weighted} onChange={(v) => setF({ weighted: v })} />}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NumField label="מלאי פתיחה (בעלות)" suffix="₪" value={f.opening} onChange={(v) => setF({ opening: v })} />
              <NumField label="קניות עד תאריך השריפה" suffix="₪" value={f.purchases} onChange={(v) => setF({ purchases: v })} />
              <NumField label="מכירות עד תאריך השריפה" suffix="₪" value={f.sales} onChange={(v) => setF({ sales: v })} />
              <NumField label="מלאי שנותר / ניצל" suffix="₪" value={f.saved} onChange={(v) => setF({ saved: v })} />
            </div>
            <Check label="המלאי שניצל נתון במחיר מכירה (המר לעלות לפי השיעור)" checked={f.savedAtPrice} onChange={(v) => setF({ savedAtPrice: v })} />
          </>
        ) : (
          <>
            <p className="text-sm text-fg/90">
              ההיסטוריה נלקחת מלשונית ①: {st.years.map((y) => y.label).join(", ")} — השנה האחרונה היא התקופה עד השריפה. שיטת הפוליסה יכולה להיות שונה משיטת החברה, והחישוב הוא בלי
              שמ״נ.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Choice<Method>
                label="שיטת הפוליסה"
                value={f.policy}
                onChange={(v) => setF({ policy: v })}
                options={(["fifo", "wa-periodic", "moving-avg"] as Method[]).map((x) => [x, METHOD_LABEL[x], x === "fifo" ? "הנשרף — מהשכבות האחרונות" : "הנשרף — ממוצע × יחידות"])}
              />
              <NumField label="יחידות שניצלו" value={f.savedUnits} onChange={(v) => setF({ savedUnits: v })} />
            </div>
            <button type="button" className="text-sm font-semibold text-accent underline" onClick={() => set((s) => ({ ...s, tab: "full", step: 4 }))}>
              לעריכת הרכישות והמכירות
            </button>
          </>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Choice
            label="השתתפות עצמית"
            value={f.dedKind}
            onChange={(v) => setF({ dedKind: v })}
            options={[
              ["pct", "אחוז מהנזק", ""],
              ["fixed", "סכום קבוע", ""],
            ]}
          />
          <NumField label={f.dedKind === "pct" ? "שיעור ההשתתפות" : "סכום ההשתתפות"} suffix={f.dedKind === "pct" ? "%" : "₪"} value={f.dedValue} onChange={(v) => setF({ dedValue: v })} />
          <NumField label="תקרת שיפוי (אם יש)" suffix="₪" value={f.cap} onChange={(v) => setF({ cap: v })} />
        </div>
        {f.cap && <Check label="התקרה חלה לפני ההשתתפות העצמית" checked={f.capBefore} onChange={(v) => setF({ capBefore: v })} hint="ברירת המחדל: התקרה על סכום השיפוי" />}
      </section>

      <section aria-live="polite" className="space-y-3">
        {out && "error" in out ? (
          <p className="rounded-xl border border-danger/40 bg-danger/[0.06] px-4 py-3 text-sm text-fg">{out.error}</p>
        ) : out ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="מלאי בתאריך השריפה" value={<Money v={"atFire" in out.r ? out.r.atFire : out.r.costAtFire} />} />
              <Stat label="מלאי שנשרף" value={<Money v={out.r.burned} />} />
              <Stat label="השתתפות עצמית" value={<Money v={out.r.settlement.deductible} />} />
              <Stat label="שיפוי נטו (מזומן)" value={<Money v={out.r.settlement.net} />} tone="success" />
            </div>
            <TraceView steps={out.steps} />
          </>
        ) : null}
      </section>
    </div>
  );
}
