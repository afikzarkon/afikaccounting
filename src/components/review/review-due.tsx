"use client";

import { ArrowLeft, Repeat } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTopics } from "@/components/study-mode/progress-store";
import { questions, reviewItems, today } from "@/lib/study/review";
import type { StudyModule } from "@/lib/study/types";

const noSubscribe = () => () => {};

/** The dashboard's line about review: how many questions are due today, and the way to them. Nothing when the review is empty. */
export function ReviewDue({ lessons }: { lessons: StudyModule[] }) {
  const topics = useTopics(lessons.map((m) => m.slug));
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  if (day < 0) return null;
  const all = lessons.flatMap((m) => reviewItems(m, topics[m.slug], day));
  if (!all.length) return null;
  const due = all.filter((x) => x.due <= day).length;
  return (
    <Link href="/review" className="group card flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Repeat className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="num block text-[16px] font-bold text-fg">{due ? `${questions(due)} ${due === 1 ? "מחכה" : "מחכות"} לכם לחזרה היום` : "סיימתם את החזרה של היום"}</span>
        <span className="num block text-[13.5px] text-muted">{questions(all.length)} בחזרה בסך הכול — שאלות שטעיתם בהן, חוזרות בזמן הנכון</span>
      </span>
      <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
    </Link>
  );
}
