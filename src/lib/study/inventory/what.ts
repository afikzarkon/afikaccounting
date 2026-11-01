import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const COUNT = 18_000;
const COGS = { opening: 40_000, purchases: 250_000, closing: 55_000 };
const cogs = COGS.opening + COGS.purchases - COGS.closing;
const ROLL = { opening: 50_000, purchases: 300_000, cogs: 280_000 };
const rollClosing = ROLL.opening + ROLL.purchases - ROLL.cogs;
const GP = { sales: 400_000, returns: 20_000, cogs: 228_000 };
const netSales = GP.sales - GP.returns;
const grossProfit = netSales - GP.cogs;
const gpPct = Math.round((grossProfit / netSales) * 1000) / 10;
/** Two years of one shop: the first year's closing count opens the second. */
export const TWO_YEARS = { unit: 30, buy1: 500, sold1: 380, buy2: 600, sold2: 650, price: 70 };
const left1 = TWO_YEARS.buy1 - TWO_YEARS.sold1;
const left2 = left1 + TWO_YEARS.buy2 - TWO_YEARS.sold2;
export const YEAR2_COGS = left1 * TWO_YEARS.unit + TWO_YEARS.buy2 * TWO_YEARS.unit - left2 * TWO_YEARS.unit;

/** Lesson 1: why inventory exists — the matching principle, the year-end entry, its two homes, the next year, the vocabulary and the statement up to gross profit. */
export const WHAT: StudyModule = {
  slug: "inventory-what",
  course: COURSE,
  n: 1,
  title: "מהו מלאי ועלות המכר",
  description: "מה שלא נמכר אינו הוצאה של השנה: עיקרון ההקבלה, פקודת המלאי בסוף השנה, מה קורה לה בשנה הבאה, והדוח עד הרווח הגולמי.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-idea", title: "מה שלא נמכר — לא הוצאה של השנה" },
    { id: "iv-year-end", title: "ארבעה צעדים בסוף השנה" },
    { id: "inv-homes", title: "שני בתים למלאי הסגירה" },
    { id: "iv-next-year", title: "בשנה הבאה: הסגירה הופכת לפתיחה" },
    { id: "inv-terms", title: "אוצר מילים" },
    { id: "inv-cogs", title: "הדוח עד הרווח הגולמי" },
  ],
  exercises: [
    journal(
      "closing-count",
      "מלאי סגירה בשיטה תקופתית",
      `החברה מנהלת מלאי בשיטה תקופתית. בספירה ב-31.12 נמצא מלאי בעלות ${fmt(COUNT)} ₪. רשמו את פקודת מלאי הסגירה.`,
      [
        { account: "מלאי סגירה מאזני", dr: COUNT },
        { account: "מלאי סגירה רווח או הפסד", cr: COUNT },
      ],
      "אותו סכום בשני בתים: בחובה — הנכס במאזן, שעובר לשנה הבאה. בזכות — החשבון התוצאתי שמקטין את עלות המכר.",
      ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "מלאי פתיחה", "קניות", "עלות המכר"],
    ),
    choice(
      "idea-cogs",
      "עיקרון ההקבלה",
      "חנות קנתה 20 יחידות ב-10 ₪ ומכרה 15 מהן. אין מלאי פתיחה. מהי עלות המכר?",
      ["200 ₪", "150 ₪", "50 ₪", "תלוי במחיר המכירה"],
      1,
      "רק 15 היחידות שנמכרו: 15 × 10 = 150. חמש היחידות שנשארו הן מלאי — נכס.",
    ),
    calc(
      "cogs",
      "עלות המכר",
      `מלאי פתיחה ${fmt(COGS.opening)} ₪, קניות ${fmt(COGS.purchases)} ₪, מלאי סגירה ${fmt(COGS.closing)} ₪. מהי עלות המכר?`,
      cogs,
      ["עלות המכר = מלאי פתיחה + קניות − מלאי סגירה.", `${fmt(COGS.opening)} + ${fmt(COGS.purchases)} − ${fmt(COGS.closing)} = ${fmt(cogs)} ₪.`],
    ),
    calc(
      "closing-from-cogs",
      "מלאי סגירה מהנוסחה",
      `מלאי פתיחה ${fmt(ROLL.opening)} ₪, קניות נטו ${fmt(ROLL.purchases)} ₪, עלות המכר ${fmt(ROLL.cogs)} ₪. מהו מלאי הסגירה?`,
      rollClosing,
      ["אותה נוסחה, והנעלם במקום אחר: סגירה = פתיחה + קניות − עלות המכר.", `${fmt(ROLL.opening)} + ${fmt(ROLL.purchases)} − ${fmt(ROLL.cogs)} = ${fmt(rollClosing)} ₪.`],
    ),
    calc(
      "second-year",
      "השנה השנייה",
      `חנות שהוקמה ב-2025 קנתה בה ${TWO_YEARS.buy1} יח׳ ומכרה ${TWO_YEARS.sold1}. ב-2026 קנתה ${TWO_YEARS.buy2} יח׳ ומכרה ${TWO_YEARS.sold2}. כל יחידה עלתה ${TWO_YEARS.unit} ₪. מהי עלות המכר של 2026?`,
      YEAR2_COGS,
      [
        `מלאי הפתיחה של 2026 הוא הסגירה של 2025: ${TWO_YEARS.buy1} − ${TWO_YEARS.sold1} = ${left1} יח׳ × ${TWO_YEARS.unit} = ${fmt(left1 * TWO_YEARS.unit)} ₪.`,
        `הסגירה של 2026: ${left1} + ${TWO_YEARS.buy2} − ${TWO_YEARS.sold2} = ${left2} יח׳ × ${TWO_YEARS.unit} = ${fmt(left2 * TWO_YEARS.unit)} ₪.`,
        `עלות המכר: ${fmt(left1 * TWO_YEARS.unit)} + ${fmt(TWO_YEARS.buy2 * TWO_YEARS.unit)} − ${fmt(left2 * TWO_YEARS.unit)} = ${fmt(YEAR2_COGS)} ₪ — בדיוק ${TWO_YEARS.sold2} × ${TWO_YEARS.unit}.`,
      ],
    ),
    calc(
      "gross-profit",
      "רווח גולמי",
      `מכירות ${fmt(GP.sales)} ₪, הנחות והחזרות ללקוחות ${fmt(GP.returns)} ₪, עלות המכר ${fmt(GP.cogs)} ₪. מהו הרווח הגולמי?`,
      grossProfit,
      [`מכירות נטו = ${fmt(GP.sales)} − ${fmt(GP.returns)} = ${fmt(netSales)} ₪.`, `רווח גולמי = מכירות נטו − עלות המכר = ${fmt(netSales)} − ${fmt(GP.cogs)} = ${fmt(grossProfit)} ₪.`],
    ),
    calc(
      "gp-pct",
      "שיעור רווח גולמי",
      `מכירות נטו ${fmt(netSales)} ₪, רווח גולמי ${fmt(grossProfit)} ₪. מהו שיעור הרווח הגולמי, באחוזים?`,
      gpPct,
      ["שיעור רווח גולמי = רווח גולמי ÷ מכירות נטו — על המכירות, לא על העלות.", `${fmt(grossProfit)} ÷ ${fmt(netSales)} = ${gpPct}%.`],
    ),
    choice(
      "opening-home",
      "מלאי פתיחה",
      "בשיטה תקופתית, באיזה דוח מופיע ״מלאי פתיחה״?",
      ["במאזן, כנכס", "ברווח או הפסד, בעלות המכר", "בשניהם", "באף אחד"],
      1,
      "מלאי הפתיחה הוא חלק מעלות המכר — חשבון תוצאתי בחובה, כמו הקניות.",
    ),
    choice(
      "no-entry",
      "בלי פקודת התאמה",
      "חברה שכחה לרשום את פקודת מלאי הסגירה. מה קרה לרווח שלה השנה?",
      ["הוא נמוך מדי — כל הקניות נרשמו כהוצאה", "הוא גבוה מדי", "הוא נכון, רק המאזן שגוי", "אין השפעה"],
      0,
      "בלי הפקודה, גם עלות הסחורה שעוד במחסן נשארה בהוצאות. עלות המכר גבוהה מדי — והרווח נמוך מדי.",
    ),
  ],
  traps: [
    {
      id: "purchases-not-cogs",
      prompt: "חנות קנתה השנה סחורה ב-100,000 ₪. אין לה מלאי פתיחה, ובסוף השנה נשארה סחורה בעלות 30,000 ₪. מהי עלות המכר?",
      options: ["70,000 ₪", "100,000 ₪", "130,000 ₪", "30,000 ₪"],
      answer: 0,
      why: "עלות המכר = 0 + 100,000 − 30,000 = 70,000. רק מה שנמכר הוא הוצאה; מה שנשאר על המדף הוא נכס.",
      traps: [
        "",
        "המלכודת: קניות ≠ עלות המכר. 30,000 ₪ עדיין על המדף — הם נכס, לא הוצאה.",
        "מלאי הסגירה מקטין את עלות המכר, לא מגדיל אותה.",
        "30,000 ₪ הם מה שנשאר — לא מה שנמכר.",
      ],
    },
    {
      id: "gp-on-cost",
      prompt: "מכירות נטו 200,000 ₪, עלות המכר 150,000 ₪. מהו שיעור הרווח הגולמי?",
      options: ["25%", "33.3%", "75%", "133.3%"],
      answer: 0,
      why: "רווח גולמי 50,000 ÷ מכירות נטו 200,000 = 25%.",
      traps: [
        "",
        "המלכודת: 50,000 ÷ 150,000 — חילוק בעלות המכר. שיעור הרווח הגולמי מחושב על המכירות.",
        "75% הם החלק של עלות המכר במכירות — לא הרווח.",
        "זה היחס בין המכירות לעלות המכר — לא שיעור רווח.",
      ],
    },
    {
      id: "closing-pl-account",
      prompt: "בשיטה תקופתית, איזה חשבון הוא ״מלאי סגירה רווח או הפסד״?",
      options: ["חשבון תוצאתי בזכות, שמקטין את עלות המכר", "נכס במאזן", "התחייבות", "חשבון תוצאתי בחובה, כמו הקניות"],
      answer: 0,
      why: "באותו סכום יש שני חשבונות: ״מלאי סגירה מאזני״ הוא הנכס, ו״מלאי סגירה רווח או הפסד״ מקטין את עלות המכר — ולכן יתרתו בזכות.",
      traps: [
        "",
        "הנכס הוא ״מלאי סגירה מאזני״ — אותו סכום, חשבון אחר.",
        "מלאי אינו חוב של העסק לאף אחד.",
        "בחובה יושבים מלאי הפתיחה והקניות. מלאי הסגירה מקטין את העלות — ולכן בזכות.",
      ],
    },
  ],
  tips: [
    "רק מה שנמכר הוא הוצאה של השנה. מה שעוד על המדף — נכס: מלאי.",
    "סוף השנה: סופרים, מעריכים בעלות, ורושמים ח׳ מלאי סגירה מאזני / ז׳ מלאי סגירה רווח או הפסד.",
    "מלאי הסגירה של שנה הוא מלאי הפתיחה של הבאה.",
    "עלות המכר = מלאי פתיחה + קניות נטו − מלאי סגירה. שיעור רווח גולמי = רווח גולמי ÷ מכירות נטו.",
  ],
};
