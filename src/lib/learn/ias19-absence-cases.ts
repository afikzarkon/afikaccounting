import type { AbsenceCase, AbsenceMode } from "./ias19-absence";

/**
 * The lecture's exercise 2.1 (workbook sheet 2.1), the guide's own example:
 * kept only to check the solver against the lecture's solution. The lesson
 * teaches with its own numbers.
 */
export const LECTURE_21: AbsenceCase = {
  dayCost: 500,
  entitlement: 5,
  carried: [2],
  years: 1,
  opening: [
    { name: "עוזבים בתחילת השנה", staff: 5, use: 0, leaves: true },
    { name: "ינצלו 5 ימים, עוזבים בסוף השנה", staff: 4, use: 5, leaves: true },
    { name: "ינצלו 5 ימים, נשארים", staff: 78, use: 5, leaves: false },
    { name: "ינצלו 6.5 ימים, נשארים", staff: 13, use: 6.5, leaves: false },
  ],
  actual: [
    { name: "עזבו בתחילת השנה", staff: 3, use: 0, leaves: true },
    { name: "ניצלו 6 ימים, עזבו בסוף השנה", staff: 4, use: 6, leaves: true },
    { name: "ניצלו 6 ימים, נשארו", staff: 76, use: 6, leaves: false },
    { name: "ניצלו 4 ימים, נשארו", staff: 17, use: 4, leaves: false },
  ],
};

/** The lesson's walkthrough: "Alon", 120 employees, 6 sick days a year, 3 carried for one year, LIFO, a day at 400. Solved in both assumptions. */
export const ALON: AbsenceCase = {
  dayCost: 400,
  entitlement: 6,
  carried: [3],
  years: 1,
  opening: [
    { name: "עוזבים בתחילת השנה", staff: 6, use: 0, leaves: true },
    { name: "ינצלו 6 ימים, עוזבים בסוף השנה", staff: 5, use: 6, leaves: true },
    { name: "ינצלו 6 ימים, נשארים", staff: 91, use: 6, leaves: false },
    { name: "ינצלו 7.5 ימים, נשארים", staff: 18, use: 7.5, leaves: false },
  ],
  actual: [
    { name: "עזבו בתחילת השנה", staff: 4, use: 0, leaves: true },
    { name: "ניצלו 7 ימים, עזבו בסוף השנה", staff: 5, use: 7, leaves: true },
    { name: "ניצלו 7 ימים, נשארו", staff: 90, use: 7, leaves: false },
    { name: "ניצלו 4 ימים, נשארו", staff: 21, use: 4, leaves: false },
  ],
};

/** A summary exam: its story, the assumption it is solved in, and the trap it checks. */
export type AbsenceExam = {
  id: string;
  title: string;
  /** The company, in the story. */
  company: string;
  /** The trap this exam checks, said after it is solved. */
  trap: string;
  /** The story, a paragraph each: the terms, last year's expectation, what happened, this year's expectation. */
  story: string[];
  modes: AbsenceMode[];
  data: AbsenceCase;
};

export const ABSENCE_EXAMS: AbsenceExam[] = [
  {
    id: "cap",
    title: "מבחן 1: קבוצה שעוברת את היתרה",
    company: "ברק",
    trap: "קבוצה שצפויה לנצל יותר מהזכאות ועוד היתרה לא מקבלת יותר מהיתרה: MIN(יתרה, MAX(0, צפי − זכאות)).",
    story: [
      "בחברת ״ברק״ 50 עובדים. כל עובד זכאי ל-4 ימי מחלה בשנה, וימים שלא נוצלו עוברים לשנה אחת בלבד. הניצול לפי LIFO. אין פדיון ימי מחלה: עובד שעוזב מפסיד את היתרה. עלות יום 300 ש״ח.",
      "ב-31.12.2025 לכל עובד יתרה של 2 ימים. הצפי ל-2026: 2 עובדים יעזבו בתחילת השנה, 30 ינצלו עד 4 ימים, 12 ינצלו 5 ימים, ו-6 ינצלו 9 ימים.",
      "בפועל ב-2026: 3 עובדים עזבו בתחילת השנה. 25 ניצלו 3 ימים, 15 ניצלו 5 ימים, ו-7 ניצלו 8 ימים.",
      "ב-31.12.2026 צפוי שלא יהיו עזיבות ב-2027, והעובדים הנותרים ינצלו את המקסימום.",
    ],
    modes: ["A"],
    data: {
      dayCost: 300,
      entitlement: 4,
      carried: [2],
      years: 1,
      opening: [
        { name: "עוזבים בתחילת השנה", staff: 2, use: 0, leaves: true },
        { name: "ינצלו עד 4 ימים", staff: 30, use: 4, leaves: false },
        { name: "ינצלו 5 ימים", staff: 12, use: 5, leaves: false },
        { name: "ינצלו 9 ימים", staff: 6, use: 9, leaves: false },
      ],
      actual: [
        { name: "עזבו בתחילת השנה", staff: 3, use: 0, leaves: true },
        { name: "ניצלו 3 ימים", staff: 25, use: 3, leaves: false },
        { name: "ניצלו 5 ימים", staff: 15, use: 5, leaves: false },
        { name: "ניצלו 8 ימים", staff: 7, use: 8, leaves: false },
      ],
    },
  },
  {
    id: "leavers",
    title: "מבחן 2: עוזבים בתחילת השנה ובסופה",
    company: "גפן",
    trap: "במבשילה, גם מי שעוזב בסוף השנה נכנס לפתיחה על כל היתרה, ובתשלומים מקבל את מה שניצל ועוד פדיון על היתרה שנשארה לו.",
    story: [
      "בחברת ״גפן״ 80 עובדים. כל עובד זכאי ל-5 ימי חופשה בשנה, וימים שלא נוצלו עוברים לשנה אחת בלבד. הניצול לפי LIFO. עובד שעוזב מקבל פדיון על הימים שצבר. עלות יום 450 ש״ח.",
      "ב-31.12.2025 לכל עובד יתרה של 3 ימים. הצפי ל-2026: 4 עובדים יעזבו בתחילת השנה, 60 ינצלו 5 ימים (6 מהם יעזבו בסוף השנה), ו-16 ינצלו 7 ימים.",
      "בפועל ב-2026: 2 עובדים עזבו בתחילת השנה. 70 ניצלו 6 ימים (8 מהם עזבו בסוף השנה). שאר העובדים ניצלו 3 ימים.",
      "ב-31.12.2026 צפוי שלא יהיו עזיבות ב-2027, והעובדים הנותרים ינצלו את המקסימום.",
    ],
    modes: ["B"],
    data: {
      dayCost: 450,
      entitlement: 5,
      carried: [3],
      years: 1,
      opening: [
        { name: "עוזבים בתחילת השנה", staff: 4, use: 0, leaves: true },
        { name: "ינצלו 5 ימים, עוזבים בסוף השנה", staff: 6, use: 5, leaves: true },
        { name: "ינצלו 5 ימים, נשארים", staff: 54, use: 5, leaves: false },
        { name: "ינצלו 7 ימים, נשארים", staff: 16, use: 7, leaves: false },
      ],
      actual: [
        { name: "עזבו בתחילת השנה", staff: 2, use: 0, leaves: true },
        { name: "ניצלו 6 ימים, עזבו בסוף השנה", staff: 8, use: 6, leaves: true },
        { name: "ניצלו 6 ימים, נשארו", staff: 62, use: 6, leaves: false },
        { name: "ניצלו 3 ימים, נשארו", staff: 8, use: 3, leaves: false },
      ],
    },
  },
  {
    id: "lapse",
    title: "מבחן 3: יתרה ישנה שפוקעת",
    company: "דקל",
    trap: "בסגירה סופרים רק את מה שנשאר מזכאות השנה. היתרה מהשנה שעברה שלא נוצלה פקעה, והעוזבים לא נספרים בכלל. ואת מספר העובדים בקבוצה האחרונה מחשבים לבד.",
    story: [
      "בחברת ״דקל״ 40 עובדים. כל עובד זכאי ל-6 ימי מחלה בשנה, וימים שלא נוצלו עוברים לשנה אחת בלבד. הניצול לפי LIFO. אין פדיון ימי מחלה. עלות יום 500 ש״ח.",
      "ב-31.12.2025 לכל עובד יתרה של 2 ימים. הצפי ל-2026: 26 עובדים ינצלו עד 6 ימים, 10 ינצלו 8 ימים, ו-4 ינצלו 7 ימים.",
      "בפועל ב-2026: עובד אחד עזב בתחילת השנה. 22 עובדים ניצלו 4 ימים (3 מהם עזבו בסוף השנה). שאר העובדים ניצלו 7 ימים.",
      "ב-31.12.2026 צפוי שלא יהיו עזיבות ב-2027, והעובדים הנותרים ינצלו את המקסימום.",
    ],
    modes: ["A"],
    data: {
      dayCost: 500,
      entitlement: 6,
      carried: [2],
      years: 1,
      opening: [
        { name: "ינצלו עד 6 ימים", staff: 26, use: 6, leaves: false },
        { name: "ינצלו 8 ימים", staff: 10, use: 8, leaves: false },
        { name: "ינצלו 7 ימים", staff: 4, use: 7, leaves: false },
      ],
      actual: [
        { name: "עזב בתחילת השנה", staff: 1, use: 0, leaves: true },
        { name: "ניצלו 4 ימים, עזבו בסוף השנה", staff: 3, use: 4, leaves: true },
        { name: "ניצלו 4 ימים, נשארו", staff: 19, use: 4, leaves: false },
        { name: "ניצלו 7 ימים, נשארו", staff: 17, use: 7, leaves: false },
      ],
    },
  },
  {
    id: "average",
    title: "מבחן 4: ממוצע, וסגירה לפי צפי",
    company: "הדס",
    trap: "ממוצע של כל העובדים מסתיר מי עובר את הזכאות, ולכן מחלקים לקבוצות. וכשהשאלה נותנת צפי לשנה הבאה, גם הסגירה נמדדת לפיו ולא לפי ניצול מקסימלי.",
    story: [
      "בחברת ״הדס״ 60 עובדים. כל עובד זכאי ל-5 ימי מחלה בשנה, וימים שלא נוצלו עוברים לשנה אחת בלבד. הניצול לפי LIFO. עלות יום 350 ש״ח. פתרו פעמיים: בהנחה א׳ (אין פדיון) ובהנחה ב׳ (עובד שעוזב מקבל פדיון).",
      "ב-31.12.2025 לכל עובד יתרה של 2 ימים. הצפי ל-2026: בממוצע כל עובד ינצל 5.25 ימים. בפירוט: 3 עובדים יעזבו בתחילת השנה, 42 ינצלו 5 ימים, ו-15 ינצלו 7 ימים.",
      "בפועל ב-2026: 2 עובדים עזבו בתחילת השנה. 40 ניצלו 3 ימים, ו-18 ניצלו 6 ימים.",
      "ב-31.12.2026, לגבי 40 העובדים שניצלו 3 ימים: 25 צפויים לנצל ב-2027 עד 5 ימים, ו-15 צפויים לנצל 6 ימים. אין עזיבות צפויות.",
    ],
    modes: ["A", "B"],
    data: {
      dayCost: 350,
      entitlement: 5,
      carried: [2],
      years: 1,
      opening: [
        { name: "עוזבים בתחילת השנה", staff: 3, use: 0, leaves: true },
        { name: "ינצלו 5 ימים", staff: 42, use: 5, leaves: false },
        { name: "ינצלו 7 ימים", staff: 15, use: 7, leaves: false },
      ],
      actual: [
        { name: "עזבו בתחילת השנה", staff: 2, use: 0, leaves: true },
        {
          name: "ניצלו 3 ימים",
          staff: 40,
          use: 3,
          leaves: false,
          next: [
            { name: "ינצלו ב-2027 עד 5 ימים", staff: 25, use: 5 },
            { name: "ינצלו ב-2027 6 ימים", staff: 15, use: 6 },
          ],
        },
        { name: "ניצלו 6 ימים", staff: 18, use: 6, leaves: false },
      ],
    },
  },
];
