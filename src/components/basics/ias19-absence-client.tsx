"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { AbsenceMode } from "@/lib/learn/ias19-absence";
import { cn } from "@/lib/utils";

/**
 * The guide's A/B switch: one assumption for every table of lesson 3's
 * walkthrough, kept across its screens (and, where storage works, across visits).
 */
const KEY = "ias19-absence-mode";
let mode: AbsenceMode = "A";
let loaded = false;
const listeners = new Set<() => void>();
function load() {
  if (loaded) return;
  loaded = true;
  try {
    if (localStorage.getItem(KEY) === "B") mode = "B";
  } catch {}
}
function setMode(m: AbsenceMode) {
  mode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {}
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
function useMode() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return mode;
    },
    () => "A" as AbsenceMode,
  );
}

const LABEL: Record<AbsenceMode, string> = { A: "א׳ לא מבשילה", B: "ב׳ מבשילה" };

function Seg<T extends string | number>({ value, options, onPick, label }: { value: T; options: { v: T; label: string }[]; onPick: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-lg border border-line-strong">
      {options.map((o, i) => (
        <button
          key={String(o.v)}
          type="button"
          aria-pressed={o.v === value}
          onClick={() => onPick(o.v)}
          className={cn("min-h-9 px-3 py-1.5 text-[14px]", i > 0 && "border-s border-line-strong", o.v === value ? "bg-accent font-semibold text-accent-fg" : "bg-surface text-fg hover:bg-surface-2")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The switch, with what it does. */
export function ModeSwitch() {
  const m = useMode();
  return (
    <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
      <span>הנחה בחישובים:</span>
      <Seg label="בחירת הנחה" value={m} onPick={setMode} options={(["A", "B"] as const).map((v) => ({ v, label: LABEL[v] }))} />
    </div>
  );
}

/** The same step worked in both assumptions on the server; the switch shows one. */
export function ByMode({ a, b, switcher = true }: { a: ReactNode; b: ReactNode; switcher?: boolean }) {
  const m = useMode();
  return (
    <div className="space-y-3">
      {switcher && <ModeSwitch />}
      <div>{m === "A" ? a : b}</div>
    </div>
  );
}

/** The assumption chosen, highlighted in a two-column comparison. */
export function ModeMark({ of, children }: { of: AbsenceMode; children: ReactNode }) {
  const m = useMode();
  return <span className={cn("block rounded px-1", m === of && "bg-accent-soft")}>{children}</span>;
}

/** Step 1: two questions, and what they make of the absence. */
export function ClassifyAbsence() {
  const [carries, setCarries] = useState(true);
  const [vests, setVests] = useState(false);
  const radio = (name: string, checked: boolean, on: () => void, text: string, disabled = false) => (
    <label className={cn("inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-[15px]", checked ? "border-accent bg-accent-soft" : "border-line bg-surface", disabled && "cursor-not-allowed opacity-50")}>
      <input type="radio" name={name} checked={checked} onChange={on} disabled={disabled} className="accent-[var(--color-accent)]" /> {text}
    </label>
  );
  return (
    <div className="space-y-3">
      <fieldset className="space-y-1.5">
        <legend className="text-[15px] font-semibold">האם ימים שלא נוצלו עוברים לשנה הבאה?</legend>
        <div className="flex flex-wrap gap-2">
          {radio("ab-q1", carries, () => setCarries(true), "כן, נצבר")}
          {radio("ab-q1", !carries, () => setCarries(false), "לא, פוקע בסוף השנה")}
        </div>
      </fieldset>
      <fieldset className="space-y-1.5">
        <legend className="text-[15px] font-semibold">האם עובד שעוזב מקבל כסף על היתרה?</legend>
        <div className="flex flex-wrap gap-2">
          {radio("ab-q2", carries && vests, () => setVests(true), "כן, מבשיל", !carries)}
          {radio("ab-q2", carries && !vests, () => setVests(false), "לא, מפסיד אותה", !carries)}
        </div>
      </fieldset>
      <div aria-live="polite" className="rounded-xl bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
        {!carries ? (
          <>
            <strong className="block text-[17px]">אין הפרשה</strong>
            הימים פוקעים בסוף השנה. רושמים הוצאה רק כשההיעדרות קורית, ולכן אין מה לחשב בפתיחה ובסגירה.
          </>
        ) : (
          <>
            <strong className="block text-[17px]">{vests ? "הנחה ב׳: נצבר ומבשיל" : "הנחה א׳: נצבר ולא מבשיל"}</strong>
            {vests ? "העוזבים הצפויים נכנסים על כל היתרה שלהם, והנשארים לפי הניצול הצפוי." : "מפרישים רק על ימים שצפויים להיות מנוצלים מהיתרה. מי שעוזב מפסיד את היתרה."}
            <Button size="sm" variant="outline" className="mt-2 block" onClick={() => setMode(vests ? "B" : "A")}>
              לפתור את הדוגמה בהנחה {vests ? "ב׳" : "א׳"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

const nf = (x: number) => String(Math.round(x * 100) / 100);
const money = (x: number) => Math.round(x).toLocaleString("en-US");

/** Step 2: a slider of a year's absence, and the days it takes out of the carried balance. */
export function DayStrip({ entitlement, balance, dayCost, initial }: { entitlement: number; balance: number; dayCost: number; initial: number }) {
  const [use, setUse] = useState(initial);
  const max = entitlement + balance + 2;
  const v = Math.min(balance, Math.max(0, use - entitlement));
  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-3 text-[15px]">
        <span>ימי היעדרות צפויים לעובד בשנה</span>
        <input type="range" min={0} max={max} step={0.5} value={use} onChange={(e) => setUse(Number(e.target.value))} className="min-w-44 flex-1 accent-[var(--color-accent)]" />
        <bdi dir="ltr" className="num font-bold">
          {nf(use)}
        </bdi>
      </label>
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: max }, (_, k) => {
          const fill = Math.max(0, Math.min(1, use - k));
          const zone = k < entitlement ? "own" : k < entitlement + balance ? "carried" : "none";
          return (
            <div
              key={k}
              className={cn(
                "relative grid h-12 w-14 place-items-center overflow-hidden rounded-lg border text-[12.5px]",
                zone === "carried" ? "border-series-4" : zone === "none" ? "border-dashed border-line text-muted" : "border-line",
              )}
            >
              <i className={cn("absolute inset-y-0 end-0", zone === "carried" ? "bg-series-4/30" : "bg-accent/25")} style={{ width: `${fill * 100}%` }} />
              <span className="relative">יום {k + 1}</span>
            </div>
          );
        })}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        <span>מסגרת רגילה: זכאות השנה, שכר רגיל</span>
        <span className="text-series-4">מסגרת כתומה: יתרה מהשנה הקודמת, {balance} ימים</span>
        <span>מקווקו: אין יותר יתרה</span>
      </p>
      <div aria-live="polite" className="rounded-lg bg-surface-2 px-3.5 py-2.5 text-[15px] leading-relaxed">
        ימי יתרה:{" "}
        <bdi dir="ltr" className="num font-semibold">{`MIN(${balance}, MAX(0, ${nf(use)} − ${entitlement})) = ${nf(v)}`}</bdi>
        <br />
        הפרשה לעובד: <bdi dir="ltr" className="num font-semibold">{`${nf(v)} × ${dayCost} = ${money(v * dayCost)} ₪`}</bdi>
        <br />
        {use <= entitlement ? "כל הימים הם שכר רגיל, ולכן אין הפרשה." : use <= entitlement + balance ? `הימים שמעבר ל-${entitlement} נלקחים מהיתרה, והם עלות נוספת.` : "היתרה נגמרה. ימים נוספים לא נובעים מהצבירה."}
      </div>
    </div>
  );
}

type Answers = { opening: number; expense: number; payments: number; closing: number };
const FIELDS: { k: keyof Answers; label: string }[] = [
  { k: "opening", label: "יתרת פתיחה (ש״ח)" },
  { k: "expense", label: "הוצאות שכר עבודה (ש״ח)" },
  { k: "payments", label: "תשלומים (ש״ח)" },
  { k: "closing", label: "יתרת סגירה (ש״ח)" },
];
const parse = (s: string) => {
  const t = s.replace(/[,\s₪]/g, "");
  return t === "" ? NaN : Number(t);
};

/** A summary exam's four amounts, for each assumption it asks: type, check, and a hint by the line that is off. */
export function ExamCheck({ id, sets, hints }: { id: string; sets: { mode: AbsenceMode; answers: Answers }[]; hints: Record<AbsenceMode, Record<keyof Answers, string>> }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const keyOf = (m: AbsenceMode, k: keyof Answers) => `${m}-${k}`;
  const check = () => {
    const missing = sets.some((s) => FIELDS.some((f) => Number.isNaN(parse(vals[keyOf(s.mode, f.k)] ?? ""))));
    if (missing) {
      setError(`הזינו את ${sets.length > 1 ? "כל הסכומים" : "ארבעת הסכומים"} כמספרים לפני הבדיקה.`);
      setChecked(false);
      return;
    }
    setError("");
    setChecked(true);
  };
  return (
    <div className="space-y-4">
      {sets.map((s) => {
        const got = (k: keyof Answers) => parse(vals[keyOf(s.mode, k)] ?? "");
        return (
          <fieldset key={s.mode} className="space-y-2">
            {sets.length > 1 && <legend className="text-[15px] font-bold">הנחה {s.mode === "A" ? "א׳: לא מבשילה" : "ב׳: מבשילה"}</legend>}
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => {
                const ok = Math.round(got(f.k)) === Math.round(s.answers[f.k]);
                const expOk = f.k === "expense" && Math.round(got("expense")) === Math.round(got("closing") - got("opening") + got("payments"));
                return (
                  <label key={f.k} className="flex min-w-0 flex-col gap-1 text-[14px] font-semibold">
                    {f.label}
                    <input
                      id={`${id}-${keyOf(s.mode, f.k)}`}
                      inputMode="decimal"
                      autoComplete="off"
                      dir="ltr"
                      value={vals[keyOf(s.mode, f.k)] ?? ""}
                      onChange={(e) => {
                        setVals((v) => ({ ...v, [keyOf(s.mode, f.k)]: e.target.value }));
                        setChecked(false);
                        setError("");
                      }}
                      className="num min-h-10 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-end text-[16px] font-normal text-fg"
                    />
                    {checked && (
                      <span className={cn("text-[13.5px] font-normal", ok ? "text-success" : "text-danger")}>
                        {ok ? "נכון" : expOk ? "ההוצאה נכונה לפי הסכומים שלכם. תקנו את הסכום השגוי בשורות האחרות." : `לא מדויק. ${hints[s.mode][f.k]}`}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      <p role="alert" className="min-h-5 text-[14px] text-danger">
        {error}
      </p>
      <Button onClick={check}>בדיקה</Button>
    </div>
  );
}
