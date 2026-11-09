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
import { AGENT_TEST, AGENT_TEST_START, AGENTS, FUND_LARGE, FUND_SMALL, MASTER3_POSITION, MASTER3_REWARD, MASTER3_SISTER, MASTER3_TOGETHER, RETURNS, RETURNS_TAUGHT } from "./consolidated/lessons/returns";
import { CASES, EXEMPT_TEST, EXEMPT_TEST_START, MASTER_POSITION, MASTER_PROFIT, MASTER_SEPARATE, STORY_POSITION, STORY_PROFIT, STORY_SEPARATE, WHAT, WHAT_TAUGHT } from "./consolidated/lessons/what";
import { type ConsolidatedQuestion, LESSON_N } from "./consolidated/shared";
import { ltrFormulas } from "./ias19/ltr";

/** What teaches each question, lesson by lesson. */
const TAUGHT: Record<string, Record<string, string>> = { "consolidated-what": WHAT_TAUGHT, "consolidated-control": CONTROL_TAUGHT, "consolidated-returns": RETURNS_TAUGHT };

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
      assert.ok(seen.size > ({ partners: 1, present: 3, convert: 8, fundshare: 8 } as Record<string, number>)[family] || (!["partners", "present", "convert", "fundshare"].includes(family) && seen.size > 20), family);
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
