/**
 * Accumulating paid absences, solved the way the course's guide solves them,
 * in six steps: classify, count only the extra cost, the opening provision by
 * expectation, the payments by what happened, the closing provision after use
 * and lapse, and the movement table, where the expense is the missing line.
 *
 * Use is LIFO: this year's entitlement first, then the carried days, newest
 * first. Carried days last `years` years and then lapse.
 */

/** Non-vesting (A): a leaver loses his balance. Vesting (B): a leaver is paid for it. */
export type AbsenceMode = "A" | "B";

/** A group of employees, by what they are expected to use (opening) or did use (actual). */
export type AbsenceGroup = {
  name: string;
  staff: number;
  /** Days of absence a year, per employee. */
  use: number;
  /** Leaves during the year: at its start (use 0) or at its end, after using `use`. */
  leaves: boolean;
  /**
   * Actual groups only: what the stayers among them are expected to use next
   * year, split into sub-groups. Without it, they are expected to use the most
   * they can, so every day they carry costs money.
   */
  next?: { name: string; staff: number; use: number }[];
};

export type AbsenceCase = {
  dayCost: number;
  /** This year's days, per employee. */
  entitlement: number;
  /** The balance per employee at the start of the year, newest first: carried from last year, from two years ago, … */
  carried: number[];
  /** How many years carried days last before they lapse. */
  years: number;
  opening: AbsenceGroup[];
  actual: AbsenceGroup[];
};

/** Days carried per employee that are still alive this year. */
const alive = (c: AbsenceCase) => c.carried.slice(0, c.years).reduce((s, d) => s + d, 0);

/** Carried days a stayer will take out of his balance: what goes beyond the new entitlement, up to the balance. */
export const fromBalance = (balance: number, use: number, entitlement: number) => Math.min(balance, Math.max(0, use - entitlement));

export function solveAbsence(c: AbsenceCase, mode: AbsenceMode) {
  const vest = mode === "B";
  const balance = alive(c);

  // Step 3: the opening provision, by expectation.
  const opening = c.opening.map((g) => {
    const extra = fromBalance(balance, g.use, c.entitlement);
    const perHead = g.leaves && vest ? balance : extra;
    return { ...g, balance, extra, perHead, days: g.staff * perHead };
  });

  // Step 4: the payments, by what happened.
  const actual = c.actual.map((g) => {
    const over = Math.max(0, g.use - c.entitlement);
    // LIFO across the carried layers: the newest carried days go first.
    let left = over;
    const usedByLayer = c.carried.map((d, k) => {
      if (k >= c.years) return 0;
      const u = Math.min(d, left);
      left -= u;
      return u;
    });
    const fromCarried = usedByLayer.reduce((s, d) => s + d, 0);
    const remaining = balance - fromCarried;
    const payout = g.leaves && vest ? remaining : 0;
    const paidPerHead = g.use + payout;
    // What a stayer carries into next year: the unused part of this year, and the carried layers that still have years to live.
    const ownLeft = g.leaves ? 0 : Math.max(0, c.entitlement - g.use);
    const oldLeft = g.leaves ? 0 : c.carried.reduce((s, d, k) => s + (k + 1 < c.years ? d - usedByLayer[k] : 0), 0);
    const lapsed = g.leaves ? remaining - payout : remaining - oldLeft;
    return { ...g, fromCarried, remaining, payout, paidPerHead, paidDays: g.staff * paidPerHead, ownLeft, oldLeft, carryOut: ownLeft + oldLeft, lapsed };
  });

  // Step 5: the closing provision — the stayers only, after use and lapse.
  const closing = actual
    .filter((g) => !g.leaves)
    .flatMap((g) =>
      (g.next ?? [{ name: g.name, staff: g.staff, use: Infinity }]).map((n) => {
        const perHead = n.use === Infinity ? g.carryOut : fromBalance(g.carryOut, n.use, c.entitlement);
        return { name: n.name, from: g.name, staff: n.staff, carryOut: g.carryOut, ownLeft: g.ownLeft, oldLeft: g.oldLeft, nextUse: n.use === Infinity ? null : n.use, perHead, days: n.staff * perHead };
      }),
    );

  const openingDays = opening.reduce((s, g) => s + g.days, 0);
  const paidDays = actual.reduce((s, g) => s + g.paidDays, 0);
  const closingDays = closing.reduce((s, g) => s + g.days, 0);
  const openingAmount = openingDays * c.dayCost;
  const paid = paidDays * c.dayCost;
  const closingAmount = closingDays * c.dayCost;
  // Step 6: the expense completes the movement table.
  const expense = closingAmount - openingAmount + paid;
  return { mode, balance, opening, actual, closing, openingDays, paidDays, closingDays, opening$: openingAmount, paid, closing$: closingAmount, expense };
}

export type AbsenceSolution = ReturnType<typeof solveAbsence>;

/** Employees in a set of groups: every table must add up to the whole staff. */
export const headcount = (groups: { staff: number }[]) => groups.reduce((s, g) => s + g.staff, 0);
