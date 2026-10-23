import type { EntryLine } from "@/components/study/blocks";
import type { ExchangeInputs, ExchangeResult } from "@/lib/learn/exchange";

// The worked example the whole page follows, and the calculator's defaults.
export const EXAMPLE: ExchangeInputs = {
  oldCost: 500_000,
  oldSalvage: 0,
  oldLife: 10,
  accumulatedOpening: 150_000,
  month: 4,
  commercial: true,
  basis: "given",
  fairValueGiven: 360_000,
  fairValueReceived: 390_000,
  cashPaid: 40_000,
  cashReceived: 0,
  newLife: 5,
  newSalvage: 40_000,
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/** The exchange entry: in full (cost and accumulated depreciation closed separately) or net (the carrying amount at once). */
export function exchangeLines(x: ExchangeInputs, r: ExchangeResult, mode: "full" | "net"): EntryLine[] {
  const lines: EntryLine[] = [{ account: "נכס חדש — עלות", dr: r2(r.newCost) }];
  if (mode === "full") lines.push({ account: "פחת נצבר — נכס ישן", dr: r2(r.accumulated) });
  if (x.cashReceived > 0) lines.push({ account: "מזומן (התקבל)", dr: r2(x.cashReceived) });
  if (r.gain < -0.005) lines.push({ account: "הפסד מהחלפת נכסים", dr: r2(-r.gain) });
  if (x.cashPaid > 0) lines.push({ account: "מזומן (שולם)", cr: r2(x.cashPaid) });
  if (r.gain > 0.005) lines.push({ account: "רווח מהחלפת נכסים", cr: r2(r.gain) });
  lines.push(mode === "full" ? { account: "נכס ישן — עלות מקורית", cr: r2(x.oldCost) } : { account: "נכס ישן — יתרה בספרים", cr: r2(r.bookValue) });
  return lines;
}

/** The old asset's depreciation from the start of the year up to the exchange. */
export const catchUpLines = (r: ExchangeResult): EntryLine[] => [
  { account: "הוצאות פחת — נכס ישן", dr: r2(r.depToDate) },
  { account: "פחת נצבר — נכס ישן", cr: r2(r.depToDate) },
];

/** The new asset's depreciation from the exchange to 31.12. */
export const yearEndLines = (r: ExchangeResult): EntryLine[] => [
  { account: "הוצאות פחת — נכס חדש", dr: r2(r.newDep) },
  { account: "פחת נצבר — נכס חדש", cr: r2(r.newDep) },
];
