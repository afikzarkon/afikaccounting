/**
 * Lesson 9's summary exams: whole questions with neutral titles, from the
 * first year's journal entries to a full worksheet. Every answer is computed
 * here from the question's own data; the stories and numbers are the course's own.
 */

import { type Balances, balancesOf, type Entry, isBalanceSheet, type Line, ledger, round2, statements } from "./basics";
import { accumulatedTo, depreciationOfYear, sale, saleEntry } from "./basics-ppe";

const f = (v: number) => Math.round(v).toLocaleString("en-US");
const e = (id: string, date: string, text: string, lines: Line[], why?: string): Entry => ({ id, date, text, lines, why });
const two = (id: string, date: string, text: string, dr: string, cr: string, amount: number, why?: string) => e(id, date, text, [{ account: dr, dr: amount }, { account: cr, cr: amount }], why);

// ---------------------------------------------------------------------------
// Exam 1: the first year's journal entries, T-accounts and trial balance.

const E1 = { capital: 150_000, equipment: 36_000, equipmentCash: 12_000, stock: 48_000, loan: 80_000, sale: 70_000, saleCash: 25_000, supplierAdvance: 14_000, fee: 60, customerAdvance: 9_000, delivered: 30_000, sold: 22_000, salary: 21_000, rent: 18_000, interest: 4_000 };
const e1Entries: Entry[] = [
  two("1", "1.1", "השקעת הבעלים", "מזומן", "הון מניות", E1.capital),
  e("2", "2.1", "רכישת ציוד, חלק באשראי", [{ account: "ציוד", dr: E1.equipment }, { account: "מזומן", cr: E1.equipmentCash }, { account: "זכאים", cr: E1.equipment - E1.equipmentCash }], "ציוד הוא רכוש, לא סחורה: החוב עליו לזכאים, לא לספקים."),
  two("3", "15.1", "קניית סחורה באשראי", "קניות", "ספקים", E1.stock),
  two("4", "1.2", "קבלת הלוואה", "מזומן", "הלוואה שהתקבלה", E1.loan),
  e("5", "10.3", "מכירה, חלק בצ׳ק דחוי", [{ account: "מזומן", dr: E1.saleCash }, { account: "לקוחות", dr: E1.sale - E1.saleCash }, { account: "מכירות", cr: E1.sale }], "צ׳ק דחוי הוא אשראי עד יום הפירעון: לקוחות."),
  two("6", "1.4", "מקדמה לספק", "מקדמות לספקים", "מזומן", E1.supplierAdvance),
  two("7", "10.5", "הפקדת הצ׳ק", "מזומן", "לקוחות", E1.sale - E1.saleCash),
  two("8", "12.5", "הצ׳ק חזר", "לקוחות", "מזומן", E1.sale - E1.saleCash, "פקודה הפוכה להפקדה: הלקוח חוזר להיות חייב."),
  two("9", "12.5", "עמלת הבנק על הצ׳ק שחזר", "הוצאות עמלות", "מזומן", E1.fee),
  two("10", "1.6", "תשלום חצי מהחוב על הציוד", "זכאים", "מזומן", (E1.equipment - E1.equipmentCash) / 2),
  two("11", "1.7", "מקדמה מלקוח", "מזומן", "מקדמות מלקוחות", E1.customerAdvance),
  e("12", "1.9", "הסחורה מהספק הגיעה, על חשבון המקדמה", [{ account: "קניות", dr: E1.delivered }, { account: "מקדמות לספקים", cr: E1.supplierAdvance }, { account: "ספקים", cr: E1.delivered - E1.supplierAdvance }]),
  e("13", "1.11", "הסחורה ללקוח סופקה, על חשבון המקדמה", [{ account: "מקדמות מלקוחות", dr: E1.customerAdvance }, { account: "מזומן", dr: E1.sold - E1.customerAdvance }, { account: "מכירות", cr: E1.sold }]),
  two("14", "30.11", "שכר", "הוצאות שכר", "מזומן", E1.salary),
  two("15", "30.11", "שכירות", "הוצאות שכירות", "מזומן", E1.rent),
  two("16", "31.12", "הלקוח שילם את החוב של הצ׳ק שחזר", "מזומן", "לקוחות", E1.sale - E1.saleCash),
  two("17", "31.12", "ריבית על ההלוואה", "הוצאות ריבית", "מזומן", E1.interest),
];

export const EXAM1 = {
  name: "שחף אופניים בע״מ",
  time: 30,
  facts: [
    `ב-1.1.2025 הוקמה החברה בהשקעת בעלים של ${f(E1.capital)} ₪ במזומן, כנגד מניות.`,
    `ב-2.1 נקנה ציוד לסדנה ב-${f(E1.equipment)} ₪: ${f(E1.equipmentCash)} במזומן, והשאר באשראי.`,
    `ב-15.1 נקנו אופניים למכירה ב-${f(E1.stock)} ₪ באשראי ספקים.`,
    `ב-1.2 התקבלה מהבנק הלוואה של ${f(E1.loan)} ₪.`,
    `ב-10.3 נמכרו אופניים ב-${f(E1.sale)} ₪: ${f(E1.saleCash)} במזומן, והשאר בצ׳ק דחוי ל-10.5.`,
    `ב-1.4 שולמה במזומן מקדמה של ${f(E1.supplierAdvance)} ₪ לספק, על סחורה עתידית.`,
    `ב-10.5 הופקד הצ׳ק. ב-12.5 הוא חזר, והבנק חייב את החברה בעמלה של ${E1.fee} ₪.`,
    "ב-1.6 שולם במזומן חצי מהחוב על הציוד.",
    `ב-1.7 התקבלה במזומן מקדמה של ${f(E1.customerAdvance)} ₪ מלקוח.`,
    `ב-1.9 הגיעה הסחורה מהספק, ב-${f(E1.delivered)} ₪: המקדמה נוצלה, והשאר באשראי.`,
    `ב-1.11 סופקו ללקוח אופניים ב-${f(E1.sold)} ₪: המקדמה נוצלה, והשאר שולם במזומן.`,
    `ב-30.11 שולמו במזומן שכר של ${f(E1.salary)} ₪ ושכירות של ${f(E1.rent)} ₪.`,
    `ב-31.12 הלקוח שילם במזומן את החוב של הצ׳ק שחזר, ושולמה ריבית של ${f(E1.interest)} ₪ על ההלוואה.`,
  ],
  asks: "פקודות יומן, כרטיסי T ומאזן בוחן ליום 31.12.2025.",
  entries: e1Entries,
  final: balancesOf(ledger(e1Entries)),
  trap: "ציוד שנקנה באשראי נרשם לזכאים, לא לספקים. וצ׳ק שחזר מבטל את ההפקדה: הלקוח שוב חייב, והעמלה היא הוצאה.",
};

// ---------------------------------------------------------------------------
// Exam 2: a first year's trial balance sorted and classified, then the second year.

const tb2024: Balances = {
  מזומן: 264_000,
  לקוחות: 148_000,
  "ריהוט משרדי": 60_000,
  "מקדמות לספקים": 20_000,
  "פיקדונות בבנק": 90_000,
  "הון מניות": -300_000,
  ספקים: -96_000,
  "הלוואה שהתקבלה": -120_000,
  "מקדמות מלקוחות": -35_000,
  מכירות: -980_000,
  קניות: 610_000,
  "הוצאות שכר": 240_000,
  "הוצאות שכירות": 84_000,
  "הכנסות ריבית": -6_000,
  "הוצאות חשמל": 21_000,
};
const profit2024 = statements(tb2024).profit;
const opening2025: Balances = Object.fromEntries([...Object.entries(tb2024).filter(([a]) => isBalanceSheet(a)), ["עודפים", -profit2024]]);
const E2 = { suppliersPaid: 0.6, bought: 150_000, sales: 400_000, salesCredit: 120_000, collected: 100_000, salary: 130_000, deposit: 40_000, loanPaid: 30_000 };
const e2Entries: Entry[] = [
  two("1", "2025", "תשלום 60% מהספקים של 2024", "ספקים", "מזומן", round2(-tb2024["ספקים"] * E2.suppliersPaid)),
  e("2", "2025", "קנייה: מהמקדמה, והשאר באשראי", [{ account: "קניות", dr: E2.bought }, { account: "מקדמות לספקים", cr: tb2024["מקדמות לספקים"] }, { account: "ספקים", cr: E2.bought - tb2024["מקדמות לספקים"] }]),
  e("3", "2025", "מכירות: מהמקדמה, באשראי ובמזומן", [{ account: "מקדמות מלקוחות", dr: -tb2024["מקדמות מלקוחות"] }, { account: "לקוחות", dr: E2.salesCredit }, { account: "מזומן", dr: E2.sales - E2.salesCredit + tb2024["מקדמות מלקוחות"] }, { account: "מכירות", cr: E2.sales }]),
  two("4", "2025", "גבייה מלקוחות", "מזומן", "לקוחות", E2.collected),
  two("5", "2025", "שכר", "הוצאות שכר", "מזומן", E2.salary),
  two("6", "2025", "הפקדה לפיקדון", "פיקדונות בבנק", "מזומן", E2.deposit),
  two("7", "2025", "פירעון חלק מההלוואה", "הלוואה שהתקבלה", "מזומן", E2.loanPaid),
];
const final2025 = balancesOf(ledger(e2Entries, opening2025));
const profit2025 = statements(final2025).profit;

export const EXAM2 = {
  name: "כרמים יבוא בע״מ",
  time: 30,
  tb2024,
  facts2025: [
    `נפרעו ${E2.suppliersPaid * 100}% מיתרת הספקים של סוף 2024.`,
    `נקנתה סחורה ב-${f(E2.bought)} ₪: המקדמה לספק נוצלה במלואה, והשאר באשראי.`,
    `נמכרה סחורה ב-${f(E2.sales)} ₪: המקדמה מהלקוחות נוצלה במלואה, ${f(E2.salesCredit)} באשראי, והשאר במזומן.`,
    `נגבו ${f(E2.collected)} ₪ מלקוחות.`,
    `שולם שכר של ${f(E2.salary)} ₪ במזומן.`,
    `הופקדו עוד ${f(E2.deposit)} ₪ בפיקדון.`,
    `נפרעו ${f(E2.loanPaid)} ₪ מההלוואה.`,
  ],
  asks: "מיון היתרות של 2024 לחובה וזכות ולמאזני ותוצאתי, רווח 2024 ועודפים. פקודות 2025, מאזן בוחן ליום 31.12.2025, רווח 2025 ועודפי הסגירה.",
  profit2024,
  opening2025,
  entries: e2Entries,
  final2025,
  profit2025,
  closingRetained: round2(profit2024 + profit2025),
  trap: "ב-2025 החשבונות התוצאתיים מתחילים מאפס, והמאזניים ממשיכים. הרווח של 2024 עובר לעודפים, ולכן מאזן הבוחן של 2025 כולל ״עודפים״.",
};

// ---------------------------------------------------------------------------
// Exam 3: adjustments and corrections for one company, depreciation and a renewed contract among them.

const E3 = {
  car: { cost: 144_000, rate: 0.15, bought: { year: 2023, month: 7 } },
  machine: { cost: 90_000, years: 10, bought: { year: 2021, month: 1 }, soldMonth: 8, proceeds: 30_000 },
  renewal: { balance: 9_600, left: 4, raise: 0.1 },
  cheque: 15_000,
  electricity: { recorded: 44_000, rise: 0.25 },
  consulting: { got: 36_000, months: 9, start: 11 }, // recorded as income
  deposit: { amount: 200_000, half: 0.03, start: 10 },
  stock: { cost: 88_000, nrv: 91_000 },
};
const carYear = depreciationOfYear(E3.car.cost, { rate: E3.car.rate }, E3.car.bought, 2025);
const mYearly = E3.machine.cost / E3.machine.years;
const mPart = (mYearly * E3.machine.soldMonth) / 12;
const mAcc = accumulatedTo(E3.machine.cost, { years: E3.machine.years }, E3.machine.bought, { year: 2025, month: E3.machine.soldMonth });
const mSale = sale(E3.machine.cost, mAcc, E3.machine.proceeds);
const oldMonth = E3.renewal.balance / E3.renewal.left;
const newMonth = round2(oldMonth * (1 + E3.renewal.raise));
const elMonth = E3.electricity.recorded / 11;
const consMonth = E3.consulting.got / E3.consulting.months;

export const EXAM3 = {
  name: "מעיין הדפסות בע״מ",
  time: 30,
  facts: [
    `רכב נקנה ב-1.7.2023 ב-${f(E3.car.cost)} ₪, בפחת של ${E3.car.rate * 100}% בשנה. הפחת של 2025 לא נרשם.`,
    `מכונה שנקנתה ב-1.1.2021 ב-${f(E3.machine.cost)} ₪, ל-${E3.machine.years} שנים, נמכרה בסוף אוגוסט 2025 ב-${f(E3.machine.proceeds)} ₪ במזומן. לא נרשמו לא המכירה ולא הפחת של 2025.`,
    `במאזן הבוחן הראשוני: ״הוצאות אחזקה מראש ${f(E3.renewal.balance)}״, ואין הוצאות אחזקה. החוזה הישן נגמר בסוף אפריל 2025, ובאותו יום הוארך לשנה במחיר גבוה ב-${E3.renewal.raise * 100}%, ששולם מראש. התשלום החדש לא נרשם.`,
    `בדצמבר נמכרה סחורה, ו-${f(E3.cheque)} ₪ מהתמורה התקבלו בצ׳ק דחוי למרץ 2026. הכול נרשם כמזומן.`,
    `הוצאות החשמל של ינואר עד נובמבר נרשמו: ${f(E3.electricity.recorded)} ₪, בשווה בכל חודש. בדצמבר החשבון גבוה ב-${E3.electricity.rise * 100}%, והוא ישולם בינואר.`,
    `ב-1.11.2025 התקבלו ${f(E3.consulting.got)} ₪ על ייעוץ ל-${E3.consulting.months} חודשים, ונרשמו כולם כ״הכנסות ייעוץ״.`,
    `ב-1.10.2025 הופקדו ${f(E3.deposit.amount)} ₪ בפיקדון, בריבית חצי שנתית של ${E3.deposit.half * 100}% שתתקבל עם הקרן. הריבית לא נרשמה.`,
    `מלאי הסגירה: עלות ${f(E3.stock.cost)} ₪, שווי מימוש נטו ${f(E3.stock.nrv)} ₪.`,
  ],
  asks: "פקודות היומן להתאמה ולתיקון ליום 31.12.2025.",
  entries: [
    two("1", "31.12.2025", "פחת הרכב", "הוצאות פחת", "כלי רכב – פחת נצבר", carYear, `${f(E3.car.cost)} × ${E3.car.rate * 100}% = ${f(carYear)}. ב-2025 הרכב היה בעסק כל השנה.`),
    two("2", "31.8.2025", "פחת המכונה עד יום המכירה", "הוצאות פחת", "מכונות – פחת נצבר", mPart, `${f(mYearly)} לשנה × ${E3.machine.soldMonth}/12.`),
    { ...saleEntry("3", "מכירת המכונה", { account: "מכונות", accumulatedAccount: "מכונות – פחת נצבר", cost: E3.machine.cost, accumulated: mAcc }, E3.machine.proceeds), date: "31.8.2025", why: `פחת נצבר: 4 שנים ועוד ${E3.machine.soldMonth} חודשים, ${f(mAcc)}. עלות מופחתת ${f(E3.machine.cost - mAcc)}, והתמורה נמוכה ממנה ב-${f(-mSale.result)}: הפסד הון.` },
    two("4", "31.12.2025", "אחזקה: סוף החוזה הישן", "הוצאות אחזקה", "הוצאות אחזקה מראש", E3.renewal.balance, `ינואר עד אפריל: ${f(oldMonth)} לחודש.`),
    e("5", "31.12.2025", "אחזקה: החוזה החדש", [{ account: "הוצאות אחזקה", dr: newMonth * 8 }, { account: "הוצאות אחזקה מראש", dr: newMonth * 4 }, { account: "מזומן", cr: newMonth * 12 }], `${f(oldMonth)} × 1.1 = ${f(newMonth)} לחודש. מאי עד דצמבר, 8 חודשים, הוצאה. ינואר עד אפריל 2026 מראש.`),
    two("6", "31.12.2025", "תיקון: הצ׳ק הדחוי", "לקוחות", "מזומן", E3.cheque),
    two("7", "31.12.2025", "חשמל דצמבר", "הוצאות חשמל", "הוצאות חשמל לשלם", round2(elMonth * (1 + E3.electricity.rise)), `${f(E3.electricity.recorded)} ÷ 11 = ${f(elMonth)}. דצמבר: × ${1 + E3.electricity.rise}.`),
    two("8", "31.12.2025", "ייעוץ: מה ששייך ל-2026", "הכנסות ייעוץ", "הכנסות ייעוץ מראש", consMonth * (E3.consulting.months - 2), `${f(consMonth)} לחודש. נוצלו נובמבר ודצמבר, ונשארו ${E3.consulting.months - 2} חודשים.`),
    two("9", "31.12.2025", "ריבית על הפיקדון", "הכנסות ריבית לקבל", "הכנסות ריבית", round2((E3.deposit.amount * E3.deposit.half * 3) / 6), `שיעור חצי שנתי: ${f(E3.deposit.amount)} × ${E3.deposit.half * 100}% × 3/6.`),
    two("10", "31.12.2025", "מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(E3.stock.cost, E3.stock.nrv), "שווי המימוש גבוה מהעלות, ולכן נרשמת העלות."),
  ] as Entry[],
  trap: "במכירת המכונה, קודם הפחת עד אוגוסט ורק אז העלות המופחתת. ובאחזקה, ההעלאה חלה רק על החוזה החדש.",
};

// ---------------------------------------------------------------------------
// Exam 4: credit losses with unknowns.

const E4 = { netOpening: 488_800, rate: 0.06, sales: 2_300_000, written: 18_000, recovered: 4_000, closing: 620_000, specificRate: 0.4, general: 0.05, expense: 27_800 };
const grossOpening = round2(E4.netOpening / (1 - E4.rate));
const allowOpening = round2(grossOpening - E4.netOpening);
const collected = round2(grossOpening + E4.sales + E4.recovered - E4.written - E4.closing);
const allowClosing = round2(allowOpening - E4.written + E4.recovered + E4.expense);
const specificDebt = round2((allowClosing - E4.closing * E4.general) / (E4.specificRate - E4.general));

export const EXAM4 = {
  name: "רקפת בע״מ",
  time: 25,
  facts: [
    `ב-31.12.2024 הלקוחות נטו של החברה היו ${f(E4.netOpening)} ₪. ההפרשה הייתה ${E4.rate * 100}% מהלקוחות ברוטו.`,
    `ב-2025: מכירות באשראי ${f(E4.sales)} ₪, ונמחק חוב אבוד של ${f(E4.written)} ₪.`,
    `ב-2025 שילם לקוח ${f(E4.recovered)} ₪ על חוב שנמחק ב-2024.`,
    `ב-31.12.2025 הלקוחות ברוטו ${f(E4.closing)} ₪. החברה הפרישה ${E4.specificRate * 100}% מחוב של לקוח אחד בקשיים, ו-${E4.general * 100}% משאר הלקוחות.`,
    `הוצאות הפסדי האשראי של 2025 היו ${f(E4.expense)} ₪.`,
  ],
  asks: "א. הלקוחות ברוטו וההפרשה ב-31.12.2024. ב. כמה מזומן נגבה מלקוחות ב-2025, כולל החוב שחזר. ג. יתרת ההפרשה ב-31.12.2025. ד. החוב של הלקוח בקשיים. ה. הלקוחות נטו ב-31.12.2025.",
  grossOpening,
  allowOpening,
  collected,
  allowClosing,
  specificDebt,
  netClosing: round2(E4.closing - allowClosing),
  trap: "חוב שחזר עובר דרך הלקוחות: קודם מחזירים אותו (ח׳ לקוחות / ז׳ הפרשה), ואז גובים. לכן הגבייה כוללת אותו, וההפרשה גדלה בו.",
};

// ---------------------------------------------------------------------------
// Exams 5 to 8: whole worksheets. One shape for all: a trial balance with "?" balances, the facts, the entries,
// and everything after them computed from the data.

export type WorksheetExam = {
  name: string;
  time: number;
  /** The trial balance as the question prints it: debit positive, credit negative; the "?" accounts are missing. */
  given: Balances;
  /** "?" balances worked out from the story, with how. Retained earnings, the balancing figure, are not listed here. */
  computed: { account: string; value: number; why: string }[];
  facts: string[];
  entries: Entry[];
  trap: string;
};

/** Everything after the question: the preliminary trial balance with every "?" found, the final one, profit and closing retained earnings. */
export function solveWorksheet(x: WorksheetExam) {
  const withComputed: Balances = { ...x.given, ...Object.fromEntries(x.computed.map((c) => [c.account, c.value])) };
  const retained = round2(-Object.values(withComputed).reduce((s, v) => s + v, 0));
  const preliminary: Balances = { ...withComputed, עודפים: retained };
  const final = balancesOf(ledger(x.entries, preliminary));
  const profit = statements(final).profit;
  // Retained earnings as the question reads them: credit positive.
  const opening = -retained;
  return { preliminary, retainedOpening: opening, final, profit, retainedClosing: round2(opening + profit) };
}

// Exam 5: vans with a "?" accumulated depreciation and a sale, credit losses, an old lease, a loan, consulting received in advance.
const V5 = { count: 4, each: 68_000, rate: 0.125, bought: { year: 2021, month: 4 }, soldMonth: 9, proceeds: 33_000 };
const v5Cost = V5.count * V5.each;
const v5Acc = accumulatedTo(v5Cost, { rate: V5.rate }, V5.bought, { year: 2024, month: 12 });
const v5Kept = depreciationOfYear((V5.count - 1) * V5.each, { rate: V5.rate }, V5.bought, 2025);
const v5SoldPart = round2((V5.each * V5.rate * V5.soldMonth) / 12);
const v5SoldAcc = accumulatedTo(V5.each, { rate: V5.rate }, V5.bought, { year: 2025, month: V5.soldMonth });
const v5Sale = sale(V5.each, v5SoldAcc, V5.proceeds);
const C5 = { customers: 840_000, allowance: 30_000, written: 12_000, specific: 46_000, p: 0.5, g: 0.04 };
const c5After = C5.customers - C5.written;
const c5Required = round2(C5.specific * C5.p + (c5After - C5.specific) * C5.g);
const C5c = { got: 54_000, months: 18, start: 9 };
const L5 = { amount: 240_000, rate: 0.09, start: 6 };

export const EXAM5: WorksheetExam = {
  name: "אופק ריהוט בע״מ",
  time: 50,
  given: {
    מזומן: 812_000,
    לקוחות: C5.customers,
    "הפרשה להפסדי אשראי חזויים": -C5.allowance,
    "מלאי פתיחה": 240_000,
    קניות: 1_650_000,
    "כלי רכב": v5Cost,
    "הוצאות שכירות מראש": 64_000,
    ספקים: -410_000,
    "הלוואה שהתקבלה": -L5.amount,
    "הון מניות": -400_000,
    מכירות: -3_100_000,
    "הכנסות ייעוץ": -C5c.got,
    "הוצאות שכר": 610_000,
    "הוצאות חשמל": 56_100,
  },
  computed: [{ account: "כלי רכב – פחת נצבר", value: -v5Acc, why: `${f(v5Cost)} × ${V5.rate * 100}% × 45/12: מאפריל 2021 עד סוף 2024, כי הפחת של 2025 עוד לא נרשם.` }],
  facts: [
    `כלי רכב: ב-1.4.2021 נקנו ${V5.count} טנדרים זהים ב-${f(V5.each)} ₪ כל אחד, בפחת של ${V5.rate * 100}% בשנה. הפחת הנצבר לא נתון במאזן הבוחן. בסוף ספטמבר 2025 נמכר טנדר אחד ב-${f(V5.proceeds)} ₪ במזומן. לא נרשמו לא המכירה ולא הפחת של 2025.`,
    "החשמל של ינואר עד נובמבר נרשם, בשווה בכל חודש. בדצמבר החשבון גבוה ב-20% מחודש רגיל, והוא ישולם בינואר.",
    `ב-31.12.2025 התברר שחוב של ${f(C5.written)} ₪ אבוד, וטרם נמחק. החברה מפרישה ${C5.p * 100}% מחוב של לקוח בקשיים שחייב ${f(C5.specific)} ₪, ו-${C5.g * 100}% משאר הלקוחות.`,
    `ב-1.${C5c.start}.2025 התקבלו ${f(C5c.got)} ₪ על ייעוץ ל-${C5c.months} חודשים, ונרשמו כולם כהכנסה.`,
    "השכירות: ב-1.5.2024 שולמו 96,000 ₪ על שנתיים, ונרשמו כ״מראש״. ב-2025 עוד לא נרשם דבר.",
    `ההלוואה נלקחה ב-1.${L5.start}.2025 בריבית שנתית של ${L5.rate * 100}%, שתשולם עם הקרן ב-2028.`,
    "מלאי הסגירה: עלות 276,000 ₪, שווי מימוש נטו 262,000 ₪.",
  ],
  entries: [
    two("1", "31.12.2025", "פחת הטנדרים: שלושה לשנה, ואחד עד ספטמבר", "הוצאות פחת", "כלי רכב – פחת נצבר", round2(v5Kept + v5SoldPart), `שלושה: ${f((V5.count - 1) * V5.each)} × ${V5.rate * 100}% = ${f(v5Kept)}. הטנדר שנמכר, 9 חודשים: ${f(v5SoldPart)}.`),
    { ...saleEntry("2", "מכירת הטנדר", { account: "כלי רכב", accumulatedAccount: "כלי רכב – פחת נצבר", cost: V5.each, accumulated: v5SoldAcc }, V5.proceeds), date: "30.9.2025", why: `פחת נצבר על הטנדר: ${f(V5.each)} × ${V5.rate * 100}% × 54/12 = ${f(v5SoldAcc)}. עלות מופחתת ${f(V5.each - v5SoldAcc)}. רווח הון ${f(v5Sale.result)}.` },
    two("3", "31.12.2025", "חשמל דצמבר", "הוצאות חשמל", "הוצאות חשמל לשלם", 6_120, "56,100 ÷ 11 = 5,100. דצמבר: × 1.2."),
    two("4", "31.12.2025", "מחיקת החוב האבוד", "הפרשה להפסדי אשראי חזויים", "לקוחות", C5.written),
    two("5", "31.12.2025", "השלמת ההפרשה", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", round2(c5Required - (C5.allowance - C5.written)), `לקוחות אחרי המחיקה ${f(c5After)}. נדרש: ${f(C5.specific * C5.p)} + ${f(c5After - C5.specific)} × ${C5.g * 100}% = ${f(c5Required)}. יש: ${f(C5.allowance - C5.written)}.`),
    two("6", "31.12.2025", "ייעוץ: מה ששייך לשנים הבאות", "הכנסות ייעוץ", "הכנסות ייעוץ מראש", (C5c.got / C5c.months) * (C5c.months - 4), `${f(C5c.got / C5c.months)} לחודש. ב-2025 ניתנו 4 חודשים, ונשארו ${C5c.months - 4}.`),
    two("7", "31.12.2025", "שכירות: 12 החודשים של 2025", "הוצאות שכירות", "הוצאות שכירות מראש", 48_000, "חוזה ישן: 4,000 לחודש × 12."),
    two("8", "31.12.2025", "ריבית על ההלוואה", "הוצאות ריבית", "הוצאות ריבית לשלם", round2((L5.amount * L5.rate * (13 - L5.start)) / 12), `${f(L5.amount)} × ${L5.rate * 100}% × ${13 - L5.start}/12.`),
    two("9", "31.12.2025", "מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", 262_000, "שווי המימוש נמוך מהעלות, ולכן נרשם הוא."),
  ],
  trap: "בטנדרים: הפחת הנצבר במאזן הבוחן הוא עד סוף 2024, ובמכירה מוציאים רק את העלות ואת הפחת של הטנדר שנמכר. ובהפרשה: קודם מוחקים, ואז מחשבים על הלקוחות שנשארו.",
};

// Exam 6: computers whose cost comes back through X, a new vehicle, an entry recorded backwards, a returned cheque before the allowance.
const D6 = { regular: 10, laptops: 6, times: 1.5, x: 2_400, years: 4, bought: { year: 2023, month: 4 } };
const d6Cost = (D6.regular + D6.laptops * D6.times) * D6.x;
const d6Acc = accumulatedTo(d6Cost, { years: D6.years }, D6.bought, { year: 2024, month: 12 });
const d6Year = depreciationOfYear(d6Cost, { years: D6.years }, D6.bought, 2025);
const K6 = { cost: 132_000, rate: 0.15, month: 8 };
const k6Year = depreciationOfYear(K6.cost, { rate: K6.rate }, { year: 2025, month: K6.month }, 2025);
const R6 = { customers: 560_000, cheque: 22_000, fee: 80, allowance: 24_000, rate: 0.05 };
const r6Required = round2((R6.customers + R6.cheque) * R6.rate);

export const EXAM6: WorksheetExam = {
  name: "שקמה מתוקים בע״מ",
  time: 50,
  given: {
    מזומן: 486_000,
    לקוחות: R6.customers,
    "הפרשה להפסדי אשראי חזויים": -R6.allowance,
    "מלאי פתיחה": 176_000,
    קניות: 1_240_000,
    "מחשבים – פחת נצבר": -d6Acc,
    "כלי רכב": K6.cost,
    ספקים: -230_000,
    "מקדמות מלקוחות": -24_000,
    "הון מניות": -300_000,
    מכירות: -2_480_000,
    "הוצאות שכר": 594_000,
    "הוצאות פרסום": 38_400,
    "הוצאות שכירות": 96_000,
  },
  computed: [{ account: "מחשבים", value: d6Cost, why: `עלות = ${D6.regular}X + ${D6.laptops} × ${D6.times}X = ${D6.regular + D6.laptops * D6.times}X. מאפריל 2023 עד סוף 2024: 21 חודשים מתוך 48. ${D6.regular + D6.laptops * D6.times}X × 21/48 = ${f(d6Acc)}, ולכן X = ${f(D6.x)}.` }],
  facts: [
    `מחשבים: ב-1.4.2023 נקנו ${D6.regular} מחשבים רגילים ו-${D6.laptops} מחשבים ניידים, ל-${D6.years} שנים. נייד עולה פי ${D6.times} ממחשב רגיל. העלות לא נתונה במאזן הבוחן, והפחת של 2025 לא נרשם.`,
    `ב-1.${K6.month}.2025 נקנה רכב ב-${f(K6.cost)} ₪ במזומן, והקנייה נרשמה. שיעור הפחת ${K6.rate * 100}% בשנה, והפחת לא נרשם.`,
    "בנובמבר התקבלה במזומן מקדמה של 16,000 ₪ מלקוח. נרשם: ח׳ מקדמות מלקוחות / ז׳ מזומן.",
    `ב-29.12.2025 חזר צ׳ק של לקוח על ${f(R6.cheque)} ₪, והבנק חייב עמלה של ${R6.fee} ₪. לא נרשם דבר.`,
    `החברה מעמידה את ההפרשה להפסדי אשראי על ${R6.rate * 100}% מיתרת הלקוחות.`,
    "ב-1.10.2025 שולמו 38,400 ₪ על פרסום לשנה, ונרשמו כולם כהוצאה.",
    "השכר של ינואר עד נובמבר נרשם, בשווה בכל חודש. מדצמבר השכר עלה ב-10%, ושכר דצמבר ישולם ב-10.1.2026.",
    "מלאי הסגירה: עלות 198,000 ₪, שווי מימוש נטו 205,000 ₪.",
  ],
  entries: [
    two("1", "31.12.2025", "פחת המחשבים", "הוצאות פחת", "מחשבים – פחת נצבר", d6Year, `${f(d6Cost)} ÷ ${D6.years} = ${f(d6Year)}.`),
    two("2", "31.12.2025", "פחת הרכב", "הוצאות פחת", "כלי רכב – פחת נצבר", k6Year, `${f(K6.cost)} × ${K6.rate * 100}% × 5/12: אוגוסט עד דצמבר.`),
    two("3", "31.12.2025", "תיקון: מקדמה שנרשמה הפוך", "מזומן", "מקדמות מלקוחות", 32_000, "מבטלים את מה שנרשם ורושמים את מה שצריך: פעמיים 16,000."),
    two("4", "29.12.2025", "הצ׳ק שחזר", "לקוחות", "מזומן", R6.cheque, "הלקוח שוב חייב, והמזומן לא באמת נכנס."),
    two("5", "29.12.2025", "עמלת הבנק", "הוצאות עמלות", "מזומן", R6.fee),
    two("6", "31.12.2025", "השלמת ההפרשה", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", round2(r6Required - R6.allowance), `לקוחות אחרי הצ׳ק שחזר: ${f(R6.customers + R6.cheque)}. נדרש: × ${R6.rate * 100}% = ${f(r6Required)}. יש: ${f(R6.allowance)}.`),
    two("7", "31.12.2025", "פרסום: מה ששייך ל-2026", "הוצאות פרסום מראש", "הוצאות פרסום", 28_800, "3,200 לחודש. 9 חודשים שייכים ל-2026."),
    two("8", "31.12.2025", "שכר דצמבר", "הוצאות שכר", "הוצאות שכר לשלם", 59_400, "594,000 ÷ 11 = 54,000. דצמבר: × 1.1."),
    two("9", "31.12.2025", "מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", 198_000, "העלות נמוכה משווי המימוש."),
  ],
  trap: "הצ׳ק שחזר מגדיל את הלקוחות, ולכן נרשם לפני ההפרשה. ובמקדמה שנרשמה הפוך, התיקון כפול.",
};
