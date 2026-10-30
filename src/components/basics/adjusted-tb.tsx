"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { type Balances, trialBalance } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

/** An account an adjustment reduced, and the account the amount went to. */
export type Move = { from: string; to: string };
type Arrow = { d: string; side: "dr" | "cr" };

const CUTOFF = /(מראש|לשלם|לקבל)$/;

/**
 * The trial balance after the adjustments, read against the one before: an
 * account the adjustments opened is tagged new; one that changed shows its old
 * amount struck out beside the new one; and a dashed arrow — drawn like the
 * entry-to-cards arrows — runs from each account an adjustment reduced to the
 * amount it went to, coloured by that amount's side.
 */
export function AdjustedTrialBalance({ before, after, moves, caption }: { before: Balances; after: Balances; moves: Move[]; caption: ReactNode }) {
  const tb = trialBalance(after);
  const wrap = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  useLayoutEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const draw = () => {
      const at = box.getBoundingClientRect();
      const amount = (a: string) => box.querySelector<HTMLElement>(`[data-amount="${CSS.escape(a)}"]`)?.getBoundingClientRect();
      setArrows(
        moves.flatMap((m, i) => {
          const from = amount(m.from);
          const to = amount(m.to);
          if (!from || !to) return [];
          // From the far (left) end of the reduced amount, a curve out into the margin and back to the amount it went to;
          // each arrow bulges a little further out, so they do not run over one another.
          const sx = from.left - at.left - 6;
          const sy = from.top - at.top + from.height / 2;
          const ex = to.left - at.left - 8;
          const ey = to.top - at.top + to.height / 2;
          const out = Math.min(sx, ex) - 70 - i * 18;
          return [{ side: after[m.to] > 0 ? "dr" : "cr", d: `M ${sx} ${sy} C ${out} ${sy}, ${out} ${ey}, ${ex} ${ey}` }];
        }),
      );
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [moves, after]);

  const cell = (v: number, side: "dr" | "cr", account: string) => {
    const now = side === "dr" ? Math.max(v, 0) : Math.max(-v, 0);
    const was = before[account] ?? 0;
    const old = side === "dr" ? Math.max(was, 0) : Math.max(-was, 0);
    if (!now) return null;
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
        {account in before && old !== now && (
          <>
            <Money v={old} plain className="text-[12.5px] text-muted line-through decoration-danger/70" />
            <span className="text-subtle" aria-label="השתנה ל">
              ←
            </span>
          </>
        )}
        <span data-amount={account}>
          <Money v={now} plain className={cn(account in before && old !== now && "font-bold text-fg")} />
        </span>
      </span>
    );
  };

  return (
    <div ref={wrap} className="relative ps-0 pe-24">
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[26rem] text-sm">
          <caption className="border-b border-line px-4 py-2.5 text-start text-[14px] font-semibold text-fg">{caption}</caption>
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-4 py-2 text-start font-medium">חשבון</th>
              <th className="px-4 py-2 text-end font-medium text-debit">חובה</th>
              <th className="px-4 py-2 text-end font-medium text-credit">זכות</th>
            </tr>
          </thead>
          <tbody>
            {tb.rows.map((r) => {
              const v = after[r.account];
              const fresh = !(r.account in before);
              const changed = !fresh && (before[r.account] ?? 0) !== v;
              return (
                <tr key={r.account} data-account={r.account} className={cn("border-t border-line/70", (fresh || changed) && "bg-accent-soft/60")}>
                  <td className="px-4 py-2 text-fg">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={cn((fresh || changed) && "font-semibold")}>{r.account}</span>
                      {fresh && (
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", CUTOFF.test(r.account) ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted ring-1 ring-line-strong")}>
                          {CUTOFF.test(r.account) ? "חשבון חתך חדש" : "חדש"}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="num px-4 py-2 text-end">{cell(v, "dr", r.account)}</td>
                  <td className="num px-4 py-2 text-end">{cell(v, "cr", r.account)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-fg/70 font-bold text-fg">
              <td className="px-4 py-2">סה״כ</td>
              <td className="num px-4 py-2 text-end">
                <Money v={tb.dr} plain />
              </td>
              <td className="num px-4 py-2 text-end">
                <Money v={tb.cr} plain />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {arrows.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            {(["dr", "cr"] as const).map((s) => (
              <marker key={s} id={`adjusted-tb-head-${s}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
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
              markerEnd={`url(#adjusted-tb-head-${a.side})`}
              className={a.side === "dr" ? "stroke-debit" : "stroke-credit"}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
