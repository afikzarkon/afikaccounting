"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider as NextThemes } from "next-themes";
import type { ReactNode } from "react";

/**
 * Light or dark as the reader's device is set — long reading of dense Hebrew text is easier on a light page for
 * most people, and a reader who prefers dark already has their device set so. The switch in the header overrides it.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* Every animation on the site follows the reader's "reduce motion" setting (lessons already did; now the home page, review and checks too). */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemes>
  );
}
