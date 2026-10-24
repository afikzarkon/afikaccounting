import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DB_EX, depLines, nettingLines, proportionalLines, SL_EX, SYD_EX, transferLines } from "../../components/revaluation/data";
import { solveExchange } from "./exchange";
import {
  MACHINE,
  MACHINE_ANNUAL,
  MACHINE_COST,
  MACHINE_EXCHANGE,
  MACHINE_EXPENSED,
  machineAccumulatedAtStartOf,
  machineFirstYearByMethod,
  machineSchedule,
} from "./ias16-example";
import { solveRevaluation } from "./revaluation";

const r2 = (v: number) => Math.round(v * 100) / 100 + 0;
type Line = { account: string; dr?: number; cr?: number };
const balanced = (lines: Line[]) => Math.abs(lines.reduce((s, l) => s + (l.dr ?? 0) - (l.cr ?? 0), 0)) < 0.005;

describe("the central machine: how to solve a question", () => {
  it("cost and expenses (step 4)", () => {
    assert.equal(MACHINE_COST, 300_000);
    assert.equal(MACHINE_EXPENSED, 9_000);
  });
  it("the schedule: 9 months in 2020, four full years, 3 months in 2025 (steps 5, 8, 9)", () => {
    const s = machineSchedule();
    assert.deepEqual(
      s.map((r) => [r.year, r.months, r.dep]),
      [
        [2020, 9, 40_500],
        [2021, 12, 54_000],
        [2022, 12, 54_000],
        [2023, 12, 54_000],
        [2024, 12, 54_000],
        [2025, 3, 13_500],
      ],
    );
    assert.equal(s.at(-1)!.accumulated, MACHINE_COST - MACHINE.salvage);
    assert.equal(s.at(-1)!.carrying, MACHINE.salvage);
    assert.equal(s[0].carrying, 259_500);
    assert.equal(s[1].carrying, 205_500);
  });
  it("the first year under each method (step 3)", () => {
    const m = machineFirstYearByMethod();
    assert.deepEqual([m.sl, m.syd, m.db, m.units], [40_500, 67_500, 90_000, 36_000]);
  });
});

describe("the exchange page continues the same machine", () => {
  const w = solveExchange(MACHINE_EXCHANGE);
  it("opens 2023 with the schedule's accumulated depreciation", () => {
    assert.equal(MACHINE_EXCHANGE.accumulatedOpening, 148_500);
    assert.equal(machineAccumulatedAtStartOf(2023), 40_500 + 54_000 * 2);
    assert.equal(w.oldAnnual, MACHINE_ANNUAL);
  });
  it("brings depreciation to 1.4.2023, then the gain and the new cost", () => {
    assert.equal(w.depToDate, 13_500);
    assert.equal(w.accumulated, 162_000);
    assert.equal(w.bookValue, 138_000);
    assert.equal(w.gain, 12_000);
    assert.equal(w.newCost, 190_000);
    assert.equal(w.newDep, 27_000);
    assert.equal(w.totalDep, 40_500);
  });
  it("the other two cases on the page", () => {
    const rec = solveExchange({ ...MACHINE_EXCHANGE, basis: "received" });
    assert.equal(rec.fairValueGiven, 160_000);
    assert.equal(rec.gain, 22_000);
    assert.equal(rec.newCost, 200_000);
    const without = solveExchange({ ...MACHINE_EXCHANGE, commercial: false });
    assert.equal(without.newCost, 178_000);
    assert.equal(without.gain, 0);
    assert.equal(w.newCost - without.newCost, w.gain);
  });
});

describe("the revaluation page's central building", () => {
  const dep = solveRevaluation(SL_EX);
  const disp = solveRevaluation({ ...SL_EX, transfer: "disposal" });
  it("two revaluations, nothing to profit or loss", () => {
    assert.deepEqual(
      dep.events.map((e) => [e.year, e.before, e.diff, e.oci, e.pl]),
      [
        [2020, 240_000, 120_000, 120_000, 0],
        [2022, 180_000, -30_000, -30_000, 0],
      ],
    );
  });
  it("the gold tip's table, year by year", () => {
    assert.deepEqual(
      dep.rows.map((r) => [r.year, r2(r.dep), r2(r.closing), r2(r.costCarrying), r2(r.surplus), r2(disp.rows.find((x) => x.year === r.year)!.surplus)]),
      [
        [2020, 60_000, 360_000, 240_000, 120_000, 120_000],
        [2021, 90_000, 270_000, 180_000, 90_000, 120_000],
        [2022, 90_000, 150_000, 120_000, 30_000, 90_000],
        [2023, 75_000, 75_000, 60_000, 15_000, 90_000],
        [2024, 75_000, 0, 0, 0, 90_000],
      ],
    );
  });
  it("the carrying amount — and the gap — don't depend on how the surplus is transferred", () => {
    dep.rows.forEach((r, i) => {
      assert.equal(r2(r.closing), r2(disp.rows[i].closing));
      assert.equal(r2(r.costCarrying), r2(disp.rows[i].costCarrying));
    });
  });
  it("gap = surplus every year with transfers at the rate of depreciation, and only in the revaluation year without them", () => {
    for (const r of dep.rows) assert.equal(r2(r.surplus), r2(r.closing - r.costCarrying), `${r.year}`);
    const holdsAtDisposal = disp.rows.filter((r) => Math.abs(r.surplus - (r.closing - r.costCarrying)) < 0.01).map((r) => r.year);
    assert.deepEqual(holdsAtDisposal, [2020]);
  });
  it("the same building by sum of the years' digits: round charges, the surplus closes to zero", () => {
    const s = solveRevaluation(SYD_EX);
    assert.deepEqual(
      s.rows.map((r) => [r2(r.dep), r2(r.transfer), r2(r.surplus)]),
      [
        [100_000, 0, 160_000],
        [144_000, 64_000, 96_000],
        [108_000, 48_000, 90_000],
        [100_000, 60_000, 30_000],
        [50_000, 30_000, 0],
      ],
    );
  });
  it("every journal entry on the page balances, and the entries rebuild the building's balance", () => {
    for (const x of [SL_EX, SYD_EX, DB_EX]) {
      const r = solveRevaluation(x);
      let building = x.cost;
      let acc = 0;
      for (const row of r.rows) {
        const ev = r.events.find((e) => e.year === row.year);
        const all: Line[][] = [depLines(row.dep), ...(row.transfer > 0.005 ? [transferLines(row.transfer)] : []), ...(ev ? [nettingLines(ev), proportionalLines(ev)] : [])];
        for (const l of all) assert.ok(balanced(l), `${x.method} ${row.year}`);
        acc += row.dep;
        if (ev) {
          for (const l of nettingLines(ev)) {
            if (l.account === "מבנה") building += (l.dr ?? 0) - (l.cr ?? 0);
            if (l.account === "פחת נצבר") acc -= (l.dr ?? 0) - (l.cr ?? 0);
          }
        }
        assert.equal(r2(building - acc), r2(row.closing), `${x.method} ${row.year}`);
      }
    }
  });
  it("proportional restatement on the central building: factor 1.5", () => {
    const [ev] = solveRevaluation(SL_EX).events;
    assert.equal(ev.factor, 1.5);
    assert.equal(ev.propGrossAfter, 450_000);
    assert.equal(ev.propAccAfter, 90_000);
  });
});
