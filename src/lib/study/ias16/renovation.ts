import { calc, fmt, journal } from "./shared";

// Question builders for the course's lessons (lessons/). Every figure is computed from the question's own numbers,
// so the same questions also come with new numbers (variants/ias16.ts); ias16-lessons.test checks them against the course's renovation solver.

/** A straight-line building renovated part-way through a year. */
export type Reno = { cost: number; life: number; firstYear: number; year: number; month: number; renoCost: number; newLife: number };
export const RENO: Reno = { cost: 100_000, life: 10, firstYear: 2020, year: 2024, month: 7, renoCost: 25_000, newLife: 5 };

/** The figures of a renovation, as the questions work them out. */
export function renoFigures(R: Reno) {
  const annual = R.cost / R.life;
  const monthsBefore = R.month - 1;
  const beforePart = (annual * monthsBefore) / 12;
  const accumulated = annual * (R.year - R.firstYear) + beforePart;
  const carrying = R.cost - accumulated;
  const newAnnual = (carrying + R.renoCost) / R.newLife;
  const afterPart = (newAnnual * (12 - monthsBefore)) / 12;
  return { annual, monthsBefore, beforePart, accumulated, carrying, newAnnual, afterPart, yearCharge: beforePart + afterPart };
}

export function renovationQuestions(R: Reno) {
  const f = renoFigures(R);
  return {
    "reno-capitalise": journal(
      "reno-capitalise",
      "היוון שיפוץ",
      `החברה שילמה במזומן ${fmt(R.renoCost)} ₪ על שיפוץ מהותי של המבנה, שהאריך את חייו. רשמו את הפקודה.`,
      [
        { account: "מבנה", dr: R.renoCost },
        { account: "מזומן", cr: R.renoCost },
      ],
      "שיפוץ מהותי שמשפר את הנכס או מאריך את חייו מהוון: מוסיפים אותו לנכס, ומפחיתים אותו מיום השיפוץ ואילך.",
      ["מבנה", "מזומן", "הוצאות תיקונים ואחזקה", "פחת נצבר"],
    ),
    "reno-carrying": calc(
      "reno-carrying",
      "ערך בספרים ביום השיפוץ",
      `מבנה בעלות ${fmt(R.cost)} ₪, בלי ערך גרט, ${R.life} שנות חיים בקו ישר, זמין לשימוש מ-1.1.${R.firstYear}. ב-1.${R.month}.${R.year} שופץ. מה ערכו בספרים ביום השיפוץ, לפני הוספת השיפוץ?`,
      f.carrying,
      [
        `פחת שנתי: ${fmt(R.cost)} ÷ ${R.life} = ${fmt(f.annual)} ₪.`,
        `עד 1.1.${R.year}: ${R.year - R.firstYear} שנים = ${fmt(f.annual * (R.year - R.firstYear))} ₪; ועוד פחת יחסי עד יום השיפוץ: ${fmt(f.annual)} × ${f.monthsBefore}/12 = ${fmt(f.beforePart)} ₪.`,
        `ערך בספרים: ${fmt(R.cost)} − ${fmt(f.accumulated)} = ${fmt(f.carrying)} ₪.`,
      ],
    ),
    "reno-year": calc(
      "reno-year",
      "פחת בשנת השיפוץ",
      `מבנה מופחת בקו ישר ב-${fmt(f.annual)} ₪ לשנה. ב-1.${R.month}.${R.year}, כשערכו בספרים ${fmt(f.carrying)} ₪, שופץ בעלות ${fmt(R.renoCost)} ₪, ומיום השיפוץ נותרו לו ${R.newLife} שנים, בלי ערך גרט. מה הפחת לשנת ${R.year} כולה?`,
      f.yearCharge,
      [
        `לפני השיפוץ, ${f.monthsBefore} חודשים: ${fmt(f.beforePart)} ₪.`,
        `בסיס חדש: ${fmt(f.carrying)} + ${fmt(R.renoCost)} = ${fmt(f.carrying + R.renoCost)} ₪; פחת שנתי חדש: ÷ ${R.newLife} = ${fmt(f.newAnnual)} ₪.`,
        `אחרי השיפוץ, ${12 - f.monthsBefore} חודשים: ${fmt(f.newAnnual)} × ${12 - f.monthsBefore}/12 = ${fmt(f.afterPart)} ₪.`,
        `פחת השנה: ${fmt(f.beforePart)} + ${fmt(f.afterPart)} = ${fmt(f.yearCharge)} ₪.`,
      ],
    ),
  };
}

/** A component replaced in a renovation: what is left of it in the books is a loss. */
export type Roof = { cost: number; accumulated: number };
export const oldRoofQ = (F: Roof) =>
  calc(
    "old-roof",
    "גריעת רכיב שהוחלף",
    `בשיפוץ הוחלף גג המבנה. לגג הישן עלות של ${fmt(F.cost)} ₪ ופחת נצבר של ${fmt(F.accumulated)} ₪. כמה הפסד נרשם בגריעתו?`,
    F.cost - F.accumulated,
    [
      "רכיב שמוחלף יוצא מהספרים: גורעים את עלותו ואת הפחת שנצבר עליו.",
      `מה שנשאר ממנו בספרים — ${fmt(F.cost)} − ${fmt(F.accumulated)} = ${fmt(F.cost - F.accumulated)} ₪ — הוא הפסד.`,
    ],
  );
