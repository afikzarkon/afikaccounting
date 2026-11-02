import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const EXCESS = { qty: 1_200, price: 20, over: 1_000, rate: 10 };
const excessDiscount = ((EXCESS.qty - EXCESS.over) * EXCESS.price * EXCESS.rate) / 100;
const excessCost = EXCESS.qty * EXCESS.price - excessDiscount;
/** The tiered screen's supplier: a share off the whole order past one threshold, and a sum off each unit past another. */
export const TIER = { price: 40, wholeOver: 5_000, wholePct: 10, unitAfter: 8_000, unitOff: 6 };
export const tierCost = (qty: number) =>
  qty * TIER.price - (qty > TIER.wholeOver ? (qty * TIER.price * TIER.wholePct) / 100 : 0) - Math.max(0, qty - TIER.unitAfter) * TIER.unitOff;
const TIER_Q = 10_000;
/** The target screen's year: three orders, and 10% back on all of them past 3,000 units in the year. */
export const TARGET = { over: 3_000, pct: 10, buys: [{ qty: 1_200, price: 20 }, { qty: 1_000, price: 22 }, { qty: 1_100, price: 21 }] };
export const TARGET_GROSS = TARGET.buys.reduce((s, b) => s + b.qty * b.price, 0);
export const TARGET_COST = (TARGET_GROSS * (100 - TARGET.pct)) / 100;
/** The customers screen: a tenth off a sale of more than 100 units. */
export const CUST = { over: 100, pct: 10, price: 30, sales: [80, 150] };
export const custNet = CUST.sales.reduce((s, q) => s + q * CUST.price * (q > CUST.over ? 1 - CUST.pct / 100 : 1), 0);
/** The order of work: a discount comes off the price only, and duty is on what is left. */
export const ORDER = { qty: 5_000, price: 10, pct: 8, duty: 5, freight: 1_000 };
const orderNet = (ORDER.qty * ORDER.price * (100 - ORDER.pct)) / 100;
export const ORDER_COST = orderNet + (orderNet * ORDER.duty) / 100 + ORDER.freight;

/** Lesson 5: discounts — from the supplier (on the whole order, on the excess, tiered, for a target) and to customers. */
export const DISCOUNTS: StudyModule = {
  slug: "inventory-discounts",
  course: COURSE,
  n: 5,
  title: "הנחות: מהספק וללקוח",
  description: "קוראים את ניסוח ההנחה: על כל הרכישה, רק על העודף, במדרגות, או מותנית ביעד — ומה קורה כשההנחה ניתנת ללקוח.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-discounts", title: "שלושה סוגי הנחה" },
    { id: "iv-discount-order", title: "קודם ההנחה, אחר כך המכס" },
    { id: "iv-tiered", title: "הנחה במדרגות" },
    { id: "iv-targets", title: "הנחת יעד לאורך השנה" },
    { id: "iv-customer-discounts", title: "הנחה ללקוח: בצד המכירות" },
  ],
  exercises: [
    calc(
      "excess-discount",
      "הנחה רק על העודף",
      `נקנו ${fmt(EXCESS.qty)} יחידות ב-${EXCESS.price} ₪. הספק נותן ${EXCESS.rate}% הנחה על כל יחידה שמעבר ל-${fmt(EXCESS.over)}. מהי עלות הרכישה?`,
      excessCost,
      [
        `ההנחה רק על העודף: ${fmt(EXCESS.qty - EXCESS.over)} יח׳ × ${EXCESS.price} × ${EXCESS.rate}% = ${fmt(excessDiscount)} ₪.`,
        `עלות: ${fmt(EXCESS.qty)} × ${EXCESS.price} − ${fmt(excessDiscount)} = ${fmt(excessCost)} ₪.`,
      ],
    ),
    calc(
      "discount-order",
      "הנחה, מכס והובלה",
      `נקנו ${fmt(ORDER.qty)} יחידות ב-${ORDER.price} ₪. הנחה ${ORDER.pct}% מהמחיר; מכס ${ORDER.duty}% מהמחיר נטו; הובלה ${fmt(ORDER.freight)} ₪ למשלוח. מהי עלות הרכישה?`,
      ORDER_COST,
      [
        `מחיר נטו: ${fmt(ORDER.qty * ORDER.price)} × ${100 - ORDER.pct}% = ${fmt(orderNet)} ₪ — ההנחה רק על המחיר.`,
        `מכס על הנטו: ${fmt(orderNet)} × ${ORDER.duty}% = ${fmt((orderNet * ORDER.duty) / 100)} ₪.`,
        `עלות: ${fmt(orderNet)} + ${fmt((orderNet * ORDER.duty) / 100)} + ${fmt(ORDER.freight)} = ${fmt(ORDER_COST)} ₪.`,
      ],
    ),
    calc(
      "tiered",
      "הנחה במדרגות",
      `מחיר ${TIER.price} ₪ ליחידה. ברכישה של מעל ${fmt(TIER.wholeOver)} יח׳ — ${TIER.wholePct}% הנחה על כל הרכישה; ועוד ${TIER.unitOff} ₪ הנחה לכל יחידה שמעבר ליחידה ה-${fmt(TIER.unitAfter)}. החברה קנתה ${fmt(TIER_Q)} יח׳ ברכישה אחת. מהי עלות הרכישה?`,
      tierCost(TIER_Q),
      [
        `מחיר: ${fmt(TIER_Q)} × ${TIER.price} = ${fmt(TIER_Q * TIER.price)} ₪.`,
        `מדרגה 1 — עברנו ${fmt(TIER.wholeOver)}: ${TIER.wholePct}% מכל הרכישה = ${fmt((TIER_Q * TIER.price * TIER.wholePct) / 100)} ₪.`,
        `מדרגה 2 — ${fmt(TIER_Q - TIER.unitAfter)} יח׳ מעבר ל-${fmt(TIER.unitAfter)} × ${TIER.unitOff} = ${fmt((TIER_Q - TIER.unitAfter) * TIER.unitOff)} ₪.`,
        `עלות: ${fmt(tierCost(TIER_Q))} ₪ (${fmt(tierCost(TIER_Q) / TIER_Q)} ₪ ליחידה).`,
      ],
    ),
    calc(
      "target-cost",
      "הנחת יעד רכישות",
      `הספק נותן ${TARGET.pct}% הנחה על כל רכישות השנה אם החברה תקנה בה מעל ${fmt(TARGET.over)} יח׳. החברה צופה לעמוד ביעד, וקנתה: ${TARGET.buys.map((b) => `${fmt(b.qty)} יח׳ ב-${b.price} ₪`).join("; ")}. מהי עלות הרכישות של השנה?`,
      TARGET_COST,
      [
        "יעד רכישות בשליטת החברה, והיא צופה לעמוד בו — מכירים בהנחה כבר בכל רכישה.",
        `ברוטו: ${TARGET.buys.map((b) => fmt(b.qty * b.price)).join(" + ")} = ${fmt(TARGET_GROSS)} ₪.`,
        `× ${100 - TARGET.pct}% = ${fmt(TARGET_COST)} ₪.`,
      ],
    ),
    calc(
      "customer-net",
      "הנחה ללקוח",
      `החברה נותנת ${CUST.pct}% הנחה על כל מכירה של מעל ${CUST.over} יח׳. השנה היו שתי מכירות, ב-${CUST.price} ₪ ליחידה: ${CUST.sales.map((q) => `${q} יח׳`).join(" ו-")}. מהן המכירות נטו?`,
      custNet,
      [
        `${CUST.sales[0]} יח׳ — לא עוברות את הסף: ${fmt(CUST.sales[0] * CUST.price)} ₪.`,
        `${CUST.sales[1]} יח׳ — עוברות: ${fmt(CUST.sales[1] * CUST.price)} × ${100 - CUST.pct}% = ${fmt(CUST.sales[1] * CUST.price * (1 - CUST.pct / 100))} ₪.`,
        `מכירות נטו: ${fmt(custNet)} ₪. ההנחה מקטינה את המכירות — לא את עלות המכר.`,
      ],
    ),
    choice(
      "target-missed",
      "יעד שלא הושג",
      "הספק הבטיח 10% הנחה אם החברה תקנה השנה מעל 800,000 יח׳. בסוף השנה התברר שהיא קנתה 540,000. מה עושים?",
      ["אין הנחה — היעד לא הושג", "מנכים 10% מכל הרכישות", "מנכים לפי היחס: 540 ÷ 800 מההנחה", "מנכים רק מהרכישה האחרונה"],
      0,
      "הנחה מותנית קיימת רק אם התנאי מתקיים. לא הגענו ליעד — העלות היא המחיר המלא.",
    ),
    choice(
      "customer-side",
      "הנחה ללקוח",
      "הנחת כמות שהחברה נותנת ללקוח — איפה היא מופיעה?",
      ["מקטינה את המכירות", "מקטינה את עלות המלאי", "מגדילה את עלות המכר", "הוצאות מכירה"],
      0,
      "היא חלק מהמחיר שהלקוח שילם: מכירות נטו = מכירות − הנחות ללקוחות.",
    ),
    journal(
      "discount-entry",
      "קנייה בהנחה",
      "החברה מנהלת מלאי בשיטה תמידית. היא קנתה 1,000 יחידות ב-20 ₪ באשראי, וקיבלה 10% הנחה על כל הרכישה. רשמו את הפקודה.",
      [
        { account: "מלאי", dr: 18_000 },
        { account: "ספקים", cr: 18_000 },
      ],
      "ההנחה מנוכה כבר ברישום: המלאי והחוב לספק נרשמים במחיר נטו — 1,000 × 20 × 90% = 18,000 ₪.",
      ["מלאי", "ספקים", "הכנסות מהנחות", "קניות", "מזומן"],
    ),
    calc(
      "threshold-missed",
      "סף שלא הושג",
      "הספק נותן 8% הנחה על רכישה של מעל 500 יחידות. החברה קנתה 500 יחידות ב-30 ₪, והובלה של 600 ₪ למשלוח. מהי עלות הרכישה?",
      15_600,
      ["״מעל 500״ — ו-500 בדיוק אינו מעל. אין הנחה.", "500 × 30 + 600 = 15,600 ₪."],
    ),
    choice(
      "two-sales",
      "הנחה ללקוח בשתי מכירות",
      "הנחה של 10% ללקוח שקונה מעל 100 יחידות במכירה אחת. לקוח קנה 60 יחידות בבוקר ו-60 בערב. מגיעה לו הנחה?",
      ["לא — כל מכירה נבדקת לחוד", "כן — יחד 120", "כן, על 20 יחידות", "רק על המכירה השנייה"],
      0,
      "התנאי הוא ״במכירה אחת״. אף מכירה לא עברה את הסף.",
    ),
  ],
  traps: [
    {
      id: "sales-target",
      prompt: "הספק מבטיח 10% הנחה אם החברה תמכור השנה מעל 5,000 יחידות, והחברה בטוחה שתעמוד ביעד. מה עושים בעת הרכישה?",
      options: ["לא מנכים — יעד מכירות אינו בשליטת החברה", "מנכים 10% — החברה צופה לעמוד ביעד", "מנכים 5% — חצי מההנחה, מטעמי זהירות", "רושמים את ההנחה כהכנסה"],
      answer: 0,
      why: "יעד מכירות תלוי בלקוחות, לא רק בחברה. מכירים בהנחה רק כשהיעד הושג בפועל.",
      traps: [
        "",
        "המלכודת: ״צופה לעמוד״ מספיק רק ביעד שבשליטה הבלעדית של החברה, כמו יעד רכישות. יעד מכירות — לא.",
        "אין ״חצי הנחה״: או שמכירים בהנחה, או שלא.",
        "הנחה מספק מקטינה את עלות המלאי — היא לעולם אינה הכנסה.",
      ],
    },
    {
      id: "discount-on-freight",
      prompt: "״הספק נותן 10% הנחה על הרכישה״. מחיר 20,000 ₪, הובלה 2,000 ₪. מהי העלות?",
      options: ["20,000 ₪", "19,800 ₪", "18,000 ₪", "22,000 ₪"],
      answer: 0,
      why: "ההנחה של הספק על המחיר שלו: 20,000 × 90% = 18,000, ועוד הובלה 2,000 = 20,000 ₪.",
      traps: ["", "המלכודת: הנחה גם על ההובלה, (20,000 + 2,000) × 90%. ההובלה אינה של הספק.", "שכחתם את ההובלה — היא חלק מהעלות.", "שכחתם את ההנחה."],
    },
  ],
  tips: [
    "קוראים את הניסוח: ״על כל הרכישה״ — הכול; ״על הכמות שמעל N״ — רק העודף; ״מעבר ליחידה ה-N״ — סכום לכל יחידה מעבר.",
    "סדר העבודה: מחיר → הנחה (על המחיר בלבד) → מכס על הנטו → הובלות ועלויות נלוות.",
    "הנחת יעד: מכירים כשהושג, או כשהיעד בשליטת החברה (רכישות) והיא צופה לעמוד בו. יעד מכירות — רק כשהושג.",
    "הנחה ללקוח — מקטינה את המכירות, ונבדקת בכל מכירה לחוד.",
  ],
};
