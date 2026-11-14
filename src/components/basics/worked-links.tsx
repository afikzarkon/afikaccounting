"use client";

import { type RefObject, useId, useLayoutEffect, useState } from "react";

/**
 * Arrows that carry a figure from where it first appears in a worked
 * solution to every place that uses it. A figure is marked `data-lid`, and a
 * place that carries it over `data-lfrom` with the same id.
 *
 * The arrows keep off the text: each runs down its own lane in the left
 * gutter. A figure in a table leaves and enters along the border between
 * rows, so the line never crosses another figure; a figure in a calculation
 * sheet sits at the left edge, so the line meets it straight from the side.
 */

type Arrow = { d: string; start: [number, number] };
const LANE = 5;

function visible(el: Element) {
  const box = el.closest(".overflow-x-auto");
  if (!box) return true;
  const r = el.getBoundingClientRect();
  const c = box.getBoundingClientRect();
  return r.right > c.left + 2 && r.left < c.right - 2;
}

function measure(root: HTMLElement): Arrow[] {
  const o = root.getBoundingClientRect();
  // A figure half hidden in a table that scrolls sideways is met at the table's visible edge.
  const rect = (el: Element) => {
    const r = el.getBoundingClientRect();
    const box = el.closest(".overflow-x-auto")?.getBoundingClientRect();
    const left = box ? Math.max(r.left, box.left + 2) : r.left;
    return { l: left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top };
  };
  const sources = new Map<string, Element>();
  root.querySelectorAll<HTMLElement>("[data-lid]").forEach((el) => {
    if (!sources.has(el.dataset.lid!)) sources.set(el.dataset.lid!, el);
  });
  const pairs: { id: string; src: Element; dst: Element }[] = [];
  root.querySelectorAll<HTMLElement>("[data-lfrom]").forEach((dst) => {
    const src = sources.get(dst.dataset.lfrom!);
    if (src && visible(src) && visible(dst)) pairs.push({ id: dst.dataset.lfrom!, src, dst });
  });

  // One lane per source figure, reused once the figure's arrows are done with it.
  const spans = new Map<string, [number, number]>();
  for (const p of pairs) {
    const ys = [rect(p.src).t, rect(p.dst).b];
    const s = spans.get(p.id) ?? [Infinity, -Infinity];
    spans.set(p.id, [Math.min(s[0], ...ys), Math.max(s[1], ...ys)]);
  }
  const lanes: number[] = [];
  const laneOf = new Map<string, number>();
  [...spans.entries()]
    .sort((a, b) => a[1][0] - b[1][0])
    .forEach(([id, [top, bottom]]) => {
      let k = lanes.findIndex((end) => end < top - 4);
      if (k === -1) k = lanes.push(bottom) - 1;
      else lanes[k] = bottom;
      laneOf.set(id, k);
    });

  return pairs.map(({ id, src, dst }) => {
    const lane = laneOf.get(id)!;
    const x = LANE + lane * LANE;
    // Two arrows into the same row would share its border; each lane runs a little lower, so they stay apart.
    const shift = (lane % 3) * 2;
    const s = rect(src);
    const d = rect(dst);
    const sCell = src.closest("td");
    const dCell = dst.closest("td");
    let path: string;
    let start: [number, number];
    if (sCell) {
      const gap = rect(sCell).b - shift;
      start = [s.l + 2, s.b];
      path = `M ${s.l + 2} ${s.b} V ${gap} H ${x}`;
    } else {
      const y = (s.t + s.b) / 2;
      start = [s.l - 2, y];
      path = `M ${s.l - 2} ${y} H ${x}`;
    }
    if (dCell) {
      const gap = rect(dCell).t + shift;
      path += ` V ${gap} H ${d.l + 2} V ${d.t}`;
    } else {
      const y = (d.t + d.b) / 2;
      path += ` V ${y} H ${d.l - 3}`;
    }
    return { d: path, start };
  });
}

export function LinkArrows({ root, on }: { root: RefObject<HTMLElement | null>; on: boolean }) {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const marker = `arrow-${useId().replace(/:/g, "")}`;

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !on) return;
    let frame = 0;
    const redraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize({ w: el.offsetWidth, h: el.offsetHeight });
        setArrows(measure(el));
      });
    };
    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(el);
    el.addEventListener("scroll", redraw, true);
    window.addEventListener("resize", redraw);
    void document.fonts?.ready.then(redraw);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener("scroll", redraw, true);
      window.removeEventListener("resize", redraw);
    };
  }, [root, on]);

  if (!on || !arrows.length) return null;
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0 overflow-visible text-accent" width={size.w} height={size.h}>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9 z" className="fill-current" />
        </marker>
      </defs>
      {arrows.map((a, i) => (
        <g key={i} opacity={0.75}>
          <path d={a.d} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" markerEnd={`url(#${marker})`} />
          <circle cx={a.start[0]} cy={a.start[1]} r={2.2} className="fill-current" />
        </g>
      ))}
    </svg>
  );
}
