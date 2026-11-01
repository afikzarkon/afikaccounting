import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewBoard, type ReviewCourse } from "@/components/review/review-board";
import { Container, Skeleton } from "@/components/ui/primitives";
import { canAccessWith } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { TOPICS } from "@/lib/catalog";
import { tierAllows } from "@/lib/pricing";
import { STUDY_MODULES } from "@/lib/study";
import { SIMILAR_IDS } from "@/lib/study/variants";

export const metadata: Metadata = {
  title: "החזרה שלי",
  description: "כל השאלות שטעיתם בהן בשיעורים, במקום אחד: חוזרות אחרי יום, אחרי 3 ימים ואחרי שבוע — עד שהן יושבות.",
};

/**
 * Spaced review: every question the reader got wrong in a lesson, back on its
 * day, grouped by course and topic. Open to everyone, over the lessons their
 * plan opens; similar questions with new numbers are for subscribers.
 */
export default function ReviewPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          חזרה מרווחת
        </p>
        <h1 className="mt-3 text-[2.2rem] leading-tight font-bold tracking-tight text-fg sm:text-5xl">
          החזרה <span className="text-gradient">שלי</span>
        </h1>
        <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted">
          כל שאלה שטעיתם בה בשיעור מגיעה לכאן, וחוזרת אליכם אחרי יום. ענו נכון — והיא תחזור בעוד 3 ימים, ואחר כך בעוד שבוע. שלוש פעמים נכון ברצף, והיא יוצאת מהחזרה.
        </p>
        <div className="mt-8">
          <Suspense fallback={<Skeleton className="h-64 rounded-3xl" />}>
            <Board />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

/** The lessons the reader's plan opens, by course in the learning path's order: only their questions reach the browser. */
async function Board() {
  const access = await getAccess();
  const courses: ReviewCourse[] = TOPICS.map((t) => ({
    id: t.id,
    title: t.standard ? `${t.title} (${t.standard})` : t.title,
    lessons: Object.values(STUDY_MODULES)
      .filter((m) => m.backHref === t.href && canAccessWith(access, t, m.slug))
      .sort((a, b) => a.n - b.n),
  })).filter((c) => c.lessons.length > 0);
  return <ReviewBoard courses={courses} premium={tierAllows(access.tier, "courses")} similarIds={SIMILAR_IDS} />;
}
