import { BookOpenText, ClipboardPen, GraduationCap, Play } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { StudyModule } from "@/lib/study/types";
import { Fact } from "./stage";

/** A course page's opening: where it sits on the path, its name, what it is, and the course in a few facts. */
export function CourseHeader({
  trail,
  title,
  lessons,
  children,
}: {
  trail: { label: string; href?: string }[];
  title: ReactNode;
  lessons: StudyModule[];
  /** What the course is, and anything else under the title. */
  children: ReactNode;
}) {
  const concepts = lessons.reduce((a, m) => a + m.screens.length, 0);
  const questions = lessons.reduce((a, m) => a + m.exercises.length + m.traps.length, 0);
  const minutes = Math.round(lessons.reduce((a, m) => a + (m.videos ?? []).reduce((s, v) => s + v.duration, 0), 0) / 60);
  return (
    <header>
      <Breadcrumbs trail={trail} />
      <h1 className="mt-3 text-[2.2rem] leading-tight font-bold tracking-tight text-fg sm:text-5xl">{title}</h1>
      <div className="mt-3 max-w-3xl space-y-2 text-[16px] leading-relaxed text-muted">{children}</div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Fact icon={<GraduationCap className="h-3.5 w-3.5 text-accent" aria-hidden />}>{lessons.length} שיעורים</Fact>
        <Fact icon={<BookOpenText className="h-3.5 w-3.5 text-accent" aria-hidden />}>{concepts} מושגים</Fact>
        <Fact icon={<ClipboardPen className="h-3.5 w-3.5 text-accent" aria-hidden />}>{questions} שאלות תרגול</Fact>
        {minutes > 0 && <Fact icon={<Play className="h-3.5 w-3.5 fill-gold-strong text-gold-strong" aria-hidden />}>{minutes} דק׳ וידאו</Fact>}
      </div>
    </header>
  );
}
