"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { touchPresence } from "@/lib/actions/presence";

const EVERY = 60_000;

/**
 * For a signed-in account (components/layout/presence-gate.tsx): tells the site it is here about once a
 * minute while a tab is in view, and on every new page, so /admin/users can say who is active right now.
 */
export function PresencePing() {
  const pathname = usePathname();
  const last = useRef(0);
  const path = useRef(pathname);

  useEffect(() => {
    path.current = pathname;
    // A new page counts at once (but not twice in a few seconds).
    if (Date.now() - last.current > 10_000 && document.visibilityState === "visible") {
      last.current = Date.now();
      void touchPresence(pathname).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible" || Date.now() - last.current < EVERY - 5_000) return;
      last.current = Date.now();
      void touchPresence(path.current).catch(() => {});
    };
    const id = setInterval(ping, EVERY);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
