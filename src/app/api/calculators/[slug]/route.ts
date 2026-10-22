import { CALCULATORS, getCalculator, toSchema } from "@/lib/engine/registry";
import { sanitize, validateValues } from "@/lib/engine/validate";

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

/** One calculator's JSON schema. */
export async function GET(_request: Request, { params }: RouteContext<"/api/calculators/[slug]">) {
  const calc = getCalculator((await params).slug);
  if (!calc) return Response.json({ error: "מחשבון לא מוכר." }, { status: 404 });
  return Response.json(toSchema(calc));
}

/**
 * Solve a scenario: POST `{ "values": { ... } }`. Missing fields take their
 * defaults; invalid ones are reported per field with a 422.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/calculators/[slug]">) {
  const calc = getCalculator((await params).slug);
  if (!calc) return Response.json({ error: "מחשבון לא מוכר." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "גוף הבקשה חייב להיות JSON." }, { status: 400 });
  }
  const values = sanitize(calc, (body as { values?: unknown } | null)?.values);
  const errors = validateValues(calc, values);
  if (Object.keys(errors).length) return Response.json({ error: "נתונים לא תקינים.", fields: errors }, { status: 422 });

  try {
    return Response.json({ calculator: calc.slug, values, solution: calc.solve(values) });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "לא ניתן היה לחשב." }, { status: 500 });
  }
}
