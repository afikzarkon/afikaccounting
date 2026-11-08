import { lessee, pvEnd, pvStart, rateFor } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";

const r = Math.round;

/** The present value screen: four payments at each year's end. */
export const PV_EX = { payment: 30_000, years: 4, rate: 0.07 };
export const PV_EX_END = pvEnd(PV_EX.rate, PV_EX.years, PV_EX.payment);
export const PV_EX_GROSS = pvStart(PV_EX.rate, PV_EX.years, PV_EX.payment);
export const PV_EX_NET = PV_EX_GROSS - PV_EX.payment;

/** The guarantee screen. */
export const GUAR = { payment: 26_000, years: 5, rate: 0.06, guarantee: 20_000, expected: 12_000 };
export const GUAR_SHORTFALL = GUAR.guarantee - GUAR.expected;
export const GUAR_WITH = pvEnd(GUAR.rate, GUAR.years, GUAR.payment, GUAR_SHORTFALL);
export const GUAR_WITHOUT = pvEnd(GUAR.rate, GUAR.years, GUAR.payment);

/** The implicit rate screen: the same lease, from a lessor who is a dealer and from one who isn't. */
export const IMPLICIT = { fairValue: 150_000, lessorCosts: 4_000, payment: 30_000, years: 5, guaranteed: 25_000, residual: 32_000 };
export const IMPLICIT_RATE = rateFor(IMPLICIT.fairValue + IMPLICIT.lessorCosts, IMPLICIT.years, IMPLICIT.payment, IMPLICIT.residual);
export const IMPLICIT_RATE_DEALER = rateFor(IMPLICIT.fairValue, IMPLICIT.years, IMPLICIT.payment, IMPLICIT.residual);
export const IMPLICIT_LIABILITY = pvEnd(IMPLICIT_RATE, IMPLICIT.years, IMPLICIT.payment);
export const IMPLICIT_LIABILITY_DEALER = pvEnd(IMPLICIT_RATE_DEALER, IMPLICIT.years, IMPLICIT.payment);

/** First worked example: a warehouse paid in advance, with costs the lessor partly covers and a renovation that is no incentive. */
export const WORK1 = { payment: 42_000, years: 8, rate: 0.055, previousTenant: 12_000, lawyer: 6_000, reimbursed: 6_000, renovation: 9_000 };
export const WORK1_L = lessee({ payment: WORK1.payment, years: WORK1.years, rate: WORK1.rate, timing: "start", directCosts: WORK1.previousTenant + WORK1.lawyer, incentives: WORK1.reimbursed });

/** Second worked example: a purchase option that will be used, and an incentive that comes as a free year of insurance. */
export const WORK2 = { payment: 64_000, years: 4, rate: 0.06, option: 12_000, insurance: 3_000, fees: 2_000 };
export const WORK2_L = lessee({ payment: WORK2.payment, years: WORK2.years, rate: WORK2.rate, timing: "start", finalAmount: WORK2.option, incentives: WORK2.insurance, directCosts: WORK2.fees });

/** The closing question. */
export const MASTER = { payment: 90_000, years: 6, optionYears: 2, optionPayment: 95_000, rate: 0.05, prepaid: 15_000, incentive: 10_000, broker: 8_000, lawyer: 4_000, manager: 3_000, restore: 40_000, restoreRate: 0.04, sales: 1 };
export const MASTER_RESTORE = MASTER.restore / (1 + MASTER.restoreRate) ** MASTER.years;
export const MASTER_L = lessee({ payment: MASTER.payment, years: MASTER.years, rate: MASTER.rate, timing: "start", prepaid: MASTER.prepaid, incentives: MASTER.incentive, directCosts: MASTER.broker + MASTER.lawyer, restoration: MASTER_RESTORE });
export const MASTER_NET = MASTER_L.liability - MASTER.payment;
export const MASTER_CASH = MASTER.payment + MASTER.prepaid - MASTER.incentive + MASTER.broker + MASTER.lawyer;
/** The cost as the solution adds it up, from its rounded lines, so that its table and its entry balance. */
export const MASTER_COST_SHOWN = r(MASTER_NET) + r(MASTER_RESTORE) + MASTER_CASH;

/** What goes into the liability, to sort. */
export const PAYMENT_ITEMS: { text: string; answer: "in" | "out"; why: string }[] = [
  { text: "דמי חכירה קבועים של כל שנה בתקופת החכירה.", answer: "in", why: "תשלום קבוע (סעיף 27(א))." },
  { text: "תשלום שצמוד למדד, לפי המדד של מועד התחילה.", answer: "in", why: "משתנה שתלוי במדד נכלל, לפי המדד הקיים (סעיף 27(ב))." },
  { text: "5% מהמכירות של החנות בכל שנה.", answer: "out", why: "משתנה שלא תלוי במדד או בשער אינו נכלל. הוא הוצאה כשהוא מתהווה (סעיף 38(ב))." },
  { text: "מחיר אופציית רכישה, כשוודאי באופן סביר שתמומש.", answer: "in", why: "סעיף 27(ד)." },
  { text: "מחיר אופציית רכישה שלא ודאי שתמומש.", answer: "out", why: "נכלל רק אם ודאי באופן סביר שתמומש." },
  { text: "קנס ביטול, כשתקופת החכירה מניחה שהחוכר יבטל.", answer: "in", why: "סעיף 27(ה): התקופה מניחה ביטול, ולכן גם הקנס צפוי." },
  { text: "סכום שהחוכר צופה לשלם בגלל ערבות לערך שייר.", answer: "in", why: "סעיף 27(ג): רק הסכום שהוא צופה לשלם." },
  { text: "דמי חכירה בתקופת אופציית הארכה שלא נספרה בתקופה.", answer: "out", why: "אם האופציה לא בתקופה, גם התשלומים שלה לא נכללים." },
];
export const PAYMENT_OPTIONS: [string, string][] = [
  ["in", "נכלל בהתחייבות"],
  ["out", "לא נכלל"],
];

const P1 = pvEnd(0.045, 6, 18_000);
const P2 = pvStart(0.06, 5, 24_000) - 24_000;
const P2_GROSS = pvStart(0.06, 5, 24_000);
const P3 = pvEnd(0.08, 4, 15_000, 9_000);
const P4 = pvEnd(0.05, 3, 20_000, 6_000);
const P5 = pvEnd(0.07, 3, 22_000, 5_000);
const P7 = pvEnd(0.05, 5, 12_000);
const P8 = lessee({ payment: 35_000, years: 4, rate: 0.06, timing: "start", incentives: 2_000, directCosts: 1_500 });
const P9 = pvEnd(0.055, 4, 25_000);
const P10_RESTORE = 18_000 / 1.05 ** 5;
const P10 = pvEnd(0.05, 5, 28_000) + P10_RESTORE;
const P11_RATE = rateFor(103_000, 4, 27_000, 20_000);
const P11 = pvEnd(P11_RATE, 4, 27_000);

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  askNumber({
    id: "pv-end",
    skill: "ערך נוכחי",
    prompt: "חברה חכרה נכס ל-6 שנים, ב-18,000 ש״ח בסוף כל שנה. הריבית התוספתית 4.5%. מהי התחייבות החכירה במועד התחילה?",
    answer: r(P1),
    steps: [`תשלום × (1 − (1 + i)^(−n)) ÷ i = התחייבות\n18,000 × (1 − 1.045^(−6)) ÷ 0.045 = ${fmt(r(P1))}`, `באקסל: =PV(4.5%;6;-18000) → ${fmt(r(P1))}`],
    trap: "לחבר את התשלומים בלי להוון. ההתחייבות היא ערך נוכחי, לא סכום.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 26",
  }),
  ask({
    id: "which-in",
    skill: "תשלומי חכירה",
    prompt: "חנות משלמת 200,000 ש״ח קבועים לשנה, ועוד 3% מהמכירות. מה נכנס להתחייבות החכירה?",
    options: ["רק התשלום הקבוע", "הקבוע ואומדן של 3% מהמכירות", "רק 3% מהמכירות", "שום דבר, כי יש רכיב משתנה"],
    answer: 0,
    why: "משתנה שתלוי במכירות אינו תשלום חכירה (סעיף 27). הוא נרשם כהוצאה כשהמכירות קורות (סעיף 38(ב)).",
    trap: "לאמוד את המכירות העתידיות ולהוון אותן. התקן לא מכניס אותן להתחייבות.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "סעיפים 27, 38(ב)",
  }),
  askNumber({
    id: "start-net",
    skill: "תשלום בתחילת שנה",
    prompt: "חברה חכרה נכס ל-5 שנים, ב-24,000 ש״ח בתחילת כל שנה. התשלום הראשון שולם במועד התחילה. הריבית 6%. מהי התחייבות החכירה מיד אחרי התשלום הראשון?",
    answer: r(P2),
    steps: [`נשארו 4 תשלומים, הראשון בעוד שנה (סעיף 26: רק מה שלא שולם).\n24,000 × (1 − 1.06^(−4)) ÷ 0.06 = ${fmt(r(P2))}`, `באקסל: =PV(6%;4;-24000) → ${fmt(r(P2))}`],
    trap: "להשתמש ב-5 תקופות. התשלום של היום כבר שולם.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 26",
  }),
  askNumber({
    id: "index-today",
    skill: "תשלום צמוד מדד",
    prompt: "חברה חכרה נכס ל-5 שנים, ב-12,000 ש״ח בסוף כל שנה, צמוד למדד. המדד היום 100, והחברה צופה שיעלה ב-2% בשנה. הריבית 5%. מהי ההתחייבות במועד התחילה?",
    answer: r(P7),
    steps: [`משתמשים במדד של מועד התחילה, בלי תחזית (סעיף 27(ב)).\n12,000 × (1 − 1.05^(−5)) ÷ 0.05 = ${fmt(r(P7))}`],
    trap: "להכניס את עליית המדד הצפויה. מעדכנים רק כשהמדד משתנה בפועל.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 27(ב)",
  }),
  askNumber({
    id: "guarantee",
    skill: "ערבות שייר",
    prompt: "חברה חכרה מכונה ל-4 שנים, ב-15,000 ש״ח בסוף כל שנה, בריבית 8%. היא ערבה לערך שייר של 30,000 ש״ח ומשלימה הפרש במזומן. היא צופה שהערך יהיה 21,000 ש״ח. מהי ההתחייבות במועד התחילה?",
    answer: r(P3),
    steps: [`ערבות − ערך צפוי = סכום צפוי\n30,000 − 21,000 = 9,000`, `15,000 × (1 − 1.08^(−4)) ÷ 0.08 + 9,000 ÷ 1.08^4 = ${fmt(r(P3))}`, `באקסל: =PV(8%;4;-15000;-9000) → ${fmt(r(P3))}`],
    trap: "להוון 30,000. החוכר מכניס רק את מה שהוא צופה לשלם.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 27(ג)",
  }),
  askNumber({
    id: "option-price",
    skill: "אופציית רכישה",
    prompt: "חברה חכרה רכב ל-3 שנים, ב-20,000 ש״ח בסוף כל שנה, בריבית 5%. בסוף התקופה תוכל לקנות אותו ב-6,000 ש״ח, מחיר נמוך בהרבה משוויו הצפוי. מהי ההתחייבות במועד התחילה?",
    answer: r(P4),
    steps: [`מחיר נמוך בהרבה מהשווי, ולכן ודאי באופן סביר שתמומש, והיא נכללת (סעיף 27(ד)).\n20,000 × (1 − 1.05^(−3)) ÷ 0.05 + 6,000 ÷ 1.05^3 = ${fmt(r(P4))}`],
    trap: "לשכוח את מחיר האופציה, כי הוא לא ״דמי חכירה״.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 27(ד)",
  }),
  askNumber({
    id: "penalty",
    skill: "קנס ביטול",
    prompt: "חוזה ל-6 שנים. החברה קבעה תקופת חכירה של 3 שנים, כי ודאי באופן סביר שתבטל אז בקנס של 5,000 ש״ח. התשלום 22,000 ש״ח בסוף כל שנה, והריבית 7%. מהי ההתחייבות במועד התחילה?",
    answer: r(P5),
    steps: [`התקופה מניחה ביטול, ולכן הקנס נכלל (סעיף 27(ה)).\n22,000 × (1 − 1.07^(−3)) ÷ 0.07 + 5,000 ÷ 1.07^3 = ${fmt(r(P5))}`],
    trap: "להוון 6 שנים, או לשכוח את הקנס. התקופה והתשלומים הולכים יחד.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 27(ה)",
  }),
  askNumber({
    id: "minimum",
    skill: "קבוע במהותו",
    prompt: "החוכר ישלם בסוף כל שנה את הגבוה מבין 25,000 ש״ח ו-3% מהמכירות, ל-4 שנים. הריבית 5.5%. מהי ההתחייבות במועד התחילה?",
    answer: r(P9),
    steps: [`25,000 הוא הסכום שבלתי נמנע, ולכן הוא תשלום החכירה (ב42). החלק שמעליו תלוי במכירות.\n25,000 × (1 − 1.055^(−4)) ÷ 0.055 = ${fmt(r(P9))}`],
    trap: "לומר שכל התשלום משתנה ולכן אין התחייבות. הרצפה קבועה במהותה.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "ב42",
  }),
  ask({
    id: "sham",
    skill: "קבוע במהותו",
    prompt: "החוזה קובע: ״50,000 ש״ח בשנה, רק אם המכונה תקינה״. המכונה חדשה, ואין סיכוי ממשי שלא תהיה תקינה. איך מטפלים בתשלום?",
    options: ["כתשלום קבוע במהותו, שנכלל בהתחייבות", "כתשלום משתנה שלא נכלל", "כהוצאה רק כשהמכונה פועלת", "כרכיב שאינו חכירה"],
    answer: 0,
    why: "ב42(א)(i): תשלום שתלוי באירוע בלי אפשרות אמיתית שלא יתרחש הוא בלתי נמנע במהותו.",
    trap: "ללכת אחרי הניסוח. בודקים אם יש השתנות אמיתית.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "ב42(א)",
  }),
  askNumber({
    id: "rou-sum",
    skill: "עלות הנכס",
    prompt: "התחייבות החכירה 100,000 ש״ח. לפני התחילה שולמה מקדמה של 7,000 ש״ח. המחכיר נתן תמריץ של 4,000 ש״ח. העלויות הישירות הראשוניות 3,000 ש״ח, והערך הנוכחי של הפירוק 6,000 ש״ח. מהי עלות הנכס?",
    answer: 112_000,
    steps: ["התחייבות + מקדמות − תמריצים + עלויות ישירות + פירוק = עלות\n100,000 + 7,000 − 4,000 + 3,000 + 6,000 = 112,000"],
    trap: "להוסיף את התמריץ. הוא מקטין את העלות.",
    level: 1,
    source: "בהשראת הרצאה",
    ref: "סעיף 24",
  }),
  askNumber({
    id: "rou-start",
    skill: "עלות הנכס",
    prompt: "חברה חכרה נכס ל-4 שנים, ב-35,000 ש״ח בתחילת כל שנה, בריבית 6%. התשלום הראשון שולם במועד התחילה. התקבל תמריץ של 2,000 ש״ח, ושולמו עלויות ישירות של 1,500 ש״ח. מהי עלות נכס זכות השימוש?",
    answer: r(P8.cost),
    steps: [`35,000 × (1 − 1.06^(−3)) ÷ 0.06 = ${fmt(r(P8.liability - 35_000))} (התחייבות)`, `התחייבות + תשלום שבוצע − תמריץ + עלויות ישירות = עלות\n${fmt(r(P8.liability - 35_000))} + 35,000 − 2,000 + 1,500 = ${fmt(r(P8.cost))}`],
    trap: "לשכוח את התשלום הראשון. הוא לא בהתחייבות, אבל הוא חלק מעלות הנכס.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "סעיף 24",
  }),
  ask({
    id: "direct-costs",
    skill: "עלויות ישירות",
    prompt: "איזו מהעלויות הבאות היא עלות ישירה ראשונית של חוכר?",
    options: ["עמלת מתווך שמשולמת רק אם החוזה נחתם", "שכר מנהל הנדל״ן הקבוע של החברה", "שכר דירה של השנה שעברה", "קנס על חוזה ישן שהחברה הייתה משלמת בכל מקרה"],
    answer: 0,
    why: "עלות ישירה ראשונית היא עלות תוספתית, שלא הייתה מתהווה אם החכירה לא הייתה מושגת (נספח א׳).",
    trap: "לכלול שכר קבוע. הוא היה משולם גם בלי החוזה.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "נספח א׳",
  }),
  ask({
    id: "lessor-renovates",
    skill: "תמריצים",
    prompt: "כדי לעודד את החוכר, המחכיר משפץ את המבנה שלו על חשבונו, ב-30,000 ש״ח. מה עושה החוכר?",
    options: ["כלום. המחכיר משפר נכס שלו, וזה אינו תמריץ", "מקטין את עלות הנכס ב-30,000 ש״ח", "מגדיל את עלות הנכס ב-30,000 ש״ח", "רושם הכנסה של 30,000 ש״ח"],
    answer: 0,
    why: "תמריץ הוא תשלום לחוכר, או שיפוי או נטילה של עלויות שלו (נספח א׳). שיפוץ של המחכיר בנכס שלו אינו אף אחד מהם.",
    trap: "לראות כל הטבה כתמריץ. שואלים אם המחכיר שילם עלות של החוכר.",
    level: 2,
    source: "בהשראת הרצאה",
    ref: "נספח א׳",
  }),
  askNumber({
    id: "restore-rou",
    skill: "עלות הנכס",
    prompt: "חברה חכרה נכס ל-5 שנים, ב-28,000 ש״ח בסוף כל שנה, בריבית 5%. בסוף התקופה עליה לפנות את הנכס, בעלות צפויה של 18,000 ש״ח. נניח שגם את הפירוק מהוונים ב-5%. מהי עלות נכס זכות השימוש?",
    answer: r(P10),
    steps: [`28,000 × (1 − 1.05^(−5)) ÷ 0.05 = ${fmt(r(pvEnd(0.05, 5, 28_000)))} (התחייבות)`, `18,000 ÷ 1.05^5 = ${fmt(r(P10_RESTORE))} (הפרשה לפירוק)`, `עלות הנכס: ${fmt(r(pvEnd(0.05, 5, 28_000)))} + ${fmt(r(P10_RESTORE))} = ${fmt(r(P10))}`],
    trap: "להכניס את הפירוק להתחייבות החכירה. הוא הפרשה נפרדת לפי IAS 37, אבל נכנס לעלות הנכס.",
    level: 3,
    source: "בהשראת הרצאה",
    ref: "סעיפים 24(ד), 25",
  }),
  askNumber({
    id: "implicit",
    skill: "ריבית גלומה",
    prompt: "מחכיר שאינו יצרן או סוחר מחכיר נכס ששוויו ההוגן 100,000 ש״ח, ועלויותיו הישירות 3,000 ש״ח. החוכר ישלם 27,000 ש״ח בסוף כל שנה, 4 שנים. המחכיר צופה ערך שייר של 20,000 ש״ח, כולו לא מובטח. הריבית הגלומה ידועה לחוכר. מהי התחייבות החכירה של החוכר?",
    answer: r(P11),
    steps: [`הריבית הגלומה: הערך הנוכחי של התשלומים והשייר שווה לשווי ההוגן ועלויות המחכיר.\n27,000 × (1 − (1 + i)^(−4)) ÷ i + 20,000 ÷ (1 + i)^4 = 103,000 → i = ${(P11_RATE * 100).toFixed(2)}%`, `באקסל: =RATE(4;27000;-103000;20000)`, `החוכר לא ערב לשייר, ולכן מהוון רק את התשלומים.\n27,000 × (1 − (1 + i)^(−4)) ÷ i = ${fmt(r(P11))}`],
    trap: "להוון גם את 20,000 אצל החוכר. השייר הלא מובטח משפיע על הריבית, אבל החוכר לא ישלם אותו.",
    level: 3,
    source: "בהשראת הרצאה",
    ref: "נספח א׳, סעיף 26",
  }),
  ask({
    id: "option-guarantee",
    skill: "ערבות שייר",
    prompt: "לחוכר יש אופציה להאריך חכירה. אם לא יאריך, הוא משלם ערבות שייר שמביאה את המחכיר בדיוק לאותה תשואה במזומן. מה מניחים?",
    options: ["שוודאי באופן סביר שיאריך", "שלא יאריך", "שאין אפשרות לקבוע את התקופה", "רק את הערבות, בלי ההארכה"],
    answer: 0,
    why: "ב38: כשהאופציה משולבת כך שהמחכיר מקבל תשואה זהה בכל מקרה, מניחים שוודאי באופן סביר שהאופציה תמומש.",
    trap: "לחפש כוונה או תמריץ נוסף. ב38 קובע הנחה.",
    level: 3,
    source: "מקורית",
    ref: "ב38",
  }),
  Object.assign(
    journal(
      "first-entry",
      "פקודת יומן",
      `חברה חכרה נכס ל-5 שנים, ב-24,000 ש״ח בתחילת כל שנה, בריבית 6%. התשלום הראשון שולם במועד התחילה. אין עלויות אחרות. רשמו את פקודת היומן במועד התחילה.`,
      [
        { account: "נכס זכות שימוש", dr: r(P2_GROSS) },
        { account: "התחייבות חכירה", cr: r(P2) },
        { account: "מזומן", cr: 24_000 },
      ],
      `ההתחייבות היא הערך הנוכחי של 4 התשלומים שנשארו: ${fmt(r(P2))}. עלות הנכס היא ההתחייבות ועוד התשלום של היום: ${fmt(r(P2_GROSS))}. מלכודת נפוצה: לרשום את התשלום של היום כהוצאה.`,
      ["נכס זכות שימוש", "התחייבות חכירה", "מזומן", "הוצאות חכירה", "הוצאות מראש"],
    ),
    { meta: { level: 2 as const, source: "בהשראת הרצאה" as const, ref: "סעיפים 24, 26" } },
  ),
];

const traps: Trap[] = [
  {
    id: "which-rate",
    prompt: "החוכר יודע את הריבית הגלומה בחכירה, 6%, והיא ניתנת לקביעה בנקל. הריבית התוספתית שלו 5%. באיזו ריבית הוא מהוון?",
    options: ["6%, הגלומה", "5%, התוספתית, כי היא נמוכה יותר", "הממוצע, 5.5%", "לפי בחירתו"],
    answer: 0,
    why: "סעיף 26: הגלומה קודמת, אם ניתן לקבוע אותה בנקל. התוספתית רק אם לא.",
    traps: ["", "לא בוחרים לפי מה שנוח. יש סדר קבוע בתקן.", "אין ממוצעים.", "אין כאן בחירה."],
  },
  {
    id: "first-payment",
    prompt: "חכירה בתשלום בתחילת שנה, והראשון שולם היום. מה נכון?",
    options: ["הוא לא בהתחייבות, והוא כן בעלות הנכס", "הוא בהתחייבות, ולא בעלות הנכס", "הוא הוצאה של היום", "הוא לא נרשם עד סוף השנה"],
    answer: 0,
    why: "סעיף 26: ההתחייבות היא רק על מה שלא שולם. סעיף 24(ב): תשלום שבוצע במועד התחילה נכנס לעלות.",
    traps: ["", "הפוך: מה ששולם כבר לא חוב, אבל הוא חלק ממה שעלה הנכס.", "השימוש עוד לפניך, ולכן זו לא הוצאה של היום.", "הכסף יצא היום, ונרשם היום."],
  },
  {
    id: "guarantee-whole",
    prompt: "החוכר ערב לערך שייר של 40,000 ש״ח, וצופה שהנכס יהיה שווה 50,000 ש״ח בסוף. מה הוא מכניס להתחייבות בגין הערבות?",
    options: ["כלום, כי הוא לא צופה לשלם", "40,000 ש״ח מהוונים", "10,000 ש״ח מהוונים", "50,000 ש״ח מהוונים"],
    answer: 0,
    why: "סעיף 27(ג): רק סכומים שהחוכר צופה לשלם. הערך הצפוי גבוה מהערבות, ולכן אין תשלום צפוי.",
    traps: ["", "זה מה שהמחכיר מכניס אצלו. החוכר מכניס רק את הצפוי.", "10,000 הוא העודף, ולא משלמים עליו.", "הנכס חוזר למחכיר, והחוכר לא משלם את שוויו."],
  },
  {
    id: "tailoring",
    prompt: "החוכר משלם על התכנון וההקמה של מבנה שיתאים לו, לפני מועד התחילה. התשלום אינו עבור הזכות להשתמש. איך מטפלים?",
    options: ["לפי תקן אחר, כמו IAS 16, ולא כחלק מתשלומי החכירה", "מוסיפים לתשלומי החכירה", "מקטינים את עלות נכס זכות השימוש", "הוצאה מיידית תמיד"],
    answer: 0,
    why: "ב44: עלויות הקמה או תכנון של נכס הבסיס מטופלות לפי תקנים אחרים, כמו IAS 16.",
    traps: ["", "תשלום על הקמה אינו תשלום על זכות שימוש.", "זה לא תמריץ. החוכר הוא שמשלם.", "הטיפול נקבע לפי התקן הרלוונטי, ולא תמיד הוצאה."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const MEASURE_TAUGHT: Record<string, string> = {
  "pv-end": "ls-meas-pv",
  "which-in": "ls-meas-what",
  "start-net": "ls-meas-start",
  "index-today": "ls-meas-index",
  guarantee: "ls-meas-guarantee",
  "option-price": "ls-meas-what",
  penalty: "ls-meas-what",
  minimum: "ls-meas-fixed",
  sham: "ls-meas-fixed",
  "rou-sum": "ls-meas-cost",
  "rou-start": "ls-meas-cost",
  "direct-costs": "ls-meas-parts",
  "lessor-renovates": "ls-meas-parts",
  "restore-rou": "ls-meas-parts",
  implicit: "ls-meas-implicit",
  "option-guarantee": "ls-meas-guarantee",
  "first-entry": "ls-meas-cost",
  "which-rate": "ls-meas-rate",
  "first-payment": "ls-meas-start",
  "guarantee-whole": "ls-meas-guarantee",
  tailoring: "ls-meas-parts",
};

/** Lesson 3: the lessee on commencement. The liability and the asset, and nothing after that day: depreciation and interest come in lesson 4. */
export const MEASURE: StudyModule = {
  slug: "ifrs16-measure",
  course: COURSE,
  n: 3,
  title: "חוכר: מדידה לראשונה",
  description: "ביום הראשון של החכירה נרשמים שני דברים: התחייבות ונכס. מה נכנס לתשלומי החכירה, באיזו ריבית מהוונים, ומה מרכיב את עלות נכס זכות השימוש.",
  goal: "לחשב את התחייבות החכירה ואת עלות נכס זכות השימוש במועד התחילה, ולרשום את פקודת היומן.",
  outcomes: [
    "להחליט מה נכנס לתשלומי החכירה, ומה לא",
    "לטפל במדד, בערבות שייר, באופציית רכישה ובקנס ביטול",
    "לבחור שיעור היוון, ולהבין איך בנויה הריבית הגלומה",
    "לחשב התחייבות בתשלום בסוף שנה ובתחילת שנה",
    "לבנות את עלות הנכס מחמשת מרכיביה",
    "לרשום את פקודת היומן של היום הראשון",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-meas-hook", title: "יום ראשון: התחייבות ונכס" },
    { id: "ls-meas-pv", title: "תזכורת: ערך נוכחי של סדרת תשלומים" },
    { id: "ls-meas-what", title: "מה נכנס לתשלומי החכירה" },
    { id: "ls-meas-index", title: "תשלום צמוד מדד: לפי היום" },
    { id: "ls-meas-fixed", title: "קבוע במהותו" },
    { id: "ls-meas-guarantee", title: "ערבות שייר: רק מה שצפוי" },
    { id: "ls-meas-rate", title: "איזו ריבית" },
    { id: "ls-meas-implicit", title: "איך בנויה הריבית הגלומה" },
    { id: "ls-meas-start", title: "תשלום בתחילת שנה" },
    { id: "ls-meas-cost", title: "עלות הנכס: בונים אותה" },
    { id: "ls-meas-parts", title: "מה נחשב תמריץ, עלות ישירה ופירוק" },
    { id: "ls-meas-worked", title: "שתי דוגמאות פתורות" },
    { id: "ls-meas-drill", title: "מתרגלים: מספרים חדשים בכל פעם" },
    { id: "ls-meas-mistake", title: "מצאו את הטעות" },
    { id: "ls-meas-master", title: "שאלה מסכמת: היום הראשון של חכירה" },
  ],
  exercises,
  traps,
  tips: [
    "התחייבות החכירה היא הערך הנוכחי של התשלומים שעוד לא שולמו.",
    "נכנסים: קבועים, צמודי מדד לפי היום, אופציית רכישה ודאית, קנס אם התקופה מניחה ביטול, וערבות רק בסכום שצפוי.",
    "לא נכנסים: תשלומים לפי מכירות או שימוש. הם הוצאה כשהם קורים.",
    "ריבית: גלומה אם ניתן לקבוע אותה בנקל. אחרת תוספתית.",
    "ערבות שייר: החוכר רואה רק את ההפרש הצפוי. המחכיר רואה את כולה.",
    "תשלום בתחילת שנה: הראשון לא בהתחייבות, אבל כן בעלות הנכס.",
    "עלות = התחייבות + מקדמות − תמריצים + עלויות ישירות + פירוק.",
    "פירוק הוא הפרשה לפי IAS 37. הוא נכנס לעלות הנכס, אבל לא להתחייבות החכירה.",
    "שיפוץ של המחכיר בנכס שלו אינו תמריץ.",
  ],
};
