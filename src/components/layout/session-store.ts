"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Tier } from "@/lib/pricing";

/**
 * Who is reading, as far as the browser needs to know it: signed in or a guest,
 * and the plan. Free lessons are prerendered without reading the session, so the
 * navbar (which reads it anyway, behind its own boundary) marks it here, and a
 * lesson's client parts read it — e.g. to offer a guest to save their mistakes.
 * Until the mark arrives the state is unknown, and nothing depends on a guess.
 */
export type Session = { known: false } | { known: true; signedIn: boolean; tier: Tier };

const UNKNOWN: Session = { known: false };
let current: Session = UNKNOWN;
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useSession(): Session {
  return useSyncExternalStore(subscribe, () => current, () => UNKNOWN);
}

/** Rendered by the navbar once it knows the session. Renders nothing. */
export function SessionMark({ signedIn, tier }: { signedIn: boolean; tier: Tier }) {
  useEffect(() => {
    if (current.known && current.signedIn === signedIn && current.tier === tier) return;
    current = { known: true, signedIn, tier };
    for (const l of listeners) l();
  }, [signedIn, tier]);
  return null;
}
