"use client";

import { ArrowLeft, CalendarCheck, CalendarClock, Repeat } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useTopics } from "@/components/study-mode/progress-store";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { FIRST_LESSON } from "@/lib/catalog";
import { questions, type ReviewItem, reviewItems, today, topicOf } from "@/lib/study/review";
import type { StudyModule } from "@/lib/study/types";
import { ReviewSession } from "./review-session";

/** A course, with the lessons of it the reader's plan opens. */
export type ReviewCourse = { id: string; title: string; lessons: StudyModule[] };

const noSubscribe = () => () => {};

/**
 * The reader's review: how many questions are due today and the way into
 * them, then the whole bank by course and topic, each topic a session of its
 * own. Read from the progress store, so it is the same on every device the
 * reader signs in on; before the browser has it (on the server) it shows nothing.
 */
export function ReviewBoard({ courses, premium, similarIds }: { courses: ReviewCourse[]; premium: boolean; similarIds: string[] }) {
  const lessons = useMemo(() => courses.flatMap((c) => c.lessons), [courses]);
  const similar = useMemo(() => new Set(similarIds), [similarIds]);
  const topics = useTopics(lessons.map((m) => m.slug));
  // The day is the reader's own (their midnight), so it is read in the browser only.
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  const [session, setSession] = useState<{ title: string; items: ReviewItem[] } | null>(null);

  if (day < 0) return null;
  const byLesson = new Map(lessons.map((m) => [m.slug, m]));
  const all = lessons.flatMap((m) => reviewItems(m, topics[m.slug], day));
  const due = all.filter((x) => x.due <= day);
  const next = all.filter((x) => x.due > day).reduce((n, x) => Math.min(n, x.due), Infinity);

  if (session)
    return <ReviewSession title={session.title} items={session.items} lessons={byLesson} premium={premium} similarIds={similar} day={day} onDone={() => setSession(null)} />;

  if (!all.length)
    return (
      <EmptyState
        icon={<CalendarCheck className="h-5 w-5" />}
        title="אין כרגע שאלות לחזרה"
        description="שאלה שתטעו בה בשיעור — או שתפתרו רק בניסיון השני — תגיע לכאן, ותחזור אליכם כבר מחר."
        action={<ButtonLink href={FIRST_LESSON}>לשיעור הבא</ButtonLink>}
      />
    );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-accent to-cyan-500 text-white shadow-[0_14px_30px_-14px_var(--accent)]">
            <span className="num text-[38px] leading-none font-bold">{due.length}</span>
          </div>
          <div className="min-w-0 flex-[1_1_16rem]">
            <p className="text-[20px] font-bold text-fg">{due.length ? (due.length === 1 ? "שאלה מחכה לכם היום" : "שאלות מחכות לכם היום") : "סיימתם את החזרה של היום"}</p>
            <p className="num mt-1 text-[15px] text-muted">
              {questions(all.length)} בחזרה בסך הכול
              {Number.isFinite(next) && ` · הבאה בעוד ${next - day === 1 ? "יום" : `${next - day} ימים`}`}
            </p>
          </div>
          {due.length > 0 ? (
            <Button size="lg" onClick={() => setSession({ title: "החזרה של היום", items: due })}>
              <Repeat className="h-4 w-4" aria-hidden /> {due.length === 1 ? "לתרגל את השאלה של היום" : "לתרגל את השאלות של היום"}
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={() => setSession({ title: "כל השאלות בחזרה", items: all })}>
              <Repeat className="h-4 w-4" aria-hidden /> לתרגל בכל זאת
            </Button>
          )}
        </div>
      </div>

      {courses.map((c) => {
        const items = all.filter((x) => c.lessons.some((m) => m.slug === x.slug));
        if (!items.length) return null;
        const groups = new Map<string, ReviewItem[]>();
        for (const x of items) {
          const key = topicOf(byLesson.get(x.slug)!, x.item);
          groups.set(key, [...(groups.get(key) ?? []), x]);
        }
        return (
          <section key={c.id} aria-labelledby={`review-${c.id}`}>
            <h2 id={`review-${c.id}`} className="mb-3 text-[1.35rem] font-bold tracking-tight text-fg">
              {c.title}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...groups].map(([topic, xs]) => {
                const dueNow = xs.filter((x) => x.due <= day).length;
                const lesson = byLesson.get(xs[0].slug)!;
                return (
                  <li key={topic} className="card flex flex-col gap-3 p-5">
                    <div className="min-w-0">
                      <p className="text-[16px] font-bold text-fg">{topic}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        שיעור {lesson.n}: {lesson.title}
                      </p>
                    </div>
                    <p className="num flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-semibold text-fg ring-1 ring-line">{questions(xs.length)}</span>
                      {dueNow > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {dueNow} להיום
                        </span>
                      ) : (
                        <span className="text-muted">לא להיום</span>
                      )}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-3">
                      <Button size="sm" variant={dueNow ? "primary" : "secondary"} onClick={() => setSession({ title: topic, items: xs })}>
                        לתרגל <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      <Link href={`/study/${lesson.slug}`} className="text-[13px] font-medium text-muted hover:text-accent">
                        לשיעור
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
