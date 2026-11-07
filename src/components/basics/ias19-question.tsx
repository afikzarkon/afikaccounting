import { ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The frame every task in the course stands in: an accent border and a band
 * that names it ("משימה", "נדרש", "שאלה 1 מתוך 2") — so a task never reads as one more
 * paragraph of the page. `children` is the task, then anything that belongs to
 * it (its solution, an answer check).
 */
export function TaskFrame({ label = "משימה", icon, status, children, className }: { label?: ReactNode; icon?: ReactNode; status?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border-2 border-accent/50 bg-surface shadow-sm", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/25 bg-accent-soft px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-[14.5px] font-bold text-accent">
          {icon ?? <ClipboardList className="h-[18px] w-[18px]" aria-hidden />}
          {label}
        </span>
        {status}
      </header>
      <div className="space-y-3 p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** The wording of a task inside its frame: larger and heavier than the page text around it. */
export function TaskText({ children }: { children: ReactNode }) {
  return <div className="text-[16.5px] font-semibold leading-relaxed text-fg">{children}</div>;
}
