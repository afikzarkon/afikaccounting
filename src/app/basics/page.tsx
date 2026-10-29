import { BookOpenText, ClipboardPen, Library, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { BasicsReference } from "@/components/basics/final";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseProgress, LegacyHashRedirect, LessonAction } from "@/components/study-mode/course";
import { Container } from "@/components/ui/primitives";
import { BASICS_LESSONS } from "@/lib/study/basics";

export const metadata: Metadata = {
  title: "חשבונאות בסיסית מאפס",
  description:
    "קורס אינטראקטיבי בעברית, שיעור אחר שיעור: חובה וזכות, פקודות יומן וכרטיסי T, מאזן בוחן ועודפים, התאמות סוף שנה, מלאי סגירה והפסדי אשראי — עם סימולטור פקודות יומן, תרגול ומלכודות מבחן.",
};

/**
 * The basics course: six interactive lessons, each with its concept screens,
 * a practice section and exam traps; progress on top, and the course's
 * reference (cheat sheet, glossary, mistakes, questions) at the bottom.
 */
export default function BasicsPage() {
  return (
    <div className="relative">
      <LegacyHashRedirect />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Breadcrumbs trail={[{ label: "שלב 1 · יסודות" }, { label: "חשבונאות מאפס" }]} />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          חשבונאות בסיסית <span className="text-gradient">מאפס</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          <span className="num">{BASICS_LESSONS.length}</span> שיעורים אינטראקטיביים, צעד אחר צעד. בכל שיעור: מושגים עם דוגמאות חיות, תרגול עם משוב מיידי, ומלכודות מבחן — ובסוף, טיפים
          זהב.
        </p>

        <div className="mt-6">
          <CourseProgress />
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-2" aria-label="שיעורי הקורס">
          {BASICS_LESSONS.map((m) => (
            <li key={m.slug} className="card flex min-w-0 flex-col p-5" aria-labelledby={`lesson-${m.slug}`}>
              <div className="flex items-start gap-3">
                <span className="num grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">{m.n}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-accent">שיעור {m.n}</p>
                  <h2 id={`lesson-${m.slug}`} className="text-lg font-semibold text-fg">
                    {m.title}
                  </h2>
                </div>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-fg/85">{m.description}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="המושגים בשיעור">
                {m.screens.map((s) => (
                  <li key={s.id} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {s.title}
                  </li>
                ))}
              </ul>
              <p className="num mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
                <span className="flex items-center gap-1">
                  <BookOpenText className="h-3.5 w-3.5" aria-hidden /> {m.screens.length} מושגים
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardPen className="h-3.5 w-3.5" aria-hidden /> {m.exercises.length} תרגילים
                </span>
                <span className="flex items-center gap-1">
                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> {m.traps.length} מלכודות מבחן
                </span>
              </p>
              <LessonAction module={m} />
            </li>
          ))}
        </ol>

        <section id="reference" aria-labelledby="reference-title" className="mt-14 scroll-mt-24">
          {/* The former page's "summary" chapter lived here; its anchor still lands on it. */}
          <span id="summary" className="block scroll-mt-24" aria-hidden />
          <h2 id="reference-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <Library className="h-6 w-6 text-accent" aria-hidden /> כלי עזר
          </h2>
          <p className="mt-1 text-[15px] text-muted">כל מה שצריך לחזרה, במקום אחד: גיליון עזר להדפסה, מילון, טעויות נפוצות ושאלות נפוצות.</p>
          <div className="mt-4">
            <BasicsReference />
          </div>
        </section>
      </Container>
    </div>
  );
}
