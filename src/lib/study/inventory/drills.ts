/**
 * The first drill after each method's explanation: a small year the reader
 * solves by building the table themselves. Every answer is computed here, and
 * the course's test checks each one against the engine.
 */

/** FIFO, periodic: three purchases, one total sold. */
export const FIFO_DRILL = {
  buys: [
    { date: "1.2", qty: 50, price: 4 },
    { date: "1.5", qty: 30, price: 5 },
    { date: "1.9", qty: 20, price: 6 },
  ],
  sold: 70,
};
const fifoUnits = FIFO_DRILL.buys.reduce((s, b) => s + b.qty, 0);
const fifoCost = FIFO_DRILL.buys.reduce((s, b) => s + b.qty * b.price, 0);
const fifoLeft = fifoUnits - FIFO_DRILL.sold;
// What is left is the last purchases: all of the last one, and the rest from the one before.
const lastQty = FIFO_DRILL.buys[2].qty;
export const FIFO_DRILL_ANSWERS = {
  units: fifoUnits,
  cost: fifoCost,
  left: fifoLeft,
  fromLast: lastQty * FIFO_DRILL.buys[2].price,
  fromBefore: (fifoLeft - lastQty) * FIFO_DRILL.buys[1].price,
  closing: lastQty * FIFO_DRILL.buys[2].price + (fifoLeft - lastQty) * FIFO_DRILL.buys[1].price,
};
export const FIFO_DRILL_COGS = fifoCost - FIFO_DRILL_ANSWERS.closing;

/** FIFO, perpetual: buy, sell, buy, sell — each sale from the oldest layer. */
export const SHELF_DRILL = { buy1: { qty: 50, price: 4 }, sell1: 30, buy2: { qty: 40, price: 5 }, sell2: 40 };
const s = SHELF_DRILL;
export const SHELF_DRILL_ANSWERS = {
  sale1: s.sell1 * s.buy1.price,
  // The second sale takes what is left of the first layer, then the rest from the second.
  sale2: (s.buy1.qty - s.sell1) * s.buy1.price + (s.sell2 - (s.buy1.qty - s.sell1)) * s.buy2.price,
  closing: (s.buy1.qty + s.buy2.qty - s.sell1 - s.sell2) * s.buy2.price,
};
export const SHELF_DRILL_COGS = SHELF_DRILL_ANSWERS.sale1 + SHELF_DRILL_ANSWERS.sale2;

/** The periodic weighted average: an opening balance, two purchases, one total sold. */
export const WA_DRILL = { opening: { qty: 20, cost: 200 }, buys: [{ qty: 30, price: 12 }, { qty: 50, price: 13 }], sold: 60 };
const waUnits = WA_DRILL.opening.qty + WA_DRILL.buys.reduce((t, b) => t + b.qty, 0);
const waCost = WA_DRILL.opening.cost + WA_DRILL.buys.reduce((t, b) => t + b.qty * b.price, 0);
const waAvg = waCost / waUnits;
export const WA_DRILL_ANSWERS = {
  buyCosts: WA_DRILL.buys.map((b) => b.qty * b.price),
  units: waUnits,
  cost: waCost,
  avg: waAvg,
  left: waUnits - WA_DRILL.sold,
  closing: (waUnits - WA_DRILL.sold) * waAvg,
  cogs: WA_DRILL.sold * waAvg,
};

/** The moving average: one stock card, a new average after each purchase. */
export const MA_DRILL = { buy1: { qty: 100, price: 10 }, sell1: 40, buy2: { qty: 60, price: 13 }, sell2: 50 };
const m = MA_DRILL;
const units1 = m.buy1.qty;
const cost1 = m.buy1.qty * m.buy1.price;
const avg1 = cost1 / units1;
const units2 = units1 - m.sell1;
const cost2 = cost1 - m.sell1 * avg1;
const units3 = units2 + m.buy2.qty;
const cost3 = cost2 + m.buy2.qty * m.buy2.price;
const avg3 = cost3 / units3;
const units4 = units3 - m.sell2;
const cost4 = cost3 - m.sell2 * avg3;
export const MA_DRILL_ANSWERS = {
  rows: [
    { units: units1, cost: cost1, avg: avg1 },
    { sale: m.sell1 * avg1, units: units2, cost: cost2, avg: avg1 },
    { units: units3, cost: cost3, avg: avg3 },
    { sale: m.sell2 * avg3, units: units4, cost: cost4, avg: avg3 },
  ],
  avg1,
  avg3,
  cogs: m.sell1 * avg1 + m.sell2 * avg3,
  closing: cost4,
};
