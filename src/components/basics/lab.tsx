import { balancesOf, type Entry, isBalanceSheet, KITS, ledger, round2, type Statements, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Posted } from "./t-accounts";
import { BalanceSheetT, Money, type Step, Stepper } from "./ui";

// The business's entries as they happen; closing inventory is lesson 4's.
const STEPS = KITS.entries;

/** What kind of entry this is: does it only move balance-sheet accounts, or does it reach profit or loss? */
function entryKind(entry: Entry) {
  const sheet = entry.lines.filter((l) => isBalanceSheet(l.account)).length;
  if (sheet === entry.lines.length) return { label: "מאזני מול מאזני", hint: "משנה רק את המאזן" };
  if (sheet === 0) return { label: "תוצאתי מול תוצאתי", hint: "משנה רק את רווח והפסד" };
  return { label: "מאזני מול תוצאתי", hint: "משנה את המאזן וגם את הרווח" };
}

/** The equation after a step, each part with how much it moved. */
function Identity({ s, prev }: { s: Statements; prev: Statements }) {
  const part = (name: string, v: number, was: number) => {
    const d = round2(v - was);
    return (
      <span className="min-w-0 flex-1 rounded-xl bg-surface px-2 py-2 text-center ring-1 ring-line">
        <span className="block text-[11px] font-semibold text-muted">{name}</span>
        <Money v={v} plain className="block text-[15px] font-bold text-fg" />
        <span className={cn("block h-4 text-[11px] font-semibold", d > 0 ? "text-success" : "text-danger")}>
          {d !== 0 && (
            <>
              {d > 0 ? "▲" : "▼"} <Money v={Math.abs(d)} plain />
            </>
          )}
        </span>
      </span>
    );
  };
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2/70 p-2" aria-label="הזהות החשבונאית אחרי הפעולה">
      {part("נכסים", s.totalAssets, prev.totalAssets)}
      <span className="font-bold text-muted" aria-hidden>
        =
      </span>
      {part("התחייבויות", s.totalLiabilities, prev.totalLiabilities)}
      <span className="font-bold text-muted" aria-hidden>
        +
      </span>
      {part("הון", s.totalEquity, prev.totalEquity)}
    </div>
  );
}

export function TransactionLab() {
  const steps: Step[] = STEPS.map((entry, i) => {
    const s = statements(balancesOf(ledger(STEPS.slice(0, i + 1))));
    const prev = statements(balancesOf(ledger(STEPS.slice(0, i))));
    const kind = entryKind(entry);
    return {
      title: entry.text,
      body: (
        <>
          <p className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-fg px-2 py-0.5 font-bold text-surface">{kind.label}</span>
            <span className="text-muted">{kind.hint}</span>
          </p>
          <Posted inline entries={STEPS} at={i} title="פקודת היומן" />
          <Identity s={s} prev={prev} />
          <details className="group rounded-xl border border-line">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
              <span className="me-1 inline-block transition-transform group-open:-rotate-90">‹</span> המאזן המלא אחרי הפעולה
            </summary>
            <div className="px-2 pb-2">
              <BalanceSheetT s={s} prev={prev} title={`המאזן אחרי פעולה ${entry.id}`} />
            </div>
          </details>
        </>
      ),
    };
  });
  return <Stepper label="עסק לערכות מדע · 2023" steps={steps} />;
}
