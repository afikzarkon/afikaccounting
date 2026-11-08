import { BookA, ChevronDown, Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import { Glossary } from "@/components/basics/glossary";
import { Tree } from "@/components/basics/ias19-visuals";
import { GatedCoursePath } from "@/components/pricing/gated-course";
import { CourseHeader } from "@/components/study-mode/course-header";
import { Container } from "@/components/ui/primitives";
import { CONSOLIDATED_LESSONS } from "@/lib/study/consolidated";
import { CONSOLIDATED_GLOSSARY } from "@/lib/study/consolidated/glossary";
import { visibleLessons } from "@/lib/visibility/server";

export const metadata: Metadata = {
  title: "דוחות מאוחדים וצירופי עסקים (IFRS 3, IFRS 10) — קורס אינטראקטיבי",
  description: "צירופי עסקים ודוחות מאוחדים, שיעור אחר שיעור: מתי יש שליטה, שיטת הרכישה, טכניקת האיחוד, עסקאות בין חברות ושינויים בהחזקה, עם תרגול ופתרון מלא.",
};

/** The consolidated statements course: its lessons on the path, the map of the topic, and a short glossary. */
export default async function ConsolidatedPage() {
  const lessons = await visibleLessons(CONSOLIDATED_LESSONS);
  return (
    <div className="relative">
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <CourseHeader trail={[{ label: "שלב 2 · קורסים מתקדמים" }, { label: "דוחות מאוחדים וצירופי עסקים" }]} title="דוחות מאוחדים וצירופי עסקים, מאפס ועד שאלת מבחן" lessons={lessons}>
          <p>מתחילים מהשאלה למה בכלל מאחדים, וממשיכים שיעור אחרי שיעור: מתי יש שליטה, איך רושמים רכישה, ואיך בונים דוח מאוחד עד לשאלה שלמה ברמת מבחן.</p>
          <p className="mt-2">כל שיעור הוא מסלול קצר: סיפור קטן שפותח את הנושא, תרשים לכל רעיון, דוגמה שפותרים יחד, ותרגילים עם פתרון מלא.</p>
        </CourseHeader>

        <div className="mt-8">
          <GatedCoursePath lessons={lessons} />
        </div>

        <section aria-labelledby="consolidated-map-title" className="mt-14">
          <h2 id="consolidated-map-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <MapIcon className="h-6 w-6 text-accent" aria-hidden /> המפה של הנושא
          </h2>
          <p className="mt-1 mb-4 text-[15px] text-muted">שתי שאלות מחזיקות את הכול: האם יש שליטה, ואיך מחברים את הדוחות.</p>
          <Tree
            label="מפת הקורס: שליטה, שיטת הרכישה, טכניקת האיחוד, עסקאות בין החברות, שינויים ומכשירים, ומקרים מיוחדים"
            root="דוחות מאוחדים וצירופי עסקים"
            groups={[
              { title: "מתי מאחדים", examples: "צירוף עסקים, ומבחני השליטה", tone: 1 },
              { title: "שיטת הרכישה", examples: "רוכש, מועד, עודפי עלות, תמורה, זשמ״ש ומוניטין", tone: 3 },
              { title: "טכניקת האיחוד", examples: "דף העבודה, מדיניות אחידה, ירידת ערך ומועדי דיווח", tone: 4 },
              { title: "עסקאות בתוך הקבוצה", examples: "יתרות, מלאי, רכוש קבוע, חכירות ואג״ח", tone: 2 },
              { title: "שינויים ומכשירים", examples: "איבוד שליטה, שינוי בשיעור ההחזקה, אופציות ומניות אוצר", tone: "danger" },
              { title: "מקרים מיוחדים", examples: "החזקות בשרשרת, רכישה במהופך, רכישת פעילות וישות השקעה", tone: 1 },
            ]}
          />
        </section>

        <section aria-labelledby="consolidated-glossary-title" className="mt-14">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <h2 id="consolidated-glossary-title" className="flex flex-1 items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
                <BookA className="h-6 w-6 text-accent" aria-hidden /> מילון קצר, במילים פשוטות
              </h2>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-1 text-[15px] text-muted">{CONSOLIDATED_GLOSSARY.length} מונחים שחוזרים בקורס, כל אחד בשורה אחת.</p>
            <div className="mt-4">
              <Glossary terms={CONSOLIDATED_GLOSSARY} placeholder="למשל: זשמ״ש, דוחות נפרדים" />
            </div>
          </details>
        </section>
      </Container>
    </div>
  );
}
