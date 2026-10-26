import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Method, METHODS, valuateChain } from "./inventory";
import { CALC_EXAMPLES, TZLIL } from "./inventory-examples";
import { solveUnknowns } from "./inventory-solver";
import { type LetteredUnknown, methodWalkthrough, missingStage, type WalkStage } from "./inventory-walkthrough";

const LETTERS = ["א'", "ב'", "ג'"];
const step = (stages: WalkStage[], id: string) => stages.flatMap((s) => s.steps).find((s) => s.id === id);
/** "1,234.5 ₪ (…)" → 1234.5 */
const num = (s: string) => Number(s.replace(/,/g, "").replace(/[^\d.\-−]/g, " ").trim().split(/\s+/)[0].replace("−", "-"));
const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) <= 0.01, `${msg ?? ""} expected ${b}, got ${a}`);

function walk(id: string, method: Method) {
  const ex = CALC_EXAMPLES.find((x) => x.id === id)!;
  const unknowns: LetteredUnknown[] = (ex.unknowns ?? []).map((x, i) => ({ ...x, letter: LETTERS[i] }));
  const knowns = ex.knowns ?? [];
  const solved = unknowns.length ? solveUnknowns(ex.periods!, method, unknowns, knowns) : undefined;
  const periods = solved?.ok ? solved.periods : ex.periods!;
  const rs = valuateChain(periods, method);
  return rs.map((r, t) => methodWalkthrough({ period: periods[t], r, year: t, prev: t > 0 && !periods[t].ownOpening ? rs[t - 1] : undefined, unknowns, knowns, solved: solved?.ok ? solved : undefined }));
}

describe("method walkthrough", () => {
  it("has the five stages, in order, for every method", () => {
    for (const m of METHODS) assert.deepEqual(walk("tzlil", m)[0].map((s) => s.id), ["data", "missing", "extras", "calc", "final"]);
  });

  it("FIFO: every sale is taken from named layers, and the slices add up to the cost of sales", () => {
    const [stages] = walk("tzlil", "fifo");
    const r = valuateChain([TZLIL], "fifo")[0];
    const out = step(stages, "w-fifo-out")!;
    assert.ok(out.calcs!.length >= TZLIL.sales.length);
    for (const c of out.calcs!) assert.match(c.sub, /×/);
    near(out.calcs!.reduce((s, c) => s + num(c.result), 0), r.cogs, "slices");
    near(num(step(stages, "w-fifo-left")!.calcs!.at(-1)!.result), r.closingCostBasis, "closing");
  });

  it("periodic average: the average is computed once and placed twice", () => {
    const [stages] = walk("tzlil", "wa-periodic");
    const r = valuateChain([TZLIL], "wa-periodic")[0];
    const avg = step(stages, "w-wa-avg")!.calcs!;
    assert.equal(avg.length, 3);
    near(num(avg[2].result), r.avgCost!, "avg");
    const place = step(stages, "w-wa-place")!.calcs!;
    near(num(place[0].result), r.closingCostBasis);
    near(num(place[1].result), r.availableCost - r.closingCostBasis);
  });

  it("moving average: one operation per movement", () => {
    const [stages] = walk("neyar", "moving-avg");
    const ex = CALC_EXAMPLES.find((x) => x.id === "neyar")!;
    const r = valuateChain(ex.periods!, "moving-avg")[0];
    assert.equal(step(stages, "w-ma-card")!.calcs!.length, r.ledger.length);
    near(num(step(stages, "w-ma-sum")!.calcs![0].result), r.closingCostBasis);
  });

  it("switching the method reworks the calculation stage", () => {
    const ids = (m: Method) => walk("tzlil", m)[0].find((s) => s.id === "calc")!.steps.map((s) => s.id);
    assert.ok(ids("fifo").includes("w-fifo-out"));
    assert.ok(ids("wa-periodic").includes("w-wa-avg"));
    assert.ok(ids("moving-avg").includes("w-ma-card"));
  });

  it("names each unknown as missing, and shows the given that finds it", () => {
    const years = walk("gabi", "wa-periodic");
    const ex = CALC_EXAMPLES.find((x) => x.id === "gabi")!;
    const all = years.flatMap((st) => st.flatMap((s) => s.steps));
    for (const un of ex.unknowns!) {
      assert.ok(all.some((s) => s.id === "w-holes" && s.walk?.some((w) => w.includes(un.label))), `missing: ${un.label}`);
      assert.ok(all.some((s) => s.id.startsWith("w-eq-") && s.calcs?.length), `found: ${un.label}`);
    }
  });

  it("the final answers are the engine's", () => {
    for (const m of METHODS) {
      const ex = CALC_EXAMPLES.find((x) => x.id === "shemesh")!;
      const r = valuateChain(ex.periods!, m)[0];
      const rows = step(walk("shemesh", m)[0], "w-answers")!.tables![0].rows;
      assert.equal(rows.find((x) => x[0] === "עלות המכר")![1], r.cogs);
      assert.equal(rows.find((x) => x[0] === "מלאי הסגירה בספרים")![1], r.closingCarrying);
    }
  });

  it("says what is missing before there is an answer", () => {
    const st = missingStage({ period: { ...TZLIL, sales: [{ qty: 10 }], purchases: [{ qty: 10, unitPrice: 5 }] }, year: 0, method: "moving-avg", unknowns: [], knowns: [], needsDates: true });
    const holes = st.steps.find((s) => s.id === "w-holes")!.walk!;
    assert.ok(holes.some((h) => h.includes("תאריכים")));
    assert.ok(holes.some((h) => h.includes("מחיר")));
  });

  it("runs for every example with years, under every method", () => {
    for (const ex of CALC_EXAMPLES.filter((x) => x.periods && x.tab === "full"))
      for (const m of METHODS) assert.doesNotThrow(() => walk(ex.id, m), `${ex.id} · ${m}`);
  });
});
