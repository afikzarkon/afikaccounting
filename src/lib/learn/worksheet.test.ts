import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, trialBalance, tbBalanced, typeOf } from "./basics";
import { ZAYIT, RIMON, SIGAL, worksheetResult, worksheetRows } from "./worksheet";

describe("the worksheet questions", () => {
  for (const c of [RIMON, SIGAL, ZAYIT])
    it(`${c.name}: balanced before, every adjustment balanced, every account typed, the answers among the accounts offered`, () => {
      assert.ok(tbBalanced(trialBalance(c.preliminary)), "the trial balance before the adjustments");
      for (const it of c.items) {
        assert.ok(isBalanced(it.entry), it.title);
        for (const l of it.entry.lines) assert.ok(it.accounts.includes(l.account), `${it.title}: ${l.account}`);
        it.accounts.forEach(typeOf);
      }
      Object.keys(c.preliminary).forEach(typeOf);
      const rows = worksheetRows(c);
      const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + pick(r), 0);
      assert.equal(sum((r) => r.adjDr), sum((r) => r.adjCr), "the adjustments column balances");
      assert.equal(Math.round(sum((r) => r.after)), 0, "the final trial balance balances");
    });

  it("Rimon: worked out by hand — profit 138,400, retained earnings from 82,000 to 220,400", () => {
    // Income 690,000 + 37,000 + 2,400 + closing stock 58,000 = 787,400; expenses 51,000 + 344,000 + 204,000 + 9,000 + 21,000 + 15,000 + 5,000 = 649,000.
    const r = worksheetResult(RIMON);
    assert.equal(r.totalIncome, 787_400);
    assert.equal(r.totalExpenses, 675_000);
    assert.equal(r.profit, 112_400);
    assert.equal(r.closingRetained, 142_400);
  });

  it("Sigal: worked out by hand — profit 148,000, from accumulated losses of 35,000 to retained earnings of 113,000", () => {
    // Income 940,000 + 16,000 + 82,000 = 1,038,000; expenses 66,000 + 455,000 + 248,000 + 23,600 + 26,000 + 34,000 + 14,400 + 20,000 + 3,000 = 890,000.
    const r = worksheetResult(SIGAL);
    assert.equal(r.totalIncome, 1_038_000);
    assert.equal(r.profit, 148_000);
    assert.equal(r.openingRetained, -35_000);
    assert.equal(r.closingRetained, 113_000);
  });

  it("Zayit, the harder game: worked out by hand — profit 318,900, retained earnings from 99,000 to 417,900", () => {
    // Income: 1,480,000 + management fees 49,500 (54,000 − 9,000 + 4,500) + closing stock at NRV 118,000 = 1,647,500.
    // Expenses: 92,000 + 760,000 + 342,000 + rent 43,000 + insurance 12,000 + maintenance 12,000 + interest 16,200 + 44,000 + credit losses 7,400 = 1,328,600.
    const r = worksheetResult(ZAYIT);
    assert.equal(r.totalIncome, 1_649_050);
    assert.equal(r.totalExpenses, 1_351_850);
    assert.equal(r.profit, 297_200);
    assert.equal(r.closingRetained, 323_500);
    assert.equal(ZAYIT.unknown, "עודפים");
    assert.ok(ZAYIT.items.some((it) => it.entry.lines.length > 2), "a compound entry among them");
  });

  it("Sigal's sorting deck: more than twenty cards, with the traps among them", () => {
    const accounts = Object.keys(SIGAL.preliminary);
    assert.ok(accounts.length >= 20, `${accounts.length} cards`);
    for (const a of ["הפרשה להפסדי אשראי חזויים", "מקדמות לספקים", "מקדמות מלקוחות", "עודפים", "הוצאות ביטוח מראש"]) assert.ok(accounts.includes(a), a);
    assert.ok(SIGAL.preliminary["עודפים"] > 0, "retained earnings in debit: accumulated losses");
  });
});
