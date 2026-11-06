import { dayCost, fifo, lifo, pv, shortTermExpense } from "@/lib/learn/ias19";
import { solveAbsence } from "@/lib/learn/ias19-absence";
import { ALON } from "@/lib/learn/ias19-absence-cases";
import type { StudyModule, Trap } from "../../types";
import { FORMULA, said, tool, work } from "../formulas";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal, pct } from "../shared";

/** Screen 1: Avi's December salary, paid on 9 January — and what discounting a month of it would change. */
export const AVI = { salary: 12_000, rate: 0.06 };
export const AVI_PV = pv(AVI.salary, AVI.rate, 1 / 12);
/** By expectation: days accrued, and the days experience says will be used. */
export const EXPECTED = { accrued: 300, used: 120 };
/** Screen 2: Ronit's vacation — the days left at the end of the year, and what they cost if they carry forward. */
export const RONIT = { entitlement: 12, used: 9, dayCost: 500 };
export const RONIT_LEFT = RONIT.entitlement - RONIT.used;
/** Screen 3: ten employees with four days each, two expected to leave; under non-vesting the stayers use three days on average. */
export const VESTING = { staff: 10, days: 4, dayCost: 500, leavers: 2, used: 3 };
export const VESTING_STAY = VESTING.staff - VESTING.leavers;
/** Screen 4: a day from a monthly salary, the employer's on-costs on it, the same from a yearly salary, and a bonus that carries national insurance only. */
export const DAYCOST = {
  salary: 10_500,
  days: 21,
  onCosts: [
    { label: "ביטוח לאומי", rate: 0.07 },
    { label: "פנסיה", rate: 0.065 },
    { label: "פיצויים", rate: 0.065 },
  ],
  annual: { salary: 132_000, days: 240 },
  bonus: 10_000,
};
export const DAYCOST_BASE = DAYCOST.salary / DAYCOST.days;
export const DAYCOST_RATE = DAYCOST.onCosts.reduce((s, o) => s + o.rate, 0);
export const DAYCOST_FULL = dayCost(DAYCOST.salary, DAYCOST.days, DAYCOST_RATE);
/** Screens 5–6: Danny, twelve days a year and three carried that lapse at the end of it, in three cases of use. */
export const DANNY = { entitlement: 12, carried: 3, used: [8, 12, 14] };
/** Under FIFO, a fourth case: using fewer days than were carried, so a carried day still lapses. */
export const DANNY_FIFO = [2, ...DANNY.used];
/** The standard's own example (IAS 19.17), folded into the opening step: 100 employees, 5 sick days, LIFO, 2 carried on average; 92 use no more than 5 next year, 8 use 6.5. */
export const EXPECT = { staff: 100, entitlement: 5, carried: 2, dayCost: 500, leavers: 5, groups: [{ staff: 92, use: 5 }, { staff: 8, use: 6.5 }] };
/** Days a group will take out of its carried balance next year, under LIFO. */
export const fromCarried = (use: number) => Math.max(0, use - EXPECT.entitlement);
export const EXPECT_DAYS = EXPECT.groups.reduce((s, g) => s + g.staff * fromCarried(g.use), 0);

/** The bonus screen: a bonus by formula — a share of the year's profit to whoever is still employed on payment day; five expected to leave. Paid on the final profit to those who stayed. */
export const NOF = { staff: 50, share: 0.00002, estimate: 90_000_000, leavers: 5, actual: 100_000_000, paidTo: 47 };
export const NOF_OPENING = Math.round(NOF.share * NOF.estimate * (NOF.staff - NOF.leavers));
export const NOF_PAID = Math.round(NOF.share * NOF.actual * NOF.paidTo);
export const NOF_EXPENSE = shortTermExpense(NOF_OPENING, NOF_PAID, 0);

/** The walkthrough's expense in the first assumption, for the journal exercise. */
const ALON_A = solveAbsence(ALON, "A");

/** The exercises, in the order of the screens. */
const DAY_Q = { salary: 12_600, days: 21, onCosts: 0.22 };
const BONUS_Q = { amount: 20_000, insurance: 0.07 };
const LIFO_Q = { entitlement: 14, carried: 4, used: 16 };
const FIFO_Q = { entitlement: 14, carried: 4, used: 9 };
const EXPECT_Q = { staff: 60, entitlement: 6, carried: 3, dayCost: 450, groups: [{ staff: 50, use: 6 }, { staff: 10, use: 8 }] };
const VEST_Q = { staff: 30, carried: 5, leavers: 4, use: 3, dayCost: 400 };
const PAID_Q = { leavers: 2, carried: 3, staff: 20, used: 8, dayCost: 500 };
const ROLL_Q = { opening: 18_000, payments: 95_000, closing: 21_500 };
const FORMULA_Q = { staff: 40, share: 0.00003, profit: 60_000_000, leavers: 4 };

const lifoQ = lifo(LIFO_Q);
const fifoQ = fifo(FIFO_Q);
const expectQDays = EXPECT_Q.groups.reduce((s, g) => s + g.staff * Math.min(EXPECT_Q.carried, Math.max(0, g.use - EXPECT_Q.entitlement)), 0);
const vestStay = VEST_Q.staff - VEST_Q.leavers;

/** A roll-forward written as on a worksheet, one line each: the provision is a credit and prints in brackets, a payment prints as it is. */
const rollLines = (title: string, rows: [label: string, credit: number, mark?: string][]) =>
  `${title}:\n${rows.map(([label, v, mark]) => `${label}: ${v > 0 ? `(${fmt(Math.round(v))})` : fmt(Math.round(-v))}${mark ? `  ← ${mark}` : ""}`).join("\n")}`;

const traps: Trap[] = [
  {
    id: "all-accrued",
    prompt: "לעובדים 300 ימי מחלה צבורים (לא מבשילים), אבל לפי הניסיון ינוצלו רק 120 מהם. על כמה ימים ההפרשה?",
    options: ["120 ימים", "300 ימים", "0, מחלה לא נצברת", "180 ימים"],
    answer: 0,
    why: "מפרישים על מה שהחברה צופה לשלם (סעיף 16). ימים שלא ינוצלו יפקעו, ובלא מבשילה גם לא ישולמו בעזיבה.",
    traps: ["", "המלכודת: להפריש על כל הצבור. ימים שיפקעו לא יעלו לחברה כלום.", "כאן הימים כן עוברים לשנה הבאה, ולכן הם נצברים.", "זה החלק שלא ינוצל, בדיוק מה שלא מפרישים עליו."],
  },
  {
    id: "vest-stayers",
    prompt: "ימי חופשה מבשילים. 20 עובדים שלא צפויים לעזוב צפויים לנצל בשנה הבאה רק את הזכאות החדשה, לפי LIFO. על כמה מהימים הצבורים שלהם מפרישים?",
    options: ["על אף אחד", "על כולם, כי הימים מבשילים", "על חצי", "רק על ימי השנה הבאה"],
    answer: 0,
    why: "גם במבשילה, הנשארים נכנסים להפרשה רק לפי הניצול הצפוי. הם לא יגיעו לצבור ולא יעזבו, ולכן הצבור שלהם יפקע בלי לעלות כסף. רק העוזבים הצפויים נכנסים על כל הימים.",
    traps: ["", "המלכודת: לחשוב שמבשילה פירושה הפרשה על הכל. ההבשלה משנה רק את העוזבים.", "אין בסיס לחצי.", "ימי השנה הבאה עוד לא נצברו, ועליהם לא מפרישים השנה."],
  },
  {
    id: "non-vesting-leaver",
    prompt: "עובד עוזב עם 3 ימי מחלה צבורים, והימים לא מבשילים. מה הוא מקבל?",
    options: ["כלום, ואין בגינו הפרשה", "פדיון של 3 ימים", "פדיון של חצי מהימים", "תלוי בשכרו"],
    answer: 0,
    why: "לא מבשילה: אין תשלום בעזיבה. לכן גם לא מפרישים על ימי עוזבים.",
    traps: ["", "המלכודת: לשלם פדיון. כך עובדים רק במבשילה.", "אין פדיון חלקי בלא מבשילה.", "השכר משנה את עלות היום, לא את הזכאות."],
  },
  {
    id: "fifo-default",
    prompt: "בשאלה כתוב שימי חופשה עוברים לשנה אחת, ולא כתוב באיזה סדר מנצלים אותם. איך עובדים?",
    options: ["LIFO: קודם ימי השנה", "FIFO: קודם הצבורים", "לפי מה שנוח", "חצי מכל סוג"],
    answer: 0,
    why: "כשהשאלה לא אומרת אחרת, עובדים ב-LIFO. FIFO רק כשכתוב במפורש.",
    traps: ["", "המלכודת: FIFO נשמע טבעי, אבל בשאלות הוא רק כשכתוב במפורש.", "השיטה קובעת אילו ימים פוקעים, ולכן היא משנה את התשובה.", "אין שיטה כזו."],
  },
  {
    id: "discount-short",
    prompt: "הפרשה לבונוס של 200,000 ₪ שישולם בעוד ארבעה חודשים. כמה רושמים?",
    options: ["200,000 ₪", "הערך הנוכחי של 200,000 ₪", "200,000 ₪ פחות ריבית לארבעה חודשים", "0 עד התשלום"],
    answer: 0,
    why: "הטבה לזמן קצר נמדדת בסכום לא מהוון (סעיף 11).",
    traps: ["", "המלכודת: להוון. בזמן קצר לא מהוונים, כי ההשפעה זניחה.", "זה אותו היוון במילים אחרות.", "המחויבות קיימת כבר בתאריך הדוח."],
  },
  {
    id: "bonus-oncosts",
    prompt: `בונוס של ${fmt(BONUS_Q.amount)} ₪, ועליו חל רק ביטוח לאומי של ${pct(BONUS_Q.insurance)}. תוספות השכר הרגילות בחברה 22%. מה עלות הבונוס?`,
    options: [`${fmt(BONUS_Q.amount * (1 + BONUS_Q.insurance))} ₪`, `${fmt(BONUS_Q.amount * 1.22)} ₪`, `${fmt(BONUS_Q.amount)} ₪`, `${fmt(BONUS_Q.amount * 1.07 * 1.22)} ₪`],
    answer: 0,
    why: `מוסיפים רק את מה שחל על הבונוס בפועל.\n${said(work.bonusCost(BONUS_Q.amount, BONUS_Q.insurance))}`,
    traps: ["", "המלכודת: להוסיף את כל תוספות השכר. הן לא חלות על הבונוס.", "גם הביטוח הלאומי הוא עלות של המעסיק.", "כפל תוספות, ואין לזה בסיס."],
  },
];

/** Lesson 3: short-term benefits — what they are, absences (accumulating or not, vesting or not), the cost of a day, LIFO and FIFO; then how to solve an absence question in six steps, on one company in both assumptions, the traps, bonuses, and four summary exams. */
export const SHORT: StudyModule = {
  slug: "ias19-short",
  course: COURSE,
  n: 3,
  title: "הטבות לזמן קצר: היעדרויות ובונוסים",
  description: "מה נחשב הטבה לזמן קצר, ולמה לא מהוונים. היעדרויות נצברות ומבשילות, עלות יום עם התוספות, LIFO ו-FIFO. אחר כך: איך פותרים שאלה על ימי מחלה בששה שלבים, על תרגיל אחד בשתי ההנחות, המלכודות ותבנית פתרון, בונוסים, וארבעה מבחנים מסכמים.",
  goal: "לפתור שאלה מלאה על היעדרויות בששה שלבים: סיווג, מה נכנס, פתיחה לפי הצפי, תשלומים לפי מה שקרה, סגירה אחרי ניצול ופקיעה, והוצאה מטבלת התנועה.",
  outcomes: [
    "לזהות הטבה לזמן קצר ולהסביר למה לא מהוונים אותה",
    "להבחין בין היעדרות נצברת ללא נצברת, ובין מבשילה ללא מבשילה",
    "לחשב עלות יום עם התוספות שחלות על הרכיב",
    "לעקוב אחרי ימים ב-LIFO וב-FIFO, ולמדוד הפרשה לפי הניצול הצפוי והעוזבים הצפויים",
    "לחשב את ההוצאה של השנה מהמעגל ולרשום אותה",
    "להכיר בבונוס כשיש מחויבות ואומדן מהימן",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-short-hook", title: "מה זו הטבה לזמן קצר" },
    { id: "emp-short-absence", title: "היעדרויות בתשלום: נצברת או לא נצברת" },
    { id: "emp-short-vest", title: "מבשילה או לא מבשילה" },
    { id: "emp-short-daycost", title: "עלות יום, ומה הן התוספות" },
    { id: "emp-short-lifo", title: "LIFO: קודם הימים של השנה" },
    { id: "emp-short-fifo", title: "FIFO: קודם הימים הצבורים" },
    { id: "emp-short-map", title: "איך פותרים: ששה שלבים" },
    { id: "emp-short-classify", title: "שלבים 1–2: סיווג, ומה נכנס להפרשה" },
    { id: "emp-short-opening", title: "שלב 3: יתרת פתיחה, לפי הצפי" },
    { id: "emp-short-payments", title: "שלב 4: תשלומים, לפי מה שקרה" },
    { id: "emp-short-closing", title: "שלב 5: יתרת סגירה, אחרי ניצול ופקיעה" },
    { id: "emp-short-movement", title: "שלב 6: טבלת התנועה" },
    { id: "emp-short-traps", title: "מלכודות, ותבנית פתרון" },
    { id: "emp-short-bonus", title: "בונוסים ושיתוף ברווחים" },
    { id: "emp-short-exam-cap", title: "מבחן מסכם 1: קבוצה שעוברת את היתרה" },
    { id: "emp-short-exam-leavers", title: "מבחן מסכם 2: עוזבים בתחילת השנה ובסופה" },
    { id: "emp-short-exam-lapse", title: "מבחן מסכם 3: יתרה ישנה שפוקעת" },
    { id: "emp-short-exam-average", title: "מבחן מסכם 4: ממוצע, וסגירה לפי צפי" },
  ],
  exercises: [
    choice(
      "classify",
      "סיווג",
      "ימי מחלה עוברים לשנה הבאה אם לא נוצלו, אבל עובד שעוזב לא מקבל עליהם כסף. איך הם מסווגים?",
      ["נצברים ולא מבשילים", "נצברים ומבשילים", "לא נצברים", "לא נצברים ומבשילים"],
      0,
      "עוברים לשנה הבאה, ולכן נצברים. לא משולמים בעזיבה, ולכן לא מבשילים.",
    ),
    choice(
      "maternity",
      "לא נצברת",
      "שתי עובדות ייצאו בשנה הבאה לחופשת לידה, והחברה תשלים להן שכר. כמה הפרשה רושמים השנה?",
      ["אפס. היא לא נצברת, ונרשמת כשהיא קורית", "את מלוא השלמת השכר", "חצי מההשלמה", "הערך הנוכחי של ההשלמה"],
      0,
      "היעדרות שלא נצברת נרשמת רק כשהיא קורית (סעיף 13).",
    ),
    calc("day-cost", "עלות יום", `שכר חודשי ${fmt(DAY_Q.salary)} ₪, ${DAY_Q.days} ימי עבודה בחודש, ותוספות המעסיק ${pct(DAY_Q.onCosts)}. מהי עלות יום?`, dayCost(DAY_Q.salary, DAY_Q.days, DAY_Q.onCosts), [
      said(work.dayCost(DAY_Q.salary, DAY_Q.days, DAY_Q.onCosts)),
    ]),
    calc("bonus-cost", "תוספות על בונוס", `בונוס של ${fmt(BONUS_Q.amount)} ₪, ועליו חל רק ביטוח לאומי של ${pct(BONUS_Q.insurance)}. מה עלות הבונוס לחברה?`, BONUS_Q.amount * (1 + BONUS_Q.insurance), [
      `מוסיפים רק את מה שחל על הבונוס:\n${said(work.bonusCost(BONUS_Q.amount, BONUS_Q.insurance))}`,
    ]),
    calc("lifo-lapsed", "LIFO", `לעובד ${LIFO_Q.entitlement} ימים בשנה ו-${LIFO_Q.carried} ימים צבורים שפוקעים בסוף השנה. הוא ניצל ${LIFO_Q.used} ימים. לפי LIFO, כמה ימים צבורים פקעו?`, lifoQ.carriedLeft, [
      `קודם ${LIFO_Q.entitlement} ימי השנה, ורק אחריהם הצבור:\n${said(work.lifoOld(LIFO_Q.used, LIFO_Q.entitlement))}`,
      `מתוך ${LIFO_Q.carried} הצבורים נוצלו ${lifoQ.fromCarried}, ולכן ${LIFO_Q.carried} − ${lifoQ.fromCarried} = ${lifoQ.carriedLeft} פקעו.`,
    ]),
    calc("fifo-left", "FIFO", `לעובד ${FIFO_Q.entitlement} ימים בשנה ו-${FIFO_Q.carried} ימים צבורים שפוקעים בסוף השנה. הוא ניצל ${FIFO_Q.used} ימים, והניצול לפי FIFO. כמה ימים עוברים לשנה הבאה?`, fifoQ.unusedOwn, [
      `קודם ${FIFO_Q.carried} הצבורים, ואז מימי השנה:\n${said(work.fifoOwn(FIFO_Q.used, FIFO_Q.carried))}`,
      said(work.fifoLeft(FIFO_Q.entitlement, FIFO_Q.used - fifoQ.fromCarried)),
    ]),
    calc(
      "expect-lifo",
      "הפרשה לפי הצפי",
      `${EXPECT_Q.staff} עובדים, ${EXPECT_Q.entitlement} ימי מחלה בשנה, LIFO, ולכל אחד ${EXPECT_Q.carried} ימים צבורים (לא מבשילים). החברה צופה ש-${EXPECT_Q.groups[0].staff} עובדים ינצלו בשנה הבאה עד ${EXPECT_Q.groups[0].use} ימים, ו-${EXPECT_Q.groups[1].staff} ינצלו ${EXPECT_Q.groups[1].use} ימים. עלות יום ${fmt(EXPECT_Q.dayCost)} ₪. מה ההפרשה?`,
      expectQDays * EXPECT_Q.dayCost,
      [
        `ב-LIFO, בשנה הבאה כל עובד ינצל קודם את ${EXPECT_Q.entitlement} הימים החדשים. רק מי שינצל יותר יגיע לצבור: ${EXPECT_Q.groups[1].use} − ${EXPECT_Q.entitlement} = ${EXPECT_Q.groups[1].use - EXPECT_Q.entitlement} ימים לעובד.`,
        said(work.days(EXPECT_Q.groups.map((g) => ({ staff: g.staff, days: Math.max(0, g.use - EXPECT_Q.entitlement), dayCost: EXPECT_Q.dayCost })))),
      ],
    ),
    calc(
      "expect-vest",
      "מבשילה, עם עוזבים",
      `${VEST_Q.staff} עובדים, לכל אחד ${VEST_Q.carried} ימי חופשה צבורים. הימים מבשילים. ${VEST_Q.leavers} עובדים צפויים לעזוב, וכל הנשארים צפויים לנצל ${VEST_Q.use} מתוך ${VEST_Q.carried} הימים (השאר יפקעו). עלות יום ${fmt(VEST_Q.dayCost)} ₪. מה ההפרשה?`,
      (VEST_Q.leavers * VEST_Q.carried + vestStay * VEST_Q.use) * VEST_Q.dayCost,
      [
        `העוזבים יקבלו כסף על כל הימים. הנשארים נכנסים רק לפי הניצול הצפוי:\n${said(work.days([{ staff: VEST_Q.leavers, days: VEST_Q.carried, dayCost: VEST_Q.dayCost }, { staff: vestStay, days: VEST_Q.use, dayCost: VEST_Q.dayCost }]))}`,
      ],
    ),
    calc(
      "expect-nonvest",
      "לא מבשילה, עם עוזבים",
      `${VEST_Q.staff} עובדים, לכל אחד ${VEST_Q.carried} ימי מחלה צבורים. הימים לא מבשילים. ${VEST_Q.leavers} עובדים צפויים לעזוב, וכל הנשארים צפויים לנצל ${VEST_Q.use} מתוך ${VEST_Q.carried} הימים. עלות יום ${fmt(VEST_Q.dayCost)} ₪. מה ההפרשה?`,
      vestStay * VEST_Q.use * VEST_Q.dayCost,
      [
        `העוזבים לא יקבלו כלום, ולכן רק הנשארים, לפי הניצול הצפוי:\n${said(work.days([{ staff: vestStay, days: VEST_Q.use, dayCost: VEST_Q.dayCost }]))}`,
      ],
    ),
    calc(
      "paid-vest",
      "תשלומים עם פדיון",
      `ימי חופשה מבשילים. השנה ${PAID_Q.leavers} עובדים עזבו וקיבלו פדיון על ${PAID_Q.carried} ימים צבורים כל אחד, ו-${PAID_Q.staff} עובדים ניצלו ${PAID_Q.used} ימים כל אחד. עלות יום ${fmt(PAID_Q.dayCost)} ₪. כמה שולם?`,
      (PAID_Q.leavers * PAID_Q.carried + PAID_Q.staff * PAID_Q.used) * PAID_Q.dayCost,
      [
        `תשלומים לפי מה שקרה בפועל, כולל הפדיון לעוזבים:\n${said(work.days([{ staff: PAID_Q.leavers, days: PAID_Q.carried, dayCost: PAID_Q.dayCost }, { staff: PAID_Q.staff, days: PAID_Q.used, dayCost: PAID_Q.dayCost }]))}`,
      ],
    ),
    calc("roll-expense", "הוצאה מהמעגל", `הפרשה לחופשה: יתרת פתיחה ${fmt(ROLL_Q.opening)} ₪, שולמו ${fmt(ROLL_Q.payments)} ₪, יתרת סגירה ${fmt(ROLL_Q.closing)} ₪. מה הוצאות החופשה של השנה?`, shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing), [
      rollLines("הפרשה לחופשה", [
        ["יתרת פתיחה", ROLL_Q.opening],
        ["הוצאות שכר", shortTermExpense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing), "השורה החסרה"],
        ["תשלומים", -ROLL_Q.payments],
        ["יתרת סגירה", ROLL_Q.closing],
      ]),
      said(tool.expense(ROLL_Q.opening, ROLL_Q.payments, ROLL_Q.closing)),
    ]),
    calc(
      "bonus-formula",
      "בונוס לפי נוסחה",
      `${FORMULA_Q.staff} עובדים. כל מי שיעבוד ביום התשלום יקבל ${pct(FORMULA_Q.share)} מהרווח השנתי. הרווח המוערך ${fmt(FORMULA_Q.profit)} ₪, ו-${FORMULA_Q.leavers} עובדים צפויים לעזוב לפני התשלום. מה ההפרשה לבונוס?`,
      FORMULA_Q.share * FORMULA_Q.profit * (FORMULA_Q.staff - FORMULA_Q.leavers),
      [said(work.stayers(FORMULA_Q.staff, FORMULA_Q.leavers)), said(work.bonus(FORMULA_Q.share, FORMULA_Q.profit, FORMULA_Q.staff - FORMULA_Q.leavers))],
    ),
    choice(
      "bonus-no-obligation",
      "מתי מכירים בבונוס",
      "ההנהלה החליטה אחרי אישור הדוחות לתת בונוס על השנה שעברה, ועד היום לא היה נוהג כזה. מכירים בו בדוחות של השנה שעברה?",
      ["לא. בסוף השנה לא הייתה מחויבות", "כן, כי הוא על השנה שעברה", "כן, בחצי מהסכום", "כן, בערך הנוכחי"],
      0,
      "בסוף השנה לא היה הסכם ולא נוהג, ולכן לא הייתה מחויבות (סעיף 19).",
    ),
    journal(
      "provision-entry",
      "רישום ההפרשה",
      `אצל ״אלון״, בהנחה א׳, ההוצאה של השנה על ימי מחלה היא ${fmt(ALON_A.expense)} ₪: הנעלם בטבלת התנועה. רשמו אותה ב-31.12.`,
      [
        { account: "הוצאות שכר", dr: ALON_A.expense },
        { account: "התחייבות לימי מחלה", cr: ALON_A.expense },
      ],
      "ההוצאה נרשמת בשנה שבה עבדו, וההתחייבות לימי מחלה (ההפרשה) גדלה. כשמשלמים, היא קטנה מול המזומן.",
      ["הוצאות שכר", "התחייבות לימי מחלה", "מזומן", "הוצאות מימון"],
    ),
  ],
  traps,
  tips: [
    "סווגו קודם: לא נצברת נרשמת רק כשהיא קורית. נצברת: מבשילה או לא?",
    "LIFO, אלא אם השאלה אומרת FIFO במפורש. וצבור עובר לשנה אחת ואז פוקע.",
    `${FORMULA.dayCost}. רק התוספות שחלות על הרכיב, ולפי השכר של השנה. יש על זה פרשנויות שונות, ואם השאלה אומרת אחרת, עובדים לפיה.`,
    "ההפרשה לפי מה שהחברה צופה לשלם: הנשארים לפי הניצול הצפוי, ובמבשילה גם העוזבים על כל הימים.",
    "התשלומים לפי מה שקרה בפועל, ובמבשילה גם הפדיון לעוזבים.",
    `ההוצאה היא השורה החסרה במעגל: ${FORMULA.expense}. ובלי היוון.`,
  ],
};
