import { ArrowLeft, Calculator } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExamsSection } from "@/components/pricing/exams-teaser";
import { GatedCoursePath } from "@/components/pricing/gated-course";
import { LegacyHashRedirect } from "@/components/study-mode/course";
import { CourseHeader } from "@/components/study-mode/course-header";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { screenHref } from "@/lib/study/basics";
import { IAS16_LEGACY_CHAPTERS, IAS16_LESSONS, ias16LegacyHref } from "@/lib/study/ias16";
import { visibleLessons } from "@/lib/visibility/server";

export const metadata: Metadata = {
  title: "רכוש קבוע (IAS 16) — קורס אינטראקטיבי ומחשבונים",
  description:
    "רכוש קבוע מהבסיס ועד שאלת מבחן, שיעור אחר שיעור: מהו רכוש קבוע ומושגי יסוד, שיטות הפחת ושאלה מלאה בתשעה שלבים, שיפוצים, החלפת נכסים ומודל הערכה מחדש — עם תרגול בכל שיעור ומחשבון לכל סוגיה.",
};

// The former long page's anchors, and where each lands now.
const REDIRECTS = Object.fromEntries(IAS16_LEGACY_CHAPTERS.map((id) => [id, ias16LegacyHref(id) ?? ""]));

/**
 * The fixed-assets course: five interactive lessons, each with its concept
 * screens (the sections of the former long page, each under its principle)
 * and a practice section; progress on top, and the full calculator at the bottom.
 */
export default async function Ias16Page() {
  return (
    <div className="relative">
      <LegacyHashRedirect redirects={REDIRECTS} />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <CourseHeader
          trail={[{ label: "שלב 2 · קורסים מתקדמים" }, { label: "רכוש קבוע (IAS 16)" }]}
          title={
            <>
              רכוש קבוע מהקל לקשה
            </>
          }
          lessons={await visibleLessons(IAS16_LESSONS)}
        >
          <p>
            שיעורים אינטראקטיביים, צעד אחר צעד: מהו רכוש קבוע ומושגי היסוד, ואז הסוגיות מהפשוטה למורכבת — שיטות הפחת, שאלה מלאה, שיפוצים, החלפת נכסים והערכה מחדש. בכל
            שיעור: דרכי פעולה, דוגמאות מלאות ומחשבון, ואחריהם תרגול עם משוב מיידי.
          </p>
          <p className="text-sm">
            מה צריך לדעת מראש: הוצאה מול השקעה, ופקודת יומן בסיסית — חובה וזכות.{" "}
            <Link href={screenHref("expense")} className="font-medium text-accent hover:underline">
              לשיעור ״הוצאה מול השקעה״
            </Link>
          </p>
        </CourseHeader>

        <div className="mt-8">
          <GatedCoursePath lessons={await visibleLessons(IAS16_LESSONS)} />
        </div>

        <section id="full-calculator" aria-labelledby="full-calculator-h" className="mt-16 scroll-mt-24">
          <div className="card flex flex-wrap items-center gap-4 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Calculator className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="full-calculator-h" className="text-lg font-bold text-fg">
                שאלה שלמה? המחשבון המלא פותר אותה
              </h2>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">
                מחשבון אחד לכל סוגי השאלות: עלות, כל שיטות הפחת, שיפוץ, הערכה מחדש והחלפה — ואם חסר נתון, מסמנים אותו X. הפתרון מראה את רישום הנתונים, מציאת הנעלם, כל
                שלבי החישוב, פקודות היומן, מאזן ורווח והפסד לכל שנה, והמעבר משנה לשנה.
              </p>
            </div>
            <ButtonLink href="/engine?calc=ias-16-property-plant-equipment">
              למחשבון <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </section>

        <ExamsSection topic="ias16" />
      </Container>
    </div>
  );
}
