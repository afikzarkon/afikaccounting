/**
 * A worked solution laid out the way an accounting lecturer writes it: the
 * givens, what is required, and numbered steps, each with a calculation sheet
 * (label on the right, amount on the left, a thin rule over a subtotal, a
 * double rule under the result, operation rows in grey), a "why" note, tables,
 * a timeline for present values, a journal entry, the course's formula with
 * the numbers in, the result and the Excel way. The last line is the common
 * trap. Amounts are numbers, computed, never typed. In text, **x** is bold and
 * `x` is a left-to-right span for a formula or a figure.
 *
 * Shared by every course. Each course keeps its own sign style for negatives
 * (the owner's decision of 2026-11-10): parentheses, or a minus sign.
 */

/** How a negative amount is written: (1,000) or -1,000. */
export type Neg = "paren" | "minus";

export type WCell = string | number;
export type WRow = { c: WCell[]; res?: boolean };
/** `dec`: show agorot on every amount, as a discount or amortisation table does. */
export type WTable = { cap?: string; head: string[]; rows: WRow[]; dec?: boolean };
/**
 * One line of a calculation sheet. `k`: "op" an operation (grey), "sub" a
 * subtotal (thin rule above), "tot" the result (thin rule above, double below),
 * "focal" the line the question asks for (highlighted). `how` is the working,
 * small under the label; `tag` is where the line lands (OCI), beside the amount.
 */
export type WLine = { l: string; a: WCell; k?: "sub" | "tot" | "op" | "focal"; how?: string; tag?: string };
export type WPoint = { d: string; n?: string; cf?: number; key?: boolean };
export type WEntryLine = { a: string; dr?: number; cr?: number };
export type WEntry = { cap?: string; lines: WEntryLine[] };
export type WStep = {
  h: string;
  why?: [string, string];
  sheet?: WLine[];
  entry?: WEntry;
  timeline?: WPoint[];
  tables?: WTable[];
  p?: string[];
  /** The course's formula, then the same formula with the numbers in. Both read left to right. */
  fx?: [string, string];
  result?: string;
  xl?: string;
};

/** The body every solution shares: what a practice question shows once it is done. */
export type WorkedBody = {
  givens?: string[];
  tables?: WTable[];
  required?: string[];
  steps: WStep[];
  summary?: WTable;
  notes?: string[];
  /** The last line of the solution: "מלכודת נפוצה: …". */
  trap?: string;
  /** How this course writes a negative amount; parentheses unless the course says otherwise. */
  neg?: Neg;
};

/** A worked example on a lesson screen: a title, the givens, what is required, a "try it yourself" box, and the solution behind one button. */
export type Worked = WorkedBody & { title: string; givens: string[]; required: string[]; tryFirst: string };

/** Rounded to the agora. */
export const agora = (v: number) => Math.round(v * 100) / 100 + 0;

/** An amount the accounting way: thousands separated, agorot only when there are any (or always, with `dec`), a negative in parentheses or with a minus. */
export function acc(v: number, neg: Neg = "paren", dec = false) {
  const r = agora(v);
  const whole = Number.isInteger(r) && !dec;
  const s = Math.abs(r).toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
  return r < 0 ? (neg === "paren" ? `(${s})` : `-${s}`) : s;
}

/** An amount inside running text, as a left-to-right span. */
export const A = (v: number, neg: Neg = "paren") => "`" + acc(v, neg) + "`";

/** Present value of a level payment and a final amount, as Excel's PV with the sign flipped. */
export const pv = (rate: number, n: number, pmt: number, fv = 0) => (pmt * (1 - (1 + rate) ** -n)) / rate + fv * (1 + rate) ** -n;

/** Present value of uneven flows at the ends of years 1, 2, …, as Excel's NPV. */
export const npv = (rate: number, flows: number[]) => flows.reduce((s, c, i) => s + c / (1 + rate) ** (i + 1), 0);

/** A table cell that holds only a figure or a formula, so it is set left to right and aligned left. */
export const isNumeric = (c: WCell) => typeof c === "number" || (c !== "" && /^[\s\d.,()%×÷+−=\-²³^/]+$/.test(c));

/** Every line of text in a solution, in reading order: for tests that check wording, such as the trap coming last. */
export function workedText(w: WorkedBody): string[] {
  const out: string[] = [...(w.givens ?? []), ...(w.required ?? [])];
  for (const s of w.steps) {
    out.push(s.h, ...(s.why ?? []), ...(s.sheet ?? []).map((l) => l.l), ...(s.p ?? []));
    if (s.result) out.push(s.result);
  }
  out.push(...(w.notes ?? []));
  if (w.trap) out.push(`מלכודת נפוצה: ${w.trap}`);
  return out;
}
