import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as X from "./ifrs16/lessons/exam";

/**
 * Lesson 9, the three new exams and the new mixed practice: every figure again,
 * from dated cash flows or plain arithmetic, without the course's solver.
 */

/** Today's value of amounts due at times t (in years). */
const pv = (rate: number, flows: [number, number][]) => flows.reduce((s, [t, a]) => s + a / (1 + rate) ** t, 0);
/** n equal amounts at the end of years 1..n, seen from `at` years after today (at may be negative or a fraction). */
const yearly = (amount: number, n: number, from = 1): [number, number][] => Array.from({ length: n }, (_, k) => [from + k, amount]);
/** The rate at which the flows are worth `price` today, by Newton's method. */
function irr(price: number, flows: [number, number][]) {
  let r = 0.05;
  for (let i = 0; i < 100; i++) {
    const f = pv(r, flows) - price;
    const d = flows.reduce((s, [t, a]) => s - (t * a) / (1 + r) ** (t + 1), 0);
    r -= f / d;
  }
  return r;
}
const near = (a: number, b: number, label: string, tol = 2) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} ≠ ${b}`);
type Line = { account: string; dr?: number; cr?: number };
const balanced = (lines: Line[], label: string) => {
  const dr = lines.reduce((s, l) => s + (l.dr ?? 0), 0);
  const cr = lines.reduce((s, l) => s + (l.cr ?? 0), 0);
  assert.equal(dr, cr, label);
  for (const l of lines) assert.ok((l.dr ?? 0) >= 0 && (l.cr ?? 0) >= 0, `${label}: ${l.account}`);
};

describe("exam 5: a shop fitted out, a change on 1.10, a machine by the dollar", () => {
  it("the shop's first day and year 1", () => {
    near(X.E_L0, pv(0.06, yearly(120_000, 6)), "liability");
    assert.equal(X.E_ROU0, X.E_L0 - 60_000);
    near(X.E_L1, pv(0.06, yearly(120_000, 5)), "liability 31.12.1");
    near(X.E_DEP, X.E_ROU0 / 6, "depreciation");
    near(X.E_IMP_DEP1, (180_000 / 69) * 9, "improvements, 1.4 to 31.12");
  });
  it("to 1.10 of year 2, compound, then the new schedule with its first payment three months away", () => {
    near(X.E_L_BEFORE, pv(0.06, yearly(120_000, 5, 0.25)), "liability on 1.10, old terms");
    near(X.E_STUB_SIMPLE, X.E_L1 * 0.06 * 0.75, "simple interest");
    near(X.E_L_MOD, pv(0.07, yearly(105_000, 8, 0.25)), "liability on 1.10, new terms");
    near(X.E_ROU_BEFORE, X.E_ROU0 * (1 - 21 / 72), "asset before");
    near(X.E_ROU_MOD, X.E_ROU0 * (1 - 21 / 72) + pv(0.07, yearly(105_000, 8, 0.25)) - pv(0.06, yearly(120_000, 5, 0.25)), "asset after", 3);
    near(X.E_ROU2, X.E_ROU_MOD * (84 / 87), "asset 31.12.2");
    near(X.E_L2, pv(0.07, yearly(105_000, 7)), "liability 31.12.2");
    near(X.E_L2_NC, pv(0.07, yearly(105_000, 6)), "non-current");
    near(X.E_IMP2, 180_000 * (1 - 18 / 69) * (84 / 87), "improvements 31.12.2", 3);
    assert.equal(X.E_LEFT, 87);
  });
  it("the shop's tables add up", () => {
    assert.equal(X.E_L0 + X.E_I1 - 120_000, X.E_L1);
    assert.equal(X.E_L1 + X.E_STUB_INT + X.E_UP + X.E_INT_3 - 105_000, X.E_L2);
    assert.equal(X.E_ROU1 - X.E_DEP_9 + X.E_UP - X.E_DEP_3, X.E_ROU2);
    assert.equal(X.E_ROU0 - X.E_DEP, X.E_ROU1);
    assert.equal(180_000 - X.E_IMP_DEP1 - X.E_IMP_DEP_9 - X.E_IMP_DEP_3, X.E_IMP2);
    assert.equal(X.E_INT2, X.E_STUB_INT + X.E_INT_3);
  });
  it("the machine: dollars at the closing rate, the asset at the first day's", () => {
    near(X.E_USD0, pv(0.05, yearly(49_000, 4)), "dollars");
    near(X.E_USD1, pv(0.05, yearly(49_000, 3)), "dollars 31.12");
    assert.equal(X.E_M_ROU0, X.E_USD0 * 3.5);
    assert.equal(X.E_M_CLOSE, X.E_USD1 * 3.75);
    assert.equal(X.E_M_INT, X.E_USD_INT * 3.75);
    assert.equal(X.E_M_FX, X.E_USD0 * (3.75 - 3.5));
    assert.equal(X.E_M_DEP, X.E_M_ROU0 / 4);
    near(X.E_M_NC, pv(0.05, yearly(49_000, 2)) * 3.75, "non-current");
  });
  it("profit or loss, and the entries", () => {
    assert.equal(X.E_PL, X.E_DEP_9 + X.E_DEP_3 + X.E_IMP_DEP_9 + X.E_IMP_DEP_3 + X.E_M_DEP + X.E_STUB_INT + X.E_INT_3 + X.E_M_INT + X.E_M_FX);
    balanced(X.E_ENTRY_START, "first day");
    balanced(X.E_ENTRY_MOD, "the change");
  });
});

describe("exam 6: a lessor with a rate, maintenance, a change of mind and a shorter lease", () => {
  it("allocation, net investment, gain", () => {
    assert.equal(X.F_LEASE, 225_000);
    assert.equal(X.F_SERVICE, 45_000);
    const ni = pv(0.08, [...yearly(225_000, 5), [5, 60_000]]);
    near(X.F_NI0, ni, "net investment");
    near(X.F_GAIN, ni - 12_000 - 880_000, "gain");
    assert.equal(X.F_GAIN, X.F_FV - 880_000);
    assert.ok(X.F_PV_PAY / X.F_FV > 0.9, "finance");
  });
  it("years 1, 2", () => {
    near(X.F_NI1, pv(0.08, [...yearly(225_000, 4), [4, 60_000]]), "31.12.1");
    near(X.F_NI2, pv(0.08, [...yearly(225_000, 3), [3, 60_000]]), "31.12.2");
    assert.equal(X.F_NI0 + X.F_I1 - 225_000, X.F_NI1);
    assert.equal(X.F_NI1 + X.F_I2 - 225_000, X.F_NI2);
  });
  it("what two past papers would book on 1.4", () => {
    const before = pv(0.08, [...yearly(225_000, 4, 0.75), [3.75, 60_000]]);
    const after = pv(0.08, yearly(225_000, 6, 0.75));
    near(X.F_PAPERS, after - before, "papers' gain");
  });
  it("the change: would have been operating, then a new lease", () => {
    const modified = pv(0.08, [[1, 225_000], [2, 225_000 + 40_000], [3, 185_000], [4, 185_000]]);
    near(X.F_MOD_PV, modified, "modified payments");
    assert.ok(modified / X.F_FV < 0.9, "operating");
    assert.equal(X.F_INCOME3, 205_000);
    assert.equal(X.F_DEFER3, 20_000);
    near(X.F_DEP3, X.F_NI2 / 5, "depreciation");
    assert.equal(X.F_MACHINE3 + X.F_DEP3, X.F_NI2);
    assert.equal(X.F_PL1, X.F_GAIN + X.F_I1 + 45_000);
    assert.equal(X.F_PL2, X.F_I2 + 45_000);
    assert.equal(X.F_PL3, 205_000 + 45_000 - X.F_DEP3);
    balanced(X.F_ENTRY_START, "first day");
    balanced(X.F_ENTRY_Y1, "31.12.1");
    balanced(X.F_ENTRY_MOD, "the change");
  });
});

describe("exam 7: a sublease with an incentive, deferred tax, a floor to come, a building that may come back", () => {
  it("the warehouse before the sublease", () => {
    near(X.G_WH_ROU0, pv(0.05, yearly(210_000, 8)), "asset");
    near(X.G_WH_ROU2, pv(0.05, yearly(210_000, 8)) * 0.75, "asset 31.12.2");
    near(X.G_WH_L2, pv(0.05, yearly(210_000, 6)), "liability 31.12.2");
    near(X.G_WH_L3, pv(0.05, yearly(210_000, 5)), "liability 31.12.3");
  });
  it("the sublease: the incentive in the net investment, a lower rate", () => {
    const rate = irr(1_200_000, yearly(250_000, 6));
    assert.ok(Math.abs(rate - X.G_SUB_RATE) < 1e-7, "rate");
    near(X.G_NI3, pv(rate, yearly(250_000, 5)), "31.12.3");
    assert.equal(X.G_SUB_GAIN, 1_150_000 - X.G_WH_ROU2);
    const alt = irr(1_150_000, yearly(250_000, 6));
    near(X.G_ALT_DIFF, 50_000 + 1_200_000 * rate - 1_150_000 * alt, "the shortcut's difference");
    assert.ok(alt > rate);
    balanced(X.G_ENTRY_SUB, "sublease");
  });
  it("the office and its deferred tax", () => {
    near(X.G_OFF_L0, pv(0.06, yearly(150_000, 5)), "liability");
    near(X.G_OFF_L1, pv(0.06, yearly(150_000, 4)), "liability 31.12");
    near(X.G_OFF_ROU1, X.G_OFF_L0 * 0.8, "asset 31.12");
    near(X.G_DT0, X.G_OFF_L0 * 0.23, "deferred tax, day one");
    near(X.G_DT_NET, (X.G_OFF_DEP + X.G_OFF_I - 150_000) * 0.23, "deferred tax income");
    near(X.G_DT_NET, (X.G_OFF_L1 - X.G_OFF_ROU1) * 0.23, "net deferred tax asset");
    balanced(X.G_ENTRY_OFF, "office");
  });
  it("the building: no sale, a financial liability with the repurchase price at the end", () => {
    const flows: [number, number][] = [...yearly(200_000, 4), [4, 2_700_000]];
    const rate = irr(3_000_000, flows);
    assert.ok(Math.abs(rate - X.G_SLB_RATE) < 1e-7, "rate");
    near(X.G_SLB_L1, pv(rate, [...yearly(200_000, 3), [3, 2_700_000]]), "liability 31.12");
    assert.ok(2_700_000 < 3_000_000);
    assert.equal(X.G_BLD1, 2_320_000);
    balanced(X.G_ENTRY_SLB, "sale and leaseback");
  });
  it("profit or loss", () => {
    assert.equal(X.G_PL, X.G_SUB_GAIN + X.G_SUB_I3 + X.G_DT_NET - X.G_WH_I3 - X.G_OFF_DEP - X.G_OFF_I - 80_000 - X.G_SLB_I);
    assert.equal(X.G_NI0 + X.G_SUB_I3 - 250_000, X.G_NI3);
    assert.equal(X.G_OFF_L0 + X.G_OFF_I - 150_000, X.G_OFF_L1);
    assert.equal(3_000_000 + X.G_SLB_I - 200_000, X.G_SLB_L1);
  });
});

describe("the new mixed practice", () => {
  const answer = (id: string) => (X.EXAM.exercises.find((x) => x.id === id) as { answer: number }).answer;
  it("every figure, recomputed", () => {
    near(answer("x-insure"), pv(0.06, yearly(30_000, 3)) - 3_000, "insurance", 1);
    near(answer("x-improve"), (150_000 / 4.5) * 0.5, "improvements", 1);
    near(answer("x-stub"), 400_000 * Math.sqrt(1.06), "stub", 1);
    assert.equal(answer("x-usd"), 20_000);
    near(answer("x-cap"), pv(0.05, yearly(103_000, 3)), "cap", 1);
    assert.equal(answer("x-exit"), 10_000);
    near(answer("x-lsr-rate"), pv(0.07, [...yearly(100_000, 4), [4, 20_000]]) - 335_000, "lessor's gain", 1);
    assert.equal(answer("x-tax"), 2_500);
  });
  it("every new question is mapped to the screen that teaches it", () => {
    const want: Record<string, string> = { "x-swap-late": "ls-what-swap", "x-consent": "ls-term-consent", "x-fees": "ls-term-fees", "x-insure": "ls-term-fees", "x-improve": "ls-sub-improve", "x-stub": "ls-chg-stub", "x-usd": "ls-chg-usd", "x-later": "ls-chg-mod", "x-sameday": "ls-chg-sameday", "x-cap": "ls-chg-index", "x-exit": "ls-chg-exit", "x-lsr-rate": "ls-lsr-rate", "x-expect": "ls-lmd-expect", "x-put": "ls-spc-ifrs15", "x-tax": "ls-spc-tax" };
    for (const [id, screen] of Object.entries(want)) {
      assert.equal(X.EXAM_TAUGHT[id], screen, id);
      assert.ok(X.EXAM.exercises.some((x) => x.id === id), id);
    }
    for (const id of ["ls-exm-e", "ls-exm-f", "ls-exm-g"]) assert.ok(X.EXAM.screens.some((s) => s.id === id), id);
  });
});
