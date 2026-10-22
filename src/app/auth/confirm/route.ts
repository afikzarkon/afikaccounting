import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/dal";
import { recordActivity } from "@/lib/data/user";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase email links (sign-up confirmation, password
 * reset). Exchanges the one-time token for a session, then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const fail = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?error=${encodeURIComponent(reason)}`;
    return NextResponse.redirect(url);
  };

  if (!isSupabaseConfigured) return fail("ההתחברות אינה מוגדרת.");
  if (!tokenHash || !type) return fail("הקישור אינו שלם.");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return fail("תוקף הקישור פג או שכבר נעשה בו שימוש.");

  if (type === "signup" || type === "email") await recordActivity("account_confirmed", "אימות כתובת האימייל");

  const url = request.nextUrl.clone();
  url.pathname = next.split("?")[0];
  url.search = next.includes("?") ? next.slice(next.indexOf("?")) : "";
  return NextResponse.redirect(url);
}
