import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, typeOf } from "./basics";
import { ALLOW, ALON, allCreditLossEntries, BARAK, DOR, ERAN, EXPENSE, GILBOA, HEN } from "./credit-losses";

describe("credit losses: the model", () => {
  it("every journal entry balances and every account has a type", () => {
    for (const e of allCreditLossEntries()) {
      assert.ok(isBalanced(e), `entry ${e.id}: ${e.text}`);
      for (const l of e.lines) assert.ok(typeOf(l.account));
    }
  });
});

describe("Alon: the T-account", () => {
  it("tops the allowance up from 18,000 to 40,000", () => {
    assert.equal(ALON.before, 18_000);
    assert.equal(ALON.result.allowance, 40_000);
    assert.equal(ALON.result.expense, 22_000);
  });
  it("reverses 2,000 when only 16,000 is required", () => {
    assert.equal(ALON.reversed.allowance, 16_000);
    assert.equal(ALON.reversed.expense, -2_000);
    assert.equal(ALON.reversal[1].lines[0].account, ALLOW);
  });
});

describe("Barak: unknown openings", () => {
  it("solves both opening balances backwards", () => {
    assert.equal(BARAK.openingAllowance, 37_000);
    assert.equal(BARAK.openingGross, 1_400_000);
  });
  it("posting forward from them lands on the given closing figures", () => {
    assert.equal(BARAK.result.gross, BARAK.closingGross);
    assert.equal(BARAK.result.allowance, BARAK.closingAllowance);
    assert.equal(BARAK.result.expense, BARAK.expense);
  });
});

describe("Hen: flat rate against aging", () => {
  it("the aging schedule covers all customers", () => assert.equal(HEN.bucketsTotal, HEN.gross));
  it("reverses 6,000 at a flat rate and adds 17,000 by aging", () => {
    assert.equal(HEN.flat, 25_000);
    assert.equal(HEN.aging, 48_000);
    assert.equal(HEN.flatEntry.lines[0].account, ALLOW);
    assert.equal(HEN.flatEntry.lines[0].dr, 6_000);
    assert.equal(HEN.agingEntry.lines[0].account, EXPENSE);
    assert.equal(HEN.agingEntry.lines[0].dr, 17_000);
  });
});

describe("Dor: specific against general", () => {
  it("requires 75,600, and the mistake double counts 2,400", () => {
    assert.equal(DOR.required, 75_600);
    assert.equal(DOR.wrongRequired - DOR.required, 2_400);
  });
  it("after bankruptcy the allowance runs to a debit and the year-end tops it up", () => {
    assert.equal(DOR.bankruptBefore, -10_000);
    assert.equal(DOR.bankruptResult.allowance, 33_600);
    assert.equal(DOR.bankruptResult.expense, 43_600);
  });
});

describe("Eran: credit sales and a recovered debt", () => {
  it("customers close at 635,000, the allowance at 25,400", () => {
    assert.equal(ERAN.mid.gross, 635_000);
    assert.equal(ERAN.mid.allowance, 9_000);
    assert.equal(ERAN.result.allowance, 25_400);
    assert.equal(ERAN.result.expense, 16_400);
  });
});

describe("Gilboa: the exam question", () => {
  it("solves the opening from the net", () => {
    assert.equal(GILBOA.openingGross, 960_000);
    assert.equal(GILBOA.openingAllowance, 48_000);
  });
  it("closes at 1,074,000 gross, 92,200 allowance, 981,800 net, 71,200 expense", () => {
    assert.equal(GILBOA.result.gross, 1_074_000);
    assert.equal(GILBOA.mid.allowance, 21_000);
    assert.equal(GILBOA.required, 92_200);
    assert.equal(GILBOA.net, 981_800);
    assert.equal(GILBOA.result.expense, 71_200);
  });
});
