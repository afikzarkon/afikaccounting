import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced } from "../learn/basics";
import * as Lsr from "./ifrs16/lessons/lessor";
import * as Lmd from "./ifrs16/lessons/lessor-changes";

/**
 * Agent C's additions to lessons 6 and 7: the implicit rate with no fair value, a service in a
 * lessor's contract, a change in the lessor's expectations, and a lump sum paid on a modification.
 * Every figure is recomputed here over dated cash flows or by plain arithmetic, not by the lesson's helpers.
 */

/** Today's value of dated amounts: [year, amount]. */
const npv = (flows: [number, number][], r: number) => flows.reduce((s, [t, a]) => s + a / (1 + r) ** t, 0);
const yearly = (from: number, to: number, a: number): [number, number][] => Array.from({ length: to - from + 1 }, (_, k) => [from + k, a]);
const near = (a: number, b: number, label = "", tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} ≠ ${b}`);
const balanced = (lines: { dr?: number; cr?: number }[]) => near(lines.reduce((s, l) => s + (l.dr ?? 0), 0), lines.reduce((s, l) => s + (l.cr ?? 0), 0), "entry", 0);

describe("lesson 6, ls-lsr-rate: the implicit rate and no fair value", () => {
  const T = Lsr.TRAC;
  it("the net investment is the present value of payments, guarantee and unguaranteed part", () => {
    const ni = npv([...yearly(1, 5, 60_000), [5, 20_000], [5, 10_000]], 0.07);
    near(Lsr.TRAC_NI, ni, "net investment");
    near(Lsr.TRAC_PV_PAY, npv(yearly(1, 5, 60_000), 0.07), "payments");
    near(Lsr.TRAC_PV_GUAR, 20_000 / 1.07 ** 5, "guarantee");
    near(Lsr.TRAC_PV_UN, 10_000 / 1.07 ** 5, "unguaranteed");
    assert.equal(Lsr.TRAC_PV_PAY + Lsr.TRAC_PV_GUAR + Lsr.TRAC_PV_UN, Lsr.TRAC_NI);
    assert.equal(T.payment * T.years + Lsr.TRAC_RESIDUAL, 330_000);
  });
  it("both routes give the same gain, and the implied fair value brings back the rate", () => {
    assert.equal(Lsr.TRAC_FV, Lsr.TRAC_NI - 4_000);
    assert.equal(Lsr.TRAC_GAIN, Lsr.TRAC_FV - 230_000);
    near(Lsr.TRAC_GAIN, 33_401, "gain");
    near(npv([...yearly(1, 5, 60_000), [5, 30_000]], 0.07), Lsr.TRAC_FV + 4_000, "fair value + costs");
    assert.ok(Lsr.TRAC_SHARE > 0.9 && Lsr.TRAC_SHARE < 1, "finance by 63(d)");
    near(Lsr.TRAC_NO_UN, npv([...yearly(1, 5, 60_000), [5, 20_000]], 0.07), "without the unguaranteed part");
    near(Lsr.TRAC_NI - Lsr.TRAC_NO_UN, Lsr.TRAC_PV_UN, "difference", 1);
    balanced([{ dr: Lsr.TRAC_NI }, { cr: T.bookValue }, { cr: T.costs }, { cr: Lsr.TRAC_GAIN }]);
  });
  it("the five years add up and end on the residual", () => {
    for (const y of Lsr.TRAC_ROWS) assert.equal(y.opening + y.income - y.receipt, y.closing);
    assert.equal(Lsr.TRAC_ROWS.at(-1)!.closing, 30_000);
    near(Lsr.TRAC_ROWS[0].income, Lsr.TRAC_NI * 0.07, "year 1 income");
    near(Lsr.TRAC_ROWS[1].opening, npv([...yearly(1, 4, 60_000), [4, 30_000]], 0.07), "end of year 1", 2);
    const income = Lsr.TRAC_ROWS.reduce((s, y) => s + y.income, 0);
    assert.equal(income, 5 * 60_000 + 30_000 - Lsr.TRAC_NI);
  });
});

describe("lesson 6, ls-lsr-service: a lessor with a service", () => {
  const W = Lsr.WASH;
  it("the allocation by stand-alone prices", () => {
    assert.equal(Lsr.WASH_LEASE, 80_000);
    assert.equal(Lsr.WASH_SERVICE, 20_000);
    assert.equal(Lsr.WASH_LEASE + Lsr.WASH_SERVICE, W.total);
    assert.equal(Lsr.WASH_PRICES, 112_500);
  });
  it("the net investment holds the lease share only", () => {
    near(Lsr.WASH_NI, npv(yearly(1, 4, 80_000), 0.06), "net investment");
    assert.equal(Lsr.WASH_GAIN, Lsr.WASH_NI - 250_000);
    near(Lsr.WASH_WRONG_NI, npv(yearly(1, 4, 100_000), 0.06), "wrong net investment");
    assert.equal(Lsr.WASH_WRONG_GAIN - Lsr.WASH_GAIN, Lsr.WASH_WRONG_NI - Lsr.WASH_NI);
    for (const y of Lsr.WASH_ROWS) assert.equal(y.opening + y.income - y.receipt, y.closing);
    assert.equal(Lsr.WASH_ROWS.at(-1)!.closing, 0);
    near(Lsr.WASH_ROWS[0].income, Lsr.WASH_NI * 0.06, "year 1 income");
  });
  it("the entries balance and the operating version adds up", () => {
    balanced([{ dr: Lsr.WASH_NI }, { cr: W.bookValue }, { cr: Lsr.WASH_GAIN }]);
    balanced([{ dr: W.total }, { cr: Lsr.WASH_SERVICE }, { cr: Lsr.WASH_ROWS[0].income }, { cr: Lsr.WASH_LEASE - Lsr.WASH_ROWS[0].income }]);
    assert.equal(Lsr.WASH_OP_DEP, 25_000);
    assert.equal(Lsr.WASH_OP_PL, 25_000 - 100_000);
  });
});

describe("lesson 7, ls-lmd-expect: the lessor's view changes, nothing agreed", () => {
  const B = Lmd.BOAT;
  it("the net investment on the nine-year plan", () => {
    near(Lmd.BOAT_NI, npv([...yearly(1, 9, 90_000), [9, 40_000]], 0.08), "at inception");
    near(Lmd.BOAT_BEFORE, npv([...yearly(1, 7, 90_000), [7, 40_000]], 0.08), "end of year 2", 2);
    for (const y of Lmd.BOAT_ROWS) assert.equal(y.opening + y.income - y.receipt, y.closing);
    assert.equal(Lmd.BOAT_ROWS.at(-1)!.closing, 40_000);
    assert.equal(Lmd.BOAT_INT3, Math.round(Lmd.BOAT_BEFORE * 0.08));
    assert.equal(Lmd.BOAT_CLOSE3, Lmd.BOAT_BEFORE + Lmd.BOAT_INT3 - B.payment);
  });
  it("the other way, shown only in the folded box", () => {
    near(Lmd.BOAT_ALT_NI, npv([...yearly(1, 4, 90_000), [4, 250_000]], 0.08), "four payments and the boat back");
    assert.equal(Lmd.BOAT_ALT_LOSS, Lmd.BOAT_BEFORE - Lmd.BOAT_ALT_NI);
    assert.ok(Lmd.BOAT_ALT_LOSS > 0);
    assert.equal(Lmd.BOAT_ALT_CLOSE3, Lmd.BOAT_BEFORE - Lmd.BOAT_ALT_LOSS + Lmd.BOAT_ALT_INT3 - B.payment);
  });
});

describe("lesson 7, ls-lmd-cash: a lump sum on the day of the change", () => {
  it("operating: the lump sum spread over the new lease", () => {
    assert.equal(Lmd.HALL_TOTAL, 60_000 + 2 * 120_000);
    assert.equal(Lmd.HALL_INCOME, 150_000);
    assert.equal(Lmd.HALL_CASH1, 180_000);
    let bal = 60_000;
    for (const y of Lmd.HALL_ROWS) {
      assert.equal(y.opening, bal);
      bal = bal - (y.income - y.cash);
      assert.equal(y.closing, bal);
    }
    assert.equal(bal, 0);
    assert.equal(Lmd.HALL_ROWS.reduce((s, y) => s + y.income, 0), Lmd.HALL_WRONG.reduce((a, b) => a + b, 0));
    balanced([{ dr: 60_000 }, { cr: 60_000 }]);
    balanced([{ dr: Lmd.HALL.rent }, { dr: Lmd.HALL_FALL }, { cr: Lmd.HALL_INCOME }]);
  });
  it("finance that would have been operating: the machine back at the net investment, the lump sum deferred", () => {
    const M = Lmd.MILL;
    assert.equal(Lmd.MILL_INCOME, (30_000 + 2 * 55_000) / 2);
    assert.equal(Lmd.MILL_DEP, 60_000);
    assert.deepEqual(Lmd.MILL_ROWS.map((y) => [y.closing, y.asset]), [[15_000, 360_000], [0, 300_000]]);
    balanced([{ dr: M.ni }, { dr: M.comp }, { cr: M.ni }, { cr: M.comp }]);
  });
});

describe("the new practice questions", () => {
  const n6 = (id: string) => (Lsr.LESSOR.exercises.find((x) => x.id === id) as { answer: number }).answer;
  const n7 = (id: string) => (Lmd.LESSOR_CHANGES.exercises.find((x) => x.id === id) as { answer: number }).answer;
  it("lesson 6", () => {
    near(n6("rate-ni"), npv([...yearly(1, 4, 40_000), [4, 12_000]], 0.08), "rate-ni");
    near(n6("rate-gain"), npv([...yearly(1, 3, 50_000), [3, 15_000]], 0.06) - 3_000 - 120_000, "rate-gain");
    assert.equal(n6("svc-alloc"), (60_000 * 54_000) / 72_000);
    near(n6("svc-ni"), npv(yearly(1, 3, 40_000), 0.05), "svc-ni");
  });
  it("lesson 7", () => {
    assert.equal(n7("expect-income"), (400_000 * 7) / 100);
    assert.equal(n7("cash-op-income"), (45_000 + 3 * 80_000) / 3);
    assert.equal(n7("cash-op-bal"), 45_000 - ((45_000 + 3 * 80_000) / 3 - 80_000));
  });
  it("journal questions still balance", () => {
    for (const m of [Lsr.LESSOR, Lmd.LESSOR_CHANGES]) for (const x of m.exercises) if (x.kind === "journal") assert.ok(isBalanced(x.entry), x.id);
  });
});
