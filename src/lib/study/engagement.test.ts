import assert from "node:assert/strict";
import { test } from "node:test";
import { readinessOf } from "./readiness";
import { EMPTY_TOPIC, type TopicProgress } from "./score";
import { streakOf, withStudyDay } from "./streak";
import type { StudyModule } from "./types";

const lesson = (slug: string, n: number, ex: number, traps: number) =>
  ({
    slug,
    n,
    title: `שיעור ${n}`,
    exercises: Array.from({ length: ex }, (_, i) => ({ id: `${slug}-e${i}`, kind: "choice" })),
    traps: Array.from({ length: traps }, (_, i) => ({ id: `${slug}-t${i}` })),
  }) as unknown as StudyModule;

const L = [lesson("a", 1, 2, 1), lesson("b", 2, 2, 1)];
const allRight = (m: StudyModule): TopicProgress => ({
  ...EMPTY_TOPIC,
  exercises: Object.fromEntries(m.exercises.map((e) => [e.id, { tries: 1, ok: true, done: true }])),
  traps: Object.fromEntries(m.traps.map((t) => [t.id, { choice: 0, correct: true }])),
});

test("readiness is 0 before anything, and 100 only with every lesson done, right first time, nothing due", () => {
  assert.equal(readinessOf(L, {}, 10).score, 0);
  const full = readinessOf(L, { a: allRight(L[0]), b: allRight(L[1]) }, 10);
  assert.equal(full.score, 100);
  assert.equal(full.next, undefined);
});

test("one perfect lesson of two is half-way at most, and points to the next lesson", () => {
  const r = readinessOf(L, { a: allRight(L[0]) }, 10);
  assert.equal(r.score, 50);
  assert.deepEqual(r.next && r.next.kind === "lesson" && [r.next.slug, r.next.gain], ["b", 50]);
});

test("due reviews lower readiness and come first as the next step", () => {
  const a = { ...allRight(L[0]), review: { "a-e0": { box: 0, due: 9 }, "a-e1": { box: 3, due: 0 } } };
  const r = readinessOf(L, { a, b: allRight(L[1]) }, 10);
  assert.equal(r.due, 1);
  assert.ok(r.score < 100 && r.score >= 85);
  assert.deepEqual(r.next, { kind: "review", count: 1 });
});

test("an empty course is 0, not an error", () => {
  assert.equal(readinessOf([], {}, 1).score, 0);
});

test("streak: consecutive days count, today unstudied doesn't break it", () => {
  assert.deepEqual(streakOf([8, 9, 10], 10), { days: 3, studiedToday: true, restFree: true });
  assert.equal(streakOf([7, 8, 9], 10).days, 3);
  assert.equal(streakOf([], 10).days, 0);
});

test("streak: one rest day a week is free, two in a row or two in a week break it", () => {
  assert.equal(streakOf([5, 6, 8, 9, 10], 10).days, 5);
  assert.equal(streakOf([5, 6, 8, 9, 10], 10).restFree, false);
  assert.equal(streakOf([5, 6, 9, 10], 10).days, 2);
  assert.equal(streakOf([3, 5, 6, 8, 9, 10], 10).days, 5);
  // A rest day more than a week before the last one is free again.
  assert.equal(streakOf([1, 3, 4, 5, 6, 7, 8, 9, 10], 10).days, 9);
  assert.equal(streakOf([1, 3, 4, 5, 6, 7, 8, 9, 10], 10).restFree, true);
});

test("withStudyDay keeps days unique, sorted and bounded", () => {
  assert.deepEqual(withStudyDay([1, 2], 2), [1, 2]);
  assert.deepEqual(withStudyDay([3, 1], 2), [1, 2, 3]);
  assert.equal(withStudyDay(Array.from({ length: 60 }, (_, i) => i), 100).length, 60);
});

import { STUDY_MODULES } from "./index";
import { UNITS, unitsOf } from "./units";

test("units hold every lesson of a course exactly once, and only lessons that exist", () => {
  const courses = new Map<string, StudyModule[]>();
  for (const m of Object.values(STUDY_MODULES)) courses.set(m.backHref, [...(courses.get(m.backHref) ?? []), m]);
  for (const [href, lessons] of courses) {
    const sorted = lessons.sort((a, b) => a.n - b.n);
    const units = unitsOf(sorted);
    if (!UNITS[href]) {
      assert.equal(units.length, 0);
      continue;
    }
    const slugs = units.flatMap((u) => u.lessons.map((m) => m.slug));
    assert.equal(slugs.length, lessons.length, href);
    assert.equal(new Set(slugs).size, lessons.length, href);
    assert.ok(units.every((u) => u.lessons.length > 0), href);
  }
});

test("a lesson no unit names joins 'more lessons'; a slug that's gone is skipped", () => {
  const ls = [lesson("x1", 1, 1, 0), lesson("x2", 2, 1, 0)].map((m) => ({ ...m, backHref: "/basics" }));
  const units = unitsOf(ls);
  assert.deepEqual(units.map((u) => [u.title, u.lessons.map((m) => m.slug)]), [["שיעורים נוספים", ["x1", "x2"]]]);
});
