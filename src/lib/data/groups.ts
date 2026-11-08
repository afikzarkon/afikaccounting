import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Study groups, read as the signed-in reader: row-level security returns only
 * the groups they belong to and those groups' members (see the habits_groups
 * migration), so nothing here filters by hand.
 */
export type Group = { id: string; name: string; course: string; exam_date: string | null; owner: string; invite_code: string };
export type Member = { user_id: string; display_name: string; share_progress: boolean; readiness: number | null; streak: number | null; studied_on: number | null };

export async function listMyGroups(): Promise<(Group & { members: number })[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("study_groups").select("id, name, course, exam_date, owner, invite_code, study_group_members(count)").order("created_at", { ascending: false });
  return (data ?? []).map((g) => {
    const { study_group_members, ...rest } = g as Group & { study_group_members: { count: number }[] };
    return { ...rest, members: study_group_members?.[0]?.count ?? 0 };
  });
}

export async function getGroup(id: string): Promise<{ group: Group; members: Member[] } | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: group } = await supabase.from("study_groups").select("id, name, course, exam_date, owner, invite_code").eq("id", id).maybeSingle();
  if (!group) return null;
  const { data: members } = await supabase
    .from("study_group_members")
    .select("user_id, display_name, share_progress, readiness, streak, studied_on")
    .eq("group_id", id)
    .order("joined_at");
  return { group: group as Group, members: (members ?? []) as Member[] };
}

export async function previewGroup(code: string): Promise<{ name: string; course: string; exam_date: string | null; members: number } | null> {
  if (!isSupabaseConfigured || !/^[a-z0-9]{10}$/i.test(code)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("study_group_preview", { p_code: code });
  return (data as { name: string; course: string; exam_date: string | null; members: number }[] | null)?.[0] ?? null;
}
