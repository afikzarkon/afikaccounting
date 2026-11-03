import { Children, cloneElement, type CSSProperties, Fragment, isValidElement, type ReactNode } from "react";
import { ltrMarks } from "@/lib/study/ias19/ltr";
import { cn } from "@/lib/utils";
import { Arrows } from "./ias19-arrows";
import { Reveal } from "./inventory-teach";

/**
 * A formula drawn, not typed: each part a coloured slot with its circled
 * number and a plain Hebrew name, the same colour and number for the same part
 * everywhere in the course; arrows from the data to the slots; then the
 * numbers under the symbols, the working, and the result — one step at a time.
 */

/** The five parts of a measurement, and a neutral one for any other part. The colours are the site's series tokens. */
export const FORMULA_COLORS = {
  1: { mark: "①", name: "הטבה לשנת עבודה", color: "var(--series-1)" },
  2: { mark: "②", name: "שנות עבודה שעברו", color: "var(--series-3)" },
  3: { mark: "③", name: "עובדים צפויים", color: "var(--series-4)" },
  4: { mark: "④", name: "שנים עד התשלום", color: "var(--series-2)" },
  5: { mark: "⑤", name: "ריבית", color: "var(--credit)" },
  0: { mark: "", name: "", color: "var(--muted)" },
} as const;
export type ColorKey = keyof typeof FORMULA_COLORS;

/** A tinted chip in a part's colour: the colour on the border and a wash behind, the text in the page's own colour. */
export const tint = (c: ColorKey, wash = 14): CSSProperties => ({
  borderColor: FORMULA_COLORS[c].color,
  background: `color-mix(in oklab, ${FORMULA_COLORS[c].color} ${wash}%, transparent)`,
});

/** A part's circled number, in its colour. */
export function Mark({ c }: { c: ColorKey }) {
  if (!FORMULA_COLORS[c].mark) return null;
  return (
    <span className="font-bold" style={{ color: FORMULA_COLORS[c].color }} aria-hidden>
      {FORMULA_COLORS[c].mark}
    </span>
  );
}

export type Term = {
  c: ColorKey;
  /** The part's short name in the formula. */
  sym: ReactNode;
  /** The number that goes in. */
  value?: ReactNode;
  /** Where it comes from in the data, as the data says it. */
  from?: ReactNode;
  /** What the part is, in one sentence. */
  why?: ReactNode;
};

/** A formula token: text as it is, a term's slot, or a term's slot as an exponent. */
export type Tok = string | { t: string } | { sup: string };

function Slot({ term, id, show, small }: { term: Term; id?: string; show: "sym" | "value"; small?: boolean }) {
  return (
    <span
      data-arrow-to={id}
      className={cn("inline-flex items-baseline gap-1 rounded-lg border-2 px-1.5 py-0.5 font-semibold text-fg", small ? "text-[13px]" : "text-[15px]")}
      style={tint(term.c)}
    >
      <Mark c={term.c} />
      {show === "sym" ? term.sym : <bdi dir="ltr">{term.value}</bdi>}
    </span>
  );
}

function Line({ lhs, top, bottom, terms, show, anchors, tail }: { lhs?: ReactNode; top: Tok[]; bottom?: Tok[]; terms: Record<string, Term>; show: "sym" | "value"; anchors?: boolean; tail?: ReactNode }) {
  const render = (toks: Tok[]) =>
    toks.map((t, i) =>
      typeof t === "string" ? (
        <span key={i} className="whitespace-pre text-[18px] font-semibold text-fg" dir="ltr">
          {t}
        </span>
      ) : "t" in t ? (
        <Slot key={i} term={terms[t.t]} id={anchors ? t.t : undefined} show={show} />
      ) : (
        // Raised by the flex row itself, not by <sup>: the reset gives <sup> no line height, and the chip collapsed onto the fraction bar.
        <span key={i} className="-ms-0.5 -mt-2.5 self-start">
          <Slot term={terms[t.sup]} id={anchors ? t.sup : undefined} show={show} small />
        </span>
      ),
    );
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-2" dir="ltr">
      {bottom ? (
        <span className="inline-flex flex-col items-center">
          <span className="flex flex-wrap items-center justify-center gap-1 px-1 pb-1.5">{render(top)}</span>
          <span className="flex w-full items-center justify-center gap-1 border-t-2 border-fg/70 px-1 pt-4" dir="ltr">
            {render(bottom)}
          </span>
        </span>
      ) : (
        <span className="flex flex-wrap items-center gap-1">{render(top)}</span>
      )}
      {lhs && <span className="font-bold text-fg">= {lhs}</span>}
      {tail}
    </span>
  );
}

/**
 * The formula, read left to right as in a maths notebook — the working on the
 * left, "=", and what it gives on the right, in Hebrew as in English: the data (each with its part's colour and number) and arrows
 * from them to the slots; under it, what each part is; then, step by step,
 * the numbers in the slots, the working, and the result. `stepwise={false}`
 * shows it all at once.
 */
export function FormulaFill({
  label,
  lhs,
  terms,
  top,
  bottom,
  working = [],
  result,
  given = true,
  stepwise = true,
}: {
  label: string;
  lhs?: ReactNode;
  terms: Record<string, Term>;
  top: Tok[];
  bottom?: Tok[];
  working?: ReactNode[];
  result?: ReactNode;
  given?: boolean;
  stepwise?: boolean;
}) {
  const keys = Object.keys(terms);
  const withValues = keys.some((k) => terms[k].value !== undefined);
  const steps: ReactNode[] = [
    <span key="sym" className="block">
      <span className="mb-1 block text-[12px] font-bold text-muted">הנוסחה</span>
      <Line lhs={lhs} top={top} bottom={bottom} terms={terms} show="sym" anchors={given} />
    </span>,
    ...(withValues
      ? [
          <span key="val" className="block">
            <span className="mb-1 block text-[12px] font-bold text-muted">מציבים את המספרים</span>
            <Line lhs={lhs} top={top} bottom={bottom} terms={terms} show="value" />
          </span>,
        ]
      : []),
    ...working.map((w, i) => (
      <span key={`w${i}`} className="block text-[15px] text-fg" dir="auto">
        {w}
      </span>
    )),
    ...(result !== undefined
      ? [
          <span key="res" className="block text-[16.5px] font-bold text-fg" dir="ltr">
            <span className="rounded-md bg-surface px-2 py-0.5 ring-2 ring-accent">{result}</span>
            {lhs && <> = {lhs}</>}
          </span>,
        ]
      : []),
  ];
  return (
    <figure aria-label={label} className="space-y-3 rounded-2xl border border-line bg-surface p-3.5">
      <Arrows className="space-y-5">
        {given && (
          <ul className="flex flex-wrap gap-2" aria-label="הנתונים">
            {keys.map((k) => (
              <li key={k} data-arrow-from={k} data-arrow-color={FORMULA_COLORS[terms[k].c].color} className="rounded-xl border-2 px-2.5 py-1.5 text-[13.5px]" style={tint(terms[k].c, 8)}>
                <span className="flex items-center gap-1 font-semibold text-fg">
                  <Mark c={terms[k].c} /> {terms[k].sym}
                </span>
                {terms[k].from !== undefined && <bdi className="block text-fg/85">{terms[k].from}</bdi>}
              </li>
            ))}
          </ul>
        )}
        {stepwise ? (
          <Reveal steps={steps} label="הצעד הבא" />
        ) : (
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="rounded-lg bg-accent-soft px-3 py-2">
                {s}
              </li>
            ))}
          </ol>
        )}
      </Arrows>
      {keys.some((k) => terms[k].why) && (
        <dl className="grid gap-x-3 gap-y-1 border-t border-line pt-2 text-[13.5px] sm:grid-cols-[auto_1fr]">
          {keys
            .filter((k) => terms[k].why)
            .map((k) => (
              <div key={k} className="contents">
                <dt className="flex items-center gap-1 font-semibold text-fg">
                  <Mark c={terms[k].c} /> {terms[k].sym}
                </dt>
                <dd className="text-fg/85">{terms[k].why}</dd>
              </div>
            ))}
        </dl>
      )}
    </figure>
  );
}

/**
 * One formula written out a few ways — in words, in letters, with the
 * numbers in — each line read left to right, as in a maths notebook.
 */
export function Eq({ rows, note }: { rows: { label: ReactNode; f: ReactNode }[]; note?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 px-3 py-2.5">
      <dl className="space-y-2">
        {rows.map((r, i) => (
          <div key={i}>
            <dt className="text-[12.5px] font-bold text-muted">{r.label}</dt>
            <dd dir="ltr" className="num mt-0.5 flex flex-wrap items-center gap-x-1.5 text-start text-[15px] text-fg">
              {marked(r.f)}
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-2 text-[13.5px] text-muted">{note}</p>}
    </div>
  );
}

/** Every string in a formula (one fragment deep) with its operators held in place. */
function marked(n: ReactNode): ReactNode {
  return Children.map(n, (c) => (typeof c === "string" ? ltrMarks(c) : isValidElement<{ children?: ReactNode }>(c) && c.type === Fragment ? cloneElement(c, undefined, marked(c.props.children)) : c));
}

/** A formula inside a Hebrew sentence, read left to right. */
export const Ltr = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{marked(children)}</bdi>;

/** A fraction drawn stacked: the numerator over a line, the denominator under it. */
export function Frac({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center align-middle">
      <span className="px-1 pb-0.5">{marked(top)}</span>
      <span className="w-full border-t-2 border-fg/70 px-1 pt-0.5 text-center">{marked(bottom)}</span>
    </span>
  );
}
