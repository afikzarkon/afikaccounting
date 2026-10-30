import { ADJUST } from "./adjust";
import { BOOKS } from "./books";
import { DOUBLE_ENTRY } from "./double-entry";
import { FINAL } from "./final";
import { INTRO } from "./intro";

/** The basics course: six lessons, in order. */
export const BASICS_LESSONS = [INTRO, DOUBLE_ENTRY, BOOKS, ADJUST, FINAL];

/** A lesson's address; with a screen id, the address that opens that concept screen. */
export const lessonHref = (slug: string, screen?: string) => `/study/${slug}${screen ? `?screen=${screen}` : ""}`;

/** The lesson and index of a concept screen, by its id. */
export function findScreen(id: string) {
  for (const m of BASICS_LESSONS) {
    const i = m.screens.findIndex((s) => s.id === id);
    if (i >= 0) return { module: m, index: i, title: m.screens[i].title };
  }
  return undefined;
}

/** Where a concept screen lives. Throws on an unknown id, so a broken link fails the build, not the reader. */
export function screenHref(id: string) {
  const hit = findScreen(id);
  if (!hit) throw new Error(`Unknown basics screen ${id}`);
  return lessonHref(hit.module.slug, id);
}

/**
 * The former long page's chapter anchors (/basics#id), and where each now lives.
 * Concept chapters keep their id as a screen; practice moved to the closing
 * lesson's practice step, and the summary to the course page's reference section.
 */
export const LEGACY_CHAPTERS = [
  "what", "entity", "types", "equation", "expense", "double", "lab", "credit", "loan", "taccounts",
  "trial", "retained", "reports", "accrual", "inventory", "creditloss", "worksheet", "practice", "summary",
] as const;

export function legacyHref(id: string): string | undefined {
  if (id === "practice") return `/study/${BASICS_LESSONS.at(-1)!.slug}?step=2`;
  if (id === "summary" || id === "cheatsheet") return "#reference";
  return findScreen(id) ? screenHref(id) : undefined;
}
