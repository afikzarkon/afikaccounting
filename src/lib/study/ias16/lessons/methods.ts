import type { StudyModule } from "../../types";
import { dbQ, sydQ, unitsQ } from "../depreciation";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "../shared";

/** The declining-balance screen's asset: the rate that lands on the salvage value. */
export const DB = { cost: 512_000, salvage: 2_000, life: 4 };
export const DB_RATE = 1 - Math.pow(DB.salvage / DB.cost, 1 / DB.life);
/** Sum of the years' digits from April: life years against fiscal years. */
export const SYD = { cost: 100_000, life: 4, startMonth: 4 };
const sydDigits = (SYD.life * (SYD.life + 1)) / 2;
const lifeYear = (k: number) => (SYD.cost * (SYD.life - k + 1)) / sydDigits;
const before = SYD.startMonth - 1;
export const SYD_FISCAL = [(lifeYear(1) * (12 - before)) / 12, (lifeYear(1) * before) / 12 + (lifeYear(2) * (12 - before)) / 12];
const ASC = { cost: 66_000, salvage: 6_000, life: 5 };
const ascDigits = (ASC.life * (ASC.life + 1)) / 2;
/** Declining balance read backwards: two charges in a row give the rate, and the first gives the cost. */
export const DB_BACK = { first: 20_000, second: 16_000 };
const dbBackRate = (DB_BACK.first - DB_BACK.second) / DB_BACK.first;
const dbBackCost = (DB_BACK.first * DB_BACK.first) / (DB_BACK.first - DB_BACK.second);
/** Units of production read backwards: the charge per kilometre. */
export const UNITS_BACK = { charge: 9_000, km: 30_000 };

/** Lesson 5: why there are several methods, the accelerated ones — declining balance, the sum of the years' digits both ways, units of production — how a part year splits a life year, and how a question tells which method it wants. */
export const METHODS: StudyModule = {
  slug: "ias16-methods",
  course: COURSE,
  n: 5,
  title: "שיטות פחת, ואיך יודעים באיזו להשתמש",
  description: "למה יש כמה שיטות; יתרה פוחתת, סכום ספרות השנים יורד ועולה, ויחידות תפוקה; שנת חיים שמתחילה באמצע שנה — ואיך מזהים מהשאלה באיזו שיטה לחשב.",
  goal: "לחשב פחת בכל אחת מהשיטות, ולזהות מתוך הנתונים בשאלה באיזו שיטה מדובר.",
  outcomes: [
    "להסביר למה יש כמה שיטות פחת, ומה משותף לכולן",
    "לחשב פחת ביתרה פוחתת, בסכום ספרות השנים ובתפוקה",
    "לחלק שנת חיים בין שתי שנות כספים כשהנכס נכנס באמצע שנה",
    "לזהות מהנתונים בשאלה איזו שיטה לבחור",
    "לחלץ שיעור, עלות או פחת ליחידה מתוך פחת שנתון",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-why-methods", title: "למה יש כמה שיטות" },
    { id: "ppe-db", title: "יתרה פוחתת: שיעור קבוע על ערך שהולך וקטן" },
    { id: "ppe-syd", title: "סכום ספרות השנים: יורד ועולה" },
    { id: "ppe-syd-part", title: "כשהנכס נכנס באמצע שנה" },
    { id: "ppe-units", title: "יחידות תפוקה" },
    { id: "ppe-which-method", title: "איך יודעים באיזו שיטה לחשב" },
    { id: "depreciation", title: "סימולטור: כל השיטות על אותו נכס" },
  ],
  tools: [{ screen: "depreciation", label: "סימולטור הפחת" }],
  exercises: [
    sydQ({ cost: 120_000, salvage: 20_000, life: 4 }),
    dbQ({ cost: 100_000, rate: 30 }),
    unitsQ({ cost: 50_000, salvage: 5_000, total: 90_000, made: 18_000 }),
    calc(
      "db-rate",
      "שיעור היתרה הפוחתת",
      `נכס בעלות ${fmt(DB.cost)} ₪, ערך גרט ${fmt(DB.salvage)} ₪ ו-${DB.life} שנות חיים, ביתרה פוחתת. מהו שיעור הפחת השנתי, באחוזים?`,
      Math.round(DB_RATE * 10000) / 100,
      [`השיעור = 1 − (גרט ÷ עלות)^(1/n) = 1 − (${fmt(DB.salvage)} ÷ ${fmt(DB.cost)})^(1/${DB.life}).`, `${fmt(DB.salvage)} ÷ ${fmt(DB.cost)} = 1/256; השורש הרביעי — 1/4. השיעור: 1 − 0.25 = 75%.`],
    ),
    calc(
      "syd-asc",
      "סכום ספרות עולה",
      `נכס בעלות ${fmt(ASC.cost)} ₪, ערך גרט ${fmt(ASC.salvage)} ₪, ${ASC.life} שנות חיים, בסכום ספרות השנים העולה. מה הפחת בשנה הראשונה?`,
      ((ASC.cost - ASC.salvage) * 1) / ascDigits,
      [`סכום הספרות: ${ascDigits}. בשיטה העולה, בשנה הראשונה המונה הוא 1.`, `(${fmt(ASC.cost)} − ${fmt(ASC.salvage)}) × 1/${ascDigits} = ${fmt((ASC.cost - ASC.salvage) / ascDigits)} ₪.`],
    ),
    calc(
      "syd-fiscal-1",
      "שנה חלקית בסכום ספרות",
      `נכס בעלות ${fmt(SYD.cost)} ₪, בלי ערך גרט, ${SYD.life} שנות חיים בסכום ספרות השנים היורד. הוא נכנס לשימוש ב-1.${SYD.startMonth}.2025. מה הפחת לשנת 2025?`,
      SYD_FISCAL[0],
      [`שנת החיים הראשונה (1.${SYD.startMonth}.2025–31.${before}.2026): ${SYD.life}/${sydDigits} × ${fmt(SYD.cost)} = ${fmt(lifeYear(1))} ₪.`, `ב-2025 עברו ${12 - before} חודשים ממנה: ${fmt(lifeYear(1))} × ${12 - before}/12 = ${fmt(SYD_FISCAL[0])} ₪.`],
    ),
    calc(
      "syd-fiscal-2",
      "השנה השנייה",
      `נכס בעלות ${fmt(SYD.cost)} ₪, בלי ערך גרט, ${SYD.life} שנות חיים בסכום ספרות השנים היורד, נכנס לשימוש ב-1.${SYD.startMonth}.2025. מה הפחת לשנת 2026?`,
      SYD_FISCAL[1],
      [
        `שנת כספים 2026 מכילה ${before} חודשים מסוף שנת החיים הראשונה ו-${12 - before} מתחילת השנייה.`,
        `${fmt(lifeYear(1))} × ${before}/12 + ${fmt(lifeYear(2))} × ${12 - before}/12 = ${fmt((lifeYear(1) * before) / 12)} + ${fmt((lifeYear(2) * (12 - before)) / 12)} = ${fmt(SYD_FISCAL[1])} ₪.`,
      ],
    ),
    choice(
      "revenue-based",
      "שיטה אסורה",
      "האם מותר להפחית נכס לפי ההכנסות שהוא מייצר?",
      ["לא — הכנסות לא משקפות את צריכת הנכס", "כן, זו שיטת יחידות התפוקה", "כן, אם ההכנסות יציבות"],
      0,
      "הכנסות מושפעות גם ממחירים ומכמויות מכירה — לא רק מהשימוש בנכס. התקן אוסר שיטה שמבוססת עליהן.",
    ),
    choice(
      "units-zero",
      "יחידות תפוקה",
      "מכונה שמופחתת לפי יחידות תפוקה לא עבדה בכלל השנה. מה הפחת?",
      ["אפס", "כמו בשנה הקודמת", "לפי קו ישר", "חצי"],
      0,
      "ביחידות תפוקה הפחת תלוי רק בתפוקה. בלי תפוקה — בלי פחת.",
    ),
    calc(
      "db-year3",
      "יתרה פוחתת — שנה שלישית",
      "מכונה בעלות 200,000 ₪, יתרה פוחתת בשיעור 25% לשנה. מה הפחת בשנה השלישית?",
      28_125,
      ["שנה 1: 50,000 (נשאר 150,000). שנה 2: 37,500 (נשאר 112,500).", "שנה 3: 112,500 × 25% = 28,125 ₪."],
    ),
    calc(
      "units-salvage",
      "יחידות תפוקה עם גרט",
      "מכונה בעלות 210,000 ₪, ערך גרט 10,000 ₪, צפויה לעבוד 50,000 שעות. השנה עבדה 6,000 שעות. מה הפחת?",
      24_000,
      ["פחת לשעה: (210,000 − 10,000) ÷ 50,000 = 4 ₪.", "6,000 × 4 = 24,000 ₪."],
    ),
    calc(
      "db-back",
      "מהפחת אל העלות — יתרה פוחתת",
      `נכס מופחת ביתרה פוחתת. הפחת בשנה הראשונה היה ${fmt(DB_BACK.first)} ₪, ובשנה השנייה ${fmt(DB_BACK.second)} ₪. מה עלות הנכס?`,
      dbBackCost,
      [
        `ביתרה פוחתת, הפחת של שנה 2 = השיעור × (עלות − פחת שנה 1). לכן היחס בין שתי השנים הוא 1 − שיעור: ${fmt(DB_BACK.second)} ÷ ${fmt(DB_BACK.first)} = ${fmt(DB_BACK.second / DB_BACK.first)}.`,
        `השיעור: 1 − ${fmt(DB_BACK.second / DB_BACK.first)} = ${fmt(dbBackRate * 100)}%.`,
        `פחת שנה 1 = עלות × שיעור. לכן עלות = ${fmt(DB_BACK.first)} ÷ ${fmt(dbBackRate * 100)}% = ${fmt(dbBackCost)} ₪.`,
      ],
    ),
    calc(
      "units-back",
      "פחת לק״מ",
      `המשאית של המאפייה מופחתת לפי ק״מ. השנה היא נסעה ${fmt(UNITS_BACK.km)} ק״מ, והפחת היה ${fmt(UNITS_BACK.charge)} ₪. כמה פחת נרשם על כל ק״מ, בשקלים?`,
      UNITS_BACK.charge / UNITS_BACK.km,
      [`פחת השנה = פחת לק״מ × הק״מ של השנה.`, `לכן פחת לק״מ = ${fmt(UNITS_BACK.charge)} ÷ ${fmt(UNITS_BACK.km)} = ${fmt(UNITS_BACK.charge / UNITS_BACK.km)} ₪.`],
    ),
  ],
  traps: [
    {
      id: "db-salvage",
      prompt: "מכונה בעלות 100,000 ₪ וערך גרט 10,000 ₪, פחת ביתרה פוחתת בשיעור 20%. מה הפחת בשנה הראשונה?",
      options: ["20,000 ₪", "18,000 ₪", "10,000 ₪"],
      answer: 0,
      why: "ביתרה פוחתת השיעור חל על הערך בספרים — בשנה הראשונה, העלות: 100,000 × 20% = 20,000 ₪. את הגרט לא מנכים מהבסיס.",
      traps: ["", "המלכודת: (100,000 − 10,000) × 20%. ביתרה פוחתת לא מנכים את הגרט מהבסיס — השיעור כבר לוקח אותו בחשבון.", "זה ערך הגרט — לא הפחת."],
    },
    {
      id: "syd-fiscal",
      prompt: "נכס בסכום ספרות יורד נכנס לשימוש ב-1.7. בשנת הכספים השנייה, איזה מונה משמש?",
      options: ["חצי שנה עם המונה הראשון, וחצי עם השני", "רק המונה השני", "רק המונה הראשון", "ממוצע של כל המונים"],
      answer: 0,
      why: "שנות החיים לא מתלכדות עם שנות הכספים. שנת כספים 2 מכילה את סוף שנת החיים הראשונה ואת תחילת השנייה.",
      traps: ["", "המלכודת: מונה אחד לכל שנת כספים. זה נכון רק כשהנכס נכנס ב-1.1.", "המונה הראשון כבר נוצל בחלקו בשנה הראשונה.", "אין ממוצעים: מחלקים לפי חודשים."],
    },
  ],
  tips: [
    "יתרה פוחתת: שיעור קבוע × הערך בספרים בתחילת השנה. השיעור = 1 − (גרט ÷ עלות)^(1/n); בלי גרט — השיעור נתון.",
    "סכום ספרות: (עלות − גרט) × מונה ÷ (n(n+1)/2). יורד — מתחילים ב-n; עולה — מתחילים ב-1.",
    "נכס שנכנס באמצע שנה: מחשבים לפי שנות חיים, ומחלקים כל שנת חיים בין שתי שנות כספים לפי חודשים.",
    "יחידות תפוקה: (עלות − גרט) × תפוקת השנה ÷ התפוקה הכוללת. תאריך הכניסה לא משנה — רק התפוקה.",
    "סך הפחת לאורך החיים זהה בכל השיטות. רק החלוקה בין השנים שונה. אסור להפחית לפי הכנסות.",
  ],
};
