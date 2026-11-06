import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * How the site lays out accounting schedules and statements, the way an
 * accountant writes them:
 *
 * - A roll-forward (`Roll`) is a worksheet column, top to bottom from the
 *   opening to the closing. Credits are negative and debits positive, with a
 *   leading minus as a spreadsheet types it; the closing sits on a total rule
 *   with a double underline.
 * - A statement (`Statement`: profit and loss, balance sheet, a note) shows
 *   deductions in parentheses, a single rule above every subtotal, and a
 *   double underline under the bottom line.
 */

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** A worksheet number: a leading minus for a credit. */
export const wsNum = (v: number) => (Math.round(v * 100) / 100 < 0 ? `-${nf.format(-v)}` : nf.format(Math.abs(v)));

/** A statement number: a deduction in parentheses. */
export const stNum = (v: number) => (Math.round(v * 100) / 100 < 0 ? `(${nf.format(-v)})` : nf.format(Math.abs(v)));

/** A worksheet amount, coloured by its side: credit or debit. */
export function WsAmount({ v, className }: { v: number; className?: string }) {
  const r = Math.round(v);
  return (
    <bdi dir="ltr" className={cn("num font-mono", r < 0 ? "text-credit" : r > 0 ? "text-debit" : "text-muted", className)}>
      {wsNum(r)}
    </bdi>
  );
}

/** Where a line lands, beside its amount: OCI, profit and loss, the balance sheet. */
export function LedgerTag({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap rounded bg-amber-500/20 px-1.5 py-px text-[11px] font-bold text-amber-700 dark:text-amber-300">{children}</span>;
}

/** The total rule: a line above, a double line below. */
const TOTAL = "inline-block border-t border-b-[3px] border-double border-fg/70 py-0.5";

export type StatementRow = {
  label: ReactNode;
  /** One amount per column; null leaves the cell empty. Negative is a deduction. */
  values?: (number | null)[];
  /** `heading`: a section title, no amounts; `subtotal`: a rule above; `total`: the bottom line, a rule above and a double one below. */
  kind?: "heading" | "subtotal" | "total";
  focal?: boolean;
  /** What the line is made of — small, under the label. */
  note?: ReactNode;
};

/** The rules under a subtotal and under the bottom line. */
const RULE: Partial<Record<NonNullable<StatementRow["kind"]>, string>> = {
  subtotal: "border-t border-fg/60",
  total: "border-t border-b-[3px] border-double border-fg/70",
};

/** A statement amount: a deduction in parentheses. */
function StAmount({ v }: { v: number }) {
  return (
    <bdi dir="ltr" className="num font-mono">
      {stNum(Math.round(v))}
    </bdi>
  );
}

/**
 * A statement or a note as it is published: a label column and one amount
 * column per heading (a year, an asset class), deductions in parentheses, a
 * single rule above each subtotal and a double rule under the total.
 */
export function Statement({ title, head = ["₪"], rows, className }: { title: ReactNode; head?: ReactNode[]; rows: StatementRow[]; className?: string }) {
  const many = head.length > 1;
  return (
    <figure className={cn("rounded-xl border border-line bg-surface px-4 py-3", className)}>
      <div className="overflow-x-auto">
        <table className={cn("w-full text-[14px]", many && "min-w-[34rem]")}>
          <caption className="border-b border-line-strong pb-2 text-start text-[14px] font-bold text-fg">{title}</caption>
          <thead>
            <tr className="text-[12px] text-muted">
              <th />
              {head.map((h, i) => (
                <th key={i} dir="ltr" className="px-2 pt-2 pb-1 text-right font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (r.kind === "heading")
                return (
                  <tr key={i}>
                    <th scope="rowgroup" colSpan={head.length + 1} className="pt-3 pb-1 text-start text-[13px] font-bold text-fg underline decoration-line-strong underline-offset-4">
                      {r.label}
                    </th>
                  </tr>
                );
              const strong = r.kind === "subtotal" || r.kind === "total";
              return (
                <tr key={i} className={cn(r.focal && "bg-amber-500/[0.1]")}>
                  <th scope="row" className={cn("py-1.5 pe-2 text-start align-top", strong ? "font-bold text-fg" : "font-medium text-fg/90")}>
                    <bdi>{r.label}</bdi>
                    {r.note && <span className="block text-[12px] font-normal leading-snug text-muted">{r.note}</span>}
                  </th>
                  {head.map((_, j) => {
                    const v = r.values?.[j];
                    return (
                      <td key={j} dir="ltr" className={cn("px-2 py-1.5 text-right align-top", strong && "font-bold")}>
                        {v === null || v === undefined ? (
                          strong && <span className={cn("block py-0.5 text-muted", RULE[r.kind!])}>-</span>
                        ) : (
                          <span className={cn("block py-0.5", r.kind && RULE[r.kind])}>
                            <StAmount v={v} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export type RollLine = {
  label: ReactNode;
  /** As it moves the balance: positive grows it, negative shrinks it. */
  value: number;
  /** The rate, the years, the working — small, under the label. */
  note?: ReactNode;
  kind?: "opening" | "closing" | "focal";
  /** Where the line lands, beside the amount. */
  tag?: ReactNode;
};

/**
 * A roll-forward as a worksheet column. `side` is the balance's normal side:
 * a liability or a reserve is a credit, so it and every line that grows it
 * print negative; an asset is a debit and prints as it is.
 */
export function Roll({ title, lines, side, unit = "₪", className }: { title: ReactNode; lines: RollLine[]; side: "credit" | "debit"; unit?: string; className?: string }) {
  const sign = side === "credit" ? -1 : 1;
  const tagged = lines.some((l) => l.tag);
  return (
    <figure className={cn("rounded-xl border border-line bg-surface px-4 py-3", className)}>
      <table className="w-full text-[14.5px]">
        <caption className="border-b border-line-strong pb-2 text-start text-[14px] font-bold text-fg">
          {title} <span className="text-xs font-normal text-muted">({unit})</span>
        </caption>
        <tbody>
          {lines.map((l, i) => {
            const v = sign * l.value;
            const closing = l.kind === "closing";
            return (
              <tr key={i} className={cn(!closing && "border-b border-line", l.kind === "focal" && "bg-amber-500/[0.1]")}>
                <th scope="row" className={cn("py-2 pe-2 text-start align-top", l.kind ? "font-semibold text-fg" : "font-medium text-fg/90", l.kind === "focal" && "ps-1")}>
                  <bdi>{l.label}</bdi>
                  {l.note && <span className="block text-[12px] font-normal leading-snug text-muted">{l.note}</span>}
                </th>
                <td dir="ltr" className={cn("w-28 py-2 text-right align-top", l.kind && "font-bold")}>
                  {closing ? (
                    <span className={TOTAL}>
                      <WsAmount v={v} />
                    </span>
                  ) : (
                    <WsAmount v={v} />
                  )}
                </td>
                {tagged && <td className="w-16 py-2 text-center align-top">{l.tag && <LedgerTag>{l.tag}</LedgerTag>}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}
