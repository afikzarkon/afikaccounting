import { lessee, pvEnd } from "../../learn/ifrs16";
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
