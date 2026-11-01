import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed here, from the question's own numbers.
const SL = { cost: 120_000, salvage: 20_000, life: 5 };
const slAnnual = (SL.cost - SL.salvage) / SL.life;
const SYD = { cost: 120_000, salvage: 20_000, life: 4 };
const sydDigits = (SYD.life * (SYD.life + 1)) / 2;
const syd2 = ((SYD.cost - SYD.salvage) * (SYD.life - 1)) / sydDigits;
const DB = { cost: 100_000, rate: 30 };
const db1 = (DB.cost * DB.rate) / 100;
const db2 = ((DB.cost - db1) * DB.rate) / 100;
export const MID = { cost: 60_000, life: 5, paid: "1.1.2025", ready: "1.4.2025", readyMonth: 4 };
export const midFirstYear = (MID.cost / MID.life) * ((13 - MID.readyMonth) / 12);
const UNITS = { cost: 50_000, salvage: 5_000, total: 90_000, made: 18_000 };
const unitsDep = ((UNITS.cost - UNITS.salvage) * UNITS.made) / UNITS.total;
const EST = { cost: 100_000, life: 10, years: 4, left: 3 };
const estCarrying = EST.cost - (EST.cost / EST.life) * EST.years;
const estNew = estCarrying / EST.left;

/** Lesson 2: the depreciation methods side by side, one exam question solved in nine steps, and the mistakes that cost the most points. */
export const DEPRECIATION: StudyModule = {
  slug: "ias16-depreciation",
  course: COURSE,
  n: 2,
  title: "שיטות הפחת ושאלה מלאה",
  description: "ארבע שיטות פחת על אותם נתונים, שאלה מלאה שנפתרת בתשעה שלבים קבועים, והטעויות שעולות הכי הרבה נקודות במבחן.",
  backHref: COURSE_HREF,
  screens: [
    { id: "depreciation", title: "שיטות הפחת — סימולטור" },
    { id: "method", title: "שאלה מלאה — תשעה שלבים לפתרון" },
    { id: "exam", title: "טיפים למבחן" },
  ],
  tools: [{ screen: "depreciation", label: "סימולטור הפחת" }],
  exercises: [
    journal(
      "dep-entry",
      "פקודת פחת",
      `מכונה בעלות ${fmt(SL.cost)} ₪, ערך גרט ${fmt(SL.salvage)} ₪, ${SL.life} שנות חיים, פחת בקו ישר. רשמו את פקודת הפחת בסוף השנה.`,
      [
        { account: "הוצאות פחת", dr: slAnnual },
        { account: "פחת נצבר", cr: slAnnual },
      ],
      `(${fmt(SL.cost)} − ${fmt(SL.salvage)}) ÷ ${SL.life} = ${fmt(slAnnual)} ₪. ההוצאה לרווח והפסד, ובזכות — הפחת הנצבר, שמקטין את הנכס במאזן.`,
      ["הוצאות פחת", "פחת נצבר", "מכונה", "מזומן"],
    ),
    calc(
      "syd-year2",
      "סכום ספרות השנים",
      `מכונה בעלות ${fmt(SYD.cost)} ₪, ערך גרט ${fmt(SYD.salvage)} ₪ ו-${SYD.life} שנות חיים, בשיטת סכום ספרות השנים (יורד). מה הפחת בשנה השנייה?`,
      syd2,
      [
        `סכום הספרות: 1 + 2 + 3 + 4 = ${sydDigits}.`,
        `בשנה השנייה המונה הוא ${SYD.life - 1}: (${fmt(SYD.cost)} − ${fmt(SYD.salvage)}) × ${SYD.life - 1}/${sydDigits} = ${fmt(syd2)} ₪.`,
      ],
    ),
    calc(
      "db-year2",
      "יתרה פוחתת",
      `מכונה בעלות ${fmt(DB.cost)} ₪, פחת ביתרה פוחתת בשיעור ${DB.rate}% לשנה. מה הפחת בשנה השנייה?`,
      db2,
      [
        `שנה ראשונה: ${fmt(DB.cost)} × ${DB.rate}% = ${fmt(db1)} ₪. ערך בספרים: ${fmt(DB.cost - db1)} ₪.`,
        `שנה שנייה: השיעור חל על הערך בספרים — ${fmt(DB.cost - db1)} × ${DB.rate}% = ${fmt(db2)} ₪.`,
      ],
    ),
    calc(
      "mid-year",
      "שנה ראשונה חלקית",
      `מכונה בעלות ${fmt(MID.cost)} ₪, בלי ערך גרט, ${MID.life} שנות חיים בקו ישר. היא שולמה ב-${MID.paid} והייתה מוכנה לשימוש ב-${MID.ready}. מה הפחת לשנת 2025?`,
      midFirstYear,
      [
        `פחת מתחיל מהיום שבו הנכס מוכן לשימוש — ${MID.ready}, לא מיום התשלום. מ-${MID.ready} עד סוף השנה: ${13 - MID.readyMonth} חודשים.`,
        `פחת שנתי: ${fmt(MID.cost)} ÷ ${MID.life} = ${fmt(MID.cost / MID.life)} ₪; לשנה הראשונה: ${fmt(MID.cost / MID.life)} × ${13 - MID.readyMonth}/12 = ${fmt(midFirstYear)} ₪.`,
      ],
    ),
    calc(
      "units",
      "פחת לפי יחידות תפוקה",
      `מכונה בעלות ${fmt(UNITS.cost)} ₪, ערך גרט ${fmt(UNITS.salvage)} ₪. לאורך חייה היא צפויה לייצר ${fmt(UNITS.total)} יחידות; השנה ייצרה ${fmt(UNITS.made)}. מה הפחת לשנה?`,
      unitsDep,
      [
        `סכום בר-פחת: ${fmt(UNITS.cost)} − ${fmt(UNITS.salvage)} = ${fmt(UNITS.cost - UNITS.salvage)} ₪.`,
        `חלק השנה מהתפוקה: ${fmt(UNITS.made)} מתוך ${fmt(UNITS.total)} — ${fmt(UNITS.cost - UNITS.salvage)} × ${fmt(UNITS.made)}/${fmt(UNITS.total)} = ${fmt(unitsDep)} ₪.`,
      ],
    ),
    calc(
      "estimate",
      "שינוי אומדן",
      `מכונה בעלות ${fmt(EST.cost)} ₪, בלי ערך גרט, ${EST.life} שנות חיים בקו ישר. אחרי ${EST.years} שנים הוערך שנותרו לה רק ${EST.left} שנים. מה הפחת השנתי מעכשיו?`,
      estNew,
      [
        `ערך בספרים היום: ${fmt(EST.cost)} − ${EST.years} × ${fmt(EST.cost / EST.life)} = ${fmt(estCarrying)} ₪.`,
        `שינוי אומדן — מכאן ולהבא, בלי לתקן אחורה: ${fmt(estCarrying)} ÷ ${EST.left} = ${fmt(estNew)} ₪ לשנה.`,
      ],
    ),
    choice("land", "קרקע", "חברה קנתה קרקע ועליה מבנה. מה מופחת?", ["רק המבנה", "הקרקע והמבנה יחד", "שניהם, כל אחד באורך חיים משלו"], 0, "לקרקע אין אורך חיים מוגבל, ולכן היא לא מופחתת. מפרידים את העלות ומפחיתים רק את המבנה."),
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
      id: "start-date",
      prompt: "מכונה שולמה ב-1.2, הותקנה והייתה מוכנה לשימוש ב-1.5, והחלה לייצר רק ב-1.7. ממתי מחשבים פחת?",
      options: ["מ-1.2, יום התשלום", "מ-1.5, היום שבו הייתה מוכנה לשימוש", "מ-1.7, היום שבו החלה לייצר"],
      answer: 1,
      why: "פחת מתחיל כשהנכס זמין לשימוש — במקומו ובמצב שבו הוא יכול לפעול — גם אם עוד לא התחילו להשתמש בו.",
      traps: ["יום התשלום לא קובע: המכונה עוד לא הייתה מותקנת ומוכנה.", "", "המלכודת: לא מחכים לשימוש בפועל. מוכנה לשימוש — מתחילים להפחית."],
    },
    {
      id: "idle",
      prompt: "בשנה מסוימת מכונה עמדה מושבתת שלושה חודשים, בהמתנה לחלקי חילוף. היא מופחתת בקו ישר. מה עושים עם הפחת של החודשים האלה?",
      options: ["ממשיכים להפחית כרגיל", "עוצרים את הפחת עד שהמכונה חוזרת לעבוד"],
      answer: 0,
      why: "פחת לא נעצר כשהנכס עומד. בקו ישר מפחיתים לפי הזמן, לא לפי השימוש.",
      traps: ["", "המלכודת: פחת בקו ישר לא תלוי בשימוש — הוא ממשיך גם כשהמכונה עומדת."],
    },
  ],
  tips: [
    "פחת מיום שהנכס מוכן לשימוש — לא מיום התשלום, ולא מיום השימוש בפועל.",
    "ביתרה פוחתת — לא מנכים גרט מהבסיס.",
    "נכס ל-5 שנים שנכנס באמצע שנה — פחת ב-6 שנות כספים.",
    "פחת לא נעצר כשהנכס עומד.",
    "שינוי אומדן — מכאן ולהבא: הערך בספרים חלקי יתרת אורך החיים.",
  ],
};
