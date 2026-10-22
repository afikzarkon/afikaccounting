import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import type { Values } from "@/lib/engine/types";
import { createPublicClient } from "@/lib/supabase/public";

export type Preset = { id: string; calculatorSlug: string; title: string; description: string; inputs: Values };

/** Published presets for every calculator, in display order. Cached; admin edits update the "presets" tag. */
export async function listPublishedPresets(): Promise<Preset[]> {
  "use cache";
  cacheTag("presets");
  cacheLife("hours");
  if (!isSupabaseConfigured) return [];

  const { data, error } = await createPublicClient()
    .from("scenario_presets")
    .select("id, calculator_slug, title, description, inputs")
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at");
  // Before the admin migration is applied the table does not exist yet: no presets, not an error page.
  if (error) return [];
  return data.map((r) => ({ id: r.id, calculatorSlug: r.calculator_slug, title: r.title, description: r.description, inputs: r.inputs }));
}
