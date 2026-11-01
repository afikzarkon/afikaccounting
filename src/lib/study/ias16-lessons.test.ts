import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { decliningYears, straightLineYears, sydYears, timeSchedule } from "../learn/depreciation";
import { solveExchange } from "../learn/exchange";
import { solveRenovation } from "../learn/renovation";
import { solveRevaluation } from "../learn/revaluation";
import { findScreen, STUDY_MODULES } from ".";
import { IAS16_LEGACY_CHAPTERS, IAS16_LESSONS, ias16LegacyHref } from "./ias16";
import { MID } from "./ias16/depreciation";
import { RENO } from "./ias16/renovation";
import { REVAL } from "./ias16/revaluation";
import { SWAP } from "./ias16/exchange";

/** A calculation question's answer, by lesson and id. */
const answer = (slug: string, id: string) => {
  const x = STUDY_MODULES[slug].exercises.find((e) => e.id === id);
  assert.ok(x && x.kind === "number", `${slug}: no calculation ${id}`);
  return x.answer;
};
const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 1e-6, `${where}: ${a} ≠ ${b}`);

describe("the fixed-assets course", () => {
  it("five lessons, numbered in order, all on the fixed-assets page, the first free", () => {
    assert.equal(IAS16_LESSONS.length, 5);
    IAS16_LESSONS.forEach((m, i) => {
      assert.equal(m.n, i + 1, m.slug);
      assert.equal(m.backHref, "/basics/ias16", m.slug);
      assert.equal(STUDY_MODULES[m.slug], m);
    });
    assert.deepEqual(TOPICS.find((t) => t.id === "ias16")?.preview, ["ias16-intro"]);
  });

  it("every anchor of the former page lands on a screen", () => {
    for (const id of IAS16_LEGACY_CHAPTERS) assert.ok(ias16LegacyHref(id), `anchor ${id} has nowhere to go`);
    assert.equal(ias16LegacyHref("revaluation-calculator"), "/study/ias16-revaluation?screen=revaluation-calculator");
    assert.equal(ias16LegacyHref("simulator"), "/study/ias16-depreciation?screen=depreciation");
    assert.equal(ias16LegacyHref("renovation"), "/study/ias16-renovation?screen=renovation-distinction");
  });

  it("the catalog's tools open the course's calculators", () => {
    for (const tool of TOPICS.find((t) => t.id === "ias16")!.tools) {
      const screen = new URL(tool.href, "https://x").searchParams.get("screen")!;
      const hit = findScreen(screen);
      assert.ok(hit, tool.href);
      assert.ok(tool.href.startsWith(`/study/${hit.module.slug}?`), tool.href);
    }
  });
});

describe("the fixed-assets practice agrees with the course's solvers", () => {
  it("depreciation methods", () => {
    near(answer("ias16-depreciation", "syd-year2"), sydYears({ cost: 120_000, salvage: 20_000, life: 4, startMonth: 1 }, "desc")[1].charge, "syd-year2");
    near(answer("ias16-depreciation", "db-year2"), decliningYears({ cost: 100_000, salvage: 0, life: 10, startMonth: 1 }, 0.3)[1].charge, "db-year2");
    const mid = { cost: MID.cost, salvage: 0, life: MID.life, startMonth: MID.readyMonth };
    near(answer("ias16-depreciation", "mid-year"), timeSchedule(mid, straightLineYears(mid)).rows[0].charge, "mid-year");
  });

  it("the year of a renovation", () => {
    const r = solveRenovation({
      cost: RENO.cost,
      salvage: 0,
      life: RENO.life,
      method: "sl",
      firstYear: RENO.firstYear,
      renoYear: RENO.year,
      renoMonth: RENO.month,
      renoCost: RENO.renoCost,
      newLife: RENO.newLife,
      newSalvage: 0,
      newMethod: "sl",
    });
    near(answer("ias16-renovation", "reno-carrying"), r.carryingAtReno, "reno-carrying");
    near(answer("ias16-renovation", "reno-year"), r.rows.find((row) => row.year === RENO.year)!.charge, "reno-year");
  });

  it("an exchange, with and without commercial substance", () => {
    const base = {
      oldCost: SWAP.cost,
      oldSalvage: 0,
      oldLife: SWAP.life,
      accumulatedOpening: SWAP.accumulatedOpening,
      month: SWAP.month,
      basis: "given" as const,
      fairValueGiven: SWAP.fairValue,
      fairValueReceived: 0,
      cashReceived: 0,
      newLife: 5,
      newSalvage: 0,
    };
    const plain = solveExchange({ ...base, commercial: true, cashPaid: 0 });
    near(answer("ias16-exchange", "swap-dep"), plain.depToDate, "swap-dep");
    near(answer("ias16-exchange", "swap-gain"), plain.gain, "swap-gain");
    near(answer("ias16-exchange", "swap-cash"), solveExchange({ ...base, commercial: true, cashPaid: SWAP.cash }).newCost, "swap-cash");
    near(answer("ias16-exchange", "swap-no-substance"), solveExchange({ ...base, commercial: false, cashPaid: SWAP.cash }).newCost, "swap-no-substance");
  });

  it("a revaluation: the gap, the new charge and the transfer", () => {
    const r = solveRevaluation({
      cost: REVAL.cost,
      salvage: 0,
      life: REVAL.life,
      method: "sl",
      firstYear: REVAL.firstYear,
      revaluations: [{ year: REVAL.year, timing: "start", fairValue: REVAL.fairValue }],
      transfer: "depreciation",
    });
    const [ev] = r.events;
    near(answer("ias16-revaluation", "reval-gap"), ev.oci, "reval-gap");
    near(answer("ias16-revaluation", "reval-new-dep"), ev.firstYearCharge, "reval-new-dep");
    near(answer("ias16-revaluation", "reval-transfer"), r.rows.find((row) => row.year === REVAL.year)!.transfer, "reval-transfer");
  });
});
