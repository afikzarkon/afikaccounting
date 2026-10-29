import { BASICS_LESSONS } from "./basics";
import type { StudyModule } from "./types";

/** Every interactive lesson, by slug: /study/[slug]. */
export const STUDY_MODULES: Record<string, StudyModule> = Object.fromEntries(BASICS_LESSONS.map((m) => [m.slug, m]));

export const studyHref = (slug: string) => `/study/${slug}`;
