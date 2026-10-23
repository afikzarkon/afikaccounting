import "katex/dist/katex.min.css";
import type { ReactNode } from "react";
import { n } from "./blocks";
import { renderTex } from "@/lib/tex";
import { cn } from "@/lib/utils";

/** A figure for a KaTeX string: thousands separators that KaTeX won't space as punctuation. */
export const texNum = (v: number) => n(Math.round(v * 100) / 100).replace(/,/g, "{,}");

export type FormulaRow = { label: ReactNode; tex: string };

/**
 * The lab's formula card: a dark, high-contrast panel in both themes, so the
 * equations stand apart from the prose and tables around them.
 */
export function FormulaCard({ title, icon, rows, children, className }: { title: string; icon?: ReactNode; rows: FormulaRow[]; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-linear-to-br from-[#0b1d4a] to-[#060d22] p-5 text-slate-100 shadow-card ring-1 ring-white/10", className)}>
      <p className="flex items-center gap-2 text-sm font-semibold text-sky-200">
        {icon}
        {title}
      </p>
      <dl className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.06]">
            <dt className="text-xs text-slate-300">{r.label}</dt>
            <dd dir="ltr" className="overflow-x-auto py-1 text-[15px]" dangerouslySetInnerHTML={{ __html: renderTex(r.tex, true) }} />
          </div>
        ))}
      </dl>
      {children && <div className="mt-3 text-[13px] leading-relaxed text-slate-300 [&_strong]:text-white">{children}</div>}
    </div>
  );
}

/** Inline formula that can be rendered on the client too (math.tsx's Tex is the same, kept server-only by convention). */
export function InlineTex({ tex, className }: { tex: string; className?: string }) {
  return <span dir="ltr" className={cn("inline-block align-middle", className)} dangerouslySetInnerHTML={{ __html: renderTex(tex, false) }} />;
}

/** A numbered methodology step with its own heading row. */
export function StepCard({ step, title, lead, icon, children }: { step: number; title: string; lead: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="card relative overflow-hidden">
      <div className="flex items-start gap-4 border-b border-line bg-surface-2/50 px-5 py-4">
        <span className="num grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-fg">
            <span className="text-accent">{icon}</span>
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{lead}</p>
        </div>
      </div>
      <div className="px-5 pt-3 pb-5 text-[15px] leading-relaxed text-fg/90 [&_p]:my-3">{children}</div>
    </section>
  );
}

/** A compact figure tile for the simulator's headline numbers. */
export function Stat({ label, value, hint, tone = "neutral" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "neutral" | "accent" | "success" | "warn" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        tone === "accent" && "border-accent/30 bg-accent-soft",
        tone === "success" && "border-success/30 bg-success/[0.07]",
        tone === "warn" && "border-amber-500/30 bg-amber-500/[0.08]",
        tone === "neutral" && "border-line bg-surface",
      )}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="num mt-1 text-lg font-semibold text-fg">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
