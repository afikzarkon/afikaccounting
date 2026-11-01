"use client";

import { useEffect } from "react";
import { loadProgress, saveProgress } from "@/lib/actions/progress";
import { isEmptyTopic, isLessonSlug, topicKey } from "@/lib/study/sync";
import { mergeAccountTopics, onProgressChange, readTopics } from "./progress-store";

/** Quiet time after the last change before it is sent: a burst of answers goes as one write. */
const DELAY = 1500;

/**
 * Keeps a signed-in reader's lesson progress in their account. On arrival it
 * reads the account's copy and joins it into this browser's (nothing from this
 * device is lost, and nothing from another); from then on, every lesson that
 * changes is sent back after a quiet moment, and at once when the tab is hidden.
 * Nothing is sent before the account's copy is in, so a fresh device never
 * overwrites what another wrote. Renders nothing; the navbar mounts it for a
 * signed-in reader only.
 */
export function ProgressSync({ userId }: { userId: string }) {
  useEffect(() => {
    let alive = true;
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // What the account holds, per lesson, as far as this tab knows: a lesson is sent only when it differs.
    const stored = new Map<string, string>();

    const push = () => {
      if (!ready) return;
      clearTimeout(timer);
      const changed = Object.entries(readTopics()).filter(([slug, p]) => isLessonSlug(slug) && !isEmptyTopic(p) && stored.get(slug) !== topicKey(p));
      if (!changed.length) return;
      for (const [slug, p] of changed) stored.set(slug, topicKey(p));
      saveProgress(changed.map(([slug, progress]) => ({ slug, progress })))
        .then((r) => {
          // Not stored: the next change tries these lessons again.
          if (!r.ok) for (const [slug] of changed) stored.delete(slug);
        })
        .catch(() => {
          for (const [slug] of changed) stored.delete(slug);
        });
    };

    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(push, DELAY);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") push();
    };

    const stop = onProgressChange(later);
    document.addEventListener("visibilitychange", onHide);

    loadProgress()
      .then((account) => {
        if (!alive || !account) return;
        for (const [slug, p] of Object.entries(account)) stored.set(slug, topicKey(p));
        ready = true;
        mergeAccountTopics(account, userId);
        // What this device had and the account didn't goes up now.
        push();
      })
      .catch(() => {});

    return () => {
      alive = false;
      push();
      stop();
      document.removeEventListener("visibilitychange", onHide);
      clearTimeout(timer);
    };
  }, [userId]);
  return null;
}
