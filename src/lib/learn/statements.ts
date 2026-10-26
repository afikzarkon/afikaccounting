/**
 * Financial statements from a final trial balance (IFRS 18, in the course's
 * format): every account says where it goes — a line of the statement of
 * financial position, a line of profit or loss, other comprehensive income, or
 * no line of its own because it nets into another — and the statements are
 * built from those choices. The same builder answers the course's solution and
 * whatever a student assigns, so the page can show what each choice does.
 *
 * Course simplifications: no income taxes and no discontinued operations, so
 * net profit equals profit before tax; expenses are presented by function.
 */

export type Side = "dr" | "cr";
export type Section = "ca" | "nca" | "cl" | "ncl" | "eq";

/** A line of the statement of financial position. */
export type SofpLine = { id: string; label: string; section: Section };

/** The profit-or-loss lines, in the course's IFRS 18 layout. */
export type PlLineId = "sales" | "cogs" | "selling" | "rnd" | "admin" | "otherIncome" | "otherExpense" | "investment" | "finance";
export type Category = "operating" | "investing" | "financing";
export const PL_LINES: { id: PlLineId; label: string; category: Category; sign: 1 | -1 }[] = [
  { id: "sales", label: "הכנסות ממכירות", category: "operating", sign: 1 },
  { id: "cogs", label: "עלות המכר", category: "operating", sign: -1 },
  { id: "selling", label: "הוצאות מכירה ושיווק", category: "operating", sign: -1 },
  { id: "rnd", label: "הוצאות מחקר ופיתוח", category: "operating", sign: -1 },
  { id: "admin", label: "הוצאות הנהלה וכלליות", category: "operating", sign: -1 },
  { id: "otherIncome", label: "הכנסות תפעוליות אחרות", category: "operating", sign: 1 },
  { id: "otherExpense", label: "הוצאות תפעוליות אחרות", category: "operating", sign: -1 },
  { id: "investment", label: "הכנסות מימון (קטגוריית השקעה)", category: "investing", sign: 1 },
  { id: "finance", label: "הוצאות מימון", category: "financing", sign: -1 },
];
export const CATEGORY_LABEL: Record<Category, string> = { operating: "תפעולית", investing: "השקעה", financing: "מימון" };

/**
 * Where an account goes:
 * - a line id — of the statement of financial position, or of profit or loss;
 * - "allocate": an expense split between selling and administration by its percentages;
 * - "oci": other comprehensive income;
 * - "net": no line of its own — it reduces (or completes) the line in `into`;
 * - "split": a loan, split into the part due within 12 months and the rest.
 */
export type Dest = string;
export const ALLOCATE = "allocate";
export const OCI = "oci";
export const NET = "net";
export const SPLIT = "split";

export type Account = {
  name: string;
  side: Side;
  amount: number;
  dest: Dest;
  /** For "net": the line it nets into. */
  into?: string;
  /** For "allocate": the shares of administration and of selling and marketing (they add up to 1). */
  alloc?: { admin: number; selling: number };
  /** For "split": the current part and the lines of both parts. */
  split?: { current: number; currentLine: string; longLine: string };
  /** The course's trial balance shows this year's revaluation twice: as the reserve and as OCI. This is the reserve. */
  ociTwin?: boolean;
  /** One sentence: why it goes there. */
  why: string;
};

export type Question = {
  id: string;
  company: string;
  date: string;
  year: string;
  /** The statement of financial position's lines, in the order shown. */
  sofp: SofpLine[];
  accounts: Account[];
  /** The facts given besides the trial balance. */
  facts: string[];
};

const r2 = (v: number) => Math.round(v * 100) / 100;
const signed = (a: Account) => (a.side === "dr" ? a.amount : -a.amount);

/** A student's (or the course's) choice of destination for each account, by name. */
export type Assignment = Record<string, Dest | undefined>;
export const solutionOf = (q: Question): Assignment => Object.fromEntries(q.accounts.map((a) => [a.name, a.dest]));

export type AllocRow = { name: string; amount: number; adminPct: number; admin: number; sellingPct: number; selling: number };
export type Built = {
  /** Each line's amount: assets positive, liabilities and equity positive on their own side. */
  sofp: Record<string, number>;
  pl: Record<PlLineId, number>;
  oci: number;
  alloc: AllocRow[];
  grossProfit: number;
  operatingProfit: number;
  beforeFinancing: number;
  beforeTax: number;
  netProfit: number;
  totalComprehensive: number;
  openingRetained: number;
  retained: number;
  totals: Record<Section, number>;
  totalAssets: number;
  totalLiabilitiesEquity: number;
  /** Assets less liabilities and equity: 0 when the statements balance. */
  gap: number;
  /** Accounts not yet assigned. */
  unassigned: string[];
};

export const debits = (q: Question) => r2(q.accounts.filter((a) => a.side === "dr").reduce((s, a) => s + a.amount, 0));
export const credits = (q: Question, withTwin = true) => r2(q.accounts.filter((a) => a.side === "cr" && (withTwin || !a.ociTwin)).reduce((s, a) => s + a.amount, 0));
/**
 * Retained earnings at the start of the year, the one balance the trial balance leaves out: debits less credits,
 * counting this year's revaluation once (the reserve is the OCI line's twin).
 */
export const openingRetained = (q: Question) => r2(debits(q) - credits(q, false));

/** Both statements from an assignment. Retained earnings are the opening balance plus the year's net profit, so a wrong choice shows as a gap. */
export function build(q: Question, assign: Assignment = solutionOf(q)): Built {
  const sofp: Record<string, number> = Object.fromEntries(q.sofp.map((l) => [l.id, 0]));
  const pl = Object.fromEntries(PL_LINES.map((l) => [l.id, 0])) as Record<PlLineId, number>;
  const sectionOf = (id: string) => q.sofp.find((l) => l.id === id)?.section;
  const isPl = (id: string): id is PlLineId => PL_LINES.some((l) => l.id === id);
  let oci = 0;
  const alloc: AllocRow[] = [];
  const unassigned: string[] = [];
  // An amount into a line: assets and expenses grow with debits, the rest with credits.
  const put = (line: string, v: number) => {
    if (isPl(line)) {
      const sign = PL_LINES.find((l) => l.id === line)!.sign;
      pl[line] += sign === 1 ? -v : v;
    } else if (line in sofp) {
      const sec = sectionOf(line)!;
      sofp[line] += sec === "ca" || sec === "nca" ? v : -v;
    }
  };
  for (const a of q.accounts) {
    const d = assign[a.name];
    const v = signed(a);
    if (!d) {
      unassigned.push(a.name);
      continue;
    }
    if (d === OCI) oci += -v;
    else if (d === NET) put(a.into ?? "", v);
    else if (d === SPLIT && a.split) {
      put(a.split.currentLine, v > 0 ? a.split.current : -a.split.current);
      put(a.split.longLine, v > 0 ? v - a.split.current : v + a.split.current);
    } else if (d === ALLOCATE) {
      const share = a.alloc ?? { admin: 0.6, selling: 0.4 };
      const admin = r2(v * share.admin);
      const selling = r2(v - admin);
      alloc.push({ name: a.name, amount: v, adminPct: share.admin, admin, sellingPct: share.selling, selling });
      put("admin", admin);
      put("selling", selling);
    } else put(d, v);
  }
  for (const k of Object.keys(sofp)) sofp[k] = r2(sofp[k]);
  for (const k of Object.keys(pl) as PlLineId[]) pl[k] = r2(pl[k]);
  const grossProfit = r2(pl.sales - pl.cogs);
  const operatingProfit = r2(grossProfit - pl.selling - pl.rnd - pl.admin + pl.otherIncome - pl.otherExpense);
  const beforeFinancing = r2(operatingProfit + pl.investment);
  const beforeTax = r2(beforeFinancing - pl.finance);
  const netProfit = beforeTax;
  const opening = openingRetained(q);
  const retained = r2(opening + netProfit);
  const totals = { ca: 0, nca: 0, cl: 0, ncl: 0, eq: 0 } as Record<Section, number>;
  for (const l of q.sofp) totals[l.section] = r2(totals[l.section] + sofp[l.id]);
  totals.eq = r2(totals.eq + retained);
  const totalAssets = r2(totals.ca + totals.nca);
  const totalLiabilitiesEquity = r2(totals.cl + totals.ncl + totals.eq);
  return {
    sofp,
    pl,
    oci: r2(oci),
    alloc,
    grossProfit,
    operatingProfit,
    beforeFinancing,
    beforeTax,
    netProfit,
    totalComprehensive: r2(netProfit + oci),
    openingRetained: opening,
    retained,
    totals,
    totalAssets,
    totalLiabilitiesEquity,
    gap: r2(totalAssets - totalLiabilitiesEquity),
    unassigned,
  };
}

/** The destinations a student can choose from, for this question: its lines, then the special ones. */
export function destOptions(q: Question): { value: Dest; label: string; group: string }[] {
  const group: Record<Section, string> = { ca: "מאזן — נכסים שוטפים", nca: "מאזן — נכסים בלתי שוטפים", cl: "מאזן — התחייבויות שוטפות", ncl: "מאזן — התחייבויות בלתי שוטפות", eq: "מאזן — הון" };
  return [
    ...q.sofp.map((l) => ({ value: l.id, label: l.label, group: group[l.section] })),
    { value: SPLIT, label: "הלוואה — מפוצלת לחלויות שוטפות ולזמן ארוך", group: "מאזן — התחייבויות" },
    ...PL_LINES.filter((l) => l.id !== "selling" && l.id !== "admin").map((l) => ({ value: l.id, label: l.label, group: `רווח והפסד — ${CATEGORY_LABEL[l.category]}` })),
    { value: ALLOCATE, label: "הוצאות לפי טבלת החלוקה (הנהלה / מכירה ושיווק)", group: "רווח והפסד — תפעולית" },
    { value: OCI, label: "רווח כולל אחר", group: "רווח כולל אחר" },
    { value: NET, label: "לא שורה בפני עצמה — מקטינה או משלימה שורה אחרת", group: "לא נכנסת כשורה" },
  ];
}

// ---------------------------------------------------------------------------
// The course's question: "HaYuval" Ltd., which sells products to the plastics industry.

const GENERAL = { admin: 0.6, selling: 0.4 };
const ADMIN = { admin: 1, selling: 0 };
const SELLING = { admin: 0, selling: 1 };

export const HAYUVAL: Question = {
  id: "hayuval",
  company: "\"היובל\" בע\"מ",
  date: "31.12.2019",
  year: "2019",
  sofp: [
    { id: "cash", label: "מזומן", section: "ca" },
    { id: "receivables", label: "לקוחות, נטו", section: "ca" },
    { id: "inventory", label: "מלאי", section: "ca" },
    { id: "prepaid", label: "הוצאות שכר דירה מראש", section: "ca" },
    { id: "debtors", label: "חייבים", section: "ca" },
    { id: "vehicles", label: "כלי רכב, נטו", section: "nca" },
    { id: "building", label: "מבנה, נטו", section: "nca" },
    { id: "printer", label: "מדפסת תלת מימד (שווי הוגן)", section: "nca" },
    { id: "suppliers", label: "ספקים", section: "cl" },
    { id: "creditors", label: "זכאים", section: "cl" },
    { id: "accrued", label: "הוצאות טלפון לשלם", section: "cl" },
    { id: "currentLoan", label: "חלויות שוטפות של הלוואה לזמן ארוך", section: "cl" },
    { id: "longLoan", label: "הלוואה לזמן ארוך", section: "ncl" },
    { id: "capital", label: "הון מניות", section: "eq" },
    { id: "reserve", label: "קרן הערכה מחדש", section: "eq" },
  ],
  facts: [
    "70% מהוצאות השכר הן של עובדי ההנהלה, וכל השאר מיוחס לעובדי מכירה ושיווק.",
    "כלי הרכב משמשים את סוכני המכירות בלבד. המדפסת התלת-ממדית משמשת את ההנהלה בלבד. המבנה משמש 30% את מחלקת מכירה ושיווק ו-70% את ההנהלה.",
    "יתרת ההוצאות בחברה, שלא שייכות באופן ספציפי לאחת מקבוצות ההוצאות, מיוחסות 40% למכירה ושיווק והיתר להנהלה וכלליות.",
    "החברה נטלה הלוואה מהבנק ביום 31.12.2019, לפירעון ב-4 תשלומים שנתיים שווים של קרן החל מ-31.12.2020.",
  ],
  accounts: [
    { name: "לקוחות", side: "dr", amount: 820_000, dest: "receivables", why: "נכס שוטף — הלקוחות ישלמו בתוך שנה. מוצג בנטו, אחרי ההפרשה." },
    { name: "כלי רכב - עלות", side: "dr", amount: 480_000, dest: "vehicles", why: "רכוש קבוע — נכס בלתי שוטף, מוצג בנטו." },
    { name: "כלי רכב - פחת נצבר", side: "cr", amount: 168_000, dest: NET, into: "vehicles", why: "מקטין את כלי הרכב — לא שורה בפני עצמה." },
    { name: "מבנה – עלות", side: "dr", amount: 2_400_000, dest: "building", why: "רכוש קבוע — נכס בלתי שוטף, מוצג בנטו." },
    { name: "מבנה - פחת נצבר", side: "cr", amount: 288_000, dest: NET, into: "building", why: "מקטין את המבנה — לא שורה בפני עצמה." },
    { name: "מדפסת תלת מימד - שווי הוגן", side: "dr", amount: 535_000, dest: "printer", why: "רכוש קבוע במודל הערכה מחדש — בשווי ההוגן." },
    { name: "מזומן", side: "dr", amount: 430_000, dest: "cash", why: "נכס שוטף." },
    { name: "מלאי פתיחה", side: "dr", amount: 250_000, dest: "cogs", why: "נכנס לעלות המכר: פתיחה + קניות − סגירה." },
    { name: "הוצאות שכר", side: "dr", amount: 180_000, dest: ALLOCATE, alloc: { admin: 0.7, selling: 0.3 }, why: "70% הנהלה ו-30% מכירה ושיווק (נתון 1)." },
    { name: "הוצאות ארנונה", side: "dr", amount: 100_000, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% מכירה ושיווק, 60% הנהלה (נתון 3)." },
    { name: "הוצאות חשמל", side: "dr", amount: 70_800, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% / 60% (נתון 3)." },
    { name: "הוצאות טלפון", side: "dr", amount: 144_000, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% / 60% (נתון 3)." },
    { name: "הוצאות שכר דירה", side: "dr", amount: 90_000, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% / 60% (נתון 3)." },
    { name: "חייבים", side: "dr", amount: 100_000, dest: "debtors", why: "נכס שוטף." },
    { name: "זכאים", side: "cr", amount: 60_000, dest: "creditors", why: "התחייבות שוטפת." },
    { name: "הוצאות פחת מדפסת תלת מימד", side: "dr", amount: 95_000, dest: ALLOCATE, alloc: ADMIN, why: "המדפסת משמשת את ההנהלה בלבד — 100% הנהלה (נתון 2)." },
    { name: "הוצאות פרסום", side: "dr", amount: 90_000, dest: ALLOCATE, alloc: SELLING, why: "פרסום הוא מטבעו הוצאת שיווק — 100% מכירה ושיווק." },
    { name: "הוצאות כיבודים", side: "dr", amount: 60_000, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% / 60% (נתון 3)." },
    { name: "ספקים", side: "cr", amount: 495_000, dest: "suppliers", why: "התחייבות שוטפת." },
    { name: "הפרשה להפסדי אשראי חזויים", side: "cr", amount: 82_000, dest: NET, into: "receivables", why: "מקטינה את הלקוחות — מציגים לקוחות, נטו." },
    { name: "הוצאות פחת כלי רכב", side: "dr", amount: 40_000, dest: ALLOCATE, alloc: SELLING, why: "כלי הרכב משמשים את סוכני המכירות — 100% מכירה ושיווק (נתון 2)." },
    { name: "קניות", side: "dr", amount: 1_780_000, dest: "cogs", why: "נכנסות לעלות המכר." },
    { name: "הוצאות שכר דירה מראש", side: "dr", amount: 270_000, dest: "prepaid", why: "הוצאה ששולמה מראש — נכס שוטף." },
    { name: "רווח הון ממכירת כלי רכב", side: "cr", amount: 19_000, dest: "otherIncome", why: "רווח מגריעת רכוש קבוע — הכנסות תפעוליות אחרות (רכוש קבוע נשאר בתפעולית)." },
    { name: "קרן הערכה מחדש - מדפסת תלת מימד", side: "cr", amount: 30_000, dest: "reserve", ociTwin: true, why: "היתרה בהון — קרנות הון. אותם 30,000 של רווח כולל אחר, בתפקיד השני." },
    { name: "הכנסות ממכירות", side: "cr", amount: 4_147_000, dest: "sales", why: "הכנסות — הקטגוריה התפעולית." },
    { name: "הלוואה", side: "cr", amount: 500_000, dest: SPLIT, split: { current: 125_000, currentLine: "currentLoan", longLine: "longLoan" }, why: "4 תשלומים שווים: 125,000 בתוך 12 חודשים (שוטף), 375,000 אחריהם." },
    { name: "עמלות בנק ודמי ניהול חשבון", side: "dr", amount: 6_800, dest: "finance", why: "עלות של מימון — קטגוריית מימון." },
    { name: "הון מניות", side: "cr", amount: 100_000, dest: "capital", why: "הון." },
    { name: "רווח כולל אחר בגין הערכה מחדש של רכוש קבוע", side: "cr", amount: 30_000, dest: OCI, why: "תנועת השנה — ברווח הכולל האחר, מתחת לרווח הנקי." },
    { name: "הוצאות ביטוח", side: "dr", amount: 120_000, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% / 60% (נתון 3)." },
    { name: "מלאי סגירה מאזן", side: "dr", amount: 420_000, dest: "inventory", why: "המלאי שנשאר — נכס שוטף." },
    { name: "מלאי סגירה רווח והפסד", side: "cr", amount: 420_000, dest: NET, into: "cogs", why: "מקטין את עלות המכר — לא שורת הכנסה." },
    { name: "הוצאות פחת מבנה", side: "dr", amount: 64_000, dest: ALLOCATE, alloc: { admin: 0.7, selling: 0.3 }, why: "המבנה: 70% הנהלה, 30% מכירה ושיווק (נתון 2)." },
    { name: "הוצאות טלפון לשלם", side: "cr", amount: 12_000, dest: "accrued", why: "הוצאה שעוד לא שולמה — התחייבות שוטפת." },
    { name: "הוצאות הפסדי אשראי חזויים", side: "dr", amount: 28_000, dest: ALLOCATE, alloc: ADMIN, why: "בקורס: הוצאות הפרשה להפסדי אשראי — הנהלה וכלליות." },
  ],
};

// ---------------------------------------------------------------------------
// Practice: an invented company, with what HaYuval doesn't have.

export const ALON: Question = {
  id: "alon",
  company: "\"אלון\" בע\"מ",
  date: "31.12.2024",
  year: "2024",
  sofp: [
    { id: "cash", label: "מזומנים ושווי מזומנים", section: "ca" },
    { id: "deposit", label: "פיקדון בבנק לזמן קצר", section: "ca" },
    { id: "receivables", label: "לקוחות, נטו", section: "ca" },
    { id: "inventory", label: "מלאי", section: "ca" },
    { id: "debtors", label: "חייבים ויתרות חובה", section: "ca" },
    { id: "ppe", label: "רכוש קבוע, נטו", section: "nca" },
    { id: "bank", label: "אשראי מתאגידים בנקאיים", section: "cl" },
    { id: "suppliers", label: "ספקים ונותני שירותים", section: "cl" },
    { id: "creditors", label: "זכאים ויתרות זכות", section: "cl" },
    { id: "longLoan", label: "הלוואות מבנקים", section: "ncl" },
    { id: "capital", label: "הון מניות", section: "eq" },
  ],
  facts: [
    "60% מהוצאות השכר הן של ההנהלה, והשאר של מחלקת מכירה ושיווק.",
    "הציוד משמש חצי את ההנהלה וחצי את מחלקת המכירה.",
    "יתרת ההוצאות הכלליות מיוחסות 40% למכירה ושיווק והיתר להנהלה וכלליות.",
    "הפיקדון הופקד ל-6 חודשים, והריבית עליו נצברה עד 31.12.2024.",
    "ההלוואה מהבנק נפרעת ב-5 תשלומים שנתיים שווים של קרן, הראשון ב-30.6.2025.",
  ],
  accounts: [
    { name: "מזומן", side: "dr", amount: 350_000, dest: "cash", why: "נכס שוטף." },
    { name: "פיקדון בבנק ל-6 חודשים", side: "dr", amount: 300_000, dest: "deposit", why: "יתממש בתוך 12 חודשים — נכס שוטף." },
    { name: "לקוחות", side: "dr", amount: 640_000, dest: "receivables", why: "נכס שוטף, בנטו." },
    { name: "הפרשה להפסדי אשראי חזויים", side: "cr", amount: 48_000, dest: NET, into: "receivables", why: "מקטינה את הלקוחות." },
    { name: "מקדמות לספקים", side: "dr", amount: 35_000, dest: "debtors", why: "חייבים ויתרות חובה." },
    { name: "הכנסות ריבית לקבל", side: "dr", amount: 6_000, dest: "debtors", why: "הכנסה שעוד לא התקבלה — חייבים ויתרות חובה." },
    { name: "הוצאות ביטוח מראש", side: "dr", amount: 24_000, dest: "debtors", why: "הוצאה מראש — חייבים ויתרות חובה." },
    { name: "מלאי פתיחה", side: "dr", amount: 180_000, dest: "cogs", why: "לעלות המכר." },
    { name: "קניות", side: "dr", amount: 1_240_000, dest: "cogs", why: "לעלות המכר." },
    { name: "מלאי סגירה מאזן", side: "dr", amount: 210_000, dest: "inventory", why: "נכס שוטף." },
    { name: "מלאי סגירה רווח והפסד", side: "cr", amount: 210_000, dest: NET, into: "cogs", why: "מקטין את עלות המכר." },
    { name: "ציוד - עלות", side: "dr", amount: 900_000, dest: "ppe", why: "רכוש קבוע, נטו." },
    { name: "ציוד - פחת נצבר", side: "cr", amount: 270_000, dest: NET, into: "ppe", why: "מקטין את הציוד." },
    { name: "הפסד הון ממכירת ציוד", side: "dr", amount: 12_000, dest: "otherExpense", why: "הפסד מגריעת רכוש קבוע — הוצאות תפעוליות אחרות." },
    { name: "הוצאות שכר", side: "dr", amount: 600_000, dest: ALLOCATE, alloc: { admin: 0.6, selling: 0.4 }, why: "60% הנהלה, 40% מכירה ושיווק (נתון 1)." },
    { name: "הוצאות מחקר ופיתוח", side: "dr", amount: 150_000, dest: "rnd", why: "שורה משלה בקבוצת המחקר והפיתוח." },
    { name: "הוצאות פחת ציוד", side: "dr", amount: 90_000, dest: ALLOCATE, alloc: { admin: 0.5, selling: 0.5 }, why: "חצי הנהלה, חצי מכירה (נתון 2)." },
    { name: "הוצאות שכירות", side: "dr", amount: 120_000, dest: ALLOCATE, alloc: GENERAL, why: "הוצאה כללית: 40% / 60% (נתון 3)." },
    { name: "הוצאות פרסום", side: "dr", amount: 80_000, dest: ALLOCATE, alloc: SELLING, why: "מטבען הוצאת שיווק." },
    { name: "עמלות סוכני מכירות", side: "dr", amount: 45_000, dest: ALLOCATE, alloc: SELLING, why: "קשורות ישירות למכירה." },
    { name: "הוצאות הפסדי אשראי חזויים", side: "dr", amount: 18_000, dest: ALLOCATE, alloc: ADMIN, why: "בקורס — הנהלה וכלליות." },
    { name: "הוצאות ריבית על הלוואה", side: "dr", amount: 32_000, dest: "finance", why: "עלות גיוס חוב — מימון." },
    { name: "עמלות בנק", side: "dr", amount: 4_000, dest: "finance", why: "מימון." },
    { name: "הכנסות ריבית מפיקדון", side: "cr", amount: 9_000, dest: "investment", why: "תשואה על נכס שעומד בפני עצמו — קטגוריית השקעה." },
    { name: "הכנסות ממכירות", side: "cr", amount: 3_400_000, dest: "sales", why: "תפעולית." },
    { name: "ספקים", side: "cr", amount: 310_000, dest: "suppliers", why: "התחייבות שוטפת." },
    { name: "מקדמות מלקוחות", side: "cr", amount: 40_000, dest: "creditors", why: "זכאים ויתרות זכות." },
    { name: "הכנסות מראש", side: "cr", amount: 25_000, dest: "creditors", why: "זכאים ויתרות זכות." },
    { name: "הוצאות לשלם", side: "cr", amount: 18_000, dest: "creditors", why: "זכאים ויתרות זכות." },
    { name: "משיכת יתר", side: "cr", amount: 22_000, dest: "bank", why: "אשראי מתאגידים בנקאיים." },
    { name: "הלוואה מבנק", side: "cr", amount: 400_000, dest: SPLIT, split: { current: 80_000, currentLine: "bank", longLine: "longLoan" }, why: "5 תשלומים: 80,000 בתוך 12 חודשים (לאשראי מתאגידים בנקאיים), 320,000 לזמן ארוך." },
    { name: "הון מניות", side: "cr", amount: 100_000, dest: "capital", why: "הון." },
  ],
};

export const QUESTIONS = { hayuval: HAYUVAL, alon: ALON } as const;

/** Splits a loan repaid in equal instalments: the part due within 12 months of the reporting date, and the rest. */
export function splitLoan(amount: number, payments: number, firstWithinYear: boolean) {
  const each = payments > 0 ? amount / payments : 0;
  const current = firstWithinYear ? each : 0;
  return { each: r2(each), current: r2(current), long: r2(amount - current) };
}

// ---------------------------------------------------------------------------
// Statements as they are presented: the whole statement in its format, and every line with what goes into it.

/** What goes into a line: each part with its sign, so the line reads as a calculation. */
export type Part = { label: string; amount: number };
export type DisplayRow =
  | { kind: "head"; label: string }
  | {
      kind: "line";
      id: string;
      label: string;
      /** The note that details the line, when it has parts. */
      note?: number;
      amount: number;
      prior?: number;
      parts: Part[];
      explain: string;
    }
  | { kind: "total"; id: string; label: string; amount: number; prior?: number; level: "sub" | "grand"; explain?: string; calc?: string };
export type DisplayStatement = { company: string; title: string; date: string; years: string[]; rows: DisplayRow[] };

/** What each line of the statement of financial position holds, and why it sits where it does. */
export const SOFP_EXPLAIN: Record<string, string> = {
  cash: "כסף בקופה ובחשבונות הבנק — הנכס הנזיל ביותר, ולכן ראשון.",
  deposit: "פיקדון שיתממש בתוך 12 חודשים — נכס שוטף. הריבית שהוא מניב היא קטגוריית השקעה ברווח או הפסד.",
  receivables: "מה שהלקוחות חייבים, פחות ההפרשה להפסדי אשראי חזויים. מציגים בנטו: את הסכום שבאמת צפוי להיגבות.",
  inventory: "המלאי שנשאר בסוף השנה, בעלות (או בשווי מימוש נטו אם נמוך יותר).",
  prepaid: "הוצאה ששולמה מראש על תקופה עתידית — זכות לקבל שירות, ולכן נכס.",
  debtors: "יתרות חובה קטנות שמאחדים לשורה אחת: מקדמות לספקים, הוצאות מראש, הכנסות לקבל.",
  vehicles: "רכוש קבוע: עלות פחות פחת נצבר. משמש יותר משנה — בלתי שוטף.",
  building: "רכוש קבוע: עלות פחות פחת נצבר.",
  printer: "רכוש קבוע במודל הערכה מחדש — בשווי ההוגן ביום ההערכה.",
  ppe: "כל הרכוש הקבוע בשורה אחת: עלות (או סכום משוערך) פחות פחת נצבר. הפירוט — בביאור.",
  bank: "החוב לבנק שנפרע בתוך 12 חודשים: משיכת יתר, וחלויות שוטפות של הלוואות.",
  suppliers: "החוב לספקים על קניות באשראי.",
  creditors: "יתרות זכות קטנות שמאחדים לשורה אחת: הוצאות לשלם, מקדמות מלקוחות, הכנסות מראש.",
  accrued: "הוצאה שכבר שייכת לשנה אבל עוד לא שולמה — התחייבות.",
  currentLoan: "החלק של ההלוואה שנפרע בתוך 12 חודשים מתאריך המאזן — שוטף.",
  longLoan: "החלק של ההלוואה שנפרע אחרי 12 חודשים — בלתי שוטף.",
  capital: "מה שהבעלים השקיעו תמורת מניות.",
  reserve: "קרן הערכה מחדש: העליות בשווי הרכוש הקבוע שנזקפו לרווח כולל אחר. יושבת בהון.",
  retained: "הרווחים שנצברו ולא חולקו: עודפי השנה הקודמת ועוד הרווח הנקי של השנה.",
};

/** What each line of profit or loss holds. */
export const PL_EXPLAIN: Record<PlLineId, string> = {
  sales: "המכירות בניכוי הנחות ללקוחות והחזרות מלקוחות. הפעילות העיקרית — קטגוריה תפעולית.",
  cogs: "עלות הסחורה שנמכרה: מלאי פתיחה + קניות − מלאי סגירה. מוצגת בסוגריים כי היא מקטינה את הרווח.",
  selling: "כל מה שקשור למכירה ולשיווק: עמלות, פרסום, שכר אנשי המכירות, פחת הנכסים שלהם.",
  rnd: "הוצאות מחקר ופיתוח: שכר, פחת ציוד, חומרים.",
  admin: "הוצאות שלא שייכות לקבוצה אחרת: שכר ההנהלה, פחת נכסי ההנהלה, הוצאות הפרשה להפסדי אשראי, משפטיות.",
  otherIncome: "הכנסות מחוץ לפעילות הרגילה — למשל רווח הון ממכירת רכוש קבוע. עדיין תפעולית.",
  otherExpense: "הוצאות מחוץ לפעילות הרגילה — למשל הפסד הון. עדיין תפעולית.",
  investment: "תשואה על נכסים שעומדים בפני עצמם — ריבית מפיקדונות ומהלוואות שניתנו. קטגוריית השקעה.",
  finance: "עלויות גיוס חוב: ריבית על הלוואות, עמלות בנק ודמי ניהול חשבון. קטגוריית מימון.",
};

const TOTAL_EXPLAIN: Record<string, string> = {
  ca: "סכום הנכסים שיתממשו בתוך 12 חודשים.",
  nca: "סכום הנכסים שישמשו יותר מ-12 חודשים.",
  assets: "כל הנכסים. חייב להיות שווה לסך ההתחייבויות וההון.",
  cl: "סכום ההתחייבויות שייפרעו בתוך 12 חודשים.",
  ncl: "סכום ההתחייבויות שייפרעו אחרי 12 חודשים.",
  eq: "הזכות השיורית של הבעלים: הנכסים פחות ההתחייבויות.",
  le: "ההתחייבויות וההון יחד — שווה בדיוק לסך הנכסים.",
  gross: "הכנסות פחות עלות המכר: כמה מרוויחים על הסחורה עצמה, לפני שאר ההוצאות.",
  operating: "סיכום ביניים חובה לפי IFRS 18: כל הקטגוריה התפעולית.",
  beforeFinancing: "סיכום ביניים חובה: הרווח התפעולי ועוד (או פחות) קטגוריית ההשקעה.",
  beforeTax: "אחרי קטגוריית המימון.",
  net: "בקורס: שווה לרווח לפני מסים, כי מסים ופעילויות שהופסקו טרם נלמדו.",
  oci: "פריטים שלא עוברים ברווח או הפסד — כאן הערכה מחדש של רכוש קבוע.",
  total: "רווח נקי ועוד רווח כולל אחר.",
};

const SECTIONS: [Section, string][] = [
  ["ca", "נכסים שוטפים"],
  ["nca", "נכסים בלתי שוטפים"],
  ["cl", "התחייבויות שוטפות"],
  ["ncl", "התחייבויות בלתי שוטפות"],
  ["eq", "הון"],
];

type SofpInput = { id: string; label: string; section: Section; parts: Part[]; prior?: number };

/** A statement of financial position from its lines, with totals in their places and notes for the lines that have parts. */
function sofpStatement(company: string, date: string, years: string[], lines: SofpInput[]): DisplayStatement {
  const rows: DisplayRow[] = [];
  let note = 2;
  const total = (sec: Section, which: "amount" | "prior") => r2(lines.filter((l) => l.section === sec).reduce((s, l) => s + (which === "amount" ? l.parts.reduce((t, p) => t + p.amount, 0) : (l.prior ?? 0)), 0));
  const hasPrior = years.length > 1;
  const sum = (secs: Section[], which: "amount" | "prior") => r2(secs.reduce((s, sec) => s + total(sec, which), 0));
  for (const [sec, title] of SECTIONS) {
    if (sec === "ca") rows.push({ kind: "head", label: "נכסים" });
    if (sec === "cl") rows.push({ kind: "head", label: "התחייבויות והון" });
    rows.push({ kind: "head", label: title });
    for (const l of lines.filter((x) => x.section === sec)) {
      const amount = r2(l.parts.reduce((t, p) => t + p.amount, 0));
      rows.push({ kind: "line", id: l.id, label: l.label, note: l.parts.length > 1 ? note++ : undefined, amount, prior: l.prior, parts: l.parts, explain: SOFP_EXPLAIN[l.id] ?? "" });
    }
    rows.push({ kind: "total", id: sec, label: `סה״כ ${title}`, amount: total(sec, "amount"), prior: hasPrior ? total(sec, "prior") : undefined, level: "sub", explain: TOTAL_EXPLAIN[sec] });
    if (sec === "nca") rows.push({ kind: "total", id: "assets", label: "סה״כ נכסים", amount: sum(["ca", "nca"], "amount"), prior: hasPrior ? sum(["ca", "nca"], "prior") : undefined, level: "grand", explain: TOTAL_EXPLAIN.assets });
  }
  rows.push({ kind: "total", id: "le", label: "סה״כ התחייבויות והון", amount: sum(["cl", "ncl", "eq"], "amount"), prior: hasPrior ? sum(["cl", "ncl", "eq"], "prior") : undefined, level: "grand", explain: TOTAL_EXPLAIN.le });
  return { company, title: "דוח על המצב הכספי", date: `ליום ${date}`, years, rows };
}

type PlInput = Partial<Record<PlLineId, { parts: Part[]; prior?: number }>> & { oci?: { parts: Part[]; prior?: number } };

/** Profit or loss and OCI from its lines, in the course's order, with the subtotals computed. */
function plStatement(company: string, period: string, years: string[], x: PlInput): DisplayStatement {
  const rows: DisplayRow[] = [];
  const hasPrior = years.length > 1;
  let note = 20;
  const val = (id: PlLineId, which: "amount" | "prior") => {
    const l = x[id];
    if (!l) return 0;
    return which === "amount" ? r2(l.parts.reduce((t, p) => t + p.amount, 0)) : (l.prior ?? 0);
  };
  const signedVal = (id: PlLineId, which: "amount" | "prior") => PL_LINES.find((l) => l.id === id)!.sign * val(id, which);
  const line = (id: PlLineId) => {
    const l = x[id];
    if (!l) return;
    const def = PL_LINES.find((d) => d.id === id)!;
    rows.push({ kind: "line", id, label: def.label, note: l.parts.length > 1 ? note++ : undefined, amount: def.sign * val(id, "amount"), prior: hasPrior ? def.sign * (l.prior ?? 0) : undefined, parts: l.parts, explain: PL_EXPLAIN[id] });
  };
  const subtotal = (id: string, label: string, ids: PlLineId[], level: "sub" | "grand" = "sub", calc?: string) => {
    const of = (which: "amount" | "prior") => r2(ids.reduce((s, i) => s + signedVal(i, which), 0));
    rows.push({ kind: "total", id, label, amount: of("amount"), prior: hasPrior ? of("prior") : undefined, level, explain: TOTAL_EXPLAIN[id], calc });
  };
  const upTo = (...ids: PlLineId[]) => ids;
  line("sales");
  line("cogs");
  subtotal("gross", "רווח גולמי", upTo("sales", "cogs"), "sub", "הכנסות − עלות המכר");
  for (const id of ["selling", "rnd", "admin", "otherIncome", "otherExpense"] as PlLineId[]) line(id);
  const operating = upTo("sales", "cogs", "selling", "rnd", "admin", "otherIncome", "otherExpense");
  subtotal("operating", "רווח (הפסד) תפעולי", operating, "sub", "רווח גולמי − מכירה ושיווק − מו״פ − הנהלה וכלליות ± אחרות");
  line("investment");
  subtotal("beforeFinancing", "רווח (הפסד) לפני מימון ומסים על הכנסה", [...operating, "investment"], "sub", "רווח תפעולי ± קטגוריית השקעה");
  line("finance");
  const all = [...operating, "investment", "finance"] as PlLineId[];
  subtotal("beforeTax", "רווח (הפסד) לפני מסים על הכנסה", all, "sub", "רווח לפני מימון ומסים − הוצאות מימון");
  subtotal("net", "רווח (הפסד) נקי", all, "grand");
  if (x.oci) {
    const amount = r2(x.oci.parts.reduce((t, p) => t + p.amount, 0));
    rows.push({ kind: "head", label: "רווח כולל אחר — פריטים שלא יסווגו מחדש לאחר מכן לרווח או הפסד:" });
    rows.push({ kind: "line", id: "oci", label: "הערכה מחדש של רכוש קבוע", amount, prior: hasPrior ? (x.oci.prior ?? 0) : undefined, parts: x.oci.parts, explain: "עליית ערך של רכוש קבוע במודל הערכה מחדש. לא עוברת ברווח או הפסד, ולעולם לא תסווג אליו." });
    rows.push({ kind: "total", id: "oci", label: "סך רווח כולל אחר", amount, prior: hasPrior ? (x.oci.prior ?? 0) : undefined, level: "sub", explain: TOTAL_EXPLAIN.oci });
    const net = (which: "amount" | "prior") => r2(all.reduce((s, i) => s + signedVal(i, which), 0));
    rows.push({ kind: "total", id: "total", label: "סה״כ רווח (הפסד) כולל לתקופה", amount: r2(net("amount") + amount), prior: hasPrior ? r2(net("prior") + (x.oci.prior ?? 0)) : undefined, level: "grand", explain: TOTAL_EXPLAIN.total, calc: "רווח נקי + רווח כולל אחר" });
  }
  return { company, title: "דוח על הרווח או הפסד ורווח כולל אחר", date: period, years, rows };
}

/** A question's solved statements, each line traced back to the trial-balance accounts it holds. */
export function questionStatements(q: Question): { sofp: DisplayStatement; pl: DisplayStatement } {
  const s = build(q);
  const sofpLines: SofpInput[] = q.sofp.map((l) => {
    const parts: Part[] = [];
    const asset = l.section === "ca" || l.section === "nca";
    for (const a of q.accounts) {
      const v = signed(a) * (asset ? 1 : -1);
      if (a.dest === l.id || (a.dest === NET && a.into === l.id)) parts.push({ label: a.name, amount: v });
      if (a.dest === SPLIT && a.split?.currentLine === l.id) parts.push({ label: `${a.name} — החלק שנפרע בתוך 12 חודשים`, amount: a.split.current });
      if (a.dest === SPLIT && a.split?.longLine === l.id) parts.push({ label: `${a.name} — החלק שנפרע אחרי 12 חודשים`, amount: r2(a.amount - a.split.current) });
    }
    return { id: l.id, label: l.label, section: l.section, parts };
  });
  sofpLines.push({
    id: "retained",
    label: "עודפים",
    section: "eq",
    parts: [
      { label: "עודפי פתיחה (מאזן הבוחן: סך החובה פחות סך הזכות, בלי הקרן הכפולה)", amount: s.openingRetained },
      { label: "הרווח הנקי של השנה", amount: s.netProfit },
    ],
  });
  const pl: PlInput = {};
  for (const def of PL_LINES) {
    // Each part in the line's own sense: a cost for an expense line, revenue for an income line.
    const parts: Part[] = q.accounts
      .filter((a) => a.dest === def.id || (a.dest === NET && a.into === def.id))
      .map((a) => ({ label: a.name, amount: def.sign === 1 ? -signed(a) : signed(a) }));
    for (const row of s.alloc) {
      if (def.id === "admin" && row.admin) parts.push({ label: `${row.name} × ${Math.round(row.adminPct * 100)}%`, amount: row.admin });
      if (def.id === "selling" && row.selling) parts.push({ label: `${row.name} × ${Math.round(row.sellingPct * 100)}%`, amount: row.selling });
    }
    if (parts.length) pl[def.id] = { parts };
  }
  if (s.oci) pl.oci = { parts: q.accounts.filter((a) => a.dest === OCI).map((a) => ({ label: a.name, amount: -signed(a) })) };
  return {
    sofp: sofpStatement(q.company, q.date, [q.year], sofpLines),
    pl: plStatement(q.company, `לשנה שהסתיימה ב-${q.date}`, [q.year], pl),
  };
}

// ---------------------------------------------------------------------------
// The teaching company for chapters 5–6: two years side by side, every line with its parts.

export const NOF = {
  company: "\"נוף\" תעשיות בע\"מ",
  sofp: sofpStatement("\"נוף\" תעשיות בע\"מ", "31 בדצמבר", ["2024", "2023"], [
    { id: "cash", label: "מזומנים ושווי מזומנים", section: "ca", parts: [{ label: "מזומן בקופה ובחשבונות הבנק", amount: 366_000 }], prior: 165_000 },
    { id: "deposit", label: "פיקדון בבנק לזמן קצר", section: "ca", parts: [{ label: "פיקדון ל-6 חודשים", amount: 200_000 }], prior: 150_000 },
    { id: "receivables", label: "לקוחות, נטו", section: "ca", parts: [{ label: "לקוחות", amount: 500_000 }, { label: "בניכוי הפרשה להפסדי אשראי חזויים", amount: -30_000 }], prior: 395_000 },
    { id: "inventory", label: "מלאי", section: "ca", parts: [{ label: "מלאי סגירה", amount: 350_000 }], prior: 300_000 },
    { id: "debtors", label: "חייבים ויתרות חובה", section: "ca", parts: [{ label: "הוצאות מראש", amount: 20_000 }, { label: "מקדמות לספקים", amount: 15_000 }, { label: "הכנסות ריבית לקבל", amount: 4_000 }], prior: 30_000 },
    { id: "ppe", label: "רכוש קבוע, נטו", section: "nca", parts: [{ label: "עלות וסכום משוערך", amount: 1_900_000 }, { label: "בניכוי פחת נצבר", amount: -400_000 }], prior: 1_350_000 },
    { id: "bank", label: "אשראי מתאגידים בנקאיים", section: "cl", parts: [{ label: "משיכת יתר", amount: 30_000 }, { label: "חלויות שוטפות של הלוואות מבנקים", amount: 100_000 }], prior: 100_000 },
    { id: "suppliers", label: "ספקים ונותני שירותים", section: "cl", parts: [{ label: "ספקים", amount: 260_000 }], prior: 240_000 },
    { id: "creditors", label: "זכאים ויתרות זכות", section: "cl", parts: [{ label: "הוצאות לשלם", amount: 25_000 }, { label: "מקדמות מלקוחות", amount: 20_000 }, { label: "הכנסות מראש", amount: 10_000 }], prior: 50_000 },
    { id: "longLoan", label: "הלוואות מבנקים", section: "ncl", parts: [{ label: "הלוואה מהבנק", amount: 500_000 }, { label: "בניכוי חלויות שוטפות", amount: -100_000 }], prior: 500_000 },
    { id: "capital", label: "הון מניות", section: "eq", parts: [{ label: "הון מניות", amount: 500_000 }], prior: 500_000 },
    { id: "reserve", label: "קרנות הון", section: "eq", parts: [{ label: "קרן הערכה מחדש", amount: 60_000 }], prior: 0 },
    { id: "retained", label: "עודפים", section: "eq", parts: [{ label: "עודפים ב-31.12.2023", amount: 1_000_000 }, { label: "הרווח הנקי של 2024", amount: 520_000 }], prior: 1_000_000 },
  ]),
  pl: plStatement("\"נוף\" תעשיות בע\"מ", "לשנה שהסתיימה ב-31 בדצמבר", ["2024", "2023"], {
    sales: { parts: [{ label: "מכירות", amount: 2_450_000 }, { label: "בניכוי החזרות מלקוחות", amount: -50_000 }], prior: 2_100_000 },
    cogs: { parts: [{ label: "מלאי פתיחה", amount: 300_000 }, { label: "קניות", amount: 1_200_000 }, { label: "בניכוי מלאי סגירה", amount: -350_000 }], prior: 1_000_000 },
    selling: { parts: [{ label: "שכר אנשי מכירות", amount: 150_000 }, { label: "פרסום", amount: 90_000 }, { label: "פחת כלי רכב של סוכני המכירות", amount: 40_000 }], prior: 250_000 },
    rnd: { parts: [{ label: "שכר צוות הפיתוח", amount: 70_000 }, { label: "פחת ציוד מעבדה", amount: 20_000 }], prior: 80_000 },
    admin: { parts: [{ label: "שכר ההנהלה", amount: 220_000 }, { label: "פחת מבנה ההנהלה", amount: 60_000 }, { label: "הוצאות הפרשה להפסדי אשראי", amount: 25_000 }, { label: "משפטיות ומשרד", amount: 35_000 }], prior: 310_000 },
    otherIncome: { parts: [{ label: "רווח הון ממכירת מכונה", amount: 15_000 }], prior: 0 },
    investment: { parts: [{ label: "הכנסות ריבית מפיקדון", amount: 12_000 }], prior: 8_000 },
    finance: { parts: [{ label: "ריבית על הלוואות מבנקים", amount: 40_000 }, { label: "עמלות בנק", amount: 7_000 }], prior: 50_000 },
    oci: { parts: [{ label: "עליית ערך המבנה בהערכה מחדש", amount: 60_000 }], prior: 0 },
  }),
};

// ---------------------------------------------------------------------------
// Chapter 3: the framework's concepts on a small example of their own.

const carrying = { cost: 90_000, accumulated: 27_000 };
const disposal = { carrying: 14_000, proceeds: 18_000 };
const land = { cost: 380_000, fairValue: 410_000 };
const banks = [18_000, 7_500, 4_500];
export const CONCEPTS = {
  company: "\"אורן\" שיווק בע\"מ",
  vehicle: { ...carrying, net: carrying.cost - carrying.accumulated },
  disposal: { ...disposal, gain: disposal.proceeds - disposal.carrying },
  building: 750_000,
  land: { ...land, uplift: land.fairValue - land.cost },
  banks: { each: banks, total: banks.reduce((s, v) => s + v, 0) },
};
