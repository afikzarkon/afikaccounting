import { holdingAfterIssue, holdingChange, lossOfControl, nciAt, saleTax, whole } from "../../../learn/consolidated";
import { journal } from "../../inventory/shared";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, type ConsolidatedQuestion, COURSE, COURSE_HREF } from "../shared";

const TAX = 0.23;

/**
 * The main story, no tax as in the lecturer's example: on 1.1.2024 Shaked
 * bought 7,500 of Arava's 10,000 shares for 600,000, NCI at fair value (72 a
 * share). Arava's equity 500,000, and a patent worth 80,000 more than its book
 * value, 8 years left. On 1.7.2026 Shaked sells all of it for 900,000; Arava's
 * equity on 30.6.2026 is 760,000.
 */
export const LC12 = (() => {
  const paid = 600_000;
  const nciFair = 2_500 * 72;
  const premium = paid - 7_500 * 72;
  const net0 = 500_000 + 80_000;
  const goodwill = paid + nciFair - net0;
  const split = goodwill - premium;
  const patentLeft = 80_000 - (80_000 / 8) * 2.5;
  const equity = 760_000;
  const net = equity + patentLeft;
  const nci = whole(nciAt({ net, splitGoodwill: split, share: 0.25 }));
  const price = 900_000;
  const { gain } = lossOfControl({ proceeds: price, net, goodwill, nci });
  const parentNet = whole(net * 0.75);
  const parentGoodwill = whole(premium + split * 0.75);
  return { paid, nciFair, premium, net0, goodwill, split, patentLeft, equity, net, nci, price, gain, parentNet, parentGoodwill, parentTotal: parentNet + parentGoodwill };
})();

/** The same sale, when Arava's 760,000 holds a revaluation reserve of 40,000 and a reserve on bonds at FVOCI of 12,000: Shaked's 75% of each is released. */
export const RES12 = { reval: 40_000, debt: 12_000, revalOwners: whole(40_000 * 0.75), debtOwners: whole(12_000 * 0.75), toProfit: LC12.gain + whole(12_000 * 0.75) };

/** The same story, but Shaked sells 5,000 shares for 610,000 and keeps 2,500, worth 275,000 that day. */
export const KEEP12 = (() => {
  const proceeds = 610_000;
  const retained = 275_000;
  const { gain } = lossOfControl({ proceeds, retainedFv: retained, net: LC12.net, goodwill: LC12.goodwill, nci: LC12.nci });
  const soldPart = whole((LC12.parentTotal * 2) / 3);
  return { proceeds, retained, gain, soldPart, keptPart: LC12.parentTotal - soldPart, onSold: proceeds - soldPart, onKept: retained - (LC12.parentTotal - soldPart) };
})();

/** The same full sale, with two intragroup sales still unrealised: Down, land Shaked sold Arava (gain 40,000), and Up, inventory Arava sold Shaked for 80,000 at a 25% margin. */
export const UNREAL12 = (() => {
  const down = 40_000;
  const up = whole(80_000 * 0.25);
  const nci = whole(nciAt({ net: LC12.net, up, splitGoodwill: LC12.split, share: 0.25 }));
  const upNciPart = whole(up * 0.25);
  const { assetsOut, gain } = lossOfControl({ proceeds: LC12.price, net: LC12.net, down, goodwill: LC12.goodwill, nci, upNciPart });
  return { down, up, nci, upNciPart, upLeft: up - upNciPart, assetsOut, gain };
})();

/** The year of the sale: Shaked's own profit for 2026 is 500,000, with the 300,000 it booked on the sale at cost; Arava earned 94,000 in January to June. */
export const YEAR12 = (() => {
  const parentOwn = 500_000;
  const separateGain = LC12.price - LC12.paid;
  const parent = parentOwn - separateGain + LC12.gain;
  const sub = 94_000 - 5_000;
  const total = parent + sub;
  const nci = whole(sub * 0.25);
  return { parentOwn, separateGain, adjust: LC12.gain - separateGain, parent, sub, total, nci, owners: total - nci };
})();

/**
 * An increase, with tax at 23%: on 1.1.2024 Gilboa bought 6,000 of Hermon's
 * 10,000 shares for 420,000, NCI at fair value (65 a share). Hermon's equity
 * 450,000, equipment 64,000 above book, 4 years. On 1.10.2025 Gilboa buys 1,500
 * more for 160,000 plus 4,000 costs. Hermon's equity on 30.9.2025 is 620,000,
 * with a revaluation reserve of 30,000; inventory it sold Gilboa for 80,000 at
 * a 20% margin is still there.
 */
export const UP12 = (() => {
  const paid = 420_000;
  const nciFair = 4_000 * 65;
  const premium = paid - 6_000 * 65;
  const excessNet0 = whole(64_000 * (1 - TAX));
  const net0 = 450_000 + excessNet0;
  const goodwill = paid + nciFair - net0;
  const split = goodwill - premium;
  const excessLeft = 64_000 - 16_000 * 1.75;
  const excessLeftNet = whole(excessLeft * (1 - TAX));
  const upGross = whole(80_000 * 0.2);
  const upNet = whole(upGross * (1 - TAX));
  const net = 620_000 + excessLeftNet;
  const nciBefore = whole(nciAt({ net, up: upNet, splitGoodwill: split, share: 0.4 }));
  const nciAfter = whole(nciAt({ net, up: upNet, splitGoodwill: split, share: 0.25 }));
  const cash = 160_000 + 4_000;
  const c = holdingChange({ nciBefore, nciAfter, reserves: 30_000, shareBefore: 0.6, shareAfter: 0.75, cash: -cash });
  return { paid, nciFair, premium, excessNet0, net0, goodwill, split, excessLeft, excessLeftNet, excessLeftTax: excessLeft - excessLeftNet, upGross, upNet, net, base: net - upNet + split, nciBefore, nciAfter, cash, nciDown: -c.nciMove, reserveUp: whole(c.reserveMove), toReserve: whole(-c.toReserve) };
})();

/**
 * A decrease: on 1.1.2024 Tavor bought 8,000 of Miron's 10,000 shares for
 * 1,040,000, NCI at fair value (120 a share). Miron's equity 1,000,000, no
 * excess. On 1.7.2025 Tavor sells 1,000 shares for 160,000. Miron's equity on
 * 30.6.2025 is 1,180,000, with a revaluation reserve of 40,000.
 */
export const DOWN12 = (() => {
  const paid = 1_040_000;
  const nciFair = 2_000 * 120;
  const premium = paid - 8_000 * 120;
  const goodwill = paid + nciFair - 1_000_000;
  const split = goodwill - premium;
  const net = 1_180_000;
  const nciBefore = whole(nciAt({ net, splitGoodwill: split, share: 0.2 }));
  const afterA = whole(nciAt({ net, splitGoodwill: split, share: 0.3 }));
  const afterB = whole(nciAt({ net, splitGoodwill: split, share: 0.3, premium, premiumShare: 1_000 / 8_000 }));
  const a = holdingChange({ nciBefore, nciAfter: afterA, reserves: 40_000, shareBefore: 0.8, shareAfter: 0.7, cash: 160_000 });
  const b = holdingChange({ nciBefore, nciAfter: afterB, reserves: 40_000, shareBefore: 0.8, shareAfter: 0.7, cash: 160_000 });
  return { paid, nciFair, premium, goodwill, split, net, nciBefore, afterA, afterB, upA: a.nciMove, upB: b.nciMove, reserveDown: whole(-a.reserveMove), toReserveA: whole(a.toReserve), toReserveB: whole(b.toReserve), premiumMoved: whole(premium / 8) };
})();

/** The decrease with tax at 23%, policy A: the capital gain for tax against the cost of the shares sold. */
export const TAX12 = (() => {
  const costSold = DOWN12.paid / 8;
  const t = saleTax({ proceeds: 160_000, costSold, reserveGross: DOWN12.toReserveA, rate: TAX });
  return { costSold, separateGain: t.separateGain, payable: whole(t.payable), toReserve: whole(t.toReserve), expense: whole(t.expense), reserveNet: whole(t.reserveNet), profitAdjust: whole(t.profitAdjust) };
})();

/**
 * An issue by the subsidiary: Yasmin holds 8,000 of Lotem's 10,000 shares, NCI
 * at their share of net assets, goodwill 100,000, all Yasmin's, no control
 * premium. Lotem's net assets 700,000. Lotem issues 2,500 shares to the public
 * at 120; Yasmin buys none.
 */
export const ISSUE12 = (() => {
  const after = holdingAfterIssue({ parentShares: 8_000, totalShares: 10_000, newShares: 2_500, parentBuys: 0 });
  const cash = 2_500 * 120;
  const nciBefore = whole(700_000 * 0.2);
  const gwToNci = whole((100_000 * (0.8 - after)) / 0.8);
  const nciAfter = whole((700_000 + cash) * (1 - after)) + gwToNci;
  const c = holdingChange({ nciBefore, nciAfter, shareBefore: 0.8, shareAfter: after, cash });
  return { after, cash, nciBefore, gwToNci, nciAfter, nciUp: c.nciMove, toReserve: whole(c.toReserve), parentBefore: whole(700_000 * 0.8) + 100_000, parentAfter: whole((700_000 + cash) * after) + 100_000 - gwToNci };
})();

/** Control through an issue: Hatzav buys 15,000 new shares of Stavit (10,000 before, equity 400,000 at fair value) for 900,000. NCI at their share of net assets. */
export const GAIN12 = (() => {
  const holding = holdingAfterIssue({ parentShares: 0, totalShares: 10_000, newShares: 15_000, parentBuys: 15_000 });
  const net = 400_000 + 900_000;
  const nci = whole(net * (1 - holding));
  return { holding, net, nci, goodwill: 900_000 + nci - net };
})();

/**
 * The closing question, tax at 23%: Erez holds 80% of Dekel, sells 1,000
 * shares in mid-2026, and Dekel then issues shares, Erez buying part. Erez
 * does not reallocate the control premium. The figures are the givens of
 * MASTER12, in worked/holding-own.ts.
 */
export const M12 = (() => {
  const paid = 880_000;
  const nciFair = 2_000 * 105;
  const premium = paid - 8_000 * 105;
  const landNet = whole(100_000 * (1 - TAX));
  const net0 = 900_000 + landNet;
  const goodwill = paid + nciFair - net0;
  const split = goodwill - premium;
  const base1 = 900_000 + 200_000 + 140_000 + landNet + split;
  const nci1Before = whole(base1 * 0.2);
  const nci1After = whole(base1 * 0.3);
  const sale = holdingChange({ nciBefore: nci1Before, nciAfter: nci1After, shareBefore: 0.8, shareAfter: 0.7, cash: 147_000 });
  const tax = saleTax({ proceeds: 147_000, costSold: paid / 8, reserveGross: sale.toReserve, rate: TAX });
  const holding2 = holdingAfterIssue({ parentShares: 7_000, totalShares: 10_000, newShares: 2_500, parentBuys: 1_500 });
  const base2 = base1 + 70_000;
  const nci2Before = whole(base2 * 0.3);
  const nci2After = whole((base2 + 2_500 * 168) * (1 - holding2));
  const issue = holdingChange({ nciBefore: nci2Before, nciAfter: nci2After, shareBefore: 0.7, shareAfter: holding2, cash: 1_000 * 168 });
  const reserve1 = whole(sale.toReserve);
  const reserve2 = whole(issue.toReserve);
  const reserveEnd = reserve1 - whole(tax.toReserve) + reserve2;
  const parent = 450_000 - tax.separateGain + whole(tax.toReserve);
  const total = parent + 280_000;
  const nci = whole(140_000 * 0.2) + whole(70_000 * 0.3) + whole(70_000 * (1 - holding2));
  return {
    paid, nciFair, premium, landNet, net0, goodwill, split, base1, nci1Before, nci1After, nciUp1: whole(sale.nciMove), reserve1,
    separateGain: tax.separateGain, taxPayable: whole(tax.payable), taxToReserve: whole(tax.toReserve), taxExpense: whole(tax.expense),
    holding2, base2, nci2Before, nci2After, nciUp2: whole(issue.nciMove), reserve2, reserveEnd, parent, total, nci, owners: total - nci,
  };
})();

/** Profit or loss, or equity: where each amount lands. Each stands alone. */
export const SORT12: { text: string; answer: "pl" | "equity"; why: string }[] = [
  { text: "הרווח של האם כשמכרה את כל ההחזקה בבת ואיבדה שליטה", answer: "pl", why: "איבוד שליטה הוא גריעה של הבת. ההפרש הוא רווח או הפסד של האם." },
  { text: "ההפרש בין התמורה לבין העלייה בזשמ״ש, כשהאם מכרה 10% מהבת ונשארה בשליטה", answer: "equity", why: "עסקה בין בעלי המניות של הקבוצה: עסקה הונית, לקרן עסקאות עם זשמ״ש." },
  { text: "חלק האם בקרן של הבת על אג״ח בשווי הוגן דרך רווח כולל אחר, ביום שהשליטה אבדה", answer: "pl", why: "קרן של מכשיר חוב עוברת לרווח או הפסד, כאילו הבת מכרה את האג״ח." },
  { text: "עלויות עסקה ששילמה האם כשקנתה 15% נוספים מהזשמ״ש", answer: "equity", why: "העסקה הונית, ולכן גם העלויות שלה בהון, בתוך ההפרש שנזקף לקרן." },
  { text: "רט״מ Down על קרקע שעדיין אצל הבת, ביום שהשליטה אבדה", answer: "pl", why: "הקרקע נגרעת עם הבת לפי הערך במאוחד, ולכן הרווח שנדחה נכלל ברווח מאיבוד השליטה." },
  { text: "המס על החלק ברווח ההון שמתאים לקרן עסקאות עם זשמ״ש", answer: "equity", why: "לפי עמ׳ 71, המס הולך אחרי הקרן: חלק המס שמתאים לה נזקף לה." },
  { text: "המדידה מחדש של ההשקעה שנותרה, לשווי ההוגן ביום איבוד השליטה", answer: "pl", why: "ההשקעה שנותרה נמדדת בשווי הוגן, וההפרש נכלל ברווח או בהפסד מאיבוד השליטה." },
  { text: "חלק האם בקרן הערכה מחדש של הבת, ביום שהשליטה אבדה", answer: "equity", why: "לפי המרצה, קרן הערכה מחדש עוברת לעודפים, בתוך ההון, ולא לרווח או הפסד." },
];

export const SORT12_OPTIONS: [string, string][] = [
  ["pl", "רווח או הפסד"],
  ["equity", "בתוך ההון"],
];

type Meta = ConsolidatedQuestion["meta"];
const m2 = (ref: string) => ({ meta: { level: 2 as const, source: "מקורית" as const, ref } });
const m3 = (ref: string) => ({ meta: { level: 3 as const, source: "מקורית" as const, ref } });

const exercises: (ConsolidatedQuestion | (ReturnType<typeof journal> & { meta: Meta }))[] = [
  // Level 1: one idea.
  ask({
    id: "lc-out",
    skill: "איבוד שליטה",
    prompt: "האם מכרה את כל ההחזקה שלה בבת, ואיבדה שליטה. מה גורעים בדוח המאוחד ביום המכירה?",
    options: ["את כל הנכסים וההתחייבויות של הבת, את כל המוניטין ואת יתרת הזשמ״ש", "רק את חלק האם בנכסים נטו של הבת", "רק את ההשקעה בחברה בת", "את הנכסים וההתחייבויות, אבל המוניטין נשאר"],
    answer: 0,
    why: "לפי ב98, הבת יוצאת מהמאוחד כולה: הנכסים וההתחייבויות לפי הערך במאוחד, כל המוניטין, וגם הזשמ״ש.",
    wrong: ["במאוחד הנכסים מוצגים במלואם, ולכן גם נגרעים במלואם.", "ההשקעה בחברה בת לא מופיעה במאוחד בכלל.", "המוניטין שייך לבת, והוא יוצא איתה."],
    trap: "לגרוע רק את חלק האם, ולהשאיר את הזשמ״ש בהון.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, IFRS 10 ב98",
  }),
  ask({
    id: "lc-keep",
    skill: "איבוד שליטה",
    prompt: "האם איבדה שליטה בבת, ונשארה עם 25% ממניותיה. לפי מה מכירים בהשקעה שנותרה ביום איבוד השליטה?",
    options: ["לפי השווי ההוגן שלה באותו יום", "לפי חלק האם בנכסים נטו של הבת", "לפי העלות המקורית של המניות", "לא מכירים בה עד שתימכר"],
    answer: 0,
    why: "לפי ב98, ההשקעה שנותרה נמדדת בשווי ההוגן ביום איבוד השליטה. זו המדידה שלה בהכרה לראשונה.",
    wrong: ["זה הערך בספרים, לא השווי ההוגן.", "העלות כבר לא רלוונטית: יש נקודת מדידה חדשה.", "המניות עדיין של האם, ולכן מכירים בהן."],
    trap: "להשאיר את ההשקעה שנותרה בערך שלה במאוחד.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A608",
  }),
  ask({
    id: "lc-debt",
    skill: "איבוד שליטה",
    prompt: "לבת יש קרן בגין אג״ח שהיא מודדת בשווי הוגן דרך רווח כולל אחר. האם איבדה שליטה. לאן עובר חלק האם בקרן?",
    options: ["לרווח או הפסד", "לעודפים", "הוא נשאר בקרן", "לזשמ״ש"],
    answer: 0,
    why: "לפי A619, המימוש דומה למה שהיה קורה אילו הבת מכרה את האג״ח. במכשיר חוב, הקרן עוברת לרווח או הפסד.",
    wrong: ["לעודפים עוברות קרן הערכה מחדש וקרן של מכשיר הוני.", "הבת יצאה מהמאוחד, ואין לקרן במה להישאר.", "חלק הזשמ״ש בקרן כבר נגרע עם הזשמ״ש."],
    trap: "להעביר לעודפים גם קרן של מכשיר חוב.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A619",
  }),
  ask({
    id: "lc-reval",
    skill: "איבוד שליטה",
    prompt: "לבת יש קרן הערכה מחדש על מבנה. האם איבדה שליטה. לפי המרצה, לאן עובר חלק האם בקרן?",
    options: ["לעודפים", "לרווח או הפסד", "הוא נשאר בקרן לתמיד", "הוא מתקזז מול המוניטין"],
    answer: 0,
    why: "לפי עמ׳ 68 ו־A619, קרן הערכה מחדש עוברת לעודפים, כמו שהייתה עוברת אילו הבת מכרה את המבנה.",
    wrong: ["קרן הערכה מחדש לא עוברת לרווח או הפסד אף פעם.", "אצל המרצה ההעברה לעודפים היא חלק מהפקודה.", "אין קשר בין הקרן למוניטין."],
    trap: "לכלול את הקרן ברווח מאיבוד השליטה.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A619",
  }),
  ask({
    id: "lc-down",
    skill: "רט״מ באיבוד שליטה",
    prompt: "האם מכרה לבת קרקע ברווח. ביום שהאם איבדה שליטה, הקרקע עדיין אצל הבת. מה קורה לרווח שנדחה?",
    options: ["הוא מתממש, בתוך הרווח מאיבוד השליטה", "הוא נשאר דחוי עד שהבת לשעבר תמכור את הקרקע", "הוא מתקזז מול העודפים", "הוא עובר לזשמ״ש"],
    answer: 0,
    why: "לפי A612, הקרקע נגרעת עם הבת לפי הערך שלה במאוחד, הנמוך. לכן הרווח מאיבוד השליטה גדל בגובה הדחייה.",
    wrong: ["הקרקע יצאה מהקבוצה יחד עם הבת.", "הוא עובר דרך הרווח, לא ישירות לעודפים.", "רט״מ Down על חשבון האם."],
    trap: "לטפל ב־Down כמו ב־Up, ולהשאיר אותו דחוי.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A612",
  }),
  ask({
    id: "ch-type",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם הגדילה את ההחזקה בבת מ־60% ל־75%, והשליטה נשארה אצלה. איך מטפלים בעסקה במאוחד?",
    options: ["עסקה הונית: ההפרש בהון, בלי רווח או הפסד", "רכישה חדשה, עם מוניטין נוסף", "ההפרש ברווח או הפסד", "מודדים מחדש את כל הבת בשווי הוגן"],
    answer: 0,
    why: "לפי סעיף 23, שינוי בשיעור בלי איבוד שליטה הוא עסקה עם בעלים: האם קנתה מניות מהזשמ״ש. ההפרש עובר לקרן עסקאות עם זשמ״ש.",
    wrong: ["המוניטין נמדד פעם אחת, ביום השגת השליטה.", "עסקה עם בעלים לא יוצרת רווח או הפסד.", "מדידה מחדש יש רק בהשגת שליטה או באיבודה."],
    trap: "לרשום רווח או הפסד על הפער בין המחיר לבין הזשמ״ש.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 69, IFRS 10 סעיף 23",
  }),
  ask({
    id: "ch-costs",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם קנתה עוד מניות של הבת מהזשמ״ש, ונשארה בשליטה. היא שילמה גם עלויות עסקה. לאן הן הולכות במאוחד?",
    options: ["להון, בתוך ההפרש שנזקף לקרן עסקאות עם זשמ״ש", "להוצאות ברווח או הפסד", "למוניטין", "לזשמ״ש"],
    answer: 0,
    why: "לפי A628, העסקה הונית, ולכן גם העלויות שלה בהון. בפקודה הן חלק מהמזומן ששולם, ונכנסות להפרש.",
    wrong: ["העלויות של עסקה הונית לא עוברות דרך הרווח.", "אין מוניטין חדש בעלייה בשיעור.", "הזשמ״ש משתנים רק לפי השיעור."],
    trap: "לרשום את העלויות כהוצאה, כמו בצירוף עסקים.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 69, הסברים A628",
  }),
  ask({
    id: "ch-gw",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם מכרה 10% מהבת לחיצוניים, ונשארה בשליטה. מה קורה לסכום המוניטין במאוחד?",
    options: ["הסכום לא משתנה. משתנה רק החלוקה בין הבעלים לזשמ״ש", "הוא קטן ב־10%", "הוא גדל", "הוא נגרע כולו"],
    answer: 0,
    why: "לפי עמ׳ 70, הבת עדיין מאוחדת במלואה, ולכן המוניטין נשאר כפי שהוא. הזשמ״ש מקבלים חלק ממנו.",
    wrong: ["גריעה של מוניטין יש רק באיבוד שליטה.", "אין מוניטין חדש בעסקה עם בעלים.", "השליטה לא אבדה."],
    trap: "להקטין את המוניטין לפי השיעור שנמכר.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 70",
  }),
  ask({
    id: "ch-premium",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם מכרה חלק מהבת ונשארה בשליטה. הזשמ״ש נמדדו בשווי הוגן, ובמוניטין של האם יש פרמיית שליטה. האם הזשמ״ש מקבלים גם חלק מהפרמיה?",
    options: ["לפי המדיניות שהחברה בחרה", "תמיד כן", "לעולם לא", "רק אם הזשמ״ש נמדדו לפי חלקם בנכסים נטו"],
    answer: 0,
    why: "לפי עמ׳ 70 ו־A663, התקן לא מכריע. לפי פרסום המוסד לתקינה בישראל, החברה בוחרת מדיניות: להעביר חלק מהפרמיה, או להשאיר אותה כולה לבעלים.",
    wrong: ["זו בחירה של מדיניות.", "זו בחירה של מדיניות.", "שיטת המדידה בצירוף לא קובעת את זה."],
    trap: "להעביר תמיד חלק מהפרמיה, או לעולם לא, בלי לבדוק מה המדיניות.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 70, הסברים A663",
  }),
  ask({
    id: "multi-sign",
    skill: "הסדרים מרובים",
    prompt: "האם מוכרת את מניות הבת בשתי עסקאות. איזה סימן מעיד שיש לטפל בשתיהן כעסקה אחת?",
    options: ["שתיהן נקשרו באותו זמן, ואחת לא תתקיים בלי השנייה", "שתיהן נעשו באותה שנה קלנדרית", "המחיר למניה זהה למחיר בבורסה", "בכל עסקה קונה אחר, בלי קשר ביניהם"],
    answer: 0,
    why: "לפי ב97, שני סימנים מתוך הארבעה: ההסדרים נקשרו באותו זמן או תוך ראייה כוללת, והתרחשות של אחד תלויה באחר.",
    wrong: ["אותה שנה לבדה לא מעידה על קשר.", "מחיר שוק דווקא מראה שכל עסקה מוצדקת לבדה.", "זה סימן שהעסקאות נפרדות."],
    trap: "להסתכל רק על הצורה המשפטית, שתי עסקאות, ולא על המהות.",
    level: 1,
    source: "מקורית",
    ref: "סיכום עמ׳ 71, IFRS 10 ב97",
  }),
  ask({
    id: "iss-what",
    skill: "הנפקה של הבת",
    prompt: "הבת הנפיקה מניות לציבור, והאם לא השתתפה. שיעור ההחזקה של האם ירד מ־80% ל־64%, והשליטה נשארה. מה זה בעיני הקבוצה?",
    options: ["ירידה בשיעור בלי איבוד שליטה: עסקה הונית", "איבוד שליטה", "רווח מהנפקה ברווח או הפסד", "אין לזה השפעה על הזשמ״ש"],
    answer: 0,
    why: "השיעור של האם השתנה והשליטה נשארה, ולכן זו עסקה עם הזשמ״ש. ההפרש עובר לקרן עסקאות עם זשמ״ש.",
    wrong: ["השליטה נשארה.", "עסקה עם בעלים לא יוצרת רווח.", "הזשמ״ש גדלו: גם בשיעור וגם בנכסים נטו של הבת."],
    trap: "לחשוב שאם האם לא עשתה כלום, אין מה לרשום.",
    level: 1,
    source: "מקורית",
    ref: "גיליון 7.2 ב, סיכום עמ׳ 70",
  }),

  // Level 2: as in a lecture example.
  askNumber({
    id: "lc-gain-n",
    skill: "איבוד שליטה",
    prompt: "בלי מסים. האם מחזיקה 80% ממניות הבת, ומכרה את כולן ב־500,000 ש״ח. ביום המכירה: הנכסים נטו של הבת במאוחד 450,000 ש״ח, המוניטין במאוחד 60,000 ש״ח ויתרת הזשמ״ש 102,000 ש״ח. אין קרנות ואין רט״מ. מה הרווח מאיבוד השליטה?",
    answer: lossOfControl({ proceeds: 500_000, net: 450_000, goodwill: 60_000, nci: 102_000 }).gain,
    steps: ["מכירים בתמורה ובזשמ״ש שנגרעים, וגורעים את הנכסים נטו ואת כל המוניטין.", "הרווח: 500,000 + 102,000 − 450,000 − 60,000 = 92,000"],
    trap: "לגרוע רק 80% מהנכסים, או לשכוח את הזשמ״ש.",
    level: 2,
    source: "מקורית",
    ref: "סיכום עמ׳ 68",
  }),
  askNumber({
    id: "lc-nci-n",
    skill: "איבוד שליטה",
    prompt: "האם מחזיקה 70% מהבת, והזשמ״ש נמדדו בשווי הוגן. ביום שהשליטה אבדה: הנכסים המזוהים נטו של הבת במאוחד 640,000 ש״ח, המוניטין שמתחלק 90,000 ש״ח, ופרמיית שליטה של 20,000 ש״ח שכולה של האם. אין רט״מ. מה יתרת הזשמ״ש שנגרעת?",
    answer: whole(nciAt({ net: 640_000, splitGoodwill: 90_000, share: 0.3 })),
    steps: ["לזשמ״ש יש 30% מהנכסים נטו ו־30% מהמוניטין שמתחלק. פרמיית השליטה כולה של האם.", "הזשמ״ש: (640,000 + 90,000) × 30% = 219,000"],
    trap: "לחשב את חלק הזשמ״ש גם על פרמיית השליטה.",
    level: 2,
    source: "מקורית",
    ref: "גיליון 7.1, הסברים A606",
  }),
  askNumber({
    id: "inc-nci-n",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם הגדילה את ההחזקה בבת מ־70% ל־85%. הזשמ״ש נמדדו בשווי הוגן. ביום הרכישה הנוספת: הנכסים המזוהים נטו של הבת במאוחד 800,000 ש״ח והמוניטין שמתחלק 100,000 ש״ח. אין רט״מ ואין פרמיית שליטה. בכמה ירדו הזשמ״ש?",
    answer: whole(nciAt({ net: 800_000, splitGoodwill: 100_000, share: 0.3 }) - nciAt({ net: 800_000, splitGoodwill: 100_000, share: 0.15 })),
    steps: ["הזשמ״ש ירדו מ־30% ל־15%.", "לפני: (800,000 + 100,000) × 30% = 270,000", "אחרי: (800,000 + 100,000) × 15% = 135,000", "הירידה: 270,000 − 135,000 = 135,000"],
    trap: "לחשב את הירידה רק על הנכסים, בלי המוניטין שמתחלק.",
    level: 2,
    source: "מקורית",
    ref: "סיכום עמ׳ 69, הסברים A638",
  }),
  askNumber({
    id: "inc-res-n",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם הגדילה את ההחזקה בבת מ־70% ל־85%. היא שילמה לזשמ״ש 150,000 ש״ח ועוד 2,000 ש״ח עלויות עסקה. הזשמ״ש ירדו ב־135,000 ש״ח. בספרי הבת יש קרן הערכה מחדש של 40,000 ש״ח. כמה נזקף לחובת קרן עסקאות עם זשמ״ש?",
    answer: whole(-holdingChange({ nciBefore: 270_000, nciAfter: 135_000, reserves: 40_000, shareBefore: 0.7, shareAfter: 0.85, cash: -152_000 }).toReserve),
    steps: ["חלק האם בקרן הערכה מחדש גדל ב־15%: 40,000 × 15% = 6,000", "המזומן כולל את העלויות: 150,000 + 2,000 = 152,000", "ההפרש לחובת הקרן: 152,000 + 6,000 − 135,000 = 23,000"],
    trap: "לשכוח את הקרן הערכה מחדש, או להוציא את העלויות לרווח או הפסד.",
    level: 2,
    source: "מקורית",
    ref: "סיכום עמ׳ 70, הסברים A632",
  }),
  askNumber({
    id: "dec-nci-n",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם מחזיקה 90% מהבת, והזשמ״ש נמדדו לפי חלקם בנכסים נטו. המוניטין במאוחד 120,000 ש״ח, כולו של האם, ואין בו פרמיית שליטה. האם מכרה 15% ונשארה עם 75%. הנכסים נטו של הבת במאוחד 600,000 ש״ח. בכמה גדלו הזשמ״ש?",
    answer: whole(600_000 * 0.25 + (120_000 * 15) / 90 - 600_000 * 0.1),
    steps: ["בירידה הזשמ״ש מקבלים חלק מהמוניטין של האם, גם כשנמדדו לפי חלקם בנכסים נטו. האם מכרה 15/90 מההחזקה שלה.", "המוניטין שעובר: 120,000 × 15 ÷ 90 = 20,000", "לפני: 600,000 × 10% = 60,000", "אחרי: 600,000 × 25% + 20,000 = 170,000", "הגידול: 170,000 − 60,000 = 110,000"],
    trap: "לא להעביר מוניטין לזשמ״ש, כי בצירוף הם קיבלו רק חלק בנכסים נטו.",
    level: 2,
    source: "מקורית",
    ref: "סיכום עמ׳ 70, הסברים A658",
  }),
  askNumber({
    id: "dec-tax-n",
    skill: "מס בירידה בשיעור",
    prompt: "שיעור המס 23%. האם מכרה מניות של הבת ונשארה בשליטה. רווח ההון לצורכי מס 50,000 ש״ח. במאוחד נזקפו לזכות קרן עסקאות עם זשמ״ש 30,000 ש״ח, לפני מס. כמה מהמס עובר לקרן?",
    answer: whole(saleTax({ proceeds: 50_000, costSold: 0, reserveGross: 30_000, rate: TAX }).toReserve),
    steps: ["המס הולך אחרי הקרן: לקרן עובר המס על הסכום שנזקף לה.", "המס לקרן: 30,000 × 23% = 6,900"],
    trap: "לזקוף לקרן את כל המס על רווח ההון.",
    level: 2,
    source: "מקורית",
    ref: "סיכום עמ׳ 71, הסברים A668",
  }),
  askNumber({
    id: "iss-nci-n",
    skill: "הנפקה של הבת",
    prompt: "בלי מסים. לבת 10,000 מניות, ו־7,000 מהן של האם. הבת הנפיקה לציבור 2,500 מניות ב־100 ש״ח למניה, והאם לא השתתפה. הנכסים נטו של הבת לפני ההנפקה 500,000 ש״ח. הזשמ״ש נמדדו לפי חלקם בנכסים נטו, ואין מוניטין. מה יתרת הזשמ״ש אחרי ההנפקה?",
    answer: whole((500_000 + 250_000) * (1 - holdingAfterIssue({ parentShares: 7_000, totalShares: 10_000, newShares: 2_500, parentBuys: 0 }))),
    steps: ["שיעור האם אחרי ההנפקה: 7,000 ÷ 12,500 = 56%", "הנכסים נטו אחרי ההנפקה: 500,000 + 2,500 × 100 = 750,000", "הזשמ״ש: 750,000 × 44% = 330,000"],
    trap: "לחשב את הזשמ״ש על הנכסים נטו שלפני ההנפקה.",
    level: 2,
    source: "מקורית",
    ref: "גיליון 7.2 ב",
  }),
  askNumber({
    id: "year-adj",
    skill: "שנת איבוד השליטה",
    prompt: "האם מודדת את ההשקעה בבת בעלות, 400,000 ש״ח. היא מכרה את כל ההחזקה ב־650,000 ש״ח. במאוחד, הרווח מאיבוד השליטה 180,000 ש״ח. בכמה מקטינים את הרווח של האם בעמודה שלה במאוחד?",
    answer: 650_000 - 400_000 - 180_000,
    steps: ["בדוח הנפרד האם רשמה רווח לפי העלות: 650,000 − 400,000 = 250,000", "במאוחד צריך 180,000, ולכן התיקון: 250,000 − 180,000 = 70,000"],
    trap: "להשאיר במאוחד את הרווח מהדוח הנפרד.",
    level: 2,
    source: "מקורית",
    ref: "גיליון 7.1 ב",
  }),
  askNumber({
    id: "lc-res-pl",
    skill: "איבוד שליטה",
    prompt: "בלי מסים. האם מחזיקה 75% מהבת ואיבדה שליטה. הרווח מאיבוד השליטה, לפי הפקודה, 50,000 ש״ח. בספרי הבת יש קרן בגין אג״ח בשווי הוגן דרך רווח כולל אחר של 20,000 ש״ח. מה סך ההשפעה של איבוד השליטה על הרווח או הפסד המאוחד?",
    answer: 50_000 + whole(20_000 * 0.75),
    steps: ["חלק האם בקרן של מכשיר החוב עובר לרווח או הפסד: 20,000 × 75% = 15,000", "סך ההשפעה: 50,000 + 15,000 = 65,000"],
    trap: "להעביר את כל הקרן, גם את חלק הזשמ״ש, או לזקוף אותה לעודפים.",
    level: 2,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A619",
  }),
  Object.assign(
    journal(
      "j-lc",
      "פקודת יומן",
      "בלי מסים. האם מחזיקה 80% ממניות הבת, ומכרה את כולן ב־430,000 ש״ח במזומן. ביום המכירה, בספרי הבת, שהם גם הערכים במאוחד: ציוד 310,000 ש״ח, לקוחות 125,000 ש״ח, ספקים 65,000 ש״ח. המוניטין במאוחד 45,000 ש״ח, והזשמ״ש נמדדו לפי חלקם בנכסים נטו. רשמו את הפקודה במאוחד.",
      [
        { account: "מזומן", dr: 430_000 },
        { account: "זשמ״ש", dr: 74_000 },
        { account: "ספקים", dr: 65_000 },
        { account: "ציוד", cr: 310_000 },
        { account: "לקוחות", cr: 125_000 },
        { account: "מוניטין", cr: 45_000 },
        { account: "רווח הון", cr: 89_000 },
      ],
      "הזשמ״ש: (310,000 + 125,000 − 65,000) × 20% = 74,000. הרווח: 430,000 + 74,000 − 370,000 − 45,000 = 89,000. מלכודת נפוצה: לשכוח לגרוע את הזשמ״ש ואת המוניטין.",
      ["מזומן", "זשמ״ש", "ספקים", "ציוד", "לקוחות", "מוניטין", "רווח הון", "השקעה בחברה בת"],
    ),
    m2("סיכום עמ׳ 68"),
  ),
  Object.assign(
    journal(
      "j-inc",
      "פקודת יומן",
      "בלי מסים. האם הגדילה את ההחזקה בבת מ־60% ל־80%, ושילמה לזשמ״ש 217,000 ש״ח במזומן. הזשמ״ש ירדו ב־194,000 ש״ח. בספרי הבת יש קרן הערכה מחדש של 55,000 ש״ח. רשמו את הפקודה במאוחד.",
      [
        { account: "זשמ״ש", dr: 194_000 },
        { account: "קרן עסקאות עם זשמ״ש", dr: 34_000 },
        { account: "מזומן", cr: 217_000 },
        { account: "קרן הערכה מחדש", cr: 11_000 },
      ],
      "חלק האם בקרן גדל: 55,000 × 20% = 11,000. ההפרש לקרן: 217,000 + 11,000 − 194,000 = 34,000. מלכודת נפוצה: לרשום את ההפרש כהפסד.",
      ["זשמ״ש", "קרן עסקאות עם זשמ״ש", "מזומן", "קרן הערכה מחדש", "הפסד הון", "מוניטין"],
    ),
    m2("סיכום עמ׳ 70"),
  ),
  Object.assign(
    journal(
      "j-dec",
      "פקודת יומן",
      "בלי מסים. האם מכרה מניות של הבת ב־93,000 ש״ח, ושיעור ההחזקה ירד מ־90% ל־80%. השליטה נשארה. הזשמ״ש גדלו ב־76,000 ש״ח. בספרי הבת יש קרן הערכה מחדש של 38,000 ש״ח. רשמו את הפקודה במאוחד.",
      [
        { account: "מזומן", dr: 93_000 },
        { account: "קרן הערכה מחדש", dr: 3_800 },
        { account: "זשמ״ש", cr: 76_000 },
        { account: "קרן עסקאות עם זשמ״ש", cr: 20_800 },
      ],
      "חלק האם בקרן קטן: 38,000 × 10% = 3,800. ההפרש לקרן: 93,000 + 3,800 − 76,000 = 20,800. מלכודת נפוצה: לרשום רווח הון של 17,000.",
      ["מזומן", "קרן הערכה מחדש", "זשמ״ש", "קרן עסקאות עם זשמ״ש", "רווח הון", "מוניטין"],
    ),
    m2("סיכום עמ׳ 70"),
  ),

  // Level 3: beyond the example, several ideas together.
  askNumber({
    id: "keep-gain",
    skill: "השקעה שנותרה",
    prompt: "בלי מסים. האם מחזיקה 80% מהבת. היא מכרה 60% ב־720,000 ש״ח, ונשארה עם 20% שהשווי ההוגן שלהם 220,000 ש״ח. ביום המכירה: הנכסים נטו של הבת במאוחד 900,000 ש״ח, המוניטין במאוחד 150,000 ש״ח, ויתרת הזשמ״ש 210,000 ש״ח. אין קרנות ואין רט״מ. מה הרווח מאיבוד השליטה?",
    answer: lossOfControl({ proceeds: 720_000, retainedFv: 220_000, net: 900_000, goodwill: 150_000, nci: 210_000 }).gain,
    steps: ["מכירים בתמורה, בהשקעה שנותרה לפי השווי ההוגן ובזשמ״ש שנגרעים. גורעים את הנכסים נטו ואת כל המוניטין.", "הרווח: 720,000 + 220,000 + 210,000 − 900,000 − 150,000 = 100,000"],
    trap: "להכיר בהשקעה שנותרה לפי חלקה בנכסים נטו, ולהחמיץ את המדידה מחדש.",
    level: 3,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A608",
  }),
  askNumber({
    id: "up-restore",
    skill: "רט״מ באיבוד שליטה",
    prompt: "בלי מסים. האם מחזיקה 70% מהבת. הבת מכרה לאם מלאי, והרט״מ Up שעדיין במלאי של האם 30,000 ש״ח. האם מכרה את כל ההחזקה בבת. לפי המרצה, בכמה מגדילים את המלאי בפקודת איבוד השליטה?",
    answer: whole(30_000 * 0.3),
    steps: ["המלאי אצל האם, ולא נגרע. כשגורעים את הזשמ״ש, גורעים גם את חלקם בדחייה, ולכן מחזירים אותו למלאי.", "המלאי גדל: 30,000 × 30% = 9,000", "חלק האם, 21,000, נשאר דחוי עד שהמלאי יימכר החוצה."],
    trap: "לממש את כל הרט״מ Up ברווח.",
    level: 3,
    source: "מקורית",
    ref: "סיכום עמ׳ 68, הסברים A613",
  }),
  askNumber({
    id: "down-gain",
    skill: "רט״מ באיבוד שליטה",
    prompt: "בלי מסים. האם מחזיקה 80% מהבת, והזשמ״ש נמדדו לפי חלקם בנכסים נטו. האם מכרה לבת קרקע, ורט״מ Down של 26,000 ש״ח עדיין בקרקע. האם מכרה את כל ההחזקה ב־615,000 ש״ח. ביום המכירה: הנכסים נטו של הבת, לפני ביטול הרט״מ, 530,000 ש״ח, והמוניטין במאוחד 73,000 ש״ח. מה הרווח מאיבוד השליטה?",
    answer: lossOfControl({ proceeds: 615_000, net: 530_000, down: 26_000, goodwill: 73_000, nci: whole(530_000 * 0.2) }).gain,
    steps: ["הזשמ״ש לפי הנכסים נטו של הבת, בלי הרט״מ Down, שהוא של האם: 530,000 × 20% = 106,000", "הנכסים נטו במאוחד: 530,000 − 26,000 = 504,000", "הרווח: 615,000 + 106,000 − 504,000 − 73,000 = 144,000"],
    trap: "להקטין גם את הזשמ״ש בגלל רט״מ Down.",
    level: 3,
    source: "מקורית",
    ref: "גיליון 7.1, הסברים A612",
  }),
  askNumber({
    id: "year-owners",
    skill: "שנת איבוד השליטה",
    prompt: "האם החזיקה 75% מהבת ומכרה את כל ההחזקה באמצע השנה. הרווח של האם בדוח הנפרד לשנה 340,000 ש״ח, ובו רווח של 128,000 ש״ח ממכירת הבת, לפי העלות. במאוחד הרווח מאיבוד השליטה 95,000 ש״ח. הרווח של הבת עד יום המכירה 64,000 ש״ח, בלי התאמות. מה הרווח המאוחד שמיוחס לבעלי המניות של האם?",
    answer: 340_000 - 128_000 + 95_000 + 64_000 - whole(64_000 * 0.25),
    steps: ["הרווח המאוחד: 340,000 − 128,000 + 95,000 + 64,000 = 371,000", "הזשמ״ש, רק עד יום המכירה: 64,000 × 25% = 16,000", "לבעלים: 371,000 − 16,000 = 355,000"],
    trap: "להשאיר את הרווח מהדוח הנפרד במקום הרווח שבמאוחד.",
    level: 3,
    source: "מקורית",
    ref: "גיליון 7.1 ב",
  }),
  askNumber({
    id: "iss-res",
    skill: "הנפקה של הבת",
    prompt: "בלי מסים. לבת 10,000 מניות, ו־7,500 מהן של האם. הבת הנפיקה לציבור 2,500 מניות ב־150 ש״ח, והאם לא השתתפה. הנכסים נטו של הבת לפני ההנפקה 900,000 ש״ח. הזשמ״ש נמדדו לפי חלקם בנכסים נטו, ואין מוניטין. כמה נזקף לזכות קרן עסקאות עם זשמ״ש?",
    answer: whole(holdingChange({ nciBefore: 225_000, nciAfter: whole(1_275_000 * 0.4), shareBefore: 0.75, shareAfter: 0.6, cash: 375_000 }).toReserve),
    steps: ["שיעור האם אחרי ההנפקה: 7,500 ÷ 12,500 = 60%", "הזשמ״ש לפני: 900,000 × 25% = 225,000", "הזשמ״ש אחרי: (900,000 + 375,000) × 40% = 510,000", "לקרן: 375,000 − (510,000 − 225,000) = 90,000"],
    trap: "לזקוף את כל תמורת ההנפקה לזשמ״ש.",
    level: 3,
    source: "מקורית",
    ref: "גיליון 7.2 ב",
  }),
  askNumber({
    id: "dec-polb",
    skill: "שינוי בלי איבוד שליטה",
    prompt: "האם ירדה בבת מ־80% ל־70% ונשארה בשליטה. הזשמ״ש נמדדו בשווי הוגן. הנכסים המזוהים נטו של הבת במאוחד 1,000,000 ש״ח, המוניטין שמתחלק 160,000 ש״ח, ופרמיית שליטה של 40,000 ש״ח שכולה של האם. המדיניות: מחלקים מחדש את הפרמיה. בכמה גדלו הזשמ״ש?",
    answer: whole(nciAt({ net: 1_000_000, splitGoodwill: 160_000, share: 0.3, premium: 40_000, premiumShare: 10 / 80 }) - nciAt({ net: 1_000_000, splitGoodwill: 160_000, share: 0.2 })),
    steps: ["השיעור עלה ב־10%: (1,000,000 + 160,000) × 10% = 116,000", "האם מכרה 10/80 מההחזקה שלה, ולכן גם מהפרמיה: 40,000 × 10 ÷ 80 = 5,000", "הגידול: 116,000 + 5,000 = 121,000"],
    trap: "להעביר 10% מהפרמיה במקום 10/80, או לשכוח את המדיניות.",
    level: 3,
    source: "מקורית",
    ref: "גיליון 7.3, הסברים A658",
  }),
  askNumber({
    id: "issue-gw",
    skill: "הנפקה של הבת",
    prompt: "לחברה 40,000 מניות, וההון שלה 520,000 ש״ח, שווה לשווי ההוגן של הנכסים נטו. האם קנתה ממנה 60,000 מניות חדשות ב־1,230,000 ש״ח, והשיגה שליטה. הזשמ״ש נמדדים לפי חלקם בנכסים נטו. מה המוניטין?",
    answer: 1_230_000 + whole(1_750_000 * 0.4) - 1_750_000,
    steps: ["שיעור האם: 60,000 ÷ 100,000 = 60%", "המזומן מההנפקה נשאר בבת: 520,000 + 1,230,000 = 1,750,000", "הזשמ״ש: 1,750,000 × 40% = 700,000", "המוניטין: 1,230,000 + 700,000 − 1,750,000 = 180,000"],
    trap: "לחשב את המוניטין על ההון שלפני ההנפקה.",
    level: 3,
    source: "מקורית",
    ref: "גיליון 7.2 ב, סיכום עמ׳ 39",
  }),
  askNumber({
    id: "tax-expense",
    skill: "מס בירידה בשיעור",
    prompt: "שיעור המס 23%. האם מכרה מניות של הבת ונשארה בשליטה. רווח ההון לצורכי מס 70,000 ש״ח, ובמאוחד נזקפו לזכות קרן עסקאות עם זשמ״ש 45,000 ש״ח לפני מס. כמה הוצאות מסים נשארות ברווח או הפסד המאוחד?",
    answer: whole(saleTax({ proceeds: 70_000, costSold: 0, reserveGross: 45_000, rate: TAX }).expense),
    steps: ["המס לשלם: 70,000 × 23% = 16,100", "לקרן: 45,000 × 23% = 10,350", "נשאר בהוצאות: 16,100 − 10,350 = 5,750"],
    trap: "לבטל את כל הוצאות המס, כי במאוחד אין רווח.",
    level: 3,
    source: "מקורית",
    ref: "סיכום עמ׳ 71, הסברים A669",
  }),
  Object.assign(
    journal(
      "j-dectax",
      "פקודת יומן",
      "שיעור המס 23%. האם מכרה מניות של הבת ונשארה בשליטה. רווח ההון לצורכי מס 60,000 ש״ח, והמס לשלם 13,800 ש״ח. במאוחד נזקפו לזכות קרן עסקאות עם זשמ״ש 25,000 ש״ח לפני מס. רשמו את פקודת המס כפי שהיא צריכה להיות במאוחד.",
      [
        { account: "הוצאות מסים", dr: 8_050 },
        { account: "קרן עסקאות עם זשמ״ש", dr: 5_750 },
        { account: "מסים לשלם", cr: 13_800 },
      ],
      "לקרן: 25,000 × 23% = 5,750. השאר בהוצאות: 13,800 − 5,750 = 8,050. מלכודת נפוצה: לרשום את כל המס בהוצאות, כמו בדוח הנפרד.",
      ["הוצאות מסים", "קרן עסקאות עם זשמ״ש", "מסים לשלם", "התחייבות מסים נדחים", "עודפים"],
    ),
    m3("סיכום עמ׳ 71, הסברים A670"),
  ),
  Object.assign(
    journal(
      "j-keep",
      "פקודת יומן",
      "בלי מסים. האם מחזיקה 70% מהבת. היא מכרה 50% ב־395,000 ש״ח במזומן, ונשארה עם 20% שהשווי ההוגן שלהם 154,000 ש״ח. ההשקעה שנותרה היא בחברה כלולה. בספרי הבת, שהם גם הערכים במאוחד: מלאי 520,000 ש״ח וספקים 110,000 ש״ח. המוניטין במאוחד 92,000 ש״ח, והזשמ״ש נמדדו לפי חלקם בנכסים נטו. רשמו את הפקודה במאוחד.",
      [
        { account: "מזומן", dr: 395_000 },
        { account: "השקעה בחברה כלולה", dr: 154_000 },
        { account: "זשמ״ש", dr: 123_000 },
        { account: "ספקים", dr: 110_000 },
        { account: "מלאי", cr: 520_000 },
        { account: "מוניטין", cr: 92_000 },
        { account: "רווח הון", cr: 170_000 },
      ],
      "הזשמ״ש: (520,000 − 110,000) × 30% = 123,000. הרווח: 395,000 + 154,000 + 123,000 − 410,000 − 92,000 = 170,000. מלכודת נפוצה: לרשום את ההשקעה שנותרה לפי חלקה בנכסים נטו, 82,000.",
      ["מזומן", "השקעה בחברה כלולה", "זשמ״ש", "ספקים", "מלאי", "מוניטין", "רווח הון", "השקעה בחברה בת"],
    ),
    m3("סיכום עמ׳ 68, הסברים A608"),
  ),
];

const traps: Trap[] = [
  {
    id: "gain-in-pl",
    prompt: "האם מכרה 10% מהבת ונשארה בשליטה. התמורה גבוהה ב־40,000 ש״ח מהגידול בזשמ״ש. סטודנטית רשמה רווח של 40,000 ש״ח ברווח או הפסד המאוחד. מה נכון?",
    options: ["ההפרש עובר לקרן עסקאות עם זשמ״ש בהון, בלי רווח", "היא צודקת", "ההפרש מקטין את המוניטין", "ההפרש עובר לזשמ״ש"],
    answer: 0,
    why: "שינוי בשיעור בלי איבוד שליטה הוא עסקה עם בעלים, עסקה הונית. ההפרש בהון.",
    traps: ["", "עסקה עם בעלים לא יוצרת רווח או הפסד.", "המוניטין לא משתנה בעסקה כזו.", "הזשמ״ש כבר עודכנו לפי השיעור החדש."],
  },
  {
    id: "keep-cost",
    prompt: "האם איבדה שליטה ונשארה עם 30% מהמניות. סטודנט רשם את ההשקעה שנותרה לפי חלקה בנכסים נטו של הבת במאוחד. מה נכון?",
    options: ["ההשקעה שנותרה נמדדת בשווי ההוגן ביום איבוד השליטה", "הוא צודק", "לפי העלות המקורית", "לא מכירים בה"],
    answer: 0,
    why: "לפי ב98, ההשקעה שנותרה בשווי הוגן. ההפרש מול הערך במאוחד נכלל ברווח מאיבוד השליטה.",
    traps: ["", "זה הערך במאוחד, לא השווי ההוגן.", "העלות לא רלוונטית ביום איבוד השליטה.", "המניות של האם, ולכן מכירים בהן."],
  },
  {
    id: "up-all",
    prompt: "האם איבדה שליטה בבת. במלאי של האם יש רט״מ Up של 20,000 ש״ח, והאם החזיקה 80%. סטודנטית מימשה את כל 20,000 ברווח מאיבוד השליטה. מה נכון, לפי המרצה?",
    options: ["מחזירים למלאי רק את חלק הזשמ״ש, 4,000, וחלק האם נשאר דחוי", "היא צודקת", "לא עושים כלום עם הרט״מ", "מבטלים את כל הרט״מ מול העודפים"],
    answer: 0,
    why: "המלאי נשאר אצל האם. לפי A613-A615, מגדילים אותו בחלק הזשמ״ש, שנגרע עם הזשמ״ש. חלק האם ממשיך להיות דחוי עד שהמלאי יימכר.",
    traps: ["", "המלאי לא יצא מהקבוצה, ולכן חלק האם לא מומש.", "בלי הפעולה, חלק הזשמ״ש היה מתממש ברווח.", "אין סיבה לעבור לעודפים."],
  },
  {
    id: "issue-cash",
    prompt: "הבת הנפיקה 2,000 מניות ב־100 ש״ח. האם קנתה 1,500 מהן, והשאר נמכרו לציבור. סטודנט רשם במאוחד כניסת מזומן של 200,000 ש״ח. מה נכון?",
    options: ["במאוחד נכנס רק המזומן מהציבור, 50,000 ש״ח", "הוא צודק", "לא נכנס מזומן בכלל", "נכנס רק המזומן של האם, 150,000 ש״ח"],
    answer: 0,
    why: "המזומן שהאם שילמה עבר מחברה אחת בקבוצה לאחרת, ולכן לא משנה את המזומן במאוחד. מבחוץ נכנס רק מה שהציבור שילם: 500 × 100 = 50,000.",
    traps: ["", "150,000 מתוכם הם תשלום בתוך הקבוצה.", "הציבור שילם 50,000 ש״ח.", "זה בדיוק החלק שנשאר בתוך הקבוצה."],
  },
];

/** The screen that teaches each question and trap. */
export const HOLDING_TAUGHT: Record<string, string> = {
  "lc-out": "ls-con-lcentry",
  "lc-keep": "ls-con-lcretained",
  "lc-debt": "ls-con-lcreserves",
  "lc-reval": "ls-con-lcreserves",
  "lc-down": "ls-con-lcunreal",
  "ch-type": "ls-con-chup",
  "ch-costs": "ls-con-chup",
  "ch-gw": "ls-con-chdown",
  "ch-premium": "ls-con-chdown",
  "multi-sign": "ls-con-chmulti",
  "iss-what": "ls-con-chissue",
  "lc-gain-n": "ls-con-lcentry",
  "lc-nci-n": "ls-con-lcentry",
  "inc-nci-n": "ls-con-chup",
  "inc-res-n": "ls-con-chup",
  "dec-nci-n": "ls-con-chdown",
  "dec-tax-n": "ls-con-chtax",
  "iss-nci-n": "ls-con-chissue",
  "year-adj": "ls-con-lcyear",
  "lc-res-pl": "ls-con-lcreserves",
  "j-lc": "ls-con-lcentry",
  "j-inc": "ls-con-chup",
  "j-dec": "ls-con-chdown",
  "keep-gain": "ls-con-lcretained",
  "up-restore": "ls-con-lcunreal",
  "down-gain": "ls-con-lcunreal",
  "year-owners": "ls-con-lcyear",
  "iss-res": "ls-con-chissue",
  "dec-polb": "ls-con-chdown",
  "issue-gw": "ls-con-chissue",
  "tax-expense": "ls-con-chtax",
  "j-dectax": "ls-con-chtax",
  "j-keep": "ls-con-lcretained",
  "gain-in-pl": "ls-con-chdown",
  "keep-cost": "ls-con-lcretained",
  "up-all": "ls-con-lcunreal",
  "issue-cash": "ls-con-chissue",
};

/** Lesson 12: loss of control, and changes in the holding without it. */
export const HOLDING: StudyModule = {
  slug: "consolidated-holding",
  course: COURSE,
  n: 12,
  title: "איבוד שליטה ושינויים בשיעור ההחזקה",
  description: "מה קורה במאוחד כשהאם מאבדת שליטה בבת, ומה קורה כשהיא קונה או מוכרת מניות ונשארת בשליטה: גריעה, השקעה שנותרה, קרנות, רט״מ, קרן עסקאות עם זשמ״ש, מס, הנפקה של הבת והסדרים מרובים.",
  goal: "להבחין בין איבוד שליטה, שיוצר רווח או הפסד, לבין שינוי בשיעור בלי איבוד שליטה, שהוא עסקה הונית, ולרשום כל אחד מהם במאוחד.",
  outcomes: [
    "לרשום את פקודת איבוד השליטה, עם ההשקעה שנותרה, הקרנות והרט״מ",
    "לתקן את הרווח של האם בשנת המכירה, ולחלק את הרווח המאוחד",
    "לחשב את השינוי בזשמ״ש בעלייה ובירידה בשיעור, ואת ההפרש לקרן עסקאות עם זשמ״ש",
    "להעביר מוניטין ופרמיית שליטה לזשמ״ש בירידה בשיעור, לפי המדיניות",
    "לפצל את המס על מכירה בלי איבוד שליטה בין הקרן לבין הרווח או הפסד",
    "לחשב את שיעור ההחזקה ואת הזשמ״ש אחרי הנפקה של הבת",
    "לזהות מתי כמה הסדרים הם עסקה אחת",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-con-lcentry", title: "איבוד שליטה: הפקודה" },
    { id: "ls-con-lcreserves", title: "קרנות הון של הבת" },
    { id: "ls-con-lcretained", title: "השקעה שנותרה" },
    { id: "ls-con-lcunreal", title: "רט״מ ביום איבוד השליטה" },
    { id: "ls-con-lcyear", title: "שנת המכירה: הרווח המאוחד" },
    { id: "ls-con-chup", title: "עלייה בשיעור בלי איבוד שליטה" },
    { id: "ls-con-chdown", title: "ירידה בשיעור: מוניטין ופרמיה" },
    { id: "ls-con-chtax", title: "מס בירידה בשיעור" },
    { id: "ls-con-chissue", title: "הנפקה של הבת" },
    { id: "ls-con-chmulti", title: "הסדרים מרובים" },
    { id: "ls-con-lab12", title: "מעבדה: לפני ואחרי" },
    { id: "ls-con-sort12", title: "ממיינים: רווח או הון" },
    { id: "ls-con-drill12", title: "תרגול עם מספרים חדשים" },
    { id: "ls-con-mistake12", title: "מצאו את הטעות" },
    { id: "ls-con-master12", title: "שאלה מסכמת" },
  ],
  exercises,
  traps,
  tips: [
    "השאלה הראשונה בכל שינוי בהחזקה: האם השליטה אבדה? אם כן, רווח או הפסד. אם לא, עסקה הונית.",
    "איבוד שליטה: מכירים בתמורה, בהשקעה שנותרה לפי שווי הוגן ובזשמ״ש שנגרעים. גורעים את הנכסים נטו לפי הערך במאוחד ואת כל המוניטין. ההפרש רווח או הפסד של האם.",
    "קרנות הבת ביום איבוד השליטה, בחלק האם: הערכה מחדש ומכשיר הוני לעודפים, מכשיר חוב לרווח או הפסד.",
    "רט״מ: Down מתממש בתוך הרווח. Up, לפי המרצה: מחזירים למלאי את חלק הזשמ״ש, וחלק האם נשאר דחוי.",
    "בשנת המכירה: רווח הבת נכנס רק עד יום המכירה, והרווח שהאם רשמה בנפרד מוחלף ברווח שבמאוחד.",
    "שינוי בלי איבוד שליטה: הזשמ״ש לפני ואחרי, חלק האם בקרנות זז, והשאר מול המזומן לקרן עסקאות עם זשמ״ש. בלי רווח, ובלי מוניטין חדש.",
    "בירידה בשיעור הזשמ״ש מקבלים חלק מהמוניטין של האם, בכל שיטת מדידה. את פרמיית השליטה רק אם זו המדיניות.",
    "מס בירידה: החלק שמתאים לקרן נזקף לקרן, והשאר נשאר בהוצאות המס. הרווח מהדוח הנפרד מתבטל.",
    "הנפקה של הבת: שיעור חדש לפי מספר המניות. רק המזומן מהציבור נכנס למאוחד.",
  ],
};
