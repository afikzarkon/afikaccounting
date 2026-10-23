"use client";

import { CircleCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { balancesOf, identityHolds, KITS, ledger, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

const STEPS = [...KITS.entries, KITS.closing];

/** Snapshot of the equation after the first `n` entries. */
function snapshot(n: number) {
  const b = balancesOf(ledger(STEPS.slice(0, n)));
  const s = statements(b);
  const capital = -(b["הון בעלים"] ?? 0);
  return { s, capital, profit: s.profit, ok: identityHolds(s) };
}

export function EquationWidget() {
  const [n, setN] = useState(0);
  const now = snapshot(n);
  const prev = n > 0 ? snapshot(n - 1) : null;
  const entry = n > 0 ? STEPS[n - 1] : null;
  const delta = (a: number, b?: number) => (b === undefined ? 0 : a - b);

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

        <div className="mt-3 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Box title="נכסים" value={now.s.totalAssets} change={delta(now.s.totalAssets, prev?.s.totalAssets)} rows={now.s.assets} />
          <Sign>=</Sign>
          <Box title="התחייבויות" value={now.s.totalLiabilities} change={delta(now.s.totalLiabilities, prev?.s.totalLiabilities)} rows={now.s.liabilities} />
          <Sign>+</Sign>
          <Box
            title="הון"
            value={now.s.totalEquity}
            change={delta(now.s.totalEquity, prev?.s.totalEquity)}
            rows={[
              ["הון בעלים", now.capital],
              [now.profit >= 0 ? "רווח עד כה" : "הפסד עד כה", now.profit],
            ]}
          />
        </div>

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

function Box({ title, value, change, rows }: { title: string; value: number; change: number; rows: [string, number][] }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="text-xs font-semibold text-muted">{title}</p>
      <p className="mt-0.5 text-xl font-semibold text-fg">
        <Money v={value} />
      </p>
      <p className={cn("h-5 text-xs font-medium", change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-subtle")}>
        {change !== 0 && (
          <>
            {change > 0 ? "▲ " : "▼ "}
            <Money v={Math.abs(change)} />
          </>
        )}
      </p>
      <ul className="mt-1 space-y-0.5 border-t border-line pt-1 text-xs text-muted">
        {rows.length === 0 && <li>—</li>}
        {rows.map(([a, v]) => (
          <li key={a} className="flex justify-between gap-2">
            <span className="truncate">{a}</span>
            <Money v={v} plain />
          </li>
        ))}
      </ul>
    </div>
  );
}

const Sign = ({ children }: { children: string }) => (
  <span aria-hidden className="grid place-items-center text-2xl font-semibold text-muted">
    {children}
  </span>
);
