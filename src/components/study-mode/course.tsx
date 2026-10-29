"use client";

import { ArrowLeft, CircleCheck, Play, RotateCcw, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { maxXp, statusOf, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { BASICS_LESSONS, legacyHref } from "@/lib/study/basics";
import { studyHref } from "@/lib/study";
import { cn } from "@/lib/utils";
import { useTopic, useTopics } from "./progress-store";

const SLUGS = BASICS_LESSONS.map((m) => m.slug);

/** The course at a glance: lessons done, XP earned, and a button to the lesson to do next. */
export function CourseProgress() {
  const topics = useTopics(SLUGS);
  const done = BASICS_LESSONS.filter((m) => statusOf(m, topics[m.slug]) === "done").length;
  const xp = BASICS_LESSONS.reduce((s, m) => s + xpOf(m, topics[m.slug]), 0);
  const max = BASICS_LESSONS.reduce((s, m) => s + maxXp(m), 0);
  const nextUp = BASICS_LESSONS.find((m) => statusOf(m, topics[m.slug]) !== "done");
  const started = BASICS_LESSONS.some((m) => statusOf(m, topics[m.slug]) !== "new");
  return (
    <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:p-5">
      <div className="min-w-[12rem] flex-1">
        <p className="num flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span>
            <strong className="text-fg">{done}</strong> מתוך {BASICS_LESSONS.length} שיעורים הושלמו
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" aria-hidden /> {xp} מתוך {max} XP
          </span>
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="התקדמות בקורס" aria-valuemin={0} aria-valuemax={max} aria-valuenow={xp}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(xp / max) * 100}%` }} />
        </div>
      </div>
      {nextUp ? (
        <ButtonLink href={studyHref(nextUp.slug)} size="lg">
          <Play className="h-4 w-4" aria-hidden /> {started ? `להמשיך: שיעור ${nextUp.n}` : "להתחיל את הקורס"}
        </ButtonLink>
      ) : (
        <p className="flex items-center gap-2 font-semibold text-success">
          <CircleCheck className="h-5 w-5" aria-hidden /> סיימתם את כל הקורס!
        </p>
      )}
    </div>
  );
}

/** A lesson card's live part: where the reader stands in it, and the button into it. */
export function LessonAction({ module: m }: { module: StudyModule }) {
  const p = useTopic(m.slug);
  const status = statusOf(m, p);
  return (
    <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
      <span className={cn("num flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", status === "done" ? "bg-success/10 text-success" : status === "started" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted")}>
        {status === "done" && <CircleCheck className="h-3.5 w-3.5" aria-hidden />}
        {status === "done" ? "הושלם" : status === "started" ? "בתהליך" : "טרם התחיל"} · {xpOf(m, p)}/{maxXp(m)} XP
      </span>
      <ButtonLink href={studyHref(m.slug)} variant={status === "started" ? "primary" : "secondary"} className="ms-auto">
        {status === "done" ? (
          <>
            <RotateCcw className="h-4 w-4" aria-hidden /> חזרה על השיעור
          </>
        ) : (
          <>
            {status === "started" ? "להמשיך" : "להתחיל"} <ArrowLeft className="h-4 w-4" aria-hidden />
          </>
        )}
      </ButtonLink>
    </div>
  );
}

/** The former long page's chapter links (/basics#trial) still land: on the lesson screen that holds that chapter now. */
export function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    // An anchor that is still on this page is the browser's to scroll to.
    if (!id || document.getElementById(id)) return;
    const to = legacyHref(id);
    if (to && !to.startsWith("#")) router.replace(to);
  }, [router]);
  return null;
}
