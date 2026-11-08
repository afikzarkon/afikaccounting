import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { solveAmend, solveGift, solveNote, solveShort, solveThree, solveTiered } from "./ias19-booklet";
import { FINAL_EXAMS } from "./ias19-finals";
import { AMEND_CASE, BOOKLET, GIFT_CASE, NOTE_CASE, SHORT_CASE, THREE_CASE, TIERED_CASE } from "./ias19-booklet-cases";

const near = (got: number, want: number, tol = 1) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

describe("the booklet-level questions", () => {
  it("ten questions, unique ids, each with facts, what is required, amounts to check and a worked solution", () => {
    assert.equal(BOOKLET.length, 10);
    assert.equal(new Set(BOOKLET.map((q) => q.id)).size, 10);
    for (const q of BOOKLET) {
      assert.ok(q.facts.length && q.required.length && q.steps.length, q.id);
      assert.ok(q.checks.length >= 3, q.id);
      for (const c of q.checks) assert.ok(Number.isFinite(c.value) && Math.abs(c.value) > 0, `${q.id}: ${c.label}`);
    }
  });

  it("every movement table balances: opening plus the lines is the closing", () => {
    for (const q of [...BOOKLET, ...FINAL_EXAMS])
      for (const s of q.steps)
        for (const r of s.rolls ?? []) {
          const closing = r.rows[r.rows.length - 1];
          assert.equal(closing.kind, "balance", `${q.id}: ${r.title}`);
          const total = r.rows.slice(0, -1).reduce((t, row) => t + row.value, 0);
          near(total, closing.value, 1);
        }
  });

  it("every computed line is a finite number", () => {
    for (const q of [...BOOKLET, ...FINAL_EXAMS]) for (const s of q.steps) for (const n of s.notes ?? []) for (const l of n.lines) if (l.value !== undefined) assert.ok(Number.isFinite(l.value), `${q.id}: ${l.label}`);
  });

  it("short-term: four benefits in one company", () => {
    const r = solveShort(SHORT_CASE);
    near(r.dayCost[0], 769.98, 0.01);
    near(r.total.opening, 23_604);
    near(r.total.paid, 173_073);
    near(r.total.closing, 22_613);
    near(r.total.expense, 172_081);
    // The manager expected to leave is paid his whole balance; maternity leave adds nothing.
    near(r.leaverPay, 4 * r.dayCost[0], 0.01);
  });

  it("an amendment mid-year with a payment before it", () => {
    const s = solveAmend(AMEND_CASE);
    near(s.opening, 250_092);
    near(s.service, 147_266);
    near(s.pastService, 84_504);
    near(s.interest, 23_203);
    near(s.closing, 559_044);
  });

  it("the gifts plan: the trust account is capped at the obligation", () => {
    const s = solveGift(GIFT_CASE);
    assert.ok(GIFT_CASE.fvEnd > s.liability.closing, "the ceiling binds");
    near(s.assets.closing, s.liability.closing, 0);
    near(s.oci, 93_322);
  });

  it("three agreements: the note's missing lines, and the golden parachute", () => {
    const s = solveThree(THREE_CASE);
    near(s.sales.y1.pn, 84_800);
    near(s.sales.y2.paid, 307_500);
    near(s.ceo.y2.past, 25_892);
    near(s.ceo.y2.closing, 240_911);
  });

  it("tiered grants: a cap reached in nine years, and two ways to the marketing grant", () => {
    const s = solveTiered(TIERED_CASE);
    assert.deepEqual(
      s.prod.map((g) => g.window),
      [9, 8, 6, 4],
    );
    assert.deepEqual(
      s.mkt.map((g) => g.route),
      ["age", "none", "service"],
    );
    near(s.p1.opening, 199_338);
    near(s.p2.past, 106_818);
    near(s.p2.closing, 574_631);
    near(s.k2.closing, 116_962);
  });

  it("the note: its hidden rates come back out, close to the true ones", () => {
    const s = solveNote(NOTE_CASE);
    near(s.rate, NOTE_CASE.rate, 0.0005);
    near(s.addA, NOTE_CASE.addA, 0.002);
    near(s.depositShare, NOTE_CASE.deposit, 0.001);
    near(s.fromAssets, NOTE_CASE.fromAssets, 0.001);
    assert.ok(s.aClosing1 < s.closing1, "a net liability, as in the booklet");
  });
});
