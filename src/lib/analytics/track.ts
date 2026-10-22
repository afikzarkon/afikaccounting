import type { TrackEvent } from "./events";

const KEY = "aa_session";

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
 * Record a usage event. Fire-and-forget: it never throws, never blocks the UI,
 * and survives navigation (sendBeacon). Admin pages are not tracked.
 */
export function track(event: TrackEvent) {
  if (typeof window === "undefined") return;
  const path = event.path ?? window.location.pathname;
  if (path.startsWith("/admin")) return;
  try {
    const body = JSON.stringify({ ...event, path, sessionId: sessionId() });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // Analytics must never break the page.
  }
}
