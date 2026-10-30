import { balancesOf, ledger, RONEN, round2, statements } from "@/lib/learn/basics";
import type { StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt } from "./shared";

// Ronen's year after the adjustments: the profit the worksheet arrives at.
const RONEN_S = statements(balancesOf(ledger(RONEN.adjustments, RONEN.preliminary)));
const list = (rows: [string, number][]) => rows.map(([a, v]) => `${a} ${fmt(v)}`).join(" + ");

// Service fees received in advance on 1.12 for three months, all recorded as income.
const FEES = { received: 9_000, months: 3, monthsThisYear: 1 };
const feesUnearned = round2((FEES.received * (FEES.months - FEES.monthsThisYear)) / FEES.months);


/** Lesson 6: the multi-column worksheet, and a mixed review of the whole course. */
export const FINAL: StudyModule = {
  slug: "basics-final",
  course: COURSE,
  n: 6,
  title: "גיליון רב-טורי ותרגול מסכם",
  description: "כל מה שלמדנו בטבלה אחת — ממאזן הבוחן הראשוני ועד הרווח והעודפים — ותרגול מסכם על כל הקורס.",
  backHref: COURSE_HREF,
  screens: [{ id: "worksheet", title: "גיליון רב-טורי" }],
  exercises: [
    {
      kind: "choice",
      id: "worksheet-final",
      skill: "גיליון רב-טורי",
      prompt: "בגיליון הרב-טורי מחברים לכל חשבון את מאזן הבוחן לפני ההתאמות ואת פקודות ההתאמה. מה מתקבל?",
      options: ["מאזן בוחן סופי", "דוח רווח והפסד", "מאזן הפתיחה של השנה הבאה", "עודפי הפתיחה"],
      answer: 0,
      steps: ["מאזן הבוחן לפני ההתאמות הוא נקודת הפתיחה.", "מוסיפים לכל חשבון את ההתאמות שלו, בצד הנכון.", "התוצאה: מאזן בוחן סופי — היתרות הנכונות ל-31.12. ממנו מפצלים לתוצאתי ולמאזני."],
    },
    {
      kind: "number",
      id: "ronen-profit",
      skill: "רווח השנה",
      prompt: "בגיליון של רונן ל-2017, אחרי פקודות ההתאמה ומלאי הסגירה: מה רווח השנה?",
      answer: RONEN_S.profit,
      steps: [
        `הכנסות אחרי ההתאמות: ${list(RONEN_S.income)} = ${fmt(RONEN_S.totalIncome)}.`,
        `הוצאות אחרי ההתאמות: ${list(RONEN_S.expenses)} = ${fmt(RONEN_S.totalExpenses)}.`,
        `רווח = ${fmt(RONEN_S.totalIncome)} − ${fmt(RONEN_S.totalExpenses)} = ${fmt(RONEN_S.profit)}.`,
      ],
    },
    {
      kind: "journal",
      id: "fees-unearned",
      skill: "הכנסות מראש",
      entry: {
        id: "1",
        text: `ב-1.12 התקבלו ${fmt(FEES.received)} ₪ על ${FEES.months} חודשי שירות, ונרשמו כולם כ״הכנסות משירותים״. רשמו את פקודת ההתאמה ב-31.12.`,
        lines: [
          { account: "הכנסות משירותים", dr: feesUnearned },
          { account: "הכנסות משירותים מראש", cr: feesUnearned },
        ],
        why: `השנה עבר חודש אחד מתוך ${FEES.months}. ${FEES.months - FEES.monthsThisYear} חודשים שייכים לשנה הבאה: ${fmt(FEES.received)} × ${FEES.months - FEES.monthsThisYear}/${FEES.months} = ${fmt(feesUnearned)} — עוברים מההכנסה להתחייבות.`,
      },
      accounts: ["הכנסות משירותים", "הכנסות משירותים מראש", "הכנסות משירותים לקבל", "מזומן", "לקוחות"],
    },
    {
      kind: "choice",
      id: "not-profit",
      skill: "מה משפיע על הרווח",
      prompt: "איזו מהפעולות הבאות אינה משפיעה על רווח השנה?",
      options: ["פירעון קרן של הלוואה", "תשלום שכר לעובדים", "שכר דצמבר שירשם כהוצאות שכר לשלם", "ריבית על הלוואה"],
      answer: 0,
      steps: ["שכר — גם זה שעוד לא שולם — וריבית הם הוצאות: הם מקטינים את הרווח.", "פירעון קרן: ח׳ הלוואה / ז׳ מזומן — נכס והתחייבות קטנים, בלי הכנסה או הוצאה.", "לכן: פירעון הקרן."],
    },
    {
      kind: "journal",
      id: "review-accrued",
      skill: "הוצאות לשלם",
      entry: {
        id: "1",
        text: "שכירות המשרד לדצמבר, 12,000 ₪, תשולם רק ב-5 בינואר. רשמו את פקודת ההתאמה ב-31.12.",
        lines: [
          { account: "הוצאות שכירות", dr: 12_000 },
          { account: "הוצאות שכירות לשלם", cr: 12_000 },
        ],
        why: "את דצמבר כבר ניצלנו — ההוצאה שייכת השנה. הכסף עוד לא יצא, ולכן נוצר חוב: הוצאות לשלם, התחייבות.",
      },
      accounts: ["הוצאות שכירות", "הוצאות שכירות לשלם", "הוצאות שכירות מראש", "מזומן"],
    },
  ],
  traps: [
    {
      id: "postdated",
      prompt: "מכרת סחורה ב-10,000 ₪: 4,000 במזומן והשאר בצ׳ק דחוי. מה בצד החובה?",
      options: ["מזומן 4,000 · לקוחות 6,000", "מזומן 10,000", "מזומן 4,000 · ספקים 6,000", "לקוחות 10,000"],
      answer: 0,
      why: "רק 4,000 נכנסו לקופה. צ׳ק דחוי עוד לא נפרע — עד מועד הפירעון הלקוח חייב 6,000.",
      traps: [
        "",
        "המלכודת: צ׳ק דחוי אינו מזומן. עד שהוא נפרע — זה חוב של הלקוח.",
        "ספקים הם מי שהעסק חייב לו. כאן הלקוח חייב לעסק — לקוחות.",
        "4,000 כבר התקבלו במזומן, ולכן הם לא חוב.",
      ],
    },
    {
      id: "inventory-high",
      prompt: "מלאי הסגירה נספר בטעות ב-20,000 ₪ יותר מהאמת. מה קורה לרווח השנה?",
      options: ["גבוה מדי ב-20,000 ₪", "נמוך מדי ב-20,000 ₪", "לא משתנה", "גבוה מדי ב-40,000 ₪"],
      answer: 0,
      why: "מלאי סגירה מקטין את עלות המכר. מלאי גבוה מדי ← עלות המכר נמוכה מדי ← הרווח גבוה מדי, באותו סכום.",
      traps: [
        "",
        "הפוך: יותר מלאי סגירה פירושו פחות עלות המכר — ולכן יותר רווח.",
        "המלכודת: מלאי נראה כמו נושא מאזני בלבד. אבל הוא חלק מנוסחת עלות המכר, ולכן משפיע על הרווח.",
        "הטעות היא 20,000 בעלות המכר, ולכן 20,000 ברווח — לא כפול.",
      ],
    },
    {
      id: "unearned-side",
      prompt: "באיזה צד במאזן הבוחן הסופי מופיעות ״הכנסות מראש״?",
      options: ["זכות — התחייבות", "חובה — נכס", "זכות — הכנסה של השנה", "לא מופיעות"],
      answer: 0,
      why: "קיבלנו כסף על שירות שעוד לא נתנו — אנחנו חייבים אותו. זו התחייבות, ולכן בזכות.",
      traps: [
        "",
        "המלכודת: ״מראש״ מזכיר ״הוצאות מראש״ שהן נכס. אבל כאן הכסף נכנס — ואנחנו החייבים.",
        "הצד נכון, אבל הסוג לא: החלק הזה שייך לשנה הבאה, ולכן אינו הכנסה של השנה.",
        "זה חשבון מאזני שממשיך לשנה הבאה — הוא מופיע במאזן הבוחן ובמאזן.",
      ],
    },
  ],
  tips: [
    "הגיליון הרב-טורי: מאזן בוחן ראשוני + התאמות = מאזן בוחן סופי, ומשם — תוצאתי ומאזני.",
    "רווח השנה הוא בדיוק מה שחסר כדי שעמודות המאזני יתאזנו.",
    "צ׳ק דחוי מלקוח — לקוחות, עד שהוא נפרע. צ׳ק דחוי לספק — ספקים.",
    "עודפי סגירה = עודפי פתיחה + רווח השנה (או פחות הפסד השנה).",
  ],
};
