import { CURRENCIES, money, percent } from "../format";
import { entry, round2, sum } from "../math";
import type { Calculator, Guidance, ScheduleRow, ScheduleTable } from "../types";
import { bool, num, rate, str } from "../validate";

const REGIMES: Record<string, { rate: number; label: string }> = {
  standard: { rate: 0.23, label: "שיעור מס החברות הרגיל בישראל" },
  preferred: { rate: 0.16, label: "שיעור המס למפעל מועדף" },
  "preferred-a": { rate: 0.075, label: "שיעור המס למפעל מועדף (אזור פיתוח א')" },
  pte: { rate: 0.12, label: "שיעור המס למפעל טכנולוגי מועדף" },
};

const UNRECOGNISED = "נכס מס נדחה שלא הוכר";

type Item = { name: string; carrying: number | null; base: number | null; open: number; close: number };

/** Deferred tax recognised from signed temporary differences (+ taxable, − deductible). */
function deferred(items: Item[], t: number, recoverable: boolean, which: "open" | "close") {
  const dtl = sum(items.map((i) => Math.max(i[which], 0) * t));
  const dta = sum(items.map((i) => Math.max(-i[which], 0) * t));
  // Without probable future profits, a DTA is still supported by reversing taxable differences.
  const recognisedDta = recoverable ? dta : Math.min(dta, dtl);
  return { dtl, dta, recognisedDta, unrecognised: dta - recognisedDta, net: dtl - recognisedDta };
}

export const corporateTax: Calculator = {
  slug: "corporate-tax-ias-12",
  standard: "IAS 12 · פקודת מס הכנסה",
  title: "מס הכנסה על חברות",
  tagline: "מס שוטף ומסים נדחים לפי IAS 12 ופקודת מס הכנסה.",
  description:
    "חישוב ההכנסה החייבת מהרווח החשבונאי, המס השוטף לפי שיעור המס הסטטוטורי או שיעור התמריץ בישראל, מסים נדחים בגין הפרשים זמניים והפסדים, והתאמה לשיעור המס האפקטיבי.",
  category: "מסים על ההכנסה",
  icon: "Landmark",
  accent: "emerald",
  explainerSlug: "deferred-tax-israel-ias-12",
  scenario: [
    { kind: "select", id: "currency", label: "מטבע הדיווח", options: CURRENCIES, default: "ILS" },
    {
      kind: "select",
      id: "regime",
      label: "משטר המס",
      options: [
        { value: "standard", label: "מס חברות רגיל — 23% (סעיף 126 לפקודה)" },
        { value: "preferred", label: "מפעל מועדף — 16%" },
        { value: "preferred-a", label: "מפעל מועדף, אזור פיתוח א' — 7.5%" },
        { value: "pte", label: "מפעל טכנולוגי מועדף — 12%" },
        { value: "custom", label: "תחום שיפוט אחר / שיעור מותאם" },
      ],
      default: "standard",
      videoAt: 130,
    },
    {
      kind: "toggle",
      id: "recoverable",
      label: "צפוי רווח חייב עתידי (נכסי המס הנדחים ניתנים למימוש)",
      help: "אם לא, הפרשים ניתנים לניכוי והפסדים מוכרים רק עד גובה ההפרשים החייבים במס שמתהפכים.",
      default: true,
      videoAt: 610,
    },
  ],
  metrics: [
    {
      kind: "number",
      id: "customRate",
      label: "שיעור מס החברות",
      unit: "percent",
      default: 21,
      min: 0,
      max: 60,
      showIf: [{ field: "regime", in: ["custom"] }],
    },
    { kind: "number", id: "pbt", label: "רווח חשבונאי לפני מס", unit: "currency", default: 6000000, required: true },
    {
      kind: "number",
      id: "nonDeductible",
      label: "הוצאות שאינן מותרות בניכוי",
      help: "הפרשים קבועים כגון קנסות, הוצאות כיבוד ומתנות שאינן מותרות.",
      unit: "currency",
      default: 220000,
      min: 0,
    },
    {
      kind: "number",
      id: "exempt",
      label: "הכנסות פטורות",
      help: "הפרשים קבועים כגון דיבידנד מחברה תושבת ישראל (סעיף 126(ב) לפקודה).",
      unit: "currency",
      default: 300000,
      min: 0,
    },
    { kind: "number", id: "ppeCarrying", label: "רכוש קבוע — ערך בספרים, סגירה", unit: "currency", default: 4800000, min: 0 },
    { kind: "number", id: "ppeTaxBase", label: "רכוש קבוע — בסיס המס, סגירה", unit: "currency", default: 3900000, min: 0 },
    {
      kind: "number",
      id: "ppeOpeningDifference",
      label: "רכוש קבוע — הפרש זמני, פתיחה",
      help: "הערך בספרים בפתיחה בניכוי בסיס המס. חיובי כאשר הפחת לצרכי מס הקדים את הפחת החשבונאי.",
      unit: "currency",
      default: 650000,
    },
    {
      kind: "number",
      id: "provisionsClosing",
      label: "הפרשות המותרות בניכוי בעת תשלום — סגירה",
      help: "לדוגמה הפרשה לחופשה והפרשות בגין הטבות עובדים.",
      unit: "currency",
      default: 420000,
      min: 0,
    },
    { kind: "number", id: "provisionsOpening", label: "הפרשות המותרות בניכוי בעת תשלום — פתיחה", unit: "currency", default: 310000, min: 0 },
    { kind: "number", id: "openingLosses", label: "הפסדים מועברים לצרכי מס — פתיחה", unit: "currency", default: 0, min: 0 },
    { kind: "number", id: "advances", label: "מקדמות מס ששולמו במהלך השנה", unit: "currency", default: 1100000, min: 0 },
  ],

  solve(v) {
    const currency = str(v, "currency");
    const fmt = (n: number) => money(n, currency);
    const regime = str(v, "regime");
    const t = regime === "custom" ? rate(v, "customRate") : (REGIMES[regime] ?? REGIMES.standard).rate;
    const regimeLabel = regime === "custom" ? "שיעור המס החל" : (REGIMES[regime] ?? REGIMES.standard).label;
    const recoverable = bool(v, "recoverable");

    const pbt = num(v, "pbt");
    const nd = num(v, "nonDeductible");
    const ex = num(v, "exempt");
    const ppeOpen = num(v, "ppeOpeningDifference");
    const ppeClose = num(v, "ppeCarrying") - num(v, "ppeTaxBase");
    const provOpen = num(v, "provisionsOpening");
    const provClose = num(v, "provisionsClosing");
    const lossesOpen = num(v, "openingLosses");

    const ppeMovement = ppeClose - ppeOpen;
    const provMovement = provClose - provOpen;
    const beforeLosses = pbt + nd - ex - ppeMovement + provMovement;
    const utilised = beforeLosses > 0 ? Math.min(lossesOpen, beforeLosses) : 0;
    const taxable = Math.max(beforeLosses - utilised, 0);
    const lossesClose = beforeLosses > 0 ? lossesOpen - utilised : lossesOpen - beforeLosses;
    const current = round2(taxable * t);

    const items: Item[] = [
      { name: "רכוש קבוע", carrying: num(v, "ppeCarrying"), base: num(v, "ppeTaxBase"), open: ppeOpen, close: ppeClose },
      { name: "הפרשות המותרות בניכוי בעת תשלום", carrying: provClose, base: 0, open: -provOpen, close: -provClose },
      { name: "הפסדים מועברים לצרכי מס", carrying: null, base: lossesClose, open: -lossesOpen, close: -lossesClose },
    ];
    const open = deferred(items, t, recoverable, "open");
    const close = deferred(items, t, recoverable, "close");
    const deferredExpense = round2(close.net - open.net);
    const totalTax = round2(current + deferredExpense);
    const etr = pbt !== 0 ? totalTax / pbt : 0;
    const payable = round2(current - num(v, "advances"));

    const computation: ScheduleRow[] = [
      { item: "רווח חשבונאי לפני מס", amount: pbt },
      { item: "בתוספת: הוצאות שאינן מותרות בניכוי", amount: nd },
      { item: "בניכוי: הכנסות פטורות", amount: -ex },
      { item: "בניכוי: גידול בהפרש הזמני ברכוש הקבוע (עודף פחת לצרכי מס)", amount: round2(-ppeMovement) },
      { item: "בתוספת: גידול בהפרשות שטרם הותרו בניכוי", amount: round2(provMovement) },
      { item: "הכנסה חייבת לפני קיזוז הפסדים", amount: round2(beforeLosses), _emphasis: "subtotal" },
      { item: "בניכוי: הפסדים מועברים שקוזזו", amount: round2(-utilised) },
      { item: "הכנסה חייבת", amount: round2(taxable), _emphasis: "subtotal" },
      { item: `מס שוטף בשיעור ${percent(t)}`, amount: current, _emphasis: "total" },
    ];

    const deferredRows: ScheduleRow[] = items.map((i) => ({
      item: i.name,
      carrying: i.carrying,
      base: i.base,
      difference: round2(i.close),
      closing: round2(i.close * t),
      opening: round2(i.open * t),
      movement: round2((i.close - i.open) * t),
    }));
    if (close.unrecognised > 0 || open.unrecognised > 0) {
      deferredRows.push({
        item: UNRECOGNISED,
        carrying: null,
        base: null,
        difference: null,
        closing: round2(close.unrecognised),
        opening: round2(open.unrecognised),
        movement: round2(close.unrecognised - open.unrecognised),
      });
    }

    const reconciliationLines: [string, number][] = [
      [`מס לפי ${regimeLabel} (${percent(t)})`, round2(pbt * t)],
      ["הוצאות שאינן מותרות בניכוי", round2(nd * t)],
      ["הכנסות פטורות", round2(-ex * t)],
      ["שינוי בנכסי מס נדחים שלא הוכרו", round2(close.unrecognised - open.unrecognised)],
    ];
    const rounding = round2(totalTax - sum(reconciliationLines.map(([, a]) => a)));
    if (Math.abs(rounding) >= 0.01) reconciliationLines.push(["עיגול", rounding]);
    const reconciliation: ScheduleRow[] = reconciliationLines
      .filter(([, a], idx) => idx === 0 || a !== 0)
      .map(([item, amount]) => ({ item, amount, effect: pbt !== 0 ? amount / pbt : 0 }));

    const journal = [
      entry("current-tax", "סוף השנה", "הוצאות מס שוטף לשנה, בניכוי מקדמות ששולמו", [
        ["הוצאות מס שוטף", current],
        ["מקדמות מס ששולמו", -num(v, "advances")],
        [payable >= 0 ? "מס הכנסה לשלם" : "מס הכנסה לקבל", -payable],
      ]),
      ...(deferredExpense !== 0
        ? [
            entry("deferred-tax", "סוף השנה", deferredExpense > 0 ? "גידול בהתחייבות מסים נדחים, נטו" : "קיטון בהתחייבות מסים נדחים, נטו", [
              [deferredExpense > 0 ? "הוצאות מסים נדחים" : "התחייבות מסים נדחים (נטו)", Math.abs(deferredExpense)],
              [deferredExpense > 0 ? "התחייבות מסים נדחים (נטו)" : "הכנסות מסים נדחים", -Math.abs(deferredExpense)],
            ]),
          ]
        : []),
    ];

    const guidance: Guidance[] = [
      {
        title: "מס שוטף",
        body: "מס שוטף הוא המס לשלם על הרווח החייב לתקופה — הרווח החשבונאי בהתאמה להפרשים קבועים וזמניים — הנמדד לפי שיעורי המס שנחקקו או שחקיקתם הושלמה למעשה עד תאריך הדיווח. מס שוטף שטרם שולם הוא התחייבות; עודף מקדמות הוא נכס.",
        reference: "IAS 12.5, 12, 46",
      },
      {
        title: "מסים נדחים בגין הפרשים זמניים",
        body: "התחייבות מסים נדחים מוכרת בגין כל ההפרשים הזמניים החייבים במס (ערך בספרים של נכס הגבוה מבסיס המס שלו), ונכס מסים נדחים מוכר בגין הפרשים הניתנים לניכוי והפסדים מועברים, במידה שצפוי רווח חייב עתידי. מסים נדחים אינם מהוונים.",
        reference: "IAS 12.15, 24, 34, 53",
      },
      {
        title: recoverable ? "יכולת המימוש של נכסי מסים נדחים" : "נכסי מסים נדחים מוגבלים",
        body: recoverable
          ? "נכסי המסים הנדחים מוכרים במלואם מאחר שלהערכת ההנהלה צפוי רווח חייב עתידי מספיק. יש לבחון זאת בכל תאריך דיווח."
          : `לא צפוי רווח חייב עתידי, ולכן נכסי מסים נדחים מוכרים רק עד גובה ההפרשים הזמניים החייבים במס המתהפכים באותן תקופות — ${fmt(close.recognisedDta)} מתוך ${fmt(close.dta)}. הסכום שלא הוכר מגולה.`,
        reference: recoverable ? "IAS 12.27, 56" : "IAS 12.28–31, 35–36, 81(e)",
      },
      {
        title: "שיעור מס החברות בישראל",
        body:
          regime === "standard"
            ? "לפי סעיף 126(א) לפקודת מס הכנסה [נוסח חדש], התשכ\"א-1961, חברות חייבות במס בשיעור 23% (החל משנת המס 2018)."
            : regime === "custom"
              ? "מוחל שיעור מותאם; יש לוודא שזהו השיעור שנחקק או שחקיקתו הושלמה למעשה עד תאריך הדיווח, לתקופה שבה ההפרשים מתהפכים."
              : "שיעורי מס מופחתים לפי החוק לעידוד השקעות הון, התשי\"ט-1959 חלים על הכנסה מועדפת בלבד. מסים נדחים נמדדים לפי השיעור הצפוי לחול בעת היפוך כל הפרש — ייתכן שיידרש שיעור משוקלל אם חלק מההכנסה אינו מועדף.",
        reference: regime === "standard" ? "סעיף 126(א) לפקודה; IAS 12.47" : regime === "custom" ? "IAS 12.47–48" : "החוק לעידוד השקעות הון; IAS 12.47, 51",
      },
    ];
    if (ex > 0) {
      guidance.push({
        title: "דיבידנד פטור בין חברות",
        body: "דיבידנד שמקבלת חברה ישראלית מחברה אחרת תושבת ישראל, מתוך הכנסה שהופקה בישראל, אינו נכלל בדרך כלל בהכנסה החייבת — הפרש קבוע שמפחית את שיעור המס האפקטיבי.",
        reference: "סעיף 126(ב) לפקודה",
      });
    }
    if (lossesOpen > 0 || lossesClose > 0) {
      guidance.push({
        title: "הפסדים מועברים",
        body: "הפסד עסקי שלא ניתן לקזזו בשנה שבה נוצר ניתן להעברה ולקיזוז כנגד הכנסה מעסק בשנים הבאות, ללא הגבלת זמן. נכס מסים נדחים מוכר במידה שצפוי רווח חייב עתידי.",
        reference: "סעיף 28 לפקודה; IAS 12.34–36",
      });
    }
    if (num(v, "advances") > 0) {
      guidance.push({
        title: "מקדמות מס",
        body: "מקדמות ששולמו במהלך השנה על חשבון החבות השנתית מקוזזות מהמס השוטף לשלם, והסכום נטו מוצג כהתחייבות או כנכס.",
        reference: "סעיף 175 לפקודה; IAS 12.12, 71",
      });
    }
    guidance.push({
      title: "גילוי",
      body: "יש לגלות את הרכיבים העיקריים של הוצאות המס, הסבר של הקשר בין הוצאות המס לרווח החשבונאי, מסים נדחים לפי סוג ההפרש הזמני, ונכסי מסים נדחים שלא הוכרו.",
      reference: "IAS 12.79–81",
    });

    const disclosure = [
      "באור X — מסים על ההכנסה",
      "",
      "(א) רכיבי הוצאות המסים על ההכנסה",
      `מס שוטף: ${fmt(current)}`,
      `${deferredExpense >= 0 ? "הוצאות" : "הכנסות"} מסים נדחים: ${fmt(Math.abs(deferredExpense))}`,
      `סך הוצאות המסים על ההכנסה: ${fmt(totalTax)}`,
      "",
      "(ב) התאמה בין הוצאות המס לרווח החשבונאי",
      ...reconciliation.map((r) => `${r.item}: ${fmt(Number(r.amount))}`),
      `הוצאות מסים על ההכנסה: ${fmt(totalTax)} (שיעור אפקטיבי ${percent(etr)})`,
      "",
      `החברה חייבת במס לפי ${regimeLabel}, בשיעור ${percent(t)}${regime === "standard" ? ", בהתאם לסעיף 126 לפקודת מס הכנסה" : ""}.`,
      "",
      "(ג) יתרות מסים נדחים",
      ...deferredRows
        .filter((r) => r.item !== UNRECOGNISED)
        .map((r) => `${r.item}: ${fmt(Number(r.closing))} (פתיחה ${fmt(Number(r.opening))})`),
      `${close.net >= 0 ? "התחייבות" : "נכס"} מסים נדחים, נטו: ${fmt(Math.abs(round2(close.net)))}`,
      ...(close.unrecognised > 0
        ? ["", `(ד) לא הוכרו נכסי מסים נדחים בסך ${fmt(round2(close.unrecognised))}, מאחר שלא צפוי שיהיה רווח חייב עתידי שכנגדו ניתן יהיה לנצלם.`]
        : []),
    ].join("\n");

    return {
      headline: `סך הוצאות המס ${fmt(totalTax)} · שיעור אפקטיבי ${percent(etr)}`,
      outcome: "recognised",
      metrics: [
        { label: "הכנסה חייבת", value: round2(taxable), format: "currency" },
        { label: "מס שוטף", value: current, format: "currency" },
        { label: "הוצאות / (הכנסות) מסים נדחים", value: deferredExpense, format: "currency" },
        { label: "סך הוצאות המס", value: totalTax, format: "currency" },
        { label: "שיעור המס האפקטיבי", value: etr, format: "percent", hint: `סטטוטורי ${percent(t)}` },
        { label: payable >= 0 ? "מס הכנסה לשלם" : "מס הכנסה לקבל", value: Math.abs(payable), format: "currency" },
      ],
      journal,
      tables: <ScheduleTable[]>[
        {
          id: "computation",
          title: "הכנסה חייבת ומס שוטף",
          columns: [
            { key: "item", label: "סעיף", format: "text" },
            { key: "amount", label: "סכום" },
          ],
          rows: computation,
        },
        {
          id: "deferred",
          title: "מסים נדחים לפי הפרש זמני",
          caption: "הפרשים חיוביים חייבים במס (התחייבויות); שליליים ניתנים לניכוי (נכסים).",
          columns: [
            { key: "item", label: "סעיף", format: "text" },
            { key: "carrying", label: "ערך בספרים" },
            { key: "base", label: "בסיס המס" },
            { key: "difference", label: "הפרש זמני" },
            { key: "opening", label: "מס נדחה — פתיחה" },
            { key: "closing", label: "מס נדחה — סגירה" },
            { key: "movement", label: "תנועה" },
          ],
          rows: deferredRows,
          totals: {
            item: "התחייבות / (נכס) מסים נדחים, נטו",
            carrying: null,
            base: null,
            difference: null,
            opening: round2(open.net),
            closing: round2(close.net),
            movement: deferredExpense,
          },
        },
        {
          id: "reconciliation",
          title: "התאמה לשיעור המס האפקטיבי",
          columns: [
            { key: "item", label: "סעיף", format: "text" },
            { key: "amount", label: "סכום" },
            { key: "effect", label: "השפעה על השיעור", format: "percent" },
          ],
          rows: reconciliation,
          totals: { item: "הוצאות מסים על ההכנסה", amount: totalTax, effect: etr },
        },
      ],
      disclosure,
      guidance,
      assumptions: [
        "אותו שיעור מס חל על המס השוטף ועל היפוך כל ההפרשים הזמניים.",
        "הפרשות מותרות בניכוי רק בעת תשלומן, ולכן בסיס המס שלהן אפס.",
        "נכסי והתחייבויות המסים הנדחים מתייחסים לאותה רשות מס ומקוזזים.",
      ],
    };
  },
};
