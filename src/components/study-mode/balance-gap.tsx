"use client";

import { type DragEvent, useState } from "react";
import { Money } from "@/components/basics/ui";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { numberRight, parseAmount } from "@/lib/study/score";
import type { BalanceGap } from "@/lib/study/types";
import { typedAmount } from "@/lib/amount";
import { cn } from "@/lib/utils";

type Side = "dr" | "cr";
/** One card to sort: its label, its amount (null for the missing balance, typed by the learner), and the side it belongs on. */
type Item = { key: string; label: string; amount: number | null; side: Side };

const SIDE_LABEL: Record<Side, string> = { dr: "חובה", cr: "זכות" };

/**
 * Amounts sorted by hand. Every item — an account's balance, or a T-account's
 * movement — waits in a bank with its amount but not its side; the learner
 * drags each to the debit or the credit column (or taps it, then the column).
 * Then the one thing left: in a trial balance, the missing account's amount
 * that makes the columns equal; in a T-account, the closing balance and its
 * side. The totals follow every move; a check marks the items on the wrong
 * side; once done, the right arrangement is shown.
 */
export function BalanceGapBoard({ gap, answer, done, onCheck }: { gap: BalanceGap; answer: number; done: boolean; onCheck: (ok: boolean) => void }) {
  const trial = gap.kind === "trial";
  const items: Item[] = trial
    ? [
        ...Object.entries(gap.balances).map(([a, v]): Item => ({ key: a, label: a, amount: Math.abs(v), side: v > 0 ? "dr" : "cr" })),
        { key: gap.missing, label: gap.missing, amount: null, side: answer > 0 ? "dr" : "cr" },
      ]
    : gap.items.map((x, i): Item => ({ key: String(i), label: x.label, amount: x.amount, side: x.side }));
  // A T-account's closing balance sits on the bigger side.
  const closingSide: Side = answer >= 0 ? "dr" : "cr";

  const [placed, setPlaced] = useState<Record<string, Side>>({});
  const [typedText, setTypedText] = useState("");
  const [balanceSide, setBalanceSide] = useState<Side | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);

  const sideOf = (x: Item): Side | undefined => (done ? x.side : placed[x.key]);
  const place = (key: string, side: Side | undefined) => {
    setPlaced((p) => {
      const next = { ...p };
      if (side) next[key] = side;
      else delete next[key];
      return next;
    });
    setWrong((w) => w.filter((k) => k !== key));
    setPicked(null);
  };
  const typed = done ? Math.abs(answer) : parseAmount(typedText) || 0;
  const total = (side: Side) => items.filter((x) => sideOf(x) === side).reduce((s, x) => s + (x.amount ?? typed), 0);
  const dr = total("dr");
  const cr = total("cr");
  const allPlaced = items.every((x) => sideOf(x));
  const balanced = trial && allPlaced && typed > 0 && Math.abs(dr - cr) < 0.5;
  const canCheck = !done && allPlaced && typedText.trim() !== "" && (trial || balanceSide !== null);

  const check = () => {
    const off = items.filter((x) => placed[x.key] !== x.side).map((x) => x.key);
    setWrong(off);
    const amountRight = numberRight(Math.abs(answer), typedText);
    onCheck(off.length === 0 && amountRight && (trial || balanceSide === closingSide));
  };

  const onDrop = (side: Side | undefined) => (e: DragEvent) => {
    e.preventDefault();
    const key = e.dataTransfer.getData("text/plain");
    if (items.some((x) => x.key === key)) place(key, side);
  };

  const amountField = (label: string) =>
    done ? (
      <Money v={Math.abs(answer)} plain className="px-1 font-bold text-success" />
    ) : (
      <input
        dir="ltr"
        inputMode="decimal"
        value={typedText}
        onChange={(e) => setTypedText(typedAmount(e))}
        onKeyDown={(e) => e.key === "Enter" && canCheck && check()}
        placeholder="?"
        aria-label={label}
        className={cn(inputClass, "num h-8 w-28 text-end font-semibold")}
      />
    );

  const chip = (x: Item) => {
    const isWrong = wrong.includes(x.key);
    const side = sideOf(x);
    return (
      <li key={x.key} className="list-none">
        <span
          draggable={!done}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", x.key);
            setPicked(x.key);
          }}
          className={cn(
            "inline-flex flex-wrap items-center gap-1.5 rounded-lg border bg-surface text-[14px]",
            !done && "cursor-grab active:cursor-grabbing",
            picked === x.key ? "border-accent ring-2 ring-accent/40" : isWrong ? "border-danger ring-2 ring-danger/30" : done ? "border-success/50" : "border-line-strong",
          )}
        >
          <button
            type="button"
            disabled={done}
            onClick={() => (side ? place(x.key, undefined) : setPicked(picked === x.key ? null : x.key))}
            aria-pressed={picked === x.key}
            aria-label={side ? `${x.label} — להחזיר לבנק` : `${x.label} — לבחור כדי להעביר לצד`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-start font-semibold text-fg disabled:cursor-default"
          >
            {x.label}
            {x.amount !== null && <Money v={x.amount} plain className="font-normal text-muted" />}
            {x.amount === null && !side && <span className="font-bold text-accent">?</span>}
          </button>
          {x.amount === null && side && <span className="pe-1.5">{amountField(`יתרת ${x.label}`)}</span>}
        </span>
      </li>
    );
  };

  const column = (side: Side) => {
    const here = items.filter((x) => sideOf(x) === side);
    return (
      <section
        aria-label={`עמודת ה${SIDE_LABEL[side]}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop(side)}
        className={cn("flex min-h-40 min-w-0 flex-col rounded-xl border-2 border-dashed p-2.5", side === "dr" ? "border-debit/40 bg-debit/[0.04]" : "border-credit/40 bg-credit/[0.04]")}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={cn("text-[14px] font-bold", side === "dr" ? "text-debit" : "text-credit")}>{SIDE_LABEL[side]}</p>
          {picked && !done && (
            <button type="button" onClick={() => place(picked, side)} className="rounded-md bg-accent px-2 py-1 text-[12px] font-semibold text-accent-fg">
              הניחו כאן
            </button>
          )}
        </div>
        <ul className="flex flex-1 flex-col items-start gap-1.5">{here.map(chip)}</ul>
        <p className="num mt-2 flex justify-between border-t-2 border-fg/60 pt-1.5 text-[14px] font-bold text-fg">
          <span>סה״כ</span>
          <Money v={total(side)} plain />
        </p>
      </section>
    );
  };

  const bank = items.filter((x) => !sideOf(x));
  return (
    <div className="space-y-3">
      {!done && (
        <section aria-label="בנק" onDragOver={(e) => e.preventDefault()} onDrop={onDrop(undefined)} className="rounded-xl border border-line bg-surface-2/60 p-2.5">
          <p className="mb-2 text-[12.5px] font-semibold text-muted">
            {bank.length
              ? trial
                ? "גררו כל חשבון לצד שלו — או לחצו עליו, ואז על ״הניחו כאן״ בעמודה. לחיצה על חשבון שכבר בעמודה מחזירה אותו לכאן."
                : "גררו כל תנועה לצד שלה — או לחצו עליה, ואז על ״הניחו כאן״ בעמודה. לחיצה על תנועה שכבר בעמודה מחזירה אותה לכאן."
              : trial
                ? "הכול במקום. עכשיו — מה היתרה החסרה?"
                : "כל התנועות במקום. עכשיו — מה יתרת הסגירה, ובאיזה צד?"}
          </p>
          <ul className="flex min-h-9 flex-wrap gap-1.5">{bank.map(chip)}</ul>
        </section>
      )}

      <div>
        {!trial && <p className="mx-auto mb-1.5 w-fit border-b-2 border-fg/70 px-6 pb-1 text-center text-[15px] font-bold text-fg">כרטיס T · {gap.account}</p>}
        <div className="grid grid-cols-2 gap-2.5">
          {column("dr")}
          {column("cr")}
        </div>
      </div>

      {trial ? (
        <p aria-live="polite" className={cn("rounded-lg px-3 py-1.5 text-center text-[13px] font-semibold", balanced ? "bg-success/10 text-success" : "bg-surface-2 text-muted")}>
          {balanced ? "✓ מאוזן: סך החובה = סך הזכות" : allPlaced ? "עוד לא מאוזן: סך החובה וסך הזכות שונים" : "עוד לא הכול במקום"}
        </p>
      ) : (
        allPlaced && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
            <span className="text-[14.5px] font-bold text-fg">יתרת סגירה:</span>
            {amountField("יתרת הסגירה")}
            <span className="flex gap-1" role="radiogroup" aria-label="הצד של יתרת הסגירה">
              {(["dr", "cr"] as const).map((s) => {
                const on = done ? closingSide === s : balanceSide === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={done}
                    onClick={() => setBalanceSide(s)}
                    className={cn(
                      "h-8 rounded-lg px-3 text-[13px] font-bold ring-1 transition-colors",
                      on ? (s === "dr" ? "bg-debit text-surface ring-debit" : "bg-credit text-surface ring-credit") : s === "dr" ? "bg-surface text-debit ring-debit/40" : "bg-surface text-credit ring-credit/40",
                    )}
                  >
                    {SIDE_LABEL[s]}
                  </button>
                );
              })}
            </span>
          </div>
        )
      )}

      {wrong.length > 0 && !done && <p className="text-[13.5px] text-danger">המסומנים באדום בצד הלא נכון — העבירו אותם.</p>}
      {!done && (
        <Button onClick={check} disabled={!canCheck}>
          בדיקה
        </Button>
      )}
    </div>
  );
}
