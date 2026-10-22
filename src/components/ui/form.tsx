"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const inputClass =
  "h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-fg placeholder:text-subtle transition-colors outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 aria-invalid:border-danger aria-invalid:focus:ring-danger/15";

export function TextField({
  label,
  error,
  hint,
  className,
  type = "text",
  dir,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg">
        {label}
      </label>
      {/* Direction on the wrapper too, so the reveal button sits on the same side as the padding. */}
      <div className="relative" dir={dir}>
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          dir={dir}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(inputClass, isPassword && "pe-11")}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute inset-y-0 end-0 grid w-11 place-items-center text-subtle hover:text-fg"
            aria-label={reveal ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, className, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        error ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{error ?? message}</span>
    </div>
  );
}
