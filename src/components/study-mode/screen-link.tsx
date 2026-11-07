import type { ReactNode } from "react";
import { findScreen } from "@/lib/study";
import { ScreenLinkView } from "./screen-link-view";

export { LessonContext } from "./screen-link-view";

/**
 * A link to a concept screen of the course, named by its title (or by `children`).
 * A server component: it finds the screen in the catalog here, so only the title and the lesson's slug reach the browser.
 */
export function ScreenLink({ id, children }: { id: string; children?: ReactNode }) {
  const hit = findScreen(id);
  if (!hit) throw new Error(`Unknown screen ${id}`);
  return (
    <ScreenLinkView id={id} slug={hit.module.slug}>
      {children ?? <>״{hit.title}״</>}
    </ScreenLinkView>
  );
}
