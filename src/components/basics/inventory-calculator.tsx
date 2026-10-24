"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Copy, Eraser, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useReducer, useState, useSyncExternalStore } from "react";
import { Stat } from "@/components/study/ui";
import {
  compareMethods,
  EXTRA_INFO,
  entriesFor,
  type ExtraBasis,
  type ExtraCategory,
  type Method,
  METHOD_LABEL,
  METHODS,
  type PeriodResult,
  priceTrend,
  purchaseCost,
  type System,
  valuateChain,
} from "@/lib/learn/inventory";
import { anyExample, CALC_EXAMPLES } from "@/lib/learn/inventory-examples";
import { explainPeriod, explainSolve, m, pc, stepsToText, type TraceStep, u } from "@/lib/learn/inventory-explain";
import { type Metric, METRIC_LABEL, solveUnknowns } from "@/lib/learn/inventory-solver";
import { cn } from "@/lib/utils";
import { FireTab } from "./inventory-calc-fire";
import { Check, Choice, NumField, primaryBtn, Select, smallBtn, TextField } from "./inventory-calc-fields";
import {
  ASKS,
  build,
  type Built,
  type CalcState,
  defaultState,
  type DiscountForm,
  emptyDiscount,
  emptyExtra,
  emptyPurchase,
  emptySale,
  emptyState,
  emptyYear,
  fromExample,
  loadState,
  type PurchaseForm,
  saveState,
  type Tab,
  uid,
  type YearForm,
} from "./inventory-calc-state";
import { TableTab } from "./inventory-calc-table";
import { LOAD_EVENT } from "./inventory-interactive";
import { TraceStepView } from "./inventory-trace";
import { EntryView, Money, Scroller } from "./ui";

export type Update = (fn: (s: CalcState) => CalcState) => void;

const noop = () => () => {};

/** Rendered only in the browser, so the saved form can be read without a hydration mismatch. */
export function InventoryCalculator() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  if (!ready) return <div className="card p-6 text-sm text-muted">טוען את המחשבון…</div>;
  return <Calculator />;
}

const TABS: [Tab, string][] = [
  ["full", "① פתרון מלא (תנועות)"],
  ["table", "② דוח עם חסרים"],
  ["fire", "③ שיעור גולמי ושריפה"],
];

function Calculator() {
  const [st, dispatch] = useReducer((s: CalcState, fn: (s: CalcState) => CalcState) => fn(s), undefined, () => loadState() ?? defaultState());
  const set: Update = dispatch;
  useEffect(() => saveState(st), [st]);
  useEffect(() => {
    const on = (e: Event) => {
      const ex = anyExample((e as CustomEvent<{ id: string }>).detail?.id);
      if (ex) dispatch(() => fromExample(ex));
    };
    window.addEventListener(LOAD_EVENT, on);
    return () => window.removeEventListener(LOAD_EVENT, on);
  }, []);

  const onTabKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex(([t]) => t === st.tab);
    // Right-to-left: the left arrow moves to the next tab.
    const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = TABS[(i + d + TABS.length) % TABS.length][0];
    set((s) => ({ ...s, tab: next }));
    document.getElementById(`inv-tab-${next}`)?.focus();
  };

  return (
    <div className="card overflow-hidden">
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-[17px] font-semibold text-fg">מחשבון מלאי</p>
        <label className="sr-only" htmlFor="inv-example">
          טענו דוגמה
        </label>
        <select
          id="inv-example"
          value=""
          onChange={(e) => {
            const ex = anyExample(e.target.value);
            if (ex) set(() => fromExample(ex));
          }}
          className="h-10 rounded-lg border border-line-strong bg-surface px-2 text-sm text-fg"
        >
          <option value="">טענו דוגמה…</option>
          {CALC_EXAMPLES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title}
            </option>
          ))}
        </select>
        <button type="button" className={smallBtn} onClick={() => set(() => defaultState())}>
          <RotateCcw className="h-4 w-4" aria-hidden /> אפס
        </button>
        <button
          type="button"
          className={smallBtn}
          onClick={() => {
            if (window.confirm("לנקות את כל הנתונים במחשבון?")) set(() => ({ ...emptyState(), tab: st.tab }));
          }}
        >
          <Eraser className="h-4 w-4" aria-hidden /> נקו הכול
        </button>
      </div>
      <div role="tablist" aria-label="סוג השאלה" className="no-print flex gap-1 overflow-x-auto border-b border-line px-3 pt-2" onKeyDown={onTabKey}>
        {TABS.map(([t, label]) => (
          <button
            key={t}
            id={`inv-tab-${t}`}
            role="tab"
            type="button"
            aria-selected={st.tab === t}
            aria-controls={`inv-panel-${t}`}
            tabIndex={st.tab === t ? 0 : -1}
            onClick={() => set((s) => ({ ...s, tab: t }))}
            className={cn("min-h-10 shrink-0 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap", st.tab === t ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg")}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`inv-panel-${st.tab}`} aria-labelledby={`inv-tab-${st.tab}`} className="p-4">
        {st.tab === "full" && <FullTab st={st} set={set} />}
        {st.tab === "table" && <TableTab st={st} set={set} />}
        {st.tab === "fire" && <FireTab st={st} set={set} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: the guided questionnaire and the full solution.

const STEP_TITLES = ["מה מבקשים?", "שנה וחברה", "שיטת ההערכה", "מלאי פתיחה", "רכישות", "מכירות", "שמ״נ וסיווג", "נתונים ידועים", "סיכום ופתרון"];
const STEP_WHERE = [
  "בסעיף ה״נדרש״ — בדרך כלל בסוף השאלה.",
  "בכותרת: שם החברה ותאריך ההקמה.",
  "בנתונים הנוספים: ״החברה מנהלת את המלאי לפי…״.",
  "בתחילת השאלה, או בסגירה של השנה הקודמת.",
  "בטבלת הנתונים, ובנתונים הנוספים (הנחות, מכס, הובלה, מימון).",
  "בטבלת הנתונים; הנחות והחזרות ללקוחות — בנתונים הנוספים.",
  "בנתונים הנוספים: ״שווי מימוש נטו…״, ״מלאי במשגור…״.",
  "בנתונים: ״עלות המכר הייתה…״, ״שיעור הרווח הגולמי…״, ״בסוף השנה נותרו…״.",
  "",
];

const METRICS: [Metric, string][] = (Object.keys(METRIC_LABEL) as Metric[]).map((k) => [k, METRIC_LABEL[k]]);

function FullTab({ st, set }: { st: CalcState; set: Update }) {
  const built = useMemo(() => build(st), [st]);
  const method: Method = st.method === "compare" ? "fifo" : st.method;
  const solution = useMemo(() => solveAll(st, built, method), [st, built, method]);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="no-print min-w-0">
        <Wizard st={st} set={set} built={built} solution={solution} />
      </div>
      <div className="min-w-0 lg:sticky lg:top-24">
        <Results st={st} built={built} solution={solution} method={method} />
      </div>
    </div>
  );
}

type Solution = { error?: string; results?: PeriodResult[]; solveSteps: TraceStep[]; periods?: Built["periods"]; solved?: ReturnType<typeof solveUnknowns> };

function solveAll(st: CalcState, built: Built, method: Method): Solution {
  if (Object.keys(built.errors).length) return { error: "יש שדות לתיקון (מסומנים באדום).", solveSteps: [] };
  const opts = { system: st.system, rounding: built.rounding, carryWriteDown: st.carryWriteDown, salesFirstOnTie: st.salesFirst };
  let periods = built.periods;
  let solveSteps: TraceStep[] = [];
  let solved: Solution["solved"];
  if (built.unknowns.length || built.knowns.length) {
    solved = solveUnknowns(periods, method, built.unknowns, built.knowns, opts);
    solveSteps = explainSolve(solved);
    if (!solved.ok) return { error: solved.error, solveSteps, solved };
    periods = solved.periods;
  }
  return { results: valuateChain(periods, method, opts), periods, solveSteps, solved };
}

function Wizard({ st, set, built, solution }: { st: CalcState; set: Update; built: Built; solution: Solution }) {
  const go = (n: number) => set((s) => ({ ...s, step: n, visited: s.visited.includes(n) ? s.visited : [...s.visited, n] }));
  const y = st.years[st.activeYear] ?? st.years[0];
  const ay = Math.min(st.activeYear, st.years.length - 1);
  const setYear = (fn: (y: YearForm) => YearForm) => set((s) => ({ ...s, years: s.years.map((x, i) => (i === ay ? fn(x) : x)) }));
  const err = (k: string) => built.errors[`y${ay}.${k}`];
  const perYear = st.step >= 3 && st.step <= 6;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>
            שלב <span className="num">{st.step + 1}</span> מתוך <span className="num">{STEP_TITLES.length}</span>
          </span>
          <span className="num">{Math.round(((st.step + 1) / STEP_TITLES.length) * 100)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full bg-accent transition-[width]" style={{ width: `${((st.step + 1) / STEP_TITLES.length) * 100}%` }} />
        </div>
        <nav aria-label="שלבי השאלון" className="mt-2 flex flex-wrap gap-1">
          {STEP_TITLES.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => go(i)}
              disabled={!st.visited.includes(i)}
              aria-current={st.step === i ? "step" : undefined}
              className={cn("rounded-md px-2 py-1 text-[11.5px]", st.step === i ? "bg-accent text-accent-fg" : st.visited.includes(i) ? "bg-surface-2 text-fg hover:bg-line" : "text-subtle")}
            >
              <span className="num">{i + 1}</span> {t}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-[16px] font-semibold text-fg">{stepQuestion(st.step)}</p>
        {STEP_WHERE[st.step] && <p className="mt-0.5 text-xs text-muted">איפה זה בשאלה? {STEP_WHERE[st.step]}</p>}

        {perYear && <YearTabs st={st} set={set} />}

        <div className="mt-4 space-y-4">
          {st.step === 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="מה מבקשים">
              {ASKS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={st.asks.includes(a)}
                  onClick={() => set((s) => ({ ...s, asks: s.asks.includes(a) ? s.asks.filter((x) => x !== a) : [...s.asks, a] }))}
                  className={cn(smallBtn, st.asks.includes(a) && "bg-accent-soft ring-accent/60")}
                >
                  {a}
                </button>
              ))}
              {st.asks.includes("שיפוי ביטוח") && (
                <p className="w-full text-sm text-fg">
                  שאלת ביטוח?{" "}
                  <button type="button" className="font-semibold text-accent underline" onClick={() => set((s) => ({ ...s, tab: "fire" }))}>
                    עברו ללשונית ③
                  </button>{" "}
                  — את ההיסטוריה (רכישות ומכירות) ממלאים כאן, והמחשבון ישתמש בה.
                </p>
              )}
              {st.asks.includes("ערך נעלם") && <p className="w-full text-xs text-muted">בכל שדה מספרי יש כפתור ? — לחצו עליו כדי לסמן את הנעלם, ובשלב 8 הזינו את הנתון שמגדיר אותו.</p>}
            </div>
          )}

          {st.step === 1 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="שם החברה (לתצוגה)" value={st.company} onChange={(v) => set((s) => ({ ...s, company: v }))} />
                <Select
                  label="מדיניות עיגול"
                  value={st.rounding}
                  onChange={(v) => set((s) => ({ ...s, rounding: v }))}
                  options={[
                    ["exact", "דיוק מלא (תצוגה ב-2 ספרות)"],
                    ["unit", "עיגול עלות ליחידה לפני הכפלה"],
                    ["amount", "עיגול סכומים"],
                  ]}
                />
                {st.rounding !== "exact" && <NumField label="מספר ספרות אחרי הנקודה" value={st.roundDigits} onChange={(v) => set((s) => ({ ...s, roundDigits: v }))} />}
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-fg">שנים בשאלה</p>
                {st.years.map((x, i) => (
                  <div key={x.id} className="flex flex-wrap items-end gap-2">
                    <TextField label={`שנה ${i + 1}`} value={x.label} onChange={(v) => set((s) => ({ ...s, years: s.years.map((z, j) => (j === i ? { ...z, label: v } : z)) }))} className="w-32" />
                    {i === 0 ? (
                      <Check label="החברה הוקמה השנה (אין מלאי פתיחה)" checked={x.founded} onChange={(v) => set((s) => ({ ...s, years: s.years.map((z, j) => (j === 0 ? { ...z, founded: v } : z)) }))} />
                    ) : (
                      <button
                        type="button"
                        className={smallBtn}
                        aria-label={`הסירו את ${x.label}`}
                        onClick={() => set((s) => ({ ...s, years: s.years.filter((_, j) => j !== i), activeYear: 0, knowns: s.knowns.filter((k) => k.year !== i).map((k) => ({ ...k, year: k.year > i ? k.year - 1 : k.year })) }))}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                ))}
                {st.years.length < 5 && (
                  <button
                    type="button"
                    className={smallBtn}
                    onClick={() => set((s) => ({ ...s, years: [...s.years, emptyYear(String((Number(s.years.at(-1)?.label) || 2024) + 1), false)] }))}
                  >
                    <Plus className="h-4 w-4" aria-hidden /> הוסיפו שנה
                  </button>
                )}
                <p className="text-xs text-muted">מלאי הפתיחה של כל שנה נלקח אוטומטית מהסגירה בספרים של השנה הקודמת.</p>
              </div>
            </>
          )}

          {st.step === 2 && (
            <>
              <Choice
                label="שיטת ההערכה"
                value={st.method}
                onChange={(v) => set((s) => ({ ...s, method: v }))}
                options={[
                  ["fifo", "FIFO", "״פיפ״ו״, ״נרי״ר״, ״נכנס ראשון יוצא ראשון״"],
                  ["wa-periodic", "ממוצע משוקלל תקופתי", "״ממוצע משוקלל תקופתי / שנתי״"],
                  ["moving-avg", "ממוצע משוקלל נע", "״ממוצע נע״, ״מלאי תמידי״"],
                  ["compare", "לא ידוע — השוו כולן", "הפתרון לפי FIFO, וטבלת השוואה לשלוש"],
                ]}
              />
              {(st.method === "fifo" || st.method === "compare") && (
                <Select<System>
                  label="שיטת רישום (משפיעה רק על פקודות היומן ב-FIFO)"
                  value={st.system}
                  onChange={(v) => set((s) => ({ ...s, system: v }))}
                  options={[
                    ["periodic", "מלאי תקופתי"],
                    ["perpetual", "מלאי תמידי"],
                  ]}
                />
              )}
              {st.method === "wa-periodic" && <p className="text-xs text-muted">ממוצע תקופתי ← שיטה תקופתית.</p>}
              {st.method === "moving-avg" && <p className="text-xs text-muted">ממוצע נע ← שיטה תמידית: צריך תאריך לכל רכישה ומכירה.</p>}
              <Check label="באותו תאריך — מכירות לפני רכישות" checked={st.salesFirst} onChange={(v) => set((s) => ({ ...s, salesFirst: v }))} hint="ברירת המחדל: רכישות קודם" />
            </>
          )}

          {st.step === 3 && (
            <>
              {ay === 0 && y.founded ? (
                <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg">החברה הוקמה השנה — מלאי הפתיחה אפס (אפשר לשנות בשלב 2).</p>
              ) : ay > 0 && y.fromPrev ? (
                <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg">מלאי הפתיחה נלקח מהסגירה בספרים של {st.years[ay - 1].label}.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumField label="יחידות במלאי הפתיחה" value={y.openUnits} onChange={(v) => setYear((x) => ({ ...x, openUnits: { ...x.openUnits, v } }))} error={err("openUnits")} letter={built.letters[`y${ay}.openUnits`]} onToggleUnknown={() => setYear((x) => ({ ...x, openUnits: { ...x.openUnits, unknown: !x.openUnits.unknown } }))} />
                  <NumField label="עלות מלאי הפתיחה (סה״כ)" suffix="₪" value={y.openCost} onChange={(v) => setYear((x) => ({ ...x, openCost: { ...x.openCost, v } }))} error={err("openCost")} letter={built.letters[`y${ay}.openCost`]} onToggleUnknown={() => setYear((x) => ({ ...x, openCost: { ...x.openCost, unknown: !x.openCost.unknown } }))} />
                </div>
              )}
              {ay > 0 && <Check label="קחו מסגירת השנה הקודמת" checked={y.fromPrev} onChange={(v) => setYear((x) => ({ ...x, fromPrev: v }))} />}
            </>
          )}

          {st.step === 4 && (
            <>
              {y.purchases.map((p, i) => (
                <PurchaseRow key={p.id} p={p} i={i} ay={ay} built={built} setYear={setYear} />
              ))}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={smallBtn} onClick={() => setYear((x) => ({ ...x, purchases: [...x.purchases, emptyPurchase()] }))}>
                  <Plus className="h-4 w-4" aria-hidden /> הוסיפו רכישה
                </button>
                <button type="button" className={smallBtn} onClick={() => setYear((x) => ({ ...x, purchases: [...x.purchases].sort((a, b) => (a.date || "~").localeCompare(b.date || "~")) }))}>
                  מיון לפי תאריך
                </button>
              </div>
            </>
          )}

          {st.step === 5 && (
            <>
              {y.sales.map((x, i) => {
                const sk = (s: string) => `s${i}.${s}`;
                const setS = (patch: Partial<typeof x>) => setYear((yy) => ({ ...yy, sales: yy.sales.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));
                return (
                  <div key={x.id} className="rounded-xl border border-line p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-fg">מכירה {i + 1}</p>
                      <button type="button" className={smallBtn} aria-label={`הסירו את מכירה ${i + 1}`} onClick={() => setYear((yy) => ({ ...yy, sales: yy.sales.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <TextField label="תאריך" type="date" value={x.date} onChange={(v) => setS({ date: v })} />
                        {err(sk("date")) && <p className="mt-1 text-xs text-danger">{err(sk("date"))}</p>}
                      </div>
                      <NumField label="כמות" value={x.qty} onChange={(v) => setS({ qty: { ...x.qty, v } })} error={err(sk("qty"))} letter={built.letters[`y${ay}.${sk("qty")}`]} onToggleUnknown={() => setS({ qty: { ...x.qty, unknown: !x.qty.unknown } })} />
                      <NumField label="מחיר ליחידה" suffix="₪" value={x.price} onChange={(v) => setS({ price: { ...x.price, v } })} error={err(sk("price"))} letter={built.letters[`y${ay}.${sk("price")}`]} onToggleUnknown={() => setS({ price: { ...x.price, unknown: !x.price.unknown } })} />
                    </div>
                  </div>
                );
              })}
              <button type="button" className={smallBtn} onClick={() => setYear((x) => ({ ...x, sales: [...x.sales, emptySale()] }))}>
                <Plus className="h-4 w-4" aria-hidden /> הוסיפו מכירה
              </button>
              <details className="rounded-xl border border-line p-3">
                <summary className="cursor-pointer text-sm font-semibold text-fg">הנחות והחזרות ללקוחות</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <NumField label="הנחות ללקוחות (סה״כ)" suffix="₪" value={y.custDiscounts} onChange={(v) => setYear((x) => ({ ...x, custDiscounts: v }))} error={err("custDisc")} />
                  <NumField label="החזרות מלקוחות (סה״כ)" suffix="₪" value={y.custReturns} onChange={(v) => setYear((x) => ({ ...x, custReturns: v }))} error={err("custRet")} />
                  <NumField label="הנחת כמות ללקוח: מעל כמה יחידות" value={y.saleDiscThreshold} onChange={(v) => setYear((x) => ({ ...x, saleDiscThreshold: v }))} error={err("sdThr")} />
                  <NumField label="…הנחה על כל המכירה" suffix="%" value={y.saleDiscPct} onChange={(v) => setYear((x) => ({ ...x, saleDiscPct: v }))} error={err("sdPct")} />
                </div>
              </details>
            </>
          )}

          {st.step === 6 && (
            <>
              <Select
                label="שווי מימוש נטו בסוף השנה"
                value={y.nrvMode}
                onChange={(v) => setYear((x) => ({ ...x, nrvMode: v }))}
                options={[
                  ["none", "אין נתון שמ״נ"],
                  ["unit", "שמ״נ ליחידה"],
                  ["build", "מחיר מכירה − השלמה − מכירה"],
                  ["total", "שמ״נ כולל (סכום)"],
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {y.nrvMode === "unit" && <NumField label="שמ״נ ליחידה" suffix="₪" value={y.nrvUnit} onChange={(v) => setYear((x) => ({ ...x, nrvUnit: v }))} error={err("nrvUnit")} />}
                {y.nrvMode === "total" && <NumField label="שמ״נ כולל" suffix="₪" value={y.nrvTotal} onChange={(v) => setYear((x) => ({ ...x, nrvTotal: v }))} error={err("nrvTotal")} />}
                {y.nrvMode === "build" && (
                  <>
                    <NumField label="מחיר מכירה צפוי ליחידה" suffix="₪" value={y.nrvPrice} onChange={(v) => setYear((x) => ({ ...x, nrvPrice: v }))} error={err("nrvPrice")} />
                    <NumField label="עלויות השלמה ליחידה" suffix="₪" value={y.nrvCompletion} onChange={(v) => setYear((x) => ({ ...x, nrvCompletion: v }))} error={err("nrvCompletion")} />
                    <NumField label="עלויות מכירה ליחידה" suffix="₪" value={y.nrvSelling} onChange={(v) => setYear((x) => ({ ...x, nrvSelling: v }))} error={err("nrvSelling")} />
                  </>
                )}
              </div>
              {y.nrvMode !== "none" && (
                <NumField
                  label="שווי הוגן (אם מופיע בשאלה) — מסיח, לא נכנס לחישוב"
                  suffix="₪"
                  value={y.fair}
                  onChange={(v) => setYear((x) => ({ ...x, fair: v }))}
                  className="sm:max-w-xs"
                />
              )}
              {y.fair && <p className="text-xs text-muted">שמ״נ הוא ערך ספציפי לחברה; שווי הוגן הוא מחיר שוק. המחשבון מתעלם מהשווי ההוגן.</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <NumField label="הורדת ערך שכבר רשומה במלאי הפתיחה" suffix="₪" value={y.priorWriteDown} onChange={(v) => setYear((x) => ({ ...x, priorWriteDown: v }))} error={err("prior")} />
                <NumField label="כמות שנספרה בפועל (אם שונה מהספרים)" value={y.counted} onChange={(v) => setYear((x) => ({ ...x, counted: v }))} error={err("counted")} />
              </div>
              {st.years.length > 1 && <Check label="העבירו הורדת ערך לשנה הבאה לבדיקת ביטול" checked={st.carryWriteDown} onChange={(v) => set((s) => ({ ...s, carryWriteDown: v }))} hint="כשהפריטים שהורד ערכם עדיין במלאי" />}
              <div className="rounded-lg bg-surface-2/70 px-3 py-2 text-[13px] text-fg">
                <p className="font-semibold">תזכורת סיווג (פרק 11):</p>
                <p>מלאי בדרך — לפי מעבר הסיכון · משגור שמסרנו — שלנו · מכור והחזק — לא שלנו · דוגמיות — לא מלאי. אם הספירה כוללת פריטים כאלה — תקנו את הכמות שנספרה.</p>
                <a href="#inv-count" className="font-semibold text-accent underline">
                  לפרק הסיווג
                </a>
              </div>
            </>
          )}

          {st.step === 7 && <KnownsStep st={st} set={set} built={built} />}

          {st.step === 8 && <Summary st={st} built={built} solution={solution} go={go} />}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" className={smallBtn} onClick={() => go(Math.max(0, st.step - 1))} disabled={st.step === 0}>
          <ChevronRight className="h-4 w-4" aria-hidden /> הקודם
        </button>
        <StatusLine built={built} solution={solution} />
        <button type="button" className={primaryBtn} onClick={() => (st.step === 8 ? document.getElementById("inv-results")?.scrollIntoView({ block: "start" }) : go(st.step + 1))}>
          {st.step === 8 ? "לפתרון" : "הבא"} <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function stepQuestion(step: number) {
  return ["מה מבקשים בשאלה?", "על איזו שנה ואיזו חברה?", "מה שיטת ההערכה בשאלה?", "יש מלאי פתיחה?", "מה נרכש?", "מה נמכר?", "יש שמ״נ או בעיות סיווג?", "יש עוד נתונים מהשאלה, או משהו שחסר?", "סיכום ופתרון"][step];
}

function YearTabs({ st, set }: { st: CalcState; set: Update }) {
  if (st.years.length < 2) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="שנה">
      {st.years.map((y, i) => (
        <button key={y.id} type="button" aria-pressed={st.activeYear === i} onClick={() => set((s) => ({ ...s, activeYear: i }))} className={cn(smallBtn, "min-h-8 px-2.5 py-1 text-xs", st.activeYear === i && "bg-accent text-accent-fg ring-accent")}>
          {y.label}
        </button>
      ))}
    </div>
  );
}

const EXTRA_QUICK: [ExtraCategory, ExtraBasis, string][] = [
  ["duty", "pct-of-net-price", "מכס (%)"],
  ["freight", "per-shipment", "הובלה למשלוח"],
  ["freight", "per-unit", "הובלה ליחידה"],
  ["freight", "per-pack", "הובלה לארגז"],
  ["freight", "per-kg", "הובלה לק״ג"],
  ["handling", "per-shipment", "טיפול / נמל"],
  ["storage-required", "per-unit", "אחסון הכרחי"],
  ["storage", "per-unit", "אחסון רגיל"],
  ["vat", "pct-of-net-price", "מע״מ בר-קיזוז"],
  ["selling", "per-unit", "הובלה ללקוח"],
  ["other", "per-shipment", "אחר"],
];
const BASIS_LABEL: Record<ExtraBasis, string> = { "per-shipment": "למשלוח", "per-unit": "ליחידה", "per-pack": "לארגז", "per-kg": "לק״ג", "pct-of-net-price": "% מהמחיר נטו" };

function PurchaseRow({ p, i, ay, built, setYear }: { p: PurchaseForm; i: number; ay: number; built: Built; setYear: (fn: (y: YearForm) => YearForm) => void }) {
  const [open, setOpen] = useState(p.discounts.length > 0 || p.extras.length > 0 || !!p.financing);
  const k = (s: string) => `y${ay}.p${i}.${s}`;
  const err = (s: string) => built.errors[k(s)];
  const setP = (fn: (p: PurchaseForm) => PurchaseForm) => setYear((y) => ({ ...y, purchases: y.purchases.map((z, j) => (j === i ? fn(z) : z)) }));
  const setD = (j: number, patch: Partial<DiscountForm>) => setP((x) => ({ ...x, discounts: x.discounts.map((d, n) => (n === j ? { ...d, ...patch } : d)) }));
  const engine = built.periods[ay]?.purchases[i];
  const cost = engine && !p.qty.unknown && !p.price.unknown && engine.qty > 0 ? purchaseCost(engine) : null;
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-fg">רכישה {i + 1}</p>
        <div className="flex gap-1">
          <button type="button" className={cn(smallBtn, "text-xs")} onClick={() => setYear((y) => ({ ...y, purchases: [...y.purchases.slice(0, i + 1), { ...structuredClone(p), id: uid() }, ...y.purchases.slice(i + 1)] }))}>
            שכפול
          </button>
          <button type="button" className={smallBtn} aria-label={`הסירו את רכישה ${i + 1}`} onClick={() => setYear((y) => ({ ...y, purchases: y.purchases.filter((_, j) => j !== i) }))}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <TextField label="תאריך" type="date" value={p.date} onChange={(v) => setP((x) => ({ ...x, date: v }))} />
          {err("date") && <p className="mt-1 text-xs text-danger">{err("date")}</p>}
        </div>
        <NumField label="כמות" value={p.qty} onChange={(v) => setP((x) => ({ ...x, qty: { ...x.qty, v } }))} error={err("qty")} letter={built.letters[k("qty")]} onToggleUnknown={() => setP((x) => ({ ...x, qty: { ...x.qty, unknown: !x.qty.unknown } }))} />
        <NumField label="מחיר ליחידה" suffix="₪" value={p.price} onChange={(v) => setP((x) => ({ ...x, price: { ...x.price, v } }))} error={err("price")} letter={built.letters[k("price")]} onToggleUnknown={() => setP((x) => ({ ...x, price: { ...x.price, unknown: !x.price.unknown } }))} />
      </div>
      {cost && (
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          עלות הרכישה: <Money v={cost.total} /> (<Money v={cost.perUnit} /> ליחידה)
          {cost.excluded > 0 && <> · מחוץ לעלות: <Money v={cost.excluded} /></>}
          {cost.financing > 0 && <> · הוצאות מימון: <Money v={cost.financing} /></>}
        </p>
      )}
      <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden /> עלויות נלוות והנחות
      </button>
      {open && (
        <div className="mt-3 space-y-4 border-t border-line pt-3">
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-fg">הנחות (על מחיר הרכישה בלבד)</p>
            {p.discounts.map((d, j) => {
              const dk = (s: string) => `d${j}.${s}`;
              return (
                <div key={j} className="space-y-2 rounded-lg bg-surface-2/50 p-2.5">
                  <div className="flex items-end gap-2">
                    <Select
                      label="סוג ההנחה"
                      className="flex-1"
                      value={d.kind}
                      onChange={(v) => setD(j, { kind: v })}
                      options={[
                        ["qty-whole", "כמות: על כל הרכישה"],
                        ["qty-excess", "כמות: רק על העודף"],
                        ["per-unit-above", "₪ ליחידה מעבר ליחידה ה-N"],
                        ["target", "יעד מצטבר (מותנה)"],
                      ]}
                    />
                    <button type="button" className={smallBtn} aria-label="הסירו הנחה" onClick={() => setP((x) => ({ ...x, discounts: x.discounts.filter((_, n) => n !== j) }))}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {d.kind !== "target" && <NumField label={d.kind === "per-unit-above" ? "מעבר ליחידה ה-" : "מעל כמה יחידות"} value={d.threshold} onChange={(v) => setD(j, { threshold: v })} error={err(dk("threshold"))} />}
                    {d.kind === "per-unit-above" ? (
                      <NumField label="הנחה ליחידה" suffix="₪" value={d.amount} onChange={(v) => setD(j, { amount: v })} error={err(dk("amount"))} />
                    ) : (
                      <NumField label="שיעור ההנחה" suffix="%" value={d.pct} onChange={(v) => setD(j, { pct: { ...d.pct, v } })} error={err(dk("pct"))} letter={built.letters[`y${ay}.disc`]} onToggleUnknown={() => setD(j, { pct: { ...d.pct, unknown: !d.pct.unknown } })} />
                    )}
                    <TextField label="בתוקף מתאריך" type="date" value={d.from} onChange={(v) => setD(j, { from: v })} />
                    <TextField label="עד תאריך" type="date" value={d.to} onChange={(v) => setD(j, { to: v })} />
                  </div>
                  {d.kind === "target" && (
                    <div className="space-y-1.5">
                      <Check label="התנאי בשליטה הבלעדית של החברה (למשל יעד רכישות)" checked={d.controlled} onChange={(v) => setD(j, { controlled: v })} />
                      <Check label="החברה צופה לעמוד ביעד" checked={d.expected} onChange={(v) => setD(j, { expected: v })} />
                      <Check label="היעד הושג בפועל" checked={d.achieved} onChange={(v) => setD(j, { achieved: v })} />
                      <p className="text-xs text-muted">מכירים בהנחה רק אם הושג, או אם בשליטה וגם צפוי.</p>
                    </div>
                  )}
                  {d.pct.unknown && <p className="text-xs text-accent">השיעור הזה נעלם — אותו שיעור לכל ההנחות המסומנות ? בשנה. הזינו בשלב 8 &quot;הנחה ברכישה מסוימת&quot;.</p>}
                </div>
              );
            })}
            <button type="button" className={cn(smallBtn, "text-xs")} onClick={() => setP((x) => ({ ...x, discounts: [...x.discounts, emptyDiscount()] }))}>
              <Plus className="h-4 w-4" aria-hidden /> הנחה
            </button>
            {p.discounts.length > 0 && (
              <button
                type="button"
                className={cn(smallBtn, "ms-2 text-xs")}
                onClick={() => setYear((y) => ({ ...y, purchases: y.purchases.map((z, n) => (n === i ? z : { ...z, discounts: structuredClone(p.discounts) })) }))}
              >
                החילו את ההנחות על כל הרכישות
              </button>
            )}
          </div>
          <NumField label="תנאי אשראי חריגים: במזומן המחיר נמוך ב-" suffix="%" value={p.financing} onChange={(v) => setP((x) => ({ ...x, financing: v }))} error={err("financing")} className="sm:max-w-xs" />
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-fg">עלויות נלוות</p>
            {p.extras.map((e, j) => {
              const ek = (s: string) => `e${j}.${s}`;
              const info = EXTRA_INFO[e.category];
              const included = e.include === "auto" ? info.include : e.include === "in";
              const setE = (patch: Partial<typeof e>) => setP((x) => ({ ...x, extras: x.extras.map((z, n) => (n === j ? { ...z, ...patch } : z)) }));
              return (
                <div key={j} className={cn("rounded-lg p-2.5", included ? "bg-surface-2/50" : "bg-surface-2/30")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("flex-1 text-sm font-medium", included ? "text-fg" : "text-muted line-through")}>{e.label || info.label}</p>
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", included ? "bg-success/15 text-success" : "bg-danger/10 text-danger")} title={`${info.reason} (${info.section})`}>
                      {included ? "נכלל בעלות" : "← הוצאה בתקופה"}
                    </span>
                    <button type="button" className={smallBtn} aria-label="הסירו עלות" onClick={() => setP((x) => ({ ...x, extras: x.extras.filter((_, n) => n !== j) }))}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {info.reason} · {info.section}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <NumField label={`סכום ${BASIS_LABEL[e.basis]}`} suffix={e.basis === "pct-of-net-price" ? "%" : "₪"} value={e.amount} onChange={(v) => setE({ amount: v })} error={err(ek("amount"))} />
                    <Select label="יחידת חישוב" value={e.basis} onChange={(v) => setE({ basis: v })} options={(Object.keys(BASIS_LABEL) as ExtraBasis[]).map((b) => [b, BASIS_LABEL[b]])} />
                    {e.basis === "per-pack" && <NumField label="יחידות בארגז" value={e.packSize} onChange={(v) => setE({ packSize: v })} error={err(ek("packSize"))} />}
                    {e.basis === "per-kg" && <NumField label="ק״ג ליחידה" value={e.kgPerUnit} onChange={(v) => setE({ kgPerUnit: v })} error={err(ek("kg"))} />}
                    <Select
                      label="בעלות?"
                      value={e.include}
                      onChange={(v) => setE({ include: v })}
                      options={[
                        ["auto", `לפי הסוג (${info.include ? "נכלל" : "הוצאה"})`],
                        ["in", "נכלל בעלות"],
                        ["out", "הוצאה בתקופה"],
                      ]}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-1">
              {EXTRA_QUICK.map(([c, b, l]) => (
                <button key={l} type="button" className={cn(smallBtn, "min-h-8 px-2 py-1 text-xs")} onClick={() => setP((x) => ({ ...x, extras: [...x.extras, emptyExtra(c, b)] }))}>
                  + {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KnownsStep({ st, set, built }: { st: CalcState; set: Update; built: Built }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg/90">הזינו כאן נתונים שהשאלה נותנת כתוצאה (למשל ״עלות המכר הייתה…״). כל נתון כזה מגדיר נעלם אחד.</p>
      {st.knowns.map((k, i) => {
        const needsIndex = k.metric === "saleCost" || k.metric === "purchaseDiscount" || k.metric === "purchaseTotal";
        const setK = (patch: Partial<typeof k>) => set((s) => ({ ...s, knowns: s.knowns.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
        return (
          <div key={k.id} className="grid items-end gap-2 rounded-lg bg-surface-2/50 p-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Select label="מה ידוע" value={k.metric} onChange={(v) => setK({ metric: v })} options={METRICS} />
            {st.years.length > 1 ? (
              <Select label="שנה" value={String(k.year)} onChange={(v) => setK({ year: Number(v) })} options={st.years.map((y, j) => [String(j), y.label])} />
            ) : needsIndex ? null : (
              <span />
            )}
            {needsIndex && <NumField label={k.metric === "saleCost" ? "מכירה מס'" : "רכישה מס'"} value={k.index} onChange={(v) => setK({ index: v })} error={built.errors[`k${i}.idx`]} />}
            <NumField label="ערך" suffix={k.metric === "gpPct" ? "%" : k.metric === "closingUnits" ? "יח'" : "₪"} value={k.value} onChange={(v) => setK({ value: v })} error={built.errors[`k${i}`]} />
            <button type="button" className={smallBtn} aria-label="הסירו נתון" onClick={() => set((s) => ({ ...s, knowns: s.knowns.filter((_, j) => j !== i) }))}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        );
      })}
      <button type="button" className={smallBtn} onClick={() => set((s) => ({ ...s, knowns: [...s.knowns, { id: uid(), year: s.activeYear, metric: "closingUnits", index: "", value: "" }] }))}>
        <Plus className="h-4 w-4" aria-hidden /> הוסיפו נתון ידוע
      </button>
      <div className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm">
        <p className="font-semibold text-fg">נעלמים שסומנו ({built.unknowns.length}):</p>
        {built.unknowns.length ? (
          <ul className="mt-1 list-inside list-disc text-fg/90">
            {built.unknowns.map((x) => (
              <li key={x.id}>{x.label}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">אין. לחצו ? ליד שדה כדי לסמן נעלם.</p>
        )}
      </div>
    </div>
  );
}

function StatusLine({ built, solution }: { built: Built; solution: Solution }) {
  const nu = built.unknowns.length;
  const nk = built.knowns.length;
  let text: string;
  let ok = true;
  if (nu > nk) {
    ok = false;
    text = `חסר נתון שמגדיר נעלם — למשל כמות במלאי הסגירה, עלות מכירה או שיעור גולמי`;
  } else if (nu > 3) {
    ok = false;
    text = "עד שלושה נעלמים";
  } else if (solution.error) {
    ok = false;
    text = solution.error;
  } else if (nk > nu) text = `${nu} נעלמים · ${nk} נתונים — נבדוק עקביות ✔`;
  else text = nu ? `נמצאו ${nu} נעלמים · ${nk} נתונים ידועים — אפשר לפתור ✔` : "הנתונים תקינים ✔";
  return (
    <p className={cn("min-w-0 flex-1 text-center text-xs", ok ? "text-success" : "text-danger")} aria-live="polite">
      {text}
    </p>
  );
}

function Summary({ st, built, solution, go }: { st: CalcState; built: Built; solution: Solution; go: (n: number) => void }) {
  const issues = Object.values(built.errors);
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-1.5">
        {[
          ["מבקשים", st.asks.join(", ") || "—", 0],
          ["שיטה", st.method === "compare" ? "השוואת כל השיטות" : METHOD_LABEL[st.method], 2],
          ["שנים", st.years.map((y) => y.label).join(", "), 1],
          ["רכישות", st.years.map((y) => `${y.label}: ${y.purchases.length}`).join(" · "), 4],
          ["מכירות", st.years.map((y) => `${y.label}: ${y.sales.length}`).join(" · "), 5],
          ["נעלמים / נתונים", `${built.unknowns.length} / ${built.knowns.length}`, 7],
        ].map(([k, v, n]) => (
          <div key={k as string} className="flex flex-wrap items-baseline gap-2">
            <dt className="w-28 shrink-0 text-muted">{k}</dt>
            <dd className="flex-1 text-fg">{v}</dd>
            <button type="button" className="text-xs font-semibold text-accent underline" onClick={() => go(n as number)}>
              ערכו
            </button>
          </div>
        ))}
      </dl>
      {(issues.length > 0 || solution.error) && (
        <div className="rounded-lg border border-danger/40 bg-danger/[0.06] px-3 py-2">
          <p className="font-semibold text-danger">מה לתקן:</p>
          <ul className="list-inside list-disc text-fg">
            {[...new Set(issues)].map((x) => (
              <li key={x}>{x}</li>
            ))}
            {solution.error && issues.length === 0 && <li>{solution.error}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The solution panel.

function Results({ st, built, solution, method }: { st: CalcState; built: Built; solution: Solution; method: Method }) {
  const ay = Math.min(st.activeYear, st.years.length - 1);
  const [sys, setSys] = useState<System | null>(null);
  const [guided, setGuided] = useState(false);
  const [reveal, setReveal] = useState(1);
  const [copied, setCopied] = useState(false);
  const r = solution.results?.[ay];
  const period = solution.periods?.[ay];
  const steps = useMemo(() => (r && period ? [...solution.solveSteps, ...explainPeriod(period, r)] : solution.solveSteps), [r, period, solution.solveSteps]);
  const compare = useMemo(() => (solution.periods ? compareMethods(solution.periods, { system: st.system, rounding: built.rounding, carryWriteDown: st.carryWriteDown, salesFirstOnTie: st.salesFirst }) : null), [solution.periods, st.system, built.rounding, st.carryWriteDown, st.salesFirst]);
  const entrySystem: System = sys ?? (method === "moving-avg" ? "perpetual" : method === "wa-periodic" ? "periodic" : st.system);

  if (!r || !period)
    return (
      <div id="inv-results" className="space-y-3">
        <div className="rounded-xl border border-danger/40 bg-danger/[0.06] px-4 py-3 text-sm text-fg" aria-live="polite">
          {solution.error ?? "הזינו לפחות רכישה אחת כדי לראות פתרון."}
        </div>
        {solution.solveSteps.length > 0 && solution.solveSteps.map((s) => <TraceStepView key={s.id} s={s} />)}
      </div>
    );

  const asked = (a: string) => st.asks.includes(a);
  const shownSteps = guided ? steps.slice(0, reveal) : steps;
  const trend = priceTrend(period);
  const text = () => `${st.company ? `${st.company} — ` : ""}${r.label}\n\n${stepsToText(steps)}`;

  return (
    <div id="inv-results" className="inv-print space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="me-auto text-[16px] font-semibold text-fg">
          הפתרון{st.company ? ` — ${st.company}` : ""} {st.years.length > 1 && <span className="text-muted">({r.label})</span>}
        </p>
        <Check label="נסו קודם בעצמכם" checked={guided} onChange={(v) => { setGuided(v); setReveal(1); }} />
      </div>
      <p className="sr-only" aria-live="polite">
        עלות המכר {m(r.cogs)}, רווח גולמי {m(r.grossProfit)}
      </p>
      {guided ? (
        <Guess r={r} />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="מלאי סגירה" value={<Money v={r.closingCarrying} />} hint={`${r.closingUnits.toLocaleString("he-IL", { maximumFractionDigits: 2 })} יח'`} tone={asked("מלאי סגירה") ? "accent" : "neutral"} />
          <Stat label="עלות המכר" value={<Money v={r.cogs} />} tone={asked("עלות המכר") ? "accent" : "neutral"} />
          <Stat label="רווח גולמי" value={<Money v={r.grossProfit} />} tone={asked("רווח גולמי") ? "accent" : "neutral"} />
          <Stat label="שיעור רווח גולמי" value={pc(r.gpPct)} tone={asked("שיעור גולמי") ? "accent" : "neutral"} />
          {r.writeDown > 0 && <Stat label="הורדת ערך" value={<Money v={r.writeDown} />} tone="warn" hint="נכללה בעלות המכר" />}
          {r.reversal > 0 && <Stat label="ביטול הורדת ערך" value={<Money v={r.reversal} />} tone="success" />}
          {Object.entries(solution.solved?.values ?? {}).map(([id, v]) => {
            const un = built.unknowns.find((x) => x.id === id);
            return <Stat key={id} label={un?.label ?? id} value={<bdi dir="ltr">{un?.ref.t === "discountPct" ? pc(v) : u(v)}</bdi>} hint={un?.ref.t === "discountPct" ? undefined : `מעוגל: ${m(v)}${st.rounding === "amount" && st.roundDigits === "0" ? ` (${Math.round(v)})` : ""}`} tone="success" />;
          })}
        </div>
      )}
      {[...r.errors, ...r.warnings].map((w) => (
        <p key={w} className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2 text-sm text-fg">
          ⚠ {w}
        </p>
      ))}

      <div className="space-y-2">
        {shownSteps.map((s, i) => (
          <details key={s.id + i} open className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-semibold text-fg [&::-webkit-details-marker]:hidden">
              <span className="num grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-accent-fg">{i + 1}</span>
              <span className="flex-1">{s.title}</span>
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-line px-4 py-3">
              <TraceStepView s={{ ...s, title: "" }} />
            </div>
          </details>
        ))}
        {guided && reveal < steps.length && (
          <button type="button" className={primaryBtn} onClick={() => setReveal((x) => x + 1)}>
            הצג צעד הבא ({reveal}/{steps.length})
          </button>
        )}
      </div>

      {(!guided || reveal >= steps.length) && (
        <>
          <Section title="פקודות יומן">
            <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="שיטת רישום לפקודות">
              {(["periodic", "perpetual"] as const).map((x) => (
                <button key={x} type="button" aria-pressed={entrySystem === x} onClick={() => setSys(x)} className={cn(smallBtn, "text-xs", entrySystem === x && "bg-accent text-accent-fg ring-accent")}>
                  {x === "periodic" ? "תקופתי" : "תמידי"}
                </button>
              ))}
            </div>
            <div className="max-h-[32rem] space-y-1 overflow-y-auto print-expand">
              {entriesFor(period, r, entrySystem, { payable: st.payable, receivable: st.receivable }).map((e) => (
                <EntryView key={e.id} entry={e} title={`${e.id}. ${e.text}`} effect={false} note={e.why ?? null} />
              ))}
            </div>
          </Section>

          {compare && (
            <Section title="השוואת שלוש השיטות">
              <Scroller>
                <table className="w-full min-w-[30rem] text-sm" aria-label="השוואת שלוש השיטות">
                  <thead>
                    <tr className="text-xs text-muted">
                      <th scope="col" className="px-3 py-2 text-start font-medium">שיטה</th>
                      <th scope="col" className="px-3 py-2 text-end font-medium">מלאי סגירה</th>
                      <th scope="col" className="px-3 py-2 text-end font-medium">עלות המכר</th>
                      <th scope="col" className="px-3 py-2 text-end font-medium">רווח גולמי</th>
                      <th scope="col" className="px-3 py-2 text-end font-medium">שיעור</th>
                    </tr>
                  </thead>
                  <tbody>
                    {METHODS.map((mm) => {
                      const x = compare[mm][ay];
                      return (
                        <tr key={mm} className={cn("border-t border-line/70", mm === method && "bg-accent-soft/60 font-semibold")}>
                          <th scope="row" className="px-3 py-1.5 text-start font-normal text-fg">{METHOD_LABEL[mm]}{mm === method && " ✓"}</th>
                          <td className="px-3 py-1.5 text-end"><Money v={x.closingCarrying} plain /></td>
                          <td className="px-3 py-1.5 text-end"><Money v={x.cogs} plain /></td>
                          <td className="px-3 py-1.5 text-end"><Money v={x.grossProfit} plain /></td>
                          <td className="px-3 py-1.5 text-end"><bdi dir="ltr" className="num">{pc(x.gpPct)}</bdi></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Scroller>
              {trend === "up" && <p className="text-sm text-fg/90">מחירי הרכישה עלו לאורך השנה ← FIFO מציג את הרווח הגולמי הגבוה ביותר.</p>}
              {trend === "down" && <p className="text-sm text-fg/90">מחירי הרכישה ירדו לאורך השנה ← FIFO מציג את הרווח הגולמי הנמוך ביותר.</p>}
            </Section>
          )}
        </>
      )}

      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          className={smallBtn}
          onClick={() => {
            navigator.clipboard?.writeText(text()).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              },
              () => {},
            );
          }}
        >
          <Copy className="h-4 w-4" aria-hidden /> {copied ? "הועתק ✓" : "העתק פתרון כטקסט"}
        </button>
        <button type="button" className={smallBtn} onClick={printSolution}>
          <Printer className="h-4 w-4" aria-hidden /> הדפסה
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border border-line bg-surface p-4">
      <h3 className="font-semibold text-fg">{title}</h3>
      {children}
    </section>
  );
}

/** Guided mode: guess each key number before seeing it. */
function Guess({ r }: { r: PeriodResult }) {
  const keys: [string, number, "qty" | "amount"][] = [
    ["כמות במלאי הסגירה", r.closingUnits, "qty"],
    ["מלאי סגירה (בספרים)", r.closingCarrying, "amount"],
    ["עלות המכר", r.cogs, "amount"],
    ["רווח גולמי", r.grossProfit, "amount"],
  ];
  const [g, setG] = useState<string[]>(keys.map(() => ""));
  const [shown, setShown] = useState<boolean[]>(keys.map(() => false));
  const okAt = (i: number) => {
    const x = Number(g[i].replace(/,/g, ""));
    return g[i].trim() !== "" && Number.isFinite(x) && Math.abs(x - keys[i][1]) <= 0.5;
  };
  const score = keys.filter((_, i) => okAt(i)).length;
  return (
    <div className="space-y-2 rounded-xl border border-accent/40 bg-accent-soft/40 p-3">
      <p className="text-sm font-semibold text-fg">
        נחשו לפני שאתם מסתכלים · קלעתם <span className="num">{score}</span> מתוך <span className="num">{keys.length}</span>
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map(([label, value], i) => (
          <div key={label}>
            <NumField label={label} value={g[i]} onChange={(v) => setG((s) => s.map((x, j) => (j === i ? v : x)))} />
            <p className="mt-1 flex items-center gap-2 text-xs" aria-live="polite">
              {g[i] && (okAt(i) ? <span className="text-success">✓ נכון</span> : <span className="text-danger">✗ עדיין לא</span>)}
              {shown[i] ? (
                <span className="text-muted">
                  התשובה: <Money v={value} plain />
                </span>
              ) : (
                <button type="button" className="font-semibold text-accent underline" onClick={() => setShown((s) => s.map((x, j) => (j === i ? true : x)))}>
                  הראו תשובה
                </button>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function printSolution() {
  document.documentElement.classList.add("printing-inv");
  const done = () => {
    document.documentElement.classList.remove("printing-inv");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

