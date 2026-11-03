import { partInterest, partRate, pv, rollForward, shortTermExpense, simplePart } from "@/lib/learn/ias19";
import { fmt, pct } from "./shared";

/**
 * Every formula of the employee-benefits course, written once, in the
 * course's words: Hebrew names for the amounts, i and n for the rate and the
 * years, the result on the right — read left to right, as in a notebook.
 * Wherever the course shows a result, it shows it worked: the formula on one
 * line, and under it the same formula with the numbers in and the result.
 * The numbers come from the tested functions in src/lib/learn/ias19.ts.
 */
export const FORMULA = {
  pv: "סכום עתידי ÷ (1 + i)^n = ערך נוכחי",
  partRate: "(1 + i)^(m/12) − 1 = שיעור לתקופה",
  part: "יתרה × ((1 + i)^(m/12) − 1) = ריבית",
  byRate: "יתרה × שיעור לתקופה = ריבית",
  /** The wrong way, shown only to be set aside. */
  simple: "i × m/12 = שיעור פשוט",
  simpleOn: "יתרה × i × m/12 = ריבית פשוטה",
  /** A year's interest when a payment went out during it: the payment earns no interest from the day it was paid. */
  partPaid: "יתרה × i − תשלום × ((1 + i)^(m/12) − 1) = ריבית השנה",
  roll: "פתיחה + מה שנוסף − תשלומים + P.N. = סגירה",
  expense: "סגירה − פתיחה + תשלומים = הוצאה",
  pnInterest: "סגירה − פתיחה − ריבית + תשלומים = P.N.",
  n: "הוותק ביום התשלום − הוותק היום = n",
  splitYear: "ריבית על הפתיחה − ריבית על התשלום + ריבית אחרי התיקון = ריבית השנה",
} as const;

/** A result worked out: the formula, and the same formula with the numbers in and the result. */
export type Worked = { formula: string; numbers: string };

/** An amount as the course writes it in a working line: rounded to the shekel, with ₪ on the result only. */
const amt = (v: number) => fmt(v);
const money = (v: number) => `${fmt(Math.round(v))} ₪`;
/** 1 + i, never 1.0700000000000001. */
export const factor = (i: number) => (1 + i).toLocaleString("en-US", { maximumFractionDigits: 6 });

/** The worked lines, as one string: the formula, and under it the numbers. Exercise steps, quiz answers and traps take it as it is. */
export const said = (w: Worked) => `${w.formula}\n${w.numbers}`;

/** The numbers put in, without the result — a hint's "first line", before the solution shows the whole working. */
export const putIn = (w: Worked) => w.numbers.slice(0, w.numbers.lastIndexOf(" = "));

export const work = {
  pv: (fv: number, i: number, n: number): Worked => ({ formula: FORMULA.pv, numbers: `${amt(fv)} ÷ ${factor(i)}^${n} = ${money(pv(fv, i, n))}` }),
  partRate: (i: number, months: number, digits = 4): Worked => ({ formula: FORMULA.partRate, numbers: `${factor(i)}^(${months}/12) − 1 = ${pct(partRate(i, months), digits)}` }),
  part: (balance: number, i: number, months: number): Worked => ({ formula: FORMULA.part, numbers: `${amt(balance)} × (${factor(i)}^(${months}/12) − 1) = ${money(partInterest(balance, i, months))}` }),
  /** The balance times the rate for the period, the rate rounded as the course shows it (4 decimals of a percent). */
  byRate: (balance: number, i: number, months: number): Worked => ({ formula: FORMULA.byRate, numbers: `${amt(balance)} × ${pct(partRate(i, months))} = ${money(partInterest(balance, i, months))}` }),
  simple: (i: number, months: number): Worked => ({ formula: FORMULA.simple, numbers: `${pct(i)} × ${months}/12 = ${pct(simplePart(i, months))}` }),
  simpleOn: (balance: number, i: number, months: number): Worked => ({ formula: FORMULA.simpleOn, numbers: `${amt(balance)} × ${pct(i)} × ${months}/12 = ${money(balance * simplePart(i, months))}` }),
  partPaid: (balance: number, i: number, paid: number, monthsLeft: number): Worked => ({
    formula: FORMULA.partPaid,
    numbers: `${amt(balance)} × ${pct(i)} − ${amt(paid)} × (${factor(i)}^(${monthsLeft}/12) − 1) = ${money(balance * i - partInterest(paid, i, monthsLeft))}`,
  }),
  expense: (opening: number, payments: number, closing: number): Worked => ({
    formula: FORMULA.expense,
    numbers: `${amt(closing)} − ${amt(opening)} + ${amt(payments)} = ${money(shortTermExpense(opening, payments, closing))}`,
  }),
  pnInterest: (r: { opening: number; interest: number; payments: number; closing: number }): Worked => ({
    formula: FORMULA.pnInterest,
    numbers: `${amt(r.closing)} − ${amt(r.opening)} − ${amt(r.interest)} + ${amt(r.payments)} = ${money(rollForward(r, "pn").pn)}`,
  }),
  n: (atPayment: number, now: number): Worked => ({ formula: FORMULA.n, numbers: `${atPayment} − ${now} = ${atPayment - now}` }),
  splitYear: (onOpening: number, onPayment: number, after: number): Worked => ({
    formula: FORMULA.splitYear,
    numbers: `${amt(Math.round(onOpening))} − ${amt(Math.round(onPayment))} + ${amt(Math.round(after))} = ${money(onOpening - onPayment + after)}`,
  }),
};
