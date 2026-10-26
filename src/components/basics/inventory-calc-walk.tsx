"use client";

import type { Method } from "@/lib/learn/inventory";
import type { WalkStage } from "@/lib/learn/inventory-walkthrough";
import { cn } from "@/lib/utils";
import { TraceStepView } from "./inventory-trace";

const METHOD_TABS: [Method, string, string][] = [
  ["fifo", "FIFO", "שכבות: מה שנכנס ראשון יוצא ראשון"],
  ["wa-periodic", "ממוצע תקופתי", "ממוצע אחד לכל השנה"],
  ["moving-avg", "ממוצע נע", "ממוצע חדש אחרי כל רכישה"],
];

/** Which formula the solution is worked by; switching it reworks every stage. */
export function MethodSwitch({ method, onChange }: { method: Method; onChange: (m: Method) => void }) {
  return (
    <div role="group" aria-label="שיטת ההערכה לפתרון" className="no-print grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-surface-2/40 p-1.5">
      {METHOD_TABS.map(([m, label, hint]) => (
        <button
          key={m}
          type="button"
          aria-pressed={method === m}
          onClick={() => onChange(m)}
          className={cn("min-h-11 rounded-lg px-2 py-1.5 text-start transition-colors", method === m ? "bg-accent text-accent-fg shadow-sm" : "text-fg hover:bg-surface")}
        >
          <span className="block text-sm font-semibold">{label}</span>
          <span className={cn("hidden text-[11px] sm:block", method === m ? "text-accent-fg/85" : "text-muted")}>{hint}</span>
        </button>
      ))}
    </div>
  );
}

/** The solution stage by stage; `limit` shows only the first steps, for working along. */
export function Walkthrough({ stages, limit }: { stages: WalkStage[]; limit?: number }) {
  // How many steps come before each stage, to cut the list at `limit`.
  const before = stages.map((_, i) => stages.slice(0, i).reduce((n, s) => n + s.steps.length, 0));
  return (
    <div className="space-y-4">
      <nav aria-label="שלבי הפתרון" className="no-print">
        <ol className="flex flex-wrap gap-1.5">
          {stages.map((s, i) => (
            <li key={s.id}>
              <a href={`#walk-${s.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12.5px] font-medium text-fg hover:border-accent hover:bg-accent-soft/50">
                <span className="num grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{i + 1}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {stages.map((stage, i) => {
        if (limit !== undefined && before[i] >= limit) return null;
        const steps = limit === undefined ? stage.steps : stage.steps.slice(0, limit - before[i]);
        return (
          <section key={stage.id} id={`walk-${stage.id}`} aria-labelledby={`walk-${stage.id}-h`} className="scroll-mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            <header className="flex items-start gap-3 border-b border-line bg-surface-2/50 px-4 py-3">
              <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
              <div className="min-w-0">
                <h3 id={`walk-${stage.id}-h`} className="text-[16px] font-semibold text-fg">
                  {stage.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted">{stage.why}</p>
              </div>
            </header>
            <ol className="divide-y divide-line">
              {steps.map((s, j) => (
                <li key={s.id} className="px-4 py-3.5">
                  <p className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-fg">
                    <span className="num rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-bold text-accent">
                      {i + 1}.{j + 1}
                    </span>
                    {s.title}
                  </p>
                  <TraceStepView s={{ ...s, title: "" }} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
