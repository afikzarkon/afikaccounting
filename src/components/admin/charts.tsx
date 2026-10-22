"use client";

import { Table2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Categorical series colours, always in this order (see --series-* in globals.css). */
export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

const nf = new Intl.NumberFormat("he-IL");
const fmt = (n: number) => nf.format(Math.round(n));

export type Series = { name: string };
export type Point = { label: string; /** Short axis label; the tooltip shows `label`. */ tick: string; values: number[] };

/** Round the axis maximum up to a readable step, so gridlines land on clean numbers. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag * 4 >= v)! * mag;
  return step * 4;
}

function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {series.map((s, i) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIES[i] }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function TableToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors", on ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg")}
    >
      <Table2 className="h-3.5 w-3.5" /> טבלה
    </button>
  );
}

/**
 * Columns over time, stacked when there is more than one series. Hovering or
 * focusing a column shows every series at that point; a table view holds the
 * same numbers for reading without a pointer.
 */
export function ColumnChart({ points, series, height = 220, empty = "אין נתונים בטווח הזה." }: { points: Point[]; series: Series[]; height?: number; empty?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const totals = points.map((p) => p.values.reduce((a, b) => a + b, 0));
  const max = niceMax(Math.max(0, ...totals));
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  // Show at most ~12 axis labels, evenly spaced.
  const every = Math.max(1, Math.ceil(points.length / 12));

  if (points.length === 0 || totals.every((t) => t === 0)) return <p className="py-10 text-center text-sm text-muted">{empty}</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Legend series={series} />
        <div className="ms-auto">
          <TableToggle on={asTable} onToggle={() => setAsTable((t) => !t)} />
        </div>
      </div>

      {asTable ? (
        <div className="max-h-80 overflow-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-xs text-muted">
              <tr>
                <th className="px-3 py-2 text-start font-medium">תקופה</th>
                {series.map((s) => (
                  <th key={s.name} className="px-3 py-2 text-end font-medium">
                    {s.name}
                  </th>
                ))}
                {series.length > 1 && <th className="px-3 py-2 text-end font-medium">סה״כ</th>}
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.label} className="border-t border-line/70">
                  <td className="px-3 py-1.5 text-fg">{p.label}</td>
                  {p.values.map((v, j) => (
                    <td key={j} className="num px-3 py-1.5 text-end font-mono text-muted">
                      {fmt(v)}
                    </td>
                  ))}
                  {series.length > 1 && <td className="num px-3 py-1.5 text-end font-mono font-medium text-fg">{fmt(totals[i])}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div dir="ltr" className="flex gap-2 pt-2">
          {/* y axis */}
          <div className="relative w-10 shrink-0 text-end text-[10px] text-subtle" style={{ height }}>
            {ticks.map((t) => (
              <span key={t} className="num absolute end-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
                {fmt(t)}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
              {ticks.map((t) => (
                <div key={t} className={cn("absolute inset-x-0 border-t", t === 0 ? "border-line-strong" : "border-line/60")} style={{ bottom: `${(t / max) * 100}%` }} />
              ))}
              <div className="absolute inset-0 flex items-end gap-[2px]">
                {points.map((p, i) => (
                  <div
                    key={p.label}
                    tabIndex={0}
                    role="img"
                    aria-label={`${p.label}: ${series.map((s, j) => `${s.name} ${fmt(p.values[j])}`).join(", ")}`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className={cn("relative flex h-full min-w-0 flex-1 flex-col-reverse rounded-sm outline-none", hover === i && "bg-surface-2/70")}
                  >
                    {p.values.map((v, j) =>
                      v > 0 ? (
                        <div
                          key={j}
                          className={cn("w-full", j === p.values.findLastIndex((x) => x > 0) && "rounded-t-[4px]", j > 0 && "border-b-2 border-surface")}
                          style={{ height: `${(v / max) * 100}%`, background: SERIES[j], opacity: hover === null || hover === i ? 1 : 0.55 }}
                        />
                      ) : null,
                    )}
                  </div>
                ))}
              </div>
              {hover !== null && (
                <div
                  dir="rtl"
                  className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card"
                  style={{ left: `${Math.min(Math.max(((hover + 0.5) / points.length) * 100, 12), 88)}%` }}
                >
                  <p className="mb-1 font-medium text-muted">{points[hover].label}</p>
                  {series.map((s, j) => (
                    <p key={s.name} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="h-0.5 w-3 rounded" style={{ background: SERIES[j] }} />
                        {s.name}
                      </span>
                      <span className="num font-semibold text-fg">{fmt(points[hover].values[j])}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
            {/* Each label is centred under its column and may be wider than it. */}
            <div className="relative mt-1.5 h-4 text-[10px] text-subtle">
              {points.map((p, i) =>
                i % every === 0 ? (
                  <span key={p.label} className="num absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / points.length) * 100}%` }}>
                    {p.tick}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type Ranked = { label: string; values: number[]; href?: string; note?: string };

/** Horizontal bars, longest first, with the value written beside each bar. */
export function RankedBars({ rows, series = [{ name: "" }], empty = "אין נתונים בטווח הזה." }: { rows: Ranked[]; series?: Series[]; empty?: string }) {
  const totals = rows.map((r) => r.values.reduce((a, b) => a + b, 0));
  const max = Math.max(0, ...totals);
  if (rows.length === 0 || max === 0) return <p className="py-8 text-center text-sm text-muted">{empty}</p>;
  return (
    <div className="space-y-3">
      <Legend series={series} />
      <ol className="space-y-2.5">
        {rows.map((r, i) => (
          <li
            key={`${r.label}-${i}`}
            title={series.length > 1 ? series.map((s, j) => `${s.name}: ${fmt(r.values[j])}`).join(" · ") : undefined}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-fg">
                {r.href ? (
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                    {r.label}
                  </a>
                ) : (
                  r.label
                )}
                {r.note && <span className="ms-2 text-xs text-subtle">{r.note}</span>}
              </span>
              <span className="num shrink-0 font-mono text-xs font-semibold text-fg">
                {fmt(totals[i])}
                {series.length > 1 && <span className="ms-1.5 font-normal text-subtle">({r.values.map(fmt).join(" / ")})</span>}
              </span>
            </div>
            <div className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-surface-2">
              {r.values.map((v, j) =>
                v > 0 ? <div key={j} className="h-full first:rounded-s-full last:rounded-e-full" style={{ width: `${(v / max) * 100}%`, background: SERIES[j] }} /> : null,
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Parts of one whole, as a single bar with every share written out below it. */
export function ShareBar({ parts, empty = "אין נתונים בטווח הזה." }: { parts: { name: string; value: number }[]; empty?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p, i) =>
          p.value > 0 ? (
            <div key={p.name} title={`${p.name}: ${fmt(p.value)}`} className="h-full first:rounded-s-full last:rounded-e-full" style={{ width: `${(p.value / total) * 100}%`, background: SERIES[i] }} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {parts.map((p, i) => (
          <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIES[i] }} />
              {p.name}
            </span>
            <span className="num font-mono text-fg">
              {fmt(p.value)} <span className="text-xs text-subtle">({((p.value / total) * 100).toFixed(1)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
