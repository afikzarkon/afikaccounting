import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { STUDY_MODULES } from ".";
import { isBalanced } from "../learn/basics";
import { IFRS16_LESSONS } from "./ifrs16";
import { drill, DRILL_FAMILIES, type DrillFamily, statementDrill } from "./ifrs16/drills";
import { FILL_TASK, KIOSK_ACCRUED, KIOSK_EXPENSE, LAPTOP_FULL, MASTER_EXP_FORKLIFT, MASTER_EXP_LINES, MASTER_EXP_VAN, MASTER_FORKLIFT, MASTER_LINES, MASTER_VAN, SUBSEQUENT, SUBSEQUENT_TAUGHT, TRUCK_END, TRUCK_START, WORK_S, WORK_SECTIONS } from "./ifrs16/lessons/subsequent";
import { IFRS16_GLOSSARY } from "./ifrs16/glossary";
import { GUAR_WITH, GUAR_WITHOUT, IMPLICIT_LIABILITY, IMPLICIT_LIABILITY_DEALER, MASTER_CASH, MASTER_COST_SHOWN, MASTER_L, MASTER_NET, MASTER_RESTORE, MEASURE, MEASURE_TAUGHT, PV_EX_END, PV_EX_GROSS, PV_EX_NET, WORK1_L, WORK2_L } from "./ifrs16/lessons/measure";
import { TERM_TAUGHT } from "./ifrs16/lessons/term";
import { CASES, CONTRACT_TEST, CONTRACT_TEST_START, type TestEnd, type TestNode, WHAT_TAUGHT } from "./ifrs16/lessons/what";
import { LESSON_N, type LeaseQuestion } from "./ifrs16/shared";

/** What teaches each question, lesson by lesson. */
const TAUGHT: Record<string, Record<string, string>> = { "ifrs16-what": WHAT_TAUGHT, "ifrs16-term": TERM_TAUGHT, "ifrs16-measure": MEASURE_TAUGHT, "ifrs16-subsequent": SUBSEQUENT_TAUGHT };

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
        // The balance on 31.12 of year k is what is still to come, valued that day: in advance, the next payment falls tomorrow.
        // (A table is worked by hand, so its balance can be a shekel or two from the exact one, within what the check allows.)
        else if (family === "cycle") want = d.inputs.start ? p + npv(flows(1, n - d.inputs.k - 1), i) : npv(flows(1, n - d.inputs.k), i);
        else if (family === "dep") want = d.inputs.cost / (d.inputs.option ? d.inputs.life : Math.min(d.inputs.life, n));
        // Non-current: whatever is left once next year's payment has gone, whichever day it falls on.
        else if (family === "split") want = npv(flows(1, n - d.inputs.k - 1), i);
        else want = Math.round(npv(flows(1, n), i)) + d.inputs.prepaid - d.inputs.incentives + d.inputs.directCosts + d.inputs.restoration;
        assert.ok(Math.abs(d.answer - want) <= (family === "cycle" || family === "split" ? 2 : 0.51), `${family}/${seed}: ${d.answer} ≠ ${want}`);
        assert.ok(d.answer > 0, `${family}/${seed}`);
        const text = [d.prompt, d.trap, ...d.steps.flatMap((s) => [s.title, s.formula ?? "", s.numbers ?? "", s.note ?? ""])].join(" ");
        assert.ok(!/NaN|undefined|Infinity/.test(text), `${family}/${seed}: ${text}`);
      }
  });
});

describe("lesson 4: figures, against a separate calculation over dated cash flows", () => {
  const answer = (id: string) => (SUBSEQUENT.exercises.find((x) => x.id === id) as { answer: number }).answer;
  const near = (a: number, b: number, label = "") => assert.ok(Math.abs(a - b) <= 2, `${label}: ${a} ≠ ${b}`);
  it("the practice", () => {
    const expected: Record<string, number> = { "int-end": 6_000, "close-end": 162_000, "int-start": 4_990, "int-start-y2": 7_092, "close-y2-end": 53_189, "dep-no-option": 18_000, "dep-option": 12_000, "dep-life-short": 10_000, "nc-end": 80_190, "nc-start": 108_930, "pl-total": 59_189, "in-kind": 38_860, line: 6_000, cash: 24_000, "line-diff": 1_028, "contract-y1": 102_590, "what-if-option": 45_365 };
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
  });
  it("the screens: the truck, in arrears and in advance", () => {
    const end = [[7_113.14, 78_729.48, 54_240.55, 24_488.94], [5_511.06, 54_240.55, 28_037.38, 26_203.16], [3_796.84, 28_037.38, 0, 28_037.38], [1_962.62, 0, 0, 0]];
    end.forEach(([int, close, non, cur], i) => {
      const y = TRUCK_END.rows[i];
      near(y.interest, int, "interest");
      near(y.closing, close, "closing");
      near(y.nonCurrent, non, "non-current");
      near(y.current, cur, "current");
    });
    const start = [[5_511.06, 84_240.55, 54_240.55, 30_000], [3_796.84, 58_037.38, 28_037.38, 30_000], [1_962.62, 30_000, 0, 30_000], [0, 0, 0, 0]];
    start.forEach(([int, close, non, cur], i) => {
      const y = TRUCK_START.rows[i];
      near(y.interest, int, "interest");
      near(y.closing, close, "closing");
      near(y.nonCurrent, non, "non-current");
      near(y.current, cur, "current");
    });
  });
  it("the worked example", () => {
    near(WORK_S.cost, 243_577.89);
    const want = [[10_834.67, 191_412.56, 127_412.56, 64_000, 202_981.57], [7_644.75, 135_057.32, 71_057.32, 64_000, 162_385.26], [4_263.44, 75_320.75, 0, 75_320.75, 121_788.94], [679.25, 0, 0, 0, 81_192.63]];
    want.forEach(([int, close, non, cur, rou], i) => {
      const y = WORK_S.rows[i];
      near(y.interest, int);
      near(y.closing, close);
      near(y.nonCurrent, non);
      near(y.current, cur);
      near(y.rightOfUse, rou);
    });
    const total = WORK_SECTIONS[0].rows.find((x) => x.id === "total")!.values;
    assert.equal(total[0], WORK_S.rows[0].depreciation + WORK_S.rows[0].interest + 3_000);
    assert.equal(total[1], WORK_S.rows[1].depreciation + WORK_S.rows[1].interest);
  });
  it("the table to fill, the straight line and the closing question", () => {
    near(FILL_TASK.cost, 151_929.92);
    const lines = (id: string) => FILL_TASK.sections.flatMap((s) => s.rows).find((x) => x.id === id)!.values;
    [37_982.48, 37_982.48, 37_982.48].forEach((v, i) => near(lines("dep")[i], v));
    [5_446.5, 3_718.82, 1_904.76].forEach((v, i) => near(lines("fin")[i], v));
    [113_947.44, 75_964.96, 37_982.48].forEach((v, i) => near(lines("rou")[i], v));
    [40_000, 40_000, 40_000].forEach((v, i) => near(lines("cur")[i], v));
    [74_376.42, 38_095.24, 0].forEach((v, i) => near(lines("non")[i], v));
    assert.equal(KIOSK_EXPENSE, 10_000);
    assert.equal(KIOSK_ACCRUED, 2_000);
    assert.equal(LAPTOP_FULL.reduce((a, b) => a + b, 0), 30_000);
    near(MASTER_FORKLIFT.cost, 155_929.75);
    near(MASTER_VAN.cost, 93_557.85);
    near(MASTER_EXP_FORKLIFT.cost, 218_301.65);
    near(MASTER_EXP_VAN.cost, 93_557.85);
    near(MASTER_FORKLIFT.rows[1].closing, 82_502.67);
    near(MASTER_VAN.rows[1].rightOfUse, 46_778.93);
    const line = (s: typeof MASTER_LINES, id: string) => s.flatMap((x) => x.rows).find((x) => x.id === id)!.values;
    near(line(MASTER_LINES, "total")[0], 38_982.44 + 9_355.79 + 23_389.46 + 5_613.47 + 18_000, "total");
    near(line(MASTER_LINES, "non")[1], 42_452.83 + 25_471.7, "non");
    near(line(MASTER_EXP_LINES, "total")[0], 54_575.41 + 13_098.1 + 23_389.46 + 5_613.47, "expedient total");
  });
  it("what a table shows adds up to the shekel", () => {
    for (const rows of [TRUCK_END.rows, TRUCK_START.rows, WORK_S.rows, FILL_TASK.rows]) {
      rows.forEach((y) => {
        assert.equal(y.opening - y.paidAtStart + y.interest - y.paidAtEnd, y.closing);
        assert.equal(y.current + y.nonCurrent, y.closing);
      });
      assert.equal(rows.at(-1)!.closing, 0);
    }
  });
  it("the journal entries balance", () => {
    for (const id of ["year-end", "dep-entry"]) {
      const j = SUBSEQUENT.exercises.find((x) => x.id === id);
      assert.ok(j && j.kind === "journal", id);
      assert.ok(isBalanced(j.entry), id);
    }
  });
  it("the practice stands alone: every answer positive, no leaning on another question", () => {
    for (const x of SUBSEQUENT.exercises) {
      if (x.kind === "number") assert.ok(x.answer > 0, x.id);
      if (x.kind === "journal") assert.ok(isBalanced(x.entry), x.id);
      if (x.kind !== "journal") assert.ok(!/באותו|באותה|אותם|אותן|כמו בשאלה|השאלה הקודמת/.test(x.prompt), x.id);
    }
  });
});

describe("lesson 4: the statements to fill, re-computed from each task's inputs", () => {
  /** Dated flows, and the balances they give, without the solver. */
  const expected = (a: Record<string, number>) => {
    const flows: { y: number; t: number; v: number }[] = [];
    for (let k = 1; k <= a.years; k++) flows.push({ y: k, t: a.start ? k - 1 : k, v: a.payment });
    if (a.option) flows.push({ y: a.years, t: a.years, v: a.option });
    const at = (year: number) => flows.filter((f) => f.y > year).reduce((s, f) => s + f.v / (1 + a.i) ** (f.t - year), 0);
    const gross = flows.reduce((s, f) => s + f.v / (1 + a.i) ** f.t, 0);
    const cost = gross + a.directCosts;
    const dep = cost / a.depYears;
    return [1, 2].map((year) => {
      const close = at(year);
      const prev = year === 1 ? gross : at(year - 1);
      const paid = flows.filter((f) => f.y === year).reduce((s, f) => s + f.v, 0);
      const later = flows.filter((f) => f.y > year + 1);
      const non = a.start ? (later.length ? close - a.payment : 0) : later.reduce((s, f) => s + f.v / (1 + a.i) ** (f.t - (year + 1)), 0);
      return { dep, fin: close - prev + paid, rou: cost - dep * year, close, non, cur: close - non, total: dep + close - prev + paid + a.variable };
    });
  };
  it("four hundred seeds: every cell follows from the inputs, within two shekels", () => {
    for (let seed = 1; seed <= 400; seed++) {
      const task = statementDrill(seed);
      const want = expected(task.inputs);
      const line = (id: string) => task.sections.flatMap((s) => s.rows).find((x) => x.id === id)!.values;
      [0, 1].forEach((i) => {
        for (const [id, v] of [["dep", want[i].dep], ["fin", want[i].fin], ["total", want[i].total], ["rou", want[i].rou], ["cur", want[i].cur], ["non", want[i].non]] as const) assert.ok(Math.abs(line(id)[i] - v) <= 2, `${seed}/${id}/${i}: ${line(id)[i]} ≠ ${v}`);
      });
      assert.ok(!/NaN|undefined|Infinity/.test([task.prompt, ...task.notes, task.trap].join(" ")), `${seed}`);
    }
  });
  it("the drills' tables add up, for every kind of lease", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const task = statementDrill(seed);
      task.rows.forEach((y) => assert.equal(y.opening - y.paidAtStart + y.interest - y.paidAtEnd, y.closing));
      assert.equal(task.rows.at(-1)!.closing, 0);
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
