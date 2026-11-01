import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed from the question's own numbers,
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

const Q = renovationQuestions(RENO);

/** Lesson 3: when a renovation joins the asset and when it is an expense, the five steps of every renovation question, worked examples and the calculator. */
export const RENOVATION: StudyModule = {
  slug: "ias16-renovation",
  course: COURSE,
  n: 3,
  title: "שיפוצים ואירועים עוקבים",
  description: "מתי שיפוץ נכנס לנכס ומתי הוא הוצאה, חמישה שלבים קבועים לפתרון, דוגמאות בכל שיטות הפחת — ומחשבון שמראה את הפחת לפני השיפוץ ואחריו.",
  backHref: COURSE_HREF,
  screens: [
    { id: "renovation-distinction", title: "נכנס לנכס או הוצאה" },
    { id: "renovation-steps", title: "שלבי הפתרון" },
    { id: "renovation-examples", title: "דוגמאות לפי שיטות הפחת" },
    { id: "renovation-calculator", title: "מחשבון שיפוץ" },
    { id: "renovation-tips", title: "דגשים למבחן" },
  ],
  tools: [{ screen: "renovation-calculator", label: "מחשבון שיפוץ" }],
  exercises: [
    choice(
      "painting",
      "תחזוקה או שיפוץ",
      "חברה צבעה את כל המשרדים ב-60,000 ₪ — צביעה תקופתית רגילה, שחוזרת כל כמה שנים. מה הטיפול?",
      ["הוצאה של התקופה", "מוסיפים לעלות המבנה"],
      0,
      "תחזוקה שוטפת שומרת על הנכס במצבו — היא הוצאה, גם כשהסכום גדול.",
    ),
    Q["reno-capitalise"],
    Q["reno-carrying"],
    Q["reno-year"],
    oldRoofQ({ cost: 40_000, accumulated: 30_000 }),
  ],
  traps: [
    {
      id: "reno-base",
      prompt: "מבנה: עלות 100,000 ₪, פחת נצבר עד יום השיפוץ 40,000 ₪. השיפוץ עלה 20,000 ₪, ומיומו נותרו 4 שנות חיים, בלי ערך גרט. מה הפחת השנתי מיום השיפוץ?",
      options: ["20,000 ₪", "30,000 ₪", "5,000 ₪"],
      answer: 0,
      why: "הבסיס החדש הוא הערך בספרים ועוד השיפוץ: 60,000 + 20,000 = 80,000 ₪, חלקי 4 שנים = 20,000 ₪.",
      traps: ["", "המלכודת: מהעלות המקורית (100,000 + 20,000) ÷ 4. הבסיס החדש הוא הערך בספרים — לא העלות.", "זה הפחת של השיפוץ לבדו. מפחיתים את כל הנכס, מהערך בספרים שלו ועוד השיפוץ."],
    },
    {
      id: "reno-partial",
      prompt: "שיפוץ ב-1.10. מה הפחת של השנה?",
      options: ["9 חודשים לפי הפחת הישן, ועוד 3 חודשים לפי הפחת החדש", "12 חודשים לפי הפחת החדש", "12 חודשים לפי הפחת הישן — השיפוץ ייכנס לפחת רק בשנה הבאה"],
      answer: 0,
      why: "שנת השיפוץ בנויה משני חלקים: עד יום השיפוץ — הפחת הישן; ממנו — פחת חדש על הבסיס החדש.",
      traps: ["", "המלכודת: לא שוכחים את הפחת היחסי עד יום השיפוץ.", "השיפוץ מופחת מיום שבוצע, לא משנה הבאה."],
    },
  ],
  tips: [
    "לא שוכחים פחת יחסי עד יום השיפוץ.",
    "שנת שיפוץ באמצע השנה בנויה משני חלקים: לפני ואחרי.",
    "הבסיס החדש הוא הערך בספרים ועוד השיפוץ — לא העלות המקורית.",
    "רכיב שמוחלף — גורעים את הישן.",
    "תחזוקה שוטפת — הוצאה, גם כשהסכום גדול.",
  ],
};
