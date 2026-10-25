/**
 * Inventory (IAS 2): one pure model for every number on the inventory page.
 *
 * Purchases are costed from their terms (discounts, duty, freight, financing),
 * then a period is valued by FIFO, the periodic weighted average or the moving
 * average, tested against net realisable value, and chained into the next year.
 * The same model answers fire and insurance questions. Amounts are kept at full
 * precision; rounding happens only where a `Rounding` policy says so.
 */

import { type Entry, round2 } from "./basics";

export type Method = "fifo" | "wa-periodic" | "moving-avg";
export type System = "periodic" | "perpetual";
export type Rounding = { mode: "exact" } | { mode: "unit"; digits: number } | { mode: "amount"; digits: number };

export const METHODS: Method[] = ["fifo", "wa-periodic", "moving-avg"];
export const METHOD_LABEL: Record<Method, string> = {
  fifo: "FIFO (נרי״ר)",
  "wa-periodic": "ממוצע משוקלל תקופתי",
  "moving-avg": "ממוצע משוקלל נע",
};
/** The recording system each method implies; FIFO gives the same numbers in both. */
export const METHOD_SYSTEM: Record<Method, System | null> = { fifo: null, "wa-periodic": "periodic", "moving-avg": "perpetual" };

// ---------------------------------------------------------------------------
// Purchase cost (IAS 2.10–18).

type Validity = { from?: string; to?: string };
export type DiscountRule =
  /** More than `threshold` units in one purchase: `pct` off the whole purchase. */
  | ({ kind: "qty-whole"; threshold: number; pct: number; shared?: boolean } & Validity)
  /** `pct` off only the units above `threshold`. */
  | ({ kind: "qty-excess"; threshold: number; pct: number; shared?: boolean } & Validity)
  /** A fixed amount off every unit after the `afterUnit`-th one. */
  | ({ kind: "per-unit-above"; afterUnit: number; amountPerUnit: number } & Validity)
  /** A cumulative target: recognised only once achieved, or if in the company's sole control and expected. */
  | ({ kind: "target"; pct: number; companyControlled: boolean; expected: boolean; achieved: boolean; shared?: boolean } & Validity);

export const targetRecognised = (r: { companyControlled: boolean; expected: boolean; achieved: boolean }) => r.achieved || (r.companyControlled && r.expected);

export type ExtraCategory = "duty" | "freight" | "handling" | "storage-required" | "storage" | "vat" | "selling" | "waste" | "admin" | "other";
export type ExtraBasis = "per-shipment" | "per-unit" | "per-pack" | "per-kg" | "pct-of-net-price";

export interface ExtraCost {
  category: ExtraCategory;
  label?: string;
  /** A sum, or a fraction of the net price when the basis is `pct-of-net-price`. */
  amount: number;
  basis: ExtraBasis;
  packSize?: number;
  kgPerUnit?: number;
  /** Overrides the category's default. */
  include?: boolean;
}

export const EXTRA_INFO: Record<ExtraCategory, { label: string; include: boolean; reason: string; section: string }> = {
  duty: { label: "מכס ומסי יבוא", include: true, reason: "מס שאינו ניתן להחזר — חלק מעלות הרכישה", section: "IAS 2.11" },
  freight: { label: "הובלה", include: true, reason: "הובלה פנימה, עד למיקום הנוכחי של המלאי", section: "IAS 2.11" },
  handling: { label: "טיפול ושירותי נמל", include: true, reason: "עלות שניתן לייחס ישירות לרכישה", section: "IAS 2.11" },
  "storage-required": { label: "אחסון הכרחי לפני שלב נוסף", include: true, reason: "אחסון שנחוץ בתהליך לפני השלב הבא", section: "IAS 2.16(ב)" },
  storage: { label: "אחסון רגיל", include: false, reason: "אחסון שאינו נחוץ לתהליך — הוצאה בתקופה", section: "IAS 2.16(ב)" },
  vat: { label: 'מע"מ בר-קיזוז', include: false, reason: "מס שניתן להחזר — לא עלות", section: "IAS 2.11" },
  selling: { label: "עלויות מכירה (הובלה ללקוח)", include: false, reason: "עלות מכירה — הוצאה בתקופה", section: "IAS 2.16(ד)" },
  waste: { label: "בזבוז חריג", include: false, reason: "בזבוז חריג — הוצאה בתקופה", section: "IAS 2.16(א)" },
  admin: { label: "תקורה מנהלתית", include: false, reason: "לא תורמת להבאת המלאי למיקומו ולמצבו", section: "IAS 2.16(ג)" },
  other: { label: "עלות אחרת", include: true, reason: "עלות שהתהוותה בהבאת המלאי למיקומו ולמצבו", section: "IAS 2.10" },
};

export interface Purchase {
  id?: string;
  label?: string;
  date?: string;
  qty: number;
  unitPrice: number;
  discounts?: DiscountRule[];
  /** Unusual credit terms: the cash price is this fraction lower; the difference is a finance expense. */
  financingPct?: number;
  extras?: ExtraCost[];
}

export interface Sale {
  id?: string;
  label?: string;
  date?: string;
  qty: number;
  unitPrice?: number;
}

export type CostLine = { label: string; amount: number; included: boolean; kind: "price" | "discount" | "financing" | "extra"; reason?: string; section?: string };
export type PurchaseCost = {
  gross: number;
  discount: number;
  net: number;
  financing: number;
  extras: number;
  excluded: number;
  total: number;
  perUnit: number;
  lines: CostLine[];
};

const active = (r: Validity, date?: string) => !date || ((!r.from || date >= r.from) && (!r.to || date <= r.to));

/** The amount a discount rule takes off one purchase (zero when it doesn't apply). */
export function discountAmount(r: DiscountRule, p: Pick<Purchase, "qty" | "unitPrice" | "date">) {
  if (!active(r, p.date)) return 0;
  const gross = p.qty * p.unitPrice;
  switch (r.kind) {
    case "qty-whole":
      return p.qty > r.threshold ? gross * r.pct : 0;
    case "qty-excess":
      return Math.max(0, p.qty - r.threshold) * p.unitPrice * r.pct;
    case "per-unit-above":
      return Math.max(0, p.qty - r.afterUnit) * r.amountPerUnit;
    case "target":
      return gross * r.pct;
  }
}

const fmtPct = (r: number) => `${round2(r * 100)}%`;

function discountLabel(r: DiscountRule) {
  switch (r.kind) {
    case "qty-whole":
      return `הנחת כמות ${fmtPct(r.pct)} על כל הרכישה (מעל ${r.threshold.toLocaleString("he-IL")} יח')`;
    case "qty-excess":
      return `הנחה ${fmtPct(r.pct)} על הכמות שמעל ${r.threshold.toLocaleString("he-IL")} יח'`;
    case "per-unit-above":
      return `הנחה של ${r.amountPerUnit} ₪ לכל יחידה מעבר ליחידה ה-${r.afterUnit.toLocaleString("he-IL")}`;
    case "target":
      return `הנחת יעד ${fmtPct(r.pct)}`;
  }
}

function extraAmount(x: ExtraCost, qty: number, net: number) {
  switch (x.basis) {
    case "per-shipment":
      return x.amount;
    case "per-unit":
      return x.amount * qty;
    case "per-pack":
      return (x.amount * qty) / (x.packSize || 1);
    case "per-kg":
      return x.amount * (x.kgPerUnit ?? 0) * qty;
    case "pct-of-net-price":
      return x.amount * net;
  }
}

/** The cost of one purchase: price, less discounts and any financing component, plus the costs IAS 2 lets in. */
export function purchaseCost(p: Purchase): PurchaseCost {
  const gross = p.qty * p.unitPrice;
  const lines: CostLine[] = [{ label: "מחיר רכישה", amount: gross, included: true, kind: "price", section: "IAS 2.11" }];
  let discount = 0;
  for (const r of p.discounts ?? []) {
    if (!active(r, p.date)) continue;
    const amount = discountAmount(r, p);
    if (amount === 0) continue;
    if (r.kind === "target" && !targetRecognised(r)) {
      lines.push({
        label: discountLabel(r),
        amount: -amount,
        included: false,
        kind: "discount",
        reason: r.companyControlled ? "החברה לא צופה לעמוד ביעד — לא מכירים בהנחה" : "היעד אינו בשליטת החברה ועוד לא הושג — לא מכירים בהנחה",
        section: "IAS 2.11",
      });
      continue;
    }
    discount += amount;
    lines.push({ label: discountLabel(r), amount: -amount, included: true, kind: "discount", reason: "הנחות מנוכות מעלות הרכישה", section: "IAS 2.11" });
  }
  const net = gross - discount;
  const financing = p.financingPct ? net * p.financingPct : 0;
  if (financing)
    lines.push({
      label: `רכיב מימון (${fmtPct(p.financingPct!)} מהמחיר)`,
      amount: -financing,
      included: true,
      kind: "financing",
      reason: "תנאי אשראי חריגים: ההפרש מהמחיר במזומן הוא הוצאות מימון",
      section: "IAS 2.18",
    });
  let extras = 0;
  let excluded = 0;
  for (const x of p.extras ?? []) {
    const info = EXTRA_INFO[x.category];
    const amount = extraAmount(x, p.qty, net);
    const included = x.include ?? info.include;
    if (included) extras += amount;
    else excluded += amount;
    lines.push({ label: x.label ?? info.label, amount, included, kind: "extra", reason: info.reason, section: info.section });
  }
  const total = net - financing + extras;
  return { gross, discount, net, financing, extras, excluded, total, perUnit: p.qty ? total / p.qty : 0, lines };
}

// ---------------------------------------------------------------------------
// Valuing a period.

export interface Layer {
  source: string;
  date?: string;
  units: number;
  cost: number;
  /** Cost before any write-down, so a reversal can't go above it. */
  origCost: number;
}

export interface Opening {
  units: number;
  cost: number;
  /** FIFO layers carried from the previous year. */
  layers?: Layer[];
}

export interface Period {
  id?: string;
  label: string;
  opening?: Opening;
  /** In a chain, keep this period's own opening instead of last year's closing. */
  ownOpening?: boolean;
  purchases: Purchase[];
  sales: Sale[];
  nrvPerUnit?: number;
  nrvTotal?: number;
  /** A write-down already in the opening balance, for testing a reversal. */
  priorWriteDown?: number;
  adjustments?: { custDiscounts?: number; custReturns?: number };
  /** A customer quantity discount: more than `threshold` units in a sale, `pct` off the whole sale. */
  saleDiscount?: { threshold: number; pct: number };
  /** Units found in the year-end count, when they differ from the books. */
  countedUnits?: number;
}

export type Slice = { source: string; units: number; cost: number };
export type LedgerRow = {
  date?: string;
  kind: "open" | "buy" | "sell" | "shrink";
  label: string;
  qty: number;
  unitCost: number;
  amount: number;
  /** Balance after the event. */
  units: number;
  cost: number;
  avg: number;
  slices?: Slice[];
  /** Which purchase or sale of the period this row is. */
  index?: number;
};

export interface PeriodResult {
  label: string;
  method: Method;
  system: System;
  costs: PurchaseCost[];
  openingUnits: number;
  openingCost: number;
  purchasesUnits: number;
  purchasesCost: number;
  availableUnits: number;
  availableCost: number;
  soldUnits: number;
  shrinkUnits: number;
  shrinkCost: number;
  closingUnits: number;
  /** Closing inventory at cost, by the method. */
  closingCostBasis: number;
  nrvTotal?: number;
  priorWriteDown: number;
  writeDown: number;
  reversal: number;
  closingCarrying: number;
  cogs: number;
  saleCosts: number[];
  saleRevenue: number[];
  grossSales: number;
  saleQtyDiscounts: number;
  custDiscounts: number;
  custReturns: number;
  netSales: number;
  grossProfit: number;
  gpPct: number;
  /** Periodic average, or the moving average after the last event. */
  avgCost?: number;
  /** FIFO layers left at the end, after any write-down. */
  layers: Layer[];
  ledger: LedgerRow[];
  errors: string[];
  warnings: string[];
}

export interface ValuationOptions {
  system?: System;
  rounding?: Rounding;
  /** Test the lower of cost and NRV (default true). */
  nrv?: boolean;
  /** Same-date events: purchases first (default) or sales first. */
  salesFirstOnTie?: boolean;
  /** In a chain, carry last year's write-down forward so a rise in NRV can reverse it (off by default: the course opens at the carrying amount and moves on). */
  carryWriteDown?: boolean;
}

const EPS = 1e-9;
const roundTo = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
export const dateLabel = (d?: string) => (d ? d.split("-").reverse().map((x, i) => (i < 2 ? String(Number(x)) : x)).join(".") : "");

type Ev =
  | { kind: "buy"; index: number; date?: string; units: number; cost: number; label: string }
  | { kind: "sell"; index: number; date?: string; units: number; label: string }
  | { kind: "shrink"; units: number; label: string; date?: string; index: -1 };

/** Events in time order: by date, purchases before sales on the same date; without dates, purchases then sales. */
function timeline(period: Period, costs: PurchaseCost[], salesFirst: boolean): { events: Ev[]; dated: boolean } {
  const buys: Ev[] = period.purchases.map((p, i) => ({ kind: "buy", index: i, date: p.date, units: p.qty, cost: costs[i].total, label: p.label ?? `רכישה ${i + 1}` }));
  const sells: Ev[] = period.sales.map((s, i) => ({ kind: "sell", index: i, date: s.date, units: s.qty, label: s.label ?? `מכירה ${i + 1}` }));
  const all = [...buys, ...sells];
  const dated = all.length > 0 && all.every((e) => e.date);
  if (!dated) return { events: [...buys, ...sells], dated: all.length === 0 };
  const rank = (e: Ev) => (e.kind === "buy" ? (salesFirst ? 1 : 0) : salesFirst ? 0 : 1);
  return { events: all.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date! < b.e.date! ? -1 : a.e.date! > b.e.date! ? 1 : rank(a.e) - rank(b.e) || a.i - b.i)).map((x) => x.e), dated };
}

type Run = { closingUnits: number; closingCost: number; saleCosts: number[]; shrinkCost: number; layers: Layer[]; ledger: LedgerRow[]; avg?: number; errors: string[] };

function openingLayers(o: Opening, orig: boolean): Layer[] {
  if (o.layers?.length) return o.layers.map((l) => ({ ...l, cost: orig ? l.origCost : l.cost }));
  return o.units > EPS ? [{ source: "מלאי פתיחה", units: o.units, cost: o.cost, origCost: o.cost }] : [];
}

/** Part of a layer: its cost share, rounded as the policy says (D1). */
type Part = (layerCost: number, layerUnits: number, units: number) => number;
const partOf = (rounding: Rounding): Part =>
  rounding.mode === "unit"
    ? (c, u, n) => roundTo(c / u, rounding.digits) * n
    : rounding.mode === "amount"
      ? (c, u, n) => roundTo((c * n) / u, rounding.digits)
      : (c, u, n) => (c * n) / u;

function take(queue: Layer[], units: number, part: Part): { slices: Slice[]; cost: number; short: number } {
  const slices: Slice[] = [];
  let need = units;
  let cost = 0;
  while (need > EPS && queue.length) {
    const l = queue[0];
    if (l.units <= need + EPS) {
      slices.push({ source: l.source, units: l.units, cost: l.cost });
      cost += l.cost;
      need -= l.units;
      queue.shift();
    } else {
      const c = part(l.cost, l.units, need);
      const oc = (l.origCost * need) / l.units;
      slices.push({ source: l.source, units: need, cost: c });
      cost += c;
      l.cost -= c;
      l.origCost -= oc;
      l.units -= need;
      need = 0;
    }
  }
  return { slices, cost, short: need > EPS ? need : 0 };
}

function run(period: Period, method: Method, events: Ev[], opening: Opening, orig: boolean, totalSold: number, periodic: boolean, rounding: Rounding): Run {
  const unitR = (v: number) => (rounding.mode === "unit" ? roundTo(v, rounding.digits) : v);
  const amtR = (v: number) => (rounding.mode === "amount" ? roundTo(v, rounding.digits) : v);
  const errors: string[] = [];
  const saleCosts = period.sales.map(() => 0);
  const ledger: LedgerRow[] = [];
  const openCost = orig && !opening.layers?.length ? opening.cost + (period.priorWriteDown ?? 0) : opening.cost;
  const open: Opening = { ...opening, cost: openCost };
  let shrinkCost = 0;
  const short = (e: Ev, have: number) =>
    errors.push(
      e.kind === "shrink"
        ? `חוסר בספירה גדול מהיתרה בספרים`
        : `${e.date ? `ב-${dateLabel(e.date)} ` : ""}נמכרו ${fmtQty(e.units)} יחידות אבל במלאי היו רק ${fmtQty(Math.max(0, have))} — בדקו כמות או תאריך.`,
    );

  if (method === "wa-periodic") {
    const units = open.units + events.filter((e) => e.kind === "buy").reduce((s, e) => s + e.units, 0);
    const cost = openCost + events.reduce((s, e) => s + (e.kind === "buy" ? e.cost : 0), 0);
    const avg = unitR(units > EPS ? cost / units : 0);
    let bal = open.units;
    let balCost = openCost;
    if (open.units > EPS) ledger.push({ kind: "open", label: "מלאי פתיחה", qty: open.units, unitCost: openCost / open.units, amount: openCost, units: bal, cost: balCost, avg: openCost / open.units });
    for (const e of events) {
      if (e.kind === "buy") {
        bal += e.units;
        balCost += e.cost;
        ledger.push({ date: e.date, kind: "buy", label: e.label, qty: e.units, unitCost: e.cost / e.units, amount: e.cost, units: bal, cost: balCost, avg, index: e.index });
      } else {
        const c = amtR(avg * e.units);
        if (e.kind === "sell") saleCosts[e.index] = c;
        else shrinkCost = c;
        bal -= e.units;
        balCost -= c;
        ledger.push({ date: e.date, kind: e.kind, label: e.label, qty: e.units, unitCost: avg, amount: c, units: bal, cost: balCost, avg, index: e.index });
      }
    }
    const closingUnits = units - totalSold;
    if (closingUnits < -EPS) errors.push(`נמכרו ${fmtQty(totalSold)} יחידות, יותר מ-${fmtQty(units)} הזמינות במהלך השנה.`);
    const closingCost = amtR(avg * Math.max(0, closingUnits));
    return { closingUnits: Math.max(0, closingUnits), closingCost, saleCosts, shrinkCost, layers: [], ledger, avg, errors };
  }

  if (method === "moving-avg") {
    let units = open.units;
    let cost = openCost;
    let avg = units > EPS ? cost / units : 0;
    if (units > EPS) ledger.push({ kind: "open", label: "מלאי פתיחה", qty: units, unitCost: avg, amount: cost, units, cost, avg });
    for (const e of events) {
      if (e.kind === "buy") {
        units += e.units;
        cost += e.cost;
        avg = units > EPS ? unitR(cost / units) : avg;
        ledger.push({ date: e.date, kind: "buy", label: e.label, qty: e.units, unitCost: e.cost / (e.units || 1), amount: e.cost, units, cost, avg, index: e.index });
      } else {
        if (e.units > units + EPS) short(e, units);
        const c = amtR(avg * e.units);
        if (e.kind === "sell") saleCosts[e.index] = c;
        else shrinkCost = c;
        units -= e.units;
        cost -= c;
        if (Math.abs(units) < EPS) {
          units = 0;
          cost = 0;
        }
        ledger.push({ date: e.date, kind: e.kind, label: e.label, qty: e.units, unitCost: avg, amount: c, units, cost, avg, index: e.index });
      }
    }
    return { closingUnits: units, closingCost: cost, saleCosts, shrinkCost, layers: [], ledger, avg, errors };
  }

  // FIFO: walk the events for the per-sale table; a periodic count takes the year's sales from the oldest layers in one go.
  const queue = openingLayers(open, orig);
  let units = open.units;
  let cost = openCost;
  if (units > EPS) ledger.push({ kind: "open", label: "מלאי פתיחה", qty: units, unitCost: cost / units, amount: cost, units, cost, avg: cost / units });
  let shortage = false;
  for (const e of events) {
    if (e.kind === "buy") {
      queue.push({ source: e.label, date: e.date, units: e.units, cost: e.cost, origCost: e.cost });
      units += e.units;
      cost += e.cost;
      ledger.push({ date: e.date, kind: "buy", label: e.label, qty: e.units, unitCost: e.cost / (e.units || 1), amount: e.cost, units, cost, avg: units ? cost / units : 0, index: e.index });
    } else {
      const t = take(queue, e.units, partOf(rounding));
      if (t.short > EPS) {
        shortage = true;
        if (!periodic) short(e, e.units - t.short);
      }
      if (e.kind === "sell") saleCosts[e.index] = t.cost;
      else shrinkCost = t.cost;
      units -= e.units - t.short;
      cost -= t.cost;
      if (Math.abs(units) < EPS) units = cost = 0;
      ledger.push({ date: e.date, kind: e.kind, label: e.label, qty: e.units, unitCost: e.units ? t.cost / e.units : 0, amount: t.cost, units, cost, avg: units ? cost / units : 0, slices: t.slices, index: e.index });
    }
  }
  if (periodic && shortage) {
    // A periodic count doesn't care when units were sold, only how many: take them all from the oldest layers.
    const all = openingLayers(open, orig);
    for (const e of events) if (e.kind === "buy") all.push({ source: e.label, date: e.date, units: e.units, cost: e.cost, origCost: e.cost });
    const t = take(all, totalSold, partOf(rounding));
    if (t.short > EPS) errors.push(`נמכרו ${fmtQty(totalSold)} יחידות, יותר מהזמינות במהלך השנה.`);
    return { closingUnits: all.reduce((s, l) => s + l.units, 0), closingCost: all.reduce((s, l) => s + l.cost, 0), saleCosts, shrinkCost, layers: all, ledger, errors };
  }
  return { closingUnits: Math.max(0, units), closingCost: queue.reduce((s, l) => s + l.cost, 0), saleCosts, shrinkCost, layers: queue, ledger, errors };
}

const qf = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });
export const fmtQty = (v: number) => qf.format(v);

/** Values one period by a cost formula, then measures it at the lower of cost and NRV. */
export function valuatePeriod(period: Period, method: Method, opts: ValuationOptions = {}): PeriodResult {
  const system: System = METHOD_SYSTEM[method] ?? opts.system ?? "periodic";
  const rounding = opts.rounding ?? { mode: "exact" };
  const useNrv = opts.nrv ?? true;
  const costs = period.purchases.map(purchaseCost);
  const opening: Opening = period.opening ?? { units: 0, cost: 0 };
  const { events, dated } = timeline(period, costs, !!opts.salesFirstOnTie);
  const warnings: string[] = [];
  if (!dated && system === "perpetual" && period.sales.length && period.purchases.length)
    warnings.push("בשיטה תמידית הסדר הכרונולוגי קובע — בלי תאריכים מניחים שכל הרכישות קדמו למכירות.");

  const purchasesUnits = period.purchases.reduce((s, p) => s + p.qty, 0);
  const purchasesCost = costs.reduce((s, c) => s + c.total, 0);
  const availableUnits = opening.units + purchasesUnits;
  const soldUnits = period.sales.reduce((s, x) => s + x.qty, 0);
  let shrinkUnits = 0;
  if (period.countedUnits !== undefined) {
    const book = availableUnits - soldUnits;
    if (period.countedUnits < book - EPS) shrinkUnits = book - period.countedUnits;
    if (Math.abs(period.countedUnits - book) > EPS)
      warnings.push(`הכמות שנספרה שונה מהגלגול (${fmtQty(period.countedUnits)} מול ${fmtQty(book)}) — אולי יש מלאי בדרך, משגור או מכור-והחזק?`);
  }
  const evs: Ev[] = shrinkUnits ? [...events, { kind: "shrink", index: -1, units: shrinkUnits, label: "חוסר בספירה" }] : events;
  const periodic = system === "periodic";
  const book = run(period, method, evs, opening, false, soldUnits + shrinkUnits, periodic, rounding);
  const withPrior = useNrv && (period.priorWriteDown ?? 0) > 0;
  const orig = withPrior ? run(period, method, evs, opening, true, soldUnits + shrinkUnits, periodic, rounding) : book;

  const closingUnits = book.closingUnits;
  const closingCostBasis = book.closingCost;
  const nrvTotal = useNrv ? (period.nrvTotal ?? (period.nrvPerUnit !== undefined ? closingUnits * period.nrvPerUnit : undefined)) : undefined;
  let writeDown = 0;
  let reversal = 0;
  let closingCarrying = closingCostBasis;
  if (nrvTotal !== undefined) {
    const target = Math.min(withPrior ? orig.closingCost : closingCostBasis, nrvTotal);
    if (target < closingCostBasis - EPS) writeDown = closingCostBasis - target;
    else if (target > closingCostBasis + EPS) reversal = target - closingCostBasis;
    closingCarrying = target;
  }
  const scale = closingCostBasis > EPS ? closingCarrying / closingCostBasis : 1;
  const layers = book.layers.map((l) => ({ ...l, cost: l.cost * scale }));

  const saleRevenue = period.sales.map((s) => {
    const g = s.qty * (s.unitPrice ?? 0);
    return period.saleDiscount && s.qty > period.saleDiscount.threshold ? g * (1 - period.saleDiscount.pct) : g;
  });
  const grossSales = period.sales.reduce((s, x) => s + x.qty * (x.unitPrice ?? 0), 0);
  const saleQtyDiscounts = grossSales - saleRevenue.reduce((s, v) => s + v, 0);
  const custDiscounts = period.adjustments?.custDiscounts ?? 0;
  const custReturns = period.adjustments?.custReturns ?? 0;
  const netSales = grossSales - saleQtyDiscounts - custDiscounts - custReturns;
  const cogs = opening.cost + purchasesCost - closingCarrying;
  const grossProfit = netSales - cogs;
  return {
    label: period.label,
    method,
    system,
    costs,
    openingUnits: opening.units,
    openingCost: opening.cost,
    purchasesUnits,
    purchasesCost,
    availableUnits,
    availableCost: opening.cost + purchasesCost,
    soldUnits,
    shrinkUnits,
    shrinkCost: book.shrinkCost,
    closingUnits,
    closingCostBasis,
    nrvTotal,
    priorWriteDown: withPrior ? period.priorWriteDown! : 0,
    writeDown,
    reversal,
    closingCarrying,
    cogs,
    saleCosts: book.saleCosts,
    saleRevenue,
    grossSales,
    saleQtyDiscounts,
    custDiscounts,
    custReturns,
    netSales,
    grossProfit,
    gpPct: netSales ? grossProfit / netSales : 0,
    avgCost: book.avg,
    layers,
    ledger: book.ledger,
    errors: book.errors,
    warnings,
  };
}

/** Several years in a row: each year opens with last year's closing at its carrying amount (and, under FIFO, its layers). */
export function valuateChain(periods: Period[], method: Method, opts: ValuationOptions = {}): PeriodResult[] {
  const out: PeriodResult[] = [];
  for (const [i, p] of periods.entries()) {
    const prev = out[i - 1];
    const opening: Opening | undefined =
      i === 0 || p.ownOpening ? p.opening : { units: prev.closingUnits, cost: prev.closingCarrying, layers: method === "fifo" ? prev.layers.map((l) => ({ ...l })) : undefined };
    const priorWriteDown = i > 0 && opts.carryWriteDown && !p.ownOpening ? Math.max(0, prev.priorWriteDown - prev.reversal + prev.writeDown) : p.priorWriteDown;
    out.push(valuatePeriod({ ...p, opening, priorWriteDown }, method, opts));
  }
  return out;
}

/** The same years under each of the three formulas. */
export function compareMethods(periods: Period[], opts: ValuationOptions = {}): Record<Method, PeriodResult[]> {
  return Object.fromEntries(METHODS.map((m) => [m, valuateChain(periods, m, opts)])) as Record<Method, PeriodResult[]>;
}

/** Whether purchase costs per unit only rose, only fell, stayed flat, or moved both ways. */
export function priceTrend(period: Period): "up" | "down" | "flat" | "mixed" {
  const costs = period.purchases.map((p) => purchaseCost(p).perUnit);
  const o = period.opening;
  const seq = o && o.units > EPS ? [o.cost / o.units, ...costs] : costs;
  let up = false;
  let down = false;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] > seq[i - 1] + EPS) up = true;
    if (seq[i] < seq[i - 1] - EPS) down = true;
  }
  return up && down ? "mixed" : up ? "up" : down ? "down" : "flat";
}

// ---------------------------------------------------------------------------
// The statement down to gross profit (in the course's layout).

export type GrossProfitStatement = {
  grossSales: number;
  custDiscounts: number;
  custReturns: number;
  netSales: number;
  opening: number;
  grossPurchases: number;
  suppDiscounts: number;
  suppReturns: number;
  netPurchases: number;
  closing: number;
  cogs: number;
  grossProfit: number;
  gpPct: number;
  writeDown?: number;
  reversal?: number;
};

export function statement(r: PeriodResult): GrossProfitStatement {
  return {
    grossSales: r.grossSales,
    custDiscounts: r.saleQtyDiscounts + r.custDiscounts,
    custReturns: r.custReturns,
    netSales: r.netSales,
    opening: r.openingCost,
    grossPurchases: r.purchasesCost,
    suppDiscounts: 0,
    suppReturns: 0,
    netPurchases: r.purchasesCost,
    closing: r.closingCarrying,
    cogs: r.cogs,
    grossProfit: r.grossProfit,
    gpPct: r.gpPct,
    writeDown: r.writeDown || undefined,
    reversal: r.reversal || undefined,
  };
}

// ---------------------------------------------------------------------------
// Journal entries.

export type EntryOptions = { payable?: "ספקים" | "מזומן"; receivable?: "לקוחות" | "מזומן" };

/** The year's entries under either system, in time order (amounts rounded to agorot for display). */
export function entriesFor(period: Period, r: PeriodResult, system: System, opts: EntryOptions = {}): Entry[] {
  const pay = opts.payable ?? "ספקים";
  const rec = opts.receivable ?? "לקוחות";
  const { events } = timeline(period, r.costs, false);
  const out: Entry[] = [];
  let n = 0;
  const add = (date: string | undefined, text: string, lines: Entry["lines"], why?: string) => out.push({ id: String(++n), date: dateLabel(date), text, lines, why });
  for (const e of events) {
    if (e.kind === "buy") {
      const c = round2(r.costs[e.index].total);
      add(e.date, `${e.label}: ${fmtQty(e.units)} יח'`, [
        { account: system === "periodic" ? "קניות" : "מלאי", dr: c },
        { account: pay, cr: c },
      ]);
    } else if (e.kind === "sell") {
      const rev = round2(r.saleRevenue[e.index]);
      const cost = round2(r.saleCosts[e.index]);
      add(e.date, `${e.label}: ${fmtQty(e.units)} יח'`, [
        { account: rec, dr: rev },
        { account: "מכירות", cr: rev },
      ]);
      if (system === "perpetual")
        add(e.date, `עלות ${e.label}`, [
          { account: "עלות המכר", dr: cost },
          { account: "מלאי", cr: cost },
        ], "בשיטה תמידית — בכל מכירה מוציאים את העלות מהמלאי");
    }
  }
  if (system === "periodic") {
    const c = round2(r.closingCarrying);
    if (c > 0)
      add(undefined, "מלאי סגירה בסוף השנה", [
        { account: "מלאי סגירה מאזני", dr: c },
        { account: "מלאי סגירה רווח או הפסד", cr: c },
      ], r.writeDown ? "מלאי הסגירה נרשם בשווי מימוש נטו — הורדת הערך מגולמת בעלות המכר" : "פקודת ההתאמה של סוף השנה");
  } else {
    if (r.shrinkCost > 0.005) add(undefined, "חוסר בספירה", [{ account: "עלות המכר", dr: round2(r.shrinkCost) }, { account: "מלאי", cr: round2(r.shrinkCost) }]);
    if (r.writeDown > 0.005) add(undefined, "הורדת ערך לשווי מימוש נטו", [{ account: "עלות המכר", dr: round2(r.writeDown) }, { account: "מלאי", cr: round2(r.writeDown) }]);
    if (r.reversal > 0.005) add(undefined, "ביטול הורדת ערך", [{ account: "מלאי", dr: round2(r.reversal) }, { account: "עלות המכר", cr: round2(r.reversal) }]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Gross profit method, fire and insurance (IAS 2.22, and the course's claim questions).

export const gpRate = (netSales: number, cogs: number) => (netSales ? (netSales - cogs) / netSales : 0);

/** The retail method: cost of sales from the gross margin, closing inventory as the difference. */
export function grossProfitMethod(x: { netSales: number; rate: number; opening: number; purchases: number }) {
  const cogs = x.netSales * (1 - x.rate);
  return { cogs, grossProfit: x.netSales - cogs, closing: x.opening + x.purchases - cogs };
}

export type Deductible = { kind: "pct" | "fixed"; value: number };
export type ClaimTerms = { deductible?: Deductible; cap?: number; capBeforeDeductible?: boolean };
export type Settlement = { claim: number; deductible: number; capExcess: number; net: number; uncovered: number };

/** What the insurer pays for the burned stock: less the deductible, up to the cap (D10). */
export function settle(burned: number, t: ClaimTerms = {}): Settlement {
  const deductible = t.deductible ? (t.deductible.kind === "pct" ? burned * t.deductible.value : Math.min(burned, t.deductible.value)) : 0;
  let net: number;
  let capExcess = 0;
  if (t.cap !== undefined && t.capBeforeDeductible) {
    const base = Math.min(burned, t.cap);
    capExcess = burned - base;
    net = Math.max(0, base - deductible);
  } else {
    net = burned - deductible;
    if (t.cap !== undefined && net > t.cap) {
      capExcess = net - t.cap;
      net = t.cap;
    }
  }
  return { claim: burned, deductible, capExcess, net, uncovered: burned - net };
}

export const averageRate = (rates: number[], weights?: number[]) =>
  weights && weights.length === rates.length && weights.some((w) => w)
    ? rates.reduce((s, r, i) => s + r * weights[i], 0) / weights.reduce((s, w) => s + w, 0)
    : rates.reduce((s, r) => s + r, 0) / (rates.length || 1);

export type GpFireInput = {
  opening: number;
  purchases: number;
  sales: number;
  rates: number[];
  /** Weights for the average (sales of each year); simple average without them (D9). */
  weights?: number[];
  saved: number;
  /** The saved stock is given at selling price: convert to cost with the margin (D11). */
  savedAtPrice?: boolean;
  terms?: ClaimTerms;
};

export function gpFire(x: GpFireInput) {
  const rate = averageRate(x.rates, x.weights);
  const cogs = x.sales * (1 - rate);
  const atFire = x.opening + x.purchases - cogs;
  const savedCost = x.savedAtPrice ? x.saved * (1 - rate) : x.saved;
  const burned = atFire - savedCost;
  return { rate, cogs, grossProfit: x.sales - cogs, atFire, savedCost, burned, settlement: settle(burned, x.terms) };
}

export type HistoryFireInput = {
  /** Past years, then the current year up to the fire date. */
  periods: Period[];
  /** The policy's formula — not necessarily the company's. */
  method: Method;
  savedUnits: number;
  terms?: ClaimTerms;
  rounding?: Rounding;
  /** The day of the fire: dated purchases and sales after it are left out, and so are years that start after it. */
  fireDate?: string;
};

export type AfterFire = { label: string; date: string; kind: "buy" | "sell"; qty: number };

/** The history up to the fire: what happened after it isn't in the stock that burned. */
export function cutAtFire(periods: Period[], fireDate?: string): { periods: Period[]; after: AfterFire[] } {
  if (!fireDate) return { periods, after: [] };
  const after: AfterFire[] = [];
  const late = (d?: string) => !!d && d > fireDate;
  const cut = periods.map((p) => {
    for (const b of p.purchases) if (late(b.date)) after.push({ label: b.label ?? "רכישה", date: b.date!, kind: "buy", qty: b.qty });
    for (const s of p.sales) if (late(s.date)) after.push({ label: s.label ?? "מכירה", date: s.date!, kind: "sell", qty: s.qty });
    return { ...p, purchases: p.purchases.filter((b) => !late(b.date)), sales: p.sales.filter((s) => !late(s.date)) };
  });
  // A year whose every dated event came after the fire is past it; the last year left is the one with the fire.
  let end = cut.length;
  while (end > 1) {
    const orig = periods[end - 1];
    const dated = [...orig.purchases, ...orig.sales].filter((e) => e.date);
    if (dated.length && dated.every((e) => late(e.date)) && !cut[end - 1].purchases.length && !cut[end - 1].sales.length) end--;
    else break;
  }
  return { periods: cut.slice(0, end), after };
}

/** A claim by cost formula: the whole history recomputed by the policy's method, without NRV (R28). */
export function historyFire(x: HistoryFireInput) {
  const { periods, after } = cutAtFire(x.periods, x.fireDate);
  const chain = valuateChain(periods, x.method, { nrv: false, rounding: x.rounding });
  const last = chain[chain.length - 1];
  const unitsAtFire = last.closingUnits;
  const burnedUnits = Math.max(0, unitsAtFire - x.savedUnits);
  let burned: number;
  const slices: Slice[] = [];
  if (x.method === "fifo") {
    // What's left is the latest purchases, so the burned units come off the newest layers first.
    let need = burnedUnits;
    burned = 0;
    for (let i = last.layers.length - 1; i >= 0 && need > EPS; i--) {
      const l = last.layers[i];
      const u = Math.min(need, l.units);
      const c = (l.cost * u) / l.units;
      slices.unshift({ source: l.source, units: u, cost: c });
      burned += c;
      need -= u;
    }
  } else {
    burned = (last.avgCost ?? 0) * burnedUnits;
  }
  return { chain, unitsAtFire, costAtFire: last.closingCostBasis, burnedUnits, burned, slices, avg: x.method === "fifo" ? undefined : last.avgCost, settlement: settle(burned, x.terms), after, fireDate: x.fireDate };
}

/** FIFO layers after each event, for stepping through the shelf (perpetual order). */
export function fifoSnapshots(period: Period): { label: string; date?: string; kind: "open" | "buy" | "sell"; qty: number; layers: Layer[]; slices: Slice[] }[] {
  const costs = period.purchases.map(purchaseCost);
  const { events } = timeline(period, costs, false);
  const queue = openingLayers(period.opening ?? { units: 0, cost: 0 }, false);
  const out: ReturnType<typeof fifoSnapshots> = [{ label: "תחילת השנה", kind: "open", qty: period.opening?.units ?? 0, layers: queue.map((l) => ({ ...l })), slices: [] }];
  for (const e of events) {
    if (e.kind === "buy") {
      queue.push({ source: e.label, date: e.date, units: e.units, cost: e.cost, origCost: e.cost });
      out.push({ label: e.label, date: e.date, kind: "buy", qty: e.units, layers: queue.map((l) => ({ ...l })), slices: [] });
    } else if (e.kind === "sell") {
      const t = take(queue, e.units, partOf({ mode: "exact" }));
      out.push({ label: e.label, date: e.date, kind: "sell", qty: e.units, layers: queue.map((l) => ({ ...l })), slices: t.slices });
    }
  }
  return out;
}
