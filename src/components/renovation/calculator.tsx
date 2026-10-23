"use client";

import { Hammer, RotateCcw, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { NumberInput, parseNumber as parse, Segmented } from "@/components/study/inputs";
import { MONTHS, MonthPicker } from "@/components/study/month-picker";
import { FormulaCard, type FormulaRow, Stat, texNum } from "@/components/study/ui";
import { inputClass } from "@/components/ui/form";
import { METHOD_LABEL, type RenoMethod, type RenovationInputs, type RenovationResult, renovationErrors, solveRenovation } from "@/lib/learn/renovation";
import { capitaliseLines, catchUpLines, SL_EX, yearEndLines } from "./data";

const str = (v: number) => String(v);
const DEFAULTS = {
  cost: str(SL_EX.cost),
  salvage: str(SL_EX.salvage),
  life: str(SL_EX.life),
  method: SL_EX.method,
  firstYear: str(SL_EX.firstYear),
  renoYear: str(SL_EX.renoYear),
  renoMonth: SL_EX.renoMonth,
  renoCost: str(SL_EX.renoCost),
  newLife: str(SL_EX.newLife),
  newSalvage: str(SL_EX.newSalvage),
  newMethod: SL_EX.newMethod,
};
type Form = typeof DEFAULTS;

const toInputs = (f: Form): RenovationInputs => ({
  cost: parse(f.cost),
  salvage: parse(f.salvage),
  life: parse(f.life),
  method: f.method,
  firstYear: parse(f.firstYear),
  renoYear: parse(f.renoYear),
  renoMonth: f.renoMonth,
  renoCost: parse(f.renoCost),
  newLife: parse(f.newLife),
  newSalvage: parse(f.newSalvage),
  newMethod: f.newMethod,
});

const METHOD_OPTIONS: [RenoMethod, string, string][] = [
  ["sl", "קו ישר", "אותו פחת בכל שנה"],
  ["db", "יתרה פוחתת", "שיעור קבוע על היתרה"],
  ["syd-desc", "ספרות השנים — יורד", "הגבוה בשנה הראשונה"],
  ["syd-asc", "ספרות השנים — עולה", "הגבוה בשנה האחרונה"],
];
const pctTex = (v: number) => `${(v * 100).toFixed(2)}\\%`;
const r2 = (v: number) => Math.round(v * 100) / 100;

function formulaRows(x: RenovationInputs, r: RenovationResult): FormulaRow[] {
  const rows: FormulaRow[] = [];
  if (r.monthsBefore > 0)
    rows.push({
      label: `שלב 2 — פחת ינואר עד ${MONTHS[r.monthsBefore - 1]} לפי הנתונים המקוריים`,
      tex: String.raw`${texNum(r.oldYears[x.renoYear - x.firstYear])} \times \frac{${r.monthsBefore}}{12} = ${texNum(r.depToDate)}`,
    });
  rows.push(
    {
      label: "ערך בספרים ליום השיפוץ",
      tex: String.raw`\text{עלות מקורית} - \text{פחת נצבר} = ${texNum(x.cost)} - ${texNum(r.accumulatedAtReno)} = ${texNum(r.carryingAtReno)}`,
    },
    { label: "שלב 3 — ערך בספרים מותאם", tex: String.raw`${texNum(r.carryingAtReno)} + ${texNum(x.renoCost)} = ${texNum(r.adjusted)}` },
  );
  if (x.newMethod === "sl")
    rows.push({
      label: "שלב 5 — פחת שנתי חדש",
      tex: String.raw`\frac{${texNum(r.adjusted)} - ${texNum(x.newSalvage)}}{${x.newLife}} = ${texNum(r.newYears[0])}`,
    });
  else if (x.newMethod === "db")
    rows.push({
      label: "שלב 5 — שיעור פחת חדש",
      tex: String.raw`1 - \left(\frac{${texNum(x.newSalvage)}}{${texNum(r.adjusted)}}\right)^{\frac{1}{${x.newLife}}} = ${pctTex(r.newRate!)}`,
    });
  else
    rows.push(
      { label: "שלב 5 — סכום ספרות השנים החדש", tex: String.raw`\frac{${x.newLife} \times ${x.newLife + 1}}{2} = ${r.newDigits}` },
      {
        label: "פחת שנת החיים הראשונה מיום השיפוץ",
        tex: String.raw`${texNum(r.newBase)} \times \frac{${x.newMethod === "syd-desc" ? x.newLife : 1}}{${r.newDigits}} = ${texNum(r.newYears[0])}`,
      },
    );
  const reno = r.rows.find((row) => row.year === x.renoYear)!;
  if (r.monthsBefore > 0)
    rows.push({
      label: `פחת ${MONTHS[x.renoMonth - 1]} עד דצמבר ${x.renoYear} (${r.monthsAfter} חודשים)`,
      tex: String.raw`${texNum(r.newYears[0])} \times \frac{${r.monthsAfter}}{12} = ${texNum(reno.after)}`,
    });
  return rows;
}

export function RenovationCalculator() {
  const [f, setF] = useState<Form>(DEFAULTS);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const x = toInputs(f);
  const errors: Record<string, string | undefined> = renovationErrors(x);
  const r = Object.keys(errors).length ? null : solveRenovation(x);
  const reno = r?.rows.find((row) => row.year === x.renoYear);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="min-w-0 space-y-5">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[17px] font-semibold text-fg">הנכס לפני השיפוץ</p>
            <button
              type="button"
              onClick={() => setF(DEFAULTS)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
            >
              <RotateCcw className="h-3.5 w-3.5" /> נתוני הדוגמה
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label="עלות מקורית" suffix="₪" value={f.cost} onChange={(v) => set("cost", v)} error={errors.cost} />
            <NumberInput label="ערך גרט" suffix="₪" value={f.salvage} onChange={(v) => set("salvage", v)} error={errors.salvage} />
            <NumberInput label="אורך חיים" suffix="שנים" value={f.life} onChange={(v) => set("life", v)} error={errors.life} />
            <YearInput label="שנת הרכישה (ב-1 בינואר)" value={f.firstYear} onChange={(v) => set("firstYear", v)} />
          </div>
          <Segmented label="שיטת הפחת" value={f.method} onChange={(v) => set("method", v as RenoMethod)} options={METHOD_OPTIONS} />
        </div>

        <div className="card p-5">
          <p className="mb-4 text-[17px] font-semibold text-fg">השיפוץ</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <YearInput label="שנת השיפוץ" value={f.renoYear} onChange={(v) => set("renoYear", v)} error={errors.renoYear} />
            <NumberInput label="עלות השיפוץ" suffix="₪" value={f.renoCost} onChange={(v) => set("renoCost", v)} error={errors.renoCost} />
          </div>
          <div className="mt-4">
            <MonthPicker value={f.renoMonth} onChange={(m) => set("renoMonth", m)} label="חודש השיפוץ (בתחילת החודש)" />
            <p className="mt-2 text-xs text-muted">
              {f.renoMonth === 1
                ? "שיפוץ בינואר: אין פחת יחסי לפני השיפוץ — כל השנה לפי הנתונים החדשים."
                : `ינואר עד ${MONTHS[f.renoMonth - 2]} = ${f.renoMonth - 1} חודשים לפי הנתונים המקוריים; ${MONTHS[f.renoMonth - 1]} עד דצמבר = ${12 - (f.renoMonth - 1)} חודשים לפי החדשים.`}
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="mb-4 text-[17px] font-semibold text-fg">האומדנים אחרי השיפוץ</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label="יתרת אורך חיים מיום השיפוץ" suffix="שנים" value={f.newLife} onChange={(v) => set("newLife", v)} error={errors.newLife} />
            <NumberInput label="ערך גרט חדש" suffix="₪" value={f.newSalvage} onChange={(v) => set("newSalvage", v)} error={errors.newSalvage} />
          </div>
          <Segmented label="שיטת הפחת אחרי השיפוץ" value={f.newMethod} onChange={(v) => set("newMethod", v as RenoMethod)} options={METHOD_OPTIONS} />
        </div>
      </div>

      <div className="min-w-0 space-y-5">
        {!r || !reno ? (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-danger/40 bg-danger/[0.04] p-6 text-sm text-fg">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="font-semibold">צריך לתקן את הנתונים כדי לחשב</p>
              <ul className="mt-1 list-inside list-disc text-muted">
                {[...new Set(Object.values(errors))].map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat label="ערך בספרים ליום השיפוץ" value={<Num v={r.carryingAtReno} />} />
              <Stat label="ערך בספרים מותאם" value={<Num v={r.adjusted} />} tone="accent" />
              <Stat
                label={x.newMethod === "db" ? "שיעור פחת חדש" : x.newMethod === "sl" ? "פחת שנתי חדש" : "סכום ספרות חדש"}
                value={x.newMethod === "db" ? `${(r.newRate! * 100).toFixed(2)}%` : x.newMethod === "sl" ? <Num v={r.newYears[0]} /> : r.newDigits}
              />
              <Stat label={`סך הפחת בשנת ${x.renoYear}`} value={<Num v={reno.charge} />} hint={r.monthsBefore > 0 ? "לפני ואחרי השיפוץ" : "לפי הנתונים החדשים"} />
            </div>

            <FormulaCard title={`לוח נוסחאות — שיפוץ (${METHOD_LABEL[x.newMethod]})`} icon={<Hammer className="h-4 w-4" />} rows={formulaRows(x, r)} />

            <div className="card p-5">
              <p className="text-[17px] font-semibold text-fg">פקודות היומן בשנת השיפוץ</p>
              <div className="grid gap-3 xl:grid-cols-2">
                {r.monthsBefore > 0 && <JournalEntry title="1. פחת עד יום השיפוץ" lines={catchUpLines(r)} />}
                <JournalEntry title={`${r.monthsBefore > 0 ? "2" : "1"}. היוון השיפוץ`} lines={capitaliseLines(x)} />
                <JournalEntry title={`${r.monthsBefore > 0 ? "3" : "2"}. פחת לסוף השנה`} date={`31.12.${x.renoYear}`} lines={yearEndLines(reno.after)} />
              </div>
            </div>

            <DataTable
              caption="לוח פחת לפי שנות כספים"
              head={["שנה", "יתרת פתיחה", "שיפוץ", "פחת לפני השיפוץ", "פחת אחרי השיפוץ", "סך הפחת", "יתרה בספרים"]}
              rows={r.rows.map((row) => [
                <span key="y" className="num font-semibold">
                  {row.year}
                </span>,
                r2(row.opening),
                row.addition ? r2(row.addition) : "—",
                row.before ? r2(row.before) : "—",
                row.after ? r2(row.after) : "—",
                r2(row.charge),
                r2(row.closing),
              ])}
              highlight={[r.rows.findIndex((row) => row.year === x.renoYear)]}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** A year: no thousands separators, unlike a money field. */
function YearInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        dir="ltr"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        aria-invalid={error ? true : undefined}
        className={`${inputClass} num text-start font-mono`}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
