/**
 * The basics course's review lesson: a preliminary trial balance and the story
 * behind it. Each case is told as three entries — what was recorded, what
 * should have been, and the correction between them — and the tests check that
 * what was recorded plus the correction is exactly what should have been.
 */
import { type Entry, type Line, round2 } from "./basics";

const e = (id: string, text: string, lines: Line[]): Entry => ({ id, text, lines });
const two = (id: string, text: string, dr: string, cr: string, amount: number): Entry => e(id, text, [{ account: dr, dr: amount }, { account: cr, cr: amount }]);

/** A case: the story, what was recorded (none: nothing), what should have been, and the correction. `profit` is what the mistake did to the year's profit before it was fixed. */
export type FixCase = {
  id: string;
  title: string;
  story: string;
  recorded: Entry | null;
  should: Entry;
  fix: Entry;
  profit: "right" | "low" | "high";
  why: string;
};

/** The method's opening example: a year of cleaning paid on 1.11, recorded as an expense. */
export const CLEANING: FixCase = {
  id: "cleaning",
  title: "ניקיון לשנה, שנרשם כולו כהוצאה",
  story: "ב-1.11 שולמו במזומן 12,000 ₪ על שירותי ניקיון לשנה, ונרשמו כולם כהוצאה.",
  recorded: two("נרשם", "מה שנרשם ב-1.11", "הוצאות ניקיון", "מזומן", 12_000),
  should: e("צריך", "מה שהיה צריך להיות ב-31.12", [
    { account: "הוצאות ניקיון", dr: 2_000 },
    { account: "הוצאות ניקיון מראש", dr: 10_000 },
    { account: "מזומן", cr: 12_000 },
  ]),
  fix: two("תיקון", "פקודת ההתאמה ב-31.12", "הוצאות ניקיון מראש", "הוצאות ניקיון", 10_000),
  profit: "low",
  why: "חודשיים (נובמבר–דצמבר) שייכים לשנה: 2,000. עשרת החודשים של השנה הבאה — 10,000 — יוצאים מההוצאה ועוברים לנכס.",
};

/** The old-contract example: insurance paid on 1.4.2024 for 24 months, 3,000 a month; the trial balance of 31.12.2025 still shows the end of 2024. */
export const OLD_CONTRACT = { paid: 72_000, months: 24, start: "1.4.2024", monthsIn2024: 9 };
const ocMonth = OLD_CONTRACT.paid / OLD_CONTRACT.months;
export const OLD_RESULTS = {
  month: ocMonth,
  balance2024: OLD_CONTRACT.paid - ocMonth * OLD_CONTRACT.monthsIn2024,
  expense2025: ocMonth * 12,
  left: OLD_CONTRACT.paid - ocMonth * (OLD_CONTRACT.monthsIn2024 + 12),
};

/** Contracts over several years, each read off its own cycle. */
export const MULTI = {
  // Insurance renewed every three years from 1.1.2017, paid in advance and recorded as prepaid.
  renewal: { monthly: 4_000, cycleMonths: 36, firstYear: 2017, year: 2025 },
  // Rent for two years from 1.9.2023, paid in advance, not renewed.
  expired: { paid: 48_000, months: 24, start: "1.9.2023", end: "31.8.2025", leftAfter2024: 8 },
  // Advertising from 1.6.2024 to 31.5.2026, paid in advance; its balance on the trial balance is the unknown.
  unknown: { paid: 72_000, months: 24, start: "1.6.2024", end: "31.5.2026", usedIn2024: 7 },
};
const cycleStart = (r: typeof MULTI.renewal) => r.firstYear + Math.floor((r.year - r.firstYear) / (r.cycleMonths / 12)) * (r.cycleMonths / 12);
export const MULTI_RESULTS = (() => {
  const r = MULTI.renewal;
  const start = cycleStart(r);
  const paid = r.monthly * r.cycleMonths;
  // At the start of the year: what is left of the cycle after the years before it in the cycle.
  const opening = paid - r.monthly * 12 * (r.year - start);
  const x = MULTI.expired;
  const u = MULTI.unknown;
  const uMonth = u.paid / u.months;
  return {
    renewal: { start, paid, opening, expense: r.monthly * 12, closing: opening - r.monthly * 12 },
    expired: { month: x.paid / x.months, opening: (x.paid / x.months) * x.leftAfter2024 },
    unknown: { month: uMonth, opening: round2(u.paid - uMonth * u.usedIn2024), expense: uMonth * 12, closing: round2(u.paid - uMonth * (u.usedIn2024 + 12)) },
  };
})();

/** Corrections: the amount was right, an account was wrong. */
export const FIXES: FixCase[] = [
  {
    id: "credit-as-cash",
    title: "קנייה באשראי שנרשמה במזומן",
    story: "נקנתה סחורה ב-18,000 ₪ באשראי, אבל נרשמה כאילו שולמה במזומן.",
    recorded: two("נרשם", "מה שנרשם", "קניות", "מזומן", 18_000),
    should: two("צריך", "מה שהיה צריך", "קניות", "ספקים", 18_000),
    fix: two("תיקון", "פקודת התיקון", "מזומן", "ספקים", 18_000),
    profit: "right",
    why: "הקניות נכונות בשתי הפקודות — הן לא משתתפות בתיקון. רק המזומן חוזר, והחוב לספק נוצר.",
  },
  {
    id: "postdated-as-cash",
    title: "צ׳ק דחוי שנרשם כמזומן",
    story: "נמכרה סחורה ב-90,000 ₪: 60,000 במזומן ו-30,000 בצ׳ק דחוי לעוד חודשיים. נרשם הכול במזומן.",
    recorded: two("נרשם", "מה שנרשם", "מזומן", "מכירות", 90_000),
    should: e("צריך", "מה שהיה צריך", [
      { account: "מזומן", dr: 60_000 },
      { account: "לקוחות", dr: 30_000 },
      { account: "מכירות", cr: 90_000 },
    ]),
    fix: two("תיקון", "פקודת התיקון", "לקוחות", "מזומן", 30_000),
    profit: "right",
    why: "המכירות נכונות. 30,000 שנרשמו כמזומן הם בעצם חוב של הלקוח — הם עוברים מהמזומן ללקוחות.",
  },
  {
    id: "advance-as-purchase",
    title: "מקדמה לספק שנרשמה כקנייה",
    story: "שולמה מקדמה של 40,000 ₪ לספק על סחורה שתגיע בשנה הבאה. נרשם: ח׳ קניות / ז׳ מזומן.",
    recorded: two("נרשם", "מה שנרשם", "קניות", "מזומן", 40_000),
    should: two("צריך", "מה שהיה צריך", "מקדמות לספקים", "מזומן", 40_000),
    fix: two("תיקון", "פקודת התיקון", "מקדמות לספקים", "קניות", 40_000),
    profit: "low",
    why: "המזומן נכון. הסחורה עוד לא הגיעה — זו לא קנייה אלא נכס: הספק חייב לנו סחורה.",
  },
  {
    id: "advance-as-sale",
    title: "מקדמה מלקוח שנרשמה כמכירה",
    story: "לקוח שילם מקדמה של 25,000 ₪ על הזמנה לשנה הבאה. נרשם: ח׳ מזומן / ז׳ מכירות.",
    recorded: two("נרשם", "מה שנרשם", "מזומן", "מכירות", 25_000),
    should: two("צריך", "מה שהיה צריך", "מזומן", "מקדמות מלקוחות", 25_000),
    fix: two("תיקון", "פקודת התיקון", "מכירות", "מקדמות מלקוחות", 25_000),
    profit: "high",
    why: "המזומן נכון. אבל עוד לא סיפקנו כלום — זו לא הכנסה. אנחנו חייבים ללקוח סחורה: התחייבות.",
  },
  {
    id: "advance-delivered",
    title: "סחורה שסופקה על מקדמה מהשנה הקודמת",
    story: "ב-2024 התקבלה מקדמה של 70,000 ₪ ונרשמה נכון. במרץ 2025 הסחורה סופקה — ולא נרשם דבר.",
    recorded: null,
    should: two("צריך", "מה שהיה צריך", "מקדמות מלקוחות", "מכירות", 70_000),
    fix: two("תיקון", "פקודת התיקון", "מקדמות מלקוחות", "מכירות", 70_000),
    profit: "low",
    why: "לא נרשם כלום, ולכן התיקון הוא כל מה שהיה צריך: המקדמה נסגרת, והמכירה נרשמת — עכשיו, כשהסחורה סופקה.",
  },
];
