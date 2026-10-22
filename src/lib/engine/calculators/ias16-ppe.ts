import { money, plain } from "../format";
import { round2 } from "../math";
import type { Calculator, Condition, Values } from "../types";
import { isIsoDate, isVisible, parseDatedValues, SOLVE_MODE, UNKNOWN } from "../validate";
import { DATED_TARGETS, SOLVABLE_LABEL, solveForX, YEAR_TARGETS } from "./ias16-solver";
import { solveTimeline, timelineErrors } from "./ias16-timeline";

const events = (...more: Condition[]) => [{ field: "hasEvents", in: [true] }, ...more];
const solving: Condition[] = [{ field: SOLVE_MODE, in: ["solve"] }];
const TARGET = "נתוני עזר לשחזור X";

const MODE = "סוג השאלה";
const EVENTS = "זיהוי אירועים";
const RANGE = "תאריכים וטווח החישוב";
const COST = "עלות הנכס";
const LAND = "מרכיב הקרקע";
const DEPRECIATION = "פחת ומודל המדידה";
const RENOVATION = "שיפוץ / שיפור מהותי";
const REVALUATION = "הערכה מחדש";
const EXCHANGE = "החלפת נכס (Trade-in)";

/** Every value starts empty or unselected: the user enters each figure and makes each choice. */
export const ias16Ppe: Calculator = {
  slug: "ias-16-property-plant-equipment",
  standard: "IAS 16",
  title: "רכוש קבוע",
  tagline: "הנחות בסיס, אירועים במהלך התקופה, ופתרון מלא שנה אחר שנה.",
  description:
    "מזינים הנחות בסיס, מסמנים אירועים (שיפוץ, הערכה מחדש, החלפת נכס), ומקבלים לכל שנה: פקודות יומן, דרך החישוב בנוסחאות, מאזן, רווח והפסד — והנחיה איך ממשיכים לשנה הבאה.",
  category: "נכסים לא שוטפים",
  icon: "Factory",
  accent: "amber",
  explainerSlug: "ias-16-components-and-replacements",
  sectionIcons: {
    [MODE]: "CircleHelp",
    [RANGE]: "CalendarRange",
    [COST]: "Coins",
    [LAND]: "LandPlot",
    [DEPRECIATION]: "TrendingDown",
    [EVENTS]: "Search",
    [RENOVATION]: "Hammer",
    [REVALUATION]: "TrendingUp",
    [EXCHANGE]: "ArrowLeftRight",
    [TARGET]: "Search",
  },
  steps: {
    scenario: {
      title: "שלב 1 — הנחות בסיס",
      short: "הנחות בסיס",
      intro: "תאריך הפעלה, טווח החישוב, עלות, ערך שייר, אורך חיים, שיטת הפחת ומודל המדידה.",
    },
    metrics: {
      title: "שלב 2 — אירועים במהלך התקופה",
      short: "אירועים",
      intro: "האם במהלך טווח השנים שנבחר התרחש אירוע חשבונאי הדורש עדכון? סמנו כל אירוע והזינו את נתוניו.",
    },
  },
  scenario: [
    {
      kind: "radio",
      id: SOLVE_MODE,
      label: "בחרו את סוג החישוב",
      options: [
        { value: "regular", label: "חישוב רגיל", description: "כל הנתונים ידועים." },
        { value: "solve", label: "חישוב עם נעלם (Solve for X)", description: "שחזור נתון חסר מתוך תוצאה ידועה: סמנו X ליד השדה החסר." },
      ],
      default: "regular",
      display: "segmented",
      section: MODE,
    },
    {
      kind: "date",
      id: "acquisitionDate",
      label: "מועד זמינות לשימוש (הפעלה)",
      help: "הפחת מתחיל כשהנכס זמין לשימוש. שנת הכספים מסתיימת ב-31/12.",
      default: "",
      section: RANGE,
    },
    { kind: "date", id: "calcStart", label: "תחילת טווח החישוב", default: "", section: RANGE },
    { kind: "date", id: "calcEnd", label: "סיום טווח החישוב", help: "עד איזה תאריך להציג את הפתרון.", default: "", section: RANGE },
    { kind: "number", id: "purchasePrice", label: "עלות ראשונית (מחיר הרכישה)", unit: "currency", default: "", min: 0.01, section: COST, solvable: true },
    {
      kind: "number",
      id: "attributableCosts",
      solvable: true,
      label: "עלויות המיוחסות במישרין",
      help: "להבאת הנכס למיקום ולמצב הפעלה: הובלה, התקנה, הרצה, הכנת האתר. 0 אם אין.",
      unit: "currency",
      default: "",
      min: 0,
      section: COST,
    },
    {
      kind: "number",
      id: "residual",
      label: "ערך שייר (גרט)",
      help: "0 אם אין. כשיש קרקע — ערך השייר של המבנה.",
      unit: "currency",
      default: "",
      min: 0,
      section: COST,
      solvable: true,
    },
    {
      kind: "toggle",
      id: "hasLand",
      label: "הנכס כולל מרכיב קרקע (למשל מבנה או מחסן)",
      help: "הקרקע נפרדת מהמבנה ואינה מופחתת (IAS 16.58).",
      default: false,
      section: LAND,
    },
    {
      kind: "radio",
      id: "landBasis",
      label: "איך נתון מרכיב הקרקע",
      options: [
        { value: "percent", label: "אחוז מהנכס הכולל" },
        { value: "amount", label: "סכום בש״ח" },
      ],
      default: "",
      showIf: [{ field: "hasLand", in: [true] }],
      section: LAND,
    },
    {
      kind: "number",
      id: "landPercent",
      label: "אחוז מרכיב הקרקע מהנכס הכולל",
      help: "מפצל את העלות, וגם כל שווי הוגן בהערכה מחדש.",
      unit: "percent",
      default: "",
      min: 0.01,
      max: 99.99,
      showIf: [
        { field: "hasLand", in: [true] },
        { field: "landBasis", in: ["percent"] },
      ],
      section: LAND,
    },
    {
      kind: "number",
      id: "landAmount",
      label: "עלות הקרקע",
      help: "היחס בין הקרקע לעלות הכוללת מפצל גם כל שווי הוגן בהערכה מחדש.",
      unit: "currency",
      default: "",
      min: 0.01,
      showIf: [
        { field: "hasLand", in: [true] },
        { field: "landBasis", in: ["amount"] },
      ],
      section: LAND,
    },
    { kind: "number", id: "usefulLife", label: "אורך חיים שימושיים מקורי", unit: "years", default: "", min: 0.1, max: 100, section: DEPRECIATION, solvable: true },
    {
      kind: "radio",
      id: "method",
      label: "שיטת הפחת",
      options: [
        { value: "straight-line", label: "קו ישר", description: "הוצאה שווה בכל חודש." },
        { value: "sum-of-years", label: "סכום ספרות השנים (יורד)", description: "מואצת, פוחתת באופן ליניארי." },
        { value: "double-declining", label: "יתרה פוחתת כפולה", description: "שיעור קבוע על היתרה, עם מעבר לקו ישר." },
        { value: "units", label: "יחידות תפוקה", description: "לפי השימוש בפועל בכל שנה." },
      ],
      default: "",
      videoAt: 402,
      section: DEPRECIATION,
    },
    {
      kind: "number",
      id: "totalUnits",
      label: "סך יחידות התפוקה הצפויות",
      unit: "count",
      default: "",
      min: 1,
      showIf: [{ field: "method", in: ["units"] }],
      section: DEPRECIATION,
    },
    {
      kind: "series",
      id: "unitsByYear",
      label: "יחידות שהופקו בכל שנת כספים",
      help: "מספר לכל שנה, מהשנה הראשונה, מופרדים בפסיקים. לשנים שלא הוזנו מחולקות היחידות שנותרו באופן שווה.",
      default: "",
      placeholder: "6000, 11000, 10000",
      showIf: [{ field: "method", in: ["units"] }],
      section: DEPRECIATION,
    },
    {
      kind: "radio",
      id: "model",
      label: "מודל המדידה לאחר ההכרה",
      options: [
        { value: "cost", label: "מודל העלות", description: "עלות בניכוי פחת שנצבר." },
        { value: "revaluation", label: "מודל ההערכה מחדש", description: "שווי הוגן במועד ההערכה בניכוי פחת שנצבר מאז." },
      ],
      default: "",
      section: DEPRECIATION,
    },
  ],
  metrics: [
    {
      kind: "toggle",
      id: "hasEvents",
      label: "האם במהלך טווח השנים שנבחרו התרחש אירוע חשבונאי הדורש עדכון?",
      help: "שיפוץ, הערכה מחדש, החלפת נכס וכדומה.",
      default: false,
      section: EVENTS,
    },
    { kind: "toggle", id: "revision", label: "שיפוץ / שיפור מהותי", default: false, showIf: events(), section: EVENTS },
    {
      kind: "toggle",
      id: "revalue",
      label: "הערכה מחדש לשווי הוגן",
      default: false,
      showIf: events({ field: "model", in: ["revaluation"] }),
      section: EVENTS,
    },
    { kind: "toggle", id: "exchange", label: "החלפת נכס (Trade-in)", default: false, showIf: events(), section: EVENTS },

    { kind: "date", id: "revisionDate", label: "תאריך השיפוץ", default: "", showIf: events({ field: "revision", in: [true] }), section: RENOVATION },
    {
      kind: "number",
      id: "revisionCost",
      solvable: true,
      label: "עלות השיפוץ המהוונת",
      help: "0 אם יש רק שינוי באומדן.",
      unit: "currency",
      default: "",
      min: 0,
      showIf: events({ field: "revision", in: [true] }),
      section: RENOVATION,
    },
    {
      kind: "number",
      id: "lifeExtension",
      solvable: true,
      label: "שינוי באורך החיים",
      help: "תוספת ליתרת אורך החיים המקורית, ממועד השיפוץ. 0 אם אין; מספר שלילי לקיצור.",
      unit: "years",
      default: "",
      min: -100,
      max: 100,
      showIf: events({ field: "revision", in: [true] }),
      section: RENOVATION,
    },
    {
      kind: "number",
      id: "revisedResidual",
      solvable: true,
      label: "ערך שייר מתוקן",
      unit: "currency",
      default: "",
      min: 0,
      showIf: events({ field: "revision", in: [true] }),
      section: RENOVATION,
    },
    {
      kind: "number",
      id: "extraUnits",
      label: "תוספת ליחידות התפוקה הצפויות",
      help: "0 אם אין.",
      unit: "count",
      default: "",
      min: 0,
      showIf: events({ field: "revision", in: [true] }, { field: "method", in: ["units"] }),
      section: RENOVATION,
    },

    {
      kind: "dated-values",
      id: "fairValues",
      solvable: true,
      label: "שווי הוגן לפי תאריך הערכה",
      help: "הוסיפו שורה לכל מועד הערכה: התאריך (למשל 31/12) והשווי ההוגן באותו יום. כשיש קרקע — אפשר לציין בכל שורה את חלקה (למשל 35% או 500000); ריק = לפי חלק הקרקע ברכישה.",
      valueLabel: "שווי הוגן",
      addLabel: "הוספת מועד הערכה",
      note: {
        label: "קרקע (רשות): % או ₪",
        placeholder: "לפי הרכישה",
        showIf: [{ field: "hasLand", in: [true] }],
      },
      default: "",
      showIf: events({ field: "model", in: ["revaluation"] }, { field: "revalue", in: [true] }),
      section: REVALUATION,
    },
    {
      kind: "radio",
      id: "surplusTransfer",
      label: "העברה מקרן ההערכה מחדש לעודפים",
      options: [
        { value: "depreciation", label: "באופן שוטף, בקצב הפחת", description: "בכל תקופה — הפרש הפחת בין השווי המשוערך לעלות ההיסטורית." },
        { value: "disposal", label: "בעת מימוש בלבד", description: "כל הקרן מועברת כשהנכס נגרע." },
      ],
      default: "",
      showIf: events({ field: "model", in: ["revaluation"] }, { field: "revalue", in: [true] }),
      section: REVALUATION,
    },

    { kind: "date", id: "exchangeDate", label: "תאריך העסקה", default: "", showIf: events({ field: "exchange", in: [true] }), section: EXCHANGE },
    {
      kind: "radio",
      id: "cashDirection",
      label: "מזומן בעסקה",
      options: [
        { value: "none", label: "ללא מזומן" },
        { value: "paid", label: "שילמנו מזומן" },
        { value: "received", label: "קיבלנו מזומן" },
      ],
      default: "",
      showIf: events({ field: "exchange", in: [true] }),
      section: EXCHANGE,
    },
    {
      kind: "number",
      id: "cashAmount",
      label: "סכום המזומן",
      unit: "currency",
      default: "",
      min: 0,
      showIf: events({ field: "exchange", in: [true] }, { field: "cashDirection", in: ["paid", "received"] }),
      section: EXCHANGE,
    },
    {
      kind: "toggle",
      id: "commercialSubstance",
      label: "לעסקה יש מהות מסחרית (Commercial Substance)",
      help: "תזרימי המזומנים הצפויים מהנכס שהתקבל שונים באופן משמעותי מאלה של הנכס שנמסר. אם לא — הנכס נמדד לפי הערך בספרים.",
      default: false,
      showIf: events({ field: "exchange", in: [true] }),
      section: EXCHANGE,
    },
    {
      kind: "toggle",
      id: "fvGivenKnown",
      label: "השווי ההוגן של הנכס שנמסר (הישן) ידוע",
      help: "IAS 16.26: השווי ההוגן של הנכס שנמסר משמש למדידה, אלא אם השווי של הנכס שהתקבל ברור יותר.",
      default: false,
      showIf: events({ field: "exchange", in: [true] }, { field: "commercialSubstance", in: [true] }),
      section: EXCHANGE,
    },
    {
      kind: "number",
      id: "fvGiven",
      solvable: true,
      label: "שווי הוגן של הנכס שנמסר",
      unit: "currency",
      default: "",
      min: 0,
      showIf: events({ field: "exchange", in: [true] }, { field: "commercialSubstance", in: [true] }),
      disabledIf: [{ field: "fvGivenKnown", in: [false] }],
      disabledHint: "השווי ההוגן של הנכס שנמסר אינו ידוע — המדידה לפי השווי של הנכס שהתקבל.",
      section: EXCHANGE,
    },
    {
      kind: "number",
      id: "fvReceived",
      solvable: true,
      label: "שווי הוגן של הנכס שהתקבל",
      unit: "currency",
      default: "",
      min: 0,
      showIf: events({ field: "exchange", in: [true] }, { field: "commercialSubstance", in: [true] }),
      disabledIf: [{ field: "fvGivenKnown", in: [true] }],
      disabledHint: "לא בשימוש: IAS 16.26 מעדיף את השווי ההוגן של הנכס שנמסר כשהוא ידוע.",
      section: EXCHANGE,
    },
    {
      kind: "number",
      id: "newAssetLife",
      label: "אורך החיים של הנכס שהתקבל",
      help: "לחישוב הפחת של הנכס החדש בשנה שאחרי ההחלפה, באותה שיטת פחת.",
      unit: "years",
      default: "",
      min: 0.1,
      max: 100,
      showIf: events({ field: "exchange", in: [true] }),
      section: EXCHANGE,
    },
    {
      kind: "number",
      id: "newAssetResidual",
      label: "ערך שייר של הנכס שהתקבל",
      unit: "currency",
      default: "",
      min: 0,
      showIf: events({ field: "exchange", in: [true] }),
      section: EXCHANGE,
    },

    {
      kind: "select",
      id: UNKNOWN,
      label: "הנעלם (X)",
      help: "אפשר גם לסמן X בכפתור שליד השדה עצמו. בשווי הוגן — השורה שהשארתם בלי סכום.",
      options: [{ value: "", label: "— בחרו —" }, ...Object.entries(SOLVABLE_LABEL).map(([value, label]) => ({ value, label }))],
      default: "",
      showIf: solving,
      section: TARGET,
    },
    {
      kind: "radio",
      id: "targetKind",
      label: "הנתון הידוע בשאלה",
      options: [
        { value: "carrying", label: "יתרה בספרים בתאריך" },
        { value: "depreciation", label: "הוצאות פחת בשנה" },
        { value: "accumulated", label: "פחת שנצבר בתאריך" },
        { value: "exchangeGain", label: "רווח / הפסד מהחלפה" },
        { value: "transfer", label: "העברה לעודפים בשנה" },
        { value: "surplus", label: "קרן הערכה מחדש בתאריך" },
        { value: "buildingSurplus", label: "קרן הערכה מחדש בגין המבנה בתאריך" },
        { value: "landSurplus", label: "קרן הערכה מחדש בגין הקרקע בתאריך" },
      ],
      default: "",
      showIf: solving,
      section: TARGET,
    },
    {
      kind: "date",
      id: "targetDate",
      label: "בתאריך",
      default: "",
      showIf: [...solving, { field: "targetKind", in: DATED_TARGETS }],
      section: TARGET,
    },
    {
      kind: "number",
      id: "targetYear",
      label: "בשנת",
      unit: "count",
      default: "",
      min: 1900,
      max: 2200,
      integer: true,
      showIf: [...solving, { field: "targetKind", in: YEAR_TARGETS }],
      section: TARGET,
    },
    {
      kind: "number",
      id: "targetAmount",
      label: "הסכום הידוע",
      help: "הפסד מהחלפה — בסימן מינוס.",
      unit: "currency",
      default: "",
      min: -1e12,
      showIf: solving,
      section: TARGET,
    },
  ],

  validate(v) {
    if (v[SOLVE_MODE] === "solve") {
      const rowsError = unknownFairValueRows(v);
      if (rowsError) return { fairValues: rowsError };
      const field = [...ias16Ppe.scenario, ...ias16Ppe.metrics].find((f) => f.id === v[UNKNOWN]);
      if (field && !isVisible(field, v)) return { [UNKNOWN]: "השדה שסומן כנעלם אינו חלק מהתרחיש שהוגדר." };
      const solved = solveForX(v);
      if (!solved.ok) return { [solved.field]: solved.error };
      v = solved.values;
    }
    return timelineErrors(v);
  },

  solve(v) {
    if (v[SOLVE_MODE] !== "solve") return solveTimeline(v);
    const solved = solveForX(v);
    if (!solved.ok) throw new Error(solved.error);
    const s = solveTimeline(solved.values);
    const shown = solved.years ? `${plain(round2(solved.x))} שנים` : money(solved.x, "ILS");
    return {
      ...s,
      headline: `${solved.label} (X) = ${shown} · ${s.headline}`,
      metrics: [
        { label: `הנעלם: ${solved.label}`, value: round2(solved.x), format: solved.years ? "number" : "currency", hint: solved.years ? "בשנים" : undefined },
        ...s.metrics,
      ],
      proof: solved.proof,
    };
  },
};

/** When a fair value is X, the other rows still need a date and an amount, and only one may be left blank. */
function unknownFairValueRows(v: Values): string | null {
  if (v[UNKNOWN] !== "fairValues") return null;
  const rows = parseDatedValues(String(v.fairValues ?? ""));
  if (rows.length === 0) return "הוסיפו את שורת ההערכה שבה השווי ההוגן הוא X.";
  if (rows.some((r) => !isIsoDate(r.date))) return "בכל שורה יש לבחור תאריך.";
  if (rows.filter((r) => r.value === "").length > 1) return "השאירו בלי סכום שורה אחת בלבד — זו שהשווי בה הוא X.";
  return null;
}
