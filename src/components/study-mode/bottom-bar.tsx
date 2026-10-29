"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEPS } from "@/lib/study/score";
import { cn } from "@/lib/utils";

/** "הקודם" and "הבא", and a dot per step that jumps to it. Right to left: previous sits on the right. */
export function BottomBar({ step, first, last, onPrev, onNext, onJump }: { step: number; first: boolean; last: boolean; onPrev: () => void; onNext: () => void; onJump: (i: number) => void }) {
  return (
    <nav aria-label="מעבר בין שלבים" className="glass shrink-0 border-x-0 border-b-0">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
        <Button variant="secondary" onClick={onPrev} disabled={first} className="w-24 sm:w-28">
          <ChevronRight className="h-4 w-4" aria-hidden /> הקודם
        </Button>
        <ol className="flex flex-1 items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-label={`שלב ${i + 1}: ${s.label}`}
                aria-current={i === step ? "step" : undefined}
                className="grid h-6 place-items-center px-0.5"
              >
                <span className={cn("block h-2.5 rounded-full transition-all duration-300", i === step ? "w-7 bg-accent" : i < step ? "w-2.5 bg-accent/50" : "w-2.5 bg-line-strong")} />
              </button>
            </li>
          ))}
        </ol>
        <Button onClick={onNext} disabled={last} className="w-24 sm:w-28">
          הבא <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
