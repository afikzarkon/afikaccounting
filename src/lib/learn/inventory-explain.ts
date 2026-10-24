/**
 * The working behind every inventory answer, as steps in Hebrew: a title, a
 * few sentences with the numbers in them, the formula, and a table. The page's
 * worked example, the practice solutions and the calculator all read these, so
 * a solution on the page is always the one the engine computed.
 */

import {
  dateLabel,
  fmtQty,
  type gpFire,
  type historyFire,
  type Method,
  METHOD_LABEL,
  type Period,
  type PeriodResult,
  statement,
} from "./inventory";
import { ROW_LABEL, type SolveResult, type TableInput, type TableResult } from "./inventory-solver";

export type Cell = string | number | null;
export type TraceTable = { caption?: string; head: string[]; rows: Cell[][]; foot?: Cell[]; strike?: number[]; highlight?: number[] };
export type TraceStep = { id: string; title: string; text: string[]; formula?: string[]; tables?: TraceTable[]; rules?: string[]; checks?: { ok: boolean; text: string }[] };

const nf2 = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });
const nf4 = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 4 });
/** An amount, up to two decimals. */
export const m = (v: number) => (v < 0 ? `(${nf2.format(-v)})` : nf2.format(v));
/** A unit cost, up to four decimals. */
export const u = (v: number) => nf4.format(v);
export const pc = (r: number) => `${nf2.format(r * 100)}%`;
const q = fmtQty;

// ---------------------------------------------------------------------------
// One period, start to finish.

export function explainCosts(period: Period, r: PeriodResult): TraceStep {
  const rows: Cell[][] = r.costs.map((c, i) => {
    const p = period.purchases[i];
    return [p.label ?? `רכישה ${i + 1}${p.date ? ` (${dateLabel(p.date)})` : ""}`, p.qty, c.gross, c.discount ? -c.discount : null, c.financing ? -c.financing : null, c.extras || null, c.total, u(c.perUnit)];
  });
  const details: TraceTable[] = r.costs
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.lines.length > 1)
    .map(({ c, i }) => ({
      caption: `${period.purchases[i].label ?? `רכישה ${i + 1}`}: בניית העלות`,
      head: ["רכיב", "סכום", "נכלל בעלות?", "סעיף"],
      rows: c.lines.map((l) => [l.label + (l.reason && !l.included ? ` — ${l.reason}` : ""), l.amount, l.included ? (l.kind === "price" ? "✓" : l.amount < 0 ? "✂ מנוכה" : "✓ נכלל") : "← הוצאה / לא נרשם", l.section ?? ""]),
      strike: c.lines.map((l, j) => (l.included ? -1 : j)).filter((j) => j >= 0),
      foot: ["עלות הרכישה", c.total, `${u(c.perUnit)} ליחידה`, ""],
    }));
  const excluded = r.costs.reduce((s, c) => s + c.excluded, 0);
  const financing = r.costs.reduce((s, c) => s + c.financing, 0);
  const text = [
    `עלות כל רכישה = מחיר הרכישה, פחות הנחות (ורכיב מימון אם יש), ועוד העלויות שהביאו את המלאי למיקומו ולמצבו. סך עלות הרכישות: ${m(r.purchasesCost)} ₪.`,
  ];
  if (excluded) text.push(`${m(excluded)} ₪ של עלויות נוספות נשארו מחוץ לעלות המלאי (הוצאה בתקופה או מס בר-קיזוז).`);
  if (financing) text.push(`${m(financing)} ₪ הם רכיב מימון — נרשמים כהוצאות מימון על פני תקופת האשראי, לא כעלות מלאי.`);
  return {
    id: "cost",
    title: "בניית העלות של כל רכישה",
    text,
    tables: [{ caption: "סיכום עלויות הרכישה", head: ["רכישה", "כמות", "מחיר", "הנחה", "מימון", "נלוות", "סה״כ", "ליחידה"], rows, foot: ["סה״כ", r.purchasesUnits, null, null, null, null, r.purchasesCost, ""] }, ...details],
    rules: ["R12", "R13", "R14", "R15", "R16"],
  };
}

export function explainQuantities(r: PeriodResult): TraceStep {
  const text = [`מלאי פתיחה ${q(r.openingUnits)} + רכישות ${q(r.purchasesUnits)} − מכירות ${q(r.soldUnits)}${r.shrinkUnits ? ` − חוסר בספירה ${q(r.shrinkUnits)}` : ""} = ${q(r.closingUnits)} יחידות במלאי הסגירה.`];
  if (r.openingUnits === 0) text.push("אין מלאי פתיחה (חברה שהוקמה השנה, או שהמלאי נמכר כולו).");
  return {
    id: "qty",
    title: "גלגול כמויות",
    text,
    formula: ["פתיחה + רכישות − מכירות = סגירה"],
    checks: r.errors.length ? r.errors.map((e) => ({ ok: false, text: e })) : undefined,
    rules: ["R5"],
  };
}

function fifoPeriodicTable(r: PeriodResult): TraceTable {
  // Read from the end: the closing units are the latest purchases.
  const rows: Cell[][] = [];
  for (let i = r.layers.length - 1; i >= 0; i--) {
    const l = r.layers[i];
    const full = r.ledger.find((x) => x.kind !== "sell" && x.label === l.source);
    const partial = full ? Math.abs(full.qty - l.units) > 1e-9 : false;
    rows.push([l.source + (partial ? ` (חלקית: ${q(l.units)} מתוך ${q(full!.qty)})` : ""), l.units, u(l.units ? l.cost / l.units : 0), l.cost]);
  }
  return { caption: "השכבות שנשארו במלאי — מתחילים מהרכישה האחרונה", head: ["שכבה", "יחידות", "עלות ליחידה", "עלות"], rows, foot: ["מלאי סגירה", r.closingUnits, "", r.closingCostBasis] };
}

function ledgerTable(r: PeriodResult, withSlices: boolean): TraceTable {
  const rows: Cell[][] = [];
  const highlight: number[] = [];
  for (const x of r.ledger) {
    const kind = x.kind === "buy" ? "רכישה" : x.kind === "open" ? "מלאי פתיחה" : x.kind === "shrink" ? "חוסר בספירה" : "מכירה";
    const outflow = x.kind === "sell" || x.kind === "shrink";
    if (x.kind === "buy") highlight.push(rows.length);
    rows.push([
      dateLabel(x.date),
      kind + (withSlices && x.slices?.length ? `: ${x.slices.map((s) => `${q(s.units)} מ${s.source}`).join(" + ")}` : ""),
      outflow ? -x.qty : x.qty,
      u(x.unitCost),
      outflow ? -x.amount : x.amount,
      withSlices ? null : u(x.avg),
      outflow ? x.amount : null,
    ]);
    rows.push(["", "יתרה", x.units, null, x.cost, withSlices ? null : u(x.avg), null]);
  }
  return {
    caption: withSlices ? "FIFO תמידי: בכל מכירה לוקחים מהשכבה הוותיקה ביותר" : "ממוצע נע: הממוצע מתעדכן רק ברכישה (השורות המודגשות)",
    head: ["תאריך", "מהות", "כמות", "עלות ליחידה", "עלות המלאי", withSlices ? "" : "מחיר ממוצע", "עלות המכירות"],
    rows,
    highlight,
    foot: ["", "סה״כ עלות המכירות", null, null, null, null, r.saleCosts.reduce((s, v) => s + v, 0) + r.shrinkCost],
  };
}

export function explainValuation(r: PeriodResult): TraceStep {
  if (r.method === "fifo") {
    const tables = [fifoPeriodicTable(r)];
    if (r.system === "perpetual" && r.ledger.length) tables.push(ledgerTable(r, true));
    return {
      id: "value",
      title: `הערכת מלאי הסגירה — ${METHOD_LABEL.fifo}`,
      text: [
        `נכנס ראשון — יוצא ראשון: מה שנמכר הוא הוותיק ביותר, ולכן ${q(r.closingUnits)} היחידות שנשארו הן מהרכישות האחרונות.`,
        `מורידים מסוף הרכישות את כמות הסגירה; שכבה שנלקחה חלקית מוערכת לפי חלקה. מלאי הסגירה בעלות: ${m(r.closingCostBasis)} ₪.`,
        "FIFO נותן אותה תוצאה בשיטה תקופתית ובשיטה תמידית.",
      ],
      tables,
      rules: ["R18"],
    };
  }
  if (r.method === "wa-periodic") {
    return {
      id: "value",
      title: `הערכת מלאי הסגירה — ${METHOD_LABEL["wa-periodic"]}`,
      text: [
        `ממוצע אחד לכל השנה: עלות מלאי הפתיחה ועלות כל הקניות, חלקי כל היחידות שהיו זמינות. תאריכי המכירות לא משפיעים.`,
        `מלאי הסגירה = ${u(r.avgCost ?? 0)} × ${q(r.closingUnits)} = ${m(r.closingCostBasis)} ₪.`,
      ],
      formula: [`(${m(r.openingCost)} + ${m(r.purchasesCost)}) ÷ (${q(r.openingUnits)} + ${q(r.purchasesUnits)}) = ${u(r.avgCost ?? 0)}`],
      rules: ["R19"],
    };
  }
  return {
    id: "value",
    title: `הערכת מלאי הסגירה — ${METHOD_LABEL["moving-avg"]}`,
    text: [
      "אחרי כל רכישה מחשבים ממוצע חדש: סך עלות המלאי ÷ סך היחידות. מכירה לא משנה את הממוצע — היא רק מוציאה יחידות בממוצע הקיים.",
      `מלאי הסגירה: ${q(r.closingUnits)} יחידות בעלות ${m(r.closingCostBasis)} ₪ (ממוצע ${u(r.avgCost ?? 0)}).`,
    ],
    tables: [ledgerTable(r, false)],
    rules: ["R20"],
  };
}

export function explainNrv(period: Period, r: PeriodResult): TraceStep | null {
  if (r.nrvTotal === undefined) return null;
  const per = period.nrvPerUnit;
  const text = [
    `שמ״נ${per !== undefined ? ` = ${q(r.closingUnits)} × ${u(per)}` : ""} = ${m(r.nrvTotal)} ₪, מול עלות של ${m(r.closingCostBasis)} ₪.`,
  ];
  if (r.writeDown) text.push(`השמ״נ נמוך מהעלות: מורידים ${m(r.writeDown)} ₪, והמלאי מוצג ב-${m(r.closingCarrying)} ₪. ההורדה נכנסת לעלות המכר.`);
  else if (r.reversal) text.push(`השמ״נ עלה: מבטלים ${m(r.reversal)} ₪ מהורדת הערך הקודמת — עד העלות המקורית בלבד. הביטול מקטין את עלות המכר.`);
  else text.push("השמ״נ לא נמוך מהעלות — אין הורדת ערך. רווח צפוי לא נרשם; הוא יוכר במכירה.");
  return { id: "nrv", title: "בדיקת שווי מימוש נטו", text, formula: ["מלאי בספרים = הנמוך מבין העלות לשמ״נ"], rules: ["R11", "R21", "R22"] };
}

export function statementTable(s: ReturnType<typeof statement>, caption?: string): TraceTable {
  return {
    caption: caption ?? "הדוח עד הרווח הגולמי",
    head: ["", "", ""],
    rows: [
      ["מכירות ברוטו", null, s.grossSales],
      ["(הנחות והחזרות)", null, -(s.custDiscounts + s.custReturns)],
      ["מכירות נטו", null, s.netSales],
      ["עלות המכר:", null, null],
      ["מלאי פתיחה", s.opening, null],
      ["קניות ברוטו", s.grossPurchases, null],
      ["(הנחות והחזרות)", -(s.suppDiscounts + s.suppReturns), null],
      ["קניות נטו", s.netPurchases, null],
      ["(מלאי סגירה)", -s.closing, null],
      ["סה״כ עלות המכר", null, -s.cogs],
    ],
    foot: [`רווח גולמי (${pc(s.gpPct)})`, null, s.grossProfit],
  };
}

export function sanityChecks(r: PeriodResult): { ok: boolean; text: string }[] {
  const out: { ok: boolean; text: string }[] = [];
  const cogsBefore = r.cogs - r.writeDown + r.reversal;
  out.push({ ok: Math.abs(r.availableCost - (cogsBefore + r.closingCostBasis)) < 0.01, text: `פתיחה + קניות = עלות המכר (לפני הורדת ערך) + סגירה: ${m(r.availableCost)} = ${m(cogsBefore)} + ${m(r.closingCostBasis)}` });
  if (r.method !== "fifo" && r.avgCost !== undefined && r.costs.length) {
    const unit = r.costs.map((c) => c.perUnit);
    if (r.openingUnits) unit.push(r.openingCost / r.openingUnits);
    const lo = Math.min(...unit);
    const hi = Math.max(...unit);
    out.push({ ok: r.avgCost >= lo - 1e-6 && r.avgCost <= hi + 1e-6, text: `העלות הממוצעת (${u(r.avgCost)}) בין העלות הנמוכה (${u(lo)}) לגבוהה (${u(hi)})` });
  }
  out.push({ ok: !r.errors.length && r.ledger.every((x) => x.units > -1e-9), text: "אף יתרת מלאי לא שלילית" });
  out.push({ ok: r.gpPct > -1e-9 && r.gpPct < 1, text: `שיעור רווח גולמי הגיוני: ${pc(r.gpPct)}` });
  return out;
}

export function explainStatement(r: PeriodResult): TraceStep {
  return {
    id: "statement",
    title: "הדוח עד הרווח הגולמי",
    text: [`עלות המכר = ${m(r.openingCost)} + ${m(r.purchasesCost)} − ${m(r.closingCarrying)} = ${m(r.cogs)} ₪. רווח גולמי = ${m(r.netSales)} − ${m(r.cogs)} = ${m(r.grossProfit)} ₪ (${pc(r.gpPct)} מהמכירות).`],
    formula: ["עלות המכר = מלאי פתיחה + קניות נטו − מלאי סגירה", "רווח גולמי = מכירות נטו − עלות המכר"],
    tables: [statementTable(statement(r))],
    checks: sanityChecks(r),
    rules: ["R5", "R7", "R8"],
  };
}

/** Every step of one year: costs, quantities, valuation, NRV, the statement. */
export function explainPeriod(period: Period, r: PeriodResult): TraceStep[] {
  const steps: TraceStep[] = [];
  if (r.costs.some((c) => c.lines.length > 1)) steps.push(explainCosts(period, r));
  steps.push(explainQuantities(r), explainValuation(r));
  const nrv = explainNrv(period, r);
  if (nrv) steps.push(nrv);
  steps.push(explainStatement(r));
  return steps;
}

// ---------------------------------------------------------------------------
// Unknowns.

/** One equation per unknown: what is known, the equation on its branch, the answer and its check. */
export function explainSolve(s: SolveResult): TraceStep[] {
  if (!s.ok && !s.equations.length) return [{ id: "solve-error", title: "פתרון הנעלמים", text: [s.error ?? "לא נמצא פתרון."] }];
  return s.equations.map((e, i) => {
    const text = [`ידוע: ${e.known}. מחפשים: ${e.unknown}.`];
    const formula: string[] = [];
    if (e.viaSales) {
      text.push(`עלות המכר אינה תלויה בנעלם (${m(e.viaSales.cogs)} ₪), ולכן המכירות הנדרשות = עלות המכר ÷ (1 − שיעור הרווח הגולמי).`);
      formula.push(`מכירות נטו = ${m(e.viaSales.cogs)} ÷ (1 − ${pc(e.viaSales.gpPct)}) = ${m(e.target)}`);
    }
    const ax = e.a === 1 ? "x" : e.a === -1 ? "−x" : `${u(e.a)}·x`;
    formula.push(`${ax}${e.b ? ` ${e.b < 0 ? "−" : "+"} ${m(Math.abs(e.b))}` : ""} = ${m(e.target)}`);
    formula.push(`x = (${m(e.target)} − ${m(e.b)}) ÷ ${u(e.a)} = ${u(e.x)}`);
    const got = s.residuals.find((r) => r.known === e.known);
    const checks = got ? [{ ok: Math.abs(got.got - got.value) < 0.005 + 1e-6, text: `אימות: מציבים x = ${u(e.x)} ומקבלים ${e.known} = ${m(got.got)}` }] : undefined;
    return { id: `solve-${i}`, title: `נעלם: ${e.unknown}`, text, formula, checks, rules: ["R30", "R31"] };
  });
}

// ---------------------------------------------------------------------------
// The statement with question marks.

export function explainTable(input: TableInput, r: TableResult): TraceStep[] {
  const steps: TraceStep[] = r.steps.map((s) => ({
    id: `t-${s.n}`,
    title: `${s.n}. ${ROW_LABEL[s.row]} ${input.years[s.year].label}`,
    text: [],
    formula: [s.equation, s.substitution],
    rules: [s.rule],
  }));
  if (r.missing.length)
    steps.push({ id: "t-missing", title: "מה לא ניתן לקבוע", text: r.missing.map((x) => `${ROW_LABEL[x.row]} ${input.years[x.year].label}: אין משוואה עם נעלם אחד שמגיעה אליו — חסר נתון באותה שורה או בשנה הסמוכה.`) });
  if (r.conflicts.length) steps.push({ id: "t-conflict", title: "אי-התאמות", text: r.conflicts });
  return steps;
}

// ---------------------------------------------------------------------------
// Fire and insurance.

export function explainGpFire(x: Parameters<typeof gpFire>[0], r: ReturnType<typeof gpFire>): TraceStep[] {
  const steps: TraceStep[] = [];
  if (x.rates.length > 1)
    steps.push({ id: "f-rate", title: "שיעור הרווח הגולמי לפי הפוליסה", text: [`ממוצע השיעורים: (${x.rates.map(pc).join(" + ")}) ÷ ${x.rates.length} = ${pc(r.rate)}.`], rules: ["D9"] });
  steps.push({
    id: "f-roll",
    title: "המלאי בתאריך השריפה",
    text: [`עלות המכר עד השריפה = ${m(x.sales)} × (1 − ${pc(r.rate)}) = ${m(r.cogs)}.`, `מלאי בתאריך השריפה = ${m(x.opening)} + ${m(x.purchases)} − ${m(r.cogs)} = ${m(r.atFire)}.`],
    formula: ["מלאי בשריפה = פתיחה + קניות עד התאריך − מכירות × (1 − שיעור גולמי)"],
    rules: ["R25", "R27"],
  });
  steps.push(settleStep(r.atFire, r.savedCost, r.burned, r.settlement, x.savedAtPrice ? `(${m(x.saved)} במחיר מכירה × (1 − ${pc(r.rate)}))` : ""));
  return steps;
}

export function explainHistoryFire(method: Method, r: ReturnType<typeof historyFire>): TraceStep[] {
  const steps: TraceStep[] = [
    {
      id: "f-hist",
      title: `חישוב מחדש לפי בסיס הפוליסה: ${METHOD_LABEL[method]}, בלי שמ״נ`,
      text: [
        "הפוליסה קובעת את בסיס השיפוי — לא שיטת החברה. מחשבים מחדש את כל ההיסטוריה לפי שיטת הפוליסה, ובלי הורדת ערך (שיפוי לפי עלות).",
        ...r.chain.slice(0, -1).map((c) => `${c.label}: מלאי סגירה ${q(c.closingUnits)} יח' בעלות ${m(c.closingCostBasis)} ₪ — זו הפתיחה של התקופה הבאה.`),
        `בתאריך השריפה: ${q(r.unitsAtFire)} יחידות בעלות ${m(r.costAtFire)} ₪${r.avg !== undefined ? ` (ממוצע ${u(r.avg)})` : ""}.`,
      ],
      rules: ["R28"],
    },
  ];
  const burnText =
    method === "fifo"
      ? `הנשרף מוערך מהשכבות האחרונות: ${r.slices.map((s) => `${q(s.units)} × ${u(s.cost / s.units)}`).join(" + ")} = ${m(r.burned)}.`
      : `הנשרף = ${q(r.burnedUnits)} × ${u(r.avg ?? 0)} = ${m(r.burned)}.`;
  steps.push({ id: "f-burn", title: "המלאי שנשרף", text: [`נשרפו ${q(r.unitsAtFire)} − ${q(r.unitsAtFire - r.burnedUnits)} (שניצלו) = ${q(r.burnedUnits)} יחידות.`, burnText], rules: ["R27"] });
  steps.push(settleStep(r.costAtFire, r.costAtFire - r.burned, r.burned, r.settlement, ""));
  return steps;
}

function settleStep(atFire: number, saved: number, burned: number, s: ReturnType<typeof historyFire>["settlement"], savedNote: string): TraceStep {
  const text = [`מלאי שנשרף = ${m(atFire)} − ${m(saved)}${savedNote ? ` ${savedNote}` : ""} = ${m(burned)} ₪ — זה סכום התביעה.`];
  if (s.deductible) text.push(`השתתפות עצמית: ${m(s.deductible)} ₪.`);
  if (s.capExcess) text.push(`חריגה מעל התקרה: ${m(s.capExcess)} ₪ — לא משופה.`);
  text.push(`שיפוי נטו (מזומן מחברת הביטוח): ${m(s.net)} ₪. ההפסד שלא שופה (${m(s.uncovered)} ₪) הוא הוצאה.`);
  return { id: "f-settle", title: "סכום השיפוי", text, formula: ["שיפוי נטו = מלאי שנשרף − השתתפות עצמית"], rules: ["R29", "D10"] };
}

// ---------------------------------------------------------------------------
// Plain text, for "copy the solution".

export function stepsToText(steps: TraceStep[]): string {
  const out: string[] = [];
  for (const s of steps) {
    out.push(`■ ${s.title}`);
    for (const t of s.text) out.push(t);
    for (const f of s.formula ?? []) out.push(`  ${f}`);
    for (const t of s.tables ?? []) {
      if (t.caption) out.push(`  [${t.caption}]`);
      for (const row of t.rows) out.push(`  ${row.map((c) => (c === null ? "" : typeof c === "number" ? m(c) : c)).filter(Boolean).join(" | ")}`);
      if (t.foot) out.push(`  ${t.foot.map((c) => (c === null ? "" : typeof c === "number" ? m(c) : c)).filter(Boolean).join(" | ")}`);
    }
    for (const c of s.checks ?? []) out.push(`  ${c.ok ? "✓" : "⚠"} ${c.text}`);
    out.push("");
  }
  return out.join("\n");
}
