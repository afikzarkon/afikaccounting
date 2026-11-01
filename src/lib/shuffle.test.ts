import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stableOrder, stableShuffle } from "./shuffle";
import { STUDY_MODULES } from "./study";

const modules = Object.values(STUDY_MODULES);

describe("the stable shuffle", () => {
  it("is a permutation, and the same key gives the same order", () => {
    for (const n of [1, 2, 4, 7]) {
      const o = stableOrder("key", n);
      assert.deepEqual([...o].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
      assert.deepEqual(stableOrder("key", n), o);
    }
  });

  it("puts the right answer in every position, not mostly first", () => {
    const at: number[] = [];
    for (const m of modules) {
      for (const x of m.exercises) if (x.kind === "choice") at.push(stableOrder(`${x.id}:${x.prompt}`, x.options.length).indexOf(x.answer) / (x.options.length - 1));
      for (const t of m.traps) at.push(stableOrder(`${t.id}:${t.prompt}`, t.options.length).indexOf(t.answer) / (t.options.length - 1));
    }
    const first = at.filter((p) => p === 0).length / at.length;
    const last = at.filter((p) => p === 1).length / at.length;
    assert.ok(at.length > 100, `${at.length} questions`);
    assert.ok(first < 0.45, `the right answer first in ${Math.round(first * 100)}%`);
    assert.ok(last > 0.15, `the right answer last in only ${Math.round(last * 100)}%`);
  });

  it("scatters an entry's accounts among the ones offered", () => {
    let together = 0;
    let entries = 0;
    for (const m of modules)
      for (const x of m.exercises) {
        if (x.kind !== "journal") continue;
        const right = new Set(x.entry.lines.map((l) => l.account));
        if (right.size === x.accounts.length) continue;
        entries++;
        const shown = stableShuffle(`${x.id}:${x.entry.text}`, x.accounts);
        // The right accounts all at the front, as the lessons write them.
        if (shown.slice(0, right.size).every((a) => right.has(a))) together++;
      }
    assert.ok(entries > 30, `${entries} entries`);
    assert.ok(together / entries < 0.3, `the right accounts first in ${together} of ${entries}`);
  });
});
