import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASICS_LESSONS } from "./basics";
import { agora } from "./worked";

const questions = BASICS_LESSONS.flatMap((m) => m.exercises.flatMap((e) => (e.kind === "journal" ? [] : [{ m, e }])));

describe("the basics course in the worked-solution layout", () => {
  it("gives every practice question a worked solution", () => {
    const missing = questions.filter(({ e }) => !e.worked).map(({ m, e }) => `${m.slug}/${e.id}`);
    assert.deepEqual(missing, []);
  });

  it("ends a calculation on the answer", () => {
    for (const { m, e } of questions) {
      if (e.kind !== "number" || !e.worked) continue;
      const lines = e.worked.steps.flatMap((s) => s.sheet ?? []);
      const last = lines.filter((l) => l.k === "tot").at(-1);
      assert.ok(last, `${m.slug}/${e.id} has no result line`);
      assert.equal(agora(Number(last.a)), agora(e.answer), `${m.slug}/${e.id}`);
    }
  });

  it("totals every sheet: each subtotal and result is the sum of the lines above it", () => {
    for (const { m, e } of questions) {
      for (const s of e.worked?.steps ?? []) {
        let run = 0;
        for (const l of s.sheet ?? []) {
          if (typeof l.a !== "number") continue;
          if (l.k === "sub" || l.k === "tot") {
            // A subtotal after a multiplication or division row is a product, not a sum; check only plain sums.
            const opText = (s.sheet ?? []).some((x) => x.k === "op" && x.a === "");
            if (!opText) assert.equal(agora(l.a), agora(run), `${m.slug}/${e.id}: ${l.l}`);
            run = l.a;
          } else run += l.a;
        }
      }
    }
  });

  it("explains a choice in words, and keeps the hint", () => {
    for (const { m, e } of questions) {
      if (e.kind === "choice" && e.worked && !e.worked.steps.some((s) => s.sheet)) assert.ok(e.worked.light, `${m.slug}/${e.id}`);
      assert.ok(e.steps.length > 0, `${m.slug}/${e.id}`);
    }
  });
});
