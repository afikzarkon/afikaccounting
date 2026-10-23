import { DataTable } from "@/components/study/blocks";
import type { RevaluationResult } from "@/lib/learn/revaluation";

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Year by year: the charge, what the cost model would have charged, the transfer and the surplus. */
export function RevSchedule({ r, caption, from }: { r: RevaluationResult; caption: string; from?: number }) {
  const rows = r.rows.filter((row) => from === undefined || row.year >= from);
  return (
    <DataTable
      caption={caption}
      head={["שנה", "יתרת פתיחה", "פחת", "פחת לפי מודל העלות", "פער הערכה", "העברה לעודפים", "יתרה בספרים", "יתרת הקרן"]}
      rows={rows.map((row) => [
        <span key="y" className="num font-semibold">
          {row.year}
        </span>,
        r2(row.opening),
        r2(row.dep),
        r2(row.costDep),
        row.revaluation ? r2(row.revaluation) : "—",
        row.transfer ? r2(row.transfer) : "—",
        r2(row.closing),
        r2(row.surplus) + 0,
      ])}
      highlight={rows.map((row, i) => (row.revaluation ? i : -1)).filter((i) => i >= 0)}
    />
  );
}
