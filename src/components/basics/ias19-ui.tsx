import { ArrowDown, Lightbulb, MapPin, MessageCircle, Signpost, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Roll } from "@/components/study/ledger";
import { studyHref } from "@/lib/study";
import { branchOf, MIND_MAP } from "@/lib/study/ias19/map";
import { type Ias19Slug, LESSON_N, prereqLine } from "@/lib/study/ias19/shared";
import { cn } from "@/lib/utils";
import { Reveal } from "./inventory-teach";

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
                <span className="text-[12px] font-medium text-muted" dir="ltr">
                  {b.en}
                </span>
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

const CIRCLED = ["①", "②", "③", "④", "⑤"];
export const RECIPE_STEPS = [
  "הטבה לשנת שירות אחת, בשכר הצפוי בפרישה",
  "שנות שירות שנצברו עד תאריך המדידה",
  "עובדים צפויים: מספר × הסתברות לקבל",
  "n: שנים מתאריך המדידה ועד התשלום",
  "i: תשואת אג״ח קונצרניות איכותיות בתאריך המדידה",
];

/** The five-step recipe, ①–⑤, and its formula; with values, the formula with numbers. */
export function Recipe5({ values, result }: { values?: ReactNode[]; result?: ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl border-2 border-accent/30 bg-surface p-3.5">
      <ol className="space-y-1.5">
        {RECIPE_STEPS.map((s, i) => (
          <li key={s} className="flex items-baseline gap-2 text-[14.5px]">
            <span className="text-[18px] font-bold text-accent">{CIRCLED[i]}</span>
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
  oci: { label: "OCI", cls: "bg-violet-500/10 text-violet-700 ring-violet-500/30 dark:text-violet-300" },
  bs: { label: "מאזן", cls: "bg-accent-soft text-accent ring-accent/30" },
};

/** Where a line is reported: profit or loss, OCI or the balance sheet. */
export function DestTag({ to }: { to: keyof typeof DEST }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-px text-[11px] font-semibold ring-1", DEST[to].cls)}>{DEST[to].label}</span>;
}

const HINTS = ["רמז 1 · שאלה מכוונת", "רמז 2 · באיזה צעד אנחנו", "רמז 3 · השורה הראשונה", "הפתרון"];

/** "We solve": the task, then four hints in order — a guiding question, which step we are on, the first line, the solution. */
export function HintLadder({ task, hints }: { task: ReactNode; hints: [ReactNode, ReactNode, ReactNode, ReactNode] }) {
  return (
    <Reveal
      label="רמז הבא"
      steps={[
        <span key="t">
          <strong>המשימה:</strong> {task} <span className="text-muted">נסו לבד, ופתחו רמז רק כשנתקעים.</span>
        </span>,
        ...hints.map((h, i) => (
          <span key={i}>
            <strong className="text-accent">{HINTS[i]}:</strong> {h}
          </span>
        )),
      ]}
    />
  );
}

/** The explain-to-a-friend task: the task first; a model explanation only after trying. */
export function ExplainTask({ task, model }: { task: ReactNode; model: ReactNode }) {
  return (
    <section className="space-y-2 rounded-2xl border border-line bg-surface p-3.5">
      <p className="flex items-center gap-2 font-bold text-fg">
        <MessageCircle className="h-5 w-5 text-accent" aria-hidden /> להסביר לחבר בדקה
      </p>
      <Reveal
        label="הסבר לדוגמה"
        steps={[
          <span key="t">{task} קודם נסו בקול, או כתבו שלושה משפטים — ורק אז פתחו.</span>,
          <span key="m">
            <strong>הסבר לדוגמה:</strong> {model}
          </span>,
        ]}
      />
    </section>
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

/** A term on its first appearance: Hebrew, English and the paragraph of the standard. */
export function T19({ he, en, par }: { he: string; en: string; par?: string }) {
  return (
    <span>
      <strong className="font-semibold text-fg">{he}</strong>{" "}
      <span className="text-[0.92em] text-muted">
        (<span dir="ltr">{en}</span>
        {par && (
          <>
            , <span dir="ltr">IAS 19.{par}</span>
          </>
        )}
        )
      </span>
    </span>
  );
}

/** A step down a short sorting ladder. */
export function Ladder({ steps }: { steps: { q: ReactNode; yes: ReactNode }[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={i}>
          <div className="flex items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2">
            <span className="num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
            <p className="min-w-0 text-[14.5px] text-fg">
              {s.q} <span className="font-semibold text-accent">כן ← {s.yes}</span>
            </p>
          </div>
          {i < steps.length - 1 && <ArrowDown className="mx-auto my-0.5 h-4 w-4 text-subtle" aria-label="לא — לשאלה הבאה" />}
        </li>
      ))}
    </ol>
  );
}
