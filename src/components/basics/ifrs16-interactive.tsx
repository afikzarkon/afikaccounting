"use client";

import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { useState } from "react";
import { CONTRACT_TEST, CONTRACT_TEST_START, type TestEnd, type TestNode } from "@/lib/study/ifrs16/lessons/what";
import { cn } from "@/lib/utils";

const isEnd = (n: TestNode | TestEnd): n is TestEnd => "verdict" in n;

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
