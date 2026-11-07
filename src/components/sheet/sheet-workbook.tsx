"use client";

import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import type { ComponentProps } from "react";

export type SheetData = ComponentProps<typeof Workbook>["data"];

const TOOLBAR = [
  "undo",
  "redo",
  "format-painter",
  "clear-format",
  "|",
  "currency-format",
  "percentage-format",
  "number-decrease",
  "number-increase",
  "format",
  "|",
  "bold",
  "italic",
  "font-color",
  "background",
  "border",
  "merge-cell",
  "|",
  "horizontal-align",
  "text-wrap",
  "|",
  "freeze",
  "filter",
  "quick-formula",
  "search",
];

/**
 * The spreadsheet itself (Fortune-sheet, MIT licence: free, no paid tier).
 * Loaded only when the reader opens the sheet, so the pages don't carry it.
 */
export default function SheetWorkbook({ data, onChange }: { data: SheetData; onChange: (data: SheetData) => void }) {
  return <Workbook data={data} onChange={onChange} lang="en" row={60} column={20} showSheetTabs toolbarItems={TOOLBAR} />;
}
