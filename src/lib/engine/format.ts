export const CURRENCIES = [
  { value: "ILS", label: "ILS — שקל חדש" },
  { value: "USD", label: "USD — דולר אמריקאי" },
  { value: "EUR", label: "EUR — אירו" },
  { value: "GBP", label: "GBP — לירה שטרלינג" },
];

const cache = new Map<string, Intl.NumberFormat>();

function formatter(key: string, make: () => Intl.NumberFormat) {
  let f = cache.get(key);
  if (!f) {
    f = make();
    cache.set(key, f);
  }
  return f;
}

export function money(n: number, currency = "ILS") {
  return formatter(`c-${currency}`, () =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  ).format(n);
}

/** Accounting style: no symbol, negatives in parentheses. */
export function amount(n: number) {
  const s = formatter("amt", () =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  ).format(Math.abs(n));
  return n < 0 ? `(${s})` : s;
}

export function percent(n: number, digits = 2) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function plain(n: number) {
  return formatter("plain", () => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })).format(n);
}

export function formatCell(value: string | number | null | undefined, format?: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (format === "percent") return percent(value);
  if (format === "number") return plain(value);
  if (format === "text") return String(value);
  return amount(value);
}

export function duration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
