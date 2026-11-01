import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mishak, ofek } from "./inventory-exams";

const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 0.005, `${where}: ${a} ≠ ${b}`);

describe("exam question 1: Ofek", () => {
  const o = ofek();
  const [y24, y25] = o.years;

  it("opens 2024 from the corrected count", () => {
    assert.equal(o.opening.units, 200);
    assert.equal(o.opening.cost, 400_000);
  });

  it("costs each purchase by the terms in force on its date", () => {
    assert.deepEqual(
      o.costs.map((c) => c.perUnit),
      [1_920.25, 320_000 / 150, 1_863.4, 558_620 / 300, 507_905 / 300, 1_909],
    );
    // The 8% from July needs more than 250 bicycles: the order of 20.12 has none.
    assert.equal(o.costs[5].discount, 0);
  });

  it("2024: the periodic average, no write-down, a customer discount on the two large sales", () => {
    near(y24.avgCost!, 1_953.95, "average");
    near(y24.closingCarrying, 586_185, "closing");
    assert.equal(y24.writeDown, 0);
    near(y24.saleQtyDiscounts, 185_600, "discounts");
    near(y24.netSales, 2_054_400, "net sales");
    near(y24.cogs, 1_367_765, "cogs");
    near(y24.grossProfit, 686_635, "gross profit");
    assert.deepEqual(y24.warnings, []);
  });

  it("2025: the order at sea is counted, and the stock is written down to NRV", () => {
    assert.equal(y25.closingUnits, 240);
    near(y25.avgCost!, 1_843.61, "average");
    near(y25.writeDown, 22_466.4, "write-down");
    near(y25.closingCarrying, 420_000, "closing");
    near(y25.cogs, 1_423_610, "cogs");
    near(y25.netSales, 2_079_000, "net sales");
    near(y25.grossProfit, 655_390, "gross profit");
    near(o.operating2025, 419_390, "operating profit");
  });

  it("the fire: FIFO up to the day, the consignment saved, the cap applied", () => {
    assert.equal(o.fire.unitsAtFire, 290);
    assert.equal(o.fire.burnedUnits, 260);
    near(o.fire.burned, 519_540, "claim");
    near(o.fire.settlement.deductible, 51_954, "deductible");
    near(o.fire.settlement.net, 450_000, "paid");
    assert.equal(o.fire.after.length, 1);
  });
});

describe("exam question 2: Mishak", () => {
  const x = mishak();

  it("a box's price from its contents, and its cost from the terms", () => {
    assert.deepEqual(x.boxPrices, [250, 276, 240, 270]);
    assert.deepEqual(
      x.costs.map((c) => c.perUnit),
      [253, 314, 239, 302],
    );
  });

  it("2025 by FIFO: the write-down, the customer discount and the rate", () => {
    near(x.year.closingCostBasis, 24_660, "closing at cost");
    near(x.year.closingCarrying, 21_150, "closing");
    near(x.year.writeDown, 3_510, "write-down");
    near(x.year.netSales, 52_200, "net sales");
    near(x.year.cogs, 40_810, "cogs");
    near(x.year.grossProfit, 11_390, "gross profit");
    assert.equal(x.rate, 0.22);
  });

  it("the fire by the gross profit method", () => {
    near(x.buy2026.total, 12_160, "2026 purchase");
    near(x.sales2026, 26_855, "sales to the fire");
    near(x.fire.atFire, 12_363.1, "stock at the fire");
    near(x.fire.savedCost, 3_198, "saved at cost");
    near(x.fire.burned, 9_165.1, "claim");
    near(x.fire.settlement.net, 7_665.1, "paid");
  });
});
