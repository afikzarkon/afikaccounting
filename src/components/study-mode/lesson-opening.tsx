"use client";

import { ArrowLeft, BookOpenText, Calculator, CircleCheck, ClipboardPen, Play, RotateCcw, Star, Target } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { maxXp, PRACTICE_GROUPS, practiceOf, statusOf, type TopicProgress, xpOf } from "@/lib/study/score";
import { videoAt } from "@/lib/study/paths";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { Fact, StageHero, StageLabel } from "./stage";

/** Seconds as m:ss. */
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * The gate into a lesson, on every arrival: what it is about, the concepts it
 * goes through, the practice after them, and the way in — or, in a lesson
 * already under way, the way back to where the reader stopped. A lesson's tools (a calculator) open straight from here,
 * and so does its video, if it has one: as a whole, or at the part of any concept.
 */
export function LessonOpening({
  module: m,
  progress: p,
  onStart,
  onRestart,
  onTool,
  onVideo,
}: {
  module: StudyModule;
  progress: TopicProgress;
  onStart: () => void;
  onRestart: () => void;
  onTool: (screen: string) => void;
  /** Opens a part of the lesson's video at a second. */
  onVideo?: (part: number, at: number) => void;
}) {
  const videos = onVideo ? m.videos : undefined;
  const items = practiceOf(m);
  const groups = PRACTICE_GROUPS.map((g) => ({ ...g, n: items.filter((it) => it.group === g).length })).filter((g) => g.n > 0);
  const started = statusOf(m, p) !== "new";
  const xp = xpOf(m, p);
  const max = maxXp(m);
  const minutes = Math.round((videos ?? []).reduce((t, v) => t + v.duration, 0) / 60);
  return (
    <div className="space-y-6">
      <StageHero
        badge={
          <motion.span
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            className="num grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-cyan-500 text-[28px] font-bold text-white shadow-[0_14px_30px_-14px_var(--accent)]"
            aria-hidden
          >
            {m.n}
          </motion.span>
        }
      >
        <p className="text-[17px] leading-relaxed text-fg/90 sm:text-[18px]">{m.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Fact icon={<BookOpenText className="h-3.5 w-3.5 text-accent" aria-hidden />}>{m.screens.length} מושגים</Fact>
          <Fact icon={<ClipboardPen className="h-3.5 w-3.5 text-accent" aria-hidden />}>{items.length} שאלות תרגול</Fact>
          {minutes > 0 && <Fact icon={<Play className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />}>{minutes} דק׳ וידאו</Fact>}
          <Fact icon={<Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" aria-hidden />}>עד {max} XP</Fact>
        </div>

        {started && (
          <div className="mt-5 max-w-md space-y-1.5">
            <p className="num text-[13px] text-muted">
              כבר התחלתם: {xp} מתוך {max} XP
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="ההתקדמות בשיעור" aria-valuemin={0} aria-valuemax={max} aria-valuenow={xp}>
              <div className="h-full rounded-full bg-gradient-to-l from-accent to-cyan-400" style={{ width: `${(xp / max) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" onClick={onStart}>
            {started ? "להמשיך מאיפה שעצרתי" : "להתחיל את השיעור"} <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
          {started && (
            <Button size="lg" variant="secondary" onClick={onRestart}>
              <RotateCcw className="h-4 w-4" aria-hidden /> להתחיל מההתחלה
            </Button>
          )}
          {m.tools?.map((t) => (
            <Button key={t.screen} size="lg" variant="secondary" onClick={() => onTool(t.screen)}>
              <Calculator className="h-4 w-4" aria-hidden /> ישר ל{t.label}
            </Button>
          ))}
        </div>
      </StageHero>

      <section aria-labelledby="opening-goal" className="rounded-2xl bg-accent-soft/60 p-5 ring-1 ring-accent/20 sm:p-6">
        <StageLabel id="opening-goal" icon={<Target className="h-4 w-4 text-accent" aria-hidden />}>
          מטרת השיעור
        </StageLabel>
        <p className="text-[16.5px] font-semibold leading-relaxed text-fg">{m.goal}</p>
        <p className="mt-4 mb-2 text-[13.5px] font-bold text-muted">בסוף השיעור תדעו:</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {m.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2 text-[15px] leading-relaxed text-fg/90">
              <CircleCheck className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
              {o}
            </li>
          ))}
        </ul>
      </section>

      {videos?.map((v, i) => (
        <section
          key={v.src}
          aria-labelledby={`opening-video-${i}`}
          className="group flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-l from-[#1b2541] to-[#141c33] p-4 text-[#fdf6e7] ring-1 ring-white/5 sm:p-5"
        >
          <button
            type="button"
            onClick={() => onVideo!(i, 0)}
            aria-label={`צפייה בסרטון: ${v.title}`}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#ffc93c] text-[#1b2541] shadow-[0_10px_28px_-10px_#ffc93c] transition hover:scale-105 active:scale-95"
          >
            <Play className="h-6 w-6 translate-x-[-2px] fill-current" aria-hidden />
          </button>
          <div className="min-w-0 flex-[1_1_16rem] space-y-0.5">
            <p className="num text-[12.5px] font-semibold text-[#ffc93c]">
              סרטון השיעור{v.part && ` · ${v.part}`} · {clock(v.duration)} דק׳ · {v.chapters.length} פרקים
            </p>
            <p id={`opening-video-${i}`} className="text-[17px] font-bold leading-snug">
              {v.title}
            </p>
            {i === 0 && <p className="text-[13.5px] text-[#c9cfdf]">צפו קודם בסרטון ואז תרגלו במסכים — או דלגו ישר לשיעור. אפשר לחזור לכל קטע בו מכל מסך.</p>}
          </div>
        </section>
      ))}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="opening-learn">
          <StageLabel id="opening-learn" icon={<BookOpenText className="h-4 w-4" aria-hidden />}>
            מה נלמד
          </StageLabel>
          <ol className="relative space-y-1 before:absolute before:inset-y-3 before:start-[13px] before:w-px before:bg-line-strong">
            {m.screens.map((s, i) => {
              const seen = p.seen.includes(i);
              const clip = videoAt(videos, s.id);
              return (
                <li key={s.id} className="relative flex items-center gap-3 rounded-xl px-0 py-1.5 text-[15px] text-fg">
                  <span
                    className={cn(
                      "num relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold",
                      seen ? "bg-success text-canvas" : "bg-canvas text-muted ring-1 ring-line-strong",
                    )}
                  >
                    {seen ? <CircleCheck className="h-4 w-4" aria-label="נקרא" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">{s.title}</span>
                  {clip && (
                    <button
                      type="button"
                      onClick={() => onVideo!(clip.part, clip.at)}
                      aria-label={`${s.title} בסרטון${videos!.length > 1 ? `, ${videos![clip.part].part ?? ""}` : ""}, מ-${clock(clip.at)}`}
                      className="num inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[12px] font-bold text-amber-700 ring-1 ring-amber-400/30 transition hover:bg-amber-400/30 dark:text-amber-300"
                    >
                      <Play className="h-3 w-3 fill-current" aria-hidden /> {videos!.length > 1 && `${videos![clip.part].part} · `}
                      {clock(clip.at)}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="opening-practice">
          <StageLabel id="opening-practice" icon={<ClipboardPen className="h-4 w-4" aria-hidden />}>
            ואחר כך מתרגלים
          </StageLabel>
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="num flex items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3 text-[15px] text-fg ring-1 ring-line">
                {g.label} <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12.5px] font-semibold text-accent">{g.n} שאלות</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13.5px] text-muted">בסוף — סיכום וטיפים זהב למבחן.</p>
        </section>
      </div>
    </div>
  );
}
