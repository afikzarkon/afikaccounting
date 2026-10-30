"use client";

import { Flame, Star, Volume2, VolumeX, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { STEPS } from "@/lib/study/score";
import { cn } from "@/lib/utils";
import { toggleSound, useSound } from "./progress-store";

/** The lesson's top bar: exit, the topic, the step, the streak and XP, and a progress bar across every screen of the lesson. */
export function StudyHeader({ course, title, backHref, step, at, total, streak, xp }: { course: string; title: string; backHref: string; step: number; at: number; total: number; streak: number; xp: number }) {
  const sound = useSound();
  return (
    <header className="glass shrink-0 border-x-0 border-t-0">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3 2xl:max-w-7xl">
        <Link href={backHref} aria-label="יציאה מהשיעור" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
          <X className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-fg sm:text-[15px]">
            <span className="max-sm:hidden">{course} · </span>
            {title}
          </p>
          <p className="num text-[11.5px] text-muted">
            שלב {step + 1} מתוך {STEPS.length} · {STEPS[step].label}
          </p>
        </div>
        <Stat icon={<Flame className={cn("h-4 w-4", streak > 0 ? "text-[#f97316]" : "text-subtle")} aria-hidden />} value={streak} label="תשובות נכונות ברצף" />
        <Stat icon={<Star className="h-4 w-4 fill-[#eda100] text-[#eda100]" aria-hidden />} value={xp} label="נקודות XP" />
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? "השתקת צלילים" : "הפעלת צלילים"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
        >
          {sound ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
        </button>
      </div>
      <div className="h-1.5 bg-surface-2" role="progressbar" aria-label="התקדמות בשיעור" aria-valuemin={0} aria-valuemax={total} aria-valuenow={at}>
        <motion.div className="h-full rounded-e-full bg-accent" initial={false} animate={{ width: `${(at / total) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
    </header>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2 py-1" title={label}>
      {icon}
      {/* Keyed by value, so every change pops. */}
      <motion.span key={value} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="num text-[13px] font-bold text-fg">
        {value}
      </motion.span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
