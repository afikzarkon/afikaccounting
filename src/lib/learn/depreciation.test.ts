import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type Basics,
  basicsErrors,
  decliningYears,
  exactDbRate,
  firstYearMonths,
  straightLineYears,
  sydDenominator,
  sydYears,
  timeSchedule,
  unitsSchedule,
} from "./depreciation";

// The lab's defaults: 300,000 cost, 30,000 salvage, five years, available in April.
const B: Basics = { cost: 300_000, salvage: 30_000, life: 5, startMonth: 4 };
const r2 = (v: number) => Math.round(v * 100) / 100;
const charges = (s: ReturnType<typeof timeSchedule>) => s.rows.map((r) => r2(r.charge));
const total = (s: ReturnType<typeof timeSchedule>) => r2(s.rows.reduce((a, r) => a + r.charge, 0));

describe("learning lab depreciation", () => {
  it("counts first-year months as 13 − month", () => {
    assert.equal(firstYearMonths(4), 9);
    assert.equal(firstYearMonths(1), 12);
    assert.equal(firstYearMonths(12), 1);
  });

  it("straight line: 9/12 in year one and the remaining 3/12 in a sixth fiscal year", () => {
    const s = timeSchedule(B, straightLineYears(B));
    assert.deepEqual(charges(s), [40_500, 54_000, 54_000, 54_000, 54_000, 13_500]);
    assert.equal(r2(s.rows.at(-1)!.closing), 30_000);
  });

  it("straight line from January needs no sixth year", () => {
    const b = { ...B, startMonth: 1 };
    assert.deepEqual(charges(timeSchedule(b, straightLineYears(b))), [54_000, 54_000, 54_000, 54_000, 54_000]);
  });

  it("SYD descending splits each life year across two fiscal years", () => {
    assert.equal(sydDenominator(5), 15);
    const s = timeSchedule(B, sydYears(B, "desc"));
    assert.deepEqual(charges(s), [67_500, 76_500, 58_500, 40_500, 22_500, 4_500]);
    assert.equal(total(s), 270_000);
  });

  it("SYD ascending mirrors the weights", () => {
    const s = timeSchedule(B, sydYears(B, "asc"));
    assert.deepEqual(charges(s), [13_500, 31_500, 49_500, 67_500, 85_500, 22_500]);
    assert.equal(total(s), 270_000);
  });

  it("declining balance at 40% stops at the salvage floor", () => {
    const b = { ...B, startMonth: 1 };
    const years = decliningYears(b, 0.4);
    assert.deepEqual(
      years.map((y) => r2(y.charge)),
      [120_000, 72_000, 43_200, 25_920, 8_880],
    );
    assert.equal(years[4].cut, "floor");
    assert.equal(total(timeSchedule(b, years)), 270_000);
  });

  it("the exact rate lands on salvage with no cut", () => {
    const rate = exactDbRate(B)!;
    assert.ok(Math.abs(rate - 0.369043) < 1e-6);
    const s = timeSchedule(B, decliningYears(B, rate));
    assert.ok(s.lifeYears.every((y) => !y.cut));
    assert.equal(r2(s.rows.at(-1)!.closing), 30_000);
  });

  it("a low declining rate is trued up to salvage in the last life year", () => {
    const years = decliningYears(B, 0.2);
    assert.equal(years[4].cut, "final");
    assert.equal(r2(years.reduce((a, y) => a + y.charge, 0)), 270_000);
  });

  it("mid-year declining balance equals the fiscal-opening method in the middle years", () => {
    const s = timeSchedule(B, decliningYears(B, 0.4));
    // FY1 = 300,000 · 40% · 9/12; FY2 = (300,000 − 90,000) · 40%.
    assert.equal(r2(s.rows[0].charge), 90_000);
    assert.equal(r2(s.rows[1].charge), 84_000);
    assert.equal(total(s), 270_000);
  });

  it("exact rate is undefined without salvage", () => {
    assert.equal(exactDbRate({ ...B, salvage: 0 }), null);
  });

  it("units of production: rate per unit, capped at salvage", () => {
    const s = unitsSchedule(B, 100_000, [15_000, 25_000, 22_000, 18_000, 12_000, 8_000]);
    assert.deepEqual(charges(s), [40_500, 67_500, 59_400, 48_600, 32_400, 21_600]);
    const over = unitsSchedule(B, 100_000, [60_000, 60_000]);
    assert.deepEqual(charges(over), [162_000, 108_000]);
    assert.ok(over.rows[1].capped);
  });

  it("rejects salvage at or above cost and fractional lives", () => {
    assert.deepEqual(Object.keys(basicsErrors({ ...B, salvage: 300_000, life: 2.5 })).sort(), ["life", "salvage"]);
    assert.deepEqual(basicsErrors(B), {});
  });
});
