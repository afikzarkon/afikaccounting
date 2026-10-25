/**
 * Finding the unknowns in an inventory question.
 *
 * Three tools: closed forms for the course's recurring patterns (R30, R31), a
 * numeric solver for up to three unknowns anywhere in the model, and a solver
 * for a multi-year statement with question marks (R32). Each one records the
 * equation it used, so the page can show the working, not only the answer.
 */

import { type Method, type Period, type PeriodResult, purchaseCost, valuateChain, type ValuationOptions } from "./inventory";

// ---------------------------------------------------------------------------
// Closed forms.

/** R30: closing inventory from a known gross margin. */
export const gpClosing = (opening: number, purchases: number, netSales: number, gpPct: number) => opening + purchases - netSales * (1 - gpPct);
/** R31א: net sales from cost of sales and the margin. */
export const salesFromGp = (cogs: number, gpPct: number) => cogs / (1 - gpPct);
/** R31ב: a sale's quantity from its cost, under the moving average. */
export const qtyFromCostMA = (cost: number, avgBefore: number) => cost / avgBefore;
/** R31ג: the last sale's quantity from the counted closing units. */
export const lastSaleQty = (available: number, closingUnits: number, otherSales: number) => available - closingUnits - otherSales;
/** R31ו: "sold p% of the year's purchases" with no opening inventory. */
export const purchasesFromSoldPct = (cogs: number, p: number) => cogs / p;
export const closingFromSoldPct = (purchases: number, p: number) => purchases * (1 - p);
/** R31ה: a discount rate from a discount amount. */
export const discountPctFromAmount = (amount: number, qty: number, unitPrice: number) => amount / (qty * unitPrice);
/** R31ד: an unknown purchase price from a known periodic average: (known total + qty·x) / units = avg. */
export const unitPriceFromAvg = (avg: number, knownTotal: number, totalUnits: number, qtyX: number) => (avg * totalUnits - knownTotal) / qtyX;

// ---------------------------------------------------------------------------
// The numeric solver.

export type Ref =
  | { t: "purchase"; year: number; index: number; field: "qty" | "unitPrice" }
  | { t: "sale"; year: number; index: number; field: "qty" | "unitPrice" }
  /** Every discount rule marked `shared` in that year — or, with `allYears`, in every year: one rate for all. */
  | { t: "discountPct"; year: number; allYears?: boolean }
  | { t: "opening"; year: number; field: "units" | "cost" };

export type Metric =
  | "closingUnits"
  | "closingCost"
  | "closingCarrying"
  | "cogs"
  | "grossProfit"
  | "gpPct"
  | "netSales"
  | "purchasesCost"
  | "avgCost"
  | "saleCost"
  | "purchaseDiscount"
  | "purchaseTotal"
  /** One sale's revenue: quantity × price, as "sales in November–December came to 95,200". */
  | "saleRevenue"
  /** Units sold in the whole year. */
  | "soldUnits"
  /** This year's gross margin less last year's, in points (0.02 = two points higher). */
  | "gpPctChange"
  /** A sale's price less last year's (its sale of the same number, else the last): 0 for "at the same price as last year". */
  | "salePriceChange";

export const METRIC_LABEL: Record<Metric, string> = {
  closingUnits: "כמות במלאי הסגירה",
  closingCost: "ערך מלאי הסגירה (עלות)",
  closingCarrying: "מלאי הסגירה בספרים",
  cogs: "עלות המכר",
  grossProfit: "רווח גולמי",
  gpPct: "שיעור הרווח הגולמי",
  netSales: "מכירות נטו",
  purchasesCost: "סך עלות הרכישות",
  avgCost: "עלות ממוצעת ליחידה",
  saleCost: "עלות מכירה מסוימת",
  purchaseDiscount: "הנחה ברכישה מסוימת",
  purchaseTotal: "עלות רכישה מסוימת",
  saleRevenue: "הכנסה ממכירה מסוימת (₪)",
  soldUnits: "יחידות שנמכרו בשנה",
  gpPctChange: "שינוי בשיעור הרווח הגולמי לעומת השנה הקודמת",
  salePriceChange: "מחיר המכירה זהה לשנה הקודמת",
};

export type Unknown = { id: string; label: string; ref: Ref; guess?: number };
export type Known = { year: number; metric: Metric; index?: number; value: number };

export type Equation = {
  unknown: string;
  known: string;
  /** The model is linear on the branch around the answer: a·x + b = target. */
  a: number;
  b: number;
  target: number;
  x: number;
  /** When the known is a margin, it is first turned into the net sales it implies. */
  viaSales?: { cogs: number; gpPct: number; prevGpPct?: number; change?: number };
};

export type SolveResult = {
  ok: boolean;
  values: Record<string, number>;
  equations: Equation[];
  residuals: { known: string; value: number; got: number }[];
  error?: string;
  periods: Period[];
};

const clone = (ps: Period[]): Period[] => JSON.parse(JSON.stringify(ps));
const isPct = (r: Ref) => r.t === "discountPct";

export function getRef(ps: Period[], r: Ref): number {
  const p = ps[r.year];
  switch (r.t) {
    case "purchase":
      return p.purchases[r.index][r.field];
    case "sale":
      return p.sales[r.index][r.field] ?? 0;
    case "opening":
      return p.opening?.[r.field] ?? 0;
    case "discountPct": {
      for (const y of r.allYears ? ps : [p]) for (const x of y.purchases) for (const d of x.discounts ?? []) if ("shared" in d && d.shared) return d.pct;
      return 0;
    }
  }
}

export function setRef(ps: Period[], r: Ref, v: number) {
  const p = ps[r.year];
  switch (r.t) {
    case "purchase":
      p.purchases[r.index][r.field] = v;
      return;
    case "sale":
      p.sales[r.index][r.field] = v;
      return;
    case "opening":
      p.opening = { units: p.opening?.units ?? 0, cost: p.opening?.cost ?? 0, [r.field]: v };
      return;
    case "discountPct":
      for (const y of r.allYears ? ps : [p]) for (const x of y.purchases) for (const d of x.discounts ?? []) if ("shared" in d && d.shared) d.pct = v;
  }
}

export function metricOf(results: PeriodResult[], periods: Period[], k: Known): number {
  const r = results[k.year];
  switch (k.metric) {
    case "saleCost":
      return r.saleCosts[k.index ?? 0] ?? 0;
    // A purchase the question doesn't have contributes nothing; the form reports the bad number.
    case "purchaseDiscount":
    case "purchaseTotal": {
      const p = periods[k.year]?.purchases[k.index ?? 0];
      return p ? purchaseCost(p)[k.metric === "purchaseDiscount" ? "discount" : "total"] : 0;
    }
    case "avgCost":
      return r.avgCost ?? 0;
    case "closingCost":
      return r.closingCostBasis;
    case "saleRevenue": {
      const s = periods[k.year]?.sales[k.index ?? 0];
      return s ? s.qty * (s.unitPrice ?? 0) : 0;
    }
    case "soldUnits":
      return r.soldUnits;
    case "gpPctChange":
      return r.gpPct - (results[k.year - 1]?.gpPct ?? 0);
    case "salePriceChange": {
      const now = periods[k.year]?.sales[k.index ?? 0];
      const prev = periods[k.year - 1]?.sales;
      const then = prev?.[k.index ?? 0] ?? prev?.at(-1);
      return (now?.unitPrice ?? 0) - (then?.unitPrice ?? 0);
    }
    default:
      return r[k.metric];
  }
}

export const knownLabel = (k: Known) =>
  METRIC_LABEL[k.metric] +
  (k.metric === "saleCost" || k.metric === "saleRevenue" ? ` (מכירה ${(k.index ?? 0) + 1})` : k.metric === "purchaseDiscount" || k.metric === "purchaseTotal" ? ` (רכישה ${(k.index ?? 0) + 1})` : "");

/**
 * Solves up to three unknowns from as many known results. Unknowns that one
 * known pins down alone are solved first, one equation at a time, the way a
 * question is worked by hand; whatever is left is solved together by Newton's
 * method with a finite-difference Jacobian.
 */
export function solveUnknowns(periods: Period[], method: Method, unknowns: Unknown[], knowns: Known[], opts: ValuationOptions = {}): SolveResult {
  const work = clone(periods);
  const values: Record<string, number> = {};
  const fail = (error: string): SolveResult => ({ ok: false, values, equations: [], residuals: [], error, periods: work });
  if (unknowns.length > 3) return fail("אפשר לפתור עד שלושה נעלמים בבת אחת.");
  if (knowns.length < unknowns.length) return fail(`יש ${unknowns.length} נעלמים ורק ${knowns.length} נתונים ידועים — חסר נתון שמגדיר את הנעלם.`);

  for (const u of unknowns) setRef(work, u.ref, u.guess ?? (isPct(u.ref) ? 0.05 : 1));
  // A margin is a ratio; its residual is taken as gross profit − margin × net sales, which stays piecewise linear.
  const evalK = (k: Known) => {
    const rs = valuateChain(work, method, opts);
    if (k.metric === "gpPct") return rs[k.year].grossProfit - k.value * rs[k.year].netSales + k.value;
    // The same residual, with the margin it implies: last year's margin plus the change.
    if (k.metric === "gpPctChange") return rs[k.year].grossProfit - ((rs[k.year - 1]?.gpPct ?? 0) + k.value) * rs[k.year].netSales + k.value;
    return metricOf(rs, work, k);
  };
  const at = (u: Unknown, x: number, k: Known) => {
    const old = getRef(work, u.ref);
    setRef(work, u.ref, x);
    const v = evalK(k);
    setRef(work, u.ref, old);
    return v;
  };
  const depends = (u: Unknown, k: Known) => {
    const x0 = getRef(work, u.ref);
    const probes = isPct(u.ref) ? [0.03, 0.17, 0.41] : [x0 * 1.37 + 3, x0 * 0.61 + 11, x0 * 3 + 997];
    const base = evalK(k);
    return probes.some((x) => Math.abs(at(u, x, k) - base) > 1e-9 * Math.max(1, Math.abs(base)));
  };

  const left = [...unknowns];
  const unused = [...knowns];
  const equations: Equation[] = [];
  while (left.length) {
    const deps = unused.map((k) => ({ k, us: left.filter((u) => depends(u, k)) }));
    const single = deps.find((d) => d.us.length === 1);
    if (single) {
      const u = single.us[0];
      const k = single.k;
      const x = solve1D((v) => at(u, v, k) - k.value, u, getRef(work, u.ref), Math.max(1, Math.abs(k.value), Math.abs(evalK(k))));
      if (x === null) return fail(`אין ערך של "${u.label}" שמקיים את הנתון "${knownLabel(k)}" — בדקו שהזנתם נכון.`);
      if (typeof x === "string") return fail(x.replace("{u}", u.label));
      setRef(work, u.ref, x);
      values[u.id] = x;
      equations.push(linearise(u, k, x, (v) => at(u, v, k), work, method, opts));
      left.splice(left.indexOf(u), 1);
      unused.splice(unused.indexOf(k), 1);
      continue;
    }
    const pool = deps.filter((d) => d.us.length > 0);
    if (pool.length < left.length) return fail(`הנתונים אינם קובעים את ${left.map((u) => `"${u.label}"`).join(", ")} — הוסיפו נתון שתלוי בהם.`);
    const ks = pool.slice(0, left.length).map((d) => d.k);
    const sol = newton(work, left, ks, evalK);
    if (!sol) return fail("לא נמצא פתרון למערכת המשוואות — בדקו את הנתונים.");
    for (const [i, u] of left.entries()) {
      setRef(work, u.ref, sol[i]);
      values[u.id] = sol[i];
    }
    for (const [i, u] of left.entries()) equations.push(linearise(u, ks[i], sol[i], (v) => at(u, v, ks[i]), work, method, opts));
    for (const k of ks) unused.splice(unused.indexOf(k), 1);
    left.length = 0;
  }
  const results = valuateChain(work, method, opts);
  const residuals = knowns.map((k) => ({ known: knownLabel(k), value: k.value, got: metricOf(results, work, k) }));
  const off = residuals.find((r) => Math.abs(r.got - r.value) > (Math.abs(r.value) < 1 ? 1e-6 : 0.005));
  if (off) return { ok: false, values, equations, residuals, periods: work, error: `הנתון "${off.known}" אינו מתיישב עם השאר (${round(off.got)} במקום ${round(off.value)}).` };
  return { ok: true, values, equations, residuals, periods: work };
}

const round = (v: number) => Math.round(v * 100) / 100;

function domain(u: Unknown): [number, number] {
  return isPct(u.ref) ? [0, 0.999999] : [0, 1e12];
}

/** One unknown: Newton from a few starts, then a bracketing search with bisection; null when nothing works. */
function solve1D(g: (x: number) => number, u: Unknown, start: number, scale: number): number | null | string {
  const [lo, hi] = domain(u);
  const tol = 1e-11 * scale;
  const tryNewton = (x0: number) => {
    let x = x0;
    for (let i = 0; i < 60; i++) {
      const y = g(x);
      if (Math.abs(y) < tol) return x;
      const h = Math.max(1e-6 * Math.abs(x), 1e-6);
      let d = (g(x + h) - y) / h;
      if (!Number.isFinite(d) || Math.abs(d) < 1e-14) d = (y - g(x - h)) / h;
      if (!Number.isFinite(d) || Math.abs(d) < 1e-14) return null;
      x = Math.min(hi, Math.max(lo, x - y / d));
    }
    return Math.abs(g(x)) < tol * 1e3 ? x : null;
  };
  const starts = isPct(u.ref) ? [start, 0.05, 0.3] : [start, 1, 100, 10_000];
  const found = starts.map(tryNewton).filter((x): x is number => x !== null);
  if (found.length) {
    const base = found[0];
    const other = found.find((x) => Math.abs(x - base) > 1e-6 * Math.max(1, Math.abs(base)));
    if (other !== undefined && Math.abs(g(other)) < tol * 10) return `יש יותר מערך אחד של "{u}" שמקיים את הנתון — הוסיפו אילוץ.`;
    return base;
  }
  // Bracket: scan for a sign change.
  const grid = isPct(u.ref) ? Array.from({ length: 101 }, (_, i) => (i / 100) * hi) : [0, ...Array.from({ length: 45 }, (_, i) => 10 ** (i / 4 - 3))];
  for (let i = 1; i < grid.length; i++) {
    let a = grid[i - 1];
    let b = grid[i];
    let ga = g(a);
    if (Math.sign(ga) === Math.sign(g(b))) continue;
    for (let j = 0; j < 200; j++) {
      const m = (a + b) / 2;
      const gm = g(m);
      if (Math.sign(gm) === Math.sign(ga)) {
        a = m;
        ga = gm;
      } else b = m;
    }
    return (a + b) / 2;
  }
  return null;
}

function newton(work: Period[], us: Unknown[], ks: Known[], evalK: (k: Known) => number): number[] | null {
  const n = us.length;
  const F = (x: number[]) => {
    us.forEach((u, i) => setRef(work, u.ref, x[i]));
    return ks.map((k) => evalK(k) - k.value);
  };
  const starts = [us.map((u) => getRef(work, u.ref)), us.map((u) => (isPct(u.ref) ? 0.05 : 100)), us.map((u) => (isPct(u.ref) ? 0.2 : 5000))];
  for (const s of starts) {
    let x = [...s];
    for (let it = 0; it < 50; it++) {
      const f = F(x);
      if (f.every((v, i) => Math.abs(v) < 1e-9 * Math.max(1, Math.abs(ks[i].value)))) return x;
      const J = us.map((_, j) => {
        const h = Math.max(1e-6 * Math.abs(x[j]), 1e-6);
        const xh = [...x];
        xh[j] += h;
        const fh = F(xh);
        return fh.map((v, i) => (v - f[i]) / h);
      });
      // J[j][i] = ∂f_i/∂x_j; solve Σ_j J[j][i]·dx_j = −f_i.
      const A = Array.from({ length: n }, (_, i) => [...us.map((_, j) => J[j][i]), -f[i]]);
      const dx = gauss(A);
      if (!dx) break;
      x = x.map((v, j) => {
        const [lo, hi] = domain(us[j]);
        return Math.min(hi, Math.max(lo, v + dx[j]));
      });
    }
  }
  return null;
}

function gauss(A: number[][]): number[] | null {
  const n = A.length;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[n] / row[i]);
}

/** Snaps finite-difference noise off a coefficient (5.7000000001 → 5.7). */
const clean = (v: number) => {
  const r = Math.round(v * 1e6) / 1e6;
  return Math.abs(r - v) < 1e-9 * Math.max(1, Math.abs(v)) ? r : v;
};

/** The equation behind an answer: the model is piecewise linear, so on the answer's branch it is a·x + b = target. */
function linearise(u: Unknown, k: Known, x: number, f: (v: number) => number, work: Period[], method: Method, opts: ValuationOptions): Equation {
  let fn = f;
  let target = k.value;
  let viaSales: Equation["viaSales"];
  if (k.metric === "gpPct" || k.metric === "gpPctChange") {
    // A margin is a ratio; when cost of sales doesn't move with x, work with the net sales it implies instead (R31א).
    // A change in margin is the same, once last year's margin is added to it.
    const rs = (v: number) => valuateChainAt(work, u, v, method, opts);
    const marginAt = (v: number) => (k.metric === "gpPct" ? k.value : (rs(v)[k.year - 1]?.gpPct ?? 0) + k.value);
    const c = rs(x)[k.year].cogs;
    const far = x * 1.1 + 1;
    if (Math.abs(rs(far)[k.year].cogs - c) < 1e-7 * Math.max(1, c) && Math.abs(marginAt(far) - marginAt(x)) < 1e-9) {
      const pct = marginAt(x);
      viaSales = { cogs: c, gpPct: pct, ...(k.metric === "gpPctChange" ? { prevGpPct: pct - k.value, change: k.value } : {}) };
      target = salesFromGp(c, pct);
      fn = (v) => rs(v)[k.year].netSales;
    } else {
      // Cost of sales moves too: show gross profit − margin × net sales = 0.
      fn = (v) => {
        const r = rs(v)[k.year];
        return r.grossProfit - marginAt(v) * r.netSales;
      };
      target = 0;
    }
  }
  const h = Math.max(1e-4 * Math.abs(x), isPct(u.ref) ? 1e-6 : 1e-4);
  const a = clean((fn(x) - fn(x - h)) / h || (fn(x + h) - fn(x)) / h);
  const b = clean(fn(x) - a * x);
  const known =
    viaSales
      ? knownLabel(k)
      : k.metric === "gpPct"
        ? `רווח גולמי − ${Math.round(k.value * 1e4) / 100}% × מכירות נטו`
        : k.metric === "gpPctChange"
          ? `רווח גולמי − (שיעור השנה הקודמת ${k.value < 0 ? "−" : "+"} ${Math.round(Math.abs(k.value) * 1e4) / 100} נקודות) × מכירות נטו`
          : knownLabel(k);
  return { unknown: u.label, known, a, b, target, x, viaSales };
}

function valuateChainAt(work: Period[], u: Unknown, v: number, method: Method, opts: ValuationOptions) {
  const old = getRef(work, u.ref);
  setRef(work, u.ref, v);
  const r = valuateChain(work, method, opts);
  setRef(work, u.ref, old);
  return r;
}

// ---------------------------------------------------------------------------
// A statement with question marks (R32).

export const TABLE_ROWS = [
  "grossSales",
  "custDiscounts",
  "custReturns",
  "netSales",
  "opening",
  "grossPurchases",
  "suppDiscounts",
  "suppReturns",
  "netPurchases",
  "closing",
  "cogs",
  "grossProfit",
  "gpPct",
] as const;
export type TableRow = (typeof TABLE_ROWS)[number];

export const ROW_LABEL: Record<TableRow, string> = {
  grossSales: "מכירות ברוטו",
  custDiscounts: "הנחות ללקוחות",
  custReturns: "החזרות מלקוחות",
  netSales: "מכירות נטו",
  opening: "מלאי פתיחה",
  grossPurchases: "קניות ברוטו",
  suppDiscounts: "הנחות מספקים",
  suppReturns: "החזרות לספקים",
  netPurchases: "קניות נטו",
  closing: "מלאי סגירה",
  cogs: "עלות המכר",
  grossProfit: "רווח גולמי",
  gpPct: "שיעור רווח גולמי",
};

/** What each of the table's equations says, in words, for the reason beside a step. */
const WHY_EQUATION: Partial<Record<TableRow, string>> = {
  netSales: "מכירות נטו = מכירות ברוטו פחות מה שהוחזר ללקוחות או הונח להם.",
  netPurchases: "קניות נטו = קניות ברוטו פחות ההנחות וההחזרות מהספקים.",
  cogs: "עלות המכר = מה שהיה בתחילת השנה, ועוד מה שנקנה, פחות מה שנשאר בסוף.",
  grossProfit: "רווח גולמי = מכירות נטו פחות עלות המכר.",
};

/** Discounts and returns left blank in a question mean none. */
const ZERO_IF_BLANK: TableRow[] = ["custDiscounts", "custReturns", "suppDiscounts", "suppReturns"];

/** A number, an unknown ("?"), or a blank. A dash in a question is a zero. */
export type CellIn = number | "?" | null;
export type TableYear = {
  label: string;
  cells: Partial<Record<TableRow, CellIn>>;
  founded?: boolean;
  cogsPctOfPurchases?: number;
  /** "The margin rose (or fell) by so many points on last year": this year's margin less last year's. */
  gpPctDelta?: number;
};
export type TableInput = { years: TableYear[]; chainOpening?: boolean };
export type TableStep = { n: number; year: number; row: TableRow; equation: string; substitution: string; value: number; rule: string; why: string };
export type TableResult = {
  values: Partial<Record<TableRow, number>>[];
  given: Set<string>[];
  steps: TableStep[];
  missing: { year: number; row: TableRow }[];
  conflicts: string[];
};

type Term = { year: number; row: TableRow; sign: 1 | -1 };
/** `lhs = Σ sign·term`. */
type Linear = { lhs: Term; rhs: Term[]; rule: string };

const nf = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });
const fv = (row: TableRow, v: number) => (row === "gpPct" ? `${nf.format(v * 100)}%` : nf.format(v));

export function solveTable(input: TableInput): TableResult {
  const chain = input.chainOpening ?? true;
  const values: Partial<Record<TableRow, number>>[] = [];
  const given: Set<string>[] = [];
  for (const [t, y] of input.years.entries()) {
    const v: Partial<Record<TableRow, number>> = {};
    const g = new Set<string>();
    for (const row of TABLE_ROWS) {
      const c = y.cells[row];
      if (typeof c === "number") {
        v[row] = c;
        g.add(row);
      } else if (c == null && ZERO_IF_BLANK.includes(row)) v[row] = 0;
    }
    if (t === 0 && y.founded && v.opening === undefined) {
      v.opening = 0;
      g.add("opening");
    }
    values.push(v);
    given.push(g);
  }
  const lin: Linear[] = [];
  const T = (year: number, row: TableRow, sign: 1 | -1 = 1): Term => ({ year, row, sign });
  for (const t of input.years.keys()) {
    if (t > 0 && chain) lin.push({ lhs: T(t, "opening"), rhs: [T(t - 1, "closing")], rule: "R9" });
    lin.push({ lhs: T(t, "netSales"), rhs: [T(t, "grossSales"), T(t, "custDiscounts", -1), T(t, "custReturns", -1)], rule: "R6" });
    lin.push({ lhs: T(t, "netPurchases"), rhs: [T(t, "grossPurchases"), T(t, "suppDiscounts", -1), T(t, "suppReturns", -1)], rule: "R6" });
    lin.push({ lhs: T(t, "cogs"), rhs: [T(t, "opening"), T(t, "netPurchases"), T(t, "closing", -1)], rule: "R5" });
    lin.push({ lhs: T(t, "grossProfit"), rhs: [T(t, "netSales"), T(t, "cogs", -1)], rule: "R7" });
  }
  const steps: TableStep[] = [];
  const get = (x: Term) => values[x.year][x.row];
  const label = (t: number) => input.years[t].label;
  const name = (x: Term, t: number) => (x.year === t ? ROW_LABEL[x.row] : `${ROW_LABEL[x.row]} ${label(x.year)}`);
  const record = (year: number, row: TableRow, value: number, equation: string, substitution: string, rule: string, why: string) => {
    values[year][row] = value;
    steps.push({ n: steps.length + 1, year, row, equation, substitution, value, rule, why });
  };
  const pts = (v: number) => `${nf.format(Math.abs(v) * 100)} נקודות`;

  // A move the table can make now: the year of the cell it fills, and how.
  type Move = { year: number; run: () => void };
  const linearMoves = (): Move[] => {
    const out: Move[] = [];
    for (const e of lin) {
      const terms = [{ ...e.lhs, sign: 1 as const, isL: true }, ...e.rhs.map((r) => ({ ...r, isL: false }))];
      const open = terms.filter((x) => get(x) === undefined);
      if (open.length !== 1) continue;
      const u = open[0];
      out.push({
        year: u.year,
        run: () => {
          const t = u.year;
          // Rearranged so the unknown stands alone: L = Σ s·R, or R_j = (L − Σ_{i≠j} s·R_i) / s_j.
          let parts: { sign: 1 | -1; term: Term }[];
          if (u.isL) parts = e.rhs.map((r) => ({ sign: r.sign, term: r }));
          else {
            const others = e.rhs.filter((r) => !(r.year === u.year && r.row === u.row));
            parts = u.sign === 1 ? [{ sign: 1, term: e.lhs }, ...others.map((r) => ({ sign: (-r.sign) as 1 | -1, term: r }))] : [...others.map((r) => ({ sign: r.sign, term: r })), { sign: -1, term: e.lhs }];
          }
          const value = parts.reduce((sum, p) => sum + p.sign * get(p.term)!, 0);
          const words = parts.map((p, i) => `${i ? (p.sign === 1 ? " + " : " − ") : p.sign === 1 ? "" : "−"}${name(p.term, t)}`).join("");
          const nums = parts.map((p, i) => `${i ? (p.sign === 1 ? " + " : " − ") : p.sign === 1 ? "" : "−"}${nf.format(get(p.term)!)}`).join("");
          const why =
            e.rule === "R9"
              ? u.row === "opening"
                ? `מלאי הסגירה של ${label(t - 1)} הוא מה שעמד במחסן בלילה שבין השנים — ולכן הוא מלאי הפתיחה של ${label(t)}. המספר פשוט עובר שנה.`
                : `מלאי הפתיחה של ${label(t + 1)} ידוע, והוא בדיוק מלאי הסגירה של ${label(t)}.`
              : `${WHY_EQUATION[e.lhs.row] ?? ""} בשורה הזו כל המספרים ידועים חוץ מ${ROW_LABEL[u.row]} — ולכן אפשר לחלץ אותו עכשיו.`.trim();
          record(t, u.row, value, `${ROW_LABEL[u.row]} = ${words}`, `${nums} = ${nf.format(value)}`, e.rule, why);
        },
      });
    }
    return out;
  };
  const marginMoves = (t: number): Move[] => {
    const v = values[t];
    const y = input.years[t];
    const out: Move[] = [];
    const add = (run: () => void) => out.push({ year: t, run });
    // A margin given as a change on last year: this year's margin is last year's plus the change.
    const d = y.gpPctDelta;
    if (d !== undefined && t > 0 && v.gpPct === undefined) {
      const pv = values[t - 1];
      const prev = pv.gpPct ?? (pv.netSales && pv.grossProfit !== undefined ? pv.grossProfit / pv.netSales : undefined);
      if (prev !== undefined)
        add(() =>
          record(
            t,
            "gpPct",
            prev + d,
            `שיעור רווח גולמי = שיעור ${label(t - 1)} ${d < 0 ? "−" : "+"} ${pts(d)}`,
            `${fv("gpPct", prev)} ${d < 0 ? "−" : "+"} ${fv("gpPct", Math.abs(d))} = ${fv("gpPct", prev + d)}`,
            "R30",
            `השאלה לא נותנת את השיעור של ${label(t)} ישירות, אלא אומרת שהוא ${d < 0 ? "נמוך" : "גבוה"} ב-${pts(d)} מזה של ${label(t - 1)}. השיעור של ${label(t - 1)} כבר ידוע — מוסיפים את ההפרש.`,
          ),
        );
    }
    if (v.gpPct !== undefined && v.netSales !== undefined && v.grossProfit === undefined)
      add(() => record(t, "grossProfit", v.gpPct! * v.netSales!, "רווח גולמי = שיעור רווח גולמי × מכירות נטו", `${fv("gpPct", v.gpPct!)} × ${nf.format(v.netSales!)} = ${nf.format(v.gpPct! * v.netSales!)}`, "R7", "השיעור אומר כמה מכל שקל של מכירות נשאר כרווח גולמי. המכירות נטו ידועות — כופלים."));
    else if (v.gpPct !== undefined && v.grossProfit !== undefined && v.netSales === undefined && v.gpPct !== 0)
      add(() => record(t, "netSales", v.grossProfit! / v.gpPct!, "מכירות נטו = רווח גולמי ÷ שיעור רווח גולמי", `${nf.format(v.grossProfit!)} ÷ ${fv("gpPct", v.gpPct!)} = ${nf.format(v.grossProfit! / v.gpPct!)}`, "R7", "ידוע הרווח הגולמי בשקלים, וגם איזה חלק הוא מהמכירות — מחלקים כדי לקבל את המכירות."));
    else if (v.gpPct === undefined && v.grossProfit !== undefined && v.netSales)
      add(() => record(t, "gpPct", v.grossProfit! / v.netSales!, "שיעור רווח גולמי = רווח גולמי ÷ מכירות נטו", `${nf.format(v.grossProfit!)} ÷ ${nf.format(v.netSales!)} = ${fv("gpPct", v.grossProfit! / v.netSales!)}`, "R7", "הרווח הגולמי והמכירות נטו כבר ידועים. השיעור מחושב תמיד על המכירות — לא על העלות."));
    else if (v.gpPct !== undefined && v.cogs !== undefined && v.netSales === undefined && v.grossProfit === undefined) {
      const ns = salesFromGp(v.cogs, v.gpPct);
      add(() => record(t, "netSales", ns, "מכירות נטו = עלות המכר ÷ (1 − שיעור רווח גולמי)", `${nf.format(v.cogs!)} ÷ (1 − ${fv("gpPct", v.gpPct!)}) = ${nf.format(ns)}`, "R30", "אם הרווח הגולמי הוא p מהמכירות, עלות המכר היא החלק הנותר — (1 − p) מהמכירות. עלות המכר ידועה, ולכן מחלקים בחלק הזה."));
    } else if (v.gpPct !== undefined && v.netSales !== undefined && v.cogs === undefined && v.grossProfit === undefined) {
      const c = v.netSales * (1 - v.gpPct);
      add(() => record(t, "cogs", c, "עלות המכר = מכירות נטו × (1 − שיעור רווח גולמי)", `${nf.format(v.netSales!)} × (1 − ${fv("gpPct", v.gpPct!)}) = ${nf.format(c)}`, "R30", "מה שלא נשאר כרווח גולמי הוא עלות המכר: (1 − השיעור) מהמכירות."));
    }
    // "Sold p% of the year's purchases" (R31ו).
    const p = y.cogsPctOfPurchases;
    if (p) {
      if (v.cogs === undefined && v.netPurchases !== undefined)
        add(() => record(t, "cogs", p * v.netPurchases!, "עלות המכר = p × קניות נטו", `${nf.format(p * 100)}% × ${nf.format(v.netPurchases!)} = ${nf.format(p * v.netPurchases!)}`, "R31ו", `השאלה אומרת שנמכרו ${nf.format(p * 100)}% מהקניות — זו עלות המכר.`));
      else if (v.cogs !== undefined && v.netPurchases === undefined)
        add(() => record(t, "netPurchases", v.cogs! / p, "קניות נטו = עלות המכר ÷ p", `${nf.format(v.cogs!)} ÷ ${nf.format(p * 100)}% = ${nf.format(v.cogs! / p)}`, "R31ו", `עלות המכר היא ${nf.format(p * 100)}% מהקניות — מחלקים כדי לקבל את הקניות.`));
    }
    return out;
  };

  // Always the earliest year that can move, so a year is finished before the next one starts.
  for (let guard = 0; guard < 500; guard++) {
    const moves = [...linearMoves(), ...input.years.flatMap((_, t) => marginMoves(t))];
    if (!moves.length) break;
    const first = Math.min(...moves.map((x) => x.year));
    moves.find((x) => x.year === first)!.run();
  }

  const missing: { year: number; row: TableRow }[] = [];
  for (const [t, y] of input.years.entries()) for (const row of TABLE_ROWS) if (y.cells[row] === "?" && values[t][row] === undefined) missing.push({ year: t, row });
  const conflicts: string[] = [];
  for (const e of lin) {
    const all = [e.lhs, ...e.rhs];
    if (all.some((x) => get(x) === undefined)) continue;
    const diff = get(e.lhs)! - e.rhs.reduce((s, r) => s + r.sign * get(r)!, 0);
    if (Math.abs(diff) > 0.5) conflicts.push(`${input.years[e.lhs.year].label}: ${ROW_LABEL[e.lhs.row]} אינו מתיישב עם שאר הנתונים (הפרש ${nf.format(diff)}).`);
  }
  for (const [t, v] of values.entries())
    if (v.gpPct !== undefined && v.grossProfit !== undefined && v.netSales && Math.abs(v.gpPct * v.netSales - v.grossProfit) > 0.5)
      conflicts.push(`${input.years[t].label}: שיעור הרווח הגולמי אינו מתיישב עם הרווח הגולמי והמכירות.`);
  return { values, given, steps, missing, conflicts };
}
