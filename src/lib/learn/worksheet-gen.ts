/**
 * Worksheets without end, in five levels: a company's preliminary trial
 * balance at 31.12.2025 and the facts behind its adjustments, drawn from a
 * seed. Every balance a fact relies on is really on the trial balance, the
 * trial balance balances (cash takes up the difference), and every entry is
 * computed from the fact's own numbers.
 */

import { type Balances, type Entry, round2 } from "./basics";
import { accumulatedTo, depreciationOfYear, monthsBetween, sale, saleEntry } from "./basics-ppe";
import type { WorksheetCase, WorksheetItem } from "./worksheet";

export type WorksheetLevel = 1 | 2 | 3 | 4 | 5;

export const LEVEL_LABEL: Record<WorksheetLevel, string> = {
  1: "חשבונות חתך ומלאי",
  2: "ועוד חוזה ישן, חודש חריג, ריבית ותיקון",
  3: "ועוד הפסדי אשראי, והעודפים ״?״",
  4: "ועוד פחת ומכירת רכוש קבוע",
  5: "רמת בוחן: יתרות ״?״ מהסיפור, חידוש במחיר אחר ופקודה הפוכה",
};

function rng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (a: number, b: number, step = 1) => a + Math.floor(next() * (Math.floor((b - a) / step) + 1)) * step;
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)];
  /** Distinct picks from a list, in a random order. */
  const deal = <T,>(xs: readonly T[]) => {
    // Fisher-Yates: the same seed gives the same order in every engine (a random sort comparator does not).
    const out = [...xs];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return { int, pick, deal };
}

const f = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const MONTHS = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const NAMES = ["אלון", "ברוש", "גומא", "דפנה", "הדס", "ורד", "חצב", "טופז", "יערה", "כלנית", "לוטם", "מורן", "נרקיס", "סחלב", "ערבה", "פיקוס", "צאלון", "קורנית", "רותם"] as const;
const SERVICES = [
  ["שכירות", "הוצאות שכירות"],
  ["ביטוח", "הוצאות ביטוח"],
  ["פרסום", "הוצאות פרסום"],
  ["אחזקה", "הוצאות אחזקה"],
  ["ניקיון", "הוצאות ניקיון"],
  ["שמירה", "הוצאות שמירה"],
] as const;
const ALLOW = "הפרשה להפסדי אשראי חזויים";
const EXPENSE = "הוצאות הפסדי אשראי";

/** A part of a worksheet: what it puts on the trial balance, its fact and entry, and a balance the learner works out from the story. */
type Part = { balances: Balances; items: WorksheetItem[]; computed?: WorksheetCase["computed"] };

const entry = (id: string, text: string, lines: Entry["lines"], why: string): Entry => ({ id, date: "31.12", text, lines, why });
const two = (id: string, text: string, dr: string, cr: string, amount: number, why: string) => entry(id, text, [{ account: dr, dr: amount }, { account: cr, cr: amount }], why);

/** Adds `b` into `a`, summing balances that two parts share (cash, sales, purchases). */
function merge(a: Balances, b: Balances) {
  for (const [k, v] of Object.entries(b)) a[k] = round2((a[k] ?? 0) + v);
}

export function worksheet(level: WorksheetLevel, seed: number): WorksheetCase {
  const r = rng(seed * 104729 + level * 7919);
  const services = r.deal(SERVICES);
  const name = `${r.pick(NAMES)} ${r.pick(["סחר", "שיווק", "יבוא", "תעשיות"])} בע״מ`;
  const parts: Part[] = [];
  let n = 0;
  const id = () => String(++n);

  // -- Level 1: the four cut-off accounts and closing stock.
  {
    // A prepaid contract signed this year: recorded as an asset, or as an expense.
    const [svc, exp] = services[0];
    const pre = `${exp} מראש`;
    const months = r.pick([12, 24] as const);
    const start = r.int(2, 12);
    const monthly = r.int(10, 60) * 100;
    const paid = monthly * months;
    const used = 13 - start;
    const asAsset = r.int(0, 1) === 1;
    parts.push(
      asAsset
        ? {
            balances: { [pre]: paid },
            items: [{ title: `${svc}: חוזה חדש`, story: `ב-1.${start}.2025 שולמו ${f(paid)} ₪ על ${svc} ל-${months} חודשים, ונרשמו כ״${pre}״.`, entry: two(id(), `${svc}: החלק של 2025`, exp, pre, monthly * used, `${f(monthly)} לחודש × ${used} חודשים שנוצלו.`), accounts: [exp, pre, "מזומן", `${exp} לשלם`] }],
          }
        : {
            balances: { [exp]: paid },
            items: [{ title: `${svc}: נרשם כהוצאה`, story: `ב-1.${start}.2025 שולמו ${f(paid)} ₪ על ${svc} ל-${months} חודשים, ונרשמו כולם כ״${exp}״.`, entry: two(id(), `${svc}: מה ששייך לשנים הבאות`, pre, exp, monthly * (months - used), `${f(monthly)} לחודש × ${months - used} חודשים שעוד לא נוצלו.`), accounts: [pre, exp, "מזומן", `${exp} לשלם`] }],
          },
    );
  }
  {
    // Salary: eleven months recorded; at level 2 and up December is odd (a raise, or a one-off gift inside).
    const month = r.int(15, 80) * 1_000;
    const odd = level >= 2 ? r.pick(["raise", "gift"] as const) : "plain";
    const raise = r.pick([0.05, 0.1, 0.15] as const);
    const staff = r.int(6, 30);
    const gift = r.int(1, 6) * 500;
    const recorded = month * 11 + (odd === "gift" ? staff * gift : 0);
    const dec = odd === "raise" ? Math.round(month * (1 + raise)) : month;
    const story =
      odd === "raise"
        ? `הוצאות השכר כוללות את ינואר עד נובמבר, בשווה בכל חודש. מדצמבר השכר עלה ב-${pct(raise)}. שכר דצמבר ישולם ב-10.1.2026 ולא נרשם.`
        : odd === "gift"
          ? `הוצאות השכר כוללות את ינואר עד נובמבר, ובהן שי לחג של ${f(gift)} ₪ לכל אחד מ-${staff} עובדים. השכר החודשי קבוע. שכר דצמבר ישולם ב-10.1.2026 ולא נרשם.`
          : "הוצאות השכר כוללות את ינואר עד נובמבר, בשווה בכל חודש. שכר דצמבר ישולם ב-10.1.2026 ולא נרשם.";
    const why =
      odd === "raise"
        ? `חודש רגיל: ${f(recorded)} ÷ 11 = ${f(month)}. דצמבר: × ${1 + raise} = ${f(dec)}.`
        : odd === "gift"
          ? `השי: ${f(gift)} × ${staff} = ${f(gift * staff)}. חודש רגיל: (${f(recorded)} − ${f(gift * staff)}) ÷ 11 = ${f(month)}.`
          : `${f(recorded)} ÷ 11 = ${f(month)}.`;
    parts.push({ balances: { "הוצאות שכר": recorded }, items: [{ title: "שכר דצמבר", story, entry: two(id(), "שכר דצמבר שטרם שולם", "הוצאות שכר", "הוצאות שכר לשלם", dec, why), accounts: ["הוצאות שכר", "הוצאות שכר לשלם", "מזומן", "הוצאות שכר מראש"] }] });
  }
  {
    // Rent income received in advance this year: recorded as income, or as unearned.
    const months = r.pick([12, 18, 24] as const);
    const start = r.int(2, 12);
    const monthly = r.int(4, 40) * 100;
    const got = monthly * months;
    const used = 13 - start;
    const asIncome = r.int(0, 1) === 1;
    parts.push(
      asIncome
        ? { balances: { "הכנסות שכירות": -got }, items: [{ title: "שכירות שהתקבלה מראש", story: `ב-1.${start}.2025 התקבלו ${f(got)} ₪ שכירות מראש על ${months} חודשים, ונרשמו כולם כ״הכנסות שכירות״.`, entry: two(id(), "שכירות: מה ששייך לשנים הבאות", "הכנסות שכירות", "הכנסות שכירות מראש", monthly * (months - used), `${f(monthly)} לחודש × ${months - used} חודשים שעוד לא ניתנו.`), accounts: ["הכנסות שכירות", "הכנסות שכירות מראש", "מזומן", "הכנסות שכירות לקבל"] }] }
        : { balances: { "הכנסות שכירות מראש": -got }, items: [{ title: "שכירות שהתקבלה מראש", story: `ב-1.${start}.2025 התקבלו ${f(got)} ₪ שכירות מראש על ${months} חודשים, ונרשמו כ״הכנסות שכירות מראש״.`, entry: two(id(), "שכירות: מה שהורווח ב-2025", "הכנסות שכירות מראש", "הכנסות שכירות", monthly * used, `${f(monthly)} לחודש × ${used} חודשים.`), accounts: ["הכנסות שכירות מראש", "הכנסות שכירות", "מזומן", "הכנסות שכירות לקבל"] }] },
    );
  }
  {
    // Interest earned on a bank deposit, paid with the principal.
    const k = r.int(2, 20);
    const deposit = k * 12_000;
    const rate = r.int(2, 6) / 100;
    const start = r.int(2, 12);
    const months = 13 - start;
    const interest = Math.round((deposit * rate * months) / 12);
    parts.push({ balances: { "פיקדונות בבנק": deposit }, items: [{ title: "ריבית על הפיקדון", story: `הפיקדון (${f(deposit)} ₪) הופקד ב-1.${start}.2025 בריבית שנתית של ${pct(rate)}, שתתקבל עם הקרן ב-2026. הריבית לא נרשמה.`, entry: two(id(), "ריבית שהורווחה וטרם התקבלה", "הכנסות ריבית לקבל", "הכנסות ריבית", interest, `${f(deposit)} × ${pct(rate)} × ${months}/12.`), accounts: ["הכנסות ריבית לקבל", "הכנסות ריבית", "פיקדונות בבנק", "מזומן"] }] });
  }
  // Closing stock goes last, after every other item (see the end).
  const opening = r.int(40, 250) * 1_000;
  const purchases = r.int(400, 1_500) * 1_000;
  const stockCost = r.int(40, 300) * 1_000;
  const stockNrv = stockCost + r.pick([-1, 1] as const) * r.int(2, 30) * 1_000;
  parts.push({ balances: { "מלאי פתיחה": opening, קניות: purchases }, items: [] });

  // -- Level 2: an old contract, half-year interest on a loan, a correction.
  if (level >= 2) {
    const [svc, exp] = services[1];
    const pre = `${exp} מראש`;
    const months = r.pick([24, 36] as const);
    const start = r.int(1, 12);
    const monthly = r.int(10, 50) * 100;
    const paid = monthly * months;
    const usedBefore = monthsBetween({ year: 2024, month: start }, { year: 2024, month: 12 });
    const left = months - usedBefore;
    const balance = monthly * left;
    const year2025 = monthly * Math.min(12, left);
    const story = `ב-1.${start}.2024 שולמו ${f(paid)} ₪ על ${svc} ל-${months} חודשים, ונרשמו כ״מראש״. ב-2025 עוד לא נרשם דבר על החוזה.`;
    parts.push({
      balances: { [pre]: balance },
      items: [{ title: `${svc}: חוזה ישן`, story, entry: two(id(), `${svc}: 12 החודשים של 2025`, exp, pre, year2025, `חוזה ישן: היתרה היא של סוף 2024. ${f(monthly)} לחודש × ${Math.min(12, left)}.`), accounts: [exp, pre, "מזומן", `${exp} לשלם`] }],
      computed: level === 5 ? [{ account: pre, story, why: `${f(paid)} ÷ ${months} = ${f(monthly)} לחודש. ב-2024 נוצלו ${usedBefore} חודשים, ונשארו ${left}: ${f(monthly)} × ${left}.` }] : undefined,
    });

    const k = r.int(5, 40);
    const loan = k * 12_000;
    const half = r.pick([0.02, 0.025, 0.03, 0.04] as const);
    const start2 = r.int(2, 12);
    const months2 = 13 - start2;
    const interest = Math.round((loan * half * months2) / 6);
    parts.push({ balances: { "הלוואה שהתקבלה": -loan }, items: [{ title: "ריבית על ההלוואה", story: `ההלוואה (${f(loan)} ₪) נלקחה ב-1.${start2}.2025 בריבית חצי שנתית של ${pct(half)}, שתשולם עם הקרן ב-2028. הריבית לא נרשמה.`, entry: two(id(), "ריבית שנצברה וטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", interest, `השיעור לחצי שנה: ${f(loan)} × ${pct(half)} × ${months2}/6.`), accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"] }] });

    // A correction. At level 3 and up it may be the cheque, which changes customers before the allowance is computed.
    const amount = r.int(8, 80) * 1_000;
    const fix = level >= 3 ? r.pick(["cheque", "advance"] as const) : r.pick(["cheque", "advance", "credit"] as const);
    if (fix === "cheque") parts.push({ balances: {}, items: [{ title: "תיקון: צ׳ק דחוי", story: `בדצמבר נמכרה סחורה, וחלק מהתמורה, ${f(amount)} ₪, התקבל בצ׳ק דחוי לפברואר 2026. הכול נרשם: ח׳ מזומן / ז׳ מכירות.`, entry: two(id(), "תיקון: הצ׳ק הדחוי שנרשם כמזומן", "לקוחות", "מזומן", amount, "המכירה נכונה. הצ׳ק הדחוי הוא חוב של הלקוח, לא מזומן."), accounts: ["לקוחות", "מזומן", "מכירות", "ספקים"] }] });
    else if (fix === "advance") parts.push({ balances: {}, items: [{ title: "תיקון: מקדמה לספק", story: `בנובמבר שולמה מקדמה של ${f(amount)} ₪ לספק, על סחורה שתגיע במרץ 2026. נרשם: ח׳ קניות / ז׳ מזומן.`, entry: two(id(), "תיקון: מקדמה שנרשמה כקנייה", "מקדמות לספקים", "קניות", amount, "המזומן נכון. הסחורה לא הגיעה, ולכן התשלום הוא נכס: מקדמות לספקים."), accounts: ["מקדמות לספקים", "קניות", "מזומן", "ספקים"] }] });
    else parts.push({ balances: {}, items: [{ title: "תיקון: קנייה באשראי", story: `קנייה באשראי של ${f(amount)} ₪ נרשמה: ח׳ קניות / ז׳ מזומן.`, entry: two(id(), "תיקון: אשראי שנרשם במזומן", "מזומן", "ספקים", amount, "הקניות נכונות. המזומן חוזר, ונוצר חוב לספק."), accounts: ["מזומן", "ספקים", "קניות", "לקוחות"] }] });
    if (fix === "cheque") parts.push({ balances: { __cheque: amount }, items: [] });
  }

  // -- Level 3: credit losses (after the corrections, which may change customers).
  if (level >= 3) {
    const customers = r.int(300, 1_500) * 1_000;
    const cheque = parts.reduce((s, p) => s + (p.balances.__cheque ?? 0), 0);
    const written = r.int(4, 40) * 1_000;
    const specific = r.int(20, 150) * 1_000;
    const p = r.pick([0.3, 0.4, 0.5, 0.6, 0.8] as const);
    const g = r.int(2, 6) / 100;
    const after = customers + cheque - written;
    const required = Math.round(specific * p + (after - specific) * g);
    const allowance = r.int(5, Math.max(6, Math.floor((required - written) / 1_000) - 1)) * 1_000;
    const topUp = required - (allowance - written);
    parts.push({
      balances: { לקוחות: customers, [ALLOW]: -allowance },
      items: [
        { title: "חוב אבוד", story: `ב-31.12.2025 התברר שחוב של לקוח, ${f(written)} ₪, אבוד. החוב טרם נמחק.`, entry: two(id(), "מחיקת החוב האבוד", ALLOW, "לקוחות", written, "המחיקה כנגד ההפרשה, בלי הוצאה."), accounts: [ALLOW, "לקוחות", EXPENSE, "מזומן"] },
        {
          title: "ההפרשה להפסדי אשראי",
          story: `החברה מפרישה ${pct(p)} מחוב של לקוח בקשיים, שחייב ${f(specific)} ₪, ו-${pct(g)} משאר הלקוחות.`,
          entry: two(id(), "השלמת ההפרשה", EXPENSE, ALLOW, topUp, `לקוחות אחרי ${cheque ? "התיקון והמחיקה" : "המחיקה"}: ${f(after)}. נדרש: ${f(specific)} × ${pct(p)} + ${f(after - specific)} × ${pct(g)} = ${f(required)}. יש: ${f(allowance)} − ${f(written)} = ${allowance - written < 0 ? `${f(written - allowance)} בחובה` : f(allowance - written)}. ההשלמה: ${f(topUp)}.`),
          accounts: [EXPENSE, ALLOW, "לקוחות", "מזומן"],
        },
      ],
    });
  } else {
    parts.push({ balances: { לקוחות: r.int(100, 800) * 1_000 }, items: [] });
  }

  // -- Level 4: depreciation, and a sale that was not recorded.
  if (level >= 4) {
    const years = r.int(5, 10);
    const vansYear = r.int(Math.max(2018, 2026 - years), 2023);
    const vansMonth = r.int(1, 12);
    const vans = r.int(2, 6) * r.int(1, 10) * 1_200 * years;
    const vanAcc = accumulatedTo(vans, { years }, { year: vansYear, month: vansMonth }, { year: 2024, month: 12 });
    const vanYear = depreciationOfYear(vans, { years }, { year: vansYear, month: vansMonth }, 2025);
    const units = r.int(3, 6);
    const mYears = r.int(5, 10);
    const each = r.int(1, 12) * 1_200 * mYears;
    const mYear = r.int(Math.max(2020, 2026 - mYears), 2023);
    const mMonth = r.int(1, 12);
    const soldMonth = r.int(3, 11);
    const mCost = units * each;
    const mAcc = accumulatedTo(mCost, { years: mYears }, { year: mYear, month: mMonth }, { year: 2024, month: 12 });
    const keptYear = depreciationOfYear((units - 1) * each, { years: mYears }, { year: mYear, month: mMonth }, 2025);
    const soldPart = ((each / mYears) * soldMonth) / 12;
    const soldAcc = accumulatedTo(each, { years: mYears }, { year: mYear, month: mMonth }, { year: 2025, month: soldMonth });
    const proceeds = Math.max(1_000, each - soldAcc + r.pick([-1, 1] as const) * r.int(1, 10) * 500);
    const result = sale(each, soldAcc, proceeds);
    const mStory = `ב-1.${mMonth}.${mYear} נקנו ${units} מכונות זהות ב-${f(each)} ₪ כל אחת, ל-${mYears} שנים. הפחת של 2025 לא נרשם.`;
    parts.push({
      balances: { "כלי רכב": vans, "כלי רכב – פחת נצבר": -vanAcc, מכונות: mCost, "מכונות – פחת נצבר": -mAcc },
      items: [
        { title: "פחת כלי הרכב", story: `כלי הרכב נקנו ב-1.${vansMonth}.${vansYear} ב-${f(vans)} ₪, ל-${years} שנים. הפחת של 2025 לא נרשם.`, entry: two(id(), "פחת כלי הרכב לשנת 2025", "הוצאות פחת", "כלי רכב – פחת נצבר", vanYear, `${f(vans)} ÷ ${years} = ${f(vanYear)}.`), accounts: ["הוצאות פחת", "כלי רכב – פחת נצבר", "כלי רכב", "מזומן"] },
        { title: "פחת המכונות", story: `${mStory} בסוף ${MONTHS[soldMonth]} 2025 נמכרה אחת מהן (ראו הנתון הבא).`, entry: two(id(), "פחת המכונות: אלה שנשארו לשנה, ואחת עד יום המכירה", "הוצאות פחת", "מכונות – פחת נצבר", round2(keptYear + soldPart), `המכונות שנשארו: ${f((units - 1) * each)} ÷ ${mYears} = ${f(keptYear)}. המכונה שנמכרה, ${soldMonth} חודשים: ${f(soldPart)}.`), accounts: ["הוצאות פחת", "מכונות – פחת נצבר", "מכונות", "מזומן"] },
        { title: "מכירת מכונה שלא נרשמה", story: `בסוף ${MONTHS[soldMonth]} 2025 נמכרה מכונה אחת ב-${f(proceeds)} ₪ במזומן. המכירה לא נרשמה.`, entry: { ...saleEntry(id(), "מכירת המכונה", { account: "מכונות", accumulatedAccount: "מכונות – פחת נצבר", cost: each, accumulated: soldAcc }, proceeds), date: "31.12", why: `פחת נצבר על המכונה: ${f(soldAcc)}. עלות מופחתת: ${f(each - soldAcc)}. ${result.result >= 0 ? "רווח" : "הפסד"} הון: ${f(Math.abs(result.result))}.` }, accounts: ["מזומן", "מכונות – פחת נצבר", "מכונות", "רווח הון", "הפסד הון", "הוצאות פחת"] },
      ],
      computed: level === 5 ? [{ account: "מכונות – פחת נצבר", story: mStory, why: `${f(mCost)} ÷ ${mYears} × ${monthsBetween({ year: mYear, month: mMonth }, { year: 2024, month: 12 })}/12: עד סוף 2024, כי הפחת של 2025 עוד לא נרשם.` }] : undefined,
    });
  }

  // -- Level 5: a contract renewed at a new price, and an entry recorded backwards.
  if (level === 5) {
    const [svc, exp] = services[2];
    const pre = `${exp} מראש`;
    const left = r.int(1, 6);
    const monthly = r.int(10, 60) * 100;
    const raise = r.pick([0.05, 0.1, 0.15, 0.2] as const);
    const balance = monthly * left;
    const nm = Math.round(monthly * (1 + raise));
    parts.push({
      balances: { [pre]: balance },
      items: [
        { title: `${svc}: סוף החוזה הישן`, story: `החוזה הישן של ה${svc}, ששולם מראש, נגמר בסוף ${MONTHS[left]} 2025. ב-2025 עוד לא נרשם עליו דבר.`, entry: two(id(), `${svc}: סוף החוזה הישן`, exp, pre, balance, "כל היתרה נוצלה ב-2025."), accounts: [exp, pre, "מזומן", `${exp} לשלם`] },
        {
          title: `${svc}: החוזה החודש`,
          story: `החוזה הוארך לשנה מסוף ${MONTHS[left]} 2025, במחיר גבוה ב-${pct(raise)}, ששולם מראש במזומן. התשלום לא נרשם.`,
          entry: entry(id(), `${svc}: החוזה החדש`, [{ account: exp, dr: nm * (12 - left) }, { account: pre, dr: nm * left }, { account: "מזומן", cr: nm * 12 }], `ישן לחודש: ${f(balance)} ÷ ${left} = ${f(monthly)}. חדש: × ${1 + raise} = ${f(nm)}. ב-2025: ${12 - left} חודשים.`),
          accounts: [exp, pre, "מזומן", `${exp} לשלם`],
        },
      ],
    });
    const base = r.int(30, 120) * 1_000;
    const a = r.int(5, Math.floor(base / 2_000)) * 1_000;
    parts.push({ balances: { "מקדמות מלקוחות": -(base - a) }, items: [{ title: "פקודה שנרשמה הפוך", story: `בדצמבר התקבלה במזומן מקדמה של ${f(a)} ₪ מלקוח. נרשם: ח׳ מקדמות מלקוחות / ז׳ מזומן.`, entry: two(id(), "תיקון: מקדמה שנרשמה הפוך", "מזומן", "מקדמות מלקוחות", a * 2, "מבטלים את מה שנרשם ורושמים את מה שצריך: פעמיים הסכום."), accounts: ["מזומן", "מקדמות מלקוחות", "מכירות", "לקוחות"] }] });
  }

  // Closing stock, last.
  parts.push({ balances: {}, items: [{ title: "מלאי סגירה", story: `ב-31.12.2025 נספר מלאי בעלות ${f(stockCost)} ₪. שווי המימוש נטו שלו ${f(stockNrv)} ₪.`, entry: two(id(), "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(stockCost, stockNrv), "הנמוך מבין העלות לשווי המימוש נטו."), accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"] }] });

  // The rest of the trial balance, then cash as the figure that balances it.
  const balances: Balances = {};
  for (const p of parts) merge(balances, p.balances);
  delete balances.__cheque;
  merge(balances, {
    ספקים: -r.int(100, 600) * 1_000,
    "הון מניות": -r.int(100, 800) * 1_000,
    עודפים: -r.int(50, 600) * 1_000,
    מכירות: -round2(purchases * r.int(14, 22) / 10 + r.int(0, 50) * 1_000),
    "הוצאות חשמל": r.int(10, 60) * 1_000,
    "הוצאות ארנונה": r.int(10, 60) * 1_000,
  });
  const rest = Object.values(balances).reduce((s, v) => s + v, 0);
  let cash = round2(-rest);
  // Cash must stay comfortably positive, also after the adjustments that pay or bring it back: when it would not, the owners put in more share capital.
  const cashMoves = parts.flatMap((p) => p.items).reduce((t, it) => t + it.entry.lines.reduce((u, l) => u + (l.account === "מזומן" ? (l.dr ?? 0) - (l.cr ?? 0) : 0), 0), 0);
  const low = Math.min(cash, cash + cashMoves);
  if (low < 80_000) {
    const more = Math.ceil((80_000 - low) / 10_000) * 10_000;
    balances["הון מניות"] = round2(balances["הון מניות"] - more);
    cash = round2(cash + more);
  }
  const preliminary: Balances = { מזומן: cash, ...balances };
  const items = parts.flatMap((p) => p.items);
  const computed = parts.flatMap((p) => p.computed ?? []);
  return {
    name,
    date: "31.12.2025",
    preliminary,
    items,
    unknown: level >= 3 ? "עודפים" : undefined,
    askRetained: level >= 3,
    computed: computed.length ? computed : undefined,
  };
}
