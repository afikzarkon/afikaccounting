import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { isBalanced } from "../learn/basics";
import { groupPosition, profitSplit, separateInvestment } from "../learn/consolidated";
import { STUDY_MODULES } from ".";
import { CONSOLIDATED_LESSONS } from "./consolidated";
import { drill, DRILL_FAMILIES, type DrillFamily } from "./consolidated/drills";
import { CONSOLIDATED_GLOSSARY } from "./consolidated/glossary";
import { CASES, EXEMPT_TEST, EXEMPT_TEST_START, MASTER_POSITION, MASTER_PROFIT, MASTER_SEPARATE, STORY_POSITION, STORY_PROFIT, STORY_SEPARATE, WHAT, WHAT_TAUGHT } from "./consolidated/lessons/what";
import { type ConsolidatedQuestion, LESSON_N } from "./consolidated/shared";

/** What teaches each question, lesson by lesson. */
const TAUGHT: Record<string, Record<string, string>> = { "consolidated-what": WHAT_TAUGHT };

describe("the consolidated statements course", () => {
  it("lessons numbered in order, on the course's page, the first free", () => {
    CONSOLIDATED_LESSONS.forEach((m, i) => {
      assert.equal(m.n, i + 1, m.slug);
      assert.equal(m.backHref, "/basics/consolidated", m.slug);
      assert.equal(STUDY_MODULES[m.slug], m);
    });
    assert.deepEqual(TOPICS.find((t) => t.id === "consolidated")?.preview, ["consolidated-what"]);
    assert.deepEqual(CONSOLIDATED_LESSONS.map((m) => [m.slug, m.n]), Object.entries(LESSON_N));
  });

  it("no orphan screens: the course's screen files define exactly the screens its lessons list, all ls-", () => {
    const dir = join(process.cwd(), "src/components/basics");
    const defined = readdirSync(dir)
      .filter((f) => /^consolidated-course.*\.tsx$/.test(f))
      .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(/^ {2}"(ls-[\w-]+)": \{/gm)].map((m) => m[1]));
    const listed = CONSOLIDATED_LESSONS.flatMap((m) => m.screens.map((s) => s.id));
    assert.deepEqual([...defined].sort(), [...listed].sort());
    for (const id of listed) assert.ok(id.startsWith("ls-"), id);
  });

  it("every practice question has a level and a reference, and its solution ends on a common trap", () => {
    for (const m of CONSOLIDATED_LESSONS)
      for (const x of m.exercises) {
        const q = x as ConsolidatedQuestion;
        assert.ok(q.meta, `${m.slug}/${q.id}: no meta`);
        assert.ok([1, 2, 3].includes(q.meta.level), q.id);
        assert.ok(q.meta.ref.trim(), q.id);
        if (x.kind === "journal") assert.ok(x.entry.why?.includes("מלכודת נפוצה:"), x.id);
        else assert.ok(q.steps.at(-1)!.startsWith("מלכודת נפוצה:"), q.id);
      }
  });

  it("at least eight questions at each level", () => {
    for (const m of CONSOLIDATED_LESSONS)
      for (const level of [1, 2, 3]) {
        const n = m.exercises.filter((x) => (x as ConsolidatedQuestion).meta.level === level).length;
        assert.ok(n >= 8, `${m.slug}: level ${level} has ${n}`);
      }
  });

  it("multiple choice: the answer is an option, options differ, every wrong option is explained", () => {
    for (const m of CONSOLIDATED_LESSONS) {
      for (const x of m.exercises)
        if (x.kind === "choice") {
          assert.ok(x.answer >= 0 && x.answer < x.options.length && new Set(x.options).size === x.options.length, x.id);
          assert.equal(x.steps.filter((s) => s.includes("למה לא")).length, x.options.length - 1, x.id);
        }
      for (const t of m.traps) {
        assert.equal(t.traps.length, t.options.length, t.id);
        assert.equal(t.traps[t.answer], "", t.id);
        t.traps.forEach((why, i) => i === t.answer || assert.ok(why.trim(), t.id));
      }
    }
  });

  it("journal entries balance, on accounts the site knows", () => {
    for (const m of CONSOLIDATED_LESSONS)
      for (const x of m.exercises)
        if (x.kind === "journal") {
          assert.ok(isBalanced(x.entry), x.id);
          for (const l of x.entry.lines) assert.ok(x.accounts.includes(l.account), `${x.id}: ${l.account}`);
        }
  });

  it("nothing is asked before it is taught: every question names a screen of its lesson or an earlier one", () => {
    CONSOLIDATED_LESSONS.forEach((m, i) => {
      const taught = TAUGHT[m.slug];
      assert.ok(taught, `${m.slug}: no map of what is taught`);
      const screens = new Set(CONSOLIDATED_LESSONS.slice(0, i + 1).flatMap((l) => l.screens.map((s) => s.id)));
      const ids = [...m.exercises.map((x) => x.id), ...m.traps.map((t) => t.id)];
      for (const id of ids) {
        assert.ok(taught[id], `${m.slug}/${id}: no screen teaches it`);
        assert.ok(screens.has(taught[id]), `${m.slug}/${id}: ${taught[id]} comes later or doesn't exist`);
      }
      assert.deepEqual(Object.keys(taught).sort(), [...ids].sort(), `${m.slug}: stale entries`);
    });
  });

  it("every question stands alone: no reference to another question's company or numbers", () => {
    for (const m of CONSOLIDATED_LESSONS)
      for (const x of m.exercises) {
        const text = x.kind === "journal" ? x.entry.text : x.prompt;
        assert.ok(!/באותה חברה|אותם מספרים|בנתוני|כמו בשאלה/.test(text), x.id);
      }
  });

  it("the course's text has no long dash", () => {
    const dir = join(process.cwd(), "src/components/basics");
    for (const f of readdirSync(dir).filter((n) => /^consolidated-/.test(n))) assert.ok(!/[—–]/.test(readFileSync(join(dir, f), "utf8")), f);
    const lessons = join(process.cwd(), "src/lib/study/consolidated/lessons");
    for (const f of readdirSync(lessons)) assert.ok(!/[—–]/.test(readFileSync(join(lessons, f), "utf8")), f);
  });

  it("the glossary: no term twice, none empty", () => {
    assert.equal(new Set(CONSOLIDATED_GLOSSARY.map(([t]) => t)).size, CONSOLIDATED_GLOSSARY.length);
    for (const [t, d] of CONSOLIDATED_GLOSSARY) assert.ok(t.trim() && d.trim(), t);
  });
});

describe("lesson 1: the walk and the sorting", () => {
  it("every step of the exemption walk leads somewhere, and only all four conditions exempt", () => {
    const isEnd = (id: string) => "verdict" in EXEMPT_TEST[id];
    const reach = (id: string, depth: number, path: number): void => {
      assert.ok(EXEMPT_TEST[id], id);
      if (isEnd(id)) {
        const end = EXEMPT_TEST[id] as { lease: boolean };
        assert.equal(end.lease, path === 4 && depth === 4, id);
        return;
      }
      const node = EXEMPT_TEST[id] as { answers: { to: string }[] };
      node.answers.forEach((a, i) => reach(a.to, depth + 1, i === 0 ? path + 1 : path));
    };
    reach(EXEMPT_TEST_START, 0, 0);
  });
  it("seven deals, both answers among them", () => {
    assert.equal(CASES.length, 7);
    assert.ok(CASES.some((c) => c.answer === "yes") && CASES.some((c) => c.answer === "no"));
  });
});

describe("lesson 1: figures, against a separate calculation in Python", () => {
  const answer = (id: string) => (WHAT.exercises.find((x) => x.id === id) as { answer: number }).answer;
  it("the practice", () => {
    const expected: Record<string, number> = { "nci-profit-simple": 72_000, "stock-whole": 465_000, "owners-equity": 1_260_000, "nci-equity": 120_000, "cost-dividend": 26_000, "owners-profit": 412_000, "equity-balance": 577_000, "method-gap": 78_000, "loan-assets": 1_050_000 };
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    const numbers = WHAT.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort();
    assert.deepEqual(numbers, Object.keys(expected).sort());
  });
  it("the story", () => {
    assert.deepEqual(STORY_POSITION, { assets: 2_100_000, liabilities: 890_000, net: 1_210_000, subNet: 440_000, parentNet: 770_000, owners: 1_100_000, nci: 110_000 });
    assert.deepEqual(STORY_PROFIT, { total: 240_000, owners: 224_000, nci: 16_000 });
    assert.deepEqual(STORY_SEPARATE, { dividendShare: 18_000, profitShare: 48_000, atCost: { balance: 330_000, income: 18_000 }, atEquity: { balance: 360_000, income: 48_000 } });
  });
  it("the closing question", () => {
    assert.deepEqual(MASTER_POSITION, { assets: 3_600_000, liabilities: 1_550_000, net: 2_050_000, subNet: 700_000, parentNet: 1_350_000, owners: 1_840_000, nci: 210_000 });
    assert.deepEqual(MASTER_PROFIT, { total: 510_000, owners: 462_000, nci: 48_000 });
    assert.deepEqual(MASTER_SEPARATE, { dividendShare: 42_000, profitShare: 112_000, atCost: { balance: 420_000, income: 42_000 }, atEquity: { balance: 490_000, income: 112_000 } });
    // Bought at the share of net assets on 1.1: closing 700,000 less the year's profit plus the dividend, times 70%.
    assert.equal((700_000 - 160_000 + 60_000) * 0.7, 420_000);
  });
  it("what the mistake screen corrects", () => {
    const g = groupPosition({ parentAssets: 540_000, parentLiabilities: 0, subAssets: 230_000, subLiabilities: 60_000, holding: 0.9 });
    assert.equal(g.assets, 770_000);
    assert.equal(g.nci, 17_000);
  });
  it("group arithmetic always balances", () => {
    for (const holding of [0.51, 0.6, 0.75, 1]) {
      const g = groupPosition({ parentAssets: 1_000, parentLiabilities: 300, subAssets: 800, subLiabilities: 200, holding });
      assert.equal(g.owners + g.nci, g.net);
      const p = profitSplit({ parentProfit: 100, subProfit: 40, holding });
      assert.equal(p.owners + p.nci, p.total);
    }
    const s = separateInvestment({ cost: 100, holding: 0.5, subProfit: 40, subDividend: 10 });
    assert.equal(s.atEquity.balance - s.atCost.balance, s.profitShare - s.dividendShare);
  });
});

describe("the practice generator", () => {
  it("every family, many seeds: a whole answer, an exercise that changes, and no broken text", () => {
    for (const family of Object.keys(DRILL_FAMILIES) as DrillFamily[]) {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 200; seed++) {
        const d = drill(family, seed);
        assert.ok(Number.isInteger(d.answer) && d.answer > 0, `${family}/${seed}: ${d.answer}`);
        assert.ok(!/NaN|undefined/.test(d.prompt + JSON.stringify(d.steps)), `${family}/${seed}`);
        assert.ok(d.steps.length && d.trap.trim(), `${family}/${seed}`);
        seen.add(d.answer);
      }
      assert.ok(seen.size > 20, family);
    }
  });
  it("the answer equals the last step's result", () => {
    for (const family of Object.keys(DRILL_FAMILIES) as DrillFamily[])
      for (let seed = 1; seed <= 50; seed++) {
        const d = drill(family, seed);
        const last = d.steps.at(-1)!.numbers.split("=").at(-1)!.trim().replaceAll(",", "");
        assert.equal(Number(last), d.answer, `${family}/${seed}`);
      }
  });
});
