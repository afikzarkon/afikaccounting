import { ArrowLeft, Building2, FileText, Ruler, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Chapter, Money, Rule, Term } from "./ui";

// Shula, the neighbour: a household described the way a business is. Illustrative figures; income and expenses are for a whole year.
const SHULA = {
  income: [["משכורת", 168_000]] as [string, number][],
  expenses: [
    ["שכר דירה", 60_000],
    ["אוכל וקניות לבית", 42_000],
    ["דלק וחשמל", 18_000],
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

type Side = "חובה" | "זכות";
const TYPES: { name: string; plain: string; example: string; side: Side; up: Side; down: Side }[] = [
  { name: "נכסים", plain: "מה שהעסק מחזיק ויפיק ממנו תועלת בעתיד", example: "מזומן, לקוחות שחייבים כסף, מחשב, רכב", side: "חובה", up: "חובה", down: "זכות" },
  { name: "התחייבויות", plain: "מה שהעסק חייב לאחרים ויצטרך לשלם", example: "ספקים, הלוואה מהבנק, מקדמה שקיבל מלקוח", side: "זכות", up: "זכות", down: "חובה" },
  { name: "הון", plain: "מה ששייך לבעלים: מה שהשקיעו, ועוד הרווחים שנצברו", example: "הון בעלים, הון מניות, עודפים", side: "זכות", up: "זכות", down: "חובה" },
  { name: "הכנסות", plain: "מה שהעסק הרוויח מהפעילות שלו בתקופה", example: "מכירות, הכנסות מייעוץ, הכנסות משכירות", side: "זכות", up: "זכות", down: "חובה" },
  { name: "הוצאות", plain: "מה שהעסק צרך כדי לפעול בתקופה, ולא יחזור", example: "שכירות, שכר, חשמל, פרסום, קניות", side: "חובה", up: "חובה", down: "זכות" },
];

export function IntroChapters() {
  return (
    <>
      <Chapter n={1} id="what" title="מהי חשבונאות" lead="שפה שמתרגמת את מה שקורה בעסק למספרים שכולם מבינים">
        <p>
          <Term he="חשבונאות" /> מכונה בקיצור &quot;שפת העסקים&quot;. היא לוקחת כל מה שקורה בעסק — קנייה, מכירה, תשלום שכר — ומתרגמת אותו
          למספרים לפי כללים קבועים, כך שכל אחד יוכל לקרוא אותם ולהבין: האם העסק מרוויח? מה יש לו? כמה הוא חייב?
        </p>
        <Card title="דוגמה: שולה השכנה">
          <p>שולה מבקשת שתעזרו לה להבין את מצבה הכספי. אתם מבקשים ממנה לרשום על דף שתי שאלות פשוטות:</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Mini
              report="רווח והפסד"
              when="מה קרה בתקופה — סיכום שנתי"
              title="כמה נכנס וכמה יצא במהלך השנה?"
              note="חשבונות תוצאתיים: מתאפסים בתחילת כל שנה — ב-1.1 סופרים שוב מאפס."
              cols={[
                { name: "הכנסות", rows: SHULA.income },
                { name: "הוצאות", rows: SHULA.expenses },
              ]}
              verdict={
                <>
                  רווח השנה (הכנסות פחות הוצאות): <Money v={total(SHULA.income) - total(SHULA.expenses)} />
                </>
              }
            />
            <Mini
              report="מאזן"
              when="מה המצב ביום מסוים — כאן, 31.12"
              title="מה יש לה, וממי זה הגיע?"
              note="סך הנכסים, ההתחייבויות וההון — המצב הקיים של העסק. חשבונות מאזניים: עוברים משנה לשנה, ולא מתאפסים ב-1.1."
              cols={[
                { name: "נכסים", rows: SHULA.assets, total: "סך הנכסים" },
                {
                  name: "התחייבויות והון",
                  rows: [...SHULA.liabilities, ["הון — מה ששלה באמת", total(SHULA.assets) - total(SHULA.liabilities)]],
                  total: "סך ההתחייבויות וההון",
                },
              ]}
              verdict={
                <>
                  שני הצדדים שווים: <Money v={total(SHULA.assets)} /> = <Money v={total(SHULA.liabilities)} /> + <Money v={total(SHULA.assets) - total(SHULA.liabilities)} />
                </>
              }
            />
          </div>
          <Rule>
            שתי השאלות האלה הן בדיוק שני הדוחות החשובים של כל עסק: רווח והפסד — מה קרה בשנה, ומתחיל כל שנה מאפס; מאזן — מה המצב ביום מסוים, וממשיך
            לשנה הבאה.
          </Rule>
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
            <Term he="ישות נפרדת" /> פירושה שאת העסק מודדים בנפרד מבעליו. הקפה ששילמה הבעלים בבית הוא לא הוצאה של העסק, והמכונית
            הפרטית שלה היא לא נכס של העסק. רק מה שקורה <strong>לעסק עצמו</strong> נרשם בספרים שלו.
          </p>
        </div>
        <p>
          צורה נפוצה של עסק בישראל היא <Term he='חברה בע"מ' /> — חברה בערבון מוגבל. מבחינה משפטית יש &quot;מסך&quot; בין החברה
          לבעליה: אם החברה נכשלת, החובות שלה משולמים מהנכסים שלה, והבעלים מפסידים לכל היותר את מה שהשקיעו. מבחינה חשבונאית, אותו מסך קובע מה נכנס
          לדוחות: רק העסקאות של החברה.
        </p>
        <Rule>
          לכן כשהבעלים משקיע כסף בעסק, מבחינת העסק זה אירוע עם צד אחר: העסק מקבל כסף, ומעכשיו &quot;חייב&quot; לבעלים את ההשקעה — זה ההון.
        </Rule>
      </Chapter>

      <Chapter n={3} id="types" title="חמשת סוגי החשבונות" lead="כל מה שעסק רושם נכנס לאחד מחמישה סלים">
        <p>
          <Term he="חשבון" /> הוא &quot;דף&quot; בספרי העסק שבו רושמים כל מה שקשור לנושא אחד — למשל מזומן, או הוצאות שכר. לכל חשבון שני צדדים:{" "}
          <Term he="חובה" /> (הצד הימני) ו<Term he="זכות" /> (הצד השמאלי). מה נכנס לאיזה צד — נלמד בפרק 6; כאן רק נכיר את הסלים.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <article key={t.name} className="card flex flex-col p-4">
              <h3 className="text-[17px] font-semibold text-fg">{t.name}</h3>
              <p className="mt-1 text-[14.5px] text-fg/90">{t.plain}</p>
              <p className="mt-auto pt-3 text-[13px] text-muted">
                <span className="font-semibold text-accent">מהחיים: </span>
                {t.example}
              </p>
            </article>
          ))}
        </div>
        <div className="my-4 overflow-hidden rounded-xl border border-line">
          <p className="border-b border-line bg-surface-2/70 px-4 py-2.5 text-sm font-semibold text-fg">איפה כל סוג גדל ואיפה הוא קטן</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] table-fixed text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[19%]" />
                <col className="w-[19%]" />
                <col className="w-[19%]" />
                <col className="w-[19%]" />
              </colgroup>
              <thead>
                <tr className="bg-surface-2/40 text-xs text-muted">
                  {["סוג", "יתרה רגילה", "מה מגדיל אותו", "מה מקטין אותו", "באיזה דוח"].map((h, i) => (
                    <th key={h} className={cn("px-3 py-2.5 font-semibold", i === 0 ? "text-start" : "text-center")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map((t) => (
                  <tr key={t.name} className="border-t border-line/70">
                    <td className="px-3 py-2.5 font-semibold text-fg">{t.name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <SideTag side={t.side} pill />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <SideTag side={t.up} pill />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <SideTag side={t.down} pill />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-block min-w-[6.5rem] rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-fg">
                        {["הכנסות", "הוצאות"].includes(t.name) ? "רווח והפסד" : "מאזן"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Rule>זכרו את הזוגות: נכסים והוצאות גדלים בחובה. התחייבויות, הון והכנסות גדלים בזכות.</Rule>
      </Chapter>
    </>
  );
}

export function SideTag({ side, pill }: { side: "חובה" | "זכות"; pill?: boolean }) {
  return (
    <span
      className={cn(
        "font-semibold",
        side === "חובה" ? "text-debit" : "text-credit",
        pill && cn("inline-block min-w-[4.5rem] rounded-full px-2.5 py-0.5 text-xs ring-1", side === "חובה" ? "bg-debit/10 ring-debit/30" : "bg-credit/10 ring-credit/30"),
      )}
    >
      {side}
    </span>
  );
}

type MiniCol = { name: string; rows: [string, number][]; total?: string };

/** One of Shula's two pages, under a banner naming the report it really is; the note says whether its accounts reset each year. */
function Mini({ report, when, title, note, cols, verdict }: { report: string; when: string; title: string; note: string; cols: MiniCol[]; verdict: React.ReactNode }) {
  const col = ({ name, rows, total: label }: MiniCol, i: number) => (
    <div key={name} className={cn("flex min-w-0 flex-col", i === 0 && "border-e-2 border-fg/70 pe-3")}>
      <p className="border-b border-line pb-1 text-xs font-bold text-muted">{name}</p>
      <ul className="mt-1 space-y-0.5 text-sm">
        {rows.map(([a, v]) => (
          <li key={a} className="flex justify-between gap-2">
            <span>{a}</span>
            <Money v={v} plain />
          </li>
        ))}
      </ul>
      {label && (
        <p className="mt-auto flex justify-between gap-2 border-t border-line pt-1 text-sm font-semibold text-fg">
          <span>{label}</span>
          <Money v={total(rows)} plain />
        </p>
      )}
    </div>
  );
  return (
    <section className="overflow-hidden rounded-xl border-2 border-accent/50 bg-surface" aria-label={report}>
      <header className="bg-accent px-4 py-2.5 text-accent-fg">
        <h3 className="text-xl font-extrabold tracking-tight">{report}</h3>
        <p className="text-xs font-medium opacity-90">{when}</p>
      </header>
      <div className="p-3">
        <p className="text-sm font-semibold text-fg">{title}</p>
        <div className="mt-2 grid grid-cols-2 gap-3">{cols.map(col)}</div>
        <p className="mt-2 border-t border-line pt-2 text-sm font-semibold text-fg">{verdict}</p>
        <p className="mt-2 rounded-lg border-s-4 border-accent bg-accent-soft px-3 py-2 text-[13px] font-medium text-fg">{note}</p>
      </div>
    </section>
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
