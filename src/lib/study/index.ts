import { BASICS_LESSONS } from "./basics";
import { IAS16_LESSONS } from "./ias16";
import { IAS19_LESSONS } from "./ias19";
import { IFRS16_LESSONS } from "./ifrs16";
import { INVENTORY_LESSONS } from "./inventory";
import { findScreenIn } from "./paths";
import type { StudyModule } from "./types";

/** Every interactive lesson, by slug: /study/[slug]. */
export const STUDY_MODULES: Record<string, StudyModule> = Object.fromEntries([...BASICS_LESSONS, ...INVENTORY_LESSONS, ...IAS16_LESSONS, ...IAS19_LESSONS, ...IFRS16_LESSONS].map((m) => [m.slug, m]));

export { studyHref } from "./href";

/** The lesson and index of a concept screen, by its id, in any course. */
export const findScreen = (id: string) => findScreenIn(Object.values(STUDY_MODULES), id);
