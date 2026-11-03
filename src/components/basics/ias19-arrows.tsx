"use client";

import { type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";

type Path = { d: string; color: string };

/**
 * Dashed arrows inside a figure, drawn like the course's other arrows: from
 * each element marked `data-arrow-from="k"` to the one marked
 * `data-arrow-to="k"` (several sources may share a target), in the colour of
 * the source's `data-arrow-color` (a CSS colour; the accent by default).
 * They need room: under `min` pixels wide they are not drawn, and the figure
 * must say the same thing without them — the colour and the circled number
 * on both ends.
 */
export function Arrows({ children, min = 640, className }: { children: ReactNode; min?: number; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();
  const [paths, setPaths] = useState<Path[]>([]);

  useLayoutEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const wide = window.matchMedia(`(min-width: ${min}px)`);
    const draw = () => {
      if (!wide.matches) return setPaths((prev) => (prev.length ? [] : prev));
      const at = box.getBoundingClientRect();
      const next: Path[] = [];
      for (const from of Array.from(box.querySelectorAll<HTMLElement>("[data-arrow-from]"))) {
        const key = from.dataset.arrowFrom!;
        const to = box.querySelector<HTMLElement>(`[data-arrow-to="${CSS.escape(key)}"]`);
        if (!to || !from.offsetParent || !to.offsetParent) continue;
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const color = from.dataset.arrowColor ?? "var(--accent)";
        // Side by side: from the source's inner edge to the target's. Stacked: from the source's foot to the target's head.
        if (b.top >= a.bottom - 4) {
          const sx = a.left - at.left + a.width / 2;
          const sy = a.bottom - at.top + 2;
          const ex = b.left - at.left + b.width / 2;
          const ey = b.top - at.top - 5;
          const bend = Math.max(14, (ey - sy) / 2);
          next.push({ color, d: `M ${sx} ${sy} C ${sx} ${sy + bend}, ${ex} ${ey - bend}, ${ex} ${ey}` });
        } else {
          const leftward = b.right <= a.left + 4;
          const sx = (leftward ? a.left : a.right) - at.left + (leftward ? -3 : 3);
          const sy = a.top - at.top + a.height / 2;
          const ex = (leftward ? b.right : b.left) - at.left + (leftward ? 6 : -6);
          const ey = b.top - at.top + b.height / 2;
          const bend = Math.max(18, Math.abs(ex - sx) / 2);
          next.push({ color, d: `M ${sx} ${sy} C ${sx + (leftward ? -bend : bend)} ${sy}, ${ex + (leftward ? bend : -bend)} ${ey}, ${ex} ${ey}` });
        }
      }
      // Only a real change re-renders: the arrows' own svg is inside the observed box.
      setPaths((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    // A step revealed later moves what is under it.
    const mo = new MutationObserver(draw);
    mo.observe(box, { childList: true, subtree: true });
    wide.addEventListener("change", draw);
    return () => {
      ro.disconnect();
      mo.disconnect();
      wide.removeEventListener("change", draw);
    };
  }, [min]);

  return (
    <div ref={wrap} className={className ? `relative ${className}` : "relative"}>
      {children}
      {paths.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {paths.map((p, i) => (
            <g key={i} style={{ color: p.color }}>
              <defs>
                <marker id={`${id}-${i}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              <path d={p.d} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeDasharray="6 5" markerEnd={`url(#${CSS.escape(id)}-${i})`} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
