import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCRUAL,
  allEntries,
  balancesOf,
  carryForward,
  closingEntry,
  costOfSales,
  CREDIT,
  creditLoss,
  creditLossEntries,
  identityHolds,
  isBalanced,
  TZAAD,
  CANDLES,
  ledger,
  COGS_CASE,
  PRACTICE,
  SHACHAR,
  statements,
  tbBalanced,
  trialBalance,
  typeOf,
  TCHELET,
} from "./basics";

describe("accounting from zero: the model", () => {
  it("every journal entry balances", () => {
    for (const e of allEntries()) assert.ok(isBalanced(e), `entry ${e.id}: ${e.text}`);
  });

  it("every account has a type", () => {
    for (const e of allEntries()) for (const l of e.lines) assert.ok(typeOf(l.account));
  });
});

describe("the candle workshop", () => {
  const before = balancesOf(ledger(CANDLES.entries));
  const after = balancesOf(ledger([...CANDLES.entries, CANDLES.closing]));

  it("ends with 92,100 in cash", () => {
    assert.equal(before["מזומן"], 92_100);
  });

  it("looks like a loss of 19,500 without closing inventory, and earns 5,700 with it", () => {
    assert.equal(statements(before).profit, -19_500);
    assert.equal(CANDLES.closing.lines[0].dr, 25_200);
    assert.equal(statements(after).profit, 5_700);
  });

  it("the equation holds: 92,100 + 25,200 + 2,400 = 120,000 − 6,000 + 5,700", () => {
    const s = statements(after);
    assert.equal(s.totalAssets, 119_700);
    assert.equal(s.totalLiabilities + s.totalEquity, 119_700);
    assert.ok(identityHolds(s));
    assert.ok(identityHolds(statements(before)));
    // After every single entry, too.
    for (let i = 1; i <= CANDLES.entries.length; i++) assert.ok(identityHolds(statements(balancesOf(ledger(CANDLES.entries.slice(0, i))))));
  });

  it("the trial balance balances", () => {
    assert.ok(tbBalanced(trialBalance(after)));
  });
});

describe("Tchelet Ltd", () => {
  const tb = trialBalance(TCHELET.tb2024);
  const s = statements(TCHELET.tb2024);

  it("2024 trial balance: 904,500 on each side", () => {
    assert.equal(tb.dr, 904_500);
    assert.equal(tb.cr, 904_500);
  });

  it("2024: income 562,500, expenses 418,000, profit 144,500, balance sheet 486,500", () => {
    assert.equal(s.totalIncome, 562_500);
    assert.equal(s.totalExpenses, 418_000);
    assert.equal(s.profit, 144_500);
    assert.equal(s.totalAssets, 486_500);
    assert.equal(s.totalLiabilities + s.totalEquity, 486_500);
  });

  it("2025: a loss of 87,000, retained earnings 57,500, cash 107,500, balance sheet 299,500", () => {
    const opening = carryForward(TCHELET.tb2024);
    assert.equal(opening["עודפים"], -144_500);
    assert.equal(opening["מכירות"], undefined);
    const b = balancesOf(ledger(TCHELET.entries2025, opening));
    const s25 = statements(b);
    assert.equal(s25.profit, -87_000);
    assert.equal(s25.equity.find(([a]) => a === "עודפים")![1], 57_500);
    assert.equal(b["מזומן"], 107_500);
    assert.equal(s25.totalAssets, 299_500);
    assert.ok(identityHolds(s25));
    assert.ok(tbBalanced(trialBalance(b)));
  });
});

describe("credit stories and the loan", () => {
  it("credit and advances end with every receivable, payable and advance at zero", () => {
    const expected = [
      { run: CREDIT.credit, cash: 1_500, sales: -2_400, purchases: 900 },
      { run: CREDIT.advances, cash: 800, sales: -1_500, purchases: 700 },
    ];
    for (const x of expected) {
      const b = balancesOf(ledger(x.run));
      for (const a of ["לקוחות", "ספקים", "מקדמות מלקוחות", "מקדמות לספקים"]) assert.equal(b[a] ?? 0, 0, a);
      assert.equal(b["מזומן"], x.cash);
      assert.equal(b["מכירות"], x.sales);
      assert.equal(b["קניות"], x.purchases);
    }
  });

  it("loan: 60,000 still owed, 3,600 interest is the only expense, 56,400 in cash", () => {
    const b = balancesOf(ledger(CREDIT.loan));
    assert.equal(b["הלוואה"], -60_000);
    assert.equal(b["הוצאות ריבית"], 3_600);
    assert.equal(b["מזומן"], 56_400);
    assert.equal(statements(b).profit, -3_600);
  });
});

describe("closing entry", () => {
  it("Tchelet 2024: Dr each income, Cr each expense, Cr retained earnings 144,500", () => {
    const close = closingEntry(TCHELET.tb2024, "סגירה", "31.12.2024");
    assert.ok(isBalanced(close));
    assert.deepEqual(close.lines.find((l) => l.account === "מכירות"), { account: "מכירות", dr: 540_000 });
    assert.deepEqual(close.lines.find((l) => l.account === "הכנסות מעמלות"), { account: "הכנסות מעמלות", dr: 22_500 });
    assert.deepEqual(close.lines.find((l) => l.account === "קניות"), { account: "קניות", cr: 260_000 });
    assert.deepEqual(close.lines.at(-1), { account: "עודפים", cr: 144_500 });
    const after = balancesOf(ledger([close], TCHELET.tb2024));
    for (const [a, v] of Object.entries(after)) if (["income", "expense"].includes(typeOf(a))) assert.equal(v, 0, a);
    assert.equal(after["עודפים"], -144_500);
    // After closing, the balance sheet balances on its own.
    assert.equal(statements(after).profit, 0);
    assert.ok(identityHolds(statements(after)));
  });

  it("Tchelet 2025, a loss: Dr retained earnings 87,000, ending at 57,500 credit", () => {
    const b = balancesOf(ledger(TCHELET.entries2025, carryForward(TCHELET.tb2024)));
    const close = closingEntry(b, "סגירה", "31.12.2025");
    assert.ok(isBalanced(close));
    assert.deepEqual(close.lines.find((l) => l.account === "עודפים"), { account: "עודפים", dr: 87_000 });
    const after = balancesOf(ledger([close], b));
    assert.equal(after["עודפים"], -57_500);
    assert.equal(after["מכירות"], 0);
    assert.equal(after["הוצאות שכר"], 0);
  });
});

describe("cut-off accounts", () => {
  it("the four small cases: 900 prepaid, 9,000 accrued, 4,000 unearned, 2,400 receivable", () => {
    assert.deepEqual(ACCRUAL.results, { prepaid: 900, accrued: 9_000, unearned: 4_000, receivable: 2_400 });
    const ins = balancesOf(ledger(ACCRUAL.entries.prepaid));
    assert.equal(ins["הוצאות ביטוח"], 300);
    assert.equal(ins["הוצאות ביטוח מראש"], 900);
    assert.equal(balancesOf(ledger(ACCRUAL.entries.accrued))["הוצאות שכר"], 108_000);
    const rent = balancesOf(ledger(ACCRUAL.entries.unearned));
    assert.equal(rent["הכנסות שכירות"], -2_000);
    assert.equal(rent["הכנסות שכירות מראש"], -4_000);
  });

  it("Shachar: 10,000 advertising + 14,000 prepaid; 36,000 insurance + 27,000 prepaid; 10,000 interest; 105,000 consulting + 75,000 unearned; 9,000 rent receivable", () => {
    assert.ok(tbBalanced(trialBalance(SHACHAR.preliminary)));
    const b = balancesOf(ledger(SHACHAR.adjustments, SHACHAR.preliminary));
    assert.equal(b["הוצאות פרסום"], 10_000);
    assert.equal(b["הוצאות פרסום מראש"], 14_000);
    assert.equal(b["הוצאות ביטוח"], 36_000);
    assert.equal(b["הוצאות ביטוח מראש"], 27_000);
    assert.equal(b["הוצאות ריבית"], 10_000);
    assert.equal(b["הכנסות מייעוץ"], -105_000);
    assert.equal(b["הכנסות ייעוץ מראש"], -75_000);
    assert.equal(b['הכנסות שכ"ד לקבל'], 9_000);
    // The stock counted at year end, at the lower of cost (31,000) and net realisable value (28,500).
    assert.equal(b["מלאי סגירה מאזני"], 28_500);
    assert.equal(b["מלאי סגירה רווח או הפסד"], -28_500);
  });

  it("Shachar: profit 131,500; retained earnings from 48,000 to 179,500 credit", () => {
    const b = balancesOf(ledger(SHACHAR.adjustments, SHACHAR.preliminary));
    const s = statements(b);
    // Income 105,000 + 140,000 + 9,000 + closing stock 28,500 = 282,500; expenses 10,000 + 36,000 + 10,000 + purchases 95,000 = 151,000.
    assert.equal(s.profit, 131_500);
    assert.equal(SHACHAR.preliminary["עודפים"], -48_000);
    assert.equal(s.equity.find(([a]) => a === "עודפים")![1], 179_500);
    assert.ok(identityHolds(s));
    assert.ok(tbBalanced(trialBalance(b)));
  });
});

describe("inventory and credit losses", () => {
  it("the home-goods shop: 64,000 + 210,000 − 58,000 = 216,000", () => {
    assert.equal(costOfSales(COGS_CASE), 216_000);
  });

  it("Tzaad: customers 240,000, required 12,000, 6,000 already there, expense 6,000", () => {
    const c = creditLoss(TZAAD);
    assert.equal(c.customers, 240_000);
    assert.equal(c.required, 12_000);
    assert.equal(c.before, 6_000);
    assert.equal(c.expense, 6_000);
    assert.equal(c.net, 228_000);
  });

  it("Tzaad: posting the entries lands on the same closing balances", () => {
    const b = balancesOf(ledger(creditLossEntries(TZAAD), { לקוחות: TZAAD.openingCustomers, "הפרשה להפסדי אשראי חזויים": -TZAAD.openingAllowance }));
    assert.equal(b["לקוחות"], 240_000);
    assert.equal(b["הפרשה להפסדי אשראי חזויים"], -12_000);
  });
});

describe("practice", () => {
  it("fifteen questions, five per level, every answer valid", () => {
    assert.equal(PRACTICE.length, 15);
    for (const level of [1, 2, 3]) assert.equal(PRACTICE.filter((q) => q.level === level).length, 5);
    for (const q of PRACTICE) {
      if (q.kind === "choice") assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
      if (q.kind === "entry") assert.ok(q.accounts.includes(q.dr) && q.accounts.includes(q.cr), q.id);
      if (q.kind === "number") assert.ok(Number.isFinite(q.answer) && q.answer > 0, q.id);
    }
  });

  it("the computed answers", () => {
    const answer = (id: string) => {
      const q = PRACTICE.find((x) => x.id === id)!;
      return q.kind === "number" ? q.answer : NaN;
    };
    assert.equal(answer("q8"), 38_000);
    assert.equal(answer("q10"), 11_500);
    assert.equal(answer("q11"), 18_000);
    assert.equal(answer("q12"), 12_000);
    assert.equal(answer("q13"), 24_000);
    assert.equal(answer("q14"), 155_000);
    assert.equal(answer("q15"), 14_200);
  });
});

describe("a whole year: Noga and Ofek", async () => {
  const { NOGA, OFEK } = await import("./basics-year");
  it("every entry balances and every account has a type", () => {
    for (const x of [...NOGA.entries, ...OFEK.entries, ...OFEK.next]) {
      assert.ok(isBalanced(x), `${x.id}: ${x.text}`);
      for (const l of x.lines) assert.ok(typeOf(l.account));
    }
  });

  it("Noga 2025: trial balance 467,000, cash 278,000, profit 30,000; the third instalment still owed, the advance closed", () => {
    const b = balancesOf(ledger(NOGA.entries));
    const tb = trialBalance(b);
    assert.equal(tb.dr, 467_000);
    assert.equal(tb.cr, 467_000);
    assert.equal(b["מזומן"], 278_000);
    assert.equal(statements(b).profit, 30_000);
    assert.equal(b["זכאים"], -20_000);
    assert.equal(b["לקוחות"], 32_000);
    assert.equal(b["מקדמות מלקוחות"], 0);
  });

  it("Ofek 2025: trial balance 706,000, cash 391,420, profit 40,420; the bounced cheque leaves no trace but its fee", () => {
    const b = balancesOf(ledger(OFEK.entries));
    const tb = trialBalance(b);
    assert.equal(tb.dr, 706_000);
    assert.equal(tb.cr, 706_000);
    assert.equal(b["מזומן"], 391_420);
    assert.equal(statements(b).profit, 40_420);
    for (const a of ["זכאים", "מקדמות לספקים", "מקדמות מלקוחות"]) assert.equal(b[a], 0, a);
    assert.equal(b["לקוחות"], 25_000);
    assert.equal(b["ספקים"], -16_000);
    assert.equal(b["הוצאות עמלות בנק"], 80);
  });

  it("Ofek 2026: opens with 40,420 retained, earns 15,000, closes at 55,420; cash 370,420", () => {
    const opening = carryForward(balancesOf(ledger(OFEK.entries)));
    assert.equal(opening["עודפים"], -40_420);
    const b = balancesOf(ledger(OFEK.next, opening));
    const s = statements(b);
    assert.equal(trialBalance(b).dr, 585_420);
    assert.equal(s.profit, 15_000);
    assert.equal(s.equity.find(([a]) => a === "עודפים")![1], 55_420);
    assert.equal(b["מזומן"], 370_420);
    assert.ok(identityHolds(s));
  });
});

describe("cheques and advances split over a deal", () => {
  it("the cheque story ends with the customer paid, and only the bank's fee as an expense", async () => {
    const { CHECKS } = await import("./basics");
    const b = balancesOf(ledger(CHECKS.run));
    assert.equal(b["לקוחות"], 0);
    assert.equal(b["ספקים"], 0);
    assert.equal(b["מכירות"], -8_000);
    assert.equal(b["קניות"], 5_000);
    assert.equal(b["הוצאות עמלות בנק"], 60);
    assert.equal(b["מזומן"], 8_000 - 5_000 - 60);
  });
});
