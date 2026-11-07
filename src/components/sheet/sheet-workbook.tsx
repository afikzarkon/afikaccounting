"use client";

import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { memo, useEffect, useRef, type ComponentProps } from "react";
import { excelKey } from "./excel-keys";

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

/** A key event built here, so the handler below lets the workbook have it. */
function press(target: Element, key: string, shiftKey = false) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }));
}

/**
 * The spreadsheet itself (Fortune-sheet, MIT licence: free, no paid tier).
 * Loaded only when the reader opens the sheet, so the pages don't carry it.
 *
 * Two things Fortune-sheet does differently from Excel are put right here:
 * the keys (Tab and the arrows finish an entry, Enter moves down) and the grid's
 * width, which the library only measures when the window resizes, not the panel.
 */
function SheetWorkbook({ data, onChange }: { data: SheetData; onChange: (data: SheetData) => void }) {
  const box = useRef<HTMLDivElement>(null);
  // Excel's "enter mode": an entry begun by typing ends with an arrow key; one opened
  // with F2 or a double click is being edited, so the arrows move the caret instead.
  const typedEntry = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // As in Excel, typing goes into the selected cell as soon as the sheet opens. Not on a
  // touch screen, where focusing the cell would pop up the keyboard over the question.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    let tries = 0;
    const focus = () => {
      const input = box.current?.querySelector<HTMLElement>(".luckysheet-cell-input");
      if (input) input.focus({ preventScroll: true });
      else if (++tries < 60) frame = requestAnimationFrame(focus);
    };
    frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!e.nativeEvent.isTrusted) return;
    const root = box.current;
    const input = root?.querySelector(".luckysheet-cell-input");
    if (!root || !input) return;
    const inputBox = root.querySelector<HTMLElement>(".luckysheet-input-box");
    const editing = inputBox?.style.zIndex === "19";
    const text = input.textContent ?? "";
    const plan = excelKey(e, {
      editing,
      typedEntry: typedEntry.current,
      formula: text.trimStart().startsWith("="),
      suggesting: !!root.querySelector(".luckysheet-formula-search-item-active"),
    });
    if (plan.startsEntry !== undefined) typedEntry.current = plan.startsEntry;
    if (!plan.keys) return;
    e.preventDefault();
    e.stopPropagation();
    for (const [key, shift] of plan.keys) press(input, key, shift);
  };

  return (
    <div
      ref={box}
      className="absolute inset-0"
      onKeyDownCapture={onKeyDownCapture}
      onDoubleClickCapture={() => (typedEntry.current = false)}
    >
      <Workbook
        data={data}
        onChange={onChange}
        lang="en"
        currency="₪"
        row={60}
        column={20}
        showSheetTabs
        toolbarItems={TOOLBAR}
      />
    </div>
  );
}

// The dock re-renders while its edge is dragged; the workbook has nothing new to show then.
export default memo(SheetWorkbook);
