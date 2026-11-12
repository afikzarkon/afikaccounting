"use client";

import { ABS, NA } from "@formulajs/formulajs";
import { locale } from "@fortune-sheet/core";
import { Parser } from "@fortune-sheet/formula-parser";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { memo, useEffect, useImperativeHandle, useRef, type ComponentProps, type Ref } from "react";
import { canPoint, cycleRef, excelKey, formatKey, refName, stepCell, sumRange, type CellAt, type FormatKey } from "./excel-keys";
import { addFunctions, localiseFunctions, type ListedFunction } from "./sheet-functions";
import { announceTyping, caretOffset, replaceText, selectText } from "./sheet-input";

export type SheetData = ComponentProps<typeof Workbook>["data"];

/** What the dock around the workbook can ask of it. */
export type SheetHandle = {
  /** The sheets as they are now. */
  sheets: () => SheetData;
  /** Types text into the selected cell, or at the caret of the cell being edited. `caretBack` leaves the caret that many characters before the end. */
  type: (text: string, caretBack?: number) => void;
};

// The function list is the one the library reads while a formula is typed, so the Hebrew and
// the added functions go into it once, when this module loads.
const TEXTS = locale({ lang: "en" } as Parameters<typeof locale>[0]);
localiseFunctions(TEXTS.functionlist as ListedFunction[]);
// The headings of the box that explains a function while it is typed.
Object.assign(TEXTS.formulaMore, { helpExample: "דוגמה", helpAbstract: "הסבר", allowOptionText: "לא חובה", allowRepeatText: "אפשר לחזור עליו" });
addFunctions(Parser, { na: NA(), value: ABS("x") });

const ROWS = 100;
const COLS = 26;
const CURRENCY = "₪";

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
  "font-size",
  "bold",
  "italic",
  "underline",
  "strike-through",
  "font-color",
  "background",
  "border",
  "merge-cell",
  "|",
  "horizontal-align",
  "vertical-align",
  "text-wrap",
  "|",
  "freeze",
  "conditionFormat",
  "filter",
  "quick-formula",
  "search",
];

const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const MODIFIERS = ["Shift", "Control", "Alt", "Meta"];

/** A key event built here, so the handler below lets the workbook have it. */
function press(target: Element, key: string, shiftKey = false) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }));
}

/** A cell reference written into a formula by the arrow keys, and where it sits in the text. */
type Pointed = { anchor: CellAt; head: CellAt; start: number; text: string };

const isNumeric = (v: unknown) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));

/**
 * The spreadsheet itself (Fortune-sheet, MIT licence: free, no paid tier).
 * Loaded only when the reader opens the sheet, so the pages don't carry it.
 *
 * What Fortune-sheet does differently from Excel is put right here: the keys (Tab and the
 * arrows finish an entry, Enter moves down, F4 locks a reference, the arrows point at cells
 * inside a formula, Alt+= sums, the formatting shortcuts) and the grid's width, which the
 * library only measures when the window resizes, not the panel.
 */
function SheetWorkbook({ data, onChange, handle }: { data: SheetData; onChange: (data: SheetData) => void; handle?: Ref<SheetHandle> }) {
  const box = useRef<HTMLDivElement>(null);
  const book = useRef<WorkbookInstance>(null);
  // Excel's "enter mode": an entry begun by typing ends with an arrow key; one opened
  // with F2 or a double click is being edited, so the arrows move the caret instead.
  const typedEntry = useRef(false);
  const pointed = useRef<Pointed | null>(null);

  const editor = () => box.current?.querySelector<HTMLElement>(".luckysheet-cell-input") ?? null;
  const isEditing = () => box.current?.querySelector<HTMLElement>(".luckysheet-input-box")?.style.zIndex === "19";

  /** Opens the selected cell with `text` in it, as if it had been typed. */
  const beginEntry = (text: string, caretBack = 0) => {
    const input = editor();
    if (!input) return;
    input.focus({ preventScroll: true });
    // A typing key opens the cell; the text follows once the workbook has cleared it for the entry.
    announceTyping(input, "=", 187);
    typedEntry.current = true;
    pointed.current = null;
    let tries = 0;
    const write = () => {
      if (!isEditing() && ++tries < 40) return void window.setTimeout(write, 15);
      replaceText(input, 0, (input.textContent ?? "").length, text);
      if (caretBack) selectText(input, text.length - caretBack);
      // The workbook empties the editor once more as the cell opens; if that came after the text, write it again.
      window.setTimeout(() => {
        if ((input.textContent ?? "") === "" && ++tries < 44) write();
      }, 40);
    };
    window.setTimeout(write, 15);
  };

  useImperativeHandle(handle, () => ({
    sheets: () => book.current?.getAllSheets() ?? [],
    type: (text, caretBack = 0) => {
      const input = editor();
      if (!input) return;
      if (!isEditing()) return beginEntry(text, caretBack);
      // Into a formula being written: without the "=", where the caret is.
      const body = text.replace(/^=/, "");
      const at = caretOffset(input) ?? (input.textContent ?? "").length;
      replaceText(input, at, at, body);
      if (caretBack) selectText(input, at + body.length - caretBack);
    },
  }));

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

  // A sheet added by the dock (a template, the question's data) arrives with formulas and no results yet.
  const unsolved = useRef(data.some((sheet) => sheet.celldata?.some((cell) => cell.v?.f && cell.v.v === undefined)));
  useEffect(() => {
    if (!unsolved.current) return;
    let timer = 0;
    let tries = 0;
    // One pass works the cells out in reading order, so a total placed above its column needs a second.
    let passes = 2;
    const solve = () => {
      if (!book.current) {
        if (++tries < 100) timer = window.setTimeout(solve, 50);
        return;
      }
      book.current.calculateFormula();
      if (--passes > 0) timer = window.setTimeout(solve, 100);
    };
    timer = window.setTimeout(solve, 50);
    return () => window.clearTimeout(timer);
  }, []);

  // As in Excel, typing goes into the selected cell as soon as the sheet opens. Not on a
  // touch screen, where focusing the cell would pop up the keyboard over the question.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let timer = 0;
    let tries = 0;
    const focus = () => {
      const input = box.current?.querySelector<HTMLElement>(".luckysheet-cell-input");
      if (input) input.focus({ preventScroll: true });
      else if (++tries < 100) timer = window.setTimeout(focus, 50);
    };
    timer = window.setTimeout(focus, 50);
    return () => window.clearTimeout(timer);
  }, []);

  /** The cell the selection is on. */
  const selected = (): CellAt | null => {
    const s = book.current?.getSelection()?.[0];
    return s ? { r: s.row[0], c: s.column[0] } : null;
  };

  /** An arrow inside a formula: writes the cell it points at into the text. False when this is no place for a reference. */
  const point = (input: HTMLElement, text: string, arrow: string, extend: boolean): boolean => {
    const caret = caretOffset(input);
    if (caret === null) return false;
    let p = pointed.current;
    // Still pointing only while the reference written last is intact and the caret sits right after it.
    if (p && !(text.slice(p.start, p.start + p.text.length) === p.text && caret === p.start + p.text.length)) p = null;
    let anchor: CellAt;
    let from: CellAt;
    let start: number;
    let end: number;
    if (p) {
      [anchor, from, start, end] = [p.anchor, p.head, p.start, p.start + p.text.length];
    } else {
      const origin = selected();
      if (!origin || !canPoint(text.slice(0, caret))) return false;
      [anchor, from, start, end] = [origin, origin, caret, caret];
    }
    const head = stepCell(from, arrow, ROWS, COLS);
    // Shift stretches a range from where the pointing began; a plain arrow moves the single cell.
    if (!(extend && p)) anchor = head;
    const ref = refName(anchor, head);
    replaceText(input, start, end, ref);
    pointed.current = { anchor, head, start, text: ref };
    return true;
  };

  /** A formatting shortcut on the selection. */
  const format = (f: FormatKey) => {
    const api = book.current;
    const ranges = api?.getSelection();
    if (!api || !ranges?.length) return;
    if ("today" in f) {
      const at = selected();
      const d = new Date();
      if (at) api.setCellValue(at.r, at.c, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      return;
    }
    if ("toggle" in f) {
      const on = api.getCellValue(ranges[0].row[0], ranges[0].column[0], { type: f.toggle });
      for (const range of ranges) api.setCellFormatByRange(f.toggle, on ? 0 : 1, range as { row: [number, number]; column: [number, number] });
      return;
    }
    const calls: { name: string; args: unknown[] }[] = [];
    for (const { row, column } of ranges) {
      for (let r = row[0]; r <= Math.min(row[1], ROWS - 1); r++) {
        for (let c = column[0]; c <= Math.min(column[1], COLS - 1); c++) {
          // A typed number is kept as text until it is formatted; the format needs the number.
          const v = api.getCellValue(r, c, { type: "v" });
          if (typeof v === "string" && isNumeric(v)) calls.push({ name: "setCellFormat", args: [r, c, "v", Number(v)] });
          calls.push({ name: "setCellFormat", args: [r, c, "ct", f.ct] });
        }
      }
    }
    api.batchCallApis(calls as Parameters<WorkbookInstance["batchCallApis"]>[0]);
  };

  /** Alt+=: a SUM of the numbers above the cell (or to its left), left open to confirm with Enter. */
  const autoSum = () => {
    const api = book.current;
    const at = selected();
    if (!api || !at) return;
    const range = sumRange(at, (r, c) => isNumeric(api.getCellValue(r, c, { type: "v" })));
    beginEntry(range ? `=SUM(${range})` : "=SUM()", range ? 0 : 1);
  };

  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!e.nativeEvent.isTrusted) return;
    const root = box.current;
    const input = editor();
    if (!root || !input) return;
    const editing = isEditing();
    const text = input.textContent ?? "";
    const formula = text.trimStart().startsWith("=");
    const suggesting = !!root.querySelector(".luckysheet-formula-search-item-active");
    const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
    const take = () => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (editing && formula && plain) {
      if (e.key === "F4") {
        const caret = caretOffset(input);
        const next = caret === null ? null : cycleRef(text, caret);
        if (next) replaceText(input, next.start, next.end, next.ref);
        pointed.current = null;
        return take();
      }
      if (ARROWS.includes(e.key) && typedEntry.current && !suggesting && point(input, text, e.key, e.shiftKey)) return take();
    }
    if (!MODIFIERS.includes(e.key)) pointed.current = null;

    if (!editing) {
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === "Equal" || e.key === "=")) {
        autoSum();
        return take();
      }
      const f = formatKey({ key: e.key, code: e.code, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey }, CURRENCY);
      if (f) {
        format(f);
        return take();
      }
    }

    const plan = excelKey(e, { editing, typedEntry: typedEntry.current, formula, suggesting });
    if (plan.startsEntry !== undefined) typedEntry.current = plan.startsEntry;
    if (!plan.keys) return;
    take();
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
        ref={book}
        data={data}
        onChange={onChange}
        lang="en"
        currency={CURRENCY}
        row={ROWS}
        column={COLS}
        showSheetTabs
        toolbarItems={TOOLBAR}
      />
    </div>
  );
}

// The dock re-renders while its edge is dragged; the workbook has nothing new to show then.
export default memo(SheetWorkbook);
