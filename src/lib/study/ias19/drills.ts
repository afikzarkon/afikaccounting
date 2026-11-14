import { accrued, amendedYear, assetsYear, attribution, backLoaded, grown, plainYear, pv, recognisedAssets, retirementPN, settlementGain, tiered } from "@/lib/learn/ias19";
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

export type DrillFamily = "classify" | "dc" | "puc" | "window" | "tiers" | "year" | "payint" | "amend" | "settle" | "assets" | "ceiling" | "award" | "term";

export const DRILL_TITLES: Record<DrillFamily, string> = {
  classify: "סיווג: הפקדה מוגדרת או הטבה מוגדרת",
  dc: "רישום הפקדה מוגדרת",
  puc: "מדידת התחייבות לעובד אחד",
  window: "ייחוס: שני מסלולים לזכאות",
  tiers: "ייחוס: נוסחת התוכנית או קו ישר",
  year: "תנועה בהתחייבות לשנה",
  payint: "ריבית עם תשלום באמצע השנה",
  amend: "שינוי תנאים באמצע השנה",
  settle: "סילוק מול פרישה לפי התנאים",
  assets: "תנועה בנכסי התכנית",
  ceiling: "עודף ותקרת הנכס",
  award: "מענק יובל שעלה באמצע השנה",
  term: "הטבת פיטורין: מתי ובכמה",
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
    advance: "ההפקדה של כל חודש מועברת ב-10 לחודש שאחריו — אבל בסוף דצמבר העבירה החברה, בנוסף, גם את ההפקדה של דצמבר עצמו, ומראש את ההפקדה של ינואר הבא.",
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
              : `${F.months - 1} חודשים הועברו כרגיל (עד נובמבר), ובסוף דצמבר עוד דצמבר עצמו וינואר הבא מראש — ${F.paidMonths} חודשים: ${sh(F.paid)}.`,
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

// ---------------------------------------------------------------------------
// A year's roll-forward: current service, interest, the closing and the P.N.

export type YearDraw = { role: (typeof ROLES)[number]; share: number; salary: number; growth: number; from: number; total: number; r0: number; r1: number; later: boolean };

export function yearDraw(r: Rand): YearDraw {
  const r0 = pick(r, [0.055, 0.06, 0.065, 0.075]);
  return {
    role: pick(r, ROLES),
    share: pick(r, [0.04, 0.06, 0.075]),
    salary: step(r, 216_000, 600_000, 12_000),
    growth: pick(r, [0.015, 0.025, 0.03, 0.035]),
    from: int(r, 2021, 2025),
    total: int(r, 4, 9),
    r0,
    r1: r0 + pick(r, [-0.015, -0.01, -0.005, 0.005, 0.01]),
    later: r() < 0.5,
  };
}

/** The second year of service: opening (one year, at the first year-end rate), service and interest at that rate, the closing at the second year-end, and the P.N. */
export function yearFigures(d: YearDraw) {
  const unit = d.share * grown(d.salary, d.growth, d.total - 1);
  const n0 = d.total - 1;
  const opening = pv(unit, d.r0, n0);
  const service = pv(unit, d.r0, n0 - 1);
  const interest = opening * d.r0;
  const total = d.later ? d.total + 1 : d.total;
  const unitEnd = d.share * grown(d.salary, d.growth, total - 1);
  const nEnd = total - 2;
  const closing = pv(unitEnd * 2, d.r1, nEnd);
  return { unit, n0, opening, service, interest, unitEnd, nEnd, closing, pn: closing - opening - service - interest };
}

export function yearDrill(r: Rand): Drill {
  const d = yearDraw(r);
  const F = yearFigures(d);
  const v = (m: string, f: string) => (d.role.f ? f : m);
  const y1 = d.from + 1;
  const retire = d.from + d.total - 1;
  const loss = F.pn > 0;
  return {
    family: "year",
    title: DRILL_TITLES.year,
    story: [
      `${d.role.role} ${v("זכאי", "זכאית")} בסיום ההעסקה למענק חד־פעמי: ${pct(d.share)} מהשכר השנתי האחרון על כל שנת עבודה. ${v("הוא החל", "היא החלה")} לעבוד ב-1.1.${d.from}.`,
      `השכר השנתי ב-${d.from}: ${fmt(d.salary)} ₪, והחברה צופה עלייה של ${pct(d.growth)} בכל ינואר. ב-31.12.${d.from} הוערך מועד הפרישה ל-31.12.${retire}, ושיעור ההיוון היה ${pct(d.r0)}.`,
      d.later
        ? `ב-31.12.${y1} עודכנו ההנחות: הפרישה נדחתה בשנה, ל-31.12.${retire + 1}, ושיעור ההיוון ${pct(d.r1)}.`
        : `ב-31.12.${y1} מועד הפרישה לא השתנה, ושיעור ההיוון ${pct(d.r1)}.`,
      `ערכו את התנועה בהתחייבות לשנת ${y1}.`,
    ],
    asks: [
      { kind: "number", id: "opening", label: `היתרה ב-31.12.${d.from}`, answer: F.opening, unit: "₪" },
      { kind: "number", id: "service", label: `עלות שירות שוטף ${y1}`, answer: F.service, unit: "₪" },
      { kind: "number", id: "interest", label: `הוצאות ריבית ${y1}`, answer: F.interest, unit: "₪" },
      { kind: "number", id: "closing", label: `היתרה ב-31.12.${y1}`, answer: F.closing, unit: "₪" },
      { kind: "number", id: "pn", label: "רווח או הפסד ממדידה מחדש (בערך מוחלט)", answer: Math.abs(F.pn), unit: "₪" },
      { kind: "choice", id: "pnSide", label: "המדידה מחדש היא", options: ["הפסד, ל-OCI", "רווח, ל-OCI", "הפסד, לרווח והפסד", "רווח, לרווח והפסד"], answer: loss ? 0 : 1 },
    ],
    seek: [`ארבע שורות בתנועה של ${y1}: עלות שירות שוטף, ריבית, הסגירה, ומה שמאזן אותן — המדידה מחדש.`],
    check: [
      "עלות שירות וריבית — לפי ההנחות של תחילת השנה (השיעור של 31.12 של השנה הקודמת).",
      "עלות השירות מהוונת מסוף השנה עד התשלום; הריבית — על יתרת הפתיחה.",
      "הסגירה — לפי ההנחות של סוף השנה: השיעור החדש, ומועד הפרישה החדש (שמשנה גם את השכר הצפוי).",
      "מה שלא מוסבר בשירות ובריבית הוא מדידה מחדש: עלייה בהתחייבות = הפסד, ל-OCI (סעיף 57(ד)).",
    ],
    build: [
      { title: "① יחידת זכאות", lines: [`${pct(d.share)} × ${fmt(d.salary)} × ${f1(d.growth)}^${d.total - 1} = ${sh(F.unit)}.`] },
      { title: "② הפתיחה", lines: [`שנה אחת נצברה; ${F.n0} שנים עד הפרישה: ${sh(F.unit)} ÷ ${f1(d.r0)}^${F.n0} = ${sh(F.opening)}.`] },
      { title: "③ עלות שירות שוטף", lines: [`יחידה אחת, בשיעור של תחילת השנה, מסוף ${y1}: ${sh(F.unit)} ÷ ${f1(d.r0)}^${F.n0 - 1} = ${sh(F.service)}.`] },
      { title: "④ ריבית", lines: [`${sh(F.opening)} × ${pct(d.r0)} = ${sh(F.interest)}.`] },
      {
        title: "⑤ הסגירה",
        lines: [
          d.later ? `הפרישה נדחתה: יחידה חדשה ${pct(d.share)} × ${fmt(d.salary)} × ${f1(d.growth)}^${d.total} = ${sh(F.unitEnd)}.` : "ההנחות על הפרישה לא השתנו — אותה יחידה.",
          `שתי שנים נצברו: ${sh(F.unitEnd)} × 2 ÷ ${f1(d.r1)}^${F.nEnd} = ${sh(F.closing)}.`,
        ],
      },
      {
        title: "⑥ המדידה מחדש — השורה המאזנת",
        lines: [`${sh(F.closing)} − ${sh(F.opening)} − ${sh(F.service)} − ${sh(F.interest)} = ${loss ? "" : "−"}${sh(Math.abs(F.pn))} → ${loss ? "הפסד" : "רווח"}, ל-OCI.`, "שירות — לשכר; ריבית — למימון או לשכר (עם גילוי נפרד)."],
      },
    ],
    table: {
      head: ["שורה", "סכום"],
      rows: [
        [`יתרה 31.12.${d.from}`, Math.round(F.opening)],
        ["עלות שירות שוטף", Math.round(F.service)],
        ["ריבית", Math.round(F.interest)],
        [`מדידה מחדש (${loss ? "הפסד" : "רווח"})`, Math.round(F.pn)],
      ],
      foot: [`יתרה 31.12.${y1}`, Math.round(F.closing)],
    },
  };
}

// ---------------------------------------------------------------------------
// Interest when benefits are paid during the year (IAS 19.123).

export type PayDraw = { opening: number; rate: number; paid: number; month: number };

export function payDraw(r: Rand): PayDraw {
  const opening = step(r, 120_000, 900_000, 10_000);
  return { opening, rate: pick(r, [0.045, 0.055, 0.06, 0.065, 0.07]), paid: step(r, opening / 10, opening / 3, 1_000), month: pick(r, [2, 3, 5, 6, 7, 8, 9, 10]) };
}

export function payFigures(d: PayDraw) {
  const months = 13 - d.month;
  const onOpening = d.opening * d.rate;
  const onPaid = d.paid * ((1 + d.rate) ** (months / 12) - 1);
  return { months, onOpening, onPaid, interest: onOpening - onPaid };
}

export function payDrill(r: Rand): Drill {
  const d = payDraw(r);
  const F = payFigures(d);
  return {
    family: "payint",
    title: DRILL_TITLES.payint,
    story: [
      `יתרת ההתחייבות בגין הטבה מוגדרת ב-1.1: ${fmt(d.opening)} ₪. שיעור ההיוון שלפיו נמדדה: ${pct(d.rate)}.`,
      `ב-1.${d.month} שילמה החברה מענק של ${fmt(d.paid)} ₪ לעובד שפרש, כצפוי. מה הוצאות הריבית של השנה?`,
    ],
    asks: [
      { kind: "number", id: "onOpening", label: "ריבית על הפתיחה, לשנה שלמה", answer: F.onOpening, unit: "₪" },
      { kind: "number", id: "onPaid", label: "הריבית שנחסכה על התשלום", answer: F.onPaid, unit: "₪" },
      { kind: "number", id: "interest", label: "הוצאות הריבית", answer: F.interest, unit: "₪" },
    ],
    seek: ["הריבית על ההתחייבות: חלוף הזמן על היתרה, בשיעור של תחילת התקופה, בניכוי התשלומים מיום ששולמו (סעיף 123)."],
    check: [
      "על איזו יתרה? הפתיחה — לא הסגירה.",
      "באיזה שיעור? השיעור שלפיו נמדדה הפתיחה.",
      `כמה חודשים התשלום כבר לא נושא ריבית? מ-1.${d.month} עד סוף השנה: ${F.months}.`,
      "ריבית לחלק משנה — בריבית דריבית: (1+i)^(חודשים/12) − 1, לא i × חודשים/12.",
    ],
    build: [
      { title: "1. על הפתיחה", lines: [`${fmt(d.opening)} × ${pct(d.rate)} = ${sh(F.onOpening)}.`] },
      { title: "2. על התשלום", lines: [`${fmt(d.paid)} × (${f1(d.rate)}^(${F.months}/12) − 1) = ${sh(F.onPaid)}.`] },
      { title: "3. הריבית", lines: [`${sh(F.onOpening)} − ${sh(F.onPaid)} = ${sh(F.interest)}.`] },
    ],
  };
}

// ---------------------------------------------------------------------------
// An amendment during the year: service in two periods, past service, interest in two parts.

export type AmendDraw = { oldPer: number; newPer: number; from: number; years: number; month: number; r0: number; ra: number; rEnd: number };

export function amendDraw(r: Rand): AmendDraw {
  const oldPer = step(r, 30_000, 120_000, 5_000);
  const ra = pick(r, [0.045, 0.055, 0.065, 0.075]);
  return {
    oldPer,
    newPer: oldPer + step(r, 10_000, 50_000, 5_000),
    from: int(r, 2021, 2025),
    years: int(r, 4, 8),
    month: pick(r, [2, 3, 5, 6, 7, 8, 9]),
    r0: ra + pick(r, [0.005, 0.01, 0.015]),
    ra,
    rEnd: r() < 0.6 ? ra : ra - 0.005,
  };
}

export function amendFigures(d: AmendDraw) {
  const opening = pv(d.oldPer, d.r0, d.years);
  const y = amendedYear({ opening, iStart: d.r0, iAmend: d.ra, iEnd: d.rEnd, months: d.month - 1, oldPerYear: d.oldPer, newPerYear: d.newPer, servedAtStart: 1, nEnd: d.years - 1 });
  return { opening, ...y, before: d.month - 1, after: 13 - d.month, nAmend: d.years - 1 + (13 - d.month) / 12 };
}

export function amendDrill(r: Rand): Drill {
  const d = amendDraw(r);
  const F = amendFigures(d);
  const y1 = d.from + 1;
  const loss = F.pn > 0;
  const m = (k: number) => `${k}/12`;
  const nA = `(${d.years - 1} + ${F.after}/12)`;
  const sA = `(1 + ${F.before}/12)`;
  return {
    family: "amend",
    title: DRILL_TITLES.amend,
    story: [
      `מנהל התפעול החל לעבוד ב-1.1.${d.from}, וזכאי בפרישה למענק של ${fmt(d.oldPer)} ₪ על כל שנת עבודה. ב-31.12.${d.from} הוערך שיפרוש בעוד ${d.years} שנים; שיעור ההיוון ${pct(d.r0)}.`,
      `ב-1.${d.month}.${y1} החליטה החברה להגדיל את המענק ל-${fmt(d.newPer)} ₪ לשנה — גם על השנים שכבר עבד. שיעור ההיוון ביום השינוי ${pct(d.ra)}${d.rEnd === d.ra ? " ועד סוף השנה" : `, וב-31.12.${y1} — ${pct(d.rEnd)}`}. מועד הפרישה לא השתנה.`,
      `ערכו את התנועה בהתחייבות לשנת ${y1}.`,
    ],
    asks: [
      { kind: "number", id: "opening", label: `היתרה ב-31.12.${d.from}`, answer: F.opening, unit: "₪" },
      { kind: "number", id: "service", label: "עלות שירות שוטף (שתי התקופות)", answer: F.service, unit: "₪" },
      { kind: "number", id: "past", label: "עלות שירות עבר", answer: F.pastService, unit: "₪" },
      { kind: "number", id: "interest", label: "הוצאות ריבית (שני החלקים)", answer: F.interest, unit: "₪" },
      { kind: "number", id: "closing", label: `היתרה ב-31.12.${y1}`, answer: F.closing, unit: "₪" },
      { kind: "number", id: "pn", label: "מדידה מחדש (בערך מוחלט)", answer: Math.abs(F.pn), unit: "₪" },
    ],
    seek: ["תנועה של שנה שהשינוי חוצה: שירות שוטף ושני חלקי ריבית לפני ואחרי, שירות עבר ביום השינוי, הסגירה, והמדידה מחדש שמאזנת."],
    check: [
      `השינוי ב-1.${d.month} מפצל את השנה: ${F.before} חודשים בתנאים הישנים, ${F.after} בחדשים.`,
      "לכל תקופה — התנאים שלה, השיעור של תחילתה, וההיוון מסוף התקופה עד הפרישה.",
      "שירות עבר = ההתחייבות אחרי השינוי פחות לפניו — שתיהן ביום השינוי, באותו שיעור ובאותו n. לרווח והפסד, כהוצאות שכר.",
      "ריבית: על הפתיחה עד השינוי; ומהשינוי — על ההתחייבות אחרי השינוי, בשיעור החדש.",
    ],
    build: [
      { title: "① הפתיחה", lines: [`${fmt(d.oldPer)} × 1 ÷ ${f1(d.r0)}^${d.years} = ${sh(F.opening)}.`] },
      {
        title: "② עלות שירות שוטף",
        lines: [
          `עד השינוי: ${fmt(d.oldPer)} × ${m(F.before)} ÷ ${f1(d.r0)}^${nA} = ${sh(F.serviceBefore)}.`,
          `אחרי השינוי: ${fmt(d.newPer)} × ${m(F.after)} ÷ ${f1(d.ra)}^${d.years - 1} = ${sh(F.serviceAfter)}.`,
          `סה״כ ${sh(F.service)}.`,
        ],
      },
      {
        title: "③ עלות שירות עבר (ביום השינוי)",
        lines: [
          `ותק ביום השינוי: ${sA} שנים; n = ${nA}; שיעור ${pct(d.ra)}.`,
          `לפני: ${fmt(d.oldPer)} × ${sA} ÷ ${f1(d.ra)}^${nA} = ${sh(F.pastBefore)}.`,
          `אחרי: ${fmt(d.newPer)} × ${sA} ÷ ${f1(d.ra)}^${nA} = ${sh(F.pastAfter)}.`,
          `שירות עבר: ${sh(F.pastService)}.`,
        ],
      },
      {
        title: "④ ריבית",
        lines: [
          `עד השינוי: ${sh(F.opening)} × (${f1(d.r0)}^(${m(F.before)}) − 1) = ${sh(F.interestBefore)}.`,
          `אחרי: ${sh(F.pastAfter)} × (${f1(d.ra)}^(${m(F.after)}) − 1) = ${sh(F.interestAfter)}.`,
          `סה״כ ${sh(F.interest)}.`,
        ],
      },
      { title: "⑤ הסגירה", lines: [`${fmt(d.newPer)} × 2 ÷ ${f1(d.rEnd)}^${d.years - 1} = ${sh(F.closing)}.`] },
      { title: "⑥ מדידה מחדש", lines: [`${sh(F.closing)} − ${sh(F.opening)} − ${sh(F.service)} − ${sh(F.pastService)} − ${sh(F.interest)} = ${loss ? "" : "−"}${sh(Math.abs(F.pn))} → ${loss ? "הפסד" : "רווח"}, ל-OCI.`] },
    ],
    table: {
      head: ["שורה", "סכום"],
      rows: [
        [`יתרה 31.12.${d.from}`, Math.round(F.opening)],
        ["עלות שירות שוטף", Math.round(F.service)],
        ["ריבית", Math.round(F.interest)],
        ["עלות שירות עבר", Math.round(F.pastService)],
        [`מדידה מחדש (${loss ? "הפסד" : "רווח"})`, Math.round(F.pn)],
      ],
      foot: [`יתרה 31.12.${y1}`, Math.round(F.closing)],
    },
  };
}

// ---------------------------------------------------------------------------
// Settlement against a retirement on the plan's terms.

export type SettleDraw = { perYear: number; served: number; n: number; rate: number; price: number };

export function settleDraw(r: Rand): SettleDraw {
  const perYear = step(r, 40_000, 140_000, 5_000);
  const served = int(r, 2, 6);
  const n = int(r, 2, 7);
  const rate = pick(r, [0.045, 0.055, 0.065, 0.075]);
  const books = pv(perYear * served, rate, n);
  return { perYear, served, n, rate, price: Math.round((books * pick(r, [0.85, 0.9, 0.95, 1.05, 1.1])) / 1_000) * 1_000 };
}

export function settleFigures(d: SettleDraw) {
  const books = pv(d.perYear * d.served, d.rate, d.n);
  const gain = settlementGain(books, d.price);
  const paidOnTerms = d.perYear * d.served;
  return { books, gain, paidOnTerms, pn: retirementPN(books, paidOnTerms) };
}

export function settleDrill(r: Rand): Drill {
  const d = settleDraw(r);
  const F = settleFigures(d);
  const gain = F.gain > 0;
  return {
    family: "settle",
    title: DRILL_TITLES.settle,
    story: [
      `סמנכ״לית המכירות זכאית בפרישה למענק של ${fmt(d.perYear)} ₪ על כל שנת עבודה. ב-31.12 היא צברה ${d.served} שנים, וצפויה לפרוש בעוד ${d.n} שנים; שיעור ההיוון ${pct(d.rate)}.`,
      `א. ב-1.1 סיכמה איתה החברה לבטל את סעיף המענק, ושילמה לה במקומו ${fmt(d.price)} ₪.`,
      `ב. במקום זאת: ב-1.1 היא פרשה במפתיע, וקיבלה את המענק לפי ההסכם.`,
    ],
    asks: [
      { kind: "number", id: "books", label: "ההתחייבות בספרים ביום האירוע", answer: F.books, unit: "₪" },
      { kind: "number", id: "settle", label: "א. רווח או הפסד מסילוק (בערך מוחלט)", answer: Math.abs(F.gain), unit: "₪" },
      { kind: "choice", id: "settleSide", label: "א. הוא", options: ["רווח, ברווח והפסד", "הפסד, ברווח והפסד", "רווח, ב-OCI", "הפסד, ב-OCI"], answer: gain ? 0 : 1 },
      { kind: "number", id: "pn", label: "ב. ההפרש בין התשלום לספרים", answer: F.pn, unit: "₪" },
      { kind: "choice", id: "pnSide", label: "ב. הוא", options: ["הפסד ממדידה מחדש, ב-OCI", "הפסד מסילוק, ברווח והפסד", "עלות שירות עבר", "אין הפרש"], answer: 0 },
    ],
    seek: ["מה סוגר את ההתחייבות, ולאן הולך ההפרש בין מה ששולם לבין מה שבספרים."],
    check: [
      "קודם — ההתחייבות בספרים ביום האירוע.",
      "סילוק = עסקה שמבטלת את המחויבות, מחוץ לתנאי התוכנית (סעיף 111). ההפרש מול מחיר הסילוק — לרווח והפסד, בהוצאות השכר (סעיף 109).",
      "תשלום לפי תנאי התוכנית, גם אם מוקדם מהצפוי, אינו סילוק: ההפרש הוא שינוי אומדן — מדידה מחדש, ב-OCI.",
    ],
    build: [
      { title: "1. ההתחייבות בספרים", lines: [`${fmt(d.perYear)} × ${d.served} ÷ ${f1(d.rate)}^${d.n} = ${sh(F.books)}.`] },
      {
        title: "א. סילוק",
        lines: [
          `${sh(F.books)} − ${fmt(d.price)} = ${gain ? "" : "−"}${sh(Math.abs(F.gain))} → ${gain ? "רווח" : "הפסד"} מסילוק, ברווח והפסד.`,
          gain
            ? `ח׳ התחייבות ${sh(F.books)} · ז׳ מזומן ${sh(d.price)} · ז׳ רווח מסילוק (הוצאות שכר) ${sh(F.gain)}.`
            : `ח׳ התחייבות ${sh(F.books)} · ח׳ הפסד מסילוק (הוצאות שכר) ${sh(-F.gain)} · ז׳ מזומן ${sh(d.price)}.`,
        ],
      },
      {
        title: "ב. פרישה לפי התנאים",
        lines: [
          `התשלום לפי ההסכם: ${fmt(d.perYear)} × ${d.served} = ${sh(F.paidOnTerms)}, בלי היוון — הוא משולם היום.`,
          `${sh(F.paidOnTerms)} − ${sh(F.books)} = ${sh(F.pn)} → הפסד ממדידה מחדש, ב-OCI.`,
          `ח׳ התחייבות ${sh(F.books)} · ח׳ OCI ${sh(F.pn)} · ז׳ מזומן ${sh(F.paidOnTerms)}.`,
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Plan assets beside the obligation: two roll-forwards, the net liability, and the year in the statements.

export type AssetsDraw = { grant: number; years: number; n: number; rate: number; opening: number; contribution: number; month: number; paidFromFund: number; closing: number };

export function assetsDraw(r: Rand): AssetsDraw {
  const years = pick(r, [8, 12, 15, 20]);
  const grant = years * step(r, 10_000, 30_000, 1_000);
  const rate = pick(r, [0.045, 0.055, 0.06, 0.065]);
  const n = int(r, 12, 30);
  // The fund holds less than the obligation, so there is a net liability and a net interest expense.
  const obligation = pv(grant / years, rate, n);
  const opening = Math.max(500, Math.round((obligation * pick(r, [0.3, 0.4, 0.5, 0.6])) / 100) * 100);
  const contribution = Math.max(100, Math.round((obligation * pick(r, [0.1, 0.15, 0.2])) / 100) * 100);
  const paidFromFund = 0;
  const month = pick(r, [2, 3, 5, 6, 7, 9]);
  const expected = opening + opening * rate + contribution - paidFromFund;
  return { grant, years, n, rate, opening, contribution, month, paidFromFund, closing: Math.round((expected * (1 + pick(r, [-0.08, -0.04, 0.05, 0.1, 0.15]))) / 100) * 100 };
}

export function assetsFigures(d: AssetsDraw) {
  const perYear = d.grant / d.years;
  const opening = pv(perYear, d.rate, d.n);
  const y = plainYear({ opening, i: d.rate, perYear, servedAtStart: 1, nEnd: d.n - 1, payments: d.paidFromFund });
  const a = assetsYear({ opening: d.opening, periods: [{ months: 12, i: d.rate }], contributions: [{ amount: d.contribution, month: d.month - 1 }], paidFromAssets: d.paidFromFund, closing: d.closing });
  const onOpening = d.opening * d.rate;
  const onContribution = d.contribution * ((1 + d.rate) ** ((13 - d.month) / 12) - 1);
  const pnObligation = y.closing - opening - y.service - y.interest + d.paidFromFund;
  return { perYear, opening, ...y, pnObligation, a, onOpening, onContribution, netOpening: opening - d.opening, netClosing: y.closing - d.closing, netInterest: y.interest - a.interest };
}

export function assetsDrill(r: Rand): Drill {
  const d = assetsDraw(r);
  const F = assetsFigures(d);
  const gain = F.a.pn > 0;
  const months = 13 - d.month;
  return {
    family: "assets",
    title: DRILL_TITLES.assets,
    story: [
      `לפי ההסכם עם עובד שהחל לעבוד ב-1.1 בשנה שעברה, הוא יקבל בפרישה מענק של ${fmt(d.grant)} ₪ על ${d.years} שנות עבודה רצופות. ב-31.12 של השנה שעברה נשארו ${d.n} שנים עד הפרישה. שיעור ההיוון ${pct(d.rate)}, ושום הערכה לא השתנתה השנה.`,
      `שווי נכסי התכנית בסוף השנה שעברה: ${fmt(d.opening)} ₪. ב-1.${d.month} הפקידה החברה ${fmt(d.contribution)} ₪.${d.paidFromFund ? ` בסוף השנה שילמה הקרן ${fmt(d.paidFromFund)} ₪ לעובד אחר שפרש, כצפוי (ההתחייבות כללה אותו).` : ""} השווי ההוגן בסוף השנה: ${fmt(d.closing)} ₪.`,
      "ערכו תנועה בהתחייבות ובנכסי התכנית, ומצאו את ההשפעה על הדוחות.",
    ],
    asks: [
      { kind: "number", id: "income", label: "הכנסות ריבית מנכסי התכנית", answer: F.a.interest, unit: "₪" },
      { kind: "number", id: "pnA", label: "מדידה מחדש של הנכסים (בערך מוחלט)", answer: Math.abs(F.a.pn), unit: "₪" },
      { kind: "choice", id: "pnSide", label: "המדידה מחדש של הנכסים היא", options: ["רווח, ל-OCI", "הפסד, ל-OCI", "רווח, לרווח והפסד", "הפסד, לרווח והפסד"], answer: gain ? 0 : 1 },
      { kind: "number", id: "netInterest", label: "ריבית נטו ברווח והפסד (הוצאה)", answer: F.netInterest, unit: "₪" },
      { kind: "number", id: "net", label: "ההתחייבות נטו במאזן בסוף השנה", answer: F.netClosing, unit: "₪" },
    ],
    seek: ["שתי תנועות נפרדות — להתחייבות ולנכסים — ובמאזן ההתחייבות בניכוי הנכסים (סעיף 113)."],
    check: [
      "הכנסות ריבית — באותו שיעור כמו ההתחייבות (סעיף 125), על הפתיחה ועל הפקדה מיום שהופקדה, בריבית דריבית.",
      "מהנכסים יורד רק מה שהקרן שילמה; מההתחייבות — כל מה ששולם לעובדים.",
      "התשואה בפועל מעבר להכנסות הריבית — מדידה מחדש, ב-OCI (סעיף 127).",
      "ברווח והפסד: עלות שירות, וריבית נטו (הוצאות ריבית פחות הכנסות ריבית).",
    ],
    build: [
      { title: "① ההתחייבות", lines: [`צבירה לשנה: ${fmt(d.grant)} ÷ ${d.years} = ${sh(F.perYear)}.`, `פתיחה: ${sh(F.perYear)} ÷ ${f1(d.rate)}^${d.n} = ${sh(F.opening)}; עלות שירות: ÷ ${f1(d.rate)}^${d.n - 1} = ${sh(F.service)}; ריבית: ${sh(F.opening)} × ${pct(d.rate)} = ${sh(F.interest)}.`, `סגירה: ${sh(F.perYear)} × 2 ÷ ${f1(d.rate)}^${d.n - 1} = ${sh(F.closing)}${d.paidFromFund ? "" : " — בלי מדידה מחדש, כי שום הנחה לא השתנתה"}.`] },
      { title: "② הכנסות ריבית", lines: [`על הפתיחה: ${fmt(d.opening)} × ${pct(d.rate)} = ${sh(F.onOpening)}.`, `על ההפקדה, ${months} חודשים: ${fmt(d.contribution)} × (${f1(d.rate)}^(${months}/12) − 1) = ${sh(F.onContribution)}.`, `סה״כ ${sh(F.a.interest)}.`] },
      { title: "③ מדידה מחדש של הנכסים", lines: [`${fmt(d.closing)} − ${fmt(d.opening)} − ${sh(F.a.interest)} − ${fmt(d.contribution)}${d.paidFromFund ? ` + ${fmt(d.paidFromFund)}` : ""} = ${gain ? "" : "−"}${sh(Math.abs(F.a.pn))} → ${gain ? "רווח" : "הפסד"}, ל-OCI.`] },
      { title: "④ הדוחות", lines: [`ריבית נטו: ${sh(F.interest)} − ${sh(F.a.interest)} = ${sh(F.netInterest)} הוצאה; עלות שירות ${sh(F.service)} — שכר.`, `במאזן: ${sh(F.closing)} − ${fmt(d.closing)} = ${sh(F.netClosing)} התחייבות נטו.`, "ההפקדה: ח׳ נכסי תכנית · ז׳ מזומן." + (d.paidFromFund ? " התשלום מהקרן: ח׳ התחייבות · ז׳ נכסי תכנית." : "")] },
    ],
    table: {
      head: ["שורה", "התחייבות", "נכסי תכנית"],
      rows: [
        ["פתיחה", Math.round(F.opening), d.opening],
        ["עלות שירות שוטף", Math.round(F.service), "—"],
        ["ריבית", Math.round(F.interest), Math.round(F.a.interest)],
        ["הפקדה", "—", d.contribution],
        ...(d.paidFromFund ? [["שולם מהקרן", -d.paidFromFund, -d.paidFromFund] as (string | number)[]] : []),
        ["מדידה מחדש", Math.round(F.pnObligation), Math.round(F.a.pn)],
      ],
      foot: ["סגירה", Math.round(F.closing), d.closing],
    },
  };
}

// ---------------------------------------------------------------------------
// A surplus and the asset ceiling.

export type CeilingDraw = { obligation: number; rate: number; service: number; lossObl: number; assets: number; closingAssets: number; share: number };

export function ceilingDraw(r: Rand): CeilingDraw {
  const obligation = step(r, 30_000, 120_000, 2_000);
  const rate = pick(r, [0.06, 0.07, 0.08, 0.09]);
  const share = pick(r, [0.03, 0.04, 0.06, 0.08]);
  const service = step(r, obligation / 5, obligation / 2, 1_000);
  const lossObl = step(r, 1_000, obligation / 5, 1_000);
  const closingObl = obligation * (1 + rate) + service + lossObl;
  // An opening surplus above the ceiling; a closing surplus either side of it.
  const assets = Math.round((obligation * (1 + share + pick(r, [0.04, 0.06, 0.1]))) / 1_000) * 1_000;
  const closingAssets = Math.round((closingObl * (1 + share * pick(r, [0.4, 0.6, 1.5, 2]))) / 1_000) * 1_000;
  return { obligation, rate, service, lossObl, assets, closingAssets, share };
}

export function ceilingFigures(d: CeilingDraw) {
  const interestCost = d.obligation * d.rate;
  const closingObl = d.obligation + interestCost + d.service + d.lossObl;
  const ceilingOpen = d.share * d.obligation;
  const ceilingClose = d.share * closingObl;
  const openAssets = recognisedAssets(d.assets, d.obligation, ceilingOpen);
  const closeAssets = recognisedAssets(d.closingAssets, closingObl, ceilingClose);
  const income = openAssets * d.rate;
  const pnAssets = closeAssets - openAssets - income;
  return { interestCost, closingObl, ceilingOpen, ceilingClose, openAssets, closeAssets, income, pnAssets, netOpen: openAssets - d.obligation, netClose: closeAssets - closingObl, netInterest: income - interestCost, oci: pnAssets - d.lossObl };
}

export function ceilingDrill(r: Rand): Drill {
  const d = ceilingDraw(r);
  const F = ceilingFigures(d);
  const capClose = d.closingAssets - F.closingObl > F.ceilingClose;
  const ociGain = F.oci > 0;
  return {
    family: "ceiling",
    title: DRILL_TITLES.ceiling,
    story: [
      `התנועה בהתחייבות להטבה מוגדרת השנה: פתיחה ${fmt(d.obligation)} ₪; הוצאות ריבית ${fmt(F.interestCost)} ₪; עלות שירות שוטף ${fmt(d.service)} ₪; הפסד אקטוארי ${fmt(d.lossObl)} ₪; סגירה ${fmt(F.closingObl)} ₪. לא היו תשלומים.`,
      `השווי ההוגן של נכסי התכנית: ${fmt(d.assets)} ₪ בתחילת השנה ו-${fmt(d.closingAssets)} ₪ בסופה, בלי הפקדות או משיכות. לפי תקנון הקרן, עודף עד ${pct(d.share)} מסכום ההתחייבות זמין לחברה למשיכה מיידית; עודף מעל זה משולם לעובדים, ולחברה אין בגינו שום הטבה.`,
      "מה ההשפעה על הדוחות השנה?",
    ],
    asks: [
      { kind: "number", id: "netOpen", label: "הנכס נטו בתחילת השנה", answer: F.netOpen, unit: "₪" },
      { kind: "number", id: "income", label: "הכנסות ריבית מהנכסים", answer: F.income, unit: "₪" },
      { kind: "number", id: "netClose", label: "הנכס נטו בסוף השנה", answer: F.netClose, unit: "₪" },
      { kind: "number", id: "oci", label: "רווח כולל אחר, נטו (בערך מוחלט)", answer: Math.abs(F.oci), unit: "₪" },
      { kind: "choice", id: "ociSide", label: "הרווח הכולל האחר הוא", options: ["רווח", "הפסד"], answer: ociGain ? 0 : 1 },
    ],
    seek: ["הנכס נטו שמותר להציג בכל תאריך, וממנו — הכנסות הריבית, המדידה מחדש וההשפעה על הדוחות."],
    check: [
      "יש עודף? הנכס נטו הוא הנמוך מבין העודף לבין תקרת הנכס (סעיף 64).",
      "התקרה — הערך הנוכחי של ההטבות שהחברה יכולה לקבל מהעודף: החזר או הפחתת הפקדות. כאן: אחוז מההתחייבות, בכל תאריך לפי ההתחייבות של אותו תאריך.",
      "כשהנכס הוצג בגובה התקרה, גם הכנסות הריבית וגם המדידה מחדש מחושבות על הנכסים כפי שהוכרו — לא על השווי ההוגן המלא.",
      "שיעור ההיוון לא נתון? משחזרים אותו מהתנועה: ריבית ÷ פתיחה (כשלא היו תשלומים).",
    ],
    build: [
      { title: "① שיעור ההיוון", lines: [`${fmt(F.interestCost)} ÷ ${fmt(d.obligation)} = ${pct(d.rate)}.`] },
      {
        title: "② תחילת השנה",
        lines: [
          `עודף: ${fmt(d.assets)} − ${fmt(d.obligation)} = ${sh(d.assets - d.obligation)}; תקרה: ${pct(d.share)} × ${fmt(d.obligation)} = ${sh(F.ceilingOpen)}.`,
          `נכס נטו — הנמוך: ${sh(F.netOpen)}. הנכסים כפי שהוכרו: ${fmt(d.obligation)} + ${sh(F.netOpen)} = ${sh(F.openAssets)}.`,
        ],
      },
      { title: "③ הכנסות ריבית", lines: [`${sh(F.openAssets)} × ${pct(d.rate)} = ${sh(F.income)}.`] },
      {
        title: "④ סוף השנה",
        lines: [
          `עודף: ${fmt(d.closingAssets)} − ${fmt(F.closingObl)} = ${sh(d.closingAssets - F.closingObl)}; תקרה: ${pct(d.share)} × ${fmt(F.closingObl)} = ${sh(F.ceilingClose)}.`,
          capClose ? `העודף מעל התקרה — נכס נטו ${sh(F.netClose)}, והנכסים כפי שהוכרו ${sh(F.closeAssets)}.` : `העודף מתחת לתקרה — מציגים את כולו: ${sh(F.netClose)}.`,
        ],
      },
      { title: "⑤ מדידה מחדש של הנכסים", lines: [`${sh(F.closeAssets)} − ${sh(F.openAssets)} − ${sh(F.income)} = ${F.pnAssets >= 0 ? "" : "−"}${sh(Math.abs(F.pnAssets))}.`] },
      {
        title: "⑥ הדוחות",
        lines: [
          `רווח והפסד: עלות שירות ${sh(d.service)} (שכר); ריבית נטו ${sh(F.income)} − ${sh(F.interestCost)} = ${F.netInterest >= 0 ? "הכנסה" : "הוצאה"} ${sh(Math.abs(F.netInterest))}.`,
          `רווח כולל אחר: ${sh(F.pnAssets)} − ${sh(d.lossObl)} = ${ociGain ? "רווח" : "הפסד"} ${sh(Math.abs(F.oci))}.`,
          `במאזן: נכס נטו ${sh(F.netClose)}.`,
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Other long-term benefits: a long-service award raised during the year.

/** A choice ask with its options shuffled; the first of `options` is the right one. */
function choiceAsk(r: Rand, id: string, label: string, options: string[]): DrillAsk {
  const order = shuffle(r, options.map((_, i) => i));
  return { kind: "choice", id, label, options: order.map((i) => options[i]), answer: order.indexOf(0) };
}

const AWARD_KINDS = [
  { name: "מענק יובל", who: "עובדת במחלקת השיווק", began: "החלה" },
  { name: "מענק ותק", who: "עובד במוקד השירות", began: "החל" },
  { name: "מענק התמדה", who: "מהנדסת במפעל", began: "החלה" },
  { name: "מענק יובל", who: "נהג בחברת ההסעות", began: "החל" },
] as const;

export type AwardDraw = { kind: number; perOld: number; perNew: number; years: number; from: number; served: number; months: number; r0: number; ra: number; rEnd: number };

export function awardDraw(r: Rand): AwardDraw {
  const years = int(r, 6, 15);
  let perOld = step(r, 6_000, 30_000, 1_000);
  if (years === 10 && perOld === 12_000) perOld += 1_000;
  const r0 = pick(r, [0.045, 0.05, 0.055, 0.065, 0.07, 0.075]);
  const ra = r0 + pick(r, [-0.015, -0.01, -0.005, 0.005, 0.01, 0.015]);
  return {
    kind: int(r, 0, AWARD_KINDS.length - 1),
    perOld,
    perNew: perOld + step(r, 1_000, 8_000, 500),
    years,
    from: int(r, 2018, 2024),
    served: int(r, 1, years - 3),
    months: int(r, 2, 10),
    r0,
    ra,
    rEnd: r() < 0.6 ? ra : ra + pick(r, [-0.005, 0.005]),
  };
}

export function awardFigures(d: AwardDraw) {
  const nEnd = d.years - d.served - 1;
  const opening = pv(d.perOld * d.served, d.r0, nEnd + 1);
  const y = amendedYear({ opening, iStart: d.r0, iAmend: d.ra, iEnd: d.rEnd, months: d.months, oldPerYear: d.perOld, newPerYear: d.perNew, servedAtStart: d.served, nEnd });
  const serviceCost = y.service + y.pastService;
  return { opening, nEnd, ...y, serviceCost, pl: serviceCost + y.interest + y.pn, after: 12 - d.months };
}

export function awardDrill(r: Rand): Drill {
  const d = awardDraw(r);
  const F = awardFigures(d);
  const k = AWARD_KINDS[d.kind];
  const year = d.from + d.served;
  const loss = F.pn > 0;
  const m = (x: number) => `${x}/12`;
  const nA = `(${F.nEnd} + ${F.after}/12)`;
  const sA = `(${d.served} + ${d.months}/12)`;
  const pnAsk = choiceAsk(r, "where", "איפה נרשם ה-P.N.?", ["ברווח והפסד, עם הוצאות השכר", "ברווח כולל אחר (OCI)", "בקרן הון, בלי לעבור ברווח והפסד", "לא נרשם: נפרס על השנים שנותרו"]);
  return {
    family: "award",
    title: DRILL_TITLES.award,
    story: [
      `${k.who} ${k.began} לעבוד ב-1.1.${d.from}. בתום ${d.years} שנות עבודה ישולם ${k.name} של ${fmt(d.perOld * d.years)} ₪, והעבודה נמשכת גם אחריו. החברה מעריכה שהמענק ישולם.`,
      `ב-1.${d.months + 1}.${year} החליטה החברה להגדיל את המענק ל-${fmt(d.perNew * d.years)} ₪, גם על השנים שכבר עברו.`,
      `שיעור ההיוון: ${pct(d.r0)} ב-31.12.${year - 1}; ${pct(d.ra)} ב-1.${d.months + 1}.${year}${d.rEnd === d.ra ? ` וגם ב-31.12.${year}` : `; ${pct(d.rEnd)} ב-31.12.${year}`}.`,
      `ערכו את התנועה בהתחייבות לשנת ${year}, והפרידו בין שכר עבודה לריבית.`,
    ],
    asks: [
      { kind: "number", id: "opening", label: `היתרה ב-31.12.${year - 1}`, answer: F.opening, unit: "₪" },
      { kind: "number", id: "service", label: "עלות שירות (שוטף ועבר, סכום אחד)", answer: F.serviceCost, unit: "₪" },
      { kind: "number", id: "interest", label: "הוצאות ריבית", answer: F.interest, unit: "₪" },
      { kind: "number", id: "closing", label: `היתרה ב-31.12.${year}`, answer: F.closing, unit: "₪" },
      { kind: "number", id: "pn", label: "מדידה מחדש (בערך מוחלט)", answer: Math.abs(F.pn), unit: "₪" },
      pnAsk,
    ],
    seek: [`התנועה בהתחייבות לשנת ${year}: פתיחה, עלות שירות אחת (שוטף ועבר יחד), ריבית, סגירה, ומדידה מחדש שמאזנת. הכול ברווח והפסד.`],
    check: [
      "המענק משולם בזמן העבודה, אבל לא תוך 12 חודשים מהשנה שבה הוא נצבר: הטבה אחרת לזמן ארוך (סעיף 153). מודדים כמו הטבה מוגדרת (סעיף 155).",
      `ההגדלה ב-1.${d.months + 1} חותכת את השנה: ${d.months} חודשים במענק הישן, ${F.after} בחדש.`,
      "ההגדלה חלה גם על העבר: שירות עבר, ביום ההגדלה, בשיעור של אותו יום.",
      "סעיף 156: שירות שוטף ושירות עבר בסכום אחד, ובלי OCI. גם המדידה מחדש לרווח והפסד.",
    ],
    build: [
      { title: "① הצבירה לשנה", lines: [`לפני: ${fmt(d.perOld * d.years)} ÷ ${d.years} = ${sh(d.perOld)}.`, `אחרי: ${fmt(d.perNew * d.years)} ÷ ${d.years} = ${sh(d.perNew)}.`] },
      { title: "② הפתיחה", lines: [`${fmt(d.perOld)} × ${d.served} ÷ ${f1(d.r0)}^${F.nEnd + 1} = ${sh(F.opening)}.`] },
      {
        title: "③ עלות שירות שוטף",
        lines: [
          `עד ההגדלה: ${fmt(d.perOld)} × ${m(d.months)} ÷ ${f1(d.r0)}^${nA} = ${sh(F.serviceBefore)}.`,
          `אחרי: ${fmt(d.perNew)} × ${m(F.after)} ÷ ${f1(d.ra)}^${F.nEnd} = ${sh(F.serviceAfter)}.`,
        ],
      },
      {
        title: "④ עלות שירות עבר (ביום ההגדלה)",
        lines: [
          `ותק: ${sA} שנים; n = ${nA}; שיעור ${pct(d.ra)}.`,
          `לפני: ${fmt(d.perOld)} × ${sA} ÷ ${f1(d.ra)}^${nA} = ${sh(F.pastBefore)}.`,
          `אחרי: ${fmt(d.perNew)} × ${sA} ÷ ${f1(d.ra)}^${nA} = ${sh(F.pastAfter)}.`,
          `שירות עבר: ${sh(F.pastService)}.`,
        ],
      },
      { title: "⑤ עלות שירות אחת", lines: [`${sh(F.serviceBefore)} + ${sh(F.serviceAfter)} + ${sh(F.pastService)} = ${sh(F.serviceCost)}.`] },
      {
        title: "⑥ ריבית",
        lines: [
          `עד ההגדלה: ${sh(F.opening)} × (${f1(d.r0)}^(${m(d.months)}) − 1) = ${sh(F.interestBefore)}.`,
          `אחרי: ${sh(F.pastAfter)} × (${f1(d.ra)}^(${m(F.after)}) − 1) = ${sh(F.interestAfter)}.`,
          `סה״כ ${sh(F.interest)}.`,
        ],
      },
      { title: "⑦ הסגירה", lines: [`${fmt(d.perNew)} × ${d.served + 1} ÷ ${f1(d.rEnd)}^${F.nEnd} = ${sh(F.closing)}.`] },
      {
        title: "⑧ מדידה מחדש, ולאן",
        lines: [
          `${sh(F.closing)} − ${sh(F.opening)} − ${sh(F.serviceCost)} − ${sh(F.interest)} = ${loss ? "" : "−"}${sh(Math.abs(F.pn))} → ${loss ? "הפסד" : "רווח"}.`,
          `ברווח והפסד, לא ב-OCI. סך הכול ברווח והפסד: ${sh(F.pl)}, בדיוק ההפרש בין הסגירה לפתיחה.`,
        ],
      },
    ],
    table: {
      head: ["שורה", "סכום"],
      rows: [
        [`יתרה 31.12.${year - 1}`, Math.round(F.opening)],
        ["עלות שירות (שכר עבודה)", Math.round(F.serviceCost)],
        ["ריבית", Math.round(F.interest)],
        [`מדידה מחדש (${loss ? "הפסד" : "רווח"}), ברווח והפסד`, Math.round(F.pn)],
      ],
      foot: [`יתרה 31.12.${year}`, Math.round(F.closing)],
    },
  };
}

// ---------------------------------------------------------------------------
// Termination benefits: when, and at how much.

const SITES = ["מפעל האריזות", "סניף הדרום", "מרכז ההפצה", "מחלקת הדפוס", "המוקד הטלפוני", "מעבדת הבדיקות"];

export type TermDraw =
  | { variant: "closure"; site: number; year: number; staff: number; early: number; extra: number; leavers: number; payIn: number; rate: number }
  | { variant: "offer"; site: number; year: number; amount: number; month: number; accepted: number; expected: number; closeMonth: number };

export function termDraw(r: Rand): TermDraw {
  const site = int(r, 0, SITES.length - 1);
  const year = int(r, 2019, 2026);
  if (r() < 0.6) {
    let staff = step(r, 40, 160, 5);
    if (staff === 90) staff = 95;
    let early = step(r, 5_000, 18_000, 1_000);
    if (early === 10_000) early = 11_000;
    let extra = step(r, 6_000, 25_000, 1_000);
    if (early + extra === 30_000) extra += 1_000;
    return { variant: "closure", site, year, staff, early, extra, leavers: Math.round(staff * pick(r, [0.4, 0.55, 0.65, 0.75, 0.8])), payIn: pick(r, [1, 1, 2, 3]), rate: pick(r, [0.04, 0.05, 0.06, 0.07]) };
  }
  const expected = int(r, 18, 60);
  return { variant: "offer", site, year, amount: step(r, 15_000, 70_000, 2_500), month: int(r, 9, 11), accepted: int(r, 5, expected - 6), expected, closeMonth: int(r, 1, 3) };
}

export function termFigures(d: TermDraw) {
  if (d.variant === "offer") return { liability: d.accepted * d.amount, undiscounted: d.accepted * d.amount, later: 0 };
  const undiscounted = d.early * d.staff;
  return { liability: d.payIn > 1 ? pv(undiscounted, d.rate, d.payIn) : undiscounted, undiscounted, later: d.extra * (d.staff - d.leavers) };
}

export function termDrill(r: Rand): Drill {
  const d = termDraw(r);
  const F = termFigures(d);
  const site = SITES[d.site];
  if (d.variant === "offer") {
    const when = choiceAsk(r, "when", "מתי נרשמת ההתחייבות לעובדים שעוד לא קיבלו את ההצעה?", [
      "כשיקבלו אותה, או קודם אם תיווצר מגבלה אפקטיבית על ביטולה",
      `כבר ב-31.12.${d.year}, לפי ${d.expected} העובדים הצפויים`,
      "כשהכסף ישולם להם",
      "בסוף תקופת ההצעה, לכולם יחד",
    ]);
    return {
      family: "term",
      title: DRILL_TITLES.term,
      story: [
        `ב-1.${d.month}.${d.year} הציעה החברה לעובדי ${site} פרישה מרצון: מי שיסכים יקבל ${fmt(d.amount)} ₪ ויעזוב בתוך חודשיים. ההצעה פתוחה עד 31.${d.closeMonth}.${d.year + 1}, ועד שעובד מקבל אותה החברה רשאית לבטל אותה.`,
        `עד 31.12.${d.year} קיבלו את ההצעה ${d.accepted} עובדים. ההנהלה מעריכה שבסוף יסכימו ${d.expected}. ההצעה אינה חלק מתוכנית לארגון מחדש.`,
        `מה ההתחייבות בגין פיטורין ב-31.12.${d.year}?`,
      ],
      asks: [{ kind: "number", id: "liability", label: `ההתחייבות ב-31.12.${d.year}`, answer: F.liability, unit: "₪" }, when],
      seek: [`ההתחייבות בגין פיטורין ב-31.12.${d.year}: למי כבר נרשמת, ובכמה.`],
      check: [
        "פרישה מרצון בתמורה להטבה: הטבת פיטורין (סעיף 159), לא צבירה על שירות.",
        "ההטבה נובעת מהסכמה של העובד להצעה: מכירים במוקדם מבין קבלת ההצעה לבין מגבלה אפקטיבית על ביטולה (סעיף 166).",
        "כל עוד החברה רשאית לבטל, אין מחויבות כלפי מי שעוד לא קיבל. הצפי לא משנה.",
        "ההצעה אינה חלק מארגון מחדש, אז המועד של IAS 37 לא מקדים את ההכרה.",
        "התשלום בתוך חודשים: נמדד כהטבה לזמן קצר, בלי היוון (סעיף 169(א)).",
      ],
      build: [
        { title: "① מי כבר קיבל", lines: [`${d.accepted} עובדים עד 31.12.${d.year}.`] },
        { title: "② הסכום", lines: [`${d.accepted} × ${fmt(d.amount)} = ${sh(F.liability)}, בלי היוון.`] },
        { title: "③ ומה עם השאר", lines: [`${d.expected - d.accepted} העובדים הנוספים הצפויים: יירשמו כשיקבלו את ההצעה, בשנת ${d.year + 1}.`] },
      ],
      entry: [
        { account: "הוצאות שכר (הטבות פיטורין)", dr: F.liability },
        { account: "התחייבות בגין פיטורין", cr: F.liability },
      ],
    };
  }
  const extraAsk = choiceAsk(r, "extra", `ומה עם התוספת של ${fmt(d.extra)} ₪ למי שנשאר עד הסגירה?`, [
    "שכר על שירות עתידי: נרשמת בתקופה שעד הסגירה, כשעובדים בשבילה",
    "חלק מהטבת הפיטורין: נרשמת עכשיו, לכל העובדים",
    `נרשמת עכשיו, רק ל-${d.staff - d.leavers} הצפויים להישאר`,
    "נרשמת ב-OCI כשתשולם",
  ]);
  const disc = d.payIn > 1;
  return {
    family: "term",
    title: DRILL_TITLES.term,
    story: [
      `ב-31.12.${d.year} החליטה החברה סופית לסגור את ${site}, ובאותו יום הודיעה לעובדים על תוכנית מפורטת: כמה עובדים, באילו תפקידים, מתי, וכמה יקבל כל אחד. אין צפי לשינויים בתוכנית.`,
      `כל אחד מ-${d.staff} העובדים יקבל ${fmt(d.early)} ₪ אם יעזוב לפני הסגירה. מי שיישאר עד הסגירה יקבל ${fmt(d.early + d.extra)} ₪. ההערכה: ${d.leavers} יעזבו קודם ו-${d.staff - d.leavers} יישארו.`,
      disc
        ? `הסגירה, וכל התשלומים, ב-31.12.${d.year + d.payIn}. שיעור ההיוון ${pct(d.rate)}.`
        : `הסגירה, וכל התשלומים, במהלך ${d.year + 1}.`,
      `מה ההתחייבות בגין פיטורין ב-31.12.${d.year}?`,
    ],
    asks: [{ kind: "number", id: "liability", label: `ההתחייבות ב-31.12.${d.year}`, answer: F.liability, unit: "₪" }, extraAsk],
    seek: [`ההתחייבות בגין פיטורין ב-31.12.${d.year}: מה ההחלטה נותנת לכל עובד בכל מקרה, ובאיזה ערך.`],
    check: [
      "ההטבה נולדת מההחלטה לסגור, לא מהשירות: הטבת פיטורין (סעיף 159), בלי שיוך לשנות שירות (סעיף 170).",
      `מתי: הודעה על תוכנית שעומדת בשלושת התנאים של סעיף 167, ב-31.12.${d.year}. (אם יש גם הפרשה לארגון מחדש לפי IAS 37, הולכים לפי המוקדם מבין השניים.)`,
      `כמה: ${fmt(d.early)} ₪ מגיעים לכל עובד, יעזוב או יישאר. לכן הצפי של מי יעזוב לא משנה את הסכום.`,
      "התוספת מותנית בהמשך עבודה: הטבה בגין שירות, לא פיטורין (סעיף 162).",
      disc ? `התשלום יותר מ-12 חודשים אחרי סוף השנה: נמדד כהטבה אחרת לזמן ארוך, עם היוון (סעיף 169(ב)).` : "התשלום בתוך 12 חודשים מסוף השנה: כהטבה לזמן קצר, בלי היוון (סעיף 169(א)).",
    ],
    build: [
      { title: "① מה מגיע לכל עובד בכל מקרה", lines: [`${fmt(d.early)} ₪. התוספת של ${fmt(d.extra)} ₪ היא שכר, לא פיטורין.`] },
      { title: "② הסכום", lines: [`${fmt(d.early)} × ${d.staff} = ${sh(F.undiscounted)}.`] },
      disc
        ? { title: "③ היוון", lines: [`${sh(F.undiscounted)} ÷ ${f1(d.rate)}^${d.payIn} = ${sh(F.liability)}.`] }
        : { title: "③ היוון", lines: ["אין: התשלום בתוך 12 חודשים."] },
      { title: "④ והתוספת", lines: [`צפי: ${d.staff - d.leavers} × ${fmt(d.extra)} = ${sh(F.later)}, שיירשמו כהוצאות שכר בתקופה שעד הסגירה.`] },
    ],
    entry: [
      { account: "הוצאות שכר (הטבות פיטורין)", dr: Math.round(F.liability) },
      { account: "התחייבות בגין פיטורין", cr: Math.round(F.liability) },
    ],
  };
}

export const DRILLS: Record<DrillFamily, (r: Rand) => Drill> = {
  classify: classifyDrill,
  dc: dcDrill,
  puc: pucDrill,
  window: windowDrill,
  tiers: tiersDrill,
  year: yearDrill,
  payint: payDrill,
  amend: amendDrill,
  settle: settleDrill,
  assets: assetsDrill,
  ceiling: ceilingDrill,
  award: awardDrill,
  term: termDrill,
};

export const makeDrill = (family: DrillFamily, seed: number) => DRILLS[family](seeded(seed));
