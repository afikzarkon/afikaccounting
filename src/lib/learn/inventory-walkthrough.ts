/**
 * The calculator's solution, worked the way the chosen cost formula works, in
 * five stages: the data placed in the method's table or formula, what is still
 * missing, how the extra givens fill it in, every operation on its own (formula,
 * numbers, result), and the answer with the way to it. Each step says why it is
 * done. The numbers are the engine's; this file only lays them out.
 */

import { dateLabel, fmtQty, type Method, METHOD_LABEL, type Period, type PeriodResult, statement } from "./inventory";
import { type Calc, type Cell, explainCosts, explainSolve, m, pc, sanityChecks, statementTable, stockCard, type TraceStep, type TraceTable, u } from "./inventory-explain";
import { type Known, knownLabel, type Metric, type Ref, type SolveResult, type Unknown } from "./inventory-solver";

export type WalkStage = { id: string; title: string; why: string; steps: TraceStep[] };
export type LetteredUnknown = Unknown & { letter: string };

export type WalkInput = {
  /** The year as solved: the unknowns already have their values. */
  period: Period;
  r: PeriodResult;
  /** Which year of the question this is. */
  year: number;
  /** Last year's result, when this year opens from its closing. */
  prev?: PeriodResult;
  unknowns: LetteredUnknown[];
  knowns: Known[];
  solved?: SolveResult;
};

const q = fmtQty;
const EPS = 1e-9;
const ILS = (v: number) => `${m(v)} ₪`;

/** The unknowns that sit in this year: their own, and a discount rate shared by every year. */
const unknownsOf = (us: LetteredUnknown[], year: number) => us.filter((x) => x.ref.year === year || (x.ref.t === "discountPct" && x.ref.allYears));

function unknownAt(us: LetteredUnknown[], test: (r: Ref) => boolean) {
  return us.find((x) => test(x.ref));
}

const qMark = (x?: LetteredUnknown) => (x ? `? (נעלם ${x.letter})` : undefined);

// ---------------------------------------------------------------------------
// Stage 1: the data, and where each number sits in the method.

type Layer = { name: string; units: number; unit: number; total: number; unknown?: LetteredUnknown; opening?: boolean };

/** The layers in the order FIFO uses them: the opening stock first, then the purchases by date. */
function availableLayers(x: WalkInput, us: LetteredUnknown[]): Layer[] {
  const { r, prev } = x;
  const out: Layer[] = [];
  const openU = unknownAt(us, (ref) => ref.t === "opening");
  if (prev && prev.layers.some((l) => l.units > EPS))
    for (const l of prev.layers.filter((l) => l.units > EPS)) out.push({ name: `${l.source} (נשאר מ-${prev.label})`, units: l.units, unit: l.cost / l.units, total: l.cost, opening: true });
  else if (r.openingUnits > EPS || openU) out.push({ name: "מלאי פתיחה", units: r.openingUnits, unit: r.openingUnits ? r.openingCost / r.openingUnits : 0, total: r.openingCost, unknown: openU, opening: true });
  const disc = unknownAt(us, (ref) => ref.t === "discountPct");
  for (const row of r.ledger) {
    if (row.kind !== "buy") continue;
    const i = row.index ?? 0;
    const own = unknownAt(us, (ref) => ref.t === "purchase" && ref.index === i);
    const shared = disc && x.period.purchases[i]?.discounts?.some((d) => "shared" in d && d.shared);
    out.push({ name: row.label, units: row.qty, unit: row.unitCost, total: row.amount, unknown: own ?? (shared ? disc : undefined) });
  }
  return out;
}

function intakeTable(x: WalkInput, us: LetteredUnknown[]): TraceTable {
  const { period, r, prev } = x;
  const rows: Cell[][] = [];
  const openU = unknownAt(us, (ref) => ref.t === "opening" && ref.field === "units");
  const openC = unknownAt(us, (ref) => ref.t === "opening" && ref.field === "cost");
  if (prev) rows.push(["מלאי פתיחה", "", q(r.openingUnits), r.openingUnits ? u(r.openingCost / r.openingUnits) : "—", r.openingCost, `= מלאי הסגירה של ${prev.label}`]);
  else if (r.openingUnits > EPS || openU || openC)
    rows.push(["מלאי פתיחה", "", qMark(openU) ?? q(r.openingUnits), openU || openC ? "?" : u(r.openingCost / (r.openingUnits || 1)), qMark(openC) ?? r.openingCost, "נתון בשאלה"]);
  else rows.push(["מלאי פתיחה", "", "0", "—", 0, "אין מלאי בתחילת השנה"]);
  period.purchases.forEach((p, i) => {
    const qu = unknownAt(us, (ref) => ref.t === "purchase" && ref.index === i && ref.field === "qty");
    const pu = unknownAt(us, (ref) => ref.t === "purchase" && ref.index === i && ref.field === "unitPrice");
    const terms = r.costs[i] && r.costs[i].lines.length > 1;
    rows.push([`רכישה ${i + 1}`, dateLabel(p.date), qMark(qu) ?? q(p.qty), qMark(pu) ?? u(p.unitPrice), qu || pu ? "?" : p.qty * p.unitPrice, terms ? "מחיר לפני הנחות ותוספות — העלות נבנית בשלב 4" : "מחיר רכישה"]);
  });
  period.sales.forEach((s, i) => {
    const qu = unknownAt(us, (ref) => ref.t === "sale" && ref.index === i && ref.field === "qty");
    const pu = unknownAt(us, (ref) => ref.t === "sale" && ref.index === i && ref.field === "unitPrice");
    const price = qMark(pu) ?? (s.unitPrice === undefined ? "—" : u(s.unitPrice));
    rows.push([`מכירה ${i + 1}`, dateLabel(s.date), qMark(qu) ?? q(s.qty), price, qu || pu ? "?" : s.unitPrice === undefined ? "—" : s.qty * s.unitPrice, "מחיר מכירה — לא עלות"]);
  });
  return { caption: "הנתונים כפי שהוזנו", head: ["שורה", "תאריך", "כמות (יח׳)", "מחיר ליחידה", "סה״כ ₪", "הערה"], rows };
}

function placement(x: WalkInput, us: LetteredUnknown[]): TraceStep {
  const { r } = x;
  const method = r.method;
  if (method === "fifo") {
    const layers = availableLayers(x, us);
    return {
      id: "w-place",
      title: "הצבה בשיטה: שכבות FIFO",
      why: "ב-FIFO כל רכישה נשמרת כ\"שכבה\" נפרדת עם המחיר שלה. השכבה הראשונה ברשימה היא הוותיקה — ממנה יוצאות המכירות הראשונות, ולכן הסדר חשוב.",
      text: [`יש ${layers.length} שכבות. המכירות יורדות מלמעלה למטה; מה שלא נמכר — השכבות התחתונות, החדשות — הוא מלאי הסגירה.`],
      tables: [
        {
          caption: "השכבות לפי הסדר — מהוותיקה לחדשה",
          head: ["#", "שכבה", "יחידות", "עלות ליחידה", "עלות השכבה"],
          rows: layers.map((l, i) => [String(i + 1), l.name, l.unknown && l.unknown.ref.t !== "discountPct" && "field" in l.unknown.ref && l.unknown.ref.field === "qty" ? qMark(l.unknown)! : q(l.units), l.unknown ? qMark(l.unknown)! : u(l.unit), l.unknown ? "?" : l.total]),
          foot: ["", "סה״כ זמין למכירה", q(r.availableUnits), "", us.some((z) => z.ref.t !== "sale") ? "?" : r.availableCost],
        },
      ],
    };
  }
  const costU = us.filter((z) => z.ref.t !== "sale");
  if (method === "wa-periodic") {
    const layers = availableLayers(x, us);
    const openCost = layers.filter((l) => l.opening).reduce((s, l) => s + l.total, 0);
    const purch = layers.filter((l) => !l.opening);
    const openUnknown = layers.some((l) => l.opening && l.unknown);
    return {
      id: "w-place",
      title: "הצבה בשיטה: סל אחד לכל השנה",
      why: "בממוצע תקופתי כל היחידות שהיו זמינות בשנה נכנסות לסל אחד, ולכולן אותה עלות ממוצעת. לא משנה מתי נמכרה יחידה — רק כמה יחידות נמכרו.",
      text: ["המכירות לא נכנסות לנוסחת הממוצע. הכמות שלהן קובעת רק כמה יחידות יוצאות מהסל בעלות הממוצעת."],
      tables: [
        {
          caption: "מה נכנס לסל",
          head: ["", "יחידות", "עלות ליחידה", "עלות"],
          rows: layers.map((l) => [l.name, q(l.units), l.unknown ? qMark(l.unknown)! : u(l.unit), l.unknown ? "?" : l.total]),
          foot: ["סה״כ בסל", q(r.availableUnits), "", costU.length ? "?" : r.availableCost],
        },
      ],
      formula: [
        "ממוצע = (עלות מלאי הפתיחה + עלות כל הקניות) ÷ (יח׳ פתיחה + יח׳ שנקנו)",
        `ממוצע = (${openUnknown ? "?" : m(openCost)} + ${purch.map((l) => (l.unknown ? "?" : m(l.total))).join(" + ") || "0"}) ÷ (${q(r.openingUnits)} + ${purch.map((l) => q(l.units)).join(" + ") || "0"})`,
      ],
    };
  }
  const rows: Cell[][] = r.ledger.map((row) => {
    const i = row.index ?? -1;
    if (row.kind === "open") return ["", "מלאי פתיחה", q(row.qty), row.amount, ""];
    if (row.kind === "buy") {
      const un = availableLayers(x, us).find((l) => l.name === row.label)?.unknown;
      return [dateLabel(row.date), row.label, q(row.qty), un ? "?" : row.amount, ""];
    }
    const sq = row.kind === "sell" ? unknownAt(us, (ref) => ref.t === "sale" && ref.index === i && ref.field === "qty") : undefined;
    return [dateLabel(row.date), row.kind === "shrink" ? "חוסר בספירה" : row.label, "", null, qMark(sq) ?? q(row.qty)];
  });
  return {
    id: "w-place",
    title: "הצבה בשיטה: כרטיס מלאי לפי סדר התאריכים",
    why: "בממוצע נע הזמן קובע: כל רכישה משנה את הממוצע, וכל מכירה יוצאת בממוצע שהיה באותו רגע. לכן מסדרים את כל התנועות לפי תאריך לפני שמחשבים.",
    text: ["עמודות הממוצע והיתרה ימולאו בשלב החישוב, שורה אחר שורה."],
    tables: [{ caption: "התנועות לפי הסדר", head: ["תאריך", "תנועה", "נכנס (יח׳)", "עלות הרכישה", "יצא (יח׳)"], rows }],
  };
}

function dataStage(x: WalkInput, us: LetteredUnknown[]): WalkStage {
  return {
    id: "data",
    title: "קליטת הנתונים",
    why: "לפני שמחשבים, מסדרים את מה שהשאלה נותנת. כך רואים מה ידוע, מה חסר, ואיפה כל מספר ייכנס.",
    steps: [
      {
        id: "w-intake",
        title: "מה הוזן",
        why: "רשימה אחת של כל הנתונים — כדי לא לפספס נתון ולזהות מיד את סימני השאלה.",
        text: [`שיטת ההערכה שנבחרה: ${METHOD_LABEL[x.r.method]}.`],
        tables: [intakeTable(x, us)],
      },
      placement(x, us),
    ],
  };
}

// ---------------------------------------------------------------------------
// Stage 2: what is missing.

function blocks(ref: Ref, method: Method): string {
  switch (ref.t) {
    case "purchase":
      return ref.field === "qty"
        ? "בלעדיה לא ידוע כמה יחידות נכנסו — ולכן גם לא כמה נשארו בסוף."
        : method === "fifo"
          ? "בלעדיו לא ידועה העלות של השכבה הזו — ולכן לא ערך המלאי ועלות המכר."
          : "בלעדיו אי אפשר לחשב את העלות הממוצעת.";
    case "sale":
      return ref.field === "qty" ? "בלעדיה לא ידוע כמה יחידות יצאו — ולכן לא ידועים מלאי הסגירה ועלות המכר." : "בלעדיו לא ידועות המכירות, ולכן לא הרווח הגולמי. עלות המלאי לא תלויה בו.";
    case "discountPct":
      return "בלעדיו לא ידועה עלות הרכישות שההנחה חלה עליהן.";
    case "opening":
      return ref.field === "units" ? "בלעדיה לא ידוע כמה יחידות היו זמינות למכירה." : "בלעדיה לא ידועה עלות הסחורה שהייתה זמינה למכירה.";
  }
}

/** What an unknown, once found, lets the working go on to. */
function opens(ref: Ref, method: Method): string {
  switch (ref.t) {
    case "purchase":
      return ref.field === "qty" ? "כשהכמות ידועה, ידוע כמה יחידות נכנסו — ואפשר לגלגל את הכמויות." : method === "fifo" ? "כשהמחיר ידוע, ידועה עלות השכבה — ואפשר להעריך את המלאי." : "כשהמחיר ידוע, אפשר לחשב את העלות הממוצעת.";
    case "sale":
      return ref.field === "qty" ? "כשהכמות ידועה, ידוע כמה יחידות יצאו — ומשם מלאי הסגירה ועלות המכר." : "כשהמחיר ידוע, ידועות המכירות — ומשם הרווח הגולמי.";
    case "discountPct":
      return "כששיעור ההנחה ידוע, ידועה עלות כל רכישה שההנחה חלה עליה.";
    case "opening":
      return "כשמלאי הפתיחה ידוע, ידוע מה היה זמין למכירה.";
  }
}

export type MissingInput = { period: Period; year: number; method: Method; unknowns: LetteredUnknown[]; knowns: Known[]; needsDates?: boolean; error?: string };

/** What the question asks, what it doesn't give, and what that blocks — also when the answer can't be reached yet. */
export function missingStage(x: MissingInput): WalkStage {
  const us = unknownsOf(x.unknowns, x.year);
  const steps: TraceStep[] = [
    {
      id: "w-goal",
      title: "מה מחפשים",
      why: "כשיודעים מה צריך למצוא, יודעים אילו נתונים דרושים לכל תשובה.",
      text: [],
      walk: [
        `כמה יחידות נשארו במלאי הסגירה, ומה הערך שלהן לפי ${METHOD_LABEL[x.method]}.`,
        "עלות המכר — מה עלו היחידות שנמכרו.",
        "המכירות והרווח הגולמי (מכירות נטו − עלות המכר).",
      ],
    },
  ];
  const holes: string[] = [];
  for (const un of us) holes.push(`${un.label}: ${blocks(un.ref, x.method)}`);
  x.period.sales.forEach((s, i) => {
    if (s.unitPrice === undefined && !us.some((un) => un.ref.t === "sale" && un.ref.index === i && un.ref.field === "unitPrice"))
      holes.push(`לא הוזן מחיר ל-מכירה ${i + 1}: אפשר לחשב את המלאי ואת עלות המכר, אבל המכירות והרווח הגולמי יחושבו בלעדיה.`);
  });
  if (x.needsDates && [...x.period.purchases, ...x.period.sales].some((e) => !e.date))
    holes.push(`חסרים תאריכים: ב${x.method === "moving-avg" ? "ממוצע נע" : "שיטה תמידית"} הסדר בזמן קובע את העלות של כל מכירה — הזינו תאריך לכל רכישה ומכירה.`);
  if (!x.period.purchases.length) holes.push("אין רכישות בשנה הזו — הזינו לפחות רכישה אחת.");
  const free = us.length - Math.min(us.length, x.knowns.length);
  if (free > 0) holes.push(`יש ${us.length} נעלמים ורק ${x.knowns.length} נתונים שמגלים אותם — חסר עוד ${free === 1 ? "נתון אחד" : `${free} נתונים`} (שלב 2 במחשבון).`);
  steps.push({
    id: "w-holes",
    title: us.length ? `מה חסר: ${us.length === 1 ? "נעלם אחד" : `${us.length} נעלמים`}` : "מה חסר",
    why: us.length ? "כל סימן שאלה עוצר חלק מהחישוב. מזהים בדיוק מה הוא עוצר, כדי לדעת איזה נתון נוסף ישחרר אותו." : "בודקים שאין חור בנתונים לפני שמתחילים לחשב.",
    text: holes.length ? [] : ["לא חסר דבר: כל הכמויות והמחירים ידועים, ואפשר לעבור ישר לחישוב."],
    walk: holes.length ? holes : undefined,
    checks: x.error ? [{ ok: false, text: x.error }] : us.length && !free ? [{ ok: true, text: `יש מספיק נתונים נוספים כדי למצוא ${us.length === 1 ? "אותו" : "את כולם"} — ראו בשלב הבא.` }] : undefined,
  });
  return { id: "missing", title: "מה חסר לנו", why: "מזהים מה לא ידוע לפני שמחשבים — אחרת מגלים באמצע שאי אפשר להמשיך.", steps };
}

// ---------------------------------------------------------------------------
// Stage 3: how the extra givens help.

function enters(metric: Metric, method: Method): string {
  switch (metric) {
    case "closingUnits":
    case "soldUnits":
      return "בגלגול הכמויות: פתיחה + קניות − מכירות = סגירה.";
    case "closingCost":
    case "closingCarrying":
      return method === "fifo" ? "בערך השכבות שנשארו במלאי." : "בהצבת הממוצע: ממוצע × יחידות שנשארו.";
    case "avgCost":
      return method === "moving-avg" ? "בממוצע הנע אחרי התנועה האחרונה." : "בנוסחת הממוצע: סך העלות ÷ סך היחידות.";
    case "saleCost":
      return method === "fifo" ? "בעלות של מכירה אחת — לפי השכבות שמהן יצאה." : method === "moving-avg" ? "בעלות של מכירה אחת — כמות × הממוצע ברגע המכירה." : "בעלות של מכירה אחת — כמות × הממוצע השנתי.";
    case "purchaseDiscount":
    case "purchaseTotal":
    case "purchasesCost":
      return "בבניית עלות הרכישות — לפני ההצבה בשיטה.";
    case "saleRevenue":
    case "salePriceChange":
      return "בחישוב המכירות: כמות × מחיר מכירה.";
    case "netSales":
      return "במכירות נטו, בראש הדוח.";
    case "cogs":
      return "בעלות המכר: פתיחה + קניות − סגירה.";
    case "grossProfit":
    case "gpPct":
    case "gpPctChange":
      return "בדוח הרווח הגולמי — עובדים ממנו אחורה אל הנעלם.";
  }
}

const knownValue = (k: Known) => (k.metric === "gpPct" || k.metric === "gpPctChange" ? pc(k.value) : k.metric === "salePriceChange" ? "אותו מחיר" : k.metric === "closingUnits" || k.metric === "soldUnits" ? `${q(k.value)} יח׳` : ILS(k.value));

function extrasStage(x: WalkInput, us: LetteredUnknown[]): WalkStage {
  const { period, r, prev, solved } = x;
  const method = r.method;
  const steps: TraceStep[] = [];
  const eqSteps = solved?.equations.length ? explainSolve(solved) : [];
  solved?.equations.forEach((e, i) => {
    if (!us.some((un) => un.label === e.unknown)) return;
    const k = x.knowns.find((kk) => knownLabel(kk) === e.known) ?? x.knowns.find((kk) => (kk.metric === "gpPct" || kk.metric === "gpPctChange") && e.known.startsWith("רווח גולמי"));
    const un = us.find((z) => z.label === e.unknown)!;
    const value = solved.values[un.id];
    steps.push({
      id: `w-eq-${i}`,
      title: `${k ? knownLabel(k) : e.known} ← מגלה את נעלם ${un.letter}`,
      why: "נתון נוסף נותן משוואה: כשמציבים בה את כל מה שידוע, נשאר בה רק הנעלם — ואפשר לבודד אותו.",
      text: [
        ...(k ? [`הנתון: ${knownLabel(k)} = ${knownValue(k)}.`, `איפה הוא נכנס: ${enters(k.metric, method)}`] : []),
        `מה הוא משלים: ${opens(un.ref, method)}`,
      ],
      formula: eqSteps[i]?.formula,
      calcs: [
        {
          label: `בידוד נעלם ${un.letter}`,
          formula: "a·x + b = הנתון  ⇐  x = (הנתון − b) ÷ a",
          sub: `x = (${m(e.target)} − ${m(e.b)}) ÷ ${u(e.a)}`,
          result: un.ref.t === "discountPct" ? pc(value) : u(value),
          note: "מכאן והלאה הנעלם הוא מספר רגיל — מציבים אותו בכל שלבי החישוב.",
        },
      ],
      checks: eqSteps[i]?.checks,
    });
  });
  if (prev)
    steps.push({
      id: "w-prev",
      title: `מלאי הפתיחה — מ-${prev.label}`,
      why: "שנה נפתחת במה שנשאר בסוף השנה הקודמת. בלי זה חסרות לנו יחידות ועלות בתחילת השנה.",
      text: [
        `מלאי הסגירה של ${prev.label}: ${q(prev.closingUnits)} יח׳ בעלות בספרים ${ILS(prev.closingCarrying)} — הוא מלאי הפתיחה כאן.`,
        method === "fifo" ? "ב-FIFO עוברות גם השכבות עצמן, כל אחת במחיר שלה — והן הראשונות שיימכרו השנה." : "בשיטת ממוצע הוא נכנס כשורה אחת: כמות ועלות.",
      ],
    });
  if (r.costs.some((c) => c.lines.length > 1))
    steps.push({
      id: "w-terms",
      title: "תנאי הרכישה (הנחות, הובלה, מכס, מימון)",
      why: "המלאי נרשם בעלות שלו, לא במחיר המחירון. התנאים קובעים כמה באמת עלתה כל יחידה.",
      text: [`נכנסים ראשונים — לפני ההצבה בשיטה: הם קובעים את העלות ליחידה של כל ${method === "fifo" ? "שכבה" : "רכישה"}. החישוב המלא — בשלב 4.`],
    });
  if (r.nrvTotal !== undefined)
    steps.push({
      id: "w-nrv",
      title: "שווי מימוש נטו",
      why: "מלאי לא מוצג ביותר ממה שאפשר לקבל עליו. הנתון הזה בודק אם צריך להוריד את ערכו.",
      text: [`נכנס בסוף: אחרי שמוצאים את מלאי הסגירה בעלות, משווים אותו לשווי המימוש נטו (${ILS(r.nrvTotal)}) ולוקחים את הנמוך.`],
    });
  if (r.saleQtyDiscounts + r.custDiscounts + r.custReturns > 0.005)
    steps.push({
      id: "w-cust",
      title: "הנחות והחזרות ללקוחות",
      why: "הן מקטינות את ההכנסה, לא את עלות המלאי.",
      text: [`נכנסות בחישוב המכירות נטו: ${ILS(r.saleQtyDiscounts + r.custDiscounts + r.custReturns)} מנוכים מהמכירות ברוטו.`],
    });
  if (period.countedUnits !== undefined)
    steps.push({
      id: "w-count",
      title: "ספירת מלאי",
      why: "הספירה אומרת כמה יחידות באמת יש במחסן — לפעמים פחות ממה שבספרים.",
      text: [r.shrinkUnits > 0 ? `נספרו ${q(period.countedUnits)} יח׳, פחות מהספרים: ${q(r.shrinkUnits)} יח׳ חוסר יוצאות מהמלאי כמו מכירה, ועלותן נכנסת לעלות המכר.` : `נספרו ${q(period.countedUnits)} יח׳ — אין חוסר.`],
    });
  if (!steps.length)
    steps.push({ id: "w-none", title: "אין נתונים נוספים", why: "לא כל שאלה צריכה רמזים — כשאין נעלם, הנתונים הבסיסיים מספיקים.", text: ["הכמויות והמחירים שהוזנו מספיקים לכל החישוב."] });
  return { id: "extras", title: "איך הנתונים הנוספים עוזרים", why: "נתון נוסף משלים חור בתמונה: מגלה נעלם, או מתקן את הסכום. כאן רואים מה כל אחד משלים ובאיזה שלב הוא נכנס.", steps };
}

// ---------------------------------------------------------------------------
// Stage 4: the working, one operation at a time.

function costsStep(x: WalkInput): TraceStep | null {
  const { period, r } = x;
  if (!r.costs.some((c) => c.lines.length > 1)) return null;
  const table = explainCosts(period, r).tables;
  return {
    id: "w-cost",
    title: "עלות כל רכישה",
    why: "המלאי נרשם בעלות: מחיר, פחות הנחות, ועוד מה שהביא את הסחורה למחסן. את העלות הזו מציבים בשיטה — לא את מחיר המחירון.",
    text: [],
    calcs: r.costs.map((c, i) => {
      const parts = [m(c.gross), ...(c.discount ? [`− ${m(c.discount)}`] : []), ...(c.financing ? [`− ${m(c.financing)}`] : []), ...(c.extras ? [`+ ${m(c.extras)}`] : [])];
      return {
        label: `רכישה ${i + 1}: ${q(period.purchases[i].qty)} יח׳`,
        formula: "עלות = מחיר ברוטו − הנחות − רכיב מימון + עלויות שנכללות",
        sub: parts.join(" "),
        result: `${ILS(c.total)} (${u(c.perUnit)} ליח׳)`,
        note: c.excluded ? `${m(c.excluded)} ₪ נשארו מחוץ לעלות — הוצאה בתקופה או מס בר-קיזוז.` : undefined,
      };
    }),
    tables: table,
  };
}

function quantitiesStep(r: PeriodResult): TraceStep {
  return {
    id: "w-qty",
    title: "גלגול הכמויות",
    why: "קודם יחידות, אחר כך שקלים: צריך לדעת כמה יחידות נשארו לפני שקובעים כמה הן שוות.",
    text: [],
    calcs: [
      { label: "יחידות זמינות למכירה", formula: "יח׳ פתיחה + יח׳ שנקנו", sub: `${q(r.openingUnits)} + ${q(r.purchasesUnits)}`, result: `${q(r.availableUnits)} יח׳` },
      {
        label: "יחידות במלאי הסגירה",
        formula: r.shrinkUnits ? "זמינות − נמכרו − חוסר בספירה" : "זמינות − נמכרו",
        sub: `${q(r.availableUnits)} − ${q(r.soldUnits)}${r.shrinkUnits ? ` − ${q(r.shrinkUnits)}` : ""}`,
        result: `${q(r.closingUnits)} יח׳`,
      },
    ],
    checks: r.errors.length ? r.errors.map((e) => ({ ok: false, text: e })) : undefined,
  };
}

function fifoSteps(x: WalkInput, us: LetteredUnknown[]): TraceStep[] {
  const { r } = x;
  const layers = availableLayers(x, us);
  const outRows = r.ledger.filter((row) => row.kind === "sell" || row.kind === "shrink");
  // A periodic count can take units the books sold before they were bought: then the year's sales come off the oldest layers in one go.
  const together = outRows.some((row) => (row.slices ?? []).reduce((s, sl) => s + sl.units, 0) < row.qty - EPS);
  const steps: TraceStep[] = [];
  // The layers are used up in order, so each slice is the next layer's.
  let at = 0;
  let left = layers[0]?.units ?? 0;
  const next = (units: number) => {
    const name = layers[at]?.name ?? "";
    left -= units;
    if (left <= EPS) left = layers[++at]?.units ?? 0;
    return name;
  };
  if (!together && outRows.length) {
    const tableRows: Cell[][] = [];
    const calcs: Calc[] = outRows.map((row) => {
      const parts = (row.slices ?? []).map((sl) => {
        const name = next(sl.units);
        tableRows.push([row.kind === "shrink" ? "חוסר בספירה" : row.label, name, q(sl.units), u(sl.cost / sl.units), sl.cost]);
        return { name, units: sl.units, unit: sl.cost / sl.units };
      });
      return {
        label: `${row.kind === "shrink" ? "חוסר בספירה" : row.label}: ${q(row.qty)} יח׳`,
        formula: parts.length > 1 ? "Σ (יחידות מכל שכבה × עלות השכבה ליחידה), מהוותיקה" : "יחידות × עלות ליחידה של השכבה הוותיקה",
        sub: parts.map((p) => `${q(p.units)} × ${u(p.unit)} (${p.name})`).join(" + "),
        result: ILS(row.amount),
        note: `${parts.length > 1 ? "השכבה הוותיקה לא הספיקה — המשכנו לשכבה הבאה. " : ""}אחרי ${row.kind === "shrink" ? "החוסר" : "המכירה"} נשארו ${q(row.units)} יח׳ במחסן.`,
      };
    });
    steps.push({
      id: "w-fifo-out",
      title: "מאיזו שכבה יצאה כל מכירה",
      why: "ב-FIFO היחידות הוותיקות יוצאות ראשונות: כל מכירה לוקחת מהשכבה הוותיקה שעוד יש בה יחידות, ורק כשהיא נגמרת עוברת לבאה.",
      text: [],
      calcs,
      tables: [{ caption: "פירוט היציאות לפי שכבה", head: ["יציאה", "מהשכבה", "יחידות", "עלות ליחידה", "עלות"], rows: tableRows, foot: ["סה״כ יצא", "", q(r.soldUnits + r.shrinkUnits), "", r.saleCosts.reduce((s, v) => s + v, 0) + r.shrinkCost] }],
    });
  } else if (outRows.length) {
    let need = r.soldUnits + r.shrinkUnits;
    const calcs: Calc[] = [];
    for (const l of layers) {
      if (need <= EPS) break;
      const take = Math.min(need, l.units);
      calcs.push({ label: `מתוך ${l.name}`, formula: "יחידות × עלות ליחידה", sub: `${q(take)} × ${u(l.unit)}`, result: ILS(take * l.unit), note: take < l.units - EPS ? `רק ${q(take)} מתוך ${q(l.units)} — זה מה שעוד היה חסר.` : "השכבה כולה." });
      need -= take;
    }
    steps.push({
      id: "w-fifo-out",
      title: `${q(r.soldUnits + r.shrinkUnits)} היחידות שיצאו — מהשכבות הוותיקות`,
      why: "בספירה תקופתית לא משנה מתי נמכרה כל יחידה, רק כמה נמכרו בשנה: לוקחים את כולן יחד מהשכבות הוותיקות.",
      text: [],
      calcs,
    });
  }
  // FIFO's layers are kept at the carrying amount; at cost they are scaled back.
  const toCost = r.closingCarrying > EPS ? r.closingCostBasis / r.closingCarrying : 1;
  const kept = r.layers.filter((l) => l.units > EPS);
  const names = layers.slice(layers.length - kept.length).map((l) => l.name);
  const parts = kept.map((l, i) => ({ name: names[i] ?? l.source, units: l.units, unit: (l.cost * toCost) / l.units, total: l.cost * toCost }));
  steps.push({
    id: "w-fifo-left",
    title: "מה נשאר במלאי — השכבות החדשות",
    why: "מה שלא יצא הוא מה שנקנה אחרון. מעריכים כל שכבה שנשארה במחיר שלה, ומחברים.",
    text: [],
    calcs: [
      ...parts.map((p) => ({ label: p.name, formula: "יחידות שנשארו × עלות ליחידה", sub: `${q(p.units)} × ${u(p.unit)}`, result: ILS(p.total) })),
      { label: "מלאי הסגירה בעלות", formula: "סכום השכבות שנשארו", sub: parts.map((p) => m(p.total)).join(" + ") || "0", result: ILS(r.closingCostBasis) },
    ],
  });
  const cogsBefore = r.availableCost - r.closingCostBasis;
  steps.push({
    id: "w-fifo-cogs",
    title: "עלות המכר בעלות — ובדיקה",
    why: "עלות המכר היא סכום העלויות של מה שיצא. בודקים שהיא מתאימה לחשבון ההפוך: כל מה שהיה זמין פחות מה שנשאר.",
    text: [],
    calcs: [
      { label: "עלות המכר (לפני שווי מימוש נטו)", formula: "סכום העלויות של היציאות", sub: [...r.saleCosts, ...(r.shrinkCost ? [r.shrinkCost] : [])].map(m).join(" + ") || "0", result: ILS(r.saleCosts.reduce((s, v) => s + v, 0) + r.shrinkCost) },
      { label: "בדיקה", formula: "עלות זמינה − מלאי סגירה בעלות", sub: `${m(r.availableCost)} − ${m(r.closingCostBasis)}`, result: ILS(cogsBefore) },
    ],
  });
  return steps;
}

function waSteps(r: PeriodResult): TraceStep[] {
  const avg = r.avgCost ?? 0;
  const buys = r.ledger.filter((row) => row.kind === "buy");
  const outUnits = r.soldUnits + r.shrinkUnits;
  const cogsBefore = r.availableCost - r.closingCostBasis;
  return [
    {
      id: "w-wa-avg",
      title: "חישוב העלות הממוצעת",
      why: "בממוצע תקופתי לכל יחידה בשנה אותה עלות. מחשבים אותה פעם אחת מכל מה שהיה זמין — ורק אז מציבים.",
      text: [],
      calcs: [
        { label: "סך היחידות בסל", formula: "יח׳ פתיחה + יח׳ שנקנו", sub: [q(r.openingUnits), ...buys.map((b) => q(b.qty))].join(" + "), result: `${q(r.availableUnits)} יח׳` },
        { label: "סך העלות בסל", formula: "עלות מלאי הפתיחה + עלות כל רכישה", sub: [m(r.openingCost), ...buys.map((b) => m(b.amount))].join(" + "), result: ILS(r.availableCost) },
        { label: "עלות ממוצעת ליחידה", formula: "סך העלות ÷ סך היחידות", sub: `${m(r.availableCost)} ÷ ${q(r.availableUnits)}`, result: `${u(avg)} ₪ ליח׳`, note: "לא מעגלים באמצע — מציבים את הממוצע המלא." },
      ],
    },
    {
      id: "w-wa-place",
      title: "הצבת הממוצע",
      why: "אותו ממוצע מוצב פעמיים: ביחידות שנשארו (מלאי הסגירה) וביחידות שיצאו (עלות המכר). יחד הן כל הסל.",
      text: [],
      calcs: [
        { label: "מלאי הסגירה בעלות", formula: "ממוצע × יחידות שנשארו", sub: `${u(avg)} × ${q(r.closingUnits)}`, result: ILS(r.closingCostBasis) },
        { label: "עלות המכר (לפני שווי מימוש נטו)", formula: "ממוצע × יחידות שיצאו", sub: `${u(avg)} × ${q(outUnits)}`, result: ILS(cogsBefore), note: `בדיקה: ${m(r.availableCost)} − ${m(r.closingCostBasis)} = ${m(cogsBefore)} — הסל מתחלק בדיוק לשניים.` },
      ],
    },
  ];
}

function movingSteps(r: PeriodResult): TraceStep[] {
  const calcs: Calc[] = [];
  let units = 0;
  let cost = 0;
  for (const row of r.ledger) {
    const bal = `יתרה: ${q(row.units)} יח׳ · ${m(row.cost)} ₪`;
    if (row.kind === "open") calcs.push({ label: "מלאי פתיחה", formula: "ממוצע פתיחה = עלות ÷ כמות", sub: `${m(row.amount)} ÷ ${q(row.qty)}`, result: `${u(row.avg)} ליח׳`, note: bal });
    else if (row.kind === "buy")
      calcs.push(
        units > EPS
          ? { label: `${dateLabel(row.date)} — ${row.label}: נכנסו ${q(row.qty)} יח׳`, formula: "ממוצע חדש = (עלות היתרה + עלות הרכישה) ÷ (יח׳ ביתרה + יח׳ שנקנו)", sub: `(${m(cost)} + ${m(row.amount)}) ÷ (${q(units)} + ${q(row.qty)})`, result: `${u(row.avg)} ליח׳`, note: `רכישה משנה את הממוצע. ${bal}` }
          : { label: `${dateLabel(row.date)} — ${row.label}: נכנסו ${q(row.qty)} יח׳ למחסן ריק`, formula: "ממוצע = עלות הרכישה ÷ כמות", sub: `${m(row.amount)} ÷ ${q(row.qty)}`, result: `${u(row.avg)} ליח׳`, note: bal },
      );
    else
      calcs.push({
        label: `${dateLabel(row.date)} — ${row.kind === "shrink" ? "חוסר בספירה" : row.label}: יצאו ${q(row.qty)} יח׳`,
        formula: "עלות היציאה = כמות × הממוצע הנוכחי",
        sub: `${q(row.qty)} × ${u(row.unitCost)}`,
        result: ILS(row.amount),
        note: `מכירה לא משנה את הממוצע. ${bal}`,
      });
    units = row.units;
    cost = row.cost;
  }
  const outs = r.ledger.filter((row) => row.kind === "sell" || row.kind === "shrink");
  return [
    {
      id: "w-ma-card",
      title: "כרטיס המלאי — תנועה אחר תנועה",
      why: "בממוצע נע הממוצע משתנה אחרי כל רכישה, ולכן כל מכירה מקבלת את הממוצע של הרגע שבו קרתה. עוברים על התנועות לפי הסדר ולא מדלגים.",
      text: [],
      calcs,
      tables: [stockCard(r)],
    },
    {
      id: "w-ma-sum",
      title: "סיכום הכרטיס",
      why: "השורה האחרונה בכרטיס היא מלאי הסגירה; סכום היציאות הוא עלות המכר.",
      text: [],
      calcs: [
        { label: "מלאי הסגירה בעלות", formula: "היתרה אחרי התנועה האחרונה", sub: `${q(r.closingUnits)} × ${u(r.avgCost ?? 0)}`, result: ILS(r.closingCostBasis) },
        { label: "עלות המכר (לפני שווי מימוש נטו)", formula: "סכום העלויות של כל היציאות", sub: outs.map((o) => m(o.amount)).join(" + ") || "0", result: ILS(outs.reduce((s, o) => s + o.amount, 0)), note: `בדיקה: ${m(r.availableCost)} − ${m(r.closingCostBasis)} = ${m(r.availableCost - r.closingCostBasis)}` },
      ],
    },
  ];
}

function nrvStep(period: Period, r: PeriodResult): TraceStep | null {
  if (r.nrvTotal === undefined) return null;
  const per = period.nrvPerUnit;
  const calcs: Calc[] = [];
  if (per !== undefined) calcs.push({ label: "שווי מימוש נטו של המלאי", formula: "יחידות שנשארו × שווי מימוש נטו ליחידה", sub: `${q(r.closingUnits)} × ${u(per)}`, result: ILS(r.nrvTotal) });
  const target = r.closingCarrying;
  calcs.push({ label: "מלאי הסגירה בספרים", formula: "הנמוך מבין העלות לשווי המימוש נטו", sub: `הנמוך מבין ${m(r.closingCostBasis)} ו-${m(r.nrvTotal)}`, result: ILS(target) });
  if (r.writeDown) calcs.push({ label: "הורדת ערך", formula: "עלות − שווי מימוש נטו", sub: `${m(r.closingCostBasis)} − ${m(target)}`, result: ILS(r.writeDown), note: "ההפרש נכנס לעלות המכר." });
  if (r.reversal) calcs.push({ label: "ביטול הורדת ערך", formula: "הסכום החדש − הסכום בספרים (עד העלות המקורית)", sub: `${m(target)} − ${m(r.closingCostBasis)}`, result: ILS(r.reversal), note: "הביטול מקטין את עלות המכר." });
  return {
    id: "w-nrv",
    title: "בדיקת שווי מימוש נטו",
    why: "מלאי לא מוצג ביותר ממה שאפשר לקבל עליו. אם שווי המימוש נמוך מהעלות — מורידים את הערך; אם לא — נשארים בעלות.",
    text: [r.writeDown || r.reversal ? "" : "העלות היא הנמוכה — אין הורדת ערך."].filter(Boolean),
    calcs,
  };
}

function salesStep(period: Period, r: PeriodResult): TraceStep | null {
  if (!period.sales.length) return null;
  const calcs: Calc[] = period.sales.map((s, i) => ({
    label: `מכירה ${i + 1}${s.date ? ` (${dateLabel(s.date)})` : ""}`,
    formula: "כמות × מחיר מכירה",
    sub: `${q(s.qty)} × ${s.unitPrice === undefined ? "?" : u(s.unitPrice)}`,
    result: ILS(s.qty * (s.unitPrice ?? 0)),
    note: s.unitPrice === undefined ? "לא הוזן מחיר — נחשב 0." : undefined,
  }));
  const disc = r.grossSales - r.netSales;
  if (period.sales.length > 1 || disc > 0.005)
    calcs.push({
      label: "מכירות נטו",
      formula: disc > 0.005 ? "סכום המכירות − הנחות והחזרות ללקוחות" : "סכום המכירות",
      sub: `${period.sales.map((s) => m(s.qty * (s.unitPrice ?? 0))).join(" + ")}${disc > 0.005 ? ` − ${m(disc)}` : ""}`,
      result: ILS(r.netSales),
    });
  return { id: "w-sales", title: "המכירות", why: "המכירות נמדדות במחיר המכירה, לא בעלות. הן לא משפיעות על ערך המלאי — רק על הרווח הגולמי.", text: [], calcs };
}

function statementStep(r: PeriodResult): TraceStep {
  return {
    id: "w-gp",
    title: "עלות המכר והרווח הגולמי",
    why: "זה המבנה של הדוח: מה היה זמין, פחות מה שנשאר, נותן את מה שנמכר. ההפרש בינו לבין המכירות הוא הרווח הגולמי.",
    text: [],
    calcs: [
      { label: "עלות המכר", formula: "מלאי פתיחה + קניות − מלאי סגירה (בספרים)", sub: `${m(r.openingCost)} + ${m(r.purchasesCost)} − ${m(r.closingCarrying)}`, result: ILS(r.cogs), note: r.writeDown ? `כוללת הורדת ערך ${m(r.writeDown)} ₪.` : undefined },
      { label: "רווח גולמי", formula: "מכירות נטו − עלות המכר", sub: `${m(r.netSales)} − ${m(r.cogs)}`, result: ILS(r.grossProfit) },
      ...(r.netSales ? [{ label: "שיעור הרווח הגולמי", formula: "רווח גולמי ÷ מכירות נטו", sub: `${m(r.grossProfit)} ÷ ${m(r.netSales)}`, result: pc(r.gpPct) }] : []),
    ],
    tables: [statementTable(statement(r))],
    checks: sanityChecks(r),
  };
}

function calcStage(x: WalkInput, us: LetteredUnknown[]): WalkStage {
  const { period, r } = x;
  const method: TraceStep[] = r.method === "fifo" ? fifoSteps(x, us) : r.method === "wa-periodic" ? waSteps(r) : movingSteps(r);
  const steps = [costsStep(x), quantitiesStep(r), ...method, nrvStep(period, r), salesStep(period, r), statementStep(r)].filter((s): s is TraceStep => !!s);
  return {
    id: "calc",
    title: `החישוב — ${METHOD_LABEL[r.method]}`,
    why: "כל פעולה בנפרד: הנוסחה, הצבת המספרים והתוצאה. כל תוצאה משמשת את השלב שאחריה.",
    steps,
  };
}

// ---------------------------------------------------------------------------
// Stage 5: the answer, and the way to it.

function finalStage(x: WalkInput, us: LetteredUnknown[]): WalkStage {
  const { r, solved } = x;
  const found = us.filter((un) => solved?.values[un.id] !== undefined);
  const rows: Cell[][] = [
    ...found.map((un) => [un.label, un.ref.t === "discountPct" ? pc(solved!.values[un.id]) : u(solved!.values[un.id])] as Cell[]),
    ["יחידות במלאי הסגירה", q(r.closingUnits)],
    ["מלאי הסגירה בספרים", r.closingCarrying],
    ["עלות המכר", r.cogs],
    ["מכירות נטו", r.netSales],
    ["רווח גולמי", r.grossProfit],
    ...(r.netSales ? [["שיעור הרווח הגולמי", pc(r.gpPct)] as Cell[]] : []),
  ];
  const avail = availableLayers(x, us);
  const path: string[] = [
    r.method === "fifo"
      ? `סידרנו את הנתונים ב-${avail.length} שכבות FIFO, מהוותיקה לחדשה.`
      : r.method === "wa-periodic"
        ? `שמנו את כל ${q(r.availableUnits)} היחידות של השנה בסל אחד.`
        : `סידרנו ${r.ledger.length} תנועות בכרטיס מלאי לפי תאריך.`,
  ];
  if (found.length) {
    const used = [...new Set(solved!.equations.filter((e) => found.some((f) => f.label === e.unknown)).map((e) => e.known))];
    path.push(`מצאנו את ${found.map((un) => `נעלם ${un.letter}`).join(" ואת ")} בעזרת ${used.join(", ") || "הנתונים הנוספים"}, והצבנו ${found.length === 1 ? "אותו" : "אותם"}.`);
  }
  path.push(
    r.method === "fifo"
      ? `כל מכירה יצאה מהשכבות הוותיקות; נשארו ${q(r.closingUnits)} יח׳ מהרכישות האחרונות, בעלות ${ILS(r.closingCostBasis)}.`
      : r.method === "wa-periodic"
        ? `חישבנו ממוצע אחד — ${u(r.avgCost ?? 0)} ₪ ליח׳ — והצבנו אותו ב-${q(r.closingUnits)} היחידות שנשארו: ${ILS(r.closingCostBasis)}.`
        : `עדכנו את הממוצע אחרי כל רכישה, וכל מכירה יצאה בממוצע של אותו רגע; בסוף נשארו ${q(r.closingUnits)} יח׳ בממוצע ${u(r.avgCost ?? 0)}: ${ILS(r.closingCostBasis)}.`,
  );
  if (r.writeDown) path.push(`שווי המימוש נטו נמוך מהעלות — הורדנו ${ILS(r.writeDown)}, ומלאי הסגירה בספרים ${ILS(r.closingCarrying)}.`);
  else if (r.reversal) path.push(`שווי המימוש נטו עלה — ביטלנו ${ILS(r.reversal)} מהורדת הערך.`);
  else if (r.nrvTotal !== undefined) path.push("שווי המימוש נטו לא נמוך מהעלות — המלאי נשאר בעלות.");
  path.push(`עלות המכר = ${m(r.openingCost)} + ${m(r.purchasesCost)} − ${m(r.closingCarrying)} = ${ILS(r.cogs)}; רווח גולמי = ${m(r.netSales)} − ${m(r.cogs)} = ${ILS(r.grossProfit)}${r.netSales ? ` (${pc(r.gpPct)})` : ""}.`);
  return {
    id: "final",
    title: "הפתרון הסופי",
    why: "התשובות במקום אחד, וסיכום קצר של הדרך — כדי לזכור איך הגענו, לא רק לאן.",
    steps: [
      { id: "w-answers", title: `התשובות — ${r.label}`, text: [], tables: [{ caption: "התשובות", head: ["", "תשובה"], rows }] },
      { id: "w-path", title: "הדרך בקצרה", text: [], walk: path },
    ],
  };
}

/** The whole solution of one year, in the chosen method's way. */
export function methodWalkthrough(x: WalkInput): WalkStage[] {
  const us = unknownsOf(x.unknowns, x.year);
  return [dataStage(x, us), missingStage({ period: x.period, year: x.year, method: x.r.method, unknowns: x.unknowns, knowns: x.knowns }), extrasStage(x, us), calcStage(x, us), finalStage(x, us)];
}

export function walkToText(stages: WalkStage[], stepsToText: (s: TraceStep[]) => string): string {
  return stages.map((s, i) => `▌${i + 1}. ${s.title}\n${s.why}\n\n${stepsToText(s.steps)}`).join("\n");
}
