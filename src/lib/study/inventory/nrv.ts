import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const DOWN = { qty: 400, cost: 25, nrv: 21 };
const downAmount = DOWN.qty * (DOWN.cost - DOWN.nrv);
const NRV = { price: 60, complete: 8, sell: 4, cost: 50 };
const nrvUnit = NRV.price - NRV.complete - NRV.sell;
const REVERSE = { qty: 300, cost: 50, written: 40, nrv: 58 };
const reversal = REVERSE.qty * (Math.min(REVERSE.cost, REVERSE.nrv) - REVERSE.written);
const PERPETUAL = { cost: 30_000, nrv: 26_000 };
const PERIODIC = { cost: 50_000, nrv: 46_000 };
/** The fair-value screen's table: what a question gives, and the one figure that is a distractor. */
export const FV_TABLE = { qty: 1_000, cost: 45, price: 47, fairValue: 44, selling: 5 };
export const FV_NRV = FV_TABLE.price - FV_TABLE.selling;
const SHEET = { cost: 700_000, nrv: 660_000 };

/** Lesson 8: measurement at the lower of cost and net realisable value — the write-down, NRV against fair value, its reversal, the statements, and the theory questions around it. */
export const NRV_LESSON: StudyModule = {
  slug: "inventory-nrv",
  course: COURSE,
  n: 8,
  title: "שווי מימוש נטו",
  description: "הנמוך מבין העלות לשווי מימוש נטו: הורדת ערך, שווי מימוש נטו מול שווי הוגן, ביטול בשנה הבאה, איך זה נראה בדוחות — ושאלות התיאוריה שסביבו.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-nrv", title: "הנמוך מבין העלות לשווי מימוש נטו" },
    { id: "iv-nrv-fv", title: "שווי מימוש נטו אינו שווי הוגן" },
    { id: "inv-nrv-reverse", title: "שנה אחרי: ביטול הורדת הערך" },
    { id: "iv-nrv-sheet", title: "הורדת ערך בדוחות ובשנה הבאה" },
    { id: "iv-nrv-theory", title: "שאלות תיאוריה: מחירים, חומרי גלם ותקורות" },
  ],
  exercises: [
    journal(
      "writedown-perpetual",
      "הורדת ערך בשיטה תמידית",
      `החברה מנהלת מלאי בשיטה תמידית. ב-31.12 עלות המלאי ${fmt(PERPETUAL.cost)} ₪, ושווי המימוש נטו שלו ${fmt(PERPETUAL.nrv)} ₪. רשמו את הפקודה.`,
      [
        { account: "עלות המכר", dr: PERPETUAL.cost - PERPETUAL.nrv },
        { account: "מלאי", cr: PERPETUAL.cost - PERPETUAL.nrv },
      ],
      `מורידים את המלאי לנמוך מבין השניים: ${fmt(PERPETUAL.cost)} − ${fmt(PERPETUAL.nrv)} = ${fmt(PERPETUAL.cost - PERPETUAL.nrv)}. ההורדה נכנסת לעלות המכר — לא להוצאות אחרות.`,
      ["עלות המכר", "מלאי", "הוצאות אחרות", "קניות"],
    ),
    journal(
      "closing-at-nrv",
      "מלאי סגירה בשיטה תקופתית",
      `החברה מנהלת מלאי בשיטה תקופתית. בספירה ב-31.12: עלות המלאי ${fmt(PERIODIC.cost)} ₪, ושווי המימוש נטו שלו ${fmt(PERIODIC.nrv)} ₪. רשמו את מלאי הסגירה.`,
      [
        { account: "מלאי סגירה מאזני", dr: PERIODIC.nrv },
        { account: "מלאי סגירה רווח או הפסד", cr: PERIODIC.nrv },
      ],
      `בשיטה תקופתית ההורדה ״מגולמת״: רושמים את מלאי הסגירה ישר בנמוך — ${fmt(PERIODIC.nrv)}. מלאי סגירה קטן יותר פירושו עלות מכר גדולה יותר.`,
      ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "עלות המכר", "קניות"],
    ),
    calc("writedown", "הורדת ערך", `במלאי הסגירה ${DOWN.qty} יחידות בעלות ${DOWN.cost} ₪ ליחידה. שווי המימוש נטו ליחידה: ${DOWN.nrv} ₪. בכמה מורידים את ערך המלאי?`, downAmount, [
      `השווי נמוך מהעלות ב-${DOWN.cost - DOWN.nrv} ₪ ליחידה.`,
      `${DOWN.qty} × ${DOWN.cost - DOWN.nrv} = ${fmt(downAmount)} ₪ — לעלות המכר.`,
    ]),
    calc(
      "nrv-unit",
      "שווי מימוש נטו",
      `מחיר המכירה הצפוי ${NRV.price} ₪ ליחידה; עלויות השלמה ${NRV.complete} ₪ ועלויות מכירה ${NRV.sell} ₪ ליחידה. עלות היחידה ${NRV.cost} ₪. באיזה ערך ליחידה יוצג המלאי?`,
      Math.min(NRV.cost, nrvUnit),
      [`שווי מימוש נטו = ${NRV.price} − ${NRV.complete} − ${NRV.sell} = ${nrvUnit} ₪.`, `הנמוך מבין העלות (${NRV.cost}) לשווי (${nrvUnit}): ${Math.min(NRV.cost, nrvUnit)} ₪.`],
    ),
    calc(
      "nrv-table",
      "מתוך טבלה",
      `במלאי ${fmt(FV_TABLE.qty)} יח׳ בעלות ${FV_TABLE.cost} ₪. ליום הדוח: מחיר מכירה ${FV_TABLE.price} ₪, שווי הוגן ${FV_TABLE.fairValue} ₪, עלויות מכירה ${FV_TABLE.selling} ₪ ליחידה. באיזה סכום יוצג המלאי?`,
      FV_TABLE.qty * Math.min(FV_TABLE.cost, FV_NRV),
      [
        `שווי מימוש נטו = מחיר מכירה − עלויות מכירה = ${FV_TABLE.price} − ${FV_TABLE.selling} = ${FV_NRV} ₪. השווי ההוגן אינו בחישוב.`,
        `הנמוך מבין ${FV_TABLE.cost} ל-${FV_NRV}: ${Math.min(FV_TABLE.cost, FV_NRV)} ₪ × ${fmt(FV_TABLE.qty)} = ${fmt(FV_TABLE.qty * Math.min(FV_TABLE.cost, FV_NRV))} ₪.`,
      ],
    ),
    calc(
      "reversal",
      "ביטול הורדת ערך",
      `בשנה שעברה הורד ערכן של ${REVERSE.qty} יחידות מעלות ${REVERSE.cost} ₪ ל-${REVERSE.written} ₪. השנה הן עדיין במלאי, ושווי המימוש נטו עלה ל-${REVERSE.nrv} ₪. בכמה מבטלים?`,
      reversal,
      [
        `הערך החדש: הנמוך מבין העלות (${REVERSE.cost}) לשווי (${REVERSE.nrv}) — ${Math.min(REVERSE.cost, REVERSE.nrv)} ₪. לא עולים מעל העלות.`,
        `ביטול: ${REVERSE.qty} × (${Math.min(REVERSE.cost, REVERSE.nrv)} − ${REVERSE.written}) = ${fmt(reversal)} ₪ — מקטין את עלות המכר.`,
      ],
    ),
    calc(
      "worksheet-nrv",
      "מלאי בשאלת הצגת דוחות",
      `בשאלת הצגת דוחות נתון: עלות מלאי הסגירה ${fmt(SHEET.cost)} ₪, ושווי המימוש נטו שלו ${fmt(SHEET.nrv)} ₪. באיזה סכום יוצג המלאי בדוח על המצב הכספי?`,
      SHEET.nrv,
      [`הנמוך מבין העלות לשווי מימוש נטו: ${fmt(SHEET.nrv)} ₪.`, `ההפרש, ${fmt(SHEET.cost - SHEET.nrv)} ₪, מוסף לעלות המכר.`],
    ),
    choice("lower", "הנמוך מבין", "עלות המלאי 5,000 ₪, ושווי המימוש נטו שלו 5,600 ₪. באיזה סכום יוצג המלאי?", ["5,000 ₪", "5,600 ₪", "600 ₪", "5,300 ₪"], 0, "הנמוך מביניהם. רווח צפוי לא נרשם — הוא יוכר כשהמלאי יימכר."),
    choice(
      "next-opening",
      "השנה הבאה",
      "בשנה שעברה הורד ערך המלאי מ-80,000 ₪ ל-72,000 ₪. מהו מלאי הפתיחה השנה?",
      ["72,000 ₪", "80,000 ₪", "8,000 ₪", "76,000 ₪"],
      0,
      "מלאי הפתיחה הוא הסגירה כפי שהוצגה — בערך בספרים, אחרי ההורדה.",
    ),
    choice(
      "price-rise",
      "תיאוריה",
      "מחיר המכירה של מוצר עלה ב-20% בסוף השנה. מה קורה לערך המלאי שלו בספרים?",
      ["כלום — מלאי לא עולה מעל העלות", "עולה ב-20%", "עולה עד שווי המימוש נטו", "יורד"],
      0,
      "רווח צפוי לא נרשם: המלאי נשאר בעלות, והרווח יוכר כשיימכר.",
    ),
    choice(
      "raw-materials",
      "חריג",
      "מחיר חומר גלם בשוק ירד מתחת לעלותו, אבל המוצר הגמור שייוצר ממנו צפוי להימכר ברווח. מורידים את ערך חומר הגלם?",
      ["לא — זה החריג לחומרי גלם", "כן — הנמוך מבין, תמיד", "כן, בחצי", "רק בשיטת FIFO"],
      0,
      "חומרי גלם לא מורידים מתחת לעלות כל עוד המוצרים הגמורים שבהם ייכללו צפויים להימכר בעלות או מעליה.",
    ),
    choice(
      "fixed-overhead",
      "תיאוריה: תקורות",
      "מפעל ייצר השנה הרבה פחות מהרגיל. מה קורה לתקורות הייצור הקבועות?",
      ["מעמיסים לפי ייצור רגיל, והשאר — הוצאה של התקופה", "מעמיסים את כולן על מה שיוצר", "כולן הוצאה", "מעבירים לשנה הבאה"],
      0,
      "IAS 2.13: תקורה קבועה מוקצית לפי רמת ייצור רגילה. מה שלא הוקצה הוא הוצאה — כך יחידה לא מתייקרת רק כי ייצרו מעט.",
    ),
  ],
  traps: [
    {
      id: "fair-value",
      prompt: "עלות היחידה 100 ₪; השווי ההוגן (מחיר בשוק) 90 ₪; שווי המימוש נטו של החברה 105 ₪. באיזה ערך ליחידה יוצג המלאי?",
      options: ["100 ₪", "90 ₪", "105 ₪", "95 ₪"],
      answer: 0,
      why: "משווים את העלות לשווי המימוש נטו של החברה: הנמוך מבין 100 ל-105 — 100 ₪. השווי ההוגן הוא מסיח.",
      traps: ["", "המלכודת: שווי הוגן ≠ שווי מימוש נטו. משווים לעלות רק את מה שהחברה צפויה לקבל, נטו.", "לא עולים מעל העלות — רווח צפוי לא נרשם.", "אין ממוצעים כאן: לוקחים את הנמוך מבין שני מספרים."],
    },
    {
      id: "reversal-cap",
      prompt: "בשנה שעברה הורד ערך המלאי ב-300 ₪. השנה שווי המימוש נטו עלה ב-500 ₪ מעל הערך בספרים. בכמה מבטלים?",
      options: ["300 ₪", "500 ₪", "0", "200 ₪"],
      answer: 0,
      why: "הביטול חסום בגובה ההורדה המקורית — המלאי חוזר לכל היותר לעלות.",
      traps: ["", "המלכודת: ביטול של 500 מעלה את המלאי 200 ₪ מעל העלות. רווח צפוי לא נרשם.", "מבטלים: כששווי המימוש נטו עולה, ההורדה מתבטלת — עד העלות.", "אין סיבה להפרש: הביטול מחזיר את כל ההורדה, כי השווי עלה מעל העלות."],
    },
    {
      id: "writedown-line",
      prompt: "איפה מוצגת הורדת ערך של מלאי לשווי מימוש נטו?",
      options: ["בעלות המכר", "בהוצאות אחרות", "בהוצאות מכירה", "ישירות בהון"],
      answer: 0,
      why: "ההורדה מגדילה את עלות המכר ומקטינה את הרווח הגולמי — בתקופה שבה היא קרתה.",
      traps: ["", "המלכודת: ״הוצאה אחרת״ נשמע הגיוני — אבל המלאי נמדד מחדש, וההפרש שייך לעלות המכר.", "זו לא עלות של מכירה — זו מדידה של המלאי.", "ההורדה עוברת ברווח או הפסד, לא ישירות להון."],
    },
  ],
  tips: [
    "מלאי נמדד לפי הנמוך מבין העלות לשווי מימוש נטו: הפסד צפוי — מיד; רווח צפוי — רק במכירה.",
    "שווי מימוש נטו = מחיר מכירה צפוי − עלויות השלמה − עלויות מכירה. לא שווי הוגן.",
    "הורדת הערך — לעלות המכר. ביטול — רק עד העלות המקורית. מלאי הפתיחה של השנה הבאה — בערך אחרי ההורדה.",
    "חריג: חומרי גלם לא מורידים אם המוצר הגמור יימכר ברווח. ותקורה קבועה — לפי ייצור רגיל.",
  ],
};
