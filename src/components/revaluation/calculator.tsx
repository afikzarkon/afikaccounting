"use client";

import { CircleCheck, Minus, Plus, RotateCcw, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { NumberInput, parseNumber as parse, Segmented } from "@/components/study/inputs";
import { Stat } from "@/components/study/ui";
import { inputClass } from "@/components/ui/form";
import { type RevaluationInputs, type RevMethod, revaluationErrors, solveRevaluation, type Timing, TIMING_LABEL, type Transfer } from "@/lib/learn/revaluation";
import { cn } from "@/lib/utils";
import { nettingLines, proportionalLines, SL_EX } from "./data";
import { RevSchedule } from "./schedule";

type Row = { year: string; timing: Timing; fairValue: string };
const DEFAULTS = {
  cost: String(SL_EX.cost),
  salvage: String(SL_EX.salvage),
  life: String(SL_EX.life),
  method: SL_EX.method,
  firstYear: String(SL_EX.firstYear),
  transfer: SL_EX.transfer,
  presentation: "netting" as "netting" | "proportional",
  revaluations: SL_EX.revaluations.map((r) => ({ year: String(r.year), timing: r.timing, fairValue: String(r.fairValue) })) as Row[],
};
type Form = typeof DEFAULTS;

const METHOD_OPTIONS: [RevMethod, string, string][] = [
  ["sl", "קו ישר", "אותו פחת בכל שנה"],
  ["db", "יתרה פוחתת", "שיעור קבוע על היתרה"],
  ["syd-desc", "ספרות השנים — יורד", "הגבוה בשנה הראשונה"],
  ["syd-asc", "ספרות השנים — עולה", "הגבוה בשנה האחרונה"],
];

const r2 = (v: number) => Math.round(v * 100) / 100;

const toInputs = (f: Form): RevaluationInputs => ({
  cost: parse(f.cost),
  salvage: parse(f.salvage),
  life: parse(f.life),
  method: f.method,
  firstYear: parse(f.firstYear),
  transfer: f.transfer,
  revaluations: f.revaluations.map((r) => ({ year: parse(r.year), timing: r.timing, fairValue: parse(r.fairValue) })),
});

export function RevaluationCalculator() {
  const [f, setF] = useState<Form>(DEFAULTS);
  const [pick, setPick] = useState(0);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const setRow = (i: number, patch: Partial<Row>) => set("revaluations", f.revaluations.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const x = toInputs(f);
  const errors = revaluationErrors(x);
  const r = Object.keys(errors).length ? null : solveRevaluation(x);
  const anyLoss = r?.events.some((e) => e.pl < -0.005) ?? false;
  const event = r ? Math.min(pick, r.events.length - 1) : 0;
  const checkHolds = r && x.transfer === "depreciation" && !anyLoss && r.rows.every((row) => Math.abs(row.surplus - (row.closing - row.costCarrying)) < 0.02);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="min-w-0 space-y-5">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[17px] font-semibold text-fg">המבנה</p>
            <button
              type="button"
              onClick={() => setF(DEFAULTS)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
            >
              <RotateCcw className="h-3.5 w-3.5" /> נתוני הדוגמה
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label="עלות" suffix="₪" value={f.cost} onChange={(v) => set("cost", v)} error={errors.cost} />
            <NumberInput label="ערך גרט" suffix="₪" value={f.salvage} onChange={(v) => set("salvage", v)} error={errors.salvage} />
            <NumberInput label="אורך חיים" suffix="שנים" value={f.life} onChange={(v) => set("life", v)} error={errors.life} />
            <YearInput label="שנת הרכישה (ב-1 בינואר)" value={f.firstYear} onChange={(v) => set("firstYear", v)} error={errors.firstYear} />
          </div>
          <Segmented label="שיטת הפחת" value={f.method} onChange={(v) => set("method", v as RevMethod)} options={METHOD_OPTIONS} />
        </div>

        <div className="card p-5">
          <p className="mb-3 text-[17px] font-semibold text-fg">הערכות מחדש</p>
          <div className="space-y-3">
            {f.revaluations.map((row, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface-2/40 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <YearInput label="שנה" value={row.year} onChange={(v) => setRow(i, { year: v })} />
                  <TimingSelect value={row.timing} onChange={(v) => setRow(i, { timing: v })} />
                  <NumberInput label="שווי הוגן" suffix="₪" value={row.fairValue} onChange={(v) => setRow(i, { fairValue: v })} />
                </div>
                {errors[`revaluations.${i}`] && <p className="mt-1.5 text-xs text-danger">{errors[`revaluations.${i}`]}</p>}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={f.revaluations.length >= 15}
              onClick={() => {
                const last = f.revaluations.at(-1);
                set("revaluations", [...f.revaluations, { year: String((parse(last?.year ?? f.firstYear) || 0) + 1), timing: "end", fairValue: last?.fairValue ?? f.cost }]);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> הערכה נוספת
            </button>
            <button
              type="button"
              disabled={f.revaluations.length <= 1}
              onClick={() => set("revaluations", f.revaluations.slice(0, -1))}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" /> הסרת האחרונה
            </button>
          </div>
          <Segmented
            label="העברה לעודפים"
            value={f.transfer}
            onChange={(v) => set("transfer", v as Transfer)}
            options={[
              ["depreciation", "בקצב הפחת", "כל שנה: פחת חדש פחות פחת מקורי"],
              ["disposal", "בגריעה בלבד", "הקרן נשארת שלמה עד המכירה"],
            ]}
          />
          <Segmented
            label="הפחת הנצבר ביום ההערכה"
            value={f.presentation}
            onChange={(v) => set("presentation", v as Form["presentation"])}
            options={[
              ["netting", "שיטת הביטול", "מבטלים את הפחת הנצבר"],
              ["proportional", "התאמה יחסית", "עלות ופחת באותו יחס"],
            ]}
          />
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
              <Stat label="ערך בספרים לפני ההערכה הראשונה" value={<Num v={r.events[0].before} />} />
              <Stat label="לקרן הערכה מחדש (סה״כ)" value={<Num v={r.events.reduce((s, e) => s + e.oci, 0)} />} tone="accent" />
              <Stat label="לרווח והפסד (סה״כ)" value={<Num v={r.events.reduce((s, e) => s + e.pl, 0)} />} tone={anyLoss ? "warn" : "neutral"} />
              <Stat label="פחת בשנה הראשונה אחרי ההערכה" value={<Num v={r.events[0].firstYearCharge} />} />
            </div>

            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
                checkHolds ? "border-success/30 bg-success/[0.06] text-fg" : "border-line bg-surface-2/50 text-muted",
              )}
            >
              {checkHolds ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>
                {checkHolds
                  ? "טיפ הבדיקה מתקיים בכל שנה: יתרת הקרן = ערך בספרים משוערך פחות ערך בספרים לפי מודל העלות."
                  : x.transfer === "disposal"
                    ? "בהעברה בגריעה בלבד הקרן נשארת בגובה העליות המלא — טיפ הבדיקה לא חל."
                    : "נזקף הפסד לרווח והפסד, ולכן טיפ הבדיקה כבר לא מדויק."}
              </span>
            </div>

            <DataTable
              caption="ההערכות מחדש"
              head={["מועד", "ערך בספרים לפני", "שווי הוגן", "פער", "לקרן", "לרווח והפסד", "פחת שנתי חדש"]}
              rows={r.events.map((ev) => [
                `${TIMING_LABEL[ev.timing]} ${ev.year}`,
                r2(ev.before),
                ev.fairValue,
                r2(ev.diff) + 0,
                r2(ev.oci) + 0,
                r2(ev.pl) + 0,
                r2(ev.firstYearCharge),
              ])}
              highlight={r.events.map((ev, i) => (Math.abs(ev.pl) > 0.005 ? i : -1)).filter((i) => i >= 0)}
            />

            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[17px] font-semibold text-fg">פקודת היומן להערכה</p>
                <div className="flex flex-wrap gap-1" role="group" aria-label="איזו הערכה">
                  {r.events.map((ev, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={i === event}
                      onClick={() => setPick(i)}
                      className={cn("num h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors", i === event ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg")}
                    >
                      {ev.year}
                    </button>
                  ))}
                </div>
              </div>
              <JournalEntry
                title={`${TIMING_LABEL[r.events[event].timing]} ${r.events[event].year} — ${f.presentation === "netting" ? "שיטת הביטול" : "התאמה יחסית"}`}
                lines={f.presentation === "netting" ? nettingLines(r.events[event]) : proportionalLines(r.events[event])}
              />
            </div>

            <RevSchedule r={r} caption="לוח שנה אחרי שנה" />
          </>
        )}
      </div>
    </div>
  );
}

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
        className={`${inputClass} num text-start font-mono`}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function TimingSelect({ value, onChange }: { value: Timing; onChange: (v: Timing) => void }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg">
        מועד
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as Timing)} className={inputClass}>
        {(Object.keys(TIMING_LABEL) as Timing[]).map((t) => (
          <option key={t} value={t}>
            {TIMING_LABEL[t]}
          </option>
        ))}
      </select>
    </div>
  );
}
