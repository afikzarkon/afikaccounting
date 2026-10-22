"use client";

import {
  BookOpenText,
  Check,
  ChevronDown,
  ClipboardCopy,
  FileDown,
  FileSpreadsheet,
  Info,
  ListChecks,
  Printer,
  ScrollText,
  Table2,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { amount, formatCell, money, percent, plain } from "@/lib/engine/format";
import { round2, sum } from "@/lib/engine/math";
import type { JournalEntry, Metric, ScheduleTable, Solution } from "@/lib/engine/types";
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
          {solution.journal.length > 0 && (
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

          {solution.tables.map((t, i) => (
            <motion.div key={t.id} variants={fadeUp} initial="hidden" animate="show" custom={2 + i}>
              <ScheduleCard table={t} fileBase={`${base}-${t.id}`} />
            </motion.div>
          ))}

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2 + solution.tables.length}>
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
            <th className="w-36 px-5 py-2.5 text-end font-medium">
              <span className="text-debit">חובה</span>
            </th>
            <th className="w-36 px-5 py-2.5 text-end font-medium">
              <span className="text-credit">זכות</span>
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
                    {l.credit > 0 ? "ז׳ " : "ח׳ "}
                    <span className={l.credit > 0 ? "" : "text-fg"}>{l.account}</span>
                  </td>
                  <td className="num px-5 py-2 text-end font-mono text-[13px] text-debit">{l.debit ? amount(l.debit) : ""}</td>
                  <td className="num px-5 py-2 text-end font-mono text-[13px] text-credit">{l.credit ? amount(l.credit) : ""}</td>
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
