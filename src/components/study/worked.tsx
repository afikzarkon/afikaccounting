"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { acc, isNumeric, tBalance, worksheetRows, type Neg, type WCell, type WEntry, type WLine, type WOption, type WorkedBody, type Worked, type WPoint, type WCredit, type WLCard, type WLRow, type WStep, type WTable, type WTB, type WTCard, type WWorksheet } from "@/lib/study/worked";
import { cn } from "@/lib/utils";
import { ClosingArrow } from "@/components/basics/closing-arrow";

/**
 * The site's worked solution: a lecturer's calculation sheet for every
 * calculation, a timeline with a discount table for every present value, a
 * "why" note beside each step, and the common trap last. On a lesson screen
 * (`WorkedExample`) the whole solution opens with one button, after a "try it
 * yourself" box; in practice (`WorkedSolution`) the engine decides when it
 * shows, and it opens with the givens repeated. Never a step-by-step reveal.
 */

/** How this course writes a negative amount. */
const NegContext = createContext<Neg>("paren");

const Num = ({ children }: { children: ReactNode }) => <span className="num whitespace-nowrap [direction:ltr] [unicode-bidi:isolate]">{children}</span>;

function Amount({ v, dec }: { v: WCell; dec?: boolean }) {
  const neg = useContext(NegContext);
  if (typeof v === "number") return <Num>{acc(v, neg, dec)}</Num>;
  return isNumeric(v) ? <Num>{v}</Num> : <Text s={v} />;
}

/** **x** is bold, `x` reads left to right. */
function Text({ s }: { s: string }) {
  return (
    <>
      {s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className="font-semibold text-fg">
            {part.slice(2, -2)}
          </strong>
        ) : part.startsWith("`") ? (
          <Num key={i}>{part.slice(1, -1)}</Num>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function WTableView({ t }: { t: WTable }) {
  return (
    <div className="scroll-x" tabIndex={0} role="region" aria-label={t.cap ?? t.head.filter(Boolean).join(", ")}>
      <table className="w-full border-collapse text-[13.5px]">
        {t.cap && <caption className="py-1 text-start font-semibold text-fg">{t.cap}</caption>}
        <thead>
          <tr>
            {t.head.map((h, i) => (
              <th key={i} className="whitespace-nowrap bg-accent px-2 py-1.5 text-start font-semibold text-accent-fg">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, k) => (
            <tr key={k} className={cn("border-b border-line", r.res && "bg-amber-50 font-bold dark:bg-amber-950/40")}>
              {r.c.map((c, i) => (
                <td key={i} className={cn("px-2 py-1.5", i === 0 && "whitespace-nowrap", isNumeric(c) ? "text-left" : "text-start")}>
                  <Amount v={c} dec={t.dec} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sheet({ lines }: { lines: WLine[] }) {
  return (
    <div className="flex min-w-0 flex-col text-[14.5px]">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cn(
            "flex items-baseline justify-between gap-3 py-1",
            l.k === "op" && "text-muted",
            l.k === "sub" && "border-t border-fg",
            l.k === "tot" && "border-t border-b-[3px] border-b-fg border-t-fg font-bold [border-bottom-style:double]",
            l.k === "focal" && "-mx-1.5 rounded bg-amber-50 px-1.5 font-semibold dark:bg-amber-950/40",
          )}
        >
          <span className="min-w-0">
            <Text s={l.l} />
            {l.how && (
              <span className="block text-[12px] font-normal leading-snug text-muted">
                <Text s={l.how} />
              </span>
            )}
          </span>
          <span className="flex min-w-[6.5rem] shrink-0 items-baseline justify-end gap-1.5 text-left">
            {l.tag && <span className="rounded border border-line px-1 text-[11px] font-bold text-muted">{l.tag}</span>}
            <Amount v={l.a} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** A journal entry: debit and credit columns, the credits indented, the totals under a single and a double rule. On a phone, one column, the side shown by ח׳/ז׳, as on the rest of the site. */
function Entry({ e }: { e: WEntry }) {
  const neg = useContext(NegContext);
  const dr = e.lines.reduce((s, l) => s + (l.dr ?? 0), 0);
  const cr = e.lines.reduce((s, l) => s + (l.cr ?? 0), 0);
  const side = (credit: boolean) => <span className={cn("me-1.5 text-xs font-semibold", credit ? "text-credit" : "text-debit")}>{credit ? "ז׳" : "ח׳"}</span>;
  return (
    <div className="min-w-0">
      {e.cap && <p className="py-1 text-[13.5px] font-semibold">{e.cap}</p>}
      <ul className="text-[14px] sm:hidden">
        {e.lines.map((l, i) => {
          const credit = l.cr !== undefined;
          return (
            <li key={i} className={cn("flex items-baseline gap-1 py-1", credit && "ps-5")}>
              {side(credit)}
              <span className="min-w-0 flex-1">{l.a}</span>
              <Num>{acc((credit ? l.cr : l.dr) ?? 0, neg)}</Num>
            </li>
          );
        })}
        <li className="ledger-total mt-1 flex flex-wrap items-baseline gap-x-2 py-1 font-semibold">
          <span className="text-muted">סך הכול</span>
          <span className="ms-auto">
            ח׳ <Num>{acc(dr, neg)}</Num>
          </span>
          <span className="text-muted">=</span>
          <span>
            ז׳ <Num>{acc(cr, neg)}</Num>
          </span>
        </li>
      </ul>
      <table className="hidden w-full border-collapse text-[14.5px] sm:table">
        <thead>
          <tr className="border-b border-line text-[12.5px] text-muted">
            <th className="px-1.5 py-1 text-start font-semibold">חשבון</th>
            <th className="w-28 px-1.5 py-1 text-left font-semibold">חובה</th>
            <th className="w-28 px-1.5 py-1 text-left font-semibold">זכות</th>
          </tr>
        </thead>
        <tbody>
          {e.lines.map((l, i) => (
            <tr key={i}>
              <td className={cn("px-1.5 py-1", l.cr !== undefined && "ps-8")}>
                {side(l.cr !== undefined)}
                {l.a}
              </td>
              <td className="px-1.5 py-1 text-left">{l.dr !== undefined && <Num>{acc(l.dr, neg)}</Num>}</td>
              <td className="px-1.5 py-1 text-left">{l.cr !== undefined && <Num>{acc(l.cr, neg)}</Num>}</td>
            </tr>
          ))}
          <tr className="border-t border-fg font-bold">
            <td className="px-1.5 py-1">סך הכול</td>
            {[dr, cr].map((v, i) => (
              <td key={i} className="px-1.5 py-1 text-left">
                <span className="border-b-[3px] border-fg pb-px [border-bottom-style:double]">
                  <Num>{acc(v, neg)}</Num>
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** A T-account as written in a notebook: the balancing line on the smaller side, both sides closing on one total. */
function TCardView({ t }: { t: WTCard }) {
  const neg = useContext(NegContext);
  const b = tBalance(t);
  const total = Math.max(t.dr.reduce((s, [, v]) => s + v, 0), t.cr.reduce((s, [, v]) => s + v, 0));
  const side = (items: [string, number][], name: "dr" | "cr") => (
    <div className={cn("flex flex-col px-2 py-1", name === "dr" && "border-e-2 border-fg")}>
      <div className={cn("mb-0.5 text-[12px] font-semibold", name === "dr" ? "text-debit" : "text-credit")}>{name === "dr" ? "חובה" : "זכות"}</div>
      {items.map(([l, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-2 py-px text-[14px]">
          <span className="min-w-0 text-[13px] text-muted">{l}</span>
          <Num>{acc(v, neg)}</Num>
        </div>
      ))}
      {b.side === name && b.amount !== 0 && (
        <div className="flex items-baseline justify-between gap-2 py-px text-[14px] font-semibold italic text-accent">
          <span className="min-w-0 text-[13px]">{t.bal ?? "יתרת סגירה"}</span>
          <Num>{acc(b.amount, neg)}</Num>
        </div>
      )}
      <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-fg pt-0.5 text-[14px] font-bold">
        <span className="text-[13px]">סך הכול</span>
        <span className="border-b-[3px] border-fg [border-bottom-style:double]">
          <Num>{acc(total, neg)}</Num>
        </span>
      </div>
    </div>
  );
  return (
    <figure className="w-full max-w-md">
      <figcaption className="border-b-2 border-fg pb-0.5 text-center text-[14.5px] font-bold">{t.name}</figcaption>
      <div className="grid grid-cols-2">
        {side(t.dr, "dr")}
        {side(t.cr, "cr")}
      </div>
    </figure>
  );
}

/** One card as the credit-losses lesson draws it: rows on both sides, padded to the same height, and the closing balance under the rule on its own side. */
function LessonCard({ c }: { c: WLCard }) {
  const neg = useContext(NegContext);
  const n = Math.max(c.dr.length, c.cr.length);
  const row = (r: WLRow | null, k: string, close?: { to?: boolean }) =>
    r ? (
      <li
        key={k}
        data-link-to={close?.to ? "closing" : undefined}
        className={cn("flex items-center justify-between gap-2 rounded px-1.5 py-1 text-[12.5px]", close && "font-bold", r.letter && "bg-success/10 ring-1 ring-success/40")}
      >
        <span className="min-w-0 text-fg">
          {r.l}
          {r.entry && <span className="ms-1.5 inline-block rounded bg-amber-400 px-1.5 py-px text-[10.5px] font-bold text-amber-950">עליו פקודת היומן</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {r.letter && <span className="text-[11px] font-bold text-success">{r.letter} =</span>}
          <Num>{acc(r.a, neg)}</Num>
        </span>
      </li>
    ) : (
      <li key={k} className="py-1 text-[12.5px]">
        &nbsp;
      </li>
    );
  const side = (rows: WLRow[], s: "dr" | "cr") => (
    <div className={cn("flex min-w-0 flex-col", s === "dr" && "border-e-2 border-fg/70")}>
      <p className={cn("px-2 pt-1 text-[11px] font-bold", s === "dr" ? "text-debit" : "text-credit")}>{s === "dr" ? "חובה" : "זכות"}</p>
      <ul className="space-y-0.5 px-1 pb-1">
        {rows.map((r, i) => row(r, `r${i}`))}
        {Array.from({ length: n - rows.length }, (_, i) => row(null, `e${i}`))}
      </ul>
      <ul className="mt-auto border-t-2 border-fg/70 px-1 py-1">{c.close.side === s ? row({ l: "יתרת סגירה", a: c.close.a, letter: c.close.letter }, "close", { to: c.close.to }) : row(null, "none")}</ul>
    </div>
  );
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
      <figcaption className="border-b-2 border-fg/70 px-3 py-1.5 text-center text-[14px] font-bold text-fg">{c.name}</figcaption>
      <div className="grid grid-cols-2">
        {side(c.dr, "dr")}
        {side(c.cr, "cr")}
      </div>
    </figure>
  );
}

/** The credit-losses picture: the cards, and the formula's answer with its arrow into the closing balance. */
function CreditView({ v }: { v: WCredit }) {
  const cards = (
    <div className={cn("grid gap-3", v.cards.length > 1 && "md:grid-cols-2")}>
      {v.cards.map((c) => (
        <LessonCard key={c.name} c={c} />
      ))}
    </div>
  );
  if (!v.formula) return cards;
  return (
    <ClosingArrow reverse={v.reverse}>
      {cards}
      <div className="mt-9 grid gap-3 md:grid-cols-2">
        {v.beside ? (
          <div className="order-2 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-[13.5px] text-muted md:order-none">
            <Text s={v.beside} />
          </div>
        ) : (
          <div className="max-md:hidden" />
        )}
        <div data-link-from="closing" className="rounded-xl border-2 border-accent/50 bg-accent-soft/50 px-3.5 py-2.5 text-[14.5px] text-fg">
          <Fx fx={v.formula} />
        </div>
      </div>
    </ClosingArrow>
  );
}

/** A trial balance in debit and credit columns, with its totals; a line the solution found is lit and lettered. */
function TBView({ t }: { t: WTB }) {
  const neg = useContext(NegContext);
  const dr = t.rows.reduce((s, r) => s + (r.v > 0 ? r.v : 0), 0);
  const cr = t.rows.reduce((s, r) => s + (r.v < 0 ? -r.v : 0), 0);
  const cell = (r: WTB["rows"][number], side: "dr" | "cr") =>
    (side === "dr" ? r.v > 0 : r.v < 0) ? (
      <>
        {r.letter && <span className="me-1 text-[11px] font-bold text-success">{r.letter} =</span>}
        <Num>{acc(Math.abs(r.v), neg)}</Num>
      </>
    ) : null;
  return (
    <div className="scroll-x" tabIndex={0} role="region" aria-label={t.cap ?? "מאזן בוחן"}>
      <table className="w-full border-collapse text-[13.5px]">
        {t.cap && <caption className="py-1 text-start font-semibold text-fg">{t.cap}</caption>}
        <thead>
          <tr className="border-b border-line text-[12.5px]">
            <th className="px-2 py-1 text-start font-semibold text-muted">חשבון</th>
            <th className="w-28 px-2 py-1 text-left font-semibold text-debit">חובה</th>
            <th className="w-28 px-2 py-1 text-left font-semibold text-credit">זכות</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.a} className={cn("border-b border-line", r.letter && "bg-success/10")}>
              <td className="px-2 py-1">{r.a}</td>
              <td className="whitespace-nowrap px-2 py-1 text-left">{cell(r, "dr")}</td>
              <td className="whitespace-nowrap px-2 py-1 text-left">{cell(r, "cr")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td className="border-t-2 border-fg px-2 py-1">סך הכול</td>
            {[dr, cr].map((v, i) => (
              <td key={i} className="border-t-2 border-fg px-2 py-1 text-left">
                <span className="border-b-[3px] border-fg [border-bottom-style:double]">
                  <Num>{acc(v, neg)}</Num>
                </span>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

type WsRow = ReturnType<typeof worksheetRows>[number];

/** The course's worksheet: before the adjustments, the adjustments, the final trial balance, profit or loss, and the balance sheet. */
function WorksheetView({ w }: { w: WWorksheet }) {
  const neg = useContext(NegContext);
  const rows = worksheetRows(w);
  const side = (v: number) => ({ dr: v > 0 ? v : 0, cr: v < 0 ? -v : 0 });
  const none = { dr: 0, cr: 0 };
  const groups = [
    { title: "לפני התאמות", pick: (r: WsRow) => (r.isNew ? none : side(r.before)) },
    { title: "התאמות", pick: (r: WsRow) => ({ dr: r.dr, cr: r.cr }) },
    { title: "מאזן בוחן סופי", pick: (r: WsRow) => side(r.final) },
    { title: "תוצאתי", pick: (r: WsRow) => (r.pl ? side(r.final) : none) },
    { title: "מאזני", pick: (r: WsRow) => (r.pl ? none : side(r.sheet)) },
  ];
  const amount = (v: number, lit?: boolean) =>
    v ? (
      <span className={cn(lit && "rounded bg-success/15 px-1 font-bold")}>
        <Num>{acc(v, neg)}</Num>
      </span>
    ) : null;
  const totals = groups.map((g) => rows.reduce((t, r) => ({ dr: t.dr + g.pick(r).dr, cr: t.cr + g.pick(r).cr }), { dr: 0, cr: 0 }));
  const profit = totals[3].cr - totals[3].dr;
  return (
    <div className="scroll-x rounded-xl border border-line" tabIndex={0} role="region" aria-label="גיליון רב-טורי">
      <table className="w-full min-w-[56rem] border-collapse text-[13px]">
        <thead className="bg-surface-2/40">
          <tr>
            <th rowSpan={2} className="px-3 py-1.5 text-start text-xs font-semibold text-fg">
              חשבון
            </th>
            {groups.map((g) => (
              <th key={g.title} colSpan={2} className="border-s border-line/60 px-2 py-1.5 text-center text-xs font-semibold text-fg">
                {g.title}
              </th>
            ))}
          </tr>
          <tr>
            {groups.map((g) => [
              <th key={`${g.title}d`} className="border-s border-line/60 px-2 py-1 text-left text-[11px] font-medium text-debit">
                חובה
              </th>,
              <th key={`${g.title}c`} className="px-2 py-1 text-left text-[11px] font-medium text-credit">
                זכות
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.a} className={cn("border-t border-line/60", (r.dr || r.cr) && "bg-accent-soft/40")}>
              <td className="whitespace-nowrap px-3 py-1.5 text-fg">
                {r.a}
                {r.isNew && <span className="ms-1.5 rounded bg-accent px-1 text-[10px] font-bold text-accent-fg">חדש</span>}
              </td>
              {groups.map((g, i) => {
                const p = g.pick(r);
                const lit = i === 4 && r.a === "עודפים";
                return [
                  <td key={`${g.title}d`} className="whitespace-nowrap border-s border-line/60 px-2 py-1.5 text-left">
                    {amount(p.dr, lit)}
                  </td>,
                  <td key={`${g.title}c`} className="whitespace-nowrap px-2 py-1.5 text-left">
                    {amount(p.cr, lit)}
                  </td>,
                ];
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="font-semibold">
          <tr className="border-t-2 border-line-strong">
            <td className="px-3 py-2 text-fg">סך הכול</td>
            {totals.map((t, i) => [
              <td key={`t${i}d`} className="whitespace-nowrap border-s border-line/60 px-2 py-2 text-left">
                <Num>{acc(t.dr, neg)}</Num>
              </td>,
              <td key={`t${i}c`} className="whitespace-nowrap px-2 py-2 text-left">
                <Num>{acc(t.cr, neg)}</Num>
              </td>,
            ])}
          </tr>
          <tr className="text-accent">
            <td className="px-3 py-1.5">רווח השנה</td>
            {totals.map((_, i) => [
              <td key={`p${i}d`} className="whitespace-nowrap border-s border-line/60 px-2 py-1.5 text-left">
                {i === 3 && <Num>{acc(profit, neg)}</Num>}
              </td>,
              <td key={`p${i}c`} />,
            ])}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Timeline({ points }: { points: WPoint[] }) {
  const neg = useContext(NegContext);
  const step = 84 / Math.max(points.length - 1, 1);
  return (
    <div className="scroll-x">
      <div className="relative h-[116px] min-w-[540px]">
        <div className="absolute inset-x-[4%] top-[54px] h-0.5 bg-fg" />
        {points.map((p, i) => (
          <div key={i} className="absolute top-0 w-[7.5rem] translate-x-1/2 text-center" style={{ right: `${8 + i * step}%` }}>
            <div className="h-6 text-[14px] font-bold">{p.cf !== undefined && <Num>{acc(p.cf, neg)}</Num>}</div>
            <div className={cn("mx-auto mb-2 mt-[17px] h-3.5 w-3.5 rounded-full border-2 border-accent", p.key ? "bg-accent" : "bg-surface")} />
            <div className="text-[13px]">
              <Num>{p.d}</Num>
            </div>
            <div className="text-[12px] text-muted">{p.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Why({ why }: { why: [string, string] }) {
  return (
    <div className="border-s-2 border-line ps-3 text-[13.5px] text-muted">
      <div className="mb-0.5 font-semibold text-fg">{why[0]}</div>
      <Text s={why[1]} />
    </div>
  );
}

/** The course's formula, then the numbers in it. Left to right. */
function Fx({ fx }: { fx: [string, string] }) {
  return (
    <div className="flex flex-col gap-0.5 text-left text-[14.5px] [direction:ltr]">
      <span className="text-muted [unicode-bidi:isolate]">{fx[0]}</span>
      <span className="num font-semibold [unicode-bidi:isolate]">{fx[1]}</span>
    </div>
  );
}

/** Every option of a multiple-choice question: the answer in green, a wrong choice in red, and a line under each on where it comes from. */
function Options({ opts }: { opts: WOption[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {opts.map((o) => (
        <li
          key={o.mark}
          className={cn(
            "grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2.5 gap-y-0.5 rounded-lg border px-3 py-2 text-[14.5px]",
            o.ok ? "border-success bg-success/10" : o.chosen ? "border-danger bg-danger/10" : "border-line",
          )}
        >
          <span className="font-bold text-muted">{o.mark}</span>
          <span>
            <Text s={o.t} />
          </span>
          <span className={cn("text-[13px] font-bold", o.ok ? "text-success" : "text-danger")}>{o.ok ? "✓ נכון" : o.chosen ? "✗ בחרתם" : "✗"}</span>
          {o.r && (
            <span className="col-start-2 col-end-4 whitespace-pre-line text-[13.5px] text-muted">
              <Text s={o.r} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Step({ s, i, n, light }: { s: WStep; i: number; n: number; light?: boolean }) {
  const main = s.sheet ? <Sheet lines={s.sheet} /> : s.entry ? <Entry e={s.entry} /> : s.tcard ? <TCardView t={s.tcard} /> : null;
  return (
    <div className={cn("flex min-w-0 flex-col", light ? "gap-1 border-b border-line pb-2.5 last:border-b-0 last:pb-0" : "gap-3 rounded-xl border border-line p-3.5")}>
      {n > 1 && !light && (
        <div className="text-[12px] text-muted">
          שלב {i + 1} מתוך {n}
        </div>
      )}
      <h5 className={cn("font-bold", light ? "text-[15px]" : "text-[15.5px]")}>
        <span className="text-accent">{i + 1}.</span> <Text s={s.h} />
      </h5>
      {s.timeline && <Timeline points={s.timeline} />}
      {s.credit && <CreditView v={s.credit} />}
      {s.tb && <TBView t={s.tb} />}
      {s.worksheet && <WorksheetView w={s.worksheet} />}
      {s.tcards && (
        <div className="grid gap-4 sm:grid-cols-2">
          {s.tcards.map((t) => (
            <TCardView key={t.name} t={t} />
          ))}
        </div>
      )}
      {(s.entries ?? []).map((e, k) => (
        <div key={k} className="flex flex-col gap-1.5">
          <Entry e={e} />
          {e.why && (
            <p className="text-[13.5px] text-muted">
              <Text s={e.why} />
            </p>
          )}
        </div>
      ))}
      {main ? (
        s.why ? (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {main}
            <Why why={s.why} />
          </div>
        ) : (
          main
        )
      ) : (
        s.why && <Why why={s.why} />
      )}
      {(s.p ?? []).map((p, k) => (
        <p key={k} className="whitespace-pre-line text-[14.5px]">
          <Text s={p} />
        </p>
      ))}
      {s.opts && <Options opts={s.opts} />}
      {(s.tables ?? []).map((t, k) => (
        <WTableView key={k} t={t} />
      ))}
      {s.fx && <Fx fx={s.fx} />}
      {s.result && (
        <div className="text-[14.5px] font-bold">
          תוצאה: <Text s={s.result} />
        </div>
      )}
      {s.xl && (
        <div className="text-[12.5px] text-muted">
          באקסל: <Text s={s.xl} />
        </div>
      )}
    </div>
  );
}

function Steps({ w, answer }: { w: WorkedBody; answer?: ReactNode }) {
  return (
    <div className={cn("flex flex-col", w.light ? "gap-2.5" : "gap-3.5")}>
      {w.steps.map((s, i) => (
        <Step key={i} s={s} i={i} n={w.steps.length} light={w.light} />
      ))}
      {w.summary && <WTableView t={w.summary} />}
      {(w.notes ?? []).map((t, i) => (
        <p key={i} className="text-[12.5px] text-muted">
          הערה: <Text s={t} />
        </p>
      ))}
      {answer && <div className="text-[15px] font-bold">התשובה: {answer}</div>}
      {w.trap && (
        <p className="border-t border-line pt-2.5 text-[14.5px]">
          <span className="font-bold text-danger">מלכודת נפוצה:</span> <Text s={w.trap} />
        </p>
      )}
    </div>
  );
}

const heading = (w: WorkedBody) => (w.light ? "הנימוק" : w.steps.length > 1 ? "הפתרון, שלב אחר שלב" : "הפתרון");

function Givens({ w }: { w: WorkedBody }) {
  return (
    <>
      {w.givens && w.givens.length > 0 && (
        <section className="border-t border-line px-4 py-3 first:border-t-0">
          <h4 className="mb-1.5 text-[14.5px] font-bold">הנתונים</h4>
          <ol className="flex list-decimal flex-col gap-1 ps-5 text-[14.5px]">
            {w.givens.map((g, i) => (
              <li key={i}>
                <Text s={g} />
              </li>
            ))}
          </ol>
          {(w.tables ?? []).map((t, i) => (
            <div key={i} className="mt-2">
              <WTableView t={t} />
            </div>
          ))}
        </section>
      )}
      {w.required && w.required.length > 0 && (
        <section className="border-t border-line px-4 py-3 first:border-t-0">
          <h4 className="mb-1 text-[14.5px] font-bold">נדרש</h4>
          {w.required.map((r, i) => (
            <p key={i} className="text-[14.5px]">
              <Text s={r} />
            </p>
          ))}
        </section>
      )}
    </>
  );
}

/** A worked example on a lesson screen: the solution behind one button, after a "try it yourself" box. */
export function WorkedExample({ ex, neg }: { ex: Worked; neg?: Neg }) {
  const [open, setOpen] = useState(false);
  return (
    <NegContext.Provider value={neg ?? ex.neg ?? "paren"}>
      <article className="my-4 overflow-hidden rounded-xl border-2 border-accent bg-surface">
        <header className="bg-accent-soft px-4 py-3 text-[16px] font-bold text-fg">{ex.title}</header>
        <Givens w={ex} />
        <section className="border-t border-line px-4 py-3">
          <h4 className="mb-2 text-[14.5px] font-bold">{heading(ex)}</h4>
          {!open && (
            <div className="rounded-lg border-2 border-dashed border-line px-3 py-2 text-[14px] text-muted">
              נסו לבד לפני שפותחים: <Text s={ex.tryFirst} />
            </div>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2.5 min-h-11 rounded-lg bg-accent px-4 py-2 text-[14.5px] font-semibold text-accent-fg">
            {open ? "הסתרת הפתרון" : "הצגת הפתרון"}
          </button>
          {open && (
            <div className="mt-3">
              <Steps w={ex} />
            </div>
          )}
        </section>
      </article>
    </NegContext.Provider>
  );
}

/** A solution under a question the screen already shows: a "try it yourself" line and one button that opens all of it. */
export function WorkedReveal({ w, tryFirst, label = "הצגת הפתרון המלא", neg }: { w: WorkedBody; tryFirst?: string; label?: string; neg?: Neg }) {
  const [open, setOpen] = useState(false);
  return (
    <NegContext.Provider value={neg ?? w.neg ?? "paren"}>
      <article className="overflow-hidden rounded-xl border-2 border-accent bg-surface">
        <section className="px-4 py-3">
          <h4 className="mb-2 text-[14.5px] font-bold">{heading(w)}</h4>
          {!open && tryFirst && (
            <div className="rounded-lg border-2 border-dashed border-line px-3 py-2 text-[14px] text-muted">
              נסו לבד לפני שפותחים: <Text s={tryFirst} />
            </div>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2.5 min-h-11 rounded-lg bg-accent px-4 py-2 text-[14.5px] font-semibold text-accent-fg">
            {open ? "הסתרת הפתרון" : label}
          </button>
          {open && (
            <div className="mt-3">
              <Steps w={w} />
            </div>
          )}
        </section>
      </article>
    </NegContext.Provider>
  );
}

/** A practice question's solution, shown when the engine says the question is done: the givens again, the steps, the answer, and the trap last. */
export function WorkedSolution({ w, neg, answer }: { w: WorkedBody; neg?: Neg; answer?: ReactNode }) {
  return (
    <NegContext.Provider value={neg ?? w.neg ?? "paren"}>
      <article className="overflow-hidden rounded-xl border-2 border-accent bg-surface">
        <Givens w={w} />
        <section className="border-t border-line px-4 py-3 first:border-t-0">
          <h4 className="mb-2 text-[14.5px] font-bold">{heading(w)}</h4>
          <Steps w={w} answer={answer} />
        </section>
      </article>
    </NegContext.Provider>
  );
}
