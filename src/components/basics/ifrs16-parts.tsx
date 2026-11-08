import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { IasQuiz } from "./ias19-quiz";
import type { QuizItem } from "./inventory-interactive";

/** What the leases course's screens share. */

export const quiz = (chapter: string, items: QuizItem[]) => <IasQuiz prefix="ifrs16" chapter={chapter} items={items} />;

/** A paragraph on one idea. */
export const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;

/** A term with where it comes from: a bare paragraph number reads "סעיף 12"; ב14 or נספח א׳ stand as they are. */
export function T16({ he, par }: { he: string; par?: string }) {
  return (
    <span>
      <strong className="font-semibold text-fg">{he}</strong>
      {par && (
        <span className="text-[0.92em] text-muted">
          {" "}
          ({/^\d/.test(par) ? `סעיף ${par}` : par})
        </span>
      )}
    </span>
  );
}

type Cell = ReactNode | number;
const cell = (c: Cell) => (typeof c === "number" ? <bdi dir="ltr" className="num whitespace-nowrap">{c < 0 ? `(${Math.round(-c).toLocaleString("en-US")})` : Math.round(c).toLocaleString("en-US")}</bdi> : c);

/** A table of figures that fits a phone: no minimum width, so the numbers stay in view without scrolling sideways. Amounts show in whole shekels. */
export function Tbl({ head, rows, foot }: { head: string[]; rows: Cell[][]; foot?: Cell[] }) {
  const numeric = head.map((_, i) => i > 0 && [...rows, ...(foot ? [foot] : [])].some((r) => typeof r[i] === "number"));
  const side = (i: number) => (numeric[i] ? "text-end" : "text-start");
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line">
      <table className="w-full text-[13.5px] sm:text-sm">
        <thead>
          <tr className="text-xs text-muted">
            {head.map((h, i) => (
              <th key={i} className={`px-2 py-1.5 font-medium sm:px-3 ${side(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="align-top">
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-line/70">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-1.5 sm:px-3 ${side(i)}`}>
                  {cell(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr className="border-t-2 border-line font-bold text-fg">
              {foot.map((c, i) => (
                <td key={i} className={`px-2 py-1.5 sm:px-3 ${side(i)}`}>
                  {cell(c)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** The whole solution, in one box that opens once. */
export function FullSolution({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface-2/40 p-3.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        <span className="group-open:hidden">הצגת הפתרון המלא</span>
        <span className="hidden group-open:inline">הסתרת הפתרון</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
