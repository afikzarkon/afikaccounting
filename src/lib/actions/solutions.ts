"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { recordActivity } from "@/lib/data/user";
import { getCalculator } from "@/lib/engine/registry";
import { sanitize, validateValues } from "@/lib/engine/validate";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string; needsAuth?: boolean };

/**
 * Save a scenario. Inputs are re-validated and the solution re-computed here,
 * so the stored headline and metrics always match the stored inputs.
 */
export async function saveSolution(input: { slug: string; title: string; values: unknown; id?: string }): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needsAuth: true, error: "יש להתחבר כדי לשמור פתרונות." };

  const calc = getCalculator(input.slug);
  if (!calc) return { ok: false, error: "מחשבון לא מוכר." };
  const title = String(input.title ?? "").trim().slice(0, 120);
  if (!title) return { ok: false, error: "יש לתת לפתרון שם." };

  const values = sanitize(calc, input.values);
  const errors = validateValues(calc, values);
  if (Object.keys(errors).length) return { ok: false, error: "חלק מהנתונים אינם תקינים — יש לעבור שוב על שלבי האשף." };

  const solution = calc.solve(values);
  const row = {
    user_id: user.id,
    calculator_slug: calc.slug,
    title,
    inputs: values,
    headline: solution.headline,
    metrics: solution.metrics,
  };

  const supabase = await createClient();
  const result = input.id
    ? await supabase.from("saved_solutions").update(row).eq("id", input.id).eq("user_id", user.id).select("id").single()
    : await supabase.from("saved_solutions").insert(row).select("id").single();
  if (result.error) return { ok: false, error: result.error.message };

  await recordActivity("solution_saved", `נשמר ״${title}״ (${calc.standard})`, `/engine?solution=${result.data.id}`);
  return { ok: true, id: result.data.id };
}

export async function deleteSolution(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "יש להתחבר מחדש." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_solutions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("title")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (data) await recordActivity("solution_deleted", `נמחק ״${data.title}״`);
  refresh();
  return { ok: true };
}
