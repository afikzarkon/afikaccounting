"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { getContent } from "@/lib/data/content";
import { recordActivity } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";

/**
 * Record how far the user got through a lesson. Called by the video player
 * (throttled) and once when an article is opened. Silently ignored for guests.
 */
export async function recordProgress(slug: string, seconds: number, completed: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  const item = await getContent(slug);
  if (!item) return;

  const progress = Math.max(0, Math.min(Math.round(Number(seconds) || 0), item.durationSeconds || 0));
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("watch_history")
    .select("completed")
    .eq("user_id", user.id)
    .eq("content_id", item.id)
    .maybeSingle();

  const { error } = await supabase.from("watch_history").upsert(
    {
      user_id: user.id,
      content_id: item.id,
      progress_seconds: progress,
      completed: Boolean(completed) || existing?.completed === true,
      last_viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,content_id" },
  );
  if (error) return;

  const verb = item.kind === "video" ? "נצפה" : "נקרא";
  if (!existing) await recordActivity("content_started", `התחלת ״${item.title}״`, `/content/${item.slug}`);
  else if (completed && !existing.completed) await recordActivity("content_completed", `${verb} ״${item.title}״`, `/content/${item.slug}`);
}
