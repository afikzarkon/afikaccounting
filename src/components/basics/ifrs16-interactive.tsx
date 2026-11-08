"use client";

import { ChevronLeft, ChevronRight, CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { Fragment, useState } from "react";
import { JournalEntry } from "@/components/study/blocks";
import { leaseTerm, lessee, pvEnd, shownYears, statementLines } from "@/lib/learn/ifrs16";
import { drill, DRILL_FAMILIES, type DrillFamily, statementDrill, type StatementTask } from "@/lib/study/ifrs16/drills";
import { CONTRACT_TEST, CONTRACT_TEST_START, type TestEnd, type TestNode } from "@/lib/study/ifrs16/lessons/what";
import { cn } from "@/lib/utils";
import { AssetCycle, LiabilityCycle, StatementTables, Tbl } from "./ifrs16-parts";

const isEnd = (n: TestNode | TestEnd): n is TestEnd => "verdict" in n;

/** An amount in a small labelled box. */
function Amount({ label, value, onChange, step = 1000 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block text-[13.5px] text-muted">
      {label}
      <input type="number" inputMode="decimal" min={0} step={step} value={value} onChange={(e) => onChange(Math.max(0, +e.target.value || 0))} dir="ltr" className="num mt-1 block min-h-11 w-full rounded-lg border border-line-strong bg-surface px-2 text-[15px] text-fg" />
    </label>
  );
}

/**
 * The asset's cost, built line by line (paragraph 24): change a figure, and
 * the liability, the cost and the day's journal entry all follow.
 */
export function RouBuilder() {
  const [payment, setPayment] = useState(40_000);
  const [years, setYears] = useState(5);
  const [ratePct, setRatePct] = useState(6);
  const [atStart, setAtStart] = useState(false);
  const [prepaid, setPrepaid] = useState(0);
  const [incentives, setIncentives] = useState(3_000);
  const [directCosts, setDirectCosts] = useState(2_000);
  const [restoration, setRestoration] = useState(5_000);
  const l = lessee({ payment, years, rate: ratePct / 100, timing: atStart ? "start" : "end", prepaid, incentives, directCosts, restoration });
  const paidToday = atStart ? payment : 0;
  const net = Math.round(l.liability - paidToday);
  const cash = paidToday + prepaid - incentives + directCosts;
  const cost = net + cash + restoration;
  return (
    <section aria-label="בונים את עלות הנכס" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Amount label="תשלום לשנה" value={payment} onChange={setPayment} />
        <Amount label="שנים" value={years} onChange={(v) => setYears(Math.min(30, Math.max(1, Math.round(v))))} step={1} />
        <Amount label="ריבית (%)" value={ratePct} onChange={(v) => setRatePct(Math.max(0.1, v))} step={0.5} />
        <Amount label="מקדמות" value={prepaid} onChange={setPrepaid} />
        <Amount label="תמריצים" value={incentives} onChange={setIncentives} />
        <Amount label="עלויות ישירות" value={directCosts} onChange={setDirectCosts} />
        <Amount label="פירוק (ערך נוכחי)" value={restoration} onChange={setRestoration} />
      </div>
      <Toggle label="התשלום בתחילת כל שנה, והראשון שולם היום" on={atStart} onChange={setAtStart} />
      <Tbl
        head={["רכיב", "סכום"]}
        rows={[
          ["התחייבות החכירה", net],
          ...(paidToday ? ([["תשלום של היום", paidToday]] as [string, number][]) : []),
          ...(prepaid ? ([["מקדמות", prepaid]] as [string, number][]) : []),
          ["תמריצים", -incentives],
          ["עלויות ישירות", directCosts],
          ["פירוק", restoration],
        ]}
        foot={["עלות הנכס", cost]}
      />
      <JournalEntry
        title="פקודת היומן במועד התחילה"
        lines={[
          { account: "נכס זכות שימוש", dr: cost },
          ...(cash < 0 ? [{ account: "מזומן", dr: -cash }] : []),
          { account: "התחייבות חכירה", cr: net },
          ...(cash > 0 ? [{ account: "מזומן", cr: cash }] : []),
          ...(restoration ? [{ account: "הפרשה לפירוק ופינוי", cr: restoration }] : []),
        ]}
      />
    </section>
  );
}

/** Endless practice: pick a family, solve, check within two shekels, and see the whole solution. */
/** `mixed` hides the topic: each new exercise comes from the next family, unnamed. */
export function LeaseDrill({ families, mixed }: { families: DrillFamily[]; mixed?: boolean }) {
  const [picked, setFamily] = useState(families[0]);
  const [seed, setSeed] = useState(1);
  const family = mixed ? families[(seed - 1) % families.length] : picked;
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const d = drill(family, seed);
  const value = Number(typed.replaceAll(",", ""));
  const right = checked && Number.isFinite(value) && Math.abs(value - d.answer) <= 2;
  const reset = () => {
    setTyped("");
    setChecked(false);
    setShown(false);
  };
  return (
    <section aria-label="מחולל תרגילים" className="card space-y-3 p-4 sm:p-5">
      {!mixed && (
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="סוג תרגיל">
        {families.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === family}
            onClick={() => {
              setFamily(f);
              reset();
            }}
            className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", f === family ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}
          >
            {DRILL_FAMILIES[f]}
          </button>
        ))}
      </div>
      )}
      <p className="text-[16px] leading-relaxed font-semibold text-fg">{d.prompt}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setChecked(false);
          }}
          inputMode="decimal"
          dir="ltr"
          aria-label={`התשובה ב${d.unit}`}
          className="num min-h-11 w-40 rounded-lg border border-line-strong bg-surface px-3 text-[15px] text-fg"
        />
        <button type="button" onClick={() => setChecked(true)} disabled={!typed.trim()} className="min-h-11 rounded-lg bg-accent px-4 text-[14.5px] font-semibold text-accent-fg disabled:opacity-50">
          בדיקה
        </button>
        <button type="button" onClick={() => setShown((v) => !v)} className="min-h-11 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent">
          {shown ? "הסתרת הפתרון" : "הצגת הפתרון המלא"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> תרגיל חדש
        </button>
      </div>
      {checked && (
        <p aria-live="polite" className={cn("text-[15px] font-semibold", right ? "text-success" : "text-danger")}>
          {right ? "נכון." : "לא בדיוק. נסו שוב, או פתחו את הפתרון המלא."}
        </p>
      )}
      {shown && (
        <div className="space-y-2.5 rounded-xl border border-line bg-surface-2/40 p-3.5 text-[14.5px]">
          {d.steps.map((s) => (
            <div key={s.title}>
              <p className="font-bold text-fg">{s.title}</p>
              {s.note && <p>{s.note}</p>}
              {s.formula && <p dir="ltr" className="text-start break-words text-muted [unicode-bidi:plaintext]">{s.formula}</p>}
              {s.numbers && <p dir="ltr" className="num break-words">{s.numbers}</p>}
            </div>
          ))}
          <p>
            <strong>התשובה:</strong> <span className="num">{d.answer.toLocaleString("en-US")}</span> {d.unit}
          </p>
          <p>
            <strong>מלכודת נפוצה:</strong> {d.trap}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * A lease, year by year: change the terms, step through the years, and watch
 * both cycles and the year's lines in the statements. The bars show the two
 * balances over the whole lease, the year we stand in lit.
 */
export function LeaseLab() {
  const [payment, setPayment] = useState(30_000);
  const [years, setYears] = useState(4);
  const [ratePct, setRatePct] = useState(7);
  const [life, setLife] = useState(6);
  const [atStart, setAtStart] = useState(false);
  const [hasOption, setHasOption] = useState(false);
  const [option, setOption] = useState(10_000);
  const [at, setAt] = useState(1);
  const year = Math.min(at, years);
  const depYears = hasOption ? life : Math.min(life, years);
  const { cost, rows } = shownYears({ payment, years, rate: ratePct / 100, timing: atStart ? "start" : "end", finalAmount: hasOption ? option : 0, depreciationYears: depYears });
  const row = rows[year - 1];
  const sections = statementLines(rows, year).map((s) => ({ ...s, rows: s.rows.map((r) => ({ ...r, values: [r.values[year - 1]] })) }));
  const max = Math.max(cost, ...rows.map((r) => r.opening), 1);
  return (
    <section aria-label="מעבדת חכירה, שנה אחרי שנה" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Amount label="תשלום לשנה" value={payment} onChange={setPayment} />
        <Amount label="שנות חכירה" value={years} onChange={(v) => setYears(Math.min(12, Math.max(2, Math.round(v))))} step={1} />
        <Amount label="ריבית (%)" value={ratePct} onChange={(v) => setRatePct(Math.max(0.1, v))} step={0.5} />
        <Amount label="אורך חיים (שנים)" value={life} onChange={(v) => setLife(Math.min(40, Math.max(1, Math.round(v))))} step={1} />
      </div>
      <div className="flex flex-wrap gap-x-5">
        <Toggle label="התשלום בתחילת כל שנה" on={atStart} onChange={setAtStart} />
        <Toggle label="ודאי שתמומש אופציית רכישה" on={hasOption} onChange={setHasOption} />
      </div>
      {hasOption && (
        <div className="max-w-44">
          <Amount label="מחיר האופציה, בסוף התקופה" value={option} onChange={setOption} />
        </div>
      )}
      <p className="text-[14.5px] text-fg">
        עלות הנכס <strong className="num">{cost.toLocaleString("en-US")}</strong>, פחת על פני <strong className="num">{depYears}</strong> שנים.
      </p>
      <div>
        <div className="flex items-end gap-1 border-b-2 border-line-strong" style={{ height: "7rem" }} role="img" aria-label={`יתרות ההתחייבות והנכס בסוף כל שנה. בסוף שנה ${year}: התחייבות ${row.closing}, נכס ${row.rightOfUse}`}>
          {rows.map((r) => (
            <button key={r.year} type="button" onClick={() => setAt(r.year)} aria-label={`שנה ${r.year}`} className={cn("flex h-full min-w-0 flex-1 items-end justify-center gap-px rounded-t", r.year === year && "bg-amber-400/20")}>
              <span className="w-full max-w-5 rounded-t-sm bg-[var(--credit)] transition-[height] duration-300 motion-reduce:transition-none" style={{ height: `${(r.closing / max) * 100}%` }} />
              <span className="w-full max-w-5 rounded-t-sm bg-accent transition-[height] duration-300 motion-reduce:transition-none" style={{ height: `${(r.rightOfUse / max) * 100}%` }} />
            </button>
          ))}
        </div>
        <p className="mt-1.5 flex flex-wrap gap-x-4 text-[12.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[var(--credit)]" /> התחייבות בסוף השנה
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-accent" /> נכס בסוף השנה
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" disabled={year <= 1} onClick={() => setAt(year - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent disabled:opacity-40">
          <ChevronRight className="h-4 w-4" aria-hidden /> קודמת
        </button>
        <strong aria-live="polite" className="text-[16px] text-fg">
          שנה <span className="num">{year}</span> מתוך <span className="num">{years}</span>
        </strong>
        <button type="button" disabled={year >= years} onClick={() => setAt(year + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent disabled:opacity-40">
          הבאה <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <LiabilityCycle rows={[row]} />
        <AssetCycle rows={[row]} cost={year > 1 ? rows[year - 2].rightOfUse : cost} />
      </div>
      <StatementTables sections={sections} years={[year]} />
    </section>
  );
}

const typed = (s: string) => {
  const n = Number(s.replace(/[,\s()]/g, ""));
  return s.trim() === "" ? 0 : Math.abs(n);
};

/**
 * The statements, to fill in: every line a cell, each checked to within two
 * shekels, with the whole solution one press away. The first columns can come
 * filled in, for a first try. A blank cell counts as zero.
 */
export function StatementFill({ task, onNext }: { task: StatementTask; onNext?: () => void }) {
  const [cells, setCells] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const yearsCols = Array.from({ length: task.years }, (_, i) => i);
  const asked = task.sections.flatMap((s) => s.rows.flatMap((r) => yearsCols.filter((i) => i >= task.given).map((i) => ({ key: `${r.id}-${i}`, want: r.values[i] }))));
  const isRight = (key: string, want: number) => Math.abs(typed(cells[key] ?? "") - want) <= 2;
  const rightCount = asked.filter((c) => isRight(c.key, c.want)).length;
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full table-fixed text-[13px]">
          <colgroup>
            <col className="w-[36%] sm:w-[40%]" />
            {yearsCols.map((i) => (
              <col key={i} />
            ))}
          </colgroup>
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-1.5 py-1.5 text-start font-medium sm:px-3">סעיף</th>
              {yearsCols.map((i) => (
                <th key={i} className="px-1 py-1.5 text-center font-medium">
                  שנה {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {task.sections.map((s) => (
              <Fragment key={s.title}>
                <tr className="border-t border-line bg-surface-2/60">
                  <th colSpan={task.years + 1} scope="colgroup" className="px-1.5 py-1 text-start text-[12.5px] font-bold text-fg sm:px-3">
                    {s.title}
                  </th>
                </tr>
                {s.rows.map((r) => (
                  <tr key={r.id} className="border-t border-line/70">
                    <td className={cn("px-1.5 py-1 align-middle leading-tight sm:px-3", r.id === "total" && "font-bold")}>{r.label}</td>
                    {yearsCols.map((i) => {
                      const key = `${r.id}-${i}`;
                      if (i < task.given)
                        return (
                          <td key={i} className="px-1 py-1 text-center align-middle">
                            <bdi dir="ltr" className="num text-muted">
                              {r.values[i].toLocaleString("en-US")}
                            </bdi>
                          </td>
                        );
                      const ok = isRight(key, r.values[i]);
                      return (
                        <td key={i} className="px-0.5 py-1 align-middle sm:px-1">
                          <div className="relative">
                            <input
                              value={cells[key] ?? ""}
                              onChange={(e) => {
                                setCells((c) => ({ ...c, [key]: e.target.value }));
                                setChecked(false);
                              }}
                              inputMode="numeric"
                              dir="ltr"
                              aria-label={`${r.label}, שנה ${i + 1}`}
                              aria-invalid={checked && !ok}
                              className={cn("num h-10 w-full min-w-0 rounded-md border bg-surface px-1 text-center text-[13px] text-fg", checked ? (ok ? "border-success bg-success/10" : "border-danger bg-danger/5") : "border-line-strong")}
                            />
                            {checked && (ok ? <CircleCheck aria-hidden className="absolute -end-0.5 -top-1 h-3.5 w-3.5 rounded-full bg-surface text-success" /> : <CircleX aria-hidden className="absolute -end-0.5 -top-1 h-3.5 w-3.5 rounded-full bg-surface text-danger" />)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-muted">סטייה של עד 2 ש״ח נחשבת נכונה. תא ריק נספר כאפס.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setChecked(true)} className="min-h-11 rounded-lg bg-accent px-4 text-[14.5px] font-semibold text-accent-fg">
          בדיקת כל התאים
        </button>
        <button type="button" onClick={() => setShown((v) => !v)} className="min-h-11 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent">
          {shown ? "הסתרת הפתרון" : "הצגת הפתרון המלא"}
        </button>
        {onNext && (
          <button type="button" onClick={onNext} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline">
            <RotateCcw className="h-4 w-4" aria-hidden /> תרגיל חדש
          </button>
        )}
      </div>
      {checked && (
        <p aria-live="polite" className={cn("text-[15px] font-semibold", rightCount === asked.length ? "text-success" : "text-danger")}>
          {rightCount === asked.length ? "כל התאים נכונים." : `${rightCount} מתוך ${asked.length} תאים נכונים. נסו שוב, או פתחו את הפתרון המלא.`}
        </p>
      )}
      {shown && (
        <div className="rounded-xl border border-line bg-surface-2/40 p-3.5 text-[14.5px]">
          <p className="font-bold text-fg">
            עלות הנכס ביום הראשון: <bdi dir="ltr" className="num">{task.cost.toLocaleString("en-US")}</bdi>
          </p>
          <LiabilityCycle rows={task.rows.slice(0, task.years)} />
          <AssetCycle rows={task.rows.slice(0, task.years)} cost={task.cost} />
          <StatementTables sections={task.sections} />
          <ul className="list-disc space-y-1 ps-5">
            {task.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-2">
            <strong>מלכודת נפוצה:</strong> {task.trap}
          </p>
        </div>
      )}
    </div>
  );
}

/** Endless statements: a new lease each press, to fill in cell by cell. */
export function StatementDrill() {
  const [seed, setSeed] = useState(1);
  const task = statementDrill(seed);
  return (
    <section aria-label="מחולל דוחות למילוי" className="card space-y-3 p-4 sm:p-5">
      <p className="text-[16px] leading-relaxed font-semibold text-fg">{task.prompt}</p>
      <StatementFill key={seed} task={task} onNext={() => setSeed((s) => s + 1)} />
    </section>
  );
}

/** A yes-or-no switch with its label. */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[14.5px] text-fg">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

/** A number of years, on a slider, with its value beside it. */
function Years({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-[14.5px] text-fg">
      <span className="flex items-center justify-between gap-2">
        {label}
        <strong className="num text-accent">{value}</strong>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1 h-8 w-full accent-[var(--accent)]" />
    </label>
  );
}

/**
 * The lease term, built: a contract's length, a break and an extension, each
 * either reasonably certain or not. A bar shows the years that count.
 */
export function TermBuilder() {
  const [contract, setContract] = useState(8);
  const [hasBreak, setHasBreak] = useState(true);
  const [breakAt, setBreakAt] = useState(5);
  const [stays, setStays] = useState(false);
  const [extend, setExtend] = useState(3);
  const [extending, setExtending] = useState(false);
  const at = Math.min(breakAt, contract - 1);
  const { term } = leaseTerm({ contractYears: contract, cancelAfter: hasBreak ? at : undefined, certainNotToCancel: stays, extendYears: extend, certainToExtend: extending });
  const firm = hasBreak ? at : contract;
  const total = contract + extend;
  const bars = [
    { key: "firm", years: firm, counted: true, label: "אי אפשר לבטל" },
    { key: "after", years: contract - firm, counted: term > firm, label: "אחרי הביטול" },
    { key: "ext", years: extend, counted: term > contract, label: "הארכה" },
  ].filter((b) => b.years > 0);
  return (
    <section aria-label="בונים תקופת חכירה" className="card space-y-4 p-4 sm:p-5">
      <p aria-live="polite" className="text-[17px] font-bold text-fg">
        תקופת החכירה: <span className="num text-accent">{term}</span> שנים
      </p>
      <div className="flex h-11 gap-0.5 overflow-hidden rounded-lg" role="img" aria-label={`מתוך ${total} שנים אפשריות, ${term} שנים נספרות`}>
        {bars.map((b) => (
          <div key={b.key} style={{ flexGrow: b.years }} className={cn("flex min-w-0 basis-0 items-center justify-center px-1 text-center text-[12px] leading-tight font-semibold", b.counted ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}>
            <span className="truncate">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Years label="שנות החוזה" value={contract} min={2} max={12} onChange={setContract} />
          <Toggle label="לחוכר יש אופציה לבטל" on={hasBreak} onChange={setHasBreak} />
          {hasBreak && (
            <>
              <Years label="אפשר לבטל אחרי שנה" value={at} min={1} max={contract - 1} onChange={setBreakAt} />
              <Toggle label="ודאי באופן סביר שלא יבטל" on={stays} onChange={setStays} />
            </>
          )}
        </div>
        <div className="space-y-2">
          <Years label="שנות אופציית ההארכה" value={extend} min={1} max={6} onChange={setExtend} />
          <Toggle label="ודאי באופן סביר שיאריך" on={extending} onChange={setExtending} />
        </div>
      </div>
    </section>
  );
}

/** A flowchart, walked one question at a time: the learner answers, sees the road they took, and ends on a verdict with its reason. */
export function DecisionWalk({ nodes, start, label, again }: { nodes: Record<string, TestNode | TestEnd>; start: string; label: string; again: string }) {
  const [path, setPath] = useState<{ at: string; answer: string }[]>([]);
  const [at, setAt] = useState(start);
  const node = nodes[at];
  const restart = () => {
    setPath([]);
    setAt(start);
  };
  return (
    <section aria-label={label} className="card space-y-3 p-4 sm:p-5">
      {path.length > 0 && (
        <ol className="space-y-1.5">
          {path.map((s, i) => (
            <li key={s.at} className="flex flex-wrap items-baseline gap-x-2 text-[14px] text-muted">
              <span className="num font-bold text-accent">{i + 1}.</span>
              <span>{(nodes[s.at] as TestNode).q}</span>
              <strong className="font-semibold text-fg">{s.answer}</strong>
            </li>
          ))}
        </ol>
      )}
      {isEnd(node) ? (
        <div aria-live="polite" className={cn("rounded-2xl border-2 p-4", node.lease ? "border-success/50 bg-success/10" : "border-danger/40 bg-danger/5")}>
          <p className="flex items-center gap-2 text-[17px] font-bold text-fg">
            {node.lease ? <CircleCheck className="h-5 w-5 shrink-0 text-success" aria-hidden /> : <CircleX className="h-5 w-5 shrink-0 text-danger" aria-hidden />}
            {node.verdict}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-fg/90">{node.why}</p>
        </div>
      ) : (
        <div aria-live="polite">
          <p className="text-[16.5px] font-bold text-fg">
            {node.q} <span className="text-[13px] font-medium text-muted">({node.par})</span>
          </p>
          <p className="mt-1 text-[14.5px] leading-relaxed text-fg/85">{node.help}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {node.answers.map((a) => (
              <button
                key={a.to}
                type="button"
                onClick={() => {
                  setPath((p) => [...p, { at, answer: a.label }]);
                  setAt(a.to);
                }}
                className="min-h-11 rounded-xl border border-line-strong bg-surface px-4 py-2 text-[15px] font-semibold text-fg transition-colors hover:bg-accent-soft"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {path.length > 0 && (
        <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline">
          <RotateCcw className="h-4 w-4" aria-hidden /> {again}
        </button>
      )}
    </section>
  );
}

/** The standard's flowchart for whether a contract is a lease (paragraph B31). */
export function ContractTest() {
  return <DecisionWalk nodes={CONTRACT_TEST} start={CONTRACT_TEST_START} label="בוחן החוזה" again="בודקים חוזה אחר" />;
}

const CHANGE_KINDS = [
  ["index", "מדד"],
  ["guarantee", "ערבות שייר"],
  ["extend", "הארכה"],
  ["shrink", "הקטנה"],
] as const;
type ChangeKind = (typeof CHANGE_KINDS)[number][0];

/** Before and after: a lease's two balances, one change at a time, and the entry it takes. */
export function ChangeLab() {
  const [kind, setKind] = useState<ChangeKind>("index");
  const [payment, setPayment] = useState(50_000);
  const [left, setLeft] = useState(5);
  const [ratePct, setRatePct] = useState(6);
  const [newRatePct, setNewRatePct] = useState(7);
  const [asset, setAsset] = useState(190_000);
  const [index, setIndex] = useState(105);
  const [shortOld, setShortOld] = useState(6_000);
  const [shortNew, setShortNew] = useState(1_000);
  const [extra, setExtra] = useState(3);
  const [keep, setKeep] = useState(50);
  const [newPay, setNewPay] = useState(30_000);
  const i = ratePct / 100;
  const j = newRatePct / 100;
  const whole = Math.round;
  const before = whole(pvEnd(i, left, payment, kind === "guarantee" ? shortOld : 0));
  const lOut = kind === "shrink" ? whole((before * (100 - keep)) / 100) : 0;
  const aOut = kind === "shrink" ? whole((asset * (100 - keep)) / 100) : 0;
  const after = kind === "index" ? whole(pvEnd(i, left, (payment * index) / 100)) : kind === "guarantee" ? whole(pvEnd(i, left, payment, shortNew)) : kind === "extend" ? whole(pvEnd(j, left + extra, payment)) : whole(pvEnd(j, left, newPay));
  const change = after - (before - lOut);
  // The asset stops at zero, and whatever is left of a decrease is a gain (paragraph 39).
  const assetLeft = asset - aOut;
  const toAsset = Math.max(change, -assetLeft);
  const overflow = toAsset - change;
  const assetAfter = assetLeft + toAsset;
  const gainOut = lOut - aOut;
  const keepsRate = kind === "index" || kind === "guarantee";
  return (
    <section aria-label="מעבדה: לפני ואחרי" className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="סוג השינוי">
        {CHANGE_KINDS.map(([k, name]) => (
          <button key={k} type="button" aria-pressed={k === kind} onClick={() => setKind(k)} className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", k === kind ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}>
            {name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Amount label="תשלום לשנה" value={payment} onChange={setPayment} />
        <Amount label="תשלומים שנשארו" value={left} onChange={(v) => setLeft(Math.min(20, Math.max(1, Math.round(v))))} step={1} />
        <Amount label="ריבית ישנה (%)" value={ratePct} onChange={(v) => setRatePct(Math.max(0.1, v))} step={0.5} />
        <Amount label="יתרת הנכס" value={asset} onChange={setAsset} />
        {kind === "index" && <Amount label="מדד חדש (בסיס 100)" value={index} onChange={(v) => setIndex(Math.max(1, v))} step={1} />}
        {kind === "guarantee" && <Amount label="צפוי לתשלום, לפני" value={shortOld} onChange={setShortOld} />}
        {kind === "guarantee" && <Amount label="צפוי לתשלום, עכשיו" value={shortNew} onChange={setShortNew} />}
        {(kind === "extend" || kind === "shrink") && <Amount label="ריבית של היום (%)" value={newRatePct} onChange={(v) => setNewRatePct(Math.max(0.1, v))} step={0.5} />}
        {kind === "extend" && <Amount label="שנים נוספות" value={extra} onChange={(v) => setExtra(Math.min(20, Math.max(1, Math.round(v))))} step={1} />}
        {kind === "shrink" && <Amount label="שטח שנשאר (%)" value={keep} onChange={(v) => setKeep(Math.min(99, Math.max(1, Math.round(v))))} step={5} />}
        {kind === "shrink" && <Amount label="תשלום חדש" value={newPay} onChange={setNewPay} />}
      </div>
      <p aria-live="polite" className="text-[14.5px] text-fg">
        {keepsRate ? "הריבית נשארת " : "הריבית מתעדכנת ל-"}
        <bdi dir="ltr" className="num">{keepsRate ? ratePct : newRatePct}%</bdi>.
      </p>
      <Tbl
        dense
        head={["", "התחייבות", "נכס"]}
        rows={[["לפני", before, asset], ...(kind === "shrink" ? ([["גריעה", -lOut, -aOut]] as [string, number, number][]) : []), ["מדידה מחדש", change, toAsset]]}
        foot={["אחרי", after, assetAfter]}
      />
      {kind === "shrink" && (
        <JournalEntry
          title="שלב 1: גריעה"
          lines={[
            { account: "התחייבות חכירה", dr: lOut },
            ...(gainOut < 0 ? [{ account: "הפסד מתיקון חכירה", dr: -gainOut }] : []),
            { account: "נכס זכות שימוש", cr: aOut },
            ...(gainOut > 0 ? [{ account: "רווח מתיקון חכירה", cr: gainOut }] : []),
          ]}
        />
      )}
      <JournalEntry
        title="מדידה מחדש"
        lines={
          change >= 0
            ? [
                { account: "נכס זכות שימוש", dr: change },
                { account: "התחייבות חכירה", cr: change },
              ]
            : [
                { account: "התחייבות חכירה", dr: -change },
                ...(toAsset ? [{ account: "נכס זכות שימוש", cr: -toAsset }] : []),
                ...(overflow ? [{ account: keepsRate ? "רווח מעדכון התחייבות" : "רווח מתיקון חכירה", cr: overflow }] : []),
              ]
        }
      />
      <p className="text-[14.5px] text-fg">
        פחת מעכשיו: <strong className="num">{whole(assetAfter / (kind === "extend" ? left + extra : left)).toLocaleString("en-US")}</strong> לשנה, אם הנכס חוזר למחכיר בסוף.
      </p>
    </section>
  );
}
