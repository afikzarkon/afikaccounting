import { pvEnd, rateFor } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import type { TestEnd, TestNode } from "./what";

const r = Math.round;

export type InvestRow = { year: number; opening: number; income: number; receipt: number; closing: number; nonCurrent: number; current: number };

/**
 * A net investment year by year, in whole shekels and worked by hand: each year's
 * income on the rounded balance, and the last year, if the lease ends, takes up the
 * rounding. Non-current: what is left once next year's receipt is in.
 */
export function investRows(start: number, rate: number, receipt: number, years: number, endsAt = 0): InvestRow[] {
  const rows: InvestRow[] = [];
  let open = start;
  for (let y = 1; y <= years; y++) {
    const closing = y === years ? endsAt : open + r(open * rate) - receipt;
    rows.push({ year: y, opening: open, income: closing - open + receipt, receipt, closing, nonCurrent: 0, current: 0 });
    open = closing;
  }
  rows.forEach((row, i) => {
    row.nonCurrent = rows[i + 1]?.closing ?? 0;
    row.current = row.closing - row.nonCurrent;
  });
  return rows;
}

/** The signs of a finance lease (paragraphs 63, 64), to sort. */
export const CLASS_ITEMS: { text: string; answer: "fin" | "op"; why: string }[] = [
  { text: "הבעלות עוברת לחוכר בסוף החכירה.", answer: "fin", why: "סעיף 63(א)." },
  { text: "לחוכר אופציית רכישה במחיר נמוך בהרבה מהשווי הצפוי.", answer: "fin", why: "סעיף 63(ב): ודאי באופן סביר, כבר בהתקשרות, שתמומש." },
  { text: "חכירה ל-9 שנים של נכס עם 10 שנות חיים כלכליים.", answer: "fin", why: "סעיף 63(ג): החלק העיקרי של החיים הכלכליים." },
  { text: "מכונה שנבנתה במיוחד לחוכר, ואחרים לא יכולים להשתמש בה בלי שינויים גדולים.", answer: "fin", why: "סעיף 63(ה)." },
  { text: "חכירה לשנתיים של נכס עם 10 שנות חיים, והערך הנוכחי של התשלומים 20% מהשווי ההוגן.", answer: "op", why: "המחכיר נשאר עם רוב הסיכונים וההטבות." },
  { text: "הבעלות עוברת בסוף, תמורת תשלום משתנה השווה לשווי ההוגן באותו מועד.", answer: "op", why: "סעיף 65: הסימן לא חד משמעי. החוכר משלם שווי מלא, ולכן הסיכון נשאר אצל המחכיר." },
  { text: "הבעלות עוברת בסוף, אבל כל תשלומי החכירה נגזרים מהתפוקה של הנכס.", answer: "op", why: "סעיף 65: הסימן לא חד משמעי. התשלומים תלויים בתפוקה, ולכן הסיכונים וההטבות לא עברו." },
];
export const CLASS_OPTIONS: [string, string][] = [
  ["fin", "מימונית"],
  ["op", "תפעולית"],
];

/** Worked: a machine let for three years, with rising rent. */
export const OP = { cost: 240_000, life: 12, age: 2, rents: [24_000, 27_000, 30_000], lawyer: 4_500, years: 3 };
export const OP_TOTAL = OP.rents.reduce((a, b) => a + b, 0);
export const OP_INCOME = OP_TOTAL / OP.years;
export const OP_DEP = OP.cost / OP.life;
export const OP_BV = OP.cost - OP_DEP * OP.age;
export const OP_IDC_YEAR = OP.lawyer / OP.years;
export const OP_EXPENSE = OP_DEP + OP_IDC_YEAR;
export const OP_ROWS = OP.rents.map((rent, i) => ({ year: i + 1, rent, income: OP_INCOME, expense: OP_EXPENSE, accrued: OP_INCOME * (i + 1) - OP.rents.slice(0, i + 1).reduce((a, b) => a + b, 0), asset: OP_BV + OP.lawyer - OP_EXPENSE * (i + 1) }));

/** Worked: one truck, four kinds of lessor. */
export const TRUCK = { payment: 40_000, years: 3, fairValue: 100_000, costs: 3_000, bookValue: 85_000, dealerCost: 85_000, lowPayment: 36_000, lowRate: 0.04 };
export const ND_START = TRUCK.fairValue + TRUCK.costs;
export const ND_RATE = rateFor(ND_START, TRUCK.years, TRUCK.payment);
export const ND_ROWS = investRows(ND_START, ND_RATE, TRUCK.payment, TRUCK.years);
export const ND_GAIN = TRUCK.fairValue - TRUCK.bookValue;
export const D_RATE = rateFor(TRUCK.fairValue, TRUCK.years, TRUCK.payment);
export const D_ROWS = investRows(TRUCK.fairValue, D_RATE, TRUCK.payment, TRUCK.years);
export const D_GROSS = TRUCK.fairValue - TRUCK.dealerCost;
/** The lessor advertises a rate far below the market's. */
export const LOW_NAIVE = r(pvEnd(TRUCK.lowRate, TRUCK.years, TRUCK.lowPayment));
export const LOW_SALES = r(pvEnd(D_RATE, TRUCK.years, TRUCK.lowPayment));
export const LOW_GROSS = LOW_SALES - TRUCK.dealerCost;
export const LOW_ROWS = investRows(LOW_SALES, D_RATE, TRUCK.lowPayment, TRUCK.years);

/** Worked: a dealer who gets the car back, with part of its value guaranteed. */
export const RES = { payment: 28_000, years: 4, life: 5, fairValue: 100_000, cost: 90_000, guaranteed: 4_000, estimate: 12_000, newEstimate: 9_000 };
export const RES_UN = RES.estimate - RES.guaranteed;
export const RES_RATE = rateFor(RES.fairValue, RES.years, RES.payment, RES.estimate);
export const RES_PV_UN = r(RES_UN / (1 + RES_RATE) ** RES.years);
export const RES_SALES = RES.fairValue - RES_PV_UN;
export const RES_COGS = RES.cost - RES_PV_UN;
export const RES_GROSS = RES_SALES - RES_COGS;
export const RES_INT1 = r(RES.fairValue * RES_RATE);
export const RES_BEFORE = RES.fairValue + RES_INT1 - RES.payment;
export const RES_AFTER = r(pvEnd(RES_RATE, RES.years - 1, RES.payment, RES.newEstimate));
export const RES_LOSS = RES_BEFORE - RES_AFTER;
export const RES_INT2 = r(RES_AFTER * RES_RATE);
export const RES_CLOSE2 = RES_AFTER + RES_INT2 - RES.payment;
export const RES_NC2 = r(pvEnd(RES_RATE, RES.years - 3, RES.payment, RES.newEstimate));

/** The closing question: a dealer's shop, an index, a share of takings and a purchase option. */
export const STORE = { payment: 100_000, years: 8, optionYears: 2, life: 10, option: 8_000, fairValue: 700_000, cost: 600_000, costs: 6_000, base: 100, index: 103, sales: 400_000, share: 0.02 };
export const STORE_RATE = rateFor(STORE.fairValue, STORE.years, STORE.payment, STORE.option);
export const STORE_INT = r(STORE.fairValue * STORE_RATE);
export const STORE_CLOSE = STORE.fairValue + STORE_INT - STORE.payment;
export const STORE_NC = r(pvEnd(STORE_RATE, STORE.years - 2, STORE.payment, STORE.option));
export const STORE_INDEX = (STORE.payment * (STORE.index - STORE.base)) / STORE.base;
export const STORE_VAR = STORE.sales * STORE.share;
export const STORE_CASH = STORE.payment + STORE_INDEX + STORE_VAR;
export const STORE_GROSS = STORE.fairValue - STORE.cost;
export const STORE_TOTAL = STORE_GROSS - STORE.costs + STORE_INT + STORE_INDEX + STORE_VAR;

/** Finance or operating: the walk through paragraphs 63 to 65. */
export const CLASS_WALK: Record<string, TestNode | TestEnd> = {
  owner: { q: "הבעלות עוברת לחוכר בסוף?", par: "סעיף 63(א)", help: "אם כן, בודקים עוד דבר אחד: איך החוכר משלם.", answers: [{ label: "כן", to: "price" }, { label: "לא", to: "option" }] },
  price: { q: "התשלום על הבעלות שווה לשווי ההוגן של אותו יום, או שכל תשלומי החכירה נגזרים מתפוקת הנכס?", par: "סעיף 65", help: "בשני המקרים הסיכונים וההטבות לא עברו לחוכר, גם אם הבעלות עוברת.", answers: [{ label: "כן", to: "operating" }, { label: "לא", to: "finance" }] },
  option: { q: "יש אופציית רכישה שוודאי באופן סביר שתמומש?", par: "סעיף 63(ב)", help: "מחיר נמוך מספיק מהשווי הצפוי, כבר במועד ההתקשרות.", answers: [{ label: "כן", to: "finance" }, { label: "לא", to: "term" }] },
  term: { q: "התקופה היא החלק העיקרי של החיים הכלכליים?", par: "סעיף 63(ג)", help: "בפרקטיקה נהוג לבדוק 75%. בתקן אין מספר, אלא ״החלק העיקרי״.", answers: [{ label: "כן", to: "finance" }, { label: "לא", to: "value" }] },
  value: { q: "הערך הנוכחי של התשלומים הוא למעשה כל השווי ההוגן?", par: "סעיף 63(ד)", help: "בפרקטיקה נהוג לבדוק 90%. בתקן: ״למעשה כל השווי ההוגן״.", answers: [{ label: "כן", to: "finance" }, { label: "לא", to: "special" }] },
  special: { q: "הנכס כל כך ייחודי, שרק החוכר יכול להשתמש בו בלי שינויים גדולים?", par: "סעיף 63(ה)", help: "למשל קו ייצור שנבנה לפי מידה.", answers: [{ label: "כן", to: "finance" }, { label: "לא", to: "more" }] },
  more: { q: "יש סימן נוסף: ביטול שהחוכר נושא בהפסדיו, שייר שהוא נושא בתנודות שלו, או הארכה זולה בהרבה מהשוק?", par: "סעיף 64", help: "סימנים שיכולים להוביל לסיווג כמימונית, לבד או ביחד.", answers: [{ label: "כן", to: "finance" }, { label: "לא", to: "operating" }] },
  finance: { lease: true, verdict: "חכירה מימונית", why: "המחכיר העביר למעשה את כל הסיכונים וההטבות (סעיף 62). הנכס יוצא מהספרים, ובמקומו השקעה נטו." },
  operating: { lease: true, verdict: "חכירה תפעולית", why: "הסיכונים וההטבות נשארים אצל המחכיר. הנכס נשאר בספרים, וההכנסה בדרך כלל בקו ישר." },
};
export const CLASS_WALK_START = "owner";

const P_NI = 150_000;
const P_NI_Y1 = P_NI + r(P_NI * 0.08) - 40_000;
const P_NI_Y2 = P_NI_Y1 + r(P_NI_Y1 * 0.08) - 40_000;
const P_CAP = r(pvEnd(0.1, 4, 30_000));
const P_RES_RATE = rateFor(100_000, 5, 25_000, 10_000);
const P_RES_PVU = r(7_000 / (1 + P_RES_RATE) ** 5);
const P_LOSS = r(4_000 / 1.07 ** 3);

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  ask({ id: "class-own", skill: "סיווג", prompt: "מחכיר מחכיר מכונה ל-3 שנים מתוך 10 שנות חיים. בסוף התקופה הבעלות עוברת לחוכר בלי תשלום נוסף. איך מסווגים?", options: ["מימונית", "תפעולית, כי התקופה קצרה", "לפי בחירת המחכיר", "לא חכירה"], answer: 0, why: "סעיף 63(א): העברת בעלות היא סימן למימונית, גם כשהתקופה קצרה.", trap: "לבדוק רק את אורך התקופה. כל סימן לבדו יכול להספיק.", level: 1, source: "מקורית", ref: "סעיף 63(א)" }),
  ask({ id: "class-short", skill: "סיווג", prompt: "מכונה עם 10 שנות חיים כלכליים מוחכרת ל-4 שנים. הערך הנוכחי של התשלומים 55% מהשווי ההוגן. אין אופציה ואין העברת בעלות. המכונה סטנדרטית. איך מסווגים?", options: ["תפעולית", "מימונית", "מימונית, כי יש תשלומים", "לא ניתן לדעת"], answer: 0, why: "אף סימן בסעיפים 63, 64 לא מתקיים, והמחכיר נשאר עם הסיכונים וההטבות.", trap: "לחשוב שכל חכירה עם תשלומים היא מימון. בודקים מי נושא בסיכונים.", level: 2, source: "מקורית", ref: "סעיפים 62–64" }),
  ask({ id: "class-rule", skill: "סיווג", prompt: "תקופת החכירה 72% מהחיים הכלכליים, ויש לכך משקל רב בעסקה. סטודנט אומר: ״פחות מ-75%, אז התקן אוסר על סיווג כמימונית״. מה נכון?", options: ["75% הוא כלל אצבע. התקן אומר ״החלק העיקרי״, ובודקים מהות", "הסטודנט צודק", "הסף בתקן הוא 70%", "מותר לסווג רק אם יש גם העברת בעלות"], answer: 0, why: "סעיף 63(ג) לא נוקב במספר. 75% הוא נוהג מקובל בפרקטיקה.", trap: "להתייחס לאחוז כאל כלל בתקן. גם 90% בערך הנוכחי הוא נוהג.", level: 3, source: "מקורית", ref: "סעיף 63" }),
  ask({ id: "class-when", skill: "סיווג", prompt: "חכירה סווגה כתפעולית. אחרי שנתיים המחכיר מעריך מחדש את החיים הכלכליים, וכעת התקופה היא החלק העיקרי שלהם. מה עושים?", options: ["כלום. הסיווג נקבע בהתקשרות, ומשתנה רק בתיקון", "מסווגים כמימונית מעכשיו", "מתקנים למפרע", "מודדים השקעה נטו בלי לגרוע את הנכס"], answer: 0, why: "סעיף 66: שינויי אומדן או נסיבות אינם גורמים לסיווג מחדש.", trap: "לעדכן סיווג כמו שמעדכנים תקופה אצל החוכר.", level: 2, source: "מקורית", ref: "סעיף 66" }),
  ask({ id: "class-fv", skill: "סיווג", prompt: "הבעלות עוברת לחוכר בסוף החכירה, תמורת תשלום השווה לשווי ההוגן של אותו יום. החכירה קצרה ביחס לחיי הנכס, והתשלומים נמוכים ביחס לשווי. איך מסווגים?", options: ["תפעולית", "מימונית, כי הבעלות עוברת", "מימונית, כי יש תשלום בסוף", "לא חכירה"], answer: 0, why: "סעיף 65: הסיכון לערך נשאר אצל המחכיר עד הסוף.", trap: "לעצור בסימן הראשון. הסימנים אינם תמיד חד משמעיים.", level: 3, source: "מקורית", ref: "סעיף 65" }),
  askNumber({ id: "op-income", skill: "תפעולית", prompt: "חכירה תפעולית ל-3 שנים. התשלומים 30,000, 40,000 ו-50,000 ש״ח, בסוף כל שנה. מהי הכנסת החכירה בשנה הראשונה?", answer: 40_000, steps: ["30,000 + 40,000 + 50,000 = 120,000", "בקו ישר: 120,000 ÷ 3 = 40,000 (סעיף 81)"], trap: "לרשום את מה שהתקבל, 30,000. ההכנסה לא הולכת אחרי הכסף.", level: 1, source: "מקורית", ref: "סעיף 81" }),
  askNumber({ id: "op-accrued", skill: "תפעולית", prompt: "חכירה תפעולית ל-3 שנים. התשלומים 30,000, 40,000 ו-50,000 ש״ח, בסוף כל שנה. מהי יתרת ההכנסות לקבל ב-31.12 של השנה הראשונה?", answer: 10_000, steps: ["הכנסה בקו ישר: 120,000 ÷ 3 = 40,000", "40,000 − 30,000 = 10,000"], trap: "לחשוב שאין יתרה כי החוכר שילם בזמן. ההפרש בין הכנסה לתקבול הוא נכס.", level: 2, source: "מקורית", ref: "סעיף 81" }),
  askNumber({ id: "op-dep", skill: "תפעולית", prompt: "מחכיר בחכירה תפעולית ל-3 שנים. ערך המכונה בספרים 150,000 ש״ח, ונשארו לה 10 שנים, בקו ישר. שכר עורך הדין על חוזה החכירה 6,000 ש״ח. מהן הוצאות הפחת השנתיות?", answer: 17_000, steps: ["פחת המכונה: 150,000 ÷ 10 = 15,000", "העלות הישירה נוספת לנכס, על פני החכירה: 6,000 ÷ 3 = 2,000 (סעיף 83)", "15,000 + 2,000 = 17,000"], trap: "לרשום את 6,000 כהוצאה מיידית, או לפרוס אותם על חיי המכונה.", level: 2, source: "מקורית", ref: "סעיפים 83, 84" }),
  ask({ id: "op-dealer", skill: "תפעולית", prompt: "סוחר מכונות מחכיר מכונה בחכירה תפעולית. עלותה אצלו 60,000 ש״ח, ושוויה ההוגן 75,000 ש״ח. האם הוא מכיר ברווח מיום החכירה?", options: ["לא. חכירה תפעולית אינה שוות ערך למכירה", "כן, 15,000 ש״ח", "כן, חלק יחסי", "רק אם החוכר שילם מראש"], answer: 0, why: "סעיף 86.", trap: "להחיל את כללי הסוחר של מימונית גם כאן.", level: 2, source: "מקורית", ref: "סעיף 86" }),
  askNumber({ id: "ni-start", skill: "מימונית", prompt: "מחכיר שאינו יצרן או סוחר. השווי ההוגן של הנכס 120,000 ש״ח, והעלויות הישירות שלו 4,000 ש״ח. מהי ההשקעה נטו במועד התחילה?", answer: 124_000, steps: ["שווי הוגן + עלויות ישירות = השקעה נטו\n120,000 + 4,000 = 124,000 (סעיף 69)"], trap: "לרשום את העלויות כהוצאה. זה רק אצל יצרן או סוחר.", level: 1, source: "מקורית", ref: "סעיף 69" }),
  askNumber({ id: "ni-gain", skill: "מימונית", prompt: "חברה מחכירה בחכירה מימונית מכונה שהייתה רכוש קבוע שלה, והיא אינה סוחרת. ערך המכונה בספרים 95,000 ש״ח, ושוויה ההוגן 120,000 ש״ח. כמה רווח הון נרשם?", answer: 25_000, steps: ["120,000 − 95,000 = 25,000"], trap: "לרשום הכנסות ממכירה ועלות מכר. אצל מי שאינו סוחר זה רווח הון אחד.", level: 2, source: "מקורית", ref: "סעיף 67" }),
  askNumber({ id: "ni-y2", skill: "מימונית", prompt: "השקעה נטו של 150,000 ש״ח, בריבית גלומה של 8%. תקבול של 40,000 ש״ח בסוף כל שנה. מהי היתרה ב-31.12 של השנה השנייה?", answer: P_NI_Y2, steps: [`שנה 1: 150,000 × 1.08 − 40,000 = ${fmt(P_NI_Y1)}`, `שנה 2: ${fmt(P_NI_Y1)} × 1.08 − 40,000 = ${fmt(P_NI_Y2)}`], trap: "להוריד את כל התקבול בלי להוסיף הכנסת מימון.", level: 2, source: "מקורית", ref: "סעיף 75" }),
  askNumber({ id: "dealer-sales", skill: "סוחר", prompt: "סוחר מחכיר בחכירה מימונית נכס ששוויו ההוגן 200,000 ש״ח. הערך הנוכחי של תשלומי החכירה, בריבית שוק, 190,000 ש״ח. אין שייר. כמה הכנסות ממכירות נרשמות?", answer: 190_000, steps: ["הנמוך מבין השווי ההוגן והערך הנוכחי בריבית שוק (סעיף 71(א)): 190,000"], trap: "לרשום תמיד את השווי ההוגן.", level: 2, source: "מקורית", ref: "סעיף 71(א)" }),
  askNumber({ id: "dealer-profit", skill: "סוחר", prompt: "סוחר מחכיר בחכירה מימונית נכס ששוויו ההוגן 100,000 ש״ח, ועלותו 70,000 ש״ח. הערך הנוכחי בריבית שוק שווה לשווי ההוגן. עלויות השגת החכירה 5,000 ש״ח. מהי ההשפעה נטו על רווח או הפסד במועד התחילה?", answer: 25_000, steps: ["100,000 − 70,000 − 5,000 = 25,000 (סעיפים 71, 74)"], trap: "להוסיף את 5,000 להשקעה נטו. אצל סוחר הן הוצאה.", level: 2, source: "מקורית", ref: "סעיפים 71, 74" }),
  askNumber({ id: "dealer-cap", skill: "ריבית נמוכה", prompt: "סוחר מפרסם ריבית נמוכה במיוחד. הלקוח ישלם 30,000 ש״ח בסוף כל שנה, 4 שנים. שווי הנכס 110,000 ש״ח, עלותו 75,000 ש״ח, וריבית השוק 10%. מהן ההכנסות ממכירות?", answer: P_CAP, steps: [`בריבית השוק: 30,000 × (1 − 1.1^(−4)) ÷ 0.1 = ${fmt(P_CAP)}`, `נמוך מ-110,000, ולכן זו ההכנסה (סעיף 73). הרווח: ${fmt(P_CAP)} − 75,000 = ${fmt(P_CAP - 75_000)}`], trap: "להוון בריבית שפרסם. הרווח מוגבל למה שהיה בריבית שוק.", level: 3, source: "מקורית", ref: "סעיפים 71, 73" }),
  askNumber({ id: "res-cogs", skill: "שייר", prompt: `סוחר מחכיר רכב ל-5 שנים, בתשלום של 25,000 ש״ח בסוף כל שנה. שווי הרכב 100,000 ש״ח, ועלותו 85,000 ש״ח. בסוף התקופה הרכב חוזר, ושוויו הצפוי 10,000 ש״ח, מזה 3,000 ש״ח בערבות החוכר. הריבית הגלומה ${(P_RES_RATE * 100).toFixed(4)}%. מהי עלות המכר?`, answer: 85_000 - P_RES_PVU, steps: ["שייר לא מובטח: 10,000 − 3,000 = 7,000", `בערך נוכחי: 7,000 ÷ (1 + i)^5 = ${fmt(P_RES_PVU)}`, `85,000 − ${fmt(P_RES_PVU)} = ${fmt(85_000 - P_RES_PVU)} (סעיף 71(ב))`], trap: "להוריד מהעלות את כל השייר. הערבות היא תשלום חכירה, ולכן נשארת במכירות.", level: 3, source: "מקורית", ref: "סעיף 71(ב)" }),
  ask({ id: "res-both", skill: "שייר", prompt: "במחכיר סוחר, מה קורה לערך הנוכחי של השייר הלא מובטח?", options: ["יורד גם מהמכירות וגם מעלות המכר, ולכן הרווח לא משתנה", "יורד רק מהמכירות", "יורד רק מעלות המכר", "לא נכלל בשום מקום"], answer: 0, why: "החלק הזה לא נמכר. הוא נשאר בתוך ההשקעה נטו (סעיף 71).", trap: "לחשוב שהשייר מקטין את הרווח. הוא רק מקטין את שתי השורות.", level: 2, source: "מקורית", ref: "סעיף 71" }),
  askNumber({ id: "res-loss", skill: "שייר", prompt: "אומדן השייר הלא מובטח ירד ב-4,000 ש״ח, 3 שנים לפני סוף החכירה. הריבית הגלומה 7%. כמה הפסד מיידי נרשם?", answer: P_LOSS, steps: [`4,000 ÷ 1.07^3 = ${fmt(P_LOSS)} (סעיף 77)`], trap: "לרשום 4,000. הירידה עצמה קורית רק בעוד 3 שנים, ולכן מהוונים.", level: 3, source: "מקורית", ref: "סעיף 77" }),
  ask({ id: "res-up", skill: "שייר", prompt: "אומדן השייר הלא מובטח עלה. מה עושה המחכיר?", options: ["לא מעדכן: סעיף 77 מטפל רק בירידה", "מכיר ברווח מיידי", "מגדיל את ההשקעה נטו ואת ההכנסות ממכירות", "מסווג מחדש"], answer: 0, why: "סעיף 77 מדבר על ירידה באומדן.", trap: "להניח סימטריה לירידה.", level: 3, source: "מקורית", ref: "סעיף 77" }),
  ask({ id: "third-party", skill: "ערבות", prompt: "צד שלישי בעל יכולת פיננסית ערב למחכיר לערך השייר. האם הערבות נכללת בתשלומי החכירה של המחכיר?", options: ["כן", "לא, רק ערבות של החוכר", "רק אם החוכר משלם עליה", "רק במחכיר סוחר"], answer: 0, why: "סעיף 70(ג): ערבות מהחוכר, מצד קשור אליו, או מצד שלישי בעל יכולת, שאינו קשור למחכיר.", trap: "לבדוק רק אם החוכר ערב.", level: 3, source: "מקורית", ref: "סעיף 70(ג)" }),
  ask({ id: "index-ni", skill: "מדד", prompt: "חכירה מימונית, ותשלומים צמודים למדד. המדד עלה, והחוכר שילם יותר. מה עושה המחכיר?", options: ["לא מודד מחדש. התוספת היא הכנסה נפרדת", "מודד מחדש את ההשקעה נטו", "מוסיף את התוספת להכנסות ממכירות", "מקטין את עלות המכר"], answer: 0, why: "סעיף 70(ב) מודד לפי המדד של מועד התחילה, אין מקבילה לסעיף 42(ב), וסעיף 90(א)(iii) עוסק בהכנסה ממשתנים שלא נכללו.", trap: "להעתיק את הטיפול מהחוכר.", level: 2, source: "מקורית", ref: "סעיפים 70(ב), 90(א)" }),
  askNumber({ id: "index-income", skill: "מדד", prompt: "חכירה מימונית. התשלום הבסיסי 50,000 ש״ח, צמוד למדד. מדד הבסיס 100, והיום 104. כמה מהתקבול השנה הוא הכנסה נפרדת מהצמדה?", answer: 2_000, steps: ["50,000 × 104 ÷ 100 = 52,000", "52,000 − 50,000 = 2,000"], trap: "להוריד את כל 52,000 מההשקעה נטו. רק הסכום שנמדד בה מקטין אותה.", level: 2, source: "מקורית", ref: "סעיפים 70(ב), 90(א)" }),
  Object.assign(
    journal("op-entry", "פקודת יומן", "חכירה תפעולית. הכנסה בקו ישר 40,000 ש״ח, ובשנה הראשונה התקבלו 30,000 ש״ח. רשמו את הפקודה של 31.12.", [{ account: "מזומן", dr: 30_000 }, { account: "הכנסות לקבל", dr: 10_000 }, { account: "הכנסות מהשכרה", cr: 40_000 }], "ההכנסה בקו ישר, וההפרש הוא נכס. מלכודת נפוצה: לרשום הכנסה רק במה שהתקבל.", ["מזומן", "הכנסות לקבל", "הכנסות מהשכרה", "השקעה נטו בחכירה", "הכנסות מימון"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 81" } },
  ),
  Object.assign(
    journal("ni-entry", "פקודת יומן", "מחכיר שאינו סוחר מחכיר בחכירה מימונית ציוד. ערכו בספרים 70,000 ש״ח, ושוויו ההוגן 90,000 ש״ח. עלויות ישירות 2,000 ש״ח במזומן. רשמו את הפקודה במועד התחילה.", [{ account: "השקעה נטו בחכירה", dr: 92_000 }, { account: "ציוד", cr: 70_000 }, { account: "מזומן", cr: 2_000 }, { account: "רווח הון", cr: 20_000 }], "השקעה נטו: 90,000 + 2,000. הרווח: 90,000 − 70,000. מלכודת נפוצה: לרשום את העלויות כהוצאה. זה רק אצל סוחר.", ["השקעה נטו בחכירה", "ציוד", "מזומן", "רווח הון", "מכירות", "עלות המכר"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיפים 67, 69" } },
  ),
];

const traps: Trap[] = [
  {
    id: "who-classifies",
    prompt: "מי מסווג חכירה לתפעולית או מימונית?",
    options: ["רק המחכיר", "רק החוכר", "שניהם", "מי שמחזיק בנכס בספרים"],
    answer: 0,
    why: "סעיף 61. החוכר עובד במודל אחד, בלי סיווג.",
    traps: ["", "החוכר עובד במודל אחד, בלי סיווג.", "החוכר לא מסווג לפי התקן.", "הסיווג הוא שקובע אם הנכס בספרים, ולא להפך."],
  },
  {
    id: "costs",
    prompt: "עלויות ישירות להשגת חכירה מימונית. מה נכון?",
    options: ["אצל מי שאינו סוחר בהשקעה נטו, אצל סוחר הוצאה", "תמיד בהשקעה נטו", "תמיד הוצאה", "אצל סוחר בהשקעה נטו, אצל מי שאינו סוחר הוצאה"],
    answer: 0,
    why: "סעיפים 69, 74.",
    traps: ["", "אצל סוחר הן קשורות להפקת הרווח מהמכירה, ולכן הוצאה.", "מי שאינו סוחר פורס אותן דרך הריבית.", "הפוך."],
  },
  {
    id: "guarantee-sides",
    prompt: "החוכר ערב לשייר של 5,000 ש״ח, וצופה שלא ישלם כלום. מה נכנס לכל צד?",
    options: ["חוכר: כלום. מחכיר: כל 5,000 ש״ח", "שניהם: 5,000 ש״ח", "שניהם: כלום", "חוכר: 5,000 ש״ח. מחכיר: כלום"],
    answer: 0,
    why: "סעיפים 27(ג), 70(ג).",
    traps: ["", "החוכר מכניס רק את מה שהוא צופה לשלם.", "מבחינת המחכיר הערבות היא תשלום חכירה.", "הפוך."],
  },
  {
    id: "op-asset",
    prompt: "איפה מוצג נכס בחכירה תפעולית בספרי המחכיר?",
    options: ["לפי מהותו, למשל רכוש קבוע", "בהשקעה נטו בחכירה", "נכס זכות שימוש", "לא מוצג"],
    answer: 0,
    why: "סעיף 88.",
    traps: ["", "השקעה נטו היא של מימונית.", "נכס זכות שימוש הוא של החוכר.", "הנכס נשאר אצלו."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const LESSOR_TAUGHT: Record<string, string> = {
  "class-own": "ls-lsr-class",
  "class-short": "ls-lsr-class",
  "class-rule": "ls-lsr-class",
  "class-when": "ls-lsr-when",
  "class-fv": "ls-lsr-class",
  "op-income": "ls-lsr-op",
  "op-accrued": "ls-lsr-op",
  "op-dep": "ls-lsr-op",
  "op-dealer": "ls-lsr-op",
  "ni-start": "ls-lsr-nondealer",
  "ni-gain": "ls-lsr-nondealer",
  "ni-y2": "ls-lsr-nondealer",
  "dealer-sales": "ls-lsr-dealer",
  "dealer-profit": "ls-lsr-dealer",
  "dealer-cap": "ls-lsr-low",
  "res-cogs": "ls-lsr-resid",
  "res-both": "ls-lsr-resid",
  "res-loss": "ls-lsr-resid",
  "res-up": "ls-lsr-resid",
  "third-party": "ls-lsr-resid",
  "index-ni": "ls-lsr-index",
  "index-income": "ls-lsr-index",
  "op-entry": "ls-lsr-op",
  "ni-entry": "ls-lsr-nondealer",
  "who-classifies": "ls-lsr-hook",
  costs: "ls-lsr-dealer",
  "guarantee-sides": "ls-lsr-resid",
  "op-asset": "ls-lsr-op",
};

/** Lesson 6: the lessor. Classification, then each of the two models. Changes come in lesson 7. */
export const LESSOR: StudyModule = {
  slug: "ifrs16-lessor",
  course: COURSE,
  n: 6,
  title: "מחכיר: סיווג ושני המודלים",
  description: "באותו חוזה, בצד השני. מתי החכירה מימונית ומתי תפעולית, ומה נרשם בכל אחת: הכנסה בקו ישר, השקעה נטו, מכירה של סוחר, ושייר שלא מובטח.",
  goal: "לסווג חכירה אצל המחכיר, ולרשום אותה עד הדוחות הכספיים בכל אחד מהמודלים.",
  outcomes: [
    "לסווג חכירה לפי הסימנים בתקן",
    "לרשום חכירה תפעולית: הכנסה בקו ישר, הכנסות לקבל ופחת",
    "למדוד השקעה נטו ולחשב הכנסת מימון",
    "לרשום מכירה של יצרן או סוחר, גם בריבית נמוכה מלאכותית",
    "לטפל בשייר לא מובטח ובירידה באומדן שלו",
    "לטפל בתשלום צמוד מדד ובתשלום לפי מכירות אצל המחכיר",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-lsr-hook", title: "הצד השני של החוזה" },
    { id: "ls-lsr-class", title: "מימונית או תפעולית" },
    { id: "ls-lsr-when", title: "מתי מסווגים" },
    { id: "ls-lsr-op", title: "תפעולית: הנכס נשאר" },
    { id: "ls-lsr-nondealer", title: "מימונית: במקום נכס, השקעה נטו" },
    { id: "ls-lsr-dealer", title: "יצרן או סוחר: מכירה ואז ריבית" },
    { id: "ls-lsr-low", title: "ריבית נמוכה מלאכותית" },
    { id: "ls-lsr-resid", title: "שייר שלא מובטח" },
    { id: "ls-lsr-index", title: "מדד ומכירות אצל המחכיר" },
    { id: "ls-lsr-credit", title: "הפסדי אשראי" },
    { id: "ls-lsr-map", title: "מפה: מה נרשם בכל מודל" },
    { id: "ls-lsr-drill", title: "מתרגלים: מספרים חדשים בכל פעם" },
    { id: "ls-lsr-mistake", title: "מצאו את הטעות" },
    { id: "ls-lsr-master", title: "שאלה מסכמת: שני הצדדים של אותה חנות" },
  ],
  exercises,
  traps,
  tips: [
    "רק המחכיר מסווג. החוכר עובד במודל אחד.",
    "הסיווג לפי מהות, במועד ההתקשרות, ומשתנה רק בתיקון.",
    "75% ו-90% הם כללי אצבע, ולא לשון התקן.",
    "תפעולית: הנכס נשאר, הכנסה בקו ישר, והפרש בהכנסות לקבל.",
    "עלויות ישירות בתפעולית: על הנכס, ונפרסות על החכירה.",
    "מימונית שאינו סוחר: השקעה נטו = שווי הוגן + עלויות ישירות.",
    "סוחר: מכירות לפי הנמוך מבין שווי הוגן וערך נוכחי בריבית שוק. העלויות הוצאה.",
    "שייר לא מובטח: יורד גם ממכירות וגם מעלות המכר.",
    "מדד אצל המחכיר: בלי מדידה מחדש. התוספת היא הכנסה נפרדת.",
  ],
};
