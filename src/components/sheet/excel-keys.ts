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
  // In a formula the arrows stay in the text; Excel would point at cells, which this sheet can't.
  if (ARROWS.includes(e.key) && !e.shiftKey && s.typedEntry && !s.formula) return commitThen(e.key);
  return {};
}
