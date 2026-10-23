/**
 * Exchange of property, plant and equipment (IAS 16.24–26) for the learning lab.
 *
 * Three steps: the exchange date; the old asset's depreciation from the start of
 * the year up to that date; then the new asset's cost, which depends on whether
 * the exchange has commercial substance with a reliably measured fair value:
 *
 *   with:    cost = fair value given + cash paid − cash received,
 *            gain = fair value given − carrying amount given
 *   without: cost = carrying amount given + cash paid − cash received, no gain
 *
 * When the received asset's fair value is the clearer one, it is the new cost
 * and the fair value given is backed out of it. Both assets use straight-line
 * depreciation, and the exchange takes place at the start of its month.
 */

export type ExchangeInputs = {
  oldCost: number;
  oldSalvage: number;
  /** Useful life of the old asset, in years. */
  oldLife: number;
  /** Old asset's accumulated depreciation at the start of the exchange year. */
  accumulatedOpening: number;
  /** Month (1–12) the exchange takes place, at its start. */
  month: number;
  /** Commercial substance and a reliably measured fair value. */
  commercial: boolean;
  /** Which fair value is the clearer evidence. */
  basis: "given" | "received";
  fairValueGiven: number;
  fairValueReceived: number;
  cashPaid: number;
  cashReceived: number;
  newLife: number;
  newSalvage: number;
};

export type ExchangeResult = {
  oldAnnual: number;
  /** Months of the year before the exchange: the old asset's last depreciation. */
  monthsBefore: number;
  depToDate: number;
  accumulated: number;
  bookValue: number;
  /** Fair value of the asset given, as measured or as backed out of the one received; null without commercial substance. */
  fairValueGiven: number | null;
  newCost: number;
  /** Positive for a gain, negative for a loss; 0 without commercial substance. */
  gain: number;
  /** Months from the exchange to year end: the new asset's first depreciation. */
  monthsAfter: number;
  newAnnual: number;
  newDep: number;
  newBookValue: number;
  /** Depreciation expense of the year: old asset until the exchange plus new asset after it. */
  totalDep: number;
};

/** Input problems, keyed by field; empty when the exchange can be solved. */
export function exchangeErrors(x: ExchangeInputs): Partial<Record<keyof ExchangeInputs | "newCost", string>> {
  const e: Partial<Record<keyof ExchangeInputs | "newCost", string>> = {};
  if (!(x.oldCost > 0)) e.oldCost = "העלות המקורית חייבת להיות חיובית";
  if (!(x.oldSalvage >= 0)) e.oldSalvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.oldCost > 0 && x.oldSalvage >= x.oldCost) e.oldSalvage = "ערך הגרט חייב להיות נמוך מהעלות";
  if (!(x.oldLife > 0)) e.oldLife = "אורך חיים חיובי";
  if (!(x.accumulatedOpening >= 0)) e.accumulatedOpening = "פחת נצבר לא יכול להיות שלילי";
  if (!Number.isInteger(x.month) || x.month < 1 || x.month > 12) e.month = "חודש בין 1 ל-12";
  if (!(x.cashPaid >= 0) || !(x.cashReceived >= 0)) e.cashPaid = "סכום המזומן לא יכול להיות שלילי";
  if (x.commercial && x.basis === "given" && !(x.fairValueGiven > 0)) e.fairValueGiven = "שווי הוגן חיובי";
  if (x.commercial && x.basis === "received" && !(x.fairValueReceived > 0)) e.fairValueReceived = "שווי הוגן חיובי";
  if (!(x.newLife > 0)) e.newLife = "אורך חיים חיובי";
  if (!(x.newSalvage >= 0)) e.newSalvage = "ערך הגרט לא יכול להיות שלילי";
  if (Object.keys(e).length) return e;

  const r = solveExchange(x);
  if (r.accumulated > x.oldCost - x.oldSalvage + 0.005)
    e.accumulatedOpening = "הפחת הנצבר עד ההחלפה עולה על הסכום בר-הפחת של הנכס הישן";
  if (!(r.newCost > 0)) e.newCost = "עלות הנכס החדש יוצאת לא חיובית — בדקו את סכומי המזומן";
  else if (x.newSalvage >= r.newCost) e.newSalvage = "ערך הגרט של הנכס החדש חייב להיות נמוך מעלותו";
  return e;
}

export function solveExchange(x: ExchangeInputs): ExchangeResult {
  const oldAnnual = (x.oldCost - x.oldSalvage) / x.oldLife;
  const monthsBefore = x.month - 1;
  const depToDate = (oldAnnual * monthsBefore) / 12;
  const accumulated = x.accumulatedOpening + depToDate;
  const bookValue = x.oldCost - accumulated;
  const cash = x.cashPaid - x.cashReceived;

  let fairValueGiven: number | null = null;
  let newCost: number;
  if (!x.commercial) newCost = bookValue + cash;
  else if (x.basis === "given") {
    fairValueGiven = x.fairValueGiven;
    newCost = x.fairValueGiven + cash;
  } else {
    newCost = x.fairValueReceived;
    fairValueGiven = x.fairValueReceived - cash;
  }
  const gain = fairValueGiven === null ? 0 : fairValueGiven - bookValue;

  const monthsAfter = 12 - monthsBefore;
  const newAnnual = (newCost - x.newSalvage) / x.newLife;
  const newDep = (newAnnual * monthsAfter) / 12;
  return {
    oldAnnual,
    monthsBefore,
    depToDate,
    accumulated,
    bookValue,
    fairValueGiven,
    newCost,
    gain,
    monthsAfter,
    newAnnual,
    newDep,
    newBookValue: newCost - newDep,
    totalDep: depToDate + newDep,
  };
}
