import assert from "node:assert/strict";
import { describe, it } from "node:test";
import katex from "katex";
import { exchangeErrors, type ExchangeInputs, explainExchange, solveExchange } from "./exchange";

const r2 = (v: number) => Math.round(v * 100) / 100;

// The exchange page's example: a 500,000 machine, ten years, three years old on 1.1.X4,
// swapped on 1.4.X4 for a new one plus 40,000 cash paid; the old one is worth 360,000.
const X: ExchangeInputs = {
  oldCost: 500_000,
  oldSalvage: 0,
  oldLife: 10,
  accumulatedOpening: 150_000,
  month: 4,
  commercial: true,
  basis: "given",
  fairValueGiven: 360_000,
  fairValueReceived: 0,
  cashPaid: 40_000,
  cashReceived: 0,
  newLife: 5,
  newSalvage: 40_000,
};

describe("learning lab asset exchange", () => {
  it("brings the old asset's depreciation up to the exchange date", () => {
    const r = solveExchange(X);
    assert.equal(r.monthsBefore, 3);
    assert.equal(r.depToDate, 12_500);
    assert.equal(r.accumulated, 162_500);
    assert.equal(r.bookValue, 337_500);
  });

  it("with commercial substance: fair value given plus cash, and a gain", () => {
    const r = solveExchange(X);
    assert.equal(r.newCost, 400_000);
    assert.equal(r.gain, 22_500);
  });

  it("without commercial substance: carrying amount plus cash, no gain", () => {
    const r = solveExchange({ ...X, commercial: false });
    assert.equal(r.newCost, 377_500);
    assert.equal(r.gain, 0);
    assert.equal(r.fairValueGiven, null);
  });

  it("measures by the asset received when that fair value is the clearer one", () => {
    const r = solveExchange({ ...X, basis: "received", fairValueReceived: 390_000 });
    assert.equal(r.newCost, 390_000);
    assert.equal(r.fairValueGiven, 350_000);
    assert.equal(r.gain, 12_500);
  });

  it("books a loss and nets cash received", () => {
    const r = solveExchange({ ...X, fairValueGiven: 300_000, cashPaid: 0, cashReceived: 20_000 });
    assert.equal(r.newCost, 280_000);
    assert.equal(r.gain, -37_500);
  });

  it("depreciates the new asset from the exchange to year end", () => {
    const r = solveExchange(X);
    assert.equal(r.monthsAfter, 9);
    assert.equal(r.newAnnual, 72_000);
    assert.equal(r.newDep, 54_000);
    assert.equal(r.totalDep, 66_500);
    assert.equal(solveExchange({ ...X, commercial: false }).newDep, 50_625);
  });

  it("an exchange in January leaves no depreciation on the old asset that year", () => {
    const r = solveExchange({ ...X, month: 1 });
    assert.equal(r.depToDate, 0);
    assert.equal(r.monthsAfter, 12);
  });

  it("rejects inputs it cannot solve", () => {
    assert.deepEqual(exchangeErrors(X), {});
    assert.ok(exchangeErrors({ ...X, accumulatedOpening: 495_000 }).accumulatedOpening);
    assert.ok(exchangeErrors({ ...X, commercial: false, cashPaid: 0, cashReceived: 400_000 }).newCost);
    assert.ok(exchangeErrors({ ...X, newSalvage: 500_000 }).newSalvage);
  });
});

describe("exchange under any depreciation method, before and after", () => {
  const Y: ExchangeInputs = { ...X, accumulatedOpening: 0, yearsUsed: 3 };

  it("three years of straight-line use is the same as 150,000 accumulated", () => {
    const a = solveExchange(X);
    const b = solveExchange(Y);
    assert.equal(b.accumulated, a.accumulated);
    assert.equal(b.bookValue, a.bookValue);
    assert.equal(b.newDep, a.newDep);
  });

  it("sum-of-years descending before: 10 + 9 + 8 of 55, then 3 months of the 7", () => {
    const r = solveExchange({ ...Y, oldMethod: "syd-desc" });
    assert.equal(r2(r.accumulated - r.depToDate), r2((500_000 * 27) / 55));
    assert.equal(r2(r.depToDate), r2((((500_000 * 7) / 55) * 3) / 12));
  });

  it("declining balance after: the first life year on the new cost, 9 months of it", () => {
    const r = solveExchange({ ...Y, newMethod: "db" });
    const rate = 1 - Math.pow(40_000 / 400_000, 1 / 5);
    assert.equal(r2(r.newDep), r2((400_000 * rate * 9) / 12));
    // Every year after adds up to the new asset's whole depreciable amount.
    assert.equal(r2(r.newDep + r.later.reduce((s, y) => s + y.charge, 0)), 360_000);
  });

  it("ascending sum-of-years after: the smallest charge first", () => {
    const r = solveExchange({ ...Y, newMethod: "syd-asc" });
    assert.equal(r2(r.newAnnual), r2((360_000 * 1) / 15));
    assert.ok(r.newYears[4] > r.newYears[0]);
  });

  it("asks for whole years and a positive salvage where the method needs them", () => {
    assert.ok(exchangeErrors({ ...Y, yearsUsed: 10 }).yearsUsed);
    assert.ok(exchangeErrors({ ...Y, oldMethod: "db" }).oldSalvage);
    assert.ok(exchangeErrors({ ...Y, newLife: 4.5 }).newLife);
  });

  for (const m of ["sl", "db", "syd-desc", "syd-asc"] as const)
    for (const month of [1, 4])
      it(`${m}, exchanged in month ${month}: every step has a reason, and every formula renders`, () => {
        const x: ExchangeInputs = { ...Y, oldSalvage: m === "db" ? 20_000 : 0, oldMethod: m, newMethod: m, month };
        const steps = explainExchange(x, solveExchange(x));
        assert.deepEqual(steps.map((s) => s.id).slice(0, 4), ["date", "old", "measure", "new"]);
        for (const s of steps) {
          assert.ok(s.why.length > 20, s.id);
          for (const c of s.calcs) assert.doesNotThrow(() => katex.renderToString(c.tex, { throwOnError: true, displayMode: true }), c.tex);
        }
      });
});
