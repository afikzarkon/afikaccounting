import assert from "node:assert/strict";
import { test } from "node:test";
import { TOPICS } from "./catalog";
import { CHECK_SIZE, CHECK_TOPICS, checkFor, featuredCheck, featuredQuestion, scoreCheck } from "./check";
import { STUDY_MODULES } from "./study";

// Course contents are still changing, so these test the rules, not particular lessons or traps.

test("every check has five traps, one per lesson, all from its own course", () => {
  assert.ok(CHECK_TOPICS.length > 0, "at least one course has a check");
  for (const id of CHECK_TOPICS) {
    const c = checkFor(id)!;
    const topic = TOPICS.find((t) => t.id === id)!;
    assert.equal(c.items.length, CHECK_SIZE, id);
    assert.equal(new Set(c.items.map((i) => i.slug)).size, CHECK_SIZE, `${id}: one trap per lesson`);
    for (const it of c.items) {
      const m = STUDY_MODULES[it.slug];
      assert.equal(m.backHref, topic.href, `${id}: ${it.slug} belongs to the course`);
      assert.ok(m.traps.some((t) => t.id === it.trap.id), `${id}: ${it.trap.id} is a trap of ${it.slug}`);
      assert.equal(it.free, topic.tier === "free" || topic.preview.includes(it.slug));
    }
  }
});

test("a check leads to a lesson open to everyone, when the course has one", () => {
  for (const id of CHECK_TOPICS) {
    const topic = TOPICS.find((t) => t.id === id)!;
    const { first } = checkFor(id)!;
    if (topic.tier === "free" || topic.preview.some((p) => p in STUDY_MODULES)) assert.ok(topic.tier === "free" || topic.preview.includes(first.slug), id);
  }
  assert.equal(checkFor("no-such-course"), undefined);
});

test("scoreCheck counts right answers and lists the misses in order", () => {
  const { items } = checkFor(CHECK_TOPICS[0])!;
  const answers = Object.fromEntries(items.map((it, i) => [it.trap.id, i < 3 ? it.trap.answer : (it.trap.answer + 1) % it.trap.options.length]));
  const s = scoreCheck(items, answers);
  assert.equal(s.right, 3);
  assert.deepEqual(
    s.missed.map((m) => m.trap.id),
    items.slice(3).map((it) => it.trap.id),
  );
});

test("the home page's question is a real trap from a lesson open to everyone, and its check exists", () => {
  const q = featuredQuestion()!;
  assert.ok(q, "there is a question to feature");
  const m = Object.values(STUDY_MODULES).find((x) => `/study/${x.slug}` === q.href)!;
  assert.ok(m.traps.some((t) => t.id === q.trap.id));
  const topic = TOPICS.find((t) => t.href === m.backHref)!;
  assert.ok(topic.tier === "free" || topic.preview.includes(m.slug));
  // A course that no longer exists, or has no free lesson with a trap, is passed over.
  assert.ok(featuredQuestion(["no-such-course"]));
  const c = featuredCheck()!;
  assert.ok(CHECK_TOPICS.includes(c.href.replace("/check/", "")));
});
