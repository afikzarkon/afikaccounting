import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, typeOf } from "../learn/basics";
import { solveExchange } from "../learn/exchange";
import { solveRenovation } from "../learn/renovation";
import { solveRevaluation } from "../learn/revaluation";
import { STUDY_MODULES } from ".";
import { renovationQuestions } from "./ias16/renovation";
import { exchangeQuestions } from "./ias16/exchange";
import { revaluationQuestions } from "./ias16/revaluation";
import { DRAWS, makeSimilar, seeded, SIMILAR_IDS, VARIANTS } from "./variants";

const DRAWS_EACH = 300;
const whole = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 1e-6, `${where}: ${a} ≠ ${b}`);

describe("similar questions with new numbers", () => {
  it("exist only for questions the lessons have, of the same kind and id", () => {
    for (const key of SIMILAR_IDS) {
      const [slug, id] = key.split(":");
      const original = STUDY_MODULES[slug]?.exercises.find((e) => e.id === id);
      assert.ok(original, key);
      const v = makeSimilar(slug, id, seeded(1))!;
      assert.equal(v.kind, original.kind, key);
      assert.equal(v.id, id, key);
    }
    assert.equal(makeSimilar("ias16-intro", "classify-stock"), null, "a choice question has no numbers to change");
  });

  it("come out whole and positive in every draw, and every journal entry balances with its accounts offered", () => {
    for (const [slug, makers] of Object.entries(VARIANTS))
      for (const [id, make] of Object.entries(makers))
        for (let seed = 1; seed <= DRAWS_EACH; seed++) {
          const where = `${slug}:${id} #${seed}`;
          const v = make(seeded(seed));
          if (v.kind === "number") {
            assert.ok(Number.isFinite(v.answer) && v.answer > 0, `${where}: ${v.answer}`);
            assert.ok(whole(v.answer), `${where}: ${v.answer} is not whole`);
          } else if (v.kind === "journal") {
            assert.ok(isBalanced(v.entry), where);
            for (const l of v.entry.lines) {
              assert.ok(v.accounts.includes(l.account), `${where}: ${l.account} not offered`);
              assert.ok(whole(l.dr ?? l.cr ?? 0) && (l.dr ?? l.cr ?? 0) > 0, `${where}: ${l.account}`);
              typeOf(l.account);
            }
          }
        }
  });

  it("agree with the course's solvers: renovations, exchanges and revaluations", () => {
    for (let seed = 1; seed <= DRAWS_EACH; seed++) {
      const R = DRAWS.reno(seeded(seed));
      const r = solveRenovation({ ...R, salvage: 0, method: "sl", renoYear: R.year, renoMonth: R.month, newSalvage: 0, newMethod: "sl" });
      const reno = renovationQuestions(R);
      assert.ok(reno["reno-year"].kind === "number" && reno["reno-carrying"].kind === "number");
      near(reno["reno-carrying"].answer, r.carryingAtReno, `reno #${seed}`);
      near(reno["reno-year"].answer, r.rows.find((row) => row.year === R.year)!.charge, `reno-year #${seed}`);

      const S = DRAWS.swap(seeded(seed));
      const base = { oldCost: S.cost, oldSalvage: 0, oldLife: S.life, accumulatedOpening: S.accumulatedOpening, month: S.month, basis: "given" as const, fairValueGiven: S.fairValue, fairValueReceived: 0, cashReceived: 0, newLife: 5, newSalvage: 0 };
      const swap = exchangeQuestions(S);
      assert.ok(swap["swap-gain"].kind === "number" && swap["swap-no-substance"].kind === "number");
      near(swap["swap-gain"].answer, solveExchange({ ...base, commercial: true, cashPaid: 0 }).gain, `swap #${seed}`);
      near(swap["swap-no-substance"].answer, solveExchange({ ...base, commercial: false, cashPaid: S.cash }).newCost, `swap-ns #${seed}`);

      const V = DRAWS.reval(seeded(seed));
      const rv = solveRevaluation({ cost: V.cost, salvage: 0, life: V.life, method: "sl", firstYear: V.firstYear, revaluations: [{ year: V.year, timing: "start", fairValue: V.fairValue }], transfer: "depreciation" });
      const reval = revaluationQuestions(V);
      assert.ok(reval["reval-gap"].kind === "number" && reval["reval-new-dep"].kind === "number" && reval["reval-transfer"].kind === "number");
      near(reval["reval-gap"].answer, rv.events[0].oci, `reval #${seed}`);
      near(reval["reval-new-dep"].answer, rv.events[0].firstYearCharge, `reval-dep #${seed}`);
      near(reval["reval-transfer"].answer, rv.rows.find((row) => row.year === V.year)!.transfer, `reval-transfer #${seed}`);
    }
  });
});
