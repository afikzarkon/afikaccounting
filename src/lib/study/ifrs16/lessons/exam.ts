import { pvEnd, rateFor } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import type { TestEnd, TestNode } from "./what";

const r = Math.round;

/** The whole standard as one walk: each end says what to do, and which lesson taught it. */
export const MAP_WALK: Record<string, TestNode | TestEnd> = {
  what: { q: "מה לפניכם?", par: "מפת התקן", help: "כל שאלה במבחן מתחילה כאן.", answers: [{ label: "חוזה חדש", to: "lease" }, { label: "חוזה קיים שמשהו בו השתנה", to: "who" }] },
  lease: { q: "יש נכס מזוהה, כל ההטבות, וזכות לכוון את השימוש?", par: "שיעור 1", help: "אם כן, מפרידים רכיבים וקובעים תקופה (שיעור 2).", answers: [{ label: "כן", to: "side" }, { label: "לא", to: "notLease" }] },
  side: { q: "מי אתם בעסקה?", par: "שיעורים 3–8", help: "לפעמים אותה חברה נמצאת בשני צדדים.", answers: [{ label: "חוכר", to: "relief" }, { label: "מחכיר", to: "land" }, { label: "חוכר שמחכיר הלאה", to: "sub" }, { label: "מוכר שחוכר בחזרה", to: "slb" }] },
  relief: { q: "טווח קצר או ערך נמוך, ובחרתם בהקלה?", par: "שיעור 4", help: "אם החכירה מיועדת לחכירת משנה, אין הקלת ערך נמוך.", answers: [{ label: "כן", to: "line" }, { label: "לא", to: "model" }] },
  land: { q: "בניין עם קרקע מהותית?", par: "שיעור 8", help: "אם כן, מפרידים או מכריעים לפני הסיווג.", answers: [{ label: "כן", to: "landEnd" }, { label: "לא", to: "risks" }] },
  risks: { q: "עברו למעשה כל הסיכונים וההטבות?", par: "שיעור 6", help: "לפי הסימנים, ביום ההתקשרות.", answers: [{ label: "כן", to: "fin" }, { label: "לא", to: "op" }] },
  who: { q: "אצל מי אתם בודקים?", par: "שיעורים 5, 7", help: "החוכר והמחכיר הולכים בדרכים שונות.", answers: [{ label: "חוכר", to: "contract" }, { label: "מחכיר", to: "lessorMod" }] },
  contract: { q: "החוזה עצמו השתנה?", par: "שיעור 5", help: "מדד, אופציה וערבות הם הערכה מחדש. שינוי בהיקף או בתמורה הוא תיקון.", answers: [{ label: "לא", to: "reassess" }, { label: "כן", to: "modify" }] },
  modify: { q: "נוסף נכס במחיר נפרד?", par: "סעיף 44", help: "אם לא, בודקים אם ההיקף קטן.", answers: [{ label: "כן", to: "separate" }, { label: "לא", to: "shrink" }] },
  shrink: { q: "ההיקף קטן?", par: "סעיף 46", help: "גם קיצור תקופה הוא הקטנה.", answers: [{ label: "כן", to: "twoSteps" }, { label: "לא", to: "remeasure" }] },
  notLease: { lease: false, verdict: "לא חכירה", why: "חוזה שירות: הוצאה כשמקבלים את השירות." },
  line: { lease: true, verdict: "הוצאה בקו ישר", why: "בלי נכס ובלי התחייבות (שיעור 4)." },
  model: { lease: true, verdict: "נכס והתחייבות", why: "ערך נוכחי של התשלומים, ואחר כך ריבית ופחת (שיעורים 3, 4)." },
  landEnd: { lease: true, verdict: "קרקע ומבנה", why: "מקצים אם אפשר. אם לא, הכול מימונית, אלא אם ברור ששניהם תפעוליים (שיעור 8)." },
  fin: { lease: true, verdict: "השקעה נטו", why: "הנכס יוצא. אצל סוחר גם מכירות ועלות מכר (שיעור 6)." },
  op: { lease: true, verdict: "הכנסה בקו ישר", why: "הנכס נשאר, והפרשים בהכנסות מראש או לקבל (שיעור 6)." },
  sub: { lease: true, verdict: "מסווגים מול זכות השימוש", why: "מימונית: הנכס יוצא וההתחייבות נשארת. תפעולית: הנכס נשאר, ובשווי הוגן עובר לנדל״ן להשקעה (שיעור 8)." },
  slb: { lease: true, verdict: "קודם: האם זו מכירה", why: "אם לא, הלוואה. אם כן, רווח רק על החלק שעבר, ותיקון לשווי הוגן (שיעור 8)." },
  lessorMod: { lease: true, verdict: "לפי הסיווג המקורי", why: "תפעולית: חכירה חדשה. מימונית: חכירה נפרדת, חכירה חדשה או IFRS 9 (שיעור 7)." },
  reassess: { lease: true, verdict: "הערכה מחדש", why: "מדד וערבות: בריבית הישנה. תקופה ואופציה: בריבית מעודכנת. ההפרש כנגד הנכס (שיעור 5)." },
  separate: { lease: true, verdict: "חכירה נפרדת", why: "החוזה הקיים לא משתנה (שיעור 5)." },
  twoSteps: { lease: true, verdict: "גריעה ואז מדידה", why: "קודם גריעה יחסית עם רווח או הפסד, אחר כך מדידה מחדש בריבית מעודכנת כנגד הנכס (שיעור 5)." },
  remeasure: { lease: true, verdict: "מדידה מחדש", why: "בריבית מעודכנת, כנגד הנכס (שיעור 5)." },
};
export const MAP_WALK_START = "what";

/** Exam A: four floors, two kinds of sublease, in months. */
export const A = { monthly: 100_000, months: 96, rate: 0.008, floors: 4, life: 30, prepaid: 420_000, prepaidMonths: 12, subMonthly: 32_000, subMonths: 66, fvApr: 5_600_000, fvJul: 6_000_000, fvDec: 6_200_000 };
export const A_L0 = r(pvEnd(A.rate, A.months, A.monthly));
export const A_FLOOR = r(A_L0 / A.floors);
export const A_FLOOR2 = r((A_FLOOR * 6) / 8);
export const A_YEAR_DEP = r(A_FLOOR2 / 6);
export const A_OPEN = r(pvEnd(A.rate, A.months - 24, A.monthly));
export const A_CLOSE = r(pvEnd(A.rate, A.months - 36, A.monthly));
export const A_PAID = A.monthly * 12;
export const A_INT = A_CLOSE + A_PAID - A_OPEN;
export const AD_DEP = r(A_FLOOR2 / 6 / 4);
export const AD_AT = A_FLOOR2 - AD_DEP;
export const AD_FV = A.fvApr / A.floors;
export const AD_OCI = AD_FV - AD_AT;
export const AD_END = A.fvDec / A.floors;
export const AD_GAIN = AD_END - AD_FV;
export const AD_INCOME = (A.prepaid / A.prepaidMonths) * 9;
export const AD_LEFT = A.prepaid - AD_INCOME;
export const AC_DEP = r(A_FLOOR2 / 12);
export const AC_AT = A_FLOOR2 - AC_DEP;
export const AC_FV = A.fvJul / A.floors;
export const AC_GAIN = AC_FV - AC_AT;
export const AC_RATE = rateFor(AC_FV, A.subMonths, A.subMonthly);
export const AC_CLOSE = r(pvEnd(AC_RATE, A.subMonths - 6, A.subMonthly));
export const AC_RECEIVED = A.subMonthly * 6;
export const AC_INT = AC_CLOSE + AC_RECEIVED - AC_FV;
export const AB_DEP = A_YEAR_DEP * 2;
export const AB_ROU = (A_FLOOR2 - A_YEAR_DEP) * 2;
export const A_DEP = AB_DEP + AD_DEP + AC_DEP;
export const A_PL = AD_INCOME + AC_INT + AC_GAIN + AD_GAIN - A_DEP - A_INT;
export const A_TOTAL = A_PL + AD_OCI;

/** Exam B: two floors, a guarantee, half-yearly rent. */
export const B = { payment: 1_200_000, years: 9, rate: 0.07, guaranteed: 7_900_000, expected: 7_300_000, costs: 40_000, subPayment: 370_000, subPeriods: 6, subAnnual: 0.06, fvApr: 3_000_000, fvJul: 3_400_000, fvDec: 3_300_000 };
export const B_SHORT = B.guaranteed - B.expected;
export const B_L0 = r(pvEnd(B.rate, B.years, B.payment, B_SHORT));
export const B_ROU = B_L0 + B.costs;
export const B_FLOOR = r(B_ROU / 2);
export const B_DEP = r(B_FLOOR / B.years);
export const B_FLOOR2 = B_FLOOR - B_DEP * 2;
export const B_OPEN = r(pvEnd(B.rate, B.years - 2, B.payment, B_SHORT));
export const B_INT = r(B_OPEN * B.rate);
export const B_CLOSE = B_OPEN + B_INT - B.payment;
export const B_HALF_DEP = r(B_DEP / 2);
export const B_AT = B_FLOOR2 - B_HALF_DEP;
export const B_OCI = B.fvJul - B_AT;
export const B_LOSS = B.fvJul - B.fvDec;
export const B_HALF = (1 + B.subAnnual) ** 0.5 - 1;
export const B_SUB_PV = r(pvEnd(B_HALF, B.subPeriods, B.subPayment));
export const B_LOWER = B_FLOOR2 - B_DEP;
export const B_DEP_TOTAL = B_DEP + B_HALF_DEP;

/** Exam C: one contract, in both sets of books. */
export const C = { payment: 300_000, years: 5, life: 6, fairValue: 1_200_000, cost: 1_000_000, estimate: 100_000, guaranteed: 40_000, y1Estimate: 70_000, y2Estimate: 30_000, newPayment: 250_000, newRate: 0.08 };
export const C_RATE = rateFor(C.fairValue, C.years, C.payment, C.estimate);
export const C_L0 = r(pvEnd(C_RATE, C.years, C.payment));
export const C_DEP = r(C_L0 / C.years);
export const C_I1 = r(C_L0 * C_RATE);
export const C_C1 = C_L0 + C_I1 - C.payment;
export const C_ROU2 = C_L0 - C_DEP * 2;
export const C_SHORT = C.guaranteed - C.y2Estimate;
export const C_L2_BEFORE = r(pvEnd(C_RATE, 3, C.payment));
export const C_L2 = r(pvEnd(C_RATE, 3, C.payment, C_SHORT));
export const C_I2 = C_L2_BEFORE - C_C1 + C.payment;
export const C_UP = C_L2 - C_L2_BEFORE;
export const C_A2 = C_ROU2 + C_UP;
export const C_L3 = r(pvEnd(C.newRate, 3, C.newPayment, C_SHORT));
export const C_DOWN = C_L2 - C_L3;
export const C_A3 = C_A2 - C_DOWN;
export const C_DEP3 = r(C_A3 / 3);
export const C_INT3 = r(C_L3 * C.newRate);
export const C_CLOSE3 = C_L3 + C_INT3 - C.newPayment;
export const C_NC3 = r(pvEnd(C.newRate, 1, C.newPayment, C_SHORT));
export const C_UN = C.estimate - C.guaranteed;
export const CR_PVU = r(C_UN / (1 + C_RATE) ** C.years);
export const CR_SALES = C.fairValue - CR_PVU;
export const CR_COGS = C.cost - CR_PVU;
export const CR_I1 = r(C.fairValue * C_RATE);
export const CR_A1 = r(pvEnd(C_RATE, 4, C.payment, C.y1Estimate));
export const CR_LOSS1 = C.fairValue + CR_I1 - C.payment - CR_A1;
export const CR_I2 = r(CR_A1 * C_RATE);
export const CR_A2 = r(pvEnd(C_RATE, 3, C.payment, C.guaranteed));
export const CR_LOSS2 = CR_A1 + CR_I2 - C.payment - CR_A2;
export const CR_M = r(pvEnd(C_RATE, 3, C.newPayment, C.guaranteed));
export const CR_LOSS3 = CR_A2 - CR_M;
export const CR_I3 = r(CR_M * C_RATE);
export const CR_C3 = CR_M + CR_I3 - C.newPayment;
export const CR_N3 = r(pvEnd(C_RATE, 1, C.newPayment, C.guaranteed));

/** Exam D: a sale, a leaseback paid in advance, and a smaller space. */
export const D = { bookValue: 1_800_000, fairValue: 3_000_000, proceeds: 2_900_000, payment: 200_000, years: 15, rate: 0.05, life: 40, newPayment: 90_000, newRate: 0.06, left: 12 };
export const D_PRE = D.fairValue - D.proceeds;
export const D_GROSS = r(D.payment + pvEnd(D.rate, D.years - 1, D.payment));
export const D_SHARE = (D_GROSS + D_PRE) / D.fairValue;
export const D_ROU = r(D.bookValue * D_SHARE);
export const D_GAIN = D.proceeds + D_ROU - D.bookValue - D_GROSS;
export const D_DEP = r(D_ROU / D.years);
export const D_NET = D_GROSS - D.payment;
export const D_I1 = r(D_NET * D.rate);
export const D_C1 = D_NET + D_I1;
export const D_I2 = r((D_C1 - D.payment) * D.rate);
export const D_C2 = D_C1 - D.payment + D_I2;
export const D_ROU2 = D_ROU - D_DEP * 2;
export const D_AFTER = D_C2 - D.payment;
export const D_L_OUT = r(D_AFTER / 2);
export const D_A_OUT = r(D_ROU2 / 2);
export const D_MOD_GAIN = D_L_OUT - D_A_OUT;
export const D_L_KEEP = D_AFTER - D_L_OUT;
export const D_A_KEEP = D_ROU2 - D_A_OUT;
export const D_NEW = r(pvEnd(D.newRate, D.left, D.newPayment));
export const D_DOWN = D_L_KEEP - D_NEW;
export const D_A3 = D_A_KEEP - D_DOWN;
export const D_DEP3 = r(D_A3 / 13);
export const D_I3 = r(D_NEW * D.newRate);
export const D_C3 = D_NEW + D_I3;
export const D_RENT = r((D.payment * D.years + D_PRE) / D.years);

const P_START = r(pvEnd(0.06, 4, 40_000) * 0.06);
const P_NC = r(pvEnd(0.07, 3, 50_000));
const P_IDX_OLD = r(pvEnd(0.05, 4, 40_000));
const P_IDX_NEW = r(pvEnd(0.05, 4, 42_000));
const P_COGS = r(5_000 / 1.08 ** 4);
const P_F_OLD = r(pvEnd(0.06, 5, 72_000, 20_000));
const P_F_NEW = r(pvEnd(0.06, 5, 55_000, 20_000));
const P_SLB_L = r(pvEnd(0.05, 10, 60_000));
const P_SLB_ROU = r((400_000 * P_SLB_L) / 700_000);
const P_SLB_GAIN = 700_000 + P_SLB_ROU - 400_000 - P_SLB_L;
const P_HALF = r(pvEnd(0.04, 6, 25_000));
const P_SUB = r(pvEnd(0.07, 4, 81_500));

const SKILL = "שאלת מבחן";
const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  ask({ id: "x-swap", skill: SKILL, prompt: "ספק מתחייב לספק רכב, ויכול להחליף אותו בכל רגע בלי עלות של ממש, ומרוויח מכך. הלקוח מחליט לאן הרכב נוסע. האם יש חכירה?", options: ["לא: לספק יש זכות החלפה ממשית, ולכן אין נכס מזוהה", "כן: הלקוח מחליט לאן נוסעים", "כן: יש רכב אחד בכל רגע", "רק אם החוזה מעל שנה"], answer: 0, why: "סעיף ב14.", trap: "לבדוק רק את מבחן הכיוון. אם אין נכס מזוהה, אין טעם להמשיך.", level: 1, source: "מקורית", ref: "סעיף ב14" }),
  ask({ id: "x-variable", skill: SKILL, prompt: "החוכר משלם 40,000 ש״ח בשנה, ועוד 1% מהמכירות. מה נכנס להתחייבות החכירה?", options: ["רק 40,000 ש״ח לשנה", "גם אומדן של 1% מהמכירות", "רק 1% מהמכירות", "שום דבר עד שהמכירות ידועות"], answer: 0, why: "תשלום שתלוי במכירות אינו תשלום חכירה בהתחייבות. הוא הוצאה כשהוא מתהווה (סעיף 38(ב)).", trap: "להוון אומדן מכירות. רק מדד או שיעור נכנסים.", level: 1, source: "מקורית", ref: "סעיפים 27, 38" }),
  askNumber({ id: "x-dep", skill: SKILL, prompt: "עלות נכס זכות שימוש 240,000 ש״ח. תקופת החכירה 8 שנים, ואורך חיי הנכס 12 שנים. ודאי באופן סביר שהחוכר יממש אופציית רכישה בסוף. מהו הפחת השנתי?", answer: 20_000, steps: ["הנכס יישאר אצל החוכר, ולכן לאורך החיים (סעיף 32)", "240,000 ÷ 12 = 20,000"], trap: "להפחית על פני 8 שנים. החוכר ימשיך להשתמש בנכס אחרי החכירה.", level: 1, source: "מקורית", ref: "סעיף 32" }),
  askNumber({ id: "x-start", skill: SKILL, prompt: "חכירה ל-5 שנים, 40,000 ש״ח בתחילת כל שנה, והראשון שולם במועד התחילה. הריבית התוספתית 6%. מהן הוצאות המימון של השנה הראשונה?", answer: P_START, steps: [`אחרי התשלום נשארו 4 תשלומים: =PV(6%;4;-40000) → ${fmt(r(pvEnd(0.06, 4, 40_000)))}`, `${fmt(r(pvEnd(0.06, 4, 40_000)))} × 6% = ${fmt(P_START)}`], trap: "לחשב ריבית על היתרה לפני התשלום. התשלום יצא ב-1.1.", level: 2, source: "מקורית", ref: "סעיף 36" }),
  askNumber({ id: "x-nc", skill: SKILL, prompt: "ב-31.12 נשארו 4 תשלומים של 50,000 ש״ח בסוף כל שנה, בריבית 7%. מהו החלק הלא שוטף של התחייבות החכירה?", answer: P_NC, steps: [`אחרי התשלום הבא יישארו 3: =PV(7%;3;-50000) → ${fmt(P_NC)}`], trap: "להוריד מהיתרה את כל התשלום הבא. חלק ממנו ריבית שעוד לא נוצרה.", level: 2, source: "מקורית", ref: "IAS 1" }),
  ask({ id: "x-rate-option", skill: SKILL, prompt: "החוכר היה בטוח שלא יאריך, ואז בנה במושכר שיפור גדול, ועכשיו ודאי באופן סביר שיאריך. הריבית הגלומה לא ידועה. באיזו ריבית מודדים מחדש?", options: ["הריבית התוספתית המעודכנת של היום", "הריבית המקורית", "ריבית המדד", "לא מודדים מחדש"], answer: 0, why: "סעיפים 20, 40.", trap: "להתבלבל עם מדד, שבו נשארים בריבית המקורית.", level: 2, source: "מקורית", ref: "סעיף 40" }),
  askNumber({ id: "x-index", skill: SKILL, prompt: "אחרי התשלום של 31.12 נשארו 4 תשלומים של 40,000 ש״ח בסוף כל שנה, בריבית 5%. המדד עלה ב-5%, והתשלומים הבאים מתעדכנים. הריבית התוספתית היום 7%. בכמה גדלה ההתחייבות?", answer: P_IDX_NEW - P_IDX_OLD, steps: [`לפני: =PV(5%;4;-40000) → ${fmt(P_IDX_OLD)}`, `אחרי: =PV(5%;4;-42000) → ${fmt(P_IDX_NEW)}`, `${fmt(P_IDX_NEW)} − ${fmt(P_IDX_OLD)} = ${fmt(P_IDX_NEW - P_IDX_OLD)}`], trap: "להשתמש ב-7%. מדד לא משנה ריבית (סעיף 43).", level: 2, source: "מקורית", ref: "סעיפים 42, 43" }),
  ask({ id: "x-lessor-index", skill: SKILL, prompt: "מחכיר בחכירה מימונית. התשלום צמוד למדד, והמדד עלה. מה נכון?", options: ["אין מדידה מחדש של ההשקעה נטו, והתוספת היא הכנסה", "מודדים מחדש בריבית המקורית", "מודדים מחדש בריבית מעודכנת", "מכירים ברווח מכל היתרה"], answer: 0, why: "סעיף 70(ב) מודד את התשלום לפי המדד של מועד התחילה, וסעיף 90(א)(iii) מדבר על הכנסה מתשלומים משתנים שלא נמדדו בהשקעה נטו. אין בתקן משפט אחד שאומר את זה, אלא זו המשמעות של שני הסעיפים יחד.", trap: "להעתיק מהחוכר.", level: 2, source: "מקורית", ref: "סעיף 70" }),
  askNumber({ id: "x-cogs", skill: SKILL, prompt: "סוחר מחכיר נכס ל-4 שנים, בריבית גלומה של 8%. עלות הנכס אצלו 90,000 ש״ח. בסוף הנכס חוזר, ושוויו הצפוי 12,000 ש״ח, מזה 7,000 ש״ח בערבות החוכר. מהי עלות המכר?", answer: 90_000 - P_COGS, steps: ["לא מובטח: 12,000 − 7,000 = 5,000", `בערך נוכחי: 5,000 ÷ 1.08^4 = ${fmt(P_COGS)}`, `90,000 − ${fmt(P_COGS)} = ${fmt(90_000 - P_COGS)}`], trap: "להוריד את כל השייר. הערבות היא תשלום חכירה.", level: 2, source: "מקורית", ref: "סעיף 71(ב)" }),
  askNumber({ id: "x-opmod", skill: SKILL, prompt: "מחכיר בחכירה תפעולית. בתיקון נקבע: עוד 3 שנים, 50,000 ש״ח בסוף כל שנה. ביום התיקון יתרת הכנסות מראש 24,000 ש״ח. מהי ההכנסה השנתית?", answer: 58_000, steps: ["(50,000 × 3 + 24,000) ÷ 3 = 58,000 (סעיף 87)"], trap: "להתעלם מהיתרה.", level: 2, source: "מקורית", ref: "סעיף 87" }),
  askNumber({ id: "x-fin", skill: SKILL, prompt: "מחכיר בחכירה מימונית. נשארו 5 שנים, 72,000 ש״ח בסוף כל שנה, בריבית גלומה של 6%, ושייר לא מובטח של 20,000 ש״ח. בתיקון התשלום ירד ל-55,000 ש״ח, החכירה נשארת מימונית, והתיקון לא מביא לגריעה. ריבית השוק היום 8%. כמה הפסד נרשם?", answer: P_F_OLD - P_F_NEW, steps: [`לפני: =PV(6%;5;-72000;-20000) → ${fmt(P_F_OLD)}`, `אחרי: =PV(6%;5;-55000;-20000) → ${fmt(P_F_NEW)}`, `${fmt(P_F_OLD)} − ${fmt(P_F_NEW)} = ${fmt(P_F_OLD - P_F_NEW)}`], trap: "להשתמש ב-8%. אצל המחכיר נשארים בריבית המקורית.", level: 3, source: "מקורית", ref: "סעיף 80(ב)" }),
  askNumber({ id: "x-sub", skill: SKILL, prompt: "חברה החכירה הלאה את כל 4 השנים שנשארו לה בחכירה, ב-81,500 ש״ח בסוף כל שנה, בריבית גלומה של 7%. נכס זכות השימוש בספרים 240,000 ש״ח, והתחייבות החכירה 260,000 ש״ח. כמה רווח נרשם?", answer: P_SUB - 240_000, steps: ["100% מזכות השימוש, ולכן מימונית", `השקעה נטו: =PV(7%;4;-81500) → ${fmt(P_SUB)}`, `${fmt(P_SUB)} − 240,000 = ${fmt(P_SUB - 240_000)}. ההתחייבות לא משתתפת`], trap: "לכלול את ההתחייבות בחישוב. היא נשארת מול המחכיר הראשי.", level: 3, source: "מקורית", ref: "סעיפים ב58, 67" }),
  askNumber({ id: "x-slb", skill: SKILL, prompt: "ערך נכס בספרים 400,000 ש״ח. הוא נמכר בשוויו ההוגן, 700,000 ש״ח, והשליטה עברה לקונה. המוכר חוכר אותו בחזרה ל-10 שנים, 60,000 ש״ח בסוף כל שנה, בריבית 5%. כמה רווח נרשם?", answer: P_SLB_GAIN, steps: [`התחייבות: =PV(5%;10;-60000) → ${fmt(P_SLB_L)}`, `נכס: 400,000 × ${fmt(P_SLB_L)} ÷ 700,000 = ${fmt(P_SLB_ROU)}`, `700,000 + ${fmt(P_SLB_ROU)} − 400,000 − ${fmt(P_SLB_L)} = ${fmt(P_SLB_GAIN)}`], trap: "לרשום את כל 300,000.", level: 3, source: "מקורית", ref: "סעיף 100" }),
  askNumber({ id: "x-half", skill: SKILL, prompt: "6 תשלומים של 25,000 ש״ח, בסוף כל חצי שנה. הריבית השנתית האפקטיבית 8.16%, ושקולה ל-4% לחצי שנה. מהו הערך הנוכחי?", answer: P_HALF, steps: [`=PV(4%;6;-25000) → ${fmt(P_HALF)}`], trap: "לחלק את הריבית השנתית ב-2.", level: 2, source: "מקורית", ref: "סעיף 26" }),
  ask({ id: "x-land", skill: SKILL, prompt: "חכירת בניין ל-13 שנים, כשלמבנה 15 שנות חיים. הקרקע מהותית, ואין הקצאה מהימנה. המחכיר אינו סוחר. מה נגרע מספריו?", options: ["גם הקרקע וגם המבנה", "רק המבנה", "רק הקרקע", "שום דבר"], answer: 0, why: "כשאין הקצאה, והמרכיבים לא ברור שתפעוליים, הכול מימונית (סעיף ב56).", trap: "להפריד בכל זאת.", level: 3, source: "מקורית", ref: "סעיף ב56" }),
  ask({ id: "x-ip", skill: SKILL, prompt: "חברה הפסיקה להשתמש בקומה חכורה, שאפשר להחכיר בנפרד, והחכירה אותה הלאה לזמן קצר. נדל״ן להשקעה נמדד בשווי הוגן. ביום סיום השימוש השווי גבוה מהערך בספרים, ולא הוכרה ירידת ערך קודמת. איפה נרשם ההפרש?", options: ["ברווח כולל אחר", "ברווח או הפסד", "מקטין את ההתחייבות", "לא נרשם"], answer: 0, why: "IAS 40 סעיף 62(ב). אחרי המעבר, שינויי שווי הולכים לרווח או הפסד.", trap: "לבלבל בין יום המעבר לבין מה שאחריו.", level: 3, source: "מקורית", ref: "IAS 40 סעיף 62" }),
  Object.assign(
    journal("x-j1", "פקודת יומן", "חוכר העריך מחדש את הסכום שישלם בגלל ערבות שייר. ההתחייבות גדלה ב-9,000 ש״ח. רשמו את הפקודה.", [{ account: "נכס זכות שימוש", dr: 9_000 }, { account: "התחייבות חכירה", cr: 9_000 }], "ההפרש כנגד הנכס (סעיף 39). מלכודת נפוצה: לרשום הוצאה.", ["נכס זכות שימוש", "התחייבות חכירה", "הוצאות מימון", "מזומן"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 39" } },
  ),
  Object.assign(
    journal("x-j2", "פקודת יומן", "מחכיר בחכירה מימונית, ואומדן השייר הלא מובטח ירד. ההשקעה נטו יורדת ב-6,000 ש״ח. רשמו את הפקודה.", [{ account: "הפסד מירידת אומדן", dr: 6_000 }, { account: "השקעה נטו בחכירה", cr: 6_000 }], "ההפסד מיד ברווח או הפסד (סעיף 77). מלכודת נפוצה: לפרוס אותו על יתרת החכירה.", ["הפסד מירידת אומדן", "השקעה נטו בחכירה", "הכנסות מימון", "מזומן"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 77" } },
  ),
];

const traps: Trap[] = [
  {
    id: "x-who-rate",
    prompt: "באיזה מהמקרים נשארים בריבית המקורית?",
    options: ["חוכר ששינוי במדד פגע בו, ומחכיר שמחשב מחדש לפי IFRS 9", "חוכר שמימש אופציה לא צפויה", "חוכר בתיקון שאינו חכירה נפרדת", "מחכיר שתיקן תפעולית למימונית"],
    answer: 0,
    why: "סעיפים 43, 80(ב).",
    traps: ["", "שינוי תקופה: ריבית מעודכנת.", "תיקון אצל החוכר: ריבית מעודכנת.", "חכירה חדשה: הריבית של יום התיקון."],
  },
  {
    id: "x-who-asset",
    prompt: "בעסקה, מי מכיר בנכס זכות שימוש?",
    options: ["החוכר, ובמימונית של חכירת משנה הוא גורע אותו", "המחכיר", "שניהם", "אף אחד, אם החכירה תפעולית"],
    answer: 0,
    why: "מחכיר ראשי מחזיק נכס בסיס או השקעה נטו, לא נכס זכות שימוש. נכס כזה יש רק למי שהוא גם חוכר, כולל מחכיר ביניים בחכירת משנה תפעולית.",
    traps: ["", "למחכיר ראשי יש נכס בסיס או השקעה נטו.", "רק החוכר.", "סיווג לתפעולית הוא רק אצל המחכיר."],
  },
  {
    id: "x-which-profit",
    prompt: "מתי מחכיר שאינו סוחר רושם רווח ביום הראשון של חכירה מימונית?",
    options: ["כשהשווי ההוגן גבוה מהערך בספרים", "תמיד, בגובה ההכנסות ממכירות", "לעולם לא", "רק אם יש שייר מובטח"],
    answer: 0,
    why: "רווח הון על ההפרש. הכנסות ממכירות הן של סוחר.",
    traps: ["", "מכירות הן של סוחר.", "יש רווח הון אם השווי גבוה מהערך בספרים.", "השייר לא קשור."],
  },
  {
    id: "x-residual-both",
    prompt: "החוכר ערב לשייר, וצופה שלא ישלם. מה נכלל אצל כל צד?",
    options: ["חוכר: כלום. מחכיר: כל הערבות", "חוכר: כל הערבות. מחכיר: כלום", "שניהם: כל הערבות", "שניהם: כלום"],
    answer: 0,
    why: "סעיפים 27(ג), 70(ג).",
    traps: ["", "הפוך.", "החוכר רק מה שצפוי.", "אצל המחכיר הערבות היא תשלום חכירה."],
  },
];

/** The screen that teaches what each question asks: an earlier lesson's, since this lesson only tests. */
export const EXAM_TAUGHT: Record<string, string> = {
  "x-swap": "ls-what-swap",
  "x-variable": "ls-meas-what",
  "x-dep": "ls-sub-dep",
  "x-start": "ls-sub-start",
  "x-nc": "ls-sub-current",
  "x-rate-option": "ls-chg-rate",
  "x-index": "ls-chg-index",
  "x-lessor-index": "ls-lsr-index",
  "x-cogs": "ls-lsr-resid",
  "x-opmod": "ls-lmd-op",
  "x-fin": "ls-lmd-ifrs9",
  "x-sub": "ls-spc-subfin",
  "x-slb": "ls-spc-fair",
  "x-half": "ls-spc-rates",
  "x-land": "ls-spc-whole",
  "x-ip": "ls-spc-ip",
  "x-j1": "ls-chg-asset",
  "x-j2": "ls-lsr-resid",
  "x-who-rate": "ls-lmd-sides",
  "x-who-asset": "ls-spc-subfin",
  "x-which-profit": "ls-lsr-nondealer",
  "x-residual-both": "ls-lsr-resid",
};

/** Lesson 9: exams without a hint to the topic, and the map of the whole standard. */
export const EXAM: StudyModule = {
  slug: "ifrs16-exam",
  course: COURSE,
  n: 9,
  title: "מבחני סיכום ומפת התקן",
  description: "ארבע שאלות ארוכות ברמת מועצה, בלי רמז לנושא, עם פתרון מלא. לפניהן מפה של כל התקן והנקודות הקשות, ואחריהן תרגול מעורב.",
  goal: "לזהות לבד מה השאלה דורשת, ולפתור שאלה ארוכה ברמת מבחן, עד הדוחות הכספיים.",
  outcomes: [
    "לנווט בכל התקן לפי שאלה אחת: מה לפניי",
    "לפתור שאלה בחודשים, עם חכירות משנה ושווי הוגן",
    "לפתור שאלה עם ערבות, תשלום חצי שנתי ומעבר לנדל״ן להשקעה",
    "לפתור חוזה אחד בשני הספרים, ולהסביר למה התוצאות שונות",
    "לחבר מכירה וחכירה בחזרה, תשלום מראש ותיקון שמקטין היקף",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-exm-hook", title: "איך ניגשים לשאלה ארוכה" },
    { id: "ls-exm-map", title: "מפה של כל התקן" },
    { id: "ls-exm-hard", title: "הנקודות הקשות, בטבלה אחת" },
    { id: "ls-exm-a", title: "מבחן 1: בניין בן ארבע קומות" },
    { id: "ls-exm-b", title: "מבחן 2: שתי קומות ותוכנית התייעלות" },
    { id: "ls-exm-c", title: "מבחן 3: צי רכב" },
    { id: "ls-exm-d", title: "מבחן 4: מטה שנמכר" },
    { id: "ls-exm-drill", title: "מתרגלים בלי לדעת על מה" },
  ],
  exercises,
  traps,
  tips: [
    "קודם מזהים, אחר כך מחשבים: מה לפניי, ובאיזה צד אני.",
    "תשלום בתחילת שנה: ריבית על היתרה אחרי התשלום.",
    "לא שוטף: מה שיישאר אחרי התשלום הבא.",
    "ריבית ישנה: מדד וערבות, ומחכיר לפי IFRS 9. ריבית מעודכנת: תקופה, אופציה ותיקון אצל חוכר.",
    "הקטנה: קודם גריעה, אחר כך מדידה מחדש.",
    "פחת אחרי שינוי: יתרה חלקי השנים שנשארו.",
    "החוכר רואה רק את מה שצפוי לשלם בערבות. המחכיר רואה הכול.",
    "שייר לא מובטח אצל סוחר: יורד גם ממכירות וגם מעלות המכר.",
    "חכירת משנה: מול זכות השימוש.",
    "מכירה וחכירה בחזרה: רווח רק על החלק שעבר.",
  ],
};
