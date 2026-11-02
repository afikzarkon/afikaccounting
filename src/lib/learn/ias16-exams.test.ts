import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sydYears, timeSchedule } from "./depreciation";
import { LOGI_Q, logi, press, SHAKED_Q, shaked } from "./ias16-exams";
import { solveLand, solveRevaluation } from "./revaluation";

const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 0.005, `${where}: ${a} ≠ ${b}`);

describe("exam question 1: Hadfus Hayarok", () => {
  const p = press();

  it("the cost, and what was expensed", () => {
    near(p.cost, 685_000, "cost");
    near(p.expensed2024, 35_000, "expensed");
    near(p.parts.head, 274_000, "head");
  });

  it("the head by the sum of the years' digits from April agrees with the depreciation solver", () => {
    const rows = timeSchedule({ cost: p.parts.head, salvage: 0, life: 4, startMonth: 4 }, sydYears({ cost: p.parts.head, salvage: 0, life: 4, startMonth: 4 }, "desc")).rows;
    near(p.head[0], rows[0].charge, "2024");
    near(p.head[1], rows[1].charge, "2025");
    near(p.head[1], 89_050, "2025 by hand");
  });

  it("the frame, the motor before and after its improvement, and the years' totals", () => {
    near(p.frame[0], 19_500, "frame 2024");
    near(p.rate1, 5, "first rate");
    near(p.motorCarryingAtImprovement, 109_000, "motor carrying");
    near(p.rate2, 6, "new rate");
    near(p.motor[1], 23_200, "motor 2025");
    near(p.dep[0], 119_700, "2024");
    near(p.dep[1], 138_250, "2025");
  });

  it("the exchange", () => {
    near(p.carrying2025, 470_050, "carrying");
    near(p.gain, 29_950, "gain");
    near(p.newCost, 470_000, "new machine");
  });
});

describe("exam question 2: Logistika Tzfonit", () => {
  const l = logi();

  it("the building's revaluations agree with the revaluation solver", () => {
    const r = solveRevaluation({
      cost: l.buildingCost,
      salvage: 0,
      life: LOGI_Q.life,
      method: "sl",
      firstYear: 2023,
      revaluations: [
        { year: 2023, timing: "end", fairValue: l.fair2023.building },
        { year: 2024, timing: "end", fairValue: l.fair2024.building },
      ],
      transfer: "depreciation",
    });
    near(r.events[0].oci, l.surplusBuilding2023, "surplus 2023");
    near(r.events[1].oci, -l.buildingFall, "fall 2024");
    near(r.events[1].pl, 0, "no loss on the building");
    near(r.rows.find((x) => x.year === 2024)!.transfer, l.transfer2024, "transfer");
    near(r.rows.find((x) => x.year === 2024)!.surplus, l.surplusBuilding2024, "surplus 2024");
  });

  it("the land agrees with the land solver", () => {
    const rows = solveLand(l.landCost, [
      { year: 2023, fairValue: l.fair2023.land },
      { year: 2024, fairValue: l.fair2024.land },
    ]);
    near(rows[0].oci, 46_000, "surplus");
    near(-rows[1].pl, l.landLoss, "loss");
    near(l.landLoss, 70_000, "loss by hand");
  });

  it("the figures by hand", () => {
    near(l.buildingCost, 4_280_000, "building");
    near(l.oci2023, 401_200, "oci 2023");
    near(l.dep2024, 186_000, "dep 2024");
    near(l.transfer2024, 14_800, "transfer");
    near(l.surplusBuilding2024, 62_400, "surplus 2024");
    near(l.oci2024, -324_000, "oci 2024");
    near(l.saleGain, 100_000, "sale");
    near(l.truck.result, -28_750, "truck");
    near(l.truck.dep2025, 146_250, "trucks 2025");
    near(l.truck.keptAccum2025, 315_000, "trucks accumulated");
  });
});

describe("exam question 3: Shaked Industries, a question of unknowns", () => {
  const s = shaked();

  it("the machine's life, from its accumulated depreciation", () => {
    near(s.monthsTo2025, 45, "months");
    near(s.annual, 60_000, "annual");
    near(s.life, 8, "life");
  });

  it("the exchange: the fair value behind the gain, and the new machine", () => {
    near(s.carryingAtExchange, 225_000, "carrying");
    near(s.fairValue, 240_000, "fair value");
    near(s.newCost, 290_000, "new cost");
    near(s.dep2026New, 14_500, "new machine 2026");
  });

  it("the building: the fair value behind the new charge, the surplus and its transfer", () => {
    near(s.carryingAtRevaluation, 850_000, "carrying");
    near(s.fair, 986_000, "fair value");
    near(s.surplus, 136_000, "surplus");
    near(s.transfer2026, 4_000, "transfer");
    near(s.surplus2026, 132_000, "surplus 2026");
    near(s.totalDep2026, 73_500, "depreciation 2026");
  });

  it("the building's revaluation agrees with the revaluation solver", () => {
    const B = SHAKED_Q.building;
    const r = solveRevaluation({ cost: B.cost, salvage: 0, life: B.life, method: "sl", firstYear: B.from, revaluations: [{ year: B.revalued, timing: "end", fairValue: s.fair }], transfer: "depreciation" });
    near(r.events[0].oci, s.surplus, "surplus");
    const y = r.rows.find((x) => x.year === 2026)!;
    near(y.dep, B.charge2026, "the new charge");
    near(y.transfer, s.transfer2026, "transfer");
    near(y.surplus, s.surplus2026, "surplus 2026");
    near(y.closing, s.building2026, "carrying 2026");
  });
});
