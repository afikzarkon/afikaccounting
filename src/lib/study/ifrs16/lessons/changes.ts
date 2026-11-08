import { pvEnd, pvStart } from "../../../learn/ifrs16";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt, type LeaseQuestion } from "../shared";
import type { TestEnd, TestNode } from "./what";

const r = Math.round;

/** The screen's rule for each kind of change: which rate, and where the change goes. */
export const RATE_ROWS: [string, string, string, string][] = [
  ["מדד", "ישנה", "נכס", "סעיפים 42(ב), 43"],
  ["דמי שכירות בשוק", "ישנה", "נכס", "סעיפים 42(ב), 43"],
  ["תשלום צפוי בערבות שייר", "ישנה", "נכס", "סעיפים 42(א), 43"],
  ["הערכת תקופה", "חדשה", "נכס", "סעיף 40(א)"],
  ["הערכת אופציית רכישה", "חדשה", "נכס", "סעיף 40(ב)"],
  ["ריבית משתנה", "חדשה", "נכס", "סעיף 43"],
  ["מטבע חוץ", "ישנה", "רווח או הפסד", "IAS 21"],
];

export const RATE_ITEMS: { text: string; answer: "old" | "new"; why: string }[] = [
  { text: "מדד המחירים עלה, והתשלום החוזי התעדכן.", answer: "old", why: "סעיף 43: החוזה לא השתנה בעיקרו, ורק התזרים עודכן." },
  { text: "החוכר מעריך עכשיו שערך השייר יהיה נמוך מהערבות בסכום אחר.", answer: "old", why: "סעיפים 42(א), 43." },
  { text: "אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיאריך.", answer: "new", why: "סעיפים 40(א), 41: התקופה השתנתה, ולכן גם המחיר של הכסף." },
  { text: "עכשיו ודאי באופן סביר שהחוכר יממש אופציית רכישה.", answer: "new", why: "סעיפים 40(ב), 41." },
  { text: "התשלומים צמודים לריבית בנק ישראל, והיא עלתה.", answer: "new", why: "סעיף 43: השינוי נובע מהריבית עצמה, ולכן מעדכנים אותה." },
];
export const RATE_OPTIONS: [string, string][] = [
  ["old", "ריבית ישנה"],
  ["new", "ריבית מעודכנת"],
];

/** A change larger than the asset: it stops at zero, and the rest is a gain (paragraph 39). */
export const ZERO = { asset: 20_000, decrease: 26_000 };
export const ZERO_GAIN = ZERO.decrease - ZERO.asset;

/** Worked: an index-linked lease, over two years in which the index moves. */
export const IDX = { payment: 40_000, years: 8, rate: 0.06, base: 100, indexes: [105, 108], rates: [0.07, 0.05], life: 10 };
export type IndexRow = { year: number; opening: number; interest: number; paid: number; before: number; after: number; change: number; rouOpen: number; dep: number; rou: number; nonCurrent: number; current: number };
const IDX_COST = r(pvEnd(IDX.rate, IDX.years, IDX.payment));
export const IDX_START = IDX_COST;
export const IDX_ROWS: IndexRow[] = (() => {
  let opening = IDX_COST;
  let rouOpen = IDX_COST;
  return IDX.indexes.map((index, k) => {
    const interest = r(opening * IDX.rate);
    const paid = r((IDX.payment * index) / IDX.base);
    const before = opening + interest - paid;
    const left = IDX.years - k - 1;
    const after = r(pvEnd(IDX.rate, left, paid));
    const dep = r(rouOpen / (IDX.years - k));
    const change = after - before;
    const rou = rouOpen - dep + change;
    const nonCurrent = r(pvEnd(IDX.rate, left - 1, paid));
    const row = { year: k + 1, opening, interest, paid, before, after, change, rouOpen, dep, rou, nonCurrent, current: after - nonCurrent };
    opening = after;
    rouOpen = rou;
    return row;
  });
})();

/** Worked: a guarantee whose expected shortfall falls after a year. */
export const GUAR = { payment: 55_000, years: 5, rate: 0.06, newRate: 0.07, ibr: 0.05, guarantee: 9_000, expected: 3_000, newExpected: 8_000, life: 8 };
export const GUAR_SHORT = GUAR.guarantee - GUAR.expected;
export const GUAR_NEW_SHORT = GUAR.guarantee - GUAR.newExpected;
export const GUAR_COST = r(pvEnd(GUAR.rate, GUAR.years, GUAR.payment, GUAR_SHORT));
export const GUAR_DEP1 = r(GUAR_COST / GUAR.years);
export const GUAR_INT1 = r(GUAR_COST * GUAR.rate);
export const GUAR_BEFORE = GUAR_COST + GUAR_INT1 - GUAR.payment;
export const GUAR_AFTER = r(pvEnd(GUAR.rate, GUAR.years - 1, GUAR.payment, GUAR_NEW_SHORT));
export const GUAR_CHANGE = GUAR_AFTER - GUAR_BEFORE;
export const GUAR_ROU1 = GUAR_COST - GUAR_DEP1 + GUAR_CHANGE;
export const GUAR_NC1 = r(pvEnd(GUAR.rate, GUAR.years - 2, GUAR.payment, GUAR_NEW_SHORT));
export const GUAR_DEP2 = r(GUAR_ROU1 / (GUAR.years - 1));
export const GUAR_INT2 = r(GUAR_AFTER * GUAR.rate);
export const GUAR_CLOSE2 = GUAR_AFTER + GUAR_INT2 - GUAR.payment;
export const GUAR_ROU2 = GUAR_ROU1 - GUAR_DEP2;
export const GUAR_NC2 = r(pvEnd(GUAR.rate, GUAR.years - 3, GUAR.payment, GUAR_NEW_SHORT));

/** Worked: an extension that becomes reasonably certain, paid in advance. */
export const TERM = { payment: 60_000, years: 8, rate: 0.06, newRate: 0.07, direct: 12_000, optionYears: 3, optionPayment: 66_000, eventYear: 5 };
export const TERM_GROSS = r(pvStart(TERM.rate, TERM.years, TERM.payment));
export const TERM_COST = TERM_GROSS + TERM.direct;
export const TERM_DEP = r(TERM_COST / TERM.years);
export const TERM_INT1 = r((TERM_GROSS - TERM.payment) * TERM.rate);
export const TERM_CLOSE1 = TERM_GROSS - TERM.payment + TERM_INT1;
export const TERM_ROU1 = TERM_COST - TERM_DEP;
export const TERM_LEFT = TERM.years - TERM.eventYear;
export const TERM_BEFORE_L = r(pvStart(TERM.rate, TERM_LEFT, TERM.payment));
export const TERM_BEFORE_A = r((TERM_COST * TERM_LEFT) / TERM.years);
const afterFlows = (k: number) => {
  const flows = [...Array(TERM_LEFT).fill(TERM.payment), ...Array(TERM.optionYears).fill(TERM.optionPayment)].slice(k);
  return flows.reduce((s: number, a: number, t: number) => s + a / (1 + TERM.newRate) ** t, 0);
};
export const TERM_AFTER_L = r(afterFlows(0));
export const TERM_CHANGE = TERM_AFTER_L - TERM_BEFORE_L;
export const TERM_AFTER_A = TERM_BEFORE_A + TERM_CHANGE;
export const TERM_NEW_YEARS = TERM_LEFT + TERM.optionYears;
export const TERM_DEP2 = r(TERM_AFTER_A / TERM_NEW_YEARS);
/** The second year after the change. */
export const TERM_OPEN7 = r(afterFlows(1));
export const TERM_INT7 = r((TERM_OPEN7 - TERM.payment) * TERM.newRate);
export const TERM_CLOSE7 = TERM_OPEN7 - TERM.payment + TERM_INT7;
export const TERM_ROU7 = TERM_AFTER_A - 2 * TERM_DEP2;

/** Worked: one office lease, three independent modifications. */
export const OFFICE = { area: 4_000, payment: 90_000, years: 9, passed: 5, rate: 0.05, newRate: 0.06 };
export const OFFICE_COST = r(pvEnd(OFFICE.rate, OFFICE.years, OFFICE.payment));
export const OFFICE_LEFT = OFFICE.years - OFFICE.passed;
export const OFFICE_A = r((OFFICE_COST * OFFICE_LEFT) / OFFICE.years);
export const OFFICE_L = r(pvEnd(OFFICE.rate, OFFICE_LEFT, OFFICE.payment));
/** א: three more years on the same terms. */
export const EXT = { extra: 3 };
export const EXT_AFTER = r(pvEnd(OFFICE.newRate, OFFICE_LEFT + EXT.extra, OFFICE.payment));
export const EXT_CHANGE = EXT_AFTER - OFFICE_L;
/** ב: half the area, a new payment. */
export const HALF = { area: 2_000, payment: 55_000 };
export const HALF_L_OUT = r(OFFICE_L / 2);
export const HALF_A_OUT = r(OFFICE_A / 2);
export const HALF_GAIN = HALF_L_OUT - HALF_A_OUT;
export const HALF_AFTER = r(pvEnd(OFFICE.newRate, OFFICE_LEFT, HALF.payment));
export const HALF_REM = HALF_AFTER - (OFFICE_L - HALF_L_OUT);
export const HALF_ASSET = OFFICE_A - HALF_A_OUT + HALF_REM;
/** ג: more area, but a shorter lease, at a price that isn't the extra area's own. */
export const CUT = { extraArea: 1_000, left: 2, payment: 110_000 };
export const CUT_KEEP = r(pvEnd(OFFICE.rate, CUT.left, OFFICE.payment));
export const CUT_L_OUT = OFFICE_L - CUT_KEEP;
export const CUT_A_OUT = r((OFFICE_A * (OFFICE_LEFT - CUT.left)) / OFFICE_LEFT);
export const CUT_GAIN = CUT_L_OUT - CUT_A_OUT;
export const CUT_R1 = r(pvEnd(OFFICE.newRate, CUT.left, OFFICE.payment));
export const CUT_M1 = CUT_R1 - CUT_KEEP;
export const CUT_R2 = r(pvEnd(OFFICE.newRate, CUT.left, CUT.payment));
export const CUT_M2 = CUT_R2 - CUT_R1;
export const CUT_ASSET = OFFICE_A - CUT_A_OUT + CUT_M1 + CUT_M2;
/** A modification that is a separate lease. */
export const SEP = { area: 1_000, yearly: 25_000, years: 4, rate: 0.06 };
export const SEP_L = r(pvEnd(SEP.rate, SEP.years, SEP.yearly));

/** Worked: a shop, made smaller or larger at the year's end. */
export const SHOP = { area: 600, payment: 240_000, years: 6, rate: 0.05, newRate: 0.06, sales: 300_000, share: 0.02, half: 300, discount: 0.9, perMeter: 400 };
export const SHOP_COST = r(pvEnd(SHOP.rate, SHOP.years, SHOP.payment));
export const SHOP_DEP = r(SHOP_COST / SHOP.years);
export const SHOP_INT = r(SHOP_COST * SHOP.rate);
export const SHOP_VAR = SHOP.sales * SHOP.share;
export const SHOP_BEFORE = SHOP_COST + SHOP_INT - SHOP.payment;
export const SHOP_A = SHOP_COST - SHOP_DEP;
export const SHOP_KEEP = r(SHOP_BEFORE / 2);
export const SHOP_A_KEEP = r(SHOP_A / 2);
export const SHOP_GAIN = SHOP_BEFORE - SHOP_KEEP - (SHOP_A - SHOP_A_KEEP);
export const SHOP_AFTER = r(pvEnd(SHOP.newRate, SHOP.years - 1, SHOP.payment / 2));
export const SHOP_REM = SHOP_AFTER - SHOP_KEEP;
export const SHOP_ASSET = SHOP_A_KEEP + SHOP_REM;
export const SHOP_NC = r(pvEnd(SHOP.newRate, SHOP.years - 2, SHOP.payment / 2));
export const SHOP_TOTAL = SHOP_DEP + SHOP_INT + SHOP_VAR - SHOP_GAIN;
export const SHOP_EXTRA = SHOP.half * SHOP.perMeter * SHOP.discount;
export const SHOP_B_PAY = SHOP.payment + SHOP_EXTRA;
export const SHOP_B_AFTER = r(pvEnd(SHOP.newRate, SHOP.years - 1, SHOP_B_PAY));
export const SHOP_B_CH = SHOP_B_AFTER - SHOP_BEFORE;
export const SHOP_B_ASSET = SHOP_A + SHOP_B_CH;
export const SHOP_B_NC = r(pvEnd(SHOP.newRate, SHOP.years - 2, SHOP_B_PAY));
export const SHOP_B_TOTAL = SHOP_DEP + SHOP_INT + SHOP_VAR;

/** A whole question: an index, a purchase option that isn't linked, and a share of sales. */
export const STORE = { payment: 100_000, years: 8, base: 100, index: 103, option: 8_000, life: 10, rate: 0.04, sales: 400_000, share: 0.02 };
export const STORE_COST = r(pvEnd(STORE.rate, STORE.years, STORE.payment, STORE.option));
export const STORE_DEP = r(STORE_COST / STORE.life);
export const STORE_INT = r(STORE_COST * STORE.rate);
export const STORE_PAID = (STORE.payment * STORE.index) / STORE.base;
export const STORE_BEFORE = STORE_COST + STORE_INT - STORE_PAID;
export const STORE_AFTER = r(pvEnd(STORE.rate, STORE.years - 1, STORE_PAID, STORE.option));
export const STORE_CH = STORE_AFTER - STORE_BEFORE;
export const STORE_ROU = STORE_COST - STORE_DEP + STORE_CH;
export const STORE_NC = r(pvEnd(STORE.rate, STORE.years - 2, STORE_PAID, STORE.option));
export const STORE_VAR = STORE.sales * STORE.share;

/** The closing question: floors in one building, one going, the others staying longer at a new price. */
export const MASTER = { floors: 4, perFloor: 240_000, years: 6, passed: 2, rate: 0.06, newRate: 0.08, newPerFloor: 210_000, newYears: 6, topLeft: 1 };
export const M_COST = r(pvEnd(MASTER.rate, MASTER.years, MASTER.perFloor));
export const M_LEFT = MASTER.years - MASTER.passed;
export const M_A = r((M_COST * M_LEFT) / MASTER.years);
export const M_L = r(pvEnd(MASTER.rate, M_LEFT, MASTER.perFloor));
export const M_TOP_KEEP = r(pvEnd(MASTER.rate, MASTER.topLeft, MASTER.perFloor));
export const M_TOP_L_OUT = M_L - M_TOP_KEEP;
export const M_TOP_A_KEEP = r((M_A * MASTER.topLeft) / M_LEFT);
export const M_TOP_A_OUT = M_A - M_TOP_A_KEEP;
export const M_TOP_GAIN = M_TOP_L_OUT - M_TOP_A_OUT;
export const M_TOP_AFTER = r(pvEnd(MASTER.newRate, MASTER.topLeft, MASTER.newPerFloor));
export const M_TOP_REM = M_TOP_AFTER - M_TOP_KEEP;
export const M_TOP_ASSET = M_TOP_A_KEEP + M_TOP_REM;
export const M_REST = MASTER.floors - 1;
export const M_REST_L = r(pvEnd(MASTER.rate, M_LEFT, MASTER.perFloor) * M_REST);
export const M_REST_A = r(((pvEnd(MASTER.rate, MASTER.years, MASTER.perFloor) * M_LEFT) / MASTER.years) * M_REST);
export const M_REST_AFTER = r(pvEnd(MASTER.newRate, MASTER.newYears, MASTER.newPerFloor) * M_REST);
export const M_REST_CH = M_REST_AFTER - M_REST_L;
export const M_REST_ASSET = M_REST_A + M_REST_CH;

/** What changed, and what to do: the course's walk through paragraphs 39 to 46. */
export const CHANGE_WALK: Record<string, TestNode | TestEnd> = {
  changed: { q: "הצדדים שינו את תנאי החוזה?", par: "נספח א׳", help: "תיקון הוא שינוי בהיקף או בתמורה, שלא היה חלק מהתנאים המקוריים.", answers: [{ label: "כן, יש תיקון", to: "adds" }, { label: "לא, השתנו אומדן או מדד", to: "what" }] },
  what: { q: "מה השתנה?", par: "סעיפים 40–43", help: "החוזה נשאר, אבל התשלומים הצפויים השתנו. זו הערכה מחדש.", answers: [{ label: "הערכה של תקופה או אופציית רכישה", to: "newRate" }, { label: "מדד, או תשלום צפוי בערבות", to: "oldRate" }, { label: "ריבית משתנה", to: "floating" }, { label: "מטבע חוץ", to: "fx" }] },
  newRate: { lease: true, verdict: "ריבית מעודכנת, כנגד הנכס", why: "סעיפים 40, 41: מדדים מחדש בשיעור של היום. הפרש ההתחייבות מתאים את הנכס." },
  oldRate: { lease: true, verdict: "ריבית ישנה, כנגד הנכס", why: "סעיפים 42, 43: רק התזרים עודכן, ולכן הריבית נשארת." },
  floating: { lease: true, verdict: "ריבית מעודכנת, כנגד הנכס", why: "סעיף 43: כשהשינוי נובע מהריבית עצמה, מעדכנים אותה." },
  fx: { lease: true, verdict: "ריבית ישנה, לרווח או הפסד", why: "הפרש השער הוא הפרש תרגום של התחייבות כספית לפי IAS 21, והוא לא נוגע לנכס." },
  adds: { q: "התיקון מוסיף זכות להשתמש בנכס?", par: "סעיף 44(א)", help: "למשל עוד קומה או עוד מכונה. הארכה של אותו נכס אינה תוספת כזו.", answers: [{ label: "כן", to: "price" }, { label: "לא", to: "shrinks" }] },
  price: { q: "התמורה עלתה במחיר הנפרד של התוספת?", par: "סעיף 44(ב)", help: "מותר תיאום מתאים, למשל הנחה על חיסכון של המחכיר בשיווק.", answers: [{ label: "כן", to: "separate" }, { label: "לא", to: "shrinks" }] },
  separate: { lease: true, verdict: "חכירה נפרדת", why: "סעיף 44: התוספת נמדדת כחכירה חדשה, והחכירה המקורית לא נוגעים בה." },
  shrinks: { q: "התיקון גם מקטין את ההיקף: שטח קטן, או תקופה קצרה?", par: "סעיף 46(א)", help: "גם קיצור תקופה הוא הקטנת היקף.", answers: [{ label: "כן", to: "decrease" }, { label: "לא", to: "other" }] },
  decrease: { lease: true, verdict: "קודם גריעה ורווח או הפסד, ואז מדידה מחדש", why: "סעיפים 45, 46(א): גורעים את החלק שנעלם, ואת השאר מודדים בריבית מעודכנת כנגד הנכס." },
  other: { lease: true, verdict: "מדידה מחדש כנגד הנכס, בריבית מעודכנת", why: "סעיפים 45, 46(ב): בלי רווח או הפסד." },
};
export const CHANGE_WALK_START = "changed";

const P_INDEX = r(pvEnd(0.05, 4, 21_000)) - r(pvEnd(0.05, 4, 20_000));
const P_GUAR = r(pvEnd(0.07, 3, 30_000, 5_000)) - r(pvEnd(0.07, 3, 30_000, 1_000));
const P_TERM_BEFORE = r(pvEnd(0.06, 3, 50_000));
const P_TERM_AFTER = r(pvEnd(0.08, 5, 50_000));
const P_EXT_BEFORE = r(pvEnd(0.05, 4, 36_000));
const P_EXT_AFTER = r(pvEnd(0.07, 7, 36_000));
const P_SHR = { L: r(pvEnd(0.05, 4, 70_000)), A: 210_000 };
const P_SHR_OUT_L = r(P_SHR.L * 0.4);
const P_SHR_GAIN = P_SHR_OUT_L - 84_000;
const P_SHR_AFTER = r(pvEnd(0.06, 4, 45_000));
const P_SHR_REM = P_SHR_AFTER - (P_SHR.L - P_SHR_OUT_L);
const P_CUT_L = r(pvEnd(0.06, 5, 75_000));
const P_CUT_KEEP = r(pvEnd(0.06, 2, 75_000));
const P_CUT_GAIN = P_CUT_L - P_CUT_KEEP - 162_000;
const P_NC = r(pvEnd(0.05, 5, 63_000));
const P_BUY_B = r(pvEnd(0.05, 3, 40_000));
const P_BUY_A = r(pvEnd(0.07, 3, 40_000, 20_000));
const P_BUY_ROU = 150_000 + P_BUY_A - P_BUY_B;
const J = { L: r(pvEnd(0.06, 5, 30_000)), N: r(pvEnd(0.06, 5, 31_500)) };
const JS = { L: 150_000, A: 130_000 };

const exercises: (LeaseQuestion | ReturnType<typeof journal>)[] = [
  ask({
    id: "rate-index",
    skill: "איזו ריבית",
    prompt: "תשלומי חכירה צמודים למדד. המדד עלה והתשלום עודכן. הריבית בתחילת החכירה 5%, והריבית התוספתית היום 7%. באיזו ריבית מודדים מחדש?",
    options: ["5%", "7%", "הממוצע, 6%", "לא מודדים מחדש"],
    answer: 0,
    why: "סעיף 43: בשינוי מדד לא משנים את שיעור ההיוון.",
    trap: "לעדכן ריבית בכל שינוי. בהערכה מחדש, רק שינוי בתקופה, באופציית רכישה או בריבית משתנה מעדכן אותה.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 43",
  }),
  ask({
    id: "rate-term",
    skill: "איזו ריבית",
    prompt: "אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיאריך את החכירה. הריבית הגלומה ליתרת התקופה לא ניתנת לקביעה בנקל. הריבית בתחילת החכירה 5%, והריבית התוספתית היום 7%. באיזו ריבית מודדים מחדש?",
    options: ["7%", "5%", "6%", "החוכר בוחר"],
    answer: 0,
    why: "סעיפים 40(א), 41: שיעור מעודכן. הגלומה אם ניתנת לקביעה בנקל, ואחרת התוספתית במועד ההערכה מחדש.",
    trap: "להשאיר את הריבית הישנה כי החוזה לא השתנה. שינוי תקופה מעדכן ריבית גם בלי תיקון.",
    level: 1,
    source: "מקורית",
    ref: "סעיפים 40, 41",
  }),
  ask({
    id: "when-index",
    skill: "מדד",
    prompt: "התשלום צמוד למדד, אבל לפי החוזה הוא מתעדכן רק פעם בשלוש שנים. השנה המדד עלה ב-4%, והעדכון הבא בעוד שנתיים. מה עושים השנה?",
    options: ["לא מודדים מחדש. מודדים כשהתשלום מתעדכן בפועל", "מודדים מחדש לפי המדד החדש", "מעלים את ההתחייבות לפי תחזית", "רושמים הוצאה של 4%"],
    answer: 0,
    why: "סעיף 42(ב): רק כשחל שינוי בתזרימי המזומנים, כלומר במועד שבו התיאום נכנס לתוקף.",
    trap: "לעדכן לפי המדד בכל 31.12. בודקים מתי התשלום החוזי משתנה.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 42(ב)",
  }),
  askNumber({
    id: "index-up",
    skill: "מדד",
    prompt: "אחרי התשלום של 31.12 נשארו 4 תשלומים של 20,000 ש״ח בסוף כל שנה. המדד עלה ב-5%, והתשלומים הבאים יהיו 21,000 ש״ח. הריבית בתחילת החכירה 5%, והריבית התוספתית היום 8%. בכמה גדלה ההתחייבות?",
    answer: P_INDEX,
    steps: [`לא משנים ריבית (סעיף 43).\nלפני: 20,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(r(pvEnd(0.05, 4, 20_000)))}`, `אחרי: 21,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(r(pvEnd(0.05, 4, 21_000)))}`, `${fmt(r(pvEnd(0.05, 4, 21_000)))} − ${fmt(r(pvEnd(0.05, 4, 20_000)))} = ${fmt(P_INDEX)}`],
    trap: "להיוון ב-8%. הריבית התוספתית של היום לא רלוונטית לשינוי מדד.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 42(ב), 43",
  }),
  askNumber({
    id: "guar-down",
    skill: "ערבות שייר",
    prompt: "נשארו 3 תשלומים של 30,000 ש״ח בסוף כל שנה, והריבית בתחילת החכירה 7%. החוכר ערב לערך שייר של 9,000 ש״ח. הוא צפה ערך של 4,000 ש״ח, ועכשיו צופה 8,000 ש״ח. בכמה קטנה ההתחייבות?",
    answer: P_GUAR,
    steps: ["לפני: 9,000 − 4,000 = 5,000 צפוי לתשלום. אחרי: 9,000 − 8,000 = 1,000.", `${fmt(r(pvEnd(0.07, 3, 30_000, 5_000)))} − ${fmt(r(pvEnd(0.07, 3, 30_000, 1_000)))} = ${fmt(P_GUAR)}`, "באקסל: הפרש בין =PV(7%;3;-30000;-5000) לבין =PV(7%;3;-30000;-1000)"],
    trap: "להוריד 4,000 בלי להוון. השינוי קורה בעוד 3 שנים, ולכן מהוונים אותו.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 42(א), 43",
  }),
  askNumber({
    id: "zero-gain",
    skill: "כנגד הנכס",
    prompt: "יתרת נכס זכות השימוש 15,000 ש״ח. מדידה מחדש מקטינה את התחייבות החכירה ב-22,000 ש״ח. כמה רווח נרשם?",
    answer: 7_000,
    steps: ["הנכס יורד עד אפס: 15,000 (סעיף 39).", "השאר ברווח או הפסד: 22,000 − 15,000 = 7,000"],
    trap: "להציג נכס שלילי. הנכס עוצר באפס.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 39",
  }),
  askNumber({
    id: "dep-after",
    skill: "פחת אחרי שינוי",
    prompt: "אחרי מדידה מחדש יתרת נכס זכות השימוש 120,000 ש״ח, ונשארו 4 שנות חכירה. הנכס חוזר למחכיר, והפחת בקו ישר. מהו הפחת השנתי מעכשיו?",
    answer: 30_000,
    steps: ["יתרה ÷ יתרת תקופה = פחת\n120,000 ÷ 4 = 30,000"],
    trap: "להמשיך בפחת הישן ולהוסיף לו. כל שינוי מתפזר על השנים שנשארו.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 30(ב)",
  }),
  askNumber({
    id: "term-up",
    skill: "הערכת תקופה",
    prompt: "נשארו 3 תשלומים של 50,000 ש״ח בסוף כל שנה, בריבית 6%. אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיממש הארכה בשנתיים, בלי שינוי בתשלום. הריבית התוספתית היום 8%. בכמה גדלה ההתחייבות?",
    answer: P_TERM_AFTER - P_TERM_BEFORE,
    steps: [`לפני, בריבית הישנה: 50,000 × (1 − 1.06^(−3)) ÷ 0.06 = ${fmt(P_TERM_BEFORE)}`, `אחרי, 5 תשלומים בריבית המעודכנת: 50,000 × (1 − 1.08^(−5)) ÷ 0.08 = ${fmt(P_TERM_AFTER)}`, `${fmt(P_TERM_AFTER)} − ${fmt(P_TERM_BEFORE)} = ${fmt(P_TERM_AFTER - P_TERM_BEFORE)}`],
    trap: "להוון רק את שתי השנים הנוספות. כל היתרה נמדדת מחדש בריבית החדשה.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 40(א), 41",
  }),
  askNumber({
    id: "buy-dep",
    skill: "אופציית רכישה",
    prompt: "נשארו 3 תשלומים של 40,000 ש״ח בסוף כל שנה, בריבית 5%. יתרת הנכס 150,000 ש״ח. עכשיו ודאי באופן סביר שהחוכר יממש בסוף התקופה אופציית רכישה ב-20,000 ש״ח. הריבית התוספתית היום 7%. לנכס נשארו 8 שנות חיים, והפחת בקו ישר. מהו הפחת השנתי מעכשיו?",
    answer: r(P_BUY_ROU / 8),
    steps: [`לפני: ${fmt(P_BUY_B)}. אחרי: 40,000 × (1 − 1.07^(−3)) ÷ 0.07 + 20,000 ÷ 1.07^3 = ${fmt(P_BUY_A)}`, `נכס: 150,000 + ${fmt(P_BUY_A)} − ${fmt(P_BUY_B)} = ${fmt(P_BUY_ROU)}`, `עכשיו החוכר יקבל את הנכס, ולכן לאורך החיים (סעיף 32).\n${fmt(P_BUY_ROU)} ÷ 8 = ${fmt(r(P_BUY_ROU / 8))}`],
    trap: "להמשיך להפחית על פני 3 השנים. אופציה ודאית מעבירה את הפחת לאורך החיים.",
    level: 3,
    source: "מקורית",
    ref: "סעיפים 32, 40(ב)",
  }),
  ask({
    id: "floating",
    skill: "איזו ריבית",
    prompt: "התשלומים צמודים לריבית הפריים, והיא עלתה. מה עושים?",
    options: ["מודדים מחדש בשיעור מעודכן שמשקף את השינוי, כנגד הנכס", "מודדים מחדש בריבית הישנה, כנגד הנכס", "רושמים הפרש ברווח או הפסד", "לא עושים כלום"],
    answer: 0,
    why: "סעיף 43: כשהשינוי נובע מריבית משתנה, משתמשים בשיעור מעודכן.",
    trap: "להתייחס לזה כמו למדד מחירים. מדד לא משנה ריבית, ריבית משתנה כן.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 43",
  }),
  ask({
    id: "fx",
    skill: "איזו ריבית",
    prompt: "התשלומים נקובים באירו, והשער עלה. לפי טבלת הקורס, מה קורה להפרש בהתחייבות?",
    options: ["ריבית ישנה, והפרש לרווח או הפסד", "ריבית חדשה, והפרש לנכס", "ריבית ישנה, והפרש לנכס", "ריבית חדשה, והפרש לרווח או הפסד"],
    answer: 0,
    why: "הפרשי שער על התחייבות כספית נרשמים לפי IAS 21 ברווח או הפסד. הנכס לא משתנה.",
    trap: "להתייחס למטבע כמו למדד. במדד ההפרש הולך לנכס, במטבע חוץ לרווח או הפסד.",
    level: 3,
    source: "מקורית",
    ref: "IAS 21",
  }),
  ask({
    id: "separate",
    skill: "חכירה נפרדת",
    prompt: "החוכר מוסיף קומה לחוזה, במחיר השוק של הקומה. איך מטפלים?",
    options: ["חכירה נפרדת, והחכירה המקורית לא משתנה", "מדידה מחדש של כל החכירה בריבית חדשה", "גריעה עם רווח או הפסד", "הוצאה בקו ישר"],
    answer: 0,
    why: "סעיף 44: מתקיימים שני התנאים, תוספת זכות שימוש ותמורה לפי המחיר הנפרד.",
    trap: "למדוד מחדש את כל החוזה. התוספת היא חוזה חדש לכל דבר.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 44",
  }),
  ask({
    id: "not-separate",
    skill: "חכירה נפרדת",
    prompt: "החוכר מוסיף שטח במחיר של 70% ממחיר השוק, והנחה זו אינה משקפת חיסכון של המחכיר. איך מטפלים?",
    options: ["מדידה מחדש של ההתחייבות בריבית מעודכנת, כנגד הנכס", "חכירה נפרדת", "גריעה ורווח", "בלי שינוי עד סוף התקופה"],
    answer: 0,
    why: "סעיפים 44(ב), 45, 46(ב): המחיר אינו המחיר הנפרד, ולכן זו אינה חכירה נפרדת.",
    trap: "לומר ״חכירה נפרדת״ בכל תוספת שטח. נדרשים שני התנאים.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 44–46",
  }),
  ask({
    id: "mod-date",
    skill: "מועד התיקון",
    prompt: "ב-1.1 הצדדים הסכימו שקומה אחת תוחזר רק בעוד שנה. מתי מטפלים בתיקון?",
    options: ["ב-1.1, במועד שבו הצדדים הסכימו", "בעוד שנה, כשהקומה מוחזרת", "בסוף השנה", "רק אם ההחזרה מיידית"],
    answer: 0,
    why: "סעיף 45: מודדים מחדש במועד התחילה של התיקון, המועד שבו הצדדים הסכימו (נספח א׳).",
    trap: "לחכות לביצוע בפועל. ההסכמה קובעת, גם כשההשפעה בעתיד.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 45, נספח א׳",
  }),
  askNumber({
    id: "extend",
    skill: "הארכה בתיקון",
    prompt: "נשארו 4 תשלומים של 36,000 ש״ח בסוף כל שנה, בריבית 5%. הצדדים תיקנו את החוזה, והוסיפו 3 שנים בלי שינוי בתשלום. הריבית התוספתית היום 7%. בכמה גדל נכס זכות השימוש?",
    answer: P_EXT_AFTER - P_EXT_BEFORE,
    steps: [`לפני: 36,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(P_EXT_BEFORE)}`, `אחרי: 36,000 × (1 − 1.07^(−7)) ÷ 0.07 = ${fmt(P_EXT_AFTER)}`, `${fmt(P_EXT_AFTER)} − ${fmt(P_EXT_BEFORE)} = ${fmt(P_EXT_AFTER - P_EXT_BEFORE)}`],
    trap: "לחשוב שהארכה היא חכירה נפרדת. אין כאן זכות להשתמש בנכס נוסף.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 45, 46(ב)",
  }),
  askNumber({
    id: "shrink-gain",
    skill: "הקטנת היקף",
    prompt: "נשארו 4 תשלומים של 70,000 ש״ח בסוף כל שנה, בריבית 5%. יתרת הנכס 210,000 ש״ח. הצדדים הקטינו את השטח ב-40%, והתשלום יהיה 45,000 ש״ח. הריבית התוספתית היום 6%. כמה רווח נרשם?",
    answer: P_SHR_GAIN,
    steps: [`ההתחייבות: 70,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(P_SHR.L)}`, `גריעה: ${fmt(P_SHR.L)} × 0.4 = ${fmt(P_SHR_OUT_L)} מההתחייבות, 210,000 × 0.4 = 84,000 מהנכס.`, `${fmt(P_SHR_OUT_L)} − 84,000 = ${fmt(P_SHR_GAIN)}`],
    trap: "להשוות ישירות להתחייבות החדשה. קודם גורעים, ורק אחר כך מודדים מחדש.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 46(א)",
  }),
  askNumber({
    id: "shrink-rem",
    skill: "הקטנת היקף",
    prompt: "נשארו 4 תשלומים של 70,000 ש״ח בסוף כל שנה, בריבית 5%. הצדדים הקטינו את השטח ב-40%, והתשלום יהיה 45,000 ש״ח. הריבית התוספתית היום 6%. אחרי הגריעה של 40%, בכמה משתנה ההתחייבות במדידה מחדש?",
    answer: Math.abs(P_SHR_REM),
    steps: [`אחרי גריעה: ${fmt(P_SHR.L)} − ${fmt(P_SHR_OUT_L)} = ${fmt(P_SHR.L - P_SHR_OUT_L)}`, `אחרי מדידה מחדש: 45,000 × (1 − 1.06^(−4)) ÷ 0.06 = ${fmt(P_SHR_AFTER)}`, `${fmt(P_SHR_AFTER)} − ${fmt(P_SHR.L - P_SHR_OUT_L)} = ${fmt(P_SHR_REM)}`],
    trap: "לרשום גם את ההפרש הזה ברווח או הפסד. המדידה מחדש הולכת לנכס.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 45, 46",
  }),
  askNumber({
    id: "cut-gain",
    skill: "קיצור תקופה",
    prompt: "נשארו 5 תשלומים של 75,000 ש״ח, בסוף כל שנה, בריבית 6%. יתרת הנכס 270,000 ש״ח. הצדדים קיצרו את החכירה, כך שנשארו 2 תשלומים בלבד, בלי שינוי בסכום. כמה רווח נרשם?",
    answer: P_CUT_GAIN,
    steps: ["קיצור תקופה הוא הקטנת היקף. נשארו 2 מתוך 5 שנים.", `גריעה מהנכס: 270,000 × 3 ÷ 5 = 162,000`, `גריעה מההתחייבות: ${fmt(P_CUT_L)} − ${fmt(P_CUT_KEEP)} = ${fmt(P_CUT_L - P_CUT_KEEP)}`, `רווח: ${fmt(P_CUT_L - P_CUT_KEEP)} − 162,000 = ${fmt(P_CUT_GAIN)}`],
    trap: "לגרוע 60% מההתחייבות. ההתחייבות יורדת לפי מה שנשאר בערך נוכחי, לא באחוז השנים.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 46(א)",
  }),
  askNumber({
    id: "nc-after",
    skill: "שוטף אחרי שינוי",
    prompt: "אחרי תשלום ב-31.12, ועדכון לפי מדד, נשארו 6 תשלומים של 63,000 ש״ח בסוף כל שנה. הריבית בתחילת החכירה 5%. מהו החלק הלא שוטף של ההתחייבות?",
    answer: P_NC,
    steps: [`אחרי התשלום הבא נשארים 5 תשלומים, לפי התשלום המעודכן.\n63,000 × (1 − 1.05^(−5)) ÷ 0.05 = ${fmt(P_NC)}`],
    trap: "לחשב לפי התשלום הישן, או לפי תחזית למדד. לוקחים את התשלום החוזי המעודכן.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 42(ב)",
  }),
  askNumber({
    id: "shop-total",
    skill: "הקטנת היקף",
    prompt: `חברה חכרה חנות של ${fmt(SHOP.area)} מ״ר ל-${SHOP.years} שנים, ב-${fmt(SHOP.payment)} ש״ח בסוף כל שנה, בריבית ${SHOP.rate * 100}%, ועוד 2% מהכנסות החנות, שהיו השנה ${fmt(SHOP.sales)} ש״ח. הפחת בקו ישר על פני התקופה. ב-31.12 של השנה הראשונה, אחרי התשלום, הצדדים הקטינו את השטח ל-${fmt(SHOP.half)} מ״ר, בתשלום של ${fmt(SHOP.payment / 2)} ש״ח, בריבית ${SHOP.newRate * 100}%. מהו סך ההוצאות נטו בדוח רווח או הפסד של השנה הראשונה?`,
    answer: SHOP_TOTAL,
    steps: [`פחת: ${fmt(SHOP_DEP)}. מימון: ${fmt(SHOP_INT)}. לפי הכנסות: ${fmt(SHOP_VAR)}.`, `רווח מהקטנה: ${fmt(SHOP_BEFORE - SHOP_KEEP)} − ${fmt(SHOP_A - SHOP_A_KEEP)} = ${fmt(SHOP_GAIN)}`, `${fmt(SHOP_DEP)} + ${fmt(SHOP_INT)} + ${fmt(SHOP_VAR)} − ${fmt(SHOP_GAIN)} = ${fmt(SHOP_TOTAL)}`],
    trap: "לשכוח את רווח ההקטנה, או לרשום ברווח או הפסד גם את המדידה מחדש.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 46(א)",
  }),
  askNumber({
    id: "store-rou",
    skill: "מדד",
    prompt: `חברה חכרה חנות ל-${STORE.years} שנים, ב-${fmt(STORE.payment)} ש״ח בסוף כל שנה, צמוד למדד, בריבית ${STORE.rate * 100}%. ודאי באופן סביר שבסוף התקופה תקנה אותה ב-${fmt(STORE.option)} ש״ח, סכום שאינו צמוד. אורך החיים ${STORE.life} שנים, והפחת בקו ישר. בסוף השנה הראשונה המדד עלה מ-${STORE.base} ל-${STORE.index}, והתשלום של 31.12 כבר לפי המדד החדש. מהי יתרת נכס זכות השימוש ב-31.12 של השנה הראשונה?`,
    answer: STORE_ROU,
    steps: [`עלות: ${fmt(STORE_COST)}. פחת על פני ${STORE.life} שנים: ${fmt(STORE_DEP)}.`, `מימון: ${fmt(STORE_INT)}. תשלום: ${fmt(STORE_PAID)}. לפני מדידה מחדש: ${fmt(STORE_BEFORE)}.`, `אחרי, בריבית הישנה, ומחיר האופציה בלי הצמדה: ${fmt(STORE_AFTER)}. הפרש: ${fmt(STORE_CH)}.`, `נכס: ${fmt(STORE_COST)} − ${fmt(STORE_DEP)} + ${fmt(STORE_CH)} = ${fmt(STORE_ROU)}`],
    trap: "להצמיד גם את מחיר האופציה, או להשתמש בתשלום הישן של 31.12.",
    level: 3,
    source: "מקורית",
    ref: "סעיפים 32, 42(ב), 43",
  }),
  Object.assign(
    journal(
      "index-entry",
      "פקודת יומן",
      `אחרי התשלום של 31.12 נשארו 5 תשלומים בסוף כל שנה, בריבית 6%. בעקבות עליית המדד התשלום עולה מ-30,000 ל-31,500 ש״ח. רשמו את פקודת המדידה מחדש.`,
      [
        { account: "נכס זכות שימוש", dr: J.N - J.L },
        { account: "התחייבות חכירה", cr: J.N - J.L },
      ],
      `לפני: ${fmt(J.L)}. אחרי: ${fmt(J.N)}. הפרש: ${fmt(J.N - J.L)}. מלכודת נפוצה: לרשום את ההפרש כהוצאת מימון. הוא מתאים את הנכס (סעיף 39).`,
      ["נכס זכות שימוש", "התחייבות חכירה", "הוצאות מימון", "מזומן", "רווח מעדכון התחייבות"],
    ),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 39" } },
  ),
  Object.assign(
    journal(
      "shrink-entry",
      "פקודת יומן",
      `יתרת התחייבות החכירה ${fmt(JS.L)} ש״ח, ויתרת הנכס ${fmt(JS.A)} ש״ח. הצדדים הקטינו את השטח במחצית, בלי שינוי אחר. רשמו את פקודת הגריעה.`,
      [
        { account: "התחייבות חכירה", dr: JS.L / 2 },
        { account: "נכס זכות שימוש", cr: JS.A / 2 },
        { account: "רווח מתיקון חכירה", cr: (JS.L - JS.A) / 2 },
      ],
      `גורעים מחצית משני הצדדים, וההפרש הוא רווח (סעיף 46(א)). מלכודת נפוצה: לזקוף את ההפרש לנכס, כמו במדידה מחדש.`,
      ["התחייבות חכירה", "נכס זכות שימוש", "רווח מתיקון חכירה", "מזומן", "הוצאות מימון"],
    ),
    { meta: { level: 2 as const, source: "מקורית" as const, ref: "סעיף 46(א)" } },
  ),
];

const traps: Trap[] = [
  {
    id: "forecast",
    prompt: "חוכר מעדכן התחייבות אחרי שהמדד עלה. המדד צפוי לעלות עוד 2% בשנה. איך נראים התשלומים העתידיים בחישוב?",
    options: ["כולם לפי התשלום החוזי המעודכן של היום", "כל אחד לפי התחזית שלו", "הקרוב מעודכן, והשאר לפי החוזה המקורי", "לפי ממוצע של שני המדדים"],
    answer: 0,
    why: "סעיף 42(ב): לפי התשלומים החוזיים המעודכנים, בלי תחזית.",
    traps: ["", "התקן לא מכניס תחזית למדד, לא ביום הראשון ולא אחר כך.", "העדכון חל על כל יתרת התקופה.", "אין ממוצעים. לוקחים את המדד שקבע את התשלום."],
  },
  {
    id: "order",
    prompt: "תיקון גם מקטין שטח וגם משנה תשלום. מה הסדר?",
    options: ["קודם גריעה ורווח או הפסד, ואז מדידה מחדש כנגד הנכס", "קודם מדידה מחדש, ואז גריעה", "הכול ביחד לרווח או הפסד", "הכול ביחד כנגד הנכס"],
    answer: 0,
    why: "סעיף 46(א) מטפל בחלק שבוטל, וסעיף 45(ג) בכל השאר.",
    traps: ["", "הסדר הפוך מערבב שינוי ריבית בתוך הגריעה, ומשנה את הרווח.", "רק החלק שבוטל הולך לרווח או הפסד.", "החלק שבוטל כבר לא נכס, ולכן ההפרש שלו הוא רווח או הפסד."],
  },
  {
    id: "extend-separate",
    prompt: "הצדדים האריכו חכירה בשנתיים, במחיר השוק. האם זו חכירה נפרדת?",
    options: ["לא. אין זכות להשתמש בנכס נוסף, ולכן מודדים מחדש", "כן, כי המחיר הוא מחיר שוק", "כן, כי התקופה גדלה", "רק אם ההארכה מעל שנה"],
    answer: 0,
    why: "סעיף 44(א) דורש הוספה של זכות להשתמש בנכס בסיס.",
    traps: ["", "מחיר שוק הוא רק התנאי השני.", "הגדלת תקופה אינה הוספת נכס.", "אין תנאי כזה בתקן."],
  },
  {
    id: "dep-old",
    prompt: "במדידה מחדש נוספו לנכס 30,000 ש״ח, ונשארו 5 שנים. הפחת היה 20,000 בשנה, והיתרה לפני המדידה 100,000 ש״ח. מהו הפחת מעכשיו?",
    options: ["26,000 ש״ח", "20,000 ש״ח", "50,000 ש״ח", "30,000 ש״ח"],
    answer: 0,
    why: "(100,000 + 30,000) ÷ 5 = 26,000: היתרה החדשה על השנים שנשארו.",
    traps: ["", "הפחת הישן לא כולל את התוספת.", "זו התוספת ועוד הפחת, בלי לפזר אותה על 5 שנים.", "זו התוספת, לא הפחת."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const CHANGES_TAUGHT: Record<string, string> = {
  "rate-index": "ls-chg-rate",
  "rate-term": "ls-chg-rate",
  "when-index": "ls-chg-index",
  "index-up": "ls-chg-index",
  "guar-down": "ls-chg-guar",
  "zero-gain": "ls-chg-asset",
  "dep-after": "ls-chg-asset",
  "term-up": "ls-chg-term",
  "buy-dep": "ls-chg-buy",
  floating: "ls-chg-rate",
  fx: "ls-chg-rate",
  separate: "ls-chg-sep",
  "not-separate": "ls-chg-sep",
  "mod-date": "ls-chg-mod",
  extend: "ls-chg-extend",
  "shrink-gain": "ls-chg-shrink",
  "shrink-rem": "ls-chg-shrink",
  "cut-gain": "ls-chg-cut",
  "nc-after": "ls-chg-index",
  "shop-total": "ls-chg-shop",
  "store-rou": "ls-chg-store",
  "index-entry": "ls-chg-index",
  "shrink-entry": "ls-chg-shrink",
  forecast: "ls-chg-index",
  order: "ls-chg-shrink",
  "extend-separate": "ls-chg-extend",
  "dep-old": "ls-chg-asset",
};

/** Lesson 5: the lessee when something changes. Reassessment against modification, and how to carry out each. */
export const CHANGES: StudyModule = {
  slug: "ifrs16-changes",
  course: COURSE,
  n: 5,
  title: "חוכר: הערכה מחדש ותיקוני חכירה",
  description: "מדד עולה, אופציה הופכת לוודאית, שטח מצטמצם. מתי הריבית נשארת ומתי מתעדכנת, מתי רושמים רווח, ואיך נראים הנכס וההתחייבות אחרי כל שינוי.",
  goal: "להבדיל הערכה מחדש מתיקון חכירה, ולבצע כל אחד מהם עד פקודת היומן והדוחות.",
  outcomes: [
    "להחליט איזו ריבית משמשת בכל שינוי, ולאן הולך ההפרש",
    "למדוד מחדש בגלל מדד, ערבות שייר, תקופה ואופציית רכישה",
    "לעצור את הנכס באפס ולרשום רווח על היתרה",
    "לחשב פחת על היתרה החדשה, לפי השנים שנשארו",
    "להחליט אם תיקון הוא חכירה נפרדת",
    "לבצע הקטנת היקף בשני שלבים, גם כשמדובר בקיצור תקופה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-chg-hook", title: "שני סוגי שינוי" },
    { id: "ls-chg-rate", title: "איזו ריבית: ישנה או מעודכנת" },
    { id: "ls-chg-asset", title: "לאן הולך ההפרש, ומה קורה לפחת" },
    { id: "ls-chg-index", title: "מדד: דוגמה שלמה" },
    { id: "ls-chg-guar", title: "ערבות שייר: האומדן השתנה" },
    { id: "ls-chg-term", title: "תקופה: אירוע שמשנה את ההערכה" },
    { id: "ls-chg-buy", title: "אופציית רכישה הופכת לוודאית" },
    { id: "ls-chg-mod", title: "תיקון חכירה: שלוש דרכים" },
    { id: "ls-chg-sep", title: "מתי זו חכירה נפרדת" },
    { id: "ls-chg-extend", title: "הארכה: מדידה מחדש" },
    { id: "ls-chg-shrink", title: "הקטנה: קודם גריעה" },
    { id: "ls-chg-cut", title: "קיצור תקופה הוא הקטנה" },
    { id: "ls-chg-shop", title: "דוגמה פתורה: חנות קטנה וגדלה" },
    { id: "ls-chg-store", title: "שאלה שלמה: מדד, אופציה והכנסות" },
    { id: "ls-chg-lab", title: "מעבדה: לפני ואחרי" },
    { id: "ls-chg-drill", title: "מתרגלים: מספרים חדשים בכל פעם" },
    { id: "ls-chg-mistake", title: "מצאו את הטעות" },
    { id: "ls-chg-master", title: "שאלה מסכמת: קומה יוצאת, והשאר נשארות" },
  ],
  exercises,
  traps,
  tips: [
    "הערכה מחדש, ריבית ישנה: מדד וערבות שייר. ריבית מעודכנת: תקופה, אופציית רכישה וריבית משתנה.",
    "ההפרש הולך לנכס. אם הנכס התאפס, השאר ברווח או הפסד.",
    "מטבע חוץ: ריבית ישנה, והפרש לרווח או הפסד.",
    "מדד: רק כשהתשלום החוזי משתנה, ובלי תחזית.",
    "פחת אחרי שינוי: היתרה החדשה חלקי השנים שנשארו.",
    "חכירה נפרדת: גם נכס נוסף, וגם מחיר נפרד.",
    "תיקון שאינו נפרד: ריבית מעודכנת במועד שבו הצדדים הסכימו.",
    "הקטנה: קודם גריעה ורווח או הפסד, ורק אז מדידה מחדש.",
    "קיצור תקופה הוא הקטנה. מהנכס לפי השנים, ומההתחייבות לפי מה שנשאר בריבית הישנה.",
  ],
};
