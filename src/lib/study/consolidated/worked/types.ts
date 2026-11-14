/**
 * A worked example laid out the way an accounting lecturer writes a solution:
 * the givens, what is required, and numbered steps, each with a calculation
 * sheet, a "why" note, tables, a timeline for present values, the result and
 * the workbook's formula. Amounts are numbers, computed, never typed; a
 * negative amount is shown in parentheses. In text, **x** is bold and `x` is a
 * left-to-right span for a formula or a figure.
 */
export type WCell = string | number;
/**
 * Links: the same figure, carried from one place in the solution to another.
 * A figure gets an `id` where it first appears, and every place that carries
 * it over names that id in `from`; an arrow joins them while the solution is
 * open. Only for the very same figure, never for one merely equal in amount.
 * In a row, both are keyed by the column's index.
 */
export type WRow = { c: WCell[]; res?: boolean; id?: Record<number, string>; from?: Record<number, string> };
export type WTable = { cap?: string; head: string[]; rows: WRow[] };
export type WLine = { l: string; a: WCell; k?: "sub" | "tot" | "op"; id?: string; from?: string };
export type WPoint = { d: string; n?: string; cf?: number; key?: boolean };
export type WStep = {
  h: string;
  why?: [string, string];
  sheet?: WLine[];
  timeline?: WPoint[];
  tables?: WTable[];
  p?: string[];
  result?: string;
  xl?: string;
};
export type Worked = {
  /** The course's own numbers, not the lecturer's: no "from the material" over the givens, no workbook cell. */
  own?: boolean;
  title: string;
  givens: string[];
  tables?: WTable[];
  required: string[];
  tryFirst: string;
  steps: WStep[];
  summary?: WTable;
  notes?: string[];
};

/** Rounded to the agora, as the workbook shows it. */
export const agora = (v: number) => Math.round(v * 100) / 100 + 0;

/** An amount the accounting way: thousands separated, a negative in parentheses, agorot only when there are any. */
export function acc(v: number) {
  const r = agora(v);
  const whole = Number.isInteger(r);
  const s = Math.abs(r).toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
  return r < 0 ? `(${s})` : s;
}

/** An amount inside running text, as a left-to-right span. */
export const A = (v: number) => "`" + acc(v) + "`";

/** Present value of a level payment and a final amount, as Excel's PV with the sign flipped. */
export const pv = (rate: number, n: number, pmt: number, fv = 0) => (pmt * (1 - (1 + rate) ** -n)) / rate + fv * (1 + rate) ** -n;

/** Present value of uneven flows at the ends of years 1, 2, …, as Excel's NPV. */
export const npv = (rate: number, flows: number[]) => flows.reduce((s, c, i) => s + c / (1 + rate) ** (i + 1), 0);
