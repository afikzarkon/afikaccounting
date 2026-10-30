"use client";

import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { round2 } from "@/lib/learn/basics";
import { adjustment } from "@/lib/learn/credit-losses";
import { cn } from "@/lib/utils";
import { EntryView, Money } from "./ui";
import { typedAmount } from "@/lib/amount";

const FIELDS = [
  ["opening", "יתרת פתיחה של ההפרשה", 30_000],
  ["written", "חובות שנמחקו השנה", 12_000],
  ["recovered", "חובות שנמחקו בעבר ונגבו השנה", 0],
  ["gross", "יתרת לקוחות ברוטו בסוף השנה", 800_000],
  ["specificDebt", "חוב של לקוח ספציפי בקשיים", 0],
  ["specificRate", "אחוז הפרשה ספציפית (%)", 0],
  ["generalRate", "אחוז הפרשה כללית על שאר הלקוחות (%)", 5],
] as const;
type Key = (typeof FIELDS)[number][0];

/** Year-end allowance from the figures an exam gives: what is required, what is already there, and the entry between them. */
export function CreditLossCalculator() {
  const id = useId();
  const [v, setV] = useState<Record<Key, string>>(Object.fromEntries(FIELDS.map(([k, , d]) => [k, String(d)])) as Record<Key, string>);
  const num = (k: Key) => {
    const x = Number(v[k].replace(/,/g, ""));
    return Number.isFinite(x) ? x : 0;
  };
  const before = round2(num("opening") - num("written") + num("recovered"));
  const specific = round2(num("specificDebt") * (num("specificRate") / 100));
  const general = round2((num("gross") - num("specificDebt")) * (num("generalRate") / 100));
  const required = round2(specific + general);
  const diff = round2(required - before);
  const net = round2(num("gross") - required);

  const row = (label: string, value: number, strong?: boolean) => (
    <p className={cn("flex items-center justify-between gap-3 px-3 py-1.5 text-sm", strong && "font-bold text-fg")}>
      <span>{label}</span>
      <Money v={value} plain />
    </p>
  );

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-3 border-b border-line bg-surface-2/50 p-4 sm:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <label key={k} htmlFor={`${id}-${k}`} className="block min-w-0 text-[13px] font-medium text-fg">
            {label}
            <input
              id={`${id}-${k}`}
              inputMode="decimal"
              dir="ltr"
              value={v[k]}
              onChange={(e) => {
                const t = typedAmount(e);
                setV((s) => ({ ...s, [k]: t }));
              }}
              className={cn(inputClass, "mt-1 text-end")}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2" aria-live="polite">
        <div className="min-w-0 divide-y divide-line/60 rounded-xl border border-line">
          {row("יתרת ההפרשה לפני התאמה", before)}
          {row("הפרשה ספציפית", specific)}
          {row("הפרשה כללית", general)}
          {row("הפרשה נדרשת בסוף השנה", required, true)}
          {row(diff >= 0 ? "הוצאות הפסדי אשראי השנה" : "ביטול הפרשה (מקטין את ההוצאה)", Math.abs(diff), true)}
          {row("לקוחות נטו במאזן", net, true)}
        </div>
        <div className="min-w-0">
          {diff === 0 ? (
            <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-sm text-fg">ההפרשה הקיימת בדיוק בגובה הנדרש — אין פקודת התאמה.</p>
          ) : (
            <EntryView entry={adjustment("התאמה", "31.12", before, required)} title="פקודת ההתאמה בסוף השנה" note={null} />
          )}
        </div>
      </div>
    </div>
  );
}
