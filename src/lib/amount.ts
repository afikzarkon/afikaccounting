import type { ChangeEvent } from "react";

/**
 * Thousands separators in a typed amount, as it is typed: "1234567.5" shows as
 * "1,234,567.5". Keeps digits, one decimal point and a leading minus, so partial
 * input like "-" or "4." survives; anything else is dropped. Read the value back
 * with a parser that strips the commas (parseAmount, parseNumber), or ungroup it.
 */
export function groupDigits(raw: string): string {
  const t = raw.trim();
  const minus = /^[-−]/.test(t) ? "-" : "";
  const [int = "", ...rest] = t.replace(/[^\d.]/g, "").split(".");
  const point = rest.length ? `.${rest.join("")}` : "";
  return minus + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + point;
}

export const ungroup = (s: string) => s.replace(/,/g, "");

const significant = /[\d.-]/;

/**
 * An amount field's change, grouped: returns the new text with separators, and
 * puts the caret back after the same digit it followed (a controlled input would
 * otherwise jump to the end whenever a separator comes or goes).
 */
export function typedAmount(e: ChangeEvent<HTMLInputElement>): string {
  const el = e.target;
  const caret = el.selectionStart ?? el.value.length;
  const before = [...el.value.slice(0, caret)].filter((c) => significant.test(c)).length;
  const next = groupDigits(el.value);
  requestAnimationFrame(() => {
    if (document.activeElement !== el) return;
    let i = 0;
    for (let seen = 0; i < next.length && seen < before; i++) if (significant.test(next[i])) seen++;
    el.setSelectionRange(i, i);
  });
  return next;
}
