import { LOGI_Q, logi, PRESS_Q, press } from "@/lib/learn/ias16-exams";
import type { StudyModule } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "../shared";

const P = press();
const L = logi();
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Lesson 12: two exam-level questions — each asked, then solved step by step — and their answers to check one by one. */
export const EXAMS: StudyModule = {
  slug: "ias16-exams",
  course: COURSE,
  n: 12,
  title: "שתי שאלות ברמת מבחן",
  description: "שתי שאלות מלאות, כמו במבחן: ״הדפוס הירוק״ — עלות שורה אחר שורה, שלושה רכיבים בשלוש שיטות, שיפור והחלפה; ״לוגיסטיקה צפונית״ — מבנה וקרקע בהערכה מחדש עד המכירה, ומשאיות שאחת מהן נמכרת.",
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-press", title: "שאלה 1: הדפוס הירוק" },
    { id: "ppe-press-solve", title: "שאלה 1: הפתרון" },
    { id: "ppe-logi", title: "שאלה 2: לוגיסטיקה צפונית" },
    { id: "ppe-logi-solve", title: "שאלה 2: הפתרון" },
  ],
  exercises: [
    calc("press-cost", "דפוס: עלות המכונה", "שאלה 1 (הדפוס הירוק): מהי עלות המכונה?", P.cost, [
      `מחיר ${fmt(PRESS_Q.price)} + הובלה ${fmt(PRESS_Q.transport)} + התקנה ${fmt(PRESS_Q.install)} + עובדי החברה ${PRESS_Q.staffHours} × ${PRESS_Q.hourly} + בדיקות ${fmt(PRESS_Q.testing)} + יועצים להתקנה ${fmt(P.consultantsIn)}.`,
      `סה״כ ${fmt(P.cost)} ₪. ההדרכה, ההשקה ויועצי ההחלטה — הוצאה (${fmt(P.expensed2024)} ₪).`,
    ]),
    calc("press-head", "דפוס: ראש ההדפסה 2025", "שאלה 1: מה הפחת של ראש ההדפסה בשנת 2025?", P.head[1], [
      `שנות החיים מתחילות ב-1.4: השנה הראשונה ${fmt(P.headLife[0])} ₪, השנייה ${fmt(P.headLife[1])} ₪.`,
      `2025 = 3 חודשים מהראשונה + 9 מהשנייה: ${fmt(P.head[1])} ₪.`,
    ]),
    calc("press-rate", "דפוס: פחת לשעה אחרי השיפור", "שאלה 1: מה הפחת לשעת מנוע אחרי השיפור?", P.rate2, [
      `ערך בספרים ביום השיפור ${fmt(P.motorCarryingAtImprovement)} + שיפור ${fmt(PRESS_Q.improvement)} − גרט ${fmt(PRESS_Q.motor.salvage)}.`,
      `÷ (${fmt(P.hoursLeft)} + ${fmt(PRESS_Q.extraHours)}) שעות = ${fmt(P.rate2)} ₪ לשעה.`,
    ]),
    calc("press-dep2025", "דפוס: פחת 2025", "שאלה 1: מהן הוצאות הפחת של המכונה בשנת 2025?", P.dep[1], [
      `ראש ${fmt(P.head[1])} + שלדה ${fmt(P.frame[1])} + מנוע ${fmt(P.motor[1])} = ${fmt(P.dep[1])} ₪.`,
    ]),
    calc("press-gain", "דפוס: רווח מההחלפה", "שאלה 1: מה הרווח מעסקת ההחלפה?", r2(P.gain), [
      `ערך בספרים ב-31.12.2025: ${fmt(P.cost2025)} − ${fmt(P.accum2025)} = ${fmt(P.carrying2025)} ₪.`,
      `רווח: ${fmt(PRESS_Q.fairValue)} − ${fmt(P.carrying2025)} = ${fmt(P.gain)} ₪.`,
    ]),
    journal(
      "press-swap",
      "דפוס: פקודת ההחלפה",
      `שאלה 1: רשמו את פקודת ההחלפה ב-31.12.2025. עלות המכונה (כולל השיפור) ${fmt(P.cost2025)} ₪, פחת נצבר ${fmt(P.accum2025)} ₪, שווי הוגן ${fmt(PRESS_Q.fairValue)} ₪, והחברה קיבלה ${fmt(PRESS_Q.cashIn)} ₪ במזומן.`,
      [
        { account: "נכס חדש — עלות", dr: P.newCost },
        { account: "מזומן", dr: PRESS_Q.cashIn },
        { account: "פחת נצבר — נכס ישן", dr: P.accum2025 },
        { account: "נכס ישן — עלות מקורית", cr: P.cost2025 },
        { account: "רווח מהחלפת נכסים", cr: P.gain },
      ],
      `המכונה החדשה: ${fmt(PRESS_Q.fairValue)} − ${fmt(PRESS_Q.cashIn)} = ${fmt(P.newCost)} ₪. הישנה יוצאת כולה, וההפרש — ${fmt(P.gain)} ₪ — רווח.`,
      ["נכס חדש — עלות", "מזומן", "פחת נצבר — נכס ישן", "נכס ישן — עלות מקורית", "רווח מהחלפת נכסים", "הוצאות פחת"],
    ),
    calc("logi-cost", "לוגיסטיקה: עלות המבנה", "שאלה 2 (לוגיסטיקה צפונית): מה העלות שתופחת (בלי הקרקע)?", L.buildingCost, [
      `עלות: ${fmt(LOGI_Q.price)} × ${100 + (LOGI_Q.purchaseTax + LOGI_Q.lawyer) * 100}% = ${fmt(L.cost)} ₪.`,
      `קרקע ${LOGI_Q.land * 100}%: ${fmt(L.landCost)}; מבנה: ${fmt(L.buildingCost)} ₪.`,
    ]),
    calc("logi-surplus2023", "לוגיסטיקה: קרן 2023", "שאלה 2: מה יתרת קרן הערכה מחדש (מבנה וקרקע) ב-31.12.2023?", L.oci2023, [
      `מבנה: ${fmt(L.fair2023.building)} − ${fmt(L.carrying2023)} = ${fmt(L.surplusBuilding2023)}.`,
      `קרקע: ${fmt(L.fair2023.land)} − ${fmt(L.landCost)} = ${fmt(L.surplusLand2023)}. סה״כ ${fmt(L.oci2023)} ₪.`,
    ]),
    calc("logi-loss2024", "לוגיסטיקה: הפסד 2024", "שאלה 2: כמה הפסד מירידת ערך נרשם ברווח או הפסד ב-2024?", L.landLoss, [
      `המבנה ירד ב-${fmt(L.buildingFall)} — פחות מהקרן שלו (${fmt(L.surplusBuildingBefore)}): הכול מהקרן.`,
      `הקרקע ירדה ב-${fmt(L.landFall)}: ${fmt(L.surplusLand2023)} מהקרן, ${fmt(L.landLoss)} ₪ — הפסד.`,
    ]),
    calc("logi-sale", "לוגיסטיקה: רווח ממכירת הנכס", "שאלה 2: מה הרווח ממכירת המבנה והקרקע ב-1.1.2025?", L.saleGain, [
      `ערך בספרים (שווי הוגן אחרון): ${fmt(L.carryingAtSale)} ₪; תמורה ${fmt(LOGI_Q.salePrice)} ₪.`,
      `רווח: ${fmt(L.saleGain)} ₪. הקרן — ${fmt(L.surplusAtSale)} ₪ — לעודפים.`,
    ]),
    calc("logi-truck", "לוגיסטיקה: מכירת משאית", "שאלה 2: מה ההפסד ממכירת המשאית?", L.truck.result < 0 ? -L.truck.result : L.truck.result, [
      `פחת נצבר עד המכירה: ${fmt(L.truck.soldAccum)} ₪; ערך בספרים ${fmt(L.truck.soldCarrying)} ₪.`,
      `תמורה ${fmt(LOGI_Q.trucks.salePrice)} ₪ — הפסד של ${fmt(-L.truck.result)} ₪.`,
    ]),
    choice(
      "press-strike",
      "דפוס: השביתה",
      "בשאלה 1, ממתי מפחיתים את המכונה?",
      ["מ-1.4.2024 — היום שבו הייתה זמינה לשימוש", "מ-1.6.2024 — כשהתחילה לייצר", "מ-1.1.2024 — יום הרכישה"],
      0,
      "השביתה עיכבה את השימוש, לא את הזמינות. פחת מהיום שבו המכונה מוכנה לפעול.",
    ),
  ],
  traps: [
    {
      id: "logi-land-loss",
      prompt: "בשאלה 2, הקרקע ירדה ב-116,000 ₪ ב-2024, והקרן שלה 46,000 ₪. הקרן של המבנה עדיין חיובית. כמה הפסד ברווח או הפסד?",
      options: ["70,000 ₪", "0 — הקרן של המבנה סופגת", "116,000 ₪", "46,000 ₪"],
      answer: 0,
      why: "כל נכס עם הקרן שלו: הירידה בקרקע סופגת רק את הקרן של הקרקע (46,000), והשאר — 70,000 ₪ — הפסד.",
      traps: ["", "המלכודת: קרן של נכס אחד לא סופגת ירידה של נכס אחר.", "קודם מאפסים את הקרן של הקרקע עצמה.", "זה החלק שהקרן ספגה — לא ההפסד."],
    },
    {
      id: "press-consultants",
      prompt: "בשאלה 1, היועצים קיבלו 25,000 ₪: 40% על בחירת המכונה ו-60% על ההתקנה. כמה מזה בעלות?",
      options: ["15,000 ₪", "25,000 ₪", "10,000 ₪", "0"],
      answer: 0,
      why: "רק החלק של ההתקנה הביא את המכונה למצבה: 60% × 25,000 = 15,000 ₪.",
      traps: ["", "המלכודת: הכול בעלות. הבחירה קדמה לנכס — הוצאה.", "זה החלק של הבחירה — דווקא הוא הוצאה.", "ההתקנה היא עלות ישירה."],
    },
  ],
  tips: [
    "לכל נכס — ציר זמן משלו, וטבלה לכל שנה: עלות, פחת, פחת נצבר, ערך בספרים, קרן.",
    "רכיבים: קודם העלות כולה, אחר כך החלוקה, ולכל רכיב — השיטה שלו; בסכום ספרות — שנות חיים מול שנות כספים.",
    "הערכה מחדש עם קרקע: מפצלים כל שווי הוגן לפי האחוז, ולכל חלק — קרן משלו.",
  ],
};
