import { CircleCheck, TriangleAlert } from "lucide-react";
import { balancesOf, type Entry, isBalanceSheet, KITS, ledger, round2, type Statements, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Posted } from "./t-accounts";
import { BalanceSheetT, Money, type Step, Stepper } from "./ui";

const STEPS = [...KITS.entries, KITS.closing];
const FINAL_BEFORE = statements(balancesOf(ledger(KITS.entries)));
const FINAL_AFTER = statements(balancesOf(ledger(STEPS)));
const FINAL_BALANCES = balancesOf(ledger(STEPS));
const INVESTED = KITS.entries[0].lines[0].dr!;
const WITHDRAWN = KITS.entries.find((x) => x.lines[0].account === "הון בעלים")!.lines[0].dr!;
const CLOSING = KITS.closing.lines[0].dr!;

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
    const closing = i === STEPS.length - 1;
    const kind = entryKind(entry);
    return {
      title: closing ? `סוף השנה: ${entry.text}` : entry.text,
      body: (
        <>
          <p className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-fg px-2 py-0.5 font-bold text-surface">{kind.label}</span>
            <span className="text-muted">{kind.hint}</span>
          </p>
          <Posted
            entries={STEPS}
            at={i}
            title={closing ? "פקודת מלאי הסגירה" : "פקודת היומן"}
            note={closing ? `${KITS.closingUnits.toLocaleString("he-IL")} ערכות × ${KITS.unitCost} ₪ חוזרות מההוצאות לנכסים.` : undefined}
          />
          <Identity s={s} prev={prev} />
          {i === KITS.entries.length - 1 && (
            <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/[0.05] px-3 py-2.5 text-[15px]">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
              <span>
                בלי ספירת מלאי העסק נראה <strong>מפסיד <Money v={-FINAL_BEFORE.profit} /></strong>. אבל רוב הערכות עדיין במחסן — הצעד הבא מתקן את זה.
              </span>
            </p>
          )}
          {closing && (
            <div className="space-y-2 rounded-xl border border-success/40 bg-success/[0.06] px-3 py-2.5 text-[15px]">
              <p className="flex items-center gap-2 font-semibold text-success">
                <CircleCheck className="h-4 w-4" aria-hidden /> הרווח האמיתי: <Money v={FINAL_AFTER.profit} />
              </p>
              <p className="text-sm text-fg/90">
                נכסים: מזומן <Money v={FINAL_BALANCES["מזומן"]} /> + מלאי <Money v={CLOSING} /> + לפטופ <Money v={FINAL_BALANCES["לפטופ"]} /> ={" "}
                <Money v={FINAL_AFTER.totalAssets} />. הון: <Money v={INVESTED} /> − משיכה <Money v={WITHDRAWN} /> + רווח <Money v={FINAL_AFTER.profit} /> ={" "}
                <Money v={FINAL_AFTER.totalEquity} />.
              </p>
            </div>
          )}
          <details className="group rounded-xl border border-line">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
              <span className="me-1 inline-block transition-transform group-open:-rotate-90">‹</span> המאזן המלא אחרי הפעולה
            </summary>
            <div className="px-2 pb-2">
              <BalanceSheetT s={s} prev={prev} title={closing ? "המאזן בסוף השנה" : `המאזן אחרי פעולה ${entry.id}`} />
            </div>
          </details>
        </>
      ),
    };
  });
  return <Stepper label="עסק לערכות מדע · 2023" steps={steps} />;
}
