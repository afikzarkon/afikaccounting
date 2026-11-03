import { partInterest, partRate, pv, rollForward, shortTermExpense, simplePart } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { FORMULA, said, tool, TOOL } from "../formulas";
import { calc, choice, COURSE, COURSE_HREF, fmt, lessonRef, pct } from "../shared";

/** The hook: a grant promised to an employee, paid in a few years — what is it worth today? */
export const HOOK = { amount: 8_000, years: 4, rate: 0.06 };

/** The worked examples: one of each tool, on one company's year. */
export const SOLVED = {
  pv: { fv: 15_600, years: 6, rate: 0.07 },
  part: { balance: 18_000, rate: 0.05, months: 8 },
  roll: { opening: 6_200, payments: 158_000, closing: 7_100 },
};
export const SOLVED_PV = pv(SOLVED.pv.fv, SOLVED.pv.rate, SOLVED.pv.years);
export const SOLVED_PART = partInterest(SOLVED.part.balance, SOLVED.part.rate, SOLVED.part.months);
export const SOLVED_ROLL = shortTermExpense(SOLVED.roll.opening, SOLVED.roll.payments, SOLVED.roll.closing);

/** "We solve": the same three, with new numbers. */
export const TOGETHER = {
  pv: { fv: 30_000, years: 9, rate: 0.05 },
  part: { balance: 150_000, rate: 0.07, paid: 24_000, paidMonth: 4 },
  roll: { opening: 3_500, payments: 41_000, closing: 2_900 },
};
export const TOGETHER_PV = pv(TOGETHER.pv.fv, TOGETHER.pv.rate, TOGETHER.pv.years);
export const TOGETHER_PART = TOGETHER.part.balance * TOGETHER.part.rate - partInterest(TOGETHER.part.paid, TOGETHER.part.rate, 12 - TOGETHER.part.paidMonth);
export const TOGETHER_ROLL = shortTermExpense(TOGETHER.roll.opening, TOGETHER.roll.payments, TOGETHER.roll.closing);

/** The exercise: a year's interest on an obligation, with a payment and a change of rate — all the balances given. */
export const YEAR = { opening: 512_000, paid: 40_000, paidMonth: 3, amendMonth: 9, after: 1_020_000, rateBefore: 0.075, rateAfter: 0.07 };
export const YEAR_PARTS = {
  opening: partInterest(YEAR.opening, YEAR.rateBefore, YEAR.amendMonth),
  paid: partInterest(YEAR.paid, YEAR.rateBefore, YEAR.amendMonth - YEAR.paidMonth),
  after: partInterest(YEAR.after, YEAR.rateAfter, 12 - YEAR.amendMonth),
};
export const YEAR_INTEREST = YEAR_PARTS.opening - YEAR_PARTS.paid + YEAR_PARTS.after;

const PV_Q = { fv: 25_000, years: 4, rate: 0.06 };
const PART_Q = { balance: 80_000, rate: 0.06, months: 5 };
const QUARTER = { balance: 100_000, rate: 0.08, months: 3 };
const ROLL_Q = { opening: 12_400, payments: 96_000, closing: 10_900 };
const PN_Q = { opening: 2_000, interest: 120, payments: 500, closing: 1_900 };

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
    why: `תשלום מסלק חלק מהחוב, ולכן יתרת ההתחייבות קטנה. במעגל הוא בא עם מינוס:\n${FORMULA.roll}`,
    traps: ["", "המלכודת: לחבר את התשלום כמו הוצאה. הוא יוצא מההתחייבות, לא נכנס אליה.", "ההוצאה היא מה שנוסף להתחייבות; התשלום הוא מה שיוצא ממנה.", "ההשפעה מיידית, ביום התשלום."],
  },
];

/** Lesson 2: the toolkit — present value, interest for part of a year, and a roll-forward whose missing line is found. Every result both ways: by the formula and in Excel. */
export const TOOLKIT: StudyModule = {
  slug: "ias19-toolkit",
  course: COURSE,
  n: 2,
  title: "ארגז כלים: ערך נוכחי, שברי שנה ומעגל התחייבות",
  description: "שלושה כלים שחוזרים בכל שאלה בקורס. כמה שווה היום סכום שישולם בעתיד. בכמה גדלה יתרה בחלק משנה. ואיך מוצאים את המספר שחסר במעגל. כל פתרון בשתי דרכים: בנוסחה ובאקסל.",
  goal: "להוון סכום עתידי, לחשב ריבית על חלק משנה, ולמצוא את המספר החסר במעגל, בנוסחה ובאקסל.",
  outcomes: [
    "לחשב ערך נוכחי של סכום שישולם בעוד כמה שנים, בנוסחה וב-PV של אקסל",
    "להפוך שיעור שנתי לשיעור לרבעון, לחודשים או לשנתיים, בריבית דריבית ובריבית פשוטה",
    "לחשב ריבית שנתית כשיש תשלום ושינוי ריבית באמצע השנה",
    "למצוא את המספר החסר במעגל, ובמיוחד את ה-P.N.",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-tool-hook", title: "הבטחה לעובד, וחוב שגדל במשך השנה" },
    { id: "emp-tool-pv", title: "ערך נוכחי: מהעתיד להיום" },
    { id: "emp-tool-part", title: "ריבית על חלק משנה: בכמה גדלה היתרה" },
    { id: "emp-tool-roll", title: "המעגל, וה-P.N. שמאזן אותו" },
    { id: "emp-tool-solved", title: "דוגמה פתורה: שלושה כלים במקרה אחד" },
    { id: "emp-tool-together", title: "פותרים יחד: שלוש שאלות" },
  ],
  exercises: [
    calc("tool-pv", "ערך נוכחי", `מענק של ${fmt(PV_Q.fv)} ₪ ישולם בעוד ${PV_Q.years} שנים. שיעור ההיוון ${pct(PV_Q.rate)}. מה ערכו היום?`, pv(PV_Q.fv, PV_Q.rate, PV_Q.years), [said(tool.pv(PV_Q.fv, PV_Q.rate, PV_Q.years))]),
    calc("tool-part", "ריבית לחלק משנה", `יתרה של ${fmt(PART_Q.balance)} ₪, שיעור שנתי ${pct(PART_Q.rate)}. בכמה תגדל היתרה ב-${PART_Q.months} חודשים, בריבית דריבית?`, partInterest(PART_Q.balance, PART_Q.rate, PART_Q.months), [
      said(tool.part(PART_Q.balance, PART_Q.rate, PART_Q.months)),
      `ואם השאלה הייתה מבקשת ריבית פשוטה:\n${said(tool.simpleOn(PART_Q.balance, PART_Q.rate, PART_Q.months))}`,
    ]),
    calc("tool-quarter", "ריבית לרבעון", `יתרה של ${fmt(QUARTER.balance)} ₪, שיעור שנתי ${pct(QUARTER.rate)}. מה הריבית לרבעון, בריבית דריבית? (בלי עיגולי ביניים)`, partInterest(QUARTER.balance, QUARTER.rate, QUARTER.months), [
      `קודם השיעור לרבעון:\n${said(tool.partRate(QUARTER.rate, QUARTER.months))}`,
      `ואז הריבית על היתרה, בצעד אחד:\n${said(tool.part(QUARTER.balance, QUARTER.rate, QUARTER.months))}`,
      `ואם השאלה הייתה מבקשת ריבית פשוטה:\n${said(tool.simpleOn(QUARTER.balance, QUARTER.rate, QUARTER.months))}`,
    ]),
    calc("tool-expense", "המעגל: הוצאה", `הפרשה לחופשה: יתרת פתיחה ${fmt(ROLL_Q.opening)} ₪, שולמו ${fmt(ROLL_Q.payments)} ₪, יתרת סגירה ${fmt(ROLL_Q.closing)} ₪. מה ההוצאה של השנה?`, shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing), [
      `ההוצאה היא השורה היחידה שלא נתונה, ולכן היא יוצאת מהמעגל:\n${FORMULA.roll}`,
      said(tool.expense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing)),
    ]),
    calc("tool-pn", "המעגל: P.N.", `פתיחה ${fmt(PN_Q.opening)}, ריבית ${fmt(PN_Q.interest)}, תשלום ${fmt(PN_Q.payments)}, סגירה ${fmt(PN_Q.closing)}. מה ה-P.N. (הפסד, בסכום חיובי)?`, rollForward(PN_Q, "pn").pn, [
      said(tool.pnInterest(PN_Q)),
      "ההתחייבות גדלה מעבר למה שהוסבר, ולכן זה הפסד.",
    ]),
    calc("year-on-opening", "ריבית בשנה מפוצלת: על הפתיחה", `יתרת פתיחה ${fmt(YEAR.opening)} ₪, ריבית ${pct(YEAR.rateBefore)} עד 30.9. בכמה גדלה הפתיחה עד 30.9 (תשעה חודשים)?`, YEAR_PARTS.opening, [
      said(tool.part(YEAR.opening, YEAR.rateBefore, YEAR.amendMonth)),
    ]),
    calc("year-on-payment", "ריבית בשנה מפוצלת: על התשלום", `ב-31.3 שולמו לעובדים ${fmt(YEAR.paid)} ₪. בכמה התשלום מקטין את הריבית עד 30.9 (שישה חודשים, ${pct(YEAR.rateBefore)})?`, YEAR_PARTS.paid, [
      "מיום התשלום החוב קטן, ולכן אין עליו ריבית עד סוף התקופה.",
      said(tool.part(YEAR.paid, YEAR.rateBefore, YEAR.amendMonth - YEAR.paidMonth)),
    ]),
    calc("year-after", "ריבית בשנה מפוצלת: הרבעון האחרון", `אחרי תיקון התוכנית ב-30.9 היתרה ${fmt(YEAR.after)} ₪, והריבית ${pct(YEAR.rateAfter)}. מה הריבית ל-1.10–31.12?`, YEAR_PARTS.after, [
      said(tool.part(YEAR.after, YEAR.rateAfter, 12 - YEAR.amendMonth)),
    ]),
    calc("year-interest", "ריבית בשנה מפוצלת: הסך", `יתרת פתיחה ${fmt(YEAR.opening)} ₪ בריבית ${pct(YEAR.rateBefore)}; ב-31.3 שולמו ${fmt(YEAR.paid)} ₪; ב-30.9 תוקנה התוכנית, היתרה אחרי התיקון ${fmt(YEAR.after)} ₪ והריבית מאז ${pct(YEAR.rateAfter)}. מה סך הוצאות הריבית של השנה (בלי עיגולי ביניים)?`, YEAR_INTEREST, [
      `על הפתיחה, עד 30.9:\n${said(tool.part(YEAR.opening, YEAR.rateBefore, YEAR.amendMonth))}`,
      `על התשלום, מ-31.3 עד 30.9:\n${said(tool.part(YEAR.paid, YEAR.rateBefore, YEAR.amendMonth - YEAR.paidMonth))}`,
      `אחרי התיקון, מ-1.10:\n${said(tool.part(YEAR.after, YEAR.rateAfter, 12 - YEAR.amendMonth))}`,
      said(tool.splitYear(YEAR_PARTS.opening, YEAR_PARTS.paid, YEAR_PARTS.after)),
      `מאיפה מגיעות היתרות עצמן? מ${lessonRef("ias19-measure")} ומ${lessonRef("ias19-amend")}; כאן הן נתון.`,
    ]),
    choice(
      "which-unknown",
      "המעגל",
      "במעגל של הפרשה לחופשה ידועות יתרת הפתיחה, יתרת הסגירה וההוצאה של השנה. איזה מספר אפשר למצוא מהם?",
      ["את התשלומים לעובדים", "רק את ההוצאה", "שום דבר, חסרים נתונים", "את יתרת הפתיחה של השנה הבאה בלבד"],
      0,
      `במעגל אפשר למצוא כל שורה אחת שחסרה, אם כל השאר ידועות. כאן חסרים התשלומים:\n${FORMULA.roll}\n${FORMULA.paymentsST}`,
    ),
  ],
  traps,
  tips: [
    "שלושה כלים חוזרים בכל שאלה בקורס: ערך נוכחי, ריבית לחלק משנה ומעגל.",
    `ערך נוכחי: ${TOOL.pv}, ו-YEAR הוא השנים עד התשלום, לא השנים שעברו. באקסל: ${TOOL.pvExcel}, ואת fv כותבים עם מינוס.`,
    `שיעור לחלק משנה, בריבית דריבית: ${TOOL.partRate}. רבעון: YEAR = 3/12; חודש: 1/12; שנתיים: 2. באקסל: ${TOOL.partRateExcel}. וכשהשאלה מבקשת ריבית פשוטה: ${TOOL.simple}.`,
    `כלל המעגל: ${FORMULA.roll}. כל שורה אחת שחסרה יוצאת מכל השאר; בהטבה מוגדרת זו בדרך כלל ה-P.N.`,
  ],
};
