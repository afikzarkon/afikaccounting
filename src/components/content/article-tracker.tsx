"use client";

import { useEffect } from "react";
import { recordProgress } from "@/lib/actions/history";

/** Marks an article as read once the reader reaches its end. */
export function ArticleTracker({ slug, seconds }: { slug: string; seconds: number }) {
  useEffect(() => {
    recordProgress(slug, 0, false).catch(() => {});
    const sentinel = document.getElementById("article-end");
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      recordProgress(slug, seconds, true).catch(() => {});
      io.disconnect();
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [slug, seconds]);

  return null;
}
