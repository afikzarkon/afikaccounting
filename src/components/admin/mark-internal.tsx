"use client";

import { useEffect } from "react";
import { markInternal } from "@/lib/analytics/track";

/** Opening the admin marks this browser as the team's: its visits to the site stop counting. Renders nothing. */
export function MarkInternal() {
  useEffect(() => markInternal(), []);
  return null;
}
