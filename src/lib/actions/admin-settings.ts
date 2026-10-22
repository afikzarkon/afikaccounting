"use server";

import { refresh } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";

/** Delete usage events older than `days` days (kept at 30 at the least). */
export async function purgeEvents(days: number): Promise<AdminResult & { deleted?: number }> {
  if (!(await assertAdmin())) return { ok: false, error: "אין הרשאת מנהל." };
  const keep = Math.max(30, Math.round(Number(days) || 0));
  const before = new Date(Date.now() - keep * 86_400_000).toISOString();
  const supabase = await createClient();
  const { error, count } = await supabase.from("analytics_events").delete({ count: "exact" }).lt("created_at", before);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, deleted: count ?? 0 };
}
