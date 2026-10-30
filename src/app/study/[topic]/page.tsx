import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { orphanScreens, screensFor } from "@/components/basics/screens";
import { StudyShell } from "@/components/study-mode/shell";
import { Skeleton } from "@/components/ui/primitives";
import { LEARNING_PATH } from "@/lib/catalog";
import { STUDY_MODULES, studyHref } from "@/lib/study";

const ORPHANS = orphanScreens(Object.values(STUDY_MODULES));
if (ORPHANS.length) throw new Error(`Screens no lesson shows: ${ORPHANS.join(", ")}`);

export function generateStaticParams() {
  return Object.keys(STUDY_MODULES).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps<"/study/[topic]">): Promise<Metadata> {
  const m = STUDY_MODULES[(await params).topic];
  if (!m) return { title: "לא נמצא" };
  return { title: `${m.course} · שיעור ${m.n}: ${m.title}`, description: m.description };
}

/** Where to go after a lesson: the next lesson of its course, else the topic after the course on the learning path. */
function nextOf(slug: string) {
  const m = STUDY_MODULES[slug];
  const course = Object.values(STUDY_MODULES).filter((x) => x.backHref === m.backHref);
  const after = course.find((x) => x.n === m.n + 1);
  if (after) return { href: studyHref(after.slug), label: `לשיעור ${after.n}: ${after.title}` };
  const topics = LEARNING_PATH.flatMap((s) => s.topics);
  const t = topics[topics.findIndex((x) => x.href === m.backHref) + 1];
  return t && { href: t.lesson ?? t.href, label: `לנושא הבא: ${t.title}` };
}

/** One interactive lesson, full screen. The lesson is read from the URL, so it streams in behind a boundary and the route's shell stays shared. */
export default function StudyPage({ params }: PageProps<"/study/[topic]">) {
  return (
    <Suspense fallback={<LessonSkeleton />}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/study/[topic]">, "params">) {
  const m = STUDY_MODULES[(await params).topic];
  if (!m) notFound();
  return <StudyShell module={m} screens={screensFor(m)} next={nextOf(m.slug)} />;
}

/** The lesson screen's frame, full screen like the shell, until the lesson arrives. */
function LessonSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col gap-4 bg-canvas px-3 py-3 sm:px-4 sm:py-5" aria-busy="true" aria-label="טוען שיעור">
      <Skeleton className="h-12" />
      <Skeleton className="min-h-0 flex-1 rounded-2xl" />
    </div>
  );
}
