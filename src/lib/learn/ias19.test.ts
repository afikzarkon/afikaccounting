import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  absenceProvision,
  accrualPath,
  accrued,
  amendedYear,
  assetsInterest,
  assetsYear,
  attribution,
  backLoaded,
  balancingPN,
  cappedSurplus,
  classify,
  dayCost,
  definedContribution,
  expectedHeads,
  destination,
  grown,
  impliedRate,
  impliedShare,
  fifo,
  lifo,
  measure,
  partInterest,
  partRate,
  plainYear,
  presentation,
  pv,
  pvPath,
  raised,
  recognisedAssets,
  retirementPN,
  rollForward,
  settlementGain,
  shortTermExpense,
  simplePart,
  terminationBenefit,
  tiered,
} from "./ias19";

/**
 * The solver against the course plan's reference figures: every check figure
 * the plan gives is reproduced here from its stated data. The plan's figures
 * are rounded to the shekel, so each is matched to within one.
 */
const near = (a: number, b: number, where: string, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${where}: ${a} ≠ ${b}`);

describe("the toolkit: present value, part of a year, the roll-forward", () => {
  it("reference case 1: present value", () => {
    near(pv(12_421, 0.08, 5), 8_453, "pv");
    near(pv(20_000, 0.06, 7), 13_301, "pv 7 years");
    near(pv(10_000, 0.05, 3), 8_638, "pv 3 years");
    near(pv(1_000, 0.05, 10), 614, "pv 10 years");
  });

  it("reference case 2: interest for part of a year is compound", () => {
    near(partInterest(15_058, 0.06, 9), 673, "nine months");
    near(partInterest(23_610, 0.08, 3), 459, "a quarter");
    near(partRate(0.06, 3) * 100, 1.4674, "quarter rate", 0.0001);
    assert.ok(simplePart(0.06, 3) > partRate(0.06, 3), "simple interest overstates");
    near(200_000 * 0.06 - partInterest(30_000, 0.06, 6), 11_113, "a payment mid-year");
  });

  it("reference case 3: interest on a balance with a payment and a change of rate", () => {
    const parts = [partInterest(397_089, 0.085, 11), partInterest(50_000, 0.085, 7), partInterest(860_833, 0.08, 1)];
    near(parts[0], 30_833, "eleven months");
    near(parts[1], 2_437, "on the payment");
    near(parts[2], 5_539, "the last month");
    near(parts[0] - parts[1] + parts[2], 33_935, "interest");
  });

  it("reference case 4: the balancing line of a roll-forward", () => {
    near(shortTermExpense(9_750, 274_000, 8_500), 272_750, "expense");
    near(shortTermExpense(5_000, 60_000, 4_000), 59_000, "expense 2");
    near(balancingPN({ opening: 1_000, interest: 80, service: 0, pastService: 0, payments: 300, settled: 0, closing: 900 }), 120, "P.N.");
    near(balancingPN({ opening: 1_000, interest: 80, service: 200, pastService: 0, payments: 0, settled: 0, closing: 1_350 }), 70, "P.N. 2");
    // Any line can be the unknown.
    const r = rollForward({ opening: 1_000, interest: 80, service: 200, pn: 70 }, "closing");
    near(r.closing, 1_350, "closing");
  });
});

describe("short-term benefits", () => {
  it("reference case 5: absences that do not vest, and that do", () => {
    near(absenceProvision({ daysUsed: 13 * 1.5, vesting: false, dayCost: 500 }), 9_750, "opening, not vesting");
    near(500 * (80 * 6 + 17 * 4), 274_000, "paid");
    near(absenceProvision({ daysUsed: 17, vesting: false, dayCost: 500 }), 8_500, "closing");
    near(absenceProvision({ daysUsed: 19.5, daysOfLeavers: 9 * 2, vesting: true, dayCost: 500 }), 18_750, "opening, vesting");
    near(absenceProvision({ daysUsed: 19.5, daysOfLeavers: 9 * 2, vesting: false, dayCost: 500 }), 9_750, "the same days, not vesting");
    near(shortTermExpense(18_750, 279_000, 8_500), 268_750, "expense, vesting");
    // Six days used of five this year: one carried day, and the rest of the carried balance lapses.
    const l = lifo({ carried: 2, entitlement: 5, used: 6 });
    assert.deepEqual([l.fromCarried, l.carriedLeft], [1, 1]);
  });

  it("FIFO: the carried days go first, and fewer of them lapse", () => {
    const at = (used: number) => fifo({ carried: 3, entitlement: 12, used });
    assert.deepEqual(at(2), { fromCarried: 2, carriedLeft: 1, unusedOwn: 12 });
    assert.deepEqual(at(8), { fromCarried: 3, carriedLeft: 0, unusedOwn: 7 });
    assert.deepEqual(at(15), { fromCarried: 3, carriedLeft: 0, unusedOwn: 0 });
  });

  it("reference case 6: a bonus by formula, and the cost of a day", () => {
    near(74 * 120_000_000 * 0.00001, 88_800, "opening");
    near(76 * 200_000_000 * 0.00001, 152_000, "paid");
    near(shortTermExpense(88_800, 152_000, 0), 63_200, "expense");
    near(shortTermExpense(23_699, 110_209, 19_838), 106_349, "a year's total");
    near(shortTermExpense(23_699, 97_792, 5_357), 79_450, "leave, LIFO");
    near(dayCost(1, 1, 0.2583), 1.2583, "on-costs", 1e-9);
  });
});

describe("defined contribution", () => {
  it("reference case 7: the expense is the contribution due", () => {
    const a = definedContribution(240_000, 0.05, 11_000);
    assert.deepEqual([a.expense, a.liability], [12_000, 1_000]);
    const b = definedContribution(360_000, 0.06, 19_800);
    near(b.expense, 21_600, "expense");
    near(b.liability, 1_800, "unpaid");
    near(20 * raised(9_500, [0.03, 0.03]), 201_571, "a year's contribution");
    near(20 * raised(9_500, [0.03, 0.03, 0.03]), 207_618, "the next year");
  });
});

describe("measurement at one date: the five steps", () => {
  it("reference case 8: one manager", () => {
    const perYear = 0.05 * grown(150_000, 0.02, 5);
    near(perYear, 8_281, "①");
    near(perYear * 1.5, 12_421, "① × ②");
    near(measure({ perYear, years: 1.5, heads: 1, n: 5, i: 0.08 }), 8_453, "obligation");
    const later = 0.05 * grown(150_000, 0.02, 7);
    near(later, 8_615, "① later");
    near(measure({ perYear: later, years: 1.5, heads: 1, n: 7, i: 0.06 }), 8_594, "obligation later");
    near(0.05 * grown(20_000, 0.03, 4), 1_126, "① from today's salary");
  });

  it("reference case 9: a group, with a probability", () => {
    near(measure({ perYear: 1_500, years: 2, heads: 500 * 0.9, n: 15, i: 0.085 }), 397_089, "opening");
    near(measure({ perYear: 0.065 * 32_000, years: 3, heads: 450 * 0.85, n: 14, i: 0.075 }), 867_157, "closing");
  });

  it("reference case 10: a lump sum on the final salary, raised unevenly", () => {
    const final = raised(43_000, [0.025, ...Array(13).fill(0.03)]);
    near(final, 64_726, "final salary");
    near(final * 1.5 * 15, 1_456_327, "the benefit");
    near(final * 1.5, 97_088, "a year");
    near(measure({ perYear: final * 1.5, years: 1, heads: 1, n: 14, i: 0.031 }), 63_321, "obligation");
  });
});

describe("attribution to years of service", () => {
  it("reference case 11: front-loaded with a cap — the plan's formula", () => {
    const f = tiered([{ upTo: 5, perYear: 2_000 }, { perYear: 1_000 }]);
    const a = attribution(f, 10, 15_000);
    assert.equal(a.method, "formula");
    near(accrued(a, f, 7, 15_000), 12_000, "accrued");
    near(pv(accrued(a, f, 7, 15_000), 0.05, 5), 9_402, "obligation");
    near(pv((15_000 / 10) * 7, 0.05, 5), 8_227, "the straight line it is not");
  });

  it("reference case 12: back-loaded — straight line", () => {
    const f = tiered([{ upTo: 5, perYear: 2_000 }, { perYear: 4_000 }]);
    assert.ok(backLoaded(f, 12));
    const a = attribution(f, 12);
    assert.equal(a.method, "straight");
    near(a.total, 38_000, "total");
    near(a.perYear!, 3_167, "a year");
    near(accrued(a, f, 7), 22_167, "accrued");
    near(pv(accrued(a, f, 7), 0.05, 5), 17_368, "obligation");
    near(f(7), 18_000, "the formula it is not");
    near(pv(f(7), 0.05, 5), 14_103, "the formula's obligation");
  });

  it("reference case 13: service counts only from where it earns the benefit", () => {
    const perYear = 3_000 / 20;
    near(pv(perYear * 3, 0.04, 27) * 0.85, 133, "first");
    near(pv(perYear * 2, 0.04, 25) * 0.88, 99, "second");
    near(pv(500 * 3, 0.04, 3) * 0.97, 1_293, "third");
    near(pv(perYear * 3, 0.04, 27) * 0.85 + pv(perYear * 2, 0.04, 25) * 0.88 + pv(500 * 3, 0.04, 3) * 0.97, 1_525, "total");
  });

  it("reference case 14: divided by the window, discounted to payment", () => {
    near(pv(100_000 / 10, 0.06, 26), 2_198, "first year");
    near(pv((100_000 / 10) * 2, 0.05, 25), 5_906, "second year");
  });

  it("reference case 15: a cap shortens the window of a back-loaded formula", () => {
    const f = (t: number) => (t <= 5 ? 1_500 * t : 10_000 + 10_000 * (t - 5));
    const groups = [
      { heads: 5, expected: 14, served: 4, n: 10 },
      { heads: 7, expected: 8, served: 3, n: 5 },
      { heads: 12, expected: 6, served: 1, n: 5 },
      { heads: 4, expected: 4, served: 0, n: 4 },
    ];
    const at = (served: (g: (typeof groups)[number]) => number, n: (g: (typeof groups)[number]) => number) =>
      groups.map((g) => pv(g.heads * accrued(attribution(f, g.expected, 50_000), f, served(g), 50_000), 0.08, n(g)));
    assert.equal(attribution(f, 14, 50_000).window, 9);
    const opening = at((g) => g.served, (g) => g.n);
    [51_466, 71_461, 27_223, 0].forEach((v, k) => near(opening[k], v, `opening ${k}`));
    near(opening.reduce((s, v) => s + v, 0), 150_151, "opening");
    const closing = at((g) => g.served + 1, (g) => g.n - 1);
    [69_479, 102_904, 58_802, 4_763].forEach((v, k) => near(closing[k], v, `closing ${k}`));
    near(closing.reduce((s, v) => s + v, 0), 235_949, "closing");
  });
});

describe("the roll-forward over a year", () => {
  it("reference case 16: a first year, then a second with and without new assumptions", () => {
    const perYear = 0.05 * grown(150_000, 0.02, 5);
    near(pv(perYear, 0.08, 5), 5_636, "service, first year");
    const opening = pv(perYear, 0.07, 5);
    near(opening, 5_904, "closing, first year");
    near(opening - pv(perYear, 0.08, 5), 268, "P.N., first year");
    const y = plainYear({ opening, i: 0.07, perYear, servedAtStart: 1, nEnd: 4 });
    near(y.interest, 413, "interest");
    near(y.service, 6_317, "service");
    near(y.closing, 12_634, "closing");
    near(y.pn, 0, "P.N.");
    const changed = pv(2 * 0.05 * grown(150_000, 0.02, 6), 0.05, 5);
    near(changed, 13_236, "closing, new assumptions");
    near(changed - y.closing, 601, "P.N., new assumptions");
    near(pv(2 * perYear, 0.05, 4) - y.closing, 990, "P.N., only the rate");
  });

  it("reference case 17: given lines, and a different unknown", () => {
    const a = rollForward({ opening: 2_600_000, interest: 2_600_000 * 0.031, service: 530_000, payments: 270_000, closing: 3_100_000 }, "pn");
    near(a.interest, 80_600, "interest");
    near(a.pn, 159_400, "P.N.");
    const b = rollForward({ opening: 3_100_000, interest: 3_100_000 * 0.028, service: 590_000, pn: -276_800, closing: 3_200_000 }, "payments");
    near(b.interest, 86_800, "interest");
    near(b.payments, 300_000, "payments");
  });

  it("reference case 18: a one-off payment accrued over six years", () => {
    const perYear = (134_661 * 20 * 0.8) / 6;
    const opening = pv(perYear, 0.1, 5);
    near(opening, 222_970, "opening");
    const y = plainYear({ opening, i: 0.1, perYear, servedAtStart: 1, nEnd: 4 });
    near(y.interest, 22_297, "interest");
    near(y.service, 245_267, "service");
    near(y.closing, 490_535, "closing");
    near(y.pn, 0, "P.N.");
  });
});

describe("an amendment mid-year, settlement and an unexpected retirement", () => {
  it("reference case 19: the year split at the amendment", () => {
    const y = amendedYear({ opening: pv(80_000, 0.1, 5), iStart: 0.1, iAmend: 0.09, iEnd: 0.09, months: 3, oldPerYear: 80_000, newPerYear: 110_000, servedAtStart: 1, nEnd: 4 });
    near(y.serviceBefore, 12_718, "service before");
    near(y.serviceAfter, 58_445, "service after");
    near(y.service, 71_163, "service");
    near(y.pastBefore, 66_409, "before");
    near(y.pastAfter, 91_312, "after");
    near(y.pastService, 24_903, "past service");
    near(y.interestBefore, 1_198, "interest before");
    near(y.interestAfter, 6_097, "interest after");
    near(y.interest, 7_294, "interest");
    near(y.closing, 155_854, "closing");
    near(y.pn, 2_819, "P.N.");
    near(settlementGain(y.closing, 150_000), 5_854, "settlement");
    near(retirementPN(y.closing, 220_000), 64_146, "retirement");
  });

  it("reference case 20: a settlement loss", () => near(-settlementGain(334.02, 368), 33.98, "loss", 0.005));

  it("reference case 21: years whose lines are given", () => {
    near(balancingPN({ opening: 397_089, interest: 33_935, service: 220_885, pastService: 198_654, payments: 50_000, settled: 0, closing: 867_157 }), 66_594, "P.N.");
    near(220_885, 196_131 + 24_753, "service, two periods");
    near(860_833 - 662_179, 198_654, "past service");
    const final = raised(43_000, [0.025, ...Array(13).fill(0.03)]) * 1.5;
    near(pv(final, 0.031, 14) * 0.031, 1_963, "interest");
    near(pv(final, 0.031, 13), 65_284, "service");
    near(balancingPN({ opening: 63_321, interest: 1_963, service: 65_284, pastService: 0, payments: 0, settled: 0, closing: 135_609 }), 5_041, "P.N., first year");
    near(balancingPN({ opening: 135_609, interest: 4_446, service: 71_779, pastService: 30_981, payments: 0, settled: 0, closing: 234_210 }), -8_605, "P.N., second year");
    near(partInterest(235_949, 0.08, 3) + partInterest(335_791, 0.08, 9), 24_536, "interest, two periods");
    near(balancingPN({ opening: 235_949, interest: 24_536, service: 91_844, pastService: 335_791 - 259_337, payments: 0, settled: 0, closing: 446_928 }), 18_145, "P.N.");
    near(balancingPN({ opening: 5_906, interest: 449, service: 3_337, pastService: 4_050, payments: 0, settled: 0, closing: 8_752 }), -4_989, "P.N., a gain");
  });
});

describe("plan assets and the asset ceiling", () => {
  it("reference case 22: two roll-forwards and the net liability", () => {
    const y = plainYear({ opening: pv(25_000, 0.05, 25), i: 0.05, perYear: 25_000, servedAtStart: 1, nEnd: 24 });
    near(pv(25_000, 0.05, 25), 7_383, "opening");
    near(y.interest, 369, "interest");
    near(y.service, 7_752, "service");
    near(y.closing, 15_503, "closing");
    const a = assetsYear({ opening: 3_000, periods: [{ months: 12, i: 0.05 }], contributions: [{ amount: 500, month: 3 }], closing: 4_200 });
    near(a.interest, 168.6, "interest income", 0.1);
    near(a.pn, 531, "P.N. assets");
    near(pv(25_000, 0.05, 25) - 3_000, 4_383, "net, opening");
    near(y.closing - 4_200, 11_303, "net, closing");
    const p = presentation({ service: y.service, interestCost: y.interest, interestIncome: a.interest, pnObligation: 0, pnAssets: a.pn, closing: y.closing, assets: 4_200 });
    near(p.netInterest, -200, "net interest");
    near(p.total, -7_421, "total comprehensive");
  });

  it("reference case 23: the ceiling", () => {
    near(cappedSurplus(45_000, 40_000, 0.05 * 40_000), 2_000, "surplus");
    near(recognisedAssets(45_000, 40_000, 2_000), 42_000, "assets");
    const a = assetsYear({ opening: 42_000, periods: [{ months: 12, i: impliedRate(4_000, 40_000) }], closing: 72_000 });
    near(a.interest, 4_200, "interest");
    near(a.pn, 25_800, "P.N. assets");
    near(balancingPN({ opening: 40_000, interest: 4_000, service: 16_000, pastService: 0, payments: 0, settled: 0, closing: 70_000 }), 10_000, "P.N. obligation");
    near(cappedSurplus(72_000, 70_000, 0.05 * 70_000), 2_000, "below the ceiling");
    const p = presentation({ service: 16_000, interestCost: 4_000, interestIncome: 4_200, pnObligation: 10_000, pnAssets: 25_800, closing: 70_000, assets: 72_000 });
    near(p.netInterest, 200, "net interest");
    near(p.oci, 15_800, "OCI");
  });

  it("reference case 24: a surplus that cannot be used", () => {
    near(171_351 * 0.085, 14_565, "interest");
    near(balancingPN({ opening: 171_351, interest: 171_351 * 0.085, service: 92_958, pastService: 0, payments: 0, settled: 0, closing: 268_702 }), -10_172, "P.N. obligation");
    assert.equal(cappedSurplus(300_000, 268_702, 0), 0);
    const a = assetsYear({ opening: 0, periods: [{ months: 12, i: 0.085 }], contributions: [{ amount: 400_000, month: 3 }], closing: recognisedAssets(300_000, 268_702, 0) });
    near(a.interest, 25_238, "interest income");
    near(a.pn, -156_536, "P.N. assets");
    near(-a.pn, 100_000 + a.interest + (300_000 - 268_702), "its parts");
    const p = presentation({ service: 92_958, interestCost: 171_351 * 0.085, interestIncome: a.interest, pnObligation: -10_172, pnAssets: a.pn, closing: 268_702, assets: 268_702 });
    near(p.netInterest, 10_673, "net interest");
    near(p.oci, -146_364, "OCI");
  });

  it("reference case 25: only what the assets paid reduces them", () => {
    const a = assetsYear({ opening: 2_000_000, periods: [{ months: 12, i: 0.031 }], contributions: [{ amount: 170_000, month: 12 }], paidFromAssets: 57_000, closing: 2_200_000 });
    near(a.interest, 62_000, "interest");
    near(a.pn, 25_000, "P.N.");
    const b = assetsYear({ opening: 2_200_000, periods: [{ months: 12, i: 0.028 }], contributions: [{ amount: 213_000, month: 12 }], paidFromAssets: 50_000, closing: 2_500_000 });
    near(b.interest, 61_600, "interest");
    near(b.pn, 75_400, "P.N.");
  });

  it("reference case 26: interest income on a contribution mid-year, by the obligation's periods", () => {
    const a = assetsYear({ opening: 2_000, periods: [{ months: 12, i: 0.06 }], closing: 1_800 });
    near(a.interest, 120, "interest");
    near(a.pn, -320, "P.N.");
    // The figure as one source computed it (the opening at a full year's 5%) — and the rule, period by period (IAS 19.125).
    near(1_800 * 0.05 + partInterest(3_000, 0.07, 6), 193.22, "as computed", 0.005);
    near(1_800 + 193.22 + 3_000 - 2_500, 2_493, "its P.N.", 0.5);
    const rule = assetsInterest({ opening: 1_800, periods: [{ months: 6, i: 0.05 }, { months: 6, i: 0.07 }], contributions: [{ amount: 3_000, month: 6 }] });
    assert.ok(rule.total > 193.22, "the rule splits the opening's interest too");
  });

  it("reference case 27: a year of the assets", () => {
    const a = assetsYear({ opening: 32_125, periods: [{ months: 12, i: impliedRate(1_302, 32_561) }], contributions: [{ amount: 3_640, month: 6 }], paidFromAssets: 2_912, closing: 34_613 });
    near(a.interest, 1_357, "interest income");
    near(32_125 * impliedRate(1_302, 32_561), 1_285, "on the opening");
    near(partInterest(3_640, impliedRate(1_302, 32_561), 6), 72, "on the contribution");
    near(a.pn, 403, "P.N.");
  });
});

describe("presentation and reverse engineering", () => {
  it("reference case 28: an amendment, the assets on the same periods, and the statements", () => {
    const y = amendedYear({ opening: pv(25_000, 0.05, 25), iStart: 0.05, iAmend: 0.03, iEnd: 0.04, months: 6, oldPerYear: 25_000, newPerYear: 30_000, servedAtStart: 1, nEnd: 24 });
    near(y.serviceBefore, 3_782, "service before");
    near(y.serviceAfter, 7_379, "service after");
    near(y.service, 11_161, "service");
    near(y.pastBefore, 18_177, "before");
    near(y.pastAfter, 21_812, "after");
    near(y.pastService, 3_635, "past service");
    near(y.interestBefore, 182, "interest before");
    near(y.interestAfter, 325, "interest after");
    near(y.interest, 507, "interest");
    near(y.closing, 23_407, "closing");
    near(y.pn, 721, "P.N.");
    const a = assetsYear({ opening: 3_000, periods: [{ months: 6, i: 0.05 }, { months: 6, i: 0.03 }], contributions: [{ amount: 500, month: 3 }], closing: 4_200 });
    near(a.interest, 132, "interest income");
    near(a.pn, 568, "P.N. assets");
    const p = presentation({ service: y.service, pastService: y.pastService, interestCost: y.interest, interestIncome: a.interest, pnObligation: y.pn, pnAssets: a.pn, closing: y.closing, assets: 4_200 });
    near(-p.salary, 14_797, "salary");
    near(-p.netInterest, 375, "net interest");
    near(-p.oci, 153, "OCI");
    near(p.net, 19_207, "net liability");
    near(-p.salary - p.netInterest, 15_172, "with interest in salary");
  });

  it("reference case 29: each line to its place", () => {
    assert.equal(destination("service"), "pl");
    assert.equal(destination("pastService"), "pl");
    assert.equal(destination("settlement"), "pl");
    assert.equal(destination("netInterest"), "pl");
    assert.equal(destination("pnObligation"), "oci");
    assert.equal(destination("pnAssets"), "oci");
    assert.equal(destination("ceiling"), "oci");
    assert.equal(destination("closing"), "bs");
    assert.equal(destination("pnObligation", "otherLongTerm"), "pl");
    near(80_600 - 62_000 + 1_963, 20_563, "net finance, first year");
    near(159_400 - 25_000 + 5_041, 139_441, "OCI loss, first year");
    near(86_800 - 61_600 + 4_446, 29_646, "net finance, second year");
    near(276_800 + 75_400 + 8_605, 360_805, "OCI gain, second year");
    near(3_100_000 + 135_609 - 2_200_000, 1_035_609, "net, first year");
    near(3_200_000 + 234_210 - 2_500_000, 934_210, "net, second year");
    near(30_981 + 71_779, 102_760, "admin, second year");
  });

  it("reference case 30: hidden rates and shares from last year's note, unrounded", () => {
    const rate = impliedRate(1_302, 32_561);
    near(rate * 100, 3.9987, "rate", 0.0001);
    near(impliedShare(5_876, 6_529) * 100, 90, "paid from assets", 0.01);
    near(impliedShare(4_148, 50 * 14.5 + 95 * 12.1 + 280 * 8.9) * 100, 95, "contribution", 0.01);
    near(impliedShare(574, (40 * 11 * 20.07) / 1.04 ** 11) * 100, 10, "amendment", 0.1);
  });
});

describe("other long-term and termination benefits", () => {
  it("reference case 31: a long-service award, everything to profit or loss", () => {
    const y = amendedYear({ opening: pv(24_000, 0.06, 8), iStart: 0.06, iAmend: 0.08, iEnd: 0.08, months: 9, oldPerYear: 12_000, newPerYear: 15_000, servedAtStart: 2, nEnd: 7 });
    near(pv(24_000, 0.06, 8), 15_058, "opening");
    near(y.serviceBefore, 5_899, "service before");
    near(y.serviceAfter, 2_188, "service after");
    near(y.pastBefore, 18_888, "before");
    near(y.pastAfter, 23_610, "after");
    near(y.pastService, 4_722, "past");
    near(y.service + y.pastService, 12_809, "one service cost");
    near(y.interest, 1_131, "interest");
    near(y.closing, 26_257, "closing");
    near(y.pn, -2_741, "P.N., a gain");
    near(y.service + y.pastService + y.interest + y.pn, y.closing - pv(24_000, 0.06, 8), "all of it in profit or loss");
    near(y.service + y.pastService + y.interest, 13_940, "were it post-employment");
  });

  it("reference case 32: a termination benefit, whatever the split", () => {
    near(terminationBenefit({ perHead: 10_000, heads: 90 }), 900_000, "within a year");
    near(terminationBenefit({ perHead: 10_000, heads: 90, yearsToPay: 2, i: 0.05 }), 816_327, "in two years");
  });

  it("reference case 33: three long-term plans at 10%", () => {
    near(grown(90_000, 0.01, 4) / 12, 7_805, "a month's salary", 0.5);
    near(pv((7_805 * 100 * 0.8) / 5, 0.1, 4), 85_295, "opening");
    near(pv((7_805 * 100 * 0.8) / 5, 0.1, 3), 93_824, "service");
    near(pv(((7_805 * 100 * 0.75) / 5) * 2, 0.1, 3), 175_920, "closing");
    near(balancingPN({ opening: 85_295, interest: 8_529, service: 93_824, pastService: 0, payments: 0, settled: 0, closing: 175_920 }), -11_728, "P.N., a gain");
    near(pv(3 * 9e6 * 0.05, 0.1, 2), 1_115_702, "opening");
    near(pv(3 * 14e6 * 0.05, 0.1, 1), 1_909_091, "service");
    near(pv(3 * 23e6 * 0.05, 0.1, 1), 3_136_364, "closing");
  });

  it("the sorting questions, in their order", () => {
    assert.equal(classify({ fromDecisionToTerminate: true, settledWithin12Months: true, afterEmployment: true }), "termination");
    assert.equal(classify({ fromDecisionToTerminate: false, settledWithin12Months: true, afterEmployment: false }), "shortTerm");
    assert.equal(classify({ fromDecisionToTerminate: false, settledWithin12Months: false, afterEmployment: true }), "postEmployment");
    assert.equal(classify({ fromDecisionToTerminate: false, settledWithin12Months: false, afterEmployment: false }), "otherLongTerm");
  });
});

describe("the figures' helpers", () => {
  it("a future amount on its way to today: each year the one after it ÷ (1 + i), today first", () => {
    const path = pvPath(100, 0.08, 5);
    assert.equal(path.length, 6);
    assert.equal(path[5], 100);
    assert.equal(Math.round(path[0]), 68);
    for (let k = 0; k < 5; k++) assert.ok(Math.abs(path[k] * 1.08 - path[k + 1]) < 1e-9);
    assert.equal(Math.round(pvPath(10_000, 0.05, 2)[0]), 9_070);
  });

  it("expected heads: headcount × (1 − leavers)", () => {
    assert.equal(expectedHeads(250, 0.08), 230);
    assert.equal(expectedHeads(40, 0.1), 36);
  });
});

describe("accrual, year by year", () => {
  it("under the formula it follows the tiers and stops at the cap; the straight line spreads the total over the window", () => {
    const f = tiered([{ upTo: 4, perYear: 3_000 }, { perYear: 1_500 }]);
    const path = accrualPath(f, 8, 18_000);
    assert.deepEqual(path.map((r) => r.formula), [3_000, 6_000, 9_000, 12_000, 13_500, 15_000, 16_500, 18_000]);
    assert.equal(path[4].straight, (18_000 / 8) * 5);
    const capped = accrualPath(tiered([{ perYear: 2_500 }]), 8, 10_000);
    assert.deepEqual(capped.map((r) => r.straight), [2_500, 5_000, 7_500, 10_000, 10_000, 10_000, 10_000, 10_000]);
  });
});
