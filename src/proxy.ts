import { NextResponse, type NextRequest } from "next/server";
import { assign, cookieOf, experimentFor } from "@/lib/experiments";
import { updateSession } from "@/lib/supabase/proxy";

const NINETY_DAYS = 60 * 60 * 24 * 90;

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  return withExperiment(request, response);
}

/**
 * An A/B experiment on this page (lib/experiments.ts): the visitor's variant, kept in a cookie, and —
 * for any variant but the control — its prerendered page served at this same address. A redirect from
 * the session (sign-in, a replaced session) goes through untouched.
 */
function withExperiment(request: NextRequest, response: NextResponse) {
  const e = experimentFor(request.nextUrl.pathname);
  if (!e || (response.status >= 300 && response.status < 400)) return response;
  const { variant, store } = assign(e, request.cookies.get(cookieOf(e.id))?.value, request.nextUrl.search, Math.random());
  let out = response;
  if (variant !== e.variants[0].id) {
    const url = request.nextUrl.clone();
    url.pathname = `/x/${e.id}/${variant}`;
    out = NextResponse.rewrite(url, { request });
    // Keep what the session step set: refreshed auth cookies and the device id.
    response.cookies.getAll().forEach((c) => out.cookies.set(c));
  }
  if (store) out.cookies.set(cookieOf(e.id), variant, { maxAge: NINETY_DAYS, sameSite: "lax", path: "/" });
  return out;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|resources/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv|txt)$).*)",
  ],
};
