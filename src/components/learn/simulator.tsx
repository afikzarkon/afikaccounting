"use client";

import { CircleCheck, Gauge, Minus, Plus, RotateCcw, Ruler, Sigma, TrendingDown, TriangleAlert } from "lucide-react";
import { type ReactNode, useState } from "react";
import { DataTable, JournalEntry, n, Num } from "@/components/study/blocks";
import { NumberInput, parseNumber, Segmented } from "@/components/study/inputs";
import { MONTHS, MonthPicker } from "@/components/study/month-picker";
import { inputClass } from "@/components/ui/form";
import {
  type Basics,
  basicsErrors,
  decliningYears,
  depreciableAmount,
  exactDbRate,
  type FiscalRow,
  firstYearMonths,
  type LifeYear,
  type Schedule,
  straightLineYears,
  type SydDirection,
  sydDenominator,
  sydYears,
  timeSchedule,
  unitsSchedule,
} from "@/lib/learn/depreciation";
import { cn } from "@/lib/utils";
import { FormulaCard, type FormulaRow, InlineTex, Stat, texNum } from "@/components/study/ui";
import { monthSpan } from "./widgets";

type Method = "sl" | "db" | "syd" | "uop";

const METHODS: { id: Method; label: string; hint: string; icon: ReactNode }[] = [
  { id: "sl", label: "קו ישר", hint: "אותו פחת בכל שנה", icon: <Ruler className="h-4 w-4" /> },
  { id: "db", label: "יתרה פוחתת", hint: "שיעור קבוע על היתרה", icon: <TrendingDown className="h-4 w-4" /> },
  { id: "syd", label: "סכום ספרות השנים", hint: "פחת מואץ במשקלות", icon: <Sigma className="h-4 w-4" /> },
  { id: "uop", label: "יחידות תפוקה", hint: "לפי השימוש בפועל", icon: <Gauge className="h-4 w-4" /> },
];

const DEFAULTS = {
  cost: "300000",
  salvage: "30000",
  life: "5",
  month: 4,
  sydDir: "desc" as SydDirection,
  totalUnits: "100000",
  units: ["15000", "25000", "22000", "18000", "12000", "8000"],
};

type Inputs = typeof DEFAULTS;

const parse = parseNumber;
const r2 = (v: number) => Math.round(v * 100) / 100;
const pctTex = (r: number) => `${(r * 100).toFixed(2)}\\%`;
/** More decimals than texNum, for a per-unit rate. */
const texRate = (v: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(v).replace(/,/g, "{,}");
const fy = (t: number) => `X${t}`;

type Result =
  | { ok: false; errors: Record<string, string> }
  | { ok: true; errors: Record<string, string>; b: Basics; schedule: Schedule; rate?: number; exact: number | null; totalUnits?: number; units?: number[] };

/** Parses the inputs and builds the schedule; all the arithmetic is in lib/learn/depreciation. */
function compute(inp: Inputs, method: Method): Result {
  const b: Basics = { cost: parse(inp.cost), salvage: parse(inp.salvage), life: parse(inp.life), startMonth: inp.month };
  const errors: Record<string, string> = { ...basicsErrors(b) };
  const exact = Object.keys(errors).length ? null : exactDbRate(b);

  let rate: number | undefined;
  if (method === "db" && !Object.keys(errors).length) {
    if (exact === null) errors.salvage = "ביתרה פוחתת צריך ערך גרט חיובי — בלי גרט הנוסחה נותנת שיעור פחת של 100%";
    else rate = exact;
  }

  let totalUnits: number | undefined;
  let units: number[] | undefined;
  if (method === "uop") {
    totalUnits = parse(inp.totalUnits);
    units = inp.units.map(parse);
    if (!(totalUnits > 0)) errors.totalUnits = "סך יחידות חיובי";
    if (units.some((u) => !(u >= 0))) errors.units = "יחידות בכל שנה — מספר אי-שלילי";
    // Life and month don't drive this method.
    delete errors.life;
    delete errors.startMonth;
  }

  if (Object.keys(errors).length) return { ok: false, errors };

  const schedule =
    method === "sl"
      ? timeSchedule(b, straightLineYears(b))
      : method === "syd"
        ? timeSchedule(b, sydYears(b, inp.sydDir))
        : method === "db"
          ? timeSchedule(b, decliningYears(b, rate!))
          : unitsSchedule(b, totalUnits!, units!);
  return { ok: true, errors, b, schedule, rate, exact, totalUnits, units };
}

/** The breakdown shown in each schedule row: which life years, which fractions. */
function rowTex(row: FiscalRow, method: Method, r: Extract<Result, { ok: true }>, sydDir: SydDirection): string {
  const { b } = r;
  const base = texNum(depreciableAmount(b));
  if (method === "uop") {
    const rate = depreciableAmount(b) / r.totalUnits!;
    const plain = `${texRate(rate)} \\times ${texNum(row.units!)}`;
    return row.capped ? `\\text{הנמוך מבין }\\left(${plain},\\ ${texNum(row.opening)} - ${texNum(b.salvage)}\\right)` : plain;
  }
  if (method === "sl") {
    const months = row.parts.reduce((s, p) => s + p.months, 0);
    return months === 12 ? `\\tfrac{${base}}{${b.life}}` : `\\tfrac{${base}}{${b.life}} \\times \\tfrac{${months}}{12}`;
  }
  if (method === "syd") {
    const s = sydDenominator(b.life);
    const w = (k: number) => (sydDir === "desc" ? b.life - k + 1 : k);
    const terms = row.parts.map((p) => (p.months === 12 ? `\\tfrac{${w(p.k)}}{${s}}` : `\\tfrac{${w(p.k)}}{${s}} \\cdot \\tfrac{${p.months}}{12}`));
    return row.parts.length > 1 ? `${base} \\times \\left(${terms.join(" + ")}\\right)` : `${base} \\times ${terms[0]}`;
  }
  // Declining balance: each life year's charge, labelled, times its share of this fiscal year.
  return row.parts
    .map((p) => {
      const d = `\\underbrace{${texNum(r.schedule.lifeYears[p.k - 1].charge)}}_{\\text{שנת חיים ${p.k}}}`;
      return p.months === 12 ? d : `${d} \\cdot \\tfrac{${p.months}}{12}`;
    })
    .join(" + ");
}

// Every formula reads in accounting terms, never in letters.
const T = {
  cost: String.raw`\text{עלות}`,
  salvage: String.raw`\text{גרט}`,
  life: String.raw`\text{אורך חיים}`,
  base: String.raw`\text{סכום בר-פחת}`,
  annual: String.raw`\text{פחת לשנה מלאה}`,
  months: String.raw`\text{חודשי שימוש}`,
  rate: String.raw`\text{שיעור הפחת}`,
  syd: String.raw`\text{סכום ספרות השנים}`,
};

function formulaRows(method: Method, r: Extract<Result, { ok: true }>, inp: Inputs): FormulaRow[] {
  const { b } = r;
  const C = texNum(b.cost);
  const S = texNum(b.salvage);
  const base = depreciableAmount(b);
  const m = firstYearMonths(b.startMonth);
  const rows = r.schedule.rows;
  const entry = `כניסה ב${MONTHS[b.startMonth - 1]}`;

  if (method === "sl") {
    const annual = base / b.life;
    return [
      { label: "פחת לשנה מלאה", tex: `${T.annual} = \\frac{${T.cost} - ${T.salvage}}{${T.life}} = \\frac{${C} - ${S}}{${b.life}} = ${texNum(annual)}` },
      { label: `פחת בשנה הראשונה — ${entry}`, tex: `${T.annual} \\times \\frac{${T.months}}{12} = ${texNum(annual)} \\times \\frac{${m}}{12} = ${texNum(rows[0].charge)}` },
      ...(m < 12
        ? [
            {
              label: `השלמה בשנת הכספים ה-${b.life + 1} — החודשים שנותרו`,
              tex: `${T.annual} \\times \\frac{12 - ${T.months}}{12} = ${texNum(annual)} \\times \\frac{${12 - m}}{12} = ${texNum(rows.at(-1)!.charge)}`,
            },
          ]
        : []),
    ];
  }

  if (method === "db") {
    return [
      {
        label: "שיעור הפחת — מביא את העלות בדיוק לגרט בסוף אורך החיים",
        tex: `${T.rate} = 1 - \\left(\\frac{\\text{ערך גרט}}{${T.cost}}\\right)^{\\frac{1}{${T.life}}} = 1 - \\left(\\frac{${S}}{${C}}\\right)^{\\frac{1}{${b.life}}} = ${pctTex(r.rate!)}`,
      },
      { label: "פחת לכל שנת חיים — על היתרה בספרים בתחילתה", tex: `\\text{פחת השנה} = \\text{יתרה בספרים בתחילת השנה} \\times ${T.rate}` },
      {
        label: `פחת בשנה הראשונה — ${entry}`,
        tex: `${T.cost} \\times ${T.rate} \\times \\frac{${T.months}}{12} = ${C} \\times ${pctTex(r.rate!)} \\times \\frac{${m}}{12} = ${texNum(rows[0].charge)}`,
      },
    ];
  }

  if (method === "syd") {
    const s = sydDenominator(b.life);
    const desc = inp.sydDir === "desc";
    const w1 = desc ? b.life : 1;
    const w2 = desc ? b.life - 1 : 2;
    const B = texNum(base);
    return [
      { label: "המכנה — סכום ספרות השנים", tex: `${T.syd} = \\frac{${T.life} \\times (${T.life} + 1)}{2} = \\frac{${b.life} \\times ${b.life + 1}}{2} = ${s}` },
      {
        label: desc ? "משקל כל שנת חיים — יורד (מואץ)" : "משקל כל שנת חיים — עולה (מואט)",
        tex: desc ? `\\text{משקל} = \\frac{\\text{שנות החיים שנותרו, כולל השנה}}{${T.syd}}` : `\\text{משקל} = \\frac{\\text{מספר שנת החיים}}{${T.syd}}`,
      },
      {
        label: `השנה הראשונה — ${m} חודשי שימוש`,
        tex: `${T.base} \\times \\frac{${w1}}{${s}} \\times \\frac{${m}}{12} = ${B} \\times \\frac{${w1}}{${s}} \\times \\frac{${m}}{12} = ${texNum(rows[0].charge)}`,
      },
      ...(b.life > 1 && m < 12
        ? [
            {
              label: "השנה השנייה — סוף שנת החיים הראשונה ותחילת השנייה",
              tex: `${B} \\times \\left(\\frac{${w1}}{${s}} \\times \\frac{${12 - m}}{12} + \\frac{${w2}}{${s}} \\times \\frac{${m}}{12}\\right) = ${texNum(rows[1].charge)}`,
            },
          ]
        : []),
    ];
  }

  const rate = base / r.totalUnits!;
  return [
    {
      label: "פחת ליחידה (או לשעת עבודה)",
      tex: `\\text{פחת ליחידה} = \\frac{${T.cost} - ${T.salvage}}{\\text{סך יחידות צפויות}} = \\frac{${texNum(base)}}{${texNum(r.totalUnits!)}} = ${texRate(rate)}`,
    },
    {
      label: "פחת השנה",
      tex: `\\text{פחת ליחידה} \\times \\text{יחידות בפועל} = ${texRate(rate)} \\times ${texNum(r.units![0])} = ${texNum(rows[0].charge)}`,
    },
  ];
}

export function DepreciationSimulator() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  const [method, setMethod] = useState<Method>("sl");
  const [jeYear, setJeYear] = useState(1);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInp((p) => ({ ...p, [k]: v }));

  const r = compute(inp, method);
  const meta = METHODS.find((m) => m.id === method)!;
  const rows = r.ok ? r.schedule.rows : [];
  const year = Math.min(jeYear, Math.max(1, rows.length));

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="שיטת הפחת" className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-2/60 p-1.5 sm:grid-cols-4">
        {METHODS.map((m) => {
          const on = m.id === method;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors",
                on ? "bg-surface text-fg shadow-card ring-1 ring-accent/40" : "text-muted hover:bg-surface/70 hover:text-fg",
              )}
            >
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", on ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent")}>{m.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block truncate text-[11px] text-subtle">{m.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0 space-y-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[17px] font-semibold text-fg">נתוני הנכס</p>
              <button
                type="button"
                onClick={() => setInp(DEFAULTS)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
              >
                <RotateCcw className="h-3.5 w-3.5" /> ברירות מחדל
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput label="עלות" suffix="₪" value={inp.cost} onChange={(v) => set("cost", v)} error={r.errors.cost} />
              <NumberInput label="ערך גרט" suffix="₪" value={inp.salvage} onChange={(v) => set("salvage", v)} error={r.errors.salvage} />
              {method !== "uop" && <NumberInput label="אורך חיים" suffix="שנים" value={inp.life} onChange={(v) => set("life", v)} error={r.errors.life} />}
              {method === "uop" && (
                <NumberInput label="סך יחידות / שעות צפויות" suffix="יח׳" value={inp.totalUnits} onChange={(v) => set("totalUnits", v)} error={r.errors.totalUnits} />
              )}
            </div>
            {method !== "uop" ? (
              <div className="mt-4">
                <MonthPicker value={inp.month} onChange={(m) => set("month", m)} />
                <p className="mt-2 text-xs text-muted">
                  כניסה ב{MONTHS[inp.month - 1]}: {monthSpan(inp.month)} בשנה הראשונה.
                </p>
              </div>
            ) : (
              <UnitsEditor units={inp.units} total={parse(inp.totalUnits)} error={r.errors.units} onChange={(u) => set("units", u)} />
            )}

            {method === "syd" && (
              <Segmented
                label="כיוון השיטה"
                value={inp.sydDir}
                onChange={(v) => set("sydDir", v as SydDirection)}
                options={[
                  ["desc", "יורד (מואץ)", "הפחת הגבוה בשנה הראשונה"],
                  ["asc", "עולה (מואט)", "הפחת הגבוה בשנה האחרונה"],
                ]}
              />
            )}

            {method === "db" && (
              <div className="mt-4 rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-3">
                <p className="text-[13px] font-medium text-fg">שיעור הפחת</p>
                <p className="mt-0.5 text-xs text-muted">אחד פחות (ערך גרט חלקי עלות) בחזקת 1 חלקי אורך החיים</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                  <InlineTex tex={String.raw`\text{שיעור הפחת} = 1 - \left(\frac{\text{ערך גרט}}{\text{עלות}}\right)^{\frac{1}{\text{אורך חיים}}}`} />
                  {r.ok && r.rate !== undefined && <InlineTex tex={`= ${pctTex(r.rate)}`} className="font-semibold" />}
                </div>
              </div>
            )}
          </div>

          {r.ok && (
            <FormulaCard title={`לוח נוסחאות — ${meta.label}`} icon={meta.icon} rows={formulaRows(method, r, inp)}>
              {method === "db" ? (
                <p>
                  <strong>למה לא מנכים גרט בהתחלה?</strong> השיעור מוחל על היתרה בספרים, והגרט כבר &quot;מובנה&quot; בו — אחרי כל שנות החיים:{" "}
                  <InlineTex tex={String.raw`\text{עלות} \times (1 - \text{שיעור הפחת})^{\text{אורך חיים}} = \text{גרט}`} />. בשנה האחרונה
                  היתרה מושלמת בדיוק לגרט, כדי לסגור הפרשי עיגול.
                </p>
              ) : method === "uop" ? (
                <p>
                  <strong>אין פיצול לפי חודשים:</strong> הפחת נקבע לפי השימוש בפועל, כך שרכישה באמצע שנה כבר משתקפת ביחידות שהופקו מאז.
                </p>
              ) : (
                <p>
                  כל שנת חיים היא 12 חודשים מלאים שמתחילים בחודש הכניסה לשימוש, ולכן היא מתפצלת בין שתי שנות כספים: <strong>חודשי השימוש</strong>{" "}
                  בשנה אחת, ו<strong>שאר החודשים</strong> בשנה שאחריה.
                </p>
              )}
            </FormulaCard>
          )}
        </div>

        <div className="min-w-0 space-y-5">
          {!r.ok ? (
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-danger/40 bg-danger/[0.04] p-6 text-sm text-fg">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <div>
                <p className="font-semibold">צריך לתקן את הנתונים כדי לחשב</p>
                <ul className="mt-1 list-inside list-disc text-muted">
                  {[...new Set(Object.values(r.errors))].map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Results r={r} method={method} inp={inp} year={year} onYear={setJeYear} />
          )}
        </div>
      </div>
    </div>
  );
}

function Results({ r, method, inp, year, onYear }: { r: Extract<Result, { ok: true }>; method: Method; inp: Inputs; year: number; onYear: (y: number) => void }) {
  const { b, schedule } = r;
  const rows = schedule.rows;
  const base = depreciableAmount(b);
  const total = rows.reduce((s, x) => s + x.charge, 0);
  const last = rows.at(-1)!;
  const m = firstYearMonths(b.startMonth);
  const fullyDepreciated = Math.abs(total - base) < 0.01;
  const neverBelow = rows.every((x) => x.closing >= b.salvage - 0.01);
  const capped = rows.map((x, i) => (x.capped ? i : -1)).filter((i) => i >= 0);
  const unitsSum = r.units?.reduce((s, u) => s + u, 0) ?? 0;
  const je = rows[year - 1];

  const key: ReactNode =
    method === "sl" ? (
      <Num v={base / b.life} />
    ) : method === "db" ? (
      `${(r.rate! * 100).toFixed(2)}%`
    ) : method === "syd" ? (
      sydDenominator(b.life)
    ) : (
      <Num v={base / r.totalUnits!} />
    );
  const keyLabel = method === "sl" ? "פחת לשנה מלאה" : method === "db" ? "שיעור הפחת" : method === "syd" ? "סכום ספרות השנים" : "פחת ליחידה";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="סכום בר-פחת (עלות פחות גרט)" value={<Num v={base} />} tone="accent" />
        <Stat label={keyLabel} value={key} />
        {method === "uop" ? (
          <Stat label="יחידות בלוח / צפויות" value={`${n(unitsSum)} / ${n(r.totalUnits!)}`} />
        ) : (
          <Stat label="חודשים בשנה הראשונה" value={`${m} / 12`} hint={m < 12 ? `${rows.length} שנות כספים` : "שנה מלאה"} />
        )}
        <Stat label="יתרה בסוף הלוח" value={<Num v={last.closing} />} tone={Math.abs(last.closing - b.salvage) < 0.01 ? "success" : "warn"} hint={`גרט: ${n(b.salvage)}`} />
      </div>

      <div className="card p-5">
        <p className="text-[17px] font-semibold text-fg">הוצאות פחת לפי שנת כספים</p>
        <p className="text-xs text-muted">רחפו מעל עמודה לסכום המדויק. הלוח המלא מופיע מתחת.</p>
        <BarChart rows={rows} />
      </div>

      <div>
        <DataTable
          caption={`לוח פחת — ${METHODS.find((x) => x.id === method)!.label}${method === "syd" ? (inp.sydDir === "desc" ? " (יורד)" : " (עולה)") : ""}`}
          head={["שנה", "חישוב (פירוט השברים)", ...(method === "uop" ? ["יחידות"] : []), "יתרת פתיחה", "הוצאות פחת", "פחת נצבר", "יתרה בספרים"]}
          rows={rows.map((x) => [
            <span key="y" className="num font-semibold">
              {fy(x.year)}
            </span>,
            <span key="t" className="block min-w-max text-[13px]">
              <InlineTex tex={rowTex(x, method, r, inp.sydDir)} />
            </span>,
            ...(method === "uop" ? [x.units!] : []),
            r2(x.opening),
            r2(x.charge),
            r2(x.accumulated),
            r2(x.closing),
          ])}
          foot={["סה״כ", "", ...(method === "uop" ? [unitsSum] : []), "", r2(total), "", ""]}
          highlight={capped}
        />
        {capped.length > 0 && (
          <p className="-mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <TriangleAlert className="h-3.5 w-3.5" /> השורות המודגשות — הפחת נקטע או הושלם כדי לעצור בדיוק על ערך הגרט.
          </p>
        )}
      </div>

      {(method === "db" || method === "syd") && <LifeYearsTable method={method} lifeYears={schedule.lifeYears} b={b} rate={r.rate} sydDir={inp.sydDir} />}

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[17px] font-semibold text-fg">פקודת היומן</p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="שנת הפקודה">
            {rows.map((x) => (
              <button
                key={x.year}
                type="button"
                aria-pressed={x.year === year}
                onClick={() => onYear(x.year)}
                className={cn(
                  "num h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                  x.year === year ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {fy(x.year)}
              </button>
            ))}
          </div>
        </div>
        <JournalEntry
          title={`רישום הפחת לשנת ${fy(year)}`}
          date={`31.12.${fy(year)}`}
          lines={[
            { account: "הוצאות פחת (רווח והפסד)", dr: r2(je.charge) },
            { account: "פחת נצבר — רכוש קבוע", cr: r2(je.charge) },
          ]}
          note={
            <>
              הפחת הנצבר הוא חשבון &quot;מנוגד נכס&quot;: העלות נשארת בספרים כמות שהיא, והיתרה בספרים בסוף {fy(year)} היא{" "}
              <Num v={b.cost} /> − <Num v={r2(je.accumulated)} /> = <Num v={r2(je.closing)} />.
            </>
          }
        />
      </div>

      <div className="card p-5">
        <p className="text-[17px] font-semibold text-fg">וידוא תקינות הלוח</p>
        <ul className="mt-3 space-y-2 text-sm">
          <Check ok={fullyDepreciated} warnOnly={method === "uop"}>
            סך הפחת = <Num v={r2(total)} /> {fullyDepreciated ? "שווה ל" : "שונה מ"}סכום בר-הפחת <Num v={base} />
            {method === "uop" && !fullyDepreciated && unitsSum < r.totalUnits! && ` — נותרו ${n(r.totalUnits! - unitsSum)} יחידות לשימוש עתידי`}
          </Check>
          <Check ok={neverBelow}>היתרה בספרים לא יורדת מתחת לגרט בשום שנה</Check>
          {method !== "uop" && (
            <Check ok>
              השנה הראשונה חושבה על {m} חודשים (מ{MONTHS[b.startMonth - 1]}), {m < 12 ? `והיתרה של ${12 - m} חודשים נרשמה ב-${fy(rows.length)}` : "ללא פיצול"}
            </Check>
          )}
          {method === "uop" && unitsSum > r.totalUnits! && (
            <Check ok={false} warnOnly>
              סך היחידות בלוח ({n(unitsSum)}) עולה על הצפי ({n(r.totalUnits!)}) — הפחת נעצר בגרט. במציאות זה סימן לאמוד מחדש את התפוקה (סעיף 51).
            </Check>
          )}
        </ul>
      </div>
    </>
  );
}

function LifeYearsTable({ method, lifeYears, b, rate, sydDir }: { method: "db" | "syd"; lifeYears: LifeYear[]; b: Basics; rate?: number; sydDir: SydDirection }) {
  const s = sydDenominator(b.life);
  return (
    <details className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-[15px] font-semibold text-fg hover:bg-surface-2/50 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">שלב הביניים: פחת לכל שנת חיים (לפני הפיצול לשנות כספים)</span>
        <Plus className="h-4 w-4 text-muted group-open:hidden" />
        <Minus className="hidden h-4 w-4 text-muted group-open:block" />
      </summary>
      <div className="border-t border-line px-5 pb-4">
        <DataTable
          head={["שנת חיים", "חישוב", "פחת שנת החיים"]}
          rows={lifeYears.map((y) => [
            <span key="k" className="num">
              {y.k}
            </span>,
            <span key="t" className="flex flex-wrap items-center gap-2 text-[13px]">
              <InlineTex
                tex={
                  method === "syd"
                    ? `${texNum(depreciableAmount(b))} \\times \\frac{${sydDir === "desc" ? b.life - y.k + 1 : y.k}}{${s}}`
                    : y.cut
                      ? `${texNum(y.opening!)} - ${texNum(b.salvage)}`
                      : `${texNum(y.opening!)} \\times ${pctTex(rate!)}`
                }
              />
              {y.cut && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  {y.cut === "floor" ? "נקטע ברצפת הגרט" : "הושלם לגרט בשנה האחרונה"}
                </span>
              )}
            </span>,
            r2(y.charge),
          ])}
          highlight={lifeYears.map((y, i) => (y.cut ? i : -1)).filter((i) => i >= 0)}
        />
      </div>
    </details>
  );
}

function Check({ ok, warnOnly, children }: { ok: boolean; warnOnly?: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      ) : (
        <TriangleAlert className={cn("mt-0.5 h-4 w-4 shrink-0", warnOnly ? "text-amber-600 dark:text-amber-400" : "text-danger")} />
      )}
      <span className="text-fg/90">{children}</span>
    </li>
  );
}

/** A round axis maximum: 1, 2, 2.5 or 5 times a power of ten. */
function niceCeil(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

/** One series, so no legend; each bar carries its own tooltip and the table above is the full data view. */
function BarChart({ rows }: { rows: FiscalRow[] }) {
  const max = niceCeil(Math.max(...rows.map((r) => r.charge)));
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <div dir="ltr" className="mt-4 flex gap-2">
      <div className="flex h-52 flex-col justify-between pb-6 text-end text-[11px] text-subtle">
        {ticks.map((t) => (
          <span key={t} className="num leading-none">
            {n(max * t)}
          </span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
          {ticks.map((t) => (
            <div key={t} className={cn("border-t", t === 0 ? "border-line-strong" : "border-dashed border-line")} />
          ))}
        </div>
        <div className="relative flex h-52 items-stretch gap-[2px]">
          {rows.map((r) => (
            <div key={r.year} className="group flex flex-1 flex-col items-center">
              <div className="relative flex w-full flex-1 items-end justify-center px-[12%]">
                <div
                  tabIndex={0}
                  aria-label={`${fy(r.year)}: ${n(r2(r.charge))}`}
                  className="w-full max-w-14 rounded-t-[4px] bg-[var(--series-1)] transition-[height,filter] outline-none group-hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  style={{ height: `${(r.charge / max) * 100}%`, minHeight: r.charge > 0 ? 2 : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap text-fg shadow-card group-focus-within:block group-hover:block">
                  <span className="text-muted">{fy(r.year)} · </span>
                  <span className="num font-semibold">{n(r2(r.charge))}</span>
                  <span className="block text-[11px] text-muted">
                    יתרה: <span className="num">{n(r2(r.closing))}</span>
                  </span>
                </div>
              </div>
              <span className="num mt-1.5 h-4.5 text-[11px] text-muted">{fy(r.year)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitsEditor({ units, total, error, onChange }: { units: string[]; total: number; error?: string; onChange: (u: string[]) => void }) {
  const sum = units.reduce((s, u) => s + (parse(u) || 0), 0);
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-fg">צפי תפוקה בפועל לפי שנים</p>
        <span className={cn("num text-xs", Number.isFinite(total) && Math.abs(sum - total) < 0.01 ? "text-success" : "text-muted")}>
          {n(sum)} / {Number.isFinite(total) ? n(total) : "—"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {units.map((u, i) => (
          <label key={i} className="relative block">
            <span className="num pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-xs font-semibold text-subtle">{fy(i + 1)}</span>
            <input
              dir="ltr"
              inputMode="decimal"
              aria-label={`יחידות בשנה ${fy(i + 1)}`}
              value={u}
              onChange={(e) => onChange(units.map((x, j) => (j === i ? e.target.value.replace(/,/g, "") : x)))}
              className={cn(inputClass, "num h-10 ps-10 font-mono")}
            />
          </label>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange([...units, "0"])}
          disabled={units.length >= 30}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> שנה
        </button>
        <button
          type="button"
          onClick={() => onChange(units.slice(0, -1))}
          disabled={units.length <= 1}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" /> הסרת שנה אחרונה
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
