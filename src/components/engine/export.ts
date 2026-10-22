import type { JournalEntry, ScheduleTable } from "@/lib/engine/types";

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

/** Raw numbers (not formatted strings) so the sheet stays calculable in Excel. */
export function tableToCsv(table: ScheduleTable) {
  const header = table.columns.map((c) => c.label);
  const body = [...table.rows, ...(table.totals ? [table.totals] : [])].map((row) =>
    table.columns.map((c) => row[c.key] ?? ""),
  );
  return toCsv([header, ...body]);
}

export function journalToCsv(journal: JournalEntry[]) {
  const rows: unknown[][] = [["Entry", "Date", "Narrative", "Account", "Debit", "Credit"]];
  for (const e of journal) {
    for (const l of e.lines) rows.push([e.id, e.when, e.narrative, l.account, l.debit || "", l.credit || ""]);
  }
  return toCsv(rows);
}

export function downloadCsv(filename: string, csv: string) {
  // The BOM makes Excel open UTF-8 (₪, €, Hebrew) correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fileSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
