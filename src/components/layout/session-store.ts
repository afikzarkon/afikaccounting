"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import type { Tier } from "@/lib/pricing";

/**
 * Who is reading, as far as the browser needs to know it: signed in or a guest,
 * and the plan. Free lessons are prerendered without reading the session, so the
 * navbar (which reads it anyway, behind its own boundary) marks it here, and a
 * lesson's client parts read it — e.g. to offer a guest to save their mistakes.
 * Until the mark arrives the state is unknown, and nothing depends on a guess.
 */
export type Session =
  | { known: false }
  | {
      known: true;
      signedIn: boolean;
      tier: Tier;
      /**
       * The closed site (lib/gate.ts): "all" for an admin, who sees the whole site;
       * otherwise the courses this account may open (none for a guest or an account
       * not approved), and the site's general menus stay hidden.
       */
      scope: "all" | readonly string[];
    };

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
export function SessionMark({ signedIn, tier, scope = [] }: { signedIn: boolean; tier: Tier; scope?: "all" | readonly string[] }) {
  // A string stands for the scope, so a new array with the same courses doesn't re-run the effect.
  const key = scope === "all" ? "all" : scope.join(",");
  useEffect(() => {
    const next = key === "all" ? "all" : key ? key.split(",") : [];
    const same = current.known && (current.scope === "all" ? "all" : current.scope.join(",")) === key;
    if (current.known && current.signedIn === signedIn && current.tier === tier && same) return;
    current = { known: true, signedIn, tier, scope: next };
    for (const l of listeners) l();
  }, [signedIn, tier, key]);
  return null;
}

/**
 * The site's general navigation — menus, search, footer links, the mobile tab bar —
 * only for a reader who may roam the whole site (an admin). On the closed site
 * everyone else sees just their own courses, so it stays hidden until the session
 * says otherwise; the proxy refuses those pages either way.
 */
export function FullSiteOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const session = useSession();
  return session.known && session.scope === "all" ? children : fallback;
}
