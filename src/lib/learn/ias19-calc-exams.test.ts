import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { solveAbsence } from "./ias19-absence";
import { ABSENCE_EXAMS } from "./ias19-absence-cases";
import { solveNote } from "./ias19-booklet";
import { BK_NOTE, NOTE_CASE } from "./ias19-booklet-cases";
import type { CalcSolution } from "./ias19-calc";
import { type Answers, canContinue, errorsFor, nextYearAnswers, questionsFor, type Row, solveAnswers } from "./ias19-calc-flow";
import { EXAM_A, EXAM_B, examA, examB } from "./ias19-exams";
import { FINAL_CANCEL, FINAL_EXAMS, FINAL_INTEGRATED, FINAL_MFR, FINAL_MGMT, FINAL_SALES, FINAL_SHORT, FINAL_THREE, FINAL_TRUST, solveCancel, solveIntegrated, solveMfr, solveMgmt, solveSales, solveShortExam, solveThreeAgree, solveTrust } from "./ias19-finals";

/**
 * Every exam in the course, entered the way a reader enters it: only through
 * the questionnaire's own questions, with what the exam's text gives. The test
 * then looks for each answer among the numbers the solution shows.
 */

const S = (x: number) => String(x);

/** Solves through the questionnaire: every question it asks must be answered, and nothing it doesn't ask may be. */
function run(a: Answers): CalcSolution {
  const qs = questionsFor(a);
  const allowed = new Set<string>();
  for (const q of qs) {
    allowed.add(q.id);
    if (q.kind === "form") q.fields.forEach((f) => allowed.add(f.id));
    if (q.kind === "rows") {
      const cols = new Set(q.columns.map((c) => c.id));
      for (const r of (a[q.id] as Row[]) ?? []) for (const k of Object.keys(r)) assert.ok(cols.has(k), `${q.id} has no column ${k}`);
    }
    assert.deepEqual(errorsFor(q, a), [], q.id);
  }
  for (const k of Object.keys(a)) assert.ok(allowed.has(k), `no question holds ${k}`);
  return solveAnswers(a);
}

/** Every number the solution shows. */
function shown(s: CalcSolution) {
  const v: number[] = s.metrics.map((m) => Math.abs(m.value));
  const parse = (c: string | number) => {
    if (typeof c === "number") return v.push(Math.abs(c));
    const n = Number(c.replace(/[(),]/g, ""));
    if (c.trim() && Number.isFinite(n)) v.push(Math.abs(n));
  };
  for (const st of s.steps) {
    for (const r of st.rolls ?? []) r.rows.forEach((x) => v.push(Math.abs(x.value)));
    for (const n of st.notes ?? []) n.lines.forEach((l) => l.value !== undefined && v.push(Math.abs(l.value)));
    for (const t of st.tables ?? []) {
      t.rows.forEach((r) => r.forEach(parse));
      t.foot?.forEach(parse);
    }
    for (const j of st.journal ?? []) j.lines.forEach((l) => v.push(l.dr ?? l.cr ?? 0));
  }
  return v;
}
/** The course's own tolerance: a shekel and a half, or 0.2% where rounded rates are involved. */
const close = (got: number, want: number) => Math.abs(Math.abs(got) - Math.abs(want)) <= Math.max(1.5, Math.abs(want) * 0.002);
function expectShown(sols: CalcSolution[], items: { label: string; value: number }[]) {
  const all = sols.flatMap(shown);
  for (const c of items) assert.ok(all.some((x) => close(x, c.value)), `${c.label} = ${c.value} isn't in the solution`);
}
const checksOf = (id: string) => FINAL_EXAMS.find((q) => q.id === id)!.checks;
const db: Answers = { type: "post", risk: "company", mode: "year", hasNote: "no" };
const olt: Answers = { type: "olt", oltKind: "regular", mode: "year" };

describe("every exam, through the questionnaire", () => {
  it("salary growth: this year's salary rises once for each year to payment", () => {
    const q = FINAL_INTEGRATED;
    const w = solveIntegrated(q);
    const base: Answers = { ...db, benefit: "salary", perGroup: "same", termsForm: "", share: "100", events: [], ratesForm: "", year: "2026", iStart: S(w.r1 * 100), iEnd: "5", presentation: "finance" };
    const grow = run({ ...base, salaryHow: "grow", groups: [{ name: "כולם", heads: S(q.heads), served: S(w.s1), n: S(w.n1 - 1), salaryNow: S(q.salary * (1 + q.raise)), growth: S(q.raise * 100) }] });
    expectShown([grow], [{ label: "פתיחה", value: w.opening }]);
  });

  it("exam 1: two grants in one run, cancelled mid-year, with no year-end rate", () => {
    const q = FINAL_CANCEL;
    const w = solveCancel(q);
    const s = run({
      ...db,
      benefit: "tiers",
      perGroup: "differ",
      events: ["settle"],
      groups: [
        { name: "נועה", heads: "1", served: S(w.A.served), n: S(w.A.n - 1), expected: S(w.A.T), t1: S(q.ops.first), t1Years: S(q.ops.firstYears), t2: S(q.ops.later) },
        { name: "איתי", heads: "1", served: S(w.C.served), n: S(w.C.n - 1), expected: S(w.C.T), t1: S(q.dev.first), t1Years: S(q.dev.firstYears), t2Growth: S(q.dev.growth * 100) },
      ],
      settleFrom: "company",
      settleForm: "",
      settleMonth: S(q.month),
      settleRate: S(q.rM * 100),
      settleShare: "100",
      settlePaid: S(q.pay[0] + q.pay[1]),
      ratesForm: "",
      year: "2026",
      iStart: S(q.r0 * 100),
      presentation: "finance",
    });
    expectShown([s], checksOf("mx-cancel"));
    // The grant that grows every year is added up, and spread on a straight line.
    assert.ok(s.steps[0].notes![0].lines.some((l) => l.text?.includes("קו ישר") && l.text.includes(Math.round(w.C.total).toLocaleString("en-US"))));
  });

  it("exam 2: two years, the note's rate and headcount, the amendment as an addition", () => {
    const q = FINAL_MGMT;
    const w = solveMgmt(q);
    const y25: Answers = {
      ...db,
      hasNote: "yes",
      noteHelp: "",
      hAssetOpen: S(q.assets0.opening),
      hAssetInterest: S(w.assetInterest0),
      hDcDeposit: S(w.dcDeposit0),
      hDcPerHead: S(12 * w.sal(w.y1) * q.dcRate),
      benefit: "salary",
      salaryHow: "grow",
      perGroup: "same",
      termsForm: "",
      share: "100",
      events: ["assets"],
      groups: [{ name: "הנהלה", heads: S(w.H), served: S(w.s0), n: S(w.T - w.s0 - 1), salaryNow: S(w.sal(w.y1)), growth: S(q.raise * 100) }],
      ratesForm: "",
      year: "2025",
      iEnd: S(q.r1 * 100),
      assetsForm: "",
      assetsOpen: S(q.assets0.opening),
      assetsClose: S(q.assets0.closing),
      contributions: [{ amount: S(q.assets0.contrib), month: "12" }],
      ceiling: "none",
      presentation: "finance",
    };
    const first = run(y25);
    assert.ok(canContinue(y25));
    // The next year, as the "continue" button carries it: only what's new is entered.
    const next = nextYearAnswers(y25);
    const y26: Answers = { ...next, events: ["assets", "amend"], iEnd: S(q.r2 * 100), amendType: "add", amendBenefit: "salary", amendForm: "", amendMonth: S(q.month), amendRate: S(q.rAm * 100), amend_share: S(q.add * 100), assetsClose: S(q.assets1.closing), assetsEvent: S(q.assets1.atAmend), contributions: [{ amount: S(q.assets1.contrib), month: "12" }] };
    delete y26.assetsReturn;
    const second = run(y26);
    expectShown([first, second], [...checksOf("mx-mgmt"), { label: "OCI 2025", value: w.pl0.oci }, { label: "OCI 2026", value: w.pl1.oci }]);
  });

  it("exam 3: the 13th salary, vacation on FIFO with half to leavers, and choice days", () => {
    const q = FINAL_SHORT;
    const w = solveShortExam(q);
    const T = q.start;
    const E = q.end;
    const stay0 = T.staff - q.actual.leavers;
    const bonus = run({ type: "short", shortKind: "bonus", bonusObligation: "yes", bonusForm: "", year: "2025", bonusHeads: S(E.staff - E.leavers), bonusPerHead: S(w.sal[2]), bonusOpening: S((T.staff - T.leavers) * w.sal[1]), bonusPaid: S(stay0 * w.sal[1]) });
    const vac = run({
      type: "short",
      shortKind: "absence",
      accumulates: "yes",
      vesting: "partial",
      order: "fifo",
      absForm: "",
      year: "2025",
      vestShare: "50",
      lifeYears: "1",
      grades: [{ name: "כולם", salary: S(w.sal[1]), workDays: "21", entitlement: S(q.vacation), carried: S(T.balance) }],
      openingRows: [
        { name: "עוזבים", staff: S(T.leavers), use: "0", leaves: true, dayCost: S(w.day[0]) },
        { name: "נשארים", staff: S(T.staff - T.leavers), useShare: S(T.use * 100), leaves: false },
      ],
      actualRows: [
        { name: "עזבו", staff: S(q.actual.leavers), use: "0", leaves: true, dayCostPaid: S(w.day[0]) },
        { name: "צפויים לעזוב", staff: S(E.leavers), use: S(q.actual.used / stay0), leaves: false, nextUse: "0", nextLeaves: true, dayCostClose: S(w.day[1]) },
        { name: "נשארים", staff: S(E.staff - E.leavers), use: S(q.actual.used / stay0), leaves: false, nextShare: S(E.use * 100), dayCostClose: S(w.day[2]) },
      ],
    });
    const choice = run({ type: "short", shortKind: "absence", accumulates: "no", payer: "company", nonAccForm: "", year: "2025", naDays: S(q.choice.used), salary: S(w.sal[1]), workDays: "21", naPay: S(q.choice.pay * 100) });
    expectShown([bonus, vac, choice], checksOf("mx-short"));
  });

  it("exam 4: a grant cut with compensation, termination, and section 14", () => {
    const q = FINAL_THREE;
    const w = solveThreeAgree(q);
    const G = q.grant;
    const a = run({ ...olt, benefit: "amounts", events: ["amend"], groups: [{ name: "הנהלה", heads: S(G.heads), served: "1", n: S(G.units.length - 2), accruedStart: S(G.units[0]), addedThisYear: S(G.units[1]) }], amendType: "replace", amendBenefit: "lump", amendForm: "", amendMonth: "12", amendRate: S(G.r1 * 100), amend_grant: S(G.newAmount), amend_window: S(G.units.length), amendComp: S(G.heads * G.comp), ratesForm: "", year: "2026", iStart: S(G.r0 * 100), iEnd: S(G.r1 * 100) });
    const T = q.term;
    const b = run({ type: "term", termType: "decision", termRecognised: "yes", termForm: "", year: "2025", termHeads: S(T.staff), termAmount: S(T.base), termHasStay: "yes", termStay: "", stayExtra: S(T.stay - T.base), stayers: S(w.stayers), stayMonths: S(w.months), stayElapsed: "1", termLate: "no" });
    const D = q.dc;
    const c = run({ type: "post", risk: "employee", dcHow: "s14", s14Rows: [{ name: "הסכם ג׳", staff: S(D.staff), salary: S(D.salary * (1 + D.raise) ** 3) }], yearForm: "", year: "2026" });
    expectShown([a, b, c], [...checksOf("mx-three"), { label: "סה״כ א׳", value: w.a.total }]);
  });

  it("exam 5: vacation, and a grant with a leaver on 1.1 and a joiner in October", () => {
    const q = FINAL_SALES;
    const w = solveSales(q);
    const V = q.vac;
    const vac = run({ type: "short", shortKind: "absence", accumulates: "yes", vesting: "full", order: "lifo", absForm: "", year: "2025", lifeYears: "1", grades: [{ name: "תפעול", salary: S(V.salary * (1 + V.raise)), workDays: S(V.days), entitlement: S(V.entitlement), carried: S(V.balance) }], openingRows: [{ name: "כולם", staff: S(V.staff), use: S(V.expectNow), leaves: false }], actualRows: [{ name: "כולם", staff: S(V.staff), use: S(V.used), leaves: false, nextUse: S(V.expectNext), dayCostClose: S(w.day[2]) }] });
    const G = q.grant;
    const grant = run({
      ...olt,
      benefit: "lump",
      perGroup: "same",
      termsForm: "",
      grant: S(G.amount),
      window: S(G.years),
      events: ["amend", "moves"],
      groups: [
        { name: "עובדי המכירות", heads: S(G.heads), served: S(w.served0), n: S(w.n0 - 1), leftAtStart: "1" },
        { name: "המצטרף", heads: "1", joinMonth: S(G.joinMonth), n: S(w.nNew) },
      ],
      amendType: "replace",
      amendBenefit: "lump",
      amendForm: "",
      amendMonth: S(G.month),
      amendRate: S(G.r0 * 100),
      amend_grant: S(G.newAmount),
      amend_window: S(G.years),
      ratesForm: "",
      year: "2025",
      iStart: S(G.r0 * 100),
      iEnd: S(G.r1 * 100),
    });
    expectShown([vac, grant], [...checksOf("mx-sales"), { label: "ריבית", value: w.interest }, { label: "שירות", value: w.service }, { label: "מדידה מחדש", value: w.pn }]);
  });

  it("exam 6: section 14, and a trust the ceiling caps", () => {
    const q = FINAL_TRUST;
    const w = solveTrust(q);
    const D = q.dc;
    const dc = run({ type: "post", risk: "employee", dcHow: "s14", s14Rows: [{ name: "פיתוח", staff: S(D.staff - D.leftEarlier), salary: S(D.salary * (1 + D.raise) ** (q.year - D.hired)) }], yearForm: "", year: "2025" });
    const B = q.db;
    const s = run({ ...db, benefit: "lump", perGroup: "same", termsForm: "", grant: S(B.grant), window: S(B.vestYears), events: ["assets"], groups: [{ name: "ייצור", heads: S(w.h0), served: S(w.s0), n: S(w.n0 - 1), headsEnd: S(w.h1) }], ratesForm: "", year: "2025", iStart: S(q.r0 * 100), iEnd: S(q.r1 * 100), assetsForm: "", assetsOpen: "0", assetsClose: S(q.fv), contributions: [{ amount: S(q.deposit.amount), month: S(q.deposit.month) }], ceiling: "zero", presentation: "finance" });
    expectShown([dc, s], checksOf("mx-trust"));
  });

  it("exam 7: the surplus at both dates, the ceiling, and why part of it is an asset", () => {
    const q = FINAL_MFR;
    const w = solveMfr(q);
    const s = run({ ...db, benefit: "lump", perGroup: "same", termsForm: "", grant: S(q.grant), window: S(q.years), events: ["assets"], groups: [{ name: "מנהלים", heads: S(q.heads), served: S(w.s0), n: S(w.n0 - 1) }], ratesForm: "", year: "2025", iStart: "5", iEnd: "5", assetsForm: "", assetsOpen: S(q.fvOpen), assetsClose: S(q.fvClose), contributions: [{ amount: S(q.mfr), month: "12" }], ceiling: "mfr", ceilingForm: "", mfrService: S(w.per), mfrYears: S(w.n0), mfrMin: S(q.mfr), presentation: "finance" });
    expectShown([s], [...checksOf("mx-mfr"), { label: "נכס נטו 31.12.2024", value: w.asset0 }, { label: "תקרה 31.12.2024", value: w.c0.benefit }]);
    assert.ok(s.steps.some((st) => st.notes?.some((n) => n.text?.includes("אפשר להכיר בחלק מהעודף"))));
  });

  it("exam 8: the note, a settlement from the fund, a retirement on the plan's terms", () => {
    const q = FINAL_INTEGRATED;
    const w = solveIntegrated(q);
    const s = run({
      ...db,
      hasNote: "yes",
      noteHelp: "",
      hAssetOpen: S(q.note.assetsOpen),
      hAssetInterest: S(q.note.assetInterest),
      hAssetContrib: S(q.note.contrib),
      hAssetPn: S(q.note.assetPn),
      benefit: "salary",
      salaryHow: "grow",
      perGroup: "same",
      termsForm: "",
      share: "100",
      events: ["assets", "payments", "settle"],
      groups: [{ name: "כולם", heads: S(q.heads), served: S(w.s1), n: S(w.n1 - 1), salaryNow: S(q.salary * (1 + q.raise)), growth: S(q.raise * 100), headsEnd: S(w.h3) }],
      settleFrom: "assets",
      settleForm: "",
      settleMonth: S(q.month),
      settleRate: S(q.rMid * 100),
      settleShare: S((q.settled.heads / q.heads) * 100),
      settlePaid: S(q.settled.premium),
      ratesForm: "",
      year: "2026",
      iStart: S(w.r1 * 100),
      iEnd: S(q.rEnd * 100),
      payments: [{ retireHeads: S(q.retired.heads), retireSalary: S(q.salary * (1 + q.raise)), retireYears: S(w.s1 + 1), month: "12", fromAssets: true, fromPct: "100" }],
      assetsForm: "",
      assetsClose: S(q.fvEnd),
      assetsEvent: "2606744",
      contributions: [{ amount: S(q.contrib), month: "12" }],
      ceiling: "none",
      presentation: "finance",
    });
    const t = run({ type: "term", termType: "offer", termRecognised: "yes", termForm: "", year: "2026", termHeads: S(q.term.heads), termAmount: S(q.term.amount), termHasStay: "no", termLate: "yes", termDisc: "", termYears: S(w.nTerm), termRate: S(q.rEnd * 100) });
    expectShown([s, t], [...checksOf("mx-integrated"), { label: "פתיחת הקרן", value: w.assetsOpen }]);
  });

  it("the note exam: grades in one run, an addition for one grade, the fund's return instead of its value", () => {
    const q = NOTE_CASE;
    const w = solveNote(q);
    const [A, Bg, C] = q.grades;
    const k = q.year - q.hired + 1;
    const grade = (g: typeof A, share: number, skip: boolean, extra: Row = {}): Row => ({ name: g.name, heads: S(g.heads), served: S(k), n: S(w.left0 - 1), salaryNow: S((g.salary * (1 + g.raise)) / 1000), growth: S(g.raise * 100), share: S(share), amendSkip: skip, ...extra });
    const s = run({
      ...db,
      hasNote: "yes",
      noteHelp: "",
      hInterest: S(w.note.interest0),
      hOpening: S(w.note.opening0),
      hPaid: S(w.note.paid0),
      hPaidAssets: S(w.note.aPaid0),
      hContrib: S(w.note.deposits0),
      hPayroll: S(w.salaryBase0),
      hPast: S(w.note.past0),
      hPastBase: S(w.oblA0),
      benefit: "salary",
      salaryHow: "grow",
      perGroup: "differ",
      events: ["assets", "payments", "amend", "given"],
      groups: [grade(A, 100 * (1 + q.addA), true), grade(Bg, 100, false), grade(C, 100, true, { headsEnd: S(C.heads - q.retireC) })],
      amendType: "add",
      amendBenefit: "salary",
      amendForm: "",
      amendMonth: "12",
      amendRate: S(w.rate * 100),
      amend_share: S((q.addA / 2) * 100),
      ratesForm: "",
      year: "2027",
      payments: [{ retireHeads: S(q.retireC), retireSalary: S((C.salary * (1 + C.raise)) / 1000), retireYears: S(k + 1), month: "12", fromAssets: true }],
      assetsForm: "",
      assetsOpen: S(w.note.aClosing0),
      assetsReturn: S(q.assetsPn1),
      contributions: [{ month: "6" }],
      ceiling: "none",
      givenForm: "",
      givenOpen: S(w.note.closing0),
      presentation: "finance",
    });
    expectShown([s], [...BK_NOTE.checks, { label: "שיעור", value: w.rate * 100 }, { label: "הפקדות", value: w.deposits1 }, { label: "שירות עבר", value: w.past1 }]);
  });

  it("lesson 8, question 1: tiers with a short-stay rule and a cap, an addition for some groups", () => {
    const w = examA();
    const a = EXAM_A.assembly;
    const terms: Answers = { benefit: "tiers", perGroup: "same", termsForm: "", t1: S(a.later.first), t1Years: S(a.early.upTo), t2: S(a.later.beyond), cap: S(a.cap), shortUpTo: S(a.early.upTo), shortPerYear: S(a.early.perYear) };
    const row = (g: (typeof a.groups)[number], y: number, extra: Row = {}): Row => ({ name: g.id, heads: S(g.heads), served: S(y - g.from), n: S(g.from + g.years - 1 - y), expected: S(g.years), ...extra });
    const y1 = run({ ...db, ...terms, events: [], groups: a.groups.map((g) => row(g, 2022)), ratesForm: "", year: "2022", iStart: "6", iEnd: "6", presentation: "finance" });
    const y2 = run({ ...db, ...terms, events: ["amend"], groups: a.groups.map((g) => row(g, 2023, { amendSkip: g.years < a.amendment.minYears })), amendType: "add", amendBenefit: "lump", amendForm: "", amendMonth: S(a.amendment.month), amendRate: "6", amend_grant: S(a.amendment.grant), amend_window: S(a.amendment.minYears), ratesForm: "", year: "2023", iStart: "6", iEnd: "5", presentation: "finance" });
    const A = w.assembly;
    expectShown([y1], [{ label: "פתיחה", value: A.year1.opening }, { label: "סגירה", value: A.year1.closing }, { label: "שירות", value: A.year1.service }]);
    expectShown([y2], [{ label: "שירות", value: A.year2.service }, { label: "שירות עבר", value: A.year2.pastService }, { label: "ריבית", value: A.year2.interest }, { label: "סגירה", value: A.year2.closing }, { label: "P.N.", value: A.year2.pn }]);
    const f = EXAM_A.field;
    const fTerms: Answers = { benefit: "earliest", perGroup: "same", termsForm: "", grant: S(f.grant), years: S(f.serviceYears), age: S(f.age) };
    const fr = (g: (typeof f.groups)[number], y: number, end = false): Row => ({ name: g.id, heads: S(g.heads), served: S(y - g.from), n: S(g.from + g.years - 1 - y), hireAge: S(g.ageAtStart), expected: S(g.years), ...(end && g.id === f.leavers.group ? { headsEnd: S(g.heads - f.leavers.heads) } : {}) });
    const f1 = run({ ...db, ...fTerms, events: [], groups: f.groups.map((g) => fr(g, 2022)), ratesForm: "", year: "2022", iStart: "6", iEnd: "6", presentation: "finance" });
    const f2 = run({ ...db, ...fTerms, events: [], groups: f.groups.map((g) => fr(g, 2023, true)), ratesForm: "", year: "2023", iStart: "6", iEnd: "5", presentation: "finance" });
    const F = w.field;
    expectShown([f1], [{ label: "פתיחה", value: F.year1.opening }, { label: "שירות", value: F.year1.service }]);
    expectShown([f2], [{ label: "סגירה", value: F.year2.closing }, { label: "P.N.", value: F.year2.pn }]);
  });

  it("lesson 8, question 2: the note's rate and shares, the addition for one grade", () => {
    const w = examB();
    const q = EXAM_B;
    const n = w.nEnd;
    const k = w.servedEnd - 1;
    const s = run({
      ...db,
      hasNote: "yes",
      noteHelp: "",
      hInterest: S(q.note.interestLast),
      hOpening: S(q.note.openingLast),
      hPaid: S(q.note.paidLast),
      hPaidAssets: S(q.note.paidFromAssetsLast),
      hContrib: S(q.note.contributionLast),
      hPayroll: S(w.payrollLast),
      hPast: S(q.note.pastServiceLast),
      hPastBase: S(w.beforeLast),
      benefit: "salary",
      salaryHow: "grow",
      perGroup: "differ",
      events: ["assets", "payments", "amend", "given"],
      groups: q.grades.map((g, i) => ({ name: g.id, heads: S(g.heads), served: S(k), n: S(n), salaryNow: S(w.salaries[i]), growth: S(g.raise * 100), share: S(100 * (1 + (g.id === q.note.amendedLast ? w.addedLast : 0))), amendSkip: g.id !== q.amendment.grade, ...(g.id === q.leavers.grade ? { headsEnd: S(g.heads - q.leavers.heads) } : {}) })),
      amendType: "add",
      amendBenefit: "salary",
      amendForm: "",
      amendMonth: "12",
      amendRate: S(w.rate * 100),
      amend_share: S(w.addedNow * 100),
      ratesForm: "",
      year: S(q.year),
      payments: [{ retireHeads: S(q.leavers.heads), retireSalary: S(w.salaries[2]), retireYears: S(w.servedEnd), month: "12", fromAssets: true }],
      assetsForm: "",
      assetsOpen: S(q.note.assets),
      assetsReturn: S(q.excessReturn),
      contributions: [{ month: S(q.contributionMonth) }],
      ceiling: "none",
      givenForm: "",
      givenOpen: S(q.note.obligation),
      presentation: "finance",
    });
    const O = w.obligation;
    expectShown([s], [
      { label: "ריבית", value: O.interest },
      { label: "שירות", value: O.service },
      { label: "שירות עבר", value: O.pastService },
      { label: "תשלומים", value: O.payments },
      { label: "סגירה", value: O.closing },
      { label: "P.N.", value: O.pn },
      { label: "הפקדה", value: w.assets.contribution },
      { label: "הכנסות ריבית", value: w.assets.interest },
      { label: "נכסים בסגירה", value: w.assets.closing },
      { label: "נטו", value: w.net },
    ]);
  });

  for (const e of ABSENCE_EXAMS)
    for (const mode of e.modes)
      it(`short-term ${e.id} (${mode}): a day's cost given outright`, () => {
        const c = e.data;
        const want = solveAbsence(c, mode);
        const actualRows: Row[] = c.actual.flatMap((g): Row[] => (g.next ? g.next.map((x) => ({ name: x.name, staff: S(x.staff), use: S(g.use), leaves: g.leaves, nextUse: S(x.use) })) : [{ name: g.name, staff: S(g.staff), use: S(g.use), leaves: g.leaves }]));
        const s = run({ type: "short", shortKind: "absence", accumulates: "yes", vesting: mode === "B" ? "full" : "none", order: "lifo", absForm: "", year: "2026", lifeYears: S(c.years), grades: [{ name: "כולם", dayCostGiven: S(c.dayCost), entitlement: S(c.entitlement), carried: S(c.carried[0]) }], openingRows: c.opening.map((g) => ({ name: g.name, staff: S(g.staff), use: S(g.use), leaves: g.leaves })), actualRows });
        expectShown([s], [{ label: "פתיחה", value: want.opening$ }, { label: "תשלומים", value: want.paid }, { label: "סגירה", value: want.closing$ }, { label: "הוצאה", value: want.expense }]);
      });

  it("a negative number of years is refused", () => {
    const a: Answers = { ...db, benefit: "perYear", perGroup: "same", events: [] };
    const q = questionsFor(a).find((x) => x.id === "groups")!;
    assert.ok(errorsFor(q, { ...a, groups: [{ name: "א", heads: "1", served: "-1", n: "3" }] }).length > 0);
  });

  it("every solution carries a summary, for adding benefits together", () => {
    const s = run({ type: "post", risk: "employee", dcHow: "s14", s14Rows: [{ name: "א", staff: "2", salary: "1000" }], yearForm: "", year: "2026" });
    assert.deepEqual(s.summary, { year: 2026, label: "הפקדה מוגדרת", pl: 2000, oci: 0, balance: 0 });
  });
});
