import assert from "node:assert/strict";
import { test } from "node:test";
import { CHECK_SIZE, CHECK_TOPICS, checkFor, scoreCheck } from "./check";

test("every course of lessons with enough traps has a check of five, one per lesson", () => {
  assert.ok(CHECK_TOPICS.includes("ias16"));
  for (const id of CHECK_TOPICS) {
    const c = checkFor(id)!;
    assert.equal(c.items.length, CHECK_SIZE, id);
    assert.equal(new Set(c.items.map((i) => i.slug)).size, CHECK_SIZE, `${id}: one trap per lesson`);
    for (const it of c.items) assert.ok(it.trap.answer >= 0 && it.trap.answer < it.trap.options.length);
  }
});

test("a paid course's check leads to its free lesson", () => {
  assert.equal(checkFor("ias16")!.first.slug, "ias16-intro");
  assert.equal(checkFor("nope"), undefined);
});

test("scoreCheck counts right answers and lists the misses", () => {
  const { items } = checkFor("ias16")!;
  const answers = Object.fromEntries(items.map((it, i) => [it.trap.id, i < 3 ? it.trap.answer : (it.trap.answer + 1) % it.trap.options.length]));
  const s = scoreCheck(items, answers);
  assert.equal(s.right, 3);
  assert.deepEqual(s.missed.map((m) => m.trap.id), items.slice(3).map((it) => it.trap.id));
});
