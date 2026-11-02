import type { StudyModule } from "../../types";
import { VAN, VAN_ANNUAL, VAN_FIRST, VAN_FIRST_MONTHS } from "../bakery";
import { MID, midYearQ } from "../depreciation";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "../shared";

/** A truck depreciated at a rate, from the middle of a year. */
export const TRUCK = { cost: 40_000, rate: 0.25, startMonth: 7, year: 2022 };
const truckAnnual = TRUCK.cost * TRUCK.rate;
const monthsFirst = 13 - TRUCK.startMonth;
/** Accumulated depreciation after so many years of use. */
const truckAccum = (years: number) => truckAnnual * years;
/** A machine ready before it was first used. */
export const READY = { cost: 360_000, life: 6, bought: 2, ready: 5, used: 7 };
/** A first year read backwards: from its charge to the month the asset was ready. */
export const BACK_START = { cost: 120_000, life: 6, charge: 15_000 };
const backMonths = (BACK_START.charge / (BACK_START.cost / BACK_START.life)) * 12;

/** Lesson 4: time — when depreciation starts and stops, part years, rates, land — and the five questions to ask before any charge. */
export const STRAIGHT: StudyModule = {
  slug: "ias16-straight",
  course: COURSE,
  n: 4,
  title: "הזמן: ממתי מפחיתים, שנה חלקית ואחוזים",
  description: "מתי מתחילים להפחית, שנה חלקית, המרה בין שנים לאחוזים, קרקע שלא מופחתת — וחמש השאלות ששואלים לפני כל חישוב פחת.",
  goal: "לחשב את הפחת של כל שנת כספים — גם כשהנכס נכנס באמצע שנה, וגם כשהשאלה נותנת שיעור באחוזים.",
  outcomes: [
    "לקבוע ממתי מפחיתים: היום שבו הנכס זמין לשימוש",
    "לחשב פחת לשנה חלקית לפי מספר החודשים",
    "להמיר בין שנות חיים לשיעור פחת באחוזים",
    "להפריד קרקע ממבנה ולהפחית רק את המבנה",
    "לענות על חמש השאלות שקובעות כל חישוב פחת",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-available", title: "מתי מתחילים: היום שבו הנכס זמין לשימוש" },
    { id: "ppe-rate", title: "משנים לאחוזים, ומאחוזים לשנים" },
    { id: "ppe-sl", title: "קו ישר: שנה מלאה, שנה חלקית ושיעור באחוזים" },
    { id: "ppe-land", title: "קרקע ומבנה: מפרידים לפני שמפחיתים" },
    { id: "ppe-five-questions", title: "חמש שאלות לפני כל חישוב פחת" },
  ],
  exercises: [
    midYearQ(MID),
    calc(
      "van-first",
      "שנה ראשונה חלקית",
      `המשאית של המאפייה נקנתה ב-1.${VAN.boughtMonth}.${VAN.from} ב-${fmt(VAN.cost)} ₪, והייתה מוכנה לשימוש ב-1.${VAN.readyMonth}.${VAN.from}. שיעור הפחת ${VAN.rate * 100}% לשנה, בקו ישר, בלי ערך גרט. מה הפחת לשנת ${VAN.from}?`,
      VAN_FIRST,
      [
        `מפחיתים מהיום שבו המשאית מוכנה לשימוש — 1.${VAN.readyMonth}, לא מיום הקנייה: ${VAN_FIRST_MONTHS} חודשים.`,
        `פחת שנתי: ${fmt(VAN.cost)} × ${VAN.rate * 100}% = ${fmt(VAN_ANNUAL)} ₪.`,
        `${fmt(VAN_ANNUAL)} × ${VAN_FIRST_MONTHS}/12 = ${fmt(VAN_FIRST)} ₪.`,
      ],
    ),
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
    calc(
      "back-start",
      "מהפחת אל תאריך הכניסה",
      `הפחת לשנה הראשונה של מכונה היה ${fmt(BACK_START.charge)} ₪. עלותה ${fmt(BACK_START.cost)} ₪, ${BACK_START.life} שנות חיים, בקו ישר, בלי ערך גרט. על כמה חודשים של השנה הראשונה היא הופחתה?`,
      backMonths,
      [
        `פחת לשנה מלאה: ${fmt(BACK_START.cost)} ÷ ${BACK_START.life} = ${fmt(BACK_START.cost / BACK_START.life)} ₪.`,
        `פחת השנה = פחת שנתי × חודשים/12 — ולכן חודשים = ${fmt(BACK_START.charge)} ÷ ${fmt(BACK_START.cost / BACK_START.life)} × 12 = ${fmt(backMonths)}.`,
        `${fmt(backMonths)} חודשים עד דצמבר: המכונה נכנסה לשימוש ב-1.${13 - backMonths}.`,
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
  ],
  tips: [
    "פחת מתחיל ביום שבו הנכס זמין לשימוש — לא ביום התשלום ולא ביום השימוש בפועל — ולא נעצר כשהנכס עומד.",
    "שנה חלקית: פחת שנתי × חודשים/12. נכס ל-5 שנים שנכנס באמצע שנה מופיע ב-6 שנות כספים.",
    "שיעור באחוזים: פחת שנתי = עלות × שיעור. המרה: שיעור = 100% ÷ שנות חיים; 4 שנים = 25%, 5 = 20%, 8 = 12.5%, 10 = 10%.",
    "קרקע לא מופחתת: מפרידים אותה מהמבנה, לפי האחוז שבשאלה.",
    "לפני כל חישוב: מה העלות? מה ערך הגרט? כמה שנים או איזה שיעור? מאיזה תאריך? כמה חודשים השנה?",
  ],
};
