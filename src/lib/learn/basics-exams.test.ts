import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, trialBalance } from "./basics";
import { EXAM1, EXAM2, EXAM3, EXAM4 } from "./basics-exams";

describe("lesson 9's exams", () => {
  it("exam 1: seventeen balanced entries, a trial balance of 398,000, cash 240,940", () => {
    assert.equal(EXAM1.entries.length, 17);
    for (const e of EXAM1.entries) assert.ok(isBalanced(e), e.id);
    const t = trialBalance(EXAM1.final);
    assert.equal(t.dr, 398_000);
    assert.equal(t.cr, 398_000);
    assert.equal(EXAM1.final["מזומן"], 240_940);
    assert.equal(EXAM1.final["לקוחות"], 0);
    assert.equal(EXAM1.final["זכאים"], -12_000);
  });

  it("exam 2: profit 31,000 then 120,000, retained 151,000, the 2025 trial balance balances", () => {
    assert.equal(EXAM2.profit2024, 31_000);
    assert.equal(EXAM2.profit2025, 120_000);
    assert.equal(EXAM2.closingRetained, 151_000);
    const t = trialBalance(EXAM2.final2025);
    assert.equal(t.dr, t.cr);
    assert.equal(EXAM2.final2025["מזומן"], 351_400);
    for (const a of ["מקדמות לספקים", "מקדמות מלקוחות"]) assert.equal(EXAM2.final2025[a] ?? 0, 0, a);
  });

  it("exam 3: ten balanced entries, the machine sold at an 18,000 loss", () => {
    assert.equal(EXAM3.entries.length, 10);
    for (const e of EXAM3.entries) assert.ok(isBalanced(e), e.id);
    assert.deepEqual(EXAM3.entries[2].lines, [
      { account: "מזומן", dr: 30_000 },
      { account: "מכונות – פחת נצבר", dr: 42_000 },
      { account: "הפסד הון", dr: 18_000 },
      { account: "מכונות", cr: 90_000 },
    ]);
    assert.deepEqual(
      EXAM3.entries.map((e) => e.lines[0].dr),
      [21_600, 6_000, 30_000, 9_600, 21_120, 15_000, 5_000, 28_000, 3_000, 88_000],
    );
  });

  it("exam 4: gross 520,000, collections 2,186,000, closing allowance 45,000, the specific debt 40,000", () => {
    assert.deepEqual(
      [EXAM4.grossOpening, EXAM4.allowOpening, EXAM4.collected, EXAM4.allowClosing, EXAM4.specificDebt, EXAM4.netClosing],
      [520_000, 31_200, 2_186_000, 45_000, 40_000, 575_000],
    );
  });
});
