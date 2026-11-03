import { ChevronDown, FileText, Handshake } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { expectedHeads } from "@/lib/learn/ias19";
import { lessonHref } from "@/lib/study/paths";
import { screenHref } from "@/lib/study/basics";
import { lessonList } from "@/lib/study/ias19/shared";
import { LIFE_BANK, LIFE_HEADS, LIFE_PL, LIFE_PV, LIFE_PV_TODAY, PRIMER, type PrimerCard, type PrimerId } from "@/lib/study/ias19/primer";
import { PrimerHashOpen } from "./ias19-primer-open";
import { TwoBuckets } from "./ias19-ui";
import { BankStatement, PeopleGrid, PvSlide, Timeline, TwoPanel } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { JE, Money } from "./ui";

/**
 * "Before we start": the primer cards on the course page, folded. Each says it
 * plainly, says why the course needs it, gives the example from life and draws
 * it, states the rule where there is one and checks it — the answer shows only
 * after one is picked.
 * An address ending in #primer-<id> opens that card.
 */

/** Each card's drawing of its example from life. */
const FIGURE: Record<PrimerId, ReactNode> = {
  pv: (
    <>
      <PvSlide fv={LIFE_PV.fv} i={LIFE_PV.i} n={LIFE_PV.n} title="100 ₪ בעוד חמש שנים, מוחזרים להיום" />
      <div className="space-y-1.5 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5 text-[14.5px]">
        <p className="font-bold text-fg">בנוסחה</p>
        <p dir="ltr" className="num text-end">
          {LIFE_PV.fv} ÷ (1 + {LIFE_PV.i})<sup>{LIFE_PV.n}</sup> = {LIFE_PV.fv} ÷ {((1 + LIFE_PV.i) ** LIFE_PV.n).toFixed(3)} = {LIFE_PV_TODAY}
        </p>
        <p className="pt-1 font-bold text-fg">ובאקסל</p>
        <p>אותו חישוב עושה הפונקציה PV. כותבים בתא:</p>
        <p dir="ltr" className="num text-end font-semibold text-fg">
          =PV({LIFE_PV.i * 100}%;{LIFE_PV.n};0;-{LIFE_PV.fv})
        </p>
        <p className="text-[13.5px] text-muted">
          לפי הסדר: הריבית, מספר השנים, 0 כי אין תשלומים בדרך, והסכום העתידי. אקסל מחזיר {LIFE_PV_TODAY}. את הסכום כותבים עם מינוס, אחרת התוצאה יוצאת שלילית.
        </p>
      </div>
    </>
  ),
  roll: (
    <BankStatement
      opening={LIFE_BANK.opening}
      moves={[
        { label: "הפקדה", v: LIFE_BANK.deposit },
        { label: "משיכה", v: -LIFE_BANK.withdrawal },
      ]}
      closing={LIFE_BANK.closing}
      unexplained="עוד לא הוסבר: המספר המאזן"
    />
  ),
  "pl-oci": (
    <>
      <TwoBuckets
        pl={[
          <>
            הכנסות <Money v={LIFE_PL.income} plain /> − הוצאות <Money v={LIFE_PL.expenses} plain /> = <strong><Money v={LIFE_PL.income - LIFE_PL.expenses} plain /></strong>
          </>,
        ]}
        oci={[
          <>
            הקרקע עלתה ב-<strong><Money v={LIFE_PL.revaluation} plain /></strong>
          </>,
        ]}
        drop="שינוי בשווי"
      />
      <p className="text-[14px] text-fg">
        רווח כולל = <Money v={LIFE_PL.income - LIFE_PL.expenses} plain /> + <Money v={LIFE_PL.revaluation} plain /> = <strong><Money v={LIFE_PL.income - LIFE_PL.expenses + LIFE_PL.revaluation} plain /></strong>
      </p>
    </>
  ),
  accrual: (
    <Timeline
      label="עבודה בדצמבר ותשלום ב-5 בינואר: ההוצאה נרשמת בדצמבר"
      title="לוח שנה: מתי עבד, ומתי שולם"
      from={0}
      to={2}
      ticks={[
        { at: 0, label: "1.12" },
        { at: 1, label: "1.1, שנה חדשה" },
        { at: 2, label: "1.2" },
      ]}
      spans={[{ from: 0, to: 1, label: "עבד בדצמבר: ההוצאה כאן", tone: "accent" }]}
      marks={[{ at: 1.16, label: "שולם 5.1", tone: "danger" }]}
    />
  ),
  obligation: (
    <TwoPanel
      label="שני סוגי מחויבות: משפטית, כתובה בחוזה או בחוק; משתמעת, נוהג קבוע שהעובדים סומכים עליו. בשניהם רושמים חוב"
      panels={[
        { title: "משפטית", icon: <FileText />, steps: ["כתוב בחוזה או בחוק", "אפשר לתבוע"], verdict: "רושמים חוב", tone: 1 },
        { title: "משתמעת", icon: <Handshake />, steps: ["החברה עושה את זה שנים", "העובדים סומכים על זה"], verdict: "רושמים חוב", tone: 4 },
      ]}
    />
  ),
  journal: <JE entry={{ id: "1", text: "שכר ששולם במזומן", lines: [{ account: "הוצאות שכר", dr: 200 }, { account: "מזומן", cr: 200 }] }} note="שני צדדים, סכום אחד: חובה מימין, זכות מתחתיה." />,
  percent: <PeopleGrid total={LIFE_HEADS.staff} leaving={LIFE_HEADS.staff - expectedHeads(LIFE_HEADS.staff, LIFE_HEADS.leaving)} title="40 עובדים, 10% צפויים לעזוב" />,
};

/** Where a recommended card is taught in the basics course. */
const LEARN: Partial<Record<PrimerId, { href: string; label: string }>> = {
  accrual: { href: screenHref("expense"), label: "לשיעור ״הוצאה מול השקעה״" },
  journal: { href: lessonHref("basics-double-entry"), label: "לשיעור הרישום הכפול" },
};

function Card({ c }: { c: PrimerCard }) {
  const learn = LEARN[c.id];
  return (
    <details id={`primer-${c.id}`} className="group scroll-mt-24 rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 text-[16px] font-bold text-fg">{c.title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-3.5 text-[15px] leading-relaxed">
        <p>
          <strong className="text-fg">בשפה פשוטה: </strong>
          {c.plain}
        </p>
        <p>
          <strong className="text-fg">למה זה חשוב כאן: </strong>
          {c.need}
        </p>
        <p>
          <strong className="text-fg">דוגמה שאתם מכירים: </strong>
          {c.life}
        </p>
        {FIGURE[c.id]}
        {c.examples && (
          <div>
            <p className="font-bold text-fg">ככה זה נראה בקורס</p>
            <ul className="mt-1 list-disc space-y-1 ps-5">
              {c.examples.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {c.rule && <p className="rounded-xl border-s-4 border-accent bg-accent-soft px-3 py-2 font-medium text-fg">הכלל: {c.rule}</p>}
        <div>
          <p className="mb-1.5 text-[14px] font-bold text-fg">בדיקה עצמית</p>
          <MiniQuiz bare prefix="ias19" chapter={`primer-${c.id}`} items={c.checks} />
        </div>
        <p className="text-[13.5px] text-muted">
          איפה לומדים אותו: {c.taught}.{" "}
          {learn && (
            <Link href={learn.href} className="font-medium text-accent hover:underline">
              {learn.label}
            </Link>
          )}
        </p>
      </div>
    </details>
  );
}

/** The cards, folded, from the most basic up. */
export function Primer() {
  return (
    <div className="space-y-2.5">
      <PrimerHashOpen />
      {PRIMER.map((c) => (
        <Card key={c.id} c={c} />
      ))}
    </div>
  );
}

/** Who needs what: each card, the lessons that use it and where it is taught. */
export function PrimerTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[30rem] text-sm">
        <caption className="sr-only">מי צריך מה</caption>
        <thead>
          <tr className="bg-surface-2/70 text-xs text-muted">
            <th className="px-3 py-2 text-start font-medium">הבנה</th>
            <th className="px-3 py-2 text-start font-medium">נדרשת ב</th>
            <th className="px-3 py-2 text-start font-medium">נלמדת</th>
          </tr>
        </thead>
        <tbody>
          {PRIMER.map((c) => (
            <tr key={c.id} className="border-t border-line/70">
              <td className="px-3 py-2">
                <a href={`#primer-${c.id}`} className="font-semibold text-fg hover:text-accent hover:underline">
                  {c.title}
                </a>
              </td>
              <td className="px-3 py-2 text-fg/90">{lessonList(c.needed)}</td>
              <td className="px-3 py-2 text-fg/90">{c.taught}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
