/**
 * How the keys should behave in the reader's spreadsheet, the way Excel does it.
 * Fortune-sheet leaves a few of them out: Tab and the arrows don't finish an entry,
 * and Enter on a selected cell opens it for editing instead of moving down.
 *
 * This only decides; the workbook does the work. Every key it returns is one the
 * library already handles: Enter commits the entry and steps down, the arrows move.
 */

export type KeyLike = { key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean };

export type SheetState = {
  /** A cell is open for typing. */
  editing: boolean;
  /** The entry was begun by typing into the cell (Excel's "enter mode"), not with F2 or a double click. */
  typedEntry: boolean;
  /** The entry is a formula (starts with "="). */
  formula: boolean;
  /** The function list under a formula has an item picked. */
  suggesting: boolean;
};

export type KeyPlan = {
  /** Keys to send the workbook in place of this one; none means it gets the key as it is. */
  keys?: [key: string, shift: boolean][];
  /** Whether what follows is a typed entry, when this key settles it. */
  startsEntry?: boolean;
};

const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

// After Enter has committed and stepped down, these bring the cursor where Excel puts it.
const THEN: Record<string, [string, boolean][]> = {
  ArrowDown: [],
  ArrowUp: [
    ["ArrowUp", false],
    ["ArrowUp", false],
  ],
  ArrowRight: [
    ["ArrowUp", false],
    ["ArrowRight", false],
  ],
  ArrowLeft: [
    ["ArrowUp", false],
    ["ArrowLeft", false],
  ],
};

const commitThen = (move: string): KeyPlan => ({ keys: [["Enter", false], ...THEN[move]], startsEntry: false });

export function excelKey(e: KeyLike, s: SheetState): KeyPlan {
  const plain = !e.ctrlKey && !e.metaKey && !e.altKey;

  if (!s.editing) {
    if (e.key === "Enter" && plain) return { keys: [[e.shiftKey ? "ArrowUp" : "ArrowDown", false]] };
    if (e.key === "F2") return { startsEntry: false };
    if (e.key.length === 1 && plain) return { startsEntry: true };
    return {};
  }

  // F2 in a typed entry switches to editing it, so the arrows move the caret.
  if (e.key === "Escape" || e.key === "F2") return { startsEntry: false };
  if (!plain) return {};
  if (e.key === "Enter" && e.shiftKey) return commitThen("ArrowUp");
  // Tab with a function picked in the list takes the function, as in Excel.
  if (e.key === "Tab" && !s.suggesting) return commitThen(e.shiftKey ? "ArrowLeft" : "ArrowRight");
  // With the function list open the arrows walk the list.
  if (ARROWS.includes(e.key) && s.suggesting) return {};
  // In a formula the workbook first tries pointing at a cell (see `canPoint`); an arrow that
  // reaches here comes after a finished term, where Excel ends the entry too.
  if (ARROWS.includes(e.key) && !e.shiftKey && s.typedEntry) return commitThen(e.key);
  return {};
}

/* ---------- Formulas: F4, pointing at cells with the arrows, AutoSum ---------- */

const CELL = String.raw`\$?[A-Za-z]{1,3}\$?\d+`;
const REF = new RegExp(String.raw`(?<![A-Za-z0-9_$.])${CELL}(?::${CELL})?(?![A-Za-z0-9_(])`, "g");

/**
 * F4 on the reference at the caret: A1 → $A$1 → A$1 → $A1 → A1. A range (A1:B5) turns as one.
 * Gives the reference's place in the text (`start` to `end`) and what to put there; null when the caret is on no reference.
 */
export function cycleRef(text: string, caret: number): { start: number; end: number; ref: string } | null {
  for (const m of text.matchAll(REF)) {
    const start = m.index;
    const end = start + m[0].length;
    if (caret < start || caret > end) continue;
    // The first cell decides the next state, so a mixed range comes out uniform.
    const [, colLock, , rowLock] = /^(\$?)([A-Za-z]+)(\$?)/.exec(m[0])!;
    const [nextCol, nextRow] = colLock && rowLock ? ["", "$"] : !colLock && rowLock ? ["$", ""] : colLock ? ["", ""] : ["$", "$"];
    const ref = m[0].replace(/\$?([A-Za-z]+)\$?(\d+)/g, (_, col: string, row: string) => `${nextCol}${col}${nextRow}${row}`);
    return { start, end, ref };
  }
  return null;
}

/** Whether an arrow key here would point at a cell, as in Excel: right after "=", an operator, "(" or ",". */
export function canPoint(beforeCaret: string): boolean {
  const s = beforeCaret.trimEnd();
  return s.trimStart().startsWith("=") && "=+-*/^&(,<>:".includes(s.slice(-1));
}

/** A column's letters: 0 → A, 25 → Z, 26 → AA. */
export function columnName(c: number): string {
  let name = "";
  for (let n = c; n >= 0; n = Math.floor(n / 26) - 1) name = String.fromCharCode(65 + (n % 26)) + name;
  return name;
}

export type CellAt = { r: number; c: number };

/** "B3", or "B3:D7" for a range (written from its top-left corner, whichever way it was stretched). */
export function refName(a: CellAt, b: CellAt = a): string {
  const one = (r: number, c: number) => `${columnName(c)}${r + 1}`;
  if (a.r === b.r && a.c === b.c) return one(a.r, a.c);
  return `${one(Math.min(a.r, b.r), Math.min(a.c, b.c))}:${one(Math.max(a.r, b.r), Math.max(a.c, b.c))}`;
}

const STEP: Record<string, [dr: number, dc: number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

/** The cell one step from `at` in an arrow's direction, kept inside a sheet of `rows` by `cols`. */
export function stepCell(at: CellAt, arrow: string, rows: number, cols: number): CellAt {
  const [dr, dc] = STEP[arrow] ?? [0, 0];
  return { r: Math.min(Math.max(at.r + dr, 0), rows - 1), c: Math.min(Math.max(at.c + dc, 0), cols - 1) };
}

/**
 * What Alt+= sums from the cell at `at`: the run of numbers right above it, or else the run to its left.
 * `isNumber` says whether a cell holds a number. Null when there is nothing to sum.
 */
export function sumRange(at: CellAt, isNumber: (r: number, c: number) => boolean): string | null {
  let r = at.r;
  while (r > 0 && isNumber(r - 1, at.c)) r--;
  if (r < at.r) return refName({ r, c: at.c }, { r: at.r - 1, c: at.c });
  let c = at.c;
  while (c > 0 && isNumber(at.r, c - 1)) c--;
  if (c < at.c) return refName({ r: at.r, c }, { r: at.r, c: at.c - 1 });
  return null;
}

/** What a formatting shortcut does to the selection. */
export type FormatKey = { ct: { fa: string; t: string } } | { toggle: "it" | "un" | "cl" } | { today: true };

/** Excel's formatting shortcuts, for a selection that is not being edited. */
export function formatKey(e: KeyLike & { code: string }, currency = "₪"): FormatKey | null {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return null;
  if (e.shiftKey) {
    if (e.code === "Digit1") return { ct: { fa: "#,##0.00", t: "n" } };
    if (e.code === "Digit4") return { ct: { fa: `${currency} #,##0.00`, t: "n" } };
    if (e.code === "Digit5") return { ct: { fa: "0%", t: "n" } };
    return null;
  }
  if (e.code === "KeyI") return { toggle: "it" };
  if (e.code === "KeyU") return { toggle: "un" };
  if (e.code === "Digit5") return { toggle: "cl" };
  if (e.code === "Semicolon") return { today: true };
  return null;
}
