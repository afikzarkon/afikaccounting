import { Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { InventoryReference } from "@/components/basics/inventory-exam";
import { ExamsSection } from "@/components/pricing/exams-teaser";
import { GatedCoursePath } from "@/components/pricing/gated-course";
import { LegacyHashRedirect } from "@/components/study-mode/course";
import { CourseHeader } from "@/components/study-mode/course-header";
import { Container } from "@/components/ui/primitives";
import { INVENTORY_LEGACY_CHAPTERS, INVENTORY_LESSONS, inventoryLegacyHref } from "@/lib/study/inventory";
import { visibleLessons } from "@/lib/visibility/server";

export const metadata: Metadata = {
  title: "מלאי (IAS 2) — קורס אינטראקטיבי ומחשבון",
  description:
    "מלאי מאפס ועד רמת מבחן, ב-12 שיעורים: רישום תקופתי ותמידי, IAS 2 ומה נספר כמלאי, עלות והנחות, FIFO וממוצע משוקלל, שווי מימוש נטו, חילוץ נעלמים, שריפה וביטוח ושתי שאלות ברמת מבחן — עם תרגול בכל שיעור ומחשבון שמראה את כל הדרך.",
};

// The former long page's chapter anchors, and where each lands now.
const REDIRECTS = Object.fromEntries(INVENTORY_LEGACY_CHAPTERS.map((id) => [id, inventoryLegacyHref(id) ?? ""]));

/**
 * The inventory course: six interactive lessons, each with its concept
 * screens and a practice section by kind of question; progress on top, and
 * the course's reference (summary sheet, traps, true or false, practice
 * questions) at the bottom.
 */
export default async function InventoryPage() {
  return (
    <div className="relative">
      <LegacyHashRedirect redirects={REDIRECTS} />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <CourseHeader
          trail={[{ label: "שלב 2 · קורסים מתקדמים" }, { label: "מלאי (IAS 2)" }]}
          title={
            <>
              מלאי מאפס ועד מבחן
            </>
          }
          lessons={await visibleLessons(INVENTORY_LESSONS)}
        >
          <p>
            שיעורים אינטראקטיביים, צעד אחר צעד. בכל שיעור: מושגים עם דוגמאות חיות, ואחריהם תרגול עם משוב מיידי — פקודות יומן, שאלות אמריקאיות ושאלות חישוב. ובסוף, מחשבון שמראה
            את כל הדרך.
          </p>
          <p className="text-sm">
            מה צריך לדעת מראש: פקודת יומן בסיסית — חובה וזכות.{" "}
            <Link href="/basics" className="font-medium text-accent hover:underline">
              לחשבונאות מאפס
            </Link>
          </p>
        </CourseHeader>

        <div className="mt-8">
          <GatedCoursePath lessons={await visibleLessons(INVENTORY_LESSONS)} />
        </div>

        <section id="reference" aria-labelledby="reference-title" className="mt-16 scroll-mt-24">
          <h2 id="reference-title" className="flex items-center gap-2 text-[1.75rem] font-bold tracking-tight text-fg">
            <Library className="h-6 w-6 text-accent" aria-hidden /> כלי עזר
          </h2>
          <p className="mt-1 text-[15px] text-muted">כל מה שצריך לחזרה, במקום אחד: דף סיכום להדפסה, ארגז המלכודות, בנק נכון / לא נכון, ושאלות ברמת בחינה לתרגול עצמי.</p>
          <div className="mt-4">
            <InventoryReference />
          </div>
        </section>

        <ExamsSection topic="inventory" />
      </Container>
    </div>
  );
}
