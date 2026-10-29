"use client";

import { ArrowLeft, BookOpen, Flame, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Button, ButtonLink } from "@/components/ui/button";
import { maxXp, scoreOf, statusOf, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

/** The last step: the score by step, XP and the best streak, the golden tips, and where to go next. */
export function SummaryCard({ module: m, progress: p, next, onRestart }: { module: StudyModule; progress: TopicProgress; next?: { href: string; label: string }; onRestart: () => void }) {
  const score = scoreOf(m, p);
  const done = statusOf(m, p) === "done";
  const open = m.exercises.filter((ex) => !p.exercises[ex.id]?.done).length + m.traps.filter((t) => !p.traps[t.id]).length;
  const rows: [string, number, number][] = [
    ["מושגים", score.learn.ok, score.learn.total],
    ["תרגול", score.practice.ok, score.practice.total],
    ["מלכודות מבחן", score.traps.ok, score.traps.total],
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 py-4 shadow-[0_10px_30px_-18px_var(--accent)]">
        <motion.span initial={{ rotate: -20, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-fg">
          <Trophy className="h-6 w-6" aria-hidden />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-bold text-fg">{done ? "סיימתם את השיעור!" : "סיכום השיעור"}</p>
          {!done && (
            <p className="num text-[13px] text-muted">
              נשארו {open} שאלות בלי מענה — אפשר לחזור אליהן בנקודות שלמטה.
            </p>
          )}
          <p className="num flex flex-wrap items-center gap-x-3 text-[13.5px] text-muted">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" aria-hidden /> {xpOf(m, p)} מתוך {maxXp(m)} XP
            </span>
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-[#f97316]" aria-hidden /> הרצף הטוב ביותר: {p.best}
            </span>
          </p>
        </div>
      </div>

      <ul className="space-y-2.5 rounded-2xl border border-line bg-surface p-4">
        {rows.map(([label, ok, total]) => (
          <li key={label} className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-3 text-[14px]">
            <span className="font-medium text-fg">{label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.span
                className={cn("block h-full rounded-full", ok === total ? "bg-success" : "bg-accent")}
                initial={{ width: 0 }}
                animate={{ width: `${(ok / total) * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </span>
            <span className="num text-muted">
              {ok}/{total}
            </span>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-[#eda100]/40 bg-[#eda100]/8 p-4" aria-labelledby="golden-tips">
        <p id="golden-tips" className="flex items-center gap-2 text-[15px] font-bold text-fg">
          <Sparkles className="h-4.5 w-4.5 text-[#eda100]" aria-hidden /> טיפים זהב למבחן
        </p>
        <ul className="mt-2 space-y-1.5">
          {m.tips.map((t) => (
            <li key={t} className="flex gap-2 text-[14.5px] leading-relaxed text-fg/90">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#eda100]" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={m.backHref} variant="secondary">
          <BookOpen className="h-4 w-4" aria-hidden /> לכל השיעורים
        </ButtonLink>
        <Button variant="secondary" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" aria-hidden /> התחלה מחדש
        </Button>
        {next && (
          <ButtonLink href={next.href} className="sm:ms-auto">
            {next.label} <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
