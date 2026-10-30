import { Banknote } from "lucide-react";
import { ACCRUAL, balancesOf, costOfSales, creditLoss, creditLossEntries, type Entry, ledger, MIA, RONEN, round2, statements, trialBalance, TZAAD } from "@/lib/learn/basics";
import type { ScreenContent } from "@/components/study-mode/shell";
import { cn } from "@/lib/utils";
import { EntryViews } from "./entry-views";
import { TCardsDialog } from "./t-dialog";
import { Posted, TBox, THead } from "./t-accounts";
import { Calc, JE, KeyCard, Money, Rule, StatementsView, type Step, Stepper, TBTable } from "./ui";

const RONEN_FINAL = balancesOf(ledger(RONEN.adjustments, RONEN.preliminary));
const RONEN_S = statements(RONEN_FINAL);
const TZAAD_C = creditLoss(TZAAD);
const TZAAD_ENTRIES = creditLossEntries(TZAAD);
const TZAAD_OPEN = { לקוחות: TZAAD.openingCustomers, "הפרשה להפסדי אשראי חזויים": -TZAAD.openingAllowance };
const tzaadCard = (account: string, upto: number) => ledger(TZAAD_ENTRIES.slice(0, upto), TZAAD_OPEN).find((t) => t.account === account)!;
const f = (v: number) => v.toLocaleString("he-IL");
const pct = (r: number) => `${round2(r * 100)}%`;
// Two illustrative net realisable values for Mia's closing stock: one above its cost, one below.
const MIA_NRV_HIGH = 330_000;
const MIA_NRV_LOW = 300_000;
const MIA_ENTRY: Entry = {
  id: "מלאי",
  date: "31.12.2020",
  text: "רישום מלאי הסגירה",
  lines: [
    { account: "מלאי סגירה מאזני", dr: Math.min(MIA.closing, MIA_NRV_HIGH) },
    { account: "מלאי סגירה רווח או הפסד", cr: Math.min(MIA.closing, MIA_NRV_HIGH) },
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
// The opening example: a year's rent paid on 1.10.
const RENT = { paid: 12_000, thisYear: 3 };
const rentThisYear = (RENT.paid * RENT.thisYear) / 12;
const rentNextYear = RENT.paid - rentThisYear;

// The four cut-off accounts (a screen each), Ronen at year end, and Tzaad's credit losses.
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
      line("1", "קנינו גיפט קארד ב-1,000 ₪ במזומן", "הוצאות מראש", "מזומן", 1_000),
      line("2", "שילמנו בגיפט קארד על כיבוד: 400 ₪", "הוצאות כיבוד", "הוצאות מראש", 400),
      line("3", "שילמנו בו את השאר על כיבוד: 600 ₪", "הוצאות כיבוד", "הוצאות מראש", 600),
    ],
    rule: "היתרה מתחילה בחובה, ותמיד נשארת בחובה. היא קטנה בזכות — מול הוצאה רגילה — עד שמגיעה ל-0.",
  },
  accrued: {
    title: "חוב במכולת",
    story: "אנחנו לוקחים מצרכים מהמכולת ״על החשבון״: ביום הראשון לא עובר כסף, ורק כשהחוזה נגמר משלמים הכול במכה. בינתיים אנחנו חייבים למכולת — זו התחייבות.",
    account: "הוצאות לשלם",
    entries: [
      line("1", "לקחנו מצרכים מהמכולת ב-500 ₪ — על החשבון", "הוצאות כיבוד", "הוצאות לשלם", 500),
      line("2", "לקחנו עוד ב-300 ₪ — על החשבון", "הוצאות כיבוד", "הוצאות לשלם", 300),
      line("3", "החוזה נגמר: שילמנו למכולת את כל ה-800 ₪", "הוצאות לשלם", "מזומן", 800),
    ],
    rule: "החשבון מתחיל ב-0 וגדל בזכות — מול הוצאה רגילה — עד שמשלמים אותו, ואז הוא חוזר ל-0.",
  },
  unearned: {
    title: "גיפט קארד שהנפקנו ללקוח",
    story: "לקוח קנה מאיתנו גיפט קארד. בכל פעם שהוא ירצה לקנות — במקום לשלוף שוב כסף — נוריד לו מהכרטיס. עד אז אנחנו חייבים לו סחורה — זו התחייבות.",
    account: "הכנסות מראש",
    entries: [
      line("1", "לקוח קנה מאיתנו גיפט קארד ב-1,000 ₪ במזומן", "מזומן", "הכנסות מראש", 1_000),
      line("2", "הלקוח קנה בכרטיס עוגות ב-300 ₪", "הכנסות מראש", "מכירות", 300),
      line("3", "הלקוח מימש את השאר: 700 ₪", "הכנסות מראש", "מכירות", 700),
    ],
    rule: "היתרה מתחילה בזכות, ותמיד נשארת בזכות. היא קטנה בחובה — מול הכנסה רגילה — עד שמגיעה ל-0.",
  },
  receivable: {
    title: "הפעם — אנחנו המכולת",
    story: "לקוח לוקח מאיתנו ״על החשבון״: ביום הראשון לא עובר כסף, ורק כשהחוזה נגמר הוא משלם הכול במכה. בינתיים הוא חייב לנו — זה נכס.",
    account: "הכנסות לקבל",
    entries: [
      line("1", "הלקוח לקח מאיתנו ב-600 ₪ — על החשבון", "הכנסות לקבל", "מכירות", 600),
      line("2", "הוא לקח עוד ב-400 ₪ — על החשבון", "הכנסות לקבל", "מכירות", 400),
      line("3", "החוזה נגמר: הלקוח שילם לנו את כל ה-1,000 ₪", "מזומן", "הכנסות לקבל", 1_000),
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
  line("1", "1.10: שולם ביטוח לשנה, ונרשם כהוצאה מראש", "הוצאות ביטוח מראש", "מזומן", A.prepaid.paid),
  line("2", "31.12: מה שנוצל השנה עובר להוצאה", "הוצאות ביטוח", "הוצאות ביטוח מראש", A.prepaid.paid - R.prepaid),
];
const UNEARNED_ENTRIES: Entry[] = [
  line("1", "1.11: התקבלה שכירות מחסן לחצי שנה, ונרשמה כהכנסה מראש", "מזומן", "הכנסות שכירות מראש", A.unearned.received),
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
  text: "שכר השנה: ינואר עד נובמבר שולם, ודצמבר — עוד לא",
  lines: [
    { account: "הוצאות שכר", dr: A.accrued.recorded + R.accrued },
    { account: "מזומן", cr: A.accrued.recorded },
    { account: "הוצאות שכר לשלם", cr: R.accrued },
  ],
};
const UNEARNED_ONE: Entry = {
  id: "1",
  text: "התקבלה שכירות מחסן לחצי שנה: מה שהורווח השנה — הכנסה, והשאר — הכנסה מראש",
  lines: [
    { account: "מזומן", dr: A.unearned.received },
    { account: "הכנסות שכירות", cr: A.unearned.received - R.unearned },
    { account: "הכנסות שכירות מראש", cr: R.unearned },
  ],
};
const RECEIVABLE_ONE: Entry = {
  id: "1",
  text: "30.6: התקבלה ריבית של שנה שלמה",
  lines: [
    { account: "מזומן", dr: R.receivable * 2 },
    { account: "הכנסות ריבית לקבל", cr: R.receivable },
    { account: "הכנסות ריבית", cr: R.receivable },
  ],
};
const RECEIVABLE_SPLIT: Entry[] = [
  line("1", "30.6: החצי של השנה הקודמת סוגר את ההכנסה לקבל", "מזומן", "הכנסות ריבית לקבל", R.receivable),
  line("2", "30.6: החצי של השנה הזו — הכנסה שלה", "מזומן", "הכנסות ריבית", R.receivable),
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
            ב-1.10 שילמנו <Money v={A.prepaid.paid} /> על ביטוח לשנה, ורשמנו את התשלום כהוצאה מראש — נכס. עד 31.12 נוצל רק חלק ממנו.
          </>
        }
        timeline={<Timeline cash="תשלום ב-1.10" cashAt="start" segments={[{ months: 3, label: "השנה", year: "this" }, { months: 9, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <>
            <Calc>
              השנה עברו 3 חודשים: 3/12 × <Money v={A.prepaid.paid} /> = <strong><Money v={A.prepaid.paid - R.prepaid} /></strong> הוצאה השנה. 9/12 × <Money v={A.prepaid.paid} /> ={" "}
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
            העובדים עבדו כל השנה. שכר ינואר עד נובמבר, <Money v={A.accrued.recorded} />, שולם ונרשם. שכר דצמבר ישולם רק ב-5 בינואר — ולא נרשם.
          </>
        }
        timeline={<Timeline cash="תשלום דצמבר ב-5.1" cashAt="end" segments={[{ months: 11, label: "ינואר–נובמבר · נרשם", year: "this" }, { months: 1, label: "דצמבר · חסר", year: "next" }]} />}
        calc={
          <Calc result={<Money v={R.accrued} />}>
            שכר לחודש: <Money v={A.accrued.recorded} /> ÷ 11 = <Money v={A.accrued.recorded / 11} />. חסר חודש אחד (דצמבר): <Money v={A.accrued.recorded / 11} /> × 1
          </Calc>
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
            ב-1.11 קיבלנו <Money v={A.unearned.received} /> שכירות מחסן לחצי שנה, ורשמנו את התקבול כהכנסה מראש — התחייבות: עד שנספק את החודשים, אנחנו חייבים אותם לשוכר.
          </>
        }
        timeline={<Timeline cash="תקבול ב-1.11" cashAt="start" segments={[{ months: 2, label: "השנה", year: "this" }, { months: 4, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <Calc>
            השנה עברו 2 חודשים: 2/6 × <Money v={A.unearned.received} /> = <strong><Money v={A.unearned.received - R.unearned} /></strong> הכנסה השנה. 4/6 ×{" "}
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
            ב-1.7 הלווינו לעובד <Money v={A.receivable.loan} /> בריבית שנתית של {pct(A.receivable.rate)}. הריבית תשולם רק ב-30.6 בשנה הבאה, ולא נרשם דבר.
          </>
        }
        timeline={<Timeline cash="ריבית תתקבל ב-30.6" cashAt="end" segments={[{ months: 6, label: "השנה · הורווחה", year: "this" }, { months: 6, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <Calc result={<Money v={R.receivable} />}>
            <Money v={A.receivable.loan} /> × {pct(A.receivable.rate)} × 6/12
          </Calc>
        }
        views={
          <>
            <JE entry={A.entries.receivable[1]} title="פקודת ההתאמה · 31.12" note={null} />
            <EntryViews
              title="ב-30.6, כשהריבית מתקבלת: מזומן, הכנסה לקבל, והכנסה"
              compound={RECEIVABLE_ONE}
              split={RECEIVABLE_SPLIT}
              note={<>בפקודה אחת: ריבית של שנה שלמה נכנסת — חצי סוגר את ההכנסה לקבל מהשנה הקודמת, וחצי הוא הכנסה של השנה החדשה.</>}
            />
          </>
        }
      />
    ),
  },
];

// Why what was recorded at Ronen is wrong: an expense or an income belongs to the year it was used or earned in — only that part.
const RONEN_WRONG: Record<string, string> = {
  פרסום: "אי אפשר להכיר בכל ההוצאה ב-2017: הפרסום לא שימש את כל השנה הנוכחית. מכירים בהוצאה רק על החלק ששומש השנה — 9 חודשים. 3 החודשים של 2018 עדיין נכס.",
  ביטוח: "הביטוח שימש את כל 2017, אבל שום חלק ממנו לא עבר להוצאה השנה. מכירים בהוצאה על החלק ששומש ב-2017 — 12 חודשים — ומה ששייך ל-2018 נשאר נכס.",
  ריבית: "השתמשנו בכסף של הבנק חצי שנה ב-2017, ולכן הריבית על התקופה הזו היא הוצאה של 2017 — גם אם עוד לא שילמנו אותה.",
  ייעוץ: "אי אפשר להכיר בכל ההכנסה ב-2017: השירות לא ניתן לאורך כל התקופה השנה. מכירים בהכנסה רק על החלק שסופק השנה — 9 חודשים. את השאר עוד חייבים ללקוח.",
  שכירות: "השוכר השתמש במחסן חודשיים ב-2017 — ההכנסה הורווחה השנה, גם אם הכסף עוד לא הגיע. לכן היא שייכת ל-2017.",
};

const ronen: Step[] = [
  {
    title: "הנתונים: מאזן בוחן ראשוני ליום 31.12.2017",
    body: (
      <>
        <TBTable tb={trialBalance(RONEN.preliminary)} />
        <p className="text-[14.5px] text-muted">
          העודפים בחובה: הפסדים צבורים של <Money v={RONEN.preliminary["עודפים"]} /> — היתרה של 1.1.2017. לכל סעיף שואלים: מה נרשם, ומה היה צריך להירשם?
        </p>
      </>
    ),
  },
  ...RONEN.items.map((it, i) => ({
    title: `${it.entry.id}. ${it.title}`,
    body: (
      <>
        <p>{it.story}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2 text-[14px]">
            <span className="mb-0.5 block text-[11px] font-bold text-danger">מה נרשם</span>
            <p>{it.recorded}</p>
            {RONEN_WRONG[it.title] && (
              <p className="mt-1.5 border-t border-danger/20 pt-1.5 text-[13.5px] text-fg/90">
                <strong className="text-danger">למה זה לא נכון: </strong>
                {RONEN_WRONG[it.title]}
              </p>
            )}
          </div>
          <p className="rounded-lg border border-accent/30 bg-accent-soft/60 px-3 py-2 text-[14px]">
            <span className="mb-0.5 block text-[11px] font-bold text-accent">מה צריך להיות</span>
            {it.should}
          </p>
        </div>
        <Posted entries={RONEN.adjustments} at={i} opening={RONEN.preliminary} openingLabel="יתרה" />
      </>
    ),
  })),
  {
    title: "התוצאה: מאזן בוחן מתוקן ודוחות",
    body: (
      <>
        <TBTable tb={trialBalance(RONEN_FINAL)} caption="מאזן בוחן מתוקן ליום 31.12.2017" kind />
        <StatementsView s={RONEN_S} year="2017" />
        <Rule>
          רווח 2017: <Money v={RONEN_S.profit} />. העודפים: מהפסדים צבורים של <Money v={RONEN.preliminary["עודפים"]} /> ל-
          <Money v={-RONEN_S.equity.find(([a]) => a === "עודפים")![1]} /> (חובה).
        </Rule>
      </>
    ),
  },
];

const tzaad: Step[] = [
  {
    title: "הנתונים — ומה מחפשים",
    body: (
      <>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {(
            [
              ["לקוחות ב-1.1.2025", TZAAD.openingCustomers],
              ["הפרשה ב-1.1.2025", TZAAD.openingAllowance],
              ["מכירות באשראי בשנה", TZAAD.creditSales],
              ["גבייה מלקוחות", TZAAD.collections],
              ["חוב אבוד (לקוח שנעלם)", TZAAD.badDebt],
            ] as [string, number][]
          ).map(([t, v]) => (
            <li key={t} className="flex justify-between gap-2 rounded-lg bg-surface-2/70 px-3 py-1.5 text-[14.5px]">
              <span>{t}</span>
              <Money v={v} className="font-semibold" />
            </li>
          ))}
          <li className="flex justify-between gap-2 rounded-lg bg-surface-2/70 px-3 py-1.5 text-[14.5px]">
            <span>שיעור הלקוחות שלא ישלמו</span>
            <span className="font-semibold">{pct(TZAAD.rate)}</span>
          </li>
        </ul>
        <KeyCard>מחפשים: כמה הוצאות הפסדי אשראי תרשום החנות ב-2025?</KeyCard>
      </>
    ),
  },
  ...TZAAD_ENTRIES.slice(0, 3).map((x, i) => ({
    title: `${x.id}. ${x.text}${i === 2 ? " — בלי הוצאה" : ""}`,
    body: (
      <>
        <p className="text-[14px] text-muted">
          <strong className="text-fg">מאיפה: </strong>
          {["\"מכרה בהקפה\" — הלקוחות גדלים.", "\"גבתה מהלקוחות\" — הלקוחות קטנים, המזומן גדל.", "ההפסד כבר נחזה בהפרשה, ולכן מוחקים את החוב כנגדה — לא כנגד הוצאה."][i]}
        </p>
        <Posted entries={TZAAD_ENTRIES} at={i} opening={TZAAD_OPEN} title="פקודת היומן" note={null} />
      </>
    ),
  })),
  {
    title: "יתרת הלקוחות בסוף השנה — מתוך הכרטיס",
    body: (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-start">
        <div>
          <THead />
          <TBox t={tzaadCard("לקוחות", 3)} totals />
        </div>
        <div className="space-y-2">
          <Calc result={<Money v={TZAAD_C.customers} />}>
            {f(TZAAD.openingCustomers)} + {f(TZAAD.creditSales)} − {f(TZAAD.collections)} − {f(TZAAD.badDebt)}
          </Calc>
          <p className="text-[14.5px]">היתרה היא הנעלם שסוגר את הכרטיס: הפרש שני הצדדים.</p>
        </div>
      </div>
    ),
  },
  {
    title: "כמה הפרשה צריכה להיות ב-31.12?",
    body: (
      <>
        <Calc result={<Money v={TZAAD_C.required} />}>
          לקוחות <Money v={TZAAD_C.customers} /> (מהצעד הקודם) × {pct(TZAAD.rate)}
        </Calc>
        <p className="text-[14.5px]">זו יתרת הסגירה שחייבת להיות בכרטיס ההפרשה.</p>
      </>
    ),
  },
  {
    title: "מה כבר יש בהפרשה — ומה חסר?",
    body: (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-start">
        <div>
          <THead />
          <TBox t={tzaadCard("הפרשה להפסדי אשראי חזויים", 3)} totals />
        </div>
        <div className="space-y-2">
          <Calc result={<Money v={TZAAD_C.before} />}>
            יש: פתיחה {f(TZAAD.openingAllowance)} − חוב אבוד {f(TZAAD.badDebt)}
          </Calc>
          <Calc result={<Money v={TZAAD_C.expense} />}>
            חסר: נדרש {f(TZAAD_C.required)} − יש {f(TZAAD_C.before)}
          </Calc>
          <p className="text-[14.5px]">מה שחסר — זו ההוצאה של השנה.</p>
        </div>
      </div>
    ),
  },
  {
    title: `${TZAAD_ENTRIES[3].id}. ${TZAAD_ENTRIES[3].text}`,
    body: <Posted entries={TZAAD_ENTRIES} at={3} opening={TZAAD_OPEN} title="פקודת ההתאמה" note={`עכשיו בהפרשה ${f(TZAAD_C.required)} — בדיוק הנדרש.`} />,
  },
  {
    title: "במאזן: לקוחות נטו",
    body: (
      <>
        <Calc result={<Money v={TZAAD_C.net} />}>
          לקוחות <Money v={TZAAD_C.customers} /> − הפרשה <Money v={TZAAD_C.required} />
        </Calc>
        <Rule>
          הוצאה = ההפרשה הנדרשת − מה שכבר יש בה. כאן: {f(TZAAD_C.required)} − {f(TZAAD_C.before)} = {f(TZAAD_C.expense)}.
        </Rule>
      </>
    ),
  },
];

export const ADJUST_SCREENS: Record<string, ScreenContent> = {
  accrual: {
    lead: "״הוצאות ביטוח מראש״, ״הוצאות שכר לשלם״ — נשמעים כמו הוצאות, אבל הם בכלל חשבונות מאזניים: נכס או התחייבות. איך זה ייתכן?",
    body: (
      <>
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
            דוגמה: ב-1.10 שילמתם <Money v={RENT.paid} /> שכירות על שנה שלמה, ורשמתם הכול כהוצאה.
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
    body: cutoff[0].body,
  },

  accrued: {
    lead: "הוצאות לשלם: כבר נהנינו, והכסף עוד לא יצא. מה שאנחנו חייבים על השנה הזו — הוצאה של השנה, ובינתיים התחייבות.",
    body: cutoff[1].body,
  },

  unearned: {
    lead: "הכנסות מראש: הכסף נכנס לפני שסיפקנו. החלק שעוד לא הורווח שייך לשנה הבאה — ובינתיים הוא התחייבות.",
    body: cutoff[2].body,
  },

  receivable: {
    lead: "הכנסות לקבל: כבר הרווחנו, והכסף עוד לא נכנס. מה שמגיע לנו על השנה הזו — הכנסה של השנה, ובינתיים נכס.",
    body: cutoff[3].body,
  },

  ronen: {
    lead: "דוגמה מלאה: חברת רונן בע״מ, 31.12.2017. מקבלים מאזן בוחן ראשוני, ולכל סעיף שואלים: מה נרשם, ומה היה צריך להירשם? ההפרש — זו פקודת ההתאמה.",
    body: <Stepper label="רונן · 31.12.2017" steps={ronen} />,
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
                  ["", "יתרת פתיחה מלאי", MIA.opening],
                  ["+", "קניות השנה", MIA.purchases],
                  ["−", "מלאי סגירה", MIA.closing],
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
              <span className="flex-1">עלות המכר במיה, 2020</span>
              <Money v={costOfSales(MIA)} plain />
            </p>
          </div>
          <div className="space-y-2">
            <KeyCard>מלאי הסגירה נמדד לפי הנמוך מבין העלות לבין שווי המימוש נטו.</KeyCard>
            <p className="text-[14.5px]">
              שווי מימוש נטו = מה שנקבל במכירה, פחות מה שיעלה למכור. במיה העלות <Money v={MIA.closing} />:
            </p>
            <ul className="space-y-1 text-[14px]">
              <li className="rounded-lg bg-surface-2/70 px-3 py-1.5">
                שווי מימוש <Money v={MIA_NRV_HIGH} /> ← רושמים <strong><Money v={Math.min(MIA.closing, MIA_NRV_HIGH)} /></strong> (העלות)
              </li>
              <li className="rounded-lg bg-surface-2/70 px-3 py-1.5">
                אילו היה <Money v={MIA_NRV_LOW} /> ← היינו רושמים <strong><Money v={Math.min(MIA.closing, MIA_NRV_LOW)} /></strong>, ועלות המכר הייתה עולה ב-
                <Money v={MIA.closing - MIA_NRV_LOW} />
              </li>
            </ul>
          </div>
        </div>
        <Posted entries={[MIA_ENTRY]} at={0} note="שני חשבונות באותו סכום: הנכס שבמחסן, והקטנת העלות ברווח והפסד. בשנה הבאה זה מלאי הפתיחה." />
      </>
    ),
  },

  creditloss: {
    lead: "חלק מהלקוחות לא ישלמו. כדי שהמאזן לא יציג חוב שלא ייגבה, מפרישים מראש: הוצאה השנה, וחשבון הפרשה שמקטין את הלקוחות.",
    body: (
      <>
        <div className="grid gap-2 md:grid-cols-3">
          {(
            [
              ["ההפרשה הנדרשת", "שיעור × יתרת הלקוחות בסוף השנה"],
              ["ההוצאה", "ההפרשה הנדרשת − מה שכבר יש בה"],
              ["חוב אבוד", "נמחק כנגד ההפרשה (ח׳ הפרשה / ז׳ לקוחות) — בלי הוצאה"],
            ] as [string, string][]
          ).map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-surface p-3">
              <p className="text-sm font-bold text-accent">{t}</p>
              <p className="mt-0.5 text-[14.5px] text-fg">{d}</p>
            </div>
          ))}
        </div>
        <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-[15px]">
          <strong>איך זה מופיע בשאלה:</strong> נותנים יתרות פתיחה, מכירות באשראי, גבייה, חוב אבוד ושיעור. הנעלמים — יתרת הלקוחות בסוף השנה וההוצאה. מוצאים אותם מכרטיסי ה-T: הנעלם
          הוא המספר שסוגר את הכרטיס.
        </p>
        <Stepper label='חנות הנעליים "צעד" · 2025' steps={tzaad} />
      </>
    ),
  },
};
