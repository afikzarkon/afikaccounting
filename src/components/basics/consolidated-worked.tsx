"use client";

import { type ReactNode, useState } from "react";
import { acc, type WCell, type WLine, type WPoint, type Worked, type WTable } from "@/lib/study/consolidated/worked/types";
import { cn } from "@/lib/utils";

/**
 * The course's worked example: a lecturer's solution sheet for every
 * calculation, and a timeline with a discount table for every present value.
 * The whole solution opens with one button, after a "try it yourself" box.
 */

export { acc };

const Num = ({ children }: { children: ReactNode }) => <span className="whitespace-nowrap tabular-nums [direction:ltr] [unicode-bidi:isolate]">{children}</span>;

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

const isNumeric = (c: WCell) => typeof c === "number" || /^[\s\d.,()%×÷+−=\-²^]+$/.test(c);
/** A positive amount beside a negative one keeps room for the closing parenthesis of a negative one, so the units still fall under each other. */
const Hang = () => <span aria-hidden className="invisible">)</span>;
const plain = (c: WCell) => (typeof c === "number" ? c >= 0 : /^[\d,.]+$/.test(c));
/** Whether a column or a sheet holds a negative amount in parentheses: only then do its positive amounts keep the room. */
const hasParen = (cs: WCell[]) => cs.some((c) => (typeof c === "number" ? c < 0 : /^\(.*\)$/.test(c)));
const show = (c: WCell, hang = false) =>
  typeof c === "number" || isNumeric(c) ? (
    <Num>
      {typeof c === "number" ? acc(c) : c}
      {hang && plain(c) && <Hang />}
    </Num>
  ) : (
    <Text s={c} />
  );

export function WTableView({ t }: { t: WTable }) {
  const paren = t.head.map((_, i) => hasParen(t.rows.map((r) => r.c[i] ?? "")));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        {t.cap && <caption className="py-1 text-start font-semibold text-fg">{t.cap}</caption>}
        <thead>
          <tr>
            {t.head.map((h, i) => (
              <th key={i} className="whitespace-nowrap bg-accent px-2 py-1.5 text-start font-semibold text-white dark:text-surface">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, k) => (
            <tr key={k} className={cn("border-b border-line", r.res && "bg-amber-50 font-bold dark:bg-amber-950/40")}>
              {r.c.map((c, i) => (
                <td key={i} className={cn("px-2 py-1.5", isNumeric(c) && c !== "" ? "text-right" : "text-start")}>
                  {show(c, paren[i])}
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
  const paren = hasParen(lines.map((l) => l.a));
  return (
    <div className="flex flex-col text-[14.5px]">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cn(
            "flex justify-between gap-4 py-1",
            l.k === "op" && "text-muted",
            l.k === "sub" && "border-t border-fg",
            l.k === "tot" && "border-t border-b-[3px] border-b-fg border-t-fg [border-bottom-style:double] font-bold",
          )}
        >
          <span>
            <Text s={l.l} />
          </span>
          <span className="inline-block min-w-[7rem] text-right">{show(l.a, paren)}</span>
        </div>
      ))}
    </div>
  );
}

function Timeline({ points }: { points: WPoint[] }) {
  const step = 84 / Math.max(points.length - 1, 1);
  return (
    <div className="overflow-x-auto">
      <div className="relative h-[116px] min-w-[540px]">
        <div className="absolute inset-x-[4%] top-[54px] h-0.5 bg-fg" />
        {points.map((p, i) => (
          <div key={i} className="absolute top-0 w-[7.5rem] translate-x-1/2 text-center" style={{ right: `${8 + i * step}%` }}>
            <div className="h-6 text-[14px] font-bold">{p.cf !== undefined && <Num>{acc(p.cf)}</Num>}</div>
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

export function WorkedExample({ ex }: { ex: Worked }) {
  const [open, setOpen] = useState(false);
  const n = ex.steps.length;
  return (
    <article className="my-4 overflow-hidden rounded-xl border-2 border-accent bg-surface">
      <header className="bg-accent-soft px-4 py-3 text-[16px] font-bold text-fg">{ex.title}</header>
      <section className="border-t border-line px-4 py-3">
        <h4 className="mb-1.5 text-[14.5px] font-bold">{ex.own ? "הנתונים" : "הנתונים (כל הנתונים מהחומר)"}</h4>
        <ol className="flex list-decimal flex-col gap-1 ps-5 text-[14.5px]">
          {ex.givens.map((g, i) => (
            <li key={i}>
              <Text s={g} />
            </li>
          ))}
        </ol>
        {(ex.tables ?? []).map((t, i) => (
          <div key={i} className="mt-2">
            <WTableView t={t} />
          </div>
        ))}
      </section>
      <section className="border-t border-line px-4 py-3">
        <h4 className="mb-1 text-[14.5px] font-bold">נדרש</h4>
        {ex.required.map((r, i) => (
          <p key={i} className="text-[14.5px]">
            <Text s={r} />
          </p>
        ))}
      </section>
      <section className="border-t border-line px-4 py-3">
        <h4 className="mb-2 text-[14.5px] font-bold">הפתרון, שלב אחר שלב</h4>
        {!open && (
          <div className="rounded-lg border-2 border-dashed border-line px-3 py-2 text-[14px] text-muted">
            נסו לבד לפני שפותחים: <Text s={ex.tryFirst} />
          </div>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2.5 min-h-11 rounded-lg bg-accent px-4 py-2 text-[14.5px] font-semibold text-white dark:text-surface">
          {open ? "הסתרת הפתרון" : "הצגת הפתרון"}
        </button>
        {open && (
          <div className="mt-3 flex flex-col gap-3.5">
            {ex.steps.map((s, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-line p-3.5">
                <div className="text-[12px] text-muted">
                  שלב {i + 1} מתוך {n}
                </div>
                <h5 className="text-[15.5px] font-bold">
                  <span className="text-accent">{i + 1}.</span> <Text s={s.h} />
                </h5>
                {s.timeline && <Timeline points={s.timeline} />}
                {s.sheet ? (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <Sheet lines={s.sheet} />
                    {s.why && <Why why={s.why} />}
                  </div>
                ) : (
                  s.why && <Why why={s.why} />
                )}
                {(s.p ?? []).map((p, k) => (
                  <p key={k} className="text-[14.5px]">
                    <Text s={p} />
                  </p>
                ))}
                {(s.tables ?? []).map((t, k) => (
                  <WTableView key={k} t={t} />
                ))}
                {s.result && (
                  <div className="text-[14.5px] font-bold">
                    תוצאה: <Text s={s.result} />
                  </div>
                )}
                {s.xl && (
                  <div className="text-[12.5px] text-muted">
                    {ex.own ? "באקסל" : "בחוברת האקסל"}: <Text s={s.xl} />
                  </div>
                )}
              </div>
            ))}
            {ex.summary && <WTableView t={ex.summary} />}
            {(ex.notes ?? []).map((t, i) => (
              <p key={i} className="text-[12.5px] text-muted">
                הערה: <Text s={t} />
              </p>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
