"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

/** Records one page view per navigation. Renders nothing. */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track({ kind: "page_view", path: pathname });
  }, [pathname]);
  return null;
}
