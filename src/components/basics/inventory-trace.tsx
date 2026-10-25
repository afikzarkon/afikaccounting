import { ArrowLeft, CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { type GrossProfitStatement, type PeriodResult, statement } from "@/lib/learn/inventory";
import { type FlowBox, statementTable, type TraceStep, type TraceTable } from "@/lib/learn/inventory-explain";
import { cn } from "@/lib/utils";
import { Money, Scroller } from "./ui";

// Shared by the chapters (server) and the calculator (client): no hooks here.

const HEBREW = /[֐-׿]/;

/** A table from the engine's working: numbers formatted, struck-out rows for what stays outside cost. */
export function TraceTableView({ t }: { t: TraceTable }) {
  const showHead = t.head.some(Boolean);
  const numeric = t.head.map((_, i) => i > 0 && [...t.rows, ...(t.foot ? [t.foot] : [])].some((r) => typeof r[i] === "number"));
  const cell = (c: TraceTable["rows"][number][number]) => (c === null ? "" : typeof c === "number" ? <Money v={c} plain /> : c);
  const hl = (i: number) => t.hlCols?.includes(i) && "bg-accent-soft font-semibold text-fg";
  return (
    <Scroller caption={t.caption}>
      <table className="w-full min-w-[28rem] text-sm" aria-label={t.caption}>
        {showHead && (
          <thead>
            {t.groups && (
              <tr className="text-xs">
                {t.groups.map((g, i) => {
                  return (
                    <th key={i} scope="colgroup" colSpan={g.span} className={cn("border-b border-line px-3 pt-2 pb-1 text-center font-semibold", i > 0 && "border-s", g.tone === "accent" ? "bg-accent text-accent-fg" : "text-fg")}>
                      {g.label}
                    </th>
                  );
                })}
              </tr>
            )}
            <tr className="text-xs text-muted">
              {t.head.map((h, i) => (
                <th key={i} scope="col" className={cn("px-3 py-2 font-medium whitespace-nowrap", numeric[i] ? "text-end" : "text-start", hl(i))}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {t.rows.map((r, ri) => {
            const struck = t.strike?.includes(ri);
            return (
              <tr key={ri} className={cn("border-t border-line/70", struck && "text-muted line-through decoration-muted/70", t.highlight?.includes(ri) && "bg-accent-soft/60")}>
                {r.map((c, i) => (
                  <td key={i} className={cn("px-3 py-1.5", numeric[i] ? "text-end" : "text-start", !struck && "text-fg", i === 0 && "min-w-[8rem]", hl(i))}>
                    {cell(c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {t.foot && (
          <tfoot>
            <tr className="border-t-2 border-line-strong font-semibold">
              {t.foot.map((c, i) => (
                <td key={i} className={cn("px-3 py-2 text-fg", numeric[i] ? "text-end" : "text-start", hl(i))}>
                  {cell(c)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </Scroller>
  );
}

/** One step of a solution: what is done, the formula with numbers, the table, the checks. */
export function TraceStepView({ s, n, children }: { s: TraceStep; n?: number; children?: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
        {n !== undefined && <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{n}</span>}
        <span>{s.title}</span>
        {s.rules?.map((r) => (
          <span key={r} className="num rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {r}
          </span>
        ))}
      </p>
      {s.text.map((t, i) => (
        <p key={i} className="text-[14.5px] leading-relaxed text-fg/90">
          {t}
        </p>
      ))}
      {s.walk && (
        <ol className="space-y-1.5 rounded-lg border border-line bg-surface px-3 py-2.5">
          {s.walk.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] leading-relaxed text-fg">
              <span className="num mt-0.5 shrink-0 text-xs font-bold text-accent">{i + 1}.</span>
              <span className="min-w-0">{w}</span>
            </li>
          ))}
        </ol>
      )}
      {s.formula && (
        <div className="space-y-1 rounded-lg bg-surface-2/70 px-3 py-2 text-[14.5px] font-medium text-fg ring-1 ring-accent/25">
          {s.formula.map((f, i) => (
            // A line of pure math reads left to right; one with Hebrew words follows the page.
            <p key={i} dir={HEBREW.test(f) ? undefined : "ltr"} className={cn("num", HEBREW.test(f) ? "text-start" : "text-end")}>
              {f}
            </p>
          ))}
        </div>
      )}
      {s.tables?.map((t, i) => <TraceTableView key={i} t={t} />)}
      {s.flow?.map((f, i) => <FlowStrip key={i} boxes={f} />)}
      {s.checks && (
        <ul className="space-y-1">
          {s.checks.map((c, i) => (
            <li key={i} className={cn("flex items-start gap-2 text-[13.5px]", c.ok ? "text-fg" : "text-danger")}>
              {c.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="תקין" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-label="לבדיקה" />}
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

/** A number's way from the data to the answer: boxes joined by arrows, read from the right. */
export function FlowStrip({ boxes, label }: { boxes: FlowBox[]; label?: string }) {
  return (
    <div role="group" aria-label={label ?? boxes.map((b) => `${b.label} ${b.value}`).join(", ")} className="flex flex-wrap items-stretch gap-1.5">
      {boxes.map((b, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ArrowLeft className="h-4 w-4 shrink-0 text-accent" aria-hidden />}
          <span className={cn("rounded-lg border px-2.5 py-1.5 text-[13px]", b.tone === "accent" ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface-2/70 text-fg")}>
            <span className="block leading-tight">{b.label}</span>
            {b.value && <bdi dir="ltr" className="num block font-semibold leading-tight">{b.value}</bdi>}
          </span>
        </span>
      ))}
    </div>
  );
}

/** A whole solution, step after step. */
export function TraceView({ steps, numbered = true }: { steps: TraceStep[]; numbered?: boolean }) {
  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.id + i} className="rounded-xl border border-line bg-surface p-4">
          <TraceStepView s={s} n={numbered ? i + 1 : undefined} />
        </li>
      ))}
    </ol>
  );
}

/** The statement down to gross profit, in the course's layout. */
export function GrossProfitStatementView({ s, r, caption }: { s?: GrossProfitStatement; r?: PeriodResult; caption?: string }) {
  const st = s ?? statement(r!);
  return <TraceTableView t={statementTable(st, caption)} />;
}
