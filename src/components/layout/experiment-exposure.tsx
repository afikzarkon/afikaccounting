"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import { cookieOf } from "@/lib/experiments";

/**
 * Records that this visitor saw an experiment's page, once per tab, with their variant — the variant
 * page names its own; the control page reads the visitor's cookie (none: the experiment is off for them,
 * and nothing is recorded). /admin/funnel compares the variants by these.
 */
export function ExperimentExposure({ experiment, variant }: { experiment: string; variant?: string }) {
  useEffect(() => {
    const name = cookieOf(experiment);
    const v = variant ?? document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);
    if (!v) return;
    const key = `aa_exp_${experiment}`;
    try {
      if (sessionStorage.getItem(key) === v) return;
      sessionStorage.setItem(key, v);
    } catch {
      // Storage blocked: record it anyway.
    }
    track({ kind: "experiment_view", meta: { exp: experiment, variant: v } });
  }, [experiment, variant]);
  return null;
}
