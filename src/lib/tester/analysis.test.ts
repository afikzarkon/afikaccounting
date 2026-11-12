import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, forClaude, placeKey, type TesterInput } from "./analysis";
import { emptyState, type FormState } from "./form";

const state = (patch: Partial<FormState>): FormState => ({ ...emptyState(), ...patch });

const dana: TesterInput = {
  id: "a",
  label: "T01",
  state: state({
    modules: [
      {
        "module.moduleName": "הטבות עובד 1",
        "quickRubric.ratings": { clarity: 2, pace: 3, examples: 2, nextStep: 4, examConfidence: 2 },
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
  }),
};

const yossi: TesterInput = {
  id: "b",
  label: "T02",
  state: state({
    modules: [
      {
        "module.moduleName": "שיעור 1",
        "quickRubric.ratings": { clarity: 4, pace: 4, examples: 5, nextStep: 5, examConfidence: 4 },
        "stuckPoints.points": [{ where: "הטבה מוגדרת 1 (/study/ias19-measure#3)", kind: "understanding", severity: "slows", tried: "מבלבל", minutesLost: "5" }],
        "tools.helpedUnderstand": "רק נתן תשובה",
      },
      {},
    ],
    summary: { "summary.verdict": "כן", "summary.recommend": 5 },
  }),
};

test("placeKey groups by the page address, ignoring the screen anchor", () => {
  assert.equal(placeKey("הטבה מוגדרת 1 (/study/ias19-measure)"), "/study/ias19-measure");
  assert.equal(placeKey("x (/study/ias19-measure#3)"), "/study/ias19-measure");
  assert.equal(placeKey("  שיעור  3 "), "שיעור 3");
});

test("analyze counts, ranks the hotspot two testers share first, and averages the ratings", () => {
  const a = analyze([dana, yossi]);
  assert.equal(a.testers, 2);
  assert.equal(a.modules, 2); // the blank module isn't one
  assert.equal(a.points, 3);
  assert.equal(a.minutesLost, 20);
  assert.deepEqual(a.bySeverity, { blocker: 1, cosmetic: 1, slows: 1 });
  const top = a.hotspots[0];
  assert.equal(placeKey(top.where), "/study/ias19-measure");
  assert.deepEqual([top.points, top.testers, top.blockers, top.slows], [2, 2, 1, 1]);
  assert.equal(a.ratings.find((r) => r.id === "clarity")?.avg, 3);
  assert.equal(a.weakModules[0].module, "הטבות עובד 1");
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
