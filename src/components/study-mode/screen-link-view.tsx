"use client";

import Link from "next/link";
import { createContext, type ReactNode, useContext } from "react";
import { lessonHref } from "@/lib/study/paths";

/** The open lesson, so a link to one of its own screens moves there instead of reloading. */
export const LessonContext = createContext<{ slug: string; jump: (screen: string) => void } | null>(null);

/**
 * The browser's half of a screen link: a button inside its own lesson, a link from anywhere else.
 * The screen's title and lesson are looked up on the server (see ScreenLink), so the course catalog
 * never ships to the browser.
 */
export function ScreenLinkView({ id, slug, children }: { id: string; slug: string; children: ReactNode }) {
  const lesson = useContext(LessonContext);
  const className = "font-medium text-accent hover:underline";
  if (lesson?.slug === slug)
    return (
      <button type="button" onClick={() => lesson.jump(id)} className={className}>
        {children}
      </button>
    );
  return (
    <Link href={lessonHref(slug, id)} className={className}>
      {children}
    </Link>
  );
}
