import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, typeOf } from "./basics";
import { ALLOW, EREZ, EREZ_LOW, allCreditLossEntries, MORIA, NEVO, EXPENSE, CARMEL, SCENARIO_A, SCENARIO_B, SCENARIO_C, SELF } from "./credit-losses";

describe("credit losses: the model", () => {
  it("every journal entry balances and every account has a type", () => {
    for (const e of allCreditLossEntries()) {
      assert.ok(isBalanced(e), `entry ${e.id}: ${e.text}`);
      for (const l of e.lines) assert.ok(typeOf(l.account));
    }
  });
});

describe("Erez: the first example", () => {
  it("customers close at 760,000 and the allowance is topped up from 18,000 to 38,000", () => {
    assert.equal(EREZ.result.gross, 760_000);
    assert.equal(EREZ.mid.allowance, 18_000);
    assert.equal(EREZ.result.allowance, 38_000);
    assert.equal(EREZ.result.expense, 20_000);
    assert.equal(EREZ.result.net, 722_000);
  });
  it("reverses 2,800 when only 15,200 is required", () => {
    assert.equal(EREZ_LOW.result.allowance, 15_200);
    assert.equal(EREZ_LOW.result.expense, -2_800);
    assert.equal(EREZ_LOW.adj.lines[0].account, ALLOW);
  });
});

describe("the four scenarios", () => {
  it("A: opening gross and allowance from the net", () => {
    assert.equal(SCENARIO_A.openingAR, 700_000);
    assert.equal(SCENARIO_A.openingAllowance, 35_000);
    assert.equal(SCENARIO_A.result.gross, 798_000);
    assert.equal(SCENARIO_A.result.expense, 16_900);
  });
  it("B: the rate from last year, then the expense", () => {
    assert.equal(SCENARIO_B.rate, 0.04);
    assert.equal(SCENARIO_B.result.gross, 858_000);
    assert.equal(SCENARIO_B.required, 34_320);
    assert.equal(SCENARIO_B.mid.allowance, 8_000);
    assert.equal(SCENARIO_B.result.expense, 26_320);
  });
  it("C: collections balance the customers account", () => {
    assert.equal(SCENARIO_C.collections, 1_036_000);
    assert.equal(SCENARIO_C.result.gross, SCENARIO_C.closingAR);
    assert.equal(SCENARIO_C.result.allowance, 20_750);
    assert.equal(SCENARIO_C.result.expense, 11_750);
  });
  it("D: specific plus general, and the double count of the mistake", () => {
    assert.equal(MORIA.result.gross, 750_000);
    assert.equal(MORIA.required, 71_250);
    assert.equal(MORIA.result.expense, 29_250);
    assert.equal(MORIA.specific + MORIA.wrongGeneral - MORIA.required, 2_250);
  });
  it("D, bankrupt: the allowance runs to a debit, and the year end tops it up", () => {
    assert.equal(MORIA.bankrupt.mid.allowance, -3_000);
    assert.equal(MORIA.bankrupt.result.allowance, 35_250);
    assert.equal(MORIA.bankrupt.result.expense, 38_250);
  });
});

describe("Nevo and Carmel", () => {
  it("Nevo: customers 558,000, allowance 27,900", () => {
    assert.equal(NEVO.mid.gross, 558_000);
    assert.equal(NEVO.result.allowance, 27_900);
    assert.equal(NEVO.result.expense, 18_900);
  });
  it("Carmel: 1,012,000 gross, 76,780 allowance, 935,220 net, 53,780 expense", () => {
    assert.equal(CARMEL.openingGross, 900_000);
    assert.equal(CARMEL.openingAllowance, 45_000);
    assert.equal(CARMEL.result.gross, 1_012_000);
    assert.equal(CARMEL.required, 76_780);
    assert.equal(CARMEL.net, 935_220);
    assert.equal(CARMEL.result.expense, 53_780);
  });
});

describe("self-check", () => {
  it("matches the written answers", () => {
    assert.equal(SELF[0].mid.allowance, -5_000);
    assert.equal(SELF[0].result.expense, 40_400);
    assert.equal(SELF[1].result.allowance, 49_320);
    assert.equal(SELF[1].result.expense, 15_320);
    assert.equal(SELF[2].result.gross, 450_000);
    assert.equal(SELF[2].result.expense, -12_700);
    assert.equal(SELF[2].adj.lines[1].account, EXPENSE);
  });
});
