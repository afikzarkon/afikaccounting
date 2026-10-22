"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

/** A dialog on the native <dialog> element: focus trap, Escape and backdrop come with it. */
export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-card backdrop:bg-black/50 backdrop:backdrop-blur-sm ${wide ? "max-w-3xl" : "max-w-lg"}`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-base font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="סגירה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">{open && children}</div>
    </dialog>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Comma-separated tags as typed, to a clean list. */
export const parseTags = (s: string) => [...new Set(s.split(/[,،]/).map((t) => t.trim()).filter(Boolean))];
