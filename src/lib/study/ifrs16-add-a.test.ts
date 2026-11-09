import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as Sub from "./ifrs16/lessons/subsequent";
import * as Term from "./ifrs16/lessons/term";
import { WHAT, WHAT_TAUGHT } from "./ifrs16/lessons/what";
import type { LeaseQuestion } from "./ifrs16/shared";

/**
 * Agent A's additions to lessons 1, 2 and 4: every new figure worked again here
 * by plain arithmetic or dated cash flows, without the course's helpers.
 */

const npv = (flows: [number, number][], r: number) => flows.reduce((s, [t, a]) => s + a / (1 + r) ** t, 0);
const yearly = (n: number, p: number): [number, number][] => Array.from({ length: n }, (_, k) => [k + 1, p]);
const shekel = (a: number, b: number, label = "") => assert.ok(Math.abs(a - b) <= 1, `${label}: ${a} ≠ ${b}`);
const answer = (m: { exercises: { id: string }[] }, id: string) => (m.exercises.find((x) => x.id === id) as unknown as { answer: number }).answer;
const question = (m: { exercises: { id: string }[] }, id: string) => m.exercises.find((x) => x.id === id) as unknown as LeaseQuestion;

describe("lesson 1: a substitution right that pays only later", () => {
  it("the question is there, taught on the substitution screen, with a source and a level", () => {
    const q = question(WHAT, "swap-pays-later");
    assert.ok(q && q.kind === "choice");
    assert.equal(WHAT_TAUGHT["swap-pays-later"], "ls-what-swap");
    assert.ok(q.meta.ref.includes("ב14"));
  });
});

describe("lesson 2: fee names, and an extension that needs the lessor's approval", () => {
  it("the bistro: five lines add up, and the payment splits by stand-alone prices", () => {
    assert.equal(Term.FEES_TOTAL, 100_000 + 6_000 + 9_000 + 24_000 + 1_000);
    assert.equal(Term.FEES_TOTAL, 140_000);
    // 140,000 × 120,000 / 150,000 and the rest
    assert.equal(Term.FEES_LEASE, 112_000);
    assert.equal(Term.FEES_SERVICE, 28_000);
    assert.equal(Term.FEES_LEASE + Term.FEES_SERVICE, Term.FEES_TOTAL);
    assert.equal(Term.FEES_WASTE_MONTH * 12, Term.FEES.wasteYear);
    assert.equal(Term.FEES_WASTE_MONTH, 600);
  });
  it("the practice on fees: the shopping-centre space", () => {
    assert.equal(Term.FEE_Q_TOTAL, 84_000);
    assert.equal(answer(Term.TERM, "fee-names"), (84_000 * 72_000) / 96_000);
    assert.equal(answer(Term.TERM, "fee-names"), 63_000);
  });
  it("the greenhouse and the practice on consent: only the lessee's own option counts", () => {
    assert.equal(Term.CONSENT_OWN, 5 + 3);
    assert.equal(Term.CONSENT_NEEDS_OK, 5);
    assert.equal(answer(Term.TERM, "consent-term"), 6);
    assert.equal(answer(Term.TERM, "consent-chain"), 4 + 2);
  });
  it("the corrected trap no longer says the lessor's consent doesn't matter", () => {
    const t = Term.TERM.traps.find((x) => x.id === "intent")!;
    assert.ok(!t.traps.some((s) => s.includes("בלי קשר להסכמת המחכיר")));
  });
  it("new questions are mapped to the new screens, which the lesson lists", () => {
    const ids = Term.TERM.screens.map((s) => s.id);
    for (const [q, screen] of [["fee-names", "ls-term-fees"], ["fee-service", "ls-term-fees"], ["fee-incentive", "ls-term-fees"], ["consent-term", "ls-term-consent"], ["consent-chain", "ls-term-consent"]]) {
      assert.equal(Term.TERM_TAUGHT[q], screen, q);
      assert.ok(ids.includes(screen), screen);
    }
  });
});

describe("lesson 4: the lessee's own improvements", () => {
  const liability = npv(yearly(6, 60_000), 0.05);
  it("the architects' office: liability, cost, depreciation and interest from dated flows", () => {
    shekel(liability, 304_541.53, "liability exact");
    shekel(Sub.IMPROVE_LIABILITY, liability, "liability shown");
    shekel(Sub.IMPROVE_L.cost, liability - 30_000, "cost");
    shekel(Sub.IMPROVE_L.rows[0].depreciation, (liability - 30_000) / 6, "rou depreciation");
    shekel(Sub.IMPROVE_L.rows[0].interest, liability * 0.05, "interest");
    assert.equal(Sub.IMPROVE_L.rows[0].rightOfUse, Sub.IMPROVE_L.cost - Sub.IMPROVE_L.rows[0].depreciation);
  });
  it("the works: 69 months from 1.4, 3,000 a month, nine months in the first year", () => {
    assert.equal(Sub.IMPROVE_MONTHS_LEFT, 72 - 3);
    assert.equal(Sub.IMPROVE_MONTHS, 69);
    assert.equal(Sub.IMPROVE_FIRST_MONTHS, 9);
    assert.equal(207_000 / 69, 3_000);
    assert.equal(Sub.IMPROVE_DEP1, 27_000);
  });
  it("the year's profit or loss adds up, and the wrong way gives a different total", () => {
    assert.equal(Sub.IMPROVE_PL1, Sub.IMPROVE_L.rows[0].depreciation + 27_000 + Sub.IMPROVE_L.rows[0].interest);
    shekel(Sub.IMPROVE_PL1, (liability - 30_000) / 6 + 27_000 + liability * 0.05, "total");
    shekel(Sub.IMPROVE_WRONG_ROU_DEP, liability / 6, "wrong rou");
    shekel(Sub.IMPROVE_WRONG_WORKS_DEP, (177_000 / 69) * 9, "wrong works");
    assert.notEqual(Sub.IMPROVE_WRONG_PL1, Sub.IMPROVE_PL1);
  });
  it("the commencement entry balances", () => {
    const dr = Sub.IMPROVE_L.cost + Sub.IMPROVE.lessorShare;
    const cr = Sub.IMPROVE_LIABILITY;
    assert.equal(dr, cr);
  });
  it("the practice", () => {
    assert.equal(answer(Sub.SUBSEQUENT, "improve-dep"), (126_000 / 42) * 6);
    assert.equal(answer(Sub.SUBSEQUENT, "improve-dep"), 18_000);
    shekel(answer(Sub.SUBSEQUENT, "improve-rou"), npv(yearly(5, 40_000), 0.06) - 25_000, "improve-rou");
    assert.equal(answer(Sub.SUBSEQUENT, "improve-rou"), 143_495);
    for (const id of ["improve-where", "improve-dep", "improve-rou"]) assert.equal(Sub.SUBSEQUENT_TAUGHT[id], "ls-sub-improve", id);
    assert.ok(Sub.SUBSEQUENT.screens.some((s) => s.id === "ls-sub-improve"));
  });
});
