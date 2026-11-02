import { balancingPN, partInterest, partRate, pv } from "./ias19";

/**
 * The two exam-level questions of the employee-benefits course, and the
 * solvers behind them: a year of several groups of employees, each with its
 * own grants (one of them added mid-year), and a year whose hidden figures
 * are recovered from last year's note before the two roll-forwards
 * (obligation and plan assets) are built. Pure functions; every figure the
 * lesson shows comes from here.
 */

// ---------------------------------------------------------------------------
// Groups of employees.

/** A grant accrued in equal parts over its window of years (straight line), per head. */
export type Grant = { perYear: number; window: number };

export type Group = {
  id: string;
  heads: number;
  /** Heads at year end, when some left during the year (a change in assumptions: P.N.). */
  headsEnd?: number;
  /** Years of service that count, at the start of the year. */
  served: number;
  /** Years from the end of the year to payment. */
  nEnd: number;
  grants: Grant[];
};

/** What a group's grants have accrued, per head, after `served` years. */
export const accruedOf = (grants: Grant[], served: number) => grants.reduce((s, g) => s + g.perYear * Math.min(Math.max(served, 0), g.window), 0);

/** What accrues between two points of service, per head. */
const accrual = (grants: Grant[], from: number, to: number) => accruedOf(grants, to) - accruedOf(grants, from);

export type GroupLine = { id: string; opening: number; serviceBefore: number; serviceAfter: number; service: number; before: number; after: number; pastService: number; closing: number };

export type GroupsYear = {
  groups: Group[];
  /** Rate at the start of the year: the opening, interest and service (up to an amendment). */
  iStart: number;
  /** Rate at year end: the closing balance. */
  iEnd: number;
  /** A grant added part way through the year to some groups, past service included. */
  amendment?: { months: number; iAmend: number; add: Record<string, Grant> };
};

/**
 * One year of several groups: the opening at the start rate; service on the
 * old terms to the amendment (discounted from the amendment date) and on the
 * new ones after it (from year end); past service on the amendment date at
 * its rate; interest on the opening to the amendment and on the obligation
 * after it from there; the closing on year-end data and rate; P.N. balancing.
 */
export function groupsYear(y: GroupsYear) {
  const m = y.amendment?.months ?? 12;
  const iAmend = y.amendment?.iAmend ?? y.iStart;
  const rows: GroupLine[] = y.groups.map((g) => {
    const added = y.amendment?.add[g.id];
    const after = added ? [...g.grants, added] : g.grants;
    const nAmend = g.nEnd + (12 - m) / 12;
    const at = g.served + m / 12;
    const opening = pv(g.heads * accruedOf(g.grants, g.served), y.iStart, g.nEnd + 1);
    const serviceBefore = pv(g.heads * accrual(g.grants, g.served, at), y.iStart, nAmend);
    const serviceAfter = m < 12 ? pv(g.heads * accrual(after, at, g.served + 1), iAmend, g.nEnd) : 0;
    const before = pv(g.heads * accruedOf(g.grants, at), iAmend, nAmend);
    const afterBalance = pv(g.heads * accruedOf(after, at), iAmend, nAmend);
    const closing = pv((g.headsEnd ?? g.heads) * accruedOf(after, g.served + 1), y.iEnd, g.nEnd);
    return { id: g.id, opening, serviceBefore, serviceAfter, service: serviceBefore + serviceAfter, before, after: afterBalance, pastService: afterBalance - before, closing };
  });
  const sum = (k: keyof Omit<GroupLine, "id">) => rows.reduce((s, r) => s + r[k], 0);
  const opening = sum("opening");
  const after = sum("after");
  const interestBefore = partInterest(opening, y.iStart, m);
  const interestAfter = m < 12 ? partInterest(after, iAmend, 12 - m) : 0;
  const interest = interestBefore + interestAfter;
  const service = sum("service");
  const pastService = y.amendment ? sum("pastService") : 0;
  const closing = sum("closing");
  return {
    rows,
    opening,
    interestBefore,
    interestAfter,
    interest,
    serviceBefore: sum("serviceBefore"),
    serviceAfter: sum("serviceAfter"),
    service,
    before: sum("before"),
    after,
    pastService,
    closing,
    pn: balancingPN({ opening, interest, service, pastService, payments: 0, settled: 0, closing }),
  };
}

/** A year with no news: service is the balancing line (P.N. is zero), as when a question gives no changes. */
export function serviceByBalance(y: { opening: number; interest: number; closing: number }) {
  return y.closing - y.opening - y.interest;
}

// ---------------------------------------------------------------------------
// The hidden figures of last year's note.

export type Grade = {
  id: string;
  /** Heads during this year (before any leave at its end). */
  heads: number;
  /** Heads on the contribution date of last year — including those who left at its end. */
  headsLastMid: number;
  /** Last year's monthly salary. */
  salaryLast: number;
  /** The raise at the start of every year. */
  raise: number;
};

export type NoteExam = {
  year: number;
  startYear: number;
  retireYear: number;
  grades: Grade[];
  /** Last year's note: what it gives. */
  note: {
    openingLast: number;
    interestLast: number;
    paidLast: number;
    paidFromAssetsLast: number;
    contributionLast: number;
    pastServiceLast: number;
    /** The grade whose benefit last year's amendment raised. */
    amendedLast: string;
    /** This year's openings: last year's closing balances. */
    obligation: number;
    assets: number;
  };
  /** This year: leavers paid at year end, and an amendment at year end raising one grade by a share of last year's raise. */
  leavers: { grade: string; heads: number };
  amendment: { grade: string; ofLast: number };
  /** The contribution's month (months from the start of the year). */
  contributionMonth: number;
  /** The return on the assets above interest income (their P.N.), given. */
  excessReturn: number;
  /** Round the recovered rate (to show what rounding does); otherwise kept exact. */
  roundRate?: number;
};

/** A share of a plan is a round percentage (to 0.1%); a recovered discount rate is not rounded. */
const share = (part: number, whole: number) => Math.round((part / whole) * 1000) / 1000;

export function noteExam(q: NoteExam) {
  const exact = q.note.interestLast / q.note.openingLast;
  const i = q.roundRate !== undefined ? Math.round(exact / q.roundRate) * q.roundRate : exact;
  const fromAssets = share(q.note.paidFromAssetsLast, q.note.paidLast);
  const payrollLast = q.grades.reduce((s, g) => s + g.headsLastMid * g.salaryLast, 0);
  const contributionRate = share(q.note.contributionLast, payrollLast);
  const nEnd = q.retireYear - q.year;
  const servedEnd = q.year - q.startYear + 1;
  const salary = (g: Grade) => g.salaryLast * (1 + g.raise);
  const final = (g: Grade) => salary(g) * (1 + g.raise) ** nEnd;
  // Last year's amendment, on its own date: heads then are this year's, service one year less, payment one year further.
  const amended = q.grades.find((g) => g.id === q.note.amendedLast)!;
  const beforeLast = pv(amended.heads * (servedEnd - 1) * amended.salaryLast * (1 + amended.raise) ** (nEnd + 1), exact, nEnd + 1);
  const addedLast = share(q.note.pastServiceLast, beforeLast);
  const added = (g: Grade) => (g.id === q.note.amendedLast ? addedLast : 0);
  const addedNow = addedLast * q.amendment.ofLast;

  const interest = q.note.obligation * i;
  const serviceBy = q.grades.map((g) => pv(g.heads * final(g) * (1 + added(g)), i, nEnd));
  const service = serviceBy.reduce((s, v) => s + v, 0);
  const leaver = q.grades.find((g) => g.id === q.leavers.grade)!;
  const payments = q.leavers.heads * salary(leaver) * servedEnd;
  const amendGrade = q.grades.find((g) => g.id === q.amendment.grade)!;
  const headsEnd = (g: Grade) => g.heads - (g.id === q.leavers.grade ? q.leavers.heads : 0);
  const pastService = pv(headsEnd(amendGrade) * servedEnd * final(amendGrade) * addedNow, i, nEnd);
  const closingBy = q.grades.map((g) => pv(headsEnd(g) * servedEnd * final(g) * (1 + added(g) + (g.id === q.amendment.grade ? addedNow : 0)), i, nEnd));
  const closing = closingBy.reduce((s, v) => s + v, 0);
  const pn = balancingPN({ opening: q.note.obligation, interest, service, pastService, payments, settled: 0, closing });

  const payroll = q.grades.reduce((s, g) => s + g.heads * salary(g), 0);
  const contribution = contributionRate * payroll;
  const interestOnOpening = q.note.assets * i;
  const interestOnContribution = contribution * partRate(i, 12 - q.contributionMonth);
  const assetsInterest = interestOnOpening + interestOnContribution;
  const paidFromAssets = fromAssets * payments;
  const assetsClosing = q.note.assets + assetsInterest + contribution - paidFromAssets + q.excessReturn;

  return {
    rate: i,
    exactRate: exact,
    fromAssets,
    payrollLast,
    contributionRate,
    beforeLast,
    addedLast,
    addedNow,
    nEnd,
    servedEnd,
    finals: q.grades.map(final),
    salaries: q.grades.map(salary),
    obligation: { opening: q.note.obligation, interest, service, serviceBy, pastService, payments, pn, closing, closingBy },
    assets: { opening: q.note.assets, interestOnOpening, interestOnContribution, interest: assetsInterest, contribution, payroll, paid: paidFromAssets, pn: q.excessReturn, closing: assetsClosing },
    net: closing - assetsClosing,
  };
}

// ---------------------------------------------------------------------------
// The course's two questions (original): their data, and their solutions.

/** Question 1: two departments, two grants, two years. Amounts in shekels. */
export const EXAM_A = {
  firstYear: 2022,
  /** The assembly department: a formula that jumps in later years, with a cap. */
  assembly: {
    early: { upTo: 5, perYear: 1_000 },
    later: { first: 2_000, beyond: 6_000 },
    cap: 40_000,
    rate: 0.06,
    groups: [
      { id: "2016", heads: 4, from: 2016, years: 15 },
      { id: "2018", heads: 6, from: 2018, years: 8 },
      { id: "2020", heads: 10, from: 2020, years: 6 },
      { id: "2022", heads: 3, from: 2022, years: 4 },
    ],
    /** On 1.7 of the second year: a further grant to everyone who will work at least `minYears`, accrued over those years. */
    amendment: { month: 6, grant: 12_000, minYears: 8 },
    /** The rate fell in December of the second year. */
    endRate: 0.05,
  },
  /** The field department: one grant, attributed by the reason the employee will be entitled to it. */
  field: {
    grant: 24_000,
    serviceYears: 12,
    age: 55,
    rate: 0.06,
    groups: [
      { id: "older", heads: 3, from: 2019, ageAtStart: 47, years: 10 },
      { id: "young", heads: 4, from: 2019, ageAtStart: 30, years: 9 },
      { id: "long", heads: 20, from: 2020, ageAtStart: 28, years: 16 },
    ],
    /** Near the end of the second year two of the long group left, and the rate fell. */
    leavers: { group: "long", heads: 2 },
    endRate: 0.05,
  },
};

/** The assembly formula: up to five years, a flat amount a year; beyond, more for the first five and a jump for each further year. */
export const assemblyBenefit = (t: number) => {
  const a = EXAM_A.assembly;
  return t <= a.early.upTo ? a.early.perYear * t : a.later.first * a.early.upTo + a.later.beyond * (t - a.early.upTo);
};

/** How each field employee earns the grant: the years until the first reason (service or age) is met — or never. */
export const fieldWindow = (g: (typeof EXAM_A.field.groups)[number]) => {
  const f = EXAM_A.field;
  const byAge = f.age - g.ageAtStart;
  const window = Math.min(byAge <= g.years ? byAge : Infinity, f.serviceYears <= g.years ? f.serviceYears : Infinity);
  return Number.isFinite(window) ? window : undefined;
};

function assemblyGroups(year: number): Group[] {
  const a = EXAM_A.assembly;
  return a.groups.map((g) => {
    const total = Math.min(assemblyBenefit(g.years), a.cap);
    let window = g.years;
    if (assemblyBenefit(g.years) > a.cap) for (window = 0; assemblyBenefit(window) < a.cap; ) window++;
    return { id: g.id, heads: g.heads, served: year - g.from, nEnd: g.from + g.years - 1 - year, grants: [{ perYear: total / window, window }] };
  });
}

function fieldGroups(year: number, leavers = false): Group[] {
  const f = EXAM_A.field;
  return f.groups.map((g) => {
    const window = fieldWindow(g);
    return {
      id: g.id,
      heads: window === undefined ? 0 : g.heads,
      headsEnd: window !== undefined && leavers && g.id === f.leavers.group ? g.heads - f.leavers.heads : undefined,
      served: year - g.from,
      nEnd: g.from + g.years - 1 - year,
      grants: window === undefined ? [] : [{ perYear: f.grant / window, window }],
    };
  });
}

export function examA() {
  const a = EXAM_A.assembly;
  const y1 = EXAM_A.firstYear;
  const y2 = y1 + 1;
  // Year one: no news, so the closing is measured and service balances.
  const a1 = groupsYear({ groups: assemblyGroups(y1), iStart: a.rate, iEnd: a.rate });
  const add = Object.fromEntries(a.groups.filter((g) => g.years >= a.amendment.minYears).map((g) => [g.id, { perYear: a.amendment.grant / a.amendment.minYears, window: a.amendment.minYears }]));
  const a2 = groupsYear({ groups: assemblyGroups(y2), iStart: a.rate, iEnd: a.endRate, amendment: { months: a.amendment.month, iAmend: a.rate, add } });
  const f = EXAM_A.field;
  const f1 = groupsYear({ groups: fieldGroups(y1), iStart: f.rate, iEnd: f.rate });
  const f2 = groupsYear({ groups: fieldGroups(y2, true), iStart: f.rate, iEnd: f.endRate });
  return {
    assembly: {
      groups: assemblyGroups(y1),
      year1: { ...a1, service: serviceByBalance(a1) },
      year2: a2,
      addedTo: Object.keys(add),
      addedPerYear: a.amendment.grant / a.amendment.minYears,
    },
    field: { groups: fieldGroups(y1), year1: { ...f1, service: serviceByBalance(f1) }, year2: f2 },
  };
}

/** Question 2: a chain of hotels, amounts in thousands of shekels — two roll-forwards, with last year's note hiding the assumptions. */
export const EXAM_B: NoteExam = {
  year: 2024,
  startYear: 2012,
  retireYear: 2031,
  grades: [
    { id: "א", heads: 30, headsLastMid: 35, salaryLast: 16, raise: 0.04 },
    { id: "ב", heads: 60, headsLastMid: 70, salaryLast: 11.5, raise: 0.025 },
    { id: "ג", heads: 200, headsLastMid: 215, salaryLast: 7.5, raise: 0.01 },
  ],
  note: {
    openingLast: 25_857,
    interestLast: 1_164,
    paidLast: 3_690,
    paidFromAssetsLast: 2_952,
    contributionLast: 2_680,
    pastServiceLast: 443,
    amendedLast: "א",
    obligation: 26_787,
    assets: 20_150,
  },
  leavers: { grade: "ג", heads: 20 },
  amendment: { grade: "ב", ofLast: 0.5 },
  contributionMonth: 6,
  excessReturn: 310,
};

export const examB = (roundRate?: number) => noteExam({ ...EXAM_B, roundRate });
