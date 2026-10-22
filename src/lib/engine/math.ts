import type { JournalEntry, JournalLine } from "./types";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Periodic rate equivalent to an effective annual rate. */
export const periodicRate = (annual: number, periodsPerYear: number) =>
  Math.pow(1 + annual, 1 / periodsPerYear) - 1;

export const presentValue = (amount: number, rate: number, periods: number) =>
  amount / Math.pow(1 + rate, periods);

/**
 * Build a journal entry from signed amounts: positive is a debit, negative a
 * credit. Zero lines are dropped and the entry is checked to balance, so a
 * calculator bug surfaces as an error instead of a silently wrong entry.
 */
export function entry(id: string, when: string, narrative: string, signed: [string, number][]): JournalEntry {
  const lines: JournalLine[] = signed
    .map(([account, amount]) => ({ account, amount: round2(amount) }))
    .filter((l) => l.amount !== 0)
    .map(({ account, amount }) => ({
      account,
      debit: amount > 0 ? amount : 0,
      credit: amount < 0 ? -amount : 0,
    }))
    // Debits first, as entries are conventionally written.
    .sort((a, b) => Number(b.debit > 0) - Number(a.debit > 0));

  const imbalance = round2(sum(lines.map((l) => l.debit - l.credit)));
  if (Math.abs(imbalance) > 0.011) {
    throw new Error(`Journal entry "${narrative}" does not balance (difference ${imbalance}).`);
  }
  // Absorb a residual cent of rounding into the largest credit line.
  if (imbalance !== 0) {
    const target = lines.filter((l) => l.credit > 0).sort((a, b) => b.credit - a.credit)[0];
    if (target) target.credit = round2(target.credit + imbalance);
  }
  return { id, when, narrative, lines };
}

/** Undiscounted maturity bands as required by IFRS 7.39 / IFRS 16.58. */
export function maturityBands(flowsByYear: number[]) {
  return {
    withinOne: round2(sum(flowsByYear.slice(0, 1))),
    oneToFive: round2(sum(flowsByYear.slice(1, 5))),
    afterFive: round2(sum(flowsByYear.slice(5))),
  };
}
