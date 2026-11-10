import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { A, acc, isNumeric, npv, pv, tBalance, workedText, type WorkedBody } from "./worked";

describe("the worked-solution layout", () => {
  it("writes an amount the accounting way, with each course's sign", () => {
    assert.equal(acc(1234567), "1,234,567");
    assert.equal(acc(-1234.5), "(1,234.50)");
    assert.equal(acc(-1234.5, "minus"), "-1,234.50");
    assert.equal(acc(10000, "paren", true), "10,000.00");
    assert.equal(acc(-0.004), "0");
    assert.equal(A(-500, "minus"), "`-500`");
  });

  it("knows a figure from a word", () => {
    for (const c of [12, "60%", "1 ÷ 1.05² = 0.907029", "(3,000)", "9/12"]) assert.ok(isNumeric(c), String(c));
    for (const c of ["", "שנה 1", "ח׳ מזומן"]) assert.ok(!isNumeric(c), c);
  });

  it("discounts as Excel does", () => {
    assert.equal(Math.round(pv(0.05, 3, 10_000) * 100) / 100, 27_232.48);
    assert.equal(Math.round(npv(0.08, [6_000, 66_000]) * 100) / 100, 62_139.92);
  });

  it("balances a T-card on its smaller side", () => {
    assert.deepEqual(tBalance({ name: "מזומן", dr: [["י.פ.", 5_000], ["מכירות", 12_000]], cr: [["ספקים", 8_000]] }), { amount: 9_000, side: "cr" });
    assert.deepEqual(tBalance({ name: "ספקים", dr: [["תשלומים", 47_500]], cr: [["י.פ.", 14_000], ["קניות", 52_000]] }), { amount: 18_500, side: "dr" });
  });

  it("puts the common trap last", () => {
    const w: WorkedBody = { givens: ["נתון"], steps: [{ h: "שלב", sheet: [{ l: "שורה", a: 1 }], result: "תוצאה" }], trap: "טעות" };
    assert.equal(workedText(w).at(-1), "מלכודת נפוצה: טעות");
  });
});
