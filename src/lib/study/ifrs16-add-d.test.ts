import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced } from "../learn/basics";
import * as Spc from "./ifrs16/lessons/special";

/**
 * Lesson 8, the additions: an incentive in a finance sublease, sale and leaseback
 * with a repurchase, a plain sale with a repurchase (IFRS 15), and deferred tax
 * (IAS 12). Every figure is worked again here over dated cash flows or plain
 * arithmetic, without the course's solver.
 */

/** The value today of amounts at the end of years 1, 2, ... (t = 0 is today). */
const npv = (flows: [number, number][], r: number) => flows.reduce((s, [t, a]) => s + a / (1 + r) ** t, 0);
const annual = (n: number, amount: number): [number, number][] => Array.from({ length: n }, (_, k) => [k + 1, amount]);
const near = (a: number, b: number, tol = 1, label = "") => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} ≠ ${b}`);
const answer = (id: string) => (Spc.SPECIAL.exercises.find((x) => x.id === id) as { answer: number }).answer;

describe("lesson 8 additions: the sublease incentive", () => {
  const s = Spc.SUBINC;
  it("the head lease and the asset that leaves", () => {
    const l0 = npv(annual(s.years, s.payment), s.rate);
    near(Spc.SUBINC_L0, l0, 0.5, "L0");
    near(Spc.SUBINC_ROU, l0 - (l0 / s.years) * s.done, 2, "ROU");
    near(Spc.SUBINC_L, npv(annual(s.left, s.payment), s.rate), 0.5, "liability");
    assert.equal(Spc.SUBINC_GAIN, s.rightFV - Spc.SUBINC_ROU);
  });
  it("the net investment carries the incentive, and the rate returns it", () => {
    assert.equal(Spc.SUBINC_NI, 920_000);
    // The lease payments: the receipts, less the incentive paid on day 0, are worth the fair value at the implicit rate.
    near(npv([[0, -s.incentive], ...annual(s.left, s.subPayment)], Spc.SUBINC_RATE), s.rightFV, 0.01, "definition");
    near(npv(annual(s.left, s.subPayment), Spc.SUBINC_RATE), Spc.SUBINC_NI, 0.01, "rate");
    near(npv(annual(s.left, s.subPayment), Spc.SUBINC_ALT_RATE), s.rightFV, 0.01, "alt rate");
    assert.ok(Spc.SUBINC_RATE < Spc.SUBINC_ALT_RATE);
    assert.ok(Math.abs(Spc.SUBINC_RATE * 100 - 3.9123) < 0.001);
  });
  it("the year adds up, and both ways end with the same profit over the term", () => {
    assert.equal(Spc.SUBINC_NI + Spc.SUBINC_INT - s.subPayment, Spc.SUBINC_CLOSE);
    near(Spc.SUBINC_CLOSE, npv(annual(s.left - 1, s.subPayment), Spc.SUBINC_RATE), 1, "close");
    near(Spc.SUBINC_ALT_CLOSE, npv(annual(s.left - 1, s.subPayment), Spc.SUBINC_ALT_RATE), 1, "alt close");
    assert.equal(Spc.SUBINC_Y1, Spc.SUBINC_GAIN + Spc.SUBINC_INT);
    assert.equal(Spc.SUBINC_ALT_Y1, Spc.SUBINC_GAIN - s.incentive + Spc.SUBINC_ALT_INT);
    assert.equal(Spc.SUBINC_TOTAL, 130_000);
    assert.equal(Spc.SUBINC_ALT_TOTAL, 170_000);
    assert.equal(Spc.SUBINC_GAIN + Spc.SUBINC_TOTAL, Spc.SUBINC_GAIN - s.incentive + Spc.SUBINC_ALT_TOTAL);
  });
  it("the entry on the day balances", () => {
    assert.equal(Spc.SUBINC_NI, Spc.SUBINC_ROU + s.incentive + Spc.SUBINC_GAIN);
  });
});

describe("lesson 8 additions: sale and leaseback with a repurchase", () => {
  const p = Spc.REPO;
  it("the effective rate, with the repurchase price as the last cash flow", () => {
    near(npv([...annual(p.years, p.payment), [p.years, p.buyBack]], Spc.REPO_RATE), p.price, 0.01, "rate");
    assert.ok(Math.abs(Spc.REPO_RATE * 100 - 3.6322) < 0.001);
  });
  it("two years of the liability, and the balance is what is still to pay", () => {
    assert.equal(p.price + Spc.REPO_INT - p.payment, Spc.REPO_CLOSE);
    assert.equal(Spc.REPO_CLOSE + Spc.REPO_INT2 - p.payment, Spc.REPO_CLOSE2);
    near(Spc.REPO_CLOSE, npv([...annual(p.years - 1, p.payment), [p.years - 1, p.buyBack]], Spc.REPO_RATE), 1, "close 1");
    near(Spc.REPO_CLOSE2, npv([...annual(p.years - 2, p.payment), [p.years - 2, p.buyBack]], Spc.REPO_RATE), 2, "close 2");
    assert.equal(Spc.REPO_TOTAL_INT, 420_000);
  });
  it("the year in profit or loss, and the asset that stays", () => {
    assert.equal(Spc.REPO_DEP, 140_000);
    assert.equal(Spc.REPO_ASSET1, 1_960_000);
    assert.equal(Spc.REPO_EXP, 140_000 + Spc.REPO_INT);
    assert.equal(Spc.REPO_GAP, 900_000);
  });
});

describe("lesson 8 additions: a plain sale with a repurchase", () => {
  const m = Spc.MACH;
  it("the put: a lease, income only on what does not come back", () => {
    assert.equal(Spc.MACH_DEFERRED, 250_000);
    assert.equal(Spc.MACH_INCOME, 125_000);
    assert.equal(Spc.MACH_DEF1, 125_000);
    assert.equal(Spc.MACH_DEP, 70_000);
    assert.equal(Spc.MACH_ASSET1, 630_000);
    assert.equal(Spc.MACH_NET1, 55_000);
    assert.equal(Spc.MACH_SALE_PROFIT, 300_000);
    assert.ok(m.putPrice > m.expectedValue && m.putPrice < m.price, "an incentive, below the price");
    assert.ok(m.highValue > m.putPrice, "the second case: no incentive");
    // The day's entries: cash against the refund and the income ahead; the crane from stock to leased assets.
    assert.equal(m.price, m.putPrice + Spc.MACH_DEFERRED);
  });
  it("the call above the price: financing, the difference is interest", () => {
    near((1 + Spc.MACH_FIN_RATE) ** 2 * m.price, m.highCall, 0.01, "rate");
    assert.ok(Math.abs(Spc.MACH_FIN_RATE * 100 - 2.4695) < 0.001);
    assert.equal(Spc.MACH_FIN_INT1, 24_695);
    assert.equal(Spc.MACH_FIN_TOTAL, 50_000);
  });
});

describe("lesson 8 additions: deferred tax", () => {
  const t = Spc.TAX;
  it("the lease, the asset and the liability at year end", () => {
    near(Spc.TAX_L, npv(annual(t.years, t.payment), t.rate), 0.5, "L");
    assert.equal(Spc.TAX_DEP, Math.round(Spc.TAX_L / t.years));
    assert.equal(Spc.TAX_L1, Spc.TAX_L + Spc.TAX_INT - t.payment);
    near(Spc.TAX_L1, npv(annual(t.years - 1, t.payment), t.rate), 1, "L1");
    assert.equal(Spc.TAX_ROU1, Spc.TAX_L - Spc.TAX_DEP);
    assert.equal(Spc.TAX_L_FALL, t.payment - Spc.TAX_INT);
  });
  it("equal at commencement, apart at year end, and the movement balances", () => {
    assert.deepEqual([Spc.TAX_D0, Spc.TAX_DTL1, Spc.TAX_DTA1, Spc.TAX_NET1], [96_884, 77_507, 79_697, 2_190]);
    near(Spc.TAX_NET1, (Spc.TAX_EXP - t.payment) * t.taxRate, 1, "the gap between expense and deduction");
    assert.equal(Spc.TAX_DTL_FALL - Spc.TAX_DTA_FALL, Spc.TAX_NET1);
    // The year-end entry: Dr deferred tax liability, Cr deferred tax asset, Cr deferred tax income.
    assert.equal(Spc.TAX_DTL_FALL, Spc.TAX_DTA_FALL + Spc.TAX_NET1);
  });
  it("the lessor taxed on rent received ahead", () => {
    assert.equal(Spc.TAX_PRE_CASH, 240_000);
    assert.equal(Spc.TAX_PRE_DEF1, 160_000);
    assert.equal(Spc.TAX_PRE_DTA, 36_800);
    assert.equal(Spc.TAX_PRE_CURRENT, 55_200);
    assert.equal(Spc.TAX_PRE_EXPENSE, t.prepaidRent * t.taxRate);
  });
});

describe("lesson 8 additions: the practice", () => {
  it("every new answer, worked again", () => {
    assert.equal(answer("subinc-ni"), 630_000);
    const incRate = (() => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (npv(annual(5, 150_000), mid) > 630_000) lo = mid;
        else hi = mid;
      }
      return lo;
    })();
    near(answer("subinc-int"), 630_000 * incRate, 0.51, "subinc-int");
    const solve = (target: number, flows: [number, number][]) => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (npv(flows, mid) > target) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    near(answer("repo-int"), 1_000_000 * solve(1_000_000, [...annual(3, 60_000), [3, 900_000]]), 0.51, "repo-int");
    near(answer("repo-pl"), 50_000 + 800_000 * solve(800_000, [...annual(2, 40_000), [2, 820_000]]), 0.51, "repo-pl");
    assert.equal(answer("put-income"), 40_000);
    const l = npv(annual(4, 50_000), 0.05);
    const l1 = npv(annual(3, 50_000), 0.05);
    near(answer("tax-y1"), (l1 - (l - l / 4)) * 0.25, 1, "tax-y1");
    assert.equal(answer("tax-lessor"), 23_000);
  });
  it("the new questions stand alone, carry meta, and the existing checks still hold", () => {
    const ids = ["subinc-ni", "subinc-way", "subinc-int", "repo-books", "repo-int", "repo-pl", "put-income", "put-none", "call-high", "tax-start", "tax-y1", "tax-lessor"];
    for (const id of ids) {
      const x = Spc.SPECIAL.exercises.find((e) => e.id === id);
      assert.ok(x, id);
      assert.ok(Spc.SPECIAL_TAUGHT[id], id);
      if (x.kind === "journal") assert.ok(isBalanced(x.entry), id);
      else assert.ok(!/באותו|באותה|אותם|אותן|כמו בשאלה|השאלה הקודמת/.test(x.prompt), id);
      if (x.kind === "number") assert.ok(x.answer > 0, id);
    }
    const levels = new Set(ids.map((id) => (Spc.SPECIAL.exercises.find((e) => e.id === id) as unknown as { meta: { level: number } }).meta.level));
    assert.deepEqual([...levels].sort(), [1, 2, 3]);
  });
});
