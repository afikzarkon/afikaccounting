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

/**
 * One page of a lesson as a tester rated it, from the strip under it (components/tester/screen-rating.tsx).
 * Kept by "<lesson slug>/<page>", where the page is "screen:<id>", "check:<id>", "q:<practice id>" or "summary",
 * so the same screen gathers every tester's rating however its title changes.
 */
export type Rating = "clear" | "ok" | "unclear";
export type PageRating = {
  /** The lesson and the page as the tester saw them, for reading the ratings back. */
  lesson: string;
  title: string;
  where?: string;
  r?: Rating;
  tags?: string[];
  note?: string;
  /** Seconds on the page before its first rating: how long it took to read. */
  secs?: number;
  /** The lesson's summary only: "could I solve an exam question on this?" (1–5), and the one thing to change. */
  exam?: number;
  change?: string;
  at: string;
};
export type PageRatings = Record<string, PageRating>;

export const RATINGS: { value: Rating; label: string; icon: string }[] = [
  { value: "clear", label: "ברור", icon: "🙂" },
  { value: "ok", label: "בסדר", icon: "😐" },
  { value: "unclear", label: "לא ברור", icon: "😕" },
];
/** Why a page was only OK, or unclear: one tap each. */
export const RATING_TAGS: { value: string; label: string }[] = [
  { value: "long", label: "ארוך מדי" },
  { value: "missing", label: "חסר הסבר" },
  { value: "example", label: "הדוגמה לא עזרה" },
  { value: "next", label: "לא ברור מה לעשות" },
  { value: "bug", label: "תקלה / תצוגה" },
];
export const ratingLabel = (r?: string) => RATINGS.find((x) => x.value === r);
export const tagLabel = (t: string) => RATING_TAGS.find((x) => x.value === t)?.label ?? t;

export type FormState = { version: number; intake: Answers; modules: Answers[]; summary: Answers; pages: PageRatings; updatedAt?: string };

export const emptyState = (): FormState => ({ version: schema.version, intake: {}, modules: [{}], summary: {}, pages: {} });

const MAX_MODULES = 60;
const MAX_PAGES = 1500;
export const MAX_BYTES = 200_000;
const record = (v: unknown): Answers => (v && typeof v === "object" && !Array.isArray(v) ? (v as Answers) : {});
const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function sanitizePage(raw: unknown): PageRating | null {
  const p = record(raw);
  const r = RATINGS.some((x) => x.value === p.r) ? (p.r as Rating) : undefined;
  const exam = Number(p.exam);
  const page: PageRating = {
    lesson: text(p.lesson, 200),
    title: text(p.title, 200),
    at: typeof p.at === "string" && !Number.isNaN(Date.parse(p.at)) ? p.at : new Date(0).toISOString(),
    ...(text(p.where, 200) && { where: text(p.where, 200) }),
    ...(r && { r }),
    ...(Array.isArray(p.tags) && { tags: p.tags.filter((t): t is string => RATING_TAGS.some((x) => x.value === t)) }),
    ...(text(p.note, 1000) && { note: text(p.note, 1000) }),
    ...(Number.isFinite(Number(p.secs)) && Number(p.secs) > 0 && { secs: Math.min(36_000, Math.round(Number(p.secs))) }),
    ...(Number.isInteger(exam) && exam >= 1 && exam <= 5 && { exam }),
    ...(text(p.change, 2000) && { change: text(p.change, 2000) }),
  };
  return page.r || page.exam || page.change || page.note ? page : null;
}

/** A stored or received form, in its expected shape; null when it isn't one or is too large to keep. */
export function sanitizeState(raw: unknown): FormState | null {
  const r = record(raw);
  if (!("intake" in r) && !("modules" in r)) return null;
  const modules = Array.isArray(r.modules) ? r.modules.slice(0, MAX_MODULES).map(record) : [];
  const pages: PageRatings = {};
  for (const [key, value] of Object.entries(record(r.pages)).slice(0, MAX_PAGES)) {
    const page = key.length <= 200 ? sanitizePage(value) : null;
    if (page) pages[key] = page;
  }
  const state: FormState = {
    version: schema.version,
    intake: record(r.intake),
    modules: modules.length ? modules : [{}],
    summary: record(r.summary),
    pages,
    ...(typeof r.updatedAt === "string" && !Number.isNaN(Date.parse(r.updatedAt)) && { updatedAt: r.updatedAt }),
  };
  return JSON.stringify(state).length <= MAX_BYTES ? state : null;
}

/** The rated pages grouped by lesson (slug), in the order they were first rated. */
export function pagesByLesson(pages: PageRatings) {
  const out = new Map<string, { slug: string; lesson: string; pages: (PageRating & { key: string })[] }>();
  for (const [key, p] of Object.entries(pages).sort((a, b) => Date.parse(a[1].at) - Date.parse(b[1].at))) {
    const slug = key.split("/")[0];
    const g = out.get(slug) ?? { slug, lesson: p.lesson || slug, pages: [] };
    g.pages.push({ ...p, key });
    out.set(slug, g);
  }
  return [...out.values()];
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
  parts.push(pagesMarkdown(state.pages));
  parts.push(sectionMarkdown(summary, state.summary, "##"));
  return parts.join("\n");
}

/** The tester's rating of each page, lesson by lesson. */
export function pagesMarkdown(pages: PageRatings) {
  const groups = pagesByLesson(pages);
  const out = ["## דירוג המסכים", ""];
  if (groups.length === 0) return [...out, "עוד לא דורגו מסכים.", ""].join("\n");
  for (const g of groups) {
    out.push(`### ${g.lesson}`, "");
    for (const p of g.pages) {
      if (p.key.endsWith("/summary")) {
        out.push(
          `- **סוף השיעור:** אוכל לפתור שאלת בחינה בנושא? ${p.exam ? `${p.exam} / 5` : "—"}${p.change ? ` · הדבר האחד לשנות: ${cell(p.change)}` : ""}`,
        );
        continue;
      }
      const r = ratingLabel(p.r);
      const extra = [p.tags?.length ? p.tags.map(tagLabel).join(", ") : "", p.note ? `״${cell(p.note)}״` : "", p.secs ? `${Math.round(p.secs)} שנ׳` : ""].filter(Boolean);
      out.push(`- ${r ? `${r.icon} ${r.label}` : "—"} · **${p.title}**${p.where ? ` (${p.where})` : ""}${extra.length ? ` — ${extra.join(" · ")}` : ""}`);
    }
    out.push("");
  }
  return out.join("\n");
}
