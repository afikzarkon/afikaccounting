"use client";

import { type KeyboardEvent, type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact tabs. Every panel stays in the page and is only hidden on screen,
 * so a panel can still be printed on its own (the cheat sheet does).
 */
export function Tabs({ tabs, label }: { tabs: { id: string; label: string; content: ReactNode }[]; label: string }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0].id);
  const i = tabs.findIndex((t) => t.id === active);
  const onKey = (e: KeyboardEvent) => {
    // Right to left: ← is the next tab.
    const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="no-print grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 sm:flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${base}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={t.id === active ? 0 : -1}
            onClick={() => setActive(t.id)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              t.id === active ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          className={cn("mt-3", t.id === active ? "anim-step-in" : "hidden print:block")}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
