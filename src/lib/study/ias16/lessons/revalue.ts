import type { StudyModule } from "../../types";
import { REVAL, revaluationQuestions } from "../revaluation";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "../shared";

const Q = revaluationQuestions(REVAL);
/** Reset against proportional, on the same asset: cost 1,000, ten years, revalued after two. */
export const PROP = { cost: 1_000, life: 10, years: 2, fairValue: 1_200 };
const propCarrying = PROP.cost - (PROP.cost / PROP.life) * PROP.years;
export const PROP_GROSS = (PROP.cost * PROP.fairValue) / propCarrying;
export const PROP_ACCUM = PROP_GROSS - PROP.fairValue;
/** A building with its land inside one fair value. */
const SPLIT = { fairValue: 4_000_000, land: 0.25, buildingCarrying: 2_850_000 };
/** A transfer the question gives, and the surplus behind it. */
const GIVEN = { transfer: 24_700, yearsLeft: 24 };
/** The check: the surplus is the revalued carrying amount less what the cost model would show. */
export const CHECK = { cost: 300_000, land: 100_000, life: 20, years: 2, fairValue: 285_000 };
const costModel = CHECK.cost - ((CHECK.cost - CHECK.land) / CHECK.life) * CHECK.years;
/** A revalued building sold. */
export const SALE = { carrying: 900_000, surplus: 120_000, price: 950_000 };

/** Lesson 10: revaluing an asset that is depreciated — reset or proportional, the new charge, the transfer to retained earnings, the check, and a sale after a revaluation. */
export const REVALUE: StudyModule = {
  slug: "ias16-revaluation",
  course: COURSE,
  n: 10,
  title: "מודל הערכה מחדש: נכס שמופחת",
  description: "מבנה שמופחת ומוערך מחדש: איפוס הפחת הנצבר או הצגה יחסית, פחת חדש מהשווי ההוגן, העברת הקרן לעודפים בקצב הפחת או בגריעה, הבדיקה שתופסת כמעט כל טעות — ומכירה אחרי הערכה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-reset-prop", title: "איפוס פחת נצבר או הצגה יחסית" },
    { id: "revaluation-steps", title: "שלבי הפתרון" },
    { id: "ppe-transfer", title: "הקרן לעודפים: בקצב הפחת או בגריעה" },
    { id: "revaluation-yearly", title: "דוגמה: הערכה בכל שנה" },
    { id: "revaluation-check", title: "בדיקה ודגשים" },
    { id: "ppe-reval-sale", title: "מכירה או החלפה אחרי הערכה" },
    { id: "revaluation-calculator", title: "מחשבון הערכה מחדש" },
  ],
  tools: [{ screen: "revaluation-calculator", label: "מחשבון הערכה מחדש" }],
  exercises: [
    Q["reval-gap"],
    Q["reval-entry"],
    Q["reval-new-dep"],
    Q["reval-transfer"],
    calc(
      "prop-gross",
      "הצגה יחסית",
      `נכס בעלות ${fmt(PROP.cost)} ₪, ${PROP.life} שנים בקו ישר, הוערך אחרי ${PROP.years} שנים לשווי הוגן של ${fmt(PROP.fairValue)} ₪. החברה מציגה את הפחת הנצבר באופן יחסי. מהי העלות ברוטו אחרי ההערכה?`,
      PROP_GROSS,
      [
        `ערך בספרים לפני: ${fmt(propCarrying)} ₪; היחס: ${fmt(PROP.fairValue)} ÷ ${fmt(propCarrying)} = ${PROP.fairValue / propCarrying}.`,
        `עלות ברוטו: ${fmt(PROP.cost)} × ${PROP.fairValue / propCarrying} = ${fmt(PROP_GROSS)} ₪; פחת נצבר: ${fmt(PROP.cost - propCarrying)} × ${PROP.fairValue / propCarrying} = ${fmt(PROP_ACCUM)} ₪.`,
      ],
    ),
    calc(
      "split-fair",
      "שווי הוגן עם קרקע",
      `השווי ההוגן של מבנה, כולל הקרקע, ${fmt(SPLIT.fairValue)} ₪; ${SPLIT.land * 100}% ממנו לקרקע. הערך בספרים של המבנה (בלי הקרקע) לפני ההערכה ${fmt(SPLIT.buildingCarrying)} ₪. בכמה עולה הקרן בגין המבנה?`,
      SPLIT.fairValue * (1 - SPLIT.land) - SPLIT.buildingCarrying,
      [`החלק של המבנה: ${fmt(SPLIT.fairValue)} × ${100 - SPLIT.land * 100}% = ${fmt(SPLIT.fairValue * (1 - SPLIT.land))} ₪.`, `קרן: ${fmt(SPLIT.fairValue * (1 - SPLIT.land))} − ${fmt(SPLIT.buildingCarrying)} = ${fmt(SPLIT.fairValue * (1 - SPLIT.land) - SPLIT.buildingCarrying)} ₪. הקרקע — בחשבון משלה.`],
    ),
    calc(
      "surplus-from-transfer",
      "קרן מהעברה נתונה",
      `מבנה שהוערך מחדש מופחת בקו ישר, והקרן עוברת לעודפים בקצב הפחת: ${fmt(GIVEN.transfer)} ₪ בשנה. מיום ההערכה נותרו לו ${GIVEN.yearsLeft} שנים. כמה נרשם בקרן ביום ההערכה?`,
      GIVEN.transfer * GIVEN.yearsLeft,
      ["בקו ישר, ההעברה השנתית = הקרן ÷ יתרת אורך החיים.", `הקרן = ${fmt(GIVEN.transfer)} × ${GIVEN.yearsLeft} = ${fmt(GIVEN.transfer * GIVEN.yearsLeft)} ₪.`],
    ),
    calc(
      "check",
      "בדיקת הקרן",
      `מבנה נקנה ב-${fmt(CHECK.cost)} ₪, מזה קרקע ${fmt(CHECK.land)} ₪; המבנה מופחת ${CHECK.life} שנה בקו ישר, והקרן עוברת לעודפים בקצב הפחת. אחרי ${CHECK.years} שנים, השווי ההוגן (כולל הקרקע) ${fmt(CHECK.fairValue)} ₪. מה יתרת הקרן?`,
      CHECK.fairValue - costModel,
      [
        `לפי מודל העלות היה הנכס מוצג ב-${fmt(CHECK.cost)} − ${CHECK.years} × ${fmt((CHECK.cost - CHECK.land) / CHECK.life)} = ${fmt(costModel)} ₪.`,
        `כשהקרן עוברת בקצב הפחת: קרן = ערך בספרים לפי ההערכה − ערך בספרים לפי העלות = ${fmt(CHECK.fairValue)} − ${fmt(costModel)} = ${fmt(CHECK.fairValue - costModel)} ₪.`,
      ],
    ),
    calc("sale-after", "מכירה אחרי הערכה", `מבנה שהוערך מחדש, ערכו בספרים ${fmt(SALE.carrying)} ₪ ובקרן שלו ${fmt(SALE.surplus)} ₪, נמכר ב-${fmt(SALE.price)} ₪ בלי הערכה נוספת. מה רווח ההון?`, SALE.price - SALE.carrying, [
      `רווח = תמורה − ערך בספרים (המשוערך): ${fmt(SALE.price)} − ${fmt(SALE.carrying)} = ${fmt(SALE.price - SALE.carrying)} ₪.`,
      `הקרן — ${fmt(SALE.surplus)} ₪ — עוברת לעודפים בפקודה נפרדת, לא לרווח.`,
    ]),
    journal(
      "surplus-out",
      "הקרן בגריעה",
      `המבנה (קרן ${fmt(SALE.surplus)} ₪) נמכר. רשמו את העברת הקרן.`,
      [
        { account: "קרן הערכה מחדש", dr: SALE.surplus },
        { account: "עודפים", cr: SALE.surplus },
      ],
      "בגריעה הקרן עוברת כולה לעודפים — ישירות בהון, לא דרך רווח והפסד.",
      ["קרן הערכה מחדש", "עודפים", "רווח הון", "מבנה"],
    ),
    choice(
      "disposal-transfer",
      "העברה בגריעה",
      "החברה בחרה להעביר את הקרן לעודפים רק בעת גריעה. מה קורה לקרן בשנים שבין ההערכות?",
      ["כלום — היא משתנה רק בהערכות ובגריעה", "יורדת בכל שנה לפי הפחת", "עוברת לרווח והפסד", "מתאפסת בסוף כל שנה"],
      0,
      "בשיטה הזו אין העברה שנתית. הקרן גדלה או קטנה רק בהערכות, ועוברת לעודפים כולה כשהנכס יוצא.",
    ),
  ],
  traps: [
    {
      id: "new-dep-base",
      prompt: "מבנה הוערך מחדש לשווי הוגן של 480,000 ₪, ונותרו לו 24 שנים, בלי ערך גרט. העלות המקורית 500,000 ₪ על 25 שנים. מה הפחת השנתי מעכשיו?",
      options: ["20,000 ₪", "20,833 ₪", "19,200 ₪", "20,000 ₪ פחות ההעברה לעודפים"],
      answer: 0,
      why: "מפחיתים את השווי ההוגן על יתרת החיים: 480,000 ÷ 24 = 20,000 ₪.",
      traps: ["", "המלכודת: העלות המקורית חלקי יתרת החיים. אחרי הערכה הבסיס הוא השווי ההוגן.", "השווי ההוגן חלקי כל אורך החיים — אבל שנה כבר עברה.", "ההעברה לעודפים אינה חלק מהפחת: היא פקודה נפרדת, בהון."],
    },
    {
      id: "transfer-pl",
      prompt: "החברה מעבירה את הקרן לעודפים בקצב הפחת. איך זה משפיע על הרווח של השנה?",
      options: ["לא משפיע — ההעברה בתוך ההון", "מגדיל אותו בסכום ההעברה", "מקטין אותו", "מקטין את הפחת"],
      answer: 0,
      why: "ח׳ קרן הערכה מחדש / ז׳ עודפים — שני חשבונות הון. הפחת ברווח והפסד הוא הפחת המלא, מהשווי ההוגן.",
      traps: ["", "המלכודת: ההעברה ״מחזירה״ את הפחת העודף לרווח. היא לא — היא עוקפת את רווח והפסד.", "גם לא בכיוון ההפוך — רווח והפסד לא משתתף.", "הפחת נשאר מלא; ההעברה היא פקודה אחרת."],
    },
  ],
  tips: [
    "סדר בכל תאריך הערכה: פחת עד היום → העברה לעודפים (אם בקצב הפחת) → השוואה לשווי ההוגן → רישום הפער.",
    "איפוס: מבטלים את הפחת הנצבר מול העלות, והנכס עומד על השווי ההוגן. יחסי: מכפילים עלות ופחת נצבר באותו יחס. הערך בספרים — זהה.",
    "פחת אחרי הערכה = (שווי הוגן − גרט) ÷ יתרת אורך החיים.",
    "העברה בקצב הפחת = פחת לפי ההערכה − פחת לפי העלות (בקו ישר: קרן ÷ יתרת החיים). בגריעה — כל היתרה בבת אחת.",
    "בדיקה: קרן = ערך בספרים לפי ההערכה − ערך בספרים לפי העלות (כשההעברה בקצב הפחת ובלי ירידות לרווח והפסד).",
    "מכירה או החלפה: מעריכים לפני, אם השאלה אומרת; הרווח מול הערך בספרים המשוערך; הקרן — לעודפים.",
  ],
};
