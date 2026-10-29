import { type Entry, PRACTICE } from "@/lib/learn/basics";
import type { QuestionExercise } from "../types";

/** What every lesson of the basics course shares: its name, its page, and a way to reuse the practice set. */
export const COURSE = "חשבונאות מאפס";
export const COURSE_HREF = "/basics";

/** Amounts in prompts, as the practice set writes them. */
export const fmt = (v: number) => v.toLocaleString("en-US");

/** A question of the basics practice set, as a lesson exercise. */
export function practice(id: string): QuestionExercise {
  const q = PRACTICE.find((x) => x.id === id);
  if (!q) throw new Error(`No practice question ${id}`);
  return Object.fromEntries(Object.entries(q).filter(([k]) => k !== "level")) as QuestionExercise;
}

/** The two worked entries of "double entry": one account on each side, and several on one side. */
export const SIMPLE: Entry = {
  id: "1",
  text: "העסק שילם 2,000 ₪ שכירות במזומן",
  lines: [
    { account: "הוצאות שכירות", dr: 2_000 },
    { account: "מזומן", cr: 2_000 },
  ],
};
export const COMPOUND: Entry = {
  id: "2",
  text: "העסק קנה ציוד ב-50,000 ₪: 20,000 במזומן והשאר באשראי",
  lines: [
    { account: "ציוד", dr: 50_000 },
    { account: "מזומן", cr: 20_000 },
    { account: "זכאים", cr: 30_000 },
  ],
};
