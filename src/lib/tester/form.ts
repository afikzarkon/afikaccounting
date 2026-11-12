import raw from "./feedback-form.schema.json";

/**
 * The tester feedback form (docs/user-testing/feedback-form.md), read from its JSON schema.
 * Option lists written as "@name" point at a shared list in `enums`.
 */

export type Option = { value: string; label: string; icon?: string; hint?: string; withText?: boolean };

type RawOptions = string | (string | Option)[];

export type Field = {
  id: string;
  type: "text" | "textarea" | "number" | "date" | "time" | "choice" | "multiChoice" | "scale" | "scaleGrid" | "rows" | "file";
  label?: string;
  required?: boolean;
  icon?: string;
  options?: RawOptions;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  items?: { id: string; label: string }[];
  columns?: Field[];
  showIf?: { field: string; in: string[] };
};

export type Section = { id: string; title: string; repeat: "once" | "perModule"; fields: Field[] };

type Schema = {
  id: string;
  version: number;
  title: string;
  enums: Record<string, (string | Option)[]>;
  sections: Section[];
};

export const schema = raw as unknown as Schema;

export function optionsOf(field: Field): Option[] {
  const list = typeof field.options === "string" ? schema.enums[field.options.replace(/^@/, "")] ?? [] : field.options ?? [];
  return list.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

export const sectionById = (id: string) => schema.sections.find((s) => s.id === id)!;
export const moduleSections = schema.sections.filter((s) => s.repeat === "perModule");

/** One answer per field, keyed by "section.field". */
export type Answers = Record<string, unknown>;
export type Row = Record<string, string>;

export type FormState = { version: number; intake: Answers; modules: Answers[]; summary: Answers; updatedAt?: string };

export const emptyState = (): FormState => ({ version: schema.version, intake: {}, modules: [{}], summary: {} });

const MAX_MODULES = 60;
export const MAX_BYTES = 200_000;
const record = (v: unknown): Answers => (v && typeof v === "object" && !Array.isArray(v) ? (v as Answers) : {});

/** A stored or received form, in its expected shape; null when it isn't one or is too large to keep. */
export function sanitizeState(raw: unknown): FormState | null {
  const r = record(raw);
  if (!("intake" in r) && !("modules" in r)) return null;
  const modules = Array.isArray(r.modules) ? r.modules.slice(0, MAX_MODULES).map(record) : [];
  const state: FormState = {
    version: schema.version,
    intake: record(r.intake),
    modules: modules.length ? modules : [{}],
    summary: record(r.summary),
    ...(typeof r.updatedAt === "string" && !Number.isNaN(Date.parse(r.updatedAt)) && { updatedAt: r.updatedAt }),
  };
  return JSON.stringify(state).length <= MAX_BYTES ? state : null;
}

/** Of two copies of the form, the one changed last (a copy with no time counts as oldest). */
export function newer(a: FormState | null, b: FormState | null): FormState | null {
  if (!a || !b) return a ?? b;
  return Date.parse(b.updatedAt ?? "0") > Date.parse(a.updatedAt ?? "0") ? b : a;
}

export const moduleName = (m: Answers, i: number) => (m["module.moduleName"] as string) || `מודול ${i + 1}`;

export const keyOf = (section: Section, field: Field) => `${section.id}.${field.id}`;

export function isVisible(section: Section, field: Field, answers: Answers) {
  if (!field.showIf) return true;
  const v = answers[`${section.id}.${field.showIf.field}`];
  return typeof v === "string" && field.showIf.in.includes(v);
}

/** How many required fields in these sections still have no answer. */
export function missingRequired(sections: Section[], answers: Answers) {
  let n = 0;
  for (const s of sections)
    for (const f of s.fields) {
      if (!f.required || !isVisible(s, f, answers)) continue;
      const v = answers[keyOf(s, f)];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) n++;
    }
  return n;
}

function labelFor(field: Field, value: string) {
  return optionsOf(field).find((o) => o.value === value)?.label ?? value;
}

function show(field: Field, value: unknown, answers: Answers, key: string): string {
  if (value === undefined || value === "" || value === null) return "";
  switch (field.type) {
    case "choice":
      return labelFor(field, String(value));
    case "multiChoice":
      return (value as string[])
        .map((v) => {
          const extra = answers[`${key}:${v}`];
          return labelFor(field, v) + (extra ? ` (${extra})` : "");
        })
        .join(", ");
    case "scale":
      return `${value} / ${field.max}`;
    default:
      return String(value);
  }
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ");

function sectionMarkdown(section: Section, answers: Answers, level = "###") {
  const out: string[] = [`${level} ${section.title}`, ""];
  for (const f of section.fields) {
    if (!isVisible(section, f, answers)) continue;
    const key = keyOf(section, f);
    const v = answers[key];
    if (f.type === "scaleGrid") {
      const grid = (v ?? {}) as Record<string, number>;
      for (const item of f.items ?? []) out.push(`- **${item.label}:** ${grid[item.id] ?? "—"} / ${f.max}`);
    } else if (f.type === "rows") {
      const rows = ((v ?? []) as Row[]).filter((r) => Object.values(r).some(Boolean));
      out.push(`**${f.label}**`, "");
      if (rows.length === 0) out.push("אין.");
      else {
        const cols = f.columns ?? [];
        out.push(`| # | ${cols.map((c) => c.label).join(" | ")} |`, `| --- | ${cols.map(() => "---").join(" | ")} |`);
        rows.forEach((r, i) => out.push(`| ${i + 1} | ${cols.map((c) => cell(show(c, r[c.id], {}, ""))).join(" | ")} |`));
      }
    } else {
      out.push(`- **${f.icon ? `${f.icon} ` : ""}${f.label}:** ${show(f, v, answers, key) || "—"}`);
    }
  }
  out.push("");
  return out.join("\n");
}

/** The whole form as a readable Markdown report. */
export function toMarkdown(state: FormState) {
  const intake = sectionById("intake");
  const summary = sectionById("summary");
  const parts = [`# ${schema.title}`, "", sectionMarkdown(intake, state.intake, "##")];
  state.modules.forEach((m, i) => {
    const name = (m["module.moduleName"] as string) || `מודול ${i + 1}`;
    parts.push(`## ${name}`, "", ...moduleSections.map((s) => sectionMarkdown(s, m)));
  });
  parts.push(sectionMarkdown(summary, state.summary, "##"));
  return parts.join("\n");
}
