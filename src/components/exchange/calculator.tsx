"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { JournalEntry, Num } from "@/components/study/blocks";
import { NumberInput, parseNumber as parse, Segmented } from "@/components/study/inputs";
import { MONTHS, MonthPicker } from "@/components/study/month-picker";
import { Stat } from "@/components/study/ui";
import { type DepMethod, exchangeErrors, type ExchangeInputs, type ExchangeResult, type ExchangeStep, explainExchange, solveExchange } from "@/lib/learn/exchange";
import { renderTex } from "@/lib/tex";
import { cn } from "@/lib/utils";
import { catchUpLines, EXAMPLE, exchangeLines, yearEndLines } from "./entries";

const str = (v: number) => String(v);
const DEFAULTS = {
  oldCost: str(EXAMPLE.oldCost),
  oldSalvage: str(EXAMPLE.oldSalvage),
  oldLife: str(EXAMPLE.oldLife),
  // The example's 150,000 accumulated by straight-line is three years of use.
  yearsUsed: str(Math.round(EXAMPLE.accumulatedOpening / ((EXAMPLE.oldCost - EXAMPLE.oldSalvage) / EXAMPLE.oldLife))),
  oldMethod: "sl" as DepMethod,
  newMethod: "sl" as DepMethod,
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
    accumulatedOpening: 0,
    yearsUsed: parse(f.yearsUsed),
    oldMethod: f.oldMethod,
    newMethod: f.newMethod,
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

const METHOD_OPTIONS: [DepMethod, string, string][] = [
  ["sl", "קו ישר", "אותו פחת בכל שנה"],
  ["db", "יתרה פוחתת", "שיעור קבוע על היתרה"],
  ["syd-desc", "ספרות השנים — יורד", "הגבוה בשנה הראשונה"],
  ["syd-asc", "ספרות השנים — עולה", "הגבוה בשנה האחרונה"],
];

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
    <div className="space-y-6">
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
              label="שנים מלאות בשימוש לפני שנת ההחלפה"
              suffix="שנים"
              value={f.yearsUsed}
              onChange={(v) => set("yearsUsed", v)}
              error={errors.yearsUsed}
            />
          </div>
          <Segmented label="שיטת הפחת של הנכס הישן" value={f.oldMethod} onChange={(v) => set("oldMethod", v as DepMethod)} options={METHOD_OPTIONS} />
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
          <Segmented label="שיטת הפחת של הנכס החדש" value={f.newMethod} onChange={(v) => set("newMethod", v as DepMethod)} options={METHOD_OPTIONS} />
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

            <a href="#exchange-walk" className="no-print flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-accent-soft/70">
              איך הגענו לכל מספר? הדרך המלאה, שלב אחר שלב — מתחת למחשבון
              <span aria-hidden>↓</span>
            </a>
          </>
        )}
      </div>
    </div>
    {r && <ExchangeWalk x={x} r={r} mode={mode} setMode={setMode} />}
    </div>
  );
}

/**
 * The whole working: the page's three steps, the new asset to year end and the
 * years after — each step says why it is done, then every operation on its own,
 * and the journal entry it ends with.
 */
function ExchangeWalk({ x, r, mode, setMode }: { x: ExchangeInputs; r: ExchangeResult; mode: "full" | "net"; setMode: (m: "full" | "net") => void }) {
  const entry = (s: ExchangeStep) =>
    s.entry === "catch-up" ? (
      <JournalEntry title="פקודה: פחת הנכס הישן עד יום ההחלפה" lines={catchUpLines(r)} />
    ) : s.entry === "exchange" ? (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-fg">פקודה: ההחלפה</p>
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
        <JournalEntry
          title={mode === "full" ? "פקודה מלאה — העלות והפחת הנצבר של הישן יוצאים כל אחד בנפרד" : "פקודה מקוצרת — הערך בספרים של הישן יוצא בשורה אחת"}
          lines={exchangeLines(x, r, mode)}
        />
      </div>
    ) : s.entry === "year-end" ? (
      <JournalEntry title="פקודה: פחת הנכס החדש עד סוף השנה" date="31.12" lines={yearEndLines(r)} />
    ) : null;
  return (
    <section id="exchange-walk" aria-labelledby="exchange-walk-h" className="scroll-mt-32 space-y-4">
      <div>
        <h3 id="exchange-walk-h" className="text-xl font-semibold text-fg">
          הדרך המלאה, שלב אחר שלב
        </h3>
        <p className="mt-1 text-[14px] text-muted">כל מספר במחשבון — מאיפה הוא בא. שלושת שלבי הפתרון, הנכס החדש עד סוף השנה, והשנים שאחריה.</p>
      </div>
      <ol className="space-y-4">
        {explainExchange(x, r).map((s) => (
          <li key={s.id} className="card overflow-hidden">
            <p className="border-b border-line bg-surface-2/50 px-5 py-3 text-[16px] font-semibold text-fg">{s.title}</p>
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-lg border-s-4 border-accent/60 bg-accent-soft/40 px-3 py-2 text-[13.5px] leading-relaxed text-fg/90">
                <span className="font-semibold text-fg">למה? </span>
                {s.why}
              </p>
              {s.text.map((t) => (
                <p key={t} className="text-[14.5px] leading-relaxed text-fg/90">
                  {t}
                </p>
              ))}
              {s.calcs.length > 0 && (
                <ol className="space-y-2">
                  {s.calcs.map((c, i) => (
                    <li key={i} className="rounded-lg border border-line bg-surface px-3 py-2.5">
                      <p className="flex items-start gap-2 text-[14px] font-medium text-fg">
                        <span className="num mt-0.5 grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-surface-2 px-1 text-[11px] font-bold text-muted">{i + 1}</span>
                        <span className="min-w-0">{c.label}</span>
                      </p>
                      <div dir="ltr" className="mt-1.5 overflow-x-auto rounded-md bg-surface-2/60 px-3 py-1 text-[15px]" dangerouslySetInnerHTML={{ __html: renderTex(c.tex, true) }} />
                      {c.note && <p className="mt-1.5 text-[12.5px] text-muted">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
              {entry(s)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
