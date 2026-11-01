/**
 * Accounting from zero: one data model for every example on the page.
 *
 * Journal entries are the only input. T-accounts, trial balances, profit and
 * the balance sheet are all computed from them (or from a given trial balance),
 * so no total on the page is typed by hand. Balances are signed: debit is
 * positive, credit negative.
 */

export type AccountType = "asset" | "contraAsset" | "liability" | "equity" | "income" | "expense";

export const TYPE_LABEL: Record<AccountType, string> = {
  asset: "נכס",
  contraAsset: "נכס בניכוי (מקטין נכס)",
  liability: "התחייבות",
  equity: "הון",
  income: "הכנסה",
  expense: "הוצאה",
};

/** Accounts whose type can't be read off their name. */
const EXPLICIT: Record<string, AccountType> = {
  מזומן: "asset",
  לקוחות: "asset",
  "לקוח דוד": "asset",
  חייבים: "asset",
  "מקדמות לספקים": "asset",
  "מלאי סגירה מאזני": "asset",
  "מלאי (מאזני)": "asset",
  מלאי: "asset",
  "ריהוט משרדי": "asset",
  לפטופ: "asset",
  מדפסת: "asset",
  "ציוד הגברה": "asset",
  ציוד: "asset",
  מכונות: "asset",
  "כלי רכב": "asset",
  // Fixed assets (the IAS 16 course).
  מכונה: "asset",
  מבנה: "asset",
  "נכס חדש — עלות": "asset",
  "נכס ישן — עלות מקורית": "asset",
  "פחת נצבר": "contraAsset",
  "פחת נצבר — נכס ישן": "contraAsset",
  "קרן הערכה מחדש": "equity",
  "רווח מהחלפת נכסים": "income",
  "רווח מהערכה מחדש": "income",
  "רווח הון": "income",
  "הפסד הון": "expense",
  קרקע: "asset",
  "הלוואה לעובד": "asset",
  "הלוואה שניתנה": "asset",
  "פיקדונות בבנק": "asset",
  חנות: "asset",
  "הפרשה להפסדי אשראי חזויים": "contraAsset",
  ספקים: "liability",
  זכאים: "liability",
  "מקדמות מלקוחות": "liability",
  הלוואה: "liability",
  "הלוואות שהתקבלו": "liability",
  "הלוואה שהתקבלה": "liability",
  "הון בעלים": "equity",
  "הון מניות": "equity",
  עודפים: "equity",
  מכירות: "income",
  "מלאי סגירה רווח או הפסד": "income",
  // The year-end closing account that gathers income and expenses before the result moves to retained earnings.
  "סיכום הכנסות והוצאות": "income",
  "שינוי מלאי (רווח והפסד)": "income",
  קניות: "expense",
  "מלאי פתיחה": "expense",
  "עלות המכר": "expense",
};

/** The type of an account, from the list above or from the course's naming pattern. */
export function typeOf(account: string): AccountType {
  if (EXPLICIT[account]) return EXPLICIT[account];
  if (account.endsWith("מראש")) return account.startsWith("הכנסות") ? "liability" : "asset";
  if (account.endsWith("לשלם")) return "liability";
  if (account.endsWith("לקבל")) return "asset";
  if (account.startsWith("הכנסות") || account.startsWith("הכנסה")) return "income";
  if (account.startsWith("הוצאות") || account.startsWith("הוצ'")) return "expense";
  throw new Error(`Unknown account type: ${account}`);
}

/** Balance sheet accounts carry over to next year; profit-or-loss accounts start every year at zero. */
export const isBalanceSheet = (account: string) => ["asset", "contraAsset", "liability", "equity"].includes(typeOf(account));

/** The side an account's balance normally sits on. */
export const normalSide = (account: string): "dr" | "cr" => (["asset", "expense"].includes(typeOf(account)) ? "dr" : "cr");

export type Line = { account: string; dr?: number; cr?: number };
export type Entry = { id: string; date?: string; text: string; lines: Line[]; why?: string };

const EPS = 0.005;
export const round2 = (v: number) => Math.round(v * 100) / 100;
export const sumDr = (e: Entry) => round2(e.lines.reduce((s, l) => s + (l.dr ?? 0), 0));
export const sumCr = (e: Entry) => round2(e.lines.reduce((s, l) => s + (l.cr ?? 0), 0));
export const isBalanced = (e: Entry) => Math.abs(sumDr(e) - sumCr(e)) < EPS;

export type Balances = Record<string, number>;

/** One posting in a T-account: which entry it came from, and its amount. */
export type Posting = { ref: string; amount: number };
export type TAccount = { account: string; opening: number; dr: Posting[]; cr: Posting[]; balance: number };

/** Posts entries to T-accounts, from optional opening balances. Accounts keep the order they first appear in. */
export function ledger(entries: Entry[], opening: Balances = {}): TAccount[] {
  const map = new Map<string, TAccount>();
  const get = (account: string) => {
    let t = map.get(account);
    if (!t) {
      t = { account, opening: opening[account] ?? 0, dr: [], cr: [], balance: opening[account] ?? 0 };
      map.set(account, t);
    }
    return t;
  };
  Object.keys(opening).forEach(get);
  for (const e of entries) {
    for (const l of e.lines) {
      const t = get(l.account);
      if (l.dr) {
        t.dr.push({ ref: e.id, amount: l.dr });
        t.balance = round2(t.balance + l.dr);
      }
      if (l.cr) {
        t.cr.push({ ref: e.id, amount: l.cr });
        t.balance = round2(t.balance - l.cr);
      }
    }
  }
  return [...map.values()];
}

export const balancesOf = (accounts: TAccount[]): Balances => Object.fromEntries(accounts.map((t) => [t.account, t.balance]));

export type TBRow = { account: string; dr: number; cr: number };
export type TrialBalance = { rows: TBRow[]; dr: number; cr: number };

/** Lists every non-zero balance on its side. */
export function trialBalance(b: Balances): TrialBalance {
  const rows = Object.entries(b)
    .filter(([, v]) => Math.abs(v) > EPS)
    .map(([account, v]) => ({ account, dr: v > 0 ? v : 0, cr: v < 0 ? -v : 0 }));
  return { rows, dr: round2(rows.reduce((s, r) => s + r.dr, 0)), cr: round2(rows.reduce((s, r) => s + r.cr, 0)) };
}

export const tbBalanced = (tb: TrialBalance) => Math.abs(tb.dr - tb.cr) < EPS;

export type Statements = {
  income: [string, number][];
  expenses: [string, number][];
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  assets: [string, number][];
  liabilities: [string, number][];
  equity: [string, number][];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
};

/**
 * Profit or loss and the balance sheet from final balances. The year's profit
 * goes into retained earnings, so assets = liabilities + equity must hold.
 */
export function statements(b: Balances): Statements {
  const pick = (types: AccountType[], sign: number) =>
    Object.entries(b)
      .filter(([a, v]) => types.includes(typeOf(a)) && Math.abs(v) > EPS)
      .map(([a, v]) => [a, round2(sign * v)] as [string, number]);
  const income = pick(["income"], -1);
  const expenses = pick(["expense"], 1);
  // An income account with a debit balance (or an expense with a credit one) still nets correctly here.
  const totalIncome = round2(income.reduce((s, [, v]) => s + v, 0));
  const totalExpenses = round2(expenses.reduce((s, [, v]) => s + v, 0));
  const profit = round2(totalIncome - totalExpenses);
  const assets = pick(["asset", "contraAsset"], 1);
  const liabilities = pick(["liability"], -1);
  const equityRows = pick(["equity"], -1).filter(([a]) => a !== "עודפים");
  const retained = round2(-(b["עודפים"] ?? 0) + profit);
  const equity: [string, number][] = [...equityRows, ["עודפים", retained]];
  return {
    income,
    expenses,
    totalIncome,
    totalExpenses,
    profit,
    assets,
    liabilities,
    equity,
    totalAssets: round2(assets.reduce((s, [, v]) => s + v, 0)),
    totalLiabilities: round2(liabilities.reduce((s, [, v]) => s + v, 0)),
    totalEquity: round2(equity.reduce((s, [, v]) => s + v, 0)),
  };
}

export const identityHolds = (s: Statements) => Math.abs(s.totalAssets - (s.totalLiabilities + s.totalEquity)) < EPS;

/** Next year's opening balances: balance sheet accounts carry over, the year's profit joins retained earnings, the rest start at zero. */
export function carryForward(b: Balances): Balances {
  const s = statements(b);
  const out: Balances = {};
  for (const [a, v] of Object.entries(b)) if (isBalanceSheet(a) && a !== "עודפים" && Math.abs(v) > EPS) out[a] = v;
  out["עודפים"] = -s.equity.find(([a]) => a === "עודפים")![1];
  return out;
}

/**
 * The year-end closing entry: every income account is debited by its balance,
 * every expense credited by its own, and the difference — the year's profit or
 * loss — goes to retained earnings: a credit for a profit, a debit for a loss.
 */
export function closingEntry(b: Balances, id: string, date: string): Entry {
  const pl = Object.entries(b).filter(([a, v]) => !isBalanceSheet(a) && Math.abs(v) > EPS);
  const profit = statements(b).profit;
  const dr: Line[] = pl.filter(([, v]) => v < 0).map(([account, v]) => ({ account, dr: -v }));
  const cr: Line[] = pl.filter(([, v]) => v > 0).map(([account, v]) => ({ account, cr: v }));
  if (profit < -EPS) dr.push({ account: "עודפים", dr: -profit });
  if (profit > EPS) cr.push({ account: "עודפים", cr: profit });
  return { id, date, text: profit >= 0 ? "סגירת החשבונות התוצאתיים: הרווח עובר לעודפים" : "סגירת החשבונות התוצאתיים: ההפסד יורד מהעודפים", lines: [...dr, ...cr] };
}

// ---------------------------------------------------------------------------
// The examples. Amounts are as given; every total is computed from them.

const e = (id: string, date: string, text: string, lines: Line[], why?: string): Entry => ({ id, date, text, lines, why });

/** The whole-business walkthrough: a candle workshop, opened on 1.3.2025. */
export const CANDLES = {
  unitCost: 18,
  unitPrice: 45,
  bought: 2_000,
  sold: 600,
  entries: [
    e("1", "1.3.2025", "פתחת סדנת נרות והשקעת בה 120,000 ₪ במזומן", [{ account: "מזומן", dr: 120_000 }, { account: "הון בעלים", cr: 120_000 }], "כסף נכנס לעסק — חובה. הוא הגיע מהבעלים, והעסק ״חייב״ לו אותו — הון בעלים, בזכות."),
    e("2", "1.3.2025", "שילמת שכירות לחודש מרץ: 3,500 ₪", [{ account: "הוצאות שכירות", dr: 3_500 }, { account: "מזומן", cr: 3_500 }], "השכירות משרתת את העסק לחודש אחד בלבד — הוצאה. המזומן יוצא."),
    e("3", "2.3.2025", "קנית 2,000 נרות ב-18 ₪ כל אחד, במזומן", [{ account: "קניות", dr: 36_000 }, { account: "מזומן", cr: 36_000 }], "קניית סחורה למכירה נרשמת בחשבון קניות. 2,000 × 18 = 36,000."),
    e("4", "6.3.2025", "מכרת 600 נרות ב-45 ₪ כל אחד, במזומן", [{ account: "מזומן", dr: 27_000 }, { account: "מכירות", cr: 27_000 }], "כסף נכנס, ונרות יצאו — הכנסה. 600 × 45 = 27,000."),
    e("5", "8.3.2025", "שילמת 4,200 ₪ על פרסום ברשתות", [{ account: "הוצאות פרסום", dr: 4_200 }, { account: "מזומן", cr: 4_200 }], "פרסום מקדם מכירות בטווח הקצר — הוצאה."),
    e("6", "31.3.2025", "שילמת לעוזרת שכר למרץ: 2,800 ₪", [{ account: "הוצאות שכר", dr: 2_800 }, { account: "מזומן", cr: 2_800 }], "שכר על עבודה של חודש — הוצאה."),
    e("7", "2.4.2025", "קנית מדפסת תוויות לעסק ב-2,400 ₪ במזומן", [{ account: "מדפסת", dr: 2_400 }, { account: "מזומן", cr: 2_400 }], "המדפסת תשמש שנים ואפשר למכור אותה — השקעה, כלומר נכס."),
    e("8", "6.4.2025", "משכת מהעסק 6,000 ₪ לעצמך", [{ account: "הון בעלים", dr: 6_000 }, { account: "מזומן", cr: 6_000 }], "פעולה הפוכה להשקעה: ההון קטן (חובה), המזומן יוצא (זכות). זו לא הוצאה."),
  ] as Entry[],
  get closingUnits() {
    return this.bought - this.sold;
  },
  get closing(): Entry {
    const amount = this.closingUnits * this.unitCost;
    return e("סגירה", "31.12.2025", `ספרת במחסן ${this.closingUnits.toLocaleString("en-US")} נרות שלא נמכרו, בעלות ${this.unitCost} ₪ כל אחד`, [
      { account: "מלאי סגירה מאזני", dr: amount },
      { account: "מלאי סגירה רווח או הפסד", cr: amount },
    ]);
  },
};

/** Lesson 2: a credit story, an advances story and a loan, each a short run of entries posted one after another. */
export const CREDIT = {
  credit: [
    e("1", "", "מכרת סחורה ב-2,400 ₪ באשראי: הלקוח ישלם בעוד שבועיים", [{ account: "לקוחות", dr: 2_400 }, { account: "מכירות", cr: 2_400 }], "המכירה קרתה היום, ולכן נרשמת היום. במקום מזומן נכנס חוב של הלקוח."),
    e("2", "", "הלקוח שילם את החוב במזומן", [{ account: "מזומן", dr: 2_400 }, { account: "לקוחות", cr: 2_400 }], "אין הכנסה חדשה: החוב של הלקוח הופך למזומן."),
    e("3", "", "קנית סחורה ב-900 ₪ באשראי: תשלם לספק בעוד שבועיים", [{ account: "קניות", dr: 900 }, { account: "ספקים", cr: 900 }], "הסחורה הגיעה היום. במקום מזומן נוצר חוב לספק."),
    e("4", "", "שילמת לספק את החוב במזומן", [{ account: "ספקים", dr: 900 }, { account: "מזומן", cr: 900 }], "אין הוצאה חדשה: החוב לספק נסגר והמזומן יוצא."),
  ] as Entry[],
  advances: [
    e("1", "", "לקוח שילם 1,500 ₪ מראש על הזמנה שיקבל בעוד חודש", [{ account: "מזומן", dr: 1_500 }, { account: "מקדמות מלקוחות", cr: 1_500 }], "עוד לא מכרנו כלום: אנחנו חייבים ללקוח סחורה. זו התחייבות, לא הכנסה."),
    e("2", "", "סיפקת ללקוח את ההזמנה", [{ account: "מקדמות מלקוחות", dr: 1_500 }, { account: "מכירות", cr: 1_500 }], "החוב ללקוח נסגר, ורק עכשיו נרשמת ההכנסה."),
    e("3", "", "שילמת לספק 700 ₪ מראש על סחורה שתגיע בעוד חודש", [{ account: "מקדמות לספקים", dr: 700 }, { account: "מזומן", cr: 700 }], "הספק חייב לנו סחורה. זה נכס, עוד לא קנייה."),
    e("4", "", "הספק סיפק את הסחורה", [{ account: "קניות", dr: 700 }, { account: "מקדמות לספקים", cr: 700 }], "המקדמה נסגרת, ורק עכשיו נרשמת הקנייה."),
  ] as Entry[],
  loan: [
    e("1", "1.4.2025", "החברה לקחה הלוואה של 80,000 ₪ מהבנק", [{ account: "מזומן", dr: 80_000 }, { account: "הלוואה", cr: 80_000 }], "הכסף נכנס, והחברה חייבת אותו לבנק. זו התחייבות, לא הכנסה."),
    e("2", "31.12.2025", "החברה שילמה ריבית של 3,600 ₪ במזומן (6% לשנה, על 9 חודשים)", [{ account: "הוצאות ריבית", dr: 3_600 }, { account: "מזומן", cr: 3_600 }], "ריבית היא המחיר על השימוש בכסף, ולכן היא הוצאה."),
    e("3", "31.12.2025", "החברה פרעה רבע מההלוואה במזומן: 20,000 ₪", [{ account: "הלוואה", dr: 20_000 }, { account: "מזומן", cr: 20_000 }], "החזר הקרן אינו הוצאה: הוא רק מקטין את החוב."),
  ] as Entry[],
};

/**
 * Lesson 2's cheques: a home-goods shop's spring. A cheque is not an account —
 * only the day the money moves matters: a post-dated cheque is a debt until it
 * clears, and a cheque the bank returns undoes its clearing.
 */
export const CHECKS = {
  run: [
    e("1", "1.3", "מכרת סחורה ב-8,000 ₪, והלקוח נתן צ׳ק דחוי ל-1.5", [{ account: "לקוחות", dr: 8_000 }, { account: "מכירות", cr: 8_000 }], "המכירה קרתה היום. הכסף יגיע רק ב-1.5 — עד אז הלקוח חייב: לקוחות."),
    e("2", "10.3", "קנית סחורה ב-5,000 ₪ ונתת לספק צ׳ק דחוי ל-10.4", [{ account: "קניות", dr: 5_000 }, { account: "ספקים", cr: 5_000 }], "הסחורה הגיעה היום. הכסף ייצא רק ב-10.4 — עד אז אנחנו חייבים לספק: ספקים."),
    e("3", "10.4", "הצ׳ק לספק נפרע", [{ account: "ספקים", dr: 5_000 }, { account: "מזומן", cr: 5_000 }], "החוב לספק נסגר והכסף יוצא. אין קנייה חדשה — היא נרשמה ב-10.3."),
    e("4", "1.5", "הפקדת את הצ׳ק של הלקוח, והוא נפרע", [{ account: "מזומן", dr: 8_000 }, { account: "לקוחות", cr: 8_000 }], "הכסף נכנס והחוב של הלקוח נסגר. אין הכנסה חדשה — היא נרשמה ב-1.3."),
    e("5", "3.5", "הבנק החזיר את הצ׳ק: אין כיסוי בחשבון של הלקוח", [{ account: "לקוחות", dr: 8_000 }, { account: "מזומן", cr: 8_000 }], "הכסף לא באמת נכנס, והלקוח שוב חייב. הפקודה הפוכה בדיוק לפקודת הפירעון. המכירה לא מתבטלת."),
    e("6", "3.5", "הבנק גבה 60 ₪ עמלה על הצ׳ק שחזר", [{ account: "הוצאות עמלות בנק", dr: 60 }, { account: "מזומן", cr: 60 }], "העמלה היא מחיר שהעסק שילם לבנק — הוצאה."),
    e("7", "20.5", "הלקוח הגיע ושילם את חובו במזומן", [{ account: "מזומן", dr: 8_000 }, { account: "לקוחות", cr: 8_000 }], "החוב נסגר סוף סוף. גם כאן אין הכנסה חדשה."),
  ] as Entry[],
};

/** Lesson 2: an advance that covers only part of the deal, on each side. */
export const SPLIT = {
  purchase: e("1", "", "קנית סחורה ב-50,000 ₪: 18,000 מהמקדמה ששילמת לספק בעבר, 12,000 בצ׳ק דחוי, והשאר באשראי", [
    { account: "קניות", dr: 50_000 },
    { account: "מקדמות לספקים", cr: 18_000 },
    { account: "ספקים", cr: 32_000 },
  ], "הקנייה כולה בחובה: 50,000. בזכות — שורה לכל אופן תשלום: המקדמה נסגרת (18,000), והצ׳ק הדחוי והאשראי הם שניהם חוב לאותו ספק: 12,000 + 20,000 = 32,000."),
  sale: e("2", "", "מכרת סחורה ב-26,000 ₪: 6,000 מהמקדמה שהלקוח שילם, 4,000 במזומן, 5,000 בצ׳ק דחוי, והשאר באשראי", [
    { account: "מקדמות מלקוחות", dr: 6_000 },
    { account: "מזומן", dr: 4_000 },
    { account: "לקוחות", dr: 16_000 },
    { account: "מכירות", cr: 26_000 },
  ], "המכירה כולה בזכות: 26,000. בחובה — שורה לכל אופן תשלום: המקדמה נסגרת (6,000), המזומן נכנס (4,000), והצ׳ק הדחוי והאשראי — חוב של הלקוח: 5,000 + 11,000 = 16,000."),
  loanPayment: e("1", "1.1", "תשלום ראשון על הלוואה של 60,000 ₪ בשישה תשלומים: 10,000 קרן ו-1,500 ריבית", [
    { account: "הלוואה", dr: 10_000 },
    { account: "הוצאות ריבית", dr: 1_500 },
    { account: "מזומן", cr: 11_500 },
  ], "תשלום אחד, שני חלקים: הקרן מקטינה את החוב (ח׳ הלוואה), והריבית היא הוצאה. המזומן יוצא על שניהם."),
};

/** Lesson 3: Tchelet Ltd, set up on 1.1.2024. Its trial balance for 2024 is given as balances; 2025 ends in a loss. */
export const TCHELET = {
  tb2024: {
    לקוחות: 184_000,
    קניות: 260_000,
    "הוצאות שכר": 96_000,
    מכירות: -540_000,
    ספקים: -72_000,
    "הון מניות": -150_000,
    ציוד: 88_000,
    "הוצאות פרסום": 14_000,
    "הלוואה שהתקבלה": -120_000,
    מזומן: 214_500,
    "הכנסות מעמלות": -22_500,
    "הוצאות ארנונה": 48_000,
  } as Balances,
  entries2025: [
    e("1", "2025", "מכירת סחורה ללקוחות באשראי", [{ account: "לקוחות", dr: 70_000 }, { account: "מכירות", cr: 70_000 }]),
    e("2", "2025", "תשלום לספקים על חשבון החוב", [{ account: "ספקים", dr: 60_000 }, { account: "מזומן", cr: 60_000 }]),
    e("3", "2025", "גבייה מלקוחות", [{ account: "מזומן", dr: 150_000 }, { account: "לקוחות", cr: 150_000 }]),
    e("4", "2025", "תשלום ארנונה לשנה", [{ account: "הוצאות ארנונה", dr: 52_000 }, { account: "מזומן", cr: 52_000 }]),
    e("5", "2025", "פירעון חלק מההלוואה", [{ account: "הלוואה שהתקבלה", dr: 40_000 }, { account: "מזומן", cr: 40_000 }]),
    e("6", "2025", "תשלום שכר במזומן", [{ account: "הוצאות שכר", dr: 105_000 }, { account: "מזומן", cr: 105_000 }]),
  ] as Entry[],
};

/**
 * Lesson 4: the four cut-off accounts, one small case each — what was
 * recorded during the year, then the year-end adjustment.
 */
const AC = {
  prepaid: { paid: 2_400, months: 12, monthsThisYear: 4 },
  accrued: { quarterly: 7_500, quartersRecorded: 3, monthsMissing: 3 },
  unearned: { received: 8_000, months: 8, monthsThisYear: 2 },
  receivable: { monthly: 400, monthsThisYear: 6 },
};
const acPrepaid = round2((AC.prepaid.paid * (AC.prepaid.months - AC.prepaid.monthsThisYear)) / AC.prepaid.months);
const acRecorded = AC.accrued.quarterly * AC.accrued.quartersRecorded;
const acMissing = AC.accrued.quarterly;
const acUnearned = round2((AC.unearned.received * (AC.unearned.months - AC.unearned.monthsThisYear)) / AC.unearned.months);
const acRoyalty = AC.receivable.monthly * AC.receivable.monthsThisYear;

export const ACCRUAL = {
  ...AC,
  results: { prepaid: acPrepaid, accrued: acMissing, unearned: acUnearned, receivable: acRoyalty, recorded: acRecorded },
  entries: {
    prepaid: [
      e("1", "1.9", "שולם ביטוח לשנה, 2,400 ₪, ונרשם כולו כהוצאה", [{ account: "הוצאות ביטוח", dr: AC.prepaid.paid }, { account: "מזומן", cr: AC.prepaid.paid }]),
      e("2", "31.12", "התאמה: החלק של השנה הבאה עובר להוצאות מראש", [{ account: "הוצאות ביטוח מראש", dr: acPrepaid }, { account: "הוצאות ביטוח", cr: acPrepaid }]),
    ],
    accrued: [
      e("1", "1–9", "הניקיון של ינואר עד ספטמבר חויב ושולם — שלושה רבעונים", [{ account: "הוצאות ניקיון", dr: acRecorded }, { account: "מזומן", cr: acRecorded }]),
      e("2", "31.12", "התאמה: ניקיון אוקטובר–דצמבר, שהחשבון עליו יגיע בינואר", [{ account: "הוצאות ניקיון", dr: acMissing }, { account: "הוצאות ניקיון לשלם", cr: acMissing }]),
    ],
    unearned: [
      e("1", "1.11", "התקבלו 8,000 ₪ על השכרת חניה ל-8 חודשים, ונרשמו כולם כהכנסה", [{ account: "מזומן", dr: AC.unearned.received }, { account: "הכנסות שכירות", cr: AC.unearned.received }]),
      e("2", "31.12", "התאמה: החלק של השנה הבאה עובר להכנסות מראש", [{ account: "הכנסות שכירות", dr: acUnearned }, { account: "הכנסות שכירות מראש", cr: acUnearned }]),
    ],
    receivable: [
      e("1", "31.12", "התאמה: תמלוגים של יולי–דצמבר, שיתקבלו ב-30.6", [{ account: "הכנסות מתמלוגים לקבל", dr: acRoyalty }, { account: "הכנסות מתמלוגים", cr: acRoyalty }]),
    ],
  } satisfies Record<keyof typeof AC, Entry[]>,
};

/**
 * Lesson 5: a last month that differs from the rest. The regular month comes
 * from what was recorded, divided by the months it covers; only then is the
 * odd month worked out.
 */
export const ODD = {
  raise: { recorded: 330_000, months: 11, rate: 0.08 },
  tax: { recorded: 25_000, months: 10, decRate: 0.15 },
  phone: { recorded: 42_000, months: 10, missing: 2 },
};
const oddMonth = (x: { recorded: number; months: number }) => round2(x.recorded / x.months);
export const ODD_RESULTS = {
  raise: { month: oddMonth(ODD.raise), missing: round2(oddMonth(ODD.raise) * (1 + ODD.raise.rate)) },
  tax: { month: oddMonth(ODD.tax), missing: round2(oddMonth(ODD.tax) + oddMonth(ODD.tax) * (1 + ODD.tax.decRate)) },
  phone: { month: oddMonth(ODD.phone), missing: round2(oddMonth(ODD.phone) * ODD.phone.missing) },
};

/** Lesson 5: interest for the part of a year — the rate's period decides the arithmetic. */
export const PERIOD = {
  halfYear: { amount: 250_000, rate: 0.03, periodMonths: 6, months: 6 },
  annual: { amount: 250_000, rate: 0.03, periodMonths: 12, months: 6 },
  lent: { amount: 36_000, perHalf: 900 },
};
export const interestFor = (x: { amount: number; rate: number; periodMonths: number; months: number }) => round2((x.amount * x.rate * x.months) / x.periodMonths);

/** Lesson 4's full example: Shachar Consulting Ltd, set up on 1.1.2023; the preliminary trial balance for 31.12.2025. It sells goods too: its purchases, paid in cash, and the stock counted at year end. */
export const SHACHAR = {
  name: "שחר ייעוץ בע״מ",
  date: "31.12.2025",
  year: "2025",
  preliminary: {
    מזומן: 829_250,
    קניות: 95_000,
    לקוחות: 62_000,
    "הוצאות פרסום": 24_000,
    "הוצאות ביטוח מראש": 57_750,
    "הלוואה שהתקבלה": -600_000,
    "הכנסות מייעוץ": -180_000,
    "הכנסות ממכירות": -140_000,
    "הון מניות": -100_000,
    עודפים: -48_000,
  } as Balances,
  items: [
    {
      title: "פרסום",
      story: "ב-1.8.2025 שולמו במזומן 24,000 ₪ על קמפיין פרסום לשנה (עד 31.7.2026).",
      recorded: "נרשם כולו כהוצאה: ח' הוצאות פרסום / ז' מזומן 24,000.",
      should: "5 חודשים (אוגוסט עד דצמבר) שייכים ל-2025: 24,000 × 5/12 = 10,000 הוצאה. 7 חודשים (ינואר עד יולי 2026) — 14,000 הוצאה מראש.",
      why: "אי אפשר להכיר בכל ההוצאה ב-2025: הקמפיין משרת גם את 2026. מכירים בהוצאה רק על 5 החודשים של השנה. 7 החודשים של 2026 עדיין נכס.",
      entry: e("א", "31.12.2025", "פקודת תיקון — פרסום", [{ account: "הוצאות פרסום מראש", dr: (24_000 * 7) / 12 }, { account: "הוצאות פרסום", cr: (24_000 * 7) / 12 }]),
    },
    {
      title: "ביטוח",
      story: "ב-1.10.2024 שולמו במזומן 66,000 ₪ על ביטוח לשנתיים (עד 30.9.2026) — 2,750 ₪ לחודש.",
      recorded: "ב-2024 נרשמו 8,250 הוצאה (3 חודשים) ו-57,750 ביטוח מראש. ב-2025 לא נרשם דבר — היתרה במאזן הבוחן עדיין של סוף 2024.",
      should: "כל שנת 2025 (12 חודשים) שייכת לשנה: 12 × 2,750 = 33,000 הוצאה. נשארים 9 חודשים של 2026 — 24,750 מראש.",
      why: "הביטוח שימש את כל 2025, אבל שום חלק ממנו לא עבר להוצאה השנה. מכירים בהוצאה על 12 החודשים של 2025, ומה ששייך ל-2026 נשאר נכס.",
      entry: e("ב", "31.12.2025", "פקודת התאמה — ביטוח", [{ account: "הוצאות ביטוח", dr: 12 * 2_750 }, { account: "הוצאות ביטוח מראש", cr: 12 * 2_750 }]),
    },
    {
      title: "ריבית",
      story: "ב-1.9.2025 נלקחה הלוואה של 600,000 ₪ לשנה, בריבית שנתית של 5% שתשולם עם הקרן ב-31.8.2026.",
      recorded: "נרשמה רק קבלת ההלוואה. אין במאזן הבוחן הוצאות ריבית.",
      should: "4 חודשים של ריבית (ספטמבר עד דצמבר) שייכים ל-2025 וטרם שולמו: 600,000 × 5% × 4/12 = 10,000.",
      why: "השתמשנו בכסף של הבנק 4 חודשים ב-2025, ולכן הריבית על התקופה הזו היא הוצאה של 2025 — גם אם עוד לא שילמנו אותה.",
      entry: e("ג", "31.12.2025", "פקודת התאמה — ריבית", [{ account: "הוצאות ריבית", dr: 600_000 * 0.05 * (4 / 12) }, { account: "הוצאות ריבית לשלם", cr: 600_000 * 0.05 * (4 / 12) }]),
    },
    {
      title: "ייעוץ",
      story: "ב-1.6.2025 התקבלו במזומן 180,000 ₪ על ליווי עסקי ללקוח למשך 12 חודשים (עד 31.5.2026).",
      recorded: "נרשם כולו כהכנסה: ח' מזומן / ז' הכנסות מייעוץ 180,000.",
      should: "7 חודשים (יוני עד דצמבר) שייכים ל-2025: 180,000 × 7/12 = 105,000 הכנסה. 5 חודשים של 2026 — 75,000 הכנסה מראש.",
      why: "אי אפשר להכיר בכל ההכנסה ב-2025: את 5 החודשים של 2026 עוד לא סיפקנו. עד שנספק אותם — אנחנו חייבים אותם ללקוח.",
      entry: e("ד", "31.12.2025", "פקודת תיקון — ייעוץ", [{ account: "הכנסות מייעוץ", dr: (180_000 * 5) / 12 }, { account: "הכנסות ייעוץ מראש", cr: (180_000 * 5) / 12 }]),
    },
    {
      title: "שכירות",
      story: "מ-1.11.2025 החברה משכירה מחסן ב-4,500 ₪ לחודש. התשלום הראשון, על נובמבר ודצמבר, יגיע ב-3.1.2026. לא נרשם דבר.",
      recorded: "לא נרשם דבר.",
      should: "חודשיים של שכירות שייכים ל-2025 וטרם התקבלו: 4,500 × 2 = 9,000.",
      why: "השוכר השתמש במחסן חודשיים ב-2025 — ההכנסה הורווחה השנה, גם אם הכסף עוד לא הגיע. לכן היא שייכת ל-2025.",
      entry: e("ה", "31.12.2025", "פקודת התאמה — שכירות", [{ account: 'הכנסות שכ"ד לקבל', dr: 4_500 * 2 }, { account: 'הכנסות שכ"ד', cr: 4_500 * 2 }]),
    },
    {
      title: "מלאי",
      story: "במהלך 2025 קנתה החברה סחורה ב-95,000 ₪. ב-31.12.2025 נספרו במחסן סחורות שלא נמכרו, בעלות 31,000 ₪. בגלל פגם באריזות, שווי המימוש נטו שלהן — 28,500 ₪.",
      recorded: "נרשמו רק הקניות: ח' קניות / ז' מזומן 95,000. מלאי הסגירה לא נרשם — כל הקניות נראות כהוצאה של השנה.",
      should: "מלאי סגירה לפי הנמוך מבין עלות (31,000) לשווי מימוש נטו (28,500): 28,500 — נכס במאזן, ומקטין את עלות המכר.",
      why: "מה שלא נמכר עד סוף השנה אינו הוצאה של השנה. בלי מלאי סגירה עלות המכר גבוהה ב-28,500 — והרווח נמוך באותו סכום.",
      entry: e("ו", "31.12.2025", "פקודת מלאי סגירה", [{ account: "מלאי סגירה מאזני", dr: Math.min(31_000, 28_500) }, { account: "מלאי סגירה רווח או הפסד", cr: Math.min(31_000, 28_500) }]),
    },
  ],
  get adjustments(): Entry[] {
    return this.items.map((i) => i.entry);
  },
};

/** Lesson 4's closing-stock screen: a year of a home-goods shop, from opening stock to cost of sales. */
export const COGS_CASE = { name: "חנות כלי הבית", year: "2025", opening: 64_000, purchases: 210_000, closing: 58_000 };
export const costOfSales = (m: { opening: number; purchases: number; closing: number }) => m.opening + m.purchases - m.closing;

/** Chapter 16: Tzaad, a shoe shop, in 2025 — the simple case (a general allowance only); the full guide has the rest. */
export const TZAAD = { openingCustomers: 200_000, openingAllowance: 10_000, creditSales: 500_000, collections: 456_000, badDebt: 4_000, rate: 0.05 };

export function creditLoss(k: typeof TZAAD) {
  const customers = k.openingCustomers + k.creditSales - k.collections - k.badDebt;
  const required = round2(customers * k.rate);
  // What the allowance already holds before the year-end entry: the opening, less the debts written off against it.
  const before = k.openingAllowance - k.badDebt;
  const expense = round2(required - before);
  return { customers, required, before, expense, net: round2(customers - required) };
}

/** Tzaad's year as journal entries: the sale, the collection, the write-off, and the year-end top-up. */
export function creditLossEntries(k: typeof TZAAD): Entry[] {
  const c = creditLoss(k);
  return [
    e("1", "2025", "מכירות באשראי", [{ account: "לקוחות", dr: k.creditSales }, { account: "מכירות", cr: k.creditSales }]),
    e("2", "2025", "גבייה מלקוחות", [{ account: "מזומן", dr: k.collections }, { account: "לקוחות", cr: k.collections }]),
    e("3", "2025", "מחיקת חוב אבוד", [{ account: "הפרשה להפסדי אשראי חזויים", dr: k.badDebt }, { account: "לקוחות", cr: k.badDebt }]),
    e("4", "31.12.2025", "השלמת ההפרשה לגובה הנדרש", [{ account: "הוצאות הפסדי אשראי", dr: c.expense }, { account: "הפרשה להפסדי אשראי חזויים", cr: c.expense }]),
  ];
}

// ---------------------------------------------------------------------------
// The practice set: new businesses and figures, every answer computed here.

export type Choice = { kind: "choice"; options: string[]; answer: number };
export type NumberQ = { kind: "number"; answer: number };
export type EntryQ = { kind: "entry"; accounts: string[]; dr: string; cr: string };
export type Question = { id: string; level: 1 | 2 | 3; skill: string; prompt: string; steps: string[] } & (Choice | NumberQ | EntryQ);

const fmt = (v: number) => v.toLocaleString("en-US");
const TYPES = ["נכס", "התחייבות", "הון", "הכנסה", "הוצאה"];

const Q = {
  q8: { others: { "ציוד": 52_000, לקוחות: 31_500, ספקים: -26_000, "הון בעלים": -75_000, מכירות: -88_000, קניות: 47_000, "הוצאות שכר": 19_500 } as Balances },
  q10: { opening: 5_500, dr: [9_300, 3_800], cr: [7_600, 1_900] },
  q11: { paid: 18_000, months: 12, monthsThisYear: 2 },
  q12: { monthly: 4_200, months: 3 },
  q13: { received: 30_000, months: 24, monthsThisYear: 4 },
  q14: { opening: 52_000, purchases: 136_000, closing: 47_000 },
  q15: { customers: 640_000, specificDebt: 30_000, specificRate: 0.6, generalRate: 0.03, allowance: 22_000 },
};
/** The trial balance of q8 without its cash line: for a practice that completes the table itself. */
export const Q8_TB = Q.q8.others;
const q8Cash = -Object.values(Q.q8.others).reduce((s, v) => s + v, 0);
const q8Dr = Object.values(Q.q8.others).filter((v) => v > 0);
const q8Cr = Object.values(Q.q8.others).filter((v) => v < 0).map((v) => -v);
const total = (xs: number[]) => xs.reduce((s, v) => s + v, 0);
const q10Balance = Q.q10.opening + Q.q10.dr.reduce((s, v) => s + v, 0) - Q.q10.cr.reduce((s, v) => s + v, 0);
const q11Prepaid = (Q.q11.paid * (Q.q11.months - Q.q11.monthsThisYear)) / Q.q11.months;
const q12Owed = Q.q12.monthly * Q.q12.months;
const q13Unearned = (Q.q13.received * (Q.q13.months - Q.q13.monthsThisYear)) / Q.q13.months;
const q14Cos = costOfSales(Q.q14);
const q15Required = round2(Q.q15.specificDebt * Q.q15.specificRate + (Q.q15.customers - Q.q15.specificDebt) * Q.q15.generalRate);
const q15Expense = round2(q15Required - Q.q15.allowance);

export const PRACTICE: Question[] = [
  {
    id: "q1",
    level: 1,
    skill: "סיווג חשבון",
    prompt: "חנות הכלים של אסף חייבת 4,700 ₪ ליבואן של כלי עבודה. מאיזה סוג החשבון 'ספקים'?",
    kind: "choice",
    options: TYPES,
    answer: 1,
    steps: ["ספקים = מי שמכר לעסק סחורה, ועוד לא קיבל את הכסף.", "כסף שהעסק ישלם בעתיד הוא התחייבות.", "לכן: התחייבות, ויתרתה בזכות."],
  },
  {
    id: "q2",
    level: 1,
    skill: "צד היתרה",
    prompt: "באיזה צד נמצאת בדרך כלל היתרה של 'הוצאות אחזקה'?",
    kind: "choice",
    options: ["חובה", "זכות"],
    answer: 0,
    steps: ["הוצאות אחזקה הן הוצאה.", "הוצאה גדלה בחובה, ולכן גם היתרה שלה בחובה."],
  },
  {
    id: "q3",
    level: 1,
    skill: "בניית פקודה",
    prompt: "מספרה קנתה כיסא שיער הידראולי ב-5,400 ₪ ושילמה בהעברה. בחרו את החשבון בחובה ואת החשבון בזכות.",
    kind: "entry",
    accounts: ["ציוד", "מזומן", "קניות", "הוצאות אחזקה", "ספקים"],
    dr: "ציוד",
    cr: "מזומן",
    steps: ["הכיסא יעבוד בשביל המספרה גם בשנה הבאה — נכס (לא קניות: קניות הן סחורה שמוכרים).", "נכנס ציוד — חובה.", "יצא כסף — זכות."],
  },
  {
    id: "q4",
    level: 1,
    skill: "מאזני או תוצאתי",
    prompt: "חשבון 'הכנסות מסדנאות' — מאזני או תוצאתי?",
    kind: "choice",
    options: ["מאזני — עובר לשנה הבאה", "תוצאתי — מתאפס בסוף השנה"],
    answer: 1,
    steps: ["הכנסות מודדות את מה שקרה בשנה אחת.", "הכנסות והוצאות הן חשבונות תוצאתיים: בסוף השנה התוצאה עוברת לעודפים, והן מתחילות מאפס."],
  },
  {
    id: "q5",
    level: 1,
    skill: "בניית פקודה",
    prompt: "עדי פתחה עסק לשיעורי שחייה והכניסה לחשבון העסק 42,000 ₪ מכספה. בחרו חובה וזכות.",
    kind: "entry",
    accounts: ["מזומן", "הון בעלים", "מכירות", "הלוואה", "לקוחות"],
    dr: "מזומן",
    cr: "הון בעלים",
    steps: ["כסף נכנס לעסק — חובה.", "הוא הגיע מהבעלים — הון בעלים, בזכות.", "זו לא הכנסה ולא הלוואה: זו השקעה של הבעלים."],
  },
  {
    id: "q6",
    level: 2,
    skill: "פקודה מורכבת",
    prompt: "חנות הטלפונים של גיא מכרה מכשירים ב-7,200 ₪: 2,700 התקבלו מיד, והשאר באשראי. איזו פקודה נכונה?",
    kind: "choice",
    options: [
      "ח' מזומן 2,700 · ח' לקוחות 4,500 / ז' מכירות 7,200",
      "ח' מזומן 7,200 / ז' מכירות 7,200",
      "ח' מכירות 7,200 / ז' מזומן 2,700 · ז' לקוחות 4,500",
      "ח' מזומן 2,700 · ח' ספקים 4,500 / ז' מכירות 7,200",
    ],
    answer: 0,
    steps: ["נכנסו שני דברים: 2,700 בכסף, וחוב של הלקוח על 4,500 — שניהם בחובה.", "יצאה סחורה — מכירות בזכות, 7,200.", "בדיקה: 2,700 + 4,500 = 7,200."],
  },
  {
    id: "q7",
    level: 2,
    skill: "מצא את הטעות",
    prompt: "מעבדת המחשבים של שני תיקנה לחברה מחשבים ב-4,600 ₪, והחברה תשלם בעוד חודש. נרשם: ח' מכירות 4,600 / ז' לקוחות 4,600. מה הטעות?",
    kind: "choice",
    options: ["הצדדים הפוכים: לקוחות בחובה ומכירות בזכות", "צריך מזומן במקום לקוחות", "הסכום שגוי", "אין טעות"],
    answer: 0,
    steps: ["במכירה באשראי נכנס לעסק חוב של הלקוח — לקוחות בחובה.", "יצא מהעסק שירות — מכירות (הכנסה) בזכות.", "הפקודה שנרשמה מאוזנת, אבל הפוכה."],
  },
  {
    id: "q8",
    level: 2,
    skill: "השלמת מאזן בוחן",
    prompt: `במאזן הבוחן של חנות האופניים של נדב חסרה רק יתרת המזומן. היתרות: ציוד ${fmt(52_000)} (ח'), לקוחות ${fmt(31_500)} (ח'), ספקים ${fmt(26_000)} (ז'), הון בעלים ${fmt(75_000)} (ז'), מכירות ${fmt(88_000)} (ז'), קניות ${fmt(47_000)} (ח'), הוצאות שכר ${fmt(19_500)} (ח'). מהי יתרת המזומן (בחובה)?`,
    kind: "number",
    answer: q8Cash,
    steps: [
      `סך הזכות: ${q8Cr.map(fmt).join(" + ")} = ${fmt(total(q8Cr))}.`,
      `סך החובה בלי מזומן: ${q8Dr.map(fmt).join(" + ")} = ${fmt(total(q8Dr))}.`,
      `מאזן בוחן תמיד מאוזן, ולכן המזומן הוא ההפרש: ${fmt(total(q8Cr))} − ${fmt(total(q8Dr))} = ${fmt(q8Cash)}.`,
    ],
  },
  {
    id: "q9",
    level: 2,
    skill: "מקדמות",
    prompt: "סוכנות הטיולים של ענבל קיבלה מקדמה של 3,200 ₪ על טיול לגליל. היום הטיול יצא לדרך. איזו פקודה רושמים היום?",
    kind: "choice",
    options: ["ח' מקדמות מלקוחות / ז' מכירות 3,200", "ח' מזומן / ז' מקדמות מלקוחות 3,200", "ח' מזומן / ז' מכירות 3,200", "ח' מכירות / ז' מקדמות מלקוחות 3,200"],
    answer: 0,
    steps: ["הכסף כבר התקבל ונרשם ביום המקדמה (ח' מזומן / ז' מקדמות מלקוחות).", "היום השירות ניתן: החוב ללקוח נסגר — מקדמות מלקוחות בחובה.", "וההכנסה נרשמת — מכירות בזכות."],
  },
  {
    id: "q10",
    level: 2,
    skill: "כרטיס T",
    prompt: `בכרטיס המזומן של מספרת 'תלתלים': יתרת פתיחה ${fmt(Q.q10.opening)} בחובה, תנועות בחובה ${Q.q10.dr.map(fmt).join(" ו-")}, תנועות בזכות ${Q.q10.cr.map(fmt).join(" ו-")}. מהי יתרת הסגירה?`,
    kind: "number",
    answer: q10Balance,
    steps: [
      `סך החובה כולל הפתיחה: ${fmt(Q.q10.opening)} + ${Q.q10.dr.map(fmt).join(" + ")} = ${fmt(Q.q10.opening + Q.q10.dr.reduce((s, v) => s + v, 0))}.`,
      `סך הזכות: ${Q.q10.cr.map(fmt).join(" + ")} = ${fmt(Q.q10.cr.reduce((s, v) => s + v, 0))}.`,
      `החובה גדולה יותר, ולכן היתרה בחובה: ${fmt(q10Balance)}.`,
    ],
  },
  {
    id: "q11",
    level: 3,
    skill: "פקודת התאמה",
    prompt: `ב-1.11 שילמה המכבסה של ליאת ${fmt(Q.q11.paid)} ₪ על ביטוח ל-12 חודשים, ורשמה הכול כהוצאה. כמה צריך להעביר להוצאות ביטוח מראש ב-31.12?`,
    kind: "number",
    answer: q11Prepaid,
    steps: [
      `ביטוח לחודש: ${fmt(Q.q11.paid)} ÷ ${Q.q11.months} = ${fmt(Q.q11.paid / Q.q11.months)}.`,
      `לשנה הנוכחית שייכים ${Q.q11.monthsThisYear} חודשים (נובמבר ודצמבר); ${Q.q11.months - Q.q11.monthsThisYear} חודשים שייכים לשנה הבאה.`,
      `פקודת התיקון: ח' הוצאות ביטוח מראש / ז' הוצאות ביטוח ${fmt(q11Prepaid)}.`,
    ],
  },
  {
    id: "q12",
    level: 3,
    skill: "הוצאות לשלם",
    prompt: `חברת השמירה מחייבת את בית האבות פעם ברבעון: ${fmt(Q.q12.monthly)} ₪ לחודש. החשבון על אוקטובר–דצמבר יגיע בינואר, ועוד לא נרשם. כמה רושמים ב-31.12 כהוצאות שמירה לשלם?`,
    kind: "number",
    answer: q12Owed,
    steps: [
      "השמירה של אוקטובר–דצמבר כבר ניתנה — היא הוצאה של השנה, גם אם החשבון יגיע רק בינואר.",
      `${fmt(Q.q12.monthly)} × ${Q.q12.months} חודשים = ${fmt(q12Owed)}.`,
      `פקודת ההתאמה: ח' הוצאות שמירה / ז' הוצאות שמירה לשלם ${fmt(q12Owed)}.`,
    ],
  },
  {
    id: "q13",
    level: 3,
    skill: "הכנסות מראש",
    prompt: `ב-1.9 קיבל בית הספר לנגינה של רועי ${fmt(Q.q13.received)} ₪ מראש על מנוי לשנתיים, ורשם הכול כהכנסה. כמה מזה צריך להעביר להכנסות מראש ב-31.12?`,
    kind: "number",
    answer: q13Unearned,
    steps: [
      `הכנסה לחודש: ${fmt(Q.q13.received)} ÷ ${Q.q13.months} = ${fmt(Q.q13.received / Q.q13.months)}.`,
      `השנה עברו ${Q.q13.monthsThisYear} חודשים (ספטמבר עד דצמבר); נותרו ${Q.q13.months - Q.q13.monthsThisYear}.`,
      `פקודת התיקון: ח' הכנסות ממנויים / ז' הכנסות ממנויים מראש ${fmt(q13Unearned)}.`,
    ],
  },
  {
    id: "q14",
    level: 3,
    skill: "עלות המכר",
    prompt: `בחנות הספרים של מיכל: מלאי פתיחה ${fmt(Q.q14.opening)}, קניות ${fmt(Q.q14.purchases)}, מלאי סגירה ${fmt(Q.q14.closing)}. מהי עלות המכר?`,
    kind: "number",
    answer: q14Cos,
    steps: ["עלות המכר = מלאי פתיחה + קניות − מלאי סגירה.", `${fmt(Q.q14.opening)} + ${fmt(Q.q14.purchases)} − ${fmt(Q.q14.closing)} = ${fmt(q14Cos)}.`],
  },
  {
    id: "q15",
    level: 3,
    skill: "הפסדי אשראי",
    prompt: `בחברת ההסעות של נתן: יתרת לקוחות ${fmt(Q.q15.customers)}. על חוב של ${fmt(Q.q15.specificDebt)} מפרישים ספציפית 60%, ועל שאר הלקוחות 3%. ההפרשה הקיימת ${fmt(Q.q15.allowance)}. כמה הוצאות הפסדי אשראי ירשמו השנה?`,
    kind: "number",
    answer: q15Expense,
    steps: [
      `ספציפית: ${fmt(Q.q15.specificDebt)} × 60% = ${fmt(Q.q15.specificDebt * Q.q15.specificRate)}.`,
      `כללית: (${fmt(Q.q15.customers)} − ${fmt(Q.q15.specificDebt)}) × 3% = ${fmt(round2((Q.q15.customers - Q.q15.specificDebt) * Q.q15.generalRate))}.`,
      `נדרשת: ${fmt(q15Required)}; קיימת: ${fmt(Q.q15.allowance)}; ההוצאה = ההפרש: ${fmt(q15Expense)}.`,
    ],
  },
];

/** Every journal entry in the model, for the balance checks. */
export function allEntries(): Entry[] {
  return [
    ...CANDLES.entries,
    CANDLES.closing,
    ...CREDIT.credit,
    ...CREDIT.advances,
    ...CREDIT.loan,
    ...CHECKS.run,
    SPLIT.purchase,
    SPLIT.sale,
    SPLIT.loanPayment,
    ...TCHELET.entries2025,
    closingEntry(TCHELET.tb2024, "סגירה", "31.12.2024"),
    ...Object.values(ACCRUAL.entries).flat(),
    ...SHACHAR.adjustments,
    ...creditLossEntries(TZAAD),
  ];
}
