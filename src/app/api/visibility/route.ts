import { getVisibility } from "@/lib/visibility/server";

/**
 * The hidden addresses, expanded (a course with its lessons), for the proxy to
 * block them. Not a secret — the menus are built from the same list — but it
 * keeps the lessons' content out of the proxy. Cached with the admin's changes.
 */
export async function GET() {
  const { links } = await getVisibility();
  return Response.json({ links }, { headers: { "cache-control": "no-store" } });
}
