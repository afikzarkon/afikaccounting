"use client";

import { JournalSimulator } from "@/components/study-mode/journal-simulator";
import type { Line } from "@/lib/learn/basics";
import type { JournalExercise } from "@/lib/study/types";
import { updateProgress, useProgress } from "./store";

export type JournalCheckItem = { text: string; lines: Line[]; why: string; accounts: string[] };

/**
 * "Check yourself" as journal entries: each transaction built on the board, as
 * in the lesson's practice — two tries, then the answer. Saved like the
 * multiple-choice checks, under `prefix:chapter:j<n>`.
 */
export function JournalCheck({ chapter, items, prefix = "basics" }: { chapter: string; items: JournalCheckItem[]; prefix?: string }) {
  const progress = useProgress();
  return (
    <ol className="space-y-8">
      {items.map((it, i) => {
        const key = `${prefix}:${chapter}:j${i + 1}`;
        const saved = progress.answers[key];
        const tries = Number(saved?.value ?? 0);
        const result = saved && { tries, ok: saved.correct, done: saved.correct || tries >= 2 };
        const ex: JournalExercise = { kind: "journal", id: key, skill: "", entry: { id: String(i + 1), text: it.text, lines: it.lines, why: it.why }, accounts: it.accounts };
        return (
          <li key={key} className="space-y-2">
            {items.length > 1 && (
              <p className="num text-[13px] font-bold text-muted">
                פקודה {i + 1} מתוך {items.length}
              </p>
            )}
            <JournalSimulator
              ex={ex}
              result={result}
              noXp
              onCheck={(ok) =>
                updateProgress((p) => {
                  const prev = p.answers[key];
                  const n = Number(prev?.value ?? 0);
                  if (prev && (prev.correct || n >= 2)) return p;
                  return { ...p, answers: { ...p.answers, [key]: { value: String(n + 1), correct: ok } } };
                })
              }
            />
          </li>
        );
      })}
    </ol>
  );
}
