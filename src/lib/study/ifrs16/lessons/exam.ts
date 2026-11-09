import { allocate, pvEnd, rateFor } from "../../../learn/ifrs16";
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

type Line = { account: string; dr?: number; cr?: number };

/** Exam E: a shop the lessee fits out with the lessor's help, a change on 1.10, and a machine paid by the dollar. Year 2 is asked. */
export const E = { payment: 120_000, years: 6, rate: 0.06, incentive: 60_000, works: 180_000, worksLife: 10, readyMonth: 3, modMonth: 9, newPayment: 105_000, newYears: 9, newRate: 0.07, usd: 49_000, usdYears: 4, usdRate: 0.05, fxStart: 3.5, fxEnd: 3.75 };
export const E_L0 = r(pvEnd(E.rate, E.years, E.payment));
export const E_ROU0 = E_L0 - E.incentive;
export const E_DEP = r(E_ROU0 / E.years);
export const E_I1 = r(E_L0 * E.rate);
export const E_L1 = E_L0 + E_I1 - E.payment;
export const E_ROU1 = E_ROU0 - E_DEP;
/** The improvements serve from 1.4 of year 1 to the end of the term, 69 months, shorter than their 10 years. */
export const E_IMP_MONTHS = E.years * 12 - E.readyMonth;
export const E_IMP_DEP1 = r((E.works * (12 - E.readyMonth)) / E_IMP_MONTHS);
export const E_IMP1 = E.works - E_IMP_DEP1;
export const E_STUB = (1 + E.rate) ** (E.modMonth / 12) - 1;
export const E_STUB_INT = r(E_L1 * E_STUB);
export const E_L_BEFORE = E_L1 + E_STUB_INT;
/** From 1.10 of year 2: eight payments, the first on 31.12, three months away. */
export const E_NEW_N = E.newYears - 1;
export const E_L_MOD = r(pvEnd(E.newRate, E_NEW_N, E.newPayment) * (1 + E.newRate) ** (E.modMonth / 12));
export const E_UP = E_L_MOD - E_L_BEFORE;
export const E_DEP_9 = r((E_ROU0 * E.modMonth) / (E.years * 12));
export const E_ROU_BEFORE = E_ROU1 - E_DEP_9;
export const E_ROU_MOD = E_ROU_BEFORE + E_UP;
export const E_LEFT = (E.newYears - 2) * 12 + (12 - E.modMonth);
export const E_DEP_3 = r((E_ROU_MOD * (12 - E.modMonth)) / E_LEFT);
export const E_ROU2 = E_ROU_MOD - E_DEP_3;
export const E_DEP2 = E_DEP_9 + E_DEP_3;
export const E_QUARTER = (1 + E.newRate) ** ((12 - E.modMonth) / 12) - 1;
export const E_INT_3 = r(E_L_MOD * E_QUARTER);
export const E_L2 = E_L_MOD + E_INT_3 - E.newPayment;
export const E_INT2 = E_STUB_INT + E_INT_3;
export const E_L2_NC = r(pvEnd(E.newRate, E_NEW_N - 2, E.newPayment));
export const E_IMP_DEP_9 = r((E.works * E.modMonth) / E_IMP_MONTHS);
export const E_IMP_MOD = E_IMP1 - E_IMP_DEP_9;
export const E_IMP_DEP_3 = r((E_IMP_MOD * (12 - E.modMonth)) / E_LEFT);
export const E_IMP2 = E_IMP_MOD - E_IMP_DEP_3;
export const E_IMP_DEP2 = E_IMP_DEP_9 + E_IMP_DEP_3;
/** Simple interest for the nine months, which some questions ask for instead. */
export const E_STUB_SIMPLE = r((E_L1 * E.rate * E.modMonth) / 12);
/** The machine: the liability lives in dollars, the asset stays at the first day's rate. */
export const E_USD0 = r(pvEnd(E.usdRate, E.usdYears, E.usd));
export const E_USD_INT = r(E_USD0 * E.usdRate);
export const E_USD1 = E_USD0 + E_USD_INT - E.usd;
export const E_USD_NC = r(pvEnd(E.usdRate, E.usdYears - 2, E.usd));
export const E_M_ROU0 = r(E_USD0 * E.fxStart);
export const E_M_DEP = r(E_M_ROU0 / E.usdYears);
export const E_M_ROU1 = E_M_ROU0 - E_M_DEP;
export const E_M_INT = r(E_USD_INT * E.fxEnd);
export const E_M_PAY = r(E.usd * E.fxEnd);
export const E_M_CLOSE = r(E_USD1 * E.fxEnd);
export const E_M_FX = E_M_CLOSE - E_M_ROU0 - E_M_INT + E_M_PAY;
export const E_M_NC = r(E_USD_NC * E.fxEnd);
export const E_PL = E_DEP2 + E_IMP_DEP2 + E_M_DEP + E_INT2 + E_M_INT + E_M_FX;
export const E_ENTRY_START: Line[] = [
  { account: "נכס זכות שימוש", dr: E_ROU0 },
  { account: "מזומן: השתתפות המחכיר", dr: E.incentive },
  { account: "התחייבות חכירה", cr: E_L0 },
];
export const E_ENTRY_MOD: Line[] = [
  { account: "נכס זכות שימוש", dr: E_UP },
  { account: "התחייבות חכירה", cr: E_UP },
];

/** Exam F: a lessor, a rate and no fair value, maintenance inside the rent, a change of mind, then a shorter lease. */
export const F = { receipt: 270_000, leasePrice: 250_000, servicePrice: 50_000, years: 5, life: 7, rate: 0.08, residual: 60_000, bookValue: 880_000, costs: 12_000, extendYears: 2, intentMonth: 3, newReceipt: 230_000, newService: 45_000, newYears: 2, comp: 40_000 };
const [F_LEASE_RAW, F_SERVICE_RAW] = allocate(F.receipt, [F.leasePrice, F.servicePrice]);
export const F_LEASE = r(F_LEASE_RAW);
export const F_SERVICE = r(F_SERVICE_RAW);
export const F_NI0 = r(pvEnd(F.rate, F.years, F_LEASE, F.residual));
export const F_FV = F_NI0 - F.costs;
export const F_PV_PAY = r(pvEnd(F.rate, F.years, F_LEASE));
export const F_GAIN = F_NI0 - F.bookValue - F.costs;
export const F_I1 = r(F_NI0 * F.rate);
export const F_NI1 = F_NI0 + F_I1 - F_LEASE;
/** What two past papers would book on 1.4 of year 2: the net investment again at 8%, with the two option years and nothing left at the end. */
export const F_OLD_APR = r(F_NI1 * (1 + F.rate) ** (F.intentMonth / 12));
export const F_NEW_APR = r(pvEnd(F.rate, F.years - 1 + F.extendYears, F_LEASE) * (1 + F.rate) ** (F.intentMonth / 12));
export const F_PAPERS = F_NEW_APR - F_OLD_APR;
export const F_I2 = r(F_NI1 * F.rate);
export const F_NI2 = F_NI1 + F_I2 - F_LEASE;
export const F_NEW_LEASE = F.newReceipt - F.newService;
/** The test of paragraph 80(a): the modified payments, at the rate of the first day, against the first day's fair value. */
export const F_MOD_PV = r(F_LEASE / (1 + F.rate) + (F_LEASE + F.comp) / (1 + F.rate) ** 2 + F_NEW_LEASE / (1 + F.rate) ** 3 + F_NEW_LEASE / (1 + F.rate) ** 4);
export const F_INCOME3 = (F_NEW_LEASE * F.newYears + F.comp) / F.newYears;
export const F_DEFER3 = F.comp - (F_INCOME3 - F_NEW_LEASE);
export const F_LEFT_LIFE = F.life - 2;
export const F_DEP3 = r(F_NI2 / F_LEFT_LIFE);
export const F_MACHINE3 = F_NI2 - F_DEP3;
/** Profit, years 1 to 3. */
export const F_PL1 = F_GAIN + F_I1 + F_SERVICE;
export const F_PL2 = F_I2 + F_SERVICE;
export const F_PL3 = F_INCOME3 + F.newService - F_DEP3;
export const F_ENTRY_START: Line[] = [
  { account: "השקעה נטו בחכירה", dr: F_NI0 },
  { account: "מכונות", cr: F.bookValue },
  { account: "מזומן: עלויות ישירות", cr: F.costs },
  { account: "רווח הון", cr: F_GAIN },
];
export const F_ENTRY_Y1: Line[] = [
  { account: "מזומן", dr: F.receipt },
  { account: "השקעה נטו בחכירה", cr: F_LEASE - F_I1 },
  { account: "הכנסות מימון", cr: F_I1 },
  { account: "הכנסות משירותי תחזוקה", cr: F_SERVICE },
];
export const F_ENTRY_MOD: Line[] = [
  { account: "מכונות", dr: F_NI2 },
  { account: "מזומן: פיצוי", dr: F.comp },
  { account: "השקעה נטו בחכירה", cr: F_NI2 },
  { account: "הכנסות מראש", cr: F.comp },
];

/** Exam G: a sublease with an incentive, an office lease with deferred tax, a floor still to come, and a building sold with a right to buy it back. Year 3 is asked. */
export const G = { whPayment: 210_000, whYears: 8, whRate: 0.05, subReceipt: 250_000, subYears: 6, subFv: 1_150_000, incentive: 50_000, offPayment: 150_000, offYears: 5, offRate: 0.06, tax: 0.23, floorPayment: 160_000, floorYears: 5, bookValue: 2_400_000, bldLife: 30, proceeds: 3_000_000, slbPayment: 200_000, slbYears: 4, callPrice: 2_700_000 };
export const G_WH_ROU0 = r(pvEnd(G.whRate, G.whYears, G.whPayment));
export const G_WH_DEP = r(G_WH_ROU0 / G.whYears);
export const G_WH_ROU2 = G_WH_ROU0 - G_WH_DEP * 2;
export const G_WH_L2 = r(pvEnd(G.whRate, G.whYears - 2, G.whPayment));
export const G_WH_I3 = r(G_WH_L2 * G.whRate);
export const G_WH_L3 = G_WH_L2 + G_WH_I3 - G.whPayment;
export const G_NI0 = G.subFv + G.incentive;
export const G_SUB_RATE = rateFor(G_NI0, G.subYears, G.subReceipt);
export const G_SUB_GAIN = G.subFv - G_WH_ROU2;
export const G_SUB_I3 = r(G_NI0 * G_SUB_RATE);
export const G_NI3 = G_NI0 + G_SUB_I3 - G.subReceipt;
/** The shortcut a student may try: the incentive as an expense at once, and a higher rate on the fair value alone. */
export const G_ALT_RATE = rateFor(G.subFv, G.subYears, G.subReceipt);
export const G_ALT_I3 = r(G.subFv * G_ALT_RATE);
/** How much lower the shortcut makes year 3's profit: the whole incentive at once, less the extra income it earns back. */
export const G_ALT_DIFF = G.incentive + G_SUB_I3 - G_ALT_I3;
export const G_OFF_L0 = r(pvEnd(G.offRate, G.offYears, G.offPayment));
export const G_OFF_DEP = r(G_OFF_L0 / G.offYears);
export const G_OFF_ROU1 = G_OFF_L0 - G_OFF_DEP;
export const G_OFF_I = r(G_OFF_L0 * G.offRate);
export const G_OFF_L1 = G_OFF_L0 + G_OFF_I - G.offPayment;
export const G_DT0 = r(G_OFF_L0 * G.tax);
export const G_DTL1 = r(G_OFF_ROU1 * G.tax);
export const G_DTA1 = r(G_OFF_L1 * G.tax);
export const G_DT_NET = G_DTA1 - G_DTL1;
export const G_SLB_RATE = rateFor(G.proceeds, G.slbYears, G.slbPayment, G.callPrice);
export const G_SLB_I = r(G.proceeds * G_SLB_RATE);
export const G_SLB_L1 = G.proceeds + G_SLB_I - G.slbPayment;
export const G_BLD_DEP = r(G.bookValue / G.bldLife);
export const G_BLD1 = G.bookValue - G_BLD_DEP;
export const G_PL = G_SUB_GAIN + G_SUB_I3 + G_DT_NET - G_WH_I3 - G_OFF_DEP - G_OFF_I - G_BLD_DEP - G_SLB_I;
export const G_ENTRY_SUB: Line[] = [
  { account: "השקעה נטו בחכירה", dr: G_NI0 },
  { account: "נכס זכות שימוש: מחסן", cr: G_WH_ROU2 },
  { account: "מזומן: תמריץ לחוכר המשנה", cr: G.incentive },
  { account: "רווח מחכירת משנה", cr: G_SUB_GAIN },
];
export const G_ENTRY_OFF: Line[] = [
  { account: "נכס זכות שימוש: משרדים", dr: G_OFF_L0 },
  { account: "נכס מסים נדחים", dr: G_DT0 },
  { account: "התחייבות חכירה: משרדים", cr: G_OFF_L0 },
  { account: "התחייבות מסים נדחים", cr: G_DT0 },
];
export const G_ENTRY_SLB: Line[] = [
  { account: "מזומן", dr: G.proceeds },
  { account: "התחייבות פיננסית", cr: G.proceeds },
];

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
const P_INS_L = r(pvEnd(0.06, 3, 30_000));
const P_INS = P_INS_L - 3_000;
const P_CAP_PAY = 100_000 * (1 + Math.min(0.045, 0.03));
const P_CAP = r(pvEnd(0.05, 3, P_CAP_PAY));
const P_TAX = r((330_000 - 320_000) * 0.25);
const P_EXIT = 270_000 - (300_000 - 40_000);
const P_STUB = r(400_000 * 1.06 ** 0.5);
const P_USD = r(100_000 * (3.7 - 3.5));
const P_IMP = r((150_000 / 54) * 6);
const P_LSR_NI = r(pvEnd(0.07, 4, 100_000, 20_000));
const P_LSR = P_LSR_NI - 330_000 - 5_000;

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
  ask({ id: "x-swap-late", skill: SKILL, prompt: "ספק מעמיד ללקוח מכונת אריזה ל-6 שנים. לפי החוזה, רק מתחילת השנה הרביעית הוא רשאי להחליף אותה במכונה אחרת, וההחלפה תחסוך לו עלויות. הלקוח מחליט מתי ומה לארוז. האם יש נכס מזוהה?", options: ["כן. בשלוש השנים הראשונות אין לספק זכות להחליף, ולכן זכות ההחלפה אינה ממשית", "לא. לספק יש זכות החלפה, והוא מרוויח ממנה", "לא, אבל רק בשלוש השנים האחרונות", "אין מספיק נתונים לדעת"], answer: 0, why: "זכות החלפה ממשית רק אם לספק יש יכולת מעשית להחליף לאורך כל תקופת השימוש, וגם תועלת כלכלית מההחלפה (ב14). כאן בחצי מהתקופה אין לו זכות כזו בכלל, ולכן המכונה מזוהה, והלקוח מכוון את השימוש: יש חכירה.", trap: "לראות שהספק מרוויח מההחלפה ולעצור שם. שני התנאים צריכים להתקיים לאורך כל התקופה.", level: 2, source: "מקורית", ref: "סעיף ב14" }),
  ask({ id: "x-consent", skill: SKILL, prompt: "חוזה שכירות של אולם ל-5 שנים. בסופו השוכר רשאי להאריך ב-3 שנים בדמי שכירות נמוכים בהרבה ממחיר השוק, אבל רק אם המשכיר יסכים להארכה כשיגיע המועד. מהי תקופת החכירה?", options: ["5 שנים", "8 שנים, כי המחיר הנמוך הוא תמריץ ברור להאריך", "8 שנים, אם השוכר מעריך שהמשכיר יסכים", "4 שנים, כי למשכיר יש זכות לסרב"], answer: 0, why: "תקופת החכירה כוללת הארכה רק כשזו אופציה של החוכר, שהוא ודאי באופן סביר שיממש (סעיף 18). כאן בלי הסכמת המשכיר אין לשוכר זכות להאריך, ובשנים שאחרי 5 החוזה כבר אינו אכיף (ב34). התקן לא מזכיר הסכמה במילים, וזו הקריאה של סעיפים 18 ו-ב34 יחד.", trap: "לספור את 3 השנים בגלל המחיר הנמוך. מחיר נמוך הוא סימן רק כשההחלטה בידי החוכר לבדו.", level: 2, source: "מקורית", ref: "סעיפים 18, ב34" }),
  ask({ id: "x-fees", skill: SKILL, prompt: "שכירות משרד: 20,000 ש״ח בחודש. בחשבונית מופיעים 1,500 ש״ח ״דמי ביטוח״, שבהם המשכיר מממן את ביטוח המבנה שלו, ו-2,500 ש״ח ״דמי ניהול״, שמממנים ניקיון ושמירה של הלובי והחניון. השוכר לא בחר בהקלה של סעיף 15. מה מהם הוא רכיב נפרד שאינו חכירה?", options: ["רק דמי הניהול", "שני הסכומים", "רק דמי הביטוח", "אף אחד מהם, הכול שכירות"], answer: 0, why: "ביטוח המבנה הוא עלות של המשכיר, והשוכר לא מקבל ממנו שום שירות, ולכן הוא לא רכיב בפני עצמו. הוא חלק מהתמורה שמחלקים בין הרכיבים (ב33). ניקיון ושמירה הם שירות שהשוכר מקבל, ולכן רכיב שאינו חכירה (סעיף 12), גם אם קוראים לו דמי ניהול.", trap: "ללכת לפי השם בחשבונית. שואלים מה השוכר מקבל בפועל תמורת הכסף.", level: 2, source: "מקורית", ref: "סעיפים 12, ב33" }),
  askNumber({ id: "x-insure", skill: SKILL, prompt: "ב-1.1 חברה חכרה רכב ל-3 שנים, 30,000 ש״ח בסוף כל שנה, בריבית 6%. במועד התחילה המחכיר נתן לה בחינם פוליסת ביטוח חובה לשנה הראשונה, ששוויה 3,000 ש״ח. ביטוח החובה הוא חובה של החוכר. מהי עלות נכס זכות השימוש?", answer: P_INS, steps: [`התחייבות: =PV(6%;3;-30000) → ${fmt(P_INS_L)}`, "המחכיר שילם עלות של החוכר, ולכן זה תמריץ, והוא מקטין את עלות הנכס", `${fmt(P_INS_L)} − 3,000 = ${fmt(P_INS)}. הפוליסה נרשמת כהוצאה מראש של 3,000 ש״ח, והופכת להוצאות ביטוח במשך השנה`], trap: "להתעלם מהפוליסה, כי לא עבר כסף. תמריץ יכול להיות גם תשלום של עלות במקום החוכר.", level: 2, source: "הרצאה", ref: "נספח א׳, סעיף 24" }),
  askNumber({ id: "x-improve", skill: SKILL, prompt: "ב-1.1 חברה חכרה חנות ל-5 שנים, בלי אופציות. היא שיפצה אותה על חשבונה ב-150,000 ש״ח, והחנות המשופצת מוכנה לשימוש ב-1.7. אורך החיים של השיפוץ 10 שנים. מהו הפחת של השיפור בשנה הראשונה?", answer: P_IMP, steps: ["השיפור הוא רכוש קבוע, והפחת מתחיל כשהוא מוכן לשימוש (IAS 16 סעיף 55)", "מפחיתים על פני הקצר מבין 10 שנות החיים ו-4.5 השנים שנשארו לחכירה (IAS 16 סעיף 56(ד))", `150,000 ÷ 54 × 6 = ${fmt(P_IMP)}`], trap: "להפחית על פני 10 שנים, או מ-1.1. אחרי החכירה השיפור נשאר אצל המחכיר.", level: 2, source: "הרצאה", ref: "IAS 16 סעיפים 55, 56(ד)" }),
  askNumber({ id: "x-stub", skill: SKILL, prompt: "ב-31.12, אחרי התשלום, יתרת התחייבות החכירה 400,000 ש״ח, בריבית שנתית של 6%, והתשלומים בסוף כל שנה. ב-1.7 הצדדים תיקנו את החוזה. ריבית לחלק משנה מחושבת בריבית דריבית. מהי יתרת ההתחייבות ב-1.7, רגע לפני המדידה מחדש?", answer: P_STUB, steps: ["מגלגלים את היתרה ליום התיקון, חצי שנה, בריבית של חצי שנה", `400,000 × 1.06^(6/12) = ${fmt(P_STUB)}`, `ב-Excel: =400000*(1+6%)^(6/12)`], trap: "לקחת 3%, כלומר 412,000. זו ריבית פשוטה, שיש שאלות שמבקשות אותה במפורש, וכאן לא.", level: 2, source: "מקורית", ref: "סעיף 45" }),
  askNumber({ id: "x-usd", skill: SKILL, prompt: "ב-1.1 חוכר הכיר בהתחייבות של 100,000 דולר, בריבית 4% לדולר. השער ב-1.1 היה 3.50 ש״ח לדולר, וב-31.12 3.70 ש״ח. ב-31.12 נרשמה הריבית, בשער של יום זה, ושולמו 30,000 דולר. כמה הפרשי שער נרשמים בשנה?", answer: P_USD, steps: ["ההתחייבות היא פריט כספי, ולכן מתורגמת בשער הסגירה (IAS 21 סעיף 23(א))", "הריבית והתשלום נרשמו בשער של 31.12, ולכן רק היתרה של 1.1 עברה משער לשער", `100,000 × (3.70 − 3.50) = ${fmt(P_USD)}, הוצאה ברווח או הפסד`], trap: "לתרגם גם את הנכס. זכות השימוש אינה פריט כספי, ונשארת בשער של יום התחילה (סעיף 23(ב)).", level: 2, source: "מקורית", ref: "IAS 21 סעיף 23" }),
  ask({ id: "x-later", skill: SKILL, prompt: "ב-1.10 של שנה 1 חוכר ומחכיר הסכימו שהמחכיר יעמיד לחוכר מחסן נוסף מ-1.3 של שנה 2, ל-4 שנים, במחיר שוק למחסן כזה. מה נרשם בשנה 1?", options: ["שום דבר. זו חכירה נפרדת, והיא תוכר במועד התחילה שלה, 1.3 של שנה 2", "נכס והתחייבות ב-1.10, ביום ההסכמה", "מדידה מחדש של החכירה הקיימת ב-1.10, בריבית מעודכנת", "התחייבות בלבד ב-1.10, ונכס ב-1.3"], answer: 0, why: "נוסף נכס, והתמורה גדלה במחיר הנפרד שלו, ולכן זו חכירה נפרדת (סעיף 44). חכירה מוכרת במועד התחילה, כשהנכס עומד לרשות החוכר (סעיף 22). רק תיקון שאינו חכירה נפרדת מטופל ביום ההסכמה (סעיף 45).", trap: "לרשום ביום החתימה. יום ההסכמה קובע רק כשמשנים את החוזה הקיים.", level: 2, source: "מקורית", ref: "סעיפים 22, 44, 45" }),
  ask({ id: "x-sameday", skill: SKILL, prompt: "ב-31.12 קרו שני דברים: החוכר כבר לא ודאי שיממש אופציית הארכה שנכללה בתקופה, והצדדים גם הסכימו לקצר בשנה את התקופה שאי אפשר לבטל ולהוריד את דמי השכירות. איך מטפלים?", options: ["קודם הערכה מחדש של התקופה, בריבית מעודכנת, כנגד הנכס. אחר כך התיקון: גריעה עם רווח או הפסד על השנה שההסכם קיצר, ומדידה מחדש", "תיקון אחד: גריעה עם רווח או הפסד על כל השנים שירדו", "הערכה מחדש אחת כנגד הנכס, בלי רווח או הפסד", "קודם התיקון, ואחר כך הערכה מחדש בריבית המקורית"], answer: 0, why: "האופציה שיצאה מהתקופה היא הערכה מחדש (סעיפים 20, 40), וההפרש שלה נרשם כנגד הנכס. רק מה שההסכם שינה הוא תיקון, ורק עליו גריעה עם רווח או הפסד (סעיף 46(א)). התקן לא קובע סדר במפורש. זו הדרך שבה פותרים מבחנים, ויש לשאול את המרצה.", trap: "לטפל בכל הקיצור כתיקון. כך רווח או הפסד נרשם גם על שנים שיצאו בגלל הערכה מחדש.", level: 3, source: "מקורית", ref: "סעיפים 40, 46" }),
  askNumber({ id: "x-cap", skill: SKILL, prompt: "דמי שכירות של 100,000 ש״ח בסוף כל שנה, צמודים למדד, אבל העלייה מוגבלת ל-3% בשנה. ב-31.12, אחרי התשלום, נשארו 3 תשלומים, בריבית 5%. ביום זה התשלומים הבאים מתעדכנים לפי המדד, שעלה ב-4.5%. מהי ההתחייבות אחרי העדכון?", answer: P_CAP, steps: ["התשלום עדיין תלוי במדד, והוא מתעדכן לפי הנמוך מבין עליית המדד לבין התקרה", `100,000 × 1.03 = ${fmt(P_CAP_PAY)}`, `=PV(5%;3;-103000) → ${fmt(P_CAP)}. הריבית נשארת 5% (סעיף 43)`], trap: "לעדכן ב-4.5%, או לחזות עליות של השנים הבאות.", level: 2, source: "מקורית", ref: "סעיפים 27(ב), 28, 42(ב)" }),
  askNumber({ id: "x-exit", skill: SKILL, prompt: "ב-31.12, אחרי התשלום, התחייבות החכירה 300,000 ש״ח ונכס זכות השימוש 270,000 ש״ח. לחוכר הייתה אופציה לסיים את החכירה בקנס של 40,000 ש״ח, ובתקופה הניחו שלא יממש. ביום זה הוא מימש, שילם את הקנס ועזב. כמה הפסד נרשם?", answer: P_EXIT, steps: ["מימוש אופציה שלא נכללה משנה את התקופה (סעיף 21(א)). ההתחייבות יורדת לקנס, 40,000, והנכס יורד באותו סכום", "300,000 − 40,000 = 260,000. הנכס: 270,000 − 260,000 = 10,000", `לא נשארה תקופה, ולכן מה שנשאר בנכס נמחק: הפסד של ${fmt(P_EXIT)}`], trap: "לרשום רווח של 30,000, ההפרש בין ההתחייבות לנכס, ולשכוח את הקנס.", level: 3, source: "מקורית", ref: "סעיפים 21, 39" }),
  askNumber({ id: "x-lsr-rate", skill: SKILL, prompt: "מחכיר שאינו סוחר. 4 תקבולים של 100,000 ש״ח בסוף כל שנה, ושייר לא מובטח של 20,000 ש״ח. הריבית הגלומה 7%. ערך הנכס בספרים 330,000 ש״ח, והמחכיר שילם 5,000 ש״ח עלויות ישירות. השווי ההוגן לא נתון, והחכירה מימונית. כמה רווח נרשם במועד התחילה?", answer: P_LSR, steps: ["ההשקעה נטו היא ערך נוכחי בריבית הגלומה של התקבולים ושל השייר", `=PV(7%;4;-100000;-20000) → ${fmt(P_LSR_NI)}`, `${fmt(P_LSR_NI)} − 330,000 − 5,000 = ${fmt(P_LSR)}. לפי הגדרת הריבית הגלומה, זה בדיוק השווי ההוגן פחות הערך בספרים`], trap: "לא להוריד את העלויות הישירות. הריבית הגלומה מחושבת כך שההשקעה נטו כבר כוללת אותן, והמזומן ששולם עליהן יצא.", level: 3, source: "הרצאה", ref: "נספח א׳, סעיפים 67–70" }),
  ask({ id: "x-expect", skill: SKILL, prompt: "מחכיר בחכירה מימונית. באמצע השנה החוכר מודיע שכבר לא מתכוון לממש אופציית הארכה שנכללה בתקופה. החוזה לא השתנה, והאופציה עוד לא פקעה. מה המחכיר רושם?", options: ["כלום. אין תיקון, ושינוי בהערכה לא משנה את ההשקעה נטו", "הפסד, במדידה מחדש בריבית המקורית", "מדידה מחדש בריבית של היום, כנגד ההכנסות", "סיווג מחדש לתפעולית"], answer: 0, why: "סעיף 20 עוסק בחוכר. סעיף 21 משנה תקופה רק כשהתקופה שאי אפשר לבטל משתנה, וסעיף 66 אומר ששינוי באומדן לא משנה סיווג. ההשקעה נטו משתנה בתיקון (סעיפים 79, 80) או בבדיקת השייר (סעיף 77). בשני מבחני עבר נרשם כאן הפסד, ויש לשאול את המרצה.", trap: "להעתיק מהחוכר. לחוכר יש סעיף 20, ולמחכיר אין.", level: 3, source: "מקורית", ref: "סעיפים 20, 21, 66" }),
  ask({ id: "x-put", skill: SKILL, prompt: "יצרן מכר ללקוח מכונה ב-500,000 ש״ח. ללקוח זכות למכור אותה בחזרה ליצרן כעבור שנתיים ב-400,000 ש״ח, והשווי הצפוי שלה אז 250,000 ש״ח. איך היצרן מטפל?", options: ["חכירה. ההכנסה היא רק 100,000 ש״ח, לאורך שנתיים, ו-400,000 ש״ח הם התחייבות", "מכירה: הכנסה של 500,000 ש״ח מיד", "מימון: הלוואה של 500,000 ש״ח, עם ריבית", "מכירה עם זכות החזרה: הכנסה של 100,000 ש״ח מיד"], answer: 0, why: "זו אופציית מכר בידי הלקוח, במחיר נמוך ממחיר המכירה. מחיר ההחזרה גבוה בהרבה מהשווי הצפוי, ולכן ללקוח יש תמריץ כלכלי משמעותי לממש (IFRS 15 סעיפים ב70, ב71). אז זו חכירה, והיצרן הוא המחכיר. מה שהלקוח יקבל בחזרה אינו הכנסה.", trap: "לבחור במימון. מימון הוא כשמחיר ההחזרה לפחות כמחיר המכירה, וגבוה מהשווי הצפוי (ב73).", level: 3, source: "מקורית", ref: "IFRS 15 סעיפים ב70–ב73" }),
  askNumber({ id: "x-tax", skill: SKILL, prompt: "ב-1.1 חברה הכירה בהתחייבות חכירה ובנכס זכות שימוש של 400,000 ש״ח כל אחד. לצורכי מס התשלומים מותרים בניכוי כשהם משולמים, ושיעור המס 25%. ב-31.12, אחרי התשלום, הנכס 320,000 ש״ח וההתחייבות 330,000 ש״ח. מהי יתרת נכס המסים הנדחים נטו ב-31.12?", answer: P_TAX, steps: ["לנכס ולהתחייבות אין בסיס מס. ב-1.1 נוצרו הפרש חייב במס והפרש מותר בניכוי, שווים, ולכן פטור ההכרה לראשונה לא חל (IAS 12 סעיפים 15(ב)(iii), 22א): נכס מסים נדחים 100,000 והתחייבות 100,000", "ב-31.12: נכס 330,000 × 25% = 82,500, התחייבות 320,000 × 25% = 80,000", `נטו: ${fmt(P_TAX)} נכס, אם מתקיימים תנאי הקיזוז`], trap: "לא לרשום מס נדחה בגלל פטור ההכרה לראשונה. בחכירה ההפרשים שווים, ולכן הפטור לא חל.", level: 3, source: "מקורית", ref: "IAS 12 סעיפים 15, 22א" }),
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
  "x-swap-late": "ls-what-swap",
  "x-consent": "ls-term-consent",
  "x-fees": "ls-term-fees",
  "x-insure": "ls-term-fees",
  "x-improve": "ls-sub-improve",
  "x-stub": "ls-chg-stub",
  "x-usd": "ls-chg-usd",
  "x-later": "ls-chg-mod",
  "x-sameday": "ls-chg-sameday",
  "x-cap": "ls-chg-index",
  "x-exit": "ls-chg-exit",
  "x-lsr-rate": "ls-lsr-rate",
  "x-expect": "ls-lmd-expect",
  "x-put": "ls-spc-ifrs15",
  "x-tax": "ls-spc-tax",
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
  description: "שבע שאלות ארוכות ברמת מועצה, בלי רמז לנושא, עם פתרון מלא. לפניהן מפה של כל התקן והנקודות הקשות, ואחריהן תרגול מעורב.",
  goal: "לזהות לבד מה השאלה דורשת, ולפתור שאלה ארוכה ברמת מבחן, עד הדוחות הכספיים.",
  outcomes: [
    "לנווט בכל התקן לפי שאלה אחת: מה לפניי",
    "לפתור שאלה בחודשים, עם חכירות משנה ושווי הוגן",
    "לפתור שאלה עם ערבות, תשלום חצי שנתי ומעבר לנדל״ן להשקעה",
    "לפתור חוזה אחד בשני הספרים, ולהסביר למה התוצאות שונות",
    "לחבר מכירה וחכירה בחזרה, תשלום מראש ותיקון שמקטין היקף",
    "לפתור חוכר עם שיפורים במושכר, תיקון באמצע שנה וחכירה צמודה לדולר",
    "לפתור מחכיר עם רכיב שירות, ריבית בלי שווי הוגן, ותיקון שהופך את החכירה לתפעולית",
    "לחבר חכירת משנה עם תמריץ, מס נדחה, חכירה שעוד לא התחילה ומכירה עם זכות לקנות בחזרה",
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
    { id: "ls-exm-e", title: "מבחן 5: חנות משופצת ומכונה בדולרים" },
    { id: "ls-exm-f", title: "מבחן 6: קו ייצור עם תחזוקה" },
    { id: "ls-exm-g", title: "מבחן 7: מחסן, משרדים ומטה ישן" },
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
    "מכירה וחכירה בחזרה: רווח רק על החלק שעבר. אם המוכר יכול לקנות בחזרה, אין מכירה בכלל.",
    "תיקון באמצע שנה: קודם מגלגלים את ההתחייבות ליום התיקון, ורק אחר כך מודדים מחדש.",
    "חכירה בדולר: ההתחייבות בשער של היום, הנכס בשער של יום התחילה.",
  ],
};
