import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromBalance, headcount, solveAbsence } from "./ias19-absence";
import { ABSENCE_EXAMS, ALON, LECTURE_21 } from "./ias19-absence-cases";

const amounts = (r: ReturnType<typeof solveAbsence>) => [r.opening$, r.paid, r.closing$, r.expense];

describe("absences, solved in the guide's six steps", () => {
  it("the lecture's exercise 2.1 gives the lecture's solution, in both assumptions", () => {
    assert.deepEqual(amounts(solveAbsence(LECTURE_21, "A")), [9_750, 274_000, 8_500, 272_750]);
    assert.deepEqual(amounts(solveAbsence(LECTURE_21, "B")), [18_750, 279_000, 8_500, 268_750]);
  });

  it("the carried days a stayer reaches: beyond the new entitlement, never more than the balance", () => {
    assert.equal(fromBalance(2, 5, 5), 0);
    assert.equal(fromBalance(2, 6.5, 5), 1.5);
    assert.equal(fromBalance(2, 9, 4), 2);
  });

  it("the walkthrough: Alon, in both assumptions", () => {
    const a = solveAbsence(ALON, "A");
    const b = solveAbsence(ALON, "B");
    assert.deepEqual([a.openingDays, a.paidDays, a.closingDays], [27, 749, 42]);
    assert.deepEqual(amounts(a), [10_800, 299_600, 16_800, 305_600]);
    assert.deepEqual([b.openingDays, b.paidDays, b.closingDays], [60, 771, 42]);
    assert.deepEqual(amounts(b), [24_000, 308_400, 16_800, 301_200]);
    // A leaver at the year's end used one carried day of three, and is paid for the other two.
    assert.deepEqual([b.actual[1].fromCarried, b.actual[1].payout, b.actual[1].paidPerHead], [1, 2, 9]);
  });

  it("every table adds up to the whole staff", () => {
    for (const c of [LECTURE_21, ALON, ...ABSENCE_EXAMS.map((e) => e.data)]) {
      assert.equal(headcount(c.opening), headcount(c.actual));
      for (const g of c.actual) if (g.next) assert.equal(headcount(g.next), g.staff);
    }
  });

  it("exam 1: the group that would use more than its balance is capped", () => {
    const r = solveAbsence(ABSENCE_EXAMS[0].data, "A");
    assert.equal(r.opening[3].perHead, 2);
    assert.deepEqual(amounts(r), [7_200, 61_800, 7_500, 62_100]);
  });

  it("exam 2: leavers at the year's end, in the opening and paid out", () => {
    const r = solveAbsence(ABSENCE_EXAMS[1].data, "B");
    assert.equal(r.openingDays, 62);
    assert.deepEqual([r.actual[1].payout, r.actual[1].paidPerHead], [2, 8]);
    assert.deepEqual(amounts(r), [27_900, 209_700, 7_200, 189_000]);
  });

  it("exam 3: last year's balance lapses, and only the stayers' new days are in the closing", () => {
    const r = solveAbsence(ABSENCE_EXAMS[2].data, "A");
    assert.deepEqual(r.actual.map((g) => [g.ownLeft, g.oldLeft, g.lapsed]), [
      [0, 0, 2],
      [0, 0, 2],
      [2, 0, 2],
      [0, 0, 1],
    ]);
    assert.deepEqual(amounts(r), [12_000, 103_500, 19_000, 110_500]);
    // The traps: carrying the old balance on (19 × 4), or counting the year-end leavers (22 × 2).
    assert.notEqual(r.closingDays, 19 * 4);
    assert.notEqual(r.closingDays, 22 * 2);
  });

  it("the course carries days for one year only", () => {
    for (const c of [ALON, ...ABSENCE_EXAMS.map((e) => e.data)]) assert.equal(c.years, 1);
  });

  it("exam 4: by groups and not by the average, and the closing by next year's expectation", () => {
    const a = solveAbsence(ABSENCE_EXAMS[3].data, "A");
    const b = solveAbsence(ABSENCE_EXAMS[3].data, "B");
    assert.deepEqual(amounts(a), [10_500, 79_800, 5_250, 74_550]);
    assert.deepEqual(amounts(b), [12_600, 81_200, 5_250, 73_850]);
    // The average would give 60 × MIN(2, 5.25 − 5) = 15 days, not 30.
    assert.equal(60 * fromBalance(2, 5.25, 5), 15);
    assert.equal(a.openingDays, 30);
  });
});
