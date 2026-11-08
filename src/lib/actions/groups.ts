"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type GroupFormState = { error?: string };

const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A new study group for one course; its creator is the first member. */
export async function createGroup(_: GroupFormState, form: FormData): Promise<GroupFormState> {
  if (!isSupabaseConfigured) return { error: "קבוצות דורשות חיבור לחשבון." };
  if (!(await getCurrentUser())) redirect("/login?next=/groups");
  const name = clean(form.get("name"), 60);
  const course = clean(form.get("course"), 40);
  const exam = clean(form.get("exam_date"), 10);
  const display = clean(form.get("display_name"), 40);
  if (!name) return { error: "תנו לקבוצה שם." };
  if (!display) return { error: "איך יקראו לכם בקבוצה?" };
  if (!TOPICS.some((t) => t.id === course && t.format === "lessons")) return { error: "בחרו קורס." };
  if (exam && !DATE.test(exam)) return { error: "תאריך המבחן לא תקין." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_study_group", { p_name: name, p_course: course, p_exam_date: exam || null, p_display_name: display });
  const id = (data as { id: string }[] | null)?.[0]?.id;
  if (error || !id) return { error: error?.message.includes("too many") ? "אפשר לפתוח עד 10 קבוצות." : "לא הצלחנו לפתוח את הקבוצה. נסו שוב." };
  redirect(`/groups/${id}`);
}

/** Join a group by its invite code. */
export async function joinGroup(_: GroupFormState, form: FormData): Promise<GroupFormState> {
  if (!isSupabaseConfigured) return { error: "קבוצות דורשות חיבור לחשבון." };
  const code = clean(form.get("code"), 10).toLowerCase();
  if (!(await getCurrentUser())) redirect(`/login?next=${encodeURIComponent(`/groups/join/${code}`)}`);
  const display = clean(form.get("display_name"), 40);
  if (!display) return { error: "איך יקראו לכם בקבוצה?" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_study_group", { p_code: code, p_display_name: display });
  if (error || !data) return { error: error?.message.includes("full") ? "הקבוצה מלאה (עד 30 חברים)." : "הקישור לא תקין, או שהקבוצה נסגרה." };
  redirect(`/groups/${data as string}`);
}

/** Leave a group (the owner deletes it instead, with everyone in it). */
export async function leaveGroup(groupId: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured) return;
  const supabase = await createClient();
  const { data: g } = await supabase.from("study_groups").select("owner").eq("id", groupId).maybeSingle();
  if (g?.owner === user.id) await supabase.from("study_groups").delete().eq("id", groupId);
  else await supabase.from("study_group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
  revalidatePath("/groups");
  redirect("/groups");
}

export type MemberUpdate = { share_progress?: boolean; readiness?: number; streak?: number; studied_on?: number | null; display_name?: string };

/** The reader's own row in a group: whether they share their progress, and its latest snapshot. */
export async function updateMyMember(groupId: string, u: MemberUpdate): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured) return { ok: false };
  const row: Record<string, unknown> = {};
  if (typeof u.share_progress === "boolean") row.share_progress = u.share_progress;
  if (Number.isInteger(u.readiness) && u.readiness! >= 0 && u.readiness! <= 100) row.readiness = u.readiness;
  if (Number.isInteger(u.streak) && u.streak! >= 0 && u.streak! <= 400) row.streak = u.streak;
  if (u.studied_on === null || (Number.isInteger(u.studied_on) && u.studied_on! > 0)) row.studied_on = u.studied_on;
  if (typeof u.display_name === "string" && u.display_name.trim()) row.display_name = u.display_name.trim().slice(0, 40);
  if (!Object.keys(row).length) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("study_group_members").update(row).eq("group_id", groupId).eq("user_id", user.id);
  return { ok: !error };
}

/** The owner sets (or clears) the group's exam date. */
export async function setGroupExamDate(groupId: string, date: string | null): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured || (date !== null && !DATE.test(date))) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("study_groups").update({ exam_date: date }).eq("id", groupId).eq("owner", user.id);
  revalidatePath(`/groups/${groupId}`);
  return { ok: !error };
}
