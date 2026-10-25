"use client";

import { ChevronDown, ChevronRight, Copy, Printer } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Stat } from "@/components/study/ui";
import { compareMethods, entriesFor, historyFire, type Method, METHOD_LABEL, METHODS, type PeriodResult, priceTrend, type System, valuateChain } from "@/lib/learn/inventory";
import { explainHistoryFire, explainPeriod, explainSolve, m, pc, stepsToText, type TraceStep, u } from "@/lib/learn/inventory-explain";
import { solveUnknowns } from "@/lib/learn/inventory-solver";
import { cn } from "@/lib/utils";
import { Check, NumField, primaryBtn, smallBtn } from "./inventory-calc-fields";
import { type Built, type CalcState, claimTerms, optNum } from "./inventory-calc-state";
import type { Update } from "./inventory-calculator";
import { FlowStrip, TraceStepView } from "./inventory-trace";
import { EntryView, Money, Scroller } from "./ui";

export type Solution = {
  error?: string;
  /** One per year; a year left out depends on something still missing. */
  results?: (PeriodResult | undefined)[];
  solveSteps: TraceStep[];
  periods?: Built["periods"];
  solved?: ReturnType<typeof solveUnknowns>;
};

/**
 * The years an error or an unsolved unknown reaches: its own year, and every
 * later year that opens from that one's closing. The other years still have an answer.
 */
function blockedYears(st: CalcState, built: Built): boolean[] {
  const keys = Object.keys(built.errors);
  const all = keys.some((k) => k.startsWith("tpl."));
  const knownYears = new Set(built.knowns.map((k) => k.year));
  const out = st.years.map(
    (_, t) => all || keys.some((k) => k.startsWith(`y${t}.`)) || built.unknowns.some((x) => x.ref.year === t) || (!built.unknowns.length && knownYears.has(t)),
  );
  for (let t = 1; t < out.length; t++) if (out[t - 1] && st.years[t].fromPrev) out[t] = true;
  return out;
}

export function solveAll(st: CalcState, built: Built, method: Method): Solution {
  const opts = { system: st.system, rounding: built.rounding, carryWriteDown: st.carryWriteDown, salesFirstOnTie: st.salesFirst };
  let periods = built.periods;
  let solveSteps: TraceStep[] = [];
  let solved: Solution["solved"];
  let error: string | undefined = Object.keys(built.errors).length ? "יש שדות לתיקון (מסומנים באדום)." : undefined;
  if (!error && (built.unknowns.length || built.knowns.length)) {
    solved = solveUnknowns(periods, method, built.unknowns, built.knowns, opts);
    solveSteps = explainSolve(solved);
    if (solved.ok) periods = solved.periods;
    else error = solved.error;
  }
  if (!error) return { results: valuateChain(periods, method, opts), periods, solveSteps, solved };
  // Something is missing: still answer every year that doesn't depend on it.
  const blocked = blockedYears(st, built);
  if (blocked.every(Boolean)) return { error, solveSteps, solved };
  const all = valuateChain(built.periods, method, opts);
  return { error, results: all.map((r, t) => (blocked[t] ? undefined : r)), periods: built.periods, solveSteps, solved };
}

/** What still stands between the form and an answer, in one line. */
export function status(built: Built, solution: Solution): { ok: boolean; text: string } {
  const nu = built.unknowns.length;
  const nk = built.knowns.length;
  if (nu > nk) return { ok: false, text: `סימנתם ${nu} נעלמים (?) — חסר נתון שמגלה ${nu - nk === 1 ? "אחד מהם" : `${nu - nk} מהם`} (שלב 2).` };
  if (nu > 3) return { ok: false, text: "אפשר עד שלושה נעלמים." };
  if (solution.error) return { ok: false, text: solution.error };
  if (!solution.results?.some(Boolean)) return { ok: false, text: "הזינו לפחות רכישה אחת." };
  return { ok: true, text: nu ? `${nu} נעלמים נפתרו ✓` : "הנתונים תקינים ✓" };
}

export type Claim = { error: string } | { r: ReturnType<typeof historyFire>; steps: TraceStep[] } | null;

/** The fire claim: the history the question typed, up to the fire, by the policy's formula. */
export function fireClaim(st: CalcState, built: Built, solution: Solution): Claim {
  if (!st.fireEvent) return null;
  // The claim needs every year, so whatever blocks one year blocks it — say what that is.
  if (solution.error || !solution.periods) return { error: `השיפוי מחושב מכל השנים, ועוד חסר משהו: ${status(built, solution).text}` };
  const f = st.fire;
  const r = historyFire({ periods: solution.periods, method: f.policy, savedUnits: optNum(f.savedUnits) ?? 0, terms: claimTerms(f), rounding: built.rounding, fireDate: f.fireDate || undefined });
  return { r, steps: explainHistoryFire(f.policy, r).map((s) => ({ ...s, title: `שריפה — ${s.title}` })) };
}

const qty = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 2 });

/** While typing: each year's three main numbers, what is still missing, and the way on. */
export function LiveBar({ st, built, solution, step, go }: { st: CalcState; built: Built; solution: Solution; step: number; go: (n: number) => void }) {
  const s = status(built, solution);
  return (
    <div className="no-print sticky bottom-0 z-10 -mx-4 mt-5 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 space-y-0.5" aria-live="polite">
          <p className={cn("text-xs font-medium", s.ok ? "text-success" : "text-danger")}>{s.text}</p>
          {st.years.map((y, t) => {
            const r = solution.results?.[t];
            return (
              r && (
                <p key={y.id} className="num truncate text-xs text-muted">
                  {st.years.length > 1 && <span className="font-semibold text-fg">{y.label}: </span>}
                  עלות המכר <Money v={r.cogs} plain /> · רווח גולמי <Money v={r.grossProfit} plain /> · מלאי סגירה <Money v={r.closingCarrying} plain />
                </p>
              )
            );
          })}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" className={smallBtn} onClick={() => go(step - 1)}>
              <ChevronRight className="h-4 w-4" aria-hidden /> הקודם
            </button>
          )}
          <button type="button" className={primaryBtn} onClick={() => go(step + 1)}>
            {step === 0 ? "הבא: אירועים ונתונים" : "לתוצאות"} <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Step 3: the answers first, every year side by side, the fire claim, and the working on request. */
export function ResultsStep({ st, set, built, solution, method, go }: { st: CalcState; set: Update; built: Built; solution: Solution; method: Method; go: (n: number) => void }) {
  const ay = Math.min(st.activeYear, st.years.length - 1);
  const [sys, setSys] = useState<System | null>(null);
  const [guided, setGuided] = useState(false);
  const [reveal, setReveal] = useState(1);
  const [showSteps, setShowSteps] = useState(false);
  const [copied, setCopied] = useState(false);
  const r = solution.results?.[ay];
  const period = solution.periods?.[ay];
  const claim = useMemo(() => fireClaim(st, built, solution), [st, built, solution]);
  // A year answered while an unknown is still unsolved shows only its own working.
  const steps = useMemo(
    () => [...(solution.error ? [] : solution.solveSteps), ...(r && period ? explainPeriod(period, r) : []), ...(claim && "steps" in claim ? claim.steps : [])],
    [r, period, solution.solveSteps, solution.error, claim],
  );
  const compare = useMemo(
    () => (solution.periods ? compareMethods(solution.periods, { system: st.system, rounding: built.rounding, carryWriteDown: st.carryWriteDown, salesFirstOnTie: st.salesFirst }) : null),
    [solution.periods, st.system, built.rounding, st.carryWriteDown, st.salesFirst],
  );
  const entrySystem: System = sys ?? (method === "moving-avg" ? "perpetual" : method === "wa-periodic" ? "periodic" : st.system);
  const multi = st.years.length > 1;

  const back = (
    <button type="button" className={cn(smallBtn, "no-print")} onClick={() => go(1)}>
      <ChevronRight className="h-4 w-4" aria-hidden /> חזרה לעריכת הנתונים
    </button>
  );
  const yearPicker = multi && (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="השנה שבפתרון">
      <span className="me-1 text-xs text-muted">השנה:</span>
      {st.years.map((yy, i) => (
        <button
          key={yy.id}
          type="button"
          aria-pressed={ay === i}
          onClick={() => set((s) => ({ ...s, activeYear: i }))}
          className={cn(smallBtn, "min-h-8 px-2.5 py-1 text-xs", ay === i && "bg-accent text-accent-fg ring-accent", !solution.results?.[i] && "opacity-60")}
          title={solution.results?.[i] ? undefined : "השנה הזו תלויה בנתון שעוד חסר"}
        >
          {yy.label}
          {!solution.results?.[i] && " ⚠"}
        </button>
      ))}
    </div>
  );

  if (!r || !period) {
    const free = solution.results?.flatMap((x, t) => (x ? [st.years[t].label] : [])) ?? [];
    return (
      <div id="inv-results" className="space-y-3">
        {back}
        {yearPicker}
        <div className="rounded-xl border border-danger/40 bg-danger/[0.06] px-4 py-3 text-sm text-fg" aria-live="polite">
          {free.length ? (
            <>
              <strong>{st.years[ay].label} תלויה בנתון שעוד חסר:</strong> {solution.error} {`הפתרון של ${free.join(", ")} מוכן — בחרו אותה למעלה.`}
            </>
          ) : (
            (solution.error ?? "הזינו לפחות רכישה אחת כדי לראות פתרון.")
          )}
        </div>
        {solution.solveSteps.map((s) => (
          <TraceStepView key={s.id} s={s} />
        ))}
      </div>
    );
  }

  const shownSteps = guided ? steps.slice(0, reveal) : showSteps ? steps : [];
  const trend = priceTrend(period);
  const solved = Object.entries(solution.solved?.ok ? solution.solved.values : {});
  const text = () => `${st.company ? `${st.company} — ` : ""}${r.label}\n\n${stepsToText(steps)}`;

  return (
    <div id="inv-results" className="inv-print space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {back}
        <p className="me-auto text-[16px] font-semibold text-fg">
          הפתרון{st.company ? ` — ${st.company}` : ""} {multi && <span className="text-muted">({r.label})</span>}
        </p>
        <Check label="נסו קודם בעצמכם" checked={guided} onChange={(v) => { setGuided(v); setReveal(1); }} />
      </div>
      {yearPicker}
      {solution.error && <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2 text-sm text-fg">⚠ לא כל השנים חושבו: {solution.error} השנה הזו לא תלויה בזה.</p>}
      {ay > 0 && st.years[ay].fromPrev && solution.results?.[ay - 1] && (
        <FlowStrip
          label="גלגול יתרות"
          boxes={[
            { label: `מלאי סגירה בספרים ${solution.results[ay - 1]!.label}`, value: `${m(solution.results[ay - 1]!.closingCarrying)} ₪` },
            { label: "עובר שנה", value: "" },
            { label: `מלאי פתיחה ${r.label}`, value: `${m(r.openingCost)} ₪`, tone: "accent" },
          ]}
        />
      )}

      {guided ? (
        <Guess r={r} />
      ) : (
        <>
          <CogsStatement r={r} />
          <ClosingWorking r={r} />
          {solved.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {solved.map(([id, v]) => {
                const un = built.unknowns.find((x) => x.id === id);
                return <Stat key={id} label={un?.label ?? id} value={<bdi dir="ltr">{un?.ref.t === "discountPct" ? pc(v) : u(v)}</bdi>} tone="success" />;
              })}
            </div>
          )}
        </>
      )}
      {[...r.errors, ...r.warnings].map((w) => (
        <p key={w} className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2 text-sm text-fg">
          ⚠ {w}
        </p>
      ))}

      {!guided && multi && <YearsTable st={st} solution={solution} active={ay} />}
      {!guided && claim && <FireCard claim={claim} />}

      {!guided && (
        <button type="button" aria-expanded={showSteps} className={cn(showSteps ? smallBtn : primaryBtn, "no-print w-full")} onClick={() => setShowSteps((x) => !x)}>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showSteps && "rotate-180")} aria-hidden />
          {showSteps ? "הסתר את דרך הפתרון" : `הצג דרך פתרון מלאה (${steps.length} שלבים${multi ? `, ${r.label}` : ""})`}
        </button>
      )}
      {shownSteps.length > 0 && (
        <ol className="space-y-2">
          {shownSteps.map((s, i) => (
            <li key={s.id + i}>
              <details open className="group rounded-xl border border-line bg-surface">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-semibold text-fg [&::-webkit-details-marker]:hidden">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-fg">{i + 1}</span>
                  <span className="flex-1">{s.title}</span>
                  <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="border-t border-line px-4 py-3">
                  <TraceStepView s={{ ...s, title: "" }} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
      {guided && reveal < steps.length && (
        <button type="button" className={primaryBtn} onClick={() => setReveal((x) => x + 1)}>
          הצג צעד הבא ({reveal}/{steps.length})
        </button>
      )}

      {(!guided || reveal >= steps.length) && (
        <div className="space-y-2">
          <Fold title="פקודות יומן">
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
          </Fold>
          {compare && (
            <Fold title="השוואת שלוש השיטות" open={st.method === "compare"}>
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
                          <th scope="row" className="px-3 py-1.5 text-start font-normal text-fg">
                            {METHOD_LABEL[mm]}
                            {mm === method && " ✓"}
                          </th>
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
            </Fold>
          )}
        </div>
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
        <button
          type="button"
          className={smallBtn}
          onClick={() => {
            // The printout carries the whole working, even when it is folded on screen.
            setShowSteps(true);
            setTimeout(printSolution, 50);
          }}
        >
          <Printer className="h-4 w-4" aria-hidden /> הדפסה
        </button>
      </div>
    </div>
  );
}

type Line = { label: string; units?: number; amount?: number; kind?: "head" | "sub" | "total" | "result"; note?: string };

/** The answer as the exam writes it: sales, then cost of sales as opening + purchases − closing, then gross profit; units beside the shekels. */
function CogsStatement({ r }: { r: PeriodResult }) {
  const discounts = r.grossSales - r.netSales;
  const hasDisc = discounts > 0.005;
  const lines: Line[] = [
    ...(hasDisc
      ? [
          { label: "מכירות ברוטו", units: r.soldUnits, amount: r.grossSales },
          { label: "בניכוי: הנחות והחזרות ללקוחות", amount: -discounts },
        ]
      : []),
    { label: hasDisc ? "מכירות נטו" : "מכירות", units: r.soldUnits, amount: r.netSales, kind: hasDisc ? "sub" : undefined },
    { label: "עלות המכר:", kind: "head" },
    { label: "מלאי פתיחה (י.פ)", units: r.openingUnits, amount: r.openingCost },
    { label: "קניות השנה", units: r.purchasesUnits, amount: r.purchasesCost },
    { label: "סחורה זמינה למכירה", units: r.availableUnits, amount: r.availableCost, kind: "sub" },
    {
      label: "בניכוי: מלאי סגירה (י.ס)",
      units: r.closingUnits,
      amount: -r.closingCarrying,
      note: r.writeDown > 0 ? `בעלות ${m(r.closingCostBasis)}, בניכוי הורדת ערך ${m(r.writeDown)}` : r.reversal > 0 ? `בעלות ${m(r.closingCostBasis)}, בתוספת ביטול הורדת ערך ${m(r.reversal)}` : undefined,
    },
    {
      label: "עלות המכר",
      units: r.soldUnits + r.shrinkUnits,
      amount: r.cogs,
      kind: "total",
      note: [r.writeDown > 0 && `כוללת הורדת ערך ${m(r.writeDown)}`, r.shrinkUnits > 0 && `כולל ${qty(r.shrinkUnits)} יח׳ חוסר בספירה`].filter(Boolean).join(" · ") || undefined,
    },
    { label: `רווח גולמי (${pc(r.gpPct)})`, amount: r.grossProfit, kind: "result" },
  ];
  return (
    <section aria-label={`דוח רווח והפסד ${r.label}`} className="overflow-hidden rounded-xl border border-accent/40 bg-surface">
      <h3 className="border-b border-line bg-accent-soft/50 px-4 py-2.5 font-semibold text-fg">דוח רווח והפסד — {r.label} (עד הרווח הגולמי)</h3>
      <Scroller>
        <table className="w-full min-w-[22rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-4 py-1.5 text-start font-medium">
                <span className="sr-only">סעיף</span>
              </th>
              <th scope="col" className="px-3 py-1.5 text-end font-medium">יח׳</th>
              <th scope="col" className="px-4 py-1.5 text-end font-medium">₪</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) =>
              l.kind === "head" ? (
                <tr key={l.label} className="border-t border-line/70">
                  <th scope="row" colSpan={3} className="px-4 pt-2.5 pb-1 text-start font-semibold text-fg">
                    {l.label}
                  </th>
                </tr>
              ) : (
                <tr key={l.label} className={cn((l.kind === "total" || l.kind === "sub") && "border-t border-line-strong", l.kind === "result" && "border-t-2 border-accent bg-accent-soft/40")}>
                  <th scope="row" className={cn("px-4 py-1.5 text-start font-normal text-fg", (l.kind === "total" || l.kind === "result") && "font-bold")}>
                    {l.label}
                    {l.note && <span className="block text-[11.5px] font-normal text-muted">{l.note}</span>}
                  </th>
                  <td className="px-3 py-1.5 text-end align-top text-muted">{l.units !== undefined && <bdi dir="ltr" className="num">{qty(l.units)}</bdi>}</td>
                  <td className={cn("px-4 py-1.5 text-end align-top", (l.kind === "total" || l.kind === "result") && "font-bold")}>{l.amount !== undefined && <Money v={l.amount} plain />}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </Scroller>
    </section>
  );
}

/** Where the closing balance comes from: its units by the movement, its value by the method, then the test against NRV. */
function ClosingWorking({ r }: { r: PeriodResult }) {
  // FIFO's layers are kept at the carrying amount; at cost they are scaled back.
  const toCost = r.closingCarrying > 0 ? r.closingCostBasis / r.closingCarrying : 1;
  const layers = r.layers.filter((l) => l.units > 1e-9);
  const value =
    r.method === "fifo"
      ? `לפי FIFO נשארו היחידות שנקנו אחרונות: ${layers.map((l) => `${qty(l.units)} × ${u((l.cost * toCost) / l.units)} (${l.source})`).join(" + ") || "0"} = ${m(r.closingCostBasis)} ₪`
      : r.method === "wa-periodic"
        ? `ממוצע משוקלל = ${m(r.availableCost)} ÷ ${qty(r.availableUnits)} = ${u(r.avgCost ?? 0)} ₪ ליח׳ ← ${qty(r.closingUnits)} × ${u(r.avgCost ?? 0)} = ${m(r.closingCostBasis)} ₪`
        : `${qty(r.closingUnits)} × ${u(r.avgCost ?? 0)} (הממוצע הנע אחרי התנועה האחרונה) = ${m(r.closingCostBasis)} ₪`;
  return (
    <section aria-label="איך הגענו ליתרת הסגירה" className="space-y-1.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
      <h3 className="font-semibold text-fg">איך הגענו ליתרת הסגירה?</h3>
      <p className="num text-fg">
        <span className="font-semibold">כמות:</span> י.פ {qty(r.openingUnits)} + קניות {qty(r.purchasesUnits)} − מכירות {qty(r.soldUnits)}
        {r.shrinkUnits > 0 ? ` − חוסר ${qty(r.shrinkUnits)}` : ""} = <strong>{qty(r.closingUnits)} יח׳</strong>
      </p>
      <p className="num text-fg">
        <span className="font-semibold">ערך בעלות:</span> {value}
      </p>
      {r.nrvTotal !== undefined && (
        <p className="num text-fg">
          <span className="font-semibold">שווי מימוש נטו:</span> {m(r.nrvTotal)} ₪{" "}
          {r.writeDown > 0
            ? `— נמוך מהעלות ← הורדת ערך ${m(r.writeDown)} ₪, ומלאי הסגירה בספרים ${m(r.closingCarrying)} ₪ (ההפרש נכנס לעלות המכר).`
            : r.reversal > 0
              ? `— עלה ← ביטול הורדת ערך ${m(r.reversal)} ₪, ומלאי הסגירה בספרים ${m(r.closingCarrying)} ₪.`
              : "— לא נמוך מהעלות ← המלאי נשאר בעלות."}
        </p>
      )}
    </section>
  );
}

/** Every year's answers side by side, with the unknowns found: the whole question at a glance. */
function YearsTable({ st, solution, active }: { st: CalcState; solution: Solution; active: number }) {
  const rs = solution.results ?? [];
  const n = (v: number) => <bdi dir="ltr" className="num">{qty(v)}</bdi>;
  const rows: [string, (x: PeriodResult) => ReactNode, ((x: PeriodResult) => boolean)?][] = [
    ["יחידות שנמכרו", (x) => n(x.soldUnits)],
    ["מכירות נטו", (x) => <Money v={x.netSales} plain />],
    ["עלות המכר", (x) => <Money v={x.cogs} plain />],
    ["…מתוכה הורדת ערך", (x) => (x.writeDown ? <Money v={x.writeDown} plain /> : "—"), (x) => x.writeDown > 0],
    ["רווח גולמי", (x) => <Money v={x.grossProfit} plain />],
    ["שיעור רווח גולמי", (x) => <bdi dir="ltr" className="num">{pc(x.gpPct)}</bdi>],
    ["עלות ממוצעת ליחידה", (x) => (x.avgCost !== undefined ? <bdi dir="ltr" className="num">{u(x.avgCost)}</bdi> : "—"), (x) => x.avgCost !== undefined],
    ["מלאי סגירה (יח׳)", (x) => n(x.closingUnits)],
    ["מלאי סגירה בספרים", (x) => <Money v={x.closingCarrying} plain />],
  ];
  return (
    <Fold title="כל השנים במבט אחד" open>
      <Scroller>
        <table className="w-full min-w-[26rem] text-sm" aria-label="תוצאות לפי שנה">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-start font-medium">
                <span className="sr-only">סעיף</span>
              </th>
              {st.years.map((y, t) => (
                <th key={y.id} scope="col" className={cn("px-3 py-2 text-end font-medium", t === active && "text-fg")}>
                  {y.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .filter(([, , shown]) => !shown || rs.some((x) => x && shown(x)))
              .map(([label, f]) => (
                <tr key={label} className="border-t border-line/70">
                  <th scope="row" className="px-3 py-1.5 text-start font-normal text-fg">
                    {label}
                  </th>
                  {st.years.map((y, t) => (
                    <td key={y.id} className={cn("px-3 py-1.5 text-end", t === active && "bg-accent-soft/50 font-semibold")}>
                      {rs[t] ? f(rs[t]!) : <span className="text-muted">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </Scroller>
    </Fold>
  );
}

export function FireCard({ claim }: { claim: NonNullable<Claim> }) {
  if ("error" in claim) return <p className="rounded-xl border border-danger/40 bg-danger/[0.06] px-4 py-3 text-sm text-fg">שריפה: {claim.error}</p>;
  const { r } = claim;
  return (
    <section aria-label="שריפה ושיפוי" className="space-y-2 rounded-xl border border-line bg-surface p-4">
      <h3 className="font-semibold text-fg">שריפה ושיפוי{r.fireDate ? ` (${r.fireDate.split("-").reverse().map(Number).join(".")})` : ""}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="יחידות שנשרפו" value={qty(r.burnedUnits)} hint={`מתוך ${qty(r.unitsAtFire)} במחסן`} />
        <Stat label="סכום התביעה" value={<Money v={r.burned} />} />
        <Stat label="השתתפות עצמית" value={<Money v={r.settlement.deductible} />} />
        <Stat label="שיפוי מהביטוח" value={<Money v={r.settlement.net} />} tone="success" />
      </div>
      {r.settlement.capExcess > 0 && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2 text-sm text-fg">
          ⚠ תקרת השיפוי הגבילה את הסכום: {m(r.settlement.capExcess)} ₪ מעל התקרה לא משופים.
        </p>
      )}
      {!r.fireDate && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2 text-sm text-fg">
          ⚠ לא הוזן תאריך שריפה, ולכן נכללו כל הרכישות והמכירות שבטבלה — גם אלה שאחרי השריפה. הזינו את התאריך בשלב 2.
        </p>
      )}
      {r.after.length > 0 && <p className="text-xs text-muted">לא נכללו (אחרי השריפה): {r.after.map((a) => `${a.kind === "buy" ? "רכישה" : "מכירה"} ${a.date.split("-").reverse().map(Number).join(".")}`).join(", ")}.</p>}
    </section>
  );
}

function Fold({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-fg [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 border-t border-line px-4 py-3">{children}</div>
    </details>
  );
}

/** Guided mode: guess each key number before seeing it. */
function Guess({ r }: { r: PeriodResult }) {
  const keys: [string, number][] = [
    ["כמות במלאי הסגירה", r.closingUnits],
    ["מלאי סגירה (בספרים)", r.closingCarrying],
    ["עלות המכר", r.cogs],
    ["רווח גולמי", r.grossProfit],
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
