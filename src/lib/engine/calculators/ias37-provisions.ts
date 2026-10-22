import { CURRENCIES, money, percent } from "../format";
import { entry, presentValue, round2 } from "../math";
import type { Calculator, Guidance, JournalEntry, ScheduleRow, ScheduleTable, Values } from "../types";
import { bool, num, rate, str } from "../validate";

const NATURE: Record<string, { label: string; title: string; expense: string; provision: string }> = {
  legal: { label: "תביעה משפטית", title: "תביעות משפטיות", expense: "הוצאות בגין תביעות משפטיות", provision: "הפרשה לתביעות משפטיות" },
  decommissioning: { label: "מחויבות לפירוק ולשיקום", title: "פירוק ושיקום", expense: "הוצאות פירוק ושיקום", provision: "הפרשה לפירוק ולשיקום" },
  warranty: { label: "אחריות למוצרים", title: "אחריות למוצרים", expense: "הוצאות אחריות", provision: "הפרשה לאחריות" },
  onerous: { label: "חוזה מכביד", title: "חוזה מכביד", expense: "הפסד מחוזה מכביד", provision: "הפרשה לחוזה מכביד" },
};

// Feminine forms: they qualify "זרימת המשאבים".
const PROBABILITY_LABEL: Record<string, string> = { probable: "צפויה", possible: "אפשרית", remote: "קלושה" };

const outcomes = (v: Values) =>
  [1, 2, 3]
    .map((n) => ({ amount: num(v, `outcome${n}`), probability: num(v, `probability${n}`) / 100 }))
    .filter((o) => o.probability > 0);

export const ias37Provisions: Calculator = {
  slug: "ias-37-provisions",
  standard: "IAS 37",
  title: "הפרשות והתחייבויות תלויות",
  tagline: "להכיר, לגלות או להתעלם — ואז למדוד ולהוון.",
  description:
    "מעבר על הקריטריונים להכרה בהפרשה, מדידתה לפי האומדן הטוב ביותר (התוצאה הסבירה ביותר או תוחלת), היוונה, וטיפול בשיפויים ובהתחייבויות תלויות.",
  category: "התחייבויות",
  icon: "Scale",
  accent: "violet",
  explainerSlug: "ias-37-provisions-decision-tree",
  scenario: [
    { kind: "select", id: "currency", label: "מטבע הדיווח", options: CURRENCIES, default: "ILS" },
    {
      kind: "select",
      id: "nature",
      label: "מהות המחויבות",
      options: [
        { value: "legal", label: "תביעה משפטית" },
        { value: "decommissioning", label: "פירוק / שיקום אתר" },
        { value: "warranty", label: "אחריות למוצרים" },
        { value: "onerous", label: "חוזה מכביד" },
      ],
      default: "legal",
    },
    {
      kind: "toggle",
      id: "presentObligation",
      label: "קיימת מחויבות בהווה כתוצאה מאירוע מהעבר",
      help: "משפטית או משתמעת. אם הדבר אינו ברור, המחויבות קיימת כאשר סביר יותר מאשר לא שהיא קיימת, בהתחשב בכל הראיות.",
      default: true,
      videoAt: 95,
    },
    {
      kind: "radio",
      id: "probability",
      label: "הסתברות לזרימת משאבים",
      options: [
        { value: "probable", label: "צפויה", description: "סביר יותר מאשר לא (מעל 50%)." },
        { value: "possible", label: "אפשרית", description: "לא צפויה, אך גם לא קלושה." },
        { value: "remote", label: "קלושה", description: "בלתי סבירה בעליל." },
      ],
      default: "probable",
      videoAt: 240,
    },
    { kind: "toggle", id: "reliable", label: "ניתן לערוך אומדן מהימן", default: true },
    {
      kind: "radio",
      id: "measurement",
      label: "בסיס המדידה",
      options: [
        { value: "most-likely", label: "התוצאה הסבירה ביותר", description: "למחויבות בודדת." },
        { value: "expected", label: "תוחלת", description: "לאוכלוסייה גדולה של פריטים." },
      ],
      default: "most-likely",
      videoAt: 410,
    },
    { kind: "toggle", id: "discount", label: "השפעת ערך הזמן של הכסף מהותית — יש להוון את ההפרשה", default: true, videoAt: 560 },
    {
      kind: "toggle",
      id: "capitalise",
      label: "הוספת המחויבות לעלות הנכס הקשור",
      help: "לעלויות פירוק שמתהוות בעת התקנת הנכס (IAS 16.16(c)).",
      default: true,
      showIf: [{ field: "nature", in: ["decommissioning"] }],
    },
    { kind: "toggle", id: "reimbursement", label: "חלק מההוצאה צפוי להיות משופה", default: false },
    {
      kind: "radio",
      id: "reimbursementCertainty",
      label: "ודאות השיפוי",
      options: [
        { value: "virtually-certain", label: "ודאי למעשה", description: "מוכר כנכס נפרד." },
        { value: "probable", label: "צפוי בלבד", description: "מגולה כנכס תלוי." },
      ],
      default: "virtually-certain",
      showIf: [{ field: "reimbursement", in: [true] }],
    },
  ],
  metrics: [
    {
      kind: "number",
      id: "mostLikely",
      label: "התשלום הסביר ביותר",
      unit: "currency",
      default: 1500000,
      min: 0.01,
      showIf: [{ field: "measurement", in: ["most-likely"] }],
    },
    ...[1, 2, 3].flatMap((n) => [
      {
        kind: "number" as const,
        id: `outcome${n}`,
        label: `תוצאה ${n} — סכום`,
        unit: "currency" as const,
        default: [0, 1200000, 3000000][n - 1],
        min: 0,
        showIf: [{ field: "measurement", in: ["expected"] }],
      },
      {
        kind: "number" as const,
        id: `probability${n}`,
        label: `תוצאה ${n} — הסתברות`,
        unit: "percent" as const,
        default: [20, 60, 20][n - 1],
        min: 0,
        max: 100,
        showIf: [{ field: "measurement", in: ["expected"] }],
      },
    ]),
    {
      kind: "number",
      id: "years",
      label: "שנים עד הסילוק",
      unit: "years",
      default: 4,
      min: 1,
      max: 100,
      integer: true,
      showIf: [{ field: "discount", in: [true] }],
    },
    {
      kind: "number",
      id: "discountRate",
      label: "שיעור היוון לפני מס",
      help: "משקף הערכות שוק עדכניות של ערך הזמן של הכסף ואת הסיכונים הספציפיים להתחייבות.",
      unit: "percent",
      default: 4.5,
      min: 0,
      max: 50,
      showIf: [{ field: "discount", in: [true] }],
    },
    {
      kind: "number",
      id: "reimbursementAmount",
      label: "השיפוי הצפוי",
      unit: "currency",
      default: 300000,
      min: 0,
      showIf: [{ field: "reimbursement", in: [true] }],
    },
  ],

  validate(v): Record<string, string> {
    if (str(v, "measurement") !== "expected") return {};
    const total = [1, 2, 3].reduce((s, n) => s + num(v, `probability${n}`), 0);
    return Math.abs(total - 100) > 0.001
      ? { probability3: `סכום ההסתברויות חייב להיות 100% (כרגע ${round2(total)}%).` }
      : {};
  },

  solve(v) {
    const currency = str(v, "currency");
    const fmt = (n: number) => money(n, currency);
    const nature = NATURE[str(v, "nature")] ?? NATURE.legal;
    const expected = str(v, "measurement") === "expected";
    const estimate = round2(
      expected ? outcomes(v).reduce((s, o) => s + o.amount * o.probability, 0) : num(v, "mostLikely"),
    );
    const probability = str(v, "probability");
    const present = bool(v, "presentObligation");
    const reliable = bool(v, "reliable");

    const tables: ScheduleTable[] = [];
    if (expected) {
      tables.push({
        id: "expected-value",
        title: "חישוב התוחלת",
        columns: [
          { key: "outcome", label: "תוצאה", format: "text" },
          { key: "amount", label: "סכום" },
          { key: "probability", label: "הסתברות", format: "percent" },
          { key: "weighted", label: "סכום משוקלל" },
        ],
        rows: [1, 2, 3].map((n) => ({
          outcome: `תוצאה ${n}`,
          amount: num(v, `outcome${n}`),
          probability: num(v, `probability${n}`) / 100,
          weighted: round2(num(v, `outcome${n}`) * (num(v, `probability${n}`) / 100)),
        })),
        totals: { outcome: "תוחלת", amount: null, probability: 1, weighted: estimate },
      });
    }

    const recognitionGuidance: Guidance = {
      title: "קריטריונים להכרה",
      body: "הפרשה מוכרת רק כאשר (א) קיימת מחויבות בהווה (משפטית או משתמעת) כתוצאה מאירוע מהעבר, (ב) צפוי שתידרש זרימת משאבים המגלמים הטבות כלכליות, ו-(ג) ניתן לערוך אומדן מהימן. שלושת התנאים חייבים להתקיים.",
      reference: "IAS 37.14",
    };

    // Not recognised: contingent liability or nothing.
    if (!(present && probability === "probable" && reliable)) {
      const remote = probability === "remote";
      const reason = !present
        ? "לא סביר יותר מאשר לא שקיימת מחויבות בהווה"
        : probability !== "probable"
          ? `זרימת המשאבים ${PROBABILITY_LABEL[probability] ?? probability} ואינה צפויה`
          : "לא ניתן לערוך אומדן מהימן";
      const guidance: Guidance[] = [
        recognitionGuidance,
        remote
          ? {
              title: "ללא הכרה וללא גילוי",
              body: `לא מוכרת הפרשה מאחר ש${reason}. מאחר שהאפשרות לזרימת משאבים קלושה, אין צורך גם בגילוי של התחייבות תלויה.`,
              reference: "IAS 37.28, 86",
            }
          : {
              title: "התחייבות תלויה — גילוי בלבד",
              body: `לא מוכרת הפרשה מאחר ש${reason}. המחויבות היא התחייבות תלויה: יש לגלות את מהותה ובמידה המעשית גם אומדן של השפעתה הכספית, את אי-הוודאות לגבי הסכום או העיתוי, ואת האפשרות לשיפוי כלשהו.`,
              reference: "IAS 37.10, 27–28, 86",
            },
        {
          title: "הערכה מחדש באופן שוטף",
          body: "התחייבויות תלויות נבחנות באופן שוטף. אם זרימת משאבים הופכת לצפויה, מוכרת הפרשה בתקופה שבה חל השינוי בהסתברות.",
          reference: "IAS 37.30",
        },
      ];
      if (!reliable && present && probability === "probable") {
        guidance.push({
          title: "אומדן מהימן — חריג נדיר ביותר",
          body: "למעט במקרים נדירים ביותר, הישות יכולה לקבוע טווח של תוצאות אפשריות ולערוך אומדן מהימן דיו להכרה בהפרשה. יש לתעד מדוע זהו אחד מאותם מקרים.",
          reference: "IAS 37.25–26",
        });
      }
      return {
        headline: remote ? "אין צורך בהפרשה ואין צורך בגילוי" : `התחייבות תלויה — יש לגלות השפעה משוערת של ${fmt(estimate)}`,
        outcome: remote ? "none" : "disclose-only",
        metrics: [
          { label: "הפרשה שהוכרה", value: 0, format: "currency" },
          { label: remote ? "תשלום משוער (קלוש)" : "השפעה כספית משוערת", value: estimate, format: "currency" },
        ],
        journal: [],
        tables,
        disclosure: remote
          ? "אין צורך בגילוי: האפשרות לזרימת משאבים קלושה (IAS 37.86)."
          : [
              "באור X — התחייבויות תלויות",
              "",
              `כנגד הקבוצה קיימת ${nature.label}. ${!present ? "להערכת ההנהלה, לא סביר יותר מאשר לא שקיימת מחויבות בהווה" : probability !== "probable" ? "להערכת ההנהלה, בהתבסס על יועציה, זרימת משאבים אפשרית אך אינה צפויה" : "לא ניתן למדוד את סכום המחויבות במהימנות מספקת"}, ולפיכך לא הוכרה הפרשה.`,
              "",
              `ההשפעה הכספית המשוערת, אם העניין יביא לזרימת משאבים, היא כ-${fmt(estimate)}. סכום ועיתוי זרימת המשאבים אינם ודאיים ותלויים בתוצאת אירועים עתידיים שאינם בשליטתה המלאה של הקבוצה.`,
              ...(bool(v, "reimbursement") ? ["", `הקבוצה צופה לקבל שיפוי מצד שלישי של עד ${fmt(num(v, "reimbursementAmount"))} אם תידרש זרימת משאבים.`] : []),
            ].join("\n"),
        guidance,
        assumptions: ["האומדן המוצג הוא האומדן הטוב ביותר של התשלום האפשרי, ומשמש לגילוי בלבד."],
      };
    }

    // Recognised provision
    const discounting = bool(v, "discount");
    const years = discounting ? num(v, "years") : 0;
    const r = discounting ? rate(v, "discountRate") : 0;
    const initial = discounting ? round2(presentValue(estimate, r, years)) : estimate;
    const capitalise = str(v, "nature") === "decommissioning" && bool(v, "capitalise");
    const debitAccount = capitalise ? "רכוש קבוע — נכס פירוק ושיקום" : nature.expense;

    const reimbursement = bool(v, "reimbursement");
    const reimbursementRecognised =
      reimbursement && str(v, "reimbursementCertainty") === "virtually-certain"
        ? round2(Math.min(num(v, "reimbursementAmount"), initial))
        : 0;

    const movement: ScheduleRow[] = [{ event: "הכרה לראשונה", opening: 0, additions: initial, unwinding: 0, used: 0, closing: initial }];
    let balance = initial;
    for (let y = 1; y <= years; y++) {
      const last = y === years;
      const unwind = last ? round2(estimate - balance) : round2(balance * r);
      const closing = round2(balance + unwind);
      movement.push({ event: `שנה ${y}`, opening: balance, additions: 0, unwinding: unwind, used: 0, closing });
      balance = closing;
    }
    movement.push({ event: "סילוק", opening: balance, additions: 0, unwinding: 0, used: -balance, closing: 0, _emphasis: "event" });
    tables.unshift({
      id: "movement",
      title: "תנועה בהפרשה",
      caption: discounting ? `מהוונת בשיעור ${percent(r)} על פני ${years} שנים` : "לא מהוונת — השפעת ערך הזמן של הכסף אינה מהותית",
      columns: [
        { key: "event", label: "תקופה", format: "text" },
        { key: "opening", label: "פתיחה" },
        { key: "additions", label: "תוספות" },
        { key: "unwinding", label: "חלוף הזמן" },
        { key: "used", label: "שימוש" },
        { key: "closing", label: "סגירה" },
      ],
      rows: movement,
    });

    const unwindY1 = discounting ? Number(movement[1].unwinding) : 0;
    const journal: JournalEntry[] = [
      entry("recognition", "הכרה", `הכרה בהפרשה בגין ${nature.label}`, [
        [debitAccount, initial],
        [nature.provision, -initial],
      ]),
    ];
    if (reimbursementRecognised > 0) {
      journal.push(
        entry("reimbursement", "הכרה", "הכרה בשיפוי הוודאי למעשה כנכס נפרד", [
          ["שיפוי לקבל", reimbursementRecognised],
          [capitalise ? "הכנסות אחרות — שיפוי" : nature.expense, -reimbursementRecognised],
        ]),
      );
    }
    if (discounting) {
      journal.push(
        entry("y1-unwind", "שנה 1", "הוצאות מימון בגין חלוף הזמן", [
          ["הוצאות מימון — חלוף הזמן", unwindY1],
          [nature.provision, -unwindY1],
        ]),
      );
    }
    journal.push(
      entry("settlement", discounting ? `שנה ${years}` : "סילוק", "סילוק המחויבות בסכום המשוער", [
        [nature.provision, estimate],
        ["מזומנים", -estimate],
      ]),
    );

    const guidance: Guidance[] = [
      recognitionGuidance,
      {
        title: "האומדן הטוב ביותר",
        body: expected
          ? `לאוכלוסייה גדולה של פריטים, המחויבות נאמדת על ידי שקלול כל התוצאות האפשריות לפי ההסתברויות שלהן — התוחלת, כאן ${fmt(estimate)}.`
          : "למחויבות בודדת, התוצאה הבודדת הסבירה ביותר עשויה להיות האומדן הטוב ביותר, אך יש לשקול תוצאות אפשריות אחרות: אם רובן גבוהות או נמוכות יותר, האומדן הטוב ביותר יהיה סכום גבוה או נמוך יותר.",
        reference: expected ? "IAS 37.36–39" : "IAS 37.36–40",
      },
    ];
    if (discounting) {
      guidance.push({
        title: "היוון וחלוף הזמן",
        body: `כאשר השפעת ערך הזמן של הכסף מהותית, ההפרשה היא הערך הנוכחי של ההוצאה הצפויה (${fmt(estimate)} בעוד ${years} שנים בשיעור ${percent(r)} = ${fmt(initial)}). יש להשתמש בשיעור לפני מס שאינו משקף סיכונים שכבר הותאמו בתזרימי המזומנים. הגידול התקופתי הוא עלות אשראי.`,
        reference: "IAS 37.45–47, 60",
      });
    }
    if (capitalise) {
      guidance.push({
        title: "עלות הפירוק מהוונת לנכס",
        body: "האומדן הראשוני של עלויות הפירוק והשיקום הוא חלק מעלות הנכס ומופחת יחד איתו. שינויים מאוחרים באומדן או בשיעור ההיוון מתאימים את הנכס ואת ההפרשה, ולא את הרווח או ההפסד.",
        reference: "IAS 16.16(c); IFRIC 1.4–5",
      });
    }
    if (reimbursement) {
      guidance.push({
        title: "שיפויים",
        body:
          reimbursementRecognised > 0
            ? `השיפוי מוכר רק משום שהוא ודאי למעשה, כנכס נפרד (${fmt(reimbursementRecognised)}) שאינו עולה על ההפרשה. ניתן להציג את ההוצאה ברווח או הפסד בניכוי השיפוי.`
            : "השיפוי אינו ודאי למעשה ולכן אינו מוכר. מאחר שהוא צפוי, הוא מגולה כנכס תלוי.",
        reference: reimbursementRecognised > 0 ? "IAS 37.53–54" : "IAS 37.31–35, 89",
      });
    }
    guidance.push({
      title: "גילוי",
      body: "לכל קבוצת הפרשות יש לגלות התאמה של הערך בספרים, תיאור המחויבות, העיתוי הצפוי של זרימת המשאבים, אי-הוודאויות וההנחות העיקריות, וכל שיפוי צפוי.",
      reference: "IAS 37.84–85",
    });

    const closingY1 = discounting ? Number(movement[1].closing) : initial;
    const disclosure = [
      `באור X — הפרשות: ${nature.title}`,
      "",
      "התאמת הערך בספרים — שנה 1",
      `יתרה לתחילת השנה: ${fmt(0)}`,
      `הפרשות נוספות שהוכרו: ${fmt(initial)}`,
      ...(discounting ? [`הוצאות מימון בגין חלוף הזמן: ${fmt(unwindY1)}`] : []),
      `סכומים שנוצלו במהלך השנה: ${fmt(0)}`,
      `יתרה לסוף השנה: ${fmt(closingY1)}`,
      "",
      `ההפרשה מתייחסת ל${nature.label}. היא מייצגת את האומדן הטוב ביותר של ההנהלה להוצאה הנדרשת לסילוק המחויבות${expected ? ", שנקבע כתוחלת המשוקללת לפי הסתברות של התוצאות האפשריות" : ""}.${discounting ? ` הסילוק צפוי בעוד כ-${years} שנים; ההפרשה מהוונת בשיעור לפני מס של ${percent(r)}.` : ""} סכום ועיתוי זרימת המשאבים כרוכים באי-ודאות.`,
      ...(reimbursement
        ? [
            "",
            reimbursementRecognised > 0
              ? `הוכר נכס בסך ${fmt(reimbursementRecognised)} בגין השיפוי הצפוי.`
              : `שיפוי של עד ${fmt(num(v, "reimbursementAmount"))} נחשב צפוי אך אינו ודאי למעשה, ולכן לא הוכר.`,
          ]
        : []),
    ].join("\n");

    return {
      headline: `יש להכיר בהפרשה בסך ${fmt(initial)}`,
      outcome: "recognised",
      metrics: [
        { label: "האומדן הטוב ביותר (לא מהוון)", value: estimate, format: "currency" },
        { label: "הפרשה במועד ההכרה", value: initial, format: "currency" },
        ...(discounting ? [{ label: "חלוף הזמן בשנה 1", value: unwindY1, format: "currency" as const }] : []),
        ...(reimbursementRecognised > 0 ? [{ label: "נכס שיפוי", value: reimbursementRecognised, format: "currency" as const }] : []),
        {
          label: capitalise ? "השפעה ראשונית על רווח או הפסד" : "הוצאה ראשונית (נטו)",
          value: capitalise ? -reimbursementRecognised : round2(initial - reimbursementRecognised),
          format: "currency",
        },
      ],
      journal,
      tables,
      disclosure,
      guidance,
      assumptions: [
        "המחויבות מסולקת בסכום המשוער במועד הצפוי.",
        ...(discounting ? ["שיעור ההיוון אינו משתנה לאורך חיי ההפרשה."] : []),
      ],
    };
  },
};
