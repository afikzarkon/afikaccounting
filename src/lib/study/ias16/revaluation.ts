import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed here, from the question's own numbers;
// ias16-lessons.test checks them against the course's revaluation solver.
export const REVAL = { cost: 100_000, life: 10, firstYear: 2023, year: 2025, fairValue: 96_000 };
const annual = REVAL.cost / REVAL.life;
const accumulated = annual * (REVAL.year - REVAL.firstYear);
export const revalBefore = REVAL.cost - accumulated;
export const revalSurplus = REVAL.fairValue - revalBefore;
const yearsLeft = REVAL.life - (REVAL.year - REVAL.firstYear);
export const revalNewAnnual = REVAL.fairValue / yearsLeft;
export const revalTransfer = revalNewAnnual - annual;
const DROP = { surplus: 16_000, decrease: 20_000 };

/** Lesson 5: the revaluation model — depreciation up to the revaluation, the gap to fair value and where it goes, land against buildings, and the checks that catch almost every mistake. */
export const REVALUATION: StudyModule = {
  slug: "ias16-revaluation",
  course: COURSE,
  n: 5,
  title: "מודל הערכה מחדש",
  description: "פחת עד יום ההערכה, פער לשווי ההוגן וסיווגו — קרן הערכה מחדש או רווח והפסד. ואחר כך: קרקע מול מבנה, העברה לעודפים, דוגמאות, טיפ בדיקה — ומחשבון.",
  backHref: COURSE_HREF,
  screens: [
    { id: "revaluation-standard", title: "מה התקן אומר" },
    { id: "revaluation-steps", title: "דרכים לפתור שאלה" },
    { id: "revaluation-land-building", title: "קרקע מול מבנה" },
    { id: "revaluation-examples", title: "דוגמאות לפי שיטות הפחת" },
    { id: "revaluation-yearly", title: "דוגמה: הערכה בכל שנה" },
    { id: "revaluation-check", title: "בדיקה ודגשים" },
    { id: "revaluation-calculator", title: "מחשבון הערכה מחדש" },
  ],
  tools: [{ screen: "revaluation-calculator", label: "מחשבון הערכה מחדש" }],
  exercises: [
    calc(
      "reval-gap",
      "פער ההערכה מחדש",
      `מבנה בעלות ${fmt(REVAL.cost)} ₪, בלי ערך גרט, ${REVAL.life} שנות חיים בקו ישר, זמין לשימוש מ-1.1.${REVAL.firstYear}. ב-1.1.${REVAL.year} הוערך מחדש לשווי הוגן של ${fmt(REVAL.fairValue)} ₪. כמה נרשם בקרן ההערכה מחדש?`,
      revalSurplus,
      [
        `ערך בספרים ביום ההערכה: ${fmt(REVAL.cost)} − ${REVAL.year - REVAL.firstYear} × ${fmt(annual)} = ${fmt(revalBefore)} ₪.`,
        `פער: ${fmt(REVAL.fairValue)} − ${fmt(revalBefore)} = ${fmt(revalSurplus)} ₪. עלייה ראשונה — לקרן ההערכה מחדש (רווח כולל אחר).`,
      ],
    ),
    journal(
      "reval-entry",
      "פקודת ההערכה מחדש",
      `אותו מבנה (עלות ${fmt(REVAL.cost)} ₪, פחת נצבר ${fmt(accumulated)} ₪) הוערך מחדש ל-${fmt(REVAL.fairValue)} ₪. רשמו את הפקודה בשיטת הביטול.`,
      [
        { account: "פחת נצבר", dr: accumulated },
        { account: "מבנה", cr: accumulated - revalSurplus },
        { account: "קרן הערכה מחדש", cr: revalSurplus },
      ],
      `בשיטת הביטול סוגרים את הפחת הנצבר מול הנכס (${fmt(accumulated)} ₪), ומעלים את הנכס לשווי ההוגן (${fmt(revalSurplus)} ₪) מול הקרן. נטו: המבנה יורד ב-${fmt(accumulated - revalSurplus)} ₪, מ-${fmt(REVAL.cost)} ל-${fmt(REVAL.fairValue)} ₪.`,
      ["פחת נצבר", "מבנה", "קרן הערכה מחדש", "רווח מהערכה מחדש", "עודפים"],
    ),
    calc(
      "reval-new-dep",
      "פחת חדש מיום ההערכה",
      `אותו מבנה, מוערך עכשיו ב-${fmt(REVAL.fairValue)} ₪, ונותרו לו ${yearsLeft} שנות חיים. מה הפחת השנתי מעכשיו?`,
      revalNewAnnual,
      [`מפחיתים את השווי ההוגן על יתרת אורך החיים: ${fmt(REVAL.fairValue)} ÷ ${yearsLeft} = ${fmt(revalNewAnnual)} ₪.`],
    ),
    calc(
      "reval-transfer",
      "העברה לעודפים",
      `אותו מבנה: הפחת אחרי ההערכה ${fmt(revalNewAnnual)} ₪ לשנה, ולפי העלות המקורית היה ${fmt(annual)} ₪. החברה מעבירה את הקרן לעודפים לפי הפחת. כמה מעבירים בכל שנה?`,
      revalTransfer,
      [
        `מעבירים את הפרש הפחת — מה שנובע מההערכה: ${fmt(revalNewAnnual)} − ${fmt(annual)} = ${fmt(revalTransfer)} ₪.`,
        `בדיקה: ${fmt(revalSurplus)} ₪ בקרן ÷ ${yearsLeft} שנים = ${fmt(revalSurplus / yearsLeft)} ₪ — ובסוף החיים הקרן מתאפסת.`,
      ],
    ),
    calc(
      "reval-drop",
      "ירידה אחרי עלייה",
      `לנכס יתרה של ${fmt(DROP.surplus)} ₪ בקרן ההערכה מחדש. בהערכה הבאה ערכו ירד ב-${fmt(DROP.decrease)} ₪. כמה נרשם ברווח והפסד?`,
      DROP.decrease - DROP.surplus,
      [
        `ירידה מקטינה קודם את הקרן של אותו נכס, עד שהיא מתאפסת: ${fmt(DROP.surplus)} ₪.`,
        `השאר — ${fmt(DROP.decrease)} − ${fmt(DROP.surplus)} = ${fmt(DROP.decrease - DROP.surplus)} ₪ — הפסד ברווח והפסד.`,
      ],
    ),
    choice(
      "first-drop",
      "ירידה ראשונה",
      "נכס הוערך מחדש לראשונה, וערכו ירד. לאן נרשמת הירידה?",
      ["לרווח והפסד", "לקרן הערכה מחדש, ביתרה בחובה", "ישירות לעודפים"],
      0,
      "אין קרן לנכס הזה שאפשר להקטין — הירידה כולה הפסד ברווח והפסד.",
    ),
  ],
  traps: [
    {
      id: "land-sale",
      prompt: "קרקע שבקרן ההערכה מחדש שלה 30,000 ₪ נמכרה. מה קורה ליתרת הקרן?",
      options: ["עוברת ישירות לעודפים", "נרשמת כרווח ממכירת הקרקע ברווח והפסד", "נשארת בקרן"],
      answer: 0,
      why: "הקרן עוברת לעודפים ישירות, בלי לעבור דרך רווח והפסד. הרווח מהמכירה נמדד מול הערך בספרים — השווי שכבר הוערך.",
      traps: ["", "המלכודת: הקרן לא עוברת דרך רווח והפסד — לא במכירה ולא בשום שלב.", "כשהנכס יוצא מהספרים, גם הקרן שלו לא נשארת: היא עוברת לעודפים."],
    },
    {
      id: "group",
      prompt: "לחברה חמישה מבנים, ושניים מהם עלו בערכם. האם אפשר להעריך מחדש רק את השניים?",
      options: ["לא — מעריכים מחדש את כל קבוצת הנכסים", "כן — רק את מה שעלה"],
      answer: 0,
      why: "עקרון הקבוצה: מי שבוחר במודל הערכה מחדש מיישם אותו על כל הקבוצה — כאן, כל המבנים.",
      traps: ["", "המלכודת: בחירה נקודתית של מה שעלה בערכו הייתה מאפשרת לייפות את הדוחות — ולכן התקן מחייב את כל הקבוצה."],
    },
  ],
  tips: [
    "מעדכנים פחת עד יום ההערכה — ורק אז משווים לשווי ההוגן.",
    "עלייה — לקרן הערכה מחדש; אבל אם הייתה קודם ירידה לרווח והפסד, קודם מבטלים אותה ברווח והפסד.",
    "ירידה — קודם מקטינה את הקרן של אותו נכס, והשאר לרווח והפסד.",
    "הקרן עוברת לעודפים — אף פעם לא דרך רווח והפסד.",
    "עקרון הקבוצה: מעריכים מחדש את כל קבוצת הנכסים, לא נכס בודד.",
  ],
};
