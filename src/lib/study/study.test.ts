import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupDigits, ungroup } from "@/lib/amount";
import { isBalanced, typeOf, type AccountType } from "@/lib/learn/basics";
import { BASICS_LESSONS, findScreen, LEGACY_CHAPTERS, legacyHref, screenHref } from "./basics";
import { TRANSLATIONS, twinProfit } from "./basics/intro";
import { STUDY_MODULES } from "./index";
import { INVENTORY_LEGACY_CHAPTERS, INVENTORY_LESSONS, inventoryLegacyHref } from "./inventory";
import { ET } from "./inventory/fifo";
import { grossProfitMethod, purchaseCost, valuateChain, valuatePeriod } from "@/lib/learn/inventory";
import { discountPctFromAmount, lastSaleQty, purchasesFromSoldPct, salesFromGp } from "@/lib/learn/inventory-solver";
import {
  checkEntry,
  clampPlace,
  EMPTY_TOPIC,
  markSeen,
  missedOf,
  maxXp,
  move,
  numberRight,
  PRACTICE_GROUPS,
  practiceAt,
  practiceOf,
  parseAmount,
  pathStatus,
  position,
  recordExercise,
  recordTrap,
  retryMissed,
  statusOf,
  STEPS,
  subCount,
  triesFor,
  type TopicProgress,
  XP,
  xpOf,
} from "./score";
import type { Exercise } from "./types";

const modules = Object.values(STUDY_MODULES);

describe("interactive lessons: the content", () => {
  it("every module sits under its own slug, and the basics lessons are numbered in order", () => {
    for (const [slug, m] of Object.entries(STUDY_MODULES)) assert.equal(m.slug, slug);
    BASICS_LESSONS.forEach((m, i) => assert.equal(m.n, i + 1, m.slug));
  });

  it("every lesson has concept screens, a practice section, traps and tips", () => {
    for (const m of modules) {
      assert.ok(m.screens.length > 0, `${m.slug}: no screens`);
      assert.ok(m.exercises.length >= 5, `${m.slug}: practice too short`);
      assert.ok(m.traps.length >= 2, `${m.slug}: too few traps`);
      assert.ok(m.tips.length >= 3, `${m.slug}: too few tips`);
    }
  });

  it("ids are unique: screens across the course, exercises and traps within a lesson", () => {
    const screens = modules.flatMap((m) => m.screens.map((s) => s.id));
    assert.equal(new Set(screens).size, screens.length, "a screen id repeats");
    for (const m of modules) {
      const ids = [...m.exercises.map((x) => x.id), ...m.traps.map((t) => t.id)];
      assert.equal(new Set(ids).size, ids.length, `${m.slug}: an id repeats`);
    }
  });

  it("every chapter of the former page has a home, and every concept chapter is a screen", () => {
    for (const id of LEGACY_CHAPTERS) assert.ok(legacyHref(id), `chapter ${id} has nowhere to go`);
    for (const id of LEGACY_CHAPTERS.filter((c) => c !== "practice" && c !== "summary")) assert.ok(findScreen(id), `chapter ${id} is not a screen`);
    assert.equal(screenHref("trial"), "/study/basics-books?screen=trial");
    assert.throws(() => screenHref("nope"));
  });

  it("journal exercises: every answer balances, uses only offered accounts, and every account has a type", () => {
    for (const m of modules)
      for (const ex of m.exercises) {
        if (ex.kind !== "journal") continue;
        const where = `${m.slug}/${ex.id}`;
        assert.ok(isBalanced(ex.entry), where);
        assert.ok(ex.entry.lines.every((l) => (l.dr ?? 0) > 0 !== (l.cr ?? 0) > 0), `${where}: a line must be one-sided and positive`);
        for (const l of ex.entry.lines) assert.ok(ex.accounts.includes(l.account), `${where}: ${l.account} not offered`);
        assert.equal(new Set(ex.accounts).size, ex.accounts.length, `${where}: an account is offered twice`);
        assert.ok(ex.accounts.length > new Set(ex.entry.lines.map((l) => l.account)).size, `${where}: no distractors`);
        ex.accounts.forEach(typeOf);
        assert.ok(ex.entry.why, `${where}: no explanation`);
      }
  });

  it("question exercises: valid answers and a worked solution", () => {
    for (const m of modules)
      for (const ex of m.exercises) {
        const where = `${m.slug}/${ex.id}`;
        if (ex.kind === "journal") continue;
        assert.ok(ex.prompt && ex.steps.length > 0, where);
        if (ex.kind === "choice") {
          assert.ok(Number.isInteger(ex.answer) && ex.answer >= 0 && ex.answer < ex.options.length, where);
          assert.equal(new Set(ex.options).size, ex.options.length, `${where}: options repeat`);
        }
        if (ex.kind === "number") assert.ok(Number.isFinite(ex.answer) && ex.answer > 0, where);
        if (ex.kind === "entry") assert.ok(ex.accounts.includes(ex.dr) && ex.accounts.includes(ex.cr) && ex.dr !== ex.cr, where);
      }
  });

  it("traps: a valid answer, distinct options, and an explanation for each wrong option only", () => {
    for (const m of modules)
      for (const t of m.traps) {
        const where = `${m.slug}/${t.id}`;
        assert.ok(t.answer >= 0 && t.answer < t.options.length, where);
        assert.equal(new Set(t.options).size, t.options.length, `${where}: options repeat`);
        assert.equal(t.traps.length, t.options.length, where);
        t.traps.forEach((x, i) => assert.equal(x === "", i === t.answer, `${where}, option ${i}`));
        assert.ok(t.why, where);
      }
  });
});

describe("interactive lessons: the accounting in the new questions", () => {
  const ex = (slug: string, id: string) => STUDY_MODULES[slug].exercises.find((x) => x.id === id)!;
  const answerOf = (x: Exercise) => (x.kind === "number" ? x.answer : x.kind === "choice" ? x.options[x.answer] : undefined);

  it("figures computed by hand agree with the lesson data", () => {
    // The studio's year: 96,000 sales − 30,000 rent − 18,000 materials; the 40,000 loan and the owner's 15,000 are not income.
    assert.equal(answerOf(ex("basics-intro", "year-profit")), 48_000);
    // The two studios on the grammar screen: one expenses the whole 15,000 kiln.
    assert.equal(twinProfit(15_000), 9_000);
    assert.equal(answerOf(ex("basics-double-entry", "liabilities-gap")), 147_000);
    assert.equal(answerOf(ex("basics-books", "suppliers-card")), "18,500 בזכות");
    assert.equal(answerOf(ex("basics-books", "retained-close")), 86_000);
    assert.equal(answerOf(ex("basics-books", "profit-to-retained")), 53_000);
    // Ronen after the adjustments: income 144,000 + 110,000 + 24,000; expenses 27,000 + 48,000 + 30,000.
  });

  it("the translator keeps the books in balance, and only income and expenses move the profit", () => {
    // Assets = liabilities + equity + (income − expenses), so the changes on the left and on the right must match.
    const left: AccountType[] = ["asset", "expense"];
    for (const t of TRANSLATIONS) {
      const net = t.changes.reduce((s, c) => s + (left.includes(typeOf(c.account)) ? c.by : -c.by), 0);
      assert.equal(net, 0, t.id);
    }
    const profitMove = (id: string) =>
      TRANSLATIONS.find((t) => t.id === id)!.changes.reduce((s, c) => s + (typeOf(c.account) === "income" ? c.by : typeOf(c.account) === "expense" ? -c.by : 0), 0);
    assert.deepEqual(["sale", "rent", "loan", "chat"].map(profitMove), [1_350, -4_800, 0, 0]);
  });

  it("year-end adjustments: the amounts and the sides", () => {
    const lines = (slug: string, id: string) => {
      const x = ex(slug, id);
      assert.equal(x.kind, "journal", id);
      return x.kind === "journal" ? x.entry.lines : [];
    };
    // Prepaid recorded as an asset: only the used months move to expense.
    assert.deepEqual(lines("basics-adjust", "prepaid-used"), [{ account: "הוצאות שכירות", dr: 4_000 }, { account: "הוצאות שכירות מראש", cr: 4_000 }]);
    // Recorded as an expense: next year's part moves out of it.
    assert.deepEqual(lines("basics-adjust", "prepaid-from-expense"), [{ account: "הוצאות אחסון מראש", dr: 3_600 }, { account: "הוצאות אחסון", cr: 3_600 }]);
    assert.deepEqual(lines("basics-adjust", "accrued-interest"), [{ account: "הוצאות ריבית", dr: 2_500 }, { account: "הוצאות ריבית לשלם", cr: 2_500 }]);
    assert.deepEqual(lines("basics-adjust", "closing-stock"), [{ account: "מלאי סגירה מאזני", dr: 59_500 }, { account: "מלאי סגירה רווח או הפסד", cr: 59_500 }]);
  });

  it("lesson 4 is practised mostly by writing entries, and credit losses have a lesson of their own", () => {
    const m = STUDY_MODULES["basics-adjust"];
    const entries = m.exercises.filter((x) => x.kind === "journal").length;
    const choice = m.exercises.filter((x) => x.kind === "choice").length + m.traps.length;
    assert.ok(entries >= 10 && choice <= 2, `${entries} entries, ${choice} multiple-choice`);
    assert.ok(!m.screens.some((s) => s.id === "creditloss"));
    for (const mod of modules.filter((x) => x.slug !== "basics-credit"))
      for (const x of mod.exercises)
        if (x.kind === "journal") for (const l of x.entry.lines) assert.ok(!l.account.includes("הפרשה"), `${mod.slug}: ${x.id}`);
  });

  it("credit losses: lesson 7, practised mostly by writing entries, with the amounts worked out by hand", () => {
    const m = STUDY_MODULES["basics-credit"];
    assert.equal(m.n, 7);
    const entries = m.exercises.filter((x) => x.kind === "journal").length;
    const choice = m.exercises.filter((x) => x.kind === "choice").length + m.traps.length;
    assert.ok(entries >= 6 && choice <= 2, `${entries} entries, ${choice} multiple-choice`);
    const lines = (id: string) => {
      const x = ex("basics-credit", id);
      return x.kind === "journal" ? x.entry.lines : [];
    };
    const ALLOW = "הפרשה להפסדי אשראי חזויים";
    const EXPENSE = "הוצאות הפסדי אשראי";
    assert.deepEqual(lines("first-allowance"), [{ account: EXPENSE, dr: 13_000 }, { account: ALLOW, cr: 13_000 }]);
    assert.deepEqual(lines("write-off"), [{ account: ALLOW, dr: 5_500 }, { account: "לקוחות", cr: 5_500 }]);
    // 5% of 708,000 required; the write-offs left the allowance 5,000 in debit.
    assert.deepEqual(lines("top-up"), [{ account: EXPENSE, dr: 40_400 }, { account: ALLOW, cr: 40_400 }]);
    // Customers 630,000: 21,000 specific + 4% of 595,000 = 44,800 required, 18,000 there.
    assert.deepEqual(lines("specific"), [{ account: EXPENSE, dr: 26_800 }, { account: ALLOW, cr: 26_800 }]);
    // 42,300 required, 55,000 there: 12,700 reversed.
    assert.deepEqual(lines("reversal"), [{ account: ALLOW, dr: 12_700 }, { account: EXPENSE, cr: 12_700 }]);
    // Customers 372,000 → 18,600 required; 14,000 − 8,000 + 1,500 = 7,500 there.
    assert.deepEqual(lines("with-recovery"), [{ account: EXPENSE, dr: 11_100 }, { account: ALLOW, cr: 11_100 }]);
    assert.equal(answerOf(ex("basics-credit", "closing-gross")), 708_000);
    assert.equal(answerOf(ex("basics-credit", "net-customers")), 268_800);
    assert.equal(answerOf(ex("basics-credit", "gross-from-net")), 475_000);
    assert.equal(answerOf(ex("basics-credit", "collections")), 905_000);
    assert.equal(answerOf(ex("basics-credit", "opening-allowance")), 39_000);
  });

  it("lesson 6's practice is multiple choice only — the worksheet itself is practised in its games", () => {
    const m = STUDY_MODULES["basics-final"];
    assert.ok(m.exercises.every((x) => x.kind === "choice"), m.exercises.map((x) => `${x.id}:${x.kind}`).join());
  });

  it("a lesson's tools open screens it has: the credit-loss calculator straight from the course page", () => {
    for (const m of modules) for (const t of m.tools ?? []) assert.ok(m.screens.some((s) => s.id === t.screen), `${m.slug}: no screen ${t.screen}`);
    assert.deepEqual(STUDY_MODULES["basics-credit"].tools?.map((t) => t.screen), ["cl-calc"]);
  });
});

describe("interactive lessons: the rules", () => {
  const m = STUDY_MODULES["basics-double-entry"];
  // A compound entry of the lesson, and a two-way question (the rule is the point, not the content).
  const journal = m.exercises.find((x) => x.id === "furniture")!;
  const binary: Exercise = { kind: "choice", id: "two-way", skill: "", prompt: "", options: ["השקעה", "הוצאה"], answer: 0, steps: [] };

  it("checks an entry by account and side, whatever the order of the lines", () => {
    assert.equal(journal.kind, "journal");
    if (journal.kind !== "journal") return;
    const e = journal.entry;
    assert.deepEqual(checkEntry(e, [...e.lines].reverse()), { ok: true, wrong: [] });
    const flipped = e.lines.map((l) => ({ account: l.account, dr: l.cr, cr: l.dr }));
    assert.deepEqual(checkEntry(e, flipped).wrong.sort(), e.lines.map((l) => l.account).sort());
    assert.deepEqual(checkEntry(e, [...e.lines, { account: "מזומן", dr: 1 }]).wrong, ["מזומן"]);
  });

  it("reads typed amounts with commas, spaces and ₪, and accepts rounding within half a shekel", () => {
    assert.equal(parseAmount("12,000 ₪"), 12_000);
    assert.ok(Number.isNaN(parseAmount("")) && Number.isNaN(parseAmount("abc")));
    assert.ok(numberRight(9_000, " 9,000") && numberRight(12_000, "12000.4") && !numberRight(12_000, "12001"));
    assert.ok(!numberRight(0.4, ""), "an empty answer is never right");
  });

  it("two tries, except for a two-way choice; done when right or out of tries", () => {
    assert.equal(triesFor(binary), 1);
    assert.equal(triesFor(journal), 2);
    const once = recordExercise(EMPTY_TOPIC, journal, false);
    assert.deepEqual(once.exercises[journal.id], { tries: 1, ok: false, done: false });
    const twice = recordExercise(once, journal, false);
    assert.deepEqual(twice.exercises[journal.id], { tries: 2, ok: false, done: true });
    assert.equal(recordExercise(twice, journal, true), twice, "a done exercise doesn't change");
    assert.deepEqual(recordExercise(EMPTY_TOPIC, binary, false).exercises[binary.id], { tries: 1, ok: false, done: true });
  });

  it("the streak counts right answers in a row and keeps the best", () => {
    let p = recordTrap(EMPTY_TOPIC, "a", 0, true);
    p = recordExercise(p, journal, true);
    assert.equal(p.streak, 2);
    p = recordTrap(p, "b", 1, false);
    assert.deepEqual([p.streak, p.best], [0, 2]);
    assert.equal(recordTrap(p, "b", 0, true), p, "only the first answer counts");
  });

  it("XP: screens read, first or second try, and traps; the maximum adds up", () => {
    let p = markSeen(markSeen(EMPTY_TOPIC, 0), 0);
    p = markSeen(p, 99);
    p = recordExercise(p, journal, true);
    p = recordExercise(recordExercise(p, m.exercises[0], false), m.exercises[0], true);
    p = recordTrap(p, m.traps[0].id, m.traps[0].answer, true);
    assert.equal(xpOf(m, p), XP.screen + XP.first + XP.second + XP.trap, "a screen counts once, and only screens of the lesson");
    assert.equal(maxXp(m), m.screens.length * XP.screen + m.exercises.length * XP.first + m.traps.length * XP.trap);
  });

  it("a lesson is new, started, then done when every exercise and trap is answered", () => {
    assert.equal(statusOf(m, EMPTY_TOPIC), "new");
    assert.equal(statusOf(m, { ...EMPTY_TOPIC, step: 1 }), "started");
    let p = EMPTY_TOPIC;
    for (const x of m.exercises) p = recordExercise(recordExercise(p, x, false), x, false);
    assert.equal(statusOf(m, p), "started");
    for (const t of m.traps) p = recordTrap(p, t.id, 0, t.answer === 0);
    assert.equal(statusOf(m, p), "done");
  });

  it("next and previous walk every screen once, in order, and stop at the ends — in every lesson", () => {
    for (const mod of modules) {
      const total = STEPS.reduce((s, _, i) => s + subCount(mod, i), 0);
      let at = { step: 0, sub: 0 };
      for (let k = 1; k <= total; k++) {
        assert.equal(position(mod, at).at, k, mod.slug);
        at = move(mod, at, 1);
      }
      assert.deepEqual(at, { step: STEPS.length - 1, sub: 0 });
      assert.deepEqual(move(mod, { step: 2, sub: 0 }, -1), { step: 1, sub: mod.exercises.length + mod.traps.length });
      assert.deepEqual(move(mod, { step: 0, sub: 0 }, -1), { step: 0, sub: 0 });
    }
  });

  it("a stored place outside the lesson is pulled back inside it", () => {
    assert.deepEqual(clampPlace(m, { step: 9, sub: 9 }), { step: 2, sub: 0 });
    assert.deepEqual(clampPlace(m, { step: 1, sub: 99 }), { step: 1, sub: m.exercises.length + m.traps.length });
    assert.deepEqual(clampPlace(m, { step: -1, sub: -1 }), { step: 0, sub: 0 });
  });

  it("the practice opens on a screen of its own, between the last concept and the first exercise — in every lesson", () => {
    for (const mod of modules) {
      const lastConcept = { step: 0, sub: mod.screens.length - 1 };
      const opening = move(mod, lastConcept, 1);
      assert.deepEqual(opening, { step: 1, sub: 0 }, mod.slug);
      assert.equal(practiceAt(mod, opening.sub), undefined, mod.slug);
      assert.deepEqual(practiceAt(mod, move(mod, opening, 1).sub), practiceOf(mod)[0], mod.slug);
    }
  });

  it("the practice holds every exercise and every multiple-choice question that explains its options, each once, grouped by kind — in every lesson", () => {
    for (const mod of modules) {
      const items = Array.from({ length: subCount(mod, 1) }, (_, sub) => practiceAt(mod, sub)).filter((x) => x !== undefined);
      const ids = items.map((it) => (it.kind === "exercise" ? it.ex.id : it.trap.id));
      assert.deepEqual([...ids].sort(), [...mod.exercises.map((x) => x.id), ...mod.traps.map((t) => t.id)].sort(), mod.slug);
      // One run per group, in the groups' order.
      const runs = items.map((it) => PRACTICE_GROUPS.indexOf(it.group)).filter((g, i, a) => i === 0 || a[i - 1] !== g);
      assert.deepEqual(runs, [...runs].sort((a, b) => a - b), mod.slug);
      assert.equal(new Set(runs).size, runs.length, mod.slug);
      for (const it of items) {
        if (it.kind === "trap") assert.equal(it.group.id, "choice", mod.slug);
        else if (it.ex.kind === "journal" || it.ex.kind === "entry") assert.equal(it.group.id, "journal", `${mod.slug}: ${it.ex.id}`);
        else assert.equal(it.group.id, it.ex.kind, `${mod.slug}: ${it.ex.id}`);
      }
    }
  });

  it("there is no separate traps step: the lesson is concepts, practice, summary", () => {
    assert.deepEqual(
      STEPS.map((s) => s.id),
      ["learn", "practice", "summary"],
    );
  });
});

describe("interactive lessons: skipping a lesson on the course path", () => {
  const m = STUDY_MODULES["basics-intro"];

  it("a skipped lesson is passed over until it is done, and a done lesson stays done", () => {
    assert.equal(pathStatus(m, EMPTY_TOPIC), "new");
    assert.equal(pathStatus(m, { ...EMPTY_TOPIC, skipped: true }), "skipped");
    assert.equal(pathStatus(m, { ...EMPTY_TOPIC, step: 1, skipped: true }), "skipped");
    assert.equal(pathStatus(m, { ...EMPTY_TOPIC, step: 1, skipped: false }), "started");
    let p: TopicProgress = { ...EMPTY_TOPIC, skipped: true };
    for (const ex of m.exercises) p = recordExercise(recordExercise(p, ex, false), ex, false);
    for (const t of m.traps) p = recordTrap(p, t.id, 0, t.answer === 0);
    assert.equal(pathStatus(m, p), "done");
  });

  it("skipping touches nothing else: no XP and no progress are lost or gained", () => {
    assert.equal(statusOf(m, { ...EMPTY_TOPIC, skipped: true }), "new");
    assert.equal(xpOf(m, { ...EMPTY_TOPIC, skipped: true }), 0);
  });
});

describe("amount fields: thousands separators as you type", () => {
  it("groups the whole part, keeps a point and a minus, and drops anything else", () => {
    assert.equal(groupDigits("1000"), "1,000");
    assert.equal(groupDigits("1234567.5"), "1,234,567.5");
    assert.equal(groupDigits("12,0000"), "120,000");
    assert.equal(groupDigits("-2500"), "-2,500");
    assert.equal(groupDigits("4."), "4.");
    assert.equal(groupDigits("₪ 30 000"), "30,000");
    assert.equal(groupDigits(""), "");
    assert.equal(ungroup("1,234,567.5"), "1234567.5");
  });

  it("what is shown still reads back as the same number", () => {
    for (const v of ["1000", "999", "1234567.25", "-45000"]) assert.equal(parseAmount(groupDigits(v)), Number(v));
  });
});

describe("interactive lessons: trying the missed questions again", () => {
  const m = STUDY_MODULES["basics-double-entry"];
  const items = practiceOf(m);
  const first = items[0];
  const second = items[1];

  it("missed means never answered or answered wrong; a right answer is not missed", () => {
    assert.equal(missedOf(m, EMPTY_TOPIC).length, items.length);
    let p: TopicProgress = EMPTY_TOPIC;
    assert.equal(first.kind, "exercise");
    assert.equal(second.kind, "exercise");
    if (first.kind !== "exercise" || second.kind !== "exercise") return;
    p = recordExercise(p, first.ex, true);
    p = recordExercise(recordExercise(p, second.ex, false), second.ex, false);
    const missed = missedOf(m, p).map((x) => x.id);
    assert.ok(!missed.includes(first.ex.id));
    assert.ok(missed.includes(second.ex.id));
    assert.deepEqual(missedOf(m, p)[0], { id: second.ex.id, sub: 2 });
  });

  it("trying again clears only the missed answers: the solved ones and their XP stay", () => {
    if (first.kind !== "exercise" || second.kind !== "exercise") return;
    let p: TopicProgress = recordExercise(EMPTY_TOPIC, first.ex, true);
    p = recordExercise(recordExercise(p, second.ex, false), second.ex, false);
    const xp = xpOf(m, p);
    const again = retryMissed(m, p);
    assert.deepEqual(again.retry, missedOf(m, p).map((x) => x.id));
    assert.equal(again.exercises[second.ex.id], undefined);
    assert.deepEqual(again.exercises[first.ex.id], p.exercises[first.ex.id]);
    assert.equal(xpOf(m, again), xp);
  });
});

describe("interactive lessons: what each lesson practises", () => {
  const answerAccounts = (slug: string) => STUDY_MODULES[slug].exercises.flatMap((x) => (x.kind === "journal" ? x.entry.lines.map((l) => l.account) : []));

  it("lesson 2 records the events settled on the spot and those whose money moves at another time: credit, advances, a loan", () => {
    const two = answerAccounts("basics-double-entry");
    for (const a of ["הון בעלים", "לקוחות", "ספקים", "מקדמות מלקוחות", "הלוואה"]) assert.ok(two.includes(a), `lesson 2 never practises ${a}`);
  });

  it("lesson 2 is mostly writing entries: no more than four multiple-choice questions", () => {
    const m = STUDY_MODULES["basics-double-entry"];
    const choice = m.exercises.filter((x) => x.kind === "choice").length + m.traps.length;
    assert.ok(choice <= 4, `${choice} multiple-choice questions`);
    assert.ok(m.exercises.filter((x) => x.kind === "journal").length >= 10);
  });

  it("the whole cash business comes before credit, and the common entries close the lesson", () => {
    const ids = STUDY_MODULES["basics-double-entry"].screens.map((s) => s.id);
    assert.ok(ids.indexOf("lab") < ids.indexOf("credit"));
    assert.equal(ids.at(-1), "actions");
  });
});

describe("interactive lessons: amounts sorted by hand", () => {
  it("a trial balance to complete balances with its answer on the missing line; a T-account's closing balance is its sides' difference", () => {
    let seen = 0;
    for (const m of modules)
      for (const x of m.exercises) {
        if (x.kind !== "number" || !x.table) continue;
        seen++;
        if (x.table.kind === "trial") {
          assert.ok(!(x.table.missing in x.table.balances), `${m.slug}: ${x.id} gives the missing line`);
          const sum = Object.values(x.table.balances).reduce((s, v) => s + v, 0) + x.answer;
          assert.ok(Math.abs(sum) < 0.005, `${m.slug}: ${x.id} does not balance (${sum})`);
        } else {
          const net = x.table.items.reduce((s, i) => s + (i.side === "dr" ? i.amount : -i.amount), 0);
          assert.equal(net, x.answer, `${m.slug}: ${x.id}`);
        }
      }
    assert.ok(seen >= 2, "both boards are in the course");
  });
});

describe("the inventory course", () => {
  const answer = (slug: string, id: string) => {
    const x = STUDY_MODULES[slug].exercises.find((e) => e.id === id);
    assert.ok(x && x.kind === "number", `${slug}: no calculation ${id}`);
    return x.answer;
  };
  const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 1e-6, `${where}: ${a} ≠ ${b}`);

  it("twelve lessons, numbered in order, all on the inventory page", () => {
    assert.equal(INVENTORY_LESSONS.length, 12);
    INVENTORY_LESSONS.forEach((m, i) => {
      assert.equal(m.n, i + 1, m.slug);
      assert.equal(m.backHref, "/basics/inventory", m.slug);
      assert.equal(STUDY_MODULES[m.slug], m);
    });
  });

  it("every chapter of the former page lands on a screen; the tools chapter on the calculator", () => {
    for (const id of INVENTORY_LEGACY_CHAPTERS) assert.ok(inventoryLegacyHref(id), `chapter ${id} has nowhere to go`);
    assert.equal(inventoryLegacyHref("inv-tools"), "/study/inventory-worksheet?screen=inv-calc");
    assert.equal(inventoryLegacyHref("inv-fifo"), "/study/inventory-fifo?screen=inv-fifo");
    assert.deepEqual(STUDY_MODULES["inventory-worksheet"].tools, [{ screen: "inv-calc", label: "מחשבון מלאי" }]);
  });

  it("lesson 4's costs agree with the engine", () => {
    const imported = purchaseCost({
      qty: 500,
      unitPrice: 40,
      discounts: [{ kind: "qty-whole", threshold: 0, pct: 0.05 }],
      extras: [
        { category: "duty", label: "מכס", amount: 0.1, basis: "pct-of-net-price" },
        { category: "freight", label: "הובלה", amount: 1_000, basis: "per-shipment" },
        { category: "storage", label: "אחסון", amount: 600, basis: "per-shipment" },
      ],
    });
    near(answer("inventory-cost", "import-cost"), imported.total, "import-cost");
    near(answer("inventory-cost", "financing-cost"), purchaseCost({ qty: 200, unitPrice: 100, financingPct: 0.05 }).total, "financing-cost");
    near(answer("inventory-cost", "per-kg"), purchaseCost({ qty: 600, unitPrice: 35, extras: [{ category: "freight", amount: 0.25, basis: "per-kg", kgPerUnit: 12 }] }).total, "per-kg");
    const set = purchaseCost({
      qty: 120,
      unitPrice: 6 * 12 + 6 * 18,
      discounts: [{ kind: "qty-whole", threshold: 100, pct: 0.05 }],
      extras: [
        { category: "freight", amount: 1_800, basis: "per-shipment" },
        { category: "freight", amount: 4, basis: "per-unit" },
      ],
    });
    near(answer("inventory-cost", "set-cost"), set.perUnit, "set-cost");
  });

  it("lesson 5's discounts agree with the engine", () => {
    near(answer("inventory-discounts", "excess-discount"), purchaseCost({ qty: 1_200, unitPrice: 20, discounts: [{ kind: "qty-excess", threshold: 1_000, pct: 0.1 }] }).total, "excess");
    const tiered = purchaseCost({
      qty: 10_000,
      unitPrice: 40,
      discounts: [
        { kind: "qty-whole", threshold: 5_000, pct: 0.1 },
        { kind: "per-unit-above", afterUnit: 8_000, amountPerUnit: 6 },
      ],
    });
    near(answer("inventory-discounts", "tiered"), tiered.total, "tiered");
    const order = purchaseCost({
      qty: 5_000,
      unitPrice: 10,
      discounts: [{ kind: "qty-whole", threshold: 0, pct: 0.08 }],
      extras: [
        { category: "duty", amount: 0.05, basis: "pct-of-net-price" },
        { category: "freight", amount: 1_000, basis: "per-shipment" },
      ],
    });
    near(answer("inventory-discounts", "discount-order"), order.total, "order");
    const year = valuatePeriod(
      { label: "2025", opening: { units: 230, cost: 0 }, purchases: [], sales: [{ qty: 80, unitPrice: 30 }, { qty: 150, unitPrice: 30 }], saleDiscount: { threshold: 100, pct: 0.1 } },
      "fifo",
    );
    near(answer("inventory-discounts", "customer-net"), year.netSales, "customer-net");
  });

  it("lessons 6 and 7's pen shop comes out the same in the engine, by every method", () => {
    const year = {
      label: "2025",
      purchases: [
        { date: "2025-02-01", qty: ET.buy1.qty, unitPrice: ET.buy1.price },
        { date: "2025-06-01", qty: ET.buy2.qty, unitPrice: ET.buy2.price },
      ],
      sales: [
        { date: "2025-04-01", qty: ET.sell1.qty },
        { date: "2025-09-01", qty: ET.sell2.qty },
      ],
    };
    const fifo = valuatePeriod(year, "fifo", { system: "perpetual" });
    const wa = valuatePeriod(year, "wa-periodic");
    const ma = valuatePeriod(year, "moving-avg");
    near(answer("inventory-fifo", "fifo-closing"), fifo.closingCarrying, "fifo-closing");
    near(answer("inventory-fifo", "fifo-cogs"), fifo.cogs, "fifo-cogs");
    near(answer("inventory-fifo", "fifo-sale2"), fifo.saleCosts[1], "fifo-sale2");
    near(answer("inventory-average", "wa-avg"), wa.avgCost!, "wa-avg");
    near(answer("inventory-average", "wa-cogs"), wa.cogs, "wa-cogs");
    near(answer("inventory-average", "ma-sale-cost"), ma.cogs - ET.sell1.qty * ET.buy1.price, "ma-sale-cost");
    for (const r of [fifo, wa, ma]) assert.deepEqual(r.warnings, []);
    const avg = valuatePeriod({ label: "2025", opening: { units: 200, cost: 2_000 }, purchases: [{ qty: 200, unitPrice: answer("inventory-unknowns", "price-from-avg") }], sales: [] }, "wa-periodic");
    near(avg.avgCost!, 12, "price-from-avg");
  });

  it("lesson 8's write-down and its reversal agree with the engine", () => {
    const down = valuatePeriod({ label: "2025", opening: { units: 400, cost: 10_000 }, purchases: [], sales: [], nrvPerUnit: 21 }, "fifo");
    near(answer("inventory-nrv", "writedown"), down.writeDown, "writedown");
    const [, after] = valuateChain(
      [
        { label: "2025", opening: { units: 300, cost: 15_000 }, purchases: [], sales: [], nrvPerUnit: 40 },
        { label: "2026", purchases: [], sales: [], nrvPerUnit: 58 },
      ],
      "fifo",
      { carryWriteDown: true },
    );
    near(answer("inventory-nrv", "reversal"), after.reversal, "reversal");
    near(answer("inventory-nrv", "nrv-table"), valuatePeriod({ label: "2025", opening: { units: 1_000, cost: 45_000 }, purchases: [], sales: [], nrvPerUnit: 42 }, "fifo").closingCarrying, "nrv-table");
  });

  it("lesson 9's unknowns agree with the solver", () => {
    near(answer("inventory-unknowns", "sales-from-gp"), salesFromGp(84_000, 0.3), "sales-from-gp");
    near(answer("inventory-unknowns", "last-sale"), lastSaleQty(3_000, 350, 1_900), "last-sale");
    near(answer("inventory-unknowns", "retail-closing"), grossProfitMethod({ netSales: 150_000, rate: 0.4, opening: 30_000, purchases: 90_000 }).closing, "retail-closing");
    near(answer("inventory-unknowns", "purchases-from-pct"), purchasesFromSoldPct(180_000, 0.6), "purchases-from-pct");
    near(answer("inventory-unknowns", "discount-rate"), discountPctFromAmount(2_400, 400, 75) * 100, "discount-rate");
  });

  it("lesson 10's fire questions: the figures a reader can check by hand", () => {
    near(answer("inventory-fire", "roll"), 46_000, "roll");
    near(answer("inventory-fire", "two-rates"), 60_400, "two-rates");
    near(answer("inventory-fire", "saved-price"), 7_500, "saved-price");
    near(answer("inventory-fire", "pct-deductible"), 34_000, "pct-deductible");
    near(answer("inventory-fire", "fixed-cap"), 50_000, "fixed-cap");
    near(answer("inventory-fire", "policy-fifo"), 1_900, "policy-fifo");
  });

  it("lesson 12's answers are the exam questions' own", () => {
    near(answer("inventory-exams", "ofek-opening"), 400_000, "opening");
    near(answer("inventory-exams", "ofek-claim"), 450_000, "claim");
    near(answer("inventory-exams", "mishak-closing"), 21_150, "closing");
    near(answer("inventory-exams", "mishak-box"), 239, "box");
  });
});

describe("the inventory course: the staged solutions agree with the engine", () => {
  it("FIFO sale by sale, and the moving-average stock card, come to the engine's closing stock and cost of sales", async () => {
    const s = await import("@/components/basics/inventory-stages");
    const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 0.005, `${where}: ${a} ≠ ${b}`);
    near(s.FIFO_PERPETUAL_CLOSING, s.FIFO_T.closingCostBasis, "FIFO perpetual closing");
    near(s.FIFO_PERPETUAL_COGS, s.FIFO_T.cogs, "FIFO perpetual cost of sales");
    near(s.FIFO_PERPETUAL_CLOSING, s.FIFO.closingCostBasis, "FIFO is the same in both systems");
    near(s.MA_CLOSING, s.MA.closingCostBasis, "moving average closing");
    near(s.MA_COGS, s.MA.cogs, "moving average cost of sales");
    for (const steps of [s.FIFO_PERIODIC_STEPS, s.FIFO_PERPETUAL_STEPS, s.WA_STEPS, s.MA_STEPS]) assert.ok(steps.length >= 6);
  });
});

describe("interactive lessons: a lesson's video", () => {
  it("the file is on the site, its chapters are in order inside it, and a chapter's screen is one of the lesson's", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    // The basics course's videos were withdrawn while the course is rebuilt; any lesson that has one is still checked.
    const withVideo = modules.filter((m) => m.videos?.length);
    for (const m of withVideo) {
      for (const v of m.videos!) {
        assert.ok(existsSync(join(process.cwd(), "public", v.src)), `${m.slug}: no file at public${v.src}`);
        v.chapters.forEach((c, i) => {
          assert.ok(c.at >= 0 && c.at < v.duration, `${m.slug}: chapter ${c.title} outside the video`);
          if (i) assert.ok(c.at > v.chapters[i - 1].at, `${m.slug}: chapters out of order at ${c.title}`);
          for (const id of [c.screen ?? []].flat()) assert.ok(m.screens.some((s) => s.id === id), `${m.slug}: no screen ${id}`);
        });
      }
      // A screen opens one moment, in one part.
      const screens = m.videos!.flatMap((v) => v.chapters.flatMap((c) => [c.screen ?? []].flat()));
      assert.equal(new Set(screens).size, screens.length, `${m.slug}: a screen has two chapters`);
    }
  });
});

describe("the inventory course: the method drills and the new practice agree with the engine", () => {
  it("each drill's answers are the engine's", async () => {
    const d = await import("./inventory/drills");
    const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 1e-6, `${where}: ${a} ≠ ${b}`);
    const fifo = valuatePeriod({ label: "d", purchases: d.FIFO_DRILL.buys.map((b) => ({ qty: b.qty, unitPrice: b.price })), sales: [{ qty: d.FIFO_DRILL.sold }] }, "fifo");
    near(d.FIFO_DRILL_ANSWERS.closing, fifo.closingCarrying, "fifo closing");
    near(d.FIFO_DRILL_COGS, fifo.cogs, "fifo cogs");
    const S = d.SHELF_DRILL;
    const shelf = valuatePeriod(
      {
        label: "d",
        purchases: [
          { date: "2025-02-01", qty: S.buy1.qty, unitPrice: S.buy1.price },
          { date: "2025-06-01", qty: S.buy2.qty, unitPrice: S.buy2.price },
        ],
        sales: [
          { date: "2025-04-01", qty: S.sell1 },
          { date: "2025-08-01", qty: S.sell2 },
        ],
      },
      "fifo",
      { system: "perpetual" },
    );
    near(d.SHELF_DRILL_ANSWERS.sale1, shelf.saleCosts[0], "sale 1");
    near(d.SHELF_DRILL_ANSWERS.sale2, shelf.saleCosts[1], "sale 2");
    near(d.SHELF_DRILL_ANSWERS.closing, shelf.closingCarrying, "shelf closing");
    const W = d.WA_DRILL;
    const wa = valuatePeriod({ label: "d", opening: { units: W.opening.qty, cost: W.opening.cost }, purchases: W.buys.map((b) => ({ qty: b.qty, unitPrice: b.price })), sales: [{ qty: W.sold }] }, "wa-periodic");
    near(d.WA_DRILL_ANSWERS.avg, wa.avgCost!, "wa average");
    near(d.WA_DRILL_ANSWERS.closing, wa.closingCarrying, "wa closing");
    const M = d.MA_DRILL;
    const ma = valuatePeriod(
      {
        label: "d",
        purchases: [
          { date: "2025-01-01", qty: M.buy1.qty, unitPrice: M.buy1.price },
          { date: "2025-05-01", qty: M.buy2.qty, unitPrice: M.buy2.price },
        ],
        sales: [
          { date: "2025-03-01", qty: M.sell1 },
          { date: "2025-08-01", qty: M.sell2 },
        ],
      },
      "moving-avg",
    );
    near(d.MA_DRILL_ANSWERS.cogs, ma.cogs, "ma cogs");
    near(d.MA_DRILL_ANSWERS.closing, ma.closingCarrying, "ma closing");
  });

  it("the new FIFO and average questions", () => {
    const answer = (slug: string, id: string) => {
      const x = STUDY_MODULES[slug].exercises.find((e) => e.id === id);
      assert.ok(x && x.kind === "number", `${slug}: no calculation ${id}`);
      return x.answer;
    };
    const fifo = valuatePeriod({ label: "q", opening: { units: 40, cost: 320 }, purchases: [{ qty: 60, unitPrice: 9 }, { qty: 50, unitPrice: 10 }, { qty: 30, unitPrice: 12 }], sales: [{ qty: 110 }] }, "fifo");
    assert.equal(answer("inventory-fifo", "fifo-three"), fifo.closingCarrying);
    const wa = valuatePeriod({ label: "q", opening: { units: 50, cost: 500 }, purchases: [{ qty: 100, unitPrice: 11 }, { qty: 50, unitPrice: 13 }], sales: [{ qty: 140 }] }, "wa-periodic");
    assert.equal(answer("inventory-average", "wa-closing-open"), wa.closingCarrying);
  });
});
