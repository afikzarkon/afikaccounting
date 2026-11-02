import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ENGINE_HUB, ENGINE_TOOLS, EXAMS_HUB, LEARN_HUB, LEARNING_PATH, PRICING_HUB, TOPICS } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { PLANS } from "@/lib/pricing";
import { STUDY_MODULES } from "@/lib/study";
import { lessonHref } from "@/lib/study/paths";
import { createPublicClient } from "@/lib/supabase/public";
import { BUTTONS, HOME_SECTIONS, planKey } from "./items";
import { NOTHING_HIDDEN, type Visibility, isLinkHidden, linkKey } from "./rules";

/** The tag the admin's changes refresh. */
export const VISIBILITY_TAG = "visibility";

/** A course's lessons, in order. */
const lessonsOf = (topicHref: string) =>
  Object.values(STUDY_MODULES)
    .filter((m) => m.backHref === topicHref)
    .sort((a, b) => a.n - b.n);

/** Hubs whose hiding hides every page under them. */
const WHOLE_AREAS = [EXAMS_HUB.href];

/** A hidden address and everything it brings down with it: a course, its lessons and its tools; a whole area. */
function expand(href: string): string[] {
  const topic = TOPICS.find((t) => t.href === href);
  if (topic) return [href, ...(topic.pages ?? []).map((p) => p.href), ...topic.tools.map((t) => t.href), ...lessonsOf(href).map((m) => lessonHref(m.slug))];
  if (WHOLE_AREAS.includes(href)) return [href, `${href}/*`];
  return [href];
}

/**
 * What the admin has hidden, for everyone: cached, and refreshed the moment the
 * admin changes it. Nothing is hidden in demo mode, or before the migration runs.
 */
export async function getVisibility(): Promise<Visibility> {
  "use cache";
  cacheTag(VISIBILITY_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured) return NOTHING_HIDDEN;
  const { data, error } = await createPublicClient().from("site_visibility").select("key, hidden, label");
  if (error || !data) return NOTHING_HIDDEN;
  const hidden = data.filter((r) => r.hidden).map((r) => r.key as string);
  const links = [...new Set(hidden.filter((k) => k.startsWith("link:")).flatMap((k) => expand(k.slice(5))))];
  const labels = Object.fromEntries(data.filter((r) => r.label).map((r) => [r.key as string, r.label as string]));
  return { hidden, links, labels };
}

/** The learning path without what the admin hid: hidden courses go, with their tools; an emptied stage goes. */
export function visiblePath(v: Visibility) {
  const shown = (href: string) => !isLinkHidden(v.links, href);
  return LEARNING_PATH.map((s) => ({ ...s, topics: s.topics.filter((t) => shown(t.href)).map((t) => ({ ...t, tools: t.tools.filter((x) => shown(x.href)) })) })).filter((s) => s.topics.length);
}

/** A course's lessons without those the admin hid. */
export async function visibleLessons<T extends { slug: string }>(lessons: T[]): Promise<T[]> {
  const { links } = await getVisibility();
  return lessons.filter((m) => !isLinkHidden(links, lessonHref(m.slug)));
}

// ---- the admin's list ----------------------------------------------------------

export type ControlItem = { key: string; label: string; hint?: string; href?: string; renamable?: boolean; children?: ControlItem[] };
export type ControlGroup = { title: string; description: string; items: ControlItem[] };

/** Everything the admin can show or hide, grouped as the admin page lists it. */
export function controlGroups(): ControlGroup[] {
  const courses: ControlItem[] = LEARNING_PATH.flatMap((stage) =>
    stage.topics.map((t) => ({
      key: linkKey(t.href),
      label: t.standard ? `${t.title} (${t.standard})` : t.title,
      hint: t.tier === "free" ? "קורס חינמי" : "קורס בתשלום",
      href: t.href,
      children: lessonsOf(t.href).map((m) => ({ key: linkKey(lessonHref(m.slug)), label: `שיעור ${m.n}: ${m.title}`, href: lessonHref(m.slug) })),
    })),
  );
  const tools: ControlItem[] = [
    ...TOPICS.flatMap((t) => t.tools.map((tool) => ({ key: linkKey(tool.href), label: tool.label, hint: `בתוך ${t.title}`, href: tool.href }))),
    ...ENGINE_TOOLS.map((c) => ({ key: linkKey(c.href), label: `${c.standard} · ${c.label}`, hint: "מנוע הפתרונות", href: c.href })),
  ];
  const pages: ControlItem[] = [
    { key: linkKey(LEARN_HUB.href), label: LEARN_HUB.label, hint: "בתפריט ״קורסים״ ובתחתית", href: LEARN_HUB.href },
    { key: linkKey(EXAMS_HUB.href), label: EXAMS_HUB.label, hint: "כל המבחנים ודפיהם, בתפריט ובכל מקום", href: EXAMS_HUB.href },
    { key: linkKey(ENGINE_HUB.href), label: ENGINE_HUB.label, hint: "הדף וכל המחשבונים שבו", href: ENGINE_HUB.href },
    { key: linkKey("/review"), label: "החזרה שלי", hint: "בתפריט ״קורסים״", href: "/review" },
    { key: linkKey("/about"), label: "אודות", hint: "בתחתית", href: "/about" },
  ];
  const pricing: ControlItem[] = [
    { key: linkKey(PRICING_HUB.href), label: "דף המחירים", hint: "הדף והקישורים אליו", href: PRICING_HUB.href },
    ...PLANS.map((p) => ({ key: planKey(p.tier), label: `מסלול ״${p.name}״`, hint: "הכרטיס שלו בדף המחירים ובדף הבית; אי אפשר לרכוש אותו" })),
  ];
  return [
    { title: "קורסים ושיעורים", description: "קורס מוסתר מסתיר גם את כל השיעורים והכלים שבו.", items: courses },
    { title: "כלים ומחשבונים", description: "המחשבונים שבתוך הקורסים, ומחשבוני מנוע הפתרונות.", items: tools },
    { title: "דפים ופריטי תפריט", description: "דף מוסתר נעלם מהתפריט העליון, מהתחתית ומהחיפוש, וחסום בכניסה ישירה.", items: pages },
    { title: "מחירים ומסלולים", description: "הסתרת מסלול מורידה את הכרטיס שלו וחוסמת את רכישתו. המחירים עצמם נקבעים בקוד.", items: pricing },
    { title: "חלקים בדף הבית", description: "כל אזור בדף הבית בנפרד.", items: HOME_SECTIONS.map((s) => ({ key: s.key, label: s.label })) },
    { title: "כפתורים", description: "אפשר להסתיר כפתור, או לשנות את הטקסט שלו.", items: Object.values(BUTTONS).map((b) => ({ key: b.key, label: b.label, hint: b.where, renamable: true })) },
  ];
}
