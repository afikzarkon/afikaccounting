import { ArrowLeft, Calculator, GraduationCap, ListOrdered, Plane } from "lucide-react";
import type { Metadata } from "next";
import { GuideTabs } from "@/components/guide/guide-tabs";
import { ExamTipsSection } from "@/components/learn/exam-tips";
import { FundamentalsSection } from "@/components/learn/fundamentals";
import { MethodologySection } from "@/components/learn/methodology";
import { DepreciationSimulator } from "@/components/learn/simulator";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "מרכז הלמידה והסימולציות ל-IAS 16",
  description:
    "אלגוריתם לפתרון שאלות IAS 16 במבחן, יסודות הרכוש הקבוע בשפה פשוטה, סימולטור פחת לכל השיטות כולל פיצול באמצע שנה, וצ׳ק-ליסט לבדיקה עצמית.",
};

export default function Ias16LabPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-12 sm:pt-14">
        <p className="text-xs font-semibold text-accent">AfikAccounting · IAS 16 רכוש קבוע</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          מרכז הלמידה <span className="text-gradient">והסימולציות</span> ל-IAS 16
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            מהשאלה במבחן ועד פקודת היומן: אלגוריתם פתרון בחמישה שלבים, המושגים בגובה העיניים, סימולטור לכל שיטות הפחת עם לוח נוסחאות
            צמוד — וצ׳ק-ליסט שמוודא שלא פספסתם כלום.
          </p>
          <div className="no-print flex flex-wrap gap-2">
            <ButtonLink href="/ias16-guide" variant="ghost">
              מדריך IAS 16 המלא
            </ButtonLink>
            <ButtonLink href="/engine?calc=ias-16-property-plant-equipment" variant="secondary">
              פתרון תרחיש במחשבון <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8">
          <GuideTabs
            tabs={[
              {
                id: "method",
                label: "איך לגשת לשאלה",
                blurb: "אלגוריתם פתרון ב-5 שלבים",
                icon: <ListOrdered className="h-4 w-4" />,
                panel: <MethodologySection />,
              },
              {
                id: "basics",
                label: "יסודות ועקרונות",
                blurb: "מושגים, ורכיבי מטוס",
                icon: <Plane className="h-4 w-4" />,
                panel: <FundamentalsSection />,
              },
              {
                id: "simulator",
                label: "סימולטור פחת",
                blurb: "4 שיטות · לוח נוסחאות צמוד",
                icon: <Calculator className="h-4 w-4" />,
                panel: <DepreciationSimulator />,
              },
              {
                id: "exam",
                label: "טיפים למבחן",
                blurb: "טעויות נפוצות · צ׳ק-ליסט",
                icon: <GraduationCap className="h-4 w-4" />,
                panel: <ExamTipsSection />,
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
