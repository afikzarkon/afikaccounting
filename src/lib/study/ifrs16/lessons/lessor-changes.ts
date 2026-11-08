import { pvEnd } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import type { TestEnd, TestNode } from "./what";

const r = Math.round;

/** The chart of a lessor's modifications: paragraphs 79, 80 and 87. */
export const MOD_WALK: Record<string, TestNode | TestEnd> = {
  orig: { q: "איך החכירה סווגה במקור?", par: "סעיפים 79, 87", help: "הסיווג המקורי קובע באיזה מסלול הולכים.", answers: [{ label: "תפעולית", to: "opNew" }, { label: "מימונית", to: "scope" }] },
  scope: { q: "התיקון מוסיף זכות להשתמש בנכס בסיס נוסף?", par: "סעיף 79(א)", help: "מכונה נוספת, קומה נוספת. הארכה, קיצור או שינוי בתשלום לא מוסיפים נכס.", answers: [{ label: "כן", to: "price" }, { label: "לא", to: "would" }] },
  price: { q: "התמורה גדלה בהתאם למחיר הנפרד של התוספת?", par: "סעיף 79(ב)", help: "מחיר נפרד, עם התאמות שמשקפות את נסיבות החוזה.", answers: [{ label: "כן", to: "separate" }, { label: "לא", to: "would" }] },
  would: { q: "אילו התיקון היה בתוקף במועד ההתקשרות, החכירה הייתה תפעולית?", par: "סעיף 80", help: "בודקים את הסימנים מהשיעור הקודם, עם התנאים החדשים והנתונים של יום ההתקשרות.", answers: [{ label: "כן", to: "finToOp" }, { label: "לא", to: "ifrs9" }] },
  opNew: { lease: true, verdict: "חכירה חדשה", why: "מהיום של התיקון, כולל יתרות של תשלומים מראש או נצברים מהחכירה המקורית (סעיף 87)." },
  separate: { lease: true, verdict: "חכירה נפרדת", why: "התוספת מסווגת לבדה, והחכירה המקורית ממשיכה בלי שינוי (סעיף 79)." },
  finToOp: { lease: true, verdict: "חכירה חדשה", why: "ההשקעה נטו של ערב התיקון הופכת לערך בספרים של הנכס (סעיף 80(א))." },
  ifrs9: { lease: true, verdict: "IFRS 9", why: "מחשבים מחדש את ההשקעה נטו בריבית המקורית, וההפרש ברווח או הפסד (סעיף 80(ב))." },
};
export const MOD_WALK_START = "orig";

/** Cases to sort into the chart's roads. */
export const MOD_ITEMS: { text: string; answer: "new" | "sep" | "nine"; why: string }[] = [
  { text: "חכירה תפעולית של משרד. הצדדים האריכו אותה בשלוש שנים.", answer: "new", why: "במקור תפעולית: תמיד חכירה חדשה (סעיף 87)." },
  { text: "חכירה תפעולית. החוכר לוקח גם קומה נוספת, במחיר השוק שלה.", answer: "new", why: "סעיף 79 עוסק רק במימונית. בתפעולית כל תיקון הוא חכירה חדשה (סעיף 87)." },
  { text: "חכירה מימונית. הוסיפו מכונה שנייה, במחיר השוק שלה.", answer: "sep", why: "נכס נוסף, במחיר הנפרד שלו (סעיף 79)." },
  { text: "חכירה מימונית ל-9 שנים מתוך 10 שנות חיים. קיצרו אותה ל-3 שנים, ובתנאים האלה אין אף סימן למימונית.", answer: "new", why: "אילו התיקון היה בתוקף מההתחלה, החכירה הייתה תפעולית (סעיף 80(א))." },
  { text: "חכירה מימונית. הורידו את התשלום השנתי, והתקופה עדיין החלק העיקרי של החיים הכלכליים.", answer: "nine", why: "לא נוסף נכס, והחכירה הייתה נשארת מימונית (סעיף 80(ב))." },
  { text: "חכירה מימונית. הוסיפו מכונה שנייה בהנחה גדולה ממחיר השוק, בלי הצדקה בנסיבות החוזה. גם עם התיקון החכירה הייתה מימונית.", answer: "nine", why: "נוסף נכס, אבל לא במחיר הנפרד שלו, ולכן זו לא חכירה נפרדת (סעיפים 79(ב), 80(ב))." },
];
export const MOD_OPTIONS: [string, string][] = [
  ["new", "חכירה חדשה"],
  ["sep", "חכירה נפרדת"],
  ["nine", "IFRS 9"],
];

/** Operating, paid ahead: the balance joins the new lease's payments. */
export const PRE = { total: 600_000, years: 6, paid: [240_000, 150_000], left: 5, newPay: 90_000 };
export const PRE_YEAR = PRE.total / PRE.years;
export const PRE_EARNED = PRE_YEAR * 2;
export const PRE_GOT = PRE.paid[0] + PRE.paid[1];
export const PRE_BAL = PRE_GOT - PRE_EARNED;
export const PRE_FUTURE = PRE.left * PRE.newPay;
export const PRE_TOTAL = PRE_FUTURE + PRE_BAL;
export const PRE_INCOME = PRE_TOTAL / PRE.left;
export const PRE_FALL = PRE_INCOME - PRE.newPay;
export const PRE_ROWS = Array.from({ length: PRE.left }, (_, k) => ({ year: k + 3, cash: PRE.newPay, income: PRE_INCOME, closing: PRE_BAL - PRE_FALL * (k + 1) }));

/** Operating, with income accrued: the balance comes off the new lease's payments. */
export const ACC = { rents: [110_000, 150_000, 190_000, 230_000], cost: 600_000, life: 10, fairValue: 1_000_000, rate: 0.07, newRents: [230_000, 200_000] };
export const ACC_YEAR = ACC.rents.reduce((a, b) => a + b, 0) / ACC.rents.length;
export const ACC_EARNED = ACC_YEAR * 3;
export const ACC_GOT = ACC.rents[0] + ACC.rents[1] + ACC.rents[2];
export const ACC_BAL = ACC_EARNED - ACC_GOT;
export const ACC_DEP = ACC.cost / ACC.life;
export const ACC_NET = ACC.cost - ACC_DEP * 3;
export const ACC_FUTURE = ACC.newRents[0] + ACC.newRents[1];
export const ACC_TOTAL = ACC_FUTURE - ACC_BAL;
export const ACC_INCOME = ACC_TOTAL / 2;
export const ACC_ROWS = [
  { year: 4, cash: ACC.newRents[0], income: ACC_INCOME, closing: ACC_BAL - (ACC.newRents[0] - ACC_INCOME) },
  { year: 5, cash: ACC.newRents[1], income: ACC_INCOME, closing: ACC_BAL - (ACC.newRents[0] - ACC_INCOME) - (ACC.newRents[1] - ACC_INCOME) },
];
/** The accrued lease rewritten: the new lease is a finance one. */
export const TO_FIN = { payment: 250_000, years: 3, rate: 0.075 };
export const TO_FIN_NI = r(pvEnd(TO_FIN.rate, TO_FIN.years, TO_FIN.payment));
export const TO_FIN_GAIN = TO_FIN_NI - ACC_NET - ACC_BAL;

/** Finance: a machine, on the day of the modification, 1.1 of year 4. */
export const MACH = { payment: 190_000, years: 11, life: 12, rate: 0.07, residual: 150_000, done: 3, left: 8 };
export const MACH_FV = r(pvEnd(MACH.rate, MACH.years, MACH.payment, MACH.residual));
export const MACH_NI = r(pvEnd(MACH.rate, MACH.left, MACH.payment, MACH.residual));
/** A second machine at its stand-alone price: a separate lease. */
export const ADD = { payment: 60_000, years: 5, fairValue: 300_000, bookValue: 210_000, life: 15, low: 40_000 };
export const ADD_DEP = ADD.bookValue / ADD.life;
export const MACH_INT = r(MACH_NI * MACH.rate);
export const MACH_CLOSE = MACH_NI + MACH_INT - MACH.payment;
/** Cut to four years in all: it would have been an operating lease. */
export const CUT = { term: 4, lifeLeft: 9 };
export const CUT_PV = r(pvEnd(MACH.rate, CUT.term, MACH.payment));
export const CUT_TERM_SHARE = CUT.term / MACH.life;
export const CUT_PV_SHARE = CUT_PV / MACH_FV;
export const CUT_DEP = r(MACH_NI / CUT.lifeLeft);
export const CUT_ASSET = MACH_NI - CUT_DEP;
/** A lower payment: it stays a finance lease. */
export const LOW = { payment: 110_000, marketRate: 0.09 };
export const LOW_NI = r(pvEnd(MACH.rate, MACH.left, LOW.payment, MACH.residual));
export const LOW_LOSS = MACH_NI - LOW_NI;
export const LOW_WRONG = r(pvEnd(LOW.marketRate, MACH.left, LOW.payment, MACH.residual));
export const LOW_INT = r(LOW_NI * MACH.rate);
export const LOW_CLOSE = LOW_NI + LOW_INT - LOW.payment;
export const LOW_NC = r(pvEnd(MACH.rate, MACH.left - 2, LOW.payment, MACH.residual));
/** The same cut, substantial: the old asset goes, and a new one comes in at fair value. */
export const SUB_NI = LOW_WRONG;
export const SUB_LOSS = MACH_NI - SUB_NI;
export const SUB_INT = r(SUB_NI * LOW.marketRate);
export const SUB_CLOSE = SUB_NI + SUB_INT - LOW.payment;

/** Payments forgiven. */
export const WAIVE = { overdue: 25_000, payment: 72_000, left: 3 };
export const WAIVE_TOTAL = WAIVE.payment * (WAIVE.left - 1);
export const WAIVE_INCOME = WAIVE_TOTAL / WAIVE.left;
export const WAIVE_ROWS = [
  { year: 1, cash: 0, income: WAIVE_INCOME, closing: WAIVE_INCOME },
  { year: 2, cash: WAIVE.payment, income: WAIVE_INCOME, closing: WAIVE_INCOME * 2 - WAIVE.payment },
  { year: 3, cash: WAIVE.payment, income: WAIVE_INCOME, closing: WAIVE_INCOME * 3 - WAIVE.payment * 2 },
];

/** The closing question: a crane on the day of the modification, 1.1 of year 5, under four separate assumptions. */
export const CRANE = { payment: 230_000, years: 12, life: 15, rate: 0.06, residual: 200_000, left: 8 };
export const CRANE_FV = r(pvEnd(CRANE.rate, CRANE.years, CRANE.payment, CRANE.residual));
export const CRANE_NI = r(pvEnd(CRANE.rate, CRANE.left, CRANE.payment, CRANE.residual));
export const CA = { term: 6, lifeLeft: 11 };
export const CA_PV = r(pvEnd(CRANE.rate, CA.term, CRANE.payment));
export const CA_DEP = r(CRANE_NI / CA.lifeLeft);
export const CA_ASSET = CRANE_NI - CA_DEP;
export const CB = { payment: 170_000, marketRate: 0.08 };
export const CB_NI = r(pvEnd(CRANE.rate, CRANE.left, CB.payment, CRANE.residual));
export const CB_LOSS = CRANE_NI - CB_NI;
export const CB_INT = r(CB_NI * CRANE.rate);
export const CB_CLOSE = CB_NI + CB_INT - CB.payment;
export const CB_NC = r(pvEnd(CRANE.rate, CRANE.left - 2, CB.payment, CRANE.residual));
export const CC = { payment: 40_000, years: 5, fairValue: 400_000, bookValue: 308_000, life: 14 };
export const CC_DEP = CC.bookValue / CC.life;
export const CC_INT = r(CRANE_NI * CRANE.rate);
export const CC_CLOSE = CRANE_NI + CC_INT - CRANE.payment;
export const CC_NC = r(pvEnd(CRANE.rate, CRANE.left - 2, CRANE.payment, CRANE.residual));
export const CD_LOSS = r(CRANE.payment / (1 + CRANE.rate));
export const CD_NI = CRANE_NI - CD_LOSS;
export const CD_INT = r(CD_NI * CRANE.rate);
export const CD_CLOSE = CD_NI + CD_INT;
export const CD_NC = r(pvEnd(CRANE.rate, CRANE.left - 2, CRANE.payment, CRANE.residual));

const P_BAL = r(pvEnd(0.08, 5, 60_000, 10_000));
const P_OLD = r(pvEnd(0.07, 6, 90_000, 30_000));
const P_NEW = r(pvEnd(0.07, 6, 70_000, 30_000));
const P_G_OLD = r(pvEnd(0.06, 4, 50_000, 8_000));
const P_G_NEW = r(pvEnd(0.06, 4, 58_000, 8_000));
const P_NI = r(pvEnd(0.06, 3, 100_000));
const P_SUB_FV = r(pvEnd(0.1, 4, 60_000, 10_000));

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  ask({ id: "mod-first", skill: "מסלול", prompt: "מחכיר וחוכר הסכימו על שינוי בחוזה חכירה. מה השאלה הראשונה שהמחכיר שואל?", options: ["איך החכירה סווגה במקור", "מה הריבית היום", "מהו השווי ההוגן היום", "כמה שנים נשארו"], answer: 0, why: "תפעולית היא תמיד חכירה חדשה (סעיף 87). במימונית ממשיכים לסעיפים 79, 80.", trap: "להתחיל מהריבית, כמו בחישוב של החוכר. קודם בוחרים מסלול.", level: 1, source: "בהשראת הרצאה", ref: "סעיפים 79, 80, 87" }),
  ask({ id: "not-mod", skill: "מסלול", prompt: "לפי החוזה המקורי, החוכר משלם 3% מהמכירות שלו. המכירות עלו, והתשלום גדל. האם זה תיקון חכירה?", options: ["לא. השינוי היה חלק מהתנאים המקוריים", "כן, כי התמורה גדלה", "כן, אם החכירה מימונית", "רק אם השינוי גדול מ-10%"], answer: 0, why: "תיקון הוא שינוי בהיקף או בתמורה שלא היה חלק מהתנאים המקוריים (נספח א׳).", trap: "לקרוא לכל שינוי בסכום תיקון. בודקים אם החוזה עצמו השתנה.", level: 2, source: "מקורית", ref: "נספח א׳" }),
  ask({ id: "op-new", skill: "תפעולית", prompt: "חכירה תפעולית של מחסן. הצדדים האריכו אותה בשנתיים, ושינו את התשלום. איך המחכיר מטפל בתיקון?", options: ["חכירה חדשה ממועד התיקון, בהתחשב ביתרות של תשלומים מראש או נצברים", "מתקן למפרע את ההכנסות של השנים הקודמות", "רושם את ההפרש מיד ברווח או הפסד", "ממשיך בתנאים הישנים עד סוף התקופה המקורית"], answer: 0, why: "סעיף 87. הטיפול הוא מכאן והלאה, ולא למפרע.", trap: "לתקן את העבר. ההכנסות שהוכרו נשארות.", level: 1, source: "בהשראת הרצאה", ref: "סעיף 87" }),
  askNumber({ id: "op-prepaid", skill: "תפעולית", prompt: "חכירה תפעולית ל-6 שנים, תמורת 360,000 ש״ח לכל התקופה. החוכר שילם 150,000 ש״ח בשנה 1 ו-110,000 ש״ח בשנה 2. מהי יתרת ההכנסות מראש ב-31.12 של שנה 2?", answer: 140_000, steps: ["הכנסה בקו ישר: 360,000 ÷ 6 = 60,000 לשנה", "הוכרו בשנתיים: 60,000 × 2 = 120,000", "התקבלו: 150,000 + 110,000 = 260,000", "260,000 − 120,000 = 140,000"], trap: "לחשב לפי התשלום של השנה האחרונה בלבד. היתרה מצטברת מתחילת החכירה.", level: 1, source: "בהשראת הרצאה", ref: "סעיפים 81, 87" }),
  askNumber({ id: "op-income-prepaid", skill: "תפעולית", prompt: "חכירה תפעולית תוקנה ב-1.1. נשארו 4 שנים, בתשלום של 75,000 ש״ח בסוף כל שנה. יתרת ההכנסות מראש ביום התיקון 48,000 ש״ח. מהי ההכנסה השנתית מכאן והלאה?", answer: 87_000, steps: ["התשלומים העתידיים: 75,000 × 4 = 300,000", "הכסף שכבר התקבל ועוד לא הוכר נוסף: 300,000 + 48,000 = 348,000", "348,000 ÷ 4 = 87,000 (סעיף 87)"], trap: "להתעלם מהיתרה. כך היא נשארת במאזן לנצח, בלי שאי פעם תהפוך להכנסה.", level: 2, source: "בהשראת הרצאה", ref: "סעיף 87" }),
  askNumber({ id: "op-income-accrued", skill: "תפעולית", prompt: "חכירה תפעולית תוקנה ב-1.1. נשארו 3 שנים, בתשלומים של 90,000, 100,000 ו-110,000 ש״ח בסוף כל שנה. יתרת ההכנסות לקבל ביום התיקון 30,000 ש״ח. מהי ההכנסה השנתית מכאן והלאה?", answer: 90_000, steps: ["התשלומים העתידיים: 90,000 + 100,000 + 110,000 = 300,000", "30,000 מהם כבר הוכרו כהכנסה, ולכן יורדים: 300,000 − 30,000 = 270,000", "270,000 ÷ 3 = 90,000 (סעיף 87)"], trap: "להוסיף את ההכנסות לקבל. הן הוכרו בעבר, ולכן הכסף שיקבל כנגדן אינו הכנסה חדשה.", level: 2, source: "בהשראת הרצאה", ref: "סעיף 87" }),
  askNumber({ id: "op-accrued-after", skill: "תפעולית", prompt: "חכירה תפעולית תוקנה ב-1.1. נשארו 3 שנים, בתשלום של 100,000 ש״ח בסוף כל שנה. יתרת ההכנסות לקבל ביום התיקון 30,000 ש״ח. מהי יתרת ההכנסות לקבל ב-31.12 של השנה הראשונה אחרי התיקון?", answer: 20_000, steps: ["ההכנסה השנתית: (300,000 − 30,000) ÷ 3 = 90,000", "התקבלו 100,000, כלומר 10,000 יותר מההכנסה", "30,000 − 10,000 = 20,000"], trap: "לחשוב שהיתרה נמחקת ביום התיקון. היא נשארת, ויורדת בהדרגה.", level: 3, source: "בהשראת הרצאה", ref: "סעיף 87" }),
  askNumber({ id: "op-to-fin", skill: "תפעולית", prompt: "חכירה תפעולית תוקנה ב-1.1: 3 שנים נוספות, 100,000 ש״ח בסוף כל שנה, ובסוף הנכס עובר לחוכר, ולכן החכירה החדשה מימונית. הריבית הגלומה ביום התיקון 6%. ערך הנכס בספרים 170,000 ש״ח, ויתרת ההכנסות לקבל 20,000 ש״ח. המחכיר אינו סוחר. כמה רווח נרשם ביום התיקון?", answer: P_NI - 190_000, steps: [`השקעה נטו: 100,000 × (1 − 1.06^(−3)) ÷ 0.06 = ${fmt(P_NI)}`, "יוצאים: הנכס 170,000, והכנסות לקבל 20,000", `${fmt(P_NI)} − 170,000 − 20,000 = ${fmt(P_NI - 190_000)}`], trap: "לשכוח את ההכנסות לקבל. בלעדיהן הפקודה לא מאוזנת, והרווח מנופח.", level: 3, source: "בהשראת הרצאה", ref: "סעיפים 67, 87" }),
  Object.assign(
    journal("op-entry", "פקודת יומן", "חכירה תפעולית שתוקנה. התשלום השנתי מהתיקון והלאה 70,000 ש״ח, וההכנסה השנתית 82,000 ש״ח, כי ביום התיקון הייתה יתרת הכנסות מראש. רשמו את הפקודה של 31.12.", [{ account: "מזומן", dr: 70_000 }, { account: "הכנסות מראש", dr: 12_000 }, { account: "הכנסות מהשכרה", cr: 82_000 }], "ההכנסה גדולה מהתקבול, וההפרש מקטין את ההכנסות מראש. מלכודת נפוצה: לרשום הכנסה רק בגובה התקבול.", ["מזומן", "הכנסות מראש", "הכנסות לקבל", "הכנסות מהשכרה", "השקעה נטו בחכירה"]),
    { meta: { level: 2 as const, source: "בהשראת הרצאה" as const, ref: "סעיף 87" } },
  ),
  ask({ id: "sep-both", skill: "חכירה נפרדת", prompt: "מתי תיקון לחכירה מימונית מטופל כחכירה נפרדת?", options: ["כשהוא מוסיף זכות להשתמש בנכס בסיס, והתמורה גדלה בהתאם למחיר הנפרד", "בכל תיקון שמגדיל את התמורה", "בכל תיקון שמוסיף נכס, בכל מחיר", "כשהוא מאריך את התקופה"], answer: 0, why: "סעיף 79: שני התנאים יחד.", trap: "להסתפק בתנאי אחד. בלי מחיר נפרד, זה לא עסקה עצמאית.", level: 1, source: "בהשראת הרצאה", ref: "סעיף 79" }),
  ask({ id: "sep-price", skill: "חכירה נפרדת", prompt: "חכירה מימונית. הצדדים הוסיפו מכונה שנייה, במחיר נמוך ב-30% ממחיר השוק שלה, בלי נסיבות שמצדיקות זאת. מה הצעד הבא?", options: ["לבדוק איך החכירה הייתה מסווגת אילו התיקון היה בתוקף בהתקשרות", "לטפל בה כחכירה נפרדת", "לרשום הפסד של 30%", "לסווג את שתי המכונות כתפעוליות"], answer: 0, why: "סעיף 79(ב) לא מתקיים, ולכן עוברים לסעיף 80.", trap: "לעצור בכך שנוסף נכס. המחיר הוא התנאי השני.", level: 2, source: "בהשראת הרצאה", ref: "סעיפים 79, 80" }),
  askNumber({ id: "sep-income", skill: "חכירה נפרדת", prompt: "חכירה מימונית: השקעה נטו של 500,000 ש״ח ב-1.1, בריבית גלומה של 6%. ב-1.1 נוספה מכונה שנייה במחיר הנפרד שלה, בחכירה תפעולית, תמורת 45,000 ש״ח לשנה. מהו סך ההכנסות מחכירה של השנה?", answer: 75_000, steps: ["החכירה המקורית ממשיכה: 500,000 × 6% = 30,000 הכנסות מימון", "החכירה הנפרדת: 45,000 הכנסה בקו ישר", "30,000 + 45,000 = 75,000"], trap: "למדוד מחדש את ההשקעה נטו. חכירה נפרדת לא נוגעת בחכירה המקורית.", level: 3, source: "מקורית", ref: "סעיפים 75, 79, 81" }),
  ask({ id: "would-when", skill: "הייתה תפעולית", prompt: "חכירה מימונית תוקנה, ובודקים איך הייתה מסווגת אילו התיקון היה בתוקף במועד ההתקשרות. מאיזה יום לוקחים את השווי ההוגן ואת החיים הכלכליים?", options: ["מיום ההתקשרות, עם התנאים החדשים", "מיום התיקון", "הממוצע של שני הימים", "השווי מיום התיקון, והחיים מיום ההתקשרות"], answer: 0, why: "סעיף 80(א) מציב את התיקון ביום ההתקשרות, ושם בודקים.", trap: "לקחת שווי הוגן של היום. השאלה היא מה היה קורה אז.", level: 2, source: "בהשראת הרצאה", ref: "סעיף 80(א)" }),
  ask({ id: "would-case", skill: "הייתה תפעולית", prompt: "מחכיר החכיר ציוד בחכירה מימונית ל-10 שנים מתוך 11 שנות חיים. בתיקון קיצרו את התקופה ל-3 שנים בסך הכול. הערך הנוכחי של 3 התשלומים, בריבית המקורית, 40% מהשווי ההוגן ביום ההתקשרות. השייר לא מובטח, ואין סימנים נוספים. מה עושים?", options: ["חכירה חדשה: הציוד חוזר לספרים לפי יתרת ההשקעה נטו", "מחשבים מחדש את ההשקעה נטו בריבית המקורית", "חכירה נפרדת ל-3 שנים", "הציוד חוזר לספרים בעלותו המקורית"], answer: 0, why: "3 מתוך 11 שנים ו-40% מהשווי: הייתה תפעולית. סעיף 80(א).", trap: "להחזיר את הציוד לפי העלות המקורית או השווי ההוגן. הסכום הוא ההשקעה נטו מיד לפני התיקון.", level: 3, source: "בהשראת הרצאה", ref: "סעיף 80(א)" }),
  Object.assign(
    journal("fin-entry", "פקודת יומן", "חכירה מימונית של ציוד תוקנה ב-1.1, ואילו התיקון היה בתוקף מההתחלה, החכירה הייתה תפעולית. יתרת ההשקעה נטו מיד לפני התיקון 640,000 ש״ח. רשמו את הפקודה ביום התיקון.", [{ account: "ציוד", dr: 640_000 }, { account: "השקעה נטו בחכירה", cr: 640_000 }], "הערך בספרים של הנכס הוא ההשקעה נטו (סעיף 80(א)(ii)), ולכן אין רווח או הפסד. מלכודת נפוצה: למדוד את הציוד לפי שווי הוגן ולרשום הפרש.", ["ציוד", "השקעה נטו בחכירה", "רווח הון", "הפסד מתיקון חכירה", "מזומן"]),
    { meta: { level: 2 as const, source: "בהשראת הרצאה" as const, ref: "סעיף 80(א)" } },
  ),
  askNumber({ id: "fin-dep", skill: "הייתה תפעולית", prompt: "חכירה מימונית תוקנה, ואילו התיקון היה בתוקף מההתחלה, החכירה הייתה תפעולית. יתרת ההשקעה נטו מיד לפני התיקון 540,000 ש״ח. נשארו לנכס 9 שנות חיים, והפחת בקו ישר בלי ערך שייר. מהו הפחת השנתי מכאן והלאה?", answer: 60_000, steps: ["הנכס חוזר לספרים ב-540,000 (סעיף 80(א)(ii))", "540,000 ÷ 9 = 60,000"], trap: "להפחית על פני יתרת החכירה. הנכס נשאר של המחכיר, ולכן על פני החיים שנשארו לו.", level: 2, source: "בהשראת הרצאה", ref: "סעיפים 80(א), 84" }),
  askNumber({ id: "ifrs9-bal", skill: "IFRS 9", prompt: "חכירה מימונית. הריבית הגלומה המקורית 8%, וריבית השוק היום 10%. בתיקון נקבע: 60,000 ש״ח בסוף כל שנה, עוד 5 שנים. השייר הלא מובטח 10,000 ש״ח, החכירה נשארת מימונית, והתיקון לא מביא לגריעה. מהי ההשקעה נטו אחרי התיקון?", answer: P_BAL, steps: [`=PV(8%;5;-60000;-10000) → ${fmt(P_BAL)}`, "ריבית מקורית, וכולל השייר (סעיף 80(ב))"], trap: "להוון בריבית השוק, או לשכוח את השייר. הוא חלק מההשקעה נטו גם אם אינו מובטח.", level: 2, source: "בהשראת הרצאה", ref: "סעיף 80(ב)" }),
  askNumber({ id: "ifrs9-loss", skill: "IFRS 9", prompt: "חכירה מימונית. נשארו 6 שנים, 90,000 ש״ח בסוף כל שנה, בריבית גלומה של 7%, ושייר לא מובטח של 30,000 ש״ח. בתיקון התשלום ירד ל-70,000 ש״ח, החכירה נשארת מימונית, והתיקון לא מביא לגריעה. ריבית השוק היום 9%. כמה הפסד נרשם?", answer: P_OLD - P_NEW, steps: [`לפני: =PV(7%;6;-90000;-30000) → ${fmt(P_OLD)}`, `אחרי: =PV(7%;6;-70000;-30000) → ${fmt(P_NEW)}`, `${fmt(P_OLD)} − ${fmt(P_NEW)} = ${fmt(P_OLD - P_NEW)}`], trap: "להשתמש ב-9%. ריבית השוק היא נתון מיותר כאן.", level: 3, source: "בהשראת הרצאה", ref: "סעיף 80(ב)" }),
  ask({ id: "ifrs9-rate", skill: "IFRS 9", prompt: "מחכיר בחכירה מימונית מחשב מחדש את ההשקעה נטו לפי סעיף 80(ב), בלי גריעה. למה דווקא בריבית המקורית?", options: ["כך IFRS 9 מודד נכס פיננסי שתנאיו שונו: בריבית האפקטיבית המקורית", "כי הריבית של היום לא ידועה לעולם", "כי החוכר משתמש בריבית המקורית", "כי השייר לא מובטח"], answer: 0, why: "ההפרש בין היתרה הישנה לחדשה נובע רק מהתזרים ששונה.", trap: "להעתיק מהחוכר, שעובר לריבית מעודכנת.", level: 2, source: "בהשראת הרצאה", ref: "סעיף 80(ב)" }),
  askNumber({ id: "ifrs9-gain", skill: "IFRS 9", prompt: "חכירה מימונית. נשארו 4 שנים, 50,000 ש״ח בסוף כל שנה, בריבית גלומה של 6%, ושייר לא מובטח של 8,000 ש״ח. בתיקון התשלום עלה ל-58,000 ש״ח, החכירה נשארת מימונית, והתיקון לא מביא לגריעה. כמה רווח נרשם?", answer: P_G_NEW - P_G_OLD, steps: [`לפני: =PV(6%;4;-50000;-8000) → ${fmt(P_G_OLD)}`, `אחרי: =PV(6%;4;-58000;-8000) → ${fmt(P_G_NEW)}`, `${fmt(P_G_NEW)} − ${fmt(P_G_OLD)} = ${fmt(P_G_NEW - P_G_OLD)}`], trap: "לחשוב שהעלאה נפרסת על פני התקופה. ההפרש נרשם ביום התיקון, והריבית נשארת.", level: 3, source: "מקורית", ref: "סעיף 80(ב)" }),
  ask({ id: "ifrs9-sub-what", skill: "IFRS 9", prompt: "תיקון של חכירה מימונית מביא לגריעה של ההשקעה נטו, כי זה שינוי מהותי. איך נמדד הנכס החדש?", options: ["בשווי הוגן, וההפרש ברווח או הפסד", "בערך נוכחי בריבית המקורית", "ביתרה הקודמת, בלי הפרש", "ברווח כולל אחר"], answer: 0, why: "IFRS 9 סעיפים 3.2.12, 5.1.1. מכאן הריבית האפקטיבית היא של הנכס החדש.", trap: "להשתמש בריבית המקורית גם כשהנכס נגרע. היא מיועדת למקרה שבו הנכס נשאר.", level: 2, source: "מקורית", ref: "IFRS 9 סעיפים 3.2.12, 5.1.1" }),
  askNumber({ id: "ifrs9-sub-loss", skill: "IFRS 9", prompt: "השקעה נטו בספרים 230,000 ש״ח. תיקון מהותי מביא לגריעה. בתנאים החדשים: 60,000 ש״ח בסוף כל שנה, 4 שנים, ושייר של 10,000 ש״ח. ריבית השוק היום 10%, והריבית המקורית 7%. כמה הפסד נרשם?", answer: 230_000 - P_SUB_FV, steps: [`שווי הוגן: =PV(10%;4;-60000;-10000) → ${fmt(P_SUB_FV)}`, `230,000 − ${fmt(P_SUB_FV)} = ${fmt(230_000 - P_SUB_FV)}`], trap: "להשתמש ב-7%. עם גריעה הנכס החדש נמדד בשווי הוגן.", level: 3, source: "מקורית", ref: "IFRS 9 סעיפים 3.2.12, 5.1.1" }),
  askNumber({ id: "waiver-due", skill: "ויתור", prompt: "מחכיר ויתר לחוכר על תשלום של 18,000 ש״ח שמועד פירעונו כבר עבר. מה ההפסד שנרשם מיד?", answer: 18_000, steps: ["תשלום שהגיע מועדו הוא נכס פיננסי. גורעים אותו כנגד רווח או הפסד: 18,000"], trap: "לפרוס את הוויתור על יתרת החכירה. פריסה היא רק לתשלומים שעוד לא הגיע מועדם.", level: 1, source: "בהשראת הרצאה", ref: "IFRS 9 סעיף 2.1(ב)(i)" }),
  askNumber({ id: "waiver-future", skill: "ויתור", prompt: "חכירה תפעולית. נשארו 3 שנים, 60,000 ש״ח בסוף כל שנה. המחכיר ויתר על התשלום של השנה הקרובה, ועל השנתיים האחרות לא. אין יתרות של הכנסות מראש או לקבל. מהי ההכנסה השנתית מכאן והלאה?", answer: 40_000, steps: ["ויתור על תשלום עתידי הוא תיקון, ולכן חכירה חדשה (סעיף 87)", "נשארו תשלומים של 60,000 × 2 = 120,000", "120,000 ÷ 3 = 40,000"], trap: "לרשום אפס הכנסה בשנה שבה לא משלמים. ההכנסה בקו ישר, גם בשנה בלי תקבול.", level: 2, source: "בהשראת הרצאה", ref: "סעיף 87" }),
  ask({ id: "sides-rate", skill: "השוואה", prompt: "תיקון אחד בשני הצדדים: התשלום ירד, התקופה לא השתנתה, והחכירה מימונית אצל המחכיר. הריבית הגלומה ביום התיקון ניתנת לקביעה, ושונה מהמקורית. באיזו ריבית כל צד מודד?", options: ["חוכר: בריבית המעודכנת. מחכיר: בריבית המקורית", "שניהם: בריבית המעודכנת", "שניהם: בריבית המקורית", "חוכר: בריבית המקורית. מחכיר: בריבית המעודכנת"], answer: 0, why: "החוכר לפי סעיף 45(ג). המחכיר לפי סעיף 80(ב), שמפנה ל-IFRS 9.", trap: "להניח שהצדדים מראה זה של זה. במודל התיקונים הם שונים.", level: 3, source: "מקורית", ref: "סעיפים 45(ג), 80(ב)" }),
];

const traps: Trap[] = [
  {
    id: "balance-way",
    prompt: "חכירה תפעולית תוקנה. מה קורה ליתרות מהחכירה המקורית בחישוב ההכנסה החדשה?",
    options: ["הכנסות מראש מתווספות, והכנסות לקבל יורדות", "הכנסות מראש יורדות, והכנסות לקבל מתווספות", "שתיהן נמחקות", "שתיהן לא משפיעות"],
    answer: 0,
    why: "הכסף שהתקבל ועוד לא הוכר יהפוך להכנסה. הכנסה שהוכרה ועוד לא התקבלה לא תוכר שוב.",
    traps: ["", "הפוך.", "הן נשארות במאזן, ויורדות בהדרגה.", "סעיף 87 דורש להתחשב בהן."],
  },
  {
    id: "asset-value",
    prompt: "חכירה מימונית תוקנה, ואילו התיקון היה בתוקף מההתחלה היא הייתה תפעולית. באיזה סכום הנכס חוזר לספרים?",
    options: ["ההשקעה נטו מיד לפני התיקון", "השווי ההוגן של היום", "הערך בספרים של יום ההתקשרות", "הערך הנוכחי של התשלומים החדשים"],
    answer: 0,
    why: "סעיף 80(א)(ii).",
    traps: ["", "אין כאן מדידה לפי שווי הוגן.", "הוא יצא מהספרים אז, ובמקומו נמדדה השקעה נטו.", "התשלומים החדשים הם הכנסה עתידית."],
  },
  {
    id: "residual-in",
    prompt: "מחשבים מחדש השקעה נטו לפי IFRS 9. מה עם שייר לא מובטח?",
    options: ["נשאר בחישוב", "יוצא מהחישוב", "נכנס רק אם גדל", "נרשם כהפסד"],
    answer: 0,
    why: "השקעה נטו כוללת את הערך הנוכחי של השייר הלא מובטח (נספח א׳).",
    traps: ["", "רק במבחן הסיווג הוא בחוץ, כי אינו תשלום חכירה.", "החישוב כולל אותו בכל מקרה.", "הוא חלק מהנכס, ולא הפסד."],
  },
  {
    id: "waiver-two",
    prompt: "מחכיר ויתר על שני תשלומים: אחד שמועדו עבר, ואחד של השנה הבאה. מה נכון?",
    options: ["הראשון: הפסד מיידי. השני: תיקון חכירה", "שניהם: הפסד מיידי", "שניהם: תיקון חכירה", "הראשון: תיקון חכירה. השני: הפסד מיידי"],
    answer: 0,
    why: "מה שהגיע מועדו כבר נכס פיננסי, ומה שעוד לא הגיע הוא חלק מהתמורה בחוזה.",
    traps: ["", "תשלום עתידי עוד לא נרשם כחוב, ולכן הוא משנה את התמורה.", "תשלום שהגיע מועדו כבר נרשם כחוב, ולכן גורעים אותו.", "הפוך."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const LESSOR_CHANGES_TAUGHT: Record<string, string> = {
  "mod-first": "ls-lmd-walk",
  "not-mod": "ls-lmd-hook",
  "op-new": "ls-lmd-op",
  "op-prepaid": "ls-lmd-op",
  "op-income-prepaid": "ls-lmd-op",
  "op-income-accrued": "ls-lmd-accrued",
  "op-accrued-after": "ls-lmd-accrued",
  "op-to-fin": "ls-lmd-tofin",
  "op-entry": "ls-lmd-op",
  "sep-both": "ls-lmd-sep",
  "sep-price": "ls-lmd-sep",
  "sep-income": "ls-lmd-sep",
  "would-when": "ls-lmd-would",
  "would-case": "ls-lmd-would",
  "fin-entry": "ls-lmd-would",
  "fin-dep": "ls-lmd-would",
  "ifrs9-bal": "ls-lmd-ifrs9",
  "ifrs9-loss": "ls-lmd-ifrs9",
  "ifrs9-rate": "ls-lmd-ifrs9",
  "ifrs9-gain": "ls-lmd-ifrs9",
  "ifrs9-sub-what": "ls-lmd-ifrs9-new",
  "ifrs9-sub-loss": "ls-lmd-ifrs9-new",
  "waiver-due": "ls-lmd-waiver",
  "waiver-future": "ls-lmd-waiver",
  "sides-rate": "ls-lmd-sides",
  "balance-way": "ls-lmd-accrued",
  "asset-value": "ls-lmd-would",
  "residual-in": "ls-lmd-ifrs9",
  "waiver-two": "ls-lmd-waiver",
};

/** Lesson 7: changing a lease in the lessor's books, by its original classification. */
export const LESSOR_CHANGES: StudyModule = {
  slug: "ifrs16-lessor-changes",
  course: COURSE,
  n: 7,
  title: "מחכיר: תיקוני חכירה",
  description: "החוזה משתנה, והמחכיר שואל קודם איך סיווג אותו. תפעולית הופכת לחכירה חדשה, ומימונית מתפצלת לשלושה מסלולים: חכירה נפרדת, חכירה חדשה או IFRS 9.",
  goal: "לטפל בתיקון חכירה בספרי המחכיר לפי הסיווג המקורי, עד פקודת היומן והדוחות הכספיים.",
  outcomes: [
    "לבחור מסלול לפי התרשים של סעיפים 79, 80 ו-87",
    "לבנות חכירה חדשה אחרי תיקון של תפעולית, כולל הכנסות מראש והכנסות לקבל",
    "לזהות חכירה נפרדת לפי שני התנאים",
    "להחזיר נכס לספרים לפי ההשקעה נטו, כשהחכירה הייתה תפעולית",
    "לחשב מחדש השקעה נטו בריבית המקורית, ולרשום רווח או הפסד",
    "להבדיל בין ויתור על תשלום שמועדו עבר לבין ויתור על תשלום עתידי",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-lmd-hook", title: "החוזה השתנה, מה עכשיו" },
    { id: "ls-lmd-walk", title: "התרשים: ארבעה סופים" },
    { id: "ls-lmd-op", title: "תפעולית: חכירה חדשה, עם הכנסות מראש" },
    { id: "ls-lmd-accrued", title: "תפעולית: כשיש הכנסות לקבל" },
    { id: "ls-lmd-tofin", title: "תפעולית שהופכת למימונית" },
    { id: "ls-lmd-sep", title: "מימונית: חכירה נפרדת" },
    { id: "ls-lmd-would", title: "מימונית: הייתה תפעולית" },
    { id: "ls-lmd-ifrs9", title: "מימונית: נשארת מימונית" },
    { id: "ls-lmd-ifrs9-new", title: "מימונית: תיקון מהותי שמביא לגריעה" },
    { id: "ls-lmd-sides", title: "חוכר מול מחכיר" },
    { id: "ls-lmd-waiver", title: "ויתור על תשלומים" },
    { id: "ls-lmd-drill", title: "מתרגלים: מספרים חדשים בכל פעם" },
    { id: "ls-lmd-mistake", title: "מצאו את הטעות" },
    { id: "ls-lmd-master", title: "שאלה מסכמת: מנוף, ארבעה תיקונים" },
  ],
  exercises,
  traps,
  tips: [
    "השאלה הראשונה: איך החכירה סווגה במקור.",
    "תפעולית: תמיד חכירה חדשה, מיום התיקון ולא למפרע.",
    "הכנסות מראש מתווספות לתשלומים. הכנסות לקבל יורדות מהם.",
    "מימונית, נכס נוסף במחיר נפרד: חכירה נפרדת, והמקורית לא משתנה.",
    "אחרת בודקים: מה היה הסיווג אילו התיקון היה בתוקף ביום ההתקשרות, לפי הנתונים של אותו יום.",
    "הייתה תפעולית: הנכס חוזר לפי ההשקעה נטו, בלי רווח או הפסד.",
    "הייתה מימונית: מחשבים מחדש בריבית המקורית, כולל השייר, וההפרש ברווח או הפסד.",
    "תיקון מהותי שמביא לגריעה: נכס חדש בשווי הוגן, וההפרש ברווח או הפסד.",
    "החוכר עובר לריבית מעודכנת. המחכיר, במסלול של IFRS 9, נשאר בריבית המקורית.",
    "ויתור: מה שמועדו עבר הוא הפסד מיידי. מה שעוד לא הגיע הוא תיקון.",
  ],
};
