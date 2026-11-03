import { dayCost, grown, partInterest, partRate, pv, rollForward, shortTermExpense, simplePart } from "@/lib/learn/ias19";
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
  // Lesson 3: short-term benefits.
  dayCost: "שכר ÷ ימי עבודה × (1 + תוספות) = עלות יום",
  absence: "(ימים שצפוי לנצל + ימי העוזבים, אם מבשילה) × עלות יום = הפרשה",
  days: "עובדים × ימים × עלות יום = עלות הימים",
  stayers: "עובדים − עוזבים צפויים = נשארים",
  lifo: "זכאות השנה − ימים שנוצלו = ימים שנשארו מהשנה",
  lifoOld: "ימים שנוצלו − זכאות השנה = ימים שנוצלו מהצבור",
  bonus: "שיעור הבונוס × הרווח × עובדים צפויים = הפרשה לבונוס",
  bonusPaid: "שיעור הבונוס × הרווח בפועל × עובדים שקיבלו = תשלום",
  bonusCost: "בונוס × (1 + ביטוח לאומי) = עלות הבונוס",
  perHead: "סכום לעובד × עובדים = סך הכול",
  // Lesson 4: defined contribution.
  dcExpense: "שכר × שיעור ההפקדה = הוצאה",
  dcPaid: "הוצאה × חודשים שהועברו ÷ 12 = שולם",
  dcPayable: "הוצאה − שולם = זכאים",
  grown: "שכר בשנת הבסיס × (1 + העלאה)^שנים = שכר השנה",
} as const;

/** A result worked out: the formula, and the same formula with the numbers in and the result. */
export type Worked = { formula: string; numbers: string };

/** An amount as the course writes it in a working line, with ₪ on the result only: a balance to the shekel, as an earlier line showed it; a small amount such as a day's cost to the agora. */
const amt = (v: number) => fmt(Math.abs(v) >= 1_000 ? Math.round(v) : v);
/** The result: to the shekel, or to the agora where the course asks for it (a day's cost). */
const money = (v: number, agorot = false) => `${fmt(agorot ? Math.round(v * 100) / 100 : Math.round(v))} ₪`;
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
  dayCost: (salary: number, workingDays: number, onCosts: number): Worked => ({
    formula: FORMULA.dayCost,
    numbers: `${amt(salary)} ÷ ${workingDays} × ${factor(onCosts)} = ${money(dayCost(salary, workingDays, onCosts), true)}`,
  }),
  /** The provision at the year's end: the days the stayers are expected to use, and — when the absence vests — the leavers' days too. */
  absence: (x: { stay: number; leave?: number; days: number; dayCost: number }): Worked => {
    const groups = [`${x.stay} × ${x.days}`, ...(x.leave ? [`${x.leave} × ${x.days}`] : [])].join(" + ");
    return { formula: FORMULA.absence, numbers: `(${groups}) × ${amt(x.dayCost)} = ${money((x.stay + (x.leave ?? 0)) * x.days * x.dayCost)}` };
  },
  /** Days paid or provided for, group by group, each at its own day's cost. */
  days: (groups: { staff: number; days: number; dayCost: number }[]): Worked => ({
    formula: FORMULA.days,
    numbers: `${groups.map((g) => `${g.staff} × ${g.days} × ${amt(g.dayCost)}`).join(" + ")} = ${money(groups.reduce((s, g) => s + g.staff * g.days * g.dayCost, 0))}`,
  }),
  stayers: (staff: number, leaving: number): Worked => ({ formula: FORMULA.stayers, numbers: `${staff} − ${leaving} = ${staff - leaving}` }),
  lifo: (entitlement: number, used: number): Worked => ({ formula: FORMULA.lifo, numbers: `${entitlement} − ${used} = ${Math.max(0, entitlement - used)}` }),
  lifoOld: (used: number, entitlement: number): Worked => ({ formula: FORMULA.lifoOld, numbers: `${used} − ${entitlement} = ${Math.max(0, used - entitlement)}` }),
  bonus: (share: number, profit: number, heads: number): Worked => ({ formula: FORMULA.bonus, numbers: `${pct(share)} × ${amt(profit)} × ${heads} = ${money(share * profit * heads)}` }),
  bonusPaid: (share: number, profit: number, heads: number): Worked => ({ formula: FORMULA.bonusPaid, numbers: `${pct(share)} × ${amt(profit)} × ${heads} = ${money(share * profit * heads)}` }),
  bonusCost: (amount: number, insurance: number): Worked => ({ formula: FORMULA.bonusCost, numbers: `${amt(amount)} × ${factor(insurance)} = ${money(amount * (1 + insurance))}` }),
  /** `agorot` when the amount per head came from a line that showed it to the agora (a grown salary). */
  perHead: (amount: number, heads: number, agorot = false): Worked => ({
    formula: FORMULA.perHead,
    numbers: `${agorot ? fmt(Math.round(amount * 100) / 100) : amt(amount)} × ${heads} = ${money(amount * heads)}`,
  }),
  /** The general roll-forward, closed with all its lines known: it shows the closing balance. */
  roll: (r: { opening: number; added: number; payments: number; pn?: number }): Worked => ({
    formula: FORMULA.roll,
    numbers: `${amt(r.opening)} + ${amt(r.added)} − ${amt(r.payments)} + ${amt(r.pn ?? 0)} = ${money(r.opening + r.added - r.payments + (r.pn ?? 0))}`,
  }),
  dcExpense: (payroll: number, rate: number): Worked => ({ formula: FORMULA.dcExpense, numbers: `${amt(payroll)} × ${pct(rate)} = ${money(payroll * rate)}` }),
  dcPaid: (expense: number, months: number): Worked => ({ formula: FORMULA.dcPaid, numbers: `${amt(expense)} × ${months} ÷ 12 = ${money((expense * months) / 12)}` }),
  dcPayable: (expense: number, paid: number): Worked => ({ formula: FORMULA.dcPayable, numbers: `${amt(expense)} − ${amt(paid)} = ${money(expense - paid)}` }),
  grown: (salary: number, g: number, years: number): Worked => ({ formula: FORMULA.grown, numbers: `${amt(salary)} × ${factor(g)}^${years} = ${money(grown(salary, g, years), true)}` }),
};
