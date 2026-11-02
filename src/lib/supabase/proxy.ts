import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE, DEVICE_COOKIE_OPTIONS, claimArgs, signInContext } from "@/lib/auth/session";
import { AUTH_COOKIE_OPTIONS, SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import { securityLog } from "@/lib/security-log";
import { isLinkHidden } from "@/lib/visibility/rules";

/**
 * What the admin hid, kept for 30 seconds per server instance, so blocking a
 * page costs a request only twice a minute. Read from the site's own endpoint:
 * expanding a course to its lessons needs the lessons, which the proxy
 * shouldn't carry. On failure, nothing is blocked.
 */
let hiddenCache: { at: number; links: string[] } | null = null;
async function hiddenLinks(origin: string) {
  if (hiddenCache && Date.now() - hiddenCache.at < 30_000) return hiddenCache.links;
  try {
    const res = await fetch(`${origin}/api/visibility`, { cache: "no-store" });
    const links = res.ok ? ((await res.json()) as { links?: string[] }).links ?? [] : [];
    hiddenCache = { at: Date.now(), links };
  } catch {
    hiddenCache = { at: Date.now(), links: hiddenCache?.links ?? [] };
  }
  return hiddenCache.links;
}

/** Paths never blocked: the API (and the list itself), sign-in, the admin. */
const NEVER_HIDDEN = ["/api/", "/auth/", "/admin", "/login", "/register", "/_next/"];

// Signed-in only. /admin additionally checks the admin role in its pages and actions.
const PROTECTED = ["/dashboard", "/profile", "/admin"];
const GUEST_ONLY = ["/login", "/register", "/forgot-password"];

/**
 * Refresh the auth session on every request, turn away a session that was
 * replaced by a sign-in elsewhere, and gate protected routes. Pages and
 * actions still verify the user themselves — this is the first line, not the
 * only one.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims: it refreshes the token.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  // A device id for this browser, kept on whatever response goes back.
  const knownDevice = request.cookies.get(DEVICE_COOKIE)?.value;
  const deviceId = knownDevice ?? crypto.randomUUID();
  const finish = (res: NextResponse) => {
    if (!knownDevice) res.cookies.set(DEVICE_COOKIE, deviceId, { ...DEVICE_COOKIE_OPTIONS, secure: AUTH_COOKIE_OPTIONS.secure });
    return res;
  };

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = params ? `?${new URLSearchParams(params)}` : "";
    const redirect = NextResponse.redirect(url);
    // Carry refreshed auth cookies across the redirect.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return finish(redirect);
  };

  // One live session per account. Before the migration runs, the call fails and nothing is enforced.
  if (signedIn && data?.claims.session_id) {
    const { data: status } = await supabase.rpc("session_status");
    if (status === "unclaimed") {
      // Signed in before single sessions began: this session takes the account.
      await supabase.rpc("claim_session", claimArgs(signInContext(request.headers, deviceId)));
    } else if (status === "replaced") {
      securityLog("session_replaced", { user: data.claims.sub, path: pathname });
      await supabase.auth.signOut({ scope: "local" });
      // A page goes to sign-in with the reason; an action or fetch just continues signed out.
      if (request.method === "GET") return redirectTo("/login", { reason: "elsewhere", next: pathname + search });
      return finish(response);
    }
  }

  // A page the admin hid is not found — except for an admin, who can still open it.
  if (request.method === "GET" && !NEVER_HIDDEN.some((p) => pathname.startsWith(p))) {
    const links = await hiddenLinks(request.nextUrl.origin);
    if (links.length && isLinkHidden(links, pathname + search)) {
      const { data: admin } = signedIn ? await supabase.rpc("is_admin") : { data: false };
      if (!admin) {
        const hidden = NextResponse.rewrite(new URL("/_hidden", request.url), { status: 404 });
        response.cookies.getAll().forEach((c) => hidden.cookies.set(c));
        return finish(hidden);
      }
    }
  }

  if (!signedIn && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return redirectTo("/login", { next: pathname + search });
  }
  if (signedIn && GUEST_ONLY.includes(pathname)) {
    return redirectTo("/dashboard");
  }
  return finish(response);
}
