import { BookA, ChevronDown, Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import { Glossary } from "@/components/basics/glossary";
import { Tree } from "@/components/basics/ias19-visuals";
import { GatedCoursePath } from "@/components/pricing/gated-course";
import { CourseHeader } from "@/components/study-mode/course-header";
import { Container } from "@/components/ui/primitives";
import { IFRS16_LESSONS } from "@/lib/study/ifrs16";
import { IFRS16_GLOSSARY } from "@/lib/study/ifrs16/glossary";
import { visibleLessons } from "@/lib/visibility/server";

export const metadata: Metadata = {
  title: "חכירות (IFRS 16) — קורס אינטראקטיבי",
  description: "חכירות מהבסיס ועד שאלת מבחן, שיעור אחר שיעור: מתי חוזה הוא חכירה, חשבונאות החוכר והמחכיר, תיקוני חכירה, חכירת משנה ומכירה וחכירה בחזרה, עם תרגול ופתרון מלא.",
};

/** The leases course: its lessons on the path, the map of the whole standard, and a short glossary. */
export default async function Ifrs16Page() {
  const lessons = await visibleLessons(IFRS16_LESSONS);
  return (
    <div className="relative">
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <CourseHeader trail={[{ label: "שלב 2 · קורסים מתקדמים" }, { label: "חכירות (IFRS 16)" }]} title="IFRS 16: חכירות, מאפס ועד שאלת מבחן" lessons={lessons}>
          <p>לא צריך לדעת שום דבר על חכירות כדי להתחיל. בשיעור הראשון לומדים לזהות אם חוזה הוא בכלל חכירה. משם בונים, שיעור אחרי שיעור, את החשבונאות של החוכר ושל המחכיר, ועד שאלה שלמה ברמת מבחן.</p>
          <p className="mt-2">כל שיעור הוא מסלול קצר: סיפור קטן שפותח את הנושא, תרשים לכל רעיון, דוגמה שפותרים יחד, ותרגילים עם פתרון מלא.</p>
        </CourseHeader>

        <div className="mt-8">
          <GatedCoursePath lessons={lessons} />
        </div>

        <section aria-labelledby="ifrs16-map-title" className="mt-14">
          <h2 id="ifrs16-map-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <MapIcon className="h-6 w-6 text-accent" aria-hidden /> המפה של התקן
          </h2>
          <p className="mt-1 mb-4 text-[15px] text-muted">החוכר עובד במודל אחד, המחכיר בשניים.</p>
          <Tree
            label="מפת התקן: זיהוי חכירה ותקופתה; חוכר עם מודל אחד; מחכיר עם שני מודלים, תפעולית ומימונית; ומקרים מיוחדים"
            root="IFRS 16: חכירות"
            groups={[
              { title: "קודם כול: האם יש חכירה, ולכמה זמן", examples: "שלושה מבחנים, רכיבים, תקופת החכירה", tone: 1 },
              { title: "חוכר: מודל אחד", examples: "נכס והתחייבות, פחת וריבית, הערכה מחדש ותיקונים", tone: 3 },
              { title: "מחכיר: שני מודלים", examples: "תפעולית: הנכס נשאר אצלו. מימונית: במקום הנכס יש השקעה נטו", tone: 4 },
              { title: "מקרים מיוחדים", examples: "קרקע ומבנה, חכירת משנה, מכירה וחכירה בחזרה", tone: "danger" },
            ]}
          />
        </section>

        <section aria-labelledby="ifrs16-glossary-title" className="mt-14">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <h2 id="ifrs16-glossary-title" className="flex flex-1 items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
                <BookA className="h-6 w-6 text-accent" aria-hidden /> מילון קצר, במילים פשוטות
              </h2>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-1 text-[15px] text-muted">{IFRS16_GLOSSARY.length} מונחים שחוזרים בקורס, כל אחד בשורה אחת.</p>
            <div className="mt-4">
              <Glossary terms={IFRS16_GLOSSARY} placeholder="למשל: נכס מזוהה, מחכיר" />
            </div>
          </details>
        </section>
      </Container>
    </div>
  );
}
