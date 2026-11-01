import type { StudyModule } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "../shared";

/** A machine sold at the end of its second year. */
export const SOLD = { cost: 120_000, life: 4, years: 2, price: 85_000 };
const soldAccum = (SOLD.cost / SOLD.life) * SOLD.years;
export const SOLD_GAIN = SOLD.price - (SOLD.cost - soldAccum);
/** A truck sold part-way through its life, depreciated at a rate from the middle of a year. */
export const TRUCK_SALE = { cost: 150_000, rate: 0.15, years: 2.5, price: 70_000 };
const truckAccum = TRUCK_SALE.cost * TRUCK_SALE.rate * TRUCK_SALE.years;
export const TRUCK_LOSS = TRUCK_SALE.cost - truckAccum - TRUCK_SALE.price;
/** Half a group of identical computers sold. */
export const GROUP = { units: 10, each: 12_000, life: 4, years: 3, sold: 5, price: 30_000 };
const groupSoldCost = GROUP.sold * GROUP.each;
const groupSoldAccum = (groupSoldCost / GROUP.life) * GROUP.years;
export const GROUP_GAIN = GROUP.price - (groupSoldCost - groupSoldAccum);
const COSTS = { carrying: 40_000, price: 52_000, broker: 2_000 };
const BACK = { carrying: 93_000, loss: 8_000 };

/** Lesson 6: disposal — the gain or loss, depreciation up to the day, selling part of a group, solving for the proceeds, and the year-end entries of a worksheet. */
export const DISPOSAL: StudyModule = {
  slug: "ias16-disposal",
  course: COURSE,
  n: 6,
  title: "מכירה וגריעה",
  description: "רווח או הפסד הון: תמורה נטו מול הערך בספרים ביום המכירה. פחת עד יום המכירה, מכירה של חלק מקבוצה, ותיקוני רכוש קבוע בגיליון עבודה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-sale", title: "רווח או הפסד הון" },
    { id: "ppe-sale-date", title: "קודם פחת עד יום המכירה" },
    { id: "ppe-sale-part", title: "מכירה של חלק מקבוצה" },
    { id: "ppe-worksheet", title: "רכוש קבוע בגיליון עבודה" },
  ],
  exercises: [
    journal(
      "sale-entry",
      "פקודת מכירה",
      `מכונה בעלות ${fmt(SOLD.cost)} ₪, שהפחת הנצבר עליה ${fmt(soldAccum)} ₪, נמכרה במזומן ב-${fmt(SOLD.price)} ₪. רשמו את פקודת המכירה.`,
      [
        { account: "מזומן", dr: SOLD.price },
        { account: "פחת נצבר", dr: soldAccum },
        { account: "מכונה", cr: SOLD.cost },
        { account: "רווח הון", cr: SOLD_GAIN },
      ],
      `הנכס יוצא כולו — עלותו (${fmt(SOLD.cost)}) והפחת שנצבר עליו (${fmt(soldAccum)}). ערכו בספרים ${fmt(SOLD.cost - soldAccum)}; התמורה גבוהה ממנו ב-${fmt(SOLD_GAIN)} — רווח הון.`,
      ["מזומן", "פחת נצבר", "מכונה", "רווח הון", "הפסד הון", "הוצאות פחת"],
    ),
    calc("sale-gain", "רווח הון", `מכונה בעלות ${fmt(SOLD.cost)} ₪, ${SOLD.life} שנות חיים בקו ישר, בלי ערך גרט, נמכרה בסוף השנה ה-${SOLD.years} ב-${fmt(SOLD.price)} ₪. מה רווח ההון?`, SOLD_GAIN, [
      `פחת נצבר: ${fmt(SOLD.cost)} ÷ ${SOLD.life} × ${SOLD.years} = ${fmt(soldAccum)} ₪; ערך בספרים: ${fmt(SOLD.cost - soldAccum)} ₪.`,
      `רווח: ${fmt(SOLD.price)} − ${fmt(SOLD.cost - soldAccum)} = ${fmt(SOLD_GAIN)} ₪.`,
    ]),
    calc(
      "sale-loss",
      "הפסד הון",
      `משאית נקנתה ב-${fmt(TRUCK_SALE.cost)} ₪ ונכנסה לשימוש ב-1.7.2021; שיעור הפחת ${TRUCK_SALE.rate * 100}% בקו ישר. היא נמכרה ב-31.12.2023 ב-${fmt(TRUCK_SALE.price)} ₪. מה הפסד ההון?`,
      TRUCK_LOSS,
      [
        `מ-1.7.2021 עד 31.12.2023 — ${TRUCK_SALE.years} שנים: פחת נצבר ${fmt(TRUCK_SALE.cost)} × ${TRUCK_SALE.rate * 100}% × ${TRUCK_SALE.years} = ${fmt(truckAccum)} ₪.`,
        `ערך בספרים: ${fmt(TRUCK_SALE.cost - truckAccum)} ₪; הפסד: ${fmt(TRUCK_SALE.cost - truckAccum)} − ${fmt(TRUCK_SALE.price)} = ${fmt(TRUCK_LOSS)} ₪.`,
      ],
    ),
    calc(
      "group-sale",
      "מכירת חלק מקבוצה",
      `לחברה ${GROUP.units} מחשבים זהים, ${fmt(GROUP.each)} ₪ כל אחד, ${GROUP.life} שנות חיים בקו ישר. אחרי ${GROUP.years} שנים נמכרו ${GROUP.sold} מהם ב-${fmt(GROUP.price)} ₪. מה רווח ההון?`,
      GROUP_GAIN,
      [
        `העלות של מה שנמכר: ${GROUP.sold} × ${fmt(GROUP.each)} = ${fmt(groupSoldCost)} ₪; הפחת שנצבר עליו: ${fmt(groupSoldCost)} ÷ ${GROUP.life} × ${GROUP.years} = ${fmt(groupSoldAccum)} ₪.`,
        `ערך בספרים: ${fmt(groupSoldCost - groupSoldAccum)} ₪; רווח: ${fmt(GROUP.price)} − ${fmt(groupSoldCost - groupSoldAccum)} = ${fmt(GROUP_GAIN)} ₪.`,
      ],
    ),
    calc("sale-costs", "תמורה נטו", `נכס שערכו בספרים ${fmt(COSTS.carrying)} ₪ נמכר ב-${fmt(COSTS.price)} ₪, ושולמה עמלת תיווך של ${fmt(COSTS.broker)} ₪. מה רווח ההון?`, COSTS.price - COSTS.broker - COSTS.carrying, [
      `תמורה נטו = מחיר − עלויות המכירה: ${fmt(COSTS.price)} − ${fmt(COSTS.broker)} = ${fmt(COSTS.price - COSTS.broker)} ₪.`,
      `רווח: ${fmt(COSTS.price - COSTS.broker)} − ${fmt(COSTS.carrying)} = ${fmt(COSTS.price - COSTS.broker - COSTS.carrying)} ₪.`,
    ]),
    calc("back-price", "תמורה מהפסד נתון", `נכס שערכו בספרים ביום המכירה ${fmt(BACK.carrying)} ₪ נמכר בהפסד הון של ${fmt(BACK.loss)} ₪. מה הייתה התמורה?`, BACK.carrying - BACK.loss, [
      "תמורה − ערך בספרים = רווח (או הפסד, בשלילה).",
      `תמורה = ${fmt(BACK.carrying)} − ${fmt(BACK.loss)} = ${fmt(BACK.carrying - BACK.loss)} ₪.`,
    ]),
    choice(
      "gain-line",
      "הצגה",
      "איפה מוצג רווח הון ממכירת מכונה?",
      ["ברווח או הפסד — לא כהכנסה ממכירות", "בהכנסות ממכירות", "ישירות בהון", "ברווח כולל אחר"],
      0,
      "רווח מגריעה נכלל ברווח או הפסד, אבל אינו מסווג כהכנסה — החברה לא עוסקת במכירת מכונות.",
    ),
  ],
  traps: [
    {
      id: "forgot-sale-dep",
      prompt: "מכונה: עלות 100,000 ₪, פחת שנתי 10,000 ₪, פחת נצבר ב-1.1 — 40,000 ₪. נמכרה ב-1.10 ב-55,000 ₪. מה התוצאה?",
      options: ["רווח של 2,500 ₪", "הפסד של 5,000 ₪", "רווח של 55,000 ₪", "רווח של 15,000 ₪"],
      answer: 0,
      why: "קודם פחת עד יום המכירה: 9 חודשים, 7,500 ₪. ערך בספרים: 100,000 − 47,500 = 52,500 ₪. רווח: 55,000 − 52,500 = 2,500 ₪.",
      traps: ["", "המלכודת: שכחתם את הפחת מ-1.1 עד יום המכירה, והשוויתם לערך בספרים של תחילת השנה.", "התמורה אינה הרווח — משווים אותה לערך בספרים.", "השוויתם את התמורה לפחת הנצבר — אבל משווים אותה לערך בספרים."],
    },
    {
      id: "group-accum",
      prompt: "נמכרו 2 מתוך 8 מכונות זהות. איזה פחת נצבר גורעים?",
      options: ["רק את הפחת שנצבר על 2 המכונות שנמכרו", "את כל הפחת הנצבר של הקבוצה", "אפס — הקבוצה נשארת", "את הפחת של השנה בלבד"],
      answer: 0,
      why: "יוצא רק מה שנמכר — העלות שלו והפחת שנצבר עליו. שאר הקבוצה נשארת בספרים.",
      traps: ["", "המלכודת: גריעת כל הפחת הנצבר משאירה 6 מכונות בספרים בלי שום פחת.", "מה שנמכר יוצא — עם הפחת שלו.", "הפחת שנצבר מהרכישה, לא רק השנה."],
    },
  ],
  tips: [
    "רווח (הפסד) הון = תמורה נטו − ערך בספרים ביום המכירה. תמורה נטו = מחיר − עלויות המכירה.",
    "לפני המכירה — פחת עד יום המכירה. אחרת הערך בספרים, והרווח, שגויים.",
    "פקודה: ח׳ מזומן, ח׳ פחת נצבר (כל מה שנצבר על הנכס), ז׳ הנכס בעלותו; ההפרש — רווח או הפסד הון.",
    "חלק מקבוצה: גורעים רק את העלות של מה שנמכר ואת הפחת שנצבר עליו.",
    "רווח הון — ברווח או הפסד, לא בהכנסות ממכירות.",
  ],
};
