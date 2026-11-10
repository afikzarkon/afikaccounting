import { ArrowLeft, Calculator, ChevronDown } from "lucide-react";
import Link from "next/link";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { type Stage, tasteLabel, type Topic } from "@/lib/catalog";
import { firstLessonHref } from "@/lib/study/first-lesson";
import { cn } from "@/lib/utils";
import { getVisibility, visiblePath } from "@/lib/visibility/server";

/**
 * The learning path, stage by stage: what to learn first, and for each topic
 * its guide, its pages and its calculators. `compact` is the home page's version.
 */
export async function LearningPath({ compact = false }: { compact?: boolean }) {
  const path = visiblePath(await getVisibility());
  return (
    <ol className="relative space-y-6">
      {path.map((stage, i) => (
        <StageRow key={stage.id} stage={stage} compact={compact} last={i === path.length - 1} />
      ))}
    </ol>
  );
}

function StageRow({ stage, compact, last }: { stage: Stage; compact: boolean; last: boolean }) {
  return (
    <li className="relative grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)]" aria-labelledby={`stage-${stage.id}`}>
      {/* The line that joins the stages, on wide screens. */}
      {!last && <span aria-hidden className="absolute top-14 bottom-[-1.5rem] start-[1.375rem] hidden w-px bg-line-strong md:block" />}
      <div className="flex items-start gap-3">
        <span className="num relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">
          {stage.step}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-accent">שלב {stage.step}</p>
          <h3 id={`stage-${stage.id}`} className="text-lg font-semibold text-fg">
            {stage.title}
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{stage.lead}</p>
        </div>
      </div>
      <div className={cn("grid grid-cols-1 gap-4", stage.topics.length > 1 && "lg:grid-cols-2")}>
        {stage.topics.map((t) => (compact ? <CompactCard key={t.id} topic={t} /> : <TopicCard key={t.id} topic={t} />))}
      </div>
    </li>
  );
}

/** The name, the standard, and one tag that says what's free: the whole course, or its first lesson. No lock here; the lock is on the course's lessons. */
function Title({ topic }: { topic: Topic }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-fg">
      {topic.title}
      {topic.standard && (
        <Badge tone="neutral" className="num" dir="ltr">
          {topic.standard}
        </Badge>
      )}
      <span className="ms-auto">
        <TierBadge tier="free" label={topic.tier === "free" ? "חינם כולו" : tasteLabel(topic).replace("שיעור ראשון", "שיעור 1")} />
      </span>
    </p>
  );
}

function CompactCard({ topic }: { topic: Topic }) {
  return (
    <Link href={topic.href} className="group card flex min-w-0 flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50">
      <Title topic={topic} />
      <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{topic.description}</p>
      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent">
        {topic.pages ? `${topic.pages.length} דפים` : "לקורס"}
        {topic.tools.length > 0 && <span className="font-normal text-muted">· {topic.tools.length} כלים</span>}
        <ArrowLeft className="ms-auto h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
      </p>
    </Link>
  );
}

/**
 * One course on the map, every card the same shape: what it is in two lines, its size,
 * what's inside folded away (so the page doesn't read as a cloud of tags), its calculators
 * in one line, and one main button straight into lesson 1.
 */
function TopicCard({ topic }: { topic: Topic }) {
  const calculators = topic.tools.filter((x) => x.calculator || !x.href.startsWith("/study/"));
  const free = topic.tier === "free";
  return (
    <article className="card flex min-w-0 flex-col p-5">
      <Title topic={topic} />
      <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-fg/85">{topic.description}</p>
      <p className="num mt-2 text-[13.5px] text-muted">{topic.format === "lessons" ? `${topic.lessons} שיעורים` : `${topic.pages?.length ?? 1} דפים`}</p>
      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
          מה בפנים · <span className="num">{topic.covers.length}</span> נושאים
        </summary>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {topic.covers.map((c) => (
            <li key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              {c}
            </li>
          ))}
        </ul>
      </details>
      {calculators.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <Calculator className="h-4 w-4 text-accent" aria-hidden /> מחשבונים:
          {calculators.map((x, i) => (
            <span key={x.href}>
              <Link href={x.href} className="font-medium text-fg hover:text-accent hover:underline">
                {x.label}
              </Link>
              {i < calculators.length - 1 && <span aria-hidden> ·</span>}
            </span>
          ))}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <ButtonLink href={topic.format === "lessons" ? firstLessonHref(topic) : topic.href} className="w-full sm:w-auto">
          {free ? "להתחיל משיעור 1" : "לשיעור 1 בחינם"} <ArrowLeft className="h-4 w-4" aria-hidden />
        </ButtonLink>
        <Link href={topic.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          כל המסלול <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
