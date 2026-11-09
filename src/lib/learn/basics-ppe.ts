/**
 * Fixed assets, as much as a worksheet question needs: straight-line
 * depreciation by useful life or by a yearly rate, part of a year by months,
 * accumulated depreciation to a date, and a sale with its gain or loss.
 * Every figure on the fixed-asset screens of the basics course comes from here.
 */

import { type Entry, round2 } from "./basics";

/** A month of a year. A purchase counts from the first day of its month; a date to depreciate up to counts to the last day of its month. */
export type Month = { year: number; month: number };

/** How fast an asset wears: over a number of years, or at a yearly rate of its cost. */
export type Wear = { years: number } | { rate: number };

/** The yearly depreciation: cost ÷ years, or cost × rate. */
export function yearly(cost: number, wear: Wear): number {
  return round2("years" in wear ? cost / wear.years : cost * wear.rate);
}

/** Whole months from the first day of `from` to the last day of `to`, both counted. */
export function monthsBetween(from: Month, to: Month): number {
  const n = (to.year - from.year) * 12 + (to.month - from.month) + 1;
  if (n < 0) throw new Error("to is before from");
  return n;
}

/** Depreciation for a number of months: yearly × months ÷ 12. */
export function forMonths(cost: number, wear: Wear, months: number): number {
  return round2((yearly(cost, wear) * months) / 12);
}

/** Months of `year` in which an asset bought in `bought` is depreciated (it is not depreciated before it was bought). */
export function monthsInYear(bought: Month, year: number): number {
  if (bought.year > year) return 0;
  if (bought.year < year) return 12;
  return 13 - bought.month;
}

/** One year's depreciation of an asset bought in `bought`. */
export function depreciationOfYear(cost: number, wear: Wear, bought: Month, year: number): number {
  return forMonths(cost, wear, monthsInYear(bought, year));
}

/** Accumulated depreciation from the purchase to the end of `to`, never more than the cost. */
export function accumulatedTo(cost: number, wear: Wear, bought: Month, to: Month): number {
  return Math.min(cost, forMonths(cost, wear, monthsBetween(bought, to)));
}

/** Cost less accumulated depreciation. */
export const bookValue = (cost: number, accumulated: number) => round2(cost - accumulated);

/** What a sale gives: the book value at the sale, and the gain (positive) or loss (negative). */
export function sale(cost: number, accumulated: number, proceeds: number) {
  const value = bookValue(cost, accumulated);
  return { bookValue: value, result: round2(proceeds - value) };
}

/** The adjusting entry for a year's depreciation. */
export function depreciationEntry(id: string, text: string, accumulatedAccount: string, amount: number, why?: string): Entry {
  return {
    id,
    text,
    lines: [
      { account: "הוצאות פחת", dr: amount },
      { account: accumulatedAccount, cr: amount },
    ],
    why,
  };
}

/** The entry for a sale: cash and the asset's accumulated depreciation in debit, its cost in credit, and the gain or loss between them. */
export function saleEntry(id: string, text: string, asset: { account: string; accumulatedAccount: string; cost: number; accumulated: number }, proceeds: number, why?: string): Entry {
  const { result } = sale(asset.cost, asset.accumulated, proceeds);
  const lines: Entry["lines"] = [];
  if (proceeds > 0) lines.push({ account: "מזומן", dr: proceeds });
  lines.push({ account: asset.accumulatedAccount, dr: asset.accumulated });
  if (result < 0) lines.push({ account: "הפסד הון", dr: -result });
  lines.push({ account: asset.account, cr: asset.cost });
  if (result > 0) lines.push({ account: "רווח הון", cr: result });
  return { id, text, lines, why };
}

// ---------------------------------------------------------------------------
// The course's examples. Each holds its own given numbers; every result is computed above.

/** The bakery's oven: bought at the start of a year, worn over eight years. */
export const OVEN = { cost: 96_000, wear: { years: 8 } as Wear, bought: { year: 2025, month: 1 } as Month };

/** A delivery van bought in April, depreciated at a yearly rate: part of a year first, then whole years. */
export const VAN = { cost: 140_000, wear: { rate: 0.2 } as Wear, bought: { year: 2025, month: 4 } as Month };

/** A printing machine sold in its fourth year: depreciation to the sale, then a gain, a loss, or neither. */
export const PRESS = {
  cost: 75_000,
  wear: { years: 5 } as Wear,
  bought: { year: 2022, month: 3 } as Month,
  sold: { year: 2025, month: 9 } as Month,
  proceeds: 25_000,
  lowProceeds: 18_000,
};

/** Forklifts on a preliminary trial balance: one of four sold at its book value a year before, this year's depreciation not yet recorded. */
export const FORKLIFTS = { bought: { year: 2022, month: 4 } as Month, count: 4, each: 52_000, wear: { rate: 0.1 } as Wear, soldCount: 1, soldAt: { year: 2024, month: 12 } as Month, year: 2025 };

/** Tablets and laptops bought together: only the accumulated depreciation is given, and the cost comes back through X. */
export const DEVICES = { tablets: 12, laptops: 4, laptopTimes: 2, wear: { years: 4 } as Wear, bought: { year: 2023, month: 10 } as Month, known: { year: 2024, month: 12 } as Month, accumulated: 13_750, year: 2025 };

/** What the forklift question asks for: the cost and accumulated depreciation still on the books, and this year's depreciation. */
export function forkliftResults(f = FORKLIFTS) {
  const left = f.count - f.soldCount;
  const cost = left * f.each;
  // The trial balance is before this year's adjustments: accumulated depreciation stands at the end of last year.
  const accumulated = accumulatedTo(cost, f.wear, f.bought, { year: f.year - 1, month: 12 });
  return { left, cost, accumulated, yearDep: depreciationOfYear(cost, f.wear, f.bought, f.year), monthsToLastYear: monthsBetween(f.bought, { year: f.year - 1, month: 12 }) };
}

/** What the devices question asks for: X (a tablet's cost), the total cost, and this year's depreciation. */
export function deviceResults(d = DEVICES) {
  const units = d.tablets + d.laptops * d.laptopTimes; // the cost in tablets: 12X + 4 × 2X
  const months = monthsBetween(d.bought, d.known);
  const share = months / (12 * ("years" in d.wear ? d.wear.years : 1 / d.wear.rate));
  const x = round2(d.accumulated / (units * share));
  const cost = round2(units * x);
  return { units, months, x, laptop: round2(x * d.laptopTimes), cost, yearDep: depreciationOfYear(cost, d.wear, d.bought, d.year) };
}
