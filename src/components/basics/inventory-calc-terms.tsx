"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { EXTRA_INFO, type ExtraBasis, type ExtraCategory } from "@/lib/learn/inventory";
import { cn } from "@/lib/utils";
import { Check, NumField, Select, smallBtn, TextField } from "./inventory-calc-fields";
import { type Built, type CalcState, type DiscountForm, defaultsOf, emptyDiscount, emptyExtra, emptyPurchase, type ExtraForm, type PurchaseForm } from "./inventory-calc-state";
import type { Update } from "./inventory-calculator";

const chip = cn(smallBtn, "min-h-8 px-2.5 py-1 text-xs");

const DISCOUNT_KIND: [DiscountForm["kind"], string][] = [
  ["qty-excess", "מדורגת — רק על היחידות שמעל הסף"],
  ["qty-whole", "כמות — על כל הרכישה"],
  ["per-unit-above", "₪ ליחידה מעבר ליחידה ה-N"],
  ["target", "יעד מצטבר (מותנה)"],
];
const DISCOUNT_QUICK: [DiscountForm["kind"], string][] = [
  ["qty-excess", "הנחה מדורגת"],
  ["qty-whole", "הנחה על כל הרכישה"],
  ["per-unit-above", "₪ הנחה ליחידה"],
  ["target", "הנחת יעד"],
];
const EXTRA_QUICK: [ExtraCategory, ExtraBasis, string][] = [
  ["duty", "per-shipment", "מכס / מס ייבוא"],
  ["duty", "pct-of-net-price", "מכס %"],
  ["freight", "per-shipment", "הובלה"],
  ["handling", "per-shipment", "טיפול / נמל"],
  ["storage", "per-unit", "אחסון"],
  ["storage-required", "per-unit", "אחסון הכרחי"],
  ["selling", "per-unit", "הובלה ללקוח"],
  ["vat", "pct-of-net-price", "מע״מ"],
  ["other", "per-shipment", "עלות אחרת"],
];
const BASIS_LABEL: Record<ExtraBasis, string> = { "per-shipment": "להזמנה", "per-unit": "ליחידה", "per-pack": "לארגז", "per-kg": "לק״ג", "pct-of-net-price": "% מהמחיר נטו" };

/** The terms every purchase shares: typed once, applied to every row in every year. */
export function GlobalTerms({ st, set, built }: { st: CalcState; set: Update; built: Built }) {
  const d = defaultsOf(st);
  const setT = (fn: (p: PurchaseForm) => PurchaseForm) =>
    set((s) => {
      const next = fn({ ...emptyPurchase(), ...defaultsOf(s).template });
      return { ...s, defaults: { on: true, template: { discounts: next.discounts, extras: next.extras, financing: next.financing } } };
    });
  return (
    <section aria-labelledby="inv-terms" className="rounded-xl border border-line bg-surface p-3.5">
      <h3 id="inv-terms" className="text-sm font-semibold text-fg">
        תנאים לכל הרכישות
      </h3>
      <p className="mb-3 text-xs text-muted">הנחה, מכס, הובלה או אחסון שחלים על כל הזמנה — מזינים פעם אחת כאן. תנאי של רכישה אחת בלבד — בכפתור ״תנאים״ בשורה שלה.</p>
      <PurchaseTerms p={{ ...emptyPurchase(), ...d.template }} built={built} keyOf={(s) => `tpl.${s}`} discLetter={built.letters.disc} setP={setT} />
    </section>
  );
}

/** One purchase's discounts, extra costs and credit terms, each a compact row; empty, it is only the buttons that add them. */
export function PurchaseTerms({
  p,
  built,
  keyOf,
  discLetter,
  setP,
}: {
  p: PurchaseForm;
  built: Built;
  /** Where this purchase's fields report their errors. */
  keyOf: (s: string) => string;
  discLetter?: string;
  setP: (fn: (p: PurchaseForm) => PurchaseForm) => void;
}) {
  const err = (s: string) => built.errors[keyOf(s)];
  const [dated, setDated] = useState<number[]>([]);
  const [credit, setCredit] = useState(false);
  // The form holds only a purchase's own terms; the shared ones join them when the engine's input is built.
  const { discounts, extras } = p;
  const setD = (j: number, patch: Partial<DiscountForm>) => setP((x) => ({ ...x, discounts: x.discounts.map((d, n) => (n === j ? { ...d, ...patch } : d)) }));
  const setE = (j: number, patch: Partial<ExtraForm>) => setP((x) => ({ ...x, extras: x.extras.map((z, n) => (n === j ? { ...z, ...patch } : z)) }));
  return (
    <div className="space-y-2">
      {discounts.map((d, j) => {
        const dk = (s: string) => `d${j}.${s}`;
        const showDates = dated.includes(j) || !!d.from || !!d.to;
        return (
          <div key={j} className="space-y-2 rounded-lg bg-surface-2/50 p-2">
            <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Select label="הנחה" value={d.kind} onChange={(v) => setD(j, { kind: v })} options={DISCOUNT_KIND} />
              {d.kind !== "target" ? (
                <NumField
                  label={d.kind === "per-unit-above" ? "מעבר ליחידה ה-" : d.kind === "qty-excess" ? "מעל (״מהיחידה ה-401״ ← 400)" : "מעל כמה יחידות"}
                  value={d.threshold}
                  onChange={(v) => setD(j, { threshold: v })}
                  error={err(dk("threshold"))}
                />
              ) : (
                <span aria-hidden />
              )}
              {d.kind === "per-unit-above" ? (
                <NumField label="הנחה ליחידה" suffix="₪" value={d.amount} onChange={(v) => setD(j, { amount: v })} error={err(dk("amount"))} />
              ) : (
                <NumField label="שיעור" suffix="%" value={d.pct} onChange={(v) => setD(j, { pct: { ...d.pct, v } })} error={err(dk("pct"))} letter={discLetter} onToggleUnknown={() => setD(j, { pct: { ...d.pct, unknown: !d.pct.unknown } })} />
              )}
              <RemoveBtn label="הסירו הנחה" onClick={() => setP((x) => ({ ...x, discounts: x.discounts.filter((_, n) => n !== j) }))} />
            </div>
            {d.kind === "target" && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Check label="בשליטת החברה" checked={d.controlled} onChange={(v) => setD(j, { controlled: v })} />
                <Check label="צפוי שיושג" checked={d.expected} onChange={(v) => setD(j, { expected: v })} />
                <Check label="הושג בפועל" checked={d.achieved} onChange={(v) => setD(j, { achieved: v })} />
              </div>
            )}
            {showDates ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label="בתוקף מתאריך" type="date" value={d.from} onChange={(v) => setD(j, { from: v })} />
                <TextField label="עד תאריך" type="date" value={d.to} onChange={(v) => setD(j, { to: v })} />
              </div>
            ) : (
              <button type="button" className="text-xs text-accent underline" onClick={() => setDated((x) => [...x, j])}>
                ההנחה רק בחלק מהשנה?
              </button>
            )}
            {d.pct.unknown && <p className="text-xs text-accent">השיעור נעלם — הזינו בשלב 2 את ״הנחה ברכישה מסוימת״.</p>}
          </div>
        );
      })}

      {extras.map((e, j) => {
        const ek = (s: string) => `e${j}.${s}`;
        const info = EXTRA_INFO[e.category];
        const included = e.include === "auto" ? info.include : e.include === "in";
        const flip = () => {
          const next = !included;
          setE(j, { include: next === info.include ? "auto" : next ? "in" : "out" });
        };
        return (
          <div key={`e${j}`} className="grid items-end gap-2 rounded-lg bg-surface-2/50 p-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <p className="pb-2.5 text-sm font-medium text-fg" title={`${info.reason} (${info.section})`}>
              {e.label || info.label}
            </p>
            <NumField label={`סכום ${BASIS_LABEL[e.basis]}`} suffix={e.basis === "pct-of-net-price" ? "%" : "₪"} value={e.amount} onChange={(v) => setE(j, { amount: v })} error={err(ek("amount"))} />
            {e.basis === "per-pack" ? (
              <NumField label="יחידות בארגז" value={e.packSize} onChange={(v) => setE(j, { packSize: v })} error={err(ek("packSize"))} />
            ) : e.basis === "per-kg" ? (
              <NumField label="ק״ג ליחידה" value={e.kgPerUnit} onChange={(v) => setE(j, { kgPerUnit: v })} error={err(ek("kg"))} />
            ) : (
              <Select label="לפי" value={e.basis} onChange={(v) => setE(j, { basis: v })} options={(Object.keys(BASIS_LABEL) as ExtraBasis[]).map((b) => [b, BASIS_LABEL[b]])} />
            )}
            <button
              type="button"
              onClick={flip}
              title={`${info.reason} (${info.section}) — לחצו לשינוי`}
              className={cn("h-10 rounded-lg px-2.5 text-xs font-bold whitespace-nowrap", included ? "bg-success/15 text-success" : "bg-danger/10 text-danger")}
            >
              {included ? "✓ בעלות המלאי" : "← הוצאה שוטפת"}
            </button>
            <RemoveBtn label="הסירו עלות" onClick={() => setP((x) => ({ ...x, extras: x.extras.filter((_, n) => n !== j) }))} />
          </div>
        );
      })}

      {(credit || p.financing) && (
        <div className="flex items-end gap-2 rounded-lg bg-surface-2/50 p-2">
          <NumField label="תנאי אשראי חריגים: במזומן המחיר נמוך ב-" suffix="%" value={p.financing} onChange={(v) => setP((x) => ({ ...x, financing: v }))} error={err("financing")} className="flex-1 sm:max-w-xs" />
          <RemoveBtn
            label="הסירו תנאי אשראי"
            onClick={() => {
              setCredit(false);
              setP((x) => ({ ...x, financing: "" }));
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1">
        <span className="me-1 text-xs text-muted">הוסיפו:</span>
        {DISCOUNT_QUICK.map(([k, l]) => (
          <button key={k} type="button" className={chip} onClick={() => setP((x) => ({ ...x, discounts: [...x.discounts, { ...emptyDiscount(), kind: k }] }))}>
            + {l}
          </button>
        ))}
        {EXTRA_QUICK.map(([c, b, l]) => (
          <button key={l} type="button" className={chip} onClick={() => setP((x) => ({ ...x, extras: [...x.extras, emptyExtra(c, b)] }))}>
            + {l}
          </button>
        ))}
        {!credit && !p.financing && (
          <button type="button" className={chip} onClick={() => setCredit(true)}>
            + אשראי חריג
          </button>
        )}
      </div>
    </div>
  );
}

function RemoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={cn(smallBtn, "h-10 w-10 px-0")} aria-label={label} onClick={onClick}>
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
