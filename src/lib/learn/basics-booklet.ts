/**
 * The basics course's booklet-level questions, one at the end of each of
 * lessons 5, 6 and 7: the same kinds of calculation as the lecturer's
 * workbooks, on companies and numbers of our own. Every answer is computed
 * here from the question's own data.
 */

import { type Balances, balancesOf, type Entry, ledger, round2, statements } from "./basics";
import { depreciationOfYear } from "./basics-ppe";

const two = (id: string, text: string, dr: string, cr: string, amount: number, why: string): Entry => ({ id, date: "31.12.2025", text, lines: [{ account: dr, dr: amount }, { account: cr, cr: amount }], why });
const f = (v: number) => Math.round(v).toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Lesson 5: eight adjustments for one company.

const A = {
  cleaning: { paid: 31_200, months: 12, start: 9 }, // recorded as an expense
  phone: { recorded: 27_000, months: 10 }, // a bill every two months, paid the month after
  salary: { recorded: 616_000, raise: 0.08 },
  lent: { amount: 90_000, rate: 0.06, start: 5 }, // interest received each 30.4
  rent: { got: 120_000, months: 30 }, // received 1.10.2024 for 30 months, recorded as unearned
  ads: 6_800, // December's campaign, invoiced in January
  equipment: { cost: 64_800, years: 6, month: 4 },
  insurance: { paid: 37_800, months: 18, start: 3 }, // recorded as prepaid
};
const cleanMonth = A.cleaning.paid / A.cleaning.months;
const phoneMonth = A.phone.recorded / A.phone.months;
const salaryMonth = A.salary.recorded / 11;
const insMonth = A.insurance.paid / A.insurance.months;

export const AGAM = {
  name: "אגם שיווק בע״מ",
  facts: [
    `ב-1.${A.cleaning.start}.2025 שולמו ${f(A.cleaning.paid)} ₪ על שירותי ניקיון ל-${A.cleaning.months} חודשים. הסכום נרשם כולו כ״הוצאות ניקיון״.`,
    `חשבון המים מגיע אחת לחודשיים. על ינואר עד אוקטובר 2025 נרשמו ${f(A.phone.recorded)} ₪, בשווה בכל חודש. החשבון של נובמבר ודצמבר יגיע רק בינואר 2026.`,
    `הוצאות השכר שנרשמו, ${f(A.salary.recorded)} ₪, הן על ינואר עד נובמבר, בשווה בכל חודש. מדצמבר השכר עלה ב-${A.salary.raise * 100}%. שכר דצמבר ישולם ב-10.1.2026.`,
    `ב-1.${A.lent.start}.2025 הלוותה החברה ${f(A.lent.amount)} ₪ לספק, בריבית שנתית של ${A.lent.rate * 100}%, המשולמת בכל 30.4. הריבית לא נרשמה.`,
    `ב-1.10.2024 קיבלה החברה ${f(A.rent.got)} ₪ שכירות מראש ל-${A.rent.months} חודשים, על מחסן שהיא משכירה, ורשמה אותם כ״הכנסות שכירות מראש״. ההתאמה של 2024 נרשמה כראוי.`,
    `קמפיין הפרסום של דצמבר 2025 עלה ${f(A.ads)} ₪. החשבונית תגיע בינואר 2026.`,
    `ב-1.${A.equipment.month}.2025 נקנה ציוד ב-${f(A.equipment.cost)} ₪, ל-${A.equipment.years} שנים. הפחת לא נרשם.`,
    `ב-1.${A.insurance.start}.2025 שולמו ${f(A.insurance.paid)} ₪ על ביטוח ל-${A.insurance.months} חודשים, ונרשמו כ״הוצאות ביטוח מראש״.`,
  ],
  entries: [
    two("1", "ניקיון: מה ששייך ל-2026", "הוצאות ניקיון מראש", "הוצאות ניקיון", cleanMonth * (A.cleaning.months - (13 - A.cleaning.start)), `נרשם כהוצאה. ${f(cleanMonth)} לחודש, ו-${A.cleaning.months - (13 - A.cleaning.start)} חודשים שייכים ל-2026.`),
    two("2", "מים נובמבר ודצמבר", "הוצאות מים", "הוצאות מים לשלם", phoneMonth * 2, `חודש רגיל: ${f(A.phone.recorded)} ÷ 10 = ${f(phoneMonth)}. חסרים שני חודשים.`),
    two("3", "שכר דצמבר, אחרי ההעלאה", "הוצאות שכר", "הוצאות שכר לשלם", round2(salaryMonth * (1 + A.salary.raise)), `חודש רגיל: ${f(A.salary.recorded)} ÷ 11 = ${f(salaryMonth)}. דצמבר: × ${1 + A.salary.raise}.`),
    two("4", "ריבית על ההלוואה שניתנה", "הכנסות ריבית לקבל", "הכנסות ריבית", round2((A.lent.amount * A.lent.rate * (13 - A.lent.start)) / 12), `${f(A.lent.amount)} × ${A.lent.rate * 100}% × ${13 - A.lent.start}/12. הריבית תתקבל רק ב-30.4.2026.`),
    two("5", "שכירות: 12 החודשים של 2025", "הכנסות שכירות מראש", "הכנסות שכירות", (A.rent.got / A.rent.months) * 12, `חוזה ישן: ${f(A.rent.got / A.rent.months)} לחודש × 12.`),
    two("6", "פרסום דצמבר", "הוצאות פרסום", "הוצאות פרסום לשלם", A.ads, "הקמפיין רץ ב-2025, ולכן ההוצאה של 2025, גם אם החשבונית מגיעה אחר כך."),
    two("7", "פחת הציוד", "הוצאות פחת", "ציוד – פחת נצבר", depreciationOfYear(A.equipment.cost, { years: A.equipment.years }, { year: 2025, month: A.equipment.month }, 2025), `${f(A.equipment.cost)} ÷ ${A.equipment.years} = ${f(A.equipment.cost / A.equipment.years)} לשנה. 9 חודשים: × 9/12.`),
    two("8", "ביטוח: מה שנוצל ב-2025", "הוצאות ביטוח", "הוצאות ביטוח מראש", insMonth * (13 - A.insurance.start), `נרשם כנכס. ${f(insMonth)} לחודש × ${13 - A.insurance.start} חודשים.`),
  ],
  trap: "במים מחלקים ב-10 ולא ב-12: נרשמו עשרה חודשים. ובניקיון ההתאמה הפוכה לביטוח, כי הוא נרשם כהוצאה ולא כנכס.",
};

// ---------------------------------------------------------------------------
// Lesson 6: a preliminary trial balance with two "?" balances, corrections, and the year's result.

const G = {
  insurance: { paid: 48_000, months: 24, start: 10 }, // 1.10.2024, recorded as prepaid: its balance is "?"
  rentLeft: 10_000, // a lease to 28.2.2025, not renewed
  creditAsCash: 21_000, // a purchase on credit, recorded as paid in cash
  advanceAsSale: 18_000, // a customer's advance in December, recorded as a sale
  loan: { amount: 300_000, rate: 0.06, start: 4 }, // from 1.4.2025, interest paid each 31.3
  deposit: { amount: 150_000, rate: 0.04, start: 8 }, // from 1.8.2025, interest with the principal
  salary: { recorded: 472_000, gift: 2_000, staff: 16 },
  stock: { cost: 133_000, nrv: 128_000 },
};
const insMonthG = G.insurance.paid / G.insurance.months;
const insOpening = G.insurance.paid - insMonthG * (13 - G.insurance.start);
const salaryMonthG = (G.salary.recorded - G.salary.gift * G.salary.staff) / 11;
const given: Balances = {
  מזומן: 254_000,
  לקוחות: 246_000,
  "מלאי פתיחה": 118_000,
  קניות: 905_000,
  "הוצאות שכירות מראש": G.rentLeft,
  ציוד: 180_000,
  ספקים: -154_000,
  "פיקדונות בבנק": G.deposit.amount,
  "הלוואה שהתקבלה": -G.loan.amount,
  "הון מניות": -250_000,
  מכירות: -1_690_000,
  "הוצאות שכר": G.salary.recorded,
  "הוצאות חשמל": 38_000,
  "הוצאות ארנונה": 26_000,
};
const withIns: Balances = { ...given, "הוצאות ביטוח מראש": insOpening };
const retainedG = -Object.values(withIns).reduce((s, v) => s + v, 0);
const gEntries: Entry[] = [
  two("1", "ביטוח: 12 החודשים של 2025", "הוצאות ביטוח", "הוצאות ביטוח מראש", insMonthG * 12, `חוזה ישן: ${f(insMonthG)} לחודש × 12.`),
  two("2", "שכירות: החוזה שנגמר", "הוצאות שכירות", "הוצאות שכירות מראש", G.rentLeft, "החוזה נגמר ב-28.2.2025 ולא חודש. כל היתרה עוברת להוצאה."),
  two("3", "תיקון: קנייה באשראי שנרשמה במזומן", "מזומן", "ספקים", G.creditAsCash, "הקניות נכונות ולא משתתפות. המזומן חוזר, ונוצר חוב לספק."),
  two("4", "תיקון: מקדמה שנרשמה כמכירה", "מכירות", "מקדמות מלקוחות", G.advanceAsSale, "המזומן נכון. הסחורה עוד לא סופקה: זו התחייבות, לא הכנסה."),
  two("5", "ריבית על ההלוואה", "הוצאות ריבית", "הוצאות ריבית לשלם", round2((G.loan.amount * G.loan.rate * (13 - G.loan.start)) / 12), `${f(G.loan.amount)} × ${G.loan.rate * 100}% × ${13 - G.loan.start}/12. הריבית תשולם רק ב-31.3.2026.`),
  two("6", "ריבית על הפיקדון", "הכנסות ריבית לקבל", "הכנסות ריבית", round2((G.deposit.amount * G.deposit.rate * (13 - G.deposit.start)) / 12), `${f(G.deposit.amount)} × ${G.deposit.rate * 100}% × ${13 - G.deposit.start}/12.`),
  two("7", "שכר דצמבר", "הוצאות שכר", "הוצאות שכר לשלם", salaryMonthG, `השי: ${f(G.salary.gift)} × ${G.salary.staff} = ${f(G.salary.gift * G.salary.staff)}. חודש רגיל: (${f(G.salary.recorded)} − ${f(G.salary.gift * G.salary.staff)}) ÷ 11.`),
  two("8", "מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(G.stock.cost, G.stock.nrv), "הנמוך מבין העלות לשווי המימוש נטו."),
];
const gPreliminary: Balances = { ...withIns, עודפים: retainedG };
const gFinal = balancesOf(ledger(gEntries, gPreliminary));
const gProfit = statements(gFinal).profit;

export const GILAD = {
  name: "גלעד ציוד בע״מ",
  given,
  unknowns: ["הוצאות ביטוח מראש", "עודפים"] as const,
  facts: [
    `ביטוח: ב-1.${G.insurance.start}.2024 שולמו ${f(G.insurance.paid)} ₪ על ביטוח ל-${G.insurance.months} חודשים, ונרשמו כ״מראש״. ב-2025 עוד לא נרשם דבר.`,
    "שכירות: חוזה השכירות של המחסן, ששולם מראש, נגמר ב-28.2.2025 ולא חודש. מאז החברה מאחסנת בחצר שלה.",
    `באוקטובר נקנתה סחורה באשראי ב-${f(G.creditAsCash)} ₪. נרשם: ח׳ קניות / ז׳ מזומן.`,
    `בדצמבר התקבלה במזומן מקדמה של ${f(G.advanceAsSale)} ₪ מלקוח, על סחורה שתסופק בינואר 2026. נרשם: ח׳ מזומן / ז׳ מכירות.`,
    `ההלוואה נלקחה ב-1.${G.loan.start}.2025, בריבית שנתית של ${G.loan.rate * 100}% המשולמת בכל 31.3. הריבית לא נרשמה.`,
    `הפיקדון הופקד ב-1.${G.deposit.start}.2025, בריבית שנתית של ${G.deposit.rate * 100}% שתתקבל עם הקרן ב-2026. הריבית לא נרשמה.`,
    `הוצאות השכר הן על ינואר עד נובמבר, ובהן שי לחג של ${f(G.salary.gift)} ₪ לכל אחד מ-${G.salary.staff} עובדים. השכר החודשי קבוע. שכר דצמבר ישולם ב-10.1.2026.`,
    `מלאי הסגירה: עלות ${f(G.stock.cost)} ₪, שווי מימוש נטו ${f(G.stock.nrv)} ₪.`,
  ],
  preliminary: gPreliminary,
  found: { insurance: insOpening, retained: -retainedG },
  entries: gEntries,
  final: gFinal,
  profit: gProfit,
  closingRetained: round2(-retainedG + gProfit),
  trap: "העודפים אחרונים: הם ההפרש של כל מאזן הבוחן, ולכן מוצאים קודם את יתרת הביטוח. ובשכר, השי יוצא לפני שמחלקים ב-11.",
};

// ---------------------------------------------------------------------------
// Lesson 7: three years of customers and the allowance, with a rate change and a specific provision.

const N = {
  years: [
    { year: 2023, sales: 940_000, collected: 610_000, written: 0, rate: 0.02 },
    { year: 2024, sales: 1_180_000, collected: 1_090_000, written: 7_500, rate: 0.02 },
    { year: 2025, sales: 1_320_000, collected: 1_240_000, written: 14_000, rate: 0.05, specific: { debt: 60_000, rate: 0.5 } },
  ],
};
type NevehYear = { year: number; opening: number; customers: number; allowanceBefore: number; required: number; expense: number; net: number };
export const NEVEH_YEARS: NevehYear[] = (() => {
  let customers = 0;
  let allowance = 0;
  return N.years.map((y) => {
    const opening = customers;
    customers = opening + y.sales - y.collected - y.written;
    const before = allowance - y.written;
    const required = round2(y.specific ? y.specific.debt * y.specific.rate + (customers - y.specific.debt) * y.rate : customers * y.rate);
    const expense = round2(required - before);
    allowance = required;
    return { year: y.year, opening, customers, allowanceBefore: before, required, expense, net: round2(customers - required) };
  });
})();

export const NEVEH = {
  name: "נווה מוצרי חשמל בע״מ",
  data: N.years,
  facts: [
    "החברה הוקמה ב-1.1.2023, וכל המכירות שלה באשראי.",
    "ב-2023 וב-2024 החברה העמידה את ההפרשה על 2% מיתרת הלקוחות בסוף השנה.",
    "ב-2025, לאור קשיי גבייה, היא העלתה את ההפרשה הכללית ל-5%. בנוסף, ב-31.12.2025 היא הפרישה 50% מחוב של לקוח בקשיים, שחייב 60,000 ₪. על שאר הלקוחות, 5%.",
  ],
  years: NEVEH_YEARS,
  trap: "ב-2024 המחיקה גדולה מההפרשה שהייתה, ולכן ההפרשה בחובה לפני ההתאמה, וההוצאה גדולה מההפרשה הנדרשת. וב-2025 האחוז הכללי חל רק על הלקוחות שאין עליהם הפרשה ספציפית.",
};
