"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** The value to sort by; columns without one aren't sortable. */
  sort?: (row: T) => string | number;
  className?: string;
};
export type Filter<T> = { key: string; label: string; options: { value: string; label: string }[]; test: (row: T, value: string) => boolean };

/**
 * A management table: free-text search over `searchText`, select filters, and
 * click-to-sort columns. Everything runs on the rows already loaded.
 */
export function DataTable<T>({
  rows,
  rowKey,
  columns,
  filters = [],
  searchText,
  initialSort,
  empty = "אין פריטים.",
  toolbar,
}: {
  rows: T[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  filters?: Filter<T>[];
  searchText: (row: T) => string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  empty?: string;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(initialSort);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter(
      (r) => (!needle || searchText(r).toLowerCase().includes(needle)) && filters.every((f) => !chosen[f.key] || f.test(r, chosen[f.key])),
    );
    const col = columns.find((c) => c.key === sort?.key);
    if (col?.sort && sort) {
      const by = col.sort;
      out = [...out].sort((a, b) => {
        const x = by(a);
        const y = by(b);
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "he");
        return sort.dir === "asc" ? c : -c;
      });
    }
    return out;
  }, [rows, q, chosen, sort, columns, filters, searchText]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש…" aria-label="חיפוש" className={cn(inputClass, "h-10 ps-9")} />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            value={chosen[f.key] ?? ""}
            onChange={(e) => setChosen((c) => ({ ...c, [f.key]: e.target.value }))}
            aria-label={f.label}
            className={cn(inputClass, "h-10 w-auto")}
          >
            <option value="">{f.label}: הכול</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-2.5 text-start font-medium", c.className)} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.sort ? (
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-fg">
                      {c.label}
                      {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={rowKey(r)} className="border-b border-line/60 last:border-b-0 hover:bg-surface-2/40">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-2.5 align-middle", c.className)}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">{rows.length === 0 ? empty : "אין תוצאות לחיפוש ולסינון הנוכחיים."}</p>}
      </div>
      <p className="border-t border-line px-4 py-2 text-xs text-subtle">
        {shown.length} מתוך {rows.length}
      </p>
    </div>
  );
}
