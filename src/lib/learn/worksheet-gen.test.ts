import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { balancesOf, isBalanced, ledger, normalSide, statements, typeOf } from "./basics";
import { worksheetResult, worksheetRows } from "./worksheet";
import { worksheet, type WorksheetLevel } from "./worksheet-gen";

const SEEDS = 300;
const COUNT: Record<WorksheetLevel, [number, number]> = { 1: [5, 5], 2: [8, 8], 3: [10, 10], 4: [13, 13], 5: [16, 16] };

describe("worksheets without end", () => {
  for (const level of [1, 2, 3, 4, 5] as const)
    it(`level ${level}: ${SEEDS} worksheets, each balanced from the first column to the last`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const c = worksheet(level, seed);
        const tag = `L${level} #${seed}`;
        // The preliminary trial balance balances, and cash is positive.
        const sum = Object.values(c.preliminary).reduce((s, v) => s + v, 0);
        assert.ok(Math.abs(sum) < 0.01, `${tag}: preliminary off by ${sum}`);
        assert.ok(c.preliminary["מזומן"] >= 80_000, `${tag}: cash ${c.preliminary["מזומן"]}`);
        for (const [a, v] of Object.entries(c.preliminary)) {
          typeOf(a);
          assert.ok(Number.isFinite(v) && Math.abs(v) >= 1, `${tag}: ${a} = ${v}`);
          // Every preliminary balance sits on its normal side (retained earnings are given in credit here).
          assert.equal(v > 0 ? "dr" : "cr", normalSide(a), `${tag}: ${a} on the wrong side`);
        }
        // How many facts the level promises.
        const [lo, hi] = COUNT[level];
        assert.ok(c.items.length >= lo && c.items.length <= hi, `${tag}: ${c.items.length} items`);
        for (const it of c.items) {
          assert.ok(isBalanced(it.entry), `${tag}: ${it.title}`);
          for (const l of it.entry.lines) {
            assert.ok(it.accounts.includes(l.account), `${tag}: ${it.title}: ${l.account} not offered`);
            const v = (l.dr ?? l.cr)!;
            assert.ok(v > 0 && Math.abs(v - Math.round(v)) < 1e-9, `${tag}: ${it.title}: ${l.account} ${v}`);
          }
        }
        // The adjustments column and the final trial balance balance.
        const rows = worksheetRows(c);
        const dr = rows.reduce((s, r) => s + r.adjDr, 0);
        const cr = rows.reduce((s, r) => s + r.adjCr, 0);
        assert.ok(Math.abs(dr - cr) < 0.01, `${tag}: adjustments ${dr} vs ${cr}`);
        assert.ok(Math.abs(rows.reduce((s, r) => s + r.after, 0)) < 0.01, `${tag}: final trial balance`);
        // After the adjustments no account sits on the wrong side (an emptied one is zero).
        const final = balancesOf(ledger(c.items.map((i) => i.entry), c.preliminary));
        for (const [a, v] of Object.entries(final)) if (Math.abs(v) > 0.005) assert.equal(v > 0 ? "dr" : "cr", normalSide(a), `${tag}: ${a} ends at ${v}`);
        // Profit is income less expenses, and retained earnings close at opening plus profit.
        const s = statements(final);
        const res = worksheetResult(c);
        assert.ok(Math.abs(res.profit - s.profit) < 0.01, tag);
        assert.ok(Math.abs(res.closingRetained - (res.openingRetained + res.profit)) < 0.01, tag);
        // The unknowns: retained earnings from level 3; worked-out balances at level 5 only.
        assert.equal(c.unknown, level >= 3 ? "עודפים" : undefined, tag);
        assert.equal(c.computed?.length ?? 0, level === 5 ? 2 : 0, tag);
        for (const x of c.computed ?? []) assert.ok(x.account in c.preliminary && x.story && x.why, `${tag}: ${x.account}`);
      }
    });

  it("a seed always gives the same worksheet, and different seeds different ones", () => {
    assert.deepEqual(worksheet(4, 17), worksheet(4, 17));
    const names = new Set(Array.from({ length: 50 }, (_, i) => JSON.stringify(worksheet(3, i + 1).preliminary)));
    assert.equal(names.size, 50);
  });
});
