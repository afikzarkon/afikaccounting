import type { ReactNode } from "react";
import { JournalEntry } from "@/components/study/blocks";
import { type Entry, isBalanced, type Statements, type TAccount, type TrialBalance, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

/** An amount in he-IL format; negatives in parentheses, as accountants write them. */
export const fmt = (v: number) => (v < 0 ? `(${nf.format(-v)})` : nf.format(v));

/** A shekel amount that stays left to right inside Hebrew text. */
export function Money({ v, plain, className }: { v: number; plain?: boolean; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("num whitespace-nowrap", className)}>
      {fmt(v)}
      {!plain && " ₪"}
    </bdi>
  );
}

/** A term on its first appearance: bold, with its English counterpart. */
export function Term({ he, en }: { he: string; en: string }) {
  return (
    <>
      <strong className="font-semibold text-fg">{he}</strong>{" "}
      <span className="text-[0.92em] text-muted">
        (<bdi dir="ltr">{en}</bdi>)
      </span>
    </>
  );
}

/** One chapter of the page. */
export function Chapter({ n, id, title, lead, children }: { n: number; id: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 lg:scroll-mt-24" data-chapter={id}>
      <div className="flex items-start gap-4">
        <span className="num grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">
          {n}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-fg">
            {title}
          </h2>
          <p className="mt-1 text-[15px] text-muted">{lead}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-fg/90 [&>p]:max-w-3xl">{children}</div>
    </section>
  );
}

/** A plain content card. */
export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("card min-w-0 p-5", className)}>
      {title && <p className="mb-2 text-[16px] font-semibold text-fg">{title}</p>}
      <div className="space-y-3 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </div>
  );
}

/** A journal entry from the model, through the shared journal-entry view. */
export function EntryView({ entry, title, note }: { entry: Entry; title?: string; note?: ReactNode }) {
  if (!isBalanced(entry)) throw new Error(`Unbalanced entry ${entry.id}`);
  return (
    <JournalEntry
      title={title ?? entry.text}
      date={entry.date || undefined}
      lines={entry.lines.map((l) => ({ account: l.account, dr: l.dr, cr: l.cr }))}
      note={note ?? entry.why}
    />
  );
}

/** A T-account: debits on the right, credits on the left, as in the course (right-to-left). */
export function TCard({ t, highlight }: { t: TAccount; highlight?: string }) {
  const rows = Math.max(t.dr.length, t.cr.length);
  const drTotal = t.opening > 0 ? t.opening : 0;
  const crTotal = t.opening < 0 ? -t.opening : 0;
  return (
    <figure className="min-w-0 rounded-xl border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-2 border-b-2 border-fg/70 px-3 py-2 text-sm font-semibold text-fg">
        <span>{t.account}</span>
        <span className="text-[11px] font-normal text-subtle">{TYPE_LABEL[typeOf(t.account)]}</span>
      </figcaption>
      <div className="grid grid-cols-2 text-[13px]">
        <div className="border-e-2 border-fg/70">
          <p className="px-2 pt-1 text-[11px] font-semibold text-debit">חובה</p>
          {t.opening > 0 && <Cell label="י.פ" v={drTotal} />}
          {Array.from({ length: rows }, (_, i) => (t.dr[i] ? <Cell key={i} label={t.dr[i].ref} v={t.dr[i].amount} on={t.dr[i].ref === highlight} /> : <Empty key={i} />))}
        </div>
        <div>
          <p className="px-2 pt-1 text-[11px] font-semibold text-credit">זכות</p>
          {t.opening < 0 && <Cell label="י.פ" v={crTotal} />}
          {Array.from({ length: rows }, (_, i) => (t.cr[i] ? <Cell key={i} label={t.cr[i].ref} v={t.cr[i].amount} on={t.cr[i].ref === highlight} /> : <Empty key={i} />))}
        </div>
      </div>
      <p
        className={cn(
          "flex items-center justify-between border-t border-line px-3 py-1.5 text-[13px] font-semibold",
          t.balance > 0 ? "text-debit" : t.balance < 0 ? "text-credit" : "text-muted",
        )}
      >
        <span>יתרת סגירה</span>
        <span>
          {t.balance === 0 ? "0" : <Money v={Math.abs(t.balance)} plain />} {t.balance > 0 ? "חובה" : t.balance < 0 ? "זכות" : ""}
        </span>
      </p>
    </figure>
  );
}

function Cell({ label, v, on }: { label: string; v: number; on?: boolean }) {
  return (
    <p className={cn("flex items-center justify-between gap-2 px-2 py-0.5", on && "rounded bg-accent-soft font-semibold text-fg")}>
      <span className="text-[11px] text-subtle">{label}</span>
      <Money v={v} plain />
    </p>
  );
}
const Empty = () => <p className="px-2 py-0.5">&nbsp;</p>;

/** A trial balance: every balance on its side, and the two totals. */
export function TBTable({ tb, caption, kind }: { tb: TrialBalance; caption?: string; kind?: boolean }) {
  return (
    <Scroller caption={caption}>
      <table className="w-full min-w-[26rem] text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="px-4 py-2 text-start font-medium">חשבון</th>
            {kind && <th className="px-4 py-2 text-start font-medium">סוג</th>}
            <th className="px-4 py-2 text-end font-medium text-debit">חובה</th>
            <th className="px-4 py-2 text-end font-medium text-credit">זכות</th>
          </tr>
        </thead>
        <tbody>
          {tb.rows.map((r) => (
            <tr key={r.account} className="border-t border-line/70">
              <td className="px-4 py-2 text-fg">{r.account}</td>
              {kind && <td className="px-4 py-2 text-xs text-muted">{TYPE_LABEL[typeOf(r.account)]}</td>}
              <td className="px-4 py-2 text-end">{r.dr ? <Money v={r.dr} plain /> : ""}</td>
              <td className="px-4 py-2 text-end">{r.cr ? <Money v={r.cr} plain /> : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line-strong font-semibold">
            <td className="px-4 py-2 text-fg">סה״כ</td>
            {kind && <td />}
            <td className="px-4 py-2 text-end text-debit">
              <Money v={tb.dr} plain />
            </td>
            <td className="px-4 py-2 text-end text-credit">
              <Money v={tb.cr} plain />
            </td>
          </tr>
        </tfoot>
      </table>
    </Scroller>
  );
}

/** A wide table's frame: it scrolls inside itself, never the page. */
export function Scroller({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-surface">
      {caption && <p className="border-b border-line bg-surface-2/70 px-4 py-2.5 text-sm font-semibold text-fg">{caption}</p>}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Profit or loss beside the balance sheet. */
export function StatementsView({ s, year }: { s: Statements; year: string }) {
  const block = (title: string, rows: [string, number][], total: string, value: number) => (
    <>
      <tr className="bg-surface-2/60">
        <td colSpan={2} className="px-4 py-1.5 text-xs font-semibold text-muted">
          {title}
        </td>
      </tr>
      {rows.map(([a, v]) => (
        <tr key={a} className="border-t border-line/60">
          <td className="px-4 py-1.5 ps-6 text-fg">{a}</td>
          <td className="px-4 py-1.5 text-end">
            <Money v={v} plain />
          </td>
        </tr>
      ))}
      <tr className="border-t border-line font-semibold">
        <td className="px-4 py-1.5 text-fg">{total}</td>
        <td className="px-4 py-1.5 text-end">
          <Money v={value} plain />
        </td>
      </tr>
    </>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Scroller caption={`דוח רווח או הפסד לשנת ${year}`}>
        <table className="w-full min-w-[18rem] text-sm">
          <tbody>
            {block("הכנסות", s.income, "סך ההכנסות", s.totalIncome)}
            {block("הוצאות", s.expenses, "סך ההוצאות", s.totalExpenses)}
            <tr className="border-t-2 border-line-strong font-semibold">
              <td className={cn("px-4 py-2", s.profit >= 0 ? "text-success" : "text-danger")}>{s.profit >= 0 ? "רווח השנה" : "הפסד השנה"}</td>
              <td className={cn("px-4 py-2 text-end", s.profit >= 0 ? "text-success" : "text-danger")}>
                <Money v={s.profit} />
              </td>
            </tr>
          </tbody>
        </table>
      </Scroller>
      <Scroller caption={`מאזן ליום 31.12.${year}`}>
        <table className="w-full min-w-[18rem] text-sm">
          <tbody>
            {block("נכסים", s.assets, "סך הנכסים", s.totalAssets)}
            {block("התחייבויות", s.liabilities, "סך ההתחייבויות", s.totalLiabilities)}
            {block("הון", s.equity, "סך ההון", s.totalEquity)}
            <tr className="border-t-2 border-line-strong font-semibold">
              <td className="px-4 py-2 text-fg">התחייבויות והון</td>
              <td className="px-4 py-2 text-end">
                <Money v={s.totalLiabilities + s.totalEquity} />
              </td>
            </tr>
          </tbody>
        </table>
      </Scroller>
    </div>
  );
}

/** A short highlighted rule. */
export function Rule({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border-s-4 border-accent bg-accent-soft px-4 py-3 text-[15.5px] font-medium text-fg">{children}</p>;
}
