import type { TrackEvent } from "./events";

const KEY = "aa_session";
const VISITOR = "aa_visitor";
const ENTRY = "aa_entry";
const INTERNAL = "aa_internal";
const LAST_VIEW = "aa_last_view";
/** The same page again in the same tab within this long is a reload, not another view. */
export const RELOAD_WINDOW_MS = 30_000;

/**
 * A browser that has opened the admin is the team's, not a visitor's: from then on it records
 * nothing, signed in or not (components/admin/mark-internal.tsx sets it).
 */
export function markInternal() {
  try {
    localStorage.setItem(INTERNAL, "1");
  } catch {}
}

function isInternal() {
  try {
    return localStorage.getItem(INTERNAL) === "1";
  } catch {
    return false;
  }
}

/** Whether a page view repeats the last one in this tab within the reload window. Pure, so it is tested. */
export function isReload(last: { path: string; at: number } | null, path: string, now: number) {
  return !!last && last.path === path && now - last.at >= 0 && now - last.at < RELOAD_WINDOW_MS;
}

/** A page view in this tab: false when it only reloads the last one (a reload loop, a refresh). */
function freshView(path: string) {
  try {
    const raw = sessionStorage.getItem(LAST_VIEW);
    const last = raw ? (JSON.parse(raw) as { path: string; at: number }) : null;
    const now = Date.now();
    if (isReload(last, path, now)) return false;
    sessionStorage.setItem(LAST_VIEW, JSON.stringify({ path, at: now }));
  } catch {}
  return true;
}

/** The kind of device, from the screen and the pointer: enough to tell phones from computers. */
function deviceKind() {
  try {
    const w = Math.min(window.screen.width, window.screen.height);
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && w < 600) return "mobile";
    if (touch) return "tablet";
    return "desktop";
  } catch {
    return "unknown";
  }
}

/** A random id per browser tab, kept for the tab's lifetime. Counts sessions, identifies no one. */
function sessionId() {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "no-storage-session";
  }
}

/**
 * A random id per browser, kept in local storage, so a return visit on another
 * day is counted as the same visitor (day-2 and day-7 return). It identifies no
 * one and is never linked to an account unless the visitor signs in.
 */
function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Record a usage event. Fire-and-forget: it never throws, never blocks the UI,
 * and survives navigation (sendBeacon). Admin pages are not tracked.
 */
export function track(event: TrackEvent) {
  if (typeof window === "undefined") return;
  const path = event.path ?? window.location.pathname;
  if (path.startsWith("/admin") || isInternal()) return;
  if (event.kind === "page_view" && !freshView(path)) return;
  try {
    const v = visitorId();
    const meta = v ? { v, ...event.meta } : event.meta;
    const body = JSON.stringify({ ...event, meta, path, sessionId: sessionId() });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // Analytics must never break the page.
  }
}

const SOURCE_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"] as const;

/**
 * Where this visit came from: the campaign tags and ?ref= in the address, and the
 * referring site (another site only, by host). Pure, so it is tested.
 */
export function entrySource(search: string, referrer: string, ownHost: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const k of SOURCE_KEYS) {
    const v = params.get(k)?.trim();
    if (v) out[k] = v.slice(0, 80);
  }
  try {
    const host = referrer ? new URL(referrer).host : "";
    if (host && host !== ownHost) out.referrer = host.slice(0, 80);
  } catch {
    // Not a URL: no referrer.
  }
  return out;
}

/**
 * The first page of a visit (one per tab), on whatever page it lands — home, a lesson,
 * an exam shared in a group — with where it came from. Later navigations in the tab are not entries.
 */
export function trackEntry() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(ENTRY)) return;
    sessionStorage.setItem(ENTRY, "1");
  } catch {
    // Storage blocked: count it anyway.
  }
  track({ kind: "landing_view", meta: { ...entrySource(window.location.search, document.referrer, window.location.host), device: deviceKind() } });
}
