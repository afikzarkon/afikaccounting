"use client";

import { Check, Eye, RotateCcw, X } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { NumberInput, parseNumber } from "@/components/study/inputs";
import {
  type Assignment,
  type Built,
  build,
  CATEGORY_LABEL,
  type Dest,
  destOptions,
  PL_LINES,
  type Question,
  type Section,
  splitLoan,
} from "@/lib/learn/statements";
import { cn } from "@/lib/utils";
import { updateProgress, useProgress } from "./store";
import { fmt, Money, Scroller } from "./ui";

const btn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-line transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-[var(--ring)] disabled:opacity-40";
const SECTION_LABEL: Record<Section, string> = { ca: "נכסים שוטפים", nca: "נכסים בלתי שוטפים", cl: "התחייבויות שוטפות", ncl: "התחייבויות בלתי שוטפות", eq: "הון" };

// ---------------------------------------------------------------------------
// The two statements, in the course's layout.

function Row({ label, v, strong, muted, note }: { label: ReactNode; v?: number; strong?: boolean; muted?: boolean; note?: string }) {
  return (
    <tr className={cn("border-t border-line/60", strong && "border-line-strong bg-surface-2/50 font-semibold text-fg", muted && "text-muted")}>
      <th scope="row" className={cn("px-3 py-1.5 text-start font-normal", strong && "font-semibold")}>
        {label}
        {note && <span className="block text-[11.5px] font-normal text-muted">{note}</span>}
      </th>
      <td className="px-3 py-1.5 text-end align-top">{v !== undefined && <Money v={v} plain />}</td>
    </tr>
  );
}

/** The statement of financial position: assets, then liabilities and equity; retained earnings close it. */
export function SofpView({ q, s, notes }: { q: Question; s: Built; notes?: Record<string, string> }) {
  const side = (sections: Section[]) =>
    sections.map((sec) => (
      <tbody key={sec}>
        <tr>
          <th scope="rowgroup" colSpan={2} className="px-3 pt-3 pb-1 text-start text-[13px] font-semibold text-accent">
            {SECTION_LABEL[sec]}
          </th>
        </tr>
        {q.sofp
          .filter((l) => l.section === sec)
          .map((l) => (
            <Row key={l.id} label={l.label} v={s.sofp[l.id]} note={notes?.[l.id]} />
          ))}
        {sec === "eq" && <Row label="עודפים" v={s.retained} note="ההפרש — עודפי פתיחה ועוד הרווח הנקי" />}
        <Row label={`סה״כ ${SECTION_LABEL[sec]}`} v={s.totals[sec]} strong />
      </tbody>
    ));
  return (
    <section aria-label={`דוח על המצב הכספי ליום ${q.date}`} className="overflow-hidden rounded-xl border border-line bg-surface">
      <h3 className="border-b border-line bg-accent-soft/50 px-4 py-2.5 text-[15px] font-semibold text-fg">
        {q.company} · דוח על המצב הכספי ליום {q.date}
      </h3>
      <div className="grid md:grid-cols-2 md:divide-x md:divide-x-reverse md:divide-line">
        <table className="w-full text-sm">
          {side(["ca", "nca"])}
          <tfoot>
            <Row label="סה״כ נכסים" v={s.totalAssets} strong />
          </tfoot>
        </table>
        <table className="w-full text-sm">
          {side(["cl", "ncl", "eq"])}
          <tfoot>
            <Row label="סה״כ התחייבויות והון" v={s.totalLiabilitiesEquity} strong />
          </tfoot>
        </table>
      </div>
    </section>
  );
}

const CAT_BAR: Record<string, string> = { operating: "bg-accent", investing: "bg-success", financing: "bg-amber-500" };

/** Profit or loss and other comprehensive income, with the two required subtotals and each line's category. */
export function PlView({ q, s }: { q: Question; s: Built }) {
  const line = (id: (typeof PL_LINES)[number]["id"]) => {
    const l = PL_LINES.find((x) => x.id === id)!;
    const v = s.pl[id];
    if (!v && id !== "cogs" && id !== "sales") return null;
    return (
      <tr key={id} className="border-t border-line/60">
        <th scope="row" className="px-3 py-1.5 text-start font-normal">
          <span className="flex items-center gap-2">
            <span className={cn("h-4 w-1.5 shrink-0 rounded-full", CAT_BAR[l.category])} aria-hidden />
            {l.label}
            <span className="text-[11px] text-muted">({CATEGORY_LABEL[l.category]})</span>
          </span>
        </th>
        <td className="px-3 py-1.5 text-end">
          <Money v={l.sign * v} plain />
        </td>
      </tr>
    );
  };
  return (
    <section aria-label={`דוח על הרווח או הפסד ורווח כולל אחר לשנת ${q.year}`} className="overflow-hidden rounded-xl border border-line bg-surface">
      <h3 className="border-b border-line bg-accent-soft/50 px-4 py-2.5 text-[15px] font-semibold text-fg">
        {q.company} · דוח על הרווח או הפסד ורווח כולל אחר לשנה שהסתיימה ב-{q.date}
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {line("sales")}
          {line("cogs")}
          <Row label="רווח גולמי" v={s.grossProfit} strong />
          {line("selling")}
          {line("rnd")}
          {line("admin")}
          {line("otherIncome")}
          {line("otherExpense")}
          <Row label="רווח תפעולי — סיכום ביניים חובה" v={s.operatingProfit} strong />
          {line("investment") ?? <Row label="הכנסות מקטגוריית השקעה — אין" v={0} muted />}
          <Row label="רווח לפני מימון ומסים על הכנסה — סיכום ביניים חובה" v={s.beforeFinancing} strong />
          {line("finance")}
          <Row label="רווח לפני מסים על הכנסה" v={s.beforeTax} strong />
          <Row label="רווח נקי" v={s.netProfit} strong note="בקורס: רווח נקי = רווח לפני מסים (מסים לא נלמדו)" />
          <tr>
            <th scope="rowgroup" colSpan={2} className="px-3 pt-3 pb-1 text-start text-[12.5px] font-semibold text-accent">
              רווח כולל אחר — פריטים שלא יסווגו מחדש לאחר מכן לרווח או הפסד
            </th>
          </tr>
          <Row label="הערכה מחדש של רכוש קבוע" v={s.oci} />
          <Row label="סך רווח כולל אחר" v={s.oci} strong />
          <Row label="סך הכול רווח כולל לתקופה" v={s.totalComprehensive} strong />
        </tbody>
      </table>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The flagship: assign every balance, watch both statements build.

/** Where an account went, in words, for the feedback. */
function destLabel(q: Question, d: Dest | undefined) {
  return destOptions(q).find((o) => o.value === d)?.label ?? "—";
}

export function StatementsBuilder({ q }: { q: Question }) {
  const progress = useProgress();
  const key = (name: string) => `fs:builder:${q.id}:${name}`;
  const assign: Assignment = Object.fromEntries(q.accounts.map((a) => [a.name, progress.answers[key(a.name)]?.value]));
  const s = build(q, assign);
  const placed = q.accounts.filter((a) => assign[a.name]).length;
  const wrong = q.accounts.filter((a) => assign[a.name] && assign[a.name] !== a.dest).length;
  const options = destOptions(q);
  const groups = [...new Set(options.map((o) => o.group))];
  const set = (name: string, d: string) =>
    updateProgress((p) => {
      const answers = { ...p.answers };
      if (d) answers[key(name)] = { value: d, correct: d === q.accounts.find((a) => a.name === name)!.dest };
      else delete answers[key(name)];
      return { ...p, answers };
    });
  const fill = (to: (a: Question["accounts"][number]) => string | undefined) =>
    updateProgress((p) => {
      const answers = { ...p.answers };
      for (const a of q.accounts) {
        const d = to(a);
        if (d) answers[key(a.name)] = { value: d, correct: d === a.dest };
        else delete answers[key(a.name)];
      }
      return { ...p, answers };
    });
  const done = placed === q.accounts.length;
  const status = !done
    ? `שובצו ${placed} מתוך ${q.accounts.length}`
    : Math.abs(s.gap) < 0.005 && wrong === 0
      ? "✓ מאוזן — וכל היתרות במקום"
      : Math.abs(s.gap) < 0.005
        ? `✓ מאוזן — אבל ${wrong} יתרות בשורה לא נכונה`
        : `✗ לא מאוזן: חסרים ${fmt(Math.abs(s.gap))} ₪ בצד ${s.gap > 0 ? "ההתחייבויות וההון" : "הנכסים"}`;

  return (
    <div className="space-y-4">
      <div className="no-print sticky top-28 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:top-20">
        <p aria-live="polite" className={cn("me-auto text-sm font-semibold", done ? (Math.abs(s.gap) < 0.005 && !wrong ? "text-success" : "text-danger") : "text-fg")}>
          {status}
          {wrong > 0 && !done && <span className="ms-2 text-danger">· {wrong} לא במקום</span>}
        </p>
        <button type="button" className={btn} onClick={() => fill(() => undefined)}>
          <RotateCcw className="h-4 w-4" aria-hidden /> איפוס
        </button>
        <button type="button" className={btn} onClick={() => fill((a) => a.dest)}>
          <Eye className="h-4 w-4" aria-hidden /> הראו פתרון
        </button>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section aria-label={`מאזן הבוחן של ${q.company}`} className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
          <h3 className="border-b border-line bg-surface-2/60 px-4 py-2.5 text-[15px] font-semibold text-fg">
            מאזן בוחן ליום {q.date} — לאחר התאמות
          </h3>
          <ol className="divide-y divide-line">
            {q.accounts.map((a, i) => {
              const d = assign[a.name];
              const ok = d === a.dest;
              return (
                <li key={a.name} className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num w-6 shrink-0 text-xs text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-[14px] text-fg">{a.name}</span>
                    <span className={cn("num text-[13px] font-semibold", a.side === "dr" ? "text-debit" : "text-credit")}>
                      {a.side === "dr" ? "ח" : "ז"} <Money v={a.amount} plain />
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 ps-8">
                    <label className="sr-only" htmlFor={`fs-${q.id}-${i}`}>
                      לאן הולכת היתרה {a.name}
                    </label>
                    <select
                      id={`fs-${q.id}-${i}`}
                      value={d ?? ""}
                      onChange={(e) => set(a.name, e.target.value)}
                      className={cn("h-9 min-w-0 flex-1 rounded-lg border bg-surface px-2 text-[13px] text-fg", !d ? "border-line-strong" : ok ? "border-success/60" : "border-danger/60")}
                    >
                      <option value="">בחרו לאן…</option>
                      {groups.map((g) => (
                        <optgroup key={g} label={g}>
                          {options
                            .filter((o) => o.group === g)
                            .map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    {d && (ok ? <Check className="h-4 w-4 shrink-0 text-success" aria-label="נכון" /> : <X className="h-4 w-4 shrink-0 text-danger" aria-label="לא נכון" />)}
                  </div>
                  {d && (
                    <p className={cn("mt-1 ps-8 text-[12.5px]", ok ? "text-muted" : "text-danger")} aria-live="polite">
                      {ok ? a.why : `לא ל"${destLabel(q, d)}". רמז: ${a.why}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
        <div className="min-w-0 space-y-4">
          <SofpView q={q} s={s} />
          <PlView q={q} s={s} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 5: split a loan.

export function LoanSplitter() {
  const [amount, setAmount] = useState("500000");
  const [payments, setPayments] = useState("4");
  const [within, setWithin] = useState(true);
  const a = parseNumber(amount);
  const n = Math.round(parseNumber(payments));
  const ok = a > 0 && n >= 1 && n <= 50;
  const r = ok ? splitLoan(a, n, within) : null;
  return (
    <div className="card space-y-3 p-5">
      <p className="text-[16px] font-semibold text-fg">מחלקים הלוואה: מה שוטף ומה לזמן ארוך?</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberInput label="סכום ההלוואה" suffix="₪" value={amount} onChange={setAmount} />
        <NumberInput label="מספר תשלומים שווים" value={payments} onChange={setPayments} error={ok ? undefined : "מספר תשלומים בין 1 ל-50"} />
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">התשלום הראשון</p>
          <div className="flex gap-1.5" role="group" aria-label="מתי התשלום הראשון">
            {(
              [
                [true, "בתוך 12 חודשים"],
                [false, "אחרי 12 חודשים"],
              ] as const
            ).map(([v, label]) => (
              <button key={label} type="button" aria-pressed={within === v} onClick={() => setWithin(v)} className={cn(btn, "flex-1 text-xs", within === v && "bg-accent text-accent-fg ring-accent")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {r && (
        <div aria-live="polite" className="grid gap-2 sm:grid-cols-2">
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-fg">
            <span className="block text-xs text-muted">חלויות שוטפות — התחייבות שוטפת</span>
            <Money v={r.current} className="text-lg font-semibold" />
          </p>
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg">
            <span className="block text-xs text-muted">הלוואה לזמן ארוך — התחייבות בלתי שוטפת</span>
            <Money v={r.long} className="text-lg font-semibold" />
          </p>
          <p className="text-[13px] text-muted sm:col-span-2">
            כל תשלום: <Money v={r.each} />.{" "}
            {within ? "התשלום הראשון נפרע בתוך 12 חודשים מתאריך המאזן — הוא החלות השוטפת." : "שום תשלום לא נפרע בתוך 12 חודשים — כל ההלוואה לזמן ארוך."}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 7: split each expense between administration and selling.

const PCTS = [0, 30, 40, 50, 60, 70, 100];

export function AllocationDrill({ q }: { q: Question }) {
  const progress = useProgress();
  const id = useId();
  const rows = build(q).alloc;
  const key = (name: string) => `fs:alloc:${q.id}:${name}`;
  const pick = (name: string) => progress.answers[key(name)]?.value;
  const totals = rows.reduce(
    (t, r) => {
      const p = pick(r.name);
      if (p === undefined) return t;
      const admin = (r.amount * Number(p)) / 100;
      return { admin: t.admin + admin, selling: t.selling + r.amount - admin };
    },
    { admin: 0, selling: 0 },
  );
  const right = rows.filter((r) => progress.answers[key(r.name)]?.correct).length;
  const fill = (solve: boolean) =>
    updateProgress((p) => {
      const answers = { ...p.answers };
      for (const r of rows) {
        if (solve) answers[key(r.name)] = { value: String(Math.round(r.adminPct * 100)), correct: true };
        else delete answers[key(r.name)];
      }
      return { ...p, answers };
    });
  return (
    <div className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="me-auto text-[16px] font-semibold text-fg">טבלת החלוקה: כמה מכל הוצאה להנהלה?</p>
        <button type="button" className={cn(btn, "text-xs")} onClick={() => fill(false)}>
          <RotateCcw className="h-4 w-4" aria-hidden /> איפוס
        </button>
        <button type="button" className={cn(btn, "text-xs")} onClick={() => fill(true)}>
          <Eye className="h-4 w-4" aria-hidden /> הראו פתרון
        </button>
      </div>
      <p className="text-[13.5px] text-muted">לכל הוצאה בחרו את אחוז ההנהלה וכלליות — השאר הולך למכירה ושיווק. הנתונים הנוספים של השאלה הם המפתח.</p>
      <Scroller>
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-3 py-2 text-start font-medium">הוצאה</th>
              <th className="px-3 py-2 text-end font-medium">סכום</th>
              <th className="px-3 py-2 text-start font-medium">% הנהלה</th>
              <th className="px-3 py-2 text-end font-medium">הנהלה וכלליות</th>
              <th className="px-3 py-2 text-end font-medium">מכירה ושיווק</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const p = pick(r.name);
              const ok = progress.answers[key(r.name)]?.correct;
              const admin = p === undefined ? null : (r.amount * Number(p)) / 100;
              return (
                <tr key={r.name} className="border-t border-line/60">
                  <th scope="row" className="px-3 py-1.5 text-start font-normal text-fg">
                    {r.name}
                  </th>
                  <td className="px-3 py-1.5 text-end">
                    <Money v={r.amount} plain />
                  </td>
                  <td className="px-3 py-1.5">
                    <label className="sr-only" htmlFor={`${id}-${i}`}>
                      אחוז הנהלה עבור {r.name}
                    </label>
                    <span className="flex items-center gap-1.5">
                      <select
                        id={`${id}-${i}`}
                        value={p ?? ""}
                        onChange={(e) =>
                          updateProgress((pr) => ({ ...pr, answers: { ...pr.answers, [key(r.name)]: { value: e.target.value, correct: Number(e.target.value) === Math.round(r.adminPct * 100) } } }))
                        }
                        className={cn("h-9 rounded-lg border bg-surface px-2 text-[13px]", p === undefined ? "border-line-strong" : ok ? "border-success/60" : "border-danger/60")}
                      >
                        <option value="">—</option>
                        {PCTS.map((x) => (
                          <option key={x} value={x}>
                            {x}%
                          </option>
                        ))}
                      </select>
                      {p !== undefined && (ok ? <Check className="h-4 w-4 text-success" aria-label="נכון" /> : <X className="h-4 w-4 text-danger" aria-label="לא נכון" />)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-end">{admin !== null && <Money v={admin} plain />}</td>
                  <td className="px-3 py-1.5 text-end">{admin !== null && <Money v={r.amount - admin} plain />}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line-strong font-semibold">
              <th scope="row" className="px-3 py-2 text-start">
                סה״כ
              </th>
              <td className="px-3 py-2 text-end">
                <Money v={rows.reduce((t, r) => t + r.amount, 0)} plain />
              </td>
              <td className="px-3 py-2 text-xs text-muted" aria-live="polite">
                נכונות: <span className="num">{right}</span>/<span className="num">{rows.length}</span>
              </td>
              <td className="px-3 py-2 text-end">
                <Money v={totals.admin} plain />
              </td>
              <td className="px-3 py-2 text-end">
                <Money v={totals.selling} plain />
              </td>
            </tr>
          </tfoot>
        </table>
      </Scroller>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 3: is it an asset? Three questions.

export type AssetCase = { item: string; answers: [boolean, boolean, boolean]; why: string };
const ASSET_QUESTIONS = ["משאב כלכלי בהווה?", "בשליטת הישות?", "כתוצאה מאירוע בעבר?"];

export function AssetChecker({ cases }: { cases: AssetCase[] }) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  return (
    <div className="card space-y-3 p-5">
      <p className="text-[16px] font-semibold text-fg">בודק נכס: שלוש שאלות, כן או לא</p>
      <ul className="divide-y divide-line">
        {cases.map((c, ci) => {
          const all = c.answers.every(Boolean);
          const answered = c.answers.every((_, qi) => picked[`${ci}:${qi}`] !== undefined);
          const right = c.answers.every((a, qi) => picked[`${ci}:${qi}`] === a);
          return (
            <li key={c.item} className="py-3">
              <p className="text-[14.5px] font-medium text-fg">{c.item}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {ASSET_QUESTIONS.map((question, qi) => (
                  <div key={question} role="group" aria-label={`${c.item}: ${question}`} className="rounded-lg bg-surface-2/50 px-2.5 py-2">
                    <p className="text-[12.5px] text-muted">{question}</p>
                    <div className="mt-1 flex gap-1.5">
                      {[true, false].map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          aria-pressed={picked[`${ci}:${qi}`] === v}
                          onClick={() => setPicked((p) => ({ ...p, [`${ci}:${qi}`]: v }))}
                          className={cn(btn, "min-h-8 flex-1 py-1 text-xs", picked[`${ci}:${qi}`] === v && (v === c.answers[qi] ? "bg-success/15 ring-success/50" : "bg-danger/10 ring-danger/50"))}
                        >
                          {v ? "כן" : "לא"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {answered && (
                <p aria-live="polite" className={cn("mt-2 text-[13.5px]", right ? "text-success" : "text-danger")}>
                  {right ? "✓ " : "✗ לא בדיוק. "}
                  {all ? "שלוש פעמים כן — זה נכס." : "לפחות תשובה אחת היא לא — זה לא נכס."} <span className="text-fg/85">{c.why}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 9: the solution, one step at a time, ticking off the balances it handles.

export type RevealStep = { title: string; body: ReactNode; handles: string[] };

export function StepReveal({ q, steps }: { q: Question; steps: RevealStep[] }) {
  const [shown, setShown] = useState(0);
  const handled = new Set(steps.slice(0, shown).flatMap((s) => s.handles));
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section aria-label="מאזן הבוחן — מה כבר טופל" className="min-w-0 self-start overflow-hidden rounded-xl border border-line bg-surface xl:sticky xl:top-24">
        <p className="border-b border-line bg-surface-2/60 px-4 py-2 text-sm font-semibold text-fg" aria-live="polite">
          טופלו <span className="num">{handled.size}</span> מתוך <span className="num">{q.accounts.length}</span> יתרות
        </p>
        <ul className="max-h-[28rem] divide-y divide-line/60 overflow-y-auto text-[13px]">
          {q.accounts.map((a) => (
            <li key={a.name} className={cn("flex items-center gap-2 px-3 py-1", handled.has(a.name) && "bg-success/[0.06]")}>
              <span className="w-4 shrink-0 text-success" aria-label={handled.has(a.name) ? "טופל" : undefined}>
                {handled.has(a.name) ? "✓" : ""}
              </span>
              <span className="min-w-0 flex-1 text-fg">{a.name}</span>
              <span className={cn("num", a.side === "dr" ? "text-debit" : "text-credit")}>
                {a.side === "dr" ? "ח" : "ז"} <Money v={a.amount} plain />
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ol className="min-w-0 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card overflow-hidden">
            <p className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-2.5 font-semibold text-fg">
              <span className="num grid h-7 w-7 place-items-center rounded-full bg-accent text-sm text-accent-fg">{i + 1}</span>
              {s.title}
            </p>
            <div className="px-4 py-3">
              {i < shown ? (
                <div className="space-y-3 text-[14.5px] leading-relaxed text-fg/90">{s.body}</div>
              ) : i === shown ? (
                <button type="button" className={cn(btn, "bg-accent text-accent-fg ring-accent")} onClick={() => setShown(i + 1)}>
                  נסו לבד ← הראו את הצעד
                </button>
              ) : (
                <p className="text-sm text-muted">ייפתח אחרי הצעד הקודם.</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {shown > 0 && (
        <button type="button" className={cn(btn, "xl:col-start-2")} onClick={() => setShown(0)}>
          <RotateCcw className="h-4 w-4" aria-hidden /> להתחיל מחדש
        </button>
      )}
    </div>
  );
}

