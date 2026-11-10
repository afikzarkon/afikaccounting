"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { acc, isNumeric, type Neg, type WCell, type WEntry, type WLine, type WOption, type WorkedBody, type Worked, type WPoint, type WStep, type WTable } from "@/lib/study/worked";
import { cn } from "@/lib/utils";

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
  const main = s.sheet ? <Sheet lines={s.sheet} /> : s.entry ? <Entry e={s.entry} /> : null;
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
