import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Method, METHODS, type Period, type Purchase, type Sale, valuatePeriod } from "./inventory";
import { explainSolve, explainTable } from "./inventory-explain";
import { CALC_EXAMPLES, DAF, galyam, P_AVG, P_AVG_KNOWN, P_DISC, P_LAST, P_PRICE, P_QTY_MA, P_QTY_MA_COST, P_RETAIL, P_SOLD } from "./inventory-examples";
import {
  closingFromSoldPct,
  discountPctFromAmount,
  gpClosing,
  type Known,
  lastSaleQty,
  purchasesFromSoldPct,
  qtyFromCostMA,
  salesFromGp,
  solveTable,
  solveUnknowns,
  TABLE_ROWS,
  type TableInput,
  type Unknown,
  unitPriceFromAvg,
} from "./inventory-solver";

const near = (a: number, b: number, eps = 0.005, msg?: string) => assert.ok(Math.abs(a - b) <= eps, `${msg ?? ""} expected ${b}, got ${a}`);
const B = (date: string | undefined, qty: number, unitPrice: number, more: Partial<Purchase> = {}): Purchase => ({ date, qty, unitPrice, ...more });
const S = (date: string | undefined, qty: number, unitPrice?: number): Sale => ({ date, qty, unitPrice });

describe("closed forms", () => {
  it("R30, R31", () => {
    near(gpClosing(35_000, 52_000, 100_000, 0.15), 2_000);
    near(salesFromGp(240_659.2, 0.28), 334_248.89);
    assert.equal(qtyFromCostMA(28_500, 5.7), 5_000);
    assert.equal(lastSaleQty(16_000 + 7_000, 12_000, 7_000), 4_000);
    near(purchasesFromSoldPct(1_192_140, 0.65), 1_834_061.54);
    near(closingFromSoldPct(1_834_061.54, 0.65), 641_921.54);
    assert.equal(discountPctFromAmount(13_125, 350, 750), 0.05);
    near(unitPriceFromAvg(3_055, 582_000 + 198_000 + 138_000, 330, 30), 3_005, 1e-6);
  });
  it("chapter 12's eight examples", () => {
    const s = solveUnknowns([P_QTY_MA], "moving-avg", [{ id: "q", label: "", ref: { t: "sale", year: 0, index: 0, field: "qty" } }], [{ year: 0, metric: "saleCost", index: 0, value: P_QTY_MA_COST }]);
    near(s.values.q, 600, 1e-6);
    assert.equal(lastSaleQty(P_LAST.available, P_LAST.closing, P_LAST.otherSales), 500);
    near((salesFromGp(P_PRICE.cogs, P_PRICE.gp) - P_PRICE.otherSales) / P_PRICE.qty, 100, 1e-9);
    near(gpClosing(P_RETAIL.opening, P_RETAIL.purchases, P_RETAIL.netSales, P_RETAIL.rate), 20_000);
    const a = solveUnknowns([P_AVG], "wa-periodic", [{ id: "x", label: "", ref: { t: "purchase", year: 0, index: 0, field: "unitPrice" } }], [{ year: 0, metric: "avgCost", value: P_AVG_KNOWN }]);
    near(a.values.x, 59, 1e-6);
    near(discountPctFromAmount(P_DISC.amount, P_DISC.qty, P_DISC.unitPrice), 0.05, 1e-12);
    near(purchasesFromSoldPct(P_SOLD.cogs, P_SOLD.p), 400_000);
  });
});

// ---------------------------------------------------------------------------
// Statements with question marks.

describe("O5 · two years with question marks", () => {
  const t: TableInput = {
    years: [
      { label: "2022", cells: { grossSales: 330_000, custDiscounts: 10_000, opening: 100_000, grossPurchases: 150_000, suppReturns: 15_000, closing: 125_000 } },
      { label: "2023", cells: { grossSales: 120_000, custDiscounts: "?", opening: "?", grossPurchases: 70_000, suppReturns: "?", closing: 100_000, cogs: 80_000, grossProfit: 40_000 } },
    ],
  };
  it("fills every cell", () => {
    const r = solveTable(t);
    assert.deepEqual([r.values[0].netSales, r.values[0].netPurchases, r.values[0].cogs, r.values[0].grossProfit], [320_000, 135_000, 110_000, 210_000]);
    assert.deepEqual([r.values[1].opening, r.values[1].netPurchases, r.values[1].suppReturns, r.values[1].netSales, r.values[1].custDiscounts], [125_000, 55_000, 15_000, 120_000, 0]);
    assert.equal(r.missing.length, 0);
    assert.equal(r.conflicts.length, 0);
    assert.ok(explainTable(t, r).length >= r.steps.length);
  });
});

describe("O6 · three years, the company founded mid-year", () => {
  const t: TableInput = {
    years: [
      { label: "2021", founded: true, cells: { grossSales: 420_000, custDiscounts: 40_000, grossPurchases: "?", suppDiscounts: 12_000, suppReturns: 24_000, cogs: 224_000, closing: 100_000, grossProfit: "?" } },
      { label: "2022", cells: { grossSales: 680_000, grossPurchases: 540_000, suppDiscounts: 20_000, custReturns: 80_000, custDiscounts: 25_000, closing: 180_000, cogs: "?", grossProfit: "?" } },
      { label: "2023", cells: { grossSales: 950_000, grossPurchases: 720_000, custDiscounts: "?", suppReturns: "?", grossProfit: 300_000, cogs: 602_000, closing: 280_000 } },
    ],
  };
  it("solves all three", () => {
    const [a, b, c] = solveTable(t).values;
    assert.deepEqual([a.netSales, a.grossPurchases, a.netPurchases, a.grossProfit], [380_000, 360_000, 324_000, 156_000]);
    assert.deepEqual([b.netSales, b.netPurchases, b.cogs, b.grossProfit], [575_000, 520_000, 440_000, 135_000]);
    assert.deepEqual([c.netSales, c.custDiscounts, c.netPurchases, c.suppReturns], [902_000, 48_000, 702_000, 18_000]);
  });
});

describe("O7 · the two years before the fire, from their statements", () => {
  it("40% and 20%", () => {
    const r = solveTable({
      years: [
        { label: "2022", founded: true, cells: { netSales: 300_000, cogs: 180_000, grossPurchases: 250_000, closing: "?", gpPct: "?" } },
        { label: "2023", cells: { netSales: 250_000, grossPurchases: 160_000, closing: 30_000, cogs: "?", gpPct: "?" } },
      ],
    });
    assert.equal(r.values[0].closing, 70_000);
    near(r.values[0].gpPct!, 0.4, 1e-12);
    assert.equal(r.values[1].cogs, 200_000);
    near(r.values[1].gpPct!, 0.2, 1e-12);
  });
});

describe("O14 · rebuilding last year from 'sold 65% of purchases'", () => {
  it("closing 641,921.54 and 30,567.69 units", () => {
    const r = solveTable({ years: [{ label: "2020", founded: true, cells: { netSales: 1_611_000, gpPct: 0.26, closing: "?", netPurchases: "?" }, cogsPctOfPurchases: 0.65 }] });
    near(r.values[0].cogs!, 1_192_140);
    near(r.values[0].netPurchases!, 1_834_061.54);
    near(r.values[0].closing!, 641_921.54);
    near(r.values[0].closing! / 21, 30_567.6923, 0.0001);
  });
});

describe("A6 · the page's table", () => {
  it("both years", () => {
    const [a, b] = solveTable(DAF).values;
    assert.deepEqual([a.netSales, a.netPurchases, a.grossPurchases, a.grossProfit], [465_000, 344_000, 360_000, 201_000]);
    near(a.gpPct!, 0.4323, 0.00005);
    assert.deepEqual([b.opening, b.netPurchases, b.cogs, b.netSales, b.custDiscounts], [80_000, 388_000, 373_000, 610_000, 10_000]);
  });
  it("finishes a year before the next, and opens each year from last year's closing", () => {
    const steps = solveTable(DAF).steps;
    const years = steps.map((s) => s.year);
    assert.deepEqual(years, [...years].sort((x, y) => x - y));
    assert.equal(steps.find((s) => s.year === 1)!.row, "opening");
    assert.ok(steps.every((s) => s.why.length > 0));
  });
  it("a margin given as a change on last year", () => {
    const r = solveTable({
      years: [
        { label: "1", founded: true, cells: { netSales: 100_000, closing: 10_000, netPurchases: 70_000 } },
        { label: "2", cells: { netSales: 200_000, netPurchases: "?", closing: 20_000, gpPct: "?" }, gpPctDelta: -0.05 },
      ],
    });
    near(r.values[0].gpPct!, 0.4, 1e-9);
    near(r.values[1].gpPct!, 0.35, 1e-9);
    near(r.values[1].cogs!, 130_000);
    near(r.values[1].netPurchases!, 140_000);
  });
});

describe("unknowns: a margin up or down on last year", () => {
  it("finds this year's sale price from last year's margin plus the change", () => {
    const periods: Period[] = [
      { label: "1", opening: { units: 0, cost: 0 }, purchases: [B(undefined, 100, 10)], sales: [S(undefined, 80, 20)] },
      { label: "2", purchases: [B(undefined, 100, 10)], sales: [S(undefined, 100, 0)] },
    ];
    const us: Unknown[] = [{ id: "p", label: "מחיר", ref: { t: "sale", year: 1, index: 0, field: "unitPrice" } }];
    // Year 1: sales 1,600 on cost 800, a 50% margin. Year 2 is ten points lower: 40% on cost 1,000, so sales of 1,666.67.
    const k: Known[] = [{ year: 1, metric: "gpPctChange", value: -0.1 }];
    const sol = solveUnknowns(periods, "fifo", us, k);
    assert.ok(sol.ok, sol.error);
    near(sol.values.p, 1000 / 0.6 / 100, 1e-6);
  });
});


describe("table: random consistent tables with holes", () => {
  it("recovers what the equations reach, and reports what they can't", () => {
    let seed = 1;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 150; n++) {
      const years = 1 + Math.floor(r() * 3);
      let closing = 0;
      const full: Record<string, number>[] = [];
      for (let t = 0; t < years; t++) {
        const opening = closing;
        const grossPurchases = 1000 * Math.floor(100 + r() * 400);
        const suppDiscounts = 1000 * Math.floor(r() * 20);
        const suppReturns = 1000 * Math.floor(r() * 20);
        const netPurchases = grossPurchases - suppDiscounts - suppReturns;
        closing = 1000 * Math.floor(r() * 100);
        const cogs = opening + netPurchases - closing;
        const grossSales = cogs + 1000 * Math.floor(50 + r() * 300);
        const custDiscounts = 1000 * Math.floor(r() * 20);
        const custReturns = 1000 * Math.floor(r() * 20);
        const netSales = grossSales - custDiscounts - custReturns;
        const grossProfit = netSales - cogs;
        full.push({ opening, grossPurchases, suppDiscounts, suppReturns, netPurchases, closing, cogs, grossSales, custDiscounts, custReturns, netSales, grossProfit, gpPct: grossProfit / netSales });
      }
      // Hide one cell per year among those an equation can reach.
      const hideable = ["netSales", "cogs", "grossProfit", "closing", "grossPurchases", "custDiscounts", "suppReturns"] as const;
      const input: TableInput = {
        years: full.map((y, t) => {
          const hide = hideable[Math.floor(r() * hideable.length)];
          const cells: TableInput["years"][number]["cells"] = {};
          for (const row of TABLE_ROWS) if (row !== "gpPct") cells[row] = row === hide ? "?" : y[row];
          if (t > 0) delete cells.opening;
          return { label: String(t), founded: t === 0, cells };
        }),
      };
      const out = solveTable(input);
      assert.equal(out.missing.length, 0, JSON.stringify(input));
      for (const [t, y] of full.entries()) for (const row of TABLE_ROWS) if (out.values[t][row] !== undefined) near(out.values[t][row]!, y[row], 1e-6, row);
    }
    // Two unknowns in one equation and nothing else: can't be determined.
    const stuck = solveTable({ years: [{ label: "x", cells: { netSales: "?", grossSales: 100, custDiscounts: "?", cogs: 50 } }] });
    assert.ok(stuck.missing.length > 0);
  });
});

// ---------------------------------------------------------------------------
// The numeric solver.

describe("O10 · two unknown sale quantities, moving average", () => {
  const P: Period = {
    label: "2023",
    purchases: [B("2023-02-20", 3_000, 5), B("2023-05-21", 7_000, 6), B("2023-09-20", 13_000, 6.5)],
    sales: [S("2023-06-14", 0, 15), S("2023-09-01", 2_000, 12), S("2023-11-20", 0, 10)],
  };
  const us: Unknown[] = [
    { id: "q1", label: "q1", ref: { t: "sale", year: 0, index: 0, field: "qty" } },
    { id: "q2", label: "q2", ref: { t: "sale", year: 0, index: 2, field: "qty" } },
  ];
  const ks: Known[] = [
    { year: 0, metric: "saleCost", index: 0, value: 28_500 },
    { year: 0, metric: "closingUnits", value: 12_000 },
  ];
  it("q1 = 5,000 and q2 = 4,000, one equation at a time", () => {
    const s = solveUnknowns([P], "moving-avg", us, ks);
    assert.ok(s.ok, s.error);
    near(s.values.q1, 5_000, 1e-6);
    near(s.values.q2, 4_000, 1e-6);
    near(s.equations[0].a, 5.7, 1e-9);
    near(s.equations[1].a, -1, 1e-9);
    const r = valuatePeriod(s.periods[0], "moving-avg");
    near(r.cogs, 65_300);
    near(r.closingCarrying, 76_200);
    near(r.netSales, 139_000);
    near(r.grossProfit, 73_700);
    const w = valuatePeriod(s.periods[0], "wa-periodic");
    near(w.avgCost!, 6.152174, 1e-6);
    near(w.closingCarrying, 73_826.09);
    near(w.grossProfit, 71_326.09);
  });
  it("a missing known is reported", () => {
    const s = solveUnknowns([P], "moving-avg", us, ks.slice(0, 1));
    assert.equal(s.ok, false);
    assert.match(s.error!, /חסר נתון/);
  });
});

describe("O12 · the discount rate from a known discount, and the selling price from the margin", () => {
  const rule = () => [{ kind: "qty-whole" as const, threshold: 200, pct: 0, shared: true }];
  const b = (q: number, p: number, f: number) => B(undefined, q, p, { discounts: rule(), extras: [{ category: "freight", amount: f, basis: "per-unit" }] });
  const y: Period = { label: "2021", purchases: [b(350, 750, 150), b(430, 785, 120), b(150, 780, 100), b(270, 795, 115)], sales: [S(undefined, 1_000, 0)], nrvPerUnit: 1_000 };
  it("5%, then sales of 1,156,794.44", () => {
    const s = solveUnknowns(
      [y],
      "wa-periodic",
      [
        { id: "d", label: "שיעור ההנחה", ref: { t: "discountPct", year: 0 } },
        { id: "p", label: "מחיר", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" } },
      ],
      [
        { year: 0, metric: "purchaseDiscount", index: 0, value: 13_125 },
        { year: 0, metric: "gpPct", value: 0.25 },
      ],
    );
    assert.ok(s.ok, s.error);
    near(s.values.d, 0.05, 1e-9);
    const r = valuatePeriod(s.periods[0], "wa-periodic");
    near(r.purchasesCost, 1_041_115);
    near(r.netSales, 1_156_794.44);
    near(r.grossProfit, 289_198.61);
  });
});

describe("O13 · moving average, discounts, financing, NRV and an unknown price", () => {
  const kg = { category: "freight" as const, amount: 0.2, basis: "per-kg" as const, kgPerUnit: 30 };
  const old = { kind: "qty-excess" as const, threshold: 750, pct: 0.1, to: "2020-06-30" };
  const target = { kind: "target" as const, pct: 0.15, companyControlled: false, expected: true, achieved: false, from: "2020-07-01" };
  const P: Period = {
    label: "2020",
    purchases: [
      B("2020-01-10", 1_250, 120, { discounts: [old, target], extras: [kg] }),
      B("2020-04-19", 950, 112, { discounts: [old, target], extras: [kg] }),
      B("2020-09-08", 140, 124, { discounts: [old, target], extras: [kg], financingPct: 0.03 }),
      B("2020-12-01", 200, 130, { discounts: [old, target], extras: [kg], financingPct: 0.03 }),
    ],
    sales: [S("2020-05-08", 800, 0), S("2020-10-22", 1_200, 150)],
    nrvPerUnit: 120,
  };
  it("costs, sale costs, the write-down and the price 192.81", () => {
    const r0 = valuatePeriod(P, "moving-avg");
    [151_500, 109_860, 17_679.2, 26_420].forEach((v, i) => near(r0.costs[i].total, v));
    near(r0.saleCosts[0], 95_040);
    near(r0.saleCosts[1], 143_376);
    near(r0.closingCostBasis, 67_043.2);
    near(r0.writeDown, 2_243.2);
    near(r0.cogs, 240_659.2);
    const s = solveUnknowns([P], "moving-avg", [{ id: "p", label: "מחיר", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, guess: 100 }], [{ year: 0, metric: "gpPct", value: 0.28 }]);
    assert.ok(s.ok, s.error);
    near(s.values.p, 192.8111, 0.0001);
    near(Math.round(s.values.p * 100) / 100, 192.81, 1e-9);
    assert.equal(Math.round(s.values.p), 193);
    const e = s.equations[0];
    assert.ok(e.viaSales);
    near(e.target, 334_248.89);
    near(e.a, 800, 1e-6);
    near(e.b, 180_000, 1e-3);
    assert.ok(explainSolve(s).length === 1);
  });
});

describe("O15 · the purchase price from a known average", () => {
  it("X = 3,005", () => {
    const P: Period = { label: "", opening: { units: 200, cost: 582_000 }, purchases: [B(undefined, 30, 0), B(undefined, 60, 3_300), B(undefined, 40, 3_450)], sales: [S(undefined, 150), S(undefined, 120)] };
    const s = solveUnknowns([P], "wa-periodic", [{ id: "x", label: "X", ref: { t: "purchase", year: 0, index: 0, field: "unitPrice" } }], [{ year: 0, metric: "avgCost", value: 3_055 }]);
    near(s.values.x, 3_005, 1e-6);
    near(s.equations[0].a, 30 / 330, 1e-9);
  });
});

describe("A7 · the full question", () => {
  it("costs, balances, the write-down and the price 89.81", () => {
    const { solved, result: r } = galyam();
    assert.ok(solved.ok, solved.error);
    [52_172, 42_425.6, 34_600, 21_336].forEach((v, i) => near(r.costs[i].total, v));
    near(r.purchasesCost, 150_533.6);
    const bal = r.ledger.map((x) => [x.units, x.cost]);
    [
      [800, 52_172],
      [300, 19_564.5],
      [900, 61_990.1],
      [200, 13_775.58],
      [700, 48_375.58],
      [100, 6_910.8],
      [400, 28_246.8],
    ].forEach(([u, c], i) => {
      assert.equal(bal[i][0], u);
      near(bal[i][1], c, 0.006);
    });
    [32_607.5, 48_214.52, 41_464.78].forEach((v, i) => near(r.saleCosts[i], v));
    near(r.writeDown, 2_246.8);
    near(r.closingCarrying, 26_000);
    near(r.cogs, 124_533.6);
    near(r.netSales, 177_905.14);
    near(solved.values.price, 89.8103, 0.0001);
    // The target discount is shown, struck out, and not deducted.
    assert.ok(r.costs[2].lines.some((l) => l.kind === "discount" && !l.included));
  });
});

describe("solver round trips", () => {
  let seed = 42;
  const r = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const period = (): Period => ({
    label: "r",
    purchases: Array.from({ length: 3 }, (_, i) =>
      B(`2025-0${2 * i + 1}-01`, 100 + Math.floor(r() * 400), 10 + Math.floor(r() * 30), { discounts: [{ kind: "qty-whole", threshold: 150, pct: 0.02 + Math.floor(r() * 8) / 100, shared: true }] }),
    ),
    sales: Array.from({ length: 3 }, (_, i) => S(`2025-0${2 * i + 2}-01`, 20 + Math.floor(r() * 80), 50 + Math.floor(r() * 50))),
  });
  const cases: { ref: Unknown["ref"]; known: (p: Period, res: ReturnType<typeof valuatePeriod>) => Known; get: (p: Period) => number }[] = [
    { ref: { t: "sale", year: 0, index: 1, field: "qty" }, known: (_, x) => ({ year: 0, metric: "closingUnits", value: x.closingUnits }), get: (p) => p.sales[1].qty },
    { ref: { t: "sale", year: 0, index: 2, field: "unitPrice" }, known: (_, x) => ({ year: 0, metric: "grossProfit", value: x.grossProfit }), get: (p) => p.sales[2].unitPrice! },
    { ref: { t: "purchase", year: 0, index: 1, field: "unitPrice" }, known: (_, x) => ({ year: 0, metric: "purchasesCost", value: x.purchasesCost }), get: (p) => p.purchases[1].unitPrice },
    { ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, known: (_, x) => ({ year: 0, metric: "gpPct", value: x.gpPct }), get: (p) => p.sales[0].unitPrice! },
  ];
  it("hide a field, give its result: the solver brings it back", () => {
    for (let n = 0; n < 40; n++)
      for (const m of METHODS as Method[])
        for (const c of cases) {
          const p = period();
          const res = valuatePeriod(p, m);
          const k = c.known(p, res);
          const s = solveUnknowns([p], m, [{ id: "x", label: "x", ref: c.ref, guess: 1 }], [k]);
          assert.ok(s.ok, `${m} ${JSON.stringify(c.ref)}: ${s.error}`);
          near(s.values.x, c.get(p), 1e-6, `${m} ${JSON.stringify(c.ref)}`);
        }
  });
  it("the shared discount rate comes back from one purchase's discount", () => {
    for (let n = 0; n < 30; n++) {
      const p = period();
      const big = p.purchases.findIndex((x) => x.qty > 150);
      if (big < 0) continue;
      const pct = (p.purchases[0].discounts![0] as { pct: number }).pct;
      for (const x of p.purchases) (x.discounts![0] as { pct: number }).pct = pct;
      const amount = p.purchases[big].qty * p.purchases[big].unitPrice * pct;
      const s = solveUnknowns([p], "fifo", [{ id: "d", label: "d", ref: { t: "discountPct", year: 0 } }], [{ year: 0, metric: "purchaseDiscount", index: big, value: amount }]);
      near(s.values.d, pct, 1e-9);
    }
  });
  it("an equation that doesn't depend on the unknown is reported", () => {
    const p = period();
    const s = solveUnknowns([p], "fifo", [{ id: "x", label: "מחיר", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" } }], [{ year: 0, metric: "closingUnits", value: 5 }]);
    assert.equal(s.ok, false);
  });
});

describe("calculator presets", () => {
  it("every preset with unknowns solves", () => {
    for (const e of CALC_EXAMPLES)
      if (e.unknowns?.length) {
        const s = solveUnknowns(e.periods!, e.method as Method, e.unknowns, e.knowns ?? []);
        assert.ok(s.ok, `${e.id}: ${s.error}`);
      }
  });
  it("their answers", () => {
    const solve = (id: string) => {
      const e = CALC_EXAMPLES.find((x) => x.id === id)!;
      return solveUnknowns(e.periods!, e.method as Method, e.unknowns!, e.knowns!).values;
    };
    near(solve("or").q1, 2_000, 1e-6);
    near(solve("or").q2, 3_000, 1e-6);
    near(solve("rimon").p, 57.5, 1e-6);
    near(solve("aron").x, 530, 1e-6);
    near(solve("galim").d, 0.06, 1e-9);
  });
});
