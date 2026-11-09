import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced } from "../learn/basics";
import * as Chg from "./ifrs16/lessons/changes";

/**
 * Lesson 5's additions, worked again without the lesson's helpers: every
 * balance from dated cash flows, every table added up, every entry balanced.
 */

/** The value of dated flows, on the day the clock reads zero; t in years. */
const npv = (flows: [number, number][], r: number) => flows.reduce((s, [t, a]) => s + a / (1 + r) ** t, 0);
const yearly = (n: number, amount: number, first = 1): [number, number][] => Array.from({ length: n }, (_, k) => [first + k, amount]);
const near = (a: number, b: number, label = "", within = 2) => assert.ok(Math.abs(a - b) <= within, `${label}: ${a} ≠ ${b}`);
const answer = (id: string) => (Chg.CHANGES.exercises.find((x) => x.id === id) as { answer: number }).answer;

describe("lesson 5 additions: a lease in dollars", () => {
  const { payment, years, rate, open, avg, close } = Chg.USD;
  it("the dollar column, from the payments", () => {
    near(Chg.USD_L0, npv(yearly(years, payment), rate), "start");
    near(Chg.USD_L1, npv(yearly(years - 1, payment), rate), "end of year 1");
    near(Chg.USD_INT, npv(yearly(years, payment), rate) * rate, "interest");
    near(Chg.USD_NC_USD, npv(yearly(years - 2, payment), rate), "non-current");
    assert.equal(Chg.USD_L0 + Chg.USD_INT - payment, Chg.USD_L1);
  });
  it("the shekel column adds up, the exchange difference is what is left, the asset stays at the first rate", () => {
    near(Chg.USD_L0_ILS, npv(yearly(years, payment), rate) * open, "liability in shekels");
    near(Chg.USD_L1_ILS, npv(yearly(years - 1, payment), rate) * close, "closing in shekels");
    near(Chg.USD_INT_ILS, Chg.USD_INT * avg, "interest in shekels", 1);
    assert.equal(Chg.USD_PAID_ILS, payment * close);
    assert.equal(Chg.USD_L0_ILS + Chg.USD_INT_ILS + Chg.USD_FX - Chg.USD_PAID_ILS, Chg.USD_L1_ILS);
    assert.ok(Chg.USD_FX > 0, "the dollar rose, so a loss");
    near(Chg.USD_DEP, Chg.USD_L0_ILS / years, "depreciation", 1);
    assert.equal(Chg.USD_ROU1, Chg.USD_L0_ILS - Chg.USD_DEP);
    assert.equal(Chg.USD_CUR + Chg.USD_NC, Chg.USD_L1_ILS);
    near(Chg.USD_CUR, (payment - npv(yearly(years - 1, payment), rate) * rate) * close, "current: next year's payment less next year's interest, at the closing rate");
    assert.equal(Chg.USD_FIN, Chg.USD_INT_ILS + Chg.USD_FX);
    assert.ok(Chg.USD_ROU_WRONG > Chg.USD_ROU1);
  });
  it("the year-end entry balances", () => {
    const dr = Chg.USD_INT_ILS + Chg.USD_FX + (Chg.USD_PAID_ILS - Chg.USD_INT_ILS - Chg.USD_FX);
    assert.equal(dr, Chg.USD_PAID_ILS);
  });
});

describe("lesson 5 additions: leaving early, and a purchase option that falls away", () => {
  it("the termination used: the debt falls to the penalty, the rest of the asset is the loss", () => {
    const { payment, years, rate, breakYear, penalty } = Chg.QUIT;
    const cost = npv(yearly(years, payment), rate);
    near(Chg.QUIT_COST, cost, "cost");
    near(Chg.QUIT_A, cost * (years - breakYear) / years, "asset after 3 years");
    near(Chg.QUIT_L, npv(yearly(years - breakYear, payment), rate), "liability");
    near(Chg.QUIT_LOSS, cost * (years - breakYear) / years - (npv(yearly(years - breakYear, payment), rate) - penalty), "loss");
    // The table: liability −L + (L − penalty) + penalty = 0; asset A − (L − penalty) − loss = 0.
    assert.equal(-Chg.QUIT_L - Chg.QUIT_CHANGE + penalty, 0);
    assert.equal(Chg.QUIT_A + Chg.QUIT_CHANGE - Chg.QUIT_LOSS, 0);
    // The entry: Dr liability, Dr loss = Cr asset, Cr cash.
    assert.equal(Chg.QUIT_L + Chg.QUIT_LOSS, Chg.QUIT_A + penalty);
    assert.ok(Chg.QUIT_LOSS > 0);
  });
  it("the purchase option that falls away", () => {
    const { payment, years, rate, option, life, passed, newRate } = Chg.DROP;
    const cost = npv([...yearly(years, payment), [years, option]], rate);
    near(Chg.DROP_COST, cost, "cost");
    near(Chg.DROP_A, cost - (cost / life) * passed, "asset");
    near(Chg.DROP_BEFORE, npv([...yearly(years - passed, payment), [years - passed, option]], rate), "before");
    near(Chg.DROP_AFTER, npv(yearly(years - passed, payment), newRate), "after");
    assert.equal(Chg.DROP_A + Chg.DROP_CHANGE, Chg.DROP_ASSET);
    near(Chg.DROP_DEP2, Chg.DROP_ASSET / (years - passed), "depreciation over the term", 1);
    assert.ok(Chg.DROP_DEP2 > 2 * Chg.DROP_DEP, "the screen says more than twice");
  });
});

describe("lesson 5 additions: a modification on 1.10", () => {
  const S = Chg.STUB;
  it("rolled to the day with the compound rate, remeasured on the new schedule, rolled to 31.12", () => {
    const L0 = npv(yearly(S.years - S.passed, S.payment), S.rate);
    near(Chg.STUB_L0, L0, "31.12 of year 2");
    near(Chg.STUB_L_BEFORE, L0 * 1.06 ** 0.75, "1.10 before");
    // On 1.10 the new payments fall 0.25, 1.25, ... years away.
    const after = npv(yearly(S.years - S.passed + S.extra, S.newPayment, 0.25), S.newRate);
    near(Chg.STUB_L_AFTER, after, "1.10 after");
    near(Chg.STUB_L_CLOSE, npv(yearly(S.years - S.passed + S.extra - 1, S.newPayment), S.newRate), "31.12 of year 3");
    near(Chg.STUB_INT2, after * (1.08 ** 0.25 - 1), "three months' interest");
    near(Chg.STUB_NC, npv(yearly(S.years - S.passed + S.extra - 2, S.newPayment), S.newRate), "non-current");
    assert.equal(Chg.STUB_L_BEFORE + Chg.STUB_CHANGE, Chg.STUB_L_AFTER);
    assert.equal(Chg.STUB_L_AFTER + Chg.STUB_INT2 - S.newPayment, Chg.STUB_L_CLOSE);
    assert.equal(Chg.STUB_CUR + Chg.STUB_NC, Chg.STUB_L_CLOSE);
    assert.equal(Chg.STUB_INT, Chg.STUB_INT1 + Chg.STUB_INT2);
  });
  it("the asset: nine months on the old term, then three of the 63 months left", () => {
    const cost = npv(yearly(S.years, S.payment), S.rate);
    near(Chg.STUB_A0, (cost * (S.years - S.passed)) / S.years, "31.12 of year 2");
    near(Chg.STUB_DEP1, (cost / S.years) * 0.75, "nine months", 1);
    assert.equal(Chg.STUB_MONTHS_LEFT, 3 + 12 * 5);
    assert.equal(Chg.STUB_A_BEFORE + Chg.STUB_CHANGE, Chg.STUB_A_AFTER);
    near(Chg.STUB_DEP2, (Chg.STUB_A_AFTER * 3) / 63, "three months", 1);
    assert.equal(Chg.STUB_A_AFTER - Chg.STUB_DEP2, Chg.STUB_A_CLOSE);
    assert.equal(Chg.STUB_DEP_YEAR, Chg.STUB_DEP1 + Chg.STUB_DEP2);
  });
  it("simple interest: i × m/12, and both roads meet on 31.12", () => {
    near(Chg.STUB_S_INT1, Chg.STUB_L0 * 0.06 * 0.75, "nine months simple", 1);
    near(Chg.STUB_S_AFTER, (S.newPayment + npv(yearly(5, S.newPayment), S.newRate)) / 1.02, "1.10 after, simple");
    assert.equal(Chg.STUB_S_AFTER + Chg.STUB_S_INT2 - S.newPayment, Chg.STUB_L_CLOSE);
    assert.equal(Chg.STUB_S_BEFORE + Chg.STUB_S_CHANGE, Chg.STUB_S_AFTER);
    assert.ok(Chg.STUB_S_INT1 > Chg.STUB_INT1, "simple runs above compound for part of a year");
  });
});

describe("lesson 5 additions: a reassessment and a modification on one day", () => {
  const S = Chg.SAME;
  it("step 1 then step 2, every row of the table nets to zero", () => {
    const cost = npv(yearly(10, S.payment), S.rate);
    near(Chg.SAME_COST, cost, "cost");
    near(Chg.SAME_A0, cost * 0.6, "asset");
    near(Chg.SAME_L0, npv(yearly(6, S.payment), S.rate), "liability");
    near(Chg.SAME_L1, npv(yearly(2, S.payment), S.newRate), "after the reassessment");
    near(Chg.SAME_AFTER, npv(yearly(2, S.newPayment), S.newRate), "after the modification");
    const A1 = cost * 0.6 + npv(yearly(2, S.payment), S.newRate) - npv(yearly(6, S.payment), S.rate);
    near(Chg.SAME_GAIN, npv(yearly(2, S.payment), S.newRate) * 0.4 - A1 * 0.4, "gain");
    assert.equal(-Chg.SAME_L0 - Chg.SAME_CH1 + Chg.SAME_L_OUT - Chg.SAME_REM, -Chg.SAME_AFTER);
    assert.equal(Chg.SAME_A0 + Chg.SAME_CH1 - Chg.SAME_A_OUT + Chg.SAME_REM, Chg.SAME_ASSET);
    // Step 2's entry: Dr L out + Dr asset rem = Cr asset out + Cr gain + Cr liability rem.
    assert.equal(Chg.SAME_L_OUT + Chg.SAME_REM, Chg.SAME_A_OUT + Chg.SAME_GAIN + Chg.SAME_REM);
    assert.ok(Chg.SAME_A1 > 0 && Chg.SAME_GAIN > 0);
  });
  it("the one-step reading gives another gain on the same liability", () => {
    near(Chg.SAME_ONE_A_OUT, Chg.SAME_A0 * 0.8, "asset out", 1);
    near(Chg.SAME_ONE_KEEP, npv(yearly(2, S.payment * 0.6), S.rate), "kept at the old rate");
    assert.equal(Chg.SAME_ONE_L_OUT - Chg.SAME_ONE_A_OUT, Chg.SAME_ONE_GAIN);
    assert.equal(Chg.SAME_A0 - Chg.SAME_ONE_A_OUT + Chg.SAME_ONE_REM, Chg.SAME_ONE_ASSET);
    assert.equal(Chg.SAME_ONE_KEEP + Chg.SAME_ONE_REM, Chg.SAME_AFTER);
    assert.ok(Chg.SAME_ONE_GAIN > Chg.SAME_GAIN);
    // Both roads end on the same liability; the asset differs by exactly the difference in gain.
    assert.equal(Chg.SAME_ONE_ASSET - Chg.SAME_ASSET, Chg.SAME_ONE_GAIN - Chg.SAME_GAIN);
  });
});

describe("lesson 5 additions: the capped index, and the practice", () => {
  it("the cap", () => {
    assert.equal(Chg.CAP_PAYMENT, 82_400);
    near(Chg.CAP_CHANGE, npv(yearly(4, 2_400), 0.05), "the debt rises", 1);
  });
  it("each new question's answer, from its own figures", () => {
    near(answer("cap-index"), 80_000 * 1.03, "cap-index", 0);
    near(answer("usd-fx"), 42_500 * 3.8 - 50_000 * 3.5 - 2_500 * 3.6 + 10_000 * 3.8, "usd-fx", 0.5);
    assert.equal(answer("exit-loss"), 170_000 - (200_000 - 40_000));
    assert.equal(answer("buy-drop"), (120_000 - 18_000) / 3);
    near(answer("stub-int"), 400_000 * 1.06 ** 0.25 - 400_000, "stub-int", 0.5);
    near(answer("stub-new"), npv(yearly(4, 50_000, 0.75), 0.08), "stub-new", 1);
    assert.equal(answer("same-gain"), 0.2 * 250_000 - 0.2 * (360_000 - 150_000));
  });
  it("the new questions stand alone, have meta, and end on a trap", () => {
    const ids = ["cap-index", "usd-rou", "usd-fx", "exit-loss", "buy-drop", "later-separate", "stub-int", "stub-new", "same-order", "same-gain"];
    for (const id of ids) {
      const x = Chg.CHANGES.exercises.find((q) => q.id === id);
      assert.ok(x, id);
      assert.ok(x.kind !== "journal", id);
      assert.ok(!/באותו|באותה|אותם|אותן|כמו בשאלה|השאלה הקודמת/.test(x.prompt), id);
      assert.ok(x.steps.at(-1)!.startsWith("מלכודת נפוצה:"), id);
      assert.ok(!/NaN|undefined|Infinity/.test([x.prompt, ...x.steps].join(" ")), id);
      assert.ok(Chg.CHANGES_TAUGHT[id], id);
    }
    for (const x of Chg.CHANGES.exercises) if (x.kind === "journal") assert.ok(isBalanced(x.entry), x.id);
  });
});
