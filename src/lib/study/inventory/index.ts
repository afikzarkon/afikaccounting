import { findScreenIn, lessonHref, screenHrefIn } from "../paths";
import { AVERAGE } from "./average";
import { COST } from "./cost";
import { DISCOUNTS } from "./discounts";
import { EXAMS } from "./exams";
import { FIFO } from "./fifo";
import { FIRE } from "./fire";
import { IAS2 } from "./ias2";
import { NRV_LESSON } from "./nrv";
import { RECORDING } from "./recording";
import { UNKNOWNS } from "./unknowns";
import { WHAT } from "./what";
import { WORKSHEET } from "./worksheet";

/** The inventory course: twelve lessons, in order — from what inventory is to two exam-level questions. */
export const INVENTORY_LESSONS = [WHAT, RECORDING, IAS2, COST, DISCOUNTS, FIFO, AVERAGE, NRV_LESSON, UNKNOWNS, FIRE, WORKSHEET, EXAMS];

/** The lesson and index of a concept screen of the course, by its id. */
export const findInventoryScreen = (id: string) => findScreenIn(INVENTORY_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id. */
export const inventoryScreenHref = (id: string) => screenHrefIn(INVENTORY_LESSONS, id);

/** The calculator's screen: where "try it in the calculator" goes. */
export const INVENTORY_CALC = "inv-calc";

/**
 * The former long page's chapter anchors (/basics/inventory#id), and where
 * each now lives. Every chapter kept its id as the first screen of its
 * content; the closing chapter of tools, and the calculator inside it, open
 * the calculator's screen.
 */
export const INVENTORY_LEGACY_CHAPTERS = [
  "inv-idea", "inv-terms", "inv-systems", "inv-cogs", "inv-cost", "inv-formulas", "inv-fifo", "inv-wa",
  "inv-ma", "inv-nrv", "inv-count", "inv-unknowns", "inv-exam", "inv-fullexam", "inv-tools", "inv-calc",
] as const;

export function inventoryLegacyHref(id: string): string | undefined {
  if (id === "inv-tools") return inventoryScreenHref(INVENTORY_CALC);
  const hit = findInventoryScreen(id);
  return hit && lessonHref(hit.module.slug, id);
}
