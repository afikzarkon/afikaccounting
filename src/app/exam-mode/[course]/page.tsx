import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExamRunner } from "@/components/exam-mode/exam-runner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Skeleton } from "@/components/ui/primitives";
import { canAccessWith } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { TOPICS } from "@/lib/catalog";
import { STUDY_MODULES } from "@/lib/study";

export const metadata: Metadata = { title: "מצב מבחן", robots: { index: false } };

export function generateStaticParams() {
  return TOPICS.filter((t) => t.format === "lessons").map((t) => ({ course: t.id }));
}

/** A course's exam mode: questions from the lessons the reader's plan opens, built in the browser. */
export default function ExamModePage({ params }: PageProps<"/exam-mode/[course]">) {
  return (
    <Container className="max-w-3xl pt-8 pb-16 sm:pt-12">
      <Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
        <ExamMode params={params} />
      </Suspense>
    </Container>
  );
}

async function ExamMode({ params }: Pick<PageProps<"/exam-mode/[course]">, "params">) {
  const { course } = await params;
  const topic = TOPICS.find((t) => t.id === course && t.format === "lessons");
  if (!topic) notFound();
  const access = await getAccess();
  // Only lessons the reader may open reach the browser — their questions are the exam's.
  const lessons = Object.values(STUDY_MODULES)
    .filter((m) => m.backHref === topic.href && canAccessWith(access, topic, m.slug))
    .sort((a, b) => a.n - b.n);
  const name = topic.standard ?? topic.title;
  return (
    <>
      <Breadcrumbs trail={[{ label: topic.standard ? `${topic.title} (${topic.standard})` : topic.title, href: topic.href }, { label: "מצב מבחן" }]} />
      <h1 className="mt-3 text-[2rem] leading-tight font-black text-fg sm:text-[2.4rem]">מצב מבחן</h1>
      <p className="mt-2 mb-6 text-[16px] text-muted">
        {lessons.length < Object.values(STUDY_MODULES).filter((m) => m.backHref === topic.href).length
          ? "השאלות נלקחות מהשיעורים שפתוחים לכם. עם הקורס המלא, המבחן מכסה את כולו."
          : "השאלות נלקחות מכל שיעורי הקורס."}
      </p>
      <ExamRunner course={topic.id} name={name} lessons={lessons} href={topic.href} />
    </>
  );
}
