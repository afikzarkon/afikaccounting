/**
 * A capitalised renovation (IAS 16.12–13, 51, 61) for the learning lab.
 *
 * The asset is bought on 1 January of `firstYear`, so its life years match the
 * fiscal years until the renovation. The renovation takes place at the start of
 * a month: the old charge runs up to it, the renovation cost is added to the
 * carrying amount, and the adjusted amount is depreciated over the new
 * remaining life, less the new residual, in 12-month life years that start on
 * the renovation date and split across fiscal years.
 */

export type RenoMethod = "sl" | "syd-desc" | "syd-asc" | "db";

export const METHOD_LABEL: Record<RenoMethod, string> = {
  sl: "קו ישר",
  "syd-desc": "סכום ספרות השנים — יורד",
  "syd-asc": "סכום ספרות השנים — עולה",
  db: "יתרה פוחתת",
};

export type RenovationInputs = {
  cost: number;
  salvage: number;
  /** Original useful life, in whole years. */
  life: number;
  method: RenoMethod;
  /** Year of purchase; the asset is available for use on 1 January. */
  firstYear: number;
  renoYear: number;
  /** Month (1–12) of the renovation, at its start. */
  renoMonth: number;
  renoCost: number;
  /** Remaining useful life from the renovation date, in whole years. */
  newLife: number;
  newSalvage: number;
  newMethod: RenoMethod;
};

export type RenoRow = {
  year: number;
  opening: number;
  /** The year's charge before the renovation, and after it. */
  before: number;
  after: number;
  addition: number;
  charge: number;
  accumulated: number;
  closing: number;
};

export type RenovationResult = {
  /** Charge per life year: before the renovation, and on the adjusted amount after it. */
  oldYears: number[];
  newYears: number[];
  /** Months of the renovation year before it (the old asset's partial charge) and after it. */
  monthsBefore: number;
  monthsAfter: number;
  /** The old charge from 1 January of the renovation year up to the renovation. */
  depToDate: number;
  accumulatedAtReno: number;
  carryingAtReno: number;
  adjusted: number;
  newBase: number;
  /** Declining balance: the rates before and after; sum of years: the denominators. */
  oldRate: number | null;
  newRate: number | null;
  oldDigits: number;
  newDigits: number;
  rows: RenoRow[];
};

export const digits = (n: number) => (n * (n + 1)) / 2;

/** 1 − (salvage / cost)^(1 / life): the rate that brings cost to salvage in exactly `life` years. */
export const dbRate = (cost: number, salvage: number, life: number) => 1 - Math.pow(salvage / cost, 1 / life);

/** Charge per life year; declining balance is trued up to salvage in the last year. */
export function lifeYearCharges(method: RenoMethod, cost: number, salvage: number, life: number): number[] {
  const base = cost - salvage;
  if (method === "sl") return Array.from({ length: life }, () => base / life);
  if (method !== "db") {
    const s = digits(life);
    return Array.from({ length: life }, (_, i) => (base * (method === "syd-desc" ? life - i : i + 1)) / s);
  }
  const rate = dbRate(cost, salvage, life);
  const out: number[] = [];
  let ca = cost;
  for (let k = 0; k < life; k++) {
    const charge = k === life - 1 ? ca - salvage : ca * rate;
    out.push(charge);
    ca -= charge;
  }
  return out;
}

/** Input problems, keyed by field; empty when the renovation can be solved. */
export function renovationErrors(x: RenovationInputs): Partial<Record<keyof RenovationInputs, string>> {
  const e: Partial<Record<keyof RenovationInputs, string>> = {};
  if (!(x.cost > 0)) e.cost = "העלות חייבת להיות חיובית";
  if (!(x.salvage >= 0)) e.salvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.cost > 0 && x.salvage >= x.cost) e.salvage = "ערך הגרט חייב להיות נמוך מהעלות";
  else if (x.method === "db" && !(x.salvage > 0)) e.salvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (!Number.isInteger(x.life) || x.life < 1 || x.life > 50) e.life = "אורך חיים בשנים שלמות, 1 עד 50";
  if (!Number.isInteger(x.renoMonth) || x.renoMonth < 1 || x.renoMonth > 12) e.renoMonth = "חודש בין 1 ל-12";
  const elapsed = (x.renoYear - x.firstYear) * 12 + x.renoMonth - 1;
  if (!Number.isInteger(x.renoYear) || elapsed <= 0) e.renoYear = "השיפוץ חייב להיות אחרי מועד הרכישה";
  else if (!e.life && elapsed >= x.life * 12) e.renoYear = "השיפוץ חייב להיות לפני תום אורך החיים המקורי";
  if (!(x.renoCost > 0)) e.renoCost = "עלות השיפוץ חייבת להיות חיובית";
  if (!Number.isInteger(x.newLife) || x.newLife < 1 || x.newLife > 50) e.newLife = "יתרת אורך חיים בשנים שלמות, 1 עד 50";
  if (!(x.newSalvage >= 0)) e.newSalvage = "ערך הגרט לא יכול להיות שלילי";
  else if (x.newMethod === "db" && !(x.newSalvage > 0)) e.newSalvage = "ביתרה פוחתת צריך ערך גרט חיובי";
  if (Object.keys(e).length) return e;
  const r = solveRenovation(x);
  if (x.newSalvage >= r.adjusted) e.newSalvage = "ערך הגרט החדש חייב להיות נמוך מהערך בספרים המותאם";
  return e;
}

export function solveRenovation(x: RenovationInputs): RenovationResult {
  const oldYears = lifeYearCharges(x.method, x.cost, x.salvage, x.life);
  const fullYears = x.renoYear - x.firstYear;
  const monthsBefore = x.renoMonth - 1;
  const monthsAfter = 12 - monthsBefore;
  const depToDate = (oldYears[fullYears] * monthsBefore) / 12;
  const accumulatedAtReno = oldYears.slice(0, fullYears).reduce((s, c) => s + c, 0) + depToDate;
  const carryingAtReno = x.cost - accumulatedAtReno;
  const adjusted = carryingAtReno + x.renoCost;
  const newYears = lifeYearCharges(x.newMethod, adjusted, x.newSalvage, x.newLife);

  const rows: RenoRow[] = [];
  let acc = 0;
  for (let i = 0; i < fullYears; i++) {
    const opening = x.cost - acc;
    acc += oldYears[i];
    rows.push({ year: x.firstYear + i, opening, before: oldYears[i], after: 0, addition: 0, charge: oldYears[i], accumulated: acc, closing: x.cost - acc });
  }
  // The renovation year, then each later fiscal year: the tail of one new life year and the head of the next.
  const gross = x.cost + x.renoCost;
  const fiscalAfter = monthsBefore === 0 ? x.newLife : x.newLife + 1;
  for (let t = 0; t < fiscalAfter; t++) {
    const before = t === 0 ? depToDate : 0;
    const prev = newYears[t - 1];
    const curr = newYears[t];
    const after = (t === 0 ? 0 : monthsBefore > 0 && prev !== undefined ? (prev * monthsBefore) / 12 : 0) + (curr !== undefined ? (curr * monthsAfter) / 12 : 0);
    const opening = t === 0 ? x.cost - acc : gross - acc;
    acc += before + after;
    rows.push({
      year: x.renoYear + t,
      opening,
      before,
      after,
      addition: t === 0 ? x.renoCost : 0,
      charge: before + after,
      accumulated: acc,
      closing: gross - acc,
    });
  }

  return {
    oldYears,
    newYears,
    monthsBefore,
    monthsAfter,
    depToDate,
    accumulatedAtReno,
    carryingAtReno,
    adjusted,
    newBase: adjusted - x.newSalvage,
    oldRate: x.method === "db" ? dbRate(x.cost, x.salvage, x.life) : null,
    newRate: x.newMethod === "db" ? dbRate(adjusted, x.newSalvage, x.newLife) : null,
    oldDigits: digits(x.life),
    newDigits: digits(x.newLife),
    rows,
  };
}

// ---------------------------------------------------------------------------
// The working, step by step, for someone who has never solved one.

/** One operation: what is computed, then the formula in words, the numbers in it, and the result — as TeX. */
export type RenoCalc = { label: string; tex: string; note?: string };
export type RenoStep = {
  id: string;
  title: string;
  /** Why this step is done, in a sentence. */
  why: string;
  text: string[];
  calcs: RenoCalc[];
  /** The journal entry this step ends with, if any. */
  entry?: "catch-up" | "capitalise" | "year-end";
  table?: { head: string[]; rows: string[][] };
};

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
export const show = (v: number) => nf.format(Math.round(v * 100) / 100);
export const tn = (v: number) => show(v).replace(/,/g, "{,}");
export const tx = (s: string) => `\\text{${s}}`;
export const MONTH = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const pct = (v: number) => `${(v * 100).toFixed(2)}\\%`;

/** The charge of each life year as an equation, by the method: what the year's figure is made of. */
export function lifeYearCalcs(method: RenoMethod, cost: number, salvage: number, life: number, charges: number[], name: (k: number) => string, upTo = life): RenoCalc[] {
  const base = cost - salvage;
  const out: RenoCalc[] = [];
  let opening = cost;
  for (let k = 0; k < upTo; k++) {
    const c = charges[k];
    if (method === "sl") out.push({ label: name(k), tex: `${tx("פחת")} = \\frac{${tx("עלות")} - ${tx("גרט")}}{${tx("אורך חיים")}} = \\frac{${tn(cost)} - ${tn(salvage)}}{${life}} = ${tn(c)}` });
    else if (method === "db")
      out.push(
        k === life - 1
          ? { label: name(k), tex: `${tx("פחת")} = ${tx("יתרה בתחילת השנה")} - ${tx("גרט")} = ${tn(opening)} - ${tn(salvage)} = ${tn(c)}`, note: "בשנה האחרונה מורידים בדיוק עד הגרט." }
          : { label: name(k), tex: `${tx("פחת")} = ${tx("יתרה בתחילת השנה")} \\times ${tx("שיעור")} = ${tn(opening)} \\times ${pct(dbRate(cost, salvage, life))} = ${tn(c)}` },
      );
    else {
      const w = method === "syd-desc" ? life - k : k + 1;
      out.push({ label: name(k), tex: `${tx("פחת")} = (${tx("עלות")} - ${tx("גרט")}) \\times \\frac{${tx("משקל השנה")}}{${tx("סכום הספרות")}} = ${tn(base)} \\times \\frac{${w}}{${digits(life)}} = ${tn(c)}` });
    }
    opening -= c;
  }
  return out;
}

/** What a method needs before any year can be worked: the annual charge, the sum of the digits, or the rate. */
export function methodCalc(method: RenoMethod, cost: number, salvage: number, life: number, when: string): RenoCalc {
  if (method === "sl")
    return { label: `פחת שנתי ${when}`, tex: `\\frac{${tx("עלות")} - ${tx("גרט")}}{${tx("אורך חיים")}} = \\frac{${tn(cost)} - ${tn(salvage)}}{${life}} = ${tn((cost - salvage) / life)}`, note: "בקו ישר כל שנה מקבלת אותו פחת." };
  if (method === "db")
    return {
      label: `שיעור הפחת ${when}`,
      tex: `1 - \\left(\\frac{${tx("גרט")}}{${tx("עלות")}}\\right)^{\\frac{1}{${tx("שנים")}}} = 1 - \\left(\\frac{${tn(salvage)}}{${tn(cost)}}\\right)^{\\frac{1}{${life}}} = ${pct(dbRate(cost, salvage, life))}`,
      note: "השיעור הזה מוריד את העלות בדיוק עד הגרט בסוף אורך החיים. כל שנה מכפילים אותו ביתרה של תחילת השנה.",
    };
  return {
    label: `סכום ספרות השנים ${when}`,
    tex: `\\frac{n \\times (n + 1)}{2} = \\frac{${life} \\times ${life + 1}}{2} = ${digits(life)}`,
    note: method === "syd-desc" ? `לשנה הראשונה המשקל הגדול (${life}), ולאחרונה הקטן (1).` : `לשנה הראשונה המשקל הקטן (1), ולאחרונה הגדול (${life}).`,
  };
}

export function explainRenovation(x: RenovationInputs, r: RenovationResult): RenoStep[] {
  const fullYears = x.renoYear - x.firstYear;
  const mid = r.monthsBefore > 0;
  const renoDate = `1.${x.renoMonth}.${x.renoYear}`;
  const steps: RenoStep[] = [];
  const elapsedYears = fullYears + r.monthsBefore / 12;

  steps.push({
    id: "date",
    title: "שלב 1 — זיהוי תאריך השיפוץ",
    why: "התאריך מחלק את חיי הנכס לשניים: עד השיפוץ מחשבים לפי הנתונים המקוריים, ומהשיפוץ — לפי החדשים. לכן קודם קובעים איפה הוא נופל.",
    text: [
      `הנכס נקנה ב-1.1.${x.firstYear} והשיפוץ היה ב-${renoDate}.`,
      fullYears > 0 ? `עד שנת השיפוץ עברו ${fullYears} שנים מלאות (${x.firstYear}–${x.renoYear - 1}).` : "השיפוץ היה כבר בשנה הראשונה.",
      mid
        ? `השיפוץ באמצע השנה: ${MONTH[0]}–${MONTH[x.renoMonth - 2]} (${r.monthsBefore} חודשים) לפי הנתונים המקוריים, ו${MONTH[x.renoMonth - 1]}–דצמבר (${r.monthsAfter} חודשים) לפי החדשים.`
        : "השיפוץ בתחילת השנה: כל השנה הזו כבר לפי הנתונים החדשים, ואין פחת יחסי לפניו.",
    ],
    calcs: [],
  });

  const oldName = (k: number) => `שנת ${x.firstYear + k} (שנת חיים ${k + 1})`;
  steps.push({
    id: "before",
    title: "שלב 2 — הפחת עד תאריך השיפוץ",
    why: "לפני שמוסיפים את השיפוץ צריך לדעת כמה הנכס שווה בספרים באותו יום. לכן מחשבים את כל הפחת עד השיפוץ — כולל החודשים של שנת השיפוץ שלפניו.",
    text: [`הפחת לפני השיפוץ לפי הנתונים המקוריים: עלות ${show(x.cost)}, גרט ${show(x.salvage)}, ${x.life} שנים, ${METHOD_LABEL[x.method]}.`],
    calcs: [
      methodCalc(x.method, x.cost, x.salvage, x.life, "לפי הנתונים המקוריים"),
      ...lifeYearCalcs(x.method, x.cost, x.salvage, x.life, r.oldYears, oldName, fullYears),
      ...(mid
        ? [
            {
              label: `${MONTH[0]}–${MONTH[x.renoMonth - 2]} ${x.renoYear}: רק ${r.monthsBefore} חודשים מתוך שנת החיים ה-${fullYears + 1}`,
              tex: `${tx("פחת השנה המלאה")} \\times \\frac{${tx("חודשים")}}{12} = ${tn(r.oldYears[fullYears])} \\times \\frac{${r.monthsBefore}}{12} = ${tn(r.depToDate)}`,
              note: "זה הפחת שנרשם בפקודה שלפני השיפוץ (\"פחת עד יום השיפוץ\").",
            },
          ]
        : []),
      {
        label: "פחת נצבר ליום השיפוץ — מחברים את כל הפחת עד כאן",
        tex: `${[...r.oldYears.slice(0, fullYears).map(tn), ...(mid ? [tn(r.depToDate)] : [])].join(" + ") || "0"} = ${tn(r.accumulatedAtReno)}`,
      },
      { label: "ערך בספרים ליום השיפוץ", tex: `${tx("עלות")} - ${tx("פחת נצבר")} = ${tn(x.cost)} - ${tn(r.accumulatedAtReno)} = ${tn(r.carryingAtReno)}` },
    ],
    entry: mid ? "catch-up" : undefined,
  });

  steps.push({
    id: "add",
    title: "שלב 3 — מוסיפים את עלות השיפוץ",
    why: "שיפוץ ששיפר את הנכס או האריך את חייו הוא חלק מהנכס, לא הוצאה של השנה (סעיפים 7, 12–13). לכן עלותו מתווספת לערך בספרים — והסכום החדש הוא מה שנפחית מכאן והלאה.",
    text: [`בספרים: העלות גדלה ל-${show(x.cost + x.renoCost)} (${show(x.cost)} + ${show(x.renoCost)}), והפחת הנצבר נשאר ${show(r.accumulatedAtReno)}.`],
    calcs: [
      {
        label: "ערך בספרים מותאם — הבסיס לכל החישוב מכאן והלאה",
        tex: `${tx("ערך בספרים ביום השיפוץ")} + ${tx("עלות השיפוץ")} = ${tn(r.carryingAtReno)} + ${tn(x.renoCost)} = ${tn(r.adjusted)}`,
      },
    ],
    entry: "capitalise",
  });

  const remainingOld = Math.max(0, x.life - elapsedYears);
  steps.push({
    id: "estimates",
    title: "שלב 4 — מה השתנה באומדנים",
    why: "אחרי שיפוץ בודקים מחדש את שלושת האומדנים — כמה זמן הנכס עוד ישמש, כמה יהיה שווה בסוף, ובאיזו שיטה מפחיתים. שינוי בהם הוא שינוי אומדן: לא מתקנים אחורה, רק מכאן ולהבא.",
    text: [],
    calcs: [],
    table: {
      head: ["אומדן", "לפני השיפוץ", "אחרי השיפוץ"],
      rows: [
        ["יתרת אורך חיים", `${show(remainingOld)} שנים (${x.life} − ${show(elapsedYears)})`, `${x.newLife} שנים`],
        ["ערך גרט", show(x.salvage), show(x.newSalvage)],
        ["שיטת פחת", METHOD_LABEL[x.method], METHOD_LABEL[x.newMethod]],
      ],
    },
  });

  const lastMonth = MONTH[(x.renoMonth + 10) % 12];
  const newName = (k: number) => `שנת חיים ${k + 1} מיום השיפוץ (${MONTH[x.renoMonth - 1]} ${x.renoYear + k} – ${lastMonth} ${x.renoYear + k + (mid ? 1 : 0)})`;
  const renoRow = r.rows.find((row) => row.year === x.renoYear)!;
  steps.push({
    id: "after",
    title: "שלב 5 — הפחת מיום השיפוץ ואילך",
    why: "מכאן מפחיתים את הערך המותאם, פחות הגרט החדש, על פני יתרת אורך החיים החדשה. שנות החיים מתחילות ביום השיפוץ — ולכן שנת חיים יכולה להתפצל בין שתי שנות כספים.",
    text: [`בסיס הפחת החדש מתחלק לפי ${METHOD_LABEL[x.newMethod]}. אלה הסכומים לכל שנת חיים מיום השיפוץ:`],
    calcs: [
      { label: "בסיס הפחת החדש", tex: `${tx("ערך מותאם")} - ${tx("גרט חדש")} = ${tn(r.adjusted)} - ${tn(x.newSalvage)} = ${tn(r.newBase)}` },
      methodCalc(x.newMethod, r.adjusted, x.newSalvage, x.newLife, "החדש"),
      ...lifeYearCalcs(x.newMethod, r.adjusted, x.newSalvage, x.newLife, r.newYears, newName),
      ...(mid
        ? [
            { label: `פחת ${MONTH[x.renoMonth - 1]}–דצמבר ${x.renoYear}: ${r.monthsAfter} חודשים מתוך שנת החיים החדשה הראשונה`, tex: `${tn(r.newYears[0])} \\times \\frac{${r.monthsAfter}}{12} = ${tn(renoRow.after)}` },
            { label: `סך הפחת בשנת ${x.renoYear} — לפני השיפוץ ועוד אחריו`, tex: `${tn(renoRow.before)} + ${tn(renoRow.after)} = ${tn(renoRow.charge)}` },
          ]
        : [{ label: `סך הפחת בשנת ${x.renoYear} — שנת החיים החדשה הראשונה כולה`, tex: tn(renoRow.charge) }]),
    ],
    entry: "year-end",
  });

  // The later years: each fiscal year takes the tail of one new life year and the head of the next.
  const later = r.rows.filter((row) => row.year > x.renoYear);
  if (later.length)
    steps.push({
      id: "next",
      title: "השנים הבאות — איך ממשיכים",
      why: "כל שנה נפתחת ביתרה שבה הקודמת נסגרה. כששנות החיים לא מתחילות בינואר, כל שנת כספים לוקחת חלק משתי שנות חיים — לפי מספר החודשים מכל אחת.",
      text: [],
      calcs: later.map((row) => {
        const t = row.year - x.renoYear;
        const prev = r.newYears[t - 1];
        const curr = r.newYears[t];
        const parts = mid
          ? [prev !== undefined ? `${tn(prev)} \\times \\frac{${r.monthsBefore}}{12}` : "", curr !== undefined ? `${tn(curr)} \\times \\frac{${r.monthsAfter}}{12}` : ""].filter(Boolean)
          : [tn(curr ?? 0)];
        return {
          label: `שנת ${row.year}: יתרת פתיחה ${show(row.opening)}`,
          tex: `${tx("פחת")} = ${parts.join(" + ")} = ${tn(row.charge)}, \\quad ${tx("יתרת סגירה")} = ${tn(row.opening)} - ${tn(row.charge)} = ${tn(row.closing)}`,
          note: mid ? `${r.monthsBefore} חודשים מסוף שנת החיים ה-${t}${curr !== undefined ? `, ו-${r.monthsAfter} חודשים מתחילת שנת החיים ה-${t + 1}` : ""}.` : undefined,
        };
      }),
    });
  return steps;
}
