import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, typeOf, type AccountType } from "@/lib/learn/basics";
import { BASICS_LESSONS, findScreen, LEGACY_CHAPTERS, legacyHref, screenHref } from "./basics";
import { TRANSLATIONS, twinProfit } from "./basics/intro";
import { STUDY_MODULES } from "./index";
import {
  checkEntry,
  clampPlace,
  EMPTY_TOPIC,
  markSeen,
  maxXp,
  move,
  numberRight,
  parseAmount,
  position,
  recordExercise,
  recordTrap,
  statusOf,
  STEPS,
  subCount,
  triesFor,
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
      assert.ok(m.traps.length >= 4, `${m.slug}: too few traps`);
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
    // The bakery: 50,000 sales − 30,000 other − a 12,000 computer over 3 years (4,000 a year).
    assert.equal(answerOf(ex("basics-intro", "twins-profit")), 16_000);
    assert.equal(twinProfit(12_000), 8_000);
    assert.equal(answerOf(ex("basics-intro", "loan-profit")), "לא משתנה");
    assert.equal(answerOf(ex("basics-double-entry", "liabilities-gap")), 230_000);
    assert.equal(answerOf(ex("basics-books", "suppliers-card")), "14,000 בזכות");
    assert.equal(answerOf(ex("basics-books", "retained-close")), 55_000);
    assert.equal(answerOf(ex("basics-books", "closing-retained")), "ז׳ עודפים 40,000");
    assert.equal(answerOf(ex("basics-adjust", "lower-of")), "72,000");
    assert.equal(answerOf(ex("basics-final", "net-customers")), 291_000);
    // Ronen after the adjustments: income 144,000 + 110,000 + 24,000; expenses 27,000 + 48,000 + 30,000.
    assert.equal(answerOf(ex("basics-final", "ronen-profit")), 173_000);
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
    assert.deepEqual(["sale", "rent", "loan", "chat"].map(profitMove), [1_200, -4_000, 0, 0]);
  });

  it("the closing entry closes every result account and credits the profit to retained earnings", () => {
    const close = ex("basics-final", "close-year");
    assert.equal(close.kind, "journal");
    if (close.kind !== "journal") return;
    assert.deepEqual(close.entry.lines, [
      { account: "מכירות", dr: 90_000 },
      { account: "הוצאות שכר", cr: 50_000 },
      { account: "קניות", cr: 25_000 },
      { account: "עודפים", cr: 15_000 },
    ]);
  });

  it("year-end adjustments: the amounts and the sides", () => {
    const fees = ex("basics-final", "fees-unearned");
    const interest = ex("basics-adjust", "interest-accrual");
    const writeOff = ex("basics-adjust", "write-off");
    assert.ok(fees.kind === "journal" && interest.kind === "journal" && writeOff.kind === "journal");
    assert.deepEqual(fees.entry.lines, [{ account: "הכנסות משירותים", dr: 6_000 }, { account: "הכנסות משירותים מראש", cr: 6_000 }]);
    assert.equal(typeOf("הכנסות משירותים מראש"), "liability");
    assert.deepEqual(interest.entry.lines, [{ account: "הוצאות ריבית", dr: 30_000 }, { account: "הוצאות ריבית לשלם", cr: 30_000 }]);
    assert.deepEqual(writeOff.entry.lines, [{ account: "הפרשה להפסדי אשראי חזויים", dr: 4_000 }, { account: "לקוחות", cr: 4_000 }]);
  });

  it("the prepaid trap moves only the used months to expense", () => {
    const t = STUDY_MODULES["basics-adjust"].traps.find((x) => x.id === "check-recorded")!;
    assert.equal(t.options[t.answer], "ח׳ הוצאות ביטוח / ז׳ הוצאות ביטוח מראש 300");
  });
});

describe("interactive lessons: the rules", () => {
  const m = STUDY_MODULES["basics-double-entry"];
  const journal = m.exercises.find((x) => x.id === "compound")!;
  const binary = m.exercises.find((x) => x.id === "barber-chair")!;

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
      assert.deepEqual(move(mod, { step: 2, sub: 0 }, -1), { step: 1, sub: mod.exercises.length - 1 });
      assert.deepEqual(move(mod, { step: 0, sub: 0 }, -1), { step: 0, sub: 0 });
    }
  });

  it("a stored place outside the lesson is pulled back inside it", () => {
    assert.deepEqual(clampPlace(m, { step: 9, sub: 9 }), { step: 3, sub: 0 });
    assert.deepEqual(clampPlace(m, { step: 1, sub: 99 }), { step: 1, sub: m.exercises.length - 1 });
    assert.deepEqual(clampPlace(m, { step: -1, sub: -1 }), { step: 0, sub: 0 });
  });
});
