import { getCurrentUser, isAdmin } from "@/lib/auth/dal";
import { recordsEvents, toRow } from "@/lib/analytics/events";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Stores one usage event. The body is untrusted: `toRow` whitelists and clamps
 * every field, and the table's insert policy only lets a visitor tag an event
 * with their own account. Only the live site records (`recordsEvents`), and never
 * an admin's own visits. Always answers 204 so the tracker never retries.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured || !recordsEvents({ VERCEL_ENV: process.env.VERCEL_ENV, ANALYTICS_ANYWHERE: process.env.ANALYTICS_ANYWHERE })) return new Response(null, { status: 204 });
  const raw = await request.text();
  if (raw.length > 4000) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 204 });
  }
  const row = toRow(body, (body as { sessionId?: unknown })?.sessionId);
  if (!row) return new Response(null, { status: 204 });

  const user = await getCurrentUser();
  if (user && (await isAdmin())) return new Response(null, { status: 204 });
  const supabase = await createClient();
  await supabase.from("analytics_events").insert({ ...row, user_id: user?.id ?? null });
  return new Response(null, { status: 204 });
}
