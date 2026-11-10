import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXAM1, EXAM2, EXAM4 } from "@/lib/learn/basics-exams";
import { NEVEH } from "@/lib/learn/basics-booklet";
import { W_AGAM, W_EXAM1, W_EXAM2, W_EXAM3, W_EXAM4, W_NEVEH, WORKSHEET_QUESTIONS } from "./basics/exam-worked";
import { agora, lcardCloses, tBalance, worksheetRows } from "./worked";
import { drill, DRILL_FAMILIES, type DrillFamily, drillWorked } from "./basics/drills";

const num = (s: string) => Number(s.trim().split(" ").at(-1)!.replace(/,/g, ""));

describe("the basics worksheet questions in the worked-solution layout", () => {
  for (const q of WORKSHEET_QUESTIONS) {
    it(`${q.name}: every table, card and sheet closes, and it ends on the exam's own profit and retained earnings`, () => {
      const steps = q.w.steps;
      // The preliminary trial balance is balanced, with retained earnings lettered.
      const tb = steps.find((s) => s.tb)!.tb!;
      assert.equal(agora(tb.rows.reduce((s, r) => s + r.v, 0)), 0);
      assert.ok(tb.rows.find((r) => r.a === "עודפים")?.letter);
      // Each "?" sheet ends on the balance the trial balance shows for it.
      for (const s of steps.filter((x) => x.sheet && x.h.endsWith("מהסיפור"))) {
        const account = s.h.replace(": מהסיפור", "");
        const row = tb.rows.find((r) => r.a === account)!;
        assert.equal(agora(Number(s.sheet!.at(-1)!.a)), agora(Math.abs(row.v)), `${q.name}: ${account}`);
      }
      // The credit picture closes, and the formula's answer is the allowance it closes on.
      for (const s of steps.filter((x) => x.credit)) {
        for (const c of s.credit!.cards) assert.ok(lcardCloses(c), `${q.name}: ${c.name}`);
        if (s.credit!.formula) assert.equal(num(s.credit!.formula[1]), agora(s.credit!.cards[1].close.a), `${q.name}: the allowance`);
      }
      // The worksheet: every group balances but profit or loss, which differs by the profit.
      const ws = steps.find((s) => s.worksheet)!.worksheet!;
      const rows = worksheetRows(ws);
      const sideSum = (pick: (v: number) => number) => agora(rows.reduce((t, r) => t + pick(r.pl ? 0 : r.sheet), 0));
      assert.equal(sideSum((v) => (v > 0 ? v : 0)), sideSum((v) => (v < 0 ? -v : 0)), `${q.name}: the balance-sheet columns`);
      assert.equal(agora(rows.reduce((t, r) => t + r.final, 0)), 0, `${q.name}: the final trial balance`);
      assert.equal(agora(-rows.filter((r) => r.pl).reduce((t, r) => t + r.final, 0)), agora(q.profit), `${q.name}: the profit-or-loss columns`);
      // The profit sheet and the retained card.
      const profit = steps.find((s) => s.sheet?.some((l) => l.l === "רווח השנה"))!;
      assert.equal(agora(Number(profit.sheet!.at(-1)!.a)), agora(q.profit));
      const card = steps.find((s) => s.tcard?.name === "עודפים")!.tcard!;
      if (q.retained !== undefined) assert.equal(agora(tBalance(card).amount), agora(q.retained), `${q.name}: closing retained earnings`);
      assert.equal(agora(ws.retained), agora(tBalance(card).amount));
      // The trap comes last.
      assert.ok(q.w.trap && q.w.trap.length > 10);
    });
  }

  it("exam 1: each T-card closes on the balance the trial balance shows", () => {
    const cards = W_EXAM1.steps.find((x) => x.tcards)!.tcards!;
    for (const c of cards) {
      const b = tBalance(c);
      const v = EXAM1.final[c.name];
      assert.equal(agora(b.side === "cr" ? b.amount : -b.amount), agora(v), c.name);
    }
  });

  it("exam 2: the profits and the retained-earnings card are the exam's own", () => {
    const profits = W_EXAM2.steps.filter((x) => x.sheet).map((x) => Number(x.sheet!.at(-1)!.a));
    assert.deepEqual(profits.map(agora), [agora(EXAM2.profit2024), agora(EXAM2.profit2025)]);
    assert.equal(agora(tBalance(W_EXAM2.steps.find((x) => x.tcard)!.tcard!).amount), agora(EXAM2.closingRetained));
  });

  it("exam 4: the cards close, and each lettered line is the exam's own answer", () => {
    const credit = W_EXAM4.steps.find((x) => x.credit)!.credit!;
    for (const c of credit.cards) assert.ok(lcardCloses(c), c.name);
    const rows = credit.cards.flatMap((c) => [...c.dr, ...c.cr, c.close]);
    assert.equal(rows.find((r) => r.letter === "ב")!.a, EXAM4.collected);
    assert.equal(rows.find((r) => r.letter === "ג")!.a, EXAM4.allowClosing);
    assert.equal(Number(W_EXAM4.steps.find((x) => x.h.startsWith("ד."))!.sheet!.at(-1)!.a), EXAM4.specificDebt);
  });

  it("Neveh: every year's cards close, the formula gives the required allowance, and the lettered expense is the year's", () => {
    const credits = W_NEVEH.steps.filter((x) => x.credit).map((x) => x.credit!);
    assert.equal(credits.length, NEVEH.years.length);
    credits.forEach((c, i) => {
      for (const card of c.cards) assert.ok(lcardCloses(card), `${NEVEH.years[i].year}: ${card.name}`);
      assert.equal(num(c.formula![1]), agora(NEVEH.years[i].required));
      const expense = c.cards[1].dr.concat(c.cards[1].cr).find((r) => r.letter === "א")!;
      assert.equal(expense.a, Math.abs(NEVEH.years[i].expense));
    });
  });

  it("the entries-only questions show every entry, one step each, and end on the trap", () => {
    for (const w of [W_EXAM3, W_AGAM]) {
      assert.ok(w.steps.every((x) => x.entries?.length === 1));
      assert.ok(w.trap);
    }
  });

  it("every drill opens in the worked layout: the tool first, the formula with the numbers, the entry, and the trap", () => {
    for (const family of Object.keys(DRILL_FAMILIES) as DrillFamily[])
      for (let seed = 1; seed <= 20; seed++) {
        const d = drill(family, seed);
        const w = drillWorked(d, "נושא");
        assert.equal(w.steps[0].h, "איזה כלי?");
        assert.ok(w.steps.some((x) => x.xl), `${family}/${seed}: the Excel way`);
        for (const e of w.steps.flatMap((x) => x.entries ?? [])) assert.equal(agora(e.lines.reduce((t, l) => t + (l.dr ?? 0) - (l.cr ?? 0), 0)), 0, `${family}/${seed}`);
        assert.equal(w.trap, d.trap);
      }
  });
});
