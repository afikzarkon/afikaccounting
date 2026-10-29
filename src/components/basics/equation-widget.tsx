"use client";

import { Scale } from "lucide-react";
import { useId, useState } from "react";
import { balancesOf, identityHolds, KITS, ledger, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money, SideChip } from "./ui";

/**
 * The accounting equation, entry by entry: the science-kits business, with a
 * slider through its entries. Assets, liabilities and equity are computed from
 * the T-accounts after each one — and always balance.
 */
export function EquationWidget() {
  const entries = KITS.entries;
  const [k, setK] = useState(1);
  const entry = entries[k - 1];
  const s = statements(balancesOf(ledger(entries.slice(0, k))));
  const id = useId();
  const boxes: [string, number][] = [
    ["נכסים", s.totalAssets],
    ["התחייבויות", s.totalLiabilities],
    ["הון (כולל רווח)", s.totalEquity],
  ];
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-line bg-surface-2/50 p-4">
      <p id={id} className="flex items-center gap-2 text-[15px] font-semibold text-fg">
        <Scale className="h-4.5 w-4.5 text-accent" aria-hidden /> נסו בעצמכם: הזהות אחרי כל פקודה
      </p>
      <label className="mt-3 block text-[13px] text-muted">
        <span className="num">
          פקודה {k} מתוך {entries.length} · עסק ערכות המדע
        </span>
        <input type="range" min={1} max={entries.length} value={k} onChange={(e) => setK(Number(e.target.value))} className="mt-1 block w-full accent-[var(--accent)]" />
      </label>
      <div key={k} className="anim-step-in mt-2 rounded-xl border border-line bg-surface px-3 py-2.5">
        <p className="text-[14px] font-medium text-fg">{entry.text}</p>
        <div className="mt-1.5 space-y-0.5 text-[13.5px]">
          {entry.lines.map((l) => (
            <p key={l.account} className={cn("flex items-center gap-2", l.cr && "ps-5")}>
              <SideChip side={l.dr ? "dr" : "cr"} />
              <span className={l.dr ? "text-debit" : "text-credit"}>{l.account}</span>
              <Money v={(l.dr ?? l.cr)!} className="ms-auto text-muted" />
            </p>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 text-center">
        {boxes.map(([label, v], i) => (
          <div key={label} className="contents">
            {i > 0 && <span className="text-lg font-bold text-muted">{i === 1 ? "=" : "+"}</span>}
            <div className="min-w-0 rounded-xl border border-line bg-surface px-1.5 py-2">
              <p className="truncate text-[11.5px] text-muted">{label}</p>
              <Money v={v} plain className="text-[14px] font-bold text-fg" />
            </div>
          </div>
        ))}
      </div>
      <p className={cn("mt-2 text-center text-[12.5px] font-semibold", identityHolds(s) ? "text-success" : "text-danger")}>{identityHolds(s) ? "✓ מאוזן" : "✗ לא מאוזן"}</p>
    </section>
  );
}
