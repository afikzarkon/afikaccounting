import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IAS19_LESSONS } from "./ias19";
import { agora } from "./worked";
import { TOOL_QUESTIONS } from "./ias19/tools-worked";
import { CASE, CASE_TODAY } from "./ias19/lessons/toolkit";

const MARKS = /[\u2066-\u2069\u200e]/g;
const clean = (s: string) => s.replace(MARKS, "");
const questions = IAS19_LESSONS.flatMap((m) => m.exercises.flatMap((e) => (e.kind === "journal" ? [] : [{ m, e }])));

describe("IAS 19 practice solutions in the worked-solution layout", () => {
  it("gives every practice question a worked solution, and keeps the old lines for the hint", () => {
    for (const { m, e } of questions) {
      assert.ok(e.worked, `${m.slug}/${e.id}`);
      assert.ok(e.steps.length > 0);
    }
  });

  it("keeps the course's formula, numbers and Excel word for word (the course's own order: formula, numbers, then Excel)", () => {
    for (const { m, e } of questions) {
      const fx = e.worked!.steps.flatMap((s) => [...(s.fx ?? []), ...(s.excel ? [s.excel.formula ?? "", s.excel.numbers] : [])]).map(clean);
      for (const step of e.steps) {
        const lines = clean(step).split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i] === "בנוסחה:") for (const l of lines.slice(i + 1, i + 3)) assert.ok(fx.includes(l), `${m.slug}/${e.id}: "${l}"`);
          if (lines[i] === "באקסל:") for (const l of lines.slice(i + 1)) assert.ok(fx.includes(l), `${m.slug}/${e.id}: Excel "${l}"`);
        }
      }
    }
  });

  it("closes every roll-forward column, credit negative as the course writes it", () => {
    for (const { m, e } of questions)
      for (const s of e.worked!.steps) {
        if (!s.sheet) continue;
        const tot = s.sheet.at(-1)!;
        assert.equal(tot.k, "tot");
        const sum = s.sheet.slice(0, -1).reduce((t, l) => t + Number(l.a), 0);
        assert.equal(agora(sum), agora(Number(tot.a)), `${m.slug}/${e.id}`);
        assert.ok(e.worked!.neg === "minus");
      }
  });

  it("explains a classification in words, and shows a present value on a timeline with its discount table", () => {
    for (const { m, e } of questions) {
      if (e.kind === "choice" && e.worked!.light) assert.equal(e.worked!.steps.length, 1, `${m.slug}/${e.id}`);
      for (const s of e.worked!.steps) if (s.timeline) assert.ok(s.tables?.[0]?.rows[0]?.res, `${m.slug}/${e.id}`);
    }
  });

  it("the toolkit screen's four questions: each sheet closes, the payments are the missing line, and the present value is the course's", () => {
    const [q1, , q3, q4] = TOOL_QUESTIONS;
    assert.equal(q1.steps[0].tables![0].rows[0].c[3], CASE_TODAY);
    for (const q of [q3, q4]) {
      const sheet = q.steps.find((s) => s.sheet)!.sheet!;
      assert.equal(agora(sheet.slice(0, -1).reduce((t, l) => t + Number(l.a), 0)), agora(Number(sheet.at(-1)!.a)), q.title);
    }
    const v = CASE.vacation;
    assert.equal(q4.steps[0].sheet!.find((l) => l.k === "focal")!.a, v.opening + v.expense - v.closing);
    for (const q of TOOL_QUESTIONS) assert.ok(q.steps.some((s) => s.fx && s.excel), `${q.title}: formula and Excel side by side`);
  });

  it("puts the five ingredients before every measurement, and they give the measurement's result (the owner, 2026-11-10)", () => {
    let seen = 0;
    for (const { m, e } of questions) {
      const steps = e.worked!.steps;
      steps.forEach((st, k) => {
        if (st.h !== "חמשת המרכיבים") return;
        seen++;
        const rows = st.tables![0].rows.map((r) => r.c[2] as string);
        const [per, years, heads, n] = rows.slice(0, 4).map((v) => Number(v.replace(/,/g, "")));
        const i = Number(rows[4].replace("%", "")) / 100;
        const next = steps[k + 1].fx!;
        const result = Number(clean(next[1]).split("=").at(-1)!.replace(/[₪,\s]/g, ""));
        assert.equal(Math.round((per * years * heads) / (1 + i) ** n), result, `${m.slug}/${e.id}`);
      });
    }
    assert.equal(seen, 9);
  });
});
