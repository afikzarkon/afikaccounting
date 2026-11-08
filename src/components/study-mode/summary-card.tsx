"use client";

import { ArrowLeft, BookOpen, BookOpenText, CircleCheck, ClipboardPen, CloudUpload, Flame, Lock, Repeat, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/components/layout/session-store";
import { Button, ButtonLink } from "@/components/ui/button";
import { planOf, type Tier, tierAllows } from "@/lib/pricing";
import { MASTERED } from "@/lib/study/review";
import { maxXp, missedOf, scoreOf, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { XpRing } from "./ring";
import { StageHero } from "./stage";

/** Where the summary leads; `tier` is the plan the next lesson needs, when it isn't open to everyone. */
export type NextLesson = { href: string; label: string; tier?: Tier };

const DISMISS = "afik.save-prompt.dismissed";

/** The last step: the XP as a ring, the score by step and the best streak, a way back to the questions not solved yet, the golden tips, and where to go next. */
export function SummaryCard({
  module: m,
  progress: p,
  next,
  onRestart,
  onRetry,
}: {
  module: StudyModule;
  progress: TopicProgress;
  next?: NextLesson;
  onRestart: () => void;
  onRetry: () => void;
}) {
  const score = scoreOf(m, p);
  const missed = missedOf(m, p).length;
  const xp = xpOf(m, p);
  const max = maxXp(m);
  const session = useSession();
  // The questions on this lesson's review schedule and not yet mastered: what a guest would lose with this browser's storage.
  const scheduled = Object.values(p.review ?? {}).filter((e) => e.box < MASTERED).length;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem(DISMISS) === "1";
    } catch {
      return false;
    }
  });
  const offerSave = session.known && !session.signedIn && scheduled > 0 && !dismissed;
  // Said before the click, not after it: the next lesson is in a plan this reader doesn't have.
  const nextLocked = !!next?.tier && session.known && !tierAllows(session.tier, next.tier);
  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS, "1");
    } catch {
      // Storage blocked: hidden for this view only.
    }
  };
  const learned = m.outcomes.slice(0, 3);
  // One main action: the mistakes first when there are some (they are the lesson's real value), else the next lesson.
  const retryFirst = missed > 0;
  return (
    <div className="space-y-6">
      <StageHero badge={<XpRing xp={xp} max={max} />}>
        {learned.length > 0 && (
          <>
            <p className="text-[13px] font-bold text-muted">מה למדתם</p>
            <ul className="mt-2 space-y-1.5">
              {learned.map((o) => (
                <li key={o} className="flex items-start gap-2 text-[15.5px] leading-relaxed text-fg">
                  <CircleCheck className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden /> {o}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="num mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ClipboardPen className="h-4 w-4" aria-hidden /> תרגול: <strong className="text-fg">{score.practice.ok}</strong>/{score.practice.total} נכון
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpenText className="h-4 w-4" aria-hidden /> מושגים: <strong className="text-fg">{score.learn.ok}</strong>/{score.learn.total}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[#f97316]" aria-hidden /> הרצף הטוב: <strong className="text-fg">{p.best}</strong>
          </span>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {retryFirst && (
            <Button size="lg" onClick={onRetry}>
              <Repeat className="h-4 w-4" aria-hidden /> לתרגל את {missed === 1 ? "השאלה שנשארה" : `${missed} השאלות שנשארו`}
            </Button>
          )}
          {next && (
            <ButtonLink href={next.href} size="lg" variant={retryFirst || nextLocked ? "secondary" : undefined}>
              {nextLocked && <Lock className="h-4 w-4" aria-hidden />} {next.label} <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          )}
        </div>
        {retryFirst && (
          <p className="mt-2 text-[13px] text-muted">
            מה שטעיתם בו כבר נכנס{" "}
            <Link href="/review" className="font-semibold text-accent hover:underline">
              לחזרה שלכם
            </Link>{" "}
            ויחזור מחר.
          </p>
        )}
        {nextLocked && next?.tier && (
          <p className="mt-2 text-[13px] text-muted">
            השיעור הבא הוא חלק מהקורס המלא, במסלול <strong className="text-fg">{planOf(next.tier).name}</strong>. מה שכבר פתוח לכם — השיעור הזה, החזרה והקורס הבסיסי — נשאר פתוח.
          </p>
        )}

        {offerSave && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-line">
            <CloudUpload className="h-5 w-5 shrink-0 text-accent" aria-hidden />
            <p className="num min-w-0 flex-1 text-[14.5px] text-fg">
              <strong>{scheduled === 1 ? "השאלה שטעיתם בה חוזרת" : `${scheduled} השאלות שטעיתם בהן חוזרות`} מחר</strong>, לחזרה של כמה דקות. כרגע{" "}
              {scheduled === 1 ? "היא שמורה" : "הן שמורות"} רק בדפדפן הזה. בחשבון חינמי {scheduled === 1 ? "היא תחכה" : "הן יחכו"} לכם בכל מכשיר.
            </p>
            <div className="flex items-center gap-2">
              <ButtonLink href={`/register?next=${encodeURIComponent("/review")}`}>שמירה בחשבון — חינם</ButtonLink>
              <Button variant="ghost" onClick={dismiss}>
                אחר כך
              </Button>
            </div>
          </div>
        )}
      </StageHero>

      {m.tips.length > 0 && (
        <details className="group rounded-2xl bg-surface ring-1 ring-line">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-[15px] font-semibold text-fg">
            <Sparkles className="h-4 w-4 text-[#eda100]" aria-hidden /> {m.tips.length} טיפים זהב למבחן
            <span className="ms-auto text-[13px] font-normal text-muted group-open:hidden">לפתיחה</span>
          </summary>
          <ol className="grid gap-3 px-5 pb-5 lg:grid-cols-2">
            {m.tips.map((t, i) => (
              <li key={t} className="flex gap-3 rounded-xl bg-surface-2/60 p-4 text-[15px] leading-relaxed text-fg/90">
                <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eda100]/15 text-[13px] font-bold text-amber-700 dark:text-[#f5c04a]">{i + 1}</span>
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
        <Link href={m.backHref} className="inline-flex items-center gap-1.5 text-muted hover:text-fg">
          <BookOpen className="h-4 w-4" aria-hidden /> לכל השיעורים
        </Link>
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-1.5 text-muted hover:text-fg">
          <RotateCcw className="h-4 w-4" aria-hidden /> התחלה מחדש
        </button>
      </div>
    </div>
  );
}
