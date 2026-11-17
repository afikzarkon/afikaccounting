import type { Books, consolidate } from "../../../learn/consolidated";
import { ARMON, GEFANIT, HARMON, M6, NOFAR, STORY6, YEAR2, YEAR2_NCI_END } from "../lessons/worksheet";
import { A, type WCell, type Worked, type WLine, type WStep, type WTable } from "./types";

/**
 * Lesson 6's numeric demonstrations as full worked solutions, by the owner's
 * word of 2026-11-12 (all 66 demonstrations of the course, the whole way).
 * One story runs through the lesson, Nofar and Armon, and the closing question
 * is Harmon and Gefanit. The steps are built once, from the solver's output,
 * so both are worked the same way and every figure comes from the solver.
 * One company per step, each on a calculation sheet; every table of
 * calculated amounts ends with a calculation column.
 */

type Cons = ReturnType<typeof consolidate>;
type Story = {
  c: Cons;
  a: Books;
  b: Books;
  an: string;
  bn: string;
  holding: number;
  paid: number;
  costs: number;
  /** How each excess item is amortized, in words with a formula: the calculation column. */
  how: string[];
  year: string;
};

const n = (v: number) => v.toLocaleString("en-US");
const pct = (v: number) => `${Math.round(v * 100)}%`;
const e = (v: number) => (v === 0 ? "" : v);
const profitOf = (k: Books) => k.sales - k.cogs - k.admin + k.dividendIncome - k.tax;
const equityOf = (k: Books) => k.capital + k.premium + k.reserve + k.retainedOpen - k.dividend + profitOf(k);
const je = (cap: string, lines: [string, number | "", number | ""][]): WTable => ({ cap, head: ["חשבון", "חובה", "זכות"], rows: lines.map((l) => ({ c: l })) });
const join = (...xs: string[]) => xs.filter(Boolean).join(", ");

/** The amounts that add up to a total, as a formula: each added or taken away by its sign against the total's. Empty for fewer than two. */
function sumF(parts: number[]) {
  const xs = parts.filter((x) => x !== 0);
  if (xs.length < 2) return "";
  const sign = Math.sign(xs.reduce((a, b) => a + b, 0)) || Math.sign(xs[0]);
  return "`" + xs.map((x, i) => (Math.sign(x) === sign ? (i ? " + " : "") : i ? " − " : "−") + n(Math.abs(x))).join("") + "`";
}

/**
 * A step named in the text, by its heading: written as ⟦heading⟧ and turned
 * into "שלב N" once the example's steps are in their final order, so the full
 * example and the closing question each count their own.
 */
const ref = (h: string) => `⟦${h}⟧`;
function numbered(w: Worked): Worked {
  const fix = (t: string) =>
    t.replace(/⟦([^⟧]+)⟧/g, (_, h: string) => {
      const i = w.steps.findIndex((s) => s.h === h);
      return i === -1 ? `שלב ״${h}״` : `שלב ${i + 1}`;
    });
  const cell = (c: WCell) => (typeof c === "string" ? fix(c) : c);
  return {
    ...w,
    steps: w.steps.map(
      (s): WStep => ({
        ...s,
        why: s.why ? [fix(s.why[0]), fix(s.why[1])] : undefined,
        p: s.p?.map(fix),
        result: s.result === undefined ? undefined : fix(s.result),
        sheet: s.sheet?.map((l) => ({ ...l, l: fix(l.l) })),
        tables: s.tables?.map((t) => ({ ...t, rows: t.rows.map((r) => ({ ...r, c: r.c.map(cell) })) })),
      }),
    ),
  };
}

/** The headings other steps point to. */
const H = {
  goodwill: "המוניטין",
  whoseGoodwill: "של מי המוניטין",
  adj: (who: string) => `ההתאמות על חשבון ${who}`,
  plSheet: "דף העבודה של הדוח על הרווח הכולל",
  splitProfit: "חלוקת הרווח הנקי",
  splitTotal: "חלוקת סך הרווח הכולל",
  bsAdj: "ההתאמות בדוח על המצב הכספי",
  equitySplit: "החלוקה בין הבעלים לזשמ״ש",
};

/** A trial balance as the lecturer gives it: debits positive, credits negative. */
export function trialTable(s: { a: Books; b: Books; an: string; bn: string; year: string }): WTable {
  const line = (label: string, f: (k: Books) => number, sign: 1 | -1, id?: Record<number, string>) => ({ c: [label, e(sign * f(s.a)), e(sign * f(s.b))], ...(id ? { id } : {}) });
  return {
    cap: `מאזני הבוחן לשנת ${s.year}: חובה חיובי, זכות בסוגריים`,
    head: ["", s.an, s.bn],
    rows: [
      line("מזומנים", (k) => k.cash, 1),
      line("מלאי", (k) => k.inventory, 1),
      line("רכוש קבוע", (k) => k.ppe, 1),
      line("השקעה בחברה בת", (k) => k.investment, 1, { 1: "tb.a.investment" }),
      line("ספקים", (k) => k.suppliers, -1),
      line("מסים נדחים", (k) => k.deferredTax, -1),
      line("הון מניות", (k) => k.capital, -1, { 2: "tb.b.capital" }),
      line("פרמיה", (k) => k.premium, -1, { 2: "tb.b.premium" }),
      ...(s.a.reserve || s.b.reserve ? [line("קרן הערכה מחדש", (k) => k.reserve, -1)] : []),
      line("עודפים 1.1", (k) => k.retainedOpen, -1, { 2: "tb.b.retained" }),
      line("מכירות", (k) => k.sales, -1),
      line("עלות המכירות", (k) => k.cogs, 1),
      line("הוצאות הנהלה וכלליות", (k) => k.admin, 1),
      line("הכנסות מדיבידנד", (k) => k.dividendIncome, -1),
      line("הוצאות מסים", (k) => k.tax, 1),
      line("דיבידנד שהוכרז", (k) => k.dividend, 1),
    ],
  };
}

/** Each company's profit from its trial balance, one company per step. */
function profitSteps(s: Story): WStep[] {
  // The dividend income and both profits are carried on, to the parent's adjustments and to the adjusted profits.
  const sheet = (k: Books, tot: string): WLine[] => [
    { l: "מכירות", a: k.sales },
    { l: "פחות עלות המכירות", a: -k.cogs, k: "op" },
    { l: "פחות הוצאות הנהלה וכלליות", a: -k.admin, k: "op" },
    ...(k.dividendIncome ? [{ l: "ועוד הכנסות מדיבידנד", a: k.dividendIncome, k: "op" as const, id: "pr.div" }] : []),
    { l: "פחות הוצאות מסים", a: -k.tax, k: "op" },
    { l: "רווח נקי", a: profitOf(k), k: "tot", id: tot },
  ];
  return [
    {
      h: `הרווח בדוח של ${s.an}`,
      sheet: sheet(s.a, "pr.a"),
      why: ["מאיפה?", "משורות הרווח והפסד במאזן הבוחן. קרן ההערכה מחדש והדיבידנד שהוכרז לא נכנסים לרווח הנקי."],
      result: `${s.an}: ${A(profitOf(s.a))}.`,
    },
    {
      h: `הרווח בדוח של ${s.bn}`,
      sheet: sheet(s.b, "pr.b"),
      result: `${s.bn}: ${A(profitOf(s.b))}.`,
    },
  ];
}

function excessSteps(s: Story): WStep[] {
  const { c } = s;
  const t = c.table;
  const sumAt = t.items.reduce((x, r) => x + r.at, 0);
  const sumAm = t.items.reduce((x, r) => x + r.amortized, 0);
  const sumEnd = t.items.reduce((x, r) => x + r.end, 0);
  const rest = c.goodwill.goodwill - c.premium;
  return [
    {
      h: "טבלת עודף העלות",
      why: ["מה צריך ממנה?", "לדוח רווח כולל צריך את ההפחתות של השנה. לדוח על המצב הכספי צריך את היתרות בסוף השנה."],
      tables: [
        {
          head: ["", "ייחוס 1.1", "הפחתה", "יתרה 31.12", "חישוב"],
          rows: [
            ...t.items.map((r, i) => ({ c: [r.name, r.at, r.amortized, r.end, s.how[i]], id: { 2: `ex.am.${i}`, 3: `ex.end.${i}` } })),
            { c: [t.tax.name, t.tax.at, t.tax.amortized, t.tax.end, `1.1: \`25% × ${n(sumAt)}\`. הפחתה: \`25% × ${n(-sumAm)}\`. 31.12: \`25% × ${n(sumEnd)}\`. בסימן הפוך`], id: { 2: "ex.am.tax", 3: "ex.end.tax" } },
            { c: ["סך הכול", t.total.at, t.total.amortized, t.total.end, "הפריטים ועוד המס הנדחה"], res: true, id: { 1: "ex.at", 2: "ex.am", 3: "ex.end" } },
          ],
        },
      ],
      result: `עודפי העלות נטו ממס ${A(t.total.at)} ביום הרכישה, הפחתה של ${A(t.total.amortized)} בשנה, ויתרה של ${A(t.total.end)}.`,
    },
    {
      h: "הנכסים המזוהים נטו ביום הרכישה",
      sheet: [
        { l: "הון מניות", a: s.b.capital, from: "tb.b.capital" },
        { l: "ועוד פרמיה", a: s.b.premium, k: "op", from: "tb.b.premium" },
        { l: "ועוד עודפים ב־1.1", a: s.b.retainedOpen, k: "op", from: "tb.b.retained" },
        { l: `ההון של ${s.bn} ביום הרכישה`, a: c.subEquityAt, k: "sub" },
        { l: "ועוד עודפי עלות נטו ממס", a: t.total.at, k: "op", from: "ex.at" },
        { l: "נכסים מזוהים נטו", a: c.netAt, k: "tot", id: "netAt" },
      ],
      why: [
        "מה עם הקרן והרווח?",
        s.b.reserve ? "הקרן נוצרה במהלך השנה, והרווח והדיבידנד הם של השנה. ביום הרכישה, 1.1, ההון היה רק הון המניות, הפרמיה והעודפים לתחילת השנה." : "הרווח והדיבידנד הם של השנה. ביום הרכישה, 1.1, ההון היה רק הון המניות, הפרמיה והעודפים לתחילת השנה.",
      ],
      result: `הנמ״נ ${A(c.netAt)}.`,
    },
    {
      h: H.goodwill,
      sheet: [
        { l: "תמורה שהועברה", a: s.paid },
        { l: c.premium || s.costs === 0 ? "ועוד זשמ״ש בשווי הוגן" : `ועוד זשמ״ש: \`${n(c.netAt)} × ${pct(1 - s.holding)}\``, a: c.goodwill.nci, k: "op", id: "gw.nci" },
        { l: "עלות צירוף העסקים", a: c.goodwill.cost, k: "sub" },
        { l: "פחות נכסים מזוהים נטו", a: -c.netAt, k: "op", from: "netAt" },
        { l: "מוניטין", a: c.goodwill.goodwill, k: "tot", id: "gw" },
      ],
      why: s.costs
        ? ["ושכר הטרחה?", `${A(s.costs)} ששולמו לעורכי הדין הם עלויות רכישה. הם לא חלק מהתמורה, ולכן לא נכנסים למוניטין. במאוחד הם הוצאה, על חשבון ${s.an}.`]
        : ["מה נכנס לתמורה?", "רק מה שהועבר למוכר. אילו היו עלויות רכישה, הן לא היו נכנסות."],
      result: `מוניטין ${A(c.goodwill.goodwill)}.`,
    },
    ...(c.premium
      ? [
          {
            h: H.whoseGoodwill,
            tables: [
              {
                head: ["", "סך הכול", `בעלים של ${s.an}`, "זשמ״ש", "חישוב"],
                rows: [
                  { c: ["פרמיית שליטה", c.premium, c.premium, 0, `\`${n(s.paid)} − ${n(c.goodwill.nci)} × 3\`. כולה של הבעלים`] },
                  { c: ["מוניטין בלי הפרמיה", rest, c.goodwill.ownersGoodwill - c.premium, c.goodwill.nciGoodwill, `\`${n(c.goodwill.goodwill)} − ${n(c.premium)}\`. בעלים: \`${n(rest)} × ${pct(s.holding)}\`. זשמ״ש: \`${n(rest)} × ${pct(1 - s.holding)}\``] },
                  { c: ["סך המוניטין", c.goodwill.goodwill, c.goodwill.ownersGoodwill, c.goodwill.nciGoodwill, "פרמיה ועוד מוניטין בלי הפרמיה"], res: true, from: { 1: "gw" }, id: { 2: "gw.owners", 3: "gw.nciShare" } },
                ],
              },
            ],
            why: ["למה פי 3?", `השווי ההוגן של 25% הוא ${n(c.goodwill.nci)}, ולכן 75% שווים פי שלושה: ${n(c.goodwill.nci * 3)}. ${s.an} שילמה ${n(s.paid)}, וההפרש הוא פרמיית השליטה.`] as [string, string],
            result: `לבעלים ${A(c.goodwill.ownersGoodwill)}, לזשמ״ש ${A(c.goodwill.nciGoodwill)}.`,
          },
        ]
      : []),
  ];
}

/** Each company's adjusted profit on its own sheet, then the two together. */
function adjustedSteps(s: Story): WStep[] {
  const { c } = s;
  return [
    {
      h: `הרווח המתוקן של ${s.bn}`,
      sheet: [
        { l: `הרווח בדוח של ${s.bn}`, a: c.adjusted.b.separate, from: "pr.b" },
        { l: "פחות הפחתת עודפי עלות, נטו ממס", a: c.adjusted.b.excess, k: "op", from: "pl.adjB" },
        { l: "רווח מתוקן", a: c.adjusted.b.total, k: "tot", id: "adj.b" },
      ],
      why: ["מה זה רווח מתוקן?", "הרווח בדוח של החברה, ועוד ההתאמות שעל חשבונה. כך נראה הרווח שלה מנקודת המבט של הקבוצה."],
      result: `${s.bn}: ${A(c.adjusted.b.total)}.`,
    },
    {
      h: `הרווח המתוקן של ${s.an}`,
      sheet: [
        { l: `הרווח בדוח הנפרד של ${s.an}`, a: c.adjusted.a.separate, from: "pr.a" },
        { l: `פחות ביטול הכנסות מדיבידנד: \`${n(s.b.dividend)} × ${pct(s.holding)}\``, a: c.adjusted.a.dividend, k: "op", from: "pl.div" },
        ...(s.costs ? [{ l: "פחות עלויות רכישה", a: c.adjusted.a.costs, k: "op" as const, from: "pl.costs" }] : []),
        { l: "רווח מתוקן", a: c.adjusted.a.total, k: "tot", id: "adj.a" },
      ],
      result: `${s.an}: ${A(c.adjusted.a.total)}.`,
    },
    {
      h: "הרווח הנקי המאוחד",
      sheet: [
        { l: `הרווח המתוקן של ${s.an}`, a: c.adjusted.a.total, from: "adj.a" },
        { l: `ועוד הרווח המתוקן של ${s.bn}`, a: c.adjusted.b.total, k: "op", from: "adj.b" },
        { l: "רווח נקי מאוחד", a: c.profit.total, k: "tot" },
      ],
      result: `${A(c.profit.total)}, כמו שורת הרווח הנקי ב${ref(H.plSheet)}.`,
    },
  ];
}

function incomeTable(s: Story): WTable {
  const { c } = s;
  const cells = (r: { a: number; b: number; adjA: number; adjB: number; total: number }) => [e(r.a), e(r.b), e(r.adjA), e(r.adjB), r.total];
  // Each adjustment comes from its line in the two steps before: the subsidiary's in column 4, the parent's in column 3.
  const fromB = ["", "pl.cogs", "pl.admin", "", "pl.tax"];
  const fromA = ["", "", "pl.costs", "pl.div", ""];
  const from = (i: number) => {
    const f: Record<number, string> = {};
    if (fromA[i]) f[3] = fromA[i];
    if (fromB[i]) f[4] = fromB[i];
    return f;
  };
  const how = (r: { a: number; b: number; adjA: number; adjB: number }) =>
    join(sumF([r.a, r.b, r.adjA, r.adjB]), r.adjB ? `התאמת ${s.bn} מ${ref(H.adj(s.bn))}` : "", r.adjA ? `התאמת ${s.an} מ${ref(H.adj(s.an))}` : "");
  const hasOci = c.oci.a !== 0 || c.oci.b !== 0;
  const rows = c.income.map((r, i) => ({ c: [r.name, ...cells(r), how(r)], from: from(i) }));
  // As in the lecturer's sheet: the subtotals only in the consolidated column, and under the table each column's share for the minority.
  const upTo = (k: number) => c.income.slice(0, k).reduce((x, r) => x + r.total, 0);
  const sub = (label: string, v: number, calc: string) => ({ c: [label, "", "", "", "", v, calc] });
  const out = pct(1 - s.holding);
  return {
    cap: `דף העבודה של הדוח על הרווח הכולל לשנת ${s.year}`,
    head: ["", s.an, s.bn, `התאמות ${s.an}`, `התאמות ${s.bn}`, "מאוחד", "חישוב"],
    rows: [
      ...rows.slice(0, 2),
      sub("רווח גולמי", upTo(2), sumF([c.income[0].total, c.income[1].total])),
      ...rows.slice(2, 4),
      sub("רווח לפני מס", upTo(4), sumF([upTo(2), c.income[2].total, c.income[3].total])),
      ...rows.slice(4),
      { c: ["רווח נקי", ...cells(c.profit), sumF([upTo(4), c.income[4].total])], res: true, from: { 3: "pl.adjA", 4: "pl.adjB" } },
      ...(hasOci ? [{ c: [c.oci.name, ...cells(c.oci), sumF([c.oci.a, c.oci.b, c.oci.adjA, c.oci.adjB])] }, { c: ["סך הרווח הכולל", ...cells(c.comprehensive), sumF([c.profit.total, c.oci.total])], res: true }] : []),
      { c: ["חלק הזשמ״ש", "0%", out, "0%", out, "", ""] },
    ],
  };
}

function incomeSteps(s: Story): WStep[] {
  const { c } = s;
  const cogs = c.income[1].adjB;
  const admin = c.income[2].adjB;
  const taxAdj = c.income[4].adjB;
  return [
    {
      h: H.adj(s.bn),
      sheet: [
        // Each from its amortization in the cost-excess table: the first item to cost of sales, the second to administration.
        { l: "עלות המכירות: הפחתת עודף המלאי", a: cogs, id: "pl.cogs", from: c.table.items[0]?.amortized === cogs ? "ex.am.0" : undefined },
        { l: "הוצאות הנהלה וכלליות: הפחתת העודף", a: admin, k: "op", id: "pl.admin", from: c.table.items[1]?.amortized === admin ? "ex.am.1" : undefined },
        { l: `הוצאות מסים: \`25% × ${n(-(cogs + admin))}\``, a: taxAdj, k: "op", id: "pl.tax", from: "ex.am.tax" },
        { l: "סך ההתאמות", a: c.profit.adjB, k: "tot", id: "pl.adjB", from: "ex.am" },
      ],
      why: ["למה המס בסימן הפוך?", "ההפחתות מקטינות את הרווח לפני מס. המס הנדחה שנגרע איתן מקטין את הוצאות המסים, ולכן הוא חיובי."],
      result: `ההתאמות של ${s.bn} מקטינות את הרווח ב־${A(-c.profit.adjB)}, בדיוק הפחתת עודפי העלות נטו ממס מהטבלה.`,
    },
    {
      h: H.adj(s.an),
      sheet: [
        { l: `ביטול הכנסות מדיבידנד: \`${n(s.b.dividend)} × ${pct(s.holding)}\``, a: -c.dividendOut, id: "pl.div", from: "pr.div" },
        ...(s.costs ? [{ l: "עלויות רכישה, להוצאות הנהלה וכלליות", a: -s.costs, k: "op" as const, id: "pl.costs" }] : []),
        { l: "סך ההתאמות", a: c.profit.adjA, k: "tot" as const, id: "pl.adjA" },
      ],
      why: ["למה מבטלים את הדיבידנד?", `הרווח של ${s.bn} כבר נכנס למאוחד שורה אחרי שורה. אם נשאיר גם את הדיבידנד שהיא חילקה ל־${s.an}, אותו רווח ייספר פעמיים.`],
      result: `ההתאמות של ${s.an}: ${A(c.profit.adjA)}.`,
    },
    {
      h: H.plSheet,
      tables: [incomeTable(s)],
      result: `רווח נקי מאוחד: \`${n(c.profit.a)} + ${n(c.profit.b)} − ${n(-c.profit.adjA)} − ${n(-c.profit.adjB)} = ${n(c.profit.total)}\`.`,
    },
  ];
}

function splitSteps(s: Story): WStep[] {
  const { c } = s;
  const out = 1 - s.holding;
  const hasOci = s.b.reserve !== 0 || s.a.reserve !== 0;
  return [
    {
      h: H.splitProfit,
      sheet: [
        { l: `זשמ״ש: \`${n(c.adjusted.b.total)} × ${pct(out)}\``, a: c.split.profit.nci, id: "split.nci" },
        { l: `בעלים של ${s.an}: \`${n(c.adjusted.a.total)} + ${n(c.adjusted.b.total)} × ${pct(s.holding)}\``, a: c.split.profit.owners, id: "split.owners" },
        { l: "רווח נקי מאוחד", a: c.split.profit.total, k: "tot" },
      ],
      why: ["למה מהרווח המתוקן?", `הזשמ״ש נושאים בחלקם בהפחתת עודפי העלות, כי הם בעלים ב־${s.bn}. לכן מחשבים מהרווח המתוקן שלה, לא מהרווח בדוח שלה.`],
      result: `בדרך ההפוכה: \`${n(c.split.profit.total)} − ${n(c.split.profit.nci)} = ${n(c.split.profit.owners)}\`.`,
    },
    ...(hasOci
      ? [
          {
            h: H.splitTotal,
            sheet: [
              { l: `זשמ״ש: \`(${n(c.adjusted.b.total)} + ${n(s.b.reserve)}) × ${pct(out)}\``, a: c.split.comprehensive.nci, id: "split.c.nci" },
              { l: `בעלים: \`${n(c.adjusted.a.total)} + ${n(s.a.reserve)} + (${n(c.adjusted.b.total)} + ${n(s.b.reserve)}) × ${pct(s.holding)}\``, a: c.split.comprehensive.owners, id: "split.c.owners" },
              { l: "סך הרווח הכולל המאוחד", a: c.split.comprehensive.total, k: "tot" as const, id: "split.c.total" },
            ],
            why: ["מה מוסיפים?", "לכל חברה את הרווח הכולל האחר שלה, ההערכה מחדש, ואז מחלקים באותה דרך."] as [string, string],
            result: `לזשמ״ש ${A(c.split.comprehensive.nci)}, לבעלים ${A(c.split.comprehensive.owners)}.`,
          },
        ]
      : []),
  ];
}

function positionTable(s: Story): WTable {
  const { c } = s;
  const eq = (label: string, v: number, calc: string, res?: boolean) => ({ c: [label, "", "", "", -v, calc], res });
  const fromSplit = `מהשורה ״סך הכול״ ב${ref(H.equitySplit)}`;
  return {
    cap: "דף העבודה של הדוח על המצב הכספי: נכסים חיוביים, התחייבויות והון בסוגריים",
    head: ["", s.an, s.bn, "התאמות", "מאוחד", "חישוב"],
    rows: [
      ...c.position.map((r) => ({ c: [r.name, e(r.a), e(r.b), e(r.adj), r.total, join(sumF([r.a, r.b, r.adj]), r.adj ? `ההתאמה מ${ref(H.bsAdj)}` : "")], ...(r.adj ? { from: { 3: "bs." + r.name } } : {}) })),
      eq("הון מניות", c.equity.capital, `כמו אצל ${s.an}`),
      eq("פרמיה", c.equity.premium, `כמו אצל ${s.an}`),
      ...(c.equity.reserve ? [eq("קרן הערכה מחדש", c.equity.reserve, `\`${n(s.a.reserve)} + ${n(s.b.reserve)} × ${pct(s.holding)}\``)] : []),
      eq("עודפים", c.equity.retained, `\`${n(c.equity.owners)} − ${n(c.equity.capital)} − ${n(c.equity.premium)}${c.equity.reserve ? ` − ${n(c.equity.reserve)}` : ""}\`: מה שנשאר לבעלים`),
      eq(`סך ההון של בעלי מניות ${s.an}`, c.equity.owners, fromSplit, true),
      eq("זשמ״ש", c.equity.nci, fromSplit),
      // As in the lecturer's sheet: each column's net assets, and the consolidated equity is their sum, on the credit side.
      { c: ["סך ההון", ...(["a", "b", "adj"] as const).map((k) => e(c.position.reduce((x, r) => x + r[k], 0))), -c.equity.total, `\`${n(c.equity.owners)} + ${n(c.equity.nci)}\`: בעלים ועוד זשמ״ש`], res: true },
      { c: ["חלק הזשמ״ש", "0%", pct(1 - s.holding), "", "", ""] },
    ],
  };
}

function positionSteps(s: Story): WStep[] {
  const { c } = s;
  const adj = c.position.filter((r) => r.adj !== 0);
  // Where each adjustment comes from: the investment from the parent's books, goodwill from its calculation, the rest from the balances in the cost-excess table.
  const bsFrom = (r: { name: string; adj: number }) => {
    if (r.name === "השקעה בחברה בת") return "tb.a.investment";
    if (r.name === "מוניטין") return "gw";
    if (r.name === "מסים נדחים") return r.adj === c.table.tax.end ? "ex.end.tax" : undefined;
    const k = c.table.items.findIndex((x) => x.end !== 0 && x.end === r.adj);
    return k === -1 ? undefined : `ex.end.${k}`;
  };
  return [
    {
      h: H.bsAdj,
      sheet: adj.map((r, i) => ({ l: r.name, a: r.adj, k: i === 0 ? undefined : ("op" as const), id: "bs." + r.name, from: bsFrom(r) })),
      why: ["מה נכנס?", "יתרות עודפי העלות בסוף השנה, לא ההפחתות. המס הנדחה על היתרה מצטרף למסים הנדחים. ההשקעה מתבטלת, והמוניטין נכנס."],
      result: `${adj.map((r) => `${r.name} ${A(r.adj)}`).join(", ")}.`,
    },
    {
      h: "דף העבודה של הדוח על המצב הכספי",
      tables: [positionTable(s)],
      result: `נכסים ${A(c.assets)}, התחייבויות ${A(c.liabilities)}, הון \`${n(c.assets)} − ${n(c.liabilities)} = ${n(c.equity.total)}\`.`,
    },
  ];
}

/** The equity in a company's own statement, as a formula from its trial balance. */
const equityF = (k: Books) => sumF([k.capital, k.premium, k.reserve, k.retainedOpen, -k.dividend, profitOf(k)]);

function equitySteps(s: Story): WStep[] {
  const { c } = s;
  const out = 1 - s.holding;
  const eqA = c.equity.netA + s.a.investment;
  const eqB = c.equity.netB - c.table.total.end;
  return [
    {
      h: `הנמ״נ המתוקנים של ${s.bn}`,
      sheet: [
        { l: `ההון בדוח של ${s.bn}: ${equityF(s.b)}`, a: eqB },
        { l: "ועוד יתרות עודפי עלות, נטו ממס", a: c.table.total.end, k: "op", from: "ex.end" },
        { l: "נמ״נ מתוקנים", a: c.equity.netB, k: "tot" },
      ],
      why: ["מאיפה ההון?", "הון מניות, פרמיה, קרן ועודפים 1.1, פחות הדיבידנד ועוד הרווח של השנה."],
      result: `${s.bn}: ${A(c.equity.netB)}.`,
    },
    {
      h: `הנמ״נ המתוקנים של ${s.an}`,
      sheet: [
        { l: `ההון בדוח הנפרד של ${s.an}: ${equityF(s.a)}`, a: eqA },
        { l: "פחות ביטול ההשקעה", a: -s.a.investment, k: "op", from: "bs.השקעה בחברה בת" },
        { l: "נמ״נ מתוקנים", a: c.equity.netA, k: "tot" },
      ],
      result: `${s.an}: ${A(c.equity.netA)}.`,
    },
    {
      h: H.equitySplit,
      tables: [
        {
          head: ["", `בעלים של ${s.an}`, "זשמ״ש", "חישוב"],
          rows: [
            { c: ["חלק בנמ״נ", c.equity.owners - c.goodwill.ownersGoodwill, c.equity.nci - c.goodwill.nciGoodwill, `בעלים: \`${n(c.equity.netA)} + ${n(c.equity.netB)} × ${pct(s.holding)}\`. זשמ״ש: \`${n(c.equity.netB)} × ${pct(out)}\``] },
            {
              c: ["ועוד חלק במוניטין", c.goodwill.ownersGoodwill, c.goodwill.nciGoodwill, c.premium ? `מהשורה ״סך המוניטין״ ב${ref(H.whoseGoodwill)}` : `כל המוניטין מ${ref(H.goodwill)} לבעלים. הזשמ״ש נמדדים לפי החלק בנמ״נ, בלי מוניטין`],
              ...(c.premium ? { from: { 1: "gw.owners", 2: "gw.nciShare" } } : {}),
            },
            { c: ["סך הכול", c.equity.owners, c.equity.nci, "חלק בנמ״נ ועוד חלק במוניטין"], res: true, id: { 1: "eq.owners", 2: "eq.nci" } },
          ],
        },
      ],
      result: `לבעלים ${A(c.equity.owners)}, לזשמ״ש ${A(c.equity.nci)}. יחד ${A(c.equity.total)}, כמו ההון בדף העבודה.`,
    },
    {
      h: "פירוט ההון של הבעלים",
      sheet: [
        { l: `הון מניות, כמו אצל ${s.an}`, a: c.equity.capital },
        { l: `פרמיה, כמו אצל ${s.an}`, a: c.equity.premium },
        ...(c.equity.reserve ? [{ l: `קרן הערכה מחדש: \`${n(s.a.reserve)} + ${n(s.b.reserve)} × ${pct(s.holding)}\``, a: c.equity.reserve }] : []),
        { l: `עודפים: \`${n(c.equity.owners)} − ${n(c.equity.capital)} − ${n(c.equity.premium)}${c.equity.reserve ? ` − ${n(c.equity.reserve)}` : ""}\``, a: c.equity.retained, k: "sub" },
        { l: "סך ההון של הבעלים", a: c.equity.owners, k: "tot", from: "eq.owners" },
      ],
      p: s.b.reserve
        ? [`הקרן של ${s.bn} נוצרה אחרי הרכישה, ולכן היא של הקבוצה ולא מתבטלת מול ההשקעה. הבעלים מקבלים ממנה ${pct(s.holding)}, והחלק של הזשמ״ש, \`${n(s.b.reserve)} × ${pct(1 - s.holding)} = ${n(Math.round(s.b.reserve * (1 - s.holding)))}\`, נמצא בתוך שורת הזשמ״ש.`]
        : undefined,
      why: ["למה לא מחברים את העודפים של שתי החברות?", `העודפים של ${s.bn} מלפני הרכישה נקנו. הם חלק ממה ש־${s.an} שילמה עליו, ולא רווח של הקבוצה. לכן העודפים הם ההפרש.`],
      result: `בדיקה: העודפים של ${s.an} ב־1.1, פחות הדיבידנד שהכריזה, ועוד חלק הבעלים ברווח: \`${n(s.a.retainedOpen)} − ${n(s.a.dividend)} + ${n(c.split.profit.owners)} = ${n(c.equity.retained)}\`.`,
    },
  ];
}

function nciMoveStep(s: Story): WStep {
  const ch = s.c.changes;
  return {
    h: "התנועה בזשמ״ש",
    sheet: [
      { l: `יתרה ל־1.1.${s.year}`, a: ch.open.nci },
      { l: "ועוד רכישת חברה בת", a: ch.acquisition.nci, k: "op", from: "gw.nci" },
      { l: `פחות דיבידנד שהוכרז: \`${n(s.b.dividend)} × ${pct(1 - s.holding)}\``, a: ch.dividends.nci, k: "op" },
      { l: "ועוד רווח כולל", a: ch.comprehensive.nci, k: "op", from: "split.nci" },
      { l: `יתרה ל־31.12.${s.year}`, a: ch.close.nci, k: "tot", from: "eq.nci" },
    ],
    result: `${A(ch.close.nci)}, כמו בחלוקת ההון.`,
  };
}

/* The story. */
const S6: Story = {
  c: STORY6,
  a: NOFAR,
  b: ARMON,
  an: "נופר",
  bn: "ערמון",
  holding: 0.75,
  paid: 140_000,
  costs: 0,
  how: ["נתון. המלאי נמכר השנה, ולכן הופחת כולו", "נתון. הפחתה `20,000 ÷ 5`, יתרה `20,000 − 4,000`"],
  year: "2025",
};
const STORY_GIVENS = [
  "ב־1.1.2025 נופר קנתה **75%** ממניות ערמון ב־**140,000** ש״ח במזומן, ומודדת את ההשקעה לפי עלות. הזשמ״ש נמדדים בשווי הוגן: **40,000** ש״ח.",
  "באותו יום למלאי של ערמון עודף עלות של **12,000** ש״ח, והוא נמכר במהלך 2025. לציוד, שמשמש את ההנהלה, עודף עלות של **20,000** ש״ח, ונותרו לו **5** שנים. שיעור המס **25%**.",
  "קרן ההערכה מחדש בשתי החברות נוצרה במהלך 2025.",
];
const storyTb = trialTable({ a: NOFAR, b: ARMON, an: "נופר", bn: "ערמון", year: "2025" });
const base = { own: true, givens: STORY_GIVENS, tables: [storyTb] };

const DATA_STEPS: WStep[] = [
  ...profitSteps(S6),
  {
    h: "מה קשור לקבוצה",
    tables: [
      {
        head: ["השורה", "אצל", "למה היא קשורה לקבוצה"],
        rows: [
          { c: ["השקעה בחברה בת, 140,000", "נופר", "התמורה ששילמה על ערמון. במאוחד היא תתבטל"] },
          { c: ["הכנסות מדיבידנד, 9,000", "נופר", "`12,000 × 75% = 9,000`: החלק של נופר בדיבידנד של ערמון"] },
          { c: ["קרן הערכה מחדש", "שתיהן", "נוצרה השנה, ולכן היא גם הרווח הכולל האחר של השנה. ביום הרכישה היא הייתה אפס"] },
        ],
      },
    ],
    result: "שלוש השורות האלה יקבלו טיפול בשלבים הבאים.",
  },
];

const ELIM_STEPS: WStep[] = [
  {
    h: "ביטול ההשקעה ביום הרכישה",
    why: ["מה הפקודה עושה?", "מבטלת את ההון של ערמון ביום הרכישה מול ההשקעה, ומכניסה את מה שנקנה: עודפי העלות, המס הנדחה עליהם, המוניטין, והזשמ״ש."],
    tables: [
      je("פקודת עזר: ביטול ההשקעה", [
        ["ח׳ הון מניות", ARMON.capital, ""],
        ["ח׳ פרמיה", ARMON.premium, ""],
        ["ח׳ עודפים", ARMON.retainedOpen, ""],
        ["ח׳ מלאי", 12_000, ""],
        ["ח׳ ציוד", 20_000, ""],
        ["ח׳ מוניטין", STORY6.goodwill.goodwill, ""],
        ["ז׳ התחייבות מסים נדחים", "", -STORY6.table.tax.at],
        ["ז׳ השקעה בחברה בת", "", NOFAR.investment],
        ["ז׳ זשמ״ש", "", STORY6.goodwill.nci],
      ]),
    ],
    result: `בדיקה: חובה \`16,000 + 34,000 + 74,000 + 12,000 + 20,000 + 32,000 = 188,000\`, זכות \`8,000 + 140,000 + 40,000 = 188,000\`.`,
  },
  {
    h: "חלוקת הדיבידנד של ערמון",
    sheet: [
      { l: "הדיבידנד שערמון הכריזה", a: ARMON.dividend },
      { l: "החלק של נופר: `12,000 × 75%`", a: STORY6.dividendOut, k: "sub" },
      { l: "החלק של המיעוט: `12,000 × 25%`", a: ARMON.dividend - STORY6.dividendOut, k: "sub", id: "elim.nciDiv" },
    ],
    result: `לנופר ${A(STORY6.dividendOut)}, למיעוט ${A(ARMON.dividend - STORY6.dividendOut)}.`,
  },
  {
    h: "פקודת העזר: ביטול הדיבידנד",
    why: ["לאן הולך כל חלק?", "החלק של נופר רשום אצלה כהכנסה, והוא מתבטל. החלק של המיעוט מקטין את הזשמ״ש. העודפים של ערמון חוזרים כאילו לא חולק דיבידנד בתוך הקבוצה."],
    tables: [je("פקודת עזר: ביטול הדיבידנד", [["ח׳ הכנסות מדיבידנד", STORY6.dividendOut, ""], ["ח׳ זשמ״ש", ARMON.dividend - STORY6.dividendOut, ""], ["ז׳ עודפים (דיבידנד שהוכרז)", "", ARMON.dividend]])],
    result: "הרווח של ערמון כבר נכנס למאוחד שורה אחרי שורה, ולכן הדיבידנד לא נספר שוב.",
  },
];
const ELIM_NOTES = ["אילו נופר הייתה מוסיפה לעלות ההשקעה שכר טרחה, למשל 3,000, הפקודה הייתה: ח׳ הוצאות הנהלה וכלליות 3,000, ז׳ השקעה בחברה בת 3,000. המוניטין מחושב לפי התמורה, וההשקעה מתבטלת בסכום שרשום אצל האם."];

const C = STORY6.changes;
const SOCE_STEPS: WStep[] = [
  {
    h: "מה נכנס לכל שורה",
    tables: [
      {
        head: ["", "בעלים", "זשמ״ש", "חישוב"],
        rows: [
          { c: ["יתרה ל־1.1.2025", C.open.owners, "", `ההון של נופר בדוח הנפרד: ${sumF([NOFAR.capital, NOFAR.premium, C.open.reserve, NOFAR.retainedOpen])}. אין עדיין זשמ״ש`] },
          { c: ["רכישת חברה בת", "", C.acquisition.nci, `הזשמ״ש ביום הרכישה, מ${ref(H.goodwill)}. נופר שילמה במזומן, ולכן ההון של הבעלים לא זז`], from: { 2: "gw.nci" } },
          { c: ["דיבידנד שהוכרז", C.dividends.owners, C.dividends.nci, `בעלים: הדיבידנד של נופר. זשמ״ש: רק החלק של המיעוט בדיבידנד של ערמון, \`12,000 × 25%\``], from: { 2: "elim.nciDiv" } },
          { c: ["רווח כולל", C.comprehensive.owners, C.comprehensive.nci, `בעלים: \`${n(C.comprehensive.retained)}\` לעודפים ו־\`${n(C.comprehensive.reserve)}\` לקרן. הכול מ${ref(H.splitTotal)}`], from: { 1: "split.c.owners", 2: "split.c.nci" } },
        ],
      },
    ],
    result: "החלק של נופר בדיבידנד של ערמון לא מופיע: הוא התבטל מול ההכנסה שלה.",
  },
  {
    h: "הדוח",
    tables: [
      {
        // One table, as in the lecturer's sheet: the owners' columns, the minority and the total.
        cap: "הדוח המאוחד על השינויים בהון לשנת 2025",
        head: ["", "הון מניות", "פרמיה", "קרן הערכה מחדש", "עודפים", "סך הבעלים", "זשמ״ש", "סך ההון"],
        rows: [
          { c: ["יתרה ל־1.1.2025", C.open.capital, C.open.premium, e(C.open.reserve), C.open.retained, C.open.owners, e(C.open.nci), C.open.total] },
          { c: ["רכישת חברה בת", "", "", "", "", "", C.acquisition.nci, C.acquisition.total], from: { 6: "gw.nci" } },
          { c: ["דיבידנד שהוכרז", "", "", "", C.dividends.retained, C.dividends.owners, C.dividends.nci, C.dividends.total], from: { 6: "elim.nciDiv" } },
          { c: ["רווח כולל", "", "", C.comprehensive.reserve, C.comprehensive.retained, C.comprehensive.owners, C.comprehensive.nci, C.comprehensive.total], from: { 4: "split.owners", 5: "split.c.owners", 6: "split.c.nci", 7: "split.c.total" } },
          { c: ["יתרה ל־31.12.2025", C.close.capital, C.close.premium, C.close.reserve, C.close.retained, C.close.owners, C.close.nci, C.close.total], res: true, from: { 5: "eq.owners", 6: "eq.nci" } },
        ],
      },
    ],
    result: `העודפים: \`233,000 − 16,000 + 13,000 = ${n(C.close.retained)}\`. היתרות בסוף השנה, ${A(C.close.owners)} לבעלים ו־${A(C.close.nci)} לזשמ״ש, זהות לחלוקת ההון.`,
  },
];

const EXCESS_STEPS = excessSteps(S6);
const PL_STEPS = incomeSteps(S6);
const SPLIT_STEPS = [...adjustedSteps(S6), ...splitSteps(S6)];
const BS_STEPS = positionSteps(S6);
const EQUITY_STEPS = equitySteps(S6);

export const W6_DATA: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: מה יש במאזני הבוחן",
  required: ["1. מה הרווח בדוח של כל חברה?", "2. מה במאזני הבוחן קשור לקבוצה?"],
  tryFirst: "אילו שורות אצל נופר קיימות רק בגלל ערמון?",
  steps: DATA_STEPS,
});

export const W6_EXCESS: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: עודפי העלות והמוניטין",
  required: ["1. הציגו את טבלת עודף העלות לשנת 2025.", "2. חשבו את הנמ״נ ביום הרכישה ואת המוניטין.", "3. חלקו את המוניטין בין הבעלים לזשמ״ש."],
  tryFirst: "מה היה ההון של ערמון ב־1.1.2025, לפני שנוצרה הקרן ולפני הרווח של השנה?",
  steps: EXCESS_STEPS,
});

export const W6_ELIM: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: פקודות העזר",
  required: ["1. רשמו את פקודת העזר שמבטלת את ההשקעה ביום הרכישה.", "2. רשמו את פקודת העזר שמבטלת את הדיבידנד של ערמון."],
  tryFirst: "מה מתבטל מול ההשקעה של 140,000, ומה נכנס במקומה?",
  steps: ELIM_STEPS,
  notes: ELIM_NOTES,
});

export const W6_PL: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: הדוח המאוחד על הרווח הכולל",
  required: ["ערכו את דף העבודה של הדוח על הרווח הכולל לשנת 2025."],
  tryFirst: "אילו התאמות על חשבון ערמון, ואילו על חשבון נופר?",
  steps: PL_STEPS,
});

export const W6_SPLIT: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: של מי הרווח",
  required: ["1. חשבו את הרווח המתוקן של כל חברה.", "2. חלקו את הרווח הנקי ואת סך הרווח הכולל בין הבעלים לזשמ״ש."],
  tryFirst: "הזשמ״ש מקבלים 25% מאיזה רווח של ערמון?",
  steps: SPLIT_STEPS,
});

export const W6_BS: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: הדוח המאוחד על המצב הכספי",
  required: ["ערכו את דף העבודה של הדוח על המצב הכספי ליום 31.12.2025."],
  tryFirst: "יתרות או הפחתות: מה מטבלת עודף העלות נכנס למאזן?",
  steps: BS_STEPS,
});

export const W6_EQUITY: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: חלוקת ההון המאוחד",
  required: ["1. חשבו את הנמ״נ המתוקנים של כל חברה.", "2. חלקו את ההון בין הבעלים לזשמ״ש.", "3. פרטו את ההון של הבעלים."],
  tryFirst: "מה ההון של כל חברה מנקודת המבט של הקבוצה?",
  steps: EQUITY_STEPS,
});

export const W6_SOCE: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: הדוח המאוחד על השינויים בהון",
  required: ["ערכו את הדוח המאוחד על השינויים בהון לשנת 2025."],
  tryFirst: "מה יתרת הפתיחה בשנת הרכישה? ואיפה נכנס כל אחד משני הדיבידנדים?",
  steps: SOCE_STEPS,
});

/**
 * The whole example at once: the question and the trial balances once, then
 * every step from the profits to the statement of changes in equity, so a
 * figure can be followed back to where it came from.
 */
export const W6_FULL: Worked = numbered({
  ...base,
  title: "דוגמה פתורה: הדוחות המאוחדים של נופר וערמון לשנת 2025",
  required: [
    "1. הציגו את טבלת עודף העלות, וחשבו את הנמ״נ ביום הרכישה ואת המוניטין.",
    "2. רשמו את פקודות העזר שמבטלות את ההשקעה ואת הדיבידנד של ערמון.",
    "3. ערכו את דף העבודה של הדוח על הרווח הכולל, וחלקו את הרווח בין הבעלים לזשמ״ש.",
    "4. ערכו את דף העבודה של הדוח על המצב הכספי ליום 31.12.2025, וחלקו את ההון.",
    "5. ערכו את הדוח המאוחד על השינויים בהון.",
  ],
  tryFirst: "מה מכל טבלת עודף העלות צריך כל דוח: ההפחתות או היתרות? ושל מי כל התאמה?",
  steps: [...DATA_STEPS, ...EXCESS_STEPS, ...ELIM_STEPS, ...PL_STEPS, ...SPLIT_STEPS, ...BS_STEPS, ...EQUITY_STEPS, ...SOCE_STEPS],
  notes: ELIM_NOTES,
});

/* The second year. */
const Y2 = { profit: 40_000, dividend: 16_000 };
export const WORKSHEET_W = {
  nofarProfit: profitOf(NOFAR),
  armonProfit: profitOf(ARMON),
  nofarEquity: equityOf(NOFAR),
  armonEquity: equityOf(ARMON),
  y2Amort: 20_000 / 5,
  y2Net: (20_000 / 5) * 0.75,
  y2NciOpenShare: (YEAR2.armonOpen + YEAR2.excessOpen) * 0.25,
  armonClose: YEAR2.armonOpen + Y2.profit - Y2.dividend,
  nciCheck: (YEAR2.armonOpen + Y2.profit - Y2.dividend + YEAR2.excessEnd) * 0.25 + STORY6.goodwill.nciGoodwill,
  harmonProfit: profitOf(HARMON),
  gefanitProfit: profitOf(GEFANIT),
};
const WW = WORKSHEET_W;

export const W6_YEAR2: Worked = numbered({
  own: true,
  title: "דוגמה פתורה: נופר וערמון ב־2026",
  givens: [
    "ממשיכים מ־2025: נופר מחזיקה **75%** מערמון. לזשמ״ש מוניטין של **3,000** ש״ח.",
    "ב־31.12.2025 ההון של ערמון **148,000** ש״ח. יתרת עודף העלות על הציוד **16,000** ש״ח, והמס הנדחה עליה **4,000** ש״ח. עודף המלאי כבר הופחת כולו.",
    "ב־2026 ערמון הרוויחה **40,000** ש״ח, והכריזה על דיבידנד של **16,000** ש״ח. לא היה לה רווח כולל אחר.",
    "העודפים של נופר בדוח הנפרד ב־1.1.2026 **227,000** ש״ח.",
  ],
  required: ["1. הציגו את טבלת עודף העלות לשנת 2026.", "2. חשבו את הרווח המתוקן של ערמון ואת חלק הזשמ״ש בו.", "3. חשבו את הזשמ״ש לתחילת 2026 ולסופה.", "4. מה העודפים המאוחדים ב־1.1.2026?"],
  tryFirst: "אין ספרים מאוחדים. מאיזה מספרים מחשבים את הזשמ״ש לתחילת 2026?",
  steps: [
    {
      h: "טבלת עודף העלות לשנת 2026",
      tables: [
        {
          head: ["", "1.1.2026", "הפחתה", "31.12.2026", "חישוב"],
          rows: [
            { c: ["ציוד", 16_000, -WW.y2Amort, 16_000 - WW.y2Amort, "נתון. הפחתה `20,000 ÷ 5`, יתרה `16,000 − 4,000`"] },
            { c: ["מס נדחה", -4_000, WW.y2Amort * 0.25, -(16_000 - WW.y2Amort) * 0.25, "1.1: נתון. הפחתה: `25% × 4,000`. 31.12: `25% × 12,000`. בסימן הפוך"] },
            { c: ["סך הכול", YEAR2.excessOpen, -WW.y2Net, YEAR2.excessEnd, "ציוד ועוד מס נדחה"], res: true },
          ],
        },
      ],
      why: ["למה אין מלאי?", "המלאי נמכר כבר ב־2025. כל העודף שלו הופחת אז, ולכן ב־2026 אין לו שורה."],
      result: `הפחתה נטו ממס ${A(-WW.y2Net)}, ויתרה ${A(YEAR2.excessEnd)}.`,
    },
    {
      h: "הרווח המתוקן של ערמון",
      sheet: [
        { l: "הרווח בדוח של ערמון", a: Y2.profit },
        { l: "פחות הפחתת העודף, נטו ממס", a: -WW.y2Net, k: "op" },
        { l: "רווח מתוקן", a: YEAR2.adjusted, k: "sub" },
        { l: "חלק הזשמ״ש: `37,000 × 25%`", a: YEAR2.nciProfit, k: "tot" },
      ],
      result: `רווח מתוקן ${A(YEAR2.adjusted)}, ולזשמ״ש ${A(YEAR2.nciProfit)}.`,
      xl: "`=(40000-3000)*25%`",
    },
    {
      h: "הזשמ״ש לתחילת 2026",
      sheet: [
        { l: "חלק בנמ״נ ב־1.1.2026: `(148,000 + 12,000) × 25%`", a: WW.y2NciOpenShare },
        { l: "ועוד מוניטין של הזשמ״ש", a: STORY6.goodwill.nciGoodwill, k: "op" },
        { l: "יתרה ל־1.1.2026", a: YEAR2.nciOpen, k: "tot" },
      ],
      why: ["למה מחשבים מחדש?", "אין ספרים מאוחדים, ולכן אין יתרות שעוברות. מחשבים את הפתיחה לפי מה שהיה ב־1.1.2026, והיא יוצאת שווה ליתרה בסוף 2025, 43,000."],
      result: `יתרת פתיחה ${A(YEAR2.nciOpen)}.`,
    },
    {
      h: "הזשמ״ש לסוף 2026",
      sheet: [
        { l: "יתרה ל־1.1.2026", a: YEAR2.nciOpen },
        { l: "ועוד חלק ברווח הכולל של 2026", a: YEAR2.nciProfit, k: "op" },
        { l: "פחות דיבידנד למיעוט: `16,000 × 25%`", a: -YEAR2.nciDividend, k: "op" },
        { l: "יתרה ל־31.12.2026", a: YEAR2_NCI_END, k: "tot" },
      ],
      result: `בדיקה מסוף השנה: ההון של ערמון \`148,000 + 40,000 − 16,000 = ${n(WW.armonClose)}\`, ולכן \`(172,000 + 9,000) × 25% + 3,000 = ${n(WW.nciCheck)}\`.`,
    },
    {
      h: "העודפים המאוחדים ב־1.1.2026",
      sheet: [
        { l: "העודפים של נופר בדוח הנפרד", a: YEAR2.nofarRetainedOpen },
        { l: "ועוד חלק הבעלים ברווח המתוקן של ערמון ב־2025: `16,000 × 75%`", a: 12_000, k: "op" },
        { l: "פחות הדיבידנד שנופר קיבלה מערמון", a: -STORY6.dividendOut, k: "op" },
        { l: "עודפים מאוחדים ב־1.1.2026", a: STORY6.equity.retained, k: "tot" },
      ],
      why: ["למה לא 227,000?", "העודפים של נופר כוללים את הדיבידנד מערמון, ולא את החלק שלה ברווח של ערמון. במאוחד זה הפוך."],
      result: `${A(STORY6.equity.retained)}, כמו העודפים בחלוקת ההון ב־31.12.2025.`,
    },
  ],
});

/* The closing question. */
const SM: Story = {
  c: M6,
  a: HARMON,
  b: GEFANIT,
  an: "הרמון",
  bn: "גפנית",
  holding: 0.8,
  paid: 230_000,
  costs: 5_000,
  how: ["נתון. המלאי נמכר השנה, ולכן הופחת כולו", "שווי הוגן, לא רשום אצל גפנית. הפחתה `50,000 ÷ 5`, יתרה `50,000 − 10,000`"],
  year: "2026",
};

export const W6_MASTER: Worked = numbered({
  own: true,
  title: "השאלה המסכמת: הרמון וגפנית",
  givens: [
    "ב־1.1.2026 הרמון רכשה **80%** ממניות גפנית ב־**230,000** ש״ח במזומן. בנוסף שילמה **5,000** ש״ח לעורכי דין על העסקה, והוסיפה אותם לעלות ההשקעה. הרמון מודדת את ההשקעה לפי עלות. הזשמ״ש נמדדים לפי החלק בנמ״נ.",
    "באותו יום: למלאי של גפנית עודף עלות של **18,000** ש״ח, והוא נמכר במהלך 2026. לגפנית פטנט שלא רשום בספרים שלה, בשווי הוגן של **50,000** ש״ח, ונותרו לו **5** שנים. ההפחתה שלו נרשמת בהוצאות הנהלה וכלליות.",
    "שיעור המס **25%**. לשתי החברות אין רווח כולל אחר.",
  ],
  tables: [trialTable({ a: HARMON, b: GEFANIT, an: "הרמון", bn: "גפנית", year: "2026" })],
  required: [
    "1. חשבו את טבלת עודף העלות ואת המוניטין.",
    "2. חשבו את הרווח המתוקן של כל חברה.",
    "3. ערכו את הדוח המאוחד על הרווח הכולל לשנת 2026, עם חלוקת הרווח.",
    "4. ערכו את הדוח המאוחד על המצב הכספי ליום 31.12.2026, עם פירוט ההון.",
    "5. הציגו את התנועה בזשמ״ש בדוח המאוחד על השינויים בהון.",
  ],
  tryFirst: "שכר הטרחה רשום בתוך ההשקעה. איפה הוא צריך להיות במאוחד, ומה זה עושה למוניטין?",
  steps: [...profitSteps(SM), ...excessSteps(SM), ...adjustedSteps(SM), ...incomeSteps(SM), ...splitSteps(SM), ...positionSteps(SM), ...equitySteps(SM), nciMoveStep(SM)],
  notes: ["מלכודות נפוצות: להשאיר את שכר הטרחה בתוך ההשקעה ובמוניטין, לחשב את הזשמ״ש מהרווח של גפנית בדוח שלה, או לחבר את העודפים של שתי החברות."],
});
