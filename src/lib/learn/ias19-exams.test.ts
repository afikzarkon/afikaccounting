import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { balancingPN } from "./ias19";
import { accruedOf, EXAM_A, EXAM_B, examA, examB, fieldWindow, groupsYear, noteExam, type Group } from "./ias19-exams";

const near = (a: number, b: number, where: string, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${where}: ${a} ≠ ${b}`);

describe("the exam solvers against the course plan's reference figures", () => {
  // Four groups under a capped, back-loaded formula, then a grant added to two of them a quarter into the year.
  const capped = (served: number[], heads = [5, 7, 12, 4]): Group[] =>
    [
      { perYear: 50_000 / 9, window: 9, nEnd: 9 },
      { perYear: 5_000, window: 8, nEnd: 4 },
      { perYear: 20_000 / 6, window: 6, nEnd: 4 },
      { perYear: 1_500, window: 4, nEnd: 3 },
    ].map((g, k) => ({ id: String(k), heads: heads[k], served: served[k], nEnd: g.nEnd, grants: [{ perYear: g.perYear, window: g.window }] }));

  it("reference case 1: a year of groups, with no news, and service as the balance", () => {
    const y = groupsYear({ groups: capped([4, 3, 1, 0]), iStart: 0.08, iEnd: 0.08 });
    near(y.opening, 150_151, "opening");
    near(y.interest, 12_012, "interest");
    near(y.closing, 235_949, "closing");
    near(y.closing - y.opening - y.interest, 73_786, "service");
  });

  it("reference case 2: a grant added a quarter into the year, and the rate falling in December", () => {
    const groups = capped([5, 4, 2, 1]).map((g) => ({ ...g, nEnd: g.nEnd - 1 }));
    const add = { "0": { perYear: 15_000 / 7, window: 7 }, "1": { perYear: 15_000 / 7, window: 7 } };
    const y = groupsYear({ groups, iStart: 0.08, iEnd: 0.07, amendment: { months: 3, iAmend: 0.08, add } });
    near(y.opening, 235_949, "opening");
    near(y.serviceBefore, 18_805, "service before", 2);
    near(y.serviceAfter, 73_039, "service after", 2);
    near(y.before, 259_337, "before");
    near(y.after, 335_791, "after");
    near(y.pastService, 76_454, "past service");
    near(y.interest, 24_536, "interest");
    near(y.closing, 446_928, "closing");
    near(y.pn, 18_145, "P.N.", 3);
  });

  it("reference case 3: a grant attributed by the reason for entitlement, and leavers", () => {
    const groups = (served: number[], nEnd: number[], headsEnd?: number): Group[] => [
      { id: "a", heads: 2, served: served[0], nEnd: nEnd[0], grants: [{ perYear: 20_000 / 6, window: 6 }] },
      { id: "b", heads: 0, served: served[1], nEnd: nEnd[1], grants: [] },
      { id: "c", heads: 35, headsEnd, served: served[2], nEnd: nEnd[2], grants: [{ perYear: 20_000 / 15, window: 15 }] },
    ];
    const y1 = groupsYear({ groups: groups([3, 3, 2], [4, 5, 17]), iStart: 0.08, iEnd: 0.08 });
    near(y1.opening, 36_968, "opening");
    near(y1.interest, 2_957, "interest");
    near(y1.closing, 57_438, "closing");
    near(y1.closing - y1.opening - y1.interest, 17_513, "service");
    const y2 = groupsYear({ groups: groups([4, 4, 3], [3, 4, 16], 33), iStart: 0.08, iEnd: 0.07 });
    near(y2.service, 18_914, "service");
    near(y2.interest, 4_595, "interest");
    near(y2.closing, 86_827, "closing");
    near(y2.pn, 5_880, "P.N.");
  });

  it("reference case 4: hidden figures from last year's note, unrounded, and what rounding does", () => {
    const q = {
      year: 2018,
      startYear: 2007,
      retireYear: 2028,
      grades: [
        { id: "a", heads: 40, headsLastMid: 50, salaryLast: 14.5, raise: 0.03 },
        { id: "b", heads: 80, headsLastMid: 95, salaryLast: 12.1, raise: 0.02 },
        { id: "c", heads: 250, headsLastMid: 280, salaryLast: 8.9, raise: 0.01 },
      ],
      note: { openingLast: 32_561, interestLast: 1_302, paidLast: 6_529, paidFromAssetsLast: 5_876, contributionLast: 4_148, pastServiceLast: 574, amendedLast: "a", obligation: 32_648, assets: 32_125 },
      leavers: { grade: "c", heads: 30 },
      amendment: { grade: "b", ofLast: 0.5 },
      contributionMonth: 6,
      excessReturn: 403,
    };
    const x = noteExam(q);
    near(x.exactRate * 100, 3.9987, "rate", 0.0001);
    assert.deepEqual([x.fromAssets, x.contributionRate, x.addedLast, x.addedNow], [0.9, 0.95, 0.1, 0.05]);
    near(x.obligation.interest, 1_305, "interest");
    near(x.obligation.service, 3_087, "service");
    near(x.obligation.pastService, 488, "past service");
    near(x.obligation.payments, 3_236, "payments");
    near(x.obligation.closing, 35_118, "closing");
    near(x.obligation.pn, 826, "P.N.");
    near(x.assets.interestOnOpening, 1_285, "interest on the opening");
    near(x.assets.interestOnContribution, 72, "interest on the contribution");
    near(x.assets.contribution, 3_640, "contribution");
    near(x.assets.paid, 2_912, "paid from assets");
    near(x.assets.closing, 34_613, "closing assets");
    near(x.net, 505.5, "net", 0.6);
    const r = noteExam({ ...q, roundRate: 0.01 });
    near(r.obligation.interest, 1_306, "interest at a round rate");
    near(r.obligation.closing, 35_114, "closing at a round rate");
    near(r.obligation.pn, 821, "P.N. at a round rate", 1.5);
  });
});

describe("the course's own exam questions", () => {
  const A = examA();
  const B = examB();

  it("question 1: the grants as designed — a cap reached, and a group not entitled", () => {
    const g = A.assembly.groups.find((x) => x.id === "2016")!;
    assert.equal(g.grants[0].window, 10, "the cap shortens the window");
    assert.equal(g.grants[0].perYear * g.grants[0].window, EXAM_A.assembly.cap);
    assert.deepEqual(A.assembly.addedTo, ["2016", "2018"]);
    assert.equal(fieldWindow(EXAM_A.field.groups[1]), undefined, "the young group earns nothing");
    assert.deepEqual(EXAM_A.field.groups.map(fieldWindow), [8, undefined, 12]);
  });

  it("question 1: every roll-forward balances, the second year's openings are the first year's closings", () => {
    for (const [name, d] of Object.entries({ assembly: A.assembly, field: A.field })) {
      near(d.year2.opening, d.year1.closing, `${name}: carried over`, 1e-6);
      near(d.year1.pn, 0, `${name}: no news in year one`, 1e-6);
      for (const y of [d.year1, d.year2]) near(balancingPN({ ...y, payments: 0, settled: 0 }), y.pn, name, 1e-6);
    }
    assert.ok(A.assembly.year2.pn > 0 && A.field.year2.pn > 0, "a falling rate is a loss");
    near(A.assembly.year2.pastService, A.assembly.year2.after - A.assembly.year2.before, "past service", 1e-6);
  });

  it("question 2: the hidden figures are round, the rate is not", () => {
    assert.deepEqual([B.fromAssets, B.contributionRate, B.addedLast, B.addedNow], [0.8, 0.9, 0.08, 0.04]);
    assert.ok(Math.abs(B.exactRate - 0.045) > 1e-5 && Math.abs(B.exactRate - 0.045) < 1e-4, "close to, not at, a round rate");
    near(B.obligation.pn, balancingPN({ ...B.obligation, settled: 0 }), "balances", 1e-6);
    near(B.assets.closing - B.assets.opening - B.assets.interest - B.assets.contribution + B.assets.paid, EXAM_B.excessReturn, "assets balance", 1e-6);
    const round = examB(0.005);
    assert.ok(Math.abs(round.obligation.pn - B.obligation.pn) >= 1, "rounding the rate moves the answer");
  });

  it("question 2: the payments are all of the leavers' benefit; the assets pay only their share", () => {
    near(B.assets.paid, B.obligation.payments * B.fromAssets, "share", 1e-9);
    near(B.obligation.payments, EXAM_B.leavers.heads * B.salaries[2] * B.servedEnd, "payments", 1e-9);
    near(accruedOf([{ perYear: 1, window: 5 }], 7), 5, "a window caps accrual", 0);
  });
});
