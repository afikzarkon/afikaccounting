import { accrualPath, accrued, attribution, pv, tiered } from "@/lib/learn/ias19";
import { examA } from "@/lib/learn/ias19-exams";
import type { StudyModule, Trap } from "../../types";
import { windowRow, type WindowRule } from "../drills";
import { FORMULA, said, work } from "../formulas";
import { calc, choice, COURSE, COURSE_HREF, fmt, pct } from "../shared";

/** The worked example: a grant that pays more for early years, with a cap — the plan's formula. */
export const FRONT = { early: { upTo: 4, perYear: 2_500 }, later: 1_200, cap: 14_800, expected: 8, served: 5, n: 3, rate: 0.06 };
export const frontF = tiered([{ upTo: FRONT.early.upTo, perYear: FRONT.early.perYear }, { perYear: FRONT.later }]);
export const FRONT_A = attribution(frontF, FRONT.expected, FRONT.cap);
export const FRONT_ACCRUED = accrued(FRONT_A, frontF, FRONT.served, FRONT.cap);
export const FRONT_OBLIGATION = pv(FRONT_ACCRUED, FRONT.rate, FRONT.n);
/** What the straight line — wrong here — would have given. */
export const FRONT_WRONG = (FRONT.cap / FRONT.expected) * FRONT.served;
export const FRONT_WRONG_OBLIGATION = pv(FRONT_WRONG, FRONT.rate, FRONT.n);
/** Year by year, both ways — for the bars. */
export const FRONT_PATH = accrualPath(frontF, FRONT.expected, FRONT.cap);

/** "We solve" (a): later years pay much more — straight line. */
export const BACK = { early: { upTo: 4, perYear: 2_500 }, later: 6_000, expected: 10, served: 6, n: 4, rate: 0.06 };
export const backF = tiered([{ upTo: BACK.early.upTo, perYear: BACK.early.perYear }, { perYear: BACK.later }]);
export const BACK_A = attribution(backF, BACK.expected);
export const BACK_ACCRUED = accrued(BACK_A, backF, BACK.served);
export const BACK_OBLIGATION = pv(BACK_ACCRUED, BACK.rate, BACK.n);
export const BACK_WRONG = backF(BACK.served);
export const BACK_WRONG_OBLIGATION = pv(BACK_WRONG, BACK.rate, BACK.n);
export const BACK_PATH = accrualPath(backF, BACK.expected);

/** The hook: a free membership after ten stages, the first three worth double — as a share of the whole, both ways. */
const gym = accrualPath(tiered([{ upTo: 3, perYear: 2 }, { perYear: 1 }]), 10);
export const GYM_PATH = gym.map((r) => ({ formula: Math.round((r.formula / gym[9].formula) * 100), straight: Math.round((r.straight / gym[9].straight) * 100) }));

/** The cap, drawn: 2,500 a year up to 10,000, over eight years of work — the window ends in year four. */
export const CAPPED = { perYear: 2_500, cap: 10_000, expected: 8 };
export const CAPPED_PATH = accrualPath(tiered([{ perYear: CAPPED.perYear }]), CAPPED.expected, CAPPED.cap);

/** "We solve" (b): a grant at 67 for which service counts only from 47; three employees. */
export const LATE = {
  grant: 6_000,
  countsFrom: 47,
  retire: 67,
  rate: 0.035,
  people: [
    { id: "א", age: 50, startedAt: 30, stay: 0.85 },
    { id: "ב", age: 45, startedAt: 40, stay: 0.9 },
    { id: "ג", age: 60, startedAt: 55, stay: 0.95 },
  ],
};
export const latePerson = (p: (typeof LATE.people)[number]) => {
  const from = Math.max(p.startedAt, LATE.countsFrom);
  const window = LATE.retire - from;
  const perYear = LATE.grant / window;
  const served = Math.max(0, p.age - from);
  const n = LATE.retire - p.age;
  return { from, window, perYear, served, accrued: perYear * served, n, obligation: pv(perYear * served, LATE.rate, n) * p.stay };
};
export const LATE_ROWS = LATE.people.map(latePerson);
export const LATE_TOTAL = LATE_ROWS.reduce((s, r) => s + r.obligation, 0);

/**
 * "We solve" (b): a grant with two routes to entitlement — still employed at
 * 60 after 25 years of service, or at 67 regardless of service — and three
 * employees, one for each case of IAS 19.73: hired before 35 (counts only
 * from 35), hired in time to complete 25 years (counts from hire, for 25
 * years), hired too late (counts from hire to 67).
 */
export const DUAL: { rule: WindowRule; rate: number; date: string; people: { id: string; age: number; hireAge: number; stay: number }[] } = {
  rule: { grant: 4_500, minAge: 60, years: 25, retire: 67 },
  rate: 0.035,
  date: "31.12.2025",
  people: [
    { id: "א", age: 41, hireAge: 31, stay: 0.8 },
    { id: "ב", age: 44, hireAge: 39, stay: 0.9 },
    { id: "ג", age: 63, hireAge: 58, stay: 0.96 },
  ],
};
export const DUAL_ROWS = DUAL.people.map((p) => windowRow(DUAL.rule, DUAL.rate, p));
export const DUAL_TOTAL = DUAL_ROWS.reduce((s, r) => s + r.obligation, 0);

/** The exercise (a): a one-off grant for at least twelve years of service, paid at 67 — divided by twelve, discounted to payment. */
export const ONEOFF = { grant: 90_000, minYears: 12, startAge: 38, retire: 67, from: 2021, rates: { 2021: 0.055, 2022: 0.06 } };
export const ONEOFF_PER_YEAR = ONEOFF.grant / ONEOFF.minYears;
export const oneoffAt = (year: 2021 | 2022) => {
  const served = year - ONEOFF.from + 1;
  const n = ONEOFF.retire - ONEOFF.startAge - served;
  return { served, n, obligation: pv(ONEOFF_PER_YEAR * served, ONEOFF.rates[year], n) };
};

/** The exercise (b): the assembly department of the first exam question, its opening and closing balances. */
const A = examA().assembly;
export const ASM = A;

const traps: Trap[] = [
  {
    id: "habit",
    prompt: "מענק: 1,200 ₪ לכל אחת מ-4 השנים הראשונות, ו-600 ₪ לכל שנה אחריהן. איך משייכים לשנים?",
    options: ["לפי נוסחת התוכנית", "בקו ישר — תמיד", "בקו ישר, כי יש שתי מדרגות", "רק בשנה האחרונה"],
    answer: 0,
    why: "קו ישר רק כשהשנים המאוחרות נותנות הטבה גבוהה מהותית. כאן המאוחרות נותנות פחות — נוסחת התוכנית (סעיף 71).",
    traps: ["", "המלכודת: קו ישר מתוך הרגל. קודם בודקים מי גבוה יותר.", "המדרגות לא קובעות; הכיוון שלהן קובע.", "הצבירה לאורך כל שנות השירות."],
  },
  {
    id: "shrink-cap",
    prompt: "מענק של 2,500 ₪ לשנה, עד תקרה של 12,500 ₪. העובד צפוי לעבוד 9 שנים. מה נכון?",
    options: ["ההטבה 12,500, והצבירה נפרסת על 5 שנים", "ההטבה 12,500, והצבירה כ-1,389 לשנה על 9 שנים", "ההטבה 22,500", "ההטבה 12,500, והצבירה מתחילה בשנה החמישית"],
    answer: 0,
    why: `התקרה מקצרת את חלון הצבירה, והשנים שאחריו לא מוסיפות דבר.
${said(work.capWindow(12_500, 2_500))}`,
    traps: ["", "המלכודת: לכווץ את הסכום לשנה. השנים שאחרי התקרה לא מקנות כלום.", "התקרה חותכת את ההטבה.", "הצבירה מהשנה הראשונה, עד התקרה."],
  },
  {
    id: "before-eligible",
    prompt: "השירות מקנה זכאות רק מגיל 42. עובד התחיל לעבוד בגיל 37, והיום הוא בן 45. כמה שנות שירות נספרות?",
    options: ["3", "8", "5", "0"],
    answer: 0,
    why: `סופרים רק מהרגע שהשירות מקנה זכאות.
${said(work.counted(45, 42))}`,
    traps: ["", "המלכודת: לספור את כל שנות העבודה. חמש השנים הראשונות לא מקנות כלום.", "אלה השנים שלא נספרות.", "הוא כבר עבר את גיל 42."],
  },
  {
    id: "discount-window",
    prompt: "מענק של 72,000 ₪ למי שעובד 9 שנים לפחות; נספר על 9 שנים, אבל ישולם בגיל 67 — בעוד 26 שנים מסוף השנה הראשונה. מה נכון?",
    options: ["8,000 לשנה, מהוון 26 שנים", "8,000 לשנה, מהוון 9 שנים", "72,000 מהוון 26 שנים", "2,667 לשנה (72,000 ÷ 27)"],
    answer: 0,
    why: `מחלקים בחלון הצבירה (9), ומהוונים לפי השנים עד התשלום (26).
${said(work.straight(72_000, 9))}`,
    traps: ["", "המלכודת: להוון על חלון הצבירה. ההיוון תמיד עד התשלום.", "בשנה הראשונה נצבר רק תשיעית.", "החלון הוא 9 שנים — לא כל הדרך לפרישה."],
  },
  {
    id: "two-routes",
    prompt: "מענק למי שמועסק בגיל 60 אחרי 25 שנות שירות, או בגיל 67 בלי קשר לוותק. עובד התחיל לעבוד בגיל 50. על כמה שנים נפרש המענק?",
    options: ["17 — מגיל 50 עד 67", "25", "10 — מגיל 50 עד 60", "אין התחייבות — הוא לא ישלים 25 שנה"],
    answer: 0,
    why: "עד 67 הוא לא ישלים 25 שנה, ולכן יקבל את המענק רק במסלול הגיל, בגיל 67. כל שירותו מוביל לשם: 17 שנים.",
    traps: ["", "המלכודת: לחלק תמיד בתקופת הוותק הנדרשת. הוא לא יגיע אליה.", "בגיל 60 הוא עוד לא זכאי — רק 10 שנות שירות.", "יש מסלול שני: בגיל 67 הוא זכאי בלי קשר לוותק."],
  },
  {
    id: "group-heads",
    prompt: "קבוצה של 6 עובדים צוברת 3,500 ₪ לשנה לכל אחד, וכל אחד עבד 4 שנים. מה הסכום הצבור של הקבוצה, לפני היוון?",
    options: ["84,000", "14,000", "21,000", "3,500"],
    answer: 0,
    why: said(work.accruedGroup(3_500, 4, 6)),
    traps: ["", "המלכודת: לשכוח את מספר העובדים.", "שכחתם את שנות השירות.", "זו שנה אחת של עובד אחד."],
  },
];

/** Lesson 6: attribution — how much of a benefit belongs to each year of service: the plan's formula, straight line, a cap, and service that counts only from some point. */
export const ATTRIBUTE: StudyModule = {
  slug: "ias19-attribute",
  course: COURSE,
  n: 6,
  title: "הטבה מוגדרת 2: לאיזו שנת שירות שייך כל חלק מההטבה",
  description: "שלוש שאלות לפני כל חישוב. השנים המאוחרות גבוהות בהרבה? קו ישר. יש תקרה? החלון מתקצר. ממתי השירות נספר? משם סופרים. אחר כך מהוונים, תמיד עד התשלום.",
  goal: "להחליט כמה מההטבה שייך לכל שנת שירות. גם כשהנוסחה לא אחידה, כשיש תקרה, או כשהזכאות מתחילה מאוחר.",
  outcomes: [
    "להכריע בין נוסחת התוכנית לקו ישר",
    "לקצר את חלון הצבירה כשיש תקרה",
    "לספור שנות שירות רק מהרגע שהן מקנות זכאות, ולעצור כשהן מפסיקות להוסיף",
    "לפתור מענק עם שני מסלולים לזכאות (גיל וּותק, או גיל בלבד) לכמה עובדים",
    "להוון לפי השנים עד התשלום, לא לפי חלון הצבירה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-attr-hook", title: "מנוי חינם אחרי 100 אימונים" },
    { id: "emp-attr-formula", title: "נוסחת התוכנית, או קו ישר" },
    { id: "emp-attr-cap", title: "תקרה, וזכאות שמתחילה מאוחר" },
    { id: "emp-attr-dual", title: "שני מסלולים לזכאות: גיל וּותק, או גיל בלבד" },
    { id: "emp-attr-rule", title: "הכלל: שלוש שאלות לפני כל חישוב" },
    { id: "emp-attr-template", title: "תבנית פתרון: שאלת ייחוס" },
    { id: "emp-attr-solved", title: "דוגמה פתורה: מענק שנותן יותר בהתחלה" },
    { id: "emp-attr-together", title: "פותרים יחד: מענק שקופץ, ושלושה עובדים בשני מסלולים" },
    { id: "emp-attr-drill", title: "מחולל שאלות: ייחוס במספרים חדשים" },
    { id: "emp-attr-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("oneoff-2021", "מענק חד־פעמי: שנה ראשונה", `עובד מקבל מענק של ${fmt(ONEOFF.grant)} ₪ אם יעבוד ${ONEOFF.minYears} שנים לפחות ויפרוש בגיל ${ONEOFF.retire}. הוא התחיל ב-1.1.${ONEOFF.from} בגיל ${ONEOFF.startAge}. שיעור ההיוון ב-31.12.${ONEOFF.from}: ${pct(ONEOFF.rates[2021])}. מה ההתחייבות ב-31.12.${ONEOFF.from}?`, oneoffAt(2021).obligation, [
      `צוברים על ${ONEOFF.minYears} שנים:
${said(work.straight(ONEOFF.grant, ONEOFF.minYears))}`,
      `בסוף ${ONEOFF.from} העובד בן ${ONEOFF.startAge + 1}, והתשלום בגיל ${ONEOFF.retire}:
${said(work.nAge(ONEOFF.retire, ONEOFF.startAge + 1))}`,
      `נצברה שנה אחת:
${said(work.measure({ perYear: ONEOFF_PER_YEAR, years: 1, heads: 1, n: oneoffAt(2021).n, i: ONEOFF.rates[2021] }))}`,
    ]),
    calc("oneoff-2022", "מענק חד־פעמי: שנה שנייה", `מענק של ${fmt(ONEOFF.grant)} ₪ למי שעובד ${ONEOFF.minYears} שנים לפחות ופורש בגיל ${ONEOFF.retire}; העובד התחיל ב-1.1.${ONEOFF.from} בגיל ${ONEOFF.startAge}. שיעור ההיוון ב-31.12.${ONEOFF.from + 1}: ${pct(ONEOFF.rates[2022])}. מה ההתחייבות ב-31.12.${ONEOFF.from + 1}?`, oneoffAt(2022).obligation, [
      said(work.straight(ONEOFF.grant, ONEOFF.minYears)),
      said(work.nAge(ONEOFF.retire, ONEOFF.startAge + 2)),
      `נצברו שתי שנים:
${said(work.measure({ perYear: ONEOFF_PER_YEAR, years: 2, heads: 1, n: oneoffAt(2022).n, i: ONEOFF.rates[2022] }))}`,
      `מחלקים ב-${ONEOFF.minYears}, אבל מהוונים על ${oneoffAt(2022).n}.`,
    ]),
    ...ASM.groups.map((g, k) =>
      calc(
        `asm-open-${g.id}`,
        "מחלקת הרכבה: פתיחה",
        `מחלקת הרכבה: מענק פרישה עם תקרה, שמשויך בקו ישר. לקבוצת העובדים שהתחילו ב-${g.id} (${g.heads} עובדים) נצברים ${fmt(g.grants[0].perYear)} ₪ לשנה לעובד, על ${g.grants[0].window} שנים לכל היותר. ב-1.1.2022 עבדו ${g.served} שנים, והתשלום בעוד ${g.nEnd + 1} שנים; שיעור ההיוון 6%. מה יתרת הפתיחה של הקבוצה?`,
        ASM.year1.rows[k].opening,
        [
          `שנים שנספרו: ${Math.min(g.served, g.grants[0].window)} (עבדו ${g.served}, והחלון ${g.grants[0].window}).`,
          said(work.measure({ perYear: g.grants[0].perYear, years: Math.min(g.served, g.grants[0].window), heads: g.heads, n: g.nEnd + 1, i: 0.06 })),
        ],
      ),
    ).filter((x) => x.kind === "number" && x.answer > 0),
    calc("asm-closing", "מחלקת הרכבה: סגירה", "מחלקת הרכבה, 31.12.2022: כל קבוצה צברה עוד שנה, והתשלום קרוב בשנה. בשיעור 6% — מה יתרת הסגירה של המחלקה (ארבע הקבוצות יחד)?", ASM.year1.closing, [
      `כל קבוצה לפי ${FORMULA.measure}:`,
      ...ASM.groups.map((g) => `קבוצת ${g.id}:
${work.measure({ perYear: g.grants[0].perYear, years: Math.min(g.served + 1, g.grants[0].window), heads: g.heads, n: g.nEnd, i: 0.06 }).numbers}`),
      said(work.groupsTotal(ASM.year1.rows.map((r) => r.closing))),
    ]),
    choice("pick-method", "שיטת השיוך", "מענק: 1,200 ₪ לכל אחת מ-4 השנים הראשונות, ו-4,800 ₪ לכל שנה אחריהן. איך משייכים?", ["בקו ישר", "לפי נוסחת התוכנית", "רק בשנים 5 ואילך", "לפי השנה האחרונה"], 0, "השנים המאוחרות גבוהות מהותית — קו ישר (סעיף 73)."),
  ],
  traps,
  tips: [
    "קודם מחלקים את ההטבה בין השנים: נוסחה, קו ישר, תקרה או תחילת זכאות. רק אחר כך מהוונים, לפי השנים עד התשלום.",
    `שלוש שאלות: (א) השנים המאוחרות גבוהות מהותית? קו ישר: ${FORMULA.straight}; אחרת נוסחת התוכנית. (ב) יש תקרה? ${FORMULA.capWindow}. (ג) ממתי השירות מקנה זכאות? ${FORMULA.counted}.`,
    "ברירת המחדל — נוסחת התוכנית (סעיף 71); החריג — קו ישר כשהשנים המאוחרות מניבות הטבה גבוהה מהותית (סעיף 73).",
    "מחלקים בחלון הצבירה, מהוונים על השנים עד התשלום.",
  ],
};
