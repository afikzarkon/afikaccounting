"use client";

import { CircleCheck, CircleX, Eye } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

type Rows = [string, number][];
const sum = (xs: Rows) => xs.reduce((s, [, v]) => s + v, 0);
const parseNumber = (s: string) => Number(s.replace(/[,\s₪]/g, ""));

/**
 * A balance sheet with retained earnings left as "?": the sheet must balance,
 * so the unknown is the difference. The learner types it in and checks it; the
 * working appears once it is right, or on request.
 */
export function RetainedSolver({ assets, liabilities, equity, answer, opening, profit }: { assets: Rows; liabilities: Rows; equity: Rows; answer: number; opening: number; profit: number }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [reveal, setReveal] = useState(false);
  const solved = checked === true;
  const check = () => setChecked(Math.abs(parseNumber(value) - answer) < 0.5);
  const A = sum(assets);
  const L = sum(liabilities);
  const E = sum(equity);

  const list = (title: string, rows: Rows) => (
    <>
      <li className="bg-surface-2/60 px-3 py-1 text-[11px] font-bold text-muted">{title}</li>
      {rows.map(([a, v]) => (
        <li key={a} className="flex justify-between gap-2 px-3 py-1.5 text-[14px]">
          <span>{a}</span>
          <Money v={v} plain />
        </li>
      ))}
    </>
  );

  return (
    <div className="card overflow-hidden">
      <p className="border-b border-line bg-surface-2/50 px-4 py-3 text-sm font-semibold text-fg">המאזן של יובל ליום 31.12.2020 — מה חסר?</p>
      <div className="grid sm:grid-cols-2">
        <div className="flex flex-col sm:border-e-2 sm:border-fg/70">
          <ul className="divide-y divide-line/60">{list("נכסים", assets)}</ul>
          <p className="mt-auto flex justify-between border-t-2 border-fg/70 px-3 py-2 text-sm font-bold">
            <span>סך הנכסים</span>
            <Money v={A} plain />
          </p>
        </div>
        <div className="flex flex-col max-sm:border-t-2 max-sm:border-fg/70">
          <ul className="divide-y divide-line/60">
            {list("התחייבויות", liabilities)}
            {list("הון", equity)}
            <li className={cn("flex items-center justify-between gap-2 px-3 py-1.5 text-[14px] font-bold", solved ? "bg-success/10 text-success" : "bg-accent-soft text-accent")}>
              <span>עודפים</span>
              {solved ? <Money v={answer} plain /> : <span className="grid h-6 w-10 place-items-center rounded-md bg-accent text-accent-fg">?</span>}
            </li>
          </ul>
          <p className="mt-auto flex justify-between border-t-2 border-fg/70 px-3 py-2 text-sm font-bold">
            <span>סך ההתחייבויות וההון</span>
            <span className={cn(!solved && "text-subtle")}>{solved ? <Money v={A} plain /> : "חייב להיות שווה"}</span>
          </p>
        </div>
      </div>
      <div className="space-y-3 border-t border-line p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label htmlFor={id} className="min-w-0 flex-1 text-xs text-muted">
            כמה עודפים? (המספר שמאזן את המאזן)
            <input
              id={id}
              dir="ltr"
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setChecked(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && value && check()}
              className={cn(inputClass, "num mt-1 text-start font-mono")}
            />
          </label>
          <button type="button" onClick={check} disabled={!value} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-40">
            בדיקה
          </button>
        </div>
        <div aria-live="polite">
          {checked === false && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-danger">
              <CircleX className="h-4 w-4" aria-hidden /> עוד לא. רמז: סך הנכסים, פחות ההתחייבויות, פחות הון הבעלים.
            </p>
          )}
          {solved && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <CircleCheck className="h-4 w-4" aria-hidden /> נכון! המאזן מתאזן.
            </p>
          )}
        </div>
        {!solved && !reveal && (
          <button type="button" onClick={() => setReveal(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
            <Eye className="h-3.5 w-3.5" /> הצג פתרון
          </button>
        )}
        {(solved || reveal) && (
          <div className="anim-step-in space-y-2 rounded-xl bg-surface-2/70 px-3 py-2.5 text-[14.5px]">
            <p>
              <strong>מהמאזן:</strong> <Money v={A} /> − <Money v={L} /> − <Money v={E} /> = <strong><Money v={answer} /></strong>
            </p>
            <p>
              <strong>ובדיקה מהרווח:</strong> עודפי פתיחה <Money v={opening} /> (חברה חדשה) + רווח השנה <Money v={profit} /> = <strong><Money v={opening + profit} /></strong>. אותו
              מספר.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
