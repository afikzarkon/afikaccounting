"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TrapQuiz } from "@/components/study-mode/trap-quiz";
import { FIRST_LESSON } from "@/lib/catalog";
import type { Trap } from "@/lib/study/types";

/**
 * One question from lesson 1, live, in the lesson's own card: the same quiz,
 * the same instant feedback and the same "why it tempts" — so the home page
 * shows exactly what the course feels like. Nothing is stored.
 */
export function HeroExercise({ trap }: { trap: Trap }) {
  const [answered, setAnswered] = useState<{ choice: number; correct: boolean }>();
  // A fresh quiz for each try.
  const [round, setRound] = useState(0);
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <p className="text-[17px] font-semibold text-fg">נסו שאלה משיעור 1. יש בה מלכודת.</p>
      </div>
      <div className="p-4 sm:p-5">
        <TrapQuiz key={round} trap={trap} answered={answered} onAnswer={(choice) => setAnswered({ choice, correct: choice === trap.answer })} />
        {answered && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={FIRST_LESSON} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              יש עוד כאלה בשיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <button type="button" onClick={() => {
                setAnswered(undefined);
                setRound((r) => r + 1);
              }} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> לנסות שוב
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
