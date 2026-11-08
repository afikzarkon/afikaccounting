import { KEEP_DAYS } from "./streak";

/**
 * A reader's study habits as the account keeps them: the days they studied on
 * (for the streak) and an exam date per course. Untrusted on the way in (a
 * browser sends it), so `sanitizeHabits` checks every field. Pure, so it is tested.
 */
export type Habits = { days: number[]; exams: Record<string, string> };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COURSE = /^[a-z0-9-]{1,40}$/;

export function sanitizeHabits(v: unknown): Habits {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const days = Array.isArray(o.days) ? [...new Set(o.days.filter((d): d is number => Number.isInteger(d) && d > 0 && d < 100_000))].sort((a, b) => a - b).slice(-KEEP_DAYS) : [];
  const exams: Record<string, string> = {};
  if (o.exams && typeof o.exams === "object")
    for (const [k, d] of Object.entries(o.exams as Record<string, unknown>).slice(0, 20)) if (COURSE.test(k) && typeof d === "string" && DATE.test(d)) exams[k] = d;
  return { days, exams };
}

/** Join the account's habits and this browser's: every study day from both; for an exam date, the browser's wins (it is the one just set). */
export function mergeHabits(account: Habits, local: Partial<Habits>): Habits {
  return sanitizeHabits({ days: [...account.days, ...(local.days ?? [])], exams: { ...account.exams, ...local.exams } });
}

export const sameHabits = (a: Habits, b: Habits) => JSON.stringify(sanitizeHabits(a)) === JSON.stringify(sanitizeHabits(b));
