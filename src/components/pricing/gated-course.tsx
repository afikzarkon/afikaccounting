import { Suspense } from "react";
import { CoursePath } from "@/components/study-mode/course";
import { lockedOf } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { topicByHref } from "@/lib/catalog";
import { outlineOf } from "@/lib/study/paths";
import type { StudyModule } from "@/lib/study/types";

/**
 * A course page's path, with the reader's locks. A free course is the plain
 * path. A paid one reads the session, so it streams in behind a boundary
 * whose fallback is the plain path: a reader with the plan never sees a lock,
 * and one without sees them as soon as the session is read. The fallback is
 * in the prerendered page that everyone gets.
 *
 * The path shows titles, counts and progress, all of which a lesson's outline
 * carries, so every lesson goes to the browser as its outline: the questions
 * and their solutions stay on the server (whole, they made a course page's
 * HTML close to a megabyte).
 */
export function GatedCoursePath({ lessons }: { lessons: StudyModule[] }) {
  // Every lesson hidden by the admin: no path to show.
  if (!lessons.length) return null;
  const outlines = lessons.map(outlineOf);
  const topic = topicByHref(lessons[0].backHref);
  if (!topic || topic.tier === "free") return <CoursePath lessons={outlines} />;
  return (
    <Suspense fallback={<CoursePath lessons={outlines} />}>
      <WithAccess lessons={outlines} />
    </Suspense>
  );
}

async function WithAccess({ lessons }: { lessons: StudyModule[] }) {
  const topic = topicByHref(lessons[0].backHref)!;
  const locked = lockedOf(await getAccess(), topic, lessons.map((m) => m.slug));
  // With the plan, nothing is locked and nothing is tagged: the path is the same as everyone's.
  if (!locked.length) return <CoursePath lessons={lessons} />;
  return <CoursePath lessons={lessons} locked={locked} previews={topic.preview} />;
}
