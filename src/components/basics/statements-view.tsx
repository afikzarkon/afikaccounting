import type { DisplayRow, DisplayStatement } from "@/lib/learn/statements";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

// Shared by the server chapters: no hooks here.

type Numbered = { row: Exclude<DisplayRow, { kind: "head" }>; n: number };

/** Numbers every line and total of a statement, top to bottom, for the explanations to point at. */
function numbered(st: DisplayStatement): Numbered[] {
  let n = 0;
  return st.rows.flatMap((row) => (row.kind === "head" ? [] : [{ row, n: ++n }]));
}

/** The statement as it is presented: the company, the statement and its date, a note column and a column per year. */
export function StatementTable({ st, anchor }: { st: DisplayStatement; anchor: string }) {
  const nums = new Map(numbered(st).map(({ row, n }) => [row, n]));
  const cols = st.years.length;
  return (
    <figure className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-card">
      <figcaption className="border-b border-line bg-surface-2/60 px-4 py-3 text-center">
        <p className="text-[15px] font-bold text-fg">{st.company}</p>
        <p className="text-[14px] font-semibold text-fg">{st.title}</p>
        <p className="text-[13px] text-muted">{st.date}</p>
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] text-[13.5px]">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-start font-medium">
                <span className="sr-only">סעיף</span>
              </th>
              <th scope="col" className="w-12 px-2 py-2 text-center font-medium">
                ביאור
              </th>
              {st.years.map((y) => (
                <th key={y} scope="col" className="w-28 px-3 py-2 text-end font-semibold text-fg">
                  {y}
                  <span className="block text-[10.5px] font-normal text-muted">ש״ח</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {st.rows.map((row, i) => {
              if (row.kind === "head")
                return (
                  <tr key={i}>
                    <th scope="rowgroup" colSpan={2 + cols} className="px-3 pt-3 pb-1 text-start text-[13.5px] font-bold text-fg underline decoration-line-strong underline-offset-4">
                      {row.label}
                    </th>
                  </tr>
                );
              const n = nums.get(row)!;
              const total = row.kind === "total";
              const grand = total && row.level === "grand";
              const cell = cn("px-3 py-1.5 text-end align-top", total && "font-semibold", grand && "border-b-[3px] border-double border-fg/60");
              return (
                <tr key={i} className={cn(total && "border-t border-fg/40", grand && "bg-accent-soft/40")}>
                  <th scope="row" className={cn("px-3 py-1.5 text-start font-normal text-fg", total ? "font-semibold" : "ps-6")}>
                    <a href={`#${anchor}-${n}`} className="group inline-flex items-baseline gap-1.5 hover:text-accent">
                      <span className="num grid h-4 min-w-4 place-items-center rounded-full bg-surface-2 px-1 text-[10px] font-bold text-muted group-hover:bg-accent group-hover:text-accent-fg">{n}</span>
                      {row.label}
                    </a>
                  </th>
                  <td className="px-2 py-1.5 text-center align-top text-xs text-muted">{row.kind === "line" && row.note ? row.note : ""}</td>
                  <td className={cell}>
                    <Money v={row.amount} plain />
                  </td>
                  {cols > 1 && <td className={cn(cell, "text-muted")}>{row.prior !== undefined && <Money v={row.prior} plain />}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** Every line of the statement, in order: what goes into it — as a calculation — and why it sits there. */
export function LineByLine({ st, anchor }: { st: DisplayStatement; anchor: string }) {
  return (
    <ol className="space-y-2.5">
      {numbered(st).map(({ row, n }) => (
        <li key={n} id={`${anchor}-${n}`} className={cn("scroll-mt-32 rounded-xl border px-4 py-3", row.kind === "total" ? "border-accent/30 bg-accent-soft/30" : "border-line bg-surface")}>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold text-fg">
            <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-fg">{n}</span>
            <span className="min-w-0 flex-1">{row.label}</span>
            <Money v={row.amount} />
          </p>
          {row.kind === "line" && row.parts.length > 0 && (
            <table className="mt-2 w-full text-[13.5px]">
              <tbody>
                {row.parts.map((p, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pe-3 text-fg/85">
                      {i > 0 && <span className="me-1 text-muted">{p.amount < 0 ? "−" : "+"}</span>}
                      {p.label}
                    </td>
                    <td className="py-0.5 text-end">
                      <Money v={i > 0 ? Math.abs(p.amount) : p.amount} plain />
                    </td>
                  </tr>
                ))}
                {row.parts.length > 1 && (
                  <tr className="border-t border-line font-semibold">
                    <td className="pt-1 text-fg">= {row.label}</td>
                    <td className="pt-1 text-end">
                      <Money v={Math.abs(row.amount)} plain />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {row.kind === "total" && row.calc && <p className="mt-1.5 rounded-md bg-surface px-2.5 py-1 text-[13.5px] font-medium text-fg">{row.calc}</p>}
          {row.explain && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{row.explain}</p>}
        </li>
      ))}
    </ol>
  );
}

/** A statement and its explanation side by side: the statement stays in view while the lines are read. */
export function StatementWithLines({ st, anchor }: { st: DisplayStatement; anchor: string }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <StatementTable st={st} anchor={anchor} />
        <p className="mt-2 text-xs text-muted">לחצו על מספר של שורה כדי לקפוץ להסבר שלה.</p>
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-[15px] font-semibold text-fg">שורה אחרי שורה</p>
        <LineByLine st={st} anchor={anchor} />
      </div>
    </div>
  );
}

