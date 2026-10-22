import { CURRENCIES, money } from "../format";
import { depreciationSeries, entry, round2, sum } from "../math";
import type { Calculator, Guidance, JournalEntry, ScheduleRow, Solution, Values } from "../types";
import { bool, num, str } from "../validate";

type Method = "straight-line" | "double-declining" | "sum-of-years";

const METHOD_LABEL: Record<Method, string> = {
  "straight-line": "הקו הישר",
  "double-declining": "היתרה הפוחתת הכפולה",
  "sum-of-years": "סכום ספרות השנים",
};

const cost = (v: Values) => num(v, "purchasePrice") + num(v, "attributableCosts") - num(v, "discounts");

/** The revision path only applies when its toggle is visible: straight-line, no components. */
const revises = (v: Values) => bool(v, "revision") && str(v, "method") === "straight-line" && !bool(v, "component");

/**
 * Dates are reduced to whole months, counted from year 0: depreciation runs for
 * a month when the asset is in use for most of it, so a date after the 15th
 * starts the following month (31/03 → April, 01/07 → July).
 */
const monthIndex = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return y * 12 + (m - 1) + (d > 15 ? 1 : 0);
};
const fmtDate = (iso: string) => iso.split("-").reverse().join("/");
/** Last day of the month before month index `i`, as dd/mm/yyyy. */
const dayBefore = (i: number) => fmtDate(new Date(Date.UTC(Math.floor(i / 12), i % 12, 0)).toISOString().slice(0, 10));
const overlap = (from: number, to: number, start: number, end: number) => Math.max(0, Math.min(to, end) - Math.max(from, start));

export const ias16Ppe: Calculator = {
  slug: "ias-16-property-plant-equipment",
  standard: "IAS 16",
  title: "רכוש קבוע",
  tagline: "עלות, פחת לפי רכיבים וטיפול בהחלפת רכיב.",
  description:
    "בניית לוח פחת לנכס ולרכיביו המשמעותיים, וטיפול בהחלפת רכיב — גריעת החלק הישן והכרה בעלות החלק החדש.",
  category: "נכסים לא שוטפים",
  icon: "Factory",
  accent: "amber",
  explainerSlug: "ias-16-components-and-replacements",
  scenario: [
    { kind: "select", id: "currency", label: "מטבע הדיווח", options: CURRENCIES, default: "ILS" },
    {
      kind: "radio",
      id: "method",
      label: "שיטת הפחת",
      options: [
        { value: "straight-line", label: "קו ישר", description: "הוצאה שווה בכל שנה." },
        { value: "double-declining", label: "יתרה פוחתת כפולה", description: "מואצת, עם מעבר לקו ישר." },
        { value: "sum-of-years", label: "סכום ספרות השנים", description: "מואצת, פוחתת באופן ליניארי." },
      ],
      default: "straight-line",
      videoAt: 402,
    },
    {
      kind: "toggle",
      id: "component",
      label: "לנכס יש רכיב משמעותי בעל אורך חיים שימושיים שונה",
      help: "לדוגמה מנוע מטוס, גג של בניין או ציפוי של כבשן.",
      default: true,
      videoAt: 186,
    },
    {
      kind: "toggle",
      id: "replacement",
      label: "הרכיב מוחלף במהלך חיי הנכס",
      default: true,
      showIf: [{ field: "component", in: [true] }],
      videoAt: 655,
    },
    {
      kind: "toggle",
      id: "revision",
      label: "שיפוץ או שינוי אומדן לאחר ההכרה לראשונה",
      help: "עלות נוספת שמהוונת לנכס והארכת אורך החיים השימושיים — הפחת מחושב מחדש ממועד השיפוץ והלאה, לפי שנות כספים.",
      default: false,
      showIf: [
        { field: "method", in: ["straight-line"] },
        { field: "component", in: [false] },
      ],
    },
  ],
  metrics: [
    { kind: "number", id: "purchasePrice", label: "מחיר הרכישה", unit: "currency", default: 2400000, min: 0.01, required: true },
    {
      kind: "number",
      id: "attributableCosts",
      label: "עלויות הניתנות לייחוס ישיר",
      help: "הובלה, התקנה, הכנת האתר, שכר טרחה מקצועי.",
      unit: "currency",
      default: 100000,
      min: 0,
    },
    { kind: "number", id: "discounts", label: "הנחות מסחריות והחזרים", unit: "currency", default: 0, min: 0 },
    { kind: "number", id: "residual", label: "ערך שייר", unit: "currency", default: 250000, min: 0 },
    { kind: "number", id: "usefulLife", label: "אורך החיים השימושיים של הנכס", unit: "years", default: 15, min: 1, max: 100, integer: true, required: true },
    {
      kind: "number",
      id: "componentCost",
      label: "העלות שהוקצתה לרכיב",
      unit: "currency",
      default: 400000,
      min: 0.01,
      showIf: [{ field: "component", in: [true] }],
    },
    {
      kind: "number",
      id: "componentLife",
      label: "אורך החיים השימושיים של הרכיב",
      unit: "years",
      default: 6,
      min: 1,
      max: 100,
      integer: true,
      showIf: [{ field: "component", in: [true] }],
    },
    {
      kind: "number",
      id: "replacementYear",
      label: "הוחלף בתום שנה",
      unit: "years",
      default: 5,
      min: 1,
      max: 99,
      integer: true,
      showIf: [
        { field: "component", in: [true] },
        { field: "replacement", in: [true] },
      ],
    },
    {
      kind: "number",
      id: "replacementCost",
      label: "עלות הרכיב המחליף",
      unit: "currency",
      default: 520000,
      min: 0.01,
      showIf: [
        { field: "component", in: [true] },
        { field: "replacement", in: [true] },
      ],
    },
    {
      kind: "date",
      id: "acquisitionDate",
      label: "מועד הרכישה וההפעלה",
      help: "הפחת מתחיל כשהנכס זמין לשימוש. שנת הכספים מסתיימת ב-31/12.",
      default: "2023-03-31",
      showIf: [{ field: "revision", in: [true] }],
    },
    {
      kind: "date",
      id: "revisionDate",
      label: "מועד השיפוץ",
      default: "2025-07-01",
      showIf: [{ field: "revision", in: [true] }],
    },
    {
      kind: "number",
      id: "revisionCost",
      label: "עלות השיפוץ שהוונה",
      help: "0 אם יש רק שינוי באומדן אורך החיים.",
      unit: "currency",
      default: 10000,
      min: 0,
      showIf: [{ field: "revision", in: [true] }],
    },
    {
      kind: "number",
      id: "lifeExtension",
      label: "תוספת לאורך החיים השימושיים",
      help: "מעבר ליתרת אורך החיים המקורית, החל ממועד השיפוץ.",
      unit: "years",
      default: 2,
      min: 0,
      max: 100,
      showIf: [{ field: "revision", in: [true] }],
    },
  ],

  validate(v) {
    const errors: Record<string, string> = {};
    const total = cost(v);
    if (total <= 0) errors.discounts = "ההנחות אינן יכולות לעלות על מחיר הרכישה והעלויות.";
    if (num(v, "residual") >= total) errors.residual = "ערך השייר חייב להיות נמוך מהעלות.";
    if (bool(v, "component")) {
      if (num(v, "componentCost") > total - num(v, "residual")) {
        errors.componentCost = "עלות הרכיב אינה יכולה לעלות על הסכום בר-הפחת של הנכס.";
      }
      if (num(v, "componentLife") > num(v, "usefulLife")) {
        errors.componentLife = "אורך חייו של רכיב אינו יכול לעלות על זה של הנכס שאליו הוא שייך.";
      }
      if (bool(v, "replacement") && num(v, "replacementYear") >= num(v, "usefulLife")) {
        errors.replacementYear = "ההחלפה חייבת להתבצע לפני תום חיי הנכס.";
      }
    }
    if (revises(v)) {
      const start = monthIndex(str(v, "acquisitionDate"));
      const at = monthIndex(str(v, "revisionDate"));
      if (at <= start) errors.revisionDate = "מועד השיפוץ חייב להיות אחרי מועד תחילת הפחת.";
      else if (at >= start + num(v, "usefulLife") * 12) errors.revisionDate = "מועד השיפוץ חייב להיות לפני תום אורך החיים המקורי.";
    }
    return errors;
  },

  solve(v) {
    if (revises(v)) return solveRevision(v);
    const currency = str(v, "currency");
    const fmt = (n: number) => money(n, currency);
    const method = str(v, "method") as Method;
    const life = num(v, "usefulLife");
    const residual = num(v, "residual");
    const totalCost = round2(cost(v));
    const hasComponent = bool(v, "component");
    const replaces = hasComponent && bool(v, "replacement");

    const compCost = hasComponent ? num(v, "componentCost") : 0;
    const compLife = hasComponent ? num(v, "componentLife") : 0;
    const R = replaces ? num(v, "replacementYear") : Infinity;
    const newCost = replaces ? num(v, "replacementCost") : 0;
    const newLife = replaces ? Math.min(compLife, life - R) : 0;

    const bodyCost = round2(totalCost - compCost);
    const bodyDep = depreciationSeries(bodyCost, residual, life, method);
    const oldDep = hasComponent ? depreciationSeries(compCost, 0, compLife, method) : [];
    const newDep = replaces ? depreciationSeries(newCost, 0, newLife, method) : [];

    let gross = totalCost;
    let accumulated = 0;
    let oldAccumulated = 0;
    let loss = 0;
    let replacementSnapshot: { opening: number; dep: number; closing: number } | null = null;

    const rows: ScheduleRow[] = [];
    for (let y = 1; y <= life; y++) {
      const openingCarrying = round2(gross - accumulated);
      const body = bodyDep[y - 1] ?? 0;
      let comp = 0;
      if (y <= R) {
        comp = oldDep[y - 1] ?? 0;
        oldAccumulated = round2(oldAccumulated + comp);
      } else {
        comp = newDep[y - R - 1] ?? 0;
      }
      const total = round2(body + comp);
      accumulated = round2(accumulated + total);

      let event: string | null = null;
      if (y === R) {
        loss = round2(compCost - oldAccumulated);
        gross = round2(gross - compCost + newCost);
        accumulated = round2(accumulated - oldAccumulated);
        event = loss > 0 ? `הרכיב הוחלף · הפסד ${fmt(loss)}` : "הרכיב הוחלף (מופחת במלואו)";
        replacementSnapshot = { opening: openingCarrying, dep: total, closing: round2(gross - accumulated) };
      } else if (hasComponent && !replaces && y === compLife + 1 && compLife < life) {
        event = "הרכיב מופחת במלואו";
      }

      rows.push({
        period: `שנה ${y}`,
        body,
        component: hasComponent ? comp : null,
        total,
        gross,
        accumulated,
        carrying: round2(gross - accumulated),
        event,
        _emphasis: y === R ? "event" : null,
      });
    }

    const y1 = rows[0];
    const totalDep = round2(sum(rows.map((r) => Number(r.total))));

    const journal: JournalEntry[] = [
      entry("acquisition", "רכישה", "הכרה לראשונה לפי עלות", [
        [hasComponent ? "רכוש קבוע — מבנה עיקרי" : "רכוש קבוע", bodyCost],
        ["רכוש קבוע — רכיב", compCost],
        ["מזומנים / ספקים", -totalCost],
      ]),
      entry("y1-depreciation", "שנה 1", `פחת לשנה (שיטת ${METHOD_LABEL[method]})`, [
        ["הוצאות פחת", Number(y1.total)],
        ["פחת שנצבר", -Number(y1.total)],
      ]),
    ];
    if (replaces) {
      journal.push(
        entry("derecognition", `תום שנה ${R}`, "גריעת הרכיב שהוחלף", [
          ["פחת שנצבר — רכיב", oldAccumulated],
          ["הפסד מגריעת רכוש קבוע", loss],
          ["רכוש קבוע — רכיב", -compCost],
        ]),
        entry("replacement", `תום שנה ${R}`, "היוון עלות הרכיב המחליף", [
          ["רכוש קבוע — רכיב", newCost],
          ["מזומנים / ספקים", -newCost],
        ]),
      );
    }

    const guidance: Guidance[] = [
      {
        title: "מדידה לפי עלות",
        body: `העלות כוללת את מחיר הרכישה בניכוי הנחות מסחריות והחזרים, בתוספת עלויות הניתנות לייחוס ישיר להבאת הנכס למיקום ולמצב הדרושים לכך שיוכל לפעול באופן שהתכוונה ההנהלה. כאן: ${fmt(num(v, "purchasePrice"))} + ${fmt(num(v, "attributableCosts"))} − ${fmt(num(v, "discounts"))} = ${fmt(totalCost)}.`,
        reference: "IAS 16.15–17, 20",
      },
      {
        title: "הסכום בר-הפחת ושיטת הפחת",
        body: `הסכום בר-הפחת (עלות בניכוי ערך שייר, ${fmt(totalCost - residual)}) מוקצה על בסיס שיטתי על פני אורך החיים השימושיים. שיטת ${METHOD_LABEL[method]} צריכה לשקף את הדפוס שבו ההטבות הכלכליות נצרכות; ערך השייר, אורך החיים השימושיים ושיטת הפחת נבחנים לפחות בסוף כל שנת כספים.`,
        reference: "IAS 16.50–51, 60–62",
      },
    ];
    if (hasComponent) {
      guidance.push({
        title: "גישת הרכיבים",
        body: `כל חלק שעלותו משמעותית ביחס לעלות הכוללת ואורך חייו השימושיים שונה מופחת בנפרד. הרכיב (${fmt(compCost)}, ${compLife} שנים) מופחת בנפרד מהמבנה העיקרי (${fmt(bodyCost)}, ${life} שנים).`,
        reference: "IAS 16.43–47",
      });
    }
    if (replaces) {
      guidance.push(
        {
          title: "החלפת חלק",
          body: `עלות ההחלפה (${fmt(newCost)}) מוכרת בערך בספרים מאחר שהיא עומדת בקריטריונים להכרה, והערך בספרים של החלק המוחלף נגרע. הרכיב החדש מופחת על פני ${newLife} שנים — הקצר מבין אורך חייו ויתרת חיי הנכס.`,
          reference: "IAS 16.7, 13, 70",
        },
        {
          title: "הפסד מגריעה",
          body:
            loss > 0
              ? `לרכיב הישן נותר ערך בספרים של ${fmt(loss)} במועד ההחלפה. סכום זה מוכר ברווח או הפסד כהפסד — אין לקזזו מעלות הרכיב החדש, ורווחים לא היו מסווגים כהכנסות.`
              : "הרכיב הישן היה מופחת במלואו במועד ההחלפה, ולכן לגריעה אין השפעה על הרווח או ההפסד.",
          reference: "IAS 16.67–68, 71",
        },
      );
    } else if (hasComponent && compLife < life) {
      guidance.push({
        title: "הרכיב מגיע לסוף חייו",
        body: `הרכיב מופחת במלואו לאחר ${compLife} שנים. אם הוא מוחלף, יש לסמן החלפה כדי להכיר בחלק החדש ולגרוע את הישן.`,
        reference: "IAS 16.13",
      });
    }
    guidance.push({
      title: "תחזוקה שוטפת",
      body: "עלויות התחזוקה השוטפת (עבודה, חומרים מתכלים, חלקים קטנים) אינן מהוונות — הן מוכרות ברווח או הפסד עם התהוותן.",
      reference: "IAS 16.12",
    });

    const y1Closing = Number(y1.carrying);
    const disclosure = [
      "באור X — רכוש קבוע",
      "",
      "מדיניות חשבונאית",
      `רכוש קבוע נמדד לפי עלות בניכוי פחת שנצבר והפסדים מירידת ערך. הפחת מחושב לפי שיטת ${METHOD_LABEL[method]} על פני אורך החיים השימושיים של הנכס (${life} שנים)${hasComponent ? `; רכיבים משמעותיים מופחתים בנפרד על פני אורך חייהם השימושיים (${compLife} שנים)` : ""}. ערכי השייר, אורך החיים השימושיים ושיטות הפחת נבחנים בכל תאריך דיווח.`,
      "",
      "התאמת הערך בספרים — שנה 1",
      `ערך בספרים לתחילת השנה: ${fmt(0)}`,
      `תוספות: ${fmt(totalCost)}`,
      `פחת: (${fmt(Number(y1.total))})`,
      `ערך בספרים לסוף השנה: ${fmt(y1Closing)}`,
      `  עלות: ${fmt(totalCost)}`,
      `  פחת שנצבר: (${fmt(Number(y1.accumulated))})`,
      ...(replaces && replacementSnapshot
        ? [
            "",
            `התאמת הערך בספרים — שנה ${R}`,
            `ערך בספרים לתחילת השנה: ${fmt(replacementSnapshot.opening)}`,
            `תוספות (רכיב מחליף): ${fmt(newCost)}`,
            `גריעת הרכיב שהוחלף: (${fmt(loss)})`,
            `פחת: (${fmt(replacementSnapshot.dep)})`,
            `ערך בספרים לסוף השנה: ${fmt(replacementSnapshot.closing)}`,
          ]
        : []),
    ].join("\n");

    return {
      headline: `עלות ${fmt(totalCost)} · פחת בשנה 1 ${fmt(Number(y1.total))}`,
      outcome: "recognised",
      metrics: [
        { label: "עלות במועד ההכרה", value: totalCost, format: "currency" },
        { label: "סכום בר-פחת", value: round2(totalCost - residual), format: "currency" },
        { label: "פחת בשנה 1", value: Number(y1.total), format: "currency" },
        { label: "ערך בספרים בתום שנה 1", value: y1Closing, format: "currency" },
        ...(replaces ? [{ label: `הפסד מהחלפה (שנה ${R})`, value: loss, format: "currency" as const }] : []),
        { label: "סך הפחת על פני החיים", value: totalDep, format: "currency" },
      ],
      journal,
      tables: [
        {
          id: "depreciation",
          title: "לוח פחת",
          caption: `${METHOD_LABEL[method]} · אורך חיים ${life} שנים · ערך שייר ${fmt(residual)}`,
          columns: [
            { key: "period", label: "שנה", format: "text" },
            { key: "body", label: hasComponent ? "מבנה עיקרי" : "פחת" },
            ...(hasComponent ? [{ key: "component", label: "רכיב" }] : []),
            { key: "total", label: "סך הפחת" },
            { key: "gross", label: "עלות" },
            { key: "accumulated", label: "פחת שנצבר" },
            { key: "carrying", label: "ערך בספרים" },
            { key: "event", label: "אירוע", format: "text" as const },
          ],
          rows,
          totals: { period: "סה\"כ", body: round2(sum(bodyDep)), component: hasComponent ? round2(sum(rows.map((r) => Number(r.component ?? 0)))) : null, total: totalDep, gross: null, accumulated: null, carrying: null, event: null },
        },
      ],
      disclosure,
      guidance,
      assumptions: [
        "הנכס נרכש בתחילת שנה 1 והפחת מתחיל מיד (הנכס זמין לשימוש).",
        "לרכיב אין ערך שייר; ערך השייר שייך למבנה העיקרי.",
        ...(replaces ? ["ההחלפה מוכרת בתום שנת ההחלפה, לאחר רישום הפחת של אותה שנה."] : []),
      ],
    };
  },
};

/**
 * Straight-line asset with a later capitalised renovation and a revised useful
 * life (IAS 16.51 / IAS 8.36): the carrying amount at the renovation date plus
 * the renovation cost is depreciated over the revised remaining life. Periods
 * are calendar fiscal years, prorated by month.
 */
function solveRevision(v: Values): Solution {
  const currency = str(v, "currency");
  const fmt = (n: number) => money(n, currency);
  const residual = num(v, "residual");
  const totalCost = round2(cost(v));
  const life = num(v, "usefulLife");
  const revisionCost = num(v, "revisionCost");
  const acquired = str(v, "acquisitionDate");
  const revised = str(v, "revisionDate");

  const start = monthIndex(acquired);
  const at = monthIndex(revised);
  const end = start + life * 12 + Math.round(num(v, "lifeExtension") * 12);
  const monthsBefore = at - start;
  const monthsAfter = end - at;
  const remainingYears = round2(monthsAfter / 12);

  // Cumulative amounts are rounded, not monthly ones, so each phase totals exactly.
  const depreciable = round2(totalCost - residual);
  const before = (m: number) => round2((depreciable * m) / (life * 12));
  const accumulatedAtRevision = before(monthsBefore);
  const carryingAtRevision = round2(totalCost - accumulatedAtRevision);
  const newBase = round2(carryingAtRevision + revisionCost);
  const newDepreciable = round2(newBase - residual);
  const after = (m: number) => round2((newDepreciable * m) / monthsAfter);
  const annualBefore = round2(depreciable / life);
  const annualAfter = round2(newDepreciable / (monthsAfter / 12));

  const firstYear = Math.floor(start / 12);
  const lastYear = Math.floor((end - 1) / 12);
  const revisionYear = Math.floor(at / 12);
  const endDate = dayBefore(end);

  const rows: ScheduleRow[] = [];
  const journal: JournalEntry[] = [
    entry("acquisition", fmtDate(acquired), "הכרה לראשונה לפי עלות (מחיר רכישה ועלויות ישירות)", [
      ["רכוש קבוע", totalCost],
      ["מזומנים / ספקים", -totalCost],
    ]),
  ];
  let doneBefore = 0;
  let doneAfter = 0;
  let gross = totalCost;
  let accumulated = 0;
  let revisionOpening = 0;

  for (let year = firstYear; year <= lastYear; year++) {
    const from = year * 12;
    const mBefore = overlap(start, at, from, from + 12);
    const mAfter = overlap(at, end, from, from + 12);
    const dBefore = round2(before(doneBefore + mBefore) - before(doneBefore));
    const dAfter = round2(after(doneAfter + mAfter) - after(doneAfter));
    doneBefore += mBefore;
    doneAfter += mAfter;
    const yearEnd = `31/12/${year}`;

    let event: string | null = null;
    if (year === revisionYear) {
      revisionOpening = round2(gross - accumulated);
      gross = round2(gross + revisionCost);
      event = `שיפוץ ${fmtDate(revised)} · יתרת חיים ${remainingYears} שנים`;
      if (dBefore > 0) {
        journal.push(
          entry(`dep-${year}-before`, dayBefore(at), `פחת עד מועד השיפוץ (${mBefore} חודשים, אומדן מקורי)`, [
            ["הוצאות פחת", dBefore],
            ["פחת שנצבר", -dBefore],
          ]),
        );
      }
      if (revisionCost > 0) {
        journal.push(
          entry("revision", fmtDate(revised), "היוון עלות השיפוץ לנכס", [
            ["רכוש קבוע", revisionCost],
            ["מזומנים / ספקים", -revisionCost],
          ]),
        );
      }
      if (dAfter > 0) {
        journal.push(
          entry(`dep-${year}-after`, yearEnd, `פחת ממועד השיפוץ (${mAfter} חודשים, אומדן מעודכן)`, [
            ["הוצאות פחת", dAfter],
            ["פחת שנצבר", -dAfter],
          ]),
        );
      }
    } else {
      if (year === lastYear) event = `תום אורך החיים ${endDate}`;
      journal.push(
        entry(`dep-${year}`, yearEnd, `פחת לשנה (${mBefore + mAfter} חודשים)`, [
          ["הוצאות פחת", dBefore + dAfter],
          ["פחת שנצבר", -(dBefore + dAfter)],
        ]),
      );
    }
    accumulated = round2(accumulated + dBefore + dAfter);

    rows.push({
      period: String(year),
      months: mBefore + mAfter,
      before: dBefore,
      after: dAfter,
      total: round2(dBefore + dAfter),
      gross,
      accumulated,
      carrying: round2(gross - accumulated),
      event,
      _emphasis: year === revisionYear ? "event" : null,
    });
  }

  const totalDep = round2(sum(rows.map((r) => Number(r.total))));
  const revisionRow = rows.find((r) => r.period === String(revisionYear))!;
  const byYear = (key: string, sign = 1) =>
    Object.fromEntries(rows.map((r) => [`y${r.period}`, round2(sign * Number(r[key]))]));
  const yearColumns = rows.map((r) => ({ key: `y${r.period}`, label: `31/12/${r.period}` }));

  return {
    headline: `ערך בספרים במועד השיפוץ ${fmt(carryingAtRevision)} · בסיס פחת חדש ${fmt(newDepreciable)} על פני ${remainingYears} שנים (${fmt(annualAfter)} לשנה)`,
    outcome: "recognised",
    metrics: [
      { label: "עלות במועד ההכרה", value: totalCost, format: "currency" },
      { label: "פחת שנצבר עד השיפוץ", value: accumulatedAtRevision, format: "currency", hint: `${monthsBefore} חודשים × ${fmt(annualBefore)} לשנה` },
      { label: "ערך בספרים במועד השיפוץ", value: carryingAtRevision, format: "currency" },
      { label: "ערך בספרים לאחר היוון השיפוץ", value: newBase, format: "currency" },
      { label: "יתרת אורך חיים מעודכנת (שנים)", value: remainingYears, format: "number" },
      { label: "פחת שנתי מעודכן", value: annualAfter, format: "currency" },
    ],
    journal,
    tables: [
      {
        id: "depreciation",
        title: "לוח פחת לפי שנות כספים",
        caption: `קו ישר · ${fmtDate(acquired)} עד ${endDate} · ערך שייר ${fmt(residual)}`,
        columns: [
          { key: "period", label: "שנה", format: "text" },
          { key: "months", label: "חודשי פחת", format: "number" },
          { key: "before", label: "פחת — אומדן מקורי" },
          { key: "after", label: "פחת — אומדן מעודכן" },
          { key: "total", label: "סך הפחת" },
          { key: "gross", label: "עלות" },
          { key: "accumulated", label: "פחת שנצבר" },
          { key: "carrying", label: "ערך בספרים" },
          { key: "event", label: "אירוע", format: "text" },
        ],
        rows,
        totals: {
          period: "סה\"כ",
          months: doneBefore + doneAfter,
          before: accumulatedAtRevision,
          after: newDepreciable,
          total: totalDep,
          gross: null,
          accumulated: null,
          carrying: null,
          event: null,
        },
      },
      {
        id: "balance-sheet",
        title: "מאזן — רכוש קבוע",
        caption: "יתרות לסוף כל שנת כספים",
        columns: [{ key: "item", label: "סעיף", format: "text" }, ...yearColumns],
        rows: [
          { item: "עלות", ...byYear("gross") },
          { item: "בניכוי פחת שנצבר", ...byYear("accumulated", -1) },
          { item: "רכוש קבוע, נטו", ...byYear("carrying"), _emphasis: "total" },
        ],
      },
      {
        id: "profit-or-loss",
        title: "דוח רווח והפסד — השפעת הנכס",
        caption: "הוצאות הפחת לכל שנת כספים",
        columns: [{ key: "item", label: "סעיף", format: "text" }, ...yearColumns],
        rows: [
          { item: "פחת לפי האומדן המקורי", ...byYear("before", -1) },
          { item: "פחת לפי האומדן המעודכן", ...byYear("after", -1) },
          { item: "סך הוצאות הפחת", ...byYear("total", -1), _emphasis: "total" },
        ],
      },
    ],
    disclosure: [
      "באור X — רכוש קבוע",
      "",
      "מדיניות חשבונאית",
      "רכוש קבוע נמדד לפי עלות בניכוי פחת שנצבר והפסדים מירידת ערך. הפחת מחושב לפי שיטת הקו הישר מהמועד שבו הנכס זמין לשימוש. ערכי השייר ואורך החיים השימושיים נבחנים בכל תאריך דיווח.",
      "",
      "שינוי באומדן",
      `ביום ${fmtDate(revised)} שופץ הנכס בעלות של ${fmt(revisionCost)}, ואורך חייו השימושיים עודכן כך שיתרתו ${remainingYears} שנים (עד ${endDate}). השינוי טופל בדרך של מכאן ולהבא: הפחת השנתי השתנה מ-${fmt(annualBefore)} ל-${fmt(annualAfter)}.`,
      "",
      `התאמת הערך בספרים — ${revisionYear}`,
      `ערך בספרים לתחילת השנה: ${fmt(revisionOpening)}`,
      `תוספות (שיפוץ): ${fmt(revisionCost)}`,
      `פחת: (${fmt(Number(revisionRow.total))})`,
      `ערך בספרים לסוף השנה: ${fmt(Number(revisionRow.carrying))}`,
      `  עלות: ${fmt(Number(revisionRow.gross))}`,
      `  פחת שנצבר: (${fmt(Number(revisionRow.accumulated))})`,
    ].join("\n"),
    guidance: [
      {
        title: "מדידה לפי עלות",
        body: `העלות כוללת את מחיר הרכישה ועלויות הניתנות לייחוס ישיר, כגון הובלה: ${fmt(num(v, "purchasePrice"))} + ${fmt(num(v, "attributableCosts"))} − ${fmt(num(v, "discounts"))} = ${fmt(totalCost)}.`,
        reference: "IAS 16.16–17",
      },
      {
        title: "תחילת הפחת",
        body: `הפחת מתחיל כשהנכס זמין לשימוש (${fmtDate(acquired)}). עד השיפוץ מופחת הסכום בר-הפחת (${fmt(depreciable)}) על פני ${life} שנים — ${fmt(annualBefore)} לשנה, ובסך הכול ${fmt(accumulatedAtRevision)} ל-${monthsBefore} חודשים.`,
        reference: "IAS 16.50, 55",
      },
      {
        title: "היוון עלות השיפוץ",
        body: `עלות שיפוץ שמאריך את חיי הנכס או משפר אותו עומדת בקריטריונים להכרה ומתווספת לערך בספרים: ${fmt(carryingAtRevision)} + ${fmt(revisionCost)} = ${fmt(newBase)}. תחזוקה שוטפת, לעומת זאת, נזקפת לרווח או הפסד.`,
        reference: "IAS 16.7, 10–12",
      },
      {
        title: "שינוי אומדן — מכאן ולהבא",
        body: `שינוי באורך החיים השימושיים הוא שינוי באומדן חשבונאי, ולכן אין הצגה מחדש של תקופות קודמות. הערך בספרים החדש בניכוי ערך השייר (${fmt(newDepreciable)}) מופחת על פני יתרת החיים המעודכנת — ${remainingYears} שנים.`,
        reference: "IAS 16.51; IAS 8.36–38",
      },
    ],
    assumptions: [
      "שנת הכספים מסתיימת ב-31/12; פקודות הפחת נרשמות בסוף כל שנה ובמועד השיפוץ.",
      "הפחת מחושב לפי חודשים שלמים; מועד שחל אחרי ה-15 בחודש מעוגל לתחילת החודש הבא.",
      "ערך השייר אינו משתנה בעקבות השיפוץ.",
      "עלות השיפוץ עומדת בקריטריונים להכרה כנכס ואינה תחזוקה שוטפת.",
    ],
  };
}
