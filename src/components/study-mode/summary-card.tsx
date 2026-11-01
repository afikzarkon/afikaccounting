"use client";

import { ArrowLeft, BookOpen, BookOpenText, ClipboardPen, Flame, Repeat, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { maxXp, missedOf, scoreOf, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { XpRing } from "./ring";
import { StageHero, StageLabel } from "./stage";

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
  next?: { href: string; label: string };
  onRestart: () => void;
  onRetry: () => void;
}) {
  const score = scoreOf(m, p);
  const missed = missedOf(m, p).length;
  const xp = xpOf(m, p);
  const max = maxXp(m);
  return (
    <div className="space-y-6">
      <StageHero badge={<XpRing xp={xp} max={max} />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile icon={<BookOpenText className="h-4 w-4" aria-hidden />} label="מושגים" ok={score.learn.ok} total={score.learn.total} />
          <Tile icon={<ClipboardPen className="h-4 w-4" aria-hidden />} label="תרגול" ok={score.practice.ok} total={score.practice.total} />
          <div className="rounded-2xl bg-surface-2 p-3.5 ring-1 ring-line">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
              <Flame className="h-4 w-4 text-[#f97316]" aria-hidden /> הרצף הטוב ביותר
            </p>
            <p className="num mt-1 text-[24px] font-bold text-fg">{p.best}</p>
          </div>
        </div>

        {missed > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 ring-1 ring-accent/25">
            <p className="num min-w-0 flex-1 text-[14.5px] text-fg">
              <strong>{missed} שאלות</strong> עוד לא נפתרו — לא עניתם עליהן, או שהתשובה לא הייתה נכונה. מה שטעיתם בו נכנס ל
              <Link href="/review" className="font-semibold text-accent hover:underline">
                חזרה שלכם
              </Link>
              , ויחזור מחר.
            </p>
            <Button onClick={onRetry}>
              <Repeat className="h-4 w-4" aria-hidden /> לתרגל אותן שוב
            </Button>
          </div>
        )}
      </StageHero>

      <section aria-labelledby="golden-tips">
        <StageLabel id="golden-tips" icon={<Sparkles className="h-4 w-4 text-[#eda100]" aria-hidden />}>
          טיפים זהב למבחן
        </StageLabel>
        <ol className="grid gap-3 lg:grid-cols-2">
          {m.tips.map((t, i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-surface p-4 text-[15px] leading-relaxed text-fg/90 ring-1 ring-line">
              <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eda100]/15 text-[13px] font-bold text-amber-700 dark:text-[#f5c04a]">{i + 1}</span>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={m.backHref} variant="secondary">
          <BookOpen className="h-4 w-4" aria-hidden /> לכל השיעורים
        </ButtonLink>
        <Button variant="secondary" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" aria-hidden /> התחלה מחדש
        </Button>
        {next && (
          <ButtonLink href={next.href} size="lg" className="sm:ms-auto">
            {next.label} <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

function Tile({ icon, label, ok, total }: { icon: ReactNode; label: string; ok: number; total: number }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3.5 ring-1 ring-line">
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
        {icon} {label}
      </p>
      <p className="num mt-1 text-[24px] font-bold text-fg">
        {ok}
        <span className="text-[15px] font-medium text-muted">/{total}</span>
      </p>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line">
        <motion.span
          className={cn("block h-full rounded-full", ok === total ? "bg-success" : "bg-accent")}
          initial={{ width: 0 }}
          animate={{ width: `${total ? (ok / total) * 100 : 0}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </span>
    </div>
  );
}
