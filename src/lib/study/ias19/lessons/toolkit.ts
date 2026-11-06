import { partInterest, partRate, pv, shortTermExpense, simplePart } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { FORMULA, said, tool, TOOL } from "../formulas";
import { calc, choice, COURSE, COURSE_HREF, fmt, pct } from "../shared";

/** The hook: Dana's grant, paid when she retires in a few years — what is it worth today? */
export const HOOK = { amount: 100_000, years: 3, rate: 0.06 };

/** Forward in time: a deposit in the bank, year by year. */
export const DEPOSIT = { amount: 1_000, rate: 0.1, years: 3 };
export const DEPOSIT_FV = DEPOSIT.amount * (1 + DEPOSIT.rate) ** DEPOSIT.years;
/** Part of a year: the periods a question asks about, and a balance to earn interest on. */
export const PERIODS = [
  { label: "חודש", months: 1 },
  { label: "רבעון", months: 3 },
  { label: "חצי שנה", months: 6 },
  { label: "שנתיים", months: 24 },
];
export const PART_BALANCE = 100_000;
/** The roll-forward: a vacation provision whose expense is the missing line. */
export const VACATION = { opening: 6_000, payments: 15_000, closing: 7_000 };
export const VACATION_EXPENSE = shortTermExpense(VACATION.opening, VACATION.payments, VACATION.closing);
/** Dana's grant today, and a year on — the same debt, a year closer. */
export const DANA_NOW = pv(HOOK.amount, HOOK.rate, HOOK.years);
export const DANA_NEXT = pv(HOOK.amount, HOOK.rate, HOOK.years - 1);

/** The closing practice: one company, a tool for each question. Yossi's debt today is taken rounded, as a learner would carry it on. */
export const CASE = { grant: 50_000, years: 2, rate: 0.05, vacation: { opening: 3_000, expense: 12_000, closing: 4_000 } };
export const CASE_TODAY = Math.round(pv(CASE.grant, CASE.rate, CASE.years));
export const CASE_INTEREST = Math.round(CASE_TODAY * CASE.rate);

/** The exercises, in the order of the screens. */
const FV_Q = { amount: 5_000, years: 3, rate: 0.08 };
const PV_Q = { fv: 40_000, years: 4, rate: 0.06 };
const COUNT_Q = { fv: 20_000, worked: 5, years: 3, rate: 0.05 };
const MONTH_Q = { balance: 100_000, rate: 0.12, months: 1 };
const QUARTER = { balance: 200_000, rate: 0.08, months: 3 };
const HALF_Q = { fv: 60_000, years: 1.5, rate: 0.04 };
const ROLL_Q = { opening: 5_000, payments: 22_000, closing: 6_500 };
const CLOSE_Q = { opening: 30_000, rate: 0.06, paid: 4_000 };
const CLOSE_INTEREST = CLOSE_Q.opening * CLOSE_Q.rate;
const DIRECTION = { fv: 10_000, years: 2, rate: 0.1 };

/** A roll-forward written as on a worksheet, one line each: the obligation is a credit and prints in brackets, a payment prints as it is. */
const rollLines = (title: string, rows: [label: string, credit: number, mark?: string][]) =>
  `${title}:\n${rows.map(([label, v, mark]) => `${label}: ${v > 0 ? `(${fmt(Math.round(v))})` : fmt(Math.round(-v))}${mark ? `  ← ${mark}` : ""}`).join("\n")}`;

const traps: Trap[] = [
  {
    id: "count-n",
    prompt: "עובד עבד כבר 6 שנים, ויקבל מענק בעוד 9 שנים. מה YEAR בנוסחת הערך הנוכחי?",
    options: ["9", "6", "15", "3"],
    answer: 0,
    why: `YEAR הוא מספר השנים מהיום ועד התשלום, לא השנים שכבר עברו.\n${said(tool.n(15, 6))}`,
    traps: ["", "המלכודת: לספור את השנים שעברו. ההיוון מחזיר מהעתיד להיום, ולכן סופרים קדימה.", "זה כל הוותק בסוף, לא המרחק מהיום לתשלום.", "אין סיבה לחסר: 9 הוא בדיוק המרחק."],
  },
  {
    id: "pv-direction",
    prompt: `כמה שווים היום ${fmt(DIRECTION.fv)} ₪ שיתקבלו בעוד שנתיים, בריבית ${pct(DIRECTION.rate)}?`,
    options: [
      `${fmt(Math.round(pv(DIRECTION.fv, DIRECTION.rate, DIRECTION.years)))} ₪`,
      `${fmt(Math.round(DIRECTION.fv * (1 + DIRECTION.rate) ** DIRECTION.years))} ₪`,
      `${fmt(DIRECTION.fv * (1 - DIRECTION.rate * DIRECTION.years))} ₪`,
      `${fmt(Math.round(pv(DIRECTION.fv, DIRECTION.rate, 1)))} ₪`,
    ],
    answer: 0,
    why: `מהעתיד להיום מחלקים, פעם לכל שנה:\n${said(tool.pv(DIRECTION.fv, DIRECTION.rate, DIRECTION.years))}`,
    traps: ["", "המלכודת: להכפיל במקום לחלק. זה הערך העתידי, כמה יהיה בעוד שנתיים, לא כמה זה שווה היום.", "זו הורדה של 10% פעמיים מהסכום, בלי ריבית דריבית.", "זו חלוקה אחת בלבד, כאילו נשארה שנה."],
  },
  {
    id: "quarter-rate",
    prompt: `ריבית שנתית ${pct(QUARTER.rate)}. מה שיעור הריבית לרבעון, בריבית דריבית?`,
    options: [pct(partRate(QUARTER.rate, QUARTER.months)), pct(simplePart(QUARTER.rate, QUARTER.months)), pct(QUARTER.rate), pct(QUARTER.rate / 3)],
    answer: 0,
    why: `רבעון הוא 3 חודשים מתוך 12, ולכן YEAR = 3/12.\n${said(tool.partRate(QUARTER.rate, QUARTER.months))}`,
    traps: [
      "",
      `זו ריבית פשוטה. היא נכונה כשהשאלה מבקשת ריבית פשוטה; כאן ביקשו ריבית דריבית.\n${said(tool.simple(QUARTER.rate, QUARTER.months))}`,
      "זו ריבית של שנה שלמה, לא של רבעון.",
      "רבעון הוא 3 חודשים מתוך 12, לא שליש שנה.",
    ],
  },
  {
    id: "payment-sign",
    prompt: "במעגל התחייבות, החברה שילמה לעובדים 30,000 ₪ במהלך השנה. מה התשלום עושה ליתרה?",
    options: ["מקטין אותה ב-30,000", "מגדיל אותה ב-30,000", "לא משפיע, כי הוא הוצאה", "מקטין אותה רק בסוף השנה הבאה"],
    answer: 0,
    why: `תשלום מסלק חלק מהחוב, ולכן יתרת ההתחייבות קטנה. במעגל הוא בא עם מינוס:\n${TOOL.roll}`,
    traps: ["", "המלכודת: לחבר את התשלום כמו הוצאה. הוא יוצא מההתחייבות, לא נכנס אליה.", "ההוצאה היא מה שנוסף להתחייבות; התשלום הוא מה שיוצא ממנה.", "ההשפעה מיידית, ביום התשלום."],
  },
];

/** Lesson 2: the toolkit — money forward and back in time, a rate for part of a year, and the roll-forward whose missing line is found. Every result both ways: by the formula and in Excel. */
export const TOOLKIT: StudyModule = {
  slug: "ias19-toolkit",
  course: COURSE,
  n: 2,
  title: "ארגז כלים: ערך עתידי, ערך נוכחי, שברי שנה ומעגל",
  description: "הכלים המימוניים שצריך לפני הקורס. איך כסף גדל קדימה בזמן, כמה שווה היום סכום שישולם בעתיד, איך הופכים ריבית שנתית לרבעון או לחודש, ואיך מוצאים את המספר שחסר במעגל. כל פתרון בשתי דרכים: בנוסחה ובאקסל.",
  goal: "לחשב ערך עתידי וערך נוכחי, ריבית לחלק משנה, ולמצוא את המספר החסר במעגל, בנוסחה ובאקסל.",
  outcomes: [
    "להסביר למה חוב שישולם בעתיד שווה היום פחות",
    "לחשב ערך עתידי וערך נוכחי, בנוסחה וב-FV ו-PV של אקסל",
    "להפוך ריבית שנתית לריבית לרבעון, לחודש או לחצי שנה, בריבית דריבית ובריבית פשוטה",
    "לבנות מעגל של יתרה ולמצוא בו שורה אחת שחסרה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-tool-hook", title: "למה צריך מימון בקורס על עובדים" },
    { id: "emp-tool-fv", title: "קדימה בזמן: ריבית שנתית וערך עתידי" },
    { id: "emp-tool-pv", title: "אחורה בזמן: ערך נוכחי" },
    { id: "emp-tool-part", title: "ריבית לתקופה שאינה שנה" },
    { id: "emp-tool-roll", title: "המעגל: מה קרה ליתרה במשך השנה" },
    { id: "emp-tool-practice", title: "תרגול מסכם: כל הכלים במקרה אחד" },
  ],
  exercises: [
    calc("tool-fv", "ערך עתידי", `מפקידים ${fmt(FV_Q.amount)} ₪ ל-${FV_Q.years} שנים בריבית ${pct(FV_Q.rate)}. כמה יהיה בסוף?`, FV_Q.amount * (1 + FV_Q.rate) ** FV_Q.years, [
      `קדימה בזמן, ולכן כופלים ב-${1 + FV_Q.rate} פעם לכל שנה:\n${said(tool.fv(FV_Q.amount, FV_Q.rate, FV_Q.years))}`,
    ]),
    calc("tool-pv", "ערך נוכחי", `מענק של ${fmt(PV_Q.fv)} ₪ ישולם בעוד ${PV_Q.years} שנים. שיעור ההיוון ${pct(PV_Q.rate)}. כמה הוא שווה היום?`, pv(PV_Q.fv, PV_Q.rate, PV_Q.years), [
      `מהעתיד להיום, ולכן מחלקים ב-${1 + PV_Q.rate} פעם לכל שנה:\n${said(tool.pv(PV_Q.fv, PV_Q.rate, PV_Q.years))}`,
    ]),
    calc("tool-count", "ערך נוכחי: כמה שנים", `עובד עבד ${COUNT_Q.worked} שנים, ויקבל ${fmt(COUNT_Q.fv)} ₪ בעוד ${COUNT_Q.years} שנים. שיעור ההיוון ${pct(COUNT_Q.rate)}. מה הערך הנוכחי?`, pv(COUNT_Q.fv, COUNT_Q.rate, COUNT_Q.years), [
      `YEAR הוא מספר השנים מהיום ועד התשלום, ${COUNT_Q.years}. השנים שהעובד כבר עבד לא נכנסות לחישוב.`,
      said(tool.pv(COUNT_Q.fv, COUNT_Q.rate, COUNT_Q.years)),
    ]),
    calc("tool-month", "ריבית לחודש", `יתרה של ${fmt(MONTH_Q.balance)} ₪, ריבית שנתית ${pct(MONTH_Q.rate)}. מה הריבית לחודש אחד, בריבית דריבית?`, partInterest(MONTH_Q.balance, MONTH_Q.rate, MONTH_Q.months), [
      `חודש הוא 1 מתוך 12, ולכן YEAR = 1/12. קודם השיעור לחודש:\n${said(tool.partRate(MONTH_Q.rate, MONTH_Q.months))}`,
      `ואז הריבית על היתרה:\n${said(tool.part(MONTH_Q.balance, MONTH_Q.rate, MONTH_Q.months))}`,
      `בריבית פשוטה היו יוצאים ${fmt(MONTH_Q.balance * simplePart(MONTH_Q.rate, MONTH_Q.months))} ₪, קצת יותר. בריבית פשוטה משתמשים רק כשהשאלה מבקשת אותה.`,
    ]),
    calc("tool-quarter", "ריבית לרבעון", `יתרה של ${fmt(QUARTER.balance)} ₪, ריבית שנתית ${pct(QUARTER.rate)}. מה הריבית לרבעון, בריבית דריבית?`, partInterest(QUARTER.balance, QUARTER.rate, QUARTER.months), [
      `רבעון הוא 3 חודשים מתוך 12, ולכן YEAR = 3/12. קודם השיעור לרבעון:\n${said(tool.partRate(QUARTER.rate, QUARTER.months))}`,
      `ואז הריבית על היתרה:\n${said(tool.part(QUARTER.balance, QUARTER.rate, QUARTER.months))}`,
    ]),
    calc("tool-simple", "ריבית פשוטה", `יתרה של ${fmt(QUARTER.balance)} ₪, ריבית שנתית ${pct(QUARTER.rate)}. השאלה מבקשת ריבית פשוטה. מה הריבית לרבעון?`, QUARTER.balance * simplePart(QUARTER.rate, QUARTER.months), [
      `בריבית פשוטה מכפילים את השיעור השנתי בחלק מהשנה:\n${said(tool.simpleOn(QUARTER.balance, QUARTER.rate, QUARTER.months))}`,
      `בריבית דריבית הייתה יוצאת קצת פחות, ${fmt(Math.round(partInterest(QUARTER.balance, QUARTER.rate, QUARTER.months)))} ₪.`,
    ]),
    calc("tool-half", "ערך נוכחי, שנה וחצי", `${fmt(HALF_Q.fv)} ₪ ישולמו בעוד שנה וחצי. שיעור ההיוון ${pct(HALF_Q.rate)}. מה הערך הנוכחי?`, pv(HALF_Q.fv, HALF_Q.rate, HALF_Q.years), [
      `YEAR לא חייב להיות שלם. שנה וחצי הן ${HALF_Q.years} שנים, ולכן YEAR = ${HALF_Q.years}.`,
      said(tool.pv(HALF_Q.fv, HALF_Q.rate, HALF_Q.years)),
    ]),
    calc("tool-expense", "המעגל: הוצאה", `הפרשה לחופשה: יתרת פתיחה ${fmt(ROLL_Q.opening)} ₪, שולמו ${fmt(ROLL_Q.payments)} ₪, יתרת סגירה ${fmt(ROLL_Q.closing)} ₪. מה ההוצאה של השנה?`, shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing), [
      rollLines("הפרשה לחופשה", [
        ["יתרת פתיחה", ROLL_Q.opening],
        ["הוצאה", shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing), "השורה החסרה"],
        ["תשלומים", -ROLL_Q.payments],
        ["יתרת סגירה", ROLL_Q.closing],
      ]),
      `החוב עלה ב-${fmt(ROLL_Q.closing - ROLL_Q.opening)} אף שיצאו ${fmt(ROLL_Q.payments)}, ולכן נוסף יותר ממה שיצא:\n${said(tool.expense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing))}`,
    ]),
    calc("tool-closing", "המעגל: יתרת סגירה", `חוב לעובד של ${fmt(CLOSE_Q.opening)} ₪ בתחילת השנה, בריבית ${pct(CLOSE_Q.rate)}. בסוף השנה שולמו לו ${fmt(CLOSE_Q.paid)} ₪. מה יתרת הסגירה?`, CLOSE_Q.opening + CLOSE_INTEREST - CLOSE_Q.paid, [
      `התשלום היה בסוף השנה, ולכן הריבית היא על כל החוב לשנה שלמה: ${fmt(CLOSE_Q.opening)} × ${pct(CLOSE_Q.rate)} = ${fmt(CLOSE_INTEREST)} ₪.`,
      rollLines("התחייבות לעובד", [
        ["יתרת פתיחה", CLOSE_Q.opening],
        [`ריבית ${pct(CLOSE_Q.rate)}`, CLOSE_INTEREST],
        ["תשלומים", -CLOSE_Q.paid],
        ["יתרת סגירה", CLOSE_Q.opening + CLOSE_INTEREST - CLOSE_Q.paid],
      ]),
      said(tool.closing(CLOSE_Q.opening, CLOSE_INTEREST, CLOSE_Q.paid)),
    ]),
    choice(
      "which-unknown",
      "המעגל",
      "במעגל של הפרשה לחופשה ידועות יתרת הפתיחה, יתרת הסגירה וההוצאה של השנה. איזה מספר אפשר למצוא מהם?",
      ["את התשלומים לעובדים", "רק את ההוצאה", "שום דבר, חסרים נתונים", "את יתרת הפתיחה של השנה הבאה בלבד"],
      0,
      `במעגל אפשר למצוא כל שורה אחת שחסרה, אם כל השאר ידועות. כאן חסרים התשלומים:\n${TOOL.roll}\n${FORMULA.paymentsST}`,
    ),
  ],
  traps,
  tips: [
    "סכום שישולם בעתיד שווה היום פחות. קדימה בזמן כופלים ב-(1 + RATE), אחורה מחלקים.",
    `ערך עתידי: ${TOOL.fv}. באקסל: ${TOOL.fvExcel}, ואת pv כותבים עם מינוס.`,
    `ערך נוכחי: ${TOOL.pv}, ו-YEAR הוא השנים מהיום ועד התשלום. באקסל: ${TOOL.pvExcel}, ואת fv כותבים עם מינוס.`,
    `שיעור לתקופה: ${TOOL.partRate}. רבעון: YEAR = 3/12; חודש: 1/12. ריבית פשוטה, רק כשהשאלה מבקשת: ${TOOL.simple}.`,
    `כלל המעגל: ${TOOL.roll}. כשחסרה שורה אחת, היא יוצאת מכל השאר.`,
  ],
};
