import { type Balances, balancesOf, type Entry, ledger, round2, statements } from "@/lib/learn/basics";
import { ALMOG } from "@/lib/learn/basics-exam";
import { EXAM1, EXAM2, EXAM3, EXAM4, EXAM5, EXAM6, EXAM7, EXAM8, solveWorksheet, type WorksheetExam } from "@/lib/learn/basics-exams";
import { AGAM, GILAD, NEVEH } from "@/lib/learn/basics-booklet";
import { AR, ALLOW, EXPENSE } from "@/lib/learn/credit-losses";
import type { WEntry, WLine, WLCard, WLRow, WorkedBody, WStep, WTB } from "../worked";

/**
 * The basics course's worksheet questions (exams 5 to 8, the lesson 6
 * booklet, Almog) in the worked-solution layout the owner approved on
 * 2026-11-10: each "?" balance as a sheet, retained earnings as the line that
 * closes the preliminary trial balance, the entries in the order of the facts
 * (the ones on customers and the allowance together, as the credit lesson
 * draws them), the multi-column worksheet, and the profit and retained
 * earnings. Everything is built from the exam's own data.
 */

const LETTERS = "אבגדהוזח";
const f = (v: number) => Math.round(v).toLocaleString("en-US");

export type WorksheetQuestion = {
  preliminary: Balances;
  /** The "?" balances found from the story, before retained earnings, each with its sheet (or a line of working) and why. */
  computed: { account: string; why?: string; sheet?: WLine[] }[];
  entries: Entry[];
  trap: string;
  /** The allowance the year end needs, as the course's formula and the numbers. */
  allowance?: [string, string];
};

const toLines = (e: Entry) => e.lines.map((l) => ({ a: l.account, dr: l.dr, cr: l.cr }));
const asEntry = (e: Entry): WEntry => ({ lines: toLines(e), why: e.why });
const touchesCredit = (e: Entry) => e.lines.some((l) => l.account === AR || l.account === ALLOW);
const isTopUp = (e: Entry) => e.lines.some((l) => l.account === EXPENSE) && e.lines.some((l) => l.account === ALLOW);

/** A card of the credit picture: the balance before, then each entry's line on it, the closing balance under the rule. */
function creditCard(account: string, before: number, entries: Entry[], final: number, topUp?: Entry): WLCard {
  const dr: WLRow[] = [];
  const cr: WLRow[] = [];
  if (before > 0) dr.push({ l: "יתרה לפני", a: before });
  if (before < 0) cr.push({ l: "יתרה לפני", a: -before });
  for (const e of entries)
    for (const l of e.lines.filter((x) => x.account === account)) {
      const row: WLRow = { l: e.text, a: (l.dr ?? l.cr)!, ...(e === topUp ? { letter: "א", entry: true } : {}) };
      (l.dr ? dr : cr).push(row);
    }
  return { name: account, dr, cr, close: { side: final >= 0 ? "dr" : "cr", a: Math.abs(final), to: account === ALLOW && !!topUp } };
}

export function worksheetWorked(q: WorksheetQuestion): WorkedBody {
  const final = balancesOf(ledger(q.entries, q.preliminary));
  const s = statements(final);
  const retainedOpening = -(q.preliminary["עודפים"] ?? 0);
  const retainedClosing = round2(retainedOpening + s.profit);
  const letters = new Map([...q.computed.map((c) => c.account), "עודפים"].map((a, i) => [a, LETTERS[i]]));

  const steps: WStep[] = q.computed.map((c) => ({
    h: `${c.account}: מהסיפור`,
    sheet: c.sheet,
    p: c.sheet ? undefined : c.why ? [c.why] : undefined,
    why: c.sheet && c.why ? ["למה?", c.why] : undefined,
  }));
  steps.push({
    h: "העודפים: השורה שסוגרת את מאזן הבוחן הראשוני",
    tb: { rows: Object.entries(q.preliminary).map(([a, v]) => ({ a, v, letter: letters.get(a) })) },
    why: ["למה העודפים אחרונים?", `מאזן בוחן תמיד מאוזן. רק אחרי שכל שאר היתרות ידועות, העודפים (${letters.get("עודפים")}) הם מה שחסר כדי שהטבלה תיסגר.`],
  });

  const credit = q.entries.filter(touchesCredit);
  const topUp = credit.find(isTopUp);
  let creditDone = false;
  for (const e of q.entries) {
    if (!touchesCredit(e)) {
      steps.push({ h: e.text, entries: [asEntry(e)] });
      continue;
    }
    if (creditDone) continue;
    creditDone = true;
    steps.push({
      h: "לקוחות והפרשה להפסדי אשראי",
      credit: {
        cards: [creditCard(AR, q.preliminary[AR] ?? 0, credit, final[AR] ?? 0), creditCard(ALLOW, q.preliminary[ALLOW] ?? 0, credit, final[ALLOW] ?? 0, topUp)],
        formula: topUp && q.allowance ? q.allowance : undefined,
      },
      entries: credit.map((x) => ({ cap: x.text, ...asEntry(x) })),
      why: topUp ? ["איך קוראים את זה?", "קודם התיקונים והמחיקה, כי הם משנים את הלקוחות. ההפרשה הנדרשת מחושבת על מה שנשאר, והחץ מראה לאן היא נכנסת. ההוצאה (א) היא מה שחסר כדי לסגור את כרטיס ההפרשה."] : undefined,
    });
  }

  steps.push({
    h: "הגיליון הרב־טורי",
    worksheet: { before: q.preliminary, entries: q.entries.map((e) => ({ lines: toLines(e) })), pl: [...s.income, ...s.expenses].map(([a]) => a), retained: retainedClosing },
    why: ["איך קוראים?", "לכל חשבון שורה. היתרה לפני ההתאמות, ועוד ההתאמות בצד שלהן, נותנות את מאזן הבוחן הסופי. חשבון שפקודה פתחה מקבל שורה חדשה מתחת לקיימים. מהמאזן הסופי מפצלים: הכנסות והוצאות לתוצאתי, כל השאר למאזני. ההפרש בתוצאתי הוא הרווח, ובמאזני העודפים כבר כוללים אותו, ולכן הם מתאזנים."],
  });
  steps.push({
    h: "רווח השנה, ועודפי הסגירה",
    sheet: [
      ...s.income.map(([a, v]) => ({ l: a, a: v })),
      { l: "סך ההכנסות", a: s.totalIncome, k: "sub" as const },
      ...s.expenses.map(([a, v]) => ({ l: `פחות: ${a}`, a: -v, k: "op" as const })),
      { l: "רווח השנה", a: s.profit, k: "tot" as const },
    ],
  });
  steps.push({
    h: "כרטיס העודפים",
    tcard: retainedOpening >= 0 ? { name: "עודפים", dr: [], cr: [["י.פ.", retainedOpening], ["רווח השנה", s.profit]] } : { name: "עודפים", dr: [["י.פ.", -retainedOpening]], cr: [["רווח השנה", s.profit]] },
    why: ["למה?", `העודפים במאזן הבוחן הם עדיין של תחילת השנה. מוסיפים להם את הרווח, ומקבלים את עודפי הסגירה: \`${f(retainedClosing)}\`.`],
  });
  return { steps, trap: q.trap };
}

const fromExam = (x: WorksheetExam): WorksheetQuestion => ({
  preliminary: solveWorksheet(x).preliminary,
  computed: x.computed.map((c) => ({ account: c.account, why: c.why, sheet: x.sheets?.[c.account] })),
  entries: x.entries,
  trap: x.trap,
  allowance: x.allowance,
});

/** Almog's traps, as the exam screen lists them. */
const ALMOG_TRAP = "חמש בשאלה הזו: ההפרשה מחושבת אחרי התיקון והמחיקה; הריבית חצי שנתית; השכירות שנגמרה מתאפסת; במאזן הבוחן הפחת הוא עד סוף השנה הקודמת, ובמכירה נרשם גם הפחת של השנה; והעודפים רק אחרי שאר היתרות.";

export const W_EXAM5 = worksheetWorked(fromExam(EXAM5));
export const W_EXAM6 = worksheetWorked(fromExam(EXAM6));
export const W_EXAM7 = worksheetWorked(fromExam(EXAM7));
export const W_EXAM8 = worksheetWorked(fromExam(EXAM8));
export const W_GILAD = worksheetWorked({ preliminary: GILAD.preliminary, computed: GILAD.computed, entries: GILAD.entries, trap: GILAD.trap });
export const W_ALMOG = worksheetWorked({ preliminary: ALMOG.preliminary, computed: ALMOG.computed, entries: ALMOG.entries, trap: ALMOG_TRAP, allowance: ALMOG.allowance });

/** Every worksheet question, with what the exam itself says it ends on: for the tests. */
export const WORKSHEET_QUESTIONS = [
  { name: "exam5", w: W_EXAM5, profit: solveWorksheet(EXAM5).profit, retained: solveWorksheet(EXAM5).retainedClosing },
  { name: "exam6", w: W_EXAM6, profit: solveWorksheet(EXAM6).profit, retained: solveWorksheet(EXAM6).retainedClosing },
  { name: "exam7", w: W_EXAM7, profit: solveWorksheet(EXAM7).profit, retained: solveWorksheet(EXAM7).retainedClosing },
  { name: "exam8", w: W_EXAM8, profit: solveWorksheet(EXAM8).profit, retained: solveWorksheet(EXAM8).retainedClosing },
  { name: "gilad", w: W_GILAD, profit: GILAD.profit, retained: GILAD.closingRetained },
  { name: "almog", w: W_ALMOG, profit: statements(balancesOf(ledger(ALMOG.entries, ALMOG.preliminary))).profit, retained: undefined },
];

// ---------------------------------------------------------------------------
// Exams 1 to 4, and the booklet questions of lessons 5 and 7.

const tbOf = (b: Balances, cap?: string): WTB => ({ cap, rows: Object.entries(b).map(([a, v]) => ({ a, v })) });
const entryList = (entries: Entry[]): WEntry[] => entries.map((e) => ({ cap: `${e.id}. ${e.text}`, ...asEntry(e) }));
const profitSheet = (b: Balances, label: string): WLine[] => {
  const s = statements(b);
  return [
    ...s.income.map(([a, v]) => ({ l: a, a: v })),
    { l: "סך ההכנסות", a: s.totalIncome, k: "sub" as const },
    ...s.expenses.map(([a, v]) => ({ l: `פחות: ${a}`, a: -v, k: "op" as const })),
    { l: label, a: s.profit, k: "tot" as const },
  ];
};
/** One step per entry, in the order of the facts: the entry and what it fixes. */
const entrySteps = (entries: Entry[]): WStep[] => entries.map((e) => ({ h: e.text, entries: [asEntry(e)] }));

/** Exam 1: a first year, from the first entry to the trial balance. */
export const W_EXAM1: WorkedBody = {
  steps: [
    { h: "הפקודות", entries: entryList(EXAM1.entries) },
    {
      h: "כרטיסי T",
      tcards: ledger(EXAM1.entries).map((t) => ({ name: t.account, dr: t.dr.map((x): [string, number] => [`פקודה ${x.ref}`, x.amount]), cr: t.cr.map((x): [string, number] => [`פקודה ${x.ref}`, x.amount]) })),
      why: ["ומשם למאזן הבוחן", "יתרת הסגירה של כל כרטיס עוברת למאזן הבוחן, בצד שבו היא יושבת."],
    },
    { h: "מאזן הבוחן", tb: tbOf(EXAM1.final, `${EXAM1.name}, 31.12.2025`) },
  ],
  trap: EXAM1.trap,
};

/** Exam 2: a year that ended, and the year that starts from it. */
const e2Retained = statements(EXAM2.tb2024).profit;
export const W_EXAM2: WorkedBody = {
  steps: [
    { h: "מאזן הבוחן של 2024", tb: tbOf(EXAM2.tb2024, "31.12.2024") },
    { h: "רווח 2024", sheet: profitSheet(EXAM2.tb2024, "רווח 2024"), why: ["ולאן הוא הולך?", "בשנה הראשונה אין עודפי פתיחה, ולכן הרווח של 2024 הוא גם העודפים בסוף 2024. בפתיחת 2025 החשבונות התוצאתיים מתאפסים."] },
    { h: "הפקודות של 2025", entries: entryList(EXAM2.entries) },
    { h: "מאזן הבוחן של 2025", tb: tbOf(EXAM2.final2025, "31.12.2025") },
    { h: "רווח 2025", sheet: profitSheet(EXAM2.final2025, "רווח 2025") },
    { h: "כרטיס העודפים", tcard: { name: "עודפים", dr: [], cr: [["י.פ. 1.1.2025", e2Retained], ["רווח 2025", EXAM2.profit2025]] } },
  ],
  trap: EXAM2.trap,
};

/** Exam 3, and the lesson 5 booklet: entries only, one step per fact. */
export const W_EXAM3: WorkedBody = { steps: entrySteps(EXAM3.entries), trap: EXAM3.trap };
export const W_AGAM: WorkedBody = { steps: entrySteps(AGAM.entries), trap: AGAM.trap };

/** Exam 4: customers and the allowance, five unknowns, each leading to the next. */
const X4 = EXAM4.data;
export const W_EXAM4: WorkedBody = {
  steps: [
    {
      h: "א. הלקוחות וההפרשה ב־31.12.2024",
      sheet: [
        { l: "לקוחות ברוטו", how: `\`${f(X4.netOpening)} ÷ ${1 - X4.rate}\``, a: EXAM4.grossOpening },
        { l: "פחות: לקוחות נטו", a: -X4.netOpening, k: "op" },
        { l: "ההפרשה, 31.12.2024", a: EXAM4.allowOpening, k: "tot" },
      ],
      why: [`למה ${1 - X4.rate}?`, `ההפרשה היא ${X4.rate * 100}% מהברוטו, אז הנטו הוא ${100 - X4.rate * 100}% ממנו.`],
    },
    {
      h: "ב, ג. שני הכרטיסים של 2025",
      credit: {
        cards: [
          {
            name: AR,
            dr: [{ l: "י.פ.", a: EXAM4.grossOpening }, { l: "מכירות באשראי", a: X4.sales }, { l: "חידוש החוב שנמחק", a: X4.recovered }],
            cr: [{ l: "גבייה", a: EXAM4.collected, letter: "ב" }, { l: "מחיקה", a: X4.written }],
            close: { side: "dr", a: X4.closing },
          },
          {
            name: ALLOW,
            dr: [{ l: "מחיקה", a: X4.written }],
            cr: [{ l: "י.פ.", a: EXAM4.allowOpening }, { l: "חידוש החוב שנמחק", a: X4.recovered }, { l: EXPENSE, a: X4.expense, entry: true }],
            close: { side: "cr", a: EXAM4.allowClosing, letter: "ג", to: true },
          },
        ],
        formula: [`X × ${X4.specificRate * 100}% + (${f(X4.closing)} − X) × ${X4.general * 100}% = הפרשה בסוף השנה`, `X × ${X4.specificRate * 100}% + (${f(X4.closing)} − X) × ${X4.general * 100}% = ${f(EXAM4.allowClosing)}`],
        reverse: true,
      },
      why: ["הפעם החץ יורד", "ההוצאה נתונה, ולכן יתרת הסגירה של ההפרשה (ג) באה מהכרטיס. ממנה עוברים לנוסחה, ושם הנעלם הוא החוב של הלקוח בקשיים. הגבייה (ב) היא מה שסוגר את כרטיס הלקוחות."],
    },
    {
      h: "ד. החוב של הלקוח בקשיים",
      sheet: [
        { l: "הפרשה בסוף השנה", a: EXAM4.allowClosing },
        { l: `פחות: \`${f(X4.closing)} × ${X4.general * 100}%\``, a: -round2(X4.closing * X4.general), k: "op" },
        { l: "מה שנשאר ל־X", a: round2(EXAM4.allowClosing - X4.closing * X4.general), k: "sub" },
        { l: `÷ \`${round2(X4.specificRate - X4.general)}\``, a: "", k: "op" },
        { l: "החוב בקשיים", a: EXAM4.specificDebt, k: "tot" },
      ],
      why: [`למה ${round2(X4.specificRate - X4.general)}?`, `על החוב הזה ההפרשה ${X4.specificRate * 100}% במקום ${X4.general * 100}%. כל שקל בו מוסיף ${round2((X4.specificRate - X4.general) * 100)} אגורות להפרשה.`],
    },
    {
      h: "ה. הלקוחות נטו",
      sheet: [
        { l: "לקוחות ברוטו", a: X4.closing },
        { l: "פחות: ההפרשה", a: -EXAM4.allowClosing, k: "op" },
        { l: "לקוחות נטו, 31.12.2025", a: EXAM4.netClosing, k: "tot" },
      ],
    },
  ],
  trap: EXAM4.trap,
};

/** The lesson 7 booklet: three years of customers and the allowance, each year's cards rebuilt. */
export const W_NEVEH: WorkedBody = {
  steps: NEVEH.years.flatMap((y, i): WStep[] => {
    const d = NEVEH.data[i];
    const opening = round2(y.allowanceBefore + d.written);
    const spec = "specific" in d ? d.specific : undefined;
    const allowDr: WLRow[] = d.written ? [{ l: "מחיקה", a: d.written }] : [];
    const allowCr: WLRow[] = opening ? [{ l: "י.פ.", a: opening }] : [];
    (y.expense >= 0 ? allowCr : allowDr).push({ l: EXPENSE, a: Math.abs(y.expense), letter: "א", entry: true });
    return [
      {
        h: `${y.year}: שני הכרטיסים, וההפרשה הנדרשת`,
        credit: {
          cards: [
            { name: AR, dr: [...(y.opening ? [{ l: "י.פ.", a: y.opening }] : []), { l: "מכירות באשראי", a: d.sales }], cr: [{ l: "גבייה", a: d.collected }, ...(d.written ? [{ l: "מחיקה", a: d.written }] : [])], close: { side: "dr", a: y.customers } },
            { name: ALLOW, dr: allowDr, cr: allowCr, close: { side: "cr", a: y.required, to: true } },
          ],
          formula: spec
            ? [`חוב בקשיים × ${spec.rate * 100}% + שאר הלקוחות × ${d.rate * 100}% = הפרשה נדרשת`, `${f(spec.debt)} × ${spec.rate * 100}% + ${f(y.customers - spec.debt)} × ${d.rate * 100}% = ${f(y.required)}`]
            : [`לקוחות × ${d.rate * 100}% = הפרשה נדרשת`, `${f(y.customers)} × ${d.rate * 100}% = ${f(y.required)}`],
        },
        why: y.allowanceBefore < 0 ? ["למה ההוצאה גדולה מההפרשה?", "המחיקה גדולה מההפרשה שהייתה, ולכן לפני ההתאמה ההפרשה בחובה. ההוצאה (א) צריכה גם לכסות את החוסר וגם להגיע להפרשה הנדרשת."] : undefined,
      },
      {
        h: `${y.year}: הפקודה, והלקוחות נטו`,
        entries: [{ lines: y.expense >= 0 ? [{ a: EXPENSE, dr: y.expense }, { a: ALLOW, cr: y.expense }] : [{ a: ALLOW, dr: -y.expense }, { a: EXPENSE, cr: -y.expense }] }],
        sheet: [
          { l: "לקוחות ברוטו", a: y.customers },
          { l: "פחות: ההפרשה", a: -y.required, k: "op" },
          { l: "לקוחות נטו", a: y.net, k: "tot" },
        ],
      },
    ];
  }),
  trap: NEVEH.trap,
};
