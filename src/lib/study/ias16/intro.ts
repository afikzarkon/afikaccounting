import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed from the question's own numbers,
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

const Q = machineQuestions(MACHINE);

/** Lesson 1: what an item of property, plant and equipment is, what goes into its cost, and the concepts every question uses. */
export const INTRO: StudyModule = {
  slug: "ias16-intro",
  course: COURSE,
  n: 1,
  title: "מהו רכוש קבוע ומושגי יסוד",
  description: "מה הופך פריט לרכוש קבוע, מה נכנס לעלות שלו, ואיך עלות, פחת וערך בספרים מתחברים על ציר אחד — לפני כל מספר.",
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-what", title: "מהו רכוש קבוע לפי התקן" },
    { id: "concepts", title: "עלות, פחת, ערך בספרים — ואיך הם מתחברים" },
  ],
  exercises: [
    choice(
      "classify-stock",
      "סיווג פריט",
      "חנות מחשבים קנתה 20 מחשבים כדי למכור אותם ללקוחות. האם הם רכוש קבוע של החנות?",
      ["כן — הם מוחשיים וישמשו יותר משנה", "לא — הם מלאי, כי הם מוחזקים כדי למכור"],
      1,
      "רכוש קבוע מוחזק כדי להשתמש בו בפעילות — לא כדי למכור. מה שקונים כדי למכור הוא מלאי.",
    ),
    choice(
      "classify-laptop",
      "סיווג פריט",
      "משרד רואי חשבון קנה מחשב נייד לעובדת, שתשתמש בו בעבודתה ארבע שנים. איך מסווגים אותו?",
      ["רכוש קבוע", "הוצאה של התקופה", "מלאי"],
      0,
      "הוא מוחשי, מוחזק כדי להשתמש בו בעבודה, וישמש יותר מתקופה אחת — שלושת התנאים מתקיימים.",
    ),
    Q["machine-cost"],
    Q["machine-buy"],
    Q["annual-dep"],
    Q.carrying,
  ],
  traps: [
    {
      id: "training-cost",
      prompt: "מכונה עלתה 200,000 ₪, ההובלה שלה 5,000 ₪, והדרכת העובדים לתפעולה 8,000 ₪. מהי עלות המכונה?",
      options: ["205,000 ₪", "213,000 ₪", "200,000 ₪", "208,000 ₪"],
      answer: 0,
      why: "בעלות נכלל מה שנדרש כדי להביא את המכונה למקומה ולמצב שמיש: מחיר + הובלה = 205,000 ₪. ההדרכה — הוצאה.",
      traps: [
        "",
        "המלכודת: הדרכת עובדים אינה מביאה את המכונה למצב שמיש — היא הוצאה של התקופה.",
        "חסרה ההובלה: היא חלק מהבאת המכונה למקומה, ולכן נכללת בעלות.",
        "הפוך: את ההדרכה צריך להשאיר בחוץ, ואת ההובלה — להכניס.",
      ],
    },
    {
      id: "carrying-vs-cost",
      prompt: "מכונה בעלות 50,000 ₪, והפחת שנצבר עליה עד היום 20,000 ₪. מה הערך שלה בספרים?",
      options: ["30,000 ₪", "50,000 ₪", "70,000 ₪", "20,000 ₪"],
      answer: 0,
      why: "ערך בספרים = עלות − פחת נצבר = 50,000 − 20,000 = 30,000 ₪.",
      traps: ["", "זו העלות המקורית — הערך בספרים הוא העלות פחות הפחת שנצבר.", "פחת נצבר מקטין את הנכס, לא מגדיל אותו.", "זה הפחת שנצבר — לא מה שנשאר בספרים."],
    },
  ],
  tips: [
    "רכוש קבוע: מוחשי, מוחזק כדי להשתמש בו, וישמש יותר מתקופה אחת.",
    "בעלות — כל מה שנדרש כדי להביא את הנכס למקומו ולמצב שמיש. הדרכה, פרסום והפסדי הרצה — הוצאה.",
    "סכום בר-פחת = עלות − ערך גרט.",
    "ערך בספרים = עלות − פחת נצבר.",
    "קרקע לא מופחתת.",
  ],
};
