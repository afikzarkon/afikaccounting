"use client";

import { Check, PlayCircle } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { duration } from "@/lib/engine/format";
import type { Field, FieldValue, NumberField } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

type Props<F extends Field = Field> = {
  field: F;
  value: FieldValue | undefined;
  error?: string;
  currency: string;
  onChange: (value: FieldValue) => void;
  /** Opens the explainer video at the field's timestamp, when it has one. */
  onExplain?: (at: number) => void;
};

export function FieldControl(props: Props) {
  const { field, error, onExplain } = props;
  const id = useId();
  const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <label
          htmlFor={field.kind === "radio" || field.kind === "toggle" ? undefined : id}
          id={`${id}-label`}
          className="text-[13px] leading-snug font-medium text-fg"
        >
          {field.label}
        </label>
        {field.videoAt !== undefined && onExplain && (
          <button
            type="button"
            onClick={() => onExplain(field.videoAt!)}
            className="no-print inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent transition hover:brightness-110"
            title="צפייה בחלק של סרטון ההסבר שעוסק בזה"
          >
            <PlayCircle className="h-3.5 w-3.5" /> {duration(field.videoAt)}
          </button>
        )}
      </div>

      {field.kind === "toggle" && <Toggle {...props} field={field} labelledBy={`${id}-label`} describedBy={describedBy} />}
      {field.kind === "radio" && <Radio {...props} field={field} labelledBy={`${id}-label`} />}
      {field.kind === "select" && (
        <select
          id={id}
          value={String(props.value ?? "")}
          onChange={(e) => props.onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, "cursor-pointer appearance-none bg-[length:16px] bg-[left_0.85rem_center] bg-no-repeat pe-10")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238391a7' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {field.kind === "number" && <NumberInput {...props} field={field} id={id} describedBy={describedBy} />}
      {field.kind === "date" && (
        <input
          id={id}
          type="date"
          dir="ltr"
          value={String(props.value ?? "")}
          onChange={(e) => props.onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, "num font-mono")}
        />
      )}
      {field.kind === "series" && (
        <input
          id={id}
          type="text"
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          value={String(props.value ?? "")}
          onChange={(e) => props.onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder={field.placeholder}
          className={cn(inputClass, "num font-mono")}
        />
      )}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : field.help ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs leading-relaxed text-muted">
          {field.help}
        </p>
      ) : null}
    </div>
  );
}

function Toggle({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
}: Props<Extract<Field, { kind: "toggle" }>> & { labelledBy: string; describedBy?: string }) {
  const on = value === true;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!on)}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm transition-colors",
        on ? "border-accent/50 bg-accent-soft text-fg" : "border-line-strong bg-surface text-muted hover:border-accent/40",
      )}
      data-field={field.id}
    >
      <span>{on ? "כן" : "לא"}</span>
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-accent" : "bg-line-strong")}>
        <span
          className={cn(
            "absolute top-0.5 start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            on && "-translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

function Radio({
  field,
  value,
  onChange,
  labelledBy,
}: Props<Extract<Field, { kind: "radio" }>> & { labelledBy: string }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn("grid gap-2.5", field.options.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2")}
    >
      {field.options.map((o) => {
        const checked = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-xl border p-3.5 text-start transition-all",
              checked
                ? "border-accent bg-accent-soft shadow-[0_0_0_3px_var(--accent-soft)]"
                : "border-line-strong bg-surface hover:border-accent/40",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-fg">{o.label}</span>
              <span
                className={cn(
                  "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition-colors",
                  checked ? "border-accent bg-accent text-accent-fg" : "border-line-strong",
                )}
              >
                {checked && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </span>
            {o.description && <span className="mt-1 block text-xs leading-relaxed text-muted">{o.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

const UNIT_SUFFIX: Record<NumberField["unit"], string> = { currency: "", percent: "%", years: "שנים", count: "" };

/**
 * Keeps the raw text locally so partial input like "4." or "-" survives typing,
 * and reports a number upward as soon as the text parses as one.
 */
function NumberInput({
  field,
  value,
  error,
  currency,
  onChange,
  id,
  describedBy,
}: Props<NumberField> & { id: string; describedBy?: string }) {
  const [text, setText] = useState(value === undefined || value === "" ? "" : String(value));
  const prefix = field.unit === "currency" ? currency : "";
  const suffix = UNIT_SUFFIX[field.unit];

  return (
    // Numbers are typed left-to-right; in an RTL field "4." would display as ".4".
    <div className="relative" dir="ltr">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 start-0 grid w-14 place-items-center border-e border-line font-mono text-[11px] text-subtle">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/,/g, "");
          if (!/^-?\d*\.?\d*$/.test(raw)) return;
          setText(raw);
          const n = Number(raw);
          onChange(raw === "" || raw === "-" || raw === "." || !Number.isFinite(n) ? raw : n);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        placeholder={String(field.default)}
        className={cn(inputClass, "num font-mono", prefix && "ps-17", suffix && "pe-12")}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 end-0 grid w-11 place-items-center text-xs text-subtle">
          {suffix}
        </span>
      )}
    </div>
  );
}
