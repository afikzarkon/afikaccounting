import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canOpenExam, resolveAccess } from "../access";
import { cell, parseBlocks, parseSteps, parseSubjects } from "./parse";
import { type ExamMeta, matchesExam } from "./types";

const NOW = new Date("2026-11-01T12:00:00Z");
const sub = (tier: string, end: string | null = null) => ({ tier, status: "active", current_period_end: end });
const READERS = {
  guest: resolveAccess({ configured: true }),
  free: resolveAccess({ configured: true, userId: "u", rows: [] }),
  courses: resolveAccess({ configured: true, userId: "u", rows: [sub("courses")], now: NOW }),
  exams: resolveAccess({ configured: true, userId: "u", rows: [sub("exams")], now: NOW }),
  expired: resolveAccess({ configured: true, userId: "u", rows: [sub("exams", "2026-10-01T00:00:00Z")], now: NOW }),
  admin: resolveAccess({ configured: true, userId: "u", admin: true }),
  demo: resolveAccess({ configured: false }),
};

describe("who opens an exam", () => {
  const locked = { isSample: false };
  const sample = { isSample: true };
  it("opens a locked exam on the exams plan only (and to admins, and in demo mode)", () => {
    const open = Object.entries(READERS)
      .filter(([, a]) => canOpenExam(a, locked))
      .map(([k]) => k);
    assert.deepEqual(open, ["exams", "admin", "demo"]);
  });
  it("opens a sample to everyone", () => {
    for (const [who, a] of Object.entries(READERS)) assert.ok(canOpenExam(a, sample), who);
  });
});

describe("solution data from the editor", () => {
  it("reads typed amounts and cells as numbers", () => {
    assert.equal(cell("1,200"), 1200);
    assert.equal(cell("(300)"), -300);
    assert.equal(cell("48.75"), 48.75);
    assert.equal(cell("מלאי פתיחה"), "מלאי פתיחה");
    assert.equal(cell("31.12"), "31.12", "a date stays text");
    assert.equal(cell("10.3"), "10.3");
    assert.equal(cell("1.1.2026"), "1.1.2026");
  });
  it("keeps journal lines with an account and an amount, and drops the rest", () => {
    const [b] = parseBlocks([{ kind: "entry", title: "", lines: [{ account: "מלאי", dr: "1,000" }, { account: "ספקים", cr: "1000" }, { account: "", dr: 5 }, { account: "ריק" }] }]);
    assert.deepEqual(b, { kind: "entry", title: "פקודת יומן", lines: [{ account: "מלאי", dr: 1000 }, { account: "ספקים", cr: 1000 }] });
  });
  it("drops unknown or empty blocks, and caps text", () => {
    assert.deepEqual(parseBlocks([{ kind: "script", text: "x" }, { kind: "text", text: "  " }, null, "x", { kind: "text", text: "a".repeat(9000) }]).map((b) => b.kind === "text" && b.text.length), [8000]);
  });
  it("cuts table rows to the columns, and keeps a step with only a title", () => {
    const [t] = parseBlocks([{ kind: "table", head: ["א", "ב"], rows: [["x", "1", "extra"], ["", ""]] }]);
    assert.deepEqual(t, { kind: "table", head: ["א", "ב"], rows: [["x", 1]] });
    assert.deepEqual(parseSteps([{ title: "רק כותרת" }, {}]), [{ title: "רק כותרת", explanation: "", blocks: [] }]);
  });
  it("splits subjects by commas, once each", () => assert.deepEqual(parseSubjects("FIFO, שווי מימוש נטו,FIFO, "), ["FIFO", "שווי מימוש נטו"]));
});

describe("the exams area's filter", () => {
  const exam = (topic: string, year: number, subjects: string[]): ExamMeta => ({ id: `${topic}-${year}`, topic, year, session: "", title: topic, description: "", subjects, hasPaper: false, isSample: false, published: true });
  const all = [exam("inventory", 2026, ["FIFO", "שווי מימוש נטו"]), exam("inventory", 2025, ["שריפה וביטוח"]), exam("ias16", 2026, ["הערכה מחדש"])];
  it("filters by topic, subject and year", () => {
    assert.equal(all.filter((e) => matchesExam(e, { topic: "inventory" })).length, 2);
    assert.equal(all.filter((e) => matchesExam(e, { subject: "FIFO" })).length, 1);
    assert.equal(all.filter((e) => matchesExam(e, { year: "2025" })).length, 1);
    assert.equal(all.filter((e) => matchesExam(e, { topic: "ias16", year: "2025" })).length, 0);
  });
});
