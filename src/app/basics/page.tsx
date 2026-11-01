import { Library } from "lucide-react";
import type { Metadata } from "next";
import { BasicsReference } from "@/components/basics/final";
import { ExamsSection } from "@/components/pricing/exams-teaser";
import { CoursePath, LegacyHashRedirect } from "@/components/study-mode/course";
import { CourseHeader } from "@/components/study-mode/course-header";
import { Container } from "@/components/ui/primitives";
import { BASICS_LESSONS, LEGACY_CHAPTERS, legacyHref } from "@/lib/study/basics";

// The former long page's chapter anchors, and where each lands now.
const REDIRECTS = Object.fromEntries(LEGACY_CHAPTERS.map((id) => [id, legacyHref(id) ?? ""]));

export const metadata: Metadata = {
  title: "חשבונאות בסיסית מאפס",
  description:
    "קורס אינטראקטיבי בעברית, שיעור אחר שיעור: חובה וזכות, פקודות יומן, צ׳קים ומקדמות, כרטיסי T ומאזן בוחן, שנה שלמה מקצה לקצה, התאמות סוף שנה, מאזן בוחן ראשוני ותיקונים, הפסדי אשראי — ושאלת בחינה מלאה. עם סימולטור פקודות יומן ובדיקה עצמית בכל שיעור.",
};

/**
 * The basics course: six interactive lessons, each with its concept screens,
 * a practice section by kind of question; progress on top, and the course's
 * reference (cheat sheet, glossary, mistakes, questions) at the bottom.
 */
export default function BasicsPage() {
  return (
    <div className="relative">
      <LegacyHashRedirect redirects={REDIRECTS} />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <CoursePageHead />

        <div className="mt-8">
          <CoursePath lessons={BASICS_LESSONS} />
        </div>

        <section id="reference" aria-labelledby="reference-title" className="mt-16 scroll-mt-24">
          {/* The former page's "summary" chapter lived here; its anchor still lands on it. */}
          <span id="summary" className="block scroll-mt-24" aria-hidden />
          <h2 id="reference-title" className="flex items-center gap-2 text-[1.75rem] font-bold tracking-tight text-fg">
            <Library className="h-6 w-6 text-accent" aria-hidden /> כלי עזר
          </h2>
          <p className="mt-1 text-[15px] text-muted">כל מה שצריך לחזרה, במקום אחד: גיליון עזר להדפסה, מילון, טעויות נפוצות ושאלות נפוצות.</p>
          <div className="mt-4">
            <BasicsReference />
          </div>
        </section>

        <ExamsSection topic="basics" />
      </Container>
    </div>
  );
}

function CoursePageHead() {
  return (
    <CourseHeader
      trail={[{ label: "שלב 1 · חינם" }, { label: "חשבונאות מאפס" }]}
      title={
        <>
          חשבונאות בסיסית <span className="text-gradient">מאפס</span>
        </>
      }
      lessons={BASICS_LESSONS}
    >
      <p>שיעורים אינטראקטיביים, צעד אחר צעד. בכל שיעור: מושגים עם דוגמאות חיות, ואחריהם תרגול עם משוב מיידי — פקודות יומן, שאלות אמריקאיות ושאלות חישוב. ובסוף, טיפים זהב.</p>
    </CourseHeader>
  );
}
