import { absenceProvision, dayCost, lifo, shortTermExpense } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal, pct } from "../shared";

/** The worked example: sick days that carry forward a year, and do not vest. Used under LIFO. */
export const SICK = {
  dayCost: 600,
  entitlement: 6,
  /** Carried in from last year: who, how many days each, and how many of them are expected to leave. */
  carried: { staff: 18, days: 2, leavers: 8 },
  /** Used this year: two groups. */
  usedMore: { staff: 40, days: 7 },
  usedLess: { staff: 15, days: 5 },
};
const stayers = SICK.carried.staff - SICK.carried.leavers;
export const SICK_OPENING = absenceProvision({ daysUsed: stayers * SICK.carried.days, vesting: false, dayCost: SICK.dayCost });
export const SICK_PAID = SICK.dayCost * (SICK.usedMore.staff * SICK.usedMore.days + SICK.usedLess.staff * SICK.usedLess.days);
export const SICK_LEFT = lifo({ carried: 0, entitlement: SICK.entitlement, used: SICK.usedLess.days }).unusedOwn;
export const SICK_CLOSING = absenceProvision({ daysUsed: SICK.usedLess.staff * SICK_LEFT, vesting: false, dayCost: SICK.dayCost });
export const SICK_EXPENSE = shortTermExpense(SICK_OPENING, SICK_PAID, SICK_CLOSING);

/** "We solve" (a): the same days, but vesting — leavers are paid for what they carried; six of the eight left. */
export const VEST = { left: 6 };
export const VEST_OPENING = absenceProvision({ daysUsed: stayers * SICK.carried.days, daysOfLeavers: SICK.carried.leavers * SICK.carried.days, vesting: true, dayCost: SICK.dayCost });
export const VEST_PAID = SICK_PAID + VEST.left * SICK.carried.days * SICK.dayCost;
export const VEST_EXPENSE = shortTermExpense(VEST_OPENING, VEST_PAID, SICK_CLOSING);

/** "We solve" (b): a bonus by formula — a share of the year's profit per employee who stays to be paid. */
export const BONUS = { share: 0.000015, estimate: 150_000_000, staff: 60, expectedLeavers: 5, actual: 160_000_000, paidTo: 57 };
export const BONUS_OPENING = (BONUS.staff - BONUS.expectedLeavers) * BONUS.share * BONUS.estimate;
export const BONUS_PAID = BONUS.paidTo * BONUS.share * BONUS.actual;
export const BONUS_EXPENSE = shortTermExpense(BONUS_OPENING, BONUS_PAID, 0);

/** The exercise: a company of three grades — recreation days that vest, vacation under LIFO, a managers' bonus and maternity leave. */
export const GRADES = [
  { id: "managers", label: "מנהלים", staff: 3, salary: 16_000, onCosts: 0.22 },
  { id: "technicians", label: "טכנאים", staff: 7, salary: 11_000, onCosts: 0.17 },
  { id: "clerks", label: "פקידים", staff: 10, salary: 8_400, onCosts: 0.17 },
] as const;
export const WORKING_DAYS = 21;
export const DAY = GRADES.map((g) => dayCost(g.salary, WORKING_DAYS, g.onCosts));
/** Recreation: four days a year, usable to the end of next year, paid out on leaving. Days used this year and carried on, by grade. */
export const RECREATION = { perYear: 4, used: [0, 4, 2] };
export const REC_PAID = GRADES.reduce((s, g, k) => s + g.staff * RECREATION.used[k] * DAY[k], 0);
export const REC_CLOSING = GRADES.reduce((s, g, k) => s + g.staff * (RECREATION.perYear - RECREATION.used[k]) * DAY[k], 0);
export const REC_EXPENSE = shortTermExpense(0, REC_PAID, REC_CLOSING);
/** Vacation, the clerks: twelve days a year, one carried day each from last year (lost if not used this year), ten used — LIFO. */
export const VACATION = { entitlement: 12, carried: 1, used: 10 };
const clerk = GRADES[2];
const vac = lifo({ carried: VACATION.carried, entitlement: VACATION.entitlement, used: VACATION.used });
export const VAC_OPENING = clerk.staff * VACATION.carried * DAY[2];
export const VAC_PAID = clerk.staff * VACATION.used * DAY[2];
export const VAC_CLOSING = clerk.staff * vac.unusedOwn * DAY[2];
export const VAC_EXPENSE = shortTermExpense(VAC_OPENING, VAC_PAID, VAC_CLOSING);
/** The managers' bonus: only national insurance is added to it. */
export const MGR_BONUS = { amount: 36_000, insurance: 0.07 };
export const MGR_BONUS_COST = MGR_BONUS.amount * (1 + MGR_BONUS.insurance);

const traps: Trap[] = [
  {
    id: "all-accrued",
    prompt: "לעובדים 300 ימי מחלה צבורים (לא מבשילים), אבל לפי הניסיון ינוצלו רק 120 מהם. על כמה ימים ההפרשה?",
    options: ["120 ימים", "300 ימים", "0 — מחלה לא נצברת", "180 ימים"],
    answer: 0,
    why: "בהיעדרות שאינה מבשילה מפרישים רק על מה שצפוי להיות מנוצל (סעיף 16).",
    traps: ["", "המלכודת: להפריש על כל הצבירה. ימים שיפקעו לא יעלו לחברה כלום.", "כאן הימים כן עוברים לשנה הבאה — הם נצברים.", "זה מה שלא ינוצל — בדיוק החלק שלא מפרישים עליו."],
  },
  {
    id: "lifo",
    prompt: "לעובד 12 ימי חופשה בשנה ויום אחד צבור מהשנה הקודמת (פוקע בסוף השנה). הוא ניצל השנה 10 ימים. כמה ימים עוברים לשנה הבאה?",
    options: ["2 ימים מהשנה הנוכחית", "3 ימים", "1 יום מהשנה הקודמת ו-2 מהנוכחית", "0"],
    answer: 0,
    why: "LIFO: מנצלים קודם את הזכאות של השנה. 10 ימים יצאו מ-12; נשארו 2, והיום הישן פקע.",
    traps: ["", "המלכודת: לשכוח ש-LIFO מנצל את הישן אחרון — והוא פוקע.", "היום הישן לא נוצל ופקע בסוף השנה.", "נשארו שני ימים מהזכאות של השנה."],
  },
  {
    id: "non-vesting-leaver",
    prompt: "עובד עוזב עם 3 ימי מחלה צבורים, וימי המחלה אינם מבשילים. מה הוא מקבל?",
    options: ["כלום — ואין בגינו הפרשה", "פדיון של 3 ימים", "פדיון של חצי מהימים", "תלוי בשכרו"],
    answer: 0,
    why: "לא מבשילה: אין תשלום בעזיבה. לכן גם לא מפרישים על ימי עוזבים.",
    traps: ["", "המלכודת: לשלם פדיון — כך עובדים רק במבשילה.", "אין פדיון חלקי בלא מבשילה.", "השכר משנה את עלות היום, לא את הזכאות."],
  },
  {
    id: "discount-short",
    prompt: "הפרשה לבונוס של 200,000 ₪ שישולם בעוד ארבעה חודשים. כמה רושמים?",
    options: ["200,000 ₪", "הערך הנוכחי של 200,000 ₪", "200,000 ₪ פחות ריבית לארבעה חודשים", "0 עד התשלום"],
    answer: 0,
    why: "הטבה לזמן קצר נמדדת בסכום לא מהוון (סעיף 11).",
    traps: ["", "המלכודת: להוון. בזמן קצר לא מהוונים — ההשפעה לא מהותית.", "זה אותו היוון במילים אחרות.", "המחויבות קיימת כבר בתאריך הדוח."],
  },
  {
    id: "bonus-oncosts",
    prompt: `בונוס של ${fmt(MGR_BONUS.amount)} ₪ למנהלים; עליו חל רק ביטוח לאומי של ${pct(MGR_BONUS.insurance)} (בלי הפרשות נוספות). מה עלות הבונוס?`,
    options: [`${fmt(MGR_BONUS_COST)} ₪`, `${fmt(MGR_BONUS.amount * 1.22)} ₪`, `${fmt(MGR_BONUS.amount)} ₪`, `${fmt(MGR_BONUS.amount * 1.07 * 1.22)} ₪`],
    answer: 0,
    why: "מוסיפים רק את מה שחל על הבונוס בפועל.",
    traps: ["", "המלכודת: להוסיף את כל התוספות הסוציאליות של השכר — הן לא חלות על בונוס.", "גם הביטוח הלאומי הוא עלות של המעסיק.", "כפל תוספות — אין לזה בסיס."],
  },
];

/** Lesson 3: short-term benefits — absences that carry forward (vesting or not, LIFO) and a bonus by formula, closed by their roll-forward. */
export const SHORT: StudyModule = {
  slug: "ias19-short",
  course: COURSE,
  n: 3,
  title: "הטבות לזמן קצר: היעדרויות ובונוסים",
  description: "הענף היחיד שבו לא מהוונים. היעדרויות: נצברות או לא, מבשילות או לא, וניצול ב-LIFO. בונוס לפי נוסחה. וההוצאה של השנה כמספר שסוגר את המעגל.",
  goal: "לרשום הפרשה להיעדרויות נצברות ולבונוסים לפי נוסחה, ולסגור את המעגל.",
  outcomes: [
    "להבחין בין היעדרות נצברת ללא נצברת, ובין מבשילה ללא מבשילה",
    "לחשב עלות יום עם תוספות המעסיק",
    "למדוד הפרשה בסוף השנה לפי ניצול צפוי ו-LIFO",
    "לחשב את ההוצאה של השנה מהמעגל: סגירה − פתיחה + תשלומים",
    "להכיר בבונוס כשיש מחויבות קיימת ואומדן מהימן",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-short-hook", title: "חמישה ימי חופש שלא ניצלת" },
    { id: "emp-short-what", title: "מה זה ״לזמן קצר״, ולמה לא מהוונים" },
    { id: "emp-short-absence", title: "היעדרויות: נצברת או לא, מבשילה או לא" },
    { id: "emp-short-bonus", title: "בונוסים, והכלל של השיעור" },
    { id: "emp-short-solved", title: "דוגמה פתורה: ימי מחלה שאינם מבשילים" },
    { id: "emp-short-together", title: "פותרים יחד: כשהימים מבשילים, ובונוס" },
    { id: "emp-short-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("day-manager", "עלות יום", `מנהל משתכר ${fmt(GRADES[0].salary)} ₪ בחודש, ${WORKING_DAYS} ימי עבודה בחודש, ותוספות המעסיק על שכרו ${pct(GRADES[0].onCosts)}. מהי עלות יום שלו?`, DAY[0], [
      "עלות יום = שכר ÷ ימי עבודה × (1 + תוספות המעסיק).",
      `${fmt(GRADES[0].salary)} ÷ ${WORKING_DAYS} × ${1 + GRADES[0].onCosts} = ${fmt(DAY[0])} ₪.`,
    ]),
    calc("rec-paid", "ימי הבראה: תשלום", `ימי הבראה (${RECREATION.perYear} בשנה, מבשילים, אפשר לנצל עד סוף השנה הבאה). השנה ניצלו ${GRADES[1].staff} טכנאים ${RECREATION.used[1]} ימים כל אחד ו-${GRADES[2].staff} פקידים ${RECREATION.used[2]} ימים; המנהלים לא ניצלו. עלויות יום: טכנאי ${fmt(DAY[1])} ₪, פקיד ${fmt(DAY[2])} ₪. כמה שולם?`, REC_PAID, [
      `טכנאים: ${GRADES[1].staff} × ${RECREATION.used[1]} × ${fmt(DAY[1])}; פקידים: ${GRADES[2].staff} × ${RECREATION.used[2]} × ${fmt(DAY[2])}.`,
      `סה״כ ${fmt(REC_PAID)} ₪.`,
    ]),
    calc("rec-closing", "ימי הבראה: הפרשה בסוף השנה", `ימי הבראה (${RECREATION.perYear} בשנה, מבשילים, עוברים לשנה הבאה). ${GRADES[0].staff} מנהלים לא ניצלו אף יום, ${GRADES[1].staff} טכנאים ניצלו את כל הימים, ו-${GRADES[2].staff} פקידים ניצלו ${RECREATION.used[2]} ימים כל אחד. עלות יום: מנהל ${fmt(DAY[0])} ₪, פקיד ${fmt(DAY[2])} ₪. מה ההפרשה לימי הבראה בסוף השנה?`, REC_CLOSING, [
      `מנהלים: ${GRADES[0].staff} × ${RECREATION.perYear} × ${fmt(DAY[0])}; פקידים: ${GRADES[2].staff} × ${RECREATION.perYear - RECREATION.used[2]} × ${fmt(DAY[2])}. לטכנאים לא נשאר.`,
      `סה״כ ${fmt(REC_CLOSING)} ₪ — בלי היוון, כי ינוצלו בתוך השנה הבאה.`,
    ]),
    calc("rec-expense", "ימי הבראה: ההוצאה", `תוכנית ימי הבראה התחילה השנה, ולכן אין יתרת פתיחה. השנה שולמו ${fmt(REC_PAID)} ₪ על ימים שנוצלו, וההפרשה בסוף השנה ${fmt(REC_CLOSING)} ₪. מה הוצאות ההבראה של השנה?`, REC_EXPENSE, [
      "הוצאה = סגירה − פתיחה + תשלומים.",
      `${fmt(REC_CLOSING)} − 0 + ${fmt(REC_PAID)} = ${fmt(REC_EXPENSE)} ₪.`,
    ]),
    calc("vac-closing", "חופשה ב-LIFO: סגירה", `לכל פקיד ${VACATION.entitlement} ימי חופשה בשנה, ויום אחד צבור מהשנה הקודמת שפוקע בסוף השנה. כל פקיד ניצל ${VACATION.used} ימים. עלות יום ${fmt(DAY[2])} ₪, ${GRADES[2].staff} פקידים. מה ההפרשה בסוף השנה?`, VAC_CLOSING, [
      `LIFO: ${VACATION.used} הימים יצאו מהזכאות של השנה. נשארו ${vac.unusedOwn} ימים מהשנה, והיום הישן פקע.`,
      `${GRADES[2].staff} × ${vac.unusedOwn} × ${fmt(DAY[2])} = ${fmt(VAC_CLOSING)} ₪.`,
    ]),
    calc("vac-expense", "חופשה ב-LIFO: ההוצאה", `ההפרשה בפתיחה (היום הצבור) הייתה ${fmt(VAC_OPENING)} ₪, ושולמו ${fmt(VAC_PAID)} ₪ על ימי החופשה שנוצלו. מה הוצאות החופשה של השנה?`, VAC_EXPENSE, [
      `${fmt(VAC_CLOSING)} − ${fmt(VAC_OPENING)} + ${fmt(VAC_PAID)} = ${fmt(VAC_EXPENSE)} ₪.`,
      "היום שפקע הקטין את ההוצאה: הפרישו עליו, והוא לא נוצל.",
    ]),
    calc("mgr-bonus", "בונוס מנהלים", `בונוס של ${fmt(MGR_BONUS.amount)} ₪ למנהלים, שישולם בפברואר. על הבונוס חל רק ביטוח לאומי של ${pct(MGR_BONUS.insurance)}. מהי ההפרשה?`, MGR_BONUS_COST, [
      `${fmt(MGR_BONUS.amount)} × ${1 + MGR_BONUS.insurance} = ${fmt(MGR_BONUS_COST)} ₪ — בלי היוון.`,
    ]),
    choice("maternity", "חופשת לידה", "שתי עובדות ייצאו לחופשת לידה בתשלום בשנה הבאה. כמה הפרשה רושמים השנה?", ["אפס — היא אינה נצברת, ונרשמת כשהיא קורית", "את מלוא שכרן לתקופה", "חצי משכרן", "הערך הנוכחי של שכרן"], 0, "היעדרות שאינה נצברת מוכרת רק כשהיא קורית (סעיף 18)."),
    journal(
      "rec-entry",
      "רישום ההפרשה",
      `רשמו את ההפרשה לימי הבראה בסוף השנה: ${fmt(Math.round(REC_CLOSING))} ₪.`,
      [
        { account: "הוצאות שכר", dr: Math.round(REC_CLOSING) },
        { account: "התחייבות לחופשה והבראה", cr: Math.round(REC_CLOSING) },
      ],
      "ההוצאה נרשמת בשנה שבה עבדו, וההתחייבות נשארת במאזן עד שהימים ינוצלו.",
      ["הוצאות שכר", "התחייבות לחופשה והבראה", "מזומן", "הוצאות מימון"],
    ),
  ],
  traps,
  tips: [
    "הטבה לזמן קצר היא סכום לא מהוון, לפי מה שצפוי להשתלם.",
    "הפרשה בסוף השנה = (ימי הצבירה שצפוי לנצל + ימי הצבירה של עוזבים צפויים, אם ההיעדרות מבשילה) × עלות יום. ההוצאה היא ה-P.N. של המעגל: סגירה − פתיחה + תשלומים.",
    "לא נצברת (חג, מחלה שלא עוברת, חופשת לידה, מילואים): מכירים כשהיא קורית (סעיפים 13ב ו-18). נצברת: מפרישים על מה שצפוי (סעיפים 15–16).",
    "LIFO: קודם מנצלים את הזכאות של השנה, ורק אחר כך את היתרה הישנה.",
    "בונוס ושיתוף ברווחים (סעיף 19): מכירים כשיש מחויבות ואומדן מהימן. מספיק אחד: נוסחה בתוכנית, סכום שנקבע לפני אישור הדוחות, או נוהג מהעבר.",
  ],
};
