/**
 * Depreciation schedules for the IAS 16 learning lab.
 *
 * Every time-based method works the same way: first a charge per *life year* (a
 * 12-month block that starts when the asset is available for use), then each
 * fiscal year takes its share of the one or two life years that overlap it:
 *
 *   FY_1 = D_1 · m/12,   FY_t = D_{t-1} · (12 − m)/12 + D_t · m/12
 *
 * where m is the number of whole months in the first fiscal year: from the month
 * the asset became available for use (counted in full) through December. This is the same block model the engine uses, so the lab and the
 * calculator agree to the shekel.
 */

export type Basics = {
  cost: number;
  salvage: number;
  /** Useful life in whole years. */
  life: number;
  /** Month (1–12) the asset became available for use. */
  startMonth: number;
};

export type SydDirection = "desc" | "asc";

/** One life year: its charge and, for declining balance, the balance it was computed on. */
export type LifeYear = {
  k: number;
  charge: number;
  /** Declining balance: carrying amount at the start of the life year. */
  opening?: number;
  /** SYD: the weight's numerator (n − k + 1, or k). */
  weight?: number;
  /** Declining balance: the salvage floor cut this year's charge (`floor`), or the last year was trued up to salvage (`final`). */
  cut?: "floor" | "final";
};

export type Part = { k: number; months: number; amount: number };

export type FiscalRow = {
  year: number;
  /** The life-year shares that make up this fiscal year's charge. */
  parts: Part[];
  /** Units of production: units used this year. */
  units?: number;
  opening: number;
  charge: number;
  accumulated: number;
  closing: number;
  /** A salvage cap shaped this row. */
  capped: boolean;
};

export type Schedule = { lifeYears: LifeYear[]; rows: FiscalRow[] };

const EPS = 0.005;

/** Whole months of use in the first fiscal year: a full year less the months that passed before the asset was available. */
export const firstYearMonths = (startMonth: number) => 12 - (startMonth - 1);

export const depreciableAmount = ({ cost, salvage }: Basics) => cost - salvage;

/** S = n(n + 1) / 2 */
export const sydDenominator = (n: number) => (n * (n + 1)) / 2;

/** The rate that brings cost down to salvage in exactly n years: r = 1 − ⁿ√(S / C). Undefined when salvage is 0. */
export const exactDbRate = ({ cost, salvage, life }: Basics) => (salvage > 0 ? 1 - Math.pow(salvage / cost, 1 / life) : null);

export function straightLineYears(b: Basics): LifeYear[] {
  const annual = depreciableAmount(b) / b.life;
  return Array.from({ length: b.life }, (_, i) => ({ k: i + 1, charge: annual }));
}

export function sydYears(b: Basics, direction: SydDirection): LifeYear[] {
  const s = sydDenominator(b.life);
  const base = depreciableAmount(b);
  return Array.from({ length: b.life }, (_, i) => {
    const weight = direction === "desc" ? b.life - i : i + 1;
    return { k: i + 1, weight, charge: (base * weight) / s };
  });
}

/**
 * A fixed rate on the opening carrying amount of each life year. Salvage is not
 * deducted from the base; it is a floor. The year the charge would cross it, the
 * charge is cut to the gap, and the last year is always trued up to salvage.
 */
export function decliningYears(b: Basics, rate: number): LifeYear[] {
  const out: LifeYear[] = [];
  let ca = b.cost;
  for (let k = 1; k <= b.life; k++) {
    const opening = ca;
    const natural = opening * rate;
    let charge = natural;
    let cut: LifeYear["cut"];
    if (opening - natural < b.salvage - EPS) {
      charge = Math.max(0, opening - b.salvage);
      cut = "floor";
    } else if (k === b.life) {
      charge = opening - b.salvage;
      if (Math.abs(charge - natural) > EPS) cut = "final";
    }
    out.push({ k, opening, charge, cut });
    ca -= charge;
  }
  return out;
}

/** Spreads life-year charges over fiscal years: m months of life year t, then 12 − m of it in the next fiscal year. */
export function toFiscal(b: Basics, lifeYears: LifeYear[]): FiscalRow[] {
  const m = firstYearMonths(b.startMonth);
  const years = m === 12 ? b.life : b.life + 1;
  const rows: FiscalRow[] = [];
  let acc = 0;
  for (let t = 1; t <= years; t++) {
    const parts: Part[] = [];
    const prev = lifeYears[t - 2];
    const curr = lifeYears[t - 1];
    if (prev && m < 12) parts.push({ k: prev.k, months: 12 - m, amount: (prev.charge * (12 - m)) / 12 });
    if (curr) parts.push({ k: curr.k, months: m, amount: (curr.charge * m) / 12 });
    const charge = parts.reduce((s, p) => s + p.amount, 0);
    const opening = b.cost - acc;
    acc += charge;
    rows.push({
      year: t,
      parts,
      opening,
      charge,
      accumulated: acc,
      closing: b.cost - acc,
      capped: !!(prev?.cut || curr?.cut),
    });
  }
  return rows;
}

/**
 * Units of production: a rate per unit times the units used each year. Time does
 * not matter, so there is no proration; once total units are used up, the charge
 * stops at salvage.
 */
export function unitsSchedule(b: Basics, totalUnits: number, units: number[]): Schedule {
  const rate = depreciableAmount(b) / totalUnits;
  const rows: FiscalRow[] = [];
  let acc = 0;
  units.forEach((u, i) => {
    const opening = b.cost - acc;
    const natural = rate * u;
    const charge = Math.max(0, Math.min(natural, opening - b.salvage));
    acc += charge;
    rows.push({
      year: i + 1,
      parts: [],
      units: u,
      opening,
      charge,
      accumulated: acc,
      closing: b.cost - acc,
      capped: charge < natural - EPS,
    });
  });
  return { lifeYears: [], rows };
}

export const timeSchedule = (b: Basics, lifeYears: LifeYear[]): Schedule => ({ lifeYears, rows: toFiscal(b, lifeYears) });

/** Input problems, keyed by field; empty when the inputs can be computed. */
export function basicsErrors(b: Basics): Partial<Record<keyof Basics, string>> {
  const e: Partial<Record<keyof Basics, string>> = {};
  if (!(b.cost > 0)) e.cost = "העלות חייבת להיות חיובית";
  if (!(b.salvage >= 0)) e.salvage = "ערך הגרט לא יכול להיות שלילי";
  else if (b.cost > 0 && b.salvage >= b.cost) e.salvage = "ערך הגרט חייב להיות נמוך מהעלות";
  if (!Number.isInteger(b.life) || b.life < 1 || b.life > 50) e.life = "אורך חיים בשנים שלמות, 1 עד 50";
  if (!Number.isInteger(b.startMonth) || b.startMonth < 1 || b.startMonth > 12) e.startMonth = "חודש בין 1 ל-12";
  return e;
}
