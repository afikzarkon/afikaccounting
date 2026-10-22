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

// IAS 16 starts empty, so it needs a complete set of answers: 100,000 + 20,000
// transport, residual 10,000, six years, available 31/03/2023.
const PPE_EXAMPLE: Values = {
  acquisitionDate: "2023-03-31",
  calcStart: "2023-03-31",
  calcEnd: "2031-12-31",
  purchasePrice: 100000,
  attributableCosts: 20000,
  residual: 10000,
  usefulLife: 6,
  method: "straight-line",
  model: "cost",
};
const EXAMPLES: Record<string, Values> = { "ias-16-property-plant-equipment": PPE_EXAMPLE };

describe("every calculator", () => {
  for (const calc of CALCULATORS) {
    it(`${calc.slug}: default (or example) inputs are valid and produce balanced entries`, () => {
      const values = { ...defaults(calc), ...EXAMPLES[calc.slug] };
      assert.deepEqual(validateValues(calc, values), {});
      const s = calc.solve(values);
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
  const table = (s: ReturnType<typeof solve>, id: string) => s.tables.find((t) => t.id === id)!;
  const year = (s: ReturnType<typeof solve>, y: number) => table(s, "depreciation").rows.find((r) => r.year === y)!;
  const line = (s: ReturnType<typeof solve>, id: string, item: string) => table(s, id).rows.find((r) => r.item === item)!;
  const section = (s: ReturnType<typeof solve>, y: number) => s.years!.find((x) => x.id === `y${y}`)!;
  const base = PPE_EXAMPLE;
  const renovation: Values = { hasEvents: true, revision: true, revisionDate: "2025-07-01", revisionCost: 10000, lifeExtension: 2, revisedResidual: 10000 };
  const revaluation = (fairValues: { date: string; value: number }[], surplusTransfer = "depreciation"): Values => ({
    model: "revaluation",
    hasEvents: true,
    revalue: true,
    fairValues: JSON.stringify(fairValues),
    surplusTransfer,
  });

  it("starts empty: no figure or choice is filled in for the user", () => {
    const calc = getCalculator(PPE)!;
    const d = defaults(calc);
    for (const id of ["acquisitionDate", "calcStart", "calcEnd", "purchasePrice", "attributableCosts", "residual", "usefulLife", "method", "model"]) {
      assert.equal(d[id], "", id);
    }
    const errors = validateValues(calc, d, "scenario");
    assert.ok(errors.purchasePrice && errors.method && errors.acquisitionDate);
  });

  it("has no currency, extra-months, component or impairment inputs", () => {
    const ids = [...getCalculator(PPE)!.scenario, ...getCalculator(PPE)!.metrics].map((f) => f.id);
    for (const id of ["currency", "lifeMonths", "component", "impairment", "recoverableAmounts"]) assert.ok(!ids.includes(id), id);
  });

  it("cost includes directly attributable costs; depreciable amount deducts residual", () => {
    const s = solve(PPE, base);
    assert.equal(metric(s, "עלות במועד ההכרה"), 120000);
    assert.equal(metric(s, "סכום בר-פחת"), 110000);
  });

  it("straight-line starts when available for use and prorates the first fiscal year", () => {
    const s = solve(PPE, base);
    assert.equal(year(s, 2023).total, 13750); // 9 months
    assert.equal(year(s, 2024).total, 18333.33);
    assert.equal(year(s, 2029).months, 3);
    assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
  });

  it("shows the straight-line working as an equation with the figures", () => {
    const eq = section(solve(PPE, base), 2024).workings.find((w) => w.equation)!.equation!;
    assert.equal(eq.lhs, "פחת תקופתי");
    assert.deepEqual(eq.numeric, [{ over: ["106,250 − 10,000", "63"] }, "×", "12"]); // (C − R) / remaining months × months
    assert.equal(eq.result, 18333.33);
  });

  describe("renovation — straight-line", () => {
    const s = solve(PPE, { ...base, ...renovation });

    it("depreciates cost less residual until the renovation, then the new base over 5.75 years", () => {
      assert.equal(metric(s, "פחת שנצבר עד השיפוץ"), 41250);
      assert.equal(metric(s, "יתרה בספרים במועד השיפוץ"), 78750);
      assert.equal(metric(s, "יתרה בספרים לאחר היוון השיפוץ"), 88750);
      assert.equal(metric(s, "יתרת אורך חיים"), 5.75);
      assert.equal(metric(s, "פחת שנתי מעודכן"), 13695.65);
      assert.equal(year(s, 2025).before, 9166.67);
      assert.equal(year(s, 2025).after, 6847.83);
      assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
      assert.equal(table(s, "depreciation").totals!.total, 120000);
    });

    it("states the new depreciation base as an equation", () => {
      const eq = section(s, 2025).workings.find((w) => w.equation?.lhs === "בסיס פחת חדש")!.equation!;
      assert.deepEqual(eq.numeric, ["(", "78,750", "+", "10,000", ")", "−", "10,000"]);
      assert.equal(eq.result, 78750);
    });

    it("journal splits the renovation year around the capitalisation", () => {
      const whens = section(s, 2025).journal.map((e) => e.when);
      assert.deepEqual(whens, ["30/06/2025", "01/07/2025", "31/12/2025"]);
      const expense = round2(sum(s.journal.flatMap((e) => e.lines).filter((l) => l.account === "הוצאות פחת").map((l) => l.debit)));
      assert.equal(expense, 120000);
    });

    it("statements tie to the schedule", () => {
      assert.equal(line(s, "balance-sheet", "רכוש קבוע, נטו (יתרה בספרים)").y2025, 81902.17);
      assert.equal(line(s, "profit-or-loss", "הוצאות פחת").y2025, -16014.5);
      assert.equal(section(s, 2025).balance.find((l) => l.emphasis === "total")!.value, 81902.17);
    });

    it("next-year guidance: original formula before, revised formula after", () => {
      assert.match(section(s, 2024).next[0].body, /עלות מקורית/);
      assert.match(section(s, 2025).next[0].body, /יתרה בספרים ערב השיפוץ/);
      assert.equal(section(s, 2031).next[0].title, "הנכס הופחת במלואו");
    });
  });

  describe("renovation — sum-of-years-digits", () => {
    const s = solve(PPE, { ...base, ...renovation, method: "sum-of-years" });

    it("asset years straddle fiscal years: 6/21 and 5/21 prorated by month", () => {
      assert.equal(year(s, 2023).total, 23571.43); // 9/12 × 6/21 × 110,000
      assert.equal(year(s, 2024).total, 27500); // 3/12 × 6/21 + 9/12 × 5/21
      assert.equal(year(s, 2025).before, 11785.71);
      assert.equal(metric(s, "פחת שנצבר עד השיפוץ"), 62857.14);
    });

    it("restarts the digits over 5.75 years (5.75 + 4.75 + … + 0.75)", () => {
      assert.equal(metric(s, "סכום הספרות המעודכן"), 19.5);
      assert.equal(metric(s, "פחת ב-12 החודשים"), 16849.82);
      assert.equal(year(s, 2031).total, 732.6);
      assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
    });

    it("compares the methods over the same periods", () => {
      const cmp = table(s, "method-comparison");
      assert.equal(cmp.rows[0].slDep, 13750);
      assert.equal(cmp.rows[0].sydDep, 23571.43);
      for (const key of ["slDep", "sydDep", "ddbDep"]) assert.equal(cmp.totals![key], 120000, key);
    });
  });

  it("double-declining applies 2/life to the opening balance of each asset year", () => {
    const s = solve(PPE, { ...base, method: "double-declining" });
    assert.equal(year(s, 2023).total, 30000); // 9/12 × 120,000 / 3
    assert.equal(year(s, 2024).total, 30000); // 3/12 × 40,000 + 9/12 × 26,666.67
    assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
  });

  it("units of production follows actual output and fills missing years evenly", () => {
    const s = solve(PPE, { ...base, method: "units", totalUnits: 60000, unitsByYear: "6000, 11000" });
    assert.equal(year(s, 2023).total, 11000); // 6,000 × 110,000 / 60,000
    assert.equal(year(s, 2024).total, 20166.67);
    assert.equal(table(s, "depreciation").rows.at(-1)!.carrying, 10000);
  });

  describe("revaluation model", () => {
    it("decrease to P&L, later increase reverses it before the surplus", () => {
      const s = solve(PPE, {
        ...base,
        ...revaluation([
          { date: "2023-12-31", value: 100000 },
          { date: "2025-12-31", value: 70000 },
          { date: "2026-12-31", value: 80000 },
        ]),
      });
      const pl = (y: number) => line(s, "profit-or-loss", "הפסד מהערכה מחדש / ביטולו")[`y${y}`];
      assert.equal(pl(2023), -6250); // 106,250 → 100,000
      assert.equal(pl(2025), 4285.71); // reverses part of the earlier loss
      assert.equal(pl(2026), 1964.29); // the rest of the loss …
      assert.equal(line(s, "profit-or-loss", "רווח כולל אחר — שינוי בקרן הערכה מחדש").y2026, 26497.25); // … then OCI
      assert.equal(year(s, 2024).total, round2((90000 / 63) * 12));
      assert.equal(table(s, "depreciation").rows.at(-1)!.surplus, 0);
    });

    it("accepts a revaluation on any date, splitting the year around it", () => {
      const s = solve(PPE, { ...base, ...revaluation([{ date: "2025-06-30", value: 90000 }]) });
      const whens = section(s, 2025).journal.map((e) => e.when);
      assert.deepEqual(whens, ["30/06/2025", "30/06/2025", "31/12/2025", "31/12/2025"]); // depreciation, revaluation, then the rest of the year
      // From July 2025 the fair value is depreciated over the 45 months left.
      assert.equal(year(s, 2026).total, round2(((90000 - 10000) / 45) * 12));
    });

    it("shows the monthly surplus transfer as an equation", () => {
      const s = solve(PPE, { ...base, ...revaluation([{ date: "2026-12-31", value: 80000 }]) });
      const eq = section(s, 2027).workings.find((w) => w.equation?.lhs === "העברה חודשית לעודפים")!.equation!;
      assert.deepEqual(eq.numeric, { over: ["28,750", "27"] });
      assert.equal(eq.result, round2(28750 / 27));
      assert.match(section(s, 2026).next.find((g) => g.title.includes("לעודפים"))!.body, /הפרש הפחת/);
    });

    it("with transfer on disposal only, the surplus stays", () => {
      const s = solve(PPE, { ...base, ...revaluation([{ date: "2026-12-31", value: 80000 }], "disposal") });
      assert.equal(table(s, "depreciation").rows.at(-1)!.surplus, 28750);
      assert.ok(!s.journal.some((e) => e.id.startsWith("transfer")));
    });

    it("rejects a revaluation after the end of the useful life", () => {
      const calc = getCalculator(PPE)!;
      const errors = validateValues(calc, { ...defaults(calc), ...base, ...revaluation([{ date: "2030-12-31", value: 1 }]) });
      assert.ok(errors.fairValues);
    });

    it("needs at least one complete row", () => {
      const calc = getCalculator(PPE)!;
      const errors = validateValues(calc, { ...defaults(calc), ...base, ...revaluation([]) });
      assert.ok(errors.fairValues);
    });
  });

  describe("asset exchange", () => {
    const exchange: Values = {
      hasEvents: true,
      exchange: true,
      exchangeDate: "2027-12-31",
      commercialSubstance: true,
      fvGivenKnown: true,
      fvGiven: 50000,
      cashDirection: "paid",
      cashAmount: 5000,
      newAssetLife: 5,
      newAssetResidual: 5000,
    };

    it("with commercial substance: fair value of the asset given plus cash, gain on derecognition", () => {
      const s = solve(PPE, { ...base, ...exchange });
      assert.equal(metric(s, "עלות הנכס שהתקבל"), 55000);
      assert.equal(metric(s, "רווח (הפסד) מההחלפה"), round2(50000 - 32916.67));
      assert.equal(line(s, "balance-sheet", "רכוש קבוע, נטו (יתרה בספרים)").y2027, 0);
      assert.match(s.years!.at(-1)!.next[1].body, /פחת לשנת 2028: ₪10,000\.00/); // (55,000 − 5,000) / 5
    });

    it("measured at the fair value received when the given one is unknown", () => {
      const s = solve(PPE, { ...base, ...exchange, fvGivenKnown: false, fvReceived: 55000 });
      assert.equal(metric(s, "עלות הנכס שהתקבל"), 55000);
      assert.equal(metric(s, "רווח (הפסד) מההחלפה"), round2(55000 - 5000 - 32916.67));
    });

    it("without commercial substance: carrying amount less cash received, no gain", () => {
      const s = solve(PPE, { ...base, ...exchange, commercialSubstance: false, cashDirection: "received" });
      assert.equal(metric(s, "עלות הנכס שהתקבל"), round2(32916.67 - 5000));
      assert.equal(metric(s, "רווח (הפסד) מההחלפה"), 0);
    });

    it("locks the received asset's fair value, unvalidated, while the given one is known", () => {
      const calc = getCalculator(PPE)!;
      const field = calc.metrics.find((f) => f.id === "fvReceived")!;
      const values = { ...defaults(calc), ...base, ...exchange, fvReceived: "" };
      assert.ok(isDisabled(field, values));
      assert.deepEqual(validateValues(calc, values), {});
      assert.ok(validateValues(calc, { ...values, fvGivenKnown: false }).fvReceived);
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

  it("events count only when an event is declared, and one must be chosen", () => {
    const s = solve(PPE, { ...base, ...renovation, hasEvents: false });
    assert.ok(!s.journal.some((e) => e.id.startsWith("renovation")));
    const calc = getCalculator(PPE)!;
    assert.ok(validateValues(calc, { ...defaults(calc), ...base, hasEvents: true }).hasEvents);
  });

  describe("land component (IAS 16.58)", () => {
    // A warehouse: 1,000,000, 30% land, 20 years, no residual, available 01/01/2023.
    const warehouse: Values = {
      acquisitionDate: "2023-01-01",
      calcStart: "2023-01-01",
      calcEnd: "2026-12-31",
      purchasePrice: 1000000,
      attributableCosts: 0,
      residual: 0,
      usefulLife: 20,
      method: "straight-line",
      model: "cost",
      hasLand: true,
      landBasis: "percent",
      landPercent: 30,
    };
    const revalued = (fairValues: { date: string; value: number | "" }[]): Values => ({
      ...warehouse,
      model: "revaluation",
      hasEvents: true,
      revalue: true,
      fairValues: JSON.stringify(fairValues),
      surplusTransfer: "depreciation",
    });

    it("depreciates only the building; the land stays at cost", () => {
      const s = solve(PPE, warehouse);
      assert.equal(metric(s, "מרכיב הקרקע"), 300000);
      assert.equal(metric(s, "סכום בר-פחת"), 700000);
      assert.equal(year(s, 2023).total, 35000);
      assert.equal(line(s, "balance-sheet", "קרקע (אינה מופחתת)").y2026, 300000);
      assert.equal(line(s, "balance-sheet", "רכוש קבוע, נטו (יתרה בספרים)").y2026, 300000 + 700000 - 4 * 35000);
      const acquisition = s.journal.find((e) => e.id === "acquisition")!;
      assert.deepEqual(acquisition.lines.map((l) => [l.account, l.debit]).slice(0, 2), [["רכוש קבוע — מבנה", 700000], ["קרקע", 300000]]);
    });

    it("land can be given as an amount instead", () => {
      const s = solve(PPE, { ...warehouse, landBasis: "amount", landAmount: 250000 });
      assert.equal(year(s, 2023).total, 37500); // 750,000 / 20
    });

    it("revaluation splits the fair value and keeps a surplus for each part", () => {
      const s = solve(PPE, revalued([{ date: "2023-12-31", value: 1100000 }]));
      const y2023 = section(s, 2023);
      assert.ok(y2023.journal.some((e) => e.id.startsWith("revaluation")));
      assert.ok(y2023.journal.some((e) => e.id.startsWith("landRevaluation")));
      assert.equal(line(s, "balance-sheet", "קרן הערכה מחדש — מבנה (הון)").y2023, 105000); // 770,000 − 665,000
      assert.equal(line(s, "balance-sheet", "קרן הערכה מחדש — קרקע (הון)").y2023, 30000); // 330,000 − 300,000
      assert.equal(line(s, "balance-sheet", "קרקע (אינה מופחתת)").y2023, 330000);
      // The building depreciates its fair value over the 19 years left; only its surplus moves to retained earnings.
      assert.equal(year(s, 2024).total, round2(770000 / 19));
      assert.equal(year(s, 2024).transfer, round2(105000 / 19));
      assert.equal(line(s, "balance-sheet", "קרן הערכה מחדש — קרקע (הון)").y2026, 30000);
    });

    it("solves the total fair value from the building's surplus alone", () => {
      const s = solve(PPE, {
        ...revalued([{ date: "2023-12-31", value: "" }]),
        mode: "solve",
        unknown: "fairValues",
        targetKind: "buildingSurplus",
        targetDate: "2023-12-31",
        targetAmount: 105000,
      });
      assert.equal(s.metrics[0].value, 1100000);
      const steps = s.proof!.steps;
      assert.equal(steps.find((w) => w.equation?.lhs === "שווי הוגן מבנה")!.equation!.result, 770000); // 665,000 + 105,000
      assert.equal(steps.find((w) => w.equation?.lhs === "X")!.equation!.result, 1100000); // ÷ (1 − 30%)
    });

    describe("land's part of a fair value, per date", () => {
      const at2026 = (note?: string) => revalued([{ date: "2026-12-31", value: 1200000, ...(note ? { note } : {}) } as never]);
      const surpluses = (s: ReturnType<typeof solve>) => [
        line(s, "balance-sheet", "קרן הערכה מחדש — מבנה (הון)").y2026,
        line(s, "balance-sheet", "קרן הערכה מחדש — קרקע (הון)").y2026,
      ];

      it("without one, the share at acquisition splits it (30%)", () => {
        const s = solve(PPE, { ...at2026(), calcEnd: "2027-12-31" });
        assert.deepEqual(surpluses(s), [280000, 60000]); // 840,000 − 560,000; 360,000 − 300,000
        assert.equal(year(s, 2027).total, 52500); // 840,000 / 16
      });

      it("an amount for the land overrides the share", () => {
        const s = solve(PPE, { ...at2026("500000"), calcEnd: "2027-12-31" });
        assert.deepEqual(surpluses(s), [140000, 200000]); // 700,000 − 560,000; 500,000 − 300,000
        assert.equal(year(s, 2027).total, 700000 / 16);
        assert.match(section(s, 2026).workings.find((w) => w.label.startsWith("פיצול"))!.label, /שווי הקרקע שנקבע/);
      });

      it("a share for the date overrides it too", () => {
        const s = solve(PPE, at2026("25%"));
        assert.deepEqual(surpluses(s), [340000, 0]); // land 300,000 = cost; building 900,000
      });

      it("solves the total fair value from the building's surplus and the land's value", () => {
        const s = solve(PPE, {
          ...revalued([{ date: "2026-12-31", value: "", note: "500000" } as never]),
          mode: "solve",
          unknown: "fairValues",
          targetKind: "buildingSurplus",
          targetDate: "2026-12-31",
          targetAmount: 140000,
        });
        assert.equal(s.metrics[0].value, 1200000);
        assert.deepEqual(s.proof!.steps.find((w) => w.equation?.lhs === "X")!.equation!.numeric, ["700,000", "+", "500,000"]);
      });

      it("rejects an unreadable land part, or one not below the total", () => {
        const calc = getCalculator(PPE)!;
        assert.ok(validateValues(calc, { ...defaults(calc), ...at2026("abc") }).fairValues);
        assert.ok(validateValues(calc, { ...defaults(calc), ...at2026("1200000") }).fairValues);
      });
    });

    it("rejects land of the whole cost, and a residual above the building's cost", () => {
      const calc = getCalculator(PPE)!;
      assert.ok(validateValues(calc, { ...defaults(calc), ...warehouse, landPercent: 99.99, residual: 50000 }).residual);
      assert.ok(validateValues(calc, { ...defaults(calc), ...warehouse, landBasis: "amount", landAmount: 1000000 }).landAmount);
    });
  });

  describe("solving for an unknown (X)", () => {
    const solveX = (unknown: string, target: Values, extra: Values = {}) => {
      const values: Values = { ...base, mode: "solve", unknown, [unknown]: "", ...extra, ...target };
      return solve(PPE, values);
    };
    const x = (s: ReturnType<typeof solve>) => s.metrics[0].value;
    const lhs = (s: ReturnType<typeof solve>) => s.proof!.steps.flatMap((w) => (w.equation ? [w.equation.lhs] : []));

    it("initial cost from the carrying amount: isolates the total cost, then the purchase price", () => {
      const s = solveX("purchasePrice", { targetKind: "carrying", targetDate: "2024-12-31", targetAmount: 87916.67 });
      assert.equal(x(s), 100000);
      assert.deepEqual(lhs(s), ["יתרה בספרים", "עלות", "X"]);
      assert.equal(s.proof!.steps.find((w) => w.equation?.lhs === "עלות")!.equation!.result, 120000);
      assert.match(s.proof!.title, /שלב א׳/);
      // … and the rest of the solution uses X.
      assert.equal(metric(s, "עלות במועד ההכרה"), 120000);
      assert.equal(s.years!.length, 7);
    });

    it("useful life from a year's depreciation", () => {
      const s = solveX("usefulLife", { targetKind: "depreciation", targetYear: 2024, targetAmount: 18333.33 });
      assert.equal(x(s), 6);
      assert.equal(s.proof!.steps.find((w) => w.equation?.lhs === "X")!.equation!.result, 72); // months
    });

    it("residual value from accumulated depreciation", () => {
      const s = solveX("residual", { targetKind: "accumulated", targetDate: "2024-12-31", targetAmount: 32083.33 });
      assert.equal(x(s), 10000);
      assert.ok(lhs(s).includes("X"));
    });

    it("renovation cost from the carrying amount after the renovation", () => {
      const s = solveX("revisionCost", { targetKind: "carrying", targetDate: "2025-12-31", targetAmount: 81902.17 }, renovation);
      assert.equal(x(s), 10000);
      assert.deepEqual(lhs(s), ["יתרה בספרים", "יתרה ערב השיפוץ + X", "X"]);
    });

    it("fair value from the revaluation surplus it created", () => {
      const s = solveX(
        "fairValues",
        { targetKind: "surplus", targetDate: "2026-12-31", targetAmount: 28750 },
        { ...revaluation([]), fairValues: JSON.stringify([{ date: "2026-12-31", value: "" }]) },
      );
      assert.equal(x(s), 80000);
      assert.deepEqual(lhs(s), ["קרן הערכה מחדש", "X"]);
    });

    it("fair value of the asset given from the gain on exchange", () => {
      const s = solveX(
        "fvGiven",
        { targetKind: "exchangeGain", targetAmount: 17083.33 },
        { hasEvents: true, exchange: true, exchangeDate: "2027-12-31", commercialSubstance: true, fvGivenKnown: true, cashDirection: "none", newAssetLife: 5, newAssetResidual: 0 },
      );
      assert.equal(x(s), 50000);
    });

    it("any other case is solved exactly, shown as a line in X", () => {
      const s = solveX("purchasePrice", { targetKind: "carrying", targetDate: "2024-12-31", targetAmount: 68928.57 }, { method: "sum-of-years" });
      assert.equal(x(s), 100000);
      assert.ok(s.proof!.steps.some((w) => w.equation?.abstract.toString().includes("a")));
      assert.match(s.proof!.steps.at(-1)!.formula!, /68,928\.57 ✓/);
    });

    it("asks for an unknown, and rejects a result that no X can produce", () => {
      const calc = getCalculator(PPE)!;
      const values = { ...defaults(calc), ...base, mode: "solve", targetKind: "carrying", targetDate: "2024-12-31", targetAmount: 87916.67 };
      assert.ok(validateValues(calc, values).unknown);
      assert.ok(validateValues(calc, { ...values, unknown: "purchasePrice", purchasePrice: "", targetDate: "2023-01-31" }).targetDate);
      assert.ok(validateValues(calc, { ...values, unknown: "usefulLife", usefulLife: "", targetAmount: 120000 }).targetAmount);
    });
  });

  it("rejects a renovation after the original useful life, and a range that ends before it starts", () => {
    const calc = getCalculator(PPE)!;
    assert.ok(validateValues(calc, { ...defaults(calc), ...base, ...renovation, usefulLife: 2 }).revisionDate);
    assert.ok(validateValues(calc, { ...defaults(calc), ...base, calcStart: "2026-01-01", calcEnd: "2025-01-01" }).calcEnd);
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
