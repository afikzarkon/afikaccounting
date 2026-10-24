import { CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { type GrossProfitStatement, type PeriodResult, statement } from "@/lib/learn/inventory";
import { statementTable, type TraceStep, type TraceTable } from "@/lib/learn/inventory-explain";
import { cn } from "@/lib/utils";
import { Money, Scroller } from "./ui";

// Shared by the chapters (server) and the calculator (client): no hooks here.

/** A table from the engine's working: numbers formatted, struck-out rows for what stays outside cost. */
export function TraceTableView({ t }: { t: TraceTable }) {
  const showHead = t.head.some(Boolean);
  const numeric = t.head.map((_, i) => i > 0 && [...t.rows, ...(t.foot ? [t.foot] : [])].some((r) => typeof r[i] === "number"));
  const cell = (c: TraceTable["rows"][number][number]) => (c === null ? "" : typeof c === "number" ? <Money v={c} plain /> : c);
  return (
    <Scroller caption={t.caption}>
      <table className="w-full min-w-[28rem] text-sm" aria-label={t.caption}>
        {showHead && (
          <thead>
            <tr className="text-xs text-muted">
              {t.head.map((h, i) => (
                <th key={i} scope="col" className={cn("px-3 py-2 font-medium whitespace-nowrap", numeric[i] ? "text-end" : "text-start")}>
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
                  <td key={i} className={cn("px-3 py-1.5", numeric[i] ? "text-end" : "text-start", !struck && "text-fg", i === 0 && "min-w-[8rem]")}>
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
                <td key={i} className={cn("px-3 py-2 text-fg", numeric[i] ? "text-end" : "text-start")}>
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
      {s.formula && (
        <div className="space-y-1 rounded-lg bg-surface-2/70 px-3 py-2 text-[14.5px] font-medium text-fg ring-1 ring-accent/25">
          {s.formula.map((f, i) => (
            <p key={i} className="num">
              {f}
            </p>
          ))}
        </div>
      )}
      {s.tables?.map((t, i) => <TraceTableView key={i} t={t} />)}
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
