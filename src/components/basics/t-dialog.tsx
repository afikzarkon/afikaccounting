"use client";

import { Columns2, X } from "lucide-react";
import { useRef } from "react";
import type { TAccount } from "@/lib/learn/basics";
import { TBox, THead } from "./t-accounts";

/**
 * T-accounts kept off the page until asked for: a button that opens them in a
 * window (a modal dialog — Esc, the close button or a click outside closes it),
 * so an entry takes its own room and no more.
 */
export function TCardsDialog({ cards, fresh, openingLabel, help = true }: { cards: TAccount[]; fresh?: string; openingLabel?: string; help?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const many = cards.length > 1;
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[13.5px] font-semibold text-fg transition hover:border-accent hover:text-accent"
      >
        <Columns2 className="h-4 w-4" aria-hidden /> {many ? `הצגת כרטיסי ה-T (${cards.length})` : "הצגת כרטיס ה-T"}
      </button>
      <dialog
        ref={dialog}
        aria-label={many ? "כרטיסי ה-T" : "כרטיס ה-T"}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/55"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-[16px] font-bold">{many ? "כרטיסי ה-T של הפקודה" : "כרטיס ה-T של הפקודה"}</p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="סגירה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">
          <THead n={cards.length} help={help} />
          <div className={many ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3" : "max-w-xs"}>
            {cards.map((t) => (
              <TBox key={t.account} t={t} fresh={fresh} openingLabel={openingLabel} />
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
