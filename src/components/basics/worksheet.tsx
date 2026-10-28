import { balancesOf, isBalanceSheet, ledger, RONEN, round2, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money, Stepper } from "./ui";

const STAGES = [
  ["מאזן בוחן לפני התאמות", "נקודת הפתיחה של הגיליון: כל יתרה בצד שלה. העודפים (הפסדים צבורים, בחובה) הם עדיין יתרת הפתיחה של השנה."],
  ["פקודות התאמה", "חמש הפקודות של רונן. חשבונות חדשים נכנסים מתחת לקיימים. גם כאן סך החובה = סך הזכות."],
  ["מאזן בוחן סופי", "לכל חשבון: היתרה הראשונית ועוד ההתאמות, בצד הנכון."],
  ["סיווג", "לכל שורה: מאזני (נכס, התחייבות, הון) או תוצאתי (הכנסה, הוצאה)."],
  ["פיצול לעמודות", "כל יתרה סופית עוברת לעמודות התוצאתי או המאזני, באותו צד."],
  ["רווח השנה", "בעמודות התוצאתי: זכות פחות חובה. ההפרש הוא בדיוק מה שחסר כדי שעמודות המאזני יתאזנו."],
  ["עודפים — יתרת סגירה", "עודפי פתיחה ועוד רווח השנה. עם יתרת הסגירה, עמודות המאזני מתאזנות."],
] as const;

const ADJ = ledger(RONEN.adjustments);
const FINAL = balancesOf(ledger(RONEN.adjustments, RONEN.preliminary));
const S = statements(FINAL);
const RETAINED_CLOSE = -S.equity.find(([a]) => a === "עודפים")![1];
const ACCOUNTS = Object.keys(FINAL);
const NEW = new Set(ACCOUNTS.filter((a) => !(a in RONEN.preliminary)));

const side = (v: number) => ({ dr: v > 0 ? v : 0, cr: v < 0 ? -v : 0 });
const ROWS = ACCOUNTS.map((account) => {
  const t = ADJ.find((x) => x.account === account);
  const pre = RONEN.preliminary[account] ?? 0;
  const fin = FINAL[account];
  const bs = isBalanceSheet(account);
  const shown = account === "עודפים" ? RETAINED_CLOSE : fin;
  return {
    account,
    isNew: NEW.has(account),
    pre: side(pre),
    adj: { dr: round2((t?.dr ?? []).reduce((s, p) => s + p.amount, 0)), cr: round2((t?.cr ?? []).reduce((s, p) => s + p.amount, 0)) },
    fin: side(fin),
    bs,
    pl: bs ? { dr: 0, cr: 0 } : side(fin),
    sheet: bs ? side(fin) : { dr: 0, cr: 0 },
    sheetClosed: bs ? side(shown) : { dr: 0, cr: 0 },
  };
});
const sum = (pick: (r: (typeof ROWS)[number]) => number) => round2(ROWS.reduce((s, r) => s + pick(r), 0));
const plDr = sum((r) => r.pl.dr);
const plCr = sum((r) => r.pl.cr);

/** The column groups of the sheet; on a phone only the ones that belong to the current stage stay, so the table fits. */
const GROUP_OF_STAGE = [1, 2, 3, 4, 5, 5, 5];

function Sheet({ stage }: { stage: number }) {
  const show = (n: number) => stage >= n;
  const closed = stage >= 7;
  const now = GROUP_OF_STAGE[stage - 1];
  const vis = (g: number) => (g === now || (now === 4 && g === 3) ? "" : "max-sm:hidden");
  const Num = ({ v, hl }: { v: number; hl?: boolean }) => (v ? <Money v={v} plain className={cn(hl && "font-semibold text-accent")} /> : null);
  const pair = (p: { dr: number; cr: number }, key: string, g: number, hl?: boolean) => [
    <td key={`${key}d`} className={cn("border-s border-line/60 px-2 py-1.5 text-end", vis(g))}>
      <Num v={p.dr} hl={hl} />
    </td>,
    <td key={`${key}c`} className={cn("px-2 py-1.5 text-end", vis(g))}>
      <Num v={p.cr} hl={hl} />
    </td>,
  ];
  const head = (title: string, key: string, g: number) => (
    <th key={key} colSpan={2} className={cn("border-s border-line/60 px-2 py-1.5 text-center text-xs font-semibold text-fg", g === now && "bg-accent-soft", vis(g))}>
      {title}
    </th>
  );
  const sub = (key: string, g: number) => [
    <th key={`${key}d`} className={cn("border-s border-line/60 px-2 py-1 text-end text-[11px] font-medium text-debit", vis(g))}>
      חובה
    </th>,
    <th key={`${key}c`} className={cn("px-2 py-1 text-end text-[11px] font-medium text-credit", vis(g))}>
      זכות
    </th>,
  ];
  const totals = (dr: number, cr: number, key: string, g: number, warn?: boolean) => [
    <td key={`${key}d`} className={cn("border-s border-line/60 px-2 py-2 text-end", warn && "text-danger", vis(g))}>
      <Money v={dr} plain />
    </td>,
    <td key={`${key}c`} className={cn("px-2 py-2 text-end", warn && "text-danger", vis(g))}>
      <Money v={cr} plain />
    </td>,
  ];
  const sheetDr = sum((r) => (closed ? r.sheetClosed : r.sheet).dr);
  const sheetCr = sum((r) => (closed ? r.sheetClosed : r.sheet).cr);

  return (
    <>
      <p className="text-[15px]">{STAGES[stage - 1][1]}</p>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-[13px] sm:min-w-[52rem]">
          <thead className="bg-surface-2/40">
            <tr>
              <th rowSpan={2} className="px-3 py-1.5 text-start text-xs font-semibold text-fg">
                חשבון
              </th>
              {head("לפני התאמות", "h1", 1)}
              {show(2) && head("התאמות", "h2", 2)}
              {show(3) && head("מאזן בוחן סופי", "h3", 3)}
              {show(4) && (
                <th rowSpan={2} className={cn("border-s border-line/60 px-2 py-1.5 text-xs font-semibold text-fg", now === 4 && "bg-accent-soft", vis(4))}>
                  סיווג
                </th>
              )}
              {show(5) && head("תוצאתי", "h5", 5)}
              {show(5) && head("מאזני", "h6", 5)}
            </tr>
            <tr>
              {sub("s1", 1)}
              {show(2) && sub("s2", 2)}
              {show(3) && sub("s3", 3)}
              {show(5) && sub("s5", 5)}
              {show(5) && sub("s6", 5)}
            </tr>
          </thead>
          <tbody>
            {ROWS.filter((r) => !r.isNew || show(2)).map((r) => (
              <tr key={r.account} className={cn("border-t border-line/60", r.isNew && show(2) && "bg-accent-soft/40", r.account === "עודפים" && closed && "bg-success/[0.07]")}>
                <td className="px-3 py-1.5 text-fg sm:whitespace-nowrap">
                  {r.account}
                  {r.isNew && show(2) && <span className="ms-1.5 text-[10px] text-accent">חדש</span>}
                </td>
                {r.isNew ? [<td key="p1" className={cn("border-s border-line/60", vis(1))} />, <td key="p2" className={vis(1)} />] : pair(r.pre, "p", 1, stage === 1)}
                {show(2) && pair(r.adj, "a", 2, stage === 2)}
                {show(3) && pair(r.fin, "f", 3, stage === 3)}
                {show(4) && <td className={cn("border-s border-line/60 px-2 py-1.5 text-center text-xs text-muted", vis(4))}>{r.bs ? "מאזני" : "תוצאתי"}</td>}
                {show(5) && pair(r.pl, "l", 5)}
                {show(5) && pair(closed ? r.sheetClosed : r.sheet, "b", 5, r.account === "עודפים" && closed)}
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold">
            <tr className="border-t-2 border-line-strong">
              <td className="px-3 py-2 text-fg">סה״כ</td>
              {totals(sum((r) => r.pre.dr), sum((r) => r.pre.cr), "t1", 1)}
              {show(2) && totals(sum((r) => r.adj.dr), sum((r) => r.adj.cr), "t2", 2)}
              {show(3) && totals(sum((r) => r.fin.dr), sum((r) => r.fin.cr), "t3", 3)}
              {show(4) && <td className={cn("border-s border-line/60", vis(4))} />}
              {show(5) && totals(plDr, plCr, "t5", 5)}
              {show(5) && totals(sheetDr, sheetCr, "t6", 5, !closed)}
            </tr>
          </tfoot>
        </table>
      </div>
      {show(6) && (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="rounded-lg bg-surface-2/70 px-3 py-2">
            רווח השנה = הכנסות <Money v={plCr} /> − הוצאות <Money v={plDr} /> = <strong className="text-success">{<Money v={S.profit} />}</strong>
          </p>
          {closed ? (
            <p className="rounded-lg bg-success/[0.08] px-3 py-2 text-fg">
              עודפים: פתיחה <Money v={RONEN.preliminary["עודפים"]} /> (חובה) − רווח <Money v={S.profit} /> = סגירה <Money v={RETAINED_CLOSE} /> (חובה). עמודות המאזני מאוזנות.
            </p>
          ) : (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-fg">
              עמודות המאזני לא מאוזנות עדיין: ההפרש <Money v={Math.abs(sheetDr - sheetCr)} /> הוא בדיוק רווח השנה, שעוד לא נכנס לעודפים.
            </p>
          )}
        </div>
      )}
    </>
  );
}

/** Ronen's multi-column worksheet, one stage at a time: each stage adds its columns to the right of the last. */
export function Worksheet() {
  return <Stepper label="הגיליון הרב-טורי של רונן · 31.12.2017" steps={STAGES.map(([t], i) => ({ title: t, body: <Sheet stage={i + 1} /> }))} />;
}
