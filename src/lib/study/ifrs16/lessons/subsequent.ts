import { allocate, lessee, type LesseeTerms, pvEnd, shownYears, statementLines } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { statementTask } from "../drills";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import { WORK2 } from "./measure";

const r = Math.round;
const shown = (t: LesseeTerms) => shownYears(t);
/** Each figure rounded on its own: an answer to a question about interest or depreciation has to be the exact one, rounded. */
const exact = (t: LesseeTerms) => {
  const l = lessee(t);
  return { cost: r(l.cost), rows: l.rows.map((y) => ({ ...y, opening: r(y.opening), interest: r(y.interest), closing: r(y.closing), nonCurrent: r(y.nonCurrent), current: r(y.current), depreciation: r(y.depreciation), rightOfUse: r(y.rightOfUse) })) };
};

/** The truck the lesson follows: the same payments, at each year's end and at each year's start. */
export const TRUCK = { payment: 30_000, years: 4, rate: 0.07, life: 6 };
export const TRUCK_END = shown({ payment: TRUCK.payment, years: TRUCK.years, rate: TRUCK.rate, timing: "end" });
export const TRUCK_START = shown({ payment: TRUCK.payment, years: TRUCK.years, rate: TRUCK.rate, timing: "start" });

/** Depreciation: one lease, three endings (paragraph 32). */
export const DEP_CASES = [
  { text: "הנכס חוזר למחכיר. חיים 10, תקופה 4", term: 4, life: 10, over: 4, why: "הקצר מביניהם" },
  { text: "הנכס חוזר למחכיר. חיים 3, תקופה 5", term: 5, life: 3, over: 3, why: "הקצר מביניהם" },
  { text: "ודאי שהאופציה תמומש. חיים 10, תקופה 4", term: 4, life: 10, over: 10, why: "אורך החיים" },
  { text: "הבעלות עוברת בסוף. חיים 10, תקופה 4", term: 4, life: 10, over: 10, why: "אורך החיים" },
];

/** The worked example: a car with a purchase option and a free year of insurance. */
export const WORK = { ...WORK2, life: 6 };
const WORK_TERMS: LesseeTerms = { payment: WORK.payment, years: WORK.years, rate: WORK.rate, timing: "start", finalAmount: WORK.option, incentives: WORK.insurance, directCosts: WORK.fees, depreciationYears: WORK.life };
export const WORK_S = shown(WORK_TERMS);
export const WORK_SECTIONS = statementLines(WORK_S.rows, WORK.years, [{ label: "הוצאות ביטוח", values: [WORK.insurance] }]);

/** The statements to fill in by hand, the first year given. */
export const FILL = { payment: 40_000, years: 4, rate: 0.05, directCosts: 3_000, life: 8, shown: 3 };
export const FILL_TASK = statementTask({
  prompt: `ב-1.1 של שנה 1 חברה חכרה מכונה ל-${FILL.years} שנים. התשלום ${fmt(FILL.payment)} ש״ח בתחילת כל שנה, והראשון שולם ב-1.1 של שנה 1. הריבית התוספתית 5%. החברה שילמה עלויות ישירות של ${fmt(FILL.directCosts)} ש״ח. אורך החיים ${FILL.life} שנים, והמכונה חוזרת למחכיר בסוף התקופה. הפחת בקו ישר.`,
  terms: { payment: FILL.payment, years: FILL.years, rate: FILL.rate, timing: "start", directCosts: FILL.directCosts },
  years: FILL.shown,
  given: 1,
  notes: ["הפחת על פני 4 שנים: הקצר מבין החיים והתקופה (סעיף 32).", "הריבית על היתרה אחרי התשלום של 1.1.", "בשנה 3 נשאר רק התשלום של מחר, ולכן כל היתרה שוטפת."],
  trap: "לרשום בשנה 3 חלק לא שוטף. אחרי התשלום של מחר לא נשאר כלום, ולכן אין חלק לא שוטף.",
});

/** Straight line: a kiosk for twelve months from 1.7, with the first two months free. */
export const KIOSK = { months: 12, free: 2, monthly: 2_000, inFirstYear: 6 };
export const KIOSK_TOTAL = (KIOSK.months - KIOSK.free) * KIOSK.monthly;
export const KIOSK_PER_MONTH = KIOSK_TOTAL / KIOSK.months;
export const KIOSK_EXPENSE = KIOSK_PER_MONTH * KIOSK.inFirstYear;
export const KIOSK_PAID = (KIOSK.inFirstYear - KIOSK.free) * KIOSK.monthly;
export const KIOSK_ACCRUED = KIOSK_EXPENSE - KIOSK_PAID;

/** The same laptops, by the full model and on a straight line. */
export const LAPTOP = { payment: 10_000, years: 3, rate: 0.05 };
export const LAPTOP_FULL = shown({ payment: LAPTOP.payment, years: LAPTOP.years, rate: LAPTOP.rate, timing: "end" }).rows.map((y) => y.depreciation + y.interest);

/** The closing question: one contract, two leases and a service. */
export const MASTER = { yearly: 90_000, years: 4, rate: 0.06, forklift: 150_000, van: 90_000, service: 60_000, forkliftWithService: 210_000 };
export const MASTER_TOTAL = MASTER.yearly * MASTER.years;
export const MASTER_SHARES = allocate(MASTER_TOTAL, [MASTER.forklift, MASTER.van, MASTER.service]);
export const MASTER_YEARLY = MASTER_SHARES.map((s) => s / MASTER.years);
export const MASTER_EXP_SHARES = allocate(MASTER_TOTAL, [MASTER.forkliftWithService, MASTER.van]);
export const MASTER_EXP_YEARLY = MASTER_EXP_SHARES.map((s) => s / MASTER.years);
const masterLease = (payment: number) => shown({ payment, years: MASTER.years, rate: MASTER.rate, timing: "end" });
export const MASTER_FORKLIFT = masterLease(MASTER_YEARLY[0]);
export const MASTER_VAN = masterLease(MASTER_YEARLY[1]);
export const MASTER_EXP_FORKLIFT = masterLease(MASTER_EXP_YEARLY[0]);
export const MASTER_EXP_VAN = masterLease(MASTER_EXP_YEARLY[1]);
/** Two leases' lines added up, in two years, with an expense beside them. */
const twoLeases = (a: ReturnType<typeof masterLease>, b: ReturnType<typeof masterLease>, other: { label: string; values: number[] }[] = []) =>
  statementLines(
    a.rows.map((y, i) => {
      const z = b.rows[i];
      return { ...y, depreciation: y.depreciation + z.depreciation, interest: y.interest + z.interest, rightOfUse: y.rightOfUse + z.rightOfUse, current: y.current + z.current, nonCurrent: y.nonCurrent + z.nonCurrent, closing: y.closing + z.closing };
    }),
    2,
    other,
  );
export const MASTER_LINES = twoLeases(MASTER_FORKLIFT, MASTER_VAN, [{ label: "הוצאות תחזוקה", values: [MASTER_YEARLY[2], MASTER_YEARLY[2]] }]);
export const MASTER_EXP_LINES = twoLeases(MASTER_EXP_FORKLIFT, MASTER_EXP_VAN);

/** What counts as short term, to sort. */
export const SHORT_ITEMS: { text: string; answer: "yes" | "no"; why: string }[] = [
  { text: "חוזה ל-10 חודשים, בלי אופציות.", answer: "yes", why: "עד 12 חודשים במועד התחילה, בלי אופציית רכישה (נספח א׳)." },
  { text: "חוזה ל-12 חודשים בדיוק, בלי אופציות.", answer: "yes", why: "12 חודשים או פחות. 12 עדיין בפנים." },
  { text: "חוזה ל-9 חודשים, ואופציית הארכה ל-6 חודשים שוודאי באופן סביר שתמומש.", answer: "no", why: "בודקים את תקופת החכירה, והיא 15 חודשים." },
  { text: "חוזה ל-9 חודשים, ואופציית הארכה ל-6 חודשים במחיר שוק, בלי תמריץ להאריך.", answer: "yes", why: "האופציה לא נספרת, ולכן תקופת החכירה 9 חודשים." },
  { text: "חוזה ל-6 חודשים עם אופציית רכישה בסופו.", answer: "no", why: "חכירה עם אופציית רכישה אינה לטווח קצר, גם אם היא קצרה מאוד." },
];
export const SHORT_OPTIONS: [string, string][] = [
  ["yes", "לטווח קצר"],
  ["no", "לא לטווח קצר"],
];

/** What counts as low value, to sort. */
export const LOW_ITEMS: { text: string; answer: "yes" | "no"; why: string }[] = [
  { text: "מחשב נייד.", answer: "yes", why: "דוגמה מפורשת בתקן (ב8)." },
  { text: "כיסא משרדי.", answer: "yes", why: "פריט קטן של ריהוט משרדי (ב8)." },
  { text: "מכונית בת 10 שנים, ששווה היום מעט מאוד.", answer: "no", why: "בודקים את הערך של נכס חדש (ב3), ומכונית חדשה אינה בעלת ערך נמוך (ב6)." },
  { text: "מחשב נייד אצל חברה קטנה, שעבורה הוא הוצאה משמעותית.", answer: "yes", why: "ההערכה מוחלטת, ולא תלויה בגודל החוכר (ב4)." },
  { text: "שרת אחד מתוך מערך, שלא יכול לפעול בלי השרתים האחרים.", answer: "no", why: "נכס שתלוי במידה רבה בנכסים אחרים אינו יכול להיות בעל ערך נמוך (ב5(ב))." },
];
export const LOW_OPTIONS: [string, string][] = [
  ["yes", "ערך נמוך"],
  ["no", "לא ערך נמוך"],
];

/** Where each payment goes in the cash flow statement (paragraph 50), to sort. */
export const CASH_ITEMS: { text: string; answer: "fin" | "op" | "ias7"; why: string }[] = [
  { text: "החלק של הקרן בתשלום החכירה.", answer: "fin", why: "סעיף 50(א)." },
  { text: "החלק של הריבית בתשלום החכירה.", answer: "ias7", why: "סעיף 50(ב): לפי ההוראות של IAS 7 לריבית ששולמה." },
  { text: "תשלום על חכירה לטווח קצר שטופלה בהקלה.", answer: "op", why: "סעיף 50(ג)." },
  { text: "תשלום על מחשבים ניידים, שטופלו בהקלה לערך נמוך.", answer: "op", why: "סעיף 50(ג)." },
  { text: "2% מהמכירות, שלא נכללו בהתחייבות.", answer: "op", why: "סעיף 50(ג)." },
];
export const CASH_OPTIONS: [string, string][] = [
  ["fin", "פעילות מימון"],
  ["op", "פעילות שוטפת"],
  ["ias7", "לפי IAS 7"],
];

const P_START = exact({ payment: 24_000, years: 5, rate: 0.06, timing: "start" }).rows;
const P_START2 = exact({ payment: 40_000, years: 6, rate: 0.05, timing: "start" }).rows;
const P_END2 = shown({ payment: 15_000, years: 6, rate: 0.05, timing: "end" }).rows;
const P_NC_END = shown({ payment: 30_000, years: 5, rate: 0.06, timing: "end" }).rows;
const P_NC_START = shown({ payment: 40_000, years: 5, rate: 0.05, timing: "start" }).rows;
const P_TOTAL = exact({ payment: 50_000, years: 4, rate: 0.05, timing: "end" }).rows;
const P_KIND = exact({ payment: 36_000, years: 3, rate: 0.05, timing: "start", incentives: 1_800 });
const P_LINE = exact({ payment: 20_000, years: 3, rate: 0.06, timing: "end" }).rows;
const P_CONTRACT_A = exact({ payment: 48_000, years: 5, rate: 0.05, timing: "end" });
const P_CONTRACT_B = exact({ payment: 32_000, years: 5, rate: 0.05, timing: "end" });
const P_OPT = shown({ payment: 55_000, years: 4, rate: 0.06, timing: "end", finalAmount: 8_000, depreciationYears: 7 });
const P_NOOPT = shown({ payment: 55_000, years: 4, rate: 0.06, timing: "end" });
const P_JOURNAL = exact({ payment: 25_000, years: 5, rate: 0.06, timing: "end" });

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  askNumber({
    id: "int-end",
    skill: "מעגל ההתחייבות",
    prompt: "יתרת התחייבות החכירה ב-1.1 היא 120,000 ש״ח, הריבית 5%, והתשלום של 30,000 ש״ח משולם ב-31.12. מהן הוצאות המימון של השנה?",
    answer: 6_000,
    steps: ["כשמשלמים בסוף שנה, החוב עומד במלואו כל השנה.\n120,000 × 0.05 = 6,000"],
    trap: "להוריד את התשלום לפני חישוב הריבית. הוא יוצא רק בסוף השנה.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "סעיפים 36, 37",
  }),
  askNumber({
    id: "close-end",
    skill: "מעגל ההתחייבות",
    prompt: "יתרת התחייבות החכירה ב-1.1 היא 200,000 ש״ח, הריבית 6%, והתשלום של 50,000 ש״ח משולם ב-31.12. מהי היתרה ב-31.12, אחרי התשלום?",
    answer: 162_000,
    steps: ["200,000 × 0.06 = 12,000 (ריבית)", "200,000 + 12,000 − 50,000 = 162,000"],
    trap: "להוריד 50,000 בלי להוסיף ריבית. קודם החוב גדל בריבית, ואז התשלום מקטין אותו.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "סעיף 36",
  }),
  askNumber({
    id: "int-start",
    skill: "תשלום בתחילת שנה",
    prompt: "חברה חכרה נכס ל-5 שנים, ב-24,000 ש״ח בתחילת כל שנה. התשלום הראשון שולם במועד התחילה, והריבית 6%. מהן הוצאות המימון של השנה הראשונה?",
    answer: P_START[0].interest,
    steps: [`אחרי התשלום נשארים 4 תשלומים.\n24,000 × (1 − 1.06^(−4)) ÷ 0.06 = ${fmt(P_START[0].opening - 24_000)}`, `הריבית על היתרה אחרי התשלום.\n${fmt(P_START[0].opening - 24_000)} × 0.06 = ${fmt(P_START[0].interest)}`],
    trap: "לחשב ריבית על הערך הנוכחי של כל 5 התשלומים. התשלום של היום כבר יצא, ולא נושא ריבית.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 37",
  }),
  askNumber({
    id: "int-start-y2",
    skill: "תשלום בתחילת שנה",
    prompt: "חברה חכרה נכס ל-6 שנים, ב-40,000 ש״ח בתחילת כל שנה. התשלום הראשון שולם במועד התחילה, והריבית 5%. מהן הוצאות המימון של השנה השנייה?",
    answer: P_START2[1].interest,
    steps: [`אחרי התשלום הראשון: 40,000 × (1 − 1.05^(−5)) ÷ 0.05 = ${fmt(P_START2[0].opening - 40_000)}`, `שנה 1: ${fmt(P_START2[0].opening - 40_000)} × 0.05 = ${fmt(P_START2[0].interest)} ריבית, ויתרת סגירה ${fmt(P_START2[0].closing)}`, `שנה 2: (${fmt(P_START2[0].closing)} − 40,000) × 0.05 = ${fmt(P_START2[1].interest)}`],
    trap: "לשכוח את התשלום של 1.1 בשנה השנייה. הוא יוצא לפני שהריבית של השנה נוצרת.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 37",
  }),
  askNumber({
    id: "close-y2-end",
    skill: "מעגל ההתחייבות",
    prompt: "חברה חכרה נכס ל-6 שנים, ב-15,000 ש״ח בסוף כל שנה, בריבית 5%. מהי יתרת ההתחייבות ב-31.12 של השנה השנייה?",
    answer: P_END2[1].closing,
    steps: [`שנה 1: ${fmt(P_END2[0].opening)} + ${fmt(P_END2[0].interest)} − 15,000 = ${fmt(P_END2[0].closing)}`, `שנה 2: ${fmt(P_END2[1].opening)} + ${fmt(P_END2[1].interest)} − 15,000 = ${fmt(P_END2[1].closing)}`, `בדיקה: נשארו 4 תשלומים, ו-15,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(r(pvEnd(0.05, 4, 15_000)))}`],
    trap: "להוריד מהיתרה שני תשלומים שלמים. חלק מכל תשלום הוא ריבית, ולא קרן.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 36",
  }),
  askNumber({
    id: "dep-no-option",
    skill: "פחת",
    prompt: "עלות נכס זכות השימוש 90,000 ש״ח. תקופת החכירה 5 שנים, אורך החיים 8 שנים, והנכס חוזר למחכיר בסוף. הפחת בקו ישר. מהי הוצאת הפחת השנתית?",
    answer: 18_000,
    steps: ["הקצר מבין החיים והתקופה: 5 שנים (סעיף 32).\n90,000 ÷ 5 = 18,000"],
    trap: "להפחית על פני 8 שנים. החברה משתמשת בנכס רק 5 שנים.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "סעיף 32",
  }),
  askNumber({
    id: "dep-option",
    skill: "פחת",
    prompt: "עלות נכס זכות השימוש 120,000 ש״ח. תקופת החכירה 4 שנים, ואורך החיים 10 שנים. עלות הנכס כוללת מחיר של אופציית רכישה שוודאי באופן סביר שתמומש. הפחת בקו ישר. מהי הוצאת הפחת השנתית?",
    answer: 12_000,
    steps: ["החברה תקנה את הנכס, ולכן לאורך החיים: 10 שנים (סעיף 32).\n120,000 ÷ 10 = 12,000"],
    trap: "להפחית על פני תקופת החכירה. אחרי המימוש הנכס נשאר אצל החברה.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 32",
  }),
  askNumber({
    id: "dep-life-short",
    skill: "פחת",
    prompt: "עלות נכס זכות השימוש 60,000 ש״ח. תקופת החכירה 10 שנים, ואורך החיים של נכס הבסיס 6 שנים. אין אופציית רכישה. הפחת בקו ישר. מהי הוצאת הפחת השנתית?",
    answer: 10_000,
    steps: ["הקצר מבין החיים והתקופה: 6 שנים (סעיף 32).\n60,000 ÷ 6 = 10,000"],
    trap: "להניח שתקופת החכירה תמיד קובעת. הקצר מבין השניים קובע, ולפעמים זה אורך החיים.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 32",
  }),
  askNumber({
    id: "nc-end",
    skill: "שוטף ולא שוטף",
    prompt: "חברה חכרה נכס ל-5 שנים, ב-30,000 ש״ח בסוף כל שנה, בריבית 6%. מהו החלק הלא שוטף של ההתחייבות ב-31.12 של השנה הראשונה?",
    answer: P_NC_END[0].nonCurrent,
    steps: [`אחרי התשלום של השנה הבאה יישארו 3 תשלומים.\n30,000 × (1 − 1.06^(−3)) ÷ 0.06 = ${fmt(P_NC_END[0].nonCurrent)}`, `זו גם יתרת הסגירה של השנה השנייה.\nהיתרה עכשיו ${fmt(P_NC_END[0].closing)}, ולכן השוטף הוא ${fmt(P_NC_END[0].current)}.`],
    trap: "לומר שהשוטף הוא 30,000. חלק מהתשלום הבא הוא ריבית שעוד לא נוצרה, ולכן הוא לא חלק מהיתרה היום.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "דוגמת הרצאה",
  }),
  askNumber({
    id: "nc-start",
    skill: "שוטף ולא שוטף",
    prompt: "חברה חכרה נכס ל-5 שנים, ב-40,000 ש״ח בתחילת כל שנה. התשלום הראשון שולם במועד התחילה, והריבית 5%. מהו החלק הלא שוטף של ההתחייבות ב-31.12 של השנה הראשונה?",
    answer: P_NC_START[0].nonCurrent,
    steps: [`יתרת הסגירה: (${fmt(P_NC_START[0].opening)} − 40,000) × 1.05 = ${fmt(P_NC_START[0].closing)}`, `מחר משלמים 40,000, ולכן זה החלק השוטף.\n${fmt(P_NC_START[0].closing)} − 40,000 = ${fmt(P_NC_START[0].nonCurrent)}`],
    trap: "לחשב את השוטף כהקטנת קרן, כמו בתשלום בסוף שנה. כאן התשלום משולם מחר, ואין ריבית בדרך.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "דוגמת הרצאה",
  }),
  ask({
    id: "all-current",
    skill: "שוטף ולא שוטף",
    prompt: "חכירה עם תשלום בתחילת כל שנה. עכשיו 31.12, ונשאר תשלום אחד בלבד, שישולם מחר. יתרת ההתחייבות 50,000 ש״ח. איך היא מוצגת?",
    options: ["כולה שוטפת", "כולה לא שוטפת", "מחצית שוטפת ומחצית לא שוטפת", "לא מוצגת, כי היא תשולם מחר"],
    answer: 0,
    why: "מה שישולם בתוך 12 חודשים הוא שוטף, ולא נשאר דבר מעבר לכך.",
    trap: "להשאיר חלק לא שוטף מתוך הרגל. אם לא נשאר תשלום מעבר ל-12 חודשים, הכול שוטף.",
    level: 3,
    source: "בהשראת הרצאה",
    ref: "דוגמת הרצאה",
  }),
  ask({
    id: "sales-exp",
    skill: "תשלום לפי מכירות",
    prompt: "חנות משלמת 2% מהמכירות למחכיר, מעבר לתשלום קבוע שכבר נמצא בהתחייבות. המכירות השנה 500,000 ש״ח. מה קורה ל-10,000 ש״ח?",
    options: ["הוצאה בדוח רווח או הפסד של השנה", "הגדלת התחייבות החכירה", "הגדלת נכס זכות השימוש", "הוצאה שנפרסת על פני תקופת החכירה"],
    answer: 0,
    why: "סעיף 38(ב): תשלום משתנה שלא נכלל בהתחייבות מוכר ברווח או הפסד בתקופה שבה קרה האירוע שהפעיל אותו.",
    trap: "להוסיף אותו להתחייבות. הוא מעולם לא היה חלק ממנה.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "סעיף 38(ב)",
  }),
  askNumber({
    id: "pl-total",
    skill: "הצגה",
    prompt: "חברה חכרה חנות ל-4 שנים, ב-50,000 ש״ח בסוף כל שנה, בריבית 5%. הפחת בקו ישר על פני התקופה. בנוסף היא משלמת 2% מהמכירות, שהיו השנה 300,000 ש״ח. מהו סך ההוצאות בדוח רווח או הפסד של השנה הראשונה?",
    answer: P_TOTAL[0].depreciation + P_TOTAL[0].interest + 6_000,
    steps: [`עלות הנכס: 50,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(P_TOTAL[0].opening)}`, `פחת: ${fmt(P_TOTAL[0].opening)} ÷ 4 = ${fmt(P_TOTAL[0].depreciation)}`, `מימון: ${fmt(P_TOTAL[0].opening)} × 0.05 = ${fmt(P_TOTAL[0].interest)}`, `לפי מכירות: 300,000 × 0.02 = 6,000`, `סך הכול: ${fmt(P_TOTAL[0].depreciation)} + ${fmt(P_TOTAL[0].interest)} + 6,000 = ${fmt(P_TOTAL[0].depreciation + P_TOTAL[0].interest + 6_000)}`],
    trap: "לרשום את התשלום של 50,000 כהוצאה. הוא מקטין את ההתחייבות. ההוצאות הן פחת וריבית.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 38, 49",
  }),
  askNumber({
    id: "in-kind",
    skill: "תמריץ בעין",
    prompt: "חברה חכרה רכב ל-3 שנים, ב-36,000 ש״ח בתחילת כל שנה, בריבית 5%. התשלום הראשון שולם במועד התחילה. המחכיר נתן ביטוח חינם לשנה הראשונה, ששוויו 1,800 ש״ח. הפחת בקו ישר על פני התקופה. מהו סך ההוצאות בדוח רווח או הפסד של השנה הראשונה?",
    answer: P_KIND.rows[0].depreciation + P_KIND.rows[0].interest + 1_800,
    steps: [`עלות הנכס: ${fmt(P_KIND.rows[0].opening)} − 1,800 = ${fmt(P_KIND.cost)}`, `פחת: ${fmt(P_KIND.cost)} ÷ 3 = ${fmt(P_KIND.rows[0].depreciation)}`, `מימון: (${fmt(P_KIND.rows[0].opening)} − 36,000) × 0.05 = ${fmt(P_KIND.rows[0].interest)}`, "ביטוח: 1,800, בשנה שהוא מכסה.", `סך הכול: ${fmt(P_KIND.rows[0].depreciation)} + ${fmt(P_KIND.rows[0].interest)} + 1,800 = ${fmt(P_KIND.rows[0].depreciation + P_KIND.rows[0].interest + 1_800)}`],
    trap: "לחשוב שביטוח חינם הוא בלי הוצאה. הוא מקטין את עלות הנכס, והחברה צורכת אותו בשנה הראשונה, ולכן הוא הוצאה.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "דוגמת הרצאה",
  }),
  ask({
    id: "short-option",
    skill: "טווח קצר",
    prompt: "חברה חכרה מכונה ל-11 חודשים, עם אופציית רכישה בסוף התקופה. המחיר קרוב לשווי הצפוי, ולא ודאי שתמומש. האם אפשר ליישם את ההקלה לטווח קצר?",
    options: ["לא, כי יש בחכירה אופציית רכישה", "כן, כי החוזה עד 12 חודשים", "כן, כי לא ודאי שהאופציה תמומש", "רק אם המכונה בעלת ערך נמוך"],
    answer: 0,
    why: "נספח א׳: חכירה המכילה אופציית רכישה אינה חכירה לטווח קצר. ההגדרה לא שואלת אם ודאי שהיא תמומש.",
    trap: "לבדוק רק את אורך החוזה. קיומה של אופציית רכישה מספיק.",
    level: 2,
    source: "מקורית",
    ref: "נספח א׳",
  }),
  ask({
    id: "short-class",
    skill: "טווח קצר",
    prompt: "לחברה 40 משאיות בחכירות של 10 חודשים. היא רוצה ליישם את ההקלה לטווח קצר רק על 15 מהן, ועל השאר לא. המשאיות דומות, ובשימוש דומה. האם זה אפשרי?",
    options: ["לא, הבחירה נעשית לפי קבוצה של נכסים דומים", "כן, הבחירה היא לכל חכירה בנפרד", "כן, אם מגלים זאת בביאור", "לא, כי ההקלה אסורה למשאיות"],
    answer: 0,
    why: "סעיף 8: בטווח קצר הבחירה לפי קבוצות של נכסי בסיס דומים. רק בערך נמוך היא לכל חכירה בנפרד.",
    trap: "להחליף בין השתיים. טווח קצר: לפי קבוצה. ערך נמוך: לכל חכירה.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 8",
  }),
  ask({
    id: "low-car",
    skill: "ערך נמוך",
    prompt: "חברה קטנה חוכרת מכונית ישנה, ששווה היום 15,000 ש״ח. האם זה נכס בעל ערך נמוך?",
    options: ["לא, כי מכונית חדשה אינה בעלת ערך נמוך", "כן, כי היא שווה מעט היום", "כן, כי החברה קטנה", "רק אם החכירה לשנה"],
    answer: 0,
    why: "ב3 ו-ב6: מעריכים לפי הערך של הנכס כשהוא חדש. הגודל של החוכר לא משנה (ב4).",
    trap: "להעריך לפי הערך היום, או לפי מה שמהותי לחברה.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "ב3, ב4, ב6",
  }),
  askNumber({
    id: "line",
    skill: "קו ישר",
    prompt: "חברה חכרה חלל תצוגה ל-9 חודשים החל מ-1.10, ובחרה בהקלה לטווח קצר. 3 החודשים הראשונים בחינם, ובכל אחד מ-6 החודשים הבאים היא משלמת 3,000 ש״ח. מהי הוצאת החכירה בשנה שמסתיימת ב-31.12?",
    answer: 6_000,
    steps: ["סך התשלומים: 6 × 3,000 = 18,000", "בקו ישר לחודש: 18,000 ÷ 9 = 2,000", "עד 31.12 עברו 3 חודשים: 3 × 2,000 = 6,000"],
    trap: "לרשום אפס כי עדיין לא שילמו. ההוצאה נפרסת על כל התקופה, גם על החודשים בחינם.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 6",
  }),
  askNumber({
    id: "cash",
    skill: "תזרים מזומנים",
    prompt: "תשלום חכירה של 30,000 ש״ח שולם ב-31.12. הריבית של השנה 6,000 ש״ח. כמה מהתשלום מסווג לפעילות מימון כתשלום קרן?",
    answer: 24_000,
    steps: ["30,000 − 6,000 = 24,000 (קרן, סעיף 50(א))", "את 6,000 הריבית מסווגים לפי IAS 7 (סעיף 50(ב))."],
    trap: "לסווג את כל התשלום לאותה פעילות. הקרן והריבית מטופלות בנפרד.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 50",
  }),
  ask({
    id: "relief-change",
    skill: "טווח קצר",
    prompt: "חברה טיפלה בחכירה של 10 חודשים בהקלה לטווח קצר. אחרי 8 חודשים היא מימשה אופציית הארכה ל-12 חודשים נוספים, שלא נכללה קודם בתקופה. מה עכשיו?",
    options: ["מתייחסים לזה כחכירה חדשה, ובודקים אותה מחדש", "ממשיכים בהקלה עד סוף החוזה", "מתקנים את השנים הקודמות", "אין השפעה, כי ההקלה נבחרה"],
    answer: 0,
    why: "סעיף 7(ב): שינוי בתקופת החכירה בחכירה בהקלה מוביל לטיפול בה כחכירה חדשה.",
    trap: "להניח שהבחירה בהקלה סופית. כל שינוי בתקופה מחזיר לבדיקה.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 7",
  }),
  askNumber({
    id: "line-diff",
    skill: "קו ישר",
    prompt: "חברה חכרה 10 מחשבים ל-3 שנים, ב-20,000 ש״ח בסוף כל שנה. הריבית התוספתית 6%. אילו בחרה בהקלה לערך נמוך, הוצאתה הייתה 20,000 ש״ח בשנה. כמה גבוהה יותר הוצאת השנה הראשונה במודל המלא, עם פחת וריבית, מאשר בהקלה?",
    answer: P_LINE[0].depreciation + P_LINE[0].interest - 20_000,
    steps: [`התחייבות ונכס: 20,000 × (1 − 1.06^(−3)) ÷ 0.06 = ${fmt(P_LINE[0].opening)}`, `פחת: ${fmt(P_LINE[0].opening)} ÷ 3 = ${fmt(P_LINE[0].depreciation)}`, `ריבית: ${fmt(P_LINE[0].opening)} × 0.06 = ${fmt(P_LINE[0].interest)}`, `${fmt(P_LINE[0].depreciation)} + ${fmt(P_LINE[0].interest)} − 20,000 = ${fmt(P_LINE[0].depreciation + P_LINE[0].interest - 20_000)}`],
    trap: "לחשוב שהסכום הכולל שונה. לאורך החכירה שני המודלים זהים. רק התזמון שונה, כי הריבית גבוהה בהתחלה.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 6",
  }),
  askNumber({
    id: "contract-y1",
    skill: "חוזה עם רכיבים",
    prompt: "חוזה ל-5 שנים כולל משאית, רכב ושירותי תחזוקה למשאית. התשלום הכולל 96,000 ש״ח בסוף כל שנה. מחירים נפרדים לכל התקופה: משאית 300,000 ש״ח, רכב 200,000 ש״ח, תחזוקה 100,000 ש״ח. החברה מפרידה רכיבים. הריבית התוספתית 5%, והפחת בקו ישר על פני התקופה. מהו סך ההוצאות בדוח רווח או הפסד של השנה הראשונה?",
    answer: P_CONTRACT_A.rows[0].depreciation + P_CONTRACT_A.rows[0].interest + P_CONTRACT_B.rows[0].depreciation + P_CONTRACT_B.rows[0].interest + 16_000,
    steps: ["לכל שנה: 96,000 × 300,000 ÷ 600,000 = 48,000 (משאית), 96,000 × 200,000 ÷ 600,000 = 32,000 (רכב), 96,000 × 100,000 ÷ 600,000 = 16,000 (תחזוקה).", `משאית: נכס ${fmt(P_CONTRACT_A.cost)}, פחת ${fmt(P_CONTRACT_A.rows[0].depreciation)}, ריבית ${fmt(P_CONTRACT_A.rows[0].interest)}.`, `רכב: נכס ${fmt(P_CONTRACT_B.cost)}, פחת ${fmt(P_CONTRACT_B.rows[0].depreciation)}, ריבית ${fmt(P_CONTRACT_B.rows[0].interest)}.`, "תחזוקה: 16,000, הוצאה רגילה.", `סך הכול: ${fmt(P_CONTRACT_A.rows[0].depreciation + P_CONTRACT_A.rows[0].interest)} + ${fmt(P_CONTRACT_B.rows[0].depreciation + P_CONTRACT_B.rows[0].interest)} + 16,000 = ${fmt(P_CONTRACT_A.rows[0].depreciation + P_CONTRACT_A.rows[0].interest + P_CONTRACT_B.rows[0].depreciation + P_CONTRACT_B.rows[0].interest + 16_000)}`],
    trap: "להוון את כל 96,000. התחזוקה אינה חכירה, ולכן היא לא בהתחייבות ולא בנכס.",
    level: 3,
    source: "בהשראת הרצאה",
    ref: "סעיפים 12, 13, 38",
  }),
  askNumber({
    id: "what-if-option",
    skill: "פחת",
    prompt: "חברה חכרה מכונה ל-4 שנים, ב-55,000 ש״ח בסוף כל שנה, בריבית 6%. אורך החיים 7 שנים, והפחת בקו ישר. נדרש: בכמה גבוהה יתרת נכס זכות השימוש ב-31.12 של השנה השנייה, אם ודאי באופן סביר שהחברה תממש בסוף התקופה אופציית רכישה ב-8,000 ש״ח, לעומת מצב שאין בו אופציה?",
    answer: P_OPT.rows[1].rightOfUse - P_NOOPT.rows[1].rightOfUse,
    steps: [`עם אופציה: עלות ${fmt(P_OPT.cost)}, פחת על פני 7 שנים. אחרי שנתיים: ${fmt(P_OPT.rows[1].rightOfUse)}`, `בלי אופציה: עלות ${fmt(P_NOOPT.cost)}, פחת על פני 4 שנים. אחרי שנתיים: ${fmt(P_NOOPT.rows[1].rightOfUse)}`, `${fmt(P_OPT.rows[1].rightOfUse)} − ${fmt(P_NOOPT.rows[1].rightOfUse)} = ${fmt(P_OPT.rows[1].rightOfUse - P_NOOPT.rows[1].rightOfUse)}`],
    trap: "לשנות רק את העלות. האופציה משנה גם את תקופת הפחת.",
    level: 3,
    source: "מקורית",
    ref: "סעיפים 27(ד), 32",
  }),
  Object.assign(
    journal(
      "year-end",
      "פקודת יומן",
      `חברה חכרה נכס ל-5 שנים, ב-25,000 ש״ח בסוף כל שנה, בריבית 6%. רשמו את פקודת היומן לריבית ולתשלום ב-31.12 של השנה הראשונה.`,
      [
        { account: "הוצאות מימון", dr: P_JOURNAL.rows[0].interest },
        { account: "התחייבות חכירה", dr: 25_000 - P_JOURNAL.rows[0].interest },
        { account: "מזומן", cr: 25_000 },
      ],
      `הריבית: ${fmt(P_JOURNAL.rows[0].opening)} × 0.06 = ${fmt(P_JOURNAL.rows[0].interest)}. שאר התשלום מקטין את הקרן. מלכודת נפוצה: לרשום את כל התשלום כהוצאה.`,
      ["הוצאות מימון", "התחייבות חכירה", "מזומן", "הוצאות חכירה", "נכס זכות שימוש"],
    ),
    { meta: { level: 2 as const, source: "בהשראת הרצאה" as const, ref: "סעיף 36" } },
  ),
  Object.assign(
    journal(
      "dep-entry",
      "פקודת יומן",
      `עלות נכס זכות השימוש של חברה היא ${fmt(P_JOURNAL.cost)} ש״ח, תקופת החכירה 5 שנים, ואורך החיים 9 שנים. הנכס חוזר למחכיר בסוף. הפחת בקו ישר. רשמו את פקודת הפחת של השנה.`,
      [
        { account: "הוצאות פחת", dr: P_JOURNAL.rows[0].depreciation },
        { account: "פחת נצבר", cr: P_JOURNAL.rows[0].depreciation },
      ],
      `הקצר מבין החיים והתקופה הוא 5 שנים: ${fmt(P_JOURNAL.cost)} ÷ 5 = ${fmt(P_JOURNAL.rows[0].depreciation)}. מלכודת נפוצה: לזכות את התחייבות החכירה. הפחת נוגע לנכס, ולא לחוב.`,
      ["הוצאות פחת", "פחת נצבר", "התחייבות חכירה", "מזומן", "הוצאות מימון"],
    ),
    { meta: { level: 1 as const, source: "בהשראת הרצאה" as const, ref: "סעיפים 30, 32" } },
  ),
];

const traps: Trap[] = [
  {
    id: "payment-expense",
    prompt: "החוכר שילם השנה 30,000 ש״ח. מה מהסכום הזה מופיע כהוצאה בדוח רווח או הפסד?",
    options: ["שום דבר ישירות: התשלום מקטין את ההתחייבות, וההוצאות הן ריבית ופחת", "כל 30,000 ש״ח", "רק החלק של הקרן", "כל 30,000 ש״ח, ובנוסף ריבית ופחת"],
    answer: 0,
    why: "סעיף 36(ב): התשלום מקטין את הערך בספרים של ההתחייבות. ברווח או הפסד יש ריבית (סעיף 38) ופחת.",
    traps: ["", "זה הטיפול בהקלות בלבד. במודל המלא התשלום אינו הוצאה.", "הקרן היא בדיוק החלק שבוודאי אינו הוצאה: היא מקטינה חוב.", "זה רישום כפול: העלות כבר נכנסת דרך הפחת והריבית."],
  },
  {
    id: "start-base",
    prompt: "תשלום בתחילת שנה. יתרת ההתחייבות ב-31.12 הייתה 120,000 ש״ח, וב-1.1 שולמו 30,000 ש״ח. הריבית 5%. על איזה סכום מחשבים את ריבית השנה?",
    options: ["90,000 ש״ח, היתרה אחרי התשלום", "120,000 ש״ח, היתרה לפני התשלום", "150,000 ש״ח", "105,000 ש״ח, ממוצע"],
    answer: 0,
    why: "סעיף 37: ריבית על היתרה הנותרת. הכסף יצא כבר ב-1.1, ולכן הוא לא חוב במהלך השנה.",
    traps: ["", "זו היתרה רק ליום אחד. כל השנה החוב קטן יותר.", "הוספת את התשלום במקום להפחית אותו.", "התשלום יצא ביום הראשון, ולכן אין סיבה לממוצע."],
  },
  {
    id: "other-models",
    prompt: "לחברה נכס זכות שימוש שהוא מבנה להשכרה, והיא מודדת את כל הנדל״ן להשקעה שלה בשווי הוגן. איך היא מודדת את הנכס הזה?",
    options: ["בשווי הוגן, ומציגה אותו כנדל״ן להשקעה", "במודל עלות בלבד", "לפי בחירה, לכל נכס בנפרד", "במודל הערכה מחדש של IAS 16"],
    answer: 0,
    why: "סעיף 34: אם החוכר מיישם שווי הוגן על נדל״ן להשקעה, הוא חייב ליישם אותו גם על נכסי זכות שימוש שעונים להגדרה. סעיף 48: הם מוצגים כנדל״ן להשקעה.",
    traps: ["", "מודל העלות הוא ברירת המחדל, אבל סעיף 34 מחייב אחרת כאן.", "כאן אין בחירה לכל נכס.", "זה סעיף 35, על קבוצה של רכוש קבוע."],
  },
  {
    id: "interest-apart",
    prompt: "חברה רוצה להציג שורה אחת ״הוצאות חכירה״ בדוח רווח או הפסד, שכוללת גם ריבית וגם פחת. מה הבעיה?",
    options: ["צריך להציג את הריבית בנפרד מהפחת", "אין בעיה, אם מסבירים בביאור", "צריך להציג רק ריבית", "צריך להציג אותן בדוח על המצב הכספי"],
    answer: 0,
    why: "סעיף 49: הריבית על התחייבות החכירה מוצגת בנפרד מהפחת, כי היא רכיב של עלויות מימון.",
    traps: ["", "בנכס ובהתחייבות הביאור מספיק (סעיף 47). בריבית ובפחת לא.", "גם הפחת הוא הוצאה.", "ריבית ופחת הם סעיפים של רווח או הפסד."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const SUBSEQUENT_TAUGHT: Record<string, string> = {
  "int-end": "ls-sub-end",
  "close-end": "ls-sub-end",
  "int-start": "ls-sub-start",
  "int-start-y2": "ls-sub-start",
  "close-y2-end": "ls-sub-end",
  "dep-no-option": "ls-sub-dep",
  "dep-option": "ls-sub-dep",
  "dep-life-short": "ls-sub-dep",
  "nc-end": "ls-sub-current",
  "nc-start": "ls-sub-current",
  "all-current": "ls-sub-current",
  "sales-exp": "ls-sub-other",
  "pl-total": "ls-sub-show",
  "in-kind": "ls-sub-other",
  "short-option": "ls-sub-short",
  "short-class": "ls-sub-short",
  "low-car": "ls-sub-low",
  line: "ls-sub-line",
  cash: "ls-sub-cash",
  "relief-change": "ls-sub-short",
  "line-diff": "ls-sub-line",
  "contract-y1": "ls-sub-show",
  "what-if-option": "ls-sub-dep",
  "year-end": "ls-sub-end",
  "dep-entry": "ls-sub-dep",
  "payment-expense": "ls-sub-hook",
  "start-base": "ls-sub-start",
  "other-models": "ls-sub-models",
  "interest-apart": "ls-sub-show",
};

/** Lesson 4: the lessee after the first day. The two cycles, the statements, and the two reliefs. Changes to a lease come in lesson 5. */
export const SUBSEQUENT: StudyModule = {
  slug: "ifrs16-subsequent",
  course: COURSE,
  n: 4,
  title: "חוכר: מדידה עוקבת והקלות",
  description: "אחרי היום הראשון ההתחייבות יורדת בתשלומים והנכס יורד בפחת. שנה אחרי שנה, עד הדוחות הכספיים, ומתי אפשר לוותר על כל זה בזכות ההקלות.",
  goal: "ללכת עם חכירה שנה אחרי שנה, ולהציג אותה בדוחות הכספיים.",
  outcomes: [
    "לבנות את מעגל ההתחייבות, בתשלום בסוף שנה ובתחילת שנה",
    "לקבוע על פני כמה שנים מפחיתים את הנכס",
    "לחלק את ההתחייבות לשוטף ולא שוטף",
    "להציג את החכירה בדוח רווח או הפסד, בדוח על המצב הכספי ובדוח על תזרימי המזומנים",
    "לזהות תשלומים שעוברים ישר לרווח או הפסד",
    "להחליט מתי אפשר ליישם את ההקלות, ולחשב הוצאה בקו ישר",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-sub-hook", title: "אחרי היום הראשון: שני מעגלים" },
    { id: "ls-sub-end", title: "מעגל ההתחייבות: תשלום בסוף שנה" },
    { id: "ls-sub-start", title: "תשלום בתחילת שנה: ריבית אחרי התשלום" },
    { id: "ls-sub-dep", title: "מעגל הנכס: על פני כמה שנים מפחיתים" },
    { id: "ls-sub-models", title: "מודלים אחרים למדידת הנכס" },
    { id: "ls-sub-current", title: "שוטף ולא שוטף" },
    { id: "ls-sub-lab", title: "מעבדה: חכירה שנה אחרי שנה" },
    { id: "ls-sub-other", title: "מה עובר ישר לרווח או הפסד" },
    { id: "ls-sub-show", title: "איך זה נראה בדוחות" },
    { id: "ls-sub-worked", title: "דוגמה פתורה: מהחוזה ועד הדוחות" },
    { id: "ls-sub-fill", title: "עכשיו אתם: דוחות למילוי" },
    { id: "ls-sub-short", title: "הקלה: חכירה לטווח קצר" },
    { id: "ls-sub-low", title: "הקלה: נכס בעל ערך נמוך" },
    { id: "ls-sub-line", title: "מה עושים בהקלה: הוצאה בקו ישר" },
    { id: "ls-sub-cash", title: "הדוח על תזרימי המזומנים" },
    { id: "ls-sub-drill", title: "מתרגלים: מספרים חדשים בכל פעם" },
    { id: "ls-sub-mistake", title: "מצאו את הטעות" },
    { id: "ls-sub-master", title: "שאלה מסכמת: חוזה עם שני כלים ותחזוקה" },
  ],
  exercises,
  traps,
  tips: [
    "תשלום אינו הוצאה: הוא מקטין את ההתחייבות. ההוצאות הן ריבית ופחת.",
    "תשלום בסוף שנה: פתיחה + ריבית − תשלום = סגירה.",
    "תשלום בתחילת שנה: הריבית על היתרה אחרי התשלום.",
    "פחת: אם החוכר יקבל את הנכס, לאורך החיים. אחרת, הקצר מבין החיים והתקופה.",
    "לא שוטף, תשלום בסוף שנה: היתרה של סוף השנה הבאה.",
    "לא שוטף, תשלום בתחילת שנה: היתרה פחות התשלום הבא. לא נשאר תשלום מעבר ל-12 חודשים? הכול שוטף.",
    "תשלום לפי מכירות, תחזוקה וביטוח: הוצאה בשנה שאליה הם שייכים.",
    "טווח קצר: עד 12 חודשים, בלי אופציית רכישה, לפי קבוצה.",
    "ערך נמוך: לכל חכירה, לפי נכס חדש, בלי קשר לגודל החוכר.",
    "תזרים: קרן במימון. ריבית לפי IAS 7. הקלות ומשתנים בשוטפת.",
  ],
};
