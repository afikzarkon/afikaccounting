import { getCurrentUser } from "@/lib/auth/dal";
import { ContentGuardView } from "./content-guard-view";

/**
 * Leak deterrents on the course and exam pages: a watermark naming the
 * signed-in reader, and no printing, copying, right-click, or clear view while
 * the window is in the background. A website can't stop a screenshot or a
 * phone camera; the watermark makes any leaked capture show whose it was.
 */
export async function ContentGuard() {
  const user = await getCurrentUser();
  return <ContentGuardView mark={user ? `${user.email} · ${user.id.slice(0, 8)}` : null} />;
}
