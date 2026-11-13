"use client";

import { ChevronLeft, RotateCcw } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });
const cell = (v: number | string) => (typeof v === "number" ? (v < 0 ? `(${nf.format(-v)})` : nf.format(v)) : v);

/** A row of an asset's sheet: its label (the year, or an event), the four numbers, and what the row says. */
export type SheetLine = {
  label: string;
  cost: number;
  charge: number | string;
  accumulated: number;
  carrying: number;
  /** Shown under the sheet while this row is the newest: where each of its cells came from. */
  note?: ReactNode;
  /** An event row (an upgrade, a sale): drawn apart, with a line above it. */
  event?: boolean;
};

const HEAD = ["", "עלות", "הוצאות פחת השנה", "פחת נצבר", "עלות מופחתת"];

/**
 * An asset's sheet as a spreadsheet: column letters, row numbers, one row a
 * year. With `grow`, it starts with the first row and "השנה הבאה" adds the
 * next — the newest row lit, and its note under the sheet explaining each
 * cell; without it, the whole sheet at once.
 */
export function AssetSheet({ caption, rows, grow, mark }: { caption: string; rows: SheetLine[]; grow?: boolean; mark?: number }) {
  const [shown, setShown] = useState(grow ? 1 : rows.length);
  const done = shown >= rows.length;
  const newest = grow ? shown - 1 : mark;
  const note = newest !== undefined ? rows[newest]?.note : undefined;
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-sm">
        <p className="flex items-center gap-2 border-b border-line bg-[#1d6f42] px-3 py-2 text-[13.5px] font-semibold text-white">
          <span aria-hidden className="grid h-5 w-5 place-items-center rounded bg-white/90 text-[11px] font-bold text-[#1d6f42]">
            X
          </span>
          {caption}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-surface-2 text-[11px] text-muted">
                <th className="w-8 border border-line px-1 py-0.5" aria-hidden />
                {["A", "B", "C", "D", "E"].map((l) => (
                  <th key={l} className="border border-line px-2 py-0.5 font-medium" aria-hidden>
                    {l}
                  </th>
                ))}
              </tr>
              <tr className="bg-surface-2/60 text-[12.5px] text-fg">
                <th className="border border-line px-1 py-1 text-[11px] font-medium text-muted">1</th>
                {HEAD.map((h, i) => (
                  <th key={i} scope="col" className={cn("border border-line px-2 py-1 font-bold", i === 0 ? "text-start" : "text-right")}>
                    {h || "שנה"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-live="polite">
              {rows.slice(0, shown).map((r, i) => (
                <tr
                  key={i}
                  className={cn(
                    i === newest && "bg-amber-400/15",
                    r.event && "border-t-2 border-t-danger/70",
                    grow && i === newest && "anim-step-in",
                  )}
                >
                  <td className="border border-line px-1 py-1 text-center text-[11px] text-muted">{i + 2}</td>
                  <td className={cn("border border-line px-2 py-1 font-semibold", r.event ? "text-danger" : "text-fg")}>{r.label}</td>
                  {[r.cost, r.charge, r.accumulated, r.carrying].map((v, j) => (
                    <td key={j} className={cn("num border border-line px-2 py-1 text-right", j === 3 && "font-bold text-accent")}>
                      {cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {note && <div className="rounded-xl bg-accent-soft/60 px-4 py-2.5 text-[14px] leading-relaxed text-fg ring-1 ring-accent/20">{note}</div>}
      {grow && (
        <button
          type="button"
          onClick={() => setShown(done ? 1 : shown + 1)}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-[15px] font-bold transition active:scale-95",
            done ? "bg-surface text-accent ring-1 ring-accent/40 hover:bg-accent-soft" : "bg-accent text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)] ring-2 ring-accent/30 hover:brightness-110",
          )}
        >
          {done ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> מההתחלה
            </>
          ) : (
            <>
              השורה הבאה{" "}
              <span className="num font-semibold opacity-80">
                ({shown + 1}/{rows.length})
              </span>{" "}
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      )}
    </div>
  );
}
