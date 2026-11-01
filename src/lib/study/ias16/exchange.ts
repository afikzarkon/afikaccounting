import { calc, fmt, journal } from "./shared";

// Question builders for the course's lessons (lessons/). Every figure is computed from the question's own numbers,
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
