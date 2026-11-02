import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "./shared";

/**
 * The pen shop of lessons 6 and 7: two purchases and two sales, with prices
 * chosen so that every method comes out in whole shekels. The course's test
 * values the same year with the engine and expects these figures.
 */
export const ET = {
  buy1: { date: "1.2", qty: 100, price: 10 },
  sell1: { date: "1.4", qty: 50 },
  buy2: { date: "1.6", qty: 150, price: 14 },
  sell2: { date: "1.9", qty: 120, price: 25 },
};
export const ET_UNITS = ET.buy1.qty + ET.buy2.qty;
export const ET_COST = ET.buy1.qty * ET.buy1.price + ET.buy2.qty * ET.buy2.price;
export const ET_CLOSING_UNITS = ET_UNITS - ET.sell1.qty - ET.sell2.qty;
export const ET_FIFO_CLOSING = ET_CLOSING_UNITS * ET.buy2.price;
export const ET_DATA = `חנות ״עט״, בלי מלאי פתיחה: ${ET.buy1.date} — קנתה ${ET.buy1.qty} יח׳ ב-${ET.buy1.price} ₪; ${ET.sell1.date} — מכרה ${ET.sell1.qty} יח׳; ${ET.buy2.date} — קנתה ${ET.buy2.qty} יח׳ ב-${ET.buy2.price} ₪; ${ET.sell2.date} — מכרה ${ET.sell2.qty} יח׳.`;
const left1 = ET.buy1.qty - ET.sell1.qty;
export const ET_FIFO_SALE2 = left1 * ET.buy1.price + (ET.sell2.qty - left1) * ET.buy2.price;

/** The specific-identification screen's showroom: three cars, each with its own cost. */
export const CARS = [
  { name: "רכב א׳", cost: 80_000 },
  { name: "רכב ב׳", cost: 95_000 },
  { name: "רכב ג׳", cost: 120_000 },
];
const LAYERS = { open: { qty: 100, cost: 10 }, b1: { qty: 200, cost: 12 }, b2: { qty: 150, cost: 15 }, sold: 200 };
const layersLeft = LAYERS.open.qty + LAYERS.b1.qty + LAYERS.b2.qty - LAYERS.sold;
const layersClosing = LAYERS.b2.qty * LAYERS.b2.cost + (layersLeft - LAYERS.b2.qty) * LAYERS.b1.cost;

/** Lesson 6: the cost formulas — specific identification, then FIFO, worked as an exam answer and on the perpetual shelf. */
export const FIFO: StudyModule = {
  slug: "inventory-fifo",
  course: COURSE,
  n: 6,
  title: "זיהוי ספציפי ו-FIFO",
  description: "כשהמחירים משתנים — איזו יחידה נמכרה? זיהוי ספציפי לפריטים ייחודיים, ו-FIFO: בדרך התקופתית, כמו בתשובה במבחן, ובכרטיס התמידי.",
  goal: "לקבוע איזו יחידה נמכרה כשהמחירים משתנים: זיהוי ספציפי ו-FIFO.",
  outcomes: [
    "לבחור נוסחת עלות לפי סוג המלאי",
    "לחשב עלות לפי זיהוי ספציפי",
    "לחשב מלאי סגירה ועלות מכר ב-FIFO — בדרך התקופתית ובכרטיס התמידי",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-formulas", title: "נוסחאות עלות: התמונה הגדולה" },
    { id: "iv-specific", title: "זיהוי ספציפי: לכל פריט העלות שלו" },
    { id: "inv-fifo", title: "FIFO: טבלת התנועות והדרך התקופתית" },
    { id: "inv-fifo-shelf", title: "FIFO תמידי: מאיזו שכבה לקחנו" },
  ],
  exercises: [
    calc("fifo-closing", "FIFO", `${ET_DATA} מהו מלאי הסגירה לפי FIFO?`, ET_FIFO_CLOSING, [
      `כמות הסגירה: ${ET_UNITS} − ${ET.sell1.qty} − ${ET.sell2.qty} = ${ET_CLOSING_UNITS} יח׳.`,
      `ב-FIFO נשארות האחרונות: כל ${ET_CLOSING_UNITS} היחידות מהרכישה של ${ET.buy2.date}.`,
      `${ET_CLOSING_UNITS} × ${ET.buy2.price} = ${fmt(ET_FIFO_CLOSING)} ₪.`,
    ]),
    calc("fifo-cogs", "FIFO", `${ET_DATA} מהי עלות המכר לפי FIFO?`, ET_COST - ET_FIFO_CLOSING, [
      `כל מה שהיה זמין: ${fmt(ET_COST)} ₪; מלאי הסגירה לפי FIFO: ${fmt(ET_FIFO_CLOSING)} ₪.`,
      `עלות המכר: ${fmt(ET_COST)} − ${fmt(ET_FIFO_CLOSING)} = ${fmt(ET_COST - ET_FIFO_CLOSING)} ₪.`,
    ]),
    calc("fifo-sale2", "FIFO תמידי", `${ET_DATA} החנות מנהלת FIFO בשיטה תמידית. מהי עלות המכירה של ${ET.sell2.date}?`, ET_FIFO_SALE2, [
      `אחרי המכירה הראשונה נשארו ${left1} יח׳ מהשכבה של ${ET.buy1.date}, ב-${ET.buy1.price} ₪.`,
      `במכירה השנייה לוקחים קודם אותן: ${left1} × ${ET.buy1.price} = ${fmt(left1 * ET.buy1.price)}; ואת השאר מהשכבה הבאה: ${ET.sell2.qty - left1} × ${ET.buy2.price} = ${fmt((ET.sell2.qty - left1) * ET.buy2.price)}.`,
      `עלות המכירה: ${fmt(ET_FIFO_SALE2)} ₪.`,
    ]),
    calc(
      "fifo-layers",
      "FIFO עם מלאי פתיחה",
      `מלאי פתיחה ${LAYERS.open.qty} יח׳ ב-${LAYERS.open.cost} ₪; נקנו ${LAYERS.b1.qty} יח׳ ב-${LAYERS.b1.cost} ₪ ואחר כך ${LAYERS.b2.qty} יח׳ ב-${LAYERS.b2.cost} ₪; נמכרו ${LAYERS.sold} יח׳. מהו מלאי הסגירה לפי FIFO?`,
      layersClosing,
      [
        `נשארו ${LAYERS.open.qty} + ${LAYERS.b1.qty} + ${LAYERS.b2.qty} − ${LAYERS.sold} = ${layersLeft} יח׳.`,
        `מהרכישה האחרונה אחורה: ${LAYERS.b2.qty} × ${LAYERS.b2.cost} = ${fmt(LAYERS.b2.qty * LAYERS.b2.cost)}; ועוד ${layersLeft - LAYERS.b2.qty} × ${LAYERS.b1.cost} = ${fmt((layersLeft - LAYERS.b2.qty) * LAYERS.b1.cost)}.`,
        `מלאי הסגירה: ${fmt(layersClosing)} ₪. מלאי הפתיחה כבר נמכר כולו.`,
      ],
    ),
    calc(
      "specific",
      "זיהוי ספציפי",
      `סוכנות רכבי יוקרה מחזיקה שלושה רכבים: ${CARS.map((c) => `${c.name} בעלות ${fmt(c.cost)} ₪`).join(", ")}. נמכר ${CARS[1].name}. מהו מלאי הסגירה?`,
      CARS[0].cost + CARS[2].cost,
      ["כל רכב ייחודי — לכל אחד העלות שלו, בלי ממוצע ובלי FIFO.", `נשארו ${CARS[0].name} ו${CARS[2].name}: ${fmt(CARS[0].cost)} + ${fmt(CARS[2].cost)} = ${fmt(CARS[0].cost + CARS[2].cost)} ₪.`],
    ),
    choice("lifo", "נוסחת עלות", "איזו נוסחת עלות אסורה לפי IAS 2?", ["FIFO", "ממוצע משוקלל תקופתי", "LIFO", "ממוצע משוקלל נע"], 2, "התקן אינו מתיר LIFO."),
    choice("fifo-which", "FIFO", "ב-FIFO, מאילו רכישות מוערך מלאי הסגירה?", ["מהראשונות", "מהאחרונות", "מממוצע של כולן", "מהזולה ביותר"], 1, "הוותיקות נמכרו קודם — נשארות האחרונות."),
    choice(
      "specific-when",
      "זיהוי ספציפי",
      "מתי משתמשים בזיהוי ספציפי?",
      ["לפריטים שאינם בני החלפה — כל אחד ייחודי", "תמיד, כי הוא המדויק ביותר", "כשהמחירים עולים", "כשהחברה בוחרת, לכל מלאי"],
      0,
      "התקן מחייב זיהוי ספציפי לפריטים שאינם בני החלפה, או שיוצרו לפרויקט מסוים. לשאר — FIFO או ממוצע משוקלל.",
    ),
    choice(
      "same-formula",
      "עקביות",
      "לחברה שני סוגי מלאי דומים באופיים ובשימושם. האם מותר לה להעריך אחד ב-FIFO ואחד בממוצע?",
      ["לא — לאותו סוג מלאי, אותה נוסחה", "כן, בלי הגבלה", "רק בשיטה תמידית", "רק אם המחירים שונים"],
      0,
      "IAS 2.25: לכל מלאי בעל אופי ושימוש דומים — אותה נוסחת עלות.",
    ),
    calc(
      "fifo-three",
      "FIFO משלוש רכישות",
      "מלאי פתיחה 40 יח׳ ב-8 ₪. נקנו 60 יח׳ ב-9 ₪, 50 יח׳ ב-10 ₪ ו-30 יח׳ ב-12 ₪. נמכרו 110 יח׳. מהו מלאי הסגירה לפי FIFO?",
      760,
      ["נשארו: 40 + 60 + 50 + 30 − 110 = 70 יח׳.", "מהרכישה האחרונה אחורה: 30 × 12 = 360, ועוד 40 × 10 = 400.", "מלאי הסגירה: 760 ₪."],
    ),
    calc(
      "fifo-first-sale",
      "FIFO תמידי: מכירה שחוצה שכבות",
      "במלאי 30 יח׳ ב-5 ₪ (ותיקות) ו-50 יח׳ ב-7 ₪. נמכרו 45 יח׳. בשיטת FIFO תמידית — מה עלות המכירה?",
      255,
      ["קודם השכבה הוותיקה: 30 × 5 = 150 ₪.", "ועוד 15 מהשכבה הבאה: 15 × 7 = 105 ₪.", "עלות המכירה: 255 ₪."],
    ),
  ],
  traps: [
    {
      id: "fifo-perpetual-same",
      prompt: "חנות מנהלת מלאי ב-FIFO. ״אם נעבור משיטה תקופתית לתמידית, מלאי הסגירה ישתנה״. נכון?",
      options: ["לא — ב-FIFO שתי הדרכים נותנות אותו מלאי סגירה", "כן — בתמידית הוא תמיד גבוה יותר", "כן — בתמידית הוא תמיד נמוך יותר", "תלוי אם המחירים עולים או יורדים"],
      answer: 0,
      why: "ב-FIFO נשארות תמיד היחידות האחרונות שנקנו — לא משנה אם מחשבים בכל מכירה או פעם בשנה. לכן מלאי הסגירה ועלות המכר זהים.",
      traps: ["", "בתמידית לוקחים בכל מכירה את השכבה הוותיקה — בדיוק מה שהתקופתית מניחה. אין סיבה שייצא יותר.", "אותה סיבה: שתי הדרכים מוציאות את אותן שכבות, רק בזמנים שונים.", "המלכודת: מגמת המחירים קובעת כמה עולה כל שכבה, אבל לא אילו שכבות נשארו — ובשתי הדרכים נשארות האחרונות."],
    },
    {
      id: "fifo-from-first",
      prompt: "ב-FIFO תקופתי, נשארו 150 יחידות. נקנו 200 ב-12 ₪ ואחר כך 300 ב-15 ₪. מהו מלאי הסגירה?",
      options: ["2,250 ₪", "1,800 ₪", "2,025 ₪", "2,000 ₪"],
      answer: 0,
      why: "נשארות האחרונות: 150 מהרכישה של 15 ₪ = 2,250 ₪.",
      traps: ["", "המלכודת: לקחתם את הראשונות (150 × 12). ב-FIFO הראשונות נמכרו.", "ממוצע — זו לא השיטה של השאלה.", "אין סיבה לעגל: 150 × 15 = 2,250."],
    },
  ],
  tips: [
    "זיהוי ספציפי — לפריטים ייחודיים. לכל השאר: FIFO או ממוצע משוקלל. LIFO אסור.",
    "FIFO: נשארות הרכישות האחרונות. לסגירה הולכים מהרכישה האחרונה אחורה — וזה זהה בתקופתי ובתמידי.",
    "בתמידי: בכל מכירה לוקחים קודם מהשכבה הוותיקה שעוד נשארה.",
  ],
};
