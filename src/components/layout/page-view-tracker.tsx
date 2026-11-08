"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track, trackEntry } from "@/lib/analytics/track";

/** Records one page view per navigation, and the visit's entry (its first page and its source) once per tab. Renders nothing. */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackEntry();
    track({ kind: "page_view", path: pathname });
  }, [pathname]);
  return null;
}
