import { lessee, type LesseeTerms, pvEnd, type ShownYear, shownYears, type StatementSection, statementLines } from "../../learn/ifrs16";
import { fmt } from "./shared";

/**
 * Practice without end: a fresh lease each time, every figure from the solver,
 * with the whole solution. A test re-computes each answer from the drill's
 * inputs, from dated cash flows, over hundreds of seeds.
 */
export type DrillStep = { title: string; formula?: string; numbers?: string; note?: string };
export type Drill = { prompt: string; answer: number; unit: string; steps: DrillStep[]; trap: string; inputs: Record<string, number> };

export const DRILL_FAMILIES = {
  end: "התחייבות: תשלום בסוף שנה",
  start: "התחייבות: תשלום בתחילת שנה",
  guarantee: "התחייבות עם ערבות שייר",
  cost: "עלות נכס זכות השימוש",
  cycle: "מעגל ההתחייבות",
  dep: "פחת",
  split: "שוטף ולא שוטף",
} as const;
export type DrillFamily = keyof typeof DRILL_FAMILIES;

/** A small seeded generator, so a seed always gives the same lease. */
function rng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { int: (a: number, b: number, step = 1) => a + Math.floor(next() * (Math.floor((b - a) / step) + 1)) * step };
}

const rateOf = (r: ReturnType<typeof rng>) => r.int(30, 90, 5) / 1000;
const pct = (i: number) => `${(i * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
const whole = (v: number) => Math.round(v);

export function drill(family: DrillFamily, seed: number): Drill {
  const r = rng(seed * 31 + family.length);
  const payment = r.int(12_000, 96_000, 1_000);
  const years = r.int(3, 9);
  const i = rateOf(r);
  if (family === "end") {
    const L = pvEnd(i, years, payment);
    return {
      prompt: `חברה חכרה נכס ל-${years} שנים. התשלום ${fmt(payment)} ש״ח בסוף כל שנה, והריבית התוספתית ${pct(i)}. מהי התחייבות החכירה במועד התחילה?`,
      answer: whole(L),
      unit: "ש״ח",
      inputs: { payment, years, i },
      steps: [
        { title: "מה מהוונים", note: `${years} תשלומים, הראשון בעוד שנה.` },
        { title: "החישוב", formula: "תשלום × (1 − (1 + i)^(−n)) ÷ i = התחייבות", numbers: `${fmt(payment)} × (1 − ${(1 + i).toFixed(3)}^(−${years})) ÷ ${i} = ${fmt(whole(L))}` },
        { title: "באקסל", numbers: `=PV(${pct(i)};${years};-${payment}) → ${fmt(whole(L))}` },
      ],
      trap: "להוון גם את התשלום הראשון כאילו שולם היום. כשמשלמים בסוף שנה, הוא רחוק שנה שלמה.",
    };
  }
  if (family === "start") {
    const { liability: gross } = lessee({ payment, years, rate: i, timing: "start" });
    const net = gross - payment;
    return {
      prompt: `חברה חכרה נכס ל-${years} שנים. התשלום ${fmt(payment)} ש״ח בתחילת כל שנה, והראשון שולם במועד התחילה. הריבית התוספתית ${pct(i)}. מהי התחייבות החכירה מיד אחרי התשלום הראשון?`,
      answer: whole(net),
      unit: "ש״ח",
      inputs: { payment, years, i },
      steps: [
        { title: "מה נשאר לשלם", note: `התשלום של היום כבר שולם, ונשארו ${years - 1} תשלומים, הראשון בעוד שנה.` },
        { title: "החישוב", formula: "תשלום × (1 − (1 + i)^(−(n − 1))) ÷ i = התחייבות", numbers: `${fmt(payment)} × (1 − ${(1 + i).toFixed(3)}^(−${years - 1})) ÷ ${i} = ${fmt(whole(net))}` },
        { title: "באקסל", numbers: `=PV(${pct(i)};${years - 1};-${payment}) → ${fmt(whole(net))}` },
      ],
      trap: "להשאיר את התשלום של היום בהתחייבות. הוא כבר שולם, ולכן הוא נכנס לעלות הנכס ולא לחוב.",
    };
  }
  if (family === "guarantee") {
    const guarantee = r.int(10_000, 60_000, 1_000);
    const expected = r.int(0, guarantee - 1_000, 1_000);
    const shortfall = guarantee - expected;
    const L = pvEnd(i, years, payment, shortfall);
    return {
      prompt: `חברה חכרה נכס ל-${years} שנים, ב-${fmt(payment)} ש״ח בסוף כל שנה, בריבית ${pct(i)}. היא ערבה שערך הנכס בסוף יהיה לפחות ${fmt(guarantee)} ש״ח, ומשלימה הפרש במזומן. היא צופה שהערך יהיה ${fmt(expected)} ש״ח. מהי התחייבות החכירה במועד התחילה?`,
      answer: whole(L),
      unit: "ש״ח",
      inputs: { payment, years, i, shortfall },
      steps: [
        { title: "כמה צפויה לשלם בסוף", formula: "ערבות − ערך צפוי = סכום צפוי", numbers: `${fmt(guarantee)} − ${fmt(expected)} = ${fmt(shortfall)}` },
        { title: "החישוב", formula: "תשלום × (1 − (1 + i)^(−n)) ÷ i + סכום צפוי ÷ (1 + i)^n = התחייבות", numbers: `${fmt(whole(pvEnd(i, years, payment)))} + ${fmt(whole(shortfall / (1 + i) ** years))} = ${fmt(whole(L))}` },
        { title: "באקסל", numbers: `=PV(${pct(i)};${years};-${payment};-${shortfall}) → ${fmt(whole(L))}` },
      ],
      trap: "להוון את כל הערבות. החוכר מכניס רק את מה שהוא צופה לשלם בפועל.",
    };
  }
  if (family === "cycle") {
    const start = r.int(0, 1);
    const k = r.int(1, 2);
    const { rows } = shownYears({ payment, years, rate: i, timing: start ? "start" : "end" });
    const when = start ? "בתחילת כל שנה, והראשון שולם במועד התחילה" : "בסוף כל שנה";
    return {
      prompt: `חברה חכרה נכס ל-${years} שנים. התשלום ${fmt(payment)} ש״ח ${when}. הריבית התוספתית ${pct(i)}. מהי יתרת התחייבות החכירה ב-31.12 של שנה ${k}?`,
      answer: rows[k - 1].closing,
      unit: "ש״ח",
      inputs: { payment, years, i, start, k },
      steps: [
        { title: "ההתחייבות ביום הראשון", note: start ? `הערך הנוכחי של כל ${years} התשלומים, לפני התשלום של היום: ${fmt(rows[0].opening)}.` : `הערך הנוכחי של ${years} התשלומים: ${fmt(rows[0].opening)}.` },
        ...rows.slice(0, k).map((y) => ({
          title: `שנה ${y.year}`,
          formula: start ? "פתיחה − תשלום + ריבית = סגירה" : "פתיחה + ריבית − תשלום = סגירה",
          numbers: start ? `${fmt(y.opening)} − ${fmt(payment)} + ${fmt(y.interest)} = ${fmt(y.closing)}` : `${fmt(y.opening)} + ${fmt(y.interest)} − ${fmt(payment)} = ${fmt(y.closing)}`,
          note: start ? `הריבית על היתרה אחרי התשלום: (${fmt(y.opening)} − ${fmt(payment)}) × ${i}.` : `הריבית על היתרה בפתיחה: ${fmt(y.opening)} × ${i}.`,
        })),
      ],
      trap: start ? "לחשב ריבית על היתרה לפני התשלום. התשלום יצא ב-1.1, ולכן הוא כבר לא נושא ריבית השנה." : "להוריד את כל התשלום מהקרן בלי להוסיף ריבית. התשלום משלם קודם את הריבית של השנה.",
    };
  }
  if (family === "dep") {
    const option = r.int(0, 1);
    const life = option ? years + r.int(1, 6) : r.int(Math.max(2, years - 2), years + 6);
    const cost = r.int(60, 600, 10) * 1_000;
    const over = option ? life : Math.min(life, years);
    const optionText = option ? "ודאי באופן סביר שתממש בסוף התקופה אופציית רכישה" : "אין אופציית רכישה ולא עוברת בעלות";
    return {
      prompt: `עלות נכס זכות השימוש של חברה היא ${fmt(cost)} ש״ח. תקופת החכירה ${years} שנים, ואורך החיים השימושיים של הנכס ${life} שנים. ${optionText}. הפחת בקו ישר. מהי הוצאת הפחת השנתית?`,
      answer: whole(cost / over),
      unit: "ש״ח",
      inputs: { cost, years, life, option },
      steps: [
        { title: "על פני כמה שנים (סעיף 32)", note: option ? `החברה תקנה את הנכס, ולכן לאורך החיים: ${life} שנים.` : `הנכס חוזר למחכיר, ולכן הקצר מבין החיים והתקופה: ${over} שנים.` },
        { title: "החישוב", formula: "עלות ÷ שנות פחת = פחת שנתי", numbers: `${fmt(cost)} ÷ ${over} = ${fmt(whole(cost / over))}` },
      ],
      trap: option ? "להפחית על פני תקופת החכירה. אחרי שהאופציה תמומש, החברה ממשיכה להשתמש בנכס שלה." : "להפחית לאורך החיים. החברה משתמשת בנכס רק עד סוף החכירה.",
    };
  }
  if (family === "split") {
    const start = r.int(0, 1);
    const k = r.int(1, Math.min(3, years - 2));
    const { rows } = shownYears({ payment, years, rate: i, timing: start ? "start" : "end" });
    const y = rows[k - 1];
    const when = start ? "בתחילת כל שנה, והראשון שולם במועד התחילה" : "בסוף כל שנה";
    return {
      prompt: `חברה חכרה נכס ל-${years} שנים. התשלום ${fmt(payment)} ש״ח ${when}. הריבית התוספתית ${pct(i)}. מהו החלק הלא שוטף של התחייבות החכירה ב-31.12 של שנה ${k}?`,
      answer: y.nonCurrent,
      unit: "ש״ח",
      inputs: { payment, years, i, start, k },
      steps: start
        ? [
            { title: `היתרה ב-31.12 של שנה ${k}`, numbers: fmt(y.closing) },
            { title: "מה ישולם בתוך 12 חודשים", note: `התשלום של מחר, ${fmt(payment)}. הוא החלק השוטף.` },
            { title: "החלק הלא שוטף", formula: "יתרה − התשלום הבא = לא שוטף", numbers: `${fmt(y.closing)} − ${fmt(payment)} = ${fmt(y.nonCurrent)}` },
          ]
        : [
            { title: `היתרה ב-31.12 של שנה ${k}`, numbers: fmt(y.closing) },
            { title: "מה יישאר בעוד שנה", note: `אחרי התשלום הבא נשארים ${years - k - 1} תשלומים. הערך הנוכחי שלהם הוא היתרה של סוף השנה הבאה, והוא הלא שוטף.` },
            { title: "החלק הלא שוטף", numbers: `=PV(${pct(i)};${years - k - 1};-${payment}) → ${fmt(y.nonCurrent)}` },
            { title: "החלק השוטף", formula: "יתרה − לא שוטף = שוטף", numbers: `${fmt(y.closing)} − ${fmt(y.nonCurrent)} = ${fmt(y.current)}` },
          ],
      trap: start ? "לחשוב שהחלק השוטף הוא הקרן, כמו בתשלום בסוף שנה. התשלום של מחר משולם כולו בתוך 12 חודשים." : "לקחת את כל התשלום הבא כשוטף. חלק ממנו ריבית שעוד לא נוצרה, ולכן השוטף הוא רק הקטנת הקרן.",
    };
  }
  const prepaid = r.int(0, 9_000, 1_000);
  const incentives = r.int(1_000, 8_000, 1_000);
  const directCosts = r.int(1_000, 9_000, 1_000);
  const restoration = r.int(2_000, 20_000, 1_000);
  const L = pvEnd(i, years, payment);
  const { cost } = lessee({ payment, years, rate: i, timing: "end", prepaid, incentives, directCosts, restoration });
  return {
    prompt: `התחייבות החכירה של חברה היא ${fmt(whole(L))} ש״ח. לפני מועד התחילה שילמה מקדמה של ${fmt(prepaid)} ש״ח, קיבלה מהמחכיר תמריץ של ${fmt(incentives)} ש״ח, ושילמה עלויות ישירות ראשוניות של ${fmt(directCosts)} ש״ח. הערך הנוכחי של עלויות הפירוק ${fmt(restoration)} ש״ח. מהי עלות נכס זכות השימוש?`,
    answer: whole(whole(L) + prepaid - incentives + directCosts + restoration),
    unit: "ש״ח",
    inputs: { payment, years, i, prepaid, incentives, directCosts, restoration, cost },
    steps: [
      { title: "החישוב (סעיף 24)", formula: "התחייבות + מקדמות − תמריצים + עלויות ישירות + פירוק = עלות", numbers: `${fmt(whole(L))} + ${fmt(prepaid)} − ${fmt(incentives)} + ${fmt(directCosts)} + ${fmt(restoration)} = ${fmt(whole(whole(L) + prepaid - incentives + directCosts + restoration))}` },
    ],
    trap: "להוסיף את התמריץ. המחכיר הוא ששילם, ולכן הוא מקטין את העלות של הנכס.",
  };
}

/** A lease to carry into the statements: every line a cell the learner fills, with the whole solution. */
export type StatementTask = {
  prompt: string;
  years: number;
  /** The first columns, already filled in. */
  given: number;
  cost: number;
  rows: ShownYear[];
  sections: StatementSection[];
  notes: string[];
  trap: string;
  inputs: Record<string, number>;
};

/** Build a task from a lease's terms and any other yearly expense. */
export function statementTask(a: { prompt: string; terms: LesseeTerms; years: number; given?: number; other?: { label: string; values: number[] }[]; notes: string[]; trap: string; inputs?: Record<string, number> }): StatementTask {
  const { cost, rows } = shownYears(a.terms);
  return { prompt: a.prompt, years: a.years, given: a.given ?? 0, cost, rows, sections: statementLines(rows, a.years, a.other), notes: a.notes, trap: a.trap, inputs: a.inputs ?? {} };
}

/** A fresh lease for the statements table: paid in advance or in arrears, sometimes with a purchase option, sometimes with a payment that follows sales. */
export function statementDrill(seed: number): StatementTask {
  const r = rng(seed * 47 + 11);
  const payment = r.int(20_000, 96_000, 1_000);
  const years = r.int(3, 6);
  const i = rateOf(r);
  const start = r.int(0, 1);
  const directCosts = r.int(0, 6) * 1_000;
  const hasOption = r.int(0, 2) === 0;
  const option = hasOption ? r.int(4, 20) * 1_000 : 0;
  const life = hasOption ? years + r.int(1, 5) : years + r.int(-1, 4);
  const hasVariable = r.int(0, 2) === 0;
  const sales = hasVariable ? r.int(200, 900, 50) * 1_000 : 0;
  const variable = sales * 0.02;
  const depYears = hasOption ? life : Math.min(life, years);
  const when = start ? "בתחילת כל שנה, והראשון שולם ב-1.1 של שנה 1" : "בסוף כל שנה";
  const words = [
    `ב-1.1 של שנה 1 חברה חכרה מכונה ל-${years} שנים. התשלום ${fmt(payment)} ש״ח ${when}. הריבית התוספתית ${pct(i)}, והריבית הגלומה לא ידועה.`,
    directCosts ? `החברה שילמה ב-1.1 עלויות ישירות ראשוניות של ${fmt(directCosts)} ש״ח.` : "אין עלויות ישירות.",
    `אורך החיים השימושיים של המכונה ${life} שנים, והפחת בקו ישר.`,
    hasOption ? `ודאי באופן סביר שבסוף התקופה החברה תקנה את המכונה ב-${fmt(option)} ש״ח.` : "בסוף התקופה המכונה חוזרת למחכיר.",
    hasVariable ? `בנוסף החברה משלמת 2% מהמכירות, שהן ${fmt(sales)} ש״ח בכל שנה.` : "",
    "הציגו את הסעיפים בדוחות לשתי השנים הראשונות.",
  ];
  return statementTask({
    prompt: words.filter(Boolean).join(" "),
    terms: { payment, years, rate: i, timing: start ? "start" : "end", finalAmount: option, directCosts, depreciationYears: depYears },
    years: 2,
    other: hasVariable ? [{ label: "הוצאות חכירה משתנות", values: [variable, variable] }] : [],
    notes: [
      hasOption ? `פחת על פני ${depYears} שנים: אורך החיים, כי החברה תקנה את המכונה (סעיף 32).` : `פחת על פני ${depYears} שנים: הקצר מבין החיים והתקופה (סעיף 32).`,
      start ? "הריבית על היתרה אחרי התשלום של 1.1. בלא שוטף: היתרה פחות התשלום של מחר." : "הריבית על היתרה בפתיחה. בלא שוטף: היתרה של סוף השנה הבאה.",
      ...(hasVariable ? [`התשלום לפי מכירות אינו בהתחייבות. הוא הוצאה של כל שנה: ${fmt(sales)} × 0.02 = ${fmt(variable)}.`] : []),
    ],
    trap: start ? "לחשב ריבית על היתרה לפני התשלום, או להשאיר את התשלום של מחר בלא שוטף." : "לקחת את כל התשלום הבא כשוטף. חלק ממנו ריבית שעוד לא נוצרה.",
    inputs: { payment, years, i, start, directCosts, option, life, variable, depYears },
  });
}