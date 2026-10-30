"use client";

import { Sigma, X } from "lucide-react";
import { type ReactNode, useRef } from "react";

/**
 * The credit-loss formula kept a click away in every worked example: a button
 * that opens it in a window (Esc, the close button or a click outside closes it),
 * like the T-cards button. The formula itself comes in as `children`.
 */
export function FormulaDialog({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 text-[14px] font-bold text-amber-950 shadow-[0_6px_18px_-8px_rgb(245_158_11)] ring-1 ring-amber-500 transition hover:bg-amber-300 active:scale-95"
      >
        <Sigma className="h-4 w-4" aria-hidden /> הנוסחה של הפסדי אשראי
      </button>
      <dialog
        ref={dialog}
        aria-label="הנוסחה של הפסדי אשראי"
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/55"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-[16px] font-bold">הנוסחה של הפסדי אשראי</p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="סגירה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4 text-start">{children}</div>
      </dialog>
    </>
  );
}
