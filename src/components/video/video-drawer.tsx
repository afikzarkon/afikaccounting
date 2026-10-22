"use client";

import { ArrowUpLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect } from "react";
import { VideoPlayer, type PlayableItem } from "./video-player";

/**
 * Slide-over that plays an explainer next to the tool the user is working in,
 * so they never lose their place in the wizard.
 */
export function VideoDrawer({
  item,
  startAt,
  open,
  onClose,
}: {
  item: PlayableItem | null;
  startAt: number;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
            aria-label={`סרטון הסבר: ${item.title}`}
            className="glass fixed inset-y-0 end-0 z-50 flex w-full max-w-[520px] flex-col border-y-0 border-e-0 shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
          >
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-accent">סרטון הסבר</p>
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
              <Link
                href={`/content/${item.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                לשיעור המלא <ArrowUpLeft className="h-4 w-4" />
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
