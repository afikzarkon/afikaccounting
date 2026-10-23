"use client";

import { cn } from "@/lib/utils";

export const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

/** Twelve month chips; the chosen month is the one the asset became available for use. */
export function MonthPicker({ value, onChange, label = "חודש הכניסה לשימוש" }: { value: number; onChange: (m: number) => void; label?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium text-fg">{label}</legend>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12 lg:grid-cols-6 xl:grid-cols-6">
        {MONTHS.map((name, i) => {
          const m = i + 1;
          const on = m === value;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={on}
              title={name}
              onClick={() => onChange(m)}
              className={cn(
                "num flex h-11 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                on ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface text-fg hover:border-accent hover:text-accent",
              )}
            >
              {m}
              <span className={cn("text-[10px] font-normal leading-none", on ? "text-accent-fg/80" : "text-subtle")}>{name.slice(0, 3)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
