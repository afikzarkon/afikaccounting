import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STUDY_MODULES } from ".";
import { afterAnswer, answerReview, MASTERED, mergeReview, reviewItems, scheduleWeak } from "./review";
import { EMPTY_TOPIC, practiceOf, recordExercise, recordTrap } from "./score";
import { mergeTopic, sanitizeTopic } from "./sync";

const DAY = 20_000;
const m = STUDY_MODULES["ias16-exchange"];
const item = (id: string) => practiceOf(m).find((it) => (it.kind === "exercise" ? it.ex.id : it.trap.id) === id)!;
const ex = (id: string) => {
  const it = item(id);
  assert.ok(it.kind === "exercise");
  return it.ex;
};

describe("spaced review", () => {
  it("puts a weak answer up for tomorrow: wrong, right only on the second try, or a trap fallen into", () => {
    let p = afterAnswer(recordExercise(recordExercise(EMPTY_TOPIC, ex("swap-gain"), false), ex("swap-gain"), false), item("swap-gain"), DAY);
    assert.deepEqual(p.review, { "swap-gain": { box: 0, due: DAY + 1 } });
    p = afterAnswer(recordExercise(recordExercise(p, ex("swap-dep"), false), ex("swap-dep"), true), item("swap-dep"), DAY);
    assert.equal(p.review?.["swap-dep"]?.due, DAY + 1, "right on the second try is weak too");
    p = afterAnswer(recordTrap(p, "forgot-dep", 1, false), item("forgot-dep"), DAY);
    assert.ok(p.review?.["forgot-dep"]);
  });

  it("leaves a right first answer, and an unfinished one, off the review", () => {
    const right = afterAnswer(recordExercise(EMPTY_TOPIC, ex("swap-gain"), true), item("swap-gain"), DAY);
    assert.equal(right.review, undefined);
    const once = afterAnswer(recordExercise(EMPTY_TOPIC, ex("swap-gain"), false), item("swap-gain"), DAY);
    assert.equal(once.review, undefined, "a second try is still to come");
  });

  it("climbs 3 then 7 days on right answers, masters on the third, and starts over on a wrong one", () => {
    let p = scheduleWeak(EMPTY_TOPIC, "q", DAY);
    p = answerReview(p, "q", true, DAY + 1);
    assert.deepEqual(p.review?.q, { box: 1, due: DAY + 4 });
    p = answerReview(p, "q", true, DAY + 4);
    assert.deepEqual(p.review?.q, { box: 2, due: DAY + 11 });
    const slip = answerReview(p, "q", false, DAY + 11);
    assert.deepEqual(slip.review?.q, { box: 0, due: DAY + 12 });
    p = answerReview(p, "q", true, DAY + 11);
    assert.equal(p.review?.q.box, MASTERED);
  });

  it("lists what is on the schedule and not mastered, and older weak answers as due today", () => {
    let p = recordTrap(EMPTY_TOPIC, "forgot-dep", 1, false);
    p = { ...p, review: { "swap-gain": { box: 1, due: DAY + 3 }, "swap-dep": { box: MASTERED, due: 0 } } };
    const items = reviewItems(m, p, DAY);
    assert.deepEqual(
      items.map((x) => [x.id, x.due]),
      [
        ["forgot-dep", DAY],
        ["swap-gain", DAY + 3],
      ],
    );
  });

  it("keeps a question mastered even when the lesson's old answer to it was wrong", () => {
    const p = { ...recordTrap(EMPTY_TOPIC, "forgot-dep", 1, false), review: { "forgot-dep": { box: MASTERED, due: 0 } } };
    assert.deepEqual(reviewItems(m, p, DAY), []);
  });

  it("asks every practice question on its own, since the review shows it out of its lesson's order", () => {
    for (const lesson of Object.values(STUDY_MODULES)) {
      for (const e of lesson.exercises) assert.ok(!/^(ב?אות[הוםן])\s/.test(e.kind === "journal" ? e.entry.text : e.prompt), `${lesson.slug}:${e.id} leans on the question before it`);
      for (const t of lesson.traps) assert.ok(!/^(ב?אות[הוםן])\s/.test(t.prompt), `${lesson.slug}:${t.id} leans on the question before it`);
    }
  });

  it("joins two devices' schedules by the one further up, and keeps them through the account", () => {
    assert.deepEqual(mergeReview({ a: { box: 1, due: 5 }, b: { box: 0, due: 9 } }, { a: { box: 2, due: 3 }, b: { box: 0, due: 7 }, c: { box: 0, due: 1 } }), {
      a: { box: 2, due: 3 },
      b: { box: 0, due: 9 },
      c: { box: 0, due: 1 },
    });
    const p = { ...EMPTY_TOPIC, review: { a: { box: 1, due: 5 } } };
    assert.deepEqual(sanitizeTopic(p).review, p.review);
    assert.deepEqual(sanitizeTopic({ review: { a: { box: 9, due: 5 }, "bad id!": { box: 0, due: 1 }, b: { box: 0, due: -1 } } }).review, undefined);
    assert.deepEqual(mergeTopic(EMPTY_TOPIC, p).review, p.review);
  });
});
