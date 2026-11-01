import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Practice draft — written for the owner's review. Every figure is computed here, from the question's own numbers.
export const MACHINE = { price: 100_000, transport: 4_000, install: 6_000, training: 3_000, salvage: 10_000, life: 10 };
export const machineCost = MACHINE.price + MACHINE.transport + MACHINE.install;
const machineAnnual = (machineCost - MACHINE.salvage) / MACHINE.life;
const afterYears = 3;
const carryingAfter = machineCost - afterYears * machineAnnual;

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
    calc(
      "machine-cost",
      "עלות הנכס",
      `מכונה נקנתה ב-${fmt(MACHINE.price)} ₪. ההובלה למפעל עלתה ${fmt(MACHINE.transport)} ₪, ההתקנה ${fmt(MACHINE.install)} ₪, והדרכת העובדים לתפעולה ${fmt(MACHINE.training)} ₪. מהי עלות המכונה?`,
      machineCost,
      [
        "נכלל בעלות כל מה שנדרש כדי להביא את המכונה למקומה ולמצב שבו היא מוכנה לשימוש: המחיר, ההובלה וההתקנה.",
        "הדרכת העובדים אינה מביאה את המכונה למצב שמיש — היא הוצאה של התקופה.",
        `עלות: ${fmt(MACHINE.price)} + ${fmt(MACHINE.transport)} + ${fmt(MACHINE.install)} = ${fmt(machineCost)} ₪.`,
      ],
    ),
    journal(
      "machine-buy",
      "רכישת מכונה",
      `החברה שילמה במזומן על מכונה ${fmt(MACHINE.price)} ₪, על הובלתה ${fmt(MACHINE.transport)} ₪, על ההתקנה ${fmt(MACHINE.install)} ₪ ועל הדרכת העובדים ${fmt(MACHINE.training)} ₪. רשמו את הפקודה.`,
      [
        { account: "מכונה", dr: machineCost },
        { account: "הוצאות הדרכה", dr: MACHINE.training },
        { account: "מזומן", cr: machineCost + MACHINE.training },
      ],
      `המחיר, ההובלה וההתקנה הם עלות המכונה: ${fmt(machineCost)} ₪. ההדרכה — הוצאה. במזומן יצא הכול: ${fmt(machineCost + MACHINE.training)} ₪.`,
      ["מכונה", "הוצאות הדרכה", "מזומן", "הוצאות פחת", "ספקים"],
    ),
    calc(
      "annual-dep",
      "פחת שנתי",
      `עלות המכונה ${fmt(machineCost)} ₪, ערך הגרט ${fmt(MACHINE.salvage)} ₪ ואורך החיים ${MACHINE.life} שנים, בקו ישר. מה הפחת השנתי?`,
      machineAnnual,
      [
        `סכום בר-פחת = עלות − ערך גרט: ${fmt(machineCost)} − ${fmt(MACHINE.salvage)} = ${fmt(machineCost - MACHINE.salvage)} ₪.`,
        `בקו ישר מחלקים בשנות החיים: ${fmt(machineCost - MACHINE.salvage)} ÷ ${MACHINE.life} = ${fmt(machineAnnual)} ₪ לשנה.`,
      ],
    ),
    calc(
      "carrying",
      "ערך בספרים",
      `אותה מכונה (עלות ${fmt(machineCost)} ₪, פחת שנתי ${fmt(machineAnnual)} ₪). מה הערך שלה בספרים אחרי ${afterYears} שנים?`,
      carryingAfter,
      [
        `פחת נצבר אחרי ${afterYears} שנים: ${afterYears} × ${fmt(machineAnnual)} = ${fmt(afterYears * machineAnnual)} ₪.`,
        `ערך בספרים = עלות − פחת נצבר: ${fmt(machineCost)} − ${fmt(afterYears * machineAnnual)} = ${fmt(carryingAfter)} ₪.`,
      ],
    ),
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
