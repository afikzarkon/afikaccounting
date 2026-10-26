/**
 * Exchange of property, plant and equipment (IAS 16.24–26) for the learning lab.
 *
 * Three steps: the exchange date; the old asset's depreciation from the start of
 * the year up to that date; then the new asset's cost, which depends on whether
 * the exchange has commercial substance with a reliably measured fair value:
 *
 *   with:    cost = fair value given + cash paid − cash received,
 *            gain = fair value given − carrying amount given
 *   without: cost = carrying amount given + cash paid − cash received, no gain
 *
 * When the received asset's fair value is the clearer one, it is the new cost
 * and the fair value given is backed out of it. The exchange takes place at the
 * start of its month. Each asset has its own depreciation method; by default
 * straight-line, where the old asset's accumulated depreciation can be given
 * outright. Under any other method the old asset is bought on 1 January and its
 * age in whole years decides which life year the exchange falls in.
 */

import { lifeYearCalcs, lifeYearCharges, METHOD_LABEL, methodCalc, MONTH, type RenoCalc, type RenoMethod, show, tn, tx } from "./renovation";

export type { RenoMethod as DepMethod };

export type ExchangeInputs = {
  oldCost: number;
  oldSalvage: number;
  /** Useful life of the old asset, in years. */
  oldLife: number;
  /** Old asset's accumulated depreciation at the start of the exchange year. */
  accumulatedOpening: number;
  /** Month (1–12) the exchange takes place, at its start. */
  month: number;
  /** Commercial substance and a reliably measured fair value. */
  commercial: boolean;
  /** Which fair value is the clearer evidence. */
  basis: "given" | "received";
  fairValueGiven: number;
  fairValueReceived: number;
  cashPaid: number;
  cashReceived: number;
  newLife: number;
  newSalvage: number;
  /** Depreciation methods of the asset given and of the one received; straight-line when left out. */
  oldMethod?: RenoMethod;
  newMethod?: RenoMethod;
  /**
   * Whole years the old asset was in use before the exchange year. When given, its
   * accumulated depreciation is computed by its method instead of taken from `accumulatedOpening`.
   */
  yearsUsed?: number;
};

/** One fiscal year of the new asset after the exchange year: the tail of one life year and the head of the next. */
export type NewAssetYear = { n: number; opening: number; fromPrev: number; fromCurr: number; charge: number; closing: number };

export type ExchangeResult = {
  oldAnnual: number;
  /** Months of the year before the exchange: the old asset's last depreciation. */
  monthsBefore: number;
  depToDate: number;
  accumulated: number;
  bookValue: number;
  /** Fair value of the asset given, as measured or as backed out of the one received; null without commercial substance. */
  fairValueGiven: number | null;
  newCost: number;
  /** Positive for a gain, negative for a loss; 0 without commercial substance. */
  gain: number;
  /** Months from the exchange to year end: the new asset's first depreciation. */
  monthsAfter: number;
  newAnnual: number;
  newDep: number;
  newBookValue: number;
  /** Depreciation expense of the year: old asset until the exchange plus new asset after it. */
  totalDep: number;
  /** Charge per life year of each asset, under its method. */
  oldYears: number[];
  newYears: number[];
  /** The new asset's fiscal years after the exchange year, until it is fully depreciated. */
  later: NewAssetYear[];
};

const whole = (n: number) => Number.isInteger(n) && n >= 1 && n <= 50;

/** Input problems, keyed by field; empty when the exchange can be solved. */
export function exchangeErrors(x: ExchangeInputs): Partial<Record<keyof ExchangeInputs | "newCost", string>> {
  const e: Partial<Record<keyof ExchangeInputs | "newCost", string>> = {};
  if (!(x.oldCost > 0)) e.oldCost = "העלות המקורית חייבת להיות חיובית";
  if (!(x.oldSalvage >= 0)) e.oldSalvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.oldCost > 0 && x.oldSalvage >= x.oldCost) e.oldSalvage = "ערך הגרט חייב להיות נמוך מהעלות";
  const oldMethod = x.oldMethod ?? "sl";
  const newMethod = x.newMethod ?? "sl";
  if (!(x.oldLife > 0)) e.oldLife = "אורך חיים חיובי";
  else if ((oldMethod !== "sl" || x.yearsUsed !== undefined) && !whole(x.oldLife)) e.oldLife = "אורך חיים בשנים שלמות, 1 עד 50";
  else if (oldMethod === "db" && !(x.oldSalvage > 0)) e.oldSalvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (x.yearsUsed !== undefined) {
    if (!Number.isInteger(x.yearsUsed) || x.yearsUsed < 0) e.yearsUsed = "מספר שנים שלם, 0 ומעלה";
    else if (x.oldLife > 0 && x.yearsUsed >= x.oldLife) e.yearsUsed = "ההחלפה חייבת להיות לפני תום אורך החיים של הנכס הישן";
  } else if (!(x.accumulatedOpening >= 0)) e.accumulatedOpening = "פחת נצבר לא יכול להיות שלילי";
  if (!Number.isInteger(x.month) || x.month < 1 || x.month > 12) e.month = "חודש בין 1 ל-12";
  if (!(x.cashPaid >= 0) || !(x.cashReceived >= 0)) e.cashPaid = "סכום המזומן לא יכול להיות שלילי";
  if (x.commercial && x.basis === "given" && !(x.fairValueGiven > 0)) e.fairValueGiven = "שווי הוגן חיובי";
  if (x.commercial && x.basis === "received" && !(x.fairValueReceived > 0)) e.fairValueReceived = "שווי הוגן חיובי";
  if (!(x.newLife > 0)) e.newLife = "אורך חיים חיובי";
  else if (!whole(x.newLife)) e.newLife = "אורך חיים בשנים שלמות, 1 עד 50";
  if (!(x.newSalvage >= 0)) e.newSalvage = "ערך הגרט לא יכול להיות שלילי";
  else if (newMethod === "db" && !(x.newSalvage > 0)) e.newSalvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (Object.keys(e).length) return e;

  const r = solveExchange(x);
  if (r.accumulated > x.oldCost - x.oldSalvage + 0.005)
    e.accumulatedOpening = "הפחת הנצבר עד ההחלפה עולה על הסכום בר-הפחת של הנכס הישן";
  if (!(r.newCost > 0)) e.newCost = "עלות הנכס החדש יוצאת לא חיובית — בדקו את סכומי המזומן";
  else if (x.newSalvage >= r.newCost) e.newSalvage = "ערך הגרט של הנכס החדש חייב להיות נמוך מעלותו";
  return e;
}

export function solveExchange(x: ExchangeInputs): ExchangeResult {
  const oldMethod = x.oldMethod ?? "sl";
  const byYears = oldMethod !== "sl" || x.yearsUsed !== undefined;
  const oldYears = byYears ? lifeYearCharges(oldMethod, x.oldCost, x.oldSalvage, x.oldLife) : [];
  const used = x.yearsUsed ?? 0;
  // The charge of the life year the exchange falls in; straight-line has one for every year.
  const oldAnnual = byYears ? (oldYears[used] ?? 0) : (x.oldCost - x.oldSalvage) / x.oldLife;
  const accumulatedOpening = byYears ? oldYears.slice(0, used).reduce((a, c) => a + c, 0) : x.accumulatedOpening;
  const monthsBefore = x.month - 1;
  const depToDate = (oldAnnual * monthsBefore) / 12;
  const accumulated = accumulatedOpening + depToDate;
  const bookValue = x.oldCost - accumulated;
  const cash = x.cashPaid - x.cashReceived;

  let fairValueGiven: number | null = null;
  let newCost: number;
  if (!x.commercial) newCost = bookValue + cash;
  else if (x.basis === "given") {
    fairValueGiven = x.fairValueGiven;
    newCost = x.fairValueGiven + cash;
  } else {
    newCost = x.fairValueReceived;
    fairValueGiven = x.fairValueReceived - cash;
  }
  const gain = fairValueGiven === null ? 0 : fairValueGiven - bookValue;

  const monthsAfter = 12 - monthsBefore;
  const newMethod = x.newMethod ?? "sl";
  const newYears = Number.isInteger(x.newLife) && x.newLife >= 1 ? lifeYearCharges(newMethod, newCost, x.newSalvage, x.newLife) : [(newCost - x.newSalvage) / x.newLife];
  const newAnnual = newYears[0];
  const newDep = (newAnnual * monthsAfter) / 12;
  // Later fiscal years: the months of the last life year left over, then the start of the next one.
  const later: NewAssetYear[] = [];
  let closing = newCost - newDep;
  const count = monthsBefore === 0 ? newYears.length - 1 : newYears.length;
  for (let n = 1; n <= count; n++) {
    const fromPrev = monthsBefore === 0 ? 0 : ((newYears[n - 1] ?? 0) * monthsBefore) / 12;
    const fromCurr = ((newYears[n] ?? 0) * monthsAfter) / 12;
    const charge = fromPrev + fromCurr;
    later.push({ n, opening: closing, fromPrev, fromCurr, charge, closing: closing - charge });
    closing -= charge;
  }
  return {
    oldAnnual,
    monthsBefore,
    depToDate,
    accumulated,
    bookValue,
    fairValueGiven,
    newCost,
    gain,
    monthsAfter,
    newAnnual,
    newDep,
    newBookValue: newCost - newDep,
    totalDep: depToDate + newDep,
    oldYears,
    newYears,
    later,
  };
}

// ---------------------------------------------------------------------------
// The working, step by step, for someone who has never solved one.

export type ExchangeStep = {
  id: string;
  title: string;
  why: string;
  text: string[];
  calcs: RenoCalc[];
  entry?: "catch-up" | "exchange" | "year-end";
};

const cashTex = (x: ExchangeInputs) => (x.cashPaid > 0 ? ` + ${tn(x.cashPaid)}` : x.cashReceived > 0 ? ` - ${tn(x.cashReceived)}` : "");
const cashWords = (x: ExchangeInputs) => (x.cashPaid > 0 ? ` + ${tx("מזומן ששולם")}` : x.cashReceived > 0 ? ` - ${tx("מזומן שהתקבל")}` : "");

export function explainExchange(x: ExchangeInputs, r: ExchangeResult): ExchangeStep[] {
  const oldMethod = x.oldMethod ?? "sl";
  const newMethod = x.newMethod ?? "sl";
  const byYears = oldMethod !== "sl" || x.yearsUsed !== undefined;
  const used = x.yearsUsed ?? 0;
  const mid = r.monthsBefore > 0;
  const steps: ExchangeStep[] = [];

  steps.push({
    id: "date",
    title: "שלב 1 — תאריך ההחלפה",
    why: "התאריך מחלק את השנה בין שני הנכסים: עד ההחלפה רושמים פחת לנכס הישן, ומההחלפה — לנכס החדש. לכן קודם קובעים כמה חודשים שייכים לכל אחד.",
    text: [
      `ההחלפה ב-1 ב${MONTH[x.month - 1]}.`,
      mid
        ? `${MONTH[0]}–${MONTH[x.month - 2]}: ${r.monthsBefore} חודשי פחת לנכס הישן. ${MONTH[x.month - 1]}–דצמבר: ${r.monthsAfter} חודשים לנכס החדש.`
        : "החלפה בינואר: לנכס הישן אין פחת בשנה הזו, והנכס החדש מופחת שנה מלאה.",
      ...(byYears ? [`הנכס הישן נקנה ב-1 בינואר, והיה בשימוש ${used} שנים מלאות לפני שנת ההחלפה — ההחלפה נופלת בשנת החיים ה-${used + 1} שלו.`] : []),
    ],
    calcs: [],
  });

  const oldName = (k: number) => `שנת חיים ${k + 1} של הנכס הישן`;
  steps.push({
    id: "old",
    title: "שלב 2 — הפחת של הנכס הישן עד ההחלפה",
    why: "את הנכס הישן מוציאים מהספרים לפי הערך שלו ביום ההחלפה. לכן קודם רושמים לו את הפחת עד אותו יום — אחרת הערך בספרים גבוה מדי, והרווח או ההפסד יוצאים שגויים.",
    text: [`הנכס הישן: עלות ${show(x.oldCost)}, גרט ${show(x.oldSalvage)}, ${show(x.oldLife)} שנים, ${METHOD_LABEL[oldMethod]}.`],
    calcs: [
      methodCalc(oldMethod, x.oldCost, x.oldSalvage, x.oldLife, "של הנכס הישן"),
      ...(byYears
        ? [
            ...lifeYearCalcs(oldMethod, x.oldCost, x.oldSalvage, x.oldLife, r.oldYears, oldName, used + 1),
            {
              label: "פחת נצבר לתחילת שנת ההחלפה — סך שנות החיים שעברו",
              tex: `${r.oldYears.slice(0, used).map(tn).join(" + ") || "0"} = ${tn(r.accumulated - r.depToDate)}`,
            },
          ]
        : [{ label: "פחת נצבר לתחילת שנת ההחלפה (נתון)", tex: tn(x.accumulatedOpening) }]),
      ...(mid
        ? [
            {
              label: `פחת ${MONTH[0]}–${MONTH[x.month - 2]}: ${r.monthsBefore} חודשים מתוך שנת החיים הנוכחית`,
              tex: `${tx("פחת השנה המלאה")} \\times \\frac{${tx("חודשים")}}{12} = ${tn(r.oldAnnual)} \\times \\frac{${r.monthsBefore}}{12} = ${tn(r.depToDate)}`,
              note: "זה הפחת שנרשם בפקודה הראשונה, לפני ההחלפה.",
            },
          ]
        : []),
      { label: "פחת נצבר ביום ההחלפה", tex: `${tn(r.accumulated - r.depToDate)} + ${tn(r.depToDate)} = ${tn(r.accumulated)}` },
      { label: "ערך בספרים של הנכס הישן ביום ההחלפה", tex: `${tx("עלות")} - ${tx("פחת נצבר")} = ${tn(x.oldCost)} - ${tn(r.accumulated)} = ${tn(r.bookValue)}` },
    ],
    entry: mid ? "catch-up" : undefined,
  });

  const gainLabel = r.gain >= 0 ? "רווח מההחלפה" : "הפסד מההחלפה";
  const third: RenoCalc[] = [];
  if (!x.commercial)
    third.push({
      label: "עלות הנכס החדש — לפי הערך בספרים של הנכס הישן",
      tex: `${tx("ערך בספרים")}${cashWords(x)} = ${tn(r.bookValue)}${cashTex(x)} = ${tn(r.newCost)}`,
      note: "אין מהות מסחרית, ולכן לא מוכרים רווח או הפסד: הנכס החדש פשוט \"ממשיך\" את הישן.",
    });
  else if (x.basis === "given")
    third.push(
      { label: "עלות הנכס החדש — מה שנתנו תמורתו", tex: `${tx("שווי הוגן של הנכס שנמסר")}${cashWords(x)} = ${tn(x.fairValueGiven)}${cashTex(x)} = ${tn(r.newCost)}` },
      { label: `${gainLabel} — השווי של מה שמסרנו מול הערך שלו בספרים`, tex: `${tx("שווי הוגן")} - ${tx("ערך בספרים")} = ${tn(x.fairValueGiven)} - ${tn(r.bookValue)} = ${tn(r.gain)}` },
    );
  else
    third.push(
      { label: "עלות הנכס החדש — השווי ההוגן שלו, כי הוא הברור יותר", tex: `${tx("עלות")} = ${tn(r.newCost)}` },
      {
        label: "השווי של מה שמסרנו — נגזר מהנכס שהתקבל, בניכוי המזומן",
        tex: `${tn(x.fairValueReceived)}${x.cashPaid > 0 ? ` - ${tn(x.cashPaid)}` : x.cashReceived > 0 ? ` + ${tn(x.cashReceived)}` : ""} = ${tn(r.fairValueGiven!)}`,
      },
      { label: `${gainLabel} — השווי של מה שמסרנו מול הערך שלו בספרים`, tex: `${tn(r.fairValueGiven!)} - ${tn(r.bookValue)} = ${tn(r.gain)}` },
    );
  steps.push({
    id: "measure",
    title: "שלב 3 — סיווג העסקה ועלות הנכס החדש",
    why: "השאלה הראשונה היא אם לעסקה יש מהות מסחרית (והשווי ההוגן מהימן): אם כן — זו כמו מכירה וקנייה, והנכס החדש נמדד בשווי הוגן עם רווח או הפסד; אם לא — רק החלפנו נכס בנכס, והוא נמדד לפי הערך בספרים.",
    text: [x.commercial ? "לעסקה יש מהות מסחרית — מודדים לפי שווי הוגן (סעיפים 24–26)." : "לעסקה אין מהות מסחרית — מודדים לפי הערך בספרים (סעיף 24)."],
    calcs: third,
    entry: "exchange",
  });

  const newName = (k: number) => `שנת חיים ${k + 1} של הנכס החדש`;
  steps.push({
    id: "new",
    title: "שלב 4 — הפחת של הנכס החדש עד סוף השנה",
    why: "הנכס החדש מתחיל להיות מופחת ביום ההחלפה, לפי האומדנים שלו — לא של הישן. בשנת ההחלפה הוא מופחת רק על החודשים שנשארו.",
    text: [`הנכס החדש: עלות ${show(r.newCost)}, גרט ${show(x.newSalvage)}, ${show(x.newLife)} שנים, ${METHOD_LABEL[newMethod]}.`],
    calcs: [
      { label: "בסיס הפחת של הנכס החדש", tex: `${tx("עלות")} - ${tx("גרט")} = ${tn(r.newCost)} - ${tn(x.newSalvage)} = ${tn(r.newCost - x.newSalvage)}` },
      methodCalc(newMethod, r.newCost, x.newSalvage, x.newLife, "של הנכס החדש"),
      ...lifeYearCalcs(newMethod, r.newCost, x.newSalvage, x.newLife, r.newYears, newName),
      {
        label: `פחת ${MONTH[x.month - 1]}–דצמבר: ${r.monthsAfter} חודשים מתוך שנת החיים הראשונה`,
        tex: `${tn(r.newAnnual)} \\times \\frac{${r.monthsAfter}}{12} = ${tn(r.newDep)}`,
      },
      { label: "סך הוצאות הפחת בשנת ההחלפה — הישן ועוד החדש", tex: `${tn(r.depToDate)} + ${tn(r.newDep)} = ${tn(r.totalDep)}` },
      { label: "ערך בספרים של הנכס החדש בסוף השנה", tex: `${tn(r.newCost)} - ${tn(r.newDep)} = ${tn(r.newBookValue)}` },
    ],
    entry: "year-end",
  });

  if (r.later.length)
    steps.push({
      id: "next",
      title: "השנים הבאות — איך ממשיכים",
      why: "כל שנה נפתחת ביתרה שבה הקודמת נסגרה. כששנות החיים של הנכס החדש לא מתחילות בינואר, כל שנת כספים לוקחת חלק משתי שנות חיים — לפי מספר החודשים מכל אחת.",
      text: [],
      calcs: r.later.map((y) => {
        const parts = [y.fromPrev ? `${tn(r.newYears[y.n - 1])} \\times \\frac{${r.monthsBefore}}{12}` : "", y.fromCurr ? (mid ? `${tn(r.newYears[y.n])} \\times \\frac{${r.monthsAfter}}{12}` : tn(r.newYears[y.n])) : ""].filter(Boolean);
        return {
          label: `השנה ה-${y.n} אחרי שנת ההחלפה: יתרת פתיחה ${show(y.opening)}`,
          tex: `${tx("פחת")} = ${parts.join(" + ") || "0"} = ${tn(y.charge)}, \\quad ${tx("יתרת סגירה")} = ${tn(y.opening)} - ${tn(y.charge)} = ${tn(y.closing)}`,
          note: mid ? `${r.monthsBefore} חודשים מסוף שנת החיים ה-${y.n}${y.fromCurr ? `, ו-${r.monthsAfter} חודשים מתחילת שנת החיים ה-${y.n + 1}` : ""}.` : undefined,
        };
      }),
    });
  return steps;
}

