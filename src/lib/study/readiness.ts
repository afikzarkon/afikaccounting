import { MASTERED } from "./review";
import { EMPTY_TOPIC, statusOf, type TopicProgress } from "./score";
import type { StudyModule } from "./types";

/**
 * How ready a reader is for a course's exam, 0–100, from evidence only: lessons
 * finished, answers right on the first try, and mistakes kept up in review. It
 * rises with finished lessons and falls when reviews pile up, so it can't be
 * "finished" and forgotten. A gauge to steer by — never a grade or a pass promise.
 *
 * readiness = 100 × coverage × (0.5 + 0.3 × accuracy + 0.2 × retention)
 * Coverage multiplies the rest, so a perfect first answer in lesson 1 is not "ready".
 * Pure, and it reads only ids and counts, so it works on lesson outlines and on
 * whatever lessons a course holds now (course contents still change).
 */
export type Readiness = {
  score: number;
  coverage: number;
  accuracy: number;
  retention: number;
  /** Review questions due today or overdue in this course. */
  due: number;
  /** The step that raises the score most: the due reviews, else the next lesson not done. */
  next?: { kind: "review"; count: number } | { kind: "lesson"; slug: string; n: number; title: string; gain: number };
};

const W = { base: 0.5, accuracy: 0.3, retention: 0.2 };
const blend = (coverage: number, accuracy: number, retention: number) => coverage * (W.base + W.accuracy * accuracy + W.retention * retention);

export function readinessOf(lessons: StudyModule[], topics: Record<string, TopicProgress | undefined>, day: number): Readiness {
  const rows = lessons.map((m) => ({ m, p: { ...EMPTY_TOPIC, ...topics[m.slug] } }));
  if (!rows.length) return { score: 0, coverage: 0, accuracy: 0, retention: 1, due: 0 };
  const done = rows.filter(({ m, p }) => statusOf(m, p) === "done").length;
  let answered = 0;
  let firstTry = 0;
  let scheduled = 0;
  let due = 0;
  for (const { m, p } of rows) {
    for (const ex of m.exercises) {
      const r = p.exercises[ex.id];
      if (!r?.done) continue;
      answered++;
      if (r.ok && r.tries === 1) firstTry++;
    }
    for (const t of m.traps) {
      const r = p.traps[t.id];
      if (!r) continue;
      answered++;
      if (r.correct) firstTry++;
    }
    for (const e of Object.values(p.review ?? {})) {
      scheduled++;
      if (e.box < MASTERED && e.due <= day) due++;
    }
  }
  const coverage = done / rows.length;
  const accuracy = answered ? firstTry / answered : 0;
  const retention = scheduled ? 1 - due / scheduled : 1;
  const score = Math.round(100 * blend(coverage, accuracy, retention));
  const lesson = rows.find(({ m, p }) => statusOf(m, p) !== "done");
  const next: Readiness["next"] = due
    ? { kind: "review", count: due }
    : lesson
      ? {
          kind: "lesson",
          slug: lesson.m.slug,
          n: lesson.m.n,
          title: lesson.m.title,
          // At the reader's own accuracy so far (or a middling one before any answer).
          gain: Math.max(1, Math.round(100 * blend(1 / rows.length, answered ? accuracy : 0.6, retention))),
        }
      : undefined;
  return { score, coverage, accuracy, retention, due, next };
}
