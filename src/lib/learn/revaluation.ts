/**
 * The revaluation model (IAS 16.31–42) for the learning lab.
 *
 * The asset is bought on 1 January of `firstYear` and simulated month by month.
 * A revaluation, at the start, middle or end of a year, first brings
 * depreciation up to its date, then measures the gap to fair value:
 *
 *   increase: reverses losses recognised in profit or loss first, the rest to the surplus
 *   decrease: reduces the surplus first, the rest to profit or loss
 *
 * From then on the fair value is depreciated, less salvage, over the remaining
 * life, in 12-month life years from the revaluation date. Transfers to retained
 * earnings at the rate of depreciation are the excess of that charge over the
 * one the cost model would have had, so while no loss has gone to profit or
 * loss, the surplus always equals the revalued carrying amount less the
 * cost-model one. Accumulated depreciation is shown both ways: eliminated
 * against the gross amount, or restated in proportion.
 */

export type RevMethod = "sl" | "syd-desc" | "syd-asc" | "db";
export type Timing = "start" | "mid" | "end";
export type Transfer = "depreciation" | "disposal";

export const METHOD_LABEL: Record<RevMethod, string> = {
  sl: "קו ישר",
  "syd-desc": "סכום ספרות השנים — יורד",
  "syd-asc": "סכום ספרות השנים — עולה",
  db: "יתרה פוחתת",
};
export const TIMING_LABEL: Record<Timing, string> = { start: "1 בינואר", mid: "1 ביולי", end: "31 בדצמבר" };

export type Revaluation = { year: number; timing: Timing; fairValue: number };

export type RevaluationInputs = {
  cost: number;
  salvage: number;
  /** Useful life in whole years. */
  life: number;
  method: RevMethod;
  firstYear: number;
  revaluations: Revaluation[];
  transfer: Transfer;
};

export type RevEvent = Revaluation & {
  /** Months since purchase. */
  t: number;
  /** Carrying amount just before the revaluation, and the gap to fair value. */
  before: number;
  diff: number;
  /** The gap's split: profit or loss (positive is income), and the surplus (other comprehensive income). */
  pl: number;
  oci: number;
  surplusBefore: number;
  surplusAfter: number;
  /** Elimination: the accumulated depreciation closed against the gross amount. */
  accEliminated: number;
  grossBefore: number;
  /** Proportional restatement: gross and accumulated depreciation both scaled by fair value ÷ carrying amount. */
  factor: number;
  propGrossBefore: number;
  propAccBefore: number;
  propGrossAfter: number;
  propAccAfter: number;
  /** Remaining life from the revaluation, in months, and the charge for the first 12 of them. */
  monthsLeft: number;
  firstYearCharge: number;
};

export type RevRow = {
  year: number;
  opening: number;
  dep: number;
  /** What the cost model would have charged. */
  costDep: number;
  revaluation: number;
  oci: number;
  pl: number;
  transfer: number;
  closing: number;
  surplus: number;
  /** Carrying amount under the cost model. */
  costCarrying: number;
  /** Closing gross and accumulated depreciation: elimination, and proportional restatement. */
  gross: number;
  acc: number;
  propGross: number;
  propAcc: number;
};

export type RevaluationResult = { events: RevEvent[]; rows: RevRow[] };

/** Months since purchase at which a revaluation takes place. */
export const monthOf = (firstYear: number, r: Pick<Revaluation, "year" | "timing">) =>
  (r.year - firstYear) * 12 + (r.timing === "start" ? 0 : r.timing === "mid" ? 6 : 12);

/**
 * IAS 16.39–40: an increase first reverses a decrease recognised earlier in
 * profit or loss, the rest goes to the surplus; a decrease first reduces the
 * surplus, the rest goes to profit or loss.
 */
export function splitRevaluation(diff: number, surplus: number, losses: number) {
  if (diff >= 0) {
    const pl = Math.min(diff, losses);
    return { pl, oci: diff - pl, losses: losses - pl };
  }
  const oci = -Math.min(-diff, surplus);
  const pl = diff - oci;
  return { pl, oci, losses: losses - pl };
}

export type LandRow = { year: number; opening: number; fairValue: number; diff: number; pl: number; oci: number; surplus: number };

/** Land is not depreciated: each year-end fair value is only a gap, split by the same rule; the surplus stays until disposal. */
export function solveLand(cost: number, values: { year: number; fairValue: number }[]): LandRow[] {
  let carrying = cost;
  let surplus = 0;
  let losses = 0;
  return values.map(({ year, fairValue }) => {
    const diff = fairValue - carrying;
    const split = splitRevaluation(diff, surplus, losses);
    const row = { year, opening: carrying, fairValue, diff, pl: split.pl, oci: split.oci, surplus: surplus + split.oci };
    carrying = fairValue;
    surplus = row.surplus;
    losses = split.losses;
    return row;
  });
}

/** 1 − (salvage / value)^(1 / years). */
export const dbRate = (value: number, salvage: number, years: number) => 1 - Math.pow(salvage / value, 1 / years);

/**
 * Monthly charges for `months` months, depreciating `value` to `salvage` in
 * 12-month life years (the last may be shorter) that start at the phase start.
 */
export function phaseCharges(method: RevMethod, value: number, salvage: number, months: number): number[] {
  const base = value - salvage;
  const blocks = Math.ceil(months / 12);
  const len = (i: number) => Math.min(12, months - 12 * i);
  const out: number[] = [];
  const spread = (charge: number, n: number) => {
    for (let k = 0; k < n; k++) out.push(charge / n);
  };
  if (method === "sl") {
    for (let k = 0; k < months; k++) out.push(base / months);
  } else if (method === "db") {
    const rate = dbRate(value, salvage, months / 12);
    let opening = value;
    for (let i = 0; i < blocks; i++) {
      const charge = i === blocks - 1 ? opening - salvage : (opening * rate * len(i)) / 12;
      spread(charge, len(i));
      opening -= charge;
    }
  } else {
    // Weights in years: remaining life at each block's start (descending), or life elapsed at its end (ascending).
    const weights = Array.from({ length: blocks }, (_, i) => (method === "syd-desc" ? months - 12 * i : 12 * i + len(i)) / 12);
    const total = weights.reduce((s, w) => s + w, 0);
    weights.forEach((w, i) => spread((base * w) / total, len(i)));
  }
  return out;
}

/** Input problems, keyed by field (`revaluations.i` for a row); empty when the inputs can be solved. */
export function revaluationErrors(x: RevaluationInputs): Record<string, string> {
  const e: Record<string, string> = {};
  if (!(x.cost > 0)) e.cost = "העלות חייבת להיות חיובית";
  if (!(x.salvage >= 0)) e.salvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.cost > 0 && x.salvage >= x.cost) e.salvage = "ערך הגרט חייב להיות נמוך מהעלות";
  else if (x.method === "db" && !(x.salvage > 0)) e.salvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (!Number.isInteger(x.life) || x.life < 1 || x.life > 50) e.life = "אורך חיים בשנים שלמות, 1 עד 50";
  if (!Number.isInteger(x.firstYear)) e.firstYear = "שנת רכישה";
  if (x.revaluations.length === 0) e.revaluations = "הוסיפו לפחות הערכה מחדש אחת";
  const seen = new Set<number>();
  x.revaluations.forEach((r, i) => {
    const t = monthOf(x.firstYear, r);
    if (!(r.fairValue > x.salvage)) e[`revaluations.${i}`] = "השווי ההוגן חייב להיות גבוה מערך הגרט";
    else if (!(t > 0)) e[`revaluations.${i}`] = "ההערכה חייבת להיות אחרי מועד הרכישה";
    else if (!e.life && t >= x.life * 12) e[`revaluations.${i}`] = "ההערכה חייבת להיות לפני תום אורך החיים";
    else if (seen.has(t)) e[`revaluations.${i}`] = "שתי הערכות באותו מועד";
    seen.add(t);
  });
  return e;
}

export function solveRevaluation(x: RevaluationInputs): RevaluationResult {
  const L = x.life * 12;
  const costCharges = phaseCharges(x.method, x.cost, x.salvage, L);
  const byMonth = new Map<number, Revaluation>(x.revaluations.map((r) => [monthOf(x.firstYear, r), r]));

  let gross = x.cost;
  let acc = 0;
  let propGross = x.cost;
  let propAcc = 0;
  let surplus = 0;
  let losses = 0;
  let costAcc = 0;
  let charges = costCharges;
  let t0 = 0;
  const events: RevEvent[] = [];
  const rows: RevRow[] = [];
  let year = { opening: x.cost, dep: 0, costDep: 0, revaluation: 0, oci: 0, pl: 0, transfer: 0 };

  const revalue = (r: Revaluation, t: number) => {
    const before = gross - acc;
    const diff = r.fairValue - before;
    const split = splitRevaluation(diff, surplus, losses);
    const factor = r.fairValue / before;
    const ev: RevEvent = {
      ...r,
      t,
      before,
      diff,
      pl: split.pl,
      oci: split.oci,
      surplusBefore: surplus,
      surplusAfter: surplus + split.oci,
      accEliminated: acc,
      grossBefore: gross,
      factor,
      propGrossBefore: propGross,
      propAccBefore: propAcc,
      propGrossAfter: propGross * factor,
      propAccAfter: propAcc * factor,
      monthsLeft: L - t,
      firstYearCharge: 0,
    };
    surplus += split.oci;
    losses = split.losses;
    gross = r.fairValue;
    acc = 0;
    propGross *= factor;
    propAcc *= factor;
    charges = phaseCharges(x.method, r.fairValue, x.salvage, L - t);
    t0 = t;
    ev.firstYearCharge = charges.slice(0, 12).reduce((s, c) => s + c, 0);
    events.push(ev);
    year.revaluation += diff;
    year.oci += split.oci;
    year.pl += split.pl;
  };
  const closeYear = (i: number) => {
    rows.push({
      year: x.firstYear + i,
      ...year,
      closing: gross - acc,
      surplus,
      costCarrying: x.cost - costAcc,
      gross,
      acc,
      propGross,
      propAcc,
    });
    year = { opening: gross - acc, dep: 0, costDep: 0, revaluation: 0, oci: 0, pl: 0, transfer: 0 };
  };

  for (let t = 0; t < L; t++) {
    const r = byMonth.get(t);
    if (t > 0 && t % 12 === 0) {
      // A 31 December revaluation closes the year that ends here; a 1 January one opens the next.
      if (r?.timing === "end") revalue(r, t);
      closeYear(t / 12 - 1);
      if (r?.timing === "start") revalue(r, t);
    } else if (r) revalue(r, t);

    const dep = charges[t - t0];
    const costDep = costCharges[t];
    acc += dep;
    propAcc += dep;
    costAcc += costDep;
    year.dep += dep;
    year.costDep += costDep;
    if (x.transfer === "depreciation" && surplus > 0) {
      const transfer = Math.min(surplus, Math.max(0, dep - costDep));
      surplus -= transfer;
      year.transfer += transfer;
    }
  }
  closeYear(x.life - 1);
  return { events, rows };
}

// ---------------------------------------------------------------------------
// The calculator's working, year by year, for someone who has never solved one.

/** One operation: what is computed, then the formula with its numbers and the result — as TeX. */
export type RevCalc = { label: string; tex?: string; note?: string };
export type RevYearStep = { year: number; title: string; calcs: RevCalc[] };

const nf2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const show2 = (v: number) => nf2.format(Math.round(v * 100) / 100 + 0);
const t2 = (v: number) => show2(v).replace(/,/g, "{,}");
const tt = (s: string) => `\\text{${s}}`;
const yrs = (months: number) => show2(months / 12);

type Block = { from: number; len: number; charge: number; tex: string };

/** A phase's 12-month life years: each one's charge, and the formula that gives it. */
function blocksOf(method: RevMethod, value: number, salvage: number, months: number, t0: number): Block[] {
  const base = value - salvage;
  const n = Math.ceil(months / 12);
  const len = (i: number) => Math.min(12, months - 12 * i);
  const out: Block[] = [];
  // Straight-line is one even charge over the whole phase: the annual figure, times the months over 12.
  if (method === "sl") return [{ from: t0, len: months, charge: base, tex: `\\frac{${t2(value)} - ${t2(salvage)}}{${yrs(months)}}` }];
  if (method === "db") {
    const rate = dbRate(value, salvage, months / 12);
    let opening = value;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const charge = last ? opening - salvage : (opening * rate * len(i)) / 12;
      out.push({ from: t0 + 12 * i, len: len(i), charge, tex: last ? `${t2(opening)} - ${t2(salvage)}` : `${t2(opening)} \\times ${(rate * 100).toFixed(2)}\\%${len(i) < 12 ? ` \\times \\frac{${len(i)}}{12}` : ""}` });
      opening -= charge;
    }
    return out;
  }
  const weights = Array.from({ length: n }, (_, i) => (method === "syd-desc" ? months - 12 * i : 12 * i + len(i)) / 12);
  const total = weights.reduce((s, w) => s + w, 0);
  weights.forEach((w, i) => out.push({ from: t0 + 12 * i, len: len(i), charge: (base * w) / total, tex: `(${t2(value)} - ${t2(salvage)}) \\times \\frac{${show2(w)}}{${show2(total)}}` }));
  return out;
}

export function explainRevaluation(x: RevaluationInputs, r: RevaluationResult): RevYearStep[] {
  const L = x.life * 12;
  const phases = [{ t0: 0, value: x.cost, name: "לפי העלות" }, ...r.events.map((e) => ({ t0: e.t, value: e.fairValue, name: `לפי השווי ההוגן מ-${TIMING_LABEL[e.timing]} ${e.year}` }))];
  return r.rows.map((row, yi) => {
    const a = yi * 12;
    const b = a + 12;
    // In the order things happen: the charge up to a revaluation in the year, the revaluation, the charge after it;
    // a 31 December revaluation comes last, after the year's transfer, as in the journal.
    const timed: { at: number; calcs: RevCalc[] }[] = [];
    const parts: number[] = [];
    phases.forEach((ph, pi) => {
      const end = phases[pi + 1]?.t0 ?? L;
      for (const bl of blocksOf(x.method, ph.value, x.salvage, L - ph.t0, ph.t0)) {
        const s = Math.max(a, bl.from, ph.t0);
        const e = Math.min(b, bl.from + bl.len, end);
        if (e <= s) continue;
        const share = e - s;
        const amount = (bl.charge * share) / bl.len;
        parts.push(amount);
        const portion = x.method === "sl" ? (share < 12 ? ` \\times \\frac{${share}}{12}` : "") : share < bl.len ? ` \\times \\frac{${share}}{${bl.len}}` : "";
        timed.push({
          at: s + 0.5,
          calcs: [
            {
              label: `פחת ${ph.name}${share < 12 ? ` — ${share} חודשים` : ""}`,
              tex: `${bl.tex}${portion} = ${t2(amount)}`,
              note: x.method === "sl" ? `(${pi === 0 ? "עלות" : "שווי הוגן"} − גרט) ÷ יתרת אורך החיים ${pi === 0 ? "המקורית" : "מיום ההערכה"} — הגרט תמיד יורד, והקרקע לא נכנסת.` : undefined,
            },
          ],
        });
      }
    });
    const inYear = r.events.filter((ev) => ev.t >= a && ev.t <= b && !(ev.t === a && ev.timing === "end") && !(ev.t === b && ev.timing === "start"));
    const eventCalcs = (ev: RevEvent): RevCalc[] => [
      { label: `הערכה מחדש ב-${TIMING_LABEL[ev.timing]} ${ev.year} — ערך בספרים לפני ההערכה`, tex: `${tt("עלות או שווי קודם")} - ${tt("פחת נצבר")} = ${t2(ev.grossBefore)} - ${t2(ev.accEliminated)} = ${t2(ev.before)}` },
      { label: "הפער", tex: `${tt("שווי הוגן")} - ${tt("ערך בספרים")} = ${t2(ev.fairValue)} - ${t2(ev.before)} = ${t2(ev.diff)}` },
      {
        label:
          ev.diff >= 0
            ? ev.pl > 0.005
              ? "עלייה — קודם מבטלת הפסד שנרשם בעבר (לרווח והפסד), והשאר לקרן"
              : "עלייה — כולה לקרן הערכה מחדש (רווח כולל אחר)"
            : ev.pl < -0.005
              ? "ירידה — קודם מאפסת את הקרן, ומה שנשאר הוא הפסד ברווח והפסד"
              : "ירידה — יש מספיק בקרן, אז היא רק מקטינה אותה",
        tex: `${tt("לקרן")} = ${t2(ev.oci)}, \\quad ${tt("לרווח והפסד")} = ${t2(ev.pl)}`,
      },
      { label: "יתרת הקרן אחרי ההערכה", tex: `${t2(ev.surplusBefore)} ${ev.oci >= 0 ? "+" : "-"} ${t2(Math.abs(ev.oci))} = ${t2(ev.surplusAfter)}` },
      {
        label: `מכאן מפחיתים את השווי ההוגן פחות הגרט, על פני ${yrs(ev.monthsLeft)} השנים שנשארו`,
        tex: `${tt("בסיס הפחת החדש")} = ${t2(ev.fairValue)} - ${t2(x.salvage)} = ${t2(ev.fairValue - x.salvage)}`,
        note: `הפחת הנצבר (${show2(ev.accEliminated)}) מבוטל כנגד הנכס, והנכס מוצג ב-${show2(ev.fairValue)}.`,
      },
    ];
    for (const ev of inYear.filter((e) => e.timing !== "end")) timed.push({ at: ev.t, calcs: eventCalcs(ev) });
    const calcs: RevCalc[] = timed.sort((p, q) => p.at - q.at).flatMap((z) => z.calcs);
    if (parts.length > 1) calcs.push({ label: `סך הפחת בשנת ${row.year}`, tex: `${parts.map(t2).join(" + ")} = ${t2(row.dep)}` });

    if (x.transfer === "depreciation" && row.transfer > 0.005) {
      const surplusStart = yi > 0 ? r.rows[yi - 1].surplus : 0;
      const leftYears = (L - a) / 12;
      const bySurplus = (surplusStart / leftYears) * (12 / 12);
      calcs.push({ label: "פחת לפי מודל העלות (הלוח \"כאילו לא הייתה הערכה\")", tex: t2(row.costDep) });
      if (Math.abs(bySurplus - row.transfer) < 0.01)
        calcs.push({
          label: "העברה לעודפים — יתרת הקרן בתחילת השנה, חלקי השנים שנשארו",
          tex: `\\frac{${tt("יתרת הקרן")}}{${tt("יתרת אורך החיים")}} = \\frac{${t2(surplusStart)}}{${show2(leftYears)}} = ${t2(row.transfer)}`,
          note: `בדיקה בדרך השנייה: פחת לפי השווי ההוגן פחות פחת לפי העלות = ${show2(row.dep)} − ${show2(row.costDep)} = ${show2(row.dep - row.costDep)}.`,
        });
      else
        calcs.push({
          label: "העברה לעודפים — החלק של הפחת שנובע מההערכה",
          tex: `${tt("פחת בפועל")} - ${tt("פחת לפי העלות")} = ${t2(row.dep)} - ${t2(row.costDep)} = ${t2(row.transfer)}`,
          note: "בשיטה הזו הפחת לא שווה בכל שנה, ולכן ההעברה היא הפרש הפחת של השנה.",
        });
    }

    for (const ev of inYear.filter((e) => e.timing === "end")) calcs.push(...eventCalcs(ev));
    calcs.push({ label: `ערך בספרים ב-31.12.${row.year}`, tex: t2(row.closing), note: row.surplus > 0.005 ? `יתרת הקרן: ${show2(row.surplus)}.` : undefined });
    return { year: row.year, title: `שנת ${row.year}`, calcs };
  });
}
