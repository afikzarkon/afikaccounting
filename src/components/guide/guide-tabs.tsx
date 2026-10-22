"use client";

import { type KeyboardEvent, type ReactNode, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export type GuideTab = { id: string; label: string; blurb: string; icon: ReactNode; panel: ReactNode };

// The open tab lives in the URL hash, so a link can point straight at a topic.
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));

export function GuideTabs({ tabs }: { tabs: GuideTab[] }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const active = tabs.some((t) => t.id === hash) ? hash : tabs[0].id;

  const select = (id: string) => {
    history.replaceState(history.state, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    // Right-to-left: the left arrow moves forward.
    const next = { ArrowLeft: i + 1, ArrowRight: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const id = tabs[(next + tabs.length) % tabs.length].id;
    select(id);
    document.getElementById(`tab-${id}`)?.focus();
  };

  return (
    <div>
      <div className="no-print sticky top-16 z-30 -mx-4 bg-canvas/85 px-4 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="נושאי המדריך" onKeyDown={onKeyDown} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {tabs.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(t.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors",
                  on ? "border-accent/50 bg-surface shadow-card ring-1 ring-accent/30" : "border-line bg-surface/60 hover:bg-surface",
                )}
              >
                <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", on ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent")}>
                  {t.icon}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-semibold", on ? "text-fg" : "text-muted")}>{t.label}</span>
                  <span className="hidden text-xs text-subtle sm:block">{t.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((t) => (
        <section
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          className={cn("mt-6 space-y-4", t.id !== active && "hidden print:block")}
        >
          {t.panel}
        </section>
      ))}
    </div>
  );
}
