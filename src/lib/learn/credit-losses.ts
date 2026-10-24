/**
 * Credit losses, in depth: the allowance account, its T-account, and every
 * exam situation — unknowns, aging, specific against general, credit sales and
 * a full exam question. As on the basics page, journal entries are the input
 * and every balance is computed from them.
 */

import { type Balances, balancesOf, type Entry, type Line, ledger, round2 } from "./basics";

export const AR = "לקוחות";
export const ALLOW = "הפרשה להפסדי אשראי חזויים";
export const EXPENSE = "הוצאות הפסדי אשראי";

const e = (id: string, date: string, text: string, lines: Line[], why?: string): Entry => ({ id, date, text, lines, why });

/** Writing off a debt that will never be collected: against the allowance, so no new expense. */
export const writeOff = (id: string, date: string, amount: number, who = "לקוח") =>
  e(id, date, `מחיקת חוב אבוד של ${who}`, [
    { account: ALLOW, dr: amount },
    { account: AR, cr: amount },
  ]);

/** A debt written off in the past and collected after all: reinstate it, then collect it. */
export const recovery = (id: string, date: string, amount: number): Entry[] => [
  e(`${id}א`, date, "החזרת החוב שנמחק בעבר לספרים", [
    { account: AR, dr: amount },
    { account: ALLOW, cr: amount },
  ]),
  e(`${id}ב`, date, "גביית החוב במזומן", [
    { account: "מזומן", dr: amount },
    { account: AR, cr: amount },
  ]),
];

/**
 * The year-end entry that brings the allowance from its balance before
 * adjustment (`before`, a credit amount; negative when the write-offs ran past
 * it) to the required balance: an expense when it grows, a reversal when it shrinks.
 */
export function adjustment(id: string, date: string, before: number, required: number): Entry {
  const diff = round2(required - before);
  return diff >= 0
    ? e(id, date, "השלמת ההפרשה לגובה הנדרש", [
        { account: EXPENSE, dr: diff },
        { account: ALLOW, cr: diff },
      ])
    : e(id, date, "ביטול הפרשה עודפת", [
        { account: ALLOW, dr: -diff },
        { account: EXPENSE, cr: -diff },
      ]);
}

/** Balances after posting, with the allowance and customers read as positive amounts. */
function close(entries: Entry[], opening: Balances) {
  const accounts = ledger(entries, opening);
  const b = balancesOf(accounts);
  return { accounts, b, gross: b[AR] ?? 0, allowance: -(b[ALLOW] ?? 0), expense: b[EXPENSE] ?? 0 };
}

// ---------------------------------------------------------------------------
// 1. The T-account: Alon Ltd.

export const ALON = (() => {
  const opening = 30_000;
  const written = 12_000;
  const gross = 800_000;
  const rate = 0.05;
  const lowRate = 0.02;
  const before = opening - written;
  const required = round2(gross * rate);
  const lowRequired = round2(gross * lowRate);
  const entries = [writeOff("1", "15.5.2025", written), adjustment("2", "31.12.2025", before, required)];
  const reversal = [writeOff("1", "15.5.2025", written), adjustment("2", "31.12.2025", before, lowRequired)];
  return {
    opening,
    written,
    gross,
    rate,
    lowRate,
    before,
    required,
    lowRequired,
    entries,
    reversal,
    result: close(entries, { [ALLOW]: -opening }),
    reversed: close(reversal, { [ALLOW]: -opening }),
  };
})();

// ---------------------------------------------------------------------------
// 2. The unknown opening balance: Barak Ltd. Closing figures are given; the openings are solved backwards.

export const BARAK = (() => {
  const closingGross = 1_500_000;
  const rate = 0.03;
  const closingAllowance = round2(closingGross * rate);
  const expense = 28_000;
  const written = 20_000;
  const creditSales = 2_400_000;
  const collections = 2_280_000;
  // Allowance: opening − write-offs + expense = closing.
  const openingAllowance = round2(closingAllowance - expense + written);
  // Customers: opening + credit sales − collections − write-offs = closing.
  const openingGross = round2(closingGross - creditSales + collections + written);
  const entries = [
    e("1", "2025", "מכירות באשראי במהלך השנה", [
      { account: AR, dr: creditSales },
      { account: "מכירות", cr: creditSales },
    ]),
    e("2", "2025", "גבייה מלקוחות במהלך השנה", [
      { account: "מזומן", dr: collections },
      { account: AR, cr: collections },
    ]),
    writeOff("3", "2025", written),
    adjustment("4", "31.12.2025", openingAllowance - written, closingAllowance),
  ];
  return {
    closingGross,
    rate,
    closingAllowance,
    expense,
    written,
    creditSales,
    collections,
    openingAllowance,
    openingGross,
    entries,
    result: close(entries, { [AR]: openingGross, [ALLOW]: -openingAllowance }),
  };
})();

// ---------------------------------------------------------------------------
// 3. The closing balance: a flat rate against an aging schedule, Hen Ltd.

export const HEN = (() => {
  const gross = 1_000_000;
  const opening = 40_000;
  const written = 9_000;
  const before = opening - written;
  const flatRate = 0.025;
  const buckets = [
    { label: "עד 30 יום", amount: 600_000, rate: 0.01 },
    { label: "31 עד 90 יום", amount: 250_000, rate: 0.04 },
    { label: "91 עד 180 יום", amount: 100_000, rate: 0.12 },
    { label: "מעל 180 יום", amount: 50_000, rate: 0.4 },
  ].map((x) => ({ ...x, allowance: round2(x.amount * x.rate) }));
  const flat = round2(gross * flatRate);
  const aging = round2(buckets.reduce((s, x) => s + x.allowance, 0));
  return {
    gross,
    opening,
    written,
    before,
    flatRate,
    buckets,
    bucketsTotal: buckets.reduce((s, x) => s + x.amount, 0),
    flat,
    aging,
    flatEntry: adjustment("א", "31.12.2025", before, flat),
    agingEntry: adjustment("ב", "31.12.2025", before, aging),
  };
})();

// ---------------------------------------------------------------------------
// 4. Specific against general: Dor Ltd and a garage in trouble.

export const DOR = (() => {
  const gross = 900_000;
  const specificName = "מוסך הצפון";
  const specificDebt = 60_000;
  const specificRate = 0.7;
  const generalRate = 0.04;
  const before = 50_000;
  const specific = round2(specificDebt * specificRate);
  const general = round2((gross - specificDebt) * generalRate);
  const required = round2(specific + general);
  // The common mistake: the general rate on all customers, the troubled one included.
  const wrongGeneral = round2(gross * generalRate);
  const wrongRequired = round2(specific + wrongGeneral);
  // Variant: the garage went bankrupt before year end, so the debt is written off and leaves the customers.
  const bankruptGross = gross - specificDebt;
  const bankruptBefore = before - specificDebt;
  const bankruptRequired = round2(bankruptGross * generalRate);
  const bankrupt = [writeOff("1", "20.11.2025", specificDebt, specificName), adjustment("2", "31.12.2025", bankruptBefore, bankruptRequired)];
  return {
    gross,
    specificName,
    specificDebt,
    specificRate,
    generalRate,
    before,
    specific,
    general,
    required,
    wrongGeneral,
    wrongRequired,
    entry: adjustment("1", "31.12.2025", before, required),
    bankruptGross,
    bankruptBefore,
    bankruptRequired,
    bankrupt,
    bankruptResult: close(bankrupt, { [AR]: gross, [ALLOW]: -before }),
  };
})();

// ---------------------------------------------------------------------------
// 5. Credit sales, collections and a recovered debt: Eran Ltd.

export const ERAN = (() => {
  const openingGross = 500_000;
  const openingAllowance = 20_000;
  const creditSales = 1_800_000;
  const collections = 1_650_000;
  const creditPurchases = 700_000;
  const written = 15_000;
  const recovered = 4_000;
  const rate = 0.04;
  const year = [
    e("1", "2025", "מכירות באשראי", [
      { account: AR, dr: creditSales },
      { account: "מכירות", cr: creditSales },
    ]),
    e("2", "2025", "גבייה מלקוחות", [
      { account: "מזומן", dr: collections },
      { account: AR, cr: collections },
    ]),
    e("3", "2025", "קניות באשראי מספקים", [
      { account: "קניות", dr: creditPurchases },
      { account: "ספקים", cr: creditPurchases },
    ]),
    writeOff("4", "2025", written),
    ...recovery("5", "2025", recovered),
  ];
  const mid = close(year, { [AR]: openingGross, [ALLOW]: -openingAllowance });
  const required = round2(mid.gross * rate);
  const adj = adjustment("6", "31.12.2025", mid.allowance, required);
  const entries = [...year, adj];
  return {
    openingGross,
    openingAllowance,
    creditSales,
    collections,
    creditPurchases,
    written,
    recovered,
    rate,
    year,
    mid,
    required,
    adj,
    entries,
    result: close(entries, { [AR]: openingGross, [ALLOW]: -openingAllowance }),
  };
})();

// ---------------------------------------------------------------------------
// 6. The exam question: Gilboa Ltd, 2025.

export const GILBOA = (() => {
  const openingNet = 912_000;
  const openingRate = 0.05;
  // Net = gross × (1 − rate), so the opening gross is solved from the net.
  const openingGross = round2(openingNet / (1 - openingRate));
  const openingAllowance = round2(openingGross - openingNet);
  const openingSuppliers = 600_000;
  const creditSales = 3_200_000;
  const cashSales = 400_000;
  const collections = 3_050_000;
  const creditPurchases = 1_900_000;
  const supplierPayments = 1_750_000;
  const bankruptName = "רשת אורן";
  const bankruptDebt = 36_000;
  const recovered = 9_000;
  const specificName = "דלתא שיווק";
  const specificDebt = 70_000;
  const specificRate = 0.6;
  const generalRate = 0.05;
  const year: Entry[] = [
    e("1", "2025", "מכירות באשראי", [
      { account: AR, dr: creditSales },
      { account: "מכירות", cr: creditSales },
    ]),
    e("2", "2025", "מכירות במזומן", [
      { account: "מזומן", dr: cashSales },
      { account: "מכירות", cr: cashSales },
    ]),
    e("3", "2025", "גבייה מלקוחות", [
      { account: "מזומן", dr: collections },
      { account: AR, cr: collections },
    ]),
    e("4", "2025", "קניות באשראי", [
      { account: "קניות", dr: creditPurchases },
      { account: "ספקים", cr: creditPurchases },
    ]),
    e("5", "2025", "תשלום לספקים", [
      { account: "ספקים", dr: supplierPayments },
      { account: "מזומן", cr: supplierPayments },
    ]),
    writeOff("6", "15.6.2025", bankruptDebt, bankruptName),
    ...recovery("7", "10.9.2025", recovered),
  ];
  const opening: Balances = { [AR]: openingGross, [ALLOW]: -openingAllowance, ספקים: -openingSuppliers };
  const mid = close(year, opening);
  const specific = round2(specificDebt * specificRate);
  const general = round2((mid.gross - specificDebt) * generalRate);
  const required = round2(specific + general);
  const adj = adjustment("8", "31.12.2025", mid.allowance, required);
  const entries = [...year, adj];
  const result = close(entries, opening);
  return {
    openingNet,
    openingRate,
    openingGross,
    openingAllowance,
    openingSuppliers,
    creditSales,
    cashSales,
    collections,
    creditPurchases,
    supplierPayments,
    bankruptName,
    bankruptDebt,
    recovered,
    specificName,
    specificDebt,
    specificRate,
    generalRate,
    year,
    mid,
    specific,
    general,
    required,
    adj,
    entries,
    result,
    net: round2(result.gross - result.allowance),
  };
})();

/** Every entry on the page, for the balance checks. */
export function allCreditLossEntries(): Entry[] {
  return [...ALON.entries, ...ALON.reversal, ...BARAK.entries, HEN.flatEntry, HEN.agingEntry, DOR.entry, ...DOR.bankrupt, ...ERAN.entries, ...GILBOA.entries];
}
