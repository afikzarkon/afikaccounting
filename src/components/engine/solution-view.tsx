"use client";

import {
  BookOpenText,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  FileDown,
  FileSpreadsheet,
  Info,
  Lightbulb,
  ListChecks,
  Printer,
  ScrollText,
  Table2,
} from "lucide-react";
import "katex/dist/katex.min.css";
import { motion, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { amount, formatCell, money, percent, plain } from "@/lib/engine/format";
import { round2, sum } from "@/lib/engine/math";
import type { Equation, JournalEntry, Metric, ScheduleTable, Solution, SolutionStage, StageStep, StatementLine, Working, YearSection } from "@/lib/engine/types";
import { exprToTex, renderTex } from "@/lib/tex";
import { cn } from "@/lib/utils";
import { downloadCsv, fileSlug, journalToCsv, tableToCsv } from "./export";

const OUTCOME: Record<Solution["outcome"], { label: string; tone: "success" | "accent" | "warning" | "neutral" }> = {
  recognised: { label: "הוכר", tone: "success" },
  exempt: { label: "הוחל פטור", tone: "accent" },
  "disclose-only": { label: "גילוי בלבד", tone: "warning" },
  none: { label: "ללא הכרה", tone: "neutral" },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function SolutionView({
  solution,
  currency,
  standard,
  title,
}: {
  solution: Solution;
  currency: string;
  standard: string;
  title: string;
}) {
  const outcome = OUTCOME[solution.outcome];
  const base = fileSlug(`${standard} ${title}`);
  // With a walk-through, its stages carry the cost table and the statements; the rest follow as appendices.
  const walk = solution.walk;
  const inWalk = new Set(walk ? ["cost", "balance-sheet", "profit-or-loss"] : []);
  const tables = solution.tables.filter((t) => !inWalk.has(t.id));

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-24 -end-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-2">
          <Badge tone={outcome.tone}>{outcome.label}</Badge>
          <Badge>{standard}</Badge>
        </div>
        <p className="relative mt-3 max-w-3xl text-lg leading-snug font-semibold text-fg sm:text-xl">{solution.headline}</p>
        {solution.metrics.length > 0 && (
          <dl className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {solution.metrics.map((m) => (
              <MetricTile key={m.label} metric={m} currency={currency} />
            ))}
          </dl>
        )}
      </motion.div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {walk && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
              <WalkView stages={walk} onExport={() => downloadCsv(`${base}-journal`, journalToCsv(solution.journal))} />
            </motion.div>
          )}

          {walk && tables.length > 0 && <p className="pt-2 text-sm font-semibold text-muted">נספחים: לוח הפחת המלא, השוואת שיטות ובאור</p>}

          {!walk && solution.proof && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
              <ProofCard proof={solution.proof} />
            </motion.div>
          )}

          {!walk && solution.years && solution.years.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
              <YearBreakdown
                title={solution.proof ? "שלב ב׳: פתרון שנה אחר שנה, עם X במקומו" : "פתרון שנה אחר שנה"}
                years={solution.years}
                onExport={() => downloadCsv(`${base}-journal`, journalToCsv(solution.journal))}
              />
            </motion.div>
          )}

          {!solution.years && solution.journal.length > 0 && (
            <motion.section variants={fadeUp} initial="hidden" animate="show" custom={1} className="card overflow-hidden">
              <PanelHeader
                icon={<ScrollText className="h-4 w-4" />}
                title="פקודות יומן"
                subtitle={`${solution.journal.length === 1 ? "פקודה אחת" : `${solution.journal.length} פקודות`} · ${currency}`}
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadCsv(`${base}-journal`, journalToCsv(solution.journal))}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </Button>
                }
              />
              <JournalTable journal={solution.journal} />
            </motion.section>
          )}

          {tables.map((t, i) => (
            <motion.div key={t.id} variants={fadeUp} initial="hidden" animate="show" custom={2 + i}>
              <ScheduleCard table={t} fileBase={`${base}-${t.id}`} />
            </motion.div>
          ))}

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2 + tables.length}>
            <DisclosureCard text={solution.disclosure} />
          </motion.div>
        </div>

        <motion.aside
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="space-y-6 xl:sticky xl:top-24"
        >
          <GuidanceBox guidance={solution.guidance} />
          {solution.assumptions.length > 0 && (
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                <ListChecks className="h-4 w-4 text-accent" /> הנחות
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
                {solution.assumptions.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-subtle" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  );
}

function MetricTile({ metric, currency }: { metric: Metric; currency: string }) {
  const value =
    metric.format === "percent" ? percent(metric.value) : metric.format === "number" ? plain(metric.value) : money(metric.value, currency);
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <dt className="text-xs text-muted">{metric.label}</dt>
      <dd className="num mt-1 text-lg font-semibold tracking-tight text-fg">{value}</dd>
      {metric.hint && <p className="mt-1 text-[11px] leading-snug text-subtle">{metric.hint}</p>}
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function JournalTable({ journal }: { journal: JournalEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-start text-[11px] text-subtle">
            <th className="px-5 py-2.5 font-medium">חשבון</th>
            <th className="w-36 bg-debit/[0.06] px-5 py-2.5 text-end font-medium">
              <span className="text-debit">חובה (Dr)</span>
            </th>
            <th className="w-36 bg-credit/[0.06] px-5 py-2.5 text-end font-medium">
              <span className="text-credit">זכות (Cr)</span>
            </th>
          </tr>
        </thead>
        {journal.map((e) => {
          const dr = round2(sum(e.lines.map((l) => l.debit)));
          return (
            <tbody key={e.id} className="border-b border-line last:border-b-0">
              <tr className="bg-surface-2/50">
                <td colSpan={3} className="px-5 py-2.5">
                  <span className="me-2 rounded-md bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted ring-1 ring-line">
                    {e.id}
                  </span>
                  <span className="text-xs font-medium text-muted">{e.when}</span>
                  <span className="mx-2 text-subtle">·</span>
                  <span className="text-[13px] text-fg">{e.narrative}</span>
                  {e.reference && <Reference className="ms-2">{e.reference}</Reference>}
                </td>
              </tr>
              {e.lines.map((l, i) => (
                <tr key={i} className="transition-colors hover:bg-surface-2/40">
                  <td className={cn("px-5 py-2", l.credit > 0 && "ps-12 text-muted")}>
                    <span className={cn("me-1.5 text-xs font-semibold", l.credit > 0 ? "text-credit" : "text-debit")}>
                      {l.credit > 0 ? "ז׳" : "ח׳"}
                    </span>
                    <span className={l.credit > 0 ? "" : "text-fg"}>{l.account}</span>
                  </td>
                  <td className="num bg-debit/[0.06] px-5 py-2 text-end font-mono text-[13px] text-debit">{l.debit ? amount(l.debit) : ""}</td>
                  <td className="num bg-credit/[0.06] px-5 py-2 text-end font-mono text-[13px] text-credit">{l.credit ? amount(l.credit) : ""}</td>
                </tr>
              ))}
              <tr>
                <td className="px-5 pt-1 pb-3 text-end text-[11px] text-subtle">מאוזן</td>
                <td className="num px-5 pt-1 pb-3 text-end font-mono text-[12px] text-muted">
                  <span className="border-t border-double border-line-strong pt-1">{amount(dr)}</span>
                </td>
                <td className="num px-5 pt-1 pb-3 text-end font-mono text-[12px] text-muted">
                  <span className="border-t border-double border-line-strong pt-1">{amount(dr)}</span>
                </td>
              </tr>
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

const PREVIEW_ROWS = 12;

const EMPHASIS: Record<string, string> = {
  subtotal: "font-medium text-fg bg-surface-2/40",
  total: "font-semibold text-fg bg-accent-soft",
  event: "bg-amber-500/8 text-fg",
};

function ScheduleCard({ table, fileBase }: { table: ScheduleTable; fileBase: string }) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const long = table.rows.length > PREVIEW_ROWS;
  const rows = expanded || !long ? table.rows : table.rows.slice(0, PREVIEW_ROWS);

  return (
    <section className="card overflow-hidden">
      <PanelHeader
        icon={<Table2 className="h-4 w-4" />}
        title={table.title}
        subtitle={table.caption ?? `${table.rows.length} שורות`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => downloadCsv(fileBase, tableToCsv(table))}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()} title="הדפסה או שמירה כ-PDF">
              <FileDown className="h-3.5 w-3.5" /> PDF
            </Button>
          </>
        }
      />
      {(table.note || table.reference) && (
        <div className="border-b border-line bg-surface-2/40 px-5 py-3 text-[13px] leading-relaxed text-muted">
          {table.note}
          {table.reference && <Reference className={table.note ? "ms-2" : undefined}>{table.reference}</Reference>}
        </div>
      )}
      <div className={cn("print-expand overflow-x-auto", !expanded && long && "max-h-[520px]")}>
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              {table.columns.map((c, i) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-2.5 text-[11px] font-medium whitespace-nowrap text-subtle",
                    i === 0 ? "text-start" : "text-end",
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={r}
                onMouseEnter={() => setHover(r)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  "border-b border-line/60 transition-colors",
                  row._emphasis ? EMPHASIS[row._emphasis] : "text-muted",
                  hover === r && "bg-accent-soft/60 text-fg",
                )}
              >
                {table.columns.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-2 whitespace-nowrap",
                      i === 0 ? "text-start" : "num text-end font-mono",
                      i === 0 && "text-fg",
                    )}
                  >
                    {formatCell(row[c.key], c.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {table.totals && (
            <tfoot>
              <tr className="border-t-2 border-line-strong bg-surface-2/60 font-semibold text-fg">
                {table.columns.map((c, i) => (
                  <td key={c.key} className={cn("px-4 py-2.5 whitespace-nowrap", i === 0 ? "text-start" : "num text-end font-mono")}>
                    {formatCell(table.totals![c.key], c.format)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="no-print flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          {expanded ? "הצגת פחות שורות" : `הצגת כל ${table.rows.length} השורות`}
        </button>
      )}
    </section>
  );
}

function DisclosureCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="card overflow-hidden">
      <PanelHeader
        icon={<BookOpenText className="h-4 w-4" />}
        title="באור"
        subtitle="טיוטת נוסח לבאורים לדוחות הכספיים"
        actions={
          <>
            <Button variant={copied ? "secondary" : "primary"} size="sm" onClick={copy} aria-live="polite">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copied ? "הועתק" : "העתקה ללוח"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()} title="הדפסה או שמירה כ-PDF">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      />
      <div className="relative p-5">
        <div className="absolute inset-y-5 start-5 w-0.5 rounded bg-gradient-to-b from-accent to-cyan-400" />
        <div className="ps-5 font-serif text-[14.5px] leading-7 whitespace-pre-wrap text-fg/90">{text}</div>
      </div>
    </section>
  );
}

function GuidanceBox({ guidance }: { guidance: Solution["guidance"] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-gradient-to-l from-accent-soft to-transparent px-5 py-4">
        <Info className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-fg">הסבר תיאורטי</p>
      </div>
      <div className="divide-y divide-line">
        {guidance.map((g) => (
          <div key={g.title} className="p-5">
            <p className="text-sm font-medium text-fg">{g.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{g.body}</p>
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] text-accent">
              <BookOpenText className="h-3 w-3" /> {g.reference}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The solution stage by stage, in reading order: each stage says why it comes,
 * each step why it is done, then shows it. One-per-year steps fold, the first
 * open; printing opens them all.
 */
function WalkView({ stages, onExport }: { stages: SolutionStage[]; onExport: () => void }) {
  useEffect(() => {
    const open = () => document.querySelectorAll<HTMLDetailsElement>("details[data-walk]").forEach((d) => (d.open = true));
    window.addEventListener("beforeprint", open);
    return () => window.removeEventListener("beforeprint", open);
  }, []);
  return (
    <div className="space-y-5">
      <nav aria-label="שלבי הפתרון" className="no-print card p-3">
        <p className="mb-2 px-1 text-xs font-semibold text-muted">דרך הפתרון — {stages.length} שלבים</p>
        <ol className="flex flex-wrap gap-1.5">
          {stages.map((st, i) => (
            <li key={st.id}>
              <a
                href={`#stage-${st.id}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] font-medium text-fg transition-colors hover:border-accent hover:bg-accent-soft/60"
              >
                <span className="num grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{i + 1}</span>
                {st.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {stages.map((st, i) => (
        <section key={st.id} id={`stage-${st.id}`} aria-labelledby={`stage-${st.id}-h`} className="card scroll-mt-24 overflow-hidden">
          <header className="flex items-start gap-3 border-b border-line bg-gradient-to-l from-accent-soft/70 to-transparent px-5 py-4">
            <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <h2 id={`stage-${st.id}-h`} className="text-base font-semibold text-fg">
                {st.title}
              </h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{st.why}</p>
            </div>
            {st.id === "journal" && (
              <Button variant="secondary" size="sm" className="no-print" onClick={onExport} title="כל פקודות היומן">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </Button>
            )}
          </header>
          <ol className="divide-y divide-line">
            {st.steps.map((step, j) => (
              <li key={step.id} className="px-5 py-4">
                <StageStepView step={step} n={`${i + 1}.${j + 1}`} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function StageStepView({ step, n }: { step: StageStep; n: string }) {
  const head = (
    <span className="flex min-w-0 flex-1 items-center gap-2 text-[14.5px] font-semibold text-fg">
      <span className="num rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-xs font-bold text-accent">{n}</span>
      <span className="min-w-0 flex-1">{step.title}</span>
    </span>
  );
  const body = (
    <div className="mt-3 space-y-3">
      {step.why && (
        <p className="rounded-lg border-s-4 border-accent/60 bg-accent-soft/40 px-3 py-2 text-[13px] leading-relaxed text-fg/90">
          <span className="font-semibold text-fg">למה? </span>
          {step.why}
        </p>
      )}
      {step.text?.map((t, i) => (
        <p key={i} className="text-[14px] leading-relaxed text-fg/90">
          {t}
        </p>
      ))}
      {step.workings && step.workings.length > 0 && <WorkingsList workings={step.workings} numbered />}
      {step.journal && step.journal.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-line">
          <JournalTable journal={step.journal} />
        </div>
      )}
      {step.statements && (
        <div className="grid gap-4 lg:grid-cols-2">
          {step.statements.map((s) => (
            <div key={s.title}>
              <p className="mb-2 text-[13px] font-semibold text-fg">{s.title}</p>
              <Statement lines={s.lines} />
            </div>
          ))}
        </div>
      )}
      {step.tables?.map((t) => <WalkTable key={t.id} table={t} />)}
    </div>
  );
  if (!step.fold)
    return (
      <>
        {head}
        {body}
      </>
    );
  return (
    <details data-walk open={step.fold === "open"} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        {head}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      {body}
    </details>
  );
}

/** A plain table inside a step: no export buttons, wrapping text columns. */
function WalkTable({ table }: { table: ScheduleTable }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-[13px]">
        <caption className="border-b border-line bg-surface-2/50 px-3 py-2 text-start text-[12.5px] font-semibold text-fg">{table.title}</caption>
        <thead>
          <tr className="border-b border-line">
            {table.columns.map((c, i) => (
              <th key={c.key} className={cn("px-3 py-2 text-[11.5px] font-medium whitespace-nowrap text-subtle", i === 0 || c.format === "text" ? "text-start" : "text-end")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} className={cn("border-b border-line/60 last:border-b-0", row._emphasis ? EMPHASIS[row._emphasis] : "text-fg/90")}>
              {table.columns.map((c, i) => {
                const v = row[c.key];
                const isX = typeof v === "string" && v.includes("X");
                return (
                  <td key={c.key} className={cn("px-3 py-2 align-top", c.format === "text" || i === 0 ? "text-start" : "num text-end font-mono whitespace-nowrap", i === 0 && "font-medium text-fg", isX && "font-semibold text-accent")}>
                    {formatCell(v, c.format)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YearBreakdown({ title, years, onExport }: { title: string; years: YearSection[]; onExport: () => void }) {
  const [index, setIndex] = useState(0);

  return (
    <section className="card overflow-hidden">
      <PanelHeader
        icon={<CalendarDays className="h-4 w-4" />}
        title={title}
        subtitle={`${years.length} שנות דיווח · פקודות יומן, דרך החישוב, מאזן ורווח והפסד`}
        actions={
          <Button variant="secondary" size="sm" onClick={onExport} title="כל פקודות היומן">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
        }
      />
      <div className="no-print flex items-center gap-2 border-b border-line px-3 py-2.5">
        <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} aria-label="השנה הקודמת">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div role="tablist" aria-label="שנות דיווח" className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5">
          {years.map((y, i) => (
            <button
              key={y.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 font-mono text-[13px] transition-colors",
                i === index ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {y.title.replace(/\D+/g, "")}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIndex((i) => i + 1)}
          disabled={index === years.length - 1}
          aria-label="השנה הבאה"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      {years.map((y, i) => (
        // Every year is rendered so printing shows them all; only the chosen one is on screen.
        <div key={y.id} role="tabpanel" className={cn("p-5", i !== index && "hidden print:block")}>
          <YearDetail year={y} />
        </div>
      ))}
    </section>
  );
}

function YearDetail({ year }: { year: YearSection }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-fg">📅 {year.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{year.subtitle}</p>
      </div>

      <YearPart icon="📝" title={`פקודות יומן ל${year.title}`}>
        {year.journal.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-line">
            <JournalTable journal={year.journal} />
          </div>
        ) : (
          <p className="text-sm text-muted">אין פקודות יומן בשנה זו.</p>
        )}
      </YearPart>

      <YearPart icon="🧮" title={`דרך החישוב של ${year.title}`}>
        <WorkingsList workings={year.workings} />
      </YearPart>

      <div className="grid gap-6 lg:grid-cols-2">
        <YearPart icon="📊" title={`הצגה מאזנית ליום ${year.balanceDate}`}>
          <Statement lines={year.balance} />
        </YearPart>
        <YearPart icon="📉" title={`דוח רווח והפסד ל${year.title}`}>
          <Statement lines={year.profitOrLoss} />
        </YearPart>
      </div>

      {year.next.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Lightbulb className="h-4 w-4 text-accent" /> איך נוכל להמשיך לחשב את השנה הבאה?
          </p>
          <div className="mt-3 space-y-3">
            {year.next.map((g) => (
              <div key={g.title}>
                <p className="text-[13px] font-medium text-fg">{g.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{g.body}</p>
                <Reference className="mt-1.5">{g.reference}</Reference>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkingsList({ workings, numbered }: { workings: Working[]; numbered?: boolean }) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {workings.map((w, i) => (
        <li key={i} className={cn("px-4 py-2.5", w.equation === undefined && w.formula === undefined && "bg-surface-2/40")}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-fg">
                {numbered && <span className="me-2 font-mono text-xs text-accent">{i + 1}.</span>}
                {w.label}
              </p>
              {w.formula && <p className="mt-0.5 text-xs leading-relaxed text-muted">{w.formula}</p>}
            </div>
            {w.amount !== undefined && <span className="num font-mono text-[13px] font-medium text-fg">{amount(w.amount)}</span>}
          </div>
          {w.equation && <EquationView eq={w.equation} />}
        </li>
      ))}
    </ol>
  );
}

function ProofCard({ proof }: { proof: NonNullable<Solution["proof"]> }) {
  return (
    <section className="card overflow-hidden border-accent/40">
      <div className="border-b border-line bg-gradient-to-l from-accent-soft to-transparent px-5 py-4">
        <p className="text-base font-semibold text-fg">{proof.title}</p>
        <p className="mt-0.5 text-xs text-muted">המשוואה בונה את הנתון הידוע מהנעלם, ומבודדת את X צעד אחר צעד. אחר כך הפתרון כולו מחושב עם X במקומו.</p>
      </div>
      <div className="p-5">
        <WorkingsList workings={proof.steps} numbered />
      </div>
    </section>
  );
}

/**
 * "lhs = formula in words", then "lhs = formula with figures = result", typeset
 * with KaTeX. Math reads left to right, so "a − b" keeps its order; each Hebrew
 * term is a \text{} run isolated from the operators around it (see globals.css).
 */
function EquationView({ eq }: { eq: Equation }) {
  const result = eq.unit === "number" ? plain(eq.result) : eq.unit === "percent" ? percent(eq.result) : `${amount(eq.result)} ש״ח`;
  const lhs = exprToTex(eq.lhs);
  return (
    <div dir="ltr" className="mt-2 space-y-2 overflow-x-auto rounded-lg bg-surface-2/50 px-3 py-3 text-[14px]">
      <div className="w-max text-muted">
        <Tex tex={`${lhs} = ${exprToTex(eq.abstract)}`} />
      </div>
      <div className="flex w-max items-center gap-2 text-fg">
        <Tex tex={`${lhs} = ${exprToTex(eq.numeric)} =`} />
        <span className="num rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[13px] font-semibold text-accent">{result}</span>
      </div>
    </div>
  );
}

function Tex({ tex }: { tex: string }) {
  return <span dangerouslySetInnerHTML={{ __html: renderTex(tex) }} />;
}

function YearPart({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-fg">
        <span aria-hidden>{icon}</span> {title}
      </p>
      {children}
    </div>
  );
}

const STATEMENT_EMPHASIS: Record<NonNullable<StatementLine["emphasis"]>, string> = {
  subtotal: "bg-surface-2/50 font-medium text-fg",
  total: "bg-accent-soft font-semibold text-fg",
};

function Statement({ lines }: { lines: StatementLine[] }) {
  return (
    <table className="w-full overflow-hidden rounded-xl border border-line text-[13px]">
      <tbody>
        {lines.map((l) => (
          <tr key={l.label} className={cn("border-b border-line/60 last:border-b-0", l.emphasis ? STATEMENT_EMPHASIS[l.emphasis] : "text-muted")}>
            <td className="px-4 py-2">{l.label}</td>
            <td className="num px-4 py-2 text-end font-mono">{amount(l.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Reference({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 align-middle font-mono text-[11px] whitespace-nowrap text-accent",
        className,
      )}
    >
      <BookOpenText className="h-3 w-3" /> {children}
    </span>
  );
}
