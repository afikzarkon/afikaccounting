import type { StudyModule } from "../../types";
import { exchangeQuestions, SWAP } from "../exchange";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "../shared";

const Q = exchangeQuestions(SWAP);
/** The rule screen's deal, in three situations: given's fair value, received's clearer value, no substance. */
export const DEAL = { carrying: 10_000, fairGiven: 15_000, fairReceived: 13_000, cashIn: 200 };
/** The fair value given, found from a gain the question states. */
const BACK = { carrying: 120_000, gain: 15_000, cashIn: 10_000 };
/** Several units for several: five cars and cash for four. */
export const FLEET = { given: 5, fairEach: 98_000, cashOut: 140_000, received: 4 };
export const FLEET_EACH = (FLEET.given * FLEET.fairEach + FLEET.cashOut) / FLEET.received;

/** Lesson 9: exchanging one asset for another — commercial substance, which fair value, the cash, the entries, solving backwards, and the rest of the year. */
export const SWAP_LESSON: StudyModule = {
  slug: "ias16-exchange",
  course: COURSE,
  n: 9,
  title: "החלפת נכסים",
  description: "עם מהות מסחרית — שווי הוגן ורווח או הפסד; בלי — ערך בספרים. איזה שווי הוגן, מה עושה המזומן, איך מחלצים נתון מרווח שנתון — והפחת של הנכס החדש עד סוף השנה.",
  goal: "לרשום החלפת נכס בנכס — עם מהות מסחרית ובלעדיה — ולהמשיך להפחית את הנכס החדש.",
  outcomes: [
    "להסביר למה החלפה היא מכירה וקנייה באותו יום",
    "לקבוע אם יש מהות מסחרית, ובאיזה שווי הוגן להשתמש",
    "לחשב את עלות הנכס החדש ואת הרווח או ההפסד, גם כשיש תשלום במזומן",
    "לרשום את פקודת ההחלפה ואת הפחת של הנכס החדש עד סוף השנה",
    "לחלץ שווי הוגן מתוך רווח שנתון",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-swap-is-sale", title: "החלפה היא מכירה וקנייה באותו יום" },
    { id: "ppe-swap-rule", title: "הכלל: מהות מסחרית ושווי הוגן" },
    { id: "exchange-steps", title: "שלבי הפתרון" },
    { id: "exchange-entries", title: "פקודות היומן" },
    { id: "ppe-swap-back", title: "מהרווח אל השווי — וכמה נכסים בבת אחת" },
    { id: "exchange-new-asset", title: "המשך השנה: פחת הנכס החדש" },
    { id: "exchange-calculator", title: "מחשבון החלפה" },
  ],
  tools: [{ screen: "exchange-calculator", label: "מחשבון החלפה" }],
  exercises: [
    Q["swap-dep"],
    Q["swap-gain"],
    Q["swap-entry"],
    Q["swap-cash"],
    Q["swap-no-substance"],
    calc(
      "cash-in",
      "קיבלנו מזומן",
      `נכס שערכו בספרים ${fmt(DEAL.carrying)} ₪ ושוויו ההוגן ${fmt(DEAL.fairGiven)} ₪ הוחלף בנכס אחר, בעסקה עם מהות מסחרית, והחברה גם קיבלה ${fmt(DEAL.cashIn)} ₪ במזומן. מה עלות הנכס שהתקבל?`,
      DEAL.fairGiven - DEAL.cashIn,
      ["מה שמסרנו שווה " + fmt(DEAL.fairGiven) + " ₪, וקיבלנו תמורתו נכס ומזומן.", `הנכס: ${fmt(DEAL.fairGiven)} − ${fmt(DEAL.cashIn)} = ${fmt(DEAL.fairGiven - DEAL.cashIn)} ₪. הרווח: ${fmt(DEAL.fairGiven)} − ${fmt(DEAL.carrying)} = ${fmt(DEAL.fairGiven - DEAL.carrying)} ₪.`],
    ),
    calc(
      "received-value",
      "השווי של מה שהתקבל",
      `נכס שערכו בספרים ${fmt(DEAL.carrying)} ₪ הוחלף, בעסקה עם מהות מסחרית, בנכס ששוויו ההוגן ${fmt(DEAL.fairReceived)} ₪ — ראיה ברורה יותר משווי הנכס שנמסר — ובנוסף ${fmt(DEAL.cashIn)} ₪ במזומן. מה הרווח?`,
      DEAL.fairReceived + DEAL.cashIn - DEAL.carrying,
      [`הנכס שהתקבל נרשם בשוויו: ${fmt(DEAL.fairReceived)} ₪. כל מה שקיבלנו: ${fmt(DEAL.fairReceived)} + ${fmt(DEAL.cashIn)} = ${fmt(DEAL.fairReceived + DEAL.cashIn)} ₪.`, `רווח: ${fmt(DEAL.fairReceived + DEAL.cashIn)} − ${fmt(DEAL.carrying)} = ${fmt(DEAL.fairReceived + DEAL.cashIn - DEAL.carrying)} ₪.`],
    ),
    calc(
      "back-fair",
      "שווי הוגן מרווח נתון",
      `נכס שערכו בספרים ביום ההחלפה ${fmt(BACK.carrying)} ₪ הוחלף, בעסקה עם מהות מסחרית, והחברה קיבלה גם ${fmt(BACK.cashIn)} ₪. רווח ההון הוא ${fmt(BACK.gain)} ₪. מה עלות הנכס שהתקבל?`,
      BACK.carrying + BACK.gain - BACK.cashIn,
      [`השווי ההוגן של מה שנמסר: ערך בספרים + רווח = ${fmt(BACK.carrying)} + ${fmt(BACK.gain)} = ${fmt(BACK.carrying + BACK.gain)} ₪.`, `הנכס שהתקבל: ${fmt(BACK.carrying + BACK.gain)} − ${fmt(BACK.cashIn)} = ${fmt(BACK.carrying + BACK.gain - BACK.cashIn)} ₪.`],
    ),
    calc(
      "fleet",
      "כמה נכסים בבת אחת",
      `החברה מסרה ${FLEET.given} כלי רכב, ששוויו ההוגן של כל אחד ${fmt(FLEET.fairEach)} ₪, ועוד ${fmt(FLEET.cashOut)} ₪ במזומן, וקיבלה ${FLEET.received} כלי רכב חדשים. לעסקה מהות מסחרית. מה עלותו של כל רכב חדש?`,
      FLEET_EACH,
      [`מה שנמסר: ${FLEET.given} × ${fmt(FLEET.fairEach)} + ${fmt(FLEET.cashOut)} = ${fmt(FLEET.given * FLEET.fairEach + FLEET.cashOut)} ₪.`, `לכל רכב חדש: ÷ ${FLEET.received} = ${fmt(FLEET_EACH)} ₪.`],
    ),
    choice(
      "substance",
      "מהות מסחרית",
      "מה קובע אם להחלפה יש מהות מסחרית?",
      ["אם התזרימים הצפויים מהנכס החדש שונים באופן משמעותי מאלה של הישן", "אם השווי ההוגן של שני הנכסים שווה", "אם שולם מזומן בעסקה"],
      0,
      "מהות מסחרית פירושה שההחלפה באמת משנה את המצב הכלכלי של החברה — את התזרימים שהיא צפויה לקבל.",
    ),
  ],
  traps: [
    {
      id: "forgot-dep",
      prompt: "מכונה בעלות 100,000 ₪, פחת שנתי 10,000 ₪, ופחת נצבר ב-1.1 — 50,000 ₪. ב-1.7 הוחלפה, בעסקה עם מהות מסחרית, לפי שוויה ההוגן: 48,000 ₪. מה התוצאה?",
      options: ["רווח של 3,000 ₪", "הפסד של 2,000 ₪", "רווח של 48,000 ₪"],
      answer: 0,
      why: "קודם מעדכנים פחת עד יום ההחלפה: חצי שנה, 5,000 ₪. ערך בספרים: 100,000 − 55,000 = 45,000 ₪. רווח: 48,000 − 45,000 = 3,000 ₪.",
      traps: ["", "המלכודת: שכחו את הפחת מ-1.1 עד יום ההחלפה, והשוו לערך בספרים של תחילת השנה (50,000 ₪).", "השווי ההוגן אינו הרווח — משווים אותו לערך בספרים."],
    },
    {
      id: "no-substance-gain",
      prompt: "בהחלפה ללא מהות מסחרית, השווי ההוגן של הנכס שנמסר גבוה מערכו בספרים. האם מכירים ברווח?",
      options: ["לא — הנכס החדש נמדד לפי הערך בספרים של הישן", "כן — לפי השווי ההוגן"],
      answer: 0,
      why: "בלי מהות מסחרית אין רווח ואין הפסד: הנכס החדש פשוט ממשיך את הערך בספרים של הישן.",
      traps: ["", "המלכודת: רווח לפי שווי הוגן מוכרים רק כשלעסקה יש מהות מסחרית."],
    },
    {
      id: "price-range",
      prompt: "השווי ההוגן של הנכס שנמסר ידוע ומהימן. לנכס שהתקבל יש רק טווח מחירים בשוק (160,000–200,000 ₪). לפי מה רושמים?",
      options: ["לפי השווי ההוגן של מה שנמסר", "לפי אמצע הטווח", "לפי הקצה העליון", "לפי הערך בספרים"],
      answer: 0,
      why: "הבסיס הוא השווי ההוגן של מה שנמסר; משתמשים בשווי של מה שהתקבל רק אם הוא ראיה ברורה יותר — וטווח אינו כזה.",
      traps: ["", "המלכודת: אמצע טווח הוא ניחוש, לא ראיה ברורה.", "אותה בעיה — טווח אינו שווי מהימן.", "הערך בספרים — רק בלי מהות מסחרית, או כשאי אפשר למדוד שווי הוגן."],
    },
  ],
  tips: [
    "מעדכנים פחת עד יום ההחלפה — אחרת הרווח שגוי.",
    "עם מהות מסחרית: הנכס החדש בשווי ההוגן של מה שנמסר (או של מה שהתקבל, אם הוא ראיה ברורה יותר), ± המזומן.",
    "בלי מהות מסחרית, או בלי שווי הוגן מהימן: הנכס החדש בערך בספרים של הישן ± המזומן — בלי רווח.",
    "רווח (הפסד) = השווי ההוגן של מה שנמסר − הערך בספרים שלו. מרווח נתון: שווי = ערך בספרים + רווח.",
    "החלפה באמצע השנה = שני חישובי פחת: הישן עד ההחלפה, החדש ממנה.",
  ],
};
