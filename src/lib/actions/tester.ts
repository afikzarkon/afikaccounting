"use server";

import { getCurrentUser, isTester } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { type FormState, sanitizeState } from "@/lib/tester/form";
import { createClient } from "@/lib/supabase/server";

/**
 * The tester's feedback form, kept in their account (public.tester_feedback) so it
 * reaches the team without being sent by hand and follows the tester to every device.
 * The browser keeps its own copy and the newer of the two wins (lib/tester/store.ts).
 * Only an account an admin marked as a tester stores anything; anyone else (an admin
 * previewing the form, say) keeps it in the browser.
 */
export async function loadFeedback(): Promise<{ canSave: boolean; state: FormState | null }> {
  if (!isSupabaseConfigured) return { canSave: false, state: null };
  const user = await getCurrentUser();
  if (!user || !(await isTester())) return { canSave: false, state: null };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tester_feedback").select("answers").eq("user_id", user.id).maybeSingle();
  if (error || !data) return { canSave: true, state: null };
  return { canSave: true, state: sanitizeState(data.answers) };
}

export async function saveFeedback(raw: unknown): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured) return { ok: false };
  const user = await getCurrentUser();
  if (!user || !(await isTester())) return { ok: false };
  const state = sanitizeState(raw);
  if (!state) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("tester_feedback").upsert({ user_id: user.id, answers: state }, { onConflict: "user_id" });
  return { ok: !error };
}
