import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, forClaude, placeKey, type TesterInput } from "./analysis";
import { emptyState, type FormState, sanitizeState, toMarkdown } from "./form";

const state = (patch: Partial<FormState>): FormState => ({ ...emptyState(), ...patch });

const dana: TesterInput = {
  id: "a",
  label: "T01",
  state: state({
    modules: [
      {
        "module.moduleName": "הטבות עובד 1",
        "quickRubric.missing": "דוגמה עם תקרה",
        "stuckPoints.points": [
          { where: "הטבה מוגדרת 1 (/study/ias19-measure)", kind: "understanding", severity: "blocker", tried: "לא הבנתי את שנות הזכאות", minutesLost: "15" },
          { where: "מחשבון (/engine/ias19)", kind: "interface", severity: "cosmetic", tried: "", minutesLost: "" },
        ],
        "stuckPoints.leftSite": "יוטיוב, על היוון",
        "examGap.notTaught": "שינוי הנחות אקטואריות",
        "tools.toolsUsed": ["calculator", "worked-solution"],
        "tools.helpedUnderstand": "רק נתן תשובה",
      },
    ],
    summary: { "summary.verdict": "כמעט", "summary.recommend": 9 },
    pages: {
      "ias19-measure/screen:years": { lesson: "שיעור 2: מדידה", title: "שנות זכאות", where: "מושג 3 מתוך 9", r: "unclear", tags: ["missing", "example"], note: "לא הבנתי מאיפה 5 שנים", secs: 120, at: "2026-11-10T10:00:00Z" },
      "ias19-measure/screen:intro": { lesson: "שיעור 2: מדידה", title: "מבוא", r: "clear", secs: 30, at: "2026-11-10T09:58:00Z" },
      "ias19-measure/summary": { lesson: "שיעור 2: מדידה", title: "סיכום", exam: 2, change: "עוד דוגמה עם תקרה", at: "2026-11-10T10:30:00Z" },
    },
  }),
};

const yossi: TesterInput = {
  id: "b",
  label: "T02",
  state: state({
    modules: [
      {
        "module.moduleName": "שיעור 1",
        "stuckPoints.points": [{ where: "הטבה מוגדרת 1 (/study/ias19-measure#3)", kind: "understanding", severity: "slows", tried: "מבלבל", minutesLost: "5" }],
        "tools.helpedUnderstand": "רק נתן תשובה",
      },
      {},
    ],
    summary: { "summary.verdict": "כן", "summary.recommend": 5 },
    pages: {
      "ias19-measure/screen:years": { lesson: "שיעור 2: מדידה", title: "שנות זכאות", r: "unclear", tags: ["missing"], secs: 60, at: "2026-11-11T10:00:00Z" },
      "ias19-measure/screen:intro": { lesson: "שיעור 2: מדידה", title: "מבוא", r: "ok", tags: ["long"], at: "2026-11-11T09:58:00Z" },
      "ias19-measure/summary": { lesson: "שיעור 2: מדידה", title: "סיכום", exam: 3, at: "2026-11-11T10:30:00Z" },
    },
  }),
};

test("placeKey groups by the page address, ignoring the screen anchor", () => {
  assert.equal(placeKey("הטבה מוגדרת 1 (/study/ias19-measure)"), "/study/ias19-measure");
  assert.equal(placeKey("x (/study/ias19-measure#3)"), "/study/ias19-measure");
  assert.equal(placeKey("  שיעור  3 "), "שיעור 3");
});

test("analyze counts and ranks the hotspot two testers share first", () => {
  const a = analyze([dana, yossi]);
  assert.equal(a.testers, 2);
  assert.equal(a.modules, 2); // the blank module isn't one
  assert.equal(a.points, 3);
  assert.equal(a.minutesLost, 20);
  assert.deepEqual(a.bySeverity, { blocker: 1, cosmetic: 1, slows: 1 });
  const top = a.hotspots[0];
  assert.equal(placeKey(top.where), "/study/ias19-measure");
  assert.deepEqual([top.points, top.testers, top.blockers, top.slows], [2, 2, 1, 1]);
});

test("analyze reads the exam gap, the verdict and NPS, and orders actions by severity", () => {
  const a = analyze([dana, yossi]);
  assert.equal(a.exam.notTaught[0].text, "שינוי הנחות אקטואריות");
  assert.equal(a.leftSite.length, 1);
  assert.deepEqual(a.verdict, { כמעט: 1, כן: 1 });
  assert.deepEqual([a.nps.score, a.nps.promoters, a.nps.detractors], [0, 1, 1]);
  assert.equal(a.actions[0].level, "high");
  assert.match(a.actions[0].text, /ias19-measure|הטבה מוגדרת/);
  assert.ok(a.actions.some((x) => x.text.includes("לא רק לתת תוצאה")));
});

test("forClaude carries the instructions, the numbers and every tester's answers", () => {
  const text = forClaude(analyze([dana, yossi]), [dana, yossi]);
  assert.match(text, /## מה אני מבקש/);
  assert.match(text, /ניסיין: T01/);
  assert.match(text, /ניסיין: T02/);
  assert.match(text, /שינוי הנחות אקטואריות/);
});

test("analyze ranks the least clear page first, with its reasons, notes and median time", () => {
  const a = analyze([dana, yossi]);
  assert.equal(a.pageRatings, 4);
  const [worst, next] = a.pages;
  assert.equal(worst.key, "ias19-measure/screen:years");
  assert.deepEqual([worst.unclear, worst.ok, worst.clear, worst.n], [2, 0, 0, 2]);
  assert.deepEqual(worst.tags, { missing: 2, example: 1 });
  assert.equal(worst.notes[0].text, "לא הבנתי מאיפה 5 שנים");
  assert.equal(worst.secs, 120);
  assert.equal(worst.score, 1);
  assert.equal(next.score, 0.25);
  assert.ok(a.actions.some((x) => x.level === "high" && x.text.includes("שנות זכאות")));
});

test("analyze averages the end-of-lesson exam readiness and flags a low lesson", () => {
  const a = analyze([dana, yossi]);
  const l = a.lessons.find((x) => x.slug === "ias19-measure")!;
  assert.deepEqual([l.exam, l.examN, l.rated, l.unclear, l.ok], [2.5, 2, 4, 2, 1]);
  assert.equal(l.changes[0].text, "עוד דוגמה עם תקרה");
  assert.ok(a.actions.some((x) => x.text.includes("ברמת בחינה")));
  assert.match(forClaude(a, [dana, yossi]), /שנות זכאות: לא ברור 2/);
});

test("sanitizeState keeps valid page ratings, drops junk, and reads old forms without pages", () => {
  const s = sanitizeState({
    intake: {},
    modules: [{}],
    pages: {
      "x/screen:a": { lesson: "L", title: "A", r: "clear", tags: ["long", "nope"], secs: -3, at: "2026-11-10T10:00:00Z" },
      "x/screen:b": { lesson: "L", title: "B", r: "great" },
      "x/summary": { lesson: "L", title: "S", exam: 9, change: "יותר תרגול" },
    },
  })!;
  assert.deepEqual(Object.keys(s.pages), ["x/screen:a", "x/summary"]);
  assert.deepEqual(s.pages["x/screen:a"].tags, ["long"]);
  assert.equal(s.pages["x/screen:a"].secs, undefined);
  assert.equal(s.pages["x/summary"].exam, undefined);
  assert.deepEqual(sanitizeState({ intake: {}, modules: [] })!.pages, {});
});

test("toMarkdown lists each lesson's rated pages", () => {
  const md = toMarkdown(dana.state);
  assert.match(md, /## דירוג המסכים/);
  assert.match(md, /😕 לא הבנתי · \*\*שנות זכאות\*\*/);
  assert.match(md, /סוף השיעור:.*2 \/ 5/);
});
