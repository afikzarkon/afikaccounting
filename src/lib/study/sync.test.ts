import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_TOPIC, type TopicProgress } from "./score";
import { isEmptyTopic, isLessonSlug, mergeTopic, sanitizeTopic, topicKey } from "./sync";

const topic = (p: Partial<TopicProgress>): TopicProgress => ({ ...EMPTY_TOPIC, ...p });

describe("lesson progress from the account", () => {
  it("keeps only well-formed fields, and drops the questions being retried", () => {
    const p = sanitizeTopic({
      step: 1,
      sub: 3,
      seen: [0, 2, 2, -1, "x", 1.5],
      exercises: { a: { tries: 1, ok: true, done: true }, b: { tries: 1, ok: "yes", done: true }, "bad id!": { tries: 1, ok: true, done: true } },
      traps: { t: { choice: 2, correct: false }, u: { choice: 42, correct: true } },
      streak: 3,
      best: -5,
      retry: ["a"],
      extra: { anything: true },
    });
    assert.deepEqual(p, { step: 1, sub: 3, seen: [0, 2], exercises: { a: { tries: 1, ok: true, done: true } }, traps: { t: { choice: 2, correct: false } }, streak: 3, best: 0 });
  });

  it("turns anything unreadable into an empty lesson", () => {
    for (const raw of [null, "x", 7, [], { step: "far" }]) assert.ok(isEmptyTopic(sanitizeTopic(raw)), JSON.stringify(raw));
  });

  it("accepts the site's lesson slugs only", () => {
    assert.ok(isLessonSlug("basics-double-entry"));
    for (const s of ["", "Basics", "a/b", "x".repeat(81), 3]) assert.ok(!isLessonSlug(s), String(s));
  });
});

describe("joining two devices' progress", () => {
  it("keeps every concept read on either device", () => {
    assert.deepEqual(mergeTopic(topic({ seen: [0, 3] }), topic({ seen: [1, 3] })).seen, [0, 1, 3]);
  });

  it("keeps the best answer to each question", () => {
    const done = (ok: boolean, tries: number) => ({ ok, tries, done: true });
    const merged = mergeTopic(
      topic({ exercises: { right: done(true, 2), wrong: done(false, 2), half: { ok: false, tries: 1, done: false }, mine: done(true, 1) } }),
      topic({ exercises: { right: done(true, 1), wrong: done(true, 2), half: done(false, 2), theirs: done(false, 2) } }),
    ).exercises;
    assert.deepEqual(merged, { right: done(true, 1), wrong: done(true, 2), half: done(false, 2), mine: done(true, 1), theirs: done(false, 2) });
  });

  it("counts a trap's first answer: the account's, where both answered", () => {
    const merged = mergeTopic(topic({ traps: { t: { choice: 1, correct: false } } }), topic({ traps: { t: { choice: 0, correct: true }, u: { choice: 2, correct: true } } }));
    assert.deepEqual(merged.traps, { t: { choice: 1, correct: false }, u: { choice: 2, correct: true } });
  });

  it("resumes where the reader got further, with that device's streak, and the best run of either", () => {
    const merged = mergeTopic(topic({ step: 0, sub: 5, streak: 4, best: 9 }), topic({ step: 1, sub: 2, streak: 1, best: 3 }));
    assert.deepEqual([merged.step, merged.sub, merged.streak, merged.best], [1, 2, 1, 9]);
  });

  it("loses nothing when one side is empty, and changes nothing when both agree", () => {
    const p = topic({ step: 1, sub: 1, seen: [0, 1], exercises: { a: { ok: true, tries: 1, done: true } }, streak: 1, best: 1 });
    assert.equal(topicKey(mergeTopic(p, EMPTY_TOPIC)), topicKey(p));
    assert.equal(topicKey(mergeTopic(EMPTY_TOPIC, p)), topicKey(p));
    assert.equal(topicKey(mergeTopic(p, p)), topicKey(p));
  });
});
