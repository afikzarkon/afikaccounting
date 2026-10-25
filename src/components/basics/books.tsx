import { ArrowLeft } from "lucide-react";
import { Callout, DataTable } from "@/components/study/blocks";
import { balancesOf, carryForward, CREDIT, type Entry, isBalanceSheet, ledger, statements, trialBalance, YUVAL } from "@/lib/learn/basics";
import { ClassifyExercise } from "./classify";
import { TAccountsWidget } from "./t-accounts";
import { Card, Chapter, EntryView, Money, Rule, StatementsView, TBTable, TCard, Term } from "./ui";

const Y20 = statements(YUVAL.tb2020);
const Y20_RETAINED = Y20.equity.find(([a]) => a === "עודפים")![1];

// The trial balance read left to right, as a worksheet lays it out.
const TB_COLUMNS: [string, string][] = [
  ["יתרות ליום 1.1", "מה שהיה בתחילת השנה. חשבונות מאזניים — יתרות הסגירה של השנה הקודמת; חשבונות תוצאתיים — 0. בעסק חדש, כמו יובל ב-2020, הכול 0."],
  ["פקודות התאמה", "פקודות השנה כבר בפנים. בסוף השנה מוסיפים את מה שחסר — פחת רכוש קבוע, חשבונות חתך, מלאי — וכל פקודה מתקנת עוד כמה יתרות, אחת אחרי השנייה."],
  ["מאזן בוחן סופי", "לכל חשבון: היתרה שלפני ההתאמות, ועוד ההתאמות. אלה היתרות הנכונות, וגם כאן סך החובה = סך הזכות."],
  ["מיון ומציאת העודפים", "כל יתרה עוברת לעמודת תוצאתי (לרווח והפסד) או מאזני (למאזן). ההפרש בעמודות התוצאתי הוא רווח השנה — בדיוק מה שחסר בעודפים כדי שהמאזן יתאזן."],
];
const OPENING_21 = carryForward(YUVAL.tb2020);
const LEDGER_21 = ledger(YUVAL.entries2021, OPENING_21);
const B21 = balancesOf(LEDGER_21);
const Y21 = statements(B21);
const TOUCHED_21 = new Set(YUVAL.entries2021.flatMap((e) => e.lines.map((l) => l.account)));
const CLOSE_20: Entry = {
  id: "סגירה",
  date: "31.12.2020",
  text: "הרווח עובר מהחשבונות התוצאתיים לעודפים",
  lines: [
    { account: "סיכום הכנסות והוצאות", dr: Y20.profit },
    { account: "עודפים", cr: Y20.profit },
  ],
};

export function BooksChapters() {
  return (
    <>
      <Chapter n={8} id="credit" title="עסקאות באשראי" lead="לא כל עסקה משולמת ביום שבו היא קורית">
        <p>
          החשבונאות רושמת עסקה כשהיא <strong>קורית</strong>, לא כשהכסף עובר. זה נקרא <Term he="בסיס מצטבר" />. לכן מכירה שהלקוח ישלם
          עליה בעוד שבוע נרשמת כבר היום — בחשבון לקוחות, במקום מזומן. ביום התשלום רושמים פקודה שנייה שסוגרת את החוב.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {CREDIT.pairs.map((p) => (
            <Card key={p.title} title={p.title}>
              <EntryView entry={p.first} title={`${p.first.id}. ${p.first.text}`} />
              <EntryView entry={p.then} title={`${p.then.id}. ${p.then.text}`} />
            </Card>
          ))}
        </div>
        <p>
          <Term he="מקדמות מלקוחות" /> הן כסף שהתקבל לפני שהעסק סיפק משהו — עדיין לא מכירה, אלא חוב: העסק חייב ללקוח מוצר. רק
          באספקה החוב נסגר וההכנסה נרשמת. <Term he="מקדמות לספקים" /> הן המקרה ההפוך: כסף ששילמנו מראש — נכס, כי הספק חייב לנו
          סחורה.
        </p>
        <Card title="הלוואה: קבלה, פירעון וריבית">
          <p>
            <Term he="הלוואה" /> היא כסף שהעסק קיבל ויצטרך להחזיר — התחייבות. <Term he="ריבית" /> היא המחיר על השימוש בכסף —
            הוצאה. החזר ההלוואה עצמו (הקרן) הוא לא הוצאה: הוא רק מקטין את החוב.
          </p>
          <div className="grid gap-3 xl:grid-cols-3">
            {CREDIT.loan.map((x) => (
              <EntryView key={x.id} entry={x} />
            ))}
          </div>
          <p className="text-sm text-muted">
            אחרי שלוש הפקודות: יתרת ההלוואה <Money v={-balancesOf(ledger(CREDIT.loan))["הלוואה"]} />, והוצאות הריבית <Money v={balancesOf(ledger(CREDIT.loan))["הוצאות ריבית"]} /> — רק
            הן נכנסות לרווח והפסד.
          </p>
        </Card>
      </Chapter>

      <Chapter n={9} id="taccounts" title="כרטיסי T" lead="מכל פקודת יומן — לחשבון שלה">
        <p>
          אחרי הרישום ביומן, כל שורה עוברת ל<Term he="כרטיס T" /> של החשבון שלה. כל הכרטיסים יחד נקראים{" "}
          <Term he="כרטסת" /> (או ספר ראשי). צורת ה-T היא פשוט קו באמצע: חובה מימין, זכות משמאל. ליד כל סכום כותבים את מספר הפקודה, כדי
          שאפשר יהיה לחזור אליה.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <Term he="יתרת פתיחה" /> — מה שהיה בחשבון בתחילת התקופה (בעסק חדש: אפס).
          </li>
          <li>תנועות — כל הסכומים מהפקודות, כל אחד בצד שבו הופיע בפקודה.</li>
          <li>
            <Term he="יתרת סגירה" /> — ההפרש בין הצדדים. אם החובה גדולה יותר, היתרה בחובה; אם הזכות — בזכות.
          </li>
        </ul>
        <TAccountsWidget />
      </Chapter>

      <Chapter n={10} id="trial" title="מאזן בוחן" lead="כל היתרות בטבלה אחת — ובדיקה שלא טעינו">
        <p>
          <Term he="מאזן בוחן" /> מרכז את יתרות הסגירה של כל הכרטיסים ליום מסוים, כל יתרה בצד שלה. כי כל פקודה הייתה מאוזנת, גם סך כל
          היתרות בחובה חייב להיות שווה לסך כל היתרות בזכות. אם לא — יש טעות בדרך.
        </p>
        <p>
          לדוגמה, חברת יובל בע&quot;מ הוקמה ב-1.1.2020. אלה היתרות שלה ב-31.12.2020 — בלי לציין את הצד. שבצו כל אחת בחובה או בזכות:
        </p>
        <ClassifyExercise balances={YUVAL.tb2020} />
        <TBTable tb={trialBalance(YUVAL.tb2020)} caption="הפתרון: מאזן הבוחן של יובל ליום 31.12.2020" kind />

        <h3 className="pt-2 text-lg font-semibold text-fg">מאזן הבוחן בשלבים: מ-1.1 ועד הדוחות</h3>
        <p>
          בבחינה ובעבודה, מאזן הבוחן הוא לא טבלה אחת אלא כמה עמודות זו ליד זו. כל עמודה היא שלב, וכל שלב נבנה על הקודם. כך קוראים אותן, מימין לשמאל:
        </p>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {TB_COLUMNS.map(([title, text], i) => (
            <li key={title} className="relative rounded-xl border border-line bg-surface p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-fg">{i + 1}</span>
                {title}
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg/85">{text}</p>
            </li>
          ))}
        </ol>
        <Callout kind="warn" title="מאזן הבוחן שמקבלים הוא לפני התאמות">
          <p>
            בשאלה נותנים כמעט תמיד <strong>מאזן בוחן ראשוני</strong>: כל מה שנרשם במהלך השנה, אבל לא מה שעוד חסר בסופה — פחת על הרכוש הקבוע, חשבונות חתך
            (פרק 12), מלאי סגירה (פרק 13). לכן קודם רושמים פקודות התאמה, ורק אחריהן מפיקים מאזן בוחן סופי. דוחות שנבנים ישר מהמאזן הראשוני — שגויים.
          </p>
          <p>
            ועוד פרט שמבלבל: <strong>העודפים במאזן הבוחן הם עדיין היתרה של 1.1</strong>. רווח השנה הנוכחית עוד לא נכנס אליהם — הוא מפוזר בחשבונות ההכנסות
            וההוצאות.
          </p>
        </Callout>
        <Card title="מה הם עודפים — ואיך מוצאים אותם?">
          <p>
            <Term he="עודפים" /> הם כל הרווחים שהעסק צבר מאז שקם, ולא חילק לבעלים — כמו קופת חיסכון של הרווחים. כל שנה נכנס אליה רווח השנה (או יוצא ממנה
            ההפסד). הם חלק מההון, כי הרווח שייך לבעלים.
          </p>
          <p>
            כמעט אף פעם לא נותנים את העודפים בסוף השנה — <strong>הם הנעלם</strong>. מוצאים אותם בשתי דרכים, ושתיהן חייבות לתת אותו מספר:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>מהרווח:</strong> עודפים 31.12 = עודפים 1.1 + רווח השנה (− הפסד, − מה שחולק לבעלים).
            </li>
            <li>
              <strong>מהמאזן:</strong> העודפים הם המספר שחסר כדי ששני הצדדים יהיו שווים — נכסים פחות התחייבויות פחות שאר ההון.
            </li>
          </ul>
          <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm">
            ביובל 2020: עודפי 1.1 = 0 (עסק חדש) + רווח השנה <Money v={Y20.profit} /> = <Money v={Y20_RETAINED} />. ובדיקה מהמאזן: נכסים{" "}
            <Money v={Y20.totalAssets} /> − התחייבויות <Money v={Y20.totalLiabilities} /> − הון בעלים <Money v={Y20.totalEquity - Y20_RETAINED} /> ={" "}
            <Money v={Y20_RETAINED} />. אותו מספר — וזה מה שמאזן את המאזן.
          </p>
          <p className="text-sm text-muted">
            את כל הדרך, עמודה אחר עמודה ועם פקודות התאמה אמיתיות, תראו בגיליון הרב-טורי של חברת רונן{" "}
            <a href="#worksheet" className="font-medium text-accent hover:underline">
              בפרק 15
            </a>
            .
          </p>
        </Card>
      </Chapter>

      <Chapter n={11} id="reports" title="מאזני מול תוצאתי, והדוחות" lead="איך מאזן הבוחן הופך לשני דוחות — ומה עובר לשנה הבאה">
        <p>
          כל חשבון שייך לאחד משני סוגים. <Term he="חשבון מאזני" /> — נכס, התחייבות או הון — מתאר מצב ביום מסוים, וממשיך כל עוד
          העסק קיים. <Term he="חשבון תוצאתי" /> — הכנסה או הוצאה — צובר את מה שקרה בתקופה אחת, ובסוף התקופה מתאפס.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Card title={<Term he="דוח רווח והפסד" />}>
            <p>לתקופה: הכנסות פחות הוצאות. כאן נכנסים החשבונות התוצאתיים.</p>
          </Card>
          <Card title={<Term he="מאזן" />}>
            <p>ליום מסוים: נכסים מול התחייבויות והון. כאן נכנסים החשבונות המאזניים.</p>
          </Card>
        </div>
        <p>
          ביובל 2020: הכנסות <Money v={Y20.totalIncome} /> פחות הוצאות <Money v={Y20.totalExpenses} /> — רווח של <Money v={Y20.profit} />. הרווח שייך
          לבעלים, ולכן הוא עובר להון, לחשבון <Term he="עודפים" />. רק אחרי ההעברה המאזן מתאזן:
        </p>
        <StatementsView s={Y20} year="2020" />
        <EntryView
          entry={CLOSE_20}
          effect={false}
          title="העברת הרווח לעודפים"
          note="בפועל כל חשבון תוצאתי נסגר לחשבון סיכום, והתוצאה — רווח או הפסד — עוברת לעודפים בסכום אחד."
        />
        <Callout title="ואם יש הפסד?">
          <p>
            הפסד מקטין את העודפים. כשההפסדים גדולים מהרווחים שנצברו, לעודפים יש יתרה בחובה — והיא נקראת <Term he="הפסדים צבורים" />.
          </p>
        </Callout>

        <h3 className="pt-2 text-lg font-semibold text-fg">מעבר משנה לשנה: יובל ב-2021</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-surface-2 px-3 py-1.5">חשבונות מאזניים: יתרת הסגירה של 2020 היא יתרת הפתיחה של 2021</span>
          <ArrowLeft className="h-4 w-4 text-subtle" aria-hidden />
          <span className="rounded-lg bg-surface-2 px-3 py-1.5">חשבונות תוצאתיים: מתחילים מאפס</span>
          <ArrowLeft className="h-4 w-4 text-subtle" aria-hidden />
          <span className="rounded-lg bg-surface-2 px-3 py-1.5">
            עודפים: נפתחים ב-<Money v={-OPENING_21["עודפים"]} />
          </span>
        </div>
        <p>למה התוצאתיים מתאפסים? כי השאלה &quot;כמה הרווחנו ב-2021?&quot; צריכה לספור רק את 2021. מה שהורווח קודם כבר יושב בעודפים.</p>
        <div className="grid gap-3 xl:grid-cols-3">
          {YUVAL.entries2021.map((x) => (
            <EntryView key={x.id} entry={x} title={`${x.id}. ${x.text}`} />
          ))}
        </div>
        <p className="text-sm font-semibold text-fg">כרטיסי T שזזו ב-2021 (י.פ = יתרת פתיחה):</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {LEDGER_21.filter((t) => TOUCHED_21.has(t.account)).map((t) => (
            <TCard key={t.account} t={t} />
          ))}
        </div>
        <TBTable tb={trialBalance(B21)} caption="מאזן הבוחן ליום 31.12.2021" kind />
        <StatementsView s={Y21} year="2021" />
        <Rule>
          2021: הפסד של <Money v={-Y21.profit} />, ולכן העודפים ירדו ל-<Money v={Y21.equity.find(([a]) => a === "עודפים")![1]} />. מזומן: <Money v={B21["מזומן"]} />. סך המאזן:{" "}
          <Money v={Y21.totalAssets} /> בשני הצדדים.
        </Rule>
        <DataTable
          caption="מה עבר ומה התאפס"
          head={["חשבון", "סוג", "יתרה ב-31.12.2020", "פתיחה ב-1.1.2021"]}
          rows={Object.entries(YUVAL.tb2020).map(([a, v]) => [a, isBalanceSheet(a) ? "מאזני" : "תוצאתי", Math.abs(v), isBalanceSheet(a) ? Math.abs(v) : 0])}
        />
      </Chapter>
    </>
  );
}
