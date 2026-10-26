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
