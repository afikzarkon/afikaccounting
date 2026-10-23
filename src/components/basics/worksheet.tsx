"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { balancesOf, isBalanceSheet, ledger, RONEN, round2, statements } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

const STAGES = [
  ["מאזן בוחן ראשוני", "מעתיקים כל יתרה לצד שלה. העודפים (הפסדים צבורים) בחובה — זו יתרת הפתיחה של השנה."],
  ["פקודות התאמה", "מוסיפים את חמש הפקודות. חשבונות חדשים נכנסים מתחת לקיימים. גם כאן סך החובה = סך הזכות."],
  ["מאזן בוחן סופי", "לכל חשבון: יתרה ראשונית ועוד ההתאמות, בצד הנכון. זה מאזן הבוחן המתוקן."],
  ["סיווג", "לכל שורה: מאזני (נכס, התחייבות, הון) או תוצאתי (הכנסה, הוצאה)."],
  ["פיצול לעמודות", "כל יתרה סופית עוברת לעמודות התוצאתי או המאזני, באותו צד. העודפים עוברים בינתיים כפי שהם."],
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

export function Worksheet() {
  const [stage, setStage] = useState(1);
  const show = (n: number) => stage >= n;
  const closed = stage >= 7;
  const Num = ({ v, hl }: { v: number; hl?: boolean }) => (v ? <Money v={v} plain className={cn(hl && "font-semibold text-accent")} /> : null);
  const pair = (p: { dr: number; cr: number }, key: string, hl?: boolean) => [
    <td key={`${key}d`} className="border-s border-line/60 px-2 py-1.5 text-end">
      <Num v={p.dr} hl={hl} />
    </td>,
    <td key={`${key}c`} className="px-2 py-1.5 text-end">
      <Num v={p.cr} hl={hl} />
    </td>,
  ];
  const head = (title: string, key: string) => (
    <th key={key} colSpan={2} className="border-s border-line/60 px-2 py-1.5 text-center text-xs font-semibold text-fg">
      {title}
    </th>
  );
  const sub = (key: string) => [
    <th key={`${key}d`} className="border-s border-line/60 px-2 py-1 text-end text-[11px] font-medium text-debit">
      חובה
    </th>,
    <th key={`${key}c`} className="px-2 py-1 text-end text-[11px] font-medium text-credit">
      זכות
    </th>,
  ];
  const totals = (dr: number, cr: number, key: string, warn?: boolean) => [
    <td key={`${key}d`} className={cn("border-s border-line/60 px-2 py-2 text-end", warn && "text-danger")}>
      <Money v={dr} plain />
    </td>,
    <td key={`${key}c`} className={cn("px-2 py-2 text-end", warn && "text-danger")}>
      <Money v={cr} plain />
    </td>,
  ];

  const sheetDr = sum((r) => (closed ? r.sheetClosed : r.sheet).dr);
  const sheetCr = sum((r) => (closed ? r.sheetClosed : r.sheet).cr);
  const plDr = sum((r) => r.pl.dr);
  const plCr = sum((r) => r.pl.cr);

  return (
    <div className="card overflow-hidden">
      <ol className="flex gap-1 overflow-x-auto border-b border-line bg-surface-2/50 p-2" aria-label="שלבי הגיליון">
        {STAGES.map(([t], i) => (
          <li key={t}>
            <button
              type="button"
              aria-current={stage === i + 1 ? "step" : undefined}
              onClick={() => setStage(i + 1)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium",
                stage === i + 1 ? "bg-accent text-accent-fg" : i < stage ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <span className="num">{i + 1}</span> {t}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex items-start gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-[15px] text-fg" aria-live="polite">
          <strong>
            שלב {stage}: {STAGES[stage - 1][0]}.
          </strong>{" "}
          {STAGES[stage - 1][1]}
        </p>
        <div className="flex shrink-0 gap-1">
          <button type="button" aria-label="השלב הקודם" disabled={stage === 1} onClick={() => setStage((s) => s - 1)} className="grid h-9 w-9 place-items-center rounded-lg ring-1 ring-line disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" aria-label="השלב הבא" disabled={stage === 7} onClick={() => setStage((s) => s + 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-fg disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[52rem] text-[13px]">
          <thead className="bg-surface-2/40">
            <tr>
              <th rowSpan={2} className="px-3 py-1.5 text-start text-xs font-semibold text-fg">
                חשבון
              </th>
              {head("מאזן בוחן ראשוני", "h1")}
              {show(2) && head("התאמות", "h2")}
              {show(3) && head("מאזן בוחן סופי", "h3")}
              {show(4) && (
                <th rowSpan={2} className="border-s border-line/60 px-2 py-1.5 text-xs font-semibold text-fg">
                  סיווג
                </th>
              )}
              {show(5) && head("תוצאתי", "h5")}
              {show(5) && head("מאזני", "h6")}
            </tr>
            <tr>
              {sub("s1")}
              {show(2) && sub("s2")}
              {show(3) && sub("s3")}
              {show(5) && sub("s5")}
              {show(5) && sub("s6")}
            </tr>
          </thead>
          <tbody>
            {ROWS.filter((r) => !r.isNew || show(2)).map((r) => (
              <tr key={r.account} className={cn("border-t border-line/60", r.isNew && show(2) && "bg-accent-soft/40", r.account === "עודפים" && closed && "bg-success/[0.07]")}>
                <td className="whitespace-nowrap px-3 py-1.5 text-fg">
                  {r.account}
                  {r.isNew && show(2) && <span className="ms-1.5 text-[10px] text-accent">חדש</span>}
                </td>
                {r.isNew ? [<td key="p1" className="border-s border-line/60" />, <td key="p2" />] : pair(r.pre, "p")}
                {show(2) && pair(r.adj, "a", stage === 2)}
                {show(3) && pair(r.fin, "f", stage === 3)}
                {show(4) && <td className="border-s border-line/60 px-2 py-1.5 text-center text-xs text-muted">{r.bs ? "מאזני" : "תוצאתי"}</td>}
                {show(5) && pair(r.pl, "l")}
                {show(5) && pair(closed ? r.sheetClosed : r.sheet, "b", r.account === "עודפים" && closed)}
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold">
            <tr className="border-t-2 border-line-strong">
              <td className="px-3 py-2 text-fg">סה״כ</td>
              {totals(sum((r) => r.pre.dr), sum((r) => r.pre.cr), "t1")}
              {show(2) && totals(sum((r) => r.adj.dr), sum((r) => r.adj.cr), "t2")}
              {show(3) && totals(sum((r) => r.fin.dr), sum((r) => r.fin.cr), "t3")}
              {show(4) && <td className="border-s border-line/60" />}
              {show(5) && totals(plDr, plCr, "t5")}
              {show(5) && totals(sheetDr, sheetCr, "t6", !closed)}
            </tr>
          </tfoot>
        </table>
      </div>
      {show(6) && (
        <div className="grid gap-2 border-t border-line p-4 text-sm sm:grid-cols-2">
          <p className="rounded-lg bg-surface-2/70 px-3 py-2">
            רווח השנה = הכנסות <Money v={plCr} /> − הוצאות <Money v={plDr} /> = <strong className="text-success">{<Money v={S.profit} />}</strong>
          </p>
          {closed ? (
            <p className="rounded-lg bg-success/[0.08] px-3 py-2 text-fg">
              עודפים: פתיחה <Money v={RONEN.preliminary["עודפים"]} /> (חובה) − רווח <Money v={S.profit} /> = סגירה <Money v={RETAINED_CLOSE} /> (חובה). עמודות המאזני
              מאוזנות.
            </p>
          ) : (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-fg">
              עמודות המאזני לא מאוזנות עדיין: ההפרש <Money v={Math.abs(sheetDr - sheetCr)} /> הוא בדיוק רווח השנה, שעוד לא נכנס לעודפים.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
