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
