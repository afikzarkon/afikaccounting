import "server-only";
import { createServerClient } from "@supabase/ssr";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { AUTH_COOKIE_OPTIONS, SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/** Per-request client that reads and refreshes the user's auth cookies. */
export async function createClient() {
  const cookieStore = await cookies();
  // With a session cookie, the client checks the token's expiry against the clock as soon as it is made: io() keeps that read per request, out of the prerender.
  await io();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes the session on every request, so this is safe.
        }
      },
    },
  });
}
