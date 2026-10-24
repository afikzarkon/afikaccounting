/**
 * Credit losses, in depth: the customers account and the allowance against it,
 * from the idea itself to a full exam question. As on the basics page, journal
 * entries are the input and every balance is computed from them; each example
 * keeps both accounts, so the page can draw both T-accounts for it.
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
  const gross = b[AR] ?? 0;
  const allowance = -(b[ALLOW] ?? 0);
  return { accounts, b, gross, allowance, net: round2(gross - allowance), expense: b[EXPENSE] ?? 0 };
}

type Year = {
  openingAR: number;
  openingAllowance: number;
  creditSales?: number;
  collections?: number;
  writeOffs?: number;
  recovered?: number;
  /** The allowance required at year end, from the customers' closing gross balance. */
  required: (gross: number) => number;
};

/**
 * One year of the two accounts: credit sales, collections, write-offs and
 * recoveries, then the year-end adjustment to the required allowance. `ids`
 * names each entry, so a page can hide one as the unknown.
 */
export function year(p: Year) {
  const entries: Entry[] = [];
  const ids: Partial<Record<"sales" | "collections" | "writeOff" | "recovery" | "adj", string>> = {};
  let n = 0;
  const id = () => String(++n);
  if (p.creditSales) {
    ids.sales = id();
    entries.push(e(ids.sales, "", "מכירות באשראי", [{ account: AR, dr: p.creditSales }, { account: "מכירות", cr: p.creditSales }]));
  }
  if (p.collections) {
    ids.collections = id();
    entries.push(e(ids.collections, "", "גבייה מלקוחות", [{ account: "מזומן", dr: p.collections }, { account: AR, cr: p.collections }]));
  }
  if (p.writeOffs) {
    ids.writeOff = id();
    entries.push(writeOff(ids.writeOff, "", p.writeOffs));
  }
  if (p.recovered) {
    ids.recovery = id();
    entries.push(...recovery(ids.recovery, "", p.recovered));
  }
  const opening: Balances = { [AR]: p.openingAR, [ALLOW]: -p.openingAllowance };
  const mid = close(entries, opening);
  const required = round2(p.required(mid.gross));
  ids.adj = id();
  const adj = adjustment(ids.adj, "31.12", mid.allowance, required);
  const all = [...entries, adj];
  return { ...p, ids: ids as Required<typeof ids>, year: entries, mid, required, adj, entries: all, result: close(all, opening) };
}

export type YearResult = ReturnType<typeof year>;

// ---------------------------------------------------------------------------
// The idea, with round numbers: Ronit's shop.

export const RONIT = { customers: 100, each: 1_000, unpaid: 5 };

// ---------------------------------------------------------------------------
// The first full example: Alon Ltd, and the same year with a smaller estimate.

const ALON_YEAR = { openingAR: 700_000, openingAllowance: 30_000, creditSales: 2_000_000, collections: 1_888_000, writeOffs: 12_000 };
export const ALON = { rate: 0.05, lowRate: 0.02, ...year({ ...ALON_YEAR, required: (g) => g * 0.05 }) };
export const ALON_LOW = year({ ...ALON_YEAR, required: (g) => g * ALON.lowRate });

// ---------------------------------------------------------------------------
// Scenario A: the opening gross is unknown; the opening net and the rate are given.

export const SCENARIO_A = (() => {
  const openingNet = 570_000;
  const rate = 0.05;
  // Net is what is left after the allowance: gross × (1 − rate).
  const openingAR = round2(openingNet / (1 - rate));
  const openingAllowance = round2(openingAR * rate);
  return { openingNet, rate, ...year({ openingAR, openingAllowance, creditSales: 1_500_000, collections: 1_420_000, writeOffs: 10_000, required: (g) => g * rate }) };
})();

// ---------------------------------------------------------------------------
// Scenario B: the year's expense is unknown. The rate is extracted from last year's closing balances.

export const SCENARIO_B = (() => {
  const openingAR = 900_000;
  const openingAllowance = 45_000;
  const rate = round2(openingAllowance / openingAR);
  return { rate, ...year({ openingAR, openingAllowance, creditSales: 3_000_000, collections: 2_832_000, writeOffs: 28_000, required: (g) => g * rate }) };
})();

// ---------------------------------------------------------------------------
// Scenario C: collections are unknown; both customer balances, sales and write-offs are given.

export const SCENARIO_C = (() => {
  const openingAR = 400_000;
  const closingAR = 460_000;
  const creditSales = 1_250_000;
  const writeOffs = 14_000;
  const rate = 0.04;
  // Customers: opening + credit sales − collections − write-offs = closing.
  const collections = round2(openingAR + creditSales - writeOffs - closingAR);
  return { closingAR, rate, ...year({ openingAR, openingAllowance: round2(openingAR * rate), creditSales, collections, writeOffs, required: (g) => g * rate }) };
})();

// ---------------------------------------------------------------------------
// Scenario D: a specific customer in trouble beside the general allowance — Dor Ltd and a garage.

export const DOR = (() => {
  const specificName = "מוסך הצפון";
  const specificDebt = 60_000;
  const specificRate = 0.7;
  const generalRate = 0.04;
  const base = { openingAR: 820_000, openingAllowance: 50_000, creditSales: 2_600_000, collections: 2_520_000 };
  const split = (gross: number, specificLeft: number) => {
    const specific = round2(specificLeft * specificRate);
    const general = round2((gross - specificLeft) * generalRate);
    return { specific, general, required: round2(specific + general) };
  };
  // The garage still owes its debt at year end: a specific allowance on it, the general rate on the rest.
  const main = year({ ...base, required: (g) => split(g, specificDebt).required });
  // Variant: the garage went bankrupt before year end, so its debt is written off and only the general rate is left.
  const bankrupt = year({ ...base, writeOffs: specificDebt, required: (g) => split(g, 0).required });
  return {
    specificName,
    specificDebt,
    specificRate,
    generalRate,
    ...main,
    ...split(main.mid.gross, specificDebt),
    // The common mistake: the general rate on all customers, the troubled one included.
    wrongGeneral: round2(main.mid.gross * generalRate),
    bankrupt,
  };
})();

// ---------------------------------------------------------------------------
// Credit sales, a distracting purchase and a recovered debt: Eran Ltd.

export const ERAN = (() => {
  const openingGross = 500_000;
  const openingAllowance = 20_000;
  const creditSales = 1_800_000;
  const collections = 1_650_000;
  const creditPurchases = 700_000;
  const written = 15_000;
  const recovered = 4_000;
  const rate = 0.04;
  const yearEntries = [
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
  const opening = { [AR]: openingGross, [ALLOW]: -openingAllowance };
  const mid = close(yearEntries, opening);
  const required = round2(mid.gross * rate);
  const adj = adjustment("6", "31.12.2025", mid.allowance, required);
  const entries = [...yearEntries, adj];
  return { openingGross, openingAllowance, creditSales, collections, creditPurchases, written, recovered, rate, year: yearEntries, mid, required, adj, entries, result: close(entries, opening) };
})();

// ---------------------------------------------------------------------------
// The exam question: Gilboa Ltd, 2025.

export const GILBOA = (() => {
  const openingNet = 912_000;
  const openingRate = 0.05;
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
  const yearEntries: Entry[] = [
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
  const mid = close(yearEntries, opening);
  const specific = round2(specificDebt * specificRate);
  const general = round2((mid.gross - specificDebt) * generalRate);
  const required = round2(specific + general);
  const adj = adjustment("8", "31.12.2025", mid.allowance, required);
  const entries = [...yearEntries, adj];
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
    year: yearEntries,
    mid,
    specific,
    general,
    required,
    adj,
    entries,
    result,
    net: result.net,
  };
})();

// ---------------------------------------------------------------------------
// Self-check: three short questions, each with the year behind it.

export const SELF = [
  // The write-offs ran past the allowance; the year-end entry covers the gap and the required balance.
  year({ openingAR: 500_000, openingAllowance: 25_000, creditSales: 1_200_000, collections: 869_000, writeOffs: 31_000, required: (g) => g * 0.05 }),
  // The opening allowance is the unknown: closing 54,000, expense 18,000.
  year({ openingAR: 860_000, openingAllowance: 43_000, creditSales: 2_000_000, collections: 1_951_000, writeOffs: 9_000, recovered: 2_000, required: (g) => g * 0.06 }),
  // A specific customer of 50,000 at 80%, 3% on the rest — and too much allowance already.
  year({ openingAR: 380_000, openingAllowance: 60_000, creditSales: 1_000_000, collections: 980_000, required: (g) => 50_000 * 0.8 + (g - 50_000) * 0.03 }),
];

/** Every entry on the page, for the balance checks. */
export function allCreditLossEntries(): Entry[] {
  return [ALON, ALON_LOW, SCENARIO_A, SCENARIO_B, SCENARIO_C, DOR, DOR.bankrupt, ERAN, GILBOA, ...SELF].flatMap((x) => x.entries);
}
