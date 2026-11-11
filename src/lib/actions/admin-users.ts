"use server";

import { refresh } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { securityLog } from "@/lib/security-log";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };
const STATUSES = new Set(["pending", "approved", "rejected"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Approve, reject or return an account to pending, with the courses it may open.
 * Only catalog courses are accepted; an account that isn't approved keeps none.
 * The database checks the admin role again (public.admin_set_access).
 */
export async function setUserAccess(input: { userId: string; status: string; courses: string[] }): Promise<AdminResult> {
  const admin = await assertAdmin();
  if (!admin) return DENIED;
  const userId = String(input?.userId ?? "");
  const status = String(input?.status ?? "");
  if (!UUID_RE.test(userId)) return { ok: false, error: "משתמש לא מוכר." };
  if (!STATUSES.has(status)) return { ok: false, error: "סטטוס לא מוכר." };
  if (userId === admin.id) return { ok: false, error: "אי אפשר לשנות את ההרשאות של החשבון שלכם." };
  const known = new Set(TOPICS.map((t) => t.id));
  const requested = Array.isArray(input?.courses) ? input.courses.map(String) : [];
  if (requested.some((c) => !known.has(c))) return { ok: false, error: "קורס לא מוכר." };
  const courses = status === "approved" ? [...new Set(requested)] : [];
  if (status === "approved" && !courses.length) return { ok: false, error: "כדי לאשר, בחרו לפחות קורס אחד." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_access", { p_user: userId, p_status: status, p_courses: courses });
  if (error) return { ok: false, error: error.message };
  securityLog("access_changed", { by: admin.id, user: userId, status, courses });
  refresh();
  return { ok: true, id: userId };
}
