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
  ציוד: "asset",
  מכונות: "asset",
  "כלי רכב": "asset",
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

/** Chapter 7: a business selling science kits for children, opened on 1.1.2023. */
export const KITS = {
  unitCost: 30,
  unitPrice: 54,
  bought: 10_000,
  sold: 1_000,
  entries: [
    e("1", "1.1.2023", "פתחת את העסק והשקעת בו 500,000 ₪ במזומן", [{ account: "מזומן", dr: 500_000 }, { account: "הון בעלים", cr: 500_000 }], "המזומן נכנס לעסק (מקבל), והבעלים נותן את ההשקעה — העסק חייב לו אותה."),
    e("2", "1.1.2023", "שילמת שכירות לחודש ינואר: 2,000 ₪", [{ account: "הוצאות שכירות", dr: 2_000 }, { account: "מזומן", cr: 2_000 }], "השכירות משרתת את העסק לחודש אחד בלבד — הוצאה. המזומן יוצא."),
    e("3", "2.1.2023", "קנית 10,000 ערכות ב-30 ₪ כל אחת, במזומן", [{ account: "קניות", dr: 300_000 }, { account: "מזומן", cr: 300_000 }], "קניית סחורה נרשמת בחשבון קניות. 10,000 × 30 = 300,000."),
    e("4", "3.1.2023", "מכרת 1,000 ערכות ב-54 ₪ כל אחת, במזומן", [{ account: "מזומן", dr: 54_000 }, { account: "מכירות", cr: 54_000 }], "המזומן נכנס, והעסק נותן סחורה — הכנסה. 1,000 × 54 = 54,000."),
    e("5", "5.1.2023", "שילמת 15,000 ₪ על פרסום", [{ account: "הוצאות פרסום", dr: 15_000 }, { account: "מזומן", cr: 15_000 }], "פרסום מקדם מכירות בטווח הקצר — הוצאה."),
    e("6", "31.1.2023", "שילמת לסטודנט שכר לינואר: 1,500 ₪", [{ account: "הוצאות שכר", dr: 1_500 }, { account: "מזומן", cr: 1_500 }], "שכר על עבודה של חודש — הוצאה."),
    e("7", "1.2.2023", "קנית לפטופ לעסק ב-1,850 ₪ במזומן", [{ account: "לפטופ", dr: 1_850 }, { account: "מזומן", cr: 1_850 }], "הלפטופ ישמש שנים ואפשר למכור אותו — השקעה, כלומר נכס."),
    e("8", "5.2.2023", "משכת מהעסק 20,000 ₪ לעצמך", [{ account: "הון בעלים", dr: 20_000 }, { account: "מזומן", cr: 20_000 }], "פעולה הפוכה להשקעה: ההון קטן (חובה), המזומן יוצא (זכות). זו לא הוצאה."),
  ] as Entry[],
  get closingUnits() {
    return this.bought - this.sold;
  },
  get closing(): Entry {
    const amount = this.closingUnits * this.unitCost;
    return e("סגירה", "31.12.2023", `ספרת במחסן ${this.closingUnits.toLocaleString("en-US")} ערכות שלא נמכרו, בעלות ${this.unitCost} ₪ כל אחת`, [
      { account: "מלאי סגירה מאזני", dr: amount },
      { account: "מלאי סגירה רווח או הפסד", cr: amount },
    ]);
  },
};

/** Chapters 8–9: a credit story, an advances story and a loan, each a short run of entries posted one after another. */
export const CREDIT = {
  credit: [
    e("1", "", "מכרת סחורה ב-1,000 ₪ באשראי: הלקוח ישלם בעוד שבוע", [{ account: "לקוחות", dr: 1_000 }, { account: "מכירות", cr: 1_000 }], "המכירה קרתה היום, ולכן נרשמת היום. במקום מזומן נכנס חוב של הלקוח."),
    e("2", "", "הלקוח שילם את החוב במזומן", [{ account: "מזומן", dr: 1_000 }, { account: "לקוחות", cr: 1_000 }], "אין הכנסה חדשה: החוב של הלקוח הופך למזומן."),
    e("3", "", "קנית סחורה ב-600 ₪ באשראי: תשלם לספק בעוד שבוע", [{ account: "קניות", dr: 600 }, { account: "ספקים", cr: 600 }], "הסחורה הגיעה היום. במקום מזומן נוצר חוב לספק."),
    e("4", "", "שילמת לספק את החוב במזומן", [{ account: "ספקים", dr: 600 }, { account: "מזומן", cr: 600 }], "אין הוצאה חדשה: החוב לספק נסגר והמזומן יוצא."),
  ] as Entry[],
  advances: [
    e("1", "", "לקוח שילם 1,000 ₪ מראש על מוצר שיקבל בעוד חודש", [{ account: "מזומן", dr: 1_000 }, { account: "מקדמות מלקוחות", cr: 1_000 }], "עוד לא מכרנו כלום: אנחנו חייבים ללקוח מוצר. זו התחייבות, לא הכנסה."),
    e("2", "", "סיפקת ללקוח את המוצר", [{ account: "מקדמות מלקוחות", dr: 1_000 }, { account: "מכירות", cr: 1_000 }], "החוב ללקוח נסגר, ורק עכשיו נרשמת ההכנסה."),
    e("3", "", "שילמת לספק 600 ₪ מראש על סחורה שתגיע בעוד חודש", [{ account: "מקדמות לספקים", dr: 600 }, { account: "מזומן", cr: 600 }], "הספק חייב לנו סחורה. זה נכס, עוד לא קנייה."),
    e("4", "", "הספק סיפק את הסחורה", [{ account: "קניות", dr: 600 }, { account: "מקדמות לספקים", cr: 600 }], "המקדמה נסגרת, ורק עכשיו נרשמת הקנייה."),
  ] as Entry[],
  loan: [
    e("1", "1.1.2023", "החברה לקחה הלוואה של 100,000 ₪ מהבנק", [{ account: "מזומן", dr: 100_000 }, { account: "הלוואה", cr: 100_000 }], "הכסף נכנס, והחברה חייבת אותו לבנק. זו התחייבות, לא הכנסה."),
    e("2", "31.12.2023", "החברה שילמה ריבית של 5,000 ₪ במזומן (5% לשנה)", [{ account: "הוצאות ריבית", dr: 5_000 }, { account: "מזומן", cr: 5_000 }], "ריבית היא המחיר על השימוש בכסף, ולכן היא הוצאה."),
    e("3", "31.12.2023", "החברה פרעה מחצית מההלוואה במזומן: 50,000 ₪", [{ account: "הלוואה", dr: 50_000 }, { account: "מזומן", cr: 50_000 }], "החזר הקרן אינו הוצאה: הוא רק מקטין את החוב."),
  ] as Entry[],
};

/** Chapters 11–13: Yuval Ltd, set up on 1.1.2020. Its trial balance for 2020 is given as balances. */
export const YUVAL = {
  tb2020: {
    לקוחות: 655_300,
    קניות: 500_000,
    "הוצאות שכר": 100_000,
    מכירות: -1_000_000,
    ספקים: -360_000,
    "הון בעלים": -100_000,
    "ריהוט משרדי": 120_000,
    "הוצאות פרסום": 5_000,
    "הלוואות שהתקבלו": -500_000,
    מזומן: 531_000,
    "הכנסות משכר דירה": -15_300,
    "הוצאות ארנונה": 64_000,
  } as Balances,
  entries2021: [
    e("1", "2021", "מכירת סחורה ללקוחות באשראי", [{ account: "לקוחות", dr: 100_000 }, { account: "מכירות", cr: 100_000 }]),
    e("2", "2021", "קניית סחורה מספקים באשראי", [{ account: "קניות", dr: 10_000 }, { account: "ספקים", cr: 10_000 }]),
    e("3", "2021", "לקוחות שילמו על חשבון החוב", [{ account: "מזומן", dr: 250_000 }, { account: "לקוחות", cr: 250_000 }]),
    e("4", "2021", "קניית ריהוט משרדי במזומן", [{ account: "ריהוט משרדי", dr: 40_000 }, { account: "מזומן", cr: 40_000 }]),
    e("5", "2021", "פירעון חלק מההלוואה", [{ account: "הלוואות שהתקבלו", dr: 400_000 }, { account: "מזומן", cr: 400_000 }]),
    e("6", "2021", "תשלום שכר במזומן", [{ account: "הוצאות שכר", dr: 120_000 }, { account: "מזומן", cr: 120_000 }]),
  ] as Entry[],
};

/**
 * Chapter 14: the four cut-off accounts, one small case each — what was
 * recorded during the year, then the year-end adjustment.
 */
const AC = {
  prepaid: { paid: 1_200, months: 12, monthsThisYear: 3 },
  accrued: { recorded: 110_000, monthsRecorded: 11, monthsMissing: 1 },
  unearned: { received: 6_000, months: 6, monthsThisYear: 2 },
  receivable: { loan: 100_000, rate: 0.1, monthsThisYear: 6 },
};
const acPrepaid = round2((AC.prepaid.paid * (AC.prepaid.months - AC.prepaid.monthsThisYear)) / AC.prepaid.months);
const acMissing = round2((AC.accrued.recorded / AC.accrued.monthsRecorded) * AC.accrued.monthsMissing);
const acUnearned = round2((AC.unearned.received * (AC.unearned.months - AC.unearned.monthsThisYear)) / AC.unearned.months);
const acInterest = round2(AC.receivable.loan * AC.receivable.rate * (AC.receivable.monthsThisYear / 12));

export const ACCRUAL = {
  ...AC,
  results: { prepaid: acPrepaid, accrued: acMissing, unearned: acUnearned, receivable: acInterest },
  entries: {
    prepaid: [
      e("1", "1.10", "שולם ביטוח לשנה, 1,200 ₪, ונרשם כולו כהוצאה", [{ account: "הוצאות ביטוח", dr: AC.prepaid.paid }, { account: "מזומן", cr: AC.prepaid.paid }]),
      e("2", "31.12", "התאמה: החלק של השנה הבאה עובר להוצאות מראש", [{ account: "הוצאות ביטוח מראש", dr: acPrepaid }, { account: "הוצאות ביטוח", cr: acPrepaid }]),
    ],
    accrued: [
      e("1", "1–11", "שכר ינואר עד נובמבר שולם ונרשם", [{ account: "הוצאות שכר", dr: AC.accrued.recorded }, { account: "מזומן", cr: AC.accrued.recorded }]),
      e("2", "31.12", "התאמה: שכר דצמבר, שישולם רק בינואר", [{ account: "הוצאות שכר", dr: acMissing }, { account: "הוצאות שכר לשלם", cr: acMissing }]),
    ],
    unearned: [
      e("1", "1.11", "התקבלו 6,000 ₪ שכירות מחסן לחצי שנה, ונרשמו כולם כהכנסה", [{ account: "מזומן", dr: AC.unearned.received }, { account: "הכנסות שכירות", cr: AC.unearned.received }]),
      e("2", "31.12", "התאמה: החלק של השנה הבאה עובר להכנסות מראש", [{ account: "הכנסות שכירות", dr: acUnearned }, { account: "הכנסות שכירות מראש", cr: acUnearned }]),
    ],
    receivable: [
      e("1", "1.7", "החברה הלוותה לעובד 100,000 ₪; הריבית תשולם ב-30.6 בשנה הבאה", [{ account: "הלוואה לעובד", dr: AC.receivable.loan }, { account: "מזומן", cr: AC.receivable.loan }]),
      e("2", "31.12", "התאמה: ריבית חצי השנה שכבר הורווחה", [{ account: "הכנסות ריבית לקבל", dr: acInterest }, { account: "הכנסות ריבית", cr: acInterest }]),
    ],
  } satisfies Record<keyof typeof AC, Entry[]>,
};

/** Chapters 14 and 17: Ronen Ltd, set up on 1.1.2016; the preliminary trial balance for 31.12.2017. */
export const RONEN = {
  preliminary: {
    מזומן: 548_500,
    לקוחות: 50_000,
    "הוצאות פרסום": 36_000,
    "הוצאות ביטוח מראש": 72_000,
    "הלוואה שהתקבלה": -1_000_000,
    "הכנסות מייעוץ": -240_000,
    "הכנסות ממכירות": -110_000,
    // Accumulated losses: a debit balance on retained earnings at 1.1.2017.
    עודפים: 643_500,
  } as Balances,
  items: [
    {
      title: "פרסום",
      story: "ב-1.4.2017 שולמו במזומן 36,000 ₪ על פרסום לשנה (עד 31.3.2018).",
      recorded: "נרשם כולו כהוצאה: ח' הוצאות פרסום / ז' מזומן 36,000.",
      should: "9 חודשים (אפריל עד דצמבר) שייכים ל-2017: 36,000 × 9/12 = 27,000 הוצאה. 3 חודשים (ינואר עד מרץ 2018) — 9,000 הוצאה מראש.",
      entry: e("א", "31.12.2017", "פקודת תיקון — פרסום", [{ account: "הוצאות פרסום מראש", dr: (36_000 * 3) / 12 }, { account: "הוצאות פרסום", cr: (36_000 * 3) / 12 }]),
    },
    {
      title: "ביטוח",
      story: "ב-1.7.2016 שולמו במזומן 96,000 ₪ על ביטוח לשנתיים (עד 30.6.2018).",
      recorded: "ב-2016 נרשמו 24,000 הוצאה (6 חודשים) ו-72,000 ביטוח מראש. ב-2017 לא נרשם דבר — היתרה במאזן הבוחן עדיין של סוף 2016.",
      should: "כל שנת 2017 (12 חודשים) שייכת לשנה: 96,000 × 12/24 = 48,000 הוצאה. נשארים 6 חודשים של 2018 — 24,000 מראש.",
      entry: e("ב", "31.12.2017", "פקודת התאמה — ביטוח", [{ account: "הוצאות ביטוח", dr: (96_000 * 12) / 24 }, { account: "הוצאות ביטוח מראש", cr: (96_000 * 12) / 24 }]),
    },
    {
      title: "ריבית",
      story: "ב-30.6.2017 נלקחה הלוואה של 1,000,000 ₪ לשנה, בריבית שנתית של 6% שתשולם עם הקרן ב-30.6.2018.",
      recorded: "נרשמה רק קבלת ההלוואה. אין במאזן הבוחן הוצאות ריבית.",
      should: "חצי שנה של ריבית שייכת ל-2017 וטרם שולמה: 1,000,000 × 6% × 6/12 = 30,000.",
      entry: e("ג", "31.12.2017", "פקודת התאמה — ריבית", [{ account: "הוצאות ריבית", dr: 1_000_000 * 0.06 * (6 / 12) }, { account: "הוצאות ריבית לשלם", cr: 1_000_000 * 0.06 * (6 / 12) }]),
    },
    {
      title: "ייעוץ",
      story: "ב-31.3.2017 התקבלו במזומן 240,000 ₪ על ייעוץ ללקוח למשך 15 חודשים (עד 30.6.2018).",
      recorded: "נרשם כולו כהכנסה: ח' מזומן / ז' הכנסות מייעוץ 240,000.",
      should: "9 חודשים (אפריל עד דצמבר) שייכים ל-2017: 240,000 × 9/15 = 144,000 הכנסה. 6 חודשים של 2018 — 96,000 הכנסה מראש.",
      entry: e("ד", "31.12.2017", "פקודת תיקון — ייעוץ", [{ account: "הכנסות מייעוץ", dr: (240_000 * 6) / 15 }, { account: "הכנסות ייעוץ מראש", cr: (240_000 * 6) / 15 }]),
    },
    {
      title: "שכירות",
      story: "ב-31.10.2017 הושכר מבנה ב-12,000 ₪ לחודש. התשלום הראשון, על נובמבר ודצמבר, יגיע ב-5.1.2018. לא נרשם דבר.",
      recorded: "לא נרשם דבר.",
      should: "חודשיים של שכירות שייכים ל-2017 וטרם התקבלו: 12,000 × 2 = 24,000.",
      entry: e("ה", "31.12.2017", "פקודת התאמה — שכירות", [{ account: 'הכנסות שכ"ד לקבל', dr: 12_000 * 2 }, { account: 'הכנסות שכ"ד', cr: 12_000 * 2 }]),
    },
  ],
  get adjustments(): Entry[] {
    return this.items.map((i) => i.entry);
  },
};

/** Chapter 15: Mia Ltd's cost of sales, with purchases after the course's correction (500,000 less a 150,000 advance). */
export const MIA = { opening: 280_000, purchases: 500_000 - 150_000, closing: 315_000 };
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
  q8: { others: { "ציוד": 64_000, לקוחות: 23_500, ספקים: -18_000, "הון בעלים": -90_000, מכירות: -71_000, קניות: 41_000, "הוצאות שכר": 12_500 } as Balances },
  q10: { opening: 7_000, dr: [12_000, 4_500], cr: [9_800, 2_200] },
  q11: { paid: 24_000, months: 12, monthsThisYear: 3 },
  q12: { elevenMonths: 132_000 },
  q13: { received: 36_000, months: 18, monthsThisYear: 6 },
  q14: { opening: 40_000, purchases: 150_000, closing: 35_000 },
  q15: { customers: 500_000, specificDebt: 20_000, specificRate: 0.5, generalRate: 0.04, allowance: 15_000 },
};
const q8Cash = -Object.values(Q.q8.others).reduce((s, v) => s + v, 0);
const q8Dr = Object.values(Q.q8.others).filter((v) => v > 0);
const q8Cr = Object.values(Q.q8.others).filter((v) => v < 0).map((v) => -v);
const total = (xs: number[]) => xs.reduce((s, v) => s + v, 0);
const q10Balance = Q.q10.opening + Q.q10.dr.reduce((s, v) => s + v, 0) - Q.q10.cr.reduce((s, v) => s + v, 0);
const q11Prepaid = (Q.q11.paid * (Q.q11.months - Q.q11.monthsThisYear)) / Q.q11.months;
const q12Month = Q.q12.elevenMonths / 11;
const q13Unearned = (Q.q13.received * (Q.q13.months - Q.q13.monthsThisYear)) / Q.q13.months;
const q14Cos = costOfSales(Q.q14);
const q15Required = Q.q15.specificDebt * Q.q15.specificRate + (Q.q15.customers - Q.q15.specificDebt) * Q.q15.generalRate;
const q15Expense = q15Required - Q.q15.allowance;

export const PRACTICE: Question[] = [
  {
    id: "q1",
    level: 1,
    skill: "סיווג חשבון",
    prompt: "המאפייה של נועה חייבת 6,000 ₪ לטחנת הקמח. מה סוג החשבון 'ספקים'?",
    kind: "choice",
    options: TYPES,
    answer: 1,
    steps: ["ספקים = מי שהעסק חייב לו כסף על סחורה שקיבל.", "חוב שהעסק ישלם בעתיד הוא התחייבות.", "לכן: התחייבות, ויתרתה בזכות."],
  },
  {
    id: "q2",
    level: 1,
    skill: "צד היתרה",
    prompt: "באיזה צד נמצאת בדרך כלל היתרה של 'הוצאות פרסום'?",
    kind: "choice",
    options: ["חובה", "זכות"],
    answer: 0,
    steps: ["הוצאות פרסום היא הוצאה.", "הוצאה גדלה בחובה, ולכן גם היתרה שלה בחובה."],
  },
  {
    id: "q3",
    level: 1,
    skill: "בניית פקודה",
    prompt: "בית הקפה של עומרי קנה מכונת אספרסו לעסק ב-12,000 ₪ במזומן. בחרו את החשבון בחובה ואת החשבון בזכות.",
    kind: "entry",
    accounts: ["מכונות", "מזומן", "קניות", "הוצאות שכירות", "ספקים"],
    dr: "מכונות",
    cr: "מזומן",
    steps: ["המכונה תשמש שנים ואפשר למכור אותה — זו השקעה, כלומר נכס (לא קניות: קניות הן סחורה למכירה).", "העסק מקבל מכונה — חובה.", "מזומן יוצא — זכות."],
  },
  {
    id: "q4",
    level: 1,
    skill: "מאזני או תוצאתי",
    prompt: "חשבון 'הכנסות משכירות' — מאזני או תוצאתי?",
    kind: "choice",
    options: ["מאזני — עובר לשנה הבאה", "תוצאתי — מתאפס בסוף השנה"],
    answer: 1,
    steps: ["הכנסות מודדות את מה שקרה בשנה אחת.", "חשבונות של הכנסות והוצאות הם תוצאתיים: בסוף השנה הם נסגרים לעודפים ומתחילים מאפס."],
  },
  {
    id: "q5",
    level: 1,
    skill: "בניית פקודה",
    prompt: "דנה פתחה סטודיו ליוגה והשקיעה בו 80,000 ₪ במזומן. בחרו חובה וזכות.",
    kind: "entry",
    accounts: ["מזומן", "הון בעלים", "מכירות", "הלוואה", "לקוחות"],
    dr: "מזומן",
    cr: "הון בעלים",
    steps: ["המזומן נכנס לעסק — חובה.", "הבעלים נותנת את ההשקעה — הון בעלים בזכות.", "זו לא הכנסה ולא הלוואה: זו השקעה של הבעלים."],
  },
  {
    id: "q6",
    level: 2,
    skill: "פקודה מורכבת",
    prompt: "חנות הספרים של איתי מכרה ספרים ב-9,000 ₪: 4,000 ₪ התקבלו במזומן והשאר באשראי. איזו פקודה נכונה?",
    kind: "choice",
    options: [
      "ח' מזומן 4,000 · ח' לקוחות 5,000 / ז' מכירות 9,000",
      "ח' מזומן 9,000 / ז' מכירות 9,000",
      "ח' מכירות 9,000 / ז' מזומן 4,000 · ז' לקוחות 5,000",
      "ח' מזומן 4,000 · ח' ספקים 5,000 / ז' מכירות 9,000",
    ],
    answer: 0,
    steps: ["שני ערכים נכנסים: מזומן 4,000 וחוב של לקוח 5,000 — שניהם בחובה.", "החנות נותנת סחורה — מכירות בזכות, 9,000.", "בדיקה: 4,000 + 5,000 = 9,000, הפקודה מאוזנת."],
  },
  {
    id: "q7",
    level: 2,
    skill: "מצא את הטעות",
    prompt: "המכבסה של רון סיפקה שירות בהקפה ב-3,000 ₪. מנהל החשבונות רשם: ח' מכירות 3,000 / ז' לקוחות 3,000. מה הטעות?",
    kind: "choice",
    options: ["הצדדים הפוכים: לקוחות בחובה ומכירות בזכות", "צריך מזומן במקום לקוחות", "הסכום שגוי", "אין טעות"],
    answer: 0,
    steps: ["במכירה באשראי העסק מקבל חוב של הלקוח — לקוחות בחובה.", "העסק נותן שירות — מכירות (הכנסה) בזכות.", "הפקודה שנרשמה מאוזנת, אבל הפוכה."],
  },
  {
    id: "q8",
    level: 2,
    skill: "השלמת מאזן בוחן",
    prompt: `במאזן הבוחן של המשתלה של שירן חסרה רק יתרת המזומן. היתרות: ציוד ${fmt(64_000)} (ח'), לקוחות ${fmt(23_500)} (ח'), ספקים ${fmt(18_000)} (ז'), הון בעלים ${fmt(90_000)} (ז'), מכירות ${fmt(71_000)} (ז'), קניות ${fmt(41_000)} (ח'), הוצאות שכר ${fmt(12_500)} (ח'). מהי יתרת המזומן (בחובה)?`,
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
    prompt: "סטודיו הצילום של מאיה קיבל מקדמה של 2,500 ₪ על צילומי חתונה. היום החתונה צולמה. איזו פקודה רושמים היום?",
    kind: "choice",
    options: ["ח' מקדמות מלקוחות / ז' מכירות 2,500", "ח' מזומן / ז' מקדמות מלקוחות 2,500", "ח' מזומן / ז' מכירות 2,500", "ח' מכירות / ז' מקדמות מלקוחות 2,500"],
    answer: 0,
    steps: ["הכסף כבר התקבל ונרשם ביום קבלת המקדמה (ח' מזומן / ז' מקדמות מלקוחות).", "היום השירות סופק: החוב ללקוח נסגר — מקדמות מלקוחות בחובה.", "וההכנסה מוכרת — מכירות בזכות."],
  },
  {
    id: "q10",
    level: 2,
    skill: "כרטיס T",
    prompt: `בכרטיס המזומן של מוסך 'גלגל': יתרת פתיחה ${fmt(Q.q10.opening)} בחובה, תנועות בחובה ${Q.q10.dr.map(fmt).join(" ו-")}, תנועות בזכות ${Q.q10.cr.map(fmt).join(" ו-")}. מהי יתרת הסגירה?`,
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
    prompt: `ב-1.10 שילמה חנות האופניים של טל ${fmt(Q.q11.paid)} ₪ על ביטוח ל-12 חודשים, ורשמה הכול כהוצאה. כמה צריך להעביר להוצאות ביטוח מראש ב-31.12?`,
    kind: "number",
    answer: q11Prepaid,
    steps: [
      `ביטוח לחודש: ${fmt(Q.q11.paid)} ÷ ${Q.q11.months} = ${fmt(Q.q11.paid / Q.q11.months)}.`,
      `לשנה הנוכחית שייכים ${Q.q11.monthsThisYear} חודשים (אוקטובר עד דצמבר); ${Q.q11.months - Q.q11.monthsThisYear} חודשים שייכים לשנה הבאה.`,
      `פקודת התיקון: ח' הוצאות ביטוח מראש / ז' הוצאות ביטוח ${fmt(q11Prepaid)}.`,
    ],
  },
  {
    id: "q12",
    level: 3,
    skill: "הוצאות לשלם",
    prompt: `במשרד עורכי הדין של ליאור נרשמו הוצאות שכר של ${fmt(Q.q12.elevenMonths)} ₪ על ינואר עד נובמבר. שכר דצמבר ישולם ב-10 בינואר. השכר אחיד. כמה רושמים כהוצאות שכר לשלם?`,
    kind: "number",
    answer: q12Month,
    steps: [
      `שכר לחודש: ${fmt(Q.q12.elevenMonths)} ÷ 11 = ${fmt(q12Month)}.`,
      "דצמבר שייך לשנה הזו גם אם ישולם בינואר — בסיס מצטבר.",
      `פקודת ההתאמה: ח' הוצאות שכר / ז' הוצאות שכר לשלם ${fmt(q12Month)}.`,
    ],
  },
  {
    id: "q13",
    level: 3,
    skill: "הכנסות מראש",
    prompt: `ב-1.7 קיבל מכון הכושר של שקד ${fmt(Q.q13.received)} ₪ מראש על מנוי ל-18 חודשים, ורשם הכול כהכנסה. כמה מזה צריך להעביר להכנסות מראש ב-31.12?`,
    kind: "number",
    answer: q13Unearned,
    steps: [
      `הכנסה לחודש: ${fmt(Q.q13.received)} ÷ ${Q.q13.months} = ${fmt(Q.q13.received / Q.q13.months)}.`,
      `השנה עברו ${Q.q13.monthsThisYear} חודשים (יולי עד דצמבר); נותרו ${Q.q13.months - Q.q13.monthsThisYear}.`,
      `פקודת התיקון: ח' הכנסות ממנויים / ז' הכנסות ממנויים מראש ${fmt(q13Unearned)}.`,
    ],
  },
  {
    id: "q14",
    level: 3,
    skill: "עלות המכר",
    prompt: `בחנות הצעצועים של יעל: מלאי פתיחה ${fmt(Q.q14.opening)}, קניות ${fmt(Q.q14.purchases)}, מלאי סגירה ${fmt(Q.q14.closing)}. מהי עלות המכר?`,
    kind: "number",
    answer: q14Cos,
    steps: ["עלות המכר = מלאי פתיחה + קניות − מלאי סגירה.", `${fmt(Q.q14.opening)} + ${fmt(Q.q14.purchases)} − ${fmt(Q.q14.closing)} = ${fmt(q14Cos)}.`],
  },
  {
    id: "q15",
    level: 3,
    skill: "הפסדי אשראי",
    prompt: `בחברת הניקיון של אורי: יתרת לקוחות ${fmt(Q.q15.customers)}. על חוב של ${fmt(Q.q15.specificDebt)} מפרישים ספציפית 50%, ועל שאר הלקוחות 4%. ההפרשה הקיימת ${fmt(Q.q15.allowance)}. כמה הוצאות הפסדי אשראי ירשמו השנה?`,
    kind: "number",
    answer: q15Expense,
    steps: [
      `ספציפית: ${fmt(Q.q15.specificDebt)} × 50% = ${fmt(Q.q15.specificDebt * Q.q15.specificRate)}.`,
      `כללית: (${fmt(Q.q15.customers)} − ${fmt(Q.q15.specificDebt)}) × 4% = ${fmt((Q.q15.customers - Q.q15.specificDebt) * Q.q15.generalRate)}.`,
      `נדרשת: ${fmt(q15Required)}; קיימת: ${fmt(Q.q15.allowance)}; ההוצאה = ההפרש: ${fmt(q15Expense)}.`,
    ],
  },
];

/** Every journal entry in the model, for the balance checks. */
export function allEntries(): Entry[] {
  return [
    ...KITS.entries,
    KITS.closing,
    ...CREDIT.credit,
    ...CREDIT.advances,
    ...CREDIT.loan,
    ...YUVAL.entries2021,
    closingEntry(YUVAL.tb2020, "סגירה", "31.12.2020"),
    ...Object.values(ACCRUAL.entries).flat(),
    ...RONEN.adjustments,
    ...creditLossEntries(TZAAD),
  ];
}
