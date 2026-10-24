/**
 * The IAS 16 chapter's central example: one machine, from its purchase in 2020
 * to its exchange in 2023. The "how to solve a question" steps work it through,
 * and the exchange page picks it up on the day it is exchanged, so every number
 * on both pages comes from the figures here.
 */

import type { ExchangeInputs } from "./exchange";

/** What the invoices say: amount, and whether it is part of the machine's cost (IAS 16.16–20). */
export const MACHINE_COST_LINES: [string, number, boolean][] = [
  ["מחיר המכונה לפי חשבונית הספק (אחרי הנחה מסחרית)", 280_000, true],
  ["הובלה וביטוח בדרך למפעל", 6_000, true],
  ["התקנה, הרכבה וכיול על ידי טכנאי הספק", 9_000, true],
  ["יציקת יסודות בטון למכונה", 5_000, true],
  ["השתלמות לעובדים שיפעילו את המכונה", 4_000, false],
  ["מודעות פרסום על קו הייצור החדש", 3_000, false],
  ["הפסדי הרצה בחודש הראשון לאחר שהמכונה כבר מוכנה", 2_000, false],
];

export const MACHINE = {
  company: "מפעלי גל בע״מ",
  /** Ordered and paid. */
  orderDate: "1.2.2020",
  /** Installation finished: the machine is available for use (IAS 16.55). */
  readyDate: "1.4.2020",
  firstYear: 2020,
  /** Month (1–12) it is available for use, counted as a full month. */
  readyMonth: 4,
  salvage: 30_000,
  life: 5,
  /** For the other methods in step 3: a declining-balance rate as a question would give it, and units of output. */
  dbRate: 0.4,
  totalUnits: 90_000,
  unitsFirstYear: 12_000,
};

export const MACHINE_COST = MACHINE_COST_LINES.filter(([, , inc]) => inc).reduce((s, [, v]) => s + v, 0);
export const MACHINE_EXPENSED = MACHINE_COST_LINES.filter(([, , inc]) => !inc).reduce((s, [, v]) => s + v, 0);
export const MACHINE_BASE = MACHINE_COST - MACHINE.salvage;
export const MACHINE_ANNUAL = MACHINE_BASE / MACHINE.life;
/** Months of use in the first fiscal year, from the month it is ready to December. */
export const MACHINE_FIRST_MONTHS = 13 - MACHINE.readyMonth;

/** Straight-line schedule by fiscal year: the first year is partial, and so is the year the life ends. */
export function machineSchedule() {
  const rows: { year: number; months: number; dep: number; accumulated: number; carrying: number }[] = [];
  let left = MACHINE.life * 12;
  let acc = 0;
  for (let year = MACHINE.firstYear; left > 0; year++) {
    const months = Math.min(left, year === MACHINE.firstYear ? MACHINE_FIRST_MONTHS : 12);
    const dep = (MACHINE_ANNUAL * months) / 12;
    acc += dep;
    left -= months;
    rows.push({ year, months, dep, accumulated: acc, carrying: MACHINE_COST - acc });
  }
  return rows;
}

/** The first fiscal year's charge under each method in step 3. */
export function machineFirstYearByMethod() {
  const share = MACHINE_FIRST_MONTHS / 12;
  const n = MACHINE.life;
  const digits = (n * (n + 1)) / 2;
  return {
    sl: MACHINE_ANNUAL * share,
    syd: ((MACHINE_BASE * n) / digits) * share,
    db: MACHINE_COST * MACHINE.dbRate * share,
    units: (MACHINE_BASE / MACHINE.totalUnits) * MACHINE.unitsFirstYear,
    sydLifeYear: (MACHINE_BASE * n) / digits,
    perUnit: MACHINE_BASE / MACHINE.totalUnits,
  };
}

/** The exchange: on 1.4.2023 the same machine is traded for a new one. */
export const MACHINE_EXCHANGE_DATE = { year: 2023, month: 4, label: "1.4.2023" };

/** Accumulated depreciation on 1 January of `year`, from the schedule. */
export const machineAccumulatedAtStartOf = (year: number) => machineSchedule().filter((r) => r.year < year).reduce((s, r) => s + r.dep, 0);

export const MACHINE_EXCHANGE: ExchangeInputs = {
  oldCost: MACHINE_COST,
  oldSalvage: MACHINE.salvage,
  oldLife: MACHINE.life,
  accumulatedOpening: machineAccumulatedAtStartOf(MACHINE_EXCHANGE_DATE.year),
  month: MACHINE_EXCHANGE_DATE.month,
  commercial: true,
  basis: "given",
  fairValueGiven: 150_000,
  fairValueReceived: 200_000,
  cashPaid: 40_000,
  cashReceived: 0,
  newLife: 5,
  newSalvage: 10_000,
};
