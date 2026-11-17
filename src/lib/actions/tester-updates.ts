"use server";

import { refresh } from "next/cache";
import { assertAdmin, getCurrentUser, isTester } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { LESSON_COURSES, coursePrint } from "@/lib/tester/fingerprint";
import { type TesterUpdate, canDecideHere } from "@/lib/tester/updates";
import type { AdminResult } from "./admin-media";

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };
const NOT_LIVE: AdminResult = { ok: false, error: "את השינויים מפרסמים מהאתר החי בלבד: כאן רואים את הגרסה המקומית, שעוד לא עלתה." };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COURSE_IDS = new Set(LESSON_COURSES.map((c) => c.id));

type Raw = { id: string; course_id: string | null; title: string; body: string; link_href: string | null; link_label: string | null; created_at: string };
const toUpdate = (r: Raw): TesterUpdate => ({
  id: r.id,
  courseId: r.course_id,
  title: r.title,
  body: r.body,
  linkHref: r.link_href,
  linkLabel: r.link_label,
  createdAt: r.created_at,
});

/**
 * The updates the signed-in tester has not seen yet, oldest first: those about a course they were
 * given (or for every tester), published after they became a tester (a new tester starts from the
 * site as it is). None for anyone else, and none before the migration runs.
 */
export async function unseenTesterUpdates(): Promise<TesterUpdate[]> {
  if (!isSupabaseConfigured) return [];
  const user = await getCurrentUser();
  if (!user || !(await isTester())) return [];
  const supabase = await createClient();
  const [{ data: me }, { data: grants }, { data: updates, error }, { data: reads }] = await Promise.all([
    supabase.from("testers").select("added_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("course_grants").select("course_id").eq("user_id", user.id),
    supabase.from("tester_updates").select("id, course_id, title, body, link_href, link_label, created_at").order("created_at", { ascending: true }).limit(100),
    supabase.from("tester_update_reads").select("update_id").eq("user_id", user.id),
  ]);
  if (error || !updates) return [];
  const mine = new Set((grants ?? []).map((g: { course_id: string }) => g.course_id));
  const seen = new Set((reads ?? []).map((r: { update_id: string }) => r.update_id));
  const since = me?.added_at ? new Date(me.added_at).getTime() : 0;
  return (updates as Raw[])
    .filter((u) => !seen.has(u.id) && new Date(u.created_at).getTime() > since && (u.course_id === null || mine.has(u.course_id)))
    .map(toUpdate);
}

/** The tester closed the window: these updates won't show again, on any device. */
export async function markTesterUpdatesSeen(ids: string[]): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured) return { ok: false };
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const list = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === "string" && UUID_RE.test(id)).slice(0, 100);
  if (!list.length) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from("tester_update_reads")
    .upsert(list.map((update_id) => ({ user_id: user.id, update_id })), { onConflict: "user_id,update_id", ignoreDuplicates: true });
  return { ok: !error };
}

type Input = { courseId?: string | null; title?: unknown; body?: unknown; linkHref?: unknown; linkLabel?: unknown };

function clean(input: Input) {
  const courseId = input.courseId ? String(input.courseId) : null;
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  let linkHref = String(input.linkHref ?? "").trim();
  const linkLabel = String(input.linkLabel ?? "").trim();
  if (courseId && !COURSE_IDS.has(courseId)) return { error: "קורס לא מוכר." } as const;
  if (!title) return { error: "חסרה כותרת." } as const;
  if (title.length > 120) return { error: "הכותרת ארוכה מדי (עד 120 תווים)." } as const;
  if (body.length > 4000) return { error: "הטקסט ארוך מדי (עד 4000 תווים)." } as const;
  // A page of the site, written either as a path or as a full address of the site.
  if (linkHref) {
    try {
      const u = new URL(linkHref, "https://x.invalid");
      linkHref = `${u.pathname}${u.search}${u.hash}`;
    } catch {
      return { error: "הקישור לא תקין. כתבו נתיב באתר, למשל /study/ias19-map" } as const;
    }
    if (!linkHref.startsWith("/") || linkHref.startsWith("//") || linkHref.length > 300) return { error: "הקישור צריך להיות דף באתר, למשל /study/ias19-map" } as const;
  }
  return { course_id: courseId, title, body, link_href: linkHref || null, link_label: linkHref ? linkLabel.slice(0, 60) || null : null } as const;
}

/**
 * Publish what the site found changed in a course (the admin may have reworded it): its testers see it
 * the next time they open the site, and the course's lessons as they are now become the new starting point.
 */
export async function publishCourseChanges(input: Input & { courseId: string }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!canDecideHere()) return NOT_LIVE;
  const row = clean(input ?? {});
  if ("error" in row) return { ok: false, error: row.error as string };
  if (!row.course_id) return { ok: false, error: "קורס לא מוכר." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tester_updates").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  const { error: baseError } = await supabase
    .from("tester_content_baselines")
    .insert({ course_id: row.course_id, fingerprint: coursePrint(row.course_id), decision: "published", update_id: data.id });
  if (baseError) return { ok: false, error: `העדכון פורסם, אבל נקודת ההתחלה לא נשמרה: ${baseError.message}` };
  refresh();
  return { ok: true, id: data.id };
}

/** Not worth telling the testers (a typo, say): nothing is sent, and these changes won't be offered again. */
export async function skipCourseChanges(courseId: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!canDecideHere()) return NOT_LIVE;
  if (!COURSE_IDS.has(String(courseId))) return { ok: false, error: "קורס לא מוכר." };
  const supabase = await createClient();
  const { error } = await supabase.from("tester_content_baselines").insert({ course_id: courseId, fingerprint: coursePrint(courseId), decision: "skipped" });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** An update of the admin's own, for something the site can't see (a new feature, a fix in a component). */
export async function publishTesterUpdate(input: Input): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const row = clean(input ?? {});
  if ("error" in row) return { ok: false, error: row.error as string };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tester_updates").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id };
}

/** Fix a typo in an update. Testers who already saw it are not shown it again. */
export async function editTesterUpdate(input: Input & { id: string }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!UUID_RE.test(String(input?.id ?? ""))) return { ok: false, error: "עדכון לא מוכר." };
  const row = clean(input);
  if ("error" in row) return { ok: false, error: row.error as string };
  const supabase = await createClient();
  const { error } = await supabase.from("tester_updates").update(row).eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Remove an update: testers who haven't seen it won't. */
export async function deleteTesterUpdate(id: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!UUID_RE.test(String(id ?? ""))) return { ok: false, error: "עדכון לא מוכר." };
  const supabase = await createClient();
  const { error } = await supabase.from("tester_updates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
