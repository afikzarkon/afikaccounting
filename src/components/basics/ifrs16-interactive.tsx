"use client";

import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { useState } from "react";
import { leaseTerm } from "@/lib/learn/ifrs16";
import { CONTRACT_TEST, CONTRACT_TEST_START, type TestEnd, type TestNode } from "@/lib/study/ifrs16/lessons/what";
import { cn } from "@/lib/utils";

const isEnd = (n: TestNode | TestEnd): n is TestEnd => "verdict" in n;

/** A yes-or-no switch with its label. */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[14.5px] text-fg">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

/** A number of years, on a slider, with its value beside it. */
function Years({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-[14.5px] text-fg">
      <span className="flex items-center justify-between gap-2">
        {label}
        <strong className="num text-accent">{value}</strong>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1 h-8 w-full accent-[var(--accent)]" />
    </label>
  );
}

/**
 * The lease term, built: a contract's length, a break and an extension, each
 * either reasonably certain or not. A bar shows the years that count.
 */
export function TermBuilder() {
  const [contract, setContract] = useState(8);
  const [hasBreak, setHasBreak] = useState(true);
  const [breakAt, setBreakAt] = useState(5);
  const [stays, setStays] = useState(false);
  const [extend, setExtend] = useState(3);
  const [extending, setExtending] = useState(false);
  const at = Math.min(breakAt, contract - 1);
  const { term } = leaseTerm({ contractYears: contract, cancelAfter: hasBreak ? at : undefined, certainNotToCancel: stays, extendYears: extend, certainToExtend: extending });
  const firm = hasBreak ? at : contract;
  const total = contract + extend;
  const bars = [
    { key: "firm", years: firm, counted: true, label: "אי אפשר לבטל" },
    { key: "after", years: contract - firm, counted: term > firm, label: "אחרי הביטול" },
    { key: "ext", years: extend, counted: term > contract, label: "הארכה" },
  ].filter((b) => b.years > 0);
  return (
    <section aria-label="בונים תקופת חכירה" className="card space-y-4 p-4 sm:p-5">
      <p aria-live="polite" className="text-[17px] font-bold text-fg">
        תקופת החכירה: <span className="num text-accent">{term}</span> שנים
      </p>
      <div className="flex h-11 gap-0.5 overflow-hidden rounded-lg" role="img" aria-label={`מתוך ${total} שנים אפשריות, ${term} שנים נספרות`}>
        {bars.map((b) => (
          <div key={b.key} style={{ flexGrow: b.years }} className={cn("flex min-w-0 basis-0 items-center justify-center px-1 text-center text-[12px] leading-tight font-semibold", b.counted ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}>
            <span className="truncate">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Years label="שנות החוזה" value={contract} min={2} max={12} onChange={setContract} />
          <Toggle label="לחוכר יש אופציה לבטל" on={hasBreak} onChange={setHasBreak} />
          {hasBreak && (
            <>
              <Years label="אפשר לבטל אחרי שנה" value={at} min={1} max={contract - 1} onChange={setBreakAt} />
              <Toggle label="ודאי באופן סביר שלא יבטל" on={stays} onChange={setStays} />
            </>
          )}
        </div>
        <div className="space-y-2">
          <Years label="שנות אופציית ההארכה" value={extend} min={1} max={6} onChange={setExtend} />
          <Toggle label="ודאי באופן סביר שיאריך" on={extending} onChange={setExtending} />
        </div>
      </div>
    </section>
  );
}

/**
 * The standard's flowchart (paragraph B31), walked one question at a time: the
 * learner answers about any contract, sees the road they took, and ends on a
 * verdict with its reason.
 */
export function ContractTest() {
  const [path, setPath] = useState<{ at: string; answer: string }[]>([]);
  const [at, setAt] = useState(CONTRACT_TEST_START);
  const node = CONTRACT_TEST[at];
  const restart = () => {
    setPath([]);
    setAt(CONTRACT_TEST_START);
  };
  return (
    <section aria-label="בוחן החוזה" className="card space-y-3 p-4 sm:p-5">
      {path.length > 0 && (
        <ol className="space-y-1.5">
          {path.map((s, i) => (
            <li key={s.at} className="flex flex-wrap items-baseline gap-x-2 text-[14px] text-muted">
              <span className="num font-bold text-accent">{i + 1}.</span>
              <span>{(CONTRACT_TEST[s.at] as TestNode).q}</span>
              <strong className="font-semibold text-fg">{s.answer}</strong>
            </li>
          ))}
        </ol>
      )}
      {isEnd(node) ? (
        <div aria-live="polite" className={cn("rounded-2xl border-2 p-4", node.lease ? "border-success/50 bg-success/10" : "border-danger/40 bg-danger/5")}>
          <p className="flex items-center gap-2 text-[17px] font-bold text-fg">
            {node.lease ? <CircleCheck className="h-5 w-5 shrink-0 text-success" aria-hidden /> : <CircleX className="h-5 w-5 shrink-0 text-danger" aria-hidden />}
            {node.verdict}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-fg/90">{node.why}</p>
        </div>
      ) : (
        <div aria-live="polite">
          <p className="text-[16.5px] font-bold text-fg">
            {node.q} <span className="text-[13px] font-medium text-muted">({node.par})</span>
          </p>
          <p className="mt-1 text-[14.5px] leading-relaxed text-fg/85">{node.help}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {node.answers.map((a) => (
              <button
                key={a.to}
                type="button"
                onClick={() => {
                  setPath((p) => [...p, { at, answer: a.label }]);
                  setAt(a.to);
                }}
                className="min-h-11 rounded-xl border border-line-strong bg-surface px-4 py-2 text-[15px] font-semibold text-fg transition-colors hover:bg-accent-soft"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {path.length > 0 && (
        <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline">
          <RotateCcw className="h-4 w-4" aria-hidden /> בודקים חוזה אחר
        </button>
      )}
    </section>
  );
}
