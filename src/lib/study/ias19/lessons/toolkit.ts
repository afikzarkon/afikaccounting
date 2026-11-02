import { partInterest, partRate, pv, rollForward, shortTermExpense, simplePart } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, lessonRef, pct } from "../shared";

/** The hook: an amount today or in a few years. */
export const HOOK = { amount: 8_000, years: 4, rate: 0.06 };

/** The worked examples: one of each tool. */
export const SOLVED = {
  pv: { fv: 15_600, years: 6, rate: 0.07 },
  part: [
    { balance: 18_000, rate: 0.05, months: 8 },
    { balance: 26_400, rate: 0.09, months: 4 },
  ],
  roll: { opening: 6_200, payments: 158_000, closing: 7_100 },
};
export const SOLVED_PV = pv(SOLVED.pv.fv, SOLVED.pv.rate, SOLVED.pv.years);
export const SOLVED_PART = SOLVED.part.map((p) => partInterest(p.balance, p.rate, p.months));
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
    prompt: "עובד עבד כבר 6 שנים, ויקבל מענק בעוד 9 שנים. ב-n של ההיוון — כמה שנים?",
    options: ["9", "6", "15", "3"],
    answer: 0,
    why: "n הוא מספר השנים מהיום ועד התשלום — לא השנים שכבר עברו.",
    traps: ["", "המלכודת: לספור את השנים שעברו. ההיוון מחזיר מהעתיד להיום, ולכן סופרים קדימה.", "זה כל הוותק בסוף — לא המרחק מהיום לתשלום.", "אין סיבה לחסר: 9 הוא בדיוק המרחק."],
  },
  {
    id: "excel-minus",
    prompt: "באקסל, PV(5%;4;0;10000) מחזיר −8,227. מה זה אומר?",
    options: ["אין טעות — זו מוסכמת הסימנים; הערך הוא 8,227", "הנוסחה שגויה", "ההתחייבות שלילית ולכן היא רווח", "צריך להוסיף 10,000"],
    answer: 0,
    why: "אקסל מציג כסף שיוצא במינוס. מהפכים סימן, והערך הנוכחי הוא 8,227.",
    traps: ["", "המלכודת: לחשוב שמינוס הוא שגיאה. זו רק מוסכמת הכיוון של אקסל.", "הסימן הוא כיוון התזרים, לא רווח או הפסד.", "הערך הנוכחי כבר מחושב; אין מה להוסיף."],
  },
  {
    id: "simple-part",
    prompt: `ריבית שנתית ${pct(QUARTER.rate)}. מהי הריבית לרבעון, לפי התקן?`,
    options: [`(1.08)^(3/12) − 1 ≈ ${pct(partRate(QUARTER.rate, 3))}`, `8% × 3/12 = ${pct(simplePart(QUARTER.rate, 3))}`, "8%", "8% ÷ 3"],
    answer: 0,
    why: "ריבית על חלק משנה היא ריבית דריבית (IAS 19.123): (1+i)^(m/12) − 1.",
    traps: ["", "המלכודת: ריבית פשוטה. ההפרש קטן — אבל השיטה שגויה, ובסכומים גדולים זה מורגש.", "זו ריבית של שנה שלמה, לא של רבעון.", "אין כאן חלוקה בשלוש: רבעון הוא 3 מתוך 12 חודשים."],
  },
  {
    id: "payment-sign",
    prompt: "במעגל התחייבות, החברה שילמה לעובדים 30,000 ₪ במהלך השנה. מה התשלום עושה ליתרה?",
    options: ["מקטין אותה ב-30,000", "מגדיל אותה ב-30,000", "לא משפיע — הוא הוצאה", "מקטין אותה רק בסוף השנה הבאה"],
    answer: 0,
    why: "תשלום מסלק חלק מהחוב, ולכן יתרת ההתחייבות קטנה.",
    traps: ["", "המלכודת: לחבר את התשלום כמו הוצאה. הוא יוצא מההתחייבות, לא נכנס אליה.", "ההוצאה היא מה שנוסף להתחייבות; התשלום הוא מה שיוצא ממנה.", "ההשפעה מיידית, ביום התשלום."],
  },
];

/** Lesson 2: the toolkit — present value, interest for part of a year, and a roll-forward whose missing line is found. */
export const TOOLKIT: StudyModule = {
  slug: "ias19-toolkit",
  course: COURSE,
  n: 2,
  title: "ארגז כלים: ערך נוכחי, שברי שנה ומעגל התחייבות",
  description: "שלוש פעולות שחוזרות בכל שאלה של הטבה מוגדרת: להחזיר סכום מהעתיד להיום, לחשב ריבית על חלק משנה, ולסגור מעגל שחסר בו מספר אחד — עם מוסכמת הסימנים.",
  goal: "להוון סכום עתידי, לחשב ריבית על חלק משנה, ולסגור מעגל שחסר בו מספר אחד.",
  outcomes: ["לחשב ערך נוכחי של סכום שישולם בעוד n שנים", "לחשב ריבית על חלק משנה בריבית דריבית", "לחשב ריבית שנתית כשיש תשלום ושינוי ריבית באמצע השנה", "למצוא את המספר החסר במעגל — ובמיוחד את ה-P.N."],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-tool-hook", title: "היום או בעוד ארבע שנים?" },
    { id: "emp-tool-pv", title: "ערך נוכחי: מהעתיד להיום" },
    { id: "emp-tool-part", title: "ריבית על חלק משנה" },
    { id: "emp-tool-roll", title: "המעגל, וה-P.N. שמאזן אותו" },
    { id: "emp-tool-solved", title: "דוגמה פתורה: שלושה כלים" },
    { id: "emp-tool-together", title: "פותרים יחד, עם סולם רמזים" },
    { id: "emp-tool-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("tool-pv", "ערך נוכחי", `מענק של ${fmt(PV_Q.fv)} ₪ ישולם בעוד ${PV_Q.years} שנים. שיעור ההיוון ${pct(PV_Q.rate)}. מה ערכו היום?`, pv(PV_Q.fv, PV_Q.rate, PV_Q.years), [
      `PV = FV ÷ (1+i)^n = ${fmt(PV_Q.fv)} ÷ ${1 + PV_Q.rate}^${PV_Q.years}.`,
      `= ${fmt(Math.round(pv(PV_Q.fv, PV_Q.rate, PV_Q.years)))} ₪.`,
    ]),
    calc("tool-part", "ריבית לחלק משנה", `יתרה של ${fmt(PART_Q.balance)} ₪, שיעור שנתי ${pct(PART_Q.rate)}. מה הריבית ל-${PART_Q.months} חודשים, לפי התקן?`, partInterest(PART_Q.balance, PART_Q.rate, PART_Q.months), [
      `${fmt(PART_Q.balance)} × ((${1 + PART_Q.rate})^(${PART_Q.months}/12) − 1).`,
      `= ${fmt(Math.round(partInterest(PART_Q.balance, PART_Q.rate, PART_Q.months)))} ₪ — ולא ${fmt(PART_Q.balance * simplePart(PART_Q.rate, PART_Q.months))} של ריבית פשוטה.`,
    ]),
    calc("tool-quarter", "ריבית לרבעון", `יתרה של ${fmt(QUARTER.balance)} ₪, שיעור שנתי ${pct(QUARTER.rate)}. מה הריבית לרבעון? (בלי עיגולי ביניים)`, partInterest(QUARTER.balance, QUARTER.rate, QUARTER.months), [
      `שיעור לרבעון: ${QUARTER.rate + 1}^(3/12) − 1 = ${pct(partRate(QUARTER.rate, 3))}.`,
      `${fmt(QUARTER.balance)} × השיעור = ${fmt(Math.round(partInterest(QUARTER.balance, QUARTER.rate, QUARTER.months)))} ₪ — ולא ${fmt(QUARTER.balance * simplePart(QUARTER.rate, 3))}.`,
    ]),
    calc("tool-expense", "המעגל: הוצאה", `הפרשה לחופשה: יתרת פתיחה ${fmt(ROLL_Q.opening)} ₪, שולמו ${fmt(ROLL_Q.payments)} ₪, יתרת סגירה ${fmt(ROLL_Q.closing)} ₪. מה ההוצאה של השנה?`, shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing), [
      "פתיחה + הוצאה − תשלומים = סגירה, ולכן הוצאה = סגירה − פתיחה + תשלומים.",
      `${fmt(ROLL_Q.closing)} − ${fmt(ROLL_Q.opening)} + ${fmt(ROLL_Q.payments)} = ${fmt(shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing))} ₪.`,
    ]),
    calc("tool-pn", "המעגל: P.N.", `פתיחה ${fmt(PN_Q.opening)}, ריבית ${fmt(PN_Q.interest)}, תשלום ${fmt(PN_Q.payments)}, סגירה ${fmt(PN_Q.closing)}. מה ה-P.N. (הפסד, בסכום חיובי)?`, rollForward(PN_Q, "pn").pn, [
      "P.N. = סגירה − פתיחה − ריבית + תשלומים.",
      `${fmt(PN_Q.closing)} − ${fmt(PN_Q.opening)} − ${fmt(PN_Q.interest)} + ${fmt(PN_Q.payments)} = ${fmt(rollForward(PN_Q, "pn").pn)}: ההתחייבות גדלה מעבר למה שהוסבר — הפסד.`,
    ]),
    calc("year-on-opening", "ריבית בשנה מפוצלת: על הפתיחה", `יתרת פתיחה ${fmt(YEAR.opening)} ₪, ריבית ${pct(YEAR.rateBefore)} עד 30.9. מה הריבית על הפתיחה עד 30.9 (תשעה חודשים)?`, YEAR_PARTS.opening, [
      `${fmt(YEAR.opening)} × ((${1 + YEAR.rateBefore})^(9/12) − 1) = ${fmt(Math.round(YEAR_PARTS.opening))} ₪.`,
    ]),
    calc("year-on-payment", "ריבית בשנה מפוצלת: על התשלום", `ב-31.3 שולמו לעובדים ${fmt(YEAR.paid)} ₪. בכמה התשלום מקטין את הריבית עד 30.9 (שישה חודשים, ${pct(YEAR.rateBefore)})?`, YEAR_PARTS.paid, [
      "מיום התשלום החוב קטן, ולכן אין עליו ריבית עד סוף התקופה.",
      `${fmt(YEAR.paid)} × ((${1 + YEAR.rateBefore})^(6/12) − 1) = ${fmt(Math.round(YEAR_PARTS.paid))} ₪.`,
    ]),
    calc("year-after", "ריבית בשנה מפוצלת: הרבעון האחרון", `אחרי תיקון התוכנית ב-30.9 היתרה ${fmt(YEAR.after)} ₪, והריבית ${pct(YEAR.rateAfter)}. מה הריבית ל-1.10–31.12?`, YEAR_PARTS.after, [
      `${fmt(YEAR.after)} × ((${1 + YEAR.rateAfter})^(3/12) − 1) = ${fmt(Math.round(YEAR_PARTS.after))} ₪.`,
    ]),
    calc("year-interest", "ריבית בשנה מפוצלת: הסך", `יתרת פתיחה ${fmt(YEAR.opening)} ₪ בריבית ${pct(YEAR.rateBefore)}; ב-31.3 שולמו ${fmt(YEAR.paid)} ₪; ב-30.9 תוקנה התוכנית, היתרה אחרי התיקון ${fmt(YEAR.after)} ₪ והריבית מאז ${pct(YEAR.rateAfter)}. מה סך הוצאות הריבית של השנה (בלי עיגולי ביניים)?`, YEAR_INTEREST, [
      `על הפתיחה ${fmt(Math.round(YEAR_PARTS.opening))}, פחות על התשלום ${fmt(Math.round(YEAR_PARTS.paid))}, ועוד הרבעון האחרון ${fmt(Math.round(YEAR_PARTS.after))}.`,
      `= ${fmt(Math.round(YEAR_INTEREST))} ₪. מאיפה מגיעות היתרות עצמן? מ${lessonRef("ias19-measure")} ומ${lessonRef("ias19-amend")}; כאן הן נתון.`,
    ]),
    choice("why-pn", "המעגל", "בהפרשה לחופשה, למה ההוצאה של השנה היא בדיוק המספר שמאזן את המעגל?", ["כי היא המספר היחיד שאינו ידוע — כל השאר נתונים", "כי היא תמיד שווה לתשלומים", "כי הסגירה שווה לפתיחה", "כי לא מהוונים"], 0, "פתיחה, תשלומים וסגירה ידועים; מה שחסר כדי שיתאזנו הוא ההוצאה."),
  ],
  traps,
  tips: [
    "ארגז הכלים: ערך נוכחי, ריבית לחלק משנה ומעגל — שלוש פעולות שחוזרות בכל שאלה של הטבה מוגדרת.",
    "כלל המעגל: פתיחה + הוצאות ושינויים − תשלומים + P.N. = סגירה; כל רכיב אפשר לגלות אם כל השאר ידועים. כלל הריבית (סעיף 123): יתרה × ((1+i)^(m/12) − 1), ותשלום באמצע השנה מקטין את הריבית על התקופה שנשארה.",
    "PV = FV ÷ (1+i)^n, ו-n הוא השנים עד התשלום — לא השנים שעברו.",
    "מוסכמת סימנים: התחייבות במינוס ותשלום בפלוס; PV באקסל מחזיר מינוס — מהפכים סימן.",
  ],
};
