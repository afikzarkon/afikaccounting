import { getCurrentUser } from "@/lib/auth/dal";
import { markCode } from "@/lib/watermark";
import { ContentGuardView } from "./content-guard-view";

/**
 * Leak deterrents on the course and exam pages: hidden marks carrying the
 * signed-in reader's code (see lib/watermark.ts), and no printing, copying,
 * right-click, or clear view while the window is in the background. A website
 * can't stop a screenshot or a phone camera; the marks show whose it was.
 */
export async function ContentGuard() {
  const user = await getCurrentUser();
  return <ContentGuardView code={user ? markCode(user.id) : null} />;
}
