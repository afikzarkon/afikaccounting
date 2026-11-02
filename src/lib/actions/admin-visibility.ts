"use server";

import { refresh, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { VISIBILITY_TAG, controlGroups } from "@/lib/visibility/server";
import type { AdminResult } from "./admin-media";

/** Every key the admin page offers; nothing else can be stored. */
function knownKeys() {
  const keys = new Map<string, boolean>();
  const walk = (items: ReturnType<typeof controlGroups>[number]["items"]) =>
    items.forEach((i) => {
      keys.set(i.key, !!i.renamable);
      if (i.children) walk(i.children);
    });
  controlGroups().forEach((g) => walk(g.items));
  return keys;
}

/**
 * Show or hide one thing on the site, or rename a button. The menus, the pages
 * and the search refresh at once; the proxy's block follows within 30 seconds.
 */
export async function setVisibility(input: { key: string; hidden: boolean; label?: string | null }): Promise<AdminResult> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: "אין הרשאת מנהל." };
  const renamable = knownKeys().get(input.key);
  if (renamable === undefined) return { ok: false, error: "פריט לא מוכר." };
  const label = renamable ? String(input.label ?? "").trim().slice(0, 80) || null : null;

  const supabase = await createClient();
  // Shown and not renamed is the default: no row at all.
  const { error } =
    !input.hidden && !label
      ? await supabase.from("site_visibility").delete().eq("key", input.key)
      : await supabase.from("site_visibility").upsert({ key: input.key, hidden: !!input.hidden, label, updated_at: new Date().toISOString(), updated_by: admin.id });
  if (error) return { ok: false, error: error.message };
  updateTag(VISIBILITY_TAG);
  refresh();
  return { ok: true };
}
