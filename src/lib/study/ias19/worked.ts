import type { StudyModule } from "../types";
import { FORMULA } from "./formulas";
import { ltrFormulas } from "./ltr";
import type { WLine, WorkedBody, WPoint, WStep, WTable } from "../worked";

/**
 * IAS 19's practice solutions in the site's worked layout, by the owner's
 * approval of the before/after on 2026-11-10. Nothing is retyped: each
 * solution is read from the lines the course already builds (src/lib/study/
 * ias19/formulas.ts), so the course's order stays as it is: the formula as
 * the course defined it, then the numbers, then Excel, now as a card beside
 * the formula. A roll-forward written as lines becomes the worksheet column,
 * credit negative, with the missing line lit. A plain present value gets a
 * timeline and a discount table. Negatives with a minus sign, as the course
 * writes them.
 */

type Excel = { formula?: string; numbers: string };
type Part = { text: string[]; fx?: [string, string]; excel?: Excel; roll?: { title: string; lines: WLine[] } };

const ROLL_LINE = /^(.+?):\s+(\(?−?-?[\d,.]+\)?)(\s+←.*)?$/;
const num = (s: string) => {
  const neg = /^\(.*\)$/.test(s) || /^[−-]/.test(s);
  return (neg ? -1 : 1) * Number(s.replace(/[()−\-,]/g, ""));
};
const isFormulaPair = (a: string, b?: string) => !!b && a.includes("=") && b.includes("=") && /\d/.test(b) && /[A-Za-zא-ת]/.test(a.split("=")[0]);

/** One step's string, read into its prose, its formula and numbers, its Excel, or its roll-forward. */
function readStep(s: string): Part {
  const lines = s.split("\n");
  const part: Part = { text: [] };
  // A roll-forward: a title line ending in a colon, then "label: amount" lines.
  if (lines.length >= 3 && lines[0].endsWith(":") && lines.slice(1).every((l) => ROLL_LINE.test(l))) {
    const rows = lines.slice(1).map((l) => l.match(ROLL_LINE)!);
    part.roll = {
      title: lines[0].slice(0, -1),
      lines: rows.map((m, i) => ({ l: m[3] ? `${m[1]}: השורה החסרה` : m[1], a: num(m[2]), k: m[3] ? "focal" : i === rows.length - 1 ? "tot" : i === 0 ? undefined : "op" })),
    };
    return part;
  }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l === "בנוסחה:") {
      part.fx = [lines[i + 1], lines[i + 2]];
      i += 2;
    } else if (l === "באקסל:") {
      const rest = lines.slice(i + 1);
      part.excel = rest.length >= 2 ? { formula: rest[0], numbers: rest[1] } : { numbers: rest[0] };
      i = lines.length;
    } else if (!part.fx && isFormulaPair(l, lines[i + 1])) {
      part.fx = [l, lines[i + 1]];
      i += 1;
    } else if (l.trim()) part.text.push(l.replace(/:$/, "."));
  }
  return part;
}

/** A plain present value: the payment on its date, the discount factor and the value today. */
function presentValue(fx: [string, string]): { timeline?: WPoint[]; table?: WTable } {
  if (!/÷ \(1 \+ (RATE|i)\)\^(YEAR|n) = (PV|ערך נוכחי)$/.test(fx[0])) return {};
  const m = fx[1].match(/^([\d,.]+) ÷ \(?([\d.]+)\)?\^([\d.]+) = ([\d,.−-]+)/);
  if (!m) return {};
  const [fv, base, n] = [Number(m[1].replace(/,/g, "")), Number(m[2]), Number(m[3])];
  const later = (k: number) => (k === 1 ? "בעוד שנה" : k === 2 ? "בעוד שנתיים" : `בעוד ${k} שנים`);
  const whole = Number.isInteger(n) && n <= 6;
  const timeline: WPoint[] = whole
    ? [{ d: "היום", n: "מודדים", key: true }, ...Array.from({ length: n - 1 }, (_, k) => ({ d: later(k + 1) })), { d: later(n), n: "התשלום", cf: fv, key: true }]
    : [{ d: "היום", n: "מודדים", key: true }, { d: `בעוד ${n} שנים`, n: "התשלום", cf: fv, key: true }];
  const factor = 1 / base ** n;
  return {
    timeline,
    table: { head: ["מועד", "תזרים", "מקדם היוון", "ערך נוכחי"], rows: [{ c: [whole ? later(n) : `בעוד ${n} שנים`, fv, `1 ÷ ${base}^${n} = ${factor.toFixed(6)}`, Math.round(fv * factor)], res: true }] },
  };
}

/**
 * The five ingredients of a measurement (the course's ①–⑤), read from the
 * numbers of its formula, each with where it came from: the earlier step that
 * worked it out, or the question's givens.
 */
function fiveIngredients(fx: [string, string], earlier: WStep[], prose: string): WStep | undefined {
  if (fx[0] !== FORMULA.measure) return undefined;
  const m = fx[1].match(/^([\d,.]+) × ([\d,.]+) × ([\d,.]+) ÷ ([\d.]+)\^([\d.]+) = /);
  if (!m) return undefined;
  const value = (s: string) => Number(s.replace(/,/g, ""));
  const from = (v: string) => {
    const hit = earlier.find((st) => st.fx && value(st.fx[1].split("=").at(-1)!.replace(/[₪\s]/g, "")) === value(v));
    return hit ? "`" + hit.fx![1].slice(0, hit.fx![1].lastIndexOf(" =")) + "`" : "נתון";
  };
  const rate = Math.round((Number(m[4]) - 1) * 10000) / 100;
  return {
    h: "חמשת המרכיבים",
    tables: [
      {
        head: ["", "המרכיב", "הערך", "מאיפה"],
        rows: [
          { c: ["①", "הטבה לשנת שירות", m[1], from(m[1])] },
          { c: ["②", "שנות שירות שנצברו", m[2], from(m[2])] },
          { c: ["③", "עובדים צפויים", m[3], from(m[3])] },
          { c: ["④", "n, שנים עד התשלום", m[5], from(m[5])] },
          { c: ["⑤", "i, שיעור ההיוון", `${rate}%`, /קונצרנית/.test(prose) ? "הקונצרנית האיכותית בתאריך המדידה, לא הממשלתית" : "בתאריך המדידה"] },
        ],
      },
    ],
  };
}

/** What a step finds: the right-hand side of its formula ("ערך נוכחי", "עלות ריבית"). */
const finds = (fx: [string, string]) => fx[0].split("=").at(-1)!.trim();

/** The question's givens and what it asks, from its own text: one fact per sentence, the question last. */
function givensOf(prompt: string): { givens?: string[]; required?: string[] } {
  const raw = prompt.split(/(?<!P\.N\.)(?<=[.;?])\s+(?=\S)/).map((p) => p.trim()).filter(Boolean);
  // Never break inside brackets: "(הפסד, בסכום חיובי. בלי עיגולי ביניים)?" stays one piece.
  const parts: string[] = [];
  for (const r of raw) {
    const prev = parts.at(-1);
    if (prev !== undefined && (prev.match(/\(/g)?.length ?? 0) > (prev.match(/\)/g)?.length ?? 0)) parts[parts.length - 1] = `${prev} ${r}`;
    else parts.push(r);
  }
  const asks = parts.filter((p) => p.includes("?"));
  const facts = parts.filter((p) => !p.includes("?"));
  if (!asks.length || !facts.length) return {};
  return { givens: facts.map((f) => f.replace(/;$/, ".")), required: asks };
}

const MATH = /[=×÷]/;
/** A calculation written on one line ("קבוצת 2016: 4 × 4,000 × 6 ÷ 1.06^9 = 56,822"): its label, when it leads with one, heads the step. */
function oneLine(text: string): WStep {
  const m = text.match(/^([^:=×÷,;\d][^:=×÷,;]{1,24}):\s+(.+)$/);
  return m ? { h: m[1], p: [m[2]] } : { h: "החישוב", p: [text] };
}

export function ias19Worked(prompt: string, steps: string[], kind: "choice" | "number" | "entry" = "number"): WorkedBody {
  const parts = steps.map(readStep);
  const calc = parts.some((p) => p.fx || p.roll || p.excel || p.text.some((t) => MATH.test(t) && /\d/.test(t)));
  // Reasoning in words: light for a choice; a number worked out in prose keeps a solution step of its own.
  if (!calc) return kind === "choice" ? ltrAll({ light: true, steps: [{ h: "הנימוק", p: parts.flatMap((p) => p.text) }] }) : ltrAll({ neg: "minus", ...givensOf(prompt), steps: [{ h: "הפתרון", p: parts.flatMap((p) => p.text) }] });
  const out: WStep[] = [];
  let pending: string[] = [];
  for (const p of parts) {
    if (!p.fx && !p.roll && !p.excel) {
      for (const t of p.text) {
        // A calculation on one line is a step of its own; plain prose is the note of the next step, or a line under the last one.
        if (MATH.test(t) && /\d/.test(t)) {
          const st = oneLine(t);
          if (pending.length) st.why = [out.length === 0 ? "איזה כלי?" : "למה?", pending.join(" ")];
          pending = [];
          out.push(st);
        } else pending.push(t);
      }
      continue;
    }
    const text = [...pending, ...p.text];
    pending = [];
    const five = p.fx ? fiveIngredients(p.fx, out, [...steps, prompt].join(" ")) : undefined;
    if (five) out.push(five);
    const pv = p.fx ? presentValue(p.fx) : {};
    out.push({
      h: p.roll ? p.roll.title : p.fx ? finds(p.fx) : "באקסל",
      timeline: pv.timeline,
      tables: pv.table ? [pv.table] : undefined,
      sheet: p.roll?.lines,
      why: text.length ? [out.length === 0 ? "איזה כלי?" : "למה?", text.join(" ")] : undefined,
      fx: p.fx,
      excel: p.excel,
    });
  }
  if (pending.length) {
    const last = out[out.length - 1];
    last.p = [...(last.p ?? []), ...pending];
  }
  return ltrAll({ neg: "minus", ...givensOf(prompt), steps: out });
}

/** Prose with its formulas laid out left to right, as the course does it everywhere (src/lib/study/ias19/ltr.ts). */
function ltrAll(w: WorkedBody): WorkedBody {
  return {
    ...w,
    givens: w.givens?.map(ltrFormulas),
    required: w.required?.map(ltrFormulas),
    steps: w.steps.map((s) => ({ ...s, h: ltrFormulas(s.h), p: s.p?.map(ltrFormulas), why: s.why && [s.why[0], ltrFormulas(s.why[1])] })),
  };
}

/** A lesson whose practice questions carry their worked solutions; entries keep their own board. */
export const withWorked = (m: StudyModule): StudyModule => ({
  ...m,
  exercises: m.exercises.map((x) => (x.kind === "journal" || x.worked ? x : { ...x, worked: ias19Worked(x.prompt, x.steps, x.kind) })),
});
