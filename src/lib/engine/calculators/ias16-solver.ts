import { money, percent, plain } from "../format";
import { round2, sum } from "../math";
import type { Equation, MathExpr, Values, Working } from "../types";
import { num, parseDatedValues, str, UNKNOWN } from "../validate";
import { fmtDate, frac, monthIndex, overlap, parseInputs, parseLandPart, run, sumRange, type Run } from "./ias16-timeline";

/**
 * Solving for an unknown input (X) from one known result. The engine is a
 * deterministic function of its inputs, so X is found numerically against the
 * full calculation — exact whatever the method or events. For the textbook
 * cases the algebra is also shown step by step, and is used only when it
 * agrees with that solution.
 */

export const SOLVABLE_LABEL: Record<string, string> = {
  purchasePrice: "עלות ראשונית",
  attributableCosts: "עלויות המיוחסות במישרין",
  residual: "ערך שייר (גרט)",
  usefulLife: "אורך חיים שימושיים",
  revisionCost: "עלות השיפוץ",
  lifeExtension: "שינוי באורך החיים בשיפוץ",
  revisedResidual: "ערך שייר מתוקן",
  fairValues: "שווי הוגן בהערכה מחדש",
  fvGiven: "שווי הוגן של הנכס שנמסר",
  fvReceived: "שווי הוגן של הנכס שהתקבל",
};

/** Unknowns measured in years but searched month by month. */
const IN_MONTHS = new Set(["usefulLife", "lifeExtension"]);

export type TargetKind = "carrying" | "depreciation" | "accumulated" | "exchangeGain" | "transfer" | "surplus" | "buildingSurplus" | "landSurplus";
export const DATED_TARGETS: TargetKind[] = ["carrying", "accumulated", "surplus", "buildingSurplus", "landSurplus"];
export const YEAR_TARGETS: TargetKind[] = ["depreciation", "transfer"];
const SURPLUS_TARGETS: TargetKind[] = ["transfer", "surplus", "buildingSurplus", "landSurplus"];

const TARGET_NAME: Record<TargetKind, string> = {
  carrying: "יתרה בספרים",
  depreciation: "הוצאות פחת",
  accumulated: "פחת שנצבר",
  exchangeGain: "רווח (הפסד) מההחלפה",
  transfer: "העברה לעודפים",
  surplus: "קרן הערכה מחדש",
  buildingSurplus: "קרן הערכה מחדש — מבנה",
  landSurplus: "קרן הערכה מחדש — קרקע",
};

export type Target = { kind: TargetKind; t: number; year: number; label: string; amount: number };

export function readTarget(v: Values): Target {
  const kind = str(v, "targetKind") as TargetKind;
  const date = str(v, "targetDate");
  const year = num(v, "targetYear");
  const when = DATED_TARGETS.includes(kind) ? ` ליום ${fmtDate(date)}` : YEAR_TARGETS.includes(kind) ? ` בשנת ${year}` : "";
  return { kind, t: DATED_TARGETS.includes(kind) ? monthIndex(date) : 0, year, label: `${TARGET_NAME[kind]}${when}`, amount: num(v, "targetAmount") };
}

/** The fair-value row that is X: the one left without an amount, else the last. */
function unknownRow(v: Values) {
  const rows = parseDatedValues(str(v, "fairValues"));
  const i = rows.findIndex((r) => r.value === "");
  return { rows, i: i < 0 ? rows.length - 1 : i };
}

/** The values with X put in place. */
export function withX(v: Values, unknown: string, x: number): Values {
  if (unknown !== "fairValues") return { ...v, [unknown]: x };
  const { rows, i } = unknownRow(v);
  rows[i] = { ...rows[i], value: x };
  return { ...v, fairValues: JSON.stringify(rows) };
}

function measure(r: Run, target: Target): number {
  const at = (t: number) => r.closing.get(Math.min(Math.max(t, r.start), r.stop))!;
  const year = (m: Map<number, number>) => sumRange(m, target.year * 12, target.year * 12 + 12);
  switch (target.kind) {
    case "carrying":
      return at(target.t).carrying;
    case "accumulated":
      return at(target.t).acc;
    case "surplus":
      return round2(at(target.t).surplus + at(target.t).landSurplus);
    case "buildingSurplus":
      return at(target.t).surplus;
    case "landSurplus":
      return at(target.t).landSurplus;
    case "depreciation":
      return year(r.depBy);
    case "transfer":
      return year(r.transferBy);
    case "exchangeGain":
      return r.exchangeInfo ? r.exchangeInfo.gain : NaN;
  }
}

const evaluate = (v: Values, unknown: string, x: number, target: Target) => {
  try {
    return measure(run(parseInputs(withX(v, unknown, x))), target);
  } catch {
    return NaN;
  }
};

type Found = { x: number } | { error: "flat" | "none" | "many"; xs?: number[] };

/**
 * Scan a fine widening grid for every sign change, bisect each, and keep the
 * roots that fit to the cent. Robust where the result is flat over part of the
 * range — a fair value below the carrying amount creates no surplus at all —
 * and it tells "no X fits" apart from "the result doesn't depend on X" and
 * from "more than one X fits".
 */
function solveAmount(f: (x: number) => number): Found {
  const xs = [0];
  for (let x = 0.01; x <= 1e10; x *= 1.2) xs.push(x);
  const ys = xs.map(f);
  const finite = ys.filter(Number.isFinite);
  if (finite.length && Math.max(...finite) - Math.min(...finite) < 0.005) return { error: "flat" };
  const roots: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    const fa = ys[i - 1];
    const fb = ys[i];
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;
    if (fa === 0) {
      roots.push(xs[i - 1]);
      continue;
    }
    if (fb === 0 || Math.sign(fb) === Math.sign(fa)) continue;
    let lo = xs[i - 1];
    let hi = xs[i];
    let fLo = fa;
    for (let k = 0; k < 200 && hi - lo > 1e-7; k++) {
      const mid = (lo + hi) / 2;
      const fm = f(mid);
      if (fm === 0 || Math.sign(fm) !== Math.sign(fLo)) hi = mid;
      else [lo, fLo] = [mid, fm];
    }
    roots.push(hi);
  }
  if (Number.isFinite(ys.at(-1)!) && ys.at(-1) === 0) roots.push(xs.at(-1)!);
  // Results are rounded to the cent, so neighbouring cents can fit equally well: prefer a whole number.
  const fits = roots.flatMap((x1) => {
    const nearest = [Math.round(x1), ...[-0.01, 0, 0.01].map((d) => round2(x1 + d))];
    const best = nearest.reduce((a, b) => (Math.abs(f(b)) < Math.abs(f(a)) ? b : a));
    return Number.isFinite(f(best)) && Math.abs(f(best)) <= 0.02 ? [best] : [];
  });
  const distinct = fits.filter((x, i) => fits.findIndex((y) => Math.abs(y - x) <= Math.max(1, Math.abs(x) * 1e-6)) === i);
  if (!distinct.length) return { error: "none" };
  if (distinct.length > 1) return { error: "many", xs: distinct };
  return { x: distinct[0] };
}

/** Whole months between `lo` and `hi`, closest first. */
function solveMonths(f: (months: number) => number, lo: number, hi: number, target: number): Found {
  let best: number | null = null;
  let bestGap = Infinity;
  const seen: number[] = [];
  for (let m = lo; m <= hi; m++) {
    const y = f(m);
    if (Number.isFinite(y)) seen.push(y);
    const gap = Math.abs(y);
    if (Number.isFinite(gap) && gap < bestGap) [best, bestGap] = [m, gap];
  }
  if (seen.length && Math.max(...seen) - Math.min(...seen) < 0.005) return { error: "flat" };
  return best !== null && bestGap <= Math.max(0.05, Math.abs(target) * 0.001) ? { x: best } : { error: "none" };
}

/** When the event an unknown belongs to happens: a known result from before it can't depend on it. */
function eventAt(v: Values, unknown: string, inp: ReturnType<typeof parseInputs>): { t: number; what: string } | null {
  if (["revisionCost", "lifeExtension", "revisedResidual"].includes(unknown) && inp.renovation) return { t: inp.renovation.at, what: `השיפוץ (${fmtDate(inp.renovation.date)})` };
  if ((unknown === "fvGiven" || unknown === "fvReceived") && inp.exchange) return { t: inp.exchange.at, what: `ההחלפה (${fmtDate(inp.exchange.date)})` };
  if (unknown === "fairValues") {
    const { rows, i } = unknownRow(v);
    const d = rows[i]?.date;
    if (d) return { t: monthIndex(d), what: `ההערכה מחדש (${fmtDate(d)})` };
  }
  return null;
}

/** Why no X was found, in words that point at what to change. */
function notFound(err: "flat" | "none" | "many", v: Values, unknown: string, target: Target, xs?: number[]): Solved {
  const label = SOLVABLE_LABEL[unknown];
  if (err === "many") return { ok: false, field: "targetAmount", error: `יותר מערך אחד של ${label} מתאים לנתון (${xs!.map((x) => p(round2(x))).join(", ")}). הוסיפו נתון אחר שמבחין ביניהם.` };
  if (err === "none") return { ok: false, field: "targetAmount", error: `אין ערך של ${label} שנותן ${target.label} של ${fmt(target.amount)}. בדקו את הסכום ואת התאריך של הנתון הידוע.` };
  const ev = eventAt(v, unknown, parseInputs(withX(v, unknown, 0)));
  const end = DATED_TARGETS.includes(target.kind) ? target.t : target.year * 12 + 12;
  if (ev && end <= ev.t) {
    const field = DATED_TARGETS.includes(target.kind) ? "targetDate" : "targetYear";
    return { ok: false, field, error: `הנתון הידוע (${target.label}) הוא מלפני ${ev.what}, ולכן ${label} אינו משפיע עליו. בחרו נתון מתאריך שאחרי ${ev.what}.` };
  }
  return { ok: false, field: "targetKind", error: `${target.label} אינו מושפע מ${label} — כל ערך של X נותן אותה תוצאה. בחרו נתון ידוע שתלוי בנעלם.` };
}

export type Solved =
  | { ok: true; unknown: string; x: number; values: Values; label: string; years: boolean; proof: { title: string; steps: Working[] } }
  | { ok: false; field: string; error: string };

export function solveForX(v: Values): Solved {
  const unknown = str(v, UNKNOWN);
  if (!SOLVABLE_LABEL[unknown]) return { ok: false, field: UNKNOWN, error: "סמנו שדה אחד כנעלם (X), בכפתור שליד השדה או ברשימה." };
  const target = readTarget(v);
  const base = parseInputs(withX(v, unknown, unknown === "usefulLife" ? 1 : 0));
  if (DATED_TARGETS.includes(target.kind) && target.t <= base.start) {
    return { ok: false, field: "targetDate", error: "תאריך נתון העזר חייב להיות אחרי מועד הזמינות לשימוש." };
  }
  if (target.kind === "exchangeGain" && !base.exchange) return { ok: false, field: "targetKind", error: "רווח מהחלפה דורש לסמן אירוע החלפת נכס." };
  if (SURPLUS_TARGETS.includes(target.kind) && base.revaluations.length === 0 && unknown !== "fairValues") {
    return { ok: false, field: "targetKind", error: "נתון על קרן ההערכה מחדש דורש הערכה מחדש בשלב האירועים." };
  }
  if ((target.kind === "buildingSurplus" || target.kind === "landSurplus") && !base.land) {
    return { ok: false, field: "targetKind", error: "נתון על קרן בגין המבנה או הקרקע דורש להגדיר מרכיב קרקע בהנחות הבסיס." };
  }

  const f = (x: number) => evaluate(v, unknown, x, target) - target.amount;
  let found: Found;
  if (IN_MONTHS.has(unknown)) {
    const lo = unknown === "usefulLife" ? 1 : base.renovation ? -(base.start + base.lifeMonths - base.renovation.at - 1) : 0;
    const months = solveMonths((m) => f(m / 12), lo, 1200, target.amount);
    found = "x" in months ? { x: months.x / 12 } : months;
  } else found = solveAmount(f);
  if (!("x" in found)) return notFound(found.error, v, unknown, target, found.xs);
  const x = found.x;

  const values = withX(v, unknown, x);
  const label = SOLVABLE_LABEL[unknown];
  return {
    ok: true,
    unknown,
    x,
    values,
    label,
    years: IN_MONTHS.has(unknown),
    proof: { title: `🔍 שלב א׳: שחזור הנעלם — ${label} (X)`, steps: explain(v, values, unknown, x, target) },
  };
}

// ---- explanation ----------------------------------------------------------

const fmt = (n: number) => money(n, "ILS");
const p = plain;
const eq = (lhs: string, abstract: MathExpr, numeric: MathExpr, result: number, unit?: Equation["unit"]): Equation => ({ lhs, abstract, numeric, result, unit });
const close = (a: number, b: number, tol = 0.05) => Math.abs(a - b) <= tol;

function explain(v: Values, values: Values, unknown: string, x: number, target: Target): Working[] {
  const T = target.amount;
  const r = run(parseInputs(values));
  const steps: Working[] = [{ label: "הנתון הידוע", formula: `${target.label}: ${fmt(T)}` }];
  steps.push(...(algebra(v, values, unknown, x, target, r) ?? linear(v, unknown, x, target)));
  steps.push({
    label: "בדיקה: הצבת X בחישוב המלא",
    formula: `${target.label} = ${fmt(measure(r, target))} ✓`,
  });
  return steps;
}

/** The textbook derivations; null when the case is not one of them or the shortcut does not hold here. */
function algebra(v: Values, values: Values, unknown: string, x: number, target: Target, r: Run): Working[] | null {
  const inp = parseInputs(values);
  const T = target.amount;
  const name = TARGET_NAME[target.kind];
  const sl = inp.method === "straight-line";

  // Cost or residual, from a result before any event, in any method where the share written off doesn't depend on them.
  const byShare = kForm(inp, r, unknown, x, target);
  if (byShare) return byShare;

  // Useful life, from a result before any event. (With land the
  // depreciable base is only the building, so the general line below is used.)
  if (sl && !inp.land && unknown === "usefulLife" && ["carrying", "accumulated", "depreciation"].includes(target.kind)) {
    const { cost: C, residual: R, lifeMonths: L, start } = inp;
    const isDep = target.kind === "depreciation";
    const n = isDep ? overlap(start, start + L, target.year * 12, target.year * 12 + 12) : Math.min(target.t, start + L) - start;
    const nWords = isDep ? "חודשי שימוש בשנה" : "חודשים שחלפו";
    const relation: Working = {
      label: `הקשר בין ${name} לנעלם (קו ישר)`,
      equation:
        target.kind === "carrying"
          ? eq(name, ["עלות", "−", frac(`(עלות − גרט) × ${nWords}`, "אורך חיים בחודשים")], [p(C), "−", frac(`(${p(C)} − ${p(R)}) × ${n}`, "X")], T)
          : eq(name, frac(`(עלות − גרט) × ${nWords}`, "אורך חיים בחודשים"), frac(`(${p(C)} − ${p(R)}) × ${n}`, "X"), T),
    };
    if (n <= 0) return null;

    {
      const months = target.kind === "carrying" ? ((C - R) * n) / (C - T) : ((C - R) * n) / T;
      if (!close(months, L, 0.5)) return null;
      return [
        relation,
        {
          label: "בידוד X — אורך החיים בחודשים",
          equation:
            target.kind === "carrying"
              ? eq("X", frac(`(עלות − גרט) × ${nWords}`, "עלות − יתרה בספרים"), frac(`(${p(C)} − ${p(R)}) × ${n}`, `${p(C)} − ${p(T)}`), L, "number")
              : eq("X", frac(`(עלות − גרט) × ${nWords}`, name), frac(`(${p(C)} − ${p(R)}) × ${n}`, p(T)), L, "number"),
        },
        { label: "בשנים", equation: eq("אורך חיים שימושיים", frac("אורך חיים בחודשים", "12"), frac(String(L), "12"), round2(L / 12), "number") },
      ];
    }
    return null;
  }

  // Renovation cost, from a result after the renovation.
  const ren = r.renovationInfo;
  if (sl && unknown === "revisionCost" && ren && ["carrying", "accumulated", "depreciation"].includes(target.kind)) {
    const R = inp.renovation!.residual;
    const M = ren.remainingMonths;
    const cb = ren.carryingBefore;
    const B = ren.newBase;
    const baseX = `(${p(cb)} + X)`;
    const isDep = target.kind === "depreciation";
    const k = isDep ? overlap(ren.t, r.end, target.year * 12, target.year * 12 + 12) : Math.min(target.t, r.end) - ren.t;
    if (k <= 0) return null;
    const kWords = isDep ? "חודשים מאז השיפוץ בשנה" : "חודשים מאז השיפוץ";
    let relation: Working;
    let isolate: Working;
    let B2: number;
    if (target.kind === "carrying") {
      B2 = (target.amount - (R * k) / M) / (1 - k / M);
      relation = {
        label: "הקשר לאחר השיפוץ (קו ישר)",
        equation: eq(name, ["(יתרה ערב השיפוץ + X)", "−", frac(`(יתרה ערב השיפוץ + X − גרט מתוקן) × ${kWords}`, "יתרת אורך חיים")], [baseX, "−", frac(`(${baseX} − ${p(R)}) × ${k}`, String(M))], target.amount),
      };
      isolate = {
        label: "בידוד בסיס העלות לאחר השיפוץ",
        equation: eq("יתרה ערב השיפוץ + X", frac(`יתרה בספרים − גרט מתוקן × ${kWords} ÷ יתרת אורך חיים`, `1 − ${kWords} ÷ יתרת אורך חיים`), frac(`${p(target.amount)} − ${p(R)} × ${k} ÷ ${M}`, `1 − ${k} ÷ ${M}`), B),
      };
    } else {
      const known = isDep ? sumRange(r.depBy, target.year * 12, Math.max(target.year * 12, Math.min(ren.t, target.year * 12 + 12))) : ren.depreciationBefore;
      const knownWords = isDep ? "פחת השנה עד השיפוץ" : "פחת שנצבר עד השיפוץ";
      B2 = ((target.amount - known) * M) / k + R;
      relation = {
        label: "הקשר לאחר השיפוץ (קו ישר)",
        equation: eq(name, [knownWords, "+", frac(`(יתרה ערב השיפוץ + X − גרט מתוקן) × ${kWords}`, "יתרת אורך חיים")], [p(known), "+", frac(`(${baseX} − ${p(R)}) × ${k}`, String(M))], target.amount),
      };
      isolate = {
        label: "בידוד בסיס העלות לאחר השיפוץ",
        equation: eq("יתרה ערב השיפוץ + X", [frac(`(${name} − ${knownWords}) × יתרת אורך חיים`, kWords), "+", "גרט מתוקן"], [frac(`(${p(target.amount)} − ${p(known)}) × ${M}`, String(k)), "+", p(R)], B),
      };
    }
    if (!close(B2, B)) return null;
    return [relation, isolate, { label: "בידוד X — עלות השיפוץ", equation: eq("X", ["(יתרה ערב השיפוץ + X)", "−", "יתרה ערב השיפוץ"], [p(B), "−", p(cb)], x) }];
  }

  // A fair value at revaluation, from the surplus it created or a later carrying amount.
  if (unknown === "fairValues") {
    const { rows, i } = unknownRow(v);
    const bk = r.bookings.find((b) => b.kind === "revaluation" && b.when === fmtDate(rows[i].date));
    if (!bk) return null;

    // With land: the building's fair value from its own surplus, then the whole from the building's share.
    if (inp.land && target.kind === "buildingSurplus") {
      const given = parseLandPart(rows[i].note);
      const share = given?.share ?? inp.land.share;
      const landAmount = given?.amount;
      const buildingValue = landAmount !== undefined ? round2(x - landAmount) : round2(x * (1 - share));
      const before = round2(buildingValue - bk.revaluation);
      const fvBuilding = round2(before + T);
      const intro: Working = {
        label: "יתרה בספרים של המבנה בלבד ערב השערוך (עלות המבנה בניכוי הפחת שנצבר עד מועד ההערכה)",
        formula: `${fmt(before)}`,
      };
      const building: Working = {
        label: "שווי הוגן של המבנה",
        equation: eq("שווי הוגן מבנה", ["יתרה בספרים מבנה", "+", "קרן הערכה מחדש מבנה"], [p(before), "+", p(T)], fvBuilding),
      };
      if (landAmount !== undefined) {
        if (!close(fvBuilding + landAmount, x)) return null;
        return [
          intro,
          building,
          { label: "בידוד X — השווי ההוגן הכולל של הנכס", equation: eq("X", ["שווי הוגן מבנה", "+", "שווי הוגן קרקע"], [p(fvBuilding), "+", p(landAmount)], x) },
        ];
      }
      if (!close(fvBuilding / (1 - share), x, 0.05 / (1 - share))) return null;
      return [
        intro,
        building,
        {
          label: "בידוד X — השווי ההוגן הכולל של הנכס",
          equation: eq("X", frac("שווי הוגן מבנה", "1 − אחוז הקרקע"), frac(p(fvBuilding), `1 − ${percent(share)}`), x),
        },
      ];
    }
    if (inp.land) return null;

    const before = round2(x - bk.revaluation);
    if (target.kind === "surplus" && close(T + before, x)) {
      return [
        { label: "הקשר בהערכה מחדש", equation: eq(name, ["X", "−", "יתרה בספרים ערב ההערכה"], ["X", "−", p(before)], T) },
        { label: "בידוד X — השווי ההוגן", equation: eq("X", [name, "+", "יתרה בספרים ערב ההערכה"], [p(T), "+", p(before)], x) },
      ];
    }
    const ph = r.phases.find((f) => f.t0 === bk.t && f.cause === "revaluation");
    if (sl && target.kind === "carrying" && ph) {
      const k = Math.min(target.t, r.end) - ph.t0;
      const R = ph.residual;
      const M = ph.months;
      if (k <= 0 || !close((T - (R * k) / M) / (1 - k / M), x)) return null;
      return [
        { label: "הקשר לאחר ההערכה (קו ישר)", equation: eq(name, ["X", "−", frac("(X − גרט) × חודשים מאז ההערכה", "יתרת אורך חיים")], ["X", "−", frac(`(X − ${p(R)}) × ${k}`, String(M))], T) },
        {
          label: "בידוד X — השווי ההוגן",
          equation: eq("X", frac("יתרה בספרים − גרט × חודשים מאז ההערכה ÷ יתרת אורך חיים", "1 − חודשים מאז ההערכה ÷ יתרת אורך חיים"), frac(`${p(T)} − ${p(R)} × ${k} ÷ ${M}`, `1 − ${k} ÷ ${M}`), x),
        },
      ];
    }
    return null;
  }

  // A fair value in an exchange, from the gain or loss.
  const ex = r.exchangeInfo;
  if ((unknown === "fvGiven" || unknown === "fvReceived") && target.kind === "exchangeGain" && ex) {
    const e = inp.exchange!;
    const given = unknown === "fvGiven";
    const value = given ? T + ex.carrying : T + ex.carrying + e.paid - e.received;
    if (!close(value, x)) return null;
    const cash: MathExpr[] = [...(e.paid ? ["−", p(e.paid)] : []), ...(e.received ? ["+", p(e.received)] : [])];
    const cashWords: MathExpr[] = [...(e.paid ? ["−", "מזומן ששולם"] : []), ...(e.received ? ["+", "מזומן שהתקבל"] : [])];
    return [
      { label: "הקשר בגריעה", equation: eq(name, ["X", ...(given ? [] : cashWords), "−", "יתרה בספרים של הנכס שנמסר"], ["X", ...(given ? [] : cash), "−", p(ex.carrying)], T) },
      {
        label: "בידוד X",
        equation: eq("X", [name, "+", "יתרה בספרים", ...(given ? [] : invert(cashWords))], [p(T), "+", p(ex.carrying), ...(given ? [] : invert(cash))], x),
      },
    ];
  }
  return null;
}

const invert = (xs: MathExpr[]) => xs.map((s) => (s === "+" ? "−" : s === "−" ? "+" : s));

/**
 * Any other case. A life is searched month by month, shown as the months
 * around the answer; an amount moves the result by the same sum for every
 * shekel near the answer, so two trial values of X are enough to isolate it.
 */
function linear(v: Values, unknown: string, x: number, target: Target): Working[] {
  const name = TARGET_NAME[target.kind];
  if (IN_MONTHS.has(unknown)) {
    const months = Math.round(x * 12);
    const tries = [months - 12, months - 1, months, months + 1, months + 12].filter((n, i, a) => (unknown !== "usefulLife" || n >= 1) && a.indexOf(n) === i);
    return [
      { label: "אורך החיים מופיע במכנה ובחלוקה לשנות נכס, ולכן אין נוסחה פשוטה שמבודדת אותו. מחפשים: מציבים אורכי חיים שונים בחישוב המלא, עד שמתקבל בדיוק הנתון הידוע" },
      ...tries.map((n) => {
        const got = evaluate(v, unknown, n / 12, target);
        return { label: `X = ${n} חודשים (${p(round2(n / 12))} שנים)${n === months ? " ← מתאים" : ""}`, formula: `${target.label} = ${fmt(got)}${n === months ? " ✓" : ` (צריך ${fmt(target.amount)})`}` };
      }),
      { label: "התוצאה", formula: `X = ${months} חודשים = ${p(round2(x))} שנים` },
    ];
  }
  const trial = (d: number) => {
    const x1 = Math.max(0, round2(x === 0 ? d * 1000 : x * (1 - d)));
    const x2 = round2(x === 0 ? d * 2000 : x * (1 + d));
    const v1 = evaluate(v, unknown, x1, target);
    const v2 = evaluate(v, unknown, x2, target);
    const a = (v2 - v1) / (x2 - x1);
    return { x1, x2, v1, v2, a, est: x1 + (target.amount - v1) / a };
  };
  // Wide trials read best; narrower ones when the wide pair straddles a kink in the schedule.
  const t = [0.1, 0.01, 0.001].map(trial).find((c) => Number.isFinite(c.est) && Math.abs(c.est - x) <= 0.05) ?? trial(0.001);
  const as = String(Number(t.a.toFixed(6)));
  return [
    { label: `${name} נגזר מלוח הפחת המלא (השיטה והאירועים). בסביבת הפתרון כל שקל ב-X משנה אותו באותו סכום — ולכן שני ניסיונות מספיקים כדי למצוא את X` },
    { label: `ניסיון 1: מציבים X = ${p(t.x1)} בחישוב המלא`, formula: `${target.label} = ${fmt(t.v1)}` },
    { label: `ניסיון 2: מציבים X = ${p(t.x2)} בחישוב המלא`, formula: `${target.label} = ${fmt(t.v2)}` },
    {
      label: "כמה משתנה הנתון לכל שקל ב-X",
      equation: eq("a", frac("נתון בניסיון 2 − נתון בניסיון 1", "X בניסיון 2 − X בניסיון 1"), frac(`${p(t.v2)} − ${p(t.v1)}`, `${p(t.x2)} − ${p(t.x1)}`), Number(t.a.toFixed(6)), "number"),
    },
    {
      label: "בידוד X: מתחילים מניסיון 1 ומוסיפים את מה שחסר עד הנתון הידוע",
      equation: eq("X", ["X בניסיון 1", "+", frac(`${name} הידוע − נתון בניסיון 1`, "a")], [p(t.x1), "+", frac(`${p(target.amount)} − ${p(t.v1)}`, as)], x),
    },
  ];
}

/**
 * Cost or residual from a result before any event: the share of the
 * depreciable amount written off by then (k) depends only on time (or units),
 * so the result is cost − (cost − residual) × k, or (cost − residual) × k.
 * Declining balance has no such share (its charge depends on the residual), so it is left to the general case.
 */
function kForm(inp: ReturnType<typeof parseInputs>, r: Run, unknown: string, x: number, target: Target): Working[] | null {
  if (inp.land || !["purchasePrice", "attributableCosts", "residual"].includes(unknown) || !["carrying", "accumulated", "depreciation"].includes(target.kind)) return null;
  const method = inp.method;
  if (method === "double-declining") return null;
  const isDep = target.kind === "depreciation";
  const end = isDep ? target.year * 12 + 12 : target.t;
  if (r.phases.filter((ph) => ph.t0 < end).length !== 1) return null;
  const ph = r.phases[0];
  const { cost: C, residual: R, purchasePrice: P, attributableCosts: A } = inp;
  const D = round2(C - R);
  if (D <= 0) return null;
  const from = isDep ? Math.max(target.year * 12, ph.t0) : ph.t0;
  const to = Math.min(end, ph.t0 + ph.months);
  if (to <= from) return null;
  const T = target.amount;
  const name = TARGET_NAME[target.kind];
  const kVal = isDep ? sumRange(r.depBy, from, to) / D : r.closing.get(Math.min(Math.max(target.t, r.start), r.stop))!.acc / D;
  const span = isDep ? `בשנת ${target.year}` : `עד ${target.label.split(" ליום ")[1] ?? "התאריך"}`;

  // What k is, by the method.
  let kStep: Working;
  if (method === "straight-line") {
    const n = to - from;
    kStep = { label: `k — החלק מבסיס הפחת שהופחת ${span} (קו ישר: לפי חודשים)`, equation: eq("k", frac(isDep ? "חודשי שימוש בשנה" : "חודשים שחלפו", "אורך חיים בחודשים"), frac(String(n), String(ph.months)), n / ph.months, "percent") };
  } else if (method === "units") {
    const used = round2(sum(ph.units.slice(from - ph.t0, to - ph.t0)));
    kStep = { label: `k — החלק מבסיס הפחת שהופחת ${span} (לפי יחידות תפוקה)`, equation: eq("k", frac("יחידות שהופקו", "סך היחידות הצפויות"), frac(p(used), p(ph.unitsLeft)), used / ph.unitsLeft, "percent") };
  } else {
    const parts = ph.blocks.map((bl) => ({ bl, share: overlap(ph.t0 + bl.from, ph.t0 + bl.from + bl.length, from, to) })).filter((z) => z.share > 0);
    const top = parts.map(({ bl, share }) => (share === bl.length ? p(bl.weight!) : `${p(bl.weight!)} × ${share}/${bl.length}`)).join(" + ");
    const kSyd = sum(parts.map(({ bl, share }) => (bl.weight! * share) / bl.length)) / ph.digits;
    kStep = {
      label: `k — החלק מבסיס הפחת שהופחת ${span} (ספרות השנים: משקלי שנות הנכס שחלפו, חלקי סכום הספרות)`,
      equation: eq("k", frac("משקלי שנות הנכס שחלפו", "סכום הספרות"), frac(top, p(ph.digits)), kSyd, "percent"),
    };
  }
  // The share by the method must be the share in the schedule (to rounding), or this isn't the case it describes.
  if (Math.abs(kStep.equation!.result - kVal) > 1e-4) return null;
  const k = kVal;
  const ks = String(Number(k.toFixed(6)));
  const costX = unknown === "purchasePrice" ? (A ? `(X + ${p(A)})` : "X") : unknown === "attributableCosts" ? `(${p(P)} + X)` : p(C);
  const resX = unknown === "residual" ? "X" : p(R);
  const relation: Working = {
    label: `הקשר בין ${name} לנעלם`,
    equation:
      target.kind === "carrying"
        ? eq(name, ["עלות", "−", "(עלות − גרט)", "×", "k"], [costX, "−", `(${costX} − ${resX})`, "×", ks], T)
        : eq(name, ["(עלות − גרט)", "×", "k"], [`(${costX} − ${resX})`, "×", ks], T),
  };
  if (unknown === "residual") {
    const R2 = target.kind === "carrying" ? C - (C - T) / k : C - T / k;
    if (!close(R2, R)) return null;
    return [
      kStep,
      relation,
      {
        label: "בידוד X — ערך השייר",
        equation:
          target.kind === "carrying"
            ? eq("X", ["עלות", "−", frac("עלות − יתרה בספרים", "k")], [p(C), "−", frac(`${p(C)} − ${p(T)}`, ks)], x)
            : eq("X", ["עלות", "−", frac(name, "k")], [p(C), "−", frac(p(T), ks)], x),
      },
    ];
  }
  const C2 = target.kind === "carrying" ? (T - R * k) / (1 - k) : T / k + R;
  if (!close(C2, C)) return null;
  return [
    kStep,
    relation,
    {
      label: "בידוד העלות הכוללת",
      equation:
        target.kind === "carrying"
          ? eq("עלות", frac("יתרה בספרים − גרט × k", "1 − k"), frac(`${p(T)} − ${p(R)} × ${ks}`, `1 − ${ks}`), C)
          : eq("עלות", [frac(name, "k"), "+", "גרט"], [frac(p(T), ks), "+", p(R)], C),
    },
    unknown === "purchasePrice"
      ? { label: "בידוד X", equation: eq("X", ["עלות", "−", "עלויות המיוחסות במישרין"], [p(C), "−", p(A)], x) }
      : { label: "בידוד X", equation: eq("X", ["עלות", "−", "עלות ראשונית"], [p(C), "−", p(P)], x) },
  ];
}
