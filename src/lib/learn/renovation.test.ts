import assert from "node:assert/strict";
import { describe, it } from "node:test";
import katex from "katex";
import { dbRate, explainRenovation, renovationErrors, type RenovationInputs, solveRenovation } from "./renovation";

const r2 = (v: number) => Math.round(v * 100) / 100;

// Example 1 on the renovation page: straight-line, renovated mid-year.
const SL: RenovationInputs = {
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
// Example 2: sum of years' digits, renovated on 1 January.
const SYD: RenovationInputs = {
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
// Example 3: declining balance, both rates come out round.
const DB: RenovationInputs = {
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

describe("learning lab renovation", () => {
  it("straight-line mid-year: catch-up, adjusted amount, new annual charge", () => {
    const r = solveRenovation(SL);
    assert.equal(r.depToDate, 5_000);
    assert.equal(r.accumulatedAtReno, 35_000);
    assert.equal(r.carryingAtReno, 65_000);
    assert.equal(r.adjusted, 95_000);
    assert.equal(r.newYears[0], 11_125);
    const y2023 = r.rows.find((x) => x.year === 2023)!;
    assert.equal(y2023.before, 5_000);
    assert.equal(y2023.after, 5_562.5);
    assert.equal(y2023.addition, 30_000);
    assert.deepEqual(
      r.rows.map((x) => x.year),
      [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031],
    );
    assert.equal(r.rows.at(-1)!.charge, 5_562.5);
    assert.equal(r2(r.rows.at(-1)!.closing), 6_000);
  });

  it("sum of years' digits, descending: new digits on the remaining life", () => {
    const r = solveRenovation(SYD);
    assert.equal(r.carryingAtReno, 60_000);
    assert.equal(r.adjusted, 90_000);
    assert.equal(r.newDigits, 10);
    assert.deepEqual(r.newYears, [32_000, 24_000, 16_000, 8_000]);
    assert.equal(r.rows.at(-1)!.closing, 10_000);
  });

  it("sum of years' digits, ascending", () => {
    const r = solveRenovation({ ...SYD, method: "syd-asc", newMethod: "syd-asc" });
    assert.equal(r.carryingAtReno, 120_000);
    assert.deepEqual(r.newYears, [14_000, 28_000, 42_000, 56_000]);
  });

  it("declining balance: the adjusted amount is the new cost for the rate", () => {
    const r = solveRenovation(DB);
    assert.equal(r2(r.oldRate!), 0.5);
    assert.equal(r.carryingAtReno, 40_000);
    assert.equal(r.adjusted, 81_000);
    assert.equal(r2(r.newRate!), r2(2 / 3));
    assert.deepEqual(r.newYears.map(r2), [54_000, 18_000, 6_000, 2_000]);
    assert.equal(r2(dbRate(81_000, 1_000, 4)), 0.67);
  });

  it("every schedule reconciles and lands on the new salvage", () => {
    for (const x of [SL, SYD, DB, { ...SL, newMethod: "db" as const }, { ...SYD, renoMonth: 4 }]) {
      const r = solveRenovation(x);
      for (const row of r.rows) assert.equal(r2(row.opening + row.addition - row.charge), r2(row.closing));
      assert.equal(r2(r.rows.at(-1)!.closing), x.newSalvage);
    }
  });

  it("rejects inputs it cannot solve", () => {
    assert.deepEqual(renovationErrors(SL), {});
    assert.ok(renovationErrors({ ...SL, renoYear: 2031 }).renoYear);
    assert.ok(renovationErrors({ ...SL, renoYear: 2020, renoMonth: 1 }).renoYear);
    assert.ok(renovationErrors({ ...SL, newSalvage: 95_000 }).newSalvage);
    assert.ok(renovationErrors({ ...DB, newSalvage: 0 }).newSalvage);
  });
});

describe("the calculator's working, step by step", () => {
  for (const m of ["sl", "db", "syd-desc", "syd-asc"] as const)
    for (const month of [1, 7]) {
      it(`${m}, renovated in month ${month}: every step has a reason, and every formula renders`, () => {
        const x: RenovationInputs = { ...SL, salvage: m === "db" ? 5_000 : 0, method: m, newMethod: m, renoMonth: month };
        const steps = explainRenovation(x, solveRenovation(x));
        assert.deepEqual(steps.map((s) => s.id).slice(0, 5), ["date", "before", "add", "estimates", "after"]);
        for (const s of steps) {
          assert.ok(s.why.length > 20, s.id);
          for (const c of s.calcs) assert.doesNotThrow(() => katex.renderToString(c.tex, { throwOnError: true, displayMode: true }), c.tex);
        }
      });
    }

  it("adds up: the carrying amount on the day, the adjusted amount, and the year's charge", () => {
    const tex = explainRenovation(SL, solveRenovation(SL)).flatMap((s) => s.calcs.map((c) => c.tex));
    // 3 years and 6 months at 10,000: 35,000 written off, 65,000 left; + 30,000 renovation = 95,000.
    assert.ok(tex.some((t) => t.endsWith("= 65{,}000")), "carrying on the day");
    assert.ok(tex.some((t) => t.endsWith("= 95{,}000")), "adjusted");
    // 5,000 before + (95,000 − 6,000) ÷ 8 × 6/12 = 5,562.5 after.
    assert.ok(tex.some((t) => t.endsWith("5{,}000 + 5{,}562.5 = 10{,}562.5")), "the year's charge");
  });
});
