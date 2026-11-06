import type { StudyModule, Trap } from "../types";

/**
 * Formulas read left to right, as in a maths notebook, also when their terms
 * are Hebrew words. In a Hebrew sentence the browser lays a run of numbers
 * and operators out right to left ("92 = 1.08 ÷ 100"), so every formula
 * clause in the course's strings is wrapped in a left-to-right isolate
 * (U+2066 … U+2069). A clause is a formula when it has "=", or ×, ÷ or ^;
 * the words around it ("ולכן", what follows a dash or a colon) stay outside.
 * Inside it, a left-to-right mark (U+200E) hugs every operator, or a run of
 * Hebrew terms ("סגירה − פתיחה") would still be laid out as one right-to-left
 * phrase.
 */

const LRI = String.fromCharCode(0x2066);
const LRM = String.fromCharCode(0x200e);
const PDI = String.fromCharCode(0x2069);
const MATH = /[=×÷^]/;
/** Where a sentence breaks into clauses: after a colon or semicolon, around a dash, before "ולכן"/"כלומר". */
const BREAK = /(:\s+|;\s+|\s+—\s+|,\s+(?=ולכן|כלומר|ולא\b)|\s+(?=ולכן\s))/;
/** Words that lead into a formula but are not part of it. */
const LEAD = /^((?:ולכן|כלומר|ולא|אז|ואז|כי|ובסוף|ובמספרים)\s+)/;

/** Every operator and bracket held in place, so the terms between them follow left to right. */
export const ltrMarks = (s: string) => s.replace(/[=+−±×÷^()]/g, (op) => `${LRM}${op}${LRM}`);

function wrapClause(clause: string) {
  if (!MATH.test(clause) || clause.includes(LRI)) return clause;
  const lead = clause.match(LEAD)?.[1] ?? "";
  let body = clause.slice(lead.length);
  const tail = body.match(/[.,]$/)?.[0] ?? "";
  body = body.slice(0, body.length - tail.length);
  return `${lead}${LRI}${ltrMarks(body)}${PDI}${tail}`;
}

/** The same text, with each formula clause laid out left to right. ("P.N." ends in a dot, not a sentence.) A line break — a formula over its numbers — stays a line break. */
export function ltrFormulas(s: string): string {
  if (!MATH.test(s)) return s;
  if (s.includes("\n")) return s.split("\n").map(ltrFormulas).join("\n");
  return s
    .split(/(?<!P\.N\.)(?<=[.?!])\s+/)
    .map((sentence) =>
      sentence
        .split(BREAK)
        .map((part, i) => (i % 2 ? part : wrapClause(part)))
        .join(""),
    )
    .join(" ");
}

const many = (xs: string[]) => xs.map(ltrFormulas);

/** A lesson with every formula in its exercises, traps and tips laid out left to right. */
export function withLtrFormulas(m: StudyModule): StudyModule {
  return {
    ...m,
    exercises: m.exercises.map((x) =>
      x.kind === "journal"
        ? { ...x, entry: { ...x.entry, why: x.entry.why && ltrFormulas(x.entry.why) } }
        : { ...x, prompt: ltrFormulas(x.prompt), steps: many(x.steps), ...(x.kind === "choice" ? { options: many(x.options) } : {}) },
    ),
    traps: m.traps.map((t: Trap) => ({ ...t, prompt: ltrFormulas(t.prompt), options: many(t.options), why: ltrFormulas(t.why), traps: many(t.traps) })),
    tips: many(m.tips),
  };
}

/** A screen's self-check, with its formulas laid out left to right. */
export const ltrQuiz = <T extends { q: string; options: string[]; why: string }>(items: T[]) => items.map((i) => ({ ...i, q: ltrFormulas(i.q), options: many(i.options), why: ltrFormulas(i.why) }));

/** Concept screens whose lead, when it is plain text, has its formulas laid out left to right. */
export const ltrLeads = <T extends { lead?: unknown }>(screens: Record<string, T>) =>
  Object.fromEntries(Object.entries(screens).map(([id, c]) => [id, typeof c.lead === "string" ? { ...c, lead: ltrFormulas(c.lead) } : c])) as Record<string, T>;
