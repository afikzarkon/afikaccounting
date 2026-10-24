import type { ReactNode } from "react";
import { Callout, DataTable } from "@/components/study/blocks";
import { type Entry, round2, type TAccount } from "@/lib/learn/basics";
import { ALLOW, ALON, ALON_LOW, AR, DOR, ERAN, GILBOA, RONIT, SCENARIO_A, SCENARIO_B, SCENARIO_C, SELF, year } from "@/lib/learn/credit-losses";
import { cn } from "@/lib/utils";
import { CreditLossCalculator } from "./credit-calculator";
import { Card, Chapter, EntryView, Money, Rule, Term } from "./ui";

const pct = (r: number) => `${round2(r * 100)}%`;
const f = (v: number) => v.toLocaleString("he-IL");
/** A key naming one line of a T-account: its account, and an entry id, "פתיחה" or "סגירה". */
const k = (account: string, ref: string) => `${account}|${ref}`;

const RONIT_YEAR = year({ openingAR: 0, openingAllowance: 0, creditSales: RONIT.customers * RONIT.each, required: (g) => g * (RONIT.unpaid / RONIT.customers) });

// ---------------------------------------------------------------------------
// The two T-accounts.

type Row = { key: string; label: string; ref?: string; amount: number; close?: boolean };

/** What a posting is, read from the account on the other side of its entry. */
function labelOf(account: string, side: "dr" | "cr", entry?: Entry) {
  const other = entry?.lines.find((l) => l.account !== account)?.account;
  if (account === AR) {
    if (side === "dr") return other === ALLOW ? "החזרת חוב שנמחק" : "מכירות באשראי";
    if (other === ALLOW) return "מחיקת חוב אבוד";
    return entry?.id.endsWith("ב") ? "גביית החוב שחזר" : "גבייה מלקוחות";
  }
  if (side === "dr") return other === AR ? "מחיקת חוב אבוד" : "ביטול הפרשה (קיטון)";
  return other === AR ? "החזרת חוב שנמחק" : "הוצאות הפסדי אשראי (גידול)";
}

/** A T-account balanced the way it is done on paper: the closing balance on the smaller side, then equal totals. */
function rowsOf(t: TAccount, entries: Entry[]) {
  const byId = new Map(entries.map((x) => [x.id, x]));
  const dr: Row[] = [];
  const cr: Row[] = [];
  const open: Row = { key: k(t.account, "פתיחה"), label: "יתרת פתיחה", amount: Math.abs(t.opening) };
  if (t.opening > 0) dr.push(open);
  if (t.opening < 0) cr.push(open);
  for (const p of t.dr) dr.push({ key: k(t.account, p.ref), label: labelOf(t.account, "dr", byId.get(p.ref)), ref: p.ref, amount: p.amount });
  for (const p of t.cr) cr.push({ key: k(t.account, p.ref), label: labelOf(t.account, "cr", byId.get(p.ref)), ref: p.ref, amount: p.amount });
  const closing: Row = { key: k(t.account, "סגירה"), label: t.account === AR ? "יתרת סגירה (ברוטו)" : "יתרת סגירה", amount: Math.abs(t.balance), close: true };
  if (t.balance > 0) cr.push(closing);
  if (t.balance < 0) dr.push(closing);
  return { dr, cr, total: round2(dr.reduce((s, r) => s + r.amount, 0)) };
}

function TBox({ t, entries, unknown, mode }: { t: TAccount; entries: Entry[]; unknown: Set<string>; mode: "question" | "solved" }) {
  const { dr, cr, total } = rowsOf(t, entries);
  const hidden = (r: Row) => unknown.has(r.key);
  const n = Math.max(dr.length, cr.length);
  const showTotal = mode === "solved" || !(dr.some(hidden) && cr.some(hidden));
  const side = (rows: Row[], first: boolean) => (
    <div className={cn("flex min-w-0 flex-col", first && "border-e-2 border-fg/70")}>
      <p className={cn("px-2 pt-1 text-[11px] font-bold", first ? "text-debit" : "text-credit")}>{first ? "חובה" : "זכות"}</p>
      <ul className="flex-1 space-y-0.5 px-1 pb-1">
        {rows.map((r) => (
          <li
            key={r.key}
            className={cn(
              "flex items-center justify-between gap-2 rounded px-1.5 py-1 text-[12.5px]",
              r.close && "mt-1 border-t border-dashed border-line font-semibold",
              hidden(r) && (mode === "question" ? "bg-amber-500/15 ring-1 ring-amber-500/50" : "bg-success/10 ring-1 ring-success/40"),
            )}
          >
            <span className="min-w-0 text-fg">
              {r.label}
              {r.ref && <span className="ms-1 text-[10px] text-subtle">({r.ref})</span>}
            </span>
            {hidden(r) && mode === "question" ? <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">?</span> : <Money v={r.amount} plain className="shrink-0" />}
          </li>
        ))}
        {Array.from({ length: n - rows.length }, (_, i) => (
          <li key={`e${i}`} className="py-1 text-[12.5px]">
            &nbsp;
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-2 border-t-2 border-fg/70 px-2.5 py-1.5 text-[12.5px] font-bold text-fg">
        <span>סה״כ</span>
        {showTotal ? <Money v={total} plain /> : <span className="text-amber-600 dark:text-amber-400">?</span>}
      </p>
    </div>
  );
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-2 border-b-2 border-fg/70 bg-surface-2/60 px-3 py-2 text-sm font-bold text-fg">
        <span>{t.account === AR ? "לקוחות (ברוטו)" : t.account}</span>
        <span className="text-[11px] font-normal text-subtle">{t.account === AR ? "נכס" : "מקטין את הלקוחות"}</span>
      </figcaption>
      <div className="grid grid-cols-2">
        {side(dr, true)}
        {side(cr, false)}
      </div>
    </figure>
  );
}

/** Customers and the allowance, side by side — the two cards every question is solved in. */
function TwoT({ accounts, entries, unknown = [], mode = "solved", caption }: { accounts: TAccount[]; entries: Entry[]; unknown?: string[]; mode?: "question" | "solved"; caption?: string }) {
  const set = new Set(unknown);
  const pair = [AR, ALLOW].map((a) => accounts.find((t) => t.account === a)).filter((t): t is TAccount => !!t);
  return (
    <div className="my-3">
      {caption && <p className="mb-1.5 text-sm font-semibold text-fg">{caption}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {pair.map((t) => (
          <TBox key={t.account} t={t} entries={entries} unknown={set} mode={mode} />
        ))}
      </div>
      {unknown.length > 0 && (
        <p className="mt-1.5 text-xs text-muted">
          {mode === "question" ? (
            <>
              <span className="rounded bg-amber-500/15 px-1.5 font-bold text-amber-600 dark:text-amber-400">?</span> — נעלם שנחלץ בכלל 3. סה״כ מופיע בצד
              שכולו ידוע — ושני הצדדים תמיד שווים.
            </>
          ) : (
            <>
              <span className="rounded bg-success/10 px-1.5 font-bold text-success">מודגש</span> — הנעלמים, אחרי החילוץ.
            </>
          )}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The method, and the frames it is applied in.

const RULES: { title: string; body: ReactNode }[] = [
  {
    title: "פותחים שני כרטיסי T סמוכים",
    body: (
      <>
        כרטיס אחד ל<strong>לקוחות (ברוטו)</strong> וכרטיס שני ל<strong>הפרשה להפסדי אשראי</strong> — זה ליד זה. כל שאלה נפתרת בתוך שני הכרטיסים האלה.
      </>
    ),
  },
  {
    title: "מציבים את כל הנתונים הידועים — בצד הנכון",
    body: (
      <>
        כל נתון מהשאלה נכנס לכרטיס שלו, בחובה או בזכות. מה שלא ידוע מסמנים <span className="font-bold text-amber-600 dark:text-amber-400">?</span>.
      </>
    ),
  },
  {
    title: "מחלצים את הנעלמים — אחורה או קדימה",
    body: (
      <ul className="mt-1 space-y-1.5">
        <li>
          <strong>אחוז ההפרשה:</strong> נתונות ההפרשה והלקוחות ברוטו באותו יום (למשל ב-31.12 אשתקד)? אחוז = הפרשה ÷ לקוחות ברוטו.
        </li>
        <li>
          <strong>יתרת הפתיחה של ההפרשה:</strong> נתונים האחוז והלקוחות ברוטו לתחילת השנה? הפרשה = לקוחות ברוטו × אחוז. (זו יתרת הסגירה של אשתקד — כשאין
          הפרשה ספציפית.)
        </li>
        <li>
          <strong>לקוחות נטו:</strong> נטו = ברוטו − הפרשה. ולהפך: אם נתונים הנטו והאחוז, ברוטו = נטו ÷ (100% − אחוז), והפרשה = ברוטו − נטו.
        </li>
        <li>
          <strong>ומה שנשאר:</strong> מאזנים כל כרטיס — סך החובה = סך הזכות — והנעלם הוא ההפרש.
        </li>
      </ul>
    ),
  },
];

/** The three rules, framed so they can't be missed. */
function MethodBox() {
  return (
    <section className="overflow-hidden rounded-2xl border-[3px] border-accent bg-surface shadow-[0_12px_30px_-18px_var(--accent)]" aria-labelledby="method-title">
      <header className="bg-accent px-5 py-3 text-accent-fg">
        <h3 id="method-title" className="text-xl font-extrabold tracking-tight">
          מתווה 3 הכללים — לפתרון כל שאלה בהפסדי אשראי
        </h3>
        <p className="text-sm opacity-90">אותו סדר, בכל שאלה, מהקלה ביותר ועד שאלת הבחינה.</p>
      </header>
      <ol className="divide-y divide-line">
        {RULES.map((r, i) => (
          <li key={r.title} className="flex gap-4 px-5 py-4">
            <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg">{i + 1}</span>
            <div className="min-w-0 text-[15px] leading-relaxed text-fg/90">
              <p className="text-[16px] font-bold text-fg">
                כלל {i + 1}: {r.title}
              </p>
              <div className="mt-0.5">{r.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A step of a solution, tagged with the rule it applies. */
function RuleStep({ rules, title, children }: { rules: number[]; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
        {rules.map((r) => (
          <span key={r} className="num rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-fg">
            כלל {r}
          </span>
        ))}
        {title}
      </p>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </div>
  );
}

/** A whole example: open and fill the two cards, extract the unknowns, then the entries and the balance sheet. */
function Walkthrough({
  x,
  unknown,
  given,
  solve,
  netCaption = "המאזן בסוף השנה — סעיף הלקוחות",
}: {
  x: { result: { accounts: TAccount[]; gross: number; allowance: number }; entries: Entry[] };
  unknown: string[];
  given?: ReactNode;
  solve: ReactNode;
  netCaption?: string;
}) {
  return (
    <div className="space-y-3">
      <RuleStep rules={[1, 2]} title="פותחים את שני הכרטיסים ומציבים את הנתונים">
        {given}
        <TwoT accounts={x.result.accounts} entries={x.entries} unknown={unknown} mode="question" />
      </RuleStep>
      <RuleStep rules={[3]} title="מחלצים את הנעלמים">
        {solve}
        <TwoT accounts={x.result.accounts} entries={x.entries} unknown={unknown} mode="solved" />
      </RuleStep>
      <RuleStep rules={[]} title="פקודות היומן, וההצגה במאזן">
        <Entries entries={x.entries} />
        <NetView gross={x.result.gross} allowance={x.result.allowance} caption={netCaption} />
      </RuleStep>
    </div>
  );
}

/** Customers as the balance sheet shows them: gross, less the allowance, net. */
function NetView({ gross, allowance, caption }: { gross: number; allowance: number; caption: string }) {
  return (
    <figure className="my-3 overflow-hidden rounded-xl border-2 border-accent/40 bg-surface">
      <figcaption className="bg-accent px-4 py-2 text-[15px] font-bold text-accent-fg">{caption}</figcaption>
      <div className="divide-y divide-line/60 text-sm">
        <p className="flex justify-between gap-3 px-4 py-2">
          <span className="text-fg">לקוחות (ברוטו)</span>
          <Money v={gross} plain />
        </p>
        <p className="flex justify-between gap-3 px-4 py-2">
          <span className="text-fg">בניכוי: הפרשה להפסדי אשראי חזויים</span>
          <Money v={-allowance} plain className="text-danger" />
        </p>
        <p className="flex justify-between gap-3 border-t-2 border-fg/70 px-4 py-2 font-bold text-fg">
          <span>לקוחות, נטו</span>
          <Money v={round2(gross - allowance)} plain />
        </p>
      </div>
    </figure>
  );
}

function Entries({ entries }: { entries: Entry[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {entries.map((x) => (
        <EntryView key={x.id} entry={x} title={`${x.id}. ${x.text}`} />
      ))}
    </div>
  );
}

/** One side of a template T-account: what is written there. */
function TemplateT({ title, dr, cr }: { title: string; dr: string[]; cr: string[] }) {
  const col = (items: string[], first: boolean) => (
    <div className={cn("min-w-0 p-2", first && "border-e-2 border-fg/70")}>
      <p className={cn("text-[11px] font-bold", first ? "text-debit" : "text-credit")}>{first ? "חובה" : "זכות"}</p>
      <ul className="mt-1 space-y-1 text-[13px] text-fg">
        {items.map((x) => (
          <li key={x} className={cn(x.startsWith("יתרת סגירה") && "border-t border-dashed border-line pt-1 font-semibold")}>
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
      <figcaption className="border-b-2 border-fg/70 bg-surface-2/60 px-3 py-2 text-sm font-bold text-fg">{title}</figcaption>
      <div className="grid grid-cols-2">
        {col(dr, true)}
        {col(cr, false)}
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Tables and lists.

const ENTRY_TABLE: [string, string, string, string][] = [
  ["מכירה באשראי", "לקוחות", "מכירות", "לקוחות ברוטו גדלים"],
  ["גבייה מלקוח", "מזומן", "לקוחות", "לקוחות ברוטו קטנים; ההפרשה לא משתנה"],
  ["גידול בהפרשה בסוף השנה", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", "הוצאה ברווח והפסד; לקוחות נטו קטנים"],
  ["ביטול הפרשה עודפת (קיטון)", "הפרשה להפסדי אשראי חזויים", "הוצאות הפסדי אשראי", "מקטין את ההוצאה; לקוחות נטו גדלים"],
  ["מחיקת חוב אבוד", "הפרשה להפסדי אשראי חזויים", "לקוחות", "ברוטו וההפרשה קטנים יחד; הנטו ורווח והפסד לא משתנים"],
  ["גביית חוב שנמחק — שלב 1", "לקוחות", "הפרשה להפסדי אשראי חזויים", "מחזירים את החוב לספרים"],
  ["גביית חוב שנמחק — שלב 2", "מזומן", "לקוחות", "גבייה רגילה"],
];

const MISTAKES: [string, string][] = [
  ["רושמים הוצאה במחיקת חוב אבוד", "המחיקה היא כנגד ההפרשה בלבד. ההוצאה נרשמה כבר כשהופרש, ותושלם — אם צריך — בהתאמה של סוף השנה."],
  ["רושמים כהוצאה את ההפרשה הנדרשת כולה", "ההוצאה היא רק ההפרש בין הנדרשת לבין היתרה שכבר יש בכרטיס (אחרי מחיקות וגביות)."],
  ["מחשבים הפרשה כללית גם על הלקוח הספציפי", "קודם מוציאים את הלקוח הספציפי מהבסיס, ורק על השאר מחילים את האחוז הכללי."],
  ["מחשבים את האחוז לפני מחיקת החובות האבודים", "האחוז חל על יתרת הסגירה של כרטיס הלקוחות — אחרי מכירות, גבייה ומחיקות."],
  ["מציבים את הנטו בכרטיס הלקוחות", "בכרטיס יש רק ברוטו. את הנטו מפרקים קודם לברוטו ולהפרשה (כלל 3)."],
  ["חושבים שקניות באשראי משפיעות על ההפרשה", "קניות באשראי מגדילות ספקים — התחייבות. אין להן קשר ללקוחות או להפרשה."],
];

const SELF_TEXT: { q: string; unknown: string[]; a: string }[] = [
  {
    q: "לקוחות ב-1.1: 500,000, הפרשה 25,000. במהלך השנה: מכירות באשראי 1,200,000, גבייה 869,000, מחיקת חובות אבודים 31,000. ההפרשה הנדרשת בסוף השנה: 5% מהלקוחות. מה הוצאות הפסדי האשראי?",
    unknown: [k(AR, "סגירה"), k(ALLOW, SELF[0].ids.adj), k(ALLOW, "סגירה")],
    a: "לקוחות בסוף השנה: 500,000 + 1,200,000 − 869,000 − 31,000 = 800,000, ולכן נדרשת 40,000. בכרטיס ההפרשה המחיקה (31,000) גדולה מהפתיחה (25,000) — לפני ההתאמה יש 6,000 בחובה. כדי להגיע ל-40,000 בזכות: 46,000. פקודה: ח' הוצאות הפסדי אשראי / ז' הפרשה 46,000.",
  },
  {
    q: "לקוחות ב-1.1: 860,000. במהלך השנה: מכירות באשראי 2,000,000, גבייה 1,951,000, מחיקות 9,000, ונגבה חוב שנמחק בעבר בסך 2,000. ב-31.12 ההפרשה היא 6% מהלקוחות, והוצאות הפסדי האשראי השנה 18,000. מה הייתה יתרת הפתיחה של ההפרשה?",
    unknown: [k(AR, "סגירה"), k(ALLOW, "פתיחה"), k(ALLOW, "סגירה")],
    a: "לקוחות בסוף השנה: 860,000 + 2,000,000 − 1,951,000 − 9,000 + 2,000 − 2,000 = 900,000, ולכן ההפרשה בסגירה 54,000. מאזנים את כרטיס ההפרשה אחורה: פתיחה = 54,000 + 9,000 − 2,000 − 18,000 = 43,000.",
  },
  {
    q: "לקוחות ב-1.1: 380,000, הפרשה 60,000. במהלך השנה: מכירות באשראי 1,000,000, גבייה 980,000. בסוף השנה לקוח בקשיים חייב 50,000 (הפרשה ספציפית 80%), ועל השאר 3%. מה הפקודה?",
    unknown: [k(ALLOW, SELF[2].ids.adj), k(ALLOW, "סגירה")],
    a: "לקוחות בסוף השנה: 400,000. ספציפית 40,000 + כללית 3% × 350,000 = 10,500 → נדרשת 50,500. בכרטיס 60,000 — עודף של 9,500: ח' הפרשה / ז' הוצאות הפסדי אשראי 9,500.",
  },
];

// ---------------------------------------------------------------------------

export function CreditLossChapters() {
  const g = GILBOA;
  const ronitTotal = RONIT.customers * RONIT.each;
  const ronitLoss = RONIT.unpaid * RONIT.each;
  return (
    <>
      <Chapter n={1} id="cl-idea" title="הרעיון בפשטות" lead="לא כל מי שקנה בהקפה ישלם — ואת זה כדאי לומר כבר עכשיו">
        <p>
          רונית מחזיקה חנות קטנה. השנה {RONIT.customers} לקוחות קנו אצלה &quot;בהקפה&quot; — לקחו סחורה ויבואו לשלם אחר כך — כל אחד ב-
          <Money v={RONIT.each} />. בסך הכול מגיעים לה <Money v={ronitTotal} />.
        </p>
        <div className="card p-4">
          <div className="mx-auto grid max-w-xs grid-cols-10 gap-1" role="img" aria-label={`${RONIT.customers} לקוחות, מתוכם ${RONIT.unpaid} שלא ישלמו`}>
            {Array.from({ length: RONIT.customers }, (_, i) => (
              <span key={i} className={cn("aspect-square rounded-sm", i >= RONIT.customers - RONIT.unpaid ? "bg-danger" : "bg-accent/70")} />
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            מניסיון של שנים רונית יודעת: בערך {RONIT.unpaid} מכל {RONIT.customers} לקוחות לא משלמים בסוף. היא לא יודעת <strong>מי</strong> — רק <strong>כמה</strong>.
          </p>
        </div>
        <p>
          אז כמה באמת יש לה? לא <Money v={ronitTotal} />, אלא בערך <Money v={ronitTotal - ronitLoss} />. את ה-<Money v={ronitLoss} /> שכנראה לא יגיעו היא רושמת
          כבר עכשיו כ&quot;כרית&quot; בצד — זו <strong>ההפרשה להפסדי אשראי</strong>.
        </p>
        <Rule>
          את הלקוחות לא מוחקים — הרי לא יודעים מי לא ישלם. רושמים לידם חשבון נפרד, &quot;כרית&quot;, שמקטין אותם. וכשמתברר שלקוח מסוים באמת לא ישלם — מורידים אותו
          מהלקוחות ומהכרית יחד.
        </Rule>
      </Chapter>

      <Chapter n={2} id="cl-terms" title="שני חשבונות ושלושה מושגים" lead="לקוחות ברוטו, הפרשה, ולקוחות נטו">
        <div className="grid gap-3 md:grid-cols-3">
          <Card title="לקוחות ברוטו">
            <p>
              כל מה שהלקוחות חייבים לפי החשבוניות. נכס, יתרה בחובה. אצל רונית: <Money v={ronitTotal} />.
            </p>
          </Card>
          <Card title="הפרשה להפסדי אשראי">
            <p>
              הכרית — החלק שצפוי לא להיגבות. יתרה בזכות, והיא מקטינה את הלקוחות. אצל רונית: <Money v={ronitLoss} />.
            </p>
          </Card>
          <Card title="לקוחות נטו">
            <p>
              מה שבאמת צפוי להיגבות: ברוטו פחות ההפרשה. זה הסכום שנכנס לסך הנכסים. אצל רונית: <Money v={ronitTotal - ronitLoss} />.
            </p>
          </Card>
        </div>
        <p className="rounded-xl bg-surface-2/70 py-4 text-center text-xl font-semibold text-fg">לקוחות ברוטו − הפרשה להפסדי אשראי = לקוחות נטו</p>
        <p>
          את ההפרשה רושמים כהוצאה — <Term he="הוצאות הפסדי אשראי" /> — בשנה שבה נעשו המכירות, כי ההפסד הצפוי שייך לשנה שבה נרשמה ההכנסה. כך זה נראה בשני
          הכרטיסים של רונית:
        </p>
        <TwoT accounts={RONIT_YEAR.result.accounts} entries={RONIT_YEAR.entries} />
        <Entries entries={RONIT_YEAR.entries} />
        <NetView gross={RONIT_YEAR.result.gross} allowance={RONIT_YEAR.result.allowance} caption="המאזן של רונית — סעיף הלקוחות" />
      </Chapter>

      <Chapter n={3} id="cl-method" title="מתווה 3 הכללים" lead="שיטה אחת לכל שאלה — שווה לזכור בעל פה">
        <MethodBox />
        <p>וזה מה שנכנס לכל צד בשני הכרטיסים. כל נתון בשאלה הוא אחת מהשורות האלה:</p>
        <div className="grid gap-3 md:grid-cols-2">
          <TemplateT title="לקוחות (ברוטו)" dr={["יתרת פתיחה", "מכירות באשראי", "החזרת חוב שנמחק"]} cr={["גבייה מלקוחות", "מחיקת חוב אבוד", "יתרת סגירה (ברוטו)"]} />
          <TemplateT
            title="הפרשה להפסדי אשראי חזויים"
            dr={["מחיקת חוב אבוד", "ביטול הפרשה (קיטון)", "יתרת סגירה"]}
            cr={["יתרת פתיחה", "החזרת חוב שנמחק", "הוצאות הפסדי אשראי (גידול)"]}
          />
        </div>
        <p className="text-sm text-muted">
          יתרת הסגירה נרשמת בצד ההפוך ליתרה, כדי ששני הצדדים יהיו שווים — כך &quot;מאזנים&quot; כרטיס, וכך מוצאים נעלם: מה שחסר כדי שהצדדים יהיו שווים.
        </p>
      </Chapter>

      <Chapter n={4} id="cl-entries" title="פקודות היומן" lead="שבע פקודות — וכל שאלה בנויה מהן">
        <div className="my-4 overflow-hidden rounded-xl border border-line">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] table-fixed text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead className="bg-surface-2/60">
                <tr className="text-xs text-muted">
                  <th className="px-3 py-2.5 text-start font-semibold">הפעולה</th>
                  <th className="px-3 py-2.5 text-start font-semibold text-debit">חובה</th>
                  <th className="px-3 py-2.5 text-start font-semibold text-credit">זכות</th>
                  <th className="px-3 py-2.5 text-start font-semibold">ההשפעה</th>
                </tr>
              </thead>
              <tbody>
                {ENTRY_TABLE.map(([a, dr, cr, effect]) => (
                  <tr key={a} className="border-t border-line/70 align-top">
                    <td className="px-3 py-2.5 font-medium text-fg">{a}</td>
                    <td className="px-3 py-2.5 font-medium text-debit">{dr}</td>
                    <td className="px-3 py-2.5 font-medium text-credit">{cr}</td>
                    <td className="px-3 py-2.5 text-[13px] text-muted">{effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Callout kind="warn" title="למה מחיקת חוב לא נוגעת ברווח והפסד?">
          <p>
            כי ההפסד כבר נרשם — כשהפרשנו. המחיקה רק מורידה את הלקוח מהלקוחות ומהכרית יחד: הלקוחות נטו לא משתנים. אם המחיקות גדולות מהכרית, כרטיס ההפרשה
            עובר זמנית לחובה — וההתאמה של סוף השנה משלימה.
          </p>
        </Callout>
        <Callout title="גביית חוב שנמחק — למה בשני שלבים?">
          <p>
            כדי שכרטיס הלקוחות יספר את כל הסיפור: החוב חוזר לספרים (מבטלים את המחיקה), ואז נגבה כרגיל. ההפרשה גדלה — ולכן ההוצאה של סוף השנה תהיה קטנה
            יותר באותו סכום.
          </p>
        </Callout>
      </Chapter>

      <Chapter n={5} id="cl-first" title="דוגמה ראשונה, מלאה" lead="שנה אחת של חברה — לפי שלושת הכללים">
        <Card title='חברת אלון בע"מ, 2025'>
          <p>
            ב-1.1.2025: לקוחות <Money v={ALON.openingAR} />, הפרשה <Money v={ALON.openingAllowance} />. במהלך השנה: מכירות באשראי <Money v={ALON.creditSales!} />,
            גבייה <Money v={ALON.collections!} />, ונמחק חוב אבוד של <Money v={ALON.writeOffs!} />. בסוף השנה ההנהלה מעריכה ש-{pct(ALON.rate)} מהלקוחות לא ייגבו.
          </p>
          <Walkthrough
            x={ALON}
            unknown={[k(AR, "סגירה"), k(ALLOW, ALON.ids.adj), k(ALLOW, "סגירה")]}
            solve={
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  מאזנים את כרטיס הלקוחות: {f(ALON.openingAR)} + {f(ALON.creditSales!)} − {f(ALON.collections!)} − {f(ALON.writeOffs!)} ={" "}
                  <strong>
                    <Money v={ALON.result.gross} />
                  </strong>
                  .
                </li>
                <li>
                  ההפרשה הנדרשת (יתרת הסגירה): {f(ALON.result.gross)} × {pct(ALON.rate)} ={" "}
                  <strong>
                    <Money v={ALON.required} />
                  </strong>
                  .
                </li>
                <li>
                  בכרטיס ההפרשה כבר יש {f(ALON.openingAllowance)} − {f(ALON.writeOffs!)} = <Money v={ALON.mid.allowance} />. מה שחסר עד הנדרשת הוא ההוצאה:{" "}
                  <strong>
                    <Money v={ALON.result.expense} />
                  </strong>
                  .
                </li>
              </ol>
            }
          />
        </Card>
        <Card title="ואם ההפרשה הקיימת גדולה מהנדרשת? ביטול הפרשה">
          <p>
            אותה שנה, אבל ההנהלה מעריכה רק {pct(ALON.lowRate)}: נדרשת <Money v={ALON_LOW.required} />, ובכרטיס כבר יש <Money v={ALON_LOW.mid.allowance} />. העודף,{" "}
            <Money v={-ALON_LOW.result.expense} />, מבוטל — ההפרשה קטנה (חובה) וההוצאה קטנה (זכות). הפעם הנעלם יושב בצד <strong>החובה</strong> של ההפרשה.
          </p>
          <TwoT accounts={ALON_LOW.result.accounts} entries={ALON_LOW.entries} unknown={[k(ALLOW, ALON_LOW.ids.adj)]} />
          <EntryView entry={ALON_LOW.adj} title={`${ALON_LOW.adj.id}. ${ALON_LOW.adj.text}`} />
        </Card>
      </Chapter>

      <Chapter n={6} id="cl-scenarios" title="חילוץ נעלמים: ארבעה תרחישים" lead="אותם שני כרטיסים — והנעלם בכל פעם במקום אחר">
        <p>בכל תרחיש: קודם מציבים בשני הכרטיסים את מה שידוע (כלל 2), ורק אז מחלצים (כלל 3). שימו לב איפה מופיע סימן השאלה.</p>

        <Card title="תרחיש א: נעלם בלקוחות ברוטו לתחילת השנה">
          <p>
            במאזן ליום 31.12.2024 הוצגו לקוחות נטו <Money v={SCENARIO_A.openingNet} />, וההפרשה היא {pct(SCENARIO_A.rate)} מהלקוחות ברוטו. ב-2025: מכירות באשראי{" "}
            <Money v={SCENARIO_A.creditSales!} />, גבייה <Money v={SCENARIO_A.collections!} />, מחיקה <Money v={SCENARIO_A.writeOffs!} />. האחוז לא השתנה.
          </p>
          <Walkthrough
            x={SCENARIO_A}
            unknown={[k(AR, "פתיחה"), k(ALLOW, "פתיחה"), k(AR, "סגירה"), k(ALLOW, SCENARIO_A.ids.adj), k(ALLOW, "סגירה")]}
            given={<p className="text-sm text-muted">את הנטו לא מציבים בכרטיס — בכרטיס הלקוחות יש רק ברוטו. לכן שתי יתרות הפתיחה הן נעלם.</p>}
            solve={
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  הנטו הוא {pct(1 - SCENARIO_A.rate)} מהברוטו. ברוטו = {f(SCENARIO_A.openingNet)} ÷ {pct(1 - SCENARIO_A.rate)} ={" "}
                  <strong>
                    <Money v={SCENARIO_A.openingAR} />
                  </strong>
                  ; הפרשה = {f(SCENARIO_A.openingAR)} − {f(SCENARIO_A.openingNet)} ={" "}
                  <strong>
                    <Money v={SCENARIO_A.openingAllowance} />
                  </strong>
                  .
                </li>
                <li>
                  עכשיו מאזנים את הלקוחות: יתרת סגירה <Money v={SCENARIO_A.result.gross} />, ולכן נדרשת {pct(SCENARIO_A.rate)} ={" "}
                  <Money v={SCENARIO_A.required} />.
                </li>
                <li>
                  בכרטיס ההפרשה לפני התאמה <Money v={SCENARIO_A.mid.allowance} /> — ההוצאה <Money v={SCENARIO_A.result.expense} />.
                </li>
              </ol>
            }
          />
        </Card>

        <Card title="תרחיש ב: נעלם בהוצאות הפסדי האשראי (הגידול בהפרשה)">
          <p>
            ב-1.1.2025: לקוחות <Money v={SCENARIO_B.openingAR} />, הפרשה <Money v={SCENARIO_B.openingAllowance} />. ב-2025: מכירות באשראי{" "}
            <Money v={SCENARIO_B.creditSales!} />, גבייה <Money v={SCENARIO_B.collections!} />, מחיקת חובות <Money v={SCENARIO_B.writeOffs!} />. בסוף השנה מפרישים
            באותו אחוז כמו אשתקד.
          </p>
          <Walkthrough
            x={SCENARIO_B}
            unknown={[k(AR, "סגירה"), k(ALLOW, SCENARIO_B.ids.adj), k(ALLOW, "סגירה")]}
            solve={
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  חילוץ האחוז מהיתרות של אשתקד: {f(SCENARIO_B.openingAllowance)} ÷ {f(SCENARIO_B.openingAR)} ={" "}
                  <strong>{pct(SCENARIO_B.rate)}</strong>.
                </li>
                <li>
                  מאזנים את הלקוחות: יתרת סגירה <Money v={SCENARIO_B.result.gross} />; הפרשה נדרשת: × {pct(SCENARIO_B.rate)} = <Money v={SCENARIO_B.required} />.
                </li>
                <li>
                  מאזנים את ההפרשה: בזכות יש פתיחה {f(SCENARIO_B.openingAllowance)}, בחובה מחיקה {f(SCENARIO_B.writeOffs!)} וסגירה {f(SCENARIO_B.required)}. כדי שהצדדים
                  יהיו שווים חסרים בזכות{" "}
                  <strong>
                    <Money v={SCENARIO_B.result.expense} />
                  </strong>{" "}
                  — זו ההוצאה.
                </li>
              </ol>
            }
          />
        </Card>

        <Card title="תרחיש ג: נעלם בגבייה מלקוחות">
          <p>
            לקוחות ב-1.1.2025: <Money v={SCENARIO_C.openingAR} />, וב-31.12.2025: <Money v={SCENARIO_C.closingAR} />. ב-2025: מכירות באשראי{" "}
            <Money v={SCENARIO_C.creditSales!} />, מחיקת חובות <Money v={SCENARIO_C.writeOffs!} />. ההפרשה — {pct(SCENARIO_C.rate)} מהלקוחות, בתחילת השנה ובסופה. כמה
            נגבה מהלקוחות?
          </p>
          <Walkthrough
            x={SCENARIO_C}
            unknown={[k(AR, SCENARIO_C.ids.collections), k(ALLOW, "פתיחה"), k(ALLOW, SCENARIO_C.ids.adj), k(ALLOW, "סגירה")]}
            solve={
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  בכרטיס הלקוחות צד החובה ידוע כולו: {f(SCENARIO_C.openingAR)} + {f(SCENARIO_C.creditSales!)} = <Money v={SCENARIO_C.openingAR + SCENARIO_C.creditSales!} />.
                  בזכות: מחיקה {f(SCENARIO_C.writeOffs!)} וסגירה {f(SCENARIO_C.closingAR)}. מה שחסר הוא הגבייה:{" "}
                  <strong>
                    <Money v={SCENARIO_C.collections!} />
                  </strong>
                  .
                </li>
                <li>
                  ההפרשה: פתיחה {f(SCENARIO_C.openingAR)} × {pct(SCENARIO_C.rate)} = <Money v={SCENARIO_C.openingAllowance} />; סגירה {f(SCENARIO_C.closingAR)} ×{" "}
                  {pct(SCENARIO_C.rate)} = <Money v={SCENARIO_C.required} />; לפני התאמה <Money v={SCENARIO_C.mid.allowance} />, ולכן ההוצאה{" "}
                  <Money v={SCENARIO_C.result.expense} />.
                </li>
              </ol>
            }
          />
        </Card>

        <Card title="תרחיש ד: הפרשה ספציפית לצד הפרשה כללית">
          <p>
            <Term he="הפרשה ספציפית" /> נקבעת ללקוח מסוים שידוע שהוא בקשיים. <Term he="הפרשה כללית" /> היא אחוז על <strong>שאר</strong> הלקוחות — בלי הלקוח הספציפי,
            אחרת ההפסד שלו נספר פעמיים.
          </p>
          <p>
            חברת דור, 2025: לקוחות ב-1.1 <Money v={DOR.openingAR} />, הפרשה <Money v={DOR.openingAllowance} />. מכירות באשראי <Money v={DOR.creditSales!} />, גבייה{" "}
            <Money v={DOR.collections!} />. ב-31.12 &quot;{DOR.specificName}&quot; חייב <Money v={DOR.specificDebt} /> ונמצא בקשיים — מעריכים ש-{pct(DOR.specificRate)}{" "}
            מהחוב לא ייגבה. על שאר הלקוחות {pct(DOR.generalRate)}.
          </p>
          <Walkthrough
            x={DOR}
            unknown={[k(AR, "סגירה"), k(ALLOW, DOR.ids.adj), k(ALLOW, "סגירה")]}
            solve={
              <>
                <p>
                  מאזנים את הלקוחות: <Money v={DOR.result.gross} />. הלקוח הספציפי עדיין חייב — הוא נשאר בכרטיס הלקוחות, ורק ההפרשה עליו מחושבת לחוד:
                </p>
                <DataTable
                  head={["", "חישוב", "סכום"]}
                  rows={[
                    ["הפרשה ספציפית", `${f(DOR.specificDebt)} × ${pct(DOR.specificRate)}`, DOR.specific],
                    ["הפרשה כללית — נכון", `(${f(DOR.result.gross)} − ${f(DOR.specificDebt)}) × ${pct(DOR.generalRate)}`, DOR.general],
                    ["הפרשה כללית — שגוי (על כולם)", `${f(DOR.result.gross)} × ${pct(DOR.generalRate)}`, DOR.wrongGeneral],
                  ]}
                  foot={["יתרת סגירה נדרשת", "ספציפית + כללית נכונה", DOR.required]}
                />
                <p>
                  בכרטיס ההפרשה יש <Money v={DOR.mid.allowance} />; ההוצאה: <Money v={DOR.result.expense} />. יתרת הסגירה ({f(DOR.required)}) מורכבת משני חלקים:{" "}
                  {f(DOR.specific)} ספציפית ו-{f(DOR.general)} כללית.
                </p>
              </>
            }
          />
          <h4 className="pt-2 font-semibold text-fg">ואם הלקוח פשט רגל עוד לפני סוף השנה?</h4>
          <p>
            אז זה כבר לא אומדן — זה חוב אבוד. מוחקים את כל <Money v={DOR.specificDebt} /> משני הכרטיסים: הוא יוצא מהלקוחות (זכות) ומההפרשה (חובה), ואין לו יותר
            הפרשה ספציפית. המחיקה גדולה מהיתרה שבכרטיס, ולכן לפני ההתאמה ההפרשה בחובה: <Money v={-DOR.bankrupt.mid.allowance} />. נדרשת רק כללית:{" "}
            {f(DOR.bankrupt.result.gross)} × {pct(DOR.generalRate)} = <Money v={DOR.bankrupt.required} />, וההוצאה <Money v={DOR.bankrupt.result.expense} />.
          </p>
          <TwoT accounts={DOR.bankrupt.result.accounts} entries={DOR.bankrupt.entries} unknown={[k(ALLOW, DOR.bankrupt.ids.adj), k(ALLOW, "סגירה")]} />
          <Entries entries={[DOR.bankrupt.entries.find((x) => x.id === DOR.bankrupt.ids.writeOff)!, DOR.bankrupt.adj]} />
        </Card>
      </Chapter>

      <Chapter n={7} id="cl-flow" title="מסיחים וחוב שחזר" lead="קניות באשראי שלא שייכות לכאן, וחוב שנמחק ונגבה">
        <Card title='חברת ערן בע"מ, 2025'>
          <p>
            ב-1.1.2025: לקוחות <Money v={ERAN.openingGross} />, הפרשה <Money v={ERAN.openingAllowance} />. במהלך השנה: מכירות באשראי <Money v={ERAN.creditSales} />,
            גבייה <Money v={ERAN.collections} />, קניות באשראי <Money v={ERAN.creditPurchases} />, מחיקת חוב אבוד <Money v={ERAN.written} />, וגבייה של חוב שנמחק ב-2024
            בסך <Money v={ERAN.recovered} />. בסוף השנה מפרישים {pct(ERAN.rate)} מהלקוחות.
          </p>
          <Walkthrough
            x={ERAN}
            unknown={[k(AR, "סגירה"), k(ALLOW, ERAN.adj.id), k(ALLOW, "סגירה")]}
            given={
              <p className="text-sm text-muted">
                הקניות באשראי לא נכנסות לאף אחד מהכרטיסים: הן מגדילות ספקים — התחייבות. החוב שחזר נכנס פעמיים לכרטיס הלקוחות (החזרה בחובה, גבייה בזכות) ופעם אחת
                להפרשה (בזכות).
              </p>
            }
            solve={
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  לקוחות בסוף השנה: <Money v={ERAN.mid.gross} />; נדרשת × {pct(ERAN.rate)} = <Money v={ERAN.required} />.
                </li>
                <li>
                  בהפרשה לפני התאמה: {f(ERAN.openingAllowance)} − {f(ERAN.written)} + {f(ERAN.recovered)} = <Money v={ERAN.mid.allowance} />. ההוצאה:{" "}
                  <strong>
                    <Money v={ERAN.result.expense} />
                  </strong>
                  .
                </li>
              </ol>
            }
          />
        </Card>
      </Chapter>

      <Chapter n={8} id="cl-exam" title="שאלה ברמת בחינה" lead="הכול ביחד: נטו בפתיחה, אשראי, פשיטת רגל, חוב שחזר ולקוח ספציפי">
        <Card title='חברת גלבוע בע"מ — 2025'>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              במאזן ליום 31.12.2024 הוצגו לקוחות נטו <Money v={g.openingNet} />. ההפרשה באותו יום הייתה {pct(g.openingRate)} מיתרת הלקוחות ברוטו. יתרת הספקים
              הייתה <Money v={g.openingSuppliers} />.
            </li>
            <li>
              ב-2025: מכירות באשראי <Money v={g.creditSales} />, מכירות במזומן <Money v={g.cashSales} />, גבייה מלקוחות <Money v={g.collections} />.
            </li>
            <li>
              קניות באשראי <Money v={g.creditPurchases} />, תשלומים לספקים <Money v={g.supplierPayments} />.
            </li>
            <li>
              ב-15.6.2025 פשטה רגל &quot;{g.bankruptName}&quot;, שחייבה <Money v={g.bankruptDebt} />. החוב נמחק.
            </li>
            <li>
              ב-10.9.2025 נגבה במזומן חוב של <Money v={g.recovered} /> שנמחק ב-2023.
            </li>
            <li>
              ב-31.12.2025: הלקוח &quot;{g.specificName}&quot; חייב <Money v={g.specificDebt} /> ונמצא בקשיים — הפרשה ספציפית {pct(g.specificRate)}. על שאר הלקוחות
              — הפרשה כללית {pct(g.generalRate)}.
            </li>
          </ul>
          <p className="font-semibold text-fg">
            נדרש: (1) יתרות הפתיחה של הלקוחות וההפרשה; (2) פקודות היומן ל-2025; (3) הוצאות הפסדי האשראי; (4) סעיף הלקוחות במאזן ליום 31.12.2025.
          </p>
        </Card>

        <h3 className="pt-2 text-lg font-semibold text-fg">הפתרון, לפי שלושת הכללים</h3>
        <div className="space-y-3">
          <RuleStep rules={[1, 2]} title="פותחים את שני הכרטיסים ומציבים את מה שידוע">
            <p className="text-sm text-muted">
              מכירות במזומן, קניות ותשלומים לספקים לא נכנסים לאף אחד מהכרטיסים. הנטו לא מוצב — יתרות הפתיחה הן נעלם.
            </p>
            <TwoT
              accounts={g.result.accounts}
              entries={g.entries}
              unknown={[k(AR, "פתיחה"), k(ALLOW, "פתיחה"), k(AR, "סגירה"), k(ALLOW, g.adj.id), k(ALLOW, "סגירה")]}
              mode="question"
            />
          </RuleStep>
          <RuleStep rules={[3]} title="יתרות הפתיחה — מתוך הנטו">
            <p>
              הנטו הוא {pct(1 - g.openingRate)} מהברוטו. ברוטו = {f(g.openingNet)} ÷ {pct(1 - g.openingRate)} ={" "}
              <strong>
                <Money v={g.openingGross} />
              </strong>
              . הפרשה = {f(g.openingGross)} − {f(g.openingNet)} ={" "}
              <strong>
                <Money v={g.openingAllowance} />
              </strong>
              .
            </p>
          </RuleStep>
          <RuleStep rules={[3]} title="מאזנים את כרטיס הלקוחות">
            <p>
              {f(g.openingGross)} + {f(g.creditSales)} + {f(g.recovered)} − {f(g.collections)} − {f(g.bankruptDebt)} − {f(g.recovered)} ={" "}
              <strong>
                <Money v={g.mid.gross} />
              </strong>
              .
            </p>
          </RuleStep>
          <RuleStep rules={[3]} title="ההפרשה הנדרשת — יתרת הסגירה של ההפרשה">
            <DataTable
              head={["", "חישוב", "סכום"]}
              rows={[
                ["הפרשה ספציפית", `${f(g.specificDebt)} × ${pct(g.specificRate)}`, g.specific],
                ["הפרשה כללית", `(${f(g.mid.gross)} − ${f(g.specificDebt)}) × ${pct(g.generalRate)}`, g.general],
              ]}
              foot={["הפרשה נדרשת", "", g.required]}
            />
          </RuleStep>
          <RuleStep rules={[3]} title="מאזנים את כרטיס ההפרשה — ההוצאה">
            <p>
              בזכות: פתיחה {f(g.openingAllowance)} + החוב שחזר {f(g.recovered)}. בחובה: מחיקה {f(g.bankruptDebt)} וסגירה {f(g.required)}. חסר בזכות:{" "}
              <strong>
                <Money v={g.result.expense} />
              </strong>{" "}
              — הוצאות הפסדי האשראי.
            </p>
            <TwoT
              accounts={g.result.accounts}
              entries={g.entries}
              unknown={[k(AR, "פתיחה"), k(ALLOW, "פתיחה"), k(AR, "סגירה"), k(ALLOW, g.adj.id), k(ALLOW, "סגירה")]}
            />
          </RuleStep>
          <RuleStep rules={[]} title="פקודות היומן">
            <Entries entries={g.entries} />
          </RuleStep>
          <RuleStep rules={[]} title="הצגה בדוחות">
            <div className="grid gap-4 lg:grid-cols-2">
              <NetView gross={g.result.gross} allowance={g.result.allowance} caption="המאזן ליום 31.12.2025 — סעיף הלקוחות" />
              <figure className="my-3 overflow-hidden rounded-xl border-2 border-fg/30 bg-surface">
                <figcaption className="bg-fg px-4 py-2 text-[15px] font-bold text-surface">רווח והפסד לשנת 2025 — מתוך</figcaption>
                <div className="divide-y divide-line/60 text-sm">
                  <p className="flex justify-between gap-3 px-4 py-2">
                    <span className="text-fg">מכירות (באשראי ובמזומן)</span>
                    <Money v={g.creditSales + g.cashSales} plain />
                  </p>
                  <p className="flex justify-between gap-3 px-4 py-2">
                    <span className="text-fg">הוצאות הפסדי אשראי</span>
                    <Money v={-g.result.expense} plain className="text-danger" />
                  </p>
                </div>
              </figure>
            </div>
          </RuleStep>
        </div>
      </Chapter>

      <Chapter n={9} id="cl-tools" title="מחשבון, טעויות ותרגול" lead="בדקו את עצמכם">
        <p>הזינו את נתוני השאלה — המחשבון מחשב את ההפרשה הנדרשת, ההוצאה או הביטול, ואת פקודת ההתאמה.</p>
        <CreditLossCalculator />
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-fg">טעויות נפוצות</h3>
          <ul className="mt-3 space-y-2.5">
            {MISTAKES.map(([wrong, right]) => (
              <li key={wrong} className="text-sm">
                <span className="font-semibold text-danger">✗ {wrong}</span>
                <span className="mt-0.5 block text-fg/85">✓ {right}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-fg">תרגול עצמי</h3>
          <p className="mt-1 text-sm text-muted">פתרו לפי שלושת הכללים, ורק אז פתחו את הפתרון.</p>
          <div className="mt-3 divide-y divide-line">
            {SELF_TEXT.map(({ q, a, unknown }, i) => (
              <details key={i} className="group py-3">
                <summary className="cursor-pointer list-none text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                  <span className="num me-2 text-accent">{i + 1}.</span>
                  {q}
                  <span className="ms-2 text-xs text-accent group-open:hidden">הציגו פתרון</span>
                </summary>
                <div className="mt-2 space-y-2">
                  <TwoT accounts={SELF[i].result.accounts} entries={SELF[i].entries} unknown={unknown} mode="question" caption="כללים 1 ו-2: שני הכרטיסים עם הנתונים" />
                  <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg">
                    <strong>כלל 3: </strong>
                    {a}
                  </p>
                  <TwoT accounts={SELF[i].result.accounts} entries={SELF[i].entries} unknown={unknown} caption="אחרי החילוץ" />
                </div>
              </details>
            ))}
          </div>
        </div>
      </Chapter>
    </>
  );
}
