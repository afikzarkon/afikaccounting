"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { type Habits, sanitizeHabits } from "@/lib/study/habits";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in reader's study habits (study days, exam dates) and their
 * reminder choice, kept in the account so the streak and the countdown follow
 * them to every device. Merged with the browser's copy by progress-sync.tsx.
 */
export async function loadHabits(): Promise<(Habits & { reminders: boolean }) | null> {
  if (!isSupabaseConfigured) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("study_habits").select("days, exams, reminders").eq("user_id", user.id).maybeSingle();
  if (error) return null;
  return { ...sanitizeHabits(data ?? {}), reminders: !!data?.reminders };
}

export async function saveHabits(habits: unknown): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured) return { ok: false };
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("study_habits").upsert({ user_id: user.id, ...sanitizeHabits(habits) }, { onConflict: "user_id" });
  return { ok: !error };
}

/** Turn study reminders by email on or off (off by default). */
export async function setReminders(on: boolean): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured) return { ok: false };
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("study_habits").upsert({ user_id: user.id, reminders: on === true }, { onConflict: "user_id" });
  return { ok: !error };
}
