import type { EntryLine } from "@/components/study/blocks";
import type { RevaluationInputs, RevEvent } from "@/lib/learn/revaluation";

/** A fair value on every 31 December, from `firstYear` on. */
const yearly = (firstYear: number, values: number[]) => values.map((fairValue, i) => ({ year: firstYear + i, timing: "end" as const, fairValue }));

// The worked examples on the page, revalued every year; the first is also the calculator's default.
// Every useful life is four years at most. The fair values are picked so each year's new charge
// comes out round, and so that between them they show a first increase, a later one, a decrease
// within the surplus and one beyond it. No example has an increase after a loss went to profit or loss.
export const SL_EX: RevaluationInputs = {
  cost: 100_000,
  salvage: 0,
  life: 4,
  method: "sl",
  firstYear: 2020,
  revaluations: yearly(2020, [90_000, 54_000, 20_000]),
  transfer: "depreciation",
};
export const SYD_EX: RevaluationInputs = {
  cost: 100_000,
  salvage: 0,
  life: 4,
  method: "syd-desc",
  firstYear: 2020,
  revaluations: yearly(2020, [66_000, 36_000, 12_000]),
  transfer: "depreciation",
};
// The rates come out round: 2/3, then 75%, then 80%.
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

// A property with land: one price and one fair value a year, split between the two.
export const PROPERTY = {
  firstYear: 2020,
  land: { cost: 400_000, values: [432_000, 380_000, 370_000] },
  building: { cost: 600_000, life: 4, values: [480_000, 300_000, 170_000] },
};
export const PROPERTY_BUILDING: RevaluationInputs = {
  cost: PROPERTY.building.cost,
  salvage: 0,
  life: PROPERTY.building.life,
  method: "sl",
  firstYear: PROPERTY.firstYear,
  revaluations: yearly(PROPERTY.firstYear, PROPERTY.building.values),
  transfer: "depreciation",
};
export const PROPERTY_LAND = PROPERTY.land.values.map((fairValue, i) => ({ year: PROPERTY.firstYear + i, fairValue }));

export const TAX_RATE = 0.23;

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
