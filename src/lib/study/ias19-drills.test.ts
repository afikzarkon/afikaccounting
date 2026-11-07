import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced } from "../learn/basics";
import { measure, plainYear, pv } from "../learn/ias19";
import { amendDraw, amendFigures, dcDraw, dcFigures, payDraw, payFigures, settleDraw, settleFigures, yearDraw, yearFigures, DRILLS, type DrillFamily, pucDraw, pucFigures, seeded, tiersDraw, tiersFigures, windowDraw, windowOf, windowRow } from "./ias19/drills";

const N = 400;
const near = (a: number, b: number, where: string) => assert.ok(Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)), `${where}: ${a} ≠ ${b}`);

describe("IAS 19 practice drills with new numbers", () => {
  it("every draw of every family has positive, finite answers, a story, and a full solution", () => {
    for (const family of Object.keys(DRILLS) as DrillFamily[])
      for (let seed = 1; seed <= N; seed++) {
        const d = DRILLS[family](seeded(seed));
        const where = `${family} #${seed}`;
        assert.ok(d.story.length > 0 && d.seek.length > 0 && d.check.length > 0 && d.build.length > 0, where);
        for (const a of d.asks) {
          if (a.kind === "number") assert.ok(Number.isFinite(a.answer) && a.answer > 0, `${where} ${a.id}: ${a.answer}`);
          else assert.ok(a.answer >= 0 && a.answer < a.options.length, `${where} ${a.id}`);
        }
        for (const s of d.build) for (const l of s.lines) assert.ok(!/NaN|undefined|Infinity/.test(l), `${where}: ${l}`);
        for (const l of d.story) assert.ok(!/NaN|undefined|Infinity/.test(l), `${where}: ${l}`);
      }
  });

  it("a defined contribution: expense less what was paid is the balance, and the entry balances", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = dcDraw(seeded(seed));
      const F = dcFigures(D);
      near(F.expense, D.workers * D.salary * D.rate * (13 - D.start), `dc #${seed}`);
      near(F.expense - F.paid, F.balance, `dc balance #${seed}`);
      assert.ok(Math.abs(F.monthly - Math.round(F.monthly)) < 1e-9, `dc #${seed}: whole monthly ${F.monthly}`);
      const d = DRILLS.dc(seeded(seed));
      assert.ok(isBalanced({ id: "1", text: "", lines: d.entry! }), `dc entry #${seed}`);
    }
  });

  it("one employee's promise agrees with the five-step measurement", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = pucDraw(seeded(seed));
      const F = pucFigures(D);
      const perYear = D.basis === "annual" ? D.share * D.salary * (1 + D.growth) ** D.n : (D.share * D.salary * (1 + D.growth) ** D.n) / 12;
      near(F.obligation, measure({ perYear, years: F.months / 12, heads: D.stay ?? 1, n: D.n, i: D.rate }), `puc #${seed}`);
      assert.ok(F.served > 0, `puc #${seed}`);
    }
  });

  it("a grant with two routes: the three cases of IAS 19.73, one employee each", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = windowDraw(seeded(seed));
      const from = D.rule.minAge - D.rule.years;
      const cases = D.people.map((p) => (p.hireAge < from ? "early" : p.hireAge + D.rule.years <= D.rule.retire ? "middle" : "late")).sort();
      assert.deepEqual(cases, ["early", "late", "middle"], `window #${seed}`);
      for (const p of D.people) {
        const w = windowOf(D.rule, p.hireAge);
        if (p.hireAge < from) assert.deepEqual([w.start, w.end], [from, D.rule.minAge]);
        else if (p.hireAge + D.rule.years <= D.rule.retire) assert.deepEqual([w.start, w.end], [p.hireAge, p.hireAge + D.rule.years]);
        else assert.deepEqual([w.start, w.end], [p.hireAge, D.rule.retire]);
        const x = windowRow(D.rule, D.rate, p);
        assert.ok(x.served > 0 && x.served < x.window && x.n > 0, `window #${seed} ${p.id}`);
        near(x.obligation, pv((D.rule.grant / x.window) * x.served, D.rate, D.rule.retire - p.age) * p.stay, `window #${seed} ${p.id}`);
      }
    }
  });

  it("tiers: straight line exactly when later years earn more; a cap shortens the window", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = tiersDraw(seeded(seed));
      const F = tiersFigures(D);
      assert.equal(F.a.method === "straight", D.later > D.first.perYear, `tiers #${seed}`);
      if (D.cap && F.uncapped > D.cap) assert.ok(F.a.window < D.expected, `tiers cap #${seed}`);
      assert.ok(F.accrued <= F.a.total + 1e-9, `tiers #${seed}`);
    }
  });

  it("a year's roll-forward agrees with the solver's plain year, and its P.N. vanishes when nothing changes", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = yearDraw(seeded(seed));
      const F = yearFigures(D);
      const y = plainYear({ opening: F.opening, i: D.r0, perYear: F.unit, servedAtStart: 1, nEnd: F.n0 - 1, iEnd: D.r0 });
      near(F.service, y.service, `year service #${seed}`);
      near(F.interest, y.interest, `year interest #${seed}`);
      const same = yearFigures({ ...D, r1: D.r0, later: false });
      assert.ok(Math.abs(same.pn) < 1e-6, `year #${seed}: P.N. ${same.pn} with nothing changed`);
    }
  });

  it("interest with a payment: compound for part of the year, and less than on the opening alone", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = payDraw(seeded(seed));
      const F = payFigures(D);
      near(F.onPaid, D.paid * ((1 + D.rate) ** ((13 - D.month) / 12) - 1), `pay #${seed}`);
      assert.ok(F.interest < F.onOpening && F.interest > 0, `pay #${seed}`);
    }
  });

  it("an amendment: the roll-forward closes, past service is positive, the year splits where the amendment falls", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = amendDraw(seeded(seed));
      const F = amendFigures(D);
      near(F.opening + F.service + F.pastService + F.interest + F.pn, F.closing, `amend #${seed}`);
      assert.ok(F.pastService > 0 && F.before + F.after === 12, `amend #${seed}`);
    }
  });

  it("a settlement goes to profit or loss at the books less the price; a retirement on the terms leaves a loss in OCI", () => {
    for (let seed = 1; seed <= N; seed++) {
      const D = settleDraw(seeded(seed));
      const F = settleFigures(D);
      near(F.gain, F.books - D.price, `settle #${seed}`);
      assert.ok(F.pn > 0, `settle #${seed}`);
    }
  });
});
