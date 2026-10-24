import { BookMarked } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Material that is not asked in exams: one colour and one fixed label, wherever it appears. */
export const ENRICHMENT_LABEL = "להעשרה בלבד – לא נדרש בבחינות";

export function EnrichmentBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border border-dashed border-credit/60 bg-credit/10 px-2 py-0.5 text-[11px] font-bold text-credit", className)}>
      <BookMarked className="h-3 w-3" aria-hidden />
      {ENRICHMENT_LABEL}
    </span>
  );
}

/** A box for enrichment content: dashed, in the enrichment colour, with the label on top. */
export function EnrichmentBox({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border-2 border-dashed border-credit/50 bg-credit/[0.05] p-4", className)}>
      <EnrichmentBadge />
      <p className="mt-2 text-sm font-semibold text-credit">{title}</p>
      {children}
    </div>
  );
}

/** What the two colours mean. */
export function EnrichmentLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-muted">
      <span className="font-semibold text-fg">מקרא:</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border border-success/50 bg-success/20" aria-hidden /> נדרש בבחינות
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border border-dashed border-credit/60 bg-credit/20" aria-hidden /> {ENRICHMENT_LABEL}
      </span>
    </p>
  );
}
