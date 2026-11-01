import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed here, from the question's own numbers;
// ias16-lessons.test checks the mid-year one against the course's renovation solver.
export const RENO = { cost: 100_000, life: 10, firstYear: 2020, year: 2024, month: 7, renoCost: 25_000, newLife: 5 };
const annual = RENO.cost / RENO.life;
const monthsBefore = RENO.month - 1;
const beforePart = (annual * monthsBefore) / 12;
const accumulatedAtReno = annual * (RENO.year - RENO.firstYear) + beforePart;
const carryingAtReno = RENO.cost - accumulatedAtReno;
const newAnnual = (carryingAtReno + RENO.renoCost) / RENO.newLife;
const afterPart = (newAnnual * (12 - monthsBefore)) / 12;
export const renoYearCharge = beforePart + afterPart;
const ROOF = { cost: 40_000, accumulated: 30_000 };

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
    journal(
      "reno-capitalise",
      "היוון שיפוץ",
      `החברה שילמה במזומן ${fmt(RENO.renoCost)} ₪ על שיפוץ מהותי של המבנה, שהאריך את חייו. רשמו את הפקודה.`,
      [
        { account: "מבנה", dr: RENO.renoCost },
        { account: "מזומן", cr: RENO.renoCost },
      ],
      "שיפוץ מהותי שמשפר את הנכס או מאריך את חייו מהוון: מוסיפים אותו לנכס, ומפחיתים אותו מיום השיפוץ ואילך.",
      ["מבנה", "מזומן", "הוצאות תיקונים ואחזקה", "פחת נצבר"],
    ),
    calc(
      "reno-carrying",
      "ערך בספרים ביום השיפוץ",
      `מבנה בעלות ${fmt(RENO.cost)} ₪, בלי ערך גרט, ${RENO.life} שנות חיים בקו ישר, זמין לשימוש מ-1.1.${RENO.firstYear}. ב-1.${RENO.month}.${RENO.year} שופץ. מה ערכו בספרים ביום השיפוץ, לפני הוספת השיפוץ?`,
      carryingAtReno,
      [
        `פחת שנתי: ${fmt(RENO.cost)} ÷ ${RENO.life} = ${fmt(annual)} ₪.`,
        `עד 1.1.${RENO.year}: ${RENO.year - RENO.firstYear} שנים = ${fmt(annual * (RENO.year - RENO.firstYear))} ₪; ועוד פחת יחסי עד יום השיפוץ: ${fmt(annual)} × ${monthsBefore}/12 = ${fmt(beforePart)} ₪.`,
        `ערך בספרים: ${fmt(RENO.cost)} − ${fmt(accumulatedAtReno)} = ${fmt(carryingAtReno)} ₪.`,
      ],
    ),
    calc(
      "reno-year",
      "פחת בשנת השיפוץ",
      `אותו מבנה (ערך בספרים ${fmt(carryingAtReno)} ₪ ביום השיפוץ). השיפוץ עלה ${fmt(RENO.renoCost)} ₪, ומיום השיפוץ נותרו למבנה ${RENO.newLife} שנים, בקו ישר. מה הפחת לשנת ${RENO.year} כולה?`,
      renoYearCharge,
      [
        `לפני השיפוץ, ${monthsBefore} חודשים: ${fmt(beforePart)} ₪.`,
        `בסיס חדש: ${fmt(carryingAtReno)} + ${fmt(RENO.renoCost)} = ${fmt(carryingAtReno + RENO.renoCost)} ₪; פחת שנתי חדש: ÷ ${RENO.newLife} = ${fmt(newAnnual)} ₪.`,
        `אחרי השיפוץ, ${12 - monthsBefore} חודשים: ${fmt(newAnnual)} × ${12 - monthsBefore}/12 = ${fmt(afterPart)} ₪.`,
        `פחת השנה: ${fmt(beforePart)} + ${fmt(afterPart)} = ${fmt(renoYearCharge)} ₪.`,
      ],
    ),
    calc(
      "old-roof",
      "גריעת רכיב שהוחלף",
      `בשיפוץ הוחלף גג המבנה. לגג הישן עלות של ${fmt(ROOF.cost)} ₪ ופחת נצבר של ${fmt(ROOF.accumulated)} ₪. כמה הפסד נרשם בגריעתו?`,
      ROOF.cost - ROOF.accumulated,
      [
        "רכיב שמוחלף יוצא מהספרים: גורעים את עלותו ואת הפחת שנצבר עליו.",
        `מה שנשאר ממנו בספרים — ${fmt(ROOF.cost)} − ${fmt(ROOF.accumulated)} = ${fmt(ROOF.cost - ROOF.accumulated)} ₪ — הוא הפסד.`,
      ],
    ),
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
