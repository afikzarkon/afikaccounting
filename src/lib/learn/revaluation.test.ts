import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { revaluationErrors, type RevaluationInputs, solveLand, solveRevaluation, splitRevaluation } from "./revaluation";

const r2 = (v: number) => Math.round(v * 100) / 100;

// Example 1 on the revaluation page: a building, straight-line, revalued on 31.12 of its second year.
const SL: RevaluationInputs = {
  cost: 100_000,
  salvage: 0,
  life: 10,
  method: "sl",
  firstYear: 2020,
  revaluations: [{ year: 2021, timing: "end", fairValue: 120_000 }],
  transfer: "depreciation",
};
// Example 2: sum of years' digits, descending.
const SYD: RevaluationInputs = {
  cost: 150_000,
  salvage: 0,
  life: 5,
  method: "syd-desc",
  firstYear: 2020,
  revaluations: [{ year: 2021, timing: "end", fairValue: 90_000 }],
  transfer: "depreciation",
};
// And declining balance, whose rates come out round.
const DB: RevaluationInputs = {
  cost: 160_000,
  salvage: 10_000,
  life: 4,
  method: "db",
  firstYear: 2020,
  revaluations: [{ year: 2021, timing: "end", fairValue: 90_000 }],
  transfer: "depreciation",
};

const row = (r: ReturnType<typeof solveRevaluation>, year: number) => r.rows.find((x) => x.year === year)!;

describe("learning lab revaluation", () => {
  it("straight-line: the gap to the surplus, the new charge, the yearly transfer", () => {
    const r = solveRevaluation(SL);
    const [ev] = r.events;
    assert.equal(ev.before, 80_000);
    assert.equal(ev.oci, 40_000);
    assert.equal(ev.pl, 0);
    assert.equal(row(r, 2021).surplus, 40_000);
    assert.equal(r2(row(r, 2022).dep), 15_000);
    assert.equal(r2(row(r, 2022).costDep), 10_000);
    assert.equal(r2(row(r, 2022).transfer), 5_000);
    assert.equal(r2(r.rows.at(-1)!.surplus), 0);
  });

  it("elimination and proportional restatement give the same carrying amount", () => {
    const [ev] = solveRevaluation(SL).events;
    assert.equal(ev.accEliminated, 20_000);
    assert.equal(ev.factor, 1.5);
    assert.equal(ev.propGrossAfter, 150_000);
    assert.equal(ev.propAccAfter, 30_000);
  });

  it("with transfers at the rate of depreciation, the surplus equals the revalued carrying amount less the cost-model one", () => {
    for (const x of [SL, SYD, DB, { ...SL, revaluations: [{ year: 2022, timing: "mid" as const, fairValue: 120_000 }] }]) {
      for (const y of solveRevaluation(x).rows) assert.equal(r2(y.surplus) + 0, r2(y.closing - y.costCarrying) + 0, `${x.method} ${y.year}`);
    }
  });

  it("…but not when the surplus stays until disposal", () => {
    const r = solveRevaluation({ ...SL, transfer: "disposal" });
    assert.equal(row(r, 2023).surplus, 40_000);
    assert.notEqual(r2(row(r, 2023).closing - row(r, 2023).costCarrying), 40_000);
  });

  it("sum of years' digits: new digits on the remaining life, transfers by year", () => {
    const r = solveRevaluation(SYD);
    assert.deepEqual([2022, 2023, 2024].map((y) => r2(row(r, y).dep)), [45_000, 30_000, 15_000]);
    assert.deepEqual([2022, 2023, 2024].map((y) => r2(row(r, y).transfer)), [15_000, 10_000, 5_000]);
  });

  it("declining balance: a new rate on the fair value", () => {
    const r = solveRevaluation(DB);
    assert.deepEqual([2022, 2023].map((y) => r2(row(r, y).dep)), [60_000, 20_000]);
    assert.deepEqual([2022, 2023].map((y) => r2(row(r, y).transfer)), [40_000, 10_000]);
  });

  it("timing: 1 January, 1 July and 31 December", () => {
    const at = (timing: "start" | "mid" | "end") => solveRevaluation({ ...SL, revaluations: [{ year: 2022, timing, fairValue: 120_000 }] });
    assert.equal(r2(row(at("start"), 2022).dep), 15_000);
    assert.equal(r2(row(at("mid"), 2022).dep), 13_000); // 5,000 then 16,000 × 6/12
    assert.equal(r2(row(at("end"), 2022).dep), 10_000);
    assert.equal(r2(at("end").events[0].oci), 50_000);
  });

  it("later revaluations reverse earlier ones first", () => {
    assert.deepEqual(splitRevaluation(25_000, 0, 10_000), { pl: 10_000, oci: 15_000, losses: 0 });
    assert.deepEqual(splitRevaluation(-40_000, 30_000, 0), { pl: -10_000, oci: -30_000, losses: 10_000 });
    const r = solveRevaluation({ ...SL, revaluations: [...SL.revaluations, { year: 2023, timing: "end", fairValue: 50_000 }] });
    const second = r.events[1];
    assert.equal(r2(second.before), 90_000);
    assert.equal(r2(second.oci), -30_000); // the surplus left after two transfers of 5,000
    assert.equal(r2(second.pl), -10_000);
  });

  it("revalued every year: every case in turn, and the surplus runs out with the life", () => {
    const values = [99_000, 96_000, 77_000, 54_000, 55_000, 44_000, 36_000, 24_000, 12_000];
    const r = solveRevaluation({ ...SL, revaluations: values.map((fairValue, i) => ({ year: 2020 + i, timing: "end" as const, fairValue })) });
    assert.deepEqual(r.rows.map((y) => r2(y.dep)), [10_000, 11_000, 12_000, 11_000, 9_000, 11_000, 11_000, 12_000, 12_000, 12_000]);
    const ev = (year: number) => r.events.find((e) => e.year === year)!;
    assert.deepEqual([r2(ev(2022).oci), r2(ev(2022).pl) + 0], [-7_000, 0]); // within the surplus
    assert.deepEqual([r2(ev(2023).oci), r2(ev(2023).pl) + 0], [-6_000, -6_000]); // beyond it
    assert.deepEqual([r2(ev(2024).oci), r2(ev(2024).pl) + 0], [4_000, 6_000]); // reverses the loss first
    assert.equal(r2(r.rows.at(-1)!.surplus) + 0, 0);
    // The check holds until a loss goes to profit or loss.
    for (const y of r.rows.filter((x) => x.year < 2023)) assert.equal(r2(y.surplus), r2(y.closing - y.costCarrying));
    assert.notEqual(r2(row(r, 2024).surplus), r2(row(r, 2024).closing - row(r, 2024).costCarrying));
  });

  it("land: no depreciation, the same split rule each year, the surplus kept", () => {
    const rows = solveLand(500_000, [
      { year: 2020, fairValue: 540_000 },
      { year: 2021, fairValue: 520_000 },
      { year: 2022, fairValue: 490_000 },
      { year: 2023, fairValue: 530_000 },
    ]);
    assert.deepEqual(
      rows.map((x) => [x.oci, x.pl, x.surplus]),
      [
        [40_000, 0, 40_000],
        [-20_000, 0, 20_000],
        [-20_000, -10_000, 0],
        [30_000, 10_000, 30_000],
      ],
    );
  });

  it("rejects inputs it cannot solve", () => {
    assert.deepEqual(revaluationErrors(SL), {});
    assert.ok(revaluationErrors({ ...SL, revaluations: [{ year: 2029, timing: "end", fairValue: 1 }] })["revaluations.0"]);
    assert.ok(revaluationErrors({ ...SL, revaluations: [] }).revaluations);
    assert.ok(revaluationErrors({ ...DB, salvage: 0 }).salvage);
  });
});
