"use client";

import { ArrowLeft, CircleCheck, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PRACTICE_GROUPS, practiceOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";

/** The line between learning and practice: the concepts are behind, the questions ahead, by kind. */
export function PracticeIntro({ module: m, onStart }: { module: StudyModule; onStart: () => void }) {
  const items = practiceOf(m);
  const groups = PRACTICE_GROUPS.map((g) => ({ ...g, n: items.filter((it) => it.group === g).length })).filter((g) => g.n > 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 py-4 shadow-[0_10px_30px_-18px_var(--accent)]">
        <motion.span initial={{ rotate: -20, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-fg">
          <GraduationCap className="h-6 w-6" aria-hidden />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-bold text-fg">החלק הלימודי הסתיים!</p>
          <p className="text-[14.5px] text-muted">עכשיו מתרגלים את החומר — כאן רואים מה באמת נקלט.</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-muted">מה למדנו בשיעור</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {m.screens.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[14.5px] text-fg">
              <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-hidden /> {s.title}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-muted">התרגול, לפי סוג השאלה</p>
        <ol className="num flex flex-wrap gap-2">
          {groups.map((g, i) => (
            <li key={g.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[14.5px] text-fg">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">{i + 1}</span>
              {g.label} <span className="text-muted">· {g.n}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">משוב מיידי על כל תשובה, וכל תשובה נכונה מזכה ב-XP. טעיתם? מוצג הפתרון וההסבר.</p>
      </div>

      <Button size="lg" onClick={onStart}>
        להתחיל לתרגל <ArrowLeft className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
