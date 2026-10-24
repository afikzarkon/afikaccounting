import type { EntryLine } from "@/components/study/blocks";
import type { RevaluationInputs, RevEvent } from "@/lib/learn/revaluation";

/** A fair value on every 31 December, from `firstYear` on. */
const yearly = (firstYear: number, values: number[]) => values.map((fairValue, i) => ({ year: firstYear + i, timing: "end" as const, fairValue }));

// The page's central example, also the calculator's default: a building revalued twice, on 31.12.2020
// (an increase) and on 31.12.2022 (a decrease that stays within the surplus). Nothing ever goes to
// profit or loss, so the gold tip's check holds every year. The fair values make every charge round.
const CENTRAL_REVALUATIONS = [
  { year: 2020, timing: "end" as const, fairValue: 360_000 },
  { year: 2022, timing: "end" as const, fairValue: 150_000 },
];
export const SL_EX: RevaluationInputs = {
  cost: 300_000,
  salvage: 0,
  life: 5,
  method: "sl",
  firstYear: 2020,
  revaluations: CENTRAL_REVALUATIONS,
  transfer: "depreciation",
};
/** The same building and the same fair values, depreciated by the sum of the years' digits. */
export const SYD_EX: RevaluationInputs = { ...SL_EX, method: "syd-desc" };
// Declining balance needs a salvage value, which the central building doesn't have, so it has its own
// example, revalued every year. The rates come out round: 2/3, then 75%, then 80%.
export const DB_EX: RevaluationInputs = {
  cost: 135_000,
  salvage: 5_000,
  life: 3,
  method: "db",
  firstYear: 2020,
  revaluations: yearly(2020, [80_000, 25_000]),
  transfer: "depreciation",
};

// Land on its own: revalued every year, then sold.
export const LAND = {
  cost: 500_000,
  values: [
    { year: 2020, fairValue: 540_000 },
    { year: 2021, fairValue: 560_000 },
    { year: 2022, fairValue: 530_000 },
    { year: 2023, fairValue: 545_000 },
  ],
  saleYear: 2024,
  proceeds: 560_000,
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/** A positive amount debits the account, a negative one credits it; zero leaves it out. */
export const side = (account: string, amount: number): EntryLine[] =>
  Math.abs(amount) < 0.005 ? [] : amount > 0 ? [{ account, dr: r2(amount) }] : [{ account, cr: r2(-amount) }];

/** The gap's other side: the surplus, and profit or loss. */
const gapLines = (ev: RevEvent): EntryLine[] => [
  ...side("קרן הערכה מחדש (רווח כולל אחר)", -ev.oci),
  ...side(ev.pl > 0 ? "הכנסה מביטול ירידת ערך (רווח והפסד)" : "הפסד מירידת ערך (רווח והפסד)", -ev.pl),
];

/** Elimination: accumulated depreciation is closed, and the asset moves to fair value. */
export function nettingLines(ev: RevEvent, asset = "מבנה"): EntryLine[] {
  const lines = [...side("פחת נצבר", ev.accEliminated), ...side(asset, ev.fairValue - ev.grossBefore), ...gapLines(ev)];
  return debitsFirst(lines);
}

/** Proportional restatement: gross and accumulated depreciation both move by the same factor. */
export function proportionalLines(ev: RevEvent, asset = "מבנה"): EntryLine[] {
  const lines = [...side(asset, ev.propGrossAfter - ev.propGrossBefore), ...side("פחת נצבר", -(ev.propAccAfter - ev.propAccBefore)), ...gapLines(ev)];
  return debitsFirst(lines);
}

const debitsFirst = (lines: EntryLine[]) => [...lines.filter((l) => l.dr !== undefined), ...lines.filter((l) => l.cr !== undefined)];

export const depLines = (amount: number): EntryLine[] => [
  { account: "הוצאות פחת", dr: r2(amount) },
  { account: "פחת נצבר", cr: r2(amount) },
];

export const transferLines = (amount: number): EntryLine[] => [
  { account: "קרן הערכה מחדש", dr: r2(amount) },
  { account: "עודפים", cr: r2(amount) },
];

export const fmtNum = (v: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);
