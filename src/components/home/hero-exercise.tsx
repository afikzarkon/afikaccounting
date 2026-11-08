"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TrapQuiz } from "@/components/study-mode/trap-quiz";
import { track } from "@/lib/analytics/track";
import type { Trap } from "@/lib/study/types";

/**
 * One live question from a course, in the lesson's own card: the same quiz,
 * the same instant feedback and the same "why it tempts" — so the home page
 * shows exactly what the course feels like. Nothing is stored; the answer is counted.
 */
export function HeroExercise({ trap, source, href, more }: { trap: Trap; source: string; href: string; more: string }) {
  const [answered, setAnswered] = useState<{ choice: number; correct: boolean }>();
  // A fresh quiz for each try.
  const [round, setRound] = useState(0);
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <p className="text-[17px] font-semibold text-fg">{source}</p>
      </div>
      <div className="p-4 sm:p-5">
        <TrapQuiz key={round} trap={trap} answered={answered} onAnswer={(choice) => {
            const correct = choice === trap.answer;
            setAnswered({ choice, correct });
            track({ kind: "exercise_answer", target: "home-hero", ok: correct, meta: { id: trap.id, trap: true, round } });
          }} />
        {answered && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              {more} <ArrowLeft className="h-4 w-4" aria-hidden />
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
