import type { Calculator, CalculatorSchema, Field, FieldValue, Values } from "./types";

export const num = (v: Values, id: string) => Number(v[id] ?? 0);
export const rate = (v: Values, id: string) => num(v, id) / 100;
export const str = (v: Values, id: string) => String(v[id] ?? "");
export const bool = (v: Values, id: string) => v[id] === true;

export const allFields = (c: CalculatorSchema): Field[] => [...c.scenario, ...c.metrics];

export function isVisible(field: Field, values: Values) {
  return (field.showIf ?? []).every((cond) => cond.in.includes(values[cond.field]));
}

export function defaults(c: CalculatorSchema): Values {
  return Object.fromEntries(allFields(c).map((f) => [f.id, f.default]));
}

export function checkField(field: Field, value: FieldValue | undefined): string | null {
  switch (field.kind) {
    case "toggle":
      return typeof value === "boolean" ? null : "יש לבחור כן או לא.";
    case "radio":
    case "select":
      return field.options.some((o) => o.value === value) ? null : "יש לבחור אחת מהאפשרויות.";
    case "number": {
      if (value === "" || value === undefined || value === null) {
        return field.required === false ? null : "שדה חובה.";
      }
      const n = Number(value);
      if (!Number.isFinite(n)) return "יש להזין מספר.";
      if (field.integer && !Number.isInteger(n)) return "יש להזין מספר שלם.";
      if (field.min !== undefined && n < field.min) return `הערך חייב להיות לפחות ${field.min}.`;
      if (field.max !== undefined && n > field.max) return `הערך חייב להיות לכל היותר ${field.max}.`;
      return null;
    }
    case "date":
      return typeof value === "string" && isIsoDate(value) ? null : "יש להזין תאריך תקין.";
  }
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Errors for the visible fields of one wizard step (or of every step). */
export function validateValues(
  calc: Calculator,
  values: Values,
  scope: "scenario" | "metrics" | "all" = "all",
): Record<string, string> {
  const fields = scope === "scenario" ? calc.scenario : scope === "metrics" ? calc.metrics : allFields(calc);
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!isVisible(field, values)) continue;
    const message = checkField(field, values[field.id]);
    if (message) errors[field.id] = message;
  }
  if (scope !== "scenario" && Object.keys(errors).length === 0 && calc.validate) {
    Object.assign(errors, calc.validate(values));
  }
  return errors;
}

/**
 * Coerce untrusted input (a request body, a saved row) into the calculator's
 * shape: unknown keys dropped, missing ones defaulted, numbers parsed.
 */
export function sanitize(calc: CalculatorSchema, raw: unknown): Values {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Values = {};
  for (const field of allFields(calc)) {
    const v = input[field.id];
    if (field.kind === "toggle") out[field.id] = typeof v === "boolean" ? v : field.default;
    else if (field.kind === "number") {
      const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
      out[field.id] = Number.isFinite(n) ? n : field.default;
    } else out[field.id] = typeof v === "string" ? v : field.default;
  }
  return out;
}
