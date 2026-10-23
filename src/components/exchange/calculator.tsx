"use client";

import { ArrowLeftRight, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { JournalEntry, Num } from "@/components/study/blocks";
import { NumberInput, parseNumber as parse, Segmented } from "@/components/study/inputs";
import { MONTHS, MonthPicker } from "@/components/study/month-picker";
import { FormulaCard, type FormulaRow, Stat, texNum } from "@/components/study/ui";
import { exchangeErrors, type ExchangeInputs, type ExchangeResult, solveExchange } from "@/lib/learn/exchange";
import { cn } from "@/lib/utils";
import { catchUpLines, EXAMPLE, exchangeLines, yearEndLines } from "./entries";

const str = (v: number) => String(v);
const DEFAULTS = {
  oldCost: str(EXAMPLE.oldCost),
  oldSalvage: str(EXAMPLE.oldSalvage),
  oldLife: str(EXAMPLE.oldLife),
  accumulatedOpening: str(EXAMPLE.accumulatedOpening),
  month: EXAMPLE.month,
  commercial: EXAMPLE.commercial,
  basis: EXAMPLE.basis,
  fairValueGiven: str(EXAMPLE.fairValueGiven),
  fairValueReceived: str(EXAMPLE.fairValueReceived),
  cashDir: "paid" as "paid" | "received",
  cash: str(EXAMPLE.cashPaid),
  newLife: str(EXAMPLE.newLife),
  newSalvage: str(EXAMPLE.newSalvage),
};
type Form = typeof DEFAULTS;

const toInputs = (f: Form): ExchangeInputs => {
  const cash = parse(f.cash) || 0;
  return {
    oldCost: parse(f.oldCost),
    oldSalvage: parse(f.oldSalvage),
    oldLife: parse(f.oldLife),
    accumulatedOpening: parse(f.accumulatedOpening),
    month: f.month,
    commercial: f.commercial,
    basis: f.basis,
    fairValueGiven: parse(f.fairValueGiven),
    fairValueReceived: parse(f.fairValueReceived),
    cashPaid: f.cashDir === "paid" ? cash : 0,
    cashReceived: f.cashDir === "received" ? cash : 0,
    newLife: parse(f.newLife),
    newSalvage: parse(f.newSalvage),
  };
};

const cashTex = (x: ExchangeInputs) =>
  x.cashPaid > 0 ? ` + ${texNum(x.cashPaid)}` : x.cashReceived > 0 ? ` - ${texNum(x.cashReceived)}` : "";

function formulaRows(x: ExchangeInputs, r: ExchangeResult): FormulaRow[] {
  const rows: FormulaRow[] = [
    {
      label: `שלב 2 — פחת הנכס הישן מתחילת השנה ועד ההחלפה (${r.monthsBefore} חודשים)`,
      tex: String.raw`\text{פחת עד ההחלפה} = ${texNum(r.oldAnnual)} \times \frac{${r.monthsBefore}}{12} = ${texNum(r.depToDate)}`,
    },
    {
      label: "ערך בספרים ליום ההחלפה",
      tex: String.raw`${texNum(x.oldCost)} - (${texNum(x.accumulatedOpening)} + ${texNum(r.depToDate)}) = ${texNum(r.bookValue)}`,
    },
  ];
  if (!x.commercial)
    rows.push({ label: "שלב 3 — עלות הנכס החדש לפי הערך בספרים (אין רווח או הפסד)", tex: String.raw`${texNum(r.bookValue)}${cashTex(x)} = ${texNum(r.newCost)}` });
  else if (x.basis === "given")
    rows.push(
      { label: "שלב 3 — עלות הנכס החדש לפי השווי ההוגן של הנכס שנמסר", tex: String.raw`${texNum(x.fairValueGiven)}${cashTex(x)} = ${texNum(r.newCost)}` },
      { label: r.gain >= 0 ? "רווח מהחלפה" : "הפסד מהחלפה", tex: String.raw`${texNum(x.fairValueGiven)} - ${texNum(r.bookValue)} = ${texNum(r.gain)}` },
    );
  else
    rows.push(
      { label: "שלב 3 — עלות הנכס החדש = השווי ההוגן של הנכס שהתקבל", tex: String.raw`\text{עלות נכס חדש} = ${texNum(r.newCost)}` },
      {
        label: "השווי ההוגן של הנכס שנמסר, נגזר מהמתקבל",
        tex: String.raw`${texNum(x.fairValueReceived)}${x.cashPaid > 0 ? ` - ${texNum(x.cashPaid)}` : x.cashReceived > 0 ? ` + ${texNum(x.cashReceived)}` : ""} = ${texNum(r.fairValueGiven!)}`,
      },
      { label: r.gain >= 0 ? "רווח מהחלפה" : "הפסד מהחלפה", tex: String.raw`${texNum(r.fairValueGiven!)} - ${texNum(r.bookValue)} = ${texNum(r.gain)}` },
    );
  rows.push({
    label: `המשך השנה — פחת הנכס החדש (${r.monthsAfter} חודשים)`,
    tex: String.raw`\frac{${texNum(r.newCost)} - ${texNum(x.newSalvage)}}{${x.newLife}} \times \frac{${r.monthsAfter}}{12} = ${texNum(r.newDep)}`,
  });
  return rows;
}

export function ExchangeCalculator() {
  const [f, setF] = useState<Form>(DEFAULTS);
  const [mode, setMode] = useState<"full" | "net">("full");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const x = toInputs(f);
  const errors: Record<string, string | undefined> = exchangeErrors(x);
  const ok = Object.keys(errors).length === 0;
  const r = ok ? solveExchange(x) : null;
  const before = f.month - 1;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="min-w-0 space-y-5">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[17px] font-semibold text-fg">הנכס הישן</p>
            <button
              type="button"
              onClick={() => setF(DEFAULTS)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
            >
              <RotateCcw className="h-3.5 w-3.5" /> נתוני הדוגמה
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label="עלות מקורית" suffix="₪" value={f.oldCost} onChange={(v) => set("oldCost", v)} error={errors.oldCost} />
            <NumberInput label="ערך גרט" suffix="₪" value={f.oldSalvage} onChange={(v) => set("oldSalvage", v)} error={errors.oldSalvage} />
            <NumberInput label="אורך חיים" suffix="שנים" value={f.oldLife} onChange={(v) => set("oldLife", v)} error={errors.oldLife} />
            <NumberInput
              label="פחת נצבר לתחילת השנה"
              suffix="₪"
              value={f.accumulatedOpening}
              onChange={(v) => set("accumulatedOpening", v)}
              error={errors.accumulatedOpening}
            />
          </div>
          <div className="mt-4">
            <MonthPicker value={f.month} onChange={(m) => set("month", m)} label="חודש ההחלפה (בתחילת החודש)" />
            <p className="mt-2 text-xs text-muted">
              {before === 0
                ? "החלפה בינואר: אין פחת לנכס הישן בשנה זו, והנכס החדש מופחת שנה מלאה."
                : `ינואר עד ${MONTHS[before - 1]} = ${before} חודשי פחת לנכס הישן; ${MONTHS[f.month - 1]} עד דצמבר = ${12 - before} חודשים לנכס החדש.`}
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="mb-1 text-[17px] font-semibold text-fg">העסקה</p>
          <Segmented
            label="סיווג העסקה"
            value={f.commercial ? "yes" : "no"}
            onChange={(v) => set("commercial", v === "yes")}
            options={[
              ["yes", "יש מהות מסחרית", "ושווי הוגן מהימן — מכירים ברווח או בהפסד"],
              ["no", "אין מהות מסחרית", "או ששווי הוגן לא מהימן — בלי רווח או הפסד"],
            ]}
          />
          {f.commercial && (
            <>
              <Segmented
                label="איזה שווי הוגן ברור יותר?"
                value={f.basis}
                onChange={(v) => set("basis", v as Form["basis"])}
                options={[
                  ["given", "הנכס שנמסר", "המקרה הרגיל"],
                  ["received", "הנכס שהתקבל", "כשהוא ברור ומובהק יותר"],
                ]}
              />
              <div className="mt-4">
                {f.basis === "given" ? (
                  <NumberInput label="שווי הוגן — הנכס שנמסר" suffix="₪" value={f.fairValueGiven} onChange={(v) => set("fairValueGiven", v)} error={errors.fairValueGiven} />
                ) : (
                  <NumberInput
                    label="שווי הוגן — הנכס שהתקבל"
                    suffix="₪"
                    value={f.fairValueReceived}
                    onChange={(v) => set("fairValueReceived", v)}
                    error={errors.fairValueReceived}
                  />
                )}
              </div>
            </>
          )}
          <Segmented
            label="מזומן"
            value={f.cashDir}
            onChange={(v) => set("cashDir", v as Form["cashDir"])}
            options={[
              ["paid", "שילמנו מזומן", "בנוסף לנכס הישן"],
              ["received", "קיבלנו מזומן", "בנוסף לנכס החדש"],
            ]}
          />
          <div className="mt-3">
            <NumberInput label="סכום המזומן (0 אם אין)" suffix="₪" value={f.cash} onChange={(v) => set("cash", v)} error={errors.cashPaid} />
          </div>
        </div>

        <div className="card p-5">
          <p className="mb-4 text-[17px] font-semibold text-fg">הנכס החדש</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label="אורך חיים" suffix="שנים" value={f.newLife} onChange={(v) => set("newLife", v)} error={errors.newLife} />
            <NumberInput label="ערך גרט" suffix="₪" value={f.newSalvage} onChange={(v) => set("newSalvage", v)} error={errors.newSalvage} />
          </div>
          <p className="mt-3 text-xs text-muted">שיטת הפחת לשני הנכסים בסימולציה: קו ישר.</p>
        </div>
      </div>

      <div className="min-w-0 space-y-5">
        {!r ? (
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
              <Stat label="ערך בספרים ליום ההחלפה" value={<Num v={r.bookValue} />} />
              <Stat label="עלות הנכס החדש" value={<Num v={r.newCost} />} tone="accent" />
              <Stat
                label={!x.commercial ? "רווח / הפסד" : r.gain >= 0 ? "רווח מהחלפה" : "הפסד מהחלפה"}
                value={!x.commercial ? "לא מוכר" : <Num v={Math.abs(r.gain)} />}
                tone={!x.commercial ? "neutral" : r.gain >= 0 ? "success" : "warn"}
              />
              <Stat label="פחת הנכס החדש עד 31.12" value={<Num v={r.newDep} />} hint={`${r.monthsAfter} חודשים`} />
            </div>

            <FormulaCard title="לוח נוסחאות — החלפת נכסים" icon={<ArrowLeftRight className="h-4 w-4" />} rows={formulaRows(x, r)} />

            {r.monthsBefore > 0 && (
              <div className="card p-5">
                <p className="text-[17px] font-semibold text-fg">פקודה 1: פחת הנכס הישן עד יום ההחלפה</p>
                <JournalEntry title="השלמת פחת לנכס הישן" lines={catchUpLines(r)} />
              </div>
            )}

            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[17px] font-semibold text-fg">{r.monthsBefore > 0 ? "פקודה 2" : "פקודה 1"}: ההחלפה</p>
                <div className="flex gap-1" role="group" aria-label="סוג הפקודה">
                  {(
                    [
                      ["full", "מלאה"],
                      ["net", "מקוצרת"],
                    ] as const
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={mode === m}
                      onClick={() => setMode(m)}
                      className={cn("h-8 rounded-lg px-3 text-xs font-semibold transition-colors", mode === m ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <JournalEntry title={mode === "full" ? "פקודה מלאה" : "פקודה מקוצרת (נטו)"} lines={exchangeLines(x, r, mode)} />
            </div>

            <div className="card p-5">
              <p className="text-[17px] font-semibold text-fg">{r.monthsBefore > 0 ? "פקודה 3" : "פקודה 2"}: פחת הנכס החדש לסוף השנה</p>
              <JournalEntry title="פחת הנכס החדש" date="31.12" lines={yearEndLines(r)} />
              <p className="text-sm text-muted">
                סך הוצאות הפחת בשנת ההחלפה: <Num v={r.depToDate} /> + <Num v={r.newDep} /> = <Num v={r.totalDep} /> · יתרה בספרים של הנכס החדש
                ליום 31.12: <Num v={r.newBookValue} />.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
