"use client";

import { CircleCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { balancesOf, identityHolds, KITS, ledger, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { BalanceSheetT, EntryView, Money } from "./ui";

const STEPS = [...KITS.entries, KITS.closing];

/** Snapshot of the equation after the first `n` entries. */
function snapshot(n: number) {
  const b = balancesOf(ledger(STEPS.slice(0, n)));
  const s = statements(b);
  return { s, profit: s.profit, ok: identityHolds(s) };
}

export function EquationWidget() {
  const [n, setN] = useState(0);
  const now = snapshot(n);
  const prev = n > 0 ? snapshot(n - 1) : null;
  const entry = n > 0 ? STEPS[n - 1] : null;

  return (
    <div className="card overflow-hidden" role="group" aria-label="המשוואה החשבונאית — צעד אחר צעד">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-sm font-semibold text-fg">בחרו עד איזו פעולה לרשום:</p>
        <div className="flex flex-wrap gap-1" role="group" aria-label="פעולות">
          {STEPS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setN(i + 1)}
              aria-pressed={n === i + 1}
              aria-label={`פעולה ${e.id}: ${e.text}`}
              className={cn(
                "num h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-colors",
                n === i + 1 ? "bg-accent text-accent-fg" : i < n ? "bg-accent-soft text-accent" : "bg-surface text-muted ring-1 ring-line hover:text-fg",
              )}
            >
              {e.id}
            </button>
          ))}
          <button type="button" onClick={() => setN(0)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg">
            <RotateCcw className="h-3.5 w-3.5" /> מההתחלה
          </button>
        </div>
      </div>

      <div className="p-4" aria-live="polite">
        <p className="min-h-12 text-[15px] text-fg">
          {entry ? (
            <>
              <strong>{entry.text}.</strong> <span className="text-muted">{entry.why}</span>
            </>
          ) : (
            <span className="text-muted">עוד לא נרשם דבר: אין נכסים, אין התחייבויות ואין הון. 0 = 0 + 0.</span>
          )}
        </p>

        {entry && <EntryView entry={entry} title={`פקודת יומן ${entry.id}`} note={null} />}
        <BalanceSheetT
          s={now.s}
          prev={prev?.s}
          title={entry ? `המאזן אחרי פעולה ${entry.id}` : "המאזן — עוד ריק"}
          retainedLabel={now.profit >= 0 ? "רווח עד כה" : "הפסד עד כה"}
        />

        <p className={cn("mt-3 flex items-center gap-2 text-sm font-medium", now.ok ? "text-success" : "text-danger")}>
          <CircleCheck className="h-4 w-4" />
          <Money v={now.s.totalAssets} /> = <Money v={now.s.totalLiabilities} /> + <Money v={now.s.totalEquity} /> — המשוואה מאוזנת.
        </p>
        {n === STEPS.length - 1 && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-fg">
            שימו לב: ההון ירד מתחת להשקעה, כאילו העסק הפסיד — כי כל הקנייה נרשמה כהוצאה. הצעד האחרון (מלאי הסגירה) מתקן את זה.
          </p>
        )}
      </div>
    </div>
  );
}
