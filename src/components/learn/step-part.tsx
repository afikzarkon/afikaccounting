import type { ReactNode } from "react";
import { Part } from "@/components/study-mode/screen-parts";

/** One numbered step of a lesson screen's procedure: a titled part of the screen, with the step's one-line aim under its title. */
export function StepPart({ step, title, lead, children }: { step: number; title: string; lead: string; children: ReactNode }) {
  return (
    <Part
      title={
        <span className="flex items-center gap-2.5">
          <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-accent-fg">{step}</span>
          {title}
        </span>
      }
    >
      <p className="text-muted">{lead}</p>
      {children}
    </Part>
  );
}
