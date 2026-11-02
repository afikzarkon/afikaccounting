import type { StudyModule } from "../../types";
import { depEntryQ, MID, midYearQ } from "../depreciation";
import { MACHINE, machineQuestions } from "../intro";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "../shared";

const Q = machineQuestions(MACHINE);
/** A truck depreciated at a rate, from the middle of a year. */
export const TRUCK = { cost: 40_000, rate: 0.25, startMonth: 7, year: 2022 };
const truckAnnual = TRUCK.cost * TRUCK.rate;
const monthsFirst = 13 - TRUCK.startMonth;
/** Accumulated depreciation after so many years of use. */
const truckAccum = (years: number) => truckAnnual * years;
/** A machine ready before it was first used. */
export const READY = { cost: 360_000, life: 6, bought: 2, ready: 5, used: 7 };

/** Lesson 3: when depreciation starts, the straight line, rates, part years, the entry, carrying amount, and land. */
export const STRAIGHT: StudyModule = {
  slug: "ias16-straight",
  course: COURSE,
  n: 3,
  title: "פחת בקו ישר",
  description: "מתי מתחילים להפחית, פחת שנתי, המרה בין שנים לאחוזים, שנה חלקית, פחת נצבר וערך בספרים — וקרקע שלא מופחתת.",
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-available", title: "מתי מתחילים: היום שבו הנכס זמין לשימוש" },
    { id: "concepts", title: "עלות, פחת, ערך בספרים — ואיך הם מתחברים" },
    { id: "ppe-rate", title: "משנים לאחוזים, ומאחוזים לשנים" },
    { id: "ppe-sl", title: "קו ישר: שנה מלאה, שנה חלקית ושיעור באחוזים" },
    { id: "ppe-land", title: "קרקע ומבנה: מפרידים לפני שמפחיתים" },
  ],
  exercises: [
    depEntryQ({ cost: 120_000, salvage: 20_000, life: 5 }),
    Q["annual-dep"],
    Q.carrying,
    midYearQ(MID),
    calc(
      "rate-first",
      "שיעור באחוזים, שנה חלקית",
      `משאית נקנתה ונכנסה לשימוש ב-1.${TRUCK.startMonth}.${TRUCK.year} ב-${fmt(TRUCK.cost)} ₪. שיעור הפחת ${TRUCK.rate * 100}% לשנה, בקו ישר. מה הפחת לשנת ${TRUCK.year}?`,
      (truckAnnual * monthsFirst) / 12,
      [`פחת שנתי: ${fmt(TRUCK.cost)} × ${TRUCK.rate * 100}% = ${fmt(truckAnnual)} ₪.`, `ב-${TRUCK.year} — ${monthsFirst} חודשים: ${fmt(truckAnnual)} × ${monthsFirst}/12 = ${fmt((truckAnnual * monthsFirst) / 12)} ₪.`],
    ),
    calc(
      "rate-accum",
      "פחת נצבר",
      `משאית ב-${fmt(TRUCK.cost)} ₪ נכנסה לשימוש ב-1.${TRUCK.startMonth}.${TRUCK.year}; שיעור הפחת ${TRUCK.rate * 100}% לשנה בקו ישר. מה הפחת הנצבר ב-31.12.${TRUCK.year + 2}?`,
      truckAccum(2.5),
      [`מ-1.${TRUCK.startMonth}.${TRUCK.year} עד 31.12.${TRUCK.year + 2}: שנתיים וחצי.`, `${fmt(TRUCK.cost)} × ${TRUCK.rate * 100}% × 2.5 = ${fmt(truckAccum(2.5))} ₪.`],
    ),
    calc(
      "ready-date",
      "זמין לשימוש",
      `מכונה ב-${fmt(READY.cost)} ₪, ${READY.life} שנות חיים, בלי ערך גרט. היא נקנתה ב-1.${READY.bought}, הייתה זמינה לשימוש ב-1.${READY.ready}, אבל בגלל שביתה התחילה לעבוד רק ב-1.${READY.used}. מה הפחת של השנה?`,
      ((READY.cost / READY.life) * (13 - READY.ready)) / 12,
      [
        `מפחיתים מהיום שבו המכונה זמינה לשימוש — 1.${READY.ready}: ${13 - READY.ready} חודשים. השביתה לא דוחה את הפחת.`,
        `${fmt(READY.cost)} ÷ ${READY.life} × ${13 - READY.ready}/12 = ${fmt(((READY.cost / READY.life) * (13 - READY.ready)) / 12)} ₪.`,
      ],
    ),
    choice(
      "fiscal-years",
      "שנות כספים",
      "מכונה עם 5 שנות חיים נכנסה לשימוש ב-1.4.2025. בכמה דוחות שנתיים יופיע פחת שלה?",
      ["6", "5", "4", "7"],
      0,
      "2025 (9 חודשים), 2026–2029 (ארבע שנים מלאות), ו-2030 (3 חודשים) — שש שנות כספים.",
    ),
    choice("land", "קרקע", "חברה קנתה קרקע ועליה מבנה. מה מופחת?", ["רק המבנה", "הקרקע והמבנה יחד", "שניהם, כל אחד באורך חיים משלו"], 0, "לקרקע אין אורך חיים מוגבל, ולכן היא לא מופחתת. מפרידים את העלות ומפחיתים רק את המבנה."),
  ],
  traps: [
    {
      id: "start-date",
      prompt: "מכונה שולמה ב-1.2, הותקנה והייתה מוכנה לשימוש ב-1.5, והחלה לייצר רק ב-1.7. ממתי מחשבים פחת?",
      options: ["מ-1.2, יום התשלום", "מ-1.5, היום שבו הייתה מוכנה לשימוש", "מ-1.7, היום שבו החלה לייצר"],
      answer: 1,
      why: "פחת מתחיל כשהנכס זמין לשימוש — במקומו ובמצב שבו הוא יכול לפעול — גם אם עוד לא התחילו להשתמש בו.",
      traps: ["יום התשלום לא קובע: המכונה עוד לא הייתה מותקנת ומוכנה.", "", "המלכודת: לא מחכים לשימוש בפועל. מוכנה לשימוש — מתחילים להפחית."],
    },
    {
      id: "idle",
      prompt: "בשנה מסוימת מכונה עמדה מושבתת שלושה חודשים, בהמתנה לחלקי חילוף. היא מופחתת בקו ישר. מה עושים עם הפחת של החודשים האלה?",
      options: ["ממשיכים להפחית כרגיל", "עוצרים את הפחת עד שהמכונה חוזרת לעבוד"],
      answer: 0,
      why: "פחת לא נעצר כשהנכס עומד. בקו ישר מפחיתים לפי הזמן, לא לפי השימוש.",
      traps: ["", "המלכודת: פחת בקו ישר לא תלוי בשימוש — הוא ממשיך גם כשהמכונה עומדת."],
    },
    {
      id: "salvage-in-balance",
      prompt: "מכונה בעלות 130,000 ₪, ערך גרט 10,000 ₪, 3 שנות חיים בקו ישר. מה העלות המופחתת בסוף חייה?",
      options: ["10,000 ₪", "0", "130,000 ₪", "40,000 ₪"],
      answer: 0,
      why: "מפחיתים רק את הסכום בר-הפחת (120,000). ערך הגרט לא מופחת — הוא מה שנשאר בספרים בסוף.",
      traps: ["", "המלכודת: הפחתתם גם את הגרט. בסוף החיים נשאר בדיוק ערך הגרט.", "זו העלות — בלי שום פחת.", "זה הפחת השנתי, לא מה שנשאר."],
    },
  ],
  tips: [
    "פחת מתחיל ביום שבו הנכס זמין לשימוש — לא ביום התשלום ולא ביום השימוש בפועל — ולא נעצר כשהנכס עומד.",
    "קו ישר: (עלות − ערך גרט) ÷ שנות חיים. שיעור באחוזים — × עלות.",
    "המרה: שיעור = 100% ÷ שנות חיים; שנות חיים = 100% ÷ שיעור. 4 שנים = 25%, 5 = 20%, 8 = 12.5%, 10 = 10%.",
    "שנה חלקית: × חודשים/12. נכס ל-5 שנים שנכנס באמצע שנה מופיע ב-6 שנות כספים.",
    "פקודה: ח׳ הוצאות פחת / ז׳ פחת נצבר. ערך בספרים = עלות − פחת נצבר; בסוף החיים — ערך הגרט.",
    "קרקע לא מופחתת: מפרידים אותה מהמבנה, לפי האחוז שבשאלה.",
  ],
};
