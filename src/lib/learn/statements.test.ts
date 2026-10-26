import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALLOCATE, ALON, build, credits, debits, destOptions, HAYUVAL, NET, openingRetained, PL_LINES, type Question, solutionOf, splitLoan } from "./statements";

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 0.005, `${msg ?? ""} expected ${b}, got ${a}`);

describe("HaYuval Ltd.: the course's solution", () => {
  const s = build(HAYUVAL);

  it("profit or loss", () => {
    near(s.pl.cogs, 1_610_000, "cost of sales");
    near(s.grossProfit, 2_537_000, "gross profit");
    near(s.pl.admin, 644_680, "administration");
    near(s.pl.selling, 437_120, "selling and marketing");
    near(s.operatingProfit, 1_474_200, "operating profit");
    near(s.beforeFinancing, 1_474_200, "before financing and tax");
    near(s.pl.finance, 6_800, "finance");
    near(s.netProfit, 1_467_400, "net profit");
    near(s.oci, 30_000, "OCI");
    near(s.totalComprehensive, 1_497_400, "total comprehensive income");
  });

  it("the allocation table: twelve expenses, 1,081,800, each split to 100%", () => {
    assert.equal(s.alloc.length, 12);
    near(s.alloc.reduce((t, r) => t + r.amount, 0), 1_081_800);
    near(s.alloc.reduce((t, r) => t + r.admin, 0), 644_680);
    near(s.alloc.reduce((t, r) => t + r.selling, 0), 437_120);
    for (const r of s.alloc) near(r.adminPct + r.sellingPct, 1, r.name);
    const row = (n: string) => s.alloc.find((r) => r.name === n)!;
    near(row("הוצאות חשמל").admin, 42_480);
    near(row("הוצאות פחת מבנה").selling, 19_200);
  });

  it("statement of financial position", () => {
    near(s.sofp.receivables, 738_000);
    near(s.sofp.vehicles, 312_000);
    near(s.sofp.building, 2_112_000);
    near(s.sofp.currentLoan, 125_000);
    near(s.sofp.longLoan, 375_000);
    near(s.totals.ca, 1_958_000, "current assets");
    near(s.totals.nca, 2_959_000, "non-current assets");
    near(s.totalAssets, 4_917_000, "total assets");
    near(s.totals.cl, 692_000, "current liabilities");
    near(s.totals.ncl, 375_000, "non-current liabilities");
    near(s.totals.eq, 3_850_000, "equity");
    near(s.retained, 3_720_000, "retained earnings");
    near(s.gap, 0, "balances");
  });

  it("retained earnings: as the gap, and through the opening balance", () => {
    near(debits(HAYUVAL), 8_573_600, "debits");
    near(credits(HAYUVAL, false), 6_321_000, "credits without the reserve");
    near(openingRetained(HAYUVAL), 2_252_600, "opening retained earnings");
    near(openingRetained(HAYUVAL) + s.netProfit, 3_720_000);
    near(s.totalAssets - s.totals.cl - s.totals.ncl - 100_000 - 30_000, 3_720_000);
  });

  it("36 accounts, each mapped to exactly one destination that exists", () => {
    assert.equal(HAYUVAL.accounts.length, 36);
    assert.equal(new Set(HAYUVAL.accounts.map((a) => a.name)).size, 36);
    const options = new Set(destOptions(HAYUVAL).map((o) => o.value));
    for (const a of HAYUVAL.accounts) {
      assert.ok(options.has(a.dest), `${a.name}: ${a.dest}`);
      if (a.dest === NET) assert.ok(a.into && (a.into in s.sofp || PL_LINES.some((l) => l.id === a.into)), a.name);
      if (a.dest === ALLOCATE) assert.ok(a.alloc, a.name);
    }
    assert.deepEqual(s.unassigned, []);
  });

  it("a wrong choice shows as a gap: OCI booked as income", () => {
    const wrong = build(HAYUVAL, { ...solutionOf(HAYUVAL), "רווח כולל אחר בגין הערכה מחדש של רכוש קבוע": "otherIncome" });
    near(wrong.gap, -30_000);
  });

  it("splits a loan: 500,000 in four, the first within a year", () => {
    assert.deepEqual(splitLoan(500_000, 4, true), { each: 125_000, current: 125_000, long: 375_000 });
  });
});

/** The checks every question must pass: mapped, balanced, allocations to 100%. */
function consistent(q: Question) {
  const s = build(q);
  assert.deepEqual(s.unassigned, []);
  near(s.gap, 0, `${q.id} balances`);
  for (const r of s.alloc) near(r.adminPct + r.sellingPct, 1, r.name);
  assert.ok(s.openingRetained > 0, "opening retained earnings");
  return s;
}

describe("Alon Ltd.: the practice question", () => {
  const s = consistent(ALON);
  it("has at least 25 balances, with what HaYuval doesn't", () => {
    assert.ok(ALON.accounts.length >= 25);
    for (const d of ["investment", "finance", "rnd", "otherExpense", "bank"]) assert.ok(ALON.accounts.some((a) => a.dest === d || a.split?.currentLine === d), d);
  });
  it("its figures", () => {
    near(s.pl.cogs, 1_210_000);
    near(s.grossProfit, 2_190_000);
    near(s.pl.investment, 9_000);
    near(s.pl.finance, 36_000);
    near(s.beforeFinancing, s.operatingProfit + 9_000);
    near(s.sofp.bank, 102_000, "overdraft + current part of the loan");
    near(s.sofp.creditors, 83_000);
    near(s.sofp.debtors, 65_000);
    near(s.totals.ca, 350_000 + 300_000 + 592_000 + 210_000 + 65_000);
    near(s.openingRetained, 184_000);
    near(s.retained, 1_232_000);
  });
});
