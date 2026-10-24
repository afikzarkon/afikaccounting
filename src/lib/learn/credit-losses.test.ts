import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, typeOf } from "./basics";
import { ALLOW, ALON, ALON_LOW, allCreditLossEntries, DOR, ERAN, EXPENSE, GILBOA, SCENARIO_A, SCENARIO_B, SCENARIO_C, SELF } from "./credit-losses";

describe("credit losses: the model", () => {
  it("every journal entry balances and every account has a type", () => {
    for (const e of allCreditLossEntries()) {
      assert.ok(isBalanced(e), `entry ${e.id}: ${e.text}`);
      for (const l of e.lines) assert.ok(typeOf(l.account));
    }
  });
});

describe("Alon: the first example", () => {
  it("customers close at 800,000 and the allowance is topped up from 18,000 to 40,000", () => {
    assert.equal(ALON.result.gross, 800_000);
    assert.equal(ALON.mid.allowance, 18_000);
    assert.equal(ALON.result.allowance, 40_000);
    assert.equal(ALON.result.expense, 22_000);
    assert.equal(ALON.result.net, 760_000);
  });
  it("reverses 2,000 when only 16,000 is required", () => {
    assert.equal(ALON_LOW.result.allowance, 16_000);
    assert.equal(ALON_LOW.result.expense, -2_000);
    assert.equal(ALON_LOW.adj.lines[0].account, ALLOW);
  });
});

describe("the four scenarios", () => {
  it("A: opening gross and allowance from the net", () => {
    assert.equal(SCENARIO_A.openingAR, 600_000);
    assert.equal(SCENARIO_A.openingAllowance, 30_000);
    assert.equal(SCENARIO_A.result.gross, 670_000);
    assert.equal(SCENARIO_A.result.expense, 13_500);
  });
  it("B: the rate from last year, then the expense", () => {
    assert.equal(SCENARIO_B.rate, 0.05);
    assert.equal(SCENARIO_B.result.gross, 1_040_000);
    assert.equal(SCENARIO_B.required, 52_000);
    assert.equal(SCENARIO_B.mid.allowance, 17_000);
    assert.equal(SCENARIO_B.result.expense, 35_000);
  });
  it("C: collections balance the customers account", () => {
    assert.equal(SCENARIO_C.collections, 1_176_000);
    assert.equal(SCENARIO_C.result.gross, SCENARIO_C.closingAR);
    assert.equal(SCENARIO_C.result.allowance, 18_400);
    assert.equal(SCENARIO_C.result.expense, 16_400);
  });
  it("D: specific plus general, and the double count of the mistake", () => {
    assert.equal(DOR.result.gross, 900_000);
    assert.equal(DOR.required, 75_600);
    assert.equal(DOR.result.expense, 25_600);
    assert.equal(DOR.specific + DOR.wrongGeneral - DOR.required, 2_400);
  });
  it("D, bankrupt: the allowance runs to a debit, and the year end tops it up", () => {
    assert.equal(DOR.bankrupt.mid.allowance, -10_000);
    assert.equal(DOR.bankrupt.result.allowance, 33_600);
    assert.equal(DOR.bankrupt.result.expense, 43_600);
  });
});

describe("Eran and Gilboa", () => {
  it("Eran: customers 635,000, allowance 25,400", () => {
    assert.equal(ERAN.mid.gross, 635_000);
    assert.equal(ERAN.result.allowance, 25_400);
    assert.equal(ERAN.result.expense, 16_400);
  });
  it("Gilboa: 1,074,000 gross, 92,200 allowance, 981,800 net, 71,200 expense", () => {
    assert.equal(GILBOA.openingGross, 960_000);
    assert.equal(GILBOA.openingAllowance, 48_000);
    assert.equal(GILBOA.result.gross, 1_074_000);
    assert.equal(GILBOA.required, 92_200);
    assert.equal(GILBOA.net, 981_800);
    assert.equal(GILBOA.result.expense, 71_200);
  });
});

describe("self-check", () => {
  it("matches the written answers", () => {
    assert.equal(SELF[0].mid.allowance, -6_000);
    assert.equal(SELF[0].result.expense, 46_000);
    assert.equal(SELF[1].result.allowance, 54_000);
    assert.equal(SELF[1].result.expense, 18_000);
    assert.equal(SELF[2].result.gross, 400_000);
    assert.equal(SELF[2].result.expense, -9_500);
    assert.equal(SELF[2].adj.lines[1].account, EXPENSE);
  });
});
