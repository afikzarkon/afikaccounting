import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, trialBalance } from "./basics";
import { AGAM, GILAD, NEVEH } from "./basics-booklet";

describe("booklet-level questions", () => {
  it("Agam: eight adjustments, each balanced, with the amounts worked out by hand", () => {
    for (const e of AGAM.entries) assert.ok(isBalanced(e), e.id);
    assert.deepEqual(
      AGAM.entries.map((e) => e.lines[0].dr),
      [20_800, 5_400, 60_480, 3_600, 48_000, 6_800, 8_100, 21_000],
    );
    assert.equal(AGAM.facts.length, 8);
  });

  it("Gilad: insurance 42,000 and retained 47,000 found; profit 156,000; retained closing 203,000; the corrected trial balance balances", () => {
    assert.deepEqual(GILAD.found, { insurance: 42_000, retained: 47_000 });
    for (const e of GILAD.entries) assert.ok(isBalanced(e), e.id);
    const t = trialBalance(GILAD.final);
    assert.equal(t.dr, t.cr);
    assert.equal(GILAD.profit, 156_000);
    assert.equal(GILAD.closingRetained, 203_000);
    for (const u of GILAD.unknowns) assert.ok(!(u in GILAD.given), u);
    assert.equal(GILAD.final["הוצאות שכירות מראש"], 0);
    assert.equal(GILAD.final["מקדמות מלקוחות"], -18_000);
  });

  it("Neveh: three years, the allowance in debit before two of the adjustments, a rate change and a specific provision", () => {
    assert.deepEqual(
      NEVEH.years.map((y) => [y.customers, y.allowanceBefore, y.required, y.expense, y.net]),
      [
        [330_000, 0, 6_600, 6_600, 323_400],
        [412_500, -900, 8_250, 9_150, 404_250],
        [478_500, -5_750, 50_925, 56_675, 427_575],
      ],
    );
  });
});
