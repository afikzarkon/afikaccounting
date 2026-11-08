/**
 * The leases course's solver (IFRS 16): pure functions behind every figure the
 * course shows. Amounts are unrounded; screens round them for display. Each
 * function is pinned against an independent calculation in ifrs16.test.ts.
 */

/** The present value of 1 a period for n periods, paid at each period's end. */
export const annuity = (r: number, n: number) => (r === 0 ? n : (1 - (1 + r) ** -n) / r);

/** Today's value of `pmt` at each period's end for n periods, and `fv` at the last one. */
export const pvEnd = (r: number, n: number, pmt: number, fv = 0) => pmt * annuity(r, n) + fv / (1 + r) ** n;

/** Today's value of `pmt` at each period's start for n periods (the first is due today), and `fv` at the end of the last one. */
export const pvStart = (r: number, n: number, pmt: number, fv = 0) => pmt * (1 + annuity(r, n - 1)) + fv / (1 + r) ** n;

/** The rate at which end-of-period payments and a final amount are worth `target` today. */
export function rateFor(target: number, n: number, pmt: number, fv = 0) {
  let lo = -0.5;
  let hi = 3;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (pvEnd(mid, n, pmt, fv) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** A contract's consideration split by relative standalone prices (paragraph 13). */
export function allocate(total: number, prices: number[]) {
  const sum = prices.reduce((a, b) => a + b, 0);
  return prices.map((p) => (total * p) / sum);
}

/**
 * The lease term (paragraph 18), in years: the period that can't be cancelled,
 * plus an option to extend if it is reasonably certain to be exercised, and the
 * years after a break option if it is reasonably certain not to be. A break the
 * lessee is expected to use ends the lease there, so a later extension is never reached.
 */
export function leaseTerm(a: { contractYears: number; cancelAfter?: number; certainNotToCancel?: boolean; extendYears?: number; certainToExtend?: boolean }) {
  const nonCancellable = a.cancelAfter ?? a.contractYears;
  const reachesEnd = a.cancelAfter === undefined || !!a.certainNotToCancel;
  const extra = reachesEnd && a.certainToExtend ? (a.extendYears ?? 0) : 0;
  return { nonCancellable, term: (reachesEnd ? a.contractYears : nonCancellable) + extra };
}

export type LesseeTerms = {
  /** The payment each year. */
  payment: number;
  years: number;
  rate: number;
  timing: "start" | "end";
  /** An amount due at the end of the last year: a purchase option's price, or what a residual guarantee is expected to cost (paragraph 27). */
  finalAmount?: number;
  /** Paid at or before commencement, other than the first payment (paragraph 24(b)). */
  prepaid?: number;
  /** Lease incentives received (paragraph 24(b)). */
  incentives?: number;
  /** The lessee's initial direct costs (paragraph 24(c)). */
  directCosts?: number;
  /** The estimated cost of dismantling or restoring (paragraph 24(d)). */
  restoration?: number;
  /** Years to depreciate over: the useful life when the lease ends in ownership, otherwise the earlier of useful life and lease end (paragraph 32). */
  depreciationYears?: number;
};

export type LesseeYear = {
  year: number;
  opening: number;
  /** Paid on 1.1, before the year's interest. */
  paidAtStart: number;
  interest: number;
  /** Paid on 31.12, after the year's interest. */
  paidAtEnd: number;
  closing: number;
  /** The balance left once what falls due within twelve months is paid. */
  nonCurrent: number;
  current: number;
  depreciation: number;
  rightOfUse: number;
};

/** A lessee's lease, from commencement: the liability (before any payment made that day), the asset's cost, and a year-by-year table. */
export function lessee(t: LesseeTerms) {
  const final = t.finalAmount ?? 0;
  const liability = t.timing === "start" ? pvStart(t.rate, t.years, t.payment, final) : pvEnd(t.rate, t.years, t.payment, final);
  const cost = liability + (t.prepaid ?? 0) - (t.incentives ?? 0) + (t.directCosts ?? 0) + (t.restoration ?? 0);
  const depYears = t.depreciationYears ?? t.years;
  const depreciation = cost / depYears;

  const rows: LesseeYear[] = [];
  let open = liability;
  for (let y = 1; y <= t.years; y++) {
    const paidAtStart = t.timing === "start" ? t.payment : 0;
    const interest = (open - paidAtStart) * t.rate;
    const paidAtEnd = (t.timing === "end" ? t.payment : 0) + (y === t.years ? final : 0);
    const closing = open - paidAtStart + interest - paidAtEnd;
    rows.push({ year: y, opening: open, paidAtStart, interest, paidAtEnd, closing, nonCurrent: 0, current: 0, depreciation: y <= depYears ? depreciation : 0, rightOfUse: cost - depreciation * Math.min(y, depYears) });
    open = closing;
  }
  rows.forEach((r, i) => {
    const next = rows[i + 1];
    if (!next) return;
    // Paid on 31.12: what is left after next year's payment is next year's closing balance. Paid on 1.1: today's balance less the payment due tomorrow, unless nothing falls due after that next year.
    r.nonCurrent = t.timing === "end" ? next.closing : i + 2 < rows.length ? r.closing - t.payment : 0;
    r.current = r.closing - r.nonCurrent;
  });
  return { liability, cost, depYears, depreciation, rows };
}

/**
 * An index-linked lease, paid at each year's end, in the year the index moves.
 * The year's payment and all later ones follow the new index, at the same rate
 * (paragraphs 42(b), 43); an amount at the end, when it isn't linked, stays.
 * The change goes to the asset (paragraph 39).
 */
export function indexYear(a: { liability: number; rightOfUse: number; rate: number; basePayment: number; baseIndex: number; newIndex: number; yearsLeftAfter: number; finalAmount?: number }) {
  const final = a.finalAmount ?? 0;
  const interest = a.liability * a.rate;
  const paid = (a.basePayment * a.newIndex) / a.baseIndex;
  const before = a.liability + interest - paid;
  const closing = pvEnd(a.rate, a.yearsLeftAfter, paid, final);
  const remeasured = closing - before;
  const nonCurrent = a.yearsLeftAfter > 1 ? pvEnd(a.rate, a.yearsLeftAfter - 1, paid, final) : 0;
  return { interest, paid, before, closing, remeasured, rightOfUse: a.rightOfUse + remeasured, nonCurrent, current: closing - nonCurrent };
}

/**
 * A modification that decreases a lease's scope (paragraph 46), in two stages:
 * take out the part given up, with the difference to profit or loss, then
 * remeasure what is left at the new rate against the asset (paragraph 45).
 * `keptShareOfAsset` is the share of the asset left; `keptLiabilityOldTerms` is
 * the liability left on the old payments and the old rate.
 */
export function reduceScope(a: { rightOfUse: number; liability: number; keptShareOfAsset: number; keptLiabilityOldTerms: number; newLiability: number }) {
  const assetRemoved = a.rightOfUse * (1 - a.keptShareOfAsset);
  const liabilityRemoved = a.liability - a.keptLiabilityOldTerms;
  const gain = liabilityRemoved - assetRemoved;
  const remeasured = a.newLiability - a.keptLiabilityOldTerms;
  return { assetRemoved, liabilityRemoved, gain, remeasured, rightOfUse: a.rightOfUse - assetRemoved + remeasured, liability: a.newLiability };
}

/** A year of a lessor's finance lease: interest on the net investment, less the payment measured in it (paragraphs 70, 75). */
export function lessorYear(netInvestment: number, rate: number, measuredReceipt: number) {
  const income = netInvestment * rate;
  return { income, closing: netInvestment + income - measuredReceipt };
}

/**
 * A lessor who is a manufacturer or dealer, on commencement (paragraphs 71, 74):
 * sales at the lower of fair value and the present value of the lease payments
 * at a market rate; cost of sales less the present value of any unguaranteed
 * residual; the cost of obtaining the lease as an expense.
 */
export function dealerSale(a: { fairValue: number; cost: number; marketRate: number; years: number; payment: number; guaranteedResidual?: number; unguaranteedResidual?: number; obtainingCosts?: number }) {
  const unguaranteed = (a.unguaranteedResidual ?? 0) / (1 + a.marketRate) ** a.years;
  const leasePayments = pvEnd(a.marketRate, a.years, a.payment, a.guaranteedResidual ?? 0);
  const sales = Math.min(a.fairValue, leasePayments);
  const costOfSales = a.cost - unguaranteed;
  return { sales, costOfSales, grossProfit: sales - costOfSales, netInvestment: sales + unguaranteed, expense: a.obtainingCosts ?? 0 };
}
