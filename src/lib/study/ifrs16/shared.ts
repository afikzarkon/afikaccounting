import type { QuestionExercise } from "../types";

export { fmt } from "../inventory/shared";

/** What every lesson of the leases course shares: its name, its page, the lessons' numbers, and how a question is written. */
export const COURSE = "חכירות (IFRS 16)";
export const COURSE_HREF = "/basics/ifrs16";

/** Each lesson's number on the site, by slug. A lesson joins here when it is built; a test checks this against the course's order. */
export const LESSON_N = {
  "ifrs16-what": 1,
  "ifrs16-term": 2,
  "ifrs16-measure": 3,
  "ifrs16-subsequent": 4,
  "ifrs16-changes": 5,
  "ifrs16-lessor": 6,
  "ifrs16-lessor-changes": 7,
} as const;

export type Ifrs16Slug = keyof typeof LESSON_N;

/** "שיעור 3". */
export const lessonRef = (slug: Ifrs16Slug) => `שיעור ${LESSON_N[slug]}`;

/** Where a question comes from, how hard it is, and what in the summary or the standard it rests on. Internal: the site shows none of it. */
export type QuestionMeta = {
  /** 1: one idea. 2: as in a lecture example. 3: beyond it, several ideas together. */
  level: 1 | 2 | 3;
  source: "הרצאה" | "בהשראת הרצאה" | "מקורית";
  /** The paragraph it rests on. */
  ref: string;
};

export type LeaseQuestion = QuestionExercise & { meta: QuestionMeta };

/**
 * A multiple-choice practice question: the right option, the full reason, and
 * the common trap, which every solution ends on.
 */
export function ask(a: { id: string; skill: string; prompt: string; options: string[]; answer: number; why: string; trap: string } & QuestionMeta): LeaseQuestion {
  return {
    kind: "choice",
    id: a.id,
    skill: a.skill,
    prompt: a.prompt,
    options: a.options,
    answer: a.answer,
    steps: [a.why, `מלכודת נפוצה: ${a.trap}`],
    meta: { level: a.level, source: a.source, ref: a.ref },
  };
}

/** A calculation: the answer, the worked solution, and the common trap. */
export function askNumber(a: { id: string; skill: string; prompt: string; answer: number; steps: string[]; trap: string } & QuestionMeta): LeaseQuestion {
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
