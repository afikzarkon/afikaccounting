"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useFeedback } from "@/lib/tester/store";

type Lesson = { slug: string; n: number; title: string; course: string; href: string };

/** The tester's ratings so far, lesson by lesson: how many pages they rated, how many weren't clear, and a way back in. */
export function MyRatings({ lessons }: { lessons: Lesson[] }) {
  const { state, status } = useFeedback();
  if (!state) return <div className="card h-48 animate-pulse" />;
  const courses = [...new Set(lessons.map((l) => l.course))];

  return (
    <div className="space-y-6">
      {courses.map((course) => (
        <section key={course} className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-3 font-semibold text-fg">{course}</h2>
          <ul>
            {lessons
              .filter((l) => l.course === course)
              .map((l) => {
                const pages = Object.entries(state.pages).filter(([k]) => k.startsWith(`${l.slug}/`));
                const rated = pages.filter(([k, p]) => !k.endsWith("/summary") && p.r).length;
                const unclear = pages.filter(([, p]) => p.r === "unclear").length;
                const done = pages.some(([k, p]) => k.endsWith("/summary") && typeof p.exam === "number");
                return (
                  <li key={l.slug} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3 last:border-0">
                    <span className="min-w-0 flex-1 text-[15px] text-fg">
                      <span className="num text-muted">שיעור {l.n}:</span> {l.title}
                    </span>
                    <span className="num text-xs text-muted">
                      {rated ? `${rated} מסכים דורגו` : "עוד לא התחלתם"}
                      {unclear ? ` · ${unclear} לא ברורים` : ""}
                      {done ? " · הסתיים" : ""}
                    </span>
                    <Link href={l.href} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                      {rated ? "להמשיך" : "להתחיל"} <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted">{status === "failed" ? "השמירה בחשבון נכשלה כרגע; הדירוגים נשמרים בדפדפן ויעלו בפעם הבאה." : "הדירוגים נשמרים בחשבון שלכם."}</p>
    </div>
  );
}
