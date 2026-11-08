"use client";

import { useTopic } from "@/components/study-mode/progress-store";
import type { StudyModule } from "@/lib/study/types";

/**
 * On a locked lesson's paywall: how the reader did in the free lesson of the same
 * course, from this browser's progress — the win they bring to the decision.
 * Nothing until they have answered something there.
 */
export function TasteScore({ slug, n, total }: { slug: string; n: StudyModule["n"]; total: number }) {
  const p = useTopic(slug);
  const answered = Object.values(p.exercises).filter((r) => r.done).length + Object.keys(p.traps).length;
  if (!answered) return null;
  const right = Object.values(p.exercises).filter((r) => r.ok).length + Object.values(p.traps).filter((t) => t.correct).length;
  return (
    <p className="num mt-3 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[14.5px] text-fg ring-1 ring-accent/25">
      בשיעור {n}, החינמי, עניתם נכון על <strong>{right}</strong> מתוך {total} שאלות. השיעור הזה בנוי באותה דרך, צעד אחד הלאה.
    </p>
  );
}
