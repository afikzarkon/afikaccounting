import { groupPosition, profitSplit, separateInvestment } from "../../learn/consolidated";
import { fmt } from "./shared";

/** Endless practice with new numbers: each family is one calculation, a seed always gives the same exercise, and every answer is a whole shekel. */

export type DrillStep = { title: string; numbers: string };
export type Drill = { prompt: string; answer: number; steps: DrillStep[]; trap: string };

export const DRILL_FAMILIES = {
  ncieq: "זשמ״ש בהון",
  owners: "הון הבעלים",
  nciprofit: "זשמ״ש ברווח",
  assets: "נכסים במאוחד",
  costinc: "הכנסה לפי עלות",
  eqbal: "יתרה בשווי מאזני",
} as const;

export type DrillFamily = keyof typeof DRILL_FAMILIES;

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

/** Holdings in steps of five, and amounts in thousands that divide by twenty, so every share is a whole shekel. */
export function drill(family: DrillFamily, seed: number): Drill {
  const r = rng(seed * 37 + family.length);
  const pct = r.int(55, 95, 5);
  const h = pct / 100;
  const out = 100 - pct;
  const parentNet = r.int(30, 150) * 20_000;
  const subAssets = r.int(30, 90) * 20_000;
  const subLiabilities = r.int(5, 25) * 20_000;
  const parentProfit = r.int(5, 40) * 20_000;
  const subProfit = r.int(3, 20) * 20_000;
  const subDividend = r.int(1, 3) * 20_000;
  const cost = r.int(10, 40) * 20_000;
  const parentAssets = parentNet + 400_000;
  const g = groupPosition({ parentAssets, parentLiabilities: 400_000, subAssets, subLiabilities, holding: h });
  const p = profitSplit({ parentProfit, subProfit, holding: h });
  const s = separateInvestment({ cost, holding: h, subProfit, subDividend });

  if (family === "ncieq")
    return {
      prompt: `לחברה בת נכסים של ${fmt(subAssets)} ש״ח והתחייבויות של ${fmt(subLiabilities)} ש״ח. החברה האם מחזיקה ${pct}% ממנה, ולא שולם מוניטין. מהי יתרת הזשמ״ש בדוח המאוחד?`,
      answer: g.nci,
      steps: [
        { title: "הנכסים נטו של הבת", numbers: `${fmt(subAssets)} − ${fmt(subLiabilities)} = ${fmt(g.subNet)}` },
        { title: `חלק הזשמ״ש, ${out}%`, numbers: `${fmt(g.subNet)} × ${out}% = ${fmt(g.nci)}` },
      ],
      trap: "לחשב את האחוז מהנכסים, בלי להוריד התחייבויות.",
    };
  if (family === "owners")
    return {
      prompt: `לחברה אם נכסים נטו של ${fmt(parentNet)} ש״ח, בלי ההשקעה בבת. היא מחזיקה ${pct}% מחברה בת שהנכסים נטו שלה ${fmt(g.subNet)} ש״ח, ולא שולם מוניטין. מה ההון המיוחס לבעלים של האם בדוח המאוחד?`,
      answer: g.owners,
      steps: [{ title: `100% מהאם, ועוד ${pct}% מהבת`, numbers: `${fmt(parentNet)} + ${fmt(g.subNet)} × ${pct}% = ${fmt(g.owners)}` }],
      trap: "לחבר את כל הנכסים נטו של הבת, בלי להוריד את חלק הזשמ״ש.",
    };
  if (family === "nciprofit")
    return {
      prompt: `חברה מחזיקה ${pct}% מהבת שלה. הרווח של האם, בלי מה שהרוויחה מהבת, הוא ${fmt(parentProfit)} ש״ח, והרווח של הבת ${fmt(subProfit)} ש״ח. מה חלק הזשמ״ש ברווח המאוחד?`,
      answer: p.nci,
      steps: [{ title: `הזשמ״ש מקבלים ${out}% מהרווח של הבת בלבד`, numbers: `${fmt(subProfit)} × ${out}% = ${fmt(p.nci)}` }],
      trap: "לחשב את האחוז מכל הרווח המאוחד. לזשמ״ש אין חלק ברווח של האם.",
    };
  if (family === "assets")
    return {
      prompt: `לחברה אם נכסים של ${fmt(parentAssets)} ש״ח, בלי ההשקעה בבת. היא מחזיקה ${pct}% מחברה בת שיש לה נכסים של ${fmt(subAssets)} ש״ח. אין יתרות בין החברות. מה סך הנכסים בדוח המאוחד?`,
      answer: g.assets,
      steps: [{ title: "מחברים 100% משתי החברות", numbers: `${fmt(parentAssets)} + ${fmt(subAssets)} = ${fmt(g.assets)}` }],
      trap: `לקחת רק ${pct}% מהנכסים של הבת.`,
    };
  if (family === "costinc")
    return {
      prompt: `חברה מחזיקה ${pct}% מהבת שלה, ומטפלת בהשקעה לפי עלות בדוחות הנפרדים. הבת הרוויחה ${fmt(subProfit)} ש״ח והכריזה על דיבידנד של ${fmt(subDividend)} ש״ח. כמה הכנסה מכירה האם בדוחות הנפרדים?`,
      answer: s.atCost.income,
      steps: [{ title: "לפי עלות, רק הדיבידנד הוא הכנסה", numbers: `${fmt(subDividend)} × ${pct}% = ${fmt(s.dividendShare)}` }],
      trap: "להכיר בחלק ברווח של הבת. זה קורה בשווי מאזני.",
    };
  return {
    prompt: `חברה קנתה ב־1.1 את ${pct}% מחברה תמורת ${fmt(cost)} ש״ח, ומטפלת בהשקעה בשיטת השווי המאזני. במהלך השנה החברה הרוויחה ${fmt(subProfit)} ש״ח, והכריזה על דיבידנד של ${fmt(subDividend)} ש״ח ששולם. מה יתרת ההשקעה ב־31.12?`,
    answer: s.atEquity.balance,
    steps: [
      { title: "החלק ברווח מגדיל", numbers: `${fmt(subProfit)} × ${pct}% = ${fmt(s.profitShare)}` },
      { title: "החלק בדיבידנד מקטין", numbers: `${fmt(subDividend)} × ${pct}% = ${fmt(s.dividendShare)}` },
      { title: "היתרה", numbers: `${fmt(cost)} + ${fmt(s.profitShare)} − ${fmt(s.dividendShare)} = ${fmt(s.atEquity.balance)}` },
    ],
    trap: "להשאיר את העלות. זו היתרה בשיטת העלות.",
  };
}
