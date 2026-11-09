"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { LEVEL_LABEL, worksheet, type WorksheetLevel } from "@/lib/learn/worksheet-gen";
import { cn } from "@/lib/utils";
import { WorksheetGame } from "./worksheet-game";

/** Worksheets without end: pick a level, and a fresh company is drawn each time, solved in the course's worksheet game. */
export function WorksheetLevels() {
  const [level, setLevel] = useState<WorksheetLevel>(1);
  const [seed, setSeed] = useState(1);
  const c = worksheet(level, seed);
  const chip = (on: boolean) => cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", on ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2");
  return (
    <div className="space-y-3">
      <div className="card space-y-2.5 p-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="רמה">
          {([1, 2, 3, 4, 5] as const).map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className={chip(level === l)}>
              רמה {l}
            </button>
          ))}
        </div>
        <p className="text-[14px] text-muted">
          <strong className="text-fg">רמה {level}:</strong> {LEVEL_LABEL[level]}. {c.items.length} נתונים לפקודות.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-[15px] font-semibold text-fg">
            {c.name} · מאזן בוחן ראשוני ליום {c.date}
          </p>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent">
            <RotateCcw className="h-4 w-4" aria-hidden /> גיליון חדש
          </button>
        </div>
      </div>
      <WorksheetGame key={`${level}-${seed}`} c={c} />
    </div>
  );
}
