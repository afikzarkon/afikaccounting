import type { MetadataRoute } from "next";
import { ENGINE_HUB, ENGINE_TOOLS, EXAMS_HUB, LEARN_HUB, LEARNING_PATH, PRICING_HUB } from "@/lib/catalog";
import { SITE_URL } from "@/lib/env";
import { STUDY_MODULES, studyHref } from "@/lib/study";

/**
 * Every public learning page, for search engines: the hubs, each topic, every
 * lesson (its first screen and preview are public; a locked lesson still shows
 * what it teaches) and the calculators. Built from the catalog, so a new lesson
 * is listed without touching this file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set<string>(["/", LEARN_HUB.href, EXAMS_HUB.href, PRICING_HUB.href, ENGINE_HUB.href, "/review", "/about"]);
  for (const stage of LEARNING_PATH)
    for (const t of stage.topics) {
      paths.add(t.href);
      for (const p of t.pages ?? []) paths.add(p.href);
    }
  for (const slug of Object.keys(STUDY_MODULES)) paths.add(studyHref(slug));
  for (const c of ENGINE_TOOLS) if (!c.href.includes("?")) paths.add(c.href);
  return [...paths]
    .filter((p) => !p.includes("?") && !p.includes("#"))
    .map((p) => ({ url: `${SITE_URL}${p === "/" ? "" : p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : p.startsWith("/study/") ? 0.6 : 0.8 }));
}
