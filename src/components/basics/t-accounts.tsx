import type { ReactNode } from "react";
import { type Balances, type Entry, ledger, type Posting, type TAccount, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { TCardsDialog } from "./t-dialog";
import { JE, Money } from "./ui";

/** The first T-account of the course, in full: what it is, and how a journal entry reaches it. */
const T_INTRO: ReactNode[] = [
  <>כרטיס T הוא הדף של חשבון אחד (מזומן, ספקים, שכירות…). הצורה — קו לרוחב עם שם החשבון, וקו באמצע — נראית כמו האות T.</>,
  <>פקודת היומן מתארת אירוע אחד. כרטיס ה-T אוסף את כל הפקודות שנגעו בחשבון שלו.</>,
  <>
    כל שורה בפקודה עוברת לכרטיס של החשבון שלה, באותו סכום ועם מספר הפקודה: <strong className="text-debit">שורת ח׳ — לצד ימין</strong>,{" "}
    <strong className="text-credit">שורת ז׳ — לצד שמאל</strong>.
  </>,
  <>פקודה אחת מעדכנת כמה כרטיסים — כרטיס לכל שורה. והיתרה בתחתית הכרטיס מראה מה מצב החשבון אחרי כל הפקודות.</>,
];

/** The reminder after that: what a T-account is, short. */
const T_SHORT: ReactNode[] = [
  <>הדף של חשבון אחד: כל הסכומים שנרשמו בחשבון הזה, במקום אחד.</>,
  <>
    <strong className="text-debit">צד ימין — חובה</strong>, <strong className="text-credit">צד שמאל — זכות</strong>. ליד כל סכום — מספר הפקודה שממנה הגיע.
  </>,
  <>בתחתית — היתרה: ההפרש בין שני הצדדים, כלומר מצב החשבון עכשיו.</>,
];

const Lines = ({ lines }: { lines: ReactNode[] }) => (
  <ul className="list-disc space-y-1 ps-5 marker:text-subtle">
    {lines.map((r, i) => (
      <li key={i}>{r}</li>
    ))}
  </ul>
);

/** The first T-account of the course: the full explanation, before it is shown. */
export function TIntro() {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] leading-relaxed text-fg/90">
      <p className="mb-1.5 font-bold text-fg">הכירו: כרטיס T</p>
      <Lines lines={T_INTRO} />
    </div>
  );
}

/**
 * The heading over T-accounts — "כרטיס T" or "כרטיסי T". As a reminder, the term itself opens what a T-account is, short:
 * on hover, on keyboard focus, or a tap — unless the screen has just explained it (`help={false}`).
 */
export function THead({ n = 1, help = true }: { n?: number; help?: boolean }) {
  const term = n > 1 ? "כרטיסי T" : "כרטיס T";
  if (!help) return <p className="mb-1.5 text-[13px] font-bold text-fg">{term}</p>;
  return (
    <div className="mb-1.5">
      <div tabIndex={0} className="group relative inline-block cursor-help rounded text-[13px] font-bold text-fg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
        <span className="border-b-2 border-dotted border-accent/70">{term}</span>
        <div
          role="tooltip"
          className="invisible absolute start-0 top-full z-20 mt-1.5 w-72 max-w-[80vw] rounded-xl border border-line bg-surface px-3.5 py-3 text-[13.5px] font-normal leading-relaxed text-fg/90 opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
        >
          <span className="mb-1 block font-bold text-fg">מה זה כרטיס T?</span>
          <Lines lines={T_SHORT} />
        </div>
      </div>
    </div>
  );
}

/**
 * A T-account as it is drawn by hand: debits on the right, credits on the left,
 * each posting with the number of its entry, and the balance underneath. The
 * postings of entry `fresh` light up as they land; `totals` adds each side's sum.
 * Each posting is marked (data-account, data-side, data-ref) for arrows to find.
 */
export function TBox({ t, fresh, openingLabel = "י.פ", totals, className }: { t: TAccount; fresh?: string; openingLabel?: string; totals?: boolean; className?: string }) {
  const open = (side: "dr" | "cr"): Posting[] => ((side === "dr" ? t.opening > 0 : t.opening < 0) ? [{ ref: openingLabel, amount: Math.abs(t.opening) }] : []);
  const dr = [...open("dr"), ...t.dr];
  const cr = [...open("cr"), ...t.cr];
  const sum = (xs: Posting[]) => xs.reduce((s, p) => s + p.amount, 0);
  const col = (xs: Posting[], side: "dr" | "cr") => (
    <div data-side={side} className={cn("min-h-[4.25rem] min-w-0 pt-1", side === "dr" ? "border-e-2 border-fg/75 pe-1" : "ps-1")}>
      <p className={cn("px-1 text-[10.5px] font-bold", side === "dr" ? "text-debit" : "text-credit")}>{side === "dr" ? "חובה" : "זכות"}</p>
      <ul>
        {xs.map((p, k) => (
          <li
            key={k}
            data-ref={p.ref}
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
    <figure data-account={t.account} className={cn("min-w-0 rounded-xl border border-line bg-surface pb-2", className)}>
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
      {/* The balance under the side it sits on: a debit balance under חובה (right), a credit balance under זכות (left); a zero balance across both. */}
      <div className="mx-2 mt-1.5 grid grid-cols-2 gap-1">
        <p
          className={cn(
            "flex flex-col items-center rounded-lg px-1.5 py-1 text-center leading-tight",
            b > 0 ? "col-start-1 bg-debit/10 text-debit" : b < 0 ? "col-start-2 bg-credit/10 text-credit" : "col-span-2 bg-surface-2 text-muted",
          )}
        >
          <span className="text-[10.5px] font-semibold">יתרה</span>
          <span className="text-[12.5px] font-bold whitespace-nowrap">
            {b === 0 ? "0 · מאופס" : <Money v={Math.abs(b)} plain />} {b > 0 ? "ח׳" : b < 0 ? "ז׳" : ""}
          </span>
        </p>
      </div>
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
  help,
  inline,
}: {
  entries: Entry[];
  at: number;
  opening?: Balances;
  openingLabel?: string;
  accounts?: string[];
  title?: ReactNode;
  note?: ReactNode | null;
  hl?: string[];
  /** The reminder of how entry and cards meet; off where the screen has just explained it. */
  help?: boolean;
  /** The cards on the page, not behind a button: where they are what the screen is about. */
  inline?: boolean;
}) {
  const entry = entries[at];
  const book = ledger(entries.slice(0, at + 1), opening);
  const shown = (accounts ?? [...new Set(entry.lines.map((l) => l.account))]).map((a) => book.find((t) => t.account === a)!);
  return <EntryCards entry={<JE entry={entry} title={title} note={note} hl={hl} />} cards={shown} fresh={entry.id} openingLabel={openingLabel} help={help} inline={inline} />;
}

/**
 * The layout of a posting: the entry, and the cards it moved behind a button that opens them in a window. `inline` keeps
 * the cards on the page beside the entry (stacked on narrow screens), where the cards are the point.
 */
export function EntryCards({
  entry,
  cards,
  fresh,
  openingLabel,
  help = true,
  inline,
}: {
  entry: ReactNode;
  cards: TAccount[];
  fresh?: string;
  openingLabel?: string;
  help?: boolean;
  inline?: boolean;
}) {
  if (!inline)
    return (
      <div className="space-y-2">
        {entry}
        <TCardsDialog cards={cards} fresh={fresh} openingLabel={openingLabel} help={help} />
      </div>
    );
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {entry}
      <div className="min-w-0">
        <THead n={cards.length} help={help} />
        <div className={cn("grid content-start gap-2.5", cards.length > 1 && "grid-cols-2")}>
          {cards.map((t) => (
            <TBox key={t.account} t={t} fresh={fresh} openingLabel={openingLabel} />
          ))}
        </div>
      </div>
    </div>
  );
}
