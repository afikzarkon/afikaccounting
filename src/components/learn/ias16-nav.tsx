"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type NavPart = { id: string; label: string };

/**
 * The page's anchor menu, kept at the top while reading. The section in view is
 * marked, and the bar scrolls sideways on a phone.
 */
export function Ias16Nav({ parts }: { parts: NavPart[] }) {
  const [active, setActive] = useState(parts[0]?.id);
  useEffect(() => {
    const els = parts.map((p) => document.getElementById(p.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        // The topmost section that has crossed the band below the sticky bars.
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [parts]);
  useEffect(() => {
    document.getElementById(`nav-${active}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  return (
    <nav aria-label="נושאי הדף" className="no-print sticky top-16 z-30 -mx-4 border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-2">
      <ol className="flex gap-1 overflow-x-auto">
        {parts.map((p, i) => (
          <li key={p.id} className="shrink-0">
            <a
              id={`nav-${p.id}`}
              href={`#${p.id}`}
              aria-current={active === p.id ? "location" : undefined}
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                active === p.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <span className={cn("num text-[11px] font-bold", active === p.id ? "text-accent-fg/80" : "text-accent")}>{i + 1}</span>
              {p.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
