import type { WCell, WRow, WStep, WTable } from "../worked";
import { ltrFormulas, ltrMarks } from "./ltr";

/**
 * IAS 19's calculations as tables, by the owner's choice of 2026-11-15: each
 * calculation a row of "what is computed | the calculation | the result", as
 * the booklet's notes already are. Nothing is retyped: a row is read from a
 * line the course already writes ("ההוצאה: 7 × 17,745 ₪ = 124,215 ₪."), and a
 * line that is not a calculation stays a sentence.
 */

export const CALC_HEAD = ["מה מחשבים", "חישוב", "תוצאה"];

const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);
/** Direction marks the course puts around formulas: a line is read without them. */
const MARKS = /[⁦-⁩‎‏]/g;

export type CalcLine = { what?: string; calc: string; result: WCell; note?: string };

const OP = /[×÷+−^]/;
const UNIT = /^(−?-?[\d,]*\.?\d+%?)(\s*(?:₪|ימים|יום|שנים|שנה|עובדים|חודשים))?/;

/**
 * A line of the form "[what: ]calculation = result[ note]", or nothing when
 * the line is not one: the calculation needs an operator and a figure, the
 * result must be a figure. A chain ("a = b = c") keeps everything before the
 * last "=" as its calculation.
 */
export function splitCalc(line: string): CalcLine | undefined {
  const s = line.replace(MARKS, "").trim();
  const at = s.lastIndexOf(" = ");
  if (at < 0) return undefined;
  const left = s.slice(0, at).trim();
  const right = s.slice(at + 3).trim();
  const m = right.match(UNIT);
  if (!m) return undefined;
  const [num, unit = ""] = [m[1], m[2]?.trim()];
  const note = right
    .slice(m[0].length)
    .replace(/^[\s.,;:—–→-]+/, "")
    .replace(/\.$/, "")
    .trim();
  const lm = left.match(/^([^:]{1,48}?):\s+(.+)$/);
  const [what, calc] = lm && OP.test(lm[2]) ? [lm[1].trim(), lm[2].trim()] : [undefined, left];
  // A calculation starts with its first figure or bracket: "ולכן ההפרשה היא 8 × 3" is a sentence, and stays one.
  if (!OP.test(calc) || !/\d/.test(calc) || !/^[\d(−-]/.test(calc)) return undefined;
  // A shekel amount or a bare figure is a number, set the accounting way; a rate or a count keeps its unit.
  const value = Number(num.replace(/[,−-]/g, "")) * (/^[−-]/.test(num) ? -1 : 1);
  const result: WCell = !num.endsWith("%") && (unit === "" || unit === "₪") && Number.isFinite(value) ? value : `${num}${unit ? ` ${unit}` : ""}`;
  return { what, calc: calc.replace(/\s*₪/g, ""), result, note: note || undefined };
}

/** A calculation laid out left to right inside its cell: a run of Hebrew terms between operators too. */
const isolate = (s: string) => `${LRI}${ltrMarks(s)}${PDI}`;

export const calcRow = (c: CalcLine, what: string): WRow => ({
  c: [c.note ? `${c.what ?? what}. ${ltrFormulas(c.note)}` : (c.what ?? what), isolate(c.calc), c.result],
});

/** A course formula and its numbers ("שכר × שיעור ההפקדה = הוצאה", "300,000 × 6.5% = 19,500 ₪") as one row: the name and the words, the numbers, the result. */
export function fxRow(fx: [string, string]): WRow | undefined {
  const words = fx[0].replace(MARKS, "");
  const at = words.lastIndexOf(" = ");
  const c = splitCalc(fx[1]);
  if (at < 0 || !c) return undefined;
  return { c: [`**${words.slice(at + 3).trim()}**. ${isolate(words.slice(0, at).trim())}`, isolate(c.calc), c.result], res: true };
}

/**
 * A step's lines with its calculations gathered into one table: the
 * sentences stay sentences, above it. A calculation without its own name is
 * named after the step. Nothing to gather, nothing changes.
 */
export function withCalcTable(step: WStep, lines: string[]): WStep {
  const rows: WRow[] = [];
  const p: string[] = [];
  for (const l of lines) {
    const c = splitCalc(l);
    if (c) rows.push(calcRow(c, step.h.replace(MARKS, "")));
    else p.push(l);
  }
  if (!rows.length) return { ...step, p: lines };
  rows[rows.length - 1] = { ...rows[rows.length - 1], res: true };
  const table: WTable = { head: CALC_HEAD, rows };
  return { ...step, p: p.length ? p : undefined, tables: [table, ...(step.tables ?? [])] };
}

/** What the question asked and its answer, one row each: the last table of a solution. */
export const answersStep = (rows: [string, WCell][]): WStep => ({ h: "התשובות", tables: [{ head: ["נדרש", "תשובה"], rows: rows.map(([a, v]) => ({ c: [ltrFormulas(a), v] })) }] });
