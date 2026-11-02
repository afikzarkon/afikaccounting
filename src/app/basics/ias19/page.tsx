import { Link2, ListChecks, Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MindMap } from "@/components/basics/ias19-ui";
import { ExamsSection } from "@/components/pricing/exams-teaser";
import { GatedCoursePath } from "@/components/pricing/gated-course";
import { CourseHeader } from "@/components/study-mode/course-header";
import { Container } from "@/components/ui/primitives";
import { screenHref } from "@/lib/study/basics";
import { IAS19_LESSONS } from "@/lib/study/ias19";
import { lessonList, lessonsRef, prereqLine, STAGES } from "@/lib/study/ias19/shared";
import { SKILLS } from "@/lib/study/ias19/skills";
import { visibleLessons } from "@/lib/visibility/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "הטבות עובד (IAS 19) — קורס אינטראקטיבי",
  description:
    "הטבות עובד מהבסיס ועד שאלת מבחן, שיעור אחר שיעור: ארבעת סוגי ההטבות, ערך נוכחי ומעגל התחייבות, הטבות לזמן קצר, הפקדה מוגדרת והטבה מוגדרת — מדידה, שיוך לשנים, שינוי תנאים, נכסי תכנית והצגה — עם תרגול בכל שיעור.",
};

/**
 * The employee-benefits course: its lessons on the path, the mind map of the
 * whole course, the four stages with what each lesson needs, and the eleven
 * skills every question is solved with.
 */
export default async function Ias19Page() {
  const lessons = await visibleLessons(IAS19_LESSONS);
  const titles = Object.fromEntries(IAS19_LESSONS.map((m) => [m.slug, m.title]));
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <CourseHeader
          trail={[{ label: "שלב 2 · קורסים מתקדמים" }, { label: "הטבות עובד (IAS 19)" }]}
          title={
            <>
              הטבות עובד <span className="text-gradient">מהמפה ועד המבחן</span>
            </>
          }
          lessons={lessons}
        >
          <p>
            שיעורים אינטראקטיביים, צעד אחר צעד: קודם מיון של ארבעת סוגי ההטבות וארגז כלים קטן, אחר כך ההטבות הפשוטות, ואז הלב של הקורס — הטבה מוגדרת, משיעור לשיעור, עד הצגה
            בדוחות. בכל שיעור: רעיון מהחיים, כלל אחד, דוגמה פתורה, תרגול עם משוב מיידי ומלכודות.
          </p>
          <p className="text-sm">
            מה צריך לדעת מראש: הוצאה מול השקעה, ופקודת יומן בסיסית — חובה וזכות.{" "}
            <Link href={screenHref("expense")} className="font-medium text-accent hover:underline">
              לשיעור ״הוצאה מול השקעה״
            </Link>
          </p>
        </CourseHeader>

        <div className="mt-8">
          <GatedCoursePath lessons={lessons} />
        </div>

        <section aria-labelledby="ias19-map-title" className="mt-14">
          <h2 id="ias19-map-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <MapIcon className="h-6 w-6 text-accent" aria-hidden /> מפת החשיבה
          </h2>
          <p className="mt-1 text-[15px] text-muted">כל הקורס בעץ אחד: ארבעת סוגי ההטבות והכלים, וליד כל נושא — השיעור שבו לומדים אותו.</p>
          <MindMap links className="mt-4" />
        </section>

        <section aria-labelledby="ias19-stages-title" className="mt-14">
          <h2 id="ias19-stages-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <Link2 className="h-6 w-6 text-accent" aria-hidden /> ארבעה שלבים, ומה כל שיעור צריך
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            {lessonsRef("ias19-measure", "ias19-present")} הם שרשרת אחת: כל שיעור נשען על הקודם, ולכן לא מדלגים בה. {lessonList(["ias19-short"])} נדרש רק לשאלות המבחן, ולכן
            אפשר להקדים או לדחות אותו.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {STAGES.map((s) => (
              <div key={s.n} className={cn("card p-4", s.core && "ring-2 ring-accent/50")}>
                <p className="font-bold text-fg">
                  שלב {s.n} · {s.title}
                  {s.core && <span className="ms-2 rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-fg">שרשרת אחת</span>}
                </p>
                <ul className="mt-2 space-y-1.5 text-[14px]">
                  {s.lessons.map((slug) => (
                    <li key={slug}>
                      <span className="font-semibold text-fg">{lessonList([slug])}: </span>
                      <span className="text-fg/90">{titles[slug]}</span>
                      <span className="block text-[13px] text-muted">נדרש: {prereqLine(slug)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ias19-skills-title" className="mt-14">
          <h2 id="ias19-skills-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <ListChecks className="h-6 w-6 text-accent" aria-hidden /> מה צריך לדעת: {SKILLS.length} כישורים
          </h2>
          <p className="mt-1 text-[15px] text-muted">כל שאלה בקורס — ובמבחן — נפתרת באותם כישורים בלבד. לכל אחד: מה עושים בפועל, ובאיזה שיעור לומדים אותו.</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="bg-surface-2/70 text-xs text-muted">
                  <th className="px-3 py-2 text-start font-medium">#</th>
                  <th className="px-3 py-2 text-start font-medium">כישור</th>
                  <th className="px-3 py-2 text-start font-medium">מה עושים בפועל</th>
                  <th className="px-3 py-2 text-start font-medium">שיעור</th>
                </tr>
              </thead>
              <tbody>
                {SKILLS.map((s, i) => (
                  <tr key={s.skill} className="border-t border-line/70">
                    <td className="num px-3 py-2 text-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-fg">{s.skill}</td>
                    <td className="px-3 py-2 text-fg/90">{s.does}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-fg">{lessonList(s.lessons)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ExamsSection topic="ias19" />
      </Container>
    </div>
  );
}
