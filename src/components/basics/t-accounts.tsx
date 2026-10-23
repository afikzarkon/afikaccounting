"use client";

import { useState } from "react";
import { KITS, ledger } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { EntryView, TCard } from "./ui";

/** Posts the science-kit entries one by one into their T-accounts. */
export function TAccountsWidget() {
  const [n, setN] = useState(3);
  const entries = KITS.entries.slice(0, n);
  const accounts = ledger(entries);
  const last = entries.at(-1)!;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-sm font-semibold text-fg">כמה פקודות להעביר לכרטיסים?</p>
        <div className="flex flex-wrap gap-1" role="group" aria-label="מספר הפקודות שהועברו">
          {KITS.entries.map((e, i) => (
            <button
              key={e.id}
              type="button"
              aria-pressed={n === i + 1}
              onClick={() => setN(i + 1)}
              className={cn("num h-8 min-w-8 rounded-lg px-2 text-xs font-semibold", n === i + 1 ? "bg-accent text-accent-fg" : i < n ? "bg-accent-soft text-accent" : "bg-surface text-muted ring-1 ring-line hover:text-fg")}
            >
              {e.id}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0">
          <p className="text-sm text-muted">הפקודה האחרונה שהועברה — השורות שלה מודגשות בכרטיסים:</p>
          <EntryView entry={last} title={`${last.id}. ${last.text}`} note={null} />
        </div>
        <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2" aria-live="polite">
          {accounts.map((t) => (
            <TCard key={t.account} t={t} highlight={last.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
