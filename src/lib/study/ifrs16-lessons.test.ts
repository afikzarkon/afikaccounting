import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { STUDY_MODULES } from ".";
import { isBalanced } from "../learn/basics";
import { IFRS16_LESSONS } from "./ifrs16";
import { drill, DRILL_FAMILIES, type DrillFamily } from "./ifrs16/drills";
import { IFRS16_GLOSSARY } from "./ifrs16/glossary";
import { GUAR_WITH, GUAR_WITHOUT, IMPLICIT_LIABILITY, IMPLICIT_LIABILITY_DEALER, MASTER_CASH, MASTER_COST_SHOWN, MASTER_L, MASTER_NET, MASTER_RESTORE, MEASURE, MEASURE_TAUGHT, PV_EX_END, PV_EX_GROSS, PV_EX_NET, WORK1_L, WORK2_L } from "./ifrs16/lessons/measure";
import { TERM_TAUGHT } from "./ifrs16/lessons/term";
import { CASES, CONTRACT_TEST, CONTRACT_TEST_START, type TestEnd, type TestNode, WHAT_TAUGHT } from "./ifrs16/lessons/what";
import { LESSON_N, type LeaseQuestion } from "./ifrs16/shared";

/** What teaches each question, lesson by lesson. */
const TAUGHT: Record<string, Record<string, string>> = { "ifrs16-what": WHAT_TAUGHT, "ifrs16-term": TERM_TAUGHT, "ifrs16-measure": MEASURE_TAUGHT };

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
        const q = x as LeaseQuestion;
        assert.ok(q.meta, `${m.slug}/${q.id}: no meta`);
        assert.ok([1, 2, 3].includes(q.meta.level), q.id);
        assert.ok(["הרצאה", "בהשראת הרצאה", "מקורית"].includes(q.meta.source), q.id);
        assert.ok(q.meta.ref.trim(), q.id);
        if (x.kind === "journal") assert.ok(x.entry.why?.includes("מלכודת נפוצה:"), x.id);
        else assert.ok(q.steps.at(-1)!.startsWith("מלכודת נפוצה:"), q.id);
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

  it("nothing is asked before it is taught: every question names a screen of its lesson or an earlier one", () => {
    IFRS16_LESSONS.forEach((m, i) => {
      const taught = TAUGHT[m.slug];
      assert.ok(taught, `${m.slug}: no map of what is taught`);
      const screens = new Set(IFRS16_LESSONS.slice(0, i + 1).flatMap((l) => l.screens.map((s) => s.id)));
      const ids = [...m.exercises.map((x) => x.id), ...m.traps.map((t) => t.id)];
      for (const id of ids) {
        assert.ok(taught[id], `${m.slug}/${id}: no screen teaches it`);
        assert.ok(screens.has(taught[id]), `${m.slug}/${id}: ${taught[id]} comes later or doesn't exist`);
      }
      assert.deepEqual(Object.keys(taught).sort(), [...ids].sort(), `${m.slug}: stale entries`);
    });
  });

  it("the glossary: no term twice, none empty", () => {
    assert.equal(new Set(IFRS16_GLOSSARY.map(([t]) => t)).size, IFRS16_GLOSSARY.length);
    for (const [t, d] of IFRS16_GLOSSARY) assert.ok(t.trim() && d.trim(), t);
  });
});

describe("lesson 3: figures, against a separate calculation over dated cash flows", () => {
  const answer = (id: string) => (MEASURE.exercises.find((x) => x.id === id) as { answer: number }).answer;
  it("the practice", () => {
    const expected: Record<string, number> = { "pv-end": 92_842, "start-net": 83_163, "index-today": 51_954, guarantee: 56_297, "option-price": 59_648, penalty: 61_816, minimum: 87_629, "rou-sum": 112_000, "rou-start": 128_055, "restore-rou": 135_329, implicit: 88_541 };
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
  });
  it("the screens", () => {
    const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≠ ${b}`);
    near(PV_EX_END, 101_616.34);
    near(PV_EX_GROSS, 108_729.48);
    near(PV_EX_NET, 78_729.48);
    near(GUAR_WITH, 115_499.52);
    near(GUAR_WITHOUT, 109_521.46);
    near(IMPLICIT_LIABILITY, 129_165.78);
    near(IMPLICIT_LIABILITY_DEALER, 126_157.67);
    near(WORK1_L.liability, 280_684.62);
    near(WORK1_L.cost, 292_684.62);
    near(WORK2_L.liability, 244_577.89);
    near(WORK2_L.cost, 243_577.89);
    near(MASTER_L.liability, 479_652.9);
    near(MASTER_NET, 389_652.9);
    near(MASTER_RESTORE, 31_612.58);
    near(MASTER_L.cost, 528_265.48);
    assert.equal(MASTER_CASH, 107_000);
    assert.ok(Math.abs(MASTER_COST_SHOWN - MASTER_L.cost) <= 1);
  });
  it("the journal entry balances", () => {
    const j = MEASURE.exercises.find((x) => x.id === "first-entry");
    assert.ok(j && j.kind === "journal");
    assert.ok(isBalanced(j.entry));
  });
});

describe("lesson 3: the drills, re-computed from each drill's inputs", () => {
  const npv = (flows: [number, number][], r: number) => flows.reduce((s, [t, a]) => s + a / (1 + r) ** t, 0);
  it("every family, four hundred seeds: an answer that follows from the inputs, and no broken text", () => {
    for (const family of Object.keys(DRILL_FAMILIES) as DrillFamily[])
      for (let seed = 1; seed <= 400; seed++) {
        const d = drill(family, seed);
        const { payment: p, years: n, i } = d.inputs;
        const flows = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k): [number, number] => [from + k, p]);
        let want: number;
        if (family === "end") want = npv(flows(1, n), i);
        else if (family === "start") want = npv(flows(1, n - 1), i);
        else if (family === "guarantee") want = npv([...flows(1, n), [n, d.inputs.shortfall]], i);
        else want = Math.round(npv(flows(1, n), i)) + d.inputs.prepaid - d.inputs.incentives + d.inputs.directCosts + d.inputs.restoration;
        assert.ok(Math.abs(d.answer - want) <= 0.51, `${family}/${seed}: ${d.answer} ≠ ${want}`);
        assert.ok(d.answer > 0, `${family}/${seed}`);
        const text = [d.prompt, d.trap, ...d.steps.flatMap((s) => [s.title, s.formula ?? "", s.numbers ?? "", s.note ?? ""])].join(" ");
        assert.ok(!/NaN|undefined|Infinity/.test(text), `${family}/${seed}: ${text}`);
      }
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
