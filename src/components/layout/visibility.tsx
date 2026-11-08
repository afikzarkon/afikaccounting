"use client";

import { createContext, useContext } from "react";
import { NOTHING_HIDDEN, type Visibility, isHidden, isLinkHidden, labelOf } from "@/lib/visibility/rules";

const VisibilityContext = createContext<Visibility>(NOTHING_HIDDEN);

/** What the admin hid, for the browser's menus and buttons; the root layout reads it once (cached) and passes it here. */
export function VisibilityProvider({ value, children }: { value: Visibility; children: React.ReactNode }) {
  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
}

/** Its children only while an address is shown: for a link, or a note about it, in a part of the page the server renders. */
export function WhenLinkShown({ href, children }: { href: string; children: React.ReactNode }) {
  const v = useContext(VisibilityContext);
  return isLinkHidden(v.links, href) ? null : children;
}

export function useVisibility() {
  const v = useContext(VisibilityContext);
  return {
    visibility: v,
    /** Whether a key ("cta:…", "plan:…", "home:…") or an address is shown. */
    shown: (key: string) => !isHidden(v, key),
    linkShown: (href: string) => !isLinkHidden(v.links, href),
    label: (key: string, fallback: string) => labelOf(v, key, fallback),
  };
}
