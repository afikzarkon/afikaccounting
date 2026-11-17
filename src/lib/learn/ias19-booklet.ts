/**
 * The employee-benefits course's question bank at the level of the owner's
 * exercise booklet: one solver per kind of booklet question, each the same
 * calculation the booklet's solution makes, and a builder that turns a set of
 * inputs into a question (story, data tables, what is required) and its worked
 * solution (the movement tables, then one note per line: what is computed,
 * the formula with the numbers, the result). The course's own figures are
 * original; the solvers are checked against the booklet's in a private test.
 *
 * Signs in the movement tables: a line that increases the balance is
 * positive, a payment negative; the balancing line (P.N.) is what is left.
 */

// ---------------------------------------------------------------------------
// The shape a question is handed to the screens in: plain data.

/** One computed line of a note: what it is, the rule in words, the numbers, the result. */
export type BkLine = { label: string; how?: string; calc?: string; value?: number; text?: string; unit?: "₪" | "%" | "ימים" | "שנים" | "" };
/** A note (ביאור) under a movement table. */
export type BkNote = { title: string; text?: string; lines: BkLine[] };
export type BkRow = { label: string; value: number; note?: string; kind?: "balance" | "pn" };
/** A movement table: the obligation is a credit (`side="credit"`), plan assets a debit. */
export type BkRoll = { title: string; rows: BkRow[]; side?: "credit" | "debit"; pnTo?: string; unit?: string };
export type BkTable = { title?: string; head: string[]; rows: (string | number)[][]; foot?: (string | number)[] };
/** One step of the solution, shown one at a time. */
export type BkStep = { title: string; text?: string[]; rolls?: BkRoll[]; notes?: BkNote[]; tables?: BkTable[] };
/** An amount the learner types before opening the solution. */
export type BkCheck = { label: string; value: number };

export type BkQuestion = {
  id: string;
  title: string;
  /** The story, one fact per line. */
  facts: string[];
  tables: BkTable[];
  required: string[];
  checks: BkCheck[];
  steps: BkStep[];
  /** The one thing this question tests. */
  point: string;
};

// ---------------------------------------------------------------------------
// Number formatting for the worked lines.

export const nf = (x: number, d = 0) => x.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
/** An amount, rounded to the shekel. */
export const money = (x: number) => nf(Math.round(x));
/** A number with up to two decimals. */
export const d2 = (x: number) => nf(Math.round(x * 100) / 100, 2);
/** A rate as a percentage. */
export const pc = (r: number) => `${nf(r * 100, 3)}%`;
/** 1 + i, as written in a discount factor. */
export const b = (i: number) => nf(1 + i, 5);
/** Years, as written in an exponent. */
export const yrs = (n: number) => nf(n, 4);
export const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

// ===========================================================================
// 0. Defined contribution: the expense is the contribution, whoever invests it.

export type DcInput = {
  company: string;
  years: [number, number];
  production: { staff: number; hired: number; salary: number; raise: number };
  insurer: { share: number; payroll: [number, number] };
  guaranteed: { rate: number };
};

export function solveDc(q: DcInput) {
  const P = q.production;
  const prod = q.years.map((y) => P.staff * P.salary * (1 + P.raise) ** (y - P.hired));
  const insurer = q.insurer.payroll.map((x) => x * q.insurer.share);
  return { prod, insurer, total: prod.map((x, i) => x + insurer[i]) };
}

export function dcQuestion(id: string, title: string, q: DcInput): BkQuestion {
  const s = solveDc(q);
  const P = q.production;
  const [y1, y2] = q.years;
  return {
    id,
    title,
    point: "בהפקדה מוגדרת ההוצאה היא ההפקדה של השנה, ואין חישוב אקטוארי. השאלה היחידה: מי נושא בסיכון אם הכסף לא יספיק.",
    facts: [
      `חברת ״${q.company}״ מעסיקה שלוש קבוצות עובדים עם הסדרי פרישה שונים.`,
      `עובדי ייצור (${P.staff}, מ-1.1.${P.hired}): פיצויים בגובה השכר האחרון × שנות העבודה. חל עליהם סעיף 14: החברה לא חייבת דבר מעבר להפקדות, גם אם חברת הביטוח לא תשלם הכול. ההפקדה בסוף כל שנה, בגובה השכר החודשי של אותה שנה. שכר התחלתי ${money(P.salary)} ₪, ועולה ב-${pc(P.raise)} בכל ינואר מ-${P.hired + 1}.`,
      `עובדי משרד: חברת ביטוח קיבלה על עצמה באופן בלתי חוזר את מתנות הפרישה שלהם, תמורת ${pc(q.insurer.share)} מעלות השכר בכל סוף שנה. החברה לא תשלם יותר בשום מקרה. עלות השכר: ${money(q.insurer.payroll[0])} ₪ ב-${y1} ו-${money(q.insurer.payroll[1])} ₪ ב-${y2}. שווי המתנות ומספר הזכאים לא ידועים לחברה.`,
      `מנהלים: החברה מפקידה לקופה, ומתחייבת שהעובד יקבל לפחות תשואה של ${pc(q.guaranteed.rate)} בשנה. אם הקופה תניב פחות, החברה תשלים.`,
      "כל ההפקדות משולמות במזומן ביום האחרון של השנה.",
    ],
    tables: [],
    required: ["לסווג כל הסדר.", `ההוצאה וההתחייבות במאזן בגין שני ההסדרים הראשונים, ב-${y1} וב-${y2}.`],
    checks: [
      { label: `הוצאה, עובדי ייצור ${y1}`, value: s.prod[0] },
      { label: `הוצאה, עובדי ייצור ${y2}`, value: s.prod[1] },
      { label: `הוצאה, עובדי משרד ${y2}`, value: s.insurer[1] },
    ],
    steps: [
      {
        title: "סיווג: מי נושא בסיכון",
        tables: [
          {
            head: ["הסדר", "סיווג", "למה"],
            rows: [
              ["עובדי ייצור", "הפקדה מוגדרת", "סעיף 14: אין מחויבות מעבר להפקדה"],
              ["עובדי משרד", "הפקדה מוגדרת", "חברת הביטוח לקחה את הסיכון באופן בלתי חוזר"],
              ["מנהלים", "הטבה מוגדרת", "החברה מבטיחה תשואה: הסיכון שהקופה לא תספיק אצלה"],
            ],
          },
        ],
        text: ["שווי המתנות ומספר הזכאים לא משנים דבר בהפקדה מוגדרת: נתוני סרק."],
      },
      {
        title: "ההוצאה: ההפקדה של השנה",
        notes: [
          {
            title: "עובדי ייצור: עובדים × השכר החודשי של השנה",
            lines: q.years.map((y, k) => ({ label: `${y}`, calc: `${P.staff} × ${money(P.salary)} × ${b(P.raise)}^${y - P.hired}`, value: s.prod[k], unit: "₪" as const })),
          },
          {
            title: `עובדי משרד: ${pc(q.insurer.share)} מעלות השכר`,
            lines: q.years.map((y, k) => ({ label: `${y}`, calc: `${money(q.insurer.payroll[k])} × ${pc(q.insurer.share)}`, value: s.insurer[k], unit: "₪" as const })),
          },
          {
            title: "הרישום, והמאזן",
            text: "חובה הוצאות שכר, זכות מזומן. הכול שולם בסוף השנה, ולכן אין יתרה במאזן. אילו חלק מההפקדה היה מועבר רק בינואר, הוא היה התחייבות שוטפת.",
            lines: q.years.map((y, k) => ({ label: `סה״כ הוצאה ${y}`, value: s.total[k], unit: "₪" as const })),
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// 1. Short-term benefits: vacation (LIFO, vesting), a retreat that carries for one year, a bonus, and maternity leave.

export type ShortGrade = { name: string; /** One of the grade, for "מנהל אחד". */ one: string; staff: number; salary: number; workDays: number; retreat: number; vacation: number };
export type ShortInput = {
  company: string;
  /** The year asked about; the opening is 31.12 of the year before. */
  year: number;
  grades: ShortGrade[];
  /** The on-costs every employee carries, on the gross salary. */
  onCosts: { label: string; rate: number }[];
  /** An on-cost only the first grade (managers) carries. */
  managerExtra: { label: string; rate: number };
  /** The managers' one-off bonus: a share of the monthly salary; of the on-costs only national insurance (the first) applies. */
  bonusRate: number;
  retreat: { notUsed: number[]; willUse: number[] };
  vacation: { carried: number[]; expectedNow: number[]; actual: number[]; expectedNext: (number | "max")[] };
  /** Managers expected, at year end, to leave at the end of next year. */
  leavers: number;
  maternity: { count: number; months: number };
};

export function solveShort(q: ShortInput) {
  const base = sum(q.onCosts.map((o) => o.rate));
  const rateOf = (g: number) => base + (g === 0 ? q.managerExtra.rate : 0);
  const dayCost = q.grades.map((g, i) => (g.salary / g.workDays) * (1 + rateOf(i)));
  // The retreat: new this year, so no opening.
  const retreatUsed = q.grades.map((g, i) => g.staff - q.retreat.notUsed[i]);
  const retreatPaid = sum(q.grades.map((g, i) => retreatUsed[i] * g.retreat * dayCost[i]));
  const retreatClosing = sum(q.grades.map((g, i) => q.retreat.willUse[i] * g.retreat * dayCost[i]));
  const retreat = { opening: 0, paid: retreatPaid, closing: retreatClosing, expense: retreatClosing + retreatPaid };
  // Vacation, LIFO: next year a carried day is used only past next year's own days.
  const v = q.vacation;
  const openDays = q.grades.map((g, i) => Math.min(v.carried[i], Math.max(0, v.expectedNow[i] - g.vacation)));
  const vOpening = sum(q.grades.map((g, i) => g.staff * openDays[i] * dayCost[i]));
  const vPaid = sum(q.grades.map((g, i) => g.staff * v.actual[i] * dayCost[i]));
  const newBalance = q.grades.map((g, i) => Math.max(0, g.vacation - v.actual[i]));
  const closeDays = q.grades.map((g, i) => {
    const e = v.expectedNext[i];
    return e === "max" ? newBalance[i] : Math.min(newBalance[i], Math.max(0, e - g.vacation));
  });
  const stayers = q.grades.map((g, i) => g.staff - (i === 0 ? q.leavers : 0));
  const leaverPay = q.leavers * newBalance[0] * dayCost[0];
  const vClosing = sum(q.grades.map((_, i) => stayers[i] * closeDays[i] * dayCost[i])) + leaverPay;
  const vacation = { opening: vOpening, paid: vPaid, closing: vClosing, expense: vClosing - vOpening + vPaid };
  // The bonus: national insurance only.
  const bonusBase = q.grades[0].salary * (1 + q.onCosts[0].rate);
  const bonusTotal = bonusBase * q.bonusRate * q.grades[0].staff;
  const bonus = { opening: 0, paid: 0, closing: bonusTotal, expense: bonusTotal };
  const total = {
    opening: retreat.opening + vacation.opening + bonus.opening,
    paid: retreat.paid + vacation.paid + bonus.paid,
    closing: retreat.closing + vacation.closing + bonus.closing,
    expense: retreat.expense + vacation.expense + bonus.expense,
  };
  return { rateOf, dayCost, retreatUsed, retreat, openDays, newBalance, closeDays, stayers, leaverPay, vacation, bonusBase, bonus, total };
}

const shortRoll = (title: string, l: { opening: number; paid: number; closing: number; expense: number }, y: number): BkRoll => ({
  title,
  rows: [
    { label: `יתרת פתיחה 31.12.${y - 1}`, value: l.opening, kind: "balance" },
    { label: `הוצאות שכר ${y}`, value: l.expense, note: "השורה החסרה" },
    { label: `תשלומים ${y}`, value: -l.paid },
    { label: `יתרת סגירה 31.12.${y}`, value: l.closing, kind: "balance" },
  ],
  pnTo: "",
});

export function shortQuestion(id: string, title: string, q: ShortInput): BkQuestion {
  const r = solveShort(q);
  const y = q.year;
  const G = q.grades;
  const m = G[0].name;
  /** "מנהל אחד", "3 טכנאים". */
  const count = (n: number, g: ShortGrade) => (n === 1 ? `${g.one} אחד` : `${n} ${g.name}`);
  return {
    id,
    title,
    point: "כל הטבה מסווגים לבד, ומודדים לפי מה שהחברה צופה לשלם. את ההוצאה לא מחשבים: היא השורה שמשלימה את טבלת התנועה.",
    facts: [
      `חברת ״${q.company}״ מעסיקה ${sum(G.map((g) => g.staff))} עובדים בשלושה דרגים (טבלה 1).`,
      `על כל העובדים החברה משלמת ${q.onCosts.map((o) => `${o.label} ${pc(o.rate)}`).join(", ")} מהשכר ברוטו. על ה${m} בלבד גם ${q.managerExtra.label} ${pc(q.managerExtra.rate)}.`,
      `נופש מפעלי: הוחל לראשונה בשנת ${y}. ימי נופש שלא נוצלו אפשר לנצל עד תום השנה העוקבת.`,
      "דמי חופשה: אפשר לצבור עד תום השנה העוקבת, ולא מעבר לכך.",
      "מדיניות החברה: LIFO (קודם מנצלים את ימי השנה השוטפת).",
      "היעדרויות נצברות הן מבשילות: עובד שעוזב מקבל תשלום על הימים שצבר.",
      `ב-31.12.${y - 1} לא צפויות עזיבות. ב-31.12.${y} החברה צופה ש${q.leavers === 1 ? "מנהל אחד יעזוב" : `-${q.leavers} מנהלים יעזבו`} ב-31.12.${y + 1}.`,
      `נופש: ${G.map((g, i) => count(q.retreat.notUsed[i], g)).join(", ")} לא ניצלו את הנופש בשנת ${y}. מתוכם החברה מעריכה ש${G.map((g, i) => count(q.retreat.willUse[i], g)).join(", ")} ינצלו אותו בשנת ${y + 1}, נוסף על נופש ${y + 1}.`,
      `בונוס: בשנת ${y} הוחלט לשלם ל${m} בונוס חד פעמי של ${pc(q.bonusRate)} מהשכר החודשי ברוטו. מההטבות הסוציאליות חל עליו רק ${q.onCosts[0].label}. הוא ישולם במרץ ${y + 1}.`,
      `${q.maternity.count === 1 ? "מנהלת אחת בהיריון" : `${q.maternity.count} מנהלות בהיריון`}, ${q.maternity.count === 1 ? "צפויה" : "צפויות"} ללדת בתחילת ${y + 1}. ${q.maternity.count === 1 ? "היא זכאית" : "כל אחת זכאית"} ל-${nf(q.maternity.months, 1)} חודשי חופשת לידה בתשלום.`,
      `לא היו שינויים במצבת העובדים, בשכר ובהטבות ב-${y - 1} וב-${y}, מלבד האמור.`,
    ],
    tables: [
      { title: "טבלה 1: העובדים", head: ["דרג", "עובדים", "שכר חודשי ברוטו", "ימי עבודה בחודש", "ימי נופש בשנה", "ימי חופשה בשנה"], rows: G.map((g) => [g.name, g.staff, money(g.salary), g.workDays, g.retreat, g.vacation]) },
      {
        title: "טבלה 2: ימי חופשה לעובד",
        head: ["דרג", `יתרה ב-31.12.${y - 1}`, `צפי ניצול ${y}`, `ניצול בפועל ${y}`, `צפי ניצול ${y + 1}`],
        rows: G.map((g, i) => [g.name, q.vacation.carried[i], q.vacation.expectedNow[i], q.vacation.actual[i], q.vacation.expectedNext[i] === "max" ? "מקסימום אפשרי" : q.vacation.expectedNext[i]]),
      },
    ],
    required: [`התנועה בהפרשות בגין הטבות לזמן קצר בשנת ${y}, וההוצאה שהוכרה בגינן (בלי השכר השוטף).`],
    checks: [
      { label: `יתרת פתיחה 31.12.${y - 1}`, value: r.total.opening },
      { label: `הוצאות שכר ${y}`, value: r.total.expense },
      { label: `תשלומים ${y}`, value: r.total.paid },
      { label: `יתרת סגירה 31.12.${y}`, value: r.total.closing },
    ],
    steps: [
      {
        title: "סיווג: כל הטבה לבד",
        tables: [
          {
            head: ["הטבה", "סיווג", "מה רושמים"],
            rows: [
              [`${q.onCosts.map((o) => o.label).join(", ")}, ${q.managerExtra.label}`, "משולמים בסוף כל חודש", "אין יתרה. הם רק נכנסים לעלות היום"],
              ["נופש מפעלי", "היעדרות נצברת ומבשילה", "הפרשה לפי הצפי"],
              ["דמי חופשה", "היעדרות נצברת ומבשילה (LIFO)", "הפרשה לפי הצפי"],
              [`בונוס ל${m}`, "זמן קצר: ישולם בתוך שנה, והזכאות התמלאה", "הפרשה על כל הסכום"],
              ["חופשת לידה", "היעדרות לא נצברת", "כלום. נרשמת כשהיא קורית"],
            ],
          },
        ],
      },
      {
        title: "עלות יום לכל דרג",
        text: [`עלות יום = שכר חודשי ÷ ימי עבודה × (1 + התוספות). התוספות לכל העובדים: ${pc(sum(q.onCosts.map((o) => o.rate)))}. ל${m} מוסיפים ${q.managerExtra.label}, ${pc(q.managerExtra.rate)}.`],
        tables: [
          {
            head: ["דרג", "שכר חודשי", "ימי עבודה", "תוספות", "חישוב", "עלות יום"],
            rows: G.map((g, i) => [g.name, money(g.salary), g.workDays, pc(r.rateOf(i)), `${money(g.salary)} ÷ ${g.workDays} × ${nf(1 + r.rateOf(i), 5)}`, d2(r.dayCost[i])]),
          },
        ],
      },
      {
        title: "נופש מפעלי",
        text: ["הנופש התחיל השנה, ולכן הפתיחה 0. התשלומים: מי שניצל השנה. הסגירה: מי שצפוי לנצל בשנה הבאה."],
        tables: [
          {
            title: `תשלומים ${y}: מי שניצל`,
            head: ["דרג", "עובדים", "לא ניצלו", "ניצלו", "ימי נופש", "עלות יום", "סה״כ"],
            rows: G.map((g, i) => [g.name, g.staff, q.retreat.notUsed[i], r.retreatUsed[i], g.retreat, d2(r.dayCost[i]), money(r.retreatUsed[i] * g.retreat * r.dayCost[i])]),
            foot: ["סה״כ", "", "", "", "", "", money(r.retreat.paid)],
          },
          {
            title: `סגירה 31.12.${y}: מי שצפוי לנצל ב-${y + 1}`,
            head: ["דרג", "צפויים לנצל", "ימי נופש", "עלות יום", "סה״כ"],
            rows: G.map((g, i) => [g.name, q.retreat.willUse[i], g.retreat, d2(r.dayCost[i]), money(q.retreat.willUse[i] * g.retreat * r.dayCost[i])]),
            foot: ["סה״כ", "", "", "", money(r.retreat.closing)],
          },
        ],
        rolls: [shortRoll("הפרשה לנופש מפעלי", r.retreat, y)],
      },
      {
        title: `דמי חופשה: יתרת פתיחה 31.12.${y - 1}, לפי הצפי`,
        text: ["ב-LIFO מנצלים קודם את ימי השנה. מהיתרה נלקח רק מה שמעבר לזכאות השנתית, ולא יותר מהיתרה. לא צפויות עזיבות, ולכן כולם לפי הניצול הצפוי."],
        tables: [
          {
            head: ["דרג", "עובדים", "יתרה משנה שעברה", "צפי כללי", "ימי חופש בשנה", "צפי לניצול מיתרה קודמת", "סה״כ ימים", "עלות יום", "הפרשה"],
            rows: G.map((g, i) => [
              g.name,
              g.staff,
              q.vacation.carried[i],
              q.vacation.expectedNow[i],
              g.vacation,
              `MIN(${q.vacation.carried[i]}, MAX(0, ${q.vacation.expectedNow[i]} − ${g.vacation})) = ${r.openDays[i]}`,
              `${g.staff} × ${r.openDays[i]} = ${nf(g.staff * r.openDays[i], 2)}`,
              d2(r.dayCost[i]),
              money(g.staff * r.openDays[i] * r.dayCost[i]),
            ]),
            foot: ["סה״כ", "", "", "", "", "", "", "", money(r.vacation.opening)],
          },
        ],
      },
      {
        title: `דמי חופשה: תשלומים ${y}, לפי מה שקרה`,
        tables: [
          {
            head: ["דרג", "עובדים", "יתרה שנה קודמת", "ימי חופש בשנה", "ניצול בפועל", "יתרה לשנה הבאה", "סה״כ ימים", "עלות יום", "סה״כ"],
            rows: G.map((g, i) => [
              g.name,
              g.staff,
              q.vacation.carried[i],
              g.vacation,
              q.vacation.actual[i],
              `MAX(0, ${g.vacation} − ${q.vacation.actual[i]}) = ${r.newBalance[i]}`,
              `${g.staff} × ${q.vacation.actual[i]} = ${nf(g.staff * q.vacation.actual[i], 2)}`,
              d2(r.dayCost[i]),
              money(g.staff * q.vacation.actual[i] * r.dayCost[i]),
            ]),
            foot: ["סה״כ", "", "", "", "", "", "", "", money(r.vacation.paid)],
          },
        ],
      },
      {
        title: `דמי חופשה: יתרת סגירה 31.12.${y}`,
        text: [
          "היתרה משנה שעברה היא העמודה ״יתרה לשנה הבאה״ מטבלת התשלומים: זכאות − ניצול (לא פחות מ-0). היתרה הישנה פוקעת.",
          `${q.leavers === 1 ? `ה${G[0].one} שצפוי לעזוב מקבל` : `ה${m} שצפויים לעזוב מקבלים`} את כל היתרה, כי ההיעדרות מבשילה. הנשארים נכנסים לפי מה שינצלו מהיתרה ב-${y + 1}.`,
        ],
        tables: [
          {
            head: ["דרג", "עובדים", "יתרה משנה שעברה", "צפי כללי", "ימי חופש בשנה", "צפי לניצול מיתרה קודמת", "סה״כ ימים", "עלות יום", "הפרשה"],
            rows: [
              ...G.map((g, i) => {
                const e = q.vacation.expectedNext[i];
                return [
                  i === 0 && q.leavers ? `${g.name} שנשארים` : g.name,
                  r.stayers[i],
                  r.newBalance[i],
                  e === "max" ? "מקסימום" : String(e),
                  g.vacation,
                  e === "max" ? `כל היתרה = ${r.closeDays[i]}` : `MIN(${r.newBalance[i]}, MAX(0, ${e} − ${g.vacation})) = ${r.closeDays[i]}`,
                  `${r.stayers[i]} × ${r.closeDays[i]} = ${nf(r.stayers[i] * r.closeDays[i], 2)}`,
                  d2(r.dayCost[i]),
                  money(r.stayers[i] * r.closeDays[i] * r.dayCost[i]),
                ];
              }),
              ...(q.leavers
                ? [[`${m} שעוזבים`, q.leavers, r.newBalance[0], "עוזב", G[0].vacation, `פדיון: כל היתרה = ${r.newBalance[0]}`, `${q.leavers} × ${r.newBalance[0]} = ${nf(q.leavers * r.newBalance[0], 2)}`, d2(r.dayCost[0]), money(r.leaverPay)]]
                : []),
            ],
            foot: ["סה״כ", "", "", "", "", "", "", "", money(r.vacation.closing)],
          },
        ],
        rolls: [shortRoll("הפרשה לדמי חופשה", r.vacation, y)],
      },
      {
        title: "בונוס, וחופשת לידה",
        tables: [
          {
            head: ["", "חישוב", "סכום"],
            rows: [
              [`שכר לבונוס (רק ${q.onCosts[0].label})`, `${money(G[0].salary)} × ${nf(1 + q.onCosts[0].rate, 4)}`, d2(r.bonusBase)],
              [`הפרשה לבונוס, ${G[0].staff} ${m}`, `${d2(r.bonusBase)} × ${pc(q.bonusRate)} × ${G[0].staff}`, money(r.bonus.closing)],
              ["חופשת לידה", "היעדרות לא נצברת: נרשמת בשנה הבאה, כשהיא קורית", "0"],
            ],
          },
        ],
        rolls: [shortRoll(`הפרשה לבונוס ל${m}`, r.bonus, y)],
      },
      {
        title: "התשובה: טבלת התנועה בכל ההפרשות",
        text: [`ההוצאה היא השורה החסרה: סגירה − פתיחה + תשלומים = ${money(r.total.closing)} − ${money(r.total.opening)} + ${money(r.total.paid)} = ${money(r.total.expense)} ₪.`],
        tables: [
          {
            head: ["שורה", "נופש מפעלי", "דמי חופשה", "בונוס", "סה״כ"],
            rows: [
              [`יתרת פתיחה 31.12.${y - 1}`, money(r.retreat.opening), money(r.vacation.opening), money(r.bonus.opening), money(r.total.opening)],
              [`הוצאות שכר ${y} (השורה החסרה)`, money(r.retreat.expense), money(r.vacation.expense), money(r.bonus.expense), money(r.total.expense)],
              [`תשלומים ${y}`, `(${money(r.retreat.paid)})`, `(${money(r.vacation.paid)})`, money(r.bonus.paid), `(${money(r.total.paid)})`],
            ],
            foot: [`יתרת סגירה 31.12.${y}`, money(r.retreat.closing), money(r.vacation.closing), money(r.bonus.closing), money(r.total.closing)],
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// 2. Other long-term benefits: a sabbatical, an extra month after five years, and a bonus on profit over three years.

export type OltInput = {
  company: string;
  /** The year asked about; the plans start on 1.1 of the year before. */
  year: number;
  rate: number;
  dev: { staff: number; salary: number; growth: number; serviceYears: number; p: number };
  buy: { staff: number; salary: number; growth: number; serviceYears: number; p0: number; p1: number };
  mgmt: { heads: number; share: number; threshold: number; profits: [number, number] };
};

export function solveOlt(q: OltInput) {
  const r = q.rate;
  const D = q.dev;
  const devPay = D.salary * (1 + D.growth) ** (D.serviceYears - 1);
  const devUnit = devPay / D.serviceYears;
  const dev = {
    pay: devPay,
    opening: (D.staff * D.p * devUnit) / (1 + r) ** (D.serviceYears - 1),
    service: (D.staff * D.p * devUnit) / (1 + r) ** (D.serviceYears - 2),
    closing: (D.staff * D.p * 2 * devUnit) / (1 + r) ** (D.serviceYears - 2),
    interest: 0,
    pn: 0,
  };
  dev.interest = dev.opening * r;
  dev.pn = dev.closing - dev.opening - dev.interest - dev.service;
  const B = q.buy;
  const buyPay = (B.salary / 12) * (1 + B.growth) ** (B.serviceYears - 1);
  const buyUnit = buyPay / B.serviceYears;
  const buy = {
    pay: buyPay,
    opening: (B.staff * B.p0 * buyUnit) / (1 + r) ** (B.serviceYears - 1),
    service: (B.staff * B.p0 * buyUnit) / (1 + r) ** (B.serviceYears - 2),
    closing: (B.staff * B.p1 * 2 * buyUnit) / (1 + r) ** (B.serviceYears - 2),
    interest: 0,
    pn: 0,
  };
  buy.interest = buy.opening * r;
  buy.pn = buy.closing - buy.opening - buy.interest - buy.service;
  const M = q.mgmt;
  const mgmt = {
    opening: (M.heads * M.share * M.profits[0]) / (1 + r) ** 2,
    service: (M.heads * M.share * M.profits[1]) / (1 + r),
    closing: (M.heads * M.share * (M.profits[0] + M.profits[1])) / (1 + r),
    interest: 0,
    pn: 0,
  };
  mgmt.interest = mgmt.opening * r;
  mgmt.pn = mgmt.closing - mgmt.opening - mgmt.interest - mgmt.service;
  return { dev, buy, mgmt };
}

const oltRoll = (title: string, l: { opening: number; service: number; interest: number; pn: number; closing: number }, y: number): BkRoll => ({
  title,
  pnTo: "רווח והפסד",
  rows: [
    { label: `יתרת פתיחה 31.12.${y - 1}`, value: l.opening, kind: "balance" },
    { label: "עלות שירות שוטף", value: l.service },
    { label: "עלות ריבית", value: l.interest },
    { label: "מדידה מחדש", value: l.pn, kind: "pn" },
    { label: `יתרת סגירה 31.12.${y}`, value: l.closing, kind: "balance" },
  ],
});

/** A row of a present-value table: a group, a plan or a measurement, and the figures its present value is built from. */
export type PvRow = {
  label: string;
  heads?: number;
  /** Probability of staying and receiving. */
  p?: number;
  /** The benefit per employee (or in total, with `amount` in the options). */
  amount: number;
  /** A further multiplier, such as an added share after an amendment (× 1.12); its column is named in the options. */
  x?: number;
  /** The share accrued, as written: "2/6", "1", or years: "3", "2.25", "28/12". */
  part?: string;
  n: number;
  /** When the rows are discounted at different rates. */
  rate?: number;
  value: number;
};

export type PvOpts = {
  rate: number;
  /** The first column's header. */
  label?: string;
  /** The amount column's header. */
  amount?: string;
  /** Sentences above the table, before the formula. */
  why?: string | string[];
  /** A total in the foot (default: when there is more than one row). */
  total?: boolean;
  /** The accrued column's header, when it holds years rather than a share. */
  part?: string;
  /** The multiplier column's header. */
  x?: string;
  /** Show the rate column even when every row has the same rate. */
  rateCol?: boolean;
  /** Decimals for the benefit and for the present value (default: whole shekels). */
  amountDec?: number;
  valueDec?: number;
};

const partOf = (s: string) => s.split("/").map(Number).reduce((a, x) => a / x);
/** A narrow no-break space: the calculation stays on one line and in its column. */
const NBSP = String.fromCharCode(0x202f);
/** n to two decimals in a table (15.33): enough to read, and the table stays in its column. The check uses the exact n. */
const nShow = (n: number) => nf(n, 2);

/**
 * One balance as a table, by the owner's choice of 2026-11-17: a row for each
 * group, a column for each figure the present value is built from, a column
 * with the calculation, and the present value last. A row whose figures do
 * not give its value throws, so a table can never disagree with the solution.
 */
export function pvTable(title: string, rows: PvRow[], o: PvOpts): BkStep {
  const has = { heads: rows.some((x) => x.heads !== undefined), p: rows.some((x) => x.p !== undefined), x: rows.some((x) => x.x !== undefined), part: rows.some((x) => x.part !== undefined) };
  const rateOf = (x: PvRow) => x.rate ?? o.rate;
  const oneRate = !o.rateCol && rows.every((x) => rateOf(x) === o.rate);
  const amt = (v: number) => (o.amountDec ? nf(v, o.amountDec) : money(v));
  const val = (v: number) => (o.valueDec ? nf(v, o.valueDec) : money(v));
  for (const x of rows) {
    const v = ((x.heads ?? 1) * (x.p ?? 1) * x.amount * (x.x ?? 1) * (x.part ? partOf(x.part) : 1)) / (1 + rateOf(x)) ** x.n;
    if (Math.abs(v - x.value) > Math.max(1, Math.abs(x.value) * 1e-6)) throw new Error(`pvTable "${title}", ${x.label}: the figures give ${v}, not ${x.value}`);
  }
  const cols: { head: string; cell: (x: PvRow) => string | number }[] = [
    { head: o.label ?? "קבוצה", cell: (x) => x.label },
    ...(has.heads ? [{ head: "עובדים", cell: (x: PvRow) => x.heads ?? 1 }] : []),
    ...(has.p ? [{ head: "הסתברות", cell: (x: PvRow) => pc(x.p ?? 1) }] : []),
    { head: o.amount ?? "הטבה", cell: (x) => amt(x.amount) },
    ...(has.x ? [{ head: o.x ?? "מקדם", cell: (x: PvRow) => nf(x.x ?? 1, 3) }] : []),
    ...(has.part ? [{ head: o.part ?? "נצבר", cell: (x: PvRow) => x.part ?? "1" }] : []),
    ...(oneRate ? [] : [{ head: "i", cell: (x: PvRow) => pc(rateOf(x)) }]),
    { head: "n", cell: (x) => nShow(x.n) },
    {
      head: "חישוב",
      cell: (x) =>
        [x.heads !== undefined && nf(x.heads, 2), x.p !== undefined && pc(x.p), amt(x.amount), x.x !== undefined && nf(x.x, 3), x.part && x.part !== "1" && x.part]
          .filter(Boolean)
          .join(" × ")
          // The product holds together, and so does the discount: a narrow column breaks only before "÷", so each line still reads left to right.
          .replace(/ /g, NBSP)
          .concat(x.n ? ` ÷${NBSP}${b(rateOf(x))}^${nShow(x.n)}` : ""),
    },
    { head: "ערך נוכחי", cell: (x) => val(x.value) },
  ];
  const total = o.total ?? rows.length > 1;
  const why = o.why === undefined ? [] : Array.isArray(o.why) ? o.why : [o.why];
  return {
    title,
    // By the owner's choice of 2026-11-17, the formulas are the table's own calculation column: no formula or Excel line above it.
    text: why,
    tables: [
      {
        head: cols.map((c) => c.head),
        rows: rows.map((x) => cols.map((c) => c.cell(x))),
        ...(total ? { foot: cols.map((_, i) => (i === 0 ? "סה״כ" : i === cols.length - 1 ? val(sum(rows.map((x) => x.value))) : "")) } : {}),
      },
    ],
  };
}

/** Years accrued, written so a table reproduces them exactly: "2.25", or in months, "31/12", when the decimals do not end. */
export const yearsAs = (x: number) => {
  const s = yrs(x);
  return Number(s.replace(/,/g, "")) === x ? s : `${Math.round(x * 12)}/12`;
};

/**
 * Several balances of one employee or one group in a single step: a table
 * each, under its own caption, the explanations once.
 * The tables should have the same columns (pass `rateCol` when the rate
 * changes between the dates), or the step repeats the lines that differ.
 */
export function pvGroup(title: string, parts: { title: string; rows: PvRow[]; o: PvOpts }[], why?: string | string[]): BkStep {
  const built = parts.map((p) => pvTable(p.title, p.rows, p.o));
  const text = why === undefined ? [] : Array.isArray(why) ? [...why] : [why];
  for (const s of built) for (const line of s.text ?? []) if (!text.includes(line)) text.push(line);
  return { title, text, tables: built.map((s, k) => ({ ...s.tables![0], title: parts[k].title })) };
}

export function oltQuestion(id: string, title: string, q: OltInput): BkQuestion {
  const s = solveOlt(q);
  const y = q.year;
  const y0 = y - 1;
  const D = q.dev;
  const B = q.buy;
  const M = q.mgmt;
  const r = q.rate;
  const devEnd = y0 + D.serviceYears - 1;
  const buyEnd = y0 + B.serviceYears - 1;
  return {
    id,
    title,
    point: "הטבה שמשולמת בזמן ההעסקה, אחרי יותר משנה, היא הטבה אחרת לזמן ארוך. מודדים אותה כמו הטבה מוגדרת, אבל המדידה מחדש **הולכת לרווח והפסד**.",
    facts: [
      `ב-1.1.${y0} החליטה חברת ״${q.company}״ על שלוש תוכניות תגמול.`,
      `מחלקת פיתוח: ${D.staff} עובדים, שכר שנתי ממוצע ${money(D.salary)} ₪. מי שיעבוד ${D.serviceYears} שנים ==ברציפות== מ-1.1.${y0} יקבל שנת שבתון ב-${devEnd + 1}, בשכר מלא ==לפי השכר של דצמבר ${devEnd}==. השכר צפוי לעלות ב-${pc(D.growth)} בכל שנה מ-${y0 + 1}. בכל מועד החברה צופה ש-${pc(D.p)} מהעובדים יעבדו את כל התקופה. התשלום על כל השבתון ב-1.1.${devEnd + 1}.`,
      `מחלקת רכש: ${B.staff} עובדים, שכר שנתי ממוצע ${money(B.salary)} ₪. מי שיעבוד ${B.serviceYears} שנים ברציפות (עד 31.12.${buyEnd}) יקבל משכורת חודש נוספת לפי שכרו אז. השכר צפוי לעלות ב-${pc(B.growth)} בכל שנה מ-${y0 + 1}. בסוף ${y0} החברה צפתה ש-${pc(B.p0)} יעבדו את כל התקופה. ב-${y} לא עזבו עובדים, ובסוף ${y} ==הצפי ירד== ל-${pc(B.p1)}. התשלום ב-1.1.${buyEnd + 1}.`,
      `הנהלה בכירה: ${M.heads} מנהלים יקבלו כל אחד בונוס של ${pc(M.share)} מהרווח התפעולי המצטבר של ${y0}–${y + 1}, אם הוא יעלה על ${nf(M.threshold / 1e6)} מיליון ₪. הבונוס ישולם ב-1.1.${y + 2}. הרווח בפועל: ${nf(M.profits[0] / 1e6)} מיליון ₪ ב-${y0} ו-${nf(M.profits[1] / 1e6)} מיליון ₪ ב-${y}, והחברה צופה ==שהסף ייעבר==. לא צפויים שינויים בהנהלה.`,
      `שיעור ההיוון: ${pc(r)}.`,
    ],
    tables: [],
    required: [`התנועה בהתחייבות לשנת ${y}, לכל תוכנית בנפרד.`],
    checks: [
      { label: `שבתון: יתרת סגירה 31.12.${y}`, value: s.dev.closing },
      { label: "משכורת נוספת: מדידה מחדש", value: Math.abs(s.buy.pn) },
      { label: `משכורת נוספת: יתרת סגירה 31.12.${y}`, value: s.buy.closing },
      { label: `בונוס הנהלה: יתרת סגירה 31.12.${y}`, value: s.mgmt.closing },
    ],
    steps: [
      {
        title: "סיווג: למה זה זמן ארוך",
        text: [
          "בשלוש התוכניות התשלום בזמן ההעסקה, אבל יותר משנה אחרי סוף השנה שבה העובד עבד. לכן הן הטבות אחרות לזמן ארוך.",
          "המדידה כמו בהטבה מוגדרת: הסכום הצפוי, החלק שנצבר, הסתברות, היוון. ההבדל: המדידה מחדש לא הולכת ל-OCI אלא לרווח והפסד.",
          "בתוכנית הרכש אפשר לקרוא גם שמהשנה השישית העובד מקבל משכורת נוספת כל שנה. אז זו הטבה לזמן קצר. כאן הכוונה למענק אחד אחרי חמש שנים.",
        ],
      },
      {
        title: "הסכום שישולם לכל עובד",
        notes: [
          {
            title: "שבתון, מחלקת פיתוח",
            lines: [{ label: "שכר שנת השבתון", how: `שכר × (1 + צמיחה)^${D.serviceYears - 1}`, calc: `${money(D.salary)} × ${b(D.growth)}^${D.serviceYears - 1}`, value: s.dev.pay, unit: "₪" }],
          },
          {
            title: "משכורת נוספת, מחלקת רכש",
            lines: [{ label: "משכורת חודש בשנה האחרונה", how: `שכר שנתי ÷ 12 × (1 + צמיחה)^${B.serviceYears - 1}`, calc: `${money(B.salary)} ÷ 12 × ${b(B.growth)}^${B.serviceYears - 1}`, value: s.buy.pay, unit: "₪" }],
          },
          {
            title: "בונוס הנהלה. הבונוס נגזר מהרווח של כל שנה, ולכן כל שנה נושאת את הבונוס על הרווח שלה. לא צפויים שינויים בהנהלה: הסתברות 100%, והחלק שנצבר הוא הבונוס כולו",
            lines: [
              { label: `על רווח ${y0}`, calc: `${pc(M.share)} × ${nf(M.profits[0])}`, value: M.share * M.profits[0], unit: "₪" },
              { label: `על רווח ${y}`, calc: `${pc(M.share)} × ${nf(M.profits[1])}`, value: M.share * M.profits[1], unit: "₪" },
              { label: `על הרווח המצטבר עד 31.12.${y}`, calc: `${pc(M.share)} × ${nf(M.profits[0] + M.profits[1])}`, value: M.share * (M.profits[0] + M.profits[1]), unit: "₪" },
            ],
          },
        ],
      },
      pvTable(`יתרת פתיחה 31.12.${y0}`, [
        { label: "פיתוח", heads: D.staff, p: D.p, amount: s.dev.pay, part: `1/${D.serviceYears}`, n: D.serviceYears - 1, value: s.dev.opening },
        { label: "רכש", heads: B.staff, p: B.p0, amount: s.buy.pay, part: `1/${B.serviceYears}`, n: B.serviceYears - 1, value: s.buy.opening },
        { label: "הנהלה", heads: M.heads, amount: M.share * M.profits[0], n: 2, value: s.mgmt.opening },
      ], { rate: r, label: "תוכנית", why: "שנה אחת נצברה בפיתוח וברכש, ובהנהלה נצבר הבונוס על רווח השנה הראשונה." }),
      pvTable(`עלות שירות שוטף ${y}`, [
        { label: "פיתוח", heads: D.staff, p: D.p, amount: s.dev.pay, part: `1/${D.serviceYears}`, n: D.serviceYears - 2, value: s.dev.service },
        { label: "רכש", heads: B.staff, p: B.p0, amount: s.buy.pay, part: `1/${B.serviceYears}`, n: B.serviceYears - 2, value: s.buy.service },
        { label: "הנהלה", heads: M.heads, amount: M.share * M.profits[1], n: 1, value: s.mgmt.service },
      ], { rate: r, label: "תוכנית", why: "השנה שנוספה, מהוונת מסוף השנה. ההנחות של תחילת השנה." }),
      pvTable(`יתרת סגירה 31.12.${y}`, [
        { label: "פיתוח", heads: D.staff, p: D.p, amount: s.dev.pay, part: `2/${D.serviceYears}`, n: D.serviceYears - 2, value: s.dev.closing },
        { label: "רכש", heads: B.staff, p: B.p1, amount: s.buy.pay, part: `2/${B.serviceYears}`, n: B.serviceYears - 2, value: s.buy.closing },
        { label: "הנהלה", heads: M.heads, amount: M.share * (M.profits[0] + M.profits[1]), n: 1, value: s.mgmt.closing },
      ], { rate: r, label: "תוכנית", why: `שנתיים נצברו. ברכש ==הצפי ירד== ל-${pc(B.p1)}: הסגירה נמדדת בצפי החדש, וההפרש יוצא במדידה מחדש.` }),
      {
        title: "התנועה בכל תוכנית",
        text: [
          `ריבית בפיתוח: ${money(s.dev.opening)} × ${pc(r)} = ${money(s.dev.interest)} ₪`,
          `ריבית ברכש: ${money(s.buy.opening)} × ${pc(r)} = ${money(s.buy.interest)} ₪`,
          `ריבית בהנהלה: ${money(s.mgmt.opening)} × ${pc(r)} = ${money(s.mgmt.interest)} ₪`,
          `מדידה מחדש ברכש (השורה המאזנת): ${money(s.buy.closing)} − ${money(s.buy.opening)} − ${money(s.buy.service)} − ${money(s.buy.interest)} = ${money(s.buy.pn)} ₪`,
          "בפיתוח ובהנהלה שום הנחה לא השתנתה, ולכן המדידה מחדש 0.",
        ],
        rolls: [oltRoll("שבתון, מחלקת פיתוח", s.dev, y), oltRoll("משכורת נוספת, מחלקת רכש", s.buy, y), oltRoll("בונוס הנהלה", s.mgmt, y)],
      },
    ],
  };
}

// ===========================================================================
// 3. A defined benefit plan on averages, with grants paid and the terms improved part way through the year.

export type Assumptions = { heads: number; p: number; remaining: number; salary: number; gov: number; corp: number };
export type AmendInput = {
  company: string;
  year: number;
  /** When the plan started counting service (1.1 of that year). */
  since: number;
  start: Assumptions;
  amend: Assumptions;
  end: Assumptions;
  oldRate: number;
  newRate: number;
  /** The amendment takes effect at the end of this month. */
  month: number;
  payment: { amount: number; month: number };
};

export function solveAmend(q: AmendInput) {
  const { start: S, amend: A, end: E, month: m } = q;
  const served0 = q.year - q.since;
  const heads = (a: Assumptions) => a.heads * a.p;
  const opening = (S.salary * q.oldRate * served0 * heads(S)) / (1 + S.corp) ** S.remaining;
  const sBefore = (S.salary * q.oldRate * (m / 12) * heads(S)) / (1 + S.corp) ** (S.remaining - m / 12);
  const sAfter = (A.salary * q.newRate * ((12 - m) / 12) * heads(A)) / (1 + A.corp) ** (A.remaining - (12 - m) / 12);
  const servedA = served0 + m / 12;
  const before = (A.salary * q.oldRate * servedA * heads(A)) / (1 + A.corp) ** A.remaining;
  const after = (A.salary * q.newRate * servedA * heads(A)) / (1 + A.corp) ** A.remaining;
  const pastService = after - before;
  const iOpening = opening * ((1 + S.corp) ** (m / 12) - 1);
  const iPayment = q.payment.amount * ((1 + S.corp) ** ((m - q.payment.month) / 12) - 1);
  const iAfter = after * ((1 + A.corp) ** ((12 - m) / 12) - 1);
  const interest = iOpening - iPayment + iAfter;
  const closing = (E.salary * q.newRate * (served0 + 1) * heads(E)) / (1 + E.corp) ** E.remaining;
  const service = sBefore + sAfter;
  const pn = closing - opening - service - pastService - interest + q.payment.amount;
  return { served0, servedA, opening, sBefore, sAfter, service, before, after, pastService, iOpening, iPayment, iAfter, interest, closing, pn };
}

const LAST_DAY = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const endOf = (month: number, y: number) => `${LAST_DAY[month]}.${month}.${y}`;

export function amendQuestion(id: string, title: string, q: AmendInput): BkQuestion {
  const s = solveAmend(q);
  const { start: S, amend: A, end: E, month: m, year: y } = q;
  const pm = q.payment.month;
  return {
    id,
    title,
    point: "שינוי תנאים באמצע שנה מפצל את השנה לשתיים: שירות וריבית לפי התנאים הישנים עד השינוי, שירות עבר ביום השינוי, ושירות וריבית לפי החדשים אחריו.",
    facts: [
      `ב-1.1.${q.since} העניקה חברת ״${q.company}״ לעובדי המטה שלה מענק חד פעמי של ${pc(q.oldRate)} מהשכר החודשי האחרון לכל שנת שירות. המענק משולם למי שפורש או מפוטר. מי שמתפטר לא מקבל.`,
      "לשם פשטות, החברה מחשבת לפי נתונים ממוצעים (טבלה 1). כל העובדים בטבלה עבדו בחברה ב-1.1." + q.since + ".",
      `ב-${y} שולמו מענקים של ${money(q.payment.amount)} ₪. הניחו שהם שולמו ב-${endOf(pm, y)}.`,
      `ב-${endOf(m, y)} החליטה החברה להעלות את המענק ל-${pc(q.newRate)} מהשכר האחרון לכל שנת שירות.`,
      "מלבד זאת לא השתנו ההנחות.",
    ],
    tables: [
      {
        title: "טבלה 1: ההנחות האקטואריות",
        head: ["", `31.12.${y - 1}`, endOf(m, y), `31.12.${y}`],
        rows: [
          ["עובדים שעשויים להיות זכאים", S.heads, A.heads, E.heads],
          ["מתוכם, שיעור הצפויים לקבל", pc(S.p), pc(A.p), pc(E.p)],
          ["שנים שנותרו עד המענק (ממוצע)", S.remaining, A.remaining, E.remaining],
          ["שכר ממוצע בפרישה (₪)", money(S.salary), money(A.salary), money(E.salary)],
          ["תשואת אג״ח ממשלתיות", pc(S.gov), pc(A.gov), pc(E.gov)],
          ["תשואת אג״ח קונצרניות איכותיות", pc(S.corp), pc(A.corp), pc(E.corp)],
        ],
      },
    ],
    required: ["סיווג המענק.", `התנועה בהתחייבות לשנת ${y}.`],
    checks: [
      { label: `יתרת פתיחה 31.12.${y - 1}`, value: s.opening },
      { label: "עלות שירות שוטף", value: s.service },
      { label: "עלות שירות עבר", value: s.pastService },
      { label: "עלות ריבית", value: s.interest },
      { label: `יתרת סגירה 31.12.${y}`, value: s.closing },
    ],
    steps: [
      {
        title: "סיווג, ובאיזו ריבית",
        text: [
          "המענק משולם אחרי סיום העבודה, בגין שנות השירות: הטבה לאחר סיום העסקה. אין קופה נפרדת שנושאת בסיכון, ולכן זו תוכנית הטבה מוגדרת.",
          "מהוונים לפי אג״ח קונצרניות איכותיות (סעיף 83). תשואת האג״ח הממשלתיות היא נתון סרק.",
        ],
      },
      {
        title: "טבלת התנועה",
        rolls: [
          {
            title: `התחייבות למענק, ${y}`,
            rows: [
              { label: `יתרת פתיחה 31.12.${y - 1}`, value: s.opening, kind: "balance", note: "ביאור 1" },
              { label: "עלות שירות שוטף", value: s.service, note: "ביאור 2" },
              { label: "עלות שירות עבר", value: s.pastService, note: "ביאור 3" },
              { label: "תשלומים", value: -q.payment.amount, note: "נתון" },
              { label: "עלות ריבית", value: s.interest, note: "ביאור 4" },
              { label: "מדידה מחדש", value: s.pn, kind: "pn", note: "השורה המאזנת" },
              { label: `יתרת סגירה 31.12.${y}`, value: s.closing, kind: "balance", note: "ביאור 5" },
            ],
          },
        ],
      },
      {
        title: "המענק לשנת שירות, לכל עובד",
        notes: [
          {
            title: "שכר בפרישה × שיעור המענק, לפי הנתונים של כל מועד",
            lines: [
              { label: `31.12.${y - 1}, בתנאים הישנים`, calc: `${money(S.salary)} × ${pc(q.oldRate)}`, value: S.salary * q.oldRate, unit: "₪" },
              { label: `${endOf(m, y)}, בתנאים הישנים`, calc: `${money(A.salary)} × ${pc(q.oldRate)}`, value: A.salary * q.oldRate, unit: "₪" },
              { label: `${endOf(m, y)}, בתנאים החדשים`, calc: `${money(A.salary)} × ${pc(q.newRate)}`, value: A.salary * q.newRate, unit: "₪" },
              { label: `31.12.${y}, בתנאים החדשים`, calc: `${money(E.salary)} × ${pc(q.newRate)}`, value: E.salary * q.newRate, unit: "₪" },
            ],
          },
        ],
      },
      pvTable(
        "ביאור 1: יתרת פתיחה",
        [{ label: `31.12.${y - 1}`, heads: S.heads, p: S.p, amount: S.salary * q.oldRate, part: yearsAs(s.served0), n: S.remaining, value: s.opening }],
        { rate: S.corp, label: "מועד", amount: "מענק", part: "שנים", amountDec: 2, why: `מ-1.1.${q.since} עד 31.12.${y - 1} עברו ${s.served0} שנים. נתוני 31.12.${y - 1}.` },
      ),
      pvTable(
        "ביאור 2: עלות שירות שוטף, בשני חלקים",
        [
          { label: "לפני", heads: S.heads, p: S.p, amount: S.salary * q.oldRate, part: `${m}/12`, n: S.remaining - m / 12, value: s.sBefore },
          { label: "אחרי", heads: A.heads, p: A.p, amount: A.salary * q.newRate, part: `${12 - m}/12`, n: A.remaining - (12 - m) / 12, rate: A.corp, value: s.sAfter },
        ],
        {
          rate: S.corp,
          label: "חלק",
          amount: "מענק",
          part: "שנים",
          amountDec: 2,
          why: [`לפני השינוי: ${m} חודשים בתנאים הישנים, לפי נתוני תחילת השנה.`, `אחרי השינוי: ${12 - m} חודשים בתנאים החדשים, לפי נתוני יום השינוי.`],
        },
      ),
      {
        ...pvTable(
          "ביאור 3: עלות שירות עבר",
          [
            { label: "ישנים", heads: A.heads, p: A.p, amount: A.salary * q.oldRate, part: yearsAs(s.servedA), n: A.remaining, value: s.before },
            { label: "חדשים", heads: A.heads, p: A.p, amount: A.salary * q.newRate, part: yearsAs(s.servedA), n: A.remaining, value: s.after },
          ],
          {
            rate: A.corp,
            label: "תנאים",
            amount: "מענק",
            part: "שנים",
            amountDec: 2,
            total: false,
            why: ["ההתחייבות ביום השינוי, בתנאים החדשים פחות בישנים.", `ביום השינוי עברו ${s.served0} + ${m}/12 = ${d2(s.servedA)} שנים. כל השאר: נתוני יום השינוי.`],
          },
        ),
        notes: [{ title: "ההפרש", lines: [{ label: "שירות עבר", calc: `${money(s.after)} − ${money(s.before)}`, value: s.pastService, unit: "₪" }] }],
      },
      {
        title: "ביאור 4: עלות ריבית, בשלושה חלקים",
        notes: [
          {
            title: "ריבית לחלק משנה: יתרה × ((1+i)^(חודשים/12) − 1)",
            lines: [
              { label: `על הפתיחה, ${m} חודשים`, calc: `${money(s.opening)} × (${b(S.corp)}^(${m}/12) − 1)`, value: s.iOpening, unit: "₪" },
              { label: `התשלום הקטין את החוב ל-${m - pm} חודשים`, calc: `−${money(q.payment.amount)} × (${b(S.corp)}^(${m - pm}/12) − 1)`, value: -s.iPayment, unit: "₪" },
              { label: `על ההתחייבות החדשה, ${12 - m} חודשים`, calc: `${money(s.after)} × (${b(A.corp)}^(${12 - m}/12) − 1)`, value: s.iAfter, unit: "₪" },
              { label: "סה״כ ריבית", value: s.interest, unit: "₪" },
            ],
          },
        ],
      },
      {
        ...pvTable(
          "ביאור 5: יתרת סגירה",
          [{ label: `31.12.${y}`, heads: E.heads, p: E.p, amount: E.salary * q.newRate, part: yearsAs(s.served0 + 1), n: E.remaining, value: s.closing }],
          { rate: E.corp, label: "מועד", amount: "מענק", part: "שנים", amountDec: 2, why: "בתנאים החדשים, לפי נתוני סוף השנה." },
        ),
        notes: [
          {
            title: "המדידה מחדש",
            lines: [{ label: "סגירה − כל השורות", calc: `${money(s.closing)} − ${money(s.opening)} − ${money(s.service)} − ${money(s.pastService)} + ${money(q.payment.amount)} − ${money(s.interest)}`, value: s.pn, unit: "₪" }],
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// 4. A plan for gifts at retirement in two tiers, a trust account that is plan assets under a ceiling, and a second plan handed to an insurer.

export type TierData = { heads: number; remaining: number; cost: number };
export type GiftInput = {
  company: string;
  year: number;
  since: number;
  tiers: { name: string; window: number; rule: string }[];
  start: TierData[];
  end: TierData[];
  totals: { start: number; end: number; notExpected: number };
  iStart: number;
  iEnd: number;
  govStart: number;
  govEnd: number;
  deposit: { amount: number; month: number };
  fvEnd: number;
  dc: { name: string; share: number; payment: number; giftValue: number; heads: number };
};

export function solveGift(q: GiftInput) {
  const served0 = q.year - q.since;
  const tiers = q.tiers.map((t, k) => {
    const s0 = q.start[k];
    const s1 = q.end[k];
    const ben0 = s0.cost / t.window;
    const ben1 = s1.cost / t.window;
    const opening = (s0.heads * served0 * ben0) / (1 + q.iStart) ** s0.remaining;
    const service = (s0.heads * ben0) / (1 + q.iStart) ** (s0.remaining - 1);
    const interest = opening * q.iStart;
    const closing = (s1.heads * (served0 + 1) * ben1) / (1 + q.iEnd) ** s1.remaining;
    return { ben0, ben1, opening, service, interest, closing, pn: closing - opening - service - interest };
  });
  const tot = (k: "opening" | "service" | "interest" | "closing" | "pn") => sum(tiers.map((t) => t[k]));
  const liability = { opening: tot("opening"), service: tot("service"), interest: tot("interest"), closing: tot("closing"), pn: tot("pn") };
  const assetInterest = q.deposit.amount * ((1 + q.iStart) ** ((12 - q.deposit.month) / 12) - 1);
  const assetClosing = Math.min(q.fvEnd, liability.closing);
  const assetPn = assetClosing - q.deposit.amount - assetInterest;
  return {
    served0,
    tiers,
    liability,
    assets: { deposit: q.deposit.amount, interest: assetInterest, closing: assetClosing, pn: assetPn, ceilingEffect: assetClosing - q.fvEnd, investLoss: q.fvEnd - q.deposit.amount },
    pl: { service: liability.service, netFinance: liability.interest - assetInterest },
    oci: liability.pn - assetPn,
  };
}

export function giftQuestion(id: string, title: string, q: GiftInput): BkQuestion {
  const s = solveGift(q);
  const y = q.year;
  const dm = q.deposit.month;
  return {
    id,
    title,
    point: "כסף בחשבון נאמנות הוא נכסי תכנית רק אם הוא שמור לעובדים. ואם יש עודף שהחברה לא יכולה לקבל בחזרה, הנכס מוגבל לגובה ההתחייבות (תקרת הנכס).",
    facts: [
      `חברת ״${q.company}״ מעניקה לעובדי המפעל שעבדו בה ב-1.1.${q.since} מתנה במועד הפרישה או הפיטורין. מי שמתפטר לא מקבל. מי שלא השלים 5 שנות ותק לא מקבל. הוותק נספר מ-1.1.${q.since}.`,
      ...q.tiers.map((t) => `${t.name}: ${t.rule}.`),
      `לשם פשטות, החברה מחשבת לפי נתונים ממוצעים (טבלה 1).`,
      `ב-1.1.${y} נפתח חשבון נאמנות להבטחת התוכנית. הכסף משמש רק לרכישת המתנות או להחזר לחברה על מתנות שקנתה. הוא לא זמין לנושי החברה. החברה לא יכולה למשוך עודפים. כשהתוכנית תיסגר, הנאמן יחליט אם להחזיר עודף לחברה או לחלק אותו לעובדים.`,
      `ב-${endOf(dm, y)} הופקדו ${money(q.deposit.amount)} ₪. בסוף השנה, אחרי השקעות כושלות, נותרו בחשבון ${money(q.fvEnd)} ₪.`,
      "עלות השירות השוטף מחושבת לפי ההנחות של תחילת השנה.",
      `תוכנית ״${q.dc.name}״: לעובדים שאינם זכאים לתוכנית הראשונה. ב-1.1.${y} התקשרה החברה עם חברת ביטוח שקיבלה על עצמה באופן בלתי חוזר את כל ההטבות, תמורת ${pc(q.dc.share)} מעלות השכר בכל סוף שנה. החברה לא תשלם יותר, גם אם חברת הביטוח תקרוס. בסוף ${y} שולמו ${money(q.dc.payment)} ₪. שווי כל מתנה ${money(q.dc.giftValue)} ₪, וכ-${q.dc.heads} עובדים צפויים לקבל אותה בעוד שנתיים.`,
      "ריבית לחלק משנה מחושבת בריבית אפקטיבית. החברה מציגה ריבית נטו בהוצאות המימון.",
    ],
    tables: [
      {
        title: "טבלה 1: ההנחות האקטואריות",
        head: ["", `31.12.${y - 1}`, `31.12.${y}`],
        rows: [
          ["עובדים שעשויים להיות זכאים", q.totals.start, q.totals.end],
          ["מתוכם, לא צפויים לקבל", q.totals.notExpected, q.totals.notExpected],
          ...q.tiers.flatMap((t, k) => [
            [`${t.name}: עובדים`, q.start[k].heads, q.end[k].heads],
            [`${t.name}: שנים שנותרו`, q.start[k].remaining, q.end[k].remaining],
            [`${t.name}: עלות המתנה (₪)`, money(q.start[k].cost), money(q.end[k].cost)],
          ]),
          ["תשואת אג״ח ממשלתיות", pc(q.govStart), pc(q.govEnd)],
          ["תשואת אג״ח קונצרניות איכותיות", pc(q.iStart), pc(q.iEnd)],
        ],
      },
    ],
    required: ["לסווג כל תוכנית.", `תנועה בהתחייבות ובנכסים של כל תוכנית לשנת ${y}.`, "השפעת כל תוכנית על הוצאות השכר, המימון נטו וה-OCI."],
    checks: [
      { label: `התחייבות: יתרת פתיחה 31.12.${y - 1}`, value: s.liability.opening },
      { label: `התחייבות: יתרת סגירה 31.12.${y}`, value: s.liability.closing },
      { label: "נכסים: יתרת סגירה (אחרי התקרה)", value: s.assets.closing },
      { label: "סה״כ הפסד כולל אחר", value: Math.abs(s.oci) },
    ],
    steps: [
      {
        title: "סיווג שתי התוכניות",
        text: [
          `התוכנית הראשונה: המתנה ניתנת אחרי סיום העבודה, וגם למי שפורש (לא רק למפוטר), ולכן זו לא הטבת פיטורין. החברה נושאת בסיכון: תוכנית הטבה מוגדרת.`,
          `״${q.dc.name}״: חברת הביטוח לקחה את הסיכון באופן בלתי חוזר, והחברה משלמת רק את הסכום שנקבע. תוכנית הפקדה מוגדרת. שווי המתנה ומספר העובדים הם נתוני סרק.`,
          "מהוונים לפי האג״ח הקונצרניות. בישראל יש להן שוק עמוק, והאג״ח הממשלתיות הן נתון סרק.",
        ],
      },
      {
        title: "ההטבה לשנה בכל דרג",
        notes: [
          {
            title: "עלות המתנה ÷ השנים שבהן היא נצברת",
            text: `מ-1.1.${q.since} עד 31.12.${y - 1} עברו ${s.served0} שנים.`,
            lines: q.tiers.flatMap((t, k) => [
              { label: `${t.name}, תחילת השנה`, calc: `${money(q.start[k].cost)} ÷ ${t.window}`, value: s.tiers[k].ben0, unit: "₪" as const },
              { label: `${t.name}, סוף השנה`, calc: `${money(q.end[k].cost)} ÷ ${t.window}`, value: s.tiers[k].ben1, unit: "₪" as const },
            ]),
          },
        ],
      },
      pvTable(
        `יתרת פתיחה 31.12.${y - 1}`,
        q.tiers.map((t, k) => ({ label: t.name, heads: q.start[k].heads, amount: s.tiers[k].ben0, part: `${s.served0}`, n: q.start[k].remaining, value: s.tiers[k].opening })),
        { rate: q.iStart, label: "דרג", amount: "הטבה לשנה", part: "שנים", amountDec: 2, why: `עברו ${s.served0} שנים, בהנחות של 31.12.${y - 1}.` },
      ),
      pvTable(
        `עלות שירות שוטף ${y}`,
        q.tiers.map((t, k) => ({ label: t.name, heads: q.start[k].heads, amount: s.tiers[k].ben0, part: "1", n: q.start[k].remaining - 1, value: s.tiers[k].service })),
        { rate: q.iStart, label: "דרג", amount: "הטבה לשנה", part: "שנים", amountDec: 2, why: "שנה אחת, בהנחות של תחילת השנה, מהוונת מסוף השנה." },
      ),
      pvTable(
        `יתרת סגירה 31.12.${y}`,
        q.tiers.map((t, k) => ({ label: t.name, heads: q.end[k].heads, amount: s.tiers[k].ben1, part: `${s.served0 + 1}`, n: q.end[k].remaining, value: s.tiers[k].closing })),
        { rate: q.iEnd, label: "דרג", amount: "הטבה לשנה", part: "שנים", amountDec: 2, why: `עברו ${s.served0 + 1} שנים, בהנחות ובריבית של סוף השנה.` },
      ),
      {
        title: "טבלת התנועה בהתחייבות",
        text: [
          ...q.tiers.map((t, k) => `ריבית, ${t.name}: ${money(s.tiers[k].opening)} × ${pc(q.iStart)} = ${money(s.tiers[k].interest)} ₪`),
          ...q.tiers.map(
            (t, k) =>
              `מדידה מחדש, ${t.name} (השורה המאזנת): ${money(s.tiers[k].closing)} − ${money(s.tiers[k].opening)} − ${money(s.tiers[k].service)} − ${money(s.tiers[k].interest)} = ${money(s.tiers[k].pn)} ₪`,
          ),
        ],
        rolls: [
          {
            title: `התחייבות, ${y}`,
            rows: [
              { label: `יתרת פתיחה 31.12.${y - 1}`, value: s.liability.opening, kind: "balance" },
              { label: "עלות שירות שוטף", value: s.liability.service },
              { label: "עלות ריבית", value: s.liability.interest },
              { label: "מדידה מחדש", value: s.liability.pn, kind: "pn" },
              { label: `יתרת סגירה 31.12.${y}`, value: s.liability.closing, kind: "balance" },
            ],
          },
        ],
      },
      {
        title: "הנכסים, ותקרת הנכס",
        notes: [
          {
            title: "חשבון הנאמנות הוא נכסי תכנית: שמור לעובדים, ולא זמין לנושים",
            lines: [
              { label: `הכנסות ריבית: ${12 - dm} חודשים על ההפקדה`, calc: `${money(q.deposit.amount)} × (${b(q.iStart)}^(${12 - dm}/12) − 1)`, value: s.assets.interest, unit: "₪" },
              { label: "שווי הוגן בסוף השנה", value: q.fvEnd, unit: "₪" },
              { label: "תקרה: גובה ההתחייבות", value: s.liability.closing, unit: "₪" },
              { label: "מכירים בנמוך מביניהם", calc: `MIN(${money(q.fvEnd)}, ${money(s.liability.closing)})`, value: s.assets.closing, unit: "₪" },
            ],
          },
          {
            title: "למה יש תקרה",
            text: "החברה לא יכולה למשוך את העודף, וההחלטה מה לעשות בו בסוף בידי הנאמן. לכן אין לה הטבה כלכלית מהעודף, והנכס נטו לא יכול להיות גדול מאפס.",
            lines: [
              { label: "הפסד בהשקעות", calc: `${money(q.fvEnd)} − ${money(q.deposit.amount)}`, value: s.assets.investLoss, unit: "₪" },
              { label: "הריבית הנורמטיבית שלא הושגה", value: -s.assets.interest, unit: "₪" },
              { label: "השפעת התקרה", calc: `${money(s.assets.closing)} − ${money(q.fvEnd)}`, value: s.assets.ceilingEffect, unit: "₪" },
              { label: "סה״כ מדידה מחדש של הנכסים", value: s.assets.pn, unit: "₪" },
            ],
          },
        ],
        rolls: [
          {
            title: `נכסי התכנית, ${y}`,
            side: "debit",
            rows: [
              { label: "יתרת פתיחה", value: 0, kind: "balance" },
              { label: `הפקדה ${endOf(dm, y)}`, value: q.deposit.amount },
              { label: "הכנסות ריבית", value: s.assets.interest },
              { label: "מדידה מחדש", value: s.assets.pn, kind: "pn" },
              { label: `יתרת סגירה 31.12.${y}`, value: s.assets.closing, kind: "balance" },
            ],
          },
        ],
      },
      {
        title: "ההשפעה על הדוחות",
        tables: [
          {
            head: ["סעיף", "התוכנית הראשונה", `״${q.dc.name}״`],
            rows: [
              ["הוצאות שכר: שירות שוטף", money(s.pl.service), money(q.dc.payment)],
              ["מימון נטו: ריבית על ההתחייבות פחות על הנכסים", `${money(s.liability.interest)} − ${money(s.assets.interest)} = ${money(s.pl.netFinance)}`, "—"],
              ["OCI: מדידה מחדש (הפסד)", `${money(s.liability.pn)} + ${money(-s.assets.pn)} = ${money(s.oci)}`, "—"],
              ["יתרה במאזן", `${money(s.liability.closing)} − ${money(s.assets.closing)} = 0`, "0 (שולם במזומן)"],
            ],
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// 5. Three agreements at once: an insured plan known from a partial note, a defined contribution plan, and a CEO's golden parachute improved mid-year.

export type NoteYear = { rate: number; service: number; paid?: number; pn?: number; deposits: number; paidFromAssets: number; assetsClosing: number; closing: number };
export type ThreeInput = {
  company: string;
  /** The two years asked about. */
  years: [number, number];
  sales: { staff: number; opening: number; assetsOpening: number; y1: NoteYear & { paid: number }; y2: NoteYear & { pn: number } };
  production: { staff: number; hired: number; salary: number; raise: number };
  ceo: { hired: number; term: number; salary: number; firstRaise: number; raise: number; multiple: number; newMultiple: number; month: number; rates: [number, number, number, number]; gov: [number, number, number, number] };
};

export function solveThree(q: ThreeInput) {
  const S = q.sales;
  const int1 = S.opening * S.y1.rate;
  const pn1 = S.y1.closing - S.opening - int1 - S.y1.service + S.y1.paid;
  const int2 = S.y1.closing * S.y2.rate;
  // The second year's actuarial line is a gain given in the note: closing = opening + interest + service − paid − gain.
  const paid2 = S.y1.closing + int2 + S.y2.service - S.y2.pn - S.y2.closing;
  const aInt1 = S.assetsOpening * S.y1.rate;
  const aPn1 = S.y1.assetsClosing - S.assetsOpening - aInt1 - S.y1.deposits + S.y1.paidFromAssets;
  const aInt2 = S.y1.assetsClosing * S.y2.rate;
  const aPn2 = S.y2.assetsClosing - S.y1.assetsClosing - aInt2 - S.y2.deposits + S.y2.paidFromAssets;
  const sales = {
    y1: { opening: S.opening, interest: int1, service: S.y1.service, paid: S.y1.paid, pn: pn1, closing: S.y1.closing },
    y2: { opening: S.y1.closing, interest: int2, service: S.y2.service, paid: paid2, pn: -S.y2.pn, closing: S.y2.closing },
    a1: { opening: S.assetsOpening, interest: aInt1, deposits: S.y1.deposits, paid: S.y1.paidFromAssets, pn: aPn1, closing: S.y1.assetsClosing },
    a2: { opening: S.y1.assetsClosing, interest: aInt2, deposits: S.y2.deposits, paid: S.y2.paidFromAssets, pn: aPn2, closing: S.y2.assetsClosing },
  };
  const P = q.production;
  const prodSalary = q.years.map((y) => P.salary * (1 + P.raise) ** (y - P.hired));
  const production = { salary: prodSalary, expense: prodSalary.map((x) => x * P.staff) };
  const C = q.ceo;
  const T = C.term;
  const finalSalary = C.salary * (1 + C.firstRaise) * (1 + C.raise) ** (T - 2);
  const g1 = C.multiple * finalSalary * T;
  const g2 = C.newMultiple * finalSalary * T;
  const [r0, r1, rM, r2] = C.rates;
  const m = C.month;
  const e = 2 + m / 12;
  const c1 = {
    opening: (g1 / T) / (1 + r0) ** (T - 1),
    interest: 0,
    service: (g1 / T) / (1 + r0) ** (T - 2),
    closing: ((g1 * 2) / T) / (1 + r1) ** (T - 2),
    pn: 0,
  };
  c1.interest = c1.opening * r0;
  c1.pn = c1.closing - c1.opening - c1.interest - c1.service;
  const before = ((g1 * e) / T) / (1 + rM) ** (T - e);
  const after = ((g2 * e) / T) / (1 + rM) ** (T - e);
  const sB = ((g1 * (m / 12)) / T) / (1 + r1) ** (T - e);
  const sA = ((g2 * ((12 - m) / 12)) / T) / (1 + rM) ** (T - 3);
  const iB = c1.closing * ((1 + r1) ** (m / 12) - 1);
  const iA = after * ((1 + rM) ** ((12 - m) / 12) - 1);
  const c2 = { opening: c1.closing, past: after - before, service: sB + sA, interest: iB + iA, closing: ((g2 * 3) / T) / (1 + r2) ** (T - 3), pn: 0 };
  c2.pn = c2.closing - c2.opening - c2.past - c2.service - c2.interest;
  const ceo = { finalSalary, g1, g2, e, before, after, sB, sA, iB, iA, y1: c1, y2: c2 };
  const statements = [0, 1].map((k) => {
    const sl = k === 0 ? sales.y1 : sales.y2;
    const sa = k === 0 ? sales.a1 : sales.a2;
    const c = k === 0 ? c1 : c2;
    const liability = sl.closing + c.closing;
    return {
      liability,
      assets: sa.closing,
      net: liability - sa.closing,
      cogs: production.expense[k],
      selling: sl.service,
      admin: k === 0 ? c1.service : c2.service + c2.past,
      finance: sl.interest - sa.interest + c.interest,
      oci: sl.pn - sa.pn + c.pn,
    };
  });
  return { sales, production, ceo, statements };
}

export function threeQuestion(id: string, title: string, q: ThreeInput): BkQuestion {
  const s = solveThree(q);
  const [y1, y2] = q.years;
  const S = q.sales;
  const C = q.ceo;
  const T = C.term;
  const [r0, r1, rM, r2] = C.rates;
  const m = C.month;
  const P = q.production;
  const kNote = (v: number | undefined) => (v === undefined ? "?" : money(v));
  const ceoO = { label: "מדידה", amount: "מענק לשנה", part: "שנים", amountDec: 2, rateCol: true };
  return {
    id,
    title,
    point: "לכל הסכם תוכנית משלו: מבטח שלא לקח את כל הסיכון הוא עדיין הטבה מוגדרת, סעיף 14 הוא הפקדה מוגדרת, ומצנח זהב בלי קופה הוא הטבה מוגדרת. וכל שורה הולכת לסעיף שלה בדוחות.",
    facts: [
      `חברת ״${q.company}״ נסחרת בבורסה. להלן שלושה הסכמי שכר.`,
      `עובדי מכירות (${S.staff}): זכאים לפיצויים לפי החוק, בין אם פוטרו ובין אם התפטרו. החברה מפקידה סכומים קבועים לפוליסה בחברת ביטוח (נכסי התכנית). אם לחברת הביטוח לא יהיה מספיק, החברה תשלים. נתונים חלקיים מהביאור בטבלה 1. כל ההפקדות והתשלומים ביום האחרון של השנה.`,
      `עובדי ייצור (${P.staff}, מ-1.1.${P.hired}): פיצויים בגובה השכר האחרון × שנות העבודה, וחל עליהם סעיף 14: החברה לא חייבת דבר מעבר להפקדות. ההפקדה בסוף כל שנה, בגובה השכר החודשי של אותה שנה. שכר התחלתי ${money(P.salary)} ₪, ועולה ב-${pc(P.raise)} בכל ינואר מ-${P.hired + 1}.`,
      `המנכ״ל (מ-1.1.${C.hired}): בסיום העבודה, מכל סיבה, מענק של ${pc(C.multiple)} מהשכר החודשי האחרון × שנות העבודה. שכר התחלתי ${money(C.salary)} ₪. הוא יעלה ב-${pc(C.firstRaise)} בתחילת ${C.hired + 1} וב-${pc(C.raise)} בכל ינואר מ-${C.hired + 2}. החברה צופה שהוא יעבוד ${T} שנים (עד 31.12.${C.hired + T - 1}). אין הפקדות בגינו.`,
      `ב-${endOf(m, y2)} הוחלט להעלות את מצנח הזהב ל-${pc(C.newMultiple)} מהשכר האחרון × שנות העבודה, כולל השנים שכבר עבד.`,
      "התעלמו ממסים. הוצאות והכנסות מימון של תוכנית הטבה מוגדרת מוצגות בנפרד מהוצאות השכר.",
    ],
    tables: [
      {
        title: "טבלה 1: עובדי מכירות, מתוך הביאור (₪)",
        head: ["", String(y2), String(y1)],
        rows: [
          ["ערך נוכחי של המחויבות ב-1.1", `(${money(S.y1.closing)})`, `(${money(S.opening)})`],
          ["שווי הוגן של נכסי התכנית ב-1.1", money(S.y1.assetsClosing), money(S.assetsOpening)],
          ["עלות שירות שוטף", money(S.y2.service), money(S.y1.service)],
          ["הפקדות לנכסי התכנית", money(S.y2.deposits), money(S.y1.deposits)],
          ["הטבות ששולמו מנכסי התכנית", money(S.y2.paidFromAssets), money(S.y1.paidFromAssets)],
          ["סך ההטבות ששולמו לעובדים", "?", kNote(S.y1.paid)],
          ["רווח (הפסד) אקטוארי על המחויבות", money(S.y2.pn), "?"],
          ["רווח (הפסד) אקטוארי על הנכסים", "?", "?"],
          ["ערך נוכחי של המחויבות ב-31.12", `(${money(S.y2.closing)})`, `(${money(S.y1.closing)})`],
          ["שווי הוגן של נכסי התכנית ב-31.12", money(S.y2.assetsClosing), money(S.y1.assetsClosing)],
        ],
      },
      {
        title: "טבלה 2: תשואות (שנתיות)",
        head: ["", `31.12.${y1 - 1}`, `31.12.${y1}`, endOf(m, y2), `31.12.${y2}`],
        rows: [
          ["אג״ח ממשלתיות", ...C.gov.map(pc)],
          ["אג״ח קונצרניות איכותיות", ...C.rates.map(pc)],
        ],
      },
    ],
    required: [`תנועה בהתחייבות ובנכסים של כל הסכם לשנים ${y1}–${y2}.`, `ההשפעה על הרווח הכולל לשנים ${y1} ו-${y2}, והיתרות במאזן ב-31.12.${y1} וב-31.12.${y2}.`],
    checks: [
      { label: `מכירות: מדידה מחדש של המחויבות ${y1}`, value: Math.abs(s.sales.y1.pn) },
      { label: `מכירות: הטבות ששולמו ${y2}`, value: s.sales.y2.paid },
      { label: `מנכ״ל: עלות שירות עבר ${y2}`, value: s.ceo.y2.past },
      { label: `מנכ״ל: יתרת סגירה 31.12.${y2}`, value: s.ceo.y2.closing },
    ],
    steps: [
      {
        title: "סיווג שלושת ההסכמים",
        tables: [
          {
            head: ["הסכם", "סיווג", "למה"],
            rows: [
              ["עובדי מכירות", "הטבה מוגדרת, עם נכסי תכנית", "החברה משלימה אם חברת הביטוח לא תשלם: הסיכון אצלה"],
              ["עובדי ייצור", "הפקדה מוגדרת", "סעיף 14: אין מחויבות מעבר להפקדה"],
              ["המנכ״ל", "הטבה מוגדרת, בלי נכסים", "החברה חייבת סכום שתלוי בשכר ובשנים, ולא מפקידה"],
            ],
          },
        ],
      },
      {
        title: "עובדי מכירות: משלימים את הביאור",
        text: ["הריבית על היתרה בתחילת השנה, בתשואה של תחילת השנה. ההפקדות והתשלומים ביום האחרון, ולכן אין עליהם ריבית. בכל שנה נעלם אחד, והוא השורה שמאזנת.", "ההטבות ששולמו לעובדים גדולות ממה ששולם מהנכסים: את ההפרש החברה שילמה מכספה."],
        rolls: [
          {
            title: `מחויבות, ${y1}`,
            rows: [
              { label: `יתרת פתיחה 1.1.${y1}`, value: S.opening, kind: "balance" },
              { label: "עלות ריבית", value: s.sales.y1.interest, note: `${money(S.opening)} × ${pc(S.y1.rate)}` },
              { label: "עלות שירות שוטף", value: S.y1.service },
              { label: "הטבות ששולמו", value: -S.y1.paid },
              { label: "הפסד אקטוארי", value: s.sales.y1.pn, kind: "pn", note: "הנעלם" },
              { label: `יתרת סגירה 31.12.${y1}`, value: S.y1.closing, kind: "balance" },
            ],
          },
          {
            title: `מחויבות, ${y2}`,
            rows: [
              { label: `יתרת פתיחה 1.1.${y2}`, value: S.y1.closing, kind: "balance" },
              { label: "עלות ריבית", value: s.sales.y2.interest, note: `${money(S.y1.closing)} × ${pc(S.y2.rate)}` },
              { label: "עלות שירות שוטף", value: S.y2.service },
              { label: "הטבות ששולמו", value: -s.sales.y2.paid, note: "הנעלם" },
              { label: "רווח אקטוארי", value: -S.y2.pn, kind: "pn" },
              { label: `יתרת סגירה 31.12.${y2}`, value: S.y2.closing, kind: "balance" },
            ],
          },
          {
            title: `נכסי התכנית, ${y1}`,
            side: "debit",
            rows: [
              { label: `יתרת פתיחה 1.1.${y1}`, value: S.assetsOpening, kind: "balance" },
              { label: "הכנסות ריבית", value: s.sales.a1.interest, note: `${money(S.assetsOpening)} × ${pc(S.y1.rate)}` },
              { label: "הפקדות", value: S.y1.deposits },
              { label: "הטבות ששולמו מהנכסים", value: -S.y1.paidFromAssets },
              { label: "מדידה מחדש", value: s.sales.a1.pn, kind: "pn", note: "הנעלם" },
              { label: `יתרת סגירה 31.12.${y1}`, value: S.y1.assetsClosing, kind: "balance" },
            ],
          },
          {
            title: `נכסי התכנית, ${y2}`,
            side: "debit",
            rows: [
              { label: `יתרת פתיחה 1.1.${y2}`, value: S.y1.assetsClosing, kind: "balance" },
              { label: "הכנסות ריבית", value: s.sales.a2.interest, note: `${money(S.y1.assetsClosing)} × ${pc(S.y2.rate)}` },
              { label: "הפקדות", value: S.y2.deposits },
              { label: "הטבות ששולמו מהנכסים", value: -S.y2.paidFromAssets },
              { label: "מדידה מחדש", value: s.sales.a2.pn, kind: "pn", note: "הנעלם" },
              { label: `יתרת סגירה 31.12.${y2}`, value: S.y2.assetsClosing, kind: "balance" },
            ],
          },
        ],
      },
      {
        title: "עובדי ייצור: הוצאה בגובה ההפקדה",
        notes: [
          {
            title: "עובדים × השכר החודשי של השנה",
            text: "אין יתרה במאזן: כל הפקדה עוברת במזומן בסוף השנה. רושמים: חובה הוצאות שכר, זכות מזומן.",
            lines: q.years.map((y, k) => ({ label: `${y}`, calc: `${P.staff} × ${money(P.salary)} × ${b(P.raise)}^${y - P.hired}`, value: s.production.expense[k], unit: "₪" as const })),
          },
        ],
      },
      {
        title: "המנכ״ל: המענק",
        notes: [
          {
            title: "המענק הצפוי",
            text: `העלאה ראשונה ב-${C.hired + 1}, ואז ${T - 2} העלאות עד השנה האחרונה.`,
            lines: [
              { label: "שכר אחרון צפוי", calc: `${money(C.salary)} × ${b(C.firstRaise)} × ${b(C.raise)}^${T - 2}`, value: s.ceo.finalSalary, unit: "₪" },
              { label: "מענק מקורי", calc: `${pc(C.multiple)} × ${money(s.ceo.finalSalary)} × ${T}`, value: s.ceo.g1, unit: "₪" },
              { label: "מענק אחרי התיקון", calc: `${pc(C.newMultiple)} × ${money(s.ceo.finalSalary)} × ${T}`, value: s.ceo.g2, unit: "₪" },
              { label: "מענק לשנת עבודה, מקורי", calc: `${money(s.ceo.g1)} ÷ ${T}`, value: s.ceo.g1 / T, unit: "₪" },
              { label: "מענק לשנת עבודה, אחרי התיקון", calc: `${money(s.ceo.g2)} ÷ ${T}`, value: s.ceo.g2 / T, unit: "₪" },
            ],
          },
        ],
      },
      {
        ...pvGroup(
          `המנכ״ל: ${y1}`,
          [
            { title: `יתרת פתיחה 31.12.${y1 - 1} (שנה אחת)`, rows: [{ label: "פתיחה", amount: s.ceo.g1 / T, part: "1", n: T - 1, value: s.ceo.y1.opening }], o: { ...ceoO, rate: r0 } },
            { title: `עלות שירות שוטף ${y1} (ריבית תחילת השנה)`, rows: [{ label: "שירות", amount: s.ceo.g1 / T, part: "1", n: T - 2, value: s.ceo.y1.service }], o: { ...ceoO, rate: r0 } },
            { title: `יתרת סגירה 31.12.${y1} (שנתיים)`, rows: [{ label: "סגירה", amount: s.ceo.g1 / T, part: "2", n: T - 2, value: s.ceo.y1.closing }], o: { ...ceoO, rate: r1 } },
          ],
          `המענק נצבר בקו ישר על ${T} שנים: ${money(s.ceo.g1)} ÷ ${T} לכל שנה.`,
        ),
        notes: [
          {
            title: "ריבית, ומה שמאזן",
            lines: [
              { label: "ריבית", calc: `${money(s.ceo.y1.opening)} × ${pc(r0)}`, value: s.ceo.y1.interest, unit: "₪" },
              { label: "מדידה מחדש (מאזנת)", value: s.ceo.y1.pn, unit: "₪" },
            ],
          },
        ],
      },
      {
        ...pvGroup(
          `המנכ״ל: ${y2}, הערכים הנוכחיים`,
          [
            {
              title: `ההתחייבות ב-${endOf(m, y2)}, לפני התיקון ואחריו`,
              rows: [
                { label: "לפני", amount: s.ceo.g1 / T, part: yearsAs(s.ceo.e), n: T - s.ceo.e, value: s.ceo.before },
                { label: "אחרי", amount: s.ceo.g2 / T, part: yearsAs(s.ceo.e), n: T - s.ceo.e, value: s.ceo.after },
              ],
              o: { ...ceoO, rate: rM, total: false },
            },
            {
              title: `עלות שירות שוטף ${y2}, בשני חלקים`,
              rows: [
                { label: `עד השינוי (${m} חודשים)`, amount: s.ceo.g1 / T, part: `${m}/12`, n: T - s.ceo.e, rate: r1, value: s.ceo.sB },
                { label: `מהשינוי (${12 - m} חודשים)`, amount: s.ceo.g2 / T, part: `${12 - m}/12`, n: T - 3, rate: rM, value: s.ceo.sA },
              ],
              o: { ...ceoO, rate: r1 },
            },
            { title: `יתרת סגירה 31.12.${y2} (שלוש שנים)`, rows: [{ label: "סגירה", amount: s.ceo.g2 / T, part: "3", n: T - 3, value: s.ceo.y2.closing }], o: { ...ceoO, rate: r2 } },
          ],
          `עד יום השינוי עברו ${d2(s.ceo.e)} שנים, ונותרו ${d2(T - s.ceo.e)}. אחרי התיקון המענק לשנה ${money(s.ceo.g2)} ÷ ${T}.`,
        ),
        notes: [{ title: `שירות עבר ב-${endOf(m, y2)}`, lines: [{ label: "שירות עבר", calc: `${money(s.ceo.after)} − ${money(s.ceo.before)}`, value: s.ceo.y2.past, unit: "₪" }] }],
      },
      {
        title: `המנכ״ל: ${y2}, עם התיקון`,
        notes: [
          {
            title: "ריבית, בשני חלקים",
            lines: [
              { label: `על הפתיחה, ${m} חודשים`, calc: `${money(s.ceo.y1.closing)} × (${b(r1)}^(${m}/12) − 1)`, value: s.ceo.iB, unit: "₪" },
              { label: `על ההתחייבות אחרי התיקון, ${12 - m} חודשים`, calc: `${money(s.ceo.after)} × (${b(rM)}^(${12 - m}/12) − 1)`, value: s.ceo.iA, unit: "₪" },
            ],
          },
          { title: "המדידה מחדש", lines: [{ label: "מדידה מחדש (מאזנת)", value: s.ceo.y2.pn, unit: "₪" }] },
        ],
        rolls: [
          {
            title: `מצנח הזהב, ${y2}`,
            rows: [
              { label: `יתרת פתיחה 31.12.${y1}`, value: s.ceo.y2.opening, kind: "balance" },
              { label: "עלות שירות עבר", value: s.ceo.y2.past },
              { label: "עלות שירות שוטף", value: s.ceo.y2.service },
              { label: "עלות ריבית", value: s.ceo.y2.interest },
              { label: "מדידה מחדש", value: s.ceo.y2.pn, kind: "pn" },
              { label: `יתרת סגירה 31.12.${y2}`, value: s.ceo.y2.closing, kind: "balance" },
            ],
          },
        ],
      },
      {
        title: "ההצגה בדוחות",
        tables: [
          {
            title: "המאזן",
            head: ["", `31.12.${y1}`, `31.12.${y2}`],
            rows: [
              ["התחייבות (מכירות + מנכ״ל)", money(s.statements[0].liability), money(s.statements[1].liability)],
              ["נכסי התכנית", `(${money(s.statements[0].assets)})`, `(${money(s.statements[1].assets)})`],
              ["התחייבות נטו", money(s.statements[0].net), money(s.statements[1].net)],
            ],
          },
          {
            title: "הרווח הכולל (הוצאה חיובית, רווח בסוגריים)",
            head: ["", String(y1), String(y2)],
            rows: [
              ["עלות המכר: עובדי ייצור", money(s.statements[0].cogs), money(s.statements[1].cogs)],
              ["הוצאות מכירה: עובדי מכירות", money(s.statements[0].selling), money(s.statements[1].selling)],
              ["הוצאות הנהלה: המנכ״ל (שירות + עבר)", money(s.statements[0].admin), money(s.statements[1].admin)],
              ["מימון נטו", money(s.statements[0].finance), money(s.statements[1].finance)],
              ["OCI: מדידה מחדש (הפסד חיובי)", money(s.statements[0].oci), money(s.statements[1].oci)],
            ],
          },
        ],
        text: ["מימון נטו = ריבית על המחויבות של המכירות − הכנסות ריבית על הנכסים + ריבית על מצנח הזהב. OCI = שלוש המדידות מחדש."],
      },
    ],
  };
}

// ===========================================================================
// 6. Grants in two departments: one that jumps after five years (straight line, to a cap) with a grant added mid-year, and one earned by service or by age.

export type ProdGroup = { heads: number; hired: number; ends: number };
export type MktGroup = { heads: number; age: number; ageTo?: number; hired: number; ends: number; leave?: number };
export type TieredInput = {
  company: string;
  founded: number;
  /** The two years asked about. */
  years: [number, number];
  prod: { low: number; first: number; next: number; cap: number; groups: ProdGroup[]; extra: number; extraAfter: number; month: number };
  mkt: { grant: number; years: number; age: number; groups: MktGroup[] };
  rate: number;
  rateDec: number;
};

/** The production grant for a total stay of T years, and the years it is spread over. */
export function prodGrant(p: TieredInput["prod"], T: number) {
  if (T <= 5) return { grant: p.low * T, window: T, perYear: p.low };
  const toCap = 5 + Math.ceil((p.cap - p.first * 5) / p.next);
  const grant = Math.min(p.cap, p.first * 5 + p.next * (T - 5));
  const window = Math.min(T, toCap);
  return { grant, window, perYear: grant / window };
}

export function solveTiered(q: TieredInput) {
  const [y1] = q.years;
  const r = q.rate;
  const P = q.prod;
  const m = P.month;
  const prod = P.groups.map((g) => {
    const T = g.ends - g.hired + 1;
    const pg = prodGrant(P, T);
    const extra = T > P.extraAfter ? P.extra / P.extraAfter : 0;
    const accrued = (served: number, withExtra: boolean) => pg.perYear * Math.min(served, pg.window) + (withExtra ? extra * Math.min(served, P.extraAfter) : 0);
    const s0 = y1 - g.hired;
    const n0 = T - s0;
    const opening = (g.heads * accrued(s0, false)) / (1 + r) ** n0;
    const interest1 = opening * r;
    const close1 = (g.heads * accrued(s0 + 1, false)) / (1 + r) ** (n0 - 1);
    const service1 = close1 - opening - interest1;
    // The second year: three months on the old terms, past service on the amendment date, nine months on the new terms.
    const n1 = n0 - 1;
    const old1 = accrued(s0 + 1 + m / 12, false) - accrued(s0 + 1, false);
    const sBefore = (g.heads * old1) / (1 + r) ** (n1 - m / 12);
    const new1 = accrued(s0 + 2, true) - accrued(s0 + 1 + m / 12, true);
    const sAfter = (g.heads * new1) / (1 + r) ** (n1 - 1);
    const sA = s0 + 1 + m / 12;
    const before = (g.heads * accrued(sA, false)) / (1 + r) ** (n1 - m / 12);
    const after = (g.heads * accrued(sA, true)) / (1 + r) ** (n1 - m / 12);
    const close2 = (g.heads * accrued(s0 + 2, true)) / (1 + q.rateDec) ** (n1 - 1);
    return { T, ...pg, extra, s0, n0, opening, interest1, close1, service1, sBefore, sAfter, sA, before, after, close2 };
  });
  const t = (k: keyof (typeof prod)[number]) => sum(prod.map((g) => g[k] as number));
  const p1 = { opening: t("opening"), interest: t("interest1"), service: t("service1"), past: 0, pn: 0, closing: t("close1") };
  const pBefore = t("before");
  const pAfter = t("after");
  const p2 = {
    opening: p1.closing,
    interest: p1.closing * ((1 + r) ** (m / 12) - 1) + pAfter * ((1 + r) ** ((12 - m) / 12) - 1),
    service: t("sBefore") + t("sAfter"),
    past: pAfter - pBefore,
    pn: 0,
    closing: t("close2"),
  };
  p2.pn = p2.closing - p2.opening - p2.interest - p2.service - p2.past;
  const M = q.mkt;
  const mkt = M.groups.map((g) => {
    const T = g.ends - g.hired + 1;
    const ageEnd = (g.ageTo ?? g.age) + T;
    const byService = T > M.years ? M.years : Infinity;
    const byAge = ageEnd > M.age ? M.age - (g.ageTo ?? g.age) : Infinity;
    const window = Math.min(byService, byAge);
    const eligible = Number.isFinite(window);
    const perYear = eligible ? M.grant / window : 0;
    const s0 = y1 - g.hired;
    const n0 = T - s0;
    const ob = (heads: number, served: number, i: number, n: number) => (heads * perYear * Math.min(served, window)) / (1 + i) ** n;
    const opening = ob(g.heads, s0, r, n0);
    const close1 = ob(g.heads, s0 + 1, r, n0 - 1);
    const service1 = (g.heads * perYear) / (1 + r) ** (n0 - 1);
    const service2 = (g.heads * perYear) / (1 + r) ** (n0 - 2);
    const close2 = ob(g.heads - (g.leave ?? 0), s0 + 2, q.rateDec, n0 - 2);
    return { T, ageEnd, window, eligible, perYear, route: !eligible ? "none" : byService <= byAge ? "service" : "age", s0, n0, opening, close1, service1, service2, close2 };
  });
  const u = (k: "opening" | "close1" | "service1" | "service2" | "close2") => sum(mkt.map((g) => g[k]));
  const k1 = { opening: u("opening"), interest: u("opening") * r, service: u("service1"), past: 0, pn: 0, closing: u("close1") };
  k1.pn = k1.closing - k1.opening - k1.interest - k1.service;
  const k2 = { opening: k1.closing, interest: k1.closing * r, service: u("service2"), past: 0, pn: 0, closing: u("close2") };
  k2.pn = k2.closing - k2.opening - k2.interest - k2.service;
  return { prod, p1, p2, pBefore, pAfter, mkt, k1, k2 };
}

const fullRoll = (title: string, y: number, l: { opening: number; interest: number; service: number; past: number; pn: number; closing: number }, pnTo = "OCI"): BkRoll => ({
  title,
  pnTo,
  rows: [
    { label: `יתרת פתיחה 1.1.${y}`, value: l.opening, kind: "balance" },
    { label: "עלות ריבית", value: l.interest },
    { label: "עלות שירות שוטף", value: l.service },
    ...(l.past ? [{ label: "עלות שירות עבר", value: l.past }] : []),
    { label: "מדידה מחדש", value: l.pn, kind: "pn" as const },
    { label: `יתרת סגירה 31.12.${y}`, value: l.closing, kind: "balance" },
  ],
});

export function tieredQuestion(id: string, title: string, q: TieredInput): BkQuestion {
  const s = solveTiered(q);
  const [y1, y2] = q.years;
  const P = q.prod;
  const M = q.mkt;
  const r = q.rate;
  const m = P.month;
  const toCap = 5 + Math.ceil((P.cap - P.first * 5) / P.next);
  const grp = (g: { hired: number; ends: number }) => `${g.hired}–${g.ends}`;
  const prodO = { rate: r, label: "תקופה", amount: "לשנה", part: "שנים", amountDec: 2 };
  type MktG = (typeof s.mkt)[number];
  // The months before the amendment, as the next table writes its months: "3/12".
  const monthsAs = (x: number) => (x === m / 12 ? `${m}/12` : yearsAs(x));
  const mktRows = s.mkt.map((g, i) => ({ g, h: M.groups[i] })).filter(({ g }) => g.eligible);
  return {
    id,
    title,
    point: "מענק שגדל מהותית בשנים המאוחרות מייחסים בקו ישר עד שהתקרה מושגת (סעיף 73). מענק שאפשר לזכות בו בשתי דרכים מייחסים לפי הדרך שבה העובד יזכה.",
    facts: [
      `חברת ״${q.company}״ הוקמה ב-1.1.${q.founded}. לפי ההסכמים, עובד שמסיים לעבוד מקבל מענק לפי מחלקתו.`,
      `מחלקת ייצור: עד 5 שנות ותק, ${money(P.low)} ₪ לכל שנה. מעל 5 שנים, ${money(P.first)} ₪ לכל אחת מ-5 השנים הראשונות ו-${money(P.next)} ₪ לכל שנה נוספת, עד ${money(P.cap)} ₪ (טבלה 1).`,
      `ב-1.${m + 1}.${y2} הוחלט שמי שיעבוד בייצור מעל ${P.extraAfter} שנים יקבל, נוסף על כך, מענק חד פעמי של ${money(P.extra)} ₪.`,
      `מחלקת שיווק: מענק של ${money(M.grant)} ₪ למי שעבד ברציפות מעל ${M.years} שנה, או למי שסיים לעבוד אחרי גיל ${M.age} (טבלה 2).`,
      ...M.groups.filter((g) => g.leave).map((g) => `(*) במהלך ${y2} עזבו באופן בלתי צפוי ${g.leave} מתוך ${g.heads} העובדים המסומנים, בלי לקבל מענק. לגבי השאר הצפי לא השתנה.`),
      `שיעור ההיוון: תשואת אג״ח קונצרניות איכותיות, ${pc(r)} ב-${y1}–${y2}. בדצמבר ${y2} הוא ירד ל-${pc(q.rateDec)}.`,
    ],
    tables: [
      { title: `טבלה 1: עובדי ייצור (אותם נתונים ב-1.1.${y1}, ב-31.12.${y1} וב-31.12.${y2})`, head: ["עובדים", "תחילת עבודה", "צפי לסיום"], rows: P.groups.map((g) => [g.heads, `1.1.${g.hired}`, `31.12.${g.ends}`]) },
      {
        title: "טבלה 2: עובדי שיווק",
        head: ["עובדים", "גיל בתחילת העבודה", "תחילת עבודה", "צפי לסיום"],
        rows: M.groups.map((g) => [g.leave ? `${g.heads} (*)` : g.heads, g.ageTo ? `${g.age}–${g.ageTo}` : `${g.age} בדיוק`, `1.1.${g.hired}`, `31.12.${g.ends}`]),
      },
    ],
    required: [`תנועה מפורטת בהתחייבות למענקים בשנים ${y1}–${y2}, לכל מחלקה בנפרד.`],
    checks: [
      { label: `ייצור: יתרת פתיחה 1.1.${y1}`, value: s.p1.opening },
      { label: `ייצור: עלות שירות עבר ${y2}`, value: s.p2.past },
      { label: `ייצור: יתרת סגירה 31.12.${y2}`, value: s.p2.closing },
      { label: `שיווק: יתרת סגירה 31.12.${y2}`, value: s.k2.closing },
    ],
    steps: [
      {
        title: "ייצור: כמה מענק, ועל פני כמה שנים",
        text: [
          `מעל 5 שנים כל שנה נוספת שווה ${money(P.next)} במקום ${money(P.first)}: ההטבה גדלה מהותית בשנים המאוחרות, ולכן מייחסים בקו ישר (סעיף 73).`,
          `התקרה מושגת אחרי ${toCap} שנים: ${money(P.first)} × 5 + ${money(P.next)} × ${toCap - 5} = ${money(P.cap)}. לכן מי שעובד יותר, הקו הישר נפרש על ${toCap} שנים בלבד.`,
        ],
        tables: [
          {
            head: ["עובדים", "שנים צפויות", "מענק", "נפרס על", "לשנה"],
            rows: s.prod.map((g, i) => [P.groups[i].heads, g.T, money(g.grant), g.window, d2(g.perYear)]),
          },
        ],
      },
      pvTable(
        `ייצור: יתרת פתיחה 1.1.${y1}`,
        s.prod.map((g, i) => ({ label: grp(P.groups[i]), heads: P.groups[i].heads, amount: g.perYear, part: `${Math.min(g.s0, g.window)}`, n: g.n0, value: g.opening })),
        { ...prodO, why: "השנים שנצברו עד היום (לא יותר מהשנים שעליהן המענק נפרס), מהוונות עד סוף העבודה." },
      ),
      {
        ...pvTable(
          `ייצור: יתרת סגירה 31.12.${y1}`,
          s.prod.map((g, i) => ({ label: grp(P.groups[i]), heads: P.groups[i].heads, amount: g.perYear, part: `${Math.min(g.s0 + 1, g.window)}`, n: g.n0 - 1, value: g.close1 })),
          { ...prodO, why: "שנה נוספת נצברה, ושנה אחת פחות להיוון." },
        ),
        notes: [
          {
            title: `התנועה ב-${y1}`,
            lines: [
              { label: "ריבית", calc: `${money(s.p1.opening)} × ${pc(r)}`, value: s.p1.interest, unit: "₪" },
              { label: "שירות שוטף: מה שמשלים (אין שינוי בהנחות)", calc: `${money(s.p1.closing)} − ${money(s.p1.opening)} − ${money(s.p1.interest)}`, value: s.p1.service, unit: "₪" },
            ],
          },
        ],
        rolls: [fullRoll(`ייצור, ${y1}`, y1, s.p1)],
      },
      pvTable(
        `ייצור: שירות שוטף ${y2} עד השינוי (${m} חודשים)`,
        s.prod.map((g, i) => ({ label: grp(P.groups[i]), heads: P.groups[i].heads, amount: g.perYear, part: monthsAs(Math.min(g.s0 + 1 + m / 12, g.window) - Math.min(g.s0 + 1, g.window)), n: g.n0 - 1 - m / 12, value: g.sBefore })),
        { ...prodO, why: `${m} חודשים בתנאים הישנים, מהוונים מיום השינוי.` },
      ),
      pvTable(
        `ייצור: שירות שוטף ${y2} מהשינוי (${12 - m} חודשים)`,
        s.prod.map((g, i) => ({ label: grp(P.groups[i]), heads: P.groups[i].heads, amount: g.perYear + g.extra, part: `${12 - m}/12`, n: g.n0 - 2, value: g.sAfter })),
        {
          ...prodO,
          amount: "לשנה, עם התוספת",
          why: [
            `המענק הנוסף נצבר על פני ${P.extraAfter} שנים: ${money(P.extra)} ÷ ${P.extraAfter} = ${d2(P.extra / P.extraAfter)} לשנה, רק למי שצפוי לעבוד מעל ${P.extraAfter} שנים.`,
            `${12 - m} חודשים בתנאים החדשים, מהוונים מסוף השנה.`,
          ],
        },
      ),
      {
        ...pvTable(
          `ייצור: שירות עבר ב-1.${m + 1}.${y2}`,
          s.prod
            .map((g, i) => ({ g, h: P.groups[i] }))
            .filter(({ g }) => g.extra > 0)
            .map(({ g, h }) => ({ label: grp(h), heads: h.heads, amount: g.extra, part: yearsAs(Math.min(g.sA, P.extraAfter)), n: g.n0 - 1 - m / 12, value: g.after - g.before })),
          { ...prodO, amount: "תוספת לשנה", why: "ההתחייבות אחרי התיקון פחות לפניו היא התוספת על השנים שכבר עבדו. רק מי שצפוי לעבוד מעל " + P.extraAfter + " שנים מקבל אותה." },
        ),
        notes: [
          {
            title: "ריבית",
            lines: [
              { label: `על הפתיחה, ${m} חודשים`, calc: `${money(s.p1.closing)} × (${b(r)}^(${m}/12) − 1)`, value: s.p1.closing * ((1 + r) ** (m / 12) - 1), unit: "₪" },
              { label: `על ההתחייבות החדשה, ${12 - m} חודשים`, calc: `${money(s.pAfter)} × (${b(r)}^(${12 - m}/12) − 1)`, value: s.pAfter * ((1 + r) ** ((12 - m) / 12) - 1), unit: "₪" },
            ],
          },
        ],
      },
      {
        ...pvTable(
          `ייצור: יתרת סגירה 31.12.${y2}, בריבית החדשה`,
          s.prod.map((g, i) => ({ label: grp(P.groups[i]), heads: P.groups[i].heads, amount: g.perYear + g.extra, part: `${g.s0 + 2}`, n: g.n0 - 2, value: g.close2 })),
          { ...prodO, rate: q.rateDec, amount: "לשנה, עם התוספת" },
        ),
        rolls: [fullRoll(`ייצור, ${y2}`, y2, s.p2)],
      },
      {
        title: "שיווק: מי זכאי, ובאיזו דרך",
        text: ["מייחסים לפי הדרך שבה העובד יזכה במענק: לפי הוותק, או לפי הגיל."],
        tables: [
          {
            head: ["עובדים", "שנים", "גיל בסיום", "זכאות", "נפרס על", "לשנה"],
            rows: s.mkt.map((g, i) => [
              M.groups[i].heads,
              g.T,
              nf(g.ageEnd),
              g.route === "service" ? `ותק מעל ${M.years}` : g.route === "age" ? `גיל מעל ${M.age}` : "לא זכאים",
              g.eligible ? g.window : "—",
              g.eligible ? d2(g.perYear) : "—",
            ]),
          },
        ],
      },
      ...(
        [
          [`שיווק: יתרת פתיחה 1.1.${y1}`, (g: MktG) => g.s0, (g: MktG) => g.n0, "opening", false],
          [`שיווק: שירות שוטף ${y1}`, () => 1, (g: MktG) => g.n0 - 1, "service1", false],
          [`שיווק: יתרת סגירה 31.12.${y1}`, (g: MktG) => g.s0 + 1, (g: MktG) => g.n0 - 1, "close1", false],
          [`שיווק: שירות שוטף ${y2}`, () => 1, (g: MktG) => g.n0 - 2, "service2", false],
          [`שיווק: יתרת סגירה 31.12.${y2}, בריבית החדשה`, (g: MktG) => g.s0 + 2, (g: MktG) => g.n0 - 2, "close2", true],
        ] as const
      ).map(([t, served, n, k, last]) =>
        pvTable(
          t,
          mktRows.map(({ g, h }) => ({
            label: grp(h),
            heads: last ? h.heads - (h.leave ?? 0) : h.heads,
            amount: g.perYear,
            part: `${Math.min(served(g), g.window)}`,
            n: n(g),
            value: g[k],
          })),
          { ...prodO, rate: last ? q.rateDec : r, why: last ? (M.groups.some((h) => h.leave) ? "בלי העובדים שעזבו." : undefined) : k === "opening" ? "אותה נוסחה, רק לזכאים." : undefined },
        ),
      ),
      {
        title: `שיווק: התנועה ב-${y1} וב-${y2}`,
        text: [
          `ריבית ${y1}: ${money(s.k1.opening)} × ${pc(r)} = ${money(s.k1.interest)} ₪`,
          `ריבית ${y2}: ${money(s.k2.opening)} × ${pc(r)} = ${money(s.k2.interest)} ₪`,
          `ב-${y2} המדידה מחדש נובעת משני דברים: עובדים שעזבו, וירידת הריבית בדצמבר.`,
        ],
        rolls: [fullRoll(`שיווק, ${y1}`, y1, s.k1), fullRoll(`שיווק, ${y2}`, y2, s.k2)],
      },
    ],
  };
}

// ===========================================================================
// 7. Three short cases: a lump sum after ten years raised mid-year (with plan assets), a settlement, and a tiered grant measured at one date.

export type LumpInput = {
  hired: number;
  age: number;
  retireAge: number;
  window: number;
  grant: number;
  newGrant: number;
  rates: [number, number, number, number];
  deposit1: number;
  fv1: number;
  deposit2: number;
  fv2: number;
};

export function solveLump(q: LumpInput) {
  const T = q.retireAge - q.age;
  const W = q.window;
  const [rA, rB, rM, rC] = q.rates;
  const y0 = { service: (q.grant / W) / (1 + rA) ** (T - 1) };
  const c0 = y0.service;
  const y1 = { opening: c0, interest: c0 * rA, service: (q.grant / W) / (1 + rA) ** (T - 2), closing: ((q.grant * 2) / W) / (1 + rB) ** (T - 2), pn: 0 };
  y1.pn = y1.closing - y1.opening - y1.interest - y1.service;
  const before = ((q.grant * 2.5) / W) / (1 + rM) ** (T - 2.5);
  const after = ((q.newGrant * 2.5) / W) / (1 + rM) ** (T - 2.5);
  const iB = y1.closing * ((1 + rB) ** 0.5 - 1);
  const iA = after * ((1 + rM) ** 0.5 - 1);
  const sB = ((q.grant * 0.5) / W) / (1 + rB) ** (T - 2.5);
  const sA = ((q.newGrant * 0.5) / W) / (1 + rM) ** (T - 3);
  const y2 = { opening: y1.closing, past: after - before, interest: iB + iA, service: sB + sA, closing: ((q.newGrant * 3) / W) / (1 + rC) ** (T - 3), pn: 0 };
  y2.pn = y2.closing - y2.opening - y2.past - y2.interest - y2.service;
  const a1 = { deposit: q.deposit1, interest: q.deposit1 * rA, closing: q.fv1, pn: q.fv1 - q.deposit1 - q.deposit1 * rA };
  // Split at the amendment like the obligation: the opening at the opening rate to 30.6, then opening and the 1.7 deposit at the 30.6 rate.
  const a2Before = q.fv1 * ((1 + rB) ** 0.5 - 1);
  const a2After = (q.fv1 + q.deposit2) * ((1 + rM) ** 0.5 - 1);
  const a2Interest = a2Before + a2After;
  const a2 = { opening: q.fv1, deposit: q.deposit2, interest: a2Interest, closing: q.fv2, pn: q.fv2 - q.fv1 - q.deposit2 - a2Interest };
  return { T, y0, y1, before, after, iB, iA, sB, sA, y2, a1, a2, a2Before, a2After };
}

export type SettleInput = { hired: number; salary: number; raise: number; share: number; rate: number; newRate: number; expected: [number, number]; pay: number };

export function solveSettle(q: SettleInput) {
  const [T1, T2] = q.expected;
  const g1 = q.salary * (1 + q.raise) ** (T1 - 1) * q.share * T1;
  const g2 = q.salary * (1 + q.raise) ** (T2 - 1) * q.share * T2;
  const opening = ((g1 * 2) / T1) / (1 + q.rate) ** (T1 - 2);
  const interest = opening * q.rate;
  const service = (g1 / T1) / (1 + q.rate) ** (T1 - 3);
  const closing = ((g2 * 3) / T2) / (1 + q.newRate) ** (T2 - 3);
  const pn = closing - opening - interest - service;
  return { g1, g2, opening, interest, service, closing, pn, loss: q.pay - closing };
}

export type TierGrantInput = { salary: number; raise: number; served: number; remaining: number; low: number; high: number; threshold: number; rate: number; year: number };

export function solveTierGrant(q: TierGrantInput) {
  const total = q.served + q.remaining;
  const raises = Math.ceil(q.remaining);
  const final = q.salary * (1 + q.raise) ** raises;
  const grant = final * (q.low * Math.min(q.threshold, total) + q.high * Math.max(0, total - q.threshold));
  const provision = ((grant * q.served) / total) / (1 + q.rate) ** q.remaining;
  return { total, raises, final, grant, provision };
}

export type LumpSettleInput = { lump: LumpInput & { company: string }; settle: SettleInput & { company: string } };

export function casesQuestion(id: string, title: string, q: LumpSettleInput): BkQuestion {
  const L = solveLump(q.lump);
  const S = solveSettle(q.settle);
  const l = q.lump;
  const [rA, rB, rM, rC] = l.rates;
  const y = l.hired;
  const W = l.window;
  const T = L.T;
  const st = q.settle;
  const [E1, E2] = st.expected;
  const lumpO = { rate: rA, label: "מדידה", amount: "מענק", rateCol: true };
  const settleO = { rate: st.rate, label: "מדידה", amount: "מענק", rateCol: true, amountDec: 2, valueDec: 2 };
  return {
    id,
    title,
    point: "שלושה אירועים שנראים דומים ומטופלים אחרת: תיקון תוכנית הוא שירות עבר (רווח והפסד), סילוק שלא היה בתנאים הוא רווח או הפסד מסילוק, ופרישה לפי התנאים בסכום אחר מהצפי היא מדידה מחדש (OCI).",
    facts: [
      `מקרה א׳, חברת ״${l.company}״: עובד שעבד בחברה ${W} שנים או יותר יקבל בפרישה מענק חד פעמי של ${money(l.grant)} ₪. העובד היחיד בחברה התחיל לעבוד ב-1.1.${y} בגיל ${l.age} בדיוק, וצפוי לפרוש בגיל ${l.retireAge}.`,
      `ב-30.6.${y + 2} הוחלט להעלות את המענק ל-${money(l.newGrant)} ₪. ב-1.1.${y + 1} נפתחה תוכנית לכיסוי המחויבות (נכסי תכנית) והופקדו ${money(l.deposit1)} ₪. בסוף ${y + 1} השווי ירד ל-${money(l.fv1)} ₪. ב-1.7.${y + 2} הופקדו ${money(l.deposit2)} ₪, ובסוף ${y + 2} השווי ${money(l.fv2)} ₪. השווי ההוגן של הנכסים ב-30.6.${y + 2} שווה ליתרתם בספרים.`,
      `ריבית להיוון: ${pc(rA)} ב-31.12.${y}, ${pc(rB)} ב-31.12.${y + 1}, ${pc(rM)} ב-30.6.${y + 2}, ${pc(rC)} ב-31.12.${y + 2}.`,
      `מקרה ב׳, חברת ״${st.company}״: בסיום העבודה העובד מקבל ${pc(st.share)} מהשכר החודשי האחרון לכל שנת שירות. עובד התחיל ב-1.1.${st.hired} בשכר ${money(st.salary)} ₪, שעולה ב-${pc(st.raise)} בכל 1.1. ריבית ההיוון ${pc(st.rate)}, ובסוף השנה השלישית ירדה ל-${pc(st.newRate)}.`,
      `ב-31.12.${st.hired + 1} הצפי היה שהעובד יעבוד ${st.expected[0]} שנים בסך הכול. ב-31.12.${st.hired + 2} הצפי עלה ל-${st.expected[1]} שנים. ב-1.1.${st.hired + 3} הגיעה החברה להסכם עם העובד, שלא היה חלק מהתנאים: שולמו לו ${money(st.pay)} ₪ והתוכנית בוטלה, בזמן שהוא ממשיך לעבוד.`,
    ],
    tables: [],
    required: [
      `מקרה א׳: תנועה בהפרשה ובנכסי התכנית לשנים ${y}–${y + 2}.`,
      `מקרה ב׳: תנועה בהפרשה לשנת ${st.hired + 2}, והטיפול ב-1.1.${st.hired + 3}. מה היה משתנה אילו העובד היה פורש באותו יום?`,
    ],
    checks: [
      { label: `א׳: עלות שירות עבר ${y + 2}`, value: L.y2.past },
      { label: `א׳: הפרשה 31.12.${y + 2}`, value: L.y2.closing },
      { label: `ב׳: הפסד מסילוק`, value: S.loss },
    ],
    steps: [
      {
        ...pvGroup(
          `מקרה א׳: ${y} ו-${y + 1}`,
          [
            { title: `שירות ${y} = יתרת סגירה ${y}`, rows: [{ label: `31.12.${y}`, amount: l.grant, part: `1/${W}`, n: T - 1, rate: rA, value: L.y0.service }], o: lumpO },
            { title: `שירות שוטף ${y + 1}`, rows: [{ label: `שירות ${y + 1}`, amount: l.grant, part: `1/${W}`, n: T - 2, rate: rA, value: L.y1.service }], o: lumpO },
            { title: `יתרת סגירה ${y + 1}`, rows: [{ label: `31.12.${y + 1}`, amount: l.grant, part: `2/${W}`, n: T - 2, rate: rB, value: L.y1.closing }], o: lumpO },
          ],
          `המענק נצבר ב-${W} השנים הראשונות: ${money(l.grant)} ÷ ${W} לשנה. עד הפרישה ${T} שנים.`,
        ),
        notes: [
          {
            title: `ריבית, ומה שמאזן ב-${y + 1}`,
            lines: [
              { label: `ריבית ${y + 1}`, calc: `${money(L.y1.opening)} × ${pc(rA)}`, value: L.y1.interest, unit: "₪" },
              { label: "מדידה מחדש", value: L.y1.pn, unit: "₪" },
            ],
          },
        ],
      },
      {
        ...pvGroup(`מקרה א׳: ${y + 2}, המענק עולה`, [
          {
            title: "ההתחייבות ב-30.6, אחרי 2.5 שנים: לפני ואחרי",
            rows: [
              { label: "לפני", amount: l.grant, part: `2.5/${W}`, n: T - 2.5, rate: rM, value: L.before },
              { label: "אחרי", amount: l.newGrant, part: `2.5/${W}`, n: T - 2.5, rate: rM, value: L.after },
            ],
            o: { ...lumpO, total: false },
          },
          {
            title: "שירות שוטף, חצי שנה לפני וחצי אחרי",
            rows: [
              { label: "עד 30.6", amount: l.grant, part: `0.5/${W}`, n: T - 2.5, rate: rB, value: L.sB },
              { label: "מ-30.6", amount: l.newGrant, part: `0.5/${W}`, n: T - 3, rate: rM, value: L.sA },
            ],
            o: lumpO,
          },
          { title: `יתרת סגירה ${y + 2}`, rows: [{ label: `31.12.${y + 2}`, amount: l.newGrant, part: `3/${W}`, n: T - 3, rate: rC, value: L.y2.closing }], o: lumpO },
        ]),
        notes: [
          { title: "שירות עבר ב-30.6: אחרי פחות לפני", lines: [{ label: "שירות עבר", calc: `${money(L.after)} − ${money(L.before)}`, value: L.y2.past, unit: "₪" }] },
          {
            title: "ריבית, חצי שנה לפני וחצי אחרי",
            lines: [
              { label: "ריבית עד 30.6", calc: `${money(L.y1.closing)} × (${b(rB)}^0.5 − 1)`, value: L.iB, unit: "₪" },
              { label: "ריבית מ-30.6", calc: `${money(L.after)} × (${b(rM)}^0.5 − 1)`, value: L.iA, unit: "₪" },
            ],
          },
        ],
        rolls: [
          {
            title: `הפרשה, ${y + 2}`,
            rows: [
              { label: `יתרת פתיחה 31.12.${y + 1}`, value: L.y2.opening, kind: "balance" },
              { label: "עלות שירות עבר 30.6", value: L.y2.past },
              { label: "עלות ריבית", value: L.y2.interest },
              { label: "עלות שירות שוטף", value: L.y2.service },
              { label: "מדידה מחדש", value: L.y2.pn, kind: "pn" },
              { label: `יתרת סגירה 31.12.${y + 2}`, value: L.y2.closing, kind: "balance" },
            ],
          },
        ],
      },
      {
        title: "מקרה א׳: נכסי התכנית",
        notes: [
          {
            title: "הכנסות ריבית לפי שיעור ההיוון, וההפרש למדידה מחדש",
            lines: [
              { label: `ריבית ${y + 1}`, calc: `${money(l.deposit1)} × ${pc(rA)}`, value: L.a1.interest, unit: "₪" },
              { label: `מדידה מחדש ${y + 1}`, calc: `${money(l.fv1)} − ${money(l.deposit1)} − ${d2(L.a1.interest)}`, value: L.a1.pn, unit: "₪" },
              { label: `ריבית עד 30.6.${y + 2}`, calc: `${money(l.fv1)} × (${b(rB)}^0.5 − 1)`, value: L.a2Before, unit: "₪" },
              { label: `ריבית מ-1.7.${y + 2}`, calc: `(${money(l.fv1)} + ${money(l.deposit2)}) × (${b(rM)}^0.5 − 1)`, value: L.a2After, unit: "₪" },
              { label: `ריבית ${y + 2}`, calc: `${d2(L.a2Before)} + ${d2(L.a2After)} — מפוצלת כמו ההתחייבות`, value: L.a2.interest, unit: "₪" },
              { label: `מדידה מחדש ${y + 2}`, calc: `${money(l.fv2)} − ${money(l.fv1)} − ${money(l.deposit2)} − ${d2(L.a2.interest)}`, value: L.a2.pn, unit: "₪" },
            ],
          },
        ],
      },
      {
        title: "מקרה ב׳: סילוק",
        notes: [
          {
            title: "המענק הצפוי לפי כל צפי",
            lines: [
              { label: `צפי ${st.expected[0]} שנים`, calc: `${money(st.salary)} × ${b(st.raise)}^${st.expected[0] - 1} × ${pc(st.share)} × ${st.expected[0]}`, value: S.g1, unit: "₪" },
              { label: `צפי ${st.expected[1]} שנים`, calc: `${money(st.salary)} × ${b(st.raise)}^${st.expected[1] - 1} × ${pc(st.share)} × ${st.expected[1]}`, value: S.g2, unit: "₪" },
            ],
          },
        ],
      },
      {
        ...pvGroup(`מקרה ב׳: התנועה ב-${st.hired + 2}`, [
          { title: `יתרת פתיחה 31.12.${st.hired + 1}`, rows: [{ label: `צפי ${E1} שנים`, amount: S.g1, part: `2/${E1}`, n: E1 - 2, rate: st.rate, value: S.opening }], o: settleO },
          { title: `שירות שוטף ${st.hired + 2}`, rows: [{ label: `צפי ${E1} שנים`, amount: S.g1, part: `1/${E1}`, n: E1 - 3, rate: st.rate, value: S.service }], o: settleO },
          { title: `יתרת סגירה 31.12.${st.hired + 2}`, rows: [{ label: `צפי ${E2} שנים`, amount: S.g2, part: `3/${E2}`, n: E2 - 3, rate: st.newRate, value: S.closing }], o: settleO },
        ]),
        notes: [
          {
            title: "ריבית, ומה שמאזן",
            lines: [
              { label: "ריבית", calc: `${d2(S.opening)} × ${pc(st.rate)}`, value: S.interest, unit: "₪" },
              { label: "מדידה מחדש (OCI)", value: S.pn, unit: "₪" },
            ],
          },
          {
            title: `1.1.${st.hired + 3}: התשלום מבטל את המחויבות`,
            lines: [
              { label: "שולם פחות היתרה = הפסד מסילוק (רווח והפסד)", calc: `${money(st.pay)} − ${d2(S.closing)}`, value: S.loss, unit: "₪" },
              { label: "אילו פרש באותו יום", text: "פרישה היא חלק מתנאי התוכנית. ההפרש היה טעות בצפי, ולכן מדידה מחדש ב-OCI ולא הפסד מסילוק." },
            ],
          },
        ],
      },
    ],
  };
}

export function tierQuestion(id: string, title: string, t: TierGrantInput & { company: string }): BkQuestion {
  const C = solveTierGrant(t);
  return {
    id,
    title,
    point: "מודדים בחמישה צעדים: המענק בשכר הצפוי בפרישה, החלק שנצבר עד היום, והיוון לפי השנים עד התשלום. הנוסחה שקופצת אחרי 10 שנים קובעת את גובה המענק, לא את מספר השנים שנצברו.",
    facts: [
      `חברת ״${t.company}״ משלמת ״מענק התמדה״ לעובדים שפורשים אחרי לפחות 5 שנות עבודה. פחות מ-5 שנים: אין מענק.`,
      `5 עד 10 שנים: ${pc(t.low)} מהשכר האחרון לכל שנת ותק, כולל חלק משנה. לדוגמה, שכר 10,000 ₪ ו-5.5 שנים: ${pc(t.low)} × 5.5 × 10,000.`,
      `10 שנים או יותר: ${pc(t.low)} לכל שנה עד 10 שנים, ו-${pc(t.high)} לכל שנה מעל 10. לדוגמה, שכר 10,000 ₪ ו-11.5 שנים: (${pc(t.low)} × 10 + ${pc(t.high)} × 1.5) × 10,000.`,
      `בסוף ${t.year} שכרו של העובד ${money(t.salary)} ₪, והוא עובד בחברה ${t.served} שנים בדיוק. החברה צופה שיעבוד עוד ${nf(t.remaining, 1)} שנים, עד 30.6.${t.year + Math.ceil(t.remaining)}.`,
      `השכר עולה ב-${pc(t.raise)} בכל 1.1, החל מ-${t.year + 1}.`,
      `שיעור ההיוון בסוף ${t.year}: ${pc(t.rate)}. ההסתברות שהעובד ישלים את התקופה: 100%.`,
    ],
    tables: [],
    required: [`מה ההפרשה בגין המענק ב-31.12.${t.year}?`],
    checks: [
      { label: "השכר בפרישה", value: C.final },
      { label: "המענק בפרישה", value: C.grant },
      { label: `ההפרשה ב-31.12.${t.year}`, value: C.provision },
    ],
    steps: [
      {
        title: "שכר בפרישה ומענק",
        text: [`שנים מעל 10 מקנות ${pc(t.high)} במקום ${pc(t.low)}, ולפני 5 שנים אין מענק כלל. השנים המאוחרות מקנות הטבה גבוהה מהותית, ולכן מייחסים בקו ישר על כל הוותק (סעיף 73).`],
        notes: [
          {
            title: "שכר בפרישה, מענק, והחלק שנצבר",
            lines: [
              { label: "ותק בפרישה", calc: `${t.served} + ${nf(t.remaining, 2)}`, value: C.total, unit: "שנים" },
              { label: "שכר בפרישה", calc: `${money(t.salary)} × ${b(t.raise)}^${C.raises}`, value: C.final, unit: "₪" },
              { label: "מענק", calc: `${money(C.final)} × (${pc(t.low)} × ${Math.min(t.threshold, C.total)} + ${pc(t.high)} × ${nf(Math.max(0, C.total - t.threshold), 2)})`, value: C.grant, unit: "₪" },
            ],
          },
        ],
      },
      pvTable(
        `ההפרשה ב-31.12.${t.year}`,
        [{ label: `31.12.${t.year}`, amount: C.grant, part: `${t.served}/${yrs(C.total)}`, n: t.remaining, value: C.provision }],
        { rate: t.rate, label: "מדידה", amount: "מענק", why: `נצברו ${t.served} מתוך ${nf(C.total, 2)} שנות הוותק, ונותרו ${nf(t.remaining, 2)} שנים עד התשלום.` },
      ),
    ],
  };
}

// ===========================================================================
// 8. The year after a published note: recover the rates the note hides, then two amendments, an unexpected retirement and the plan assets.

export type HzGrade = { name: string; heads: number; salary: number; raise: number; retired0: number };
export type NoteInput = {
  company: string;
  /** The note's year; the question asks about the next. */
  year: number;
  hired: number;
  term: number;
  rate: number;
  grades: HzGrade[];
  /** Grade A's added share in the note's year; grade B gets half of it the next year. */
  addA: number;
  /** Grade C employees who retire at the end of the next year. */
  retireC: number;
  deposit: number;
  fromAssets: number;
  assetsOpening0: number;
  assetsPn0: number;
  assetsPn1: number;
};

export function solveNote(q: NoteInput) {
  const k = q.year - q.hired + 1;
  const T = q.term;
  const r = q.rate;
  const left0 = T - k;
  const ben = q.grades.map((g) => (g.salary * (1 + g.raise) ** left0 * T) / 1000);
  const ob = (heads: number, gi: number, served: number, n: number, factor = 1) => (heads * ben[gi] * factor * served) / T / (1 + r) ** n;
  // The note's year, rounded to thousands as published.
  const R = Math.round;
  const opening0 = R(sum(q.grades.map((g, i) => ob(g.heads + g.retired0, i, k - 1, left0 + 1))));
  const service0 = R(sum(q.grades.map((g, i) => ob(g.heads + g.retired0, i, 1, left0))));
  const interest0 = R(opening0 * r);
  const paid0 = R(sum(q.grades.map((g) => (g.retired0 * g.salary * k) / 1000)));
  const oblA0 = ob(q.grades[0].heads, 0, k, left0);
  const past0 = R(oblA0 * q.addA);
  const closing0 = R(sum(q.grades.map((g, i) => ob(g.heads, i, k, left0, i === 0 ? 1 + q.addA : 1))));
  const pn0 = closing0 - opening0 - interest0 - service0 + paid0 - past0;
  const deposits0 = R((q.deposit * sum(q.grades.map((g) => (g.heads + g.retired0) * g.salary))) / 1000);
  const aInterest0 = R(q.assetsOpening0 * r + deposits0 * ((1 + r) ** 0.5 - 1));
  const aPaid0 = R(paid0 * q.fromAssets);
  const aClosing0 = q.assetsOpening0 + aInterest0 + deposits0 - aPaid0 + q.assetsPn0;
  const note = { opening0, service0, interest0, paid0, past0, pn0, closing0, deposits0, aInterest0, aPaid0, aClosing0 };
  // The year asked about, from the note.
  const rate = interest0 / opening0;
  const addA = past0 / oblA0;
  const factor = [1 + q.addA, 1, 1];
  const interest1 = closing0 * r;
  const service = q.grades.map((g, i) => ob(g.heads, i, 1, left0 - 1, factor[i]));
  const service1 = sum(service);
  const retireOb = ob(q.retireC, 2, k + 1, left0 - 1);
  const paid1 = (q.retireC * q.grades[2].salary * (1 + q.grades[2].raise) * (k + 1)) / 1000;
  const retireLoss = paid1 - retireOb;
  const oblB = ob(q.grades[1].heads, 1, k + 1, left0 - 1);
  const past1 = oblB * (q.addA / 2);
  const closingParts = [ob(q.grades[0].heads, 0, k + 1, left0 - 1, 1 + q.addA), ob(q.grades[1].heads, 1, k + 1, left0 - 1, 1 + q.addA / 2), ob(q.grades[2].heads - q.retireC, 2, k + 1, left0 - 1)];
  const closing1 = sum(closingParts);
  const pn1 = closing1 - closing0 - interest1 - service1 + paid1 - past1;
  const salaryBase0 = sum(q.grades.map((g) => (g.heads + g.retired0) * g.salary)) / 1000;
  const depositShare = deposits0 / salaryBase0;
  const fromAssets = aPaid0 / paid0;
  const deposits1 = (q.deposit * sum(q.grades.map((g) => g.heads * g.salary * (1 + g.raise)))) / 1000;
  const aInterest1 = aClosing0 * r + deposits1 * ((1 + r) ** 0.5 - 1);
  const aPaid1 = paid1 * q.fromAssets;
  const aClosing1 = aClosing0 + aInterest1 + deposits1 - aPaid1 + q.assetsPn1;
  return {
    k,
    left0,
    ben,
    note,
    oblA0,
    rate,
    addA,
    interest1,
    service,
    service1,
    retireOb,
    paid1,
    retireLoss,
    oblB,
    past1,
    closingParts,
    closing1,
    pn1,
    salaryBase0,
    depositShare,
    fromAssets,
    deposits1,
    aInterest1,
    aPaid1,
    aClosing1,
  };
}

export function noteQuestion(id: string, title: string, q: NoteInput): BkQuestion {
  const s = solveNote(q);
  const y = q.year;
  const N = s.note;
  const T = q.term;
  const G = q.grades;
  const r = q.rate;
  const th = (x: number) => money(x);
  const factor = [1 + q.addA, 1, 1];
  const closeFactor = [1 + q.addA, 1 + q.addA / 2, 1];
  const noteO = { rate: r, label: "דרג", amount: "הטבה", x: "מקדם", amountDec: 2, valueDec: 2 };
  return {
    id,
    title,
    point: "כשהשאלה נותנת ביאור של שנה קודמת, **מתחילים ממנו**: מחלצים את הריבית, את שיעור ההטבה שנוסף, את שיעור ההפקדה ואת החלק שמשולם מהנכסים. רק אחר כך בונים את שתי הטבלאות.",
    facts: [
      `חברת ״${q.company}״ ציבורית. להלן נתונים מביאור התוכנית להטבה מוגדרת בדוחות ${y} (טבלה 1, באלפי ₪).`,
      `ב-31.12.${y} מועסקים בחברה ${sum(G.map((g) => g.heads))} עובדים (טבלה 2). כולם התחילו לעבוד ב-1.1.${q.hired}, עם הקמת החברה, ועד סוף ${y + 1} לא גויסו עובדים.`,
      "השכר עולה בכל תחילת שנה בשיעור הקבוע של הדרג.",
      "בפרישה העובד מקבל מיד שכר חודשי אחרון אחד לכל שנת שירות.",
      `בכל מועד החברה צופה שכל העובדים יפרשו ב-31.12.${q.hired + T - 1}.`,
      `ב-28.12.${y} פרשו במפתיע ${G.map((g) => `${g.retired0} עובדי ${g.name}`).join(", ")}. ההטבה שולמה ב-30.12.${y}. שכרם כשכר הממוצע.`,
      "בפרישה מוקדמת, החברה משלמת אחוז קבוע מההטבה מנכסי התוכנית, ואת השאר מהבנק.",
      `ב-31.12.${y} נחתם תיקון: עובדי ${G[0].name} יקבלו בפרישה הטבה נוספת בשיעור קבוע מהשכר האחרון × שנות השירות, רטרואקטיבית.`,
      `שיעור ההיוון לא השתנה ב-${y}–${y + 1}.`,
      "את השיעורים שמשחזרים מהביאור מעגלים: את הריבית ל-0.1%, ואת שאר השיעורים לאחוז שלם.",
      `ב-30.12.${y + 1} פרשו במפתיע ${q.retireC} עובדי ${G[2].name}, וההטבה שולמה ב-31.12.${y + 1} לפי אותה מדיניות.`,
      `ב-31.12.${y + 1} נחתם תיקון נוסף: עובדי ${G[1].name} יקבלו הטבה נוספת בגובה מחצית מהשיעור שניתן לעובדי ${G[0].name} בתיקון של ${y}.`,
      `הקרן: ב-30.6 בכל שנה החברה מפקידה אחוז קבוע מהשכר החודשי של כל עובד שמועסק באותו יום. מלבד משיכה לפרישה מוקדמת, אין החזרים מהקרן.`,
      `התשואה על הנכסים ב-${y + 1}, מעבר להכנסות הריבית: ${th(q.assetsPn1)} אלפי ₪. עגלו לאלף הקרוב.`,
    ],
    tables: [
      {
        title: `טבלה 1: הביאור לשנת ${y} (אלפי ₪)`,
        head: ["מחויבות", "", "נכסי תכנית", ""],
        rows: [
          ["יתרת פתיחה", `(${th(N.opening0)})`, "יתרת פתיחה", th(q.assetsOpening0)],
          ["עלות ריבית", `(${th(N.interest0)})`, "הכנסות ריבית", th(N.aInterest0)],
          ["עלות שירות שוטף", `(${th(N.service0)})`, "הפקדות", th(N.deposits0)],
          ["הטבות ששולמו", th(N.paid0), "הטבות ששולמו", `(${th(N.aPaid0)})`],
          ["עלות שירות עבר", `(${th(N.past0)})`, "", ""],
          ["מדידה מחדש", `(${th(N.pn0)})`, "מדידה מחדש", th(q.assetsPn0)],
          ["יתרת סגירה", `(${th(N.closing0)})`, "יתרת סגירה", th(N.aClosing0)],
        ],
      },
      { title: `טבלה 2: העובדים ב-31.12.${y}`, head: ["דרג", "עובדים", `שכר חודשי ממוצע ${y} (₪)`, "עליית שכר בשנה"], rows: G.map((g) => [g.name, g.heads, money(g.salary), pc(g.raise)]) },
    ],
    required: [`התנועה במחויבות לשנת ${y + 1}.`, `התנועה בנכסי התוכנית לשנת ${y + 1}.`],
    checks: [
      { label: "עלות שירות שוטף", value: s.service1 },
      { label: "מדידה מחדש של המחויבות (הפסד)", value: s.pn1 },
      { label: "יתרת סגירה של המחויבות", value: s.closing1 },
      { label: "יתרת סגירה של הנכסים", value: s.aClosing1 },
    ],
    steps: [
      {
        title: "מה הביאור מסתיר",
        notes: [
          {
            title: "ארבעה שיעורים שמחלצים מהביאור",
            lines: [
              { label: "הריבית: התשלומים והתיקון בסוף השנה, ולכן ריבית ÷ פתיחה", calc: `${th(N.interest0)} ÷ ${th(N.opening0)}`, value: s.rate * 100, unit: "%" },
              { label: "החלק שמשולם מהנכסים", calc: `${th(N.aPaid0)} ÷ ${th(N.paid0)}`, value: s.fromAssets * 100, unit: "%" },
              {
                label: "שיעור ההפקדה: הפקדות ÷ שכר כל העובדים ב-30.6 (כולל מי שפרשו בדצמבר)",
                calc: `${th(N.deposits0)} ÷ (${G.map((g) => `${g.heads + g.retired0} × ${money(g.salary)}`).join(" + ")}) / 1,000`,
                value: s.depositShare * 100,
                unit: "%",
              },
            ],
          },
          {
            title: `השיעור שנוסף לעובדי ${G[0].name}: שירות עבר ÷ המחויבות לפני התיקון`,
            text: `ההטבה לעובד בפרישה = שכר ${y} × (1 + עלייה)^${s.left0} × ${T} שנים. ב-31.12.${y} עברו ${s.k} שנים, ונותרו ${s.left0}.`,
            lines: [
              { label: `הטבה בפרישה, ${G[0].name} (אלפי ₪)`, calc: `${money(G[0].salary)} × ${b(G[0].raise)}^${s.left0} × ${T} / 1,000`, value: s.ben[0], unit: "" },
              { label: "מחויבות לפני התיקון", calc: `${G[0].heads} × ${d2(s.ben[0])} × ${s.k}/${T} ÷ ${b(r)}^${s.left0}`, value: s.oblA0, unit: "" },
              { label: "השיעור שנוסף", calc: `${th(N.past0)} ÷ ${d2(s.oblA0)}`, value: s.addA * 100, unit: "%" },
            ],
          },
        ],
        text: [`מעגלים: ריבית ${pc(r)}, תוספת ${pc(q.addA)} ל${G[0].name} ולכן ${pc(q.addA / 2)} ל${G[1].name}, הפקדה ${pc(q.deposit)}, ומהנכסים ${pc(q.fromAssets)}.`],
      },
      {
        title: `המחויבות ב-${y + 1}: ההטבה בפרישה`,
        notes: [
          {
            title: "ההטבה בפרישה לכל דרג (אלפי ₪)",
            lines: G.map((g, i) => ({ label: g.name + (i === 0 ? ` (× ${nf(1 + q.addA, 3)})` : ""), calc: `${money(g.salary)} × ${b(g.raise)}^${s.left0} × ${T} / 1,000`, value: s.ben[i], unit: "" as const })),
          },
        ],
      },
      pvTable(
        `עלות שירות שוטף ${y + 1}`,
        G.map((g, i) => ({ label: g.name, heads: g.heads, amount: s.ben[i], x: factor[i] === 1 ? undefined : factor[i], part: `1/${T}`, n: s.left0 - 1, value: s.service[i] })),
        { ...noteO, why: [`עובדי ${G[2].name} שפרשו ב-30.12 עבדו כל השנה, ולכן **נכנסים לשירות**.`, `ב${G[0].name} ההטבה גדלה ב-${pc(q.addA)} מהתיקון של ${y}.`, "הסכומים באלפי ₪."] },
      ),
      {
        ...pvTable(
          `${q.retireC} עובדי ${G[2].name} שפרשו`,
          [{ label: G[2].name, heads: q.retireC, amount: s.ben[2], part: `${s.k + 1}/${T}`, n: s.left0 - 1, value: s.retireOb }],
          { ...noteO, why: "המחויבות בגינם רגע לפני הפרישה." },
        ),
        notes: [
          {
            title: "מה ששולם, וההפרש",
            lines: [
              { label: "מה ששולם: השכר של השנה × שנות השירות", calc: `${q.retireC} × ${money(G[2].salary)} × ${b(G[2].raise)} × ${s.k + 1} / 1,000`, value: s.paid1, unit: "" },
              { label: "ההפרש: מדידה מחדש (הפסד)", calc: `${d2(s.paid1)} − ${d2(s.retireOb)}`, value: s.retireLoss, unit: "" },
            ],
          },
        ],
      },
      {
        ...pvTable(
          `שירות עבר לעובדי ${G[1].name}`,
          [{ label: G[1].name, heads: G[1].heads, amount: s.ben[1], part: `${s.k + 1}/${T}`, n: s.left0 - 1, value: s.oblB }],
          { ...noteO, why: `השירות העבר הוא ${pc(q.addA / 2)} מהמחויבות לפני התיקון.` },
        ),
        notes: [{ title: "השירות העבר", lines: [{ label: "שירות עבר", calc: `${d2(s.oblB)} × ${pc(q.addA / 2)}`, value: s.past1, unit: "" }] }],
      },
      pvTable(
        `יתרת סגירה 31.12.${y + 1}`,
        G.map((g, i) => ({ label: g.name, heads: i === 2 ? g.heads - q.retireC : g.heads, amount: s.ben[i], x: closeFactor[i] === 1 ? undefined : closeFactor[i], part: `${s.k + 1}/${T}`, n: s.left0 - 1, value: s.closingParts[i] })),
        { ...noteO, why: `שתי התוספות נכנסות: ${pc(q.addA)} ל${G[0].name} ו-${pc(q.addA / 2)} ל${G[1].name}. בלי ${q.retireC} העובדים שפרשו.` },
      ),
      {
        title: `המחויבות ב-${y + 1}: התנועה`,
        notes: [{ title: "ריבית: על היתרה בתחילת השנה", lines: [{ label: "ריבית", calc: `${th(N.closing0)} × ${pc(r)}`, value: s.interest1, unit: "" }] }],
        rolls: [
          {
            title: `מחויבות, ${y + 1}`,
            unit: "אלפי ₪",
            rows: [
              { label: "יתרת פתיחה", value: N.closing0, kind: "balance" },
              { label: "עלות ריבית", value: s.interest1 },
              { label: "עלות שירות שוטף", value: s.service1 },
              { label: "הטבות ששולמו", value: -s.paid1 },
              { label: "עלות שירות עבר", value: s.past1 },
              { label: "מדידה מחדש", value: s.pn1, kind: "pn", note: "הפרישה, ועיגול" },
              { label: "יתרת סגירה", value: s.closing1, kind: "balance" },
            ],
          },
        ],
      },
      {
        title: `הנכסים ב-${y + 1}`,
        notes: [
          {
            title: "הפקדה, ריבית ותשלום",
            lines: [
              { label: "הפקדה ב-30.6: כל העובדים, בשכר השנה", calc: `${pc(q.deposit)} × (${G.map((g) => `${g.heads} × ${money(g.salary)} × ${b(g.raise)}`).join(" + ")}) / 1,000`, value: s.deposits1, unit: "" },
              { label: "ריבית: על הפתיחה שנה, על ההפקדה חצי שנה", calc: `${th(N.aClosing0)} × ${pc(r)} + ${d2(s.deposits1)} × (${b(r)}^0.5 − 1)`, value: s.aInterest1, unit: "" },
              { label: "שולם מהנכסים", calc: `${d2(s.paid1)} × ${pc(q.fromAssets)}`, value: s.aPaid1, unit: "" },
            ],
          },
        ],
        rolls: [
          {
            title: `נכסי התוכנית, ${y + 1}`,
            side: "debit",
            unit: "אלפי ₪",
            rows: [
              { label: "יתרת פתיחה", value: N.aClosing0, kind: "balance" },
              { label: "הכנסות ריבית", value: s.aInterest1 },
              { label: "הפקדות", value: s.deposits1 },
              { label: "הטבות ששולמו", value: -s.aPaid1 },
              { label: "מדידה מחדש", value: q.assetsPn1, kind: "pn", note: "נתון" },
              { label: "יתרת סגירה", value: s.aClosing1, kind: "balance" },
            ],
          },
        ],
      },
    ],
  };
}
