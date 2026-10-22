import { getCurrentUser } from "@/lib/auth/dal";
import { toRow } from "@/lib/analytics/events";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Stores one usage event. The body is untrusted: `toRow` whitelists and clamps
 * every field, and the table's insert policy only lets a visitor tag an event
 * with their own account. Always answers 204 so the tracker never retries.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return new Response(null, { status: 204 });
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
  const supabase = await createClient();
  await supabase.from("analytics_events").insert({ ...row, user_id: user?.id ?? null });
  return new Response(null, { status: 204 });
}
