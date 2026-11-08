import type { Line } from "@/lib/learn/basics";
import type { JournalExercise, StudyModule, Trap } from "./types";

/**
 * Exam mode: a course's questions without hints and without feedback until the
 * end, like the real thing. Two kinds, both built from what the lessons already
 * hold, so nothing here is new content that could be wrong:
 *  - the lessons' traps (their options shuffled);
 *  - "find the error": a lesson's journal entry with one account swapped for one
 *    of that exercise's own distractors (accounts the lesson marks as wrong) — so
 *    exactly one line is wrong, and we know which and why.
 * Pure and seeded, so it is tested and the same seed gives the same exam.
 */
export type ExamItem =
  | { kind: "trap"; key: string; slug: string; lesson: string; trap: Trap; order: number[] }
  | { kind: "error"; key: string; slug: string; lesson: string; text: string; lines: Line[]; wrong: number; right: string; why?: string };

/** A small seeded random generator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffled = <T,>(xs: T[], rand: () => number) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A journal exercise as "find the error", or null when it has no distractor to swap in. */
export function errorItem(ex: JournalExercise, m: Pick<StudyModule, "slug" | "title">, rand: () => number): Extract<ExamItem, { kind: "error" }> | null {
  const used = new Set(ex.entry.lines.map((l) => l.account));
  const distractors = ex.accounts.filter((a) => !used.has(a));
  if (!distractors.length || ex.entry.lines.length < 2) return null;
  const wrong = Math.floor(rand() * ex.entry.lines.length);
  const bad = distractors[Math.floor(rand() * distractors.length)];
  const lines = ex.entry.lines.map((l, i) => (i === wrong ? { ...l, account: bad } : { ...l }));
  return { kind: "error", key: `${m.slug}:${ex.id}:error`, slug: m.slug, lesson: m.title, text: ex.entry.text, lines, wrong, right: ex.entry.lines[wrong].account, why: ex.entry.why };
}

export const EXAM_SIZE = 10;

/** An exam from these lessons: up to `size` questions, traps and "find the error" mixed, in a seeded order. */
export function buildExam(lessons: StudyModule[], seed: number, size = EXAM_SIZE): ExamItem[] {
  const rand = rng(seed);
  const traps: ExamItem[] = lessons.flatMap((m) =>
    m.traps.map((t) => ({ kind: "trap" as const, key: `${m.slug}:${t.id}`, slug: m.slug, lesson: m.title, trap: t, order: shuffled(t.options.map((_, i) => i), rand) })),
  );
  const errors: ExamItem[] = lessons.flatMap((m) => m.exercises.flatMap((ex) => (ex.kind === "journal" ? [errorItem(ex, m, rand)].filter((x) => x !== null) : [])));
  const a = shuffled(traps, rand);
  const b = shuffled(errors, rand);
  // About a third "find the error" when there are enough, the rest traps.
  const wantErrors = Math.min(b.length, Math.max(0, Math.round(size / 3)), size);
  const picked = [...b.slice(0, wantErrors), ...a.slice(0, size - wantErrors)];
  if (picked.length < size) picked.push(...b.slice(wantErrors, wantErrors + size - picked.length));
  return shuffled(picked, rand);
}

/** Whether an answer is right: for a trap, the option index chosen (in the trap's own numbering); for "find the error", the line chosen. */
export const isRight = (it: ExamItem, answer: number | undefined) => answer !== undefined && (it.kind === "trap" ? answer === it.trap.answer : answer === it.wrong);
