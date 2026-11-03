import { ChevronDown, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The few blocks a lesson screen is built from, always in this order: the
 * explanation (plain paragraphs), one example or exercise, a deeper look
 * folded away, and the takeaway at the end. Everything else is plain text.
 */

/** A second part of the same screen: a heading over its own paragraphs. */
export function Part({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line pt-5">
      <h3 className="text-[18px] font-bold text-fg">{title}</h3>
      {children}
    </section>
  );
}

/** More for whoever wants it — closed by default, so it never competes with the screen. */
export function Deeper({ title, icon, children }: { title: ReactNode; icon?: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[15px] font-semibold text-fg [&::-webkit-details-marker]:hidden">
        {icon && <span className="text-accent [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>}
        <span className="min-w-0 flex-1">{title}</span>
        <span className="text-[12px] font-medium text-muted">להעמקה</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 border-t border-line px-4 py-3 text-[15px] leading-relaxed">{children}</div>
    </details>
  );
}

/** The one thing to keep from the screen: always last, always this shape. */
export function Remember({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <aside className={cn("flex gap-3 border-s-4 border-accent bg-accent-soft px-4 py-3", className)}>
      <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-accent">לזכור</p>
        <div className="text-[16px] font-semibold leading-snug text-fg">{children}</div>
      </div>
    </aside>
  );
}
