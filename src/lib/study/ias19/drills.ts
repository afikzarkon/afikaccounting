import { accrued, attribution, backLoaded, grown, pv, tiered } from "@/lib/learn/ias19";
import { fmt, pct } from "./shared";

/**
 * Practice with new numbers for the post-employment lessons: a generator per
 * kind of question (classify a plan, book a defined contribution, measure one
 * employee's promise, attribute a grant with two routes to entitlement, a
 * grant in tiers with or without a cap). Each draw comes with its full
 * solution, written as the solving template the lessons teach: what we are
 * looking for, what we check, how we build the answer. Every figure is
 * computed with the course's solver (lib/learn/ias19), and drills.test checks
 * hundreds of draws against it. Pure, so it runs on the client.
 */

export type Rand = () => number;

/** A small seeded generator (mulberry32), so a draw can be repeated. */
export function seeded(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const step = (r: Rand, min: number, max: number, by: number) => int(r, Math.ceil(min / by), Math.floor(max / by)) * by;
const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const shuffle = <T,>(r: Rand, xs: T[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A whole-shekel amount for the text. */
const sh = (v: number) => `${fmt(Math.round(v))} ₪`;
/** A factor as written in a formula: 1.035, never 1.0350000000000001. */
const f1 = (i: number) => (1 + i).toLocaleString("en-US", { maximumFractionDigits: 4 });

export type DrillAsk =
  | { kind: "number"; id: string; label: string; answer: number; unit?: string }
  | { kind: "choice"; id: string; label: string; options: string[]; answer: number };

export type DrillStep = { title: string; lines: string[] };
export type DrillTable = { head: string[]; rows: (string | number)[][]; foot?: (string | number)[] };

export type Drill = {
  family: DrillFamily;
  title: string;
  /** The question, a paragraph per line. */
  story: string[];
  asks: DrillAsk[];
  /** The solving template: what we look for, what we check, how we build it. */
  seek: string[];
  check: string[];
  build: DrillStep[];
  table?: DrillTable;
  entry?: { account: string; dr?: number; cr?: number }[];
};

export type DrillFamily = "classify" | "dc" | "puc" | "window" | "tiers";

export const DRILL_TITLES: Record<DrillFamily, string> = {
  classify: "סיווג: הפקדה מוגדרת או הטבה מוגדרת",
  dc: "רישום הפקדה מוגדרת",
  puc: "מדידת התחייבות לעובד אחד",
  window: "ייחוס: שני מסלולים לזכאות",
  tiers: "ייחוס: נוסחת התוכנית או קו ישר",
};

/** Whether a typed answer to a number ask is right: within a shekel, or 0.2% for large amounts, since a solution rounds along the way. */
export const drillRight = (answer: number, typed: string) => {
  const v = typed.trim() ? Number(typed.replace(/[,\s₪]/g, "")) : NaN;
  return Number.isFinite(v) && Math.abs(v - answer) <= Math.max(1, Math.abs(answer) * 0.002);
};

// ---------------------------------------------------------------------------
// Classify.

const KINDS = ["הפקדה מוגדרת", "הטבה מוגדרת"];
const COMPANIES = ["רשת חנויות הצפון", "מפעל המתכת", "חברת ההייטק", "משרד רואי החשבון", "רשת המלונות", "חברת ההסעות", "בית הדפוס", "חברת הביטוח"];

type Scenario = (r: Rand, co: string) => { text: string; answer: 0 | 1; who: string; why: string };

const SCENARIOS: Scenario[] = [
  (r, co) => {
    const rate = pick(r, [6, 6.5, 7, 7.5]);
    return { text: `${co} מפקידה ${rate}% מהשכר של כל עובד לקרן פנסיה צוברת. הקרן תשלם לעובד בפרישה את מה שנצבר, לפי התשואה שהשיגה. לחברה אין שום מחויבות נוספת.`, answer: 0, who: "העובד", why: "החברה מפקידה סכום קבוע ונפטרת. אם התשואה תהיה נמוכה, העובד יקבל פחות — הסיכון עליו." };
  },
  (_r, co) => ({ text: `העובדים של ${co} חתומים על סעיף 14 לחוק פיצויי פיטורין: בסיום ההעסקה הם יקבלו את הסכומים שנצברו בקופה בגין רכיב הפיצויים, ותו לא.`, answer: 0, who: "העובד", why: "לפי סעיף 14 העובד מקבל רק את מה שנצבר — רכיב הפיצויים הוא הפקדה מוגדרת." }),
  (r, co) => {
    const g = pick(r, [2, 2.5, 3.5]);
    return { text: `${co} מפקידה כל חודש סכום קבוע לקרן חיצונית, וגם ערבה לכך שהתשואה השנתית על ההפקדות לא תפחת מ-${g}%.`, answer: 1, who: "החברה", why: "ערבות לתשואה משאירה אצל החברה סיכון — אם הקרן תשיג פחות, היא תשלים (סעיף 29)." };
  },
  (_r, co) => ({ text: `קרן נפרדת משלמת לגמלאים של ${co} את הפנסיה. לפי ההסכם, אם נכסי הקרן לא יספיקו — החברה תשלים את ההפרש.`, answer: 1, who: "החברה", why: "לא משנה מי משלם בפועל. החובה להשלים חוסר משאירה את הסיכון האקטוארי אצל החברה." }),
  (r, co) => {
    const s = pick(r, [60, 65, 70]);
    return { text: `לגמלאים הוותיקים של ${co} משולמת פנסיה תקציבית: ${s}% מהשכר האחרון, כל חודש עד סוף חייהם, מתקציב החברה.`, answer: 1, who: "החברה", why: "החברה הבטיחה את ההטבה עצמה. אם הגמלאים יחיו יותר או השכר האחרון יעלה — היא תשלם יותר." };
  },
  (r, co) => {
    const v = step(r, 300, 900, 50);
    return { text: `${co} נוהגת לשלוח לכל גמלאי שי לחג בשווי ${fmt(v)} ₪, פעמיים בשנה, כל עוד הוא בחיים. אין לכך קרן.`, answer: 1, who: "החברה", why: "זו הטבה לגמלאים (סעיף 26). מספר השנים שישולם השי תלוי בתוחלת החיים — סיכון אקטוארי על החברה." };
  },
  (r, co) => {
    const v = pick(r, [40, 50, 60]);
    return { text: `${co} משתתפת ב-${v}% מההוצאות הרפואיות של גמלאיה, בלי תקרה.`, answer: 1, who: "החברה", why: "עלויות רפואיות עתידיות ותוחלת חיים — שניהם סיכונים של החברה." };
  },
  (r, co) => {
    const p = pick(r, [0.4, 0.5, 0.7, 0.8]);
    return { text: `מבטח חיצוני קיבל על עצמו את כל ההתחייבות למענקי הפרישה של עובדי ${co}. החברה משלמת לו פרמיה קבועה של ${p}% מהשכר, ואין לה שום חובה נוספת.`, answer: 0, who: "המבטח", why: "החברה פטורה מכל מחויבות מעבר לפרמיה — הסיכון עבר למבטח." };
  },
  (r, co) => {
    const m = pick(r, [1, 1.5, 2]);
    return { text: `${co} תשלם לכל עובד בפרישה ${fmt(m)} משכורות חודשיות אחרונות על כל שנת עבודה. אין קרן ואין הפקדות.`, answer: 1, who: "החברה", why: "סכום לפי נוסחה של שכר אחרון וותק — הסיכון שהשכר יעלה או שהעובד יעבוד יותר על החברה." };
  },
  (r, co) => {
    const rate = pick(r, [6, 6.5, 7]);
    return { text: `${co} מפקידה ${rate}% מהשכר לקרן חיצונית. החוזה לא מחייב אותה ביותר מזה — אבל בכל שנה שבה התשואה הייתה שלילית, היא השלימה לעובדים את ההפסד, והעובדים מצפים שתמשיך.`, answer: 1, who: "החברה", why: "נוהג קבוע שיוצר ציפייה הוא מחויבות משתמעת. היא משאירה את הסיכון אצל החברה, ולכן זו הטבה מוגדרת (סעיף 29)." };
  },
];

export function classifyDrill(r: Rand): Drill {
  const k = int(r, 0, SCENARIOS.length - 1);
  const s = SCENARIOS[k](r, pick(r, COMPANIES));
  return {
    family: "classify",
    title: DRILL_TITLES.classify,
    story: [s.text],
    asks: [
      { kind: "choice", id: "kind", label: "מה סוג התוכנית?", options: KINDS, answer: s.answer },
      { kind: "choice", id: "who", label: "מי נושא בסיכון שהכסף לא יספיק?", options: ["החברה", "העובד", "המבטח"], answer: s.who === "החברה" ? 0 : s.who === "העובד" ? 1 : 2 },
    ],
    seek: ["הסוג של התוכנית: הפקדה מוגדרת או הטבה מוגדרת."],
    check: ["מי יפסיד אם הכסף לא יספיק — לא מי מעביר את הכסף.", "האם יש ערבות, חובת השלמה, נוסחה של שכר אחרון, או נוהג שיוצר ציפייה?"],
    build: [
      { title: "מי נושא בסיכון", lines: [`${s.who}.`, s.why] },
      { title: "המסקנה", lines: [s.answer === 0 ? "הסיכון לא אצל החברה → הפקדה מוגדרת: ההוצאה היא ההפקדה." : "הסיכון אצל החברה → הטבה מוגדרת: מודדים התחייבות אקטוארית."] },
    ],
  };
}

// ---------------------------------------------------------------------------
// Book a defined contribution.

const TIMING = ["next", "quarter", "advance"] as const;

export type DcDraw = { workers: number; salary: number; rate: number; employee: number; start: number; timing: (typeof TIMING)[number] };

export function dcDraw(r: Rand): DcDraw {
  return {
    workers: int(r, 4, 40),
    salary: step(r, 9_000, 26_000, 1_000),
    rate: pick(r, [0.06, 0.065, 0.07, 0.075]),
    employee: pick(r, [0.06, 0.07]),
    start: pick(r, [1, 1, 3, 4, 6, 7, 9]),
    timing: pick(r, TIMING),
  };
}

/** The months worked, the contribution a month, the expense, the months paid by 31.12, and what is left (positive a liability, negative an asset). */
export function dcFigures(d: DcDraw) {
  const months = 13 - d.start;
  const monthly = Math.round(d.workers * d.salary * d.rate * 100) / 100;
  const expense = monthly * months;
  const q4 = Math.min(months, 3);
  const paidMonths = d.timing === "next" ? months - 1 : d.timing === "quarter" ? months - q4 : months + 1;
  const paid = monthly * paidMonths;
  return { months, monthly, expense, paidMonths, paid, balance: expense - paid };
}

const MONTH = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

export function dcDrill(r: Rand): Drill {
  const d = dcDraw(r);
  const F = dcFigures(d);
  const when = {
    next: "ההפקדה של כל חודש מועברת לקרן ב-10 לחודש שאחריו.",
    quarter: "ההפקדות מועברות לקרן פעם ברבעון, ב-10 לחודש שאחרי סוף הרבעון.",
    advance: "ההפקדה של כל חודש מועברת ב-10 לחודש שאחריו — אבל בדצמבר העבירה החברה, בנוסף, מראש גם את ההפקדה של ינואר הבא.",
  }[d.timing];
  const startText = d.start === 1 ? "כל העובדים עבדו כל השנה." : `המחלקה נפתחה ב-1 ב${MONTH[d.start]}, ומאז עבדו בה כל העובדים.`;
  const side = F.balance > 0 ? 0 : 1;
  const balanceName = side === 0 ? "זכאים (התחייבות)" : "הוצאות מראש (נכס)";
  const entry =
    side === 0
      ? [
          { account: "הוצאות שכר", dr: F.expense },
          { account: "מזומן", cr: F.paid },
          { account: "זכאים", cr: F.balance },
        ]
      : [
          { account: "הוצאות שכר", dr: F.expense },
          { account: "הוצאות מראש", dr: -F.balance },
          { account: "מזומן", cr: F.paid },
        ];
  return {
    family: "dc",
    title: DRILL_TITLES.dc,
    story: [
      `במחלקה ${d.workers} עובדים, והשכר החודשי של כל אחד ${fmt(d.salary)} ₪. ${startText}`,
      `לפי החוק, החברה מפקידה לקרן פנסיה צוברת ${pct(d.rate)} מהשכר בגין חלקה, ומנכה משכר העובד עוד ${pct(d.employee)} בגין חלקו. ${when}`,
      "לחברה אין שום מחויבות מעבר להפקדות.",
    ],
    asks: [
      { kind: "number", id: "expense", label: "ההוצאה של החברה בשנה (חלקה בלבד)", answer: F.expense, unit: "₪" },
      { kind: "number", id: "balance", label: "היתרה במאזן ב-31.12 (בערך מוחלט)", answer: Math.abs(F.balance), unit: "₪" },
      { kind: "choice", id: "side", label: "היתרה היא", options: ["התחייבות (זכאים)", "נכס (הוצאות מראש)"], answer: side },
    ],
    seek: ["ההוצאה — ההפקדה שהחברה חייבת בגין השירות של השנה.", "היתרה — ההפרש בין מה שהגיע למה שהועבר."],
    check: [
      "כמה חודשי שירות היו השנה? ההוצאה רק עליהם.",
      `חלק העובד (${pct(d.employee)}) מנוכה משכרו — הוא לא הוצאה נוספת של החברה.`,
      "מתי הכסף עובר? זה קובע כמה שולם עד 31.12.",
      "היוון? לא — ההפקדה תשולם תוך 12 חודשים מסוף השנה (סעיף 52).",
    ],
    build: [
      { title: "1. הפקדה לחודש", lines: [`${d.workers} × ${fmt(d.salary)} × ${pct(d.rate)} = ${sh(F.monthly)}.`] },
      { title: "2. ההוצאה", lines: [`${F.months} חודשי שירות × ${sh(F.monthly)} = ${sh(F.expense)}.`, `חלק העובד, ${pct(d.employee)}, לא נכנס.`] },
      {
        title: "3. מה הועבר עד 31.12",
        lines: [
          d.timing === "next"
            ? `כל חודש מועבר בחודש שאחריו — דצמבר יעבור רק בינואר. הועברו ${F.paidMonths} חודשים: ${sh(F.paid)}.`
            : d.timing === "quarter"
              ? `ההפקדות של הרבעון האחרון (${F.months - F.paidMonths} חודשים) יעברו רק בינואר. הועברו ${F.paidMonths} חודשים: ${sh(F.paid)}.`
              : `${F.months - 1} חודשים הועברו כרגיל, ועוד דצמבר וינואר הבא — ${F.paidMonths} חודשים: ${sh(F.paid)}.`,
        ],
      },
      { title: "4. היתרה", lines: [`${sh(F.expense)} − ${sh(F.paid)} = ${F.balance > 0 ? "" : "−"}${sh(Math.abs(F.balance))} → ${balanceName}.`] },
      { title: "5. הפקודה", lines: entry.map((l) => `${l.dr ? "ח׳" : "ז׳"} ${l.account} ${sh(l.dr ?? l.cr ?? 0)}`) },
    ],
    entry,
  };
}

// ---------------------------------------------------------------------------
// Measure one employee's promise (the projected unit credit method).

const ROLES = [
  { role: "מנהלת הכספים", f: true },
  { role: "סמנכ״ל השיווק", f: false },
  { role: "מנהלת המפעל", f: true },
  { role: "היועץ המשפטי", f: false },
  { role: "מנהלת הרכש", f: true },
  { role: "מנהל הלוגיסטיקה", f: false },
];

export type PucDraw = {
  role: (typeof ROLES)[number];
  basis: "annual" | "monthly";
  /** A share of the annual salary, or a number of monthly salaries, for each year. */
  share: number;
  /** The annual salary at the measurement date (December's × 12). */
  salary: number;
  growth: number;
  year: number;
  startYear: number;
  startMonth: number;
  /** Years from the measurement date to retirement on 31.12. */
  n: number;
  rate: number;
  government?: number;
  stay?: number;
};

export function pucDraw(r: Rand): PucDraw {
  const basis = pick(r, ["annual", "monthly"] as const);
  const year = int(r, 2023, 2026);
  const rate = pick(r, [0.045, 0.055, 0.06, 0.065, 0.07]);
  return {
    role: pick(r, ROLES),
    basis,
    share: basis === "annual" ? pick(r, [0.04, 0.06, 0.075]) : pick(r, [1, 1.25, 1.5]),
    salary: step(r, 216_000, 600_000, 12_000),
    growth: pick(r, [0.015, 0.025, 0.03, 0.035]),
    year,
    startYear: year - int(r, 0, 4),
    startMonth: pick(r, [1, 4, 7, 10]),
    n: int(r, 3, 12),
    rate,
    government: r() < 0.5 ? rate - pick(r, [0.01, 0.015]) : undefined,
    stay: r() < 0.4 ? pick(r, [0.9, 0.92, 0.95]) : undefined,
  };
}

export function pucFigures(d: PucDraw) {
  const final = grown(d.salary, d.growth, d.n);
  const unit = d.basis === "annual" ? d.share * final : (d.share * final) / 12;
  const months = (d.year - d.startYear) * 12 + (13 - d.startMonth);
  const served = months / 12;
  const accrued = unit * served;
  const stay = d.stay ?? 1;
  return { final, unit, months, served, accrued, stay, obligation: pv(accrued * stay, d.rate, d.n), total: unit * (served + d.n) };
}

const yearsText = (months: number) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const ys = y === 1 ? "שנה" : `${y} שנים`;
  return m === 0 ? ys : y === 0 ? `${m} חודשים (${fmt(months / 12)} שנה)` : `${ys} ו-${m} חודשים (${fmt(months / 12)} שנים)`;
};

export function pucDrill(r: Rand): Drill {
  const d = pucDraw(r);
  const F = pucFigures(d);
  const v = (m: string, f: string) => (d.role.f ? f : m);
  const promise =
    d.basis === "annual"
      ? `${pct(d.share)} מהשכר השנתי האחרון`
      : d.share === 1
        ? "משכורת חודשית אחרונה אחת"
        : `${fmt(d.share)} משכורות חודשיות אחרונות`;
  const rateText = d.government
    ? `תשואת אג״ח קונצרניות באיכות גבוהה ב-31.12.${d.year}: ${pct(d.rate)}; תשואת אג״ח ממשלתיות: ${pct(d.government)}.`
    : `שיעור ההיוון (אג״ח קונצרניות באיכות גבוהה) ב-31.12.${d.year}: ${pct(d.rate)}.`;
  const salaryWord = d.basis === "annual" ? "השכר השנתי" : "המשכורת החודשית";
  const salaryNow = d.basis === "annual" ? d.salary : d.salary / 12;
  const finalShown = d.basis === "annual" ? F.final : F.final / 12;
  return {
    family: "puc",
    title: DRILL_TITLES.puc,
    story: [
      `לפי החוזה, ${d.role.role} ${v("זכאי", "זכאית")} בסיום ההעסקה למענק פרישה חד־פעמי: ${promise} על כל שנת עבודה.`,
      `${v("הוא החל", "היא החלה")} לעבוד ב-1.${d.startMonth}.${d.startYear}, והחברה מעריכה ש${v("יפרוש", "תפרוש")} ב-31.12.${d.year + d.n}.`,
      `${salaryWord} ${v("שלו", "שלה")} בדצמבר ${d.year}: ${fmt(salaryNow)} ₪, והחברה צופה עלייה של ${pct(d.growth)} בכל ינואר.${d.stay ? ` ההסתברות ש${v("יגיע", "תגיע")} לפרישה בחברה: ${pct(d.stay)}.` : ""}`,
      `${rateText} מה ההתחייבות ב-31.12.${d.year}?`,
    ],
    asks: [
      { kind: "number", id: "final", label: d.basis === "annual" ? "השכר השנתי הצפוי בפרישה" : "המשכורת החודשית הצפויה בפרישה", answer: finalShown, unit: "₪" },
      { kind: "number", id: "unit", label: "יחידת זכאות — ההטבה לשנת עבודה אחת", answer: F.unit, unit: "₪" },
      { kind: "number", id: "accrued", label: `הצבירה עד 31.12.${d.year}, לפני היוון`, answer: F.accrued, unit: "₪" },
      { kind: "number", id: "obligation", label: `ההתחייבות ב-31.12.${d.year}`, answer: F.obligation, unit: "₪" },
    ],
    seek: [`ההתחייבות ב-31.12.${d.year}: הערך הנוכחי של מה ש${v("העובד", "העובדת")} כבר ${v("צבר", "צברה")} — בשכר הצפוי בפרישה.`],
    check: [
      `לפי איזה שכר? השכר האחרון — לכן מצפים אותו קדימה ${d.n} שנים, עד הפרישה.`,
      d.basis === "annual" ? "שכר שנתי — היחידה היא אחוז ממנו." : "משכורת חודשית — היחידה היא מכפלה של המשכורת החודשית, לא של השנתית.",
      "כמה שירות נצבר עד תאריך המדידה — כולל חודשים?",
      `n = השנים מתאריך המדידה ועד התשלום (${d.n}), לא שנות הוותק.`,
      d.government ? "שיעור ההיוון: הקונצרני, לא הממשלתי — בישראל יש שוק עמוק (סעיף 83)." : "שיעור ההיוון של תאריך המדידה.",
      ...(d.stay ? ["ההסתברות להגיע לפרישה מכפילה את הצבירה."] : []),
    ],
    build: [
      {
        title: "① השכר הצפוי בפרישה",
        lines: [`${fmt(salaryNow)} × ${f1(d.growth)}^${d.n} = ${sh(finalShown)} — ${d.n} עליות, מ-${d.year + 1} עד ${d.year + d.n}.`],
      },
      {
        title: "② יחידת הזכאות",
        lines: [d.basis === "annual" ? `${pct(d.share)} × ${sh(F.final)} = ${sh(F.unit)} לכל שנת עבודה.` : `${fmt(d.share)} × ${sh(F.final / 12)} = ${sh(F.unit)} לכל שנת עבודה.`],
      },
      { title: "③ הצבירה עד היום", lines: [`מ-1.${d.startMonth}.${d.startYear} עד 31.12.${d.year}: ${yearsText(F.months)}.`, `${sh(F.unit)} × ${fmt(F.served)} = ${sh(F.accrued)}.`] },
      {
        title: "④ היוון להיום",
        lines: [
          `${sh(F.accrued)}${d.stay ? ` × ${pct(d.stay)}` : ""} ÷ ${f1(d.rate)}^${d.n} = ${sh(F.obligation)}.`,
          `לשם השוואה: עד הפרישה ${v("יצבור", "תצבור")} ${fmt(F.served + d.n)} שנים, כלומר מענק של ${sh(F.total)} — אבל היום נכנס רק החלק שכבר נצבר, ובערך נוכחי.`,
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Attribution: a grant with two routes to entitlement.

export type WindowRule = { grant: number; minAge: number; years: number; retire: number };

/**
 * When service starts and stops adding to a grant paid to anyone still
 * employed at `minAge` after `years` of service, or at `retire` regardless of
 * service: if the employee can complete the years by `retire`, the grant is
 * earned at the later of `minAge` and hire + years, over the `years` before
 * it; otherwise it is earned only at `retire`, over all the service from hire.
 */
export function windowOf(rule: WindowRule, hireAge: number) {
  if (hireAge + rule.years <= rule.retire) {
    const end = Math.max(rule.minAge, hireAge + rule.years);
    return { start: end - rule.years, end, route: "service" as const };
  }
  return { start: hireAge, end: rule.retire, route: "age" as const };
}

export type WindowPerson = { id: string; age: number; hireAge: number; stay: number };

export function windowRow(rule: WindowRule, rate: number, p: WindowPerson) {
  const w = windowOf(rule, p.hireAge);
  const window = w.end - w.start;
  const perYear = rule.grant / window;
  const served = Math.min(Math.max(0, p.age - w.start), window);
  const n = rule.retire - p.age;
  const acc = perYear * served;
  return { ...w, window, perYear, served, n, accrued: acc, obligation: pv(acc, rate, n) * p.stay };
}

const RULES: Omit<WindowRule, "grant" | "retire">[] = [
  { minAge: 60, years: 25 },
  { minAge: 58, years: 18 },
  { minAge: 62, years: 30 },
  { minAge: 60, years: 15 },
];

export type WindowDraw = { rule: WindowRule; rate: number; year: number; people: WindowPerson[] };

export function windowDraw(r: Rand): WindowDraw {
  const base = pick(r, RULES);
  const retire = pick(r, [66, 67, 68]);
  const rule = { ...base, retire, grant: step(r, 3_600, 18_000, 1_200) };
  const from = rule.minAge - rule.years;
  const early = () => {
    const hireAge = int(r, from - 6, from - 1);
    return { hireAge, age: from + int(r, 1, rule.years - 2) };
  };
  const middle = () => {
    const hireAge = int(r, from + 1, retire - rule.years);
    return { hireAge, age: hireAge + int(r, 1, rule.years - 1) };
  };
  const late = () => {
    const hireAge = int(r, retire - rule.years + 2, retire - 3);
    return { hireAge, age: hireAge + int(r, 1, retire - hireAge - 1) };
  };
  const ids = ["א", "ב", "ג"];
  const people = shuffle(r, [early(), middle(), late()]).map((p, k) => ({ id: ids[k], ...p, stay: int(r, 78, 98) / 100 }));
  return { rule, rate: pick(r, [0.03, 0.035, 0.045, 0.05]), year: int(r, 2023, 2026), people };
}

export function windowDrill(r: Rand): Drill {
  const d = windowDraw(r);
  const { rule } = d;
  const rows = d.people.map((p) => windowRow(rule, d.rate, p));
  const total = rows.reduce((s, x) => s + x.obligation, 0);
  const from = rule.minAge - rule.years;
  return {
    family: "window",
    title: DRILL_TITLES.window,
    story: [
      `החברה משלמת מענק פרישה חד־פעמי של ${fmt(rule.grant)} ₪ לכל עובד שעדיין מועסק בגיל ${rule.minAge} או יותר אחרי ${rule.years} שנות שירות, או לכל מי שעדיין מועסק בגיל ${rule.retire} — בלי קשר לוותק.`,
      `החברה מעריכה שכל העובדים יפרשו בגיל ${rule.retire}. שיעור ההיוון ${pct(d.rate)}. הנתונים ב-31.12.${d.year}:`,
      ...d.people.map((p) => `עובד ${p.id}: בן ${p.age}, התחיל לעבוד ב-1.1.${d.year - (p.age - p.hireAge) + 1}; ההסתברות שישלים את תקופת השירות הנדרשת: ${pct(p.stay)}.`),
      `מה יתרת ההתחייבות ב-31.12.${d.year}?`,
    ],
    asks: [
      ...d.people.map((p, k) => ({ kind: "number" as const, id: `p${k}`, label: `התחייבות בגין עובד ${p.id}`, answer: rows[k].obligation, unit: "₪" })),
      { kind: "number", id: "total", label: "סך ההתחייבות", answer: total, unit: "₪" },
    ],
    seek: ["לכל עובד: מאיזה גיל השירות מתחיל להגדיל את המענק, ובאיזה גיל מפסיק — ומשם הצבירה, ההיוון וההסתברות."],
    check: [
      `האם העובד יכול להשלים ${rule.years} שנות שירות עד גיל ${rule.retire}? אם כן — המענק נצבר על ${rule.years} שנים; אם לא — רק בגיל ${rule.retire}, על כל שנות השירות שלו.`,
      `שירות לפני גיל ${from} (= ${rule.minAge} − ${rule.years}) לא מוסיף כלום: מי שהתחיל לפניו צובר רק ממנו (סעיפים 71 ו-73).`,
      `ההיוון — תמיד עד התשלום בגיל ${rule.retire}, גם כשהצבירה נגמרת קודם.`,
      "ההסתברות שלא ישלים את התקופה מקטינה את ההתחייבות.",
    ],
    build: [
      ...d.people.map((p, k) => {
        const x = rows[k];
        const why =
          x.route === "age"
            ? `התחיל בגיל ${p.hireAge}: עד ${rule.retire} יצבור רק ${rule.retire - p.hireAge} שנים — פחות מ-${rule.years}. יקבל את המענק רק במסלול הגיל, בגיל ${rule.retire}, ולכן הוא נצבר על כל השירות: ${x.window} שנים.`
            : p.hireAge < from
              ? `התחיל בגיל ${p.hireAge}, לפני גיל ${from}. השירות שלפני ${from} לא מוסיף דבר — הוא יהיה זכאי בגיל ${rule.minAge} בכל מקרה. הצבירה מגיל ${from} עד ${rule.minAge}: ${x.window} שנים.`
              : `התחיל בגיל ${p.hireAge}: ישלים ${rule.years} שנים בגיל ${x.end}, ואז כבר יהיה זכאי. הצבירה מגיל ${x.start} עד ${x.end}: ${x.window} שנים.`;
        return {
          title: `עובד ${p.id}`,
          lines: [
            why,
            `צבירה לשנה: ${fmt(rule.grant)} ÷ ${x.window} = ${sh(x.perYear)}; נצברו ${x.served} שנים (מגיל ${x.start} עד ${p.age}) → ${sh(x.accrued)}.`,
            `היוון ${x.n} שנים (מגיל ${p.age} עד ${rule.retire}) והסתברות: ${sh(x.accrued)} ÷ ${f1(d.rate)}^${x.n} × ${pct(p.stay)} = ${sh(x.obligation)}.`,
          ],
        };
      }),
      { title: "סך הכול", lines: [`${rows.map((x) => sh(x.obligation)).join(" + ")} = ${sh(total)}.`] },
    ],
    table: {
      head: ["עובד", "צובר מגיל", "עד גיל", "לשנה", "נצברו", "n", "הסתברות", "התחייבות"],
      rows: d.people.map((p, k) => [p.id, rows[k].start, rows[k].end, Math.round(rows[k].perYear), rows[k].served, rows[k].n, pct(p.stay), Math.round(rows[k].obligation)]),
      foot: ["סה״כ", "", "", "", "", "", "", Math.round(total)],
    },
  };
}

// ---------------------------------------------------------------------------
// Attribution: tiers, the plan's formula or straight line, and a cap.

export type TiersDraw = { first: { upTo: number; perYear: number }; later: number; cap?: number; expected: number; served: number; rate: number };

export function tiersDraw(r: Rand): TiersDraw {
  const upTo = pick(r, [3, 4, 6]);
  const perYear = pick(r, [1_500, 2_500, 3_000, 3_500, 5_000, 6_000]);
  const back = r() < 0.5;
  const later = Math.round((perYear * (back ? pick(r, [2, 2.5, 3]) : pick(r, [0.4, 0.5, 0.6]))) / 100) * 100;
  const expected = int(r, upTo + 4, upTo + 10);
  const f = tiered([{ upTo, perYear }, { perYear: later }]);
  // A cap in some draws, reached a year or more before retirement.
  const cap = r() < 0.5 ? f(int(r, upTo + 1, expected - 1)) : undefined;
  return { first: { upTo, perYear }, later, cap, expected, served: int(r, 2, expected - 1), rate: pick(r, [0.035, 0.045, 0.055, 0.06]) };
}

export function tiersFigures(d: TiersDraw) {
  const f = tiered([d.first, { perYear: d.later }]);
  const cap = d.cap ?? Infinity;
  const a = attribution(f, d.expected, cap);
  const acc = accrued(a, f, d.served, cap);
  const n = d.expected - d.served;
  return { f, a, back: backLoaded(f, d.expected), accrued: acc, n, obligation: pv(acc, d.rate, n), uncapped: f(d.expected) };
}

export function tiersDrill(r: Rand): Drill {
  const d = tiersDraw(r);
  const F = tiersFigures(d);
  const capText = d.cap ? ` תקרת המענק: ${fmt(d.cap)} ₪.` : " אין תקרה.";
  const formulaLine =
    `${d.first.upTo} × ${fmt(d.first.perYear)} + ${d.expected - d.first.upTo} × ${fmt(d.later)} = ${sh(F.uncapped)}` + (d.cap && F.uncapped > d.cap ? ` → התקרה חותכת ל-${sh(d.cap)}.` : ".");
  const firstPart = Math.min(d.served, d.first.upTo);
  const laterPart = Math.max(0, d.served - d.first.upTo);
  return {
    family: "tiers",
    title: DRILL_TITLES.tiers,
    story: [
      `החברה משלמת בפרישה מענק חד־פעמי לפי הוותק: ${fmt(d.first.perYear)} ₪ לכל אחת מ-${d.first.upTo} שנות העבודה הראשונות, ו-${fmt(d.later)} ₪ לכל שנה אחריהן.${capText}`,
      `העובד צבר עד היום ${d.served} שנות עבודה, והחברה מעריכה שיפרוש אחרי ${d.expected} שנות עבודה. שיעור ההיוון ${pct(d.rate)}. מה ההתחייבות היום?`,
    ],
    asks: [
      { kind: "choice", id: "method", label: "איך משייכים את המענק לשנות השירות?", options: ["לפי נוסחת התוכנית", "בקו ישר"], answer: F.a.method === "straight" ? 1 : 0 },
      { kind: "number", id: "accrued", label: "מה נצבר עד היום, לפני היוון", answer: F.accrued, unit: "₪" },
      { kind: "number", id: "obligation", label: "ההתחייבות היום", answer: F.obligation, unit: "₪" },
    ],
    seek: ["כמה מהמענק שייך לשנים שכבר עבד — ובערך נוכחי."],
    check: [
      "השנים המאוחרות נותנות הטבה גבוהה מהותית? אם כן — קו ישר (סעיף 73); אם לא — נוסחת התוכנית.",
      "יש תקרה? היא חותכת את המענק ומקצרת את חלון הצבירה — השנים שאחריה לא מוסיפות.",
      `ההיוון — על השנים עד הפרישה (${F.n}), לא על הוותק.`,
    ],
    build: [
      {
        title: "(א) נוסחה או קו ישר",
        lines: [
          F.back
            ? `השנים המאוחרות נותנות ${fmt(d.later)} ₪ מול ${fmt(d.first.perYear)} ₪ בהתחלה — גבוה מהותית. בלי קו ישר, השנים הראשונות היו מקבלות מעט מדי → קו ישר.`
            : `השנים המאוחרות נותנות פחות (${fmt(d.later)} ₪ מול ${fmt(d.first.perYear)} ₪) → לפי נוסחת התוכנית.`,
        ],
      },
      {
        title: "(ב) המענק הצפוי והחלון",
        lines: [formulaLine, F.a.window < d.expected ? `התקרה מושגת אחרי ${F.a.window} שנים — החלון נגמר שם.` : `חלון הצבירה: כל ${d.expected} השנים.`],
      },
      {
        title: "(ג) מה נצבר",
        lines:
          F.a.method === "straight"
            ? [`${sh(F.a.total)} ÷ ${F.a.window} = ${sh(F.a.perYear!)} לשנה.`, `× ${Math.min(d.served, F.a.window)} שנים = ${sh(F.accrued)}.`]
            : [
                `לפי הנוסחה: ${firstPart} × ${fmt(d.first.perYear)}${laterPart ? ` + ${laterPart} × ${fmt(d.later)}` : ""} = ${sh(Math.min(F.f(d.served), Infinity))}${d.cap && F.f(d.served) > d.cap ? ` → עד התקרה: ${sh(d.cap)}` : ""}.`,
              ],
      },
      { title: "(ד) היוון", lines: [`${sh(F.accrued)} ÷ ${f1(d.rate)}^${F.n} = ${sh(F.obligation)}.`] },
    ],
  };
}

export const DRILLS: Record<DrillFamily, (r: Rand) => Drill> = {
  classify: classifyDrill,
  dc: dcDrill,
  puc: pucDrill,
  window: windowDrill,
  tiers: tiersDrill,
};

export const makeDrill = (family: DrillFamily, seed: number) => DRILLS[family](seeded(seed));
