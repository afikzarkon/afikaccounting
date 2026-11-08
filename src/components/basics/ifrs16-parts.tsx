import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { IasQuiz } from "./ias19-quiz";
import type { QuizItem } from "./inventory-interactive";

/** What the leases course's screens share. */

export const quiz = (chapter: string, items: QuizItem[]) => <IasQuiz prefix="ifrs16" chapter={chapter} items={items} />;

/** A paragraph on one idea. */
export const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;

/** The whole solution, in one box that opens once. */
export function FullSolution({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface-2/40 p-3.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        <span className="group-open:hidden">הצגת הפתרון המלא</span>
        <span className="hidden group-open:inline">הסתרת הפתרון</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
