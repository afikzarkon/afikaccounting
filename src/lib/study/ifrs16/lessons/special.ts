import { pvEnd, rateFor } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import type { TestEnd, TestNode } from "./what";

const r = Math.round;

/** Land and buildings: paragraphs ב55 to ב57. */
export const LAND_WALK: Record<string, TestNode | TestEnd> = {
  material: { q: "סכום הקרקע מהותי לחכירה?", par: "סעיף ב57", help: "מהותי פירושו שהקרקע שווה מספיק כדי לשנות את התמונה. אם לא, אפשר לטפל בהכול כיחידה אחת, לפי החיים של המבנה.", answers: [{ label: "כן", to: "reliable" }, { label: "לא", to: "one" }] },
  reliable: { q: "אפשר לחלק את התשלומים בין הקרקע למבנה בצורה אמינה?", par: "סעיף ב56", help: "מחלקים לפי השווי ההוגן של זכויות החכירה בכל חלק, ביום ההתקשרות.", answers: [{ label: "כן", to: "two" }, { label: "לא", to: "both" }] },
  both: { q: "ברור ששני המרכיבים הם חכירות תפעוליות?", par: "סעיף ב56", help: "מספיק שאחד מהם לא ברור, למשל מבנה שמוחכר לרוב חייו.", answers: [{ label: "כן", to: "allOp" }, { label: "לא", to: "allFin" }] },
  one: { lease: true, verdict: "יחידה אחת", why: "מסווגים את הכול פעם אחת, ואורך החיים הוא של המבנה (סעיף ב57)." },
  two: { lease: true, verdict: "שתי חכירות", why: "כל מרכיב מקבל את חלקו בתשלומים ובשווי, ומסווג לבדו (סעיף ב55)." },
  allOp: { lease: true, verdict: "הכול תפעולית", why: "זה החריג של סעיף ב56: ברור ששני החלקים תפעוליים, ולכן אין צורך להפריד." },
  allFin: { lease: true, verdict: "הכול מימונית", why: "כשאי אפשר להקצות, ולא ברור ששניהם תפעוליים (סעיף ב56)." },
};
export const LAND_WALK_START = "material";

/** Classifying a sublease: paragraph ב58. */
export const SUB_WALK: Record<string, TestNode | TestEnd> = {
  short: { q: "החכירה הראשית היא לטווח קצר, והחברה יישמה עליה את ההקלה?", par: "סעיף ב58(א)", help: "ההקלה מהשיעור הרביעי, שבה לא רושמים נכס ולא התחייבות. בלי נכס זכות שימוש אין מול מה לסווג.", answers: [{ label: "כן", to: "op" }, { label: "לא", to: "term" }] },
  term: { q: "חכירת המשנה לוקחת את רוב השנים שנשארו בחכירה הראשית?", par: "סעיף ב58(ב)", help: "מודדים מול השנים שנשארו בחכירה הראשית, ולא מול חיי הבניין.", answers: [{ label: "כן", to: "fin" }, { label: "לא", to: "value" }] },
  value: { q: "הערך הנוכחי של התשלומים מגיע כמעט לכל השווי ההוגן של זכות השימוש?", par: "סעיף ב58(ב)", help: "משווים לשווי של הזכות שיש לחברה. השווי של הנכס עצמו לא רלוונטי כאן.", answers: [{ label: "כן", to: "fin" }, { label: "לא", to: "op" }] },
  fin: { lease: true, verdict: "חכירת משנה מימונית", why: "נכס זכות השימוש יוצא, ובמקומו השקעה נטו." },
  op: { lease: true, verdict: "חכירת משנה תפעולית", why: "נכס זכות השימוש נשאר, ועליו הכנסה בקו ישר." },
};
export const SUB_WALK_START = "short";

/** Sale and leaseback: paragraphs ב46, 99 to 103. */
export const SLB_WALK: Record<string, TestNode | TestEnd> = {
  control: { q: "הנכס באמת היה בשליטת החברה לפני שהועבר?", par: "סעיף ב46", help: "אם הוא רק עבר בידיה בדרך, למשל נכס שנקנה מיצרן עבור המחכיר, זו לא עסקה כזו.", answers: [{ label: "כן", to: "sale" }, { label: "לא", to: "plain" }] },
  sale: { q: "הקונה באמת קיבל שליטה, כך שזו מכירה לפי IFRS 15?", par: "סעיף 99", help: "הסימנים הם בעלות משפטית, חזקה, סיכונים והטבות, וזכות לתשלום.", answers: [{ label: "כן", to: "price" }, { label: "לא", to: "loan" }] },
  price: { q: "המחיר שווה לשווי ההוגן, ודמי החכירה בגובה השוק?", par: "סעיף 101", help: "בודקים גם את המחיר וגם את דמי החכירה. אם אחד מהם נמוך מהשוק אלה תנאים מתחת לשוק, ואם אחד מהם גבוה מהשוק אלה תנאים מעל השוק. מתקנים את זה לפני שמחשבים רווח.", answers: [{ label: "כן", to: "fair" }, { label: "תנאים מתחת לשוק", to: "low" }, { label: "תנאים מעל השוק", to: "high" }] },
  plain: { lease: true, verdict: "חכירה רגילה", why: "אין כאן מכירה של החוכר. מטפלים בחכירה לפי הכללים הרגילים (סעיף ב47)." },
  loan: { lease: true, verdict: "הלוואה", why: "הנכס נשאר אצל המוכר, והכסף הוא התחייבות פיננסית (סעיף 103)." },
  fair: { lease: true, verdict: "רווח על החלק שנמכר", why: "רק על הזכויות שעברו לקונה (סעיף 100)." },
  low: { lease: true, verdict: "ההפרש הוא מקדמה", why: "ההפרש הוא תשלום מראש על החכירה (סעיף 101(א))." },
  high: { lease: true, verdict: "ההפרש הוא הלוואה", why: "ההפרש הוא כסף שהקונה מלווה לחברה (סעיף 101(ב))." },
};
export const SLB_WALK_START = "control";

/** To sort: which way a sublease goes. */
export const SUB_ITEMS: { text: string; answer: "fin" | "op"; why: string }[] = [
  { text: "חכירה ראשית ל-12 שנים, בבניין עם 60 שנות חיים. בתחילת שנה 6 החוכר מחכיר אותו בחכירת משנה ל-6 מתוך 7 השנים שנשארו.", answer: "fin", why: "86% מהשנים של זכות השימוש. מול 60 שנות הבניין זה היה נראה מעט, אבל לא מולן בודקים." },
  { text: "נשארו 8 שנים בחכירה הראשית. חכירת משנה ל-3 שנים, והערך הנוכחי של התשלומים 40% מהשווי ההוגן של זכות השימוש.", answer: "op", why: "38% מהשנים ו-40% מהשווי. שני הסימנים רחוקים, ואין סימן אחר." },
  { text: "חכירה ראשית ל-10 חודשים, עם ההקלה לטווח קצר. החוכר מחכיר בחכירת משנה ל-9 חודשים.", answer: "op", why: "סעיף ב58(א): תמיד תפעולית." },
  { text: "נשארו 6 שנים בחכירה הראשית. חכירת משנה ל-2 שנים, והערך הנוכחי 95% מהשווי ההוגן של זכות השימוש.", answer: "fin", why: "הערך הנוכחי הוא למעשה כל השווי של זכות השימוש. מספיק סימן אחד." },
];
export const SUB_OPTIONS: [string, string][] = [
  ["fin", "מימונית"],
  ["op", "תפעולית"],
];

/** Land that can be split: a logistics yard, where the present value decides the building. */
export const YARD = { payment: 140_000, years: 12, fairValue: 1_250_000, landPct: 20, life: 20, buildingEnd: 150_000, landEnd: 300_000, buildingBV: 850_000, landBV: 100_000 };
export const YARD_LAND_FV = (YARD.fairValue * YARD.landPct) / 100;
export const YARD_BLD_FV = YARD.fairValue - YARD_LAND_FV;
export const YARD_LAND_PAY = (YARD.payment * YARD.landPct) / 100;
export const YARD_BLD_PAY = YARD.payment - YARD_LAND_PAY;
export const YARD_BOOK_PAY = r((YARD.payment * YARD.landBV) / (YARD.landBV + YARD.buildingBV));
export const YARD_LAND_RATE = rateFor(YARD_LAND_FV, YARD.years, YARD_LAND_PAY, YARD.landEnd);
export const YARD_LAND_PV = r(pvEnd(YARD_LAND_RATE, YARD.years, YARD_LAND_PAY));
export const YARD_BLD_RATE = rateFor(YARD_BLD_FV, YARD.years, YARD_BLD_PAY, YARD.buildingEnd);
export const YARD_BLD_PV = r(pvEnd(YARD_BLD_RATE, YARD.years, YARD_BLD_PAY));
export const YARD_GAIN = YARD_BLD_FV - YARD.buildingBV;
export const YARD_INT = r(YARD_BLD_FV * YARD_BLD_RATE);
export const YARD_CLOSE = YARD_BLD_FV + YARD_INT - YARD_BLD_PAY;
export const YARD_WHOLE_GAIN = YARD.fairValue - YARD.buildingBV - YARD.landBV;

/** Land that cannot be split: an old plant, with direct costs. */
export const PLANT = { payment: 95_000, years: 14, life: 15, fairValue: 900_000, costs: 15_000, end: 240_000, buildingBV: 400_000, landBV: 180_000 };
export const PLANT_NI = PLANT.fairValue + PLANT.costs;
export const PLANT_RATE = rateFor(PLANT_NI, PLANT.years, PLANT.payment, PLANT.end);
export const PLANT_GAIN = PLANT.fairValue - PLANT.buildingBV - PLANT.landBV;
export const PLANT_INT = r(PLANT_NI * PLANT_RATE);
export const PLANT_CLOSE = PLANT_NI + PLANT_INT - PLANT.payment;

/** The exception: a short lease of a shop, plainly operating in both parts. */
export const SHOP = { payment: 40_000, years: 4, life: 50, fairValue: 800_000, rate: 0.05 };
export const SHOP_PV = r(pvEnd(SHOP.rate, SHOP.years, SHOP.payment));

/** Land that does not matter: a hangar on a small plot, one unit, a finance lease. */
export const HANGAR = { years: 18, life: 20, longLife: 60, fairValue: 640_000, bookValue: 480_000, landPct: 2 };
export const HANGAR_GAIN = HANGAR.fairValue - HANGAR.bookValue;

/** A finance sublease at a lower rent, measured at the head lease's rate, with improvements written off. */
export const BRANCH = { payment: 300_000, years: 8, rate: 0.06, done: 3, left: 5, subPayment: 280_000, improvements: 50_000 };
export const BRANCH_L0 = r(pvEnd(BRANCH.rate, BRANCH.years, BRANCH.payment));
export const BRANCH_DEP = r(BRANCH_L0 / BRANCH.years);
export const BRANCH_ROU = BRANCH_L0 - BRANCH_DEP * BRANCH.done;
export const BRANCH_L = r(pvEnd(BRANCH.rate, BRANCH.left, BRANCH.payment));
export const BRANCH_NI = r(pvEnd(BRANCH.rate, BRANCH.left, BRANCH.subPayment));
export const BRANCH_LOSS = BRANCH_ROU + BRANCH.improvements - BRANCH_NI;
export const BRANCH_NI_INT = r(BRANCH_NI * BRANCH.rate);
export const BRANCH_NI_CLOSE = BRANCH_NI + BRANCH_NI_INT - BRANCH.subPayment;
export const BRANCH_L_INT = r(BRANCH_L * BRANCH.rate);
export const BRANCH_L_CLOSE = BRANCH_L + BRANCH_L_INT - BRANCH.payment;

/** An operating sublease with a stepped rent: a training centre. */
export const CENTRE = { payment: 150_000, years: 10, rate: 0.05, done: 3, left: 7, subRents: [80_000, 120_000], subYears: 2, subRate: 0.07, rightFV: 600_000 };
export const CENTRE_L0 = r(pvEnd(CENTRE.rate, CENTRE.years, CENTRE.payment));
export const CENTRE_DEP = r(CENTRE_L0 / CENTRE.years);
export const CENTRE_ROU = CENTRE_L0 - CENTRE_DEP * CENTRE.done;
export const CENTRE_ROU1 = CENTRE_ROU - CENTRE_DEP;
export const CENTRE_L = r(pvEnd(CENTRE.rate, CENTRE.left, CENTRE.payment));
export const CENTRE_INT = r(CENTRE_L * CENTRE.rate);
export const CENTRE_CLOSE = CENTRE_L + CENTRE_INT - CENTRE.payment;
export const CENTRE_NC = r(pvEnd(CENTRE.rate, CENTRE.left - 2, CENTRE.payment));
export const CENTRE_SUB_PV = r(CENTRE.subRents[0] / (1 + CENTRE.subRate) + CENTRE.subRents[1] / (1 + CENTRE.subRate) ** 2);
export const CENTRE_INCOME = (CENTRE.subRents[0] + CENTRE.subRents[1]) / CENTRE.subYears;
export const CENTRE_ACCRUED = CENTRE_INCOME - CENTRE.subRents[0];

/** A leased car park moved to investment property at fair value. */
export const PARK = { payment: 90_000, years: 12, rate: 0.06, done: 5, fairValue: 470_000, endFV: 485_000, impairment: 20_000 };
export const PARK_L0 = r(pvEnd(PARK.rate, PARK.years, PARK.payment));
export const PARK_DEP = r(PARK_L0 / PARK.years);
export const PARK_ROU = PARK_L0 - PARK_DEP * PARK.done;
export const PARK_NINE = r((PARK_DEP * 9) / 12);
export const PARK_AT = PARK_ROU - PARK_NINE;
export const PARK_OCI = PARK.fairValue - PARK_AT;
export const PARK_GAIN = PARK.endFV - PARK.fairValue;

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

/** A transfer that is no sale: a cold store, and a loan. */
export const COLD = { received: 1_400_000, bookValue: 900_000, payment: 200_000, years: 10 };
export const COLD_RATE = rateFor(COLD.received, COLD.years, COLD.payment);
export const COLD_INT = r(COLD.received * COLD_RATE);
export const COLD_CLOSE = COLD.received + COLD_INT - COLD.payment;
export const COLD_GAP = COLD.received - COLD.bookValue;

/** A sale at market terms and a short leaseback: a bakery. */
export const BAKERY = { bookValue: 900_000, fairValue: 1_500_000, payment: 90_000, years: 5, rate: 0.06, life: 30, longYears: 25, longPayment: 110_000 };
export const BAKERY_GAP = BAKERY.fairValue - BAKERY.bookValue;
export const BAKERY_L = r(pvEnd(BAKERY.rate, BAKERY.years, BAKERY.payment));
export const BAKERY_SHARE = BAKERY_L / BAKERY.fairValue;
export const BAKERY_ROU = r(BAKERY.bookValue * BAKERY_SHARE);
export const BAKERY_GAIN = BAKERY.fairValue + BAKERY_ROU - BAKERY.bookValue - BAKERY_L;
export const BAKERY_DEP = r(BAKERY_ROU / BAKERY.years);
export const BAKERY_INT = r(BAKERY_L * BAKERY.rate);
export const BAKERY_CLOSE = BAKERY_L + BAKERY_INT - BAKERY.payment;
export const BAKERY_LONG_L = r(pvEnd(BAKERY.rate, BAKERY.longYears, BAKERY.longPayment));
export const BAKERY_LONG_SHARE = BAKERY_LONG_L / BAKERY.fairValue;
export const BAKERY_LONG_ROU = r(BAKERY.bookValue * BAKERY_LONG_SHARE);
export const BAKERY_LONG_GAIN = BAKERY.fairValue + BAKERY_LONG_ROU - BAKERY.bookValue - BAKERY_LONG_L;

/** Above market: a sports hall, a high price paid back through a high rent. */
export const GYM = { bookValue: 1_100_000, fairValue: 1_700_000, price: 2_000_000, payment: 240_000, years: 10, rate: 0.06, life: 40 };
export const GYM_LOAN = GYM.price - GYM.fairValue;
export const GYM_PV = r(pvEnd(GYM.rate, GYM.years, GYM.payment));
export const GYM_L = GYM_PV - GYM_LOAN;
export const GYM_PMT = r((GYM_LOAN * GYM.rate) / (1 - (1 + GYM.rate) ** -GYM.years));
export const GYM_RENT = GYM.payment - GYM_PMT;
export const GYM_RENT_PV = r(pvEnd(GYM.rate, GYM.years, GYM_RENT));
export const GYM_GAP = GYM.fairValue - GYM.bookValue;
export const GYM_SHARE = GYM_L / GYM.fairValue;
export const GYM_ROU = r(GYM.bookValue * GYM_SHARE);
export const GYM_GAIN = GYM.price + GYM_ROU - GYM.bookValue - GYM_L - GYM_LOAN;
export const GYM_L_INT = r(GYM_L * GYM.rate);
export const GYM_L_CLOSE = GYM_L + GYM_L_INT - GYM_RENT;
export const GYM_LOAN_INT = r(GYM_LOAN * GYM.rate);
export const GYM_LOAN_CLOSE = GYM_LOAN + GYM_LOAN_INT - GYM_PMT;

/** Below market: a logistics centre, a low price made up for by a low rent. */
export const LOGI = { bookValue: 2_000_000, fairValue: 3_000_000, price: 2_800_000, payment: 170_000, years: 15, rate: 0.05, life: 50 };
export const LOGI_PRE = LOGI.fairValue - LOGI.price;
export const LOGI_L = r(pvEnd(LOGI.rate, LOGI.years, LOGI.payment));
export const LOGI_GAP = LOGI.fairValue - LOGI.bookValue;
export const LOGI_PMT = r((LOGI_PRE * LOGI.rate) / (1 - (1 + LOGI.rate) ** -LOGI.years));
export const LOGI_MARKET = LOGI.payment + LOGI_PMT;
export const LOGI_MARKET_PV = r(pvEnd(LOGI.rate, LOGI.years, LOGI_MARKET));
export const LOGI_SHARE = (LOGI_L + LOGI_PRE) / LOGI.fairValue;
export const LOGI_ROU = r(LOGI.bookValue * LOGI_SHARE);
export const LOGI_GAIN = LOGI.price + LOGI_ROU - LOGI.bookValue - LOGI_L;
export const LOGI_RENT = (LOGI.payment * LOGI.years + LOGI_PRE) / LOGI.years;
export const LOGI_FALL = LOGI_RENT - LOGI.payment;

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
const P_LOW_L = r(pvEnd(0.05, 8, 90_000));
const P_LOW_ROU = r((800_000 * (P_LOW_L + 100_000)) / 1_200_000);
const P_HIGH_L = r(pvEnd(0.04, 12, 40_000));
const P_HIGH_ROU = r((200_000 * (P_HIGH_L - 30_000)) / 450_000);
const P_HIGH_GAIN = 480_000 + P_HIGH_ROU - 200_000 - P_HIGH_L;
const P_HALF = r(pvEnd(0.04, 4, 200_000));
const P_MON = r(pvEnd(0.01, 36, 10_000));
const P_MON_OPEN = r(pvEnd(0.01, 48, 10_000));

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  ask({ id: "land-sep", skill: "קרקע ומבנה", prompt: "מחכיר מחכיר בניין עם הקרקע שמתחתיו. סכום הקרקע מהותי. איך מסווגים?", options: ["כל מרכיב בנפרד", "הכול כמבנה", "הכול כקרקע", "לפי המרכיב הגדול"], answer: 0, why: "המבנה מתבלה והקרקע לא, ולכן כל אחד מסווג לבד (סעיף ב55).", trap: "לסווג חכירה אחת לפי הבניין. קרקע ומבנה הם נכסים שונים מאוד.", level: 1, source: "מקורית", ref: "סעיף ב55" }),
  ask({ id: "land-life", skill: "קרקע ומבנה", prompt: "חכירת קרקע ל-30 שנים, בלי העברת בעלות ובלי אופציה. למה התקופה הארוכה לא מספיקה כדי לסווג אותה כמימונית?", options: ["לקרקע יש בדרך כלל אורך חיים כלכליים לא מוגדר", "כי קרקע לא יכולה להיות מוחכרת", "כי קרקע תמיד חוזרת במחיר נמוך", "כי סעיף ב55 אוסר על כך"], answer: 0, why: "סעיף ב55 מפנה לכך במפורש, ולכן 30 שנים הן לא החלק העיקרי של חייה.", trap: "להשוות את התקופה לחיי המבנה שעליה.", level: 2, source: "מקורית", ref: "סעיף ב55" }),
  askNumber({ id: "land-pay", skill: "קרקע ומבנה", prompt: "חכירת בניין: 50,000 ש״ח בשנה. ביום ההתקשרות 15% מהשווי ההוגן של זכויות החכירה בקרקע, ו-85% במבנה. כמה מהתשלום השנתי מוקצה למבנה?", answer: 42_500, steps: ["מקצים לפי השווי ההוגן של זכויות החכירה בכל מרכיב (סעיף ב56)", "תשלום למבנה = תשלום כולל × חלק המבנה בשווי", "50,000 × 85% = 42,500"], trap: "להקצות לפי הערך בספרים. ההקצאה לפי שווי הוגן יחסי.", level: 1, source: "מקורית", ref: "סעיף ב56" }),
  askNumber({ id: "land-gain", skill: "קרקע ומבנה", prompt: "מחכיר שאינו סוחר. שווי הבניין כולו 500,000 ש״ח, 75% מזה במבנה. חכירת המבנה מימונית, וחכירת הקרקע תפעולית. ערך המבנה בספרים 340,000 ש״ח. בלי עלויות ישירות. כמה רווח הון נרשם?", answer: 35_000, steps: ["השקעה נטו במבנה: 500,000 × 75% = 375,000", "375,000 − 340,000 = 35,000"], trap: "לגרוע גם את הקרקע. היא בחכירה תפעולית, ולכן נשארת בספרים.", level: 2, source: "מקורית", ref: "סעיפים 67, ב55" }),
  ask({ id: "land-unreliable", skill: "קרקע ומבנה", prompt: "חכירת בניין ל-16 שנים, כשלמבנה 18 שנות חיים. סכום הקרקע מהותי, ואי אפשר להקצות את התשלומים באופן מהימן. איך מסווגים?", options: ["הכול מימונית", "הכול תפעולית", "המבנה מימונית והקרקע תפעולית", "לא מכירים עד שאפשר להקצות"], answer: 0, why: "סעיף ב56: מימונית, אלא אם ברור ששניהם תפעוליים. כאן המבנה בוודאי לא, כי החכירה לוקחת כמעט את כל חייו.", trap: "להפריד בכל זאת. בלי הקצאה מהימנה אין הפרדה.", level: 2, source: "מקורית", ref: "סעיף ב56" }),
  ask({ id: "land-both-op", skill: "קרקע ומבנה", prompt: "חכירת בניין ל-3 שנים, כשלמבנה 40 שנות חיים, והתשלומים נמוכים בהרבה מהשווי. סכום הקרקע מהותי, ואי אפשר להקצות את התשלומים באופן מהימן. איך מסווגים?", options: ["הכול תפעולית, כי ברור ששני המרכיבים כאלה", "הכול מימונית, כי אי אפשר להקצות", "המבנה מימונית והקרקע תפעולית", "מקצים לפי ערך בספרים"], answer: 0, why: "3 מתוך 40 שנים ותשלומים נמוכים. ברור ששני החלקים תפעוליים, וזה החריג בסעיף ב56.", trap: "לזכור רק את ברירת המחדל של מימונית.", level: 3, source: "מקורית", ref: "סעיף ב56" }),
  ask({ id: "land-immaterial", skill: "קרקע ומבנה", prompt: "סכום הקרקע לא מהותי, והחברה מטפלת בבניין כיחידה אחת. לאיזה אורך חיים משווים את תקופת החכירה?", options: ["אורך החיים של המבנה", "אורך החיים של הקרקע", "הארוך מבין השניים", "ממוצע משוקלל"], answer: 0, why: "מתייחסים לכול כמו למבנה (סעיף ב57).", trap: "להתבלבל בגלל הקרקע, שחייה לא מוגדרים.", level: 2, source: "מקורית", ref: "סעיף ב57" }),
  askNumber({ id: "land-whole", skill: "קרקע ומבנה", prompt: "אי אפשר להקצות, והכול מימונית. מחכיר שאינו סוחר. שווי הבניין 600,000 ש״ח. בספרים: מבנה 350,000 ש״ח וקרקע 100,000 ש״ח. בלי עלויות ישירות. כמה רווח הון נרשם?", answer: 150_000, steps: ["600,000 − 350,000 − 100,000 = 150,000"], trap: "לגרוע רק את המבנה. כשהכול מימונית, גם הקרקע יוצאת.", level: 3, source: "מקורית", ref: "סעיפים 67, ב56" }),
  ask({ id: "sub-classify", skill: "חכירת משנה", prompt: "חכירה ראשית של בניין ל-15 שנים, וחיי הבניין 50 שנה. בתחילת שנה 9 החוכר מחכיר אותו בחכירת משנה ל-6 מתוך 7 השנים שנשארו. איך מסווגים?", options: ["מימונית: 86% מהשנים של זכות השימוש", "תפעולית: 12% מחיי הבניין", "תפעולית תמיד", "לפי הסיווג אצל המחכיר הראשי"], answer: 0, why: "סעיף ב58(ב): מול נכס זכות השימוש, ולא מול נכס הבסיס. 6 ÷ 7 = 86%.", trap: "להשוות לחיי הבניין. מה שהחוכר מעביר הוא זכות השימוש שלו, ולא הבניין.", level: 1, source: "מקורית", ref: "סעיף ב58(ב)" }),
  ask({ id: "sub-short", skill: "חכירת משנה", prompt: "חברה יישמה את הקלת הטווח הקצר על חכירה ראשית, והיא מחכירה את כל התקופה בחכירת משנה. איך מסווגים?", options: ["תפעולית", "מימונית, כי זו כל התקופה", "לפי הערך הנוכחי", "אי אפשר לסווג"], answer: 0, why: "אין לה נכס זכות שימוש, ולכן חכירת המשנה תמיד תפעולית (סעיף ב58(א)).", trap: "להפעיל את המבחן הרגיל. כאן אין בכלל נכס זכות שימוש בספרים.", level: 2, source: "מקורית", ref: "סעיף ב58(א)" }),
  ask({ id: "sub-low", skill: "חכירת משנה", prompt: "חברה חוכרת מחשבים ניידים זולים, ומתכוונת להחכיר את המחשבים בחכירת משנה ללקוחות. האם היא יכולה ליישם על החכירה הראשית את הקלת הערך הנמוך?", options: ["לא", "כן, כי הנכס זול", "כן, אם חכירת המשנה תפעולית", "רק אם החכירה קצרה"], answer: 0, why: "חכירה שמיועדת לחכירת משנה לא מקבלת את ההקלה, גם אם הנכס זול (סעיף ב7).", trap: "לבדוק רק את ערך הנכס. חכירת משנה מוציאה את ההקלה.", level: 2, source: "מקורית", ref: "סעיף ב7" }),
  ask({ id: "sub-rate", skill: "חכירת משנה", prompt: "מחכיר בחכירת משנה לא יכול לקבוע בקלות את הריבית הגלומה בחכירת המשנה. באיזו ריבית ימדוד את ההשקעה נטו?", options: ["בשיעור ההיוון של החכירה הראשית, בהתאמה לעלויות ישירות", "בריבית השוק של יום החתימה", "בריבית התוספתית של חוכר המשנה", "בריבית אפס"], answer: 0, why: "כך קובע סעיף 68: השיעור של החכירה הראשית, עם התאמה לעלויות ישירות.", trap: "לקחת את הריבית של הצד השלישי. היא שלו.", level: 2, source: "מקורית", ref: "סעיף 68" }),
  ask({ id: "sub-liab", skill: "חכירת משנה", prompt: "חוכר החכיר את כל זכות השימוש שלו בחכירת משנה מימונית. מה קורה להתחייבות החכירה שלו?", options: ["נשארת, והוא ממשיך לשלם למחכיר הראשי", "נגרעת יחד עם הנכס", "מתקזזת עם ההשקעה נטו", "עוברת לחוכר המשנה"], answer: 0, why: "יוצא רק נכס זכות השימוש. החוב למחכיר הראשי לא השתנה.", trap: "לקזז בין ההשקעה נטו להתחייבות. מדובר בשני חוזים ובשני צדדים.", level: 2, source: "מקורית", ref: "סעיפים 36, 67" }),
  askNumber({ id: "sub-gain", skill: "חכירת משנה", prompt: "חכירת משנה מימונית. ההשקעה נטו 1,100,000 ש״ח. ביום החתימה: נכס זכות שימוש 900,000 ש״ח, ושיפורים במושכר 50,000 ש״ח. כמה רווח הון נרשם?", answer: 150_000, steps: ["יוצאים: 900,000 + 50,000 = 950,000", "1,100,000 − 950,000 = 150,000"], trap: "לשכוח את השיפורים. החוכר לא ישתמש בהם יותר, ולכן גם הם יוצאים (IAS 16 סעיף 67(ב)). בתקן החכירות אין משפט עליהם, וזו הקריאה של הקורס.", level: 3, source: "מקורית", ref: "סעיף 67; IAS 16 סעיף 67(ב)" }),
  askNumber({ id: "sub-dep", skill: "חכירת משנה", prompt: "חכירת משנה תפעולית, והחברה מודדת נדל״ן להשקעה בעלות. ביום החתימה נכס זכות השימוש 840,000 ש״ח, ונשארו 7 שנים בחכירה הראשית. חכירת המשנה ל-3 שנים. מהו הפחת השנתי?", answer: 120_000, steps: ["הנכס נשאר, והפחת על פני השנים שנשארו בחכירה הראשית, כי עד אז נמשכת הזכות", "פחת = יתרת הנכס ÷ השנים שנשארו", "840,000 ÷ 7 = 120,000"], trap: "להפחית על פני 3 שנים. זכות השימוש נמשכת עד סוף החכירה הראשית.", level: 2, source: "מקורית", ref: "סעיף 32" }),
  ask({ id: "ip-date", skill: "נדל״ן להשקעה", prompt: "ב-1.3 הדירקטוריון החליט להפסיק להשתמש במשרדים ולהחכיר את המשרדים בחכירת משנה תפעולית. העובדים עזבו ב-1.6, וחכירת המשנה נחתמה ב-1.6. הנדל״ן להשקעה בשווי הוגן. מתי מועד המעבר?", options: ["1.6: סיום השימוש של הבעלים", "1.3: יום ההחלטה", "31.12: יום הדוח", "אין מעבר"], answer: 0, why: "שינוי בשימוש, ולא שינוי בכוונה (IAS 40).", trap: "לעבור ביום ההחלטה. עד סיום השימוש ממשיכים להפחית.", level: 2, source: "מקורית", ref: "IAS 40 סעיפים 57, 61" }),
  askNumber({ id: "ip-oci", skill: "נדל״ן להשקעה", prompt: "ביום סיום השימוש נכס זכות השימוש בספרים 300,000 ש״ח, ושוויו ההוגן 420,000 ש״ח. הוא עובר לנדל״ן להשקעה בשווי הוגן. אין ירידות ערך קודמות. כמה נרשם ברווח כולל אחר?", answer: 120_000, steps: ["420,000 − 300,000 = 120,000 לקרן הערכה מחדש (IAS 40 סעיף 62(ב))"], trap: "לרשום ברווח או הפסד. שערוך ביום המעבר הולך כמו הערכה מחדש לפי IAS 16.", level: 2, source: "מקורית", ref: "IAS 40 סעיף 62" }),
  askNumber({ id: "ip-after", skill: "נדל״ן להשקעה", prompt: "נדל״ן להשקעה בשווי הוגן. ביום המעבר שוויו היה 420,000 ש״ח, ונוצרה קרן הערכה מחדש של 120,000 ש״ח. בסוף השנה שוויו 390,000 ש״ח. כמה הפסד נרשם ברווח או הפסד?", answer: 30_000, steps: ["420,000 − 390,000 = 30,000", "הקרן לא נוגעת: אחרי המעבר שינויי שווי הולכים לרווח או הפסד"], trap: "להוריד את הקרן. היא קפואה, ואפשר להעביר אותה לעודפים רק בגריעה.", level: 3, source: "מקורית", ref: "IAS 40 סעיפים 35, 62" }),
  askNumber({ id: "ip-floor", skill: "נדל״ן להשקעה", prompt: "ב-1.1 נכס זכות שימוש של 1,200,000 ש״ח על שלוש קומות זהות, שאפשר להחכיר כל אחת בנפרד, ונשארו 8 שנים. ב-1.7 הסתיים השימוש בקומה אחת, והיא עברה לנדל״ן להשקעה בשווי הוגן של 500,000 ש״ח. כמה נרשם ברווח כולל אחר?", answer: 125_000, steps: ["הקומה: 1,200,000 ÷ 3 = 400,000", "פחת עד 1.7: 400,000 ÷ 8 × 6/12 = 25,000", "ביום המעבר: 400,000 − 25,000 = 375,000", "500,000 − 375,000 = 125,000"], trap: "לשכוח את הפחת של חצי השנה. מפחיתים עד יום המעבר (IAS 40 סעיף 62).", level: 3, source: "מקורית", ref: "IAS 40 סעיף 62" }),
  askNumber({ id: "month-pv", skill: "ריבית", prompt: "חכירה ל-3 שנים, 10,000 ש״ח בסוף כל חודש. הריבית התוספתית החודשית 1%. מהי התחייבות החכירה במועד התחילה?", answer: P_MON, steps: [`=PV(1%;36;-10000) → ${fmt(P_MON)}`], trap: "להכניס 3 תקופות, או 12%. התקופות והריבית צריכות להיות ביחידת זמן אחת.", level: 1, source: "מקורית", ref: "סעיף 26" }),
  askNumber({ id: "month-int", skill: "ריבית", prompt: "10,000 ש״ח בסוף כל חודש, בריבית חודשית של 1%. בתחילת השנה נשארו 48 תשלומים, ובסופה 36. מהן הוצאות המימון של השנה?", answer: P_MON + 120_000 - P_MON_OPEN, steps: [`פתיחה: =PV(1%;48;-10000) → ${fmt(P_MON_OPEN)}`, `סגירה: =PV(1%;36;-10000) → ${fmt(P_MON)}`, "שולמו: 10,000 × 12 = 120,000", `ריבית = סגירה + תשלומים − פתיחה = ${fmt(P_MON)} + 120,000 − ${fmt(P_MON_OPEN)} = ${fmt(P_MON + 120_000 - P_MON_OPEN)}`], trap: "להכפיל את היתרה הפותחת ב-12%. הקרן יורדת בכל חודש.", level: 3, source: "מקורית", ref: "סעיף 36" }),
  askNumber({ id: "half-pv", skill: "ריבית", prompt: "שני תשלומים בשנה של 200,000 ש״ח, במשך שנתיים. הריבית השנתית האפקטיבית 8.16%, ושקולה ל-4% לחצי שנה. מהו הערך הנוכחי של התשלומים?", answer: P_HALF, steps: ["חצי שנה: (1 + 8.16%)^(1/2) − 1 = 4%", `=PV(4%;4;-200000) → ${fmt(P_HALF)}`], trap: "לחלק את הריבית השנתית ב-2. כאן זה נותן 4.08%, וזו לא הריבית השקולה.", level: 2, source: "מקורית", ref: "סעיף 26" }),
  ask({ id: "slb-first", skill: "מכירה וחכירה בחזרה", prompt: "חברה קנתה מכונה מיצרן, ומיד העבירה אותה למחכיר וחכרה אותה ממנו. החברה מעולם לא שלטה במכונה. מה עושים?", options: ["זו לא עסקת מכירה וחכירה בחזרה. חכירה רגילה", "מכירה וחכירה בחזרה, עם רווח חלקי", "הלוואה", "רושמים רווח מלא"], answer: 0, why: "סעיפים ב46, ב47: השאלה הראשונה היא אם החוכר שלט בנכס לפני ההעברה.", trap: "להסתכל על הניירת. גם בעלות חולפת לא מספיקה בלי שליטה.", level: 2, source: "מקורית", ref: "סעיפים ב46, ב47" }),
  ask({ id: "slb-sign", skill: "מכירה וחכירה בחזרה", prompt: "איזה מאלה הוא סימן לכך שהשליטה עברה לקונה?", options: ["הקונה קיבל בעלות משפטית, והוא נושא בסיכונים ובהטבות", "המוכר ממשיך להשתמש בנכס", "יש חוזה חכירה", "הנכס נרשם בספרי המוכר"], answer: 0, why: "סעיף 38 של IFRS 15. שימוש של המוכר הוא תוצאה של החכירה בחזרה, ולא ראיה נגד המכירה.", trap: "לחשוב שחכירה בחזרה לבדה מבטלת מכירה.", level: 1, source: "מקורית", ref: "סעיף 99" }),
  askNumber({ id: "slb-loan", skill: "מכירה וחכירה בחזרה", prompt: "העברת נכס אינה מכירה. המוכר קיבל 500,000 ש״ח. ערך הנכס בספרים 300,000 ש״ח. כמה התחייבות פיננסית הוא רושם?", answer: 500_000, steps: ["התחייבות פיננסית בגובה התקבולים (סעיף 103(א)). הנכס נשאר בספרים"], trap: "לגרוע את הנכס ולרשום רווח. אין מכירה, אז אין רווח.", level: 1, source: "מקורית", ref: "סעיף 103" }),
  askNumber({ id: "slb-gain", skill: "מכירה וחכירה בחזרה", prompt: "מכירה וחכירה בחזרה. ערך בספרים 350,000 ש״ח, שווי הוגן ותמורה 500,000 ש״ח. חוכרים בחזרה ל-10 שנים, ב-50,000 ש״ח בסוף כל שנה, בריבית 6%. כמה רווח נרשם?", answer: P_SLB_GAIN, steps: [`התחייבות: =PV(6%;10;-50000) → ${fmt(P_SLB_L)}`, `נכס זכות שימוש: 350,000 × ${fmt(P_SLB_L)} ÷ 500,000 = ${fmt(P_SLB_ROU)}`, `רווח: 500,000 + ${fmt(P_SLB_ROU)} − 350,000 − ${fmt(P_SLB_L)} = ${fmt(P_SLB_GAIN)}`], trap: "לרשום את כל 150,000. הרווח הוא רק על החלק שלא נשאר בידי החברה.", level: 2, source: "מקורית", ref: "סעיף 100(א)" }),
  askNumber({ id: "slb-rou", skill: "מכירה וחכירה בחזרה", prompt: "מכירה וחכירה בחזרה בשווי הוגן. ערך בספרים 600,000 ש״ח, שווי הוגן 1,000,000 ש״ח, והתחייבות החכירה 700,000 ש״ח. מהי עלות נכס זכות השימוש?", answer: 420_000, steps: ["החלק שנשאר: 700,000 ÷ 1,000,000 = 70%", "600,000 × 70% = 420,000 (סעיף 100(א))"], trap: "להשוות את הנכס להתחייבות, כמו בחכירה רגילה. כאן הוא חלק מהערך בספרים.", level: 2, source: "מקורית", ref: "סעיף 100(א)" }),
  askNumber({ id: "slb-low", skill: "מכירה וחכירה בחזרה", prompt: "חברה מכרה בית דפוס. ערך בספרים 800,000 ש״ח, שווי הוגן 1,200,000 ש״ח, ותמורה 1,100,000 ש״ח, והשליטה עברה לקונה. היא חוכרת אותו בחזרה ל-8 שנים, ב-90,000 ש״ח בסוף כל שנה, בריבית 5%. מהי עלות נכס זכות השימוש?", answer: P_LOW_ROU, steps: ["התמורה נמוכה ב-100,000: מקדמה על החכירה (סעיף 101(א))", `התחייבות: =PV(5%;8;-90000) → ${fmt(P_LOW_L)}`, `החלק שנשאר = (התחייבות + מקדמה) ÷ שווי הוגן = ${fmt(P_LOW_L + 100_000)} ÷ 1,200,000`, `נכס = ערך בספרים × החלק שנשאר = 800,000 × ${fmt(P_LOW_L + 100_000)} ÷ 1,200,000 = ${fmt(P_LOW_ROU)}`], trap: "לשכוח את המקדמה בחלק שנשאר. היא חלק מזכות השימוש שהחברה שילמה עליה.", level: 3, source: "מקורית", ref: "סעיף 101(א)" }),
  askNumber({ id: "slb-high", skill: "מכירה וחכירה בחזרה", prompt: "חברה מכרה מעבדה. ערך בספרים 200,000 ש״ח, שווי הוגן 450,000 ש״ח, ותמורה 480,000 ש״ח, והשליטה עברה לקונה. היא חוכרת אותה בחזרה ל-12 שנים, ב-40,000 ש״ח בסוף כל שנה, בריבית 4%. כמה רווח נרשם?", answer: P_HIGH_GAIN, steps: ["התמורה גבוהה ב-30,000: הלוואה (סעיף 101(ב))", `ערך נוכחי של התשלומים: =PV(4%;12;-40000) → ${fmt(P_HIGH_L)}`, `התחייבות חכירה: ${fmt(P_HIGH_L)} − 30,000 = ${fmt(P_HIGH_L - 30_000)}`, `נכס זכות שימוש: 200,000 × ${fmt(P_HIGH_L - 30_000)} ÷ 450,000 = ${fmt(P_HIGH_ROU)}`, `רווח: 480,000 + ${fmt(P_HIGH_ROU)} − 200,000 − ${fmt(P_HIGH_L)} = ${fmt(P_HIGH_GAIN)}`], trap: "לכלול את 30,000 ברווח. זה חוב, ולא תמורה על הנכס.", level: 3, source: "מקורית", ref: "סעיף 101(ב)" }),
  ask({ id: "slb-buyer", skill: "מכירה וחכירה בחזרה", prompt: "ההעברה היא מכירה. מה עושה הקונה-מחכיר?", options: ["רושם את הנכס לפי התקן הרלוונטי, ומסווג את החכירה כרגיל", "רושם השקעה נטו בכל מקרה", "רושם הלוואה לקבל", "לא רושם כלום עד סוף החכירה"], answer: 0, why: "מבחינתו הוא קנה נכס והחכיר אותו (סעיף 100(ב)).", trap: "לחשוב שעסקה כזו היא תמיד מימונית. מבחן הסיווג רגיל.", level: 2, source: "מקורית", ref: "סעיף 100(ב)" }),
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
    { id: "ls-spc-land", title: "קרקע ומבנה: למה בודקים כל אחד לחוד" },
    { id: "ls-spc-split", title: "מקצים: שתי חכירות בחוזה אחד" },
    { id: "ls-spc-whole", title: "בלי הקצאה, או קרקע לא מהותית" },
    { id: "ls-spc-sub", title: "חכירת משנה: מול מה מסווגים" },
    { id: "ls-spc-subfin", title: "חכירת משנה מימונית" },
    { id: "ls-spc-subop", title: "חכירת משנה תפעולית" },
    { id: "ls-spc-ip", title: "מעבר לנדל״ן להשקעה בשווי הוגן" },
    { id: "ls-spc-rates", title: "ריבית חודשית וחצי שנתית" },
    { id: "ls-spc-slb", title: "מכירה וחכירה בחזרה: האם בכלל מכרו" },
    { id: "ls-spc-fair", title: "מכירה בתנאי שוק: רווח על החלק שעבר" },
    { id: "ls-spc-high", title: "תנאים מעל השוק: הלוואה" },
    { id: "ls-spc-low", title: "תנאים מתחת לשוק: מקדמה" },
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
    "תנאים מתחת לשוק: מקדמה. תנאים מעל השוק: הלוואה.",
  ],
};
