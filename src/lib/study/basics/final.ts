import { balancesOf, closingEntry, ledger, RONEN, round2, statements } from "@/lib/learn/basics";
import type { StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt } from "./shared";

// Ronen's year after the adjustments: the profit the worksheet arrives at.
const RONEN_S = statements(balancesOf(ledger(RONEN.adjustments, RONEN.preliminary)));
const list = (rows: [string, number][]) => rows.map(([a, v]) => `${a} ${fmt(v)}`).join(" + ");

// A small closing entry, built by the same function the course uses.
const CLOSE_TB = { מכירות: -90_000, "הוצאות שכר": 50_000, קניות: 25_000 };
const CLOSE = closingEntry(CLOSE_TB, "סגירה", "31.12");

// Service fees received in advance on 1.12 for three months, all recorded as income.
const FEES = { received: 9_000, months: 3, monthsThisYear: 1 };
const feesUnearned = round2((FEES.received * (FEES.months - FEES.monthsThisYear)) / FEES.months);

const NET = { customers: 300_000, rate: 0.03 };

/** Lesson 5: the multi-column worksheet, and a mixed review of the whole course. */
export const FINAL: StudyModule = {
  slug: "basics-final",
  course: COURSE,
  n: 5,
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
      prompt: "בגיליון של רונן ל-2017, אחרי חמש פקודות ההתאמה: מה רווח השנה?",
      answer: RONEN_S.profit,
      steps: [
        `הכנסות אחרי ההתאמות: ${list(RONEN_S.income)} = ${fmt(RONEN_S.totalIncome)}.`,
        `הוצאות אחרי ההתאמות: ${list(RONEN_S.expenses)} = ${fmt(RONEN_S.totalExpenses)}.`,
        `רווח = ${fmt(RONEN_S.totalIncome)} − ${fmt(RONEN_S.totalExpenses)} = ${fmt(RONEN_S.profit)}.`,
      ],
    },
    {
      kind: "journal",
      id: "close-year",
      skill: "פקודת הסגירה",
      entry: {
        ...CLOSE,
        text: `סוף השנה. היתרות התוצאתיות: מכירות ${fmt(-CLOSE_TB.מכירות)} (ז׳), הוצאות שכר ${fmt(CLOSE_TB["הוצאות שכר"])} (ח׳), קניות ${fmt(CLOSE_TB.קניות)} (ח׳). רשמו את פקודת הסגירה.`,
        why: "כל חשבון תוצאתי נסגר ביתרה שלו בצד ההפוך: הכנסה בחובה, הוצאה בזכות. ההפרש — הרווח — לזכות העודפים.",
      },
      accounts: ["מכירות", "הוצאות שכר", "קניות", "עודפים", "הון בעלים", "מזומן"],
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
      options: ["פירעון קרן של הלוואה", "תשלום שכר לעובדים", "השלמת ההפרשה להפסדי אשראי", "ריבית על הלוואה"],
      answer: 0,
      steps: ["שכר, הפסדי אשראי וריבית הם הוצאות — הם מקטינים את הרווח.", "פירעון קרן: ח׳ הלוואה / ז׳ מזומן — נכס והתחייבות קטנים, בלי הכנסה או הוצאה.", "לכן: פירעון הקרן."],
    },
    {
      kind: "number",
      id: "net-customers",
      skill: "לקוחות נטו",
      prompt: `יתרת הלקוחות בסוף השנה ${fmt(NET.customers)} ₪, וההפרשה הנדרשת היא ${NET.rate * 100}% מהיתרה. מה סכום הלקוחות נטו במאזן?`,
      answer: round2(NET.customers - NET.customers * NET.rate),
      steps: [`ההפרשה הנדרשת: ${fmt(NET.customers)} × ${NET.rate * 100}% = ${fmt(round2(NET.customers * NET.rate))}.`, `לקוחות נטו = לקוחות − הפרשה: ${fmt(NET.customers)} − ${fmt(round2(NET.customers * NET.rate))} = ${fmt(round2(NET.customers - NET.customers * NET.rate))}.`],
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
    {
      id: "write-off-net",
      prompt: "חוב אבוד של 5,000 ₪ נמחק כנגד ההפרשה להפסדי אשראי. מה קורה ללקוחות נטו במאזן?",
      options: ["לא משתנים", "קטנים ב-5,000 ₪", "גדלים ב-5,000 ₪", "קטנים ב-10,000 ₪"],
      answer: 0,
      why: "ח׳ הפרשה / ז׳ לקוחות: הלקוחות (ברוטו) קטנים ב-5,000, וגם ההפרשה שמנוכה מהם קטנה ב-5,000. הנטו לא זז.",
      traps: [
        "",
        "המלכודת: מסתכלים רק על הלקוחות ברוטו. גם ההפרשה שמנוכה מהם קטנה — באותו סכום.",
        "שום דבר לא גדל — שני החשבונות קטנים.",
        "הלקוחות קטנים ב-5,000 וההפרשה קטנה ב-5,000 — הם מקזזים זה את זה, לא מצטברים.",
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
