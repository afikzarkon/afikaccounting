import { CURRENCIES, money } from "../format";
import { depreciationSeries, entry, round2, sum } from "../math";
import type { Calculator, Guidance, JournalEntry, ScheduleRow, Values } from "../types";
import { bool, num, str } from "../validate";
import { METHOD_LABEL, timelineErrors, solveTimeline, type PpeMethod } from "./ias16-timeline";

/** Methods the yearly component solver supports. */
type Method = Exclude<PpeMethod, "units">;

const cost = (v: Values) => num(v, "purchasePrice") + num(v, "attributableCosts") - num(v, "discounts");

const timeline = [{ field: "component", in: [false] }];
const whenTimeline = (...more: { field: string; in: (string | boolean)[] }[]) => [...timeline, ...more];

export const ias16Ppe: Calculator = {
  slug: "ias-16-property-plant-equipment",
  standard: "IAS 16",
  title: "רכוש קבוע",
  tagline: "עלות, פחת בארבע שיטות, שיפוץ, הערכה מחדש והחלפת נכסים — לפי תאריכים.",
  description:
    "לוח פחת חודשי לפי שנות כספים בטווח תאריכים לבחירה: מודל העלות או ההערכה מחדש, קו ישר, סכום ספרות, יתרה פוחתת או יחידות תפוקה, שיפוץ ושינוי אומדן, ירידת ערך והחלפת נכסים — עם פקודות יומן, מאזן ודוח רווח והפסד.",
  category: "נכסים לא שוטפים",
  icon: "Factory",
  accent: "amber",
  explainerSlug: "ias-16-components-and-replacements",
  scenario: [
    { kind: "select", id: "currency", label: "מטבע הדיווח", options: CURRENCIES, default: "ILS" },
    {
      kind: "radio",
      id: "model",
      label: "מודל המדידה לאחר ההכרה",
      options: [
        { value: "cost", label: "מודל העלות", description: "עלות בניכוי פחת שנצבר וירידת ערך." },
        { value: "revaluation", label: "מודל ההערכה מחדש", description: "שווי הוגן בתאריך ההערכה בניכוי פחת שנצבר מאז." },
      ],
      default: "cost",
      showIf: timeline,
    },
    {
      kind: "radio",
      id: "method",
      label: "שיטת הפחת",
      options: [
        { value: "straight-line", label: "קו ישר", description: "הוצאה שווה בכל חודש." },
        { value: "sum-of-years", label: "סכום ספרות השנים", description: "מואצת, פוחתת באופן ליניארי." },
        { value: "double-declining", label: "יתרה פוחתת כפולה", description: "שיעור קבוע על היתרה, עם מעבר לקו ישר." },
        { value: "units", label: "יחידות תפוקה", description: "לפי השימוש בפועל בכל שנה." },
      ],
      default: "straight-line",
      videoAt: 402,
    },
    {
      kind: "toggle",
      id: "transferSurplus",
      label: "העברה שוטפת של קרן ההערכה מחדש לעודפים",
      help: "בגובה החלק שמומש בשימוש בנכס. אם לא — הקרן מועברת רק בגריעה.",
      default: true,
      showIf: whenTimeline({ field: "model", in: ["revaluation"] }),
    },
    {
      kind: "toggle",
      id: "revision",
      label: "שיפוץ או שיפור מהותי במהלך חיי הנכס",
      help: "עלות נוספת שמהוונת לנכס, עם שינוי אפשרי באורך החיים ובערך השייר — הפחת מחושב מחדש ממועד השיפוץ.",
      default: false,
      showIf: timeline,
    },
    {
      kind: "toggle",
      id: "exchange",
      label: "החלפת הנכס בנכס אחר (Trade-in)",
      default: false,
      showIf: timeline,
    },
    {
      kind: "toggle",
      id: "commercialSubstance",
      label: "לעסקת ההחלפה יש מהות מסחרית",
      help: "תזרימי המזומנים הצפויים מהנכס שהתקבל שונים באופן משמעותי מאלה של הנכס שנמסר, והשווי ההוגן ניתן למדידה מהימנה.",
      default: true,
      showIf: whenTimeline({ field: "exchange", in: [true] }),
    },
    {
      kind: "radio",
      id: "exchangeBasis",
      label: "לפי איזה שווי הוגן נמדד הנכס שהתקבל",
      options: [
        { value: "given", label: "הנכס שנמסר", description: "ברירת המחדל לפי התקן, בתוספת או בניכוי מזומן." },
        { value: "received", label: "הנכס שהתקבל", description: "כשהשווי ההוגן שלו מהימן יותר." },
      ],
      default: "given",
      showIf: whenTimeline({ field: "exchange", in: [true] }, { field: "commercialSubstance", in: [true] }),
    },
    {
      kind: "radio",
      id: "cashDirection",
      label: "מזומן בעסקת ההחלפה",
      options: [
        { value: "none", label: "ללא מזומן" },
        { value: "paid", label: "שילמנו מזומן" },
        { value: "received", label: "קיבלנו מזומן" },
      ],
      default: "paid",
      showIf: whenTimeline({ field: "exchange", in: [true] }),
    },
    {
      kind: "toggle",
      id: "component",
      label: "גישת הרכיבים (מתקדם): לנכס רכיב משמעותי בעל אורך חיים שונה",
      help: "לוח שנתי בשנים שלמות, במודל העלות. לדוגמה מנוע מטוס או גג של בניין.",
      default: false,
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
  ],
  metrics: [
    {
      kind: "date",
      id: "acquisitionDate",
      label: "מועד זמינות לשימוש (הפעלה)",
      help: "הפחת מתחיל כשהנכס זמין לשימוש. שנת הכספים מסתיימת ב-31/12.",
      default: "2023-03-31",
      showIf: timeline,
    },
    { kind: "date", id: "calcStart", label: "תחילת טווח החישוב", default: "2023-03-31", showIf: timeline },
    {
      kind: "date",
      id: "calcEnd",
      label: "סיום טווח החישוב",
      help: "עד איזה תאריך להציג את הלוח, הדוחות והפקודות.",
      default: "2031-12-31",
      showIf: timeline,
    },
    { kind: "number", id: "purchasePrice", label: "עלות ראשונית (מחיר הרכישה)", unit: "currency", default: 100000, min: 0.01, required: true },
    {
      kind: "number",
      id: "attributableCosts",
      label: "עלויות המיוחסות במישרין",
      help: "הובלה, התקנה, הרצה, הכנת האתר, שכר טרחה מקצועי.",
      unit: "currency",
      default: 20000,
      min: 0,
    },
    { kind: "number", id: "discounts", label: "הנחות מסחריות והחזרים", unit: "currency", default: 0, min: 0 },
    { kind: "number", id: "residual", label: "ערך שייר (גרט)", unit: "currency", default: 10000, min: 0 },
    { kind: "number", id: "usefulLife", label: "אורך החיים השימושיים — שנים", unit: "years", default: 6, min: 0, max: 100, integer: true, required: true },
    {
      kind: "number",
      id: "lifeMonths",
      label: "אורך החיים השימושיים — חודשים נוספים",
      unit: "count",
      default: 0,
      min: 0,
      max: 11,
      integer: true,
      showIf: timeline,
    },
    {
      kind: "number",
      id: "totalUnits",
      label: "סך יחידות התפוקה הצפויות",
      unit: "count",
      default: 60000,
      min: 1,
      showIf: whenTimeline({ field: "method", in: ["units"] }),
    },
    {
      kind: "series",
      id: "unitsByYear",
      label: "יחידות שהופקו בכל שנת כספים",
      help: "מספר לכל שנה, מהשנה הראשונה, מופרדים בפסיקים. לשנים שלא הוזנו מחולקות היחידות שנותרו באופן שווה.",
      default: "6000, 11000, 10000, 9000, 9000, 8000, 7000",
      showIf: whenTimeline({ field: "method", in: ["units"] }),
    },
    {
      kind: "series",
      id: "fairValues",
      label: "שווי הוגן לסוף כל שנת כספים",
      help: "ערך לכל 31/12, מהשנה הראשונה, מופרדים בפסיקים. השאירו ריק (\"100000, , 80000\") לשנה ללא הערכה.",
      default: "100000, , 70000",
      placeholder: "100000, , 70000",
      showIf: whenTimeline({ field: "model", in: ["revaluation"] }),
    },
    {
      kind: "series",
      id: "recoverableAmounts",
      label: "סכום בר-השבה לסוף שנה (בדיקת ירידת ערך, רשות)",
      help: "ערך לכל 31/12 שבו נבחנה ירידת ערך, מופרדים בפסיקים. ריק — ללא בדיקה.",
      default: "",
      placeholder: "90000, , 60000",
      showIf: whenTimeline({ field: "model", in: ["cost"] }),
    },
    {
      kind: "date",
      id: "revisionDate",
      label: "מועד השיפוץ",
      default: "2025-07-01",
      showIf: whenTimeline({ field: "revision", in: [true] }),
    },
    {
      kind: "number",
      id: "revisionCost",
      label: "עלות השיפוץ המהוונת",
      help: "0 אם יש רק שינוי באומדן.",
      unit: "currency",
      default: 10000,
      min: 0,
      showIf: whenTimeline({ field: "revision", in: [true] }),
    },
    {
      kind: "number",
      id: "lifeExtension",
      label: "תוספת לאורך החיים השימושיים",
      help: "מעבר ליתרת אורך החיים המקורית, ממועד השיפוץ. אפשר שבר (1.5) או מספר שלילי לקיצור.",
      unit: "years",
      default: 2,
      min: -100,
      max: 100,
      showIf: whenTimeline({ field: "revision", in: [true] }),
    },
    {
      kind: "number",
      id: "revisedResidual",
      label: "ערך שייר לאחר השיפוץ",
      unit: "currency",
      default: 10000,
      min: 0,
      showIf: whenTimeline({ field: "revision", in: [true] }),
    },
    {
      kind: "number",
      id: "extraUnits",
      label: "תוספת ליחידות התפוקה הצפויות בעקבות השיפוץ",
      unit: "count",
      default: 20000,
      min: 0,
      showIf: whenTimeline({ field: "revision", in: [true] }, { field: "method", in: ["units"] }),
    },
    {
      kind: "date",
      id: "exchangeDate",
      label: "מועד עסקת ההחלפה",
      default: "2027-12-31",
      showIf: whenTimeline({ field: "exchange", in: [true] }),
    },
    {
      kind: "number",
      id: "fvGiven",
      label: "שווי הוגן של הנכס שנמסר",
      unit: "currency",
      default: 50000,
      min: 0,
      showIf: whenTimeline({ field: "exchange", in: [true] }, { field: "commercialSubstance", in: [true] }),
    },
    {
      kind: "number",
      id: "fvReceived",
      label: "שווי הוגן של הנכס שהתקבל",
      unit: "currency",
      default: 55000,
      min: 0,
      showIf: whenTimeline({ field: "exchange", in: [true] }, { field: "commercialSubstance", in: [true] }),
    },
    {
      kind: "number",
      id: "cashAmount",
      label: "סכום המזומן",
      unit: "currency",
      default: 5000,
      min: 0,
      showIf: whenTimeline({ field: "exchange", in: [true] }, { field: "cashDirection", in: ["paid", "received"] }),
    },
    {
      kind: "number",
      id: "componentCost",
      label: "העלות שהוקצתה לרכיב",
      unit: "currency",
      default: 30000,
      min: 0.01,
      showIf: [{ field: "component", in: [true] }],
    },
    {
      kind: "number",
      id: "componentLife",
      label: "אורך החיים השימושיים של הרכיב",
      unit: "years",
      default: 3,
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
      default: 3,
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
      default: 36000,
      min: 0.01,
      showIf: [
        { field: "component", in: [true] },
        { field: "replacement", in: [true] },
      ],
    },
  ],

  validate(v) {
    const errors: Record<string, string> = {};
    const total = cost(v);
    if (total <= 0) errors.discounts = "ההנחות אינן יכולות לעלות על מחיר הרכישה והעלויות.";
    if (num(v, "residual") >= total) errors.residual = "ערך השייר חייב להיות נמוך מהעלות.";
    if (bool(v, "component")) {
      if (str(v, "method") === "units") errors.method = "גישת הרכיבים זמינה בקו ישר ובשיטות המואצות בלבד.";
      if (num(v, "usefulLife") < 1) errors.usefulLife = "אורך החיים חייב להיות לפחות שנה אחת.";
      if (num(v, "componentCost") > total - num(v, "residual")) {
        errors.componentCost = "עלות הרכיב אינה יכולה לעלות על הסכום בר-הפחת של הנכס.";
      }
      if (num(v, "componentLife") > num(v, "usefulLife")) {
        errors.componentLife = "אורך חייו של רכיב אינו יכול לעלות על זה של הנכס שאליו הוא שייך.";
      }
      if (bool(v, "replacement") && num(v, "replacementYear") >= num(v, "usefulLife")) {
        errors.replacementYear = "ההחלפה חייבת להתבצע לפני תום חיי הנכס.";
      }
    } else if (Object.keys(errors).length === 0) {
      Object.assign(errors, timelineErrors(v));
    }
    return errors;
  },

  solve(v) {
    if (!bool(v, "component")) return solveTimeline(v);
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
