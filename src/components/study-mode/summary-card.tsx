"use client";

import { ArrowLeft, BookOpen, BookOpenText, ClipboardPen, CloudUpload, Flame, Lock, Repeat, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useSession } from "@/components/layout/session-store";
import { Button, ButtonLink } from "@/components/ui/button";
import { planOf, type Tier, tierAllows } from "@/lib/pricing";
import { MASTERED } from "@/lib/study/review";
import { maxXp, missedOf, scoreOf, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { XpRing } from "./ring";
import { StageHero, StageLabel } from "./stage";

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

        {offerSave && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-line">
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
          <ButtonLink href={next.href} size="lg" variant={nextLocked ? "secondary" : undefined} className="sm:ms-auto">
            {nextLocked && <Lock className="h-4 w-4" aria-hidden />} {next.label} <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        )}
      </div>
      {nextLocked && next?.tier && (
        <p className="text-[14px] text-muted sm:text-end">
          השיעור הבא הוא חלק מהקורס המלא, במסלול <strong className="text-fg">{planOf(next.tier).name}</strong>. מה שכבר פתוח לכם — השיעור הזה, החזרה והקורס הבסיסי — נשאר פתוח.
        </p>
      )}
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
