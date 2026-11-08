"use client";

import { ArrowLeft, Calculator, Check, ChevronsLeft, ChevronsRight, CircleCheck, Lock, PlayCircle, RotateCcw, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, Fragment, useEffect, useState } from "react";
import { Modal } from "@/components/admin/modal";
import { Paywall } from "@/components/pricing/paywall";
import { TierBadge } from "@/components/pricing/tier-badge";
import { maxXp, pathStatus, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { studyHref } from "@/lib/study/href";
import { lessonHref } from "@/lib/study/paths";
import { unitsOf } from "@/lib/study/units";
import { cn } from "@/lib/utils";
import { clock } from "./lesson-opening";
import { topicByHref } from "@/lib/catalog";
import { CourseGoals } from "./course-goals";
import { XpRing } from "./ring";
import { updateTopic, useTopics } from "./progress-store";

/**
 * The course as a path: progress on top, then one step per lesson down a line.
 * The lesson to do next opens as a spotlight panel with its concepts; the rest
 * are one row each, done lessons quieter than the ones ahead. A lesson can be
 * skipped: the spotlight moves on, and the lesson waits on the path — and the
 * spotlight can go back to the lesson before it. A lesson's tools (a
 * calculator) open straight from its place on the path.
 *
 * In a paid course, for a reader whose plan doesn't open it, `locked` lessons
 * stay in their place with a lock and the plan's tag, and open the paywall
 * instead; `previews` (the free taste) are tagged free. Without them, the path
 * is the same for everyone.
 */
export function CoursePath({ lessons, locked = [], previews = [] }: { lessons: StudyModule[]; locked?: string[]; previews?: string[] }) {
  const topics = useTopics(lessons.map((m) => m.slug));
  const [paywall, setPaywall] = useState<StudyModule | null>(null);
  const gate = (m: StudyModule): Gate | undefined =>
    locked.includes(m.slug) ? { locked: true, open: () => setPaywall(m) } : previews.includes(m.slug) ? { locked: false } : undefined;
  const taste = lessons.find((m) => previews.includes(m.slug));
  const rows = lessons.map((m) => ({ m, p: topics[m.slug], status: pathStatus(m, topics[m.slug]) }));
  const done = rows.filter((r) => r.status === "done").length;
  const xp = rows.reduce((s, r) => s + xpOf(r.m, r.p), 0);
  const max = rows.reduce((s, r) => s + maxXp(r.m), 0);
  const next = rows.find((r) => r.status === "new" || r.status === "started");
  const topic = lessons[0] ? topicByHref(lessons[0].backHref) : undefined;
  // The first lesson of each unit carries the unit's heading and progress (no units: a plain list).
  const unitStarts = new Map(
    unitsOf(lessons).map((u) => [u.lessons[0].slug, { title: u.title, total: u.lessons.length, done: u.lessons.filter((m) => rows.find((r) => r.m.slug === m.slug)?.status === "done").length }]),
  );
  return (
    <>
      {/* One card: the progress, the single next step, and one thin row of goals (readiness, the exam, the streak). */}
      <div className="card bg-grid p-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <XpRing xp={xp} max={max} className="h-24 w-24" />
        <div className="min-w-0 flex-[1_1_12rem]">
          <p className="text-[18px] font-bold text-fg">המסלול שלך</p>
          <p className="num mt-1 flex flex-wrap items-center gap-x-3 text-[14.5px] text-muted">
            <span>
              <strong className="text-fg">{done}</strong> מתוך {rows.length} שיעורים הושלמו
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" aria-hidden /> {xp} מתוך {max} XP
            </span>
          </p>
        </div>
        {next ? (
          <div className="flex min-w-[12rem] flex-[1_1_20rem] gap-1.5" role="progressbar" aria-label="התקדמות בקורס" aria-valuemin={0} aria-valuemax={max} aria-valuenow={xp}>
            {rows.map(({ m, p, status }) => (
              <span key={m.slug} className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className={cn("block h-full rounded-full transition-[width] duration-500", status === "done" ? "bg-success" : "bg-accent")} style={{ width: `${(xpOf(m, p) / maxXp(m)) * 100}%` }} />
              </span>
            ))}
          </div>
        ) : done === rows.length ? (
          <p className="flex items-center gap-2 font-semibold text-success">
            <CircleCheck className="h-5 w-5" aria-hidden /> סיימתם את כל הקורס!
          </p>
        ) : (
          <p className="text-sm text-muted">דילגתם על השיעורים שנותרו — אפשר לחזור לכל אחד מהם מתי שתרצו.</p>
        )}
      </div>
      {next && (
        <ContinueButton
          lesson={next.m}
          started={next.status === "started"}
          locked={locked.includes(next.m.slug)}
          onLocked={() => setPaywall(next.m)}
        />
      )}
      {topic && <CourseGoals course={topic.id} name={topic.standard ?? topic.title} lessons={lessons} topics={topics} />}
      </div>

      <ol className="mt-8" aria-label="שיעורי הקורס">
        {rows.map((r, i) => {
          const unit = unitStarts.get(r.m.slug);
          const spotlight = r === next;
          const isDone = r.status === "done";
          const skipped = r.status === "skipped";
          return (
            <Fragment key={r.m.slug}>
            {unit && (
              // A unit's heading on the path: the line runs on beside it, and its progress is the unit's lessons done.
              <li className="flex gap-3 sm:gap-5" aria-label={`יחידה: ${unit.title}`}>
                <div className="flex w-10 shrink-0 justify-center sm:w-12" aria-hidden>
                  <span className={cn("w-[3px] rounded-full", i === 0 ? "bg-transparent" : rows[i - 1]?.status === "done" ? "bg-success" : "bg-line-strong")} />
                </div>
                <div className={cn("min-w-0 flex-1 pb-3", i > 0 && "pt-4")}>
                  {/* Headed like a T-account: the title over a firm rule. */}
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-fg/60 pb-1.5">
                    <span className="text-[17px] font-bold text-fg">{unit.title}</span>
                    <span className="num text-[13px] text-muted">
                      {unit.done} מתוך {unit.total} שיעורים
                    </span>
                  </p>
                  <span className="mt-1.5 block h-1 w-40 overflow-hidden rounded-full bg-surface-2">
                    <span className={cn("block h-full rounded-full", unit.done === unit.total ? "bg-success" : "bg-accent")} style={{ width: `${(unit.done / unit.total) * 100}%` }} />
                  </span>
                </div>
              </li>
            )}
            <li className="flex gap-3 sm:gap-5">
              <div className="flex w-10 shrink-0 flex-col items-center sm:w-12" aria-hidden>
                <span className={cn("w-[3px] rounded-full", i === 0 ? "h-0" : spotlight ? "h-6 sm:h-7" : "h-2", rows[i - 1]?.status === "done" ? "bg-success" : "bg-line-strong")} />
                <span
                  className={cn(
                    "num grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-bold sm:h-12 sm:w-12 sm:text-lg",
                    isDone
                      ? "bg-success text-canvas"
                      : spotlight
                        ? "bg-accent text-accent-fg ring-[6px] ring-accent/20"
                        : cn("border-2 border-line-strong bg-surface text-muted", skipped && "border-dashed text-subtle"),
                  )}
                >
                  {isDone ? <Check className="h-5 w-5" strokeWidth={3} /> : r.m.n}
                </span>
                {i < rows.length - 1 && <span className={cn("min-h-3 w-[3px] flex-1 rounded-full", isDone ? "bg-success" : "bg-line-strong")} />}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                {spotlight ? (
                  <Spotlight module={r.m} progress={r.p} started={r.status === "started"} total={rows.length} prev={rows[i - 1]} gate={gate(r.m)} />
                ) : (
                  <>
                    <LessonRow module={r.m} progress={r.p} status={r.status} gate={gate(r.m)} />
                    <Tools module={r.m} className="mt-1.5 ps-4 sm:ps-5" gate={gate(r.m)} />
                  </>
                )}
              </div>
            </li>
            </Fragment>
          );
        })}
      </ol>
      {locked.length > 0 && (
        <Modal open={!!paywall} title="קורס מלא" onClose={() => setPaywall(null)} wide>
          {paywall && (
            <Paywall
              title={`שיעור ${paywall.n}: ${paywall.title}`}
              course={paywall.course}
              where={studyHref(paywall.slug)}
              taste={taste && { href: studyHref(taste.slug), label: `לשיעור ${taste.n} — בחינם` }}
            />
          )}
        </Modal>
      )}
    </>
  );
}

/** A lesson's place in a paid course, for a reader without the plan: locked (opens the paywall), or the free taste. */
type Gate = { locked: true; open: () => void } | { locked: false };

/** The lock and the plan's tag beside a lesson's title; "free" on the taste. */
function GateMark({ gate, dark }: { gate?: Gate; dark?: boolean }) {
  if (!gate) return null;
  if (!gate.locked) return <TierBadge tier="free" label="חינם" className="align-middle" />;
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <Lock className={cn("h-4 w-4", dark ? "text-[#a9dcc0]" : "text-muted")} aria-label="נעול" />
      <TierBadge tier="courses" icon={false} />
    </span>
  );
}

/** A link into the lesson; for a locked lesson, a button with the same look that opens the paywall. `block` stretches the button the full width, as the link's row does. */
function LessonLink({ gate, block, href, className, children, ...props }: { gate?: Gate; block?: boolean } & ComponentProps<typeof Link>) {
  if (gate?.locked)
    return (
      <button type="button" onClick={gate.open} className={cn(className, "text-start", block && "w-full")} aria-haspopup="dialog">
        {children}
      </button>
    );
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}

/** The lesson to do next, open: what it says, the concepts in it (the ones read ticked), and the way in. */
function Spotlight({
  module: m,
  progress: p,
  started,
  total,
  prev,
  gate,
}: {
  module: StudyModule;
  progress: TopicProgress;
  started: boolean;
  total: number;
  gate?: Gate;
  /** The lesson before this one: skipped, it comes back into the spotlight; done, it opens. */
  prev?: { m: StudyModule; status: ReturnType<typeof pathStatus> };
}) {
  const firstUnseen = m.screens.findIndex((_, i) => !p.seen.includes(i));
  const back = "inline-flex h-12 items-center gap-2 rounded-xl border-2 border-[#a9dcc0]/60 bg-white/[0.06] px-5 text-[15px] font-bold text-[#eaf3ee] transition hover:border-[#a9dcc0] hover:bg-white/[0.12]";
  return (
    <section
      aria-labelledby={`lesson-${m.slug}`}
      className="relative flex flex-wrap gap-6 overflow-hidden rounded-3xl bg-[#0f3d2e] p-5 text-[#eaf3ee] shadow-[0_24px_50px_-26px_rgb(15_61_46/0.5)] ring-1 ring-[#7fd3a6]/30 sm:p-8"
    >
      <div className="relative flex min-w-0 flex-[1_1_20rem] flex-col gap-3">
        <p className="num text-sm font-semibold text-[#a9dcc0]">
          {started ? "אתם כאן" : "השיעור הבא"} · שיעור {m.n} מתוך {total}
        </p>
        <h2 id={`lesson-${m.slug}`} className="text-2xl leading-tight font-bold sm:text-3xl">
          {m.title}
          {gate && <> <GateMark gate={gate} dark /></>}
        </h2>
        <p className="text-[15px] leading-relaxed text-[#c9ddd1]">{m.description}</p>
        {m.videos?.length ? (
          <p className="num flex items-center gap-1.5 text-[14px] font-semibold text-[#ffc93c]">
            <PlayCircle className="h-4 w-4" aria-hidden /> {videoLine(m)} — בפתיחת השיעור
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <LessonLink gate={gate} href={studyHref(m.slug)} prefetch className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#7fd3a6] px-6 text-[15px] font-bold text-[#062016] transition hover:brightness-110">
            {started ? "להמשיך מאיפה שעצרתי" : "להתחיל את השיעור"} <ArrowLeft className="h-4 w-4" aria-hidden />
          </LessonLink>
          {prev &&
            (prev.status === "skipped" ? (
              <button type="button" onClick={() => updateTopic(prev.m.slug, (q) => ({ ...q, skipped: false }))} className={back}>
                <ChevronsRight className="h-4 w-4" aria-hidden /> חזור לשיעור הקודם
              </button>
            ) : (
              <Link href={studyHref(prev.m.slug)} prefetch className={back}>
                <ChevronsRight className="h-4 w-4" aria-hidden /> חזור לשיעור הקודם
              </Link>
            ))}
          <button
            type="button"
            onClick={() => updateTopic(m.slug, (q) => ({ ...q, skipped: true }))}
            className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-[#a9dcc0]/60 bg-white/[0.06] px-5 text-[15px] font-bold text-[#eaf3ee] transition hover:border-[#a9dcc0] hover:bg-white/[0.12]"
          >
            דלג על השיעור <ChevronsLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="num text-sm text-[#a3bdaf]">
            {xpOf(m, p)}/{maxXp(m)} XP
          </span>
        </div>
        <Tools module={m} spotlight gate={gate} />
      </div>
      <div className="relative flex min-w-0 flex-[1_1_15rem] flex-col gap-2.5 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur sm:p-5">
        <p className="text-[13px] font-semibold text-[#a3bdaf]">מה יש בשיעור</p>
        <ul className="flex flex-col gap-2.5" aria-label="המושגים בשיעור">
          {m.screens.map((s, i) => {
            const seen = p.seen.includes(i);
            return (
              <li key={s.id} className="flex items-center gap-3 text-[15px]">
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", seen ? "bg-[#22c55e] text-[#052e14]" : "border-2 border-[#7fd3a6]")}>
                  {seen && <Check className="h-3.5 w-3.5" strokeWidth={3.2} aria-label="נקרא" />}
                </span>
                <span className={cn(started && i === firstUnseen && "font-bold")}>{s.title}</span>
              </li>
            );
          })}
          <li className="num flex items-center gap-3 text-[15px] text-[#a3bdaf]">
            <span className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-[#5e7d6c]" aria-hidden />
            {m.exercises.length + m.traps.length} שאלות תרגול · סיכום
          </li>
        </ul>
      </div>
    </section>
  );
}

/** "Includes a video of 4:23", or of its parts. */
function videoLine(m: StudyModule) {
  const v = m.videos!;
  if (v.length === 1) return `כולל סרטון${v[0].part ? ` (${v[0].part})` : ""} של ${clock(v[0].duration)} דק׳`;
  return `כולל ${v.length} סרטונים, ${clock(v.reduce((a, x) => a + x.duration, 0))} דק׳ בסך הכול`;
}

/** A lesson's tools, each a link straight to its screen — no need to go through the lesson first. */
function Tools({ module: m, spotlight, className, gate }: { module: StudyModule; spotlight?: boolean; className?: string; gate?: Gate }) {
  if (!m.tools?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {m.tools.map((t) => (
        <LessonLink
          key={t.screen}
          gate={gate}
          href={lessonHref(m.slug, t.screen)}
          prefetch
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 font-semibold transition",
            spotlight ? "h-10 bg-[#fbbf24] text-[14px] text-[#3b2600] hover:brightness-105" : "h-8 bg-amber-400 text-[13px] text-amber-950 hover:bg-amber-300",
          )}
        >
          <Calculator className="h-4 w-4" aria-hidden /> ישר ל{t.label}
        </LessonLink>
      ))}
    </div>
  );
}

/** Any other lesson: one row, the whole of it a link in. A skipped lesson waits here, dashed; opening it takes it back. */
function LessonRow({ module: m, progress: p, status, gate }: { module: StudyModule; progress: TopicProgress; status: "new" | "started" | "done" | "skipped"; gate?: Gate }) {
  const done = status === "done";
  return (
    <LessonLink
      gate={gate}
      block
      href={studyHref(m.slug)}
      prefetch
      className={cn(
        "group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl px-4 py-3.5 transition sm:px-5",
        done ? "hover:bg-surface" : status === "skipped" ? "border border-dashed border-line-strong hover:border-accent/40 hover:bg-surface" : "border border-line bg-surface shadow-card hover:border-accent/40",
      )}
    >
      <div className="min-w-0 flex-[1_1_18rem]">
        <h2 id={`lesson-${m.slug}`} className={cn("text-lg font-semibold", done ? "text-muted" : "text-fg")}>
          {m.title}
          {gate && <> <GateMark gate={gate} /></>}
        </h2>
        <p className="num mt-0.5 text-sm text-muted">
          {m.screens.length} מושגים · {m.exercises.length + m.traps.length} שאלות תרגול
          {m.videos?.length ? (
            <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {m.videos.length > 1 ? `${m.videos.length} סרטונים` : "סרטון"} {clock(m.videos.reduce((a, v) => a + v.duration, 0))}
            </span>
          ) : null}
        </p>
      </div>
      <span
        className={cn(
          "num flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
          done ? "bg-success/10 text-success" : status === "skipped" ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent",
        )}
      >
        {status === "skipped" ? (
          <>
            דילגתם · לחזור לשיעור <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </>
        ) : done ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> הושלם · חזרה
          </>
        ) : status === "started" ? (
          `בתהליך · ${Math.round((xpOf(m, p) / maxXp(m)) * 100)}%`
        ) : (
          <>
            להתחיל <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </>
        )}
      </span>
    </LessonLink>
  );
}

/** The former long page's chapter links (/basics#trial) still land: on the lesson screen that holds that chapter now. `redirects` maps each old anchor to its new address. */
export function LegacyHashRedirect({ redirects }: { redirects: Record<string, string> }) {
  const router = useRouter();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    // An anchor that is still on this page is the browser's to scroll to.
    if (!id || document.getElementById(id)) return;
    const to = redirects[id];
    if (to && !to.startsWith("#")) router.replace(to);
  }, [router, redirects]);
  return null;
}

/** A lesson's rough length: about a minute a concept and under a minute a question. */
export const minutesOf = (m: StudyModule) => Math.max(5, Math.round(m.screens.length * 1.2 + (m.exercises.length + m.traps.length) * 0.8));

/** The course's one main action: the lesson to do next, with its length. */
function ContinueButton({ lesson, started, locked, onLocked }: { lesson: StudyModule; started: boolean; locked: boolean; onLocked: () => void }) {
  const label = (
    <>
      {locked ? <Lock className="h-4 w-4" aria-hidden /> : <PlayCircle className="h-4 w-4" aria-hidden />}
      <span className="min-w-0 truncate">
        {started ? "להמשיך" : "להתחיל"}: שיעור {lesson.n} · {lesson.title}
      </span>
      <span className="num shrink-0 text-[13px] font-medium opacity-80">~{minutesOf(lesson)} דק׳</span>
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
    </>
  );
  const cls = "mt-4 flex h-12 w-full sm:inline-flex items-center gap-2.5 rounded-xl bg-accent px-5 text-[15px] font-semibold text-accent-fg shadow-[0_10px_24px_-12px_var(--accent)] transition hover:brightness-110 sm:w-auto sm:max-w-full";
  return locked ? (
    <button type="button" onClick={onLocked} className={cls}>
      {label}
    </button>
  ) : (
    <Link href={studyHref(lesson.slug)} className={cls}>
      {label}
    </Link>
  );
}
