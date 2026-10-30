"use client";

import { Split } from "lucide-react";
import { type ReactNode, useState } from "react";
import { type Entry, ledger } from "@/lib/learn/basics";
import { TBox, THead } from "./t-accounts";
import { JE } from "./ui";

/**
 * One event, two ways to write it: a single compound entry, or the same as
 * separate entries — the reader switches between them. Either way the
 * T-accounts are the same, which is the point.
 */
export function EntryViews({ title, compound, split, note }: { title: ReactNode; compound: Entry; split: Entry[]; note?: ReactNode }) {
  const [apart, setApart] = useState(false);
  const shown = apart ? split : [compound];
  const cards = ledger(shown);
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface-2/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[16px] font-bold text-fg">{title}</p>
        <button
          type="button"
          onClick={() => setApart(!apart)}
          aria-pressed={apart}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent-soft px-3 text-[13.5px] font-semibold text-accent ring-1 ring-accent/50 transition hover:ring-accent"
        >
          <Split className="h-4 w-4" aria-hidden /> {apart ? "להציג כפקודה אחת" : `להציג כ${split.length === 2 ? "שתי" : split.length} פקודות נפרדות`}
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-2">
          {shown.map((x) => (
            <JE key={x.id} entry={x} note={null} />
          ))}
        </div>
        <div className="min-w-0">
          <THead n={cards.length} />
          <div className="grid grid-cols-2 gap-2.5">
            {cards.map((t) => (
              <TBox key={t.account} t={t} />
            ))}
          </div>
        </div>
      </div>
      {note && !apart && <p className="rounded-lg bg-surface px-3 py-2 text-[14.5px] text-fg">{note}</p>}
    </section>
  );
}
