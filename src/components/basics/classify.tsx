"use client";

import { CircleCheck, CircleX, Eye, RotateCcw } from "lucide-react";
import { type ReactNode, useState } from "react";
import { type Balances, trialBalance } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

/**
 * Sort each balance to debit or credit. Every click, right or wrong, says why
 * the account sits where it does; the solution waits until every row is right,
 * or until the learner asks for it.
 */
export function ClassifyExercise({ balances, explain, solution }: { balances: Balances; explain: Record<string, string>; solution: ReactNode }) {
  const tb = trialBalance(balances);
  const rows = Object.entries(balances).map(([account, v]) => ({ account, amount: Math.abs(v), side: v > 0 ? "dr" : "cr" }));
  const [picks, setPicks] = useState<Record<string, "dr" | "cr">>({});
  const [reveal, setReveal] = useState(false);
  const right = rows.filter((r) => picks[r.account] === r.side).length;
  const all = right === rows.length;
  const pickedDr = rows.filter((r) => picks[r.account] === "dr").reduce((s, r) => s + r.amount, 0);
  const pickedCr = rows.filter((r) => picks[r.account] === "cr").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-2/50 px-4 py-3">
          <p className="me-auto text-sm font-semibold text-fg">תרגיל: באיזה צד יושבת כל יתרה?</p>
          <span className="num rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-fg ring-1 ring-line" aria-live="polite">
            {right} / {rows.length} נכון
          </span>
          <button
            type="button"
            onClick={() => {
              setPicks({});
              setReveal(false);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
          >
            <RotateCcw className="h-3.5 w-3.5" /> איפוס
          </button>
        </div>
        <ul className="divide-y divide-line/70">
          {rows.map((r) => {
            const pick = picks[r.account];
            const ok = pick === r.side;
            return (
              <li key={r.account} className={cn("px-3 py-2.5 sm:px-4", pick && (ok ? "bg-success/[0.04]" : "bg-danger/[0.04]"))}>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-[15px] font-medium text-fg">{r.account}</span>
                  <Money v={r.amount} plain className="text-sm text-muted" />
                  <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`צד היתרה של ${r.account}`}>
                    {(["dr", "cr"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={pick === s}
                        onClick={() => setPicks((p) => ({ ...p, [r.account]: s }))}
                        className={cn(
                          "h-8 w-14 rounded-lg text-xs font-bold ring-1 transition-colors",
                          pick === s
                            ? ok
                              ? "bg-success text-surface ring-success"
                              : "bg-danger text-surface ring-danger"
                            : s === "dr"
                              ? "bg-surface text-debit ring-debit/40 hover:bg-debit/10"
                              : "bg-surface text-credit ring-credit/40 hover:bg-credit/10",
                        )}
                      >
                        {s === "dr" ? "חובה" : "זכות"}
                      </button>
                    ))}
                  </div>
                </div>
                {pick && (
                  <p className={cn("anim-step-in mt-1.5 flex items-start gap-1.5 text-[13.5px] leading-snug", ok ? "text-success" : "text-danger")}>
                    {ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
                    <span>
                      <strong>{ok ? "נכון. " : "לא בדיוק. "}</strong>
                      <span className="text-fg/85">{explain[r.account]}</span>
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <div className={cn("flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm", all ? "border-success/30 bg-success/[0.07]" : "border-line")}>
          <p className={cn("me-auto", all ? "font-semibold text-success" : "text-muted")}>
            {all ? (
              <>
                כל היתרות במקום: חובה <Money v={tb.dr} /> = זכות <Money v={tb.cr} />.
              </>
            ) : (
              <>
                עד עכשיו בחובה <Money v={pickedDr} plain /> · בזכות <Money v={pickedCr} plain />
              </>
            )}
          </p>
          {!all && !reveal && (
            <button type="button" onClick={() => setReveal(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
              <Eye className="h-3.5 w-3.5" /> הצג פתרון
            </button>
          )}
        </div>
      </div>
      {(all || reveal) && <div className="anim-step-in">{solution}</div>}
    </div>
  );
}
