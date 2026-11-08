import { pvEnd, rateFor } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import type { TestEnd, TestNode } from "./what";

const r = Math.round;

/** Land and buildings: paragraphs ב55 to ב57. */
export const LAND_WALK: Record<string, TestNode | TestEnd> = {
  material: { q: "סכום הקרקע מהותי לחכירה?", par: "סעיף ב57", help: "אם לא, אפשר לטפל בהכול כיחידה אחת, לפי החיים של המבנה.", answers: [{ label: "כן", to: "reliable" }, { label: "לא", to: "one" }] },
  reliable: { q: "אפשר להקצות את התשלומים בין הקרקע למבנה באופן מהימן?", par: "סעיף ב56", help: "לפי השווי ההוגן היחסי של זכויות החכירה בכל מרכיב, במועד ההתקשרות.", answers: [{ label: "כן", to: "two" }, { label: "לא", to: "both" }] },
  both: { q: "ברור ששני המרכיבים הם חכירות תפעוליות?", par: "סעיף ב56", help: "מספיק שאחד מהם לא ברור, למשל מבנה שמוחכר לרוב חייו.", answers: [{ label: "כן", to: "allOp" }, { label: "לא", to: "allFin" }] },
  one: { lease: true, verdict: "יחידה אחת", why: "מסווגים את הכול פעם אחת, ואורך החיים הוא של המבנה (סעיף ב57)." },
  two: { lease: true, verdict: "שתי חכירות", why: "כל מרכיב מקבל את חלקו בתשלומים ובשווי, ומסווג לבדו (סעיף ב55)." },
  allOp: { lease: true, verdict: "הכול תפעולית", why: "החריג של סעיף ב56." },
  allFin: { lease: true, verdict: "הכול מימונית", why: "כשאי אפשר להקצות, ולא ברור ששניהם תפעוליים (סעיף ב56)." },
};
export const LAND_WALK_START = "material";

/** Classifying a sublease: paragraph ב58. */
export const SUB_WALK: Record<string, TestNode | TestEnd> = {
  short: { q: "החכירה הראשית היא לטווח קצר, והחברה יישמה עליה את ההקלה?", par: "סעיף ב58(א)", help: "ההקלה מהשיעור הרביעי: בלי נכס ובלי התחייבות.", answers: [{ label: "כן", to: "op" }, { label: "לא", to: "term" }] },
  term: { q: "חכירת המשנה מכסה את החלק העיקרי של זכות השימוש שנשארה?", par: "סעיף ב58(ב)", help: "מודדים מול השנים שנשארו בחכירה הראשית, ולא מול חיי הבניין.", answers: [{ label: "כן", to: "fin" }, { label: "לא", to: "value" }] },
  value: { q: "הערך הנוכחי של התשלומים הוא למעשה כל השווי ההוגן של זכות השימוש?", par: "סעיף ב58(ב)", help: "השווי של זכות השימוש, ולא של הנכס עצמו.", answers: [{ label: "כן", to: "fin" }, { label: "לא", to: "op" }] },
  fin: { lease: true, verdict: "חכירת משנה מימונית", why: "נכס זכות השימוש יוצא, ובמקומו השקעה נטו." },
  op: { lease: true, verdict: "חכירת משנה תפעולית", why: "נכס זכות השימוש נשאר, ועליו הכנסה בקו ישר." },
};
export const SUB_WALK_START = "short";

/** Sale and leaseback: paragraphs ב46, 99 to 103. */
export const SLB_WALK: Record<string, TestNode | TestEnd> = {
  control: { q: "החוכר שלט בנכס לפני שהועבר למחכיר?", par: "סעיף ב46", help: "אם הוא רק עבר בידיו בדרך, למשל נכס שנקנה מיצרן עבור המחכיר, זו לא עסקה כזו.", answers: [{ label: "כן", to: "sale" }, { label: "לא", to: "plain" }] },
  sale: { q: "ההעברה היא מכירה לפי IFRS 15?", par: "סעיף 99", help: "הקונה השיג שליטה: בעלות משפטית, חזקה, סיכונים והטבות, וזכות לתשלום.", answers: [{ label: "כן", to: "price" }, { label: "לא", to: "loan" }] },
  price: { q: "התמורה שווה לשווי ההוגן, ודמי החכירה בשיעורי שוק?", par: "סעיף 101", help: "תמורה או דמי חכירה נמוכים מהשוק הם תנאים מתחת לשוק. תמורה או דמי חכירה גבוהים מהשוק הם תנאים מעל השוק. מתקנים לפני שמחשבים רווח.", answers: [{ label: "כן", to: "fair" }, { label: "תנאים מתחת לשוק", to: "low" }, { label: "תנאים מעל השוק", to: "high" }] },
  plain: { lease: true, verdict: "חכירה רגילה", why: "אין כאן מכירה של החוכר. מטפלים בחכירה לפי הכללים הרגילים (סעיף ב47)." },
  loan: { lease: true, verdict: "הלוואה", why: "הנכס נשאר אצל המוכר, והכסף הוא התחייבות פיננסית (סעיף 103)." },
  fair: { lease: true, verdict: "רווח על החלק שנמכר", why: "רק על הזכויות שעברו לקונה (סעיף 100)." },
  low: { lease: true, verdict: "ההפרש הוא מקדמה", why: "תשלום מראש על החכירה (סעיף 101(א))." },
  high: { lease: true, verdict: "ההפרש הוא הלוואה", why: "מימון נוסף מהקונה (סעיף 101(ב))." },
};
export const SLB_WALK_START = "control";

/** To sort: which way a sublease goes. */
export const SUB_ITEMS: { text: string; answer: "fin" | "op"; why: string }[] = [
  { text: "חכירה ראשית ל-10 שנים. בתחילת שנה 7 החוכר מחכיר את הנכס בחכירת משנה ל-4 השנים שנשארו.", answer: "fin", why: "100% מזכות השימוש שנשארה, גם אם לנכס עצמו יש עוד שנים רבות." },
  { text: "חכירה ראשית ל-5 שנים. ביום הראשון החוכר מחכיר בחכירת משנה לשנתיים.", answer: "op", why: "40% מזכות השימוש, ואין סימן אחר." },
  { text: "חכירה ראשית ל-10 חודשים, עם ההקלה לטווח קצר. החוכר מחכיר בחכירת משנה ל-9 חודשים.", answer: "op", why: "סעיף ב58(א): תמיד תפעולית." },
  { text: "נשארו 6 שנים בחכירה הראשית. חכירת משנה ל-2 שנים, והערך הנוכחי 95% מהשווי ההוגן של זכות השימוש.", answer: "fin", why: "הערך הנוכחי הוא למעשה כל השווי של זכות השימוש." },
];
export const SUB_OPTIONS: [string, string][] = [
  ["fin", "מימונית"],
  ["op", "תפעולית"],
];

/** Land and buildings, worked. */
export const LAND = { payment: 60_000, years: 8, fairValue: 360_000, landPct: 25, buildingLife: 10, unitLife: 12, buildingEnd: 12_000, landEnd: 100_000, buildingBV: 250_000, landBV: 40_000 };
export const LAND_FV = (LAND.fairValue * LAND.landPct) / 100;
export const BLD_FV = LAND.fairValue - LAND_FV;
export const LAND_PAY = (LAND.payment * LAND.landPct) / 100;
export const BLD_PAY = LAND.payment - LAND_PAY;
export const BLD_RATE = rateFor(BLD_FV, LAND.years, BLD_PAY, LAND.buildingEnd);
export const LAND_RATE = rateFor(LAND_FV, LAND.years, LAND_PAY, LAND.landEnd);
export const LAND_PV = r(pvEnd(LAND_RATE, LAND.years, LAND_PAY));
export const BLD_GAIN = BLD_FV - LAND.buildingBV;
export const BLD_INT = r(BLD_FV * BLD_RATE);
export const BLD_CLOSE = BLD_FV + BLD_INT - BLD_PAY;
export const ALL_END = LAND.buildingEnd + LAND.landEnd;
export const ALL_RATE = rateFor(LAND.fairValue, LAND.years, LAND.payment, ALL_END);
export const ALL_GAIN = LAND.fairValue - LAND.buildingBV - LAND.landBV;
export const ALL_INT = r(LAND.fairValue * ALL_RATE);
export const ALL_CLOSE = LAND.fairValue + ALL_INT - LAND.payment;
export const ALL_PV = r(pvEnd(ALL_RATE, LAND.years, LAND.payment));

/** A hall, sublet at an operating lease; then the same hall at fair value. */
export const HALL = { payment: 200_000, years: 8, rate: 0.06, done: 2, subPayment: 210_000, subYears: 3, subRate: 0.07, rightFV: 900_000, left: 6 };
export const HALL_L = r(pvEnd(HALL.rate, HALL.years, HALL.payment));
export const HALL_DEP = r(HALL_L / HALL.years);
export const HALL_ROU2 = HALL_L - HALL_DEP * 2;
export const HALL_ROU3 = HALL_ROU2 - HALL_DEP;
export const HALL_L2 = r(pvEnd(HALL.rate, HALL.left, HALL.payment));
export const HALL_INT = r(HALL_L2 * HALL.rate);
export const HALL_CLOSE = HALL_L2 + HALL_INT - HALL.payment;
export const HALL_NC = r(pvEnd(HALL.rate, HALL.left - 2, HALL.payment));
export const HALL_SUB_PV = r(pvEnd(HALL.subRate, HALL.subYears, HALL.subPayment));
export const IP = { fairValue: 1_050_000, endFV: 1_010_000 };
export const IP_HALF = r(HALL_DEP / 2);
export const IP_AT = HALL_ROU2 - IP_HALF;
export const IP_OCI = IP.fairValue - IP_AT;
export const IP_LOSS = IP.fairValue - IP.endFV;

/** Rates that are not annual. */
export const MON = { payment: 20_000, months: 96, rate: 0.008 };
export const MON_L = r(pvEnd(MON.rate, MON.months, MON.payment));
export const MON_OPEN = r(pvEnd(MON.rate, MON.months - 24, MON.payment));
export const MON_CLOSE = r(pvEnd(MON.rate, MON.months - 36, MON.payment));
export const MON_PAID = MON.payment * 12;
export const MON_INT = MON_CLOSE + MON_PAID - MON_OPEN;
export const HALF = { payment: 300_000, periods: 6, annual: 0.07 };
export const HALF_RATE = (1 + HALF.annual) ** 0.5 - 1;
export const HALF_PV = r(pvEnd(HALF_RATE, HALF.periods, HALF.payment));
export const HALF_WRONG = r(pvEnd(HALF.annual / 2, HALF.periods, HALF.payment));
export const FVM = { payment: 30_000, months: 60, fairValue: 1_500_000 };
export const FVM_RATE = rateFor(FVM.fairValue, FVM.months, FVM.payment);

/** Sale and leaseback. */
export const SLB = { bookValue: 1_300_000, fairValue: 2_200_000, payment: 130_000, years: 20, rate: 0.05, life: 40, low: 2_100_000, high: 2_400_000 };
export const SLB_GAP = SLB.fairValue - SLB.bookValue;
export const SLB_L = r(pvEnd(SLB.rate, SLB.years, SLB.payment));
export const SLB_SHARE = SLB_L / SLB.fairValue;
export const SLB_ROU = r(SLB.bookValue * SLB_SHARE);
export const SLB_GAIN = SLB.fairValue + SLB_ROU - SLB.bookValue - SLB_L;
export const SLB_DEP = r(SLB_ROU / SLB.years);
export const SLB_INT = r(SLB_L * SLB.rate);
export const SLB_LOAN_RATE = rateFor(SLB.fairValue, SLB.years, SLB.payment);
export const SLB_LOAN_INT = r(SLB.fairValue * SLB_LOAN_RATE);
export const SLB_LOAN_CLOSE = SLB.fairValue + SLB_LOAN_INT - SLB.payment;
export const LOW_PRE = SLB.fairValue - SLB.low;
export const LOW_SHARE = (SLB_L + LOW_PRE) / SLB.fairValue;
export const LOW_ROU = r(SLB.bookValue * LOW_SHARE);
export const LOW_GAIN = SLB.low + LOW_ROU - SLB.bookValue - SLB_L;
export const LOW_RENT = (SLB.payment * SLB.years + LOW_PRE) / SLB.years;
export const LOW_FALL = LOW_RENT - SLB.payment;
export const HIGH_LOAN = SLB.high - SLB.fairValue;
export const HIGH_L = SLB_L - HIGH_LOAN;
export const HIGH_SHARE = HIGH_L / SLB.fairValue;
export const HIGH_ROU = r(SLB.bookValue * HIGH_SHARE);
export const HIGH_GAIN = SLB.high + HIGH_ROU - SLB.bookValue - SLB_L;
export const HIGH_PMT = r((HIGH_LOAN * SLB.rate) / (1 - (1 + SLB.rate) ** -SLB.years));
export const HIGH_RENT = SLB.payment - HIGH_PMT;
export const HIGH_INT = HIGH_LOAN * SLB.rate;

/** The closing question: three parties to one building. */
export const CH = { payment: 400_000, years: 12, firstYears: 9, optionYears: 3, marketRent: 550_000, life: 13, fairValue: 2_860_000, bookValue: 1_900_000, implicit: 0.09, ibr: 0.1, costs: 5_000, renovation: 60_000, subPayment: 470_000, subYears: 11, subRate: 0.07, subIbr: 0.08 };
export const CH_HEAD_PV = r(pvEnd(CH.implicit, CH.years, CH.payment));
export const CH_HEAD_COSTS = CH_HEAD_PV - CH.fairValue;
export const CH_HEAD_I1 = r(CH_HEAD_PV * CH.implicit);
export const CH_HEAD_C1 = CH_HEAD_PV + CH_HEAD_I1 - CH.payment;
export const CH_HEAD_I2 = r(CH_HEAD_C1 * CH.implicit);
export const CH_HEAD_C2 = CH_HEAD_C1 + CH_HEAD_I2 - CH.payment;
export const CH_HEAD_NC = r(pvEnd(CH.implicit, CH.years - 3, CH.payment));
export const CH_L = r(pvEnd(CH.ibr, CH.years, CH.payment));
export const CH_ROU = CH_L + CH.costs;
export const CH_DEP = r(CH_ROU / CH.years);
export const CH_ROU1 = CH_ROU - CH_DEP;
export const CH_I1 = r(CH_L * CH.ibr);
export const CH_C1 = CH_L + CH_I1 - CH.payment;
export const CH_I2 = r(CH_C1 * CH.ibr);
export const CH_C2 = CH_C1 + CH_I2 - CH.payment;
export const CH_NC = r(pvEnd(CH.ibr, CH.years - 3, CH.payment));
export const CH_NI = r(pvEnd(CH.subRate, CH.subYears, CH.subPayment));
export const CH_GAIN = CH_NI - CH_ROU1 - CH.renovation;
export const CH_NI_INT = r(CH_NI * CH.subRate);
export const CH_NI_CLOSE = CH_NI + CH_NI_INT - CH.subPayment;
export const CH_NI_NC = r(pvEnd(CH.subRate, CH.subYears - 2, CH.subPayment));
export const CH_TOTAL = CH_GAIN + CH_NI_INT - CH_I2;
export const CH_S_L = r(pvEnd(CH.subIbr, CH.subYears, CH.subPayment));
export const CH_S_DEP = r(CH_S_L / CH.subYears);
export const CH_S_ROU = CH_S_L - CH_S_DEP;
export const CH_S_INT = r(CH_S_L * CH.subIbr);
export const CH_S_CLOSE = CH_S_L + CH_S_INT - CH.subPayment;
export const CH_S_NC = r(pvEnd(CH.subIbr, CH.subYears - 2, CH.subPayment));

const P_SLB_L = r(pvEnd(0.06, 10, 50_000));
const P_SLB_ROU = r((350_000 * P_SLB_L) / 500_000);
const P_SLB_GAIN = 500_000 + P_SLB_ROU - 350_000 - P_SLB_L;
const P_SLB_LOW_ROU = r((350_000 * (P_SLB_L + 40_000)) / 500_000);
const P_SLB_HIGH_ROU = r((350_000 * (P_SLB_L - 30_000)) / 500_000);
const P_SLB_HIGH_GAIN = 530_000 + P_SLB_HIGH_ROU - 350_000 - P_SLB_L;
const P_HALF = r(pvEnd(0.04, 4, 200_000));
const P_MON = r(pvEnd(0.01, 36, 10_000));
const P_MON_OPEN = r(pvEnd(0.01, 48, 10_000));

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  ask({ id: "land-sep", skill: "קרקע ומבנה", prompt: "מחכיר מחכיר בניין עם הקרקע שמתחתיו. סכום הקרקע מהותי. איך מסווגים?", options: ["כל מרכיב בנפרד", "הכול כמבנה", "הכול כקרקע", "לפי המרכיב הגדול"], answer: 0, why: "סעיף ב55.", trap: "לסווג חכירה אחת לפי הבניין. קרקע ומבנה הם נכסים שונים מאוד.", level: 1, source: "מקורית", ref: "סעיף ב55" }),
  ask({ id: "land-life", skill: "קרקע ומבנה", prompt: "חכירת קרקע ל-30 שנים, בלי העברת בעלות ובלי אופציה. למה התקופה הארוכה לא מספיקה כדי לסווג אותה כמימונית?", options: ["לקרקע יש בדרך כלל אורך חיים כלכליים לא מוגדר", "כי קרקע לא יכולה להיות מוחכרת", "כי קרקע תמיד חוזרת במחיר נמוך", "כי סעיף ב55 אוסר על כך"], answer: 0, why: "סעיף ב55 מפנה לכך במפורש, ולכן 30 שנים הן לא החלק העיקרי של חייה.", trap: "להשוות את התקופה לחיי המבנה שעליה.", level: 2, source: "מקורית", ref: "סעיף ב55" }),
  askNumber({ id: "land-pay", skill: "קרקע ומבנה", prompt: "חכירת בניין: 50,000 ש״ח בשנה. ביום ההתקשרות 30% מהשווי ההוגן של זכויות החכירה בקרקע, ו-70% במבנה. כמה מהתשלום השנתי מוקצה למבנה?", answer: 35_000, steps: ["50,000 × 70% = 35,000 (סעיף ב56)"], trap: "להקצות לפי הערך בספרים. ההקצאה לפי שווי הוגן יחסי.", level: 1, source: "מקורית", ref: "סעיף ב56" }),
  askNumber({ id: "land-gain", skill: "קרקע ומבנה", prompt: "מחכיר שאינו סוחר. שווי הבניין כולו 500,000 ש״ח, 75% מזה במבנה. חכירת המבנה מימונית, וחכירת הקרקע תפעולית. ערך המבנה בספרים 340,000 ש״ח. בלי עלויות ישירות. כמה רווח הון נרשם?", answer: 35_000, steps: ["השקעה נטו במבנה: 500,000 × 75% = 375,000", "375,000 − 340,000 = 35,000"], trap: "לגרוע גם את הקרקע. היא בחכירה תפעולית, ולכן נשארת בספרים.", level: 2, source: "מקורית", ref: "סעיפים 67, ב55" }),
  ask({ id: "land-unreliable", skill: "קרקע ומבנה", prompt: "חכירת בניין ל-9 שנים, כשלמבנה 10 שנות חיים. סכום הקרקע מהותי, ואי אפשר להקצות את התשלומים באופן מהימן. איך מסווגים?", options: ["הכול מימונית", "הכול תפעולית", "המבנה מימונית והקרקע תפעולית", "לא מכירים עד שאפשר להקצות"], answer: 0, why: "סעיף ב56: מימונית, אלא אם ברור ששניהם תפעוליים. כאן המבנה בוודאי לא.", trap: "להפריד בכל זאת. בלי הקצאה מהימנה אין הפרדה.", level: 2, source: "מקורית", ref: "סעיף ב56" }),
  ask({ id: "land-both-op", skill: "קרקע ומבנה", prompt: "חכירת בניין ל-3 שנים, כשלמבנה 40 שנות חיים, והתשלומים נמוכים בהרבה מהשווי. סכום הקרקע מהותי, ואי אפשר להקצות את התשלומים באופן מהימן. איך מסווגים?", options: ["הכול תפעולית, כי ברור ששני המרכיבים כאלה", "הכול מימונית, כי אי אפשר להקצות", "המבנה מימונית והקרקע תפעולית", "מקצים לפי ערך בספרים"], answer: 0, why: "החריג בסעיף ב56.", trap: "לזכור רק את ברירת המחדל של מימונית.", level: 3, source: "מקורית", ref: "סעיף ב56" }),
  ask({ id: "land-immaterial", skill: "קרקע ומבנה", prompt: "סכום הקרקע לא מהותי, והחברה מטפלת בבניין כיחידה אחת. לאיזה אורך חיים משווים את תקופת החכירה?", options: ["אורך החיים של המבנה", "אורך החיים של הקרקע", "הארוך מבין השניים", "ממוצע משוקלל"], answer: 0, why: "סעיף ב57.", trap: "להתבלבל בגלל הקרקע, שחייה לא מוגדרים.", level: 2, source: "מקורית", ref: "סעיף ב57" }),
  askNumber({ id: "land-whole", skill: "קרקע ומבנה", prompt: "אי אפשר להקצות, והכול מימונית. מחכיר שאינו סוחר. שווי הבניין 600,000 ש״ח. בספרים: מבנה 350,000 ש״ח וקרקע 100,000 ש״ח. בלי עלויות ישירות. כמה רווח הון נרשם?", answer: 150_000, steps: ["600,000 − 350,000 − 100,000 = 150,000"], trap: "לגרוע רק את המבנה. כשהכול מימונית, גם הקרקע יוצאת.", level: 3, source: "מקורית", ref: "סעיפים 67, ב56" }),
  ask({ id: "sub-classify", skill: "חכירת משנה", prompt: "חכירה ראשית של בניין ל-10 שנים, וחיי הבניין 50 שנה. בתחילת שנה 7 החוכר מחכיר אותו בחכירת משנה ל-4 השנים שנשארו. איך מסווגים?", options: ["מימונית: 100% מזכות השימוש", "תפעולית: 8% מחיי הבניין", "תפעולית תמיד", "לפי הסיווג אצל המחכיר הראשי"], answer: 0, why: "סעיף ב58(ב): מול נכס זכות השימוש, ולא מול נכס הבסיס.", trap: "להשוות לחיי הבניין. מה שהחוכר מוכר הוא זכות השימוש שלו.", level: 1, source: "מקורית", ref: "סעיף ב58(ב)" }),
  ask({ id: "sub-short", skill: "חכירת משנה", prompt: "חברה יישמה את הקלת הטווח הקצר על חכירה ראשית, והיא מחכירה את כל התקופה בחכירת משנה. איך מסווגים?", options: ["תפעולית", "מימונית, כי זו כל התקופה", "לפי הערך הנוכחי", "אי אפשר לסווג"], answer: 0, why: "סעיף ב58(א).", trap: "להפעיל את המבחן הרגיל. כאן אין בכלל נכס זכות שימוש בספרים.", level: 2, source: "מקורית", ref: "סעיף ב58(א)" }),
  ask({ id: "sub-low", skill: "חכירת משנה", prompt: "חברה חוכרת מחשבים ניידים זולים, ומתכוונת להחכיר את המחשבים בחכירת משנה ללקוחות. האם היא יכולה ליישם על החכירה הראשית את הקלת הערך הנמוך?", options: ["לא", "כן, כי הנכס זול", "כן, אם חכירת המשנה תפעולית", "רק אם החכירה קצרה"], answer: 0, why: "סעיף ב7.", trap: "לבדוק רק את ערך הנכס. חכירת משנה מוציאה את ההקלה.", level: 2, source: "מקורית", ref: "סעיף ב7" }),
  ask({ id: "sub-rate", skill: "חכירת משנה", prompt: "מחכיר בחכירת משנה לא יכול לקבוע בקלות את הריבית הגלומה בחכירת המשנה. באיזו ריבית ימדוד את ההשקעה נטו?", options: ["בשיעור ההיוון של החכירה הראשית, בהתאמה לעלויות ישירות", "בריבית השוק של יום החתימה", "בריבית התוספתית של חוכר המשנה", "בריבית אפס"], answer: 0, why: "סעיף 68.", trap: "לקחת את הריבית של הצד השלישי. היא שלו.", level: 2, source: "מקורית", ref: "סעיף 68" }),
  ask({ id: "sub-liab", skill: "חכירת משנה", prompt: "חוכר החכיר את כל זכות השימוש שלו בחכירת משנה מימונית. מה קורה להתחייבות החכירה שלו?", options: ["נשארת, והוא ממשיך לשלם למחכיר הראשי", "נגרעת יחד עם הנכס", "מתקזזת עם ההשקעה נטו", "עוברת לחוכר המשנה"], answer: 0, why: "יוצא רק נכס זכות השימוש. החוב למחכיר הראשי לא השתנה.", trap: "לקזז בין ההשקעה נטו להתחייבות. מדובר בשני חוזים ובשני צדדים.", level: 2, source: "מקורית", ref: "סעיפים 36, 67" }),
  askNumber({ id: "sub-gain", skill: "חכירת משנה", prompt: "חכירת משנה מימונית. ההשקעה נטו 1,100,000 ש״ח. ביום החתימה: נכס זכות שימוש 900,000 ש״ח, ושיפורים במושכר 50,000 ש״ח. כמה רווח הון נרשם?", answer: 150_000, steps: ["יוצאים: 900,000 + 50,000 = 950,000", "1,100,000 − 950,000 = 150,000"], trap: "לשכוח את השיפורים. החוכר לא ישתמש בהם יותר, ולכן גם הם יוצאים.", level: 3, source: "מקורית", ref: "סעיף 67" }),
  askNumber({ id: "sub-dep", skill: "חכירת משנה", prompt: "חכירת משנה תפעולית, והחברה מודדת נדל״ן להשקעה בעלות. ביום החתימה נכס זכות השימוש 600,000 ש״ח, ונשארו 5 שנים בחכירה הראשית. חכירת המשנה ל-2 שנים. מהו הפחת השנתי?", answer: 120_000, steps: ["הנכס נשאר, והפחת על פני השנים שנשארו בחכירה הראשית", "600,000 ÷ 5 = 120,000"], trap: "להפחית על פני שנתיים. זכות השימוש נמשכת עד סוף החכירה הראשית.", level: 2, source: "מקורית", ref: "סעיף 32" }),
  ask({ id: "ip-date", skill: "נדל״ן להשקעה", prompt: "ב-1.3 הדירקטוריון החליט להפסיק להשתמש במשרדים ולהחכיר את המשרדים בחכירת משנה תפעולית. העובדים עזבו ב-1.6, וחכירת המשנה נחתמה ב-1.6. הנדל״ן להשקעה בשווי הוגן. מתי מועד המעבר?", options: ["1.6: סיום השימוש של הבעלים", "1.3: יום ההחלטה", "31.12: יום הדוח", "אין מעבר"], answer: 0, why: "שינוי בשימוש, ולא שינוי בכוונה (IAS 40).", trap: "לעבור ביום ההחלטה. עד סיום השימוש ממשיכים להפחית.", level: 2, source: "מקורית", ref: "IAS 40 סעיפים 57, 61" }),
  askNumber({ id: "ip-oci", skill: "נדל״ן להשקעה", prompt: "ביום סיום השימוש נכס זכות השימוש בספרים 300,000 ש״ח, ושוויו ההוגן 420,000 ש״ח. הוא עובר לנדל״ן להשקעה בשווי הוגן. אין ירידות ערך קודמות. כמה נרשם ברווח כולל אחר?", answer: 120_000, steps: ["420,000 − 300,000 = 120,000 לקרן הערכה מחדש (IAS 40 סעיף 62(ב))"], trap: "לרשום ברווח או הפסד. שערוך ביום המעבר הולך כמו הערכה מחדש לפי IAS 16.", level: 2, source: "מקורית", ref: "IAS 40 סעיף 62" }),
  askNumber({ id: "ip-after", skill: "נדל״ן להשקעה", prompt: "נדל״ן להשקעה בשווי הוגן. ביום המעבר שוויו היה 420,000 ש״ח, ונוצרה קרן הערכה מחדש של 120,000 ש״ח. בסוף השנה שוויו 390,000 ש״ח. כמה הפסד נרשם ברווח או הפסד?", answer: 30_000, steps: ["420,000 − 390,000 = 30,000", "הקרן לא נוגעת: אחרי המעבר שינויי שווי הולכים לרווח או הפסד"], trap: "להוריד את הקרן. היא קפואה, ועוברת לעודפים רק בגריעה.", level: 3, source: "מקורית", ref: "IAS 40 סעיפים 35, 62" }),
  askNumber({ id: "ip-floor", skill: "נדל״ן להשקעה", prompt: "ב-1.1 נכס זכות שימוש של 1,200,000 ש״ח על שלוש קומות זהות, ונשארו 8 שנים. ב-1.7 הסתיים השימוש בקומה אחת, והיא עברה לנדל״ן להשקעה בשווי הוגן של 500,000 ש״ח. כמה נרשם ברווח כולל אחר?", answer: 125_000, steps: ["הקומה: 1,200,000 ÷ 3 = 400,000", "פחת עד 1.7: 400,000 ÷ 8 × 6/12 = 25,000", "ביום המעבר: 400,000 − 25,000 = 375,000", "500,000 − 375,000 = 125,000"], trap: "לשכוח את הפחת של חצי השנה. מפחיתים עד יום המעבר (IAS 40 סעיף 62).", level: 3, source: "מקורית", ref: "IAS 40 סעיף 62" }),
  askNumber({ id: "month-pv", skill: "ריבית", prompt: "חכירה ל-3 שנים, 10,000 ש״ח בסוף כל חודש. הריבית התוספתית החודשית 1%. מהי התחייבות החכירה במועד התחילה?", answer: P_MON, steps: [`=PV(1%;36;-10000) → ${fmt(P_MON)}`], trap: "להכניס 3 תקופות, או 12%. התקופות והריבית צריכות להיות ביחידת זמן אחת.", level: 1, source: "מקורית", ref: "סעיף 26" }),
  askNumber({ id: "month-int", skill: "ריבית", prompt: "10,000 ש״ח בסוף כל חודש, בריבית חודשית של 1%. בתחילת השנה נשארו 48 תשלומים, ובסופה 36. מהן הוצאות המימון של השנה?", answer: P_MON + 120_000 - P_MON_OPEN, steps: [`פתיחה: =PV(1%;48;-10000) → ${fmt(P_MON_OPEN)}`, `סגירה: =PV(1%;36;-10000) → ${fmt(P_MON)}`, "שולמו: 10,000 × 12 = 120,000", `ריבית = סגירה + תשלומים − פתיחה = ${fmt(P_MON)} + 120,000 − ${fmt(P_MON_OPEN)} = ${fmt(P_MON + 120_000 - P_MON_OPEN)}`], trap: "להכפיל את היתרה הפותחת ב-12%. הקרן יורדת בכל חודש.", level: 3, source: "מקורית", ref: "סעיף 36" }),
  askNumber({ id: "half-pv", skill: "ריבית", prompt: "שני תשלומים בשנה של 200,000 ש״ח, במשך שנתיים. הריבית השנתית האפקטיבית 8.16%, ושקולה ל-4% לחצי שנה. מהו הערך הנוכחי של התשלומים?", answer: P_HALF, steps: ["חצי שנה: (1 + 8.16%)^(1/2) − 1 = 4%", `=PV(4%;4;-200000) → ${fmt(P_HALF)}`], trap: "לחלק את הריבית השנתית ב-2. כאן זה נותן 4.08%, וזו לא הריבית השקולה.", level: 2, source: "מקורית", ref: "סעיף 26" }),
  ask({ id: "slb-first", skill: "מכירה וחכירה בחזרה", prompt: "חברה קנתה מכונה מיצרן, ומיד העבירה אותה למחכיר וחכרה אותה ממנו. החברה מעולם לא שלטה במכונה. מה עושים?", options: ["זו לא עסקת מכירה וחכירה בחזרה. חכירה רגילה", "מכירה וחכירה בחזרה, עם רווח חלקי", "הלוואה", "רושמים רווח מלא"], answer: 0, why: "סעיפים ב46, ב47: השאלה הראשונה היא אם החוכר שלט בנכס לפני ההעברה.", trap: "להסתכל על הניירת. גם בעלות חולפת לא מספיקה בלי שליטה.", level: 2, source: "מקורית", ref: "סעיפים ב46, ב47" }),
  ask({ id: "slb-sign", skill: "מכירה וחכירה בחזרה", prompt: "איזה מאלה הוא סימן לכך שהשליטה עברה לקונה?", options: ["הקונה קיבל בעלות משפטית, והוא נושא בסיכונים ובהטבות", "המוכר ממשיך להשתמש בנכס", "יש חוזה חכירה", "הנכס נרשם בספרי המוכר"], answer: 0, why: "סעיף 38 של IFRS 15. שימוש של המוכר הוא תוצאה של החכירה בחזרה, ולא ראיה נגד המכירה.", trap: "לחשוב שחכירה בחזרה לבדה מבטלת מכירה.", level: 1, source: "מקורית", ref: "סעיף 99" }),
  askNumber({ id: "slb-loan", skill: "מכירה וחכירה בחזרה", prompt: "העברת נכס אינה מכירה. המוכר קיבל 500,000 ש״ח. ערך הנכס בספרים 300,000 ש״ח. כמה התחייבות פיננסית הוא רושם?", answer: 500_000, steps: ["התחייבות פיננסית בגובה התקבולים (סעיף 103(א)). הנכס נשאר בספרים"], trap: "לגרוע את הנכס ולרשום רווח. אין מכירה, אז אין רווח.", level: 1, source: "מקורית", ref: "סעיף 103" }),
  askNumber({ id: "slb-gain", skill: "מכירה וחכירה בחזרה", prompt: "מכירה וחכירה בחזרה. ערך בספרים 350,000 ש״ח, שווי הוגן ותמורה 500,000 ש״ח. חוכרים בחזרה ל-10 שנים, ב-50,000 ש״ח בסוף כל שנה, בריבית 6%. כמה רווח נרשם?", answer: P_SLB_GAIN, steps: [`התחייבות: =PV(6%;10;-50000) → ${fmt(P_SLB_L)}`, `נכס זכות שימוש: 350,000 × ${fmt(P_SLB_L)} ÷ 500,000 = ${fmt(P_SLB_ROU)}`, `רווח: 500,000 + ${fmt(P_SLB_ROU)} − 350,000 − ${fmt(P_SLB_L)} = ${fmt(P_SLB_GAIN)}`], trap: "לרשום את כל 150,000. הרווח הוא רק על החלק שלא נשאר בידי החברה.", level: 2, source: "מקורית", ref: "סעיף 100(א)" }),
  askNumber({ id: "slb-rou", skill: "מכירה וחכירה בחזרה", prompt: "מכירה וחכירה בחזרה בשווי הוגן. ערך בספרים 600,000 ש״ח, שווי הוגן 1,000,000 ש״ח, והתחייבות החכירה 700,000 ש״ח. מהי עלות נכס זכות השימוש?", answer: 420_000, steps: ["החלק שנשאר: 700,000 ÷ 1,000,000 = 70%", "600,000 × 70% = 420,000 (סעיף 100(א))"], trap: "להשוות את הנכס להתחייבות, כמו בחכירה רגילה. כאן הוא חלק מהערך בספרים.", level: 2, source: "מקורית", ref: "סעיף 100(א)" }),
  askNumber({ id: "slb-low", skill: "מכירה וחכירה בחזרה", prompt: "ערך בספרים 350,000 ש״ח, שווי הוגן 500,000 ש״ח, ותמורה 460,000 ש״ח. חוכרים בחזרה ל-10 שנים, ב-50,000 ש״ח בסוף כל שנה, בריבית 6%. מהי עלות נכס זכות השימוש?", answer: P_SLB_LOW_ROU, steps: ["התמורה נמוכה ב-40,000: מקדמה על החכירה (סעיף 101(א))", `החלק שנשאר: (${fmt(P_SLB_L)} + 40,000) ÷ 500,000`, `350,000 × ${fmt(P_SLB_L + 40_000)} ÷ 500,000 = ${fmt(P_SLB_LOW_ROU)}`], trap: "לשכוח את המקדמה בחלק שנשאר. היא חלק מזכות השימוש שהחברה שילמה עליה.", level: 3, source: "מקורית", ref: "סעיף 101(א)" }),
  askNumber({ id: "slb-high", skill: "מכירה וחכירה בחזרה", prompt: "ערך בספרים 350,000 ש״ח, שווי הוגן 500,000 ש״ח, ותמורה 530,000 ש״ח. חוכרים בחזרה ל-10 שנים, ב-50,000 ש״ח בסוף כל שנה, בריבית 6%. כמה רווח נרשם?", answer: P_SLB_HIGH_GAIN, steps: ["התמורה גבוהה ב-30,000: הלוואה (סעיף 101(ב))", `חכירה: ${fmt(P_SLB_L)} − 30,000 = ${fmt(P_SLB_L - 30_000)}`, `נכס זכות שימוש: 350,000 × ${fmt(P_SLB_L - 30_000)} ÷ 500,000 = ${fmt(P_SLB_HIGH_ROU)}`, `רווח: 530,000 + ${fmt(P_SLB_HIGH_ROU)} − 350,000 − ${fmt(P_SLB_L)} = ${fmt(P_SLB_HIGH_GAIN)}`], trap: "לכלול את 30,000 ברווח. זה חוב, ולא תמורה על הנכס.", level: 3, source: "מקורית", ref: "סעיף 101(ב)" }),
  ask({ id: "slb-buyer", skill: "מכירה וחכירה בחזרה", prompt: "ההעברה היא מכירה. מה עושה הקונה-מחכיר?", options: ["רושם את הנכס לפי התקן הרלוונטי, ומסווג את החכירה כרגיל", "רושם השקעה נטו בכל מקרה", "רושם הלוואה לקבל", "לא רושם כלום עד סוף החכירה"], answer: 0, why: "סעיף 100(ב).", trap: "לחשוב שעסקה כזו היא תמיד מימונית. מבחן הסיווג רגיל.", level: 2, source: "מקורית", ref: "סעיף 100(ב)" }),
  ask({ id: "slb-measure", skill: "מכירה וחכירה בחזרה", prompt: "במכירה וחכירה בחזרה, השווי ההוגן של הנכס קשה למדידה, אבל התשלומים לפי מחירי שוק ידועים. איך מודדים את התיאום?", options: ["לפי ההפרש בין הערך הנוכחי של התשלומים בחוזה ובשוק", "לא עושים תיאום", "לפי הערך בספרים", "תמיד לפי השווי ההוגן"], answer: 0, why: "סעיף 102: לפי מה שקל יותר לקבוע.", trap: "לחשוב שיש רק דרך אחת.", level: 3, source: "מקורית", ref: "סעיף 102" }),
  Object.assign(
    journal("sub-entry", "פקודת יומן", "חכירת משנה מימונית ב-1.1. ההשקעה נטו 500,000 ש״ח, ונכס זכות השימוש בספרים 430,000 ש״ח. רשמו את הפקודה ביום חכירת המשנה.", [{ account: "השקעה נטו בחכירה", dr: 500_000 }, { account: "נכס זכות שימוש", cr: 430_000 }, { account: "רווח הון", cr: 70_000 }], "הנכס יוצא, וההתחייבות נשארת. מלכודת נפוצה: לגרוע גם את התחייבות החכירה.", ["השקעה נטו בחכירה", "נכס זכות שימוש", "התחייבות חכירה", "רווח הון", "מזומן"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 67" } },
  ),
  Object.assign(
    journal("ip-entry", "פקודת יומן", "ביום סיום השימוש נכס זכות השימוש בספרים 300,000 ש״ח, והשווי ההוגן 340,000 ש״ח. הנכס עובר לנדל״ן להשקעה בשווי הוגן. רשמו את הפקודה.", [{ account: "נדל״ן להשקעה", dr: 340_000 }, { account: "נכס זכות שימוש", cr: 300_000 }, { account: "קרן הערכה מחדש", cr: 40_000 }], "עלייה ביום המעבר הולכת לרווח כולל אחר. מלכודת נפוצה: לרשום אותה כרווח ברווח או הפסד.", ["נדל״ן להשקעה", "נכס זכות שימוש", "קרן הערכה מחדש", "רווח משערוך נדל״ן", "התחייבות חכירה"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "IAS 40 סעיף 62" } },
  ),
  Object.assign(
    journal("slb-entry", "פקודת יומן", "מכירה וחכירה בחזרה בשווי הוגן. התמורה 1,000,000 ש״ח, ערך הבניין בספרים 600,000 ש״ח, התחייבות החכירה 700,000 ש״ח ונכס זכות השימוש 420,000 ש״ח. רשמו את הפקודה בספרי המוכר.", [{ account: "מזומן", dr: 1_000_000 }, { account: "נכס זכות שימוש", dr: 420_000 }, { account: "בניין", cr: 600_000 }, { account: "התחייבות חכירה", cr: 700_000 }, { account: "רווח הון", cr: 120_000 }], "הרווח: 400,000 × 30%. מלכודת נפוצה: לרשום את כל 400,000.", ["מזומן", "נכס זכות שימוש", "בניין", "התחייבות חכירה", "רווח הון", "התחייבות פיננסית"]),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 100(א)" } },
  ),
];

const traps: Trap[] = [
  {
    id: "sub-against",
    prompt: "חכירת משנה. מול מה מסווגים?",
    options: ["מול נכס זכות השימוש", "מול נכס הבסיס", "מול החכירה של חוכר המשנה", "לפי מה שהמחכיר הראשי קבע"],
    answer: 0,
    why: "סעיף ב58(ב).",
    traps: ["", "זה מה שהמחכיר הראשי עושה.", "חוכר המשנה לא מסווג.", "כל חכירה מסווגת לבדה."],
  },
  {
    id: "ip-reserve",
    prompt: "מה קורה לקרן הערכה מחדש שנוצרה במעבר לנדל״ן להשקעה?",
    options: ["נשארת קפואה, ובגריעה אפשר להעביר אותה לעודפים", "נזקפת לרווח או הפסד במכירה", "יורדת כשהשווי יורד", "מופחתת על פני החיים"],
    answer: 0,
    why: "IAS 40 סעיף 62(ב)(ii).",
    traps: ["", "המעבר לעודפים אינו עובר דרך רווח או הפסד.", "אחרי המעבר ירידה נרשמת ברווח או הפסד.", "אין הפחתה של הקרן."],
  },
  {
    id: "slb-profit",
    prompt: "במכירה וחכירה בחזרה שהיא מכירה, על מה מכירים ברווח?",
    options: ["רק על הזכויות שעברו לקונה", "על כל ההפרש בין השווי לערך בספרים", "על החלק שנחכר בחזרה", "על שום דבר"],
    answer: 0,
    why: "סעיף 100(א).",
    traps: ["", "החלק שנשאר בידי החברה לא נמכר.", "זה בדיוק החלק שלא נמכר.", "על החלק שנמכר כן מכירים."],
  },
  {
    id: "half-how",
    prompt: "ריבית שנתית אפקטיבית 10%, ותשלום כל חצי שנה. מהי הריבית לחצי שנה?",
    options: ["(1.1)^(1/2) − 1", "10% ÷ 2", "10%", "10% × 2"],
    answer: 0,
    why: "ריבית דריבית: שתי חצאי שנה צריכים לתת 10% יחד.",
    traps: ["", "כך מקבלים יותר מ-10% בשנה.", "זו ריבית לשנה שלמה.", "זו ריבית לשנתיים, בקירוב."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const SPECIAL_TAUGHT: Record<string, string> = {
  "land-sep": "ls-spc-land",
  "land-life": "ls-spc-land",
  "land-pay": "ls-spc-split",
  "land-gain": "ls-spc-split",
  "land-unreliable": "ls-spc-whole",
  "land-both-op": "ls-spc-whole",
  "land-immaterial": "ls-spc-whole",
  "land-whole": "ls-spc-whole",
  "sub-classify": "ls-spc-sub",
  "sub-short": "ls-spc-sub",
  "sub-low": "ls-spc-sub",
  "sub-rate": "ls-spc-subfin",
  "sub-liab": "ls-spc-subfin",
  "sub-gain": "ls-spc-subfin",
  "sub-dep": "ls-spc-subop",
  "ip-date": "ls-spc-ip",
  "ip-oci": "ls-spc-ip",
  "ip-after": "ls-spc-ip",
  "ip-floor": "ls-spc-ip",
  "month-pv": "ls-spc-rates",
  "month-int": "ls-spc-rates",
  "half-pv": "ls-spc-rates",
  "slb-first": "ls-spc-slb",
  "slb-sign": "ls-spc-slb",
  "slb-loan": "ls-spc-slb",
  "slb-gain": "ls-spc-fair",
  "slb-rou": "ls-spc-fair",
  "slb-low": "ls-spc-low",
  "slb-high": "ls-spc-high",
  "slb-buyer": "ls-spc-fair",
  "slb-measure": "ls-spc-high",
  "sub-entry": "ls-spc-subfin",
  "ip-entry": "ls-spc-ip",
  "slb-entry": "ls-spc-fair",
  "sub-against": "ls-spc-sub",
  "ip-reserve": "ls-spc-ip",
  "slb-profit": "ls-spc-fair",
  "half-how": "ls-spc-rates",
};

/** Lesson 8: land and buildings, subleases, and sale and leaseback. */
export const SPECIAL: StudyModule = {
  slug: "ifrs16-special",
  course: COURSE,
  n: 8,
  title: "נדל״ן, חכירת משנה, מכירה וחכירה בחזרה",
  description: "שלושה מקרים שכל הכלים שלמדנו נפגשים בהם: בניין עם קרקע, חוזה עם שלושה צדדים, ומי שמוכר נכס ומיד חוכר אותו בחזרה. בדרך: מעבר לנדל״ן להשקעה, וריבית שאינה שנתית.",
  goal: "לזהות כל אחד משלושת המקרים המיוחדים, ולפתור אותו עד הדוחות הכספיים.",
  outcomes: [
    "לסווג חכירה של קרקע ומבנה, ולהקצות תשלומים ביניהן",
    "לסווג חכירת משנה מול זכות השימוש, ולרשום את שלושת הצדדים",
    "להעביר נכס זכות שימוש לנדל״ן להשקעה בשווי הוגן",
    "לעבוד בריבית חודשית ובריבית חצי שנתית",
    "להכריע אם עסקה היא מכירה וחכירה בחזרה, ואם יש בה מכירה",
    "לחשב נכס זכות שימוש ורווח על החלק שנמכר, גם כשהתמורה שונה מהשווי ההוגן",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-spc-hook", title: "שלושה מקרים מיוחדים" },
    { id: "ls-spc-land", title: "קרקע ומבנה: שלוש שאלות" },
    { id: "ls-spc-split", title: "מקצים: שתי חכירות בחוזה אחד" },
    { id: "ls-spc-whole", title: "בלי הקצאה, או קרקע לא מהותית" },
    { id: "ls-spc-sub", title: "חכירת משנה: מול מה מסווגים" },
    { id: "ls-spc-subfin", title: "חכירת משנה מימונית" },
    { id: "ls-spc-subop", title: "חכירת משנה תפעולית" },
    { id: "ls-spc-ip", title: "מעבר לנדל״ן להשקעה בשווי הוגן" },
    { id: "ls-spc-rates", title: "ריבית חודשית וחצי שנתית" },
    { id: "ls-spc-slb", title: "מכירה וחכירה בחזרה: האם בכלל מכרו" },
    { id: "ls-spc-fair", title: "מכירה בשווי הוגן: רווח על החלק שעבר" },
    { id: "ls-spc-low", title: "תמורה נמוכה: מקדמה" },
    { id: "ls-spc-high", title: "תמורה גבוהה: הלוואה" },
    { id: "ls-spc-drill", title: "מתרגלים: מספרים חדשים בכל פעם" },
    { id: "ls-spc-mistake", title: "מצאו את הטעות" },
    { id: "ls-spc-master", title: "שאלה מסכמת: בניין אחד, שלוש חברות" },
  ],
  exercises,
  traps,
  tips: [
    "קרקע מהותית: כל מרכיב לבדו, והקצאה לפי שווי הוגן יחסי.",
    "אי אפשר להקצות: הכול מימונית, אלא אם ברור ששניהם תפעוליים.",
    "קרקע לא מהותית: יחידה אחת, לפי חיי המבנה.",
    "חכירת משנה: מסווגים מול זכות השימוש, ולא מול הנכס.",
    "ראשית לטווח קצר עם ההקלה: המשנה תמיד תפעולית.",
    "חכירת משנה מימונית: הנכס יוצא, וההתחייבות נשארת.",
    "מעבר לנדל״ן בשווי הוגן: ביום סיום השימוש, ועלייה לרווח כולל אחר. אחר כך הכול ברווח או הפסד.",
    "ריבית לחצי שנה מתוך ריבית שנתית אפקטיבית: שורש, ולא חלוקה ב-2.",
    "מכירה וחכירה בחזרה: קודם ב46, אחר כך סעיף 99. בלי מכירה זו הלוואה.",
    "רווח רק על החלק שעבר. נכס זכות השימוש הוא חלק מהערך בספרים.",
    "תמורה נמוכה: מקדמה. תמורה גבוהה: הלוואה.",
  ],
};
