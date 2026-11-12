"use server";

import { refresh } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";
import { EMAIL_RE } from "./types";

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };

/**
 * Mark an account as a course tester, by the email it signed up with: it gets the
 * floating feedback button and the feedback form (/tester). The database checks the
 * admin role again.
 */
export async function addTester(input: { email: string }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "כתובת אימייל לא תקינה." };

  const supabase = await createClient();
  const { data: userId, error: findError } = await supabase.rpc("admin_user_by_email", { p_email: email });
  if (findError) return { ok: false, error: findError.message };
  if (!userId) return { ok: false, error: "אין משתמש רשום עם האימייל הזה. הניסיין צריך להירשם לאתר קודם." };

  const { error } = await supabase.from("testers").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: String(userId) };
}

/** No longer a tester: the button and the form go away. What they wrote stays. */
export async function removeTester(userId: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("testers").delete().eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mark or unmark an account as a tester, from its row in /admin/users. */
export async function setTester(input: { userId: string; on: boolean }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const userId = String(input?.userId ?? "");
  if (!UUID_RE.test(userId)) return { ok: false, error: "משתמש לא מוכר." };
  const supabase = await createClient();
  const { error } = input.on
    ? await supabase.from("testers").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true })
    : await supabase.from("testers").delete().eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
