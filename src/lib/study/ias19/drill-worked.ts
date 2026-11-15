import type { WorkedBody, WStep } from "../worked";
import type { Drill } from "./drills";
import { answersStep, withCalcTable } from "./calc-table";
import { ltrFormulas } from "./ltr";

/**
 * A drawn practice question's solution in the site's worked layout, the one
 * the consolidated course shows: numbered steps in their frames, the journal
 * entry on its own, and the table last. Nothing is retyped: every line is the
 * drill's own (src/lib/study/ias19/drills.ts), its formulas laid out left to
 * right. What we look for and what we check open the solution as its first
 * two steps, so the solving template stays in the course's order.
 */

/** The card numbers its steps: a step's own "2." goes, its ①–⑤ stay. */
const unnumbered = (t: string) => t.replace(/^\s*\d+[.)]\s*/, "");

export function drillWorked(d: Drill): WorkedBody {
  const steps: WStep[] = [
    { h: "מה מחפשים", p: d.seek.map(ltrFormulas) },
    { h: "מה בודקים", p: d.check.map(ltrFormulas) },
    ...d.build.map((b) => withCalcTable({ h: ltrFormulas(unnumbered(b.title)) }, b.lines.map(ltrFormulas))),
  ];
  if (d.entry) {
    // A step that writes the entry out in words gives way to the entry itself, drawn as one.
    const entry = { h: "הפקודה", entry: { lines: d.entry.map((l) => ({ a: l.account, dr: l.dr, cr: l.cr })) } };
    const at = steps.findIndex((s) => s.h === "הפקודה");
    if (at >= 0) steps[at] = entry;
    else steps.push(entry);
  }
  steps.push(answersStep(d.asks.map((a) => [a.label, a.kind === "number" ? (a.unit && a.unit !== "₪" ? `${Math.round(a.answer).toLocaleString("en-US")} ${a.unit}` : Math.round(a.answer)) : a.options[a.answer]])));
  return {
    neg: "minus",
    calc: "table",
    steps,
    summary: d.table && {
      head: d.table.head,
      rows: [...d.table.rows.map((r) => ({ c: r.map((c) => (typeof c === "number" ? Math.round(c) : ltrFormulas(c))) })), ...(d.table.foot ? [{ c: d.table.foot.map((c) => (typeof c === "number" ? Math.round(c) : ltrFormulas(c))), res: true }] : [])],
    },
  };
}
