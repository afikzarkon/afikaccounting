"use client";

import { Eye, EyeOff, Flag } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lesson 7's revaluation time lines: one asset's story, told twice. The top
 * lane is the subsidiary's books, the lane under it the group's; the group's
 * lane starts on the acquisition date, marked across both. Each date shows the
 * asset's value in each lane (the givens). What each records, profit or loss
 * or other comprehensive income, and the consolidation adjustment between
 * them, open on a button, so the picture never gives the solution away.
 * Earlier is on the right, as Hebrew reads. Every number comes in as a prop,
 * from the solver; the adjustment is the group's split less the subsidiary's.
 */

export type RevalCell = { value?: number; text?: ReactNode; pl?: number; oci?: number };
export type RevalEvent = { date: string; what: ReactNode; acq?: boolean; sub: RevalCell; group: RevalCell | "none" };

const fmt = (v: number) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(Math.round(v)).toLocaleString("en-US");
const Num = ({ children }: { children: ReactNode }) => (
  <bdi dir="ltr" className="num whitespace-nowrap">
    {children}
  </bdi>
);

const PL = "var(--debit)";
const OCI = "var(--credit)";

function Chip({ kind, v }: { kind: "pl" | "oci"; v: number }) {
  const color = kind === "pl" ? PL : OCI;
  return (
    <span className="flex w-full flex-col rounded-md border px-1.5 py-0.5 leading-tight" style={{ borderColor: color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}>
      <span className="whitespace-nowrap text-[10.5px] font-semibold" style={{ color }}>
        {kind === "pl" ? "רווח או הפסד" : "רווח כולל אחר"}
      </span>
      <span className="text-[13px] font-bold text-fg">
        <Num>{fmt(v)}</Num>
      </span>
    </span>
  );
}

function Chips({ c, open }: { c: RevalCell; open: boolean }) {
  if (!open) return null;
  const pl = c.pl ?? 0;
  const oci = c.oci ?? 0;
  if (!pl && !oci) return null;
  return (
    <span className="mt-1 flex flex-col gap-1">
      {pl !== 0 && <Chip kind="pl" v={pl} />}
      {oci !== 0 && <Chip kind="oci" v={oci} />}
    </span>
  );
}

function Cell({ c, open }: { c: RevalCell | "none"; open: boolean }) {
  if (c === "none") return <span className="block rounded-lg border border-dashed border-line-strong px-2 py-1.5 text-[12px] text-subtle">עוד לא בקבוצה</span>;
  return (
    <span className="block rounded-lg border border-line bg-surface px-2 py-1.5">
      {c.value !== undefined && (
        <span className="block text-[14px] font-bold text-fg">
          <Num>{c.value.toLocaleString("en-US")}</Num>
        </span>
      )}
      {c.text && <span className="block text-[12px] leading-snug text-muted">{c.text}</span>}
      <Chips c={c} open={open} />
    </span>
  );
}

function adjustment(e: RevalEvent) {
  if (e.group === "none") return null;
  const has = (c: RevalCell) => c.pl !== undefined || c.oci !== undefined;
  if (!has(e.sub) && !has(e.group)) return null;
  return { pl: (e.group.pl ?? 0) - (e.sub.pl ?? 0), oci: (e.group.oci ?? 0) - (e.sub.oci ?? 0) };
}

function Adjust({ e }: { e: RevalEvent }) {
  const a = adjustment(e);
  if (!a) return <span className="block" />;
  if (!a.pl && !a.oci) return <span className="block rounded-lg border border-accent/40 bg-accent-soft px-2 py-1.5 text-[12px] font-semibold text-fg">אין התאמה</span>;
  return (
    <span className="block rounded-lg border border-accent/40 bg-accent-soft px-2 py-1.5">
      <Chips c={a} open />
    </span>
  );
}

function AcqBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-fg">
      <Flag className="h-3 w-3" aria-hidden />
      יום הרכישה
    </span>
  );
}

export function RevalTimeline({ title, sub, group = "הקבוצה", events, label, note }: { title: ReactNode; sub: string; group?: string; events: RevalEvent[]; label: string; note?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const cols = { gridTemplateColumns: `4.25rem repeat(${events.length}, minmax(6rem, 1fr))` };
  const lanes: { name: string; cell: (e: RevalEvent) => ReactNode }[] = [
    { name: sub, cell: (e) => <Cell c={e.sub} open={open} /> },
    { name: group, cell: (e) => <Cell c={e.group} open={open} /> },
  ];
  return (
    <figure aria-label={label} className="my-4 space-y-3 rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="text-[14.5px] font-bold text-fg">{title}</figcaption>

      {/* Wide screens: a horizontal time line, one column a date, one row a company. */}
      <div className="hidden overflow-x-auto sm:block">
        <div className="grid gap-x-1 gap-y-2" style={cols}>
          <span />
          {events.map((e, i) => (
            <div key={i} className={cn("relative rounded-t-xl px-1 pt-1 text-center", e.acq && "bg-accent-soft")}>
              <div className="h-5">{e.acq && <AcqBadge />}</div>
              <div className="relative my-1.5 h-3.5">
                <span className={cn("absolute top-1/2 h-0.5 -translate-y-1/2 bg-line-strong", i === 0 ? "start-1/2 end-0" : i === events.length - 1 ? "start-0 end-1/2" : "inset-x-0")} />
                <span className={cn("absolute top-0 h-3.5 w-3.5 rounded-full border-2 border-accent rtl:translate-x-1/2 ltr:-translate-x-1/2", e.acq ? "bg-accent" : "bg-surface")} style={{ insetInlineStart: "50%" }} />
              </div>
              <div className="text-[13px] font-bold text-fg">
                <Num>{e.date}</Num>
              </div>
              <div className="text-[12px] leading-snug text-muted">{e.what}</div>
            </div>
          ))}
          {lanes.map((l) => (
            <Fragment key={l.name}>
              <span className="self-center text-[13px] font-bold text-fg">{l.name}</span>
              {events.map((e, i) => (
                <div key={i} className={cn("px-1", e.acq && "bg-accent-soft")}>
                  {l.cell(e)}
                </div>
              ))}
            </Fragment>
          ))}
          {open && (
            <>
              <span className="self-center text-[13px] font-bold text-accent">ההתאמה במאוחד</span>
              {events.map((e, i) => (
                <div key={i} className={cn("px-1 pb-1", e.acq && "rounded-b-xl bg-accent-soft")}>
                  <Adjust e={e} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Phones: the same story, top to bottom. */}
      <ol className="space-y-2 border-s-2 border-line-strong ps-3 sm:hidden">
        {events.map((e, i) => (
          <li key={i} className={cn("relative rounded-xl p-2", e.acq && "bg-accent-soft")}>
            <span className={cn("absolute -start-[1.27rem] top-3 h-3.5 w-3.5 rounded-full border-2 border-accent", e.acq ? "bg-accent" : "bg-surface")} aria-hidden />
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-bold text-fg">
                <Num>{e.date}</Num>
              </span>
              {e.acq && <AcqBadge />}
              <span className="text-[12px] text-muted">{e.what}</span>
            </div>
            <div className="grid grid-cols-[4.5rem_1fr] items-start gap-x-2 gap-y-1.5">
              {lanes.map((l) => (
                <Fragment key={l.name}>
                  <span className="pt-1.5 text-[12.5px] font-bold text-fg">{l.name}</span>
                  {l.cell(e)}
                </Fragment>
              ))}
              {open && adjustment(e) && (
                <>
                  <span className="pt-1.5 text-[12.5px] font-bold text-accent">ההתאמה</span>
                  <Adjust e={e} />
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-[13.5px] font-semibold text-fg hover:bg-accent-soft"
        >
          {open ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {open ? "הסתירו מה כל חברה רושמת" : "מה כל חברה רושמת, ומה ההתאמה?"}
        </button>
        {!open && <span className="text-[12.5px] text-subtle">נסו קודם לבד.</span>}
      </div>
      {open && note && <p className="text-[13px] text-muted">{note}</p>}
    </figure>
  );
}
