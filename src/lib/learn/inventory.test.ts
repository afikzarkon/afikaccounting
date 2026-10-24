import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, ledger, typeOf } from "./basics";
import {
  entriesFor,
  gpFire,
  gpRate,
  grossProfitMethod,
  historyFire,
  type Method,
  METHODS,
  type Period,
  type Purchase,
  purchaseCost,
  type Sale,
  settle,
  valuateChain,
  valuatePeriod,
} from "./inventory";
import { explainPeriod, stepsToText } from "./inventory-explain";
import { COUNT_BRIDGE, KOL, kolNextYear, LEHAVA, NEYAR, PRACTICE, SHEMESH_PURCHASE, TZLIL, TZLIL_FLIP, WA_OPEN } from "./inventory-examples";

const near = (a: number, b: number, eps = 0.005, msg?: string) => assert.ok(Math.abs(a - b) <= eps, `${msg ?? ""} expected ${b}, got ${a}`);
const B = (date: string | undefined, qty: number, unitPrice: number, more: Partial<Purchase> = {}): Purchase => ({ date, qty, unitPrice, ...more });
const S = (date: string | undefined, qty: number, unitPrice?: number): Sale => ({ date, qty, unitPrice });
const run = (p: Period, m: Method, system?: "periodic" | "perpetual") => valuatePeriod(p, m, { system });

// ---------------------------------------------------------------------------
// Official solutions (O).

describe("O1 · the lecture's example, four ways", () => {
  const P: Period = {
    label: "2023",
    purchases: [B("2023-02-01", 10, 2), B("2023-04-10", 5, 3), B("2023-08-17", 6, 4)],
    sales: [S("2023-03-12", 5, 6), S("2023-09-15", 7, 10)],
  };
  it("FIFO: closing 33, cogs 26, gross profit 74 — periodic and perpetual alike", () => {
    for (const sys of ["periodic", "perpetual"] as const) {
      const r = run(P, "fifo", sys);
      assert.equal(r.netSales, 100);
      assert.equal(r.purchasesCost, 59);
      assert.equal(r.closingUnits, 9);
      near(r.closingCarrying, 33);
      near(r.cogs, 26);
      near(r.grossProfit, 74);
    }
  });
  it("periodic average: 59/21", () => {
    const r = run(P, "wa-periodic");
    near(r.avgCost!, 2.809524, 1e-6);
    near(r.closingCarrying, 25.285714, 1e-6);
    near(r.cogs, 33.714286, 1e-6);
    near(r.grossProfit, 66.285714, 1e-6);
  });
  it("moving average: balances after each event", () => {
    const r = run(P, "moving-avg");
    assert.deepEqual(
      r.ledger.map((x) => [x.units, Math.round(x.cost * 1e4) / 1e4, x.avg]),
      [
        [10, 20, 2],
        [5, 10, 2],
        [10, 25, 2.5],
        [16, 49, 3.0625],
        [9, 27.5625, 3.0625],
      ],
    );
    near(r.cogs, 31.4375, 1e-9);
    near(r.saleCosts[1], 21.4375, 1e-9);
    near(r.grossProfit, 68.5625, 1e-9);
  });
});

describe("O2 · kits: the idea and its entries", () => {
  const P: Period = { label: "", purchases: [B("2025-01-01", 10, 5)], sales: [S("2025-01-02", 6, 15)] };
  const r = run(P, "fifo");
  it("closing 20, cogs 30, gross profit 60", () => {
    assert.equal(r.closingCarrying, 20);
    assert.equal(r.cogs, 30);
    assert.equal(r.grossProfit, 60);
  });
  it("periodic and perpetual entries", () => {
    const pe = entriesFor(P, r, "periodic", { payable: "מזומן", receivable: "מזומן" }).map((e) => e.lines.map((l) => [l.account, l.dr ?? -l.cr!]));
    assert.deepEqual(pe, [
      [["קניות", 50], ["מזומן", -50]],
      [["מזומן", 90], ["מכירות", -90]],
      [["מלאי סגירה מאזני", 20], ["מלאי סגירה רווח או הפסד", -20]],
    ]);
    const pp = entriesFor(P, valuatePeriod(P, "fifo", { system: "perpetual" }), "perpetual", { payable: "מזומן", receivable: "מזומן" }).map((e) => e.lines.map((l) => [l.account, l.dr ?? -l.cr!]));
    assert.deepEqual(pp, [
      [["מלאי", 50], ["מזומן", -50]],
      [["מזומן", 90], ["מכירות", -90]],
      [["עלות המכר", 30], ["מלאי", -30]],
    ]);
  });
});

describe("O3 · retail method", () => {
  it("closing 2,000", () => {
    const r = grossProfitMethod({ netSales: 100_000, rate: 0.15, opening: 35_000, purchases: 52_000 });
    near(r.cogs, 85_000);
    near(r.closing, 2_000);
  });
});

describe("O4 · NRV", () => {
  it("writes 2,950 down by 80", () => {
    const r = valuatePeriod({ label: "", opening: { units: 1, cost: 2_950 }, purchases: [], sales: [], nrvPerUnit: 3_000 - 100 - 30 }, "fifo");
    near(r.writeDown, 80);
    near(r.closingCarrying, 2_870);
    near(r.cogs, 80);
  });
});

describe("O8 · toy import", () => {
  const box = { category: "freight" as const, amount: 20, basis: "per-pack" as const, packSize: 100 };
  const us = (q: number, p: number): Purchase => B(undefined, q, p, { extras: [{ category: "freight", amount: 2_000, basis: "per-shipment" }, { category: "handling", amount: 800, basis: "per-shipment" }, box] });
  const cn = (q: number, p: number): Purchase =>
    B(undefined, q, p, {
      discounts: [{ kind: "qty-whole", threshold: 0, pct: 0.1 }],
      extras: [{ category: "freight", amount: 1_200, basis: "per-shipment" }, { category: "duty", amount: 0.05, basis: "pct-of-net-price" }, box],
    });
  const orders = [us(10_000, 32), cn(2_500, 28), cn(4_000, 30), us(5_000, 40), cn(1_200, 35)];
  it("order costs", () => {
    const totals = orders.map((o) => purchaseCost(o).total);
    [324_800, 67_850, 115_400, 203_800, 41_130].forEach((v, i) => near(totals[i], v));
    near(
      totals.reduce((s, v) => s + v, 0),
      752_980,
    );
  });
  it("closing 82,480 by the margin", () => {
    const purchases = orders.reduce((s, o) => s + purchaseCost(o).total, 0);
    const r = grossProfitMethod({ netSales: 20_000 * 45, rate: 0.15, opening: 94_500, purchases });
    near(r.cogs, 765_000);
    near(r.grossProfit, 135_000);
    near(r.closing, 82_480);
  });
});

describe("O9 · three methods", () => {
  const P: Period = {
    label: "2023",
    purchases: [B("2023-04-15", 16_000, 4), B("2023-05-20", 3_000, 5), B("2023-06-26", 2_000, 5.5), B("2023-09-15", 14_000, 6), B("2023-11-14", 12_000, 6.5)],
    sales: [S("2023-04-18", 10_000, 7), S("2023-07-24", 6_000, 9), S("2023-08-10", 2_000, 12), S("2023-10-20", 4_000, 13), S("2023-12-31", 5_000, 14)],
  };
  it("FIFO", () => {
    const r = run(P, "fifo");
    assert.equal(r.netSales, 270_000);
    assert.equal(r.purchasesCost, 252_000);
    assert.equal(r.closingUnits, 20_000);
    near(r.closingCarrying, 126_000);
    near(r.grossProfit, 144_000);
  });
  it("periodic average", () => {
    const r = run(P, "wa-periodic");
    near(r.avgCost!, 5.361702, 1e-6);
    near(r.closingCarrying, 107_234.04);
    near(r.cogs, 144_765.96);
    near(r.grossProfit, 125_234.04);
  });
  it("moving average", () => {
    const r = run(P, "moving-avg");
    near(r.cogs, 129_869.52);
    near(r.closingCarrying, 122_130.48);
    near(r.grossProfit, 140_130.48);
  });
});

describe("O11 · boxes: FIFO periodic, NRV, and a claim by periodic average", () => {
  const box = (game: number, doll: number) => 5 * game + 2 * doll;
  const terms = (q: number, g: number, d: number): Purchase =>
    B(undefined, q, box(g, d), {
      discounts: [{ kind: "qty-whole", threshold: 180, pct: 0.05 }],
      extras: [{ category: "freight", amount: 3_500, basis: "per-shipment" }, { category: "freight", amount: 5, basis: "per-unit" }],
    });
  const y2022: Period = {
    label: "2022",
    purchases: [terms(250, 10, 7), terms(128, 10, 7), terms(185, 12, 8), terms(190, 15, 7)],
    sales: [100, 150, 120, 90, 90].map((q) => S(undefined, q, 120)),
    saleDiscount: { threshold: 100, pct: 0.1 },
    nrvPerUnit: 100,
  };
  it("costs and the 2022 statement", () => {
    const r = valuatePeriod(y2022, "fifo");
    [19_950, 12_332, 17_782, 20_514.5].forEach((v, i) => near(r.costs[i].total, v));
    near(r.purchasesCost, 70_578.5);
    assert.equal(r.closingUnits, 203);
    near(r.closingCostBasis, 21_764.05);
    near(r.writeDown, 1_464.05);
    near(r.closingCarrying, 20_300);
    near(r.netSales, 62_760);
    near(r.cogs, 50_278.5);
    near(r.grossProfit, 12_481.5);
    near(r.gpPct, 0.1989, 0.00005);
  });
  it("the claim, recomputed by periodic average without NRV", () => {
    const y2023: Period = { label: "2023", purchases: [terms(122, 15, 6.5), terms(300, 14, 5)], sales: [S(undefined, 74), S(undefined, 136)] };
    const f = historyFire({ periods: [y2022, y2023], method: "wa-periodic", savedUnits: 0, terms: { deductible: { kind: "pct", value: 0.14 } } });
    near(f.chain[1].costs[0].total, 14_846);
    near(f.chain[1].costs[1].total, 27_800);
    near(f.chain[1].openingCost, 19_027.14);
    near(f.avg!, 98.677, 0.0001);
    assert.equal(f.burnedUnits, 415);
    near(f.burned, 40_950.96);
    near(f.settlement.net, 35_217.83);
  });
});

describe("O12 · reef: periodic average, NRV, a claim by FIFO", () => {
  const rule = [{ kind: "qty-whole" as const, threshold: 200, pct: 0.05 }];
  const b = (q: number, p: number, freight: number) => B(undefined, q, p, { discounts: rule, extras: [{ category: "freight", amount: freight, basis: "per-unit" }] });
  const price = 1_156_794.44 / 1_000;
  const y2021: Period = { label: "2021", purchases: [b(350, 750, 150), b(430, 785, 120), b(150, 780, 100), b(270, 795, 115)], sales: [S(undefined, 1_000, price)], nrvPerUnit: 1_000 };
  const y2022: Period = { label: "2022", purchases: [b(285, 820, 140), b(320, 845, 125), b(150, 810, 110)], sales: [S(undefined, 800, price)], nrvPerUnit: 900 };
  it("2021 and 2022 by the company's periodic average", () => {
    const [a, c] = valuateChain([y2021, y2022], "wa-periodic");
    [301_875, 372_272.5, 132_000, 234_967.5].forEach((v, i) => near(a.costs[i].total, v));
    near(a.avgCost!, 867.5958, 0.0001);
    near(a.closingCarrying, 173_519.17);
    assert.equal(a.writeDown, 0);
    near(a.cogs, 867_595.83);
    [261_915, 296_880, 138_000].forEach((v, i) => near(c.costs[i].total, v));
    near(c.avgCost!, 911.3237, 0.0001);
    near(c.writeDown, 1_755.18);
    near(c.closingCarrying, 139_500);
    near(c.cogs, 730_814.17);
    near(c.netSales, 925_435.55, 0.01);
  });
  it("the claim by FIFO, 85%", () => {
    const f = historyFire({ periods: [y2021, y2022], method: "fifo", savedUnits: 0, terms: { deductible: { kind: "pct", value: 0.15 } } });
    assert.equal(f.burnedUnits, 155);
    near(f.burned, 142_638.75);
    near(f.settlement.net, 121_242.94);
  });
});

describe("O14 · FIFO across years with a reconstructed opening", () => {
  it("2021 closing and gross profit", () => {
    const extras = [
      { category: "storage-required" as const, amount: 1.5, basis: "per-unit" as const },
      { category: "freight" as const, amount: 0.8, basis: "per-unit" as const },
      { category: "storage" as const, amount: 1.2, basis: "per-unit" as const },
    ];
    const units = 641_921.538461 / 21;
    const r = valuatePeriod(
      { label: "2021", opening: { units, cost: 641_921.538461 }, purchases: [B(undefined, 14_000, 24, { extras }), B(undefined, 15_100, 22, { extras }), B(undefined, 9_400, 34, { extras }), B(undefined, 21_000, 18, { extras })], sales: [S(undefined, 1_870_400 / 35, 35)] },
      "fifo",
    );
    [368_200, 366_930, 341_220, 426_300].forEach((v, i) => near(r.costs[i].total, v));
    near(r.closingUnits, 36_627.6923, 0.0001);
    near(r.closingCarrying, 918_852.92);
    near(r.cogs, 1_225_718.62);
    near(r.grossProfit, 644_681.38);
    near(r.gpPct, 0.3447, 0.00005);
  });
});

describe("O15 · periodic average with an unknown price", () => {
  it("X = 3,500 gives an average of 3,100", () => {
    const r = run({ label: "", opening: { units: 200, cost: 582_000 }, purchases: [B(undefined, 30, 3_500), B(undefined, 60, 3_300), B(undefined, 40, 3_450)], sales: [S(undefined, 150), S(undefined, 120)] }, "wa-periodic");
    near(r.avgCost!, 3_100);
    near(r.closingCarrying, 186_000);
    near(r.cogs, 837_000);
  });
});

describe("O7 · fire by the average margin", () => {
  it("13,725 net", () => {
    const r22 = gpRate(300_000, 180_000);
    const r23 = gpRate(250_000, 30_000 + 70_000 + 160_000 - 30_000 - 30_000);
    near(r22, 0.4, 1e-9);
    near(r23, 0.2, 1e-9);
    const f = gpFire({ opening: 30_000, purchases: 50_000, sales: 90_000, rates: [r22, r23], saved: 1_750, terms: { deductible: { kind: "pct", value: 0.1 } } });
    near(f.cogs, 63_000);
    near(f.atFire, 17_000);
    near(f.burned, 15_250);
    near(f.settlement.deductible, 1_525);
    near(f.settlement.net, 13_725);
  });
});

// ---------------------------------------------------------------------------
// Derived (D): no official solution in the materials.

describe("D1 · company average, claim by FIFO", () => {
  const disc = [{ kind: "qty-whole" as const, threshold: 170, pct: 0.08 }];
  const ex = [{ category: "freight" as const, amount: 2_700, basis: "per-shipment" as const }];
  const y22: Period = {
    label: "2022",
    opening: { units: 200, cost: 66_000 },
    purchases: [B("2022-03-15", 200, 300, { discounts: disc, extras: ex }), B("2022-04-01", 150, 320, { discounts: disc, extras: ex }), B("2022-08-17", 300, 300, { discounts: disc, extras: ex })],
    sales: [S(undefined, 500, 244_000 / 500)],
    nrvPerUnit: 290,
  };
  const y23: Period = { label: "2023", purchases: [B("2023-05-15", 400, 320, { discounts: disc, extras: ex })], sales: [S(undefined, 200, 300)] };
  it("2022 by periodic average", () => {
    const r = valuatePeriod(y22, "wa-periodic");
    [57_900, 50_700, 85_500].forEach((v, i) => near(r.costs[i].total, v));
    near(r.avgCost!, 306);
    near(r.closingCarrying, 101_500);
    near(r.cogs, 158_600);
    near(r.grossProfit, 85_400);
  });
  it("claim by FIFO at 91%", () => {
    const f = historyFire({ periods: [y22, y23], method: "fifo", savedUnits: 0, terms: { deductible: { kind: "pct", value: 0.09 } } });
    near(f.chain[1].costs[0].total, 120_460);
    assert.equal(f.burnedUnits, 550);
    near(f.burned, 163_210);
    near(f.settlement.net, 148_521.1);
  });
});

describe("D2 · periodic average over three years, NRV and stacked discounts", () => {
  const rules = [
    { kind: "qty-whole" as const, threshold: 15_000, pct: 0.2 },
    { kind: "per-unit-above" as const, afterUnit: 19_000, amountPerUnit: 30 },
  ];
  const chain: Period[] = [
    { label: "2021", ownOpening: true, opening: { units: 8_500, cost: 340_000 }, purchases: [B(undefined, 65_000, 45)], sales: [S(undefined, 42_000, 55)], nrvPerUnit: 47.5 - 4.5 },
    { label: "2022", purchases: [15_500, 25_000, 10_000, 16_500, 20_000, 10_500].map((q) => B(undefined, q, 50, { discounts: rules })), sales: [S(undefined, 71_425, 57)], nrvPerUnit: 47 - 5 },
  ];
  it("2021", () => {
    const [a] = valuateChain(chain, "wa-periodic");
    near(a.avgCost!, 44.4218, 0.0001);
    near(a.closingCarrying, 1_354_500);
    near(a.cogs, 1_910_500);
    near(a.grossProfit, 399_500);
  });
  it("2022 opens at the written-down amount", () => {
    const [, b] = valuateChain(chain, "wa-periodic");
    [620_000, 820_000, 500_000, 660_000, 770_000, 525_000].forEach((v, i) => near(b.costs[i].total, v));
    assert.equal(b.closingUnits, 57_575);
    near(b.avgCost!, 40.6938, 0.0001);
    near(b.closingCarrying, 2_342_945.45);
    near(b.netSales, 4_071_225);
    near(b.cogs, 2_906_554.55);
    near(b.grossProfit, 1_164_670.45);
  });
});

// ---------------------------------------------------------------------------
// The page's own examples (A).

describe("A1 · headphones", () => {
  it("four results", () => {
    const f = run(TZLIL, "fifo");
    assert.equal(f.netSales, 1_000);
    assert.equal(f.purchasesCost, 590);
    assert.equal(f.closingUnits, 9);
    near(f.closingCarrying, 330);
    near(f.cogs, 260);
    near(f.grossProfit, 740);
    near(run(TZLIL, "fifo", "perpetual").closingCarrying, 330);
    const w = run(TZLIL, "wa-periodic");
    near(w.avgCost!, 28.095238, 1e-6);
    near(w.closingCarrying, 252.857143, 1e-6);
    near(w.grossProfit, 662.857143, 1e-6);
    const m = run(TZLIL, "moving-avg");
    near(m.cogs, 314.375, 1e-9);
    near(m.closingCarrying, 275.625, 1e-9);
    near(m.grossProfit, 685.625, 1e-9);
  });
  it("falling prices flip the order", () => {
    near(run(TZLIL_FLIP, "fifo").grossProfit, 540);
    near(run(TZLIL_FLIP, "moving-avg").grossProfit, 594.375, 1e-9);
    near(run(TZLIL_FLIP, "wa-periodic").grossProfit, 617.142857, 1e-6);
  });
});

describe("A2 · stationery", () => {
  it("FIFO", () => {
    const r = run(NEYAR, "fifo");
    assert.equal(r.netSales, 34_600);
    assert.equal(r.purchasesCost, 18_700);
    assert.equal(r.closingUnits, 350);
    assert.deepEqual(
      r.layers.map((l) => [l.units, l.cost]),
      [
        [150, 2_250],
        [200, 3_600],
      ],
    );
    near(r.cogs, 12_850);
    near(r.grossProfit, 21_750);
  });
  it("periodic average", () => {
    const r = run(NEYAR, "wa-periodic");
    near(r.avgCost!, 13.357143, 1e-6);
    near(r.closingCarrying, 4_675);
    near(r.cogs, 14_025);
  });
  it("moving average", () => {
    const r = run(NEYAR, "moving-avg");
    const want = [
      [400, 4_000],
      [150, 1_500],
      [450, 5_100],
      [50, 566.67],
      [550, 8_066.67],
      [250, 3_666.67],
      [450, 7_266.67],
      [350, 5_651.85],
    ];
    r.ledger.forEach((x, i) => {
      assert.equal(x.units, want[i][0]);
      near(x.cost, want[i][1], 0.005);
    });
    [2_500, 4_533.33, 4_400, 1_614.81].forEach((v, i) => near(r.saleCosts[i], v));
    near(r.cogs, 13_048.15);
    near(r.grossProfit, 21_551.85);
  });
});

describe("A3–A5", () => {
  it("A3 · candles", () => {
    const r = run(LEHAVA, "fifo");
    assert.equal(r.closingCarrying, 200);
    assert.equal(r.cogs, 300);
    assert.equal(r.grossProfit, 600);
  });
  it("A4 · the import costs 158,200", () => {
    const c = purchaseCost(SHEMESH_PURCHASE);
    assert.equal(c.gross, 160_000);
    assert.equal(c.discount, 16_000);
    near(c.total, 158_200);
    near(c.perUnit, 79.1);
    assert.ok(c.lines.filter((l) => !l.included).length === 2);
  });
  it("A5 · speakers written down, then reversed up to cost only", () => {
    const r = run(KOL, "fifo");
    near(r.nrvTotal!, 17_040);
    near(r.writeDown, 960);
    for (const [nrv, carrying, rev] of [
      [155, 18_000, 960],
      [170, 18_000, 960],
      [145, 17_400, 360],
    ]) {
      const [, b] = valuateChain(kolNextYear(nrv), "fifo", { carryWriteDown: true });
      near(b.closingCarrying, carrying);
      near(b.reversal, rev);
      near(b.cogs, -rev);
    }
  });
  it("chapter 8 · opening inventory joins the average", () => {
    const r = run(WA_OPEN, "wa-periodic");
    near(r.avgCost!, 11, 1e-9);
    near(r.closingCarrying, 2_200);
  });
  it("chapter 11 · the count bridge", () => {
    assert.equal(
      COUNT_BRIDGE.reduce((s, x) => s + x.sign * x.amount, 0),
      220_000,
    );
  });
});

// ---------------------------------------------------------------------------
// Properties, edges, entries.

/** A small seeded generator, so random cases repeat. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomPeriod(r: () => number, opts: { flat?: number } = {}): Period {
  const n = 1 + Math.floor(r() * 5);
  const purchases: Purchase[] = [];
  const sales: Sale[] = [];
  let stock = r() < 0.5 ? Math.floor(r() * 50) : 0;
  const opening = { units: stock, cost: stock * (opts.flat ?? 5 + Math.floor(r() * 20)) };
  let day = 1;
  for (let i = 0; i < n; i++) {
    const q = 1 + Math.floor(r() * 100);
    purchases.push(B(`2025-01-${String(day++).padStart(2, "0")}`, q, opts.flat ?? 1 + Math.floor(r() * 50)));
    stock += q;
    if (r() < 0.7) {
      const s = Math.floor(r() * stock);
      if (s > 0) {
        sales.push(S(`2025-01-${String(day++).padStart(2, "0")}`, s, 60));
        stock -= s;
      }
    }
  }
  return { label: "r", opening, purchases, sales };
}

/** A unit-by-unit oracle: a queue of single units for FIFO, a running average for the moving average. */
function oracle(p: Period, m: "fifo" | "moving-avg") {
  const units: number[] = [];
  for (let i = 0; i < (p.opening?.units ?? 0); i++) units.push(p.opening!.cost / p.opening!.units);
  let cogs = 0;
  const evs = [...p.purchases.map((x) => ({ d: x.date!, k: 0, x })), ...p.sales.map((x) => ({ d: x.date!, k: 1, x }))].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.k - b.k));
  let total = units.reduce((s, v) => s + v, 0);
  let count = units.length;
  for (const e of evs) {
    if (e.k === 0) {
      for (let i = 0; i < e.x.qty; i++) units.push((e.x as Purchase).unitPrice);
      total += e.x.qty * (e.x as Purchase).unitPrice;
      count += e.x.qty;
    } else if (m === "fifo") for (let i = 0; i < e.x.qty; i++) cogs += units.shift()!;
    else {
      const avg = total / count;
      cogs += avg * e.x.qty;
      total -= avg * e.x.qty;
      count -= e.x.qty;
    }
  }
  return { cogs, closing: m === "fifo" ? units.reduce((s, v) => s + v, 0) : total };
}

describe("properties", () => {
  const r = rng(20251024);
  const cases = Array.from({ length: 220 }, () => randomPeriod(r));
  it("conservation: opening + purchases = cogs + closing, for every method", () => {
    for (const p of cases)
      for (const m of METHODS) {
        const x = run(p, m);
        near(x.openingCost + x.purchasesCost, x.cogs + x.closingCarrying, 1e-6);
      }
  });
  it("FIFO periodic = FIFO perpetual", () => {
    for (const p of cases) {
      const a = run(p, "fifo", "periodic");
      const b = run(p, "fifo", "perpetual");
      near(a.closingCarrying, b.closingCarrying, 1e-6);
      near(a.cogs, b.cogs, 1e-6);
    }
  });
  it("the sum of sale costs is cost of sales", () => {
    for (const p of cases)
      for (const m of METHODS) {
        const x = run(p, m);
        near(
          x.saleCosts.reduce((s, v) => s + v, 0),
          x.cogs,
          1e-6,
        );
      }
  });
  it("a unit-by-unit oracle agrees", () => {
    for (const p of cases.slice(0, 80))
      for (const m of ["fifo", "moving-avg"] as const) {
        const o = oracle(p, m);
        const x = run(p, m);
        near(x.cogs, o.cogs, 1e-6);
        near(x.closingCarrying, o.closing, 1e-6);
      }
  });
  it("one price for everything: all three methods agree", () => {
    const rr = rng(7);
    for (let i = 0; i < 40; i++) {
      const p = randomPeriod(rr, { flat: 12 });
      const v = METHODS.map((m) => run(p, m).closingCarrying);
      near(v[1], v[0], 1e-6);
      near(v[2], v[0], 1e-6);
    }
  });
  it("the moving average stays between the lowest and highest price so far", () => {
    for (const p of cases) {
      const x = run(p, "moving-avg");
      const prices = [...(p.opening?.units ? [p.opening.cost / p.opening.units] : [])];
      let pi = 0;
      for (const row of x.ledger) {
        if (row.kind === "buy") prices.push(p.purchases[pi++].unitPrice);
        if (row.units > 0 && prices.length) assert.ok(row.avg >= Math.min(...prices) - 1e-9 && row.avg <= Math.max(...prices) + 1e-9);
      }
    }
  });
  it("NRV: carrying never above cost, nothing changes when NRV is higher", () => {
    for (const p of cases) {
      const x = valuatePeriod({ ...p, nrvPerUnit: 20 }, "wa-periodic");
      assert.ok(x.closingCarrying <= x.closingCostBasis + 1e-9 && x.closingCarrying >= 0);
      const y = valuatePeriod({ ...p, nrvPerUnit: 1e6 }, "wa-periodic");
      assert.equal(y.writeDown, 0);
      near(y.closingCarrying, y.closingCostBasis, 1e-9);
    }
  });
  it("a chain opens each year with last year's carrying amount", () => {
    const rr = rng(99);
    for (let i = 0; i < 30; i++) {
      const ys = [randomPeriod(rr), randomPeriod(rr), randomPeriod(rr)].map((p, j) => ({ ...p, opening: j ? undefined : p.opening, nrvPerUnit: 15 }));
      for (const m of METHODS) {
        const c = valuateChain(ys, m);
        for (let t = 1; t < c.length; t++) {
          near(c[t].openingCost, c[t - 1].closingCarrying, 1e-9);
          assert.equal(c[t].openingUnits, c[t - 1].closingUnits);
        }
      }
    }
  });
});

describe("edges", () => {
  it("no sales, no purchases, everything sold", () => {
    assert.equal(run({ label: "", purchases: [B(undefined, 5, 3)], sales: [] }, "moving-avg").closingCarrying, 15);
    assert.equal(run({ label: "", opening: { units: 4, cost: 8 }, purchases: [], sales: [S(undefined, 1, 5)] }, "fifo").closingCarrying, 6);
    for (const m of METHODS) {
      const x = run({ label: "", purchases: [B("2025-01-01", 3, 1 / 3), B("2025-01-02", 7, 0.7)], sales: [S("2025-01-03", 10, 1)] }, m);
      assert.equal(x.closingUnits, 0);
      assert.equal(x.closingCarrying, 0);
    }
  });
  it("fractional units", () => {
    const x = run({ label: "", purchases: [B(undefined, 10.5, 4)], sales: [S(undefined, 2.25, 9)] }, "fifo");
    near(x.closingUnits, 8.25, 1e-12);
    near(x.closingCarrying, 33, 1e-9);
  });
  it("purchases come before sales on the same date, unless told otherwise", () => {
    const p: Period = { label: "", purchases: [B("2025-01-01", 5, 10), B("2025-02-01", 5, 20)], sales: [S("2025-02-01", 8, 30)] };
    near(run(p, "moving-avg").saleCosts[0], 120);
    const late = valuatePeriod(p, "moving-avg", { salesFirstOnTie: true });
    assert.ok(late.errors[0].includes("1.2.2025"));
  });
  it("selling more than there is: an error with the date under perpetual, under periodic only the total counts", () => {
    const p: Period = { label: "", purchases: [B("2025-01-01", 5, 10), B("2025-03-01", 10, 10)], sales: [S("2025-02-01", 8, 30)] };
    const x = run(p, "moving-avg");
    assert.match(x.errors[0], /ב-1\.2\.2025 נמכרו 8 יחידות אבל במלאי היו רק 5/);
    assert.equal(run(p, "fifo", "periodic").errors.length, 0);
    assert.equal(run(p, "fifo", "periodic").closingUnits, 7);
    assert.equal(run({ ...p, sales: [S(undefined, 20)] }, "wa-periodic").errors.length, 1);
  });
  it("undated rows keep their order, with a warning under perpetual", () => {
    const x = run({ label: "", purchases: [B(undefined, 5, 10)], sales: [S(undefined, 2, 20)] }, "moving-avg");
    assert.equal(x.warnings.length, 1);
  });
  it("large values stay exact enough", () => {
    const x = run({ label: "", purchases: [B(undefined, 1e6, 1e5)], sales: [S(undefined, 4e5, 2e5)] }, "wa-periodic");
    near(x.closingCarrying, 6e10, 1e-3);
  });
  it("three rounding policies", () => {
    const exact = run(TZLIL, "wa-periodic");
    const unit = valuatePeriod(TZLIL, "wa-periodic", { rounding: { mode: "unit", digits: 2 } });
    const amount = valuatePeriod(TZLIL, "wa-periodic", { rounding: { mode: "amount", digits: 0 } });
    near(exact.closingCarrying, 252.857143, 1e-6);
    assert.equal(unit.avgCost, 28.1);
    near(unit.closingCarrying, 252.9, 1e-9);
    assert.equal(amount.closingCarrying, 253);
  });
  it("a counted shortage goes to cost of sales", () => {
    const x = valuatePeriod({ ...NEYAR, countedUnits: 340 }, "fifo");
    assert.equal(x.closingUnits, 340);
    assert.equal(x.shrinkUnits, 10);
    assert.equal(x.warnings.length, 1);
    near(x.cogs, 12_850 + 150);
  });
  it("settlement: deductible, cap after or before it", () => {
    assert.deepEqual(settle(10_000, { deductible: { kind: "pct", value: 0.1 }, cap: 8_000 }), { claim: 10_000, deductible: 1_000, capExcess: 1_000, net: 8_000, uncovered: 2_000 });
    assert.equal(settle(10_000, { deductible: { kind: "fixed", value: 500 }, cap: 8_000, capBeforeDeductible: true }).net, 7_500);
  });
});

describe("journal entries", () => {
  it("every entry balances and posts without an unknown account", () => {
    for (const p of [TZLIL, NEYAR, LEHAVA, KOL])
      for (const m of METHODS)
        for (const sys of ["periodic", "perpetual"] as const) {
          const r = valuatePeriod(p, m, { system: sys });
          const es = entriesFor(p, r, r.system);
          for (const e of es) {
            assert.ok(isBalanced(e), e.text);
            for (const l of e.lines) assert.ok(typeOf(l.account));
          }
          assert.doesNotThrow(() => ledger(es));
        }
  });
  it("perpetual entries add up to cost of sales", () => {
    const r = valuatePeriod({ ...NEYAR, nrvPerUnit: 15 }, "moving-avg");
    const t = ledger(entriesFor(NEYAR, r, "perpetual")).find((x) => x.account === "עלות המכר")!;
    near(t.balance, r.cogs, 0.02);
  });
});

describe("explanations and practice", () => {
  it("every step of every example renders as text", () => {
    for (const p of [TZLIL, NEYAR, KOL]) for (const m of METHODS) assert.ok(stepsToText(explainPeriod(p, run(p, m))).length > 50);
  });
  it("every practice item has a computed answer or statements, and a solution", () => {
    assert.ok(PRACTICE.length >= 14);
    for (const x of PRACTICE) {
      if (x.answers) for (const a of x.answers()) assert.ok(Number.isFinite(a.value), `${x.id} ${a.label}`);
      else assert.ok(x.statements?.length);
      if (x.solution) assert.ok(x.solution().length > 0, x.id);
    }
  });
  it("practice answers", () => {
    const a = Object.fromEntries(PRACTICE.filter((x) => x.answers).map((x) => [x.id, x.answers!().map((y) => y.value)]));
    assert.deepEqual(a.pr1, [225_000, 20_000]);
    assert.deepEqual(a.pr2, [4_350, 5_000]);
    assert.deepEqual(a.pr3, [24, 3_600]);
    assert.deepEqual(a.pr4, [5_900, 2_600]);
    near(a.pr5[0], 700);
    near(a.pr5[1], 600);
    near(a.pr5[2], 633.33);
    near(a.pr6[0], 54_940);
    assert.deepEqual(a.pr7, [1_000, 500]);
    near(a.pr8[0], 600, 1e-6);
    near(a.pr9[0], 38.81);
    assert.deepEqual(a.pr10, [20_000]);
    near(a.pr11[1], 10_200);
    near(a.pr12[1], 5_500);
    assert.deepEqual(a.pr13, [78_000, 4_000]);
    assert.deepEqual(a.pr16, [240_000, 354_000, 306_000]);
  });
});
