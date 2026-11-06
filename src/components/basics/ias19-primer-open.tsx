"use client";

import { useEffect } from "react";

/** Opens the card the address points at (#primer-…), on arrival and whenever the hash changes, and scrolls to it. */
export function PrimerHashOpen() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id.startsWith("primer-")) return;
      const card = document.getElementById(id);
      if (!(card instanceof HTMLDetailsElement)) return;
      card.open = true;
      card.scrollIntoView({ block: "start" });
    };
    // On arrival, after the page has settled: the browser and the router scroll on their own first.
    const t = window.setTimeout(open, 150);
    window.addEventListener("hashchange", open);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", open);
    };
  }, []);
  return null;
}
