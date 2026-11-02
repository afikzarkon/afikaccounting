import type { StudyModule } from "../../types";
import { OVEN, OVEN_BEFORE_UPGRADE, UPGRADE, UPGRADE_ANNUAL, UPGRADE_BASE } from "../bakery";
import { estimateQ } from "../depreciation";
import { oldRoofQ, RENO, renovationQuestions } from "../renovation";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "../shared";

const Q = renovationQuestions(RENO);
/** A part replaced inside an asset depreciated as one unit: the old part's share leaves the books. */
export const TANK = { system: 450_000, tank: 90_000, life: 5, years: 3 };
const tankAccum = (TANK.tank / TANK.life) * TANK.years;
export const TANK_LOSS = TANK.tank - tankAccum;
/** An improvement to a motor depreciated by hours. */
export const MOTOR = { carrying: 109_000, salvage: 2_000, hoursLeft: 21_400, improvement: 43_000, extraHours: 3_600 };
export const MOTOR_RATE = (MOTOR.carrying + MOTOR.improvement - MOTOR.salvage) / (MOTOR.hoursLeft + MOTOR.extraHours);

/** Lesson 8: costs after the asset is in use — maintenance, improvement, replacing a part — and a change in an estimate, taught first: a renovation is the same idea with money added. */
export const SUBSEQUENT: StudyModule = {
  slug: "ias16-renovation",
  course: COURSE,
  n: 8,
  title: "עלויות עוקבות: תחזוקה, שיפור והחלפת רכיב",
  description: "תחזוקה — הוצאה; שיפור שמאריך חיים או מגדיל תפוקה — נכנס לנכס, ומפחיתים מחדש את הבסיס החדש; רכיב שמוחלף — יוצא מהספרים; ושינוי אומדן — מכאן ולהבא.",
  goal: "לטפל בכל עלות שמגיעה אחרי שהנכס בשימוש — ולחשב מחדש את הפחת מכאן ולהבא.",
  outcomes: [
    "להבחין בין תחזוקה (הוצאה) לשיפור או להחלפת רכיב (נכנסים לנכס)",
    "לחשב פחת אחרי שינוי אומדן, בלי לתקן את העבר",
    "לחשב פחת אחרי שיפוץ: עלות מופחתת + שיפוץ, על החיים שנותרו",
    "לגרוע רכיב שהוחלף ולהכניס את החדש",
    "לחלץ את עלות השיפוץ מתוך הפחת החדש",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "renovation-distinction", title: "נכנס לנכס או הוצאה" },
    { id: "ppe-estimate", title: "שינוי אומדן — מכאן ולהבא" },
    { id: "renovation-steps", title: "שיפוץ: שלבי הפתרון" },
    { id: "ppe-upgrade-bakery", title: "התנור של המאפייה משודרג" },
    { id: "ppe-replace", title: "החלפת רכיב: הישן יוצא, החדש נכנס" },
    { id: "renovation-calculator", title: "מחשבון שיפוץ" },
  ],
  tools: [{ screen: "renovation-calculator", label: "מחשבון שיפוץ" }],
  exercises: [
    choice(
      "painting",
      "תחזוקה או שיפוץ",
      "חברה צבעה את כל המשרדים ב-60,000 ₪ — צביעה תקופתית רגילה, שחוזרת כל כמה שנים. מה הטיפול?",
      ["הוצאה של התקופה", "מוסיפים לעלות המבנה"],
      0,
      "תחזוקה שוטפת שומרת על הנכס במצבו — היא הוצאה, גם כשהסכום גדול.",
    ),
    Q["reno-capitalise"],
    Q["reno-carrying"],
    Q["reno-year"],
    oldRoofQ({ cost: 40_000, accumulated: 30_000 }),
    estimateQ({ cost: 100_000, life: 10, years: 4, left: 3 }),
    calc(
      "tank",
      "החלפת מכל",
      `מערכת ייצור בעלות ${fmt(TANK.system)} ₪ מופחתת כיחידה אחת על ${TANK.life} שנים, בלי ערך גרט. ${fmt(TANK.tank)} ₪ מהעלות הם מכל קרמיקה. אחרי ${TANK.years} שנים המכל נשבר והוחלף בחדש. מה ההפסד מגריעת הישן?`,
      TANK_LOSS,
      [
        `המכל הישן נשא חלק מהפחת: ${fmt(TANK.tank)} ÷ ${TANK.life} × ${TANK.years} = ${fmt(tankAccum)} ₪.`,
        `נשאר ממנו בספרים: ${fmt(TANK.tank)} − ${fmt(tankAccum)} = ${fmt(TANK_LOSS)} ₪ — הפסד. המכל החדש נכנס לעלות המערכת.`,
      ],
    ),
    calc(
      "motor-hours",
      "שיפור במנוע לפי שעות",
      `מנוע שמופחת לפי שעות עבודה: ערכו בספרים ביום השיפור ${fmt(MOTOR.carrying)} ₪, ערך גרט ${fmt(MOTOR.salvage)} ₪, נותרו לו ${fmt(MOTOR.hoursLeft)} שעות. שיפור בעלות ${fmt(MOTOR.improvement)} ₪ הוסיף ${fmt(MOTOR.extraHours)} שעות. מה הפחת לשעה מעכשיו?`,
      MOTOR_RATE,
      [
        `בסיס חדש: ${fmt(MOTOR.carrying)} + ${fmt(MOTOR.improvement)} − ${fmt(MOTOR.salvage)} = ${fmt(MOTOR.carrying + MOTOR.improvement - MOTOR.salvage)} ₪.`,
        `שעות שנותרו: ${fmt(MOTOR.hoursLeft)} + ${fmt(MOTOR.extraHours)} = ${fmt(MOTOR.hoursLeft + MOTOR.extraHours)}; פחת לשעה: ${fmt(MOTOR_RATE)} ₪.`,
      ],
    ),
    journal(
      "maintenance",
      "תחזוקה שוטפת",
      "החברה שילמה במזומן 6,000 ₪ על טיפול תקופתי במכונה, ששמר עליה במצבה. רשמו את הפקודה.",
      [
        { account: "הוצאות תיקונים ואחזקה", dr: 6_000 },
        { account: "מזומן", cr: 6_000 },
      ],
      "טיפול ששומר על הקיים לא מוסיף הטבות חדשות — הוצאה בתקופה.",
      ["הוצאות תיקונים ואחזקה", "מזומן", "מכונה", "פחת נצבר"],
    ),
    calc(
      "upgrade-back",
      "מהפחת החדש אל עלות השדרוג",
      `ב-1.1.${UPGRADE.year} שודרג התנור של המאפייה. העלות המופחתת שלו לפני השדרוג הייתה ${fmt(OVEN_BEFORE_UPGRADE)} ₪. אחרי השדרוג הוא מופחת ${fmt(UPGRADE_ANNUAL)} ₪ בשנה, על ${UPGRADE.lifeLeft} השנים שנותרו, עם ערך גרט של ${fmt(OVEN.salvage)} ₪. כמה עלה השדרוג?`,
      UPGRADE.cost,
      [
        `הפחת החדש = (בסיס חדש − ערך גרט) ÷ שנים שנותרו. לכן בסיס חדש = ${fmt(UPGRADE_ANNUAL)} × ${UPGRADE.lifeLeft} + ${fmt(OVEN.salvage)} = ${fmt(UPGRADE_BASE)} ₪.`,
        `בסיס חדש = עלות מופחתת לפני השדרוג + השדרוג. לכן השדרוג = ${fmt(UPGRADE_BASE)} − ${fmt(OVEN_BEFORE_UPGRADE)} = ${fmt(UPGRADE.cost)} ₪.`,
      ],
    ),
  ],
  traps: [
    {
      id: "reno-base",
      prompt: "מבנה: עלות 100,000 ₪, פחת נצבר עד יום השיפוץ 40,000 ₪. השיפוץ עלה 20,000 ₪, ומיומו נותרו 4 שנות חיים, בלי ערך גרט. מה הפחת השנתי מיום השיפוץ?",
      options: ["20,000 ₪", "30,000 ₪", "5,000 ₪"],
      answer: 0,
      why: "הבסיס החדש הוא הערך בספרים ועוד השיפוץ: 60,000 + 20,000 = 80,000 ₪, חלקי 4 שנים = 20,000 ₪.",
      traps: ["", "המלכודת: מהעלות המקורית (100,000 + 20,000) ÷ 4. הבסיס החדש הוא הערך בספרים — לא העלות.", "זה הפחת של השיפוץ לבדו. מפחיתים את כל הנכס, מהערך בספרים שלו ועוד השיפוץ."],
    },
    {
      id: "reno-partial",
      prompt: "שיפוץ ב-1.10. מה הפחת של השנה?",
      options: ["9 חודשים לפי הפחת הישן, ועוד 3 חודשים לפי הפחת החדש", "12 חודשים לפי הפחת החדש", "12 חודשים לפי הפחת הישן — השיפוץ ייכנס לפחת רק בשנה הבאה"],
      answer: 0,
      why: "שנת השיפוץ בנויה משני חלקים: עד יום השיפוץ — הפחת הישן; ממנו — פחת חדש על הבסיס החדש.",
      traps: ["", "המלכודת: לא שוכחים את הפחת היחסי עד יום השיפוץ.", "השיפוץ מופחת מיום שבוצע, לא משנה הבאה."],
    },
    {
      id: "life-added",
      prompt: "מכונה עם 10 שנות חיים שופצה אחרי 3.5 שנים, והשיפוץ הוסיף 3.5 שנים. כמה שנים נותרו מיום השיפוץ?",
      options: ["10", "13.5", "3.5", "6.5"],
      answer: 0,
      why: "נותרו 10 − 3.5 = 6.5 שנים, ועוד 3.5 שהשיפוץ הוסיף — 10 שנים מיום השיפוץ.",
      traps: ["", "המלכודת: הוספתם את התוספת לאורך החיים המקורי, בלי להוריד את מה שכבר עבר.", "זו רק התוספת.", "זה מה שנותר בלי השיפוץ."],
    },
  ],
  tips: [
    "תחזוקה ששומרת על הקיים — הוצאה, גם כשהיא יקרה. שיפור שמאריך חיים, מגדיל תפוקה או משפר איכות — נכנס לנכס.",
    "שיפוץ: פחת עד יום השיפוץ → ערך בספרים + השיפוץ = בסיס חדש → מפחיתים אותו על מה שנותר מהחיים (כולל התוספת), בשיטה ובגרט המעודכנים.",
    "שנת שיפוץ באמצע השנה בנויה משני חלקים: לפני ואחרי.",
    "החלפת רכיב: הישן יוצא (עלותו פחות הפחת שנצבר עליו — הפסד), והחדש נכנס לעלות.",
    "שינוי אומדן — מכאן ולהבא: הערך בספרים ÷ יתרת אורך החיים. לא מתקנים אחורה.",
  ],
};
