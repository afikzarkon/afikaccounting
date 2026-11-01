"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { STUDY_MODULES } from "@/lib/study";
import type { TopicProgress } from "@/lib/study/score";
import { sanitizeTopic } from "@/lib/study/sync";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in reader's lesson progress, kept in their account so it follows
 * them to every device. The browser merges it with its own copy on arrival
 * (study-mode/progress-sync.tsx) and sends back the lessons that change.
 * Without an account — or without Supabase — there is nothing to read or write,
 * and progress stays in the browser as before.
 */
export async function loadProgress(): Promise<Record<string, TopicProgress> | null> {
  if (!isSupabaseConfigured) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("lesson_progress").select("slug, progress").eq("user_id", user.id);
  // Before the migration runs, the account simply has no progress yet.
  if (error) return null;
  return Object.fromEntries((data ?? []).filter((r) => r.slug in STUDY_MODULES).map((r) => [r.slug, sanitizeTopic(r.progress)]));
}

/** Store the lessons whose progress changed: only lessons the site has, each in its checked shape. */
export async function saveProgress(entries: { slug: string; progress: unknown }[]): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured || !Array.isArray(entries) || entries.length === 0) return { ok: false };
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const rows = entries
    .slice(0, Object.keys(STUDY_MODULES).length)
    .filter((e) => typeof e?.slug === "string" && e.slug in STUDY_MODULES)
    .map((e) => ({ user_id: user.id, slug: e.slug, progress: sanitizeTopic(e.progress) }));
  if (!rows.length) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_progress").upsert(rows, { onConflict: "user_id,slug" });
  return { ok: !error };
}
