/**
 * Building a sheet from plain rows: a ready template, or the data of the question on the page.
 * The result is in the workbook's own storage shape, so it goes straight in beside the reader's sheets.
 */

/** How a number is shown. Without one, a number shows the way the reader's own typing does. */
export type Format = "int" | "money" | "percent" | "factor" | "date";

export type BuildCell =
  | string
  | number
  | null
  | {
      /** A value, or a formula starting with "=". */
      v: string | number;
      bold?: boolean;
      /** A shaded cell: a heading (grey) or a cell the reader is meant to fill in (yellow). */
      shade?: "head" | "input";
      align?: "left" | "center" | "right";
      /** Long text breaks into lines inside the cell instead of running over its neighbours. */
      wrap?: boolean;
      format?: Format;
    };

export type BuiltSheet = {
  name: string;
  id: string;
  status: number;
  order: number;
  celldata: { r: number; c: number; v: Record<string, unknown> }[];
  calcChain: { r: number; c: number; id: string }[];
  config: { columnlen: Record<number, number>; rowlen: Record<number, number> };
  luckysheet_select_save: { row: [number, number]; column: [number, number]; row_focus: number; column_focus: number }[];
};

const FORMATS: Record<Format, { fa: string; t: string }> = {
  int: { fa: "#,##0;(#,##0)", t: "n" },
  money: { fa: "#,##0.00;(#,##0.00)", t: "n" },
  percent: { fa: "0.00%", t: "n" },
  factor: { fa: "0.0000", t: "n" },
  date: { fa: "dd/MM/yyyy", t: "d" },
};
const SHADES = { head: "#e8eef7", input: "#fff8d6" };
const ALIGN = { center: 0, left: 1, right: 2 };

/** A plain number as the sheet shows it: thousands separated, a negative in parentheses, a year left alone. */
export function plainNumber(v: number): string {
  const abs = Math.abs(v);
  if (!Number.isFinite(v) || abs >= 1e15 || (abs !== 0 && abs < 1e-6)) return String(v);
  if (Number.isInteger(v) && v >= 1900 && v <= 2100) return String(v);
  const [whole, fraction] = abs
    .toFixed(abs >= 1000 ? 2 : 6)
    .replace(/0+$/, "")
    .replace(/\.$/, "")
    .split(".");
  const text = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction ? `.${fraction}` : "");
  return v < 0 && text !== "0" ? `(${text})` : text;
}

function shown(v: number, format?: Format): string {
  if (format === "percent") return `${(v * 100).toFixed(2)}%`;
  if (format === "factor") return v.toFixed(4);
  if (format === "int" || format === "money") {
    const text = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: format === "money" ? 2 : 0, maximumFractionDigits: format === "money" ? 2 : 0 });
    return v < 0 ? `(${text})` : text;
  }
  return plainNumber(v);
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s${Date.now()}${Math.round(Math.random() * 1e6)}`);

/** A name no other sheet has: "לוח סילוקין", then "לוח סילוקין 2". */
export function freeName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  for (let n = 2; ; n++) if (!taken.includes(`${name} ${n}`)) return `${name} ${n}`;
}

export function buildSheet(name: string, rows: BuildCell[][], widths: number[] = []): BuiltSheet {
  const id = newId();
  const celldata: BuiltSheet["celldata"] = [];
  const calcChain: BuiltSheet["calcChain"] = [];
  const rowlen: Record<number, number> = {};
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === null || cell === "") return;
      const spec = typeof cell === "object" ? cell : { v: cell };
      const v: Record<string, unknown> = {};
      if (typeof spec.v === "string" && spec.v.startsWith("=")) {
        // Its value is worked out when the sheet opens.
        v.f = spec.v;
        v.ct = spec.format ? FORMATS[spec.format] : { fa: "General", t: "n" };
        calcChain.push({ r, c, id });
      } else if (typeof spec.v === "number") {
        v.v = spec.v;
        v.m = shown(spec.v, spec.format);
        v.ct = spec.format ? FORMATS[spec.format] : { fa: "General", t: "n" };
      } else {
        v.v = spec.v;
        v.m = spec.v;
        v.ct = { fa: "General", t: "g" };
      }
      if (spec.bold) v.bl = 1;
      if (spec.shade) v.bg = SHADES[spec.shade];
      if (spec.align) v.ht = ALIGN[spec.align];
      if (spec.wrap) {
        v.tb = "2";
        // The row grows to hold the lines the text breaks into (about 7 pixels a character, 18 a line).
        const lines = Math.ceil((String(spec.v).length * 7) / ((widths[c] ?? 73) - 8));
        if (lines > 1) rowlen[r] = Math.max(rowlen[r] ?? 0, lines * 18 + 4);
      }
      celldata.push({ r, c, v });
    }),
  );
  return {
    name,
    id,
    status: 1,
    order: 0,
    celldata,
    calcChain,
    config: { columnlen: Object.fromEntries(widths.map((w, c) => [c, w])), rowlen },
    luckysheet_select_save: [{ row: [0, 0], column: [0, 0], row_focus: 0, column_focus: 0 }],
  };
}

type Stored = { name: string; status?: number; order?: number };

/** Puts a built sheet after the reader's sheets and in front, under a name that is free. */
export function withSheet<T extends Stored>(sheets: T[], added: BuiltSheet): (T | BuiltSheet)[] {
  const name = freeName(added.name, sheets.map((s) => s.name));
  return [...sheets.map((s) => ({ ...s, status: 0 })), { ...added, name, order: sheets.length, status: 1 }];
}
