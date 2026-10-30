import { type Entry, type Line, round2 } from "@/lib/learn/basics";
import type { Exercise, StudyModule, Trap } from "./types";

/**
 * The lesson's rules, kept apart from the screen: how answers are checked, how
 * XP and the streak are earned, and how "next" and "previous" move through the
 * steps and the screens inside them.
 */

export const STEPS = [
  { id: "learn", label: "מושגים" },
  { id: "practice", label: "תרגול" },
  { id: "summary", label: "סיכום" },
] as const;

/**
 * The practice, by the kind of question: journal entries (a whole entry, or
 * picking its debit and credit), multiple choice (with the questions that
 * explain why each wrong option tempts), then calculations.
 */
export const PRACTICE_GROUPS = [
  { id: "journal", label: "פקודות יומן" },
  { id: "choice", label: "שאלות אמריקאיות" },
  { id: "number", label: "שאלות חישוב" },
] as const;

export type PracticeGroup = (typeof PRACTICE_GROUPS)[number];

/** One question of the practice: an exercise, or a multiple-choice question that explains each wrong option. */
export type PracticeItem = { group: PracticeGroup } & ({ kind: "exercise"; ex: Exercise } | { kind: "trap"; trap: Trap });

const groupOf = (ex: Exercise) => PRACTICE_GROUPS.find((g) => g.id === (ex.kind === "entry" ? "journal" : ex.kind))!;

/** The lesson's practice in order: group by group, each in the lesson's own order. */
export function practiceOf(m: StudyModule): PracticeItem[] {
  const items: PracticeItem[] = [
    ...m.exercises.map((ex) => ({ kind: "exercise" as const, ex, group: groupOf(ex) })),
    ...m.traps.map((trap) => ({ kind: "trap" as const, trap, group: PRACTICE_GROUPS[1] })),
  ];
  return PRACTICE_GROUPS.flatMap((g) => items.filter((it) => it.group === g));
}

export const XP = { screen: 5, first: 10, second: 5, trap: 10 };

/** Tries before the solution is shown: one for a two-way choice (a second try can't miss), two for anything else. */
export const triesFor = (ex: Exercise) => (ex.kind === "choice" && ex.options.length <= 2 ? 1 : 2);

export type ExResult = { tries: number; ok: boolean; done: boolean };
export type TopicProgress = {
  step: number;
  /** The screen inside the step. */
  sub: number;
  /** Concept screens read (left forward), by index. */
  seen: number[];
  exercises: Record<string, ExResult>;
  traps: Record<string, { choice: number; correct: boolean }>;
  /** Right answers in a row, and the best run so far. */
  streak: number;
  best: number;
  /** Passed over on the course path, for now: opening the lesson takes it back. */
  skipped?: boolean;
  /** The practice questions being tried again, by id: "next" goes from one to the next, then to the summary. */
  retry?: string[];
};

export const EMPTY_TOPIC: TopicProgress = { step: 0, sub: 0, seen: [], exercises: {}, traps: {}, streak: 0, best: 0 };

/** Each account's net movement: debit positive, credit negative. */
const net = (lines: Line[]) => {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.account, round2((m.get(l.account) ?? 0) + (l.dr ?? 0) - (l.cr ?? 0)));
  return m;
};

/** The learner's lines against the answer: right when every account moves by the same amount on the same side. The wrong accounts are named. */
export function checkEntry(answer: Entry, lines: Line[]): { ok: boolean; wrong: string[] } {
  const want = net(answer.lines);
  const got = net(lines);
  const wrong = [...new Set([...want.keys(), ...got.keys()])].filter((a) => Math.abs((want.get(a) ?? 0) - (got.get(a) ?? 0)) > 0.005);
  return { ok: wrong.length === 0, wrong };
}

/** A typed amount: commas, spaces and ₪ are ignored. Not a number → NaN. */
export const parseAmount = (s: string) => (s.trim() ? Number(s.replace(/[,\s₪]/g, "")) : NaN);

/** A number answer is right within half a shekel, so a rounded answer counts. */
export const numberRight = (answer: number, typed: string) => Math.abs(parseAmount(typed) - answer) < 0.5;

const bump = (p: TopicProgress, correct: boolean) => {
  const streak = correct ? p.streak + 1 : 0;
  return { streak, best: Math.max(p.best, streak) };
};

/** One "check" of an exercise. A wrong try breaks the streak; the exercise is done when right or out of tries. */
export function recordExercise(p: TopicProgress, ex: Exercise, ok: boolean): TopicProgress {
  const prev = p.exercises[ex.id] ?? { tries: 0, ok: false, done: false };
  if (prev.done) return p;
  const tries = prev.tries + 1;
  return { ...p, ...bump(p, ok), exercises: { ...p.exercises, [ex.id]: { tries, ok, done: ok || tries >= triesFor(ex) } } };
}

/** The answer to a trap. Only the first answer counts. */
export function recordTrap(p: TopicProgress, id: string, choice: number, correct: boolean): TopicProgress {
  if (p.traps[id]) return p;
  return { ...p, ...bump(p, correct), traps: { ...p.traps, [id]: { choice, correct } } };
}

/** A concept screen read. */
export const markSeen = (p: TopicProgress, i: number): TopicProgress => (p.seen.includes(i) ? p : { ...p, seen: [...p.seen, i] });

export const exerciseXp = (r?: ExResult) => (!r?.ok ? 0 : r.tries === 1 ? XP.first : XP.second);

export function xpOf(m: StudyModule, p: TopicProgress) {
  const seen = p.seen.filter((i) => i >= 0 && i < m.screens.length).length * XP.screen;
  const exercises = m.exercises.reduce((s, ex) => s + exerciseXp(p.exercises[ex.id]), 0);
  const traps = m.traps.filter((t) => p.traps[t.id]?.correct).length * XP.trap;
  return seen + exercises + traps;
}

export const maxXp = (m: StudyModule) => m.screens.length * XP.screen + m.exercises.length * XP.first + m.traps.length * XP.trap;

export function scoreOf(m: StudyModule, p: TopicProgress) {
  return {
    learn: { ok: m.screens.filter((_, i) => p.seen.includes(i)).length, total: m.screens.length },
    practice: {
      ok: m.exercises.filter((ex) => p.exercises[ex.id]?.ok).length + m.traps.filter((t) => p.traps[t.id]?.correct).length,
      total: m.exercises.length + m.traps.length,
    },
  };
}

/** Where a lesson stands: not started, under way, or done (every exercise and trap answered). */
export function statusOf(m: StudyModule, p: TopicProgress): "new" | "started" | "done" {
  const answered = m.exercises.every((ex) => p.exercises[ex.id]?.done) && m.traps.every((t) => p.traps[t.id]);
  if (answered) return "done";
  const touched = p.step > 0 || p.sub > 0 || p.seen.length > 0 || Object.keys(p.exercises).length > 0 || Object.keys(p.traps).length > 0;
  return touched ? "started" : "new";
}

/** Where a lesson stands on the course path: as statusOf, except that a lesson skipped and not done is passed over. */
export function pathStatus(m: StudyModule, p: TopicProgress): "new" | "started" | "done" | "skipped" {
  const status = statusOf(m, p);
  return p.skipped && status !== "done" ? "skipped" : status;
}

/** Screens inside a step: the concept screens, the practice (a screen marking the move from learning to practice, then every question), and one summary. */
export function subCount(m: StudyModule, step: number) {
  const id = STEPS[step].id;
  return id === "learn" ? m.screens.length : id === "practice" ? practiceOf(m).length + 1 : 1;
}

export const practiceId = (it: PracticeItem) => (it.kind === "exercise" ? it.ex.id : it.trap.id);

/** The practice questions not solved yet: never answered, or answered wrong. Each with its screen in the practice step. */
export function missedOf(m: StudyModule, p: TopicProgress) {
  return practiceOf(m)
    .map((it, i) => ({ id: practiceId(it), sub: i + 1, ok: it.kind === "exercise" ? !!p.exercises[it.ex.id]?.ok : !!p.traps[it.trap.id]?.correct }))
    .filter((x) => !x.ok)
    .map(({ id, sub }) => ({ id, sub }));
}

/** Try the missed questions again: their answers cleared (the solved ones, and their XP, untouched), and the list of them kept for "next". */
export function retryMissed(m: StudyModule, p: TopicProgress): TopicProgress {
  const ids = missedOf(m, p).map((x) => x.id);
  const drop = <T,>(r: Record<string, T>) => Object.fromEntries(Object.entries(r).filter(([k]) => !ids.includes(k)));
  return { ...p, retry: ids, exercises: drop(p.exercises), traps: drop(p.traps) };
}

/** The question on a screen of the practice step; none on its first screen, which opens the practice. */
export const practiceAt = (m: StudyModule, sub: number): PracticeItem | undefined => (sub > 0 ? practiceOf(m)[sub - 1] : undefined);

export type Place = { step: number; sub: number };

/** "Next" (+1) or "previous" (−1): through the screens of a step, then into the next step. Stays put at either end. */
export function move(m: StudyModule, at: Place, dir: 1 | -1): Place {
  const sub = at.sub + dir;
  if (sub >= 0 && sub < subCount(m, at.step)) return { step: at.step, sub };
  const step = at.step + dir;
  if (step < 0 || step >= STEPS.length) return at;
  return { step, sub: dir === 1 ? 0 : subCount(m, step) - 1 };
}

/** Where a place sits in the whole lesson, for the progress bar: screen `at` of `total`. */
export function position(m: StudyModule, { step, sub }: Place) {
  const counts = STEPS.map((_, i) => subCount(m, i));
  const at = counts.slice(0, step).reduce((s, c) => s + c, 0) + sub + 1;
  return { at, total: counts.reduce((s, c) => s + c, 0) };
}

/** A stored place clamped to the lesson, in case the lesson changed since it was saved. */
export function clampPlace(m: StudyModule, p: Place): Place {
  const step = Math.max(0, Math.min(p.step, STEPS.length - 1));
  return { step, sub: Math.max(0, Math.min(p.sub, subCount(m, step) - 1)) };
}
