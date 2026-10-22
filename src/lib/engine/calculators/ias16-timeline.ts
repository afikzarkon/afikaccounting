import { money, percent, plain } from "../format";
import { entry, round2, sum } from "../math";
import type { Guidance, JournalEntry, Metric, ScheduleRow, ScheduleTable, Solution, StatementLine, Values, Working, YearSection } from "../types";
import { bool, num, series, str } from "../validate";

/**
 * IAS 16 on a monthly timeline. The asset's whole life is simulated month by
 * month from the date it is available for use; events (renovation, year-end
 * revaluation or impairment test, exchange) start a new depreciation phase,
 * and the results are then grouped into calendar fiscal years and clipped to
 * the calculation range the user chose.
 */

export type PpeMethod = "straight-line" | "double-declining" | "sum-of-years" | "units";

export const METHOD_LABEL: Record<PpeMethod, string> = {
  "straight-line": "הקו הישר",
  "double-declining": "היתרה הפוחתת הכפולה",
  "sum-of-years": "סכום ספרות השנים",
  units: "יחידות התפוקה",
};

/**
 * Dates are reduced to whole months, counted from year 0: a month counts when
 * the asset is in use for most of it, so a date after the 15th starts the
 * following month (31/03 → April, 01/07 → July). For a range end the same rule
 * gives the first month excluded (31/12 → January).
 */
export const monthIndex = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return y * 12 + (m - 1) + (d > 15 ? 1 : 0);
};
export const fmtDate = (iso: string) => iso.split("-").reverse().join("/");
/** Last day of the month before month index `i`, as dd/mm/yyyy. */
const dayBefore = (i: number) => fmtDate(new Date(Date.UTC(Math.floor(i / 12), i % 12, 0)).toISOString().slice(0, 10));
const monthLabel = (i: number) => `${String((i % 12) + 1).padStart(2, "0")}/${Math.floor(i / 12)}`;
const overlap = (from: number, to: number, start: number, end: number) => Math.max(0, Math.min(to, end) - Math.max(from, start));

/** Remaining life, in years, at the start of each 12-month block: 6, 5, …, 1 or 5.75, 4.75, …, 0.75. */
export const sydWeights = (months: number) => Array.from({ length: Math.ceil(months / 12) }, (_, i) => (months - 12 * i) / 12);

type Renovation = { at: number; date: string; cost: number; extension: number; residual: number; extraUnits: number };
type Exchange = {
  at: number;
  date: string;
  commercial: boolean;
  basis: "given" | "received";
  paid: number;
  received: number;
  fvGiven: number;
  fvReceived: number;
  /** The asset received: its useful life in months and residual value, for next year's depreciation. */
  newLife: number;
  newResidual: number;
};

export type Inputs = {
  currency: string;
  method: PpeMethod;
  revaluation: boolean;
  transferSurplus: boolean;
  purchasePrice: number;
  attributableCosts: number;
  discounts: number;
  cost: number;
  residual: number;
  start: number;
  startDate: string;
  lifeMonths: number;
  totalUnits: number;
  /** Units produced in each fiscal year, from the first year of use. */
  units: (number | null)[];
  /** Fair value (revaluation model) or recoverable amount (cost model) at each fiscal year-end. */
  values: (number | null)[];
  renovation: Renovation | null;
  exchange: Exchange | null;
};

export function parseInputs(v: Values): Inputs {
  const revaluation = str(v, "model") === "revaluation";
  // Each event counts only when "an event occurred" is answered yes and that event is ticked.
  const event = (id: string) => bool(v, "hasEvents") && bool(v, id);
  const revalues = revaluation && event("revalue");
  const cash = str(v, "cashDirection");
  const purchasePrice = num(v, "purchasePrice");
  const attributableCosts = num(v, "attributableCosts");
  const discounts = num(v, "discounts");
  return {
    currency: str(v, "currency") || "ILS",
    method: str(v, "method") as PpeMethod,
    revaluation,
    transferSurplus: revalues && str(v, "surplusTransfer") !== "disposal",
    purchasePrice,
    attributableCosts,
    discounts,
    cost: round2(purchasePrice + attributableCosts - discounts),
    residual: num(v, "residual"),
    start: monthIndex(str(v, "acquisitionDate")),
    startDate: str(v, "acquisitionDate"),
    lifeMonths: num(v, "usefulLife") * 12 + num(v, "lifeMonths"),
    totalUnits: num(v, "totalUnits"),
    units: series(v, "unitsByYear"),
    values: revalues ? series(v, "fairValues") : !revaluation && event("impairment") ? series(v, "recoverableAmounts") : [],
    renovation: event("revision")
      ? {
          at: monthIndex(str(v, "revisionDate")),
          date: str(v, "revisionDate"),
          cost: num(v, "revisionCost"),
          extension: Math.round(num(v, "lifeExtension") * 12),
          residual: num(v, "revisedResidual"),
          extraUnits: num(v, "extraUnits"),
        }
      : null,
    exchange: event("exchange")
      ? {
          at: monthIndex(str(v, "exchangeDate")),
          date: str(v, "exchangeDate"),
          commercial: bool(v, "commercialSubstance"),
          // IAS 16.26: the fair value of the asset given up, unless only the one received is known.
          basis: v.fvGivenKnown === false ? "received" : "given",
          paid: cash === "paid" ? num(v, "cashAmount") : 0,
          received: cash === "received" ? num(v, "cashAmount") : 0,
          fvGiven: num(v, "fvGiven"),
          fvReceived: num(v, "fvReceived"),
          newLife: Math.max(1, Math.round(num(v, "newAssetLife") * 12)),
          newResidual: num(v, "newAssetResidual"),
        }
      : null,
  };
}

type Snapshot = { gross: number; acc: number; imp: number; surplus: number; carrying: number };

/** A non-depreciation event, already shaped as a journal entry. */
type Booking = {
  t: number;
  /** "open" events belong to the period containing month t, "close" ones to the period ending at t. */
  side: "open" | "close";
  kind: "renovation" | "revaluation" | "impairment" | "exchange" | "surplus";
  when: string;
  narrative: string;
  reference: string;
  lines: [string, number][];
  /** Effect on profit or loss (negative is an expense) and on other comprehensive income. */
  pl: number;
  oci: number;
  /** Change in the carrying amount, by schedule column. */
  addition: number;
  impairment: number;
  revaluation: number;
  disposal: number;
  /** How the event's amounts were computed, for the year-by-year solution. */
  working: Working[];
};

type RenovationInfo = { t: number; depreciationBefore: number; carryingBefore: number; newBase: number; remainingMonths: number; ddbRate: number };
type ExchangeInfo = { t: number; carrying: number; newCost: number; gain: number };

/**
 * A 12-month "asset year" counted from the start of a phase (or the whole
 * phase, for straight-line), with what went into its charge — kept so the
 * solution can show the working.
 */
type Block = { from: number; length: number; amount: number; weight?: number; opening?: number; switched?: boolean; left?: number };

/** Why a new depreciation phase started. */
type Cause = "start" | "renovation" | "revaluation" | "impairment";

type Phase = {
  t0: number;
  cause: Cause;
  months: number;
  carrying: number;
  residual: number;
  depreciable: number;
  surplus: number;
  ddbRate: number;
  digits: number;
  unitsLeft: number;
  blocks: Block[];
  cum: number[];
  units: number[];
};

/** Unrounded monthly charges for a phase of `months` months starting at `t0`. */
function monthlyCharges(
  method: PpeMethod,
  carrying: number,
  residual: number,
  months: number,
  ctx: { t0: number; ddbRate: number; unitsLeft: number; unitsAt: (t: number) => number | null },
): { charges: number[]; units: number[]; blocks: Block[] } {
  const depreciable = Math.max(0, carrying - residual);
  const charges: number[] = [];
  const units: number[] = [];
  const blocks: Block[] = [];
  if (months <= 0) return { charges, units, blocks };

  if (method === "straight-line") {
    for (let k = 0; k < months; k++) charges.push(depreciable / months);
    blocks.push({ from: 0, length: months, amount: depreciable });
  } else if (method === "sum-of-years") {
    const weights = sydWeights(months);
    const digits = sum(weights);
    weights.forEach((w, i) => {
      const length = Math.min(12, months - 12 * i);
      const amount = (depreciable * w) / digits;
      for (let k = 0; k < length; k++) charges.push(amount / length);
      blocks.push({ from: 12 * i, length, amount, weight: w });
    });
  } else if (method === "double-declining") {
    // Constant rate on the opening carrying amount of each 12-month block,
    // switching to straight-line once that is higher, never below residual.
    let opening = carrying;
    for (let i = 0; 12 * i < months; i++) {
      const length = Math.min(12, months - 12 * i);
      const left = months - 12 * i;
      const last = 12 * (i + 1) >= months;
      const declining = (opening * ctx.ddbRate * length) / 12;
      const straight = ((opening - residual) * length) / left;
      const charge = Math.max(0, last ? opening - residual : Math.min(Math.max(declining, straight), opening - residual));
      for (let k = 0; k < length; k++) charges.push(charge / length);
      blocks.push({ from: 12 * i, length, amount: charge, opening, switched: last || straight > declining, left });
      opening -= charge;
    }
  } else {
    // Units of production: actual units per fiscal year, spread over the months
    // of use in that year; years with no figure share the units still expected.
    const known = Array.from({ length: months }, (_, k) => ctx.unitsAt(ctx.t0 + k));
    const unknown = known.filter((u) => u === null).length;
    const fill = unknown > 0 ? Math.max(0, ctx.unitsLeft - sum(known.map((u) => u ?? 0))) / unknown : 0;
    for (const u of known) {
      const used = u ?? fill;
      units.push(used);
      charges.push(ctx.unitsLeft > 0 ? (depreciable * used) / ctx.unitsLeft : 0);
    }
  }
  return { charges, units, blocks };
}

export type Run = ReturnType<typeof run>;

/** Simulates the asset month by month. Pure: the same inputs give the same run. */
export function run(inp: Inputs, opts: { skipValues?: boolean } = {}) {
  const { start, exchange, renovation } = inp;
  const firstYear = Math.floor(start / 12);
  let end = start + inp.lifeMonths;
  // The asset leaves the schedule at the exchange, or at the end of its (possibly revised) life.
  const stopAt = () => (exchange ? exchange.at : end);

  let gross = inp.cost;
  let acc = 0;
  let imp = 0;
  let surplus = 0;
  let revaluationLosses = 0;
  let residual = inp.residual;
  let unitsTotal = inp.totalUnits;
  let unitsUsed = 0;
  let ddbRate = 24 / inp.lifeMonths;

  const fmt = (n: number) => money(n, inp.currency);
  const carrying = () => round2(gross - acc - imp);
  const depBy = new Map<number, number>();
  const transferBy = new Map<number, number>();
  const closing = new Map<number, Snapshot>();
  const bookings: Booking[] = [];
  let shadow: Run | null = null;
  let phaseDirty = false;
  let renovationInfo: RenovationInfo | null = null;
  let exchangeInfo: ExchangeInfo | null = null;

  const unitsAt = (t: number) => {
    const year = Math.floor(t / 12);
    const given = inp.units[year - firstYear];
    if (given === null || given === undefined) return null;
    return given / Math.max(1, overlap(start, end, year * 12, year * 12 + 12));
  };

  const phases: Phase[] = [];
  let cause: Cause = "start";
  const newPhase = (t0: number): Phase => {
    const months = Math.max(0, end - t0);
    const depreciable = Math.max(0, round2(carrying() - residual));
    const unitsLeft = Math.max(0, unitsTotal - unitsUsed);
    const { charges, units, blocks } = monthlyCharges(inp.method, carrying(), residual, months, { t0, ddbRate, unitsLeft, unitsAt });
    // Round the running total, not each month, and land exactly on the depreciable amount.
    const cum = [0];
    let running = 0;
    for (const c of charges) {
      running += c;
      cum.push(Math.min(depreciable, round2(running)));
    }
    cum[months] = depreciable;
    const phase: Phase = {
      t0,
      cause,
      months,
      carrying: carrying(),
      residual,
      depreciable,
      surplus,
      ddbRate,
      digits: sum(sydWeights(months)),
      unitsLeft,
      blocks,
      cum,
      units,
    };
    phases.push(phase);
    return phase;
  };

  const yearEnd = (t: number) => {
    const value = inp.values[t / 12 - 1 - firstYear];
    if (value === null || value === undefined) return;
    const before = carrying();
    const when = dayBefore(t);
    if (inp.revaluation) {
      // Elimination method: accumulated depreciation is closed against the gross amount.
      const diff = round2(value - before);
      let pl = 0;
      let oci = 0;
      if (diff > 0) {
        pl = Math.min(diff, revaluationLosses);
        oci = round2(diff - pl);
        revaluationLosses = round2(revaluationLosses - pl);
      } else if (diff < 0) {
        oci = -Math.min(-diff, surplus);
        pl = round2(diff - oci);
        revaluationLosses = round2(revaluationLosses - pl);
      }
      const lines: [string, number][] = [
        ["פחת שנצבר", acc],
        ["רכוש קבוע", round2(value - gross)],
        ["קרן הערכה מחדש (רווח כולל אחר)", -oci],
        [pl >= 0 ? "ביטול הפסד מהערכה מחדש (רווח או הפסד)" : "הפסד מהערכה מחדש (רווח או הפסד)", -pl],
      ];
      surplus = round2(surplus + oci);
      gross = value;
      acc = 0;
      bookings.push({
        t,
        side: "close",
        kind: "revaluation",
        when,
        narrative: `הערכה מחדש לשווי הוגן ${fmt(value)} (ערך בספרים לפני: ${fmt(before)})`,
        reference: "IAS 16.31, 35(ב), 39–40",
        lines,
        pl,
        oci,
        addition: 0,
        impairment: 0,
        revaluation: diff,
        disposal: 0,
        working: [
          { label: `הערכה מחדש ליום ${when}`, formula: `שווי הוגן ${fmt(value)} − ערך בספרים ${fmt(before)}`, amount: diff },
          ...(pl !== 0
            ? [{ label: pl > 0 ? "ביטול ירידה שהוכרה קודם ברווח או הפסד" : "ירידה מעבר ליתרת הקרן — לרווח או הפסד", amount: pl }]
            : []),
          ...(oci !== 0 ? [{ label: oci > 0 ? "עלייה — לקרן הערכה מחדש (רווח כולל אחר)" : "ירידה — מקטינה את קרן ההערכה מחדש", amount: oci }] : []),
          { label: "שיטת הביטול: הפחת שנצבר מבוטל, והנכס מוצג בשווי ההוגן", formula: `פחת שנצבר ${fmt(lines[0][1])} מבוטל כנגד העלות` },
        ],
      });
    } else if (value < before) {
      const loss = round2(before - value);
      imp = round2(imp + loss);
      bookings.push({
        t,
        side: "close",
        kind: "impairment",
        when,
        narrative: `ירידת ערך לסכום בר-השבה ${fmt(value)}`,
        reference: "IAS 16.63; IAS 36.59–60",
        lines: [
          ["הפסד מירידת ערך", loss],
          ["ירידת ערך שנצברה", -loss],
        ],
        pl: -loss,
        oci: 0,
        addition: 0,
        impairment: -loss,
        revaluation: 0,
        disposal: 0,
        working: [{ label: `הפסד מירידת ערך ליום ${when}`, formula: `ערך בספרים ${fmt(before)} − סכום בר-השבה ${fmt(value)}`, amount: loss }],
      });
    } else if (value > before && imp > 0) {
      // A reversal may not lift the asset above what it would have been without the impairment.
      shadow ??= run(inp, { skipValues: true });
      const cap = round2((shadow.closing.get(t)?.carrying ?? before) - before);
      const reversal = round2(Math.min(value - before, cap, imp));
      if (reversal <= 0) return;
      imp = round2(imp - reversal);
      bookings.push({
        t,
        side: "close",
        kind: "impairment",
        when,
        narrative: `ביטול הפסד מירידת ערך (סכום בר-השבה ${fmt(value)})`,
        reference: "IAS 36.114, 117–119",
        lines: [
          ["ירידת ערך שנצברה", reversal],
          ["ביטול הפסד מירידת ערך", -reversal],
        ],
        pl: reversal,
        oci: 0,
        addition: 0,
        impairment: reversal,
        revaluation: 0,
        disposal: 0,
        working: [
          {
            label: `ביטול ירידת ערך ליום ${when}`,
            formula: `הנמוך מבין: סכום בר-השבה ${fmt(value)} − ערך בספרים ${fmt(before)}; התקרה — ערך בספרים ללא ירידת ערך ${fmt(before + cap)} − ${fmt(before)}; ויתרת ירידת הערך ${fmt(imp + reversal)}`,
            amount: reversal,
          },
        ],
      });
    } else return;
    cause = inp.revaluation ? "revaluation" : "impairment";
    phaseDirty = true;
  };

  const renovate = (r: Renovation, t: number) => {
    const carryingBefore = carrying();
    gross = round2(gross + r.cost);
    end += r.extension;
    residual = r.residual;
    unitsTotal += r.extraUnits;
    ddbRate = 24 / Math.max(1, end - t);
    renovationInfo = {
      t,
      depreciationBefore: round2(sum([...depBy.values()])),
      carryingBefore,
      newBase: carrying(),
      remainingMonths: end - t,
      ddbRate,
    };
    bookings.push({
      t,
      side: "open",
      kind: "renovation",
      when: fmtDate(r.date),
      narrative: "היוון עלות השיפוץ לנכס",
      reference: "IAS 16.7, 10–13",
      lines: [
        ["רכוש קבוע", r.cost],
        ["מזומנים / ספקים", -r.cost],
      ],
      pl: 0,
      oci: 0,
      addition: r.cost,
      impairment: 0,
      revaluation: 0,
      disposal: 0,
      working: [
        { label: `ערך בספרים ערב השיפוץ (${dayBefore(t)})`, amount: carryingBefore },
        { label: "בתוספת עלות השיפוץ המהוונת", amount: r.cost },
        { label: "ערך בספרים לאחר השיפוץ", formula: `${fmt(carryingBefore)} + ${fmt(r.cost)}`, amount: carrying() },
        { label: "בניכוי ערך שייר מתוקן", amount: -r.residual },
        { label: "בסיס הפחת החדש", amount: round2(carrying() - r.residual) },
        { label: "יתרת אורך החיים המעודכנת", formula: `${end - t} חודשים = ${plain(round2((end - t) / 12))} שנים` },
      ],
    });
    cause = "renovation";
    phaseDirty = true;
  };

  const exchangeAt = (e: Exchange, t: number) => {
    const before = carrying();
    let newCost: number;
    let gain: number;
    if (!e.commercial) {
      newCost = round2(before + e.paid - e.received);
      gain = 0;
    } else if (e.basis === "given") {
      newCost = round2(e.fvGiven + e.paid - e.received);
      gain = round2(e.fvGiven - before);
    } else {
      newCost = e.fvReceived;
      gain = round2(e.fvReceived - e.paid + e.received - before);
    }
    bookings.push({
      t,
      side: "close",
      kind: "exchange",
      when: fmtDate(e.date),
      narrative: e.commercial ? "החלפת נכס — עסקה בעלת מהות מסחרית" : "החלפת נכס — ללא מהות מסחרית (לפי הערך בספרים)",
      reference: e.commercial ? "IAS 16.24–26, 68, 71" : "IAS 16.24",
      lines: [
        ["רכוש קבוע — הנכס שהתקבל", newCost],
        ["פחת שנצבר", acc],
        ["ירידת ערך שנצברה", imp],
        ["מזומנים", round2(e.received - e.paid)],
        ["רכוש קבוע — הנכס שנמסר", -gross],
        [gain >= 0 ? "רווח מהחלפת רכוש קבוע" : "הפסד מהחלפת רכוש קבוע", -gain],
      ],
      pl: gain,
      oci: 0,
      addition: 0,
      impairment: 0,
      revaluation: 0,
      disposal: -before,
      working: [
        { label: "ערך בספרים של הנכס שנמסר במועד העסקה", formula: `${fmt(gross)} − ${fmt(acc)}${imp ? ` − ${fmt(imp)}` : ""}`, amount: before },
        {
          label: "עלות הנכס שהתקבל",
          formula: !e.commercial
            ? `ללא מהות מסחרית: ערך בספרים ${fmt(before)}${e.paid ? ` + מזומן ששולם ${fmt(e.paid)}` : ""}${e.received ? ` − מזומן שהתקבל ${fmt(e.received)}` : ""}`
            : e.basis === "given"
              ? `שווי הוגן של הנכס שנמסר ${fmt(e.fvGiven)}${e.paid ? ` + מזומן ששולם ${fmt(e.paid)}` : ""}${e.received ? ` − מזומן שהתקבל ${fmt(e.received)}` : ""}`
              : `שווי הוגן של הנכס שהתקבל ${fmt(e.fvReceived)}`,
          amount: newCost,
        },
        {
          label: gain >= 0 ? "רווח מההחלפה" : "הפסד מההחלפה",
          formula: !e.commercial
            ? "ללא מהות מסחרית — לא מוכר רווח או הפסד"
            : `תמורה (${e.basis === "given" ? `שווי הוגן שנמסר ${fmt(e.fvGiven)}` : `${fmt(e.fvReceived)}${e.paid ? ` − ${fmt(e.paid)}` : ""}${e.received ? ` + ${fmt(e.received)}` : ""}`}) − ערך בספרים ${fmt(before)}`,
          amount: gain,
        },
      ],
    });
    if (surplus > 0) {
      bookings.push({
        t,
        side: "close",
        kind: "surplus",
        when: fmtDate(e.date),
        narrative: "העברת יתרת קרן ההערכה מחדש לעודפים בעת הגריעה",
        reference: "IAS 16.41",
        lines: [
          ["קרן הערכה מחדש", surplus],
          ["עודפים", -surplus],
        ],
        pl: 0,
        oci: 0,
        addition: 0,
        impairment: 0,
        revaluation: 0,
        disposal: 0,
        working: [{ label: "יתרת קרן ההערכה מחדש מועברת לעודפים בגריעה", amount: surplus }],
      });
    }
    exchangeInfo = { t, carrying: before, newCost, gain };
    gross = 0;
    acc = 0;
    imp = 0;
    surplus = 0;
  };

  let phase = newPhase(start);
  for (let t = start; ; t++) {
    if (!opts.skipValues && t > start && t % 12 === 0 && t < end && t <= stopAt()) yearEnd(t);
    if (exchange && t === stopAt()) exchangeAt(exchange, t);
    closing.set(t, { gross, acc, imp, surplus, carrying: carrying() });
    if (t >= stopAt()) break;
    if (renovation && t === renovation.at) renovate(renovation, t);
    if (phaseDirty) {
      phase = newPhase(t);
      phaseDirty = false;
    }
    const k = t - phase.t0;
    if (k < phase.months) {
      const dep = round2(phase.cum[k + 1] - phase.cum[k]);
      acc = round2(acc + dep);
      depBy.set(t, dep);
      unitsUsed += phase.units[k] ?? 0;
      if (inp.transferSurplus && phase.surplus > 0 && phase.depreciable > 0) {
        const share = (c: number) => round2((phase.surplus * c) / phase.depreciable);
        const transfer = round2(share(phase.cum[k + 1]) - share(phase.cum[k]));
        surplus = round2(surplus - transfer);
        transferBy.set(t, transfer);
      }
    }
  }

  // Assigned inside closures, which control-flow analysis cannot see.
  return {
    start,
    stop: stopAt(),
    end,
    firstYear,
    closing,
    depBy,
    transferBy,
    bookings,
    phases,
    renovationInfo: renovationInfo as RenovationInfo | null,
    exchangeInfo: exchangeInfo as ExchangeInfo | null,
    residual,
  };
}

/** Errors that need the simulated run, keyed by field id. */
export function timelineErrors(v: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  const inp = parseInputs(v);
  const originalEnd = inp.start + inp.lifeMonths;
  if (inp.lifeMonths < 1) errors.usefulLife = "אורך החיים חייב להיות לפחות חודש אחד.";
  if (bool(v, "hasEvents") && !inp.renovation && !inp.exchange && inp.values.length === 0 && !(inp.revaluation && bool(v, "revalue"))) {
    errors.hasEvents = "סמנו לפחות אירוע אחד, או ענו \"לא\".";
  }
  if (monthIndex(str(v, "calcEnd")) <= monthIndex(str(v, "calcStart"))) {
    errors.calcEnd = "תאריך סיום החישוב חייב להיות אחרי תאריך ההתחלה.";
  }
  if (inp.method === "units" && inp.totalUnits <= 0) errors.totalUnits = "יש להזין את סך יחידות התפוקה הצפויות.";
  if (inp.renovation) {
    if (inp.renovation.at <= inp.start) errors.revisionDate = "מועד השיפוץ חייב להיות אחרי מועד הזמינות לשימוש.";
    else if (inp.renovation.at >= originalEnd) errors.revisionDate = "מועד השיפוץ חייב להיות לפני תום אורך החיים המקורי.";
    else if (originalEnd + inp.renovation.extension - inp.renovation.at < 1) {
      errors.lifeExtension = "לאחר השינוי חייב להישאר לפחות חודש אחד של אורך חיים.";
    }
  }
  if (inp.exchange) {
    if (inp.exchange.at <= inp.start) errors.exchangeDate = "מועד ההחלפה חייב להיות אחרי מועד הזמינות לשימוש.";
    else if (inp.renovation && inp.exchange.at <= inp.renovation.at) errors.exchangeDate = "ההחלפה חייבת להתבצע אחרי השיפוץ.";
  }
  if (Object.keys(errors).length > 0) return errors;

  const r = run(inp);
  if (r.renovationInfo && inp.renovation!.residual >= r.renovationInfo.newBase) {
    errors.revisedResidual = `ערך השייר המעודכן חייב להיות נמוך מהערך בספרים לאחר השיפוץ (${money(r.renovationInfo.newBase)}).`;
  }
  if (r.exchangeInfo && r.exchangeInfo.newCost < 0) {
    errors.cashAmount = "המזומן שהתקבל עולה על הערך בספרים של הנכס שנמסר; העלות של הנכס שהתקבל אינה יכולה להיות שלילית.";
  }
  const viewStart = Math.max(monthIndex(str(v, "calcStart")), r.start);
  const viewEnd = Math.min(monthIndex(str(v, "calcEnd")), r.stop);
  if (viewEnd <= viewStart && !errors.calcEnd) errors.calcStart = "טווח החישוב אינו חופף לתקופה שבה הנכס בשימוש.";
  return errors;
}

const sumRange = (m: Map<number, number>, from: number, to: number) => {
  let total = 0;
  for (let t = from; t < to; t++) total += m.get(t) ?? 0;
  return round2(total);
};

type Period = { year: number; a: number; b: number; label: string };

function periodsOf(r: Run, rangeStart: number, rangeEnd: number): Period[] {
  const viewStart = Math.max(rangeStart, r.start);
  const viewEnd = Math.min(rangeEnd, r.stop);
  const out: Period[] = [];
  for (let year = Math.floor(viewStart / 12); year * 12 < viewEnd; year++) {
    const a = Math.max(year * 12, viewStart);
    const b = Math.min(year * 12 + 12, viewEnd);
    out.push({ year, a, b, label: b - a === 12 ? String(year) : `${year} (${monthLabel(a)}–${monthLabel(b - 1)})` });
  }
  return out;
}

const inPeriod = (bk: Booking, p: Period) => (bk.side === "open" ? bk.t >= p.a && bk.t < p.b : bk.t > p.a && bk.t <= p.b);

export function solveTimeline(v: Values): Solution {
  const currency = str(v, "currency");
  const fmt = (n: number) => money(n, currency);
  const inp = parseInputs(v);
  const { method, revaluation } = inp;
  const label = METHOD_LABEL[method];
  const r = run(inp);
  const rangeStart = monthIndex(str(v, "calcStart"));
  const rangeEnd = monthIndex(str(v, "calcEnd"));
  const periods = periodsOf(r, rangeStart, rangeEnd);
  const viewStart = periods[0].a;
  const viewEnd = periods.at(-1)!.b;
  const ren = r.renovationInfo;
  const ex = r.exchangeInfo;
  const lifeYears = Math.floor(inp.lifeMonths / 12);
  const lifeRest = inp.lifeMonths % 12;
  const lifeText = `${lifeYears} שנים${lifeRest ? ` ו-${lifeRest} חודשים` : ""}`;
  const depreciable = round2(inp.cost - inp.residual);
  const hasImpairment = r.bookings.some((b) => b.kind === "impairment");
  const hasRevaluation = r.bookings.some((b) => b.kind === "revaluation");

  // ---- schedule ------------------------------------------------------------
  const rows: ScheduleRow[] = periods.map((p) => {
    const open = r.closing.get(p.a)!;
    const close = r.closing.get(p.b)!;
    const books = r.bookings.filter((bk) => inPeriod(bk, p));
    const total = (key: "addition" | "impairment" | "revaluation" | "disposal") => round2(sum(books.map((bk) => bk[key])));
    const events = books.filter((bk) => bk.kind !== "surplus").map((bk) => `${bk.when} ${EVENT_LABEL[bk.kind]}`);
    if (p.b === r.end && !ex) events.push(`תום אורך החיים ${dayBefore(r.end)}`);
    return {
      year: p.year,
      period: p.label,
      months: p.b - p.a,
      opening: open.carrying,
      additions: total("addition"),
      before: ren ? sumRange(r.depBy, p.a, Math.min(p.b, ren.t)) : null,
      after: ren ? sumRange(r.depBy, Math.max(p.a, ren.t), p.b) : null,
      total: sumRange(r.depBy, p.a, p.b),
      impairment: total("impairment"),
      revaluation: total("revaluation"),
      disposal: total("disposal"),
      gross: close.gross,
      accumulated: close.acc,
      accImpairment: close.imp,
      carrying: close.carrying,
      surplus: close.surplus,
      transfer: sumRange(r.transferBy, p.a, p.b),
      event: events.length > 0 ? events.join(" · ") : null,
      _emphasis: books.length > 0 ? "event" : null,
    };
  });
  const totalDep = round2(sum(rows.map((row) => Number(row.total))));
  const closeView = r.closing.get(viewEnd)!;

  // ---- journal -------------------------------------------------------------
  // Every entry goes to the full journal (for export) and to its own period.
  const journal: JournalEntry[] = [];
  const journalByPeriod: JournalEntry[][] = periods.map(() => []);
  let bucket = journalByPeriod[0];
  const post = (e: JournalEntry) => {
    journal.push(e);
    bucket.push(e);
  };
  const book = (bk: Booking) => post({ ...entry(`${bk.kind}-${bk.t}`, bk.when, bk.narrative, bk.lines), reference: bk.reference });
  const depreciation = (from: number, to: number, when: string, narrative: string) => {
    const amount = sumRange(r.depBy, from, to);
    if (amount <= 0) return;
    post({
      ...entry(`dep-${from}-${to}`, when, `${narrative} (${to - from} חודשים, ${label})`, [
        ["הוצאות פחת", amount],
        ["פחת שנצבר", -amount],
      ]),
      reference: "IAS 16.48, 50",
    });
  };
  if (viewStart === r.start) {
    post({
      ...entry("acquisition", fmtDate(inp.startDate), "הכרה לראשונה לפי עלות (מחיר רכישה ועלויות המיוחסות במישרין)", [
        ["רכוש קבוע", inp.cost],
        ["מזומנים / ספקים", -inp.cost],
      ]),
      reference: "IAS 16.7, 15–17",
    });
  }
  for (const [i, p] of periods.entries()) {
    bucket = journalByPeriod[i];
    const books = r.bookings.filter((bk) => inPeriod(bk, p));
    let cursor = p.a;
    for (const bk of books.filter((b) => b.side === "open")) {
      depreciation(cursor, bk.t, dayBefore(bk.t), "פחת עד מועד השיפוץ");
      book(bk);
      cursor = bk.t;
    }
    const exchangeHere = books.some((b) => b.kind === "exchange");
    depreciation(cursor, p.b, dayBefore(p.b), exchangeHere ? "פחת עד מועד ההחלפה" : "פחת לתקופה");
    const transfer = sumRange(r.transferBy, p.a, p.b);
    if (transfer > 0) {
      post({
        ...entry(`transfer-${p.b}`, dayBefore(p.b), "העברה מקרן ההערכה מחדש לעודפים (החלק שמומש בשימוש)", [
          ["קרן הערכה מחדש", transfer],
          ["עודפים", -transfer],
        ]),
        reference: "IAS 16.41",
      });
    }
    books.filter((b) => b.side === "close").forEach(book);
  }

  // ---- financial statements -------------------------------------------------
  const byYear = (key: string, sign = 1) => Object.fromEntries(rows.map((row) => [`y${row.year}`, round2(sign * Number(row[key] ?? 0))]));
  const yearColumns = periods.map((p) => ({ key: `y${p.year}`, label: dayBefore(p.b) }));
  const plBy = (kinds: Booking["kind"][], field: "pl" | "oci") =>
    Object.fromEntries(
      periods.map((p) => [
        `y${p.year}`,
        round2(sum(r.bookings.filter((bk) => kinds.includes(bk.kind) && inPeriod(bk, p)).map((bk) => bk[field]))),
      ]),
    );
  const depRow = byYear("total", -1);
  const impairmentRow = plBy(["impairment"], "pl");
  const revaluationPlRow = plBy(["revaluation"], "pl");
  const exchangeRow = plBy(["exchange"], "pl");
  const ociRow = plBy(["revaluation"], "oci");
  const plTotal = Object.fromEntries(
    periods.map((p) => {
      const k = `y${p.year}`;
      return [k, round2(depRow[k] + impairmentRow[k] + revaluationPlRow[k] + exchangeRow[k])];
    }),
  );

  const balanceRows: ScheduleRow[] = [
    { item: revaluation ? "עלות / סכום משוערך" : "עלות", ...byYear("gross") },
    { item: "בניכוי פחת שנצבר", ...byYear("accumulated", -1) },
    ...(hasImpairment ? [{ item: "בניכוי ירידת ערך שנצברה", ...byYear("accImpairment", -1) }] : []),
    { item: "רכוש קבוע, נטו (ערך בספרים)", ...byYear("carrying"), _emphasis: "total" },
    ...(ex
      ? [{ item: "רכוש קבוע — הנכס שהתקבל בהחלפה (עלות)", ...Object.fromEntries(periods.map((p) => [`y${p.year}`, p.b >= ex.t ? ex.newCost : 0])) }]
      : []),
    ...(revaluation ? [{ item: "קרן הערכה מחדש (הון)", ...byYear("surplus"), _emphasis: "subtotal" }] : []),
  ];
  const plRows: ScheduleRow[] = [
    { item: "הוצאות פחת", ...depRow },
    ...(hasImpairment ? [{ item: "הפסד מירידת ערך / ביטולו", ...impairmentRow }] : []),
    ...(revaluation && hasRevaluation ? [{ item: "הפסד מהערכה מחדש / ביטולו", ...revaluationPlRow }] : []),
    ...(ex ? [{ item: "רווח (הפסד) מהחלפת רכוש קבוע", ...exchangeRow }] : []),
    { item: "סך ההשפעה על הרווח או ההפסד", ...plTotal, _emphasis: "total" },
    ...(revaluation ? [{ item: "רווח כולל אחר — שינוי בקרן הערכה מחדש", ...ociRow, _emphasis: "subtotal" }] : []),
  ];

  // ---- year by year --------------------------------------------------------
  const phaseEnd = (i: number) => r.phases[i + 1]?.t0 ?? r.stop;
  const phaseAt = (t: number) => r.phases.findLast((ph) => ph.t0 <= t)!;
  const years = (n: number) => plain(round2(n / 12));

  /** How the depreciation of months [a, b) was computed, phase by phase and asset-year by asset-year. */
  const depreciationWorkings = (a: number, b: number): Working[] => {
    const out: Working[] = [];
    r.phases.forEach((ph, i) => {
      const s = Math.max(a, ph.t0);
      const e = Math.min(b, phaseEnd(i));
      if (e <= s) return;
      const span = `${monthLabel(s)}–${monthLabel(e - 1)}`;
      const base = `(${fmt(ph.carrying)} − גרט ${fmt(ph.residual)})`;
      if (method === "straight-line") {
        out.push({
          label: `${span} · ${e - s} חודשים`,
          formula: `${base} ÷ ${ph.months} חודשי חיים × ${e - s} = ${fmt(ph.depreciable / ph.months)} לחודש × ${e - s}`,
          amount: sumRange(r.depBy, s, e),
        });
      } else if (method === "units") {
        const used = round2(sum(ph.units.slice(s - ph.t0, e - ph.t0)));
        const perUnit = ph.unitsLeft > 0 ? ph.depreciable / ph.unitsLeft : 0;
        out.push({
          label: `${span} · ${plain(used)} יחידות`,
          formula: `${base} ÷ ${plain(ph.unitsLeft)} יחידות = ${fmt(perUnit)} ליחידה × ${plain(used)}`,
          amount: sumRange(r.depBy, s, e),
        });
      } else {
        for (const bl of ph.blocks) {
          const bs = ph.t0 + bl.from;
          const be = bs + bl.length;
          const share = overlap(bs, be, s, e);
          if (!share) continue;
          const yearCharge =
            method === "sum-of-years"
              ? `${fmt(ph.depreciable)} × ${plain(bl.weight!)}/${plain(ph.digits)}`
              : bl.switched
                ? `(${fmt(bl.opening!)} − ${fmt(ph.residual)}) × ${bl.length}/${bl.left} (קו ישר על היתרה)`
                : `${fmt(bl.opening!)} × ${percent(ph.ddbRate)}${bl.length < 12 ? ` × ${bl.length}/12` : ""}`;
          out.push({
            label: `שנת נכס ${monthLabel(bs)}–${monthLabel(be - 1)} · ${share} מתוך ${bl.length} חודשים`,
            formula: `${yearCharge} = ${fmt(bl.amount)} לשנת הנכס × ${share}/${bl.length}`,
            amount: round2((bl.amount * share) / bl.length),
          });
        }
      }
    });
    return out;
  };

  const historical = revaluation ? run({ ...inp, values: [] }) : null;

  /** What carries the calculation into the period after [a, b). */
  const nextSteps = (p: Period): Guidance[] => {
    const t = p.b;
    if (ex && t >= ex.t) return exchangeNext(ex);
    if (t >= r.end) {
      return [
        {
          title: "הנכס הופחת במלואו",
          body: `אורך החיים הסתיים ב-${dayBefore(r.end)}. הנכס מופחת עד ערך השייר (${fmt(r.residual)}) ואין פחת נוסף; הוא נשאר בספרים עד לגריעתו.`,
          reference: "IAS 16.55, 67",
        },
      ];
    }
    const nextYear = Math.floor(t / 12);
    const nextEnd = Math.min((nextYear + 1) * 12, r.stop);
    const nextDep = sumRange(r.depBy, t, nextEnd);
    const ph = phaseAt(t);
    const open = r.closing.get(t)!;
    const remaining = r.end - t;
    const out: Guidance[] = [];
    const amountLine = `פחת לשנת ${nextYear}${nextEnd - t < 12 ? ` (${nextEnd - t} חודשים)` : ""}: ${fmt(nextDep)}.`;

    let formula: string;
    if (method === "straight-line") {
      const annual = fmt(round2((ph.depreciable / ph.months) * 12));
      formula =
        ph.cause === "start"
          ? `ללא שינוי אומדן שתי הדרכים שקולות: (עלות מקורית ${fmt(inp.cost)} − גרט ${fmt(inp.residual)}) ÷ ${years(inp.lifeMonths)} שנות חיים = ${annual} לשנה; או (עלות מופחתת בתחילת השנה ${fmt(open.carrying)} − גרט ${fmt(ph.residual)}) ÷ יתרת אורך חיים ${years(remaining)} שנים = ${annual}.`
          : ph.cause === "renovation"
            ? `(יתרה בספרים ערב השיפוץ ${fmt(ren!.carryingBefore)} + עלות השיפוץ ${fmt(inp.renovation!.cost)} − גרט מתוקן ${fmt(ph.residual)}) ÷ יתרת אורך החיים המעודכנת ממועד השיפוץ ${years(ph.months)} שנים = ${annual} לשנה.`
            : ph.cause === "revaluation"
              ? `(השווי ההוגן החדש ${fmt(ph.carrying)} − גרט ${fmt(ph.residual)}) ÷ יתרת אורך החיים ממועד ההערכה ${years(ph.months)} שנים = ${annual} לשנה.`
              : `(ערך בספרים לאחר ירידת הערך ${fmt(ph.carrying)} − גרט ${fmt(ph.residual)}) ÷ יתרת אורך החיים ${years(ph.months)} שנים = ${annual} לשנה.`;
    } else {
      const lead =
        ph.cause === "renovation"
          ? `מאז השיפוץ הבסיס הוא (יתרה בספרים ערב השיפוץ + עלות השיפוץ − גרט מתוקן) = ${fmt(ph.depreciable)}, על פני ${years(ph.months)} שנים.`
          : ph.cause === "revaluation"
            ? `מאז ההערכה מחדש הבסיס הוא (שווי הוגן − גרט) = ${fmt(ph.depreciable)}, על פני ${years(ph.months)} שנים.`
            : ph.cause === "impairment"
              ? `מאז ירידת הערך הבסיס הוא (ערך בספרים מעודכן − גרט) = ${fmt(ph.depreciable)}.`
              : `הבסיס הוא (עלות − גרט) = ${fmt(ph.depreciable)}.`;
      formula = `${lead} ${depreciationWorkings(t, nextEnd)
        .map((w) => `${w.label}: ${w.formula}`)
        .join("; ")}.`;
    }
    out.push({ title: `איך ממשיכים לשנת ${nextYear}? — פחת`, body: `${formula} ${amountLine}`, reference: CAUSE_REFERENCE[ph.cause] });

    const upcoming = r.bookings.filter((bk) => bk.kind !== "surplus" && bk.t >= t && bk.t <= nextEnd && !(bk.side === "close" && bk.t === t));
    if (upcoming.length > 0) {
      out.push({
        title: "שימו לב לאירוע בשנה הבאה",
        body: `${upcoming.map((bk) => `${bk.when} — ${EVENT_LABEL[bk.kind]}`).join("; ")}. החישוב מתעדכן ממועד האירוע, וחלקה הראשון של השנה מחושב לפי הנוסחה שלמעלה.`,
        reference: "IAS 8.36–38",
      });
    }

    if (revaluation && open.surplus > 0) {
      if (inp.transferSurplus && historical) {
        const transfer = sumRange(r.transferBy, t, nextEnd);
        const histDep = sumRange(historical.depBy, t, nextEnd);
        out.push({
          title: "העברה מקרן ההערכה מחדש לעודפים",
          body: `העברה בקצב הפחת: הפרש הפחת — פחת לפי השווי המשוערך ${fmt(nextDep)} פחות פחת לפי העלות ההיסטורית ${fmt(histDep)} = ${fmt(round2(nextDep - histDep))}; או לחלופין: יתרת הקרן ${fmt(open.surplus)} ÷ יתרת אורך החיים ${years(remaining)} שנים${nextEnd - t < 12 ? ` × ${nextEnd - t}/12` : ""} = ${fmt(round2((open.surplus / remaining) * (nextEnd - t)))}. המערכת מעבירה ${fmt(transfer)} (החלק היחסי של הקרן לפי הפחת שנרשם). בסוף השנה: ח׳ קרן הערכה מחדש, ז׳ עודפים — פקודה בהון, לא דרך רווח או הפסד.`,
          reference: "IAS 16.41",
        });
      } else {
        out.push({
          title: "קרן ההערכה מחדש",
          body: `נבחרה העברה בעת מימוש בלבד: הקרן (${fmt(open.surplus)}) נשארת בהון ללא שינוי, ותועבר ישירות לעודפים כשהנכס ייגרע.`,
          reference: "IAS 16.41",
        });
      }
    }
    return out;
  };

  /** The asset received in an exchange: how its cost was set and what it depreciates next. */
  function exchangeNext(x: NonNullable<typeof ex>): Guidance[] {
    const e = inp.exchange!;
    const m = method === "units" ? "straight-line" : method;
    const { charges } = monthlyCharges(m, x.newCost, e.newResidual, e.newLife, {
      t0: x.t,
      ddbRate: 24 / e.newLife,
      unitsLeft: 0,
      unitsAt: () => null,
    });
    const restOfYear = x.t % 12 === 0 ? 0 : 12 - (x.t % 12);
    const firstYear = round2(sum(charges.slice(restOfYear, restOfYear + 12)));
    const yearNo = Math.floor((x.t + restOfYear) / 12);
    const cost = e.commercial
      ? e.basis === "given"
        ? `שווי הוגן של הנכס שנמסר ${fmt(e.fvGiven)}${e.paid ? ` + מזומן ששולם ${fmt(e.paid)}` : ""}${e.received ? ` − מזומן שהתקבל ${fmt(e.received)}` : ""}`
        : `שווי הוגן של הנכס שהתקבל ${fmt(e.fvReceived)} (השווי של הנכס שנמסר אינו ידוע)`
      : `ללא מהות מסחרית — ערך בספרים של הנכס שנמסר ${fmt(x.carrying)}${e.paid ? ` + ${fmt(e.paid)}` : ""}${e.received ? ` − ${fmt(e.received)}` : ""}`;
    return [
      {
        title: "קביעת העלות של הנכס החדש",
        body: `${cost} = ${fmt(x.newCost)}. הנכס הישן נגרע, ו${x.gain === 0 ? "לא מוכר רווח או הפסד" : `מוכר ${x.gain > 0 ? "רווח" : "הפסד"} של ${fmt(Math.abs(x.gain))}`}.`,
        reference: "IAS 16.24–26",
      },
      {
        title: `איך ממשיכים לשנת ${yearNo}? — פחת הנכס החדש`,
        body: `${METHOD_LABEL[m]}${method === "units" ? " (ללא נתוני תפוקה לנכס החדש)" : ""}: (עלות ${fmt(x.newCost)} − גרט ${fmt(e.newResidual)}) על פני ${years(e.newLife)} שנים${restOfYear ? `; ביתרת שנת ההחלפה (${restOfYear} חודשים): ${fmt(round2(sum(charges.slice(0, restOfYear))))}` : ""}. פחת לשנת ${yearNo}: ${fmt(firstYear)}.`,
        reference: "IAS 16.50, 55",
      },
    ];
  }

  const plFor = (p: Period, kind: Booking["kind"], field: "pl" | "oci") =>
    round2(sum(r.bookings.filter((bk) => bk.kind === kind && inPeriod(bk, p)).map((bk) => bk[field])));

  const yearSections: YearSection[] = periods.map((p, i) => {
    const row = rows[i];
    const books = r.bookings.filter((bk) => inPeriod(bk, p));
    const transfer = Number(row.transfer);
    const dep = Number(row.total);
    const workings: Working[] = [
      ...books.filter((bk) => bk.side === "open").flatMap((bk) => bk.working),
      ...depreciationWorkings(p.a, p.b),
      { label: `סך הפחת לשנת ${p.year}`, amount: dep },
      ...(transfer > 0
        ? [{ label: "העברה מקרן ההערכה מחדש לעודפים", formula: "יתרת הקרן × הפחת שנרשם ÷ הסכום בר-הפחת", amount: transfer }]
        : []),
      ...books.filter((bk) => bk.side === "close").flatMap((bk) => bk.working),
    ];
    const balance: StatementLine[] = [
      { label: revaluation ? "עלות / שווי הוגן משוערך" : "עלות", value: Number(row.gross) },
      { label: "בניכוי פחת שנצבר", value: -Number(row.accumulated) },
      ...(Number(row.accImpairment) ? [{ label: "בניכוי ירידת ערך שנצברה", value: -Number(row.accImpairment) }] : []),
      { label: "יתרה בספרים (Carrying Amount)", value: Number(row.carrying), emphasis: "total" as const },
      ...(ex && p.b >= ex.t ? [{ label: "רכוש קבוע — הנכס שהתקבל בהחלפה", value: ex.newCost }] : []),
      ...(revaluation ? [{ label: "קרן הערכה מחדש (בהון העצמי)", value: Number(row.surplus), emphasis: "subtotal" as const }] : []),
    ];
    const impairment = plFor(p, "impairment", "pl");
    const revaluationPl = plFor(p, "revaluation", "pl");
    const exchangePl = plFor(p, "exchange", "pl");
    const oci = plFor(p, "revaluation", "oci");
    const profitOrLoss: StatementLine[] = [
      { label: "הוצאות פחת", value: -dep },
      ...(impairment ? [{ label: impairment < 0 ? "הפסד מירידת ערך" : "ביטול הפסד מירידת ערך", value: impairment }] : []),
      ...(revaluationPl ? [{ label: revaluationPl < 0 ? "הפסד מהערכה מחדש" : "ביטול הפסד מהערכה מחדש", value: revaluationPl }] : []),
      ...(ex && inPeriod(r.bookings.find((bk) => bk.kind === "exchange")!, p) ? [{ label: "רווח (הפסד) ממימוש / החלפה", value: exchangePl }] : []),
      { label: "סך ההשפעה על הרווח או ההפסד", value: round2(-dep + impairment + revaluationPl + exchangePl), emphasis: "total" as const },
      ...(oci ? [{ label: "רווח כולל אחר — קרן הערכה מחדש", value: oci, emphasis: "subtotal" as const }] : []),
    ];
    return {
      id: `y${p.year}`,
      title: `שנת ${p.year}`,
      subtitle: `${p.b - p.a} חודשים · ${monthLabel(p.a)}–${monthLabel(p.b - 1)}${books.length ? ` · ${books.filter((bk) => bk.kind !== "surplus").map((bk) => EVENT_LABEL[bk.kind]).join(", ")}` : ""}`,
      journal: journalByPeriod[i],
      workings,
      balanceDate: dayBefore(p.b),
      balance,
      profitOrLoss,
      next: nextSteps(p),
    };
  });

  // ---- method comparison ---------------------------------------------------
  const methods: PpeMethod[] = ["straight-line", "sum-of-years", "double-declining", ...(method === "units" || inp.units.length > 0 ? (["units"] as const) : [])];
  const runs = new Map(methods.map((m) => [m, m === method ? r : run({ ...inp, method: m })]));
  const comparison: ScheduleRow[] = periods.map((p) => ({
    period: p.label,
    ...Object.fromEntries(methods.map((m) => [COMPARE_KEY[m], sumRange(runs.get(m)!.depBy, p.a, p.b)])),
    _emphasis: null,
  }));

  // ---- metrics -------------------------------------------------------------
  const metrics: Metric[] = [
    { label: "עלות במועד ההכרה", value: inp.cost, format: "currency" },
    { label: "סכום בר-פחת", value: depreciable, format: "currency", hint: `${fmt(inp.cost)} − ערך שייר ${fmt(inp.residual)}` },
    { label: "פחת בטווח החישוב", value: totalDep, format: "currency", hint: `${monthLabel(viewStart)} עד ${monthLabel(viewEnd - 1)}` },
    { label: "ערך בספרים בסוף הטווח", value: closeView.carrying, format: "currency", hint: dayBefore(viewEnd) },
  ];
  if (ren) {
    const firstYearAfter = sumRange(r.depBy, ren.t, Math.min(ren.t + 12, r.stop));
    metrics.push(
      { label: "פחת שנצבר עד השיפוץ", value: ren.depreciationBefore, format: "currency", hint: `${ren.t - r.start} חודשים` },
      { label: "ערך בספרים במועד השיפוץ", value: ren.carryingBefore, format: "currency" },
      { label: "ערך בספרים לאחר היוון השיפוץ", value: ren.newBase, format: "currency" },
      { label: "יתרת אורך חיים מעודכנת (שנים)", value: round2(ren.remainingMonths / 12), format: "number" },
    );
    if (method === "sum-of-years") {
      metrics.push(
        { label: "סכום הספרות המעודכן", value: round2(sum(sydWeights(ren.remainingMonths))), format: "number", hint: sydWeights(ren.remainingMonths).join(" + ") },
        { label: "פחת ב-12 החודשים שלאחר השיפוץ", value: firstYearAfter, format: "currency" },
      );
    } else if (method === "double-declining") {
      metrics.push({ label: "שיעור פחת מעודכן", value: ren.ddbRate, format: "percent" });
    } else {
      metrics.push({ label: method === "straight-line" ? "פחת שנתי מעודכן" : "פחת ב-12 החודשים שלאחר השיפוץ", value: firstYearAfter, format: "currency" });
    }
  }
  if (revaluation) metrics.push({ label: "קרן הערכה מחדש בסוף הטווח", value: closeView.surplus, format: "currency" });
  if (ex) {
    metrics.push(
      { label: "עלות הנכס שהתקבל בהחלפה", value: ex.newCost, format: "currency" },
      { label: "רווח (הפסד) מההחלפה", value: ex.gain, format: "currency", hint: `ערך בספרים שנגרע ${fmt(ex.carrying)}` },
    );
  }

  // ---- tables --------------------------------------------------------------
  const methodBasis =
    method === "straight-line"
      ? `${fmt(round2(depreciable / (inp.lifeMonths / 12)))} לשנה`
      : method === "sum-of-years"
        ? `סכום ספרות ${round2(sum(sydWeights(inp.lifeMonths)))}`
        : method === "double-declining"
          ? `שיעור ${percent(24 / inp.lifeMonths)} מהערך בספרים`
          : `${fmt(round2(depreciable / Math.max(1, inp.totalUnits)))} ליחידה (${inp.totalUnits.toLocaleString("en-US")} יחידות)`;
  const costTable: ScheduleTable = {
    id: "cost",
    title: "שלב 1 — עלות הנכס ובסיס הפחת",
    note: "העלות כוללת את מחיר הרכישה בניכוי הנחות, ועלויות המיוחסות במישרין להבאת הנכס למיקום ולמצב הדרושים להפעלתו (הובלה, התקנה, הרצה). הסכום בר-הפחת הוא העלות בניכוי ערך השייר.",
    reference: "IAS 16.15–17, 6, 53",
    columns: [
      { key: "item", label: "רכיב", format: "text" },
      { key: "amount", label: "סכום" },
    ],
    rows: [
      { item: "מחיר רכישה", amount: inp.purchasePrice },
      { item: "עלויות המיוחסות במישרין", amount: inp.attributableCosts },
      { item: "הנחות מסחריות והחזרים", amount: -inp.discounts },
      { item: "עלות הנכס", amount: inp.cost, _emphasis: "subtotal" },
      { item: "ערך שייר", amount: -inp.residual },
      { item: "סכום בר-פחת", amount: depreciable, _emphasis: "total" },
      { item: "מועד זמינות לשימוש", amount: fmtDate(inp.startDate) },
      { item: "אורך חיים שימושיים", amount: lifeText },
      { item: `שיטת ${label}`, amount: methodBasis },
      { item: "מודל המדידה", amount: revaluation ? "מודל ההערכה מחדש" : "מודל העלות" },
    ],
  };

  const scheduleColumns = [
    { key: "period", label: "תקופה", format: "text" as const },
    { key: "months", label: "חודשים", format: "number" as const },
    { key: "opening", label: "ערך בספרים לפתיחה" },
    ...(ren ? [{ key: "additions", label: "תוספות (שיפוץ)" }] : []),
    ...(ren ? [{ key: "before", label: "פחת — אומדן מקורי" }, { key: "after", label: "פחת — אומדן מעודכן" }] : []),
    { key: "total", label: "סך הפחת" },
    ...(hasImpairment ? [{ key: "impairment", label: "ירידת ערך / ביטול" }] : []),
    ...(revaluation ? [{ key: "revaluation", label: "הערכה מחדש" }] : []),
    ...(ex ? [{ key: "disposal", label: "גריעה בהחלפה" }] : []),
    { key: "gross", label: revaluation ? "עלות / סכום משוערך" : "עלות" },
    { key: "accumulated", label: "פחת שנצבר" },
    ...(hasImpairment ? [{ key: "accImpairment", label: "ירידת ערך שנצברה" }] : []),
    { key: "carrying", label: "ערך בספרים" },
    ...(revaluation ? [{ key: "surplus", label: "קרן הערכה מחדש" }] : []),
    { key: "event", label: "אירועים", format: "text" as const },
  ];
  const scheduleTotals = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, round2(sum(rows.map((row) => Number(row[k] ?? 0))))]));

  const tables: ScheduleTable[] = [
    costTable,
    {
      id: "depreciation",
      title: "שלב 2 — לוח פחת תקופתי ומצטבר",
      caption: `${label} · ${monthLabel(viewStart)} עד ${monthLabel(viewEnd - 1)}${viewStart > r.start ? " · מוצגות יתרות פתיחה" : ""}`,
      note: ren
        ? "הפחת מתחיל במועד הזמינות לשימוש ומחושב לפי חודשים בשנות כספים. ממועד השיפוץ הערך בספרים בתוספת עלות השיפוץ, בניכוי ערך השייר המעודכן, מופחת על פני יתרת החיים המעודכנת — שינוי אומדן מכאן ולהבא, ללא הצגה מחדש."
        : "הפחת מתחיל במועד הזמינות לשימוש ומחושב לפי חודשים בשנות כספים. כל אירוע (הערכה מחדש, ירידת ערך) פותח שלב חדש: הערך בספרים החדש מופחת על פני יתרת אורך החיים.",
      reference: ren ? "IAS 16.51, 55, 61; IAS 8.36–38" : "IAS 16.50, 55, 60–62",
      columns: scheduleColumns,
      rows,
      totals: {
        period: "סה\"כ",
        ...scheduleTotals(["months", "additions", "before", "after", "total", "impairment", "revaluation", "disposal"]),
        opening: null,
        gross: null,
        accumulated: null,
        accImpairment: null,
        carrying: null,
        surplus: null,
        event: null,
      },
    },
    {
      id: "balance-sheet",
      title: "שלב 3 — מאזן: רכוש קבוע",
      caption: "יתרות לסוף כל תקופה",
      note: revaluation
        ? "במודל ההערכה מחדש הנכס מוצג בשווי ההוגן במועד ההערכה בניכוי פחת שנצבר מאז. העלייה נזקפת לקרן הערכה מחדש בהון, למעט ביטול ירידה שהוכרה קודם ברווח או הפסד."
        : "במודל העלות הנכס מוצג בעלות בניכוי פחת שנצבר והפסדים מירידת ערך שנצברו.",
      reference: revaluation ? "IAS 16.31, 39–41, 73" : "IAS 16.30, 73",
      columns: [{ key: "item", label: "סעיף", format: "text" }, ...yearColumns],
      rows: balanceRows,
    },
    {
      id: "profit-or-loss",
      title: "שלב 4 — דוח רווח והפסד ורווח כולל אחר",
      caption: "השפעת הנכס על כל תקופה (הוצאה בסוגריים)",
      note: "הוצאות הפחת, הפסדי ירידת ערך וביטולם, ורווח או הפסד מגריעה נזקפים לרווח או הפסד. רווח מגריעה אינו מסווג כהכנסות.",
      reference: "IAS 16.48, 68, 71; IAS 36.60",
      columns: [{ key: "item", label: "סעיף", format: "text" }, ...yearColumns],
      rows: plRows,
    },
    {
      id: "method-comparison",
      title: "השוואת שיטות פחת",
      caption: "הוצאות הפחת בכל תקופה, לאותם נתונים ואירועים",
      note: "השיטה צריכה לשקף את הדפוס שבו ההטבות הכלכליות העתידיות של הנכס צפויות להיצרך. כל השיטות מגיעות לאותו סך פחת על פני חיי הנכס.",
      reference: "IAS 16.60–62",
      columns: [
        { key: "period", label: "תקופה", format: "text" },
        ...methods.map((m) => ({ key: COMPARE_KEY[m], label: METHOD_LABEL[m] })),
      ],
      rows: comparison,
      totals: { period: "סה\"כ", ...Object.fromEntries(methods.map((m) => [COMPARE_KEY[m], round2(sum(comparison.map((row) => Number(row[COMPARE_KEY[m]]))))])) },
    },
  ];

  // ---- guidance ------------------------------------------------------------
  const guidance: Guidance[] = [
    {
      title: "1. הכרה ומדידה לראשונה",
      body: `פריט רכוש קבוע מוכר לפי עלותו: ${fmt(inp.purchasePrice)} + ${fmt(inp.attributableCosts)} עלויות המיוחסות במישרין − ${fmt(inp.discounts)} הנחות = ${fmt(inp.cost)}. עלויות הנהלה כלליות ועלויות הדרכה אינן חלק מהעלות.`,
      reference: "IAS 16.7, 15–17, 19",
    },
    {
      title: "2. סכום בר-פחת ותחילת הפחת",
      body: `הסכום בר-הפחת (${fmt(depreciable)}) מוקצה על פני ${lifeText}. הפחת מתחיל כשהנכס זמין לשימוש — ${fmtDate(inp.startDate)} — גם אם טרם החל להפיק תפוקה מלאה.`,
      reference: "IAS 16.6, 50, 55",
    },
    {
      title: `3. שיטת ${label}`,
      body: METHOD_TEXT[method],
      reference: "IAS 16.60–62",
    },
  ];
  if (ren) {
    guidance.push(
      {
        title: "4. שיפוץ — היוון עלות",
        body: `עלות שיפוץ שמשפר את הנכס או מאריך את חייו מוכרת בערך בספרים: ${fmt(ren.carryingBefore)} + ${fmt(inp.renovation!.cost)} = ${fmt(ren.newBase)}. עלויות תחזוקה שוטפת נזקפות לרווח או הפסד.`,
        reference: "IAS 16.7, 10–13",
      },
      {
        title: "5. שינוי אומדן — מכאן ולהבא",
        body: `שינוי באורך החיים או בערך השייר הוא שינוי באומדן חשבונאי: אין הצגה מחדש, והבסיס החדש (${fmt(round2(ren.newBase - inp.renovation!.residual))}) מופחת על פני יתרת החיים המעודכנת — ${round2(ren.remainingMonths / 12)} שנים.`,
        reference: "IAS 16.51, 61; IAS 8.36–38",
      },
    );
  }
  if (revaluation) {
    guidance.push({
      title: "הערכה מחדש",
      body: `במודל ההערכה מחדש הנכס מוצג בשווי ההוגן לתאריך ההערכה. הפחת שנצבר מבוטל כנגד הסכום הברוטו (שיטת הביטול). עלייה נזקפת לקרן הערכה מחדש ברווח כולל אחר, אלא אם היא מבטלת ירידה שהוכרה קודם ברווח או הפסד; ירידה מקטינה קודם את הקרן, והיתרה נזקפת לרווח או הפסד.${inp.transferSurplus ? " הקרן מועברת לעודפים בהדרגה, בגובה החלק שמומש בשימוש." : ""}`,
      reference: "IAS 16.31, 35, 39–41",
    });
  } else if (inp.values.some((x) => x !== null)) {
    guidance.push({
      title: "ירידת ערך",
      body: "במודל העלות, כשהסכום בר-ההשבה נמוך מהערך בספרים מוכר הפסד מירידת ערך. ביטול ההפסד מוגבל לערך בספרים שהיה לנכס אילו לא הוכרה ירידת הערך, והפחת בתקופות הבאות מחושב על הערך בספרים המעודכן.",
      reference: "IAS 16.63; IAS 36.59–63, 117",
    });
  }
  if (ex) {
    guidance.push({
      title: "החלפת נכס",
      body: inp.exchange!.commercial
        ? `לעסקה מהות מסחרית, ולכן הנכס שהתקבל נמדד בשווי הוגן (${inp.exchange!.basis === "given" ? "של הנכס שנמסר, בהתאמה למזומן" : "של הנכס שהתקבל, שהוא מהימן יותר"}): ${fmt(ex.newCost)}. הנכס שנמסר נגרע, וההפרש בין התמורה לערכו בספרים (${fmt(ex.carrying)}) מוכר ברווח או הפסד: ${fmt(ex.gain)}.`
        : `לעסקה אין מהות מסחרית, ולכן הנכס שהתקבל נמדד לפי הערך בספרים של הנכס שנמסר, בתוספת מזומן ששולם או בניכוי מזומן שהתקבל: ${fmt(ex.newCost)}. לא מוכר רווח או הפסד.`,
      reference: "IAS 16.24–26, 67–68, 71–72",
    });
  }

  // ---- disclosure ----------------------------------------------------------
  const last = rows.at(-1)!;
  const disclosure = [
    "באור X — רכוש קבוע",
    "",
    "מדיניות חשבונאית",
    `${revaluation ? "רכוש קבוע מוצג לפי סכום משוערך — שווי הוגן במועד ההערכה מחדש בניכוי פחת שנצבר לאחר מכן." : "רכוש קבוע מוצג לפי עלות בניכוי פחת שנצבר והפסדים מירידת ערך שנצברו."} הפחת מחושב לפי שיטת ${label} מהמועד שבו הנכס זמין לשימוש, על פני ${lifeText}. ערכי השייר, אורך החיים השימושיים ושיטת הפחת נבחנים בכל תאריך דיווח.`,
    ...(ren
      ? [
          "",
          "שינוי באומדן",
          `ביום ${fmtDate(inp.renovation!.date)} שופץ הנכס בעלות של ${fmt(inp.renovation!.cost)}; יתרת אורך החיים עודכנה ל-${round2(ren.remainingMonths / 12)} שנים וערך השייר ל-${fmt(inp.renovation!.residual)}. השינוי טופל מכאן ולהבא.`,
        ]
      : []),
    ...(ex
      ? [
          "",
          "החלפת נכסים",
          `ביום ${fmtDate(inp.exchange!.date)} הוחלף הנכס. הנכס שהתקבל הוכר בעלות של ${fmt(ex.newCost)}${ex.gain !== 0 ? `, ונזקף ${ex.gain > 0 ? "רווח" : "הפסד"} של ${fmt(Math.abs(ex.gain))}` : ""}.`,
        ]
      : []),
    "",
    `התאמת הערך בספרים — ${last.period}`,
    `ערך בספרים לתחילת התקופה: ${fmt(Number(last.opening))}`,
    ...(Number(last.additions) ? [`תוספות: ${fmt(Number(last.additions))}`] : []),
    `פחת: (${fmt(Number(last.total))})`,
    ...(Number(last.impairment) ? [`ירידת ערך / ביטולה: ${fmt(Number(last.impairment))}`] : []),
    ...(Number(last.revaluation) ? [`הערכה מחדש: ${fmt(Number(last.revaluation))}`] : []),
    ...(Number(last.disposal) ? [`גריעות: (${fmt(-Number(last.disposal))})`] : []),
    `ערך בספרים לסוף התקופה: ${fmt(Number(last.carrying))}`,
  ].join("\n");

  return {
    headline: `${label} · ${revaluation ? "מודל ההערכה מחדש" : "מודל העלות"} · פחת בטווח ${fmt(totalDep)} · ערך בספרים ל-${dayBefore(viewEnd)}: ${fmt(closeView.carrying)}`,
    outcome: "recognised",
    metrics,
    journal,
    tables,
    disclosure,
    guidance,
    years: yearSections,
    assumptions: [
      "שנת הכספים מסתיימת ב-31/12. פקודות הפחת נרשמות בסוף כל תקופה ובמועד כל אירוע.",
      "הפחת מחושב לפי חודשים שלמים; מועד שחל אחרי ה-15 בחודש מעוגל לתחילת החודש הבא.",
      ...(method === "sum-of-years" || method === "double-declining"
        ? ["בשיטות המואצות, שנות הנכס נמדדות מתחילת כל שלב (זמינות לשימוש או אירוע) והפחת של כל שנת נכס מתפזר באופן שווה על חודשיה."]
        : []),
      ...(method === "sum-of-years" ? ["כשיתרת החיים אינה שנים שלמות, משקל כל שנה הוא יתרת החיים בתחילתה (למשל 5.75, 4.75 … 0.75)."] : []),
      ...(method === "double-declining" ? ["שיעור היתרה הפוחתת הכפולה הוא 2 חלקי אורך החיים בשנים; לאחר שיפוץ הוא מחושב מחדש לפי יתרת החיים."] : []),
      ...(method === "units" ? ["יחידות התפוקה של כל שנת כספים מתפזרות באופן שווה על חודשי השימוש בה; לשנים ללא נתון מחולקות היחידות שנותרו באופן שווה."] : []),
      ...(revaluation || inp.values.some((x) => x !== null) ? ["שווי הוגן / סכום בר-השבה נבחן בסוף כל שנת כספים שלגביה הוזן ערך."] : []),
      ...(revaluation ? ["השפעות מס נדחה על קרן ההערכה מחדש אינן מחושבות."] : []),
      ...(ex ? ["הלוח מסתיים במועד ההחלפה; לנכס שהתקבל מוצגים קביעת העלות והפחת לשנה שאחרי, באותה שיטת פחת."] : []),
      "הלוח מוצג רק לתקופה שבין מועד הזמינות לשימוש לתום אורך החיים או למועד הגריעה, בתוך טווח החישוב שנבחר.",
    ],
  };
}

const EVENT_LABEL: Record<Booking["kind"], string> = {
  renovation: "שיפוץ",
  revaluation: "הערכה מחדש",
  impairment: "בדיקת ירידת ערך",
  exchange: "החלפה",
  surplus: "העברה לעודפים",
};

const CAUSE_REFERENCE: Record<Cause, string> = {
  start: "IAS 16.50, 60–62",
  renovation: "IAS 16.51, 61; IAS 8.36–38",
  revaluation: "IAS 16.31, 35, 50",
  impairment: "IAS 36.63",
};

const COMPARE_KEY: Record<PpeMethod, string> = {
  "straight-line": "slDep",
  "sum-of-years": "sydDep",
  "double-declining": "ddbDep",
  units: "unitsDep",
};

const METHOD_TEXT: Record<PpeMethod, string> = {
  "straight-line": "הוצאה שווה בכל חודש: הסכום בר-הפחת מחולק במספר חודשי החיים שנותרו. מתאים כשההטבות נצרכות באופן אחיד לאורך הזמן.",
  "sum-of-years":
    "שיטה מואצת: לכל שנת נכס משקל השווה ליתרת החיים בתחילתה, והפחת השנתי הוא החלק היחסי של המשקל מסכום הספרות. שנות הנכס נמדדות ממועד הזמינות לשימוש, ושנת כספים שחלה על פני שתי שנות נכס מקבלת חלק יחסי מכל אחת.",
  "double-declining":
    "שיטה מואצת: שיעור קבוע (2 חלקי אורך החיים) מוחל על הערך בספרים בתחילת כל שנת נכס. כשהפחת בקו ישר על היתרה גבוה יותר עוברים אליו, והנכס אינו מופחת מתחת לערך השייר.",
  units: "הפחת נגזר מהשימוש בפועל: הסכום בר-הפחת מחולק בסך יחידות התפוקה הצפויות, ומוכפל ביחידות שהופקו בכל תקופה.",
};
