"use client";

import { useId, useState } from "react";
import { n } from "@/components/study/blocks";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** A typed number: thousands separators stripped; NaN when empty. */
export const parseNumber = (s: string) => {
  const t = s.replace(/,/g, "").trim();
  return t === "" ? NaN : Number(t);
};

/** A money or count field: thousands separators while idle, the raw number while typing. */
export function NumberInput({ label, value, onChange, error, suffix }: { label: string; value: string; onChange: (v: string) => void; error?: string; suffix?: string }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const v = parseNumber(value);
  const shown = focused || !Number.isFinite(v) ? value : n(v);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg">
        {label}
      </label>
      {/* Left-to-right wrapper, so the unit sits at the far end of the number, not over its first digits. */}
      <div className="relative" dir="ltr">
        <input
          id={id}
          dir="ltr"
          inputMode="decimal"
          value={shown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.replace(/,/g, ""))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass, "num text-start font-mono", suffix && "pe-14")}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-xs text-subtle">{suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Segmented({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string, string][] }) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-[13px] font-medium text-fg">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([v, title, hint]) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === value}
            onClick={() => onChange(v)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-start transition-colors",
              v === value ? "border-accent/50 bg-accent-soft" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span className="block text-sm font-semibold text-fg">{title}</span>
            <span className="block text-xs text-muted">{hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
