/**
 * Changing the text of the cell being edited from code, the way typing would.
 *
 * The workbook's editor is a contenteditable whose HTML is rebuilt as a formula is coloured, so
 * positions are counted in characters of its text, not in DOM nodes. Text goes in through the
 * browser's own "insert text", which the workbook hears exactly like a keystroke; it only
 * re-reads the editor after a key it counts as typing, so one is announced first.
 */

/** The caret, as a count of characters into the editor's text; null when the caret is elsewhere. */
export function caretOffset(editor: HTMLElement): number | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode || !editor.contains(sel.anchorNode)) return null;
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.setEnd(sel.focusNode ?? sel.anchorNode, sel.focusOffset);
  return range.toString().length;
}

/** The DOM spot of a character offset in the editor's text. */
function spot(editor: HTMLElement, offset: number): [Node, number] {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    if (offset <= node.length) return [node, offset];
    offset -= node.length;
    last = node;
  }
  return last ? [last, last.length] : [editor, 0];
}

export function selectText(editor: HTMLElement, start: number, end = start) {
  const range = document.createRange();
  range.setStart(...spot(editor, start));
  range.setEnd(...spot(editor, end));
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** A key the workbook reads as typing, so that it takes in the change that follows. */
export function announceTyping(editor: HTMLElement, key = "a", keyCode = 65) {
  editor.dispatchEvent(new KeyboardEvent("keydown", { key, keyCode, which: keyCode, bubbles: true, cancelable: true } as KeyboardEventInit));
}

/** Replaces the characters from `start` to `end` of the editor's text; the caret ends after the new text. */
export function replaceText(editor: HTMLElement, start: number, end: number, text: string) {
  editor.focus({ preventScroll: true });
  announceTyping(editor);
  selectText(editor, start, end);
  document.execCommand("insertText", false, text);
}
