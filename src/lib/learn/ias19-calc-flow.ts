import { type CalcSolution, type Ceiling, type DbEvent, type DbGroup, type DbInput, type Terms, solveAbsenceBenefit, solveBonus, solveDbYear, solveDcPlans, solveDisabilityEvent, solveMeasure, solveNonAccumulating, solveNoteYear, solveTermination } from "./ias19-calc";

/**
 * The IAS 19 calculator's questionnaire: which questions to ask, given the
 * answers so far, and how the answers become the solver's input. Plain data,
 * so the screen is one generic component and a test can walk every branch.
 */

export type Unit = "₪" | "%" | "שנים" | "עובדים" | "ימים" | "חודשים" | "";
export type Field = { id: string; label: string; help?: string; unit?: Unit; optional?: boolean; example?: number | string; text?: boolean; check?: boolean; select?: { value: string; label: string }[] };
export type Option = { value: string; label: string; hint?: string };

export type Question =
  | { id: string; kind: "choice"; title: string; why: string; options: Option[] }
  | { id: string; kind: "multi"; title: string; why: string; options: Option[] }
  | { id: string; kind: "form"; title: string; why: string; fields: Field[] }
  | { id: string; kind: "rows"; title: string; why: string; columns: Field[]; addLabel: string; min: number; example: Row[] };

export type Row = Record<string, string | boolean>;
export type Answers = Record<string, string | string[] | Row[]>;

const str = (a: Answers, id: string) => (typeof a[id] === "string" ? (a[id] as string) : "");
const num = (a: Answers, id: string) => {
  const v = str(a, id).replace(/,/g, "").trim();
  return v === "" ? undefined : Number(v);
};
const req = (a: Answers, id: string) => num(a, id) ?? 0;
const pct = (a: Answers, id: string) => req(a, id) / 100;
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);
const rowsOf = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as Row[]) : []);
const rv = (r: Row, id: string) => {
  const v = r[id];
  if (typeof v !== "string") return undefined;
  const t = v.replace(/,/g, "").trim();
  return t === "" ? undefined : Number(t);
};
const rn = (r: Row, id: string) => rv(r, id) ?? 0;
const rt = (r: Row, id: string, fallback: string) => (typeof r[id] === "string" && (r[id] as string).trim() ? (r[id] as string).trim() : fallback);
const fm = (x: number) => Math.round(x).toLocaleString("en-US");

export type Kind = "short" | "dc" | "db" | "olt" | "term";

/** The kind of benefit the answers lead to, once they do. */
export function kindOf(a: Answers): Kind | undefined {
  let t = str(a, "type");
  if (t === "unsure") {
    if (str(a, "c1") === "yes") t = "term";
    else if (str(a, "c1") === "no" && str(a, "c2") === "yes") t = "short";
    else if (str(a, "c2") === "no" && str(a, "c3") === "yes") t = "post";
    else if (str(a, "c3") === "no") t = "olt";
    else return undefined;
  }
  if (t === "post") {
    const r = str(a, "risk");
    return r === "company" ? "db" : r === "employee" ? "dc" : undefined;
  }
  return t === "short" || t === "olt" || t === "term" ? t : undefined;
}

const YES_NO = (yes: string, no: string): Option[] => [
  { value: "yes", label: "כן", hint: yes },
  { value: "no", label: "לא", hint: no },
];

const year: Field = { id: "year", label: "השנה שעליה שואלים", example: 2026 };

// ---------------------------------------------------------------------------
// The questions.

const TYPE: Question = {
  id: "type",
  kind: "choice",
  title: "איזו הטבה רוצים לפתור?",
  why: "הסוג קובע את כל מה שבא אחריו. לא בטוחים? עץ הסיווג של הקורס יוביל אתכם בשלוש שאלות.",
  options: [
    { value: "short", label: "הטבה לזמן קצר", hint: "חופשה, מחלה, בונוס, משכורת 13: מסולקת תוך 12 חודשים מסוף השנה" },
    { value: "post", label: "הטבה לאחר סיום העסקה", hint: "פנסיה, פיצויים, מענק פרישה, סעיף 14" },
    { value: "olt", label: "הטבה אחרת לזמן ארוך", hint: "מענק יובל, שבתון, בונוס רב־שנתי, אובדן כושר עבודה" },
    { value: "term", label: "הטבת פיטורין", hint: "סגירת מפעל, תוכנית פרישה מוקדמת" },
    { value: "unsure", label: "לא בטוח, עזרו לי לסווג", hint: "שלוש שאלות, בסדר קבוע" },
  ],
};

function classifyQuestions(a: Answers): Question[] {
  if (str(a, "type") !== "unsure") return [];
  const qs: Question[] = [{ id: "c1", kind: "choice", title: "ההטבה נוצרה מהחלטה לסיים העסקה?", why: "שאלה 1 מתוך 3: החלטה של החברה לפטר, או הצעה שעובד מקבל מרצונו. תשלום שמגיע בכל סיום, מכל סיבה, אינו פיטורין.", options: YES_NO("הטבת פיטורין", "ההטבה נוצרת מהעבודה עצמה") }];
  if (str(a, "c1") === "no") qs.push({ id: "c2", kind: "choice", title: "כולה תסולק תוך 12 חודשים מסוף שנת השירות?", why: "שאלה 2 מתוך 3: לפי המועד הצפוי לתשלום. שנה חריגה אחת לא משנה סיווג.", options: YES_NO("הטבה לזמן קצר", "ממשיכים לשאלה 3") });
  if (str(a, "c2") === "no") qs.push({ id: "c3", kind: "choice", title: "היא משולמת אחרי שההעסקה מסתיימת?", why: "שאלה 3 מתוך 3.", options: YES_NO("הטבה לאחר סיום העסקה", "הטבה אחרת לזמן ארוך") });
  return qs;
}

const RISK: Question = {
  id: "risk",
  kind: "choice",
  title: "מי נושא בסיכון אם הכסף לא יספיק?",
  why: "המבחן שמפריד בין שתי התוכניות (סעיף 28): האם החברה הבטיחה סכום, או רק הפקדה.",
  options: [
    { value: "company", label: "החברה", hint: "הבטיחה סכום או תשואה: הטבה מוגדרת" },
    { value: "employee", label: "העובד", hint: "החברה מפקידה ואין לה מחויבות נוספת, כמו סעיף 14 על כל הרכיב: הפקדה מוגדרת" },
  ],
};

// Short-term.

const dayCostFields: Field[] = [
  { id: "name", label: "דרג", text: true, example: "כל העובדים" },
  { id: "salary", label: "שכר חודשי", unit: "₪", example: 12_000 },
  { id: "workDays", label: "ימי עבודה בחודש", unit: "ימים", example: 22 },
  { id: "onCost", label: "תוספות על השכר", unit: "%", optional: true, help: "ביטוח לאומי, פיצויים, פנסיה: מה שהחברה משלמת מעל השכר", example: 15 },
];

function shortQuestions(a: Answers): Question[] {
  const qs: Question[] = [
    {
      id: "shortKind",
      kind: "choice",
      title: "מה ההטבה?",
      why: "לכל אחת כלל הכרה אחר.",
      options: [
        { value: "absence", label: "היעדרות בתשלום", hint: "חופשה, מחלה, הבראה" },
        { value: "bonus", label: "בונוס או שיתוף ברווחים", hint: "כולל משכורת 13" },
      ],
    },
  ];
  const k = str(a, "shortKind");
  if (k === "bonus") {
    qs.push({ id: "bonusObligation", kind: "choice", title: "יש מחויבות לשלם ביום הדוח?", why: "משפטית, או משתמעת מנוהג. אם החברה יכולה עדיין לא לשלם, אין הפרשה (סעיף 19).", options: YES_NO("יש הסכם, או נוהג שאי אפשר לסגת ממנו", "ההחלטה עוד לא התקבלה") });
    if (str(a, "bonusObligation") === "yes")
      qs.push({
        id: "bonusForm",
        kind: "form",
        title: "הנתונים",
        why: "מודדים את מה שישולם, עם מה שנלווה אליו, בלי היוון.",
        fields: [
          year,
          { id: "bonusBase", label: "סכום הבונוס לכולם", unit: "₪", help: "למשל שיעור מהרווח, או משכורת × עובדים", example: 240_000 },
          { id: "bonusOnCost", label: "תוספות על הבונוס", unit: "%", optional: true, help: "רק מה שחל על בונוס. לרוב ביטוח לאומי, לא פנסיה ופיצויים", example: 7 },
          { id: "bonusStay", label: "אחוז שצפוי לזכות בו", unit: "%", optional: true, help: "ריק = כולם", example: 95 },
          { id: "bonusOpening", label: "יתרת פתיחה", unit: "₪", optional: true, example: 180_000 },
          { id: "bonusPaid", label: "שולם השנה", unit: "₪", optional: true, example: 180_000 },
        ],
      });
    return qs;
  }
  if (k !== "absence") return qs;
  qs.push({ id: "accumulates", kind: "choice", title: "ימים שלא נוצלו עוברים הלאה?", why: "נצברת: יש מחויבות כבר עכשיו. לא נצברת: מכירים רק כשהיא קורית (סעיף 18).", options: YES_NO("נצברת, כמו חופשה", "לא נצברת, כמו ימי מילואים או חופשת לידה") });
  if (str(a, "accumulates") === "no") {
    qs.push({ id: "payer", kind: "choice", title: "מי משלם על הימים?", why: "אם מישהו אחר משלם, אין לחברה הוצאה.", options: [{ value: "company", label: "החברה" }, { value: "other", label: "הביטוח הלאומי", hint: "למשל חופשת לידה" }] });
    if (str(a, "payer") === "company")
      qs.push({
        id: "nonAccForm",
        kind: "form",
        title: "הנתונים",
        why: "ההוצאה היא מה ששולם על הימים שנוצלו.",
        fields: [
          year,
          { id: "naDays", label: "סה״כ ימים שנוצלו", unit: "ימים", example: 150 },
          { id: "salary", label: "שכר חודשי", unit: "₪", example: 12_000 },
          { id: "workDays", label: "ימי עבודה בחודש", unit: "ימים", example: 22 },
          { id: "onCost", label: "תוספות על השכר", unit: "%", optional: true, example: 15 },
          { id: "naPay", label: "אחוז מהשכר שמשולם ביום כזה", unit: "%", optional: true, help: "ריק = שכר מלא", example: 75 },
        ],
      });
    else if (str(a, "payer") === "other") qs.push({ id: "yearForm", kind: "form", title: "באיזו שנה?", why: "כדי לכתוב את הפתרון.", fields: [year] });
    return qs;
  }
  if (str(a, "accumulates") !== "yes") return qs;
  qs.push({ id: "vesting", kind: "choice", title: "מה מקבל עובד שעוזב עם יתרה?", why: "מבשילה: העוזב מקבל כסף על היתרה, ולכן גם היתרה שלו בהפרשה (סעיף 15).", options: [{ value: "full", label: "תשלום על כל היתרה", hint: "מבשילה" }, { value: "partial", label: "תשלום על חלק מהיתרה", hint: "מבשילה בחלקה" }, { value: "none", label: "לא מקבל כלום", hint: "לא מבשילה" }] });
  qs.push({ id: "order", kind: "choice", title: "באיזה סדר מנצלים?", why: "קובע כמה מהיתרה יעלה כסף.", options: [{ value: "lifo", label: "LIFO", hint: "קודם הימים של השנה, ואז הצבורים. אם לא נאמר אחרת" }, { value: "fifo", label: "FIFO", hint: "קודם הימים הצבורים" }] });
  qs.push({
    id: "absForm",
    kind: "form",
    title: "כללי",
    why: "הזכאות והיתרה חלות על כל הדרגים, אלא אם תוסיפו דרג שונה בשלב הבא.",
    fields: [
      year,
      ...(str(a, "vesting") === "partial" ? [{ id: "vestShare", label: "אחוז מהיתרה שמשולם לעוזב", unit: "%" as Unit, example: 50 }] : []),
      { id: "lifeYears", label: "לכמה שנים ימים צבורים נשמרים", unit: "שנים", example: 1, help: "1 = פוקעים בסוף השנה הבאה" },
    ],
  });
  qs.push({
    id: "grades",
    kind: "rows",
    title: "הדרגים, ועלות יום",
    why: "עלות יום = שכר ÷ ימי עבודה × (1 + תוספות). הוסיפו שורה לכל דרג עם שכר או זכאות שונים.",
    addLabel: "הוספת דרג",
    min: 1,
    columns: [...dayCostFields, { id: "entitlement", label: "ימים בשנה לעובד", unit: "ימים", example: 12 }, { id: "carried", label: "יתרה צבורה לעובד ב-1.1", unit: "ימים", optional: true, example: 3 }],
    example: [{ name: "כל העובדים", salary: "12000", workDays: "22", onCost: "15", entitlement: "12", carried: "3" }],
  });
  const gradeSelect = rowsOf(a, "grades").map((r, i) => ({ value: String(i), label: rt(r, "name", `דרג ${i + 1}`) }));
  const gradeCol: Field[] = gradeSelect.length > 1 ? [{ id: "grade", label: "דרג", select: gradeSelect, example: "0" }] : [];
  qs.push({
    id: "openingRows",
    kind: "rows",
    title: "הצפי ביום הפתיחה",
    why: "יתרת הפתיחה נמדדת לפי מה שציפו אז, לא לפי מה שקרה. כל קבוצה בשורה. אם אין יתרה בפתיחה, השאירו שורה אחת עם 0 עובדים.",
    addLabel: "הוספת קבוצה",
    min: 1,
    columns: [...gradeCol, { id: "name", label: "קבוצה", text: true, example: "נשארים" }, { id: "staff", label: "עובדים", unit: "עובדים", example: 40 }, { id: "use", label: "ניצול צפוי השנה לעובד", unit: "ימים", example: 14 }, { id: "leaves", label: "צפויים לעזוב", check: true }, { id: "dayCost", label: "עלות יום אחרת", unit: "₪", optional: true, help: "אם תשלום היום יהיה בשכר אחר" }],
    example: [
      { name: "נשארים, ינצלו יותר", staff: "30", use: "14", leaves: false },
      { name: "נשארים, ינצלו את הזכאות", staff: "16", use: "12", leaves: false },
      { name: "עוזבים בסוף השנה", staff: "4", use: "12", leaves: true },
    ],
  });
  qs.push({
    id: "actualRows",
    kind: "rows",
    title: "מה קרה בפועל, ומה צפוי לשנה הבאה",
    why: "התשלומים לפי מה שקרה. יתרת הסגירה לפי הצפי לשנה הבאה: בלי צפי מניחים ניצול מלא. קבוצה עם צפי שונה? פצלו לשתי שורות.",
    addLabel: "הוספת קבוצה",
    min: 1,
    columns: [
      ...gradeCol,
      { id: "name", label: "קבוצה", text: true, example: "נשארו" },
      { id: "staff", label: "עובדים", unit: "עובדים", example: 40 },
      { id: "use", label: "ניצלו השנה לעובד", unit: "ימים", example: 13 },
      { id: "leaves", label: "עזבו השנה", check: true },
      { id: "nextUse", label: "ניצול צפוי בשנה הבאה לעובד", unit: "ימים", optional: true, help: "ריק = ניצול מלא" },
      { id: "nextLeaves", label: "צפויים לעזוב בשנה הבאה", check: true },
      { id: "dayCostPaid", label: "עלות יום בתשלום, אם שונה", unit: "₪", optional: true },
      { id: "dayCostClose", label: "עלות יום בסגירה, אם שונה", unit: "₪", optional: true },
    ],
    example: [
      { name: "ניצלו יותר מהזכאות", staff: "28", use: "13", leaves: false, nextUse: "14", nextLeaves: false },
      { name: "ניצלו פחות", staff: "16", use: "10", leaves: false, nextUse: "", nextLeaves: false },
      { name: "עזבו", staff: "6", use: "12", leaves: true, nextUse: "", nextLeaves: false },
    ],
  });
  return qs;
}

// Defined contribution.

function dcQuestions(a: Answers): Question[] {
  const qs: Question[] = [
    { id: "dcHow", kind: "choice", title: "איך נקבעת ההפקדה?", why: "ההוצאה היא ההפקדה של השנה, בכל מקרה.", options: [{ value: "payroll", label: "אחוז מהשכר", hint: "פנסיה, קרן פיצויים" }, { value: "s14", label: "סעיף 14: משכורת חודשית לשנה" }] },
  ];
  const how = str(a, "dcHow");
  if (how === "payroll")
    qs.push({
      id: "dcRows",
      kind: "rows",
      title: "ההסדרים",
      why: "רק חלק המעסיק. כל הסדר בשורה.",
      addLabel: "הוספת הסדר",
      min: 1,
      columns: [{ id: "name", label: "הסדר", text: true, example: "פנסיה" }, { id: "payroll", label: "שכר שנתי מבוטח", unit: "₪", example: 3_600_000 }, { id: "rate", label: "שיעור הפקדה", unit: "%", example: 6.5 }, { id: "paid", label: "הועבר עד סוף השנה", unit: "₪", optional: true, help: "ריק = הכול הועבר" }],
      example: [{ name: "פנסיה", payroll: "3600000", rate: "6.5", paid: "214500" }],
    });
  if (how === "s14")
    qs.push({
      id: "s14Rows",
      kind: "rows",
      title: "העובדים",
      why: "בסוף כל שנה מפקידים לכל עובד את המשכורת החודשית של אותה שנה.",
      addLabel: "הוספת קבוצה",
      min: 1,
      columns: [{ id: "name", label: "קבוצה", text: true, example: "ייצור" }, { id: "staff", label: "עובדים", unit: "עובדים", example: 20 }, { id: "salary", label: "שכר חודשי בשנה הזו", unit: "₪", example: 9_500 }, { id: "paid", label: "הועבר עד סוף השנה", unit: "₪", optional: true, help: "ריק = הכול הועבר" }],
      example: [{ name: "ייצור", staff: "20", salary: "9500", paid: "" }],
    });
  if (how) qs.push({ id: "yearForm", kind: "form", title: "באיזו שנה?", why: "כדי לכתוב את הפתרון.", fields: [year] });
  return qs;
}

// Defined benefit and other long-term.

const ben = (a: Answers) => str(a, "benefit");

function termFields(prefix: string, a: Answers): Field[] {
  switch (str(a, prefix ? `${prefix}benefit` : "benefit")) {
    case "perYear":
      return [{ id: `${prefix}amount`, label: "סכום לעובד לכל שנת שירות", unit: "₪", example: prefix ? 3_000 : 2_500 }];
    case "salary":
      return [{ id: `${prefix}share`, label: "כמה משכורות (או אחוז מהשכר) לכל שנת שירות", unit: "%", help: "משכורת אחת לשנה = 100", example: prefix ? 110 : 100 }];
    case "lump":
      return [
        { id: `${prefix}grant`, label: "המענק לעובד", unit: "₪", example: prefix ? 120_000 : 96_000 },
        { id: `${prefix}window`, label: "על פני כמה שנות שירות נצבר", unit: "שנים", example: 12, help: "שנים עד הזכאות. אחריהן לא נצבר יותר" },
      ];
    case "tiers":
      return [
        { id: `${prefix}t1`, label: "סכום לשנה בשנים הראשונות", unit: "₪", example: 1_000 },
        { id: `${prefix}t1Years`, label: "עד כמה שנים", unit: "שנים", example: 5 },
        { id: `${prefix}t2`, label: "סכום לכל שנה אחריהן", unit: "₪", example: 4_000 },
        { id: `${prefix}cap`, label: "תקרה", unit: "₪", optional: true, help: "הסכום המרבי, אם יש", example: 40_000 },
      ];
    case "routes":
      return [
        { id: `${prefix}grant`, label: "המענק", unit: "₪", example: 45_000 },
        { id: `${prefix}minAge`, label: "גיל מינימלי במסלול הוותק", unit: "שנים", example: 60 },
        { id: `${prefix}years`, label: "שנות ותק במסלול הוותק", unit: "שנים", example: 25 },
        { id: `${prefix}retire`, label: "גיל הזכאות בלי תנאי ותק", unit: "שנים", example: 67 },
      ];
    default:
      return [];
  }
}

const BENEFIT_OPTIONS: Option[] = [
  { value: "perYear", label: "סכום קבוע לכל שנת שירות" },
  { value: "salary", label: "לפי השכר האחרון", hint: "למשל משכורת × שנות ותק" },
  { value: "lump", label: "מענק אחד אחרי מספר שנים", hint: "מענק יובל, שבתון, או מענק עם תקופת צבירה" },
  { value: "tiers", label: "מדרגות, אולי עם תקרה", hint: "נבדוק: נוסחת התוכנית או קו ישר" },
  { value: "routes", label: "שני מסלולים לזכאות", hint: "גיל וּותק, או גיל בלבד" },
  { value: "amounts", label: "סכומים שנתיים נתונים", hint: "כמו בונוס על רווח כל שנה" },
];

function dbQuestions(a: Answers, plan: "db" | "olt"): Question[] {
  const qs: Question[] = [];
  if (plan === "olt") {
    qs.push({ id: "oltKind", kind: "choice", title: "מה ההטבה?", why: "אובדן כושר עבודה דורש בדיקה נוספת. כל השאר נמדד כמו הטבה מוגדרת.", options: [{ value: "regular", label: "מענק יובל, שבתון, בונוס רב־שנתי" }, { value: "disability", label: "אובדן כושר עבודה" }] });
    if (str(a, "oltKind") === "disability") {
      qs.push({ id: "disDepends", kind: "choice", title: "גובה ההטבה תלוי בוותק?", why: "תלוי בוותק: נצברת עם השירות. לא תלוי: מכירים רק כשהאירוע קורה (סעיף 157).", options: YES_NO("מודדים כמו הטבה מוגדרת", "מכירים כשהאירוע קורה") });
      if (str(a, "disDepends") === "no") {
        qs.push({ id: "disHappened", kind: "choice", title: "האירוע קרה השנה?", why: "אם לא, אין מה לרשום.", options: YES_NO("נרשום את העלות", "לא נרשם כלום") });
        qs.push({ id: "disForm", kind: "form", title: "הנתונים", why: "עלות ההטבה לעובד שנפגע.", fields: [year, ...(str(a, "disHappened") === "yes" ? [{ id: "disAmount", label: "עלות ההטבה", unit: "₪" as Unit, example: 180_000 }] : [])] });
        return qs;
      }
      if (str(a, "disDepends") !== "yes") return qs;
    }
    if (!str(a, "oltKind")) return qs;
  }
  qs.push({
    id: "mode",
    kind: "choice",
    title: "מה השאלה מבקשת?",
    why: "קובע אילו נתונים נבקש ואילו טבלאות נציג.",
    options: [
      { value: "year", label: "תנועה לשנה שלמה", hint: "פתיחה, שירות, ריבית, מדידה מחדש, סגירה ודוחות" },
      { value: "measure", label: "מדידה בתאריך אחד", hint: "חמשת הצעדים בלבד" },
      ...(plan === "db" ? [{ value: "note", label: "השלמת ביאור", hint: "נתון ביאור חלקי. מוצאים את השורה החסרה ואת השיעור" }] : []),
    ],
  });
  const mode = str(a, "mode");
  if (!mode) return qs;

  if (mode === "note") {
    qs.push({
      id: "noteOb",
      kind: "form",
      title: "מעגל ההתחייבות, כפי שהוא בביאור",
      why: "השאירו ריקה בדיוק שורה אחת: היא השורה החסרה. אם נתון שיעור, הריבית תחושב ממנו. אם נתונה ריבית, השיעור יימצא ממנה.",
      fields: [
        year,
        { id: "nRate", label: "שיעור היוון בתחילת השנה", unit: "%", optional: true, example: 4 },
        { id: "nOpening", label: "יתרת פתיחה", unit: "₪", optional: true, example: 1_200_000 },
        { id: "nService", label: "עלות שירות שוטף", unit: "₪", optional: true, example: 150_000 },
        { id: "nPast", label: "עלות שירות עבר", unit: "₪", optional: true },
        { id: "nInterest", label: "עלות ריבית", unit: "₪", optional: true },
        { id: "nPayments", label: "תשלומים לעובדים", unit: "₪", optional: true, example: 80_000 },
        { id: "nPn", label: "מדידה מחדש (הפסד בחיובי, רווח במינוס)", unit: "₪", optional: true },
        { id: "nClosing", label: "יתרת סגירה", unit: "₪", optional: true, example: 1_340_000 },
      ],
    });
    qs.push({ id: "noteHasAssets", kind: "choice", title: "יש בביאור גם נכסי תכנית?", why: "אם כן, נשלים גם את המעגל שלהם.", options: YES_NO("יש קרן", "רק התחייבות") });
    if (str(a, "noteHasAssets") === "yes")
      qs.push({
        id: "noteAs",
        kind: "form",
        title: "מעגל הנכסים, כפי שהוא בביאור",
        why: "גם כאן שורה אחת ריקה. הכנסות הריבית באותו שיעור כמו ההתחייבות.",
        fields: [
          { id: "aOpening", label: "יתרת פתיחה", unit: "₪", optional: true, example: 900_000 },
          { id: "aInterest", label: "הכנסות ריבית", unit: "₪", optional: true },
          { id: "aContrib", label: "הפקדות", unit: "₪", optional: true, example: 120_000 },
          { id: "aPaid", label: "תשלומים מהקרן", unit: "₪", optional: true, example: 50_000 },
          { id: "aPn", label: "מדידה מחדש (רווח בחיובי, הפסד במינוס)", unit: "₪", optional: true },
          { id: "aClosing", label: "יתרת סגירה", unit: "₪", optional: true, example: 1_000_000 },
        ],
      });
    return qs;
  }

  qs.push({ id: "benefit", kind: "choice", title: "איך ההטבה נקבעת?", why: "מכאן נדע איך לייחס אותה לשנות השירות.", options: BENEFIT_OPTIONS });
  if (!ben(a)) return qs;
  if (ben(a) === "salary") qs.push({ id: "salaryHow", kind: "choice", title: "מה נתון לגבי השכר?", why: "מהוונים את השכר הצפוי ביום התשלום, לא את השכר של היום.", options: [{ value: "final", label: "השכר הצפוי ביום התשלום" }, { value: "grow", label: "השכר של היום ושיעור העלייה", hint: "נחשב: שכר × (1 + עלייה) בחזקת השנים עד התשלום" }] });
  const tf = termFields("", a);
  if (tf.length) qs.push({ id: "termsForm", kind: "form", title: "תנאי ההטבה", why: "לפי מה שכתוב בתוכנית.", fields: tf });

  const events = list(a, "events");
  const amend = mode === "year" && events.includes("amend");
  const settle = mode === "year" && events.includes("settle");
  if (mode === "year") {
    qs.push({
      id: "events",
      kind: "multi",
      title: "מה קרה השנה?",
      why: "מסמנים הכול. לכל סימון יישאלו רק השאלות שהוא צריך.",
      options: [
        ...(plan === "db" ? [{ value: "assets", label: "יש קרן או נכסי תכנית" }] : []),
        { value: "payments", label: "שולמו הטבות", hint: "כולל פרישה לפי התנאים, גם אם מוקדמת: היא לא סילוק" },
        { value: "amend", label: "התוכנית שונתה באמצע השנה", hint: "תיקון או צמצום: שירות עבר" },
        { value: "settle", label: "סילוק", hint: "תשלום מחוץ לתנאים שמבטל את החוב, כמו העברה למבטח" },
        { value: "given", label: "יתרות נתונות", hint: "פתיחה או סגירה ששאלה נותנת, במקום למדוד אותן" },
      ],
    });
  }

  const s = ben(a) === "salary";
  const grow = s && str(a, "salaryHow") === "grow";
  const measureOnly = mode === "measure";
  const columns: Field[] = [
    { id: "name", label: "קבוצה", text: true, example: "כל העובדים" },
    { id: "heads", label: measureOnly ? "עובדים ביום המדידה" : "עובדים ב-1.1", unit: "עובדים", example: 20 },
    { id: "stay", label: "אחוז שצפוי להגיע לתשלום", unit: "%", optional: true, help: "ריק = כולם", example: 90 },
    { id: "served", label: measureOnly ? "שנות שירות ביום המדידה" : "שנות שירות ב-1.1", unit: "שנים", example: 5 },
    ...(ben(a) === "routes" ? [{ id: "hireAge", label: "גיל בקבלה לעבודה", unit: "שנים" as Unit, example: 35 }] : [{ id: "n", label: measureOnly ? "שנים עד התשלום מיום המדידה" : "שנים עד התשלום מסוף השנה", unit: "שנים" as Unit, example: 10, help: "לא שנות השירות! רק מה שנשאר עד התשלום" }]),
    ...(ben(a) === "tiers" ? [{ id: "expected", label: "שנות שירות צפויות בסך הכול", unit: "שנים" as Unit, example: 15 }] : []),
    ...(ben(a) === "amounts" ? [{ id: "accruedStart", label: "נצבר לעובד עד 1.1", unit: "₪" as Unit, example: 10_000 }, { id: "addedThisYear", label: "נוסף השנה לעובד", unit: "₪" as Unit, example: 12_000 }] : []),
    ...(s && !grow ? [{ id: "salary", label: "שכר צפוי ביום התשלום", unit: "₪" as Unit, example: 28_000 }] : []),
    ...(grow ? [{ id: "salaryNow", label: "שכר היום", unit: "₪" as Unit, example: 18_000 }, { id: "growth", label: "עלייה שנתית", unit: "%" as Unit, example: 3 }] : []),
    ...(ben(a) !== "routes" && ben(a) !== "amounts" ? [{ id: "uncounted", label: "שנים בתחילת העבודה שלא נספרות", unit: "שנים" as Unit, optional: true, help: "כשהזכאות מתחילה מאוחר" }] : []),
    ...(amend || settle ? [{ id: "headsEvent", label: "עובדים ביום האירוע", unit: "עובדים" as Unit, optional: true, help: "ריק = כמו ב-1.1" }, { id: "stayEvent", label: "אחוז צפוי ביום האירוע", unit: "%" as Unit, optional: true }] : []),
    ...(amend || settle ? (s ? [{ id: "salaryEvent", label: "שכר צפוי לפי הנחות יום האירוע", unit: "₪" as Unit, optional: true }] : []) : []),
    ...(amend ? [{ id: "headsAfter", label: "עובדים צפויים אחרי התיקון", unit: "עובדים" as Unit, optional: true, help: "רק בצמצום. ריק = בלי שינוי" }] : []),
    ...(mode === "year" ? [{ id: "headsEnd", label: "עובדים ב-31.12", unit: "עובדים" as Unit, optional: true, help: settle ? "ריק = אחרי הסילוק, לפי האחוז שסולק" : "ריק = כמו ב-1.1" }, { id: "stayEnd", label: "אחוז צפוי ב-31.12", unit: "%" as Unit, optional: true }] : []),
    ...(mode === "year" && s ? [{ id: "salaryEnd", label: "שכר צפוי לפי הנחות סוף השנה", unit: "₪" as Unit, optional: true, help: "ריק = בלי שינוי" }] : []),
  ];
  const exampleRow: Row = Object.fromEntries(columns.filter((c) => c.example !== undefined).map((c) => [c.id, String(c.example)]));
  qs.push({ id: "groups", kind: "rows", title: "מי בתוכנית", why: "כל קבוצה עם נתונים שונים בשורה משלה. אפשר גם עובד אחד.", addLabel: "הוספת קבוצה", min: 1, columns, example: [exampleRow] });

  if (measureOnly) {
    qs.push({ id: "measureForm", kind: "form", title: "יום המדידה, ושיעור ההיוון", why: "תשואת אג״ח קונצרני איכותי. שיעור ממשלתי רק אם אין שוק עמוק (סעיף 83).", fields: [{ id: "date", label: "יום המדידה", text: true, example: "31.12.2026" }, { id: "rate", label: "שיעור היוון", unit: "%", example: 5 }] });
    return qs;
  }

  qs.push({
    id: "ratesForm",
    kind: "form",
    title: "השנה, ושיעורי ההיוון",
    why: "תשואת אג״ח קונצרני איכותי בכל תאריך. שיעור ממשלתי רק אם אין שוק עמוק (סעיף 83).",
    fields: [year, { id: "iStart", label: "שיעור ב-1.1", unit: "%", help: "לריבית ולשירות שוטף", example: 5 }, { id: "iEnd", label: "שיעור ב-31.12", unit: "%", help: "לסגירה", example: 4.5 }],
  });

  if (amend) {
    qs.push({ id: "amendBenefit", kind: "choice", title: "מה ההטבה אחרי התיקון?", why: "לפי התנאים החדשים נמדדת גם היתרה אחרי התיקון.", options: BENEFIT_OPTIONS.filter((o) => o.value !== "amounts" && o.value !== "routes") });
    qs.push({
      id: "amendForm",
      kind: "form",
      title: "התיקון",
      why: "מפצלים את השנה ביום התיקון. שירות עבר: היתרה אחרי פחות היתרה לפני, באותו שיעור ובאותו n.",
      fields: [
        { id: "amendMonth", label: "התיקון בסוף חודש", unit: "", help: "1 עד 12. בסוף השנה = 12", example: 6 },
        { id: "amendRate", label: "שיעור ביום התיקון", unit: "%", example: 4.8 },
        ...termFields("amend_", { ...a, amend_benefit: str(a, "amendBenefit") }),
        { id: "amendComp", label: "פיצוי ששולם לעובדים על הקטנת ההטבה", unit: "₪", optional: true, help: "הוצאה מיידית" },
      ],
    });
  }
  if (settle) {
    qs.push({ id: "settleFrom", kind: "choice", title: "מאיפה שולם הסילוק?", why: "קובע אם הקרן יורדת או המזומן.", options: [...(events.includes("assets") ? [{ value: "assets", label: "מהקרן" }] : []), { value: "company", label: "מכספי החברה" }] });
    qs.push({
      id: "settleForm",
      kind: "form",
      title: "הסילוק",
      why: "קודם מודדים מחדש ביום הסילוק. אחר כך: היתרה שיצאה פחות התשלום, לרווח והפסד.",
      fields: [
        { id: "settleMonth", label: "הסילוק בסוף חודש", help: "1 עד 12", example: 6 },
        { id: "settleRate", label: "שיעור ביום הסילוק", unit: "%", example: 4.8 },
        { id: "settleShare", label: "אחוז מההתחייבות שסולק", unit: "%", help: "לפי מספר העובדים שסולקו", example: 25 },
        { id: "settlePaid", label: "הסכום ששולם", unit: "₪", example: 150_000 },
      ],
    });
  }
  if (mode === "year" && events.includes("payments"))
    qs.push({
      id: "payments",
      kind: "rows",
      title: "תשלומים לעובדים",
      why: "מורידים ריבית מיום התשלום. מהקרן יורד רק מה שיצא ממנה.",
      addLabel: "הוספת תשלום",
      min: 1,
      columns: [{ id: "amount", label: "סכום", unit: "₪", example: 60_000 }, { id: "month", label: "שולם בסוף חודש", help: "12 = ביום האחרון", example: 12 }, ...(events.includes("assets") ? [{ id: "fromAssets", label: "שולם מהקרן", check: true }] : [])],
      example: [{ amount: "60000", month: "12", fromAssets: false }],
    });
  if (mode === "year" && events.includes("assets")) {
    const hasEvent = amend || settle;
    qs.push({
      id: "assetsForm",
      kind: "form",
      title: "נכסי התכנית",
      why: "הכנסות הריבית באותו שיעור ובאותו פיצול כמו ההתחייבות (סעיף 125). בדקו שהקרן נפרדת, זמינה רק להטבות ולא לנושים.",
      fields: [
        { id: "assetsOpen", label: "שווי הוגן ב-1.1", unit: "₪", example: 800_000 },
        { id: "assetsClose", label: "שווי הוגן ב-31.12", unit: "₪", example: 1_200_000 },
        ...(hasEvent ? [{ id: "assetsEvent", label: "שווי הוגן ביום האירוע", unit: "₪" as Unit, optional: true, help: "אם נתון, הקרן נמדדת מחדש באותו יום (סעיף 99)" }] : []),
      ],
    });
    qs.push({
      id: "contributions",
      kind: "rows",
      title: "הפקדות לקרן",
      why: "הפקדה מרוויחה ריבית מיומה. ביום האחרון של השנה: בלי ריבית.",
      addLabel: "הוספת הפקדה",
      min: 0,
      columns: [{ id: "amount", label: "סכום", unit: "₪", example: 300_000 }, { id: "month", label: "הופקד בסוף חודש", help: "12 = ביום האחרון", example: 12 }],
      example: [{ amount: "300000", month: "12" }],
    });
    qs.push({
      id: "ceiling",
      kind: "choice",
      title: "ואם בקרן יותר מהחוב?",
      why: "עודף הוא נכס רק במידה שהחברה תפיק ממנו הטבה (סעיף 64).",
      options: [
        { value: "none", label: "כל העודף זמין לחברה", hint: "או שאין עודף" },
        { value: "zero", label: "העודף לא זמין לחברה", hint: "למשל נאמן מחליט מה לעשות בו: תקרה אפס" },
        { value: "amount", label: "תקרה נתונה", hint: "הערך הנוכחי של החזרים והפחתות" },
        { value: "mfr", label: "יש הפקדה מינימלית", hint: "IFRIC 14" },
      ],
    });
    if (str(a, "ceiling") === "amount") qs.push({ id: "ceilingForm", kind: "form", title: "התקרה", why: "הערך הנוכחי של ההטבות הכלכליות מהעודף, בכל תאריך.", fields: [{ id: "ceilOpen", label: "תקרה ב-1.1", unit: "₪", example: 30_000 }, { id: "ceilClose", label: "תקרה ב-31.12", unit: "₪", example: 40_000 }] });
    if (str(a, "ceiling") === "mfr")
      qs.push({
        id: "ceilingForm",
        kind: "form",
        title: "הפקדה מינימלית",
        why: "התקרה: עלות שירות עתידית פחות ההפקדות המינימליות בעדה, כל אחת בערך נוכחי, ולא מתחת לאפס.",
        fields: [
          { id: "mfrService", label: "עלות שירות לכל שנה עתידית", unit: "₪", example: 200_000 },
          { id: "mfrYears", label: "שנים עתידיות ב-1.1", unit: "שנים", example: 4 },
          { id: "mfrMin", label: "הפקדה מינימלית לשנה", unit: "₪", example: 120_000 },
        ],
      });
  }
  if (mode === "year" && events.includes("given"))
    qs.push({ id: "givenForm", kind: "form", title: "יתרות נתונות", why: "מה שתזינו יחליף את המדידה. מה שתשאירו ריק יימדד.", fields: [{ id: "givenOpen", label: "יתרת פתיחה", unit: "₪", optional: true }, { id: "givenClose", label: "יתרת סגירה", unit: "₪", optional: true }] });
  if (mode === "year" && plan === "db")
    qs.push({ id: "presentation", kind: "choice", title: "איפה מוצגת הריבית נטו?", why: "מדיניות של החברה. לא משנה את סך רווח והפסד.", options: [{ value: "finance", label: "בהוצאות מימון" }, { value: "salary", label: "בהוצאות השכר" }] });
  return qs;
}

// Termination.

function termQuestions(a: Answers): Question[] {
  const qs: Question[] = [
    { id: "termType", kind: "choice", title: "איך נוצרה ההטבה?", why: "בהצעה מודדים לפי מי שצפוי לקבל אותה (סעיף 170).", options: [{ value: "decision", label: "החלטת החברה לפטר", hint: "סגירת אתר, צמצום" }, { value: "offer", label: "הצעה לעזוב מרצון", hint: "פרישה מוקדמת" }] },
    { id: "termRecognised", kind: "choice", title: "עד יום הדוח, כבר אי אפשר לחזור מזה?", why: "מכירים במוקדם מבין שני מועדים: כשכבר אי אפשר למשוך את ההצעה, וכשמכירים בעלויות ארגון מחדש לפי IAS 37 (סעיף 165). החלטה פנימית בלי הודעה לא מספיקה.", options: YES_NO("תוכנית מפורטת שהודעה למושפעים, או הצעה שאי אפשר למשוך", "רק החלטה פנימית") },
  ];
  if (!str(a, "termType") || !str(a, "termRecognised")) return qs;
  if (str(a, "termRecognised") === "no") {
    qs.push({ id: "yearForm", kind: "form", title: "באיזו שנה?", why: "כדי לכתוב את הפתרון.", fields: [year] });
    return qs;
  }
  const offer = str(a, "termType") === "offer";
  qs.push({
    id: "termForm",
    kind: "form",
    title: "הסכום",
    why: offer ? "לפי מספר העובדים שצפויים לקבל את ההצעה." : "מה שההחלטה נותנת לכולם, לא לפי מי שצפוי לעזוב.",
    fields: [year, { id: "termHeads", label: offer ? "עובדים שצפויים לקבל" : "כל העובדים שמושפעים", unit: "עובדים", example: 60 }, { id: "termAmount", label: "הסכום שכל אחד יקבל בכל מקרה", unit: "₪", example: 8_000 }],
  });
  qs.push({ id: "termHasStay", kind: "choice", title: "יש תוספת למי שממשיך לעבוד עד הסגירה?", why: "תוספת שמותנית בהמשך עבודה היא שכר על שירות, ולא הטבת פיטורין (סעיף 162).", options: YES_NO("נפרוס על תקופת השירות", "אין תוספת") });
  if (str(a, "termHasStay") === "yes")
    qs.push({
      id: "termStay",
      kind: "form",
      title: "התוספת",
      why: "רק מי שצפוי להישאר, ורק החלק של התקופה שעברה עד יום הדוח.",
      fields: [
        { id: "stayExtra", label: "התוספת לעובד", unit: "₪", help: "מה שמעבר לסכום שכולם מקבלים", example: 7_000 },
        { id: "stayers", label: "עובדים שצפויים להישאר עד הסוף", unit: "עובדים", example: 36 },
        { id: "stayMonths", label: "חודשי השירות הדרושים", unit: "חודשים", example: 11 },
        { id: "stayElapsed", label: "חודשים שעברו עד יום הדוח", unit: "חודשים", example: 1 },
      ],
    });
  qs.push({ id: "termLate", kind: "choice", title: "משולם יותר מ-12 חודשים אחרי סוף השנה?", why: "אם כן, מהוונים (סעיף 169). אחרת לא.", options: YES_NO("מהוונים", "בלי היוון") });
  if (str(a, "termLate") === "yes") qs.push({ id: "termDisc", kind: "form", title: "ההיוון", why: "תשואת אג״ח קונצרני איכותי.", fields: [{ id: "termYears", label: "שנים מיום הדוח עד התשלום", unit: "שנים", example: 2 }, { id: "termRate", label: "שיעור היוון", unit: "%", example: 5 }] });
  return qs;
}

/** The questions for the answers so far, in order. */
export function questionsFor(a: Answers): Question[] {
  const t = str(a, "type");
  const qs: Question[] = [TYPE, ...classifyQuestions(a)];
  const postReached = t === "post" || (t === "unsure" && str(a, "c3") === "yes");
  if (postReached) qs.push(RISK);
  const k = kindOf(a);
  if (k === "short") qs.push(...shortQuestions(a));
  if (k === "dc") qs.push(...dcQuestions(a));
  if (k === "db") qs.push(...dbQuestions(a, "db"));
  if (k === "olt") qs.push(...dbQuestions(a, "olt"));
  if (k === "term") qs.push(...termQuestions(a));
  return qs;
}

// ---------------------------------------------------------------------------
// Checks.

const isNum = (s: string) => s.trim() !== "" && Number.isFinite(Number(s.replace(/,/g, "")));
const blankOr = (s: unknown) => typeof s !== "string" || s.trim() === "" || isNum(s);

/** What is wrong with a question's answer: empty when it can go on. */
export function errorsFor(q: Question, a: Answers): string[] {
  if (q.kind === "choice") return str(a, q.id) ? [] : ["בחרו תשובה אחת."];
  if (q.kind === "multi") return [];
  const checkField = (f: Field, v: unknown, where = "") => {
    if (f.check || f.select) return null;
    const s = typeof v === "string" ? v : "";
    if (f.text) return f.optional || s.trim() ? null : `${where}מלאו: ${f.label}.`;
    if (!blankOr(s)) return `${where}${f.label}: צריך מספר.`;
    if (!f.optional && !s.trim()) return `${where}מלאו: ${f.label}.`;
    const n = Number(s.replace(/,/g, ""));
    if (f.unit === "%" && n < 0) return `${where}${f.label}: אחוז לא יכול להיות שלילי.`;
    return null;
  };
  if (q.kind === "form") {
    const errs = q.fields.map((f) => checkField(f, a[f.id])).filter((e): e is string => !!e);
    if (q.id === "noteOb" && !errs.length) {
      const blanks = ["nOpening", "nService", "nInterest", "nPayments", "nPn", "nClosing"].filter((k) => !str(a, k).trim());
      const interestFromRate = str(a, "nRate").trim() && !str(a, "nInterest").trim();
      const missing = blanks.length - (interestFromRate ? 1 : 0);
      if (missing !== 1) errs.push(missing < 1 ? "אין שורה חסרה: השאירו ריקה שורה אחת." : "יש יותר משורה חסרה אחת. במעגל אפשר למצוא רק נעלם אחד.");
    }
    if (q.id === "noteAs" && !errs.length) {
      const blanks = ["aOpening", "aInterest", "aContrib", "aPaid", "aPn", "aClosing"].filter((k) => !str(a, k).trim());
      const known = (str(a, "nRate").trim() || (str(a, "nInterest").trim() && str(a, "nOpening").trim())) && !str(a, "aInterest").trim();
      const missing = blanks.length - (known ? 1 : 0);
      if (missing !== 1) errs.push(missing < 1 ? "אין שורה חסרה: השאירו ריקה שורה אחת." : "יש יותר משורה חסרה אחת. במעגל אפשר למצוא רק נעלם אחד.");
    }
    return errs;
  }
  const rows = rowsOf(a, q.id);
  if (rows.length < q.min) return [`הוסיפו לפחות שורה ${q.min === 1 ? "אחת" : ""}.`];
  return rows.flatMap((r, i) => q.columns.map((c) => checkField(c, r[c.id], `שורה ${i + 1}, `)).filter((e): e is string => !!e));
}

// ---------------------------------------------------------------------------
// From answers to the solver.

const dayCostOf = (salary: number, days: number, onCost: number) => (salary / days) * (1 + onCost);
const dayCalc = (salary: number, days: number, onCost: number) => `${fm(salary)} ÷ ${days}${onCost ? ` × ${(1 + onCost).toLocaleString("en-US", { maximumFractionDigits: 4 })}` : ""}`;

function termsFrom(a: Answers, benefit: string, prefix: string): Terms {
  switch (benefit) {
    case "perYear":
      return { kind: "perYear", amount: req(a, `${prefix}amount`) };
    case "salary":
      return { kind: "salary", share: req(a, `${prefix}share`) / 100 };
    case "lump":
      return { kind: "lump", grant: req(a, `${prefix}grant`), window: req(a, `${prefix}window`) };
    case "tiers":
      return { kind: "tiers", tiers: [{ upTo: req(a, `${prefix}t1Years`), perYear: req(a, `${prefix}t1`) }, { perYear: req(a, `${prefix}t2`) }], cap: num(a, `${prefix}cap`) };
    case "routes":
      return { kind: "routes", grant: req(a, `${prefix}grant`), minAge: req(a, `${prefix}minAge`), years: req(a, `${prefix}years`), retire: req(a, `${prefix}retire`) };
    default:
      return { kind: "amounts" };
  }
}

function groupFrom(a: Answers, r: Row, i: number, settleShare: number): DbGroup {
  const grow = str(a, "salaryHow") === "grow";
  const n = rn(r, "n");
  const stayOf = (id: string) => (rv(r, id) === undefined ? undefined : rn(r, id) / 100);
  const heads = rn(r, "heads");
  const salary = grow ? rn(r, "salaryNow") * (1 + rn(r, "growth") / 100) ** (n + 1) : rv(r, "salary");
  const headsEnd = rv(r, "headsEnd") ?? (settleShare ? heads * (1 - settleShare) : undefined);
  return {
    name: rt(r, "name", `קבוצה ${i + 1}`),
    heads,
    stay: stayOf("stay") ?? 1,
    served: rn(r, "served"),
    nEnd: n,
    uncounted: rv(r, "uncounted"),
    salary,
    expected: rv(r, "expected"),
    hireAge: rv(r, "hireAge"),
    accruedStart: rv(r, "accruedStart"),
    addedThisYear: rv(r, "addedThisYear"),
    atEvent: { heads: rv(r, "headsEvent"), stay: stayOf("stayEvent"), salary: rv(r, "salaryEvent") },
    atEnd: { heads: headsEnd, stay: stayOf("stayEnd"), salary: rv(r, "salaryEnd") },
    headsAfter: rv(r, "headsAfter"),
  };
}

export function dbInputFrom(a: Answers, plan: "db" | "olt"): DbInput {
  const events = list(a, "events");
  const terms = termsFrom(a, ben(a), "");
  let event: DbEvent | undefined;
  if (events.includes("amend")) {
    event = { type: "amend", month: req(a, "amendMonth"), rate: pct(a, "amendRate"), terms: termsFrom(a, str(a, "amendBenefit"), "amend_"), compensation: num(a, "amendComp") };
  } else if (events.includes("settle")) {
    event = { type: "settle", month: req(a, "settleMonth"), rate: pct(a, "settleRate"), share: pct(a, "settleShare"), paid: req(a, "settlePaid"), paidFromAssets: str(a, "settleFrom") === "assets" };
  }
  const settleShare = event?.type === "settle" ? event.share : 0;
  const ceiling = (): Ceiling => {
    switch (str(a, "ceiling")) {
      case "zero":
        return { kind: "zero" };
      case "amount":
        return { kind: "amount", opening: req(a, "ceilOpen"), closing: req(a, "ceilClose") };
      case "mfr":
        return { kind: "mfr", servicePerYear: req(a, "mfrService"), futureAtStart: req(a, "mfrYears"), minimum: req(a, "mfrMin") };
      default:
        return { kind: "none" };
    }
  };
  return {
    plan: plan === "olt" ? "otherLongTerm" : "postEmployment",
    year: req(a, "year"),
    terms,
    groups: rowsOf(a, "groups").map((r, i) => groupFrom(a, r, i, settleShare)),
    iStart: pct(a, "iStart"),
    iEnd: pct(a, "iEnd"),
    event,
    payments: events.includes("payments") ? rowsOf(a, "payments").map((r) => ({ amount: rn(r, "amount"), month: rn(r, "month"), fromAssets: r.fromAssets === true })) : undefined,
    assets: events.includes("assets") ? { opening: req(a, "assetsOpen"), closing: req(a, "assetsClose"), atEvent: num(a, "assetsEvent"), contributions: rowsOf(a, "contributions").map((r) => ({ amount: rn(r, "amount"), month: rn(r, "month") })), ceiling: ceiling() } : undefined,
    interestInSalary: str(a, "presentation") === "salary",
    openingGiven: events.includes("given") ? num(a, "givenOpen") : undefined,
    closingGiven: events.includes("given") ? num(a, "givenClose") : undefined,
  };
}

function solveDbAnswers(a: Answers, plan: "db" | "olt"): CalcSolution {
  if (plan === "olt" && str(a, "oltKind") === "disability" && str(a, "disDepends") === "no") return solveDisabilityEvent({ year: req(a, "year"), amount: req(a, "disAmount"), happened: str(a, "disHappened") === "yes" });
  if (str(a, "mode") === "note") {
    const hasAssets = str(a, "noteHasAssets") === "yes";
    return solveNoteYear({
      year: req(a, "year"),
      rate: num(a, "nRate") === undefined ? undefined : pct(a, "nRate"),
      obligation: { opening: num(a, "nOpening"), service: num(a, "nService"), past: num(a, "nPast"), interest: num(a, "nInterest"), payments: num(a, "nPayments"), pn: num(a, "nPn"), closing: num(a, "nClosing") },
      assets: hasAssets ? { opening: num(a, "aOpening"), interest: num(a, "aInterest"), contributions: num(a, "aContrib"), paid: num(a, "aPaid"), pn: num(a, "aPn"), closing: num(a, "aClosing") } : undefined,
    });
  }
  if (str(a, "mode") === "measure") {
    return solveMeasure({
      plan: plan === "olt" ? "otherLongTerm" : "postEmployment",
      date: str(a, "date"),
      terms: termsFrom(a, ben(a), ""),
      rate: pct(a, "rate"),
      groups: rowsOf(a, "groups").map((r, i) => {
        const g = groupFrom(a, r, i, 0);
        // Years to payment here are from the date itself, so a salary grown to payment takes one rise fewer than a year's opening would.
        const salary = str(a, "salaryHow") === "grow" ? rn(r, "salaryNow") * (1 + rn(r, "growth") / 100) ** rn(r, "n") : g.salary;
        return { ...g, salary, servedAtDate: rn(r, "served"), nAtDate: rn(r, "n") };
      }),
    });
  }
  return solveDbYear(dbInputFrom(a, plan));
}

/** The solution, once every question is answered. */
export function solveAnswers(a: Answers): CalcSolution {
  const k = kindOf(a);
  const y = req(a, "year");
  switch (k) {
    case "short": {
      if (str(a, "shortKind") === "bonus") {
        const obligation = str(a, "bonusObligation") === "yes";
        const base = req(a, "bonusBase");
        return solveBonus({ year: y || new Date().getFullYear(), obligation, base, baseCalc: "נתון", onCost: pct(a, "bonusOnCost"), stayShare: num(a, "bonusStay") === undefined ? 1 : pct(a, "bonusStay"), opening: req(a, "bonusOpening"), paid: req(a, "bonusPaid") });
      }
      if (str(a, "accumulates") === "no") {
        const other = str(a, "payer") === "other";
        const salary = req(a, "salary");
        const days = req(a, "workDays") || 1;
        const on = pct(a, "onCost");
        return solveNonAccumulating({ year: y, days: req(a, "naDays"), dayCost: other ? 0 : dayCostOf(salary, days, on), dayCostCalc: other ? undefined : dayCalc(salary, days, on), payShare: num(a, "naPay") === undefined ? 1 : pct(a, "naPay"), paidBySomeoneElse: other });
      }
      const vest = str(a, "vesting") === "full" ? 1 : str(a, "vesting") === "partial" ? pct(a, "vestShare") : 0;
      return solveAbsenceBenefit({
        year: y,
        order: str(a, "order") === "fifo" ? "fifo" : "lifo",
        vest,
        grades: rowsOf(a, "grades").map((r, i) => {
          const on = rn(r, "onCost") / 100;
          const salary = rn(r, "salary");
          const days = rn(r, "workDays") || 1;
          return { name: rt(r, "name", `דרג ${i + 1}`), dayCost: dayCostOf(salary, days, on), dayCostCalc: dayCalc(salary, days, on), entitlement: rn(r, "entitlement"), carried: [rn(r, "carried")], years: req(a, "lifeYears") || 1 };
        }),
        opening: rowsOf(a, "openingRows").map((r, i) => ({ name: rt(r, "name", `קבוצה ${i + 1}`), grade: Number(r.grade ?? 0) || 0, staff: rn(r, "staff"), use: rn(r, "use"), leaves: r.leaves === true, dayCost: rv(r, "dayCost") })),
        actual: rowsOf(a, "actualRows").map((r, i) => ({ name: rt(r, "name", `קבוצה ${i + 1}`), grade: Number(r.grade ?? 0) || 0, staff: rn(r, "staff"), use: rn(r, "use"), leaves: r.leaves === true, nextUse: rv(r, "nextUse"), nextLeaves: r.nextLeaves === true, dayCostPaid: rv(r, "dayCostPaid"), dayCostClose: rv(r, "dayCostClose") })),
      });
    }
    case "dc": {
      const plans =
        str(a, "dcHow") === "s14"
          ? rowsOf(a, "s14Rows").map((r, i) => {
              const expense = rn(r, "staff") * rn(r, "salary");
              return { name: rt(r, "name", `קבוצה ${i + 1}`), expense, calc: `${fm(rn(r, "staff"))} × ${fm(rn(r, "salary"))}`, paid: rv(r, "paid") ?? expense };
            })
          : rowsOf(a, "dcRows").map((r, i) => {
              const expense = (rn(r, "payroll") * rn(r, "rate")) / 100;
              return { name: rt(r, "name", `הסדר ${i + 1}`), expense, calc: `${fm(rn(r, "payroll"))} × ${rn(r, "rate")}%`, paid: rv(r, "paid") ?? expense };
            });
      return solveDcPlans({ year: y, plans });
    }
    case "db":
      return solveDbAnswers(a, "db");
    case "olt":
      return solveDbAnswers(a, "olt");
    case "term":
      return solveTermination({
        year: y,
        recognised: str(a, "termRecognised") === "yes",
        offer: str(a, "termType") === "offer",
        heads: req(a, "termHeads"),
        amount: req(a, "termAmount"),
        yearsToPay: str(a, "termLate") === "yes" ? req(a, "termYears") : undefined,
        rate: str(a, "termLate") === "yes" ? pct(a, "termRate") : undefined,
        stay: str(a, "termHasStay") === "yes" ? { extra: req(a, "stayExtra"), stayers: req(a, "stayers"), serviceMonths: req(a, "stayMonths"), monthsElapsed: req(a, "stayElapsed") } : undefined,
      });
    default:
      throw new Error("no kind");
  }
}

/** Whether "the next year" can follow this solution: a defined benefit or long-term year. */
export const canContinue = (a: Answers) => (kindOf(a) === "db" || kindOf(a) === "olt") && str(a, "mode") === "year";

/** The answers for the year after: closing balances open it, the same plan a year on, the amended terms now in force, this year's events gone. */
export function nextYearAnswers(a: Answers): Answers {
  const events = list(a, "events");
  const next: Answers = { ...a, year: String(req(a, "year") + 1), iStart: str(a, "iEnd"), iEnd: "", events: events.filter((e) => e === "assets") };
  if (events.includes("assets")) {
    next.assetsOpen = str(a, "assetsClose");
    next.assetsClose = "";
    next.assetsEvent = "";
    next.contributions = [];
    if (str(a, "ceiling") === "amount") {
      next.ceilOpen = str(a, "ceilClose");
      next.ceilClose = "";
    }
    if (str(a, "ceiling") === "mfr") next.mfrYears = String(req(a, "mfrYears") - 1);
  }
  next.payments = [];
  next.givenOpen = "";
  next.givenClose = "";
  if (events.includes("amend") && str(a, "amendBenefit")) {
    next.benefit = str(a, "amendBenefit");
    for (const k of Object.keys(a)) if (k.startsWith("amend_")) next[k.slice(6)] = a[k];
  }
  const settle = events.includes("settle") ? pct(a, "settleShare") : 0;
  next.groups = rowsOf(a, "groups").map((r) => {
    const out: Row = { ...r, served: String(rn(r, "served") + 1), headsEvent: "", stayEvent: "", salaryEvent: "", headsAfter: "", headsEnd: "", stayEnd: "", salaryEnd: "" };
    if (rv(r, "n") !== undefined) out.n = String(Math.max(0, rn(r, "n") - 1));
    const heads = rv(r, "headsEnd") ?? rn(r, "heads") * (1 - settle);
    out.heads = String(heads);
    if (rv(r, "stayEnd") !== undefined) out.stay = String(rv(r, "stayEnd"));
    if (rv(r, "salaryEnd") !== undefined) out.salary = String(rv(r, "salaryEnd"));
    return out;
  });
  return next;
}
