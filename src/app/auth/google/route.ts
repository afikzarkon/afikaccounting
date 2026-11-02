import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/dal";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * "Continue with Google": starts Supabase's OAuth flow and sends the browser
 * to Google. The PKCE verifier is kept in a cookie; /auth/callback finishes.
 * A link, not a form, so the CSP's form-action stays 'self'.
 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const fail = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?error=${encodeURIComponent(reason)}`;
    return NextResponse.redirect(url);
  };
  if (!isSupabaseConfigured) return fail("ההתחברות אינה מוגדרת.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
      // Let a reader with several Google accounts choose, rather than reuse the last one silently.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) return fail("לא הצלחנו להתחיל התחברות עם Google.");
  return NextResponse.redirect(data.url);
}
