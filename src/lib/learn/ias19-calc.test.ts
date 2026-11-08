import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LECTURE_21, ALON } from "./ias19-absence-cases";
import { solveAbsence } from "./ias19-absence";
import { solveAmend, solveGift, solveLump, solveOlt, solveSettle, solveShort, solveThree, solveTiered, solveTierGrant, sum } from "./ias19-booklet";
import { AMEND_CASE, CASES_CASE, GIFT_CASE, OLT_CASE, SHORT_CASE, THREE_CASE, TIER_CASE, TIERED_CASE } from "./ias19-booklet-cases";
import {
  type AbsenceInput,
  type CalcSolution,
  type DbDetail,
  solveAbsences,
  solveAbsenceBenefit,
  solveBonus,
  solveDbYear,
  solveDcPlans,
  solveDisabilityEvent,
  solveMeasure,
  solveNonAccumulating,
  solveNoteYear,
  solveTermination,
} from "./ias19-calc";
import { type Answers, errorsFor, kindOf, nextYearAnswers, questionsFor, solveAnswers } from "./ias19-calc-flow";
import { FINAL_CANCEL, FINAL_INTEGRATED, FINAL_MFR, FINAL_MGMT, FINAL_SHORT, FINAL_THREE, FINAL_TRUST, solveCancel, solveIntegrated, solveMfr, solveMgmt, solveShortExam, solveThreeAgree, solveTrust } from "./ias19-finals";

const near = (got: number, want: number, tol = 1) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);
const db = (s: CalcSolution) => s.detail as DbDetail;

/** Every movement table balances, every journal entry balances, every computed figure is a number. */
function wellFormed(s: CalcSolution) {
  assert.ok(s.metrics.every((m) => Number.isFinite(m.value)), s.title);
  for (const st of s.steps) {
    for (const r of st.rolls ?? []) {
      const closing = r.rows[r.rows.length - 1];
      near(r.rows.slice(0, -1).reduce((t, x) => t + x.value, 0), closing.value, 1);
    }
    for (const j of st.journal ?? []) {
      const dr = j.lines.reduce((t, l) => t + (l.dr ?? 0), 0);
      const cr = j.lines.reduce((t, l) => t + (l.cr ?? 0), 0);
      near(dr, cr, 3);
    }
    for (const n of st.notes ?? []) for (const l of n.lines) if (l.value !== undefined) assert.ok(Number.isFinite(l.value), `${s.title}: ${l.label}`);
  }
}

describe("the calculator against the course's questions: defined benefit", () => {
  it("BK_AMEND: an amendment mid-year on three sets of assumptions, with a payment", () => {
    const q = AMEND_CASE;
    const want = solveAmend(q);
    const s = solveDbYear({
      plan: "postEmployment",
      year: q.year,
      terms: { kind: "salary", share: q.oldRate },
      groups: [{ name: "כולם", heads: q.start.heads, stay: q.start.p, served: q.year - q.since, nEnd: q.start.remaining - 1, salary: q.start.salary, atEvent: { heads: q.amend.heads, stay: q.amend.p, salary: q.amend.salary, n: q.amend.remaining }, atEnd: { heads: q.end.heads, stay: q.end.p, salary: q.end.salary } }],
      iStart: q.start.corp,
      iEnd: q.end.corp,
      event: { type: "amend", month: q.month, rate: q.amend.corp, terms: { kind: "salary", share: q.newRate } },
      payments: [{ amount: q.payment.amount, month: q.payment.month }],
    });
    wellFormed(s);
    const d = db(s);
    near(d.opening, want.opening);
    near(d.service, want.service);
    near(d.past, want.pastService);
    near(d.interest, want.interest);
    near(d.closing, want.closing);
    near(d.pn, want.pn);
  });

  it("BK_CASES: a lump sum in two years, raised mid-year, with plan assets", () => {
    const q = CASES_CASE.lump;
    const want = solveLump(q);
    const T = q.retireAge - q.age;
    const group = (served: number, nEnd: number) => ({ name: "העובד", heads: 1, stay: 1, served, nEnd });
    const y1 = solveDbYear({
      plan: "postEmployment",
      year: q.hired + 1,
      terms: { kind: "lump", grant: q.grant, window: q.window },
      groups: [group(1, T - 2)],
      iStart: q.rates[0],
      iEnd: q.rates[1],
      assets: { opening: q.deposit1, closing: q.fv1, contributions: [], ceiling: { kind: "none" } },
    });
    wellFormed(y1);
    near(db(y1).pn, want.y1.pn, 0.01);
    near(db(y1).closing, want.y1.closing, 0.01);
    near(db(y1).assetInterest, want.a1.interest, 0.01);
    const y2 = solveDbYear({
      plan: "postEmployment",
      year: q.hired + 2,
      terms: { kind: "lump", grant: q.grant, window: q.window },
      groups: [group(2, T - 3)],
      iStart: q.rates[1],
      iEnd: q.rates[3],
      event: { type: "amend", month: 6, rate: q.rates[2], terms: { kind: "lump", grant: q.newGrant, window: q.window } },
      assets: { opening: q.fv1, closing: q.fv2, contributions: [{ amount: q.deposit2, month: 6 }], ceiling: { kind: "none" } },
    });
    wellFormed(y2);
    const d = db(y2);
    near(d.past, want.y2.past, 0.01);
    near(d.interest, want.y2.interest, 0.01);
    near(d.service, want.y2.service, 0.01);
    near(d.pn, want.y2.pn, 0.01);
    near(d.assetInterest, want.a2.interest, 0.01);
    near(d.assetPn, want.a2.pn, 0.01);
  });

  it("BK_CASES: a settlement at year end, at a price above the balance", () => {
    const q = CASES_CASE.settle;
    const want = solveSettle(q);
    const [T1, T2] = q.expected;
    const s = solveDbYear({
      plan: "postEmployment",
      year: q.hired + 2,
      terms: { kind: "lump", grant: want.g1, window: T1 },
      groups: [{ name: "הקבוצה", heads: 1, stay: 1, served: 2, nEnd: T1 - 3, atEnd: { heads: 0 } }],
      iStart: q.rate,
      iEnd: q.newRate,
      event: { type: "settle", month: 12, rate: q.newRate, share: 1, paid: q.pay, paidFromAssets: false },
      openingGiven: want.opening,
    });
    wellFormed(s);
    near(db(s).interest, want.interest, 0.01);
    near(db(s).service, want.service, 0.01);
    assert.equal(T2, q.expected[1]);
  });

  it("BK_TIER: a grant in tiers measured at one date", () => {
    const q = TIER_CASE;
    const want = solveTierGrant(q);
    const s = solveMeasure({
      plan: "postEmployment",
      date: `31.12.${q.year}`,
      terms: { kind: "lump", grant: want.grant, window: want.total },
      rate: q.rate,
      groups: [{ name: "העובד", heads: 1, stay: 1, served: q.served, nEnd: 0, servedAtDate: q.served, nAtDate: q.remaining }],
    });
    wellFormed(s);
    near(s.metrics[0].value, want.provision, 0.01);
  });

  it("BK_GIFT: a trust whose surplus the ceiling removes", () => {
    const q = GIFT_CASE;
    const want = solveGift(q);
    const s = solveDbYear({
      plan: "postEmployment",
      year: q.year,
      terms: { kind: "amounts" },
      groups: q.tiers.map((t, k) => {
        const ben0 = q.start[k].cost / t.window;
        return {
          name: t.name,
          heads: q.start[k].heads,
          stay: 1,
          served: q.year - q.since,
          nEnd: q.start[k].remaining - 1,
          accruedStart: ben0 * (q.year - q.since),
          addedThisYear: ben0,
          atEnd: { heads: q.end[k].heads },
        };
      }),
      iStart: q.iStart,
      iEnd: q.iEnd,
      closingGiven: want.liability.closing,
      assets: { opening: 0, closing: q.fvEnd, contributions: [{ amount: q.deposit.amount, month: q.deposit.month }], ceiling: { kind: "zero" } },
    });
    wellFormed(s);
    const d = db(s);
    near(d.opening, want.liability.opening);
    near(d.service, want.liability.service);
    near(d.pn, want.liability.pn);
    near(d.assetInterest, want.assets.interest);
    near(d.recognisedClose, want.assets.closing);
    near(d.oci, want.oci);
    near(d.net, 0, 1);
  });

  it("BK_THREE: the CEO's plan is not here, but the note's two years complete by the balancing line", () => {
    const q = THREE_CASE.sales;
    const want = solveThree(THREE_CASE).sales;
    const y1 = solveNoteYear({
      year: THREE_CASE.years[0],
      rate: q.y1.rate,
      obligation: { opening: q.opening, service: q.y1.service, payments: q.y1.paid, closing: q.y1.closing },
      assets: { opening: q.assetsOpening, contributions: q.y1.deposits, paid: q.y1.paidFromAssets, closing: q.y1.assetsClosing },
    });
    wellFormed(y1);
    const d1 = y1.detail as { pn: number; assetPn: number };
    near(d1.pn, want.y1.pn);
    near(d1.assetPn, want.a1.pn);
    const y2 = solveNoteYear({
      year: THREE_CASE.years[1],
      rate: q.y2.rate,
      obligation: { opening: q.y1.closing, service: q.y2.service, pn: -q.y2.pn, closing: q.y2.closing },
      assets: { opening: q.y1.assetsClosing, contributions: q.y2.deposits, paid: q.y2.paidFromAssets, closing: q.y2.assetsClosing },
    });
    wellFormed(y2);
    near((y2.detail as { payments: number }).payments, want.y2.paid);
  });

  it("Exam 2: an amendment with plan assets remeasured at fair value on its day", () => {
    const q = FINAL_MGMT;
    const want = solveMgmt(q);
    const H = want.H;
    const s = solveDbYear({
      plan: "postEmployment",
      year: want.y1 + 1,
      terms: { kind: "salary", share: 1 },
      groups: [{ name: "הנהלה", heads: H, stay: 1, served: want.s0 + 1, nEnd: want.T - want.s0 - 2, salary: want.final }],
      iStart: q.r1,
      iEnd: q.r2,
      event: { type: "amend", month: q.month, rate: q.rAm, terms: { kind: "salary", share: 1 + q.add } },
      assets: { opening: q.assets0.closing, closing: q.assets1.closing, atEvent: q.assets1.atAmend, contributions: [{ amount: q.assets1.contrib, month: 12 }], ceiling: { kind: "none" } },
    });
    wellFormed(s);
    const d = db(s);
    near(d.opening, want.o1.opening);
    near(d.service, want.o1.service);
    near(d.past, want.o1.past);
    near(d.interest, want.o1.interest);
    near(d.pn, want.o1.pn);
    near(d.assetInterest, want.a1.interest);
    near(d.assetPn, want.a1.pn);
    near(d.oci, want.pl1.oci);
    near(d.net, want.pl1.net);
  });

  it("Exam 1: a grant on the plan's formula and one on a straight line, cancelled mid-year by payment", () => {
    const q = FINAL_CANCEL;
    const want = solveCancel(q);
    const m = q.month;
    // The operations employee: the plan's own formula.
    const a = solveDbYear({
      plan: "otherLongTerm",
      year: q.year + 1,
      terms: { kind: "tiers", tiers: [{ upTo: q.ops.firstYears, perYear: q.ops.first }, { perYear: q.ops.later }] },
      groups: [{ name: "נועה", heads: 1, stay: 1, served: want.A.served, nEnd: want.A.n - 1, expected: want.A.T, atEnd: { heads: 0 } }],
      iStart: q.r0,
      iEnd: q.rM,
      event: { type: "settle", month: m, rate: q.rM, share: 1, paid: q.pay[0], paidFromAssets: false },
    });
    wellFormed(a);
    near(db(a).opening, want.A.opening, 0.01);
    near(db(a).service, want.A.service, 0.01);
    near(db(a).settlementGain, -want.perPerson[0], 0.01);
    // The business development employee: later years are higher, so straight line. Its grants grow every year, entered as amounts.
    const c = solveDbYear({
      plan: "otherLongTerm",
      year: q.year + 1,
      terms: { kind: "lump", grant: want.C.total, window: want.C.T },
      groups: [{ name: "איתי", heads: 1, stay: 1, served: want.C.served, nEnd: want.C.n - 1, atEnd: { heads: 0 } }],
      iStart: q.r0,
      iEnd: q.rM,
      event: { type: "settle", month: m, rate: q.rM, share: 1, paid: q.pay[1], paidFromAssets: false },
    });
    wellFormed(c);
    near(db(c).opening, want.C.opening, 0.01);
    near(db(c).settlementGain, -want.perPerson[1], 0.01);
  });

  it("Exam 4 א׳: a grant cut by agreement with compensation, at year end", () => {
    const q = FINAL_THREE;
    const want = solveThreeAgree(q).a;
    const G = q.grant;
    const Y = G.units.length;
    const s = solveDbYear({
      plan: "otherLongTerm",
      year: q.start + 1,
      terms: { kind: "amounts" },
      groups: [{ name: "הנהלה", heads: G.heads, stay: 1, served: 1, nEnd: Y - 2, accruedStart: G.units[0], addedThisYear: G.units[1] }],
      iStart: G.r0,
      iEnd: G.r1,
      event: { type: "amend", month: 12, rate: G.r1, terms: { kind: "lump", grant: G.newAmount, window: Y }, compensation: G.heads * G.comp },
    });
    wellFormed(s);
    const d = db(s);
    near(d.opening, want.opening);
    near(d.service, want.service);
    near(d.past, want.past);
    near(d.pl, want.total);
  });

  it("BK_TIERED: tiers with a cap, straight line, each group with its own window", () => {
    const q = TIERED_CASE;
    const want = solveTiered(q);
    const y = q.years[0];
    const groups = q.prod.groups.map((g, k) => ({ g, k, T: g.ends - g.hired + 1 })).filter((x) => x.T > 5);
    const s = solveDbYear({
      plan: "postEmployment",
      year: y,
      terms: { kind: "tiers", tiers: [{ upTo: 5, perYear: q.prod.first }, { perYear: q.prod.next }], cap: q.prod.cap },
      groups: groups.map(({ g, T }) => ({ name: String(g.hired), heads: g.heads, stay: 1, served: y - g.hired, nEnd: T - (y - g.hired) - 1, expected: T })),
      iStart: q.rate,
      iEnd: q.rate,
    });
    wellFormed(s);
    const rows = want.prod.filter((p) => p.T > 5);
    near(db(s).opening, sum(rows.map((p) => p.opening)));
    near(db(s).closing, sum(rows.map((p) => p.close1)));
    near(db(s).service, sum(rows.map((p) => p.service1)));
  });

  it("Exam 6: a cliff grant, and a trust the ceiling caps", () => {
    const q = FINAL_TRUST;
    const want = solveTrust(q);
    const B = q.db;
    const s = solveDbYear({
      plan: "postEmployment",
      year: q.year,
      terms: { kind: "lump", grant: B.grant, window: B.vestYears },
      groups: [{ name: "העובדים", heads: want.h0, stay: 1, served: want.s0, nEnd: want.n0 - 1, atEnd: { heads: want.h1 } }],
      iStart: q.r0,
      iEnd: q.r1,
      assets: { opening: 0, closing: q.fv, contributions: [{ amount: q.deposit.amount, month: q.deposit.month }], ceiling: { kind: "zero" } },
    });
    wellFormed(s);
    const d = db(s);
    near(d.pn, want.o.pn);
    near(d.assetInterest, want.a.interest);
    near(d.netInterest, want.pl.netInterest);
    near(d.oci, want.pl.oci);
    near(d.net, want.net);
  });

  it("Exam 7: a surplus under a minimum funding requirement (IFRIC 14)", () => {
    const q = FINAL_MFR;
    const want = solveMfr(q);
    const s = solveDbYear({
      plan: "postEmployment",
      year: q.year,
      terms: { kind: "perYear", amount: want.per },
      groups: [{ name: "העובדים", heads: 1, stay: 1, served: want.s0, nEnd: want.n0 - 1 }],
      iStart: q.rate,
      iEnd: q.rate,
      assets: { opening: q.fvOpen, closing: q.fvClose, contributions: [{ amount: q.mfr, month: 12 }], ceiling: { kind: "mfr", servicePerYear: want.per, futureAtStart: want.n0, minimum: q.mfr } },
    });
    wellFormed(s);
    const d = db(s);
    near(d.opening, want.obOpen);
    near(d.closing, want.obClose);
    near(d.netInterest, want.netInterest);
    near(d.effectChange, want.effectChange);
    near(d.recognisedClose - d.closing, want.asset1);
  });

  it("Exam 8: a settlement paid from the fund, a retirement on the plan's terms, and the rest of a year", () => {
    const q = FINAL_INTEGRATED;
    const want = solveIntegrated(q);
    const s = solveDbYear({
      plan: "postEmployment",
      year: q.year,
      terms: { kind: "lump", grant: want.ben, window: want.T },
      groups: [{ name: "העובדים", heads: q.heads, stay: 1, served: want.s1, nEnd: want.n1 - 1, atEnd: { heads: want.h3 } }],
      iStart: want.r1,
      iEnd: q.rEnd,
      event: { type: "settle", month: q.month, rate: q.rMid, share: q.settled.heads / q.heads, paid: q.settled.premium, paidFromAssets: true },
      payments: [{ amount: want.retiredPaid, month: 12, fromAssets: true }],
      assets: { opening: want.assetsOpen, closing: q.fvEnd, contributions: [{ amount: q.contrib, month: 12 }], ceiling: { kind: "none" } },
    });
    wellFormed(s);
    const d = db(s);
    near(d.opening, want.opening);
    near(d.service, want.sv1 + want.sv2);
    near(d.interest, want.i1 + want.i2);
    near(d.settlementGain, -want.settleLoss);
    near(d.closing, want.closing);
    near(d.pn, want.pnMid + want.pnEnd);
    near(d.assetInterest, want.ai1 + want.ai2);
    near(d.assetPn, want.assetPn);
    near(d.oci, want.pl.oci);
    near(d.net, want.netLiability);
  });

  it("a journal entry equals the movement in the net balance, with the ceiling and a settlement", () => {
    for (const s of [
      solveDbYear({ plan: "postEmployment", year: 2026, terms: { kind: "perYear", amount: 1000 }, groups: [{ name: "א", heads: 10, stay: 0.9, served: 4, nEnd: 6 }], iStart: 0.05, iEnd: 0.04, event: { type: "settle", month: 6, rate: 0.045, share: 0.25, paid: 9000, paidFromAssets: false }, assets: { opening: 60_000, closing: 90_000, contributions: [{ amount: 5000, month: 3 }], ceiling: { kind: "amount", opening: 1000, closing: 2000 } } }),
      solveDbYear({ plan: "otherLongTerm", year: 2026, terms: { kind: "lump", grant: 12_000, window: 6 }, groups: [{ name: "א", heads: 5, stay: 1, served: 2, nEnd: 3 }], iStart: 0.06, iEnd: 0.05, payments: [{ amount: 1000, month: 4 }] }),
    ]) {
      wellFormed(s);
      const d = db(s);
      near(d.pl + d.oci - d.cash, d.net - d.netOpen, 0.01);
    }
  });
});

describe("the calculator against the course's questions: other long-term", () => {
  it("BK_OLT: a sabbatical, an extra month with leavers revised, and a bonus on each year's profit", () => {
    const q = OLT_CASE;
    const want = solveOlt(q);
    const D = q.dev;
    const dev = solveDbYear({
      plan: "otherLongTerm",
      year: q.year,
      terms: { kind: "lump", grant: want.dev.pay, window: D.serviceYears },
      groups: [{ name: "פיתוח", heads: D.staff, stay: D.p, served: 1, nEnd: D.serviceYears - 2 }],
      iStart: q.rate,
      iEnd: q.rate,
    });
    wellFormed(dev);
    near(db(dev).closing, want.dev.closing);
    near(db(dev).pn, want.dev.pn, 1);
    near(db(dev).pl, want.dev.service + want.dev.interest + want.dev.pn);
    const B = q.buy;
    const buy = solveDbYear({
      plan: "otherLongTerm",
      year: q.year,
      terms: { kind: "lump", grant: want.buy.pay, window: B.serviceYears },
      groups: [{ name: "רכש", heads: B.staff, stay: B.p0, served: 1, nEnd: B.serviceYears - 2, atEnd: { stay: B.p1 } }],
      iStart: q.rate,
      iEnd: q.rate,
    });
    near(db(buy).pn, want.buy.pn);
    const M = q.mgmt;
    const mgmt = solveDbYear({
      plan: "otherLongTerm",
      year: q.year,
      terms: { kind: "amounts" },
      groups: [{ name: "הנהלה", heads: M.heads, stay: 1, served: 1, nEnd: 1, accruedStart: M.share * M.profits[0], addedThisYear: M.share * M.profits[1] }],
      iStart: q.rate,
      iEnd: q.rate,
    });
    near(db(mgmt).opening, want.mgmt.opening);
    near(db(mgmt).service, want.mgmt.service);
    near(db(mgmt).closing, want.mgmt.closing);
  });

  it("a disability benefit that doesn't depend on service waits for the event", () => {
    assert.equal(solveDisabilityEvent({ year: 2026, amount: 500, happened: false }).metrics[0].value, 0);
    assert.equal(solveDisabilityEvent({ year: 2026, amount: 500, happened: true }).metrics[0].value, 500);
  });
});

describe("the calculator against the course's questions: short-term", () => {
  const fromCase = (c: typeof ALON, mode: "A" | "B"): AbsenceInput => ({
    year: 2026,
    order: "lifo",
    vest: mode === "B" ? 1 : 0,
    grades: [{ name: "כולם", dayCost: c.dayCost, entitlement: c.entitlement, carried: c.carried, years: c.years }],
    opening: c.opening.map((g) => ({ name: g.name, grade: 0, staff: g.staff, use: g.use, leaves: g.leaves })),
    actual: c.actual.map((g) => ({ name: g.name, grade: 0, staff: g.staff, use: g.use, leaves: g.leaves })),
  });

  it("the lecture's example and the lesson's walkthrough, vesting and not", () => {
    for (const c of [LECTURE_21, ALON])
      for (const mode of ["A", "B"] as const) {
        const want = solveAbsence(c, mode);
        const got = solveAbsences(fromCase(c, mode));
        near(got.opening, want.opening$, 0.01);
        near(got.paid, want.paid, 0.01);
        near(got.closing, want.closing$, 0.01);
        near(got.expense, want.expense, 0.01);
        wellFormed(solveAbsenceBenefit(fromCase(c, mode)));
      }
  });

  it("BK_SHORT: vacation on LIFO across three grades, with a manager expected to leave", () => {
    const q = SHORT_CASE;
    const want = solveShort(q);
    const v = q.vacation;
    const got = solveAbsences({
      year: q.year,
      order: "lifo",
      vest: 1,
      grades: q.grades.map((g, i) => ({ name: g.name, dayCost: want.dayCost[i], entitlement: g.vacation, carried: [v.carried[i]], years: 1 })),
      opening: q.grades.map((g, i) => ({ name: g.name, grade: i, staff: g.staff, use: v.expectedNow[i], leaves: false })),
      actual: q.grades.flatMap((g, i) => {
        const next = v.expectedNext[i];
        const nextUse = next === "max" ? undefined : next;
        const row = { name: g.name, grade: i, use: v.actual[i], leaves: false, nextUse };
        return i === 0 ? [{ ...row, staff: g.staff - q.leavers }, { ...row, name: "עוזב", staff: q.leavers, nextLeaves: true }] : [{ ...row, staff: g.staff }];
      }),
    });
    near(got.opening, want.vacation.opening);
    near(got.paid, want.vacation.paid);
    near(got.closing, want.vacation.closing);
    near(got.expense, want.vacation.expense);
  });

  it("BK_SHORT: the retreat, new this year, carried for one year", () => {
    const q = SHORT_CASE;
    const want = solveShort(q);
    const got = solveAbsences({
      year: q.year,
      order: "fifo",
      vest: 0,
      grades: q.grades.map((g, i) => ({ name: g.name, dayCost: want.dayCost[i], entitlement: g.retreat, carried: [], years: 1 })),
      opening: [],
      actual: q.grades.flatMap((g, i) => {
        const not = q.retreat.notUsed[i];
        const will = q.retreat.willUse[i];
        return [
          { name: "ניצלו", grade: i, staff: g.staff - not, use: g.retreat, leaves: false },
          { name: "ינצלו", grade: i, staff: will, use: 0, leaves: false, nextUse: g.retreat },
          { name: "לא ינצלו", grade: i, staff: not - will, use: 0, leaves: false, nextUse: 0 },
        ];
      }),
    });
    near(got.paid, want.retreat.paid);
    near(got.closing, want.retreat.closing);
  });

  it("Exam 3: vacation on FIFO, half paid to leavers, at the salary it will be paid at", () => {
    const q = FINAL_SHORT;
    const want = solveShortExam(q);
    const S = q.start;
    const E = q.end;
    const stay0 = S.staff - q.actual.leavers;
    const got = solveAbsences({
      year: q.year,
      order: "fifo",
      vest: q.payout,
      grades: [{ name: "כולם", dayCost: want.day[1], entitlement: q.vacation, carried: [S.balance], years: 1 }],
      opening: [
        { name: "צפויים לעזוב", grade: 0, staff: S.leavers, use: 0, leaves: true, dayCost: want.day[0] },
        { name: "נשארים", grade: 0, staff: S.staff - S.leavers, use: S.balance * S.use, leaves: false },
      ],
      actual: [
        { name: "עזבו", grade: 0, staff: q.actual.leavers, use: 0, leaves: true, dayCostPaid: want.day[0] },
        { name: "צפויים לעזוב", grade: 0, staff: E.leavers, use: q.actual.used / stay0, leaves: false, nextUse: 0, nextLeaves: true, dayCostClose: want.day[1] },
        { name: "נשארים", grade: 0, staff: E.staff - E.leavers, use: q.actual.used / stay0, leaves: false, nextUse: want.balance1 * E.use, dayCostClose: want.day[2] },
      ],
    });
    near(got.opening, want.v.opening);
    near(got.paid, want.v.paid);
    near(got.closing, want.v.closing);
    near(got.expense, want.v.expense);
    near(solveNonAccumulating({ year: q.year, days: q.choice.used, dayCost: want.day[1], payShare: q.choice.pay }).metrics[0].value, want.choice);
  });

  it("a bonus: no obligation means nothing; with one, its on-costs and who is expected to get it", () => {
    assert.equal(solveBonus({ year: 2026, obligation: false, base: 100, baseCalc: "", onCost: 0, stayShare: 1, opening: 0, paid: 0 }).metrics[0].value, 0);
    const s = solveBonus({ year: 2026, obligation: true, base: 100_000, baseCalc: "", onCost: 0.07, stayShare: 0.9, opening: 5_000, paid: 5_000 });
    wellFormed(s);
    near(s.metrics[0].value, 96_300);
    near(s.metrics[1].value, 96_300);
  });
});

describe("the calculator against the course's questions: the rest", () => {
  it("Exam 4 ב׳: termination, and the stay-on bonus spread over service", () => {
    const want = solveThreeAgree(FINAL_THREE);
    const T = FINAL_THREE.term;
    const s = solveTermination({ year: FINAL_THREE.start, recognised: true, offer: false, heads: T.staff, amount: T.base, stay: { extra: T.stay - T.base, stayers: want.stayers, serviceMonths: want.months, monthsElapsed: 1 } });
    wellFormed(s);
    near(s.metrics[0].value, want.provision);
    near(s.metrics[1].value, want.stayAccrued);
    assert.equal(solveTermination({ year: 2026, recognised: false, offer: false, heads: 1, amount: 1 }).metrics[0].value, 0);
  });

  it("Exam 8: a termination paid more than a year after year end is discounted", () => {
    const want = solveIntegrated(FINAL_INTEGRATED);
    const T = FINAL_INTEGRATED.term;
    const s = solveTermination({ year: FINAL_INTEGRATED.year, recognised: true, offer: false, heads: T.heads, amount: T.amount, yearsToPay: want.nTerm, rate: FINAL_INTEGRATED.rEnd });
    near(s.metrics[0].value, want.termProvision);
    const near12 = solveTermination({ year: 2026, recognised: true, offer: true, heads: 10, amount: 100, yearsToPay: 1, rate: 0.1 });
    near(near12.metrics[0].value, 1000);
  });

  it("defined contribution: the expense is the deposit, and what wasn't moved is a liability", () => {
    const s = solveDcPlans({ year: 2026, plans: [{ name: "פנסיה", expense: 7_000, calc: "", paid: 6_000 }, { name: "סעיף 14", expense: 3_000, calc: "", paid: 3_000 }] });
    wellFormed(s);
    assert.equal(s.metrics[0].value, 10_000);
    assert.equal(s.metrics[1].value, 1_000);
  });

  it("completing a note recovers the hidden rate", () => {
    const s = solveNoteYear({ year: 2026, obligation: { opening: 1000, service: 100, interest: 50, payments: 30, closing: 1200 } });
    wellFormed(s);
    const d = s.detail as { rate: number; pn: number };
    near(d.rate, 0.05, 1e-9);
    near(d.pn, 80, 1e-9);
  });
});

describe("the questionnaire: every branch reaches a solution", () => {
  /** Walks the questions, answering by script, and by each question's own example where the script says nothing. */
  function walk(script: Record<string, string | string[]>) {
    const a: Answers = {};
    for (let guard = 0; guard < 60; guard++) {
      const q = questionsFor(a).find((x) => !(x.id in a));
      if (!q) break;
      if (q.kind === "choice" || q.kind === "multi") {
        assert.ok(script[q.id] !== undefined || q.kind === "multi", `no answer scripted for ${q.id}`);
        a[q.id] = script[q.id] ?? [];
      } else if (q.kind === "form") {
        a[q.id] = "";
        for (const f of q.fields) if (f.example !== undefined) a[f.id] = String(f.example);
        for (const f of q.fields) if (typeof script[f.id] === "string") a[f.id] = script[f.id];
      } else {
        a[q.id] = q.example;
      }
    }
    for (const q of questionsFor(a)) assert.deepEqual(errorsFor(q, a), [], q.id);
    return { a, s: solveAnswers(a) };
  }

  const company = { type: "post", risk: "company" };
  const branches: Record<string, string | string[]>[] = [
    { type: "short", shortKind: "bonus", bonusObligation: "yes" },
    { type: "short", shortKind: "bonus", bonusObligation: "no" },
    { type: "short", shortKind: "absence", accumulates: "no", payer: "company" },
    { type: "short", shortKind: "absence", accumulates: "no", payer: "other" },
    { type: "short", shortKind: "absence", accumulates: "yes", vesting: "full", order: "lifo" },
    { type: "short", shortKind: "absence", accumulates: "yes", vesting: "partial", order: "fifo" },
    { type: "short", shortKind: "absence", accumulates: "yes", vesting: "none", order: "lifo" },
    { type: "post", risk: "employee", dcHow: "payroll" },
    { type: "post", risk: "employee", dcHow: "s14" },
    { ...company, mode: "measure", benefit: "perYear" },
    { ...company, mode: "measure", benefit: "salary", salaryHow: "grow" },
    { ...company, mode: "measure", benefit: "routes" },
    { ...company, mode: "year", benefit: "perYear", events: [], presentation: "finance" },
    { ...company, mode: "year", benefit: "salary", salaryHow: "final", events: ["assets", "payments"], ceiling: "none", presentation: "salary" },
    { ...company, mode: "year", benefit: "lump", events: ["assets", "amend"], amendBenefit: "lump", ceiling: "zero", presentation: "finance" },
    { ...company, mode: "year", benefit: "tiers", events: ["assets", "settle"], settleFrom: "assets", ceiling: "amount", presentation: "finance" },
    { ...company, mode: "year", benefit: "amounts", events: ["assets"], ceiling: "mfr", presentation: "finance" },
    { ...company, mode: "year", benefit: "routes", events: [], presentation: "finance" },
    { ...company, mode: "note", noteHasAssets: "yes" },
    { type: "olt", oltKind: "regular", mode: "year", benefit: "lump", events: ["amend"], amendBenefit: "lump" },
    { type: "olt", oltKind: "regular", mode: "measure", benefit: "lump" },
    { type: "olt", oltKind: "disability", disDepends: "no", disHappened: "yes" },
    { type: "olt", oltKind: "disability", disDepends: "no", disHappened: "no" },
    { type: "olt", oltKind: "disability", disDepends: "yes", mode: "year", benefit: "perYear", events: [] },
    { type: "term", termType: "decision", termRecognised: "no" },
    { type: "term", termType: "decision", termRecognised: "yes", termHasStay: "yes", termLate: "no" },
    { type: "term", termType: "offer", termRecognised: "yes", termHasStay: "no", termLate: "yes" },
    { type: "unsure", c1: "yes", termType: "decision", termRecognised: "no" },
    { type: "unsure", c1: "no", c2: "yes", shortKind: "bonus", bonusObligation: "no" },
    { type: "unsure", c1: "no", c2: "no", c3: "yes", risk: "employee", dcHow: "s14" },
    { type: "unsure", c1: "no", c2: "no", c3: "no", oltKind: "disability", disDepends: "no", disHappened: "no" },
  ];

  it(`${branches.length} branches`, () => {
    for (const b of branches) {
      const { s } = walk(b);
      wellFormed(s);
      assert.ok(s.steps.length > 0, JSON.stringify(b));
    }
  });

  it("the classification tree ends at the right kind", () => {
    assert.equal(kindOf({ type: "unsure", c1: "yes" }), "term");
    assert.equal(kindOf({ type: "unsure", c1: "no", c2: "yes" }), "short");
    assert.equal(kindOf({ type: "unsure", c1: "no", c2: "no", c3: "no" }), "olt");
    assert.equal(kindOf({ type: "unsure", c1: "no", c2: "no", c3: "yes", risk: "company" }), "db");
  });

  it("a note with two missing lines, or none, is refused", () => {
    const q = questionsFor({ type: "post", risk: "company", mode: "note" }).find((x) => x.id === "noteOb")!;
    assert.ok(errorsFor(q, { year: "2026", nOpening: "100", nService: "10" }).length > 0);
    assert.ok(errorsFor(q, { year: "2026", nOpening: "100", nService: "10", nInterest: "5", nPayments: "1", nPn: "1", nClosing: "115" }).length > 0);
  });

  it("the next year opens with this year's closing", () => {
    const { a, s } = walk({ ...company, mode: "year", benefit: "perYear", events: [], presentation: "finance" });
    const next = nextYearAnswers(a);
    next.iEnd = "4";
    near(db(solveAnswers(next)).opening, db(s).closing, 0.01);
  });
});
