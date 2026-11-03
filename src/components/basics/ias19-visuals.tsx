import { ArrowDown, ArrowRight, Ban, Check, User, UserX, X } from "lucide-react";
import type { ReactNode } from "react";
import { cappedSurplus, type Destination, netLiability, pvPath } from "@/lib/learn/ias19";
import { cn } from "@/lib/utils";
import { type ColorKey, FORMULA_COLORS, Mark, tint } from "./ias19-formula";
import { Arrows } from "./ias19-arrows";
import { Money } from "./ui";

/**
 * The employee-benefits course's figures: what a lecturer would draw on the
 * board. A time line (earlier on the right, as Hebrew reads), a future amount
 * shrinking to today, the debt climbing a step a year, people some of whom
 * leave, a year cut into periods, before and after, where each line of the
 * roll-forward lands, the obligation against the assets, a bank statement,
 * two cases side by side, a wrong way against the right one and a fork.
 * Every number comes in as a prop, from the solver; the figures only draw.
 * Each says what it shows in its aria-label, and none relies on colour alone.
 */

const nf = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
const N = ({ v }: { v: number }) => (
  <bdi dir="ltr" className="num whitespace-nowrap">
    {nf.format(Math.round(v))}
  </bdi>
);

/** A figure's frame: a caption on top, the drawing, an optional note under it. */
function Frame({ label, title, note, children, className }: { label: string; title?: ReactNode; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure role="img" aria-label={label} className={cn("space-y-2.5 rounded-2xl border border-line bg-surface p-3.5", className)}>
      {title && <figcaption className="text-[14px] font-bold text-fg">{title}</figcaption>}
      {children}
      {note && <p className="text-[13px] text-muted">{note}</p>}
    </figure>
  );
}

/** A tone outside the five parts: where a line is reported, or a plain emphasis. */
export type Tone = ColorKey | "pl" | "oci" | "bs" | "accent" | "danger";
const TONE_COLOR: Record<Exclude<Tone, ColorKey>, string> = { pl: "var(--fg)", oci: "var(--credit)", bs: "var(--accent)", accent: "var(--accent)", danger: "var(--danger)" };
const toneColor = (t: Tone) => (typeof t === "number" ? FORMULA_COLORS[t].color : TONE_COLOR[t]);
const toneStyle = (t: Tone, wash = 16) => ({ borderColor: toneColor(t), background: `color-mix(in oklab, ${toneColor(t)} ${wash}%, transparent)` });

// ---------------------------------------------------------------------------
// Time line.

export type TimeSpan = { from: number; to: number; label: ReactNode; tone: Tone; row?: number };
export type TimeMark = { at: number; label: ReactNode; tone?: Tone; strong?: boolean };

/**
 * A time line: ticks on an axis, spans above it (each on its row, with its
 * label and a double arrow), and marks (a date that matters) across it.
 * Earlier is on the right, as Hebrew reads.
 */
export function Timeline({ label, title, from, to, ticks, spans = [], marks = [], note }: { label: string; title?: ReactNode; from: number; to: number; ticks: { at: number; label: ReactNode }[]; spans?: TimeSpan[]; marks?: TimeMark[]; note?: ReactNode }) {
  const x = (v: number) => `${((v - from) / (to - from)) * 100}%`;
  const w = (a: number, b: number) => `${((b - a) / (to - from)) * 100}%`;
  const rows = spans.length ? Math.max(...spans.map((s) => s.row ?? 0)) + 1 : 0;
  return (
    <Frame label={label} title={title} note={note}>
      <div className="relative mx-3 pt-1" style={{ paddingBottom: "2.6rem" }}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="relative mb-1.5 h-12">
            {spans
              .filter((s) => (s.row ?? 0) === r)
              .map((s, i) => (
                <div key={i} className="absolute inset-y-0 flex flex-col justify-end" style={{ insetInlineStart: x(s.from), width: w(s.from, s.to) }}>
                  <span className="mb-0.5 truncate px-0.5 text-center text-[12px] font-semibold leading-tight text-fg">{s.label}</span>
                  <span className="relative h-3.5 rounded-sm border-2" style={toneStyle(s.tone, 30)}>
                    <ArrowRight className="absolute -end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rtl:rotate-180" style={{ color: toneColor(s.tone) }} aria-hidden />
                    <ArrowRight className="absolute -start-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ltr:rotate-180" style={{ color: toneColor(s.tone) }} aria-hidden />
                  </span>
                </div>
              ))}
          </div>
        ))}
        <div className="relative h-0.5 bg-line-strong">
          {ticks.map((t, i) => (
            <span key={i} className="absolute top-0 -translate-y-1/2" style={{ insetInlineStart: x(t.at) }}>
              <span className="block h-3 w-0.5 -translate-x-1/2 bg-fg/60 rtl:translate-x-1/2" />
              <span className="absolute top-3 w-max max-w-[6.5rem] -translate-x-1/2 text-center text-[11.5px] leading-tight text-muted rtl:translate-x-1/2">{t.label}</span>
            </span>
          ))}
        </div>
        {marks.map((m, i) => (
          <span key={i} className="absolute top-0 bottom-6 w-0 border-s-2 border-dashed" style={{ insetInlineStart: x(m.at), borderColor: toneColor(m.tone ?? "accent") }}>
            <span
              className={cn("absolute -top-1 w-max max-w-[7rem] -translate-y-full rounded px-1.5 py-0.5 text-center text-[11.5px] font-bold leading-tight text-fg rtl:translate-x-1/2 ltr:-translate-x-1/2", m.strong && "ring-2")}
              style={{ ...toneStyle(m.tone ?? "accent", 18), ["--tw-ring-color" as string]: toneColor(m.tone ?? "accent") }}
            >
              {m.label}
            </span>
          </span>
        ))}
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Present value.

/**
 * A future amount sliding back to today: one box a year, each the one before
 * it ÷ (1 + i), today's on the right and lit. Long stretches fold into "…".
 */
export function PvSlide({ fv, i, n, title, unit = "₪" }: { fv: number; i: number; n: number; title?: ReactNode; unit?: string }) {
  const path = pvPath(fv, i, n);
  const shown = n <= 5 ? path.map((v, k) => ({ v, k })) : [0, 1, n - 1, n].map((k) => ({ v: path[k], k }));
  const factor = (1 + i).toLocaleString("en-US", { maximumFractionDigits: 4 });
  return (
    <Frame label={`ערך נוכחי: ${nf.format(fv)} ${unit} שישולמו בעוד ${n} שנים, בריבית ${i * 100}%, שווים היום ${nf.format(path[0])} ${unit}`} title={title}>
      <ol className="flex items-end justify-between gap-1 overflow-hidden">
        {shown.map(({ v, k }, j) => (
          <li key={k} className="flex min-w-0 flex-1 items-end gap-1">
            {j > 0 && (
              <span className="mb-6 flex shrink-0 flex-col items-center text-[11px] font-semibold" style={{ color: FORMULA_COLORS[5].color }}>
                {shown[j - 1].k === k - 1 ? <>÷ <bdi dir="ltr">{factor}</bdi></> : <>…</>}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col items-center">
              <span
                className={cn("flex w-full items-end justify-center rounded-t-md border-2 pb-1 text-[12.5px] font-bold text-fg", k === 0 && "ring-2 ring-accent")}
                style={{ height: `${(v / fv) * 6.5}rem`, minHeight: "2.2rem", ...tint(k === 0 ? 0 : 1, k === 0 ? 30 : 12), borderColor: k === 0 ? "var(--accent)" : FORMULA_COLORS[1].color }}
              >
                <N v={v} />
              </span>
              <span className={cn("mt-1 text-center text-[11.5px] leading-tight", k === 0 ? "font-bold text-accent" : "text-muted")}>{k === 0 ? "היום" : k === n ? `בעוד ${n} שנים` : `שנה ${k}`}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-[13px] text-muted">
        כל צעד שמתקרבים להיום מחלקים ב-<bdi dir="ltr">{factor}</bdi> (<Mark c={5} /> ריבית). ההפך מריבית בבנק.
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// The principle.

/** The debt climbing a step for every year of work, and the payment far away at the end. No numbers. */
export function Staircase({ steps = 6, title, stepLabel = "שנת עבודה", pay = "התשלום: ביום הפרישה" }: { steps?: number; title?: ReactNode; stepLabel?: string; pay?: ReactNode }) {
  return (
    <Frame label={`החוב לעובד עולה מדרגה בכל שנת עבודה, והתשלום רחוק, בסוף`} title={title}>
      <div className="flex items-end gap-1">
        {Array.from({ length: steps }, (_, k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col items-center">
            <span className="w-full rounded-t-sm border-2 border-b-0" style={{ height: `${0.9 + (k + 1) * 0.75}rem`, ...tint(1, 10 + k * 5) }} />
            <span className="mt-1 truncate text-[11px] text-muted">{k === steps - 1 ? "…" : `${stepLabel.split(" ")[0]} ${k + 1}`}</span>
          </div>
        ))}
        <div className="flex shrink-0 flex-col items-center px-1">
          <span className="mb-1 rounded-lg border-2 border-dashed border-accent px-2 py-1 text-center text-[12px] font-bold text-accent">{pay}</span>
          <ArrowDown className="h-5 w-5 text-accent" aria-hidden />
          <span className="text-[11px] text-muted">הכסף יוצא</span>
        </div>
      </div>
      <p className="text-[13px] text-fg/85">
        <Mark c={1} /> כל {stepLabel} מוסיפה מדרגה לחוב <strong>באותה שנה</strong>. הכסף יוצא רק בסוף.
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// People.

/** Employees as icons, those expected to leave crossed out; one icon may stand for several. */
export function PeopleGrid({ total, leaving, title, unit = "עובדים" }: { total: number; leaving: number; title?: ReactNode; unit?: string }) {
  const per = total <= 30 ? 1 : [5, 10, 20, 25, 50, 100].find((p) => total / p <= 30 && total % p === 0 && leaving % p === 0) ?? Math.ceil(total / 30);
  const icons = Math.round(total / per);
  const out = Math.round(leaving / per);
  const stay = total - leaving;
  return (
    <Frame label={`${nf.format(total)} ${unit}, מהם ${nf.format(leaving)} צפויים לעזוב ו-${nf.format(stay)} צפויים להישאר`} title={title}>
      <ul className="flex flex-wrap gap-1" aria-hidden>
        {Array.from({ length: icons }, (_, k) => (
          <li key={k}>{k >= icons - out ? <UserX className="h-6 w-6 text-danger/70" /> : <User className="h-6 w-6" style={{ color: FORMULA_COLORS[3].color }} />}</li>
        ))}
      </ul>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-fg">
        <span>
          <User className="inline h-4 w-4" style={{ color: FORMULA_COLORS[3].color }} aria-hidden /> נשארים: <strong><N v={stay} /></strong>
        </span>
        <span>
          <UserX className="inline h-4 w-4 text-danger/70" aria-hidden /> עוזבים: <N v={leaving} />
        </span>
        {per > 1 && <span className="text-muted">כל סמל = {per} {unit}</span>}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// A year in periods.

/** One year as a bar cut into periods, each with its months, rate and years to payment. The year starts on the right. */
export function SplitBar({ title, periods, cuts }: { title?: ReactNode; periods: { months: number; label: ReactNode; rate?: ReactNode; n?: ReactNode; tone?: Tone }[]; cuts?: ReactNode[] }) {
  return (
    <Frame label={`שנה אחת מחולקת ל-${periods.length} תקופות: ${periods.map((p) => `${p.months} חודשים`).join(", ")}`} title={title}>
      <div className="flex overflow-hidden rounded-lg border-2 border-line-strong">
        {periods.map((p, i) => (
          <div key={i} className={cn("min-w-0 space-y-0.5 px-2 py-2 text-center", i > 0 && "border-s-2 border-dashed border-fg/50")} style={{ width: `${(p.months / 12) * 100}%`, ...toneStyle(p.tone ?? (i % 2 ? 4 : 1), 14), borderTop: 0, borderBottom: 0 }}>
            <p className="truncate text-[12.5px] font-bold text-fg">{p.label}</p>
            <p className="text-[12px] text-fg/85">
              <bdi dir="ltr" className="num">{p.months}</bdi> חודשים
            </p>
            {p.rate && (
              <p className="text-[12px] text-fg/85">
                <Mark c={5} /> {p.rate}
              </p>
            )}
            {p.n && (
              <p className="text-[12px] text-fg/85">
                <Mark c={4} /> {p.n}
              </p>
            )}
          </div>
        ))}
      </div>
      {cuts && (
        <div className="flex justify-between text-[11.5px] text-muted">
          {cuts.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Before and after.

/** Two columns, before and after, and the jump between them marked. */
export function BeforeAfter({ title, before, after, jump, unit = "₪" }: { title?: ReactNode; before: { label: ReactNode; v: number }; after: { label: ReactNode; v: number }; jump: ReactNode; unit?: string }) {
  const max = Math.max(before.v, after.v);
  const h = (v: number) => `${2 + (v / max) * 8}rem`;
  const up = after.v - before.v;
  return (
    <Frame label={`לפני ${nf.format(before.v)} ${unit}, אחרי ${nf.format(after.v)} ${unit}: קפיצה של ${nf.format(up)} ${unit}`} title={title}>
      <div className="flex items-end justify-center gap-6">
        <div className="flex w-24 flex-col items-center">
          <span className="text-[13px] font-bold text-fg">
            <N v={before.v} />
          </span>
          <span className="w-full rounded-t-md border-2" style={{ height: h(before.v), ...tint(1, 14) }} />
          <span className="mt-1 text-center text-[12px] text-muted">{before.label}</span>
        </div>
        <div className="flex w-24 flex-col items-center">
          <span className="text-[13px] font-bold text-fg">
            <N v={after.v} />
          </span>
          <span className="flex w-full flex-col overflow-hidden rounded-t-md border-2" style={{ height: h(after.v), borderColor: FORMULA_COLORS[1].color }}>
            <span className="grid place-items-center border-b-2 border-dashed border-danger bg-danger/15 text-[12px] font-bold text-danger" style={{ height: `${(up / after.v) * 100}%` }}>
              +<N v={up} />
            </span>
            <span className="flex-1" style={tint(1, 14)} />
          </span>
          <span className="mt-1 text-center text-[12px] text-muted">{after.label}</span>
        </div>
      </div>
      <p className="text-center text-[13.5px] font-semibold text-danger">{jump}</p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Where each line goes.

const BINS: Record<Destination, { title: string; sub: string; tone: Tone }> = {
  pl: { title: "רווח והפסד", sub: "מה שהחברה עשתה השנה", tone: "pl" },
  oci: { title: "OCI", sub: "שינויי הערכה", tone: "oci" },
  bs: { title: "מאזן", sub: "היתרה בסוף השנה", tone: "bs" },
};

/** The lines of a roll-forward, each with an arrow to the box it is reported in: profit or loss, OCI or the balance sheet. */
export function Routing({ label, title, rows }: { label: string; title?: ReactNode; rows: { label: ReactNode; value?: number; to: Destination }[] }) {
  const used = (Object.keys(BINS) as Destination[]).filter((d) => rows.some((r) => r.to === d));
  const total = (d: Destination) => rows.filter((r) => r.to === d && r.value !== undefined).reduce((s, r) => s + r.value!, 0);
  return (
    <figure role="img" aria-label={label} className="rounded-2xl border border-line bg-surface p-3.5">
      {title && <figcaption className="mb-2.5 text-[14px] font-bold text-fg">{title}</figcaption>}
      <Arrows className="grid gap-x-16 gap-y-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={i} data-arrow-from={`bin-${r.to}`} data-arrow-color={toneColor(BINS[r.to].tone)} className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[14px]" style={toneStyle(BINS[r.to].tone, 6)}>
              <span className="min-w-0 font-medium text-fg">{r.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                {r.value !== undefined && <Money v={r.value} plain />}
                <span className="rounded-full px-1.5 text-[11px] font-bold ring-1 sm:hidden" style={{ color: toneColor(BINS[r.to].tone) }}>
                  ← {BINS[r.to].title}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <ul className="hidden flex-col justify-around gap-3 sm:flex">
          {used.map((d) => (
            <li key={d} data-arrow-to={`bin-${d}`} className="rounded-xl border-2 px-3 py-2 text-center" style={toneStyle(BINS[d].tone, 10)}>
              <p className="text-[15px] font-bold text-fg">{BINS[d].title}</p>
              <p className="text-[11.5px] text-muted">{BINS[d].sub}</p>
              {rows.some((r) => r.to === d && r.value !== undefined) && (
                <p className="mt-0.5 text-[13px] font-bold text-fg">
                  <Money v={total(d)} plain />
                </p>
              )}
            </li>
          ))}
        </ul>
      </Arrows>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Obligation, assets, net.

/** The obligation and the plan assets as two bars, the net between them, and — on a surplus — the ceiling and the part above it that is not recognised. */
export function NetBars({ title, obligation, assets, ceiling }: { title?: ReactNode; obligation: number; assets: number; ceiling?: number }) {
  const max = Math.max(obligation, assets);
  const pctOf = (v: number) => `${(v / max) * 100}%`;
  const net = netLiability(obligation, assets);
  const surplus = -net;
  const kept = ceiling !== undefined && surplus > 0 ? cappedSurplus(assets, obligation, ceiling) : undefined;
  const label =
    net >= 0
      ? `התחייבות ${nf.format(obligation)}, נכסים ${nf.format(assets)}: התחייבות נטו ${nf.format(net)}`
      : `התחייבות ${nf.format(obligation)}, נכסים ${nf.format(assets)}: עודף ${nf.format(surplus)}${kept !== undefined ? `, מוכר עד התקרה ${nf.format(kept)}` : ""}`;
  return (
    <Frame label={label} title={title}>
      <div className="space-y-2">
        <div>
          <p className="mb-0.5 text-[12.5px] font-semibold text-fg">החוב לעובדים</p>
          <div className="h-7 rounded-md border-2 border-credit bg-credit/15" style={{ width: pctOf(obligation) }}>
            <span className="px-2 text-[12.5px] font-bold leading-6 text-fg">
              <N v={obligation} />
            </span>
          </div>
        </div>
        <div>
          <p className="mb-0.5 text-[12.5px] font-semibold text-fg">הכסף בקופה (נכסי תכנית)</p>
          <div className="relative flex h-7" style={{ width: pctOf(assets) }}>
            <div className="h-full rounded-s-md border-2 border-debit bg-debit/15" style={{ width: `${(Math.min(assets, obligation + (kept ?? surplus)) / assets) * 100}%` }}>
              <span className="px-2 text-[12.5px] font-bold leading-6 text-fg">
                <N v={assets} />
              </span>
            </div>
            {kept !== undefined && kept < surplus && (
              <div className="h-full flex-1 rounded-e-md border-2 border-dashed border-danger bg-[repeating-linear-gradient(135deg,transparent_0_5px,color-mix(in_oklab,var(--danger)_25%,transparent)_5px_8px)]" title="מעל התקרה" />
            )}
          </div>
        </div>
      </div>
      <p className="text-[13.5px] text-fg">
        {net >= 0 ? (
          <>
            חוב פחות קופה = <strong>התחייבות נטו <N v={net} /></strong> במאזן.
          </>
        ) : (
          <>
            בקופה יש <N v={surplus} /> יותר מהחוב: <strong>נכס נטו</strong>
            {kept !== undefined && (
              <>
                , אבל רק עד התקרה: <strong><N v={kept} /></strong>
                {kept < surplus && (
                  <span className="text-danger">
                    {" "}
                    (<N v={surplus - kept} /> מעל התקרה, מסומן בפסים, לא מוצג)
                  </span>
                )}
              </>
            )}
            .
          </>
        )}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// A bank statement: the roll-forward as everyone already knows it.

/** A bank statement: opening, what came in and went out, the closing — and, if given, the amount nobody explained yet, found by working back. */
export function BankStatement({ title = "דף חשבון", opening, moves, closing, unexplained }: { title?: ReactNode; opening: number; moves: { label: ReactNode; v: number }[]; closing: number; unexplained?: ReactNode }) {
  const expected = opening + moves.reduce((s, m) => s + m.v, 0);
  const gap = closing - expected;
  return (
    <Frame label={`דף חשבון: פתיחה ${nf.format(opening)}, תנועות, סגירה ${nf.format(closing)}${unexplained ? `; לא הוסבר ${nf.format(gap)}` : ""}`} title={title}>
      <table className="w-full text-[14px]">
        <tbody>
          <tr className="border-b border-line">
            <th scope="row" className="py-1.5 text-start font-semibold text-fg">
              יתרת פתיחה
            </th>
            <td className="py-1.5 text-end font-semibold">
              <N v={opening} />
            </td>
          </tr>
          {moves.map((m, i) => (
            <tr key={i} className="border-b border-line">
              <th scope="row" className="py-1.5 text-start font-normal text-fg/90">
                {m.label}
              </th>
              <td className={cn("py-1.5 text-end font-semibold", m.v >= 0 ? "text-success" : "text-danger")}>
                <bdi dir="ltr" className="num">
                  {m.v >= 0 ? "+" : "−"}
                  {nf.format(Math.abs(m.v))}
                </bdi>
              </td>
            </tr>
          ))}
          {unexplained && (
            <tr className="border-b border-line bg-amber-500/[0.12]">
              <th scope="row" className="py-1.5 ps-1 text-start font-bold text-fg">
                {unexplained}
              </th>
              <td className="py-1.5 pe-1 text-end font-bold">
                <bdi dir="ltr" className="num">
                  {gap >= 0 ? "+" : "−"}
                  {nf.format(Math.abs(gap))}
                </bdi>
              </td>
            </tr>
          )}
          <tr>
            <th scope="row" className="pt-1.5 text-start font-bold text-fg">
              יתרת סגירה
            </th>
            <td className="pt-1.5 text-end font-bold">
              <span className="border-t-2 border-b-4 border-double border-fg/70 px-1">
                <N v={closing} />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Two cases, a wrong way and the right one, a fork.

/** Two cases side by side, each a short chain of steps with arrows down, and its verdict at the foot. */
export function TwoPanel({ label, panels }: { label: string; panels: { title: ReactNode; icon?: ReactNode; steps: ReactNode[]; verdict: ReactNode; tone?: Tone }[] }) {
  return (
    <figure role="img" aria-label={label} className="grid gap-3 sm:grid-cols-2">
      {panels.map((p, i) => (
        <div key={i} className="flex flex-col rounded-2xl border-2 p-3" style={toneStyle(p.tone ?? (i ? 4 : 1), 7)}>
          <p className="mb-2 flex items-center gap-2 text-[15px] font-bold text-fg">
            {p.icon && <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5" style={{ color: toneColor(p.tone ?? (i ? 4 : 1)) }}>{p.icon}</span>}
            {p.title}
          </p>
          <ol className="flex-1">
            {p.steps.map((s, j) => (
              <li key={j} className="flex flex-col items-center">
                <span className="w-full rounded-lg bg-surface px-2.5 py-1.5 text-center text-[13.5px] text-fg ring-1 ring-line">{s}</span>
                {j < p.steps.length - 1 && <ArrowDown className="my-0.5 h-4 w-4 text-subtle" aria-hidden />}
              </li>
            ))}
          </ol>
          <p className="mt-2 rounded-lg px-2.5 py-1.5 text-center text-[14px] font-bold text-fg" style={toneStyle(p.tone ?? (i ? 4 : 1), 20)}>
            {p.verdict}
          </p>
        </div>
      ))}
    </figure>
  );
}

/** A common mistake against the right way: ✗ beside ✓, the difference marked with `<Diff>`. */
export function WrongRight({ label, wrong, right }: { label: string; wrong: ReactNode; right: ReactNode }) {
  return (
    <figure aria-label={label} className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border-2 border-danger/40 bg-danger/5 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[14px] font-bold text-danger">
          <X className="h-4 w-4" aria-hidden /> הטעות
        </p>
        <div className="space-y-1.5 text-[14px] text-fg">{wrong}</div>
      </div>
      <div className="rounded-2xl border-2 border-success/40 bg-success/5 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[14px] font-bold text-success">
          <Check className="h-4 w-4" aria-hidden /> הנכון
        </p>
        <div className="space-y-1.5 text-[14px] text-fg">{right}</div>
      </div>
    </figure>
  );
}

/** The part that differs between the wrong way and the right one. */
export const Diff = ({ children }: { children: ReactNode }) => <mark className="rounded bg-amber-400/30 px-0.5 font-semibold text-fg">{children}</mark>;

/** A question and its branches, each with an arrow to what follows (and where it is reported). */
export function Fork({ label, question, branches }: { label: string; question: ReactNode; branches: { when: ReactNode; then: ReactNode; to?: Destination | "none" }[] }) {
  return (
    <figure role="img" aria-label={label} className="space-y-2 rounded-2xl border border-line bg-surface p-3.5">
      <p className="mx-auto w-fit max-w-full rounded-xl border-2 border-accent bg-accent-soft px-3 py-2 text-center text-[14.5px] font-bold text-fg">{question}</p>
      <div className={cn("grid gap-2", branches.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {branches.map((b, i) => (
          <div key={i} className="flex flex-col items-center">
            <ArrowDown className="h-5 w-5 text-subtle" aria-hidden />
            <span className="text-[13px] font-bold text-accent">{b.when}</span>
            <ArrowDown className="h-4 w-4 text-subtle" aria-hidden />
            <span className="w-full flex-1 rounded-xl bg-surface-2/60 px-2.5 py-2 text-center text-[13.5px] text-fg ring-1 ring-line">
              {b.then}
              {b.to && b.to !== "none" && (
                <span className="mt-1 block">
                  <span className="rounded-full border px-2 text-[11.5px] font-bold" style={toneStyle(BINS[b.to].tone, 14)}>
                    ← {BINS[b.to].title}
                  </span>
                </span>
              )}
              {b.to === "none" && (
                <span className="mt-1 flex items-center justify-center gap-1 text-[11.5px] font-bold text-muted">
                  <Ban className="h-3.5 w-3.5" aria-hidden /> לא נרשם עכשיו
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
