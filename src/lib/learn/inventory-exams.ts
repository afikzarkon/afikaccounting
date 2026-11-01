/**
 * The inventory course's two exam-level questions (its last lesson): the
 * questions' data, and every answer worked out by the engine. The screens
 * write the questions from these numbers; nothing is typed in twice.
 */

import { gpFire, historyFire, type Period, purchaseCost, type Purchase, valuateChain, valuatePeriod } from "./inventory";
import { explainGpFire, explainHistoryFire, explainPeriod, type TraceStep } from "./inventory-explain";

// ---------------------------------------------------------------------------
// Question 1: "Ofek" imports electric bicycles. Periodic weighted average over
// two years, an opening balance to correct, a supplier's terms that change
// mid-year, a customer discount, goods in transit, a write-down, the
// statement down to operating profit, and a fire claimed by FIFO with a cap.

export const OFEK = {
  /** What the 2023 statements showed: the bicycles counted in the warehouse, at cost. */
  reported: { units: 182, unitCost: 2_000 },
  /** Counted, but broken and beyond sale. */
  broken: 12,
  /** On consignment at a shop in Eilat, and left out of the count. */
  consigned: 30,
  listPrice: { 2024: 3_200, 2025: 3_000 },
  /** A customer buying more than this many bicycles in one sale gets this off the whole sale. */
  saleDiscount: { threshold: 150, pct: 0.1 },
  duty: 0.05,
  seaFreight: 2_000,
  inland: 20,
  /** Until 30.6.2025: 5% off a purchase of more than 200; from 1.7.2025: 8% off a purchase of more than 250. */
  discountOld: { threshold: 200, pct: 0.05 },
  discountNew: { threshold: 250, pct: 0.08 },
  nrv: { 2024: 2_600, 2025: 1_750 },
  /** Warehouse rent a month, delivery to customers a bicycle sold, and the year's administrative expenses. */
  storageMonthly: 4_000,
  delivery: 50,
  admin2025: 150_000,
  /** Counted in the warehouse on 31.12.2025; the order of 20.12 was still at sea. */
  counted2025: 140,
  fireDate: "2026-03-15",
  /** On consignment in Eilat on the day of the fire, from the order of 20.12.2025. */
  consignedAtFire: 30,
  deductible: 0.1,
  cap: 450_000,
};

const ofekTerms = (): Partial<Purchase> => ({
  discounts: [
    { kind: "qty-whole", threshold: OFEK.discountOld.threshold, pct: OFEK.discountOld.pct, to: "2025-06-30" },
    { kind: "qty-whole", threshold: OFEK.discountNew.threshold, pct: OFEK.discountNew.pct, from: "2025-07-01" },
  ],
  extras: [
    { category: "duty", label: "מכס", amount: OFEK.duty, basis: "pct-of-net-price" },
    { category: "freight", label: "הובלה ימית", amount: OFEK.seaFreight, basis: "per-shipment" },
    { category: "freight", label: "הובלה מהנמל למחסן", amount: OFEK.inland, basis: "per-unit" },
  ],
});
const ofekBuy = (date: string, qty: number, unitPrice: number): Purchase => ({ date, qty, unitPrice, label: `רכישה ${date.split("-").reverse().slice(0, 2).map(Number).join(".")}`, ...ofekTerms() });
const sale = (date: string, qty: number, unitPrice: number) => ({ date, qty, unitPrice });

export const OFEK_OPENING_UNITS = OFEK.reported.units - OFEK.broken + OFEK.consigned;

export const OFEK_YEARS: Period[] = [
  {
    label: "2024",
    opening: { units: OFEK_OPENING_UNITS, cost: OFEK_OPENING_UNITS * OFEK.reported.unitCost },
    purchases: [ofekBuy("2024-02-10", 400, 1_900), ofekBuy("2024-06-15", 150, 2_000), ofekBuy("2024-10-20", 250, 1_840)],
    sales: [sale("2024-03-05", 120, OFEK.listPrice[2024]), sale("2024-08-05", 180, OFEK.listPrice[2024]), sale("2024-11-15", 400, OFEK.listPrice[2024])],
    saleDiscount: OFEK.saleDiscount,
    nrvPerUnit: OFEK.nrv[2024],
  },
  {
    label: "2025",
    purchases: [ofekBuy("2025-03-01", 300, 1_840), ofekBuy("2025-08-01", 300, 1_725), ofekBuy("2025-12-20", 100, 1_780)],
    sales: [sale("2025-05-01", 90, OFEK.listPrice[2025]), sale("2025-09-01", 400, OFEK.listPrice[2025]), sale("2025-11-01", 270, OFEK.listPrice[2025])],
    saleDiscount: OFEK.saleDiscount,
    nrvPerUnit: OFEK.nrv[2025],
  },
];
/** 2026 up to the fire, and one sale after it that the claim leaves out. */
export const OFEK_2026: Period = {
  label: "2026",
  purchases: [ofekBuy("2026-02-01", 200, 1_900)],
  sales: [sale("2026-02-20", 150, OFEK.listPrice[2025]), sale("2026-04-10", 60, OFEK.listPrice[2025])],
};

export function ofek() {
  const [y24, y25] = valuateChain(OFEK_YEARS, "wa-periodic");
  const sold2025 = OFEK_YEARS[1].sales.reduce((s, x) => s + x.qty, 0);
  const selling2025 = OFEK.storageMonthly * 12 + OFEK.delivery * sold2025;
  const operating2025 = y25.grossProfit - selling2025 - OFEK.admin2025;
  const fire = historyFire({
    periods: [...OFEK_YEARS, OFEK_2026],
    method: "fifo",
    savedUnits: OFEK.consignedAtFire,
    terms: { deductible: { kind: "pct", value: OFEK.deductible }, cap: OFEK.cap },
    fireDate: OFEK.fireDate,
  });
  return {
    opening: { units: OFEK_OPENING_UNITS, cost: OFEK_YEARS[0].opening!.cost },
    costs: [...OFEK_YEARS[0].purchases, ...OFEK_YEARS[1].purchases].map(purchaseCost),
    years: [y24, y25],
    sold2025,
    selling2025,
    operating2025,
    fire,
    steps: {
      y24: explainPeriod(OFEK_YEARS[0], y24),
      y25: explainPeriod(OFEK_YEARS[1], y25),
      fire: explainHistoryFire("fifo", fire) as TraceStep[],
    },
  };
}

// ---------------------------------------------------------------------------
// Question 2: "Mishak" imports gift boxes, each of board games and puzzles.
// FIFO, a box's cost from its contents, a supplier's discount by the box, a
// customer's discount, storage and delivery outside the cost, a write-down,
// and a fire claimed by the gross profit method, with stock saved at selling
// price and a fixed deductible.

export const MISHAK = {
  /** A box holds this many board games and puzzles. */
  box: { games: 4, puzzles: 6 },
  /** Per purchase: date, boxes, price of a game, price of a puzzle. */
  buys: [
    { date: "2025-01-10", boxes: 60, game: 40, puzzle: 15 },
    { date: "2025-04-05", boxes: 40, game: 42, puzzle: 18 },
    { date: "2025-07-20", boxes: 80, game: 36, puzzle: 16 },
    { date: "2025-11-01", boxes: 50, game: 45, puzzle: 15 },
  ],
  sells: [
    { date: "2025-02-15", boxes: 25 },
    { date: "2025-05-01", boxes: 35 },
    { date: "2025-09-10", boxes: 60 },
    { date: "2025-12-15", boxes: 20 },
  ],
  price2025: 400,
  /** The supplier: more than this many boxes in one purchase, this much off its price. */
  supplierDiscount: { threshold: 50, pct: 0.1 },
  seaFreight: 1_200,
  inlandPerBox: 8,
  /** The storage company's monthly fee, which also covers delivery to customers. */
  storageMonthly: 1_500,
  customerDiscount: { threshold: 30, pct: 0.1 },
  nrvPerBox: 235,
  // 2026, up to the fire on 31.5.
  fireDate: "2026-05-31",
  buy2026: { date: "2026-03-01", boxes: 40, game: 44, puzzle: 15 },
  price2026: 410,
  sells2026: [
    { date: "2026-01-15", boxes: 25 },
    { date: "2026-04-10", boxes: 45 },
  ],
  /** Boxes left in the company's shop, which the fire didn't reach, at selling price. */
  savedAtPrice: 4_100,
  deductible: 1_500,
  cap: 10_000,
};

const boxPrice = (b: { game: number; puzzle: number }) => MISHAK.box.games * b.game + MISHAK.box.puzzles * b.puzzle;
const mishakBuy = (b: (typeof MISHAK.buys)[number]): Purchase => ({
  date: b.date,
  qty: b.boxes,
  unitPrice: boxPrice(b),
  label: `רכישה ${b.date.split("-").reverse().slice(0, 2).map(Number).join(".")}`,
  discounts: [{ kind: "qty-whole", threshold: MISHAK.supplierDiscount.threshold, pct: MISHAK.supplierDiscount.pct }],
  extras: [
    { category: "freight", label: "הובלה ימית", amount: MISHAK.seaFreight, basis: "per-shipment" },
    { category: "freight", label: "הובלה מהנמל למחסן", amount: MISHAK.inlandPerBox, basis: "per-unit" },
  ],
});

export const MISHAK_2025: Period = {
  label: "2025",
  purchases: MISHAK.buys.map(mishakBuy),
  sales: MISHAK.sells.map((s) => sale(s.date, s.boxes, MISHAK.price2025)),
  saleDiscount: MISHAK.customerDiscount,
  nrvPerUnit: MISHAK.nrvPerBox,
};

/** A sale's net amount: the whole sale at a discount when it passes the threshold. */
const netSale = (boxes: number, price: number) => boxes * price * (boxes > MISHAK.customerDiscount.threshold ? 1 - MISHAK.customerDiscount.pct : 1);

export function mishak() {
  const r = valuatePeriod(MISHAK_2025, "fifo");
  // The policy takes last year's rate, rounded to a whole percent as the question says.
  const rate = Math.round(r.gpPct * 100) / 100;
  const buy2026 = purchaseCost(mishakBuy({ ...MISHAK.buy2026 }));
  const sales2026 = MISHAK.sells2026.reduce((s, x) => s + netSale(x.boxes, MISHAK.price2026), 0);
  const input = {
    opening: r.closingCarrying,
    purchases: buy2026.total,
    sales: sales2026,
    rates: [rate],
    saved: MISHAK.savedAtPrice,
    savedAtPrice: true,
    terms: { deductible: { kind: "fixed" as const, value: MISHAK.deductible }, cap: MISHAK.cap },
  };
  const fire = gpFire(input);
  return {
    boxPrices: MISHAK.buys.map(boxPrice),
    costs: MISHAK_2025.purchases.map(purchaseCost),
    year: r,
    rate,
    buy2026,
    sales2026,
    fire,
    steps: { y25: explainPeriod(MISHAK_2025, r), fire: explainGpFire(input, fire) },
  };
}
