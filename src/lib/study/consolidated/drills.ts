import { adjustedProfit, afterConversion, groupDeferredTaxAsset, preferenceSplit, excessTable, goodwillCalc, whole, groupPosition, managerReward, meetingShare, partnersToBeat, profitSplit, separateInvestment } from "../../learn/consolidated";
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
  reward: "כמה מקבל המנהל",
  fundshare: "החלק ברווח",
  nciagent: "זשמ״ש עם סוכן",
  silo: "נכסים עם סילו",
  invrest: "יתרת מלאי",
  eqamort: "הפחתת ציוד",
  dtax: "מס נדחה",
  tablenet: "טבלה נטו",
  gwfair: "מוניטין, שווי הוגן",
  gwshare: "מוניטין, חלק בנמ״נ",
  gwowners: "מוניטין של האם",
  premium: "פרמיית שליטה",
  subadj: "רווח מתוקן של הבת",
  nciadj: "זשמ״ש ברווח",
  ncibal: "יתרת זשמ״ש",
  divelim: "ביטול דיבידנד",
  qualchg: "שינוי בהסתייגות",
  ipexcess: "עודף על נדל״ן להשקעה",
  modelloss: "הפסד במעבר להערכה מחדש",
  resowners: "קרן של הבעלים",
  eqbefore: "קרן על מניות מלפני הרכישה",
  finadj: "התאמת הכנסות מימון",
  acbalance: "יתרת עודף על אג״ח",
  ncibenefit: "הטבה לזשמ״ש",
  impexcess: "עודף אחרי ירידת ערך",
  dtagroup: "נכס מס במאוחד",
  prefnci: "זשמ״ש ברווח עם בכורה",
  ordna: "זשמ״ש ברגילות",
  icinv: "רט״מ במלאי",
  icdep: "מימוש בקצב הפחת",
  icnci: "זשמ״ש כשהבת מכרה",
  icprior: "דחייה ביתרת פתיחה",
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
  if (family === "reward" || family === "fundshare") {
    // A fee on a round net-asset figure, and a holding in fives of a remainder that divides by twenty: everything lands on a whole shekel.
    const nav = r.int(10, 60) * 2_000_000;
    const hurdle = r.int(1, 3) * 1_000_000;
    const profit = hurdle + r.int(2, 8) * 1_000_000;
    const holdingPct = r.int(1, 6) * 5;
    const m = managerReward({ nav, feeRate: 0.015, profit, hurdle, perfRate: 0.15, holding: holdingPct / 100 });
    if (family === "reward")
      return {
        prompt: `מנהל קרן מקבל 1.5% מהנכסים נטו, שהם ${fmt(nav)} ש״ח, ועוד 15% מהרווח מעל ${fmt(hurdle)} ש״ח. הוא מחזיק ${holdingPct}% מהקרן. רווח הקרן לפני העמלות הוא ${fmt(profit)} ש״ח. כמה מקבל המנהל בסך הכול?`,
        answer: m.total,
        steps: [
          { title: "עמלה קבועה", numbers: `${fmt(nav)} × 1.5% = ${fmt(m.fee)}` },
          { title: "עמלה על ביצועים", numbers: `(${fmt(profit)} − ${fmt(hurdle)}) × 15% = ${fmt(m.performance)}` },
          { title: "החלק במה שנשאר", numbers: `${fmt(m.left)} × ${holdingPct}% = ${fmt(m.fromHolding)}` },
          { title: "סך הכול", numbers: `${fmt(m.fee)} + ${fmt(m.performance)} + ${fmt(m.fromHolding)} = ${fmt(m.total)}` },
        ],
        trap: "לחשב את ההחזקה מכל הרווח. קודם יורדות העמלות.",
      };
    // The share of the profit, from a total that divides into it evenly.
    const total = r.int(2, 18) * 250_000;
    const whole5m = 5_000_000;
    const share = whole((total / whole5m) * 100);
    return {
      prompt: `רווח קרן לפני עמלות הוא ${fmt(whole5m)} ש״ח. המנהל מקבל ממנה בסך הכול ${fmt(total)} ש״ח, מעמלות ומההחזקה שלו. איזה אחוז מהרווח מגיע אליו?`,
      answer: share,
      unit: "percent",
      steps: [{ title: "מה שהוא מקבל, חלקי הרווח", numbers: `${fmt(total)} / ${fmt(whole5m)} × 100 = ${share}` }],
      trap: "להשוות רק את ההחזקה. גם התגמול הוא חשיפה.",
    };
  }
  if (family === "nciagent") {
    const own = r.int(5, 8) * 5;
    const agent = r.int(3, 5) * 5;
    const net = r.int(10, 80) * 20_000;
    const nci = whole((net * (100 - own)) / 100);
    return {
      prompt: `חברה מחזיקה ${own}% מישות. חברת אחות, שהיא סוכן בפועל שלה ואינה בקבוצה, מחזיקה עוד ${agent}%. נקבע שהחברה שולטת. הנכסים נטו של הישות הם ${fmt(net)} ש״ח, ולא שולם מוניטין. מהי יתרת הזשמ״ש בדוח המאוחד?`,
      answer: nci,
      steps: [
        { title: "החלק של מי שאינו האם", numbers: `100% − ${own}% = ${100 - own}%` },
        { title: "הזשמ״ש", numbers: `${fmt(net)} × ${100 - own}% = ${fmt(nci)}` },
      ],
      trap: "להוריד גם את האחות. היא נספרת בבחינת השליטה, ולא בחלוקת ההון.",
    };
  }
  if (family === "silo") {
    const own = r.int(20, 90) * 20_000;
    const siloAssets = r.int(5, 30) * 20_000;
    const rest = r.int(5, 40) * 20_000;
    return {
      prompt: `לחברה נכסים של ${fmt(own)} ש״ח. היא שולטת בסילו בתוך ישות אחרת, והנכסים שלו ${fmt(siloAssets)} ש״ח. לשאר הישות, שהיא לא שולטת בו, יש נכסים של ${fmt(rest)} ש״ח. מה סך הנכסים בדוח המאוחד של החברה?`,
      answer: own + siloAssets,
      steps: [{ title: "מאחדים רק את הסילו", numbers: `${fmt(own)} + ${fmt(siloAssets)} = ${fmt(own + siloAssets)}` }],
      trap: "להוסיף גם את שאר הישות. שליטה יש רק בחלק המבודד.",
    };
  }
  if (family === "invrest") {
    const excess = r.int(3, 20) * 2_000;
    const soldPct = r.int(2, 18) * 5;
    const rest = whole((excess * (100 - soldPct)) / 100);
    return {
      prompt: `במועד הרכישה יוחס למלאי עודף עלות של ${fmt(excess)} ש״ח. עד סוף השנה נמכרו ${soldPct}% מהמלאי. מה יתרת עודף העלות בסוף השנה?`,
      answer: rest,
      steps: [{ title: `נשאר החלק שלא נמכר, ${100 - soldPct}%`, numbers: `${fmt(excess)} × ${100 - soldPct}% = ${fmt(rest)}` }],
      trap: "לחשב את מה שנמכר. זו ההפחתה, ולא היתרה.",
    };
  }
  if (family === "eqamort") {
    const years = r.int(2, 8);
    const months = [3, 6, 9, 12][r.int(0, 3)];
    const excess = years * r.int(2, 30) * 4_000;
    const amort = whole((excess * months) / 12 / years);
    return {
      prompt: `לציוד יוחס עודף עלות של ${fmt(excess)} ש״ח. נותרו לו ${years} שנות חיים במועד הרכישה, וממועד הרכישה עד סוף השנה עברו ${months} חודשים. מה ההפחתה עד סוף השנה?`,
      answer: amort,
      steps: [{ title: "על פני יתרת החיים, לפי החודשים שעברו", numbers: `${fmt(excess)} × ${months} / 12 / ${years} = ${fmt(amort)}` }],
      trap: "להפחית שנה שלמה, גם כשעברו פחות חודשים.",
    };
  }
  if (family === "dtax" || family === "tablenet") {
    const inv = r.int(5, 30) * 4_000;
    const eq = r.int(5, 30) * 4_000;
    const suit = r.int(1, 8) * 4_000;
    const table = excessTable([{ name: "מלאי", at: inv, end: inv }, { name: "ציוד", at: eq, end: eq }, { name: "תביעה", at: -suit, end: -suit }], 0.25);
    const before = inv + eq - suit;
    const tax = whole(before * 0.25);
    if (family === "dtax")
      return {
        prompt: `עודפי עלות במועד הרכישה: מלאי ${fmt(inv)} ש״ח, ציוד ${fmt(eq)} ש״ח, ותביעה בסימן של התחייבות ${fmt(suit)} ש״ח. שיעור המס 25%. מה סכום המס הנדחה, בערך מוחלט?`,
        answer: Math.abs(tax),
        steps: [
          { title: "הסך לפני מס, עם הסימנים", numbers: `${fmt(inv)} + ${fmt(eq)} − ${fmt(suit)} = ${fmt(before)}` },
          { title: "כפול שיעור המס", numbers: `${fmt(Math.abs(before))} × 25% = ${fmt(Math.abs(tax))}` },
        ],
        trap: "לחשב מס על הנכסים בלבד.",
      };
    return {
      prompt: `עודפי עלות במועד הרכישה: מלאי ${fmt(inv)} ש״ח, ציוד ${fmt(eq)} ש״ח, ותביעה בסימן של התחייבות ${fmt(suit)} ש״ח. שיעור המס 25%. מה סך עודף העלות נטו ממס, בערך מוחלט?`,
      answer: Math.abs(table.total.at),
      steps: [
        { title: "הסך לפני מס, עם הסימנים", numbers: `${fmt(inv)} + ${fmt(eq)} − ${fmt(suit)} = ${fmt(before)}` },
        { title: "נטו ממס", numbers: `${fmt(Math.abs(before))} × 75% = ${fmt(Math.abs(table.total.at))}` },
      ],
      trap: "לשכוח להוריד את המס, או לחבר את התביעה כנכס.",
    };
  }
  if (family === "gwfair" || family === "gwshare" || family === "gwowners") {
    // Amounts in fours and a holding in fives, so every share of the net assets is a whole shekel.
    const net = r.int(25, 75) * 4_000;
    const hold = r.int(11, 18) * 5;
    const paid = whole((net * hold) / 100) + r.int(2, 20) * 2_000;
    const fairNci = whole((net * (100 - hold)) / 100) + r.int(1, 8) * 1_000;
    const fair = goodwillCalc({ paid, prior: 0, holding: hold / 100, net, nciFair: fairNci });
    const share = goodwillCalc({ paid, prior: 0, holding: hold / 100, net });
    if (family === "gwfair")
      return {
        prompt: `האם קנתה ${hold}% מהבת ב־${fmt(paid)} ש״ח. הזשמ״ש נמדדים בשווי הוגן של ${fmt(fairNci)} ש״ח. הנמ״נ ${fmt(net)} ש״ח. מה המוניטין?`,
        answer: fair.goodwill,
        steps: [
          { title: "עלות צירוף העסקים", numbers: `${fmt(paid)} + ${fmt(fairNci)} = ${fmt(fair.cost)}` },
          { title: "המוניטין", numbers: `${fmt(fair.cost)} − ${fmt(net)} = ${fmt(fair.goodwill)}` },
        ],
        trap: "לשכוח את הזשמ״ש בעלות.",
      };
    if (family === "gwshare")
      return {
        prompt: `האם קנתה ${hold}% מהבת ב־${fmt(paid)} ש״ח. הזשמ״ש נמדדים לפי החלק בנמ״נ. הנמ״נ ${fmt(net)} ש״ח. מה המוניטין?`,
        answer: share.goodwill,
        steps: [
          { title: "הזשמ״ש", numbers: `${fmt(net)} × ${100 - hold}% = ${fmt(share.nci)}` },
          { title: "המוניטין", numbers: `${fmt(paid)} + ${fmt(share.nci)} − ${fmt(net)} = ${fmt(share.goodwill)}` },
        ],
        trap: "לחשב את הזשמ״ש לפי שיעור ההחזקה של האם.",
      };
    return {
      prompt: `האם קנתה ${hold}% מהבת ב־${fmt(paid)} ש״ח. הזשמ״ש נמדדים בשווי הוגן של ${fmt(fairNci)} ש״ח. הנמ״נ ${fmt(net)} ש״ח. מה המוניטין המיוחס לבעלי מניות האם?`,
      answer: fair.ownersGoodwill,
      steps: [
        { title: "חלק האם בנמ״נ", numbers: `${fmt(net)} × ${hold}% = ${fmt(whole((net * hold) / 100))}` },
        { title: "מה שהשקיעה, פחות חלקה", numbers: `${fmt(paid)} − ${fmt(whole((net * hold) / 100))} = ${fmt(fair.ownersGoodwill)}` },
      ],
      trap: "לחלק את כל המוניטין לפי האחוזים. הזשמ״ש לא שילמו את הפרמיה.",
    };
  }
  if (family === "premium") {
    const shares = r.int(5, 18) * 1_000;
    const price = r.int(8, 25);
    const extra = r.int(2, 30) * 1_000;
    const paid = shares * price + extra;
    return {
      prompt: `האם קנתה ${fmt(shares)} מניות תמורת ${fmt(paid)} ש״ח. מחיר המניה בשוק באותו יום ${price} ש״ח. מה פרמיית השליטה?`,
      answer: extra,
      steps: [
        { title: "השווי של המניות שנרכשו", numbers: `${fmt(shares)} × ${price} = ${fmt(shares * price)}` },
        { title: "הפרמיה", numbers: `${fmt(paid)} − ${fmt(shares * price)} = ${fmt(extra)}` },
      ],
      trap: "להשוות למחיר של כל המניות בחברה.",
    };
  }
  if (family === "subadj" || family === "nciadj") {
    // A profit in fours of thousands and an amortization in fours, so the after-tax amount is whole thousands, and a holding in fives.
    const profit = r.int(20, 60) * 4_000;
    const inv = r.int(1, 10) * 4_000;
    const years = r.int(2, 5);
    const yearly = r.int(1, 10) * 4_000;
    const amort = inv + yearly;
    const adjusted = adjustedProfit({ profit, amortized: -amort, taxRate: 0.25 });
    const facts = `רווח הבת בדוח העצמאי ${fmt(profit)} ש״ח. השנה הופחתו עודפי עלות לפני מס: ${fmt(inv)} ש״ח על מלאי שנמכר, ו־${fmt(yearly)} ש״ח פחת שנתי על ציוד בעודף עלות של ${fmt(yearly * years)} ש״ח ל־${years} שנים. שיעור המס 25%.`;
    const steps = [
      { title: "ההפחתה לפני מס", numbers: `${fmt(inv)} + ${fmt(yearly)} = ${fmt(amort)}` },
      { title: "הרווח המתוקן: מורידים את ההפחתה נטו ממס", numbers: `${fmt(profit)} − ${fmt(amort)} × 75% = ${fmt(adjusted)}` },
    ];
    if (family === "subadj") return { prompt: `${facts} מה הרווח המתוקן של הבת?`, answer: adjusted, steps, trap: "להוריד את ההפחתה בלי המס." };
    const nci = whole((adjusted * out) / 100);
    return {
      prompt: `${facts} האם מחזיקה ${pct}% מהבת. מה חלק הזשמ״ש ברווח הנקי המאוחד?`,
      answer: nci,
      steps: [...steps, { title: `חלק הזשמ״ש, ${out}%`, numbers: `${fmt(adjusted)} × ${out}% = ${fmt(nci)}` }],
      trap: "לחשב מהרווח בדוח העצמאי, לפני הפחתת עודפי העלות.",
    };
  }
  if (family === "ncibal") {
    const subNet = r.int(10, 60) * 20_000;
    const excessGross = r.int(1, 15) * 4_000;
    const excessNet = whole(excessGross * 0.75);
    const nciGoodwill = r.int(0, 8) * 1_000;
    const share = whole(((subNet + excessNet) * out) / 100);
    const nci = share + nciGoodwill;
    return {
      prompt: `בסוף השנה הנכסים נטו של הבת בדוח העצמאי ${fmt(subNet)} ש״ח, ויתרת עודפי העלות לפני מס ${fmt(excessGross)} ש״ח. שיעור המס 25%. האם מחזיקה ${pct}% מהבת. המוניטין המיוחס לזשמ״ש ${fmt(nciGoodwill)} ש״ח. מה יתרת הזשמ״ש בדוח המאוחד?`,
      answer: nci,
      steps: [
        { title: "עודפי העלות נטו ממס", numbers: `${fmt(excessGross)} × 75% = ${fmt(excessNet)}` },
        { title: `חלק הזשמ״ש בנמ״נ המתוקנים, ${out}%`, numbers: `(${fmt(subNet)} + ${fmt(excessNet)}) × ${out}% = ${fmt(share)}` },
        { title: "ועוד המוניטין שלהם", numbers: `${fmt(share)} + ${fmt(nciGoodwill)} = ${fmt(nci)}` },
      ],
      trap: "לשכוח את עודפי העלות, או את המוניטין של הזשמ״ש.",
    };
  }
  if (family === "divelim") {
    const dividend = r.int(1, 20) * 2_000;
    const elim = whole((dividend * pct) / 100);
    return {
      prompt: `האם מחזיקה ${pct}% מהבת ומודדת אותה לפי עלות. הבת הכריזה על דיבידנד של ${fmt(dividend)} ש״ח. כמה הכנסות מדיבידנד מבטלים בדוח המאוחד?`,
      answer: elim,
      steps: [{ title: "מבטלים את מה שהאם רשמה: חלקה בדיבידנד", numbers: `${fmt(dividend)} × ${pct}% = ${fmt(elim)}` }],
      trap: "לבטל את כל הדיבידנד. החלק של המיעוט מקטין את הזשמ״ש.",
    };
  }
  if (family === "qualchg") {
    const start = r.int(0, 20) * 1_000;
    const grow = r.int(1, 30) * 1_000;
    const effect = whole(grow * 0.77);
    return {
      prompt: `רואה החשבון של הבת הסתייג בגלל הפרשה שלא נרשמה. היתרה החסרה הייתה ${fmt(start)} ש״ח בתחילת השנה ו־${fmt(start + grow)} ש״ח בסופה. שיעור המס 23%. בכמה יורד הרווח המתוקן של הבת השנה?`,
      answer: effect,
      steps: [
        { title: "רק השינוי של השנה עובר דרך הרווח", numbers: `${fmt(start + grow)} − ${fmt(start)} = ${fmt(grow)}` },
        { title: "נטו ממס", numbers: `${fmt(grow)} × 77% = ${fmt(effect)}` },
      ],
      trap: "להוריד את כל היתרה של סוף השנה.",
    };
  }
  if (family === "ipexcess") {
    const book = r.int(20, 60) * 5_000;
    const dep = r.int(2, 8) * 1_000;
    const extra = r.int(1, 30) * 1_000;
    const fair = book - dep + extra;
    return {
      prompt: `הבת מודדת נדל״ן להשקעה במודל העלות: ${fmt(book)} ש״ח בתחילת השנה, ופחת של ${fmt(dep)} ש״ח בשנה. הקבוצה מודדת בשווי הוגן, ובסוף השנה השווי ${fmt(fair)} ש״ח. מה יתרת עודף העלות בסוף השנה, לפני מס?`,
      answer: extra,
      steps: [
        { title: "הערך בספרי הבת בסוף השנה", numbers: `${fmt(book)} − ${fmt(dep)} = ${fmt(book - dep)}` },
        { title: "עודף העלות: השווי ההוגן פחות הערך בספרים", numbers: `${fmt(fair)} − ${fmt(book - dep)} = ${fmt(extra)}` },
      ],
      trap: "להשוות לערך של תחילת השנה, ולשכוח את הפחת שהבת רשמה.",
    };
  }
  if (family === "modelloss") {
    const subCost = r.int(10, 40) * 10_000;
    const excess = r.int(4, 16) * 5_000;
    const above = r.int(1, excess / 1_000 - 1) * 1_000;
    const fair = subCost + above;
    const loss = excess - above;
    return {
      prompt: `קרקע עלתה לבת ${fmt(subCost)} ש״ח, ולקבוצה ${fmt(subCost + excess)} ש״ח, השווי ההוגן ביום הרכישה. בסוף השנה שתי החברות עוברות למודל הערכה מחדש, והשווי ההוגן ${fmt(fair)} ש״ח. מה ההפסד ברווח או הפסד בדוח המאוחד, לפני מס?`,
      answer: loss,
      steps: [{ title: "מנקודת המבט של הקבוצה: העלות שלה פחות השווי ההוגן", numbers: `${fmt(subCost + excess)} − ${fmt(fair)} = ${fmt(loss)}` }],
      trap: "לרשום רווח כולל אחר כמו בבת.",
    };
  }
  if (family === "resowners") {
    const reserve = r.int(5, 60) * 2_000;
    const share = whole((reserve * pct) / 100);
    return {
      prompt: `לבת קרן הערכה מחדש של ${fmt(reserve)} ש״ח, על נכס שקנתה אחרי הרכישה. האם מחזיקה ${pct}% מהבת. בכמה מוצגת הקרן בהון של בעלי מניות האם?`,
      answer: share,
      steps: [{ title: "רק החלק של האם בקרן", numbers: `${fmt(reserve)} × ${pct}% = ${fmt(share)}` }],
      trap: "להציג את כל הקרן בהון הבעלים.",
    };
  }
  if (family === "eqbefore") {
    const cost = r.int(10, 40) * 1_000;
    const at = cost + r.int(2, 15) * 1_000;
    const end = at + r.int(2, 60) * 500;
    const reserve = whole((end - at) * 0.77);
    return {
      prompt: `הבת קנתה מניות ב־${fmt(cost)} ש״ח לפני הרכישה, ומודדת אותן בשווי הוגן דרך רווח כולל אחר. ביום הרכישה שוויין ${fmt(at)} ש״ח, ובסוף השנה ${fmt(end)} ש״ח. שיעור המס 23%. מה הקרן על המניות במאוחד בסוף השנה, נטו?`,
      answer: reserve,
      steps: [{ title: "לקבוצה העלות היא השווי ההוגן ביום הרכישה", numbers: `(${fmt(end)} − ${fmt(at)}) × 77% = ${fmt(reserve)}` }],
      trap: "לחשב מול העלות המקורית של הבת.",
    };
  }
  if (family === "finadj") {
    const subOpen = r.int(40, 120) * 1_000;
    const groupOpen = subOpen + r.int(1, 5) * 1_000;
    const subRate = r.int(6, 8);
    const groupRate = subRate - r.int(2, 3);
    const subInt = whole((subOpen * subRate) / 100);
    const groupInt = whole((groupOpen * groupRate) / 100);
    return {
      prompt: `אג״ח של הבת בעלות מופחתת, שקנתה לפני הרכישה: בספריה ${fmt(subOpen)} ש״ח בתחילת השנה, בריבית אפקטיבית של ${subRate}%. אצל הקבוצה ${fmt(groupOpen)} ש״ח, בריבית אפקטיבית של ${groupRate}%. התעלמו ממסים. בכמה מקטינים במאוחד את הכנסות המימון של הבת?`,
      answer: subInt - groupInt,
      steps: [
        { title: "הכנסות המימון של הבת", numbers: `${fmt(subOpen)} × ${subRate}% = ${fmt(subInt)}` },
        { title: "הכנסות המימון של הקבוצה", numbers: `${fmt(groupOpen)} × ${groupRate}% = ${fmt(groupInt)}` },
        { title: "ההפרש: הפחתת עודף העלות", numbers: `${fmt(subInt)} − ${fmt(groupInt)} = ${fmt(subInt - groupInt)}` },
      ],
      trap: "להפחית את העודף בקו ישר.",
    };
  }
  if (family === "acbalance") {
    const excess = r.int(4, 12) * 1_000;
    const subInt = r.int(40, 80) * 100;
    const groupInt = subInt - r.int(3, 20) * 100;
    const end = excess - (subInt - groupInt);
    return {
      prompt: `ביום הרכישה עודף העלות על אג״ח של הבת ${fmt(excess)} ש״ח. השנה הבת רשמה הכנסות מימון של ${fmt(subInt)} ש״ח, ולפי הריבית של הקבוצה הן ${fmt(groupInt)} ש״ח. התעלמו ממסים. מה יתרת העודף בסוף השנה?`,
      answer: end,
      steps: [
        { title: "ההפחתה: ההפרש בהכנסות המימון", numbers: `${fmt(subInt)} − ${fmt(groupInt)} = ${fmt(subInt - groupInt)}` },
        { title: "היתרה", numbers: `${fmt(excess)} − ${fmt(subInt - groupInt)} = ${fmt(end)}` },
      ],
      trap: "להוסיף את ההפרש לעודף.",
    };
  }
  if (family === "ncibenefit") {
    const expense = r.int(2, 40) * 5_000;
    const benefit = whole((expense * out) / 100);
    return {
      prompt: `האם מחזיקה ${pct}% מהבת. האם שילמה הוצאה של הבת, ${fmt(expense)} ש״ח, בלי לקבל תמורה. כמה עובר במאוחד מהבעלים של האם לזשמ״ש?`,
      answer: benefit,
      steps: [{ title: `החלק של הזשמ״ש בהטבה, ${out}%`, numbers: `${fmt(expense)} × ${out}% = ${fmt(benefit)}` }],
      trap: "להעביר את החלק של האם.",
    };
  }
  if (family === "impexcess") {
    const subAc = r.int(40, 120) * 1_000;
    const groupAc = subAc + r.int(10, 60) * 1_000;
    const rec = subAc + r.int(1, (groupAc - subAc) / 1_000 + 10) * 1_000;
    const sub = Math.min(subAc, rec);
    const group = Math.min(groupAc, rec);
    return {
      prompt: `מכונה שהבת החזיקה לפני הרכישה. בסוף השנה יש סימן לירידת ערך, והסכום בר ההשבה ${fmt(rec)} ש״ח. העלות המופחתת בלי ירידות ערך: אצל הבת ${fmt(subAc)} ש״ח, ואצל הקבוצה ${fmt(groupAc)} ש״ח. מה יתרת עודף העלות, לפני מס?`,
      answer: group - sub,
      steps: [
        { title: "הבת: הנמוך מבין העלות המופחתת לסכום בר ההשבה", numbers: `MIN(${fmt(subAc)}, ${fmt(rec)}) = ${fmt(sub)}` },
        { title: "הקבוצה: אותו דבר, מהעלות שלה", numbers: `MIN(${fmt(groupAc)}, ${fmt(rec)}) = ${fmt(group)}` },
        { title: "העודף", numbers: `${fmt(group)} − ${fmt(sub)} = ${fmt(group - sub)}` },
      ],
      trap: "להעלות את הנכס מעל העלות המופחתת שלו.",
    };
  }
  if (family === "dtagroup") {
    const excess = r.int(10, 60) * 1_000;
    const forecast = r.int(0, 30) * 5_000;
    const liability = whole(excess * 0.23);
    const subAsset = whole(forecast * 0.23);
    const group = groupDeferredTaxAsset({ liabilityOnExcess: liability, subAsset });
    return {
      prompt: `במאוחד יש עודפי עלות של ${fmt(excess)} ש״ח, ושיעור המס 23%. לבת הפסד מועבר, ולפי התחזית שלה, אחרי אירוע שקרה אחרי הרכישה, היא צופה הכנסה חייבת של ${fmt(forecast)} ש״ח. מה נכס המס הנדחה במאוחד, לפי המרצה?`,
      answer: group,
      steps: [
        { title: "ההתחייבות על עודפי העלות", numbers: `${fmt(excess)} × 23% = ${fmt(liability)}` },
        { title: "הנכס לפי התחזית של הבת", numbers: `${fmt(forecast)} × 23% = ${fmt(subAsset)}` },
        { title: "הגבוה מבין השניים", numbers: `MAX(${fmt(liability)}, ${fmt(subAsset)}) = ${fmt(group)}` },
      ],
      trap: "לחבר את שניהם.",
    };
  }
  if (family === "prefnci") {
    const par = r.int(2, 10) * 10_000;
    const rate = r.int(6, 10);
    const accrual = whole((par * rate) / 100);
    const profit = r.int(3, 15) * 20_000;
    const sp = preferenceSplit({ profit, toPreference: accrual, holdingOrdinary: h, holdingPreference: 0 });
    return {
      prompt: `רווח הבת ${fmt(profit)} ש״ח. לבת מניות בכורה צוברות בערך נקוב של ${fmt(par)} ש״ח, ${rate}% בשנה, וכולן בידי אחרים. השנה לא הוכרז דיבידנד. האם מחזיקה ${pct}% מהמניות הרגילות. מה חלק הזשמ״ש ברווח?`,
      answer: sp.nci,
      steps: [
        { title: "הצבירה של הבכורה השנה", numbers: `${fmt(par)} × ${rate}% = ${fmt(accrual)}` },
        { title: "למניות הרגילות", numbers: `${fmt(profit)} − ${fmt(accrual)} = ${fmt(sp.ordinary)}` },
        { title: `הזשמ״ש: כל הבכורה, ועוד ${out}% מהרגילות`, numbers: `${fmt(accrual)} + ${fmt(sp.ordinary)} × ${out}% = ${fmt(sp.nci)}` },
      ],
      trap: "לחלק את כל הרווח לפי המניות הרגילות.",
    };
  }
  if (family === "ordna") {
    const na = r.int(20, 80) * 10_000;
    const pref = r.int(2, 15) * 5_000;
    const share = whole(((na - pref) * out) / 100);
    return {
      prompt: `ביום הרכישה הנמ״נ של הבת ${fmt(na)} ש״ח, והשווי ההוגן של מניות הבכורה שלה, שמסווגות כהון, ${fmt(pref)} ש״ח. האם קנתה ${pct}% מהמניות הרגילות, והזשמ״ש ברגילות לפי חלקם בנמ״נ. מה סכומם?`,
      answer: share,
      steps: [{ title: `הנמ״נ של הרגילות, כפול ${out}%`, numbers: `(${fmt(na)} − ${fmt(pref)}) × ${out}% = ${fmt(share)}` }],
      trap: "לא להוריד את הבכורה מהנמ״נ.",
    };
  }
  if (family === "icinv") {
    const price = r.int(2, 15) * 40_000;
    const margin = r.int(2, 8) * 5;
    const left = r.int(1, 4) * 25;
    const profit = whole((price * margin) / 100);
    const gross = whole((profit * left) / 100);
    const net = whole(gross * 0.77);
    return {
      prompt: `האם מכרה לבת סחורה ב־${fmt(price)} ש״ח, בשיעור רווח גולמי של ${margin}%. בסוף השנה ${left}% מהסחורה עדיין אצל הבת, והשאר נמכר החוצה. שיעור המס 23%. בכמה קטן הרווח הנקי המאוחד בגלל העסקה?`,
      answer: net,
      steps: [
        { title: "הרווח בעסקה", numbers: `${fmt(price)} × ${margin}% = ${fmt(profit)}` },
        { title: "החלק שעוד במלאי", numbers: `${fmt(profit)} × ${left}% = ${fmt(gross)}` },
        { title: "אחרי נכס המס", numbers: `${fmt(gross)} × 77% = ${fmt(net)}` },
      ],
      trap: "לדחות גם את הרווח שבחלק שכבר נמכר החוצה.",
    };
  }
  if (family === "icdep") {
    const years = r.int(3, 8);
    const gain = r.int(2, 12) * years * 1_000;
    const k = r.int(1, years - 1);
    const yearly = whole(gain / years);
    const left = gain - k * yearly;
    return {
      prompt: `ב־1.1 הבת מכרה לאם מכונה ברווח של ${fmt(gain)} ש״ח. האם מפחיתה אותה בקו ישר על פני ${years} שנים. מה הרווח שעדיין לא מומש אחרי ${k} שנים, לפני מס?`,
      answer: left,
      steps: [
        { title: "המימוש בכל שנה, דרך הפחת", numbers: `${fmt(gain)} ÷ ${years} = ${fmt(yearly)}` },
        { title: "מה שנשאר", numbers: `${fmt(gain)} − ${k} × ${fmt(yearly)} = ${fmt(left)}` },
      ],
      trap: "לממש לפי אורך החיים שהיה למכונה אצל המוכרת.",
    };
  }
  if (family === "icnci") {
    const profit = r.int(3, 20) * 20_000;
    const unrealized = r.int(1, 20) * 2_000;
    const net = whole(unrealized * 0.77);
    const nci = whole(((profit - net) * out) / 100);
    return {
      prompt: `האם מחזיקה ${pct}% מהבת. רווח הבת השנה ${fmt(profit)} ש״ח. הבת מכרה לאם סחורה, ובסוף השנה נשאר אצל האם רווח שלא מומש של ${fmt(unrealized)} ש״ח. שיעור המס 23%. מה חלק הזשמ״ש ברווח?`,
      answer: nci,
      steps: [
        { title: "הדחייה נטו, על חשבון הבת", numbers: `${fmt(unrealized)} × 77% = ${fmt(net)}` },
        { title: `הרווח המתוקן של הבת, כפול ${out}%`, numbers: `(${fmt(profit)} − ${fmt(net)}) × ${out}% = ${fmt(nci)}` },
      ],
      trap: "לחשב את הזשמ״ש מהרווח של הבת בלי הדחייה.",
    };
  }
  if (family === "icprior") {
    const price = r.int(2, 15) * 20_000;
    const margin = r.int(2, 8) * 5;
    const profit = whole((price * margin) / 100);
    const net = whole(profit * 0.77);
    return {
      prompt: `בשנה שעברה האם מכרה לבת סחורה ב־${fmt(price)} ש״ח, בשיעור רווח גולמי של ${margin}%, וכל הסחורה עדיין אצל הבת בתחילת השנה. שיעור המס 23%. בכמה מקטינים במאוחד את יתרת הפתיחה של העודפים?`,
      answer: net,
      steps: [
        { title: "הרווח שנדחה בשנה שעברה", numbers: `${fmt(price)} × ${margin}% = ${fmt(profit)}` },
        { title: "אחרי מס", numbers: `${fmt(profit)} × 77% = ${fmt(net)}` },
      ],
      trap: "להקטין את העודפים בכל הרווח, בלי נכס המס.",
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
