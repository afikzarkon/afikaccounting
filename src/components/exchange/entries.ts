import type { EntryLine } from "@/components/study/blocks";
import type { ExchangeInputs, ExchangeResult } from "@/lib/learn/exchange";
import { MACHINE_EXCHANGE, MACHINE_EXCHANGE_DATE } from "@/lib/learn/ias16-example";

// The worked example the whole page follows, and the calculator's defaults: the chapter's central
// machine (see "how to solve a question"), exchanged on 1.4.2023.
export const EXAMPLE: ExchangeInputs = MACHINE_EXCHANGE;
export const EXCHANGE_YEAR = MACHINE_EXCHANGE_DATE.year;
export const EXCHANGE_DATE = MACHINE_EXCHANGE_DATE.label;
export const YEAR_END = `31.12.${EXCHANGE_YEAR}`;

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
