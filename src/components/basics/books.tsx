import { ArrowLeft, CalendarClock, Check, RotateCcw } from "lucide-react";
import { balancesOf, carryForward, CREDIT, type Entry, isBalanceSheet, KITS, ledger, statements, trialBalance, YUVAL } from "@/lib/learn/basics";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { cn } from "@/lib/utils";
import { ClassifyExercise } from "./classify";
import { RetainedSolver } from "./retained";
import { Posted, TBox, THead } from "./t-accounts";
import { Calc, JE, KeyCard, Money, SideChip, StatementsView, type Step, Stepper, TBTable, Term } from "./ui";

const Y20 = statements(YUVAL.tb2020);
const OPENING_21 = carryForward(YUVAL.tb2020);
const B21 = balancesOf(ledger(YUVAL.entries2021, OPENING_21));
const Y21 = statements(B21);

// Why each of Yuval's balances sits where it does, for the trial-balance exercise.
const EXPLAIN: Record<string, string> = {
  לקוחות: "לקוח שחייב לך כסף הוא נכס שלך, ולכן הוא בצד החובה.",
  קניות: "קניית סחורה היא הוצאה, והוצאות יושבות בצד החובה.",
  "הוצאות שכר": "שכר הוא הוצאה — היתרה שלה בצד החובה.",
  מכירות: "מכירות הן הכנסה, והכנסות יושבות בצד הזכות.",
  ספקים: "לספק העסק חייב כסף — זו התחייבות, ולכן היא בצד הזכות.",
  "הון בעלים": "ההשקעה של הבעלים היא הון: העסק \"חייב\" אותה להם, ולכן היא בצד הזכות.",
  "ריהוט משרדי": "ריהוט ישמש את העסק שנים — נכס, ולכן בצד החובה.",
  "הוצאות פרסום": "פרסום הוא הוצאה — בצד החובה.",
  "הלוואות שהתקבלו": "הלוואה שהעסק קיבל צריך להחזיר — התחייבות, ולכן בצד הזכות.",
  מזומן: "מזומן הוא נכס — בצד החובה.",
  "הכנסות משכר דירה": "שכר דירה שהעסק מקבל הוא הכנסה — בצד הזכות.",
  "הוצאות ארנונה": "ארנונה היא הוצאה — בצד החובה.",
};

const TB_STAGES: [string, string][] = [
  ["מאזן בוחן ראשוני", "מה שנרשם במהלך השנה"],
  ["פקודות התאמה", "מה שחסר בסוף השנה: פחת, חתך, מלאי"],
  ["מאזן בוחן סופי", "היתרות הנכונות ל-31.12"],
  ["דוחות", "רווח והפסד, ואז המאזן עם העודפים"],
];

const run = (entries: Entry[], opts?: { opening?: Record<string, number> }): Step[] =>
  entries.map((x, i) => ({ title: x.text, body: <Posted entries={entries} at={i} opening={opts?.opening} title="פקודת היומן" /> }));

// Credit, with a compound entry after each pair: a sale, its collection, a sale part in cash; a purchase, its payment, a purchase part in cash.
const [creditSale, collect, creditBuy, paySupplier] = CREDIT.credit;
const CREDIT_RUN: Entry[] = [
  creditSale,
  collect,
  {
    id: "3",
    date: "",
    text: "פקודה מורכבת: מכרת סחורה ב-2,500 ₪ — 1,000 התקבלו במזומן, ואת השאר הלקוח ישלם בחודש הבא",
    lines: [
      { account: "מזומן", dr: 1_000 },
      { account: "לקוחות", dr: 1_500 },
      { account: "מכירות", cr: 2_500 },
    ],
    why: "קיבלנו שני דברים — מזומן, וזכות לגבות את השאר — ולכן שתי שורות בחובה. בזכות שורה אחת: המכירה כולה. 1,000 + 1,500 = 2,500.",
  },
  { ...creditBuy, id: "4" },
  { ...paySupplier, id: "5" },
  {
    id: "6",
    date: "",
    text: "פקודה מורכבת: קנית סחורה ב-1,800 ₪ — 800 שילמת במזומן, ואת השאר תשלם לספק בעוד חודש",
    lines: [
      { account: "קניות", dr: 1_800 },
      { account: "מזומן", cr: 800 },
      { account: "ספקים", cr: 1_000 },
    ],
    why: "קיבלנו סחורה — שורה אחת בחובה. נתנו שני דברים — מזומן, והבטחה לשלם לספק — ולכן שתי שורות בזכות. 800 + 1,000 = 1,800.",
  },
];

// The lesson's road, from the entries to the statements: where each screen stands on it.
const ROUTE: [string, string][] = [
  ["פקודות יומן", "כל אירוע נרשם בפקודה"],
  ["כרטיסי T", "כל חשבון בכרטיס משלו; בסוף השנה — יתרה"],
  ["מאזן בוחן", "כל היתרות בטבלה אחת"],
  ["דוחות", "רווח והפסד, ומאזן"],
];

/** The road from the entries to the statements, with the stop this screen is at. */
function Route({ at }: { at: number }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="הדרך מהפקודות לדוחות">
      {ROUTE.map(([t, d], i) => (
        <li
          key={t}
          aria-current={i === at ? "step" : undefined}
          className={cn(
            "relative rounded-xl border px-3 py-2.5",
            i === at ? "border-accent bg-accent-soft ring-2 ring-accent/30" : i < at ? "border-line bg-surface" : "border-dashed border-line-strong bg-surface",
          )}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "num grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                i === at ? "bg-accent text-accent-fg" : i < at ? "bg-success text-canvas" : "bg-surface-2 text-muted",
              )}
            >
              {i < at ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-[14px] font-bold", i > at ? "text-muted" : "text-fg")}>{t}</span>
            {i === at && <span className="ms-auto rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold text-accent-fg">אתם כאן</span>}
          </span>
          <span className="mt-1 block text-[12.5px] leading-snug text-muted">{d}</span>
        </li>
      ))}
    </ol>
  );
}

// What a trial balance is, before one is built.
const TB_WHAT: [string, string][] = [
  ["מה יש בו", "כל החשבונות של העסק, כל אחד עם יתרת הסגירה של הכרטיס שלו — בעמודת החובה או בעמודת הזכות."],
  ["למה ״בוחן״", "כל פקודה נרשמה עם חובה = זכות, ולכן גם כשמחברים את כל היתרות, סך החובה חייב להיות שווה לסך הזכות. זו הבדיקה."],
  ["בשביל מה", "ממנו בונים את הדוחות: החשבונות התוצאתיים לרווח והפסד, והמאזניים — למאזן."],
  ["מה הוא לא מוכיח", "מאזן מאוזן לא אומר שאין טעויות: טעות שנרשמה באותו סכום בשני הצדדים עדיין מאוזנת."],
];
const kitsTb = trialBalance(balancesOf(ledger(KITS.entries)));

// Figures the screens quote, computed once.
const loanEnd = balancesOf(ledger(CREDIT.loan));
const cash = ledger(KITS.entries).find((t) => t.account === "מזומן")!;
const cashDr = cash.dr.reduce((s, p) => s + p.amount, 0);
const cashCr = cash.cr.reduce((s, p) => s + p.amount, 0);
const retained20 = Y20.equity.find(([a]) => a === "עודפים")![1];
const retained21 = Y21.equity.find(([a]) => a === "עודפים")![1];

export const BOOKS_SCREENS: Record<string, ScreenContent> = {
  credit: {
    lead: "עסקה נרשמת כשהיא קורית, לא כשהכסף עובר. אם הכסף יעבור אחר כך — בינתיים יש חוב, וביום התשלום החוב נסגר.",
    body: (
      <>
        <p>
          לפעמים משלמים רק חלק עכשיו, ואת השאר באשראי. אז באותו צד של הפקודה יש יותר מחשבון אחד — זו <Term he="פקודה מורכבת" />, ועדיין סך החובה שווה לסך
          הזכות. בדוגמה: צעד 3 הוא מכירה כזו, וצעד 6 — קנייה כזו.
        </p>
        <Stepper label="מכירה באשראי ← גבייה ← מכירה מורכבת · קנייה באשראי ← תשלום לספק ← קנייה מורכבת" steps={run(CREDIT_RUN)} />
      </>
    ),
  },

  advances: {
    lead: (
      <>
        <strong>מקדמה</strong> היא המקרה ההפוך: הכסף עובר <strong>לפני</strong> העסקה. עד האספקה זה חוב — שלנו ללקוח, או של הספק לנו.
      </>
    ),
    body: <Stepper label="מקדמה מלקוח ← אספקה · מקדמה לספק ← אספקה" steps={run(CREDIT.advances)} />,
  },

  loan: {
    lead: "הלוואה היא התחייבות. רק הריבית — המחיר על הכסף — היא הוצאה; החזר הקרן רק מקטין את החוב.",
    body: (
      <>
        <Stepper
          label="קבלת ההלוואה ← תשלום ריבית ← פירעון"
          steps={CREDIT.loan.map((x, i) => ({
            title: x.text,
            body: (
              <>
                <Posted entries={CREDIT.loan} at={i} title="פקודת היומן" />
                {i === CREDIT.loan.length - 1 && (
                  <p className="rounded-xl bg-surface-2/70 px-3 py-2.5 text-[15px]">
                    בסוף: החברה עוד חייבת <Money v={-loanEnd["הלוואה"]} />, והוצאות הריבית <Money v={loanEnd["הוצאות ריבית"]} /> — רק הן נכנסות לרווח והפסד.
                  </p>
                )}
              </>
            ),
          }))}
        />
      </>
    ),
  },

  taccounts: {
    lead: "כל פקודות היומן של השנה מצטברות בכרטיסי T — לכל חשבון כרטיס משלו. בסוף השנה סוגרים כל כרטיס: מחברים כל צד, והיתרה היא ההפרש, בצד הגדול.",
    body: (
      <>
        <Route at={1} />
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {["יתרת פתיחה (בעסק חדש: 0)", "תנועות — כל סכום בצד שלו, עם מספר הפקודה", "יתרת סגירה — ההפרש"].map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-fg">{t}</span>
              {i < 2 && <ArrowLeft className="h-4 w-4 text-subtle" aria-hidden />}
            </li>
          ))}
        </ol>
        <p>
          איך מגיעים ליתרת הסגירה? נראה את זה על כרטיס אחד: כרטיס המזומן של עסק הערכות מ<ScreenLink id="lab" />. נעבור על הפקודות של השנה אחת אחת, ונראה איך
          כל פקודה מוסיפה שורה לכרטיס. בצעד האחרון נסגור את הכרטיס ונמצא את היתרה שלו:
        </p>
        <Stepper
          label="בונים כרטיס T: מזומן"
          steps={[
            // Only the cash card: the one being built here. An entry that does not touch cash leaves it as it was.
            ...KITS.entries.map((x, i) => ({ title: x.text, body: <Posted entries={KITS.entries} at={i} accounts={["מזומן"]} title={`פקודה ${x.id}`} inline /> })),
            {
              title: "סוגרים את הכרטיס: מה היתרה?",
              body: (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
                  <div>
                    <THead />
                    <TBox t={cash} totals />
                  </div>
                  <div className="space-y-2">
                    <Calc result={<Money v={cash.balance} />}>
                      חובה <Money v={cashDr} /> − זכות <Money v={cashCr} />
                    </Calc>
                    <p className="text-[15px]">
                      החובה גדולה יותר, ולכן היתרה <strong className="text-debit">בחובה</strong>: זה המזומן שנשאר בקופה.
                    </p>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </>
    ),
  },

  trial: {
    lead: "בסוף השנה לוקחים את היתרה של כל כרטיס T, ומרכזים את כולן בטבלה אחת: מאזן בוחן.",
    body: (
      <>
        <Route at={2} />
        <h3 className="text-lg font-semibold text-fg">מה זה מאזן בוחן?</h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          {TB_WHAT.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <dt className="text-[14px] font-bold text-fg">{t}</dt>
              <dd className="text-[14px] leading-relaxed text-fg/85">{d}</dd>
            </div>
          ))}
        </dl>
        <p>
          כך נראה מאזן הבוחן של עסק הערכות, מאותם כרטיסים שבנינו במסך הקודם. יתרת המזומן, <Money v={cash.balance} />, היא היתרה שחישבנו בכרטיס:
        </p>
        <TBTable tb={kitsTb} caption="מאזן בוחן · עסק הערכות" kind />

        <h3 className="pt-2 text-lg font-semibold text-fg">מ-1.1 ועד מאזן נכון ל-31.12</h3>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TB_STAGES.map(([t, d], i) => (
            <li key={t} className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
              <span>
                <span className="block text-sm font-semibold text-fg">{t}</span>
                <span className="block text-[13px] text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-2.5 text-[15px]">
          בשאלה מקבלים בדרך כלל את שלב 1. דוחות שנבנים ישר ממנו — שגויים: קודם התאמות.
        </p>
      </>
    ),
  },

  trialCheck: {
    lead: "לפני שממשיכים לתרגול של השיעור — בודקים שההבנה יושבת: יודעים באיזה צד נמצא כל חשבון במאזן הבוחן.",
    body: (
      <>
        <Route at={2} />
        <p>
          לפניכם היתרות של חברת יובל בע&quot;מ ב-31.12.2020. שבצו כל יתרה בצד שלה — חובה או זכות. כל בחירה מקבלת הסבר מיד, ובסוף מתקבל מאזן הבוחן המלא.
        </p>
        <ClassifyExercise balances={YUVAL.tb2020} explain={EXPLAIN} solution={<TBTable tb={trialBalance(YUVAL.tb2020)} caption="הפתרון: מאזן הבוחן של יובל ליום 31.12.2020" kind />} />
      </>
    ),
  },

  retained: {
    lead: "עודפים הם הרווחים שהחברה צברה מאז שקמה, ולא חילקה לבעלים. הם חלק מההון.",
    body: (
      <>
        <div className="grid gap-2 md:grid-cols-3">
          <Fact icon={<CalendarClock className="h-4 w-4" />} title="חברה שנפתחה השנה">
            אין לה עודפים לתחילת השנה: הם 0.
          </Fact>
          <Fact icon={<RotateCcw className="h-4 w-4" />} title="בכל שנה">
            עודפי סגירה = עודפי פתיחה + רווח השנה (או פחות הפסד, ופחות מה שחולק).
          </Fact>
          <Fact icon={<span className="text-sm font-bold">?</span>} title="בשאלה">
            העודפים כמעט תמיד הנעלם. המאזן חייב להתאזן — ולכן הם ההפרש.
          </Fact>
        </div>
        <RetainedSolver
          assets={Y20.assets}
          liabilities={Y20.liabilities}
          equity={Y20.equity.filter(([a]) => a !== "עודפים")}
          answer={retained20}
          opening={0}
          profit={Y20.profit}
        />
      </>
    ),
  },

  reports: {
    lead: "מהיתרות בונים את שני הדוחות: החשבונות התוצאתיים — הכנסות והוצאות — נכנסים לדוח רווח והפסד. החשבונות המאזניים — נכסים, התחייבויות והון — נכנסים למאזן.",
    body: (
      <>
        <Route at={3} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-fg/15 bg-surface p-4">
            <p className="text-[17px] font-bold text-fg">תוצאתי · רווח והפסד</p>
            <p className="mt-1 text-[14.5px] text-fg/90">הכנסות והוצאות. מודדים מה קרה בשנה אחת.</p>
            <p className="mt-2 inline-block rounded-lg bg-fg px-2.5 py-1 text-[13px] font-bold text-surface">נכנסים לדוח רווח והפסד</p>
          </div>
          <div className="rounded-2xl border-2 border-accent/40 bg-surface p-4">
            <p className="text-[17px] font-bold text-fg">מאזני · המאזן</p>
            <p className="mt-1 text-[14.5px] text-fg/90">נכסים, התחייבויות והון. מתארים מצב ביום מסוים.</p>
            <p className="mt-2 inline-block rounded-lg bg-accent px-2.5 py-1 text-[13px] font-bold text-accent-fg">נכנסים למאזן</p>
          </div>
        </div>
        <p>
          ביובל 2020: הכנסות <Money v={Y20.totalIncome} /> פחות הוצאות <Money v={Y20.totalExpenses} /> = רווח <Money v={Y20.profit} />, שעובר לעודפים:
        </p>
        <StatementsView s={Y20} year="2020" />
      </>
    ),
  },

  carry: {
    lead: "ב-1.1 החשבונות המאזניים ממשיכים עם יתרת הסגירה שלהם, והתוצאתיים מתחילים מאפס. כך עוברת יובל מ-2020 ל-2021 — שנה שמסתיימת בהפסד.",
    body: (
      <>
        <Stepper
          label="מ-31.12.2020 ל-2021 · יובל"
          steps={[
            {
              title: "31.12.2020 ← 1.1.2021: מה עובר ומה מתאפס",
              body: (
                <>
                  <CarryList />
                  <p className="text-[14.5px] text-muted">
                    למה? השאלה &quot;כמה הרווחנו ב-2021?&quot; צריכה לספור רק את 2021. מה שהורווח קודם כבר יושב בעודפים.
                  </p>
                </>
              ),
            },
            // The year's entries on their own: this screen is about what carries over, not about the cards.
            ...YUVAL.entries2021.map((x) => ({ title: `2021 · ${x.text}`, body: <JE entry={x} title="פקודת היומן" /> })),
            {
              title: "סוף 2021: מאזן הבוחן והתוצאה",
              body: (
                <>
                  <TBTable tb={trialBalance(B21)} caption="מאזן בוחן ליום 31.12.2021" kind />
                  <Calc result={<span className="text-danger">הפסד <Money v={-Y21.profit} /></span>}>
                    הכנסות <Money v={Y21.totalIncome} /> − הוצאות <Money v={Y21.totalExpenses} />
                  </Calc>
                  <p className="text-[15px]">ההפסד מקטין את העודפים — הרווחים שנצברו עד עכשיו:</p>
                  <Calc result={<Money v={retained21} />}>
                    עודפים <Money v={-OPENING_21["עודפים"]} /> − הפסד <Money v={-Y21.profit} />
                  </Calc>
                </>
              ),
            },
          ]}
        />
        <KeyCard>בהמשך תלמדו גם לבנות דוח כספי מלא. כרגע זה לימוד מקדים.</KeyCard>
      </>
    ),
  },
};

function Fact({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-fg">{title}</span>
        <span className="block text-[14px] text-fg/85">{children}</span>
      </span>
    </div>
  );
}

/** Yuval's balances on 31.12.2020 beside its openings on 1.1.2021: the balance sheet carries over, profit or loss starts again at zero. */
function CarryList() {
  const rows: [string, number][] = [...Object.entries(YUVAL.tb2020), ["עודפים", 0]];
  const side = (v: number) => (v === 0 ? null : <SideChip side={v > 0 ? "dr" : "cr"} className="h-5 min-w-5 text-[10px]" />);
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 border-b border-line bg-surface-2/70 px-3 py-2 text-[11px] font-bold text-muted">
        <span>חשבון</span>
        <span className="w-[5.5rem] sm:w-[6.5rem] text-end">31.12.2020</span>
        <span className="w-4" />
        <span className="w-[5.5rem] sm:w-[6.5rem] text-end">1.1.2021</span>
      </div>
      <ul className="divide-y divide-line/60">
        {rows.map(([a, v]) => {
          const bs = isBalanceSheet(a);
          const next = OPENING_21[a] ?? 0;
          return (
            <li
              key={a}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-1.5 border-s-4 px-2.5 py-1.5 text-[13px] sm:gap-x-2 sm:px-3 sm:text-[13.5px]",
                bs ? "border-accent" : "border-transparent bg-surface-2/40",
                a === "עודפים" && "bg-success/[0.07] font-semibold",
              )}
            >
              <span className="min-w-0 leading-snug">
                {a} <span className="text-[10.5px] text-subtle max-sm:hidden">· {bs ? "מאזני" : "תוצאתי"}</span>
              </span>
              <span className="flex w-[5.5rem] sm:w-[6.5rem] items-center justify-end gap-1">
                <Money v={Math.abs(v)} plain />
                {side(v)}
              </span>
              <ArrowLeft className="h-3.5 w-4 text-subtle" aria-hidden />
              <span className={cn("flex w-[5.5rem] sm:w-[6.5rem] items-center justify-end gap-1", !bs && "text-subtle")}>
                {next === 0 ? "0" : <Money v={Math.abs(next)} plain />}
                {side(next)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line px-3 py-2 text-[12.5px] text-muted">
        <span className="me-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" /> מאזני — ממשיך כמו שהוא. תוצאתי — מתחיל מ-0. העודפים נפתחים ברווח של 2020.
      </p>
    </div>
  );
}
