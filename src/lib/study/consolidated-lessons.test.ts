import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { isBalanced } from "../learn/basics";
import { afterConversion, groupPosition, meetingShare, partnersToBeat, profitSplit, separateInvestment } from "../learn/consolidated";
import { STUDY_MODULES } from ".";
import { CONSOLIDATED_LESSONS } from "./consolidated";
import { drill, DRILL_FAMILIES, type DrillFamily } from "./consolidated/drills";
import { CONSOLIDATED_GLOSSARY } from "./consolidated/glossary";
import { ATTEND_NO, ATTEND_YES, BOARD, CONTROL, CONTROL_TAUGHT, CONVERTED, MASTER2_NOW, MASTER2_OPTION, MASTER2_PARTNERS, MASTER2_POSITION, POWER_TEST, POWER_TEST_START, RIGHTS, TWO_JOIN } from "./consolidated/lessons/control";
import { ACQUISITION, ACQUISITION_TAUGHT, BOND, ITEMS, LESSEE, LESSOR, MASTER4_TABLE, STORY_TABLE } from "./consolidated/lessons/acquisition";
import { G_FAIR, G_NET, G_PREMIUM, G_SHARE, GOODWILL, GOODWILL_TAUGHT, M5, PAYS, PERIOD, PERIOD_TEST, PERIOD_TEST_START } from "./consolidated/lessons/goodwill";
import { AGENT_TEST, AGENT_TEST_START, AGENTS, FUND_LARGE, FUND_SMALL, MASTER3_POSITION, MASTER3_REWARD, MASTER3_SISTER, MASTER3_TOGETHER, RETURNS, RETURNS_TAUGHT } from "./consolidated/lessons/returns";
import { BORROW10, DEFER10, INTERCOMPANY, INTERCOMPANY_TAUGHT, INV10, LAND10, LOSS10, M10, MACH10, MACH10_FIG, MISTAKE10, PRIOR10, SAME10, SPLIT10, WD10 } from "./consolidated/lessons/intercompany";
import { DATES9, DTA9, IMP9, IMPAIRMENT, IMPAIRMENT_TAUGHT, M9, M9_NCI_END, PREF9, PREF_PROFIT } from "./consolidated/lessons/impairment";
import { BOND8, BOND8_OCI, DEBT_TEST, DEBT_TEST_START, FINANCE, FINANCE_TAUGHT, IMPAIR8, M8, NEEDS, SHARES8_FIG } from "./consolidated/lessons/finance";
import { BUILDING, LAND, M7, M7_2025, M7_NCI, POLICY, POLICY_TAUGHT, POLICY_TEST, POLICY_TEST_START, ADJUST, TABLE7_2025, TABLE7_2026 } from "./consolidated/lessons/policy";
import { M6, STORY6, WHOSE, WORKSHEET, WORKSHEET_TAUGHT, YEAR2, YEAR2_NCI_END } from "./consolidated/lessons/worksheet";
import { CASES, EXEMPT_TEST, EXEMPT_TEST_START, MASTER_POSITION, MASTER_PROFIT, MASTER_SEPARATE, STORY_POSITION, STORY_PROFIT, STORY_SEPARATE, WHAT, WHAT_TAUGHT } from "./consolidated/lessons/what";
import { type ConsolidatedQuestion, LESSON_N } from "./consolidated/shared";
import { ltrFormulas } from "./ias19/ltr";

/** What teaches each question, lesson by lesson. */
const TAUGHT: Record<string, Record<string, string>> = { "consolidated-what": WHAT_TAUGHT, "consolidated-control": CONTROL_TAUGHT, "consolidated-returns": RETURNS_TAUGHT, "consolidated-acquisition": ACQUISITION_TAUGHT, "consolidated-goodwill": GOODWILL_TAUGHT, "consolidated-worksheet": WORKSHEET_TAUGHT, "consolidated-policy": POLICY_TAUGHT, "consolidated-finance": FINANCE_TAUGHT, "consolidated-impairment": IMPAIRMENT_TAUGHT, "consolidated-intercompany": INTERCOMPANY_TAUGHT };

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

  it("a formula is laid out left to right with no Hebrew word caught inside it, in the practice and on the screens", () => {
    const isolate = /\u2066([^\u2069]*)\u2069/g;
    const bad: string[] = [];
    const check = (where: string, s: string | undefined) => {
      for (const m of ltrFormulas(s ?? "").matchAll(isolate)) if (/[\u05d0-\u05ea]/.test(m[1])) bad.push(`${where}: ${m[1].replace(/\u200e/g, "")}`);
    };
    for (const m of CONSOLIDATED_LESSONS) {
      for (const x of m.exercises) {
        if (x.kind === "journal") check(x.id, x.entry.why);
        else {
          check(x.id, x.prompt);
          x.steps.forEach((s) => check(x.id, s));
          if (x.kind === "choice") x.options.forEach((o) => check(x.id, o));
        }
      }
      for (const t of m.traps) [t.prompt, t.why, ...t.options, ...t.traps].forEach((s) => check(t.id, s));
      m.tips.forEach((s) => check(m.slug, s));
    }
    const dir = join(process.cwd(), "src/components/basics");
    for (const f of readdirSync(dir).filter((n) => /^consolidated-course.*\.tsx$/.test(n))) {
      const text = readFileSync(join(dir, f), "utf8");
      for (const m of text.matchAll(/\b(?:q|why|story|lead): "([^"]+)"/g)) check(f, m[1]);
      for (const m of text.matchAll(/options: \[(.+)\],?$/gm)) for (const o of m[1].matchAll(/"([^"]+)"/g)) check(f, o[1]);
    }
    assert.deepEqual(bad, []);
  });

  it("a bare formula in a table cell would read backwards: it sits in an isolate or in a Calc", () => {
    const dir = join(process.cwd(), "src/components/basics");
    const bad: string[] = [];
    for (const f of readdirSync(dir).filter((n) => /^consolidated-course.*\.tsx$/.test(n)))
      for (const line of readFileSync(join(dir, f), "utf8").split(/\r?\n/)) {
        if (!/^\s*\[/.test(line) || line.includes("<Calc") || line.includes("<bdi")) continue;
        for (const m of line.matchAll(/"([^"]+)"/g)) if (/^[\d,.% ]+[×÷/+−=][\d,.% ×÷/+−=]*$/.test(m[1])) bad.push(`${f}: ${m[1]}`);
      }
    assert.deepEqual(bad, []);
  });

  it("a Calc formula is pure math: Hebrew words go in `words`, outside the left-to-right span", () => {
    const dir = join(process.cwd(), "src/components/basics");
    const bad: string[] = [];
    for (const f of readdirSync(dir).filter((n) => /^consolidated-.*\.tsx$/.test(n)))
      for (const m of readFileSync(join(dir, f), "utf8").matchAll(/<Calc\b[^>]*?\bformula=(?:"([^"]*)"|\{`([^`]*)`\})/g))
        if (/[א-ת]/.test(m[1] ?? m[2])) bad.push(`${f}: ${m[1] ?? m[2]}`);
    assert.deepEqual(bad, []);
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

describe("lesson 2: the walk and the sorting", () => {
  it("every path of the walk ends, and both verdicts are reachable", () => {
    const ends = new Set<boolean>();
    const reach = (id: string, seen: string[]): void => {
      const node = POWER_TEST[id];
      assert.ok(node, id);
      assert.ok(!seen.includes(id), `loop at ${id}`);
      if ("verdict" in node) return void ends.add(node.lease);
      node.answers.forEach((a) => reach(a.to, [...seen, id]));
    };
    reach(POWER_TEST_START, []);
    assert.deepEqual([...ends].sort(), [false, true]);
  });
  it("eight rights to sort, both answers among them", () => {
    assert.equal(RIGHTS.length, 8);
    assert.ok(RIGHTS.some((r) => r.answer === "real") && RIGHTS.some((r) => r.answer === "guard"));
  });
});

describe("lesson 2: figures, against a separate calculation in Python", () => {
  const q = (id: string) => CONTROL.exercises.find((x) => x.id === id) as { answer: number; options: string[] };
  it("the screens", () => {
    assert.deepEqual(ATTEND_NO, { share: 45, decides: false, lostAbove: 72 });
    assert.deepEqual(ATTEND_YES, { share: 56, decides: true, lostAbove: 84 });
    assert.equal(TWO_JOIN, 2);
    assert.equal(CONVERTED, 65);
    assert.equal(BOARD.partners, 2);
    assert.equal(BOARD.votes / BOARD.seats, 7.75);
    assert.equal(28 + 25, 53);
    assert.equal(meetingShare({ holding: 39, attendance: 60 }).share, 65);
  });
  it("the closing question", () => {
    assert.equal(MASTER2_NOW.share, 60);
    assert.equal(MASTER2_NOW.lostAbove, 72);
    assert.equal(MASTER2_PARTNERS, null);
    assert.equal(MASTER2_OPTION.share, 75);
    assert.equal(MASTER2_OPTION.lostAbove, 90);
    assert.deepEqual(MASTER2_POSITION, { assets: 3_150_000, liabilities: 1_290_000, net: 1_860_000, subNet: 640_000, parentNet: 1_220_000, owners: 1_450_400, nci: 409_600 });
    assert.equal(640_000 * 0.36, 230_400);
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "nci-dispersed": 477_000, "assets-control": 2_200_000, "owners-control": 1_184_000, "nci-attendance": 488_000, "no-control-assets": 1_240_000 };
    for (const [id, want] of Object.entries(expected)) assert.equal(q(id).answer, want, id);
    const numbers = CONTROL.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort();
    assert.deepEqual(numbers, Object.keys(expected).sort());
  });
  it("figures among the choices: the marked option is the calculated one", () => {
    const right = (id: string) => q(id).options[q(id).answer];
    assert.equal(right("present-basic"), `${meetingShare({ holding: 30, attendance: 50 }).share}%`);
    assert.equal(right("beat-basic"), String(partnersToBeat(40, [25, 20, 15])));
    assert.equal(right("conversion"), `${Math.round(afterConversion({ shares: 14_000, total: 35_000, newShares: 15_000 }))}%`);
    assert.equal(right("buy-from-holder"), `${28 + 64 / 2}%`);
    assert.ok(right("attendance-rise").startsWith(String(meetingShare({ holding: 33, attendance: 60 }).lostAbove - 60)));
    assert.ok(right("option-threshold").includes(`${meetingShare({ holding: 42, attendance: 60 }).lostAbove}%`));
    assert.ok(right("votes-board").startsWith(`${28 / 4}%`) && right("votes-board").includes(`${30 / 2}%`));
  });
  it("arithmetic of the room", () => {
    for (const holding of [21, 33, 42, 49]) {
      const at = meetingShare({ holding, attendance: holding * 2 });
      assert.equal(at.decides, false, "exactly half does not decide");
      assert.equal(meetingShare({ holding, attendance: holding * 2 - 1 }).decides, true);
    }
    assert.equal(partnersToBeat(36, [9, 6, 5, 5]), null);
    assert.equal(partnersToBeat(10, [11]), 1);
    assert.equal(partnersToBeat(10, [5, 5]), null, "equal is not more");
  });
});

describe("lesson 3: the walk, the sorting and the figures, against a separate calculation in Python", () => {
  it("every path of the walk ends, and both verdicts are reachable", () => {
    const ends = new Set<boolean>();
    const reach = (id: string, seen: string[]): void => {
      const node = AGENT_TEST[id];
      assert.ok(node, id);
      assert.ok(!seen.includes(id), `loop at ${id}`);
      if ("verdict" in node) return void ends.add(node.lease);
      node.answers.forEach((a) => reach(a.to, [...seen, id]));
    };
    reach(AGENT_TEST_START, []);
    assert.deepEqual([...ends].sort(), [false, true]);
  });
  it("seven cases to sort, both answers among them", () => {
    assert.equal(AGENTS.length, 7);
    assert.ok(AGENTS.some((a) => a.answer === "agent") && AGENTS.some((a) => a.answer === "principal"));
  });
  it("the fund on the screens", () => {
    assert.deepEqual(FUND_SMALL, { fee: 600_000, performance: 600_000, left: 3_800_000, fromHolding: 114_000, total: 1_314_000, share: 26.28 });
    assert.deepEqual(FUND_LARGE, { fee: 600_000, performance: 600_000, left: 3_800_000, fromHolding: 950_000, total: 2_150_000, share: 43 });
  });
  it("the closing question", () => {
    assert.deepEqual(MASTER3_REWARD, { fee: 900_000, performance: 450_000, left: 3_650_000, fromHolding: 912_500, total: 2_262_500, share: 45.25 });
    assert.equal(MASTER3_SISTER, 547_500);
    assert.equal(MASTER3_TOGETHER, 2_810_000);
    assert.equal((MASTER3_TOGETHER / 5_000_000) * 100, 56.2);
    assert.deepEqual(MASTER3_POSITION, { assets: 73_000_000, liabilities: 11_000_000, net: 62_000_000, subNet: 60_000_000, parentNet: 2_000_000, owners: 17_000_000, nci: 45_000_000 });
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "fee-only": 600_000, "manager-total": 1_055_000, "silo-assets": 1_300_000, "silo-rest": 4_500_000, "nci-agent": 420_000, "expired-nci": 153_000, "agent-own-assets": 7_400_000 };
    const answer = (id: string) => (RETURNS.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(RETURNS.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
    const share = RETURNS.exercises.find((x) => x.id === "share-of-result") as { answer: number; options: string[] };
    assert.equal(share.options[share.answer], `${FUND_LARGE.share}%`);
  });
});

describe("lesson 4: figures, against a separate calculation in Python", () => {
  it("the bond", () => {
    assert.deepEqual([BOND.need, BOND.book, BOND.needEnd, BOND.bookEnd], [192_768, 207_654, 199_401, 210_746]);
  });
  it("the worked table", () => {
    assert.deepEqual(STORY_TABLE.items.map((r) => [r.at, r.amortized, r.end]), [[15_000, -9_000, 6_000], [48_000, -3_000, 45_000], [50_000, -5_000, 45_000], [12_000, -4_000, 8_000], [-20_000, 0, -20_000], [14_886, -3_541, 11_345]]);
    assert.deepEqual([STORY_TABLE.tax.at, STORY_TABLE.tax.amortized, STORY_TABLE.tax.end], [-27_574, 5_645, -21_929]);
    assert.deepEqual(STORY_TABLE.total, { at: 92_312, amortized: -18_896, end: 73_416 });
  });
  it("the lease on each side", () => {
    assert.deepEqual(LESSEE, { liabilityNeed: 30_925, liabilityBook: 32_076, rouNeed: 33_502, rouBook: 30_329 });
    assert.deepEqual(LESSOR, { value: 131_464, plain: 127_654, excess: 41_464 });
  });
  it("the closing question", () => {
    assert.deepEqual(MASTER4_TABLE.items.map((r) => [r.at, r.amortized, r.end]), [[12_000, -9_000, 3_000], [60_000, 0, 60_000], [30_000, -4_500, 25_500], [32_000, -6_000, 26_000], [5_000, -3_000, 2_000], [-18_000, 0, -18_000]]);
    assert.deepEqual([MASTER4_TABLE.tax.at, MASTER4_TABLE.tax.amortized, MASTER4_TABLE.tax.end], [-27_830, 5_175, -22_655]);
    assert.deepEqual(MASTER4_TABLE.total, { at: 93_170, amortized: -17_325, end: 75_845 });
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "inv-rest": 7_800, "eq-amort": 6_000, "tax-sum": 13_800, "hfs-excess": 12_000, "suit-higher": 18_000, "table-net": 55_440, "table-end": 45_661, "cost-sales": 75_600, "lessee-liability": 37_188 };
    const answer = (id: string) => (ACQUISITION.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(ACQUISITION.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
  });
  it("eight items to sort, both answers among them", () => {
    assert.equal(ITEMS.length, 8);
    assert.ok(ITEMS.some((i) => i.answer === "yes") && ITEMS.some((i) => i.answer === "no"));
  });
});

describe("lesson 5: the walk, the sorting and the figures, against a separate calculation in Python", () => {
  it("every path of the walk ends, and both verdicts are reachable", () => {
    const ends = new Set<boolean>();
    const reach = (id: string, seen: string[]): void => {
      const node = PERIOD_TEST[id];
      assert.ok(node, id);
      assert.ok(!seen.includes(id), `loop at ${id}`);
      if ("verdict" in node) return void ends.add(node.lease);
      node.answers.forEach((a) => reach(a.to, [...seen, id]));
    };
    reach(PERIOD_TEST_START, []);
    assert.deepEqual([...ends].sort(), [false, true]);
  });
  it("seven payments to sort, both answers among them", () => {
    assert.equal(PAYS.length, 7);
    assert.ok(PAYS.some((p) => p.answer === "price") && PAYS.some((p) => p.answer === "pay"));
  });
  it("the worked example", () => {
    assert.equal(G_NET, 202_000);
    assert.equal(G_PREMIUM, 15_000);
    assert.deepEqual(G_FAIR, { nci: 48_000, cost: 255_000, goodwill: 53_000, ownersGoodwill: 45_400, nciGoodwill: 7_600 });
    assert.deepEqual(G_SHARE, { nci: 40_400, cost: 247_400, goodwill: 45_400, ownersGoodwill: 45_400, nciGoodwill: 0 });
  });
  it("the measurement period", () => {
    assert.equal(PERIOD.pubNet, 131_000);
    assert.equal(PERIOD.finalNet, 140_000);
    assert.equal(PERIOD.pubFair.goodwill, 67_000);
    assert.equal(PERIOD.pubShare.goodwill, 57_750);
    assert.equal(PERIOD.finalFair.goodwill, 64_300);
    assert.equal(PERIOD.finalShare.goodwill, 57_300);
  });
  it("the closing question", () => {
    assert.equal(M5.net, 223_000);
    assert.equal(M5.consideration, 234_000);
    assert.equal(M5.premium, 39_000);
    assert.deepEqual(M5.fair, { nci: 75_000, cost: 339_000, goodwill: 116_000, ownersGoodwill: 96_750, nciGoodwill: 19_250 });
    assert.deepEqual(M5.share, { nci: 55_750, cost: 319_750, goodwill: 96_750, ownersGoodwill: 96_750, nciGoodwill: 0 });
    assert.equal(M5.after.goodwill, 119_000);
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "consideration-sum": 144_000, "separate-debt": 270_000, "earnout-loss": 4_300, "nci-share": 72_000, "gw-fair": 6_000, "bargain-gain": 22_000, "owners-gw": 17_000, "premium-calc": 14_000, "retro-gw": 66_000, "retro-amort": 1_200 };
    const answer = (id: string) => (GOODWILL.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(GOODWILL.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
  });
});

describe("lesson 6: the worksheet, against a separate calculation in Python", () => {
  it("eight adjustments to sort, both answers among them", () => {
    assert.equal(WHOSE.length, 8);
    assert.ok(WHOSE.some((w) => w.answer === "parent") && WHOSE.some((w) => w.answer === "sub"));
  });
  it("the worked example: excess cost, goodwill and the profit", () => {
    assert.equal(STORY6.netAt, 148_000);
    assert.deepEqual(STORY6.goodwill, { nci: 40_000, cost: 180_000, goodwill: 32_000, ownersGoodwill: 29_000, nciGoodwill: 3_000 });
    assert.equal(STORY6.premium, 20_000);
    assert.deepEqual(STORY6.table.total, { at: 24_000, amortized: -12_000, end: 12_000 });
    assert.deepEqual([STORY6.adjusted.a.total, STORY6.adjusted.b.total], [1_000, 16_000]);
    assert.deepEqual(STORY6.income.map((r) => r.total), [310_000, -182_000, -76_000, 0, -35_000]);
    assert.deepEqual(STORY6.split, { profit: { total: 17_000, nci: 4_000, owners: 13_000 }, comprehensive: { total: 40_000, nci: 6_000, owners: 34_000 } });
  });
  it("the worked example: position, equity and its changes", () => {
    assert.deepEqual([STORY6.assets, STORY6.liabilities], [489_000, 95_000]);
    assert.deepEqual(STORY6.equity, { netA: 202_000, netB: 160_000, owners: 351_000, nci: 43_000, total: 394_000, capital: 40_000, premium: 60_000, reserve: 21_000, retained: 230_000 });
    assert.equal(STORY6.assets - STORY6.liabilities, STORY6.equity.total);
    assert.deepEqual(STORY6.changes.close, { capital: 40_000, premium: 60_000, reserve: 21_000, retained: 230_000, owners: 351_000, nci: 43_000, total: 394_000 });
    assert.deepEqual([STORY6.changes.dividends.retained, STORY6.changes.dividends.nci, STORY6.changes.acquisition.nci], [-16_000, -3_000, 40_000]);
  });
  it("the second year", () => {
    assert.deepEqual(YEAR2, { armonOpen: 148_000, excessOpen: 12_000, nciOpen: 43_000, adjusted: 37_000, nciProfit: 9_250, nciDividend: 4_000, excessEnd: 9_000, nofarRetainedOpen: 227_000 });
    assert.equal(YEAR2_NCI_END, 48_250);
    assert.equal((148_000 + 40_000 - 16_000 + 9_000) * 0.25 + 3_000, YEAR2_NCI_END);
  });
  it("the closing question", () => {
    assert.equal(M6.netAt, 261_000);
    assert.deepEqual(M6.goodwill, { nci: 52_200, cost: 282_200, goodwill: 21_200, ownersGoodwill: 21_200, nciGoodwill: 0 });
    assert.deepEqual([M6.adjusted.a.total, M6.adjusted.b.total], [35_000, 29_000]);
    assert.deepEqual(M6.income.map((r) => r.total), [600_000, -388_000, -120_000, 0, -28_000]);
    assert.deepEqual(M6.split.profit, { total: 64_000, nci: 5_800, owners: 58_200 });
    assert.deepEqual([M6.assets, M6.liabilities], [811_200, 145_000]);
    assert.deepEqual([M6.equity.owners, M6.equity.nci, M6.equity.total, M6.equity.retained], [612_200, 54_000, 666_200, 462_200]);
    assert.equal(M6.changes.close.nci, 54_000);
    assert.equal(M6.changes.close.retained, M6.equity.retained);
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "nci-share-l1": 15_600, "div-out-l1": 21_000, "sub-adjusted": 55_000, "parent-adjusted": 68_000, "owners-profit": 112_000, "nci-balance": 67_000, "reserve-cons": 36_000, "nci-dividend": 12_000, "re-close": 361_000, "nci-close": 48_000, "year2-nci-open": 64_000, "owners-full": 103_500, "comp-nci": 18_600, "re-pn": 350_000 };
    const answer = (id: string) => (WORKSHEET.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(WORKSHEET.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
  });
});

describe("lesson 7: the walk, the sorting and the figures, against a separate calculation in Python", () => {
  it("every path of the walk ends, and both verdicts are reachable", () => {
    const ends = new Set<boolean>();
    const reach = (id: string, seen: string[]): void => {
      const node = POLICY_TEST[id];
      assert.ok(node, id);
      assert.ok(!seen.includes(id), `loop at ${id}`);
      if ("verdict" in node) return void ends.add(node.lease);
      node.answers.forEach((a) => reach(a.to, [...seen, id]));
    };
    reach(POLICY_TEST_START, []);
    assert.deepEqual([...ends].sort(), [false, true]);
  });
  it("eight cases to sort, both answers among them", () => {
    assert.equal(ADJUST.length, 8);
    assert.ok(ADJUST.some((a) => a.answer === "yes") && ADJUST.some((a) => a.answer === "no"));
  });
  it("the table of excess cost over the years", () => {
    assert.deepEqual(TABLE7_2025.items.map((r) => [r.at, r.amortized, r.end]), [[22_000, 21_000, 43_000], [0, -14_000, -14_000]]);
    assert.deepEqual([TABLE7_2025.tax.at, TABLE7_2025.tax.amortized, TABLE7_2025.tax.end], [-5_060, -1_610, -6_670]);
    assert.deepEqual(TABLE7_2025.total, { at: 16_940, amortized: 5_390, end: 22_330 });
    assert.deepEqual([TABLE7_2026.tax.at, TABLE7_2026.tax.amortized, TABLE7_2026.tax.end], [3_220, 1_610, 4_830]);
    assert.deepEqual(TABLE7_2026.total, { at: -10_780, amortized: -5_390, end: -16_170 });
  });
  it("the building, seen by the subsidiary and by the group", () => {
    assert.equal(BUILDING.carrying25, 144_000);
    assert.equal(BUILDING.lossLeft, 16_000);
    assert.deepEqual([BUILDING.sub25, BUILDING.group25], [{ pl: 16_000, oci: 8_000 }, { pl: 0, oci: 24_000 }]);
    assert.deepEqual([BUILDING.subNet, BUILDING.groupNet, BUILDING.subRealised, BUILDING.groupRealised], [6_160, 18_480, 770, 2_310]);
    assert.deepEqual([BUILDING.ownersReserve, BUILDING.nciReserve, BUILDING.ownersRealised], [12_936, 5_544, 1_617]);
    assert.deepEqual([BUILDING.carrying26, BUILDING.subSurplus26, BUILDING.groupSurplus26], [147_000, 7_000, 21_000]);
    assert.deepEqual([BUILDING.sub26, BUILDING.group26], [{ pl: -14_000, oci: -7_000 }, { pl: 0, oci: -21_000 }]);
    assert.deepEqual([16_000 * 0.23, 16_000 * 0.77, 14_000 * 0.23, 14_000 * 0.77].map(Math.round), [3_680, 12_320, 3_220, 10_780]);
  });
  it("the land on the move to revaluation", () => {
    assert.deepEqual([LAND.sub, LAND.group], [{ pl: 0, oci: 24_000 }, { pl: -12_000, oci: 0 }]);
    assert.deepEqual([36_000 * 0.23, 24_000 * 0.77, 12_000 * 0.23].map(Math.round), [8_280, 18_480, 2_760]);
  });
  it("the closing question", () => {
    assert.deepEqual(M7_2025.total, { at: -6_160, amortized: 6_160, end: 0 });
    assert.deepEqual([M7_2025.tax.at, M7_2025.tax.amortized, M7_2025.tax.end], [1_840, -1_840, 0]);
    assert.deepEqual([M7.sub, M7.group], [{ pl: 0, oci: -7_000 }, { pl: -7_000, oci: 0 }]);
    assert.equal(M7.adjusted, 90_770);
    assert.equal(M7_NCI, 18_154);
    assert.deepEqual(M7.table26.total, { at: 8_470, amortized: 6_160, end: 14_630 });
    assert.deepEqual([M7.table26.tax.at, M7.table26.tax.amortized, M7.table26.tax.end], [-2_530, -1_840, -4_370]);
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "ip-excess-l1": 19_000, "reserve-share-l1": 21_000, "qual-effect": 6_160, "ip-amort": 9_000, "group-pl": 12_000, "oci-adjust": 7_700, "model-pl": 15_000, "table-net": 18_480, "sub-adjusted7": 81_540, "nci-cut": 1_540, "realised-owners": 800, "change-oci": 18_000 };
    const answer = (id: string) => (POLICY.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(POLICY.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
  });
});

describe("lesson 8: the walk, the sorting and the figures, against a separate calculation in Python", () => {
  it("every path of the walk ends, and both verdicts are reachable", () => {
    const ends = new Set<boolean>();
    const reach = (id: string, seen: string[]): void => {
      const node = DEBT_TEST[id];
      assert.ok(node, id);
      assert.ok(!seen.includes(id), `loop at ${id}`);
      if ("verdict" in node) return void ends.add(node.lease);
      node.answers.forEach((a) => reach(a.to, [...seen, id]));
    };
    reach(DEBT_TEST_START, []);
    assert.deepEqual([...ends].sort(), [false, true]);
  });
  it("eight cases to sort, both answers among them", () => {
    assert.equal(NEEDS.length, 8);
    assert.ok(NEEDS.some((x) => x.answer === "yes") && NEEDS.some((x) => x.answer === "no"));
  });
  it("the shares", () => {
    assert.deepEqual(SHARES8_FIG, { subReserveX: 9_240, groupReserveX: 4_620, reserveY: 2_310, ociX: 4_620, subReserve: 11_550, groupReserve: 6_930, owners: 4_851, nci: 2_079, saleSub: 11_550, saleGroup: 6_930, saleOwners: 4_851 });
  });
  it("the bond at amortized cost, at fair value, and its impairment", () => {
    assert.equal(BOND8.price, 94_802);
    assert.equal(BOND8.fairAt, 98_638);
    assert.deepEqual(BOND8.sub.map((r) => [r.interest, r.close]), [[5_688, 95_990], [5_759, 97_249], [5_835, 98_584], [5_916, 100_000]]);
    assert.deepEqual(BOND8.group.map((r) => [r.interest, r.close]), [[4_932, 99_070], [4_954, 99_524], [4_976, 100_000]]);
    assert.deepEqual(BOND8.group.map((g, i) => g.close - BOND8.sub[i + 1].close), [1_821, 940, 0]);
    assert.equal(BOND8.fairAt - BOND8.sub[0].close, 2_648);
    assert.deepEqual(BOND8_OCI, { sub: -3_259, group: -2_432, subReserve: -611, groupReserve: -2_432 });
    assert.deepEqual(IMPAIR8, { sub: 9_434, group: 9_524 });
  });
  it("the closing question", () => {
    assert.deepEqual(M8, { sharesSub: 13_860, sharesGroup: 4_620, sharesOwners: 3_696, subInterest: 3_325, groupInterest: 2_450, excessAt: 1_500, excessEnd: 625, adjusted: 119_125, nciProfit: 23_825, nciOci: 924, benefit: 6_000, nciEnd: 115_749 });
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "equity-share": 12_000, "ac-excess": 3_000, "ac-amort": 1_460, "equity-before": 3_850, "equity-sale": 4_312, "fvoci-adj": 700, "controller-nci": 15_000, "impair-group": 19_048, "ac-two": 2_300, "sub-adj-fin": 13_860, "controller-total": 60_000, "controller-b-nci": 8_000, "oci-same": 7_000, "fvoci-sale": 3_000 };
    const answer = (id: string) => (FINANCE.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(FINANCE.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
  });
});

describe("lesson 9: the sorting and the figures, against a separate calculation in Python", () => {
  it("eight preference shares to sort, both answers among them", () => {
    assert.equal(PREF_PROFIT.length, 8);
    assert.ok(PREF_PROFIT.some((x) => x.answer === "accrual") && PREF_PROFIT.some((x) => x.answer === "declared"));
  });
  it("the impairment, seen by the subsidiary and by the group", () => {
    assert.equal(IMP9.excessAt, 48_000);
    assert.deepEqual(IMP9.rows.map((r) => [r.subAc, r.groupAc, r.sub, r.group, r.excess]), [[105_000, 147_000, 105_000, 140_000, 35_000], [90_000, 126_000, 84_000, 84_000, 0], [75_000, 105_000, 75_000, 105_000, 30_000]]);
  });
  it("the deferred tax asset on the carried-forward loss", () => {
    assert.deepEqual([DTA9.liabilityAt, DTA9.liabilityEnd, DTA9.full], [11_040, 8_050, 46_000]);
    assert.deepEqual(DTA9.cases, [{ forecast: 0, subAsset: 0, group: 8_050, excess: 8_050 }, { forecast: 25_000, subAsset: 5_750, group: 8_050, excess: 2_300 }, { forecast: 90_000, subAsset: 20_700, group: 20_700, excess: 0 }]);
  });
  it("reporting dates and the preference screens", () => {
    assert.deepEqual(DATES9, { lossNet: 12_320, nciProfit: 11_920, dividendNci: 5_000 });
    assert.deepEqual(PREF9, { preference: 4_000, ordinary: 56_000, nci: 14_200, owners: 45_800 });
  });
  it("the closing question", () => {
    assert.deepEqual([M9.liability, M9.net, M9.ordinaryNet, M9.cost, M9.goodwill, M9.premium, M9.ownersGoodwill, M9.nciGoodwill], [14_720, 387_280, 295_280, 488_000, 100_720, 12_000, 78_540, 22_180]);
    assert.deepEqual(M9.split, { preference: 8_000, ordinary: 96_000, nci: 32_000, owners: 72_000 });
    assert.deepEqual([M9.prefEnd, M9.nciOrdinaryEnd, M9_NCI_END, M9.nonCumulativeNci], [100_000, 120_000, 220_000, 26_000]);
    assert.equal(M9_NCI_END, 96_000 + 92_000 + M9.split.nci);
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "pref-issue": 36_000, "dta-min": 12_650, "impair-group": 27_000, "impair-loss": 7_000, "reversal-cap": 88_000, "dta-higher": 16_100, "pref-accrual": 6_300, "nci-profit-pref": 37_410, noncum: 18_000, "pref-na-ordinary": 65_000, "goodwill-pref": 87_000, "pref-na-end": 88_000, "impair-excess-change": 23_100, "dates-nci": 15_690, "mixed-holding": 20_000 };
    const answer = (id: string) => (IMPAIRMENT.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(IMPAIRMENT.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
  });
});

describe("lesson 10: the sorting and the figures, against a separate calculation in Python", () => {
  it("eight transactions to sort, both answers among them", () => {
    assert.equal(DEFER10.length, 8);
    assert.ok(DEFER10.some((x) => x.answer === "defer") && DEFER10.some((x) => x.answer === "cancel"));
  });
  it("the inventory: unsold, sold the same year, and the next year", () => {
    assert.deepEqual(INV10, { profit: 24_000, cost: 96_000, gross: 24_000, tax: 5_520, net: 18_480, nci: 5_544, owners: 12_936 });
    assert.deepEqual(SAME10, { sellerTax: 5_520, buyerTax: 1_840, groupProfit: 32_000, groupTax: 7_360 });
    assert.deepEqual(PRIOR10, { opening: 18_480, left: 12_000, dta: 2_760, realized: 12_000, tax: 2_760, nciProfit: 2_772, nciEnd: -2_772 });
    assert.deepEqual(SPLIT10, { adjusted: 131_520, nci: 39_456, owners: 92_064, downNci: 45_000 });
  });
  it("a loss, a write-down, land, a machine and borrowing costs", () => {
    assert.equal(LOSS10.standardUp, 2_000);
    assert.deepEqual([WD10.buyer, WD10.group, WD10.adjust, WD10.tax, WD10.net, WD10.cogs], [63_000, 52_000, -11_000, 2_530, 8_470, 59_000]);
    assert.deepEqual([LAND10.gross, LAND10.tax, LAND10.net, LAND10.buyerGain, LAND10.groupGain, LAND10.loss.tax, LAND10.loss.net], [70_000, 16_100, 53_900, 30_000, 100_000, 8_050, 26_950]);
    assert.deepEqual(MACH10.map((r) => [r.group, r.buyer, r.unrealized]), [[132_000, 172_000, 40_000], [99_000, 129_000, 30_000], [66_000, 86_000, 20_000]]);
    assert.deepEqual([MACH10_FIG.y1.tax, MACH10_FIG.y1.net, MACH10_FIG.nci2025, MACH10_FIG.buyerGain, MACH10_FIG.groupGain], [6_900, 23_100, 6_930, 14_000, 34_000]);
    assert.deepEqual([BORROW10.interest, BORROW10.tax, BORROW10.net, BORROW10.dep, BORROW10.opening2027, BORROW10.left2027, BORROW10.dta2027, BORROW10.tax2027], [26_000, 5_980, 20_020, 2_600, 40_040, 49_400, 11_362, 598]);
    assert.equal(BORROW10.opening2027 + BORROW10.dta2027 + BORROW10.tax2027, BORROW10.left2027 + BORROW10.dep);
  });
  it("the closing question and the mistake", () => {
    assert.deepEqual([M10.inv.gross, M10.inv.tax, M10.inv.net, M10.land.tax, M10.land.net, M10.mach.gross, M10.mach.tax, M10.mach.net], [31_500, 7_245, 24_255, 10_350, 34_650, 21_000, 4_830, 16_170]);
    assert.deepEqual([M10.profit2025, M10.nci2025, M10.profit2025 - M10.nci2025], [411_095, 27_149, 383_946]);
    assert.deepEqual([M10.profit2026, M10.nci2026, M10.profit2026 - M10.nci2026, M10.dtaEnd], [508_085, 30_851, 477_234, 15_180]);
    assert.deepEqual(MISTAKE10, { student: 11_400, gross: 19_000, tax: 4_370, net: 14_630, nci: 5_852, owners: 8_778 });
  });
  it("calculations in the practice", () => {
    const expected: Record<string, number> = { "bal-interest": 20_000, "inv-dta": 8_280, "inv-partial": 8_000, "same-sales": 745_000, "prior-opening": 30_800, "nci-up": 46_150, "land-net": 50_050, "dep-left": 18_000, "wd-adjust": 8_000, "dep-sale": 15_000, "borrow-dep": 2_000, "nci-mixed": 30_460, "cons-profit": 354_600, "prior-realize": 33_930 };
    const answer = (id: string) => (INTERCOMPANY.exercises.find((x) => x.id === id) as { answer: number }).answer;
    for (const [id, want] of Object.entries(expected)) assert.equal(answer(id), want, id);
    assert.deepEqual(INTERCOMPANY.exercises.filter((x) => x.kind === "number").map((x) => x.id).sort(), Object.keys(expected).sort());
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
      assert.ok(seen.size > ({ partners: 1, present: 3, convert: 8, fundshare: 8, premium: 20, gwshare: 10, gwowners: 10 } as Record<string, number>)[family] || (!["partners", "present", "convert", "fundshare", "premium", "gwshare", "gwowners"].includes(family) && seen.size > 20), family);
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
