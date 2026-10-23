"use client";

import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { useState } from "react";
import { type Balances, trialBalance } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

/** Sort each balance to debit or credit; the totals appear once every row is right. */
export function ClassifyExercise({ balances }: { balances: Balances }) {
  const tb = trialBalance(balances);
  const rows = Object.entries(balances).map(([account, v]) => ({ account, amount: Math.abs(v), side: v > 0 ? "dr" : "cr" }));
  const [picks, setPicks] = useState<Record<string, "dr" | "cr">>({});
  const done = rows.filter((r) => picks[r.account]).length;
  const right = rows.filter((r) => picks[r.account] === r.side).length;
  const all = right === rows.length;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-sm font-semibold text-fg">תרגיל: שבצו כל יתרה בצד שלה</p>
        <span className="num text-sm text-muted" aria-live="polite">
          {right} / {rows.length} נכון
        </span>
        <button type="button" onClick={() => setPicks({})} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg">
          <RotateCcw className="h-3.5 w-3.5" /> איפוס
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-4 py-2 text-start font-medium">חשבון</th>
              <th className="px-4 py-2 text-end font-medium">יתרה</th>
              <th className="px-4 py-2 text-center font-medium">צד</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pick = picks[r.account];
              const ok = pick === r.side;
              return (
                <tr key={r.account} className="border-t border-line/70">
                  <td className="px-4 py-2 text-fg">{r.account}</td>
                  <td className="px-4 py-2 text-end">
                    <Money v={r.amount} plain />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center gap-1" role="radiogroup" aria-label={`צד היתרה של ${r.account}`}>
                      {(["dr", "cr"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={pick === s}
                          onClick={() => setPicks((p) => ({ ...p, [r.account]: s }))}
                          className={cn(
                            "h-8 w-16 rounded-lg text-xs font-semibold ring-1 transition-colors",
                            pick === s ? (ok ? "bg-success text-white ring-success" : "bg-danger text-white ring-danger") : "bg-surface text-muted ring-line hover:text-fg",
                          )}
                        >
                          {s === "dr" ? "חובה" : "זכות"}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {pick && (ok ? <CircleCheck className="h-4 w-4 text-success" aria-label="נכון" /> : <CircleX className="h-4 w-4 text-danger" aria-label="לא נכון" />)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={cn("border-t px-4 py-3 text-sm", all ? "border-success/30 bg-success/[0.07] font-medium text-success" : "border-line text-muted")}>
        {all ? (
          <>
            כל היתרות במקום. סך החובה <Money v={tb.dr} /> = סך הזכות <Money v={tb.cr} /> — מאזן הבוחן מאוזן.
          </>
        ) : done === rows.length ? (
          "יש טעויות — המסומנות באדום. זכרו: נכסים והוצאות בחובה; התחייבויות, הון והכנסות בזכות."
        ) : (
          "כשכל השורות יהיו נכונות, יופיעו הסכומים."
        )}
      </p>
    </div>
  );
}
