import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { STUDY_MODULES } from ".";
import { IFRS16_LESSONS } from "./ifrs16";
import { IFRS16_GLOSSARY } from "./ifrs16/glossary";
import { CASES, CONTRACT_TEST, CONTRACT_TEST_START, type TestEnd, type TestNode } from "./ifrs16/lessons/what";
import { LESSON_N, type LeaseQuestion } from "./ifrs16/shared";

const isEnd = (n: TestNode | TestEnd): n is TestEnd => "verdict" in n;

describe("the leases course", () => {
  it("lessons numbered in order, on the course's page, the first free", () => {
    IFRS16_LESSONS.forEach((m, i) => {
      assert.equal(m.n, i + 1, m.slug);
      assert.equal(m.backHref, "/basics/ifrs16", m.slug);
      assert.equal(STUDY_MODULES[m.slug], m);
    });
    assert.deepEqual(TOPICS.find((t) => t.id === "ifrs16")?.preview, ["ifrs16-what"]);
    assert.deepEqual(IFRS16_LESSONS.map((m) => [m.slug, m.n]), Object.entries(LESSON_N));
  });

  it("no orphan screens: the course's screen files define exactly the screens its lessons list, all ls-", () => {
    const dir = join(process.cwd(), "src/components/basics");
    const defined = readdirSync(dir)
      .filter((f) => /^ifrs16-course.*\.tsx$/.test(f))
      .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(/^ {2}"(ls-[\w-]+)": \{/gm)].map((m) => m[1]));
    const listed = IFRS16_LESSONS.flatMap((m) => m.screens.map((s) => s.id));
    assert.deepEqual([...defined].sort(), [...listed].sort());
    for (const id of listed) assert.ok(id.startsWith("ls-"), id);
  });

  it("every practice question has a source, a level and a paragraph, and its solution ends on a common trap", () => {
    for (const m of IFRS16_LESSONS)
      for (const x of m.exercises) {
        assert.notEqual(x.kind, "journal", `${m.slug}/${x.id}`);
        const q = x as LeaseQuestion;
        assert.ok(q.meta, `${m.slug}/${q.id}: no meta`);
        assert.ok([1, 2, 3].includes(q.meta.level), q.id);
        assert.ok(["הרצאה", "בהשראת הרצאה", "מקורית"].includes(q.meta.source), q.id);
        assert.ok(q.meta.ref.trim(), q.id);
        assert.ok(q.steps.at(-1)!.startsWith("מלכודת נפוצה:"), q.id);
      }
  });

  it("every lesson practises at all three levels, at least eight questions", () => {
    for (const m of IFRS16_LESSONS) {
      assert.ok(m.exercises.length >= 8, m.slug);
      for (const level of [1, 2, 3]) assert.ok(m.exercises.some((x) => (x as LeaseQuestion).meta.level === level), `${m.slug}: no level ${level}`);
    }
  });

  it("multiple choice: the answer is an option, options differ, the right option's trap is empty", () => {
    for (const m of IFRS16_LESSONS) {
      for (const x of m.exercises) if (x.kind === "choice") assert.ok(x.answer >= 0 && x.answer < x.options.length && new Set(x.options).size === x.options.length, x.id);
      for (const t of m.traps) {
        assert.equal(t.traps.length, t.options.length, t.id);
        assert.equal(t.traps[t.answer], "", t.id);
      }
    }
  });

  it("the glossary: no term twice, none empty", () => {
    assert.equal(new Set(IFRS16_GLOSSARY.map(([t]) => t)).size, IFRS16_GLOSSARY.length);
    for (const [t, d] of IFRS16_GLOSSARY) assert.ok(t.trim() && d.trim(), t);
  });
});

describe("lesson 1: the walk down the standard's flowchart", () => {
  /** Every road from the start, as the ends reached. */
  const roads = (at: string, seen: string[] = []): TestEnd[] => {
    assert.ok(!seen.includes(at), `a loop at ${at}`);
    const n = CONTRACT_TEST[at];
    assert.ok(n, `no node ${at}`);
    return isEnd(n) ? [n] : n.answers.flatMap((a) => roads(a.to, [...seen, at]));
  };

  it("every road ends in a verdict, and each answer's road is one the standard draws", () => {
    assert.equal(roads(CONTRACT_TEST_START).length, 7);
    assert.equal(roads(CONTRACT_TEST_START).filter((e) => e.lease).length, 3);
  });
  it("every node can be reached", () => {
    const reached = new Set<string>([CONTRACT_TEST_START]);
    const walk = (at: string) => {
      const n = CONTRACT_TEST[at];
      if (isEnd(n)) return;
      for (const a of n.answers) {
        reached.add(a.to);
        walk(a.to);
      }
    };
    walk(CONTRACT_TEST_START);
    assert.deepEqual([...reached].sort(), Object.keys(CONTRACT_TEST).sort());
  });
  it("seven cases, some of each, each with a reason", () => {
    assert.equal(CASES.length, 7);
    assert.ok(CASES.some((c) => c.answer === "lease") && CASES.some((c) => c.answer === "not"));
    for (const c of CASES) assert.ok(c.why.trim(), c.text);
  });
});
