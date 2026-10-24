import { ArrowLeft } from "lucide-react";
import { Callout, DataTable } from "@/components/study/blocks";
import { balancesOf, carryForward, CREDIT, type Entry, isBalanceSheet, ledger, statements, trialBalance, YUVAL } from "@/lib/learn/basics";
import { ClassifyExercise } from "./classify";
import { TAccountsWidget } from "./t-accounts";
import { Card, Chapter, EntryView, Money, Rule, StatementsView, TBTable, TCard, Term } from "./ui";

const Y20 = statements(YUVAL.tb2020);
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
