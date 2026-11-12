import type { BuildCell } from "./sheet-build";

/**
 * The data of the question on the page, as rows for the sheet, so the reader does not retype it.
 *
 * A page has no record of "the question" to read from: lessons are written as markup. So this
 * reads what is on screen. Where a question's text or givens are marked (`data-givens`), those are
 * taken; otherwise every table in view is. A table comes over cell for cell. Text comes over line
 * by line, with the numbers found in each line set out in the cells beside it.
 */

const MARKS = /[‎‏‪-‮⁦-⁩]/g;
const DATE = /^(?:[0-3]?\d[./][01]?\d[./](?:\d{2}|\d{4})|(?:1[3-9]|[23]\d)\.(?:0[1-9]|1[0-2]))$/;

/** A cell of text as a value: "1,250" → 1250, "(500)" → -500, "5%" → 0.05 shown as a percent; a date or words stay text. */
export function parseCell(raw: string): BuildCell {
  const text = raw.replace(MARKS, "").replace(/\s+/g, " ").trim();
  if (text === "") return null;
  const bare = text.replace(/₪|ש"ח|ש״ח/g, "").trim();
  if (DATE.test(bare)) return text;
  const m = /^(\()?\s*([-−–])?\s*(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(%)?\s*(\))?$/.exec(bare);
  if (!m || Boolean(m[1]) !== Boolean(m[5])) return text;
  const digits = m[3].replace(/,/g, "");
  // A comma that is not a thousands separator ("1,5") is not a number we can be sure of.
  if (m[3].includes(",") && !/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(m[3])) return text;
  let value = Number(digits);
  if (m[1] || m[2]) value = -value;
  if (m[4]) return { v: value / 100, format: "percent" };
  return value;
}

const NUMBER = /\(?[-−–]?\d[\d,]*(?:\.\d+)?%?\)?/g;

/** The numbers written in a line of text, in order. Dates, and digits that are part of a word or a code, are skipped. */
export function numbersIn(line: string): BuildCell[] {
  const found: BuildCell[] = [];
  const text = line.replace(MARKS, "");
  for (const m of text.matchAll(NUMBER)) {
    const before = text[m.index - 1] ?? " ";
    const after = text[m.index + m[0].length] ?? " ";
    let token = m[0];
    // In "ל-120,000" the dash joins a Hebrew prefix to the number; it is not a minus.
    const joined = /^[-−–]/.test(token) && /[֐-׿]/.test(before);
    if (joined) token = token.slice(1);
    // "IFRS16", "סעיף 4א", "31.12.2024", "1/3": not amounts.
    if ((!joined && /[A-Za-z֐-׿./]/.test(before)) || /[A-Za-z֐-׿/]/.test(after)) continue;
    if (after === "." && /\d/.test(text[m.index + m[0].length + 1] ?? "")) continue;
    // A bracket that belongs to the sentence, not to the number: "(ראו 500)".
    if (token.startsWith("(") !== token.endsWith(")")) token = token.replace(/^\(|\)$/g, "");
    token = token.replace(/[.,]$/, "");
    const value = parseCell(token);
    if (typeof value === "string" || value === null) continue;
    found.push(value);
  }
  return found;
}

/** Text as rows: one per line or sentence, the numbers of each beside it. Lines with nothing in them are dropped. */
export function textRows(text: string): BuildCell[][] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.?!:])\s+(?=[^\d\s])/))
    .map((line) => line.replace(MARKS, "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1)
    .map((line) => [{ v: line, align: "right" as const, wrap: true }, ...numbersIn(line)]);
}

export type PageBlock = { title?: string; rows: BuildCell[][] };

/** On screen. A wrapper that only groups its children (`display: contents`) has no box of its own, so its children answer for it. */
const visible = (el: Element): boolean => el.getClientRects().length > 0 || (getComputedStyle(el).display === "contents" && Array.from(el.children).some(visible));

function tableBlock(table: HTMLTableElement): PageBlock | null {
  const rows: BuildCell[][] = [];
  for (const tr of Array.from(table.rows)) {
    const inHead = tr.parentElement?.tagName === "THEAD";
    const inFoot = tr.parentElement?.tagName === "TFOOT";
    const row: BuildCell[] = [];
    for (const cell of Array.from(tr.cells)) {
      const value = parseCell(cell.innerText ?? cell.textContent ?? "");
      if (value === null) row.push(null);
      else if (inHead || (cell.tagName === "TH" && typeof value === "string")) row.push({ v: typeof value === "object" ? value.v : value, bold: true, shade: inHead ? "head" : undefined, align: inHead ? "center" : "right" });
      else if (typeof value === "string") row.push({ v: value, align: "right", bold: inFoot });
      else row.push(typeof value === "object" ? { ...value, bold: inFoot } : { v: value, bold: inFoot });
      for (let i = 1; i < cell.colSpan; i++) row.push(null);
    }
    if (row.some((c) => c !== null)) rows.push(row);
  }
  if (!rows.length) return null;
  const title = table.caption?.innerText.trim() || table.closest("[role=region][aria-label]")?.getAttribute("aria-label") || undefined;
  return { title, rows };
}

/** The filled-in fields of a form (the engine's inputs): a label and its value on each row. */
function fieldRows(root: Element): BuildCell[][] {
  const rows: BuildCell[][] = [];
  for (const field of Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"))) {
    if (!visible(field) || field.closest("aside[data-sheet]")) continue;
    if (field instanceof HTMLInputElement && !["text", "number", "date", "tel", ""].includes(field.type)) continue;
    const value = field instanceof HTMLSelectElement ? (field.selectedOptions[0]?.text ?? "") : field.value;
    if (value.trim() === "") continue;
    const label = (field.closest("label")?.innerText ?? (field.id ? root.querySelector<HTMLElement>(`label[for="${CSS.escape(field.id)}"]`)?.innerText : "") ?? field.getAttribute("aria-label") ?? "")
      .replace(value, "")
      .replace(/\s+/g, " ")
      .trim();
    if (label) rows.push([{ v: label, align: "right" }, parseCell(value)]);
  }
  return rows;
}

/** What the page holds for the sheet; empty when there is nothing to take. */
export function collectPageData(root: Element, withFields: boolean): PageBlock[] {
  const blocks: PageBlock[] = [];
  const marked = Array.from(root.querySelectorAll<HTMLElement>("[data-givens]")).filter((el) => visible(el) && !el.parentElement?.closest("[data-givens]"));
  const tables = (within: Element) => Array.from(within.querySelectorAll("table")).filter((t) => visible(t) && !t.closest("aside[data-sheet]"));
  if (marked.length) {
    for (const el of marked) {
      let text = el.innerText;
      const inner = tables(el);
      for (const table of inner) text = text.replace(table.innerText, "\n");
      const rows = textRows(text);
      if (rows.length) blocks.push({ rows });
      for (const table of inner) {
        const block = tableBlock(table);
        if (block) blocks.push(block);
      }
    }
  } else {
    for (const table of tables(root)) {
      const block = tableBlock(table);
      if (block) blocks.push(block);
    }
  }
  if (withFields) {
    const rows = fieldRows(root);
    if (rows.length) blocks.unshift({ title: "הנתונים שהוזנו", rows });
  }
  return blocks;
}

/** The blocks one under another, as the rows of a single sheet, with the widths its columns need. */
export function pageSheet(blocks: PageBlock[]): { rows: BuildCell[][]; widths: number[] } {
  const rows: BuildCell[][] = [];
  for (const block of blocks) {
    if (rows.length) rows.push([]);
    if (block.title) rows.push([{ v: block.title, bold: true, align: "right" }]);
    rows.push(...block.rows);
  }
  const longest = Math.max(0, ...rows.map((row) => (typeof row[0] === "object" && row[0] !== null ? String(row[0].v).length : typeof row[0] === "string" ? row[0].length : 0)));
  const columns = Math.max(1, ...rows.map((row) => row.length));
  return { rows, widths: [Math.min(300, Math.max(140, longest * 7)), ...Array.from({ length: columns - 1 }, () => 100)] };
}
