import { calc, fmt, journal } from "./shared";

// Question builders for the course's lessons (lessons/). Every figure is computed from the question's own numbers,
// so the same questions also come with new numbers (variants/ias16.ts), for subscribers' review.
export type Machine = { price: number; transport: number; install: number; training: number; salvage: number; life: number; years: number };
export const MACHINE: Machine = { price: 100_000, transport: 4_000, install: 6_000, training: 3_000, salvage: 10_000, life: 10, years: 3 };

/** The lesson's machine questions, from the machine's numbers. */
export function machineQuestions(M: Machine) {
  const cost = M.price + M.transport + M.install;
  const annual = (cost - M.salvage) / M.life;
  const carrying = cost - M.years * annual;
  return {
    "machine-cost": calc(
      "machine-cost",
      "עלות הנכס",
      `מכונה נקנתה ב-${fmt(M.price)} ₪. ההובלה למפעל עלתה ${fmt(M.transport)} ₪, ההתקנה ${fmt(M.install)} ₪, והדרכת העובדים לתפעולה ${fmt(M.training)} ₪. מהי עלות המכונה?`,
      cost,
      [
        "נכלל בעלות כל מה שנדרש כדי להביא את המכונה למקומה ולמצב שבו היא מוכנה לשימוש: המחיר, ההובלה וההתקנה.",
        "הדרכת העובדים אינה מביאה את המכונה למצב שמיש — היא הוצאה של התקופה.",
        `עלות: ${fmt(M.price)} + ${fmt(M.transport)} + ${fmt(M.install)} = ${fmt(cost)} ₪.`,
      ],
    ),
    "machine-buy": journal(
      "machine-buy",
      "רכישת מכונה",
      `החברה שילמה במזומן על מכונה ${fmt(M.price)} ₪, על הובלתה ${fmt(M.transport)} ₪, על ההתקנה ${fmt(M.install)} ₪ ועל הדרכת העובדים ${fmt(M.training)} ₪. רשמו את הפקודה.`,
      [
        { account: "מכונה", dr: cost },
        { account: "הוצאות הדרכה", dr: M.training },
        { account: "מזומן", cr: cost + M.training },
      ],
      `המחיר, ההובלה וההתקנה הם עלות המכונה: ${fmt(cost)} ₪. ההדרכה — הוצאה. במזומן יצא הכול: ${fmt(cost + M.training)} ₪.`,
      ["מכונה", "הוצאות הדרכה", "מזומן", "הוצאות פחת", "ספקים"],
    ),
    "annual-dep": calc(
      "annual-dep",
      "פחת שנתי",
      `עלות המכונה ${fmt(cost)} ₪, ערך הגרט ${fmt(M.salvage)} ₪ ואורך החיים ${M.life} שנים, בקו ישר. מה הפחת השנתי?`,
      annual,
      [
        `סכום בר-פחת = עלות − ערך גרט: ${fmt(cost)} − ${fmt(M.salvage)} = ${fmt(cost - M.salvage)} ₪.`,
        `בקו ישר מחלקים בשנות החיים: ${fmt(cost - M.salvage)} ÷ ${M.life} = ${fmt(annual)} ₪ לשנה.`,
      ],
    ),
    carrying: calc(
      "carrying",
      "ערך בספרים",
      `מכונה בעלות ${fmt(cost)} ₪, ופחת שנתי של ${fmt(annual)} ₪. מה הערך שלה בספרים אחרי ${M.years} שנים?`,
      carrying,
      [
        `פחת נצבר אחרי ${M.years} שנים: ${M.years} × ${fmt(annual)} = ${fmt(M.years * annual)} ₪.`,
        `ערך בספרים = עלות − פחת נצבר: ${fmt(cost)} − ${fmt(M.years * annual)} = ${fmt(carrying)} ₪.`,
      ],
    ),
  };
}
