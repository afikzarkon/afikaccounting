"use client";

import { Check, PlayCircle, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { duration } from "@/lib/engine/format";
import type { DatedValuesField, Field, FieldValue, NumberField } from "@/lib/engine/types";
import { parseDatedValues } from "@/lib/engine/validate";
import { cn } from "@/lib/utils";

type Props<F extends Field = Field> = {
  field: F;
  value: FieldValue | undefined;
  error?: string;
  /** Locked by the field's `disabledIf`; the hint replaces the help text. */
  disabled?: boolean;
  currency: string;
  onChange: (value: FieldValue) => void;
  /** Opens the explainer video at the field's timestamp, when it has one. */
  onExplain?: (at: number) => void;
  /** Offered when solving for an unknown: marks or clears this field as X. */
  unknown?: { active: boolean; onToggle: () => void };
  /** For a dated-values field: show its optional note column. */
  showNote?: boolean;
};

export function FieldControl(props: Props) {
  const { field, error, disabled, onExplain, unknown } = props;
  const id = useId();
  const isX = !!unknown?.active;
  const help = isX
    ? field.kind === "dated-values"
      ? "נעלם (X): השאירו בלי סכום את השורה שהשווי בה הוא X — הוא יחושב מנתוני העזר."
      : "נעלם (X): יחושב מנתוני העזר בשלב האירועים."
    : disabled && field.disabledHint
      ? field.disabledHint
      : field.help;
  const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <label
          htmlFor={field.kind === "radio" || field.kind === "toggle" || field.kind === "dated-values" ? undefined : id}
          id={`${id}-label`}
          className="text-[13px] leading-snug font-medium text-fg"
        >
          {field.label}
        </label>
        <div className="no-print flex shrink-0 items-center gap-1.5">
          {unknown && (
            <button
              type="button"
              onClick={unknown.onToggle}
              aria-pressed={isX}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold transition-colors",
                isX ? "bg-accent text-accent-fg" : "border border-dashed border-line-strong text-muted hover:border-accent hover:text-accent",
              )}
              title={isX ? "ביטול הסימון כנעלם" : "סימון השדה כנעלם (X)"}
            >
              {isX ? "✓ " : ""}נעלם (X)
            </button>
          )}
          {field.videoAt !== undefined && onExplain && (
            <button
              type="button"
              onClick={() => onExplain(field.videoAt!)}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent transition hover:brightness-110"
              title="צפייה בחלק של סרטון ההסבר שעוסק בזה"
            >
              <PlayCircle className="h-3.5 w-3.5" /> {duration(field.videoAt)}
            </button>
          )}
        </div>
      </div>

      {/* A disabled fieldset disables every control inside it, whatever its kind. */}
      <fieldset disabled={disabled} className={cn("min-w-0", disabled && "opacity-55")}>

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
      {field.kind === "number" && (isX ? <XPlaceholder /> : <NumberInput {...props} field={field} id={id} describedBy={describedBy} />)}
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
      {field.kind === "dated-values" && <DatedValuesInput {...props} field={field} labelledBy={`${id}-label`} xRow={isX} />}
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
      ) : help ? (
        <p
          id={`${id}-help`}
          className={cn("mt-1.5 text-xs leading-relaxed", isX ? "text-accent" : disabled ? "text-amber-600 dark:text-amber-400" : "text-muted")}
        >
          {help}
        </p>
      ) : null}
      </fieldset>
    </div>
  );
}

/** Stands in for a number input while the field is the unknown. */
function XPlaceholder() {
  return (
    <div className="grid h-11 place-items-center rounded-xl border border-dashed border-accent/60 bg-accent-soft font-mono text-lg font-semibold text-accent">
      X
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

/**
 * Rows of date + amount, added and removed by the user. The rows live here as
 * typed (so a half-entered amount survives) and are reported upward as JSON.
 */
function DatedValuesInput({
  field,
  value,
  error,
  onChange,
  labelledBy,
  xRow,
  showNote,
}: Props<DatedValuesField> & { labelledBy: string; xRow: boolean }) {
  type Row = { date: string; value: string; note: string };
  const [rows, setRows] = useState<Row[]>(() =>
    parseDatedValues(String(value ?? "")).map((r) => ({ date: r.date, value: r.value === "" ? "" : String(r.value), note: r.note ?? "" })),
  );
  const commit = (next: Row[]) => {
    setRows(next);
    onChange(
      JSON.stringify(
        next.map((r) => ({ date: r.date, value: r.value.trim() === "" ? "" : Number(r.value), ...(r.note.trim() ? { note: r.note.trim() } : {}) })),
      ),
    );
  };
  const set = (i: number, patch: Partial<Row>) => commit(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const note = showNote ? field.note : undefined;
  const grid = note
    ? "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_2.75rem] gap-2"
    : "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2";

  return (
    <div role="group" aria-labelledby={labelledBy} className="space-y-2">
      {rows.length > 0 && (
        <div className={cn(grid, "px-1 text-[11px] text-subtle")}>
          <span>תאריך</span>
          <span>{field.valueLabel} (₪)</span>
          {note && <span>{note.label}</span>}
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className={grid}>
          <input
            type="date"
            dir="ltr"
            value={r.date}
            onChange={(e) => set(i, { date: e.target.value })}
            aria-label={`תאריך — שורה ${i + 1}`}
            aria-invalid={error ? true : undefined}
            className={cn(inputClass, "num font-mono")}
          />
          <input
            type="text"
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            value={r.value}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^d*.?d*$/.test(raw)) set(i, { value: raw });
            }}
            aria-label={`${field.valueLabel} — שורה ${i + 1}`}
            aria-invalid={error ? true : undefined}
            placeholder={xRow ? "X" : undefined}
            className={cn(inputClass, "num font-mono", xRow && r.value === "" && "border-accent/60 bg-accent-soft placeholder:text-accent")}
          />
          {note && (
            <input
              type="text"
              dir="ltr"
              autoComplete="off"
              value={r.note}
              onChange={(e) => set(i, { note: e.target.value })}
              aria-label={`${note.label} — שורה ${i + 1}`}
              aria-invalid={error ? true : undefined}
              placeholder={note.placeholder}
              className={cn(inputClass, "num font-mono placeholder:text-subtle/70")}
            />
          )}
          <button
            type="button"
            onClick={() => commit(rows.filter((_, j) => j !== i))}
            aria-label={`מחיקת שורה ${i + 1}`}
            className="grid h-11 place-items-center rounded-xl border border-line-strong text-muted transition-colors hover:border-danger/50 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => commit([...rows, { date: "", value: "", note: "" }])}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-line-strong px-3.5 text-sm text-muted transition-colors hover:border-accent/60 hover:text-accent"
      >
        <Plus className="h-4 w-4" /> {field.addLabel}
      </button>
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
