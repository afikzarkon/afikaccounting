import { CURRENCIES, money, percent } from "../format";
import { entry, maturityBands, periodicRate, presentValue, round2, sum } from "../math";
import type { Calculator, Guidance, ScheduleRow, ScheduleTable } from "../types";
import { bool, num, rate, str } from "../validate";

const FREQUENCY: Record<string, number> = { annual: 1, quarterly: 4, monthly: 12 };

function periodLabel(k: number, perYear: number) {
  const year = Math.floor(k / perYear) + 1;
  if (perYear === 1) return `שנה ${year}`;
  const within = (k % perYear) + 1;
  return perYear === 4 ? `שנה ${year} · רבעון ${within}` : `שנה ${year} · חודש ${within}`;
}

export const ifrs16Leases: Calculator = {
  slug: "ifrs-16-leases",
  standard: "IFRS 16",
  title: "חכירות — טיפול חשבונאי אצל החוכר",
  tagline: "נכס זכות שימוש, התחייבות בגין חכירה ולוח סילוקין מלא.",
  description:
    "מדידת ההתחייבות בגין החכירה ונכס זכות השימוש במועד ההתחלה, כולל אופציות הארכה, תשלומים מדורגים או צמודי מדד, עלויות ישירות ראשוניות, תמריצים ומחויבות לשיקום.",
  category: "חכירות",
  icon: "Building2",
  accent: "sky",
  explainerSlug: "ifrs-16-lessee-accounting-masterclass",
  scenario: [
    { kind: "select", id: "currency", label: "מטבע הדיווח", options: CURRENCIES, default: "ILS" },
    {
      kind: "select",
      id: "frequency",
      label: "תדירות התשלומים",
      options: [
        { value: "annual", label: "שנתית" },
        { value: "quarterly", label: "רבעונית" },
        { value: "monthly", label: "חודשית" },
      ],
      default: "annual",
    },
    {
      kind: "radio",
      id: "timing",
      label: "מועד התשלום",
      options: [
        { value: "arrears", label: "בסוף תקופה", description: "התשלום מתבצע בסוף כל תקופה." },
        { value: "advance", label: "בתחילת תקופה", description: "התשלום הראשון משולם במועד ההתחלה." },
      ],
      default: "arrears",
      videoAt: 312,
    },
    {
      kind: "radio",
      id: "profile",
      label: "מבנה התשלומים",
      options: [
        { value: "fixed", label: "קבוע", description: "תשלום זהה בכל תקופה." },
        { value: "escalating", label: "עלייה קבועה", description: "עולה בשיעור קבוע מדי שנה." },
        { value: "cpi", label: "צמוד מדד", description: "צמוד למדד המחירים לצרכן." },
      ],
      default: "fixed",
      videoAt: 548,
    },
    {
      kind: "toggle",
      id: "extension",
      label: "החכירה כוללת אופציית הארכה",
      help: "אופציה של החוכר להאריך את החכירה מעבר לתקופה שאינה ניתנת לביטול.",
      default: false,
      videoAt: 735,
    },
    {
      kind: "radio",
      id: "extensionCertain",
      label: "האם מימוש אופציית ההארכה ודאי באופן סביר?",
      options: [
        { value: "yes", label: "ודאי באופן סביר", description: "תקופות ההארכה נכללות בתקופת החכירה." },
        { value: "no", label: "לא ודאי באופן סביר", description: "תקופות ההארכה אינן נכללות." },
      ],
      default: "yes",
      showIf: [{ field: "extension", in: [true] }],
    },
    {
      kind: "toggle",
      id: "ownershipTransfers",
      label: "הבעלות מועברת, או שמימוש אופציית רכישה ודאי באופן סביר",
      help: "נכס זכות השימוש מופחת על פני אורך החיים השימושיים של הנכס ולא על פני תקופת החכירה.",
      default: false,
    },
    {
      kind: "toggle",
      id: "restoration",
      label: "קיימת מחויבות לשקם את האתר בתום החכירה",
      default: false,
    },
    {
      kind: "radio",
      id: "exemption",
      label: "פטור מהכרה",
      options: [
        { value: "none", label: "ללא", description: "הכרה בנכס ובהתחייבות." },
        { value: "short-term", label: "חכירה לטווח קצר", description: "תקופת חכירה של 12 חודשים או פחות." },
        { value: "low-value", label: "נכס בעל ערך נמוך", description: "ערכו של נכס הבסיס כשהוא חדש נמוך." },
      ],
      default: "none",
    },
  ],
  metrics: [
    { kind: "number", id: "payment", label: "תשלום חכירה לתקופה", unit: "currency", default: 120000, min: 0.01, required: true },
    { kind: "number", id: "termYears", label: "תקופה שאינה ניתנת לביטול", unit: "years", default: 5, min: 1, max: 50, integer: true, required: true },
    {
      kind: "number",
      id: "discountRate",
      label: "שיעור היוון (ריבית גלומה או ריבית תוספתית)",
      help: "שיעור שנתי. יש להשתמש בשיעור הריבית הגלום בחכירה אם ניתן לקבעו בנקל, ואחרת בשיעור הריבית התוספתי של החוכר.",
      unit: "percent",
      default: 5,
      min: 0,
      max: 50,
      required: true,
    },
    {
      kind: "number",
      id: "escalation",
      label: "שיעור עלייה שנתי",
      unit: "percent",
      default: 3,
      min: 0,
      max: 50,
      showIf: [{ field: "profile", in: ["escalating"] }],
    },
    {
      kind: "number",
      id: "extensionYears",
      label: "תקופת ההארכה",
      unit: "years",
      default: 3,
      min: 1,
      max: 30,
      integer: true,
      showIf: [
        { field: "extension", in: [true] },
        { field: "extensionCertain", in: ["yes"] },
      ],
    },
    {
      kind: "number",
      id: "extensionPayment",
      label: "תשלום לתקופה בתקופת ההארכה",
      unit: "currency",
      default: 135000,
      min: 0,
      showIf: [
        { field: "extension", in: [true] },
        { field: "extensionCertain", in: ["yes"] },
      ],
    },
    { kind: "number", id: "directCosts", label: "עלויות ישירות ראשוניות", unit: "currency", default: 0, min: 0 },
    { kind: "number", id: "incentives", label: "תמריצי חכירה שהתקבלו", unit: "currency", default: 0, min: 0 },
    { kind: "number", id: "usefulLife", label: "אורך החיים השימושיים של נכס הבסיס", unit: "years", default: 15, min: 1, max: 100, integer: true },
    {
      kind: "number",
      id: "restorationCost",
      label: "עלות שיקום משוערת (בתום התקופה)",
      unit: "currency",
      default: 80000,
      min: 0,
      showIf: [{ field: "restoration", in: [true] }],
    },
    {
      kind: "number",
      id: "restorationRate",
      label: "שיעור היוון לפני מס להפרשה",
      unit: "percent",
      default: 4,
      min: 0,
      max: 50,
      showIf: [{ field: "restoration", in: [true] }],
    },
  ],

  validate(v) {
    const errors: Record<string, string> = {};
    const perYear = FREQUENCY[str(v, "frequency")] ?? 1;
    const totalPayments = num(v, "payment") * num(v, "termYears") * perYear;
    if (num(v, "incentives") >= totalPayments) {
      errors.incentives = "התמריצים אינם יכולים לעלות על תשלומי החכירה — נכס זכות השימוש היה שלילי.";
    }
    return errors;
  },

  solve(v) {
    const currency = str(v, "currency");
    const fmt = (n: number) => money(n, currency);
    const perYear = FREQUENCY[str(v, "frequency")] ?? 1;
    const advance = str(v, "timing") === "advance";
    const profile = str(v, "profile");
    const includeExtension = bool(v, "extension") && str(v, "extensionCertain") === "yes";
    const termYears = num(v, "termYears");
    const extensionYears = includeExtension ? num(v, "extensionYears") : 0;
    const leaseYears = termYears + extensionYears;
    const periods = leaseYears * perYear;
    const annualRate = rate(v, "discountRate");
    const i = periodicRate(annualRate, perYear);

    const payments = Array.from({ length: periods }, (_, k) => {
      const year = Math.floor(k / perYear);
      if (year >= termYears) return num(v, "extensionPayment");
      return profile === "escalating" ? num(v, "payment") * Math.pow(1 + rate(v, "escalation"), year) : num(v, "payment");
    }).map(round2);

    const cashByYear = Array.from({ length: leaseYears }, (_, y) =>
      sum(payments.slice(y * perYear, (y + 1) * perYear)),
    );

    const guidance: Guidance[] = [];
    const assumptions: string[] = [
      `שיעור ההיוון לתקופה, ${percent(i, 4)}, הוא ${perYear === 1 ? "השיעור השנתי" : "השיעור האפקטיבי לתקופה"} המקביל ל-${percent(annualRate)} לשנה.`,
      "תקופות הלוח מתחילות במועד ההתחלה; שנה 1 היא 12 החודשים הראשונים של החכירה.",
    ];

    if (includeExtension) {
      guidance.push({
        title: "תקופת ההארכה נכללת בתקופת החכירה",
        body: `מאחר שמימוש האופציה ודאי באופן סביר, ההארכה בת ${extensionYears} השנים היא חלק מתקופת החכירה והתשלומים בגינה נכללים בהתחייבות. יש לבחון זאת מחדש רק בקרות אירוע משמעותי או שינוי משמעותי בנסיבות שבשליטת החוכר.`,
        reference: "IFRS 16.18–21, B37–B40",
      });
      assumptions.push("תשלומי תקופת ההארכה נלקחו כקבועים בסכום שהוזן.");
    } else if (bool(v, "extension")) {
      guidance.push({
        title: "אופציית ההארכה אינה נכללת",
        body: "מימוש האופציה אינו ודאי באופן סביר, ולכן תקופות ההארכה והתשלומים בגינן אינם חלק מתקופת החכירה. בהגעה למסקנה יש לשקול תמריצים כלכליים — שיפורים במושכר, עלויות העתקה ודמי שכירות מתחת לשוק בתקופת ההארכה.",
        reference: "IFRS 16.18–19, B37",
      });
    }

    // Recognition exemptions
    const shortTermEligible = leaseYears * 12 <= 12 && !bool(v, "ownershipTransfers");
    const exemption = str(v, "exemption");
    const exempt = exemption === "low-value" || (exemption === "short-term" && shortTermEligible);

    if (exemption === "short-term" && !shortTermEligible) {
      guidance.push({
        title: "פטור החכירה לטווח קצר אינו זמין",
        body: `תקופת החכירה היא ${leaseYears * 12} חודשים${bool(v, "ownershipTransfers") ? " והחכירה כוללת אופציית רכישה" : ""}, ולכן אין זו חכירה לטווח קצר. הנכס וההתחייבות מוכרים במלואם.`,
        reference: "IFRS 16.5, נספח א' (חכירה לטווח קצר)",
      });
    }

    if (exempt) {
      const total = sum(payments);
      const expensePerYear = total / leaseYears;
      let accrued = 0;
      const rows: ScheduleRow[] = cashByYear.map((cash, y) => {
        accrued += expensePerYear - cash;
        return { period: `שנה ${y + 1}`, cash, expense: round2(expensePerYear), accrued: round2(accrued) };
      });
      const kind = exemption === "low-value" ? "חכירות של נכסים בעלי ערך נמוך" : "חכירות לטווח קצר";
      guidance.unshift({
        title: exemption === "low-value" ? "הוחל פטור נכס בעל ערך נמוך" : "הוחל פטור חכירה לטווח קצר",
        body: "לא מוכרים נכס זכות שימוש או התחייבות בגין חכירה. התשלומים מוכרים כהוצאה בשיטת הקו הישר על פני תקופת החכירה (או על בסיס שיטתי אחר המשקף טוב יותר את דפוס ההטבה). הבחירה לחכירות לטווח קצר נעשית לפי קבוצת נכסי בסיס; לנכסים בעלי ערך נמוך ניתן לבחור לכל חכירה בנפרד.",
        reference: exemption === "low-value" ? "IFRS 16.5–6, 8, B3–B8" : "IFRS 16.5–6, 8",
      });
      return {
        headline: `הוצאה של ${fmt(expensePerYear)} לשנה — לא מוכרת התחייבות בגין חכירה`,
        outcome: "exempt",
        metrics: [
          { label: "הוצאת חכירה שנתית", value: round2(expensePerYear), format: "currency" },
          { label: "סך התשלומים", value: round2(total), format: "currency" },
          { label: "תקופת החכירה (שנים)", value: leaseYears, format: "number" },
        ],
        journal: [
          entry("y1-expense", "שנה 1", "הוצאת חכירה לשנה (קו ישר)", [
            ["הוצאות חכירה", expensePerYear],
            ["מזומנים", -cashByYear[0]],
            ["תשלומי חכירה לשלם", -(expensePerYear - cashByYear[0])],
          ]),
        ],
        tables: [
          {
            id: "expense",
            title: "לוח הוצאה בשיטת הקו הישר",
            columns: [
              { key: "period", label: "תקופה", format: "text" },
              { key: "cash", label: "מזומן ששולם" },
              { key: "expense", label: "הוצאה" },
              { key: "accrued", label: "לשלם / (מראש)" },
            ],
            rows,
            totals: { period: "סה\"כ", cash: round2(total), expense: round2(total), accrued: null },
          },
        ],
        disclosure: [
          "חכירות — לטווח קצר ובעלות ערך נמוך",
          "",
          `הקבוצה בחרה שלא להכיר בנכסי זכות שימוש ובהתחייבויות בגין חכירה עבור ${kind}. תשלומי החכירה בגין חכירות אלה מוכרים כהוצאה בשיטת הקו הישר על פני תקופת החכירה.`,
          "",
          `ההוצאה בגין ${kind} שהוכרה ברווח או הפסד בשנה 1: ${fmt(expensePerYear)}.`,
        ].join("\n"),
        guidance,
        assumptions,
      };
    }

    // Lease liability at commencement
    const paidAtCommencement = advance ? payments[0] : 0;
    const liability0 = advance
      ? sum(payments.slice(1).map((p, k) => presentValue(p, i, k + 1)))
      : sum(payments.map((p, k) => presentValue(p, i, k + 1)));
    const L0 = round2(liability0);

    const restorationRate = rate(v, "restorationRate");
    const restorationPV = bool(v, "restoration")
      ? round2(presentValue(num(v, "restorationCost"), restorationRate, leaseYears))
      : 0;
    const directCosts = num(v, "directCosts");
    const incentives = num(v, "incentives");
    const rou = round2(L0 + paidAtCommencement + directCosts - incentives + restorationPV);

    // Depreciation period: useful life if ownership transfers, else the shorter of term and life.
    const lifePeriods = num(v, "usefulLife") * perYear;
    const depPeriods = bool(v, "ownershipTransfers") ? lifePeriods : Math.min(periods, lifePeriods);
    const depPer = rou / depPeriods;
    const totalRows = Math.max(periods, depPeriods);

    const rows: ScheduleRow[] = [];
    let open = L0;
    let accumulated = 0;
    for (let k = 0; k < totalRows; k++) {
      let pay = 0;
      let interest = 0;
      let close = 0;
      if (k < periods) {
        const last = k === periods - 1;
        if (advance) {
          pay = k === 0 ? 0 : payments[k];
          interest = last ? 0 : round2((open - pay) * i);
          close = last ? 0 : round2(open - pay + interest);
          if (last) pay = open; // final payment settles the balance exactly
        } else {
          pay = payments[k];
          interest = last ? round2(pay - open) : round2(open * i);
          close = last ? 0 : round2(open + interest - pay);
        }
      }
      const dep = k < depPeriods ? (k === depPeriods - 1 ? round2(rou - accumulated) : round2(depPer)) : 0;
      accumulated = round2(accumulated + dep);
      rows.push({
        period: periodLabel(k, perYear),
        opening: k < periods ? open : null,
        payment: k < periods ? pay : null,
        interest: k < periods ? interest : null,
        principal: k < periods ? round2(pay - interest) : null,
        closing: k < periods ? close : null,
        depreciation: dep,
        rou: round2(rou - accumulated),
        _emphasis: (k + 1) % perYear === 0 && perYear > 1 ? "year-end" : null,
      });
      open = close;
    }

    const yearRows = (y: number) => rows.slice(y * perYear, (y + 1) * perYear);
    const y1 = yearRows(0);
    const y1Interest = round2(sum(y1.map((r) => Number(r.interest ?? 0))));
    const y1Payments = round2(sum(y1.map((r) => Number(r.payment ?? 0))));
    const y1Dep = round2(sum(y1.map((r) => Number(r.depreciation))));
    const closingY1 = Number(rows[perYear - 1]?.closing ?? 0);
    const closingY2 = Number(rows[2 * perYear - 1]?.closing ?? 0);
    const currentPortion = round2(closingY1 - closingY2);
    const totalInterest = round2(sum(rows.map((r) => Number(r.interest ?? 0))));
    const unwindY1 = round2(restorationPV * restorationRate);

    const tables: ScheduleTable[] = [
      {
        id: "liability",
        title: "לוח ההתחייבות בגין חכירה ונכס זכות השימוש",
        caption: `${periods} תקופות ${perYear === 1 ? "שנתיות" : perYear === 4 ? "רבעוניות" : "חודשיות"} · תשלומים ${advance ? "בתחילת תקופה" : "בסוף תקופה"}`,
        columns: [
          { key: "period", label: "תקופה", format: "text" },
          { key: "opening", label: "יתרת פתיחה" },
          { key: "payment", label: "תשלום" },
          { key: "interest", label: "ריבית" },
          { key: "principal", label: "קרן" },
          { key: "closing", label: "יתרת סגירה" },
          { key: "depreciation", label: "פחת זכות שימוש" },
          { key: "rou", label: "יתרת זכות שימוש" },
        ],
        rows,
        totals: {
          period: "סה\"כ",
          opening: null,
          payment: round2(sum(rows.map((r) => Number(r.payment ?? 0)))),
          interest: totalInterest,
          principal: L0,
          closing: null,
          depreciation: rou,
          rou: null,
        },
      },
    ];

    if (restorationPV > 0) {
      let pOpen = restorationPV;
      const provisionRows: ScheduleRow[] = Array.from({ length: leaseYears }, (_, y) => {
        const last = y === leaseYears - 1;
        const unwind = last ? round2(num(v, "restorationCost") - pOpen) : round2(pOpen * restorationRate);
        const row = { period: `שנה ${y + 1}`, opening: pOpen, unwinding: unwind, closing: round2(pOpen + unwind) };
        pOpen = row.closing;
        return row;
      });
      tables.push({
        id: "restoration",
        title: "הפרשה לשיקום (IAS 37)",
        caption: `מהוונת בשיעור ${percent(restorationRate)} על פני ${leaseYears} שנים`,
        columns: [
          { key: "period", label: "תקופה", format: "text" },
          { key: "opening", label: "הפרשה — פתיחה" },
          { key: "unwinding", label: "הוצאות מימון בגין חלוף הזמן" },
          { key: "closing", label: "הפרשה — סגירה" },
        ],
        rows: provisionRows,
      });
    }

    const journal = [
      entry("commencement", "מועד ההתחלה", "הכרה לראשונה בחכירה", [
        ["נכס זכות שימוש", rou],
        ["התחייבות בגין חכירה", -L0],
        ["הפרשה לשיקום", -restorationPV],
        ["מזומנים", -(paidAtCommencement + directCosts - incentives)],
      ]),
      entry("y1-interest", "שנה 1", "ריבית על ההתחייבות בגין חכירה (שיטת הריבית האפקטיבית)", [
        ["הוצאות מימון — ריבית חכירה", y1Interest],
        ["התחייבות בגין חכירה", -y1Interest],
      ]),
      ...(y1Payments > 0
        ? [
            entry("y1-payments", "שנה 1", "תשלומי חכירה ששולמו במהלך השנה", [
              ["התחייבות בגין חכירה", y1Payments],
              ["מזומנים", -y1Payments],
            ]),
          ]
        : []),
      entry("y1-depreciation", "שנה 1", "פחת נכס זכות השימוש (קו ישר)", [
        ["הוצאות פחת — נכס זכות שימוש", y1Dep],
        ["פחת שנצבר — נכס זכות שימוש", -y1Dep],
      ]),
      ...(restorationPV > 0
        ? [
            entry("y1-unwind", "שנה 1", "הוצאות מימון בגין חלוף הזמן בהפרשה לשיקום", [
              ["הוצאות מימון — חלוף הזמן", unwindY1],
              ["הפרשה לשיקום", -unwindY1],
            ]),
          ]
        : []),
    ];

    const bands = maturityBands(cashByYear.slice(1));
    const depYears = depPeriods / perYear;

    guidance.unshift(
      {
        title: "הכרה במועד ההתחלה",
        body: "במועד ההתחלה החוכר מכיר בנכס זכות שימוש ובהתחייבות בגין חכירה. ההתחייבות היא הערך הנוכחי של תשלומי החכירה שטרם שולמו, מהוונים בשיעור הריבית הגלום בחכירה או, אם לא ניתן לקבעו בנקל, בשיעור הריבית התוספתי של החוכר.",
        reference: "IFRS 16.22, 26",
      },
      {
        title: "עלות נכס זכות השימוש",
        body: `הנכס נמדד בסכום ההתחייבות הראשונית (${fmt(L0)})${advance ? `, בתוספת התשלום ששולם במועד ההתחלה (${fmt(paidAtCommencement)})` : ""}${directCosts ? `, בתוספת עלויות ישירות ראשוניות (${fmt(directCosts)})` : ""}${incentives ? `, בניכוי תמריצים שהתקבלו (${fmt(incentives)})` : ""}${restorationPV ? `, בתוספת הערך הנוכחי של עלויות השיקום (${fmt(restorationPV)})` : ""}.`,
        reference: "IFRS 16.23–24",
      },
      {
        title: "מדידה עוקבת",
        body: `ההתחייבות צוברת ריבית בשיעור תקופתי קבוע ומוקטנת בתשלומים. הנכס מופחת על פני ${depYears} שנים — ${bool(v, "ownershipTransfers") ? "אורך החיים השימושיים של נכס הבסיס, מאחר שהבעלות מועברת או שמימוש אופציית רכישה ודאי באופן סביר" : "המוקדם מבין תום אורך החיים השימושיים ותום תקופת החכירה"}.`,
        reference: "IFRS 16.29–33, 36–38",
      },
    );
    if (profile === "cpi") {
      guidance.push({
        title: "תשלומים צמודי מדד",
        body: "תשלומים התלויים במדד נמדדים לפי המדד במועד ההתחלה — אין לחזות אינפלציה עתידית. כאשר המדד משתנה ותזרימי המזומנים משתנים, ההתחייבות נמדדת מחדש לפי שיעור ההיוון המקורי, ונכס זכות השימוש מותאם בהתאם.",
        reference: "IFRS 16.27(b), 28, 42(b), 43",
      });
      assumptions.push("תשלומים צמודי מדד נמדדים לפי המדד במועד ההתחלה, ולכן הם מופיעים בלוח כקבועים.");
    }
    if (profile === "escalating") {
      assumptions.push(`התשלומים עולים ב-${percent(rate(v, "escalation"))} בתחילת כל שנת חכירה.`);
    }
    if (restorationPV > 0) {
      guidance.push({
        title: "עלויות שיקום",
        body: "העלות המשוערת לשיקום האתר נכללת בעלות נכס זכות השימוש ומוכרת כהפרשה לפי IAS 37. ההיוון מתפוגג דרך הוצאות המימון.",
        reference: "IFRS 16.24(d); IAS 37.45–47, 60",
      });
    }
    guidance.push({
      title: "הצגה וגילוי",
      body: "יש להציג את נכסי זכות השימוש ואת ההתחייבויות בגין חכירה בנפרד (או לגלות באילו סעיפים הם נכללים). יש לגלות פחת לפי קבוצת נכסים, הוצאות ריבית, סך תזרים המזומנים היוצא וניתוח מועדי פירעון של ההתחייבויות בגין חכירה.",
      reference: "IFRS 16.47, 53, 58",
    });

    const disclosure = [
      "באור X — חכירות",
      "",
      "(א) סכומים שהוכרו בדוח על המצב הכספי",
      `נכסי זכות שימוש במועד ההתחלה: ${fmt(rou)}; ערך בספרים בתום שנה 1: ${fmt(rou - y1Dep)}.`,
      `התחייבויות בגין חכירה בתום שנה 1: ${fmt(closingY1)}, מהן שוטפות ${fmt(currentPortion)} ולא שוטפות ${fmt(round2(closingY1 - currentPortion))}.`,
      "",
      "(ב) סכומים שהוכרו ברווח או הפסד (שנה 1)",
      `הוצאות פחת בגין נכסי זכות שימוש: ${fmt(y1Dep)}`,
      `הוצאות ריבית בגין התחייבויות בגין חכירה: ${fmt(y1Interest)}`,
      ...(restorationPV > 0 ? [`הוצאות מימון בגין חלוף הזמן בהפרשה לשיקום: ${fmt(unwindY1)}`] : []),
      "",
      "(ג) סך תזרים המזומנים היוצא בגין חכירות בשנה 1",
      `${fmt(round2(paidAtCommencement + y1Payments))}`,
      "",
      "(ד) ניתוח מועדי פירעון — תזרימי מזומנים חוזיים לא מהוונים בתום שנה 1",
      `עד שנה: ${fmt(bands.withinOne)}`,
      `משנה עד חמש שנים: ${fmt(bands.oneToFive)}`,
      `מעל חמש שנים: ${fmt(bands.afterFive)}`,
      `סך ההתחייבויות בגין חכירה, לא מהוונות: ${fmt(round2(bands.withinOne + bands.oneToFive + bands.afterFive))}`,
      "",
      `ההתחייבות בגין החכירה נמדדה לפי שיעור היוון של ${percent(annualRate)}.${includeExtension ? ` תקופת החכירה כוללת תקופת הארכה של ${extensionYears} שנים שמימושה ודאי באופן סביר.` : bool(v, "extension") ? " תזרימי מזומנים יוצאים עתידיים אפשריים בגין אופציית הארכה שמימושה אינו ודאי באופן סביר אינם נכללים בהתחייבות." : ""}`,
    ].join("\n");

    return {
      headline: `התחייבות בגין חכירה ${fmt(L0)} · נכס זכות שימוש ${fmt(rou)}`,
      outcome: "recognised",
      metrics: [
        { label: "התחייבות בגין חכירה במועד ההתחלה", value: L0, format: "currency" },
        { label: "נכס זכות שימוש", value: rou, format: "currency" },
        { label: "סך הריבית על פני התקופה", value: totalInterest, format: "currency" },
        { label: "החיוב ברווח או הפסד בשנה 1", value: round2(y1Interest + y1Dep + unwindY1), format: "currency", hint: "ריבית + פחת" },
        { label: "חלות שוטפת בתום שנה 1", value: currentPortion, format: "currency" },
        { label: "תקופת החכירה (שנים)", value: leaseYears, format: "number" },
      ],
      journal,
      tables,
      disclosure,
      guidance,
      assumptions,
    };
  },
};
