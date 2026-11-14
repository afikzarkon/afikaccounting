import type { Books, consolidate } from "../../../learn/consolidated";
import { ARMON, GEFANIT, HARMON, M6, NOFAR, STORY6, YEAR2, YEAR2_NCI_END } from "../lessons/worksheet";
import { A, type Worked, type WStep, type WTable } from "./types";

/**
 * Lesson 6's numeric demonstrations as full worked solutions, by the owner's
 * word of 2026-11-12 (all 66 demonstrations of the course, the whole way).
 * One story runs through the lesson, Nofar and Armon, and the closing question
 * is Harmon and Gefanit. The steps are built once, from the solver's output,
 * so both are worked the same way and every figure comes from the solver.
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
  /** How each excess item is amortized, in words with a formula. */
  how: string[];
  year: string;
};

const n = (v: number) => v.toLocaleString("en-US");
const pct = (v: number) => `${Math.round(v * 100)}%`;
const e = (v: number) => (v === 0 ? "" : v);
const profitOf = (k: Books) => k.sales - k.cogs - k.admin + k.dividendIncome - k.tax;
const equityOf = (k: Books) => k.capital + k.premium + k.reserve + k.retainedOpen - k.dividend + profitOf(k);
const je = (cap: string, lines: [string, number | "", number | ""][]): WTable => ({ cap, head: ["חשבון", "חובה", "זכות"], rows: lines.map((l) => ({ c: l })) });

/** A trial balance as the lecturer gives it: debits positive, credits negative. */
export function trialTable(s: { a: Books; b: Books; an: string; bn: string; year: string }): WTable {
  const line = (label: string, f: (k: Books) => number, sign: 1 | -1) => ({ c: [label, e(sign * f(s.a)), e(sign * f(s.b))] });
  return {
    cap: `מאזני הבוחן לשנת ${s.year}: חובה חיובי, זכות בסוגריים`,
    head: ["", s.an, s.bn],
    rows: [
      line("מזומנים", (k) => k.cash, 1),
      line("מלאי", (k) => k.inventory, 1),
      line("רכוש קבוע", (k) => k.ppe, 1),
      line("השקעה בחברה בת", (k) => k.investment, 1),
      line("ספקים", (k) => k.suppliers, -1),
      line("מסים נדחים", (k) => k.deferredTax, -1),
      line("הון מניות", (k) => k.capital, -1),
      line("פרמיה", (k) => k.premium, -1),
      ...(s.a.reserve || s.b.reserve ? [line("קרן הערכה מחדש", (k) => k.reserve, -1)] : []),
      line("עודפים 1.1", (k) => k.retainedOpen, -1),
      line("מכירות", (k) => k.sales, -1),
      line("עלות המכירות", (k) => k.cogs, 1),
      line("הוצאות הנהלה וכלליות", (k) => k.admin, 1),
      line("הכנסות מדיבידנד", (k) => k.dividendIncome, -1),
      line("הוצאות מסים", (k) => k.tax, 1),
      line("דיבידנד שהוכרז", (k) => k.dividend, 1),
    ],
  };
}

function profitStep(s: Story): WStep {
  const col = (k: Books) => [k.sales, -k.cogs, -k.admin, e(k.dividendIncome), -k.tax, profitOf(k)];
  const A_ = col(s.a);
  const B_ = col(s.b);
  const labels = ["מכירות", "עלות המכירות", "הוצאות הנהלה וכלליות", "הכנסות מדיבידנד", "הוצאות מסים", "רווח נקי"];
  return {
    h: "הרווח בדוח של כל חברה",
    why: ["מאיפה?", "מסכמים את שורות הרווח והפסד במאזן הבוחן. קרן ההערכה מחדש והדיבידנד שהוכרז לא נכנסים לרווח הנקי."],
    tables: [{ head: ["", s.an, s.bn], rows: labels.map((l, i) => ({ c: [l, A_[i], B_[i]], res: i === labels.length - 1 })) }],
    result: `${s.an} ${A(profitOf(s.a))}, ${s.bn} ${A(profitOf(s.b))}.`,
  };
}

function excessSteps(s: Story): WStep[] {
  const { c } = s;
  const t = c.table;
  const sumAt = t.items.reduce((x, r) => x + r.at, 0);
  const sumEnd = t.items.reduce((x, r) => x + r.end, 0);
  return [
    {
      h: "טבלת עודף העלות",
      why: ["מה צריך ממנה?", "לדוח רווח כולל צריך את ההפחתות של השנה. לדוח על המצב הכספי צריך את היתרות בסוף השנה."],
      tables: [
        {
          head: ["", "ייחוס 1.1", "הפחתה", "יתרה 31.12", "איך"],
          rows: [
            ...t.items.map((r, i) => ({ c: [r.name, r.at, r.amortized, r.end, s.how[i]] })),
            { c: [t.tax.name, t.tax.at, t.tax.amortized, t.tax.end, `\`25% × ${n(sumAt)}\` ו־\`25% × ${n(sumEnd)}\`, בסימן הפוך`] },
            { c: ["סך הכול", t.total.at, t.total.amortized, t.total.end, ""], res: true },
          ],
        },
      ],
      result: `עודפי העלות נטו ממס ${A(t.total.at)} ביום הרכישה, הפחתה של ${A(t.total.amortized)} בשנה, ויתרה של ${A(t.total.end)}.`,
    },
    {
      h: "הנכסים המזוהים נטו ביום הרכישה",
      sheet: [
        { l: "הון מניות", a: s.b.capital },
        { l: "ועוד פרמיה", a: s.b.premium, k: "op" },
        { l: "ועוד עודפים ב־1.1", a: s.b.retainedOpen, k: "op" },
        { l: `ההון של ${s.bn} ביום הרכישה`, a: c.subEquityAt, k: "sub" },
        { l: "ועוד עודפי עלות נטו ממס", a: t.total.at, k: "op" },
        { l: "נכסים מזוהים נטו", a: c.netAt, k: "tot" },
      ],
      why: [
        "מה עם הקרן והרווח?",
        s.b.reserve ? "הקרן נוצרה במהלך השנה, והרווח והדיבידנד הם של השנה. ביום הרכישה, 1.1, ההון היה רק הון המניות, הפרמיה והעודפים לתחילת השנה." : "הרווח והדיבידנד הם של השנה. ביום הרכישה, 1.1, ההון היה רק הון המניות, הפרמיה והעודפים לתחילת השנה.",
      ],
      result: `הנמ״נ ${A(c.netAt)}.`,
    },
    {
      h: "המוניטין",
      sheet: [
        { l: "תמורה שהועברה", a: s.paid },
        { l: c.premium || s.costs === 0 ? "ועוד זשמ״ש בשווי הוגן" : `ועוד זשמ״ש: \`${n(c.netAt)} × ${pct(1 - s.holding)}\``, a: c.goodwill.nci, k: "op" },
        { l: "עלות צירוף העסקים", a: c.goodwill.cost, k: "sub" },
        { l: "פחות נכסים מזוהים נטו", a: -c.netAt, k: "op" },
        { l: "מוניטין", a: c.goodwill.goodwill, k: "tot" },
      ],
      why: s.costs
        ? ["ושכר הטרחה?", `${A(s.costs)} ששולמו לעורכי הדין הם עלויות רכישה. הם לא חלק מהתמורה, ולכן לא נכנסים למוניטין. במאוחד הם הוצאה, על חשבון ${s.an}.`]
        : ["מה נכנס לתמורה?", "רק מה שהועבר למוכר. אילו היו עלויות רכישה, הן לא היו נכנסות."],
      result: `מוניטין ${A(c.goodwill.goodwill)}.`,
    },
    ...(c.premium
      ? [
          {
            h: "של מי המוניטין",
            tables: [
              {
                head: ["", "סך הכול", `בעלים של ${s.an}`, "זשמ״ש"],
                rows: [
                  { c: [`פרמיית שליטה: \`${n(s.paid)} − ${n(c.goodwill.nci)} × 3\``, c.premium, c.premium, 0] },
                  { c: ["מוניטין בלי פרמיה, לפי 75/25", c.goodwill.goodwill - c.premium, c.goodwill.ownersGoodwill - c.premium, c.goodwill.nciGoodwill] },
                  { c: ["סך המוניטין", c.goodwill.goodwill, c.goodwill.ownersGoodwill, c.goodwill.nciGoodwill], res: true },
                ],
              },
            ],
            why: ["למה פי 3?", `השווי ההוגן של 25% הוא ${n(c.goodwill.nci)}, ולכן 75% שווים פי שלושה: ${n(c.goodwill.nci * 3)}. ${s.an} שילמה ${n(s.paid)}, וההפרש הוא פרמיית השליטה. היא כולה של הבעלים.`] as [string, string],
            result: `לבעלים ${A(c.goodwill.ownersGoodwill)}, לזשמ״ש ${A(c.goodwill.nciGoodwill)}.`,
          },
        ]
      : []),
  ];
}

function adjustedStep(s: Story): WStep {
  const { c } = s;
  return {
    h: "הרווח המתוקן של כל חברה",
    why: ["מה זה רווח מתוקן?", "הרווח בדוח של החברה, ועוד ההתאמות שעל חשבונה. כך נראה הרווח שלה מנקודת המבט של הקבוצה."],
    tables: [
      {
        head: ["", s.an, s.bn],
        rows: [
          { c: ["רווח בדוח הנפרד או העצמאי", c.adjusted.a.separate, c.adjusted.b.separate] },
          { c: ["הפחתת עודפי עלות, נטו ממס", "", c.adjusted.b.excess] },
          { c: [`ביטול הכנסות מדיבידנד: \`${n(s.b.dividend)} × ${pct(s.holding)}\``, c.adjusted.a.dividend, ""] },
          ...(s.costs ? [{ c: ["עלויות רכישה", c.adjusted.a.costs, ""] }] : []),
          { c: ["רווח מתוקן", c.adjusted.a.total, c.adjusted.b.total], res: true },
        ],
      },
    ],
    result: `${s.an} ${A(c.adjusted.a.total)}, ${s.bn} ${A(c.adjusted.b.total)}. יחד ${A(c.adjusted.a.total + c.adjusted.b.total)}, הרווח הנקי המאוחד.`,
  };
}

function incomeTable(s: Story): WTable {
  const { c } = s;
  const cells = (r: { a: number; b: number; adjA: number; adjB: number; total: number }) => [e(r.a), e(r.b), e(r.adjA), e(r.adjB), r.total];
  const hasOci = c.oci.a !== 0 || c.oci.b !== 0;
  return {
    cap: `דף העבודה של הדוח על הרווח הכולל לשנת ${s.year}`,
    head: ["", s.an, s.bn, `התאמות ${s.an}`, `התאמות ${s.bn}`, "מאוחד"],
    rows: [
      ...c.income.map((r) => ({ c: [r.name, ...cells(r)] })),
      { c: ["רווח נקי", ...cells(c.profit)], res: true },
      ...(hasOci ? [{ c: [c.oci.name, ...cells(c.oci)] }, { c: ["סך הרווח הכולל", ...cells(c.comprehensive)], res: true }] : []),
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
      h: `ההתאמות על חשבון ${s.bn}`,
      sheet: [
        { l: "עלות המכירות: הפחתת עודף המלאי", a: cogs },
        { l: "הוצאות הנהלה וכלליות: הפחתת העודף", a: admin, k: "op" },
        { l: `הוצאות מסים: \`25% × ${n(-(cogs + admin))}\``, a: taxAdj, k: "op" },
        { l: "סך ההתאמות", a: c.profit.adjB, k: "tot" },
      ],
      why: ["למה המס בסימן הפוך?", "ההפחתות מקטינות את הרווח לפני מס. המס הנדחה שנגרע איתן מקטין את הוצאות המסים, ולכן הוא חיובי."],
      result: `ההתאמות של ${s.bn} מקטינות את הרווח ב־${A(-c.profit.adjB)}, בדיוק הפחתת עודפי העלות נטו ממס מהטבלה.`,
    },
    {
      h: `ההתאמות על חשבון ${s.an}`,
      sheet: [
        { l: `ביטול הכנסות מדיבידנד: \`${n(s.b.dividend)} × ${pct(s.holding)}\``, a: -c.dividendOut },
        ...(s.costs ? [{ l: "עלויות רכישה, להוצאות הנהלה וכלליות", a: -s.costs, k: "op" as const }] : []),
        { l: "סך ההתאמות", a: c.profit.adjA, k: "tot" as const },
      ],
      why: ["למה מבטלים את הדיבידנד?", `הרווח של ${s.bn} כבר נכנס למאוחד שורה אחרי שורה. אם נשאיר גם את הדיבידנד שהיא חילקה ל־${s.an}, אותו רווח ייספר פעמיים.`],
      result: `ההתאמות של ${s.an}: ${A(c.profit.adjA)}.`,
    },
    {
      h: "דף העבודה",
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
      h: "חלוקת הרווח הנקי",
      sheet: [
        { l: `זשמ״ש: \`${n(c.adjusted.b.total)} × ${pct(out)}\``, a: c.split.profit.nci },
        { l: `בעלים של ${s.an}: \`${n(c.adjusted.a.total)} + ${n(c.adjusted.b.total)} × ${pct(s.holding)}\``, a: c.split.profit.owners },
        { l: "רווח נקי מאוחד", a: c.split.profit.total, k: "tot" },
      ],
      why: ["למה מהרווח המתוקן?", `הזשמ״ש נושאים בחלקם בהפחתת עודפי העלות, כי הם בעלים ב־${s.bn}. לכן מחשבים מהרווח המתוקן שלה, לא מהרווח בדוח שלה.`],
      result: `בדרך ההפוכה: \`${n(c.split.profit.total)} − ${n(c.split.profit.nci)} = ${n(c.split.profit.owners)}\`.`,
    },
    ...(hasOci
      ? [
          {
            h: "חלוקת סך הרווח הכולל",
            sheet: [
              { l: `זשמ״ש: \`(${n(c.adjusted.b.total)} + ${n(s.b.reserve)}) × ${pct(out)}\``, a: c.split.comprehensive.nci },
              { l: `בעלים: \`${n(c.adjusted.a.total)} + ${n(s.a.reserve)} + (${n(c.adjusted.b.total)} + ${n(s.b.reserve)}) × ${pct(s.holding)}\``, a: c.split.comprehensive.owners },
              { l: "סך הרווח הכולל המאוחד", a: c.split.comprehensive.total, k: "tot" as const },
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
  const eq = (label: string, v: number, res?: boolean) => ({ c: [label, "", "", "", -v], res });
  return {
    cap: "דף העבודה של הדוח על המצב הכספי: נכסים חיוביים, התחייבויות והון בסוגריים",
    head: ["", s.an, s.bn, "התאמות", "מאוחד"],
    rows: [
      ...c.position.map((r) => ({ c: [r.name, e(r.a), e(r.b), e(r.adj), r.total] })),
      eq("הון מניות", c.equity.capital),
      eq("פרמיה", c.equity.premium),
      ...(c.equity.reserve ? [eq("קרן הערכה מחדש", c.equity.reserve)] : []),
      eq("עודפים", c.equity.retained),
      eq(`סך ההון של בעלי מניות ${s.an}`, c.equity.owners, true),
      eq("זשמ״ש", c.equity.nci),
      eq("סך ההון", c.equity.total, true),
    ],
  };
}

function positionSteps(s: Story): WStep[] {
  const { c } = s;
  const adj = c.position.filter((r) => r.adj !== 0);
  return [
    {
      h: "ההתאמות בדוח על המצב הכספי",
      sheet: adj.map((r, i) => ({ l: r.name, a: r.adj, k: i === 0 ? undefined : ("op" as const) })),
      why: ["מה נכנס?", "יתרות עודפי העלות בסוף השנה, לא ההפחתות. המס הנדחה על היתרה מצטרף למסים הנדחים. ההשקעה מתבטלת, והמוניטין נכנס."],
      result: `${adj.map((r) => `${r.name} ${A(r.adj)}`).join(", ")}.`,
    },
    {
      h: "דף העבודה",
      tables: [positionTable(s)],
      result: `נכסים ${A(c.assets)}, התחייבויות ${A(c.liabilities)}, הון \`${n(c.assets)} − ${n(c.liabilities)} = ${n(c.equity.total)}\`. שורות ההון באות מחלוקת ההון בין הבעלים לזשמ״ש: ${c.equity.reserve ? `הקרן \`${n(s.a.reserve)} + ${n(s.b.reserve)} × ${pct(s.holding)} = ${n(c.equity.reserve)}\`, ` : ""}העודפים הם ההפרש \`${n(c.equity.owners)} − ${n(c.equity.capital)} − ${n(c.equity.premium)}${c.equity.reserve ? ` − ${n(c.equity.reserve)}` : ""} = ${n(c.equity.retained)}\`, והזשמ״ש ${A(c.equity.nci)}. הפירוט המלא בחלוקת ההון.`,
    },
  ];
}

function equitySteps(s: Story): WStep[] {
  const { c } = s;
  const out = 1 - s.holding;
  const eqA = c.equity.netA + s.a.investment;
  const eqB = c.equity.netB - c.table.total.end;
  return [
    {
      h: "הנמ״נ המתוקנים",
      tables: [
        {
          head: ["", s.an, s.bn],
          rows: [
            { c: ["הון בדוח הנפרד או העצמאי", eqA, eqB] },
            { c: ["ועוד יתרות עודפי עלות, נטו ממס", "", c.table.total.end] },
            { c: ["פחות ביטול ההשקעה", -s.a.investment, ""] },
            { c: ["נמ״נ מתוקנים", c.equity.netA, c.equity.netB], res: true },
          ],
        },
      ],
      why: ["מאיפה ההון של כל חברה?", `הון מניות, פרמיה, קרן ועודפים 1.1, פחות דיבידנד ועוד הרווח. ${s.an}: ${A(eqA)}. ${s.bn}: ${A(eqB)}.`],
      result: `${s.an} ${A(c.equity.netA)}, ${s.bn} ${A(c.equity.netB)}.`,
    },
    {
      h: "החלוקה בין הבעלים לזשמ״ש",
      tables: [
        {
          head: ["", `בעלים של ${s.an}`, "זשמ״ש"],
          rows: [
            { c: [`חלק בנמ״נ: \`${n(c.equity.netA)} + ${n(c.equity.netB)} × ${pct(s.holding)}\` ו־\`${n(c.equity.netB)} × ${pct(out)}\``, c.equity.owners - c.goodwill.ownersGoodwill, c.equity.nci - c.goodwill.nciGoodwill] },
            { c: ["ועוד חלק במוניטין", c.goodwill.ownersGoodwill, c.goodwill.nciGoodwill] },
            { c: ["סך הכול", c.equity.owners, c.equity.nci], res: true },
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
        { l: "סך ההון של הבעלים", a: c.equity.owners, k: "tot" },
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
    tables: [
      {
        head: ["זשמ״ש", "סכום"],
        rows: [
          { c: [`יתרה ל־1.1.${s.year}`, ch.open.nci] },
          { c: ["רכישת חברה בת", ch.acquisition.nci] },
          { c: [`דיבידנד שהוכרז: \`${n(s.b.dividend)} × ${pct(1 - s.holding)}\``, ch.dividends.nci] },
          { c: ["רווח כולל", ch.comprehensive.nci] },
          { c: [`יתרה ל־31.12.${s.year}`, ch.close.nci], res: true },
        ],
      },
    ],
    result: `${A(ch.close.nci)}, כמו בחלוקת ההון.`,
  };
}

/* The story. */
const S6: Story = { c: STORY6, a: NOFAR, b: ARMON, an: "נופר", bn: "ערמון", holding: 0.75, paid: 140_000, costs: 0, how: ["המלאי נמכר: הכול הופחת", "`20,000 ÷ 5 = 4,000` בשנה"], year: "2025" };
const STORY_GIVENS = [
  "ב־1.1.2025 נופר קנתה **75%** ממניות ערמון ב־**140,000** ש״ח במזומן, ומודדת את ההשקעה לפי עלות. הזשמ״ש נמדדים בשווי הוגן: **40,000** ש״ח.",
  "באותו יום למלאי של ערמון עודף עלות של **12,000** ש״ח, והוא נמכר במהלך 2025. לציוד, שמשמש את ההנהלה, עודף עלות של **20,000** ש״ח, ונותרו לו **5** שנים. שיעור המס **25%**.",
  "קרן ההערכה מחדש בשתי החברות נוצרה במהלך 2025.",
];
const storyTb = trialTable({ a: NOFAR, b: ARMON, an: "נופר", bn: "ערמון", year: "2025" });
const base = { own: true, givens: STORY_GIVENS, tables: [storyTb] };

export const W6_DATA: Worked = {
  ...base,
  title: "דוגמה פתורה: מה יש במאזני הבוחן",
  required: ["1. מה הרווח בדוח של כל חברה?", "2. מה במאזני הבוחן קשור לקבוצה?"],
  tryFirst: "אילו שורות אצל נופר קיימות רק בגלל ערמון?",
  steps: [
    profitStep(S6),
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
  ],
};

export const W6_EXCESS: Worked = {
  ...base,
  title: "דוגמה פתורה: עודפי העלות והמוניטין",
  required: ["1. הציגו את טבלת עודף העלות לשנת 2025.", "2. חשבו את הנמ״נ ביום הרכישה ואת המוניטין.", "3. חלקו את המוניטין בין הבעלים לזשמ״ש."],
  tryFirst: "מה היה ההון של ערמון ב־1.1.2025, לפני שנוצרה הקרן ולפני הרווח של השנה?",
  steps: excessSteps(S6),
};

export const W6_ELIM: Worked = {
  ...base,
  title: "דוגמה פתורה: פקודות העזר",
  required: ["1. רשמו את פקודת העזר שמבטלת את ההשקעה ביום הרכישה.", "2. רשמו את פקודת העזר שמבטלת את הדיבידנד של ערמון."],
  tryFirst: "מה מתבטל מול ההשקעה של 140,000, ומה נכנס במקומה?",
  steps: [
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
      h: "ביטול הדיבידנד",
      sheet: [
        { l: "הדיבידנד שערמון הכריזה", a: ARMON.dividend },
        { l: "החלק של נופר: `12,000 × 75%`", a: STORY6.dividendOut, k: "sub" },
        { l: "החלק של המיעוט: `12,000 × 25%`", a: ARMON.dividend - STORY6.dividendOut, k: "sub" },
      ],
      why: ["לאן הולך כל חלק?", "החלק של נופר רשום אצלה כהכנסה, והוא מתבטל. החלק של המיעוט מקטין את הזשמ״ש. העודפים של ערמון חוזרים כאילו לא חולק דיבידנד בתוך הקבוצה."],
      tables: [je("פקודת עזר: ביטול הדיבידנד", [["ח׳ הכנסות מדיבידנד", STORY6.dividendOut, ""], ["ח׳ זשמ״ש", ARMON.dividend - STORY6.dividendOut, ""], ["ז׳ עודפים (דיבידנד שהוכרז)", "", ARMON.dividend]])],
      result: "הרווח של ערמון כבר נכנס למאוחד שורה אחרי שורה, ולכן הדיבידנד לא נספר שוב.",
    },
  ],
  notes: ["אילו נופר הייתה מוסיפה לעלות ההשקעה שכר טרחה, למשל 3,000, הפקודה הייתה: ח׳ הוצאות הנהלה וכלליות 3,000, ז׳ השקעה בחברה בת 3,000. המוניטין מחושב לפי התמורה, וההשקעה מתבטלת בסכום שרשום אצל האם."],
};

export const W6_PL: Worked = {
  ...base,
  title: "דוגמה פתורה: הדוח המאוחד על הרווח הכולל",
  required: ["ערכו את דף העבודה של הדוח על הרווח הכולל לשנת 2025."],
  tryFirst: "אילו התאמות על חשבון ערמון, ואילו על חשבון נופר?",
  steps: incomeSteps(S6),
};

export const W6_SPLIT: Worked = {
  ...base,
  title: "דוגמה פתורה: של מי הרווח",
  required: ["1. חשבו את הרווח המתוקן של כל חברה.", "2. חלקו את הרווח הנקי ואת סך הרווח הכולל בין הבעלים לזשמ״ש."],
  tryFirst: "הזשמ״ש מקבלים 25% מאיזה רווח של ערמון?",
  steps: [adjustedStep(S6), ...splitSteps(S6)],
};

export const W6_BS: Worked = {
  ...base,
  title: "דוגמה פתורה: הדוח המאוחד על המצב הכספי",
  required: ["ערכו את דף העבודה של הדוח על המצב הכספי ליום 31.12.2025."],
  tryFirst: "יתרות או הפחתות: מה מטבלת עודף העלות נכנס למאזן?",
  steps: positionSteps(S6),
};

export const W6_EQUITY: Worked = {
  ...base,
  title: "דוגמה פתורה: חלוקת ההון המאוחד",
  required: ["1. חשבו את הנמ״נ המתוקנים של כל חברה.", "2. חלקו את ההון בין הבעלים לזשמ״ש.", "3. פרטו את ההון של הבעלים."],
  tryFirst: "מה ההון של כל חברה מנקודת המבט של הקבוצה?",
  steps: equitySteps(S6),
};

const C = STORY6.changes;
export const W6_SOCE: Worked = {
  ...base,
  title: "דוגמה פתורה: הדוח המאוחד על השינויים בהון",
  required: ["ערכו את הדוח המאוחד על השינויים בהון לשנת 2025."],
  tryFirst: "מה יתרת הפתיחה בשנת הרכישה? ואיפה נכנס כל אחד משני הדיבידנדים?",
  steps: [
    {
      h: "השורות",
      tables: [
        {
          head: ["השורה", "החישוב"],
          rows: [
            { c: ["יתרה ל־1.1.2025", `ההון של נופר בדוח הנפרד: \`40,000 + 60,000 + 233,000 = ${n(C.open.owners)}\`. אין עדיין זשמ״ש`] },
            { c: ["רכישת חברה בת", `הזשמ״ש ביום הרכישה, ${n(C.acquisition.nci)}. נופר שילמה במזומן, ולכן ההון של הבעלים לא זז`] },
            { c: ["דיבידנד שהוכרז", `של נופר: ${n(NOFAR.dividend)} מהעודפים. של ערמון: רק החלק של המיעוט, \`12,000 × 25% = 3,000\``] },
            { c: ["רווח כולל", `לבעלים ${n(STORY6.split.profit.owners)} בעודפים ו־${n(C.comprehensive.reserve)} בקרן. לזשמ״ש ${n(C.comprehensive.nci)}`] },
          ],
        },
      ],
      result: "החלק של נופר בדיבידנד של ערמון לא מופיע: הוא התבטל מול ההכנסה שלה.",
    },
    {
      h: "החלק של הבעלים",
      tables: [
        {
          head: ["", "הון מניות", "פרמיה", "קרן", "עודפים", "סך הבעלים"],
          rows: [
            { c: ["יתרה ל־1.1.2025", C.open.capital, C.open.premium, e(C.open.reserve), C.open.retained, C.open.owners] },
            { c: ["דיבידנד שהוכרז", "", "", "", C.dividends.retained, C.dividends.owners] },
            { c: ["רווח כולל", "", "", C.comprehensive.reserve, C.comprehensive.retained, C.comprehensive.owners] },
            { c: ["יתרה ל־31.12.2025", C.close.capital, C.close.premium, C.close.reserve, C.close.retained, C.close.owners], res: true },
          ],
        },
      ],
      result: `העודפים: \`233,000 − 16,000 + 13,000 = ${n(C.close.retained)}\`.`,
    },
    {
      h: "הסיכום, עם הזשמ״ש",
      tables: [
        {
          head: ["", "סך הבעלים", "זשמ״ש", "סך ההון"],
          rows: [
            { c: ["יתרה ל־1.1.2025", C.open.owners, e(C.open.nci), C.open.total] },
            { c: ["רכישת חברה בת", "", C.acquisition.nci, C.acquisition.total] },
            { c: ["דיבידנד שהוכרז", C.dividends.owners, C.dividends.nci, C.dividends.total] },
            { c: ["רווח כולל", C.comprehensive.owners, C.comprehensive.nci, C.comprehensive.total] },
            { c: ["יתרה ל־31.12.2025", C.close.owners, C.close.nci, C.close.total], res: true },
          ],
        },
      ],
      result: `היתרות בסוף השנה, ${A(C.close.owners)} לבעלים ו־${A(C.close.nci)} לזשמ״ש, זהות לחלוקת ההון. הכול נסגר.`,
    },
  ],
};

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

export const W6_YEAR2: Worked = {
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
          head: ["", "1.1.2026", "הפחתה", "31.12.2026"],
          rows: [
            { c: ["ציוד: `20,000 ÷ 5 = 4,000` בשנה", 16_000, -WW.y2Amort, 16_000 - WW.y2Amort] },
            { c: ["מס נדחה, 25%", -4_000, WW.y2Amort * 0.25, -(16_000 - WW.y2Amort) * 0.25] },
            { c: ["סך הכול", YEAR2.excessOpen, -WW.y2Net, YEAR2.excessEnd], res: true },
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
      h: "הזשמ״ש לתחילת 2026 ולסופה",
      tables: [
        {
          head: ["הזשמ״ש", "סכום"],
          rows: [
            { c: ["חלק בנמ״נ ב־1.1.2026: `(148,000 + 12,000) × 25%`", WW.y2NciOpenShare] },
            { c: ["ועוד מוניטין של הזשמ״ש", STORY6.goodwill.nciGoodwill] },
            { c: ["יתרה ל־1.1.2026", YEAR2.nciOpen], res: true },
            { c: ["ועוד חלק ברווח הכולל של 2026", YEAR2.nciProfit] },
            { c: ["פחות דיבידנד למיעוט: `16,000 × 25%`", -YEAR2.nciDividend] },
            { c: ["יתרה ל־31.12.2026", YEAR2_NCI_END], res: true },
          ],
        },
      ],
      why: ["למה מחשבים מחדש?", "אין ספרים מאוחדים, ולכן אין יתרות שעוברות. מחשבים את הפתיחה לפי מה שהיה ב־1.1.2026, והיא יוצאת שווה ליתרה בסוף 2025, 43,000."],
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
};

/* The closing question. */
const SM: Story = { c: M6, a: HARMON, b: GEFANIT, an: "הרמון", bn: "גפנית", holding: 0.8, paid: 230_000, costs: 5_000, how: ["המלאי נמכר: הכול הופחת", "`50,000 ÷ 5 = 10,000` בשנה"], year: "2026" };

export const W6_MASTER: Worked = {
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
  steps: [profitStep(SM), ...excessSteps(SM), adjustedStep(SM), ...incomeSteps(SM), ...splitSteps(SM), ...positionSteps(SM), ...equitySteps(SM), nciMoveStep(SM)],
  notes: ["מלכודות נפוצות: להשאיר את שכר הטרחה בתוך ההשקעה ובמוניטין, לחשב את הזשמ״ש מהרווח של גפנית בדוח שלה, או לחבר את העודפים של שתי החברות."],
};
