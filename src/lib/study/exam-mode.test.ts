import assert from "node:assert/strict";
import { test } from "node:test";
import { isBalanced } from "@/lib/learn/basics";
import { buildExam, errorItem, isRight, rng } from "./exam-mode";
import { STUDY_MODULES } from "./index";
import type { JournalExercise } from "./types";

const journals = Object.values(STUDY_MODULES).flatMap((m) => m.exercises.filter((e): e is JournalExercise => e.kind === "journal").map((ex) => ({ m, ex })));

test("every 'find the error' has exactly one wrong line, still balances, and the wrong account is one the lesson marks as wrong", () => {
  assert.ok(journals.length > 0);
  for (const [i, { m, ex }] of journals.entries()) {
    const it = errorItem(ex, m, rng(i + 1));
    if (!it) continue;
    const diff = it.lines.map((l, j) => l.account !== ex.entry.lines[j].account);
    assert.equal(diff.filter(Boolean).length, 1, ex.id);
    assert.equal(diff.indexOf(true), it.wrong, ex.id);
    assert.equal(it.right, ex.entry.lines[it.wrong].account);
    assert.ok(ex.accounts.includes(it.lines[it.wrong].account), ex.id);
    assert.ok(!ex.entry.lines.some((l) => l.account === it.lines[it.wrong].account), `${ex.id}: the swapped-in account isn't one of the entry's own`);
    assert.ok(isBalanced({ id: "x", text: "", lines: it.lines }), ex.id);
  }
});

test("an exam has the asked size, mixes both kinds, has no repeats, and the same seed gives the same exam", () => {
  const ias16 = Object.values(STUDY_MODULES).filter((m) => m.backHref === "/basics");
  const a = buildExam(ias16, 42);
  assert.equal(a.length, 10);
  assert.equal(new Set(a.map((x) => x.key)).size, 10);
  assert.ok(a.some((x) => x.kind === "trap") && a.some((x) => x.kind === "error"));
  assert.deepEqual(buildExam(ias16, 42).map((x) => x.key), a.map((x) => x.key));
  for (const it of a) if (it.kind === "trap") assert.deepEqual([...it.order].sort(), it.trap.options.map((_, i) => i));
});

test("isRight reads a trap's own numbering and the error's line", () => {
  const [t] = buildExam(Object.values(STUDY_MODULES).filter((m) => m.traps.length).slice(0, 1), 1, 1);
  assert.ok(t.kind === "trap" ? isRight(t, t.trap.answer) : isRight(t, t.wrong));
  assert.equal(isRight(t, undefined), false);
});
