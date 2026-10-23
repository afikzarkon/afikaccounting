import type { EntryLine } from "@/components/study/blocks";
import type { RenovationInputs, RenovationResult } from "@/lib/learn/renovation";

// The three worked examples on the page; the first is also the calculator's default.
export const SL_EX: RenovationInputs = {
  cost: 100_000,
  salvage: 0,
  life: 10,
  method: "sl",
  firstYear: 2020,
  renoYear: 2023,
  renoMonth: 7,
  renoCost: 30_000,
  newLife: 8,
  newSalvage: 6_000,
  newMethod: "sl",
};

export const SYD_EX: RenovationInputs = {
  cost: 150_000,
  salvage: 0,
  life: 5,
  method: "syd-desc",
  firstYear: 2020,
  renoYear: 2022,
  renoMonth: 1,
  renoCost: 30_000,
  newLife: 4,
  newSalvage: 10_000,
  newMethod: "syd-desc",
};
export const SYD_ASC_EX: RenovationInputs = { ...SYD_EX, method: "syd-asc", newMethod: "syd-asc" };

export const DB_EX: RenovationInputs = {
  cost: 160_000,
  salvage: 10_000,
  life: 4,
  method: "db",
  firstYear: 2020,
  renoYear: 2022,
  renoMonth: 1,
  renoCost: 41_000,
  newLife: 4,
  newSalvage: 1_000,
  newMethod: "db",
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/** The old charge from 1 January up to the renovation. */
export const catchUpLines = (r: RenovationResult): EntryLine[] => [
  { account: "הוצאות פחת", dr: r2(r.depToDate) },
  { account: "פחת נצבר", cr: r2(r.depToDate) },
];

/** Capitalising the renovation. */
export const capitaliseLines = (x: RenovationInputs): EntryLine[] => [
  { account: "רכוש קבוע — עלות השיפוץ", dr: r2(x.renoCost) },
  { account: "מזומן / ספקים", cr: r2(x.renoCost) },
];

/** Depreciation on the adjusted amount, from the renovation to 31.12. */
export const yearEndLines = (amount: number): EntryLine[] => [
  { account: "הוצאות פחת", dr: r2(amount) },
  { account: "פחת נצבר", cr: r2(amount) },
];

/** "1.7.2023" for the first day of a month. */
export const dateOf = (month: number, year: number) => `1.${month}.${year}`;
