import assert from "node:assert/strict";
import { describe, it } from "node:test";
import katex from "katex";
import { explainRevaluation, revaluationErrors, type RevaluationInputs, solveLand, solveRevaluation, splitRevaluation } from "./revaluation";

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

describe("revalued every year: a building with salvage, on land", () => {
  const Y: RevaluationInputs = {
    cost: 500_000,
    salvage: 50_000,
    life: 10,
    method: "sl",
    firstYear: 2020,
    revaluations: [491_000, 450_000, 386_000, 344_000].map((fairValue, i) => ({ year: 2020 + i, timing: "end" as const, fairValue })),
    transfer: "depreciation",
  };
  const r = solveRevaluation(Y);

  it("depreciates fair value less salvage over the life left, and moves the surplus over the same years", () => {
    // (491,000 − 50,000) ÷ 9 = 49,000; surplus 36,000 ÷ 9 = 4,000 = 49,000 − 45,000.
    assert.equal(r2(row(r, 2021).dep), 49_000);
    assert.equal(r2(row(r, 2021).transfer), 4_000);
    assert.equal(r2(row(r, 2022).dep), 50_000);
    assert.equal(r2(row(r, 2022).transfer), 5_000);
    assert.equal(r2(row(r, 2023).dep), 48_000);
    assert.equal(r2(row(r, 2023).transfer), 3_000);
    assert.equal(r2(row(r, 2024).transfer), 4_000);
  });

  it("the land is revalued on its own, with no depreciation and no transfer", () => {
    const land = solveLand(100_000, [110_000, 115_000, 105_000, 108_000].map((fairValue, i) => ({ year: 2020 + i, fairValue })));
    assert.deepEqual(
      land.map((x) => x.surplus),
      [10_000, 15_000, 5_000, 8_000],
    );
  });

  it("the calculator's working shows the transfer as the surplus over the years left", () => {
    const step = explainRevaluation(Y, r).find((s) => s.year === 2021)!;
    assert.ok(step.calcs.some((c) => c.tex?.includes(String.raw`\frac{36{,}000}{9} = 4{,}000`)));
    assert.ok(step.calcs.some((c) => c.tex?.includes(String.raw`\frac{491{,}000 - 50{,}000}{9} = 49{,}000`)));
  });
});

describe("the calculator's working, year by year", () => {
  for (const method of ["sl", "db", "syd-desc", "syd-asc"] as const)
    for (const timing of ["start", "mid", "end"] as const)
      it(`${method}, revalued at ${timing}: the parts add up to the year's charge, and every formula renders`, () => {
        const x: RevaluationInputs = { ...SL, salvage: method === "db" ? 10_000 : SL.salvage, method, revaluations: [{ year: SL.firstYear + 1, timing, fairValue: 250_000 }] };
        const r = solveRevaluation(x);
        for (const step of explainRevaluation(x, r)) {
          for (const c of step.calcs) if (c.tex) assert.doesNotThrow(() => katex.renderToString(c.tex!, { throwOnError: true, displayMode: true }), c.tex);
          const total = step.calcs.find((c) => c.label.startsWith("סך הפחת"));
          const shown = total ? total.tex! : step.calcs.find((c) => c.label.startsWith("פחת"))!.tex!;
          assert.ok(shown.endsWith(`= ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(r2(row(r, step.year).dep) + 0).replace(/,/g, "{,}")}`), `${step.year}: ${shown}`);
        }
      });
  it("a mid-year revaluation sits between the charge before it and the charge after it", () => {
    const x: RevaluationInputs = { ...SL, revaluations: [{ year: SL.firstYear + 1, timing: "mid", fairValue: 250_000 }] };
    const labels = explainRevaluation(x, solveRevaluation(x)).find((s) => s.year === SL.firstYear + 1)!.calcs.map((c) => c.label);
    const first = labels.findIndex((l) => l.startsWith("פחת לפי העלות"));
    const reval = labels.findIndex((l) => l.startsWith("הערכה מחדש"));
    const after = labels.findIndex((l) => l.startsWith("פחת לפי השווי ההוגן"));
    assert.ok(first < reval && reval < after, labels.join(" | "));
  });
});
