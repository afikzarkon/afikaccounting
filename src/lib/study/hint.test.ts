import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hintOf, revealsAnswer } from "./hint";
import { STUDY_MODULES } from "./index";
import type { QuestionExercise } from "./types";

const number = (answer: number, steps: string[]): QuestionExercise => ({ id: "t", skill: "s", prompt: "p", kind: "number", answer, steps });

/** Every question that can show a hint after a wrong try, in every lesson. */
const QUESTIONS = Object.values(STUDY_MODULES).flatMap((m) =>
  m.exercises.filter((e): e is QuestionExercise => e.kind !== "journal").map((q) => ({ lesson: m.slug, q })),
);

/** The answer as a solution writes it: "94,401", "94,401.5", or the option's own words. */
const writtenAnswers = (q: QuestionExercise): string[] => {
  if (q.kind === "number") {
    const a = Math.abs(q.answer);
    return a < 10 ? [] : [a.toLocaleString("en-US", { maximumFractionDigits: 2 }), Math.round(a).toLocaleString("en-US")];
  }
  if (q.kind === "choice") return q.options[q.answer].trim().length >= 3 ? [q.options[q.answer].trim()] : [];
  return [];
};

describe("the hint after a wrong try", () => {
  it("drops the line that ends with the result, and keeps the formula", () => {
    const q = number(94_401, ["תשלום × (1 − (1 + i)^(−n)) ÷ i = התחייבות\n18,000 × (1 − 1.045^(−6)) ÷ 0.045 = 94,401", "באקסל: =PV(4.5%;6;-18000) → 94,401"]);
    assert.equal(hintOf(q), "תשלום × (1 − (1 + i)^(−n)) ÷ i = התחייבות");
  });

  it("drops a heading whose line was dropped", () => {
    const q = number(4_000, ["בנוסחה:\nיתרה × RATE × YEAR = ריבית\n200,000 × 8% × (3/12) = 4,000 ₪\nבאקסל:\n=200000*8%*3/12 → 4,000 ₪", "שלב 2"]);
    assert.equal(hintOf(q), "בנוסחה:\nיתרה × RATE × YEAR = ריבית");
  });

  it("gives no hint when the whole first step is the answer", () => {
    assert.equal(hintOf(number(1_200, ["12 × 100 = 1,200", "כך נרשם"])), undefined);
  });

  it("gives no hint when the solution has a single step", () => {
    assert.equal(hintOf(number(5, ["הסבר"])), undefined);
  });

  it("reads an answer at the precision it is checked, and not a smaller number inside it", () => {
    const q = number(81_234.4, []);
    assert.ok(revealsAnswer("= 81,234", q));
    assert.ok(!revealsAnswer("ריבית 0.045 על 6 שנים", q));
    assert.ok(!revealsAnswer("81,240", q));
    assert.ok(!revealsAnswer("ריבית של 0.5%", number(0, [])));
  });

  it("names a debit and credit pair as the answer only when both are named", () => {
    const q: QuestionExercise = { id: "t", skill: "s", prompt: "p", kind: "entry", dr: "מזומן", cr: "הכנסות", accounts: [], steps: [] };
    assert.ok(revealsAnswer("ח׳ מזומן / ז׳ הכנסות", q));
    assert.ok(!revealsAnswer("מי מקבל? המזומן נכנס לקופה", q));
  });

  it("covers the lessons' questions", () => assert.ok(QUESTIONS.length > 200, `only ${QUESTIONS.length} questions found`));

  it("never shows the answer in any lesson", () => {
    const leaks = QUESTIONS.flatMap(({ lesson, q }) => {
      const hint = hintOf(q);
      if (!hint) return [];
      // A whole number only: 3,200 is not shown by 13,200.
      const shown = writtenAnswers(q).filter((a) =>
        q.kind === "number" ? new RegExp(`(?<![\\d,.])${a.replace(/[.,]/g, "\\$&")}(?![\\d]|[,.]\\d)`).test(hint) : hint.includes(a),
      );
      return shown.length || revealsAnswer(hint, q) ? [`${lesson} / ${q.id}: ${hint}`] : [];
    });
    assert.deepEqual(leaks, []);
  });

  it("is always taken from the solution's first step, never written anew", () => {
    for (const { q } of QUESTIONS) {
      const hint = hintOf(q);
      if (hint) for (const line of hint.split("\n")) assert.ok(q.steps[0].includes(line), `${q.id}: ${line}`);
    }
  });
});
