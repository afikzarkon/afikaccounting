import { EMPTY_TOPIC, type ExResult, type TopicProgress } from "./score";

/**
 * Lesson progress kept in two places for a signed-in reader — the browser and
 * the account — and the rules that join them. Pure, so it is tested, and the
 * same rules run on the server (to check what it is asked to store) and in the
 * browser (to merge what comes back).
 */

const SLUG = /^[a-z0-9-]{1,80}$/;
const ID = /^[\w-]{1,80}$/;
const MAX_ITEMS = 200;

export const isLessonSlug = (s: unknown): s is string => typeof s === "string" && SLUG.test(s);

const count = (v: unknown, max = 10_000) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max ? v : 0);
const record = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/**
 * One lesson's progress as stored, from anything: what is not a well-formed
 * field is dropped, so a row can never break a lesson. `retry` is left out —
 * it is the questions being tried again right now, on one device.
 */
export function sanitizeTopic(raw: unknown): TopicProgress {
  const r = record(raw);
  const seen = Array.isArray(r.seen) ? [...new Set(r.seen.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < 500))].slice(0, MAX_ITEMS) : [];
  const exercises: Record<string, ExResult> = {};
  for (const [id, v] of Object.entries(record(r.exercises)).slice(0, MAX_ITEMS)) {
    const e = record(v);
    if (ID.test(id) && typeof e.ok === "boolean" && typeof e.done === "boolean") exercises[id] = { tries: count(e.tries, 99), ok: e.ok, done: e.done };
  }
  const traps: TopicProgress["traps"] = {};
  for (const [id, v] of Object.entries(record(r.traps)).slice(0, MAX_ITEMS)) {
    const t = record(v);
    if (ID.test(id) && typeof t.correct === "boolean" && Number.isInteger(t.choice) && (t.choice as number) >= 0 && (t.choice as number) < 10) traps[id] = { choice: t.choice as number, correct: t.correct };
  }
  return {
    step: count(r.step, 10),
    sub: count(r.sub, 500),
    seen,
    exercises,
    traps,
    streak: count(r.streak),
    best: count(r.best),
    ...(r.skipped === true && { skipped: true }),
  };
}

/** Whether a lesson's progress has anything in it worth keeping. */
export const isEmptyTopic = (p: TopicProgress) =>
  p.step === 0 && p.sub === 0 && p.seen.length === 0 && Object.keys(p.exercises).length === 0 && Object.keys(p.traps).length === 0 && p.best === 0 && !p.skipped;

/** Of two answers to the same question, the one that went further: finished over not, right over wrong, then in fewer tries. */
function betterResult(a: ExResult, b: ExResult): ExResult {
  if (a.done !== b.done) return a.done ? a : b;
  if (a.done) {
    if (a.ok !== b.ok) return a.ok ? a : b;
    return a.tries <= b.tries ? a : b;
  }
  return a.tries >= b.tries ? a : b;
}

/**
 * One lesson's progress from two devices, joined: every concept read on
 * either, every question's best answer, and the place in the lesson (with its
 * streak and "skipped" mark) of the one further along. A trap counts its first
 * answer, so where both answered, `first` wins — pass the account's copy
 * first, as it was written before this device's.
 */
export function mergeTopic(first: TopicProgress, second: TopicProgress): TopicProgress {
  const a = { ...EMPTY_TOPIC, ...first };
  const b = { ...EMPTY_TOPIC, ...second };
  const ahead = b.step > a.step || (b.step === a.step && b.sub > a.sub) ? b : a;
  const exercises: Record<string, ExResult> = { ...b.exercises };
  for (const [id, r] of Object.entries(a.exercises)) exercises[id] = exercises[id] ? betterResult(r, exercises[id]) : r;
  return {
    step: ahead.step,
    sub: ahead.sub,
    seen: [...new Set([...a.seen, ...b.seen])].sort((x, y) => x - y),
    exercises,
    traps: { ...b.traps, ...a.traps },
    streak: ahead.streak,
    best: Math.max(a.best, b.best),
    ...(ahead.skipped && { skipped: true }),
  };
}

/** A stable text of a lesson's progress, to tell whether it changed since it was last stored. */
export const topicKey = (p: TopicProgress) => JSON.stringify(sanitizeTopic(p));
