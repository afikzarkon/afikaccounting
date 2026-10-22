import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Browser client that carries the user's session cookie. Used only for direct
 * uploads to Storage, so large files never pass through the Next.js server;
 * the bucket's policies decide who may write.
 */
export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
