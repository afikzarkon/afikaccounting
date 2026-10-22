import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { round2, sum } from "./math";
import { CALCULATORS, getCalculator } from "./registry";
import type { Values } from "./types";
import { defaults, isDisabled, validateValues } from "./validate";

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
  const PPE = "ias-16-property-plant-equipment";
  // 100,000 + 20,000 transport, residual 10,000, six years, available 31/03/2023.
  const base: Values = {
    purchasePrice: 100000,
    attributableCosts: 20000,
    residual: 10000,
    usefulLife: 6,
    acquisitionDate: "2023-03-31",
    calcStart: "2023-03-31",
    calcEnd: "2031-12-31",
  };
  const renovation: Values = { hasEvents: true, revision: true, revisionDate: "2025-07-01", revisionCost: 10000, lifeExtension: 2, revisedResidual: 10000 };
  const table = (s: ReturnType<typeof solve>, id: string) => s.tables.find((t) => t.id === id)!;
  const year = (s: ReturnType<typeof solve>, y: number) => table(s, "depreciation").rows.find((r) => r.year === y)!;
  const line = (s: ReturnType<typeof solve>, id: string, item: string) => table(s, id).rows.find((r) => r.item === item)!;

  it("cost includes directly attributable costs; depreciable amount deducts residual", () => {
    const s = solve(PPE, base);
    assert.equal(metric(s, "עלות במועד ההכרה"), 120000);
    assert.equal(metric(s, "סכום בר-פחת"), 110000);
    assert.equal(line(s, "cost", "סכום בר-פחת").amount, 110000);
  });

  it("straight-line starts when available for use and prorates the first fiscal year", () => {
    const s = solve(PPE, base);
    assert.equal(year(s, 2023).total, 13750); // 9 months
    assert.equal(year(s, 2024).total, 18333.33);
    assert.equal(year(s, 2029).months, 3);
    assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
  });

  it("accepts a useful life in years and months", () => {
    const s = solve(PPE, { ...base, usefulLife: 5, lifeMonths: 6 });
    assert.equal(year(s, 2024).total, 20000); // 110,000 / 5.5
  });

  describe("renovation with a revised useful life — straight-line", () => {
    const s = solve(PPE, { ...base, ...renovation });

    it("depreciates cost less residual until the renovation (27 months)", () => {
      assert.equal(metric(s, "פחת שנצבר עד השיפוץ"), 41250);
      assert.equal(metric(s, "ערך בספרים במועד השיפוץ"), 78750);
      assert.equal(metric(s, "ערך בספרים לאחר היוון השיפוץ"), 88750);
    });

    it("spreads the new base over the 5.75 years left", () => {
      assert.equal(metric(s, "יתרת אורך חיים"), 5.75);
      assert.equal(metric(s, "פחת שנתי מעודכן"), 13695.65);
      assert.equal(year(s, 2025).before, 9166.67);
      assert.equal(year(s, 2025).after, 6847.83);
      assert.equal(year(s, 2031).months, 3);
      assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
      assert.equal(table(s, "depreciation").totals!.total, 120000);
    });

    it("journal splits the renovation year around the capitalisation", () => {
      const ids = s.journal.map((e) => e.when);
      assert.ok(ids.includes("30/06/2025") && ids.includes("01/07/2025"));
      const expense = round2(sum(s.journal.flatMap((e) => e.lines).filter((l) => l.account === "הוצאות פחת").map((l) => l.debit)));
      assert.equal(expense, 120000);
    });

    it("statements tie to the schedule", () => {
      assert.equal(line(s, "balance-sheet", "רכוש קבוע, נטו (ערך בספרים)").y2025, 81902.17);
      assert.equal(line(s, "profit-or-loss", "הוצאות פחת").y2025, -16014.5);
    });

    it("a revised residual value changes the new depreciable base", () => {
      const r = solve(PPE, { ...base, ...renovation, revisedResidual: 20000 });
      assert.equal(metric(r, "פחת שנתי מעודכן"), round2((88750 - 20000) / 5.75));
      assert.equal(table(r, "depreciation").rows.at(-1)!.carrying, 20000);
    });
  });

  describe("renovation — sum-of-years-digits", () => {
    const s = solve(PPE, { ...base, ...renovation, method: "sum-of-years" });

    it("asset years straddle fiscal years: 6/21 and 5/21 prorated by month", () => {
      assert.equal(year(s, 2023).total, 23571.43); // 9/12 × 6/21 × 110,000
      assert.equal(year(s, 2024).total, 27500); // 3/12 × 6/21 + 9/12 × 5/21
      assert.equal(year(s, 2025).before, 11785.71); // 3/12 × 5/21 + 3/12 × 4/21
      assert.equal(metric(s, "פחת שנצבר עד השיפוץ"), 62857.14);
    });

    it("restarts the digits over 5.75 years (5.75 + 4.75 + … + 0.75)", () => {
      assert.equal(metric(s, "סכום הספרות המעודכן"), 19.5);
      assert.equal(metric(s, "פחת ב-12 החודשים"), 16849.82);
      assert.equal(year(s, 2031).total, 732.6);
      assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
    });

    it("compares every method over the same periods", () => {
      const cmp = table(s, "method-comparison");
      assert.equal(cmp.rows[0].slDep, 13750);
      assert.equal(cmp.rows[0].sydDep, 23571.43);
      for (const key of ["slDep", "sydDep", "ddbDep", "unitsDep"]) assert.equal(cmp.totals![key], 120000, key);
    });
  });

  it("double-declining applies 2/life to the opening balance of each asset year", () => {
    const s = solve(PPE, { ...base, method: "double-declining" });
    assert.equal(year(s, 2023).total, 30000); // 9/12 × 120,000 / 3
    assert.equal(year(s, 2024).total, 30000); // 3/12 × 40,000 + 9/12 × 26,666.67
    const rows = table(s, "depreciation").rows;
    assert.ok(rows.every((r) => Number(r.carrying) >= 10000));
    assert.equal(rows.at(-1)!.carrying, 10000);
  });

  it("units of production follows actual output and fills missing years evenly", () => {
    const s = solve(PPE, { ...base, method: "units", totalUnits: 60000, unitsByYear: "6000, 11000" });
    assert.equal(year(s, 2023).total, 11000); // 6,000 × 110,000 / 60,000
    assert.equal(year(s, 2024).total, 20166.67);
    assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
  });

  it("revaluation model: decrease to P&L, later increase reverses it before the surplus", () => {
    const s = solve(PPE, { ...base, model: "revaluation", hasEvents: true, revalue: true, fairValues: "100000, , 70000, 80000" });
    const pl = (y: number) => line(s, "profit-or-loss", "הפסד מהערכה מחדש / ביטולו")[`y${y}`];
    assert.equal(pl(2023), -6250); // 106,250 → 100,000
    assert.equal(pl(2025), 4285.71); // reverses part of the earlier loss
    assert.equal(pl(2026), 1964.29); // the rest of the loss …
    assert.equal(line(s, "profit-or-loss", "רווח כולל אחר — שינוי בקרן הערכה מחדש").y2026, 26497.25); // … then OCI
    assert.equal(year(s, 2024).total, round2((90000 / 63) * 12)); // revalued amount over the remaining life
    assert.equal(table(s, "depreciation").rows.at(-1)!.surplus, 0); // fully transferred to retained earnings
  });

  it("cost model impairment and a reversal capped at the unimpaired carrying amount", () => {
    const s = solve(PPE, { ...base, hasEvents: true, impairment: true, recoverableAmounts: ", 80000, , 60000" });
    const imp = (y: number) => line(s, "profit-or-loss", "הפסד מירידת ערך / ביטולו")[`y${y}`];
    assert.equal(imp(2024), -7916.67);
    assert.equal(imp(2026), 4191.18); // up to 51,250, not 60,000
    assert.equal(line(s, "balance-sheet", "רכוש קבוע, נטו (ערך בספרים)").y2026, 51250);
  });

  describe("asset exchange", () => {
    const exchange: Values = { hasEvents: true, exchange: true, exchangeDate: "2027-12-31", fvGiven: 50000, fvReceived: 55000, cashDirection: "paid", cashAmount: 5000 };

    it("with commercial substance: fair value of the asset given plus cash, gain on derecognition", () => {
      const s = solve(PPE, { ...base, ...exchange });
      assert.equal(metric(s, "עלות הנכס שהתקבל"), 55000);
      assert.equal(metric(s, "רווח (הפסד) מההחלפה"), round2(50000 - 32916.67));
      assert.equal(line(s, "balance-sheet", "רכוש קבוע, נטו (ערך בספרים)").y2027, 0);
    });

    it("measured at the fair value received when that is more evident", () => {
      const s = solve(PPE, { ...base, ...exchange, fvGivenKnown: false });
      assert.equal(metric(s, "עלות הנכס שהתקבל"), 55000);
      assert.equal(metric(s, "רווח (הפסד) מההחלפה"), round2(55000 - 5000 - 32916.67));
    });

    it("without commercial substance: carrying amount less cash received, no gain", () => {
      const s = solve(PPE, { ...base, ...exchange, commercialSubstance: false, cashDirection: "received" });
      assert.equal(metric(s, "עלות הנכס שהתקבל"), round2(32916.67 - 5000));
      assert.equal(metric(s, "רווח (הפסד) מההחלפה"), 0);
    });
  });

  it("calculation range clips the schedule and opens with carried-forward balances", () => {
    const s = solve(PPE, { ...base, ...renovation, calcStart: "2025-01-01", calcEnd: "2026-06-30" });
    const rows = table(s, "depreciation").rows;
    assert.deepEqual(rows.map((r) => r.year), [2025, 2026]);
    assert.equal(rows[0].opening, 87916.67);
    assert.equal(rows[1].months, 6);
    assert.ok(!s.journal.some((e) => e.id === "acquisition"));
  });

  describe("year-by-year breakdown", () => {
    const s = solve(PPE, { ...base, ...renovation });
    const y = (n: number) => s.years!.find((x) => x.id === `y${n}`)!;

    it("has one section per reporting year with its own journal", () => {
      assert.deepEqual(s.years!.map((x) => x.id), ["y2023", "y2024", "y2025", "y2026", "y2027", "y2028", "y2029", "y2030", "y2031"]);
      assert.ok(y(2023).journal.some((e) => e.id === "acquisition"));
      assert.ok(y(2025).journal.some((e) => e.id.startsWith("renovation")));
      assert.equal(sum(s.years!.map((x) => x.journal.length)), s.journal.length);
    });

    it("shows the working, the balance sheet and profit or loss for the year", () => {
      assert.ok(y(2025).workings.some((w) => w.label.startsWith("ערך בספרים ערב השיפוץ") && w.amount === 78750));
      assert.equal(y(2025).workings.find((w) => w.label === "סך הפחת לשנת 2025")!.amount, 16014.5);
      assert.equal(y(2025).balance.find((l) => l.emphasis === "total")!.value, 81902.17);
      assert.equal(y(2025).balanceDate, "31/12/2025");
      assert.equal(y(2025).profitOrLoss[0].value, -16014.5);
    });

    it("explains how to carry on: original formula before, revised formula after the renovation", () => {
      assert.match(y(2024).next[0].body, /עלות מקורית/);
      assert.match(y(2024).next.map((g) => g.body).join(), /01\/07\/2025/); // the coming renovation is flagged
      assert.match(y(2025).next[0].body, /יתרה בספרים ערב השיפוץ/);
      assert.match(y(2025).next[0].body, /13,695\.65/);
      assert.equal(y(2031).next[0].title, "הנכס הופחת במלואו");
    });

    it("revaluation: next-year guidance gives the excess-depreciation transfer", () => {
      const r = solve(PPE, { ...base, model: "revaluation", hasEvents: true, revalue: true, fairValues: ", , , 80000" });
      const next = r.years!.find((x) => x.id === "y2026")!.next;
      assert.match(next[0].body, /השווי ההוגן החדש/);
      assert.match(next.find((g) => g.title.includes("לעודפים"))!.body, /הפרש הפחת/);
    });

    it("revaluation with transfer on disposal only keeps the surplus", () => {
      const r = solve(PPE, { ...base, model: "revaluation", hasEvents: true, revalue: true, fairValues: ", , , 80000", surplusTransfer: "disposal" });
      const rows = table(r, "depreciation").rows;
      assert.equal(rows.at(-1)!.surplus, rows.find((x) => x.year === 2026)!.surplus);
      assert.ok(!r.journal.some((e) => e.id.startsWith("transfer")));
    });

    it("exchange: sets the new asset's cost and its depreciation for the next year", () => {
      const r = solve(PPE, {
        ...base,
        hasEvents: true,
        exchange: true,
        exchangeDate: "2027-12-31",
        fvGiven: 50000,
        cashDirection: "paid",
        cashAmount: 5000,
        newAssetLife: 5,
        newAssetResidual: 5000,
      });
      const next = r.years!.at(-1)!.next;
      assert.match(next[0].body, /55,000\.00/);
      assert.match(next[1].body, /פחת לשנת 2028: ₪10,000\.00/); // (55,000 − 5,000) / 5
    });
  });

  it("events count only when an event is declared", () => {
    const s = solve(PPE, { ...base, ...renovation, hasEvents: false });
    assert.ok(!s.journal.some((e) => e.id.startsWith("renovation")));
    assert.equal(table(s, "depreciation").rows.at(-1)!.year, 2029);
  });

  it("the fair value of the asset received is locked, and not validated, while the given one is known", () => {
    const calc = getCalculator(PPE)!;
    const field = calc.metrics.find((f) => f.id === "fvReceived")!;
    const values = { ...defaults(calc), hasEvents: true, exchange: true, fvGivenKnown: true, fvReceived: -1 };
    assert.ok(isDisabled(field, values));
    assert.deepEqual(validateValues(calc, values), {});
    assert.ok(validateValues(calc, { ...values, fvGivenKnown: false }).fvReceived);
  });

  it("rejects a renovation after the original useful life", () => {
    const calc = getCalculator(PPE)!;
    const errors = validateValues(calc, { ...defaults(calc), ...base, ...renovation, usefulLife: 2 });
    assert.ok(errors.revisionDate);
  });

  it("rejects a range that ends before it starts", () => {
    const calc = getCalculator(PPE)!;
    const errors = validateValues(calc, { ...defaults(calc), calcStart: "2026-01-01", calcEnd: "2025-01-01" });
    assert.ok(errors.calcEnd);
  });

  describe("component approach", () => {
    it("straight-line without replacement depreciates cost less residual", () => {
      const s = solve(PPE, {
        component: true,
        replacement: false,
        purchasePrice: 1000,
        attributableCosts: 0,
        residual: 100,
        usefulLife: 9,
        componentCost: 90,
        componentLife: 3,
      });
      assert.equal(s.tables[0].rows.at(-1)!.carrying, 100);
    });

    it("early replacement derecognises the remaining carrying amount as a loss", () => {
      const s = solve(PPE, {
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
