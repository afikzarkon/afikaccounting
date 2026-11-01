import { calc, fmt, journal } from "./shared";

// Question builders for the course's lessons (lessons/). Every figure is computed from the question's own numbers,
// so the same questions also come with new numbers (variants/ias16.ts); ias16-lessons.test checks them against the course's revaluation solver.

/** A straight-line building revalued on 1 January of a later year. */
export type Reval = { cost: number; life: number; firstYear: number; year: number; fairValue: number };
export const REVAL: Reval = { cost: 100_000, life: 10, firstYear: 2023, year: 2025, fairValue: 96_000 };

export function revalFigures(R: Reval) {
  const annual = R.cost / R.life;
  const accumulated = annual * (R.year - R.firstYear);
  const before = R.cost - accumulated;
  const surplus = R.fairValue - before;
  const yearsLeft = R.life - (R.year - R.firstYear);
  const newAnnual = R.fairValue / yearsLeft;
  return { annual, accumulated, before, surplus, yearsLeft, newAnnual, transfer: newAnnual - annual };
}

export function revaluationQuestions(R: Reval) {
  const f = revalFigures(R);
  return {
    "reval-gap": calc(
      "reval-gap",
      "פער ההערכה מחדש",
      `מבנה בעלות ${fmt(R.cost)} ₪, בלי ערך גרט, ${R.life} שנות חיים בקו ישר, זמין לשימוש מ-1.1.${R.firstYear}. ב-1.1.${R.year} הוערך מחדש לשווי הוגן של ${fmt(R.fairValue)} ₪. כמה נרשם בקרן ההערכה מחדש?`,
      f.surplus,
      [
        `ערך בספרים ביום ההערכה: ${fmt(R.cost)} − ${R.year - R.firstYear} × ${fmt(f.annual)} = ${fmt(f.before)} ₪.`,
        `פער: ${fmt(R.fairValue)} − ${fmt(f.before)} = ${fmt(f.surplus)} ₪. עלייה ראשונה — לקרן ההערכה מחדש (רווח כולל אחר).`,
      ],
    ),
    "reval-entry": journal(
      "reval-entry",
      "פקודת ההערכה מחדש",
      `מבנה בעלות ${fmt(R.cost)} ₪, שהפחת הנצבר עליו ${fmt(f.accumulated)} ₪, הוערך מחדש לראשונה, לשווי הוגן של ${fmt(R.fairValue)} ₪. רשמו את הפקודה בשיטת הביטול.`,
      // Net, the building moves from its cost to the fair value: down (credit) or up (debit) — or not at all.
      [
        { account: "פחת נצבר", dr: f.accumulated },
        ...(R.fairValue > R.cost ? [{ account: "מבנה", dr: R.fairValue - R.cost }] : R.fairValue < R.cost ? [{ account: "מבנה", cr: R.cost - R.fairValue }] : []),
        { account: "קרן הערכה מחדש", cr: f.surplus },
      ],
      `בשיטת הביטול סוגרים את הפחת הנצבר מול הנכס (${fmt(f.accumulated)} ₪), ומעלים את הנכס לשווי ההוגן (${fmt(f.surplus)} ₪) מול הקרן. נטו: ${R.fairValue === R.cost ? `המבנה נשאר ב-${fmt(R.cost)} ₪.` : `המבנה ${R.fairValue > R.cost ? "עולה" : "יורד"} ב-${fmt(Math.abs(R.fairValue - R.cost))} ₪, מ-${fmt(R.cost)} ל-${fmt(R.fairValue)} ₪.`}`,
      ["פחת נצבר", "מבנה", "קרן הערכה מחדש", "רווח מהערכה מחדש", "עודפים"],
    ),
    "reval-new-dep": calc(
      "reval-new-dep",
      "פחת חדש מיום ההערכה",
      `מבנה הוערך מחדש לשווי הוגן של ${fmt(R.fairValue)} ₪, ונותרו לו ${f.yearsLeft} שנות חיים, בלי ערך גרט, בקו ישר. מה הפחת השנתי מעכשיו?`,
      f.newAnnual,
      [`מפחיתים את השווי ההוגן על יתרת אורך החיים: ${fmt(R.fairValue)} ÷ ${f.yearsLeft} = ${fmt(f.newAnnual)} ₪.`],
    ),
    "reval-transfer": calc(
      "reval-transfer",
      "העברה לעודפים",
      `מבנה הוערך מחדש. מאז הפחת שלו ${fmt(f.newAnnual)} ₪ לשנה; לפי העלות המקורית היה ${fmt(f.annual)} ₪. החברה מעבירה את קרן ההערכה מחדש לעודפים לפי הפחת. כמה מעבירים בכל שנה?`,
      f.transfer,
      [
        `מעבירים את הפרש הפחת — מה שנובע מההערכה: ${fmt(f.newAnnual)} − ${fmt(f.annual)} = ${fmt(f.transfer)} ₪.`,
        `בדיקה: ${fmt(f.surplus)} ₪ בקרן ÷ ${f.yearsLeft} שנים = ${fmt(f.surplus / f.yearsLeft)} ₪ — ובסוף החיים הקרן מתאפסת.`,
      ],
    ),
  };
}

/** A fall in value after an earlier rise: the surplus first, then profit or loss. */
export type Drop = { surplus: number; decrease: number };
export const dropQ = (D: Drop) =>
  calc(
    "reval-drop",
    "ירידה אחרי עלייה",
    `לנכס יתרה של ${fmt(D.surplus)} ₪ בקרן ההערכה מחדש. בהערכה הבאה ערכו ירד ב-${fmt(D.decrease)} ₪. כמה נרשם ברווח והפסד?`,
    D.decrease - D.surplus,
    [
      `ירידה מקטינה קודם את הקרן של אותו נכס, עד שהיא מתאפסת: ${fmt(D.surplus)} ₪.`,
      `השאר — ${fmt(D.decrease)} − ${fmt(D.surplus)} = ${fmt(D.decrease - D.surplus)} ₪ — הפסד ברווח והפסד.`,
    ],
  );
