/**
 * The calculator's form: what the person typed, as strings, and its conversion
 * to the engine's periods, unknowns and knowns. No numbers are computed here
 * beyond parsing; everything else is the engine's.
 */

import { parseNumber } from "@/components/study/inputs";
import {
  type ClaimTerms,
  type DiscountRule,
  type ExtraBasis,
  type ExtraCategory,
  type ExtraCost,
  type Method,
  type Period,
  type Purchase,
  type Rounding,
  type Sale,
  type System,
} from "@/lib/learn/inventory";
import type { CalcExample, FireSetup } from "@/lib/learn/inventory-examples";
import { type Known, type Metric, TABLE_ROWS, type TableInput, type TableRow, type Unknown } from "@/lib/learn/inventory-solver";

export type F = { v: string; unknown: boolean };
export type DiscountForm = {
  kind: DiscountRule["kind"];
  threshold: string;
  pct: F;
  amount: string;
  from: string;
  to: string;
  controlled: boolean;
  expected: boolean;
  achieved: boolean;
  /** Added by the shared settings for all purchases; replaced when they are applied again. */
  global?: boolean;
};
export type ExtraForm = { category: ExtraCategory; label: string; amount: string; basis: ExtraBasis; packSize: string; kgPerUnit: string; include: "auto" | "in" | "out"; global?: boolean };
/** A purchase's own terms, without the purchase: what the shared terms hold. */
export type PurchaseTermsForm = Pick<PurchaseForm, "discounts" | "extras" | "financing">;
/** Terms that every purchase shares, typed once with the same options as a single purchase; any there are apply to all of them (`on` is kept for forms saved when it was a switch). */
export type PurchaseDefaults = { on: boolean; template: PurchaseTermsForm };
export type PurchaseForm = { id: string; date: string; qty: F; price: F; discounts: DiscountForm[]; financing: string; extras: ExtraForm[] };
export type SaleForm = { id: string; date: string; qty: F; price: F };
export type YearForm = {
  id: string;
  label: string;
  founded: boolean;
  fromPrev: boolean;
  openUnits: F;
  openCost: F;
  purchases: PurchaseForm[];
  sales: SaleForm[];
  /** "above": the question says only that NRV is above cost — nothing to write down. */
  nrvMode: "none" | "above" | "unit" | "build" | "total";
  nrvUnit: string;
  nrvPrice: string;
  nrvCompletion: string;
  nrvSelling: string;
  nrvTotal: string;
  fair: string;
  priorWriteDown: string;
  custDiscounts: string;
  custReturns: string;
  saleDiscThreshold: string;
  saleDiscPct: string;
  counted: string;
  /** The order the purchases and sales were typed in, by id; rows not listed follow. */
  order?: string[];
};
export type KnownForm = { id: string; year: number; metric: Metric; index: string; value: string; /** For a change in margin: up or down on last year. */ dir?: "up" | "down" };
export type TableForm = {
  years: { label: string; founded: boolean; soldPct: string; cells: Record<TableRow, string>; gpDelta?: string; gpDir?: "up" | "down" }[];
  chain: boolean;
};
export type FireForm = {
  basis: "gp" | "history";
  gpYears: { label: string; netSales: string; cogs: string }[];
  weighted: boolean;
  opening: string;
  purchases: string;
  sales: string;
  saved: string;
  savedAtPrice: boolean;
  policy: Method;
  savedUnits: string;
  /** The day of the fire, ISO; purchases and sales after it are left out of the claim. */
  fireDate?: string;
  dedKind: "pct" | "fixed";
  dedValue: string;
  cap: string;
  capBefore: boolean;
  retail: { netSales: string; rate: string; opening: string; purchases: string };
};

export type Tab = "full" | "table" | "fire";
/** The full question's three steps: the data, the events and givens, the results. */
export const STEP_COUNT = 3;

export type CalcState = {
  v: 1;
  tab: Tab;
  step: number;
  company: string;
  method: Method | "compare";
  system: System;
  rounding: "exact" | "unit" | "amount";
  roundDigits: string;
  carryWriteDown: boolean;
  salesFirst: boolean;
  years: YearForm[];
  activeYear: number;
  knowns: KnownForm[];
  payable: "ספקים" | "מזומן";
  receivable: "לקוחות" | "מזומן";
  table: TableForm;
  fire: FireForm;
  example: string;
  defaults?: PurchaseDefaults;
  /** A fire (or other loss) during the last year, claimed from the history typed in the question. */
  fireEvent?: boolean;
};

let seq = 0;
export const uid = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;
const f = (v: number | undefined | null, unknown = false): F => ({ v: v === undefined || v === null ? "" : String(v), unknown });
const s = (v: number | undefined) => (v === undefined ? "" : String(v));

export const emptyDiscount = (): DiscountForm => ({ kind: "qty-whole", threshold: "", pct: f(undefined), amount: "", from: "", to: "", controlled: false, expected: false, achieved: false });
export const emptyExtra = (category: ExtraCategory, basis: ExtraBasis = "per-unit"): ExtraForm => ({ category, label: "", amount: "", basis, packSize: "", kgPerUnit: "", include: "auto" });
export const emptyPurchase = (): PurchaseForm => ({ id: uid(), date: "", qty: f(undefined), price: f(undefined), discounts: [], financing: "", extras: [] });
export const emptyDefaults = (): PurchaseDefaults => ({ on: false, template: { discounts: [], extras: [], financing: "" } });
/** The shared terms of a saved form, whatever version saved it. */
export const defaultsOf = (st: Pick<CalcState, "defaults">): PurchaseDefaults => ({ ...emptyDefaults(), ...st.defaults, template: { ...emptyDefaults().template, ...st.defaults?.template } });

/** A purchase with the shared terms after its own: its own discounts and extras first, then the shared ones. */
export function applyDefaults(p: PurchaseForm, d: PurchaseDefaults): PurchaseForm {
  const t = d.template;
  return {
    ...p,
    discounts: [...p.discounts.filter((x) => !x.global), ...t.discounts.map((x) => ({ ...x, global: true }))],
    extras: [...p.extras.filter((x) => !x.global), ...t.extras.map((x) => ({ ...x, global: true }))],
    financing: t.financing.trim() ? t.financing : p.financing,
  };
}

export const emptySale = (): SaleForm => ({ id: uid(), date: "", qty: f(undefined), price: f(undefined) });
export const emptyYear = (label: string, first: boolean): YearForm => ({
  id: uid(),
  label,
  founded: first,
  fromPrev: !first,
  openUnits: f(undefined),
  openCost: f(undefined),
  purchases: [],
  sales: [],
  nrvMode: "none",
  nrvUnit: "",
  nrvPrice: "",
  nrvCompletion: "",
  nrvSelling: "",
  nrvTotal: "",
  fair: "",
  priorWriteDown: "",
  custDiscounts: "",
  custReturns: "",
  saleDiscThreshold: "",
  saleDiscPct: "",
  counted: "",
});

const emptyCells = () => Object.fromEntries(TABLE_ROWS.map((r) => [r, ""])) as Record<TableRow, string>;
export const emptyTable = (): TableForm => ({ years: [{ label: "שנה 1", founded: true, soldPct: "", cells: emptyCells() }], chain: true });
export const emptyFire = (): FireForm => ({
  basis: "gp",
  gpYears: [{ label: "שנה קודמת", netSales: "", cogs: "" }],
  weighted: false,
  opening: "",
  purchases: "",
  sales: "",
  saved: "",
  savedAtPrice: false,
  policy: "fifo",
  savedUnits: "",
  dedKind: "pct",
  dedValue: "",
  cap: "",
  capBefore: false,
  retail: { netSales: "", rate: "", opening: "", purchases: "" },
});

export function emptyState(): CalcState {
  return {
    v: 1,
    tab: "full",
    step: 0,
    company: "",
    method: "fifo",
    system: "periodic",
    rounding: "exact",
    roundDigits: "2",
    carryWriteDown: false,
    salesFirst: false,
    years: [emptyYear(String(new Date().getFullYear()), true)],
    activeYear: 0,
    knowns: [],
    payable: "ספקים",
    receivable: "לקוחות",
    table: emptyTable(),
    fire: emptyFire(),
    example: "",
  };
}

// ---------------------------------------------------------------------------
// Quick entry: short dates, and a question's table pasted as text.

/** The year a short date like "5.1" belongs to: the year's label when it is a year, else this year. */
export const yearOf = (y: Pick<YearForm, "label">) => (/^\d{4}$/.test(y.label.trim()) ? y.label.trim() : String(new Date().getFullYear()));

/** "5.1", "5/1", "5.1.25" or "5.1.2025" → an ISO date; "" for an empty cell; null when it isn't a date. */
export function parseDay(text: string, year: string): string | null {
  const t = text.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2}|\d{4}))?$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  const yr = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : year;
  return `${yr}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** An ISO date as the question writes it: "5.1", with the year only when it isn't the question's. */
export function showDay(iso: string, year: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const dm = `${Number(m[3])}.${Number(m[2])}`;
  return m[1] === year ? dm : `${dm}.${m[1]}`;
}

export type PastedMove = { kind: "buy" | "sell"; date: string; qty: F; price: F };

/**
 * A question's table, pasted line by line: each line a purchase or a sale, a date
 * if there is one, then the quantity and the price ("?" for an unknown).
 */
export function parseMoves(text: string, year: string): { moves: PastedMove[]; skipped: string[] } {
  const moves: PastedMove[] = [];
  const skipped: string[] = [];
  const cell = (x?: string): F => (x === "?" ? { v: "", unknown: true } : { v: x ?? "", unknown: false });
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const kind = /מכ|נמכר|sale|sell|sold/i.test(line) ? "sell" : /קנ|רכ|נקנ|buy|bought|purchase/i.test(line) ? "buy" : null;
    const dm = line.match(/\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?/);
    const date = dm ? (parseDay(dm[0], year) ?? "") : "";
    const rest = dm ? line.replace(dm[0], " ") : line;
    const nums = [...rest.matchAll(/\?|\d[\d,]*(?:\.\d+)?/g)].map((x) => x[0].replace(/,/g, ""));
    if (!kind || !nums.length) {
      skipped.push(line);
      continue;
    }
    moves.push({ kind, date, qty: cell(nums[0]), price: cell(nums[1]) });
  }
  return { moves, skipped };
}

// ---------------------------------------------------------------------------
// Loading an example.

const pctStr = (v: number) => String(Math.round(v * 1e8) / 1e6);

function discountForm(r: DiscountRule, unknown: boolean): DiscountForm {
  const base = { ...emptyDiscount(), kind: r.kind, from: r.from ?? "", to: r.to ?? "" };
  switch (r.kind) {
    case "qty-whole":
    case "qty-excess":
      return { ...base, threshold: String(r.threshold), pct: { v: unknown ? "" : pctStr(r.pct), unknown } };
    case "per-unit-above":
      return { ...base, threshold: String(r.afterUnit), amount: String(r.amountPerUnit) };
    case "target":
      return { ...base, pct: { v: unknown ? "" : pctStr(r.pct), unknown }, controlled: r.companyControlled, expected: r.expected, achieved: r.achieved };
  }
}

function yearForm(p: Period, t: number, us: Unknown[]): YearForm {
  const isU = (ref: (u: Unknown["ref"]) => boolean) => us.some((u) => u.ref.year === t && ref(u.ref));
  const pctUnknown = isU((r) => r.t === "discountPct");
  const y = emptyYear(p.label, t === 0 && !p.opening?.units);
  return {
    ...y,
    founded: t === 0 && !(p.opening && p.opening.units),
    fromPrev: t > 0 && !p.ownOpening,
    openUnits: f(p.opening?.units, isU((r) => r.t === "opening" && r.field === "units")),
    openCost: f(p.opening?.cost, isU((r) => r.t === "opening" && r.field === "cost")),
    purchases: p.purchases.map((x, i) => {
      const qU = isU((r) => r.t === "purchase" && r.index === i && r.field === "qty");
      const pU = isU((r) => r.t === "purchase" && r.index === i && r.field === "unitPrice");
      return {
        id: uid(),
        date: x.date ?? "",
        qty: f(qU ? undefined : x.qty, qU),
        price: f(pU ? undefined : x.unitPrice, pU),
        discounts: (x.discounts ?? []).map((d) => discountForm(d, pctUnknown && "shared" in d && !!d.shared)),
        financing: x.financingPct ? pctStr(x.financingPct) : "",
        extras: (x.extras ?? []).map((e) => ({
          category: e.category,
          label: e.label ?? "",
          amount: e.basis === "pct-of-net-price" ? pctStr(e.amount) : String(e.amount),
          basis: e.basis,
          packSize: s(e.packSize),
          kgPerUnit: s(e.kgPerUnit),
          include: e.include === undefined ? "auto" : e.include ? "in" : "out",
        })),
      };
    }),
    sales: p.sales.map((x, i) => {
      const qU = isU((r) => r.t === "sale" && r.index === i && r.field === "qty");
      const pU = isU((r) => r.t === "sale" && r.index === i && r.field === "unitPrice");
      return { id: uid(), date: x.date ?? "", qty: f(qU ? undefined : x.qty, qU), price: f(pU ? undefined : x.unitPrice, pU) };
    }),
    nrvMode: p.nrvTotal !== undefined ? "total" : p.nrvPerUnit !== undefined ? "unit" : "none",
    nrvUnit: s(p.nrvPerUnit),
    nrvTotal: s(p.nrvTotal),
    priorWriteDown: s(p.priorWriteDown),
    custDiscounts: s(p.adjustments?.custDiscounts),
    custReturns: s(p.adjustments?.custReturns),
    saleDiscThreshold: s(p.saleDiscount?.threshold),
    saleDiscPct: p.saleDiscount ? pctStr(p.saleDiscount.pct) : "",
    counted: s(p.countedUnits),
  };
}

function tableForm(t: TableInput): TableForm {
  return {
    chain: t.chainOpening ?? true,
    years: t.years.map((y) => ({
      label: y.label,
      founded: !!y.founded,
      soldPct: y.cogsPctOfPurchases ? pctStr(y.cogsPctOfPurchases) : "",
      gpDelta: y.gpPctDelta ? pctStr(Math.abs(y.gpPctDelta)) : "",
      gpDir: y.gpPctDelta && y.gpPctDelta < 0 ? "down" : "up",
      cells: Object.fromEntries(TABLE_ROWS.map((r) => {
        const c = y.cells[r];
        return [r, c === "?" ? "?" : typeof c === "number" ? (r === "gpPct" ? pctStr(c) : String(c)) : ""];
      })) as Record<TableRow, string>,
    })),
  };
}

function fireForm(x: FireSetup): FireForm {
  const base = emptyFire();
  if (x.basis === "history")
    return {
      ...base,
      basis: "history",
      policy: x.method,
      savedUnits: String(x.savedUnits),
      fireDate: x.fireDate ?? "",
      dedKind: x.terms?.deductible?.kind ?? "pct",
      dedValue: x.terms?.deductible ? (x.terms.deductible.kind === "pct" ? pctStr(x.terms.deductible.value) : String(x.terms.deductible.value)) : "",
      cap: s(x.terms?.cap),
      capBefore: !!x.terms?.capBeforeDeductible,
    };
  const t = x.input.terms;
  return {
    ...base,
    basis: "gp",
    gpYears: x.years.map((y) => ({ label: y.label, netSales: String(y.netSales), cogs: String(y.cogs) })),
    weighted: !!x.input.weights,
    opening: String(x.input.opening),
    purchases: String(x.input.purchases),
    sales: String(x.input.sales),
    saved: String(x.input.saved),
    savedAtPrice: !!x.input.savedAtPrice,
    dedKind: t?.deductible?.kind ?? "pct",
    dedValue: t?.deductible ? (t.deductible.kind === "pct" ? pctStr(t.deductible.value) : String(t.deductible.value)) : "",
    cap: s(t?.cap),
    capBefore: !!t?.capBeforeDeductible,
  };
}

export function fromExample(e: CalcExample): CalcState {
  const st = emptyState();
  const us = e.unknowns ?? [];
  const r = e.rounding;
  const years = e.periods ? e.periods.map((p, t) => yearForm(p, t, us)) : st.years;
  // Terms every purchase shares are shown once, in the shared panel, as a student would type them.
  const first = years.find((y) => y.purchases.length)?.purchases[0];
  const defaults: PurchaseDefaults | undefined =
    e.sharedTerms && first ? { on: true, template: { discounts: first.discounts, extras: first.extras, financing: first.financing } } : undefined;
  return {
    ...st,
    example: e.id,
    company: e.title.split(" — ")[0],
    method: e.method ?? "fifo",
    system: e.system ?? "periodic",
    rounding: r?.mode ?? "exact",
    roundDigits: r && r.mode !== "exact" ? String(r.digits) : "2",
    carryWriteDown: !!e.carryWriteDown,
    years: defaults ? years.map((y) => ({ ...y, purchases: y.purchases.map((p) => ({ ...p, discounts: [], extras: [], financing: "" })) })) : years,
    defaults,
    knowns: (e.knowns ?? []).map((k) => ({
      id: uid(),
      year: k.year,
      metric: k.metric,
      index: k.index === undefined ? "" : String(k.index + 1),
      value: k.metric === "gpPct" ? pctStr(k.value) : k.metric === "gpPctChange" ? pctStr(Math.abs(k.value)) : String(k.value),
      dir: k.metric === "gpPctChange" && k.value < 0 ? "down" : "up",
    })),
    table: e.table ? tableForm(e.table) : st.table,
    fire: e.fire ? fireForm(e.fire) : st.fire,
    // A loaded example opens on its answer; a fire claimed by a cost formula is an event of the same question.
    tab: e.fire?.basis === "history" ? "full" : e.tab,
    fireEvent: e.fire?.basis === "history",
    step: STEP_COUNT - 1,
  };
}


// ---------------------------------------------------------------------------
// Form → engine.

export type Built = {
  periods: Period[];
  unknowns: Unknown[];
  knowns: Known[];
  errors: Record<string, string>;
  /** Unknown field keys → their letter. */
  letters: Record<string, string>;
  rounding: Rounding;
};

const LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'"];
const num = (x: string) => parseNumber(x.replace(/\s/g, "").replace(/−/g, "-"));

/** Hebrew validation, by field key. */
export function build(st: CalcState): Built {
  const errors: Record<string, string> = {};
  const unknowns: Unknown[] = [];
  const letters: Record<string, string> = {};
  const perpetual = (st.method === "moving-avg" || (st.method !== "wa-periodic" && st.system === "perpetual"));
  const addU = (key: string, label: string, ref: Unknown["ref"], guess: number) => {
    const letter = LETTERS[unknowns.length] ?? String(unknowns.length + 1);
    letters[key] = letter;
    unknowns.push({ id: key, label: `נעלם ${letter} — ${label}`, ref, guess });
  };
  const amount = (key: string, x: string, opts: { min?: number; pct?: boolean; required?: boolean; positive?: boolean } = {}) => {
    if (x.trim() === "") {
      if (opts.required) errors[key] = "שדה חובה.";
      return undefined;
    }
    const v = num(x);
    if (!Number.isFinite(v)) {
      errors[key] = "הזינו מספר.";
      return undefined;
    }
    if (Math.abs(v) > 1e12) errors[key] = "הסכום גדול מדי.";
    else if (opts.pct && (v < 0 || v > 100)) errors[key] = "אחוז חייב להיות בין 0 ל-100.";
    else if (opts.positive && v <= 0) errors[key] = "הזינו כמות חיובית.";
    else if (opts.min !== undefined && v < opts.min) errors[key] = "מחיר לא יכול להיות שלילי.";
    return opts.pct ? v / 100 : v;
  };

  // Shared terms, while switched on, sit on every purchase as if typed in each one; their errors belong to the shared panel ("tpl.").
  const d = defaultsOf(st);
  const shared = d.template.discounts.length || d.template.extras.length || d.template.financing.trim() ? d : null;
  let discAdded = false;
  const periods: Period[] = st.years.map((y, t) => {
    // With more than one year, "sale 1" needs its year to say which.
    const inYear = st.years.length > 1 ? ` ב-${y.label || `שנה ${t + 1}`}` : "";
    const k = (s: string) => `y${t}.${s}`;
    const ps = shared ? y.purchases.map((p) => applyDefaults(p, shared)) : y.purchases;
    const purchases: Purchase[] = ps.map((p, i) => {
      const pk = (s: string) => k(`p${i}.${s}`);
      const ownD = p.discounts.filter((x) => !x.global).length;
      const ownE = p.extras.filter((x) => !x.global).length;
      if (perpetual && !p.date) errors[pk("date")] = "בשיטה תמידית הסדר הכרונולוגי קובע — הזינו תאריך לכל שורה.";
      let qty = 0;
      let price = 0;
      if (p.qty.unknown) addU(pk("qty"), `כמות ברכישה ${i + 1}${inYear}`, { t: "purchase", year: t, index: i, field: "qty" }, num(p.qty.v) || 100);
      else qty = amount(pk("qty"), p.qty.v, { positive: true, required: true }) ?? 0;
      if (p.price.unknown) addU(pk("price"), `מחיר ליחידה ברכישה ${i + 1}${inYear}`, { t: "purchase", year: t, index: i, field: "unitPrice" }, num(p.price.v) || 10);
      else price = amount(pk("price"), p.price.v, { min: 0, required: true }) ?? 0;
      const discounts: DiscountRule[] = p.discounts.map((d, j) => {
        const dk = (s: string) => (d.global ? `tpl.d${j - ownD}.${s}` : pk(`d${j}.${s}`));
        const from = d.from || undefined;
        const to = d.to || undefined;
        const pct = d.pct.unknown ? 0.05 : (amount(dk("pct"), d.pct.v, { pct: true, required: d.kind !== "per-unit-above" }) ?? 0);
        const threshold = amount(dk("threshold"), d.threshold, { min: 0 }) ?? 0;
        switch (d.kind) {
          case "qty-whole":
          case "qty-excess":
            return { kind: d.kind, threshold, pct, shared: d.pct.unknown, from, to };
          case "per-unit-above":
            return { kind: "per-unit-above", afterUnit: threshold, amountPerUnit: amount(dk("amount"), d.amount, { min: 0, required: true }) ?? 0, from, to };
          case "target":
            return { kind: "target", pct, companyControlled: d.controlled, expected: d.expected, achieved: d.achieved, shared: d.pct.unknown, from, to };
        }
      });
      const extras: ExtraCost[] = p.extras.map((e, j) => {
        const ek = (s: string) => (e.global ? `tpl.e${j - ownE}.${s}` : pk(`e${j}.${s}`));
        const isPct = e.basis === "pct-of-net-price";
        return {
          category: e.category,
          label: e.label || undefined,
          amount: amount(ek("amount"), e.amount, { min: 0, required: true, pct: isPct }) ?? 0,
          basis: e.basis,
          packSize: e.basis === "per-pack" ? amount(ek("packSize"), e.packSize, { positive: true, required: true }) : undefined,
          kgPerUnit: e.basis === "per-kg" ? amount(ek("kg"), e.kgPerUnit, { positive: true, required: true }) : undefined,
          include: e.include === "auto" ? undefined : e.include === "in",
        };
      });
      const financingPct = amount(shared?.template.financing.trim() ? "tpl.financing" : pk("financing"), p.financing, { pct: true });
      return { id: p.id, label: `רכישה ${i + 1}${p.date ? ` (${p.date.split("-").reverse().map((x, n) => (n < 2 ? String(Number(x)) : x)).join(".")})` : ""}`, date: p.date || undefined, qty, unitPrice: price, discounts, financingPct, extras };
    });
    // A rate marked "?" is the question's one rate: "a fixed rate in every such purchase", whatever the year.
    if (!discAdded && ps.some((p) => p.discounts.some((d) => d.pct.unknown))) {
      discAdded = true;
      addU("disc", "שיעור ההנחה", { t: "discountPct", year: t, allYears: true }, 0.05);
    }
    const sales: Sale[] = y.sales.map((x, i) => {
      const sk = (s: string) => k(`s${i}.${s}`);
      if (perpetual && !x.date) errors[sk("date")] = "בשיטה תמידית הסדר הכרונולוגי קובע — הזינו תאריך לכל שורה.";
      let qty = 0;
      let price: number | undefined;
      if (x.qty.unknown) addU(sk("qty"), `כמות במכירה ${i + 1}${inYear}`, { t: "sale", year: t, index: i, field: "qty" }, num(x.qty.v) || 100);
      else qty = amount(sk("qty"), x.qty.v, { positive: true, required: true }) ?? 0;
      if (x.price.unknown) {
        addU(sk("price"), `מחיר המכירה במכירה ${i + 1}${inYear}`, { t: "sale", year: t, index: i, field: "unitPrice" }, num(x.price.v) || 10);
        price = 0;
      } else price = amount(sk("price"), x.price.v, { min: 0 });
      return { id: x.id, label: `מכירה ${i + 1}${x.date ? ` (${x.date.split("-").reverse().map((v, n) => (n < 2 ? String(Number(v)) : v)).join(".")})` : ""}`, date: x.date || undefined, qty, unitPrice: price };
    });
    const ownOpening = t === 0 || !y.fromPrev;
    let opening: Period["opening"];
    if (ownOpening && !(t === 0 && y.founded)) {
      let units = 0;
      let cost = 0;
      if (y.openUnits.unknown) addU(k("openUnits"), `יחידות במלאי הפתיחה (${y.label})`, { t: "opening", year: t, field: "units" }, num(y.openUnits.v) || 100);
      else units = amount(k("openUnits"), y.openUnits.v, { min: 0 }) ?? 0;
      if (y.openCost.unknown) addU(k("openCost"), `עלות מלאי הפתיחה (${y.label})`, { t: "opening", year: t, field: "cost" }, num(y.openCost.v) || 1000);
      else cost = amount(k("openCost"), y.openCost.v, { min: 0 }) ?? 0;
      opening = { units, cost };
    } else if (t === 0) opening = { units: 0, cost: 0 };
    let nrvPerUnit: number | undefined;
    let nrvTotal: number | undefined;
    if (y.nrvMode === "unit") nrvPerUnit = amount(k("nrvUnit"), y.nrvUnit, { required: true });
    if (y.nrvMode === "total") nrvTotal = amount(k("nrvTotal"), y.nrvTotal, { min: 0, required: true });
    if (y.nrvMode === "build") {
      const pr = amount(k("nrvPrice"), y.nrvPrice, { min: 0, required: true }) ?? 0;
      nrvPerUnit = pr - (amount(k("nrvCompletion"), y.nrvCompletion, { min: 0 }) ?? 0) - (amount(k("nrvSelling"), y.nrvSelling, { min: 0 }) ?? 0);
    }
    const thr = amount(k("sdThr"), y.saleDiscThreshold, { min: 0 }) ?? (y.saleDiscPct.trim() ? 0 : undefined);
    const sdp = amount(k("sdPct"), y.saleDiscPct, { pct: true });
    return {
      id: y.id,
      label: y.label || `שנה ${t + 1}`,
      opening,
      ownOpening: t > 0 && ownOpening,
      purchases,
      sales,
      nrvPerUnit,
      nrvTotal,
      priorWriteDown: amount(k("prior"), y.priorWriteDown, { min: 0 }) || undefined,
      adjustments: { custDiscounts: amount(k("custDisc"), y.custDiscounts, { min: 0 }), custReturns: amount(k("custRet"), y.custReturns, { min: 0 }) },
      saleDiscount: thr !== undefined && sdp ? { threshold: thr, pct: sdp } : undefined,
      countedUnits: amount(k("counted"), y.counted, { min: 0 }),
    };
  });

  const knowns: Known[] = [];
  for (const [i, x] of st.knowns.entries()) {
    const key = `k${i}`;
    const change = x.metric === "gpPctChange";
    const samePrice = x.metric === "salePriceChange";
    if ((change || samePrice) && x.year === 0) errors[key] = "נתון לעומת השנה הקודמת צריך שנה קודמת — בחרו שנה שנייה ואילך.";
    // "At the same price as last year" has no number to type: the difference is nil.
    const raw = samePrice ? 0 : amount(key, x.value, { required: true, pct: x.metric === "gpPct" || change });
    const v = raw !== undefined && change && x.dir === "down" ? -raw : raw;
    const needsIndex = x.metric === "saleCost" || x.metric === "saleRevenue" || samePrice || x.metric === "purchaseDiscount" || x.metric === "purchaseTotal";
    const idx = needsIndex ? amount(`${key}.idx`, x.index, { positive: true, required: true }) : undefined;
    if (x.year >= st.years.length) errors[key] = "השנה הוסרה.";
    else if (idx !== undefined && Number.isInteger(idx) && idx >= 1) {
      // The row it names must be there: "sale 2" in a year with one sale has nothing to pin.
      const bySale = x.metric === "saleCost" || x.metric === "saleRevenue" || samePrice;
      const y = st.years[x.year];
      const count = bySale ? y.sales.length : y.purchases.length;
      const what = count === 1 ? (bySale ? "מכירה אחת" : "רכישה אחת") : `${count} ${bySale ? "מכירות" : "רכישות"}`;
      if (idx > count) errors[`${key}.idx`] = count ? `ב-${y.label} יש רק ${what} — אין ${bySale ? "מכירה" : "רכישה"} מס׳ ${idx}.` : `ב-${y.label} עוד אין ${bySale ? "מכירות" : "רכישות"} בטבלה.`;
    } else if (idx !== undefined) errors[`${key}.idx`] = "מספר שורה שלם (1, 2, …).";
    if (v !== undefined) knowns.push({ year: x.year, metric: x.metric, index: idx !== undefined ? idx - 1 : undefined, value: v });
  }
  const digits = Number(st.roundDigits) || 0;
  const rounding: Rounding = st.rounding === "exact" ? { mode: "exact" } : { mode: st.rounding, digits };
  return { periods, unknowns, knowns, errors, letters, rounding };
}

export type TableCell = number | "?" | null;
export function buildTable(t: TableForm): { input: TableInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const years = t.years.map((y, i) => ({
    label: y.label || `שנה ${i + 1}`,
    founded: i === 0 && y.founded,
    cogsPctOfPurchases: y.soldPct.trim() ? num(y.soldPct) / 100 : undefined,
    gpPctDelta: i > 0 && (y.gpDelta ?? "").trim() && Number.isFinite(num(y.gpDelta!)) ? ((y.gpDir === "down" ? -1 : 1) * num(y.gpDelta!)) / 100 : undefined,
    cells: Object.fromEntries(
      TABLE_ROWS.map((r) => {
        const raw = y.cells[r].trim();
        if (raw === "") return [r, null];
        if (raw === "?") return [r, "?"];
        if (raw === "-" || raw === "—" || raw === "–") return [r, 0];
        const v = num(raw);
        if (!Number.isFinite(v)) {
          errors[`${i}.${r}`] = "מספר, ? או —";
          return [r, null];
        }
        return [r, r === "gpPct" ? v / 100 : v];
      }),
    ) as Record<TableRow, TableCell>,
  }));
  return { input: { years, chainOpening: t.chain }, errors };
}

// ---------------------------------------------------------------------------
// Storage: the form is kept per browser; storage can be blocked, so it is guarded.

const KEY = "afik.inventory.calc.v1";

export function loadState(): CalcState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const x = JSON.parse(raw) as CalcState;
    if (x?.v !== 1 || !Array.isArray(x.years) || !x.table || !x.fire) return null;
    // Saved when the calculator had a longer questionnaire.
    if (!(x.step >= 0 && x.step < STEP_COUNT)) x.step = 0;
    // A claim by cost formula was once a mode of the margin tab; it is now the fire event of the full question.
    if (x.fireEvent === undefined && x.fire.basis === "history") {
      x.fireEvent = true;
      if (x.tab === "fire") x.tab = "full";
    }
    return x;
  } catch {
    return null;
  }
}

export function saveState(st: CalcState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    // Storage blocked: the form lasts until the page is closed.
  }
}

// ---------------------------------------------------------------------------
// The fire claim's terms, shared by the fire event and the margin tools.

/** An optional number as typed: undefined when empty or not a number. */
export const optNum = (x: string) => {
  const v = num(x);
  return x.trim() === "" || !Number.isFinite(v) ? undefined : v;
};

export function claimTerms(f: FireForm): ClaimTerms {
  const d = optNum(f.dedValue);
  return {
    deductible: d === undefined ? undefined : { kind: f.dedKind, value: f.dedKind === "pct" ? d / 100 : d },
    // No policy caps a claim at nothing: a 0 typed in the ceiling means there is none.
    cap: (optNum(f.cap) ?? 0) > 0 ? optNum(f.cap) : undefined,
    capBeforeDeductible: f.capBefore,
  };
}
