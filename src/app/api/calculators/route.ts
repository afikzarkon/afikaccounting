import { CALCULATORS, toSchema } from "@/lib/engine/registry";

/** The JSON wizard definitions for every calculator. */
export async function GET() {
  return Response.json({ calculators: CALCULATORS.map(toSchema) });
}
