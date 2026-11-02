import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/dal";
import { DEVICE_COOKIE, claimNewSession, signInContext } from "@/lib/auth/session";
import { recordActivity } from "@/lib/data/user";
import { isSupabaseConfigured } from "@/lib/env";
import { securityLog } from "@/lib/security-log";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Google (through Supabase) sends the reader back: exchanges the code
 * for a session, claims the account for it — signing out any other device —
 * and continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const fail = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?error=${encodeURIComponent(reason)}`;
    return NextResponse.redirect(url);
  };

  const code = searchParams.get("code");
  if (!isSupabaseConfigured) return fail("ההתחברות אינה מוגדרת.");
  if (searchParams.get("error") || !code) {
    securityLog("oauth_failed", { provider: "google", reason: searchParams.get("error") ?? "no code" });
    return fail("ההתחברות עם Google לא הושלמה. נסו שוב.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    securityLog("oauth_failed", { provider: "google", reason: error?.code ?? "no session" });
    return fail("ההתחברות עם Google לא הושלמה. נסו שוב.");
  }

  await claimNewSession(data.session.access_token, signInContext(request.headers, request.cookies.get(DEVICE_COOKIE)?.value));
  // A first sign-in with Google is the account being created.
  const created = data.user.created_at && Date.now() - Date.parse(data.user.created_at) < 60_000;
  if (created) await recordActivity("account_confirmed", "הרשמה עם Google");

  const url = request.nextUrl.clone();
  url.pathname = next.split("?")[0];
  url.search = next.includes("?") ? next.slice(next.indexOf("?")) : "";
  return NextResponse.redirect(url);
}
