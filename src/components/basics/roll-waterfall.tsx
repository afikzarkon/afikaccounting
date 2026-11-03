"use client";

import { useState } from "react";
import { Num } from "@/components/study/blocks";
import { cn } from "@/lib/utils";

/**
 * The roll-forward as a waterfall: the opening and the closing stand on the
 * floor, each line in between floats from the running total before it to the
 * one after, and a thin carry line takes the total across every gap. The
 * reader picks what the market rate did at year end; only the closing moves,
 * and the P.N. bar is the gap between the expected closing and the new one.
 */

const OPENING = 5_000;
const RATE = 0.06;
const INTEREST = OPENING * RATE;
const SERVICE = 1_500;
const PAID = 1_000;
const EXPECTED = OPENING + INTEREST + SERVICE - PAID;
/** The value axis runs from zero, never clipped, to just above the highest running total. */
const TOP = 7_000;

const CASES = [
  { id: "down", label: "הריבית ירדה", closing: 6_300, says: "ריבית נמוכה מגדילה את הערך הנוכחי, ולכן הסגירה החדשה גבוהה מהצפוי. ההתחייבות גדלה יותר ממה שהשורות הרגילות מסבירות: P.N. הפסד, ל-OCI." },
  { id: "same", label: "שום הנחה לא השתנתה", closing: EXPECTED, says: "הסגירה יוצאת בדיוק כמו הצפוי. ארבע השורות הרגילות מסבירות הכול, ולכן P.N. = 0 ואין לו עמודה." },
  { id: "up", label: "הריבית עלתה", closing: 5_400, says: "ריבית גבוהה מקטינה את הערך הנוכחי, ולכן הסגירה החדשה נמוכה מהצפוי. ההתחייבות גדלה פחות ממה שהשורות הרגילות מסבירות: P.N. רווח, ל-OCI." },
] as const;

type Bar = { name: string; hint: string; kind: "total" | "delta"; lo: number; hi: number; delta?: number; focal?: boolean };

function barsFor(closing: number): Bar[] {
  const pn = closing - EXPECTED;
  const steps = [
    { name: "ריבית", hint: "6% × הפתיחה", delta: INTEREST },
    { name: "עלות שירות", hint: "מה שנצבר השנה", delta: SERVICE },
    { name: "תשלומים", hint: "שולמו לעובדים", delta: -PAID },
    { name: "P.N.", hint: "מה שנשאר", delta: pn, focal: true },
  ];
  let level = OPENING;
  const bridges = steps.map((s) => {
    const from = level;
    level += s.delta;
    return { ...s, kind: "delta" as const, lo: Math.min(from, level), hi: Math.max(from, level) };
  });
  return [{ name: "פתיחה", hint: "סוף השנה שעברה", kind: "total", lo: 0, hi: OPENING }, ...bridges, { name: "סגירה", hint: "מדידה חדשה", kind: "total", lo: 0, hi: closing }];
}

const pctOf = (v: number) => `${(v / TOP) * 100}%`;

function Signed({ v }: { v: number }) {
  return (
    <bdi dir="ltr">
      {v > 0 ? "+" : "−"}
      <Num v={Math.abs(v)} />
    </bdi>
  );
}

export function RollWaterfall() {
  const [id, setId] = useState<(typeof CASES)[number]["id"]>("down");
  const c = CASES.find((x) => x.id === id)!;
  const bars = barsFor(c.closing);
  const pn = c.closing - EXPECTED;

  return (
    <figure className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <figcaption className="space-y-1">
        <p className="text-[15.5px] font-bold text-fg">
          המעגל כמפל: מהפתיחה לסגירה <span className="text-xs font-normal text-muted">(₪)</span>
        </p>
        <p className="text-[13.5px] text-muted">בחרו מה קרה לריבית בשוק בסוף השנה. ארבע השורות הרגילות לא זזות; רק הסגירה זזה, וה-P.N. סוגר את הפער.</p>
      </figcaption>

      <div className="flex flex-wrap gap-2" role="group" aria-label="מה קרה לריבית בסוף השנה">
        {CASES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={id === x.id}
            onClick={() => setId(x.id)}
            className={cn("h-8 rounded-lg px-3 text-[13px] font-semibold ring-1 transition", id === x.id ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-muted ring-line-strong hover:text-fg")}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div role="img" aria-label={`פתיחה ${OPENING}, ריבית ${INTEREST}, עלות שירות ${SERVICE}, תשלומים ${PAID}, צפוי ${EXPECTED}, סגירה ${c.closing}, P.N. ${pn}`}>
        <div className="flex border-b border-fg/25 pt-6" aria-hidden>
          {bars.map((b, i) => {
            const down = b.kind === "delta" && (b.delta ?? 0) < 0;
            const zero = b.kind === "delta" && b.delta === 0;
            const after = b.kind === "total" ? b.hi : down ? b.lo : b.hi;
            return (
              <div key={b.name} className="relative h-[220px] flex-1">
                {!zero && (
                  <div
                    className={cn(
                      "absolute border transition-all duration-500 ease-out",
                      b.kind === "total" && "border-fg bg-fg/[0.08]",
                      b.kind === "delta" && !b.focal && (down ? "border-muted bg-surface" : "border-muted bg-muted/15"),
                      b.focal && "border-amber-600 bg-amber-500/20 dark:border-amber-400",
                    )}
                    style={{ bottom: pctOf(b.lo), height: pctOf(b.hi - b.lo), insetInlineStart: "18%", insetInlineEnd: "18%" }}
                  />
                )}
                <span
                  className={cn("absolute inset-x-0 text-center text-[12px] leading-none transition-all duration-500 ease-out", b.focal ? "font-bold text-amber-700 dark:text-amber-300" : b.kind === "total" ? "font-semibold text-fg" : "text-muted")}
                  style={down ? { top: `calc(${100 - (b.lo / TOP) * 100}% + 5px)` } : { bottom: `calc(${pctOf(b.hi)} + 5px)` }}
                >
                  {b.kind === "total" ? <Num v={b.hi} /> : zero ? "0" : <Signed v={b.delta!} />}
                </span>
                {i < bars.length - 1 && (
                  <div className="absolute border-t border-fg/55 transition-all duration-500 ease-out" style={{ bottom: pctOf(after), insetInlineStart: "82%", width: "36%" }} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex pt-2" aria-hidden>
          {bars.map((b) => (
            <div key={b.name} className="flex-1 px-0.5 text-center leading-tight">
              <p className={cn("text-[12.5px] font-semibold", b.focal ? "text-amber-700 dark:text-amber-300" : "text-fg")}>
                <bdi>{b.name}</bdi>
              </p>
              <p className="text-[11px] text-muted">{b.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl bg-surface-2/60 px-3.5 py-3 text-[14px] leading-relaxed text-fg">
        <p>
          צפוי: <Num v={OPENING} /> + <Num v={INTEREST} /> + <Num v={SERVICE} /> − <Num v={PAID} /> = <strong><Num v={EXPECTED} /></strong>. בפועל, במדידה החדשה: <strong><Num v={c.closing} /></strong>.
        </p>
        <p>
          P.N. = <Num v={c.closing} /> − <Num v={EXPECTED} /> ={" "}
          <strong className="text-amber-700 dark:text-amber-300">{pn === 0 ? "0" : <><Num v={Math.abs(pn)} /> {pn > 0 ? "הפסד" : "רווח"}</>}</strong>. {c.says}
        </p>
      </div>
    </figure>
  );
}
