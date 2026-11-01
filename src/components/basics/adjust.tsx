import { Banknote, ClipboardList } from "lucide-react";
import { ACCRUAL, balancesOf, costOfSales, type Entry, interestFor, ledger, COGS_CASE, ODD, ODD_RESULTS, PERIOD, SHACHAR, round2, statements, trialBalance } from "@/lib/learn/basics";
import type { ScreenContent } from "@/components/study-mode/shell";
import { cn } from "@/lib/utils";
import { AdjustedTrialBalance, type Move } from "./adjusted-tb";
import { MiniQuiz } from "./inventory-interactive";
import { EntryViews } from "./entry-views";
import { TCardsDialog } from "./t-dialog";
import { Posted } from "./t-accounts";
import { Calc, JE, KeyCard, Money, Rule, StatementsView, type Step, Stepper, TBTable } from "./ui";

const EXAMPLE_FINAL = balancesOf(ledger(SHACHAR.adjustments, SHACHAR.preliminary));
const EXAMPLE_S = statements(EXAMPLE_FINAL);
const pct = (r: number) => `${round2(r * 100)}%`;
// Two illustrative net realisable values for the shop's closing stock: one above its cost, one below.
const COGS_NRV_HIGH = 61_000;
const COGS_NRV_LOW = 52_000;
const COGS_ENTRY: Entry = {
  id: "מלאי",
  date: `31.12.${COGS_CASE.year}`,
  text: "רישום מלאי הסגירה",
  lines: [
    { account: "מלאי סגירה מאזני", dr: Math.min(COGS_CASE.closing, COGS_NRV_HIGH) },
    { account: "מלאי סגירה רווח או הפסד", cr: Math.min(COGS_CASE.closing, COGS_NRV_HIGH) },
  ],
};

type Segment = { months: number; label: string; year: "this" | "next" };

/** Months as a bar: this year's share of the period, and what belongs to next year; the coin marks when cash moves. */
function Timeline({ segments, cash, cashAt }: { segments: Segment[]; cash: string; cashAt: "start" | "end" }) {
  const total = segments.reduce((s, x) => s + x.months, 0);
  return (
    <div aria-label={`ציר זמן: ${segments.map((s) => `${s.label} ${s.months} חודשים`).join(", ")}; ${cash}`}>
      <div className={cn("mb-1 flex items-center gap-1 text-xs font-medium text-accent", cashAt === "end" && "justify-end")}>
        <Banknote className="h-3.5 w-3.5" aria-hidden /> {cash}
      </div>
      <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-line" dir="rtl">
        {segments.map((s, i) => (
          <div
            key={i}
            className={cn(
              "grid min-w-0 place-items-center truncate px-1 text-[11px] font-semibold",
              s.year === "this" ? "bg-accent text-accent-fg" : "bg-[repeating-linear-gradient(45deg,var(--surface-2)_0_6px,transparent_6px_12px)] text-muted",
            )}
            style={{ width: `${(s.months / total) * 100}%` }}
          >
            {s.label} · {s.months} ח׳
          </div>
        ))}
      </div>
    </div>
  );
}

/** One cut-off case: how it differs from the one before, the story, the sum written out, and the adjustment with its cards. */
function CutoffStep({
  analogy,
  diff,
  story,
  timeline,
  calc,
  views,
}: {
  analogy: React.ReactNode;
  diff: React.ReactNode;
  story: React.ReactNode;
  timeline: React.ReactNode;
  calc: React.ReactNode;
  views: React.ReactNode;
}) {
  return (
    <>
      {analogy}
      <p className="rounded-lg bg-fg/[0.04] px-3 py-2 text-[14px] text-fg">
        <span className="me-1.5 rounded-md bg-fg px-1.5 py-0.5 text-[11px] font-bold text-surface">במה שונה</span>
        {diff}
      </p>
      <p>{story}</p>
      {timeline}
      {calc}
      {views}
    </>
  );
}

// The four cut-off accounts by name: the word that misleads (where it came from), the word that decides (what it is now), and what it is.
const NAMES: [string, string, "נכס" | "התחייבות"][] = [
  ["הוצאות", "מראש", "נכס"],
  ["הוצאות", "לשלם", "התחייבות"],
  ["הכנסות", "מראש", "התחייבות"],
  ["הכנסות", "לקבל", "נכס"],
];
// The opening example: a year's rent paid on 1.11.
const RENT = { paid: 16_800, thisYear: 2 };
const rentThisYear = (RENT.paid * RENT.thisYear) / 12;
const rentNextYear = RENT.paid - rentThisYear;

// The four cut-off accounts (a screen each), and Ronen at year end.
const A = ACCRUAL;
const R = A.results;
// Each cut-off account first as an everyday picture: three entries, the account's card, and how its balance moves.
type Picture = { title: string; story: React.ReactNode; account: string; entries: Entry[]; rule: string };
const line = (id: string, text: string, dr: string, cr: string, amount: number): Entry => ({
  id,
  text,
  lines: [
    { account: dr, dr: amount },
    { account: cr, cr: amount },
  ],
});
const PICTURES: Record<"prepaid" | "accrued" | "unearned" | "receivable", Picture> = {
  prepaid: {
    title: "גיפט קארד שקנינו",
    story: "קנינו במזומן גיפט קארד. מעכשיו, בכל פעם שנשלם בו על הוצאה — במקום להוציא שוב כסף — מורידים ממנו. הכרטיס שווה כסף לעסק, ולכן הוא נכס.",
    account: "הוצאות מראש",
    entries: [
      line("1", "קנינו גיפט קארד ב-1,500 ₪ במזומן", "הוצאות מראש", "מזומן", 1_500),
      line("2", "שילמנו בגיפט קארד על כיבוד: 650 ₪", "הוצאות כיבוד", "הוצאות מראש", 650),
      line("3", "שילמנו בו את השאר על כיבוד: 850 ₪", "הוצאות כיבוד", "הוצאות מראש", 850),
    ],
    rule: "היתרה מתחילה בחובה, ותמיד נשארת בחובה. היא קטנה בזכות — מול הוצאה רגילה — עד שמגיעה ל-0.",
  },
  accrued: {
    title: "חוב במכולת",
    story: "אנחנו לוקחים מצרכים מהמכולת ״על החשבון״: לא עובר כסף, ורק בסוף החודש משלמים הכול יחד. בינתיים אנחנו חייבים למכולת — זו התחייבות.",
    account: "הוצאות לשלם",
    entries: [
      line("1", "לקחנו מצרכים מהמכולת ב-700 ₪ — על החשבון", "הוצאות כיבוד", "הוצאות לשלם", 700),
      line("2", "לקחנו עוד ב-450 ₪ — על החשבון", "הוצאות כיבוד", "הוצאות לשלם", 450),
      line("3", "סוף החודש: שילמנו למכולת את כל ה-1,150 ₪", "הוצאות לשלם", "מזומן", 1_150),
    ],
    rule: "החשבון מתחיל ב-0 וגדל בזכות — מול הוצאה רגילה — עד שמשלמים אותו, ואז הוא חוזר ל-0.",
  },
  unearned: {
    title: "גיפט קארד שהנפקנו ללקוח",
    story: "לקוח קנה מאיתנו גיפט קארד. בכל פעם שהוא ירצה לקנות — במקום לשלוף שוב כסף — נוריד לו מהכרטיס. עד אז אנחנו חייבים לו סחורה — זו התחייבות.",
    account: "הכנסות מראש",
    entries: [
      line("1", "לקוח קנה מאיתנו גיפט קארד ב-1,200 ₪ במזומן", "מזומן", "הכנסות מראש", 1_200),
      line("2", "הלקוח קנה בכרטיס סחורה ב-500 ₪", "הכנסות מראש", "מכירות", 500),
      line("3", "הלקוח מימש את השאר: 700 ₪", "הכנסות מראש", "מכירות", 700),
    ],
    rule: "היתרה מתחילה בזכות, ותמיד נשארת בזכות. היא קטנה בחובה — מול הכנסה רגילה — עד שמגיעה ל-0.",
  },
  receivable: {
    title: "הפעם — אנחנו המכולת",
    story: "לקוח לוקח מאיתנו ״על החשבון״: לא עובר כסף, ורק בסוף החודש הוא משלם הכול יחד. בינתיים הוא חייב לנו — זה נכס.",
    account: "הכנסות לקבל",
    entries: [
      line("1", "הלקוח לקח מאיתנו ב-800 ₪ — על החשבון", "הכנסות לקבל", "מכירות", 800),
      line("2", "הוא לקח עוד ב-350 ₪ — על החשבון", "הכנסות לקבל", "מכירות", 350),
      line("3", "סוף החודש: הלקוח שילם לנו את כל ה-1,150 ₪", "מזומן", "הכנסות לקבל", 1_150),
    ],
    rule: "החשבון מתחיל ב-0 וגדל בחובה — מול הכנסה רגילה — עד שמשלמים לנו אותו, ואז הוא חוזר ל-0.",
  },
};

/** The everyday picture of a cut-off account: the story, its entries, the card, and its balance after each entry. */
function Analogy({ title, story, account, entries, rule }: Picture) {
  const card = ledger(entries).find((t) => t.account === account)!;
  const after = entries.map((_, i) => balancesOf(ledger(entries.slice(0, i + 1)))[account] ?? 0);
  return (
    <section className="space-y-3 rounded-2xl border-2 border-accent/30 bg-accent-soft/40 p-4">
      <p className="text-[16px] font-bold text-fg">דמיינו: {title}</p>
      <p className="text-[15px]">{story}</p>
      <ol className="space-y-1.5">
          {entries.map((x) => (
            <li key={x.id} className="rounded-lg bg-surface px-3 py-2 text-[14px]">
              <span className="num me-1.5 font-bold text-muted">{x.id}.</span>
              {x.text}
              <span className="num mt-0.5 block text-[12.5px] text-muted">
                ח׳ {x.lines[0].account} / ז׳ {x.lines[1].account} · <Money v={x.lines[0].dr!} plain />
              </span>
            </li>
          ))}
      </ol>
      <TCardsDialog cards={[card]} help={false} />
      <p className="num flex flex-wrap items-center gap-1.5 text-[14px]">
        <span className="font-semibold text-fg">היתרה אחרי כל שלב:</span>
        {after.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-subtle">←</span>}
            <span className={cn("rounded-md px-2 py-0.5 font-bold", b > 0 ? "bg-debit/10 text-debit" : b < 0 ? "bg-credit/10 text-credit" : "bg-surface-2 text-muted")}>
              {b === 0 ? "0" : <Money v={Math.abs(b)} plain />} {b > 0 ? "ח׳" : b < 0 ? "ז׳" : ""}
            </span>
          </span>
        ))}
      </p>
      <p className="rounded-lg bg-surface px-3 py-2 text-[14.5px] font-semibold text-fg">{rule}</p>
    </section>
  );
}

// Prepaid and unearned, recorded the way the screens tell it: the payment to a prepaid account first, the used or earned part moved out at year end.
const PREPAID_ENTRIES: Entry[] = [
  line("1", "1.9: שולם ביטוח לשנה, ונרשם כהוצאה מראש", "הוצאות ביטוח מראש", "מזומן", A.prepaid.paid),
  line("2", "31.12: מה שנוצל השנה עובר להוצאה", "הוצאות ביטוח", "הוצאות ביטוח מראש", A.prepaid.paid - R.prepaid),
];
const UNEARNED_ENTRIES: Entry[] = [
  line("1", "1.11: התקבלה שכירות חניה ל-8 חודשים, ונרשמה כהכנסה מראש", "מזומן", "הכנסות שכירות מראש", A.unearned.received),
  line("2", "31.12: מה שהורווח השנה עובר להכנסה", "הכנסות שכירות מראש", "הכנסות שכירות", A.unearned.received - R.unearned),
];

// Each cut-off account's event as one compound entry, for the views to split.
const PREPAID_ONE: Entry = {
  id: "1",
  text: "שולם ביטוח לשנה: מה שנוצל השנה — הוצאה, והשאר — הוצאה מראש",
  lines: [
    { account: "הוצאות ביטוח מראש", dr: R.prepaid },
    { account: "הוצאות ביטוח", dr: A.prepaid.paid - R.prepaid },
    { account: "מזומן", cr: A.prepaid.paid },
  ],
};
const ACCRUED_ONE: Entry = {
  id: "1",
  text: "ניקיון השנה: שלושה רבעונים שולמו, והרבעון האחרון — עוד לא",
  lines: [
    { account: "הוצאות ניקיון", dr: R.recorded + R.accrued },
    { account: "מזומן", cr: R.recorded },
    { account: "הוצאות ניקיון לשלם", cr: R.accrued },
  ],
};
const UNEARNED_ONE: Entry = {
  id: "1",
  text: "התקבלה שכירות חניה ל-8 חודשים: מה שהורווח השנה — הכנסה, והשאר — הכנסה מראש",
  lines: [
    { account: "מזומן", dr: A.unearned.received },
    { account: "הכנסות שכירות", cr: A.unearned.received - R.unearned },
    { account: "הכנסות שכירות מראש", cr: R.unearned },
  ],
};
const RECEIVABLE_ONE: Entry = {
  id: "1",
  text: "30.6: התקבלו תמלוגים על 12 חודשים",
  lines: [
    { account: "מזומן", dr: R.receivable * 2 },
    { account: "הכנסות מתמלוגים לקבל", cr: R.receivable },
    { account: "הכנסות מתמלוגים", cr: R.receivable },
  ],
};
const RECEIVABLE_SPLIT: Entry[] = [
  line("1", "30.6: החצי של השנה הקודמת סוגר את ההכנסה לקבל", "מזומן", "הכנסות מתמלוגים לקבל", R.receivable),
  line("2", "30.6: החצי של השנה הזו — הכנסה שלה", "מזומן", "הכנסות מתמלוגים", R.receivable),
];

const cutoff: Step[] = [
  {
    title: "1. הוצאות מראש — נכס",
    body: (
      <CutoffStep
        analogy={<Analogy {...PICTURES.prepaid} />}
        diff="הראשון: הכסף יצא לפני שנהנינו."
        story={
          <>
            ב-1.9 שילמנו <Money v={A.prepaid.paid} /> על ביטוח לשנה, ורשמנו את התשלום כהוצאה מראש — נכס. עד 31.12 נוצל רק חלק ממנו.
          </>
        }
        timeline={<Timeline cash="תשלום ב-1.9" cashAt="start" segments={[{ months: 4, label: "השנה", year: "this" }, { months: 8, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <>
            <Calc>
              השנה עברו 4 חודשים: 4/12 × <Money v={A.prepaid.paid} /> = <strong><Money v={A.prepaid.paid - R.prepaid} /></strong> הוצאה השנה. 8/12 × <Money v={A.prepaid.paid} /> ={" "}
              <strong><Money v={R.prepaid} /></strong> הוצאה מראש לשנה הבאה.
            </Calc>
          </>
        }
        views={
          <EntryViews
            title="הפקודה: מזומן, הוצאה, והוצאה מראש"
            compound={PREPAID_ONE}
            split={PREPAID_ENTRIES}
            note={<>בפקודה אחת: מה שנוצל השנה — הוצאה, ומה ששייך לשנה הבאה — הוצאה מראש, מול המזומן ששולם.</>}
          />
        }
      />
    ),
  },
  {
    title: "2. הוצאות לשלם — התחייבות",
    body: (
      <CutoffStep
        analogy={<Analogy {...PICTURES.accrued} />}
        diff="ההפך מהקודם: כבר נהנינו, והכסף עוד לא יצא."
        story={
          <>
            חברת ניקיון מנקה את המשרד כל השנה, ומחייבת פעם ברבעון: <Money v={A.accrued.quarterly} />. שלושת הרבעונים הראשונים, <Money v={R.recorded} />, שולמו ונרשמו. החשבון על אוקטובר–דצמבר יגיע רק בינואר — ולא נרשם.
          </>
        }
        timeline={<Timeline cash="החשבון מגיע בינואר" cashAt="end" segments={[{ months: 9, label: "ינואר–ספטמבר · נרשם", year: "this" }, { months: 3, label: "אוקטובר–דצמבר · חסר", year: "next" }]} />}
        calc={
          <Calc result={<Money v={R.accrued} />}>
            הניקיון של אוקטובר–דצמבר כבר נעשה — הוא הוצאה של השנה. רבעון אחד: </Calc>
        }
        views={
          <EntryViews
            title="הפקודה: הוצאה, מזומן, והוצאה לשלם"
            compound={ACCRUED_ONE}
            split={A.entries.accrued}
            note={<>בפקודה אחת: כל שכר השנה הוא הוצאה — מה ששולם יצא מהמזומן, ומה שעוד לא שולם הוא הוצאה לשלם.</>}
          />
        }
      />
    ),
  },
  {
    title: "3. הכנסות מראש — התחייבות",
    body: (
      <CutoffStep
        analogy={<Analogy {...PICTURES.unearned} />}
        diff="המראה של הוצאות מראש, בצד ההכנסות: הכסף נכנס לפני שנתנו את השירות."
        story={
          <>
            ב-1.11 קיבלנו <Money v={A.unearned.received} /> על השכרת חניה ל-8 חודשים, ורשמנו את התקבול כהכנסה מראש — התחייבות: עד שנספק את החודשים, אנחנו חייבים אותם לשוכר.
          </>
        }
        timeline={<Timeline cash="תקבול ב-1.11" cashAt="start" segments={[{ months: 2, label: "השנה", year: "this" }, { months: 6, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <Calc>
            השנה עברו 2 חודשים: 2/8 × <Money v={A.unearned.received} /> = <strong><Money v={A.unearned.received - R.unearned} /></strong> הכנסה השנה. 6/8 ×{" "}
            <Money v={A.unearned.received} /> = <strong><Money v={R.unearned} /></strong> הכנסה מראש.
          </Calc>
        }
        views={
          <EntryViews
            title="הפקודה: מזומן, הכנסה, והכנסה מראש"
            compound={UNEARNED_ONE}
            split={UNEARNED_ENTRIES}
            note={<>בפקודה אחת: מה שהורווח השנה — הכנסה, ומה שעוד חייבים לשוכר — הכנסה מראש, מול המזומן שהתקבל.</>}
          />
        }
      />
    ),
  },
  {
    title: "4. הכנסות לקבל — נכס",
    body: (
      <CutoffStep
        analogy={<Analogy {...PICTURES.receivable} />}
        diff="המראה של הוצאות לשלם: כבר הרווחנו, והכסף עוד לא נכנס."
        story={
          <>
            ב-1.7 מכרנו לרשת חנויות זכות להשתמש בעיצוב שלנו, תמורת תמלוגים של <Money v={A.receivable.monthly} /> לחודש. הרשת משלמת פעם בשנה, ב-30.6, על 12 החודשים שעברו. עד 31.12 לא נרשם דבר.
          </>
        }
        timeline={<Timeline cash="התמלוגים יתקבלו ב-30.6" cashAt="end" segments={[{ months: 6, label: "השנה · הורווחו", year: "this" }, { months: 6, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <Calc result={<Money v={R.receivable} />}>
            <Money v={A.receivable.monthly} /> × 6 חודשים (יולי–דצמבר)
          </Calc>
        }
        views={
          <>
            <JE entry={A.entries.receivable[0]} title="פקודת ההתאמה · 31.12" note={null} />
            <EntryViews
              title="ב-30.6, כשהתמלוגים מתקבלים: מזומן, הכנסה לקבל, והכנסה"
              compound={RECEIVABLE_ONE}
              split={RECEIVABLE_SPLIT}
              note={<>בפקודה אחת: תמלוגים של 12 חודשים נכנסים — חצי סוגר את ההכנסה לקבל מהשנה הקודמת, וחצי הוא הכנסה של השנה החדשה.</>}
            />
          </>
        }
      />
    ),
  },
];

// Where each of the example's adjustments took an amount from: an account that had a balance and went down, to the other account of the entry.
const EXAMPLE_MOVES: Move[] = SHACHAR.adjustments.flatMap((x) =>
  x.lines.flatMap((l) => {
    const had = SHACHAR.preliminary[l.account];
    const reduces = had !== undefined && (had > 0 ? !!l.cr : !!l.dr);
    const other = x.lines.find((o) => o.account !== l.account);
    return reduces && other ? [{ from: l.account, to: other.account }] : [];
  }),
);

const example: Step[] = [
  {
    title: `הנתונים: ${SHACHAR.name} — מאזן בוחן ראשוני ליום ${SHACHAR.date}`,
    body: (
      <>
        <TBTable tb={trialBalance(SHACHAR.preliminary)} />
        <p className="text-[14.5px] text-muted">
          העודפים, <Money v={-SHACHAR.preliminary["עודפים"]} /> בזכות, הם היתרה של 1.1.{SHACHAR.year}: רווח השנה עוד לא נוסף אליהם. לכל סעיף שואלים: מה נרשם, ומה היה צריך להירשם?
        </p>
      </>
    ),
  },
  ...SHACHAR.items.map((it, i) => ({
    title: `${it.entry.id}. ${it.title}`,
    body: (
      <>
        <p>{it.story}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2 text-[14px]">
            <span className="mb-0.5 block text-[11px] font-bold text-danger">מה נרשם</span>
            <p>{it.recorded}</p>
            <p className="mt-1.5 border-t border-danger/20 pt-1.5 text-[13.5px] text-fg/90">
              <strong className="text-danger">למה זה לא נכון: </strong>
              {it.why}
            </p>
          </div>
          <p className="rounded-lg border border-accent/30 bg-accent-soft/60 px-3 py-2 text-[14px]">
            <span className="mb-0.5 block text-[11px] font-bold text-accent">מה צריך להיות</span>
            {it.should}
          </p>
        </div>
        <Posted entries={SHACHAR.adjustments} at={i} opening={SHACHAR.preliminary} openingLabel="יתרה" />
      </>
    ),
  })),
  {
    title: "התוצאה: מאזן בוחן לאחר פקודות התאמה וחתך",
    body: (
      <>
        <p className="text-[14.5px] text-fg">
          <strong>השורות המודגשות</strong> הן החשבונות שפקודות ההתאמה והחתך שינו: ליד חשבון שהשתנה — הסכום הקודם, מחוק, והסכום החדש; ליד חשבון שנפתח — ״חדש״. החצים
          מצביעים מחשבון שירד אל החשבון שאליו עבר הסכום.
        </p>
        <AdjustedTrialBalance before={SHACHAR.preliminary} after={EXAMPLE_FINAL} moves={EXAMPLE_MOVES} caption={`מאזן בוחן ליום ${SHACHAR.date} — לאחר פקודות התאמה וחתך`} />
        <StatementsView s={EXAMPLE_S} year={SHACHAR.year} />
        <Rule>
          רווח {SHACHAR.year}: <Money v={EXAMPLE_S.profit} />. העודפים: מ-<Money v={-SHACHAR.preliminary["עודפים"]} /> בפתיחה ל-
          <Money v={EXAMPLE_S.equity.find(([a]) => a === "עודפים")![1]} /> בסגירה.
        </Rule>
      </>
    ),
  },
];


/** A year-end entry of two lines. */
const odd = (text: string, dr: string, cr: string, amount: number): Entry => ({ id: "31.12", text, lines: [{ account: dr, dr: amount }, { account: cr, cr: amount }] });

/** One odd-month case: the story, the regular month and the odd one, and the adjustment. */
function OddCase({ n, title, story, steps, entry }: { n: number; title: string; story: React.ReactNode; steps: React.ReactNode[]; entry: Entry }) {
  return (
    <li className="grid gap-3 rounded-2xl border border-line bg-surface p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-[16px] font-bold text-fg">
          <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-accent-fg">{n}</span>
          {title}
        </p>
        <p className="text-[14.5px]">{story}</p>
        <ol className="space-y-1.5">
          {steps.map((x, i) => (
            <li key={i} className="rounded-lg bg-surface-2/70 px-3 py-1.5 text-[14.5px]">
              <span className="me-1.5 text-[11.5px] font-bold text-accent">{i === 0 ? "קודם" : "ואז"}</span>
              {x}
            </li>
          ))}
        </ol>
      </div>
      <JE entry={entry} note={null} />
    </li>
  );
}

export const ADJUST_SCREENS: Record<string, ScreenContent> = {
  accrual: {
    lead: "״הוצאות ביטוח מראש״, ״הוצאות שכר לשלם״ — נשמעים כמו הוצאות, אבל הם בכלל חשבונות מאזניים: נכס או התחייבות. איך זה ייתכן?",
    body: (
      <>
        <section className="space-y-2 rounded-2xl border border-line bg-surface-2/60 p-4">
          <h3 className="text-lg font-semibold text-fg">תקופה חשבונאית ועקרון ההקבלה</h3>
          <p>
            העסק לא עוצר ב-31.12 — אבל הדוחות כן. לכן מחלקים את חיי העסק ל<strong>תקופות דיווח</strong>: שנה, חצי שנה או רבעון. בכל תקופה רושמים רק את ההכנסות
            וההוצאות ששייכות לה.
          </p>
          <p>
            <strong>עקרון ההקבלה</strong> אומר: הוצאה נרשמת באותה תקופה כמו ההכנסה שהיא עזרה לייצר. רק כך רואים כמה כל שנה באמת הרוויחה. חסרה הוצאה של השנה?
            משלימים. נרשמה הוצאה של השנה הבאה? מוציאים. ארבעת חשבונות החתך הם הכלים שבהם עושים את זה.
          </p>
        </section>
        <h3 className="text-lg font-semibold text-fg">השם מטעה — אם קוראים רק את המילה הראשונה</h3>
        <p>
          המילה הראשונה אומרת <strong>מאיפה</strong> החשבון בא: מהוצאה או מהכנסה. המילה האחרונה — <strong>מראש</strong>, <strong>לשלם</strong>, <strong>לקבל</strong> — אומרת
          <strong> מה הוא עכשיו</strong>: משהו ששייך לשנה הבאה, או כסף שעוד חייבים לנו או שאנחנו חייבים. ולכן הוא במאזן:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NAMES.map(([from, word, kind]) => (
            <li key={word + from} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <span className="text-[15.5px]">
                <span className="text-subtle">{from} </span>
                <strong className="text-fg">{word}</strong>
              </span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold", kind === "נכס" ? "bg-debit/10 text-debit" : "bg-credit/10 text-credit")}>{kind} · מאזני</span>
            </li>
          ))}
        </ul>

        <h3 className="pt-1 text-lg font-semibold text-fg">למה צריך אותם: חותכים את השנה ב-31.12</h3>
        <p>
          הרווח של שנה צריך לספור רק את ההכנסות וההוצאות <strong>של אותה שנה</strong> — זה הבסיס המצטבר. אבל הכסף לא תמיד זז באותה שנה: לפעמים משלמים מראש על
          השנה הבאה, ולפעמים משלמים רק אחרי שהשנה נגמרה. לכן בסוף השנה עוצרים, ״חותכים״ ב-31.12, ומתקנים: מה ששייך לשנה הבאה מוציאים מהרווח של השנה, ומה שחסר —
          מוסיפים. ההפרש לא נעלם: הוא יושב בינתיים במאזן, בחשבון חתך, ועובר איתנו לשנה הבאה.
        </p>

        <div className="space-y-3 rounded-2xl border border-line bg-surface-2/60 p-4">
          <p className="font-semibold text-fg">
            דוגמה: ב-1.11 שילמתם <Money v={RENT.paid} /> שכירות על שנה שלמה, ורשמתם הכול כהוצאה.
          </p>
          <div className="flex overflow-hidden rounded-lg text-center text-[13px] font-semibold" aria-hidden>
            <span className="bg-accent py-2 text-accent-fg" style={{ flex: RENT.thisYear }}>
              {RENT.thisYear} חודשים השנה
            </span>
            <span className="bg-debit/15 py-2 text-debit" style={{ flex: 12 - RENT.thisYear }}>
              {12 - RENT.thisYear} חודשים בשנה הבאה
            </span>
          </div>
          <ul className="space-y-1.5 text-[15px]">
            <li>
              עד 31.12 עברו {RENT.thisYear} חודשים: <Money v={rentThisYear} /> הם <strong>הוצאה של השנה</strong> — בדוח רווח והפסד.
            </li>
            <li>
              <Money v={rentNextYear} /> עוד לא נוצלו: הם שייכים לשנה הבאה. בינתיים זה <strong>נכס</strong> — חודשי שימוש שכבר שילמנו עליהם — ונרשם במאזן כ
              <strong>״הוצאות שכירות מראש״</strong>.
            </li>
          </ul>
          <p className="text-[14.5px] text-muted">אותו היגיון עובד בכל הכיוונים: הוצאה או הכנסה, כסף שזז מראש או כסף שעוד לא זז — ויוצאים בדיוק ארבעת חשבונות החתך שלמעלה. במסכים הבאים, כל אחד בנפרד.</p>
        </div>
      </>
    ),
  },

  prepaid: {
    lead: "הוצאות מראש: הכסף יצא לפני שנהנינו. החלק שעוד לא נוצל שייך לשנה הבאה — ובינתיים הוא נכס.",
    body: (
      <>
        {cutoff[0].body}
        <MiniQuiz
          prefix="basics"
          chapter="prepaid"
          items={[
              { q: "ב-1.10 שולמו 6,000 ₪ על ביטוח לשנה ונרשמו כמראש. כמה עובר להוצאה ב-31.12?", options: ["1,500", "4,500", "6,000", "500"], answer: 0, why: "עברו 3 חודשים: 6,000 × 3/12 = 1,500. השאר — 4,500 — נשאר נכס לשנה הבאה." },
            ]}
        />
      </>
    ),
  },

  accrued: {
    lead: "הוצאות לשלם: כבר נהנינו, והכסף עוד לא יצא. מה שאנחנו חייבים על השנה הזו — הוצאה של השנה, ובינתיים התחייבות.",
    body: (
      <>
        {cutoff[1].body}
        <MiniQuiz
          prefix="basics"
          chapter="accrued"
          items={[
              { q: "שירותי אבטחה לדצמבר, 3,200 ₪, ישולמו בינואר. מה הפקודה ב-31.12?", options: ["ח׳ הוצאות אבטחה / ז׳ הוצאות אבטחה לשלם", "ח׳ הוצאות אבטחה מראש / ז׳ מזומן", "אין פקודה — עוד לא שילמנו", "ח׳ הוצאות אבטחה לשלם / ז׳ הוצאות אבטחה"], answer: 0, why: "השירות ניתן בדצמבר — הוצאה של השנה. הכסף עוד לא יצא — התחייבות: הוצאות לשלם." },
            ]}
        />
      </>
    ),
  },

  unearned: {
    lead: "הכנסות מראש: הכסף נכנס לפני שסיפקנו. החלק שעוד לא הורווח שייך לשנה הבאה — ובינתיים הוא התחייבות.",
    body: (
      <>
        {cutoff[2].body}
        <MiniQuiz
          prefix="basics"
          chapter="unearned"
          items={[
              { q: "״הכנסות מראש״ — איזה סוג חשבון?", options: ["התחייבות", "הכנסה", "נכס", "הוצאה"], answer: 0, why: "קיבלנו כסף על משהו שעוד לא סיפקנו — אנחנו חייבים אותו. התחייבות, במאזן." },
            ]}
        />
      </>
    ),
  },

  receivable: {
    lead: "הכנסות לקבל: כבר הרווחנו, והכסף עוד לא נכנס. מה שמגיע לנו על השנה הזו — הכנסה של השנה, ובינתיים נכס.",
    body: (
      <>
        {cutoff[3].body}
        <MiniQuiz
          prefix="basics"
          chapter="receivable"
          items={[
              { q: "שכרנו את המחסן שלנו לשכן מ-1.11 ב-2,000 ₪ לחודש, והוא ישלם על נובמבר–דצמבר ב-5.1. מה ההתאמה ב-31.12?", options: ["ח׳ הכנסות שכירות לקבל / ז׳ הכנסות שכירות 4,000", "ח׳ מזומן / ז׳ הכנסות שכירות 4,000", "אין התאמה — הכסף יגיע בינואר", "ח׳ הכנסות שכירות / ז׳ הכנסות שכירות מראש 4,000"], answer: 0, why: "השכן השתמש במחסן חודשיים השנה — ההכנסה הורווחה. הכסף עוד לא הגיע — הכנסות לקבל, נכס." },
            ]}
        />
      </>
    ),
  },

  "adj-example": {
    body: (
      <>
        {/* What the example starts from, and why it needs fixing — before the walkthrough. Spans both columns on a wide screen. */}
        <div className="space-y-2 rounded-2xl border-2 border-amber-500/50 bg-amber-500/[0.08] px-4 py-3.5 [column-span:all]">
          <p className="flex items-center gap-2 text-[16px] font-bold text-fg">
            <ClipboardList className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden /> מה נתון, ומה עושים
          </p>
          <p className="text-[15px] leading-relaxed text-fg">
            <strong>נתון: מאזן בוחן ליום 31.12, לפני פקודות התאמה וחתך.</strong> במהלך השנה הנהלת החשבונות רשמה פקודות יומן שלא לפי הכללים של חשבונות החתך —
            כאילו כל תשלום וכל תקבול שייכים כולם לשנה הנוכחית, אף שחלקם משמשים גם שנים אחרות.
          </p>
          <p className="text-[15px] leading-relaxed text-fg">
            <strong>מה עושים:</strong> בדוגמה שלפניכם נתקן את החשבונות הרשומים — לכל סעיף נבצע פקודת התאמה וחתך, כך שכל שנה תישא רק את מה ששייך לה. ובסוף —
            נרשום את מלאי הסגירה שנספר במחסן.
          </p>
        </div>
        <Stepper label={`${SHACHAR.name} · ${SHACHAR.date}`} steps={example} />
      </>
    ),
  },

  inventory: {
    lead: "מה שלא נמכר עד סוף השנה אינו הוצאה של השנה: סופרים אותו, מוציאים אותו מהעלות, ורושמים אותו כנכס.",
    body: (
      <>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border-2 border-accent/40 bg-surface p-4" role="math" aria-label="עלות המכר שווה מלאי פתיחה ועוד קניות פחות מלאי סגירה">
            <p className="text-[18px] font-extrabold text-fg">עלות המכר =</p>
            <ul className="mt-2 space-y-1.5 text-[15.5px]">
              {(
                [
                  ["", "יתרת פתיחה מלאי", COGS_CASE.opening],
                  ["+", "קניות השנה", COGS_CASE.purchases],
                  ["−", "מלאי סגירה", COGS_CASE.closing],
                ] as [string, string, number][]
              ).map(([op, t, v]) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-5 text-center text-lg font-bold text-accent">{op}</span>
                  <span className="flex-1 font-medium text-fg">{t}</span>
                  <Money v={v} plain className="text-muted" />
                </li>
              ))}
            </ul>
            <p className="mt-2 flex items-center gap-2 border-t-2 border-fg/70 pt-2 font-bold">
              <span className="w-5" />
              <span className="flex-1">עלות המכר ב{COGS_CASE.name}, {COGS_CASE.year}</span>
              <Money v={costOfSales(COGS_CASE)} plain />
            </p>
          </div>
          <div className="space-y-2">
            <KeyCard>מלאי הסגירה נמדד לפי הנמוך מבין העלות לבין שווי המימוש נטו.</KeyCard>
            <p className="text-[14.5px]">
              שווי מימוש נטו = מה שנקבל במכירה, פחות מה שיעלה למכור. ב{COGS_CASE.name} עלות מלאי הסגירה <Money v={COGS_CASE.closing} />:
            </p>
            <ul className="space-y-1 text-[14px]">
              <li className="rounded-lg bg-surface-2/70 px-3 py-1.5">
                שווי מימוש <Money v={COGS_NRV_HIGH} /> ← רושמים <strong><Money v={Math.min(COGS_CASE.closing, COGS_NRV_HIGH)} /></strong> (העלות)
              </li>
              <li className="rounded-lg bg-surface-2/70 px-3 py-1.5">
                אילו היה <Money v={COGS_NRV_LOW} /> ← היינו רושמים <strong><Money v={Math.min(COGS_CASE.closing, COGS_NRV_LOW)} /></strong>, ועלות המכר הייתה עולה ב-
                <Money v={COGS_CASE.closing - COGS_NRV_LOW} />
              </li>
            </ul>
          </div>
        </div>
        <Posted entries={[COGS_ENTRY]} at={0} note="שני חשבונות באותו סכום: הנכס שבמחסן, והקטנת העלות ברווח והפסד. בשנה הבאה זה מלאי הפתיחה." />
        <MiniQuiz
          prefix="basics"
          chapter="inventory"
          items={[
            { q: "מלאי פתיחה 30,000, קניות 120,000, מלאי סגירה 25,000. מהי עלות המכר?", options: ["125,000", "150,000", "95,000", "175,000"], answer: 0, why: "30,000 + 120,000 − 25,000 = 125,000." },
            { q: "עלות מלאי הסגירה 40,000, ושווי המימוש נטו שלו 36,000. באיזה סכום נרשם?", options: ["36,000", "40,000", "76,000", "4,000"], answer: 0, why: "הנמוך מבין העלות לשווי המימוש נטו: 36,000." },
          ]}
        />
      </>
    ),
  },
  "odd-month": {
    lead: "״ההוצאה מתפלגת באופן שווה — למעט…״. כשהחודש האחרון שונה מהשאר, מוצאים קודם חודש רגיל ממה שכבר נרשם, ורק אז מתקנים את החודש החריג.",
    body: (
      <>
        <KeyCard>חודש רגיל = מה שנרשם ÷ מספר החודשים שנרשמו. לא ÷ 12.</KeyCard>
        <ol className="space-y-3 [column-span:all]">
          <OddCase
            n={1}
            title={`העלאת שכר של ${pct(ODD.raise.rate)} מדצמבר`}
            story={<>שכר ינואר עד נובמבר, <Money v={ODD.raise.recorded} />, נרשם. בדצמבר קיבלו העובדים העלאה של {pct(ODD.raise.rate)}, והשכר ישולם ב-9.1.</>}
            steps={[
              <>חודש רגיל: <Money v={ODD.raise.recorded} /> ÷ {ODD.raise.months} = <Money v={ODD_RESULTS.raise.month} /></>,
              <>דצמבר: <Money v={ODD_RESULTS.raise.month} /> × {1 + ODD.raise.rate} = <strong><Money v={ODD_RESULTS.raise.missing} /></strong></>,
            ]}
            entry={odd("שכר דצמבר, אחרי ההעלאה", "הוצאות שכר", "הוצאות שכר לשלם", ODD_RESULTS.raise.missing)}
          />
          <OddCase
            n={2}
            title={`ארנונה שעולה ב-${pct(ODD.tax.decRate)} בדצמבר`}
            story={<>ארנונה ינואר עד אוקטובר, <Money v={ODD.tax.recorded} />, נרשמה. החשבון של נובמבר ודצמבר יגיע בינואר, ובדצמבר התעריף עלה ב-{pct(ODD.tax.decRate)}.</>}
            steps={[
              <>חודש רגיל: <Money v={ODD.tax.recorded} /> ÷ {ODD.tax.months} = <Money v={ODD_RESULTS.tax.month} /></>,
              <>נובמבר <Money v={ODD_RESULTS.tax.month} /> + דצמבר <Money v={round2(ODD_RESULTS.tax.month * (1 + ODD.tax.decRate))} /> = <strong><Money v={ODD_RESULTS.tax.missing} /></strong></>,
            ]}
            entry={odd("ארנונה נובמבר–דצמבר", "הוצאות ארנונה", "הוצאות ארנונה לשלם", ODD_RESULTS.tax.missing)}
          />
          <OddCase
            n={3}
            title="חשבון שמגיע אחת לחודשיים"
            story={<>חשבון הטלפון מגיע אחת לחודשיים ומשולם ב-10 לחודש שאחריו. נרשמו ינואר עד אוקטובר: <Money v={ODD.phone.recorded} />. החשבון של נובמבר–דצמבר ישולם ב-10.1.</>}
            steps={[
              <>חודש רגיל: <Money v={ODD.phone.recorded} /> ÷ {ODD.phone.months} = <Money v={ODD_RESULTS.phone.month} /></>,
              <>חסרים {ODD.phone.missing} חודשים: <strong><Money v={ODD_RESULTS.phone.missing} /></strong></>,
            ]}
            entry={odd("טלפון נובמבר–דצמבר", "הוצאות טלפון", "הוצאות טלפון לשלם", ODD_RESULTS.phone.missing)}
          />
        </ol>
        <MiniQuiz
          prefix="basics"
          chapter="odd-month"
          items={[
            {
              q: "נרשמו 99,000 ₪ שכר על ינואר עד נובמבר. בדצמבר אין שינוי. כמה חסר?",
              options: ["9,000", "8,250", "99,000", "0"],
              answer: 0,
              why: "99,000 ÷ 11 = 9,000 לחודש. מי שמחלק ב-12 מקבל 8,250 — וטועה, כי נרשמו 11 חודשים בלבד.",
            },
            {
              q: "חשמל: נרשמו ינואר עד אוקטובר, 30,000 ₪. מה חסר לסוף השנה, אם דצמבר יקר ב-20% מחודש רגיל?",
              options: ["6,600", "6,000", "7,200", "3,600"],
              answer: 0,
              why: "חודש רגיל 3,000. נובמבר 3,000 + דצמבר 3,600 = 6,600.",
            },
          ]}
        />
      </>
    ),
  },

  "interest-period": {
    lead: "לפני שמכפילים, קוראים: הריבית לשנה — או לחצי שנה? אותו מספר באחוזים יכול להיות פי שניים כסף.",
    body: (
      <>
        <KeyCard>ריבית = קרן × שיעור × (החודשים שעברו ÷ החודשים בתקופה של השיעור).</KeyCard>
        <div className="grid gap-3 md:grid-cols-2 [column-span:all]">
          <section className="space-y-2 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[15px] font-bold text-fg">ריבית חצי שנתית של {pct(PERIOD.halfYear.rate)}</p>
            <p className="text-[14.5px]">
              הלוואה של <Money v={PERIOD.halfYear.amount} /> מ-1.7. הריבית תשולם עם הקרן. עד 31.12 עברו 6 חודשים — תקופה אחת של השיעור.
            </p>
            <Calc result={<Money v={interestFor(PERIOD.halfYear)} />}>
              <Money v={PERIOD.halfYear.amount} /> × {pct(PERIOD.halfYear.rate)} × 6/6
            </Calc>
          </section>
          <section className="space-y-2 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[15px] font-bold text-fg">ריבית שנתית של {pct(PERIOD.annual.rate)}</p>
            <p className="text-[14.5px]">אותה הלוואה, אותו מספר באחוזים — אבל לשנה. ב-6 חודשים עברה רק חצי מהתקופה.</p>
            <Calc result={<Money v={interestFor(PERIOD.annual)} />}>
              <Money v={PERIOD.annual.amount} /> × {pct(PERIOD.annual.rate)} × 6/12
            </Calc>
          </section>
        </div>
        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-fg">ובצד ההכנסות: הלוואה שנתנו</h3>
          <p>
            ב-1.1 החברה הלוותה לספק <Money v={PERIOD.lent.amount} />. הריבית — <Money v={PERIOD.lent.perHalf} /> לכל חצי שנה — מתקבלת פעמיים: ב-30.6 על ינואר–יוני, וב-1.1
            בשנה הבאה על יולי–דצמבר. רק התקבול של 30.6 נרשם.
          </p>
          <JE
            entry={odd("31.12 · ריבית יולי–דצמבר, שתתקבל ב-1.1", "הכנסות ריבית לקבל", "הכנסות ריבית", PERIOD.lent.perHalf)}
            note="הכסף מגיע ב-1.1, אבל הוא על חודשים של השנה הזו — הכנסה של השנה, ובינתיים נכס. סך הכנסות הריבית של השנה: פעמיים 900."
          />
        </section>
        <MiniQuiz
          prefix="basics"
          chapter="interest-period"
          items={[
            {
              q: "הלוואה של 100,000 ₪ מ-1.1, בריבית חצי שנתית של 2%. מה הוצאות הריבית של השנה?",
              options: ["4,000", "2,000", "1,000", "8,000"],
              answer: 0,
              why: "שנה שלמה = שתי תקופות של חצי שנה: 100,000 × 2% × 12/6 = 4,000.",
            },
            {
              q: "הלוואה של 120,000 ₪ מ-1.10, בריבית שנתית של 5%. מה הוצאות הריבית עד 31.12?",
              options: ["1,500", "6,000", "3,000", "500"],
              answer: 0,
              why: "3 חודשים מתוך תקופה של 12: 120,000 × 5% × 3/12 = 1,500.",
            },
          ]}
        />
      </>
    ),
  },
};
