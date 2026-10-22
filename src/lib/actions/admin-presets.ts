"use server";

import { refresh, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { getCalculator } from "@/lib/engine/registry";
import { sanitize, validateValues } from "@/lib/engine/validate";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";

export type PresetInput = {
  calculatorSlug: string;
  title: string;
  description: string;
  inputs: unknown;
  sortOrder: number;
  isPublished: boolean;
};

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };

/**
 * Create (no id) or update a preset. The inputs are cleaned against the
 * calculator's schema and must pass its validation, so a preset always loads
 * into a scenario the engine can solve.
 */
export async function savePreset(input: PresetInput, id?: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const calc = getCalculator(input.calculatorSlug);
  if (!calc) return { ok: false, error: "מחשבון לא מוכר." };
  const title = String(input.title ?? "").trim().slice(0, 120);
  if (!title) return { ok: false, error: "חסרה כותרת." };
  if (!input.inputs || typeof input.inputs !== "object") return { ok: false, error: "הנתונים אינם אובייקט JSON." };

  const inputs = sanitize(calc, input.inputs);
  const errors = validateValues(calc, inputs);
  const first = Object.entries(errors)[0];
  if (first) return { ok: false, error: `התרחיש אינו תקין (${first[0]}): ${first[1]}` };

  const row = {
    calculator_slug: calc.slug,
    title,
    description: String(input.description ?? "").trim().slice(0, 600),
    inputs,
    sort_order: Math.round(Number(input.sortOrder) || 0),
    is_published: Boolean(input.isPublished),
  };
  const supabase = await createClient();
  const res = id
    ? await supabase.from("scenario_presets").update(row).eq("id", id).select("id").single()
    : await supabase.from("scenario_presets").insert(row).select("id").single();
  if (res.error) return { ok: false, error: res.error.message };
  updateTag("presets");
  refresh();
  return { ok: true, id: res.data.id };
}

export async function deletePreset(id: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("scenario_presets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("presets");
  refresh();
  return { ok: true };
}
