import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import type { ApprovalStatus, GateState } from "@/lib/gate";
import { securityLog } from "@/lib/security-log";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string };

export type Profile = {
  id: string;
  fullName: string;
  organization: string;
  jobTitle: string;
  preferredStandard: string;
  createdAt: string;
};

/** The signed-in user, verified from the session JWT. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: String(data.claims.email ?? "") };
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * Whether the signed-in user is an admin, read from their own profile row. The
 * database enforces the same rule through `public.is_admin()` in every admin
 * policy, so this check gates the UI and the actions, not the data alone.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
});

/** For admin pages: guests go to sign-in, signed-in non-admins to the home page. */
export async function requireAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!(await isAdmin())) redirect("/?denied=admin");
  return user;
}

/** For admin Server Actions: never redirects, so the caller can report the failure. */
export async function assertAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (user && (await isAdmin())) return user;
  securityLog("admin_denied", { user: user?.id ?? null });
  return null;
}

/**
 * The closed site's view of the reader (lib/gate.ts): signed in or not, admin,
 * approval, and the courses granted. The proxy decides with the same call; if it
 * fails (the migration hasn't run), the account counts as not approved.
 */
export const getGateState = cache(async (): Promise<GateState> => {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false };
  const supabase = await createClient();
  const [{ data }, admin] = await Promise.all([supabase.rpc("access_state"), isAdmin()]);
  const d = (data ?? {}) as { status?: unknown; courses?: unknown };
  const status: ApprovalStatus = d.status === "approved" || d.status === "rejected" ? d.status : "pending";
  const courses = Array.isArray(d.courses) ? d.courses.filter((c): c is string => typeof c === "string") : [];
  return { signedIn: true, admin, status, courses };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, organization, job_title, preferred_standard, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    organization: data.organization,
    jobTitle: data.job_title,
    preferredStandard: data.preferred_standard,
    createdAt: data.created_at,
  };
});

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  const s = typeof value === "string" ? value : "";
  // Browsers drop tabs and newlines and read "\" as "/", so "/\t/evil.com" would leave the site: refuse both anywhere.
  return s.startsWith("/") && !s.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(s) ? s : fallback;
}
