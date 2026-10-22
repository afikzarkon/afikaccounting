import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { round2, sum } from "./math";
import { CALCULATORS, getCalculator } from "./registry";
import type { Values } from "./types";
import { defaults, validateValues } from "./validate";

const solve = (slug: string, overrides: Values = {}) => {
  const calc = getCalculator(slug)!;
  const values = { ...defaults(calc), ...overrides };
  assert.deepEqual(validateValues(calc, values), {}, "inputs should be valid");
  return calc.solve(values);
};

const metric = (s: ReturnType<typeof solve>, label: string) => {
  const m = s.metrics.find((x) => x.label.startsWith(label));
  assert.ok(m, `metric ${label}`);
  return m.value;
};

describe("every calculator", () => {
  for (const calc of CALCULATORS) {
    it(`${calc.slug}: default inputs are valid and produce balanced entries`, () => {
      const s = calc.solve(defaults(calc));
      for (const e of s.journal) {
        assert.equal(round2(sum(e.lines.map((l) => l.debit))), round2(sum(e.lines.map((l) => l.credit))), e.narrative);
      }
      assert.ok(s.disclosure.length > 0);
      assert.ok(s.guidance.length > 0);
    });
  }
});

describe("IFRS 16", () => {
  const base = { payment: 100, termYears: 5, discountRate: 5, usefulLife: 10 };

  it("payments in arrears: liability is the PV of an ordinary annuity", () => {
    const s = solve("ifrs-16-leases", base);
    assert.equal(metric(s, "התחייבות בגין חכירה"), 432.95);
    const rows = s.tables[0].rows;
    assert.equal(rows.at(-1)!.closing, 0);
    assert.equal(s.tables[0].totals!.principal, 432.95);
  });

  it("payments in advance: first payment goes to the asset, not the liability", () => {
    const s = solve("ifrs-16-leases", { ...base, timing: "advance" });
    assert.equal(metric(s, "התחייבות בגין חכירה"), 354.6);
    assert.equal(metric(s, "נכס זכות שימוש"), 454.6);
    assert.equal(s.tables[0].rows.at(-1)!.closing, 0);
  });

  it("reasonably certain extension adds its payments to the liability", () => {
    const without = solve("ifrs-16-leases", { ...base, extension: true, extensionCertain: "no" });
    const withExt = solve("ifrs-16-leases", { ...base, extension: true, extensionCertain: "yes", extensionYears: 2, extensionPayment: 100 });
    assert.equal(metric(without, "התחייבות בגין חכירה"), 432.95);
    // 7-year annuity of 100 at 5%
    assert.equal(metric(withExt, "התחייבות בגין חכירה"), 578.64);
  });

  it("restoration cost is discounted into the asset and a provision", () => {
    const s = solve("ifrs-16-leases", { ...base, restoration: true, restorationCost: 100, restorationRate: 5 });
    assert.equal(metric(s, "נכס זכות שימוש"), round2(432.95 + 78.35));
    assert.ok(s.tables.some((t) => t.id === "restoration"));
  });

  it("short-term exemption is refused for a lease longer than 12 months", () => {
    const s = solve("ifrs-16-leases", { ...base, exemption: "short-term" });
    assert.equal(s.outcome, "recognised");
  });

  it("low-value exemption expenses payments straight-line", () => {
    const s = solve("ifrs-16-leases", { ...base, exemption: "low-value" });
    assert.equal(s.outcome, "exempt");
    assert.equal(metric(s, "הוצאת חכירה שנתית"), 100);
  });

  it("depreciation over useful life when ownership transfers", () => {
    const s = solve("ifrs-16-leases", { ...base, ownershipTransfers: true });
    assert.equal(s.tables[0].rows.length, 10);
    assert.equal(s.tables[0].rows.at(-1)!.rou, 0);
  });

  it("monthly schedule closes to zero", () => {
    const s = solve("ifrs-16-leases", { ...base, frequency: "monthly", profile: "escalating", escalation: 3 });
    assert.equal(s.tables[0].rows.length, 60);
    assert.equal(s.tables[0].rows.at(-1)!.closing, 0);
  });
});

describe("IAS 16", () => {
  it("straight-line without components depreciates cost less residual", () => {
    const s = solve("ias-16-property-plant-equipment", {
      component: false,
      purchasePrice: 1000,
      attributableCosts: 0,
      residual: 100,
      usefulLife: 9,
    });
    assert.equal(metric(s, "פחת בשנה 1"), 100);
    assert.equal(s.tables[0].rows.at(-1)!.carrying, 100);
  });

  it("early replacement derecognises the remaining carrying amount as a loss", () => {
    const s = solve("ias-16-property-plant-equipment", {
      purchasePrice: 1000,
      attributableCosts: 0,
      residual: 0,
      usefulLife: 10,
      component: true,
      componentCost: 200,
      componentLife: 5,
      replacement: true,
      replacementYear: 4,
      replacementCost: 300,
    });
    // 4 of 5 years depreciated → 40 left
    assert.equal(metric(s, "הפסד מהחלפה"), 40);
    assert.equal(s.tables[0].rows.at(-1)!.carrying, 0);
  });

  it("double-declining never goes below residual and ends on it", () => {
    const s = solve("ias-16-property-plant-equipment", { component: false, method: "double-declining" });
    const rows = s.tables[0].rows;
    assert.equal(rows.at(-1)!.carrying, 250000);
    assert.ok(rows.every((r) => Number(r.carrying) >= 250000));
  });

  describe("renovation with a revised useful life", () => {
    const s = solve("ias-16-property-plant-equipment", {
      component: false,
      revision: true,
      purchasePrice: 100000,
      attributableCosts: 20000,
      residual: 10000,
      usefulLife: 6,
      acquisitionDate: "2023-03-31",
      revisionDate: "2025-07-01",
      revisionCost: 10000,
      lifeExtension: 2,
    });
    const rows = s.tables[0].rows;
    const year = (y: number) => rows.find((r) => r.period === String(y))!;

    it("depreciates cost less residual until the renovation (27 months)", () => {
      assert.equal(metric(s, "פחת שנצבר עד השיפוץ"), 41250);
      assert.equal(metric(s, "ערך בספרים במועד השיפוץ"), 78750);
      assert.equal(metric(s, "ערך בספרים לאחר היוון השיפוץ"), 88750);
    });

    it("spreads the new base over the 5.75 years left", () => {
      assert.equal(metric(s, "יתרת אורך חיים"), 5.75);
      assert.equal(metric(s, "פחת שנתי מעודכן"), 13695.65);
    });

    it("prorates fiscal years by month and ends on the residual value", () => {
      assert.deepEqual(rows.map((r) => r.period), ["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031"]);
      assert.equal(year(2023).total, 13750);
      assert.equal(year(2024).total, 18333.33);
      assert.equal(year(2025).before, 9166.67);
      assert.equal(year(2025).after, 6847.83);
      assert.equal(year(2026).total, 13695.65);
      assert.equal(year(2031).months, 3);
      assert.equal(rows.at(-1)!.carrying, 10000);
      assert.equal(s.tables[0].totals!.total, 120000);
    });

    it("journal records the renovation and every year's depreciation", () => {
      assert.ok(s.journal.some((e) => e.id === "revision" && e.lines[0].debit === 10000));
      const expense = round2(sum(s.journal.flatMap((e) => e.lines).filter((l) => l.account === "הוצאות פחת").map((l) => l.debit)));
      assert.equal(expense, 120000);
    });

    it("balance sheet and profit or loss tie to the schedule", () => {
      const bs = s.tables.find((t) => t.id === "balance-sheet")!;
      assert.equal(bs.rows.at(-1)!.y2025, 81902.17);
      const pl = s.tables.find((t) => t.id === "profit-or-loss")!;
      assert.equal(pl.rows.at(-1)!.y2025, -16014.5);
    });
  });

  it("rejects a renovation after the original useful life", () => {
    const calc = getCalculator("ias-16-property-plant-equipment")!;
    const errors = validateValues(calc, { ...defaults(calc), component: false, revision: true, usefulLife: 2, acquisitionDate: "2023-03-31", revisionDate: "2025-07-01" });
    assert.ok(errors.revisionDate);
  });
});

describe("IAS 37", () => {
  it("expected value weights outcomes", () => {
    const s = solve("ias-37-provisions", { measurement: "expected", discount: false });
    assert.equal(metric(s, "האומדן הטוב ביותר"), 0 * 0.2 + 1200000 * 0.6 + 3000000 * 0.2);
  });

  it("possible outflow gives a contingent liability with no entries", () => {
    const s = solve("ias-37-provisions", { probability: "possible" });
    assert.equal(s.outcome, "disclose-only");
    assert.equal(s.journal.length, 0);
  });

  it("discounted provision unwinds to the settlement amount", () => {
    const s = solve("ias-37-provisions", { mostLikely: 1000, years: 3, discountRate: 10 });
    assert.equal(metric(s, "הפרשה במועד ההכרה"), 751.31);
    const rows = s.tables[0].rows;
    assert.equal(rows.at(-2)!.closing, 1000);
  });

  it("rejects probabilities that do not add up to 100%", () => {
    const calc = getCalculator("ias-37-provisions")!;
    const errors = validateValues(calc, { ...defaults(calc), measurement: "expected", probability1: 50 });
    assert.ok(errors.probability3);
  });
});

describe("Corporate tax", () => {
  it("total tax reconciles to statutory rate on PBT plus permanent differences", () => {
    const s = solve("corporate-tax-ias-12");
    const total = metric(s, "סך הוצאות המס");
    assert.equal(total, round2((6000000 + 220000 - 300000) * 0.23));
  });

  it("unrecognised deferred tax assets raise the effective rate", () => {
    const s = solve("corporate-tax-ias-12", {
      recoverable: false,
      ppeCarrying: 0,
      ppeTaxBase: 0,
      ppeOpeningDifference: 0,
      pbt: -1000000,
      nonDeductible: 0,
      exempt: 0,
      provisionsClosing: 0,
      provisionsOpening: 0,
      advances: 0,
    });
    assert.equal(metric(s, "מס שוטף"), 0);
    assert.equal(metric(s, "סך הוצאות המס"), 0);
    const recon = s.tables.find((t) => t.id === "reconciliation")!;
    assert.ok(recon.rows.some((r) => r.item === "שינוי בנכסי מס נדחים שלא הוכרו"));
  });

  it("uses the Preferred Technological Enterprise rate", () => {
    const s = solve("corporate-tax-ias-12", { regime: "pte" });
    assert.equal(metric(s, "סך הוצאות המס"), round2((6000000 + 220000 - 300000) * 0.12));
  });
});
