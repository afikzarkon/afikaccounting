"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Progress as a ring filling up, the percent in its middle: the lesson's on its summary, the course's on its page. */
export function ProgressRing({ done, total, className }: { done: number; total: number; className?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const share = total ? Math.min(1, done / total) : 0;
  const percent = Math.round(share * 100);
  return (
    <div className={cn("relative grid h-28 w-28 shrink-0 place-items-center", className)} role="img" aria-label={`${percent}% הושלמו`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-surface-2" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke="var(--accent)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - share) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center leading-none">
        <p className="num text-[26px] font-bold text-fg">{percent}%</p>
        <p className="mt-1 text-[11.5px] text-muted">הושלמו</p>
      </div>
    </div>
  );
}
