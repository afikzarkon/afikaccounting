import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const IMPORT = { qty: 500, price: 40, discount: 5, duty: 10, freight: 1_000, storage: 600 }; // percents
const importGross = IMPORT.qty * IMPORT.price;
const importNet = (importGross * (100 - IMPORT.discount)) / 100;
const importDuty = (importNet * IMPORT.duty) / 100;
const importCost = importNet + importDuty + IMPORT.freight;
const UNIT = { qty: 1_000, price: 12, freightPerUnit: 0.5, toCustomers: 800 };
const unitCost = UNIT.price + UNIT.freightPerUnit;
const FINANCE = { qty: 200, price: 100, cashLess: 5 };
const financeCost = (FINANCE.qty * FINANCE.price * (100 - FINANCE.cashLess)) / 100;
const PORT = { qty: 100, price: 50, duty: 250, freight: 300, storage: 200 };
const portCost = PORT.qty * PORT.price + PORT.duty + PORT.freight;
const CREDIT = { price: 10_000, cash: 9_600 };
/** The freight screen's purchase: one order, four ways a question words its freight. */
export const BASES = { qty: 400, price: 25, shipment: 2_000, perUnit: 3, pack: { size: 50, fee: 100 }, kg: { perUnit: 30, rate: 0.2 } };
const SHIP = { qty: 250, price: 60, shipment: 1_500, inland: 4 };
const shipUnit = SHIP.price + SHIP.shipment / SHIP.qty + SHIP.inland;
/** The bundles screen's set: six cups and six plates sold together. */
export const SET = { cups: 6, cup: 12, plates: 6, plate: 18, qty: 120, threshold: 100, pct: 5, shipment: 1_800, inland: 4 };
export const SET_PRICE = SET.cups * SET.cup + SET.plates * SET.plate;
export const SET_COST = (SET.qty * SET_PRICE * (100 - (SET.qty > SET.threshold ? SET.pct : 0))) / 100 + SET.shipment + SET.inland * SET.qty;
const KG = { qty: 600, price: 35, kg: 12, rate: 0.25 };
const kgCost = KG.qty * KG.price + KG.qty * KG.kg * KG.rate;

/** Lesson 4: the cost of a purchase under IAS 2 — the test, an imported purchase built line by line, how freight is worded, bundles, and financing. */
export const COST: StudyModule = {
  slug: "inventory-cost",
  course: COURSE,
  n: 4,
  title: "עלות רכישה לפי IAS 2",
  description: "מה נכנס לעלות המלאי ומה נשאר בחוץ: רכישה מיובאת שורה אחר שורה, הובלה למשלוח, ליחידה, לארגז ולק״ג, ערכות שנמכרות יחד, ורכיב מימון.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-cost", title: "מה נכנס לעלות המלאי" },
    { id: "inv-shemesh", title: "דוגמה: עלות של רכישה מיובאת" },
    { id: "iv-cost-bases", title: "למשלוח, ליחידה, לארגז, לק״ג" },
    { id: "iv-bundles", title: "ערכה: כשהיחידה היא ארגז" },
    { id: "inv-financing", title: "רכיב מימון" },
    { id: "inv-cost-sort", title: "תרגול הבנה: בעלות, בחוץ או מנוכה?" },
  ],
  exercises: [
    journal(
      "import-periodic",
      "רכישה מיובאת",
      `החברה מנהלת מלאי בשיטה תקופתית. היא ייבאה ${PORT.qty} יחידות ב-${PORT.price} ₪ ליחידה, ושילמה במזומן את הסחורה, מכס של ${PORT.duty} ₪ (לא מוחזר), הובלה מהנמל למחסן ${PORT.freight} ₪, ואחסון של חודש במחסן החברה ${PORT.storage} ₪.`,
      [
        { account: "קניות", dr: portCost },
        { account: "הוצאות אחסון", dr: PORT.storage },
        { account: "מזומן", cr: portCost + PORT.storage },
      ],
      `המחיר, המכס וההובלה פנימה הביאו את הסחורה למחסן — עלות: ${fmt(PORT.qty * PORT.price)} + ${PORT.duty} + ${PORT.freight} = ${fmt(portCost)}. אחסון רגיל במחסן החברה אינו נחוץ לשלב נוסף — הוצאה של התקופה.`,
      ["קניות", "הוצאות אחסון", "מזומן", "מלאי", "הוצאות הובלה"],
    ),
    journal(
      "financing-buy",
      "רכיב מימון",
      `החברה מנהלת מלאי בשיטה תמידית. היא קנתה סחורה במחיר ${fmt(CREDIT.price)} ₪ בתנאי אשראי חריגים בענף; במזומן המחיר היה ${fmt(CREDIT.cash)} ₪. רשמו את הרכישה.`,
      [
        { account: "מלאי", dr: CREDIT.cash },
        { account: "ספקים", cr: CREDIT.cash },
      ],
      `עלות המלאי היא מחיר המזומן, ${fmt(CREDIT.cash)} ₪, וגם החוב לספק נרשם בסכום הזה. ההפרש — ${fmt(CREDIT.price - CREDIT.cash)} ₪ — יירשם כהוצאות מימון לאורך תקופת האשראי (ח׳ הוצאות מימון / ז׳ ספקים).`,
      ["מלאי", "ספקים", "הוצאות מימון", "מזומן"],
    ),
    calc(
      "import-cost",
      "עלות רכישה מיובאת",
      `נקנו ${IMPORT.qty} יחידות ב-${IMPORT.price} ₪. הנחת כמות של ${IMPORT.discount}% על כל הרכישה. מכס ${IMPORT.duty}% מהמחיר נטו (לא מוחזר). הובלה מהנמל למחסן: ${fmt(IMPORT.freight)} ₪ למשלוח. אחסון במחסן החברה: ${IMPORT.storage} ₪. מהי עלות הרכישה?`,
      importCost,
      [
        `מחיר: ${IMPORT.qty} × ${IMPORT.price} = ${fmt(importGross)}; פחות הנחה ${IMPORT.discount}% = ${fmt(importNet)} ₪.`,
        `מכס על המחיר נטו: ${fmt(importNet)} × ${IMPORT.duty}% = ${fmt(importDuty)} ₪.`,
        `הובלה פנימה: ${fmt(IMPORT.freight)} ₪. האחסון במחסן החברה — הוצאה, לא עלות.`,
        `עלות: ${fmt(importNet)} + ${fmt(importDuty)} + ${fmt(IMPORT.freight)} = ${fmt(importCost)} ₪.`,
      ],
    ),
    calc(
      "unit-cost",
      "עלות ליחידה",
      `נקנו ${fmt(UNIT.qty)} יחידות ב-${UNIT.price} ₪. הובלה פנימה ${UNIT.freightPerUnit} ₪ ליחידה, מע״מ 18% בר-קיזוז, והובלה ללקוחות שקנו ${UNIT.toCustomers} ₪. מהי עלות היחידה?`,
      unitCost,
      [
        `נכנסים: המחיר (${UNIT.price}) וההובלה פנימה (${UNIT.freightPerUnit}).`,
        "בחוץ: מע״מ שמוחזר אינו עלות; הובלה ללקוח היא עלות מכירה — הוצאה.",
        `עלות ליחידה: ${UNIT.price} + ${UNIT.freightPerUnit} = ${unitCost} ₪.`,
      ],
    ),
    calc(
      "per-shipment",
      "הובלה למשלוח",
      `נקנו ${SHIP.qty} יחידות ב-${SHIP.price} ₪. הובלה ימית: ${fmt(SHIP.shipment)} ₪ למשלוח. הובלה מהנמל למחסן: ${SHIP.inland} ₪ ליחידה. מהי העלות ליחידה?`,
      shipUnit,
      [`הובלה למשלוח היא סכום אחד, שמתחלק בין כל יחידות המשלוח: ${fmt(SHIP.shipment)} ÷ ${SHIP.qty} = ${SHIP.shipment / SHIP.qty} ₪ ליחידה.`, `${SHIP.price} + ${SHIP.shipment / SHIP.qty} + ${SHIP.inland} = ${shipUnit} ₪.`],
    ),
    calc(
      "per-kg",
      "הובלה לפי משקל",
      `נקנו ${KG.qty} יחידות ב-${KG.price} ₪. כל יחידה שוקלת ${KG.kg} ק״ג, וההובלה עולה ${KG.rate} ₪ לק״ג. מהי עלות הרכישה?`,
      kgCost,
      [`הובלה: ${KG.qty} יח׳ × ${KG.kg} ק״ג × ${KG.rate} ₪ = ${fmt(KG.qty * KG.kg * KG.rate)} ₪.`, `עלות: ${fmt(KG.qty * KG.price)} + ${fmt(KG.qty * KG.kg * KG.rate)} = ${fmt(kgCost)} ₪.`],
    ),
    calc(
      "set-cost",
      "עלות של ערכה",
      `ערכת אירוח כוללת ${SET.cups} כוסות ב-${SET.cup} ₪ ו-${SET.plates} צלחות ב-${SET.plate} ₪. נקנו ${SET.qty} ערכות; הנחה ${SET.pct}% על רכישה של מעל ${SET.threshold} ערכות; הובלה ימית ${fmt(SET.shipment)} ₪ למשלוח והובלה למחסן ${SET.inland} ₪ לערכה. מהי העלות של ערכה אחת?`,
      SET_COST / SET.qty,
      [
        `מחיר ערכה: ${SET.cups} × ${SET.cup} + ${SET.plates} × ${SET.plate} = ${SET_PRICE} ₪.`,
        `${SET.qty} ערכות × ${SET_PRICE} = ${fmt(SET.qty * SET_PRICE)}; ${SET.qty} > ${SET.threshold}, אז הנחה ${SET.pct}%: ${fmt((SET.qty * SET_PRICE * (100 - SET.pct)) / 100)} ₪.`,
        `+ ${fmt(SET.shipment)} (ימית) + ${SET.qty} × ${SET.inland} (למחסן) = ${fmt(SET_COST)} ₪.`,
        `לערכה: ${fmt(SET_COST)} ÷ ${SET.qty} = ${fmt(SET_COST / SET.qty)} ₪.`,
      ],
    ),
    calc(
      "financing-cost",
      "רכיב מימון",
      `נקנו ${FINANCE.qty} יחידות ב-${FINANCE.price} ₪ בתנאי אשראי ״שוטף + 180״, חריגים בענף. במזומן המחיר היה נמוך ב-${FINANCE.cashLess}%. מהי עלות המלאי?`,
      financeCost,
      ["בתנאי אשראי חריגים העלות היא מחיר המזומן; ההפרש הוא הוצאות מימון.", `${FINANCE.qty} × ${FINANCE.price} × ${100 - FINANCE.cashLess}% = ${fmt(financeCost)} ₪.`],
    ),
    choice("vat", "מע״מ", "האם מע״מ בר-קיזוז נכלל בעלות המלאי?", ["כן", "לא"], 1, "מס שאפשר לקבל בחזרה אינו עלות."),
  ],
  traps: [
    {
      id: "duty-on-freight",
      prompt: "מחיר הרכישה נטו, אחרי הנחה: 10,000 ₪. הובלה פנימה: 1,000 ₪. מכס 10% מהמחיר נטו. מהי עלות הרכישה?",
      options: ["12,000 ₪", "12,100 ₪", "11,000 ₪", "10,000 ₪"],
      answer: 0,
      why: "מכס על המחיר נטו בלבד: 1,000 ₪. עלות: 10,000 + 1,000 (מכס) + 1,000 (הובלה) = 12,000 ₪.",
      traps: [
        "",
        "המלכודת: מכס על המחיר ועל ההובלה (11,000 × 10%). כתוב ״מהמחיר נטו״ — בלי ההובלה.",
        "חסר רכיב: גם המכס וגם ההובלה פנימה נכללים בעלות.",
        "המחיר לבד אינו העלות — מוסיפים את מה שהביא את הסחורה למחסן.",
      ],
    },
    {
      id: "storage",
      prompt: "אילו עלויות אחסון נכללות בעלות המלאי?",
      options: ["רק אחסון שנחוץ לפני שלב נוסף בתהליך", "כל אחסון, עד שהסחורה נמכרת", "אף אחסון", "רק אחסון במחסני החברה"],
      answer: 0,
      why: "סעיף 16(ב): אחסון נכלל רק כשהוא נחוץ בתהליך לפני שלב נוסף — למשל בנמל, בגלל לוח משלוחים קבוע.",
      traps: [
        "",
        "אחסון רגיל, אחרי שהסחורה הגיעה, אינו מביא אותה למקומה ולמצבה — הוא הוצאה.",
        "יש חריג: אחסון שנחוץ לפני השלב הבא בתהליך — נכלל.",
        "הפוך: אחסון רגיל במחסני החברה הוא דווקא הדוגמה הקלאסית להוצאה.",
      ],
    },
    {
      id: "shipment-per-unit",
      prompt: "״הובלה ימית: 2,000 ₪ לכל משלוח״. במשלוח 400 יחידות. כמה הובלה נכנסת לעלות של יחידה?",
      options: ["5 ₪", "2,000 ₪", "800,000 ₪", "0 ₪"],
      answer: 0,
      why: "סכום אחד למשלוח, מתחלק בין היחידות שבו: 2,000 ÷ 400 = 5 ₪.",
      traps: ["", "2,000 ₪ הם המשלוח כולו — לא יחידה.", "המלכודת: לכפול סכום למשלוח בכמות, כאילו הוא ליחידה.", "הובלה פנימה היא חלק מהעלות."],
    },
  ],
  tips: [
    "עלות = מחיר − הנחות + מכס שלא מוחזר + הובלה פנימה וטיפול. המבחן: האם זה הביא את הסחורה למקומה ולמצבה?",
    "בחוץ: מע״מ בר-קיזוז, אחסון רגיל, הובלה ללקוח, פרסום, בזבוז חריג ותקורה מנהלית.",
    "״למשלוח״ — סכום אחד; ״ליחידה״ — × כמות; ״לארגז של N״ — כמות ÷ N × מחיר; ״לק״ג״ — × משקל × כמות.",
    "ערכה שנמכרת שלמה היא יחידת המלאי: מחירה = סכום מה שבתוכה, וכל הספירה, ההנחות והעלויות — לפי ערכות.",
    "רכיב מימון רק בתנאי אשראי חריגים לענף: העלות היא מחיר המזומן.",
  ],
};
