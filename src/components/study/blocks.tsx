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
  warn: { icon: "⚠️", label: "מלכודת נפוצה", className: "border-trap/30 bg-trap-soft" },
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

export type EntryLine = { account: string; dr?: number; cr?: number; tag?: ReactNode };

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
      {/* A phone: one amount column, the side shown by ח׳/ז׳ and the indent of the credits — nothing is cut off. */}
      <ul className="divide-y divide-line/70 text-sm sm:hidden">
        {lines.map((l, i) => {
          const credit = l.cr !== undefined;
          return (
            <li key={i} className={cn("flex items-start gap-2 px-4 py-2", credit && "ps-8")}>
              <span className={cn("mt-px text-xs font-semibold", credit ? "text-credit" : "text-debit")}>{credit ? "ז׳" : "ח׳"}</span>
              <span className="min-w-0 flex-1 text-fg">
                {l.account}
                {l.tag && <span className="ms-2 inline-block align-middle">{l.tag}</span>}
              </span>
              <span className={cn("shrink-0", credit ? "text-credit" : "text-debit")}>
                <Num v={(credit ? l.cr : l.dr) ?? 0} />
              </span>
            </li>
          );
        })}
        <li className="ledger-total mx-4 flex flex-wrap items-center gap-x-2 gap-y-1 py-2 font-semibold">
          <span className="text-muted">סה״כ</span>
          <span className="ms-auto text-debit">
            ח׳ <Num v={dr} />
          </span>
          <span className="text-muted">{balanced ? "=" : "≠"}</span>
          <span className="text-credit">
            ז׳ <Num v={cr} />
          </span>
        </li>
      </ul>
      <div className="scroll-x hidden sm:block" tabIndex={0} role="region" aria-label={`פקודת יומן: ${title}`}>
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-2 py-2 text-start font-medium sm:px-4">חשבון</th>
              <th className="px-1.5 py-2 text-right font-medium text-debit sm:w-32 sm:px-4">חובה</th>
              <th className="px-1.5 py-2 text-right font-medium text-credit sm:w-32 sm:px-4">זכות</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-line/70">
                <td className={cn("px-2 py-2 text-fg sm:px-4", l.cr !== undefined && "ps-4 sm:ps-10")}>
                  <span className={cn("me-1 text-xs font-semibold sm:me-2", l.cr !== undefined ? "text-credit" : "text-debit")}>
                    {l.cr !== undefined ? "ז׳" : "ח׳"}
                  </span>
                  {l.account}
                  {l.tag && <span className="ms-2 inline-block align-middle">{l.tag}</span>}
                </td>
                <td className="px-1.5 py-2 text-right sm:px-4">{l.dr !== undefined && <Num v={l.dr} />}</td>
                <td className="px-1.5 py-2 text-right sm:px-4">{l.cr !== undefined && <Num v={l.cr} />}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* An accountant's total: a single rule above, a double rule below — the site's signature under every entry. */}
            <tr className="ledger-total font-semibold">
              <td className="px-4 py-2 text-muted">סה״כ</td>
              <td className="px-4 py-2 text-right text-debit">
                <Num v={dr} />
              </td>
              <td className="px-1.5 py-2 text-right text-credit sm:px-4">
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
  fit,
}: {
  head: string[];
  rows: Cell[][];
  foot?: Cell[];
  /** Row indexes to emphasise (e.g. the year a cap or renovation kicks in). */
  highlight?: number[];
  caption?: ReactNode;
  /** A table of words: it wraps to the width it has, instead of keeping a minimum width and scrolling. */
  fit?: boolean;
}) {
  const cell = (c: Cell) => (typeof c === "number" ? <Num v={c} /> : c);
  // One alignment per column, shared by its header: numeric columns to the right, so the units line up, everything else to the start.
  const numeric = head.map((_, i) => i > 0 && [...rows, ...(foot ? [foot] : [])].some((r) => typeof r[i] === "number"));
  const align = (_: Cell, i: number) => (numeric[i] ? "text-right" : "text-start");
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-line">
      {caption && <p className="border-b border-line bg-surface-2/70 px-4 py-2.5 text-sm font-semibold text-fg">{caption}</p>}
      {/* Focusable, so a keyboard can scroll a table wider than the screen. */}
      <div className="scroll-x" tabIndex={0} role="region" aria-label={typeof caption === "string" ? caption : "טבלה"}>
        <table className={cn("w-full text-sm", !fit && "min-w-[30rem]")}>
          <thead>
            <tr className="text-xs text-muted">
              {head.map((h, i) => (
                <th key={i} className={cn("px-4 py-2 font-medium whitespace-nowrap", numeric[i] ? "text-right" : "text-start")}>
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
