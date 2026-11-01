"use server";

import { canAccessWith } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { topicByHref } from "@/lib/catalog";
import { tierAllows } from "@/lib/pricing";
import { STUDY_MODULES } from "@/lib/study";
import type { Exercise } from "@/lib/study/types";
import { makeSimilar } from "@/lib/study/variants";

/**
 * A similar question with new numbers, for a question in review: for a
 * subscriber (any paid plan), on a lesson their plan opens. Made here, so
 * nobody else gets one.
 */
export async function similarQuestion(slug: string, id: string): Promise<{ ok: true; exercise: Exercise } | { ok: false; reason: "plan" | "none" }> {
  const m = typeof slug === "string" ? STUDY_MODULES[slug] : undefined;
  const topic = m && topicByHref(m.backHref);
  if (!m || !topic || typeof id !== "string") return { ok: false, reason: "none" };
  const access = await getAccess();
  if (!tierAllows(access.tier, "courses") || !canAccessWith(access, topic, slug)) return { ok: false, reason: "plan" };
  const exercise = makeSimilar(slug, id);
  return exercise ? { ok: true, exercise } : { ok: false, reason: "none" };
}
