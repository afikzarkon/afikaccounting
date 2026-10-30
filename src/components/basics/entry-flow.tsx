"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { type Entry, ledger } from "@/lib/learn/basics";
import { TBox } from "./t-accounts";
import { JE } from "./ui";

type Arrow = { d: string; side: "dr" | "cr" };

/**
 * A journal entry, and under it the T-accounts it lands in, with an arrow from
 * each line of the entry to the amount it put in its card: debit lines to the
 * right-hand side, credit lines to the left. Two by two: the entry, and the
 * arrows' way down beside it; under the entry `aside` (an explanation), and
 * beside it the cards, in panels of one height. Arrows need the columns side
 * by side; on a narrow screen everything stacks — entry, aside, cards — without them.
 */
export function EntryFlow({ entry, note, aside }: { entry: Entry; note?: ReactNode; aside?: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const cards = ledger([entry]);
  // The entry's lines as JE draws them: debits first, then credits.
  const lines = [...entry.lines.filter((l) => l.dr), ...entry.lines.filter((l) => l.cr)];

  useLayoutEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const draw = () => {
      if (!wide.matches) return setArrows([]);
      const at = box.getBoundingClientRect();
      const rows = Array.from(box.querySelectorAll<HTMLElement>("[data-entry] li"));
      const next: Arrow[] = [];
      lines.forEach((l, k) => {
        const side = l.dr ? "dr" : "cr";
        const from = rows[k]?.getBoundingClientRect();
        const to = box
          .querySelector<HTMLElement>(`[data-account="${CSS.escape(l.account)}"] [data-side="${side}"] [data-ref="${CSS.escape(entry.id)}"]`)
          ?.getBoundingClientRect();
        if (!from || !to) return;
        // From the line's far (left) end, down to the top of the amount it posted.
        const sx = from.left - at.left - 4;
        const sy = from.top - at.top + from.height / 2;
        const ex = to.left - at.left + to.width / 2;
        const ey = to.top - at.top - 6;
        next.push({ side, d: `M ${sx} ${sy} C ${sx - 70} ${sy}, ${ex} ${ey - 90}, ${ex} ${ey}` });
      });
      setArrows(next);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    wide.addEventListener("change", draw);
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", draw);
    };
    // The entry is fixed for the life of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  return (
    <div ref={wrap} className="relative grid gap-4 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-14">
      <div data-entry className="min-w-0">
        <JE entry={entry} note={note} />
      </div>
      {/* The arrows' way down, beside the entry. */}
      <div className="hidden lg:block" aria-hidden />
      {aside && <div className="min-w-0 [&>*]:h-full">{aside}</div>}
      {/* The cards first, where the arrows land; the caption under them, out of the arrows' way. */}
      <figure className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          {cards.map((t) => (
            <TBox key={t.account} t={t} fresh={entry.id} />
          ))}
        </div>
        <figcaption className="text-center font-bold text-fg">{cards.length > 1 ? "כרטיסי ה-T של הפקודה" : "כרטיס ה-T של הפקודה"}</figcaption>
      </figure>
      {arrows.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            {(["dr", "cr"] as const).map((s) => (
              <marker key={s} id={`entry-flow-head-${s}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className={s === "dr" ? "fill-debit" : "fill-credit"} />
              </marker>
            ))}
          </defs>
          {arrows.map((a, i) => (
            <path
              key={i}
              d={a.d}
              fill="none"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeDasharray="6 5"
              markerEnd={`url(#entry-flow-head-${a.side})`}
              className={a.side === "dr" ? "stroke-debit" : "stroke-credit"}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
