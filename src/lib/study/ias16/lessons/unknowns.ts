import type { StudyModule } from "../../types";
import { VAN, VAN_ANNUAL, VAN_SALE, VAN_SALE_RESULT } from "../bakery";
import { calc, COURSE, COURSE_HREF, fmt } from "../shared";

/**
 * Lesson 13's worked examples, one family each. Every unknown is the answer
 * of one forward formula with one blank: the screens write the formula, fill
 * what is given, and solve for the rest.
 */

/** Depreciation: from the accumulated depreciation and the dates, to the life. */
export const UNK_LIFE = { cost: 300_000, readyMonth: 7, from: 2023, to: 2025, accumulated: 75_000 };
export const unkLifeMonths = (UNK_LIFE.to - UNK_LIFE.from) * 12 + (13 - UNK_LIFE.readyMonth);
export const unkLifeAnnual = (UNK_LIFE.accumulated / unkLifeMonths) * 12;
export const unkLife = UNK_LIFE.cost / unkLifeAnnual;

/** Depreciation: from the yearly charge to the salvage value. */
export const UNK_SALVAGE = { cost: 200_000, life: 8, annual: 22_500 };
export const unkSalvage = UNK_SALVAGE.cost - UNK_SALVAGE.annual * UNK_SALVAGE.life;

/** Methods: the first year's charge by the sum of the years' digits, to the salvage value. */
export const UNK_SYD = { cost: 110_000, life: 4, first: 40_000 };
export const unkSydDigits = (UNK_SYD.life * (UNK_SYD.life + 1)) / 2;
export const unkSydBase = (UNK_SYD.first * unkSydDigits) / UNK_SYD.life;
export const unkSydSalvage = UNK_SYD.cost - unkSydBase;

/** Events: an exchange's gain, to the cost of the asset received. */
export const UNK_SWAP = { carrying: 70_000, gain: 12_000, cashPaid: 30_000 };
export const unkSwapFair = UNK_SWAP.carrying + UNK_SWAP.gain;
export const unkSwapCost = unkSwapFair + UNK_SWAP.cashPaid;

/** Events: the charge after a renovation, to its cost. */
export const UNK_RENO = { carrying: 50_000, annual: 15_000, lifeLeft: 6 };
export const unkRenoBase = UNK_RENO.annual * UNK_RENO.lifeLeft;
export const unkReno = unkRenoBase - UNK_RENO.carrying;

/** Revaluation: the charge after it, to the surplus it created. */
export const UNK_REVAL = { carrying: 400_000, annual: 24_000, lifeLeft: 20 };
export const unkRevalFair = UNK_REVAL.annual * UNK_REVAL.lifeLeft;
export const unkRevalSurplus = unkRevalFair - UNK_REVAL.carrying;

/** Revaluation of land: a loss, to the value before the fall. */
export const UNK_LAND = { surplus: 30_000, loss: 12_000, after: 260_000 };
export const unkLandBefore = UNK_LAND.after + UNK_LAND.surplus + UNK_LAND.loss;

/** Two unknowns in a row: the bakery's truck — from the loss on its sale, to the accumulated depreciation, to how long it was used. */
export const unkTwoCarrying = VAN_SALE.proceeds - VAN_SALE_RESULT;
export const unkTwoAccum = VAN.cost - unkTwoCarrying;
export const unkTwoMonths = (unkTwoAccum / VAN_ANNUAL) * 12;

/** Lesson 13: questions that give a result and ask for what made it — one method, four families, and two unknowns in a row. */
export const UNKNOWNS: StudyModule = {
  slug: "ias16-unknowns",
  course: COURSE,
  n: 13,
  title: "שאלות עם נעלמים",
  description: "השאלה נותנת את התוצאה ומבקשת את הנתון: שיטה אחת — כותבים קדימה, ממלאים הפוך — וארבע משפחות של נעלמים: בפחת, בשיטות, באירועים ובהערכה מחדש. ובסוף: שני נעלמים ברצף.",
  goal: "לחלץ כל נתון חסר בשאלת רכוש קבוע — גם כשהוא קבור שני צעדים אחורה.",
  outcomes: [
    "לכתוב לכל נתון שנתון את הנוסחה שהייתה מחשבת אותו, ולמצוא בה את מה שחסר",
    "לחלץ אורך חיים, ערך גרט, עלות ותאריך מתוך פחת שנתון",
    "לחלץ שווי הוגן, תמורה או עלות שיפוץ מתוך רווח או פחת שנתונים",
    "לחלץ שווי הוגן וקרן הערכה מחדש מתוך הפחת שאחרי ההערכה",
    "לפתור שאלה שבה נעלם אחד מוביל לנעלם הבא",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-unk-method", title: "השיטה: כותבים קדימה, ממלאים הפוך" },
    { id: "ppe-unk-dep", title: "נעלמים בפחת: חיים, גרט, עלות ותאריך" },
    { id: "ppe-unk-methods", title: "נעלמים בשיטות: ספרות, יתרה פוחתת ותפוקה" },
    { id: "ppe-unk-events", title: "נעלמים באירועים: מכירה, החלפה ושיפוץ" },
    { id: "ppe-unk-reval", title: "נעלמים בהערכה מחדש" },
    { id: "ppe-unk-two", title: "שני נעלמים ברצף" },
  ],
  exercises: [
    calc(
      "unk-life",
      "אורך חיים",
      `מכונה בעלות ${fmt(UNK_LIFE.cost)} ₪ נכנסה לשימוש ב-1.${UNK_LIFE.readyMonth}.${UNK_LIFE.from}, ומופחתת בקו ישר בלי ערך גרט. ב-31.12.${UNK_LIFE.to} הפחת הנצבר שלה ${fmt(UNK_LIFE.accumulated)} ₪. מה אורך החיים שלה, בשנים?`,
      unkLife,
      [
        `מ-1.${UNK_LIFE.readyMonth}.${UNK_LIFE.from} עד 31.12.${UNK_LIFE.to}: ${unkLifeMonths} חודשים.`,
        `פחת נצבר = פחת שנתי × חודשים/12. לכן פחת שנתי = ${fmt(UNK_LIFE.accumulated)} ÷ ${unkLifeMonths} × 12 = ${fmt(unkLifeAnnual)} ₪.`,
        `פחת שנתי = עלות ÷ חיים. לכן חיים = ${fmt(UNK_LIFE.cost)} ÷ ${fmt(unkLifeAnnual)} = ${fmt(unkLife)} שנים.`,
      ],
    ),
    calc(
      "unk-salvage",
      "ערך גרט",
      `מכונה בעלות ${fmt(UNK_SALVAGE.cost)} ₪ מופחתת בקו ישר על ${UNK_SALVAGE.life} שנים, ${fmt(UNK_SALVAGE.annual)} ₪ בשנה. מה ערך הגרט שלה?`,
      unkSalvage,
      [
        `פחת שנתי = (עלות − גרט) ÷ חיים. לכן עלות − גרט = ${fmt(UNK_SALVAGE.annual)} × ${UNK_SALVAGE.life} = ${fmt(UNK_SALVAGE.annual * UNK_SALVAGE.life)} ₪.`,
        `גרט = ${fmt(UNK_SALVAGE.cost)} − ${fmt(UNK_SALVAGE.annual * UNK_SALVAGE.life)} = ${fmt(unkSalvage)} ₪.`,
      ],
    ),
    calc(
      "unk-syd",
      "גרט מסכום ספרות",
      `מכונה בעלות ${fmt(UNK_SYD.cost)} ₪, ${UNK_SYD.life} שנות חיים, בסכום ספרות השנים (יורד). הפחת בשנה הראשונה היה ${fmt(UNK_SYD.first)} ₪. מה ערך הגרט?`,
      unkSydSalvage,
      [
        `סכום הספרות: ${Array.from({ length: UNK_SYD.life }, (_, i) => i + 1).join(" + ")} = ${unkSydDigits}. בשנה הראשונה המונה ${UNK_SYD.life}.`,
        `פחת שנה 1 = (עלות − גרט) × ${UNK_SYD.life}/${unkSydDigits}. לכן עלות − גרט = ${fmt(UNK_SYD.first)} × ${unkSydDigits}/${UNK_SYD.life} = ${fmt(unkSydBase)} ₪.`,
        `גרט = ${fmt(UNK_SYD.cost)} − ${fmt(unkSydBase)} = ${fmt(unkSydSalvage)} ₪.`,
      ],
    ),
    calc(
      "unk-swap",
      "עלות הנכס שהתקבל",
      `בהחלפה עם מהות מסחרית, העלות המופחתת של הנכס שנמסר ביום ההחלפה הייתה ${fmt(UNK_SWAP.carrying)} ₪, והחברה שילמה בנוסף ${fmt(UNK_SWAP.cashPaid)} ₪ במזומן. נרשם רווח מההחלפה של ${fmt(UNK_SWAP.gain)} ₪. מה עלות הנכס שהתקבל?`,
      unkSwapCost,
      [
        `רווח = שווי הוגן של מה שנמסר − עלות מופחתת. לכן שווי הוגן = ${fmt(UNK_SWAP.carrying)} + ${fmt(UNK_SWAP.gain)} = ${fmt(unkSwapFair)} ₪.`,
        `עלות הנכס שהתקבל = שווי הוגן של מה שנמסר + מזומן ששולם: ${fmt(unkSwapFair)} + ${fmt(UNK_SWAP.cashPaid)} = ${fmt(unkSwapCost)} ₪.`,
      ],
    ),
    calc(
      "unk-reno",
      "עלות שיפוץ",
      `העלות המופחתת של מבנה ביום השיפוץ הייתה ${fmt(UNK_RENO.carrying)} ₪. אחרי השיפוץ הוא מופחת ${fmt(UNK_RENO.annual)} ₪ בשנה, על ${UNK_RENO.lifeLeft} השנים שנותרו, בלי ערך גרט. כמה עלה השיפוץ?`,
      unkReno,
      [
        `פחת חדש = בסיס חדש ÷ שנים שנותרו. לכן בסיס חדש = ${fmt(UNK_RENO.annual)} × ${UNK_RENO.lifeLeft} = ${fmt(unkRenoBase)} ₪.`,
        `בסיס חדש = עלות מופחתת + שיפוץ. לכן שיפוץ = ${fmt(unkRenoBase)} − ${fmt(UNK_RENO.carrying)} = ${fmt(unkReno)} ₪.`,
      ],
    ),
    calc(
      "unk-reval",
      "קרן מהפחת החדש",
      `מבנה הוערך מחדש לראשונה, בשיטת האיפוס. העלות המופחתת שלו לפני ההערכה ${fmt(UNK_REVAL.carrying)} ₪. אחרי ההערכה הוא מופחת ${fmt(UNK_REVAL.annual)} ₪ בשנה, על ${UNK_REVAL.lifeLeft} השנים שנותרו, בלי ערך גרט. כמה נזקף לקרן הערכה מחדש?`,
      unkRevalSurplus,
      [
        `פחת חדש = שווי הוגן ÷ שנים שנותרו. לכן שווי הוגן = ${fmt(UNK_REVAL.annual)} × ${UNK_REVAL.lifeLeft} = ${fmt(unkRevalFair)} ₪.`,
        `עלייה ראשונה — כולה לקרן: ${fmt(unkRevalFair)} − ${fmt(UNK_REVAL.carrying)} = ${fmt(unkRevalSurplus)} ₪.`,
      ],
    ),
    calc(
      "unk-land",
      "שווי קודם של קרקע",
      `לקרקע במודל הערכה מחדש הייתה קרן של ${fmt(UNK_LAND.surplus)} ₪. בהערכה הבאה ערכה ירד ל-${fmt(UNK_LAND.after)} ₪, ונרשם הפסד ברווח והפסד של ${fmt(UNK_LAND.loss)} ₪. מה היה שוויה לפני הירידה?`,
      unkLandBefore,
      [
        `ירידה — קודם מהקרן (עד שהיא מתאפסת), והשאר להפסד. נרשם הפסד, ולכן כל הקרן נוצלה: ${fmt(UNK_LAND.surplus)} ₪.`,
        `הירידה כולה: ${fmt(UNK_LAND.surplus)} + ${fmt(UNK_LAND.loss)} = ${fmt(UNK_LAND.surplus + UNK_LAND.loss)} ₪.`,
        `השווי הקודם: ${fmt(UNK_LAND.after)} + ${fmt(UNK_LAND.surplus + UNK_LAND.loss)} = ${fmt(unkLandBefore)} ₪.`,
      ],
    ),
    calc(
      "unk-two",
      "שני נעלמים ברצף",
      `משאית בעלות ${fmt(VAN.cost)} ₪ מופחתת ${VAN.rate * 100}% לשנה בקו ישר, בלי ערך גרט. ב-1.${VAN_SALE.month}.${VAN_SALE.year} היא נמכרה ב-${fmt(VAN_SALE.proceeds)} ₪, ונרשם הפסד הון של ${fmt(-VAN_SALE_RESULT)} ₪. כמה חודשים היא הופחתה עד יום המכירה?`,
      unkTwoMonths,
      [
        `נעלם 1 — העלות המופחתת ביום המכירה: הפסד = עלות מופחתת − תמורה, ולכן עלות מופחתת = ${fmt(VAN_SALE.proceeds)} + ${fmt(-VAN_SALE_RESULT)} = ${fmt(unkTwoCarrying)} ₪.`,
        `נעלם 2 — הפחת הנצבר: ${fmt(VAN.cost)} − ${fmt(unkTwoCarrying)} = ${fmt(unkTwoAccum)} ₪.`,
        `פחת שנתי ${fmt(VAN_ANNUAL)} ₪, ולכן חודשים = ${fmt(unkTwoAccum)} ÷ ${fmt(VAN_ANNUAL)} × 12 = ${fmt(unkTwoMonths)} — המשאית נכנסה לשימוש ב-1.${VAN.readyMonth}.${VAN.from}.`,
      ],
    ),
  ],
  traps: [
    {
      id: "unk-start",
      prompt: "שאלה נותנת פחת נצבר ומבקשת אורך חיים. מה הצעד הראשון?",
      options: ["לכתוב את החישוב הרגיל של פחת נצבר, ולסמן בו מה חסר", "לחלק את העלות בפחת הנצבר", "לנחש אורך חיים ולבדוק", "לחפש בשאלה את אורך החיים"],
      answer: 0,
      why: "נעלם הוא תמיד חלק מחישוב קדימה. כותבים את החישוב — עלות, פחת שנתי, חודשים, פחת נצבר — ורק אז רואים מה חסר.",
      traps: ["", "המלכודת: עלות ÷ פחת נצבר נותנת מספר — אבל לא את אורך החיים, אלא אם עברה שנה אחת בדיוק.", "ניחוש עובד לפעמים, אבל לא בבחינה עם תאריכים באמצע שנה.", "אם הוא היה נתון — הוא לא היה נעלם."],
    },
    {
      id: "unk-months",
      prompt: "מכונה נכנסה לשימוש ב-1.7.2023. בחישוב הפוך של פחת נצבר ב-31.12.2025 — כמה שנים מכניסים?",
      options: ["2.5", "3", "2", "2.25"],
      answer: 0,
      why: "חצי שנה ב-2023, ושנתיים מלאות — 30 חודשים, שהם 2.5 שנים.",
      traps: ["", "המלכודת: ספרתם שנות כספים (2023, 2024, 2025) במקום חודשים.", "שכחתם את החצי השנה של 2023.", "אין רבעים כאן: מיולי עד דצמבר — שישה חודשים."],
    },
  ],
  tips: [
    "כל נעלם הוא חלק מחישוב רגיל. כותבים את החישוב קדימה, ממלאים את מה שנתון — ונשארת משוואה אחת.",
    "מפחת אל עלות או חיים: פחת שנתי = (עלות − גרט) ÷ חיים — ובשנה חלקית, × חודשים/12.",
    "מרווח אל שווי: רווח = שווי (או תמורה) − עלות מופחתת.",
    "מפחת חדש אל שיפוץ או קרן: פחת חדש × שנים שנותרו = הבסיס החדש (בתוספת גרט, אם יש).",
    "שני נעלמים: פותרים אחד, ומכניסים אותו כנתון לחישוב הבא.",
  ],
};
