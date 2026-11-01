import { type PracticeItem, practiceId, practiceOf, type TopicProgress } from "./score";
import type { StudyModule } from "./types";

/**
 * Spaced review of the questions a reader got wrong. A weak answer — wrong, or
 * right only on the second try, or a trap fallen into — puts its question in
 * box 0, due the next day. In review, a right first answer moves it up a box
 * and further out (3, then 7 days); a wrong one sends it back to box 0, due the
 * next day. Three right in a row and it is mastered: it leaves the review for good. Pure: the
 * day is always passed in, so it is tested.
 */
export type ReviewEntry = { box: number; due: number };

/** Days until the next review: after a wrong answer, and after reaching box 1 and 2 of the climb; reaching MASTERED ends it. */
const AFTER_WRONG = 1;
const INTERVALS = [3, 7];
export const MASTERED = 3;
const DAY = 86_400_000;

/** A calendar day in the reader's own time zone, as a whole number, so "due today" turns over at their midnight. */
export const dayOf = (ms: number) => Math.floor((ms - new Date(ms).getTimezoneOffset() * 60_000) / DAY);
export const today = () => dayOf(Date.now());

/** Whether a lesson's answer to a question was weak: a wrong exercise, one right only on the second try, or a trap fallen into. */
export function isWeak(p: TopicProgress, it: PracticeItem) {
  if (it.kind === "exercise") {
    const r = p.exercises[it.ex.id];
    return !!r?.done && (!r.ok || r.tries > 1);
  }
  const t = p.traps[it.trap.id];
  return !!t && !t.correct;
}

/** Put a question up for review from tomorrow — unless it is already on the schedule or mastered. */
export function scheduleWeak(p: TopicProgress, id: string, day: number): TopicProgress {
  if (p.review?.[id]) return p;
  return { ...p, review: { ...p.review, [id]: { box: 0, due: day + AFTER_WRONG } } };
}

/** A review answer: right moves the question up a box (or masters it), wrong starts it over. */
export function answerReview(p: TopicProgress, id: string, right: boolean, day: number): TopicProgress {
  const box = right ? Math.min((p.review?.[id]?.box ?? 0) + 1, MASTERED) : 0;
  const due = box >= MASTERED ? 0 : day + (right ? INTERVALS[box - 1] : AFTER_WRONG);
  return { ...p, review: { ...p.review, [id]: { box, due } } };
}

export type ReviewItem = { slug: string; item: PracticeItem; id: string; box: number; due: number };

/**
 * A lesson's questions in review: the ones on the schedule and not mastered,
 * and any weak answer from before the schedule existed (due today). Soonest due first.
 */
export function reviewItems(m: StudyModule, p: TopicProgress, day: number): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const item of practiceOf(m)) {
    const id = practiceId(item);
    const entry = p.review?.[id];
    if (entry) {
      if (entry.box < MASTERED) out.push({ slug: m.slug, item, id, box: entry.box, due: entry.due });
    } else if (isWeak(p, item)) out.push({ slug: m.slug, item, id, box: 0, due: day });
  }
  return out.sort((a, b) => a.due - b.due);
}

/** Of two devices' schedules for a question, the one further up the climb; at the same box, the later due day (the more recent answer). */
export function mergeReview(a: Record<string, ReviewEntry> = {}, b: Record<string, ReviewEntry> = {}): Record<string, ReviewEntry> {
  const out = { ...b };
  for (const [id, x] of Object.entries(a)) {
    const y = out[id];
    out[id] = !y || x.box > y.box || (x.box === y.box && x.due > y.due) ? x : y;
  }
  return out;
}

/** A lesson's answer just recorded: if it was weak, the question goes up for review. */
export const afterAnswer = (p: TopicProgress, item: PracticeItem, day: number) => (isWeak(p, item) ? scheduleWeak(p, practiceId(item), day) : p);

/** What a question is about, for grouping the review: its skill, or — for a trap, which has none — the lesson it comes from. */
export const topicOf = (m: Pick<StudyModule, "title">, it: PracticeItem) => (it.kind === "exercise" ? it.ex.skill : m.title);

/** "שאלה אחת", or "n שאלות". */
export const questions = (n: number) => (n === 1 ? "שאלה אחת" : `${n} שאלות`);
