import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The lead panel of the lesson's own screens (its opening, the move into
 * practice, the summary): one surface with a soft glow of the accent, a
 * badge, the words, and whatever acts on them. The lesson's title is the
 * page's heading above it, so the panel never repeats it.
 */
export function StageHero({ badge, children, className }: { badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-surface p-5 ring-1 ring-line sm:p-7", className)}>
      <div className="relative flex flex-wrap items-start gap-5">
        {badge}
        <div className="min-w-0 flex-[1_1_18rem]">{children}</div>
      </div>
    </div>
  );
}

/** A small fact about the lesson, as a chip: "8 מושגים", "עד 200 XP". */
export function Fact({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="num inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[13px] font-medium text-fg/85 ring-1 ring-line">
      {icon}
      {children}
    </span>
  );
}

/** A heading over a list on a stage screen. */
export function StageLabel({ icon, children, id }: { icon?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mb-3 flex items-center gap-1.5 text-[12.5px] font-bold text-muted">
      {icon}
      {children}
    </p>
  );
}
