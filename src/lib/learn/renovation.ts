/**
 * A capitalised renovation (IAS 16.12–13, 51, 61) for the learning lab.
 *
 * The asset is bought on 1 January of `firstYear`, so its life years match the
 * fiscal years until the renovation. The renovation takes place at the start of
 * a month: the old charge runs up to it, the renovation cost is added to the
 * carrying amount, and the adjusted amount is depreciated over the new
 * remaining life, less the new residual, in 12-month life years that start on
 * the renovation date and split across fiscal years.
 */

export type RenoMethod = "sl" | "syd-desc" | "syd-asc" | "db";

export const METHOD_LABEL: Record<RenoMethod, string> = {
  sl: "קו ישר",
  "syd-desc": "סכום ספרות השנים — יורד",
  "syd-asc": "סכום ספרות השנים — עולה",
  db: "יתרה פוחתת",
};

export type RenovationInputs = {
  cost: number;
  salvage: number;
  /** Original useful life, in whole years. */
  life: number;
  method: RenoMethod;
  /** Year of purchase; the asset is available for use on 1 January. */
  firstYear: number;
  renoYear: number;
  /** Month (1–12) of the renovation, at its start. */
  renoMonth: number;
  renoCost: number;
  /** Remaining useful life from the renovation date, in whole years. */
  newLife: number;
  newSalvage: number;
  newMethod: RenoMethod;
};

export type RenoRow = {
  year: number;
  opening: number;
  /** The year's charge before the renovation, and after it. */
  before: number;
  after: number;
  addition: number;
  charge: number;
  accumulated: number;
  closing: number;
};

export type RenovationResult = {
  /** Charge per life year: before the renovation, and on the adjusted amount after it. */
  oldYears: number[];
  newYears: number[];
  /** Months of the renovation year before it (the old asset's partial charge) and after it. */
  monthsBefore: number;
  monthsAfter: number;
  /** The old charge from 1 January of the renovation year up to the renovation. */
  depToDate: number;
  accumulatedAtReno: number;
  carryingAtReno: number;
  adjusted: number;
  newBase: number;
  /** Declining balance: the rates before and after; sum of years: the denominators. */
  oldRate: number | null;
  newRate: number | null;
  oldDigits: number;
  newDigits: number;
  rows: RenoRow[];
};

export const digits = (n: number) => (n * (n + 1)) / 2;

/** 1 − (salvage / cost)^(1 / life): the rate that brings cost to salvage in exactly `life` years. */
export const dbRate = (cost: number, salvage: number, life: number) => 1 - Math.pow(salvage / cost, 1 / life);

/** Charge per life year; declining balance is trued up to salvage in the last year. */
export function lifeYearCharges(method: RenoMethod, cost: number, salvage: number, life: number): number[] {
  const base = cost - salvage;
  if (method === "sl") return Array.from({ length: life }, () => base / life);
  if (method !== "db") {
    const s = digits(life);
    return Array.from({ length: life }, (_, i) => (base * (method === "syd-desc" ? life - i : i + 1)) / s);
  }
  const rate = dbRate(cost, salvage, life);
  const out: number[] = [];
  let ca = cost;
  for (let k = 0; k < life; k++) {
    const charge = k === life - 1 ? ca - salvage : ca * rate;
    out.push(charge);
    ca -= charge;
  }
  return out;
}

/** Input problems, keyed by field; empty when the renovation can be solved. */
export function renovationErrors(x: RenovationInputs): Partial<Record<keyof RenovationInputs, string>> {
  const e: Partial<Record<keyof RenovationInputs, string>> = {};
  if (!(x.cost > 0)) e.cost = "העלות חייבת להיות חיובית";
  if (!(x.salvage >= 0)) e.salvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.cost > 0 && x.salvage >= x.cost) e.salvage = "ערך הגרט חייב להיות נמוך מהעלות";
  else if (x.method === "db" && !(x.salvage > 0)) e.salvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (!Number.isInteger(x.life) || x.life < 1 || x.life > 50) e.life = "אורך חיים בשנים שלמות, 1 עד 50";
  if (!Number.isInteger(x.renoMonth) || x.renoMonth < 1 || x.renoMonth > 12) e.renoMonth = "חודש בין 1 ל-12";
  const elapsed = (x.renoYear - x.firstYear) * 12 + x.renoMonth - 1;
  if (!Number.isInteger(x.renoYear) || elapsed <= 0) e.renoYear = "השיפוץ חייב להיות אחרי מועד הרכישה";
  else if (!e.life && elapsed >= x.life * 12) e.renoYear = "השיפוץ חייב להיות לפני תום אורך החיים המקורי";
  if (!(x.renoCost > 0)) e.renoCost = "עלות השיפוץ חייבת להיות חיובית";
  if (!Number.isInteger(x.newLife) || x.newLife < 1 || x.newLife > 50) e.newLife = "יתרת אורך חיים בשנים שלמות, 1 עד 50";
  if (!(x.newSalvage >= 0)) e.newSalvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.newMethod === "db" && !(x.newSalvage > 0)) e.newSalvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (Object.keys(e).length) return e;
  const r = solveRenovation(x);
  if (x.newSalvage >= r.adjusted) e.newSalvage = "ערך הגרט החדש חייב להיות נמוך מהערך בספרים המותאם";
  return e;
}

export function solveRenovation(x: RenovationInputs): RenovationResult {
  const oldYears = lifeYearCharges(x.method, x.cost, x.salvage, x.life);
  const fullYears = x.renoYear - x.firstYear;
  const monthsBefore = x.renoMonth - 1;
  const monthsAfter = 12 - monthsBefore;
  const depToDate = (oldYears[fullYears] * monthsBefore) / 12;
  const accumulatedAtReno = oldYears.slice(0, fullYears).reduce((s, c) => s + c, 0) + depToDate;
  const carryingAtReno = x.cost - accumulatedAtReno;
  const adjusted = carryingAtReno + x.renoCost;
  const newYears = lifeYearCharges(x.newMethod, adjusted, x.newSalvage, x.newLife);

  const rows: RenoRow[] = [];
  let acc = 0;
  for (let i = 0; i < fullYears; i++) {
    const opening = x.cost - acc;
    acc += oldYears[i];
    rows.push({ year: x.firstYear + i, opening, before: oldYears[i], after: 0, addition: 0, charge: oldYears[i], accumulated: acc, closing: x.cost - acc });
  }
  // The renovation year, then each later fiscal year: the tail of one new life year and the head of the next.
  const gross = x.cost + x.renoCost;
  const fiscalAfter = monthsBefore === 0 ? x.newLife : x.newLife + 1;
  for (let t = 0; t < fiscalAfter; t++) {
    const before = t === 0 ? depToDate : 0;
    const prev = newYears[t - 1];
    const curr = newYears[t];
    const after = (t === 0 ? 0 : monthsBefore > 0 && prev !== undefined ? (prev * monthsBefore) / 12 : 0) + (curr !== undefined ? (curr * monthsAfter) / 12 : 0);
    const opening = t === 0 ? x.cost - acc : gross - acc;
    acc += before + after;
    rows.push({
      year: x.renoYear + t,
      opening,
      before,
      after,
      addition: t === 0 ? x.renoCost : 0,
      charge: before + after,
      accumulated: acc,
      closing: gross - acc,
    });
  }

  return {
    oldYears,
    newYears,
    monthsBefore,
    monthsAfter,
    depToDate,
    accumulatedAtReno,
    carryingAtReno,
    adjusted,
    newBase: adjusted - x.newSalvage,
    oldRate: x.method === "db" ? dbRate(x.cost, x.salvage, x.life) : null,
    newRate: x.newMethod === "db" ? dbRate(adjusted, x.newSalvage, x.newLife) : null,
    oldDigits: digits(x.life),
    newDigits: digits(x.newLife),
    rows,
  };
}
