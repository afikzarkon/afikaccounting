"use client";

import { Trash2 } from "lucide-react";
import { type Method, METHOD_LABEL } from "@/lib/learn/inventory";
import { type Metric, METRIC_LABEL } from "@/lib/learn/inventory-solver";
import { cn } from "@/lib/utils";
import { Check, NumField, Segmented, Select, smallBtn, Switch, TextField } from "./inventory-calc-fields";
import { type Built, type CalcState, type FireForm, type KnownForm, optNum, uid, type YearForm } from "./inventory-calc-state";
import { FireCard, fireClaim, type Solution } from "./inventory-calc-results";
import type { Update } from "./inventory-calculator";

const card = "rounded-xl border border-line bg-surface p-3.5";
const chip = cn(smallBtn, "min-h-8 px-2.5 py-1 text-xs");

/** Step 2: what happened at each year's end, the results the question gives, and a fire. */
export function EventsStep({ st, set, built, solution }: { st: CalcState; set: Update; built: Built; solution: Solution }) {
  return (
    <div className="space-y-4">
      {st.years.map((y, t) => (
        <YearCard key={y.id} st={st} set={set} built={built} t={t} />
      ))}
      <Givens st={st} set={set} built={built} />
      <FireEvent st={st} set={set} built={built} solution={solution} />
    </div>
  );
}

/** A year's own opening inventory: units and total cost, either of them may be the unknown. */
export function OpeningFields({ st, set, built, t }: { st: CalcState; set: Update; built: Built; t: number }) {
  const y = st.years[t];
  const setY = (fn: (y: YearForm) => YearForm) => set((s) => ({ ...s, years: s.years.map((z, j) => (j === t ? fn(z) : z)) }));
  const err = (k: string) => built.errors[`y${t}.${k}`];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NumField label="יחידות במלאי הפתיחה" value={y.openUnits} onChange={(v) => setY((x) => ({ ...x, openUnits: { ...x.openUnits, v } }))} error={err("openUnits")} letter={built.letters[`y${t}.openUnits`]} onToggleUnknown={() => setY((x) => ({ ...x, openUnits: { ...x.openUnits, unknown: !x.openUnits.unknown } }))} />
      <NumField label="עלות מלאי הפתיחה (סה״כ)" suffix="₪" value={y.openCost} onChange={(v) => setY((x) => ({ ...x, openCost: { ...x.openCost, v } }))} error={err("openCost")} letter={built.letters[`y${t}.openCost`]} onToggleUnknown={() => setY((x) => ({ ...x, openCost: { ...x.openCost, unknown: !x.openCost.unknown } }))} />
    </div>
  );
}

function YearCard({ st, set, built, t }: { st: CalcState; set: Update; built: Built; t: number }) {
  const y = st.years[t];
  const setY = (fn: (y: YearForm) => YearForm) => set((s) => ({ ...s, years: s.years.map((z, j) => (j === t ? fn(z) : z)) }));
  const err = (k: string) => built.errors[`y${t}.${k}`];
  const more = !!(y.saleDiscPct || y.saleDiscThreshold || y.custDiscounts || y.custReturns || y.counted || y.priorWriteDown);
  return (
    <section aria-label={`שנת ${y.label}`} className={card}>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <TextField label="שנה" value={y.label} onChange={(v) => setY((x) => ({ ...x, label: v }))} className="w-28" />
        {t > 0 && <Check label={`נפתחת מהסגירה של ${st.years[t - 1].label}`} checked={y.fromPrev} onChange={(v) => setY((x) => ({ ...x, fromPrev: v }))} />}
      </div>
      {t > 0 && !y.fromPrev && (
        <div className="mb-3">
          <OpeningFields st={st} set={set} built={built} t={t} />
        </div>
      )}
      <Segmented
        label="שווי מימוש נטו בסוף השנה"
        value={y.nrvMode}
        onChange={(v) => setY((x) => ({ ...x, nrvMode: v }))}
        options={[
          ["none", "לא נתון"],
          ["above", "גבוה מהעלות"],
          ["unit", "ליחידה"],
          ["build", "מחיר − עלויות"],
          ["total", "סכום כולל"],
        ]}
      />
      {(y.nrvMode === "unit" || y.nrvMode === "total" || y.nrvMode === "build") && (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {y.nrvMode === "unit" && <NumField label="שווי מימוש נטו ליחידה" suffix="₪" value={y.nrvUnit} onChange={(v) => setY((x) => ({ ...x, nrvUnit: v }))} error={err("nrvUnit")} />}
          {y.nrvMode === "total" && <NumField label="שווי מימוש נטו כולל" suffix="₪" value={y.nrvTotal} onChange={(v) => setY((x) => ({ ...x, nrvTotal: v }))} error={err("nrvTotal")} />}
          {y.nrvMode === "build" && (
            <>
              <NumField label="מחיר מכירה צפוי ליחידה" suffix="₪" value={y.nrvPrice} onChange={(v) => setY((x) => ({ ...x, nrvPrice: v }))} error={err("nrvPrice")} />
              <NumField label="עלויות השלמה ליחידה" suffix="₪" value={y.nrvCompletion} onChange={(v) => setY((x) => ({ ...x, nrvCompletion: v }))} error={err("nrvCompletion")} />
              <NumField label="עלויות מכירה ליחידה" suffix="₪" value={y.nrvSelling} onChange={(v) => setY((x) => ({ ...x, nrvSelling: v }))} error={err("nrvSelling")} />
            </>
          )}
        </div>
      )}
      <details open={more} className="group mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-accent">הנחות והחזרות ללקוחות, ספירת מלאי, הורדת ערך קודמת</summary>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumField label="הנחת כמות ללקוח: מעל כמה יחידות (ריק — כל מכירה)" value={y.saleDiscThreshold} onChange={(v) => setY((x) => ({ ...x, saleDiscThreshold: v }))} error={err("sdThr")} />
          <NumField label="…שיעור ההנחה על המכירה" suffix="%" value={y.saleDiscPct} onChange={(v) => setY((x) => ({ ...x, saleDiscPct: v }))} error={err("sdPct")} />
          <NumField label="הנחות ללקוחות (סה״כ בשנה)" suffix="₪" value={y.custDiscounts} onChange={(v) => setY((x) => ({ ...x, custDiscounts: v }))} error={err("custDisc")} />
          <NumField label="החזרות מלקוחות (סה״כ בשנה)" suffix="₪" value={y.custReturns} onChange={(v) => setY((x) => ({ ...x, custReturns: v }))} error={err("custRet")} />
          <NumField label="כמות שנספרה בפועל (אם שונה מהספרים)" value={y.counted} onChange={(v) => setY((x) => ({ ...x, counted: v }))} error={err("counted")} />
          <NumField label="הורדת ערך שכבר רשומה במלאי הפתיחה" suffix="₪" value={y.priorWriteDown} onChange={(v) => setY((x) => ({ ...x, priorWriteDown: v }))} error={err("prior")} />
        </div>
      </details>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The results a question gives, each pinning one unknown.

const GIVEN_QUICK: [Metric, string][] = [
  ["gpPct", "שיעור רווח גולמי"],
  ["gpPctChange", "שינוי בשיעור הגולמי"],
  ["saleRevenue", "הכנסה ממכירה (₪)"],
  ["soldUnits", "יחידות שנמכרו"],
  ["closingUnits", "יחידות בסגירה"],
  ["cogs", "עלות המכר"],
  ["saleCost", "עלות מכירה מסוימת"],
  ["avgCost", "עלות ממוצעת"],
  ["purchaseDiscount", "הנחה ברכישה (₪)"],
  ["salePriceChange", "מחיר זהה לשנה הקודמת"],
];
const METRICS: [Metric, string][] = (Object.keys(METRIC_LABEL) as Metric[]).map((k) => [k, METRIC_LABEL[k]]);
const BY_SALE: Metric[] = ["saleCost", "saleRevenue", "salePriceChange"];
const BY_PURCHASE: Metric[] = ["purchaseDiscount", "purchaseTotal"];
const EXAMPLE: Partial<Record<Metric, string>> = {
  saleRevenue: "״המכירות הסתכמו ב-95,200 ₪ לפי 272 ₪ ליחידה״ — בטבלה: כמות ?, מחיר 272. כאן: 95,200.",
  soldUnits: "״נמכרו 1,850 יחידות״ כשהכמות של מכירה אחת היא ?.",
  gpPctChange: "״שיעור הרווח הגולמי ירד ב-2% לעומת השנה הקודמת״ — נמוך יותר, 2.",
  gpPct: "״שיעור הרווח הגולמי היה 25%״ — מחיר מכירה (או כמות) ? בטבלה.",
  salePriceChange: "״מכרה … במחיר זהה למחיר בשנה הקודמת״ — בטבלה: מחיר ? גם בשנה הזו, וכאן מספר המכירה. אין מספר להקליד.",
  purchaseDiscount: "״הנחות מהספק: 13,125 ברכישה הראשונה״ — שיעור ההנחה ? בתנאים לכל הרכישות. שיעור אחד לכל השנים.",
};

/** A new given, aimed at the row the unknown is in: the first sale or purchase in that year with a "?". */
function freshGiven(st: CalcState, metric: Metric): KnownForm {
  const t = Math.max(0, st.years.findIndex((y) => y.sales.some((x) => x.qty.unknown || x.price.unknown) || y.purchases.some((x) => x.qty.unknown || x.price.unknown)));
  const y = st.years[t] ?? st.years[0];
  const sale = y.sales.findIndex((x) => x.qty.unknown || x.price.unknown);
  const buy = y.purchases.findIndex((x) => x.qty.unknown || x.price.unknown || x.discounts.some((d) => d.pct.unknown));
  const index = BY_SALE.includes(metric) ? String(Math.max(0, sale) + 1) : BY_PURCHASE.includes(metric) ? String(Math.max(0, buy) + 1) : "";
  // A comparison with last year belongs to the later year: the last one with a "?" in a sale.
  const later = st.years.reduce((at, yy, j) => (j > 0 && yy.sales.some((x) => x.price.unknown || x.qty.unknown) ? j : at), Math.max(1, t));
  const year = metric === "gpPctChange" || metric === "salePriceChange" ? Math.min(later, st.years.length - 1) : t;
  const yy = st.years[year] ?? y;
  const saleAt = metric === "salePriceChange" ? String(Math.max(0, yy.sales.findIndex((x) => x.price.unknown)) + 1) : index;
  return { id: uid(), year, metric, index: saleAt, value: "", dir: metric === "gpPctChange" ? "down" : "up" };
}

function Givens({ st, set, built }: { st: CalcState; set: Update; built: Built }) {
  const nu = built.unknowns.length;
  const nk = built.knowns.length;
  return (
    <section aria-labelledby="inv-givens" className={cn(card, nu > nk && "border-accent")}>
      <h3 id="inv-givens" className="text-sm font-semibold text-fg">
        נתונים שהשאלה נותנת כתוצאה
      </h3>
      <p className="mb-3 text-xs text-muted">
        בשאלה חסר מחיר או כמות? הקלידו <strong>?</strong> בתא שלו בטבלה, והוסיפו כאן את הנתון שמגלה אותו — נתון אחד לכל נעלם.
      </p>
      {nu > 0 && (
        <p className={cn("mb-3 rounded-lg px-3 py-2 text-sm", nu > nk ? "bg-accent-soft text-fg" : "bg-success/10 text-fg")} aria-live="polite">
          {nu > nk ? `סימנתם ${nu} נעלמים ויש ${nk} נתונים — חסר עוד ${nu - nk}.` : `${nu} נעלמים · ${nk} נתונים ✓`} <span className="text-muted">({built.unknowns.map((x) => x.label.replace(/^נעלם /, "")).join(" · ")})</span>
        </p>
      )}
      <div className="space-y-2">
        {st.knowns.map((k, i) => (
          <GivenRow key={k.id} st={st} set={set} built={built} k={k} i={i} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="me-1 text-xs text-muted">הוסיפו:</span>
        {GIVEN_QUICK.map(([metric, l]) => (
          <button key={metric} type="button" className={chip} onClick={() => set((s) => ({ ...s, knowns: [...s.knowns, freshGiven(s, metric)] }))}>
            + {l}
          </button>
        ))}
      </div>
    </section>
  );
}

function GivenRow({ st, set, built, k, i }: { st: CalcState; set: Update; built: Built; k: KnownForm; i: number }) {
  const setK = (patch: Partial<KnownForm>) => set((s) => ({ ...s, knowns: s.knowns.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const needsIndex = BY_SALE.includes(k.metric) || BY_PURCHASE.includes(k.metric);
  const pct = k.metric === "gpPct" || k.metric === "gpPctChange";
  return (
    <div className="rounded-lg bg-surface-2/50 p-2">
      <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]">
        <Select label="מה ידוע" value={k.metric} onChange={(v) => setK({ metric: v })} options={METRICS} />
        {st.years.length > 1 ? <Select label="שנה" value={String(k.year)} onChange={(v) => setK({ year: Number(v) })} options={st.years.map((y, j) => [String(j), y.label])} /> : <span aria-hidden />}
        {needsIndex ? (
          <NumField label={BY_SALE.includes(k.metric) ? "מכירה מס׳ (בשנה)" : "רכישה מס׳ (בשנה)"} value={k.index} onChange={(v) => setK({ index: v })} error={built.errors[`k${i}.idx`]} />
        ) : k.metric === "gpPctChange" ? (
          <Select
            label="לעומת השנה הקודמת"
            value={k.dir ?? "up"}
            onChange={(v) => setK({ dir: v })}
            options={[
              ["down", "נמוך ב-"],
              ["up", "גבוה ב-"],
            ]}
          />
        ) : (
          <span aria-hidden />
        )}
        {k.metric === "salePriceChange" ? (
          <p className="pb-2.5 text-sm text-fg">
            = המחיר ב-{st.years[k.year - 1]?.label ?? "השנה הקודמת"}
            {built.errors[`k${i}`] && <span className="block text-xs text-danger">{built.errors[`k${i}`]}</span>}
          </p>
        ) : (
          <NumField
            label={k.metric === "gpPctChange" ? "נקודות אחוז" : "ערך"}
            suffix={pct ? "%" : k.metric === "closingUnits" || k.metric === "soldUnits" ? "יח׳" : "₪"}
            value={k.value}
            onChange={(v) => setK({ value: v })}
            error={built.errors[`k${i}`]}
          />
        )}
        <button type="button" className={cn(smallBtn, "h-10 w-10 px-0")} aria-label="הסירו נתון" onClick={() => set((s) => ({ ...s, knowns: s.knowns.filter((_, j) => j !== i) }))}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {EXAMPLE[k.metric] && <p className="mt-1 text-xs text-muted">{EXAMPLE[k.metric]}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A fire in the last year.

function FireEvent({ st, set, built, solution }: { st: CalcState; set: Update; built: Built; solution: Solution }) {
  const f = st.fire;
  const claim = fireClaim(st, built, solution);
  const setF = (patch: Partial<FireForm>) => set((s) => ({ ...s, fire: { ...s.fire, ...patch } }));
  return (
    <section aria-label="שריפה או אובדן מלאי" className={cn(card, st.fireEvent && "border-accent")}>
      <Switch
        on={!!st.fireEvent}
        onChange={(v) => set((s) => ({ ...s, fireEvent: v }))}
        title="שריפה / אובדן מלאי ושיפוי מביטוח"
        hint={st.fireEvent ? `המלאי שנשרף מחושב מכל ההיסטוריה שבטבלה, עד תאריך השריפה, ב-${st.years.at(-1)?.label ?? "השנה האחרונה"}.` : "הפעילו אם בשאלה יש שריפה, גניבה או נזק, ופוליסה לפי FIFO או ממוצע."}
      />
      {st.fireEvent && (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField label="תאריך השריפה" type="date" value={f.fireDate ?? ""} onChange={(v) => setF({ fireDate: v })} />
            <NumField label="יחידות שניצלו (ריק — הכול נשרף)" value={f.savedUnits} onChange={(v) => setF({ savedUnits: v })} />
            <Select<Method> label="הפוליסה משפה לפי" value={f.policy} onChange={(v) => setF({ policy: v })} options={(["fifo", "wa-periodic", "moving-avg"] as Method[]).map((x) => [x, METHOD_LABEL[x]])} />
          </div>
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
          {(optNum(f.cap) ?? 0) > 0 && <Check label="התקרה חלה לפני ההשתתפות העצמית" checked={f.capBefore} onChange={(v) => setF({ capBefore: v })} />}
          <p className="text-xs text-muted">רכישות ומכירות שאחרי תאריך השריפה לא נכנסות לחישוב — אפשר להשאיר אותן בטבלה כמו בשאלה. שיפוי לפי שיעור גולמי (בלי טבלת תנועות) — בלשונית ״שיעור גולמי בלבד״.</p>
          {claim && <FireCard claim={claim} />}
        </div>
      )}
    </section>
  );
}
