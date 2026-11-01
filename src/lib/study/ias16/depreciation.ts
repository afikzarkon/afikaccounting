import { calc, fmt, journal } from "./shared";

// Question builders for the course's lessons (lessons/). Every figure is computed from the question's own numbers,
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
