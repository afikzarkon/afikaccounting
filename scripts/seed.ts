/**
 * Upserts the calculator schemas into Supabase.
 *   npm run db:seed
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (writes bypass RLS).
 */
import { createClient } from "@supabase/supabase-js";
import { CALCULATORS, toSchema } from "../src/lib/engine/registry";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const calculators = CALCULATORS.map((c) => ({
    slug: c.slug,
    standard: c.standard,
    title: c.title,
    category: c.category,
    schema: toSchema(c),
  }));
  const r2 = await db.from("accounting_calculators").upsert(calculators, { onConflict: "slug" });
  if (r2.error) throw r2.error;
  console.log(`✓ accounting_calculators: ${calculators.length} rows`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
