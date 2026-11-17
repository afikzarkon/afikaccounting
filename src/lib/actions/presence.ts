"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in account is on the site now, on this page (public.user_presence; /admin/users shows it).
 * Quiet on failure, and a no-op before the migration (20261117010000) runs.
 */
export async function touchPresence(path: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const user = await getCurrentUser();
  if (!user) return;
  const page = typeof path === "string" && path.startsWith("/") ? path.slice(0, 300) : null;
  const supabase = await createClient();
  await supabase.from("user_presence").upsert({ user_id: user.id, last_active_at: new Date().toISOString(), path: page }, { onConflict: "user_id" });
}
