import "server-only";
import { getCurrentUser } from "@/lib/auth/dal";
import type { Metric } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";

/*
 * Every function resolves the user itself and relies on row-level security,
 * so a caller can never ask for another user's data.
 */

export type SavedSolution = {
  id: string;
  calculatorSlug: string;
  title: string;
  headline: string;
  metrics: Metric[];
  inputs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ActivityEvent = { id: number; kind: string; label: string; href: string | null; createdAt: string };

type SolutionRow = {
  id: string;
  calculator_slug: string;
  title: string;
  headline: string;
  metrics: Metric[];
  inputs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const toSolution = (r: SolutionRow): SavedSolution => ({
  id: r.id,
  calculatorSlug: r.calculator_slug,
  title: r.title,
  headline: r.headline,
  metrics: r.metrics ?? [],
  inputs: r.inputs ?? {},
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listSavedSolutions(limit = 50): Promise<SavedSolution[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_solutions")
    .select("id, calculator_slug, title, headline, metrics, inputs, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as SolutionRow[]).map(toSolution);
}

export async function getSavedSolution(id: string): Promise<SavedSolution | null> {
  const user = await getCurrentUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_solutions")
    .select("id, calculator_slug, title, headline, metrics, inputs, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? toSolution(data as SolutionRow) : null;
}

export async function listActivity(limit = 15): Promise<ActivityEvent[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("id, kind, label, href, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data.map((r) => ({ id: r.id, kind: r.kind, label: r.label, href: r.href, createdAt: r.created_at }));
}

export async function recordActivity(kind: string, label: string, href: string | null = null) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  // Activity is best-effort: never fail the user's action because logging failed.
  await supabase.from("activity_events").insert({ user_id: user.id, kind, label: label.slice(0, 200), href });
}
