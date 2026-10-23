import { money, percent, plain } from "../format";
import { entry, round2, sum } from "../math";
import type {
  Equation,
  Guidance,
  JournalEntry,
  MathExpr,
  Metric,
  ScheduleRow,
  ScheduleTable,
  Solution,
  StatementLine,
  Values,
  Working,
  YearSection,
} from "../types";
import { bool, datedValues, num, series, str } from "../validate";

/**
 * IAS 16 on a monthly timeline. The asset's whole life is simulated month by
 * month from the date it is available for use; events (renovation,
 * revaluation, exchange) start a new depreciation phase, and the results are
 * then grouped into calendar fiscal years and clipped to the calculation
 * range the user chose. After an exchange the timeline carries on with the
 * asset received, from its new cost, useful life and residual value.
 */

export type PpeMethod = "straight-line" | "double-declining" | "sum-of-years" | "units";

export const METHOD_LABEL: Record<PpeMethod, string> = {
  "straight-line": "הקו הישר",
  "double-declining": "היתרה הפוחתת הכפולה",
  "sum-of-years": "סכום ספרות השנים",
  units: "יחידות התפוקה",
};

const CURRENCY = "ILS";
const fmt = (n: number) => money(n, CURRENCY);

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
export const dayBefore = (i: number) => fmtDate(new Date(Date.UTC(Math.floor(i / 12), i % 12, 0)).toISOString().slice(0, 10));
const monthLabel = (i: number) => `${String((i % 12) + 1).padStart(2, "0")}/${Math.floor(i / 12)}`;
export const overlap = (from: number, to: number, start: number, end: number) => Math.max(0, Math.min(to, end) - Math.max(from, start));

/** Remaining life, in years, at the start of each 12-month block: 6, 5, …, 1 or 5.75, 4.75, …, 0.75. */
export const sydWeights = (months: number) => Array.from({ length: Math.ceil(months / 12) }, (_, i) => (months - 12 * i) / 12);

type Renovation = { at: number; date: string; cost: number; extension: number; residual: number; extraUnits: number };
/** `land`: the land's part of this fair value, when given for the date (as a share or an amount). */
type Revaluation = { at: number; date: string; value: number; land?: LandPart };
type LandPart = { share?: number; amount?: number };

/**
 * The land column of a fair-value row: "35%" is a share, "500000" an amount.
 * Empty means the share at acquisition; null means it could not be read.
 */
export function parseLandPart(note: string | undefined): LandPart | undefined | null {
  if (!note) return undefined;
  const text = note.replace(/[,\s₪]/g, "");
  const isShare = text.endsWith("%");
  const n = Number(isShare ? text.slice(0, -1) : text);
  if (!Number.isFinite(n) || n < 0) return null;
  return isShare ? { share: n / 100 } : { amount: n };
}
type Exchange = {
  at: number;
  date: string;
  commercial: boolean;
  basis: "given" | "received";
  paid: number;
  received: number;
  fvGiven: number;
  fvReceived: number;
  /** The asset received: its useful life in months and residual value, depreciated from the exchange on. */
  newLife: number;
  newResidual: number;
};

export type Inputs = {
  method: PpeMethod;
  revaluation: boolean;
  transferSurplus: boolean;
  purchasePrice: number;
  attributableCosts: number;
  /** The whole asset's cost: land plus building. */
  cost: number;
  /** The depreciable building component: the cost less any land. */
  buildingCost: number;
  /**
   * Land within the asset (IAS 16.58): not depreciated. `share` splits every
   * fair value between land and building.
   */
  land: { cost: number; share: number } | null;
  /** Applies to the building; land has no residual value to speak of. */
  residual: number;
  start: number;
  startDate: string;
  lifeMonths: number;
  totalUnits: number;
  /** Units produced in each fiscal year, from the first year of use. */
  units: (number | null)[];
  revaluations: Revaluation[];
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
  const cost = round2(purchasePrice + attributableCosts);
  const byPercent = str(v, "landBasis") === "percent";
  const landCost = !bool(v, "hasLand") ? 0 : byPercent ? round2((cost * num(v, "landPercent")) / 100) : num(v, "landAmount");
  return {
    method: str(v, "method") as PpeMethod,
    revaluation,
    transferSurplus: revalues && str(v, "surplusTransfer") === "depreciation",
    purchasePrice,
    attributableCosts,
    cost,
    buildingCost: round2(cost - landCost),
    land: landCost > 0 ? { cost: landCost, share: byPercent ? num(v, "landPercent") / 100 : cost > 0 ? landCost / cost : 0 } : null,
    residual: num(v, "residual"),
    start: monthIndex(str(v, "acquisitionDate")),
    startDate: str(v, "acquisitionDate"),
    lifeMonths: Math.round(num(v, "usefulLife") * 12),
    totalUnits: num(v, "totalUnits"),
    units: series(v, "unitsByYear"),
    revaluations: revalues
      ? datedValues(v, "fairValues").map((r) => ({ at: monthIndex(r.date), date: r.date, value: r.value, land: bool(v, "hasLand") ? (parseLandPart(r.note) ?? undefined) : undefined }))
      : [],
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
          basis: bool(v, "fvGivenKnown") ? "given" : "received",
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

/**
 * Balances at a month boundary. gross, acc, building and surplus are the
 * building's; land and landSurplus the land's; carrying is the whole asset.
 */
type Snapshot = {
  gross: number;
  acc: number;
  building: number;
  surplus: number;
  /** The land's carrying amount, net of its impairment allowance. */
  land: number;
  landSurplus: number;
  /** Revaluation losses on land recognised in profit or loss and not yet reversed, held in an allowance account. */
  landAllowance: number;
  /** The same for the building (or the whole asset when there is no land); `gross` is net of it. */
  buildingAllowance: number;
  carrying: number;
};

/** A non-depreciation event, already shaped as a journal entry. */
type Booking = {
  t: number;
  /** "open" events belong to the period containing month t, "close" ones to the period ending at t. */
  side: "open" | "close";
  kind: "renovation" | "revaluation" | "landRevaluation" | "exchange" | "surplus";
  when: string;
  narrative: string;
  reference: string;
  lines: [string, number][];
  /** A second entry posted right after this one, e.g. the profit-or-loss part of a revaluation booked against an allowance. */
  split?: { narrative: string; lines: [string, number][] };
  /** Effect on profit or loss (negative is an expense) and on other comprehensive income. */
  pl: number;
  oci: number;
  /** Change in the carrying amount, by schedule column. */
  addition: number;
  revaluation: number;
  disposal: number;
  /** Change in the land's carrying amount from revaluation. */
  landRevaluation?: number;
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
type Cause = "start" | "renovation" | "revaluation" | "exchange";

type Phase = {
  t0: number;
  cause: Cause;
  /** The asset received in an exchange keeps the method, except units of production (it has no output figures): straight-line. */
  method: PpeMethod;
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
export function run(inp: Inputs) {
  const { start, exchange, renovation } = inp;
  const firstYear = Math.floor(start / 12);
  let end = start + inp.lifeMonths;
  // The asset given up runs to the exchange (even past the end of its life); the one received, to the end of its own life.
  let exchanged = false;
  let oldEnd: number | null = null;
  const stopAt = () => (exchange && !exchanged ? exchange.at : end);
  let method = inp.method;

  let gross = inp.buildingCost;
  let land = inp.land?.cost ?? 0;
  let landSurplus = 0;
  let landLosses = 0;
  let acc = 0;
  let surplus = 0;
  let revaluationLosses = 0;
  let residual = inp.residual;
  let unitsTotal = inp.totalUnits;
  let unitsUsed = 0;
  let ddbRate = 24 / inp.lifeMonths;

  const carrying = () => round2(gross - acc);
  const depBy = new Map<number, number>();
  const transferBy = new Map<number, number>();
  const closing = new Map<number, Snapshot>();
  const bookings: Booking[] = [];
  const phases: Phase[] = [];
  let cause: Cause = "start";
  let phaseDirty = false;
  let renovationInfo: RenovationInfo | null = null;
  let exchangeInfo: ExchangeInfo | null = null;

  const unitsAt = (t: number) => {
    const year = Math.floor(t / 12);
    const given = inp.units[year - firstYear];
    if (given === null || given === undefined) return null;
    return given / Math.max(1, overlap(start, end, year * 12, year * 12 + 12));
  };

  const newPhase = (t0: number): Phase => {
    const months = Math.max(0, end - t0);
    const depreciable = Math.max(0, round2(carrying() - residual));
    const unitsLeft = Math.max(0, unitsTotal - unitsUsed);
    const { charges, units, blocks } = monthlyCharges(method, carrying(), residual, months, { t0, ddbRate, unitsLeft, unitsAt });
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
      method,
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

  /** IAS 16.39–40 with the elimination method: accumulated depreciation is closed against the gross amount. */
  /**
   * IAS 16.39–40: an increase first reverses a decrease recognised earlier in
   * profit or loss, the rest goes to the surplus; a decrease first reduces
   * the surplus, the rest goes to profit or loss.
   */
  const splitRevaluation = (diff: number, reserve: number, losses: number) => {
    let pl = 0;
    let oci = 0;
    if (diff > 0) {
      pl = Math.min(diff, losses);
      oci = round2(diff - pl);
    } else if (diff < 0) {
      oci = -Math.min(-diff, reserve);
      pl = round2(diff - oci);
    }
    return { pl, oci, losses: round2(losses - pl) };
  };

  /**
   * The profit-or-loss part of a revaluation, as its own entry against an impairment
   * allowance: a loss credits the allowance, a later reversal debits it first.
   */
  const allowanceEntry = (pl: number, part: string): Booking["split"] =>
    pl === 0
      ? undefined
      : pl < 0
        ? {
            narrative: `ירידה בשווי${part} מעבר ליתרת הקרן — הפסד מהערכה מחדש והפרשה בגינו`,
            lines: [
              [`הפסד מהערכה מחדש${part} (רווח או הפסד)`, -pl],
              [`הפרשה בגין הפסדי הערכה מחדש${part}`, pl],
            ],
          }
        : {
            narrative: `עלייה בשווי${part} שמבטלת הפסד מהערכה מחדש שהוכר קודם ברווח או הפסד`,
            lines: [
              [`הפרשה בגין הפסדי הערכה מחדש${part}`, pl],
              [`ביטול הפסד מהערכה מחדש${part} (רווח או הפסד)`, -pl],
            ],
          };

  /**
   * The fair value is split between land and building — by the land's value
   * or share given for that date, else by its share at acquisition — and
   * each part is revalued on its own.
   */
  const revalue = (rv: Revaluation, t: number) => {
    const given = rv.land;
    const share = given?.share ?? inp.land?.share ?? 0;
    const landValue = given?.amount !== undefined ? given.amount : round2(rv.value * share);
    const value = round2(rv.value - landValue);
    const part = inp.land ? " — מבנה" : "";
    const source = given?.amount !== undefined ? "שווי הקרקע שנקבע לתאריך זה" : given?.share !== undefined ? "חלק הקרקע שנקבע לתאריך זה" : "חלק הקרקע ברכישה";
    const splitWorking: Working[] = inp.land
      ? [
          {
            label: `פיצול השווי ההוגן ליום ${fmtDate(rv.date)} — לפי ${source}`,
            equation:
              given?.amount !== undefined
                ? { lhs: "שווי הוגן — מבנה", abstract: ["שווי הוגן כולל", "−", "שווי הוגן של הקרקע"], numeric: [plain(rv.value), "−", plain(landValue)], result: value }
                : { lhs: "שווי הוגן — מבנה", abstract: ["שווי הוגן כולל", "×", "(1 − חלק הקרקע)"], numeric: [plain(rv.value), "×", `(1 − ${percent(share)})`], result: value },
          },
        ]
      : [];

    const before = carrying();
    const diff = round2(value - before);
    const building = splitRevaluation(diff, surplus, revaluationLosses);
    revaluationLosses = building.losses;
    const eliminated = acc;
    // `gross` stays net of the allowance (it is what depreciates); the asset account itself moves only
    // by the surplus part, and the profit-or-loss part goes to the allowance in a separate entry.
    const lines: [string, number][] = [
      ["פחת שנצבר", acc],
      [`רכוש קבוע${part}`, round2(value - gross - building.pl)],
      [`קרן הערכה מחדש${part} (רווח כולל אחר)`, -building.oci],
    ];
    surplus = round2(surplus + building.oci);
    gross = value;
    acc = 0;
    bookings.push({
      t,
      side: t % 12 === 0 ? "close" : "open",
      kind: "revaluation",
      when: fmtDate(rv.date),
      narrative: `הערכה מחדש${part} לשווי הוגן ${fmt(value)} (יתרה בספרים לפני: ${fmt(before)})`,
      reference: "IAS 16.31, 35(ב), 39–40",
      lines,
      split: allowanceEntry(building.pl, part),
      pl: building.pl,
      oci: building.oci,
      addition: 0,
      revaluation: diff,
      disposal: 0,
      working: [
        ...splitWorking,
        {
          label: `הערכה מחדש${part} ליום ${fmtDate(rv.date)}`,
          equation: { lhs: `הפרש שערוך${part}`, abstract: ["שווי הוגן", "−", "יתרה בספרים"], numeric: [plain(value), "−", plain(before)], result: diff },
        },
        ...(building.pl !== 0 ? [{ label: building.pl > 0 ? "ביטול ירידה שהוכרה קודם ברווח או הפסד" : "ירידה מעבר ליתרת הקרן — לרווח או הפסד", amount: building.pl }] : []),
        ...(building.oci !== 0 ? [{ label: building.oci > 0 ? "עלייה — לקרן הערכה מחדש (רווח כולל אחר)" : "ירידה — מקטינה את קרן ההערכה מחדש", amount: building.oci }] : []),
        { label: "שיטת הביטול: הפחת שנצבר מבוטל כנגד העלות, והנכס מוצג בשווי ההוגן", formula: `פחת שנצבר מבוטל: ${fmt(eliminated)}` },
      ],
    });

    if (inp.land) {
      const landBefore = land;
      const landDiff = round2(landValue - landBefore);
      const landSplit = splitRevaluation(landDiff, landSurplus, landLosses);
      landLosses = landSplit.losses;
      landSurplus = round2(landSurplus + landSplit.oci);
      land = landValue;
      bookings.push({
        t,
        side: t % 12 === 0 ? "close" : "open",
        kind: "landRevaluation",
        when: fmtDate(rv.date),
        narrative: `הערכה מחדש — קרקע לשווי הוגן ${fmt(landValue)} (יתרה בספרים לפני: ${fmt(landBefore)})`,
        reference: "IAS 16.39–40, 58",
        // The surplus part adjusts the land itself; the profit-or-loss part is a separate entry against
        // an impairment allowance, which a later increase reverses first (IAS 16.39–40).
        lines: [
          ["קרקע", landSplit.oci],
          ["קרן הערכה מחדש — קרקע (רווח כולל אחר)", -landSplit.oci],
        ],
        split: allowanceEntry(landSplit.pl, " — קרקע"),
        pl: landSplit.pl,
        oci: landSplit.oci,
        addition: 0,
        revaluation: 0,
        disposal: 0,
        landRevaluation: landDiff,
        working: [
          {
            label: `הערכה מחדש — קרקע ליום ${fmtDate(rv.date)} (הקרקע אינה מופחתת, ולכן אין פחת שנצבר לבטל)`,
            equation: {
              lhs: "הפרש שערוך — קרקע",
              abstract: [given?.amount !== undefined ? "שווי הוגן של הקרקע" : "שווי הוגן כולל × חלק הקרקע", "−", "יתרה בספרים של הקרקע"],
              numeric: [given?.amount !== undefined ? plain(landValue) : `${plain(rv.value)} × ${percent(share)}`, "−", plain(landBefore)],
              result: landDiff,
            },
          },
          ...(landSplit.pl !== 0 ? [{ label: landSplit.pl > 0 ? "קרקע: ביטול ירידה קודמת — לרווח או הפסד" : "קרקע: ירידה מעבר לקרן — לרווח או הפסד", amount: landSplit.pl }] : []),
          ...(landSplit.oci !== 0 ? [{ label: landSplit.oci > 0 ? "קרקע: עלייה — לקרן הערכה מחדש בגין הקרקע (ללא העברה שוטפת לעודפים)" : "קרקע: ירידה — מקטינה את הקרן", amount: landSplit.oci }] : []),
        ],
      });
    }
    cause = "revaluation";
    phaseDirty = true;
  };

  const renovate = (r: Renovation, t: number) => {
    const carryingBefore = carrying();
    const remainingBefore = end - t;
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
      revaluation: 0,
      disposal: 0,
      working: [
        {
          label: `שיפוץ ביום ${fmtDate(r.date)} — יתרה בספרים ערב השיפוץ (${dayBefore(t)}): ${fmt(carryingBefore)}`,
          equation: {
            lhs: "בסיס פחת חדש",
            abstract: ["(", "יתרה בספרים ערב השיפוץ", "+", "עלות השיפוץ", ")", "−", "גרט מתוקן"],
            numeric: ["(", plain(carryingBefore), "+", plain(r.cost), ")", "−", plain(r.residual)],
            result: round2(carrying() - r.residual),
          },
        },
        {
          label: "יתרת אורך החיים ממועד השיפוץ",
          equation: {
            lhs: "יתרת אורך חיים (חודשים)",
            abstract: ["יתרה לפי האומדן המקורי", "+", "שינוי באורך החיים"],
            numeric: [String(remainingBefore), "+", String(r.extension)],
            result: end - t,
            unit: "number",
          },
        },
      ],
    });
    cause = "renovation";
    phaseDirty = true;
  };

  const exchangeAt = (e: Exchange, t: number) => {
    // The whole asset leaves the books: building and land.
    const before = round2(carrying() + land);
    let newCost: number;
    let gain: number;
    let costEquation: Pick<Equation, "abstract" | "numeric">;
    const cash: MathExpr[] = [
      ...(e.paid ? ["+", plain(e.paid)] : []),
      ...(e.received ? ["−", plain(e.received)] : []),
    ];
    const cashWords: MathExpr[] = [...(e.paid ? ["+", "מזומן ששולם"] : []), ...(e.received ? ["−", "מזומן שהתקבל"] : [])];
    if (!e.commercial) {
      newCost = round2(before + e.paid - e.received);
      gain = 0;
      costEquation = { abstract: ["יתרה בספרים של הנכס שנמסר", ...cashWords], numeric: [plain(before), ...cash] };
    } else if (e.basis === "given") {
      newCost = round2(e.fvGiven + e.paid - e.received);
      gain = round2(e.fvGiven - before);
      costEquation = { abstract: ["שווי הוגן של הנכס שנמסר", ...cashWords], numeric: [plain(e.fvGiven), ...cash] };
    } else {
      newCost = e.fvReceived;
      gain = round2(e.fvReceived - e.paid + e.received - before);
      costEquation = { abstract: ["שווי הוגן של הנכס שהתקבל"], numeric: [plain(e.fvReceived)] };
    }
    // At a year end the exchange closes that year; mid-year it opens the rest of the year for the asset received.
    const side = t % 12 === 0 ? "close" : "open";
    bookings.push({
      t,
      side,
      kind: "exchange",
      when: fmtDate(e.date),
      narrative: e.commercial ? "החלפת נכס — עסקה בעלת מהות מסחרית" : "החלפת נכס — ללא מהות מסחרית (לפי היתרה בספרים)",
      reference: e.commercial ? "IAS 16.24–26, 68, 71" : "IAS 16.24",
      lines: [
        ["רכוש קבוע — הנכס שהתקבל", newCost],
        ["פחת שנצבר", acc],
        ["מזומנים", round2(e.received - e.paid)],
        [inp.land ? "רכוש קבוע — מבנה שנמסר" : "רכוש קבוע — הנכס שנמסר", -round2(gross + revaluationLosses)],
        [`הפרשה בגין הפסדי הערכה מחדש${inp.land ? " — מבנה" : ""}`, revaluationLosses],
        ["קרקע שנמסרה", -round2(land + landLosses)],
        ["הפרשה בגין הפסדי הערכה מחדש — קרקע", landLosses],
        [gain >= 0 ? "רווח מהחלפת רכוש קבוע" : "הפסד מהחלפת רכוש קבוע", -gain],
      ],
      pl: gain,
      oci: 0,
      addition: newCost,
      revaluation: 0,
      disposal: -before,
      working: [
        {
          label: `החלפה ביום ${fmtDate(e.date)}`,
          equation: inp.land
            ? { lhs: "יתרה בספרים של הנכס שנמסר", abstract: ["עלות מבנה", "−", "פחת שנצבר", "+", "קרקע"], numeric: [plain(gross), "−", plain(acc), "+", plain(land)], result: before }
            : { lhs: "יתרה בספרים של הנכס שנמסר", abstract: ["עלות", "−", "פחת שנצבר"], numeric: [plain(gross), "−", plain(acc)], result: before },
        },
        { label: "עלות הנכס שהתקבל", equation: { lhs: "עלות הנכס החדש", ...costEquation, result: newCost } },
        e.commercial
          ? {
              label: gain >= 0 ? "רווח מההחלפה" : "הפסד מההחלפה",
              equation: {
                lhs: "רווח (הפסד)",
                abstract: e.basis === "given" ? ["שווי הוגן של הנכס שנמסר", "−", "יתרה בספרים"] : ["עלות הנכס החדש", ...invert(cashWords), "−", "יתרה בספרים"],
                numeric: e.basis === "given" ? [plain(e.fvGiven), "−", plain(before)] : [plain(e.fvReceived), ...invert(cash), "−", plain(before)],
                result: gain,
              },
            }
          : { label: "ללא מהות מסחרית — לא מוכר רווח או הפסד", amount: 0 },
      ],
    });
    if (surplus > 0 || landSurplus > 0) {
      bookings.push({
        t,
        side,
        kind: "surplus",
        when: fmtDate(e.date),
        narrative: "העברת יתרת קרן ההערכה מחדש לעודפים בעת הגריעה",
        reference: "IAS 16.41",
        lines: [
          [inp.land ? "קרן הערכה מחדש — מבנה" : "קרן הערכה מחדש", surplus],
          ["קרן הערכה מחדש — קרקע", landSurplus],
          ["עודפים", -round2(surplus + landSurplus)],
        ],
        pl: 0,
        oci: 0,
        addition: 0,
        revaluation: 0,
        disposal: 0,
        working: [{ label: "יתרת קרן ההערכה מחדש מועברת לעודפים בגריעה", amount: round2(surplus + landSurplus) }],
      });
    }
    exchangeInfo = { t, carrying: before, newCost, gain };
    // The asset received takes the old one's place in the schedule.
    gross = newCost;
    acc = 0;
    surplus = 0;
    land = 0;
    landSurplus = 0;
    landLosses = 0;
    revaluationLosses = 0;
    residual = e.newResidual;
    oldEnd = end;
    end = t + e.newLife;
    ddbRate = 24 / e.newLife;
    if (method === "units") method = "straight-line";
    exchanged = true;
    cause = "exchange";
    phaseDirty = true;
  };

  // Fair values are the old asset's: none apply after the exchange.
  const revaluationsAt = (t: number) => (exchanged ? [] : inp.revaluations.filter((rv) => rv.at === t && t > start && t < end));

  let phase = newPhase(start);
  for (let t = start; ; t++) {
    // Year-end revaluations close the year that ends at t, before its balances are taken.
    if (t % 12 === 0 && t <= stopAt()) revaluationsAt(t).forEach((rv) => revalue(rv, t));
    if (exchange && !exchanged && t === exchange.at) {
      // A mid-year revaluation on the exchange date still applies to the asset given up.
      if (t % 12 !== 0) revaluationsAt(t).forEach((rv) => revalue(rv, t));
      exchangeAt(exchange, t);
    }
    closing.set(t, { gross, acc, building: carrying(), surplus, land, landSurplus, landAllowance: landLosses, buildingAllowance: revaluationLosses, carrying: round2(carrying() + land) });
    if (t >= stopAt()) break;
    if (t % 12 !== 0) revaluationsAt(t).forEach((rv) => revalue(rv, t));
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
        // The share of the surplus realised through use: in proportion to the depreciation charged.
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
    /** End of the original asset's (possibly revised) life; `stop` is where the schedule ends. */
    end: oldEnd ?? end,
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

/** "+ a − b" becomes "− a + b": moves cash from the cost side to the consideration side. */
const invert = (xs: MathExpr[]) => xs.map((x) => (x === "+" ? "−" : x === "−" ? "+" : x));

/** Errors that need the parsed inputs or the simulated run, keyed by field id. */
export function timelineErrors(v: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  const inp = parseInputs(v);
  const originalEnd = inp.start + inp.lifeMonths;
  if (inp.lifeMonths < 1) errors.usefulLife = "אורך החיים חייב להיות לפחות חודש אחד.";
  if (inp.land && inp.land.cost >= inp.cost) {
    errors[str(v, "landBasis") === "percent" ? "landPercent" : "landAmount"] = "מרכיב הקרקע חייב להיות קטן מעלות הנכס הכוללת.";
  } else if (inp.residual >= inp.buildingCost) {
    errors.residual = inp.land ? `ערך השייר חייב להיות נמוך מעלות המבנה (${fmt(inp.buildingCost)}).` : "ערך השייר חייב להיות נמוך מעלות הנכס.";
  }
  if (monthIndex(str(v, "calcEnd")) <= monthIndex(str(v, "calcStart"))) {
    errors.calcEnd = "תאריך סיום החישוב חייב להיות אחרי תאריך ההתחלה.";
  }
  if (bool(v, "hasEvents") && !inp.renovation && !inp.exchange && !(inp.revaluation && bool(v, "revalue"))) {
    errors.hasEvents = "סמנו לפחות אירוע אחד, או ענו \"לא\".";
  }
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
  if (inp.revaluations.some((rv) => rv.at <= inp.start)) errors.fairValues = "כל מועדי ההערכה חייבים להיות אחרי מועד הזמינות לשימוש.";
  if (inp.land && inp.revaluations.length > 0) {
    const notes = datedValues(v, "fairValues").map((r) => ({ value: r.value, land: parseLandPart(r.note) }));
    if (notes.some((n) => n.land === null)) errors.fairValues = "בעמודת הקרקע יש להזין אחוז (למשל 35%) או סכום (למשל 500000).";
    else if (notes.some((n) => (n.land?.share ?? 0) >= 1 || (n.land?.amount ?? 0) >= n.value)) {
      errors.fairValues = "חלק הקרקע חייב להיות קטן מהשווי ההוגן הכולל באותו תאריך.";
    }
  }
  if (Object.keys(errors).length > 0) return errors;

  const r = run(inp);
  if (inp.revaluations.some((rv) => rv.at >= r.end || (inp.exchange && rv.at > inp.exchange.at))) {
    errors.fairValues = `מועד הערכה אחרי תום אורך החיים (${dayBefore(r.end)})${inp.exchange ? " או אחרי ההחלפה" : ""}.`;
  }
  if (r.renovationInfo && inp.renovation!.residual >= r.renovationInfo.newBase) {
    errors.revisedResidual = `ערך השייר המתוקן חייב להיות נמוך מהיתרה בספרים לאחר השיפוץ (${fmt(r.renovationInfo.newBase)}).`;
  }
  if (r.exchangeInfo && r.exchangeInfo.newCost < 0) {
    errors.cashAmount = "המזומן שהתקבל עולה על היתרה בספרים של הנכס שנמסר; העלות של הנכס שהתקבל אינה יכולה להיות שלילית.";
  }
  const viewStart = Math.max(monthIndex(str(v, "calcStart")), r.start);
  const viewEnd = Math.min(monthIndex(str(v, "calcEnd")), r.stop);
  if (viewEnd <= viewStart && !errors.calcEnd) errors.calcStart = "טווח החישוב אינו חופף לתקופה שבה הנכס בשימוש.";
  return errors;
}

export const sumRange = (m: Map<number, number>, from: number, to: number) => {
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

export const frac = (top: MathExpr, bottom: MathExpr): MathExpr => ({ over: [top, bottom] });

export function solveTimeline(v: Values): Solution {
  const inp = parseInputs(v);
  const { method, revaluation } = inp;
  const label = METHOD_LABEL[method];
  const r = run(inp);
  const periods = periodsOf(r, monthIndex(str(v, "calcStart")), monthIndex(str(v, "calcEnd")));
  const viewStart = periods[0].a;
  const viewEnd = periods.at(-1)!.b;
  const ren = r.renovationInfo;
  const ex = r.exchangeInfo;
  const lifeText = `${plain(round2(inp.lifeMonths / 12))} שנים`;
  const depreciable = round2(inp.buildingCost - inp.residual);
  const hasRevaluation = r.bookings.some((b) => b.kind === "revaluation");
  const exchangeBooking = r.bookings.find((b) => b.kind === "exchange");
  const hasLand = !!inp.land;
  const landShare = percent(inp.land?.share ?? 0);
  const part = hasLand ? " — מבנה" : "";

  // ---- schedule ------------------------------------------------------------
  const rows: ScheduleRow[] = periods.map((p) => {
    const open = r.closing.get(p.a)!;
    const close = r.closing.get(p.b)!;
    const books = r.bookings.filter((bk) => inPeriod(bk, p));
    const total = (key: "addition" | "revaluation" | "disposal") => round2(sum(books.map((bk) => bk[key])));
    const events = books.filter((bk) => bk.kind !== "surplus").map((bk) => `${bk.when} ${EVENT_LABEL[bk.kind]}`);
    if (p.b === r.stop) events.push(`תום אורך החיים${ex ? " של הנכס שהתקבל" : ""} ${dayBefore(r.stop)}`);
    return {
      year: p.year,
      period: p.label,
      months: p.b - p.a,
      opening: open.carrying,
      additions: total("addition"),
      before: ren ? sumRange(r.depBy, p.a, Math.min(p.b, ren.t)) : null,
      after: ren ? sumRange(r.depBy, Math.max(p.a, ren.t), Math.min(p.b, ex?.t ?? p.b)) : null,
      total: sumRange(r.depBy, p.a, p.b),
      revaluation: total("revaluation"),
      landRevaluation: round2(sum(books.map((bk) => bk.landRevaluation ?? 0))),
      disposal: total("disposal"),
      gross: close.gross,
      accumulated: close.acc,
      building: close.building,
      land: close.land,
      landAllowance: close.landAllowance,
      buildingAllowance: close.buildingAllowance,
      carrying: close.carrying,
      surplus: close.surplus,
      landSurplus: close.landSurplus,
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
  const book = (bk: Booking) => {
    // A revaluation that goes wholly to profit or loss leaves the main entry empty; post only the split.
    if (bk.lines.some(([, amount]) => round2(amount) !== 0)) {
      post({ ...entry(`${bk.kind}-${bk.t}`, bk.when, bk.narrative, bk.lines), reference: bk.reference });
    }
    if (bk.split) post({ ...entry(`${bk.kind}-${bk.t}-pl`, bk.when, bk.split.narrative, bk.split.lines), reference: bk.reference });
  };
  const depreciation = (from: number, to: number, when: string, narrative: string) => {
    const amount = sumRange(r.depBy, from, to);
    if (amount <= 0) return;
    post({
      ...entry(`dep-${from}-${to}`, when, `${narrative} (${to - from} חודשים, ${METHOD_LABEL[r.phases.findLast((ph) => ph.t0 <= from)!.method]})`, [
        ["הוצאות פחת", amount],
        ["פחת שנצבר", -amount],
      ]),
      reference: "IAS 16.48, 50",
    });
  };
  const transferEntry = (from: number, to: number, when: string) => {
    const transfer = sumRange(r.transferBy, from, to);
    if (transfer <= 0) return;
    post({
      ...entry(`transfer-${from}-${to}`, when, "העברה מקרן ההערכה מחדש לעודפים (החלק שמומש בשימוש)", [
        [`קרן הערכה מחדש${part}`, transfer],
        ["עודפים", -transfer],
      ]),
      reference: "IAS 16.41",
    });
  };
  if (viewStart === r.start) {
    post({
      ...entry("acquisition", fmtDate(inp.startDate), `הכרה לראשונה לפי עלות (מחיר רכישה ועלויות המיוחסות במישרין)${hasLand ? " — קרקע ומבנה בנפרד" : ""}`, [
        [hasLand ? "רכוש קבוע — מבנה" : "רכוש קבוע", inp.buildingCost],
        ["קרקע", inp.land?.cost ?? 0],
        ["מזומנים / ספקים", -inp.cost],
      ]),
      reference: hasLand ? "IAS 16.7, 15–17, 58" : "IAS 16.7, 15–17",
    });
  }
  for (const [i, p] of periods.entries()) {
    bucket = journalByPeriod[i];
    const books = r.bookings.filter((bk) => inPeriod(bk, p));
    let cursor = p.a;
    // A mid-year event closes the depreciation (and surplus transfer) up to its date.
    for (const bk of books.filter((b) => b.side === "open")) {
      if (bk.t > cursor) {
        depreciation(cursor, bk.t, dayBefore(bk.t), `פחת עד מועד ה${EVENT_LABEL[bk.kind]}`);
        transferEntry(cursor, bk.t, dayBefore(bk.t));
      }
      book(bk);
      cursor = bk.t;
    }
    const exchangeAtEnd = books.some((b) => b.kind === "exchange" && b.side === "close");
    depreciation(cursor, p.b, dayBefore(p.b), exchangeAtEnd ? "פחת עד מועד ההחלפה" : ex && cursor >= ex.t ? "פחת לתקופה — הנכס שהתקבל בהחלפה" : "פחת לתקופה");
    transferEntry(cursor, p.b, dayBefore(p.b));
    books.filter((b) => b.side === "close").forEach(book);
  }

  // ---- financial statements -------------------------------------------------
  const byYear = (key: string, sign = 1) => Object.fromEntries(rows.map((row) => [`y${row.year}`, round2(sign * Number(row[key] ?? 0))]));
  const yearColumns = periods.map((p) => ({ key: `y${p.year}`, label: dayBefore(p.b) }));
  const bookedIn = (p: Period, kind: Booking["kind"], field: "pl" | "oci") =>
    round2(sum(r.bookings.filter((bk) => bk.kind === kind && inPeriod(bk, p)).map((bk) => bk[field])));
  const plBy = (kind: Booking["kind"], field: "pl" | "oci") => Object.fromEntries(periods.map((p) => [`y${p.year}`, bookedIn(p, kind, field)]));
  const depRow = byYear("total", -1);
  const revaluationPlRow = plBy("revaluation", "pl");
  const landPlRow = plBy("landRevaluation", "pl");
  const exchangeRow = plBy("exchange", "pl");
  const ociRow = plBy("revaluation", "oci");
  const landOciRow = plBy("landRevaluation", "oci");
  const plTotal = Object.fromEntries(
    periods.map((p) => {
      const k = `y${p.year}`;
      return [k, round2(depRow[k] + revaluationPlRow[k] + landPlRow[k] + exchangeRow[k])];
    }),
  );
  const landLosses = hasLand && periods.some((p) => landPlRow[`y${p.year}`] !== 0);

  const buildingAllowanceEver = rows.some((row) => Number(row.buildingAllowance) > 0);
  const landAllowanceEver = hasLand && rows.some((row) => Number(row.landAllowance) > 0);
  const balanceRows: ScheduleRow[] = [
    ...(landAllowanceEver
      ? [
          { item: "קרקע — עלות / שווי משוערך", ...Object.fromEntries(rows.map((row) => [`y${row.year}`, round2(Number(row.land) + Number(row.landAllowance))])) },
          { item: "בניכוי הפרשה בגין הפסדי הערכה מחדש — קרקע", ...byYear("landAllowance", -1) },
          { item: "קרקע, נטו (אינה מופחתת)", ...byYear("land"), _emphasis: "subtotal" },
        ]
      : hasLand
        ? [{ item: "קרקע (אינה מופחתת)", ...byYear("land") }]
        : []),
    {
      item: `${hasLand ? "מבנה — " : ""}${revaluation ? "עלות / סכום משוערך" : "עלות"}`,
      ...Object.fromEntries(rows.map((row) => [`y${row.year}`, round2(Number(row.gross) + Number(row.buildingAllowance))])),
    },
    { item: "בניכוי פחת שנצבר", ...byYear("accumulated", -1) },
    ...(buildingAllowanceEver ? [{ item: `בניכוי הפרשה בגין הפסדי הערכה מחדש${part}`, ...byYear("buildingAllowance", -1) }] : []),
    ...(hasLand ? [{ item: "מבנה, נטו", ...byYear("building"), _emphasis: "subtotal" }] : []),
    { item: "רכוש קבוע, נטו (יתרה בספרים)", ...byYear("carrying"), _emphasis: "total" },
    ...(revaluation ? [{ item: `קרן הערכה מחדש${part} (הון)`, ...byYear("surplus"), _emphasis: "subtotal" }] : []),
    ...(revaluation && hasLand ? [{ item: "קרן הערכה מחדש — קרקע (הון)", ...byYear("landSurplus"), _emphasis: "subtotal" }] : []),
  ];
  const plRows: ScheduleRow[] = [
    { item: "הוצאות פחת", ...depRow },
    ...(hasRevaluation ? [{ item: `הפסד מהערכה מחדש${part} / ביטולו`, ...revaluationPlRow }] : []),
    ...(landLosses ? [{ item: "הפסד מהערכה מחדש — קרקע / ביטולו", ...landPlRow }] : []),
    ...(ex ? [{ item: "רווח (הפסד) מהחלפת רכוש קבוע", ...exchangeRow }] : []),
    { item: "סך ההשפעה על הרווח או ההפסד", ...plTotal, _emphasis: "total" },
    ...(revaluation ? [{ item: `רווח כולל אחר — שינוי בקרן הערכה מחדש${part}`, ...ociRow, _emphasis: "subtotal" }] : []),
    ...(revaluation && hasLand ? [{ item: "רווח כולל אחר — קרן הערכה מחדש — קרקע", ...landOciRow, _emphasis: "subtotal" }] : []),
  ];

  // ---- year by year --------------------------------------------------------
  const phaseEnd = (i: number) => r.phases[i + 1]?.t0 ?? r.stop;
  const phaseAt = (t: number) => r.phases.findLast((ph) => ph.t0 <= t)!;
  const years = (n: number) => plain(round2(n / 12));
  /** Balances at month t, after any event that starts a phase there. */
  const stateAt = (ph: Phase, t: number) => (t === ph.t0 ? { carrying: ph.carrying, surplus: ph.surplus } : { carrying: r.closing.get(t)!.building, surplus: r.closing.get(t)!.surplus });

  /** The depreciation of months [a, b), as equations: phase by phase and asset-year by asset-year. */
  const depreciationWorkings = (a: number, b: number): Working[] => {
    const out: Working[] = [];
    r.phases.forEach((ph, i) => {
      const s = Math.max(a, ph.t0);
      const e = Math.min(b, phaseEnd(i));
      if (e <= s) return;
      const span = `${monthLabel(s)}–${monthLabel(e - 1)}`;
      const R = plain(ph.residual);
      if (ph.method === "straight-line") {
        const remaining = ph.t0 + ph.months - s;
        out.push({
          label: `פחת ${span} (${e - s} חודשים)`,
          equation: {
            lhs: "פחת תקופתי",
            abstract: [frac("עלות בספרים − ערך גרט", "יתרת אורך חיים (חודשים)"), "×", "חודשי שימוש"],
            numeric: [frac(`${plain(stateAt(ph, s).carrying)} − ${R}`, String(remaining)), "×", String(e - s)],
            result: sumRange(r.depBy, s, e),
          },
        });
      } else if (ph.method === "units") {
        const used = round2(sum(ph.units.slice(s - ph.t0, e - ph.t0)));
        out.push({
          label: `פחת ${span} (${plain(used)} יחידות)`,
          equation: {
            lhs: "פחת תקופתי",
            abstract: [frac("עלות בספרים − ערך גרט", "יתרת יחידות צפויות"), "×", "יחידות שהופקו"],
            numeric: [frac(`${plain(ph.carrying)} − ${R}`, plain(ph.unitsLeft)), "×", plain(used)],
            result: sumRange(r.depBy, s, e),
          },
        });
      } else {
        for (const bl of ph.blocks) {
          const bs = ph.t0 + bl.from;
          const be = bs + bl.length;
          const share = overlap(bs, be, s, e);
          if (!share) continue;
          const equation: Equation =
            ph.method === "sum-of-years"
              ? {
                  lhs: "פחת תקופתי",
                  abstract: ["(עלות בספרים − ערך גרט)", "×", frac("משקל שנת הנכס", "סכום הספרות"), "×", frac("חודשי שימוש", "חודשי שנת הנכס")],
                  numeric: [`(${plain(ph.carrying)} − ${R})`, "×", frac(plain(bl.weight!), plain(ph.digits)), "×", frac(String(share), String(bl.length))],
                  result: round2((bl.amount * share) / bl.length),
                }
              : bl.switched
                ? {
                    lhs: "פחת תקופתי",
                    abstract: [frac("יתרה בתחילת שנת הנכס − ערך גרט", "יתרת אורך חיים (חודשים)"), "×", "חודשי שימוש"],
                    numeric: [frac(`${plain(bl.opening!)} − ${R}`, String(bl.left)), "×", String(share)],
                    result: round2((bl.amount * share) / bl.length),
                  }
                : {
                    lhs: "פחת תקופתי",
                    abstract: ["יתרה בתחילת שנת הנכס", "×", "שיעור פחת", "×", frac("חודשי שימוש", "12")],
                    numeric: [plain(bl.opening!), "×", percent(ph.ddbRate), "×", frac(String(share), "12")],
                    result: round2((bl.amount * share) / bl.length),
                  };
          out.push({ label: `שנת נכס ${monthLabel(bs)}–${monthLabel(be - 1)} · ${share} מתוך ${bl.length} חודשים`, equation });
        }
      }
    });
    return out;
  };

  /** The surplus released to retained earnings in months [a, b), as equations. */
  const transferWorkings = (a: number, b: number): Working[] => {
    const out: Working[] = [];
    r.phases.forEach((ph, i) => {
      const s = Math.max(a, ph.t0);
      const e = Math.min(b, phaseEnd(i));
      const transfer = e > s ? sumRange(r.transferBy, s, e) : 0;
      if (transfer <= 0) return;
      const { carrying, surplus } = stateAt(ph, s);
      const remaining = ph.t0 + ph.months - s;
      if (ph.method === "straight-line") {
        const monthly = round2(surplus / remaining);
        out.push(
          {
            label: `העברה לעודפים ${monthLabel(s)}–${monthLabel(e - 1)}`,
            equation: {
              lhs: "העברה חודשית לעודפים",
              abstract: frac("יתרת קרן הערכה מחדש", "יתרת אורך חיים בחודשים"),
              numeric: frac(plain(surplus), String(remaining)),
              result: monthly,
            },
          },
          {
            // Not "monthly × months": the monthly figure is rounded, the period one is not.
            label: "העברה לתקופה",
            equation: {
              lhs: "העברה לעודפים",
              abstract: frac("יתרת קרן הערכה מחדש × חודשי שימוש", "יתרת אורך חיים בחודשים"),
              numeric: frac(`${plain(surplus)} × ${e - s}`, String(remaining)),
              result: transfer,
            },
          },
        );
      } else {
        out.push({
          label: `העברה לעודפים ${monthLabel(s)}–${monthLabel(e - 1)} — בקצב הפחת`,
          equation: {
            lhs: "העברה לעודפים",
            abstract: ["יתרת קרן הערכה מחדש", "×", frac("פחת התקופה", "יתרה בספרים − ערך גרט")],
            numeric: [plain(surplus), "×", frac(plain(sumRange(r.depBy, s, e)), `${plain(carrying)} − ${plain(ph.residual)}`)],
            result: transfer,
          },
        });
      }
    });
    return out;
  };

  const historical = revaluation ? run({ ...inp, revaluations: [] }) : null;

  /** What carries the calculation into the period after p. */
  const nextSteps = (p: Period): Guidance[] => {
    const t = p.b;
    const ph = phaseAt(t);
    const phaseOver = t >= ph.t0 + ph.months;
    if (t >= r.stop || phaseOver) {
      const lifeEnd = r.stop > ph.t0 + ph.months ? ph.t0 + ph.months : r.stop;
      return [
        {
          title: ph.cause === "exchange" ? "הנכס שהתקבל הופחת במלואו" : "הנכס הופחת במלואו",
          body: `אורך החיים הסתיים ב-${dayBefore(lifeEnd)}. הנכס מופחת עד ערך השייר (${fmt(ph.residual)}) ואין פחת נוסף; הוא נשאר בספרים עד ${ex && t < ex.t ? `ההחלפה ב-${fmtDate(inp.exchange!.date)}` : "לגריעתו"}.`,
          reference: "IAS 16.55, 67",
        },
      ];
    }
    const nextYear = Math.floor(t / 12);
    const nextEnd = Math.min((nextYear + 1) * 12, r.stop);
    const nextDep = sumRange(r.depBy, t, nextEnd);
    const open = r.closing.get(t)!;
    const remaining = ph.t0 + ph.months - t;
    const out: Guidance[] = [];
    const amountLine = `פחת לשנת ${nextYear}${nextEnd - t < 12 ? ` (${nextEnd - t} חודשים)` : ""}: ${fmt(nextDep)}.`;

    let formula: string;
    if (ph.method === "straight-line") {
      const annual = fmt(round2((ph.depreciable / ph.months) * 12));
      formula =
        ph.cause === "exchange"
          ? `הנכס שהתקבל בהחלפה: (עלות ${fmt(ph.carrying)} − גרט ${fmt(ph.residual)}) ÷ אורך החיים שלו ${years(ph.months)} שנים = ${annual} לשנה${method === "units" ? " (בקו ישר — אין נתוני תפוקה לנכס החדש)" : ""}.`
          : ph.cause === "start"
          ? `ללא שינוי אומדן שתי הדרכים שקולות: (עלות מקורית${part} ${fmt(inp.buildingCost)} − גרט ${fmt(inp.residual)}) ÷ ${years(inp.lifeMonths)} שנות חיים = ${annual} לשנה; או (עלות מופחתת${part} בתחילת השנה ${fmt(open.building)} − גרט ${fmt(ph.residual)}) ÷ יתרת אורך חיים ${years(remaining)} שנים = ${annual}.`
          : ph.cause === "renovation"
            ? `(יתרה בספרים ערב השיפוץ ${fmt(ren!.carryingBefore)} + עלות השיפוץ ${fmt(inp.renovation!.cost)} − גרט מתוקן ${fmt(ph.residual)}) ÷ יתרת אורך החיים המעודכנת ממועד השיפוץ ${years(ph.months)} שנים = ${annual} לשנה.`
            : `(השווי ההוגן החדש${part} ${fmt(ph.carrying)} − גרט ${fmt(ph.residual)}) ÷ יתרת אורך החיים ממועד ההערכה ${years(ph.months)} שנים = ${annual} לשנה.`;
    } else {
      const lead =
        ph.cause === "exchange"
          ? `הנכס שהתקבל בהחלפה: הבסיס הוא (עלות − גרט) = ${fmt(ph.depreciable)}, על פני ${years(ph.months)} שנים מיום ההחלפה.`
          : ph.cause === "renovation"
          ? `מאז השיפוץ הבסיס הוא (יתרה בספרים ערב השיפוץ + עלות השיפוץ − גרט מתוקן) = ${fmt(ph.depreciable)}, על פני ${years(ph.months)} שנים.`
          : ph.cause === "revaluation"
            ? `מאז ההערכה מחדש הבסיס הוא (שווי הוגן − גרט) = ${fmt(ph.depreciable)}, על פני ${years(ph.months)} שנים.`
            : `הבסיס הוא (עלות − גרט) = ${fmt(ph.depreciable)}.`;
      formula = `${lead} ${depreciationWorkings(t, nextEnd)
        .map((w) => `${w.label}: ${fmt(w.equation!.result)}`)
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

    if (open.landSurplus > 0) {
      out.push({
        title: "קרן הערכה מחדש — קרקע",
        body: `הקרקע אינה מופחתת, ולכן הקרן בגינה (${fmt(open.landSurplus)}) אינה מועברת לעודפים במהלך השימוש — רק בעת גריעת הנכס.`,
        reference: "IAS 16.41, 58",
      });
    }
    if (revaluation && open.surplus > 0) {
      if (inp.transferSurplus && historical) {
        const transfer = sumRange(r.transferBy, t, nextEnd);
        const histDep = sumRange(historical.depBy, t, nextEnd);
        out.push({
          title: "העברה מקרן ההערכה מחדש לעודפים",
          body: `העברה בקצב הפחת: הפרש הפחת — פחת לפי השווי המשוערך ${fmt(nextDep)} פחות פחת לפי העלות ההיסטורית ${fmt(histDep)} = ${fmt(round2(nextDep - histDep))}; או לחלופין: יתרת הקרן ${fmt(open.surplus)} ÷ יתרת אורך החיים ${remaining} חודשים × ${nextEnd - t} חודשים = ${fmt(round2((open.surplus / remaining) * (nextEnd - t)))}. המערכת מעבירה ${fmt(transfer)} (החלק היחסי של הקרן לפי הפחת שנרשם). בסוף השנה: ח׳ קרן הערכה מחדש, ז׳ עודפים — פקודה בהון, לא דרך רווח או הפסד.`,
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

  const yearSections: YearSection[] = periods.map((p, i) => {
    const row = rows[i];
    const books = r.bookings.filter((bk) => inPeriod(bk, p));
    const dep = Number(row.total);
    const transfer = Number(row.transfer);
    const workings: Working[] = [
      ...books.filter((bk) => bk.side === "open").flatMap((bk) => bk.working),
      ...(hasLand && Number(row.land) > 0 ? [{ label: `קרקע (${fmt(Number(r.closing.get(p.a)!.land))}) — אינה מופחתת; הפחת להלן הוא של המבנה בלבד (IAS 16.58)` }] : []),
      ...depreciationWorkings(p.a, p.b),
      { label: `סך הפחת${part} לשנת ${p.year}`, amount: dep },
      ...transferWorkings(p.a, p.b),
      ...(transfer > 0 ? [{ label: `סך ההעברה לעודפים בשנת ${p.year}${hasLand ? " (מקרן המבנה בלבד)" : ""}`, amount: transfer }] : []),
      ...books.filter((bk) => bk.side === "close").flatMap((bk) => bk.working),
    ];
    const landAllowance = Number(row.landAllowance);
    const buildingAllowance = Number(row.buildingAllowance);
    const balance: StatementLine[] = [
      ...(hasLand && landAllowance > 0
        ? [
            { label: "קרקע — עלות / שווי משוערך", value: round2(Number(row.land) + landAllowance) },
            { label: "בניכוי הפרשה בגין הפסדי הערכה מחדש — קרקע", value: -landAllowance },
            { label: "קרקע, נטו (אינה מופחתת)", value: Number(row.land), emphasis: "subtotal" as const },
          ]
        : hasLand
          ? [{ label: "קרקע (אינה מופחתת)", value: Number(row.land) }]
          : []),
      { label: `${hasLand ? "מבנה — " : ""}${revaluation ? "עלות / שווי הוגן משוערך" : "עלות"}`, value: round2(Number(row.gross) + buildingAllowance) },
      { label: "בניכוי פחת שנצבר", value: -Number(row.accumulated) },
      ...(buildingAllowance > 0 ? [{ label: `בניכוי הפרשה בגין הפסדי הערכה מחדש${part}`, value: -buildingAllowance }] : []),
      ...(hasLand ? [{ label: "מבנה, נטו", value: Number(row.building), emphasis: "subtotal" as const }] : []),
      { label: "יתרה בספרים (Carrying Amount)", value: Number(row.carrying), emphasis: "total" },
      ...(revaluation ? [{ label: `קרן הערכה מחדש${part} (בהון העצמי)`, value: Number(row.surplus), emphasis: "subtotal" as const }] : []),
      ...(revaluation && hasLand ? [{ label: "קרן הערכה מחדש — קרקע (בהון העצמי)", value: Number(row.landSurplus), emphasis: "subtotal" as const }] : []),
    ];
    const revaluationPl = bookedIn(p, "revaluation", "pl");
    const landPl = bookedIn(p, "landRevaluation", "pl");
    const exchangePl = bookedIn(p, "exchange", "pl");
    const oci = bookedIn(p, "revaluation", "oci");
    const landOci = bookedIn(p, "landRevaluation", "oci");
    const profitOrLoss: StatementLine[] = [
      { label: "הוצאות פחת", value: -dep },
      ...(revaluationPl ? [{ label: `${revaluationPl < 0 ? "הפסד מהערכה מחדש" : "ביטול הפסד מהערכה מחדש"}${part}`, value: revaluationPl }] : []),
      ...(landPl ? [{ label: `${landPl < 0 ? "הפסד מהערכה מחדש" : "ביטול הפסד מהערכה מחדש"} — קרקע`, value: landPl }] : []),
      ...(exchangeBooking && inPeriod(exchangeBooking, p) ? [{ label: "רווח (הפסד) ממימוש / החלפה", value: exchangePl }] : []),
      { label: "סך ההשפעה על הרווח או ההפסד", value: round2(-dep + revaluationPl + landPl + exchangePl), emphasis: "total" },
      ...(oci ? [{ label: `רווח כולל אחר — קרן הערכה מחדש${part}`, value: oci, emphasis: "subtotal" as const }] : []),
      ...(landOci ? [{ label: "רווח כולל אחר — קרן הערכה מחדש — קרקע", value: landOci, emphasis: "subtotal" as const }] : []),
    ];
    const eventNames = books.filter((bk) => bk.kind !== "surplus").map((bk) => EVENT_LABEL[bk.kind]);
    return {
      id: `y${p.year}`,
      title: `שנת ${p.year}`,
      subtitle: `${p.b - p.a} חודשים · ${monthLabel(p.a)}–${monthLabel(p.b - 1)}${eventNames.length ? ` · ${eventNames.join(", ")}` : ""}`,
      journal: journalByPeriod[i],
      workings,
      balanceDate: dayBefore(p.b),
      balance,
      profitOrLoss,
      next: nextSteps(p),
    };
  });

  // ---- method comparison ---------------------------------------------------
  const methods: PpeMethod[] = ["straight-line", "sum-of-years", "double-declining", ...(method === "units" ? (["units"] as const) : [])];
  const runs = new Map(methods.map((m) => [m, m === method ? r : run({ ...inp, method: m })]));
  const comparison: ScheduleRow[] = periods.map((p) => ({
    period: p.label,
    ...Object.fromEntries(methods.map((m) => [COMPARE_KEY[m], sumRange(runs.get(m)!.depBy, p.a, p.b)])),
    _emphasis: null,
  }));

  // ---- metrics -------------------------------------------------------------
  const metrics: Metric[] = [
    { label: "עלות במועד ההכרה", value: inp.cost, format: "currency" },
    ...(inp.land
      ? [
          { label: "מרכיב הקרקע (אינו מופחת)", value: inp.land.cost, format: "currency" as const, hint: `${landShare} מהעלות` },
          { label: "מרכיב המבנה", value: inp.buildingCost, format: "currency" as const },
        ]
      : []),
    { label: "סכום בר-פחת", value: depreciable, format: "currency", hint: `${fmt(inp.buildingCost)} − ערך שייר ${fmt(inp.residual)}` },
    { label: "פחת בטווח החישוב", value: totalDep, format: "currency", hint: `${monthLabel(viewStart)} עד ${monthLabel(viewEnd - 1)}` },
    { label: "יתרה בספרים בסוף הטווח", value: closeView.carrying, format: "currency", hint: dayBefore(viewEnd) },
  ];
  if (ren) {
    const firstYearAfter = sumRange(r.depBy, ren.t, Math.min(ren.t + 12, r.stop));
    metrics.push(
      { label: "פחת שנצבר עד השיפוץ", value: ren.depreciationBefore, format: "currency", hint: `${ren.t - r.start} חודשים` },
      { label: "יתרה בספרים במועד השיפוץ", value: ren.carryingBefore, format: "currency" },
      { label: "יתרה בספרים לאחר היוון השיפוץ", value: ren.newBase, format: "currency" },
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
  if (revaluation) metrics.push({ label: `קרן הערכה מחדש${part} בסוף הטווח`, value: closeView.surplus, format: "currency" });
  if (revaluation && hasLand) metrics.push({ label: "קרן הערכה מחדש — קרקע בסוף הטווח", value: closeView.landSurplus, format: "currency" });
  if (ex) {
    metrics.push(
      { label: "עלות הנכס שהתקבל בהחלפה", value: ex.newCost, format: "currency" },
      { label: "רווח (הפסד) מההחלפה", value: ex.gain, format: "currency", hint: `יתרה בספרים שנגרעה ${fmt(ex.carrying)}` },
    );
  }

  // ---- tables --------------------------------------------------------------
  const methodBasis =
    method === "straight-line"
      ? `${fmt(round2(depreciable / (inp.lifeMonths / 12)))} לשנה`
      : method === "sum-of-years"
        ? `סכום ספרות ${plain(round2(sum(sydWeights(inp.lifeMonths))))}`
        : method === "double-declining"
          ? `שיעור ${percent(24 / inp.lifeMonths)} מהיתרה בספרים`
          : `${fmt(round2(depreciable / Math.max(1, inp.totalUnits)))} ליחידה (${plain(inp.totalUnits)} יחידות)`;
  const scheduleColumns = [
    { key: "period", label: "תקופה", format: "text" as const },
    { key: "months", label: "חודשים", format: "number" as const },
    { key: "opening", label: "יתרה בספרים לפתיחה" },
    ...(ren || ex ? [{ key: "additions", label: ren && ex ? "תוספות (שיפוץ / נכס שהתקבל)" : ren ? "תוספות (שיפוץ)" : "תוספות (נכס שהתקבל)" }] : []),
    ...(ren ? [{ key: "before", label: "פחת — אומדן מקורי" }, { key: "after", label: "פחת — אומדן מעודכן" }] : []),
    { key: "total", label: `סך הפחת${part}` },
    ...(revaluation ? [{ key: "revaluation", label: `הערכה מחדש${part}` }] : []),
    ...(revaluation && hasLand ? [{ key: "landRevaluation", label: "הערכה מחדש — קרקע" }] : []),
    ...(ex ? [{ key: "disposal", label: "גריעה בהחלפה" }] : []),
    ...(hasLand ? [{ key: "land", label: "קרקע" }] : []),
    { key: "gross", label: `${hasLand ? "מבנה — " : ""}${revaluation ? "עלות / סכום משוערך" : "עלות"}` },
    { key: "accumulated", label: "פחת שנצבר" },
    ...(hasLand ? [{ key: "building", label: "מבנה, נטו" }] : []),
    { key: "carrying", label: "יתרה בספרים" },
    ...(revaluation ? [{ key: "surplus", label: `קרן הערכה מחדש${part}` }] : []),
    ...(revaluation && hasLand ? [{ key: "landSurplus", label: "קרן הערכה מחדש — קרקע" }] : []),
    { key: "event", label: "אירועים", format: "text" as const },
  ];
  const scheduleTotals = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, round2(sum(rows.map((row) => Number(row[k] ?? 0))))]));

  const tables: ScheduleTable[] = [
    {
      id: "cost",
      title: "עלות הנכס ובסיס הפחת",
      note: "העלות כוללת את מחיר הרכישה ועלויות המיוחסות במישרין להבאת הנכס למיקום ולמצב הדרושים להפעלתו (הובלה, התקנה, הרצה). הסכום בר-הפחת הוא העלות בניכוי ערך השייר.",
      reference: hasLand ? "IAS 16.15–17, 6, 53, 58" : "IAS 16.15–17, 6, 53",
      columns: [
        { key: "item", label: "רכיב", format: "text" },
        { key: "amount", label: "סכום" },
      ],
      rows: [
        { item: "מחיר רכישה", amount: inp.purchasePrice },
        { item: "עלויות המיוחסות במישרין", amount: inp.attributableCosts },
        { item: "עלות הנכס", amount: inp.cost, _emphasis: "subtotal" },
        ...(inp.land
          ? [
              { item: `בניכוי מרכיב הקרקע (${landShare}) — אינו מופחת`, amount: -inp.land.cost },
              { item: "מרכיב המבנה", amount: inp.buildingCost, _emphasis: "subtotal" },
            ]
          : []),
        { item: `ערך שייר${part}`, amount: -inp.residual },
        { item: "סכום בר-פחת", amount: depreciable, _emphasis: "total" },
        { item: "מועד זמינות לשימוש", amount: fmtDate(inp.startDate) },
        { item: "אורך חיים שימושיים", amount: lifeText },
        { item: `שיטת ${label}`, amount: methodBasis },
        { item: "מודל המדידה", amount: revaluation ? "מודל ההערכה מחדש" : "מודל העלות" },
      ],
    },
    {
      id: "depreciation",
      title: "לוח פחת תקופתי ומצטבר",
      caption: `${label} · ${monthLabel(viewStart)} עד ${monthLabel(viewEnd - 1)}${viewStart > r.start ? " · מוצגות יתרות פתיחה" : ""}`,
      note: ren
        ? "הפחת מתחיל במועד הזמינות לשימוש ומחושב לפי חודשים בשנות כספים. ממועד השיפוץ היתרה בספרים בתוספת עלות השיפוץ, בניכוי ערך השייר המתוקן, מופחתת על פני יתרת החיים המעודכנת — שינוי אומדן מכאן ולהבא, ללא הצגה מחדש."
        : "הפחת מתחיל במועד הזמינות לשימוש ומחושב לפי חודשים בשנות כספים. כל הערכה מחדש פותחת שלב חדש: השווי ההוגן מופחת על פני יתרת אורך החיים.",
      reference: ren ? "IAS 16.51, 55, 61; IAS 8.36–38" : "IAS 16.50, 55, 60–62",
      columns: scheduleColumns,
      rows,
      totals: {
        period: "סה\"כ",
        ...scheduleTotals(["months", "additions", "before", "after", "total", "revaluation", "landRevaluation", "disposal"]),
        opening: null,
        gross: null,
        accumulated: null,
        carrying: null,
        surplus: null,
        land: null,
        building: null,
        landSurplus: null,
        event: null,
      },
    },
    {
      id: "balance-sheet",
      title: "מאזן: רכוש קבוע",
      caption: "יתרות לסוף כל תקופה",
      note: revaluation
        ? "במודל ההערכה מחדש הנכס מוצג בשווי ההוגן במועד ההערכה בניכוי פחת שנצבר מאז. העלייה נזקפת לקרן הערכה מחדש בהון, למעט ביטול ירידה שהוכרה קודם ברווח או הפסד."
        : "במודל העלות הנכס מוצג בעלות בניכוי פחת שנצבר.",
      reference: revaluation ? "IAS 16.31, 39–41, 73" : "IAS 16.30, 73",
      columns: [{ key: "item", label: "סעיף", format: "text" }, ...yearColumns],
      rows: balanceRows,
    },
    {
      id: "profit-or-loss",
      title: "דוח רווח והפסד ורווח כולל אחר",
      caption: "השפעת הנכס על כל תקופה (הוצאה בסוגריים)",
      note: "הוצאות הפחת, הפסד מהערכה מחדש וביטולו, ורווח או הפסד מגריעה נזקפים לרווח או הפסד. רווח מגריעה אינו מסווג כהכנסות.",
      reference: "IAS 16.39–40, 48, 68, 71",
      columns: [{ key: "item", label: "סעיף", format: "text" }, ...yearColumns],
      rows: plRows,
    },
    {
      id: "method-comparison",
      title: "השוואת שיטות פחת",
      caption: "הוצאות הפחת בכל תקופה, לאותם נתונים ואירועים",
      note: "השיטה צריכה לשקף את הדפוס שבו ההטבות הכלכליות העתידיות של הנכס צפויות להיצרך. כל השיטות מגיעות לאותו סך פחת על פני חיי הנכס.",
      reference: "IAS 16.60–62",
      columns: [{ key: "period", label: "תקופה", format: "text" }, ...methods.map((m) => ({ key: COMPARE_KEY[m], label: METHOD_LABEL[m] }))],
      rows: comparison,
      totals: { period: "סה\"כ", ...Object.fromEntries(methods.map((m) => [COMPARE_KEY[m], round2(sum(comparison.map((row) => Number(row[COMPARE_KEY[m]]))))])) },
    },
  ];

  // ---- guidance ------------------------------------------------------------
  const guidance: Guidance[] = [
    {
      title: "1. הכרה ומדידה לראשונה",
      body: `פריט רכוש קבוע מוכר לפי עלותו: ${fmt(inp.purchasePrice)} + ${fmt(inp.attributableCosts)} עלויות המיוחסות במישרין = ${fmt(inp.cost)}. עלויות הנהלה כלליות ועלויות הדרכה אינן חלק מהעלות.`,
      reference: "IAS 16.7, 15–17, 19",
    },
    {
      title: "2. סכום בר-פחת ותחילת הפחת",
      body: `הסכום בר-הפחת (${fmt(depreciable)}) מוקצה על פני ${lifeText}. הפחת מתחיל כשהנכס זמין לשימוש — ${fmtDate(inp.startDate)} — גם אם טרם החל להפיק תפוקה מלאה.`,
      reference: "IAS 16.6, 50, 55",
    },
    ...(inp.land
      ? [
          {
            title: "קרקע ומבנה — נכסים נפרדים",
            body: `קרקע ומבנה מטופלים כנכסים נפרדים גם כשנרכשו יחד. לקרקע אורך חיים בלתי מוגבל ולכן היא אינה מופחתת; הפחת, ערך השייר והשיפוץ חלים על המבנה בלבד. כאן: קרקע ${fmt(inp.land.cost)} (${landShare}), מבנה ${fmt(inp.buildingCost)}.${revaluation ? " בהערכה מחדש השווי ההוגן הכולל מפוצל לפי אותו יחס; לכל מרכיב קרן נפרדת, ורק קרן המבנה מועברת לעודפים בקצב הפחת." : ""}`,
            reference: "IAS 16.58–59",
          },
        ]
      : []),
    { title: `3. שיטת ${label}`, body: METHOD_TEXT[method], reference: "IAS 16.60–62" },
  ];
  if (ren) {
    guidance.push(
      {
        title: "4. שיפוץ — היוון עלות",
        body: `עלות שיפוץ שמשפר את הנכס או מאריך את חייו מוכרת ביתרה בספרים: ${fmt(ren.carryingBefore)} + ${fmt(inp.renovation!.cost)} = ${fmt(ren.newBase)}. עלויות תחזוקה שוטפת נזקפות לרווח או הפסד.`,
        reference: "IAS 16.7, 10–13",
      },
      {
        title: "5. שינוי אומדן — מכאן ולהבא",
        body: `שינוי באורך החיים או בערך השייר הוא שינוי באומדן חשבונאי: אין הצגה מחדש, והבסיס החדש (${fmt(round2(ren.newBase - inp.renovation!.residual))}) מופחת על פני יתרת החיים המעודכנת — ${plain(round2(ren.remainingMonths / 12))} שנים.`,
        reference: "IAS 16.51, 61; IAS 8.36–38",
      },
    );
  }
  if (hasRevaluation) {
    guidance.push({
      title: "הערכה מחדש",
      body: `במודל ההערכה מחדש הנכס מוצג בשווי ההוגן לתאריך ההערכה. הפחת שנצבר מבוטל כנגד הסכום הברוטו (שיטת הביטול). עלייה נזקפת לקרן הערכה מחדש ברווח כולל אחר, אלא אם היא מבטלת ירידה שהוכרה קודם ברווח או הפסד; ירידה מקטינה קודם את הקרן, והיתרה נזקפת לרווח או הפסד.${inp.transferSurplus ? " הקרן מועברת לעודפים בהדרגה, בגובה החלק שמומש בשימוש." : " הקרן מועברת לעודפים רק בגריעה."}`,
      reference: "IAS 16.31, 35, 39–41",
    });
  }
  if (ex) {
    const e = inp.exchange!;
    const exchangeAfter = `מיום ההחלפה הלוח ממשיך עם הנכס שהתקבל: (${fmt(ex.newCost)} − גרט ${fmt(e.newResidual)}) מופחת על פני ${years(e.newLife)} שנים, בשיטת ${METHOD_LABEL[method === "units" ? "straight-line" : method]}.`;
    guidance.push({
      title: "החלפת נכס",
      body: inp.exchange!.commercial
        ? `לעסקה מהות מסחרית, ולכן הנכס שהתקבל נמדד בשווי הוגן (${inp.exchange!.basis === "given" ? "של הנכס שנמסר, בהתאמה למזומן" : "של הנכס שהתקבל"}): ${fmt(ex.newCost)}. הנכס שנמסר נגרע, וההפרש בין התמורה ליתרתו בספרים (${fmt(ex.carrying)}) מוכר ברווח או הפסד: ${fmt(ex.gain)}. ${exchangeAfter}`
        : `לעסקה אין מהות מסחרית, ולכן הנכס שהתקבל נמדד לפי היתרה בספרים של הנכס שנמסר, בתוספת מזומן ששולם או בניכוי מזומן שהתקבל: ${fmt(ex.newCost)}. לא מוכר רווח או הפסד. ${exchangeAfter}`,
      reference: "IAS 16.24–26, 67–68, 71–72",
    });
  }

  // ---- disclosure ----------------------------------------------------------
  const last = rows.at(-1)!;
  const disclosure = [
    "באור X — רכוש קבוע",
    "",
    "מדיניות חשבונאית",
    `${revaluation ? "רכוש קבוע מוצג לפי סכום משוערך — שווי הוגן במועד ההערכה מחדש בניכוי פחת שנצבר לאחר מכן." : "רכוש קבוע מוצג לפי עלות בניכוי פחת שנצבר."} הפחת מחושב לפי שיטת ${label} מהמועד שבו הנכס זמין לשימוש, על פני ${lifeText}.${hasLand ? " קרקע אינה מופחתת; הפחת חל על המבנה בלבד." : ""} ערכי השייר, אורך החיים השימושיים ושיטת הפחת נבחנים בכל תאריך דיווח.`,
    ...(ren
      ? [
          "",
          "שינוי באומדן",
          `ביום ${fmtDate(inp.renovation!.date)} שופץ הנכס בעלות של ${fmt(inp.renovation!.cost)}; יתרת אורך החיים עודכנה ל-${plain(round2(ren.remainingMonths / 12))} שנים וערך השייר ל-${fmt(inp.renovation!.residual)}. השינוי טופל מכאן ולהבא.`,
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
    `התאמת היתרה בספרים — ${last.period}`,
    `יתרה בספרים לתחילת התקופה: ${fmt(Number(last.opening))}`,
    ...(Number(last.additions) ? [`תוספות: ${fmt(Number(last.additions))}`] : []),
    `פחת: (${fmt(Number(last.total))})`,
    ...(Number(last.revaluation) ? [`הערכה מחדש: ${fmt(Number(last.revaluation))}`] : []),
    ...(Number(last.disposal) ? [`גריעות: (${fmt(-Number(last.disposal))})`] : []),
    `יתרה בספרים לסוף התקופה: ${fmt(Number(last.carrying))}`,
  ].join("\n");

  return {
    headline: `${label} · ${revaluation ? "מודל ההערכה מחדש" : "מודל העלות"} · פחת בטווח ${fmt(totalDep)} · יתרה בספרים ל-${dayBefore(viewEnd)}: ${fmt(closeView.carrying)}`,
    outcome: "recognised",
    metrics,
    journal,
    tables,
    disclosure,
    guidance,
    years: yearSections,
    assumptions: [
      "הסכומים בשקלים. שנת הכספים מסתיימת ב-31/12; פקודות הפחת נרשמות בסוף כל תקופה ובמועד כל אירוע.",
      "הפחת מחושב לפי חודשים שלמים; מועד שחל אחרי ה-15 בחודש מעוגל לתחילת החודש הבא.",
      ...(method === "sum-of-years" || method === "double-declining"
        ? ["בשיטות המואצות, שנות הנכס נמדדות מתחילת כל שלב (זמינות לשימוש או אירוע) והפחת של כל שנת נכס מתפזר באופן שווה על חודשיה."]
        : []),
      ...(method === "sum-of-years" ? ["כשיתרת החיים אינה שנים שלמות, משקל כל שנה הוא יתרת החיים בתחילתה (למשל 5.75, 4.75 … 0.75)."] : []),
      ...(method === "double-declining" ? ["שיעור היתרה הפוחתת הכפולה הוא 2 חלקי אורך החיים בשנים; לאחר שיפוץ הוא מחושב מחדש לפי יתרת החיים."] : []),
      ...(method === "units" ? ["יחידות התפוקה של כל שנת כספים מתפזרות באופן שווה על חודשי השימוש בה; לשנים ללא נתון מחולקות היחידות שנותרו באופן שווה."] : []),
      ...(hasRevaluation ? ["השפעות מס נדחה על קרן ההערכה מחדש אינן מחושבות."] : []),
      ...(ex
        ? [
            `מיום ההחלפה הלוח ממשיך עם הנכס שהתקבל — לפי העלות שנקבעה, אורך החיים וערך השייר שלו, באותה שיטת פחת${method === "units" ? " (ביחידות תפוקה: בקו ישר, כי אין נתוני תפוקה לנכס החדש)" : ""}. הערכות מחדש חלות רק על הנכס שנמסר.`,
          ]
        : []),
      `הלוח מוצג רק לתקופה שבין מועד הזמינות לשימוש לתום אורך החיים${ex ? " של הנכס שהתקבל" : " או למועד הגריעה"}, בתוך טווח החישוב שנבחר.`,
    ],
  };
}

const EVENT_LABEL: Record<Booking["kind"], string> = {
  renovation: "שיפוץ",
  landRevaluation: "הערכה מחדש — קרקע",
  revaluation: "הערכה מחדש",
  exchange: "החלפה",
  surplus: "העברה לעודפים",
};

const CAUSE_REFERENCE: Record<Cause, string> = {
  start: "IAS 16.50, 60–62",
  exchange: "IAS 16.24, 50, 55",
  renovation: "IAS 16.51, 61; IAS 8.36–38",
  revaluation: "IAS 16.31, 35, 50",
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
    "שיטה מואצת: שיעור קבוע (2 חלקי אורך החיים) מוחל על היתרה בספרים בתחילת כל שנת נכס. כשהפחת בקו ישר על היתרה גבוה יותר עוברים אליו, והנכס אינו מופחת מתחת לערך השייר.",
  units: "הפחת נגזר מהשימוש בפועל: הסכום בר-הפחת מחולק בסך יחידות התפוקה הצפויות, ומוכפל ביחידות שהופקו בכל תקופה.",
};
