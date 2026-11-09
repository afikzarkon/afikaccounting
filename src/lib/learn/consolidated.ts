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
