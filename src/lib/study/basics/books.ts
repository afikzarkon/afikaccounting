import { round2 } from "@/lib/learn/basics";
import type { StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt, practice } from "./shared";

// Fresh figures for this lesson's own questions; every answer below is computed from them.
const SUPPLIERS = { opening: 20_000, purchases: 35_000, paid: 41_000 };
const suppliersClose = SUPPLIERS.opening + SUPPLIERS.purchases - SUPPLIERS.paid;
const RET = { opening: 40_000, profit: 25_000, dividend: 10_000 };
const YEAR = { income: 300_000, expenses: 260_000 };
const yearProfit = round2(YEAR.income - YEAR.expenses);

/** Lesson 3: from T-accounts to the statements — the trial balance, retained earnings, and closing the year. */
export const BOOKS: StudyModule = {
  slug: "basics-books",
  course: COURSE,
  n: 3,
  title: "מכרטיסי T ועד הדוחות",
  description: "כרטיסי T ויתרות, מאזן בוחן, עודפים, ופקודת הסגירה שמעבירה את הרווח לעודפים ומאפסת את התוצאתי.",
  backHref: COURSE_HREF,
  screens: [
    { id: "taccounts", title: "סוגרים כרטיס T: יתרת סגירה" },
    { id: "trial", title: "מאזן בוחן" },
    { id: "retained", title: "עודפים" },
    { id: "reports", title: "מהיתרות לדוחות" },
    { id: "closing", title: "פקודת הסגירה: הרווח עובר לעודפים" },
    { id: "carry", title: "מעבר משנה לשנה" },
  ],
  exercises: [
    practice("q10"),
    {
      kind: "choice",
      id: "suppliers-card",
      skill: "כרטיס T",
      prompt: `בכרטיס ספקים: יתרת פתיחה ${fmt(SUPPLIERS.opening)} בזכות, קניות באשראי ${fmt(SUPPLIERS.purchases)}, ותשלומים לספקים ${fmt(SUPPLIERS.paid)}. מהי יתרת הסגירה?`,
      options: [`${fmt(suppliersClose)} בזכות`, `${fmt(suppliersClose)} בחובה`, `${fmt(SUPPLIERS.paid - SUPPLIERS.purchases)} בחובה`, `${fmt(SUPPLIERS.opening + SUPPLIERS.purchases + SUPPLIERS.paid)} בזכות`],
      answer: 0,
      steps: [
        `סך הזכות (החוב גדל): פתיחה ${fmt(SUPPLIERS.opening)} + קניות באשראי ${fmt(SUPPLIERS.purchases)} = ${fmt(SUPPLIERS.opening + SUPPLIERS.purchases)}.`,
        `סך החובה (החוב קטן): תשלומים ${fmt(SUPPLIERS.paid)}.`,
        `הזכות גדולה יותר, ולכן היתרה בזכות: ${fmt(SUPPLIERS.opening + SUPPLIERS.purchases)} − ${fmt(SUPPLIERS.paid)} = ${fmt(suppliersClose)}.`,
      ],
    },
    practice("q8"),
    {
      kind: "number",
      id: "retained-close",
      skill: "עודפים",
      prompt: `עודפי הפתיחה של חברה הם ${fmt(RET.opening)} ₪. השנה הרוויחה ${fmt(RET.profit)} ₪ וחילקה לבעלים ${fmt(RET.dividend)} ₪. מהם עודפי הסגירה?`,
      answer: RET.opening + RET.profit - RET.dividend,
      steps: ["עודפי סגירה = עודפי פתיחה + רווח השנה − מה שחולק.", `${fmt(RET.opening)} + ${fmt(RET.profit)} − ${fmt(RET.dividend)} = ${fmt(RET.opening + RET.profit - RET.dividend)}.`],
    },
    {
      kind: "choice",
      id: "closing-retained",
      skill: "פקודת הסגירה",
      prompt: `בסוף השנה: סך ההכנסות ${fmt(YEAR.income)} ₪ וסך ההוצאות ${fmt(YEAR.expenses)} ₪. איך מופיעים העודפים בפקודת הסגירה?`,
      options: [`ז׳ עודפים ${fmt(yearProfit)}`, `ח׳ עודפים ${fmt(yearProfit)}`, `ז׳ עודפים ${fmt(YEAR.income)}`, "העודפים לא משתתפים בפקודת הסגירה"],
      answer: 0,
      steps: [
        `רווח השנה: ${fmt(YEAR.income)} − ${fmt(YEAR.expenses)} = ${fmt(yearProfit)}.`,
        "בפקודת הסגירה: ח׳ כל הכנסה, ז׳ כל הוצאה, וההפרש — הרווח — עובר לעודפים.",
        `רווח מגדיל את העודפים, ולכן ז׳ עודפים ${fmt(yearProfit)}. בהפסד — ח׳ עודפים.`,
      ],
    },
  ],
  traps: [
    {
      id: "tb-balanced",
      prompt: "מאזן הבוחן מאוזן: סך החובה שווה לסך הזכות. האם זה אומר שאין בספרים טעויות?",
      options: ["לא בהכרח", "כן, תמיד", "כן, אם אין חשבונות חדשים", "רק אם העודפים בזכות"],
      answer: 0,
      why: "פקודה שלמה שנרשמה לחשבון הלא נכון, או פקודה שנשכחה לגמרי, לא יפריעו לאיזון. האיזון תופס רק טעויות חד-צדדיות.",
      traps: [
        "",
        "המלכודת: איזון נראה כמו הוכחה. אבל טעות שנרשמה באותו סכום בשני הצדדים שומרת על האיזון.",
        "חשבונות חדשים אינם קשורים — גם בלעדיהם אפשר לטעות בצורה מאוזנת.",
        "הצד של העודפים לא מעיד על נכונות הרישום.",
      ],
    },
    {
      id: "new-company-retained",
      prompt: "חברה הוקמה ב-1.1 השנה, ובסוף השנה הרוויחה 30,000 ₪. מהם עודפי הפתיחה שלה?",
      options: ["0 ₪", "30,000 ₪", "אי אפשר לדעת", "כמו הון הבעלים"],
      answer: 0,
      why: "לחברה שנפתחה השנה אין רווחים מהעבר: העודפים לתחילת השנה הם 0. הרווח של 30,000 הוא עודפי הסגירה.",
      traps: [
        "",
        "המלכודת: 30,000 הם עודפי הסגירה — אחרי שהרווח עבר לעודפים. בפתיחה עוד לא היה רווח.",
        "חברה חדשה — אין לה עבר, ולכן אפשר לדעת: 0.",
        "הון הבעלים הוא ההשקעה, לא רווחים שנצברו.",
      ],
    },
    {
      id: "income-next-year",
      prompt: "ב-31.12 יתרת ״מכירות״ היא 500,000 ₪. מה היתרה שלה ב-1.1 בשנה הבאה?",
      options: ["0 ₪", "500,000 ₪", "500,000 ₪ בחובה", "היא עוברת להון בעלים"],
      answer: 0,
      why: "מכירות הן חשבון תוצאתי: בפקודת הסגירה הוא מתאפס, והרווח עובר לעודפים. כל שנה מתחילה מאפס.",
      traps: [
        "",
        "המלכודת: רק חשבונות מאזניים ממשיכים. אילו המכירות היו ממשיכות, היינו סופרים אותן גם בשנה הבאה.",
        "בפקודת הסגירה רושמים מכירות בחובה כדי לאפס אותה — לא כדי להעביר את היתרה לצד השני.",
        "הרווח עובר לעודפים, לא להון הבעלים — והמכירות עצמן מתאפסות.",
      ],
    },
    {
      id: "retained-debit",
      prompt: "במאזן הבוחן העודפים ביתרת חובה. מה זה אומר?",
      options: ["הפסדים צבורים", "רווחים צבורים", "יש טעות ברישום", "החברה חילקה דיבידנד"],
      answer: 0,
      why: "כשהעסק הפסיד לאורך השנים יותר משהרוויח, יתרת העודפים עוברת לחובה — הפסדים צבורים.",
      traps: [
        "",
        "רווחים מגדילים את העודפים בזכות. יתרת חובה היא ההפך.",
        "המלכודת: הון ״אמור״ להיות בזכות — אבל עודפים יכולים לרדת מתחת לאפס, ואז הם בחובה.",
        "חלוקה לבעלים מקטינה את העודפים, אבל יתרת עודפים בחובה נקראת הפסדים צבורים: ההפסדים לאורך השנים גדולים מהרווחים.",
      ],
    },
  ],
  tips: [
    "יתרת כרטיס: סך חובה מול סך זכות — היתרה בצד הגדול, בגובה ההפרש. אל תשכחו את יתרת הפתיחה.",
    "חסרה יתרה במאזן בוחן? היא ההפרש: סך החובה חייב להיות שווה לסך הזכות.",
    "עודפי סגירה = פתיחה + רווח (− הפסד) − חלוקה. חברה חדשה: פתיחה 0.",
    "מאזני ממשיך, תוצאתי מתאפס. פקודת הסגירה: ח׳ הכנסות / ז׳ הוצאות / ז׳ עודפים ברווח.",
  ],
};
