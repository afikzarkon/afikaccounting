"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BkCheck } from "@/lib/learn/ias19-booklet";
import { cn } from "@/lib/utils";

const parse = (s: string) => {
  const t = s.replace(/[,\s₪()]/g, "").replace(/^-/, "");
  return t === "" ? NaN : Number(t);
};

/** Close enough: within a shekel, or a thousandth of the amount (a rounded rate along the way). */
const near = (got: number, want: number) => Math.abs(got - Math.abs(want)) <= Math.max(1.5, Math.abs(want) * 0.002);

/**
 * A booklet question's key amounts: the learner types each (signs and commas
 * don't matter), checks, and sees which are right before opening the solution.
 */
export function BookletCheck({ id, checks }: { id: string; checks: BkCheck[] }) {
  const [vals, setVals] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const check = () => {
    if (checks.some((_, i) => Number.isNaN(parse(vals[i] ?? "")))) {
      setError("הזינו את כל הסכומים כמספרים לפני הבדיקה.");
      setChecked(false);
      return;
    }
    setError("");
    setChecked(true);
  };
  const right = checks.filter((c, i) => near(parse(vals[i] ?? ""), c.value)).length;
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-3.5">
      <p className="text-[14px] font-bold text-muted">פתרתם? הזינו את הסכומים ובדקו (בלי סימן, אפשר עם פסיקים)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {checks.map((c, i) => {
          const ok = near(parse(vals[i] ?? ""), c.value);
          return (
            <label key={c.label} className="flex min-w-0 flex-col gap-1 text-[14px] font-semibold">
              {c.label}
              <input
                id={`${id}-${i}`}
                inputMode="decimal"
                autoComplete="off"
                dir="ltr"
                value={vals[i] ?? ""}
                onChange={(e) => {
                  setVals((v) => ({ ...v, [i]: e.target.value }));
                  setChecked(false);
                  setError("");
                }}
                className="num min-h-10 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-end text-[16px] font-normal text-fg"
              />
              {checked && <span className={cn("text-[13.5px] font-normal", ok ? "text-success" : "text-danger")}>{ok ? "נכון" : "לא מדויק. בדקו את השורה בפתרון."}</span>}
            </label>
          );
        })}
      </div>
      <p role="alert" className="min-h-5 text-[14px] text-danger">
        {error || (checked ? `${right} מתוך ${checks.length} נכונים.` : "")}
      </p>
      <Button onClick={check}>בדיקה</Button>
    </div>
  );
}
