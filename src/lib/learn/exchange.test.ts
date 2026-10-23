import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exchangeErrors, type ExchangeInputs, solveExchange } from "./exchange";

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
