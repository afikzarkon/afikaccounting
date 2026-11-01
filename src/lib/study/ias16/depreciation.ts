import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed from the question's own numbers,
// so the same questions also come with new numbers (variants/ias16.ts), for subscribers' review.

/** A straight-line asset, and its year-end depreciation entry. */
export type Straight = { cost: number; salvage: number; life: number };
export const depEntryQ = (S: Straight) => {
  const annual = (S.cost - S.salvage) / S.life;
  return journal(
    "dep-entry",
    "פקודת פחת",
    `מכונה בעלות ${fmt(S.cost)} ₪, ערך גרט ${fmt(S.salvage)} ₪, ${S.life} שנות חיים, פחת בקו ישר. רשמו את פקודת הפחת בסוף השנה.`,
    [
      { account: "הוצאות פחת", dr: annual },
      { account: "פחת נצבר", cr: annual },
    ],
    `(${fmt(S.cost)} − ${fmt(S.salvage)}) ÷ ${S.life} = ${fmt(annual)} ₪. ההוצאה לרווח והפסד, ובזכות — הפחת הנצבר, שמקטין את הנכס במאזן.`,
    ["הוצאות פחת", "פחת נצבר", "מכונה", "מזומן"],
  );
};

/** Sum of the years' digits, descending: the second year's charge. */
export const sydQ = (S: Straight) => {
  const digits = (S.life * (S.life + 1)) / 2;
  const charge = ((S.cost - S.salvage) * (S.life - 1)) / digits;
  return calc(
    "syd-year2",
    "סכום ספרות השנים",
    `מכונה בעלות ${fmt(S.cost)} ₪, ערך גרט ${fmt(S.salvage)} ₪ ו-${S.life} שנות חיים, בשיטת סכום ספרות השנים (יורד). מה הפחת בשנה השנייה?`,
    charge,
    [
      `סכום הספרות: ${Array.from({ length: S.life }, (_, i) => i + 1).join(" + ")} = ${digits}.`,
      `בשנה השנייה המונה הוא ${S.life - 1}: (${fmt(S.cost)} − ${fmt(S.salvage)}) × ${S.life - 1}/${digits} = ${fmt(charge)} ₪.`,
    ],
  );
};

/** Declining balance at a fixed rate: the second year's charge. */
export type Declining = { cost: number; rate: number };
export const dbQ = (D: Declining) => {
  const y1 = (D.cost * D.rate) / 100;
  const y2 = ((D.cost - y1) * D.rate) / 100;
  return calc(
    "db-year2",
    "יתרה פוחתת",
    `מכונה בעלות ${fmt(D.cost)} ₪, פחת ביתרה פוחתת בשיעור ${D.rate}% לשנה. מה הפחת בשנה השנייה?`,
    y2,
    [
      `שנה ראשונה: ${fmt(D.cost)} × ${D.rate}% = ${fmt(y1)} ₪. ערך בספרים: ${fmt(D.cost - y1)} ₪.`,
      `שנה שנייה: השיעור חל על הערך בספרים — ${fmt(D.cost - y1)} × ${D.rate}% = ${fmt(y2)} ₪.`,
    ],
  );
};

/** A first year that starts when the asset is ready for use, not when it was paid for. */
export type MidYear = { cost: number; life: number; readyMonth: number };
export const midYearQ = (M: MidYear) => {
  const months = 13 - M.readyMonth;
  const annual = M.cost / M.life;
  const charge = (annual * months) / 12;
  return calc(
    "mid-year",
    "שנה ראשונה חלקית",
    `מכונה בעלות ${fmt(M.cost)} ₪, בלי ערך גרט, ${M.life} שנות חיים בקו ישר. היא שולמה ב-1.1.2025 והייתה מוכנה לשימוש ב-1.${M.readyMonth}.2025. מה הפחת לשנת 2025?`,
    charge,
    [
      `פחת מתחיל מהיום שבו הנכס מוכן לשימוש — 1.${M.readyMonth}.2025, לא מיום התשלום. מאז ועד סוף השנה: ${months} חודשים.`,
      `פחת שנתי: ${fmt(M.cost)} ÷ ${M.life} = ${fmt(annual)} ₪; לשנה הראשונה: ${fmt(annual)} × ${months}/12 = ${fmt(charge)} ₪.`,
    ],
  );
};

/** Units of production. */
export type Units = { cost: number; salvage: number; total: number; made: number };
export const unitsQ = (U: Units) => {
  const charge = ((U.cost - U.salvage) * U.made) / U.total;
  return calc(
    "units",
    "פחת לפי יחידות תפוקה",
    `מכונה בעלות ${fmt(U.cost)} ₪, ערך גרט ${fmt(U.salvage)} ₪. לאורך חייה היא צפויה לייצר ${fmt(U.total)} יחידות; השנה ייצרה ${fmt(U.made)}. מה הפחת לשנה?`,
    charge,
    [
      `סכום בר-פחת: ${fmt(U.cost)} − ${fmt(U.salvage)} = ${fmt(U.cost - U.salvage)} ₪.`,
      `חלק השנה מהתפוקה: ${fmt(U.made)} מתוך ${fmt(U.total)} — ${fmt(U.cost - U.salvage)} × ${fmt(U.made)}/${fmt(U.total)} = ${fmt(charge)} ₪.`,
    ],
  );
};

/** A change in the estimate of useful life: from here on, never backwards. */
export type Estimate = { cost: number; life: number; years: number; left: number };
export const estimateQ = (E: Estimate) => {
  const carrying = E.cost - (E.cost / E.life) * E.years;
  const charge = carrying / E.left;
  return calc(
    "estimate",
    "שינוי אומדן",
    `מכונה בעלות ${fmt(E.cost)} ₪, בלי ערך גרט, ${E.life} שנות חיים בקו ישר. אחרי ${E.years} שנים הוערך שנותרו לה רק ${E.left} שנים. מה הפחת השנתי מעכשיו?`,
    charge,
    [
      `ערך בספרים היום: ${fmt(E.cost)} − ${E.years} × ${fmt(E.cost / E.life)} = ${fmt(carrying)} ₪.`,
      `שינוי אומדן — מכאן ולהבא, בלי לתקן אחורה: ${fmt(carrying)} ÷ ${E.left} = ${fmt(charge)} ₪ לשנה.`,
    ],
  );
};

export const MID: MidYear = { cost: 60_000, life: 5, readyMonth: 4 };

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
    depEntryQ({ cost: 120_000, salvage: 20_000, life: 5 }),
    sydQ({ cost: 120_000, salvage: 20_000, life: 4 }),
    dbQ({ cost: 100_000, rate: 30 }),
    midYearQ(MID),
    unitsQ({ cost: 50_000, salvage: 5_000, total: 90_000, made: 18_000 }),
    estimateQ({ cost: 100_000, life: 10, years: 4, left: 3 }),
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
