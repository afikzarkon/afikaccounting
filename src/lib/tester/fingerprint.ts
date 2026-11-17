import "server-only";
import { createHash } from "node:crypto";
import { Fragment, isValidElement } from "react";
import { screenContent } from "@/components/basics/screens";
import { TOPICS, topicByHref } from "@/lib/catalog";
import { STUDY_MODULES } from "@/lib/study";
import { studyHref } from "@/lib/study/href";
import type { StudyModule } from "@/lib/study/types";

/**
 * What changed in a course since the admin last decided about its changes, found by the site itself.
 *
 * Every lesson is reduced to a fingerprint: a short hash of each concept screen (its lead and body,
 * the words and the numbers and tables handed to its components), each practice question with its
 * worked solution, each trap, the summary's tips, and the videos. /admin/feedback keeps the fingerprint
 * of the last decision (public.tester_content_baselines) and compares the live lessons to it.
 *
 * What it does not see: a change inside a shared component's own code (how a table draws, say) that
 * leaves every screen's words and numbers as they were.
 */

const VERSION = 1;

type LessonPrint = {
  n: number;
  title: string;
  /** Screen id → [its title, the hash of its content]. */
  screens: Record<string, [string, string]>;
  ex: Record<string, string>;
  traps: Record<string, string>;
  tips: string;
  videos: Record<string, string>;
};
export type CoursePrint = { v: number; lessons: Record<string, LessonPrint> };

const hash = (x: unknown) => createHash("sha1").update(JSON.stringify(x) ?? "").digest("base64url").slice(0, 12);

/**
 * A screen's content as plain data: its text, and the props handed to each element, minus functions.
 * Components are not named (their names change between builds); what they are given is what counts.
 */
function plain(x: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 60 || x === null || x === undefined || typeof x === "boolean" || typeof x === "function" || typeof x === "symbol") return null;
  if (typeof x === "string" || typeof x === "number" || typeof x === "bigint") return String(x);
  if (Array.isArray(x)) return x.map((v) => plain(v, depth + 1, seen));
  if (isValidElement(x)) {
    const { children, ...props } = (x.props ?? {}) as Record<string, unknown>;
    const t = typeof x.type === "string" ? x.type : x.type === Fragment ? "" : "c";
    return [t, plain(props, depth + 1, seen), plain(children, depth + 1, seen)];
  }
  if (typeof x === "object") {
    if (seen.has(x)) return "~";
    seen.add(x);
    if (x instanceof Date) return x.toISOString();
    if (x instanceof Map) return plain([...x.entries()], depth + 1, seen);
    if (x instanceof Set) return plain([...x], depth + 1, seen);
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(x).sort()) {
      const v = plain((x as Record<string, unknown>)[k], depth + 1, seen);
      if (v !== null) out[k] = v;
    }
    return out;
  }
  return null;
}

function lessonPrint(m: StudyModule): LessonPrint {
  const screens: LessonPrint["screens"] = {};
  for (const s of m.screens) {
    const c = screenContent(s.id);
    screens[s.id] = [s.title, hash(plain(c ? [c.lead, c.body, c.check] : null))];
  }
  return {
    n: m.n,
    title: m.title,
    screens,
    ex: Object.fromEntries(m.exercises.map((e) => [e.id, hash(plain(e))])),
    traps: Object.fromEntries(m.traps.map((t) => [t.id, hash(plain(t))])),
    tips: hash(m.tips),
    videos: Object.fromEntries((m.videos ?? []).map((v) => [v.src, v.part ? `${v.title} (${v.part})` : v.title])),
  };
}

/** The courses made of interactive lessons, the ones a tester is given (public.course_grants uses these ids). */
export const LESSON_COURSES = TOPICS.filter((t) => t.format === "lessons").map((t) => ({ id: t.id, title: t.title }));

export const courseTitle = (id: string | null) => (id ? (TOPICS.find((t) => t.id === id)?.title ?? id) : "כל הקורסים");

/** Every lesson of a course, as it is in this build. */
export function coursePrint(courseId: string): CoursePrint {
  const lessons: CoursePrint["lessons"] = {};
  for (const m of Object.values(STUDY_MODULES)) if (topicByHref(m.backHref)?.id === courseId) lessons[m.slug] = lessonPrint(m);
  return { v: VERSION, lessons };
}

// ---- the difference, in words ----

export type Suggestion = {
  courseId: string;
  title: string;
  body: string;
  linkHref: string | null;
  linkLabel: string | null;
  /** How many things changed, to sort the courses by. */
  size: number;
};

const q = (s: string) => `״${s}״`;

/** "״א״, ״ב״ ו־״ג״", or "7, ביניהם ״א״, ״ב״, ״ג״" when there are many. */
function names(list: string[]) {
  if (list.length > 4) return `${list.length}, ביניהם ${list.slice(0, 3).map(q).join(", ")}`;
  if (list.length === 1) return q(list[0]);
  return `${list.slice(0, -1).map(q).join(", ")} ו-${q(list[list.length - 1])}`;
}

function countDiff(prev: Record<string, string>, cur: Record<string, string>) {
  const added = Object.keys(cur).filter((k) => !(k in prev)).length;
  const removed = Object.keys(prev).filter((k) => !(k in cur)).length;
  const changed = Object.keys(cur).filter((k) => k in prev && prev[k] !== cur[k]).length;
  return { added, removed, changed };
}

/** "נוספה שאלת תרגול אחת", "עודכנו 3 שאלות תרגול" (both kinds of question are feminine). */
function countWords(d: { added: number; removed: number; changed: number }, one: string, many: string) {
  const say = (k: number, single: string, plural: string) => (k === 1 ? `${single} ${one} אחת` : `${plural} ${k} ${many}`);
  return [d.added && say(d.added, "נוספה", "נוספו"), d.changed && say(d.changed, "עודכנה", "עודכנו"), d.removed && say(d.removed, "הוסרה", "הוסרו")].filter(Boolean) as string[];
}

/** What changed in a course between two fingerprints, as an update ready to publish; null when nothing did. */
export function suggest(courseId: string, prev: CoursePrint, cur: CoursePrint): Suggestion | null {
  const lines: string[] = [];
  let size = 0;
  let link: { href: string; label: string } | null = null;
  const order = Object.entries(cur.lessons).sort(([, a], [, b]) => a.n - b.n);

  for (const [slug, l] of order) {
    const was = prev.lessons[slug];
    const name = `שיעור ${l.n}: ${l.title}`;
    if (!was) {
      lines.push(`שיעור חדש: ${name}`);
      size += 5;
      link ??= { href: studyHref(slug), label: `לשיעור ${l.n}` };
      continue;
    }
    const parts: string[] = [];
    const added = Object.keys(l.screens).filter((id) => !(id in was.screens));
    const changed = Object.keys(l.screens).filter((id) => id in was.screens && (was.screens[id][1] !== l.screens[id][1] || was.screens[id][0] !== l.screens[id][0]));
    const removed = Object.keys(was.screens).filter((id) => !(id in l.screens));
    if (added.length) parts.push(`${added.length === 1 ? "נוסף המסך" : "נוספו המסכים"} ${names(added.map((id) => l.screens[id][0]))}`);
    if (changed.length) parts.push(`${changed.length === 1 ? "עודכן המסך" : "עודכנו המסכים"} ${names(changed.map((id) => l.screens[id][0]))}`);
    if (removed.length) parts.push(removed.length === 1 ? "הוסר מסך אחד" : `הוסרו ${removed.length} מסכים`);
    const ex = countDiff(was.ex, l.ex);
    const traps = countDiff(was.traps, l.traps);
    parts.push(...countWords(ex, "שאלת תרגול", "שאלות תרגול"));
    parts.push(...countWords(traps, "שאלת מלכודת", "שאלות מלכודת"));
    if (was.tips !== l.tips) parts.push("עודכנו הטיפים שבסיכום");
    const newVideos = Object.keys(l.videos).filter((src) => !(src in was.videos));
    if (newVideos.length) parts.push(`${newVideos.length === 1 ? "נוסף סרטון" : "נוספו סרטונים"}: ${newVideos.map((s) => l.videos[s]).join(", ")}`);
    if (was.title !== l.title) parts.unshift(`השם החדש של השיעור: ${q(l.title)}`);
    if (!parts.length) continue;
    lines.push(`${name} — ${parts.join("; ")}.`);
    size += added.length + changed.length + removed.length + ex.added + ex.changed + traps.added + traps.changed + newVideos.length + 1;
    const first = added[0] ?? changed[0];
    link ??= { href: first ? `${studyHref(slug)}?screen=${first}` : studyHref(slug), label: `לשיעור ${l.n}` };
  }
  const gone = Object.entries(prev.lessons).filter(([slug]) => !(slug in cur.lessons));
  if (gone.length) lines.push(`${gone.length === 1 ? "השיעור" : "השיעורים"} ${names(gone.map(([, l]) => l.title))} ${gone.length === 1 ? "אוחד או הוסר" : "אוחדו או הוסרו"}.`);
  if (!lines.length) return null;

  return {
    courseId,
    title: `מה חדש בקורס ${courseTitle(courseId)}`,
    body: lines.map((l) => `• ${l}`).join("\n"),
    linkHref: link?.href ?? null,
    linkLabel: link?.label ?? null,
    size,
  };
}
