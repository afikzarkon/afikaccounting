import { money, percent, plain } from "../format";
import { round2 } from "../math";
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

type Target = { kind: TargetKind; t: number; year: number; label: string; amount: number };

function readTarget(v: Values): Target {
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

/**
 * Bracket the root on a widening grid, then bisect, then take the nearest
 * cent. Robust where the result is flat over part of the range — a fair value
 * below the carrying amount creates no surplus at all.
 */
function solveAmount(f: (x: number) => number): number | null {
  let lo = 0;
  let fLo = f(lo);
  let bracket: number | null = null;
  for (let x = 1; x <= 1e10 && bracket === null; x *= 1.5) {
    const fx = f(x);
    if (Number.isFinite(fLo) && Number.isFinite(fx) && (fx === 0 || Math.sign(fx) !== Math.sign(fLo))) bracket = x;
    else [lo, fLo] = [x, fx];
  }
  if (bracket === null) return null;
  let hi: number = bracket;
  for (let i = 0; i < 200 && hi - lo > 1e-7; i++) {
    const mid: number = (lo + hi) / 2;
    const fm = f(mid);
    if (fm === 0 || Math.sign(fm) !== Math.sign(fLo)) hi = mid;
    else [lo, fLo] = [mid, fm];
  }
  const x1 = hi;
  // Results are rounded to the cent, so neighbouring cents can fit equally well: prefer a whole number.
  const nearest = [Math.round(x1), ...[-0.01, 0, 0.01].map((d) => round2(x1 + d))];
  const best = nearest.reduce((a, b) => (Math.abs(f(b)) < Math.abs(f(a)) ? b : a));
  return Number.isFinite(f(best)) && Math.abs(f(best)) <= 0.02 ? best : null;
}

/** Whole months between `lo` and `hi`, closest first. */
function solveMonths(f: (months: number) => number, lo: number, hi: number, target: number): number | null {
  let best: number | null = null;
  let bestGap = Infinity;
  for (let m = lo; m <= hi; m++) {
    const gap = Math.abs(f(m));
    if (Number.isFinite(gap) && gap < bestGap) [best, bestGap] = [m, gap];
  }
  return best !== null && bestGap <= Math.max(0.05, Math.abs(target) * 0.001) ? best : null;
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
  let x: number | null;
  if (IN_MONTHS.has(unknown)) {
    const lo = unknown === "usefulLife" ? 1 : base.renovation ? -(base.start + base.lifeMonths - base.renovation.at - 1) : 0;
    const months = solveMonths((m) => f(m / 12), lo, 1200, target.amount);
    x = months === null ? null : months / 12;
  } else {
    x = solveAmount(f);
    if (x !== null && x < 0) return { ok: false, field: "targetAmount", error: `הנעלם יצא שלילי (${plain(x)}); בדקו את נתון העזר.` };
  }
  if (x === null) return { ok: false, field: "targetAmount", error: "לא נמצא ערך של X שמתאים לנתון העזר. בדקו את הנתונים." };

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

  // Cost, residual or useful life, from a result before any event. (With land the
  // depreciable base is only the building, so the general line below is used.)
  if (sl && !inp.land && ["purchasePrice", "attributableCosts", "residual", "usefulLife"].includes(unknown) && ["carrying", "accumulated", "depreciation"].includes(target.kind)) {
    const { cost: C, residual: R, lifeMonths: L, start, purchasePrice: P, attributableCosts: A } = inp;
    const isDep = target.kind === "depreciation";
    const n = isDep ? overlap(start, start + L, target.year * 12, target.year * 12 + 12) : Math.min(target.t, start + L) - start;
    const nWords = isDep ? "חודשי שימוש בשנה" : "חודשים שחלפו";
    const costX = unknown === "purchasePrice" ? (A ? `(X + ${p(A)})` : "X") : unknown === "attributableCosts" ? `(${p(P)} + X)` : p(C);
    const resX = unknown === "residual" ? "X" : p(R);
    const lifeX = unknown === "usefulLife" ? "X" : String(L);
    const relation: Working = {
      label: `הקשר בין ${name} לנעלם (קו ישר)`,
      equation:
        target.kind === "carrying"
          ? eq(name, ["עלות", "−", frac(`(עלות − גרט) × ${nWords}`, "אורך חיים בחודשים")], [costX, "−", frac(`(${costX} − ${resX}) × ${n}`, lifeX)], T)
          : eq(name, frac(`(עלות − גרט) × ${nWords}`, "אורך חיים בחודשים"), frac(`(${costX} − ${resX}) × ${n}`, lifeX), T),
    };
    if (n <= 0) return null;

    if (unknown === "usefulLife") {
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
    if (unknown === "residual") {
      const R2 = target.kind === "carrying" ? C - ((C - T) * L) / n : C - (T * L) / n;
      if (!close(R2, R)) return null;
      return [
        relation,
        {
          label: "בידוד X — ערך השייר",
          equation:
            target.kind === "carrying"
              ? eq("X", ["עלות", "−", frac("(עלות − יתרה בספרים) × אורך חיים", nWords)], [p(C), "−", frac(`(${p(C)} − ${p(T)}) × ${L}`, String(n))], x)
              : eq("X", ["עלות", "−", frac(`${name} × אורך חיים`, nWords)], [p(C), "−", frac(`${p(T)} × ${L}`, String(n))], x),
        },
      ];
    }
    // Cost: isolate the total cost first, then the unknown component.
    const C2 = target.kind === "carrying" ? (T - (R * n) / L) / (1 - n / L) : (T * L) / n + R;
    if (!close(C2, C)) return null;
    const costStep: Working = {
      label: "בידוד העלות הכוללת",
      equation:
        target.kind === "carrying"
          ? eq("עלות", frac(`יתרה בספרים − גרט × ${nWords} ÷ אורך חיים`, `1 − ${nWords} ÷ אורך חיים`), frac(`${p(T)} − ${p(R)} × ${n} ÷ ${L}`, `1 − ${n} ÷ ${L}`), C)
          : eq("עלות", [frac(`${name} × אורך חיים`, nWords), "+", "גרט"], [frac(`${p(T)} × ${L}`, String(n)), "+", p(R)], C),
    };
    const component: Working =
      unknown === "purchasePrice"
        ? { label: "בידוד X", equation: eq("X", ["עלות", "−", "עלויות המיוחסות במישרין"], [p(C), "−", p(A)], x) }
        : { label: "בידוד X", equation: eq("X", ["עלות", "−", "עלות ראשונית"], [p(C), "−", p(P)], x) };
    return [relation, costStep, component];
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

/** Any other case: the full calculation is linear in X around the answer, so show that line and solve it. */
function linear(v: Values, unknown: string, x: number, target: Target): Working[] {
  const name = TARGET_NAME[target.kind];
  if (IN_MONTHS.has(unknown)) {
    const months = Math.round(x * 12);
    return [
      {
        label: "הקשר בין הנעלם לנתון אינו ליניארי (אורך החיים מופיע במכנה ובחלוקה לשנות נכס), ולכן X נמצא בחיפוש: החודש שבו החישוב המלא מחזיר בדיוק את הנתון הידוע",
        formula: `X = ${months} חודשים = ${p(round2(x))} שנים`,
      },
    ];
  }
  const d = Math.max(1, Math.abs(x) * 0.01);
  const a = (evaluate(v, unknown, x + d, target) - evaluate(v, unknown, x - d, target)) / (2 * d);
  const b = round2(target.amount - a * x);
  const as = String(Number(a.toFixed(6)));
  return [
    {
      label: "הנתון נגזר מלוח הפחת המלא (השיטה והאירועים), ובסביבת הפתרון הוא תלוי ב-X באופן ליניארי: a הוא השינוי בנתון לכל שקל ב-X",
      equation: eq(name, ["a", "×", "X", "+", "b"], [as, "×", "X", "+", p(b)], target.amount),
    },
    { label: "בידוד X", equation: eq("X", frac(`${name} − b`, "a"), frac(`${p(target.amount)} − ${p(b)}`, as), x) },
  ];
}
