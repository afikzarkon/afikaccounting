"use client";

import { ArrowLeft, CircleCheck, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PRACTICE_GROUPS, practiceOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { StageHero, StageLabel } from "./stage";

/** The line between learning and practice: the concepts are behind, the questions ahead, by kind. */
export function PracticeIntro({ module: m, onStart }: { module: StudyModule; onStart: () => void }) {
  const items = practiceOf(m);
  const groups = PRACTICE_GROUPS.map((g) => ({ ...g, n: items.filter((it) => it.group === g).length })).filter((g) => g.n > 0);
  return (
    <div className="space-y-6">
      <StageHero
        badge={
          <motion.span
            initial={{ rotate: -20, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg"
          >
            <GraduationCap className="h-8 w-8" aria-hidden />
          </motion.span>
        }
      >
        <p className="text-[19px] font-bold text-fg">החלק הלימודי הסתיים!</p>
        <p className="mt-1 text-[16px] leading-relaxed text-fg/80">
          עכשיו מתרגלים — <span className="num">{items.length}</span> שאלות, ומשוב מיידי על כל אחת. טעיתם? מוצגים הפתרון וההסבר, וכל תשובה נכונה מזכה ב-XP.
        </p>
        <ol className="num mt-4 flex flex-wrap gap-2">
          {groups.map((g, i) => (
            <li key={g.id} className="flex items-center gap-2 rounded-full bg-surface-2 py-1 ps-1 pe-3 text-[14px] text-fg ring-1 ring-line">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              {g.label} <span className="text-muted">· {g.n}</span>
            </li>
          ))}
        </ol>
        <Button size="lg" onClick={onStart} className="mt-6">
          להתחיל לתרגל <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
      </StageHero>

      <section aria-labelledby="practice-learned">
        <StageLabel id="practice-learned">מה למדנו בשיעור</StageLabel>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {m.screens.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5 text-[15px] text-fg">
              <CircleCheck className="h-4.5 w-4.5 shrink-0 text-success" aria-hidden /> {s.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
