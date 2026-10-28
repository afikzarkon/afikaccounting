import type { ReactNode } from "react";
import { type Balances, type Entry, ledger, type Posting, type TAccount, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { JE, Money } from "./ui";

/**
 * A T-account as it is drawn by hand: debits on the right, credits on the left,
 * each posting with the number of its entry, and the balance underneath. The
 * postings of entry `fresh` light up as they land; `totals` adds each side's sum.
 */
export function TBox({ t, fresh, openingLabel = "י.פ", totals, className }: { t: TAccount; fresh?: string; openingLabel?: string; totals?: boolean; className?: string }) {
  const open = (side: "dr" | "cr"): Posting[] => ((side === "dr" ? t.opening > 0 : t.opening < 0) ? [{ ref: openingLabel, amount: Math.abs(t.opening) }] : []);
  const dr = [...open("dr"), ...t.dr];
  const cr = [...open("cr"), ...t.cr];
  const sum = (xs: Posting[]) => xs.reduce((s, p) => s + p.amount, 0);
  const col = (xs: Posting[], side: "dr" | "cr") => (
    <div className={cn("min-h-[4.25rem] min-w-0 pt-1", side === "dr" ? "border-e-2 border-fg/75 pe-1" : "ps-1")}>
      <p className={cn("px-1 text-[10.5px] font-bold", side === "dr" ? "text-debit" : "text-credit")}>{side === "dr" ? "חובה" : "זכות"}</p>
      <ul>
        {xs.map((p, k) => (
          <li
            key={k}
            className={cn(
              "flex items-baseline justify-between gap-1 rounded-md px-1 py-0.5 text-[13px]",
              p.ref === fresh && "anim-post bg-accent-soft font-bold text-fg",
              p.ref === openingLabel && "text-muted",
            )}
          >
            <span className="truncate text-[10.5px] text-subtle">{p.ref}</span>
            <Money v={p.amount} plain />
          </li>
        ))}
      </ul>
    </div>
  );
  const b = t.balance;
  return (
    <figure className={cn("min-w-0 rounded-xl border border-line bg-surface pb-2", className)}>
      <figcaption className="flex flex-wrap items-baseline justify-center gap-x-1.5 px-2 pb-1.5 pt-2 text-center">
        <span className="text-[14px] font-bold text-fg">{t.account}</span>
        <span className="text-[10.5px] text-subtle">{TYPE_LABEL[typeOf(t.account)]}</span>
      </figcaption>
      <div className="mx-2 grid grid-cols-2 border-t-2 border-fg/75">
        {col(dr, "dr")}
        {col(cr, "cr")}
      </div>
      {totals && (
        <div className="mx-2 grid grid-cols-2 border-t border-line text-[12px] font-semibold text-muted">
          <p className="flex justify-between gap-1 border-e-2 border-fg/75 px-1 py-0.5 pe-1">
            <span>סה״כ</span> <Money v={sum(dr)} plain />
          </p>
          <p className="flex justify-between gap-1 px-1 py-0.5 ps-1">
            <span>סה״כ</span> <Money v={sum(cr)} plain />
          </p>
        </div>
      )}
      <p
        className={cn(
          "mx-2 mt-1.5 flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-[12.5px] font-bold",
          b > 0 ? "bg-debit/10 text-debit" : b < 0 ? "bg-credit/10 text-credit" : "bg-surface-2 text-muted",
        )}
      >
        <span>יתרה</span>
        <span>
          {b === 0 ? "0 · מאופס" : <Money v={Math.abs(b)} plain />} {b > 0 ? "ח׳" : b < 0 ? "ז׳" : ""}
        </span>
      </p>
    </figure>
  );
}

/**
 * Entry `at` of a run, beside the T-accounts it moves. The cards hold every
 * entry of the run up to this one, so the learner sees each card grow; the
 * postings of this entry are the ones that light up.
 */
export function Posted({
  entries,
  at,
  opening,
  openingLabel,
  accounts,
  title,
  note,
  hl,
}: {
  entries: Entry[];
  at: number;
  opening?: Balances;
  openingLabel?: string;
  accounts?: string[];
  title?: ReactNode;
  note?: ReactNode | null;
  hl?: string[];
}) {
  const entry = entries[at];
  const book = ledger(entries.slice(0, at + 1), opening);
  const shown = (accounts ?? [...new Set(entry.lines.map((l) => l.account))]).map((a) => book.find((t) => t.account === a)!);
  return <EntryCards entry={<JE entry={entry} title={title} note={note} hl={hl} />} cards={shown} fresh={entry.id} openingLabel={openingLabel} />;
}

/** The layout of a posting: the entry on one side, the cards it moved on the other (stacked on narrow screens). */
export function EntryCards({ entry, cards, fresh, openingLabel }: { entry: ReactNode; cards: TAccount[]; fresh?: string; openingLabel?: string }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {entry}
      <div className="min-w-0">
        <p className="mb-1.5 text-[11px] font-semibold text-muted lg:hidden">ובכרטיסי ה-T:</p>
        <div className={cn("grid content-start gap-2.5", cards.length > 1 && "grid-cols-2")}>
          {cards.map((t) => (
            <TBox key={t.account} t={t} fresh={fresh} openingLabel={openingLabel} />
          ))}
        </div>
      </div>
    </div>
  );
}
