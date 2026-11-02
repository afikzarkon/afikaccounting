export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Without Supabase credentials the site runs in demo mode: content comes from
 * the bundled seed data, the engine works fully, and sign-in is disabled.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Optional stand-in video used for lessons that have no recording uploaded yet. */
export const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

/**
 * Demo mode only: act as a reader on this plan ("free" or "courses"), to see
 * the locks and paywalls without Supabase. Unset, demo mode opens everything.
 * Ignored once Supabase is configured.
 */
export const ACCESS_PREVIEW_TIER = process.env.ACCESS_PREVIEW_TIER ?? "";

/** Auth cookie flags. Not HttpOnly: the admin's browser client reads the session for direct uploads. Secure whenever the site is served over HTTPS. */
export const AUTH_COOKIE_OPTIONS = { sameSite: "lax", secure: SITE_URL.startsWith("https://") } as const;

/** Show "Continue with Google" once the Google provider is enabled in Supabase (Authentication → Providers). */
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";
