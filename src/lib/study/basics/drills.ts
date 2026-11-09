import { type Entry, isBalanced } from "../../learn/basics";
import { accumulatedTo, depreciationOfYear, monthsBetween, sale, saleEntry } from "../../learn/basics-ppe";

/**
 * Practice without end for the basics course: a fresh story and fresh numbers
 * each time, from a seed, with the whole solution — the tool, the formula, the
 * numbers, the Excel way and the journal entry. Numbers are drawn so every
 * answer is a whole shekel. A test draws hundreds of seeds per family.
 */

export type DrillStep = { title: string; formula?: string; numbers?: string; note?: string };
export type BasicsDrill = {
  family: DrillFamily;
  prompt: string;
  /** In shekels, always positive and whole. */
  answer: number;
  /** What the answer is, in a few words, under the field. */
  asks: string;
  /** Which tool and why, in plain words: the solution opens with it. */
  tool: string;
  steps: DrillStep[];
  excel: string;
  entries: Entry[];
  trap: string;
  inputs: Record<string, number | string>;
};

type Family = { title: string; lesson: 5 | 6 | 7; level: 1 | 2 | 3 };

export const DRILL_FAMILIES = {
  // Lesson 5: year-end adjustments.
  prepaidAsset: { title: "מראש שנרשם כנכס", lesson: 5, level: 1 },
  prepaidExpense: { title: "מראש שנרשם כהוצאה", lesson: 5, level: 1 },
  unearned: { title: "הכנסה מראש", lesson: 5, level: 1 },
  inventory: { title: "מלאי סגירה ועלות המכר", lesson: 5, level: 1 },
  depFull: { title: "פחת שנה מלאה", lesson: 5, level: 1 },
  salaryRaise: { title: "שכר עם העלאה בדצמבר", lesson: 5, level: 2 },
  salaryBonus: { title: "שכר עם בונוס חד-פעמי", lesson: 5, level: 2 },
  oddBill: { title: "חודש חריג", lesson: 5, level: 2 },
  interest: { title: "ריבית לתקופה", lesson: 5, level: 2 },
  depPart: { title: "פחת לחלק משנה ופחת נצבר", lesson: 5, level: 2 },
  ppeSale: { title: "מכירת רכוש קבוע", lesson: 5, level: 3 },
  // Lesson 6: the preliminary trial balance.
  oldContract: { title: "חוזה ישן", lesson: 6, level: 1 },
  unknownPrepaid: { title: "יתרת ״מראש״ חסרה", lesson: 6, level: 2 },
  endsOrCycles: { title: "חוזה שנגמר או מתחדש", lesson: 6, level: 2 },
  correction: { title: "פקודת תיקון", lesson: 6, level: 2 },
  renewedNewPrice: { title: "חוזה שחודש במחיר אחר", lesson: 6, level: 3 },
  ppeUnknown: { title: "עלות ופחת נצבר ״?״", lesson: 6, level: 3 },
  ppeX: { title: "עלות דרך X", lesson: 6, level: 3 },
  // Lesson 7: credit losses.
  generalTopUp: { title: "הפרשה כללית", lesson: 7, level: 1 },
  writeOffTopUp: { title: "מחיקה והשלמה", lesson: 7, level: 2 },
  specificGeneral: { title: "ספציפית וכללית", lesson: 7, level: 2 },
  decrease: { title: "הקטנת ההפרשה", lesson: 7, level: 2 },
  grossFromNet: { title: "ברוטו מתוך נטו", lesson: 7, level: 2 },
  collections: { title: "גבייה כנעלם", lesson: 7, level: 3 },
  unknownSpecific: { title: "החוב הספציפי כנעלם", lesson: 7, level: 3 },
  recovered: { title: "חוב שנמחק וחזר", lesson: 7, level: 3 },
} as const satisfies Record<string, Family>;
export type DrillFamily = keyof typeof DRILL_FAMILIES;

/** The families of one lesson, in the order above. */
export const familiesOf = (lesson: 5 | 6 | 7) => (Object.keys(DRILL_FAMILIES) as DrillFamily[]).filter((f) => DRILL_FAMILIES[f].lesson === lesson);

/** A small seeded generator, so a seed always gives the same exercise. */
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
  return { int, pick };
}

const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const two = (text: string, dr: string, cr: string, amount: number): Entry => ({ id: "1", date: "31.12.2025", text, lines: [{ account: dr, dr: amount }, { account: cr, cr: amount }] });

const COMPANIES = ["אורן", "גפן", "רימונים", "תמר", "שקד", "ארבל", "נחל", "כרמית", "דקל", "צוקים"] as const;
const company = (r: ReturnType<typeof rng>) => `${r.pick(COMPANIES)} בע״מ`;
const MONTHS = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
/** Prepaid expenses: what is paid for, and its expense account. */
const SERVICES = [
  ["שכירות", "הוצאות שכירות"],
  ["ביטוח", "הוצאות ביטוח"],
  ["פרסום", "הוצאות פרסום"],
  ["אחזקה", "הוצאות אחזקה"],
  ["ניקיון", "הוצאות ניקיון"],
  ["שמירה", "הוצאות שמירה"],
] as const;
const INCOMES = [
  ["שכירות", "הכנסות שכירות"],
  ["ייעוץ", "הכנסות ייעוץ"],
  ["דמי ניהול", "הכנסות דמי ניהול"],
] as const;
/** Fixed assets, each with its own accumulated-depreciation account. */
const ASSETS = [
  ["רכב", "כלי רכב"],
  ["מכונה", "מכונות"],
  ["ציוד", "ציוד"],
  ["מחשבים", "מחשבים"],
] as const;
const ACC = (account: string) => `${account} – פחת נצבר`;
const ALLOW = "הפרשה להפסדי אשראי חזויים";
const EXPENSE = "הוצאות הפסדי אשראי";

export function drill(family: DrillFamily, seed: number): BasicsDrill {
  const r = rng(seed * 7919 + family.length * 104729);
  const co = company(r);
  const base = { family };

  // ---------------------------------------------------------------- lesson 5
  if (family === "prepaidAsset" || family === "prepaidExpense") {
    const [name, expense] = r.pick(SERVICES);
    const months = r.pick([12, 24] as const);
    const start = r.int(2, 12);
    const monthly = r.int(5, 60) * 100;
    const paid = monthly * months;
    const used = 13 - start;
    const prepaid = `${expense} מראש`;
    if (family === "prepaidAsset") {
      const answer = monthly * used;
      return {
        ...base,
        prompt: `ב-1.${start}.2025 שילמה ${co} ${fmt(paid)} ₪ על ${name} ל-${months} חודשים, ורשמה את כל הסכום כ״${prepaid}״. מה סכום פקודת ההתאמה ב-31.12.2025?`,
        answer,
        asks: "הסכום שעובר להוצאה",
        tool: "הכול נרשם כנכס. בסוף השנה מעבירים להוצאה רק את החודשים שכבר נוצלו.",
        steps: [
          { title: "תשלום לחודש", formula: "סכום ששולם ÷ חודשי החוזה", numbers: `${fmt(paid)} ÷ ${months} = ${fmt(monthly)}` },
          { title: "החלק של 2025", formula: "תשלום לחודש × חודשים שנוצלו", numbers: `${fmt(monthly)} × ${used} = ${fmt(answer)}`, note: `מ${MONTHS[start]} עד דצמבר: ${used} חודשים.` },
        ],
        excel: `=${paid}/${months}*${used}`,
        entries: [two(`${name}: החלק של 2025`, expense, prepaid, answer)],
        trap: "להעביר להוצאה את מה שנשאר במקום את מה שנוצל. ההוצאה היא רק החודשים של 2025.",
        inputs: { paid, months, start },
      };
    }
    const answer = paid - monthly * used;
    return {
      ...base,
      prompt: `ב-1.${start}.2025 שילמה ${co} ${fmt(paid)} ₪ על ${name} ל-${months} חודשים, ורשמה את כל הסכום כ״${expense}״. מה סכום פקודת ההתאמה ב-31.12.2025?`,
      answer,
      asks: "הסכום שיוצא מההוצאה ל״מראש״",
      tool: "הכול נרשם כהוצאה. בסוף השנה מוציאים מההוצאה את החודשים ששייכים לשנים הבאות.",
      steps: [
        { title: "תשלום לחודש", formula: "סכום ששולם ÷ חודשי החוזה", numbers: `${fmt(paid)} ÷ ${months} = ${fmt(monthly)}` },
        { title: "מה שייך לשנים הבאות", formula: "תשלום לחודש × חודשים שנשארו", numbers: `${fmt(monthly)} × ${months - used} = ${fmt(answer)}`, note: `נוצלו ${used} חודשים, ונשארו ${months - used}.` },
      ],
      excel: `=${paid}/${months}*${months - used}`,
      entries: [two(`${name}: החלק של השנים הבאות`, prepaid, expense, answer)],
      trap: "לרשום את אותה פקודה כמו כשנרשם כנכס. כאן ההוצאה גדולה מדי, ולכן הכיוון הפוך: ״מראש״ בחובה.",
      inputs: { paid, months, start },
    };
  }

  if (family === "unearned") {
    const [name, income] = r.pick(INCOMES);
    const months = r.pick([12, 18, 24] as const);
    const start = r.int(2, 12);
    const monthly = r.int(4, 50) * 100;
    const received = monthly * months;
    const used = 13 - start;
    const answer = monthly * used;
    const unearned = `${income} מראש`;
    return {
      ...base,
      prompt: `ב-1.${start}.2025 קיבלה ${co} ${fmt(received)} ₪ מראש על ${name} ל-${months} חודשים, ורשמה את הסכום כ״${unearned}״. כמה הכנסה עוברת ל-2025 בפקודת ההתאמה?`,
      answer,
      asks: "ההכנסה של 2025",
      tool: "הכסף התקבל לפני שהשירות ניתן: התחייבות. בסוף השנה מעבירים להכנסה את החודשים שכבר ניתנו.",
      steps: [
        { title: "לחודש", formula: "סכום שהתקבל ÷ חודשים", numbers: `${fmt(received)} ÷ ${months} = ${fmt(monthly)}` },
        { title: "ההכנסה של 2025", formula: "לחודש × חודשים שניתנו", numbers: `${fmt(monthly)} × ${used} = ${fmt(answer)}` },
      ],
      excel: `=${received}/${months}*${used}`,
      entries: [two(`${name}: מה שהורווח ב-2025`, unearned, income, answer)],
      trap: "לרשום את כל הסכום כהכנסה ביום שהתקבל. הכנסה נרשמת כשהשירות ניתן, לא כשהכסף מגיע.",
      inputs: { received, months, start },
    };
  }

  if (family === "inventory") {
    const opening = r.int(20, 200) * 1_000;
    const purchases = r.int(300, 900) * 1_000;
    const cost = r.int(30, 250) * 1_000;
    const nrv = cost + r.pick([-1, 1] as const) * r.int(2, 25) * 1_000;
    const closing = Math.min(cost, nrv);
    const answer = opening + purchases - closing;
    return {
      ...base,
      prompt: `${co}: מלאי פתיחה ${fmt(opening)} ₪, קניות השנה ${fmt(purchases)} ₪. מלאי הסגירה עלה ${fmt(cost)} ₪, ושווי המימוש נטו שלו ${fmt(nrv)} ₪. מהי עלות המכר?`,
      answer,
      asks: "עלות המכר",
      tool: "מלאי הסגירה נרשם לפי הנמוך מבין העלות לשווי המימוש נטו, ואז נכנס לנוסחת עלות המכר.",
      steps: [
        { title: "מלאי הסגירה", formula: "הנמוך מבין עלות לשווי מימוש נטו", numbers: `min(${fmt(cost)}, ${fmt(nrv)}) = ${fmt(closing)}` },
        { title: "עלות המכר", formula: "מלאי פתיחה + קניות − מלאי סגירה", numbers: `${fmt(opening)} + ${fmt(purchases)} − ${fmt(closing)} = ${fmt(answer)}` },
      ],
      excel: `=${opening}+${purchases}-MIN(${cost};${nrv})`,
      entries: [two("רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", closing)],
      trap: nrv < cost ? "לרשום את המלאי בעלות. כששווי המימוש נמוך יותר, נרשם הוא." : "לרשום את שווי המימוש כי הוא גבוה. רושמים את הנמוך מבין השניים, כאן העלות.",
      inputs: { opening, purchases, cost, nrv },
    };
  }

  if (family === "depFull" || family === "depPart" || family === "ppeSale") {
    const [name, account] = r.pick(ASSETS);
    const byRate = r.int(0, 1) === 1;
    const years = byRate ? r.pick([4, 5, 8, 10] as const) : r.int(3, 10);
    const rate = 1 / years;
    const yearly = r.int(1, 20) * 1_200;
    const cost = yearly * years;
    const wear = byRate ? { rate } : { years };
    const how = byRate ? `בפחת של ${pct(rate)} בשנה` : `ל-${years} שנים`;
    const sln = `SLN(${cost};0;${years})`;
    if (family === "depFull") {
      return {
        ...base,
        prompt: `${co} קנתה ב-1.1.2024 ${name} ב-${fmt(cost)} ₪, ${how}. מה סכום פקודת הפחת ב-31.12.2025?`,
        answer: yearly,
        asks: "הוצאות הפחת של 2025",
        tool: "בשנה מלאה בקו ישר הפחת קבוע: עלות ÷ שנים, או עלות × אחוז.",
        steps: [{ title: "פחת שנתי", formula: byRate ? "עלות × שיעור הפחת" : "עלות ÷ שנות השימוש", numbers: byRate ? `${fmt(cost)} × ${pct(rate)} = ${fmt(yearly)}` : `${fmt(cost)} ÷ ${years} = ${fmt(yearly)}` }],
        excel: `=${sln}`,
        entries: [two(`פחת ${name} לשנת 2025`, "הוצאות פחת", ACC(account), yearly)],
        trap: "לזכות את חשבון הנכס עצמו. הפחת נצבר בחשבון נפרד, והעלות נשארת כמו שהיא.",
        inputs: { cost, years, byRate: byRate ? 1 : 0 },
      };
    }
    if (family === "depPart") {
      const variant = r.pick(["first", "accumulated", "book"] as const);
      if (variant === "first") {
        const month = r.int(2, 12);
        const months = 13 - month;
        const answer = depreciationOfYear(cost, wear, { year: 2025, month }, 2025);
        return {
          ...base,
          prompt: `${co} קנתה ב-1.${month}.2025 ${name} ב-${fmt(cost)} ₪, ${how}. מה סכום פקודת הפחת ב-31.12.2025?`,
          answer,
          asks: "הוצאות הפחת של 2025",
          tool: "בשנת הקנייה סופרים רק את החודשים שהנכס היה בעסק.",
          steps: [
            { title: "פחת שנתי", numbers: `${fmt(cost)} ${byRate ? `× ${pct(rate)}` : `÷ ${years}`} = ${fmt(yearly)}` },
            { title: "חלק השנה", formula: "פחת שנתי × חודשים ÷ 12", numbers: `${fmt(yearly)} × ${months}/12 = ${fmt(answer)}`, note: `מ${MONTHS[month]} עד דצמבר: ${months} חודשים.` },
          ],
          excel: `=${sln}*${months}/12`,
          entries: [two(`פחת ${name} לשנת 2025`, "הוצאות פחת", ACC(account), answer)],
          trap: "לרשום פחת של שנה מלאה בשנת הקנייה.",
          inputs: { cost, years, byRate: byRate ? 1 : 0, month, variant },
        };
      }
      const year = r.int(Math.max(2018, 2027 - years), 2024);
      const month = r.int(1, 12);
      const months = monthsBetween({ year, month }, { year: 2025, month: 12 });
      const acc = accumulatedTo(cost, wear, { year, month }, { year: 2025, month: 12 });
      const answer = variant === "accumulated" ? acc : cost - acc;
      return {
        ...base,
        prompt: `${co} קנתה ב-1.${month}.${year} ${name} ב-${fmt(cost)} ₪, ${how}. מה ${variant === "accumulated" ? "הפחת הנצבר" : "העלות המופחתת"} ב-31.12.2025, אחרי פקודת הפחת של 2025?`,
        answer,
        asks: variant === "accumulated" ? "הפחת הנצבר" : "העלות המופחתת",
        tool: "פחת נצבר = פחת שנתי × כל החודשים מיום הקנייה. עלות מופחתת = עלות פחות פחת נצבר.",
        steps: [
          { title: "פחת שנתי", numbers: `${fmt(cost)} ${byRate ? `× ${pct(rate)}` : `÷ ${years}`} = ${fmt(yearly)}` },
          { title: "פחת נצבר", formula: "פחת שנתי × חודשים ÷ 12", numbers: `${fmt(yearly)} × ${months}/12 = ${fmt(acc)}`, note: `מ${MONTHS[month]} ${year} עד דצמבר 2025: ${months} חודשים.` },
          ...(variant === "book" ? [{ title: "עלות מופחתת", formula: "עלות − פחת נצבר", numbers: `${fmt(cost)} − ${fmt(acc)} = ${fmt(answer)}` }] : []),
        ],
        excel: variant === "accumulated" ? `=${sln}*${months}/12` : `=${cost}-${sln}*${months}/12`,
        entries: [two(`פחת ${name} לשנת 2025`, "הוצאות פחת", ACC(account), depreciationOfYear(cost, wear, { year, month }, 2025))],
        trap: "לספור רק שנים שלמות ולשכוח את החודשים של שנת הקנייה.",
        inputs: { cost, years, byRate: byRate ? 1 : 0, year, month, variant },
      };
    }
    // The sale: depreciation to the sale is not yet recorded.
    const year = r.int(Math.max(2019, 2027 - years), 2023);
    const month = r.int(1, 12);
    const soldMonth = r.int(1, 11);
    const acc = accumulatedTo(cost, wear, { year, month }, { year: 2025, month: soldMonth });
    const book = cost - acc;
    const proceeds = Math.max(500, book + r.pick([-1, 1] as const) * r.int(1, 12) * 500);
    const { result } = sale(cost, acc, proceeds);
    const months = monthsBetween({ year, month }, { year: 2025, month: soldMonth });
    return {
      ...base,
      prompt: `${co} קנתה ב-1.${month}.${year} ${name} ב-${fmt(cost)} ₪, ${how}. בסוף ${MONTHS[soldMonth]} 2025 ${name === "מחשבים" ? "הם נמכרו" : "הוא נמכר"} ב-${fmt(proceeds)} ₪ במזומן. הפחת של 2025 עוד לא נרשם. מה הסכום של רווח ההון או של הפסד ההון?`,
      answer: Math.abs(result),
      asks: "רווח או הפסד ההון (בלי סימן)",
      tool: "קודם פחת עד יום המכירה, אחר כך עלות מופחתת, ובסוף התמורה מול העלות המופחתת.",
      steps: [
        { title: "פחת נצבר ביום המכירה", formula: "פחת שנתי × חודשים ÷ 12", numbers: `${fmt(yearly)} × ${months}/12 = ${fmt(acc)}`, note: `מ${MONTHS[month]} ${year} עד ${MONTHS[soldMonth]} 2025: ${months} חודשים.` },
        { title: "עלות מופחתת", formula: "עלות − פחת נצבר", numbers: `${fmt(cost)} − ${fmt(acc)} = ${fmt(book)}` },
        { title: result >= 0 ? "רווח הון" : "הפסד הון", formula: "תמורה − עלות מופחתת", numbers: `${fmt(proceeds)} − ${fmt(book)} = ${result < 0 ? "−" : ""}${fmt(Math.abs(result))}` },
      ],
      excel: `=${proceeds}-(${cost}-${sln}*${months}/12)`,
      entries: [
        two(`פחת ${name} עד יום המכירה`, "הוצאות פחת", ACC(account), (yearly * soldMonth) / 12),
        { ...saleEntry("2", `מכירת ה${name}`, { account, accumulatedAccount: ACC(account), cost, accumulated: acc }, proceeds), date: `${MONTHS[soldMonth]} 2025` },
      ],
      trap: "לשכוח את הפחת של 2025 עד יום המכירה. בלעדיו הפחת הנצבר קטן מדי, והרווח יוצא נמוך מדי.",
      inputs: { cost, years, byRate: byRate ? 1 : 0, year, month, soldMonth, proceeds },
    };
  }

  if (family === "salaryRaise" || family === "salaryBonus") {
    const month = r.int(8, 60) * 1_000;
    if (family === "salaryRaise") {
      const raise = r.pick([0.05, 0.1, 0.15, 0.2] as const);
      const recorded = month * 11;
      const answer = Math.round(month * (1 + raise));
      return {
        ...base,
        prompt: `ב${co} נרשם שכר של ${fmt(recorded)} ₪ על ינואר עד נובמבר 2025, בשווה בכל חודש. מדצמבר העובדים קיבלו העלאה של ${pct(raise)}, ושכר דצמבר ישולם ב-10.1.2026. כמה שכר לשלם רושמים?`,
        answer,
        asks: "שכר דצמבר",
        tool: "קודם חודש רגיל ממה שנרשם, ורק אז ההעלאה של דצמבר.",
        steps: [
          { title: "חודש רגיל", formula: "מה שנרשם ÷ חודשים שנרשמו", numbers: `${fmt(recorded)} ÷ 11 = ${fmt(month)}` },
          { title: "דצמבר", formula: "חודש רגיל × (1 + ההעלאה)", numbers: `${fmt(month)} × ${1 + raise} = ${fmt(answer)}` },
        ],
        excel: `=${recorded}/11*(1+${raise})`,
        entries: [two("שכר דצמבר, אחרי ההעלאה", "הוצאות שכר", "הוצאות שכר לשלם", answer)],
        trap: "לחלק ב-12. נרשמו 11 חודשים, ולכן מחלקים ב-11.",
        inputs: { recorded, raise },
      };
    }
    const staff = r.int(5, 30);
    const gift = r.int(1, 8) * 500;
    const recorded = month * 11 + staff * gift;
    return {
      ...base,
      prompt: `ב${co} נרשם שכר של ${fmt(recorded)} ₪ על ינואר עד נובמבר 2025. בסכום כלול שי לחג של ${fmt(gift)} ₪ לכל אחד מ-${staff} עובדים, שחולק פעם אחת. השכר החודשי קבוע, ושכר דצמבר ישולם ב-10.1.2026. כמה שכר לשלם רושמים?`,
      answer: month,
      asks: "שכר דצמבר",
      tool: "השי לא חוזר כל חודש. מוציאים אותו, ורק אז מחלקים.",
      steps: [
        { title: "השי", numbers: `${fmt(gift)} × ${staff} = ${fmt(gift * staff)}` },
        { title: "חודש רגיל", formula: "(מה שנרשם − השי) ÷ 11", numbers: `(${fmt(recorded)} − ${fmt(gift * staff)}) ÷ 11 = ${fmt(month)}` },
      ],
      excel: `=(${recorded}-${gift}*${staff})/11`,
      entries: [two("שכר דצמבר", "הוצאות שכר", "הוצאות שכר לשלם", month)],
      trap: "לחלק את כל הסכום ב-11. השי נמרח על כל החודשים, והשכר יוצא גבוה מדי.",
      inputs: { recorded, gift, staff },
    };
  }

  if (family === "oddBill") {
    const variant = r.pick(["twoMonths", "dearDecember", "tenAndDear"] as const);
    const month = r.int(10, 90) * 100;
    if (variant === "twoMonths") {
      const recorded = month * 10;
      return {
        ...base,
        prompt: `חשבון הטלפון של ${co} מגיע אחת לחודשיים ומשולם בחודש שאחריו. על ינואר עד אוקטובר 2025 נרשמו ${fmt(recorded)} ₪, בשווה בכל חודש. החשבון של נובמבר ודצמבר ישולם בינואר. כמה הוצאות טלפון לשלם רושמים?`,
        answer: month * 2,
        asks: "נובמבר ודצמבר",
        tool: "חודש רגיל ממה שנרשם, כפול החודשים שחסרים.",
        steps: [
          { title: "חודש רגיל", formula: "מה שנרשם ÷ חודשים שנרשמו", numbers: `${fmt(recorded)} ÷ 10 = ${fmt(month)}` },
          { title: "מה שחסר", numbers: `${fmt(month)} × 2 = ${fmt(month * 2)}` },
        ],
        excel: `=${recorded}/10*2`,
        entries: [two("טלפון נובמבר ודצמבר", "הוצאות טלפון", "הוצאות טלפון לשלם", month * 2)],
        trap: "לחלק ב-12 או ב-11. נרשמו עשרה חודשים.",
        inputs: { recorded, variant },
      };
    }
    const rise = r.pick([0.1, 0.2, 0.3] as const);
    const dec = Math.round(month * (1 + rise));
    if (variant === "dearDecember") {
      const recorded = month * 11;
      return {
        ...base,
        prompt: `הוצאות החשמל של ${co} על ינואר עד נובמבר 2025 נרשמו: ${fmt(recorded)} ₪, בשווה בכל חודש. בדצמבר החשבון גבוה ב-${pct(rise)} מחודש רגיל, והוא ישולם בינואר. כמה הוצאות חשמל לשלם רושמים?`,
        answer: dec,
        asks: "חשמל דצמבר",
        tool: "חודש רגיל ממה שנרשם, ואז התוספת של דצמבר.",
        steps: [
          { title: "חודש רגיל", numbers: `${fmt(recorded)} ÷ 11 = ${fmt(month)}` },
          { title: "דצמבר", numbers: `${fmt(month)} × ${1 + rise} = ${fmt(dec)}` },
        ],
        excel: `=${recorded}/11*(1+${rise})`,
        entries: [two("חשמל דצמבר", "הוצאות חשמל", "הוצאות חשמל לשלם", dec)],
        trap: "לרשום חודש רגיל ולשכוח את התוספת של דצמבר.",
        inputs: { recorded, rise, variant },
      };
    }
    const recorded = month * 10;
    return {
      ...base,
      prompt: `הוצאות הארנונה של ${co} על ינואר עד אוקטובר 2025 נרשמו: ${fmt(recorded)} ₪, בשווה בכל חודש. החשבון של נובמבר ודצמבר יגיע בינואר, ובדצמבר התעריף עלה ב-${pct(rise)}. כמה הוצאות ארנונה לשלם רושמים?`,
      answer: month + dec,
      asks: "נובמבר ודצמבר",
      tool: "נובמבר הוא חודש רגיל. דצמבר הוא חודש רגיל ועוד התוספת.",
      steps: [
        { title: "חודש רגיל", numbers: `${fmt(recorded)} ÷ 10 = ${fmt(month)}` },
        { title: "נובמבר ודצמבר", numbers: `${fmt(month)} + ${fmt(month)} × ${1 + rise} = ${fmt(month + dec)}` },
      ],
      excel: `=${recorded}/10*(2+${rise})`,
      entries: [two("ארנונה נובמבר ודצמבר", "הוצאות ארנונה", "הוצאות ארנונה לשלם", month + dec)],
      trap: "להעלות גם את נובמבר. ההעלאה היא רק מדצמבר.",
      inputs: { recorded, rise, variant },
    };
  }

  if (family === "interest") {
    const side = r.pick(["borrowed", "lent"] as const);
    const half = r.int(0, 1) === 1;
    const k = r.int(1, 25);
    const principal = k * 12_000;
    const rate = half ? r.pick([0.02, 0.025, 0.03, 0.04] as const) : r.int(3, 12) / 100;
    const start = r.int(2, 12);
    const months = 13 - start;
    const answer = Math.round((principal * rate * months) / (half ? 6 : 12));
    const what = side === "borrowed" ? `קיבלה ${co} הלוואה של ${fmt(principal)} ₪` : `הלוותה ${co} ללקוח ${fmt(principal)} ₪`;
    return {
      ...base,
      prompt: `ב-1.${start}.2025 ${what}, בריבית ${half ? "חצי שנתית" : "שנתית"} של ${pct(rate)}. הריבית ${side === "borrowed" ? "תשולם" : "תתקבל"} עם הקרן ב-2027, ועוד לא נרשמה. מה סכום פקודת ההתאמה ב-31.12.2025?`,
      answer,
      asks: side === "borrowed" ? "הוצאות ריבית לשלם" : "הכנסות ריבית לקבל",
      tool: half ? "השיעור לחצי שנה, ולכן מחלקים את החודשים ב-6." : "השיעור לשנה, ולכן מחלקים את החודשים ב-12.",
      steps: [{ title: "הריבית שנצברה", formula: half ? "קרן × שיעור × חודשים ÷ 6" : "קרן × שיעור × חודשים ÷ 12", numbers: `${fmt(principal)} × ${pct(rate)} × ${months}/${half ? 6 : 12} = ${fmt(answer)}`, note: `מ${MONTHS[start]} עד דצמבר: ${months} חודשים.` }],
      excel: `=${principal}*${rate}*${months}/${half ? 6 : 12}`,
      entries: [side === "borrowed" ? two("ריבית שנצברה", "הוצאות ריבית", "הוצאות ריבית לשלם", answer) : two("ריבית שהורווחה", "הכנסות ריבית לקבל", "הכנסות ריבית", answer)],
      trap: half ? "להתייחס לשיעור כשנתי. שיעור חצי שנתי שווה כפול כסף בשנה." : "לקחת ריבית של שנה מלאה. עברו רק החודשים מיום ההלוואה.",
      inputs: { principal, rate, half: half ? 1 : 0, start, side },
    };
  }

  // ---------------------------------------------------------------- lesson 6
  if (family === "oldContract" || family === "unknownPrepaid") {
    const [name, expense] = r.pick(SERVICES);
    const months = r.pick([24, 36] as const);
    const startYear = r.pick([2023, 2024] as const);
    const start = r.int(1, 12);
    const monthly = r.int(5, 50) * 100;
    const paid = monthly * months;
    const usedBefore = monthsBetween({ year: startYear, month: start }, { year: 2024, month: 12 });
    const left = months - usedBefore;
    const balance = monthly * left;
    const prepaid = `${expense} מראש`;
    if (left <= 0) return drill(family, seed + 1000);
    if (family === "oldContract") {
      const used2025 = Math.min(12, left);
      const answer = monthly * used2025;
      return {
        ...base,
        prompt: `ב-1.${start}.${startYear} שילמה ${co} ${fmt(paid)} ₪ על ${name} ל-${months} חודשים, ורשמה את התשלום כ״מראש״. במאזן הבוחן הראשוני של 31.12.2025: ״${prepaid} ${fmt(balance)}״, ואין ״${expense}״. מה סכום פקודת ההתאמה?`,
        answer,
        asks: "ההוצאה של 2025",
        tool: "יש ״מראש״ ואין שורת הוצאה: חוזה ישן. היתרה היא של סוף 2024, וב-2025 עוד לא נרשם כלום.",
        steps: [
          { title: "תשלום לחודש", numbers: `${fmt(paid)} ÷ ${months} = ${fmt(monthly)}` },
          { title: "החודשים של 2025", numbers: `${fmt(monthly)} × ${used2025} = ${fmt(answer)}`, note: left < 12 ? `נשארו רק ${left} חודשים, והחוזה נגמר ב-2025.` : "כל 12 החודשים." },
        ],
        excel: `=${paid}/${months}*${used2025}`,
        entries: [two(`${name}: החודשים של 2025`, expense, prepaid, answer)],
        trap: "לחשוב שהיתרה כבר נכונה ל-31.12.2025. בלי שורת הוצאה, השנה עוד לא נרשם כלום.",
        inputs: { paid, months, start, startYear },
      };
    }
    return {
      ...base,
      prompt: `ב-1.${start}.${startYear} שילמה ${co} ${fmt(paid)} ₪ על ${name} ל-${months} חודשים, ורשמה את התשלום כ״מראש״. במאזן הבוחן הראשוני של 31.12.2025 היתרה של ״${prepaid}״ מופיעה כ-״?״. מה היתרה?`,
      answer: balance,
      asks: "היתרה במאזן הבוחן הראשוני",
      tool: "במאזן בוחן ראשוני היתרה היא של סוף 2024: מה שנשאר אחרי החודשים שנוצלו עד אז.",
      steps: [
        { title: "תשלום לחודש", numbers: `${fmt(paid)} ÷ ${months} = ${fmt(monthly)}` },
        { title: "נוצלו עד סוף 2024", numbers: `${usedBefore} חודשים` },
        { title: "היתרה", formula: "תשלום לחודש × חודשים שנשארו", numbers: `${fmt(monthly)} × ${left} = ${fmt(balance)}` },
      ],
      excel: `=${paid}/${months}*(${months}-${usedBefore})`,
      entries: [two(`${name}: החודשים של 2025`, expense, prepaid, monthly * Math.min(12, left))],
      trap: "לחשב את היתרה לסוף 2025. ההתאמה של 2025 עוד לא נרשמה במאזן הבוחן הראשוני.",
      inputs: { paid, months, start, startYear },
    };
  }

  if (family === "endsOrCycles") {
    const [name, expense] = r.pick(SERVICES);
    const prepaid = `${expense} מראש`;
    const monthly = r.int(5, 50) * 100;
    if (r.int(0, 1) === 0) {
      const left = r.int(1, 11);
      const balance = monthly * left;
      return {
        ...base,
        prompt: `חוזה ${name} של ${co} שולם מראש, ונגמר בסוף ${MONTHS[left]} 2025 בלי שחודש. במאזן הבוחן הראשוני של 31.12.2025: ״${prepaid} ${fmt(balance)}״, ואין ״${expense}״. מה סכום פקודת ההתאמה?`,
        answer: balance,
        asks: "ההוצאה של 2025",
        tool: "חוזה שנגמר במהלך השנה: כל מה שנשאר מסוף 2024 נוצל השנה, והיתרה מתאפסת.",
        steps: [{ title: "ההוצאה", note: `החודשים שנשארו (${left}) נוצלו כולם ב-2025.`, numbers: `${fmt(balance)}` }],
        excel: `=${balance}`,
        entries: [two(`${name}: החוזה נגמר`, expense, prepaid, balance)],
        trap: "להעביר להוצאה רק 12 חודשים או רק חלק. כל היתרה עוברת, כי החוזה נגמר.",
        inputs: { balance, left, variant: "ends" },
      };
    }
    const cycle = r.pick([24, 36] as const);
    const first = r.int(2012, 2019);
    const years = cycle / 12;
    const cycleStart = first + Math.floor((2025 - first) / years) * years;
    const answer = monthly * 12;
    return {
      ...base,
      prompt: `מ-1.1.${first} ${co} משלמת מראש על ${name} ל-${years} שנים, ${fmt(monthly)} ₪ לחודש, ורושמת כל תשלום כ״מראש״. החוזה מתחדש בכל פעם שהוא נגמר, באותו מחיר. מה ההוצאה של 2025?`,
      answer,
      asks: "ההוצאה של 2025",
      tool: "בחוזה שמתחדש באותו מחיר כל שנה עולה אותו דבר. צריך רק לדעת מתי שולם המחזור, כדי לדעת מה היתרה.",
      steps: [
        { title: "המחזור של 2025", note: `המחזורים מתחילים כל ${years} שנים מ-${first}. המחזור של 2025 התחיל ב-1.1.${cycleStart}.` },
        { title: "ההוצאה", numbers: `${fmt(monthly)} × 12 = ${fmt(answer)}` },
      ],
      excel: `=${monthly}*12`,
      entries: [two(`${name}: 12 החודשים של 2025`, expense, prepaid, answer)],
      trap: "להעביר להוצאה את כל התשלום של המחזור. רק 12 החודשים של 2025 הם הוצאה של 2025.",
      inputs: { monthly, cycle, first, variant: "cycles" },
    };
  }

  if (family === "correction") {
    const amount = r.int(4, 90) * 500;
    const variant = r.pick(["creditAsCash", "chequeAsCash", "advanceAsPurchase", "reversed"] as const);
    const cases = {
      creditAsCash: { story: `קנייה באשראי של ${fmt(amount)} ₪ נרשמה: ח׳ קניות / ז׳ מזומן.`, fix: two("תיקון", "מזומן", "ספקים", amount), factor: 1, why: "הקניות נכונות ולא משתתפות. המזומן חוזר, והחוב לספק נוצר." },
      chequeAsCash: { story: `מכירה שחלקה, ${fmt(amount)} ₪, שולם בצ׳ק דחוי, נרשמה כולה במזומן.`, fix: two("תיקון", "לקוחות", "מזומן", amount), factor: 1, why: "המכירה נכונה. החלק בצ׳ק דחוי הוא חוב של הלקוח, לא מזומן." },
      advanceAsPurchase: { story: `מקדמה של ${fmt(amount)} ₪ לספק, על סחורה שתגיע בשנה הבאה, נרשמה: ח׳ קניות / ז׳ מזומן.`, fix: two("תיקון", "מקדמות לספקים", "קניות", amount), factor: 1, why: "המזומן נכון. הסחורה לא הגיעה, ולכן זו לא קנייה אלא נכס." },
      reversed: { story: `התקבלה במזומן מקדמה של ${fmt(amount)} ₪ מלקוח. נרשם: ח׳ מקדמות מלקוחות / ז׳ מזומן.`, fix: two("תיקון", "מזומן", "מקדמות מלקוחות", amount * 2), factor: 2, why: "הצדדים הפוכים. מבטלים את מה שנרשם ורושמים את מה שצריך: פעמיים הסכום." },
    } as const;
    const c = cases[variant];
    return {
      ...base,
      prompt: `${co}: ${c.story} מה סכום פקודת התיקון?`,
      answer: amount * c.factor,
      asks: "סכום התיקון",
      tool: "מה נרשם, מה היה צריך, והתיקון הוא ההפרש. חשבון שנכון בשתיהן לא משתתף.",
      steps: [{ title: "התיקון", note: c.why, numbers: c.factor === 2 ? `${fmt(amount)} × 2 = ${fmt(amount * 2)}` : fmt(amount) }],
      excel: c.factor === 2 ? `=${amount}*2` : `=${amount}`,
      entries: [c.fix],
      trap: c.factor === 2 ? "לתקן רק בסכום המקורי. אז רק מבטלים את הטעות, בלי לרשום את מה שצריך." : "לבטל את כל הפקודה ולרשום מחדש. מספיק להזיז את הסכום מהחשבון השגוי לנכון.",
      inputs: { amount, variant },
    };
  }

  if (family === "renewedNewPrice") {
    const [name, expense] = r.pick(SERVICES);
    const prepaid = `${expense} מראש`;
    const left = r.int(1, 6);
    const monthly = r.int(10, 80) * 100;
    const raise = r.pick([0.05, 0.1, 0.15, 0.2] as const);
    const balance = monthly * left;
    const newMonth = Math.round(monthly * (1 + raise));
    const after = 12 - left;
    const answer = balance + newMonth * after;
    return {
      ...base,
      prompt: `במאזן הבוחן הראשוני של ${co} ל-31.12.2025: ״${prepaid} ${fmt(balance)}״, ואין ״${expense}״. החוזה הישן נגמר בסוף ${MONTHS[left]} 2025, ובאותו יום הוארך לשנה נוספת במחיר גבוה ב-${pct(raise)}, ששולם מראש. התשלום החדש לא נרשם. מהן הוצאות ה${name} של 2025?`,
      answer,
      asks: "ההוצאה של 2025, משני החוזים",
      tool: "קודם התשלום הישן לחודש מתוך היתרה, ורק אז ההעלאה. ההוצאה של השנה היא סוף החוזה הישן ועוד תחילת החדש.",
      steps: [
        { title: "החוזה הישן לחודש", formula: "יתרה ÷ חודשים שנשארו", numbers: `${fmt(balance)} ÷ ${left} = ${fmt(monthly)}` },
        { title: "החוזה החדש לחודש", numbers: `${fmt(monthly)} × ${1 + raise} = ${fmt(newMonth)}` },
        { title: "ההוצאה של 2025", formula: "היתרה הישנה + חדש לחודש × חודשים ב-2025", numbers: `${fmt(balance)} + ${fmt(newMonth)} × ${after} = ${fmt(answer)}` },
      ],
      excel: `=${balance}+${balance}/${left}*(1+${raise})*${after}`,
      entries: [
        two(`${name}: סוף החוזה הישן`, expense, prepaid, balance),
        {
          id: "2",
          date: "31.12.2025",
          text: `${name}: החוזה החדש`,
          lines: [
            { account: expense, dr: newMonth * after },
            { account: prepaid, dr: newMonth * left },
            { account: "מזומן", cr: newMonth * 12 },
          ],
        },
      ],
      trap: "להעלות את המחיר על החוזה הישן, או לשכוח את חודשי החוזה הישן ב-2025.",
      inputs: { balance, left, raise },
    };
  }

  if (family === "ppeUnknown" || family === "ppeX") {
    const [name, account] = r.pick(ASSETS.filter(([, a]) => a !== "ציוד"));
    const years = r.int(4, 10);
    const year = r.int(Math.max(2018, 2026 - years), 2023);
    const month = r.int(1, 12);
    const months = monthsBetween({ year, month }, { year: 2024, month: 12 });
    if (family === "ppeUnknown") {
      const count = r.int(3, 8);
      const sold = r.int(1, count - 1);
      const each = r.int(1, 15) * 1_200 * years;
      const left = count - sold;
      const cost = left * each;
      const acc = Math.round((cost / years) * (months / 12));
      const askAcc = r.int(0, 1) === 1;
      return {
        ...base,
        prompt: `ב-1.${month}.${year} קנתה ${co} ${count} יחידות של ${name}, ${fmt(each)} ₪ כל אחת, ל-${years} שנים. ב-31.12.2024 ${sold === 1 ? "נמכרה אחת מהן בעלותה המופחתת" : `נמכרו ${sold} מהן בעלותן המופחתת`}, והמכירה נרשמה. מה ${askAcc ? "הפחת הנצבר" : "העלות"} במאזן הבוחן הראשוני של 31.12.2025?`,
        answer: askAcc ? acc : cost,
        asks: askAcc ? "הפחת הנצבר במאזן הבוחן" : "העלות במאזן הבוחן",
        tool: "בספרים נשאר רק מה שלא נמכר. הפחת הנצבר במאזן בוחן ראשוני הוא עד סוף השנה הקודמת.",
        steps: [
          { title: "מה בספרים", numbers: `${left} × ${fmt(each)} = ${fmt(cost)}` },
          ...(askAcc ? [{ title: "פחת נצבר עד 31.12.2024", formula: "עלות ÷ שנים × חודשים ÷ 12", numbers: `${fmt(cost)} ÷ ${years} × ${months}/12 = ${fmt(acc)}`, note: `מ${MONTHS[month]} ${year} עד דצמבר 2024: ${months} חודשים.` }] : []),
        ],
        excel: askAcc ? `=SLN(${cost};0;${years})*${months}/12` : `=${left}*${each}`,
        entries: [two(`פחת ${name} לשנת 2025`, "הוצאות פחת", ACC(account), cost / years)],
        trap: askAcc ? "לכלול את הפחת של 2025. הוא עוד לא נרשם במאזן הבוחן הראשוני." : "לכלול את היחידות שנמכרו. הן יצאו מהספרים עם המכירה.",
        inputs: { count, sold, each, years, year, month, askAcc: askAcc ? 1 : 0 },
      };
    }
    const a = r.int(4, 20);
    const b = r.int(2, 10);
    const times = r.pick([1.5, 2, 3] as const);
    const units = a + b * times;
    const x = r.int(1, 25) * 24 * years;
    const cost = units * x;
    const acc = Math.round((cost / years) * (months / 12));
    return {
      ...base,
      prompt: `ב-1.${month}.${year} קנתה ${co} ${a} מחשבים רגילים ו-${b} מחשבים משופרים, ל-${years} שנים. מחשב משופר עולה פי ${times} מרגיל. במאזן הבוחן הראשוני של 31.12.2025, לפני פקודת הפחת של 2025, הפחת הנצבר הוא ${fmt(acc)} ₪, והעלות ״?״. מה העלות?`,
      answer: cost,
      asks: "העלות הכוללת",
      tool: "כותבים את העלות במשתנה אחד, מכפילים בחלק שנשחק עד סוף 2024, ומשווים לפחת הנצבר.",
      steps: [
        { title: "העלות ב-X", numbers: `${a}X + ${b} × ${times}X = ${units}X` },
        { title: "החלק שנשחק", note: `מ${MONTHS[month]} ${year} עד דצמבר 2024: ${months} חודשים מתוך ${years * 12}.` },
        { title: "המשוואה", numbers: `${units}X × ${months}/${years * 12} = ${fmt(acc)} → X = ${fmt(x)}` },
        { title: "העלות", numbers: `${units} × ${fmt(x)} = ${fmt(cost)}` },
      ],
      excel: `=${acc}/(${months}/${years * 12})`,
      entries: [two("פחת המחשבים לשנת 2025", "הוצאות פחת", ACC("מחשבים"), cost / years)],
      trap: "לחשב את החלק שנשחק עד סוף 2025. במאזן בוחן ראשוני הפחת נכון לסוף 2024.",
      inputs: { a, b, times, years, year, month, acc },
    };
  }

  // ---------------------------------------------------------------- lesson 7
  if (family === "generalTopUp" || family === "decrease") {
    const customers = r.int(100, 1_500) * 1_000;
    const rate = r.int(2, 8) / 100;
    const required = Math.round(customers * rate);
    const delta = r.int(1, Math.max(1, Math.floor(required / 2_000))) * 500;
    const before = family === "generalTopUp" ? required - delta : required + delta;
    const up = family === "generalTopUp";
    return {
      ...base,
      prompt: `ב-31.12.2025 יתרת הלקוחות של ${co} היא ${fmt(customers)} ₪, ויתרת ההפרשה להפסדי אשראי ${fmt(before)} ₪. החברה מעמידה את ההפרשה על ${pct(rate)} מהלקוחות. מה סכום פקודת ההתאמה?`,
      answer: delta,
      asks: up ? "הוצאות הפסדי אשראי" : "הקטנת ההפרשה",
      tool: "מחשבים את ההפרשה הנדרשת, ורושמים רק את ההפרש מהיתרה שכבר יש.",
      steps: [
        { title: "ההפרשה הנדרשת", formula: "לקוחות × אחוז", numbers: `${fmt(customers)} × ${pct(rate)} = ${fmt(required)}` },
        { title: up ? "ההשלמה" : "ההקטנה", formula: up ? "נדרשת − קיימת" : "קיימת − נדרשת", numbers: up ? `${fmt(required)} − ${fmt(before)} = ${fmt(delta)}` : `${fmt(before)} − ${fmt(required)} = ${fmt(delta)}` },
      ],
      excel: up ? `=${customers}*${rate}-${before}` : `=${before}-${customers}*${rate}`,
      entries: [up ? two("השלמת ההפרשה", EXPENSE, ALLOW, delta) : two("הקטנת ההפרשה", ALLOW, EXPENSE, delta)],
      trap: up ? "לרשום הוצאה בגובה כל ההפרשה הנדרשת. כבר יש יתרה, ומשלימים רק את ההפרש." : "לרשום הוצאה נוספת. ההפרשה גדולה מהנדרש, ולכן מקטינים אותה.",
      inputs: { customers, rate, before },
    };
  }

  if (family === "writeOffTopUp" || family === "recovered") {
    const rate = r.int(2, 8) / 100;
    const opening = r.int(5, 60) * 1_000;
    const written = r.int(1, 40) * 500;
    const recovered = family === "recovered" ? r.int(1, 10) * 500 : 0;
    const customers = r.int(200, 1_500) * 1_000;
    const required = Math.round(customers * rate);
    const after = opening - written + recovered;
    const answer = required - after;
    if (answer <= 0) return drill(family, seed + 1000);
    return {
      ...base,
      prompt:
        family === "recovered"
          ? `ב-1.1.2025 יתרת ההפרשה להפסדי אשראי של ${co} הייתה ${fmt(opening)} ₪. במהלך השנה נמחק חוב אבוד של ${fmt(written)} ₪, ונגבו ${fmt(recovered)} ₪ מלקוח שחובו נמחק ב-2024. ב-31.12.2025 הלקוחות ${fmt(customers)} ₪, וההפרשה הנדרשת ${pct(rate)} מהם. מהן הוצאות הפסדי האשראי של 2025?`
          : `ב-1.1.2025 יתרת ההפרשה להפסדי אשראי של ${co} הייתה ${fmt(opening)} ₪. במהלך השנה נמחק חוב אבוד של ${fmt(written)} ₪. ב-31.12.2025 הלקוחות ${fmt(customers)} ₪, אחרי המחיקה, וההפרשה הנדרשת ${pct(rate)} מהם. מהן הוצאות הפסדי האשראי של 2025?`,
      answer,
      asks: "הוצאות הפסדי אשראי",
      tool: family === "recovered" ? "מחיקה מקטינה את ההפרשה, וחוב שחזר מחזיר אותה. ההוצאה היא מה שחסר עד הנדרש." : "המחיקה יורדת מההפרשה בלי הוצאה. ההוצאה היא מה שחסר עד הנדרש.",
      steps: [
        { title: "ההפרשה לפני ההתאמה", formula: family === "recovered" ? "פתיחה − מחיקה + חוב שחזר" : "פתיחה − מחיקה", numbers: family === "recovered" ? `${fmt(opening)} − ${fmt(written)} + ${fmt(recovered)} = ${fmt(after)}` : `${fmt(opening)} − ${fmt(written)} = ${fmt(after)}` },
        { title: "הנדרשת", numbers: `${fmt(customers)} × ${pct(rate)} = ${fmt(required)}` },
        { title: "ההוצאה", formula: "נדרשת − לפני ההתאמה", numbers: `${fmt(required)} − ${fmt(after)} = ${fmt(answer)}` },
      ],
      excel: `=${customers}*${rate}-(${opening}-${written}${recovered ? `+${recovered}` : ""})`,
      entries: [two("השלמת ההפרשה", EXPENSE, ALLOW, answer)],
      trap: family === "recovered" ? "לרשום את החוב שחזר כהכנסה. הוא חוזר להפרשה, ולכן ההוצאה של השנה קטנה." : "לרשום את המחיקה כהוצאה. המחיקה יוצאת מההפרשה שכבר נרשמה.",
      inputs: { opening, written, recovered, customers, rate },
    };
  }

  if (family === "specificGeneral") {
    const customers = r.int(200, 1_500) * 1_000;
    const specific = r.int(10, 150) * 1_000;
    const p = r.pick([0.25, 0.4, 0.5, 0.6, 0.8] as const);
    const g = r.int(2, 6) / 100;
    const required = Math.round(specific * p + (customers - specific) * g);
    const before = Math.max(0, required - r.int(1, 40) * 500);
    const answer = required - before;
    return {
      ...base,
      prompt: `ב-31.12.2025 יתרת הלקוחות של ${co} היא ${fmt(customers)} ₪, ובהם לקוח בקשיים שחייב ${fmt(specific)} ₪. החברה מפרישה ${pct(p)} מהחוב שלו, ו-${pct(g)} משאר הלקוחות. יתרת ההפרשה לפני ההתאמה ${fmt(before)} ₪. מהן הוצאות הפסדי האשראי?`,
      answer,
      asks: "הוצאות הפסדי אשראי",
      tool: "הפרשה ספציפית על הלקוח בקשיים, וכללית רק על שאר הלקוחות, כדי שהוא לא ייספר פעמיים.",
      steps: [
        { title: "ספציפית", numbers: `${fmt(specific)} × ${pct(p)} = ${fmt(specific * p)}` },
        { title: "כללית", formula: "(לקוחות − החוב הספציפי) × אחוז", numbers: `(${fmt(customers)} − ${fmt(specific)}) × ${pct(g)} = ${fmt((customers - specific) * g)}` },
        { title: "ההוצאה", numbers: `${fmt(required)} − ${fmt(before)} = ${fmt(answer)}` },
      ],
      excel: `=${specific}*${p}+(${customers}-${specific})*${g}-${before}`,
      entries: [two("השלמת ההפרשה", EXPENSE, ALLOW, answer)],
      trap: "לחשב את האחוז הכללי על כל הלקוחות, כולל הלקוח בקשיים.",
      inputs: { customers, specific, p, g, before },
    };
  }

  if (family === "grossFromNet") {
    const rate = r.pick([0.02, 0.04, 0.05, 0.08, 0.1] as const);
    const gross = r.int(10, 200) * 5_000;
    const net = Math.round(gross * (1 - rate));
    return {
      ...base,
      prompt: `ב-31.12.2024 הלקוחות נטו של ${co} היו ${fmt(net)} ₪. ההפרשה הייתה ${pct(rate)} מהלקוחות ברוטו. מה הלקוחות ברוטו?`,
      answer: gross,
      asks: "לקוחות ברוטו",
      tool: "נטו הוא ברוטו פחות האחוז. לכן נטו = ברוטו × (1 − אחוז), וחוזרים אחורה בחילוק.",
      steps: [{ title: "ברוטו", formula: "נטו ÷ (1 − אחוז)", numbers: `${fmt(net)} ÷ ${1 - rate} = ${fmt(gross)}` }],
      excel: `=${net}/(1-${rate})`,
      entries: [],
      trap: "להוסיף את האחוז לנטו. האחוז מחושב על הברוטו, ולכן מחלקים.",
      inputs: { net, rate },
    };
  }

  if (family === "collections") {
    const opening = r.int(100, 800) * 1_000;
    const sales = r.int(500, 3_000) * 1_000;
    const written = r.int(2, 40) * 1_000;
    const collected = r.int(Math.floor((opening + sales) / 2_000), Math.floor((opening + sales - written - 10_000) / 1_000)) * 1_000;
    const closing = opening + sales - written - collected;
    return {
      ...base,
      prompt: `${co}: לקוחות ב-1.1.2025 ${fmt(opening)} ₪. מכירות באשראי ב-2025 ${fmt(sales)} ₪, וחוב אבוד שנמחק ${fmt(written)} ₪. ב-31.12.2025 הלקוחות ${fmt(closing)} ₪. כמה נגבה מלקוחות ב-2025?`,
      answer: collected,
      asks: "הגבייה",
      tool: "כרטיס הלקוחות: פתיחה ומכירות בחובה, גבייה ומחיקות בזכות. הגבייה היא מה שמאזן את הכרטיס.",
      steps: [{ title: "הגבייה", formula: "פתיחה + מכירות באשראי − מחיקות − סגירה", numbers: `${fmt(opening)} + ${fmt(sales)} − ${fmt(written)} − ${fmt(closing)} = ${fmt(collected)}` }],
      excel: `=${opening}+${sales}-${written}-${closing}`,
      entries: [],
      trap: "לשכוח את המחיקה. גם היא מקטינה את הלקוחות, ובלעדיה הגבייה יוצאת גדולה מדי.",
      inputs: { opening, sales, written, closing },
    };
  }

  // unknownSpecific: the specifically provided debt, from a given expense.
  const customers = r.int(300, 2_000) * 1_000;
  const p = r.pick([0.2, 0.3, 0.4, 0.5] as const);
  const g = r.int(2, 5) / 100;
  const debt = r.int(10, 200) * 1_000;
  const closingAllowance = Math.round(debt * p + (customers - debt) * g);
  const opening = r.int(5, 60) * 1_000;
  const written = r.int(1, 30) * 500;
  const expense = closingAllowance - (opening - written);
  if (expense <= 0) return drill(family, seed + 1000);
  return {
    ...base,
    prompt: `${co}: ב-1.1.2025 ההפרשה להפסדי אשראי ${fmt(opening)} ₪. ב-2025 נמחק חוב של ${fmt(written)} ₪, והוצאות הפסדי האשראי היו ${fmt(expense)} ₪. ב-31.12.2025 הלקוחות ${fmt(customers)} ₪. החברה הפרישה ${pct(p)} מחוב של לקוח אחד, ו-${pct(g)} משאר הלקוחות. מה החוב של הלקוח הזה?`,
    answer: debt,
    asks: "החוב שהופרש עליו ספציפית",
    tool: "קודם יתרת הסגירה של ההפרשה מכרטיס ההפרשה, ואז משוואה: X × אחוז ספציפי + (לקוחות − X) × אחוז כללי.",
    steps: [
      { title: "ההפרשה בסוף השנה", formula: "פתיחה − מחיקה + הוצאה", numbers: `${fmt(opening)} − ${fmt(written)} + ${fmt(expense)} = ${fmt(closingAllowance)}` },
      { title: "המשוואה", numbers: `X × ${pct(p)} + (${fmt(customers)} − X) × ${pct(g)} = ${fmt(closingAllowance)}` },
      { title: "X", formula: "(הפרשה − לקוחות × כללי) ÷ (ספציפי − כללי)", numbers: `(${fmt(closingAllowance)} − ${fmt(customers * g)}) ÷ ${Math.round((p - g) * 1000) / 1000} = ${fmt(debt)}` },
    ],
    excel: `=(${closingAllowance}-${customers}*${g})/(${p}-${g})`,
    entries: [],
    trap: "להציב את ההוצאה במקום יתרת הסגירה. ההוצאה היא רק התנועה של השנה.",
    inputs: { opening, written, expense, customers, p, g },
  };
}

/** Every drill's entries balance: checked here so a broken one fails loudly. */
export function checkDrill(d: BasicsDrill) {
  for (const e of d.entries) if (!isBalanced(e)) throw new Error(`${d.family}: unbalanced entry ${e.text}`);
  return d;
}
