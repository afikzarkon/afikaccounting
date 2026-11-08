import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allocate, dealerSale, indexYear, leaseTerm, lessee, lessorYear, pvEnd, pvStart, rateFor, reduceScope } from "./ifrs16";

/** Every expected figure below comes from a separate calculation over dated cash flows, not from this solver. */
const near = (got: number, want: number, label = "") => assert.ok(Math.abs(got - want) <= 0.01, `${label}: ${got} ≠ ${want}`);

describe("present values", () => {
  it("payments at the end and at the start of each year", () => {
    near(pvEnd(0.06, 5, 40_000), 168_494.55);
    near(pvStart(0.07, 4, 30_000, 5_000), 112_543.96);
  });
  it("a zero rate is just the sum", () => near(pvEnd(0, 4, 100), 400));
  it("the rate that gives back a present value", () => near(pvEnd(rateFor(168_494.55, 5, 40_000), 5, 40_000), 168_494.55));
});

describe("what a contract holds, and for how long", () => {
  it("splits the consideration by relative standalone prices", () => {
    assert.deepEqual(allocate(14_000, [12_000, 4_000]), [10_500, 3_500]);
    assert.deepEqual(allocate(360_000, [150_000, 90_000, 60_000]), [180_000, 108_000, 72_000]);
  });
  it("the lease term: options count only when reasonably certain", () => {
    assert.equal(leaseTerm({ contractYears: 4 }).term, 4);
    assert.equal(leaseTerm({ contractYears: 4, extendYears: 2, certainToExtend: false }).term, 4);
    assert.equal(leaseTerm({ contractYears: 4, extendYears: 2, certainToExtend: true }).term, 6);
    assert.equal(leaseTerm({ contractYears: 8, cancelAfter: 5 }).term, 5);
    assert.equal(leaseTerm({ contractYears: 8, cancelAfter: 5, certainNotToCancel: true }).term, 8);
    assert.equal(leaseTerm({ contractYears: 8, cancelAfter: 5 }).nonCancellable, 5);
  });
  it("a break that will be used means a later extension is never reached", () => {
    assert.equal(leaseTerm({ contractYears: 8, cancelAfter: 5, extendYears: 3, certainToExtend: true }).term, 5);
    assert.equal(leaseTerm({ contractYears: 8, cancelAfter: 5, certainNotToCancel: true, extendYears: 3, certainToExtend: true }).term, 11);
  });
});

describe("a lessee", () => {
  it("paying at each year's end: liability, depreciation, interest and the split of the balance", () => {
    const l = lessee({ payment: 40_000, years: 5, rate: 0.06, timing: "end" });
    near(l.liability, 168_494.55);
    near(l.depreciation, 33_698.91);
    near(l.rows[0].interest, 10_109.67);
    near(l.rows[0].closing, 138_604.22);
    near(l.rows[0].nonCurrent, 106_920.48);
    near(l.rows[0].current, 138_604.22 - 106_920.48);
    near(l.rows[4].closing, 0);
  });
  it("paying at each year's start, with a purchase option, an incentive and direct costs", () => {
    const l = lessee({ payment: 30_000, years: 4, rate: 0.07, timing: "start", finalAmount: 5_000, incentives: 1_000, directCosts: 2_000, depreciationYears: 6 });
    near(l.liability, 112_543.96);
    near(l.cost, 113_543.96);
    near(l.depreciation, 18_923.99);
    const interest = [5_778.08, 4_082.54, 2_268.32, 327.1];
    const closing = [88_322.03, 62_404.58, 34_672.9, 0];
    l.rows.forEach((r, i) => {
      near(r.interest, interest[i], `interest ${i}`);
      near(r.closing, closing[i], `closing ${i}`);
    });
  });
  it("paying at each year's start: the next payment is current, and in the last full year all of it is", () => {
    const l = lessee({ payment: 30_000, years: 4, rate: 0.07, timing: "start", finalAmount: 5_000 });
    near(l.rows[0].nonCurrent, 58_322.03);
    near(l.rows[0].current, 30_000);
    near(l.rows[1].nonCurrent, 32_404.58);
    near(l.rows[2].nonCurrent, 0);
    near(l.rows[2].current, 34_672.9);
  });
  it("an index rise: the year's payment follows it, an amount that isn't linked stays, and the rate doesn't change", () => {
    const L = pvEnd(0.04, 8, 20_000, 3_000);
    near(L, 136_846.97);
    const y = indexYear({ liability: L, rightOfUse: L * 0.875, rate: 0.04, basePayment: 20_000, baseIndex: 200, newIndex: 210, yearsLeftAfter: 7, finalAmount: 3_000 });
    near(y.paid, 21_000);
    near(y.interest, 5_473.88);
    near(y.before, 121_320.85);
    near(y.closing, 128_322.9);
    near(y.remeasured, 7_002.05);
    near(y.nonCurrent, 112_455.82);
    near(y.rightOfUse, L * 0.875 + 7_002.05);
  });
  it("a decrease in scope: the part given up to profit or loss, then the rest against the asset", () => {
    const r = reduceScope({ rightOfUse: 300_000, liability: 330_000, keptShareOfAsset: 0.5, keptLiabilityOldTerms: 165_000, newLiability: 170_000 });
    near(r.assetRemoved, 150_000);
    near(r.liabilityRemoved, 165_000);
    near(r.gain, 15_000);
    near(r.remeasured, 5_000);
    near(r.rightOfUse, 155_000);
  });
});

describe("a lessor", () => {
  it("a dealer with an unguaranteed residual: the net investment is fair value, and profit is what an outright sale makes", () => {
    const r = rateFor(200_000, 5, 40_000, 10_000);
    const s = dealerSale({ fairValue: 200_000, cost: 150_000, marketRate: r, years: 5, payment: 40_000, guaranteedResidual: 4_000, unguaranteedResidual: 6_000, obtainingCosts: 1_000 });
    near(s.sales, 194_457.08);
    near(s.costOfSales, 144_457.08);
    near(s.grossProfit, 50_000);
    near(s.netInvestment, 200_000);
    assert.equal(s.expense, 1_000);
    const y = lessorYear(200_000, r, 40_000);
    near(y.income, 3_194.78);
    near(y.closing, 163_194.78);
  });
  it("an artificially low rate: sales stop at the present value at the market rate", () => {
    near(dealerSale({ fairValue: 150_000, cost: 100_000, marketRate: 0.08, years: 5, payment: 30_000 }).sales, 119_781.3);
  });
});
