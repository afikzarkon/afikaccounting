"use client";

import { ArrowUpLeft, Loader2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CalculatorIcon } from "@/components/engine/calculator-visuals";
import { deleteSolution } from "@/lib/actions/solutions";
import type { SavedSolution } from "@/lib/data/user";
import { money, percent, plain } from "@/lib/engine/format";
import { getCalculator } from "@/lib/engine/registry";
import type { Metric } from "@/lib/engine/types";
import { relativeTime } from "@/lib/utils";

const show = (m: Metric, currency: string) =>
  m.format === "percent" ? percent(m.value) : m.format === "number" ? plain(m.value) : money(m.value, currency);

export function SavedSolutions({ solutions }: { solutions: SavedSolution[] }) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const visible = solutions.filter((s) => !removed.has(s.id));

  return (
    <ul className="grid gap-3">
      <AnimatePresence initial={false}>
        {visible.map((s) => (
          <SolutionRow key={s.id} solution={s} onRemoved={() => setRemoved((r) => new Set(r).add(s.id))} />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function SolutionRow({ solution: s, onRemoved }: { solution: SavedSolution; onRemoved: () => void }) {
  const calc = getCalculator(s.calculatorSlug);
  const currency = typeof s.inputs.currency === "string" ? s.inputs.currency : "ILS";
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const remove = () =>
    startTransition(async () => {
      const res = await deleteSolution(s.id);
      if (res.ok) onRemoved();
      else setError(res.error ?? "המחיקה נכשלה.");
    });

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: -12 }}
      className="card group flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        {calc && <CalculatorIcon calc={calc} className="h-10 w-10" />}
        <div className="min-w-0">
          <Link href={`/engine?solution=${s.id}`} className="font-medium text-fg hover:text-accent">
            {s.title}
          </Link>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{s.headline}</p>
          <p className="mt-1 text-xs text-subtle">
            {calc?.standard ?? s.calculatorSlug} · עודכן {relativeTime(s.updatedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {s.metrics.slice(0, 2).map((m) => (
          <div key={m.label} className="hidden text-end md:block">
            <p className="text-[11px] text-subtle">{m.label}</p>
            <p className="num text-sm font-semibold text-fg">{show(m, currency)}</p>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <Link
            href={`/engine?solution=${s.id}`}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
            aria-label={`פתיחת ${s.title}`}
          >
            <ArrowUpLeft className="h-4 w-4" />
          </Link>
          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="h-8 rounded-lg bg-danger/10 px-2.5 text-xs font-medium text-danger hover:bg-danger/20"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "מחיקה"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="h-8 px-2 text-xs text-muted hover:text-fg">
                ביטול
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
              aria-label={`מחיקת ${s.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-danger sm:basis-full">{error}</p>}
    </motion.li>
  );
}
