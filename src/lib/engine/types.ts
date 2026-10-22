/**
 * The calculator schema is plain JSON on purpose: the same definition drives the
 * wizard UI, server-side validation, and the `accounting_calculators.schema`
 * column in the database. Only `solve` and `validate` live in code.
 */

export type FieldValue = string | number | boolean;
export type Values = Record<string, FieldValue>;

/** Show a field only when another field holds one of the given values. */
export type Condition = { field: string; in: FieldValue[] };

export type Option = { value: string; label: string; description?: string };

type FieldBase = {
  id: string;
  label: string;
  help?: string;
  showIf?: Condition[];
  /** Seconds into the calculator's explainer video that cover this field. */
  videoAt?: number;
};

export type ToggleField = FieldBase & { kind: "toggle"; default: boolean };
export type RadioField = FieldBase & { kind: "radio"; options: Option[]; default: string };
export type SelectField = FieldBase & { kind: "select"; options: Option[]; default: string };
export type NumberField = FieldBase & {
  kind: "number";
  unit: "currency" | "percent" | "years" | "count";
  default: number;
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
};

/** A calendar date, held as an ISO "YYYY-MM-DD" string. */
export type DateField = FieldBase & { kind: "date"; default: string };
/** One optional number per period, typed as "100, , 80"; an empty item means no value. */
export type SeriesField = FieldBase & { kind: "series"; default: string; placeholder?: string };

export type ScenarioField = ToggleField | RadioField | SelectField;
export type MetricField = NumberField | DateField | SeriesField;
export type Field = ScenarioField | MetricField;

export type CalculatorSchema = {
  slug: string;
  standard: string; // e.g. "IFRS 16"
  title: string;
  tagline: string;
  description: string;
  category: string;
  icon: string; // lucide icon name, resolved in the UI
  accent: "sky" | "violet" | "amber" | "emerald";
  /** Content item whose video explains this calculator. */
  explainerSlug?: string;
  scenario: ScenarioField[];
  metrics: MetricField[];
};

export type JournalLine = { account: string; debit: number; credit: number };
export type JournalEntry = { id: string; when: string; narrative: string; lines: JournalLine[]; reference?: string };

export type Column = {
  key: string;
  label: string;
  format?: "currency" | "percent" | "text" | "number";
};
export type ScheduleRow = Record<string, string | number | null> & { _emphasis?: string | null };
export type ScheduleTable = {
  id: string;
  title: string;
  caption?: string;
  /** A short explanation of this step, shown above the table, and the paragraphs it rests on. */
  note?: string;
  reference?: string;
  columns: Column[];
  rows: ScheduleRow[];
  totals?: ScheduleRow;
};

export type Metric = { label: string; value: number; format?: "currency" | "percent" | "number"; hint?: string };
export type Guidance = { title: string; body: string; reference: string };

export type Solution = {
  headline: string;
  outcome: "recognised" | "exempt" | "disclose-only" | "none";
  metrics: Metric[];
  journal: JournalEntry[];
  tables: ScheduleTable[];
  disclosure: string;
  guidance: Guidance[];
  assumptions: string[];
};

export type Calculator = CalculatorSchema & {
  /** Cross-field checks beyond each field's own min/max. Keyed by field id. */
  validate?: (values: Values) => Record<string, string>;
  solve: (values: Values) => Solution;
};
