import type { EntryLine } from "@/components/study/blocks";
import type { RevaluationInputs, RevEvent } from "@/lib/learn/revaluation";

// The worked examples on the page; the first is also the calculator's default.
export const SL_EX: RevaluationInputs = {
  cost: 100_000,
  salvage: 0,
  life: 10,
  method: "sl",
  firstYear: 2020,
  revaluations: [{ year: 2021, timing: "end", fairValue: 120_000 }],
  transfer: "depreciation",
};
export const SYD_EX: RevaluationInputs = {
  cost: 150_000,
  salvage: 0,
  life: 5,
  method: "syd-desc",
  firstYear: 2020,
  revaluations: [{ year: 2021, timing: "end", fairValue: 90_000 }],
  transfer: "depreciation",
};
export const DB_EX: RevaluationInputs = {
  cost: 160_000,
  salvage: 10_000,
  life: 4,
  method: "db",
  firstYear: 2020,
  revaluations: [{ year: 2021, timing: "end", fairValue: 90_000 }],
  transfer: "depreciation",
};

// Land: bought, revalued up, revalued down, then sold.
export const LAND = { cost: 500_000, firstUp: 650_000, thenDown: 600_000, proceeds: 640_000, buyYear: 2020, upYear: 2021, downYear: 2023, saleYear: 2025 };

export const TAX_RATE = 0.23;

const r2 = (v: number) => Math.round(v * 100) / 100;

/** A positive amount debits the account, a negative one credits it; zero leaves it out. */
const side = (account: string, amount: number): EntryLine[] =>
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
