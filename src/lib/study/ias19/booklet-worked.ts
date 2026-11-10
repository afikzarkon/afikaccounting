import type { BkLine, BkQuestion, BkRoll, BkStep } from "@/lib/learn/ias19-booklet";
import type { WCell, WLine, WorkedBody, WStep, WTable } from "../worked";
import { ltrFormulas, ltrMarks } from "./ltr";

/**
 * IAS 19's booklet questions in the site's worked layout, by the owner's
 * approval of the before/after on 2026-11-10. Nothing is retyped: each step
 * is read from the booklet's own solution (src/lib/learn/ias19-booklet.ts).
 * Its text stays text, its tables and its notes become tables (what is
 * computed, the calculation, the result), and each movement table becomes a
 * worksheet column: the obligation a credit, so negative; plan assets as they
 * are; the P.N. lit, with where it lands. Amounts to the shekel, as the
 * booklet writes them; a table in thousands keeps two decimals.
 */

const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);
const nf = (x: number, d: number) => x.toLocaleString("en-US", { maximumFractionDigits: d });

/** A calculation in a cell, laid out left to right however it is written (MIN(...), Hebrew terms between operators). */
function calc(s: string): string {
  const isolate = (m: string) => `${LRI}${ltrMarks(m)}${PDI}`;
  if (/[\d×÷=−^+]/.test(s) && !/[֐-׿]/.test(s)) return isolate(s);
  // "47.84 + 183.93 — מפוצלת כמו ההתחייבות": the calculation, then a remark in words.
  const m = s.match(/^([^֐-׿]*\d[^֐-׿]*?)(\s+—\s+.*)$/);
  return m ? isolate(m[1]) + m[2] : ltrFormulas(s);
}

/** The booklet's highlight (==x==) is bold here. */
const text = (s: string) => ltrFormulas(s.replace(/==([^=]+)==/g, "**$1**"));

function value(l: BkLine): WCell {
  if (l.value === undefined) return "";
  switch (l.unit) {
    case "%":
      return `${nf(l.value, 3)}%`;
    case "ימים":
    case "שנים":
      return `${nf(l.value, 2)} ${l.value === 1 ? (l.unit === "ימים" ? "יום" : "שנה") : l.unit}`;
    case "₪":
      return Math.round(l.value);
    default:
      return nf(l.value, 2);
  }
}

const cell = (c: string | number): WCell => (typeof c === "number" ? c : calc(c));

function tables(s: BkStep): WTable[] {
  return [
    ...(s.tables ?? []).map((t) => ({
      cap: t.title,
      head: t.head,
      rows: [...t.rows.map((r) => ({ c: r.map(cell) })), ...(t.foot ? [{ c: t.foot.map(cell), res: true }] : [])],
    })),
    ...(s.notes ?? []).map((n) => ({
      // A caption is plain text: the highlight marks go.
      cap: ltrFormulas(n.text ? `${n.title}. ${n.text.replace(/==([^=]+)==/g, "$1")}` : n.title),
      head: ["מה מחשבים", "חישוב", "תוצאה"],
      rows: n.lines.map((l) => ({ c: [l.how ? `**${l.label}**. ${text(l.how)}` : l.label, l.calc ? calc(l.calc) : l.text ? text(l.text) : "", value(l)] })),
    })),
  ];
}

/** A movement table as a worksheet column. */
function roll(r: BkRoll): WStep {
  const sign = (r.side ?? "credit") === "credit" ? -1 : 1;
  const thousands = /אלפי/.test(r.unit ?? "");
  const amount = (v: number) => sign * (thousands ? Math.round(v * 100) / 100 : Math.round(v));
  const balances = r.rows.flatMap((row, i) => (row.kind === "balance" ? [i] : []));
  const closing = balances.length > 1 ? balances[balances.length - 1] : -1;
  const sheet: WLine[] = r.rows.map((row, i) => ({
    l: text(row.label),
    how: row.note && text(row.note),
    a: amount(row.value),
    k: i === closing ? "tot" : row.kind === "pn" ? "focal" : row.kind === "balance" ? undefined : "op",
    tag: row.kind === "pn" ? (r.pnTo ?? "OCI") || undefined : undefined,
  }));
  return { h: r.unit ? `${r.title} (${r.unit})` : r.title, sheet };
}

function steps(s: BkStep): WStep[] {
  const t = tables(s);
  const main: WStep = { h: s.title, p: s.text?.map(text), tables: t.length ? t : undefined };
  const rolls = (s.rolls ?? []).map(roll);
  if (main.p || main.tables) return [main, ...rolls];
  // A step that is only its movement table keeps the step's title over the column.
  return rolls.length === 1 ? [{ ...rolls[0], h: s.title }] : rolls;
}

/** The booklet's tip about the spreadsheet, as it was above the solution. */
const LRM = String.fromCharCode(0x200e);
/** An Excel formula with Hebrew names: every operator held in place, or the browser lays the names out right to left. */
const xl = (s: string) => "`" + s.replace(/[=+\-*/^();]/g, (op) => `${LRM}${op}${LRM}`) + "`";
const EXCEL = `כל היוון בפתרון אפשר לחשב גם בגיליון: ${xl("=PV(ריבית;שנים;0;-סכום)")}, וריבית לחלק משנה: ${xl("=יתרה*((1+ריבית)^(חודשים/12)-1)")}.`;

export const bookletWorked = (q: BkQuestion): WorkedBody => ({ neg: "minus", notes: [EXCEL], steps: q.steps.flatMap(steps) });
