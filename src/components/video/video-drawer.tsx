"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { VideoPlayer, type PlayableItem } from "./video-player";

/**
 * Slide-over that plays a lesson's video next to the screen the learner is on,
 * so they never lose their place in the lesson.
 */
export function VideoDrawer({
  item,
  startAt,
  open,
  onClose,
  label = "סרטון הסבר",
}: {
  item: PlayableItem | null;
  startAt: number;
  open: boolean;
  onClose: () => void;
  /** The small line above the title. */
  label?: string;
}) {
  useEffect(() => {
    if (!open) return;
    // Esc closes the video only; the page behind (a lesson that leaves on Esc) is told the key was used.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && item && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] lg:bg-slate-950/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${label}: ${item.title}`}
            className="glass fixed inset-y-0 end-0 z-50 flex w-full max-w-[520px] flex-col border-y-0 border-e-0 shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
          >
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-accent">{label}</p>
                <p className="mt-1 truncate font-medium text-fg">{item.title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                autoFocus
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                aria-label="סגירת הסרטון"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {/* Keyed so opening at a new timestamp restarts the player there. */}
              <VideoPlayer key={`${item.slug}-${startAt}`} item={item} startAt={startAt} layout="stacked" />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
