import type { StudyModule } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "../shared";

/** The components screens' machine: one cost, three parts, three methods. */
export const PARTS = {
  price: 560_000,
  transport: 25_000,
  install: 15_000,
  motor: { share: 0.5, hours: 12_000, salvage: 0, used: [2_400, 3_000] },
  body: { share: 0.3, life: 10, salvage: 20_000 },
  computer: { share: 0.2, life: 4, salvage: 0 },
};
export const PARTS_COST = PARTS.price + PARTS.transport + PARTS.install;
export const partCost = (share: number) => PARTS_COST * share;
export const motorCharge = (y: number) => ((partCost(PARTS.motor.share) - PARTS.motor.salvage) * PARTS.motor.used[y]) / PARTS.motor.hours;
export const bodyCharge = (partCost(PARTS.body.share) - PARTS.body.salvage) / PARTS.body.life;
const digits = (PARTS.computer.life * (PARTS.computer.life + 1)) / 2;
export const computerCharge = (y: number) => ((partCost(PARTS.computer.share) - PARTS.computer.salvage) * (PARTS.computer.life - y)) / digits;
/** Three questions that give the answer and ask for a figure behind it. */
const LIFE = { cost: 180_000, salvage: 20_000, from: 7, charge: 8_000 };
const SALV = { cost: 240_000, life: 5, carrying: 196_000 };
const HOURS = { cost: 150_000, total: 30_000, charge: 22_500 };

/** Lesson 5: depreciation by components — why an asset is split, one machine in three parts, and the figures a question hides behind an answer. */
export const COMPONENTS: StudyModule = {
  slug: "ias16-components",
  course: COURSE,
  n: 5,
  title: "פחת לפי רכיבים",
  description: "כשלחלקים משמעותיים של נכס יש חיים שונים — כל רכיב מופחת לחוד, בשיטה שלו. מכונה אחת בשלושה רכיבים, ואיך מחלצים אורך חיים, ערך גרט או תפוקה מתוך תשובה שנתונה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-components", title: "למה מפצלים נכס לרכיבים" },
    { id: "ppe-components-table", title: "מכונה אחת, שלושה רכיבים" },
    { id: "ppe-components-back", title: "מהתשובה אל הנתון החסר" },
  ],
  exercises: [
    calc(
      "part-cost",
      "עלות רכיב",
      `מכונה נקנתה ב-${fmt(PARTS.price)} ₪; הובלה ${fmt(PARTS.transport)} ₪ והתקנה ${fmt(PARTS.install)} ₪. ${PARTS.motor.share * 100}% מהעלות מיוחסים למנוע. מהי עלות המנוע?`,
      partCost(PARTS.motor.share),
      [`קודם עלות המכונה כולה: ${fmt(PARTS.price)} + ${fmt(PARTS.transport)} + ${fmt(PARTS.install)} = ${fmt(PARTS_COST)} ₪.`, `ואז החלוקה: ${fmt(PARTS_COST)} × ${PARTS.motor.share * 100}% = ${fmt(partCost(PARTS.motor.share))} ₪.`],
    ),
    calc(
      "part-motor",
      "רכיב בתפוקה",
      `מנוע בעלות ${fmt(partCost(PARTS.motor.share))} ₪, בלי ערך גרט, מופחת לפי ${fmt(PARTS.motor.hours)} שעות עבודה. השנה עבד ${fmt(PARTS.motor.used[0])} שעות. מה הפחת?`,
      motorCharge(0),
      [`${fmt(partCost(PARTS.motor.share))} × ${fmt(PARTS.motor.used[0])}/${fmt(PARTS.motor.hours)} = ${fmt(motorCharge(0))} ₪.`],
    ),
    calc(
      "part-body",
      "רכיב בקו ישר",
      `גוף המכונה בעלות ${fmt(partCost(PARTS.body.share))} ₪, ערך גרט ${fmt(PARTS.body.salvage)} ₪, ${PARTS.body.life} שנים בקו ישר. מה הפחת השנתי?`,
      bodyCharge,
      [`(${fmt(partCost(PARTS.body.share))} − ${fmt(PARTS.body.salvage)}) ÷ ${PARTS.body.life} = ${fmt(bodyCharge)} ₪.`],
    ),
    calc(
      "part-computer",
      "רכיב בסכום ספרות",
      `מחשב הבקרה בעלות ${fmt(partCost(PARTS.computer.share))} ₪, בלי ערך גרט, ${PARTS.computer.life} שנים בסכום ספרות יורד. מה הפחת בשנה השנייה?`,
      computerCharge(1),
      [`סכום הספרות: ${digits}; בשנה השנייה המונה ${PARTS.computer.life - 1}.`, `${fmt(partCost(PARTS.computer.share))} × ${PARTS.computer.life - 1}/${digits} = ${fmt(computerCharge(1))} ₪.`],
    ),
    calc(
      "back-life",
      "אורך חיים חסר",
      `גוף מכונה בעלות ${fmt(LIFE.cost)} ₪, ערך גרט ${fmt(LIFE.salvage)} ₪, בקו ישר. הוא זמין לשימוש מ-1.${LIFE.from}, והפחת של השנה הראשונה ${fmt(LIFE.charge)} ₪. מהו אורך חייו, בשנים?`,
      (LIFE.cost - LIFE.salvage) / ((LIFE.charge * 12) / (13 - LIFE.from)),
      [
        `${fmt(LIFE.charge)} ₪ הם ${13 - LIFE.from} חודשים; לשנה מלאה: ${fmt(LIFE.charge)} × 12/${13 - LIFE.from} = ${fmt((LIFE.charge * 12) / (13 - LIFE.from))} ₪.`,
        `אורך חיים = סכום בר-פחת ÷ פחת שנתי = ${fmt(LIFE.cost - LIFE.salvage)} ÷ ${fmt((LIFE.charge * 12) / (13 - LIFE.from))} = ${(LIFE.cost - LIFE.salvage) / ((LIFE.charge * 12) / (13 - LIFE.from))} שנים.`,
      ],
    ),
    calc(
      "back-salvage",
      "ערך גרט חסר",
      `שלדה בעלות ${fmt(SALV.cost)} ₪, ${SALV.life} שנים בקו ישר. בתום השנה הראשונה העלות המופחתת ${fmt(SALV.carrying)} ₪. מהו ערך הגרט?`,
      SALV.cost - (SALV.cost - SALV.carrying) * SALV.life,
      [
        `פחת השנה: ${fmt(SALV.cost)} − ${fmt(SALV.carrying)} = ${fmt(SALV.cost - SALV.carrying)} ₪.`,
        `סכום בר-פחת: ${fmt(SALV.cost - SALV.carrying)} × ${SALV.life} = ${fmt((SALV.cost - SALV.carrying) * SALV.life)} ₪; גרט = ${fmt(SALV.cost)} − ${fmt((SALV.cost - SALV.carrying) * SALV.life)} = ${fmt(SALV.cost - (SALV.cost - SALV.carrying) * SALV.life)} ₪.`,
      ],
    ),
    calc(
      "back-hours",
      "תפוקה חסרה",
      `מנוע בעלות ${fmt(HOURS.cost)} ₪, בלי ערך גרט, מופחת לפי ${fmt(HOURS.total)} שעות. הפחת השנה ${fmt(HOURS.charge)} ₪. כמה שעות עבד?`,
      (HOURS.charge * HOURS.total) / HOURS.cost,
      [`פחת לשעה: ${fmt(HOURS.cost)} ÷ ${fmt(HOURS.total)} = ${fmt(HOURS.cost / HOURS.total)} ₪.`, `שעות: ${fmt(HOURS.charge)} ÷ ${fmt(HOURS.cost / HOURS.total)} = ${fmt((HOURS.charge * HOURS.total) / HOURS.cost)}.`],
    ),
    choice(
      "present-together",
      "הצגה",
      "מכונה מופחתת בשלושה רכיבים. איך היא מוצגת במאזן?",
      ["כפריט אחד — הפיצול הוא לחישוב הפחת", "שלוש שורות נפרדות", "רק הרכיב הגדול", "לפי שיטת הפחת"],
      0,
      "הפיצול לרכיבים נועד לחשב פחת נכון. בדוחות המכונה היא פריט אחד של רכוש קבוע.",
    ),
  ],
  traps: [
    {
      id: "split-before-costs",
      prompt: "מכונה ב-400,000 ₪, הובלה 40,000 ₪. המנוע — 25% מהעלות. מהי עלות המנוע?",
      options: ["110,000 ₪", "100,000 ₪", "140,000 ₪", "10,000 ₪"],
      answer: 0,
      why: "החלוקה לרכיבים היא של העלות כולה, אחרי שמוסיפים את מה שהוון: 440,000 × 25% = 110,000 ₪.",
      traps: ["", "המלכודת: חלוקה של המחיר בלבד. ההובלה הביאה את כל המכונה — גם את המנוע — למקומה.", "הוספתם את כל ההובלה למנוע.", "זה חלק המנוע מההובלה בלבד."],
    },
    {
      id: "same-estimates",
      prompt: "לשני חלקים משמעותיים של נכס אותו אורך חיים ואותה שיטת פחת. מה עושים?",
      options: ["אפשר להפחית אותם יחד", "חייבים להפחית כל אחד לחוד", "מפחיתים רק את הגדול", "לא מפחיתים"],
      answer: 0,
      why: "הפיצול נועד לרכיבים עם אומדני פחת שונים. אם האומדנים זהים — אין טעם להפריד.",
      traps: ["", "המלכודת: ״רכיב משמעותי = חישוב נפרד, תמיד״. כשהאומדנים זהים, התוצאה זהה גם יחד.", "שני החלקים נצרכים — שניהם מופחתים.", "כל רכיב שמשמש את החברה מופחת."],
    },
  ],
  tips: [
    "קודם עלות הנכס כולה (עם כל מה שהוון), ורק אחר כך החלוקה לרכיבים לפי האחוזים.",
    "כל רכיב — בשיטה, באורך החיים ובערך הגרט שלו. בסוף מחברים: הנכס מוצג כפריט אחד.",
    "פחת שנתי ← אורך חיים: סכום בר-פחת ÷ פחת שנתי. אל תשכחו להשלים שנה חלקית לשנה מלאה.",
    "עלות מופחתת ← גרט: פחת שנה × שנות חיים = סכום בר-פחת; גרט = עלות − סכום בר-פחת.",
    "פחת בתפוקה ← שעות: פחת ÷ (פחת לשעה).",
  ],
};
