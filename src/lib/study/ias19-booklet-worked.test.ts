import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BK_AMEND, BK_CASES, BK_DC, BK_GIFT, BK_NOTE, BK_OLT, BK_SHORT, BK_THREE, BK_TIER, BK_TIERED } from "../learn/ias19-booklet-cases";
import { bookletWorked } from "./ias19/booklet-worked";

const BOOKLET = [BK_SHORT, BK_DC, BK_TIER, BK_AMEND, BK_TIERED, BK_GIFT, BK_CASES, BK_THREE, BK_OLT, BK_NOTE];

describe("IAS 19 booklet questions in the worked-solution layout", () => {
  it("keeps every step's title, and every movement table as a worksheet column", () => {
    for (const q of BOOKLET) {
      const w = bookletWorked(q);
      const heads = w.steps.map((s) => s.h);
      for (const s of q.steps) assert.ok(heads.includes(s.title), `${q.id}: ${s.title}`);
      const rolls = q.steps.flatMap((s) => s.rolls ?? []);
      assert.equal(w.steps.filter((s) => s.sheet).length, rolls.length, q.id);
    }
  });

  it("writes the obligation as a credit, plan assets as they are, and the closing under a double rule", () => {
    for (const q of BOOKLET) {
      const rolls = q.steps.flatMap((s) => s.rolls ?? []);
      const sheets = bookletWorked(q).steps.flatMap((s) => (s.sheet ? [s.sheet] : []));
      rolls.forEach((r, k) => {
        const sign = (r.side ?? "credit") === "credit" ? -1 : 1;
        r.rows.forEach((row, i) => {
          const a = sheets[k][i].a as number;
          if (Math.abs(row.value) >= 1) assert.equal(Math.sign(a), sign * Math.sign(row.value), `${q.id}: ${r.title} / ${row.label}`);
          if (!/אלפי/.test(r.unit ?? "")) assert.ok(Number.isInteger(a), `${q.id}: ${row.label} rounded to the shekel`);
        });
        const pn = r.rows.findIndex((row) => row.kind === "pn");
        if (pn >= 0) assert.equal(sheets[k][pn].k, "focal");
        if (r.rows.filter((row) => row.kind === "balance").length > 1) assert.equal(sheets[k].at(-1)!.k, "tot", `${q.id}: ${r.title}`);
      });
    }
  });

  it("keeps every note line, and lays every calculation out left to right", () => {
    for (const q of BOOKLET) {
      const w = bookletWorked(q);
      for (const s of q.steps) {
        const notes = s.notes ?? [];
        if (!notes.length) continue;
        // A step's notes are its last tables, one per note, a row per line.
        const tables = (w.steps.find((x) => x.h === s.title)?.tables ?? []).slice(-notes.length);
        assert.equal(tables.length, notes.length, `${q.id}: ${s.title}`);
        notes.forEach((n, k) => {
          assert.equal(tables[k].rows.length, n.lines.length);
          n.lines.forEach((l, i) => {
            if (l.calc) assert.match(String(tables[k].rows[i].c[1]), /[⁦‎]/, `${q.id}: ${l.label}`);
          });
        });
      }
    }
  });
});
