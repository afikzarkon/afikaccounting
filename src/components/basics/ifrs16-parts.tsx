import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { ShownYear, StatementSection } from "@/lib/learn/ifrs16";
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
const cell = (c: Cell) => (typeof c === "number" ? <bdi dir="ltr" className="num whitespace-nowrap">{(Math.round(c) + 0).toLocaleString("en-US")}</bdi> : c);

/** A table of figures that fits a phone: no minimum width, so the numbers stay in view without scrolling sideways. Amounts show in whole shekels. `dense` is for a table of several years. */
export function Tbl({ head, rows, foot, dense }: { head: string[]; rows: Cell[][]; foot?: Cell[]; dense?: boolean }) {
  const numeric = head.map((_, i) => i > 0 && [...rows, ...(foot ? [foot] : [])].some((r) => typeof r[i] === "number"));
  const side = (i: number) => (numeric[i] ? "text-right" : "text-start");
  const pad = dense ? "px-1 py-1.5 sm:px-3" : "px-2 py-1.5 sm:px-3";
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line">
      <table className={`w-full sm:text-sm ${dense ? "text-[12.5px]" : "text-[13.5px]"}`}>
        <thead>
          <tr className="text-xs text-muted">
            {head.map((h, i) => (
              <th key={i} className={`${pad} font-medium ${side(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="align-top">
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-line/70">
              {r.map((c, i) => (
                <td key={i} className={`${pad} ${side(i)}`}>
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
                <td key={i} className={`${pad} ${side(i)}`}>
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

const yearHead = (rows: { year: number }[]) => rows.map((y) => `שנה ${y.year}`);

/** The liability's roll-forward, a column a year, as a worksheet writes it: credit is minus, debit is plus. When the payment falls on 1.1 it comes before the year's interest, which is reckoned on what is left. */
export function LiabilityCycle({ rows }: { rows: ShownYear[] }) {
  const earlyPay = rows.some((y) => y.paidAtStart);
  const latePay = rows.some((y) => y.paidAtEnd);
  return (
    <Tbl
      dense
      head={["התחייבות החכירה", ...yearHead(rows)]}
      rows={[
        ["יתרה ב-1.1", ...rows.map((y) => -y.opening)],
        ...(earlyPay ? [["תשלום 1.1", ...rows.map((y) => y.paidAtStart)]] : []),
        ["ריבית", ...rows.map((y) => -y.interest)],
        ...(latePay ? [["תשלום 31.12", ...rows.map((y) => y.paidAtEnd)]] : []),
      ]}
      foot={["יתרה ב-31.12", ...rows.map((y) => -y.closing)]}
    />
  );
}

/** The asset's roll-forward, a column a year. */
export function AssetCycle({ rows, cost }: { rows: ShownYear[]; cost: number }) {
  return (
    <Tbl
      dense
      head={["נכס זכות שימוש", ...yearHead(rows)]}
      rows={[
        ["יתרה ב-1.1", ...rows.map((y, i) => (i ? rows[i - 1].rightOfUse : cost))],
        ["פחת", ...rows.map((y) => -y.depreciation)],
      ]}
      foot={["יתרה ב-31.12", ...rows.map((y) => y.rightOfUse)]}
    />
  );
}

/** "The relevant lines in the statements": profit or loss, then financial position, a column a year. */
export function StatementTables({ sections, years: yearNumbers }: { sections: StatementSection[]; years?: number[] }) {
  return (
    <>
      {sections.map((s) => {
        const years = s.rows[0].values.map((_, i) => `שנה ${yearNumbers?.[i] ?? i + 1}`);
        const last = s.rows.at(-1)!;
        const totalled = last.id === "total";
        return <Tbl key={s.title} dense head={[s.title, ...years]} rows={(totalled ? s.rows.slice(0, -1) : s.rows).map((r) => [r.label, ...r.values])} foot={totalled ? [last.label, ...last.values] : undefined} />;
      })}
    </>
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
