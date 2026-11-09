import { afterConversion, whole, groupPosition, meetingShare, partnersToBeat, profitSplit, separateInvestment } from "../../learn/consolidated";
import { fmt } from "./shared";

/** Endless practice with new numbers: each family is one calculation, a seed always gives the same exercise, and every answer is whole, in shekels unless the family says otherwise. */

export type DrillStep = { title: string; numbers: string };
export type Drill = { prompt: string; answer: number; steps: DrillStep[]; trap: string; unit?: "percent" | "holders" };

export const DRILL_FAMILIES = {
  ncieq: "זשמ״ש בהון",
  owners: "הון הבעלים",
  nciprofit: "זשמ״ש ברווח",
  assets: "נכסים במאוחד",
  costinc: "הכנסה לפי עלות",
  eqbal: "יתרה בשווי מאזני",
  present: "החלק באסיפה",
  threshold: "עד איזו נוכחות",
  partners: "כמה צריך נגדו",
  convert: "אחרי המרה",
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

  if (family === "present") {
    // Attendance and a share of the room that give a whole holding, so the answer is a whole percent.
    const attendance = r.int(5, 9) * 10;
    const room = r.int(3, 7) * 10;
    const holding = (attendance * room) / 100;
    const share = whole(meetingShare({ holding, attendance }).share);
    return {
      prompt: `החלטות מתקבלות ברוב הנוכחים. משקיע מחזיק ${holding}% מכלל הקולות, ובדרך כלל נוכחים ${attendance}% מהקולות, כולל המשקיע. איזה אחוז מהקולות באסיפה יש לו?`,
      answer: share,
      unit: "percent",
      steps: [{ title: "מחלקים את ההחזקה בנוכחות", numbers: `${holding} / ${attendance} × 100 = ${share}` }],
      trap: "להסתכל על האחוז מכלל הקולות, כשההצבעה היא בין הנוכחים.",
    };
  }
  if (family === "threshold") {
    const holding = r.int(21, 49);
    const m = meetingShare({ holding, attendance: 100 });
    return {
      prompt: `החלטות מתקבלות ברוב הנוכחים. משקיע מחזיק ${holding}% מכלל הקולות. מאיזה שיעור נוכחות, כולל המשקיע, כבר לא יהיו לו יותר ממחצית הקולות באסיפה?`,
      answer: m.lostAbove,
      unit: "percent",
      steps: [{ title: "הסף הוא פי 2 מההחזקה: שם הוא מחזיק בדיוק חצי", numbers: `${holding} × 2 = ${m.lostAbove}` }],
      trap: "לחפש 50% מכלל הקולות. בין הנוכחים, הסף תלוי בהחזקה שלו.",
    };
  }
  if (family === "partners") {
    const holding = r.int(30, 44);
    const others = [r.int(14, 30), r.int(8, 16), r.int(5, 10), r.int(3, 6)].sort((a, b) => b - a);
    const n = partnersToBeat(holding, others) ?? others.length;
    const fits = partnersToBeat(holding, others) !== null;
    // Always winnable: when the four can't, the largest grows until they can.
    const list = fits ? others : [others[0] + holding, ...others.slice(1)];
    const answer = fits ? n : 1;
    const taken = list.slice(0, answer);
    const sum = taken.reduce((a, b) => a + b, 0);
    return {
      prompt: `משקיע מחזיק ${holding}% מהקולות. בעלי מניות נוספים מחזיקים ${list.map((o) => `${o}%`).join(", ")}. כמה מהם, לכל הפחות, צריכים לחבור יחד כדי שיהיו להם יותר קולות ממנו?`,
      answer,
      unit: "holders",
      steps: [
        { title: "מחברים מהגדול לקטן, עד שעוברים את ההחזקה שלו", numbers: `${taken.join(" + ")} = ${sum}, ${sum} > ${holding}` },
        { title: "מספר בעלי המניות", numbers: `${answer}` },
      ],
      trap: "לבדוק רק את הגדול ביותר. שואלים כמה צריכים לפעול יחד.",
    };
  }
  if (family === "convert") {
    // A total and a share in thousands that land on a whole percent: new shares equal the total, so the holding is the average of 100 and the old one.
    const total = r.int(10, 40) * 1_000;
    const oldPct = r.int(5, 22) * 2;
    const shares = (total * oldPct) / 100;
    const after = whole(afterConversion({ shares, total, newShares: total }));
    return {
      prompt: `למשקיע ${fmt(shares)} מניות מתוך ${fmt(total)}. יש לו מכשיר שאפשר להמיר ל־${fmt(total)} מניות חדשות של החברה. מה שיעור ההחזקה שלו אחרי ההמרה, באחוזים?`,
      answer: after,
      unit: "percent",
      steps: [{ title: "המניות החדשות נוספות גם לו וגם לסך", numbers: `(${fmt(shares)} + ${fmt(total)}) / (${fmt(total)} + ${fmt(total)}) × 100 = ${after}` }],
      trap: "לשכוח להוסיף את המניות החדשות גם לסך המניות.",
    };
  }
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
