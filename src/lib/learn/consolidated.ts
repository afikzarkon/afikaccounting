/**
 * The arithmetic of a group, for the consolidated statements course. Every
 * figure on the course's screens and in its practice comes from here, and a
 * test checks them against a separate calculation.
 */

/** Amounts are shown in whole shekels, and -0 becomes 0. */
export const whole = (v: number) => Math.round(v) + 0;

export type GroupInput = {
  /** The parent's assets, without its investment in the subsidiary. */
  parentAssets: number;
  parentLiabilities: number;
  subAssets: number;
  subLiabilities: number;
  /** The parent's share of the subsidiary, from 0 to 1. */
  holding: number;
  /** A loan inside the group: it is an asset of one company and a liability of the other. */
  internalLoan?: number;
};

/**
 * The consolidated statement of financial position, with nothing paid above
 * the subsidiary's net assets (goodwill comes in lesson 4): all of both
 * companies' assets and liabilities, and equity split between the owners of
 * the parent and the non-controlling interests.
 */
export function groupPosition(g: GroupInput) {
  const loan = g.internalLoan ?? 0;
  const assets = g.parentAssets + g.subAssets - loan;
  const liabilities = g.parentLiabilities + g.subLiabilities - loan;
  const subNet = g.subAssets - g.subLiabilities;
  const parentNet = g.parentAssets - g.parentLiabilities;
  const nci = whole(subNet * (1 - g.holding));
  const owners = whole(parentNet + subNet * g.holding);
  return { assets, liabilities, net: assets - liabilities, subNet, parentNet, owners, nci };
}

/** The year's consolidated profit: all of both companies', split by who owns what. The parent's profit here excludes what it earned from the subsidiary. */
export function profitSplit(p: { parentProfit: number; subProfit: number; holding: number }) {
  const nci = whole(p.subProfit * (1 - p.holding));
  return { total: p.parentProfit + p.subProfit, owners: whole(p.parentProfit + p.subProfit * p.holding), nci };
}

/** The investment in the parent's separate statements after one year, under the two methods that can be worked from the subsidiary's own figures. */
export function separateInvestment(s: { cost: number; holding: number; subProfit: number; subDividend: number }) {
  const dividendShare = whole(s.subDividend * s.holding);
  const profitShare = whole(s.subProfit * s.holding);
  return {
    dividendShare,
    profitShare,
    atCost: { balance: s.cost, income: dividendShare },
    atEquity: { balance: s.cost + profitShare - dividendShare, income: profitShare },
  };
}

/** Percentages are kept to four decimals, so a whole percent prints whole. */
const tidy = (v: number) => Math.round(v * 10_000) / 10_000;

/** At a meeting decided by a majority of those present: the investor's share of the votes in the room, whether it decides alone, and the attendance above which it no longer does. All in percent of all the votes. */
export function meetingShare(m: { holding: number; attendance: number }) {
  return { share: tidy((m.holding / m.attendance) * 100), decides: m.holding * 2 > m.attendance, lostAbove: m.holding * 2 };
}

/** How many of the largest other holders must join to outvote the investor. Null: all of them together can't. */
export function partnersToBeat(holding: number, others: number[]) {
  let total = 0;
  const sorted = [...others].sort((a, b) => b - a);
  for (let i = 0; i < sorted.length; i++) {
    total += sorted[i];
    if (total > holding) return i + 1;
  }
  return null;
}

/** The holding in percent after converting into new shares: the new shares join both the investor's count and the total. */
export const afterConversion = (c: { shares: number; total: number; newShares: number }) => tidy(((c.shares + c.newShares) / (c.total + c.newShares)) * 100);

/** What a fund's manager earns from it in a year: a fee on net assets, a share of the profit above a level, and its holding's share of what is left. The profit is before those two. */
export function managerReward(m: { nav: number; feeRate: number; profit: number; hurdle: number; perfRate: number; holding: number }) {
  const fee = whole(m.nav * m.feeRate);
  const performance = whole(Math.max(0, m.profit - m.hurdle) * m.perfRate);
  const left = m.profit - fee - performance;
  const fromHolding = whole(left * m.holding);
  const total = fee + performance + fromHolding;
  return { fee, performance, left, fromHolding, total, share: tidy((total / m.profit) * 100) };
}

/** The present value of equal payments at each year's end. */
export const pvAnnuity = (rate: number, years: number, payment: number) => (payment * (1 - (1 + rate) ** -years)) / rate;

/** The present value of a bond paying a coupon at each year's end and its face at the last. */
export const pvBond = (rate: number, years: number, coupon: number, face: number) => pvAnnuity(rate, years, coupon) + face * (1 + rate) ** -years;

export type ExcessRow = { name: string; at: number; end: number };

/**
 * The table of excess cost: each item's excess at the acquisition date and at
 * the year's end, in whole shekels, assets positive and liabilities negative.
 * Deferred tax is the tax rate on all of them, with the opposite sign.
 */
export function excessTable(rows: ExcessRow[], taxRate: number) {
  const items = rows.map((r) => ({ name: r.name, at: whole(r.at), amortized: whole(r.end) - whole(r.at), end: whole(r.end) }));
  const sum = (key: "at" | "amortized" | "end") => items.reduce((a, r) => a + r[key], 0);
  const taxAt = whole(-sum("at") * taxRate);
  const taxEnd = whole(-sum("end") * taxRate);
  const tax = { name: "מס נדחה", at: taxAt, amortized: taxEnd - taxAt, end: taxEnd };
  return { items, tax, total: { at: sum("at") + taxAt, amortized: sum("amortized") + taxEnd - taxAt, end: sum("end") + taxEnd } };
}

/**
 * Goodwill, or a gain on a bargain purchase when it comes out negative: the
 * cost of the combination less the identifiable net assets. Each group's
 * goodwill is what it put in less its share of those net assets. With no fair
 * value given, the minority is measured at its share, and its goodwill is nil.
 */
export function goodwillCalc(g: { paid: number; prior: number; holding: number; net: number; nciFair?: number }) {
  const nci = g.nciFair ?? whole(g.net * (1 - g.holding));
  const cost = g.paid + g.prior + nci;
  const ownersGoodwill = whole(g.paid + g.prior - g.net * g.holding);
  return { nci, cost, goodwill: cost - g.net, ownersGoodwill, nciGoodwill: cost - g.net - ownersGoodwill };
}

/** A subsidiary's profit as the group sees it: its own, less the year's amortization of excess cost net of the tax on it. `amortized` is negative when it lowers profit. */
export const adjustedProfit = (a: { profit: number; amortized: number; taxRate: number }) => whole(a.profit + a.amortized * (1 - a.taxRate));

/** A company's figures for the year, as its trial balance gives them, all positive. The reserve arose this year, so it is also the year's other comprehensive income. */
export type Books = {
  cash: number;
  inventory: number;
  ppe: number;
  investment: number;
  suppliers: number;
  deferredTax: number;
  capital: number;
  premium: number;
  reserve: number;
  retainedOpen: number;
  sales: number;
  cogs: number;
  admin: number;
  dividendIncome: number;
  tax: number;
  dividend: number;
};

/** An item of excess cost: the balance-sheet row it joins, and the expense its amortization joins. */
export type WorksheetExcess = { name: string; row: string; at: number; amortized: number; line: "cogs" | "admin" };

/** One row of a worksheet: each company, the adjustments on each one's account, and the consolidated amount. */
export type WsRow = { name: string; a: number; b: number; adjA: number; adjB: number; total: number };

const net = (k: Books) => k.cash + k.inventory + k.ppe + k.investment - k.suppliers - k.deferredTax;
const profitOf = (k: Books) => k.sales - k.cogs - k.admin + k.dividendIncome - k.tax;

/**
 * The consolidation worksheet for the year the parent bought the subsidiary,
 * on 1.1 for cash. Income and assets are positive, expenses and liabilities
 * negative, as on the lecturer's worksheet. What the parent earned from the
 * subsidiary, and what it capitalized into the investment, is adjusted on the
 * parent's account; the excess cost on the subsidiary's.
 */
export function consolidate(c: { a: Books; b: Books; holding: number; paid: number; nciFair?: number; costsInInvestment?: number; excess: WorksheetExcess[]; taxRate: number }) {
  const { a, b, holding } = c;
  const out = 1 - holding;
  const costs = c.costsInInvestment ?? 0;
  const table = excessTable(c.excess.map((e) => ({ name: e.name, at: e.at, end: e.at + e.amortized })), c.taxRate);
  // The subsidiary's reserve arose after the acquisition, so its equity then was its capital, premium and opening retained earnings.
  const subEquityAt = b.capital + b.premium + b.retainedOpen;
  const netAt = subEquityAt + table.total.at;
  const goodwill = goodwillCalc({ paid: c.paid, prior: 0, holding, net: netAt, nciFair: c.nciFair });
  const premium = c.nciFair === undefined ? 0 : whole(c.paid - (c.nciFair * holding) / out);

  const dividendOut = whole(b.dividend * holding);
  const adjA = { separate: profitOf(a), dividend: -dividendOut, costs: -costs };
  const adjB = { separate: profitOf(b), excess: table.total.amortized };
  const adjustedA = adjA.separate + adjA.dividend + adjA.costs;
  const adjustedB = adjB.separate + adjB.excess;
  const amort = (line: "cogs" | "admin") => c.excess.filter((e) => e.line === line).reduce((s, e) => s + whole(e.amortized), 0);
  const row = (name: string, va: number, vb: number, xa: number, xb: number): WsRow => ({ name, a: va, b: vb, adjA: xa, adjB: xb, total: va + vb + xa + xb });
  const income = [
    row("מכירות", a.sales, b.sales, 0, 0),
    row("עלות המכירות", -a.cogs, -b.cogs, 0, amort("cogs")),
    row("הוצאות הנהלה וכלליות", -a.admin, -b.admin, -costs, amort("admin")),
    row("הכנסות מדיבידנד", a.dividendIncome, b.dividendIncome, -dividendOut, 0),
    row("הוצאות מסים", -a.tax, -b.tax, 0, table.tax.amortized),
  ];
  const profit = row("רווח נקי", profitOf(a), profitOf(b), adjA.dividend + adjA.costs, adjB.excess);
  const oci = row("רווח כולל אחר: הערכה מחדש", a.reserve, b.reserve, 0, 0);
  const comprehensive = row("סך הרווח הכולל", profit.a + oci.a, profit.b + oci.b, profit.adjA, profit.adjB);

  const nciProfit = whole(adjustedB * out);
  const nciComprehensive = whole((adjustedB + b.reserve) * out);
  const split = {
    profit: { total: profit.total, nci: nciProfit, owners: profit.total - nciProfit },
    comprehensive: { total: comprehensive.total, nci: nciComprehensive, owners: comprehensive.total - nciComprehensive },
  };

  // The statement of financial position: each excess item's balance joins its row, or opens one.
  const excessEnd = (r: string) => c.excess.filter((e) => e.row === r).reduce((s, e) => s + whole(e.at + e.amortized), 0);
  const pos = (name: string, va: number, vb: number, adj: number) => ({ name, a: va, b: vb, adj, total: va + vb + adj });
  const extraRows = [...new Set(c.excess.map((e) => e.row))].filter((r) => !["מלאי", "רכוש קבוע"].includes(r));
  const position = [
    pos("מזומנים", a.cash, b.cash, 0),
    pos("מלאי", a.inventory, b.inventory, excessEnd("מלאי")),
    pos("רכוש קבוע", a.ppe, b.ppe, excessEnd("רכוש קבוע")),
    ...extraRows.map((r) => pos(r, 0, 0, excessEnd(r))),
    pos("השקעה בחברה בת", a.investment, 0, -a.investment),
    pos("מוניטין", 0, 0, goodwill.goodwill),
    pos("ספקים", -a.suppliers, -b.suppliers, 0),
    pos("מסים נדחים", -a.deferredTax, -b.deferredTax, table.tax.end),
  ];
  const assets = position.filter((r) => r.total > 0).reduce((s, r) => s + r.total, 0);
  const liabilities = -position.filter((r) => r.total < 0).reduce((s, r) => s + r.total, 0);

  // Splitting equity: each company's net assets as the group sees them, by holding, and each group's goodwill.
  const netA = net(a) - a.investment;
  const netB = net(b) + table.total.end;
  const ownersEquity = whole(netA + netB * holding + goodwill.ownersGoodwill);
  const nciEquity = whole(netB * out + goodwill.nciGoodwill);
  const reserve = whole(a.reserve + b.reserve * holding);
  const retained = ownersEquity - a.capital - a.premium - reserve;

  const line = (capital: number, prem: number, res: number, ret: number, nci: number) => ({ capital, premium: prem, reserve: res, retained: ret, owners: capital + prem + res + ret, nci, total: capital + prem + res + ret + nci });
  const open = line(a.capital, a.premium, 0, a.retainedOpen, 0);
  const acquisition = line(0, 0, 0, 0, goodwill.nci);
  const dividends = line(0, 0, 0, -a.dividend, -whole(b.dividend * out));
  const compLine = line(0, 0, reserve, split.profit.owners, split.comprehensive.nci);
  const close = line(a.capital, a.premium, reserve, a.retainedOpen - a.dividend + split.profit.owners, open.nci + acquisition.nci + dividends.nci + compLine.nci);

  return {
    table,
    netAt,
    subEquityAt,
    goodwill,
    premium,
    dividendOut,
    adjusted: { a: { ...adjA, total: adjustedA }, b: { ...adjB, total: adjustedB } },
    income,
    profit,
    oci,
    comprehensive,
    split,
    position,
    assets,
    liabilities,
    equity: { netA, netB, owners: ownersEquity, nci: nciEquity, total: ownersEquity + nciEquity, capital: a.capital, premium: a.premium, reserve, retained },
    changes: { open, acquisition, dividends, comprehensive: compLine, close },
  };
}

/**
 * A revaluation under IAS 16, paragraphs 39 and 40, in gross amounts: a rise
 * first reverses a loss that went through profit or loss, and the rest goes to
 * other comprehensive income; a fall first uses the asset's surplus, and the
 * rest is a loss. The subsidiary and the group can split the same movement
 * differently, because each has its own cost, surplus and past losses.
 */
export function revalue(r: { carrying: number; fairValue: number; surplus: number; priorLoss: number }) {
  const d = r.fairValue - r.carrying;
  if (d >= 0) {
    const pl = Math.min(r.priorLoss, d);
    return { pl, oci: d - pl };
  }
  const oci = -Math.min(r.surplus, -d);
  return { pl: d - oci + 0, oci: oci + 0 };
}

/**
 * A debt instrument at amortized cost, year by year: interest at the effective
 * rate, rounded to a whole shekel, less the coupon. The last year's interest
 * closes the balance on the face, so rounding never leaves a remainder.
 */
export function amortizedCost(a: { start: number; rate: number; coupon: number; years: number; face: number }) {
  const rows: { open: number; interest: number; close: number }[] = [];
  let c = a.start;
  for (let y = 0; y < a.years; y++) {
    const interest = y === a.years - 1 ? a.face + a.coupon - c : whole(c * a.rate);
    rows.push({ open: c, interest, close: c + interest - a.coupon });
    c += interest - a.coupon;
  }
  return rows;
}

/**
 * An asset the subsidiary held before the acquisition, tested for impairment
 * at each year's end. Each side shows the lower of its amortized cost without
 * impairments and the recoverable amount, so a reversal never goes above that
 * cost. The excess cost is the difference; its first entry is the acquisition date.
 */
export function impairmentViews(a: { subBook: number; groupCost: number; years: number; recoverable: number[] }) {
  const subDep = a.subBook / a.years;
  const groupDep = a.groupCost / a.years;
  const rows = a.recoverable.map((rec, i) => {
    const subAc = whole(a.subBook - subDep * (i + 1));
    const groupAc = whole(a.groupCost - groupDep * (i + 1));
    const sub = Math.min(subAc, rec);
    const group = Math.min(groupAc, rec);
    return { subAc, groupAc, recoverable: rec, sub, group, excess: group - sub };
  });
  return { excessAt: a.groupCost - a.subBook, rows };
}

/** The group's deferred tax asset on the subsidiary's carried-forward loss, by the lecturer's rule: the higher of the liability on the excess cost and the asset the subsidiary's own forecast supports. */
export const groupDeferredTaxAsset = (d: { liabilityOnExcess: number; subAsset: number }) => Math.max(d.liabilityOnExcess, d.subAsset);

/**
 * The subsidiary's profit split when it has preference shares classified as
 * equity: the preference shares take this year's accrual if cumulative, or the
 * dividend declared on them if not; the ordinary shares take the rest. Each
 * part is split by the parent's holding in that instrument.
 */
export function preferenceSplit(p: { profit: number; toPreference: number; holdingOrdinary: number; holdingPreference: number }) {
  const ordinary = p.profit - p.toPreference;
  const nci = whole(p.toPreference * (1 - p.holdingPreference) + ordinary * (1 - p.holdingOrdinary));
  return { preference: p.toPreference, ordinary, nci, owners: p.profit - nci };
}

/** Profit inside the group that has not reached an outside buyer yet: it comes off the asset in full, with a deferred tax asset on it, and the net is what the seller's profit loses. */
export function deferral(gross: number, taxRate: number) {
  const tax = whole(gross * taxRate);
  return { gross, tax, net: gross - tax };
}

/**
 * Inventory sold inside the group: the profit in it, the part still in the
 * buyer's stock at the year's end, and the deferral on that part. The minority
 * bears its share only when the subsidiary sold (Up); a parent's sale (Down) is
 * borne by the parent alone.
 */
export function inventoryDeferral(a: { price: number; margin: number; leftShare: number; taxRate: number; up: boolean; nciShare: number }) {
  const profit = whole(a.price * a.margin);
  const d = deferral(whole(profit * a.leftShare), a.taxRate);
  const nci = a.up ? whole(d.net * a.nciShare) : 0;
  return { profit, cost: a.price - profit, ...d, nci, owners: d.net - nci };
}

/** Inventory the buyer wrote down to its net realisable value: each side holds the lower of its own cost and that value, and the adjustment is the gap. */
export function writeDownView(a: { groupCost: number; price: number; nrv: number }) {
  const buyer = Math.min(a.price, a.nrv);
  const group = Math.min(a.groupCost, a.nrv);
  return { buyer, group, adjust: group - buyer, buyerWriteDown: a.price - buyer };
}

/**
 * A depreciable asset sold inside the group, depreciated by the buyer straight
 * line over its own life; the group uses that same life and method on its own
 * cost. Rows run from the sale to each year's end; the unrealized profit is the gap.
 */
export function assetTransfer(a: { groupCost: number; price: number; years: number; through: number }) {
  const gDep = a.groupCost / a.years;
  const bDep = a.price / a.years;
  return Array.from({ length: a.through + 1 }, (_, k) => {
    const group = whole(a.groupCost - gDep * k);
    const buyer = whole(a.price - bDep * k);
    return { group, buyer, unrealized: buyer - group, depDiff: k === 0 ? 0 : whole(bDep - gDep) };
  });
}
