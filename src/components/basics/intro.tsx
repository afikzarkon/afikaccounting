import { Building2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KeyCard, Lesson, Money, SideChip } from "./ui";

// Shula, from the neighbourhood: a household described the way a business is. Illustrative figures; income and expenses are for a whole year.
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

type Kind = { name: string; plain: string; example: string; report: "מאזן" | "רווח והפסד" };
const DEBIT_KINDS: Kind[] = [
  { name: "נכסים", plain: "מה שהעסק מחזיק ויפיק ממנו תועלת", example: "מזומן, לקוחות שחייבים כסף, מחשב, רכב", report: "מאזן" },
  { name: "הוצאות", plain: "מה שהעסק צרך כדי לפעול, ולא יחזור", example: "שכירות, שכר, חשמל, פרסום, קניות", report: "רווח והפסד" },
];
const CREDIT_KINDS: Kind[] = [
  { name: "התחייבויות", plain: "מה שהעסק חייב לאחרים", example: "ספקים, הלוואה מהבנק, מקדמה שקיבל מלקוח", report: "מאזן" },
  { name: "הון", plain: "מה ששייך לבעלים: מה שהשקיעו, ועוד הרווחים שנצברו", example: "הון בעלים, הון מניות, עודפים", report: "מאזן" },
  { name: "הכנסות", plain: "מה שהעסק הרוויח מהפעילות שלו", example: "מכירות, הכנסות מייעוץ, הכנסות משכירות", report: "רווח והפסד" },
];

export function IntroChapters() {
  return (
    <>
      <Lesson id="what" lead={<>חשבונאות היא &quot;שפת העסקים&quot;: היא מתרגמת את מה שקורה בעסק למספרים שכולם מבינים.</>}>
        <p>
          <strong>דוגמה: שולה מהשכונה.</strong> שולה רוצה להבין את מצבה הכספי. שני דפים עונים לה, ושניהם הם בדיוק שני הדוחות של כל עסק:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Mini
            report="רווח והפסד"
            tag="חשבונות תוצאתיים — מתאפסים בכל תחילת שנה"
            title="כמה נכנס וכמה יצא במהלך השנה?"
            cols={[
              { name: "הכנסות", rows: SHULA.income },
              { name: "הוצאות", rows: SHULA.expenses },
            ]}
            verdict={
              <>
                רווח השנה: <Money v={total(SHULA.income) - total(SHULA.expenses)} />
              </>
            }
          />
          <Mini
            report="מאזן"
            above="מה המצב הכלכלי שלה: נכסים, חובות והון"
            tag="ביום מסוים — כאן, 31.12"
            title="מה יש לה, וממי זה הגיע?"
            cols={[
              { name: "נכסים", rows: SHULA.assets, total: "סך הנכסים" },
              {
                name: "התחייבויות והון",
                rows: [...SHULA.liabilities, ["הון — מה ששלה באמת", total(SHULA.assets) - total(SHULA.liabilities)]],
                total: "סך הכול",
              },
            ]}
            verdict={
              <>
                <Money v={total(SHULA.assets)} /> = <Money v={total(SHULA.liabilities)} /> + <Money v={total(SHULA.assets) - total(SHULA.liabilities)} />
              </>
            }
          />
        </div>
      </Lesson>

      <Lesson id="entity" lead="את העסק מודדים בנפרד מבעליו: בספרי העסק נרשם רק מה שקורה לעסק עצמו.">
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/[0.06] px-3 py-2.5 text-[15px]">
            <Check className="h-5 w-5 shrink-0 text-success" aria-hidden /> שכירות המשרד של העסק — נרשמת
          </p>
          <p className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/[0.05] px-3 py-2.5 text-[15px]">
            <X className="h-5 w-5 shrink-0 text-danger" aria-hidden /> הקפה שהבעלים קנתה לבית — לא נרשמת
          </p>
        </div>
        <KeyCard icon={<Building2 className="h-5 w-5" />}>כשבעלים משקיע כסף בעסק — זה הון.</KeyCard>
        <p className="text-[15px] text-muted">מבחינת העסק הבעלים הוא צד אחר: העסק קיבל ממנו כסף, ו&quot;חייב&quot; לו אותו.</p>
      </Lesson>

      <Lesson
        id="types"
        lead={
          <>
            כל חשבון שייך לאחד מחמישה סוגים, והסוג קובע באיזה צד הוא גדל: <span className="text-debit">נכסים והוצאות — בחובה</span>;{" "}
            <span className="text-credit">התחייבויות, הון והכנסות — בזכות</span>.
          </>
        }
      >
        <p className="text-[15px]">
          לכל חשבון שני צדדים: <SideChip side="dr" className="align-middle" /> חובה מימין, ו-<SideChip side="cr" className="align-middle" /> זכות משמאל. בצד שבו הוא גדל
          נמצאת גם היתרה שלו; בצד השני הוא קטן.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <SideColumn side="dr" kinds={DEBIT_KINDS} />
          <SideColumn side="cr" kinds={CREDIT_KINDS} />
        </div>
      </Lesson>
    </>
  );
}

/** One side of the five kinds: the kinds that grow on it, with their everyday examples. */
function SideColumn({ side, kinds }: { side: "dr" | "cr"; kinds: Kind[] }) {
  const dr = side === "dr";
  return (
    <div className={cn("rounded-2xl border-2 p-2.5", dr ? "border-debit/40 bg-debit/[0.04]" : "border-credit/40 bg-credit/[0.04]")}>
      <p className={cn("mb-2 flex items-center gap-2 px-1 text-[15px] font-bold", dr ? "text-debit" : "text-credit")}>
        <SideChip side={side} /> גדלים ב{dr ? "חובה" : "זכות"}
        <span className="ms-auto text-xs font-medium text-muted">קטנים ב{dr ? "זכות" : "חובה"}</span>
      </p>
      <div className="space-y-2">
        {kinds.map((k) => (
          <article key={k.name} className="rounded-xl border border-line bg-surface p-3">
            <p className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-fg">{k.name}</span>
              <span className="ms-auto rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{k.report}</span>
            </p>
            <p className="mt-0.5 text-[14px] text-fg/90">{k.plain}</p>
            <p className="mt-1 text-[13px] text-muted">
              <span className={cn("font-semibold", dr ? "text-debit" : "text-credit")}>למשל: </span>
              {k.example}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

type MiniCol = { name: string; rows: [string, number][]; total?: string };

/** One of Shula's two pages, under a banner naming the report it really is. */
function Mini({ report, tag, above, title, cols, verdict }: { report: string; tag: string; above?: string; title: string; cols: MiniCol[]; verdict: React.ReactNode }) {
  const col = ({ name, rows, total: label }: MiniCol, i: number) => (
    <div key={name} className={cn("flex min-w-0 flex-col", i === 0 && "border-e-2 border-fg/70 pe-3")}>
      <p className="border-b border-line pb-1 text-xs font-bold text-muted">{name}</p>
      <ul className="mt-1 space-y-0.5 text-sm">
        {rows.map(([a, v]) => (
          <li key={a} className="flex justify-between gap-2">
            <span className="min-w-0">{a}</span>
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
    <div className="flex flex-col">
      {/* The label above the balance sheet; the P&L card keeps the same height of space so the two banners line up. */}
      <p className={cn("mb-1.5 min-h-5 text-[13px] font-bold text-accent", !above && "max-md:hidden")}>{above && `${above} ↓`}</p>
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border-2 border-accent/50 bg-surface" aria-label={report}>
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-accent px-4 py-2.5 text-accent-fg">
          <h3 className="text-xl font-extrabold tracking-tight">{report}</h3>
          <span className="rounded-md bg-accent-fg/15 px-2 py-0.5 text-[12px] font-semibold">{tag}</span>
        </header>
        <div className="flex flex-1 flex-col p-3">
          <p className="text-sm font-semibold text-fg">{title}</p>
          <div className="mt-2 grid flex-1 grid-cols-2 gap-3">{cols.map(col)}</div>
          <p className="mt-2 border-t border-line pt-2 text-sm font-semibold text-fg">{verdict}</p>
        </div>
      </section>
    </div>
  );
}
