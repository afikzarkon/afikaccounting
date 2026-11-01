/**
 * The multi-column worksheet, from a whole question: a company's trial balance
 * before the year-end adjustments, the facts behind each adjustment, and the
 * adjustments themselves. Rimon Ltd is the lesson's worked question; Sigal
 * Ltd is the practice game's, with more accounts and a trap or two among them.
 * Every balance is computed from these, as on the rest of the course.
 */

import { type Balances, balancesOf, type Entry, isBalanceSheet, ledger, round2, statements } from "./basics";

/** One adjustment: the fact as the question tells it, the entry it calls for, and — for the game — the accounts offered to write it with. */
export type WorksheetItem = { title: string; story: string; entry: Entry; accounts: string[] };

export type WorksheetCase = {
  name: string;
  /** The year-end, as the question dates it. */
  date: string;
  /** The trial balance before the adjustments: debit positive, credit negative. */
  preliminary: Balances;
  items: WorksheetItem[];
  /** A word under an account whose side its name alone does not tell (retained earnings in debit, say). */
  notes?: Record<string, string>;
  /** An account whose balance the question leaves out: its side and amount are what makes the trial balance balance. */
  unknown?: string;
  /** At the end, the closing retained earnings too — not only the profit. */
  askRetained?: boolean;
};

const e = (id: string, text: string, dr: string, cr: string, amount: number, why: string): Entry => ({
  id,
  date: "31.12",
  text,
  lines: [
    { account: dr, dr: amount },
    { account: cr, cr: amount },
  ],
  why,
});

// ---------------------------------------------------------------------------
// The worked question: Rimon Ltd, 31.12.2025.

const RM = { rent: 54_000, rentMonthsNext: 10, salary: 17_000, loan: 240_000, loanRate: 0.05, loanMonths: 5, commissionsNext: 8_000, deposit: 90_000, depositRate: 0.04, depositMonths: 8, stockCost: 58_000, stockNrv: 63_000 };
const f = (v: number) => v.toLocaleString("en-US");

export const RIMON: WorksheetCase = {
  name: "רימון בע״מ",
  date: "31.12.2025",
  preliminary: {
    מזומן: 283_000,
    לקוחות: 136_000,
    "פיקדונות בבנק": RM.deposit,
    ציוד: 260_000,
    "מלאי פתיחה": 51_000,
    קניות: 344_000,
    "הוצאות שכר": 187_000,
    "הוצאות שכירות": RM.rent,
    "הוצאות ביטוח": 21_000,
    "הוצאות פרסום": 15_000,
    ספקים: -104_000,
    "הלוואה שהתקבלה": -RM.loan,
    "הון מניות": -280_000,
    עודפים: -82_000,
    מכירות: -690_000,
    "הכנסות מעמלות": -45_000,
  },
  items: [
    {
      title: "שכירות",
      story: `ב-1.11.2025 שולמו ${f(RM.rent)} ₪ שכירות לשנה, ונרשמו כולם כהוצאה.`,
      entry: e("א", "שכירות ששולמה מראש", "הוצאות שכירות מראש", "הוצאות שכירות", (RM.rent * RM.rentMonthsNext) / 12, `${RM.rentMonthsNext} מתוך 12 החודשים שייכים ל-2026: ${f(RM.rent)} × ${RM.rentMonthsNext}/12. יוצאים מההוצאה ועוברים להוצאות מראש — נכס.`),
      accounts: ["הוצאות שכירות מראש", "הוצאות שכירות", "מזומן", "הוצאות שכירות לשלם"],
    },
    {
      title: "שכר דצמבר",
      story: `שכר דצמבר, ${f(RM.salary)} ₪, ישולם ב-9.1.2026 ולא נרשם.`,
      entry: e("ב", "שכר דצמבר שטרם שולם", "הוצאות שכר", "הוצאות שכר לשלם", RM.salary, "העובדים עבדו בדצמבר — הוצאה של 2025. הכסף עוד לא יצא: הוצאות לשלם, התחייבות."),
      accounts: ["הוצאות שכר", "הוצאות שכר לשלם", "מזומן", "הוצאות שכר מראש"],
    },
    {
      title: "ריבית על ההלוואה",
      story: `ההלוואה (${f(RM.loan)} ₪) נלקחה ב-1.8.2025 בריבית שנתית של ${RM.loanRate * 100}%. הריבית משולמת פעם בשנה, ב-31.7, ולא נרשמה.`,
      entry: e("ג", "ריבית שנצברה וטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", round2(RM.loan * RM.loanRate * (RM.loanMonths / 12)), `${RM.loanMonths} חודשים של 2025: ${f(RM.loan)} × ${RM.loanRate * 100}% × ${RM.loanMonths}/12. הוצאה של השנה, שעוד לא שולמה.`),
      accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"],
    },
    {
      title: "עמלות",
      story: `בהכנסות מעמלות כלולים ${f(RM.commissionsNext)} ₪ שהתקבלו בדצמבר על שירות שיינתן בינואר–פברואר 2026.`,
      entry: e("ד", "עמלות שהתקבלו מראש", "הכנסות מעמלות", "הכנסות מעמלות מראש", RM.commissionsNext, "השירות עוד לא ניתן — זו לא הכנסה של 2025. יוצא מההכנסה ועובר להכנסות מראש — התחייבות."),
      accounts: ["הכנסות מעמלות", "הכנסות מעמלות מראש", "מזומן", "הכנסות מעמלות לקבל"],
    },
    {
      title: "ריבית על הפיקדון",
      story: `הפיקדון (${f(RM.deposit)} ₪) הופקד ב-1.5.2025 בריבית שנתית של ${RM.depositRate * 100}%. הריבית תתקבל עם הקרן ב-30.4.2026, ולא נרשמה.`,
      entry: e("ה", "ריבית שהורווחה וטרם התקבלה", "הכנסות ריבית לקבל", "הכנסות ריבית", round2(RM.deposit * RM.depositRate * (RM.depositMonths / 12)), `${RM.depositMonths} חודשים של 2025: ${f(RM.deposit)} × ${RM.depositRate * 100}% × ${RM.depositMonths}/12. הכנסה של השנה, שעוד לא התקבלה — הכנסות לקבל, נכס.`),
      accounts: ["הכנסות ריבית לקבל", "הכנסות ריבית", "פיקדונות בבנק", "מזומן"],
    },
    {
      title: "מלאי סגירה",
      story: `ב-31.12.2025 נספר מלאי בעלות ${f(RM.stockCost)} ₪. שווי המימוש נטו שלו — ${f(RM.stockNrv)} ₪.`,
      entry: e("ו", "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(RM.stockCost, RM.stockNrv), "הנמוך מבין העלות לשווי המימוש נטו. נכס במאזן, ומקטין את עלות המכר ברווח והפסד."),
      accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"],
    },
  ],
};

// ---------------------------------------------------------------------------
// The game: Sigal Marketing Ltd, 31.12.2025 — more accounts, accumulated losses, and credit losses among the adjustments.

const SG = { insurance: 30_000, insuranceMonthsUsed: 8, electricity: 2_600, rent: 48_000, rentMonthsNext: 8, interest: 3_600, customers: 240_000, allowance: 9_000, rate: 0.05, stockCost: 82_000, stockNrv: 96_000 };
const sigalAllowanceUp = round2(SG.customers * SG.rate - SG.allowance);

export const SIGAL: WorksheetCase = {
  name: "סיגל שיווק בע״מ",
  date: "31.12.2025",
  preliminary: {
    מזומן: 209_200,
    לקוחות: SG.customers,
    "הפרשה להפסדי אשראי חזויים": -SG.allowance,
    "מקדמות לספקים": 18_000,
    "מלאי פתיחה": 66_000,
    "כלי רכב": 150_000,
    ציוד: 110_000,
    "הוצאות ביטוח מראש": SG.insurance,
    ספקים: -142_000,
    "מקדמות מלקוחות": -24_000,
    "הלוואה שהתקבלה": -170_000,
    "הון מניות": -320_000,
    עודפים: 35_000,
    מכירות: -940_000,
    "הכנסות משכירות": -SG.rent,
    קניות: 455_000,
    "הוצאות שכר": 248_000,
    "הוצאות חשמל": 21_000,
    "הוצאות אחזקת רכב": 26_000,
    "הוצאות פרסום": 34_000,
    "הוצאות ריבית": 10_800,
  },
  notes: { עודפים: "הפסדים צבורים" },
  items: [
    {
      title: "ביטוח",
      story: `ב-1.5.2025 שולמו ${f(SG.insurance)} ₪ ביטוח לשנה, ונרשמו כולם כהוצאות ביטוח מראש. רשמו את פקודת ההתאמה ב-31.12.`,
      entry: e("1", "החלק של הביטוח שנוצל השנה", "הוצאות ביטוח", "הוצאות ביטוח מראש", (SG.insurance * SG.insuranceMonthsUsed) / 12, `${SG.insuranceMonthsUsed} חודשים נוצלו ב-2025: ${f(SG.insurance)} × ${SG.insuranceMonthsUsed}/12 = ${f((SG.insurance * SG.insuranceMonthsUsed) / 12)}. החלק הזה עובר מהנכס להוצאה.`),
      accounts: ["הוצאות ביטוח", "הוצאות ביטוח מראש", "מזומן", "הוצאות ביטוח לשלם"],
    },
    {
      title: "חשמל",
      story: `חשבון החשמל של דצמבר, ${f(SG.electricity)} ₪, יגיע וישולם בינואר. רשמו את פקודת ההתאמה.`,
      entry: e("2", "חשמל דצמבר שטרם שולם", "הוצאות חשמל", "הוצאות חשמל לשלם", SG.electricity, "את החשמל של דצמבר צרכנו השנה — הוצאה של 2025, שעוד לא שולמה: הוצאות לשלם."),
      accounts: ["הוצאות חשמל", "הוצאות חשמל לשלם", "מזומן", "ספקים"],
    },
    {
      title: "שכירות שהתקבלה",
      story: `ב-1.9.2025 התקבלו ${f(SG.rent)} ₪ על השכרת מחסן לשנה, ונרשמו כולם כהכנסה. רשמו את פקודת ההתאמה.`,
      entry: e("3", "שכירות שהתקבלה מראש", "הכנסות משכירות", "הכנסות משכירות מראש", (SG.rent * SG.rentMonthsNext) / 12, `${SG.rentMonthsNext} חודשים שייכים ל-2026: ${f(SG.rent)} × ${SG.rentMonthsNext}/12 = ${f((SG.rent * SG.rentMonthsNext) / 12)}. עד שנספק אותם — אנחנו חייבים: הכנסות מראש, התחייבות.`),
      accounts: ["הכנסות משכירות", "הכנסות משכירות מראש", "מזומן", "הכנסות משכירות לקבל"],
    },
    {
      title: "ריבית",
      story: `הריבית על ההלוואה לרבעון האחרון, ${f(SG.interest)} ₪, תשולם בינואר ולא נרשמה. רשמו את פקודת ההתאמה.`,
      entry: e("4", "ריבית שטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", SG.interest, "השתמשנו בכסף של הבנק ברבעון האחרון — הוצאה של 2025, שעוד לא שולמה."),
      accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"],
    },
    {
      title: "הפסדי אשראי",
      story: `ההפרשה הנדרשת בסוף השנה: ${SG.rate * 100}% מהלקוחות (${f(SG.customers)} ₪). בכרטיס ההפרשה יש ${f(SG.allowance)} ₪. רשמו את פקודת ההתאמה.`,
      entry: e("5", "השלמת ההפרשה להפסדי אשראי", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", sigalAllowanceUp, `נדרשת ${f(SG.customers)} × ${SG.rate * 100}% = ${f(SG.customers * SG.rate)}. יש ${f(SG.allowance)} — חסרים ${f(sigalAllowanceUp)} בזכות.`),
      accounts: ["הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", "לקוחות", "מזומן"],
    },
    {
      title: "מלאי סגירה",
      story: `ב-31.12.2025 נספר מלאי בעלות ${f(SG.stockCost)} ₪, ששווי המימוש נטו שלו ${f(SG.stockNrv)} ₪. רשמו את מלאי הסגירה.`,
      entry: e("6", "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(SG.stockCost, SG.stockNrv), `הנמוך מבין העלות לשווי המימוש נטו: ${f(Math.min(SG.stockCost, SG.stockNrv))}. נכס במאזן, ומקטין את עלות המכר.`),
      accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"],
    },
  ],
};

// ---------------------------------------------------------------------------
// The harder game: Zayit Industries Ltd — retained earnings left out, a compound entry, a correction, and figures to work out first.

const ZY = {
  rentPaid: 42_000,
  rentMonthsNext: 10,
  insurance: 36_000,
  insuranceMonths: 18,
  insuranceMonthsNext: 12,
  feesAdvance: 9_000,
  feesMonthly: 4_500,
  loan: 360_000,
  loanRate: 0.06,
  loanMonths: 9,
  interestPaid: 10_000,
  bankrupt: 7_500,
  customers: 280_000,
  allowance: 11_000,
  rate: 0.04,
  stockCost: 125_000,
  stockNrv: 118_000,
  machine: 19_000,
};
const zyInterest = round2((ZY.loan * ZY.loanRate * ZY.loanMonths) / 12 - ZY.interestPaid);
const zyRequired = round2((ZY.customers - ZY.bankrupt) * ZY.rate);
const zyTopUp = round2(zyRequired - (ZY.allowance - ZY.bankrupt));

export const ZAYIT: WorksheetCase = {
  name: "זית תעשיות בע״מ",
  date: "31.12.2025",
  unknown: "עודפים",
  askRetained: true,
  preliminary: {
    מזומן: 214_000,
    לקוחות: ZY.customers,
    "הפרשה להפסדי אשראי חזויים": -ZY.allowance,
    "פיקדונות בבנק": 140_000,
    "מלאי פתיחה": 92_000,
    מכונות: 450_000,
    "כלי רכב": 175_000,
    ספקים: -162_000,
    "מקדמות מלקוחות": -36_000,
    "הלוואה שהתקבלה": -ZY.loan,
    "הון מניות": -450_000,
    עודפים: -99_000,
    מכירות: -1_480_000,
    "הכנסות מדמי ניהול": -54_000,
    קניות: 760_000,
    "הוצאות שכר": 342_000,
    "הוצאות שכירות": 78_000,
    "הוצאות ביטוח": ZY.insurance,
    "הוצאות אחזקה": 31_000,
    "הוצאות ריבית": ZY.interestPaid,
    "הוצאות פרסום": 44_000,
  },
  items: [
    {
      title: "שכירות",
      story: `בהוצאות השכירות (78,000 ₪) כלול תשלום של ${f(ZY.rentPaid)} ₪ ששולם ב-1.11.2025 על שנה — עד 31.10.2026. רשמו את פקודת ההתאמה.`,
      entry: e("1", "החלק של השכירות ששייך ל-2026", "הוצאות שכירות מראש", "הוצאות שכירות", (ZY.rentPaid * ZY.rentMonthsNext) / 12, `רק התשלום של 1.11 נוגע לשנה הבאה — לא כל 78,000. ${ZY.rentMonthsNext} מתוך 12 חודשיו שייכים ל-2026: ${f(ZY.rentPaid)} × ${ZY.rentMonthsNext}/12.`),
      accounts: ["הוצאות שכירות מראש", "הוצאות שכירות", "מזומן", "הוצאות שכירות לשלם"],
    },
    {
      title: "ביטוח ל-18 חודשים",
      story: `הוצאות הביטוח (${f(ZY.insurance)} ₪) שולמו ב-1.7.2025 על 18 חודשים — עד 31.12.2026. רשמו את פקודת ההתאמה.`,
      entry: e("2", "החלק של הביטוח ששייך ל-2026", "הוצאות ביטוח מראש", "הוצאות ביטוח", (ZY.insurance * ZY.insuranceMonthsNext) / ZY.insuranceMonths, `התקופה 18 חודשים, לא 12: ${ZY.insuranceMonthsNext} חודשים (כל 2026) שייכים לשנה הבאה: ${f(ZY.insurance)} × ${ZY.insuranceMonthsNext}/${ZY.insuranceMonths}.`),
      accounts: ["הוצאות ביטוח מראש", "הוצאות ביטוח", "מזומן", "הוצאות ביטוח לשלם"],
    },
    {
      title: "דמי ניהול — פקודה מורכבת",
      story: `לקוח משלם ${f(ZY.feesMonthly)} ₪ דמי ניהול לחודש. בהכנסות (54,000 ₪) כלולים ${f(ZY.feesAdvance)} ₪ ששולמו מראש על ינואר–פברואר 2026, ודמי דצמבר טרם התקבלו ולא נרשמו. רשמו את שני התיקונים בפקודה אחת.`,
      entry: {
        id: "3",
        date: "31.12",
        text: "דמי ניהול: מה ששייך ל-2026, ומה שמגיע על דצמבר",
        lines: [
          { account: "הכנסות מדמי ניהול לקבל", dr: ZY.feesMonthly },
          { account: "הכנסות מדמי ניהול", dr: ZY.feesAdvance - ZY.feesMonthly },
          { account: "הכנסות מדמי ניהול מראש", cr: ZY.feesAdvance },
        ],
        why: `שני תיקונים על אותה הכנסה: ${f(ZY.feesAdvance)} יוצאים ממנה להכנסות מראש (זכות), ו-${f(ZY.feesMonthly)} של דצמבר נכנסים אליה מול הכנסות לקבל (חובה). בפקודה אחת ההכנסה נטו קטנה ב-${f(ZY.feesAdvance - ZY.feesMonthly)}.`,
      },
      accounts: ["הכנסות מדמי ניהול לקבל", "הכנסות מדמי ניהול", "הכנסות מדמי ניהול מראש", "מזומן", "לקוחות"],
    },
    {
      title: "ריבית — חלק כבר שולם",
      story: `ההלוואה (${f(ZY.loan)} ₪) נלקחה ב-1.4.2025 בריבית שנתית של ${ZY.loanRate * 100}%. עד 31.12 שולמה ונרשמה ריבית של ${f(ZY.interestPaid)} ₪. רשמו את פקודת ההתאמה.`,
      entry: e("4", "ריבית שנצברה וטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", zyInterest, `ריבית השנה: ${f(ZY.loan)} × ${ZY.loanRate * 100}% × ${ZY.loanMonths}/12 = ${f(ZY.interestPaid + zyInterest)}. כבר נרשמו ${f(ZY.interestPaid)} — חסרים ${f(zyInterest)}.`),
      accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"],
    },
    {
      title: "לקוח שפשט רגל",
      story: `ב-31.12 התברר שלקוח שחייב ${f(ZY.bankrupt)} ₪ פשט רגל. החוב טרם נמחק. רשמו את מחיקת החוב.`,
      entry: e("5", "מחיקת חוב אבוד", "הפרשה להפסדי אשראי חזויים", "לקוחות", ZY.bankrupt, "המחיקה כנגד ההפרשה — בלי הוצאה. הלקוחות וההפרשה קטנים יחד."),
      accounts: ["הפרשה להפסדי אשראי חזויים", "לקוחות", "הוצאות הפסדי אשראי", "מזומן"],
    },
    {
      title: "השלמת ההפרשה",
      story: `ההפרשה הנדרשת: ${ZY.rate * 100}% מיתרת הלקוחות — אחרי המחיקה. רשמו את פקודת ההתאמה.`,
      entry: e("6", "השלמת ההפרשה להפסדי אשראי", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", zyTopUp, `לקוחות אחרי המחיקה: ${f(ZY.customers)} − ${f(ZY.bankrupt)} = ${f(ZY.customers - ZY.bankrupt)}; נדרשת ${f(zyRequired)}. בכרטיס ההפרשה אחרי המחיקה: ${f(ZY.allowance)} − ${f(ZY.bankrupt)} = ${f(ZY.allowance - ZY.bankrupt)}. חסרים ${f(zyTopUp)}.`),
      accounts: ["הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", "לקוחות", "מזומן"],
    },
    {
      title: "מלאי סגירה — שווי מימוש נמוך",
      story: `ב-31.12 נספר מלאי בעלות ${f(ZY.stockCost)} ₪. בגלל פגם בחלק מהסחורה, שווי המימוש נטו שלו ${f(ZY.stockNrv)} ₪. רשמו את מלאי הסגירה.`,
      entry: e("7", "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(ZY.stockCost, ZY.stockNrv), `הנמוך מבין העלות (${f(ZY.stockCost)}) לשווי המימוש נטו (${f(ZY.stockNrv)}): ${f(Math.min(ZY.stockCost, ZY.stockNrv))}.`),
      accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"],
    },
    {
      title: "פקודת תיקון — מכונה",
      story: `בהוצאות האחזקה כלולים ${f(ZY.machine)} ₪ ששולמו ב-31.12 על רכישת מכונה חדשה. רשמו את פקודת התיקון.`,
      entry: e("8", "תיקון: מכונה שנרשמה כהוצאה", "מכונות", "הוצאות אחזקה", ZY.machine, "מכונה שתשמש שנים היא נכס, לא הוצאה. מוציאים את הסכום מהוצאות האחזקה ומעבירים לנכס."),
      accounts: ["מכונות", "הוצאות אחזקה", "מזומן", "ספקים"],
    },
  ],
};

export const adjustmentsOf = (c: WorksheetCase) => c.items.map((i) => i.entry);

/** Every row of the sheet after the first `upTo` adjustments: the balance before, the adjustments so far, the balance after. */
export function worksheetRows(c: WorksheetCase, upTo = c.items.length) {
  const entries = adjustmentsOf(c).slice(0, upTo);
  const adj = ledger(entries);
  const final = balancesOf(ledger(entries, c.preliminary));
  return Object.keys(final).map((account) => {
    const t = adj.find((x) => x.account === account);
    return {
      account,
      isNew: !(account in c.preliminary),
      before: c.preliminary[account] ?? 0,
      adjDr: round2((t?.dr ?? []).reduce((s, p) => s + p.amount, 0)),
      adjCr: round2((t?.cr ?? []).reduce((s, p) => s + p.amount, 0)),
      after: final[account],
      balanceSheet: isBalanceSheet(account),
    };
  });
}

/** The year's result: profit, and retained earnings from opening to closing (credit positive). */
export function worksheetResult(c: WorksheetCase) {
  const final = balancesOf(ledger(adjustmentsOf(c), c.preliminary));
  const s = statements(final);
  const openingRetained = -(c.preliminary["עודפים"] ?? 0);
  return { profit: s.profit, totalIncome: s.totalIncome, totalExpenses: s.totalExpenses, openingRetained, closingRetained: round2(openingRetained + s.profit) };
}
