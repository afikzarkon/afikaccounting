import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced } from "./basics";
import {
  accumulatedTo,
  bookValue,
  depreciationOfYear,
  deviceResults,
  FORKLIFTS,
  forkliftResults,
  forMonths,
  monthsBetween,
  monthsInYear,
  OVEN,
  PRESS,
  sale,
  saleEntry,
  VAN,
  yearly,
} from "./basics-ppe";

describe("basics: fixed assets", () => {
  it("yearly depreciation by years or by rate, and part of a year by months", () => {
    assert.equal(yearly(OVEN.cost, OVEN.wear), 12_000);
    assert.equal(yearly(VAN.cost, VAN.wear), 28_000);
    assert.equal(monthsInYear(VAN.bought, 2025), 9);
    assert.equal(depreciationOfYear(VAN.cost, VAN.wear, VAN.bought, 2025), 21_000);
    assert.equal(depreciationOfYear(VAN.cost, VAN.wear, VAN.bought, 2026), 28_000);
    assert.equal(accumulatedTo(VAN.cost, VAN.wear, VAN.bought, { year: 2026, month: 12 }), 49_000);
    assert.equal(bookValue(VAN.cost, 49_000), 91_000);
  });

  it("months are counted from the first of the purchase month to the end of the last month", () => {
    assert.equal(monthsBetween({ year: 2022, month: 3 }, { year: 2022, month: 12 }), 10);
    assert.equal(monthsBetween({ year: 2022, month: 3 }, { year: 2025, month: 9 }), 43);
    assert.equal(forMonths(PRESS.cost, PRESS.wear, 43), 53_750);
  });

  it("accumulated depreciation stops at the cost", () => {
    assert.equal(accumulatedTo(OVEN.cost, OVEN.wear, OVEN.bought, { year: 2040, month: 12 }), OVEN.cost);
  });

  it("the press: depreciation to the sale, then a gain, a loss, or neither", () => {
    const acc = accumulatedTo(PRESS.cost, PRESS.wear, PRESS.bought, PRESS.sold);
    assert.equal(acc, 12_500 + 15_000 + 15_000 + 11_250);
    assert.deepEqual(sale(PRESS.cost, acc, PRESS.proceeds), { bookValue: 21_250, result: 3_750 });
    assert.deepEqual(sale(PRESS.cost, acc, PRESS.lowProceeds), { bookValue: 21_250, result: -3_250 });
    assert.equal(sale(PRESS.cost, acc, 21_250).result, 0);
    const asset = { account: "מכונות", accumulatedAccount: "מכונות – פחת נצבר", cost: PRESS.cost, accumulated: acc };
    const gain = saleEntry("1", "מכירה", asset, PRESS.proceeds);
    const loss = saleEntry("2", "מכירה", asset, PRESS.lowProceeds);
    const even = saleEntry("3", "מכירה", asset, 21_250);
    for (const e of [gain, loss, even]) assert.ok(isBalanced(e));
    assert.deepEqual(gain.lines.at(-1), { account: "רווח הון", cr: 3_750 });
    assert.ok(loss.lines.some((l) => l.account === "הפסד הון" && l.dr === 3_250));
    assert.equal(even.lines.length, 3);
  });

  it("the forklifts: what's left on the books, and accumulated depreciation to last year's end", () => {
    const r = forkliftResults();
    assert.equal(r.cost, 156_000);
    assert.equal(r.monthsToLastYear, 33);
    assert.equal(r.accumulated, 42_900);
    assert.equal(r.yearDep, 15_600);
    assert.equal(FORKLIFTS.count - FORKLIFTS.soldCount, r.left);
  });

  it("the devices: the cost back from accumulated depreciation through X", () => {
    const r = deviceResults();
    assert.equal(r.units, 20);
    assert.equal(r.months, 15);
    assert.equal(r.x, 2_200);
    assert.equal(r.laptop, 4_400);
    assert.equal(r.cost, 44_000);
    assert.equal(r.yearDep, 11_000);
  });
});
