import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** How a multiple-choice option stands: open to pick, the right one, a wrong pick, or passed by once the question is done. */
export type OptionState = "open" | "right" | "wrong" | "past";

/** One answer tile of a multiple-choice question, the same in every kind of question. */
export const optionClass = (state: OptionState) =>
  cn(
    "group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-start text-[15.5px] leading-snug ring-1 transition-all",
    state === "open" && "cursor-pointer bg-surface ring-line-strong hover:-translate-y-px hover:bg-accent-soft/50 hover:ring-accent/60 hover:shadow-[0_8px_20px_-14px_var(--accent)]",
    state === "right" && "bg-success/10 font-semibold text-fg ring-2 ring-success",
    state === "wrong" && "bg-danger/10 text-fg ring-2 ring-danger",
    state === "past" && "cursor-default bg-surface opacity-55 ring-line",
    state !== "open" && "cursor-default",
  );

/** The option's letter, or its mark once it is judged. */
export function OptionMark({ state, letter }: { state: OptionState; letter: ReactNode }) {
  return (
    <span
      className={cn(
        "num grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[13px] font-bold transition-colors",
        state === "right" ? "bg-success text-white" : state === "wrong" ? "bg-danger text-white" : "bg-surface-2 text-muted ring-1 ring-line-strong group-hover:bg-accent group-hover:text-accent-fg group-hover:ring-accent",
      )}
    >
      {state === "right" ? <Check className="h-4 w-4" /> : state === "wrong" ? <X className="h-4 w-4" /> : letter}
    </span>
  );
}

/** The question itself, above its answers. */
export const promptClass = "text-[18px] font-semibold leading-relaxed text-fg sm:text-[20px]";
