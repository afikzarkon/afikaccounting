"use client";

import { useId } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { F } from "./inventory-calc-state";

export const smallBtn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-line transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-[var(--ring)] disabled:opacity-40";
export const primaryBtn = cn(smallBtn, "bg-accent text-accent-fg ring-accent hover:bg-accent/90");

/** A number the question may give — or leave as an unknown with the ? button. */
export function NumField({
  label,
  value,
  onChange,
  error,
  suffix,
  letter,
  onToggleUnknown,
  placeholder,
  className,
}: {
  label: string;
  value: F | string;
  onChange: (v: string) => void;
  error?: string;
  suffix?: string;
  /** The unknown's letter, when this field is an unknown. */
  letter?: string;
  onToggleUnknown?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const f = typeof value === "string" ? { v: value, unknown: false } : value;
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-fg">
        {label}
      </label>
      <div className="flex gap-1.5">
        <div className="relative min-w-0 flex-1" dir="ltr">
          <input
            id={id}
            dir="ltr"
            inputMode="decimal"
            value={f.unknown ? "" : f.v}
            disabled={f.unknown}
            placeholder={f.unknown ? `נעלם ${letter ?? ""}` : placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-e` : undefined}
            className={cn(inputClass, "num h-10 font-mono", suffix && "pe-10", f.unknown && "border-accent/60 bg-accent-soft placeholder:font-sans placeholder:font-semibold placeholder:text-accent")}
          />
          {suffix && !f.unknown && <span className="pointer-events-none absolute inset-y-0 end-2.5 grid place-items-center text-xs text-subtle">{suffix}</span>}
        </div>
        {onToggleUnknown && (
          <button
            type="button"
            onClick={onToggleUnknown}
            aria-pressed={f.unknown}
            aria-label={`סמנו כנעלם: ${label}`}
            title="סמנו כנעלם"
            className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ring-1 transition-colors", f.unknown ? "bg-accent text-accent-fg ring-accent" : "text-muted ring-line hover:bg-surface-2")}
          >
            ?
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-e`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, value, onChange, type = "text", className }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-fg">
        {label}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={type === "date" ? "ltr" : undefined} className={cn(inputClass, "h-10")} />
    </div>
  );
}

export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
      <label htmlFor={id} className="text-[13.5px] text-fg">
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </label>
    </div>
  );
}

export function Select<T extends string>({ label, value, onChange, options, className }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][]; className?: string }) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-fg">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={cn(inputClass, "h-10")}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Choice cards: one of a few, each with its hint. */
export function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string, string][] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium text-fg">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(([v, title, hint]) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === value}
            onClick={() => onChange(v)}
            className={cn("min-h-10 rounded-xl border px-3 py-2.5 text-start transition-colors", v === value ? "border-accent/60 bg-accent-soft" : "border-line bg-surface hover:border-line-strong")}
          >
            <span className="block text-sm font-semibold text-fg">{title}</span>
            <span className="block text-xs text-muted">{hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
