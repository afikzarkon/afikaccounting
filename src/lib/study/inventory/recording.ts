import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const BUY = { qty: 200, price: 30 }; // periodic, on credit
const SELL = { qty: 50, price: 80, unitCost: 30 }; // perpetual, for cash
/** The net-amounts screen's shop: a year's gross figures, its discounts and returns. */
export const NET = { sales: 520_000, custDiscounts: 12_000, custReturns: 8_000, purchases: 310_000, suppDiscounts: 9_000, suppReturns: 6_000, opening: 70_000, closing: 85_000 };
export const NET_SALES = NET.sales - NET.custDiscounts - NET.custReturns;
export const NET_PURCHASES = NET.purchases - NET.suppDiscounts - NET.suppReturns;
export const NET_COGS = NET.opening + NET_PURCHASES - NET.closing;
const BACK = { opening: 90_000, gross: 260_000, closing: 75_000, cogs: 265_000 };
const backReturns = BACK.opening + BACK.gross - BACK.closing - BACK.cogs;

/** Lesson 2: recording — the periodic and perpetual systems, net sales and net purchases, and a statement with question marks. */
export const RECORDING: StudyModule = {
  slug: "inventory-recording",
  course: COURSE,
  n: 2,
  title: "רישום, הנחות והחזרות ודוח עם חסרים",
  description: "שתי שיטות רישום — תקופתית ותמידית, מכירות נטו וקניות נטו, ודוח עד הרווח הגולמי שחסרים בו מספרים.",
  goal: "להכיר את שתי שיטות הרישום, ולהשלים דוח עד הרווח הגולמי שחסרים בו מספרים.",
  outcomes: [
    "להבחין בין רישום תקופתי לרישום תמידי",
    "לחשב מכירות נטו וקניות נטו, עם החזרות והנחות",
    "להשלים מספרים חסרים בדוח של שתי שנים",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-systems", title: "שתי שיטות רישום: תקופתי ותמידי" },
    { id: "iv-net", title: "מכירות נטו וקניות נטו" },
    { id: "inv-daf", title: "דוח עם סימני שאלה: שתי שנים" },
  ],
  exercises: [
    journal(
      "periodic-buy",
      "קנייה בשיטה תקופתית",
      `החברה מנהלת מלאי בשיטה תקופתית. היא קנתה מספק ${BUY.qty} יחידות ב-${BUY.price} ₪ ליחידה, באשראי.`,
      [
        { account: "קניות", dr: BUY.qty * BUY.price },
        { account: "ספקים", cr: BUY.qty * BUY.price },
      ],
      `בשיטה תקופתית הקנייה נרשמת בחשבון ״קניות״ — חשבון תוצאתי שנכנס לעלות המכר. ${BUY.qty} × ${BUY.price} = ${fmt(BUY.qty * BUY.price)}. המלאי עצמו יתעדכן רק בסוף השנה, לפי ספירה.`,
      ["קניות", "ספקים", "מלאי", "מזומן", "עלות המכר"],
    ),
    journal(
      "perpetual-sale",
      "מכירה בשיטה תמידית",
      `החברה מנהלת מלאי בשיטה תמידית. היא מכרה במזומן ${SELL.qty} יחידות ב-${SELL.price} ₪ ליחידה. העלות של כל יחידה שנמכרה: ${SELL.unitCost} ₪. רשמו את המכירה בפקודה אחת.`,
      [
        { account: "מזומן", dr: SELL.qty * SELL.price },
        { account: "מכירות", cr: SELL.qty * SELL.price },
        { account: "עלות המכר", dr: SELL.qty * SELL.unitCost },
        { account: "מלאי", cr: SELL.qty * SELL.unitCost },
      ],
      `שני דברים קורים במכירה: ההכנסה (${SELL.qty} × ${SELL.price} = ${fmt(SELL.qty * SELL.price)}), והיציאה של הסחורה מהמלאי לעלות המכר (${SELL.qty} × ${SELL.unitCost} = ${fmt(SELL.qty * SELL.unitCost)}). בשיטה תמידית רושמים את שניהם כבר ביום המכירה.`,
      ["מזומן", "מכירות", "עלות המכר", "מלאי", "קניות", "לקוחות"],
    ),
    choice(
      "perpetual-extra",
      "שיטה תמידית",
      "בשיטה תמידית, מה רושמים במכירה בנוסף לפקודה ח׳ לקוחות / ז׳ מכירות?",
      ["ח׳ קניות / ז׳ מלאי", "ח׳ עלות המכר / ז׳ מלאי", "ח׳ מלאי / ז׳ עלות המכר", "כלום"],
      1,
      "בכל מכירה מוציאים את העלות של מה שנמכר מהמלאי לעלות המכר.",
    ),
    choice(
      "periodic-year-end",
      "שיטה תקופתית",
      "בשיטה תקופתית, מתי יודעים מהי עלות המכר?",
      ["בכל מכירה", "רק בסוף השנה, אחרי ספירת המלאי", "בכל קנייה", "אף פעם — היא נתונה בשאלה"],
      1,
      "במהלך השנה נרשמות רק קניות ומכירות. את מלאי הסגירה — ואיתו את עלות המכר — מוצאים רק אחרי הספירה.",
    ),
    calc(
      "net-sales",
      "מכירות נטו",
      `מכירות ${fmt(NET.sales)} ₪, הנחות ללקוחות ${fmt(NET.custDiscounts)} ₪, החזרות מלקוחות ${fmt(NET.custReturns)} ₪, החזרות לספקים ${fmt(NET.suppReturns)} ₪. מהן המכירות נטו?`,
      NET_SALES,
      ["מכירות נטו = מכירות − הנחות ללקוחות − החזרות מלקוחות. ההחזרות לספקים שייכות לקניות.", `${fmt(NET.sales)} − ${fmt(NET.custDiscounts)} − ${fmt(NET.custReturns)} = ${fmt(NET_SALES)} ₪.`],
    ),
    calc(
      "net-cogs",
      "עלות המכר עם קניות נטו",
      `מלאי פתיחה ${fmt(NET.opening)} ₪, קניות ${fmt(NET.purchases)} ₪, הנחות מספקים ${fmt(NET.suppDiscounts)} ₪, החזרות לספקים ${fmt(NET.suppReturns)} ₪, מלאי סגירה ${fmt(NET.closing)} ₪. מהי עלות המכר?`,
      NET_COGS,
      [
        `קניות נטו = ${fmt(NET.purchases)} − ${fmt(NET.suppDiscounts)} − ${fmt(NET.suppReturns)} = ${fmt(NET_PURCHASES)} ₪.`,
        `עלות המכר = ${fmt(NET.opening)} + ${fmt(NET_PURCHASES)} − ${fmt(NET.closing)} = ${fmt(NET_COGS)} ₪.`,
      ],
    ),
    calc(
      "returns-back",
      "החזרות לספקים מהמשוואה",
      `מלאי פתיחה ${fmt(BACK.opening)} ₪, קניות ברוטו ${fmt(BACK.gross)} ₪, מלאי סגירה ${fmt(BACK.closing)} ₪, עלות המכר ${fmt(BACK.cogs)} ₪. אין הנחות מספקים. מה סכום ההחזרות לספקים?`,
      backReturns,
      [
        "עלות המכר = פתיחה + (קניות ברוטו − החזרות לספקים) − סגירה. ההחזרות הן הנעלם.",
        `${fmt(BACK.cogs)} = ${fmt(BACK.opening)} + ${fmt(BACK.gross)} − X − ${fmt(BACK.closing)}.`,
        `X = ${fmt(BACK.opening)} + ${fmt(BACK.gross)} − ${fmt(BACK.closing)} − ${fmt(BACK.cogs)} = ${fmt(backReturns)} ₪.`,
      ],
    ),
    choice(
      "supplier-returns",
      "קניות נטו",
      "החזרות לספקים משפיעות על...",
      ["מכירות נטו", "קניות נטו", "מלאי הפתיחה", "שום דבר"],
      1,
      "הן מקטינות את הקניות — ודרכן את עלות המכר. הנחות והחזרות ללקוחות מקטינות את המכירות.",
    ),
    journal(
      "perpetual-buy",
      "קנייה בשיטה תמידית",
      "החברה מנהלת מלאי בשיטה תמידית. היא קנתה מספק 300 יחידות ב-50 ₪ ליחידה, באשראי. רשמו את הפקודה.",
      [
        { account: "מלאי", dr: 15_000 },
        { account: "ספקים", cr: 15_000 },
      ],
      "בשיטה תמידית הקנייה נכנסת ישר לחשבון ״מלאי״ — נכס. 300 × 50 = 15,000. עלות המכר תירשם רק כשהסחורה תימכר.",
      ["מלאי", "ספקים", "קניות", "עלות המכר", "מזומן"],
    ),
    journal(
      "supplier-return",
      "החזרה לספק בשיטה תקופתית",
      "החברה מנהלת מלאי בשיטה תקופתית. היא החזירה לספק סחורה פגומה שקנתה באשראי ב-4,000 ₪. רשמו את הפקודה.",
      [
        { account: "ספקים", dr: 4_000 },
        { account: "קניות", cr: 4_000 },
      ],
      "ההחזרה מבטלת חלק מהקנייה: החוב לספק קטן, וגם הקניות — וכך עלות המכר.",
      ["ספקים", "קניות", "מלאי", "מכירות", "מזומן"],
    ),
    calc(
      "full-gp",
      "מכירות נטו, קניות נטו ורווח גולמי",
      "מכירות 300,000 ₪, הנחות ללקוחות 6,000 ₪, החזרות מלקוחות 4,000 ₪. מלאי פתיחה 20,000 ₪, קניות 180,000 ₪, הנחות מספקים 5,000 ₪, מלאי סגירה 25,000 ₪. מהו הרווח הגולמי?",
      120_000,
      [
        "מכירות נטו: 300,000 − 6,000 − 4,000 = 290,000 ₪.",
        "קניות נטו: 180,000 − 5,000 = 175,000 ₪; עלות המכר: 20,000 + 175,000 − 25,000 = 170,000 ₪.",
        "רווח גולמי: 290,000 − 170,000 = 120,000 ₪.",
      ],
    ),
  ],
  traps: [
    {
      id: "returns-in-cogs",
      prompt: "לקוח החזיר סחורה שקנה ב-5,000 ₪. איזו שורה בדוח עד הרווח הגולמי קטנה?",
      options: ["המכירות", "הקניות", "מלאי הסגירה", "שום שורה"],
      answer: 0,
      why: "החזרה מלקוח מבטלת חלק מהמכירה — היא מקטינה את המכירות נטו.",
      traps: ["", "המלכודת: ״החזרה״ נשמעת כמו קניות. אבל זו החזרה של לקוח — היא שייכת לצד המכירות.", "הסחורה שחזרה תיספר במלאי — אבל השורה שההחזרה עצמה מקטינה היא המכירות.", "החזרה משנה את המכירות נטו, ולכן גם את הרווח."],
    },
    {
      id: "perpetual-no-count",
      prompt: "חברה בשיטה תמידית — האם היא סופרת מלאי בסוף השנה?",
      options: ["כן — כדי לגלות חוסרים ולבדוק שווי מימוש נטו", "לא — הספרים כבר יודעים הכול", "רק אם השאלה מבקשת", "רק בשיטת FIFO"],
      answer: 0,
      why: "בשיטה תמידית הספרים יודעים כמה אמור להיות. הספירה בודקת אם זה באמת שם — וגם מאפשרת לבחון את שווי המימוש נטו.",
      traps: ["", "המלכודת: גם בשיטה תמידית יש גניבות, שבר ופחת. הספירה היא הבדיקה.", "סופרים בכל שנה, בכל שיטה — לא לפי השאלה.", "השיטה (FIFO או ממוצע) קובעת את העלות, לא אם סופרים."],
    },
  ],
  tips: [
    "תקופתי: ״קניות״ במהלך השנה, ומלאי הסגירה בפקודה בסוף השנה. תמידי: ״מלאי״ בכל קנייה, ועלות המכר בכל מכירה.",
    "מכירות נטו = מכירות − הנחות והחזרות ללקוחות. קניות נטו = קניות − הנחות והחזרות לספקים.",
    "דוח עם סימני שאלה: משוואה עם נעלם אחד בכל פעם — וסגירה של שנה היא הפתיחה של הבאה.",
  ],
};
