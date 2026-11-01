import { ArrowLeft, CalendarClock, Check, RotateCcw } from "lucide-react";
import { balancesOf, carryForward, CREDIT, SPLIT, type Entry, isBalanceSheet, CANDLES, ledger, statements, trialBalance, TCHELET } from "@/lib/learn/basics";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { cn } from "@/lib/utils";
import { ClassifyExercise } from "./classify";
import { RetainedSolver } from "./retained";
import { MiniQuiz } from "./inventory-interactive";
import { Posted, TBox, THead } from "./t-accounts";
import { Calc, JE, KeyCard, Money, SideChip, StatementsView, type Step, Stepper, TBTable, Term } from "./ui";

const Y24 = statements(TCHELET.tb2024);
const OPENING_25 = carryForward(TCHELET.tb2024);
const B25 = balancesOf(ledger(TCHELET.entries2025, OPENING_25));
const Y25 = statements(B25);

// Why each of Tchelet's balances sits where it does, for the trial-balance exercise.
const EXPLAIN: Record<string, string> = {
  לקוחות: "לקוח שחייב לך כסף הוא נכס שלך, ולכן הוא בצד החובה.",
  קניות: "קניית סחורה היא הוצאה, והוצאות יושבות בצד החובה.",
  "הוצאות שכר": "שכר הוא הוצאה — היתרה שלה בצד החובה.",
  מכירות: "מכירות הן הכנסה, והכנסות יושבות בצד הזכות.",
  ספקים: "לספק העסק חייב כסף — זו התחייבות, ולכן היא בצד הזכות.",
  "הון מניות": "התמורה שהחברה קיבלה על המניות שהנפיקה היא הון: החברה \"חייבת\" אותה לבעלי המניות, ולכן היא בצד הזכות.",
  ציוד: "ציוד ישמש את העסק שנים — נכס, ולכן בצד החובה.",
  "הוצאות פרסום": "פרסום הוא הוצאה — בצד החובה.",
  "הלוואה שהתקבלה": "הלוואה שהעסק קיבל צריך להחזיר — התחייבות, ולכן בצד הזכות.",
  מזומן: "מזומן הוא נכס — בצד החובה.",
  "הכנסות מעמלות": "עמלות שהחברה מרוויחה הן הכנסה — בצד הזכות.",
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
    text: "פקודה מורכבת: מכרת סחורה ב-4,200 ₪ — 1,700 התקבלו מיד, ואת השאר הלקוח ישלם בחודש הבא",
    lines: [
      { account: "מזומן", dr: 1_700 },
      { account: "לקוחות", dr: 2_500 },
      { account: "מכירות", cr: 4_200 },
    ],
    why: "נכנסו שני דברים — כסף, וחוב של הלקוח על השאר — ולכן שתי שורות בחובה. בזכות שורה אחת: המכירה כולה. 1,700 + 2,500 = 4,200.",
  },
  { ...creditBuy, id: "4" },
  { ...paySupplier, id: "5" },
  {
    id: "6",
    date: "",
    text: "פקודה מורכבת: קנית סחורה ב-3,300 ₪ — 1,300 שילמת מיד, ואת השאר תשלם לספק בעוד חודש",
    lines: [
      { account: "קניות", dr: 3_300 },
      { account: "מזומן", cr: 1_300 },
      { account: "ספקים", cr: 2_000 },
    ],
    why: "נכנסה סחורה — שורה אחת בחובה. יצאו שני דברים — כסף, וחוב לספק — ולכן שתי שורות בזכות. 1,300 + 2,000 = 3,300.",
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
const candlesTb = trialBalance(balancesOf(ledger(CANDLES.entries)));

// Figures the screens quote, computed once.
const loanEnd = balancesOf(ledger(CREDIT.loan));
const cash = ledger(CANDLES.entries).find((t) => t.account === "מזומן")!;
const cashDr = cash.dr.reduce((s, p) => s + p.amount, 0);
const cashCr = cash.cr.reduce((s, p) => s + p.amount, 0);
const retained24 = Y24.equity.find(([a]) => a === "עודפים")![1];
const retained25 = Y25.equity.find(([a]) => a === "עודפים")![1];

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
        <MiniQuiz
          prefix="basics"
          chapter="credit"
          items={[
            {
              q: "מכרת שירות ב-5,000 ₪: 2,000 התקבלו היום, והשאר בעוד חודש. כמה הכנסה נרשמת היום?",
              options: ["5,000", "2,000", "3,000", "0"],
              answer: 0,
              why: "השירות ניתן היום — כל ההכנסה היום. רק התשלום מתחלק: 2,000 כסף ו-3,000 חוב של הלקוח.",
            },
            {
              q: "שילמת לספק 3,000 ₪ על חוב מהחודש שעבר. מה בחובה?",
              options: ["ספקים", "קניות", "מזומן", "לקוחות"],
              answer: 0,
              why: "החוב לספק נסגר — ספקים בחובה. הקנייה עצמה נרשמה כבר בחודש שעבר.",
            },
          ]}
        />
      </>
    ),
  },

  advances: {
    lead: (
      <>
        <strong>מקדמה</strong> היא המקרה ההפוך: הכסף עובר <strong>לפני</strong> העסקה. עד האספקה זה חוב — שלנו ללקוח, או של הספק לנו.
      </>
    ),
    body: (
      <>
        <Stepper label="מקדמה מלקוח ← אספקה · מקדמה לספק ← אספקה" steps={run(CREDIT.advances)} />
        <MiniQuiz
          prefix="basics"
          chapter="advances"
          items={[
            {
              q: "לקוח שילם 2,000 ₪ מראש על הזמנה לחודש הבא. מה בזכות היום?",
              options: ["מקדמות מלקוחות", "מכירות", "לקוחות", "מזומן"],
              answer: 0,
              why: "עוד לא מכרנו כלום — אנחנו חייבים ללקוח את ההזמנה. זו התחייבות: מקדמות מלקוחות.",
            },
            {
              q: "שילמנו לספק 1,200 ₪ מראש על סחורה. איזה סוג חשבון הוא ״מקדמות לספקים״?",
              options: ["נכס", "הוצאה", "התחייבות", "הכנסה"],
              answer: 0,
              why: "הספק חייב לנו סחורה — זה שווה לנו כסף. נכס, עד שהסחורה תגיע ותהפוך לקנייה.",
            },
          ]}
        />
      </>
    ),
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
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-fg">הלוואה בתשלומים: קרן וריבית באותו תשלום</h3>
          <p>
            ברוב ההלוואות משלמים כל פעם גם חלק מהקרן וגם ריבית — בהעברה אחת. בפקודה מפרקים את התשלום לשניים: הקרן מקטינה את החוב, ורק הריבית היא הוצאה.
          </p>
          <JE entry={SPLIT.loanPayment} />
        </section>
        <MiniQuiz
          prefix="basics"
          chapter="loan"
          items={[
            {
              q: "החברה העבירה לבנק 13,000 ₪: 12,000 קרן ו-1,000 ריבית. בכמה קטן הרווח?",
              options: ["1,000", "13,000", "12,000", "0"],
              answer: 0,
              why: "רק הריבית היא הוצאה. 12,000 הקרן מקטינים את ההלוואה, לא את הרווח.",
            },
            {
              q: "בסוף השנה, איפה תופיע יתרת ההלוואה שעוד לא נפרעה?",
              options: ["במאזן, בהתחייבויות", "ברווח והפסד, בהוצאות", "במאזן, בנכסים", "לא מופיעה — רק מה ששולם"],
              answer: 0,
              why: "החוב לבנק קיים ב-31.12 — התחייבות במאזן. הוא יקטן עם כל תשלום קרן.",
            },
          ]}
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
          איך מגיעים ליתרת הסגירה? נראה את זה על כרטיס אחד: כרטיס המזומן של סדנת הנרות מ<ScreenLink id="lab" />. נעבור על הפקודות של השנה אחת אחת, ונראה איך
          כל פקודה מוסיפה שורה לכרטיס. בצעד האחרון נסגור את הכרטיס ונמצא את היתרה שלו:
        </p>
        <Stepper
          label="בונים כרטיס T: מזומן"
          steps={[
            // Only the cash card: the one being built here. An entry that does not touch cash leaves it as it was.
            ...CANDLES.entries.map((x, i) => ({ title: x.text, body: <Posted entries={CANDLES.entries} at={i} accounts={["מזומן"]} title={`פקודה ${x.id}`} inline /> })),
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
        <MiniQuiz
          prefix="basics"
          chapter="taccounts"
          items={[
            {
              q: "בכרטיס הספקים: סך הזכות 31,000, סך החובה 24,500. מהי היתרה?",
              options: ["6,500 בזכות", "6,500 בחובה", "55,500 בזכות", "24,500 בחובה"],
              answer: 0,
              why: "היתרה היא ההפרש — 6,500 — בצד הגדול, הזכות. זה החוב שעוד נשאר לספקים.",
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
          כך נראה מאזן הבוחן של סדנת הנרות, מאותם כרטיסים שבנינו במסך הקודם. יתרת המזומן, <Money v={cash.balance} />, היא היתרה שחישבנו בכרטיס:
        </p>
        <TBTable tb={candlesTb} caption="מאזן בוחן · סדנת הנרות" kind />

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
        <MiniQuiz
          prefix="basics"
          chapter="trial"
          items={[
            {
              q: "במאזן בוחן, באיזה צד יופיעו ״הלוואה שהתקבלה״ ו״הוצאות שכירות״?",
              options: ["הלוואה בזכות, הוצאות שכירות בחובה", "שתיהן בחובה", "שתיהן בזכות", "הלוואה בחובה, הוצאות שכירות בזכות"],
              answer: 0,
              why: "הלוואה היא התחייבות — זכות. הוצאה גדלה בחובה — ושם גם היתרה שלה.",
            },
          ]}
        />
      </>
    ),
  },

  trialCheck: {
    lead: "לפני שממשיכים לתרגול של השיעור — בודקים שההבנה יושבת: יודעים באיזה צד נמצא כל חשבון במאזן הבוחן.",
    body: (
      <>
        <Route at={2} />
        <p>
          לפניכם היתרות של חברת תכלת בע&quot;מ ב-31.12.2024. שבצו כל יתרה בצד שלה — חובה או זכות. כל בחירה מקבלת הסבר מיד, ובסוף מתקבל מאזן הבוחן המלא.
        </p>
        <ClassifyExercise balances={TCHELET.tb2024} explain={EXPLAIN} solution={<TBTable tb={trialBalance(TCHELET.tb2024)} caption="הפתרון: מאזן הבוחן של תכלת ליום 31.12.2024" kind />} />
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
          title="המאזן של תכלת ליום 31.12.2024 — מה חסר?"
          assets={Y24.assets}
          liabilities={Y24.liabilities}
          equity={Y24.equity.filter(([a]) => a !== "עודפים")}
          answer={retained24}
          opening={0}
          profit={Y24.profit}
        />
        <div className="space-y-2 rounded-2xl border-2 border-amber-500/50 bg-amber-500/[0.08] px-4 py-3.5">
          <p className="text-[16px] font-bold text-fg">מהשנה השנייה: העודפים במאזן הבוחן הם יתרת הפתיחה</p>
          <p className="text-[15px] leading-relaxed">
            במהלך השנה אף פקודה לא נוגעת בעודפים — הרווח של השנה עוד מפוזר בהכנסות ובהוצאות. לכן במאזן בוחן של 31.12, לפני שסוגרים את השנה, העודפים הם עדיין
            היתרה של <strong>1.1</strong>. כדי להגיע לעודפי הסגירה מוסיפים להם את רווח השנה.
          </p>
        </div>
        <MiniQuiz
          prefix="basics"
          chapter="retained"
          items={[
            {
              q: "חברה בשנתה השלישית. במאזן הבוחן של 31.12 העודפים הם 70,000 ₪ בזכות, ורווח השנה 25,000 ₪. מהם עודפי הסגירה?",
              options: ["95,000", "70,000", "45,000", "25,000"],
              answer: 0,
              why: "70,000 הם עודפי הפתיחה — הרווח של השנה עוד לא נכנס אליהם. 70,000 + 25,000 = 95,000.",
            },
            {
              q: "חברה הפסידה השנה 30,000 ₪. עודפי הפתיחה 20,000 ₪ בזכות. מה קורה לעודפים?",
              options: ["10,000 בחובה — הפסדים צבורים", "50,000 בזכות", "10,000 בזכות", "0"],
              answer: 0,
              why: "20,000 − 30,000 = −10,000. היתרה עוברת לחובה: ההפסדים עד היום גדולים מהרווחים.",
            },
          ]}
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
          בתכלת 2024: הכנסות <Money v={Y24.totalIncome} /> פחות הוצאות <Money v={Y24.totalExpenses} /> = רווח <Money v={Y24.profit} />, שעובר לעודפים:
        </p>
        <StatementsView s={Y24} year="2024" />
        <MiniQuiz
          prefix="basics"
          chapter="reports"
          items={[
            {
              q: "לאיזה דוח נכנס ״מקדמות מלקוחות״?",
              options: ["המאזן — התחייבויות", "רווח והפסד — הכנסות", "המאזן — נכסים", "לאף דוח"],
              answer: 0,
              why: "מקדמה מלקוח היא חוב שלנו ללקוח עד האספקה — התחייבות, ולכן במאזן.",
            },
            {
              q: "הכנסות 240,000 ₪, הוצאות 185,000 ₪. כמה יתווסף לעודפים בסוף השנה?",
              options: ["55,000", "240,000", "425,000", "0"],
              answer: 0,
              why: "רווח = הכנסות − הוצאות = 55,000. הרווח הוא מה שעובר לעודפים.",
            },
          ]}
        />
      </>
    ),
  },

  carry: {
    lead: "ב-1.1 החשבונות המאזניים ממשיכים עם יתרת הסגירה שלהם, והתוצאתיים מתחילים מאפס. כך עוברת תכלת מ-2024 ל-2025 — שנה שמסתיימת בהפסד.",
    body: (
      <>
        <Stepper
          label="מ-31.12.2024 ל-2025 · תכלת"
          steps={[
            {
              title: "31.12.2024 ← 1.1.2025: מה עובר ומה מתאפס",
              body: (
                <>
                  <CarryList />
                  <p className="text-[14.5px] text-muted">
                    למה? השאלה &quot;כמה הרווחנו ב-2025?&quot; צריכה לספור רק את 2025. מה שהורווח קודם כבר יושב בעודפים.
                  </p>
                </>
              ),
            },
            // The year's entries on their own: this screen is about what carries over, not about the cards.
            ...TCHELET.entries2025.map((x) => ({ title: `2025 · ${x.text}`, body: <JE entry={x} title="פקודת היומן" /> })),
            {
              title: "סוף 2025: מאזן הבוחן והתוצאה",
              body: (
                <>
                  <TBTable tb={trialBalance(B25)} caption="מאזן בוחן ליום 31.12.2025" kind />
                  <Calc result={<span className="text-danger">הפסד <Money v={-Y25.profit} /></span>}>
                    הכנסות <Money v={Y25.totalIncome} /> − הוצאות <Money v={Y25.totalExpenses} />
                  </Calc>
                  <p className="text-[15px]">ההפסד מקטין את העודפים — הרווחים שנצברו עד עכשיו:</p>
                  <Calc result={<Money v={retained25} />}>
                    עודפים <Money v={-OPENING_25["עודפים"]} /> − הפסד <Money v={-Y25.profit} />
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

/** Tchelet's balances on 31.12.2024 beside its openings on 1.1.2025: the balance sheet carries over, profit or loss starts again at zero. */
function CarryList() {
  const rows: [string, number][] = [...Object.entries(TCHELET.tb2024), ["עודפים", 0]];
  const side = (v: number) => (v === 0 ? null : <SideChip side={v > 0 ? "dr" : "cr"} className="h-5 min-w-5 text-[10px]" />);
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 border-b border-line bg-surface-2/70 px-3 py-2 text-[11px] font-bold text-muted">
        <span>חשבון</span>
        <span className="w-[5.5rem] sm:w-[6.5rem] text-end">31.12.2024</span>
        <span className="w-4" />
        <span className="w-[5.5rem] sm:w-[6.5rem] text-end">1.1.2025</span>
      </div>
      <ul className="divide-y divide-line/60">
        {rows.map(([a, v]) => {
          const bs = isBalanceSheet(a);
          const next = OPENING_25[a] ?? 0;
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
        <span className="me-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" /> מאזני — ממשיך כמו שהוא. תוצאתי — מתחיל מ-0. העודפים נפתחים ברווח של 2024.
      </p>
    </div>
  );
}
