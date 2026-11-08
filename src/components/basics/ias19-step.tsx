import type { ReactNode } from "react";
import { DataTable } from "@/components/study/blocks";
import type { BkLine, BkNote, BkStep } from "@/lib/learn/ias19-booklet";
import { Ltr } from "./ias19-formula";
import { rich } from "./ias19-rich";
import { RollForward } from "./ias19-ui";

/**
 * One step of a worked IAS 19 solution, as the course writes it: its text, its
 * tables, a note per line (what is computed, the numbers, the result), and the
 * movement tables. Shared by the booklet questions and the calculator.
 */

const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;

const nf = (x: number, d: number) => x.toLocaleString("en-US", { maximumFractionDigits: d });

function value(l: BkLine) {
  if (l.value === undefined) return null;
  switch (l.unit) {
    case "%":
      return `${nf(l.value, 3)}%`;
    case "ימים":
    case "שנים":
      return nf(l.value, 2);
    case "₪":
      return `${nf(Math.round(l.value), 0)} ₪`;
    default:
      return nf(l.value, 2);
  }
}

/** A table cell: a formula (an operator, no Hebrew words) reads left to right; anything else is left as it is. */
export const cell = (c: string | number) =>
  typeof c === "string" && /[×÷=−^]/.test(c) && !/[֐-׿]/.test(c) ? (
    <bdi dir="ltr" className="num">
      <Ltr>{c}</Ltr>
    </bdi>
  ) : (
    c
  );

/** A note as a table: what is computed, the calculation with the numbers, and the result — one row per line. */
export function Note({ n }: { n: BkNote }) {
  return (
    <div className="space-y-2">
      <p className="text-[15px] font-bold">{n.title}</p>
      {n.text && <p className="text-[14.5px] leading-relaxed text-fg/85">{rich(n.text)}</p>}
      <div className="scroll-x rounded-xl border border-line">
        <table className="w-full min-w-[32rem] text-[14px]">
          <thead>
            <tr className="bg-surface-2/70 text-[12.5px] text-muted">
              <th className="px-3 py-2 text-start font-medium">מה מחשבים</th>
              <th className="px-3 py-2 text-start font-medium">חישוב</th>
              <th className="px-3 py-2 text-end font-medium">תוצאה</th>
            </tr>
          </thead>
          <tbody>
            {n.lines.map((l, i) => (
              <tr key={i} className="border-t border-line/70 align-top">
                <td className="px-3 py-2 font-semibold text-fg">
                  {l.label}
                  {l.how && <span className="block text-[12.5px] font-normal text-muted">{l.how}</span>}
                </td>
                <td className="px-3 py-2 text-fg">
                  {l.calc ? (
                    <bdi dir="ltr" className="num">
                      <Ltr>{l.calc}</Ltr>
                    </bdi>
                  ) : (
                    l.text
                  )}
                </td>
                <td className="px-3 py-2 text-end font-bold whitespace-nowrap text-fg">
                  {l.value !== undefined && (
                    <>
                      <bdi dir="ltr" className="num">
                        {value(l)}
                      </bdi>
                      {(l.unit === "ימים" || l.unit === "שנים") && <> {l.value === 1 ? (l.unit === "ימים" ? "יום" : "שנה") : l.unit}</>}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Step({ s }: { s: BkStep }) {
  return (
    <div className="space-y-3">
      {s.text?.map((t) => (
        <P key={t}>{rich(t)}</P>
      ))}
      {s.tables?.map((t, i) => (
        <DataTable key={i} caption={t.title} head={t.head} rows={t.rows.map((row) => row.map(cell))} foot={t.foot?.map(cell)} />
      ))}
      {s.notes?.map((n, i) => (
        <Note key={i} n={n} />
      ))}
      {s.rolls?.map((r) => (
        <RollForward key={r.title} title={r.title} unit={r.unit} side={r.side} pnTo={r.pnTo} rows={r.rows.map((row) => ({ label: row.label, value: row.value, how: row.note, kind: row.kind }))} />
      ))}
    </div>
  );
}

