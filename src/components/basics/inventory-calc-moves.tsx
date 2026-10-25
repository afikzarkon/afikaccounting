"use client";

import { ArrowDownUp, ChevronDown, ClipboardPaste, Copy, Plus, Trash2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { type PeriodResult, purchaseCost } from "@/lib/learn/inventory";
import { cn } from "@/lib/utils";
import { Check, primaryBtn, smallBtn } from "./inventory-calc-fields";
import {
  type Built,
  type CalcState,
  emptyPurchase,
  emptySale,
  emptyYear,
  type F,
  parseDay,
  parseMoves,
  type PastedMove,
  type PurchaseForm,
  type SaleForm,
  showDay,
  uid,
  yearOf,
  type YearForm,
} from "./inventory-calc-state";
import { Money } from "./ui";

type Update = (fn: (s: CalcState) => CalcState) => void;
type Row = { t: number; kind: "buy" | "sell"; i: number; id: string };

const byDate = (a: string, b: string, na: number, nb: number) => (a && b ? a.localeCompare(b) || na - nb : a ? -1 : b ? 1 : na - nb);

/** One year's purchases and sales, in the order they were typed; with no order yet (a loaded example), by date. */
function rowsOf(y: YearForm, t: number): Row[] {
  const all: Row[] = [...y.purchases.map((p, i) => ({ t, kind: "buy" as const, i, id: p.id })), ...y.sales.map((x, i) => ({ t, kind: "sell" as const, i, id: x.id }))];
  const date = (r: Row) => (r.kind === "buy" ? y.purchases[r.i].date : y.sales[r.i].date);
  if (!y.order) return all.map((r, n) => ({ r, n, d: date(r) })).sort((a, b) => byDate(a.d, b.d, a.n, b.n)).map((x) => x.r);
  const pos = new Map(y.order.map((id, n) => [id, n]));
  return [...all].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
}
const idsOf = (y: YearForm, t: number) => rowsOf(y, t).map((r) => r.id);

/** Years named as years can be found, and added, from a date; otherwise rows stay where they are. */
const numericYears = (years: YearForm[]) => years.every((y) => /^\d{4}$/.test(y.label.trim()));

/**
 * The year a date belongs to, adding that year to the form when the question
 * reaches past (or before) the years typed so far. Knowns keep pointing at their year.
 */
function yearFor(s: CalcState, iso: string, fallback: number): { s: CalcState; t: number } {
  const yr = iso.slice(0, 4);
  const found = s.years.findIndex((y) => yearOf(y) === yr);
  if (found >= 0) return { s, t: found };
  if (!iso || !numericYears(s.years)) return { s, t: fallback };
  const at = s.years.findIndex((y) => Number(y.label) > Number(yr));
  const t = at < 0 ? s.years.length : at;
  const fresh = { ...emptyYear(yr, t === 0), founded: t === 0 && !!s.years[0]?.founded };
  const years = [...s.years.slice(0, t), fresh, ...s.years.slice(t)].map((y, j) => (t === 0 && j === 1 ? { ...y, founded: false, fromPrev: true } : y));
  return {
    t,
    s: { ...s, years, activeYear: s.activeYear >= t ? s.activeYear + 1 : s.activeYear, knowns: s.knowns.map((k) => (k.year >= t ? { ...k, year: k.year + 1 } : k)) },
  };
}

/** Takes a row out of its year: the form without it, and the row. */
function take(s: CalcState, row: Row): { s: CalcState; item: PurchaseForm | SaleForm } {
  const y = s.years[row.t];
  const item = row.kind === "buy" ? y.purchases[row.i] : y.sales[row.i];
  const next: YearForm = {
    ...y,
    purchases: row.kind === "buy" ? y.purchases.filter((_, j) => j !== row.i) : y.purchases,
    sales: row.kind === "sell" ? y.sales.filter((_, j) => j !== row.i) : y.sales,
    order: idsOf(y, row.t).filter((id) => id !== row.id),
  };
  return { s: { ...s, years: s.years.map((z, j) => (j === row.t ? next : z)) }, item };
}

/** Puts a row into a year, right after `afterId`; first when it is "", last when it is absent. */
function put(s: CalcState, t: number, kind: "buy" | "sell", item: PurchaseForm | SaleForm, afterId?: string): CalcState {
  const y = s.years[t];
  const ids = idsOf(y, t);
  const at = afterId === "" ? 0 : afterId && ids.includes(afterId) ? ids.indexOf(afterId) + 1 : ids.length;
  const next: YearForm = {
    ...y,
    purchases: kind === "buy" ? [...y.purchases, item as PurchaseForm] : y.purchases,
    sales: kind === "sell" ? [...y.sales, item as SaleForm] : y.sales,
    order: [...ids.slice(0, at), item.id, ...ids.slice(at)],
  };
  return { ...s, years: s.years.map((z, j) => (j === t ? next : z)) };
}

const cell = "h-9 w-full min-w-0 rounded-md border border-line bg-surface px-2 text-sm text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

/**
 * Every purchase and sale of the question, all years in one table to type into
 * like a spreadsheet. A row's year comes from its date; Enter moves down a
 * column and opens a new row at the end; "?" marks an unknown; a question's
 * table can be pasted in whole.
 */
export function QuickEntry({
  st,
  set,
  built,
  results,
  shared,
  renderTerms,
}: {
  st: CalcState;
  set: Update;
  built: Built;
  results?: (PeriodResult | undefined)[];
  /** The shared terms are on: every purchase carries them too. */
  shared: boolean;
  renderTerms: (t: number, i: number) => ReactNode;
}) {
  const years = st.years;
  const rows = years.flatMap((y, t) => rowsOf(y, t));
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [paste, setPaste] = useState(rows.length === 0);
  // A cell to focus once a new row has rendered.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    box.current?.querySelector<HTMLElement>(pending.current)?.focus();
    pending.current = null;
  });
  const focusCell = (id: string, c: number, later = false) => {
    const sel = `[data-row="${id}"][data-col="${c}"]`;
    if (later) pending.current = sel;
    else box.current?.querySelector<HTMLElement>(sel)?.focus();
  };

  const fresh = (kind: "buy" | "sell") => (kind === "buy" ? emptyPurchase() : emptySale());
  const add = (t: number, kind: "buy" | "sell", afterId?: string, col = 1) => {
    const item = fresh(kind);
    set((s) => put(s, t, kind, item, afterId));
    focusCell(item.id, col, true);
  };
  const remove = (row: Row) => set((s) => take(s, row).s);
  const flip = (row: Row) =>
    set((s) => {
      const ids = idsOf(s.years[row.t], row.t);
      const before = ids[ids.indexOf(row.id) - 1];
      const { s: out, item } = take(s, row);
      const base = row.kind === "buy" ? emptySale() : emptyPurchase();
      const turned = { ...base, id: item.id, date: item.date, qty: item.qty, price: item.price };
      const kind = row.kind === "buy" ? "sell" : "buy";
      // Back in the same place: after the row that was before it, or first.
      if (before) return put(out, row.t, kind, turned, before);
      const placed = put(out, row.t, kind, turned);
      const y = placed.years[row.t];
      return { ...placed, years: placed.years.map((z, j) => (j === row.t ? { ...y, order: [turned.id, ...(y.order ?? []).filter((id) => id !== turned.id)] } : z)) };
    });
  const patch = (row: Row, field: "qty" | "price", v: F) =>
    set((s) => ({
      ...s,
      years: s.years.map((y, j) =>
        j !== row.t
          ? y
          : row.kind === "buy"
            ? { ...y, purchases: y.purchases.map((z, n) => (n === row.i ? { ...z, [field]: v } : z)) }
            : { ...y, sales: y.sales.map((z, n) => (n === row.i ? { ...z, [field]: v } : z)) },
      ),
    }));
  // A date can move its row to another year — and add that year to the question.
  const setDate = (row: Row, iso: string) =>
    set((s) => {
      const target = iso ? s.years.findIndex((y) => yearOf(y) === iso.slice(0, 4)) : row.t;
      if (target === row.t || (target < 0 && !numericYears(s.years))) {
        return {
          ...s,
          years: s.years.map((y, j) =>
            j !== row.t ? y : row.kind === "buy" ? { ...y, purchases: y.purchases.map((p, n) => (n === row.i ? { ...p, date: iso } : p)) } : { ...y, sales: y.sales.map((p, n) => (n === row.i ? { ...p, date: iso } : p)) },
          ),
        };
      }
      const { s: out, item } = take(s, row);
      const { s: withYear, t } = yearFor(out, iso, row.t);
      // Into its place by date among the rows already in that year.
      const y = withYear.years[t];
      const earlier = rowsOf(y, t).filter((r) => {
        const d = r.kind === "buy" ? y.purchases[r.i].date : y.sales[r.i].date;
        return d && d <= iso;
      });
      return put(withYear, t, row.kind, { ...item, date: iso }, earlier.at(-1)?.id ?? (rowsOf(y, t).length ? "" : undefined));
    });
  const sortByDate = () =>
    set((s) => ({
      ...s,
      years: s.years.map((y, t) => ({
        ...y,
        order: rowsOf(y, t)
          .map((r, n) => ({ id: r.id, n, date: r.kind === "buy" ? y.purchases[r.i].date : y.sales[r.i].date }))
          .sort((a, b) => byDate(a.date, b.date, a.n, b.n))
          .map((r) => r.id),
      })),
    }));
  const addPasted = (moves: PastedMove[], replace: boolean) =>
    set((s0) => {
      let s = replace ? { ...s0, years: s0.years.map((y) => ({ ...y, purchases: [], sales: [], order: [] })) } : s0;
      for (const mv of moves) {
        const { s: next, t } = yearFor(s, mv.date, s.years.length - 1);
        s = put(next, t, mv.kind, { ...fresh(mv.kind), date: mv.date, qty: mv.qty, price: mv.price });
      }
      return s;
    });

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const id = el.dataset.row;
    if (!id) return;
    const c = Number(el.dataset.col);
    const r = rows.findIndex((x) => x.id === id);
    const down = e.key === "Enter" || e.key === "ArrowDown";
    const up = e.key === "ArrowUp";
    if (!down && !up) return;
    e.preventDefault();
    if (up) {
      if (r > 0) focusCell(rows[r - 1].id, c);
      return;
    }
    if (r + 1 < rows.length) return focusCell(rows[r + 1].id, c);
    // Enter on the last row opens a new one of the same kind, in the same year.
    add(rows[r].t, rows[r].kind, id, c);
  };

  // Units on hand after each row: in date order within a year, carried from year to year.
  const balance = new Map<string, number>();
  let units = 0;
  years.forEach((y, t) => {
    if (t === 0 || !y.fromPrev) units = (t === 0 && y.founded) || y.openUnits.unknown ? 0 : Number(y.openUnits.v) || 0;
    rowsOf(y, t)
      .map((row, n) => {
        const f = row.kind === "buy" ? y.purchases[row.i] : y.sales[row.i];
        return { row, n, date: f.date, qty: f.qty.unknown ? NaN : Number(f.qty.v) || 0 };
      })
      .sort((a, b) => (a.date && b.date ? a.date.localeCompare(b.date) || (a.row.kind === b.row.kind ? a.n - b.n : a.row.kind === "buy" ? -1 : 1) : a.date ? -1 : b.date ? 1 : a.n - b.n))
      .forEach((x) => {
        units += x.row.kind === "buy" ? x.qty : -x.qty;
        balance.set(x.row.id, units);
      });
  });

  const multi = years.length > 1;
  const last = years.length - 1;
  const lastId = rows.at(-1)?.t === last ? rows.at(-1)?.id : undefined;
  return (
    <div className="space-y-3">
      <PasteBox open={paste} onToggle={() => setPaste((o) => !o)} year={yearOf(years[last])} hasRows={rows.length > 0} onAdd={addPasted} />

      {/* `relative`: the header's screen-reader-only label is positioned, and must stay inside the scroll box. */}
      <div ref={box} onKeyDown={onKey} className="relative overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-surface-2/70 text-xs text-muted">
            <tr>
              <th scope="col" className="w-8 px-2 py-2 text-start font-medium">#</th>
              <th scope="col" className="w-24 px-1 py-2 text-start font-medium">סוג</th>
              <th scope="col" className="w-28 px-1 py-2 text-start font-medium">תאריך</th>
              <th scope="col" className="px-1 py-2 text-start font-medium">כמות</th>
              <th scope="col" className="px-1 py-2 text-start font-medium">מחיר ליחידה (₪)</th>
              <th scope="col" className="px-2 py-2 text-end font-medium">עלות / הכנסה</th>
              <th scope="col" className="bg-accent-soft px-2 py-2 text-end font-semibold text-fg">יתרה (יח׳)</th>
              <th scope="col" className="w-24 px-1 py-2">
                <span className="sr-only">פעולות</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-sm text-muted">
                  עוד אין שורות — הדביקו את טבלת השאלה למעלה, או הוסיפו שורה.
                </td>
              </tr>
            )}
            {years.flatMap((y, t) => {
              const yearRows = rows.filter((x) => x.t === t);
              const r = results?.[t];
              const head = multi && (
                <tr key={`year-${y.id}`} className="border-t-2 border-line-strong bg-surface-2/50">
                  <td colSpan={8} className="px-2 py-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-fg">{y.label}</span>
                      {r && (
                        <span className="text-muted">
                          פתיחה {r.openingUnits.toLocaleString("he-IL")} יח׳ · נקנו {r.purchasesUnits.toLocaleString("he-IL")} · נמכרו {r.soldUnits.toLocaleString("he-IL")} · סגירה {r.closingUnits.toLocaleString("he-IL", { maximumFractionDigits: 2 })} יח׳
                        </span>
                      )}
                      <span className="ms-auto flex gap-1">
                        <button type="button" className="rounded px-1.5 py-0.5 text-accent hover:bg-surface" onClick={() => add(t, "buy", yearRows.at(-1)?.id)}>
                          + רכישה ב-{y.label}
                        </button>
                        <button type="button" className="rounded px-1.5 py-0.5 text-accent hover:bg-surface" onClick={() => add(t, "sell", yearRows.at(-1)?.id)}>
                          + מכירה ב-{y.label}
                        </button>
                      </span>
                    </div>
                  </td>
                </tr>
              );
              return [
                head,
                ...yearRows.flatMap((row) => {
                  const n = rows.indexOf(row);
                  const buy = row.kind === "buy";
                  const f = buy ? y.purchases[row.i] : y.sales[row.i];
                  const key = (s: string) => `y${t}.${buy ? "p" : "s"}${row.i}.${s}`;
                  const engine = buy ? built.periods[t]?.purchases[row.i] : undefined;
                  const cost = buy && engine && !f.qty.unknown && !f.price.unknown && engine.qty > 0 ? purchaseCost(engine) : null;
                  const q = Number(f.qty.v);
                  const pr = Number(f.price.v);
                  const revenue = !buy && !f.qty.unknown && !f.price.unknown && f.qty.v && f.price.v && Number.isFinite(q * pr) ? q * pr : null;
                  const bal = balance.get(row.id);
                  const p = buy ? (f as PurchaseForm) : null;
                  const terms = p ? p.discounts.filter((x) => !x.global).length + p.extras.filter((x) => !x.global).length + (p.financing ? 1 : 0) : 0;
                  const errs = [built.errors[key("date")], built.errors[key("qty")], built.errors[key("price")]].filter(Boolean);
                  const at = (c: number): CellProps => ({ "data-row": row.id, "data-col": c });
                  return [
                    <tr key={row.id} className={cn("border-t border-line/70", buy && "bg-accent-soft/15")}>
                      <td className="num px-2 py-1.5 text-xs text-muted">{n + 1}</td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          {...at(0)}
                          onClick={() => flip(row)}
                          title="לחצו כדי להחליף בין רכישה למכירה"
                          aria-label={`${buy ? "רכישה" : "מכירה"} — לחצו להחלפה`}
                          className={cn("h-9 w-full rounded-md px-2 text-xs font-bold", buy ? "bg-accent text-accent-fg" : "bg-fg text-surface")}
                        >
                          {buy ? "רכישה" : "מכירה"}
                        </button>
                      </td>
                      <td className="px-1 py-1.5">
                        <DayCell cellProps={at(1)} label={`תאריך, שורה ${n + 1}`} value={f.date} year={yearOf(y)} bad={!!built.errors[key("date")]} onCommit={(v) => setDate(row, v)} />
                      </td>
                      <td className="px-1 py-1.5">
                        <NumCell cellProps={at(2)} label={`כמות, שורה ${n + 1}`} f={f.qty} letter={built.letters[key("qty")]} bad={!!built.errors[key("qty")]} onChange={(v) => patch(row, "qty", v)} />
                      </td>
                      <td className="px-1 py-1.5">
                        <NumCell cellProps={at(3)} label={`מחיר, שורה ${n + 1}`} f={f.price} letter={built.letters[key("price")]} bad={!!built.errors[key("price")]} onChange={(v) => patch(row, "price", v)} />
                      </td>
                      <td className="px-2 py-1.5 text-end text-xs text-muted">
                        {cost ? (
                          <span title={`סה״כ ${cost.total.toLocaleString("he-IL")} ₪`}>
                            <Money v={cost.perUnit} /> ליח׳
                          </span>
                        ) : revenue !== null ? (
                          <Money v={revenue} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={cn("bg-accent-soft/60 px-2 py-1.5 text-end font-semibold", bal !== undefined && bal < 0 ? "text-danger" : "text-fg")}>
                        {bal === undefined || !Number.isFinite(bal) ? "?" : bal.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-1 py-1.5">
                        <div className="flex justify-end gap-0.5">
                          {buy && (
                            <button
                              type="button"
                              className={cn("inline-flex h-9 items-center gap-0.5 rounded-md px-1.5 text-xs text-accent hover:bg-surface-2", terms && "font-semibold")}
                              aria-expanded={open === row.id}
                              onClick={() => setOpen((o) => (o === row.id ? null : row.id))}
                              title="הנחות, מכס, הובלה ומימון לרכישה הזו"
                            >
                              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open === row.id && "rotate-180")} aria-hidden />
                              {terms ? `תנאים (${terms})` : "תנאים"}
                              {shared && <span className="whitespace-nowrap rounded bg-accent px-1 text-[10px] font-bold text-accent-fg">+ אחידים</span>}
                            </button>
                          )}
                          <button
                            type="button"
                            className="grid h-9 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                            aria-label={`שכפלו את שורה ${n + 1}`}
                            onClick={() => set((s) => put(s, t, row.kind, { ...structuredClone(f), id: uid() }, row.id))}
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button type="button" className="grid h-9 w-8 place-items-center rounded-md text-muted hover:bg-danger/10 hover:text-danger" aria-label={`מחקו את שורה ${n + 1}`} onClick={() => remove(row)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>,
                    errs.length > 0 && (
                      <tr key={`${row.id}-e`}>
                        <td />
                        <td colSpan={7} className="px-1 pb-1.5 text-xs text-danger">
                          {[...new Set(errs)].join(" · ")}
                        </td>
                      </tr>
                    ),
                    buy && open === row.id && (
                      <tr key={`${row.id}-t`} className="bg-surface">
                        <td />
                        <td colSpan={7} className="border-t border-line px-2 py-3">
                          {renderTerms(t, row.i)}
                        </td>
                      </tr>
                    ),
                  ];
                }),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={smallBtn} onClick={() => add(last, "buy", lastId)}>
          <Plus className="h-4 w-4" aria-hidden /> רכישה
        </button>
        <button type="button" className={smallBtn} onClick={() => add(last, "sell", lastId)}>
          <Plus className="h-4 w-4" aria-hidden /> מכירה
        </button>
        <button type="button" className={smallBtn} onClick={sortByDate} disabled={rows.length < 2}>
          <ArrowDownUp className="h-4 w-4" aria-hidden /> מיון לפי תאריך
        </button>
      </div>
      <p className="text-xs text-muted">
        תאריך קצר: <span className="num font-semibold text-fg">5.1</span> או <span className="num font-semibold text-fg">5.1.2024</span> (השנה בתאריך קובעת את שנת השורה) ·{" "}
        <span className="font-semibold text-fg">Enter</span> לשורה הבאה · <span className="font-semibold text-fg">?</span> לנעלם · לחיצה על ״רכישה״ / ״מכירה״ מחליפה סוג
      </p>
    </div>
  );
}

type CellProps = { "data-row": string; "data-col": number };

/** A date typed short ("5.1", or "5.1.2024"); it is read when the cell is left. */
function DayCell({ cellProps, label, value, year, bad, onCommit }: { cellProps: CellProps; label: string; value: string; year: string; bad: boolean; onCommit: (iso: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? showDay(value, year);
  const invalid = draft !== null && parseDay(draft, year) === null;
  return (
    <input
      {...cellProps}
      aria-label={label}
      dir="ltr"
      inputMode="decimal"
      placeholder="5.1"
      value={shown}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === null) return;
        const iso = parseDay(draft, year);
        if (iso === null) return;
        setDraft(null);
        if (iso !== value) onCommit(iso);
      }}
      aria-invalid={invalid || bad || undefined}
      title={invalid ? "כתבו יום.חודש, למשל 5.1 (או 5.1.2024)" : undefined}
      className={cn(cell, "num text-center", (invalid || bad) && "border-danger")}
    />
  );
}

/** A number, or "?" for an unknown. */
function NumCell({ cellProps, label, f, letter, bad, onChange }: { cellProps: CellProps; label: string; f: F; letter?: string; bad: boolean; onChange: (v: F) => void }) {
  return (
    <input
      {...cellProps}
      aria-label={f.unknown ? `${label} — נעלם ${letter ?? ""}` : label}
      dir="ltr"
      inputMode="decimal"
      value={f.unknown ? "?" : f.v}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v.trim() === "?" ? { v: "", unknown: true } : { v: v.replace("?", ""), unknown: false });
      }}
      title={f.unknown ? `נעלם ${letter ?? ""} — מחקו את ה-? כדי להזין מספר` : undefined}
      className={cn(cell, "num font-mono", f.unknown && "border-accent bg-accent-soft text-center font-sans font-bold text-accent", bad && "border-danger")}
    />
  );
}

/** Paste the question's table: one line per purchase or sale. */
function PasteBox({ open, onToggle, year, hasRows, onAdd }: { open: boolean; onToggle: () => void; year: string; hasRows: boolean; onAdd: (moves: PastedMove[], replace: boolean) => void }) {
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(true);
  const parsed = text.trim() ? parseMoves(text, year) : null;
  const buys = parsed?.moves.filter((x) => x.kind === "buy").length ?? 0;
  const sells = parsed?.moves.filter((x) => x.kind === "sell").length ?? 0;
  const yearsIn = [...new Set(parsed?.moves.map((x) => x.date.slice(0, 4)).filter(Boolean) ?? [])].sort();
  return (
    <div className="rounded-xl border border-accent/40 bg-accent-soft/25">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm font-semibold text-fg">
        <ClipboardPaste className="h-4 w-4 text-accent" aria-hidden />
        <span className="flex-1">הדבקת הטבלה מהשאלה — הכי מהיר</span>
        <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="space-y-2 border-t border-accent/30 px-3 py-3">
          <p className="text-xs text-muted">
            העתיקו את טבלת הרכישות והמכירות מהשאלה והדביקו כאן — שורה לכל תנועה. בכל שורה צריכה להופיע המילה רכישה / קנייה או מכירה, ואחריה כמות ומחיר. תאריך עם שנה (5.1.2024) שולח את
            השורה לשנה הזו; בלי שנה — לשנה {year}. סימן ? לנעלם.
          </p>
          <textarea
            aria-label="טבלת הרכישות והמכירות מהשאלה"
            dir="rtl"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"5.1 רכישה 400 10\n15.2 מכירה 250 30\n3.3 רכישה 300 12\n20.5 מכירה ? 32"}
            className="w-full rounded-lg border border-line-strong bg-surface p-2 font-mono text-sm text-fg"
          />
          {parsed && (
            <p className={cn("text-xs", parsed.moves.length ? "text-success" : "text-danger")} aria-live="polite">
              זוהו {buys} רכישות ו-{sells} מכירות{yearsIn.length > 1 ? `, בשנים ${yearsIn.join(", ")}` : ""}.
              {parsed.skipped.length > 0 && <span className="text-muted"> לא זוהו {parsed.skipped.length} שורות (בלי ״רכישה״ / ״מכירה״ או בלי מספרים): {parsed.skipped.slice(0, 2).join(" · ")}</span>}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={primaryBtn}
              disabled={!parsed?.moves.length}
              onClick={() => {
                if (!parsed) return;
                onAdd(parsed.moves, hasRows && replace);
                setText("");
                onToggle();
              }}
            >
              הכניסו לטבלה
            </button>
            {hasRows && <Check label="החליפו את השורות הקיימות" checked={replace} onChange={setReplace} />}
          </div>
        </div>
      )}
    </div>
  );
}
