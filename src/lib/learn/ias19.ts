/**
 * Employee benefits (IAS 19), as pure functions: the tools every question
 * uses (present value, interest for part of a year, the roll-forward and its
 * balancing line), the five-step measurement of a defined benefit obligation,
 * how a benefit is attributed to years of service, a year with an amendment
 * in its middle, settlement against an unexpected retirement, plan assets and
 * the asset ceiling, where each line of the roll-forward is reported, and the
 * two other kinds of benefit (other long-term, termination). No rounding
 * inside: every figure the lessons show is derived from these.
 *
 * Signs: an obligation and the amounts that add to it are positive; payments
 * are positive and reduce it. A P.N. (remeasurement) of the obligation is
 * positive when it is a loss (the obligation grew more than explained); of
 * plan assets, positive when it is a gain (the assets earned more than the
 * interest income).
 */

/** The value today of an amount paid in n years, discounted at i. */
export const pv = (fv: number, i: number, n: number) => fv / (1 + i) ** n;

/** What an amount paid in n years is worth at each year on the way to today: index k is k years from today (index n is the amount itself). */
export const pvPath = (fv: number, i: number, n: number) => Array.from({ length: n + 1 }, (_, k) => pv(fv, i, n - k));

/** Employees expected to stay (and receive): headcount × (1 − the share expected to leave). */
export const expectedHeads = (heads: number, leaving: number) => heads * (1 - leaving);

/** The rate for m months of a year whose rate is i: compound, not i × m/12 (IAS 19.123). */
export const partRate = (i: number, months: number) => (1 + i) ** (months / 12) - 1;

/** Interest on a balance for m months. */
export const partInterest = (balance: number, i: number, months: number) => balance * partRate(i, months);

/** Simple (wrong) interest for part of a year — what a learner is tempted to use. */
export const simplePart = (i: number, months: number) => (i * months) / 12;

// ---------------------------------------------------------------------------
// The roll-forward.

/** The lines of a year's roll-forward of an obligation. */
export type RollLines = {
  opening: number;
  interest: number;
  service: number;
  /** Past service cost (an amendment). */
  pastService: number;
  /** Benefits paid, positive. */
  payments: number;
  /** The obligation settled away in a settlement (what was in the books for it), positive. */
  settled: number;
  /** The remeasurement, positive for a loss. */
  pn: number;
  closing: number;
};
export type RollKey = keyof RollLines;

/** The one unknown of a roll-forward, from all the others: opening + interest + service + past − payments − settled + P.N. = closing. */
export function rollForward(known: Partial<RollLines>, unknown: RollKey): RollLines {
  const v = { opening: 0, interest: 0, service: 0, pastService: 0, payments: 0, settled: 0, pn: 0, closing: 0, ...known };
  const sign: Record<RollKey, number> = { opening: 1, interest: 1, service: 1, pastService: 1, payments: -1, settled: -1, pn: 1, closing: -1 };
  const rest = (Object.keys(sign) as RollKey[]).filter((k) => k !== unknown).reduce((s, k) => s + sign[k] * v[k], 0);
  return { ...v, [unknown]: -rest / sign[unknown] };
}

/** The balancing line, P.N.: closing − opening − interest − service − past + payments + settled. */
export const balancingPN = (r: Omit<RollLines, "pn">) => rollForward(r, "pn").pn;

// ---------------------------------------------------------------------------
// Measurement at one date: the five steps.

export type FiveSteps = {
  /** ① The benefit for one year of service, at the salary expected at payment. */
  perYear: number;
  /** ② Years of service counted to the measurement date. */
  years: number;
  /** ③ Employees expected to receive it: headcount × probability. */
  heads: number;
  /** ④ Years from the measurement date to payment — not the years of service. */
  n: number;
  /** ⑤ The high-quality corporate bond yield at the measurement date (IAS 19.83). */
  i: number;
};

/** ① × ② × ③ ÷ (1+i)^n. */
export const measure = (s: FiveSteps) => pv(s.perYear * s.years * s.heads, s.i, s.n);

/** A salary grown by g a year for k years. */
export const grown = (salary: number, g: number, k: number) => salary * (1 + g) ** k;

/** A salary raised once a year by each rate in turn (an uneven path of raises). */
export const raised = (salary: number, rates: number[]) => rates.reduce((s, g) => s * (1 + g), salary);

// ---------------------------------------------------------------------------
// Attribution to years of service.

/** The benefit a plan's formula gives for t years of service. */
export type BenefitFormula = (years: number) => number;

/** A formula in tiers: an amount per year up to each limit, the last tier open-ended. */
export const tiered =
  (tiers: { upTo?: number; perYear: number }[]): BenefitFormula =>
  (t) => {
    let left = t;
    let from = 0;
    let total = 0;
    for (const tier of tiers) {
      const span = tier.upTo === undefined ? left : Math.min(left, tier.upTo - from);
      if (span <= 0) break;
      total += span * tier.perYear;
      left -= span;
      from += span;
    }
    return total;
  };

/** Whether service in later years leads to a materially higher benefit than in early years: some later year earns more than the first (IAS 19.73). */
export function backLoaded(f: BenefitFormula, years: number) {
  const first = f(1) - f(0);
  for (let t = 2; t <= Math.ceil(years); t++) if (f(t) - f(t - 1) > first + 1e-9) return true;
  return false;
}

export type Attribution = {
  /** The benefit at expected service, after any cap. */
  total: number;
  /** The years over which it accrues: the expected service, cut short where a cap is reached. */
  window: number;
  /** The benefit for one year of service in the window (straight line), or undefined under the plan's formula. */
  perYear?: number;
  method: "formula" | "straight";
};

/**
 * How a benefit is attributed: under the plan's formula (IAS 19.71), unless
 * later years earn materially more — then straight line (IAS 19.73). A cap
 * cuts the benefit at the cap and shortens the window to the year it is
 * reached; the amount is never shrunk. Years before service starts to count
 * are not passed in at all: `expected` counts from the first year that does.
 */
export function attribution(f: BenefitFormula, expected: number, cap = Infinity): Attribution {
  const uncapped = f(expected);
  const total = Math.min(uncapped, cap);
  let window = expected;
  if (uncapped > cap) {
    window = 0;
    while (f(window) < cap - 1e-9) window++;
  }
  if (!backLoaded(f, expected)) return { total, window, method: "formula" };
  return { total, window, perYear: total / window, method: "straight" };
}

/** What is accrued after `served` years of service that counts. */
export function accrued(a: Attribution, f: BenefitFormula, served: number, cap = Infinity) {
  if (a.method === "formula") return Math.min(f(served), cap);
  return a.perYear! * Math.min(served, a.window);
}

/** What is accrued at the end of each year 1..years, both ways: under the plan's formula (capped) and on a straight line over the window. */
export function accrualPath(f: BenefitFormula, expected: number, cap = Infinity, years = expected) {
  const a = attribution(f, expected, cap);
  const straight = a.total / a.window;
  return Array.from({ length: years }, (_, k) => ({ year: k + 1, formula: Math.min(f(k + 1), cap), straight: straight * Math.min(k + 1, a.window) }));
}

// ---------------------------------------------------------------------------
// A year of the defined benefit obligation, with an amendment in its middle.

export type AmendedYear = {
  opening: number;
  /** Rate at the start of the year: interest and service up to the amendment. */
  iStart: number;
  /** Rate on the amendment date: past service both ways, and interest and service after it. */
  iAmend: number;
  /** Rate at the end of the year: the closing balance. */
  iEnd: number;
  /** Months from the start of the year to the amendment (0–12). */
  months: number;
  /** The benefit accrued for one year of service, times expected heads, before and after the amendment. */
  oldPerYear: number;
  newPerYear: number;
  /** Years of service at the start of the year. */
  servedAtStart: number;
  /** Years from the end of the year to payment. */
  nEnd: number;
  /** Payments in the year: amount and month paid (months from the start of the year). */
  payments?: { amount: number; month: number }[];
  /** The closing balance when given (new data at year end); otherwise measured on the new terms at iEnd. */
  closing?: number;
};

export type AmendedYearResult = {
  serviceBefore: number;
  serviceAfter: number;
  service: number;
  pastBefore: number;
  pastAfter: number;
  pastService: number;
  interestBefore: number;
  interestOnPayments: number;
  interestAfter: number;
  interest: number;
  payments: number;
  closing: number;
  pn: number;
};

/**
 * Split the year at the amendment: service of each sub-period on its terms,
 * discounted from the end of the sub-period to payment, at the rate of its
 * start; past service = the obligation after less before, both on the
 * amendment date at its rate (IAS 19.102–103); interest on the opening to the
 * amendment and on the balance after past service from it, less interest on
 * payments from their date to the end of their period (IAS 19.123).
 */
export function amendedYear(y: AmendedYear): AmendedYearResult {
  const after = 12 - y.months;
  const nAtAmend = y.nEnd + after / 12;
  const serviceBefore = pv((y.oldPerYear * y.months) / 12, y.iStart, nAtAmend);
  const serviceAfter = pv((y.newPerYear * after) / 12, y.iAmend, y.nEnd);
  const servedAtAmend = y.servedAtStart + y.months / 12;
  const pastBefore = pv(y.oldPerYear * servedAtAmend, y.iAmend, nAtAmend);
  const pastAfter = pv(y.newPerYear * servedAtAmend, y.iAmend, nAtAmend);
  const payments = (y.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const interestBefore = partInterest(y.opening, y.iStart, y.months);
  const interestOnPayments = (y.payments ?? []).reduce(
    (s, p) => s + (p.month < y.months ? partInterest(p.amount, y.iStart, y.months - p.month) : partInterest(p.amount, y.iAmend, 12 - p.month)),
    0,
  );
  const interestAfter = partInterest(pastAfter, y.iAmend, after);
  const interest = interestBefore - interestOnPayments + interestAfter;
  const closing = y.closing ?? pv(y.newPerYear * (y.servedAtStart + 1), y.iEnd, y.nEnd);
  const pastService = pastAfter - pastBefore;
  const service = serviceBefore + serviceAfter;
  const pn = balancingPN({ opening: y.opening, interest, service, pastService, payments, settled: 0, closing });
  return { serviceBefore, serviceAfter, service, pastBefore, pastAfter, pastService, interestBefore, interestOnPayments, interestAfter, interest, payments, closing, pn };
}

/** A plain year: no amendment, payments (if any) at year end. */
export function plainYear(y: { opening: number; i: number; perYear: number; servedAtStart: number; nEnd: number; iEnd?: number; payments?: number; closing?: number }) {
  const interest = y.opening * y.i;
  const service = pv(y.perYear, y.i, y.nEnd);
  const closing = y.closing ?? pv(y.perYear * (y.servedAtStart + 1), y.iEnd ?? y.i, y.nEnd);
  const payments = y.payments ?? 0;
  return { interest, service, closing, payments, pn: balancingPN({ opening: y.opening, interest, service, pastService: 0, payments, settled: 0, closing }) };
}

// ---------------------------------------------------------------------------
// Settlement against an unexpected retirement (IAS 19.109–111).

/** A payment outside the plan's terms that ends the obligation: the gain (positive) or loss (negative) goes to profit or loss. */
export const settlementGain = (obligation: number, paid: number) => obligation - paid;

/** A payment under the plan's terms, earlier than expected: no settlement; the gap is a change in estimate, a P.N. in OCI (positive = loss). */
export const retirementPN = (obligation: number, paid: number) => paid - obligation;

// ---------------------------------------------------------------------------
// Plan assets and the asset ceiling.

export type AssetsYear = {
  opening: number;
  /** The obligation's rate(s): interest income uses the same rate and the same split of the year (IAS 19.125). */
  periods: { months: number; i: number }[];
  /** Contributions: amount and month made (months from the start of the year). */
  contributions?: { amount: number; month: number }[];
  /** Benefits paid out of the assets (not those the company paid itself), at year end. */
  paidFromAssets?: number;
  /** Fair value at year end. */
  closing: number;
};

/**
 * Interest income on plan assets: the opening balance, and each contribution
 * from its date, earn interest at the obligation's rate, period by period.
 * A balance carried into the next period earns at that period's rate.
 */
export function assetsInterest(a: Omit<AssetsYear, "closing" | "paidFromAssets">) {
  let balance = a.opening;
  let at = 0;
  let total = 0;
  const parts: number[] = [];
  for (const p of a.periods) {
    const end = at + p.months;
    let part = partInterest(balance, p.i, p.months);
    for (const c of a.contributions ?? []) {
      if (c.month >= at && c.month < end) {
        part += partInterest(c.amount, p.i, end - c.month);
        balance += c.amount;
      }
    }
    parts.push(part);
    total += part;
    at = end;
  }
  return { total, parts };
}

/** The assets' roll-forward; the P.N. balances it and is positive for a gain. */
export function assetsYear(a: AssetsYear) {
  const interest = assetsInterest(a).total;
  const contributions = (a.contributions ?? []).reduce((s, c) => s + c.amount, 0);
  const paid = a.paidFromAssets ?? 0;
  const pn = a.closing - a.opening - interest - contributions + paid;
  return { interest, contributions, paid, pn };
}

/** The net defined benefit liability (positive) or asset (negative), before the ceiling (IAS 19.113). */
export const netLiability = (obligation: number, assets: number) => obligation - assets;

/** A surplus is recognised only up to the ceiling (IAS 19.64): the lower of the surplus and the ceiling; never below zero. */
export const cappedSurplus = (assets: number, obligation: number, ceiling: number) => Math.max(0, Math.min(assets - obligation, ceiling));

/** The plan assets the statements carry: the obligation plus the surplus that may be recognised. */
export const recognisedAssets = (assets: number, obligation: number, ceiling: number) => (assets > obligation ? obligation + cappedSurplus(assets, obligation, ceiling) : assets);

// ---------------------------------------------------------------------------
// Presentation.

export type Destination = "pl" | "oci" | "bs";

/** Where each line of a defined benefit plan goes (IAS 19.120); the same lines of an other long-term benefit all go to profit or loss (IAS 19.156). */
export function destination(line: "service" | "pastService" | "settlement" | "netInterest" | "pnObligation" | "pnAssets" | "ceiling" | "closing", kind: "postEmployment" | "otherLongTerm" = "postEmployment"): Destination {
  if (line === "closing") return "bs";
  if (kind === "otherLongTerm") return "pl";
  return line === "pnObligation" || line === "pnAssets" || line === "ceiling" ? "oci" : "pl";
}

/** A year's effect on the statements: profit or loss (service, past service, net interest — negative is an expense), OCI (negative is a loss), and the net balance. */
export function presentation(x: { service: number; pastService?: number; settlementGain?: number; interestCost: number; interestIncome?: number; pnObligation: number; pnAssets?: number; ceilingEffect?: number; closing: number; assets?: number }) {
  const salary = -(x.service + (x.pastService ?? 0)) + (x.settlementGain ?? 0);
  const netInterest = (x.interestIncome ?? 0) - x.interestCost;
  const oci = -x.pnObligation + (x.pnAssets ?? 0) - (x.ceilingEffect ?? 0);
  return { salary, netInterest, pl: salary + netInterest, oci, total: salary + netInterest + oci, net: x.closing - (x.assets ?? 0) };
}

// ---------------------------------------------------------------------------
// Reverse engineering a note of the year before.

/** The discount rate behind a year's interest cost — only when nothing was paid or changed during the year. Not rounded. */
export const impliedRate = (interestCost: number, opening: number) => interestCost / opening;

/** A share hidden in the note: part ÷ whole (paid from assets ÷ paid, contribution ÷ payroll, past service ÷ obligation before). */
export const impliedShare = (part: number, whole: number) => part / whole;

// ---------------------------------------------------------------------------
// Short-term benefits.

/** A provision for accumulating absences: (days expected to be used + days of expected leavers when vesting) × cost of a day. Not discounted (IAS 19.11, 16). */
export const absenceProvision = (x: { daysUsed: number; daysOfLeavers?: number; vesting: boolean; dayCost: number }) => (x.daysUsed + (x.vesting ? (x.daysOfLeavers ?? 0) : 0)) * x.dayCost;

/** The cost of a day: salary ÷ working days × (1 + employer's on-costs). */
export const dayCost = (salary: number, workingDays: number, onCosts = 0) => (salary / workingDays) * (1 + onCosts);

/**
 * Days carried forward under LIFO: a year's own entitlement is used first,
 * then the carried balance. Returns the carried days used and those left.
 */
export function lifo(x: { carried: number; entitlement: number; used: number }) {
  const fromCarried = Math.max(0, Math.min(x.carried, x.used - x.entitlement));
  const unusedOwn = Math.max(0, x.entitlement - x.used);
  return { fromCarried, carriedLeft: x.carried - fromCarried, unusedOwn };
}

/** The expense of a short-term benefit: the P.N. of its roll-forward, closing − opening + payments. */
export const shortTermExpense = (opening: number, payments: number, closing: number) => closing - opening + payments;

// ---------------------------------------------------------------------------
// Defined contribution.

/** A defined contribution year: the expense is the contribution due for the period's service; what is unpaid at year end is a liability (IAS 19.51). */
export const definedContribution = (payroll: number, rate: number, paid: number) => ({ expense: payroll * rate, liability: payroll * rate - paid });

// ---------------------------------------------------------------------------
// Termination benefits (IAS 19.159–170).

/** The termination benefit: what the decision gives everyone affected, whatever the expected split between leavers and stayers; discounted only when settled more than 12 months after year end (IAS 19.169). */
export const terminationBenefit = (x: { perHead: number; heads: number; yearsToPay?: number; i?: number }) => pv(x.perHead * x.heads, x.i ?? 0, (x.yearsToPay ?? 0) > 1 ? x.yearsToPay! : 0);

/** The four kinds of benefit, by the sorting questions in their order. */
export type BenefitKind = "termination" | "shortTerm" | "postEmployment" | "otherLongTerm";
export function classify(x: { fromDecisionToTerminate: boolean; settledWithin12Months: boolean; afterEmployment: boolean }): BenefitKind {
  if (x.fromDecisionToTerminate) return "termination";
  if (x.settledWithin12Months) return "shortTerm";
  if (x.afterEmployment) return "postEmployment";
  return "otherLongTerm";
}
