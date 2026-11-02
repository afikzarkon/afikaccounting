import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * One live session per account (see supabase/migrations/…_single_session.sql).
 * Every sign-in claims the account for its new session and signs the account
 * out everywhere else; the proxy turns away a session that was replaced.
 */

/** A random id this browser keeps, so the admin can tell devices apart. */
export const DEVICE_COOKIE = "aa_device";
export const DEVICE_COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 400 * 24 * 60 * 60 } as const;

/** "Chrome · Windows" from a user agent; good enough to read in the admin's list. */
export function deviceLabel(userAgent: string) {
  const ua = userAgent || "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /SamsungBrowser/.test(ua)
        ? "Samsung"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : /Safari\//.test(ua)
              ? "Safari"
              : "דפדפן אחר";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "מערכת אחרת";
  return `${browser} · ${os}`;
}

export type SignInContext = { deviceId: string; userAgent: string; country: string };

/** claim_session's arguments for a request. */
export const claimArgs = (c: SignInContext) => ({
  p_device_id: c.deviceId.slice(0, 64),
  p_device: deviceLabel(c.userAgent),
  p_country: c.country.slice(0, 2),
});

/** The request's sign-in context, from its headers and the device cookie. */
export function signInContext(headers: Headers, deviceId: string | undefined): SignInContext {
  return { deviceId: deviceId ?? "", userAgent: headers.get("user-agent") ?? "", country: headers.get("x-vercel-ip-country") ?? "" };
}

/**
 * After a sign-in: claim the account for this new session, then sign the
 * account out of every other session (their refresh tokens are revoked; the
 * proxy turns their remaining access token away). Uses the new session's own
 * token, so it doesn't depend on cookies written earlier in the same request.
 * Before the migration runs, the claim fails quietly and nothing changes.
 */
export async function claimNewSession(accessToken: string, context: SignInContext) {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.rpc("claim_session", claimArgs(context));
  if (error) {
    console.error(JSON.stringify({ event: "auth.claim_session_failed", code: error.code, error: error.message }));
    return;
  }
  // The user's own token, not the service key: GoTrue signs out the caller's other sessions.
  await client.auth.admin.signOut(accessToken, "others").catch(() => {});
}
