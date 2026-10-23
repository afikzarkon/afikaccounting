import { ArrowLeft, Building2, FileText, Ruler, Search } from "lucide-react";
import { DataTable } from "@/components/study/blocks";
import { Card, Chapter, Money, Rule, Term } from "./ui";

// Shula, the neighbour: a household described the way a business is. Illustrative figures.
const SHULA = {
  income: [["משכורת", 14_000]] as [string, number][],
  expenses: [
    ["שכר דירה", 5_000],
    ["אוכל וקניות לבית", 3_500],
    ["דלק וחשמל", 1_500],
  ] as [string, number][],
  assets: [
    ["רכב", 70_000],
    ["חיסכון בבנק", 25_000],
  ] as [string, number][],
  liabilities: [["הלוואה על הרכב", 40_000]] as [string, number][],
};
const total = (xs: [string, number][]) => xs.reduce((s, [, v]) => s + v, 0);

const STAGES = [
  ["פקודת יומן", "רושמים כל אירוע לפי סדר הזמנים"],
  ["כרטיסי T", "מעבירים כל שורה לחשבון שלה"],
  ["מאזן בוחן", "מרכזים את כל היתרות בטבלה אחת"],
  ["דוחות כספיים", "מסדרים את היתרות לרווח והפסד ולמאזן"],
];

const TYPES: { name: string; en: string; plain: string; example: string; side: "חובה" | "זכות"; up: string; down: string }[] = [
  { name: "נכסים", en: "Assets", plain: "מה שהעסק מחזיק ויפיק ממנו תועלת בעתיד", example: "מזומן, לקוחות שחייבים כסף, מחשב, רכב", side: "חובה", up: "חובה", down: "זכות" },
  { name: "התחייבויות", en: "Liabilities", plain: "מה שהעסק חייב לאחרים ויצטרך לשלם", example: "ספקים, הלוואה מהבנק, מקדמה שקיבל מלקוח", side: "זכות", up: "זכות", down: "חובה" },
  { name: "הון", en: "Equity", plain: "מה ששייך לבעלים: מה שהשקיעו, ועוד הרווחים שנצברו", example: "הון בעלים, הון מניות, עודפים", side: "זכות", up: "זכות", down: "חובה" },
  { name: "הכנסות", en: "Income / Revenue", plain: "מה שהעסק הרוויח מהפעילות שלו בתקופה", example: "מכירות, הכנסות מייעוץ, הכנסות משכירות", side: "זכות", up: "זכות", down: "חובה" },
  { name: "הוצאות", en: "Expenses", plain: "מה שהעסק צרך כדי לפעול בתקופה, ולא יחזור", example: "שכירות, שכר, חשמל, פרסום, קניות", side: "חובה", up: "חובה", down: "זכות" },
];

export function IntroChapters() {
  return (
    <>
      <Chapter n={1} id="what" title="מהי חשבונאות" lead="שפה שמתרגמת את מה שקורה בעסק למספרים שכולם מבינים">
        <p>
          <Term he="חשבונאות" en="Accounting" /> מכונה בקיצור &quot;שפת העסקים&quot;. היא לוקחת כל מה שקורה בעסק — קנייה, מכירה, תשלום שכר — ומתרגמת אותו
          למספרים לפי כללים קבועים, כך שכל אחד יוכל לקרוא אותם ולהבין: האם העסק מרוויח? מה יש לו? כמה הוא חייב?
        </p>
        <Card title="דוגמה: שולה השכנה">
          <p>שולה מבקשת שתעזרו לה להבין את מצבה הכספי. אתם מבקשים ממנה לרשום על דף שתי שאלות פשוטות:</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Mini
              title="כל חודש: כמה נכנס וכמה יצא?"
              left={["הכנסות", SHULA.income]}
              right={["הוצאות", SHULA.expenses]}
              verdict={
                <>
                  נשאר לה בכל חודש: <Money v={total(SHULA.income) - total(SHULA.expenses)} />
                </>
              }
            />
            <Mini
              title="ברגע זה: מה יש לה ומה היא חייבת?"
              left={["רכוש", SHULA.assets]}
              right={["התחייבויות", SHULA.liabilities]}
              verdict={
                <>
                  שלה באמת, אחרי החובות: <Money v={total(SHULA.assets) - total(SHULA.liabilities)} />
                </>
              }
            />
          </div>
          <p className="text-sm text-muted">
            שתי השאלות האלה הן בדיוק שני הדוחות החשובים של כל עסק: הראשונה היא דוח רווח והפסד (מה קרה בתקופה), והשנייה היא המאזן (מה המצב ביום מסוים).
          </p>
        </Card>
        <p>למה עסק צריך את זה? עסק קיים כדי להרוויח לבעליו. כדי לדעת אם הרוויח, וכמה — צריך שיטת רישום אחידה. זו החשבונאות.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step icon={<Search className="h-5 w-5" />} title="זיהוי" text="מה קרה? למשל: קנינו סחורה, שילמנו שכר." />
          <Step icon={<Ruler className="h-5 w-5" />} title="מדידה" text="כמה זה עלה? הסכום שהצדדים הסכימו עליו." />
          <Step icon={<FileText className="h-5 w-5" />} title="דיווח" text="רישום, ובסוף התקופה — דוחות כספיים." />
        </div>
        <Card title="ארבעת שלבי הרישום — מפת הדרך של הדף הזה">
          <ol className="flex flex-wrap items-center gap-2">
            {STAGES.map(([t, d], i) => (
              <li key={t} className="flex items-center gap-2">
                <span className="rounded-xl border border-line bg-surface-2/60 px-3 py-2">
                  <span className="block text-sm font-semibold text-fg">
                    {i + 1}. {t}
                  </span>
                  <span className="block text-xs text-muted">{d}</span>
                </span>
                {i < STAGES.length - 1 && <ArrowLeft className="h-4 w-4 text-subtle" aria-hidden />}
              </li>
            ))}
          </ol>
        </Card>
      </Chapter>

      <Chapter n={2} id="entity" title="ישות נפרדת" lead="העסק הוא לא הבעלים — גם כשהבעלים הוא אדם אחד">
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Building2 className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            <Term he="ישות נפרדת" en="Separate Entity" /> פירושה שאת העסק מודדים בנפרד מבעליו. הקפה ששילמה הבעלים בבית הוא לא הוצאה של העסק, והמכונית
            הפרטית שלה היא לא נכס של העסק. רק מה שקורה <strong>לעסק עצמו</strong> נרשם בספרים שלו.
          </p>
        </div>
        <p>
          צורה נפוצה של עסק בישראל היא <Term he='חברה בע"מ' en="Limited Company, Ltd" /> — חברה בערבון מוגבל. מבחינה משפטית יש &quot;מסך&quot; בין החברה
          לבעליה: אם החברה נכשלת, החובות שלה משולמים מהנכסים שלה, והבעלים מפסידים לכל היותר את מה שהשקיעו. מבחינה חשבונאית, אותו מסך קובע מה נכנס
          לדוחות: רק העסקאות של החברה.
        </p>
        <Rule>
          לכן כשהבעלים משקיע כסף בעסק, מבחינת העסק זה אירוע עם צד אחר: העסק מקבל כסף, ומעכשיו &quot;חייב&quot; לבעלים את ההשקעה — זה ההון.
        </Rule>
      </Chapter>

      <Chapter n={3} id="types" title="חמשת סוגי החשבונות" lead="כל מה שעסק רושם נכנס לאחד מחמישה סלים">
        <p>
          <Term he="חשבון" en="Account" /> הוא &quot;דף&quot; בספרי העסק שבו רושמים כל מה שקשור לנושא אחד — למשל מזומן, או הוצאות שכר. לכל חשבון שני צדדים:{" "}
          <Term he="חובה" en="Debit" /> (הצד הימני) ו<Term he="זכות" en="Credit" /> (הצד השמאלי). מה נכנס לאיזה צד — נלמד בפרק 6; כאן רק נכיר את הסלים.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <article key={t.name} className="card flex flex-col p-4">
              <h3 className="text-[17px] font-semibold text-fg">
                {t.name}{" "}
                <span className="text-xs font-normal text-muted">
                  (<bdi dir="ltr">{t.en}</bdi>)
                </span>
              </h3>
              <p className="mt-1 text-[14.5px] text-fg/90">{t.plain}</p>
              <p className="mt-auto pt-3 text-[13px] text-muted">
                <span className="font-semibold text-accent">מהחיים: </span>
                {t.example}
              </p>
            </article>
          ))}
        </div>
        <DataTable
          caption="איפה כל סוג גדל ואיפה הוא קטן"
          head={["סוג", "יתרה רגילה", "מה מגדיל אותו", "מה מקטין אותו", "באיזה דוח"]}
          rows={TYPES.map((t) => [
            t.name,
            <SideTag key="s" side={t.side} />,
            <SideTag key="u" side={t.up as "חובה" | "זכות"} />,
            <SideTag key="d" side={t.down as "חובה" | "זכות"} />,
            ["הכנסות", "הוצאות"].includes(t.name) ? "רווח והפסד" : "מאזן",
          ])}
        />
        <Rule>זכרו את הזוגות: נכסים והוצאות גדלים בחובה. התחייבויות, הון והכנסות גדלים בזכות.</Rule>
      </Chapter>
    </>
  );
}

export function SideTag({ side }: { side: "חובה" | "זכות" }) {
  return <span className={side === "חובה" ? "font-semibold text-debit" : "font-semibold text-credit"}>{side}</span>;
}

function Mini({ title, left, right, verdict }: { title: string; left: [string, [string, number][]]; right: [string, [string, number][]]; verdict: React.ReactNode }) {
  const col = ([name, rows]: [string, [string, number][]]) => (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted">{name}</p>
      <ul className="mt-1 space-y-0.5 text-sm">
        {rows.map(([a, v]) => (
          <li key={a} className="flex justify-between gap-2">
            <span>{a}</span>
            <Money v={v} plain />
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="text-sm font-semibold text-fg">{title}</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        {col(left)}
        {col(right)}
      </div>
      <p className="mt-2 border-t border-line pt-2 text-sm font-semibold text-fg">{verdict}</p>
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <span>
        <span className="block font-semibold text-fg">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </div>
  );
}
