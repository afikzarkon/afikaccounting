import { TOPICS, type Topic } from "./catalog";
import { STUDY_MODULES } from "./study";
import type { StudyModule, Trap } from "./study/types";

/**
 * "Check your summary": five traps from one course, open to everyone, no account.
 * A student who learns from a free summary answers them with the summary open
 * and sees where they would lose points. One trap from each of the course's
 * first lessons that have one, in order, so the five cover the course's start
 * rather than one lesson — and the full course still holds every other question.
 */
export const CHECK_SIZE = 5;

/** `free`: the lesson is open to everyone, so a miss here comes back in the reader's review from tomorrow. */
export type CheckItem = { slug: string; n: number; lesson: string; trap: Trap; free: boolean };
export type Check = { topic: Pick<Topic, "id" | "title" | "standard" | "href">; items: CheckItem[]; first: { slug: string; n: number } };

const lessonsOf = (t: Topic): StudyModule[] =>
  Object.values(STUDY_MODULES)
    .filter((m) => m.backHref === t.href)
    .sort((a, b) => a.n - b.n);

/** The courses that have a check: every course of lessons with enough traps. */
export const CHECK_TOPICS = TOPICS.filter((t) => t.format === "lessons" && lessonsOf(t).filter((m) => m.traps.length).length >= CHECK_SIZE).map((t) => t.id);

export function checkFor(topicId: string): Check | undefined {
  const t = TOPICS.find((x) => x.id === topicId);
  if (!t || !CHECK_TOPICS.includes(t.id)) return undefined;
  const lessons = lessonsOf(t);
  const items = lessons
    .filter((m) => m.traps.length)
    .slice(0, CHECK_SIZE)
    .map((m) => ({ slug: m.slug, n: m.n, lesson: m.title, trap: m.traps[m.traps.length > 1 ? 1 : 0], free: t.tier === "free" || t.preview.includes(m.slug) }));
  // Where to go next: the course's free lesson when it has one (a paid course's taste), else its first.
  const firstFree = lessons.find((m) => t.tier === "free" || t.preview.includes(m.slug)) ?? lessons[0];
  return { topic: { id: t.id, title: t.title, standard: t.standard, href: t.href }, items, first: { slug: firstFree.slug, n: firstFree.n } };
}

/** How many right, and the misses in order. */
export function scoreCheck(items: CheckItem[], answers: Record<string, number>) {
  const right = items.filter((it) => answers[it.trap.id] === it.trap.answer).length;
  const missed = items.filter((it) => it.trap.id in answers && answers[it.trap.id] !== it.trap.answer);
  return { right, missed };
}
