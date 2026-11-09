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
  ["מטבע חוץ", "ישנה", "רווח או הפסד", "IAS 21, סעיפים 23, 28"],
];

export const RATE_ITEMS: { text: string; answer: "old" | "new"; why: string }[] = [
  { text: "מדד המחירים עלה, והתשלום החוזי התעדכן.", answer: "old", why: "הריבית נשארת (סעיף 43). רק סכום התשלום השתנה, ומה שהחוב מכסה נשאר כמו שהיה." },
  { text: "החוכר מעריך עכשיו שערך השייר יהיה נמוך מהערבות בסכום אחר.", answer: "old", why: "הריבית נשארת (סעיפים 42(א), 43). רק הסכום הצפוי להשלמה השתנה, ומה שהחוב מכסה נשאר כמו שהיה." },
  { text: "אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיאריך.", answer: "new", why: "סעיפים 40(א), 41: החישוב כולל עכשיו שנים שלא היו בו, ולכן לוקחים ריבית של היום." },
  { text: "אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיממש אופציית רכישה.", answer: "new", why: "סעיפים 40(ב), 41: מחיר הקנייה נכנס עכשיו לחוב, ולכן לוקחים ריבית של היום." },
  { text: "התשלומים צמודים לריבית בנק ישראל, והיא עלתה.", answer: "new", why: "סעיף 43: השינוי נובע מהריבית עצמה, ולכן מעדכנים אותה." },
];
export const RATE_OPTIONS: [string, string][] = [
  ["old", "ריבית ישנה"],
  ["new", "ריבית מעודכנת"],
];

/** A change larger than the asset: it stops at zero, and the rest is a gain (paragraph 39). */
export const ZERO = { asset: 20_000, decrease: 26_000 };
export const ZERO_GAIN = ZERO.decrease - ZERO.asset;
/** The plain case on the same screen: the debt grows, the asset grows with it, and depreciation follows. */
export const ASSET_EX = { asset: 80_000, liability: 95_000, change: 10_000, left: 5 };

/** Worked: an imaging machine paid on each 1.1, whose payment follows the index only every second year. */
export const IDX = { payment: 90_000, years: 6, rate: 0.05, base: 100, indexes: [103, 106], resetYear: 3, todayRate: 0.08 };
export const IDX_NEW_PAYMENT = (IDX.payment * IDX.indexes[1]) / IDX.base;
export type IndexRow = { year: number; opening: number; change: number; paid: number; interest: number; closing: number; rouOpen: number; dep: number; rou: number; current: number; nonCurrent: number };
export const IDX_START = r(pvStart(IDX.rate, IDX.years, IDX.payment));
export const IDX_ROWS: IndexRow[] = (() => {
  let opening = IDX_START;
  let rouOpen = IDX_START;
  return [1, 2, 3].map((year) => {
    const left = IDX.years - year + 1;
    const reset = year === IDX.resetYear;
    const paid = reset ? IDX_NEW_PAYMENT : IDX.payment;
    const after = reset ? r(pvStart(IDX.rate, left, paid)) : opening;
    const change = after - opening;
    // Each year's end is what Excel gives for the payments left, so the interest carries the rounding.
    const closing = r(pvStart(IDX.rate, left - 1, paid));
    const interest = closing - (after - paid);
    const dep = r((rouOpen + change) / left);
    const rou = rouOpen + change - dep;
    const row = { year, opening, change, paid, interest, closing, rouOpen, dep, rou, current: paid, nonCurrent: closing - paid };
    opening = closing;
    rouOpen = rou;
    return row;
  });
})();
/** The remeasurement, in a line: the debt and the asset on the day the payment changes. */
export const IDX_BEFORE = IDX_ROWS[2].opening;
export const IDX_AFTER = IDX_ROWS[2].opening + IDX_ROWS[2].change;
export const IDX_CHANGE = IDX_ROWS[2].change;
export const IDX_ROU_BEFORE = IDX_ROWS[2].rouOpen;

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

/** Worked: a break clause the lessee meant to use, until a business decision of its own. */
export const TERM = { payment: 70_000, years: 10, breakYear: 6, penalty: 30_000, rate: 0.05, newRate: 0.07, eventYear: 4 };
export const TERM_COST = r(pvEnd(TERM.rate, TERM.breakYear, TERM.payment, TERM.penalty));
export const TERM_DEP = r(TERM_COST / TERM.breakYear);
export const TERM_LEFT = TERM.breakYear - TERM.eventYear;
export const TERM_BEFORE_L = r(pvEnd(TERM.rate, TERM_LEFT, TERM.payment, TERM.penalty));
export const TERM_BEFORE_A = r((TERM_COST * TERM_LEFT) / TERM.breakYear);
export const TERM_NEW_YEARS = TERM.years - TERM.eventYear;
export const TERM_AFTER_L = r(pvEnd(TERM.newRate, TERM_NEW_YEARS, TERM.payment));
export const TERM_CHANGE = TERM_AFTER_L - TERM_BEFORE_L;
export const TERM_AFTER_A = TERM_BEFORE_A + TERM_CHANGE;
export const TERM_DEP2 = r(TERM_AFTER_A / TERM_NEW_YEARS);
/** What the six payments would come to at the old rate: the mistake the rule prevents. */
export const TERM_OLD_RATE_L = r(pvEnd(TERM.rate, TERM_NEW_YEARS, TERM.payment));
/** The balances on the day, split, and the year after. */
export const TERM_NC = r(pvEnd(TERM.newRate, TERM_NEW_YEARS - 1, TERM.payment));
export const TERM_CUR = TERM_AFTER_L - TERM_NC;
export const TERM_INT5 = r(TERM_AFTER_L * TERM.newRate);
export const TERM_CLOSE5 = TERM_AFTER_L + TERM_INT5 - TERM.payment;
export const TERM_ROU5 = TERM_AFTER_A - TERM_DEP2;
export const TERM_NC5 = r(pvEnd(TERM.newRate, TERM_NEW_YEARS - 2, TERM.payment));
export const TERM_CUR5 = TERM_CLOSE5 - TERM_NC5;

/** Worked in figures: a purchase option that becomes reasonably certain, near the end of a lease. */
export const BUY_EX = { option: 15_000, left: 2, life: 10, payment: 24_000, rate: 0.05, newRate: 0.07, asset: 40_000 };
export const BUY_BEFORE = r(pvEnd(BUY_EX.rate, BUY_EX.left, BUY_EX.payment));
export const BUY_AFTER = r(pvEnd(BUY_EX.newRate, BUY_EX.left, BUY_EX.payment, BUY_EX.option));
export const BUY_CHANGE = BUY_AFTER - BUY_BEFORE;
export const BUY_ASSET = BUY_EX.asset + BUY_CHANGE;
export const BUY_DEP_OLD = r(BUY_EX.asset / BUY_EX.left);
export const BUY_DEP = r(BUY_ASSET / BUY_EX.life);

/** A modification that is a separate lease: two more minibuses in a fleet of ten, and what a price below the stand-alone one would do instead. */
export const SEP = { buses: 10, payment: 240_000, years: 7, passed: 3, rate: 0.05, extra: 2, market: 54_000, saving: 2_000, yearly: 52_000, newRate: 0.07, cheap: 40_000 };
export const SEP_LEFT = SEP.years - SEP.passed;
export const SEP_COST = r(pvEnd(SEP.rate, SEP.years, SEP.payment));
export const SEP_OLD_A = r((SEP_COST * SEP_LEFT) / SEP.years);
export const SEP_OLD_L = r(pvEnd(SEP.rate, SEP_LEFT, SEP.payment));
export const SEP_L = r(pvEnd(SEP.newRate, SEP_LEFT, SEP.yearly));
export const SEP_NOT_AFTER = r(pvEnd(SEP.newRate, SEP_LEFT, SEP.payment + SEP.cheap));
export const SEP_NOT_CHANGE = SEP_NOT_AFTER - SEP_OLD_L;
export const SEP_NOT_ASSET = SEP_OLD_A + SEP_NOT_CHANGE;

/** A smaller scope, in a lease carrying key money: more leaves the asset than the debt, so step 1 is a loss. */
export const SHR = { area: 1_000, returned: 300, payment: 100_000, years: 8, passed: 3, rate: 0.06, newRate: 0.08, key: 180_000, newPayment: 78_000 };
export const SHR_SHARE = SHR.returned / SHR.area;
export const SHR_LEFT = SHR.years - SHR.passed;
export const SHR_COST = r(pvEnd(SHR.rate, SHR.years, SHR.payment)) + SHR.key;
export const SHR_A = r((SHR_COST * SHR_LEFT) / SHR.years);
export const SHR_L = r(pvEnd(SHR.rate, SHR_LEFT, SHR.payment));
export const SHR_L_OUT = r(SHR_L * SHR_SHARE);
export const SHR_A_OUT = r(SHR_A * SHR_SHARE);
export const SHR_LOSS = SHR_A_OUT - SHR_L_OUT;
export const SHR_KEEP = SHR_L - SHR_L_OUT;
export const SHR_AFTER = r(pvEnd(SHR.newRate, SHR_LEFT, SHR.newPayment));
export const SHR_REM = SHR_AFTER - SHR_KEEP;
export const SHR_ASSET = SHR_A - SHR_A_OUT + SHR_REM;
export const SHR_DEP = r(SHR_ASSET / SHR_LEFT);
/** What is inside step 2: 70% of the old payment at today's rate, then the rest of the new price. */
export const SHR_SAME_PAY = r(SHR.payment * (1 - SHR_SHARE));
export const SHR_RATE_ONLY = r(pvEnd(SHR.newRate, SHR_LEFT, SHR_SAME_PAY));
export const SHR_RATE_EFFECT = SHR_RATE_ONLY - SHR_KEEP;
export const SHR_PRICE_EFFECT = SHR_AFTER - SHR_RATE_ONLY;
/** The wrong order: today's rate first, and only then taking out the share. */
export const SHR_WRONG_L = r(pvEnd(SHR.newRate, SHR_LEFT, SHR.payment));
export const SHR_WRONG_OUT = r(SHR_WRONG_L * SHR_SHARE);
export const SHR_WRONG_LOSS = SHR_A_OUT - SHR_WRONG_OUT;

/** A shorter term: years leave the asset by count, and the debt by what the far payments are worth. */
export const CUT = { payment: 150_000, years: 10, passed: 4, left: 2, rate: 0.04, newRate: 0.06, newPayment: 165_000, plusPayment: 190_000 };
export const CUT_WAS_LEFT = CUT.years - CUT.passed;
export const CUT_COST = r(pvEnd(CUT.rate, CUT.years, CUT.payment));
export const CUT_A = r((CUT_COST * CUT_WAS_LEFT) / CUT.years);
export const CUT_L = r(pvEnd(CUT.rate, CUT_WAS_LEFT, CUT.payment));
export const CUT_KEEP = r(pvEnd(CUT.rate, CUT.left, CUT.payment));
export const CUT_L_OUT = CUT_L - CUT_KEEP;
export const CUT_A_OUT = r((CUT_A * (CUT_WAS_LEFT - CUT.left)) / CUT_WAS_LEFT);
export const CUT_GAIN = CUT_L_OUT - CUT_A_OUT;
export const CUT_AFTER = r(pvEnd(CUT.newRate, CUT.left, CUT.newPayment));
export const CUT_REM = CUT_AFTER - CUT_KEEP;
export const CUT_ASSET = CUT_A - CUT_A_OUT + CUT_REM;
export const CUT_DEP = r(CUT_ASSET / CUT.left);
/** Each remaining payment at the old rate; the last row carries the rounding, so the column adds up to the debt. */
export const CUT_ROWS: { year: number; value: number; stays: boolean }[] = (() => {
  const rows = Array.from({ length: CUT_WAS_LEFT }, (_, k) => ({ year: k + 1, value: r(CUT.payment / (1 + CUT.rate) ** (k + 1)), stays: k < CUT.left }));
  rows[rows.length - 1].value += CUT_L - rows.reduce((t, x) => t + x.value, 0);
  return rows;
})();
/** The same amendment, with a second room added at a price that isn't its stand-alone price. */
export const CUT_PLUS_AFTER = r(pvEnd(CUT.newRate, CUT.left, CUT.plusPayment));
export const CUT_PLUS_REM = CUT_PLUS_AFTER - CUT_KEEP;
export const CUT_PLUS_ASSET = CUT_A - CUT_A_OUT + CUT_PLUS_REM;

/** A longer term at a lower rent, and beside it a lower rent alone. Nothing here leaves, so all of it goes to the asset. */
export const EXT = { payment: 84_000, years: 7, passed: 4, rate: 0.04, newRate: 0.06, extra: 3, newPayment: 78_000, lowPayment: 72_000 };
export const EXT_LEFT = EXT.years - EXT.passed;
export const EXT_COST = r(pvEnd(EXT.rate, EXT.years, EXT.payment));
export const EXT_A = r((EXT_COST * EXT_LEFT) / EXT.years);
export const EXT_L = r(pvEnd(EXT.rate, EXT_LEFT, EXT.payment));
export const EXT_AFTER = r(pvEnd(EXT.newRate, EXT_LEFT + EXT.extra, EXT.newPayment));
export const EXT_CHANGE = EXT_AFTER - EXT_L;
export const EXT_ASSET = EXT_A + EXT_CHANGE;
export const EXT_DEP_OLD = r(EXT_A / EXT_LEFT);
export const EXT_DEP = r(EXT_ASSET / (EXT_LEFT + EXT.extra));
export const LOW_AFTER = r(pvEnd(EXT.newRate, EXT_LEFT, EXT.lowPayment));
export const LOW_CHANGE = LOW_AFTER - EXT_L;
export const LOW_ASSET = EXT_A + LOW_CHANGE;
export const LOW_DEP = r(LOW_ASSET / EXT_LEFT);

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

/** A lease in dollars: payments each 31.12, the debt kept in dollars and shown in shekels at the day's rate, the asset frozen at the first day's rate. */
export const USD = { payment: 40_000, years: 5, rate: 0.05, open: 3.6, avg: 3.7, close: 3.8 };
export const USD_L0 = r(pvEnd(USD.rate, USD.years, USD.payment));
export const USD_L1 = r(pvEnd(USD.rate, USD.years - 1, USD.payment));
/** The year's dollar interest; it carries the rounding, so the dollar column adds up. */
export const USD_INT = USD_L1 + USD.payment - USD_L0;
export const USD_L0_ILS = r(USD_L0 * USD.open);
export const USD_INT_ILS = r(USD_INT * USD.avg);
export const USD_PAID_ILS = r(USD.payment * USD.close);
export const USD_L1_ILS = r(USD_L1 * USD.close);
/** What is left once the debt is restated at the closing rate: the exchange difference, a loss when the dollar rose. */
export const USD_FX = USD_L1_ILS - USD_L0_ILS - USD_INT_ILS + USD_PAID_ILS;
export const USD_DEP = r(USD_L0_ILS / USD.years);
export const USD_ROU1 = USD_L0_ILS - USD_DEP;
export const USD_NC_USD = r(pvEnd(USD.rate, USD.years - 2, USD.payment));
export const USD_NC = r(USD_NC_USD * USD.close);
export const USD_CUR = USD_L1_ILS - USD_NC;
export const USD_FIN = USD_INT_ILS + USD_FX;
/** What the asset would have been, wrongly, at the closing rate. */
export const USD_ROU_WRONG = r(USD_L0 * USD.close) - USD_DEP;

/** A termination option actually used: the lessee leaves after year 3, pays the penalty, and the asset that is left has no term to run. */
export const QUIT = { payment: 90_000, years: 8, rate: 0.06, breakYear: 3, penalty: 50_000 };
export const QUIT_COST = r(pvEnd(QUIT.rate, QUIT.years, QUIT.payment));
export const QUIT_DEP = r(QUIT_COST / QUIT.years);
export const QUIT_A = QUIT_COST - QUIT.breakYear * QUIT_DEP;
export const QUIT_L = r(pvEnd(QUIT.rate, QUIT.years - QUIT.breakYear, QUIT.payment));
export const QUIT_CHANGE = QUIT.penalty - QUIT_L;
export const QUIT_LOSS = QUIT_A + QUIT_CHANGE;

/** A purchase option that stops being reasonably certain: the price leaves the debt at today's rate, and depreciation moves to the lease term. */
export const DROP = { payment: 60_000, years: 5, rate: 0.06, option: 30_000, life: 10, passed: 2, newRate: 0.08 };
export const DROP_LEFT = DROP.years - DROP.passed;
export const DROP_COST = r(pvEnd(DROP.rate, DROP.years, DROP.payment, DROP.option));
export const DROP_DEP = r(DROP_COST / DROP.life);
export const DROP_A = DROP_COST - DROP.passed * DROP_DEP;
export const DROP_BEFORE = r(pvEnd(DROP.rate, DROP_LEFT, DROP.payment, DROP.option));
export const DROP_AFTER = r(pvEnd(DROP.newRate, DROP_LEFT, DROP.payment));
export const DROP_CHANGE = DROP_AFTER - DROP_BEFORE;
export const DROP_ASSET = DROP_A + DROP_CHANGE;
export const DROP_DEP2 = r(DROP_ASSET / DROP_LEFT);

/** A modification between payment dates: payments on each 31.12, and the parties agree on 1.10 of year 3. */
export const STUB = { payment: 150_000, years: 6, rate: 0.06, passed: 2, months: 9, newPayment: 135_000, extra: 2, newRate: 0.08 };
export const STUB_COST = r(pvEnd(STUB.rate, STUB.years, STUB.payment));
export const STUB_DEP = r(STUB_COST / STUB.years);
export const STUB_LEFT = STUB.years - STUB.passed;
export const STUB_L0 = r(pvEnd(STUB.rate, STUB_LEFT, STUB.payment));
export const STUB_A0 = STUB_COST - STUB.passed * STUB_DEP;
/** The rate for nine months, compounded: (1 + i)^(m/12) − 1. */
export const STUB_PERIOD = (1 + STUB.rate) ** (STUB.months / 12) - 1;
export const STUB_INT1 = r(STUB_L0 * STUB_PERIOD);
export const STUB_L_BEFORE = STUB_L0 + STUB_INT1;
export const STUB_DEP1 = r((STUB_DEP * STUB.months) / 12);
export const STUB_A_BEFORE = STUB_A0 - STUB_DEP1;
/** After the change: the four payments left and two more, the first of them this 31.12, three months away. */
export const STUB_NEW_N = STUB_LEFT + STUB.extra;
export const STUB_REST = 12 - STUB.months;
export const STUB_PV_YEAR = r(pvEnd(STUB.newRate, STUB_NEW_N, STUB.newPayment));
export const STUB_L_AFTER = r(pvEnd(STUB.newRate, STUB_NEW_N, STUB.newPayment) * (1 + STUB.newRate) ** (STUB.months / 12));
export const STUB_CHANGE = STUB_L_AFTER - STUB_L_BEFORE;
export const STUB_A_AFTER = STUB_A_BEFORE + STUB_CHANGE;
export const STUB_MONTHS_LEFT = STUB_REST + 12 * (STUB_NEW_N - 1);
export const STUB_DEP2 = r((STUB_A_AFTER * STUB_REST) / STUB_MONTHS_LEFT);
export const STUB_A_CLOSE = STUB_A_AFTER - STUB_DEP2;
export const STUB_PERIOD2 = (1 + STUB.newRate) ** (STUB_REST / 12) - 1;
export const STUB_L_CLOSE = r(pvEnd(STUB.newRate, STUB_NEW_N - 1, STUB.newPayment));
/** Three months at the new rate; the closing balance is what Excel gives, so this line carries the rounding. */
export const STUB_INT2 = STUB_L_CLOSE + STUB.newPayment - STUB_L_AFTER;
export const STUB_INT = STUB_INT1 + STUB_INT2;
export const STUB_DEP_YEAR = STUB_DEP1 + STUB_DEP2;
export const STUB_NC = r(pvEnd(STUB.newRate, STUB_NEW_N - 2, STUB.newPayment));
export const STUB_CUR = STUB_L_CLOSE - STUB_NC;
/** The same year with simple interest for the part-periods: i × m/12. */
export const STUB_S_INT1 = r((STUB_L0 * STUB.rate * STUB.months) / 12);
export const STUB_S_BEFORE = STUB_L0 + STUB_S_INT1;
export const STUB_S_AFTER = r((STUB.newPayment + STUB_L_CLOSE) / (1 + (STUB.newRate * STUB_REST) / 12));
export const STUB_S_CHANGE = STUB_S_AFTER - STUB_S_BEFORE;
export const STUB_S_INT2 = STUB_L_CLOSE + STUB.newPayment - STUB_S_AFTER;
export const STUB_S_INT = STUB_S_INT1 + STUB_S_INT2;
/** The remeasurement differs, so the asset and its depreciation differ too. */
export const STUB_S_A_AFTER = STUB_A_BEFORE + STUB_S_CHANGE;
export const STUB_S_DEP2 = r((STUB_S_A_AFTER * STUB_REST) / STUB_MONTHS_LEFT);
export const STUB_S_A_CLOSE = STUB_S_A_AFTER - STUB_S_DEP2;
export const STUB_EXPENSE = STUB_INT + STUB_DEP_YEAR;
export const STUB_S_EXPENSE = STUB_S_INT + STUB_DEP1 + STUB_S_DEP2;

/** A reassessment and a modification on one day: an extension stops being certain, and the same day 40% of the space goes back. */
export const SAME = { payment: 120_000, fixed: 6, option: 4, rate: 0.05, passed: 4, newRate: 0.07, returned: 0.4, newPayment: 75_000 };
export const SAME_YEARS = SAME.fixed + SAME.option;
export const SAME_WAS_LEFT = SAME_YEARS - SAME.passed;
export const SAME_LEFT = SAME.fixed - SAME.passed;
export const SAME_COST = r(pvEnd(SAME.rate, SAME_YEARS, SAME.payment));
export const SAME_A0 = r((SAME_COST * SAME_WAS_LEFT) / SAME_YEARS);
export const SAME_L0 = r(pvEnd(SAME.rate, SAME_WAS_LEFT, SAME.payment));
/** Step 1, the reassessment: two payments at today's rate, the whole difference against the asset. */
export const SAME_L1 = r(pvEnd(SAME.newRate, SAME_LEFT, SAME.payment));
export const SAME_CH1 = SAME_L1 - SAME_L0;
export const SAME_A1 = SAME_A0 + SAME_CH1;
/** Step 2, the modification: 40% leaves both balances, then what stays is measured at the new rent. */
export const SAME_L_OUT = r(SAME_L1 * SAME.returned);
export const SAME_A_OUT = r(SAME_A1 * SAME.returned);
export const SAME_GAIN = SAME_L_OUT - SAME_A_OUT;
export const SAME_KEEP = SAME_L1 - SAME_L_OUT;
export const SAME_AFTER = r(pvEnd(SAME.newRate, SAME_LEFT, SAME.newPayment));
export const SAME_REM = SAME_AFTER - SAME_KEEP;
export const SAME_ASSET = SAME_A1 - SAME_A_OUT + SAME_REM;
export const SAME_DEP = r(SAME_ASSET / SAME_LEFT);
/** The one-step reading: everything treated as the modification, on the balances before either change. */
export const SAME_ONE_KEEP_SHARE = ((1 - SAME.returned) * SAME_LEFT) / SAME_WAS_LEFT;
export const SAME_ONE_A_OUT = r(SAME_A0 * (1 - SAME_ONE_KEEP_SHARE));
export const SAME_ONE_KEEP = r(pvEnd(SAME.rate, SAME_LEFT, SAME.payment) * (1 - SAME.returned));
export const SAME_ONE_L_OUT = SAME_L0 - SAME_ONE_KEEP;
export const SAME_ONE_GAIN = SAME_ONE_L_OUT - SAME_ONE_A_OUT;
export const SAME_ONE_REM = SAME_AFTER - SAME_ONE_KEEP;
export const SAME_ONE_ASSET = SAME_A0 - SAME_ONE_A_OUT + SAME_ONE_REM;

/** An index with a ceiling: the payment follows the index, but by no more than 3% a year. */
export const CAP = { payment: 80_000, base: 100, index: 105, cap: 0.03, left: 4, rate: 0.05 };
export const CAP_PAYMENT = r(CAP.payment * Math.min(CAP.index / CAP.base, 1 + CAP.cap));
export const CAP_CHANGE = r(pvEnd(CAP.rate, CAP.left, CAP_PAYMENT)) - r(pvEnd(CAP.rate, CAP.left, CAP.payment));

/** The practice on the additions, each figure from its own inputs. */
const Q_STUB_INT = r(400_000 * (1.06 ** (3 / 12) - 1));
const Q_STUB_NEW = r(pvEnd(0.08, 4, 50_000) * 1.08 ** (3 / 12));
const Q_USD = { open: 50_000, rate: 0.05, paid: 10_000, s0: 3.5, avg: 3.6, s1: 3.8 };
const Q_USD_INT = Q_USD.open * Q_USD.rate;
const Q_USD_CLOSE = Q_USD.open + Q_USD_INT - Q_USD.paid;
const Q_USD_FX = r(Q_USD_CLOSE * Q_USD.s1 - Q_USD.open * Q_USD.s0 - Q_USD_INT * Q_USD.avg + Q_USD.paid * Q_USD.s1);
const Q_SAME = { L: 400_000, A: 360_000, L1: 250_000, out: 0.2 };
const Q_SAME_A1 = Q_SAME.A - (Q_SAME.L - Q_SAME.L1);
const Q_SAME_GAIN = r(Q_SAME.L1 * Q_SAME.out - Q_SAME_A1 * Q_SAME.out);
const Q_EXIT = { L: 200_000, A: 170_000, penalty: 40_000 };
const Q_EXIT_LOSS = Q_EXIT.A - (Q_EXIT.L - Q_EXIT.penalty);
const Q_DROP = { A: 120_000, before: 100_000, after: 82_000, left: 3, life: 9 };
const Q_DROP_DEP = r((Q_DROP.A + Q_DROP.after - Q_DROP.before) / Q_DROP.left);

/** What changed, and what to do: the course's walk through paragraphs 39 to 46. */
export const CHANGE_WALK: Record<string, TestNode | TestEnd> = {
  changed: { q: "הצדדים שינו את תנאי החוזה?", par: "נספח א׳", help: "תיקון הוא שינוי בהיקף או בתמורה, שלא היה חלק מהתנאים המקוריים.", answers: [{ label: "כן, יש תיקון", to: "adds" }, { label: "לא, השתנו אומדן או מדד", to: "what" }] },
  what: { q: "מה השתנה?", par: "סעיפים 40–43", help: "החוזה נשאר, אבל התשלומים הצפויים השתנו. זו הערכה מחדש.", answers: [{ label: "הערכה של תקופה או אופציית רכישה", to: "newRate" }, { label: "מדד, או תשלום צפוי בערבות", to: "oldRate" }, { label: "ריבית משתנה", to: "floating" }, { label: "מטבע חוץ", to: "fx" }] },
  newRate: { lease: true, verdict: "ריבית מעודכנת, כנגד הנכס", why: "סעיפים 40, 41: מדדים מחדש בשיעור של היום. הפרש ההתחייבות מתאים את הנכס." },
  oldRate: { lease: true, verdict: "ריבית ישנה, כנגד הנכס", why: "הריבית נשארת (סעיפים 42, 43). רק הסכום זז, ומה שהחוב מכסה נשאר כמו שהיה." },
  floating: { lease: true, verdict: "ריבית מעודכנת, כנגד הנכס", why: "סעיף 43: כשהשינוי נובע מהריבית עצמה, מעדכנים אותה." },
  fx: { lease: true, verdict: "ריבית ישנה, לרווח או הפסד", why: "הפרש השער הוא הפרש תרגום של התחייבות כספית לפי IAS 21 (סעיפים 23, 28), והוא לא נוגע לנכס. ב-IFRS 16 עצמו זה לא כתוב." },
  adds: { q: "התיקון מוסיף זכות להשתמש בנכס?", par: "סעיף 44(א)", help: "למשל עוד קומה או עוד מכונה. הארכה של אותו נכס אינה תוספת כזו.", answers: [{ label: "כן", to: "price" }, { label: "לא", to: "shrinks" }] },
  price: { q: "המחיר עלה בסכום שמתאים למחיר הנפרד של התוספת?", par: "סעיף 44(ב)", help: "מחיר נפרד הוא מה שהיו משלמים עליה בחוזה משלה. מותר תיאום מתאים, למשל הנחה על חיסכון של המחכיר בשיווק.", answers: [{ label: "כן", to: "separate" }, { label: "לא", to: "shrinks" }] },
  separate: { lease: true, verdict: "חכירה נפרדת", why: "סעיף 44: התוספת נמדדת כחכירה חדשה, ובחכירה המקורית לא נוגעים." },
  shrinks: { q: "התיקון מקטין את ההיקף, למשל פחות שטח או פחות זמן?", par: "סעיף 46(א)", help: "גם קיצור תקופה הוא הקטנת היקף.", answers: [{ label: "כן", to: "decrease" }, { label: "לא", to: "other" }] },
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
    steps: ["מחשבים את החוב לפני ואחרי באותה ריבית, כי רק התשלום השתנה (סעיף 43). 8% הוא נתון מיותר.", `לפני: 20,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(r(pvEnd(0.05, 4, 20_000)))}`, `אחרי: 21,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(r(pvEnd(0.05, 4, 21_000)))}`, `${fmt(r(pvEnd(0.05, 4, 21_000)))} − ${fmt(r(pvEnd(0.05, 4, 20_000)))} = ${fmt(P_INDEX)}`, "באקסל: הפרש בין =PV(5%;4;-21000) לבין =PV(5%;4;-20000)"],
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
    steps: ["הנכס יורד רק עד אפס, ולכן הוא סופג 15,000 (סעיף 39). מה שנשאר מהירידה אין כנגד מה לרשום, ולכן הוא רווח.", "ירידה בהתחייבות − יתרת הנכס = רווח\n22,000 − 15,000 = 7,000"],
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
    steps: ["אחרי מדידה מחדש לא חוזרים לעלות המקורית. מפזרים את מה שיש היום על מה שנשאר.", "יתרה ÷ יתרת תקופה = פחת\n120,000 ÷ 4 = 30,000"],
    trap: "להמשיך בפחת הישן ולהוסיף לו. כל שינוי מתפזר על השנים שנשארו.",
    level: 1,
    source: "מקורית",
    ref: "סעיפים 30(ב), 31",
  }),
  askNumber({
    id: "term-up",
    skill: "הערכת תקופה",
    prompt: "נשארו 3 תשלומים של 50,000 ש״ח בסוף כל שנה, בריבית 6%. אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיממש הארכה בשנתיים, בלי שינוי בתשלום. הריבית התוספתית היום 8%. בכמה גדלה ההתחייבות?",
    answer: P_TERM_AFTER - P_TERM_BEFORE,
    steps: ["השנים הנוספות משנות את החישוב כולו, ולכן כל 5 התשלומים מהוונים בריבית של היום, גם 3 שכבר היו בחוב.", `לפני, בריבית הישנה: 50,000 × (1 − 1.06^(−3)) ÷ 0.06 = ${fmt(P_TERM_BEFORE)}`, `אחרי, 5 תשלומים בריבית המעודכנת: 50,000 × (1 − 1.08^(−5)) ÷ 0.08 = ${fmt(P_TERM_AFTER)}`, `${fmt(P_TERM_AFTER)} − ${fmt(P_TERM_BEFORE)} = ${fmt(P_TERM_AFTER - P_TERM_BEFORE)}`, "באקסל: הפרש בין =PV(8%;5;-50000) לבין =PV(6%;3;-50000)"],
    trap: "להוון רק את שתי השנים הנוספות. כל היתרה נמדדת מחדש בריבית החדשה.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 40(א), 41",
  }),
  askNumber({
    id: "buy-dep",
    skill: "אופציית רכישה",
    prompt: "נשארו 3 תשלומים של 40,000 ש״ח בסוף כל שנה, בריבית 5%. יתרת הנכס 150,000 ש״ח. אירוע בשליטת החוכר, ועכשיו ודאי באופן סביר שיממש בסוף התקופה אופציית רכישה ב-20,000 ש״ח. הריבית התוספתית היום 7%. לנכס נשארו 8 שנות חיים, והפחת בקו ישר. מהו הפחת השנתי מעכשיו?",
    answer: r(P_BUY_ROU / 8),
    steps: ["מחיר האופציה נכנס לחוב, הכול מהוון בריבית של היום, וההפרש הולך לנכס. אחר כך מחלקים בשנות החיים, כי הנכס נשאר אצל החוכר.", `לפני: 40,000 × (1 − 1.05^(−3)) ÷ 0.05 = ${fmt(P_BUY_B)}. באקסל: =PV(5%;3;-40000)`, `אחרי: 40,000 × (1 − 1.07^(−3)) ÷ 0.07 + 20,000 ÷ 1.07^3 = ${fmt(P_BUY_A)}. באקסל: =PV(7%;3;-40000;-20000)`, `נכס: 150,000 + ${fmt(P_BUY_A)} − ${fmt(P_BUY_B)} = ${fmt(P_BUY_ROU)}`, `עכשיו החוכר יקבל את הנכס, ולכן לאורך החיים (סעיף 32).\n${fmt(P_BUY_ROU)} ÷ 8 = ${fmt(r(P_BUY_ROU / 8))}`],
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
    why: "הפרשי שער על התחייבות כספית נרשמים לפי IAS 21 (סעיפים 23, 28) ברווח או הפסד. הנכס לא משתנה.",
    trap: "להתייחס למטבע כמו למדד. במדד ההפרש הולך לנכס, במטבע חוץ לרווח או הפסד.",
    level: 3,
    source: "מקורית",
    ref: "IAS 21, סעיפים 23, 28",
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
    why: "החזרת קומה לא מוסיפה נכס, ולכן זה תיקון שאינו חכירה נפרדת. תיקון כזה מטפלים בו במועד התחילה של התיקון, היום שבו הצדדים הסכימו (סעיף 45, נספח א׳).",
    trap: "לחכות לביצוע בפועל. בתיקון שאינו חכירה נפרדת יום ההסכמה קובע, גם כשההשפעה בעתיד. רק חכירה נפרדת נרשמת ביום שהנכס הנוסף מועמד לרשות החוכר.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 45, נספח א׳",
  }),
  askNumber({
    id: "extend",
    skill: "הארכה בתיקון",
    prompt: "נשארו 4 תשלומים של 36,000 ש״ח בסוף כל שנה, בריבית 5%. הצדדים תיקנו את החוזה, והוסיפו 3 שנים בלי שינוי בתשלום. הריבית התוספתית היום 7%. בכמה גדל נכס זכות השימוש?",
    answer: P_EXT_AFTER - P_EXT_BEFORE,
    steps: ["אין נכס נוסף ואין הקטנה, ולכן מודדים מחדש, והנכס גדל בדיוק כמו ההתחייבות.", `לפני: 36,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(P_EXT_BEFORE)}`, `אחרי: 36,000 × (1 − 1.07^(−7)) ÷ 0.07 = ${fmt(P_EXT_AFTER)}`, `${fmt(P_EXT_AFTER)} − ${fmt(P_EXT_BEFORE)} = ${fmt(P_EXT_AFTER - P_EXT_BEFORE)}`, "באקסל: הפרש בין =PV(7%;7;-36000) לבין =PV(5%;4;-36000)"],
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
    steps: ["בשלב הראשון עובדים על היתרות הישנות בלבד, ולכן 6% והתשלום החדש לא נכנסים לחישוב.", `ההתחייבות: 70,000 × (1 − 1.05^(−4)) ÷ 0.05 = ${fmt(P_SHR.L)}`, `גריעה: ${fmt(P_SHR.L)} × 0.4 = ${fmt(P_SHR_OUT_L)} מההתחייבות, 210,000 × 0.4 = 84,000 מהנכס.`, `${fmt(P_SHR_OUT_L)} − 84,000 = ${fmt(P_SHR_GAIN)}`, "באקסל, ליתרת ההתחייבות: =PV(5%;4;-70000)"],
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
    steps: [`אחרי גריעה: ${fmt(P_SHR.L)} − ${fmt(P_SHR_OUT_L)} = ${fmt(P_SHR.L - P_SHR_OUT_L)}`, `אחרי מדידה מחדש: 45,000 × (1 − 1.06^(−4)) ÷ 0.06 = ${fmt(P_SHR_AFTER)}`, `${fmt(P_SHR_AFTER)} − ${fmt(P_SHR.L - P_SHR_OUT_L)} = ${fmt(P_SHR_REM)}`, "באקסל, ההתחייבות אחרי: =PV(6%;4;-45000)"],
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
    steps: ["קיצור תקופה הוא הקטנת היקף. נשארו 2 מתוך 5 שנים.", `גריעה מהנכס: 270,000 × 3 ÷ 5 = 162,000`, `גריעה מההתחייבות: ${fmt(P_CUT_L)} − ${fmt(P_CUT_KEEP)} = ${fmt(P_CUT_L - P_CUT_KEEP)}`, `רווח: ${fmt(P_CUT_L - P_CUT_KEEP)} − 162,000 = ${fmt(P_CUT_GAIN)}`, "באקסל: =PV(6%;5;-75000) ו-=PV(6%;2;-75000)"],
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
    steps: [`אחרי התשלום הבא נשארים 5 תשלומים, לפי התשלום המעודכן.\n63,000 × (1 − 1.05^(−5)) ÷ 0.05 = ${fmt(P_NC)}`, "באקסל: =PV(5%;5;-63000)"],
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
  askNumber({
    id: "cap-index",
    skill: "מדד",
    prompt: "דמי החכירה צמודים למדד, אבל לפי החוזה הם עולים בשנה ב-3% לכל היותר. התשלום הבסיסי 80,000 ש״ח, ומדד הבסיס 100. ביום שבו התשלום מתעדכן, המדד הוא 105. מהו התשלום החדש?",
    answer: CAP_PAYMENT,
    steps: ["התשלום עדיין תלוי במדד, ולכן מעדכנים אותו ביום שבו הוא משתנה (סעיף 42(ב)). לוקחים את הנמוך מבין עליית המדד לבין התקרה.", "עליית המדד: 105 ÷ 100 − 1 = 5%. התקרה: 3%. הנמוך: 3%.", `80,000 × 1.03 = ${fmt(CAP_PAYMENT)}`],
    trap: "להצמיד במלוא 5%, או להכניס תחזית שהמדד ימשיך לעלות. התקרה חלה ביום העדכון, ומדד עתידי לא מנחשים.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 27(ב), 28, 42(ב)",
  }),
  ask({
    id: "usd-rou",
    skill: "מטבע חוץ",
    prompt: "התשלומים בחכירה נקובים בדולר. ביום תחילת החכירה השער היה 3.6, ובסוף השנה הוא 3.8. באיזה שער מוצג נכס זכות השימוש בסוף השנה?",
    options: ["3.6, השער של יום תחילת החכירה, ולא מתרגמים אותו מחדש", "3.8, השער של סוף השנה", "הממוצע של השנה", "3.8, וההפרש לרווח או הפסד"],
    answer: 0,
    why: "הנכס אינו פריט כספי, ולכן נשאר בשער של יום העסקה (IAS 21, סעיף 23(ב)). רק ההתחייבות, שהיא פריט כספי, מתורגמת לשער הסגירה (סעיף 23(א)).",
    trap: "לתרגם את הנכס יחד עם ההתחייבות. הפרש השער נוגע לחוב בלבד, והוא הולך לרווח או הפסד.",
    level: 1,
    source: "מקורית",
    ref: "IAS 21, סעיף 23",
  }),
  askNumber({
    id: "usd-fx",
    skill: "מטבע חוץ",
    prompt: "ב-1.1 יתרת התחייבות חכירה 50,000 דולר, והשער 3.5 ש״ח לדולר. הריבית על החוב 5% לשנה, בדולרים. ב-31.12 שולם תשלום של 10,000 דולר, בשער 3.8, שהוא גם שער הסגירה. השער הממוצע לשנה 3.6, ובו מתרגמים את הריבית. מהו הפסד הפרשי השער של השנה, בש״ח?",
    answer: Q_USD_FX,
    steps: ["מנהלים את החוב בדולרים, ואז מתרגמים כל שורה לפי השער שלה. מה שנשאר כדי להגיע ליתרת הסגירה הוא הפרש השער.", `בדולרים: 50,000 + ${fmt(Q_USD_INT)} − 10,000 = ${fmt(Q_USD_CLOSE)}`, `בש״ח: פתיחה 50,000 × 3.5 = ${fmt(r(Q_USD.open * Q_USD.s0))}. ריבית ${fmt(Q_USD_INT)} × 3.6 = ${fmt(r(Q_USD_INT * Q_USD.avg))}. תשלום 10,000 × 3.8 = ${fmt(r(Q_USD.paid * Q_USD.s1))}. סגירה ${fmt(Q_USD_CLOSE)} × 3.8 = ${fmt(r(Q_USD_CLOSE * Q_USD.s1))}.`, `סגירה − פתיחה − ריבית + תשלום = הפרש שער\n${fmt(r(Q_USD_CLOSE * Q_USD.s1))} − ${fmt(r(Q_USD.open * Q_USD.s0))} − ${fmt(r(Q_USD_INT * Q_USD.avg))} + ${fmt(r(Q_USD.paid * Q_USD.s1))} = ${fmt(Q_USD_FX)}`],
    trap: "לזקוף את ההפרש לנכס, כמו בשינוי מדד. במטבע חוץ הנכס נשאר בשער הראשון, וההפרש הולך לרווח או הפסד.",
    level: 3,
    source: "מקורית",
    ref: "IAS 21, סעיף 23(א)",
  }),
  askNumber({
    id: "exit-loss",
    skill: "יציאה מוקדמת",
    prompt: "לחוכר יש זכות לצאת מהחכירה בקנס של 40,000 ש״ח. ביום החתימה היה ודאי באופן סביר שלא ישתמש בה, ולכן הקנס לא נכלל בהתחייבות. היום, אחרי התשלום השנתי, הוא משתמש בזכות, משלם את הקנס ומפנה את הנכס. יתרת ההתחייבות 200,000 ש״ח, ויתרת הנכס 170,000 ש״ח. כמה הפסד נרשם?",
    answer: Q_EXIT_LOSS,
    steps: ["החוכר מימש אופציה שלא הייתה בתקופה, ולכן התקופה מתעדכנת (סעיף 21(א)). מה שנשאר לשלם הוא הקנס בלבד, והוא משולם היום, בלי היוון.", `ההתחייבות יורדת ל-40,000: ירידה של 200,000 − 40,000 = ${fmt(Q_EXIT.L - Q_EXIT.penalty)}, והנכס יורד באותו סכום (סעיף 39).`, `נשאר בנכס: 170,000 − ${fmt(Q_EXIT.L - Q_EXIT.penalty)} = ${fmt(Q_EXIT_LOSS)}. לא נשארה תקופת שימוש, ולכן היתרה נמחקת להפסד.`],
    trap: "לרשום את כל הקנס כהוצאה, או להשאיר את יתרת הנכס בספרים. הקנס מחליף את החוב, ומה שנשאר בנכס הוא ההפסד.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 21(א), 39",
  }),
  askNumber({
    id: "buy-drop",
    skill: "אופציית רכישה",
    prompt: "עד היום היה ודאי באופן סביר שהחוכר יקנה את המכונה בסוף החכירה, ולכן הפחית אותה על פני אורך החיים. אירוע בשליטתו שינה את זה, וכבר לא ודאי שיקנה. לפני השינוי יתרת הנכס 120,000 ש״ח ויתרת ההתחייבות 100,000 ש״ח. בלי מחיר האופציה, בריבית של היום, ההתחייבות 82,000 ש״ח. נשארו 3 שנות חכירה ו-9 שנות חיים. מהו הפחת השנתי מעכשיו?",
    answer: Q_DROP_DEP,
    steps: ["מחיר האופציה יוצא מהחוב, בריבית מעודכנת (סעיף 40(ב)), וההפרש מקטין את הנכס.", `נכס: 120,000 + 82,000 − 100,000 = ${fmt(Q_DROP.A + Q_DROP.after - Q_DROP.before)}`, `המכונה חוזרת למחכיר בסוף, ולכן מפחיתים על פני יתרת התקופה (סעיף 32).\n${fmt(Q_DROP.A + Q_DROP.after - Q_DROP.before)} ÷ 3 = ${fmt(Q_DROP_DEP)}`],
    trap: "להמשיך להפחית על פני 9 שנות החיים. בלי אופציה ודאית הנכס יוצא מהספרים בסוף החכירה.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 32, 40(ב)",
  }),
  ask({
    id: "later-separate",
    skill: "מועד התיקון",
    prompt: "בנובמבר החוכר חתם על תוספת לחוזה: מכונה נוספת, במחיר הנפרד שלה, שתגיע ותועמד לרשותו במרץ בשנה הבאה. מה נרשם בדוחות של 31.12?",
    options: ["כלום. זו חכירה נפרדת, והיא נרשמת ביום שהמכונה מועמדת לרשותו", "נכס והתחייבות ביום החתימה בנובמבר", "מדידה מחדש של החוזה הקיים בריבית של נובמבר", "הוצאה על החודשים שעד מרץ"],
    answer: 0,
    why: "נוסף נכס במחיר הנפרד שלו, ולכן זו חכירה נפרדת (סעיף 44). חכירה חדשה מכירים במועד התחילה שלה (סעיף 22), כשהמכונה מגיעה.",
    trap: "להחיל כאן את כלל יום ההסכמה. הוא שייך לתיקון שאינו חכירה נפרדת. חכירה נפרדת מחכה ליום שהנכס מועמד לרשות החוכר.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 22, 44",
  }),
  askNumber({
    id: "stub-int",
    skill: "תיקון באמצע שנה",
    prompt: "התשלומים בחכירה ב-31.12 של כל שנה. אחרי התשלום יתרת ההתחייבות 400,000 ש״ח, בריבית שנתית 6%. ב-1.4 הצדדים מסכימים על תיקון. מהי הריבית מ-1.1 עד 1.4, אם מחשבים בשיעור תקופתי מצטבר?",
    answer: Q_STUB_INT,
    steps: ["לפני כל תיקון מגלגלים את החוב ליום התיקון. שלושה חודשים הם רבע שנה, והשיעור שלהם מצטבר.", "שיעור תקופתי: 1.06^(3/12) − 1", `400,000 × (1.06^(3/12) − 1) = ${fmt(Q_STUB_INT)}`, "באקסל: =400000*(1.06^(3/12)-1)"],
    trap: "לחשב 6% × 3/12 כשהשאלה מבקשת שיעור מצטבר, או להתחיל את המדידה מחדש מהיתרה של 1.1 בלי הריבית של שלושת החודשים.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 36, 45",
  }),
  askNumber({
    id: "stub-new",
    skill: "תיקון באמצע שנה",
    prompt: "ב-1.4 הצדדים תיקנו חכירה, ואחרי התיקון נשארו 4 תשלומים של 50,000 ש״ח, ב-31.12 של כל שנה, הראשון בעוד 9 חודשים. הריבית התוספתית ביום התיקון 8%. מהי ההתחייבות ב-1.4 אחרי המדידה מחדש? חשבו בשיעור תקופתי מצטבר.",
    answer: Q_STUB_NEW,
    steps: ["=PV נותן ערך לשנה לפני התשלום הראשון. כאן התשלום הראשון קרוב יותר, בעוד 9 חודשים, ולכן מקדמים את הערך ב-3 חודשים.", `50,000 × (1 − 1.08^(−4)) ÷ 0.08 = ${fmt(r(pvEnd(0.08, 4, 50_000)))}`, `${fmt(r(pvEnd(0.08, 4, 50_000)))} × 1.08^(3/12) = ${fmt(Q_STUB_NEW)}`, "באקסל: =PV(8%;4;-50000)*1.08^(3/12)"],
    trap: "להשאיר את התוצאה של =PV כמו שהיא. היא מניחה שהתשלום הראשון בעוד שנה שלמה.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 45",
  }),
  ask({
    id: "same-order",
    skill: "שני שינויים ביום אחד",
    prompt: "ביום אחד קרו שני דברים. אופציית הארכה שנספרה בתקופה כבר לא ודאית, בעקבות החלטה של החוכר. ובו ביום הצדדים הסכימו להחזיר למחכיר חלק מהשטח. איך עובדים לפי שיטת הקורס?",
    options: ["קודם הערכה מחדש כנגד הנכס, בלי רווח או הפסד. אחר כך גריעה של השטח שהוחזר לפי היתרות החדשות, ומדידה מחדש", "הכול כתיקון אחד, על היתרות שלפני שני השינויים", "קודם הגריעה, ורק אחר כך ההערכה מחדש", "הכול כהערכה מחדש כנגד הנכס, בלי רווח או הפסד"],
    answer: 0,
    why: "יש כאן שתי סיבות, ומטפלים בכל אחת לפי הסעיף שלה. השנים שיצאו בגלל האופציה הן הערכה מחדש (סעיפים 20, 40(א)), והשטח שהוחזר הוא הקטנת היקף בתיקון (סעיף 46(א)). התקן לא קובע סדר, ובקורס עובדים קודם לפי ההערכה מחדש.",
    trap: "לגרוע את כל השנים שיצאו כחלק מהתיקון. כך יוצא רווח או הפסד גם על שנים שיצאו בלי שום הסכמה.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 40(א), 46(א)",
  }),
  askNumber({
    id: "same-gain",
    skill: "שני שינויים ביום אחד",
    prompt: "יתרת התחייבות חכירה 400,000 ש״ח, ויתרת הנכס 360,000 ש״ח. היום אופציית הארכה שנספרה כבר לא ודאית, בעקבות החלטה של החוכר, ובריבית של היום ההתחייבות יורדת ל-250,000 ש״ח. ובו ביום הצדדים הסכימו שהחוכר מחזיר 20% מהשטח. כמה רווח או הפסד נרשם על ההחזרה, לפי שיטת הקורס? הקלידו את הסכום.",
    answer: Q_SAME_GAIN,
    steps: ["קודם ההערכה מחדש, כולה כנגד הנכס.", `נכס: 360,000 − (400,000 − 250,000) = ${fmt(Q_SAME_A1)}`, `אחר כך גריעה של 20% מהיתרות החדשות: ${fmt(Q_SAME.L1 * Q_SAME.out)} מההתחייבות, ${fmt(Q_SAME_A1 * Q_SAME.out)} מהנכס.`, `${fmt(Q_SAME.L1 * Q_SAME.out)} − ${fmt(Q_SAME_A1 * Q_SAME.out)} = ${fmt(Q_SAME_GAIN)}, רווח.`],
    trap: "לגרוע 20% מהיתרות שלפני ההערכה מחדש. הגריעה נעשית על מה שיש בספרים אחרי שהשנים של האופציה כבר יצאו.",
    level: 3,
    source: "מקורית",
    ref: "סעיפים 40(א), 46(א)",
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
  "cap-index": "ls-chg-index",
  "usd-rou": "ls-chg-usd",
  "usd-fx": "ls-chg-usd",
  "exit-loss": "ls-chg-exit",
  "buy-drop": "ls-chg-exit",
  "later-separate": "ls-chg-mod",
  "stub-int": "ls-chg-stub",
  "stub-new": "ls-chg-stub",
  "same-order": "ls-chg-sameday",
  "same-gain": "ls-chg-sameday",
};

/** Lesson 5: the lessee when something changes. Reassessment against modification, and how to carry out each. */
export const CHANGES: StudyModule = {
  slug: "ifrs16-changes",
  course: COURSE,
  n: 5,
  title: "חוכר: הערכה מחדש ותיקוני חכירה",
  description: "מדד עולה, אופציה הופכת לוודאית, שטח מצטמצם, דולר מתחזק. מתי הריבית נשארת ומתי מתעדכנת, מתי רושמים רווח, ואיך נראים הנכס וההתחייבות אחרי כל שינוי, גם כשהוא קורה באמצע השנה.",
  goal: "להבדיל הערכה מחדש מתיקון חכירה, ולבצע כל אחד מהם עד פקודת היומן והדוחות.",
  outcomes: [
    "להחליט איזו ריבית משמשת בכל שינוי, ולאן הולך ההפרש",
    "למדוד מחדש בגלל מדד, ערבות שייר, תקופה ואופציית רכישה",
    "לעצור את הנכס באפס ולרשום רווח על היתרה",
    "לחשב פחת על היתרה החדשה, לפי השנים שנשארו",
    "להחליט אם תיקון הוא חכירה נפרדת",
    "לבצע הקטנת היקף בשני שלבים, גם כשמדובר בקיצור תקופה",
    "לנהל חכירה בדולרים: חוב בשער הסגירה, נכס בשער הראשון, והפרש שער לרווח או הפסד",
    "לרשום יציאה מוקדמת בקנס, ואופציית רכישה שהפסיקה להיות ודאית",
    "לטפל בתיקון בין שני מועדי תשלום, ובהערכה מחדש ותיקון שקורים באותו יום",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-chg-hook", title: "שני סוגי שינוי" },
    { id: "ls-chg-rate", title: "איזו ריבית: ישנה או מעודכנת" },
    { id: "ls-chg-asset", title: "לאן הולך ההפרש, ומה קורה לפחת" },
    { id: "ls-chg-index", title: "מדד: התשלום מתעדכן רק פעם בשנתיים" },
    { id: "ls-chg-guar", title: "ערבות שייר: האומדן השתנה" },
    { id: "ls-chg-usd", title: "חכירה בדולרים: חוב שזז עם השער" },
    { id: "ls-chg-term", title: "תקופה: החלטה שמשנה את ההערכה" },
    { id: "ls-chg-buy", title: "אופציית רכישה הופכת לוודאית" },
    { id: "ls-chg-exit", title: "בכיוון ההפוך: יציאה בקנס, ואופציה שנופלת" },
    { id: "ls-chg-mod", title: "תיקון חכירה: שלוש דרכים" },
    { id: "ls-chg-sep", title: "מתי זו חכירה נפרדת" },
    { id: "ls-chg-shrink", title: "הקטנה: קודם גריעה" },
    { id: "ls-chg-cut", title: "קיצור תקופה הוא הקטנה" },
    { id: "ls-chg-extend", title: "הארכה או שינוי מחיר: מדידה מחדש" },
    { id: "ls-chg-stub", title: "תיקון באמצע השנה" },
    { id: "ls-chg-sameday", title: "הערכה מחדש ותיקון באותו יום" },
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
    "מטבע חוץ: החוב בדולרים, בשער הסגירה. הנכס נשאר בשער של היום הראשון. הפרש השער לרווח או הפסד.",
    "מדד: רק ביום שהתשלום החוזי משתנה, ובלי תחזית. עם תקרה לוקחים את הנמוך מבין המדד לתקרה.",
    "יציאה בקנס שלא נספר: החוב יורד לקנס, הנכס יורד באותו סכום, ומה שנשאר בו הוא הפסד.",
    "אופציית רכישה שכבר לא ודאית: המחיר יוצא מהחוב בריבית מעודכנת, והפחת עובר ליתרת התקופה.",
    "תיקון באמצע השנה: מגלגלים ריבית ופחת עד יום התיקון, מודדים מחדש, וממשיכים עד 31.12.",
    "הערכה מחדש ותיקון באותו יום: קודם ההערכה מחדש, ואז התיקון על היתרות החדשות.",
    "חכירה נפרדת שמתחילה מאוחר יותר נרשמת רק ביום שהנכס הנוסף מגיע.",
    "פחת אחרי שינוי: היתרה החדשה חלקי השנים שנשארו.",
    "חכירה נפרדת: גם נכס נוסף, וגם מחיר נפרד.",
    "תיקון שאינו נפרד: ריבית מעודכנת במועד שבו הצדדים הסכימו.",
    "הקטנה: קודם גריעה ורווח או הפסד, ורק אז מדידה מחדש.",
    "קיצור תקופה בתיקון הוא הקטנה. מהנכס לפי השנים, ומההתחייבות לפי מה שנשאר בריבית הישנה.",
    "בשלב הגריעה אפשר לקבל גם הפסד, כשהנכס גבוה מההתחייבות, למשל בגלל דמי מפתח.",
  ],
};
