"use client";

import { type Place, practiceId, practiceOf, type TopicProgress } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

type Cell = { place: Place; label: string; state: "todo" | "done" | "right" | "wrong"; current: boolean };

/**
 * The whole lesson as one strip above the screen: a mark for every concept,
 * every practice question and the summary, in three groups, each mark coloured
 * by how it went (read, right, wrong) and each a way straight there.
 */
export function LessonRail({
  module: m,
  progress: p,
  place,
  opening,
  onGo,
  className,
}: {
  module: StudyModule;
  progress: TopicProgress;
  place: Place;
  opening: boolean;
  onGo: (to: Place) => void;
  className?: string;
}) {
  const here = (step: number, sub: number) => !opening && place.step === step && place.sub === sub;
  const learn: Cell[] = m.screens.map((s, i) => ({ place: { step: 0, sub: i }, label: s.title, state: p.seen.includes(i) ? "done" : "todo", current: here(0, i) }));
  const practice: Cell[] = practiceOf(m).map((it, i) => {
    const id = practiceId(it);
    const ex = p.exercises[id];
    const trap = p.traps[id];
    const state = ex?.done ? (ex.ok ? "right" : "wrong") : trap ? (trap.correct ? "right" : "wrong") : "todo";
    return { place: { step: 1, sub: i + 1 }, label: `שאלה ${i + 1}`, state, current: here(1, i + 1) };
  });
  const summary: Cell[] = [{ place: { step: 2, sub: 0 }, label: "סיכום", state: "todo", current: here(2, 0) }];
  const groups = [
    { label: "מושגים", cells: learn, count: `${learn.filter((c) => c.state === "done").length}/${learn.length}` },
    { label: "תרגול", cells: practice, count: `${practice.filter((c) => c.state === "right").length}/${practice.length}` },
    { label: "סיכום", cells: summary },
  ];

  return (
    <nav aria-label="השיעור כולו" className={cn("flex items-end gap-3", className)}>
      {groups.map((g) => (
        <div key={g.label} className="min-w-0" style={{ flex: `${Math.max(g.cells.length, 2)} 1 0%` }}>
          <p className="mb-1.5 flex items-baseline gap-1.5 text-[11.5px] font-semibold text-muted">
            {g.label}
            {g.count && <span className="num font-medium text-subtle">{g.count}</span>}
          </p>
          <ol className="flex gap-1">
            {g.cells.map((c) => (
              <li key={`${c.place.step}-${c.place.sub}`} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onGo(c.place)}
                  title={c.label}
                  aria-label={c.label}
                  aria-current={c.current ? "step" : undefined}
                  className="group block w-full py-1.5"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all group-hover:scale-y-150",
                      c.current
                        ? "bg-accent shadow-[0_0_0_3px_var(--accent-soft)]"
                        : c.state === "done"
                          ? "bg-accent/45"
                          : c.state === "right"
                            ? "bg-success"
                            : c.state === "wrong"
                              ? "bg-danger"
                              : "bg-line-strong",
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </nav>
  );
}
