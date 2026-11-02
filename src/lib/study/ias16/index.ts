import { findScreenIn, lessonHref, screenHrefIn } from "../paths";
import { COMPONENTS } from "./lessons/components";
import { COST } from "./lessons/cost";
import { DISPOSAL } from "./lessons/disposal";
import { EXAMS } from "./lessons/exams";
import { LAND } from "./lessons/land";
import { METHODS } from "./lessons/methods";
import { REVALUE } from "./lessons/revalue";
import { STRAIGHT } from "./lessons/straight";
import { SUBSEQUENT } from "./lessons/subsequent";
import { SWAP_LESSON } from "./lessons/swap";
import { TABLE } from "./lessons/table";
import { UNKNOWNS } from "./lessons/unknowns";
import { WHAT } from "./lessons/what";
import { SHEET } from "./lessons/worksheet";

/** The fixed-assets course: fourteen lessons, in order — from what an item of PPE is, through the sheet every question is solved in, to questions of unknowns and three exam-level questions. */
export const IAS16_LESSONS = [WHAT, COST, TABLE, STRAIGHT, METHODS, COMPONENTS, DISPOSAL, SUBSEQUENT, SWAP_LESSON, LAND, REVALUE, SHEET, UNKNOWNS, EXAMS];

/** The lesson and index of a concept screen of the course, by its id. */
export const findIas16Screen = (id: string) => findScreenIn(IAS16_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id. */
export const ias16ScreenHref = (id: string) => screenHrefIn(IAS16_LESSONS, id);

/**
 * The former long page's anchors (/basics/ias16#id), and where each now
 * lives: every chapter and sub-section kept its id as a screen (but "what",
 * which the basics course already has, is "ppe-what"); a chapter split into
 * screens opens its first; the old tabs' names lead to theirs; and the three
 * screens of worked examples the twelve-lesson course folded into others
 * open those.
 */
const LEGACY_ALIASES: Record<string, string> = {
  what: "ppe-what",
  simulator: "depreciation",
  basics: "concepts",
  renovation: "renovation-distinction",
  exchange: "exchange-steps",
  revaluation: "revaluation-standard",
  "basics-part": "ppe-what",
  "concepts-part": "concepts",
  "issues-part": "depreciation",
  "renovation-examples": "renovation-steps",
  "renovation-tips": "renovation-steps",
  "revaluation-examples": "revaluation-steps",
};

export const IAS16_LEGACY_CHAPTERS = [...IAS16_LESSONS.flatMap((m) => m.screens.map((s) => s.id)), ...Object.keys(LEGACY_ALIASES)];

export function ias16LegacyHref(id: string): string | undefined {
  const hit = findIas16Screen(LEGACY_ALIASES[id] ?? id);
  return hit && lessonHref(hit.module.slug, LEGACY_ALIASES[id] ?? id);
}
