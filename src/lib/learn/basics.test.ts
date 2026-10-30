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
  KITS,
  ledger,
  MIA,
  PRACTICE,
  RONEN,
  statements,
  tbBalanced,
  trialBalance,
  typeOf,
  YUVAL,
} from "./basics";

describe("accounting from zero: the model", () => {
  it("every journal entry balances", () => {
    for (const e of allEntries()) assert.ok(isBalanced(e), `entry ${e.id}: ${e.text}`);
  });

  it("every account has a type", () => {
    for (const e of allEntries()) for (const l of e.lines) assert.ok(typeOf(l.account));
  });
});

describe("science kits lab", () => {
  const before = balancesOf(ledger(KITS.entries));
  const after = balancesOf(ledger([...KITS.entries, KITS.closing]));

  it("ends with 213,650 in cash", () => {
    assert.equal(before["מזומן"], 213_650);
  });

  it("looks like a loss of 264,500 without closing inventory, and earns 5,500 with it", () => {
    assert.equal(statements(before).profit, -264_500);
    assert.equal(KITS.closing.lines[0].dr, 270_000);
    assert.equal(statements(after).profit, 5_500);
  });

  it("the equation holds: 213,650 + 270,000 + 1,850 = 500,000 − 20,000 + 5,500", () => {
    const s = statements(after);
    assert.equal(s.totalAssets, 485_500);
    assert.equal(s.totalLiabilities + s.totalEquity, 485_500);
    assert.ok(identityHolds(s));
    assert.ok(identityHolds(statements(before)));
    // After every single entry, too.
    for (let i = 1; i <= KITS.entries.length; i++) assert.ok(identityHolds(statements(balancesOf(ledger(KITS.entries.slice(0, i))))));
  });

  it("the trial balance balances", () => {
    assert.ok(tbBalanced(trialBalance(after)));
  });
});

describe("Yuval Ltd", () => {
  const tb = trialBalance(YUVAL.tb2020);
  const s = statements(YUVAL.tb2020);

  it("2020 trial balance: 1,975,300 on each side", () => {
    assert.equal(tb.dr, 1_975_300);
    assert.equal(tb.cr, 1_975_300);
  });

  it("2020: income 1,015,300, expenses 669,000, profit 346,300, balance sheet 1,306,300", () => {
    assert.equal(s.totalIncome, 1_015_300);
    assert.equal(s.totalExpenses, 669_000);
    assert.equal(s.profit, 346_300);
    assert.equal(s.totalAssets, 1_306_300);
    assert.equal(s.totalLiabilities + s.totalEquity, 1_306_300);
  });

  it("2021: a loss of 30,000, retained earnings 316,300, cash 221,000, balance sheet 886,300", () => {
    const opening = carryForward(YUVAL.tb2020);
    assert.equal(opening["עודפים"], -346_300);
    assert.equal(opening["מכירות"], undefined);
    const b = balancesOf(ledger(YUVAL.entries2021, opening));
    const s21 = statements(b);
    assert.equal(s21.profit, -30_000);
    assert.equal(s21.equity.find(([a]) => a === "עודפים")![1], 316_300);
    assert.equal(b["מזומן"], 221_000);
    assert.equal(s21.totalAssets, 886_300);
    assert.ok(identityHolds(s21));
    assert.ok(tbBalanced(trialBalance(b)));
  });
});

describe("credit stories and the loan", () => {
  it("credit and advances end with every receivable, payable and advance at zero", () => {
    for (const run of [CREDIT.credit, CREDIT.advances]) {
      const b = balancesOf(ledger(run));
      for (const a of ["לקוחות", "ספקים", "מקדמות מלקוחות", "מקדמות לספקים"]) assert.equal(b[a] ?? 0, 0, a);
      assert.equal(b["מזומן"], 400);
      assert.equal(b["מכירות"], -1_000);
      assert.equal(b["קניות"], 600);
    }
  });

  it("loan: 50,000 still owed, 5,000 interest is the only expense, 45,000 in cash", () => {
    const b = balancesOf(ledger(CREDIT.loan));
    assert.equal(b["הלוואה"], -50_000);
    assert.equal(b["הוצאות ריבית"], 5_000);
    assert.equal(b["מזומן"], 45_000);
    assert.equal(statements(b).profit, -5_000);
  });
});

describe("closing entry", () => {
  it("Yuval 2020: Dr each income, Cr each expense, Cr retained earnings 346,300", () => {
    const close = closingEntry(YUVAL.tb2020, "סגירה", "31.12.2020");
    assert.ok(isBalanced(close));
    assert.deepEqual(close.lines.find((l) => l.account === "מכירות"), { account: "מכירות", dr: 1_000_000 });
    assert.deepEqual(close.lines.find((l) => l.account === "הכנסות משכר דירה"), { account: "הכנסות משכר דירה", dr: 15_300 });
    assert.deepEqual(close.lines.find((l) => l.account === "קניות"), { account: "קניות", cr: 500_000 });
    assert.deepEqual(close.lines.at(-1), { account: "עודפים", cr: 346_300 });
    const after = balancesOf(ledger([close], YUVAL.tb2020));
    for (const [a, v] of Object.entries(after)) if (["income", "expense"].includes(typeOf(a))) assert.equal(v, 0, a);
    assert.equal(after["עודפים"], -346_300);
    // After closing, the balance sheet balances on its own.
    assert.equal(statements(after).profit, 0);
    assert.ok(identityHolds(statements(after)));
  });

  it("Yuval 2021, a loss: Dr retained earnings 30,000, ending at 316,300 credit", () => {
    const b = balancesOf(ledger(YUVAL.entries2021, carryForward(YUVAL.tb2020)));
    const close = closingEntry(b, "סגירה", "31.12.2021");
    assert.ok(isBalanced(close));
    assert.deepEqual(close.lines.find((l) => l.account === "עודפים"), { account: "עודפים", dr: 30_000 });
    const after = balancesOf(ledger([close], b));
    assert.equal(after["עודפים"], -316_300);
    assert.equal(after["מכירות"], 0);
    assert.equal(after["הוצאות שכר"], 0);
  });
});

describe("cut-off accounts", () => {
  it("the four small cases: 900 prepaid, 10,000 accrued, 4,000 unearned, 5,000 receivable", () => {
    assert.deepEqual(ACCRUAL.results, { prepaid: 900, accrued: 10_000, unearned: 4_000, receivable: 5_000 });
    const ins = balancesOf(ledger(ACCRUAL.entries.prepaid));
    assert.equal(ins["הוצאות ביטוח"], 300);
    assert.equal(ins["הוצאות ביטוח מראש"], 900);
    assert.equal(balancesOf(ledger(ACCRUAL.entries.accrued))["הוצאות שכר"], 120_000);
    const rent = balancesOf(ledger(ACCRUAL.entries.unearned));
    assert.equal(rent["הכנסות שכירות"], -2_000);
    assert.equal(rent["הכנסות שכירות מראש"], -4_000);
  });

  it("Ronen: 27,000 advertising + 9,000 prepaid; 48,000 insurance; 30,000 interest; 144,000 consulting + 96,000 unearned; 24,000 rent receivable", () => {
    assert.ok(tbBalanced(trialBalance(RONEN.preliminary)));
    const b = balancesOf(ledger(RONEN.adjustments, RONEN.preliminary));
    assert.equal(b["הוצאות פרסום"], 27_000);
    assert.equal(b["הוצאות פרסום מראש"], 9_000);
    assert.equal(b["הוצאות ביטוח"], 48_000);
    assert.equal(b["הוצאות ביטוח מראש"], 24_000);
    assert.equal(b["הוצאות ריבית"], 30_000);
    assert.equal(b["הכנסות מייעוץ"], -144_000);
    assert.equal(b["הכנסות ייעוץ מראש"], -96_000);
    assert.equal(b['הכנסות שכ"ד לקבל'], 24_000);
    // The stock counted at year end, at the lower of cost (20,000) and net realisable value (26,000).
    assert.equal(b["מלאי סגירה מאזני"], 20_000);
    assert.equal(b["מלאי סגירה רווח או הפסד"], -20_000);
  });

  it("Ronen: profit 113,000; retained earnings from 643,500 to 530,500 debit", () => {
    const b = balancesOf(ledger(RONEN.adjustments, RONEN.preliminary));
    const s = statements(b);
    // Income 144,000 + 110,000 + 24,000 + closing stock 20,000 = 298,000; expenses 27,000 + 48,000 + 30,000 + purchases 80,000 = 185,000.
    assert.equal(s.profit, 113_000);
    assert.equal(RONEN.preliminary["עודפים"], 643_500);
    assert.equal(s.equity.find(([a]) => a === "עודפים")![1], -530_500);
    assert.ok(identityHolds(s));
    assert.ok(tbBalanced(trialBalance(b)));
  });
});

describe("inventory and credit losses", () => {
  it("Mia: 280,000 + 350,000 − 315,000 = 315,000", () => {
    assert.equal(costOfSales(MIA), 315_000);
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
