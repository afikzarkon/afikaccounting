import type { Topic } from "@/lib/catalog";
import { STUDY_MODULES } from "@/lib/study";
import { studyHref } from "./href";

/** A course's first lesson, the one that's free in every course: its address, or the course page when it has no lessons. */
export function firstLessonHref(t: Pick<Topic, "href">): string {
  const first = Object.values(STUDY_MODULES)
    .filter((m) => m.backHref === t.href)
    .sort((a, b) => a.n - b.n)[0];
  return first ? studyHref(first.slug) : t.href;
}
