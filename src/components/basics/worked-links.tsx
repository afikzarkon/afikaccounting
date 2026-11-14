"use client";

import { type RefObject, useId, useLayoutEffect, useState } from "react";

/**
 * Where did this figure come from? A figure carried over from elsewhere in a
 * worked solution is a button (`data-lfrom`); tapping it draws one arrow from
 * where the figure first appears (`data-lid`, same id) and rings both ends.
 * A second tap, a tap elsewhere or Escape takes it away.
 *
 * The arrow keeps off the text: it runs down the left gutter, and a figure
 * in a table leaves and enters along the border between rows, so the line
 * never crosses another figure. A figure in a calculation sheet sits at the
 * left edge, so the line meets it straight from the side.
 */

type Box = { l: number; r: number; t: number; b: number };
type Drawn = { d: string; start: [number, number]; ends: Box[] };
const LANE = 6;

function measure(root: HTMLElement, dst: HTMLElement): Drawn | null {
  const src = root.querySelector<HTMLElement>(`[data-lid="${CSS.escape(dst.dataset.lfrom ?? "")}"]`);
  if (!src) return null;
  const o = root.getBoundingClientRect();
  // A figure half hidden in a table that scrolls sideways is met at the table's visible edge.
  const rect = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    const box = el.closest(".overflow-x-auto")?.getBoundingClientRect();
    const left = box ? Math.min(Math.max(r.left, box.left + 2), box.right - 2) : r.left;
    return { l: left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top };
  };
  const s = rect(src);
  const d = rect(dst);
  const sCell = src.closest("td");
  const dCell = dst.closest("td");
  let path: string;
  let start: [number, number];
  if (sCell) {
    start = [s.l + 2, s.b + 2];
    path = `M ${s.l + 2} ${s.b + 2} V ${rect(sCell).b} H ${LANE}`;
  } else {
    const y = (s.t + s.b) / 2;
    start = [s.l - 4, y];
    path = `M ${s.l - 4} ${y} H ${LANE}`;
  }
  if (dCell) {
    path += ` V ${rect(dCell).t} H ${d.l + 2} V ${d.t - 2}`;
  } else {
    const y = (d.t + d.b) / 2;
    path += ` V ${y} H ${d.l - 5}`;
  }
  return { d: path, start, ends: [rect(src), rect(dst)] };
}

export function LinkArrows({ root, on }: { root: RefObject<HTMLElement | null>; on: boolean }) {
  const [active, setActive] = useState<HTMLElement | null>(null);
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const marker = `arrow-${useId().replace(/:/g, "")}`;

  // Taps: on a carried figure, show its arrow (or hide it on a second tap); anywhere else, hide.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !on) return;
    const click = (e: MouseEvent) => {
      const hit = (e.target as Element).closest<HTMLElement>("[data-lfrom]");
      setActive((a) => (hit && hit !== a ? hit : null));
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    el.addEventListener("click", click);
    window.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("click", click);
      window.removeEventListener("keydown", key);
    };
  }, [root, on]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !on || !active) return;
    let frame = 0;
    const redraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize({ w: el.offsetWidth, h: el.offsetHeight });
        setDrawn(active.isConnected ? measure(el, active) : null);
      });
    };
    redraw();
    active.setAttribute("aria-pressed", "true");
    const ro = new ResizeObserver(redraw);
    ro.observe(el);
    el.addEventListener("scroll", redraw, true);
    window.addEventListener("resize", redraw);
    return () => {
      cancelAnimationFrame(frame);
      active.setAttribute("aria-pressed", "false");
      ro.disconnect();
      el.removeEventListener("scroll", redraw, true);
      window.removeEventListener("resize", redraw);
    };
  }, [root, on, active]);

  if (!on || !active || !drawn) return null;
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0 overflow-visible text-accent" width={size.w} height={size.h}>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9 z" className="fill-current" />
        </marker>
      </defs>
      {drawn.ends.map((b, i) => (
        <rect key={i} x={b.l - 4} y={b.t - 2} width={b.r - b.l + 8} height={b.b - b.t + 4} rx={4} fill="none" stroke="currentColor" strokeWidth={1.5} />
      ))}
      <path d={drawn.d} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" markerEnd={`url(#${marker})`} />
      <circle cx={drawn.start[0]} cy={drawn.start[1]} r={2.4} className="fill-current" />
    </svg>
  );
}
