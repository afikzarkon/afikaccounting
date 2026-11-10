import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASICS_LESSONS } from "./basics";
import { agora, lcardCloses, tBalance, type WStep } from "./worked";

/** The amount lettered א in a credit-losses picture: the unknown the question asks for. */
const asked = (s: WStep) => s.credit?.cards.flatMap((c) => [...c.dr, ...c.cr, c.close]).find((r) => r.letter === "א")?.a;

const questions = BASICS_LESSONS.flatMap((m) => m.exercises.flatMap((e) => (e.kind === "journal" ? [] : [{ m, e }])));

describe("the basics course in the worked-solution layout", () => {
  it("gives every practice question a worked solution", () => {
    const missing = questions.filter(({ e }) => !e.worked).map(({ m, e }) => `${m.slug}/${e.id}`);
    assert.deepEqual(missing, []);
  });

  it("ends a calculation on the answer: the last result line, the last card's balancing line, or the missing line of a trial balance", () => {
    for (const { m, e } of questions) {
      if (e.kind !== "number" || !e.worked) continue;
      const last = [...e.worked.steps].reverse().find((s) => asked(s) !== undefined || s.tcard || s.sheet?.some((l) => l.k === "tot") || s.tables?.some((t) => t.rows.some((r) => String(r.c[0]).endsWith("החסר"))));
      assert.ok(last, `${m.slug}/${e.id} has no result`);
      const found = asked(last) !== undefined
        ? asked(last)!
        : last.tcard
        ? tBalance(last.tcard).amount
        : last.sheet?.some((l) => l.k === "tot")
          ? Number(last.sheet.filter((l) => l.k === "tot").at(-1)!.a)
          : Number(last.tables!.flatMap((t) => t.rows).find((r) => String(r.c[0]).endsWith("החסר"))!.c[1]);
      assert.equal(agora(found), agora(e.answer), `${m.slug}/${e.id}`);
    }
  });

  it("shows a trial balance or a T-account question in debit and credit, never as a running sheet (the owner, 2026-11-10)", () => {
    for (const { m, e } of questions) {
      if (!e.worked) continue;
      // A question built on a card or a trial balance board, and the ones solved by closing a card (retained earnings too, by the owner).
      const aboutCards = e.table || ["suppliers-card", "collections", "opening-allowance", "retained-close", "ofek-retained-2026", "exam-retained"].includes(e.id);
      if (!aboutCards) continue;
      for (const s of e.worked.steps) {
        const runsAnAccount = s.sheet?.some((l) => /יתרת פתיחה|יתרת סגירה|תנועה ב|סך החובה|סך הזכות/.test(l.l));
        assert.ok(!runsAnAccount, `${m.slug}/${e.id}: "${s.h}" runs an account as a sheet`);
      }
      assert.ok(e.worked.steps.some((s) => s.tcard || s.credit || s.tables?.some((t) => t.head.includes("חובה"))), `${m.slug}/${e.id} has no card or debit-credit table`);
    }
  });

  it("closes every T-card and every trial balance", () => {
    for (const { m, e } of questions)
      for (const s of e.worked?.steps ?? []) for (const c of s.credit?.cards ?? []) assert.ok(lcardCloses(c), `${m.slug}/${e.id}: ${c.name} does not close`);
    for (const { m, e } of questions)
      for (const s of e.worked?.steps ?? [])
        for (const t of s.tables ?? []) {
          if (!t.head.includes("חובה")) continue;
          const body = t.rows.filter((r) => !r.res);
          const sum = (i: number) => body.reduce((a, r) => a + (typeof r.c[i] === "number" ? (r.c[i] as number) : 0), 0);
          const res = t.rows.find((r) => r.res)!;
          assert.equal(agora(sum(1)), agora(sum(2)), `${m.slug}/${e.id}: unbalanced`);
          assert.deepEqual([agora(Number(res.c[1])), agora(Number(res.c[2]))], [agora(sum(1)), agora(sum(2))], `${m.slug}/${e.id}: totals`);
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

  it("draws the credit-losses cards as the lesson does, and only in the credit-losses lesson (the owner, 2026-11-10)", () => {
    for (const { m, e } of questions) {
      const credit = e.worked?.steps.some((s) => s.credit);
      if (m.slug !== "basics-credit") assert.ok(!credit, `${m.slug}/${e.id}`);
      if (m.slug === "basics-credit" && e.worked?.steps.some((s) => s.tcard)) assert.fail(`${m.slug}/${e.id} uses the general T-card`);
      for (const s of e.worked?.steps ?? []) if (s.credit?.formula) assert.ok(s.credit.cards.some((c) => c.close.to), `${m.slug}/${e.id}: the arrow has nowhere to land`);
    }
  });

  it("explains a choice in words, and keeps the hint", () => {
    for (const { m, e } of questions) {
      if (e.kind === "choice" && e.worked && !e.worked.steps.some((s) => s.sheet || s.tcard || s.tables)) assert.ok(e.worked.light, `${m.slug}/${e.id}`);
      assert.ok(e.steps.length > 0, `${m.slug}/${e.id}`);
    }
  });
});
