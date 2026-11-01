import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed from the question's own numbers,
// so the same questions also come with new numbers (variants/ias16.ts); ias16-lessons.test checks them against the course's exchange solver.

/** An old machine exchanged part-way through a year, and the fair value and cash of the deal. */
export type Swap = { cost: number; life: number; accumulatedOpening: number; month: number; fairValue: number; cash: number };
export const SWAP: Swap = { cost: 100_000, life: 10, accumulatedOpening: 57_500, month: 4, fairValue: 50_000, cash: 5_000 };

export function swapFigures(S: Swap) {
  const annual = S.cost / S.life;
  const toDate = (annual * (S.month - 1)) / 12;
  const accumulated = S.accumulatedOpening + toDate;
  const carrying = S.cost - accumulated;
  return { annual, toDate, accumulated, carrying, gain: S.fairValue - carrying };
}

export function exchangeQuestions(S: Swap) {
  const f = swapFigures(S);
  return {
    "swap-dep": calc(
      "swap-dep",
      "פחת עד יום ההחלפה",
      `מכונה בעלות ${fmt(S.cost)} ₪, בלי ערך גרט, ${S.life} שנות חיים בקו ישר. ב-1.1 הפחת שנצבר עליה ${fmt(S.accumulatedOpening)} ₪. היא הוחלפה ב-1.${S.month}. כמה פחת רושמים השנה על המכונה הישנה?`,
      f.toDate,
      [`פחת שנתי: ${fmt(S.cost)} ÷ ${S.life} = ${fmt(f.annual)} ₪.`, `עד יום ההחלפה עברו ${S.month - 1} חודשים: ${fmt(f.annual)} × ${S.month - 1}/12 = ${fmt(f.toDate)} ₪.`],
    ),
    "swap-gain": calc(
      "swap-gain",
      "רווח מההחלפה",
      `מכונה בעלות ${fmt(S.cost)} ₪, בלי ערך גרט, ${S.life} שנות חיים בקו ישר; ב-1.1 הפחת שנצבר עליה ${fmt(S.accumulatedOpening)} ₪. ב-1.${S.month} הוחלפה במכונה אחרת, בעסקה עם מהות מסחרית, ושוויה ההוגן באותו יום ${fmt(S.fairValue)} ₪. מה הרווח מההחלפה?`,
      f.gain,
      [
        `פחת נצבר ביום ההחלפה: ${fmt(S.accumulatedOpening)} + ${fmt(f.toDate)} = ${fmt(f.accumulated)} ₪; ערך בספרים: ${fmt(S.cost)} − ${fmt(f.accumulated)} = ${fmt(f.carrying)} ₪.`,
        `רווח: שווי הוגן − ערך בספרים = ${fmt(S.fairValue)} − ${fmt(f.carrying)} = ${fmt(f.gain)} ₪.`,
      ],
    ),
    "swap-entry": journal(
      "swap-entry",
      "פקודת ההחלפה",
      `החלפת המכונה (עלות ${fmt(S.cost)} ₪, פחת נצבר ביום ההחלפה ${fmt(f.accumulated)} ₪) במכונה חדשה, לפי השווי ההוגן של הישנה — ${fmt(S.fairValue)} ₪ — בעסקה עם מהות מסחרית. רשמו את הפקודה המלאה.`,
      [
        { account: "נכס חדש — עלות", dr: S.fairValue },
        { account: "פחת נצבר — נכס ישן", dr: f.accumulated },
        { account: "נכס ישן — עלות מקורית", cr: S.cost },
        { account: "רווח מהחלפת נכסים", cr: f.gain },
      ],
      `הנכס החדש נרשם בשווי ההוגן של מה שנמסר: ${fmt(S.fairValue)} ₪. הישן יוצא כולו — עלותו והפחת שנצבר עליו — וההפרש הוא הרווח: ${fmt(f.gain)} ₪.`,
      ["נכס חדש — עלות", "פחת נצבר — נכס ישן", "נכס ישן — עלות מקורית", "רווח מהחלפת נכסים", "מזומן", "הוצאות פחת"],
    ),
    "swap-cash": calc(
      "swap-cash",
      "עלות הנכס החדש עם תוספת מזומן",
      `מכונה ששוויה ההוגן ${fmt(S.fairValue)} ₪ הוחלפה במכונה חדשה, בעסקה עם מהות מסחרית, והחברה הוסיפה גם ${fmt(S.cash)} ₪ במזומן. מה עלות המכונה החדשה?`,
      S.fairValue + S.cash,
      ["העלות היא מה שנמסר תמורת הנכס החדש: השווי ההוגן של הישן, ועוד המזומן ששולם.", `${fmt(S.fairValue)} + ${fmt(S.cash)} = ${fmt(S.fairValue + S.cash)} ₪.`],
    ),
    "swap-no-substance": calc(
      "swap-no-substance",
      "ללא מהות מסחרית",
      `מכונה שערכה בספרים ביום ההחלפה ${fmt(f.carrying)} ₪ (ושוויה ההוגן ${fmt(S.fairValue)} ₪) הוחלפה במכונה חדשה, עם תוספת ${fmt(S.cash)} ₪ במזומן — בעסקה ללא מהות מסחרית. מה עלות המכונה החדשה?`,
      f.carrying + S.cash,
      ["בלי מהות מסחרית הנכס החדש נמדד לפי הערך בספרים של הישן — ואין רווח או הפסד.", `${fmt(f.carrying)} + ${fmt(S.cash)} = ${fmt(f.carrying + S.cash)} ₪.`],
    ),
  };
}

const Q = exchangeQuestions(SWAP);

/** Lesson 4: exchanging one asset for another — the date, the depreciation up to it, commercial substance, the entries, and the rest of the year. */
export const EXCHANGE: StudyModule = {
  slug: "ias16-exchange",
  course: COURSE,
  n: 4,
  title: "החלפת נכסים",
  description: "שלושה שלבים קבועים לכל שאלת החלפה: תאריך ההחלפה, עדכון הפחת עד אליו, וסיווג העסקה — יש או אין מהות מסחרית. ואחר כך: פקודות היומן, פחת הנכס החדש, ומחשבון.",
  backHref: COURSE_HREF,
  screens: [
    { id: "exchange-steps", title: "שלבי הפתרון" },
    { id: "exchange-entries", title: "פקודות היומן" },
    { id: "exchange-new-asset", title: "המשך השנה: פחת הנכס החדש" },
    { id: "exchange-calculator", title: "מחשבון החלפה" },
  ],
  tools: [{ screen: "exchange-calculator", label: "מחשבון החלפה" }],
  exercises: [
    Q["swap-dep"],
    Q["swap-gain"],
    Q["swap-entry"],
    Q["swap-cash"],
    Q["swap-no-substance"],
    choice(
      "substance",
      "מהות מסחרית",
      "מה קובע אם להחלפה יש מהות מסחרית?",
      ["אם התזרימים הצפויים מהנכס החדש שונים באופן משמעותי מאלה של הישן", "אם השווי ההוגן של שני הנכסים שווה", "אם שולם מזומן בעסקה"],
      0,
      "מהות מסחרית פירושה שההחלפה באמת משנה את המצב הכלכלי של החברה — את התזרימים שהיא צפויה לקבל.",
    ),
  ],
  traps: [
    {
      id: "forgot-dep",
      prompt: "מכונה בעלות 100,000 ₪, פחת שנתי 10,000 ₪, ופחת נצבר ב-1.1 — 50,000 ₪. ב-1.7 הוחלפה, בעסקה עם מהות מסחרית, לפי שוויה ההוגן: 48,000 ₪. מה התוצאה?",
      options: ["רווח של 3,000 ₪", "הפסד של 2,000 ₪", "רווח של 48,000 ₪"],
      answer: 0,
      why: "קודם מעדכנים פחת עד יום ההחלפה: חצי שנה, 5,000 ₪. ערך בספרים: 100,000 − 55,000 = 45,000 ₪. רווח: 48,000 − 45,000 = 3,000 ₪.",
      traps: ["", "המלכודת: שכחו את הפחת מ-1.1 עד יום ההחלפה, והשוו לערך בספרים של תחילת השנה (50,000 ₪).", "השווי ההוגן אינו הרווח — משווים אותו לערך בספרים."],
    },
    {
      id: "no-substance-gain",
      prompt: "בהחלפה ללא מהות מסחרית, השווי ההוגן של הנכס שנמסר גבוה מערכו בספרים. האם מכירים ברווח?",
      options: ["לא — הנכס החדש נמדד לפי הערך בספרים של הישן", "כן — לפי השווי ההוגן"],
      answer: 0,
      why: "בלי מהות מסחרית אין רווח ואין הפסד: הנכס החדש פשוט ממשיך את הערך בספרים של הישן.",
      traps: ["", "המלכודת: רווח לפי שווי הוגן מוכרים רק כשלעסקה יש מהות מסחרית."],
    },
  ],
  tips: [
    "מעדכנים פחת עד יום ההחלפה — אחרת הרווח שגוי.",
    "החלפה באמצע השנה = שני חישובי פחת באותה שנה: הישן עד ההחלפה, החדש ממנה.",
    "עם מהות מסחרית: הנכס החדש בשווי ההוגן, וההפרש מהערך בספרים — רווח או הפסד.",
    "בלי מהות מסחרית: הנכס החדש בערך בספרים של הישן, בלי רווח.",
    "בדיקה מהירה: סך החובה שווה לסך הזכות, והנכס הישן יצא כולו מהספרים.",
  ],
};
