import type { QuestionExercise } from "../types";

export { fmt } from "../inventory/shared";

/** What every lesson of the consolidated statements course shares: its name, its page, the lessons' numbers, and how a question is written. */
export const COURSE = "דוחות מאוחדים וצירופי עסקים";
export const COURSE_HREF = "/basics/consolidated";

/** Each lesson's number on the site, by slug. A lesson joins here when it is built; a test checks this against the course's order. */
export const LESSON_N = {
  "consolidated-what": 1,
  "consolidated-control": 2,
  "consolidated-returns": 3,
  "consolidated-acquisition": 4,
  "consolidated-goodwill": 5,
  "consolidated-worksheet": 6,
  "consolidated-policy": 7,
  "consolidated-finance": 8,
  "consolidated-impairment": 9,
} as const;

export type ConsolidatedSlug = keyof typeof LESSON_N;

/** How hard a question is and what it rests on. Internal: the site shows none of it. */
export type QuestionMeta = {
  /** 1: one idea. 2: as in a lecture example. 3: beyond it, several ideas together. */
  level: 1 | 2 | 3;
  source: "מקורית";
  /** The paragraph or page it rests on. */
  ref: string;
};

export type ConsolidatedQuestion = QuestionExercise & { meta: QuestionMeta };

/**
 * A multiple-choice question: the right option, the reason, why each wrong
 * option is wrong, and the common trap, which every solution ends on.
 * `wrong` holds one reason for each option but the right one, in their order.
 */
export function ask(a: { id: string; skill: string; prompt: string; options: string[]; answer: number; why: string; wrong: string[]; trap: string } & QuestionMeta): ConsolidatedQuestion {
  const others = a.options.filter((_, i) => i !== a.answer);
  if (a.wrong.length !== others.length) throw new Error(`${a.id}: a reason for each wrong option`);
  return {
    kind: "choice",
    id: a.id,
    skill: a.skill,
    prompt: a.prompt,
    options: a.options,
    answer: a.answer,
    steps: [a.why, ...others.map((o, i) => `למה לא "${o}": ${a.wrong[i]}`), `מלכודת נפוצה: ${a.trap}`],
    meta: { level: a.level, source: a.source, ref: a.ref },
  };
}

/** A calculation: the answer, the worked solution, and the common trap. */
export function askNumber(a: { id: string; skill: string; prompt: string; answer: number; steps: string[]; trap: string } & QuestionMeta): ConsolidatedQuestion {
  return {
    kind: "number",
    id: a.id,
    skill: a.skill,
    prompt: a.prompt,
    answer: a.answer,
    steps: [...a.steps, `מלכודת נפוצה: ${a.trap}`],
    meta: { level: a.level, source: a.source, ref: a.ref },
  };
}
