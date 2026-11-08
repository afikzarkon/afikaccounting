import { ArrowDown, BookOpenCheck, ChevronDown, Lightbulb, MapPin, MessageCircle, Signpost, Star, Undo2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Roll } from "@/components/study/ledger";
import { studyHref } from "@/lib/study";
import { branchOf, MIND_MAP } from "@/lib/study/ias19/map";
import { PRIMER_NEEDS, primerTitle } from "@/lib/study/ias19/primer";
import { type Ias19Slug, LESSON_N, prereqLine } from "@/lib/study/ias19/shared";
import { cn } from "@/lib/utils";
import { FORMULA_COLORS, Mark } from "./ias19-formula";
import { Reveal } from "./inventory-teach";
import { TaskFrame, TaskText } from "./ias19-question";

/**
 * The employee-benefits course's own pieces: the mind map (whole, or as a
 * strip with one branch lit), the roll-forward every solution ends in, the
 * five-step recipe, where a line is reported, a ladder of hints, the
 * explain-to-a-friend task and the bridge to the next lesson.
 */

/** The whole mind map: a right-to-left tree, the core branch marked; each leaf names (and on the course page links to) its lesson. */
export function MindMap({ links, className }: { links?: boolean; className?: string }) {
  const core = MIND_MAP.find((b) => b.core)!;
  return (
    <figure className={cn("rounded-2xl border border-line bg-surface p-4 sm:p-5", className)} aria-label="מפת החשיבה של הקורס">
      <p className="flex items-center gap-2 text-[17px] font-bold text-fg">
        <span className="rounded-lg bg-accent px-2 py-0.5 text-[13px] text-accent-fg" dir="ltr">
          IAS 19
        </span>
        הטבות עובד
      </p>
      <ul className="mt-3 space-y-3 border-s-2 border-line-strong ps-4">
        {MIND_MAP.map((b) => (
          <li key={b.id} className="relative">
            <span aria-hidden className="absolute top-3.5 -start-4 h-0.5 w-3 bg-line-strong" />
            <div className={cn("rounded-xl px-3 py-2 ring-1", b.core ? "bg-accent-soft ring-2 ring-accent/60" : "bg-surface-2/50 ring-line")}>
              <p className="flex flex-wrap items-center gap-x-2 font-bold text-fg">
                {b.core && <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-label="הענף המרכזי" />}
                {b.title}
              </p>
              <ul className="mt-1.5 space-y-1">
                {b.leaves.map((l) => (
                  <li key={l.text} className="flex items-baseline justify-between gap-3 text-[14px] text-fg/90">
                    <span className="min-w-0">• {l.text}</span>
                    {l.lesson &&
                      (links ? (
                        <Link href={studyHref(l.lesson)} className="num shrink-0 text-[12.5px] font-semibold text-accent hover:underline">
                          שיעור {LESSON_N[l.lesson]}
                        </Link>
                      ) : (
                        <span className="num shrink-0 text-[12.5px] font-semibold text-muted">שיעור {LESSON_N[l.lesson]}</span>
                      ))}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-[14px] font-semibold text-fg">
        <span className="num">{core.lessons.length}</span> מתוך <span className="num">{Object.keys(LESSON_N).length}</span> השיעורים עוסקים בענף אחד: הטבה לאחר סיום העסקה.
      </figcaption>
    </figure>
  );
}

/** "Where we are on the map": the five branches in a strip, this lesson's lit and its leaf named, a sentence, and what the lesson needs from earlier ones. */
export function MapBranch({ lesson, children }: { lesson: Ias19Slug; children: ReactNode }) {
  const lit = new Set(branchOf(lesson).map((b) => b.id));
  const leaves = MIND_MAP.flatMap((b) => b.leaves).filter((l) => l.lesson === lesson);
  return (
    <section className="space-y-2.5 rounded-2xl border border-line bg-surface-2/40 p-3.5" aria-label="איפה אנחנו במפה">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-muted">
        <MapPin className="h-4 w-4 text-accent" aria-hidden /> איפה אנחנו במפה
      </p>
      <ol className="flex flex-wrap gap-1.5">
        {MIND_MAP.map((b) => (
          <li
            key={b.id}
            className={cn("rounded-full px-2.5 py-1 text-[12.5px] font-semibold ring-1", lit.has(b.id) ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-muted ring-line")}
          >
            {b.core && "★ "}
            {b.title}
          </li>
        ))}
      </ol>
      {leaves.length > 0 && <p className="text-[14px] text-fg">בענף: {leaves.map((l) => l.text).join(" · ")}</p>}
      <p className="text-[15px] leading-relaxed text-fg/90">{children}</p>
      <p className="text-[13.5px] text-muted">
        <strong className="text-fg/80">נדרש מהשיעורים הקודמים:</strong> {prereqLine(lesson)}
      </p>
      {PRIMER_NEEDS[lesson].length > 0 && (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13.5px] text-muted">
          <BookOpenCheck className="h-4 w-4 text-accent" aria-hidden />
          <strong className="text-fg/80">ידע מקדים:</strong>
          {PRIMER_NEEDS[lesson].map((id, i) => (
            <span key={id}>
              <Link href={`/basics/ias19#primer-${id}`} className="font-medium text-accent hover:underline">
                {primerTitle(id)}
              </Link>
              {i < PRIMER_NEEDS[lesson].length - 1 && " ·"}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

/** One line of a roll-forward: the amount as it moves the balance (payments negative), and at what rate and how many years. */
export type RollRow = { label: ReactNode; value: number; how?: ReactNode; kind?: "balance" | "pn" };

/**
 * A roll-forward drawn the same way in every lesson, as on a worksheet:
 * opening, the lines that explain the year, the P.N. that balances it —
 * tagged with where it lands — and the closing; under each line, the rate and
 * the years it uses. The obligation is a credit and prints negative; plan
 * assets (`side="debit"`) print as they are.
 */
export function RollForward({ title, rows, unit, side = "credit", pnTo = "OCI" }: { title: ReactNode; rows: RollRow[]; unit?: string; side?: "credit" | "debit"; pnTo?: ReactNode }) {
  const balances = rows.flatMap((r, i) => (r.kind === "balance" ? [i] : []));
  const last = balances[balances.length - 1];
  return (
    <Roll
      title={title}
      unit={unit}
      side={side}
      lines={rows.map((r, i) => ({
        label: r.label,
        value: r.value,
        note: r.how,
        kind: r.kind === "pn" ? "focal" : r.kind === "balance" ? (i === last && i > 0 ? "closing" : "opening") : undefined,
        tag: r.kind === "pn" ? pnTo : undefined,
      }))}
    />
  );
}

export const RECIPE_STEPS = [
  "הטבה לשנת שירות אחת, בשכר הצפוי בפרישה",
  "שנות שירות שנצברו עד תאריך המדידה",
  "עובדים צפויים: מספר × הסתברות לקבל",
  "n: שנים מתאריך המדידה ועד התשלום",
  "i: תשואת אג״ח קונצרניות איכותיות בתאריך המדידה",
];

/** The same five steps as five questions in everyday words, asked in this order. */
export const RECIPE_QUESTIONS = ["כמה ההטבה לכל שנת עבודה?", "כמה שנות עבודה כבר עברו?", "כמה עובדים צפויים לקבל?", "בעוד כמה שנים משלמים?", "באיזו ריבית מהוונים?"];

/** The five-step recipe, ①–⑤ in their colours, and its formula; with values, the formula with numbers. `asQuestions` asks the five questions instead of naming the steps. */
export function Recipe5({ values, result, asQuestions }: { values?: ReactNode[]; result?: ReactNode; asQuestions?: boolean }) {
  return (
    <div className="space-y-2 rounded-2xl border-2 border-accent/30 bg-surface p-3.5">
      <ol className="space-y-1.5">
        {(asQuestions ? RECIPE_QUESTIONS : RECIPE_STEPS).map((s, i) => (
          <li key={s} className="flex items-baseline gap-2 text-[14.5px]">
            <span className="text-[18px]">
              <Mark c={(i + 1) as 1 | 2 | 3 | 4 | 5} />
            </span>
            <span className="min-w-0 flex-1 text-fg/90">{s}</span>
            {values?.[i] !== undefined && <span className="shrink-0 font-semibold text-fg">{values[i]}</span>}
          </li>
        ))}
      </ol>
      <p className="rounded-lg bg-accent-soft px-3 py-2 text-center text-[16px] font-bold text-fg">
        התחייבות = <span dir="ltr">① × ② × ③ ÷ (1+i)ⁿ</span>
        {result !== undefined && <> = {result}</>}
      </p>
    </div>
  );
}

const DEST = {
  pl: { label: "רווח והפסד", cls: "bg-surface-2 text-fg/85 ring-line-strong" },
  oci: { label: "OCI", cls: "bg-teal-500/10 text-teal-700 ring-teal-500/30 dark:text-teal-300" },
  bs: { label: "מאזן", cls: "bg-accent-soft text-accent ring-accent/30" },
};

/** Where a line is reported: profit or loss, OCI or the balance sheet. */
export function DestTag({ to }: { to: keyof typeof DEST }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-px text-[11px] font-semibold ring-1", DEST[to].cls)}>{DEST[to].label}</span>;
}

/**
 * A task and its full solution, the way the short-term lesson shows one: the
 * task, then — folded until the learner opens it — a table with the approach
 * and the whole calculation. No hints one at a time. The `hints` keep their old
 * order (a guiding question, the approach, the first lines, the rest); the
 * guiding question is not shown, and the last two are the calculation.
 */
export function TaskSolution({ task, hints }: { task: ReactNode; hints: [ReactNode, ReactNode, ReactNode, ReactNode] }) {
  const [, approach, first, rest] = hints;
  return (
    <TaskFrame>
      <TaskText>{task}</TaskText>
      <details className="group rounded-2xl border border-line bg-surface-2/40 p-3.5">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
          <span className="group-open:hidden">הצגת הפתרון המלא</span>
          <span className="hidden group-open:inline">הסתרת הפתרון</span>
        </summary>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-[14.5px]">
            <tbody>
              <tr className="align-top">
                <th scope="row" className="w-24 bg-surface-2/70 px-3 py-2.5 text-start text-[13px] font-bold text-muted">
                  הדרך
                </th>
                <td className="px-3 py-2.5 leading-relaxed text-fg">{approach}</td>
              </tr>
              <tr className="border-t border-line align-top">
                <th scope="row" className="w-24 bg-surface-2/70 px-3 py-2.5 text-start text-[13px] font-bold text-muted">
                  החישוב
                </th>
                <td className="space-y-2 px-3 py-2.5 leading-relaxed text-fg">
                  {first} {rest}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </TaskFrame>
  );
}

/** A worked solution shown whole: every step, numbered and titled, one under the other — no stepping through it. */
export function FullSteps({ steps, label }: { steps: { title: ReactNode; body: ReactNode }[]; label: string }) {
  return (
    <section aria-label={label} className="space-y-3">
      {steps.map((st, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-3.5">
          <p className="mb-2 flex items-center gap-2 text-[15.5px] font-bold text-fg">
            <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
            {st.title}
          </p>
          <div className="space-y-2 text-[15px] leading-relaxed">{st.body}</div>
        </div>
      ))}
    </section>
  );
}

/** The explain-to-a-friend task: the task first; a model explanation only after trying. */
export function ExplainTask({ task, model }: { task: ReactNode; model: ReactNode }) {
  return (
    <TaskFrame label="משימה: להסביר לחבר בדקה" icon={<MessageCircle className="h-[18px] w-[18px]" aria-hidden />}>
      <Reveal
        label="הסבר לדוגמה"
        steps={[
          <span key="t">{task} קודם נסו בקול, או כתבו שלושה משפטים — ורק אז פתחו.</span>,
          <span key="m">
            <strong>הסבר לדוגמה:</strong> {model}
          </span>,
        ]}
      />
    </TaskFrame>
  );
}

/** The lesson's closing sentence, and the question that leads to the next lesson. */
export function Bridge({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="flex items-start gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-[15.5px] font-semibold text-fg">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden /> {summary}
      </p>
      <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-fg">
        <Signpost className="h-4 w-4 text-accent" aria-hidden /> גשר לשיעור הבא
      </h3>
      <p className="text-[15px] leading-relaxed text-fg/90">{children}</p>
    </section>
  );
}

/**
 * The two boxes a year's numbers land in: profit or loss — what the company
 * did this year (the work, the interest) — and OCI — changes in estimates
 * nobody decided on. The balancing line, P.N., drops into OCI, and an arrow
 * back to profit or loss is struck out: it never returns.
 */
export function TwoBuckets({ pl = ["עלות העבודה של השנה", "הריבית על החוב"], oci = ["שינוי בהערכות: הריבית ירדה, עזבו פחות עובדים"], drop = "P.N. — המספר המאזן" }: { pl?: ReactNode[]; oci?: ReactNode[]; drop?: ReactNode }) {
  const bucket = "flex min-h-32 flex-col rounded-b-[2rem] rounded-t-md border-2 border-t-[5px] px-3 pt-2 pb-4";
  return (
    <figure role="img" aria-label="שתי קופות: רווח והפסד הוא מה שהחברה עשתה השנה; OCI הוא שינויי הערכה. המספר המאזן נופל ל-OCI ולא חוזר לרווח והפסד." className="space-y-2 rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="text-[14px] font-bold text-fg">שתי קופות</figcaption>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <div>
          <p className="mb-1 h-9" />
          <div className={cn(bucket, "border-fg/40 bg-surface-2/60")}>
            <p className="text-[15px] font-bold text-fg">{DEST.pl.label}</p>
            <p className="mb-1.5 text-[12px] text-muted">מה שהחברה עשתה השנה</p>
            <ul className="space-y-1 text-[13px] text-fg">
              {pl.map((x, i) => (
                <li key={i} className="rounded bg-surface px-2 py-0.5 ring-1 ring-line">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center pb-10 text-center">
          <Undo2 className="h-5 w-5 text-danger" aria-hidden />
          <span className="text-[11.5px] font-bold text-danger line-through decoration-2">חוזר</span>
          <span className="text-[11px] text-muted">לעולם לא</span>
        </div>
        <div>
          <p className="mb-1 flex h-9 flex-col items-center">
            <span className="rounded-full border-2 border-amber-500/60 bg-amber-500/15 px-2 text-[12px] font-bold text-fg">{drop}</span>
            <ArrowDown className="h-4 w-4" style={{ color: FORMULA_COLORS[5].color }} aria-hidden />
          </p>
          <div className={cn(bucket, "border-credit/60 bg-credit/[0.08]")}>
            <p className="text-[15px] font-bold text-fg">{DEST.oci.label}</p>
            <p className="mb-1.5 text-[12px] text-muted">שינויי הערכה שאף אחד לא החליט עליהם</p>
            <ul className="space-y-1 text-[13px] text-fg">
              {oci.map((x, i) => (
                <li key={i} className="rounded bg-surface px-2 py-0.5 ring-1 ring-line">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}

/** A term on its first appearance: its Hebrew name and the paragraph of the standard. */
export function T19({ he, par }: { he: string; par?: string }) {
  return (
    <span>
      <strong className="font-semibold text-fg">{he}</strong>
      {par && <span className="text-[0.92em] text-muted"> (סעיף {par})</span>}
    </span>
  );
}

/**
 * A step down a short sorting ladder. Walking one case down it: `answers` says
 * under each step why it was answered as it was, and `stop` is the step the
 * case stops at — ringed, with the steps after it dimmed.
 */
export function Ladder({ steps, answers, stop }: { steps: { q: ReactNode; yes: ReactNode }[]; answers?: ReactNode[]; stop?: number }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={i} className={cn(stop !== undefined && i > stop && "opacity-40")}>
          <div className={cn("flex items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2", stop === i && "border-accent ring-2 ring-accent/60")}>
            <span className="num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
            <div className="min-w-0 text-[14.5px] text-fg">
              <p>
                {s.q} <span className="font-semibold text-accent">כן ← {s.yes}</span>
              </p>
              {answers?.[i] && <p className={cn("mt-1 text-[13.5px]", stop === i ? "font-bold text-accent" : "text-muted")}>{answers[i]}</p>}
            </div>
          </div>
          {i < steps.length - 1 && <ArrowDown className="mx-auto my-0.5 h-4 w-4 text-subtle" aria-label="לא — לשאלה הבאה" />}
        </li>
      ))}
    </ol>
  );
}
