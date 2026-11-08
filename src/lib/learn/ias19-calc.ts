import { accrued, attribution, type BenefitFormula, partInterest, pv, tiered } from "./ias19";
import type { BkLine, BkNote, BkRoll, BkStep, BkTable } from "./ias19-booklet";

/**
 * The IAS 19 calculator's solver: any benefit the course teaches, from data
 * rather than from a fixed question. One entry per kind of benefit, each
 * returning the solution in the course's own format: the movement table, then
 * a note per line (what is computed, the numbers, the result), the statements,
 * and the journal entry. Pure, so it runs on the client. The course's booklet
 * and exam questions are run through it in ias19-calc.test.ts.
 */

export type JournalLine = { account: string; dr?: number; cr?: number };
export type CalcJournal = { title: string; lines: JournalLine[] };
export type CalcStep = BkStep & { journal?: CalcJournal[] };
export type CalcMetric = { label: string; value: number };
/** What a solution adds to the statements, for a summary of several benefits. Expense and OCI loss are positive; the balance is a liability, a negative one an asset. */
export type CalcSummary = { year: number; label: string; pl: number; oci: number; balance: number };
/** `detail` holds the raw figures, for the tests. */
export type CalcSolution = { title: string; metrics: CalcMetric[]; steps: CalcStep[]; notes: string[]; summary?: CalcSummary; detail?: unknown };

const nf = (x: number, d = 0) => x.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const money = (x: number) => nf(Math.round(x));
const d2 = (x: number) => nf(Math.round(x * 100) / 100, 2);
const pc = (r: number) => `${nf(r * 100, 3)}%`;
const b = (i: number) => nf(1 + i, 5);
const yrs = (n: number) => nf(n, 4);
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
/** A signed amount, written as the course writes it: brackets for a negative. */
const sg = (x: number) => (x < 0 ? `(${money(-x)})` : money(x));
const line = (label: string, calc: string | undefined, value: number, how?: string): BkLine => ({ label, calc, value, how, unit: "₪" });

/** One entry: amount > 0 is a debit, < 0 a credit; lines that round to nothing are dropped. */
function entry(title: string, parts: [string, number][]): CalcJournal {
  const kept = parts.filter(([, a]) => Math.abs(a) >= 0.5).map(([account, a]) => [account, Math.round(a)] as [string, number]);
  // Rounding each line can leave a shekel between the two sides: the largest line that isn't cash absorbs it, since cash is a given amount.
  const gap = kept.reduce((s, [, a]) => s + a, 0);
  const others = kept.filter(([account]) => account !== "מזומן");
  if (gap && others.length) {
    const big = others.reduce((m, l) => (Math.abs(l[1]) > Math.abs(m[1]) ? l : m));
    big[1] -= gap;
  }
  return {
    title,
    lines: kept.sort((x, y) => Number(y[1] > 0) - Number(x[1] > 0)).map(([account, a]) => (a > 0 ? { account, dr: a } : { account, cr: -a })),
  };
}

// ===========================================================================
// Defined benefit and other long-term: how much of the benefit is accrued.

export type Terms =
  /** A fixed amount per head for every year of service. */
  | { kind: "perYear"; amount: number }
  /** A share of the salary expected at payment, per year of service. */
  | { kind: "salary"; share: number }
  /** A fixed grant earned over a window of years, on a straight line. */
  | { kind: "lump"; grant: number; window: number }
  /**
   * A formula in tiers, with an optional cap: plan formula, or straight line when later years earn materially more.
   * `growth`: every year past the first tier earns this much more than the year before.
   * `short`: a whole stay of up to `upTo` years earns a flat `perYear` instead of the tiers.
   */
  | { kind: "tiers"; tiers: { upTo?: number; perYear: number }[]; cap?: number; growth?: number; short?: { upTo: number; perYear: number } }
  /** Two routes to one grant: at `minAge` after `years` of service, or at `retire` whatever the service. */
  | { kind: "routes"; grant: number; minAge: number; years: number; retire: number }
  /** One grant at the first of two conditions met, service or age; a stay that meets neither earns nothing. */
  | { kind: "earliest"; grant: number; years: number; age: number }
  /** Amounts given outright: accrued per head at the start of the year, and added this year (a bonus on each year's profit). */
  | { kind: "amounts" }
  /** An existing benefit with another added to it by an amendment. */
  | { kind: "sum"; parts: Terms[] };

export type DbGroup = {
  name: string;
  heads: number;
  /** The share of `heads` expected to reach payment. */
  stay: number;
  /** Terms of this group alone, when groups differ. */
  terms?: Terms;
  /** An amendment doesn't apply to this group. */
  skipEvent?: boolean;
  /** Of `heads`, how many left on 1.1 with nothing, unexpectedly: in the opening, out of everything after it. */
  leftAtStart?: number;
  /** Years of service at 1.1; negative for someone who joins during the year (a quarter of a year left: −0.75). */
  served: number;
  /** Years from the end of the year to payment. For "routes" it is derived from the ages. */
  nEnd: number;
  /** Years at the start of service that do not count. */
  uncounted?: number;
  /** The salary expected at payment, for "salary". */
  salary?: number;
  /** Years of service expected in all, for "tiers". */
  expected?: number;
  /** Age at hire, for "routes". */
  hireAge?: number;
  /** For "amounts". */
  accruedStart?: number;
  addedThisYear?: number;
  /** The assumptions on the event date and at year end, when they differ from the start. */
  atEvent?: { heads?: number; stay?: number; salary?: number; /** Years to payment on the event date, when the question gives them; otherwise they follow from the date. */ n?: number };
  atEnd?: { heads?: number; stay?: number; salary?: number };
  /** Heads expected after an amendment that also cuts the workforce (a curtailment). */
  headsAfter?: number;
};

export type DbEvent =
  /** `add`: the terms come on top of each group's own, instead of replacing them. */
  | { type: "amend"; month: number; rate: number; terms: Terms; add?: boolean; compensation?: number }
  | { type: "settle"; month: number; rate: number; share: number; paid: number; paidFromAssets: boolean };

export type Ceiling =
  | { kind: "none" }
  /** The surplus is not available to the company: the net asset can't exceed zero. */
  | { kind: "zero" }
  /** The present value of the economic benefits, given at each date. */
  | { kind: "amount"; opening: number; closing: number }
  /** IFRIC 14: future service cost less the minimum contributions for it, each in present value. */
  | { kind: "mfr"; servicePerYear: number; futureAtStart: number; minimum: number };

export type DbAssets = {
  opening: number;
  /** Fair value at year end; or, when the question gives the return instead, `excessReturn`, and the closing follows. */
  closing?: number;
  excessReturn?: number;
  contributions: { amount: number; month: number }[];
  /** Fair value on the event date, when given: the assets are remeasured there (IAS 19.99). */
  atEvent?: number;
  ceiling: Ceiling;
};

export type DbInput = {
  plan: "postEmployment" | "otherLongTerm";
  year: number;
  terms: Terms;
  groups: DbGroup[];
  iStart: number;
  iEnd: number;
  event?: DbEvent;
  payments?: { amount: number; month: number; fromAssets?: boolean }[];
  assets?: DbAssets;
  /** Net interest in the salary line instead of finance (a policy the standard allows). */
  interestInSalary?: boolean;
  /** Balances given outright, in place of measuring them (a balance brought forward; an actuary's figure). */
  openingGiven?: number;
  closingGiven?: number;
};

/** Where a "routes" grant is earned, and over how many years. */
export function routeOf(t: Extract<Terms, { kind: "routes" }>, hireAge: number) {
  if (hireAge + t.years <= t.retire) {
    const end = Math.max(t.minAge, hireAge + t.years);
    return { start: end - t.years, end, route: "service" as const };
  }
  return { start: hireAge, end: t.retire, route: "age" as const };
}

/** The formula of a "tiers" benefit, for this group's whole stay. */
function tierFormula(t: Extract<Terms, { kind: "tiers" }>, g: DbGroup): BenefitFormula {
  const expected = (g.expected ?? 0) - (g.uncounted ?? 0);
  if (t.short && expected > 0 && expected <= t.short.upTo) return tiered([{ perYear: t.short.perYear }]);
  if (!t.growth) return tiered(t.tiers);
  const upTo = t.tiers[0].upTo ?? 0;
  const first = t.tiers[0].perYear;
  const growth = t.growth;
  return (years) => {
    let total = first * Math.min(years, upTo);
    let amount = first;
    for (let k = upTo; k < years; k++) {
      amount *= 1 + growth;
      total += amount * Math.min(1, years - k);
    }
    return total;
  };
}

/** How many years an "earliest" grant is earned over; undefined when the stay meets neither condition. */
export function earliestWindow(t: Extract<Terms, { kind: "earliest" }>, g: DbGroup) {
  const stay = g.expected ?? 0;
  const byAge = t.age - (g.hireAge ?? 0);
  const window = Math.min(byAge <= stay ? byAge : Infinity, t.years <= stay ? t.years : Infinity);
  return Number.isFinite(window) ? window : undefined;
}

/** What is accrued per head after `s` years of service, on these terms. */
export function accruedAt(t: Terms, g: DbGroup, s: number, salary: number): number {
  const counted = Math.max(0, s - (g.uncounted ?? 0));
  switch (t.kind) {
    case "sum":
      return sum(t.parts.map((x) => accruedAt(x, g, s, salary)));
    case "earliest": {
      const window = earliestWindow(t, g);
      return window === undefined ? 0 : (t.grant / window) * Math.min(counted, window);
    }
    case "perYear":
      return t.amount * counted;
    case "salary":
      return t.share * salary * counted;
    case "lump":
      return (t.grant / t.window) * Math.min(counted, t.window);
    case "tiers": {
      const f = tierFormula(t, g);
      const cap = t.cap ?? Infinity;
      return accrued(attribution(f, (g.expected ?? counted) - (g.uncounted ?? 0), cap), f, counted, cap);
    }
    case "routes": {
      const w = routeOf(t, g.hireAge ?? 0);
      const window = w.end - w.start;
      return (t.grant / window) * Math.min(Math.max(0, (g.hireAge ?? 0) + s - w.start), window);
    }
    case "amounts":
      return (g.accruedStart ?? 0) + (g.addedThisYear ?? 0) * Math.max(0, s - g.served);
  }
}

const nEndOf = (t: Terms, g: DbGroup) => (t.kind === "routes" ? t.retire - ((g.hireAge ?? 0) + g.served + 1) : g.nEnd);
const termsOf = (q: { terms: Terms }, g: DbGroup) => g.terms ?? q.terms;

/** The measurement of one group at one date, as the five steps write it. */
function measured(heads: number, acc: number, i: number, n: number) {
  return { value: pv(heads * acc, i, n), calc: `${d2(heads)} × ${d2(acc)} ÷ ${b(i)}^${yrs(n)}` };
}

/** One sentence on how a group's benefit reaches the years of service. */
function attributionText(t: Terms, g: DbGroup): BkLine {
  switch (t.kind) {
    case "sum":
      return { label: g.name, text: t.parts.map((x) => attributionText(x, g).text).join(" ועוד: ") };
    case "earliest": {
      const w = earliestWindow(t, g);
      return { label: g.name, text: w === undefined ? "לא מגיע למענק בשום מסלול, ולכן לא נצבר כלום." : `התנאי הראשון שמתקיים אחרי ${w} שנים: ${money(t.grant)} ÷ ${w} = ${money(t.grant / w)} ₪ לשנה.` };
    }
    case "perYear":
      return { label: g.name, text: `${money(t.amount)} ₪ לכל שנת שירות שנספרת.` };
    case "salary":
      return { label: g.name, text: `${pc(t.share)} × שכר צפוי ${money(g.salary ?? 0)} ₪ = ${money(t.share * (g.salary ?? 0))} ₪ לשנת שירות.` };
    case "lump":
      return { label: g.name, text: `${money(t.grant)} ÷ ${t.window} = ${money(t.grant / t.window)} ₪ לשנה, עד ${t.window} שנים. אחריהן לא נצבר יותר.` };
    case "tiers": {
      const f = tierFormula(t, g);
      const cap = t.cap ?? Infinity;
      const a = attribution(f, (g.expected ?? 0) - (g.uncounted ?? 0), cap);
      return a.method === "formula"
        ? { label: g.name, text: `לפי נוסחת התוכנית (סעיף 71): השנים המאוחרות לא נותנות יותר. סה״כ ${money(a.total)} ₪ על ${a.window} שנים.` }
        : { label: g.name, text: `קו ישר (סעיף 73): השנים המאוחרות נותנות יותר. ${money(a.total)} ÷ ${a.window} = ${money(a.perYear!)} ₪ לשנה${a.window < (g.expected ?? 0) ? ", והתקרה מקצרת את החלון" : ""}.` };
    }
    case "routes": {
      const w = routeOf(t, g.hireAge ?? 0);
      return { label: g.name, text: `${w.route === "service" ? "מסלול ותק וגיל" : "מסלול גיל בלבד"}: צבירה מגיל ${w.start} עד גיל ${w.end}. ${money(t.grant)} ÷ ${w.end - w.start} = ${money(t.grant / (w.end - w.start))} ₪ לשנה.` };
    }
    case "amounts":
      return { label: g.name, text: `נצבר עד 1.1: ${money(g.accruedStart ?? 0)} ₪. נוסף השנה: ${money(g.addedThisYear ?? 0)} ₪.` };
  }
}

/** Measuring an obligation at one date: the five steps, group by group. */
export function solveMeasure(q: { plan: DbInput["plan"]; date: string; terms: Terms; rate: number; groups: (DbGroup & { servedAtDate: number; nAtDate: number })[] }): CalcSolution {
  const rows = q.groups.map((g) => {
    const own = termsOf(q, g);
    const n = own.kind === "routes" ? own.retire - ((g.hireAge ?? 0) + g.servedAtDate) : g.nAtDate;
    const acc = accruedAt(own, g, g.servedAtDate, g.salary ?? 0);
    const heads = g.heads * g.stay;
    return { g, n, acc, heads, ...measured(heads, acc, q.rate, n) };
  });
  const total = sum(rows.map((r) => r.value));
  return {
    title: `מדידת ההתחייבות ב-${q.date}`,
    metrics: [{ label: `התחייבות ב-${q.date}`, value: total }],
    steps: [
      { title: "לאיזו שנה שייך כל חלק", notes: [{ title: "ייחוס ההטבה לשנות השירות", lines: q.groups.map((g) => attributionText(termsOf(q, g), g)) }] },
      {
        title: "חמשת הצעדים",
        text: [`הטבה × שנים × עובדים צפויים, מהוון לפי **השנים עד התשלום** ובשיעור אג״ח קונצרני איכותי (${pc(q.rate)}).`],
        tables: [
          {
            head: ["קבוצה", "נצבר לעובד", "עובדים צפויים", "n", "חישוב", "התחייבות"],
            rows: rows.map((r) => [r.g.name, d2(r.acc), d2(r.heads), yrs(r.n), r.calc, money(r.value)]),
            foot: ["סה״כ", "", "", "", "", money(total)],
          },
        ],
      },
    ],
    notes: ["מהוונים לפי השנים עד התשלום, לא לפי שנות הצבירה."],
    summary: { year: Number(q.date.slice(-4)) || 0, label: `מדידה ב-${q.date}`, pl: 0, oci: 0, balance: total },
  };
}

// ---------------------------------------------------------------------------
// A year of the obligation, with its plan assets.

function assetsYear(q: DbInput, a: DbAssets, ctx: { m: number; iV: number; settledPaid: number; settledFromAssets: boolean }) {
  const pays = (q.payments ?? []).filter((p) => p.fromAssets);
  const split = q.event !== undefined && ctx.m > 0 && ctx.m < 12;
  const lines: BkLine[] = [];
  const flowInterest = (month: number, amount: number, from: number, to: number, i: number) => (month >= from && month < to ? partInterest(amount, i, to - month) : 0);
  const flows = (from: number, to: number, i: number) => sum(a.contributions.map((c) => flowInterest(c.month, c.amount, from, to, i))) - sum(pays.map((p) => flowInterest(p.month, p.amount, from, to, i)));
  const flowText = (from: number, to: number) => [...a.contributions.filter((c) => c.month >= from && c.month < to).map((c) => `הפקדה ${money(c.amount)} מחודש ${c.month}`), ...pays.filter((p) => p.month >= from && p.month < to).map((p) => `תשלום ${money(p.amount)} מחודש ${p.month}`)];
  let interest = 0;
  let pnEvent = 0;
  if (!split) {
    const onOpening = a.opening * q.iStart;
    const onFlows = flows(0, 12, q.iStart);
    interest = onOpening + onFlows;
    lines.push(line("ריבית על הפתיחה", `${money(a.opening)} × ${pc(q.iStart)}`, onOpening));
    for (const t of flowText(0, 12)) lines.push({ label: t, text: "ריבית מיום התנועה עד סוף השנה" });
    if (onFlows) lines.push(line("ריבית על הפקדות ותשלומים", undefined, onFlows));
  } else {
    const onOpening = partInterest(a.opening, q.iStart, ctx.m);
    const before = flows(0, ctx.m, q.iStart);
    lines.push(line(`ריבית עד חודש ${ctx.m}`, `${money(a.opening)} × (${b(q.iStart)}^(${ctx.m}/12) − 1)`, onOpening + before));
    const cumBefore = sum(a.contributions.filter((c) => c.month < ctx.m).map((c) => c.amount)) - sum(pays.filter((p) => p.month < ctx.m).map((p) => p.amount));
    let base: number;
    if (a.atEvent !== undefined) {
      pnEvent = a.atEvent - a.opening - onOpening - before - cumBefore;
      lines.push(line("מדידה מחדש ביום האירוע", `${money(a.atEvent)} − ${money(a.opening)} − ריבית${cumBefore ? ` − ${money(cumBefore)}` : ""}`, pnEvent, "השווי ההוגן של אותו יום, פחות היתרה בספרים (סעיף 99)"));
      base = a.atEvent - (ctx.settledFromAssets ? ctx.settledPaid : 0);
    } else if (ctx.settledFromAssets) {
      // The fund paid for the settlement: what is left includes the interest earned so far.
      base = a.opening + onOpening + before + cumBefore - ctx.settledPaid;
    } else {
      // As the course's mid-year split: the balance and the flows, each at its period's rate.
      base = a.opening + cumBefore;
    }
    const after = partInterest(base, ctx.iV, 12 - ctx.m);
    const flowsAfter = flows(ctx.m, 12, ctx.iV);
    lines.push(line(`ריבית מחודש ${ctx.m}`, `${money(base)} × (${b(ctx.iV)}^(${12 - ctx.m}/12) − 1)`, after + flowsAfter));
    interest = onOpening + before + after + flowsAfter;
  }
  const contributions = sum(a.contributions.map((c) => c.amount));
  const paid = sum(pays.map((p) => p.amount));
  const settled = ctx.settledFromAssets ? ctx.settledPaid : 0;
  const closing = a.closing ?? a.opening + interest + contributions - paid - settled + (a.excessReturn ?? 0);
  const pn = closing - a.opening - interest - contributions + paid + settled;
  return { interest, contributions, paid, settled, pn, pnEvent, lines, closing };
}

/** The ceiling at the two dates, and how much of the fair value the statements carry. */
function ceilingOf(c: Ceiling, q: DbInput) {
  switch (c.kind) {
    case "none":
      return { open: Infinity, close: Infinity, text: "" };
    case "zero":
      return { open: 0, close: 0, text: "העודף אינו זמין לחברה, ולכן התקרה אפס." };
    case "amount":
      return { open: c.opening, close: c.closing, text: "הערך הנוכחי של ההטבות הכלכליות, לפי הנתונים." };
    case "mfr": {
      const at = (future: number, i: number) => {
        const fsc = (c.servicePerYear * future) / (1 + i) ** future;
        const pvMin = sum(Array.from({ length: future }, (_, k) => c.minimum / (1 + i) ** (k + 1)));
        return Math.max(0, fsc - pvMin);
      };
      return { open: at(c.futureAtStart, q.iStart), close: at(c.futureAtStart - 1, q.iEnd), text: "עלות שירות עתידית פחות הפקדה מינימלית, כל אחת בערך נוכחי (IFRIC 14)." };
    }
  }
}

export function solveDbYear(q: DbInput): CalcSolution {
  const y = q.year;
  const ev = q.event;
  const m = ev?.month ?? 0;
  const iV = ev?.rate ?? q.iStart;
  const f = m / 12;
  const newTermsOf = (g: DbGroup): Terms => {
    const own = termsOf(q, g);
    if (ev?.type !== "amend" || g.skipEvent) return own;
    return ev.add ? { kind: "sum", parts: [own, ev.terms] } : ev.terms;
  };
  const share = ev?.type === "settle" ? ev.share : 0;
  const otherLong = q.plan === "otherLongTerm";

  const rows = q.groups.map((g) => {
    const own = termsOf(q, g);
    const newTerms = newTermsOf(g);
    const nEnd = nEndOf(own, g);
    const s0 = g.served;
    const left = g.leftAtStart ?? 0;
    const hOpen = g.heads * g.stay;
    const hS = (g.heads - left) * g.stay;
    const hA = (g.atEvent?.heads ?? g.heads - left) * (g.atEvent?.stay ?? g.stay);
    const hE = (g.atEnd?.heads ?? g.heads - left) * (g.atEnd?.stay ?? g.stay);
    const salS = g.salary ?? 0;
    const salA = g.atEvent?.salary ?? salS;
    const salE = g.atEnd?.salary ?? salS;
    const acc0 = accruedAt(own, g, s0, salS);
    const open = measured(hOpen, acc0, q.iStart, nEnd + 1);
    // Someone who left on 1.1 is in the opening but earns no interest.
    const leaver = pv(left * g.stay * acc0, q.iStart, nEnd + 1);
    const end = measured(hE, accruedAt(newTerms, g, s0 + 1, salE), q.iEnd, nEnd);
    if (!ev) {
      const unit = accruedAt(own, g, s0 + 1, salS) - acc0;
      const service = measured(hS, unit, q.iStart, nEnd);
      return { g, nEnd, open, leaver, end, services: [service], before: 0, after: 0, beforeCalc: "", afterCalc: "" };
    }
    const nFromDate = nEnd + 1 - f;
    const nA = g.atEvent?.n ?? nFromDate;
    const unitBefore = accruedAt(own, g, s0 + f, salS) - acc0;
    const sBefore = measured(hS, unitBefore, q.iStart, nFromDate);
    const before = measured(hA, accruedAt(own, g, s0 + f, salA), iV, nA);
    const hAfter = g.headsAfter ?? hA;
    const after = ev.type === "amend" ? measured(hAfter, accruedAt(newTerms, g, s0 + f, salA), iV, nA) : before;
    const unitAfter = accruedAt(newTerms, g, s0 + 1, salA) - accruedAt(newTerms, g, s0 + f, salA);
    const sAfter = m < 12 ? measured(hAfter * (1 - share), unitAfter, iV, nA - (12 - m) / 12) : { value: 0, calc: "" };
    return { g, nEnd, open, leaver, end, services: [sBefore, sAfter], before: before.value, after: after.value, beforeCalc: before.calc, afterCalc: after.calc };
  });

  const opening = q.openingGiven ?? sum(rows.map((r) => r.open.value));
  const closing = q.closingGiven ?? sum(rows.map((r) => r.end.value));
  const service = sum(rows.flatMap((r) => r.services.map((s) => s.value)));
  const before = sum(rows.map((r) => r.before));
  const afterAmend = sum(rows.map((r) => r.after));
  const past = ev?.type === "amend" ? afterAmend - before : 0;
  const settledOb = ev?.type === "settle" ? before * share : 0;
  const settledPaid = ev?.type === "settle" ? ev.paid : 0;
  const settlementGain = settledOb - settledPaid;
  const settledFromAssets = ev?.type === "settle" && ev.paidFromAssets;
  const compensation = ev?.type === "amend" ? (ev.compensation ?? 0) : 0;
  const balanceAfter = ev?.type === "amend" ? afterAmend : before - settledOb;

  const pays = q.payments ?? [];
  const paidTotal = sum(pays.map((p) => p.amount));
  const payInterest = sum(pays.map((p) => (ev ? (p.month < m ? partInterest(p.amount, q.iStart, m - p.month) : partInterest(p.amount, iV, 12 - p.month)) : partInterest(p.amount, q.iStart, 12 - p.month))));
  const leaverOpening = sum(rows.map((r) => r.leaver));
  const iBefore = ev ? partInterest(opening - leaverOpening, q.iStart, m) : (opening - leaverOpening) * q.iStart;
  const iAfter = ev ? partInterest(balanceAfter, iV, 12 - m) : 0;
  const interest = iBefore + iAfter - payInterest;
  const paidBefore = ev ? sum(pays.filter((p) => p.month < m).map((p) => p.amount)) : 0;
  const pn = closing - opening - service - past - interest + paidTotal + settledOb;
  const serviceBefore = ev ? sum(rows.map((r) => r.services[0].value)) : 0;
  const pnEvent = ev ? before - opening - serviceBefore - (iBefore - sum(pays.filter((p) => p.month < m).map((p) => partInterest(p.amount, q.iStart, m - p.month)))) + paidBefore : 0;

  const pnTo = otherLong ? "רווח והפסד" : "OCI";
  const obRows: BkRoll["rows"] = [
    { label: `יתרת פתיחה 31.12.${y - 1}`, value: opening, kind: "balance", note: "ביאור 1" },
    { label: "עלות שירות שוטף", value: service, note: "ביאור 2" },
    { label: "עלות ריבית", value: interest, note: "ביאור 3" },
  ];
  if (ev?.type === "amend") obRows.splice(2, 0, { label: "עלות שירות עבר", value: past, note: "ביאור 4" });
  if (ev?.type === "settle") obRows.push({ label: "סילוק: היתרה שיצאה", value: -settledOb, note: "ביאור 4" });
  if (paidTotal) obRows.push({ label: "תשלומים לעובדים", value: -paidTotal, note: "נתון" });
  obRows.push({ label: "מדידה מחדש", value: pn, kind: "pn", note: "השורה המאזנת" });
  obRows.push({ label: `יתרת סגירה 31.12.${y}`, value: closing, kind: "balance", note: "ביאור 5" });

  const notes: BkNote[] = [];
  if (q.openingGiven === undefined) notes.push({ title: "ביאור 1: יתרת הפתיחה", text: `לפי ההנחות של 31.12.${y - 1}, בשיעור ${pc(q.iStart)}.`, lines: rows.map((r) => line(r.g.name, r.open.calc, r.open.value)) });
  else notes.push({ title: "ביאור 1: יתרת הפתיחה", lines: [line("נתון", undefined, opening)] });
  notes.push({
    title: "ביאור 2: עלות שירות שוטף",
    text: ev ? `לכל תקופה התנאים שלה, השיעור של תחילתה, וההיוון מסוף התקופה עד התשלום.` : `שנת שירות אחת, בשיעור תחילת השנה (${pc(q.iStart)}), מהוונת מסוף השנה עד התשלום.`,
    lines: rows.flatMap((r) => r.services.filter((s) => s.calc).map((s, k) => line(ev ? `${r.g.name}: ${k === 0 ? "לפני האירוע" : "אחרי האירוע"}` : r.g.name, s.calc, s.value))),
  });
  const intLines: BkLine[] = ev
    ? [line(`ריבית עד חודש ${m}`, `${money(opening - leaverOpening)} × (${b(q.iStart)}^(${m}/12) − 1)`, iBefore, leaverOpening ? "בלי מי שעזב ב-1.1" : undefined), line(`ריבית מחודש ${m}`, `${money(balanceAfter)} × (${b(iV)}^(${12 - m}/12) − 1)`, iAfter, "על היתרה אחרי האירוע")]
    : [line("על יתרת הפתיחה", `${money(opening - leaverOpening)} × ${pc(q.iStart)}`, iBefore, leaverOpening ? "בלי מי שעזב ב-1.1" : undefined)];
  if (payInterest) intLines.push(line("פחות: ריבית על תשלומים, מיום התשלום", undefined, -payInterest));
  notes.push({ title: "ביאור 3: עלות ריבית", lines: intLines });
  if (ev?.type === "amend") {
    notes.push({
      title: "ביאור 4: עלות שירות עבר",
      text: `שתי היתרות ביום השינוי, באותו שיעור (${pc(iV)}) ובאותו n. ההפרש נרשם מיד ברווח והפסד (סעיף 103).`,
      lines: [...rows.flatMap((r) => [line(`${r.g.name}: לפני`, r.beforeCalc, r.before), line(`${r.g.name}: אחרי`, r.afterCalc, r.after)]), line("עלות שירות עבר", `${money(afterAmend)} − ${money(before)}`, past)],
    });
  }
  if (ev?.type === "settle") {
    notes.push({
      title: "ביאור 4: סילוק",
      text: `קודם מודדים מחדש ביום הסילוק, בשיעור ${pc(iV)} (סעיף 99). הפער מהיתרה בספרים הוא מדידה מחדש. ואז: היתרה שיצאה פחות התשלום, לרווח והפסד (סעיף 109).`,
      lines: [
        ...rows.map((r) => line(`${r.g.name}: יתרה ביום הסילוק`, r.beforeCalc, r.before)),
        line("היתרה שיצאה", `${money(before)} × ${pc(share)}`, settledOb),
        line(settlementGain >= 0 ? "רווח מסילוק" : "הפסד מסילוק", `${money(settledOb)} − ${money(settledPaid)}`, settlementGain),
      ],
    });
  }
  notes.push({ title: "ביאור 5: יתרת הסגירה", text: `לפי ההנחות של 31.12.${y}, בשיעור ${pc(q.iEnd)}.`, lines: q.closingGiven === undefined ? rows.map((r) => line(r.g.name, r.end.calc, r.end.value)) : [line("נתון", undefined, closing)] });
  notes.push({
    title: "המדידה מחדש",
    text: "השורה המאזנת: סגירה פחות כל השורות האחרות.",
    lines: ev ? [line("ביום האירוע", "היתרה ביום האירוע − פתיחה − שירות − ריבית + תשלומים", pnEvent), line("עד סוף השנה", "השאר", pn - pnEvent), line("סה״כ", undefined, pn)] : [line(pn >= 0 ? "הפסד אקטוארי" : "רווח אקטוארי", `${money(closing)} − ${money(opening)} − ${money(service)} − ${money(interest)}${paidTotal ? ` + ${money(paidTotal)}` : ""}`, pn)],
  });

  const steps: CalcStep[] = [];
  const attrLines = q.groups.map((g) => attributionText(termsOf(q, g), g));
  if (ev?.type === "amend") attrLines.push(...q.groups.filter((g) => !g.skipEvent).map((g) => ({ ...attributionText(ev.terms, g), label: `${g.name}: ${ev.add ? "התוספת" : "אחרי התיקון"}` })));
  steps.push({ title: "לאיזו שנה שייך כל חלק", notes: [{ title: "ייחוס ההטבה לשנות השירות", lines: attrLines }] });
  steps.push({ title: "התנועה בהתחייבות", rolls: [{ title: `התחייבות, ${y}`, rows: obRows, pnTo }], notes });

  // Assets, and the ceiling.
  let assetInterest = 0;
  let assetPn = 0;
  let recognisedOpen = 0;
  let recognisedClose = 0;
  let effectInterest = 0;
  let effectChange = 0;
  let contributions = 0;
  let companyPaid = paidTotal;
  if (q.assets) {
    const a = assetsYear(q, q.assets, { m, iV, settledPaid, settledFromAssets });
    assetInterest = a.interest;
    assetPn = a.pn;
    contributions = a.contributions;
    companyPaid = paidTotal - a.paid;
    const assetRows: BkRoll["rows"] = [
      { label: `שווי הוגן 31.12.${y - 1}`, value: q.assets.opening, kind: "balance" },
      { label: "הכנסות ריבית", value: a.interest, note: "באותו שיעור כמו ההתחייבות (סעיף 125)" },
    ];
    if (a.contributions) assetRows.push({ label: "הפקדות", value: a.contributions, note: "נתון" });
    if (a.paid) assetRows.push({ label: "תשלומים מהקרן", value: -a.paid, note: "רק מה שיצא מהקרן" });
    if (a.settled) assetRows.push({ label: "תשלום הסילוק מהקרן", value: -a.settled, note: "נתון" });
    assetRows.push({ label: "מדידה מחדש", value: a.pn, kind: "pn", note: "השורה המאזנת" });
    assetRows.push({ label: `שווי הוגן 31.12.${y}`, value: a.closing, kind: "balance" });
    const assetsClose = a.closing;

    const c = ceilingOf(q.assets.ceiling, q);
    const surplus0 = q.assets.opening - opening;
    const surplus1 = assetsClose - closing;
    recognisedOpen = surplus0 > 0 ? opening + Math.max(0, Math.min(surplus0, c.open)) : q.assets.opening;
    recognisedClose = surplus1 > 0 ? closing + Math.max(0, Math.min(surplus1, c.close)) : assetsClose;
    const effect0 = q.assets.opening - recognisedOpen;
    const effect1 = assetsClose - recognisedClose;
    effectInterest = effect0 * q.iStart;
    effectChange = effect1 - effect0 - effectInterest;
    const ceilingNotes: BkNote[] = q.assets.ceiling.kind === "none" || (surplus0 <= 0 && surplus1 <= 0)
      ? []
      : [
          {
            title: "תקרת הנכס",
            text: `${c.text} הנכס נטו הוא הנמוך מבין העודף לתקרה (סעיף 64).${q.assets.ceiling.kind === "mfr" ? " גם בלי החזרים, הפקדה עתידית נמוכה מעלות השירות היא הטבה כלכלית, ולכן אפשר להכיר בחלק מהעודף כנכס, עד גובה התקרה." : ""}`,
            lines: [
              ...(surplus0 > 0
                ? [
                    line(`עודף 31.12.${y - 1}`, `${money(q.assets.opening)} − ${money(opening)}`, surplus0),
                    line(`תקרה 31.12.${y - 1}`, undefined, Number.isFinite(c.open) ? c.open : 0),
                    line(`נכס נטו 31.12.${y - 1}`, undefined, Math.max(0, recognisedOpen - opening)),
                  ]
                : []),
              line(`עודף 31.12.${y}`, `${money(assetsClose)} − ${money(closing)}`, surplus1),
              line(`תקרה 31.12.${y}`, undefined, Number.isFinite(c.close) ? c.close : 0),
              line(`נכס נטו 31.12.${y}`, undefined, Math.max(0, recognisedClose - closing)),
              line("השפעת התקרה בסוף השנה", `${money(assetsClose)} − ${money(recognisedClose)}`, effect1),
              ...(effect0 ? [line("ריבית על השפעת התקרה", `${money(effect0)} × ${pc(q.iStart)}`, effectInterest, "חלק מהריבית נטו"), line("שינוי בהשפעת התקרה, ל-OCI", `${money(effect1)} − ${money(effect0)} − ${money(effectInterest)}`, effectChange)] : [line("שינוי בהשפעת התקרה, ל-OCI", undefined, effectChange)]),
            ],
          },
        ];
    steps.push({ title: "נכסי התכנית", rolls: [{ title: `נכסי תכנית, ${y}`, side: "debit", rows: assetRows, pnTo }], notes: [{ title: "הכנסות ריבית", lines: a.lines }, ...ceilingNotes] });
  }

  // Statements.
  const netInterest = interest - assetInterest + effectInterest;
  const net = closing - recognisedClose;
  const salaryLines: [string, number][] = [["עלות שירות שוטף", service]];
  if (past) salaryLines.push(["עלות שירות עבר", past]);
  if (compensation) salaryLines.push(["פיצוי ששולם לעובדים", compensation]);
  if (ev?.type === "settle") salaryLines.push([settlementGain >= 0 ? "רווח מסילוק" : "הפסד מסילוק", -settlementGain]);
  if (otherLong) salaryLines.push(["מדידה מחדש", pn - assetPn]);
  const salary = sum(salaryLines.map((l) => l[1]));
  const oci = otherLong ? 0 : pn - assetPn + effectChange;
  const pl = salary + netInterest;
  const stmtRows: (string | number)[][] = salaryLines.map(([label, v]) => [`הוצאות שכר: ${label}`, sg(v)]);
  stmtRows.push([q.interestInSalary ? "הוצאות שכר: ריבית נטו" : "הוצאות מימון: ריבית נטו", sg(netInterest)]);
  const stmtTables: BkTable[] = [{ title: `רווח והפסד ${y} (הכנסה בסוגריים)`, head: ["סעיף", "סכום"], rows: stmtRows, foot: ["סה״כ רווח והפסד", sg(pl)] }];
  if (!otherLong) {
    const ociRows: (string | number)[][] = [["מדידה מחדש של ההתחייבות", sg(pn)]];
    if (q.assets) ociRows.push(["מדידה מחדש של הנכסים", sg(-assetPn)]);
    if (effectChange) ociRows.push(["שינוי בהשפעת התקרה", sg(effectChange)]);
    stmtTables.push({ title: `רווח כולל אחר ${y} (רווח בסוגריים)`, head: ["סעיף", "סכום"], rows: ociRows, foot: ["סה״כ OCI", sg(oci)] });
  }
  stmtTables.push({
    title: `מאזן 31.12.${y}`,
    head: ["סעיף", "סכום"],
    rows: q.assets ? [["התחייבות", money(closing)], ["נכסי תכנית", sg(-recognisedClose)]] : [["התחייבות", money(closing)]],
    foot: [net >= 0 ? "התחייבות נטו" : "נכס נטו", money(Math.abs(net))],
  });
  steps.push({ title: "הצגה בדוחות", text: otherLong ? ["בהטבה אחרת לזמן ארוך הכול לרווח והפסד, גם המדידה מחדש (סעיף 156)."] : ["שירות וריבית נטו לרווח והפסד. מדידה מחדש ל-OCI, ואינה עוברת לרווח והפסד לעולם (סעיף 122)."], tables: stmtTables });

  const cash = contributions + companyPaid + compensation + (ev?.type === "settle" && !ev.paidFromAssets ? settledPaid : 0);
  const netOpen = opening - recognisedOpen;
  const journal = entry(`פקודת היומן, ${y}`, [
    [q.interestInSalary ? "הוצאות שכר" : "הוצאות שכר", salary + (q.interestInSalary ? netInterest : 0)],
    ["הוצאות מימון", q.interestInSalary ? 0 : netInterest],
    ["רווח כולל אחר (מדידה מחדש)", oci],
    ["מזומן", -cash],
    [net >= 0 && netOpen >= 0 ? "התחייבות נטו בגין הטבות" : "התחייבות (נכס) נטו בגין הטבות", -(net - netOpen)],
  ]);
  steps.push({ title: "פקודת היומן", journal: [journal] });

  const metrics: CalcMetric[] = [
    { label: net >= 0 ? `התחייבות נטו 31.12.${y}` : `נכס נטו 31.12.${y}`, value: Math.abs(net) },
    { label: `הוצאה ברווח והפסד ${y}`, value: pl },
  ];
  if (!otherLong) metrics.push({ label: oci >= 0 ? "הפסד ב-OCI" : "רווח ב-OCI", value: Math.abs(oci) });
  const resultNotes = ["שיעור ההיוון הוא של אג״ח קונצרני איכותי. שיעור ממשלתי משמש רק כשאין שוק עמוק לקונצרני (סעיף 83)."];
  if (ev && q.assets && q.assets.atEvent === undefined && !settledFromAssets) resultNotes.push("לא הוזן שווי הוגן ביום האירוע, ולכן הריבית אחרי האירוע חושבה על הפתיחה והתנועות בלבד. אם יש שווי הוגן, הזינו אותו.");

  return {
    title: `${otherLong ? "הטבה אחרת לזמן ארוך" : "הטבה מוגדרת"}: שנת ${y}`,
    metrics,
    steps,
    notes: resultNotes,
    summary: { year: y, label: otherLong ? "הטבה אחרת לזמן ארוך" : "הטבה מוגדרת", pl, oci, balance: net },
    detail: { opening, service, past, interest, pn, closing, assetInterest, assetPn, settlementGain, netInterest, oci, pl, net, recognisedClose, effectChange, cash, netOpen } satisfies DbDetail,
  };
}

export type DbDetail = { opening: number; service: number; past: number; interest: number; pn: number; closing: number; assetInterest: number; assetPn: number; settlementGain: number; netInterest: number; oci: number; pl: number; net: number; recognisedClose: number; effectChange: number; cash: number; netOpen: number };

/** A disability benefit that doesn't depend on service: nothing accrues; it is recognised when the event happens (IAS 19.157). */
export function solveDisabilityEvent(q: { year: number; amount: number; happened: boolean }): CalcSolution {
  const v = q.happened ? q.amount : 0;
  return {
    title: "אובדן כושר עבודה שאינו תלוי בוותק",
    metrics: [{ label: `הוצאה ${q.year}`, value: v }],
    steps: [
      {
        title: "מתי מכירים",
        text: q.happened ? ["ההטבה לא תלויה בוותק, ולכן אין צבירה על פני השירות. מכירים בעלות כולה כשהאירוע קורה (סעיף 157)."] : ["ההטבה לא תלויה בוותק, ולכן אין צבירה על פני השירות. האירוע עוד לא קרה, ולכן לא נרשם כלום (סעיף 157)."],
        notes: q.happened ? [{ title: "ההוצאה", lines: [line("עלות ההטבה", undefined, v)] }] : [],
        journal: q.happened ? [entry("פקודת היומן", [["הוצאות שכר", v], ["התחייבות בגין הטבות", -v]])] : [],
      },
    ],
    notes: [],
    summary: { year: q.year, label: "אובדן כושר עבודה", pl: v, oci: 0, balance: v },
  };
}

// ===========================================================================
// Completing a note: every line but one is known, the missing one balances.

export type NoteLines = { opening?: number; service?: number; past?: number; interest?: number; payments?: number; pn?: number; closing?: number };
export type NoteAssets = { opening?: number; interest?: number; contributions?: number; paid?: number; pn?: number; closing?: number };

const OB_LABELS: Record<keyof NoteLines, string> = { opening: "יתרת פתיחה", service: "עלות שירות שוטף", past: "עלות שירות עבר", interest: "עלות ריבית", payments: "תשלומים", pn: "מדידה מחדש", closing: "יתרת סגירה" };
const AS_LABELS: Record<keyof NoteAssets, string> = { opening: "יתרת פתיחה", interest: "הכנסות ריבית", contributions: "הפקדות", paid: "תשלומים מהקרן", pn: "מדידה מחדש", closing: "יתרת סגירה" };

/** The one line missing from a roll-forward. Returns null when not exactly one is missing. */
export function missingLine<K extends string>(lines: Partial<Record<K, number>>, keys: K[]) {
  const blanks = keys.filter((k) => lines[k] === undefined);
  return blanks.length === 1 ? blanks[0] : null;
}

export function solveNoteYear(q: { year: number; rate?: number; obligation: NoteLines; assets?: NoteAssets; paymentsFromAssetsShare?: boolean }): CalcSolution {
  const ob = { ...q.obligation };
  const steps: CalcStep[] = [];
  const noteLines: BkLine[] = [];
  // A rate gives the interest; interest and an opening balance give the rate.
  let rate = q.rate;
  if (rate !== undefined && ob.interest === undefined && ob.opening !== undefined) {
    ob.interest = ob.opening * rate;
    noteLines.push(line("עלות ריבית", `${money(ob.opening)} × ${pc(rate)}`, ob.interest));
  }
  if (rate === undefined && ob.interest !== undefined && ob.opening) {
    rate = ob.interest / ob.opening;
    noteLines.push({ label: "השיעור שמסתתר בביאור", calc: `${money(ob.interest)} ÷ ${money(ob.opening)}`, value: rate * 100, unit: "%" });
  }
  const obKeys: (keyof NoteLines)[] = ["opening", "service", "past", "interest", "payments", "pn", "closing"];
  const obMissing = missingLine(ob, obKeys.filter((k) => k !== "past"));
  const past = ob.past ?? 0;
  if (obMissing) {
    const v = (k: keyof NoteLines) => ob[k] ?? 0;
    const lines = { opening: v("closing") - v("service") - past - v("interest") + v("payments") - v("pn"), service: v("closing") - v("opening") - past - v("interest") + v("payments") - v("pn"), interest: v("closing") - v("opening") - v("service") - past + v("payments") - v("pn"), payments: v("opening") + v("service") + past + v("interest") + v("pn") - v("closing"), pn: v("closing") - v("opening") - v("service") - past - v("interest") + v("payments"), closing: v("opening") + v("service") + past + v("interest") - v("payments") + v("pn") } as Record<string, number>;
    ob[obMissing] = lines[obMissing];
    noteLines.push(line(`${OB_LABELS[obMissing]} (השורה החסרה)`, undefined, ob[obMissing]!, "מה שמשלים את המעגל"));
    if (obMissing === "opening" && rate !== undefined && q.obligation.interest === undefined) {
      // The interest needed the opening: both unknown only through the rate, solved together.
      const known = v("closing") - v("service") - past + v("payments") - v("pn");
      ob.opening = known / (1 + rate);
      ob.interest = ob.opening * rate;
    }
  }
  const o = { opening: ob.opening ?? 0, service: ob.service ?? 0, past, interest: ob.interest ?? 0, payments: ob.payments ?? 0, pn: ob.pn ?? 0, closing: ob.closing ?? 0 };
  const rollRows: BkRoll["rows"] = [{ label: `יתרת פתיחה 31.12.${q.year - 1}`, value: o.opening, kind: "balance" }, { label: "עלות שירות שוטף", value: o.service }];
  if (past) rollRows.push({ label: "עלות שירות עבר", value: past });
  rollRows.push({ label: "עלות ריבית", value: o.interest }, { label: "תשלומים", value: -o.payments }, { label: "מדידה מחדש", value: o.pn, kind: "pn" }, { label: `יתרת סגירה 31.12.${q.year}`, value: o.closing, kind: "balance" });
  steps.push({ title: "משלימים את מעגל ההתחייבות", text: ["בכל מעגל נעלם אחד הוא השורה שמאזנת."], rolls: [{ title: `התחייבות, ${q.year}`, rows: rollRows }], notes: noteLines.length ? [{ title: "מה חישבנו", lines: noteLines }] : [] });

  let aOut = { opening: 0, interest: 0, contributions: 0, paid: 0, pn: 0, closing: 0 };
  if (q.assets) {
    const a = { ...q.assets };
    const lines: BkLine[] = [];
    if (a.interest === undefined && rate !== undefined && a.opening !== undefined) {
      a.interest = a.opening * rate;
      lines.push(line("הכנסות ריבית", `${money(a.opening)} × ${pc(rate)}`, a.interest, "באותו שיעור כמו ההתחייבות"));
    }
    const asKeys: (keyof NoteAssets)[] = ["opening", "interest", "contributions", "paid", "pn", "closing"];
    const miss = missingLine(a, asKeys);
    if (miss) {
      const v = (k: keyof NoteAssets) => a[k] ?? 0;
      const sol = { opening: v("closing") - v("interest") - v("contributions") + v("paid") - v("pn"), interest: v("closing") - v("opening") - v("contributions") + v("paid") - v("pn"), contributions: v("closing") - v("opening") - v("interest") + v("paid") - v("pn"), paid: v("opening") + v("interest") + v("contributions") + v("pn") - v("closing"), pn: v("closing") - v("opening") - v("interest") - v("contributions") + v("paid"), closing: v("opening") + v("interest") + v("contributions") - v("paid") + v("pn") } as Record<string, number>;
      a[miss] = sol[miss];
      lines.push(line(`${AS_LABELS[miss]} (השורה החסרה)`, undefined, a[miss]!, "מה שמשלים את המעגל"));
    }
    aOut = { opening: a.opening ?? 0, interest: a.interest ?? 0, contributions: a.contributions ?? 0, paid: a.paid ?? 0, pn: a.pn ?? 0, closing: a.closing ?? 0 };
    steps.push({
      title: "משלימים את מעגל הנכסים",
      rolls: [
        {
          title: `נכסי תכנית, ${q.year}`,
          side: "debit",
          rows: [
            { label: `שווי הוגן 31.12.${q.year - 1}`, value: aOut.opening, kind: "balance" },
            { label: "הכנסות ריבית", value: aOut.interest },
            { label: "הפקדות", value: aOut.contributions },
            { label: "תשלומים מהקרן", value: -aOut.paid },
            { label: "מדידה מחדש", value: aOut.pn, kind: "pn" },
            { label: `שווי הוגן 31.12.${q.year}`, value: aOut.closing, kind: "balance" },
          ],
        },
      ],
      notes: lines.length ? [{ title: "מה חישבנו", lines }] : [],
    });
  }
  const netInterest = o.interest - aOut.interest;
  const pl = o.service + past + netInterest;
  const oci = o.pn - aOut.pn;
  const net = o.closing - aOut.closing;
  steps.push({
    title: "הצגה בדוחות",
    tables: [
      { title: `רווח והפסד ${q.year}`, head: ["סעיף", "סכום"], rows: [["הוצאות שכר", money(o.service + past)], ["הוצאות מימון: ריבית נטו", sg(netInterest)]], foot: ["סה״כ", sg(pl)] },
      { title: `רווח כולל אחר ${q.year} (רווח בסוגריים)`, head: ["סעיף", "סכום"], rows: [["מדידה מחדש של ההתחייבות", sg(o.pn)], ["מדידה מחדש של הנכסים", sg(-aOut.pn)]], foot: ["סה״כ OCI", sg(oci)] },
    ],
  });
  return {
    title: `השלמת ביאור: שנת ${q.year}`,
    metrics: [{ label: `התחייבות נטו 31.12.${q.year}`, value: net }, { label: "הוצאה ברווח והפסד", value: pl }, { label: oci >= 0 ? "הפסד ב-OCI" : "רווח ב-OCI", value: Math.abs(oci) }],
    steps,
    notes: [],
    summary: { year: q.year, label: "הטבה מוגדרת (ביאור)", pl, oci, balance: net },
    detail: { ...o, assetInterest: aOut.interest, assetPn: aOut.pn, closingAssets: aOut.closing, rate },
  };
}

// ===========================================================================
// Defined contribution.

export type DcPlan = { name: string; expense: number; calc: string; paid: number };

export function solveDcPlans(q: { year: number; plans: DcPlan[] }): CalcSolution {
  const expense = sum(q.plans.map((p) => p.expense));
  const paid = sum(q.plans.map((p) => p.paid));
  const gap = expense - paid;
  return {
    title: `הפקדה מוגדרת: שנת ${q.year}`,
    metrics: [{ label: `הוצאה ${q.year}`, value: expense }, { label: gap >= 0 ? "התחייבות במאזן" : "נכס (הפקדה מראש)", value: Math.abs(gap) }],
    steps: [
      {
        title: "ההוצאה היא ההפקדה",
        text: ["החברה מחויבת רק להפקיד, והסיכון על העובד. אין אקטואר ואין היוון (סעיף 51)."],
        notes: [{ title: "ההפקדה לכל הסדר", lines: q.plans.map((p) => line(p.name, p.calc, p.expense)) }],
      },
      {
        title: "המאזן והרישום",
        tables: [{ head: ["הסדר", "הוצאה", "הועבר", "יתרה"], rows: q.plans.map((p) => [p.name, money(p.expense), money(p.paid), sg(p.expense - p.paid)]), foot: ["סה״כ", money(expense), money(paid), sg(gap)] }],
        journal: [entry("פקודת היומן", [["הוצאות שכר", expense], ["מזומן", -paid], [gap >= 0 ? "התחייבות להפקדה" : "הוצאות מראש", -gap]])],
      },
    ],
    notes: ["חלק העובד בהפקדה אינו הוצאה של החברה."],
    summary: { year: q.year, label: "הפקדה מוגדרת", pl: expense, oci: 0, balance: gap },
  };
}

// ===========================================================================
// Short-term benefits: paid absences.

export type ShortGrade = { name: string; dayCost: number; dayCostCalc?: string; entitlement: number; carried: number[]; years: number };
/** `useShare` / `nextShare`: expected use as a share of the balance, when the question gives it so. */
export type OpeningRow = { name: string; grade: number; staff: number; use: number; useShare?: number; leaves: boolean; dayCost?: number };
export type ActualRow = { name: string; grade: number; staff: number; use: number; leaves: boolean; nextUse?: number; nextShare?: number; nextLeaves?: boolean; dayCostPaid?: number; dayCostClose?: number };
export type AbsenceInput = { year: number; order: "lifo" | "fifo"; /** The share of the balance a leaver is paid: 0 non-vesting, 1 vesting. */ vest: number; grades: ShortGrade[]; opening: OpeningRow[]; actual: ActualRow[] };

/** Carried days taken from the balance when `use` days are used: LIFO only past the new entitlement; FIFO from the first day. */
const fromBalance = (order: AbsenceInput["order"], balance: number, use: number, entitlement: number) => (order === "lifo" ? Math.min(balance, Math.max(0, use - entitlement)) : Math.min(balance, use));

export function solveAbsences(q: AbsenceInput) {
  const openRows = q.opening.map((r) => {
    const g = q.grades[r.grade];
    const balance = sum(g.carried.slice(0, g.years));
    const extra = r.useShare !== undefined ? balance * r.useShare : fromBalance(q.order, balance, r.use, g.entitlement);
    const perHead = r.leaves ? extra + q.vest * (balance - extra) : extra;
    const cost = r.dayCost ?? g.dayCost;
    return { ...r, balance, extra, perHead, cost, amount: r.staff * perHead * cost };
  });
  const actRows = q.actual.map((r) => {
    const g = q.grades[r.grade];
    const balance = sum(g.carried.slice(0, g.years));
    // How the use eats the carried layers (newest first in the data): LIFO newest first, past the entitlement; FIFO oldest first, from the first day.
    let left = fromBalance(q.order, balance, r.use, g.entitlement);
    const alive = g.carried.map((d, k) => (k < g.years ? d : 0));
    const usedByLayer = alive.map(() => 0);
    const order = alive.map((_, k) => (q.order === "lifo" ? k : alive.length - 1 - k));
    for (const k of order) {
      const u = Math.min(alive[k], left);
      usedByLayer[k] = u;
      left -= u;
    }
    const fromCarried = sum(usedByLayer);
    const ownUsed = r.use - fromCarried;
    const remaining = balance - fromCarried;
    const payout = r.leaves ? q.vest * remaining : 0;
    const ownLeft = r.leaves ? 0 : Math.max(0, g.entitlement - ownUsed);
    const oldLeft = r.leaves ? 0 : sum(alive.map((d, k) => (k + 1 < g.years ? d - usedByLayer[k] : 0)));
    const carryOut = ownLeft + oldLeft;
    const lapsed = r.leaves ? remaining - payout : remaining - oldLeft;
    const paidCost = r.dayCostPaid ?? g.dayCost;
    const paidDays = r.use + payout;
    const closeCost = r.dayCostClose ?? g.dayCost;
    const planned = r.nextShare !== undefined ? carryOut * r.nextShare : r.nextUse === undefined ? carryOut : fromBalance(q.order, carryOut, r.nextUse, g.entitlement);
    const closeDays = r.leaves ? 0 : r.nextLeaves ? planned + q.vest * (carryOut - planned) : planned;
    return { ...r, balance, fromCarried, remaining, payout, ownLeft, oldLeft, carryOut, lapsed, paidCost, paidDays, paid: r.staff * paidDays * paidCost, closeCost, closeDays, closing: r.staff * closeDays * closeCost };
  });
  const opening = sum(openRows.map((r) => r.amount));
  const paid = sum(actRows.map((r) => r.paid));
  const closing = sum(actRows.map((r) => r.closing));
  return { openRows, actRows, opening, paid, closing, expense: closing - opening + paid };
}

export function solveAbsenceBenefit(q: AbsenceInput): CalcSolution {
  const s = solveAbsences(q);
  const orderName = q.order === "lifo" ? "LIFO: קודם הימים של השנה, ורק אחר כך הצבורים" : "FIFO: קודם הימים הצבורים";
  const vestName = q.vest === 1 ? "מבשילה: עוזב מקבל תשלום על היתרה" : q.vest === 0 ? "לא מבשילה: עוזב מאבד את היתרה" : `מבשילה בחלקה: עוזב מקבל ${pc(q.vest)} מהיתרה`;
  const steps: CalcStep[] = [
    {
      title: "סיווג, ועלות יום",
      text: [`היעדרות נצברת, ${vestName}. סדר הניצול ${orderName}. מפרישים רק על מה שיעלה כסף מעבר לזכאות של אותה שנה, ובלי היוון.`],
      notes: [{ title: "עלות יום", lines: q.grades.map((g) => line(g.name, g.dayCostCalc, g.dayCost)) }],
    },
    {
      title: `יתרת פתיחה, לפי הצפי ב-31.12.${q.year - 1}`,
      tables: [
        {
          head: ["קבוצה", "עובדים", "ניצול צפוי", "יתרה לעובד", "ימים בהפרשה לעובד", "עלות יום", "הפרשה"],
          rows: s.openRows.map((r) => [r.name, r.staff, nf(r.use, 2), nf(r.balance, 2), nf(r.perHead, 2), d2(r.cost), money(r.amount)]),
          foot: ["סה״כ", "", "", "", "", "", money(s.opening)],
        },
      ],
    },
    {
      title: `תשלומים ${q.year}, לפי מה שקרה`,
      tables: [
        {
          head: ["קבוצה", "עובדים", "ניצול", "מהצבורים", "תשלום בעזיבה", "ימים בתשלום לעובד", "עלות יום", "תשלום"],
          rows: s.actRows.map((r) => [r.name, r.staff, nf(r.use, 2), nf(r.fromCarried, 2), nf(r.payout, 2), nf(r.paidDays, 2), d2(r.paidCost), money(r.paid)]),
          foot: ["סה״כ", "", "", "", "", "", "", money(s.paid)],
        },
      ],
    },
    {
      title: `יתרת סגירה 31.12.${q.year}, אחרי ניצול ופקיעה`,
      text: ["מי שעזב לא בהפרשה. לנשארים: מה שנשאר מהשנה, ומה שעוד לא פקע, לפי הצפי לשנה הבאה. אם אין צפי, מניחים ניצול מלא."],
      tables: [
        {
          head: ["קבוצה", "עובדים", "יתרה לעובד", "פקע לעובד", "ימים בהפרשה לעובד", "עלות יום", "הפרשה"],
          rows: s.actRows.map((r) => [r.name, r.staff, nf(r.carryOut, 2), nf(r.lapsed, 2), nf(r.closeDays, 2), d2(r.closeCost), money(r.closing)]),
          foot: ["סה״כ", "", "", "", "", "", money(s.closing)],
        },
      ],
    },
    {
      title: "טבלת התנועה, והרישום",
      text: ["ההוצאה היא השורה החסרה."],
      rolls: [
        {
          title: `הפרשה, ${q.year}`,
          pnTo: "",
          rows: [
            { label: `יתרת פתיחה 31.12.${q.year - 1}`, value: s.opening, kind: "balance" },
            { label: `הוצאות שכר ${q.year}`, value: s.expense, note: "השורה החסרה" },
            { label: `תשלומים ${q.year}`, value: -s.paid },
            { label: `יתרת סגירה 31.12.${q.year}`, value: s.closing, kind: "balance" },
          ],
        },
      ],
      journal: [entry("פקודת היומן", [["הוצאות שכר", s.expense], ["מזומן", -s.paid], ["הפרשה לחופשה ומחלה", -(s.closing - s.opening)]])],
    },
  ];
  const leavers = q.actual.filter((r) => r.leaves).length;
  return {
    title: `היעדרות נצברת: שנת ${q.year}`,
    metrics: [{ label: `הוצאה ${q.year}`, value: s.expense }, { label: `הפרשה 31.12.${q.year}`, value: s.closing }],
    steps,
    notes: leavers && q.vest === 0 ? ["היעדרות לא מבשילה: מי שעזב לא משולם על היתרה שלו, והיא פשוט יורדת."] : [],
    summary: { year: q.year, label: "היעדרות נצברת", pl: s.expense, oci: 0, balance: s.closing },
    detail: s,
  };
}

/** A non-accumulating absence: an expense when it happens, nothing carried (IAS 19.18). */
export function solveNonAccumulating(q: { year: number; days: number; dayCost: number; dayCostCalc?: string; payShare: number; paidBySomeoneElse?: boolean }): CalcSolution {
  const expense = q.paidBySomeoneElse ? 0 : q.days * q.dayCost * q.payShare;
  return {
    title: `היעדרות לא נצברת: שנת ${q.year}`,
    metrics: [{ label: `הוצאה ${q.year}`, value: expense }, { label: "הפרשה במאזן", value: 0 }],
    steps: [
      {
        title: "מכירים כשזה קורה",
        text: [q.paidBySomeoneElse ? "הביטוח הלאומי משלם, ולכן אין לחברה הוצאה." : "מה שלא נוצל לא עובר הלאה, ולכן אין הפרשה. ההוצאה היא מה ששולם על הימים שנוצלו."],
        notes: q.paidBySomeoneElse ? [] : [{ title: "ההוצאה", lines: [...(q.dayCostCalc ? [line("עלות יום", q.dayCostCalc, q.dayCost)] : []), line("הוצאה", `${nf(q.days, 2)} × ${d2(q.dayCost)}${q.payShare !== 1 ? ` × ${pc(q.payShare)}` : ""}`, expense)] }],
        journal: expense ? [entry("פקודת היומן", [["הוצאות שכר", expense], ["מזומן", -expense]])] : [],
      },
    ],
    notes: [],
    summary: { year: q.year, label: "היעדרות לא נצברת", pl: expense, oci: 0, balance: 0 },
  };
}

/** A bonus or profit share: a present obligation at year end, measured with what it carries, undiscounted (IAS 19.19). */
export function solveBonus(q: { year: number; obligation: boolean; base: number; baseCalc: string; onCost: number; stayShare: number; opening: number; paid: number }): CalcSolution {
  if (!q.obligation) {
    return {
      title: `בונוס: שנת ${q.year}`,
      metrics: [{ label: `הפרשה 31.12.${q.year}`, value: 0 }],
      steps: [{ title: "יש מחויבות?", text: ["אין מחויבות משפטית, אין נוהג שיוצר מחויבות, ואין מועד שבו החברה כבר לא יכולה לחזור בה. לכן לא מכירים בהפרשה בשנה הזו (סעיף 19)."] }],
      notes: [],
      summary: { year: q.year, label: "בונוס", pl: 0, oci: 0, balance: 0 },
    };
  }
  const closing = q.base * (1 + q.onCost) * q.stayShare;
  const expense = closing - q.opening + q.paid;
  return {
    title: `בונוס: שנת ${q.year}`,
    metrics: [{ label: `הפרשה 31.12.${q.year}`, value: closing }, { label: `הוצאה ${q.year}`, value: expense }],
    steps: [
      {
        title: "ההפרשה בסוף השנה",
        text: ["יש מחויבות, משפטית או מנוהג, בגין השירות של השנה. מודדים את מה שישולם, עם מה שנלווה אליו, בלי היוון."],
        notes: [
          {
            title: "מדידה",
            lines: [line("הבונוס", q.baseCalc, q.base), ...(q.onCost ? [line("עם התוספות", `${money(q.base)} × ${b(q.onCost)}`, q.base * (1 + q.onCost))] : []), ...(q.stayShare !== 1 ? [line("רק מי שצפוי לזכות", `${money(q.base * (1 + q.onCost))} × ${pc(q.stayShare)}`, closing)] : [])],
          },
        ],
      },
      {
        title: "טבלת התנועה, והרישום",
        rolls: [
          {
            title: `הפרשה לבונוס, ${q.year}`,
            pnTo: "",
            rows: [
              { label: `יתרת פתיחה 31.12.${q.year - 1}`, value: q.opening, kind: "balance" },
              { label: `הוצאות שכר ${q.year}`, value: expense, note: "השורה החסרה" },
              { label: `תשלומים ${q.year}`, value: -q.paid },
              { label: `יתרת סגירה 31.12.${q.year}`, value: closing, kind: "balance" },
            ],
          },
        ],
        journal: [entry("פקודת היומן", [["הוצאות שכר", expense], ["מזומן", -q.paid], ["הפרשה לבונוס", -(closing - q.opening)]])],
      },
    ],
    notes: [],
    summary: { year: q.year, label: "בונוס", pl: expense, oci: 0, balance: closing },
  };
}

// ===========================================================================
// Termination benefits.

export type TermInput = {
  year: number;
  /** Whether recognition has happened by the report date: the offer can no longer be withdrawn, or a restructuring is recognised under IAS 37. */
  recognised: boolean;
  offer: boolean;
  heads: number;
  amount: number;
  /** Discounted only when paid more than 12 months after the year end. */
  yearsToPay?: number;
  rate?: number;
  /** A top-up for those who keep working: service pay, not a termination benefit. */
  stay?: { extra: number; stayers: number; serviceMonths: number; monthsElapsed: number };
};

export function solveTermination(q: TermInput): CalcSolution {
  if (!q.recognised) {
    return {
      title: `הטבת פיטורין: שנת ${q.year}`,
      metrics: [{ label: `הפרשה 31.12.${q.year}`, value: 0 }],
      steps: [
        {
          title: "מתי מכירים",
          text: ["מכירים במוקדם מבין שני מועדים: כשהחברה כבר לא יכולה לחזור בה מההצעה, וכשהיא מכירה בעלויות ארגון מחדש לפי IAS 37 (סעיף 165). עד תאריך הדוח אף אחד מהם לא קרה, ולכן לא נרשם כלום בשנה הזו."],
        },
      ],
      notes: [],
      summary: { year: q.year, label: "הטבת פיטורין", pl: 0, oci: 0, balance: 0 },
    };
  }
  const undiscounted = q.heads * q.amount;
  const discount = (q.yearsToPay ?? 0) > 1 && q.rate !== undefined;
  const provision = discount ? pv(undiscounted, q.rate!, q.yearsToPay!) : undiscounted;
  const lines: BkLine[] = [line(q.offer ? "מי שצפוי לקבל את ההצעה × הסכום" : "כל המושפעים × הסכום", `${nf(q.heads, 2)} × ${money(q.amount)}`, undiscounted, q.offer ? "לפי מספר העובדים שצפויים לקבל את ההצעה (סעיף 170)" : "מה שההחלטה נותנת לכולם, לא משנה מי יישאר")];
  if (discount) lines.push(line("היוון", `${money(undiscounted)} ÷ ${b(q.rate!)}^${yrs(q.yearsToPay!)}`, provision, "משולם יותר מ-12 חודשים אחרי סוף השנה (סעיף 169)"));
  const steps: CalcStep[] = [
    {
      title: "ההפרשה",
      text: ["ההטבה נולדה מההחלטה לסיים את ההעסקה, ולא מהעבודה. לכן אין שיוך לשנות שירות, והכול מוכר במועד ההכרה."],
      notes: [{ title: "מדידה", lines }],
    },
  ];
  let stayAccrued = 0;
  if (q.stay) {
    const { extra, stayers, serviceMonths, monthsElapsed } = q.stay;
    const totalExtra = stayers * extra;
    stayAccrued = (totalExtra * monthsElapsed) / serviceMonths;
    steps.push({
      title: "התוספת למי שממשיך לעבוד",
      text: ["היא מותנית בעבודה עתידית, ולכן היא שכר על שירות, לא הטבת פיטורין. נפרסת על תקופת השירות (סעיף 162)."],
      notes: [
        {
          title: "הפריסה",
          lines: [
            line("התוספת הכוללת", `${nf(stayers, 2)} × ${money(extra)}`, totalExtra),
            line(`החלק של ${q.year}`, `${money(totalExtra)} × ${monthsElapsed}/${serviceMonths}`, stayAccrued),
            line("יוכר בהמשך", undefined, totalExtra - stayAccrued),
          ],
        },
      ],
    });
  }
  const total = provision + stayAccrued;
  steps.push({
    title: "פקודת היומן",
    journal: [entry(`31.12.${q.year}`, [["הוצאות שכר: הטבת פיטורין", provision], ...(stayAccrued ? ([["הוצאות שכר: תוספת על שירות", stayAccrued]] as [string, number][]) : []), ["התחייבות בגין פיטורין", -total]])],
  });
  return {
    title: `הטבת פיטורין: שנת ${q.year}`,
    metrics: [{ label: "הפרשה לפיטורין", value: provision }, ...(q.stay ? [{ label: `תוספת שהוכרה ב-${q.year}`, value: stayAccrued }] : []), { label: "סה״כ הוצאה", value: total }],
    steps,
    notes: ["פיצול שונה בין עוזבים לנשארים לא משנה את הסכום הבסיסי."],
    summary: { year: q.year, label: "הטבת פיטורין", pl: total, oci: 0, balance: total },
  };
}

/** What a published note hides: the step that opens a solution when the question gives one. */
export function withNoteStep(sol: CalcSolution, lines: BkLine[]): CalcSolution {
  if (!lines.length) return sol;
  return { ...sol, steps: [{ title: "מה הביאור מסתיר", text: ["קודם מחלצים מהביאור את מה שהשאלה לא אומרת במפורש."], notes: [{ title: "מהביאור", lines }] }, ...sol.steps] };
}
