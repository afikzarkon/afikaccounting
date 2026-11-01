"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** XP as a ring filling up, the number in its middle: the lesson's on its summary, the course's on its page. */
export function XpRing({ xp, max, className }: { xp: number; max: number; className?: string }) {
  const id = useId();
  const r = 42;
  const c = 2 * Math.PI * r;
  const share = max ? Math.min(1, xp / max) : 0;
  return (
    <div className={cn("relative grid h-28 w-28 shrink-0 place-items-center", className)} role="img" aria-label={`${xp} מתוך ${max} XP`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-surface-2" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke={`url(#${id})`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - share) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center leading-none">
        <p className="num text-[26px] font-bold text-fg">{xp}</p>
        <p className="num mt-1 text-[11.5px] text-muted">מתוך {max} XP</p>
      </div>
    </div>
  );
}
