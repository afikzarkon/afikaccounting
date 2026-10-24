import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Lab numbers: thousands separators, up to two decimals, negatives in parentheses. */
export const n = (v: number) => (v < 0 ? `(${nf.format(-v)})` : nf.format(v));

/** A number set in tabular figures that stays left-to-right inside Hebrew text. */
export function Num({ v, className }: { v: number; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("num font-mono text-[0.92em]", className)}>
      {n(v)}
    </bdi>
  );
}

/** A date like 31.12.X4, kept left-to-right so the bidi algorithm doesn't reorder it in Hebrew text. */
export function Dt({ children }: { children: string }) {
  return (
    <bdi dir="ltr" className="num">
      {children}
    </bdi>
  );
}

/** One collapsible topic inside a tab. */
export function Topic({
  title,
  refs,
  open,
  children,
}: {
  title: string;
  refs?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 select-none hover:bg-surface-2/50 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-[17px] font-semibold text-fg">{title}</span>
        {refs && (
          <Badge tone="accent" className="num">
            {refs}
          </Badge>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-5 pt-4 pb-6 text-[15px] leading-relaxed text-fg/90 [&_p]:my-3">{children}</div>
    </details>
  );
}

const CALLOUTS = {
  tip: { icon: "💡", label: "טיפ / טריק", className: "border-accent/30 bg-accent-soft" },
  check: { icon: "✅", label: "בדיקת נאותות", className: "border-success/30 bg-success/[0.07]" },
  warn: { icon: "⚠️", label: "מלכודת נפוצה", className: "border-amber-500/30 bg-amber-500/[0.07]" },
} as const;

/** Pro-tip / sanity-check box set inside the topic it belongs to. */
export function Callout({ kind = "tip", title, children }: { kind?: keyof typeof CALLOUTS; title: string; children: ReactNode }) {
  const c = CALLOUTS[kind];
  return (
    <aside className={cn("my-5 rounded-xl border px-4 py-3.5", c.className)}>
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span aria-hidden className="text-lg leading-none">
          {c.icon}
        </span>
        <span className="sr-only">{c.label}: </span>
        {title}
      </p>
      <div className="mt-1.5 text-[14.5px] leading-relaxed text-fg/85 [&_p]:my-2">{children}</div>
    </aside>
  );
}

export type EntryLine = { account: string; dr?: number; cr?: number };

/** A journal entry, debits first, with totals and a balance check computed from the lines. */
export function JournalEntry({ title, date, lines, note }: { title: string; date?: string; lines: EntryLine[]; note?: ReactNode }) {
  const dr = lines.reduce((s, l) => s + (l.dr ?? 0), 0);
  const cr = lines.reduce((s, l) => s + (l.cr ?? 0), 0);
  const balanced = Math.abs(dr - cr) < 0.005;
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-line">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/70 px-4 py-2.5">
        <p className="flex-1 text-sm font-semibold text-fg">{title}</p>
        {date && (
          <span className="text-xs text-muted">
            <Dt>{date}</Dt>
          </span>
        )}
        <Badge tone={balanced ? "success" : "danger"}>{balanced ? "✓ מאוזנת" : "✗ לא מאוזנת"}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-4 py-2 text-start font-medium">חשבון</th>
              <th className="w-32 px-4 py-2 text-end font-medium text-debit">חובה</th>
              <th className="w-32 px-4 py-2 text-end font-medium text-credit">זכות</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-line/70">
                <td className={cn("px-4 py-2 text-fg", l.cr !== undefined && "ps-10")}>
                  <span className={cn("me-2 text-xs font-semibold", l.cr !== undefined ? "text-credit" : "text-debit")}>
                    {l.cr !== undefined ? "ז׳" : "ח׳"}
                  </span>
                  {l.account}
                </td>
                <td className="px-4 py-2 text-end">{l.dr !== undefined && <Num v={l.dr} />}</td>
                <td className="px-4 py-2 text-end">{l.cr !== undefined && <Num v={l.cr} />}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line-strong font-semibold">
              <td className="px-4 py-2 text-muted">סה״כ</td>
              <td className="px-4 py-2 text-end text-debit">
                <Num v={dr} />
              </td>
              <td className="px-4 py-2 text-end text-credit">
                <Num v={cr} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {note && <div className="border-t border-line px-4 py-2.5 text-[13px] text-muted">{note}</div>}
    </div>
  );
}

type Cell = ReactNode | number;

/** A schedule table; numeric cells are formatted and aligned automatically. */
export function DataTable({
  head,
  rows,
  foot,
  highlight,
  caption,
}: {
  head: string[];
  rows: Cell[][];
  foot?: Cell[];
  /** Row indexes to emphasise (e.g. the year a cap or renovation kicks in). */
  highlight?: number[];
  caption?: ReactNode;
}) {
  const cell = (c: Cell) => (typeof c === "number" ? <Num v={c} /> : c);
  // One alignment per column, shared by its header: numeric columns to the end, everything else to the start.
  const numeric = head.map((_, i) => i > 0 && [...rows, ...(foot ? [foot] : [])].some((r) => typeof r[i] === "number"));
  const align = (_: Cell, i: number) => (numeric[i] ? "text-end" : "text-start");
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-line">
      {caption && <p className="border-b border-line bg-surface-2/70 px-4 py-2.5 text-sm font-semibold text-fg">{caption}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              {head.map((h, i) => (
                <th key={i} className={cn("px-4 py-2 font-medium whitespace-nowrap", numeric[i] ? "text-end" : "text-start")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className={cn("border-t border-line/70", highlight?.includes(ri) && "bg-amber-500/[0.08]")}>
                {r.map((c, i) => (
                  <td key={i} className={cn("px-4 py-2 text-fg", align(c, i))}>
                    {cell(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {foot && (
            <tfoot>
              <tr className="border-t-2 border-line-strong font-semibold">
                {foot.map((c, i) => (
                  <td key={i} className={cn("px-4 py-2 text-fg", align(c, i))}>
                    {cell(c)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
