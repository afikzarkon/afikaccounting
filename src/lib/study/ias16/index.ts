import { findScreenIn, lessonHref, screenHrefIn } from "../paths";
import { DEPRECIATION } from "./depreciation";
import { EXCHANGE } from "./exchange";
import { INTRO } from "./intro";
import { RENOVATION } from "./renovation";
import { REVALUATION } from "./revaluation";

/** The fixed-assets course: five lessons, in order. */
export const IAS16_LESSONS = [INTRO, DEPRECIATION, RENOVATION, EXCHANGE, REVALUATION];

/** The lesson and index of a concept screen of the course, by its id. */
export const findIas16Screen = (id: string) => findScreenIn(IAS16_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id. */
export const ias16ScreenHref = (id: string) => screenHrefIn(IAS16_LESSONS, id);

/**
 * The former long page's anchors (/basics/ias16#id), and where each now
 * lives: every chapter and sub-section kept its id as a screen (but "what",
 * which the basics course already has, is "ppe-what"); a chapter split into
 * screens opens its first; the old tabs' names lead to theirs.
 * The full calculator's card stays on the course page.
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
};

export const IAS16_LEGACY_CHAPTERS = [...IAS16_LESSONS.flatMap((m) => m.screens.map((s) => s.id)), ...Object.keys(LEGACY_ALIASES)];

export function ias16LegacyHref(id: string): string | undefined {
  const hit = findIas16Screen(LEGACY_ALIASES[id] ?? id);
  return hit && lessonHref(hit.module.slug, LEGACY_ALIASES[id] ?? id);
}
