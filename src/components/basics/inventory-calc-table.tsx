"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { inputClass } from "@/components/ui/form";
import { explainTable } from "@/lib/learn/inventory-explain";
import { ROW_LABEL, solveTable, TABLE_ROWS, type TableRow } from "@/lib/learn/inventory-solver";
import { cn } from "@/lib/utils";
import { Check, NumField, Select, smallBtn } from "./inventory-calc-fields";
import { buildTable, type CalcState } from "./inventory-calc-state";
import type { Update } from "./inventory-calculator";
import { GrossProfitStatementView, TraceView } from "./inventory-trace";
import { fmt, Money, Scroller } from "./ui";

const BOLD: TableRow[] = ["netSales", "netPurchases", "cogs", "grossProfit"];

/** Tab 2: a multi-year statement with question marks, solved one equation at a time (R32). */
export function TableTab({ st, set }: { st: CalcState; set: Update }) {
  const t = st.table;
  const setT = (fn: (x: CalcState["table"]) => CalcState["table"]) => set((s) => ({ ...s, table: fn(s.table) }));
  const setCell = (i: number, r: TableRow, v: string) => setT((x) => ({ ...x, years: x.years.map((y, j) => (j === i ? { ...y, cells: { ...y.cells, [r]: v } } : y)) }));
  const { input, errors } = useMemo(() => buildTable(t), [t]);
  const result = useMemo(() => solveTable(input), [input]);
  const steps = useMemo(() => explainTable(input, result), [input, result]);
  const solvedSet = new Set(result.steps.map((s) => `${s.year}:${s.row}`));
  const complete = (i: number) => (["netSales", "opening", "netPurchases", "closing", "cogs", "grossProfit"] as TableRow[]).every((r) => result.values[i][r] !== undefined);

  return (
    <div className="space-y-5">
      <p className="text-sm text-fg/90">
        הזינו בכל תא מספר, <strong>?</strong> לנעלם, או <strong>—</strong> לאפס. תא ריק בשורות ההנחות וההחזרות נחשב אפס; בשאר השורות — לא ידוע. השיעור הגולמי באחוזים.
      </p>
      <Scroller caption="הדוח — קלט">
        <table className="w-full min-w-[30rem] text-sm" aria-label="הדוח — קלט">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-start font-medium">
                סעיף
              </th>
              {t.years.map((y, i) => (
                <th key={i} scope="col" className="px-2 py-2 font-medium">
                  <div className="flex items-center gap-1">
                    <input aria-label={`שם שנה ${i + 1}`} value={y.label} onChange={(e) => setT((x) => ({ ...x, years: x.years.map((z, j) => (j === i ? { ...z, label: e.target.value } : z)) }))} className={cn(inputClass, "h-9 w-24 text-center")} />
                    {i > 0 && (
                      <button type="button" aria-label={`הסירו את ${y.label}`} className="text-muted hover:text-danger" onClick={() => setT((x) => ({ ...x, years: x.years.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((r) => (
              <tr key={r} className={cn("border-t border-line/70", BOLD.includes(r) && "font-semibold")}>
                <th scope="row" className="px-3 py-1 text-start font-[inherit] text-fg">
                  {ROW_LABEL[r]}
                  {r === "gpPct" && " (%)"}
                </th>
                {t.years.map((y, i) => (
                  <td key={i} className="px-2 py-1">
                    <input
                      dir="ltr"
                      aria-label={`${ROW_LABEL[r]} ${y.label}`}
                      value={y.cells[r]}
                      onChange={(e) => setCell(i, r, e.target.value)}
                      aria-invalid={errors[`${i}.${r}`] ? true : undefined}
                      className={cn(inputClass, "num h-9 w-28 text-end font-mono", y.cells[r].trim() === "?" && "border-accent/60 bg-accent-soft font-bold text-accent")}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroller>
      <div className="flex flex-wrap items-end gap-4">
        {t.years.length < 5 && (
          <button type="button" className={smallBtn} onClick={() => setT((x) => ({ ...x, years: [...x.years, { label: `שנה ${x.years.length + 1}`, founded: false, soldPct: "", cells: Object.fromEntries(TABLE_ROWS.map((r) => [r, ""])) as Record<TableRow, string> }] }))}>
            <Plus className="h-4 w-4" aria-hidden /> הוסיפו שנה
          </button>
        )}
        <Check label="מלאי הפתיחה של כל שנה = הסגירה של הקודמת" checked={t.chain} onChange={(v) => setT((x) => ({ ...x, chain: v }))} />
        <Check label={`${t.years[0]?.label ?? "השנה הראשונה"}: החברה הוקמה השנה (פתיחה אפס)`} checked={!!t.years[0]?.founded} onChange={(v) => setT((x) => ({ ...x, years: x.years.map((y, j) => (j === 0 ? { ...y, founded: v } : y)) }))} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {t.years.map((y, i) => (
          <NumField key={i} label={`${y.label}: עלות המכר = p% מהקניות`} suffix="%" value={y.soldPct} onChange={(v) => setT((x) => ({ ...x, years: x.years.map((z, j) => (j === i ? { ...z, soldPct: v } : z)) }))} />
        ))}
      </div>
      {t.years.length > 1 && (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <p className="text-sm font-semibold text-fg">שיעור הרווח הגולמי כנעלם: גבוה או נמוך מהשנה הקודמת</p>
          <p className="text-xs text-muted">למשל ״שיעור הרווח הגולמי ירד ב-3% לעומת אשתקד״. השאירו את התא של השיעור ריק או ?, והזינו כאן את השינוי.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {t.years.slice(1).map((y, n) => {
              const i = n + 1;
              const setY = (patch: Partial<typeof y>) => setT((x) => ({ ...x, years: x.years.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));
              return (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Select
                    label={`${y.label} לעומת ${t.years[i - 1].label}`}
                    value={y.gpDir ?? "up"}
                    onChange={(v) => setY({ gpDir: v })}
                    options={[
                      ["up", "גבוה יותר ב-"],
                      ["down", "נמוך יותר ב-"],
                    ]}
                  />
                  <NumField label="נקודות אחוז" suffix="%" value={y.gpDelta ?? ""} onChange={(v) => setY({ gpDelta: v })} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {Object.keys(errors).length > 0 && <p className="text-sm text-danger">בכל תא: מספר, ? או —.</p>}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <Scroller caption="הטבלה המלאה">
            <table className="w-full min-w-[24rem] text-sm" aria-label="הטבלה המלאה">
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="px-3 py-2 text-start font-medium">סעיף</th>
                  {input.years.map((y) => (
                    <th key={y.label} scope="col" className="px-3 py-2 text-end font-medium">{y.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody aria-live="polite">
                {TABLE_ROWS.map((r) => (
                  <tr key={r} className={cn("border-t border-line/70", BOLD.includes(r) && "font-semibold")}>
                    <th scope="row" className="px-3 py-1.5 text-start font-[inherit] text-fg">{ROW_LABEL[r]}</th>
                    {input.years.map((_, i) => {
                      const v = result.values[i][r];
                      const solved = solvedSet.has(`${i}:${r}`);
                      const missing = result.missing.some((x) => x.year === i && x.row === r);
                      return (
                        <td key={i} className={cn("relative px-3 py-1.5 text-end", solved && "bg-success/12 text-fg", missing && "bg-danger/10")}>
                          {v === undefined ? (missing ? <span className="text-danger">לא ניתן לקבוע</span> : "") : r === "gpPct" ? <bdi dir="ltr" className="num">{fmt(Math.round(v * 10000) / 100)}%</bdi> : <Money v={v} plain />}
                          {solved && <span className="sr-only"> (חושב)</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroller>
          <p className="text-xs text-muted">תאים בירוק — חושבו. באדום — אין מספיק משוואות.</p>
          {input.years.map((y, i) => complete(i) && <GrossProfitStatementView key={y.label} s={statementOf(result.values[i])} caption={`הדוח עד הרווח הגולמי — ${y.label}`} />)}
        </div>
        <div className="min-w-0">
          <p className="mb-2 font-semibold text-fg">הצעדים, לפי הסדר</p>
          {steps.length ? <TraceView steps={steps} numbered={false} /> : <p className="text-sm text-muted">אין עדיין מה לפתור — סמנו ? בתאים החסרים.</p>}
        </div>
      </div>
    </div>
  );
}

function statementOf(v: Partial<Record<TableRow, number>>) {
  const g = (r: TableRow) => v[r] ?? 0;
  return {
    grossSales: g("grossSales") || g("netSales") + g("custDiscounts") + g("custReturns"),
    custDiscounts: g("custDiscounts"),
    custReturns: g("custReturns"),
    netSales: g("netSales"),
    opening: g("opening"),
    grossPurchases: g("grossPurchases") || g("netPurchases") + g("suppDiscounts") + g("suppReturns"),
    suppDiscounts: g("suppDiscounts"),
    suppReturns: g("suppReturns"),
    netPurchases: g("netPurchases"),
    closing: g("closing"),
    cogs: g("cogs"),
    grossProfit: g("grossProfit"),
    gpPct: v.gpPct ?? (g("netSales") ? g("grossProfit") / g("netSales") : 0),
  };
}
